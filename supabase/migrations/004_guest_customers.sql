-- Guest customers for catalog QR. Phone is required. Email is optional and unique once verified.

create table if not exists public.guest_customers (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  phone text not null,
  name text not null,
  email text,
  email_verified boolean not null default false,
  password_hash text,
  email_otp text,
  email_otp_expires timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cafe_id, phone)
);

create unique index if not exists guest_customers_cafe_email_idx
  on public.guest_customers (cafe_id, email)
  where email is not null and email_verified = true;

create index if not exists guest_customers_cafe_phone_idx
  on public.guest_customers (cafe_id, phone);

alter table public.guest_customers enable row level security;

alter table public.customer_orders
  add column if not exists guest_phone text;

alter table public.customer_orders
  add column if not exists guest_name text;
