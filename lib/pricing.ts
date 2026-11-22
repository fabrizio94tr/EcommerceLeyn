import 'server-only';
import { supabaseAdmin } from './supabase/admin';
import type { Coupon, Macro, Product, Settings, Variant } from './types';
import { variantLabel } from './format';

export interface CartLine { variantId: string; qty: number }
export interface PricedLine {
  variantId: string; productId: string; name: string; slug: string; variantLabel: string; image: string | null; macro: Macro;
  unitCents: number; unitCostCents: number | null; qty: number; stock: number;
}
export interface Quote {
  lines: PricedLine[]; problems: string[]; subtotal: number; discount: number; shipping: number; total: number;
  coupon: Coupon | null; couponError: string | null; settings: Settings;
}

/** Ricalcola sempre i prezzi dal database: il carrello del browser non è mai attendibile. */
export async function quote(cart: CartLine[], couponCode?: string | null, email?: string | null): Promise<Quote> {
  const sb = supabaseAdmin();
  const { data: settings } = await sb.from('settings').select('*').eq('id', 1).single();
  const s: Settings = settings!;
  const ids = [...new Set(cart.map((c) => c.variantId))].filter(Boolean);
  const { data: variants } = ids.length
    ? await sb.from('product_variants').select('*, product:products(*, category:categories(macro), images:product_images(url, sort))').in('id', ids)
    : { data: [] as never[] };

  const lines: PricedLine[] = [];
  const problems: string[] = [];
  for (const c of cart) {
    const v = (variants ?? []).find((x: Variant) => x.id === c.variantId) as (Variant & { product: Product & { category: { macro: Macro } | null; images: { url: string; sort: number }[] } }) | undefined;
    if (!v || !v.product?.published) { problems.push('Un prodotto nel carrello non è più disponibile ed è stato rimosso.'); continue; }
    const qty = Math.max(1, Math.min(Math.floor(c.qty), 20));
    if (v.stock <= 0) { problems.push(`${v.product.name} (${variantLabel(v)}) è esaurito.`); continue; }
    const finalQty = Math.min(qty, v.stock);
    if (finalQty < qty) problems.push(`Di ${v.product.name} (${variantLabel(v)}) sono rimasti ${v.stock} pezzi.`);
    const img = [...(v.product.images || [])].sort((a, b) => a.sort - b.sort)[0]?.url ?? null;
    lines.push({
      variantId: v.id, productId: v.product.id, name: v.product.name, slug: v.product.slug, variantLabel: variantLabel(v), image: img,
      macro: v.product.category?.macro ?? (v.product.type === 'cosmetic' ? 'cosmetici' : 'abbigliamento'),
      unitCents: v.price_cents ?? v.product.price_cents, unitCostCents: v.cost_cents ?? v.product.cost_cents,
      qty: finalQty, stock: v.stock
    });
  }
  const subtotal = lines.reduce((t, l) => t + l.unitCents * l.qty, 0);

  let coupon: Coupon | null = null, couponError: string | null = null, discount = 0;
  if (couponCode && couponCode.trim()) {
    const { data } = await sb.from('coupons').select('*').eq('code', couponCode.trim().toUpperCase()).maybeSingle();
    const now = Date.now();
    if (!data || !data.active) couponError = 'Codice sconto non valido.';
    else if (data.starts_at && new Date(data.starts_at).getTime() > now) couponError = 'Questo codice non è ancora attivo.';
    else if (data.ends_at && new Date(data.ends_at).getTime() < now) couponError = 'Questo codice è scaduto.';
    else if (data.max_uses != null && data.usage_count >= data.max_uses) couponError = 'Questo codice è già stato usato.';
    else {
      const eligible = lines.filter((l) => data.applies_to === 'all' || l.macro === data.applies_to).reduce((t, l) => t + l.unitCents * l.qty, 0);
      if (eligible === 0) couponError = `Il codice vale solo per ${data.applies_to}.`;
      else if (subtotal < data.min_order_cents) couponError = `Il codice vale per ordini da ${(data.min_order_cents / 100).toFixed(2).replace('.', ',')} €.`;
      else {
        if (data.once_per_customer && email) {
          const { count } = await sb.from('orders').select('id', { count: 'exact', head: true })
            .eq('email', email.trim().toLowerCase()).eq('coupon_code', data.code).in('status', ['paid', 'shipped', 'delivered']);
          if ((count ?? 0) > 0) couponError = 'Hai già usato questo codice.';
        }
        if (!couponError) {
          coupon = data;
          discount = data.kind === 'percent' ? Math.round((eligible * data.value) / 100) : Math.min(data.value, eligible);
        }
      }
    }
  }
  const afterDiscount = subtotal - discount;
  const shipping = lines.length === 0 || afterDiscount >= s.free_shipping_threshold_cents ? 0 : s.shipping_flat_cents;
  return { lines, problems, subtotal, discount, shipping, total: afterDiscount + shipping, coupon, couponError, settings: s };
}
