import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hasCurrentDocumentEvidence, validEvidenceUrl } from '../src/document-validity.js';
const now = new Date('2026-10-31T12:00:00Z');
const evidence = { file_url: 'https://example.invalid/verified-document', expires_on: '2026-10-31' };
test('document evidence requires a real current expiration date and secure file URL', () => {
  assert.equal(hasCurrentDocumentEvidence(evidence, now), true);
  for (const expires_on of [null, '', '2026-10-30', '2026-02-30', 'invalid']) {
    assert.equal(hasCurrentDocumentEvidence({ ...evidence, expires_on }, now), false);
  }
  assert.equal(hasCurrentDocumentEvidence({ expires_on: '2027-01-01' }, now), false);
});
test('review evidence links cannot execute scripts or disclose URL credentials', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,bad', 'http://example.invalid/doc', 'https://user:password@example.invalid/doc', '', null]) {
    assert.equal(validEvidenceUrl(url), false);
  }
  assert.equal(validEvidenceUrl(evidence.file_url), true);
});
