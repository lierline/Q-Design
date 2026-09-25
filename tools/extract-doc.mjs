// =============================================================================
// 문서 범주 산출물 만들기 (DOCX · 인쇄)
// =============================================================================
// 화면 밖에서 쓰는 산출물입니다. 같은 팔레트를 쓰지만 «자리» 가 다릅니다.
//
//   node tools/extract-doc.mjs
//
// 화면과 다른 점 다섯:
//   ① 종이는 언제나 흰색이다. 다크 축이 없다
//   ② 표면이 둘이다: 흰 종이(#ffffff)와 음영 표(#f3f1ec).
//      **음영 표 위가 더 어렵다.** 흰 배경만 보고 색을 고르면 표 안에서 미달한다
//   ③ 색 표기가 OOXML 형식이다 (# 없는 6자 대문자)
//   ④ 글꼴 폴백이 다르다. Word 는 Pretendard 가 없으면 한글을 명조로 대체하므로
//      eastAsia 를 Malgun Gothic 으로 못박는다
//   ⑤ 크기 단위가 다르다. DOCX 는 half-point(pt×2)와 twip(pt×20)을 쓴다
//
// 🔴 이 파일이 생긴 이유: Q-Atelier 의 `lib/export/docx-builder/brand.ts` 가
//    라이트 팔레트를 손으로 베낀 사본이었다. 주석에 「색 수정 시 양쪽 모두 변경」이라
//    적혀 있었지만 실제로는 **세 값이 어긋나** 있었고, 그중 둘(#7a7468)은 웹에서
//    2026-06-30 에 AA 미달로 이미 고친 값이었다. 심사원이 읽는 출력물에만 남아 있었다.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const DIST = join(ROOT, 'dist');

const tokens = JSON.parse(readFileSync(join(DIST, 'q-design.tokens.json'), 'utf8'));
const light = tokens.color.light;
const print = tokens.color.print;

const clean = (v) => String(v || '').replace(/!important/g, '').trim();
const ooxml = (v) => clean(v).replace('#', '').toUpperCase();

// ── 대비 계산 (종이 두 면 위) ───────────────────────────────────────────────
const srgb = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
const lum = (hex) => {
  const s = clean(hex).replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
};
const ratio = (a, b) => {
  const la = lum(a);
  const lb = lum(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};

const PAPER = clean(light['--qa-surface']);   // #ffffff
const PAPER_ALT = clean(light['--qa-surface2']); // #f3f1ec
const worstOnPaper = (hex) => Math.min(ratio(hex, PAPER), ratio(hex, PAPER_ALT));

// ── 문서 팔레트: 라이트 팔레트에서 «파생» 한다 ──────────────────────────────
// 손으로 적는 값은 champagneSoft 하나뿐이고, 그것도 다크 금색을 가리킨다(사본 아님).
const PALETTE = {
  champagne: light['--qa-champagne'],
  champagneSoft: tokens.color.dark['--qa-champagne'], // 밝은 금: 부제·hover 톤
  ink: light['--qa-text'],
  inkSubtle: light['--qa-subtle'],
  inkMuted: light['--qa-muted'],
  border: light['--qa-borderHi'],
  borderSoft: light['--qa-border'],
  frame: light['--qa-muted'],
  paper: light['--qa-bg'],
  surface: light['--qa-surface'],
  surfaceAlt: light['--qa-surface2'],
  red: light['--qa-red'],
  green: light['--qa-green'],
  warning: light['--qa-warning'],
  blue: light['--qa-blue'],
};

// ── 검증: 종이 위에서 AA 인가 ───────────────────────────────────────────────
// 글자로 쓰이는 것만 본다. 면(paper·surface·border)은 대비 대상이 아니다.
const TEXT_KEYS = ['champagne', 'ink', 'inkSubtle', 'inkMuted', 'frame', 'red', 'green', 'warning', 'blue'];
const problems = [];
for (const k of TEXT_KEYS) {
  const w = worstOnPaper(PALETTE[k]);
  if (w < 4.5) problems.push(k + ' ' + clean(PALETTE[k]) + ' 최저 ' + w.toFixed(2));
}
if (problems.length) {
  console.error('종이 위 AA 미달:\n  ' + problems.join('\n  '));
  console.error('\n웹 라이트 팔레트를 먼저 고치십시오. 이 파일은 거기서 파생됩니다.');
  process.exit(1);
}

// ── 산출: JSON ──────────────────────────────────────────────────────────────
const doc = {
  $meta: {
    name: 'Q-Design 문서 토큰',
    note: '생성물입니다. 손으로 고치지 마세요. tools/extract-doc.mjs 를 다시 돌리세요.',
    derivedFrom: '웹 라이트 팔레트 (q-design.tokens.json · color.light)',
    generatedAt: new Date().toISOString().slice(0, 10),
    paperSurfaces: [PAPER, PAPER_ALT],
    warning: '흰 종이만 보고 색을 고르지 마세요. 음영 표(' + PAPER_ALT + ') 위가 더 어렵습니다.',
  },
  color: Object.fromEntries(Object.entries(PALETTE).map(([k, v]) => [k, ooxml(v)])),
  colorHex: Object.fromEntries(Object.entries(PALETTE).map(([k, v]) => [k, clean(v)])),
  contrastOnPaper: Object.fromEntries(
    TEXT_KEYS.map((k) => [
      k,
      {
        white: Number(ratio(PALETTE[k], PAPER).toFixed(2)),
        shaded: Number(ratio(PALETTE[k], PAPER_ALT).toFixed(2)),
      },
    ]),
  ),
  font: {
    // Word 는 Pretendard 가 없으면 한글을 명조로 대체한다. eastAsia 를 못박는다.
    sans: { ascii: 'Pretendard', hAnsi: 'Pretendard', eastAsia: 'Malgun Gothic' },
    mono: 'Consolas',
    note: '한글까지 Pretendard 로 통일하려면 폰트 임베드가 필요합니다(별도 작업).',
  },
  // DOCX 는 half-point(pt×2). 화면 px 사다리와 «다른 축» 이라 값을 그대로 옮기지 않는다.
  sizeHalfPt: {
    coverTitle: 56,   // 28pt
    h1: 32,           // 16pt
    h2: 26,           // 13pt
    h3: 22,           // 11pt
    body: 20,         // 10pt
    caption: 18,      // 9pt
    label: 16,        // 8pt · mono 라벨·표 헤더
    footer: 14,       // 7pt
  },
  // twip = pt × 20. A4 여백은 화면 @page 규칙과 같은 값으로 맞춘다.
  spacingTwip: {
    pageMarginTop: 1020,    // 18mm
    pageMarginSide: 907,    // 16mm
    pageMarginBottom: 1247, // 22mm
    paraAfter: 120,         // 6pt
    paraAfterHeading: 200,  // 10pt
    lineBody: 276,          // 1.15줄
    lineNotice: 312,        // 1.3줄
  },
  rule: {
    // 화면의 「금색 짧은 선」이 문서에서는 표지·헤딩 앵커선이 된다.
    accentBarWidthTwip: 640,
    hairlineSize: 4,   // OOXML border size (1/8pt 단위) = 0.5pt
    frameSize: 8,      // 1pt
  },
};

mkdirSync(DIST, { recursive: true });
writeFileSync(join(DIST, 'q-design.doc.json'), JSON.stringify(doc, null, 2) + '\n', 'utf8');

// ── 산출: TS 모듈 (받는 쪽이 그대로 import) ─────────────────────────────────
const bodyLines = [];
bodyLines.push('// =============================================================================');
bodyLines.push('// Q-Design 문서 토큰 · 생성물');
bodyLines.push('// =============================================================================');
bodyLines.push('// 손으로 고치지 마세요. Q-Design 에서 `node tools/extract-doc.mjs` 를 돌려 만듭니다.');
bodyLines.push('// 웹 라이트 팔레트에서 파생되므로, 색을 바꾸려면 거기를 바꾸고 다시 내보냅니다.');
bodyLines.push('//');
bodyLines.push('// ⚠️ 종이는 면이 둘입니다: 흰 종이와 음영 표(' + PAPER_ALT + ').');
bodyLines.push('//    음영 표 위가 더 어렵습니다. 흰 배경만 보고 색을 고르면 표 안에서 미달합니다.');
bodyLines.push('//');
bodyLines.push('// 색은 OOXML 표기(# 없는 6자 대문자)입니다.');
bodyLines.push('');
bodyLines.push('export const DOC_COLOR = {');
for (const [k, v] of Object.entries(doc.color)) {
  const c = doc.contrastOnPaper[k];
  const tail = c ? '  // 흰 ' + c.white + ' · 음영 ' + c.shaded : '';
  bodyLines.push("  " + k + ": '" + v + "'," + tail);
}
bodyLines.push('} as const;');
bodyLines.push('');
bodyLines.push('/** Word 는 Pretendard 미설치 시 한글을 명조로 대체합니다. eastAsia 를 못박습니다. */');
bodyLines.push('export const DOC_FONT = {');
bodyLines.push("  sans: { ascii: 'Pretendard', hAnsi: 'Pretendard', eastAsia: 'Malgun Gothic' },");
bodyLines.push("  serif: { ascii: 'Pretendard', hAnsi: 'Pretendard', eastAsia: 'Malgun Gothic' },");
bodyLines.push("  mono: 'Consolas',");
bodyLines.push('} as const;');
bodyLines.push('');
bodyLines.push('/** DOCX 는 half-point(pt×2). 화면 px 사다리와 다른 축입니다. */');
bodyLines.push('export const DOC_SIZE = {');
for (const [k, v] of Object.entries(doc.sizeHalfPt)) bodyLines.push('  ' + k + ': ' + v + ', // ' + v / 2 + 'pt');
bodyLines.push('} as const;');
bodyLines.push('');
bodyLines.push('/** twip = pt × 20 */');
bodyLines.push('export const DOC_SPACING = {');
for (const [k, v] of Object.entries(doc.spacingTwip)) bodyLines.push('  ' + k + ': ' + v + ',');
bodyLines.push('} as const;');
bodyLines.push('');
bodyLines.push('export const DOC_RULE = {');
for (const [k, v] of Object.entries(doc.rule)) bodyLines.push('  ' + k + ': ' + v + ',');
bodyLines.push('} as const;');
bodyLines.push('');

// 머리표(사본 지문)는 `tools/sync.mjs` 가 내보낼 때 붙입니다. 여기서 붙이면 이중이 됩니다.
const body = bodyLines.join('\n');
const sha = createHash('sha256').update(body, 'utf8').digest('hex');
writeFileSync(join(DIST, 'q-design.doc.ts'), body, 'utf8');

// ── 산출: 인쇄 CSS ──────────────────────────────────────────────────────────
// HTML 을 종이로 내보내는 경로(브라우저 인쇄·PDF)용. 화면 팔레트를 종이 팔레트로 덮습니다.
const printVars = Object.entries(print)
  .map(([k, v]) => '    ' + k + ': ' + clean(v) + ' !important;')
  .join('\n');

const printCss = [
  '/* =============================================================================',
  '   Q-Design 인쇄 · 생성물 (tools/extract-doc.mjs)',
  '   =============================================================================',
  '   HTML 을 종이나 PDF 로 내보낼 때 씁니다. 화면 팔레트를 종이 팔레트로 덮습니다.',
  '',
  '   🔑 스크롤 컨테이너를 «푸는» 것이 핵심입니다. 앱 셸이 100dvh + overflow hidden 이면',
  '      첫 화면 한 장만 인쇄됩니다. 이 파일이 그것을 풉니다.',
  '   ============================================================================= */',
  '',
  '@media print {',
  '  :root,',
  '  html,',
  "  html[data-theme='dark'],",
  "  html[data-theme='light'] {",
  printVars,
  '  }',
  '',
  '  html, body {',
  '    background: #ffffff !important;',
  '    color: ' + clean(print['--qa-text'] || '#1a1814') + ' !important;',
  '  }',
  '',
  '  /* 스크롤 컨테이너 풀기: 이게 없으면 한 장만 인쇄됩니다 */',
  '  main, .qa-main-content, [data-print-scroll] {',
  '    height: auto !important;',
  '    max-height: none !important;',
  '    overflow: visible !important;',
  '  }',
  '',
  '  /* 화면 전용 요소 숨김 */',
  '  aside, nav, button, .qa-skip-link, .qa-top-progress,',
  '  .qa-ribbon-layer-1, .qa-ribbon-layer-2, [data-print-hide] {',
  '    display: none !important;',
  '  }',
  '',
  '  /* 따라오는 거르개 띠: 종이에는 스크롤이 없어 sticky 가 첫 장에만 남고 나머지 장에서 자리만',
  '     차지합니다. 제자리로 돌리고, 찾기 폼(칸 · 단추 · 건수)은 종이에서 쓸 수 없으니 걷습니다.',
  '     지금 무엇으로 좁혀 놓았는지는 주소가 말합니다(원본 globals.css 의 .qa-list-toolbar 인쇄 규칙과 같음) */',
  '  .qd-filter-bar { position: static !important; }',
  '  .qd-filter-row { display: none !important; }',
  '',
  '  /* 떠 있는 효과 제거: 종이에는 그림자가 없습니다 */',
  '  * {',
  '    box-shadow: none !important;',
  '    text-shadow: none !important;',
  '  }',
  '  .qa-card-lift { transform: none !important; }',
  '',
  '  /* 잘리면 안 되는 것 */',
  '  table, figure, .qa-card-lift, [data-print-keep] {',
  '    break-inside: avoid;',
  '    page-break-inside: avoid;',
  '  }',
  '  h1, h2, h3 {',
  '    break-after: avoid-page;',
  '    page-break-after: avoid;',
  '  }',
  '',
  '  a { color: inherit !important; text-decoration: none !important; }',
  '',
  '  @page {',
  '    size: A4;',
  '    margin: 18mm 16mm 22mm;',
  '  }',
  '}',
  '',
].join('\n');

/* 거르개 띠 인쇄 규칙은 원본이 그렇게 하기 때문에 둡니다. 원본이 바뀌면 여기서 멈춥니다 */
{
  const g = readFileSync(join(dirname(DIST), 'source', 'css', 'globals.css'), 'utf8').replace(/\r\n/g, '\n');
  if (!/\.qa-list-toolbar \{ position: static; \}/.test(g) || !/\.qa-list-toolbar form \{ display: none; \}/.test(g)) {
    throw new Error('원본의 도구줄 인쇄 규칙(.qa-list-toolbar)이 바뀌었습니다. 정본 인쇄의 거르개 띠 규칙을 다시 보세요.');
  }
}

writeFileSync(join(DIST, 'q-design.print.css'), printCss, 'utf8');

console.log('생성 완료');
console.log('  dist/q-design.doc.json   문서 토큰 (색 ' + Object.keys(doc.color).length + ' · 크기 ' + Object.keys(doc.sizeHalfPt).length + ' · 간격 ' + Object.keys(doc.spacingTwip).length + ')');
console.log('  dist/q-design.doc.ts     받는 쪽이 그대로 import · sha ' + sha.slice(0, 12));
console.log('  dist/q-design.print.css  HTML 을 종이로');
console.log('  검증 통과 · 글자 색 ' + TEXT_KEYS.length + '종이 «흰 종이와 음영 표» 양쪽에서 AA');
