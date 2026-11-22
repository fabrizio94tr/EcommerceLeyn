import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Top } from '@/components/admin/Top';
import { ProductEditor } from '@/components/admin/ProductEditor';
import { PRODUCT_SELECT, normalize } from '@/lib/data';
import type { Category, Product } from '@/lib/types';

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ creato?: string }> }) {
  const { id } = await params;
  const sb = supabaseAdmin();
  const [{ data }, { data: cats }, { data: s }] = await Promise.all([sb.from('products').select(PRODUCT_SELECT).eq('id', id).maybeSingle(), sb.from('categories').select('*').order('sort'), sb.from('settings').select('default_low_stock').eq('id', 1).single()]);
  if (!data) notFound();
  const p = normalize(data as Product);
  const { data: wl } = await sb.from('waitlist').select('variant_id').in('variant_id', (p.variants || []).map((v) => v.id)).is('notified_at', null);
  const waiting = (wl ?? []).reduce<Record<string, number>>((m, w) => ({ ...m, [w.variant_id]: (m[w.variant_id] || 0) + 1 }), {});
  return (
    <>
      <Top title={p.name} sub={`Prodotti › ${p.type === 'cosmetic' ? 'Cosmetici' : 'Abbigliamento'} › Modifica`}>
        {p.published && <Link className="b g hide-m" href={`/prodotto/${p.slug}`} target="_blank">Vedi nel negozio ↗</Link>}
      </Top>
      {(await searchParams).creato && <p className="msg ok">Prodotto creato.</p>}
      <ProductEditor p={p} categories={(cats ?? []) as Category[]} waiting={waiting} defaultLow={s?.default_low_stock ?? 2} />
    </>
  );
}
