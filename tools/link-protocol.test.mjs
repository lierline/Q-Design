// =============================================================================
// 연동 규약 시험 (source/exchange/link-protocol.ts)
//   node --test tools/link-protocol.test.mjs
// Node 24 는 .ts 의 타입을 걷어 내고 바로 읽는다. 두 제품도 같은 파일의 사본과 골든 벡터를 쓴다.
// =============================================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import {
  LINK_PROTOCOL_VERSION, LINK_MAX_SKEW_SECONDS, LINK_MAX_BODY_BYTES, LINK_HEADERS, LINK_GOLDEN_VECTORS,
  deriveLinkKey, signingString, signRequest, verifyRequest, parseEnvelope, linkHealth,
} from '../source/exchange/link-protocol.ts';

const crypto = {
  hmacHex: (key, data) => createHmac('sha256', key).update(data, 'utf8').digest('hex'),
  sha256Hex: (data) => createHash('sha256').update(data, 'utf8').digest('hex'),
  equalHex: (a, b) => {
    const x = Buffer.from(a, 'utf8');
    const y = Buffer.from(b, 'utf8');
    return x.length === y.length && timingSafeEqual(x, y);
  },
};

const base = {
  secret: 'secret-current', connectionId: 'conn-0001', method: 'POST', path: '/api/link/inbox',
  body: '{"hello":"world"}', timestamp: 1790000000, nonce: 'nonce-abc123',
};
const headersOf = (h) => (name) => (name in h ? h[name] : null);
const verify = (over = {}, hdr) => {
  const headers = hdr ?? signRequest(base, crypto);
  return verifyRequest({
    secrets: ['secret-current'], headers: headersOf(headers), method: base.method, path: base.path,
    body: base.body, now: base.timestamp, ...over,
  }, crypto);
};

test('상수', () => {
  assert.equal(LINK_PROTOCOL_VERSION, 1);
  assert.equal(LINK_MAX_SKEW_SECONDS, 300);
  assert.equal(LINK_MAX_BODY_BYTES, 4194304);
  assert.equal(LINK_HEADERS.signature, 'x-link-signature');
});

test('서명한 요청은 검증을 통과한다', () => {
  assert.deepEqual(verify(), { ok: true, connectionId: 'conn-0001', nonce: 'nonce-abc123' });
});

test('본문 한 글자가 바뀌면 bad_signature', () => {
  assert.deepEqual(verify({ body: '{"hello":"worle"}' }), { ok: false, reason: 'bad_signature' });
});

test('경로가 바뀌면 bad_signature', () => {
  assert.deepEqual(verify({ path: '/api/link/other' }), { ok: false, reason: 'bad_signature' });
});

test('메서드가 바뀌면 bad_signature', () => {
  assert.deepEqual(verify({ method: 'PUT' }), { ok: false, reason: 'bad_signature' });
});

test('허용 시각을 넘으면 skew', () => {
  assert.deepEqual(verify({ now: base.timestamp + 301 }), { ok: false, reason: 'skew' });
  assert.deepEqual(verify({ now: base.timestamp - 301 }), { ok: false, reason: 'skew' });
  assert.equal(verify({ now: base.timestamp + 300 }).ok, true);
  assert.equal(verify({ now: base.timestamp - 300 }).ok, true);
});

test('이전 비밀값으로 서명한 요청도 secrets=[현재, 이전] 이면 통과한다', () => {
  const h = signRequest({ ...base, secret: 'secret-previous' }, crypto);
  assert.equal(verify({ secrets: ['secret-current', 'secret-previous'] }, h).ok, true);
  assert.deepEqual(verify({ secrets: ['secret-current'] }, h), { ok: false, reason: 'bad_signature' });
});

test('비밀값이 하나도 없으면 bad_signature', () => {
  assert.deepEqual(verify({ secrets: [] }), { ok: false, reason: 'bad_signature' });
});

test('버전이 1 이 아니면 bad_version', () => {
  const h = { ...signRequest(base, crypto), 'x-link-version': '2' };
  assert.deepEqual(verify({}, h), { ok: false, reason: 'bad_version' });
});

test('헤더가 빠지면 bad_headers', () => {
  for (const name of Object.values(LINK_HEADERS)) {
    const h = { ...signRequest(base, crypto) };
    delete h[name];
    assert.deepEqual(verify({}, h), { ok: false, reason: 'bad_headers' }, name);
  }
  const bad = { ...signRequest(base, crypto), 'x-link-timestamp': 'abc' };
  assert.deepEqual(verify({}, bad), { ok: false, reason: 'bad_headers' });
});

test('서명 헤더 구성', () => {
  const h = signRequest(base, crypto);
  assert.equal(h['x-link-connection'], 'conn-0001');
  assert.equal(h['x-link-timestamp'], '1790000000');
  assert.equal(h['x-link-nonce'], 'nonce-abc123');
  assert.equal(h['x-link-version'], '1');
  assert.match(h['x-link-signature'], /^[0-9a-f]{64}$/);
});

test('정규 문자열', () => {
  assert.equal(
    signingString({ method: 'post', path: '/p', timestamp: 5, nonce: 'n', bodySha256: 'ab' }),
    'v1\nPOST\n/p\n5\nn\nab',
  );
  assert.equal(deriveLinkKey('s', 'c', crypto), crypto.hmacHex('s', 'family-link/v1/c'));
});

const env = (over = {}) => JSON.stringify({
  id: 'evt-1', type: 'master.snapshot', version: 1, connection: 'conn-0001', occurred_at: '2026-10-03T10:00:00+09:00',
  source: { product: 'q-atelier', table: 'items', key: 'PD-1' }, payload: { a: 1 }, ...over,
});

test('parseEnvelope: 정상', () => {
  const r = parseEnvelope(env());
  assert.equal(r.ok, true);
  assert.equal(r.envelope.id, 'evt-1');
  assert.equal(r.envelope.source.product, 'q-atelier');
});

test('parseEnvelope: 깨진 JSON · 버전 · 종류 · 모양', () => {
  assert.deepEqual(parseEnvelope('{not json'), { ok: false, reason: 'bad_json' });
  assert.deepEqual(parseEnvelope(env({ version: 2 })), { ok: false, reason: 'bad_version' });
  assert.deepEqual(parseEnvelope(env({ type: 'mystery' })), { ok: false, reason: 'unknown_type' });
  assert.deepEqual(parseEnvelope(env({ id: undefined })), { ok: false, reason: 'bad_shape' });
  assert.deepEqual(parseEnvelope('[]'), { ok: false, reason: 'bad_shape' });
  assert.deepEqual(parseEnvelope(env({ source: { product: 'x', table: 't', key: 'k' } })), { ok: false, reason: 'bad_shape' });
});

test('linkHealth: 네 상태', () => {
  const now = '2026-10-03T12:00:00Z';
  assert.equal(linkHealth({ hasEverSucceeded: false, lastOkAt: null, consecutiveFailures: 0, oldestPendingAt: null, now }), 'pending');
  assert.equal(linkHealth({ hasEverSucceeded: true, lastOkAt: '2026-10-03T11:59:00Z', consecutiveFailures: 0, oldestPendingAt: '2026-10-03T11:30:00Z', now }), 'connected');
  assert.equal(linkHealth({ hasEverSucceeded: true, lastOkAt: '2026-10-03T11:00:00Z', consecutiveFailures: 2, oldestPendingAt: null, now }), 'attention');
  assert.equal(linkHealth({ hasEverSucceeded: true, lastOkAt: '2026-10-01T11:00:00Z', consecutiveFailures: 3, oldestPendingAt: null, now }), 'down');
  // 1시간 넘게 밀린 이벤트가 있으면 연속 실패가 0 이어도 주의
  assert.equal(linkHealth({ hasEverSucceeded: true, lastOkAt: '2026-10-03T11:59:00Z', consecutiveFailures: 0, oldestPendingAt: '2026-10-03T10:00:00Z', now }), 'attention');
});

test('골든 벡터', () => {
  assert.ok(LINK_GOLDEN_VECTORS.length >= 2);
  for (const v of LINK_GOLDEN_VECTORS) {
    const h = signRequest(v, crypto);
    assert.equal(h['x-link-signature'], v.expectedSignature);
    const r = verifyRequest({
      secrets: [v.secret], headers: headersOf(h), method: v.method, path: v.path, body: v.body, now: v.timestamp,
    }, crypto);
    assert.equal(r.ok, true);
  }
});
