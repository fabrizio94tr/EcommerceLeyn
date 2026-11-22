import 'server-only';
import { createClient } from '@supabase/supabase-js';

/** Client con chiave di servizio: SOLO lato server, ignora le regole RLS. */
export function supabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
