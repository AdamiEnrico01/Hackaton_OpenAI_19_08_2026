-- crIA MVP schema. Run in a Supabase project with Auth enabled.

create table if not exists public.brands (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  segment text,
  audience text,
  tone text,
  primary_color text,
  secondary_colors text[] not null default '{}',
  typography jsonb not null default '{}'::jsonb,
  brand_voice jsonb not null default '{}'::jsonb,
  source_url text,
  logo_path text,
  status text not null default 'draft' check (status in ('draft', 'analyzing', 'ready')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, slug)
);

create table if not exists public.brand_assets (
  id bigint generated always as identity primary key,
  brand_id bigint not null references public.brands(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('logo', 'product', 'reference')),
  name text not null,
  storage_path text,
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id bigint generated always as identity primary key,
  brand_id bigint not null references public.brands(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  format text not null check (format in ('campaign', 'story', 'carousel', 'post')),
  brief text not null,
  status text not null default 'draft' check (status in ('draft', 'queued', 'generating', 'ready', 'failed')),
  output jsonb not null default '{}'::jsonb,
  text_model text,
  image_model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_assets (
  campaign_id bigint not null references public.campaigns(id) on delete cascade,
  asset_id bigint not null references public.brand_assets(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (campaign_id, asset_id)
);

create table if not exists public.generation_events (
  id bigint generated always as identity primary key,
  campaign_id bigint not null references public.campaigns(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  feature text not null,
  model text not null,
  input_tokens bigint,
  output_tokens bigint,
  cost_usd numeric(12, 6),
  latency_ms bigint,
  provider_request_id text,
  created_at timestamptz not null default now()
);

create index if not exists brands_owner_id_idx on public.brands(owner_id);
create index if not exists brand_assets_brand_id_idx on public.brand_assets(brand_id);
create index if not exists brand_assets_owner_id_idx on public.brand_assets(owner_id);
create index if not exists campaigns_brand_id_idx on public.campaigns(brand_id);
create index if not exists campaigns_owner_id_created_at_idx on public.campaigns(owner_id, created_at desc);
create index if not exists campaign_assets_asset_id_idx on public.campaign_assets(asset_id);
create index if not exists campaign_assets_owner_id_idx on public.campaign_assets(owner_id);
create index if not exists generation_events_campaign_id_idx on public.generation_events(campaign_id);
create index if not exists generation_events_owner_id_created_at_idx on public.generation_events(owner_id, created_at desc);

alter table public.brands enable row level security;
alter table public.brand_assets enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_assets enable row level security;
alter table public.generation_events enable row level security;

drop policy if exists "brands_owner_select" on public.brands;
drop policy if exists "brands_owner_insert" on public.brands;
drop policy if exists "brands_owner_update" on public.brands;
drop policy if exists "brands_owner_delete" on public.brands;
create policy "brands_owner_select" on public.brands for select to authenticated using ((select auth.uid()) = owner_id);
create policy "brands_owner_insert" on public.brands for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "brands_owner_update" on public.brands for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "brands_owner_delete" on public.brands for delete to authenticated using ((select auth.uid()) = owner_id);

drop policy if exists "brand_assets_owner_select" on public.brand_assets;
drop policy if exists "brand_assets_owner_insert" on public.brand_assets;
drop policy if exists "brand_assets_owner_update" on public.brand_assets;
drop policy if exists "brand_assets_owner_delete" on public.brand_assets;
create policy "brand_assets_owner_select" on public.brand_assets for select to authenticated using ((select auth.uid()) = owner_id);
create policy "brand_assets_owner_insert" on public.brand_assets for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "brand_assets_owner_update" on public.brand_assets for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "brand_assets_owner_delete" on public.brand_assets for delete to authenticated using ((select auth.uid()) = owner_id);

drop policy if exists "campaigns_owner_select" on public.campaigns;
drop policy if exists "campaigns_owner_insert" on public.campaigns;
drop policy if exists "campaigns_owner_update" on public.campaigns;
drop policy if exists "campaigns_owner_delete" on public.campaigns;
create policy "campaigns_owner_select" on public.campaigns for select to authenticated using ((select auth.uid()) = owner_id);
create policy "campaigns_owner_insert" on public.campaigns for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "campaigns_owner_update" on public.campaigns for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "campaigns_owner_delete" on public.campaigns for delete to authenticated using ((select auth.uid()) = owner_id);

drop policy if exists "campaign_assets_owner_select" on public.campaign_assets;
drop policy if exists "campaign_assets_owner_insert" on public.campaign_assets;
drop policy if exists "campaign_assets_owner_delete" on public.campaign_assets;
create policy "campaign_assets_owner_select" on public.campaign_assets for select to authenticated using ((select auth.uid()) = owner_id);
create policy "campaign_assets_owner_insert" on public.campaign_assets for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "campaign_assets_owner_delete" on public.campaign_assets for delete to authenticated using ((select auth.uid()) = owner_id);

drop policy if exists "generation_events_owner_select" on public.generation_events;
drop policy if exists "generation_events_owner_insert" on public.generation_events;
create policy "generation_events_owner_select" on public.generation_events for select to authenticated using ((select auth.uid()) = owner_id);
create policy "generation_events_owner_insert" on public.generation_events for insert to authenticated with check ((select auth.uid()) = owner_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.brands, public.brand_assets, public.campaigns, public.campaign_assets to authenticated;
grant select, insert on public.generation_events to authenticated;
grant usage, select on all sequences in schema public to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists brands_set_updated_at on public.brands;
create trigger brands_set_updated_at before update on public.brands
for each row execute function public.set_updated_at();

drop trigger if exists campaigns_set_updated_at on public.campaigns;
create trigger campaigns_set_updated_at before update on public.campaigns
for each row execute function public.set_updated_at();
