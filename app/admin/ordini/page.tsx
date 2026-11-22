import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Top } from '@/components/admin/Top';
import { eur, dateIt, ORDER_STATUS } from '@/lib/format';

const TABS = [['paid', 'Da spedire'], ['shipped', 'Spediti'], ['delivered', 'Consegnati'], ['cancelled', 'Annullati'], ['all', 'Tutti']] as const;

export default async function Orders({ searchParams }: { searchParams: Promise<{ stato?: string; q?: string }> }) {
  const { stato = 'paid', q = '' } = await searchParams;
  const sb = supabaseAdmin();
  let query = sb.from('orders').select('id, number, email, status, total_cents, created_at, payment_provider, shipping_address').neq('status', 'pending').order('created_at', { ascending: false }).limit(200);
  if (stato !== 'all') query = query.eq('status', stato);
  const term = q.trim().replace(/[%,()]/g, ' ');
  if (term) query = query.or(`number.ilike.%${term}%,email.ilike.%${term}%`);
  const [{ data: orders }, ...counts] = await Promise.all([query, ...TABS.slice(0, 4).map(([s]) => sb.from('orders').select('id', { count: 'exact', head: true }).eq('status', s))]);
  return (
    <>
      <Top title="Ordini" sub="Gli ordini compaiono qui appena il pagamento è confermato">
        <form className="filters"><input name="q" defaultValue={q} placeholder="Numero ordine o email" aria-label="Cerca ordine" /><input type="hidden" name="stato" value={stato} /><button className="b g">Cerca</button></form>
        <a className="b g hide-m" href="/admin/export/ordini">Esporta CSV</a>
      </Top>
      <div className="tabs">{TABS.map(([s, l], i) => <Link key={s} href={`/admin/ordini?stato=${s}`}><span className={stato === s ? 'on' : ''}>{l}{i < 4 && <em>{counts[i].count ?? 0}</em>}</span></Link>)}</div>
      <div className="pane"><table className="rt"><thead><tr><th>Ordine</th><th>Cliente</th><th className="hide-m">Data</th><th className="hide-m">Pagamento</th><th className="n">Totale</th><th>Stato</th></tr></thead><tbody>
        {(orders ?? []).map((o) => (
          <tr key={o.id} className="rowlink">
            <td><Link href={`/admin/ordini/${o.id}`}><b>{o.number}</b></Link></td>
            <td className="n" style={{ textAlign: 'left' }}><Link href={`/admin/ordini/${o.id}`}>{(o.shipping_address as { full_name: string }).full_name}</Link></td>
            <td className="hide-m">{dateIt(o.created_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
            <td className="hide-m">{o.payment_provider === 'paypal' ? 'PayPal' : 'Carta / wallet'}</td>
            <td className="n"><b>{eur(o.total_cents)}</b></td>
            <td><span className={`st ${ORDER_STATUS[o.status].cls}`}>{ORDER_STATUS[o.status].label}</span></td>
          </tr>
        ))}
        {!orders?.length && <tr><td colSpan={6} className="note">Nessun ordine.</td></tr>}
      </tbody></table></div>
    </>
  );
}
