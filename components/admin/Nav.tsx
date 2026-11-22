'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV: [string, string, string?][] = [
  ['/admin', 'Panoramica'], ['/admin/ordini', 'Ordini', 'ord'], ['/admin/prodotti', 'Prodotti'], ['/admin/magazzino', 'Magazzino', 'mag'],
  ['/admin/categorie', 'Categorie'], ['/admin/promozioni', 'Promozioni e coupon'], ['/admin/resi', 'Resi e cambi', 'ret'], ['/admin/blog', 'Blog']
];

export function AdminNav({ badges, name }: { badges: Record<string, number>; name: string }) {
  const p = usePathname();
  const on = (h: string) => (h === '/admin' ? p === '/admin' : p.startsWith(h));
  return (
    <aside className="sb">
      <Link href="/admin" className="logo"><span className="lw">ALANA</span><span className="ls">— BEAUTY —</span><span className="tag">Gestione negozio</span></Link>
      {NAV.map(([h, l, b], i) => (
        <span key={h} style={{ display: 'contents' }}>
          <Link href={h} className={on(h) ? 'on' : ''}>{l}{b && badges[b] ? <em>{badges[b]}</em> : null}</Link>
          {i === 4 && <span className="sep" />}
        </span>
      ))}
      <span className="sep" />
      <Link href="/" target="_blank">Vedi il negozio ↗</Link>
      <div className="me"><i>{(name || 'A')[0].toUpperCase()}</i><span><b>{name || 'Titolare'}</b><br />Amministratrice</span></div>
    </aside>
  );
}
