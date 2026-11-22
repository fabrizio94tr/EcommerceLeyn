import Link from 'next/link';

export function Logo({ href = '/', tag }: { href?: string; tag?: string }) {
  return (
    <Link href={href} className="logo" aria-label="Alana Beauty, vai alla home">
      <span className="lw">ALANA</span>
      <span className="ls">— BEAUTY —</span>
      {tag && <span className="tag">{tag}</span>}
    </Link>
  );
}
