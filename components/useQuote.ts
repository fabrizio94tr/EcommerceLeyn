'use client';
import { useEffect, useState } from 'react';
import { quoteCart } from '@/app/actions';
import type { CartItem } from './cart';

export type QuoteResult = Awaited<ReturnType<typeof quoteCart>>;
export const COUPON_KEY = 'alana_coupon';

/** Chiede al server i prezzi aggiornati del carrello (mai fidarsi del browser). */
export function useQuote(items: CartItem[], ready: boolean, coupon: string | null, email?: string) {
  const [q, setQ] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(items) + '|' + (coupon || '') + '|' + (email || '');
  useEffect(() => {
    if (!ready) return;
    let live = true;
    setLoading(true);
    quoteCart(items, coupon, email || null).then((r) => { if (live) { setQ(r); setLoading(false); } }).catch(() => live && setLoading(false));
    return () => { live = false; };
  }, [key, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  return { q, loading };
}
