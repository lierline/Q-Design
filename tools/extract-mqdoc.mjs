// =============================================================================
// MedQraft 종이 문서 양식 v8 토큰 뽑기
// =============================================================================
//   node tools/extract-mqdoc.mjs           뽑아서 dist/q-design.mqdoc.* 와 docs/23 생성 구간에 씁니다
//   node tools/extract-mqdoc.mjs --check   쓰지 않고, 어긋난 곳이 있으면 종료코드 1
//
// 원본: 오너가 준 「MedQraft 문서 양식_rev.8.zip」 의 규격서
//       (회사 문서 양식 규격 v8 · SP-MQ-2026-001). MedQraft Docs 저장소 `templates/spec-v8/` 에
//       손대지 않은 채로 커밋되어 있고, refresh-source 가 그 «커밋된» 내용을 source/brief/v8/ 로 받아 옵니다.
//
// 🔑 대외 문서(MedQraft)는 «두 판» 입니다.
//      브리핑 덱 · 1-pager (DARK)   → dist/q-design.brief.*   · 금 #D6B56D (장식 · 어두운 바탕 위 글자)
//      종이 문서 (LIGHT, 이 파일)    → dist/q-design.mqdoc.*   · 금 #8C6C27 (흰 종이 위 글자)
//    같은 금색 장치를 쓰지만 종이 위 글자는 어두운 금색이어야 읽힌다(흰 종이 #D6B56D 는 1.96:1).
//
// 🔑 값은 손으로 옮기지 않습니다. 규격서의 표(sc-raw-table)를 읽어 뽑고, 읽은 표가 모자라면 실패합니다.
// 🔑 회사 Word 변환기(templates/mqhtml.py)와도 대조합니다. 규격서와 변환기가 다르면 «알려진 차이» 목록에
//    사유와 함께 있어야 하고, 목록에 없는 차이가 생기거나 목록의 차이가 사라지면(낡은 예외) 실패합니다.
// 🔴 규격서 원문은 긴 줄표(U+2014)를 씁니다. 이 저장소의 문서에는 쓰지 않으므로 생성 구간에 옮길 때
//    칸 전체가 줄표면 「없음」, 문장 안이면 「 · 」 로 바꿉니다(원본 파일은 그대로 둡니다).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const SRC_DIR = process.env.MQDOC_SRC || join(ROOT, 'source', 'brief', 'v8');
const SPEC = join(SRC_DIR, 'MQ-문서양식-v8-규격서.html');
const CONVERTER = process.env.MQDOC_CONV || join(ROOT, 'source', 'brief', 'mqhtml.py');
const DIST = join(ROOT, 'dist');
const DOC = join(ROOT, 'docs', '23-medqraft-paper-document-v8.md');
const CHECK = process.argv.includes('--check');

const fail = [];
const warn = [];

// ── 1. 묶음 HTML 에서 페이지 본문을 꺼냅니다 ─────────────────────────────────────
if (!existsSync(SPEC)) {
  console.error(`규격서 원본이 없습니다: ${SPEC} (refresh-source 를 먼저 돌리십시오)`);
  process.exit(2);
}
const bundle = readFileSync(SPEC, 'utf8');
const tm = bundle.match(/<script type="__bundler\/template"[^>]*>([\s\S]*?)<\/script>/);
if (!tm) {
  console.error('규격서가 묶음 HTML 이 아닙니다(__bundler/template 없음)');
  process.exit(2);
}
const page = JSON.parse(tm[1]);
const body = page.slice(page.indexOf('<doc-page'));

const DASH = /\u2014|\u2013/g;
const text = (h) =>
  h
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
const clean = (s) => (s.replace(/\s/g, '') === '\u2014' ? '없음' : s.replace(/\s*[\u2014\u2013]\s*/g, ' · ').trim());

// ── 2. 문서 정보 ────────────────────────────────────────────────────────────
const plain = text(body);
const idm = plain.match(/(SP-MQ-\d{4}-\d{3})\s*·\s*(rev\.\d+)\s*·\s*(\d{4}\.\d{2}\.\d{2})/);
const titm = plain.match(/회사 문서 양식 규격 (v\d+)/);
if (!idm || !titm) fail.push('규격서의 문서번호 · 개정 · 판(v8)을 못 읽었습니다');
const meta = idm ? { 문서번호: idm[1], 개정: idm[2], 날짜: idm[3], 판: titm ? titm[1] : null } : {};

// ── 3. 표 ───────────────────────────────────────────────────────────────────
// 장 제목(h2) 뒤에 오는 표를 그 장에 붙입니다.
const tables = [];
const re = /<sc-raw-table[\s\S]*?<\/sc-raw-table>/g;
let m;
while ((m = re.exec(body))) {
  const html = m[0];
  const cap = text((html.match(/<sc-raw-caption[\s\S]*?<\/sc-raw-caption>/) || [''])[0]);
  const heads = [...html.matchAll(/<sc-raw-th[^>]*>([\s\S]*?)<\/sc-raw-th>/g)].map((x) => clean(text(x[1])));
  const rows = [...html.matchAll(/<sc-raw-tbody[\s\S]*?<\/sc-raw-tbody>/g)]
    .flatMap((tb) => [...tb[0].matchAll(/<sc-raw-tr[^>]*>([\s\S]*?)<\/sc-raw-tr>/g)])
    .map((tr) => [...tr[1].matchAll(/<sc-raw-td[^>]*>([\s\S]*?)<\/sc-raw-td>/g)].map((x) => clean(text(x[1]))));
  const before = body.slice(0, m.index);
  const h2s = [...before.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)];
  const chapter = h2s.length ? clean(text(h2s[h2s.length - 1][1])) : '';
  tables.push({ 번호: cap, 장: chapter, 머리: heads, 줄: rows });
}
// 규격서 v8 은 표 1~6 을 둡니다(표 5 는 그림 · 차트, 표 6 은 문서 번호 · 표기). 모자라면 읽기가 깨진 것입니다.
if (tables.length < 6) fail.push(`규격서에서 표를 ${tables.length}개만 읽었습니다(6개 이상이어야 합니다)`);
const byCap = (n) => tables.find((t) => t.번호 === `표 ${n}`) || { 머리: [], 줄: [] };
const row = (t, name) => t.줄.find((r) => r[0] === name) || null;
const num = (s) => {
  const x = String(s || '').match(/-?\d+(\.\d+)?/);
  return x ? Number(x[0]) : null;
};
const hex = (s) => (String(s || '').match(/#[0-9A-Fa-f]{6}/) || [null])[0];

// 판형과 여백 (표 1)
const t1 = byCap(1);
const pageTok = {
  판형: row(t1, '판형')?.[1] ?? null,
  좌우여백_mm: num(row(t1, '좌·우 여백')?.[1]),
  위여백_mm: num(row(t1, '위 여백')?.[1]),
  아래여백_mm: num(row(t1, '아래 여백')?.[1]),
  쪽번호띠_mm: num((row(t1, '아래 여백')?.[1] || '').split('+')[1]),
  본문폭_mm: num(row(t1, '본문 폭')?.[1]),
  본문높이_mm: num(row(t1, '본문 높이')?.[1]),
};
for (const [k, v] of Object.entries(pageTok)) if (v === null) fail.push(`표 1 에서 ${k} 를 못 읽었습니다`);

// 타입 스케일 (표 2): 역할 · 크기 · 굵기 · 줄간격 · 색·앞뒤 간격 · w:sz
const t2 = byCap(2);
const type = t2.줄.map((r) => ({
  역할: r[0],
  크기_pt: num(r[1]),
  굵기: num(r[2]),
  모노: /mono/i.test(r[2] || ''),
  줄간격: num(r[3]),
  색: hex(r[4]),
  자간_em: ((r[4] || '').match(/자간\s*([−-]?\d+(\.\d+)?)em/) || [null, null])[1]?.replace('−', '-') ?? null,
  설명: r[4],
  w_sz: num(r[5]),
}));
if (type.length < 8) fail.push(`표 2 타입 스케일을 ${type.length}줄만 읽었습니다(8줄 이상)`);
for (const t of type) {
  if (t.크기_pt === null || !t.색) fail.push(`표 2 「${t.역할}」 의 크기나 색을 못 읽었습니다`);
  // Word 의 크기 단위는 half-point 입니다. 규격서의 두 값이 서로 맞아야 합니다.
  if (t.크기_pt !== null && t.w_sz !== null && Math.round(t.크기_pt * 2) !== t.w_sz)
    fail.push(`표 2 「${t.역할}」 크기 ${t.크기_pt} pt 와 w:sz ${t.w_sz} 가 맞지 않습니다(half-point)`);
}
const role = (name) => type.find((t) => t.역할.startsWith(name)) || {};

// 표 규칙 (표 3)
const t3 = byCap(3);
const r3 = (name) => (row(t3, name) || [])[1] || '';
const tableTok = {
  머리행: r3('머리행'),
  행구분선: r3('행 구분선'),
  셀여백: r3('셀 여백'),
  열너비: r3('열 너비'),
  정렬: r3('정렬'),
  주석: r3('주석'),
  행구분선_색: hex(r3('행 구분선')),
};
for (const [k, v] of Object.entries(tableTok)) if (!v) fail.push(`표 3 에서 ${k} 를 못 읽었습니다`);

// 차트 색 (표 5)
const t5 = byCap(5);
const chartRow = (row(t5, '차트 색') || [])[1] || '';
const chartHex = [...chartRow.matchAll(/#[0-9A-Fa-f]{6}/g)].map((x) => x[0]);
const chart = { 기본막대: chartHex[0], 강조: chartHex[1], 경고: chartHex[2], 격자선: chartHex[3], 기준선: chartHex[4] };
if (chartHex.length < 5) fail.push(`표 5 차트 색을 ${chartHex.length}개만 읽었습니다(5개)`);

// 표지 · 머리말 · 꼬리말 · 워터마크 (6장): 표가 아니라 소절 글입니다. 「6.」 으로 시작하는 h3 와 그 뒤 문단을 모읍니다.
const sixth = [...body.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3|<h2|<\/doc-page)/g)]
  .map((x) => ({ 제목: clean(text(x[1])), 글: clean(text(x[2])) }))
  .filter((x) => /^6\.\d/.test(x.제목));
if (sixth.length < 4) fail.push(`6장(표지 · 머리말 · 꼬리말 · 워터마크) 소절을 ${sixth.length}개만 읽었습니다(4개)`);

// 색 역할
const color = {
  먹: role('표지 제목').색,
  본문: role('본문').색,
  소절: role('소절 제목').색,
  뮤트: role('캡션').색,
  금_글자: role('아이브로우').색,
  선: tableTok.행구분선_색,
  ...Object.fromEntries(Object.entries(chart).map(([k, v]) => [`차트_${k}`, v])),
};
for (const [k, v] of Object.entries(color)) if (!v) fail.push(`색 「${k}」 를 못 읽었습니다`);

// ── 4. 종이 위 글자 대비 (WCAG AA 4.5) ─────────────────────────────────────────
const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const contrast = {};
for (const k of ['먹', '본문', '소절', '뮤트', '금_글자']) {
  if (!color[k]) continue;
  contrast[k] = Math.round(ratio(color[k], '#FFFFFF') * 100) / 100;
  if (contrast[k] < 4.5) fail.push(`글자색 「${k}」 ${color[k]} 가 흰 종이에서 ${contrast[k]}:1 입니다(AA 4.5 미달)`);
}

// ── 5. 회사 Word 변환기(mqhtml.py)와 대조 ─────────────────────────────────────────
// 알려진 차이: 규격서와 변환기가 다른 것을 «알고» 있는 자리. 사유 없이 늘어나면 실패, 사라지면 낡은 예외로 실패.
const KNOWN_DRIFT = {
  본문색: '변환기 BODY 가 v8 이전 값(#354154). v8 은 본문 #1B2230 · 소절 제목 #354154 로 나눴다. 변환기를 v8 에 맞출지 오너 결정 대기(2026-09-24)',
  본문폭: '변환기 BODY_PX 는 좌우 여백 18 mm(본문 174 mm) 기준. v8 은 22 mm(본문 166 mm). 오너 결정 대기(2026-09-24)',
};
const drift = [];
if (existsSync(CONVERTER)) {
  const py = readFileSync(CONVERTER, 'utf8');
  const cst = (n) => (py.match(new RegExp(`^${n}\\s*=\\s*'(#[0-9A-Fa-f]{6})'`, 'm')) || [null, null])[1];
  const pairs = [
    ['먹색', cst('INK'), color.먹],
    ['본문색', cst('BODY'), color.본문],
    ['뮤트', cst('MUTED'), color.뮤트],
    ['선', cst('RULE'), color.선],
    ['금 글자', cst('GOLD_INK'), color.금_글자],
  ];
  for (const [k, conv, spec] of pairs) {
    if (!conv) fail.push(`변환기에서 ${k} 상수를 못 읽었습니다`);
    else if (conv.toUpperCase() !== String(spec).toUpperCase()) drift.push({ 항목: k, 규격서: spec, 변환기: conv });
  }
  const px = Number((py.match(/^BODY_PX\s*=\s*(\d+)/m) || [null, NaN])[1]);
  const specPx = Math.round((pageTok.본문폭_mm / 25.4) * 96);
  if (Math.abs(px - specPx) > 2) drift.push({ 항목: '본문폭', 규격서: `${pageTok.본문폭_mm} mm (${specPx} px)`, 변환기: `${px} px (${Math.round((px / 96) * 25.4)} mm)` });
} else {
  fail.push(`변환기 사본이 없습니다: ${CONVERTER}`);
}
for (const d of drift) {
  d.사유 = KNOWN_DRIFT[d.항목] || null;
  if (!d.사유) fail.push(`규격서와 변환기가 다릅니다(알려진 차이 목록에 없음): ${d.항목} 규격서 ${d.규격서} · 변환기 ${d.변환기}`);
}
for (const k of Object.keys(KNOWN_DRIFT))
  if (!drift.find((d) => d.항목 === k)) fail.push(`알려진 차이 「${k}」 가 더는 없습니다. KNOWN_DRIFT 에서 지우십시오(낡은 예외)`);

// ── 6. 산출물 ────────────────────────────────────────────────────────────────
const out = {
  _주의: '이 파일은 tools/extract-mqdoc.mjs 가 규격서에서 뽑습니다. 손대지 마십시오.',
  원본: { ...meta, 파일: 'source/brief/v8/MQ-문서양식-v8-규격서.html' },
  판형: pageTok,
  색: color,
  종이대비: contrast,
  글자: type.map(({ 설명, ...t }) => t),
  표: tableTok,
  차트: chart,
  규격서_표: tables,
  표지와_머리말: sixth,
  변환기와_차이: drift,
};
const css = [
  '/* 이 파일은 tools/extract-mqdoc.mjs 가 뽑습니다. 손대지 마십시오. */',
  `/* MedQraft 종이 문서 양식 ${meta.판 || ''} · ${meta.문서번호 || ''} ${meta.개정 || ''} */`,
  ':root {',
  `  --mqd-page: A4;`,
  `  --mqd-margin-x: ${pageTok.좌우여백_mm}mm;`,
  `  --mqd-margin-top: ${pageTok.위여백_mm}mm;`,
  `  --mqd-margin-bottom: ${pageTok.아래여백_mm}mm;`,
  `  --mqd-folio-band: ${pageTok.쪽번호띠_mm}mm;`,
  `  --mqd-body-width: ${pageTok.본문폭_mm}mm;`,
  ...Object.entries({ ink: color.먹, body: color.본문, sub: color.소절, muted: color.뮤트, 'gold-ink': color.금_글자, rule: color.선 }).map(
    ([k, v]) => `  --mqd-${k}: ${v};`,
  ),
  ...Object.entries(chart).map(([k, v], i) => `  --mqd-chart-${['base', 'accent', 'warn', 'grid', 'baseline'][i]}: ${v};`),
  ...type.map((t) => {
    // 역할 이름으로 CSS 이름을 붙입니다(줄 순서에 기대지 않습니다). 모르는 역할이면 실패합니다.
    const NAMES = [['표지 제목', 'cover-title'], ['아이브로우', 'eyebrow'], ['장 제목', 'chapter'], ['장 번호', 'chapter-no'],
      ['절 제목', 'section'], ['소절 제목', 'subsection'], ['본문', 'body'], ['표 본문', 'table'], ['캡션', 'caption'], ['머리말', 'running']];
    const hit = NAMES.find(([k]) => t.역할.startsWith(k));
    if (!hit) fail.push(`표 2 의 역할 「${t.역할}」 에 CSS 이름이 없습니다(NAMES 에 더하십시오)`);
    return `  --mqd-font-${hit ? hit[1] : 'unknown'}: ${t.굵기 ?? 400} ${t.크기_pt}pt/${t.줄간격 ?? 'normal'};`;
  }),
  "  --mqd-sans: 'Noto Sans KR', 'Malgun Gothic', sans-serif;",
  "  --mqd-mono: 'JetBrains Mono', Consolas, monospace;",
  '}',
  '',
].join('\n');
const jsonText = JSON.stringify(out, null, 2) + '\n';

// docs/23 의 생성 구간
const md = (t) =>
  [`| ${t.머리.join(' | ')} |`, `|${t.머리.map(() => '---').join('|')}|`, ...t.줄.map((r) => `| ${r.map((c) => c.replace(/\|/g, '/')).join(' | ')} |`)].join('\n');
const blocks = {
  'mqdoc-원본': `규격서 ${meta.문서번호} ${meta.개정} · ${meta.날짜} · 회사 문서 양식 규격 ${meta.판}. 표 ${tables.length}개를 읽었습니다.`,
  'mqdoc-색': [
    '| 역할 | 값 | 흰 종이 대비 |',
    '|---|---|---:|',
    ...Object.entries(color).map(([k, v]) => `| ${k.replace(/_/g, ' ')} | \`${v}\` | ${contrast[k] ? contrast[k] + ':1' : '글자 아님'} |`),
  ].join('\n'),
  // 번호(표 N)가 있는 표만. 표지의 문서정보 표는 번호가 없고, 규격이 아니라 이 규격서 자신의 정보입니다.
  ...Object.fromEntries(tables.filter((t) => /^표 \d+$/.test(t.번호)).map((t) => [`mqdoc-${t.번호.replace(' ', '')}`, `**${t.번호} · ${t.장}**\n\n${md(t)}`])),
  'mqdoc-표지머리말': '**06 · 표지 · 머리말 · 꼬리말 · 워터마크**\n\n' + sixth.map((x) => `- **${x.제목}** ${x.글}`).join('\n'),
  'mqdoc-변환기': drift.length
    ? ['| 항목 | 규격서 v8 | 변환기 mqhtml.py | 사유 |', '|---|---|---|---|', ...drift.map((d) => `| ${d.항목} | ${d.규격서} | ${d.변환기} | ${d.사유 || '(목록에 없음)'} |`)].join('\n')
    : '규격서와 변환기의 값이 모두 같습니다.',
};
let doc = existsSync(DOC) ? readFileSync(DOC, 'utf8') : null;
if (doc === null) fail.push(`문서가 없습니다: ${DOC}`);
else {
  for (const [k, v] of Object.entries(blocks)) {
    const a = `<!-- 생성:${k} -->`;
    const b = `<!-- /생성:${k} -->`;
    const i = doc.indexOf(a);
    const j = doc.indexOf(b);
    if (i < 0 || j < 0) {
      fail.push(`docs/23 에 생성 구간 ${k} 가 없습니다`);
      continue;
    }
    doc = doc.slice(0, i + a.length) + '\n' + v.replace(DASH, ' · ') + '\n' + doc.slice(j);
  }
}

const same = (p, s) => existsSync(p) && readFileSync(p, 'utf8').split('\r\n').join('\n') === s;
const stale = [];
if (!same(join(DIST, 'q-design.mqdoc.json'), jsonText)) stale.push('dist/q-design.mqdoc.json');
if (!same(join(DIST, 'q-design.mqdoc.css'), css)) stale.push('dist/q-design.mqdoc.css');
if (doc !== null && !same(DOC, doc)) stale.push('docs/23-medqraft-paper-document-v8.md');

for (const [p, s] of [[join(DIST, 'q-design.mqdoc.json'), jsonText], [join(DIST, 'q-design.mqdoc.css'), css], [DOC, doc]])
  if (/[\u2014\u2013]/.test(s || '')) fail.push(`${p} 에 긴 줄표가 남았습니다`);

if (!CHECK && !fail.length) {
  mkdirSync(DIST, { recursive: true });
  writeFileSync(join(DIST, 'q-design.mqdoc.json'), jsonText, 'utf8');
  writeFileSync(join(DIST, 'q-design.mqdoc.css'), css, 'utf8');
  writeFileSync(DOC, doc, 'utf8');
}

console.log(`MedQraft 종이 문서 v8: 표 ${tables.length} · 글자 역할 ${type.length} · 색 ${Object.keys(color).length} · 변환기와 차이 ${drift.length}(알려진 것 ${drift.filter((d) => d.사유).length})`);
for (const w of warn) console.log('  주의: ' + w);
for (const f of fail) console.log('  XX ' + f);
if (CHECK && stale.length) console.log('  XX 낡은 산출물: ' + stale.join(' · '));
process.exit(fail.length || (CHECK && stale.length) ? 1 : 0);
