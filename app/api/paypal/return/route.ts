import { NextResponse } from 'next/server';
import { paypalCapture } from '@/lib/paypal';
import { finalizeOrder } from '@/lib/orders';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { SITE_URL } from '@/lib/env';

export const runtime = 'nodejs';

// PayPal rimanda qui la cliente dopo l'approvazione: incassiamo e confermiamo l'ordine.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get('order');
  const token = url.searchParams.get('token'); // id ordine PayPal
  if (!orderId || !token) return NextResponse.redirect(`${SITE_URL}/checkout?annullato=1`);
  const sb = supabaseAdmin();
  const { data: o } = await sb.from('orders').select('id, access_token, total_cents, payment_ref, status').eq('id', orderId).maybeSingle();
  if (!o || o.payment_ref !== token) return NextResponse.redirect(`${SITE_URL}/checkout?annullato=1`);
  if (o.status === 'pending') {
    try {
      const cap = await paypalCapture(token);
      if (cap.status === 'COMPLETED' && cap.orderId === o.id && cap.cents === o.total_cents) await finalizeOrder(o.id, 'paypal', cap.captureId || token);
      else console.error('PayPal: importo o stato non corrispondente', cap, o.total_cents);
    } catch (e) { console.error('PayPal capture', e); return NextResponse.redirect(`${SITE_URL}/checkout?annullato=1`); }
  }
  return NextResponse.redirect(`${SITE_URL}/ordine/${o.id}?t=${o.access_token}`);
}
