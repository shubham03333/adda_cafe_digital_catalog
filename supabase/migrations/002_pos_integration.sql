-- Catalog POS integration columns. Run in Supabase SQL editor. Do not auto-run.

alter table public.menu_items
  add column if not exists pos_menu_item_id int;

create unique index if not exists menu_items_cafe_pos_id_idx
  on public.menu_items (cafe_id, pos_menu_item_id)
  where pos_menu_item_id is not null;

alter table public.settings
  add column if not exists table_map jsonb not null default '{}'::jsonb;

create table if not exists public.sync_log (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  job text not null,
  ok boolean not null,
  message text,
  item_count int,
  created_at timestamptz not null default now()
);

create index if not exists sync_log_cafe_created_idx
  on public.sync_log (cafe_id, created_at desc);

alter table public.sync_log enable row level security;
