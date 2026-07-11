# Concierge Fulfillment V1 — Order Capture

Captures every Graduation Signature Banner order **before** the customer reaches
Stripe, so no paid order is ever lost. You then fulfill the first 10–20 orders by
hand using the captured photos + details. No rendering, no Printful/Gelato, no
auto-delivery — on purpose.

## What it does per order
1. Creates **one folder per order** in your Google Drive (`CelebrateBanner Orders/CB-…`).
2. Saves **every uploaded photo at full resolution** into that folder (hero flagged).
3. Appends a row to a **Google Sheet** order log.
4. **Emails you immediately** with the order number, customer info, and links to the
   Drive folder + Sheet row.
5. Only *after* a confirmed save, sends the customer to the existing Stripe link.

If the save fails, the customer is **not** sent to payment and their card is not
charged — they’re asked to retry. That is the "no order is ever lost" guarantee.

## Files
- `order-capture.gs` — the Google Apps Script Web App (deploy this).
- The page `graduation-signature.html` calls it (config at the top of its script).

## Deploy (once, ~5 minutes)
1. Sign in to the Google account that should **own the photos + sheet**
   (e.g. `info@celebratebanner.com`).
2. Open **https://script.new**, delete the sample, paste all of `order-capture.gs`.
3. Edit the CONFIG block:
   - `NOTIFY_EMAIL` — where order alerts go.
   - `CAPTURE_TOKEN` — leave as `cb-concierge-v1` or change it (see step 6).
4. **Deploy ▸ New deployment ▸ Web app**
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
   - Deploy, then **Authorize access** when prompted (grants Drive/Sheets/Gmail
     to your own account only).
5. Copy the **Web app URL** (ends in `/exec`). Open it in a browser — you should see
   `{"status":"ok","service":"CelebrateBanner order capture is live"}`.
6. In `graduation-signature.html`, set:
   ```js
   const ORDER_CAPTURE_URL   = 'https://script.google.com/macros/s/……/exec';
   const ORDER_CAPTURE_TOKEN = 'cb-concierge-v1'; // must equal CAPTURE_TOKEN in the script
   ```
7. Place a test order end-to-end. Confirm: Drive folder + photos, a Sheet row, and
   the email arrived. (Cancel out of Stripe — don’t pay your own test.)

## Reconciling a payment to an order
The order number (`CB-YYYYMMDD-…`) is passed to Stripe in `client_reference_id`.
When a payment lands in your Stripe dashboard, match its `client_reference_id`
to the Drive folder / Sheet row, then make and deliver the banner.

## Updating the script later
Edit the code in the Apps Script editor, then **Deploy ▸ Manage deployments ▸
edit ▸ New version**. The `/exec` URL stays the same.

## Notes / limits (fine for 10–20 concierge orders)
- The `CAPTURE_TOKEN` only deters casual spam (it’s visible in client JS). Fine for
  V1; the production backend replaces this later.
- Photos upload one at a time for reliability with large phone images.
- Everything stays inside your own Google account.
