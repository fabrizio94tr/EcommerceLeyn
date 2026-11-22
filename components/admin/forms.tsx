'use client';
import { useActionState, useRef, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import type { ActionState } from '@/app/actions';
import { setOrderStatus, shipOrder, updateReturn } from '@/app/admin/actions';

export function Save({ children = 'Salva', className = 'b' }: { children?: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return <button className={className} disabled={pending}>{pending ? 'Salvo…' : children}</button>;
}
export function Note({ s }: { s: ActionState }) {
  if (!s) return null;
  return s.error ? <p className="msg bad" role="alert">{s.error}</p> : s.message ? <p className="msg ok" role="status">{s.message}</p> : null;
}

export function ShipForm({ id, carrier, tracking, url }: { id: string; carrier?: string | null; tracking?: string | null; url?: string | null }) {
  const [s, action] = useActionState(shipOrder, null);
  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input type="hidden" name="id" value={id} />
      <div className="grid2"><label className="f">Corriere<input name="carrier" defaultValue={carrier || ''} placeholder="Es. BRT, GLS, SDA, Poste" /></label><label className="f">Codice di tracking<input name="tracking_number" defaultValue={tracking || ''} required /></label></div>
      <label className="f">Link per seguire il pacco (facoltativo)<input name="tracking_url" type="url" defaultValue={url || ''} placeholder="https://…" /></label>
      <small className="note">Quando salvi, la cliente riceve l&apos;email &quot;Il tuo ordine è partito&quot; con il tracking.</small>
      <Note s={s} />
      <Save>{tracking ? 'Aggiorna tracking' : 'Segna come spedito'}</Save>
    </form>
  );
}

export function StatusButtons({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const go = (st: 'delivered' | 'cancelled' | 'refunded', msg: string) => { if (confirm(msg)) start(() => setOrderStatus(id, st)); };
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {status === 'shipped' && <button className="b g" disabled={pending} onClick={() => go('delivered', 'Segnare l\'ordine come consegnato?')}>Segna consegnato</button>}
      {status === 'paid' && <button className="b g" disabled={pending} onClick={() => go('cancelled', 'Annullare l\'ordine? I pezzi tornano in magazzino. Il rimborso va fatto da Stripe o PayPal.')}>Annulla ordine</button>}
      {['shipped', 'delivered', 'cancelled'].includes(status) && <button className="b g" disabled={pending} onClick={() => go('refunded', 'Segnare come rimborsato? Ricorda di fare il rimborso da Stripe o PayPal.')}>Segna rimborsato</button>}
    </div>
  );
}

export function ReturnActions({ id, status, note }: { id: string; status: string; note: string | null }) {
  const [s, action] = useActionState(updateReturn, null);
  const statusRef = useRef<HTMLInputElement>(null);
  const next: [string, string, string][] = status === 'requested' ? [['approved', 'Approva e invia istruzioni', 'b'], ['rejected', 'Rifiuta', 'b g']]
    : status === 'approved' ? [['received', 'Pacco ricevuto', 'b']] : status === 'received' ? [['completed', 'Chiudi (rimborsato o cambio spedito)', 'b']] : [];
  if (!next.length) return note ? <p className="note">Nota: {note}</p> : null;
  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" ref={statusRef} defaultValue="" />
      <label className="f">Messaggio per la cliente (facoltativo)<textarea name="admin_note" defaultValue={note || ''} placeholder="Es. spedisci il pacco a: … con il numero di reso scritto sul pacco" /></label>
      <Note s={s} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{next.map(([st, l, c]) => <button key={st} value={st} className={c} onClick={() => { if (statusRef.current) statusRef.current.value = st; }}>{l}</button>)}</div>
    </form>
  );
}
