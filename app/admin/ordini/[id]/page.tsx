import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Top } from '@/components/admin/Top';
import { ShipForm, StatusButtons } from '@/components/admin/forms';
import { eur, dateIt, ORDER_STATUS } from '@/lib/format';
import type { Order, OrderItem } from '@/lib/types';

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await supabaseAdmin().from('orders').select('*, items:order_items(*)').eq('id', id).maybeSingle();
  if (!data) notFound();
  const o = data as Order & { items: OrderItem[] };
  const a = o.shipping_address;
  const st = ORDER_STATUS[o.status];
  return (
    <>
      <Top title={`Ordine ${o.number}`} sub={`${dateIt(o.created_at, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`}>
        <Link className="b g" href="/admin/ordini">← Tutti gli ordini</Link>
      </Top>
      <div className="row2">
        <div className="stack">
          <div className="pane det">
            <h2>Articoli <span className={`st ${st.cls}`}>{st.label}</span></h2>
            {o.items.map((i) => <div className="li2" key={i.id}>{i.image_url ? <img src={i.image_url} alt="" /> : <span />}<div><b>{i.name}</b><span>{i.variant_label} · Qtà {i.qty}</span></div><b>{eur(i.unit_price_cents * i.qty)}</b></div>)}
            <dl>
              <dt>Subtotale</dt><dd>{eur(o.subtotal_cents)}</dd>
              {o.discount_cents > 0 && <><dt>Sconto {o.coupon_code}</dt><dd>- {eur(o.discount_cents)}</dd></>}
              <dt>Spedizione</dt><dd>{o.shipping_cents ? eur(o.shipping_cents) : 'Gratis'}</dd>
              <dt>Totale</dt><dd><b>{eur(o.total_cents)}</b></dd>
            </dl>
          </div>
          {['paid', 'shipped'].includes(o.status) && <div className="pane"><h2>Spedizione</h2><ShipForm id={o.id} carrier={o.carrier} tracking={o.tracking_number} url={o.tracking_url} /></div>}
        </div>
        <div className="stack">
          <div className="pane det"><h2>Cliente</h2><dl>
            <dt>Nome</dt><dd>{a.full_name}{o.user_id ? '' : ' (ospite)'}</dd>
            <dt>Email</dt><dd><a href={`mailto:${o.email}`}>{o.email}</a></dd>
            <dt>Telefono</dt><dd>{a.phone ? <a href={`tel:${a.phone}`}>{a.phone}</a> : '–'}</dd>
            <dt>Spedire a</dt><dd>{a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.postal_code} {a.city}{a.province ? ` (${a.province})` : ''}</dd>
            <dt>Pagamento</dt><dd>{o.payment_provider === 'paypal' ? 'PayPal' : 'Stripe (carta / Apple Pay / Google Pay)'}{o.paid_at ? ` · pagato il ${dateIt(o.paid_at)}` : ''}</dd>
            {o.payment_ref && <><dt>Rif. pagamento</dt><dd style={{ wordBreak: 'break-all', fontWeight: 400 }}>{o.payment_ref}</dd></>}
          </dl></div>
          <div className="pane"><h2>Stato</h2><StatusButtons id={o.id} status={o.status} />
            <p className="note">I rimborsi si fanno dalla dashboard di Stripe o PayPal; qui si aggiorna solo lo stato.</p></div>
        </div>
      </div>
    </>
  );
}
