import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { signOut } from '@/app/actions';
import { ProductCard } from '@/components/ProductCard';
import { AddressCard, NewAddress, ProfileForm, ReturnForm } from '@/components/AccountForms';
import { PRODUCT_SELECT, normalize } from '@/lib/data';
import { eur, dateIt, ORDER_STATUS, RETURN_STATUS } from '@/lib/format';
import type { Order, OrderItem, Product } from '@/lib/types';

export const metadata = { title: 'Il mio account', robots: { index: false } };
export const dynamic = 'force-dynamic';

const TABS = [['ordini', 'I miei ordini'], ['resi', 'Resi e cambi'], ['preferiti', 'Preferiti'], ['indirizzi', 'Indirizzi'], ['dati', 'Dati personali']] as const;

export default async function Account({ searchParams }: { searchParams: Promise<{ tab?: string; inviata?: string }> }) {
  const { user, sb } = await requireUser('/account');
  const sp = await searchParams;
  const tab = sp.tab || 'ordini';
  const [{ data: prof }, { data: orders }, { data: returns }, { data: wish }, { data: addrs }] = await Promise.all([
    sb.from('profiles').select('full_name, phone, created_at').eq('id', user.id).single(),
    sb.from('orders').select('*, items:order_items(*)').eq('user_id', user.id).neq('status', 'pending').order('created_at', { ascending: false }),
    sb.from('returns').select('*, order:orders(number)').eq('user_id', user.id).order('created_at', { ascending: false }),
    sb.from('wishlist').select(`product:products(${PRODUCT_SELECT})`).eq('user_id', user.id).order('created_at', { ascending: false }),
    sb.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false })
  ]);
  const os = (orders ?? []) as (Order & { items: OrderItem[] })[];
  const wishProducts = (wish ?? []).map((w) => w.product as unknown as Product).filter(Boolean).map(normalize);
  const first = (prof?.full_name || user.email || '').split(' ')[0];
  const initials = (prof?.full_name || user.email || '?').split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase();
  const openRet = new Set((returns ?? []).filter((r) => ['requested', 'approved', 'received'].includes(r.status)).map((r) => r.order_id));

  return (
    <div className="wrap">
      <div className="acct">
        <aside className="side">
          <div className="hi"><span className="av">{initials}</span><div><b>{prof?.full_name || user.email}</b><span>Cliente da {dateIt(prof?.created_at || user.created_at, { month: 'long', year: 'numeric' })}</span></div></div>
          {TABS.map(([k, l]) => <Link key={k} href={`/account?tab=${k}`} className={tab === k ? 'on' : ''}>{l}{k === 'ordini' && os.length ? <em>{os.length}</em> : k === 'preferiti' && wishProducts.length ? <em>{wishProducts.length}</em> : null}</Link>)}
          <form action={signOut}><button className="lnk" style={{ padding: '12px 14px' }}>Esci</button></form>
        </aside>
        <div className="acc-main">
          <h1 className="H">Ciao {first}</h1>
          {sp.inviata && <p className="alert good">Richiesta {sp.inviata} inviata. Ti scriviamo appena la approviamo, con le istruzioni per la spedizione.</p>}

          {tab === 'ordini' && (os.length ? <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{os.map((o) => {
            const st = ORDER_STATUS[o.status];
            const canReturn = ['shipped', 'delivered'].includes(o.status) && !openRet.has(o.id) && Date.now() - new Date(o.shipped_at || o.paid_at || o.created_at).getTime() < 30 * 86400_000;
            return (
              <div className="ord" key={o.id}>
                <div className="ims">{o.items.slice(0, 3).map((i) => i.image_url && <img key={i.id} src={i.image_url} alt="" />)}</div>
                <div className="ot"><span className={`st ${st.cls}`}>{st.label}</span><b>Ordine {o.number}</b><span>{dateIt(o.created_at)} · {o.items.reduce((t, i) => t + i.qty, 0)} articoli · {eur(o.total_cents)}</span></div>
                <div className="oa">
                  {o.tracking_url && <a className="btn sm" href={o.tracking_url} target="_blank" rel="noopener">Traccia pacco</a>}
                  <Link className="btn ghost sm" href={`/ordine/${o.id}?t=${o.access_token}`}>Dettagli</Link>
                  {canReturn && <ReturnForm orderId={o.id} items={o.items.map((i) => ({ id: i.id, label: `${i.name} · ${i.variant_label || ''}` }))} />}
                </div>
              </div>
            );
          })}</div> : <div className="rbox"><p>Non hai ancora ordini. <Link href="/novita" style={{ textDecoration: 'underline' }}>Scopri le novità</Link></p></div>)}

          {tab === 'resi' && ((returns ?? []).length ? <div className="two">{(returns ?? []).map((r) => (
            <div className="rbox" key={r.id}><h3>{r.type === 'exchange' ? 'Cambio' : 'Reso'} {r.number} <span className={`st ${RETURN_STATUS[r.status].cls}`}>{RETURN_STATUS[r.status].label}</span></h3>
              <p>Ordine {(r.order as { number: string })?.number} · {dateIt(r.created_at)}<br />{r.reason}</p>{r.admin_note && <p><b>Nota:</b> {r.admin_note}</p>}</div>
          ))}</div> : <div className="rbox"><p>Nessuna richiesta. Puoi chiedere un reso o un cambio dalla scheda &quot;I miei ordini&quot;, entro 14 giorni dalla consegna.</p></div>)}

          {tab === 'preferiti' && (wishProducts.length ? <div className="grid">{wishProducts.map((p) => <ProductCard key={p.id} p={p} wished />)}</div>
            : <div className="rbox"><p>Tocca il cuore su un prodotto per salvarlo qui.</p></div>)}

          {tab === 'indirizzi' && <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}><div className="two">{(addrs ?? []).map((a) => <AddressCard key={a.id} a={a} />)}</div><NewAddress /></div>}

          {tab === 'dati' && <ProfileForm name={prof?.full_name || ''} phone={prof?.phone || ''} email={user.email || ''} />}
        </div>
      </div>
    </div>
  );
}
