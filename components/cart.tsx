'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface CartItem { variantId: string; qty: number }
interface Ctx { items: CartItem[]; count: number; ready: boolean; add: (variantId: string, qty?: number) => void; set: (variantId: string, qty: number) => void; remove: (variantId: string) => void; clear: () => void; replace: (items: CartItem[]) => void }

const CartCtx = createContext<Ctx | null>(null);
const KEY = 'alana_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setItems(JSON.parse(raw)); } catch { /* storage non disponibile */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignora */ } } }, [items, ready]);

  const add = useCallback((variantId: string, qty = 1) => setItems((cur) => {
    const ex = cur.find((i) => i.variantId === variantId);
    return ex ? cur.map((i) => (i.variantId === variantId ? { ...i, qty: Math.min(i.qty + qty, 20) } : i)) : [...cur, { variantId, qty }];
  }), []);
  const set = useCallback((variantId: string, qty: number) => setItems((cur) => (qty <= 0 ? cur.filter((i) => i.variantId !== variantId) : cur.map((i) => (i.variantId === variantId ? { ...i, qty: Math.min(qty, 20) } : i)))), []);
  const remove = useCallback((variantId: string) => setItems((cur) => cur.filter((i) => i.variantId !== variantId)), []);
  const clear = useCallback(() => setItems([]), []);
  const replace = useCallback((next: CartItem[]) => setItems(next), []);
  const value = useMemo(() => ({ items, count: items.reduce((t, i) => t + i.qty, 0), ready, add, set, remove, clear, replace }), [items, ready, add, set, remove, clear, replace]);
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error('useCart fuori da CartProvider');
  return c;
}
