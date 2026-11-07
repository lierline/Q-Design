// 글자 사다리 계약(2026-10-26 오너 결정, docs/03-typography.md).
// 화면 글자 크기는 12 · 14 · 16 · 18 · 20 · 24 · 28 · 32 · 40 아홉 단, 굵기는 400 · 500 · 600,
// 줄 간격은 1.2 · 1.4 · 1.6 세 값과 정렬용 1 만 쓴다. 44px 를 넘는 장식 숫자와 종이 · 인쇄 · 글꼴 선언은 밖이다.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {readRuntimeValues} from './atelier-runtime-values.mjs';

const root = 'D:/Claude/Q-Design';
const LADDER = new Set([12, 14, 16, 18, 20, 24, 28, 32, 40]);
const DISPLAY = new Set([48, 60, 72, 96, 128]);
const LEADING = {none: '1', tight: '1.2', snug: '1.4', relaxed: '1.6'};
const LINE_RATIOS = new Set(['0', ...Object.values(LEADING)]);
// 칸 높이를 고정하려고 px 로 둔 정렬용 줄 높이(56px 단추 · 숫자 칸). 글자 줄 간격이 아니다.
const ALIGNMENT_LINE_BOXES = new Set(['--qd-atelier-line-height-0eeead20b3', '--qd-atelier-line-height-de42f18f9f']);

// dist 는 제품이 실제로 받는 파일이다. 추출기 틀에 박힌 값은 patterns 에 없고 여기에만 나온다(2026-10-26 실측).
const cssFiles = () => ['patterns', 'patterns/foundation', 'dist']
  .flatMap((dir) => fs.readdirSync(path.join(root, dir)).filter((name) => name.endsWith('.css')).map((name) => `${dir}/${name}`));

// 인쇄 · 쪽 · 글꼴 선언 블록은 화면 사다리 밖이다.
function outsideScreen(css) {
  const ranges = [];
  for (const match of css.matchAll(/@media\s+print|@page|@font-face/g)) {
    const open = css.indexOf('{', match.index);
    let depth = 0;
    for (let i = open; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}' && --depth === 0) { ranges.push([match.index, i]); break; }
    }
  }
  return (index) => ranges.some(([start, end]) => index >= start && index <= end);
}

const px = (value, unit) => Number(value) * (unit === 'rem' ? 16 : 1);
const onLadder = (size) => LADDER.has(size) || size > 44;

export function ladderViolations(css) {
  const skip = outsideScreen(css);
  const found = [];
  const each = (regex, check) => {
    for (const match of css.matchAll(regex)) if (!skip(match.index) && !check(match)) found.push(match[0].trim());
  };
  each(/(?<![\w-])font-size:\s*([\d.]+)(px|rem)\b/g, (m) => onLadder(px(m[1], m[2])));
  each(/(?<![\w-])font-weight:\s*(\d{3})\b/g, (m) => ['400', '500', '600'].includes(m[1]));
  each(/(?<![\w-])line-height:\s*([\d.]+)(px|rem|em|%)?\s*[;!}]/g, (m) => !m[2] && LINE_RATIOS.has(m[1]));
  each(/(--[\w-]*(?:font-size|leading|line-height|-lh-|font-weight)[\w-]*):\s*([\d.]+)(px|rem)?\s*;/g, (m) => {
    const [, name, value, unit] = m;
    if (/weight/.test(name)) return ['400', '500', '600'].includes(value) && !unit;
    if (/size/.test(name)) return onLadder(px(value, unit));
    if (ALIGNMENT_LINE_BOXES.has(name)) return true;
    return !unit && LINE_RATIOS.has(value);
  });
  return found;
}

test('정본 화면 CSS 는 크기 아홉 단 · 굵기 셋 · 줄 간격 세 값 밖을 쓰지 않는다', () => {
  const bad = cssFiles().flatMap((file) => ladderViolations(fs.readFileSync(path.join(root, file), 'utf8')).map((hit) => `${file}: ${hit}`));
  assert.deepEqual(bad, []);
});

test('검사는 사다리 밖 값을 실제로 잡고, 인쇄 블록은 놓아 준다', () => {
  assert.deepEqual(ladderViolations('.a{font-size:13px;font-weight:700;line-height:1.5}'), ['font-size:13px', 'font-weight:700', 'line-height:1.5}']);
  assert.deepEqual(ladderViolations(':root{--qd-x-font-size: 22px; --qd-y-leading: 1.3; --qd-z-font-weight: 800; --qa-lh-loose: 1.7;}'), ['--qd-x-font-size: 22px;', '--qd-y-leading: 1.3;', '--qd-z-font-weight: 800;', '--qa-lh-loose: 1.7;']);
  assert.deepEqual(ladderViolations('@media print{.a{font-size:9px;font-weight:700}} .b{font-size:2.5rem;line-height:1.2} .c{font-size:80px}'), []);
});

test('기반 변수는 정한 이름만 정의한다', () => {
  const foundation = fs.readFileSync(path.join(root, 'patterns/foundation.css'), 'utf8');
  const sizes = [...foundation.matchAll(/--qd-font-size-(\d+):\s*(\d+)px;/g)].map((m) => Number(m[1]));
  assert.deepEqual(sizes.filter((n) => !LADDER.has(n) && !DISPLAY.has(n)), []);
  for (const n of LADDER) assert.ok(sizes.includes(n), `--qd-font-size-${n} 이 없습니다`);
  const weights = Object.fromEntries([...foundation.matchAll(/--qd-font-weight-(\w+):\s*(\d+);/g)].map((m) => [m[1], m[2]]));
  assert.deepEqual(weights, {normal: '400', medium: '500', semibold: '600'});
  const leadings = Object.fromEntries([...foundation.matchAll(/--qd-leading-(\w+):\s*([\d.]+);/g)].map((m) => [m[1], m[2]]));
  assert.deepEqual(leadings, LEADING);
  assert.doesNotMatch(foundation, /--qd-line-height-[\w-]+:/, '줄 간격 사본 이름(--qd-line-height-*)은 걷었습니다. --qd-leading-* 를 쓰세요');
});

test('테일윈드 연결도 같은 이름만 만든다', () => {
  const maison = fs.readFileSync(path.join(root, 'patterns/foundation/maison-tailwind.ts'), 'utf8');
  assert.match(maison, /lineHeight: Object\.fromEntries\(\s*\["none", "tight", "snug", "relaxed"\]/);
  assert.match(maison, /fontWeight: Object\.fromEntries\(\s*\["normal", "medium", "semibold"\]/);
  assert.doesNotMatch(maison, /font-size-(30|36)\)/);
  const carnet = fs.readFileSync(path.join(root, 'patterns/foundation/carnet-theme.css'), 'utf8');
  const bridge = carnet.slice(carnet.indexOf('/* Product compatibility names and live Q-Design bridges. */'));
  assert.match(bridge, /--font-weight-\*: initial;\s*\n\s*--leading-\*: initial;/);
  assert.deepEqual([...carnet.matchAll(/--font-weight-(\w+):/g)].map((m) => m[1]), ['normal', 'medium', 'semibold']);
  assert.deepEqual([...carnet.matchAll(/--leading-(\w+):/g)].map((m) => m[1]), ['none', 'tight', 'snug', 'relaxed']);
  assert.doesNotMatch(carnet, /font-size-(30|36)\)/);
});

test('세 제품 기반 CSS 는 b · strong 을 600 으로 둔다', () => {
  // 브라우저 기본(bold 700)과 테일윈드 preflight(bolder: 700 · 900)가 굵기 셋 결정을 새게 한다.
  for (const product of ['atelier', 'maison', 'carnet']) {
    const css = fs.readFileSync(path.join(root, `dist/q-design.foundation.${product}.css`), 'utf8');
    assert.match(css, /\bb,\s*strong\s*\{\s*font-weight:\s*var\(--qd-font-weight-semibold\);?\s*\}/, product);
  }
});

test('아뜰리에 태그 글자도 사다리 위에 있다', () => {
  const {QDPresentation} = readRuntimeValues(root);
  for (const [size, dims] of Object.entries(QDPresentation.visual.tag.dims)) assert.ok(LADDER.has(dims.fs), `tag ${size} ${dims.fs}`);
});

test('소나 유틸리티는 정본 값을 그대로 들고 가고, 테일윈드 연결도 같은 이름만 만든다', async () => {
  // 2026-11-04: Q-Sonar 는 기반 · 컴포넌트 조각을 받지 않아 사다리 · 모서리 · 조작부 · 표 규칙이 없었다(impeccable 감사 2 · 3 · 32 · 35번).
  // patterns/foundation/sonar-theme.css 가 그 값을 들고 가는데 사본이므로, 이름마다 정본(foundation · components)과 대조한다.
  const lf = (css) => css.replace(/\r\n/g, '\n');
  const sonar = lf(fs.readFileSync(path.join(root, 'patterns/foundation/sonar-theme.css'), 'utf8'));
  const foundation = lf(fs.readFileSync(path.join(root, 'patterns/foundation.css'), 'utf8'));
  const components = lf(fs.readFileSync(path.join(root, 'patterns/components.css'), 'utf8'));
  const firstValues = (css) => {
    const out = {};
    for (const m of css.matchAll(/^\s*(--qd-[\w-]+):\s*([^;]+);/gm)) if (!(m[1] in out)) out[m[1]] = m[2].trim();
    return out;
  };
  const canon = {...firstValues(components), ...firstValues(foundation)};
  const copied = firstValues(sonar);
  assert.ok(Object.keys(copied).length >= 30, '소나 조각의 변수가 너무 적습니다');
  for (const [name, value] of Object.entries(copied)) assert.equal(value, canon[name], `${name}: 소나 조각 ${value} ≠ 정본 ${canon[name] ?? '(없음)'}`);
  for (const name of ['--qd-font-size-12', '--qd-font-size-40', '--qd-font-weight-semibold', '--qd-leading-relaxed', '--qd-radius', '--qd-control-height', '--qd-table-grow-min-width', '--qd-table-size']) assert.ok(name in copied, `${name} 이 소나 조각에 없습니다`);
  // 좁은 창 · 손가락 기기의 누름 자리 블록은 기반 조각과 글자까지 같다(2026-10-22 폰 실측 규칙)
  const block = (css, open) => { const i = css.indexOf(open); assert.ok(i >= 0, open); return css.slice(i, css.indexOf('\n}', i) + 2); };
  for (const open of ['@media (max-width: 640px) {\n  html :is(.qd-btn', '@media (hover: none) and (pointer: coarse) {']) assert.equal(block(sonar, open), block(foundation, open));
  // 표 열 폭 규칙은 컴포넌트 조각과 같다. 소나 쪽은 @layer components 안에 들여 썼으므로 줄 머리 공백만 빼고 대조한다
  const dedent = (s) => s.replace(/^[ \t]+/gm, '');
  const tableOpen = '.qd-table { width: 100%; table-layout: auto; }';
  assert.ok(dedent(sonar).includes(dedent(block(components, tableOpen))), '표 열 폭 규칙이 정본(components.css)과 다릅니다');
  const nowrapLine = components.split('\n').find((l) => l.startsWith('html .qd-table:not(.qd-table--editable)'));
  assert.ok(nowrapLine && sonar.includes(nowrapLine), '표 안 단추 nowrap 줄이 소나 조각에 없거나 다릅니다');
  const {tableGrowGaps} = await import('./table-grow.test.mjs');
  assert.deepEqual(tableGrowGaps(sonar), []);
  // 테일윈드 이름 잇기: 굵기 셋 · 줄 간격 넷 · 크기는 사다리만 · 모서리는 정본 하나
  const bridge = sonar.slice(sonar.indexOf('@theme inline {'));
  assert.match(bridge, /--font-weight-\*: initial;\s*\n\s*--leading-\*: initial;\s*\n\s*--radius-\*: initial;/);
  assert.deepEqual([...sonar.matchAll(/--font-weight-(\w+):/g)].map((m) => m[1]), ['normal', 'medium', 'semibold']);
  assert.deepEqual([...sonar.matchAll(/--leading-(\w+):/g)].map((m) => m[1]), ['none', 'tight', 'snug', 'relaxed']);
  assert.doesNotMatch(sonar, /font-size-(30|36)\)/);
  for (const n of ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl']) assert.match(bridge, new RegExp(`--text-${n}: var\\(--qd-font-size-\\d+\\);\\s*\\n\\s*--text-${n}--line-height: var\\(--qd-leading-${n}\\);`), `text-${n}`);
  for (const n of ['sm', 'md', 'lg', 'xl', '2xl', '3xl']) assert.match(bridge, new RegExp(`--radius-${n}: var\\(--qd-radius\\);`), `rounded-${n}`);
  assert.match(sonar, /\bb,\s*strong\s*\{\s*font-weight:\s*var\(--qd-font-weight-semibold\);?\s*\}/);
});
