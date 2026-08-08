# CelebrateBanner App — Claude Code Guide

## Who I am
- **Founder & CEO:** Duckson Cadet
- **Email:** ducksoncadet3@gmail.com | info@celebratebanner.com
- **Phone:** +1 772-834-9060
- **Business:** CDN4 LLC (DBA CelebrateBanner)
- **Address:** 211 Old Okeechobee Road, Bay 2 #1058, West Palm Beach, FL 33401

---

## What this repo is
This repo now holds **two** front-ends:
- **Active:** the **Next.js 15 app in [`web/`](web/)** — the production storefront + builder,
  deployed to **Fly.io** (`celebratebanner-web`) via [`Dockerfile.web`](Dockerfile.web) +
  [`fly.web.toml`](fly.web.toml). This is what `app.celebratebanner.com` serves after cutover.
- **Legacy:** the single-file `index.html` canvas app at the repo root. It predates the Next.js
  app and remains only as a fallback/reference. **Legacy only — not the deploy target.**

Deployment facts:
- **App domain:** https://app.celebratebanner.com → the Next.js app on Fly.io (post-cutover)
- **GitHub:** ducksoncadet3-glitch/celebratebanner-app
- **Deploy (active):** `fly deploy --config fly.web.toml --dockerfile Dockerfile.web .`
  (see [docs/DEPLOY_COMMANDS.md](docs/DEPLOY_COMMANDS.md) — the authoritative topology)
- **NOT** deployed on Vercel; the legacy GitHub Pages / single-file model is legacy only.

---

## Files in this repo

| File | Purpose |
|------|---------|
| `index.html` | **Main builder app** — 1,705 lines, single-file HTML/CSS/JS |
| `bannercraft-app.html` | Alternate/backup version of the builder |
| `README.md` | Repo description |

---

## App Architecture — index.html

This is a **single-page, multi-step wizard** built entirely in one HTML file. No build tools, no npm, no React — pure HTML + CSS + JavaScript with Canvas rendering.

### Design System
- **Fonts:** Cormorant Garamond (display/headings) + Outfit (UI/body)
- **Palette:** Deep Obsidian (`#0C0E14`) + Champagne Gold (`#C9A84C`) + Ivory (`#FAF8F3`)
- **Aesthetic:** Luxury editorial — dark, refined, gold accents

### CSS Variables (defined in :root)
```css
--obsidian: #0C0E14
--gold: #C9A84C
--gold2: #E8C97A
--gold3: #F5E4B0
--ivory: #FAF8F3
--sky: #4A9ECC      ← info/digital delivery
--rose: #C4617A     ← error/warning
--sage: #5A8F6A     ← success
--border: rgba(201,168,76,0.18)
```

### 5-Step Builder Flow (Pages 0–6)
| Page | ID | Step |
|------|----|------|
| 0 | `#pg-0` | Theme selector |
| 1 | `#pg-1` | Photo upload (drag & drop, file input) |
| 2 | `#pg-2` | Customize (text fields, size, color palette) |
| 3 | `#pg-3` | Preview (Canvas-based live render) |
| 4 | `#pg-4` | Checkout (delivery method + Stripe form UI) |
| 5 | `#pg-5` | Processing spinner |
| 6 | `#pg-6` | Success + download links |

### Admin Panel
- Toggled via "Admin ⚙️" button in header
- Tabs: Dashboard, Themes, Orders, Analytics, Settings
- Shows stats (orders, revenue, render time, active themes)
- Theme toggle switches (enable/disable per theme)
- Order table with status badges

### Key JavaScript Functions
- `gotoPage(n)` — navigate between steps, updates progress bar
- `handleFiles(files)` — processes uploaded photos, checks DPI
- `buildPreview()` — renders banner onto `<canvas id="preview-canvas">`
- `selectSize(sz, el)` — switches between 24×36 and 18×24
- `selectDelivery(type, el)` — digital or print selection
- `processPayment()` — triggers Stripe payment flow
- `resetBuilder()` — resets all state for new order
- `showAdmin()` / `hideAdmin()` — toggle admin panel

---

## Launch Themes (currently in app)

### Graduation
- Up to 50 photos (1 hero + auto collage)
- Text fields: Name, Class/Year, School (optional)
- Palette: Black/Gold default, editable
- Layout: hero centered, supporting photos in stair/collage

### Champions (Team)
- Up to 10 photos (1 hero + 9 supporting grid)
- Fixed headline: "Champions"
- Background: generic stadium + lights
- Palette: Sky blue / white / gold
- ⚠️ NO licensed logos or player likenesses

### Also referenced in app: Wedding, Anniversary, Pets
- These themes are in the themes grid config in JS
- May need full implementation or are partially stubbed

> **Removed (Sprint 15.1 — Product Focus Cleanup):** The **America 250** and
> **World Cup 2026** themes were retired. CelebrateBanner focuses on evergreen
> celebration products, not temporary event products. Their theme entries, canvas
> decorations, CSS, and the standalone `america-250.html` marketing page were
> removed from the customer-facing app.

---

## Output Specs (non-negotiable)
- Sizes: **24×36 in** and **18×24 in**
- Resolution: **300 DPI**
- Color mode: **CMYK**
- Formats: **PDF + JPG**
- Bleed: **0.125 in** | Safe margin: **0.25 in**
- Preview canvas renders at lower DPI for speed (≤30s target)
- Final render via API at full 300 DPI (≤60s target)

---

## Pricing (DO NOT CHANGE without Printmoz confirmation)

### Graduation Signature Banner — LAUNCH pricing (authoritative)
| Item | Price |
|------|-------|
| Printed Graduation Signature Banner (24×36 in) | **$79.99** |
| Digital download | **$9.99** (flat) |

> **Verified 2026-07-10** against the live Stripe Payment Links (merchant **CDN4LLC**):
> the printed link (`buy.stripe.com/bJe2…83C05`) charges **$79.99** and the digital link
> (`buy.stripe.com/7sY8…83C00`) charges **$9.99**. Displayed prices in
> `graduation-signature.html` and `index.html` (graduation-poster · Standard Poster tier)
> are reconciled to match these Stripe amounts exactly.

> ⚠️ **Legacy / unreconciled (fallback builder only):** `index.html`'s other graduation
> poster tiers still display `poster_premium $86.00`, `poster_framed $129.99`,
> `poster_gallery $159.99`, all pointing at the **same** $79.99 Stripe link. These
> upper tiers are **not** part of the Graduation Signature launch and need their own
> Stripe links (or corrected display prices) before they are sold. Digital remains a
> flat $9.99 regardless of arrangement.

---

## API Connection
This frontend talks to the backend at:
- **Dev:** `http://localhost:4000`
- **Production:** `https://api.celebratebanner.com`

Key endpoints used:
- `POST /api/upload/photos` — uploads photos to Cloudinary
- `POST /api/checkout/session` — creates Stripe Checkout session
- `GET /api/render/status/:id` — polls render progress
- `GET /api/admin/config` — loads theme config for admin panel

---

## Pending Items for this repo
- [x] ~~Add America250 theme to themes grid~~ (retired — Sprint 15.1, evergreen focus)
- [x] ~~Add World Cup 2026 Watch Party theme~~ (retired — Sprint 15.1, evergreen focus)
- [ ] Add Haitian Flag Day theme (bilingual French/Creole)
- [ ] Wire up real Stripe Checkout (currently UI mock)
- [ ] Connect preview canvas to API for real render
- [ ] Fix any footer showing wrong city/year
- [ ] Add GA4 + Meta Pixel tracking events

---

## Deploy Workflow

### Active (Next.js app in `web/` → Fly.io)
The authoritative, full sequence — build context, process groups, migration release
command, health endpoints, required secrets, deploy order, DNS cutover, and rollback —
lives in **[docs/DEPLOY_COMMANDS.md](docs/DEPLOY_COMMANDS.md) → "Deployment topology (authoritative)"**.
In short:
```
web: fly deploy --config fly.web.toml --dockerfile Dockerfile.web .
api + workers: fly deploy --config backend-stub/fly.toml --dockerfile backend-stub/Dockerfile .
```

### Legacy (single-file `index.html`) — legacy only
The old GitHub-Pages-style "edit index.html and paste the whole file" flow applied to the
single-file app. It is **not** the production deploy path anymore; do not treat edits to
`index.html` as a release.

---

## Deployment (authoritative)
- **The active app deploys to Fly.io** — `web/` (Next.js) as `celebratebanner-web`, and
  `backend-stub/` (API + render worker + recovery worker) as `celebratebanner-api` with three
  process groups. See [docs/DEPLOY_COMMANDS.md](docs/DEPLOY_COMMANDS.md) and
  [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md).
- It is **NOT** deployed on Vercel, and the GitHub Pages / single-file model is **legacy only**.
- Any **Vercel checks appearing on PRs** are a dead/abandoned integration and do
  **not** reflect the real deploy. They can be ignored, and the Vercel GitHub-app
  integration should be disconnected in repo **Settings**. (There is no Vercel workflow
  file in this repo — the check comes from the external Vercel GitHub App.)

---

## Key Rules for Claude Code
1. **Single file** — all HTML, CSS, and JS stays in `index.html`
2. **Never use npm/React/build tools** — this is intentionally vanilla HTML
3. **Preserve the design system** — Obsidian/Gold/Ivory palette, Cormorant + Outfit fonts
4. **CMYK + 300 DPI** non-negotiable for all print outputs
5. **Never change pricing** without Printmoz reseller confirmation
6. **No licensed logos or player likenesses** in Champion theme
7. **Always deliver complete file** — Duckson pastes full file into GitHub editor
8. **Test in browser** before delivering — open index.html locally and verify all 6 pages navigate correctly

---

## Connection to Other Repos
- Backend API: `ducksoncadet3-glitch/celebratebanner-api`
- Admin panel: `ducksoncadet3-glitch/celebratebanner-admin`
- Main platform context: `ducksoncadet3-glitch/celebratebanner/CLAUDE.md`

---

## Quick Start for Claude Code
Use Codespaces + Claude Code workflow. Edit files locally in the workspace, commit on a feature branch, push, open a PR for review.

```bash
# In Codespaces (or local clone)
git checkout -b my-feature-branch
# edit index.html with Claude Code
git add index.html
git commit -m "describe change"
git push -u origin my-feature-branch
gh pr create   # then review + merge
```
