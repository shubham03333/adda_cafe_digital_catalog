-- Customer order mirror (not operational source of truth). Run in Supabase SQL editor.

create table if not exists public.customer_orders (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  pos_order_id varchar(36),
  pos_order_number varchar(10),
  table_number int,
  idempotency_key varchar(64) unique not null,
  status text not null default 'pending_submit',
  payment_status text default 'pending',
  items jsonb not null,
  total numeric(10,2) not null,
  session_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists customer_orders_pos_order_id_idx on public.customer_orders (pos_order_id);
create index if not exists customer_orders_session_id_idx on public.customer_orders (session_id);
create index if not exists customer_orders_cafe_created_idx on public.customer_orders (cafe_id, created_at desc);

alter table public.customer_orders enable row level security;
