import 'server-only';

const base = () => (process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com');

async function token() {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const r = await fetch(`${base()}/v1/oauth2/token`, { method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials', cache: 'no-store' });
  if (!r.ok) throw new Error('PayPal: autenticazione fallita');
  return (await r.json()).access_token as string;
}

const amt = (c: number) => (c / 100).toFixed(2);

export async function paypalCreateOrder(o: { id: string; number: string; total: number; returnUrl: string; cancelUrl: string }) {
  const r = await fetch(`${base()}/v2/checkout/orders`, {
    method: 'POST', cache: 'no-store',
    headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json', 'PayPal-Request-Id': o.id },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ reference_id: o.id, custom_id: o.id, description: `Ordine ${o.number} · Alana Beauty`, amount: { currency_code: 'EUR', value: amt(o.total) } }],
      payment_source: { paypal: { experience_context: { brand_name: 'Alana Beauty', locale: 'it-IT', shipping_preference: 'NO_SHIPPING', user_action: 'PAY_NOW', return_url: o.returnUrl, cancel_url: o.cancelUrl } } }
    })
  });
  const data = await r.json();
  if (!r.ok) throw new Error('PayPal: ordine non creato');
  const link = (data.links as { rel: string; href: string }[]).find((l) => l.rel === 'payer-action' || l.rel === 'approve');
  return { paypalId: data.id as string, approveUrl: link?.href as string };
}

/** Incassa l'ordine PayPal approvato. Restituisce l'importo incassato in centesimi e l'id dell'ordine nostro. */
export async function paypalCapture(paypalId: string) {
  const r = await fetch(`${base()}/v2/checkout/orders/${paypalId}/capture`, {
    method: 'POST', cache: 'no-store', headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json', 'PayPal-Request-Id': `cap-${paypalId}` }
  });
  const data = await r.json();
  if (!r.ok && data?.details?.[0]?.issue !== 'ORDER_ALREADY_CAPTURED') throw new Error('PayPal: pagamento non incassato');
  const unit = data.purchase_units?.[0];
  const cap = unit?.payments?.captures?.[0];
  return { status: (data.status as string) ?? 'UNKNOWN', orderId: unit?.reference_id ?? cap?.custom_id, captureId: cap?.id as string | undefined, cents: cap ? Math.round(parseFloat(cap.amount.value) * 100) : 0 };
}
