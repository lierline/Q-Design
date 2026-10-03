// =============================================================================
// MedQraft 패밀리 연동 규약 v1 (Q-Atelier 와 Q-Carnet 이 서로 이벤트를 주고받는 길)
// =============================================================================
// 담는 것: 요청 서명과 검증 · 이벤트 봉투 · 로트 카드 모양 · 연결 건강 판정 · 골든 벡터.
//
// 이 파일은 «뜻» 만 든다. 네트워크 · DB · 암호 라이브러리를 모르고 아무것도 import 하지 않는다.
// 암호 연산은 호출하는 쪽이 LinkCrypto 로 넘긴다(Node 의 node:crypto 든 웹 암호든 상관없다).
// 두 제품이 이 파일의 사본(Q-Design tools/sync.mjs)과 LINK_GOLDEN_VECTORS 를 함께 쓴다.
//
// 🔑 원칙
//   1. 서명은 본문 해시 · 메서드 · 경로 · 시각 · 일회용 값을 모두 묶는다. 하나라도 바뀌면 깨진다.
//   2. 비밀값은 연결마다 파생 키로 바꿔 쓴다(deriveLinkKey). 원본 비밀값을 직접 서명에 쓰지 않는다.
//   3. 비교는 상수 시간(LinkCrypto.equalHex)으로만 한다.
//
// 🔴 Node 24 가 타입만 걷어 내고 바로 실행할 수 있게 쓴다(두 제품 시험이 그렇게 읽는다).
//    enum · namespace · 생성자 인자 속성 · 값 import 를 쓰지 않는다.
// =============================================================================

export const LINK_PROTOCOL_VERSION = 1;
/** 보낸 시각과 받은 시각이 이만큼(초) 넘게 어긋나면 받지 않는다(앞뒤 모두). */
export const LINK_MAX_SKEW_SECONDS = 300;
/** 요청 본문 상한(바이트). 호출하는 쪽이 읽기 전에 막는다. */
export const LINK_MAX_BODY_BYTES = 4194304;

export const LINK_HEADERS = {
  connection: 'x-link-connection',
  timestamp: 'x-link-timestamp',
  nonce: 'x-link-nonce',
  signature: 'x-link-signature',
  version: 'x-link-version',
} as const;

/** 암호 연산 묶음. 모든 결과는 소문자 16진 문자열이다. */
export interface LinkCrypto {
  hmacHex(key: string, data: string): string;
  sha256Hex(data: string): string;
  /** 상수 시간 비교. 길이가 다르면 false. */
  equalHex(a: string, b: string): boolean;
}

// ── 서명 ─────────────────────────────────────────────────────────────────────

/** 연결마다 다른 서명 키. 비밀값이 새도 다른 연결은 안전하다. */
export function deriveLinkKey(secret: string, connectionId: string, c: LinkCrypto): string {
  return c.hmacHex(secret, 'family-link/v1/' + connectionId);
}

/** 서명할 정규 문자열. 줄바꿈으로 여섯 칸을 잇는다. */
export function signingString(p: {
  method: string; path: string; timestamp: number; nonce: string; bodySha256: string;
}): string {
  return ['v' + LINK_PROTOCOL_VERSION, p.method.toUpperCase(), p.path, String(p.timestamp), p.nonce, p.bodySha256].join('\n');
}

/** 보낼 요청에 붙일 헤더(소문자 이름 → 값). */
export function signRequest(p: {
  secret: string; connectionId: string; method: string; path: string; body: string; timestamp: number; nonce: string;
}, c: LinkCrypto): Record<string, string> {
  const key = deriveLinkKey(p.secret, p.connectionId, c);
  const signature = c.hmacHex(key, signingString({
    method: p.method, path: p.path, timestamp: p.timestamp, nonce: p.nonce, bodySha256: c.sha256Hex(p.body),
  }));
  return {
    [LINK_HEADERS.connection]: p.connectionId,
    [LINK_HEADERS.timestamp]: String(p.timestamp),
    [LINK_HEADERS.nonce]: p.nonce,
    [LINK_HEADERS.signature]: signature,
    [LINK_HEADERS.version]: String(LINK_PROTOCOL_VERSION),
  };
}

export type VerifyFailure = 'bad_version' | 'bad_headers' | 'skew' | 'bad_signature';

export type VerifyResult =
  | { ok: true; connectionId: string; nonce: string }
  | { ok: false; reason: VerifyFailure };

/**
 * 받은 요청을 검증한다. now 는 받는 쪽의 현재 시각(초). secrets 는 «현재 값, 이전 값» 순서이고
 * 비어 있으면 bad_signature 다. 일회용 값(nonce)을 이미 썼는지는 호출하는 쪽이 따로 본다.
 */
export function verifyRequest(p: {
  secrets: string[]; headers: (name: string) => string | null; method: string; path: string; body: string; now: number;
}, c: LinkCrypto): VerifyResult {
  const connectionId = p.headers(LINK_HEADERS.connection);
  const timestampText = p.headers(LINK_HEADERS.timestamp);
  const nonce = p.headers(LINK_HEADERS.nonce);
  const signature = p.headers(LINK_HEADERS.signature);
  const version = p.headers(LINK_HEADERS.version);
  if (!connectionId || !timestampText || !nonce || !signature || !version) return { ok: false, reason: 'bad_headers' };
  if (version !== String(LINK_PROTOCOL_VERSION)) return { ok: false, reason: 'bad_version' };
  if (!/^[0-9]{1,12}$/.test(timestampText)) return { ok: false, reason: 'bad_headers' };
  const timestamp = Number(timestampText);
  if (Math.abs(p.now - timestamp) > LINK_MAX_SKEW_SECONDS) return { ok: false, reason: 'skew' };

  const text = signingString({
    method: p.method, path: p.path, timestamp, nonce, bodySha256: c.sha256Hex(p.body),
  });
  // 어느 비밀값에서 맞았는지 시간으로 새지 않도록 끝까지 모두 비교한다.
  let matched = false;
  for (const secret of p.secrets) {
    const expected = c.hmacHex(deriveLinkKey(secret, connectionId, c), text);
    if (c.equalHex(expected, signature)) matched = true;
  }
  return matched ? { ok: true, connectionId, nonce } : { ok: false, reason: 'bad_signature' };
}

// ── 봉투 ─────────────────────────────────────────────────────────────────────

export type LinkEventType = 'ping' | 'master.snapshot';
const EVENT_TYPES: readonly string[] = ['ping', 'master.snapshot'];
const PRODUCTS: readonly string[] = ['q-atelier', 'q-carnet'];

export interface LinkEnvelope {
  id: string;
  type: LinkEventType;
  version: 1;
  connection: string;
  /** ISO 8601(시간대 포함) */
  occurred_at: string;
  source: { product: 'q-atelier' | 'q-carnet'; table: string; key: string };
  payload: unknown;
}

export type EnvelopeFailure = 'bad_json' | 'bad_shape' | 'bad_version' | 'unknown_type';

export type ParseEnvelopeResult =
  | { ok: true; envelope: LinkEnvelope }
  | { ok: false; reason: EnvelopeFailure };

function isText(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

export function parseEnvelope(text: string): ParseEnvelopeResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'bad_json' };
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ok: false, reason: 'bad_shape' };
  const o = raw as Record<string, unknown>;
  if (o.version !== undefined && o.version !== LINK_PROTOCOL_VERSION) return { ok: false, reason: 'bad_version' };
  if (!isText(o.id) || !isText(o.connection) || !isText(o.occurred_at) || !isText(o.type)) return { ok: false, reason: 'bad_shape' };
  if (o.version !== LINK_PROTOCOL_VERSION) return { ok: false, reason: 'bad_shape' };
  if (!EVENT_TYPES.includes(o.type)) return { ok: false, reason: 'unknown_type' };
  const s = o.source;
  if (typeof s !== 'object' || s === null || Array.isArray(s)) return { ok: false, reason: 'bad_shape' };
  const src = s as Record<string, unknown>;
  if (!isText(src.product) || !PRODUCTS.includes(src.product) || !isText(src.table) || !isText(src.key)) {
    return { ok: false, reason: 'bad_shape' };
  }
  return {
    ok: true,
    envelope: {
      id: o.id,
      type: o.type as LinkEventType,
      version: 1,
      connection: o.connection,
      occurred_at: o.occurred_at,
      source: { product: src.product as 'q-atelier' | 'q-carnet', table: src.table, key: src.key },
      payload: o.payload,
    },
  };
}

// ── 로트 카드 ────────────────────────────────────────────────────────────────
// Q-Carnet 이 Q-Atelier 화면에 보여 주는 로트 한 장. 날짜는 'YYYY-MM-DD', 모르면 null.

export interface LotCard {
  lot_no: string;
  kind: 'finished' | 'material';
  item_code: string;
  item_name: string | null;
  quantity: number | null;
  uom: string | null;
  status: string;
  manufactured_on: string | null;
  expiry_on: string | null;
  released_on: string | null;
  released_by: string | null;
  summary: {
    last_work_date: string | null;
    day_total: number;
    day_locked: number;
    deviation_count: number;
    nonconformity_count: number;
  };
}

// ── 연결 건강 ────────────────────────────────────────────────────────────────

export type LinkHealth = 'connected' | 'attention' | 'down' | 'pending';

const HOUR_MS = 3600 * 1000;

/**
 * 연결 상태 한 단어. 성공한 적 없으면 pending. 연속 실패가 없고 1시간 넘게 밀린 이벤트도 없으면 connected.
 * 마지막 성공이 24시간을 넘었고 연속 실패가 1 이상이면 down. 그 밖은 attention.
 */
export function linkHealth(p: {
  hasEverSucceeded: boolean; lastOkAt: string | null; consecutiveFailures: number; oldestPendingAt: string | null; now: string;
}): LinkHealth {
  if (!p.hasEverSucceeded) return 'pending';
  const now = Date.parse(p.now);
  const lastOk = p.lastOkAt === null ? NaN : Date.parse(p.lastOkAt);
  if (p.consecutiveFailures >= 1 && !Number.isNaN(lastOk) && now - lastOk > 24 * HOUR_MS) return 'down';
  const oldest = p.oldestPendingAt === null ? NaN : Date.parse(p.oldestPendingAt);
  const backlogged = !Number.isNaN(oldest) && now - oldest > HOUR_MS;
  if (p.consecutiveFailures === 0 && !backlogged) return 'connected';
  return 'attention';
}

// ── 골든 벡터 ────────────────────────────────────────────────────────────────
// 두 제품의 어댑터가 같은 벡터를 통과해야 한다. 값을 고치면 두 제품이 함께 깨진다(그래야 한다).

export const LINK_GOLDEN_VECTORS: Array<{
  secret: string; connectionId: string; method: string; path: string; body: string;
  timestamp: number; nonce: string; expectedSignature: string;
}> = [
  {
    secret: 'golden-secret-0001',
    connectionId: 'conn-golden-0001',
    method: 'POST',
    path: '/api/link/inbox',
    body: '{"id":"evt-1","name":"창상피복재 5x5 로트"}',
    timestamp: 1790000000,
    nonce: 'nonce-golden-0001',
    expectedSignature: 'a412149a5f2ac392838227d3c1cee4ea5676f4db3229f920ebbb46cb1c635c48',
  },
  {
    secret: 'golden-secret-0002',
    connectionId: 'conn-golden-0002',
    method: 'GET',
    path: '/api/link/health',
    body: '',
    timestamp: 1790000300,
    nonce: 'nonce-golden-0002',
    expectedSignature: 'c903c9bae002d22c81bbe593a3bd261fb6f510cb0cfcc20719b708da25c156d9',
  },
];
