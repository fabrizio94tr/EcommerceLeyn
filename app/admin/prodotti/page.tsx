import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Top } from '@/components/admin/Top';
import { eur } from '@/lib/format';

export default async function Products({ searchParams }: { searchParams: Promise<{ q?: string; tipo?: string; stato?: string }> }) {
  const { q = '', tipo = '', stato = '' } = await searchParams;
  let query = supabaseAdmin().from('products').select('id, name, slug, type, price_cents, compare_at_cents, published, featured, category:categories(name), images:product_images(url, sort), variants:product_variants(stock)').order('created_at', { ascending: false });
  const term = q.trim().replace(/[%,()]/g, ' ');
  if (term) query = query.ilike('name', `%${term}%`);
  if (tipo) query = query.eq('type', tipo);
  if (stato) query = query.eq('published', stato === 'pubblicati');
  const { data } = await query;
  return (
    <>
      <Top title="Prodotti" sub={`${data?.length ?? 0} prodotti`}>
        <Link className="b g hide-m" href="/admin/magazzino#import">Importa da Excel</Link>
        <Link className="b" href="/admin/prodotti/nuovo">+ Nuovo prodotto</Link>
      </Top>
      <form className="filters">
        <input name="q" defaultValue={q} placeholder="Cerca per nome" aria-label="Cerca" />
        <select name="tipo" defaultValue={tipo} aria-label="Tipo"><option value="">Tutti i tipi</option><option value="clothing">Abbigliamento</option><option value="cosmetic">Cosmetici</option></select>
        <select name="stato" defaultValue={stato} aria-label="Stato"><option value="">Pubblicati e bozze</option><option value="pubblicati">Pubblicati</option><option value="bozze">Bozze</option></select>
        <button className="b g">Filtra</button>
      </form>
      <div className="pane"><table className="rt"><thead><tr><th>Prodotto</th><th className="hide-m">Categoria</th><th className="n">Prezzo</th><th className="n">Pezzi</th><th>Stato</th></tr></thead><tbody>
        {(data ?? []).map((p) => {
          const img = [...(p.images as { url: string; sort: number }[])].sort((a, b) => a.sort - b.sort)[0]?.url;
          const stock = (p.variants as { stock: number }[]).reduce((t, v) => t + v.stock, 0);
          return (
            <tr key={p.id} className="rowlink">
              <td className="full"><Link href={`/admin/prodotti/${p.id}`} className="pi">{img ? <img src={img} alt="" /> : <span style={{ width: 38, height: 46, background: 'var(--a-soft)' }} />}<span><b>{p.name}</b><span>{p.type === 'cosmetic' ? 'Cosmetico' : 'Abbigliamento'}{p.featured ? ' · in evidenza' : ''}</span></span></Link></td>
              <td className="hide-m">{(p.category as unknown as { name: string } | null)?.name || '–'}</td>
              <td className="n" data-l="Prezzo">{eur(p.price_cents)}{p.compare_at_cents ? <s className="note"> {eur(p.compare_at_cents)}</s> : null}</td>
              <td className="n" data-l="Pezzi">{stock}</td>
              <td><span className={`st ${p.published ? 'ok' : 'off'}`}>{p.published ? 'Pubblicato' : 'Bozza'}</span></td>
            </tr>
          );
        })}
        {!data?.length && <tr><td colSpan={5} className="note">Nessun prodotto. Creane uno o importa il catalogo da Excel.</td></tr>}
      </tbody></table></div>
    </>
  );
}
