import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { SITE_URL } from '@/lib/env';
import { LEGAL } from '@/lib/legal';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const fixed = ['', '/abbigliamento', '/cosmetici', '/novita', '/promo', '/blog', ...Object.keys(LEGAL).map((k) => `/${k}`)]
    .map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now }));
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return fixed;
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [{ data: products }, { data: posts }, { data: cats }] = await Promise.all([
    sb.from('products').select('slug, updated_at').eq('published', true),
    sb.from('blog_posts').select('slug, updated_at').eq('published', true),
    sb.from('categories').select('slug, macro')
  ]);
  return [
    ...fixed,
    ...(cats ?? []).map((c) => ({ url: `${SITE_URL}/${c.macro}?sub=${c.slug}`, lastModified: now })),
    ...(products ?? []).map((p) => ({ url: `${SITE_URL}/prodotto/${p.slug}`, lastModified: new Date(p.updated_at) })),
    ...(posts ?? []).map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: new Date(p.updated_at) }))
  ];
}
