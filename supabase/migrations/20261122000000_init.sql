-- Alana Beauty · schema iniziale
-- Importi in centesimi di euro (interi). Tutte le tabelle con Row Level Security.

create extension if not exists pgcrypto;

-- ───────────── profili e ruoli ─────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  newsletter boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────── impostazioni negozio (riga unica) ─────────────
create table public.settings (
  id int primary key default 1 check (id = 1),
  shipping_flat_cents int not null default 590,
  free_shipping_threshold_cents int not null default 4900,
  welcome_discount_percent int not null default 10,
  default_low_stock int not null default 2,
  admin_email text,
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1);

-- ───────────── catalogo ─────────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  macro text not null check (macro in ('abbigliamento','cosmetici')),
  name text not null,
  slug text not null unique,
  image_url text,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('clothing','cosmetic')),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text not null default '',
  price_cents int not null check (price_cents >= 0),
  compare_at_cents int check (compare_at_cents is null or compare_at_cents > 0),
  cost_cents int,
  published boolean not null default false,
  featured boolean not null default false,
  is_new boolean not null default true,
  -- abbigliamento
  material text, fit text, care text,
  -- cosmetici (Reg. CE 1223/2009)
  inci text, usage text, warnings text, pao_months int, origin_country text, eu_responsible_person text,
  -- SEO
  seo_title text, seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.products (category_id);
create index on public.products (published, created_at desc);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text,
  sort int not null default 0
);
create index on public.product_images (product_id, sort);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text unique,
  size text,            -- abbigliamento: XS, S, M…
  color_name text,      -- abbigliamento
  color_hex text,
  format text,          -- cosmetici: 30 ml, 50 ml…
  price_cents int,      -- se diverso dal prezzo del prodotto
  cost_cents int,       -- se diverso dal costo del prodotto
  stock int not null default 0 check (stock >= 0),
  low_stock_threshold int not null default 2,
  low_stock_alerted boolean not null default false,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.product_variants (product_id);

-- ───────────── promozioni e home ─────────────
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  kind text not null default 'percent' check (kind in ('percent','fixed')),
  value int not null check (value > 0),          -- percento oppure centesimi
  min_order_cents int not null default 0,
  applies_to text not null default 'all' check (applies_to in ('all','abbigliamento','cosmetici')),
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  once_per_customer boolean not null default false,
  max_uses int,
  usage_count int not null default 0,
  is_welcome boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  kicker text, title text not null, subtitle text,
  image_url text not null, link text, cta text,
  starts_at timestamptz, ends_at timestamptz,
  active boolean not null default true,
  sort int not null default 0
);

-- ───────────── clienti ─────────────
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text, full_name text not null, line1 text not null, line2 text,
  postal_code text not null, city text not null, province text, phone text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.wishlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  consent_at timestamptz not null default now(),
  welcome_coupon_code text,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  email text not null,
  consent_at timestamptz not null default now(),
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (variant_id, email)
);

-- ───────────── ordini ─────────────
create sequence public.order_number_seq start 1001;
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default ('AB-' || nextval('public.order_number_seq')),
  access_token uuid not null default gen_random_uuid(),   -- per la pagina di conferma degli ospiti
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  status text not null default 'pending' check (status in ('pending','paid','shipped','delivered','cancelled','refunded')),
  payment_provider text check (payment_provider in ('stripe','paypal')),
  payment_ref text,
  subtotal_cents int not null,
  discount_cents int not null default 0,
  shipping_cents int not null default 0,
  total_cents int not null,
  coupon_code text,
  shipping_address jsonb not null,
  newsletter_optin boolean not null default false,
  carrier text, tracking_number text, tracking_url text,
  paid_at timestamptz, shipped_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.orders (user_id, created_at desc);
create index on public.orders (status, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  name text not null,
  variant_label text,
  image_url text,
  macro text,
  unit_price_cents int not null,
  unit_cost_cents int,
  qty int not null check (qty > 0)
);
create index on public.order_items (order_id);

create sequence public.return_number_seq start 1;
create table public.returns (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default ('R-' || lpad(nextval('public.return_number_seq')::text, 3, '0')),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('return','exchange')),
  reason text not null,
  items jsonb not null,             -- [{order_item_id, qty, exchange_variant_id?}]
  status text not null default 'requested' check (status in ('requested','approved','rejected','received','completed')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────────── blog ─────────────
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  body text not null default '',
  cover_url text,
  category text,
  seo_title text, seo_description text,
  published boolean not null default false,
  show_home boolean not null default true,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────────── funzioni ordine ─────────────
-- Segna l'ordine come pagato e scala le giacenze. Idempotente: restituisce false se era già pagato.
create or replace function public.mark_order_paid(p_order uuid, p_provider text, p_ref text)
returns boolean language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_order for update;
  if not found or o.status <> 'pending' then return false; end if;
  update public.orders set status = 'paid', payment_provider = p_provider, payment_ref = p_ref, paid_at = now() where id = p_order;
  update public.product_variants v set stock = greatest(v.stock - i.qty, 0)
    from public.order_items i where i.order_id = p_order and i.variant_id = v.id;
  if o.coupon_code is not null then
    update public.coupons set usage_count = usage_count + 1 where upper(code) = upper(o.coupon_code);
  end if;
  return true;
end $$;
revoke all on function public.mark_order_paid(uuid, text, text) from public, anon, authenticated;

-- updated_at automatico
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger t_products before update on public.products for each row execute function public.touch_updated_at();
create trigger t_blog before update on public.blog_posts for each row execute function public.touch_updated_at();
create trigger t_returns before update on public.returns for each row execute function public.touch_updated_at();

-- se la giacenza torna sopra la soglia, l'avviso scorte potrà ripartire
create or replace function public.reset_low_stock_alert() returns trigger language plpgsql as $$
begin
  if new.stock > new.low_stock_threshold then new.low_stock_alerted = false; end if;
  return new;
end $$;
create trigger t_variant_stock before update of stock, low_stock_threshold on public.product_variants
  for each row execute function public.reset_low_stock_alert();

-- ───────────── Row Level Security ─────────────
alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.coupons enable row level security;
alter table public.banners enable row level security;
alter table public.addresses enable row level security;
alter table public.wishlist enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.waitlist enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.returns enable row level security;
alter table public.blog_posts enable row level security;

-- profili: ognuno il suo, l'admin tutti. Il ruolo non si cambia da soli.
create policy profiles_self_read on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create or replace function public.protect_role() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and coalesce(auth.uid()::text, '') <> '' and not public.is_admin() then
    raise exception 'Non puoi cambiare il ruolo';
  end if;
  return new;
end $$;
create trigger t_protect_role before update on public.profiles for each row execute function public.protect_role();
create policy profiles_admin_all on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- lettura pubblica del catalogo pubblicato
create policy settings_read on public.settings for select using (true);
create policy settings_admin on public.settings for all using (public.is_admin()) with check (public.is_admin());
create policy categories_read on public.categories for select using (true);
create policy categories_admin on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy products_read on public.products for select using (published or public.is_admin());
create policy products_admin on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy images_read on public.product_images for select
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or public.is_admin())));
create policy images_admin on public.product_images for all using (public.is_admin()) with check (public.is_admin());
create policy variants_read on public.product_variants for select
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or public.is_admin())));
create policy variants_admin on public.product_variants for all using (public.is_admin()) with check (public.is_admin());
create policy banners_read on public.banners for select
  using ((active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())) or public.is_admin());
create policy banners_admin on public.banners for all using (public.is_admin()) with check (public.is_admin());
create policy blog_read on public.blog_posts for select using (published or public.is_admin());
create policy blog_admin on public.blog_posts for all using (public.is_admin()) with check (public.is_admin());

-- coupon, newsletter, lista d'attesa: solo admin (le scritture pubbliche passano dal server)
create policy coupons_admin on public.coupons for all using (public.is_admin()) with check (public.is_admin());
create policy newsletter_admin on public.newsletter_subscribers for all using (public.is_admin()) with check (public.is_admin());
create policy waitlist_admin on public.waitlist for all using (public.is_admin()) with check (public.is_admin());

-- dati della cliente
create policy addresses_own on public.addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy addresses_admin on public.addresses for select using (public.is_admin());
create policy wishlist_own on public.wishlist for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy orders_own_read on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy orders_admin on public.orders for all using (public.is_admin()) with check (public.is_admin());
create policy order_items_read on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
create policy order_items_admin on public.order_items for all using (public.is_admin()) with check (public.is_admin());
create policy returns_own_read on public.returns for select using (user_id = auth.uid() or public.is_admin());
create policy returns_admin on public.returns for all using (public.is_admin()) with check (public.is_admin());

-- ───────────── storage per le foto ─────────────
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;
create policy media_read on storage.objects for select using (bucket_id = 'media');
create policy media_admin_write on storage.objects for insert with check (bucket_id = 'media' and public.is_admin());
create policy media_admin_update on storage.objects for update using (bucket_id = 'media' and public.is_admin());
create policy media_admin_delete on storage.objects for delete using (bucket_id = 'media' and public.is_admin());
