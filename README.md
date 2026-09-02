# Adda Cafe — digital menu + Google Review Assistant

The existing Adda digital menu is preserved at `/menu`. QR codes now open the review assistant first (`/` or `/t/{table}`), then guests can open the menu.

This flow helps people write a review. It copies text and opens Google. It does **not** fill or submit Google’s form.

## Existing branding (kept)

- Red gradient dish cards, amber/orange category chips
- `max-w-md` mobile column, rounded-3xl cards, red header bar
- Logo `/adda.png`, tagline “Where Every Bite Tells a Story”
- Dark mode from time of day / system preference (same lighting hook)

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Redirects to `/review` |
| `/review` | Review assistant (QR default) |
| `/t/3` | Same review flow, tagged as table 3 |
| `/t/3/order` | Order scaffold (flag-gated) |
| `/menu` | Digital menu |
| `/staff` | Staff login |
| `/admin/menu` | Customer display menu + POS sync |
| `/admin/qr` | Printable table QR codes |
| `/admin/settings` | Google Review URL, table count |

## Environment variables

Copy `.env.example` to `.env.local`:

```
GEMINI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
ADMIN_COOKIE_SECRET=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_CAFE_ID=00000000-0000-0000-0000-000000000001
POS_INTEGRATION_BASE_URL=
POS_INTEGRATION_API_KEY=
POS_WEBHOOK_SECRET=
CRON_SECRET=
MENU_SYNC_MODE=pos
NEXT_PUBLIC_ORDERING_ENABLED=false
```

See `INTEGRATION.md` for POS menu sync, ordering, and webhooks.

Get a Gemini key from [Google AI Studio](https://aistudio.google.com/apikey). Use `gemini-2.0-flash` (free-tier friendly).

## Database

1. Create a Supabase project.
2. Run `supabase/schema.sql`, then `supabase/migrations/002_pos_integration.sql` and `003_orders.sql`.
3. Paste the project URL and keys into `.env.local`.
4. Put your Google review link in **Admin → Settings**.
5. Manage dishes in **Admin → Menu**.

Preferred Google URL format:

`https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID`

## Local development

```bash
npm install
npm run dev
```

- Review flow: http://localhost:3000
- Menu: http://localhost:3000/menu
- Staff login: http://localhost:3000/staff
- Admin dashboard: http://localhost:3000/admin

## Vercel

This is a **Next.js** app (not Vite). Next.js does not produce a `dist` folder.

1. In Vercel → Project → **Settings → General → Build and Deployment**:
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** leave empty (do not use `dist`)
   - **Install Command:** `npm install`
2. Add the same environment variables as `.env.example`.
3. Set `NEXT_PUBLIC_SITE_URL` to your production domain.
4. Redeploy after changing env vars or settings.
5. Enable the firewall / attack challenge if you see abusive traffic. App-level rate limits cannot stop a large DDoS; the CDN can.

## Security

- Admin cookie is httpOnly, SameSite=strict, and stores a SHA-256 session token (not the password).
- Login is same-origin only, rate-limited (5 tries / 15 minutes per IP), and uses a hidden honeypot field.
- Review generation is rate-limited. Request bodies are size-checked on login.
- Security headers (frame deny, nosniff, CSP, HSTS on HTTPS) are applied in middleware.
- Use a long unique `ADMIN_PASSWORD` and set `ADMIN_COOKIE_SECRET` in production.

## Google review policy notes

- No auto-submit, no DOM injection into Google.
- 1–3 star guests give private feedback first; a Google button is still offered.
- Do not reward or coerce reviews.

## Multi-cafe later

Every table already has `cafe_id`. Add more rows to `cafes` / `settings` and route by slug when you need a second location.
