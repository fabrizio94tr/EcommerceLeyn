'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/components/cart';
import { useQuote, COUPON_KEY } from '@/components/useQuote';
import { Totals } from '@/components/Summary';
import { I } from '@/components/icons';
import { eur } from '@/lib/format';

export function CartView() {
  const cart = useCart();
  const [coupon, setCoupon] = useState<string | null>(null);
  const [input, setInput] = useState('');
  useEffect(() => { try { setCoupon(localStorage.getItem(COUPON_KEY)); } catch { /* ignora */ } }, []);
  const { q, loading } = useQuote(cart.items, cart.ready, coupon);

  // allinea il carrello locale con quanto il server conferma (prodotti esauriti o quantità ridotte)
  useEffect(() => {
    if (!q || loading) return;
    const ok = q.lines.map((l) => ({ variantId: l.variantId, qty: l.qty }));
    if (JSON.stringify(ok) !== JSON.stringify(cart.items)) cart.replace(ok);
  }, [q, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const apply = (code: string | null) => { setCoupon(code); try { code ? localStorage.setItem(COUPON_KEY, code) : localStorage.removeItem(COUPON_KEY); } catch { /* ignora */ } };

  if (cart.ready && !cart.items.length) return (
    <div className="wrap"><div className="empty"><h1 className="H">Il carrello è vuoto</h1><p className="muted">Scopri le novità di abbigliamento e cosmetici.</p>
      <div className="bts" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}><Link href="/abbigliamento" className="btn">Abbigliamento</Link><Link href="/cosmetici" className="btn ghost">Cosmetici</Link></div></div></div>
  );

  return (
    <div className="wrap">
      <div className="cartpage">
        <div>
          <div className="co-h"><h1 className="H">Carrello</h1></div>
          {q?.problems.map((p) => <p key={p} className="alert bad" style={{ marginTop: 12 }}>{p}</p>)}
          <div className="lines">
            {!q && <p className="muted" style={{ padding: '30px 0' }}>Carico il carrello…</p>}
            {q?.lines.map((l) => (
              <div className="cline" key={l.variantId}>
                <Link href={`/prodotto/${l.slug}`}>{l.image && <img src={l.image} alt="" />}</Link>
                <div className="t">
                  <Link href={`/prodotto/${l.slug}`}><b>{l.name}</b></Link><span>{l.variantLabel}</span><span>{eur(l.unitCents)}</span>
                  <span className="qty" style={{ alignSelf: 'flex-start' }}>
                    <button type="button" aria-label="Meno" onClick={() => cart.set(l.variantId, l.qty - 1)}><I.minus width={18} height={18} /></button>{l.qty}
                    <button type="button" aria-label="Più" disabled={l.qty >= l.stock} onClick={() => cart.set(l.variantId, l.qty + 1)}><I.plus width={18} height={18} /></button>
                  </span>
                  <button type="button" className="rm" onClick={() => cart.remove(l.variantId)}>Rimuovi</button>
                </div>
                <b>{eur(l.unitCents * l.qty)}</b>
              </div>
            ))}
          </div>
        </div>
        <aside className="sum">
          <h3>Riepilogo</h3>
          {q && q.shipping > 0 && <p className="muted" style={{ margin: 0, fontSize: 14 }}>Spedizione gratuita per ordini sopra {eur(q.freeThreshold)}.</p>}
          <form className="coupon" onSubmit={(e) => { e.preventDefault(); if (input.trim()) apply(input.trim().toUpperCase()); }}>
            <input className="inp" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Codice sconto" aria-label="Codice sconto" style={{ padding: '0 14px' }} />
            <button className="btn ghost" type="submit">Applica</button>
          </form>
          {q?.couponCode && <div className="applied"><span>{q.couponCode} applicato</span><button type="button" onClick={() => apply(null)} aria-label="Togli il codice">✕</button></div>}
          {coupon && q?.couponError && <p className="err">{q.couponError}</p>}
          {q && <Totals q={q} />}
          <Link href="/checkout" className="btn full" aria-disabled={!q?.lines.length}><I.lock />Vai al pagamento</Link>
          <span className="secure"><I.lock />Pagamento protetto · Stripe e PayPal</span>
        </aside>
      </div>
    </div>
  );
}
