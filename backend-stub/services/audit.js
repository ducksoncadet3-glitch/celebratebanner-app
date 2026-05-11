/**
 * Audit log helper.
 *
 * Append-only — never UPDATE or DELETE rows here. The admin dashboard reads
 * from this for compliance + incident response. Sensitive payloads should
 * NEVER be logged in `metadata` — keep it to ids and amounts.
 */

const { query } = require('../db/index');
const { logger } = require('./logger');

/**
 * Record an audit event. All fields except `metadata`/`ip`/`ua` are required.
 *
 * actorKind:  'system' | 'admin' | 'webhook'
 * action:     dotted verb, e.g. 'project.rerender', 'payment.refund'
 * subjectKind:'project' | 'payment' | 'render' | 'user'
 */
async function record({ actorKind, actorId, action, subjectKind, subjectId, metadata, ip, ua }) {
  try {
    await query(
      `INSERT INTO audit_log (actor_kind, actor_id, action, subject_kind, subject_id, metadata, ip, ua)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)`,
      [
        actorKind,
        actorId || null,
        action,
        subjectKind,
        String(subjectId),
        JSON.stringify(metadata || {}),
        ip || null,
        ua ? String(ua).slice(0, 500) : null,
      ],
    );
  } catch (err) {
    // Audit failures must never fail the parent operation. Log loudly so the
    // operator notices if the audit pipeline is broken.
    logger.error({ err: err.message, action, subjectId }, 'audit.record-failed');
  }
}

async function recent(limit = 100) {
  const { rows } = await query(
    `SELECT id, actor_kind, actor_id, action, subject_kind, subject_id, metadata, ip, created_at
       FROM audit_log
   ORDER BY created_at DESC
      LIMIT $1`,
    [limit],
  );
  return rows;
}

async function forSubject(subjectKind, subjectId, limit = 50) {
  const { rows } = await query(
    `SELECT id, actor_kind, actor_id, action, metadata, ip, created_at
       FROM audit_log
      WHERE subject_kind = $1 AND subject_id = $2
   ORDER BY created_at DESC
      LIMIT $3`,
    [subjectKind, String(subjectId), limit],
  );
  return rows;
}

module.exports = { record, recent, forSubject };
