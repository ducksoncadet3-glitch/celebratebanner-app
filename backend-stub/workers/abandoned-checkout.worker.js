#!/usr/bin/env node
/**
 * Abandoned-checkout recovery worker.
 *
 * Periodically finds projects that:
 *   • have customer_email set
 *   • have at least one uploaded photo
 *   • are still in 'pending' status (no payment)
 *   • haven't been touched in > RECOVERY_DELAY_HOURS (default 4)
 *   • haven't already been emailed (no audit row 'project.recovery-sent')
 *
 * For each match: sends a recovery email and writes the audit row so we
 * don't email the same customer twice for the same abandonment.
 *
 * Run as a SEPARATE process from the API + render worker:
 *   node workers/abandoned-checkout.worker.js
 *
 * Or as a cron container that exits after one tick — set RUN_ONCE=1.
 *
 * Env:
 *   RECOVERY_DELAY_HOURS    min hours since last update before emailing (default 4)
 *   RECOVERY_INTERVAL_MS    poll cadence, default 15 min
 *   RECOVERY_DAILY_CAP      safety cap on emails per tick (default 500)
 *   RUN_ONCE                set to '1' to do a single pass and exit
 */

const crypto = require('node:crypto');
const { rows, query } = require('../db/index');
const { sendRecoveryEmail } = require('../services/mailer');
const { record: auditRecord } = require('../services/audit');
const { logger } = require('../services/logger');
const { shutdown: dbShutdown } = require('../db/index');

const DELAY_HOURS = Number.parseInt(process.env.RECOVERY_DELAY_HOURS || '4', 10);
const INTERVAL_MS = Number.parseInt(process.env.RECOVERY_INTERVAL_MS || `${15 * 60 * 1000}`, 10);
const DAILY_CAP   = Number.parseInt(process.env.RECOVERY_DAILY_CAP || '500', 10);

async function tick() {
  const t0 = Date.now();
  // Find candidates: pending projects, has photos, has email, last updated > N hours ago,
  // no prior recovery-sent audit row.
  const candidates = await rows(
    `SELECT p.id, p.customer_email, p.updated_at,
            (SELECT COUNT(*) FROM uploads u WHERE u.project_id = p.id) AS photo_count
       FROM projects p
      WHERE p.status = 'pending'
        AND p.customer_email IS NOT NULL
        AND p.updated_at < NOW() - ($1 || ' hours')::interval
        AND NOT EXISTS (
          SELECT 1 FROM audit_log a
           WHERE a.subject_kind = 'project'
             AND a.subject_id = p.id
             AND a.action = 'project.recovery-sent'
        )
      ORDER BY p.updated_at ASC
      LIMIT $2`,
    [String(DELAY_HOURS), DAILY_CAP],
  );

  let sent = 0;
  let skipped = 0;
  for (const c of candidates) {
    if (Number(c.photo_count) === 0) { skipped++; continue; }
    try {
      const recoveryToken = crypto.randomBytes(16).toString('base64url');
      await sendRecoveryEmail({
        to: c.customer_email,
        projectId: c.id,
        recoveryToken,
        photoCount: Number(c.photo_count),
      });
      // Record the audit row inside a write so re-runs are safe even if the
      // mailer succeeded and the audit insert failed previously.
      await auditRecord({
        actorKind: 'system',
        actorId: 'abandoned-checkout',
        action: 'project.recovery-sent',
        subjectKind: 'project',
        subjectId: c.id,
        metadata: { recoveryToken, photoCount: Number(c.photo_count) },
      });
      sent++;
    } catch (err) {
      logger.warn({ projectId: c.id, err: err.message }, 'recovery.send-failed');
    }
  }
  logger.info({ candidates: candidates.length, sent, skipped, ms: Date.now() - t0 }, 'recovery.tick');
}

async function main() {
  if (process.env.RUN_ONCE === '1') {
    await tick();
    await dbShutdown();
    return;
  }
  logger.info({ delayHours: DELAY_HOURS, intervalMs: INTERVAL_MS }, 'recovery.worker.ready');
  // First tick on boot, then on interval.
  await tick().catch((err) => logger.error({ err: err.message }, 'recovery.tick-failed'));
  const handle = setInterval(
    () => { tick().catch((err) => logger.error({ err: err.message }, 'recovery.tick-failed')); },
    INTERVAL_MS,
  );

  const shutdown = async (sig) => {
    logger.info({ sig }, 'recovery.worker.shutdown');
    clearInterval(handle);
    await dbShutdown();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error({ err: err.message }, 'recovery.worker.crashed');
  process.exit(1);
});
