-- Birthday / WhatsApp opt-in only. Does NOT store bills or coupon punches.
-- Redemptions stay on POS (TiDB). Safe to run on existing guest_customers.

alter table public.guest_customers
  add column if not exists date_of_birth date;

alter table public.guest_customers
  add column if not exists offers_opt_in boolean not null default false;

comment on column public.guest_customers.date_of_birth is 'Used to suggest birthday offers; POS still punches the code.';
comment on column public.guest_customers.offers_opt_in is 'Guest agreed to offer WhatsApp / SMS.';
