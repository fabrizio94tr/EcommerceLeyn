import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Top } from '@/components/admin/Top';
import { eur, dateIt } from '@/lib/format';

const DAY = 86400_000;
const romeDay = (d: Date | string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date(d));

export default async function Dashboard() {
  const sb = supabaseAdmin();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const since = new Date(Math.min(prevStart.getTime(), now.getTime() - 14 * DAY)).toISOString();
  const [{ data: orders }, { count: toShip }, { count: returns }, { data: variants }, { count: waiting }] = await Promise.all([
    sb.from('orders').select('id, total_cents, discount_cents, shipping_cents, paid_at, status, items:order_items(name, product_id, image_url, macro, unit_price_cents, unit_cost_cents, qty)')
      .in('status', ['paid', 'shipped', 'delivered']).gte('paid_at', since),
    sb.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'paid'),
    sb.from('returns').select('id', { count: 'exact', head: true }).eq('status', 'requested'),
    sb.from('product_variants').select('stock, low_stock_threshold'),
    sb.from('waitlist').select('id', { count: 'exact', head: true }).is('notified_at', null)
  ]);
  type It = { name: string; product_id: string | null; image_url: string | null; macro: string | null; unit_price_cents: number; unit_cost_cents: number | null; qty: number };
  const os = (orders ?? []) as { total_cents: number; discount_cents: number; shipping_cents: number; paid_at: string; items: It[] }[];
  const inMonth = os.filter((o) => new Date(o.paid_at) >= monthStart);
  const inPrev = os.filter((o) => new Date(o.paid_at) >= prevStart && new Date(o.paid_at) < monthStart);
  const sales = (l: typeof os) => l.reduce((t, o) => t + o.total_cents - o.shipping_cents, 0);
  const avg = (l: typeof os) => (l.length ? Math.round(l.reduce((t, o) => t + o.total_cents, 0) / l.length) : 0);
  const items = inMonth.flatMap((o) => o.items);
  const withCost = items.filter((i) => i.unit_cost_cents != null);
  const rev = withCost.reduce((t, i) => t + i.unit_price_cents * i.qty, 0), cost = withCost.reduce((t, i) => t + (i.unit_cost_cents || 0) * i.qty, 0);
  const margin = rev ? Math.round(((rev - cost) / rev) * 100) : null;
  const delta = (a: number, b: number) => (b ? `${a >= b ? '+' : ''}${Math.round(((a - b) / b) * 100)}% rispetto al mese scorso` : '');

  // grafico ultimi 14 giorni per macro-categoria
  const days = Array.from({ length: 14 }, (_, i) => romeDay(new Date(now.getTime() - (13 - i) * DAY)));
  const byDay = days.map((d) => {
    const its = os.filter((o) => romeDay(o.paid_at) === d).flatMap((o) => o.items);
    return { d, a: its.filter((i) => i.macro !== 'cosmetici').reduce((t, i) => t + i.unit_price_cents * i.qty, 0), c: its.filter((i) => i.macro === 'cosmetici').reduce((t, i) => t + i.unit_price_cents * i.qty, 0) };
  });
  const peak = Math.max(1, ...byDay.map((x) => x.a + x.c));

  // più venduti e margini per macro
  const top = [...items.reduce((m, i) => { const k = i.product_id || i.name; const x = m.get(k) || { name: i.name, img: i.image_url, qty: 0, rev: 0 }; x.qty += i.qty; x.rev += i.unit_price_cents * i.qty; m.set(k, x); return m; }, new Map<string, { name: string; img: string | null; qty: number; rev: number }>()).values()]
    .sort((a, b) => b.rev - a.rev).slice(0, 5);
  const macros = ['abbigliamento', 'cosmetici'].map((m) => {
    const its = items.filter((i) => (i.macro || 'abbigliamento') === m);
    const r = its.reduce((t, i) => t + i.unit_price_cents * i.qty, 0);
    const wc = its.filter((i) => i.unit_cost_cents != null);
    const rr = wc.reduce((t, i) => t + i.unit_price_cents * i.qty, 0), cc = wc.reduce((t, i) => t + (i.unit_cost_cents || 0) * i.qty, 0);
    return { m, r, cost: cc, margin: rr ? Math.round(((rr - cc) / rr) * 100) : null };
  });
  const totR = macros.reduce((t, x) => t + x.r, 0) || 1;
  const low = (variants ?? []).filter((v) => v.stock <= v.low_stock_threshold).length;

  return (
    <>
      <Top title="Panoramica" sub={`${dateIt(now, { weekday: 'long', day: 'numeric', month: 'long' })} · ecco com'è andata`}>
        <Link className="b" href="/admin/prodotti/nuovo">+ Nuovo prodotto</Link>
      </Top>
      <div className="kpis">
        <div className="kpi"><span>Vendite del mese</span><b>{eur(sales(inMonth))}</b><small>{delta(sales(inMonth), sales(inPrev))}</small></div>
        <div className="kpi"><span>Ordini del mese</span><b>{inMonth.length}</b><small>{inPrev.length ? `${inMonth.length - inPrev.length >= 0 ? '+' : ''}${inMonth.length - inPrev.length} rispetto al mese scorso` : ''}</small></div>
        <div className="kpi"><span>Scontrino medio</span><b>{eur(avg(inMonth))}</b></div>
        <div className="kpi"><span>Margine medio</span><b>{margin == null ? '–' : `${margin}%`}</b><small style={{ color: 'var(--a-muted)' }}>{withCost.length < items.length ? 'inserisci il costo d\'acquisto in tutti i prodotti' : ''}</small></div>
      </div>
      <div className="row2">
        <div className="pane"><h2>Vendite ultimi 14 giorni <span className="leg"><span><i />Abbigliamento</span><span><i className="c2" />Cosmetici</span></span></h2>
          <div className="chart" role="img" aria-label="Grafico delle vendite degli ultimi 14 giorni">
            {byDay.map((x) => <div key={x.d} title={`${x.d}: ${eur(x.a + x.c)}`}><i className="c2" style={{ height: `${(x.c / peak) * 200}px` }} /><i style={{ height: `${(x.a / peak) * 200}px` }} /></div>)}
          </div>
          <div className="cl">{byDay.map((x) => <span key={x.d}>{Number(x.d.slice(8))}</span>)}</div></div>
        <div className="pane"><h2>Da fare oggi</h2><div className="todo">
          <Link className="td" href="/admin/ordini"><b>{toShip ?? 0}</b><span>ordini da spedire</span>›</Link>
          <Link className="td" href="/admin/magazzino?filtro=sotto"><b>{low}</b><span>varianti sotto la scorta minima</span>›</Link>
          <Link className="td" href="/admin/resi"><b>{returns ?? 0}</b><span>richieste di reso da approvare</span>›</Link>
          <Link className="td" href="/admin/magazzino?filtro=attesa"><b>{waiting ?? 0}</b><span>clienti in lista d&apos;attesa</span>›</Link>
        </div></div>
      </div>
      <div className="row2 eq">
        <div className="pane"><h2>Più venduti del mese</h2><div className="top5">
          {top.length ? top.map((t) => <div className="tp" key={t.name}>{t.img ? <img src={t.img} alt="" /> : <span />}<span><b>{t.name}</b><span>{t.qty} venduti</span></span><b className="n">{eur(t.rev)}</b></div>) : <p className="note">Ancora nessuna vendita questo mese.</p>}
        </div></div>
        <div className="pane"><h2>Margini per categoria <small>dal costo d&apos;acquisto dei prodotti</small></h2>
          <div className="split"><i style={{ width: `${(macros[0].r / totR) * 100}%` }} /><i className="c2" style={{ width: `${(macros[1].r / totR) * 100}%` }} /></div>
          <table className="rt"><thead><tr><th>Categoria</th><th className="n">Venduto</th><th className="n hide-m">Costo</th><th className="n">Margine</th></tr></thead><tbody>
            {macros.map((x) => <tr key={x.m}><td style={{ textTransform: 'capitalize' }}>{x.m}</td><td className="n" data-l="Venduto">{eur(x.r)}</td><td className="n hide-m">{eur(x.cost)}</td><td className="n" data-l="Margine"><b>{x.margin == null ? '–' : `${x.margin}%`}</b></td></tr>)}
          </tbody></table></div>
      </div>
    </>
  );
}
