'use client';
import { useState, useTransition } from 'react';
import { Msg, Submit, useForm } from './forms';
import { deleteAddress, requestReturn, saveAddress, updateProfile } from '@/app/actions';

export function ReturnForm({ orderId, items }: { orderId: string; items: { id: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('return');
  const [state, action] = useForm(requestReturn);
  if (state?.ok) return <p className="okmsg" style={{ gridColumn: '1/-1' }}>{state.message}</p>;
  if (!open) return <button type="button" className="btn ghost sm" onClick={() => setOpen(true)}>Richiedi reso o cambio</button>;
  return (
    <form action={action} className="fbox" style={{ gridColumn: '1/-1', margin: 0 }}>
      <input type="hidden" name="order_id" value={orderId} />
      <h3>Reso o cambio</h3>
      <div className="seg2">
        <label className="radio" style={{ flex: 1 }}><input type="radio" name="type" value="return" checked={type === 'return'} onChange={() => setType('return')} />Reso e rimborso</label>
        <label className="radio" style={{ flex: 1 }}><input type="radio" name="type" value="exchange" checked={type === 'exchange'} onChange={() => setType('exchange')} />Cambio (taglia o colore)</label>
      </div>
      <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}><legend className="fld" style={{ marginBottom: 6 }}>Quali articoli?</legend>
        {items.map((i) => <label key={i.id} className="chkbox"><input type="checkbox" name="item" value={i.id} />{i.label}</label>)}</fieldset>
      {type === 'exchange' && <label className="fld">Con cosa vuoi cambiarlo?<input className="inp" name="exchange_note" placeholder="Es. stessa giacca in taglia L" /></label>}
      <label className="fld">Motivo<textarea className="inp" name="reason" required placeholder="Es. la taglia è piccola" /></label>
      <Msg state={state} />
      <div className="inline-form"><Submit>Invia richiesta</Submit><button type="button" className="lnk" onClick={() => setOpen(false)}>Annulla</button></div>
    </form>
  );
}

type Addr = { id: string; label: string | null; full_name: string; line1: string; line2: string | null; postal_code: string; city: string; province: string | null; phone: string | null; is_default: boolean };
export function AddressForm({ a, onDone }: { a?: Addr; onDone?: () => void }) {
  const [state, action] = useForm(saveAddress);
  return (
    <form action={action} className="fbox" style={{ margin: 0 }}>
      {a && <input type="hidden" name="id" value={a.id} />}
      <div className="frow"><label className="fld">Etichetta<input className="inp" name="label" defaultValue={a?.label || ''} placeholder="Casa, ufficio…" /></label><label className="fld">Nome e cognome<input className="inp" name="full_name" required defaultValue={a?.full_name} /></label></div>
      <label className="fld">Indirizzo<input className="inp" name="line1" required defaultValue={a?.line1} /></label>
      <label className="fld">Scala, interno, citofono<input className="inp" name="line2" defaultValue={a?.line2 || ''} /></label>
      <div className="frow"><label className="fld">CAP<input className="inp" name="postal_code" required pattern="\d{5}" maxLength={5} defaultValue={a?.postal_code} /></label><label className="fld">Città<input className="inp" name="city" required defaultValue={a?.city} /></label></div>
      <div className="frow"><label className="fld">Provincia<input className="inp" name="province" maxLength={2} defaultValue={a?.province || ''} /></label><label className="fld">Telefono<input className="inp" name="phone" defaultValue={a?.phone || ''} /></label></div>
      <label className="chkbox"><input type="checkbox" name="is_default" defaultChecked={a?.is_default} />Indirizzo predefinito</label>
      <Msg state={state} />
      <div className="inline-form"><Submit>Salva indirizzo</Submit>{onDone && <button type="button" className="lnk" onClick={onDone}>Chiudi</button>}</div>
    </form>
  );
}

export function AddressCard({ a }: { a: Addr }) {
  const [edit, setEdit] = useState(false);
  const [pending, start] = useTransition();
  if (edit) return <AddressForm a={a} onDone={() => setEdit(false)} />;
  return (
    <div className="rbox">
      <h3>{a.label || 'Indirizzo'}{a.is_default ? ' (predefinito)' : ''}<span className="inline-form"><button className="lnk" onClick={() => setEdit(true)}>Modifica</button><button className="lnk" disabled={pending} onClick={() => start(() => deleteAddress(a.id))}>Elimina</button></span></h3>
      <p>{a.full_name}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.postal_code} {a.city}{a.province ? ` (${a.province})` : ''}{a.phone ? <><br />{a.phone}</> : null}</p>
    </div>
  );
}

export function NewAddress() {
  const [open, setOpen] = useState(false);
  return open ? <AddressForm onDone={() => setOpen(false)} /> : <button className="btn ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setOpen(true)}>+ Aggiungi indirizzo</button>;
}

export function ProfileForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const [state, action] = useForm(updateProfile);
  return (
    <form action={action} className="fbox" style={{ margin: 0, maxWidth: 560 }}>
      <label className="fld">Email<input className="inp" value={email} disabled /></label>
      <label className="fld">Nome e cognome<input className="inp" name="full_name" defaultValue={name} /></label>
      <label className="fld">Telefono<input className="inp" name="phone" defaultValue={phone} /></label>
      <Msg state={state} />
      <Submit>Salva</Submit>
    </form>
  );
}
