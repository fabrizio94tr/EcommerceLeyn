'use client';
import { usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toggleWishlist } from '@/app/actions';
import { I } from './icons';

export function WishButton({ productId, initial, className = 'wish' }: { productId: string; initial: boolean; className?: string }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  const path = usePathname();
  return (
    <button type="button" className={`${className}${on ? ' on' : ''}`} aria-pressed={on} aria-label={on ? 'Togli dai preferiti' : 'Aggiungi ai preferiti'} disabled={pending}
      onClick={() => start(async () => { setOn(await toggleWishlist(productId, path)); })}>
      {on ? <I.heartf /> : <I.heart />}
    </button>
  );
}
