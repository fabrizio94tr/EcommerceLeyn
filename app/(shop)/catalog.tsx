import type { Metadata } from 'next';
import { Listing, type SP } from '@/components/Listing';
import { getCategories, getProducts, getWishlistIds } from '@/lib/data';
import type { Macro } from '@/lib/types';

const META: Record<Macro, { title: string; intro: string; banner?: string }> = {
  abbigliamento: { title: 'Abbigliamento', intro: 'Abiti, top, pantaloni e capispalla selezionati. Scegli taglia e colore: vedi subito cosa è disponibile.' },
  cosmetici: { title: 'Cosmetici', intro: 'Skincare e make-up con ingredienti (INCI), formato e modo d\'uso sempre in scheda. Prodotti con etichetta in italiano e responsabile UE.', banner: '/img/cosmetici-banner.jpg' }
};

export async function macroMetadata(macro: Macro, sp: SP): Promise<Metadata> {
  const cats = await getCategories(macro);
  const sub = typeof sp.sub === 'string' ? cats.find((c) => c.slug === sp.sub) : null;
  const title = sub ? `${sub.name} · ${META[macro].title}` : `${META[macro].title} donna`;
  return { title, description: META[macro].intro, alternates: { canonical: sub ? `/${macro}?sub=${sub.slug}` : `/${macro}` } };
}

export async function MacroPage({ macro, sp }: { macro: Macro; sp: SP }) {
  const [products, categories, wish] = await Promise.all([getProducts({ macro }), getCategories(macro), getWishlistIds()]);
  return <Listing title={META[macro].title} intro={META[macro].intro} basePath={`/${macro}`} products={products} categories={categories} sp={sp} wish={wish} banner={META[macro].banner} />;
}
