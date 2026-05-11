# celebratebanner-admin — drop-in scaffold

Operator dashboard for CelebrateBanner. Lives in a separate repo
(`celebratebanner-admin`) so its auth + access controls are completely
isolated from the public site.

This folder is a **scaffold you copy into that repo**. It assumes the
admin app is also Next.js 15 + TypeScript + Tailwind (same stack as
`/web`), so the styling tokens line up.

## Files in this scaffold

```
admin-stub/
├── README.md
├── app/
│   ├── layout.tsx              shared admin chrome + auth gate
│   ├── page.tsx                overview — counts, recent activity, render queue
│   ├── projects/page.tsx       project list + status filters
│   ├── projects/[id]/page.tsx  single-project viewer (re-render, refund tools)
│   ├── queue/page.tsx          BullMQ queue monitor
│   └── payments/page.tsx       Stripe payments table
├── components/
│   ├── stat-card.tsx
│   ├── status-pill.tsx
│   └── data-table.tsx
└── lib/
    └── admin-api.ts            typed client against celebratebanner-api admin endpoints
```

## Required backend endpoints

Add these to `celebratebanner-api` (auth-gated with admin scope):

| Method  | Path                                 | Purpose                                |
| ------- | ------------------------------------ | -------------------------------------- |
| GET     | `/api/admin/overview`                | counts + recent activity for the home  |
| GET     | `/api/admin/projects?status=&q=`     | list projects, filterable              |
| GET     | `/api/admin/projects/:id`            | single project with full render history |
| POST    | `/api/admin/projects/:id/rerender`   | manually re-enqueue an HD render       |
| POST    | `/api/admin/projects/:id/refund`     | issue a Stripe refund                  |
| GET     | `/api/admin/queue`                   | BullMQ depth + recent failures         |
| POST    | `/api/admin/queue/:jobId/retry`      | retry a failed BullMQ job              |
| POST    | `/api/admin/queue/:jobId/cancel`     | cancel a queued (not running) job      |
| GET     | `/api/admin/payments?email=`         | payments table                         |

These endpoints are NOT in `backend-stub/` yet — they're listed here as the
contract. Wiring them is a follow-up; the scaffold below already calls them.

## Auth

This dashboard is internal. The scaffold assumes you front it with either:

- Your own admin SSO (Okta/Google Workspace) via `next-auth` + a custom guard
  that checks `users.is_admin === true` in Postgres, OR
- Vercel password protection + an `ADMIN_BEARER_TOKEN` env that the
  `admin-api.ts` client sends as `Authorization: Bearer …`.

`app/layout.tsx` redirects unauthenticated requests to `/login`.
