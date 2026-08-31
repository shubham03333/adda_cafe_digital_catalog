-- Adda Cafe review assistant
-- Run in the Supabase SQL editor. cafe_id is ready for multiple cafes later.

create extension if not exists "pgcrypto";

create table if not exists public.cafes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null unique references public.cafes(id) on delete cascade,
  cafe_name text not null default 'Adda',
  google_review_url text not null default '',
  table_count int not null default 10 check (table_count between 1 and 200),
  updated_at timestamptz not null default now()
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  session_id uuid not null,
  table_number int,
  stars int not null check (stars between 1 and 5),
  created_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  session_id uuid,
  rating_id uuid references public.ratings(id) on delete set null,
  table_number int,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.review_sessions (
  id uuid primary key,
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  table_number int,
  rating int,
  ordered_items text[] default '{}',
  service text,
  recommend text,
  language text not null default 'en',
  generated_reviews jsonb,
  selected_review_index int,
  selected_review_text text,
  copied_at timestamptz,
  google_clicked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ratings_cafe_created_idx on public.ratings (cafe_id, created_at desc);
create index if not exists feedback_cafe_created_idx on public.feedback (cafe_id, created_at desc);
create index if not exists analytics_cafe_event_idx on public.analytics (cafe_id, event_type, created_at desc);
create index if not exists review_sessions_cafe_idx on public.review_sessions (cafe_id, created_at desc);

insert into public.cafes (id, name, slug)
values ('00000000-0000-0000-0000-000000000001', 'Adda Cafe', 'adda')
on conflict (id) do nothing;

insert into public.settings (cafe_id, cafe_name, google_review_url, table_count)
values (
  '00000000-0000-0000-0000-000000000001',
  'Adda',
  '',
  10
)
on conflict (cafe_id) do nothing;

alter table public.cafes enable row level security;
alter table public.settings enable row level security;
alter table public.ratings enable row level security;
alter table public.feedback enable row level security;
alter table public.review_sessions enable row level security;
alter table public.analytics enable row level security;

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  name text not null,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  category text not null,
  rating numeric(2,1) not null default 4.0 check (rating >= 0 and rating <= 5),
  popular boolean not null default false,
  available boolean not null default true,
  image text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists menu_items_cafe_sort_idx on public.menu_items (cafe_id, sort_order);

alter table public.menu_items enable row level security;

create policy "menu_items_public_read"
  on public.menu_items for select
  using (available = true);

insert into storage.buckets (id, name, public)
values ('menu-photos', 'menu-photos', true)
on conflict (id) do nothing;

-- Public guests never read data. Server uses the service role key, which bypasses RLS.
-- If you later switch to the anon key from the browser, add insert-only policies.

create policy "settings_public_read"
  on public.settings for select
  using (true);
