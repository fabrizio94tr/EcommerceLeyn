import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPost, getPosts, getProduct, getWishlistIds } from '@/lib/data';
import { renderMarkdown, headings } from '@/lib/markdown';
import { ProductCard } from '@/components/ProductCard';
import { dateIt, eur } from '@/lib/format';
import { SITE_URL } from '@/lib/env';

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPost((await params).slug);
  if (!p) return {};
  return { title: p.seo_title || p.title, description: p.seo_description || p.excerpt || undefined, alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { type: 'article', title: p.seo_title || p.title, description: p.seo_description || p.excerpt || undefined, images: p.cover_url ? [p.cover_url] : undefined } };
}

export default async function Post({ params }: Props) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  const blocks = renderMarkdown(post.body);
  const slugs = blocks.filter((b) => b.kind === 'product').map((b) => (b as { slug: string }).slug);
  const [prods, others, wish] = await Promise.all([Promise.all(slugs.map((s) => getProduct(s))), getPosts(3), getWishlistIds()]);
  const bySlug = new Map(prods.filter(Boolean).map((p) => [p!.slug, p!]));
  const toc = headings(post.body);
  const ld = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, datePublished: post.published_at, image: post.cover_url, author: { '@type': 'Organization', name: 'Alana Beauty' }, mainEntityOfPage: `${SITE_URL}/blog/${post.slug}` };

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="art-h"><span className="k">Beauty blog{post.category ? ` · ${post.category}` : ''}</span><h1 className="H">{post.title}</h1>{post.excerpt && <p>{post.excerpt}</p>}<span className="by">Alana Beauty{post.published_at ? ` · ${dateIt(post.published_at)}` : ''}</span></div>
      {post.cover_url && <div className="art-img" style={{ position: 'relative' }}><Image src={post.cover_url} alt="" fill priority sizes="100vw" style={{ objectFit: 'cover' }} /></div>}
      <div className="art">
        <nav className="toc">{toc.length > 0 && <><b>In questo articolo</b>{toc.map((t) => <span key={t}>{t}</span>)}</>}</nav>
        <div className="body body-md">{blocks.map((b, i) => {
          if (b.kind === 'html') return <div key={i} dangerouslySetInnerHTML={{ __html: b.html }} />;
          const p = bySlug.get(b.slug);
          if (!p) return null;
          return <div className="inl" key={i}>{p.images?.[0] && <img src={p.images[0].url} alt="" />}<span><b>{p.name}</b>{p.category?.name} · {eur(p.price_cents)}</span><Link className="btn" href={`/prodotto/${p.slug}`}>Scopri</Link></div>;
        })}</div>
        <aside className="side2"><b className="k">Leggi anche</b>{others.filter((o) => o.id !== post.id).slice(0, 2).map((o) => (
          <Link key={o.id} href={`/blog/${o.slug}`} className="post"><div className="pi" style={{ position: 'relative' }}>{o.cover_url && <Image src={o.cover_url} alt="" fill sizes="300px" style={{ objectFit: 'cover' }} />}</div><h3 className="H">{o.title}</h3></Link>))}</aside>
      </div>
      {bySlug.size > 0 && <section className="shelf"><div className="sec-h"><h2 className="H">I prodotti dell&apos;articolo</h2></div><div className="grid">{[...bySlug.values()].map((p) => <ProductCard key={p.id} p={p} wished={wish.has(p.id)} />)}</div></section>}
    </div>
  );
}
