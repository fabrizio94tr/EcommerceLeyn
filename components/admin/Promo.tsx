'use client';
import { useActionState, useState, useTransition } from 'react';
import { deleteBanner, deleteCategory, saveBanner, saveCategory, saveCoupon, saveSettings, toggleCoupon } from '@/app/admin/actions';
import { Note, Save } from './forms';
import { SingleImage } from './ImageUpload';
import type { Coupon, Settings } from '@/lib/types';

const money = (c: number | null | undefined) => (c == null ? '' : (c / 100).toFixed(2).replace('.', ','));
const day = (d: string | null) => (d ? d.slice(0, 10) : '');

export function SettingsForm({ s }: { s: Settings }) {
  const [st, action] = useActionState(saveSettings, null);
  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="grid2"><label className="f">Spedizione (€)<input name="shipping_flat" defaultValue={money(s.shipping_flat_cents)} inputMode="decimal" /></label><label className="f">Gratis sopra (€)<input name="free_threshold" defaultValue={money(s.free_shipping_threshold_cents)} inputMode="decimal" /></label></div>
      <div className="grid2"><label className="f">Sconto di benvenuto newsletter (%)<input name="welcome_pct" type="number" min={1} max={50} defaultValue={s.welcome_discount_percent} /></label><label className="f">Scorta minima per i nuovi prodotti<input name="default_low_stock" type="number" min={0} defaultValue={s.default_low_stock} /></label></div>
      <label className="f">Email per gli avvisi (nuovi ordini, scorte, resi)<input name="admin_email" type="email" defaultValue={s.admin_email || ''} /></label>
      <div className="grid2"><label className="f">Instagram (link)<input name="instagram_url" type="url" defaultValue={s.instagram_url || ''} placeholder="https://instagram.com/…" /></label><label className="f">TikTok (link)<input name="tiktok_url" type="url" defaultValue={s.tiktok_url || ''} /></label></div>
      <label className="f">Facebook (link)<input name="facebook_url" type="url" defaultValue={s.facebook_url || ''} /></label>
      <Note s={st} /><Save>Salva impostazioni</Save>
    </form>
  );
}

export function CouponForm({ c, onDone }: { c?: Coupon; onDone?: () => void }) {
  const [st, action] = useActionState(saveCoupon, null);
  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="grid2"><label className="f">Codice<input name="code" required defaultValue={c?.code} placeholder="NATALE15" style={{ textTransform: 'uppercase' }} /></label>
        <label className="f">Tipo<select name="kind" defaultValue={c?.kind || 'percent'}><option value="percent">Percentuale (%)</option><option value="fixed">Importo fisso (€)</option></select></label></div>
      <div className="grid2"><label className="f">Sconto (% oppure €)<input name="value" required defaultValue={c ? (c.kind === 'fixed' ? money(c.value) : c.value) : ''} inputMode="decimal" /></label>
        <label className="f">Ordine minimo (€)<input name="min_order" defaultValue={money(c?.min_order_cents || 0)} inputMode="decimal" /></label></div>
      <div className="grid2"><label className="f">Valido dal<input name="starts_at" type="date" defaultValue={day(c?.starts_at ?? null)} /></label><label className="f">al<input name="ends_at" type="date" defaultValue={day(c?.ends_at ?? null)} /></label></div>
      <div className="grid2"><label className="f">Vale su<select name="applies_to" defaultValue={c?.applies_to || 'all'}><option value="all">Tutto il negozio</option><option value="abbigliamento">Solo abbigliamento</option><option value="cosmetici">Solo cosmetici</option></select></label>
        <label className="f">Utilizzi massimi totali<input name="max_uses" type="number" min={1} defaultValue={c?.max_uses || ''} placeholder="illimitati" /></label></div>
      <label className="tgl"><span>Un solo uso per cliente<small>controllato sull&apos;email dell&apos;ordine</small></span><input type="checkbox" name="once_per_customer" defaultChecked={c?.once_per_customer} /></label>
      <Note s={st} /><div style={{ display: 'flex', gap: 8 }}><Save>Salva coupon</Save>{onDone && <button type="button" className="b g" onClick={onDone}>Chiudi</button>}</div>
    </form>
  );
}

export function CouponRow({ c }: { c: Coupon }) {
  const [edit, setEdit] = useState(false);
  const [pending, start] = useTransition();
  const now = Date.now();
  const state = !c.active ? ['off', 'Disattivato'] : c.ends_at && new Date(c.ends_at).getTime() < now ? ['off', 'Scaduto'] : c.starts_at && new Date(c.starts_at).getTime() > now ? ['ship', 'Programmato'] : ['ok', 'Attivo'];
  if (edit) return <div className="cp" style={{ display: 'block' }}><CouponForm c={c} onDone={() => setEdit(false)} /></div>;
  return (
    <div className="cp">
      <span className="code">{c.code}</span><span className={`st ${state[0]}`}>{state[1]}</span>
      <span>{c.kind === 'percent' ? `-${c.value}%` : `-${money(c.value)} €`}{c.applies_to !== 'all' ? ` su ${c.applies_to}` : ''}{c.min_order_cents ? ` · minimo ${money(c.min_order_cents)} €` : ''}{c.ends_at ? ` · fino al ${new Date(c.ends_at).toLocaleDateString('it-IT')}` : ''}</span>
      <span>{c.usage_count} usi</span>
      <span style={{ gridColumn: '1/-1', display: 'flex', gap: 8 }}><button className="b g sm" onClick={() => setEdit(true)}>Modifica</button><button className="b g sm" disabled={pending} onClick={() => start(() => toggleCoupon(c.id, !c.active))}>{c.active ? 'Disattiva' : 'Riattiva'}</button></span>
    </div>
  );
}

type B = { id: string; kicker: string | null; title: string; subtitle: string | null; image_url: string; image2_url: string | null; promo_code: string | null; link: string | null; cta: string | null; starts_at: string | null; ends_at: string | null; active: boolean; sort: number };
export function BannerForm({ b, onDone }: { b?: B; onDone?: () => void }) {
  const [st, action] = useActionState(saveBanner, null);
  const dt = (d: string | null) => (d ? new Date(d).toISOString().slice(0, 16) : '');
  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {b && <input type="hidden" name="id" value={b.id} />}
      <div className="grid2"><div className="f">Foto principale<SingleImage name="image_url" initial={b?.image_url} /></div><div className="f">Seconda foto (facoltativa, solo nel banner grande)<SingleImage name="image2_url" initial={b?.image2_url} /></div></div>
      <div className="grid2"><label className="f">Occhiello<input name="kicker" defaultValue={b?.kicker || ''} placeholder="Nuova collezione" /></label><label className="f">Ordine (1 = in alto)<input name="sort" type="number" defaultValue={b?.sort ?? 1} /></label></div>
      <label className="f">Titolo<input name="title" required defaultValue={b?.title} /></label>
      <label className="f">Testo<input name="subtitle" defaultValue={b?.subtitle || ''} /></label>
      <label className="f">Codice promo da mostrare (facoltativo)<input name="promo_code" defaultValue={b?.promo_code || ''} placeholder="SKIN20" style={{ textTransform: 'uppercase' }} /></label>
      <div className="grid2"><label className="f">Testo del pulsante<input name="cta" defaultValue={b?.cta || ''} placeholder="Scopri" /></label><label className="f">Link<input name="link" defaultValue={b?.link || ''} placeholder="/promo" /></label></div>
      <div className="grid2"><label className="f">Dal<input name="starts_at" type="datetime-local" defaultValue={dt(b?.starts_at ?? null)} /></label><label className="f">Al<input name="ends_at" type="datetime-local" defaultValue={dt(b?.ends_at ?? null)} /></label></div>
      <label className="tgl"><span>Attivo</span><input type="checkbox" name="active" defaultChecked={b ? b.active : true} /></label>
      <Note s={st} /><div style={{ display: 'flex', gap: 8 }}><Save>Salva banner</Save>{onDone && <button type="button" className="b g" onClick={onDone}>Chiudi</button>}</div>
    </form>
  );
}
export function BannerRow({ b }: { b: B }) {
  const [edit, setEdit] = useState(false);
  const [pending, start] = useTransition();
  if (edit) return <BannerForm b={b} onDone={() => setEdit(false)} />;
  return (
    <div className="tp" style={{ gridTemplateColumns: '120px 1fr auto' }}>
      <img src={b.image_url} alt="" style={{ width: 120, height: 70, objectFit: 'cover' }} />
      <span><b>{b.sort}. {b.title}</b><span>{b.active ? (b.ends_at ? `Fino al ${new Date(b.ends_at).toLocaleDateString('it-IT')}` : 'Sempre attivo') : 'Disattivato'}</span></span>
      <span style={{ display: 'flex', gap: 6 }}><button className="b g sm" onClick={() => setEdit(true)}>Modifica</button><button className="b g sm" disabled={pending} onClick={() => confirm('Eliminare il banner?') && start(() => deleteBanner(b.id))}>✕</button></span>
    </div>
  );
}
export function NewToggle({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return open ? <div>{children}<button className="b g sm" style={{ marginTop: 8 }} onClick={() => setOpen(false)}>Chiudi</button></div> : <button className="b g" style={{ alignSelf: 'flex-start' }} onClick={() => setOpen(true)}>{label}</button>;
}

type C = { id: string; name: string; slug: string; macro: string; image_url: string | null; sort: number };
export function CategoryForm({ c, macro }: { c?: C; macro?: string }) {
  const [st, action] = useActionState(saveCategory, null);
  const [pending, start] = useTransition();
  return (
    <form action={action} className="grid2" style={{ alignItems: 'end', paddingBlock: 10, borderBottom: '1px solid var(--a-line)' }}>
      {c && <input type="hidden" name="id" value={c.id} />}
      <input type="hidden" name="macro" value={c?.macro || macro} />
      <label className="f">Nome<input name="name" required defaultValue={c?.name} /></label>
      <label className="f">Ordine<input name="sort" type="number" defaultValue={c?.sort ?? 0} /></label>
      <div className="f">Foto del filtro (tonda)<SingleImage name="image_url" initial={c?.image_url} folder="categorie" /></div>
      <div style={{ display: 'flex', gap: 8 }}><Save>{c ? 'Salva' : 'Aggiungi'}</Save>{c && <button type="button" className="b g" disabled={pending} onClick={() => confirm('Eliminare la categoria? I prodotti resteranno senza categoria.') && start(() => deleteCategory(c.id))}>Elimina</button>}</div>
      <div style={{ gridColumn: '1/-1' }}><Note s={st} /></div>
    </form>
  );
}
