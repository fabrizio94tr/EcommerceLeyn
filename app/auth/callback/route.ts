import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { linkGuestOrders } from '@/lib/link-orders';

// Ritorno dai link email di Supabase (conferma registrazione, recupero password).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/account';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/account';
  if (code) {
    const sb = await supabaseServer();
    const { data } = await sb.auth.exchangeCodeForSession(code);
    if (data.user) await linkGuestOrders(data.user.id, data.user.email);
  }
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
