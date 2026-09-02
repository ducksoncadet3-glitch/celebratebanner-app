'use strict';

/**
 * Campaign attribution storage + reporting.
 *
 * Append-only writes into analytics_events, and one aggregate query for the admin report.
 * Never stores card data, email, IP or user agent — see the migration for the privacy note.
 */

const { query, rows } = require('./index');
const { normalizeAttribution } = require('../services/attribution');

/**
 * Record one funnel event. Returns { recorded: boolean }.
 *
 * `dedupeKey` makes the write idempotent: a repeat (a redelivered Stripe webhook, a success
 * page refresh) is silently ignored via ON CONFLICT DO NOTHING rather than double-counting.
 * Analytics must never break commerce, so a failure here is swallowed by the caller.
 */
async function recordEvent({
  eventType,
  productSlug = null,
  productMode = null,
  attribution = {},
  projectId = null,
  sessionRef = null,
  amountCents = null,
  currency = null,
  dedupeKey = null,
}) {
  const a = normalizeAttribution(attribution);
  const res = await query(
    `INSERT INTO analytics_events
       (event_type, product_slug, product_mode, utm_source, utm_medium, utm_campaign,
        utm_content, attribution_id, project_id, session_ref, amount_cents, currency, dedupe_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (dedupe_key) DO NOTHING
     RETURNING id`,
    [
      eventType, productSlug, productMode,
      a.utmSource, a.utmMedium, a.utmCampaign, a.utmContent, a.attributionId,
      projectId, sessionRef, amountCents, currency, dedupeKey,
    ],
  );
  return { recorded: res.rowCount > 0 };
}

/**
 * Funnel by platform / campaign / product, optionally broken down by creative.
 *
 * Revenue counts ONLY purchase_completed rows, which are written by the Stripe webhook — a
 * success-page visit is never a sale.
 */
async function funnelReport({ days = 30, byCreative = false } = {}) {
  const creativeSelect = byCreative ? 'utm_content,' : 'NULL::text AS utm_content,';
  const creativeGroup = byCreative ? ', utm_content' : '';
  return rows(
    `SELECT utm_source, utm_campaign, ${creativeSelect} product_slug, product_mode,
            COUNT(*) FILTER (WHERE event_type = 'product_view')        AS product_views,
            COUNT(*) FILTER (WHERE event_type = 'checkout_started')    AS checkout_starts,
            COUNT(*) FILTER (WHERE event_type = 'purchase_completed')  AS purchases,
            COALESCE(SUM(amount_cents) FILTER (WHERE event_type = 'purchase_completed'), 0) AS revenue_cents
       FROM analytics_events
      WHERE occurred_at > NOW() - ($1 || ' days')::interval
      GROUP BY utm_source, utm_campaign, product_slug, product_mode${creativeGroup}
      ORDER BY revenue_cents DESC, product_views DESC`,
    [String(days)],
  );
}

/** Headline totals for the same window. */
async function funnelTotals({ days = 30 } = {}) {
  const r = await rows(
    `SELECT COUNT(*) FILTER (WHERE event_type = 'product_view')       AS product_views,
            COUNT(*) FILTER (WHERE event_type = 'checkout_started')   AS checkout_starts,
            COUNT(*) FILTER (WHERE event_type = 'purchase_completed') AS purchases,
            COALESCE(SUM(amount_cents) FILTER (WHERE event_type = 'purchase_completed'), 0) AS revenue_cents
       FROM analytics_events
      WHERE occurred_at > NOW() - ($1 || ' days')::interval`,
    [String(days)],
  );
  return r[0] || { product_views: 0, checkout_starts: 0, purchases: 0, revenue_cents: 0 };
}

/** Percentage helper used by the report (0 when the denominator is 0). */
function rate(numerator, denominator) {
  const n = Number(numerator) || 0;
  const d = Number(denominator) || 0;
  return d === 0 ? 0 : Math.round((n / d) * 1000) / 10;
}

module.exports = { recordEvent, funnelReport, funnelTotals, rate };
