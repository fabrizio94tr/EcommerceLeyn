import { supabaseAdmin } from '@/lib/supabase/admin';
import { Top } from '@/components/admin/Top';
import { ProductEditor } from '@/components/admin/ProductEditor';
import type { Category } from '@/lib/types';

export default async function NewProduct() {
  const sb = supabaseAdmin();
  const [{ data: cats }, { data: s }] = await Promise.all([sb.from('categories').select('*').order('sort'), sb.from('settings').select('default_low_stock').eq('id', 1).single()]);
  return (<><Top title="Nuovo prodotto" sub="Prodotti › Nuovo" /><ProductEditor categories={(cats ?? []) as Category[]} waiting={{}} defaultLow={s?.default_low_stock ?? 2} /></>);
}
