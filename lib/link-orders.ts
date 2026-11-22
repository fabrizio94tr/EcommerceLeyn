import 'server-only';
import { supabaseAdmin } from './supabase/admin';

/** Dopo la conferma dell'email, gli ordini fatti come ospite con la stessa email passano nell'account. */
export async function linkGuestOrders(userId: string, email?: string | null) {
  if (!email) return;
  await supabaseAdmin().from('orders').update({ user_id: userId }).is('user_id', null).eq('email', email.trim().toLowerCase());
}
