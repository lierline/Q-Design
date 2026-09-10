// 대비비 실측표 생성기: 문서에 붙일 표를 계산해서 냅니다.
// 「4.5 통과」라고 적어 두고 실제로는 4.45 였던 사고가 원본에 두 번 있었습니다.
// 그래서 문서의 숫자도 손으로 적지 않고 여기서 뽑습니다.
//
//   node tools/contrast-table.mjs           표를 화면에 냅니다
//   node tools/contrast-table.mjs --write   docs/02-color.md 의 표시된 자리에 써 넣습니다
//   node tools/contrast-table.mjs --check   문서가 낡았으면 종료코드 1
//
// 🔑 2026-09-10 · 「화면에 내면 사람이 문서에 붙인다」가 이 도구의 빈틈이었습니다.
//    붙이는 사람이 없으면 문서는 그냥 낡습니다. 실제로 상태색을 AA 로 고친 뒤에도
//    docs/02-color.md 는 옛 값 일곱 개를 그대로 들고 있었습니다.
//    이제 도구가 직접 씁니다. 사람이 하는 일은 «돌리는 것» 뿐입니다.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const json = JSON.parse(readFileSync(join(ROOT, 'dist', 'q-design.tokens.json'), 'utf8'));

const WRITE = process.argv.includes('--write');
const CHECK = process.argv.includes('--check');

function srgb(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function luminance(hex) {
  let h = clean(hex).replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
}
function ratio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
// 인쇄 블록의 값은 `#ffffff !important` 형태라 그대로 보면 hex 가 아닙니다.
const clean = (v) => (typeof v === 'string' ? v.replace(/!important/g, '').trim() : v);
const isHex = (v) => typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(clean(v));

/** 반투명 면을 불투명 배경 위에 올렸을 때 눈에 보이는 색. */
function over(fgHex, bgHex, a) {
  const px = (h) => {
    let s = clean(h).replace('#', '');
    if (s.length === 3) s = s.split('').map((c) => c + c).join('');
    return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
  };
  const f = px(fgHex);
  const b = px(bgHex);
  const mix = f.map((c, i) => Math.round(c * a + b[i] * (1 - a)));
  return '#' + mix.map((c) => c.toString(16).padStart(2, '0')).join('');
}

const SURFACES = ['--qa-bg', '--qa-surface', '--qa-surface2'];
const FOREGROUNDS = [
  '--qa-text', '--qa-subtle', '--qa-muted', '--qa-champagne',
  '--qa-green', '--qa-red', '--qa-warning', '--qa-blue',
];
const STATES = [
  '--qa-state-gray', '--qa-state-cobalt', '--qa-state-copper', '--qa-state-gold',
  '--qa-state-violet', '--qa-state-green', '--qa-state-red',
];

/*
 * 상태색이 «무슨 뜻인가» 는 팔레트에 안 적혀 있습니다. 원본 앱의 쓰임에서 옵니다.
 * 문서와 도구 양쪽에 적으면 갈리므로 여기 한 곳에 둡니다.
 */
const STATE_MEANING = {
  '--qa-state-gray': 'draft · not_started · NA',
  '--qa-state-cobalt': 'preview_review · reviewed',
  '--qa-state-copper': 'under_review · in_progress',
  '--qa-state-gold': 'final_decision · review',
  '--qa-state-violet': 'execution_tracking · waived',
  '--qa-state-green': 'completed · approved',
  '--qa-state-red': 'cancelled',
};

function table(pal, label, keys) {
  const rows = [];
  rows.push('| 전경 | ' + SURFACES.map((s) => '`' + s.replace('--qa-', '') + '`').join(' | ') + ' | 최저 |');
  rows.push('|---|' + SURFACES.map(() => '---:').join('|') + '|---:|');
  for (const fg of keys) {
    if (!isHex(pal[fg])) continue;
    const vals = SURFACES.map((bg) => (isHex(pal[bg]) ? ratio(pal[fg], pal[bg]) : NaN));
    const min = Math.min(...vals);
    const mark = min >= 4.5 ? '' : min >= 3 ? ' ⚠︎' : ' ✗';
    rows.push(
      '| `' + fg.replace('--qa-', '') + '` ' + clean(pal[fg]) + ' | ' +
        vals.map((v) => v.toFixed(2)).join(' | ') +
        ' | **' + min.toFixed(2) + '**' + mark + ' |',
    );
  }
  return '### ' + label + '\n\n' + rows.join('\n');
}

// ── 블록 ①: 상태색 팔레트 ───────────────────────────────────────────────────
const paletteRows = ['| 토큰 | 뜻 | 다크 | 라이트 |', '|---|---|---|---|'];
for (const k of STATES) {
  paletteRows.push(
    '| `' + k + '` | ' + STATE_MEANING[k] + ' | `' + clean(json.color.dark[k]) +
      '` | `' + clean(json.color.light[k]) + '` |',
  );
}

// ── 블록 ②: 대비 실측표 ─────────────────────────────────────────────────────
const measured = [];
measured.push(table(json.color.dark, '다크 · 텍스트/액센트', FOREGROUNDS));
measured.push(table(json.color.dark, '다크 · 상태색 7종', STATES));
measured.push(table(json.color.light, '라이트 · 텍스트/액센트', FOREGROUNDS));
measured.push(table(json.color.light, '라이트 · 상태색 7종', STATES));

const p = json.color.print;
const printRows = ['| 전경 | 흰 배경 위 |', '|---|---:|'];
for (const k of ['--qa-text', '--qa-subtle', '--qa-muted', '--qa-champagne']) {
  if (isHex(p[k])) printRows.push('| `' + k.replace('--qa-', '') + '` ' + clean(p[k]) + ' | ' + ratio(p[k], '#ffffff').toFixed(2) + ' |');
}
measured.push('### 인쇄 팔레트 · 흰 종이 위\n\n' + printRows.join('\n'));

const onAcc = ['| 면 | 위 글자 | 대비 |', '|---|---|---:|'];
for (const [themeName, pal] of [['다크', json.color.dark], ['라이트', json.color.light]]) {
  for (const acc of ['--qa-champagne', '--qa-green', '--qa-red', '--qa-warning', '--qa-blue']) {
    if (!isHex(pal[acc]) || !isHex(pal['--qa-on-accent'])) continue;
    onAcc.push(
      '| ' + themeName + ' `' + acc.replace('--qa-', '') + '` | `on-accent` ' + clean(pal['--qa-on-accent']) +
        ' | ' + ratio(pal[acc], pal['--qa-on-accent']).toFixed(2) + ' |',
    );
  }
}
measured.push('### 액센트 면 위 글자\n\n' + onAcc.join('\n'));

// ── 블록 ③: 배지가 실제로 놓이는 조건 ────────────────────────────────────────
// Tag(primary) 는 배경을 `alpha(색, 0.1)` 로 깝니다. 즉 글자가 놓이는 바닥은 순수
// 표면이 아니라 «표면에 그 색을 10% 섞은 면» 이고, 그만큼 대비가 더 낮아집니다.
// 표면 하나만 보고 색을 맞추면 배지에서 조용히 미달합니다.
const badge = [
  '| 상태색 | 카드 위(surface) | 배지 실조건(surface + 10%) | 판정 |',
  '|---|---:|---:|---|',
];
let worstBadge = Infinity;
for (const [themeName, pal] of [['다크', json.color.dark], ['라이트', json.color.light]]) {
  for (const k of STATES) {
    if (!isHex(pal[k]) || !isHex(pal['--qa-surface'])) continue;
    const plain = ratio(pal[k], pal['--qa-surface']);
    const real = ratio(pal[k], over(pal[k], pal['--qa-surface'], 0.1));
    worstBadge = Math.min(worstBadge, real);
    const verdict = real >= 4.5 ? 'AA' : real >= 3 ? '미달' : '심각';
    badge.push(
      '| ' + themeName + ' `' + k.replace('--qa-state-', '') + '` | ' +
        plain.toFixed(2) + ' | **' + real.toFixed(2) + '** | ' + verdict + ' |',
    );
  }
}
badge.push('');
badge.push('가장 나쁜 자리가 **' + worstBadge.toFixed(2) + '** 입니다 (AA 기준 4.5).');

const BLOCKS = {
  '상태색-팔레트': paletteRows.join('\n'),
  '대비-실측표': measured.join('\n\n'),
  '배지-실조건': badge.join('\n'),
};

// ── 문서에 써 넣기 ──────────────────────────────────────────────────────────
const DOC = join(ROOT, 'docs', '02-color.md');

/*
 * 표시는 HTML 주석이라 화면에는 안 보입니다.
 *   <!-- 생성:이름 --> … <!-- /생성:이름 -->
 * 🔑 표시가 없으면 «조용히 건너뛰지» 않고 실패합니다. 문서를 고치다 표시를 지워도
 *    도구는 계속 초록불을 낼 것이고, 그것이 이 도구가 처음에 실패한 방식입니다.
 */
function inject(doc, name, body) {
  const open = '<!-- 생성:' + name + ' -->';
  const close = '<!-- /생성:' + name + ' -->';
  const a = doc.indexOf(open);
  const b = doc.indexOf(close);
  if (a < 0 || b < 0 || b < a) return null;
  return doc.slice(0, a + open.length) + '\n\n' + body + '\n\n' + doc.slice(b);
}

if (WRITE || CHECK) {
  const before = readFileSync(DOC, 'utf8');
  let after = before;
  const missing = [];
  for (const [name, body] of Object.entries(BLOCKS)) {
    const next = inject(after, name, body);
    if (next === null) missing.push(name);
    else after = next;
  }
  if (missing.length) {
    console.error('문서에서 표시를 못 찾았습니다: ' + missing.join(', '));
    console.error('docs/02-color.md 에 <!-- 생성:이름 --> … <!-- /생성:이름 --> 을 두십시오.');
    process.exit(2);
  }
  const same = before.split('\r\n').join('\n') === after.split('\r\n').join('\n');
  if (WRITE) {
    if (!same) writeFileSync(DOC, after, 'utf8');
    console.log(same ? '문서가 이미 최신입니다 · 표 ' + Object.keys(BLOCKS).length + '벌' : '문서를 갱신했습니다 · 표 ' + Object.keys(BLOCKS).length + '벌');
  } else {
    console.log(same ? '문서가 최신입니다 · 표 ' + Object.keys(BLOCKS).length + '벌' : '⚠️ 문서가 낡았습니다. `node tools/contrast-table.mjs --write` 를 돌리십시오.');
    if (!same) process.exit(1);
  }
} else {
  console.log(Object.values(BLOCKS).join('\n\n'));
}
