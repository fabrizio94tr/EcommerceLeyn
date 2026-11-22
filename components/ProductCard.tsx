import Image from 'next/image';
import Link from 'next/link';
import { eur, discountPct } from '@/lib/format';
import type { Product } from '@/lib/types';
import { WishButton } from './WishButton';

export function ProductCard({ p, wished = false, priority = false }: { p: Product; wished?: boolean; priority?: boolean }) {
  const img = p.images?.[0];
  const pct = discountPct(p.price_cents, p.compare_at_cents);
  const colors = [...new Map((p.variants || []).filter((v) => v.color_hex).map((v) => [v.color_hex, v.color_name])).entries()];
  const formats = [...new Set((p.variants || []).map((v) => v.format).filter(Boolean))];
  const minPrice = Math.min(p.price_cents, ...(p.variants || []).map((v) => v.price_cents ?? p.price_cents));
  const multiPrice = (p.variants || []).some((v) => v.price_cents && v.price_cents !== p.price_cents);
  return (
    <article className="card">
      <div className="im">
        {img ? <Image src={img.url} alt={img.alt || p.name} fill sizes="(max-width:600px) 50vw, (max-width:1000px) 33vw, 25vw" style={{ objectFit: 'cover' }} priority={priority} /> : null}
        {pct > 0 ? <span className="pill sale">-{pct}%</span> : p.is_new ? <span className="pill new">Novità</span> : null}
        <WishButton productId={p.id} initial={wished} />
      </div>
      <div className="cb">
        <span className="ct">{p.category?.name}{p.type === 'cosmetic' && formats[0] ? ` · ${formats[0]}` : ''}</span>
        <span className="nm">{p.name}</span>
        <span className={`pr${pct ? ' sale' : ''}`}><b>{multiPrice ? 'da ' : ''}{eur(minPrice)}</b>{pct > 0 && p.compare_at_cents && <s>{eur(p.compare_at_cents)}</s>}</span>
        {colors.length > 0 && <span className="sw">{colors.map(([hex, name]) => <i key={hex} style={{ background: hex! }} title={name || ''} />)}</span>}
      </div>
      <Link href={`/prodotto/${p.slug}`} className="cl" aria-label={p.name} />
    </article>
  );
}
