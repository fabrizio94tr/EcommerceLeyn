import { Listing, type SP } from '@/components/Listing';
import { getProducts, getWishlistIds } from '@/lib/data';

export const metadata = { title: 'Novità', description: 'Gli ultimi arrivi di abbigliamento e cosmetici.', alternates: { canonical: '/novita' } };
export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const [products, wish] = await Promise.all([getProducts(), getWishlistIds()]);
  return <Listing title="Novità" intro="Gli ultimi arrivi, abbigliamento e cosmetici." basePath="/novita" products={products.filter((p) => p.is_new).slice(0, 96)} categories={[]} sp={await searchParams} wish={wish} />;
}
