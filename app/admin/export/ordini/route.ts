import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { csv } from '@/lib/csv';

export async function GET() {
  await requireAdmin();
  const { data } = await supabaseAdmin().from('orders').select('number, created_at, paid_at, status, email, shipping_address, subtotal_cents, discount_cents, coupon_code, shipping_cents, total_cents, payment_provider, payment_ref, tracking_number').neq('status', 'pending').order('created_at');
  const e = (c: number) => (c / 100).toFixed(2).replace('.', ',');
  const rows = (data ?? []).map((o) => { const a = o.shipping_address as Record<string, string>; return [o.number, o.created_at, o.paid_at, o.status, o.email, a.full_name, a.line1, a.postal_code, a.city, a.province, a.phone, e(o.subtotal_cents), e(o.discount_cents), o.coupon_code, e(o.shipping_cents), e(o.total_cents), o.payment_provider, o.payment_ref, o.tracking_number]; });
  const body = csv([['numero', 'creato', 'pagato', 'stato', 'email', 'nome', 'indirizzo', 'cap', 'citta', 'provincia', 'telefono', 'subtotale', 'sconto', 'coupon', 'spedizione', 'totale', 'pagamento', 'rif_pagamento', 'tracking'], ...rows]);
  return new Response(body, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="ordini.csv"' } });
}
