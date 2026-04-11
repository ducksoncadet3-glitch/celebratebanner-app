# CelebrateBanner App — Claude Code Guide

## Who I am
- **Founder & CEO:** Duckson Cadet
- **Email:** ducksoncadet3@gmail.com | info@celebratebanner.com
- **Phone:** +1 772-834-9060
- **Business:** CDN4 LLC (DBA CelebrateBanner)
- **Address:** 211 Old Okeechobee Road, Bay 2 #1058, West Palm Beach, FL 33401

---

## What this repo is
This is the **banner builder front-end app** — a single-file HTML/CSS/JS canvas-based application deployed at:
- **Live URL:** https://celebratebanner-app.vercel.app
- **Production URL:** https://app.celebratebanner.com
- **GitHub:** ducksoncadet3-glitch/celebratebanner-app
- **Deploy:** Commit to GitHub → Vercel auto-deploys

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
| Size | Price |
|------|-------|
| 24×36 in | $49 |
| 18×24 in | $39 |
| Print add-on | +$18 |
| Digital download | Included |

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
- [ ] Add America250 theme to themes grid
- [ ] Add World Cup 2026 Watch Party theme
- [ ] Add Haitian Flag Day theme (bilingual French/Creole)
- [ ] Wire up real Stripe Checkout (currently UI mock)
- [ ] Connect preview canvas to API for real render
- [ ] Fix any footer showing wrong city/year
- [ ] Add GA4 + Meta Pixel tracking events

---

## Deploy Workflow
```
1. Edit index.html in Claude Code
2. Open GitHub: github.com/ducksoncadet3-glitch/celebratebanner-app
3. Click index.html → Edit (pencil icon)
4. Select All → Paste updated file → Commit changes
5. Vercel auto-deploys to celebratebanner-app.vercel.app
```

> ⚠️ Always deliver the **complete index.html** — never partial snippets.
> This is a single-file app. Every edit = full file replacement.

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
```bash
# Clone the repo
git clone https://github.com/ducksoncadet3-glitch/celebratebanner-app
cd celebratebanner-app

# Open and edit
# No npm install needed — pure HTML
open index.html   # preview in browser

# After editing, commit via GitHub web editor
# Vercel auto-deploys on commit
```
