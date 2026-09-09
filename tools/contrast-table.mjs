// 대비비 실측표 생성기: 문서에 붙일 표를 계산해서 냅니다.
// 「4.5 통과」라고 적어 두고 실제로는 4.45 였던 사고가 원본에 두 번 있었습니다.
// 그래서 문서의 숫자도 손으로 적지 않고 여기서 뽑습니다.
//
//   node tools/contrast-table.mjs

import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const json = JSON.parse(readFileSync(resolve(HERE, '..', 'dist', 'q-design.tokens.json'), 'utf8'));

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

const out = [];
out.push(table(json.color.dark, '다크 · 텍스트/액센트', FOREGROUNDS));
out.push(table(json.color.dark, '다크 · 상태색 7종', STATES));
out.push(table(json.color.light, '라이트 · 텍스트/액센트', FOREGROUNDS));
out.push(table(json.color.light, '라이트 · 상태색 7종', STATES));

// 인쇄: 흰 배경만 씁니다.
const p = json.color.print;
const printRows = ['| 전경 | 흰 배경 위 |', '|---|---:|'];
for (const k of ['--qa-text', '--qa-subtle', '--qa-muted', '--qa-champagne']) {
  if (isHex(p[k])) printRows.push('| `' + k.replace('--qa-', '') + '` ' + clean(p[k]) + ' | ' + ratio(p[k], '#ffffff').toFixed(2) + ' |');
}
out.push('### 인쇄 팔레트 · 흰 종이 위\n\n' + printRows.join('\n'));

// 액센트 면 위 글자 (onAccent)
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
out.push('### 액센트 면 위 글자\n\n' + onAcc.join('\n'));

// ── 배지가 실제로 놓이는 조건 ────────────────────────────────────────────────
// Tag(primary) 는 배경을 `alpha(색, 0.1)` 로 깝니다. 즉 글자가 놓이는 바닥은 순수
// 표면이 아니라 «표면에 그 색을 10% 섞은 면» 이고, 그만큼 대비가 더 낮아집니다.
// 표면 하나만 보고 색을 맞추면 배지에서 조용히 미달합니다.
const badge = [
  '| 상태색 | 카드 위(surface) | 배지 실조건(surface + 10%) | 판정 |',
  '|---|---:|---:|---|',
];
for (const [themeName, pal] of [['다크', json.color.dark], ['라이트', json.color.light]]) {
  for (const k of STATES) {
    if (!isHex(pal[k]) || !isHex(pal['--qa-surface'])) continue;
    const plain = ratio(pal[k], pal['--qa-surface']);
    const real = ratio(pal[k], over(pal[k], pal['--qa-surface'], 0.1));
    const verdict = real >= 4.5 ? 'AA' : real >= 3 ? '미달' : '심각';
    badge.push(
      '| ' + themeName + ' `' + k.replace('--qa-state-', '') + '` | ' +
        plain.toFixed(2) + ' | **' + real.toFixed(2) + '** | ' + verdict + ' |',
    );
  }
}
out.push('### 배지(Tag primary) 실조건 대비\n\n' + badge.join('\n'));

console.log(out.join('\n\n'));
