import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Top } from '@/components/admin/Top';
import { ImportBox, StockCell } from '@/components/admin/Stock';
import { eur, variantLabel } from '@/lib/format';

type Row = { id: string; stock: number; low_stock_threshold: number; size: string | null; color_name: string | null; format: string | null; cost_cents: number | null; product: { id: string; name: string; type: string; cost_cents: number | null; images: { url: string; sort: number }[] } };

export default async function Stock({ searchParams }: { searchParams: Promise<{ filtro?: string; q?: string }> }) {
  const { filtro = 'tutti', q = '' } = await searchParams;
  const sb = supabaseAdmin();
  const [{ data }, { data: wl }] = await Promise.all([
    sb.from('product_variants').select('id, stock, low_stock_threshold, size, color_name, format, cost_cents, product:products(id, name, type, cost_cents, images:product_images(url, sort))').order('stock'),
    sb.from('waitlist').select('variant_id').is('notified_at', null)
  ]);
  const waiting = (wl ?? []).reduce<Record<string, number>>((m, w) => ({ ...m, [w.variant_id]: (m[w.variant_id] || 0) + 1 }), {});
  const all = (data ?? []) as unknown as Row[];
  const value = all.reduce((t, v) => t + v.stock * (v.cost_cents ?? v.product.cost_cents ?? 0), 0);
  let rows = all;
  if (filtro === 'abbigliamento') rows = rows.filter((v) => v.product.type === 'clothing');
  if (filtro === 'cosmetici') rows = rows.filter((v) => v.product.type === 'cosmetic');
  if (filtro === 'sotto') rows = rows.filter((v) => v.stock > 0 && v.stock <= v.low_stock_threshold);
  if (filtro === 'esauriti') rows = rows.filter((v) => v.stock <= 0);
  if (filtro === 'attesa') rows = rows.filter((v) => waiting[v.id]);
  if (q) rows = rows.filter((v) => v.product.name.toLowerCase().includes(q.toLowerCase()));
  const low = all.filter((v) => v.stock > 0 && v.stock <= v.low_stock_threshold).length, out = all.filter((v) => v.stock <= 0).length;
  const F = [['tutti', 'Tutti'], ['abbigliamento', 'Abbigliamento'], ['cosmetici', 'Cosmetici'], ['sotto', `Sotto scorta · ${low}`], ['esauriti', `Esauriti · ${out}`], ['attesa', 'Con lista d\'attesa']];
  return (
    <>
      <Top title="Magazzino" sub="Le giacenze scendono da sole a ogni ordine. Sotto la scorta minima ricevi una email.">
        <form className="filters"><input name="q" defaultValue={q} placeholder="Cerca prodotto" aria-label="Cerca prodotto" /><input type="hidden" name="filtro" value={filtro} /></form>
      </Top>
      <div className="kpis">
        <div className="kpi"><span>Varianti attive</span><b>{all.length}</b></div>
        <div className="kpi"><span>Sotto scorta minima</span><b>{low}</b></div>
        <div className="kpi"><span>Esauriti</span><b>{out}</b><small className="dn">{Object.values(waiting).reduce((a, b) => a + b, 0)} clienti in attesa</small></div>
        <div className="kpi"><span>Valore magazzino</span><b>{eur(value)}</b><small style={{ color: 'var(--a-muted)' }}>al costo d&apos;acquisto</small></div>
      </div>
      <div className="tabs">{F.map(([k, l]) => <Link key={k} href={`/admin/magazzino?filtro=${k}`}><span className={filtro === k ? 'on' : ''}>{l}</span></Link>)}</div>
      <div className="row2">
        <div className="pane"><table className="rt"><thead><tr><th>Prodotto · variante</th><th>Pezzi · scorta min.</th><th className="n">In attesa</th></tr></thead><tbody>
          {rows.map((v) => {
            const img = [...v.product.images].sort((a, b) => a.sort - b.sort)[0]?.url;
            return (
              <tr key={v.id}>
                <td className="full"><Link className="pi" href={`/admin/prodotti/${v.product.id}`}>{img ? <img src={img} alt="" /> : <span />}<span><b>{v.product.name}</b><span>{variantLabel(v) || 'Unica'}</span></span></Link></td>
                <td><StockCell id={v.id} stock={v.stock} threshold={v.low_stock_threshold} /></td>
                <td className="n" data-l="In attesa">{waiting[v.id] || '–'}</td>
              </tr>
            );
          })}
          {!rows.length && <tr><td colSpan={3} className="note">Nessuna variante in questo filtro.</td></tr>}
        </tbody></table></div>
        <div className="stack" id="import">
          <div className="pane"><h2>Importa prodotti da Excel</h2><ImportBox />
            <span className="note">Prima controlliamo il file e ti mostriamo cosa verrà creato o aggiornato; poi confermi. I prodotti con lo stesso nome (o slug) vengono aggiornati, non duplicati.</span></div>
        </div>
      </div>
    </>
  );
}
