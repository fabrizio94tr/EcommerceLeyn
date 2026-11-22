import { CheckoutForm } from './form';
import { getUser } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase/server';
import type { Address } from '@/lib/types';

export const metadata = { title: 'Checkout', robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ annullato?: string }> }) {
  const user = await getUser();
  let addr: Address | null = null, name = '';
  if (user) {
    const sb = await supabaseServer();
    const [{ data: a }, { data: prof }] = await Promise.all([
      sb.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }).limit(1).maybeSingle(),
      sb.from('profiles').select('full_name, phone').eq('id', user.id).single()
    ]);
    addr = a; name = prof?.full_name || '';
    if (addr && !addr.phone && prof?.phone) addr.phone = prof.phone;
  }
  return <CheckoutForm email={user?.email || ''} loggedIn={!!user} address={addr} name={name} cancelled={(await searchParams).annullato === '1'} />;
}
