'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const KEY = 'alana_cookie_consent';
/** Il sito usa solo cookie tecnici. La scelta viene salvata per eventuali strumenti futuri (es. statistiche), che partiranno solo con "Accetta". */
export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => { try { if (!localStorage.getItem(KEY)) setShow(true); } catch { /* ignora */ } }, []);
  const choose = (v: 'all' | 'necessary') => { try { localStorage.setItem(KEY, JSON.stringify({ v, at: new Date().toISOString() })); } catch { /* ignora */ } setShow(false); };
  if (!show) return null;
  return (
    <div className="cookie" role="dialog" aria-label="Preferenze cookie">
      <p>Usiamo cookie tecnici necessari al funzionamento del sito (accesso, carrello, pagamenti). Con il tuo consenso potremo usare anche cookie statistici. <Link href="/cookie-policy">Cookie policy</Link></p>
      <div className="bt"><button className="btn ghost" onClick={() => choose('necessary')}>Solo necessari</button><button className="btn acc" onClick={() => choose('all')}>Accetta</button></div>
    </div>
  );
}
