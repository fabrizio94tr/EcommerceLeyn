import Image from 'next/image';
import Link from 'next/link';
import { getBanners, getCategories, getPosts, getProducts, getSettings, getWishlistIds } from '@/lib/data';
import { ShelfTabs } from '@/components/Tabs';
import { ProductCard } from '@/components/ProductCard';
import { I } from '@/components/icons';
import { eur, dateIt } from '@/lib/format';
import { SITE_URL } from '@/lib/env';

export const revalidate = 60;

export default async function Home() {
  const [banners, recent, featured, posts, wish, settings, cats] = await Promise.all([
    getBanners(), getProducts({ limit: 40 }), getProducts({ featured: true, limit: 24 }), getPosts(3, true), getWishlistIds(), getSettings(), getCategories()
  ]);
  const fresh = recent.filter((p) => p.is_new && p.images?.length);
  const latest = fresh.slice(0, 4);
  const latestAbb = fresh.filter((p) => p.type === 'clothing').slice(0, 4);
  const latestCos = fresh.filter((p) => p.type === 'cosmetic').slice(0, 4);
  const grid = (list: typeof recent) => <div className="grid">{list.map((p, i) => <ProductCard key={p.id} p={p} wished={wish.has(p.id)} priority={i < 2} />)}</div>;
  const subs = (macro: string) => <div className="subs">{cats.filter((c) => c.macro === macro).slice(0, 5).map((c) => <span key={c.id}>{c.name}</span>)}</div>;
  const hero = banners[0];
  const promo = banners[1];
  const featCos = featured.filter((p) => p.type === 'cosmetic').slice(0, 4);
  const featAbb = featured.filter((p) => p.type === 'clothing').slice(0, 4);
  const jsonLd = { '@context': 'https://schema.org', '@type': 'Organization', name: 'Alana Beauty', url: SITE_URL };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="hero"><div className="wrap"><div className="hbox">
        <div className="ht">
          <span className="k">{hero?.kicker || 'Nuova collezione'}</span>
          <h1 className="H">{hero?.title || 'Nuova stagione. Nuova te.'}</h1>
          <p>{hero?.subtitle || `Abiti, maglieria e la tua beauty routine in un unico posto. Spedizione gratuita sopra ${eur(settings.free_shipping_threshold_cents)}.`}</p>
          <div className="bts"><Link href={hero?.link || '/abbigliamento'} className="btn">{hero?.cta || 'Shop abbigliamento'}</Link><Link href="/cosmetici" className="btn ghost">Shop cosmetici</Link></div>
          {banners.length > 1 && <div className="dots" aria-hidden><i className="on" />{banners.slice(1).map((b) => <i key={b.id} />)}</div>}
        </div>
        <div className="hi">
          {hero?.image_url && <span className="h1"><Image src={hero.image_url} alt="" fill priority sizes="(max-width:1000px) 100vw, 30vw" style={{ objectFit: 'cover' }} /></span>}
          {hero?.image2_url && <span className="h2"><Image src={hero.image2_url} alt="" fill sizes="20vw" style={{ objectFit: 'cover' }} /></span>}
        </div>
      </div></div></section>

      <section className="perks"><div className="wrap">
        <div className="perk"><I.truck /><span><b>Spedizione gratuita</b>sopra {eur(settings.free_shipping_threshold_cents)} in tutta Italia</span></div>
        <div className="perk"><I.ret /><span><b>Resi e cambi facili</b>entro 14 giorni dall&apos;area cliente</span></div>
        <div className="perk"><I.lock /><span><b>Pagamenti sicuri</b>Carta, Apple Pay, Google Pay, PayPal</span></div>
        <div className="perk"><I.leaf /><span><b>Cosmetici a norma UE</b>etichetta e ingredienti in italiano</span></div>
      </div></section>

      <section className="macro"><div className="wrap">
        <Link href="/abbigliamento" className="mtile"><Image src="/img/abbigliamento.jpg" alt="" fill sizes="(max-width:600px) 100vw, 50vw" style={{ objectFit: 'cover', objectPosition: 'center 40%' }} /><div className="tx"><span className="k" style={{ color: '#fff' }}>Abbigliamento donna</span><h2 className="H">Il tuo stile, ogni giorno</h2>{subs('abbigliamento')}<span className="btn">Scopri</span></div></Link>
        <Link href="/cosmetici" className="mtile"><Image src="/img/cosmetici.jpg" alt="" fill sizes="(max-width:600px) 100vw, 50vw" style={{ objectFit: 'cover' }} /><div className="tx"><span className="k" style={{ color: '#fff' }}>Cosmetici</span><h2 className="H">Skincare e make-up</h2>{subs('cosmetici')}<span className="btn">Scopri</span></div></Link>
      </div></section>

      {latest.length > 0 && <section className="shelf"><div className="wrap">
        <ShelfTabs title="Novità della settimana" link={<Link className="lnk" href="/novita">Vedi tutte</Link>}
          tabs={[{ key: 'all', label: 'Tutto', node: grid(latest) }, { key: 'abb', label: 'Abbigliamento', node: grid(latestAbb) }, { key: 'cos', label: 'Cosmetici', node: grid(latestCos) }]} />
      </div></section>}

      {promo && <section className="band"><div className="wrap"><div className="box">
        <div className="tx"><span className="k">{promo.kicker || 'Promo'}</span><h2 className="H">{promo.title}</h2>{promo.subtitle && <p>{promo.subtitle}</p>}{promo.promo_code && <span className="code">{promo.promo_code}</span>}<Link href={promo.link || '/promo'} className="btn lnkbtn">{promo.cta || 'Scopri'}</Link></div>
        <div className="bimg"><Image src={promo.image_url} alt="" fill sizes="(max-width:600px) 100vw, 55vw" style={{ objectFit: 'cover' }} /></div>
      </div></div></section>}

      {featCos.length > 0 && <section className="shelf"><div className="wrap">
        <div className="sec-h"><h2 className="H">Più amati: cosmetici</h2><Link className="lnk" href="/cosmetici">Tutti i cosmetici</Link></div>
        <div className="grid">{featCos.map((p) => <ProductCard key={p.id} p={p} wished={wish.has(p.id)} />)}</div>
      </div></section>}

      {featAbb.length > 0 && <section className="shelf"><div className="wrap">
        <div className="sec-h"><h2 className="H">In evidenza: abiti</h2><Link className="lnk" href="/abbigliamento">Tutto l&apos;abbigliamento</Link></div>
        <div className="grid">{featAbb.map((p) => <ProductCard key={p.id} p={p} wished={wish.has(p.id)} />)}</div>
      </div></section>}

      {posts.length > 0 && <section className="shelf blogs"><div className="wrap">
        <div className="sec-h"><h2 className="H">Beauty blog</h2><Link className="lnk" href="/blog">Tutti gli articoli</Link></div>
        <div className="grid">{posts.map((b) => (
          <Link key={b.id} href={`/blog/${b.slug}`} className="post">
            <div className="pi" style={{ position: 'relative' }}>{b.cover_url && <Image src={b.cover_url} alt="" fill sizes="(max-width:600px) 100vw, 33vw" style={{ objectFit: 'cover' }} />}</div>
            <span className="k">{b.category || 'Beauty'} · {b.published_at ? dateIt(b.published_at) : ''}</span><h3 className="H">{b.title}</h3>{b.excerpt && <p>{b.excerpt}</p>}
          </Link>))}</div>
      </div></section>}
    </>
  );
}
