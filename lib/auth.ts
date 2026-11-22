import 'server-only';
import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';

/** Blocca le pagine e le azioni del pannello a chi non è amministratore. */
export async function requireAdmin() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/accedi?next=/admin');
  const { data } = await sb.from('profiles').select('role, full_name').eq('id', user.id).single();
  if (data?.role !== 'admin') redirect('/');
  return { user, sb, name: data.full_name as string | null };
}

export async function requireUser(next = '/account') {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/accedi?next=${encodeURIComponent(next)}`);
  return { user, sb };
}
