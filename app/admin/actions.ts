'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail, tpl } from '@/lib/email';
import { slugify, variantLabel } from '@/lib/format';
import { SITE_URL } from '@/lib/env';
import { checkLowStock } from '@/lib/orders';
import type { ActionState } from '@/app/actions';

const cents = (v: unknown) => { if (typeof v === 'number') return Math.round(v * 100); const s = String(v ?? '').replace('€', '').replace(/\s/g, ''); const t = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s; if (!t) return null; const n = Math.round(parseFloat(t) * 100); return Number.isFinite(n) ? n : null; };
const str = (v: unknown) => { const s = String(v ?? '').trim(); return s || null; };
const refresh = (...paths: string[]) => { ['/', '/abbigliamento', '/cosmetici', '/novita', '/promo', ...paths].forEach((p) => revalidatePath(p)); };

/* ───────── avvisi lista d'attesa: quando una variante torna disponibile ───────── */
async function notifyWaitlist(variantIds: string[]) {
  if (!variantIds.length) return 0;
  const sb = supabaseAdmin();
  const { data } = await sb.from('waitlist').select('id, email, variant:product_variants(id, stock, size, color_name, format, product:products(name, slug, published))').in('variant_id', variantIds).is('notified_at', null);
  let n = 0;
  for (const w of data ?? []) {
    const v = w.variant as unknown as { stock: number; size: string | null; color_name: string | null; format: string | null; product: { name: string; slug: string; published: boolean } };
    if (!v || v.stock <= 0 || !v.product?.published) continue;
    await sendEmail(w.email, `${v.product.name} è tornato disponibile`, tpl.waitlist(v.product.name, variantLabel(v), `${SITE_URL}/prodotto/${v.product.slug}`));
    await sb.from('waitlist').update({ notified_at: new Date().toISOString() }).eq('id', w.id);
    n++;
  }
  return n;
}

/* ───────── prodotti ───────── */
const variantSchema = z.object({
  id: z.string().optional(), sku: z.string().optional(), size: z.string().optional(), color_name: z.string().optional(), color_hex: z.string().optional(),
  format: z.string().optional(), price: z.string().optional(), cost: z.string().optional(), stock: z.coerce.number().int().min(0), low_stock_threshold: z.coerce.number().int().min(0)
});
const imageSchema = z.object({ url: z.string().url(), alt: z.string().optional() });

export async function saveProduct(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const sb = supabaseAdmin();
  const id = str(fd.get('id'));
  const name = str(fd.get('name'));
  const type = fd.get('type') === 'cosmetic' ? 'cosmetic' : 'clothing';
  const price = cents(fd.get('price'));
  if (!name) return { error: 'Inserisci il nome del prodotto.' };
  if (price == null || price <= 0) return { error: 'Inserisci un prezzo valido.' };
  let variants: z.infer<typeof variantSchema>[], images: z.infer<typeof imageSchema>[];
  try { variants = z.array(variantSchema).parse(JSON.parse(String(fd.get('variants') || '[]'))); images = z.array(imageSchema).parse(JSON.parse(String(fd.get('images') || '[]'))); }
  catch { return { error: 'Controlla le varianti: pezzi e scorta minima devono essere numeri.' }; }
  if (!variants.length) return { error: type === 'clothing' ? 'Aggiungi almeno una taglia/colore.' : 'Aggiungi almeno un formato.' };
  const published = fd.get('published') === 'on';
  if (published && type === 'cosmetic' && (!str(fd.get('inci')) || !str(fd.get('eu_responsible_person')))) {
    return { error: 'Per pubblicare un cosmetico servono gli ingredienti (INCI) e la persona responsabile UE presenti in etichetta.' };
  }
  const slug = slugify(str(fd.get('slug')) || name);
  const row = {
    type, name, slug, category_id: str(fd.get('category_id')), description: String(fd.get('description') || '').trim(),
    price_cents: price, compare_at_cents: cents(fd.get('compare_at')), cost_cents: cents(fd.get('cost')),
    published, featured: fd.get('featured') === 'on', is_new: fd.get('is_new') === 'on',
    material: str(fd.get('material')), fit: str(fd.get('fit')), care: str(fd.get('care')),
    inci: str(fd.get('inci')), usage: str(fd.get('usage')), warnings: str(fd.get('warnings')),
    pao_months: fd.get('pao_months') ? Number(fd.get('pao_months')) || null : null, origin_country: str(fd.get('origin_country')), eu_responsible_person: str(fd.get('eu_responsible_person')),
    seo_title: str(fd.get('seo_title')), seo_description: str(fd.get('seo_description')),
    claims: str(fd.get('claims')), routine: str(fd.get('routine'))
  };
  if (row.compare_at_cents != null && row.compare_at_cents <= price) row.compare_at_cents = null;

  const { data: saved, error } = id ? await sb.from('products').update(row).eq('id', id).select('id').single() : await sb.from('products').insert(row).select('id').single();
  if (error || !saved) return { error: error?.code === '23505' ? 'Esiste già un prodotto con questo indirizzo (slug): cambialo.' : 'Salvataggio non riuscito.' };
  const pid = saved.id as string;

  // varianti: aggiorna le esistenti, crea le nuove, elimina quelle tolte
  const { data: before } = await sb.from('product_variants').select('id, stock').eq('product_id', pid);
  const keep = new Set(variants.map((v) => v.id).filter(Boolean));
  const removed = (before ?? []).filter((b) => !keep.has(b.id)).map((b) => b.id);
  if (removed.length) await sb.from('product_variants').delete().in('id', removed);
  const restocked: string[] = [];
  for (const [i, v] of variants.entries()) {
    const vr = { product_id: pid, sku: str(v.sku), size: str(v.size), color_name: str(v.color_name), color_hex: str(v.color_hex), format: str(v.format), price_cents: cents(v.price), cost_cents: cents(v.cost), stock: v.stock, low_stock_threshold: v.low_stock_threshold, sort: i };
    if (v.id) {
      const prev = before?.find((b) => b.id === v.id);
      const { error: e } = await sb.from('product_variants').update(vr).eq('id', v.id).eq('product_id', pid);
      if (e) return { error: e.code === '23505' ? `Il codice SKU ${v.sku} è già usato da un altro prodotto.` : 'Errore nel salvare le varianti.' };
      if (prev && prev.stock <= 0 && v.stock > 0) restocked.push(v.id);
    } else {
      const { error: e } = await sb.from('product_variants').insert(vr);
      if (e) return { error: e.code === '23505' ? `Il codice SKU ${v.sku} è già usato da un altro prodotto.` : 'Errore nel salvare le varianti.' };
    }
  }
  await sb.from('product_images').delete().eq('product_id', pid);
  if (images.length) await sb.from('product_images').insert(images.map((im, i) => ({ product_id: pid, url: im.url, alt: im.alt || name, sort: i })));
  const notified = await notifyWaitlist(restocked);
  refresh(`/prodotto/${slug}`, '/admin/prodotti', '/admin/magazzino');
  if (!id) redirect(`/admin/prodotti/${pid}?creato=1`);
  return { ok: true, message: `Prodotto salvato.${notified ? ` Avvisate ${notified} clienti in lista d'attesa.` : ''}` };
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const sb = supabaseAdmin();
  const { count } = await sb.from('order_items').select('id', { count: 'exact', head: true }).eq('product_id', id);
  if (count) await sb.from('products').update({ published: false }).eq('id', id); // ha ordini: lo nascondiamo soltanto
  else await sb.from('products').delete().eq('id', id);
  refresh('/admin/prodotti');
  redirect('/admin/prodotti');
}

/* ───────── magazzino ───────── */
export async function updateStock(variantId: string, stock: number, threshold: number) {
  await requireAdmin();
  const sb = supabaseAdmin();
  const s = Math.max(0, Math.floor(stock)), t = Math.max(0, Math.floor(threshold));
  const { data: prev } = await sb.from('product_variants').select('stock').eq('id', variantId).single();
  await sb.from('product_variants').update({ stock: s, low_stock_threshold: t }).eq('id', variantId);
  const notified = prev && prev.stock <= 0 && s > 0 ? await notifyWaitlist([variantId]) : 0;
  if (s <= t) await checkLowStock([variantId]);
  refresh('/admin/magazzino');
  return { notified };
}

/** Import da CSV o Excel. Colonne riconosciute (intestazioni in italiano, maiuscole/minuscole indifferenti). */
const COLS = ['tipo', 'nome', 'slug', 'categoria', 'descrizione', 'prezzo', 'prezzo_pieno', 'costo', 'sku', 'taglia', 'colore', 'colore_hex', 'formato', 'giacenza', 'scorta_minima', 'tessuto', 'vestibilita', 'lavaggio', 'inci', 'modo_uso', 'avvertenze', 'pao_mesi', 'origine', 'responsabile_ue', 'foto', 'pubblicato', 'in_evidenza'];
export type ImportPreview = { ok?: boolean; error?: string; message?: string; rows?: number; products?: { name: string; variants: number; isNew: boolean }[]; errors?: string[] } | null;

export async function importCatalog(_: ImportPreview, fd: FormData): Promise<ImportPreview> {
  await requireAdmin();
  const file = fd.get('file');
  if (!(file instanceof File) || !file.size) return { error: 'Scegli un file CSV o Excel.' };
  if (file.size > 5 * 1024 * 1024) return { error: 'Il file è troppo grande (massimo 5 MB).' };
  const confirm = fd.get('confirm') === '1';
  let rows: Record<string, unknown>[];
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    let raw: Record<string, unknown>[];
    if (/\.csv$/i.test(file.name) || file.type === 'text/csv') {
      // CSV: testo UTF-8, separatore ; o , riconosciuto da solo, nessuna conversione automatica dei numeri
      const text = buf.toString('utf8').replace(/^\uFEFF/, '');
      raw = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true, delimiter: '' }).data;
    } else {
      const wb = XLSX.read(buf, { type: 'buffer' });
      raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: '' });
    }
    rows = raw.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [slugify(k).replace(/-/g, '_'), typeof v === 'string' ? v.trim() : v])));
  } catch { return { error: 'Non riesco a leggere il file. Usa il modello CSV o Excel.' }; }
  if (!rows.length) return { error: 'Il file è vuoto.' };
  const unknown = Object.keys(rows[0]).filter((k) => !COLS.includes(k));

  const sb = supabaseAdmin();
  const { data: cats } = await sb.from('categories').select('id, slug, name');
  const findCat = (v: unknown) => { const s = slugify(String(v || '')); return cats?.find((c) => c.slug === s || slugify(c.name) === s)?.id ?? null; };
  const groups = new Map<string, Record<string, unknown>[]>();
  const errors: string[] = [];
  rows.forEach((r, i) => {
    const name = str(r.nome);
    if (!name) { errors.push(`Riga ${i + 2}: manca il nome.`); return; }
    if (cents(r.prezzo) == null) errors.push(`Riga ${i + 2}: prezzo non valido.`);
    if (r.categoria && !findCat(r.categoria)) errors.push(`Riga ${i + 2}: categoria "${r.categoria}" non trovata.`);
    const key = slugify(str(r.slug) || name);
    groups.set(key, [...(groups.get(key) || []), r]);
  });
  const { data: existing } = await sb.from('products').select('slug').in('slug', [...groups.keys()]);
  const ex = new Set((existing ?? []).map((e) => e.slug));
  const preview = [...groups.entries()].map(([slug, rs]) => ({ name: String(rs[0].nome), variants: rs.length, isNew: !ex.has(slug) }));
  if (unknown.length) errors.push(`Colonne ignorate: ${unknown.join(', ')}.`);
  if (!confirm || errors.some((e) => e.startsWith('Riga'))) return { ok: true, rows: rows.length, products: preview, errors };

  const yes = (v: unknown) => /^(si|sì|s|x|1|true|yes)$/i.test(String(v).trim());
  let created = 0, updated = 0;
  for (const [slug, rs] of groups) {
    const r = rs[0];
    const type = /cosm/i.test(String(r.tipo)) ? 'cosmetic' : 'clothing';
    const row = {
      type, name: String(r.nome).trim(), slug, category_id: findCat(r.categoria), description: String(r.descrizione || ''),
      price_cents: cents(r.prezzo)!, compare_at_cents: cents(r.prezzo_pieno), cost_cents: cents(r.costo),
      material: str(r.tessuto), fit: str(r.vestibilita), care: str(r.lavaggio), inci: str(r.inci), usage: str(r.modo_uso), warnings: str(r.avvertenze),
      pao_months: Number(r.pao_mesi) || null, origin_country: str(r.origine), eu_responsible_person: str(r.responsabile_ue),
      published: r.pubblicato === '' ? false : yes(r.pubblicato), featured: yes(r.in_evidenza)
    };
    const { data: prod, error } = await sb.from('products').upsert(row, { onConflict: 'slug' }).select('id').single();
    if (error || !prod) { errors.push(`${row.name}: non salvato.`); continue; }
    if (ex.has(slug)) updated++; else created++;
    const { data: current } = await sb.from('product_variants').select('id, sku, size, color_name, format').eq('product_id', prod.id);
    for (const [i, v] of rs.entries()) {
      const vr = { product_id: prod.id, sku: str(v.sku), size: str(v.taglia), color_name: str(v.colore), color_hex: str(v.colore_hex), format: str(v.formato),
        price_cents: cents(v.prezzo) !== row.price_cents ? cents(v.prezzo) : null, stock: Math.max(0, Number(v.giacenza) || 0), low_stock_threshold: Number(v.scorta_minima) || 2, sort: i };
      const match = (current ?? []).find((c) => (vr.sku && c.sku === vr.sku) || (!vr.sku && c.size === vr.size && c.color_name === vr.color_name && c.format === vr.format));
      const res = match ? await sb.from('product_variants').update(vr).eq('id', match.id) : await sb.from('product_variants').insert(vr);
      if (res.error) errors.push(res.error.code === '23505' ? `${row.name}: lo SKU ${vr.sku} è già usato da un altro prodotto, variante non salvata.` : `${row.name}: variante ${[vr.color_name, vr.size, vr.format].filter(Boolean).join(' ')} non salvata.`);
    }
    const photos = rs.flatMap((x) => String(x.foto || '').split(/[\s|;]+/)).filter((u) => /^https?:\/\//.test(u));
    if (photos.length) { await sb.from('product_images').delete().eq('product_id', prod.id); await sb.from('product_images').insert([...new Set(photos)].map((url, i) => ({ product_id: prod.id, url, alt: row.name, sort: i }))); }
  }
  refresh('/admin/prodotti', '/admin/magazzino');
  return { ok: true, message: `Import completato: ${created} prodotti nuovi, ${updated} aggiornati.`, errors };
}

/* ───────── ordini ───────── */
export async function shipOrder(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(fd.get('id'));
  const tracking = str(fd.get('tracking_number'));
  if (!tracking) return { error: 'Inserisci il codice di tracking.' };
  const sb = supabaseAdmin();
  const { data: o, error } = await sb.from('orders').update({ status: 'shipped', shipped_at: new Date().toISOString(), carrier: str(fd.get('carrier')), tracking_number: tracking, tracking_url: str(fd.get('tracking_url')) })
    .eq('id', id).in('status', ['paid', 'shipped']).select('*').single();
  if (error || !o) return { error: 'Aggiornamento non riuscito.' };
  await sendEmail(o.email, `Il tuo ordine ${o.number} è partito`, tpl.shipped(o));
  revalidatePath(`/admin/ordini/${id}`); revalidatePath('/admin/ordini');
  return { ok: true, message: 'Ordine segnato come spedito: la cliente ha ricevuto l\'email con il tracking.' };
}

export async function setOrderStatus(id: string, status: 'delivered' | 'cancelled' | 'refunded' | 'paid') {
  await requireAdmin();
  const sb = supabaseAdmin();
  const { data: o } = await sb.from('orders').select('status, items:order_items(variant_id, qty)').eq('id', id).single();
  if (!o) return;
  // annullando un ordine pagato e non spedito, i pezzi tornano in magazzino
  if (status === 'cancelled' && o.status === 'paid') {
    for (const it of (o.items as { variant_id: string | null; qty: number }[])) {
      if (!it.variant_id) continue;
      const { data: v } = await sb.from('product_variants').select('stock').eq('id', it.variant_id).single();
      if (v) await sb.from('product_variants').update({ stock: v.stock + it.qty }).eq('id', it.variant_id);
    }
  }
  await sb.from('orders').update({ status }).eq('id', id);
  revalidatePath(`/admin/ordini/${id}`); revalidatePath('/admin/ordini');
}

/* ───────── resi ───────── */
const RET_LABEL: Record<string, string> = { approved: 'approvata', rejected: 'non accettata', received: 'pacco ricevuto', completed: 'chiusa' };
export async function updateReturn(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(fd.get('id')); const status = String(fd.get('status'));
  if (!RET_LABEL[status]) return { error: 'Stato non valido.' };
  const note = str(fd.get('admin_note'));
  const sb = supabaseAdmin();
  const { data: r } = await sb.from('returns').update({ status, admin_note: note }).eq('id', id).select('number, order:orders(email)').single();
  if (!r) return { error: 'Aggiornamento non riuscito.' };
  const email = (r.order as unknown as { email: string })?.email;
  await sendEmail(email, `Reso ${r.number}: ${RET_LABEL[status]}`, tpl.returnUpdate(r.number, RET_LABEL[status], note));
  revalidatePath('/admin/resi');
  return { ok: true, message: `Richiesta aggiornata, la cliente è stata avvisata via email.` };
}

/* ───────── coupon, spedizioni, banner, categorie ───────── */
export async function saveCoupon(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const code = String(fd.get('code') || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!/^[A-Z0-9-]{3,30}$/.test(code)) return { error: 'Il codice può contenere solo lettere, numeri e trattini (3-30 caratteri).' };
  const kind = fd.get('kind') === 'fixed' ? 'fixed' : 'percent';
  const value = kind === 'percent' ? Math.round(Number(fd.get('value'))) : cents(fd.get('value'));
  if (!value || value <= 0 || (kind === 'percent' && value > 90)) return { error: 'Valore dello sconto non valido.' };
  const date = (k: string, end = false) => { const v = str(fd.get(k)); return v ? new Date(`${v}T${end ? '23:59:59' : '00:00:00'}`).toISOString() : null; };
  const row = { code, kind, value, min_order_cents: cents(fd.get('min_order')) ?? 0, applies_to: String(fd.get('applies_to') || 'all'), starts_at: date('starts_at'), ends_at: date('ends_at', true),
    once_per_customer: fd.get('once_per_customer') === 'on', max_uses: Number(fd.get('max_uses')) || null, active: true };
  const id = str(fd.get('id'));
  const { error } = id ? await supabaseAdmin().from('coupons').update(row).eq('id', id) : await supabaseAdmin().from('coupons').insert(row);
  if (error) return { error: error.code === '23505' ? 'Esiste già un coupon con questo codice.' : 'Salvataggio non riuscito.' };
  revalidatePath('/admin/promozioni');
  return { ok: true, message: `Coupon ${code} salvato.` };
}
export async function toggleCoupon(id: string, active: boolean) { await requireAdmin(); await supabaseAdmin().from('coupons').update({ active }).eq('id', id); revalidatePath('/admin/promozioni'); }

export async function saveSettings(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const flat = cents(fd.get('shipping_flat')), free = cents(fd.get('free_threshold'));
  const pct = Math.round(Number(fd.get('welcome_pct')));
  if (flat == null || free == null || !(pct > 0 && pct <= 50)) return { error: 'Controlla i valori inseriti.' };
  await supabaseAdmin().from('settings').update({ shipping_flat_cents: flat, free_shipping_threshold_cents: free, welcome_discount_percent: pct, admin_email: str(fd.get('admin_email')), instagram_url: str(fd.get('instagram_url')), tiktok_url: str(fd.get('tiktok_url')), facebook_url: str(fd.get('facebook_url')), default_low_stock: Number(fd.get('default_low_stock')) || 2, updated_at: new Date().toISOString() }).eq('id', 1);
  refresh('/admin/promozioni');
  return { ok: true, message: 'Impostazioni salvate.' };
}

export async function saveBanner(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const title = str(fd.get('title')), image_url = str(fd.get('image_url'));
  if (!title || !image_url) return { error: 'Servono titolo e immagine.' };
  const d = (k: string) => { const v = str(fd.get(k)); return v ? new Date(v).toISOString() : null; };
  const row = { title, image_url, image2_url: str(fd.get('image2_url')), promo_code: str(fd.get('promo_code'))?.toUpperCase() ?? null, kicker: str(fd.get('kicker')), subtitle: str(fd.get('subtitle')), link: str(fd.get('link')), cta: str(fd.get('cta')), starts_at: d('starts_at'), ends_at: d('ends_at'), sort: Number(fd.get('sort')) || 0, active: fd.get('active') === 'on' };
  const id = str(fd.get('id'));
  const { error } = id ? await supabaseAdmin().from('banners').update(row).eq('id', id) : await supabaseAdmin().from('banners').insert(row);
  if (error) return { error: 'Salvataggio non riuscito.' };
  refresh('/admin/promozioni');
  return { ok: true, message: 'Banner salvato.' };
}
export async function deleteBanner(id: string) { await requireAdmin(); await supabaseAdmin().from('banners').delete().eq('id', id); refresh('/admin/promozioni'); }

export async function saveCategory(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = str(fd.get('name'));
  const macro = fd.get('macro') === 'cosmetici' ? 'cosmetici' : 'abbigliamento';
  if (!name) return { error: 'Inserisci il nome.' };
  const row = { name, macro, slug: slugify(str(fd.get('slug')) || name), image_url: str(fd.get('image_url')), sort: Number(fd.get('sort')) || 0 };
  const id = str(fd.get('id'));
  const { error } = id ? await supabaseAdmin().from('categories').update(row).eq('id', id) : await supabaseAdmin().from('categories').insert(row);
  if (error) return { error: error.code === '23505' ? 'Esiste già una categoria con questo nome.' : 'Salvataggio non riuscito.' };
  refresh('/admin/categorie');
  return { ok: true, message: 'Categoria salvata.' };
}
export async function deleteCategory(id: string) { await requireAdmin(); await supabaseAdmin().from('categories').delete().eq('id', id); refresh('/admin/categorie'); }

/* ───────── blog ───────── */
export async function savePost(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const title = str(fd.get('title'));
  if (!title) return { error: 'Inserisci il titolo.' };
  const published = fd.get('published') === 'on';
  const id = str(fd.get('id'));
  const sb = supabaseAdmin();
  const prev = id ? (await sb.from('blog_posts').select('published_at').eq('id', id).single()).data : null;
  const row = { title, slug: slugify(str(fd.get('slug')) || title), excerpt: str(fd.get('excerpt')), body: String(fd.get('body') || ''), cover_url: str(fd.get('cover_url')), category: str(fd.get('category')),
    seo_title: str(fd.get('seo_title')), seo_description: str(fd.get('seo_description')), published, show_home: fd.get('show_home') === 'on',
    published_at: published ? prev?.published_at || new Date().toISOString() : prev?.published_at ?? null };
  const { data, error } = id ? await sb.from('blog_posts').update(row).eq('id', id).select('id').single() : await sb.from('blog_posts').insert(row).select('id').single();
  if (error || !data) return { error: error?.code === '23505' ? 'Esiste già un articolo con questo indirizzo.' : 'Salvataggio non riuscito.' };
  refresh('/blog', `/blog/${row.slug}`, '/admin/blog');
  if (!id) redirect(`/admin/blog/${data.id}`);
  return { ok: true, message: 'Articolo salvato.' };
}
export async function deletePost(id: string) { await requireAdmin(); await supabaseAdmin().from('blog_posts').delete().eq('id', id); refresh('/blog', '/admin/blog'); redirect('/admin/blog'); }

