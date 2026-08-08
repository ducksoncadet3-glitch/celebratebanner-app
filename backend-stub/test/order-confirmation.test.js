'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { runConfirmation } = require('../services/order-confirmation');

// A fake payments store that mirrors the atomic-claim semantics of the real SQL:
// claimConfirmation returns the row's stored { projectId, email } exactly once.
function makeDb(seed = {}) {
  // seed: { [sessionId]: { projectId, email, status:'succeeded', claimed:false } }
  const rows = { ...seed };
  return {
    calls: { claim: 0, release: 0 },
    async claimConfirmation(sessionId) {
      this.calls.claim++;
      const r = rows[sessionId];
      if (!r || r.status !== 'succeeded' || r.claimed) return null; // WHERE ... AND confirmation_sent_at IS NULL
      r.claimed = true; // atomic flip NULL → NOW()
      return { projectId: r.projectId, email: r.email };
    },
    async paidSessionExists(sessionId) {
      const r = rows[sessionId];
      return !!(r && r.status === 'succeeded');
    },
    async releaseConfirmation(sessionId) {
      this.calls.release++;
      if (rows[sessionId]) rows[sessionId].claimed = false;
    },
    _rows: rows,
  };
}

function makeMailer(behavior = () => true) {
  const sent = [];
  return {
    sent,
    async sendConfirmationEmail(args) {
      sent.push(args);
      return behavior(args);
    },
  };
}

const PAID = { sess_paid: { projectId: 'proj_1', email: 'buyer@example.com', status: 'succeeded', claimed: false } };

test('valid paid session → confirmation sent once, to the stored recipient', async () => {
  const db = makeDb(structuredClone(PAID));
  const mailer = makeMailer();
  const out = await runConfirmation({ sessionId: 'sess_paid', db, mailer });
  assert.deepEqual(out, { status: 200, body: { sent: true } });
  assert.equal(mailer.sent.length, 1);
  assert.equal(mailer.sent[0].to, 'buyer@example.com'); // derived server-side
  assert.equal(mailer.sent[0].projectId, 'proj_1');
});

test('same session repeated → no second send (idempotent, reports already-sent)', async () => {
  const db = makeDb(structuredClone(PAID));
  const mailer = makeMailer();
  await runConfirmation({ sessionId: 'sess_paid', db, mailer });
  const second = await runConfirmation({ sessionId: 'sess_paid', db, mailer });
  assert.deepEqual(second, { status: 200, body: { sent: true, deduped: true } });
  assert.equal(mailer.sent.length, 1); // still only one email total
});

test('concurrent duplicate requests → exactly one email', async () => {
  const db = makeDb(structuredClone(PAID));
  const mailer = makeMailer();
  const [a, b] = await Promise.all([
    runConfirmation({ sessionId: 'sess_paid', db, mailer }),
    runConfirmation({ sessionId: 'sess_paid', db, mailer }),
  ]);
  const sentFlags = [a.body.sent, b.body.sent];
  assert.ok(sentFlags.every((s) => s === true)); // both report success…
  assert.equal(mailer.sent.length, 1); // …but only one actually sent
});

test('invalid/unknown session → no send', async () => {
  const db = makeDb(); // empty store
  const mailer = makeMailer();
  const out = await runConfirmation({ sessionId: 'sess_nope', db, mailer });
  assert.deepEqual(out, { status: 200, body: { sent: false, deduped: false } });
  assert.equal(mailer.sent.length, 0);
});

test('unpaid/failed session → no send', async () => {
  const db = makeDb({ sess_x: { projectId: 'proj_x', email: 'x@e.com', status: 'failed', claimed: false } });
  const mailer = makeMailer();
  const out = await runConfirmation({ sessionId: 'sess_x', db, mailer });
  assert.equal(out.body.sent, false);
  assert.equal(mailer.sent.length, 0);
});

test('caller cannot control the recipient — only the session id is an input', async () => {
  // runConfirmation takes no recipient argument; the address always comes from the store.
  const db = makeDb(structuredClone(PAID));
  const mailer = makeMailer();
  await runConfirmation({
    sessionId: 'sess_paid',
    db,
    mailer,
    // even if an attacker smuggled these, the signature ignores them:
    email: 'attacker@evil.com',
    to: 'attacker@evil.com',
  });
  assert.equal(mailer.sent[0].to, 'buyer@example.com');
});

test('Postmark failure → 502 and the claim is released so a retry can re-send', async () => {
  const db = makeDb(structuredClone(PAID));
  const mailer = makeMailer(() => false); // provider rejected / dryrun
  const out = await runConfirmation({ sessionId: 'sess_paid', db, mailer });
  assert.equal(out.status, 502);
  assert.equal(out.body.sent, false);
  assert.equal(db.calls.release, 1); // claim released

  // A subsequent retry (provider now healthy) can send.
  const mailer2 = makeMailer(() => true);
  const retry = await runConfirmation({ sessionId: 'sess_paid', db, mailer: mailer2 });
  assert.equal(retry.body.sent, true);
  assert.equal(mailer2.sent.length, 1);
});

test('Postmark throwing → 502 and claim released (never crashes the caller)', async () => {
  const db = makeDb(structuredClone(PAID));
  const mailer = makeMailer(() => { throw new Error('network'); });
  const out = await runConfirmation({ sessionId: 'sess_paid', db, mailer, log: { error() {}, warn() {} } });
  assert.equal(out.status, 502);
  assert.equal(db.calls.release, 1);
});

test('paid session with no stored email → no send, no crash', async () => {
  const db = makeDb({ sess_ne: { projectId: 'proj_ne', email: null, status: 'succeeded', claimed: false } });
  const mailer = makeMailer();
  const out = await runConfirmation({ sessionId: 'sess_ne', db, mailer, log: { warn() {}, error() {} } });
  assert.equal(out.body.sent, false);
  assert.equal(mailer.sent.length, 0);
});
