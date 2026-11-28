'use client';
import { useRef, useState } from 'react';

/** Prezzo: barra con due cursori e due campi sincronizzati. Applica al rilascio o con Invio. */
export function PriceRange({ bound, lo, hi }: { bound: number; lo: number; hi: number }) {
  const top = Math.max(10, Math.ceil(bound / 10) * 10);
  const [a, setA] = useState(lo || 0);
  const [b, setB] = useState(hi || top);
  const ref = useRef<HTMLDivElement>(null);
  const apply = () => ref.current?.closest('form')?.requestSubmit();
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const pct = (v: number) => `${(v / top) * 100}%`;
  return (
    <div className="prange" ref={ref} onChange={stop}>
      <input type="hidden" name="min" value={a > 0 ? a : ''} />
      <input type="hidden" name="max" value={b < top ? b : ''} />
      <div className="track"><i style={{ left: pct(a), right: `calc(100% - ${pct(b)})` }} />
        <input type="range" min={0} max={top} step={1} value={a} aria-label="Prezzo minimo" onChange={(e) => setA(Math.min(Number(e.target.value), b - 1))} onPointerUp={apply} onKeyUp={(e) => e.key.startsWith('Arrow') && apply()} />
        <input type="range" min={0} max={top} step={1} value={b} aria-label="Prezzo massimo" onChange={(e) => setB(Math.max(Number(e.target.value), a + 1))} onPointerUp={apply} onKeyUp={(e) => e.key.startsWith('Arrow') && apply()} />
      </div>
      <div className="prices">
        <label>da € <input className="inp" type="number" min={0} max={top} value={a} onChange={(e) => setA(Math.max(0, Number(e.target.value) || 0))} onBlur={apply} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } }} aria-label="Prezzo minimo in euro" /></label>
        <label>a € <input className="inp" type="number" min={0} max={top} value={b} onChange={(e) => setB(Number(e.target.value) || 0)} onBlur={apply} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } }} aria-label="Prezzo massimo in euro" /></label>
      </div>
    </div>
  );
}
