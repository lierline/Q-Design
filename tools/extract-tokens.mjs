// =============================================================================
// Q-Design 토큰 추출기
// =============================================================================
// Q-Atelier 소스에서 디자인 토큰을 «읽어» dist/ 산출물을 만듭니다.
// 손으로 베끼지 않는 이유: 사본은 어긋납니다. 원본이 바뀌면 이 스크립트를 다시 돌립니다.
//
//   node tools/extract-tokens.mjs
//
// source/ 안의 복사본만 읽으므로 이 폴더 하나로 재생성이 됩니다.
// Node 22.18+ 의 타입 스트리핑으로 tokens.ts 를 그대로 import 합니다.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '..', 'dist');
const SRC_ROOT = resolve(HERE, '..', 'source');

const tokensPath = join(SRC_ROOT, 'tokens', 'tokens.ts');
const globalsPath = join(SRC_ROOT, 'css', 'globals.css');
const expertPath = join(SRC_ROOT, 'css', 'expert-theme.css');

const tokens = await import(pathToFileURL(tokensPath).href);
const globalsCss = readFileSync(globalsPath, 'utf8');
const expertCss = readFileSync(expertPath, 'utf8');

// ── CSS 변수 블록 파서 ───────────────────────────────────────────────────────
// 셀렉터로 블록을 찾아 그 안의 «--이름: 값;» 을 모읍니다. 주석은 먼저 걷어냅니다:
// 이 파일의 주석에는 대비비 계산과 옛 hex 가 잔뜩 적혀 있어 값으로 오인하기 쉽습니다.
function varsInBlock(css, selectorLiteral) {
  const at = css.indexOf(selectorLiteral);
  if (at < 0) throw new Error('셀렉터를 못 찾았습니다: ' + selectorLiteral);
  const open = css.indexOf('{', at);
  let depth = 0;
  let i = open;
  for (; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  const body = css.slice(open + 1, i);
  const clean = body.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = {};
  for (const m of clean.matchAll(/(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g)) {
    out[m[1]] = m[2].trim();
  }
  return out;
}

const darkVars = varsInBlock(globalsCss, ":root,\nhtml[data-theme='dark']");
const lightVars = varsInBlock(globalsCss, "html[data-theme='light'] {");
const lhVars = varsInBlock(globalsCss, ':root {\n  --qa-lh-none');
const printVars = varsInBlock(globalsCss, "  html[data-theme='light'] {");
const expertDark = varsInBlock(expertCss, '.expert-portal-root {');
const expertLight = varsInBlock(expertCss, "html[data-theme='light'] .expert-portal-root {");

// ── 검증: 뽑은 값이 실제로 온전한가 ──────────────────────────────────────────
// 파싱은 틀립니다. 틀리면 조용히 틀리므로 최소한의 온전성을 확인하고 실패시킵니다.
const problems = [];
const need = ['--qa-bg', '--qa-surface', '--qa-text', '--qa-champagne', '--qa-on-accent'];
for (const k of need) if (!darkVars[k]) problems.push('다크 팔레트에 ' + k + ' 가 없습니다');
for (const k of need) if (!lightVars[k]) problems.push('라이트 팔레트에 ' + k + ' 가 없습니다');

const dKeys = new Set(Object.keys(darkVars));
const lKeys = new Set(Object.keys(lightVars));
const onlyDark = [...dKeys].filter((k) => !lKeys.has(k));
const onlyLight = [...lKeys].filter((k) => !dKeys.has(k));
if (onlyDark.length || onlyLight.length) {
  problems.push(
    '다크/라이트 변수 집합 불일치 · 다크만: ' +
      (onlyDark.join(', ') || '없음') +
      ' · 라이트만: ' +
      (onlyLight.join(', ') || '없음'),
  );
}

// LH 사다리: TS 와 CSS 가 같은 값인가 (원본 lh-css-sync 계약과 같은 검사)
for (const [k, v] of Object.entries(tokens.LH)) {
  const cssKey = '--qa-lh-' + k;
  if (!(cssKey in lhVars)) problems.push('CSS 사다리에 ' + cssKey + ' 가 없습니다');
  else if (String(v) !== lhVars[cssKey]) {
    problems.push(cssKey + ': TS ' + v + ' vs CSS ' + lhVars[cssKey]);
  }
}

// 팔레트 사본 대조: tokens.ts 의 hex 리터럴이 globals.css 와 같은가.
// 원본의 contrast.test.ts «팔레트 사본 동기화» 와 같은 축입니다.
const tsSrc = readFileSync(tokensPath, 'utf8');
function paletteLiterals(constName) {
  const at = tsSrc.indexOf('const ' + constName + ' = {');
  if (at < 0) throw new Error(constName + ' 을 못 찾았습니다');
  const end = tsSrc.indexOf('} as const;', at);
  const body = tsSrc.slice(at, end).replace(/\/\/[^\n]*/g, '');
  const out = {};
  for (const m of body.matchAll(/(\w+):\s*'(#[0-9a-fA-F]{6})'/g)) out[m[1]] = m[2].toLowerCase();
  return out;
}
const CSS_KEY_OF = {
  bg: '--qa-bg', surface: '--qa-surface', surface2: '--qa-surface2',
  border: '--qa-border', borderHi: '--qa-borderHi', text: '--qa-text',
  subtle: '--qa-subtle', muted: '--qa-muted', champagne: '--qa-champagne',
  green: '--qa-green', red: '--qa-red', warning: '--qa-warning', blue: '--qa-blue',
  onAccent: '--qa-on-accent',
};
for (const [label, tsPal, cssPal] of [
  ['DARK', paletteLiterals('DARK_PALETTE'), darkVars],
  ['LIGHT', paletteLiterals('LIGHT_PALETTE'), lightVars],
]) {
  for (const [key, hex] of Object.entries(tsPal)) {
    const cssKey = CSS_KEY_OF[key];
    if (!cssKey) continue;
    const cssVal = (cssPal[cssKey] || '').toLowerCase();
    if (cssVal !== hex) problems.push(label + ' ' + key + ': tokens.ts ' + hex + ' vs globals.css ' + cssVal);
  }
}

// Tag 규격: tag-metrics.ts 는 확장자 없는 상대 import 라 Node ESM 이 못 읽습니다.
// 리터럴을 파싱하되, 파싱이 맞는지는 «높이 계산이 알려진 값을 내는가» 로 확인합니다.
// (md 는 minHeight 26 을 콘텐츠 26.1 이 0.1px 이겨 줄간격이 높이를 정합니다.)
const tagSrc = readFileSync(join(SRC_ROOT, 'tokens', 'tag-metrics.ts'), 'utf8');
const TAG_BORDER = Number((tagSrc.match(/TAG_BORDER\s*=\s*(\d+)/) || [])[1]);
const TAG_DIMS = {};
{
  const at = tagSrc.indexOf('export const TAG_DIMS = {');
  const body = tagSrc.slice(at, tagSrc.indexOf('} as const;', at));
  for (const m of body.matchAll(/(\w+):\s*\{([^}]+)\}/g)) {
    const row = {};
    for (const f of m[2].matchAll(/(\w+):\s*(S\[([\d.]+)\]|[\d.]+)/g)) {
      row[f[1]] = f[3] !== undefined ? tokens.S[f[3]] : Number(f[2]);
    }
    TAG_DIMS[m[1]] = row;
  }
}
const tagContentHeight = (size) =>
  TAG_DIMS[size].fs * tokens.LH.snug + TAG_DIMS[size].padY * 2 + TAG_BORDER * 2;
const tagDrivers = {};
for (const size of Object.keys(TAG_DIMS)) {
  tagDrivers[size] = tagContentHeight(size) > TAG_DIMS[size].minH ? 'lineHeight' : 'minHeight';
}
if (!(TAG_BORDER === 1 && Object.keys(TAG_DIMS).length === 3)) {
  problems.push('Tag 규격 파싱이 온전하지 않습니다');
} else if (tagDrivers.md !== 'lineHeight' || tagDrivers.sm !== 'minHeight') {
  problems.push(
    'Tag 높이 지배 요인이 알려진 값과 다릅니다 (md=lineHeight·sm=minHeight 여야 함): ' +
      JSON.stringify(tagDrivers),
  );
}

if (problems.length) {
  console.error('추출 검증 실패:\n  ' + problems.join('\n  '));
  process.exit(1);
}

// ── JSON 산출 ────────────────────────────────────────────────────────────────
const json = {
  $meta: {
    name: 'Q-Design',
    source: 'Q-Atelier · lib/design/tokens.ts + app/globals.css + app/experts/expert-theme.css',
    generatedAt: new Date().toISOString().slice(0, 10),
    note: '손으로 고치지 마세요. tools/extract-tokens.mjs 를 다시 돌리세요.',
    rootFontSizeWarning: 'rem 기준은 16px 이 아니라 14px 입니다. TYPE 의 rem 값을 16 으로 환산하면 전부 틀립니다.',
  },
  color: {
    dark: darkVars,
    light: lightVars,
    print: printVars,
    semantic: tokens.T,
    state: tokens.STATE,
    overlay: tokens.OVERLAY,
    expertDark,
    expertLight,
  },
  typography: {
    fontFamily: tokens.F,
    fontSize: tokens.FS,
    lineHeight: tokens.LH,
    type: tokens.TYPE,
    rootFontSize: 14,
  },
  space: {
    scale: tokens.S,
    touch: tokens.TOUCH,
    layout: tokens.LAYOUT,
    mainPadding: { top: 32, right: 40, bottom: 32, left: 40 },
  },
  breakpoint: tokens.BP,
  radius: tokens.RADIUS,
  motion: tokens.MOTION,
  shadow: { fixedDark: tokens.SHADOW, themeAware: tokens.ELEVATION },
  z: tokens.Z,
  icon: tokens.ICON,
  brand: tokens.BRAND,
  tag: { border: TAG_BORDER, dims: TAG_DIMS, heightDriver: tagDrivers },
};

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'q-design.tokens.json'), JSON.stringify(json, null, 2) + '\n', 'utf8');

// ── CSS 변수 단독 파일 ───────────────────────────────────────────────────────
// 앱 의존성 없이 <link> 한 줄로 쓸 수 있게. 스케일 토큰도 변수로 노출합니다
// (원본은 TS 상수라 CSS 에서 못 읽는데, 옮겨 쓰는 쪽은 CSS 만 쓸 수도 있습니다).
const rawBlock = (obj) =>
  Object.entries(obj)
    .map(([k, v]) => '  ' + k + ': ' + v + ';')
    .join('\n');

// 값 오름차순으로 냅니다. JS 는 정수 키를 먼저 훑어 하프스텝이 뒤로 밀리는데,
// 사다리는 «순서대로» 보여야 다음 사람이 사이값을 찾습니다.
const spaceBlock = Object.entries(tokens.S)
  .sort((a, b) => a[1] - b[1])
  .map(([k, v]) => '  --qa-space-' + String(k).replace('.', '_') + ': ' + v + 'px;')
  .join('\n');
const fsBlock = Object.entries(tokens.FS)
  .map(([k, v]) => '  --qa-fs-' + k + ': ' + v + 'px;')
  .join('\n');
const radiusBlock = Object.entries(tokens.RADIUS)
  .map(([k, v]) => '  --qa-radius-' + k + ': ' + v + 'px;')
  .join('\n');
const motionBlock = Object.entries(tokens.MOTION)
  .map(([k, v]) => '  --qa-motion-' + k + ': ' + v + ';')
  .join('\n');
/*
 * 🔑 카멜을 케밥으로 바꿉니다(drawerBackdrop → drawer-backdrop).
 *    CSS 사용자 정의 속성은 대소문자를 구분하므로 `--qa-z-drawerBackdrop` 도
 *    «동작은» 합니다. 그러나 이 파일의 다른 블록이 전부 케밥이라, 하나만 카멜이면
 *    쓰는 쪽이 어느 쪽인지 매번 확인해야 합니다. 기존 아홉 키는 소문자 한 낱말이라
 *    이름이 바뀌지 않습니다(2026-09-10 확인).
 */
const zBlock = Object.entries(tokens.Z)
  .map(([k, v]) => '  --qa-z-' + k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()) + ': ' + v + ';')
  .join('\n');
const layoutBlock = Object.entries(tokens.LAYOUT)
  .map(([k, v]) => '  --qa-layout-' + k + ': ' + v + 'px;')
  .join('\n');
const touchBlock = Object.entries(tokens.TOUCH)
  .map(([k, v]) => '  --qa-touch-' + k + ': ' + v + 'px;')
  .join('\n');
const iconBlock = Object.entries(tokens.ICON)
  .map(([k, v]) => '  --qa-icon-' + k + ': ' + (k.startsWith('stroke') ? v : v + 'px') + ';')
  .join('\n');
const shadowBlock = Object.entries(tokens.SHADOW)
  .map(([k, v]) => '  --qa-shadow-fixed-' + k + ': ' + v + ';')
  .join('\n');

const css = [
  '/* =============================================================================',
  '   Q-Design 토큰 · 생성물 (tools/extract-tokens.mjs)',
  '   출처: Q-Atelier · lib/design/tokens.ts + app/globals.css',
  '   손으로 고치지 마세요. 원본을 고치고 스크립트를 다시 돌리세요.',
  '   ============================================================================= */',
  '',
  '/* ── 색: 다크(기본) ─────────────────────────────────────────────────────── */',
  ":root,",
  "html[data-theme='dark'] {",
  '  color-scheme: dark;',
  rawBlock(darkVars),
  '}',
  '',
  '/* ── 색: 라이트 ─────────────────────────────────────────────────────────── */',
  "html[data-theme='light'] {",
  '  color-scheme: light;',
  rawBlock(lightVars),
  '}',
  '',
  '/* ── 줄간격 사다리: 색과 달리 테마 축이 아니라 자기 :root 에 둡니다 ─────── */',
  ':root {',
  rawBlock(lhVars),
  '}',
  '',
  '/* ── 스케일: 원본에선 TS 상수. CSS 만 쓰는 곳을 위해 변수로도 냅니다 ────── */',
  ':root {',
  '  /* 간격: 4px 기준 + 2px 하프스텝. 키의 점은 밑줄로 (--qa-space-3_5 = 14px) */',
  spaceBlock,
  '',
  '  /* 글자 크기: 값보존 사다리. 의미가 하나로 수렴하면 TYPE 을 쓰세요 */',
  fsBlock,
  '',
  '  /* 모서리: md(10px) 이 카드·버튼·입력의 표준 */',
  radiusBlock,
  '',
  '  /* 모션: 회전 금지 · scale 금지 */',
  motionBlock,
  '',
  '  /* 레이어 */',
  zBlock,
  '',
  '  /* 셸 폭 */',
  layoutBlock,
  '',
  '  /* 터치 타겟 */',
  touchBlock,
  '',
  '  /* 아이콘 */',
  iconBlock,
  '',
  '  /* 그림자: 다크 고정값. 테마 인지가 필요하면 위의 --qa-shadow-* 를 쓰세요 */',
  shadowBlock,
  '',
  '  /* 브랜드 */',
  '  --qa-gold-gradient: ' + tokens.BRAND.goldGradient + ';',
  '}',
  '',
].join('\n');

writeFileSync(join(OUT, 'q-design.tokens.css'), css, 'utf8');

/* ---------------------------------------------------------------------------
   상태색 · 위험 · 정상 · 주의 · 안내 (2026-09-09 감사 · Q-Sonar #11)

   Q-Sonar 의 `@theme` 이 색 열넷을 정의하면서 red·green·warning 을 하나도 두지
   않아, 화면 24파일이 **Tailwind 기본 팔레트를 직접 불렀습니다.** 위험·정상
   표현이 소스 87곳에 흩어졌고, 그중 넷은 AA 미달이었습니다(실측 4.22).

   🔑 hex 를 여기서 손으로 적지 않습니다. 이미 파싱해 둔 팔레트를 보간합니다.
   🔑 `--qd-danger` 는 q-design.nav.css 가 이미 냅니다. 여기서 다시 내지 않습니다.
      같은 이름을 두 곳에서 선언하면 그것부터 갈립니다.
   🔑 `--qd-danger-hi` 는 테마별 값이 필요 없습니다. 계산이 `--qd-text` 를 보므로
      다크와 라이트가 저절로 갈립니다(다크 #e1b8b1 대비 10.89 · 라이트 11.25).
--------------------------------------------------------------------------- */
const stateCss = [
  '/* =============================================================================',
  '   q-design.state.css · 상태색 정본',
  '   생성물입니다. 손대지 마세요.  node tools/extract-tokens.mjs',
  '',
  '   위험(danger) · 정상(ok) · 주의(warn) · 안내(info) 네 가지입니다.',
  '   --qd-danger 는 q-design.nav.css 가 냅니다. 여기서 다시 내지 않습니다.',
  '',
  '   제품이 제 이름을 갖고 있으면 --qd-<이름>-src 로 이어 쓰세요.',
  '   ============================================================================= */',
  '',
  ':root {',
  `  --qd-ok:        var(--qd-ok-src,        var(--qa-green,   ${darkVars['--qa-green']}));`,
  `  --qd-warn:      var(--qd-warn-src,      var(--qa-warning, ${darkVars['--qa-warning']}));`,
  `  --qd-info:      var(--qd-info-src,      var(--qa-blue,    ${darkVars['--qa-blue']}));`,
  '  /* 위험색을 글자로 쓸 때. 면 위에서 읽히도록 본문색을 섞어 올린다 */',
  '  --qd-danger-hi: var(--qd-danger-hi-src, color-mix(in oklab, var(--qd-text) 55%, var(--qd-danger)));',
  '}',
  '',
  "html[data-theme='light'] {",
  `  --qd-ok:   var(--qd-ok-src,   var(--qa-green,   ${lightVars['--qa-green']}));`,
  `  --qd-warn: var(--qd-warn-src, var(--qa-warning, ${lightVars['--qa-warning']}));`,
  `  --qd-info: var(--qd-info-src, var(--qa-blue,    ${lightVars['--qa-blue']}));`,
  '}',
  '',
].join('\n');

writeFileSync(join(OUT, 'q-design.state.css'), stateCss, 'utf8');

console.log('생성 완료');
console.log(
  '  dist/q-design.tokens.json  · 색 다크 ' +
    Object.keys(darkVars).length +
    ' 라이트 ' +
    Object.keys(lightVars).length +
    ' 인쇄 ' +
    Object.keys(printVars).length +
    ' 전문가 ' +
    Object.keys(expertDark).length +
    '/' +
    Object.keys(expertLight).length,
);
console.log('  dist/q-design.tokens.css');
console.log('  검증 통과 · 다크=라이트 변수 집합 · LH 사다리 TS=CSS · 팔레트 사본 TS=CSS');
