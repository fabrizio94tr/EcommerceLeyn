import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { AdminNav } from '@/components/admin/Nav';

export const metadata = { title: 'Gestione negozio', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { name } = await requireAdmin();
  const sb = supabaseAdmin();
  const [{ count: ord }, { count: ret }, { data: low }] = await Promise.all([
    sb.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'paid'),
    sb.from('returns').select('id', { count: 'exact', head: true }).eq('status', 'requested'),
    sb.from('product_variants').select('stock, low_stock_threshold')
  ]);
  const mag = (low ?? []).filter((v) => v.stock <= v.low_stock_threshold).length;
  return <div className="adm"><div className="app"><AdminNav badges={{ ord: ord ?? 0, ret: ret ?? 0, mag }} name={name || ''} /><main className="main">{children}</main></div></div>;
}
