import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase/server';
import { linkGuestOrders } from '@/lib/link-orders';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const next = url.searchParams.get('next') || '/account';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/account';
  if (token_hash && type) {
    const sb = await supabaseServer();
    const { data, error } = await sb.auth.verifyOtp({ type, token_hash });
    if (!error && data.user) { await linkGuestOrders(data.user.id, data.user.email); return NextResponse.redirect(new URL(safeNext, url.origin)); }
  }
  return NextResponse.redirect(new URL('/accedi?errore=link', url.origin));
}
