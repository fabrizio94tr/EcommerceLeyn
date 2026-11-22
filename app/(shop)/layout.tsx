import { CartProvider } from '@/components/cart';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CookieBanner } from '@/components/CookieBanner';
import { getCategories, getSettings, getUser, getWishlistIds } from '@/lib/data';
import { eur } from '@/lib/format';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, user, wish] = await Promise.all([getSettings(), getCategories(), getUser(), getWishlistIds()]);
  return (
    <CartProvider>
      <Header categories={categories} freeShipping={eur(settings.free_shipping_threshold_cents)} wishCount={wish.size} loggedIn={!!user} />
      <main>{children}</main>
      <Footer pct={settings.welcome_discount_percent} />
      <CookieBanner />
    </CartProvider>
  );
}
