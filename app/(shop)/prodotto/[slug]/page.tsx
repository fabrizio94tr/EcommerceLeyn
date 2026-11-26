import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct, getProducts, getSettings, getWishlistIds, inStock } from '@/lib/data';
import { ProductBuy } from '@/components/ProductBuy';
import { ProductCard } from '@/components/ProductCard';
import { Gallery } from '@/components/Gallery';
import { I } from '@/components/icons';
import { eur } from '@/lib/format';
import { SITE_URL } from '@/lib/env';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  const desc = p.seo_description || p.description.slice(0, 155);
  return {
    title: p.seo_title || p.name, description: desc, alternates: { canonical: `/prodotto/${p.slug}` },
    openGraph: { title: p.seo_title || p.name, description: desc, images: p.images?.slice(0, 1).map((i) => ({ url: i.url })) }
  };
}

export default async function ProductPage({ params }: Props) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const [wish, settings, related] = await Promise.all([getWishlistIds(), getSettings(), getProducts({ macro: p.category?.macro, limit: 5 })]);
  const isCos = p.type === 'cosmetic';
  const macroHref = p.category?.macro === 'cosmetici' ? '/cosmetici' : '/abbigliamento';
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.description, sku: p.variants?.[0]?.sku || p.id,
    image: p.images?.map((i) => i.url), brand: { '@type': 'Brand', name: 'Alana Beauty' }, category: p.category?.name,
    offers: (p.variants || []).map((v) => ({
      '@type': 'Offer', url: `${SITE_URL}/prodotto/${p.slug}`, priceCurrency: 'EUR', price: ((v.price_cents ?? p.price_cents) / 100).toFixed(2),
      availability: v.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', sku: v.sku || undefined, itemCondition: 'https://schema.org/NewCondition'
    }))
  };
  const desc = p.description.split(/\n{2,}/);
  const routine = (p.routine || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const [t, ...d] = l.split(':'); const dd = d.join(':').trim(); return { t: t.trim(), d: dd.charAt(0).toUpperCase() + dd.slice(1) }; });

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="crumb"><Link href="/">Home</Link> <I.chev /> <Link href={macroHref}>{p.category?.macro === 'cosmetici' ? 'Cosmetici' : 'Abbigliamento'}</Link>{p.category && <> <I.chev /> <Link href={`${macroHref}?sub=${p.category.slug}`}>{p.category.name}</Link></>} <I.chev /> <b>{p.name}</b></div>
      <div className="pdp">
        <Gallery images={p.images || []} name={p.name} productId={p.id} wished={wish.has(p.id)} />
        <div className="pinfo">
          <span className="k">{p.category?.name}{p.is_new ? ' · Novità' : ''}</span>
          <h1 className="H">{p.name}</h1>
          <ProductBuy p={p} wished={wish.has(p.id)} />
          <div className="ship">
            <span className={inStock(p) ? 'stock' : ''}>{inStock(p) ? 'Disponibile, spedito in 24/48 ore' : 'Al momento esaurito'}</span>
            <span><I.truck />Spedizione {eur(settings.shipping_flat_cents)} · gratuita sopra {eur(settings.free_shipping_threshold_cents)}</span>
            {!isCos && <span><I.ret />Reso o cambio taglia entro 14 giorni</span>}
          </div>
          <div className="acc">
            <details open><summary>Descrizione <span className="pm" aria-hidden /></summary><div className="ab">{desc.map((d, i) => <p key={i}>{d}</p>)}</div></details>
            {!isCos && (p.material || p.fit || p.care) && <details open><summary>Composizione e lavaggio <span className="pm" aria-hidden /></summary><div className="ab"><dl>
              {p.material && <><dt>Tessuto</dt><dd>{p.material}</dd></>}{p.fit && <><dt>Vestibilità</dt><dd>{p.fit}</dd></>}{p.care && <><dt>Lavaggio</dt><dd>{p.care}</dd></>}
            </dl></div></details>}
            {isCos && p.usage && <details open><summary>Modo d&apos;uso <span className="pm" aria-hidden /></summary><div className="ab"><p>{p.usage}</p></div></details>}
            {isCos && p.inci && <details open><summary>Ingredienti (INCI) <span className="pm" aria-hidden /></summary><div className="ab"><p className="inci">{p.inci}</p></div></details>}
            {isCos && <details><summary>Informazioni di sicurezza <span className="pm" aria-hidden /></summary><div className="ab"><dl>
              {p.variants?.some((v) => v.format) && <><dt>Contenuto</dt><dd>{[...new Set(p.variants.map((v) => v.format).filter(Boolean))].join(' · ')}</dd></>}
              {p.pao_months && <><dt>Dopo l&apos;apertura</dt><dd>Usare entro {p.pao_months} mesi</dd></>}
              {p.warnings && <><dt>Avvertenze</dt><dd>{p.warnings}</dd></>}
              {p.origin_country && <><dt>Paese di origine</dt><dd>{p.origin_country}</dd></>}
            </dl></div></details>}
            <details><summary>Spedizioni, resi e cambi <span className="pm" aria-hidden /></summary><div className="ab"><p>Spedizione con corriere espresso in 24/48 ore lavorative, {eur(settings.shipping_flat_cents)} o gratuita sopra {eur(settings.free_shipping_threshold_cents)}. Puoi chiedere un reso o un cambio entro 14 giorni dalla consegna dalla tua area cliente. <Link href="/spedizioni-e-resi" style={{ textDecoration: 'underline' }}>Tutti i dettagli</Link></p></div></details>
          </div>
          {isCos && p.eu_responsible_person && <div className="rp"><I.leaf /><span><b>Persona responsabile UE:</b> {p.eu_responsible_person}{p.origin_country ? <> · <b>Paese di origine:</b> {p.origin_country}</> : null} · Etichetta e avvertenze in italiano (Reg. CE 1223/2009).</span></div>}
        </div>
      </div>
      {isCos && p.routine && <section className="howto"><div className="sec-h"><h2 className="H">La routine in {routine.length} passi</h2></div><div className="g">
        {routine.map((r, i) => <div className="step" key={i}><span className="n">{i + 1}</span><h3 className="H">{r.t}</h3>{r.d && <p>{r.d}</p>}</div>)}
      </div></section>}
      {related.filter((r) => r.id !== p.id).length > 0 && (
        <section className="shelf" style={{ paddingTop: 10 }}>
          <div className="sec-h"><h2 className="H">Ultimi arrivi</h2><Link className="lnk" href={macroHref}>Vedi tutti</Link></div>
          <div className="grid">{related.filter((r) => r.id !== p.id).slice(0, 4).map((r) => <ProductCard key={r.id} p={r} wished={wish.has(r.id)} />)}</div>
        </section>
      )}
    </div>
  );
}
