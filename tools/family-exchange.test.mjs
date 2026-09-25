// =============================================================================
// 패밀리 교환 형식 시험 (source/exchange/family-exchange.ts)
//   node --test tools/family-exchange.test.mjs
// Node 24 는 .ts 의 타입을 걷어 내고 바로 읽는다. 세 제품도 같은 파일의 사본을 쓴다.
// =============================================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildExchange, parseExchange, planImport, recordKeys, contentHash, normalizeBizNo, normalizeGtin,
  normalizeCode, summarizePlan, EXCHANGE_FORMAT,
} from '../source/exchange/family-exchange.ts';

const sup = (over = {}) => ({
  biz_no: '123-45-67890', name: '가나소재', source_code: 'SUP-001', status: 'approved', approved_until: '2027-01-31',
  category: '원자재', contact_email: null, contact_phone: null, address: null, ...over,
});
const item = (over = {}) => ({ code: 'pd-05050510', name: '창상피복재 5x5', kind: 'finished', spec: null, gtin: '8801234567893', permit_no: '제허 26-1', ...over });
const lot = (over = {}) => ({
  lot_no: 'L2609-01', kind: 'finished', item_code: 'PD-05050510', item_name: null, quantity: 1200, uom: 'EA',
  manufactured_on: '2026-09-01', expiry_on: '2028-08-31', status: 'released', released_on: '2026-09-10', released_by: '품질책임자',
  supplier_biz_no: null, supplier_lot_no: null, ...over,
});
const src = (product) => ({ product, org_name: '데모', org_biz_no: '1234567890', exported_at: '2026-09-25T10:00:00+09:00' });

test('열쇠 다듬기', () => {
  assert.equal(normalizeBizNo('123-45-67890'), '1234567890');
  assert.equal(normalizeBizNo('12345'), null);
  assert.equal(normalizeGtin('8801234567893'), '08801234567893');
  assert.equal(normalizeGtin('123'), null);
  assert.equal(normalizeCode('  pd  050 '), 'PD 050');
  assert.deepEqual(recordKeys('item', item()), ['gtin:08801234567893', 'code:PD-05050510']);
  assert.deepEqual(recordKeys('supplier', sup()), ['biz:1234567890']);
});

test('보내는 쪽: 원본이 아닌 종류는 넣지 않는다', () => {
  const f = buildExchange(src('q-carnet'), { supplier: [sup()], lot: [lot()] });
  assert.equal(f.format, EXCHANGE_FORMAT);
  assert.equal(f.records.supplier.length, 0);
  assert.equal(f.records.lot.length, 1);
});

test('읽기: 원본이 아닌 종류는 경고로 걸러 내고, 틀린 줄이 있으면 파일 전체를 받지 않는다', () => {
  const raw = { format: EXCHANGE_FORMAT, version: 1, source: src('q-carnet'), records: { supplier: [sup()], lot: [lot()] } };
  const r = parseExchange(JSON.stringify(raw));
  assert.equal(r.ok, true);
  assert.equal(r.file.records.supplier.length, 0);
  assert.match(r.warnings[0], /원본이 아니라/);
  const bad = parseExchange({ ...raw, records: { lot: [lot({ status: 'flying' })] } });
  assert.equal(bad.ok, false);
  assert.match(bad.errors[0], /상태/);
  assert.equal(parseExchange('{').ok, false);
  assert.equal(parseExchange({ ...raw, version: 2 }).ok, false);
  const s = parseExchange({ format: EXCHANGE_FORMAT, version: 1, source: src('q-atelier'), records: { supplier: [sup()] } });
  assert.equal(s.file.records.supplier[0].biz_no, '1234567890');
});

test('받을 계획: 새로 · 짝만 · 고침 · 그대로 · 다른 출처 · 확인 필요 · 받지 않음', () => {
  const f = parseExchange({
    format: EXCHANGE_FORMAT, version: 1, source: src('q-atelier'),
    records: {
      supplier: [sup(), sup({ biz_no: '2222222222', name: '다라' }), sup({ biz_no: '3333333333' }), sup({ biz_no: '4444444444' }), sup({ biz_no: '5555555555' })],
      item: [item(), item({ code: 'X-1', gtin: null })],
    },
  }).file;
  const h = contentHash(f.records.supplier[3]);
  const existing = [
    { localId: 'a', kind: 'supplier', keys: ['biz:1234567890'], origin: 'local', lastHash: null },
    { localId: 'b', kind: 'supplier', keys: ['biz:3333333333'], origin: 'q-atelier', lastHash: 'old' },
    { localId: 'c', kind: 'supplier', keys: ['biz:4444444444'], origin: 'q-atelier', lastHash: h },
    { localId: 'd', kind: 'supplier', keys: ['biz:5555555555'], origin: 'q-maison', lastHash: 'x' },
    { localId: 'e', kind: 'item', keys: ['code:X-1'], origin: 'local', lastHash: null },
    { localId: 'f', kind: 'item', keys: ['code:X-1'], origin: 'local', lastHash: null },
  ];
  const plan = planImport(f, 'q-carnet', existing);
  const act = plan.items.map((i) => `${i.kind}:${i.action}`);
  assert.deepEqual(act, [
    'supplier:link_only', 'supplier:create', 'supplier:update', 'supplier:same', 'supplier:other_source',
    'item:create', 'item:ambiguous',
  ]);
  assert.equal(plan.items[2].localId, 'b');
  assert.match(summarizePlan(plan), /새로 2/);
});

test('받을 계획: 강한 열쇠(GTIN)가 맞으면 코드가 달라도 같은 것으로 본다', () => {
  const f = parseExchange({ format: EXCHANGE_FORMAT, version: 1, source: src('q-maison'), records: { item: [item({ code: 'OTHER' })] } }).file;
  const plan = planImport(f, 'q-atelier', [{ localId: 'p', kind: 'item', keys: ['gtin:08801234567893', 'code:PD-1'], origin: 'local', lastHash: null }]);
  assert.equal(plan.items[0].action, 'link_only');
  assert.equal(plan.items[0].localId, 'p');
});

test('받을 계획: 받는 쪽에 자리가 없는 종류 · 같은 제품 파일은 받지 않는다', () => {
  const f = parseExchange({ format: EXCHANGE_FORMAT, version: 1, source: src('q-carnet'), records: { lot: [lot()] } }).file;
  assert.equal(planImport(f, 'q-carnet', []).items[0].action, 'not_accepted');
  assert.equal(planImport(f, 'q-atelier', []).items[0].action, 'create');
});

test('지문은 필드 순서와 무관하고 값이 바뀌면 달라진다', () => {
  const a = sup();
  const b = Object.fromEntries(Object.entries(a).reverse());
  assert.equal(contentHash(a), contentHash(b));
  assert.notEqual(contentHash(a), contentHash(sup({ name: '가나소재(주)' })));
});
