'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/components/cart';
import { useQuote, COUPON_KEY } from '@/components/useQuote';
import { Totals } from '@/components/Summary';
import { Msg, Submit, useForm } from '@/components/forms';
import { I } from '@/components/icons';
import { startCheckout } from '@/app/actions';
import { eur } from '@/lib/format';
import type { Address } from '@/lib/types';

export function CheckoutForm({ email: initialEmail, loggedIn, address, name, cancelled }: { email: string; loggedIn: boolean; address: Address | null; name: string; cancelled: boolean }) {
  const cart = useCart();
  const [coupon, setCoupon] = useState<string | null>(null);
  const [email, setEmail] = useState(initialEmail);
  const [emailForQuote, setEmailForQuote] = useState(initialEmail);
  useEffect(() => { try { setCoupon(localStorage.getItem(COUPON_KEY)); } catch { /* ignora */ } }, []);
  const { q } = useQuote(cart.items, cart.ready, coupon, emailForQuote);
  const [state, action] = useForm(startCheckout);
  const [code, setCode] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const applyCoupon = (c: string | null) => { setCoupon(c); try { c ? localStorage.setItem(COUPON_KEY, c) : localStorage.removeItem(COUPON_KEY); } catch { /* ignora */ } };
  const quickPay = (method: 'stripe' | 'paypal') => {
    const f = formRef.current; if (!f) return;
    const radio = f.querySelector<HTMLInputElement>(`input[name=payment][value=${method}]`); if (radio) radio.checked = true;
    f.requestSubmit();
  };
  const [first, ...rest] = (address?.full_name || name || '').split(' ');

  if (cart.ready && !cart.items.length) return (
    <div className="wrap"><div className="empty"><h1 className="H">Il carrello è vuoto</h1><Link href="/" className="btn">Torna al negozio</Link></div></div>
  );

  return (
    <div className="wrap">
      <form className="co" action={action} ref={formRef}>
        <div>
          <div className="co-h"><h1 className="H">Checkout</h1></div>
          <div className="steps"><span className="done"><i><I.check /></i>Carrello</span><b /><span className="on"><i>2</i>Dati e pagamento</span><b /><span><i>3</i>Conferma</span></div>
          {cancelled && <p className="alert" style={{ marginBottom: 18 }}>Il pagamento è stato annullato: non ti è stato addebitato nulla. Puoi riprovare quando vuoi.</p>}
          <input type="hidden" name="cart" value={JSON.stringify(cart.items)} />
          <input type="hidden" name="coupon" value={q?.couponCode || ''} />

          <div className="fbox"><h3>Pagamento veloce</h3>
            <div className="wallet">
              <button type="button" onClick={() => quickPay('stripe')}>Apple Pay</button>
              <button type="button" className="gp" onClick={() => quickPay('stripe')}>Google Pay</button>
              <button type="button" className="pp" onClick={() => quickPay('paypal')}>PayPal</button>
            </div>
            <div className="or">oppure compila i dati</div>
          </div>

          <div className="fbox">
            <h3><span><span className="n">1</span>Contatti</span>{!loggedIn && <small>Hai un account? <Link href="/accedi?next=/checkout" style={{ textDecoration: 'underline' }}>Accedi</Link></small>}</h3>
            {!loggedIn && <div className="seg2"><span className="on">Continua come ospite</span><Link href="/registrati?next=/checkout">Crea un account</Link></div>}
            <label className="fld">Email<input className="inp" type="email" name="email" required value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setEmailForQuote(email)} autoComplete="email" /></label>
            <label className="chkbox"><input type="checkbox" name="newsletter" />Iscrivimi alla newsletter (sconto di benvenuto sul prossimo ordine)</label>
          </div>

          <div className="fbox">
            <h3><span><span className="n">2</span>Indirizzo di spedizione</span></h3>
            <div className="frow">
              <label className="fld">Nome<input className="inp" name="first_name" required defaultValue={first} autoComplete="given-name" /></label>
              <label className="fld">Cognome<input className="inp" name="last_name" required defaultValue={rest.join(' ')} autoComplete="family-name" /></label>
            </div>
            <label className="fld">Indirizzo e numero civico<input className="inp" name="line1" required defaultValue={address?.line1 || ''} autoComplete="address-line1" /></label>
            <label className="fld">Scala, interno, citofono (facoltativo)<input className="inp" name="line2" defaultValue={address?.line2 || ''} autoComplete="address-line2" /></label>
            <div className="frow">
              <label className="fld">CAP<input className="inp" name="postal_code" required inputMode="numeric" pattern="\d{5}" maxLength={5} defaultValue={address?.postal_code || ''} autoComplete="postal-code" /></label>
              <label className="fld">Città<input className="inp" name="city" required defaultValue={address?.city || ''} autoComplete="address-level2" /></label>
            </div>
            <div className="frow">
              <label className="fld">Provincia (sigla)<input className="inp" name="province" maxLength={2} defaultValue={address?.province || ''} placeholder="RM" /></label>
              <label className="fld">Telefono (per il corriere)<input className="inp" name="phone" required type="tel" defaultValue={address?.phone || ''} autoComplete="tel" /></label>
            </div>
            {loggedIn && !address && <label className="chkbox"><input type="checkbox" name="save_address" defaultChecked />Salva l&apos;indirizzo nel mio account</label>}
          </div>

          <div className="fbox">
            <h3><span><span className="n">3</span>Spedizione</span></h3>
            <div className="radio on"><i /><span className="rt"><b>Corriere espresso</b><small>Consegna in 24/48 ore lavorative · solo Italia</small></span><b className="r">{q ? (q.shipping ? eur(q.shipping) : 'Gratis') : ''}</b></div>
          </div>

          <div className="fbox">
            <h3><span><span className="n">4</span>Pagamento</span><small>Pagamenti protetti</small></h3>
            <div className="pay-choice">
              <label><input type="radio" name="payment" value="stripe" defaultChecked /><span className="radio"><i /><span className="rt"><b>Carta, Apple Pay o Google Pay</b><small>Pagamento sicuro con Stripe</small></span><span className="pm"><em>VISA</em><em>MASTERCARD</em><em>AMEX</em></span></span></label>
              <label><input type="radio" name="payment" value="paypal" /><span className="radio"><i /><span className="rt"><b>PayPal</b><small>Paghi con il tuo conto PayPal</small></span></span></label>
            </div>
            <label className="chkbox"><input type="checkbox" name="terms" required />Ho letto e accetto le <Link href="/condizioni-di-vendita" target="_blank" style={{ textDecoration: 'underline' }}>condizioni di vendita</Link> e l&apos;<Link href="/privacy" target="_blank" style={{ textDecoration: 'underline' }}>informativa privacy</Link></label>
          </div>
        </div>

        <aside className="sum">
          <h3>Il tuo ordine{q ? ` · ${q.lines.reduce((t, l) => t + l.qty, 0)} articoli` : ''}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {q?.lines.map((l) => (
              <div className="li" key={l.variantId}>{l.image ? <img src={l.image} alt="" /> : <span />}
                <div className="lt"><b>{l.name}</b><span>{l.variantLabel}</span>
                  <span className="lq"><button type="button" aria-label="Meno" onClick={() => cart.set(l.variantId, l.qty - 1)}><I.minus /></button>{l.qty}<button type="button" aria-label="Più" disabled={l.qty >= l.stock} onClick={() => cart.set(l.variantId, l.qty + 1)}><I.plus /></button></span></div>
                <b>{eur(l.unitCents * l.qty)}</b></div>
            ))}
          </div>
          {q?.problems.map((p) => <p key={p} className="alert bad">{p}</p>)}
          <div className="coupon"><input className="inp" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Codice sconto" aria-label="Codice sconto" style={{ padding: '0 14px' }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (code.trim()) applyCoupon(code.trim().toUpperCase()); } }} />
            <button type="button" className="btn ghost" onClick={() => code.trim() && applyCoupon(code.trim().toUpperCase())}>Applica</button></div>
          {q?.couponCode && <div className="applied"><span>{q.couponCode} applicato</span><button type="button" aria-label="Togli il codice" onClick={() => applyCoupon(null)}>✕</button></div>}
          {coupon && q?.couponError && <p className="err">{q.couponError}</p>}
          {q && <Totals q={q} />}
          <Msg state={state} />
          <Submit className="btn full" pending="Ti portiamo al pagamento…"><I.lock />Paga {q ? eur(q.total) : ''}</Submit>
          <span className="secure"><I.lock />Verrai indirizzata alla pagina sicura di Stripe o PayPal</span>
        </aside>
      </form>
    </div>
  );
}
