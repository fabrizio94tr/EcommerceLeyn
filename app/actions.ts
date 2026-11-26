'use server';
import { randomBytes } from 'crypto';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { quote, type CartLine } from '@/lib/pricing';
import { sendEmail, tpl, adminEmail } from '@/lib/email';
import { stripe } from '@/lib/stripe';
import { paypalCreateOrder } from '@/lib/paypal';
import { SITE_URL } from '@/lib/env';

export type ActionState = { ok?: boolean; error?: string; message?: string } | null;

const emailSchema = z.string().trim().toLowerCase().email('Inserisci un indirizzo email valido.');

// Limite semplice contro gli invii ripetuti dallo stesso indirizzo IP (per istanza serverless).
const hits = new Map<string, number[]>();
async function rateLimit(key: string, max = 5, windowMs = 10 * 60_000) {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const k = `${key}:${ip}`, now = Date.now();
  const arr = (hits.get(k) || []).filter((t) => now - t < windowMs);
  arr.push(now); hits.set(k, arr);
  return arr.length <= max;
}

/* ───────── newsletter + coupon di benvenuto ───────── */
export async function subscribeNewsletter(_: ActionState, fd: FormData): Promise<ActionState> {
  if (fd.get('website')) return { ok: true, message: 'Grazie!' }; // campo trappola anti-bot
  const email = emailSchema.safeParse(fd.get('email'));
  if (!email.success) return { error: email.error.issues[0].message };
  if (fd.get('consent') !== 'on') return { error: 'Per iscriverti serve il consenso a ricevere le nostre email.' };
  if (!(await rateLimit('news'))) return { error: 'Troppi tentativi, riprova tra qualche minuto.' };
  const sb = supabaseAdmin();
  const { data: ex } = await sb.from('newsletter_subscribers').select('id, unsubscribed_at').eq('email', email.data).maybeSingle();
  if (ex && !ex.unsubscribed_at) return { ok: true, message: 'Sei già iscritta: controlla la tua email per il codice di benvenuto.' };
  if (ex) { await sb.from('newsletter_subscribers').update({ unsubscribed_at: null, consent_at: new Date().toISOString() }).eq('id', ex.id); return { ok: true, message: 'Bentornata! Ti abbiamo iscritta di nuovo.' }; }

  const { data: s } = await sb.from('settings').select('welcome_discount_percent').eq('id', 1).single();
  const pct = s?.welcome_discount_percent ?? 10;
  const code = `BENVENUTA-${randomBytes(3).toString('hex').toUpperCase()}`;
  await sb.from('coupons').insert({ code, kind: 'percent', value: pct, max_uses: 1, once_per_customer: true, is_welcome: true });
  await sb.from('newsletter_subscribers').insert({ email: email.data, welcome_coupon_code: code });
  await sendEmail(email.data, `Il tuo ${pct}% di benvenuto · Alana Beauty`, tpl.welcome(code, pct));
  return { ok: true, message: `Fatto! Ti abbiamo inviato via email il codice per il ${pct}% di sconto.` };
}

/* ───────── lista d'attesa ───────── */
export async function joinWaitlist(_: ActionState, fd: FormData): Promise<ActionState> {
  const email = emailSchema.safeParse(fd.get('email'));
  if (!email.success) return { error: email.error.issues[0].message };
  if (fd.get('consent') !== 'on') return { error: 'Serve il tuo consenso per inviarti l\'avviso.' };
  const variantId = z.string().uuid().safeParse(fd.get('variantId'));
  if (!variantId.success) return { error: 'Seleziona una variante.' };
  if (!(await rateLimit('wait', 10))) return { error: 'Troppi tentativi, riprova tra qualche minuto.' };
  const sb = supabaseAdmin();
  const { error } = await sb.from('waitlist').upsert({ variant_id: variantId.data, email: email.data, notified_at: null, consent_at: new Date().toISOString() }, { onConflict: 'variant_id,email' });
  if (error) return { error: 'Non siamo riuscite a salvare la richiesta, riprova.' };
  return { ok: true, message: 'Perfetto: ti scriviamo appena torna disponibile.' };
}

/* ───────── preferiti ───────── */
export async function toggleWishlist(productId: string, path: string) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/accedi?next=${encodeURIComponent(path)}`);
  const { data } = await sb.from('wishlist').select('product_id').eq('user_id', user.id).eq('product_id', productId).maybeSingle();
  if (data) await sb.from('wishlist').delete().eq('user_id', user.id).eq('product_id', productId);
  else await sb.from('wishlist').insert({ user_id: user.id, product_id: productId });
  revalidatePath(path);
  return !data;
}

/* ───────── carrello: prezzi sempre dal server ───────── */
export async function quoteCart(lines: CartLine[], coupon?: string | null, email?: string | null) {
  const q = await quote(lines, coupon, email);
  return {
    lines: q.lines.map(({ unitCostCents: _cost, ...l }) => l), problems: q.problems, subtotal: q.subtotal, discount: q.discount, shipping: q.shipping, total: q.total,
    couponCode: q.coupon?.code ?? null, couponError: q.couponError,
    freeThreshold: q.settings.free_shipping_threshold_cents, flat: q.settings.shipping_flat_cents
  };
}

/* ───────── checkout ───────── */
const checkoutSchema = z.object({
  email: emailSchema,
  first_name: z.string().trim().min(1, 'Inserisci il nome.').max(60),
  last_name: z.string().trim().min(1, 'Inserisci il cognome.').max(60),
  line1: z.string().trim().min(4, 'Inserisci l\'indirizzo.').max(160),
  line2: z.string().trim().max(160).optional().default(''),
  postal_code: z.string().trim().regex(/^\d{5}$/, 'Il CAP deve avere 5 cifre.'),
  city: z.string().trim().min(2, 'Inserisci la città.').max(80),
  province: z.string().trim().max(2).optional().default(''),
  phone: z.string().trim().min(6, 'Serve un telefono per il corriere.').max(30),
  payment: z.enum(['stripe', 'paypal']),
  coupon: z.string().trim().max(40).optional().default(''),
  terms: z.literal('on', { error: 'Devi accettare le condizioni di vendita.' }),
  newsletter: z.string().optional(),
  save_address: z.string().optional(),
  cart: z.string()
});

export async function startCheckout(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = checkoutSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const f = { ...parsed.data, full_name: `${parsed.data.first_name} ${parsed.data.last_name}` };
  let cart: CartLine[];
  try { cart = z.array(z.object({ variantId: z.string().uuid(), qty: z.number().int().min(1).max(20) })).max(50).parse(JSON.parse(f.cart)); }
  catch { return { error: 'Il carrello non è valido, ricarica la pagina.' }; }
  if (!cart.length) return { error: 'Il carrello è vuoto.' };

  const q = await quote(cart, f.coupon || null, f.email);
  if (!q.lines.length) return { error: q.problems[0] || 'I prodotti nel carrello non sono più disponibili.' };
  if (q.problems.length) return { error: q.problems.join(' ') + ' Controlla il carrello prima di pagare.' };
  if (f.coupon && q.couponError) return { error: q.couponError };

  const sbUser = await supabaseServer();
  const { data: { user } } = await sbUser.auth.getUser();
  const sb = supabaseAdmin();
  const address = { full_name: f.full_name, line1: f.line1, line2: f.line2 || null, postal_code: f.postal_code, city: f.city, province: f.province.toUpperCase() || null, phone: f.phone };

  const { data: order, error } = await sb.from('orders').insert({
    user_id: user?.id ?? null, email: f.email, status: 'pending', payment_provider: f.payment,
    subtotal_cents: q.subtotal, discount_cents: q.discount, shipping_cents: q.shipping, total_cents: q.total,
    coupon_code: q.coupon?.code ?? null, shipping_address: address, newsletter_optin: f.newsletter === 'on'
  }).select('id, number, access_token').single();
  if (error || !order) return { error: 'Non siamo riuscite a creare l\'ordine, riprova.' };
  await sb.from('order_items').insert(q.lines.map((l) => ({
    order_id: order.id, product_id: l.productId, variant_id: l.variantId, name: l.name, variant_label: l.variantLabel, image_url: l.image,
    macro: l.macro, unit_price_cents: l.unitCents, unit_cost_cents: l.unitCostCents, qty: l.qty
  })));
  if (user && f.save_address === 'on') {
    const { count } = await sb.from('addresses').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
    if (!count) await sb.from('addresses').insert({ ...address, user_id: user.id, label: 'Casa', is_default: true });
  }
  if (f.newsletter === 'on') {
    const nf = new FormData(); nf.set('email', f.email); nf.set('consent', 'on');
    await subscribeNewsletter(null, nf).catch(() => null);
  }

  const back = `${SITE_URL}/ordine/${order.id}?t=${order.access_token}`;
  let url: string;
  try {
    if (f.payment === 'stripe') {
      const items = q.lines.map((l) => ({ quantity: l.qty, price_data: { currency: 'eur', unit_amount: l.unitCents, product_data: { name: l.name, description: l.variantLabel || undefined, images: l.image ? [l.image] : undefined } } }));
      const discounts = q.discount > 0 ? [{ coupon: (await stripe().coupons.create({ amount_off: q.discount, currency: 'eur', duration: 'once', name: q.coupon?.code ?? 'Sconto', max_redemptions: 1 })).id }] : undefined;
      const session = await stripe().checkout.sessions.create({
        mode: 'payment', locale: 'it', customer_email: f.email, client_reference_id: order.id, metadata: { order_id: order.id, number: order.number },
        payment_intent_data: { metadata: { order_id: order.id, number: order.number }, description: `Ordine ${order.number}` },
        line_items: items, discounts,
        shipping_options: [{ shipping_rate_data: { type: 'fixed_amount', display_name: q.shipping ? 'Corriere espresso' : 'Spedizione gratuita', fixed_amount: { amount: q.shipping, currency: 'eur' } } }],
        success_url: `${back}&session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${SITE_URL}/checkout?annullato=1`
      });
      await sb.from('orders').update({ payment_ref: session.id }).eq('id', order.id);
      url = session.url!;
    } else {
      const pp = await paypalCreateOrder({ id: order.id, number: order.number, total: q.total, returnUrl: `${SITE_URL}/api/paypal/return?order=${order.id}`, cancelUrl: `${SITE_URL}/checkout?annullato=1` });
      await sb.from('orders').update({ payment_ref: pp.paypalId }).eq('id', order.id);
      url = pp.approveUrl;
    }
  } catch (e) {
    console.error('Checkout', e);
    await sb.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
    return { error: 'Il servizio di pagamento non risponde. Riprova tra poco o scegli un altro metodo.' };
  }
  redirect(url);
}

/* ───────── area cliente ───────── */
export async function signOut() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect('/');
}

const addressSchema = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  label: z.string().trim().max(40).optional().default(''),
  full_name: z.string().trim().min(3, 'Inserisci nome e cognome.'),
  line1: z.string().trim().min(4, 'Inserisci l\'indirizzo.'),
  line2: z.string().trim().optional().default(''),
  postal_code: z.string().trim().regex(/^\d{5}$/, 'Il CAP deve avere 5 cifre.'),
  city: z.string().trim().min(2, 'Inserisci la città.'),
  province: z.string().trim().max(2).optional().default(''),
  phone: z.string().trim().optional().default(''),
  is_default: z.string().optional()
});
export async function saveAddress(_: ActionState, fd: FormData): Promise<ActionState> {
  const p = addressSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: 'Accedi di nuovo.' };
  const { id, is_default, ...rest } = p.data;
  const row = { ...rest, province: rest.province.toUpperCase() || null, line2: rest.line2 || null, phone: rest.phone || null, label: rest.label || null, user_id: user.id, is_default: is_default === 'on' };
  if (row.is_default) await sb.from('addresses').update({ is_default: false }).eq('user_id', user.id);
  const res = id ? await sb.from('addresses').update(row).eq('id', id).eq('user_id', user.id) : await sb.from('addresses').insert(row);
  if (res.error) return { error: 'Non siamo riuscite a salvare l\'indirizzo.' };
  revalidatePath('/account');
  return { ok: true, message: 'Indirizzo salvato.' };
}
export async function deleteAddress(id: string) {
  const sb = await supabaseServer();
  await sb.from('addresses').delete().eq('id', id);
  revalidatePath('/account');
}

export async function updateProfile(_: ActionState, fd: FormData): Promise<ActionState> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: 'Accedi di nuovo.' };
  const full_name = String(fd.get('full_name') || '').trim().slice(0, 120);
  const phone = String(fd.get('phone') || '').trim().slice(0, 30);
  await sb.from('profiles').update({ full_name, phone }).eq('id', user.id);
  revalidatePath('/account');
  return { ok: true, message: 'Dati aggiornati.' };
}

const returnSchema = z.object({ order_id: z.string().uuid(), type: z.enum(['return', 'exchange']), reason: z.string().trim().min(5, 'Scrivi il motivo (almeno qualche parola).').max(600), exchange_note: z.string().trim().max(200).optional().default('') });
export async function requestReturn(_: ActionState, fd: FormData): Promise<ActionState> {
  const p = returnSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const itemIds = fd.getAll('item').map(String);
  if (!itemIds.length) return { error: 'Seleziona almeno un articolo.' };
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: 'Accedi di nuovo.' };
  const { data: order } = await sb.from('orders').select('id, number, status, shipped_at, paid_at, items:order_items(id, qty)').eq('id', p.data.order_id).eq('user_id', user.id).single();
  if (!order || !['shipped', 'delivered'].includes(order.status)) return { error: 'Puoi chiedere un reso solo per ordini già spediti.' };
  const from = new Date(order.shipped_at || order.paid_at).getTime();
  if (Date.now() - from > 30 * 86400_000) return { error: 'Sono passati più di 14 giorni dalla consegna: scrivici per valutare insieme.' };
  const items = (order.items as { id: string; qty: number }[]).filter((i) => itemIds.includes(i.id)).map((i) => ({ order_item_id: i.id, qty: i.qty }));
  const admin = supabaseAdmin();
  const { data: open } = await admin.from('returns').select('id').eq('order_id', order.id).in('status', ['requested', 'approved', 'received']).maybeSingle();
  if (open) return { error: 'C\'è già una richiesta aperta per questo ordine.' };
  const reason = p.data.type === 'exchange' && p.data.exchange_note ? `${p.data.reason} · Cambio con: ${p.data.exchange_note}` : p.data.reason;
  const { data: ret, error } = await admin.from('returns').insert({ order_id: order.id, user_id: user.id, type: p.data.type, reason, items }).select('number').single();
  if (error || !ret) return { error: 'Non siamo riuscite a inviare la richiesta.' };
  const { data: s } = await admin.from('settings').select('admin_email').eq('id', 1).single();
  await sendEmail(adminEmail(s?.admin_email), `Richiesta di reso ${ret.number}`, tpl.adminReturn(ret.number, order.number, reason));
  redirect(`/account?tab=resi&inviata=${encodeURIComponent(ret.number)}`);
}
