-- Campi per riprodurre la proposta grafica Noir Editorial
alter table public.banners add column if not exists image2_url text;      -- seconda foto del banner grande
alter table public.banners add column if not exists promo_code text;      -- codice mostrato nella fascia promo
alter table public.products add column if not exists claims text;         -- punti forti, separati da virgola
alter table public.products add column if not exists routine text;        -- routine: una riga "Titolo: testo" per passo
alter table public.settings add column if not exists instagram_url text;
alter table public.settings add column if not exists tiktok_url text;
alter table public.settings add column if not exists facebook_url text;
