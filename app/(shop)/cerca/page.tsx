import { Listing, type SP } from '@/components/Listing';
import { getProducts, getWishlistIds } from '@/lib/data';

export const metadata = { title: 'Cerca', robots: { index: false } };
export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = (typeof sp.q === 'string' ? sp.q : '').trim().slice(0, 60);
  const [products, wish] = await Promise.all([q ? getProducts({ search: q }) : Promise.resolve([]), getWishlistIds()]);
  return (
    <>
      <div className="wrap" style={{ paddingTop: 24 }}>
        <form action="/cerca" className="nrow" role="search" style={{ maxWidth: 620 }}>
          <input className="inp" name="q" defaultValue={q} placeholder="Cerca abiti, sieri, rossetti…" aria-label="Cerca" style={{ height: 52, padding: '0 18px' }} autoFocus />
          <button className="btn" type="submit">Cerca</button>
        </form>
      </div>
      <Listing title={q ? `Risultati per “${q}”` : 'Cerca'} basePath="/cerca" products={products} categories={[]} sp={sp} wish={wish} />
    </>
  );
}
