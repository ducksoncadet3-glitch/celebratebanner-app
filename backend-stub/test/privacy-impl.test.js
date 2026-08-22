'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Guards that the code backs two Privacy Policy claims (functional behavior is verified in the
// built image / integration, since sharp + Postgres aren't available in these unit tests):
//   §1  EXIF/GPS is stripped from the retained original image
//   §4  abandoned unpaid drafts are deleted after the retention window

const read = (rel) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

test('image optimizer re-encodes the retained original WITHOUT metadata', () => {
  const src = read('services/image-optimizer.js');
  assert.match(src, /function normalizeOriginal/, 'must define normalizeOriginal');
  assert.match(src, /await normalizeOriginal\(s3Key, original\)/, 'optimize() must normalize the original');
  // Overwrites the SAME key (strips metadata in place) …
  assert.match(src, /putBuffer\(\{ key: s3Key/, 'normalizeOriginal must overwrite the original key');
  // … and must NEVER call withMetadata() (which would RETAIN EXIF/GPS).
  assert.doesNotMatch(src, /\.withMetadata\(/, 'must not retain metadata via withMetadata()');
});

test('recovery worker purges only unpaid drafts past the retention window', () => {
  const src = read('workers/abandoned-checkout.worker.js');
  assert.match(src, /function purgeStaleDrafts/, 'must define purgeStaleDrafts');
  assert.match(src, /await purgeStaleDrafts\(\)/, 'tick() must call purgeStaleDrafts');
  assert.match(src, /DELETE FROM projects/, 'must delete draft project rows');
  // Safety: the delete must be scoped to unpaid drafts only (never paid order records).
  assert.match(src, /status = 'pending'/, "purge must target only status = 'pending'");
  assert.match(src, /updated_at < NOW\(\) - \(\$1 \|\| ' days'\)::interval/, 'purge must use the retention window');
  assert.match(src, /DRAFT_RETENTION_DAYS/, 'retention window must be configurable (default 90)');
});
