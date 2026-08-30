'use strict';

/**
 * Order-confirmation orchestration.
 *
 * Pure control flow with INJECTED collaborators (db, mailer, log) so it is unit-testable
 * without a live database or mail transport, and so the security-critical invariants are
 * expressed in one place:
 *
 *   • The ONLY caller input is a Stripe session id. The recipient email, projectId, and
 *     order reference are read from the authoritative payments row — a browser-supplied
 *     address is never accepted. This path therefore cannot be used as an email relay.
 *   • Idempotency: db.claimConfirmation atomically claims the send for a paid session and
 *     returns its stored { projectId, email } exactly once. Repeat/concurrent calls get
 *     null and send nothing.
 *   • A transient transport failure releases the claim so a later retry can re-send
 *     (at-least-once delivery with dedup).
 *
 * Returns { status, body } for the HTTP handler to relay verbatim.
 */
async function runConfirmation({ sessionId, db, mailer, log }) {
  // Atomically claim the send. Non-null only for the first caller of a paid session.
  const claim = await db.claimConfirmation(sessionId);

  if (!claim) {
    // No row claimed → either already sent, or there is no succeeded payment for this
    // session (invalid / unknown / unpaid). Never send in either case.
    const alreadySent = await db.paidSessionExists(sessionId);
    return { status: 200, body: { sent: alreadySent, deduped: alreadySent } };
  }

  if (!claim.email) {
    // Paid, but no address on file. Nothing to send; Stripe's own receipt still covers it.
    // Leave the claim set — there is no address to retry to.
    log?.warn?.({ sessionId }, 'order-confirmation.no-email');
    return { status: 200, body: { sent: false } };
  }

  let sent = false;
  try {
    // Recipient comes from the stored payment row, NOT from the request.
    sent = await mailer.sendConfirmationEmail({ to: claim.email, projectId: claim.projectId });
  } catch (err) {
    log?.error?.({ err: err.message, sessionId }, 'order-confirmation.send-error');
    sent = false;
  }

  if (!sent) {
    // Release the claim so a retry can re-send. 502 signals "try again", not "bad request".
    await db.releaseConfirmation(sessionId);
    return { status: 502, body: { sent: false } };
  }

  return { status: 200, body: { sent: true } };
}

module.exports = { runConfirmation };
