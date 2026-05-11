/**
 * Admin API endpoints.
 *
 * Mounted at /api/admin/* and gated by middleware/admin-auth (your SSO / bearer).
 * The admin-stub/ dashboard calls every endpoint defined here.
 *
 * NEVER expose this router behind public auth — admins can refund, re-render,
 * and download every file in the system.
 */

const crypto = require('node:crypto');
const { rows, one, query } = require('../db/index');
const { getQueueHealth, getJob, cancelRender, enqueueRender, queue } = require('../services/queue');
const { recent: recentWebhooks } = require('../db/webhook-events');
const { record: auditRecord, forSubject: auditForSubject } = require('../services/audit');
const { issueDownloadToken } = require('../services/tokens');
const { sendDeliveryEmail } = require('../services/mailer');
const { deserializeRenderInput } = require('../utils/render-input');
const { clientIp } = require('../middleware/rate-limit');
const { logger } = require('../services/logger');

// ── GET /api/admin/overview ─────────────────────────────────────────────────
async function overviewHandler(_req, res) {
  try {
    const [totals, rev, q] = await Promise.all([
      one(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'pending')   AS pending,
          COUNT(*) FILTER (WHERE status = 'paid')      AS paid,
          COUNT(*) FILTER (WHERE status = 'rendering') AS rendering,
          COUNT(*) FILTER (WHERE status = 'ready')     AS ready,
          COUNT(*) FILTER (WHERE status = 'failed')    AS failed,
          COUNT(*) FILTER (WHERE status = 'refunded')  AS refunded,
          COUNT(*) AS projects
        FROM projects
      `),
      one(`
        SELECT
          COALESCE(SUM(amount_total_cents) FILTER (WHERE created_at > NOW() - interval '24 hours'), 0) AS last24,
          COALESCE(SUM(amount_total_cents) FILTER (WHERE created_at > NOW() - interval '7 days'),    0) AS last7d,
          COALESCE(SUM(amount_total_cents) FILTER (WHERE created_at > NOW() - interval '30 days'),   0) AS last30d
        FROM payments WHERE status = 'succeeded'
      `),
      getQueueHealth(),
    ]);
    res.json({
      totals: {
        projects: Number(totals.projects),
        paid:     Number(totals.paid),
        rendering:Number(totals.rendering),
        ready:    Number(totals.ready),
        failed:   Number(totals.failed),
        refunded: Number(totals.refunded),
      },
      revenue: {
        last24hCents: Number(rev.last24),
        last7dCents:  Number(rev.last7d),
        last30dCents: Number(rev.last30d),
      },
      queue: { waiting: q.waiting || 0, active: q.active || 0, failed: q.failed || 0 },
    });
  } catch (err) {
    logger.error({ err: err.message }, 'admin.overview-failed');
    res.status(500).json({ error: 'failed' });
  }
}

// ── GET /api/admin/projects?status=&q= ──────────────────────────────────────
async function listProjectsHandler(req, res) {
  try {
    const status = req.query.status || null;
    const search = req.query.q || null;
    const list = await rows(
      `SELECT id, customer_email, template_id, arrangement, status, created_at, paid_at
         FROM projects
        WHERE ($1::text IS NULL OR status = $1)
          AND ($2::text IS NULL OR (id ILIKE '%' || $2 || '%' OR customer_email ILIKE '%' || $2 || '%'))
        ORDER BY created_at DESC
        LIMIT 200`,
      [status, search],
    );
    res.json(list.map((p) => ({
      id: p.id,
      customerEmail: p.customer_email,
      templateId: p.template_id,
      arrangement: p.arrangement,
      status: p.status,
      createdAt: p.created_at,
      paidAt: p.paid_at,
    })));
  } catch (err) {
    logger.error({ err: err.message }, 'admin.projects-list-failed');
    res.status(500).json({ error: 'failed' });
  }
}

// ── GET /api/admin/projects/:id ─────────────────────────────────────────────
async function getProjectHandler(req, res) {
  try {
    const id = req.params.id;
    const p = await one(`SELECT * FROM projects WHERE id = $1`, [id]);
    if (!p) return res.status(404).json({ error: 'not found' });
    const renders = await rows(
      `SELECT id, status, progress, duration_ms, error_message, enqueued_at AS created_at
         FROM renders WHERE project_id = $1 ORDER BY enqueued_at DESC`,
      [id],
    );
    const payments = await rows(
      `SELECT id, amount_total_cents, product_ids, status, created_at
         FROM payments WHERE project_id = $1 ORDER BY created_at DESC`,
      [id],
    );
    const audit = await auditForSubject('project', id);
    res.json({
      id: p.id,
      customerEmail: p.customer_email,
      templateId: p.template_id,
      arrangement: p.arrangement,
      status: p.status,
      createdAt: p.created_at,
      paidAt: p.paid_at,
      renderInput: p.render_input,
      rev: Number(p.rev),
      renders: renders.map((r) => ({
        id: r.id, status: r.status, progress: r.progress,
        durationMs: r.duration_ms, errorMessage: r.error_message,
        createdAt: r.created_at,
      })),
      payments: payments.map((pay) => ({
        id: pay.id, amountTotalCents: Number(pay.amount_total_cents),
        productIds: pay.product_ids, status: pay.status, createdAt: pay.created_at,
      })),
      audit,
    });
  } catch (err) {
    logger.error({ err: err.message, id: req.params.id }, 'admin.project-get-failed');
    res.status(500).json({ error: 'failed' });
  }
}

// ── POST /api/admin/projects/:id/rerender ───────────────────────────────────
async function rerenderHandler(req, res) {
  try {
    const id = req.params.id;
    const p = await one(`SELECT * FROM projects WHERE id = $1`, [id]);
    if (!p) return res.status(404).json({ error: 'not found' });
    const renderInput = deserializeRenderInput(p.render_input);
    const productIds = await rows(
      `SELECT product_ids FROM payments WHERE project_id = $1 AND status = 'succeeded' ORDER BY created_at DESC LIMIT 1`,
      [id],
    );
    const renderId = crypto.randomUUID();
    const { jobId } = await enqueueRender(
      { projectId: id, renderInput, productIds: productIds[0]?.product_ids || [], renderId },
      // No dedupe key — admin re-renders should always create a fresh job.
    );
    await auditRecord({
      actorKind: 'admin',
      actorId: req.user?.id ?? 'unknown',
      action: 'project.rerender',
      subjectKind: 'project', subjectId: id,
      metadata: { jobId, renderId },
      ip: clientIp(req),
      ua: req.headers['user-agent'],
    });
    res.json({ jobId });
  } catch (err) {
    logger.error({ err: err.message, id: req.params.id }, 'admin.rerender-failed');
    res.status(500).json({ error: err.message });
  }
}

// ── POST /api/admin/projects/:id/refund ─────────────────────────────────────
async function refundHandler(req, res) {
  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });
    const id = req.params.id;
    const amountCents = req.body?.amountCents;
    const payment = await one(
      `SELECT stripe_payment_intent FROM payments WHERE project_id = $1 AND status = 'succeeded' ORDER BY created_at DESC LIMIT 1`,
      [id],
    );
    if (!payment?.stripe_payment_intent) {
      return res.status(404).json({ error: 'no payment intent found' });
    }
    await stripe.refunds.create({
      payment_intent: payment.stripe_payment_intent,
      ...(amountCents ? { amount: amountCents } : {}),
      metadata: { projectId: id },
    });
    // Stripe will send us `charge.refunded`; the webhook handles
    // markRefunded + token revocation. We just log the manual action.
    await auditRecord({
      actorKind: 'admin',
      actorId: req.user?.id ?? 'unknown',
      action: 'payment.refund',
      subjectKind: 'project', subjectId: id,
      metadata: { amountCents },
      ip: clientIp(req),
      ua: req.headers['user-agent'],
    });
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err: err.message, id: req.params.id }, 'admin.refund-failed');
    res.status(500).json({ error: err.message });
  }
}

// ── POST /api/admin/projects/:id/resend-delivery ────────────────────────────
async function resendDeliveryHandler(req, res) {
  try {
    const id = req.params.id;
    const p = await one(`SELECT customer_email, status FROM projects WHERE id = $1`, [id]);
    if (!p) return res.status(404).json({ error: 'not found' });
    if (p.status !== 'ready') return res.status(409).json({ error: `project not ready (status=${p.status})` });
    const r = await one(
      `SELECT png_key, jpeg_key, video_key FROM renders WHERE project_id = $1 AND status = 'done' ORDER BY finished_at DESC LIMIT 1`,
      [id],
    );
    if (!r) return res.status(409).json({ error: 'no completed render' });
    const tokens = {
      download: await issueDownloadToken({ projectId: id, assetType: 'jpeg', s3Key: r.jpeg_key }),
      ...(r.video_key
        ? { video: await issueDownloadToken({ projectId: id, assetType: 'video', s3Key: r.video_key }) }
        : {}),
    };
    if (p.customer_email) {
      await sendDeliveryEmail({
        to: p.customer_email,
        projectId: id,
        links: { downloadUrl: tokens.download.url, videoUrl: tokens.video?.url, expiresAt: tokens.download.expiresAt },
      });
    }
    await auditRecord({
      actorKind: 'admin',
      actorId: req.user?.id ?? 'unknown',
      action: 'delivery.resent',
      subjectKind: 'project', subjectId: id,
      metadata: { hasVideo: !!r.video_key },
      ip: clientIp(req),
      ua: req.headers['user-agent'],
    });
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err: err.message, id: req.params.id }, 'admin.resend-failed');
    res.status(500).json({ error: err.message });
  }
}

// ── Queue routes ────────────────────────────────────────────────────────────
async function queueHandler(_req, res) {
  try {
    const snap = await getQueueHealth();
    let failedJobs = [];
    if (queue) {
      const jobs = await queue.getFailed(0, 19);
      failedJobs = jobs.map((j) => ({
        id: String(j.id),
        reason: (j.failedReason || '').slice(0, 200),
        failedAt: new Date(j.finishedOn || j.timestamp).toISOString(),
        data: { projectId: j.data?.projectId ?? '' },
      }));
    }
    res.json({ ...snap, failedJobs });
  } catch (err) {
    logger.error({ err: err.message }, 'admin.queue-failed');
    res.status(500).json({ error: 'failed' });
  }
}

async function retryJobHandler(req, res) {
  try {
    const job = await getJob(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'not found' });
    if (queue) {
      const j = await queue.getJob(req.params.jobId);
      if (j) await j.retry();
    }
    await auditRecord({
      actorKind: 'admin',
      actorId: req.user?.id ?? 'unknown',
      action: 'render.retry',
      subjectKind: 'render', subjectId: req.params.jobId,
      ip: clientIp(req),
      ua: req.headers['user-agent'],
    });
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err: err.message, jobId: req.params.jobId }, 'admin.retry-failed');
    res.status(500).json({ error: err.message });
  }
}

async function cancelJobHandler(req, res) {
  try {
    const ok = await cancelRender(req.params.jobId);
    if (!ok) return res.status(409).json({ error: 'cannot cancel running job' });
    await auditRecord({
      actorKind: 'admin',
      actorId: req.user?.id ?? 'unknown',
      action: 'render.cancel',
      subjectKind: 'render', subjectId: req.params.jobId,
      ip: clientIp(req),
      ua: req.headers['user-agent'],
    });
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err: err.message, jobId: req.params.jobId }, 'admin.cancel-failed');
    res.status(500).json({ error: err.message });
  }
}

// ── Payments + webhooks listings ────────────────────────────────────────────
async function paymentsHandler(req, res) {
  try {
    const email = req.query.email || null;
    const list = await rows(
      `SELECT id, project_id, amount_total_cents, currency, product_ids, status, customer_email, created_at
         FROM payments
        WHERE ($1::text IS NULL OR customer_email = $1)
        ORDER BY created_at DESC
        LIMIT 200`,
      [email],
    );
    res.json(list.map((p) => ({
      id: p.id,
      projectId: p.project_id,
      amountTotalCents: Number(p.amount_total_cents),
      currency: p.currency,
      productIds: p.product_ids,
      status: p.status,
      customerEmail: p.customer_email,
      createdAt: p.created_at,
    })));
  } catch (err) {
    logger.error({ err: err.message }, 'admin.payments-failed');
    res.status(500).json({ error: 'failed' });
  }
}

async function webhookLogHandler(_req, res) {
  try {
    res.json(await recentWebhooks(100));
  } catch (err) {
    logger.error({ err: err.message }, 'admin.webhooks-failed');
    res.status(500).json({ error: 'failed' });
  }
}

module.exports = {
  overviewHandler,
  listProjectsHandler,
  getProjectHandler,
  rerenderHandler,
  refundHandler,
  resendDeliveryHandler,
  queueHandler,
  retryJobHandler,
  cancelJobHandler,
  paymentsHandler,
  webhookLogHandler,
};
