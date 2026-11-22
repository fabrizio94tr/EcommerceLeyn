import Image from 'next/image';
import Link from 'next/link';
import { getPosts } from '@/lib/data';
import { dateIt } from '@/lib/format';

export const metadata = { title: 'Beauty blog', description: 'Consigli di skincare, make-up e stile.', alternates: { canonical: '/blog' } };
export const revalidate = 300;

export default async function Blog() {
  const posts = await getPosts();
  return (
    <div className="wrap">
      <div className="plp-h" style={{ paddingTop: 30 }}><h1 className="H">Beauty blog</h1><p>Consigli di skincare, make-up e stile, scritti per te.</p></div>
      {posts.length ? <section className="shelf blogs" style={{ paddingTop: 0 }}><div className="grid">{posts.map((b) => (
        <Link key={b.id} href={`/blog/${b.slug}`} className="post">
          <div className="pi" style={{ position: 'relative' }}>{b.cover_url && <Image src={b.cover_url} alt="" fill sizes="(max-width:600px) 100vw, 33vw" style={{ objectFit: 'cover' }} />}</div>
          <span className="k">{b.category || 'Beauty'}{b.published_at ? ` · ${dateIt(b.published_at)}` : ''}</span><h2 className="H" style={{ fontSize: 19, lineHeight: 1.2 }}>{b.title}</h2>{b.excerpt && <p>{b.excerpt}</p>}
        </Link>))}</div></section> : <div className="empty"><p className="muted">Presto i primi articoli.</p></div>}
    </div>
  );
}
