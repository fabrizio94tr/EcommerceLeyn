import 'server-only';
import { Resend } from 'resend';
import { SITE_URL, STORE_LEGAL } from './env';
import { eur, dateIt } from './format';
import type { Order, OrderItem } from './types';

const FROM = process.env.EMAIL_FROM || 'Alana Beauty <ordini@alanabeauty.it>';

/** Invia un'email. Senza RESEND_API_KEY (sviluppo) la scrive solo nel log. */
export async function sendEmail(to: string | null | undefined, subject: string, html: string) {
  if (!to) return;
  if (!process.env.RESEND_API_KEY) { console.log(`[email non inviata, manca RESEND_API_KEY] a ${to}: ${subject}`); return; }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) console.error('Errore invio email', subject, error);
  } catch (e) { console.error('Errore invio email', subject, e); }
}

export const adminEmail = (fromSettings?: string | null) => fromSettings || process.env.ADMIN_EMAIL || null;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

function layout(title: string, body: string) {
  return `<!doctype html><html lang="it"><body style="margin:0;background:#F5F3F0;font-family:Helvetica,Arial,sans-serif;color:#0F0E10">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3F0;padding:24px 0"><tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff">
    <tr><td style="background:#0F0E10;padding:26px;text-align:center;color:#fff;font-family:Georgia,serif;letter-spacing:.32em;font-size:24px">ALANA<div style="font-size:10px;letter-spacing:.36em;color:#D6B98E;margin-top:6px;font-family:Helvetica,Arial,sans-serif">— BEAUTY —</div></td></tr>
    <tr><td style="padding:32px 32px 8px"><h1 style="font-family:Georgia,serif;font-weight:600;font-size:26px;margin:0 0 16px">${title}</h1>${body}</td></tr>
    <tr><td style="padding:24px 32px 32px;font-size:12px;color:#5E595F;border-top:1px solid #E3DED8">${esc(STORE_LEGAL)}<br><a href="${SITE_URL}" style="color:#5E595F">${SITE_URL.replace(/^https?:\/\//, '')}</a></td></tr>
  </table></td></tr></table></body></html>`;
}
const p = (t: string) => `<p style="font-size:15px;line-height:1.6;margin:0 0 14px">${t}</p>`;
const btn = (href: string, label: string) => `<p style="margin:22px 0"><a href="${href}" style="background:#0F0E10;color:#fff;text-decoration:none;padding:14px 26px;font-size:13px;letter-spacing:.1em;text-transform:uppercase;display:inline-block">${label}</a></p>`;

function itemsTable(items: OrderItem[], o: Order) {
  const rows = items.map((i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px">${esc(i.name)}<br><span style="color:#5E595F;font-size:13px">${esc(i.variant_label || '')} · Qtà ${i.qty}</span></td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-size:14px">${eur(i.unit_price_cents * i.qty)}</td></tr>`).join('');
  const line = (l: string, v: string, b = false) => `<tr><td style="padding:4px 0;font-size:14px;${b ? 'font-weight:700' : ''}">${l}</td><td style="padding:4px 0;text-align:right;font-size:14px;${b ? 'font-weight:700' : ''}">${v}</td></tr>`;
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 18px">${rows}
    ${line('Subtotale', eur(o.subtotal_cents))}${o.discount_cents ? line(`Sconto ${esc(o.coupon_code || '')}`, '- ' + eur(o.discount_cents)) : ''}
    ${line('Spedizione', o.shipping_cents ? eur(o.shipping_cents) : 'Gratis')}${line('Totale', eur(o.total_cents), true)}</table>`;
}
const addr = (o: Order) => { const a = o.shipping_address; return esc([a.full_name, a.line1, a.line2, `${a.postal_code} ${a.city}${a.province ? ' (' + a.province + ')' : ''}`].filter(Boolean).join(', ')); };
export const orderUrl = (o: Pick<Order, 'id' | 'access_token'>) => `${SITE_URL}/ordine/${o.id}?t=${o.access_token}`;

export const tpl = {
  orderConfirmed: (o: Order, items: OrderItem[]) => layout(`Grazie, il tuo ordine ${o.number} è confermato`,
    p(`Abbiamo ricevuto il pagamento e stiamo preparando il pacco. Ti scriviamo di nuovo con il codice di tracking appena parte.`) +
    itemsTable(items, o) + p(`<b>Spedizione a:</b> ${addr(o)}`) + btn(orderUrl(o), 'Vedi il tuo ordine') +
    p(`<span style="color:#5E595F;font-size:13px">Puoi chiedere un reso o un cambio entro 14 giorni dalla consegna dalla tua area cliente.</span>`)),
  adminNewOrder: (o: Order, items: OrderItem[]) => layout(`Nuovo ordine ${o.number} · ${eur(o.total_cents)}`,
    p(`Cliente: <b>${esc(o.shipping_address.full_name)}</b> · ${esc(o.email)}`) + itemsTable(items, o) + p(`<b>Spedire a:</b> ${addr(o)}`) +
    btn(`${SITE_URL}/admin/ordini/${o.id}`, 'Apri nel pannello')),
  shipped: (o: Order) => layout(`Il tuo ordine ${o.number} è partito`,
    p(`Il pacco è stato affidato a <b>${esc(o.carrier || 'corriere')}</b>.`) + p(`Codice di tracking: <b>${esc(o.tracking_number || '')}</b>`) +
    (o.tracking_url ? btn(o.tracking_url, 'Segui il pacco') : btn(orderUrl(o), 'Vedi il tuo ordine'))),
  waitlist: (name: string, label: string, url: string) => layout('È tornato disponibile',
    p(`<b>${esc(name)}</b>${label ? ' · ' + esc(label) : ''} è di nuovo disponibile. Le quantità sono limitate.`) + btn(url, 'Acquista ora') +
    p(`<span style="color:#5E595F;font-size:13px">Ricevi questa email perché hai chiesto di essere avvisata. Non ti scriveremo più per questo prodotto.</span>`)),
  lowStock: (rows: { name: string; label: string; stock: number; threshold: number }[]) => layout('Scorte in esaurimento',
    p('Questi prodotti hanno raggiunto la scorta minima:') +
    `<ul style="font-size:14px;line-height:1.7">${rows.map((r) => `<li><b>${esc(r.name)}</b> ${esc(r.label)}: ${r.stock} pezzi (soglia ${r.threshold})</li>`).join('')}</ul>` +
    btn(`${SITE_URL}/admin/magazzino`, 'Apri il magazzino')),
  welcome: (code: string, pct: number) => layout('Benvenuta in Alana Beauty',
    p(`Grazie per esserti iscritta. Ecco il tuo codice per avere il <b>${pct}% di sconto</b> sul primo ordine:`) +
    `<p style="font-size:24px;letter-spacing:.14em;font-weight:700;border:2px dashed #D6B98E;padding:14px;text-align:center">${esc(code)}</p>` +
    btn(SITE_URL, 'Inizia lo shopping') + p(`<span style="color:#5E595F;font-size:13px">Il codice vale una sola volta. Puoi cancellarti dalla newsletter quando vuoi rispondendo a questa email.</span>`)),
  returnUpdate: (number: string, status: string, note?: string | null) => layout(`Richiesta ${number}: ${status}`,
    p(`La tua richiesta di reso o cambio <b>${esc(number)}</b> è stata aggiornata: <b>${esc(status)}</b>.`) +
    (note ? p(esc(note)) : '') + btn(`${SITE_URL}/account?tab=resi`, 'Vai alla tua area')),
  adminReturn: (number: string, orderNo: string, reason: string) => layout(`Nuova richiesta di reso ${number}`,
    p(`Ordine ${esc(orderNo)}. Motivo: ${esc(reason)}`) + btn(`${SITE_URL}/admin/resi`, 'Gestisci nel pannello'))
};
export { dateIt };
