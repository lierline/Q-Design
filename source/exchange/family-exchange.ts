// =============================================================================
// MedQraft 패밀리 교환 형식 v1 (Q-Atelier · Q-Maison · Q-Carnet 가 함께 쓴다)
// =============================================================================
// 오너 결정 2026-09-25: 세 제품이 서로 자료를 주고받는다. 파일 먼저, 자동 연결은 다음.
// 담는 종류: 공급자 · 제품과 품목 · 장비 · 로트 · 생산 부적합.
//
// 이 파일은 «뜻» 만 든다. DB 를 모르고 아무것도 import 하지 않는다. 세 제품이 이 파일의 사본을
// 받아(Q-Design tools/sync.mjs) 각자 자기 표에서 읽어 이 형식으로 내보내고, 받은 파일을
// planImport 로 «무엇을 할지» 정한 뒤 자기 표에 쓴다.
//
// 🔑 원칙 세 가지
//   1. 원본은 한 곳이다(OWNERS). 원본이 아닌 제품이 보낸 종류는 받지 않는다.
//      공급자 · 품목 = QMS(Q-Atelier · Q-Maison) · 로트 · 생산 부적합 = Q-Carnet.
//      장비는 세 제품이 모두 자기 장비를 가지므로 모두 원본이 될 수 있다(아래 2 가 지킨다).
//   2. 받는 쪽에서 사람이 적은 줄은 덮어쓰지 않는다. 짝만 지어 두고 다른 점을 알린다.
//      받아서 만든 줄(같은 제품에서 온 것)만 다시 받을 때 고친다.
//   3. 지우지 않는다. 보낸 쪽에서 사라진 것은 받는 쪽에서 그대로 남는다.
//
// 🔴 Node 24 가 타입만 걷어 내고 바로 실행할 수 있게 쓴다(Q-Carnet 시험이 그렇게 읽는다).
//    enum · namespace · 생성자 인자 속성 · 값 import 를 쓰지 않는다.
// =============================================================================

export const EXCHANGE_FORMAT = 'medqraft-family-exchange';
export const EXCHANGE_VERSION = 1;

export type Product = 'q-atelier' | 'q-maison' | 'q-carnet';
export type Kind = 'supplier' | 'item' | 'equipment' | 'lot' | 'nonconformance';

export const PRODUCTS: readonly Product[] = ['q-atelier', 'q-maison', 'q-carnet'];
export const KINDS: readonly Kind[] = ['supplier', 'item', 'equipment', 'lot', 'nonconformance'];

export const PRODUCT_LABEL: Record<Product, string> = {
  'q-atelier': 'Q-Atelier',
  'q-maison': 'Q-Maison',
  'q-carnet': 'Q-Carnet',
};
export const KIND_LABEL: Record<Kind, string> = {
  supplier: '공급자',
  item: '제품 · 품목',
  equipment: '장비',
  lot: '로트',
  nonconformance: '생산 부적합',
};

/** 종류마다 원본이 될 수 있는 제품. 여기 없는 제품이 보낸 그 종류는 받지 않는다. */
export const OWNERS: Record<Kind, readonly Product[]> = {
  supplier: ['q-atelier', 'q-maison'],
  item: ['q-atelier', 'q-maison'],
  equipment: ['q-atelier', 'q-maison', 'q-carnet'],
  lot: ['q-carnet'],
  nonconformance: ['q-carnet'],
};

/** 제품마다 받아 둘 자리가 있는 종류. 자리가 없는 종류는 미리보기에서 「받지 않음」 으로 보인다. */
export const ACCEPTS: Record<Product, readonly Kind[]> = {
  'q-atelier': ['supplier', 'item', 'equipment', 'lot', 'nonconformance'],
  'q-maison': ['supplier', 'item', 'equipment', 'lot', 'nonconformance'],
  'q-carnet': ['supplier', 'item', 'equipment'],
};

export function isOwner(kind: Kind, product: Product): boolean {
  return OWNERS[kind].includes(product);
}

// ── 레코드 ───────────────────────────────────────────────────────────────────
// 날짜는 'YYYY-MM-DD', 일시는 ISO 8601(시간대 포함). 모르면 null.

export type SupplierStatus = 'approved' | 'pending' | 'suspended' | 'disqualified';
export interface SupplierRecord {
  /** 사업자등록번호(숫자 10자리). 세 제품이 공급자를 맞추는 열쇠다. */
  biz_no: string;
  name: string;
  /** 보낸 제품 안의 번호(참고용. 맞추는 데 쓰지 않는다) */
  source_code: string | null;
  status: SupplierStatus | null;
  approved_until: string | null;
  category: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
}

export type ItemKind = 'finished' | 'material' | 'packaging' | 'other';
export interface ItemRecord {
  /** 품목 코드(보낸 제품 안의 코드). 받는 쪽에 같은 코드가 있으면 같은 것으로 본다. */
  code: string;
  name: string;
  kind: ItemKind;
  spec: string | null;
  /** UDI-DI 또는 GTIN(숫자). 있으면 코드보다 먼저 맞춘다. */
  gtin: string | null;
  /** 품목허가 · 인증 번호. 여러 모델이 한 허가를 쓰므로 맞추는 데는 쓰지 않는다. */
  permit_no: string | null;
}

export type EquipmentStatus = 'active' | 'inactive' | 'retired';
export interface EquipmentRecord {
  code: string;
  name: string;
  serial_no: string | null;
  manufacturer: string | null;
  model: string | null;
  location: string | null;
  status: EquipmentStatus | null;
  last_calibrated_on: string | null;
  calibration_due_on: string | null;
}

export type LotStatus = 'in_production' | 'quarantined' | 'released' | 'shipped' | 'disposed';
export interface LotRecord {
  lot_no: string;
  kind: 'finished' | 'material';
  item_code: string;
  item_name: string | null;
  quantity: number | null;
  uom: string | null;
  manufactured_on: string | null;
  expiry_on: string | null;
  status: LotStatus;
  released_on: string | null;
  released_by: string | null;
  /** 자재 로트면 공급자 사업자번호와 공급자 로트 */
  supplier_biz_no: string | null;
  supplier_lot_no: string | null;
}

export type NcStage = 'in_process' | 'finished' | 'deviation';
export type NcDisposition = 'rework' | 'concession' | 'scrap' | 'return' | 'other';
export interface NonconformanceRecord {
  /** 보낸 제품 안의 번호(일탈 번호 등). 다시 받을 때 같은 것을 찾는 열쇠다. */
  source_no: string;
  stage: NcStage;
  detected_on: string | null;
  lot_no: string | null;
  item_code: string | null;
  description: string;
  quantity: number | null;
  disposition: NcDisposition | null;
  status: 'open' | 'closed';
  closed_on: string | null;
}

export interface RecordsByKind {
  supplier: SupplierRecord[];
  item: ItemRecord[];
  equipment: EquipmentRecord[];
  lot: LotRecord[];
  nonconformance: NonconformanceRecord[];
}
export type AnyRecord = RecordsByKind[Kind][number];

export interface ExchangeFile {
  format: typeof EXCHANGE_FORMAT;
  version: typeof EXCHANGE_VERSION;
  source: {
    product: Product;
    org_name: string;
    org_biz_no: string | null;
    exported_at: string;
  };
  records: RecordsByKind;
}

export function emptyRecords(): RecordsByKind {
  return { supplier: [], item: [], equipment: [], lot: [], nonconformance: [] };
}

/** 보내는 쪽이 파일을 만든다. 원본이 아닌 종류는 넣지 않는다(넣어도 받는 쪽이 거른다). */
export function buildExchange(
  source: ExchangeFile['source'],
  records: Partial<RecordsByKind>,
): ExchangeFile {
  const out = emptyRecords();
  for (const k of KINDS) {
    if (!isOwner(k, source.product)) continue;
    const list = records[k] as AnyRecord[] | undefined;
    if (list) (out as unknown as Record<Kind, AnyRecord[]>)[k] = list.slice();
  }
  return { format: EXCHANGE_FORMAT, version: EXCHANGE_VERSION, source, records: out };
}

// ── 열쇠 다듬기 ─────────────────────────────────────────────────────────────

/** 사업자번호: 숫자만 남긴다. 10자리가 아니면 null. */
export function normalizeBizNo(v: unknown): string | null {
  if (typeof v !== 'string' && typeof v !== 'number') return null;
  const d = String(v).replace(/\D/g, '');
  return d.length === 10 ? d : null;
}
/** 코드 · 번호: 앞뒤 공백을 걷고 대문자로, 안쪽 공백은 하나로. 비면 null. */
export function normalizeCode(v: unknown): string | null {
  if (typeof v !== 'string' && typeof v !== 'number') return null;
  const s = String(v).trim().replace(/\s+/g, ' ').toUpperCase();
  return s ? s : null;
}
/** GTIN · UDI-DI: 숫자만 남겨 14자리로 앞을 0 으로 채운다. 8 · 12 · 13 · 14 자리만 받는다. */
export function normalizeGtin(v: unknown): string | null {
  if (typeof v !== 'string' && typeof v !== 'number') return null;
  const d = String(v).replace(/\D/g, '');
  if (![8, 12, 13, 14].includes(d.length)) return null;
  return d.padStart(14, '0');
}

/** 한 레코드가 받는 쪽의 무엇과 같은지 찾을 열쇠들. 앞의 것일수록 강하다. */
export function recordKeys(kind: Kind, r: AnyRecord): string[] {
  const keys: string[] = [];
  const add = (prefix: string, v: string | null) => { if (v) keys.push(`${prefix}:${v}`); };
  switch (kind) {
    case 'supplier': add('biz', normalizeBizNo((r as SupplierRecord).biz_no)); break;
    case 'item': {
      const it = r as ItemRecord;
      add('gtin', normalizeGtin(it.gtin));
      add('code', normalizeCode(it.code));
      break;
    }
    case 'equipment': {
      const e = r as EquipmentRecord;
      add('serial', normalizeCode(e.serial_no));
      add('code', normalizeCode(e.code));
      break;
    }
    case 'lot': add('lot', normalizeCode((r as LotRecord).lot_no)); break;
    case 'nonconformance': add('nc', normalizeCode((r as NonconformanceRecord).source_no)); break;
  }
  return keys;
}

// ── 내용 지문 (다시 받을 때 바뀐 것이 있는지) ─────────────────────────────────

function stable(v: unknown): string {
  if (v === null || v === undefined) return 'null';
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return '{' + Object.keys(o).sort().map((k) => JSON.stringify(k) + ':' + stable(o[k])).join(',') + '}';
  }
  return JSON.stringify(v);
}
/** FNV-1a 64비트(두 32비트로). 보안용이 아니라 «바뀌었나» 만 본다. */
export function contentHash(r: AnyRecord): string {
  const s = stable(r);
  let h1 = 0x811c9dc5, h2 = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x5bd1e995) >>> 0;
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}

// ── 파일 읽기 · 검사 ─────────────────────────────────────────────────────────

export const MAX_RECORDS_PER_KIND = 5000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type Check = (v: unknown) => boolean;
const str: Check = (v) => typeof v === 'string' && v.trim() !== '' && v.length <= 2000;
const strOrNull: Check = (v) => v === null || (typeof v === 'string' && v.length <= 5000);
const dateOrNull: Check = (v) => v === null || (typeof v === 'string' && DATE_RE.test(v));
const dtOrNull: Check = (v) => v === null || (typeof v === 'string' && !Number.isNaN(Date.parse(v)));
const numOrNull: Check = (v) => v === null || (typeof v === 'number' && Number.isFinite(v));
const oneOf = (list: readonly string[], nullable = true): Check => (v) => (nullable && v === null) || (typeof v === 'string' && list.includes(v));

const SHAPES: Record<Kind, Record<string, Check>> = {
  supplier: {
    biz_no: (v) => normalizeBizNo(v) !== null, name: str, source_code: strOrNull,
    status: oneOf(['approved', 'pending', 'suspended', 'disqualified']), approved_until: dateOrNull,
    category: strOrNull, contact_email: strOrNull, contact_phone: strOrNull, address: strOrNull,
  },
  item: {
    code: str, name: str, kind: oneOf(['finished', 'material', 'packaging', 'other'], false), spec: strOrNull,
    gtin: (v) => v === null || normalizeGtin(v) !== null, permit_no: strOrNull,
  },
  equipment: {
    code: str, name: str, serial_no: strOrNull, manufacturer: strOrNull, model: strOrNull, location: strOrNull,
    status: oneOf(['active', 'inactive', 'retired']), last_calibrated_on: dateOrNull, calibration_due_on: dateOrNull,
  },
  lot: {
    lot_no: str, kind: oneOf(['finished', 'material'], false), item_code: str, item_name: strOrNull,
    quantity: numOrNull, uom: strOrNull, manufactured_on: dateOrNull, expiry_on: dateOrNull,
    status: oneOf(['in_production', 'quarantined', 'released', 'shipped', 'disposed'], false),
    released_on: dateOrNull, released_by: strOrNull, supplier_biz_no: (v) => v === null || normalizeBizNo(v) !== null,
    supplier_lot_no: strOrNull,
  },
  nonconformance: {
    source_no: str, stage: oneOf(['in_process', 'finished', 'deviation'], false), detected_on: dateOrNull,
    lot_no: strOrNull, item_code: strOrNull, description: str, quantity: numOrNull,
    disposition: oneOf(['rework', 'concession', 'scrap', 'return', 'other']), status: oneOf(['open', 'closed'], false),
    closed_on: dateOrNull,
  },
};

const FIELD_LABEL: Record<string, string> = {
  biz_no: '사업자번호', name: '이름', code: '코드', kind: '구분', gtin: 'GTIN', lot_no: '로트 번호',
  item_code: '품목 코드', status: '상태', source_no: '번호', description: '내용', stage: '단계',
};

export type ParseResult =
  | { ok: true; file: ExchangeFile; warnings: string[] }
  | { ok: false; errors: string[] };

/**
 * 올린 파일을 읽는다. 틀린 줄이 하나라도 있으면 파일 전체를 받지 않는다(반쯤 들어가지 않게).
 * 원본이 아닌 제품이 보낸 종류는 오류가 아니라 경고로 걸러 낸다.
 */
export function parseExchange(input: unknown): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let data: unknown = input;
  if (typeof input === 'string') {
    try { data = JSON.parse(input); } catch { return { ok: false, errors: ['JSON 파일이 아닙니다.'] }; }
  }
  if (!data || typeof data !== 'object') return { ok: false, errors: ['파일 내용이 비어 있습니다.'] };
  const d = data as Record<string, unknown>;
  if (d.format !== EXCHANGE_FORMAT) return { ok: false, errors: ['MedQraft 패밀리 교환 파일이 아닙니다.'] };
  if (d.version !== EXCHANGE_VERSION) return { ok: false, errors: [`이 제품이 읽는 교환 형식은 ${EXCHANGE_VERSION}판입니다. 파일은 ${String(d.version)}판입니다.`] };
  const src = d.source as Record<string, unknown> | undefined;
  if (!src || !PRODUCTS.includes(src.product as Product)) return { ok: false, errors: ['보낸 제품을 알 수 없습니다.'] };
  if (!str(src.org_name)) errors.push('보낸 조직 이름이 없습니다.');
  if (!dtOrNull(src.exported_at ?? null) || !src.exported_at) errors.push('내보낸 일시가 없습니다.');
  const product = src.product as Product;
  const recs = (d.records ?? {}) as Record<string, unknown>;
  const out = emptyRecords();
  for (const k of KINDS) {
    const list = recs[k];
    if (list === undefined) continue;
    if (!Array.isArray(list)) { errors.push(`${KIND_LABEL[k]} 목록이 배열이 아닙니다.`); continue; }
    if (list.length === 0) continue;
    if (!isOwner(k, product)) {
      warnings.push(`${KIND_LABEL[k]} ${list.length}건은 ${PRODUCT_LABEL[product]} 가 원본이 아니라 받지 않습니다.`);
      continue;
    }
    if (list.length > MAX_RECORDS_PER_KIND) { errors.push(`${KIND_LABEL[k]} 가 ${MAX_RECORDS_PER_KIND}건을 넘습니다.`); continue; }
    const shape = SHAPES[k];
    list.forEach((row, i) => {
      if (!row || typeof row !== 'object') { errors.push(`${KIND_LABEL[k]} ${i + 1}번째 줄이 비어 있습니다.`); return; }
      const r = row as Record<string, unknown>;
      const clean: Record<string, unknown> = {};
      for (const [field, check] of Object.entries(shape)) {
        const v = r[field] === undefined ? null : r[field];
        if (!check(v)) { errors.push(`${KIND_LABEL[k]} ${i + 1}번째 줄의 ${FIELD_LABEL[field] ?? field} 값이 올바르지 않습니다.`); return; }
        clean[field] = typeof v === 'string' ? v.trim() : v;
      }
      if (k === 'supplier') clean.biz_no = normalizeBizNo(clean.biz_no);
      if (k === 'lot' && clean.supplier_biz_no) clean.supplier_biz_no = normalizeBizNo(clean.supplier_biz_no);
      if (k === 'item' && clean.gtin) clean.gtin = normalizeGtin(clean.gtin);
      (out[k] as AnyRecord[]).push(clean as unknown as AnyRecord);
    });
  }
  if (errors.length) return { ok: false, errors: errors.slice(0, 50) };
  return {
    ok: true,
    warnings,
    file: {
      format: EXCHANGE_FORMAT, version: EXCHANGE_VERSION,
      source: { product, org_name: String(src.org_name).trim(), org_biz_no: normalizeBizNo(src.org_biz_no), exported_at: String(src.exported_at) },
      records: out,
    },
  };
}

// ── 받을 계획 ───────────────────────────────────────────────────────────────

/** 받는 쪽에 이미 있는 줄 하나. 제품이 자기 표와 짝 기록에서 만들어 넘긴다. */
export interface ExistingRow {
  localId: string;
  kind: Kind;
  /** recordKeys 와 같은 모양의 열쇠들(받는 쪽 값으로 만든 것) */
  keys: string[];
  /** 이 줄이 어디서 왔나. local = 사람이 적은 줄 · 그 밖 = 그 제품에서 받아 만든 줄 */
  origin: 'local' | Product;
  /** 받아 만든 줄이면 지난번 받은 내용의 지문 */
  lastHash: string | null;
}

export type Action =
  | 'create'        // 새로 만든다
  | 'update'        // 전에 같은 제품에서 받아 만든 줄을 새 내용으로 고친다
  | 'same'          // 전에 받은 그대로라 할 일 없음
  | 'link_only'     // 사람이 적은 줄과 짝만 짓는다(덮어쓰지 않음)
  | 'other_source'  // 다른 제품에서 받아 만든 줄과 맞음(덮어쓰지 않음)
  | 'ambiguous'     // 열쇠가 받는 쪽 여러 줄과 맞아 사람이 골라야 함
  | 'not_accepted'; // 받는 쪽에 자리가 없거나 받는 쪽이 원본인 종류

export interface PlanItem {
  kind: Kind;
  index: number;
  record: AnyRecord;
  keys: string[];
  hash: string;
  action: Action;
  localId: string | null;
  note: string | null;
}

export interface ImportPlan {
  source: ExchangeFile['source'];
  target: Product;
  items: PlanItem[];
  counts: Record<Action, number>;
}

/**
 * 받은 파일과 받는 쪽의 지금 상태로 할 일을 정한다. 아무것도 쓰지 않는다.
 * 제품은 이 계획을 미리보기로 보여 주고, 사람이 확인하면 create · update · link_only 만 실행한다.
 */
export function planImport(file: ExchangeFile, target: Product, existing: ExistingRow[]): ImportPlan {
  const byKey = new Map<string, ExistingRow[]>();
  for (const row of existing) {
    for (const k of row.keys) {
      const key = `${row.kind}|${k}`;
      const list = byKey.get(key);
      if (list) { if (!list.includes(row)) list.push(row); } else byKey.set(key, [row]);
    }
  }
  const items: PlanItem[] = [];
  const counts: Record<Action, number> = { create: 0, update: 0, same: 0, link_only: 0, other_source: 0, ambiguous: 0, not_accepted: 0 };
  const src = file.source.product;
  for (const kind of KINDS) {
    const list = file.records[kind] as AnyRecord[];
    list.forEach((record, index) => {
      const keys = recordKeys(kind, record);
      const hash = contentHash(record);
      let action: Action;
      let localId: string | null = null;
      let note: string | null = null;
      if (!ACCEPTS[target].includes(kind)) {
        action = 'not_accepted'; note = `${PRODUCT_LABEL[target]} 에는 ${KIND_LABEL[kind]} 를 받아 둘 자리가 없습니다.`;
      } else if (target === src) {
        action = 'not_accepted'; note = '같은 제품에서 내보낸 파일입니다.';
      } else {
        // 강한 열쇠부터 본다. 첫 열쇠로 한 줄에 맞으면 그 줄이다.
        let hits: ExistingRow[] = [];
        for (const k of keys) {
          const found = byKey.get(`${kind}|${k}`) ?? [];
          if (found.length) { hits = found; break; }
        }
        if (hits.length === 0) {
          action = 'create';
        } else if (hits.length > 1) {
          action = 'ambiguous'; note = `받는 쪽에 같은 열쇠를 가진 줄이 ${hits.length}개 있습니다.`;
        } else {
          const row = hits[0] as ExistingRow;
          localId = row.localId;
          if (row.origin === 'local') {
            action = 'link_only'; note = '이쪽에서 적은 줄이라 고치지 않고 짝만 짓습니다.';
          } else if (row.origin !== src) {
            action = 'other_source'; note = `${PRODUCT_LABEL[row.origin]} 에서 받은 줄이라 고치지 않습니다.`;
          } else if (row.lastHash === hash) {
            action = 'same';
          } else {
            action = 'update';
          }
        }
      }
      counts[action]++;
      items.push({ kind, index, record, keys, hash, action, localId, note });
    });
  }
  return { source: file.source, target, items, counts };
}

/** 미리보기 머리에 쓸 한 줄 요약 */
export function summarizePlan(plan: ImportPlan): string {
  const c = plan.counts;
  const parts = [
    c.create && `새로 ${c.create}`, c.update && `고침 ${c.update}`, c.link_only && `짝만 ${c.link_only}`,
    c.same && `그대로 ${c.same}`, c.other_source && `다른 출처 ${c.other_source}`, c.ambiguous && `확인 필요 ${c.ambiguous}`,
    c.not_accepted && `받지 않음 ${c.not_accepted}`,
  ].filter(Boolean);
  return `${PRODUCT_LABEL[plan.source.product]} (${plan.source.org_name}) 에서 온 파일 · ${parts.join(' · ') || '할 일 없음'}`;
}
