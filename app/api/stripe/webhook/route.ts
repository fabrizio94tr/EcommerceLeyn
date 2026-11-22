import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { finalizeOrder } from '@/lib/orders';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

// Configurare su Stripe: endpoint /api/stripe/webhook con gli eventi checkout.session.completed,
// checkout.session.async_payment_succeeded, checkout.session.expired
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  let ev: Stripe.Event;
  try { ev = stripe().webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!); }
  catch { return NextResponse.json({ error: 'firma non valida' }, { status: 400 }); }

  if (ev.type === 'checkout.session.completed' || ev.type === 'checkout.session.async_payment_succeeded') {
    const s = ev.data.object as Stripe.Checkout.Session;
    const id = s.metadata?.order_id;
    if (id && s.payment_status === 'paid') await finalizeOrder(id, 'stripe', String(s.payment_intent || s.id));
  }
  if (ev.type === 'checkout.session.expired') {
    const s = ev.data.object as Stripe.Checkout.Session;
    if (s.metadata?.order_id) await supabaseAdmin().from('orders').update({ status: 'cancelled' }).eq('id', s.metadata.order_id).eq('status', 'pending');
  }
  return NextResponse.json({ received: true });
}
