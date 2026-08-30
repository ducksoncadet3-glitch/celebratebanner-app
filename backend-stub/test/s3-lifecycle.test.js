'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Privacy Policy §4 commits to deleting uploaded photos/drafts at 90 days and final renders
// at 12 months (365 days). This guards that the S3 lifecycle SOURCE config matches that promise
// (current-object Expiration), so the policy claim is backed by the intended AWS configuration.

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'infra', 's3-lifecycle.json'), 'utf8'));
const rules = cfg.Rules || [];
const ruleFor = (prefix) => rules.find((r) => r.Filter && r.Filter.Prefix === prefix);

test('uploads/ expires current objects at 90 days, with no archive transition', () => {
  const r = ruleFor('uploads/');
  assert.ok(r, 'uploads/ rule must exist');
  assert.equal(r.Status, 'Enabled');
  assert.equal(r.Expiration && r.Expiration.Days, 90);
  assert.ok(!r.Transitions, 'uploads/ must not archive/transition current objects — it deletes them');
  assert.equal(r.NoncurrentVersionExpiration && r.NoncurrentVersionExpiration.NoncurrentDays, 30);
  assert.equal(r.AbortIncompleteMultipartUpload && r.AbortIncompleteMultipartUpload.DaysAfterInitiation, 1);
});

test('renders/ expires current objects at 365 days', () => {
  const r = ruleFor('renders/');
  assert.ok(r, 'renders/ rule must exist');
  assert.equal(r.Status, 'Enabled');
  assert.equal(r.Expiration && r.Expiration.Days, 365);
  assert.ok(!r.Transitions, 'renders/ current objects should expire, not transition');
  assert.equal(r.NoncurrentVersionExpiration && r.NoncurrentVersionExpiration.NoncurrentDays, 14);
});
