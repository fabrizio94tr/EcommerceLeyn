export type Macro = 'abbigliamento' | 'cosmetici';
export type ProductType = 'clothing' | 'cosmetic';

export interface Category { id: string; macro: Macro; name: string; slug: string; image_url: string | null; sort: number }
export interface ProductImage { id: string; product_id: string; url: string; alt: string | null; sort: number }
export interface Variant {
  id: string; product_id: string; sku: string | null; size: string | null; color_name: string | null; color_hex: string | null;
  format: string | null; price_cents: number | null; cost_cents: number | null; stock: number; low_stock_threshold: number;
  low_stock_alerted: boolean; sort: number;
}
export interface Product {
  id: string; type: ProductType; category_id: string | null; name: string; slug: string; description: string;
  price_cents: number; compare_at_cents: number | null; cost_cents: number | null; published: boolean; featured: boolean; is_new: boolean;
  material: string | null; fit: string | null; care: string | null;
  inci: string | null; usage: string | null; warnings: string | null; pao_months: number | null; origin_country: string | null; eu_responsible_person: string | null;
  seo_title: string | null; seo_description: string | null; created_at: string; updated_at: string;
  category?: Category | null; images?: ProductImage[]; variants?: Variant[];
}
export interface Settings { shipping_flat_cents: number; free_shipping_threshold_cents: number; welcome_discount_percent: number; default_low_stock: number; admin_email: string | null }
export interface Coupon {
  id: string; code: string; kind: 'percent' | 'fixed'; value: number; min_order_cents: number; applies_to: 'all' | Macro;
  starts_at: string | null; ends_at: string | null; active: boolean; once_per_customer: boolean; max_uses: number | null; usage_count: number; is_welcome: boolean;
}
export interface Address { full_name: string; line1: string; line2?: string | null; postal_code: string; city: string; province?: string | null; phone?: string | null }
export interface Order {
  id: string; number: string; access_token: string; user_id: string | null; email: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_provider: 'stripe' | 'paypal' | null; payment_ref: string | null;
  subtotal_cents: number; discount_cents: number; shipping_cents: number; total_cents: number; coupon_code: string | null;
  shipping_address: Address; newsletter_optin: boolean; carrier: string | null; tracking_number: string | null; tracking_url: string | null;
  paid_at: string | null; shipped_at: string | null; created_at: string; items?: OrderItem[];
}
export interface OrderItem {
  id: string; order_id: string; product_id: string | null; variant_id: string | null; name: string; variant_label: string | null;
  image_url: string | null; macro: Macro | null; unit_price_cents: number; unit_cost_cents: number | null; qty: number;
}
export interface BlogPost {
  id: string; title: string; slug: string; excerpt: string | null; body: string; cover_url: string | null; category: string | null;
  seo_title: string | null; seo_description: string | null; published: boolean; show_home: boolean; published_at: string | null; created_at: string;
}
export interface Banner { id: string; kicker: string | null; title: string; subtitle: string | null; image_url: string; link: string | null; cta: string | null }
