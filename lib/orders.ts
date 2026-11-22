import 'server-only';
import { supabaseAdmin } from './supabase/admin';
import { adminEmail, sendEmail, tpl } from './email';
import { variantLabel } from './format';
import type { Order, OrderItem } from './types';

/**
 * Chiamata dal webhook Stripe, dal ritorno PayPal e dalla pagina di conferma.
 * Grazie a mark_order_paid è idempotente: le email partono una sola volta.
 */
export async function finalizeOrder(orderId: string, provider: 'stripe' | 'paypal', ref: string) {
  const sb = supabaseAdmin();
  const { data: changed, error } = await sb.rpc('mark_order_paid', { p_order: orderId, p_provider: provider, p_ref: ref });
  if (error) throw error;
  if (!changed) return false;

  const { data: o } = await sb.from('orders').select('*, items:order_items(*)').eq('id', orderId).single();
  const order = o as Order & { items: OrderItem[] };
  const { data: settings } = await sb.from('settings').select('admin_email').eq('id', 1).single();

  await sendEmail(order.email, `Ordine ${order.number} confermato · Alana Beauty`, tpl.orderConfirmed(order, order.items));
  await sendEmail(adminEmail(settings?.admin_email), `Nuovo ordine ${order.number}`, tpl.adminNewOrder(order, order.items));
  await checkLowStock(order.items.map((i) => i.variant_id).filter(Boolean) as string[], settings?.admin_email);
  return true;
}

/** Avviso scorte minime: una mail per ogni discesa sotto soglia (si riarma quando la giacenza risale). */
export async function checkLowStock(variantIds: string[], settingsEmail?: string | null) {
  if (!variantIds.length) return;
  const sb = supabaseAdmin();
  const { data } = await sb.from('product_variants').select('id, stock, low_stock_threshold, low_stock_alerted, size, color_name, format, product:products(name)').in('id', variantIds);
  const low = (data ?? []).filter((v) => v.stock <= v.low_stock_threshold && !v.low_stock_alerted);
  if (!low.length) return;
  await sendEmail(adminEmail(settingsEmail), 'Scorte in esaurimento · Alana Beauty',
    tpl.lowStock(low.map((v) => ({ name: (v.product as unknown as { name: string }).name, label: variantLabel(v), stock: v.stock, threshold: v.low_stock_threshold }))));
  await sb.from('product_variants').update({ low_stock_alerted: true }).in('id', low.map((v) => v.id));
}
