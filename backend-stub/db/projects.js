/**
 * Project repository — Postgres-backed replacement for the in-memory stub.
 *
 * All callers (payments.webhook, payments.checkout, render.worker, routes)
 * go through this module so the data model stays consistent.
 */

const { one, query, rows, tx } = require('./index');

async function createIfMissing({ projectId, templateId, renderType, customerEmail, items }) {
  await query(
    `INSERT INTO projects (id, template_id, render_type, customer_email, render_input, status)
     VALUES ($1, $2, $3, $4, $5::jsonb, 'pending')
     ON CONFLICT (id) DO NOTHING`,
    [projectId, templateId, renderType, customerEmail || null, JSON.stringify({ items: items || [] })],
  );
  return one(`SELECT * FROM projects WHERE id = $1`, [projectId]);
}

/**
 * Autosave: update render_input only if the provided rev is the latest.
 * Returns the new rev on success, throws on conflict.
 */
async function saveRenderInput({ projectId, renderInput, rev }) {
  return tx(async (client) => {
    const cur = await client.query(`SELECT rev FROM projects WHERE id = $1 FOR UPDATE`, [projectId]);
    if (cur.rows.length === 0) throw Object.assign(new Error('Project not found'), { status: 404 });
    const currentRev = Number(cur.rows[0].rev);
    if (rev < currentRev) {
      throw Object.assign(new Error('Stale rev'), { status: 409, currentRev });
    }
    const result = await client.query(
      `UPDATE projects
         SET render_input = $1::jsonb,
             rev          = rev + 1,
             arrangement  = COALESCE($2, arrangement),
             updated_at   = NOW()
       WHERE id = $3
       RETURNING rev`,
      [JSON.stringify(renderInput), renderInput?.arrangement ?? null, projectId],
    );
    return Number(result.rows[0].rev);
  });
}

async function markPaid({ projectId, stripeSessionId, paymentIntentId, amountTotalCents, currency, customerEmail, productIds, shippingAddress }) {
  return tx(async (client) => {
    await client.query(
      `UPDATE projects
          SET status = 'paid',
              paid_at = NOW(),
              customer_email = COALESCE(customer_email, $1),
              updated_at = NOW()
        WHERE id = $2`,
      [customerEmail || null, projectId],
    );
    await client.query(
      `INSERT INTO payments
         (project_id, stripe_session_id, stripe_payment_intent, amount_total_cents, currency,
          product_ids, customer_email, shipping_address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'succeeded')
       ON CONFLICT (stripe_session_id) DO NOTHING`,
      [
        projectId,
        stripeSessionId,
        paymentIntentId,
        amountTotalCents,
        currency || 'usd',
        productIds || [],
        customerEmail || null,
        shippingAddress ? JSON.stringify(shippingAddress) : null,
      ],
    );
  });
}

async function markFailed({ projectId, reason, stripeSessionId }) {
  await query(
    `UPDATE projects
        SET status = 'failed',
            failed_at = NOW(),
            failure_reason = $1,
            updated_at = NOW()
      WHERE id = $2`,
    [reason || null, projectId],
  );
  if (stripeSessionId) {
    await query(
      `UPDATE payments SET status = 'failed' WHERE stripe_session_id = $1`,
      [stripeSessionId],
    );
  }
}

async function markRefunded({ projectId, stripeChargeId, amountRefundedCents }) {
  await query(
    `UPDATE projects SET status = 'refunded', updated_at = NOW() WHERE id = $1`,
    [projectId],
  );
  await query(
    `UPDATE payments
        SET status = 'refunded',
            refunded_amount_cents = $1
      WHERE project_id = $2`,
    [amountRefundedCents || null, projectId],
  );
}

async function markReady({ projectId, renderId }) {
  await query(
    `UPDATE projects SET status = 'ready', ready_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [projectId],
  );
}

async function getById(projectId) {
  return one(`SELECT * FROM projects WHERE id = $1`, [projectId]);
}

async function getStatus(projectId) {
  const p = await one(
    `SELECT p.id, p.status, p.failure_reason,
            r.progress AS render_progress,
            r.png_key, r.jpeg_key, r.video_key
       FROM projects p
       LEFT JOIN LATERAL (
         SELECT progress, png_key, jpeg_key, video_key
           FROM renders WHERE project_id = p.id
           ORDER BY enqueued_at DESC LIMIT 1
       ) r ON true
      WHERE p.id = $1`,
    [projectId],
  );
  if (!p) return { projectId, status: 'pending' };
  return {
    projectId: p.id,
    status: p.status,
    renderProgress: p.render_progress ?? (p.status === 'ready' ? 100 : p.status === 'paid' ? 35 : 0),
    errorMessage: p.failure_reason ?? undefined,
    // downloadUrl / videoUrl are filled in by services/tokens.js when issuing signed URLs.
  };
}

async function listRecent(limit = 50) {
  return rows(
    `SELECT id, customer_email, template_id, arrangement, status, created_at, paid_at
       FROM projects ORDER BY created_at DESC LIMIT $1`,
    [limit],
  );
}

module.exports = {
  createIfMissing,
  saveRenderInput,
  markPaid,
  markFailed,
  markRefunded,
  markReady,
  getById,
  getStatus,
  listRecent,
};
