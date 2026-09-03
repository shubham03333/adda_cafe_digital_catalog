-- Faster lookup of past orders by guest phone (order menu "My orders").

create index if not exists customer_orders_guest_phone_idx
  on public.customer_orders (cafe_id, guest_phone, created_at desc);
