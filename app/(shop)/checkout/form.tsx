'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
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

  if (cart.ready && !cart.items.length) return (
    <div className="wrap"><div className="empty"><h1 className="H">Il carrello è vuoto</h1><Link href="/" className="btn">Torna al negozio</Link></div></div>
  );

  return (
    <div className="wrap">
      <form className="co" action={action}>
        <div>
          <div className="co-h"><h1 className="H">Checkout</h1></div>
          <div className="steps"><span className="done"><i><I.check /></i>Carrello</span><b /><span className="on"><i>2</i>Dati e pagamento</span><b /><span><i>3</i>Conferma</span></div>
          {cancelled && <p className="alert" style={{ marginBottom: 18 }}>Il pagamento è stato annullato: non ti è stato addebitato nulla. Puoi riprovare quando vuoi.</p>}
          <input type="hidden" name="cart" value={JSON.stringify(cart.items)} />
          <input type="hidden" name="coupon" value={q?.couponCode || ''} />

          <div className="fbox">
            <h3><span><span className="n">1</span>Contatti</span>{!loggedIn && <small>Hai un account? <Link href="/accedi?next=/checkout" style={{ textDecoration: 'underline' }}>Accedi</Link></small>}</h3>
            {!loggedIn && <p className="muted" style={{ margin: 0, fontSize: 14 }}>Puoi comprare come ospite, senza registrarti.</p>}
            <label className="fld">Email<input className="inp" type="email" name="email" required value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setEmailForQuote(email)} autoComplete="email" /></label>
            <label className="chkbox"><input type="checkbox" name="newsletter" />Iscrivimi alla newsletter (sconto di benvenuto sul prossimo ordine)</label>
          </div>

          <div className="fbox">
            <h3><span><span className="n">2</span>Indirizzo di spedizione</span></h3>
            <label className="fld">Nome e cognome<input className="inp" name="full_name" required defaultValue={address?.full_name || name} autoComplete="name" /></label>
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
            <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>Spediamo solo in Italia.</p>
          </div>

          <div className="fbox">
            <h3><span><span className="n">3</span>Pagamento</span><small>Pagamenti protetti</small></h3>
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
                <div className="lt"><b>{l.name}</b><span>{l.variantLabel}{l.variantLabel ? ' · ' : ''}Qtà {l.qty}</span></div><b>{eur(l.unitCents * l.qty)}</b></div>
            ))}
          </div>
          {q?.problems.map((p) => <p key={p} className="alert bad">{p}</p>)}
          {q?.couponCode && <div className="applied"><span>{q.couponCode} applicato</span></div>}
          {coupon && q?.couponError && <p className="err">{q.couponError} <Link href="/carrello" style={{ textDecoration: 'underline' }}>Modifica</Link></p>}
          {q && <Totals q={q} />}
          <Msg state={state} />
          <Submit className="btn full" pending="Ti portiamo al pagamento…"><I.lock />Paga {q ? eur(q.total) : ''}</Submit>
          <span className="secure"><I.lock />Verrai indirizzata alla pagina sicura di Stripe o PayPal</span>
          <Link href="/carrello" className="lnk" style={{ textAlign: 'center' }}>Modifica il carrello</Link>
        </aside>
      </form>
    </div>
  );
}
