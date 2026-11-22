'use client';
import { useEffect } from 'react';
import { useCart } from './cart';
import { COUPON_KEY } from './useQuote';

export function ClearCart() {
  const { clear, ready } = useCart();
  useEffect(() => { if (ready) { clear(); try { localStorage.removeItem(COUPON_KEY); } catch { /* ignora */ } } }, [ready, clear]);
  return null;
}
