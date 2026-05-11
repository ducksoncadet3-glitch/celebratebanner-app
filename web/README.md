# CelebrateBanner — Next.js 15 Frontend

Production-ready storefront + builder for [celebratebanner.com](https://celebratebanner.com).

This is the **new** React/Next.js frontend. The current live site at
`celebratebanner-app.vercel.app` is still served by the single-file
`index.html` at the repo root — that keeps shipping until this app reaches
feature parity. Deploy this app to its own Vercel project pointed at `/web`.

## Stack

- **Next.js 15** App Router · React 19 · TypeScript
- **Tailwind CSS 3** with the CelebrateBanner palette (Obsidian / Gold / Ivory)
  and the Cormorant Garamond + Outfit fonts loaded via `next/font/google`
- **Stripe** Checkout Sessions (server-driven via the `celebratebanner-api`
  backend — no secret keys touch the browser)
- Zero runtime CSS-in-JS, no Radix runtime, no Framer Motion — animations are
  Tailwind keyframes for a small bundle

## Routes

| Path        | Purpose                                              |
| ----------- | ---------------------------------------------------- |
| `/`         | Marketing home — hero, value, how-it-works, themes, pricing |
| `/create`   | 3-step builder: theme → photos → details             |
| `/pricing`  | Pricing tiers + FAQ                                  |
| `/gallery`  | Sample banners                                       |
| `/success`  | Post-Stripe redirect — polls render status, surfaces signed download URLs |
| `/cancel`   | Post-Stripe canceled redirect                        |

## Local dev

```bash
cd web
cp .env.example .env.local      # fill in NEXT_PUBLIC_API_BASE_URL etc.
npm install
npm run dev                     # http://localhost:3000
```

## Env vars

See `.env.example` for the full list. Key ones:

| Var                                  | Where     | Purpose                                      |
| ------------------------------------ | --------- | -------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`               | public    | Canonical URL, used for SEO + Stripe redirects |
| `NEXT_PUBLIC_API_BASE_URL`           | public    | celebratebanner-api base URL                 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | public    | Only used if we ever embed Stripe Elements   |
| `NEXT_PUBLIC_LEGACY_STRIPE_LINK`     | public    | Fallback link during the API migration       |
| `API_INTERNAL_BASE_URL`              | server-only | Optional private URL for server-side API calls |
| `API_SHARED_SECRET`                  | server-only | Sent as `x-internal-secret` header           |

**Never** put `sk_…` or `whsec_…` here. Those live exclusively on the backend.

## Stripe migration

The static payment link
(`https://buy.stripe.com/7sY8wHeEUb9n27KgxR83C00`) is still wired as a
**fallback only**: if `POST /api/payments/checkout` returns 5xx, the frontend
sends the user to the legacy link so they can still pay while the API is
broken. Remove it from `.env` once the new flow is stable in prod.

The full backend routes for the new flow live in `/backend-stub/` at the repo
root. They're written for Express; copy them into
[celebratebanner-api](https://github.com/ducksoncadet3-glitch/celebratebanner-api)
and register as shown in that README.

## Deploy

Two safe options:

1. **Separate Vercel project** pointed at this `/web` subdirectory. Domain:
   start with `web-celebratebanner.vercel.app`, promote to `app.celebratebanner.com`
   when ready. The current static site keeps serving from `index.html`.
2. **Promote to root** once feature parity is reached — move files up and delete
   the legacy `index.html`. Until then, leave Vercel root unchanged.

## Architecture decisions

- **Server-driven Stripe**: amounts come from `lib/pricing.ts` on the client
  (display) and `backend-stub/lib/pricing.js` on the server (authoritative).
  Stripe Checkout Sessions are minted server-side so the browser can't tamper.
- **Project IDs are client-minted** opaque strings (`proj_…`). The server
  creates the row on first checkout request; the webhook updates status.
- **No third-party state library** — pages are isolated, state is local. If we
  ever need cross-page builder state, we'll add Zustand at that point.
- **SEO**: each page exports `metadata` via the `buildMetadata` helper. The
  root layout injects organization JSON-LD.
- **Accessibility**: skip-to-content link, focus rings via Tailwind ring,
  `aria-label`s on icon buttons, `aria-expanded` on the mobile menu.
