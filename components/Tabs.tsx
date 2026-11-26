'use client';
import { useState } from 'react';

/** Schede "Tutto / Abbigliamento / Cosmetici" della vetrina Novità. */
export function ShelfTabs({ title, link, tabs }: { title: string; link: React.ReactNode; tabs: { key: string; label: string; node: React.ReactNode }[] }) {
  const [cur, setCur] = useState(tabs[0]?.key);
  return (
    <>
      <div className="sec-h"><h2 className="H">{title}</h2>
        <div className="tabs" role="tablist">{tabs.map((t) => <button key={t.key} type="button" role="tab" aria-selected={cur === t.key} onClick={() => setCur(t.key)}><span className={cur === t.key ? 'on' : ''}>{t.label}</span></button>)}</div>
        {link}</div>
      {tabs.map((t) => <div key={t.key} hidden={cur !== t.key}>{t.node}</div>)}
    </>
  );
}
