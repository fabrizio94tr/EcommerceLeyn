'use client';
import { useRouter, usePathname } from 'next/navigation';

/** Form GET dei filtri: si aggiorna a ogni scelta, senza pulsante. */
export function AutoForm({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  const router = useRouter();
  const path = usePathname();
  const go = (form: HTMLFormElement) => {
    const params = new URLSearchParams();
    new FormData(form).forEach((v, k) => { if (String(v) !== '') params.append(k, String(v)); });
    router.push(`${path}?${params.toString()}`, { scroll: false });
  };
  return (
    <form id={id} className={className} onChange={(e) => go(e.currentTarget)} onSubmit={(e) => { e.preventDefault(); go(e.currentTarget); }}>
      {children}
    </form>
  );
}
