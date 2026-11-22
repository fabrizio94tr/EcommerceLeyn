'use client';
import Link from 'next/link';
import { subscribeNewsletter } from '@/app/actions';
import { Msg, Submit, useForm } from './forms';

export function Newsletter({ pct }: { pct: number }) {
  const [state, action] = useForm(subscribeNewsletter);
  return (
    <section className="news"><div className="wrap"><div className="nbox">
      <div className="ntx"><span className="k">Newsletter</span><h2 className="H">Iscriviti e ricevi il {pct}% sul primo ordine</h2><p>Novità, consigli beauty e promo riservate. Ti cancelli quando vuoi.</p></div>
      <form className="nform" action={action}>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="sr" aria-hidden />
        <div className="nrow"><input className="inp" type="email" name="email" required placeholder="La tua email" aria-label="La tua email" /><Submit>Iscriviti</Submit></div>
        <label className="cons"><input type="checkbox" name="consent" required style={{ width: 18, height: 18, accentColor: '#0F0E10', margin: 0 }} />Acconsento a ricevere email promozionali (<Link href="/privacy" style={{ textDecoration: 'underline' }}>informativa privacy</Link>)</label>
        <Msg state={state} />
      </form>
    </div></div></section>
  );
}
