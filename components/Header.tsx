'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { I } from './icons';
import { Logo } from './Logo';
import { useCart } from './cart';
import type { Category } from '@/lib/types';

const NAV = [
  { href: '/abbigliamento', label: 'Abbigliamento' },
  { href: '/cosmetici', label: 'Cosmetici' },
  { href: '/novita', label: 'Novità' },
  { href: '/promo', label: 'Promo' },
  { href: '/blog', label: 'Beauty blog' }
];

export function Header({ categories, freeShipping, wishCount, loggedIn }: { categories: Category[]; freeShipping: string; wishCount: number; loggedIn: boolean }) {
  const { count } = useCart();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  useEffect(() => setOpen(false), [path]);
  const search = (e: React.FormEvent) => { e.preventDefault(); if (q.trim()) router.push(`/cerca?q=${encodeURIComponent(q.trim())}`); };

  return (
    <>
      <div className="topbar"><div className="wrap"><span>Spedizione gratuita sopra {freeShipping}</span><span className="tb2">-10% sul primo ordine con la newsletter</span><span className="tb3">Resi e cambi entro 14 giorni</span></div></div>
      <header className="hd"><div className="wrap">
        <button className="mmenu" aria-label="Apri il menu" onClick={() => setOpen(true)}><I.menu /></button>
        <nav className="mainnav" aria-label="Menu principale">
          {NAV.map((n) => <Link key={n.href} href={n.href} className={path.startsWith(n.href) ? 'on' : ''}>{n.label}</Link>)}
        </nav>
        <Logo />
        <span className="acts">
          <Link href="/cerca" className="ic ms" aria-label="Cerca"><I.search /></Link>
          <Link href={loggedIn ? '/account' : '/accedi'} className="ic ac" aria-label={loggedIn ? 'Il mio account' : 'Accedi'}><I.user /></Link>
          <Link href="/account?tab=preferiti" className="ic wl" aria-label="Preferiti"><I.heart />{wishCount > 0 && <em>{wishCount}</em>}</Link>
          <Link href="/carrello" className="ic cart" aria-label={`Carrello, ${count} articoli`}><I.bag />{count > 0 && <em>{count}</em>}</Link>
        </span>
      </div></header>
      {open && (
        <div className="drawer" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="scrim" onClick={() => setOpen(false)} />
          <nav>
            <button onClick={() => setOpen(false)} aria-label="Chiudi il menu" style={{ alignSelf: 'flex-end', width: 28, height: 28 }}><I.close /></button>
            <form onSubmit={search} role="search"><input className="inp" style={{ height: 46, padding: '0 14px' }} placeholder="Cerca abiti, sieri, rossetti…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cerca" /><button className="btn sm" type="submit">Cerca</button></form>
            <Link href="/abbigliamento">Abbigliamento</Link>
            {categories.filter((c) => c.macro === 'abbigliamento').map((c) => <Link key={c.id} className="sub" href={`/abbigliamento?sub=${c.slug}`}>{c.name}</Link>)}
            <Link href="/cosmetici">Cosmetici</Link>
            {categories.filter((c) => c.macro === 'cosmetici').map((c) => <Link key={c.id} className="sub" href={`/cosmetici?sub=${c.slug}`}>{c.name}</Link>)}
            <Link href="/novita">Novità</Link>
            <Link href="/promo">Promo</Link>
            <Link href="/blog">Beauty blog</Link>
            <Link href={loggedIn ? '/account' : '/accedi'}>{loggedIn ? 'Il mio account' : 'Accedi o registrati'}</Link>
          </nav>
        </div>
      )}
    </>
  );
}
