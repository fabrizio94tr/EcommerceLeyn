import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Top } from '@/components/admin/Top';
import { ReturnActions } from '@/components/admin/forms';
import { dateIt, RETURN_STATUS } from '@/lib/format';

const TABS = [['requested', 'Da approvare'], ['approved', 'In arrivo'], ['received', 'Ricevuti'], ['completed', 'Chiusi'], ['rejected', 'Rifiutati']] as const;

export default async function Returns({ searchParams }: { searchParams: Promise<{ stato?: string }> }) {
  const { stato = 'requested' } = await searchParams;
  const sb = supabaseAdmin();
  const { data } = await sb.from('returns').select('*, order:orders(id, number, email, shipped_at, shipping_address, items:order_items(id, name, variant_label, image_url, qty))').eq('status', stato).order('created_at', { ascending: false });
  return (
    <>
      <Top title="Resi e cambi" sub="Le clienti li chiedono dall'area personale entro 14 giorni dalla consegna" />
      <div className="tabs">{TABS.map(([k, l]) => <Link key={k} href={`/admin/resi?stato=${k}`}><span className={stato === k ? 'on' : ''}>{l}</span></Link>)}</div>
      {(data ?? []).map((r) => {
        const o = r.order as { id: string; number: string; email: string; shipped_at: string | null; shipping_address: { full_name: string }; items: { id: string; name: string; variant_label: string | null; image_url: string | null; qty: number }[] };
        const ids = (r.items as { order_item_id: string }[]).map((i) => i.order_item_id);
        return (
          <div className="pane det" key={r.id}>
            <h2>{r.number} · {r.type === 'exchange' ? 'Cambio' : 'Reso e rimborso'} <span className={`st ${RETURN_STATUS[r.status].cls}`}>{RETURN_STATUS[r.status].label}</span></h2>
            <div className="row2 eq">
              <div className="stack" style={{ gap: 10 }}>{o.items.filter((i) => ids.includes(i.id)).map((i) => <div className="li2" key={i.id}>{i.image_url ? <img src={i.image_url} alt="" /> : <span />}<div><b>{i.name}</b><span>{i.variant_label} · Qtà {i.qty}</span></div></div>)}</div>
              <dl><dt>Cliente</dt><dd>{o.shipping_address.full_name} · {o.email}</dd><dt>Ordine</dt><dd><Link href={`/admin/ordini/${o.id}`}>{o.number}</Link>{o.shipped_at ? ` · spedito il ${dateIt(o.shipped_at)}` : ''}</dd><dt>Richiesta</dt><dd>{dateIt(r.created_at)}</dd><dt>Motivo</dt><dd>{r.reason}</dd></dl>
            </div>
            <ReturnActions id={r.id} status={r.status} note={r.admin_note} />
          </div>
        );
      })}
      {!data?.length && <div className="pane"><p className="note">Nessuna richiesta in questo stato.</p></div>}
    </>
  );
}
