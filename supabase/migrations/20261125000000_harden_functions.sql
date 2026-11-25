-- Indicazioni del linter di sicurezza Supabase
alter function public.touch_updated_at() set search_path = public;
alter function public.reset_low_stock_alert() set search_path = public;
-- funzioni usate solo dai trigger: non devono essere chiamabili dall'API
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_role() from public, anon, authenticated;
