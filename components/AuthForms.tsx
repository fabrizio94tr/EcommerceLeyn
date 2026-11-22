'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

const origin = () => (typeof window !== 'undefined' ? window.location.origin : '');
const safe = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/account');
const itErr = (m: string) => /invalid login/i.test(m) ? 'Email o password non corretti.' : /not confirmed/i.test(m) ? 'Conferma prima la tua email: ti abbiamo mandato un link.' : /already registered/i.test(m) ? 'Esiste già un account con questa email. Accedi.' : /password/i.test(m) ? 'La password deve avere almeno 8 caratteri.' : 'Qualcosa non ha funzionato, riprova.';

export function LoginForm() {
  const sp = useSearchParams(); const router = useRouter();
  const [err, setErr] = useState(sp.get('errore') ? 'Il link non è più valido. Richiedine uno nuovo.' : ''); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true); setErr('');
    const fd = new FormData(e.currentTarget);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email: String(fd.get('email')).trim().toLowerCase(), password: String(fd.get('password')) });
    setBusy(false);
    if (error) return setErr(itErr(error.message));
    router.push(safe(sp.get('next'))); router.refresh();
  };
  return (
    <form onSubmit={submit}>
      <label className="fld">Email<input className="inp" type="email" name="email" required autoComplete="email" /></label>
      <label className="fld">Password<input className="inp" type="password" name="password" required autoComplete="current-password" /></label>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn full" disabled={busy}>{busy ? 'Accesso…' : 'Accedi'}</button>
      <p className="muted" style={{ margin: 0, fontSize: 14 }}><Link href="/recupera-password" style={{ textDecoration: 'underline' }}>Password dimenticata?</Link> · Non hai un account? <Link href={`/registrati${sp.get('next') ? `?next=${encodeURIComponent(sp.get('next')!)}` : ''}`} style={{ textDecoration: 'underline' }}>Registrati</Link></p>
    </form>
  );
}

export function SignupForm() {
  const sp = useSearchParams();
  const [err, setErr] = useState(''); const [done, setDone] = useState(false); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setErr('');
    const fd = new FormData(e.currentTarget);
    if (String(fd.get('password')).length < 8) return setErr('La password deve avere almeno 8 caratteri.');
    if (!fd.get('privacy')) return setErr('Per creare l\'account serve accettare l\'informativa privacy.');
    setBusy(true);
    const { data, error } = await supabaseBrowser().auth.signUp({
      email: String(fd.get('email')).trim().toLowerCase(), password: String(fd.get('password')),
      options: { data: { full_name: String(fd.get('full_name')).trim() }, emailRedirectTo: `${origin()}/auth/callback?next=${encodeURIComponent(safe(sp.get('next')))}` }
    });
    setBusy(false);
    if (error) return setErr(itErr(error.message));
    if (data.session) { window.location.href = safe(sp.get('next')); return; }
    setDone(true);
  };
  if (done) return <p className="alert good">Ti abbiamo inviato una email: clicca il link per confermare l&apos;account. Gli ordini fatti con questa email compariranno nella tua area.</p>;
  return (
    <form onSubmit={submit}>
      <label className="fld">Nome e cognome<input className="inp" name="full_name" required autoComplete="name" /></label>
      <label className="fld">Email<input className="inp" type="email" name="email" required autoComplete="email" defaultValue={sp.get('email') || ''} /></label>
      <label className="fld">Password (almeno 8 caratteri)<input className="inp" type="password" name="password" required minLength={8} autoComplete="new-password" /></label>
      <label className="chkbox"><input type="checkbox" name="privacy" required />Ho letto l&apos;<Link href="/privacy" target="_blank" style={{ textDecoration: 'underline' }}>informativa privacy</Link></label>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn full" disabled={busy}>{busy ? 'Creo l\'account…' : 'Crea account'}</button>
      <p className="muted" style={{ margin: 0, fontSize: 14 }}>Hai già un account? <Link href="/accedi" style={{ textDecoration: 'underline' }}>Accedi</Link></p>
    </form>
  );
}

export function ResetForm() {
  const [done, setDone] = useState(false); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true);
    const email = String(new FormData(e.currentTarget).get('email')).trim().toLowerCase();
    await supabaseBrowser().auth.resetPasswordForEmail(email, { redirectTo: `${origin()}/auth/callback?next=/aggiorna-password` });
    setBusy(false); setDone(true);
  };
  if (done) return <p className="alert good">Se l&apos;email è registrata, riceverai un link per scegliere una nuova password.</p>;
  return (
    <form onSubmit={submit}>
      <label className="fld">Email<input className="inp" type="email" name="email" required autoComplete="email" /></label>
      <button className="btn full" disabled={busy}>Invia il link</button>
    </form>
  );
}

export function NewPasswordForm() {
  const router = useRouter();
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setErr('');
    const pw = String(new FormData(e.currentTarget).get('password'));
    if (pw.length < 8) return setErr('La password deve avere almeno 8 caratteri.');
    setBusy(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setErr('Il link è scaduto: richiedine uno nuovo.');
    router.push('/account'); router.refresh();
  };
  return (
    <form onSubmit={submit}>
      <label className="fld">Nuova password<input className="inp" type="password" name="password" required minLength={8} autoComplete="new-password" /></label>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn full" disabled={busy}>Salva password</button>
    </form>
  );
}
