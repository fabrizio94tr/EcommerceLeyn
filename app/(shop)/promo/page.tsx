import { Listing, type SP } from '@/components/Listing';
import { getProducts, getWishlistIds } from '@/lib/data';

export const metadata = { title: 'Promo', description: 'Abbigliamento e cosmetici in promozione.', alternates: { canonical: '/promo' } };
export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const [products, wish] = await Promise.all([getProducts(), getWishlistIds()]);
  return <Listing title="Promo" intro="Tutti i prodotti scontati in questo momento." basePath="/promo" products={products.filter((p) => p.compare_at_cents && p.compare_at_cents > p.price_cents)} categories={[]} sp={await searchParams} wish={wish} />;
}
