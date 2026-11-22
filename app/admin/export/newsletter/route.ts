import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { csv } from '@/lib/csv';

export async function GET() {
  await requireAdmin();
  const { data } = await supabaseAdmin().from('newsletter_subscribers').select('email, consent_at, welcome_coupon_code').is('unsubscribed_at', null).order('created_at');
  const body = csv([['email', 'consenso_il', 'coupon_benvenuto'], ...(data ?? []).map((s) => [s.email, s.consent_at, s.welcome_coupon_code])]);
  return new Response(body, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="iscritte-newsletter.csv"' } });
}
