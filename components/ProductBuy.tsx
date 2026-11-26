'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useCart } from './cart';
import { I } from './icons';
import { WishButton } from './WishButton';
import { Msg, Submit, useForm } from './forms';
import { joinWaitlist } from '@/app/actions';
import { eur, sortSizes, unitPrice } from '@/lib/format';
import { I as Icons } from './icons';
import type { Product, Variant } from '@/lib/types';

export function ProductBuy({ p, wished }: { p: Product; wished: boolean }) {
  const variants = p.variants || [];
  const cart = useCart();
  const colors = [...new Map(variants.filter((v) => v.color_name).map((v) => [v.color_name!, v.color_hex])).entries()];
  const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean) as string[])].sort(sortSizes);
  const formats = [...new Set(variants.map((v) => v.format).filter(Boolean) as string[])];
  const firstAvail = variants.find((v) => v.stock > 0) || variants[0];
  const [color, setColor] = useState<string | null>(firstAvail?.color_name ?? null);
  const [size, setSize] = useState<string | null>(sizes.length > 1 ? null : firstAvail?.size ?? null);
  const [format, setFormat] = useState<string | null>(firstAvail?.format ?? null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [wl, wlAction] = useForm(joinWaitlist);

  const match = (v: Variant, c = color, s = size, f = format) => (!colors.length || v.color_name === c) && (!sizes.length || v.size === s) && (!formats.length || v.format === f);
  const selected = useMemo(() => variants.find((v) => match(v)) ?? null, [variants, color, size, format]); // eslint-disable-line react-hooks/exhaustive-deps
  const needSize = sizes.length > 0 && !size;
  const price = selected?.price_cents ?? p.price_cents;
  const out = !!selected && selected.stock <= 0;

  const add = () => {
    if (!selected || out) return;
    cart.add(selected.id, Math.min(qty, selected.stock));
    setAdded(true); setTimeout(() => setAdded(false), 4000);
  };

  return (
    <>
      <div className={`price${p.compare_at_cents && p.compare_at_cents > price ? ' sale' : ''}`}>
        <b>{eur(price)}</b>
        {p.compare_at_cents && p.compare_at_cents > price && <><s>{eur(p.compare_at_cents)}</s><em>-{Math.round((1 - price / p.compare_at_cents) * 100)}%</em></>}
        {p.type === 'cosmetic' && unitPrice(price, selected?.format) && <span className="upr">{unitPrice(price, selected?.format)}</span>}
      </div>
      {p.claims && <div className="claims">{p.claims.split(',').map((c) => c.trim()).filter(Boolean).map((c) => <span key={c}><Icons.check />{c}</span>)}</div>}

      {colors.length > 0 && <div className="opt"><b>Colore: {color} <span>{colors.length > 1 ? `${colors.length} colori` : ''}</span></b>
        <div className="cols">{colors.map(([name, hex]) => <button key={name} type="button" className={color === name ? 'on' : ''} style={{ background: hex || '#ddd' }} aria-label={name} aria-pressed={color === name} onClick={() => setColor(name)} />)}</div></div>}

      {sizes.length > 0 && <div className="opt"><b>Taglia{size ? `: ${size}` : ''}</b>
        <div className="sizes">{sizes.map((s) => {
          const v = variants.find((x) => match(x, color, s, format));
          const off = !v || v.stock <= 0;
          return <button key={s} type="button" className={`${off ? 'off ' : ''}${size === s ? 'on' : ''}`} aria-pressed={size === s} aria-label={`Taglia ${s}${off ? ', esaurita' : ''}`} onClick={() => setSize(s)}>{s}</button>;
        })}</div></div>}

      {formats.length > 0 && <div className="opt"><b>Formato</b>
        <div className="fmts">{formats.map((f) => {
          const v = variants.find((x) => match(x, color, size, f));
          return <button key={f} type="button" className={`${format === f ? 'on' : ''}${v && v.stock <= 0 ? ' off' : ''}`} aria-pressed={format === f} onClick={() => setFormat(f)}><b>{f}</b>{eur(v?.price_cents ?? p.price_cents)}{v && v.stock <= 0 ? ' · esaurito' : ''}</button>;
        })}</div></div>}

      {out && selected && (
        <form className="notify" action={wlAction}>
          <div className="nt"><I.bell /><span><b>{[selected.color_name, selected.size && `Taglia ${selected.size}`, selected.format].filter(Boolean).join(' · ')} esaurito.</b> Lasciaci la tua email: ti scriviamo appena torna disponibile.</span></div>
          <input type="hidden" name="variantId" value={selected.id} />
          <div className="nrow"><input className="inp" type="email" name="email" required placeholder="La tua email" aria-label="La tua email" /><Submit>Avvisami</Submit></div>
          <label className="cons" style={{ opacity: 1, color: 'var(--muted)' }}><input type="checkbox" name="consent" required style={{ width: 18, height: 18, margin: 0 }} />Accetto di ricevere l&apos;avviso di disponibilità per questo prodotto (<Link href="/privacy" style={{ textDecoration: 'underline' }}>informativa privacy</Link>)</label>
          <Msg state={wl} />
        </form>
      )}

      <div className="buy">
        <span className="qty"><button type="button" aria-label="Meno" onClick={() => setQty((q) => Math.max(1, q - 1))}><I.minus width={20} height={20} /></button>{qty}<button type="button" aria-label="Più" onClick={() => setQty((q) => Math.min(q + 1, selected?.stock || 1, 20))}><I.plus width={20} height={20} /></button></span>
        <button type="button" className={`btn${needSize ? ' need' : ''}`} disabled={!needSize && (!selected || out)} onClick={() => { if (needSize) { document.querySelector('.pinfo .sizes')?.classList.add('ask'); return; } add(); }}><I.bag />{needSize ? 'Scegli la taglia' : out ? 'Esaurito' : added ? 'Aggiunto!' : 'Aggiungi al carrello'}</button>
        <WishButton productId={p.id} initial={wished} className="wbtn" />
      </div>
      {added && <p className="okmsg" role="status">Aggiunto al carrello. <Link href="/carrello" style={{ textDecoration: 'underline' }}>Vai al carrello</Link></p>}
    </>
  );
}
