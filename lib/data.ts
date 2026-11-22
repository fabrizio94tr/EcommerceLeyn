import 'server-only';
import { cache } from 'react';
import { supabaseServer } from './supabase/server';
import type { BlogPost, Banner, Category, Macro, Product, Settings } from './types';

export const PRODUCT_SELECT = '*, category:categories(*), images:product_images(*), variants:product_variants(*)';

export function normalize(p: Product): Product {
  p.images = (p.images || []).sort((a, b) => a.sort - b.sort);
  p.variants = (p.variants || []).sort((a, b) => a.sort - b.sort);
  return p;
}

export const getSettings = cache(async (): Promise<Settings> => {
  const sb = await supabaseServer();
  const { data } = await sb.from('settings').select('*').eq('id', 1).single();
  return data ?? { shipping_flat_cents: 590, free_shipping_threshold_cents: 4900, welcome_discount_percent: 10, default_low_stock: 2, admin_email: null };
});

export const getCategories = cache(async (macro?: Macro): Promise<Category[]> => {
  const sb = await supabaseServer();
  let q = sb.from('categories').select('*').order('sort').order('name');
  if (macro) q = q.eq('macro', macro);
  const { data } = await q;
  return data ?? [];
});

export async function getProducts(opts: { macro?: Macro; categorySlug?: string; featured?: boolean; limit?: number; search?: string; ids?: string[] } = {}) {
  const sb = await supabaseServer();
  let q = sb.from('products').select(PRODUCT_SELECT).eq('published', true).order('created_at', { ascending: false });
  if (opts.macro) {
    const cats = await getCategories(opts.macro);
    const ids = cats.filter((c) => !opts.categorySlug || c.slug === opts.categorySlug).map((c) => c.id);
    q = q.in('category_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  }
  if (opts.featured) q = q.eq('featured', true);
  if (opts.ids) q = q.in('id', opts.ids);
  if (opts.search) q = q.or(`name.ilike.%${opts.search.replace(/[%,()]/g, ' ')}%,description.ilike.%${opts.search.replace(/[%,()]/g, ' ')}%`);
  if (opts.limit) q = q.limit(opts.limit);
  const { data } = await q;
  return ((data ?? []) as Product[]).map(normalize);
}

export async function getProduct(slug: string) {
  const sb = await supabaseServer();
  const { data } = await sb.from('products').select(PRODUCT_SELECT).eq('slug', slug).eq('published', true).maybeSingle();
  return data ? normalize(data as Product) : null;
}

export async function getBanners(): Promise<Banner[]> {
  const sb = await supabaseServer();
  const { data } = await sb.from('banners').select('*').order('sort');
  return data ?? [];
}

export async function getPosts(limit?: number, homeOnly = false): Promise<BlogPost[]> {
  const sb = await supabaseServer();
  let q = sb.from('blog_posts').select('*').eq('published', true).order('published_at', { ascending: false });
  if (homeOnly) q = q.eq('show_home', true);
  if (limit) q = q.limit(limit);
  const { data } = await q;
  return data ?? [];
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  const sb = await supabaseServer();
  const { data } = await sb.from('blog_posts').select('*').eq('slug', slug).eq('published', true).maybeSingle();
  return data;
}

export async function getUser() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function getWishlistIds(): Promise<Set<string>> {
  const user = await getUser();
  if (!user) return new Set();
  const sb = await supabaseServer();
  const { data } = await sb.from('wishlist').select('product_id').eq('user_id', user.id);
  return new Set((data ?? []).map((r) => r.product_id));
}

export function inStock(p: Product) { return (p.variants || []).some((v) => v.stock > 0); }
export function macroOf(p: Product): Macro { return p.category?.macro ?? (p.type === 'cosmetic' ? 'cosmetici' : 'abbigliamento'); }
