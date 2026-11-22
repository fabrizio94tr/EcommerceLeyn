import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import { finalizeOrder } from '@/lib/orders';
import { getUser } from '@/lib/data';
import { ClearCart } from '@/components/ClearCart';
import { I } from '@/components/icons';
import { eur, dateIt } from '@/lib/format';
import type { Order, OrderItem } from '@/lib/types';

export const metadata = { title: 'Il tuo ordine', robots: { index: false } };
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string; session_id?: string }> };

export default async function OrderPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { t, session_id } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const sb = supabaseAdmin();
  const user = await getUser();
  const load = async () => (await sb.from('orders').select('*, items:order_items(*)').eq('id', id).maybeSingle()).data as (Order & { items: OrderItem[] }) | null;
  let o = await load();
  if (!o || (o.access_token !== t && (!user || o.user_id !== user.id))) notFound();

  // Se il webhook non è ancora arrivato, verifichiamo noi il pagamento Stripe.
  if (o.status === 'pending' && o.payment_provider === 'stripe' && session_id) {
    try {
      const s = await stripe().checkout.sessions.retrieve(session_id);
      if (s.payment_status === 'paid' && s.metadata?.order_id === o.id) { await finalizeOrder(o.id, 'stripe', String(s.payment_intent || s.id)); o = (await load())!; }
    } catch (e) { console.error('Verifica sessione Stripe', e); }
  }

  const paid = o.status !== 'pending' && o.status !== 'cancelled';
  const steps = [
    { label: 'Ordine ricevuto', sub: o.paid_at ? dateIt(o.paid_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '', done: paid },
    { label: 'In preparazione', sub: 'Entro 1-2 giorni lavorativi', done: ['shipped', 'delivered'].includes(o.status), now: o.status === 'paid' },
    { label: 'Spedito', sub: o.tracking_number ? `${o.carrier || 'Corriere'} · ${o.tracking_number}` : 'Ti mandiamo il tracking', done: ['shipped', 'delivered'].includes(o.status) },
    { label: 'Consegnato', sub: '', done: o.status === 'delivered' }
  ];
  const a = o.shipping_address;

  return (
    <div className="wrap">
      {paid && <ClearCart />}
      <div className="ok-h">
        {paid ? <span className="tick"><I.check /></span> : null}
        <h1 className="H">{paid ? `Grazie ${a.full_name.split(' ')[0]}, il tuo ordine è confermato!` : o.status === 'cancelled' ? 'Ordine annullato' : 'Stiamo verificando il pagamento'}</h1>
        <p>{paid ? <>Ti abbiamo inviato la conferma a <b>{o.email}</b>. Riceverai un&apos;altra email con il codice di tracking appena il pacco parte.</> : o.status === 'cancelled' ? 'Il pagamento non è andato a buon fine. Non ti è stato addebitato nulla.' : 'Di solito servono pochi secondi. Ricarica la pagina tra un momento: riceverai comunque una email di conferma.'}</p>
        <span className="ono">Ordine n. {o.number}</span>
      </div>
      {paid && <div className="track">{steps.map((s, i) => (
        <div key={s.label} className={s.done ? 'done' : s.now ? 'now' : ''}><i>{s.done ? <I.check /> : i + 1}</i><span><b>{s.label}</b>{s.sub && <> {s.sub}</>}</span></div>
      ))}</div>}
      {o.tracking_url && <p style={{ textAlign: 'center', marginBottom: 30 }}><a className="btn" href={o.tracking_url} target="_blank" rel="noopener">Segui il pacco</a></p>}
      <div className="ok-g">
        <div className="ibox">
          <h3>Riepilogo</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {o.items.map((i) => <div className="li" key={i.id}>{i.image_url ? <img src={i.image_url} alt="" /> : <span />}<div className="lt"><b>{i.name}</b><span>{i.variant_label} · Qtà {i.qty}</span></div><b>{eur(i.unit_price_cents * i.qty)}</b></div>)}
          </div>
          <div className="tot">
            <div><span>Subtotale</span><span>{eur(o.subtotal_cents)}</span></div>
            {o.discount_cents > 0 && <div className="disc"><span>Sconto {o.coupon_code}</span><span>- {eur(o.discount_cents)}</span></div>}
            <div><span>Spedizione</span><span>{o.shipping_cents ? eur(o.shipping_cents) : 'Gratis'}</span></div>
            <div className="g"><span>{paid ? 'Totale pagato' : 'Totale'}</span><span>{eur(o.total_cents)}</span></div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="ibox"><h3>Consegna</h3><dl>
            <dt>Indirizzo</dt><dd>{a.full_name}, {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.postal_code} {a.city}{a.province ? ` (${a.province})` : ''}</dd>
            <dt>Corriere</dt><dd>Espresso 24/48 ore</dd>
            <dt>Pagamento</dt><dd>{o.payment_provider === 'paypal' ? 'PayPal' : 'Carta / Apple Pay / Google Pay'}</dd>
          </dl></div>
          {!o.user_id && paid && <div className="reg"><span className="k">Hai acquistato come ospite</span><h2 className="H">Crea il tuo account</h2>
            <ul><li>Segui l&apos;ordine e i prossimi acquisti</li><li>Salva i tuoi indirizzi</li><li>Lista dei preferiti</li><li>Chiedi un reso o un cambio taglia</li></ul>
            <Link href={`/registrati?email=${encodeURIComponent(o.email)}`} className="btn">Crea account</Link>
            <span className="muted" style={{ fontSize: 13 }}>Usa la stessa email: troverai questo ordine nella tua area.</span></div>}
        </div>
      </div>
    </div>
  );
}
