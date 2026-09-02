# POS ↔ Digital Catalog integration

POS (TiDB) is the operational source of truth. The catalog (Supabase) is the customer surface. Customers never connect to TiDB.

Set `POS_INTEGRATION_API_KEY` to the same value as POS `INTEGRATION_API_KEY`.
Set `POS_WEBHOOK_SECRET` to the same value as POS `INTEGRATION_WEBHOOK_SECRET`.

## Menu sync

```
Catalog cron/admin → GET POS /api/integrations/menu → upsert Supabase menu_items
Customer /menu → Supabase only (0 TiDB requests)
```

- Interval: Vercel cron every 15 minutes (`/api/cron/menu-sync`) with `CRON_SECRET`.
- Manual: Admin → Menu → Sync menu from POS.
- `MENU_SYNC_MODE=pos` (default): hide create/delete; allow photo/rating/popular overrides.
- `MENU_SYNC_MODE=local`: previous catalog editor.
- If POS is down, `/menu` and `/review` keep using the last Supabase copy (or bundled fallback).

## Order submit

```
Guest /t/{n}/order → placeOrder → POST POS /api/integrations/orders → store customer_orders
POS waiter/chef/pay → signed webhook → /api/webhooks/pos-orders
```

- Enable UI with `NEXT_PUBLIC_ORDERING_ENABLED=true`.
- One POS write per place. No catalog polling. Optional single GET if status is older than 30s.
- Idempotency key is unique per submit tap.

## Webhooks

POS sends `X-Webhook-Signature: sha256=<hex>` of the raw JSON body.
Catalog verifies with `POS_WEBHOOK_SECRET`. Set POS `CATALOG_WEBHOOK_URL` to:

`https://<catalog-host>/api/webhooks/pos-orders`

## Table mapping

QR uses `/t/{n}` (example `/t/5/order`). POS `table_code` values are `T01`–`T12`. Default map: `5` → `T05`. Override with Admin table_map JSON or `TABLE_NUMBER_TO_CODE`.

## SQL (manual)

1. `supabase/migrations/002_pos_integration.sql`
2. `supabase/migrations/003_orders.sql`

## Rollback

Unset `POS_INTEGRATION_API_KEY` / `NEXT_PUBLIC_ORDERING_ENABLED`. Menu and reviews still work from Supabase. POS staff apps are unchanged.
