// =============================================================================
// Q-Design 목록 정본 추출기
// =============================================================================
// Q-Atelier 의 `DataTable` · `EntityRow` · `Tag` 를 «읽어» 목록 화면의 치수를
// 뽑고, 프레임워크 무관 CSS 한 벌을 만듭니다.
//
//   node tools/extract-list.mjs
//
// 산출물
//   dist/q-design.list.json   치수
//   dist/q-design.list.css    Q-Sonar · Q-Forge 가 그대로 링크하는 클래스 한 벌
//
// ── 왜 표부터인가 ─────────────────────────────────────────────────────────────
// 차림표를 맞춘 뒤 본문을 나란히 놓아 보니, 인상이 가장 크게 갈리는 자리가
// **목록** 이었습니다. 화면 면적의 대부분을 목록이 차지하는데 세 제품의 셀
// 여백 · 머리글 글꼴 · 행 경계가 전부 달랐습니다.
//
// ── 표를 카드로 바꾸지 않습니다 ───────────────────────────────────────────────
// 저쪽에는 두 가지가 다 있습니다. 항목 수가 적고 «하나하나가 사건» 인 목록은
// `EntityRow`(카드), 수천 줄을 훑는 자리는 `DataTable`(표)입니다. 4만 개 회사와
// 55개 자재 로트를 전부 카드로 바꾸면 한 화면에 여섯 줄만 보입니다.
// **꼴을 통일하는 것이 아니라 «같은 꼴끼리» 맞춥니다.**
//
// ── 진짜 <table> 에도 걸립니다 ────────────────────────────────────────────────
// 저쪽 DataTable 은 grid 로 짠 div 인데, 두 제품은 진짜 `<table>` 을 씁니다.
// 마크업을 통째로 바꾸면 열 너비 · colspan · 정렬이 다 흔들립니다. 그래서
// `.qd-table` 은 `table/th/td` 와 `div` 양쪽에 같은 값을 겁니다.
// =============================================================================

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { read, slice, probeAll, put, flat, assertFilled, bindingsBlock, px } from './probe.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const OUT = join(ROOT, 'dist');
const SRC = join(ROOT, 'source');

const comp = read(join(SRC, 'components', 'components.tsx'));
const globals = read(join(SRC, 'css', 'globals.css'));
const tagMetrics = read(join(SRC, 'tokens', 'tag-metrics.ts'));
const tokens = JSON.parse(read(join(OUT, 'q-design.tokens.json')));

/*
 * 🔴 먼저 «부품 하나» 를 자르고, 그 안에서 다시 자릅니다.
 *
 * `{icon && (` 같은 표지는 이 파일에 여러 번 나옵니다. 부품을 안 자르고
 * 바로 찾으면 **다른 부품의 값** 을 뽑고도 아무도 안 웁니다 (실제로 아이콘 칩
 * 폭이 세 번 맞았습니다). 구역은 좁을수록 좋습니다.
 */
const P = {
  table: slice(comp, 'export function DataTable<T>({', '// ─── ENTITY ROW', 'DataTable'),
  row: slice(comp, 'export function EntityRow({', '// ─── RISK PILL', 'EntityRow'),
  tag: slice(comp, 'export function Tag({', '// ─── PROGRESSBAR', 'Tag'),
};

const Z = {
  tableHead: slice(P.table, 'const headerRow = showHeader ? (', 'const body =', 'tableHead'),
  tablePad: slice(P.table, 'const template = columns.map(', 'const headerRow', 'tablePad'),
  tableCell: slice(P.table, 'const cells = columns.map((c) => (', 'const key = getRowKey', 'tableCell'),
  rowBox: slice(P.row, 'const rowStyle: CSSProperties = {', 'const inner = (', 'rowBox'),
  rowChip: slice(P.row, '{icon && (', '<div style={{ flex: 1, minWidth: 0 }}>', 'rowChip'),
  rowCode: slice(P.row, '{code && (', '{badges}', 'rowCode'),
  /* 제목 스타일은 {title} «앞» 에 있습니다. 꼬리부터 자르면 안 잡힙니다 */
  rowTitleBox: slice(P.row, 'fontFamily: F.serif,\n            fontSize: FS[14],', '{title}', 'rowTitleBox'),
  rowMeta: slice(P.row, '{meta && (', '{right && <div', 'rowMeta'),
  tagBox: slice(P.tag, "      style={{\n        boxSizing: 'border-box',", '{dot && (', 'tagBox'),
};

const spec = probeAll([
  // ── 표 ──────────────────────────────────────────────────────────────────
  ['table.padY',        Z.tablePad,  /const padY = dense \? \d+ : (\d+);/, Number],
  ['table.padYDense',   Z.tablePad,  /const padY = dense \? (\d+) : \d+;/, Number],
  ['table.padX',        Z.tableCell, /padding: `\$\{padY\}px (\d+)px`,/, Number],
  ['table.headFontSize',Z.tableHead, /fontSize: FS\[(\d+)\],/, Number],
  ['table.headWeight',  Z.tableHead, /fontWeight: (\d+),/, Number],
  ['table.headTracking',Z.tableHead, /letterSpacing: labelTracking\(c\.header, '([\d.]+em)'\),/, String],
  ['table.cellFontSize',Z.tableCell, /fontSize: FS\[(\d+)\],/, Number],

  // ── 항목 카드 (EntityRow) ───────────────────────────────────────────────
  ['row.gap',           Z.rowBox,    /gap: S\[([\d.]+)\],/, Number],
  ['row.padding',       Z.rowBox,    /padding: '([^']+)',/, String],
  ['row.accentWidth',   Z.rowBox,    /borderLeft: `(\d+)px solid \$\{accent\}`,/, Number],
  ['row.minHeight',     Z.rowBox,    /minHeight: (\d+),/, Number],
  ['row.chipSize',      Z.rowChip,   /width: (\d+),/, Number],
  ['row.chipAlpha',     Z.rowChip,   /background: alpha\(chipColor, ([\d.]+)\),/, Number],
  ['row.codeFontSize',  Z.rowCode,   /fontSize: FS\[(\d+)\],/, Number],
  ['row.codeWeight',    Z.rowCode,   /fontWeight: (\d+),/, Number],
  ['row.codeTracking',  Z.rowCode,   /letterSpacing: labelTracking\(code, '([\d.]+em)'\),/, String],
  ['row.titleFontSize', Z.rowTitleBox, /fontSize: FS\[(\d+)\],/, Number],
  ['row.titleWeight',   Z.rowTitleBox, /fontWeight: (\d+),/, Number],
  ['row.metaFontSize',  Z.rowMeta,   /fontSize: FS\[(\d+)\],/, Number],

  // ── 배지 (Tag) ──────────────────────────────────────────────────────────
  ['tag.tracking',      Z.tagBox,    /letterSpacing: labelTracking\(children, ([\d.]+)\),/, Number],
]);

/* 판 안쪽 여백. `SectionCard` 가 `S[6]` 을 씁니다 (간격 사다리는 4의 배수). */
{
  const card = slice(comp, 'export function SectionCard({', 'export function DetailRow', 'SectionCard');
  const m = card.match(/padding: S\[(\d+)\],/);
  if (!m) throw new Error('SectionCard 의 여백을 못 찾았습니다.');
  put(spec, 'panel.padding', Number(m[1]) * 4);
}

/* 모서리·전환·그림자는 토큰에서 옵니다. 여기서 다시 재지 않습니다. */
put(spec, 'row.radius', tokens.radius.md);
put(spec, 'tag.radius', tokens.radius.sm);
/* 단추·입력의 모서리도 같은 사다리에서 옵니다(2026-09-09 감사 · 주제 #13).
   Q-Sonar 는 판이 10px 인데 그 안의 단추 191개·입력 12개가 전부 0px 이었습니다.
   10 이라는 숫자가 이미 세 벌(Q-Atelier tokens.ts · dist/q-design.tokens.json ·
   Q-Forge globals.css)이라 제품이 네 번째를 적지 않게 여기서 내보냅니다. */
put(spec, 'control.radius', tokens.radius.md);
put(spec, 'row.transition', tokens.motion.fast);
put(spec, 'table.transition', tokens.motion.fast);

/* 배지 규격 세 벌. tag-metrics.ts 가 SSOT 이고 거기 테스트가 높이 사슬을 잠급니다. */
{
  const m = tagMetrics.match(/export const TAG_DIMS = \{([\s\S]*?)\n\} as const;/);
  if (!m) throw new Error('TAG_DIMS 를 못 찾았습니다.');
  for (const line of m[1].split('\n')) {
    const g = line.match(/(\w+):\s*\{ minH: (\d+), fs: ([\d.]+), padY: (\d+), padX: (\d+), dotSize: (\d+), gap: S\[([\d.]+)\] \}/)
      ?? line.match(/(\w+):\s*\{ minH: (\d+), fs: ([\d.]+), padY: (\d+), padX: (\d+), dotSize: (\d+), gap: ([\d.]+) \}/);
    if (!g) continue;
    const gapRaw = Number(g[7]);
    put(spec, `tag.${g[1]}`, {
      minH: Number(g[2]), fs: Number(g[3]), padY: Number(g[4]),
      padX: Number(g[5]), dot: Number(g[6]),
      /* S[n] 는 4의 배수, 맨몸 숫자는 px 그대로 (md 의 gap 5 가 그렇습니다) */
      gap: line.includes('S[') ? gapRaw * 4 : gapRaw,
    });
  }
  for (const s of ['xs', 'sm', 'md']) {
    if (!spec.tag[s]) throw new Error(`배지 규격 ${s} 를 못 읽었습니다.`);
  }
}

/* 배지 세 층의 투명도. 「이 색을 몇 % 섞는가」가 배지의 전부입니다. */
{
  const box = slice(P.tag, 'const bg =\n    effTier === ', 'const tagColor =', 'tagTier');
  const bg = box.match(/effTier === 'primary' \? alpha\(c, ([\d.]+)\)/);
  const bd1 = box.match(/effTier === 'primary' \? `1px solid \$\{alpha\(c, ([\d.]+)\)\}`/);
  const bd3 = box.match(/effTier === 'tertiary' \? `1px solid \$\{alpha\(c, ([\d.]+)\)\}`/);
  const bd2 = box.match(/: `1px solid \$\{alpha\(c, ([\d.]+)\)\}`;/);
  if (!bg || !bd1 || !bd2 || !bd3) throw new Error('배지 세 층의 투명도를 못 읽었습니다.');
  put(spec, 'tag.primaryBg', Number(bg[1]));
  put(spec, 'tag.primaryBorder', Number(bd1[1]));
  put(spec, 'tag.secondaryBorder', Number(bd2[1]));
  put(spec, 'tag.tertiaryBorder', Number(bd3[1]));
}

/*
 * 카드 hover. 저쪽은 `.qa-card-lift` 가 맡습니다.
 *
 * ⚠️ 그림자 선언이 여러 줄이라 `[^;]+` 로는 안 잡힙니다. 줄바꿈까지 먹여야
 *    합니다 - 한 줄짜리 값만 상정한 정규식은 조용히 «없다» 고 말합니다.
 */
{
  const lift = slice(globals, '.qa-card-lift {', '\n}', 'cardLift');
  const hover = slice(globals, '.qa-card-lift:hover', '\n}', 'cardLiftHover');
  const t = lift.match(/transition:\s*([\s\S]+?);/);
  const shadow = hover.match(/box-shadow:\s*([\s\S]+?);/);
  const border = hover.match(/border-color:\s*([\s\S]+?);/);
  const lift2 = hover.match(/transform:\s*([^;]+);/);
  if (!t || !shadow || !border) throw new Error('.qa-card-lift 값을 못 찾았습니다.');
  /*
   * 저쪽 변수 이름(`--qa-*`)을 정본 이름(`--qd-*`)으로 바꿔 넣습니다.
   * 안 바꾸면 두 제품에는 그 이름이 없어 **테두리와 그림자가 통째로 사라집니다** ·
   * CSS 는 없는 변수를 에러로 만들지 않고 그냥 아무것도 안 그립니다.
   */
  const oneLine = (s) =>
    s.trim()
      .replace(/\s*\n\s*/g, ' ')
      .replace(/--qa-champagne/g, '--qd-accent')
      .replace(/--qa-border\b/g, '--qd-border');
  put(spec, 'row.hoverTransition', oneLine(t[1]));
  put(spec, 'row.hoverShadow', oneLine(shadow[1]));
  put(spec, 'row.hoverBorder', oneLine(border[1]));
  put(spec, 'row.hoverLift', (lift2?.[1] ?? 'none').trim());
}

assertFilled(spec);
if (spec.row.padding !== '16px 18px') throw new Error(`항목 카드 여백이 바뀌었습니다: ${spec.row.padding}`);
if (spec.table.padX !== 12) throw new Error(`셀 좌우 여백이 바뀌었습니다: ${spec.table.padX}`);

// ── CSS ──────────────────────────────────────────────────────────────────────
const BINDINGS = [
  ['bg', 'bg'],
  ['surface', 'surface'],
  ['surface2', 'surface2'],
  ['border', 'border'],
  ['borderHi', 'borderHi'],
  ['text', 'text'],
  ['subtle', 'subtle'],
  ['muted', 'muted'],
  ['accent', 'champagne'],
];
const bind = (mode) => bindingsBlock(tokens.color, mode, BINDINGS);
const mix = (pct) => `color-mix(in srgb, var(--_c) ${Math.round(pct * 100)}%, transparent)`;

const tagSize = (name, d) => `
.qd-tag--${name} {
  min-height: ${px(d.minH)};
  font-size: ${d.fs}px;
  padding: ${d.padY}px ${d.padX}px;
  gap: ${px(d.gap)};
}
.qd-tag--${name} .qd-tag-dot { width: ${px(d.dot)}; height: ${px(d.dot)}; }`;

const css = `/* =============================================================================
   q-design.list.css · 목록 정본
   생성물입니다. 손대지 마세요.  node tools/extract-list.mjs
   원본: Q-Atelier lib/design/components.tsx (DataTable · EntityRow · Tag)
   =============================================================================

   ── 무엇을 언제 쓰나 ───────────────────────────────────────────────────────
   \`.qd-table\`  수백~수천 줄을 훑는 자리. 밀도가 값어치입니다
   \`.qd-row\`    항목 수가 적고 «하나하나가 사건» 인 목록. 부적합 · 불만 · 변경
   \`.qd-tag\`    상태 배지. 두 꼴 모두에서 씁니다

   꼴을 하나로 합치지 않습니다. 4만 개 회사를 카드로 바꾸면 한 화면에 여섯 줄만
   보입니다. **같은 꼴끼리** 맞추는 것이 통일입니다.

   ── 진짜 <table> 에도 걸립니다 ─────────────────────────────────────────────
   원본은 grid 로 짠 div 이지만 이 CSS 는 \`table/th/td\` 에도 같은 값을 겁니다.
   마크업을 통째로 바꾸면 열 너비 · colspan · 정렬이 다 흔들립니다.

       <table class="qd-table">
         <thead><tr><th>기업명</th>…</tr></thead>
         <tbody><tr><td>…</td></tr></tbody>
       </table>

   ── 색 잇기 ────────────────────────────────────────────────────────────────
   \`q-design.nav.css\` 와 같은 \`--qd-*\` 를 읽습니다. 그쪽에 잇는 줄을 이미
   두었으면 여기서 더 할 일이 없습니다. 두 개만 더 씁니다: \`--qd-bg-src\` ·
   \`--qd-borderHi-src\`.

   ── 한글 자간 ──────────────────────────────────────────────────────────────
   표 머리글과 배지는 모노 · 대문자 · 넓은 자간입니다. 한글이 섞이면
   \`data-hangul\` 을 붙이세요. 자간과 대문자가 함께 풀립니다.
   ============================================================================= */

:root {
${bind('dark')}

  /* 모서리는 테마 축이 «아니라» 사다리입니다. 그래서 light 블록에는 안 넣습니다.
     값은 Q-Atelier lib/design/tokens.ts 의 RADIUS 에서 옵니다.
     각진 모서리를 브랜드로 쓰는 쪽은 \`--qd-radius-control-src: 0\` 한 줄이면 됩니다. */
  --qd-radius-control: var(--qd-radius-control-src, ${px(spec.control.radius)});
}

html[data-theme='light'] {
${bind('light')}
}

/* ── 판 ────────────────────────────────────────────────────────────────────
   목록은 캔버스 위에 맨몸으로 놓이지 않고 **판 하나 안에** 들어갑니다.
   판이 없으면 표의 첫 줄과 마지막 줄이 어디서 시작하고 끝나는지 흐려집니다.

   모서리는 «맥락을 읽습니다». 각진 모서리를 브랜드로 쓰는 자매 테마가 있어서,
   그쪽은 \`--qd-radius-card: 0\` 한 줄로 자기 언어를 말합니다. 값을 두 벌로 두지
   않고 폴백으로 처리한 저쪽 설계를 그대로 옮겼습니다. */
.qd-panel {
  box-sizing: border-box;
  background: var(--qd-surface);
  border: 1px solid var(--qd-border);
  border-radius: var(--qd-radius-card, ${px(spec.row.radius)});
}
/* 왼쪽 색 띠로 «이 판이 무엇인가» 를 말할 때 */
.qd-panel--accent { border-left: 3px solid var(--qd-panel-accent, var(--qd-accent)); }

/* 상태 판. 색«만»으로 가르지 않고 왼쪽 3px 세로줄을 함께 줍니다.
   다크 판 위에서 주의색과 액센트(금)의 색차 ΔE76 이 10.37 밖에 안 됩니다 ·
   성공(40.94)·막힘(32.84)은 색만으로 갈리지만 주의는 안 갈립니다.
   그 간격을 «형태» 로 메웁니다. 액센트 판에는 이 세로줄을 주지 않습니다.

   🔑 ok·warn 은 q-design.state.css 가 내는데 그 파일을 «모든» 제품이 받지는
      않습니다(Q-Forge 는 자기 이름을 이미 갖고 있어 안 받습니다). 값을 못 찾으면
      border-left 가 통째로 무효가 되어 «조용히 세로줄만 사라집니다» · 그래서
      이 파일이 스스로 값을 들고 있습니다(extract-nav 의 Z 사다리와 같은 이유). */
.qd-panel--ok { border-left: 3px solid var(--qd-ok, var(--qa-green, ${tokens.color.dark['--qa-green']})); }
.qd-panel--warn { border-left: 3px solid var(--qd-warn, var(--qa-warning, ${tokens.color.dark['--qa-warning']})); }
.qd-panel--danger { border-left: 3px solid var(--qd-danger); }
/* 표가 아니라 글이 들어가는 판 */
.qd-panel--pad { padding: ${px(spec.panel.padding)}; }
/* 판 안에 표가 꽉 차게 들어갈 때, 표의 모서리가 판 밖으로 삐져나오지 않게 */
.qd-panel > .qd-table-scroll:first-child,
.qd-panel > .qd-table:first-child { border-top-left-radius: inherit; border-top-right-radius: inherit; }
.qd-panel > .qd-table-scroll:last-child,
.qd-panel > .qd-table:last-child { border-bottom-left-radius: inherit; border-bottom-right-radius: inherit; overflow: hidden; }

/* ── 표 ────────────────────────────────────────────────────────────────────
   수백 줄을 세로로 훑는 자리입니다. 행 사이를 벌리지 않고 경계선 하나로 가릅니다.
   가로 스크롤은 감싸개(.qd-table-scroll)가 맡습니다. */
.qd-table-scroll {
  overflow-x: auto;
  overscroll-behavior-x: contain;
}

/* ── 따라오는 머리글 ──────────────────────────────────────────────────────
   백 줄을 세로로 훑으면 머리글이 화면 밖으로 나가고, 그때부터 셋째 칸이 무엇인지
   모르고 읽습니다.

   🔴 position: sticky 는 «세로 한계가 있는 조상» 이 있어야 붙습니다.
      Q-Forge 는 이 한계 없이 thead .th { position: sticky } 를 걸어 두어
      **한 번도 안 붙었습니다**(실측 감싸개 294/294 · 그쪽 감사 #8).
      그래서 한계를 주는 --tall 을 함께 냅니다. 제품이 자기 한계(max-h-*)를
      이미 갖고 있으면 --sticky 만 걸면 됩니다.

   ⚠️ 스크롤 host 가 감싸개가 아니라 화면 전체인 제품도 있습니다
      (Q-Atelier 는 <main> 이 host · 실측 1927/900). 그쪽은 감싸개 없이도
      붙으므로 --tall 을 걸지 않습니다.
--------------------------------------------------------------------------- */
.qd-table-scroll--tall {
  max-height: 70vh;
  overflow-y: auto;
}
.qd-table--sticky thead th,
.qd-table--sticky .qd-thead .qd-th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--qd-surface);
}
.qd-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  color: var(--qd-text);
}

.qd-table thead tr,
.qd-table .qd-thead {
  border-bottom: 1px solid var(--qd-border);
}
.qd-table th,
.qd-table .qd-th {
  padding: ${px(spec.table.padY + 1)} ${px(spec.table.padX)};
  font-family: var(--qd-font-mono);
  font-size: ${px(spec.table.headFontSize)};
  font-weight: ${spec.table.headWeight};
  letter-spacing: ${spec.table.headTracking};
  text-transform: uppercase;
  color: var(--qd-subtle);
  white-space: nowrap;
  vertical-align: middle;
}
.qd-table th[data-hangul],
.qd-table .qd-th[data-hangul] {
  letter-spacing: 0;
  text-transform: none;
  word-spacing: var(--qd-hangul-word-space);
}
/*
 * 머리글이 «거의 다» 한글인 제품을 위한 갈래.
 *
 * 머리글마다 data-hangul 을 붙이는 것이 원칙이지만, 표를 400곳 넘게 손으로 짠
 * 저장소에서는 언젠가 한 곳이 빠지고 그 한 곳만 「로 트 번 호」 로 벌어집니다.
 * 표에 이 클래스를 걸면 기본이 뒤집히고, 섞여 있는 라틴 머리글만 data-latin 을
 * 답니다. 「많은 쪽을 기본으로」 두면 빠뜨려도 조용히 틀리지 않습니다.
 */
.qd-table--hangul th,
.qd-table--hangul .qd-th {
  letter-spacing: 0;
  text-transform: none;
  word-spacing: var(--qd-hangul-word-space);
}
/* 🔴 되돌리는 갈래도 공백을 함께 되돌립니다. 안 그러면 통째로 뒤집은 표에서
   라틴 머리글만 조여집니다. 특정도가 같고(0,2,1) 뒤에 오므로 이깁니다. */
.qd-table--hangul th[data-latin],
.qd-table--hangul .qd-th[data-latin] {
  letter-spacing: ${spec.table.headTracking};
  text-transform: uppercase;
  word-spacing: normal;
}

.qd-table tbody tr,
.qd-table .qd-tr {
  border-bottom: 1px solid var(--qd-border);
  transition: background ${spec.table.transition};
  color: inherit;
  text-decoration: none;
}
.qd-table tbody tr:last-child,
.qd-table .qd-tr:last-child {
  border-bottom: none;
}
/* 누를 수 있는 행만 반응합니다. 전부 반응하면 어디가 링크인지 알 수 없습니다.
   «누를 수 있다» 를 알아보는 길이 셋입니다 - 안에 링크·단추가 있거나,
   행 자체가 role="link" 이거나(tr 은 a 로 감쌀 수 없습니다), 클래스를 붙였거나. */
.qd-table tbody tr:hover:has(a, button),
.qd-table tbody tr[role='link']:hover,
.qd-table a.qd-tr:hover,
.qd-table .qd-tr--click:hover {
  background: var(--qd-surface2);
}
.qd-table tbody tr[role='link'] { cursor: pointer; }

.qd-table td,
.qd-table .qd-td {
  padding: ${px(spec.table.padY)} ${px(spec.table.padX)};
  font-size: ${px(spec.table.cellFontSize)};
  color: var(--qd-text);
  vertical-align: middle;
}
/* 숫자는 자리가 고정입니다. 세로로 훑을 때 자릿수가 흔들리면 못 읽습니다. */
.qd-table .qd-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.qd-table .qd-quiet { color: var(--qd-subtle); }
/* 강조 칸. 코드·식별자처럼 «이 칸이 이 줄의 열쇠» 인 자리에 씁니다.
   🔴 이 장치가 없으면 제품이 칸에 유틸리티(text-gold 같은)를 적는데, 정본은
   레이어 밖이라 그것이 안 먹습니다. «적혀 있는데 화면은 그대로» 가 됩니다.
   실제로 Q-Sonar 에서 그런 자리가 78개 있었습니다. 정본이 잡는 속성은
   정본이 장치를 함께 줘야 합니다. */
.qd-table .qd-accent { color: var(--qd-accent); }

.qd-table--dense th,
.qd-table--dense .qd-th { padding: ${px(spec.table.padYDense + 1)} ${px(spec.table.padX)}; }
.qd-table--dense td,
.qd-table--dense .qd-td { padding: ${px(spec.table.padYDense)} ${px(spec.table.padX)}; }

/* 빈 목록. 「없음」 을 조용히 말합니다 */
.qd-table-empty {
  padding: 20px ${px(spec.table.padX)};
  font-family: var(--qd-font-mono);
  font-size: 12px;
  color: var(--qd-muted);
}
/*
 * 못 읽은 자리. 「없음」(.qd-table-empty)과 **반드시 달라 보여야** 합니다.
 *
 * 비었다는 말은 사실이고, 못 읽었다는 말은 «모른다» 입니다. 정본에 이 자리가
 * 없으면 제품이 실패를 없음으로 그릴 수밖에 없고, 사람은 「아직 담긴 기업이
 * 없습니다」 를 보고 정말 없다고 믿습니다. 실제로 그렇게 그려지는 자리가
 * Q-Sonar 에 43곳 있었습니다 (2026-09-09 감사).
 *
 * 원인 문자열은 code 로 함께 답니다. 원인을 버리면 고칠 수가 없습니다.
 */
.qd-state-error {
  padding: 14px ${px(spec.table.padX)};
  border-left: ${px(spec.row.accentWidth)} solid var(--qd-danger);
  background: var(--qd-surface);
  font-family: var(--qd-font-mono);
  font-size: 12px;
  line-height: 1.6;
  color: var(--qd-danger);
}
.qd-state-error code {
  display: block;
  margin-top: 4px;
  color: var(--qd-subtle);
  font-size: 11px;
  word-break: break-all;
}

/* ── 항목 카드 ─────────────────────────────────────────────────────────────
   왼쪽 ${spec.row.accentWidth}px 색 띠가 상태를 말합니다. 배지보다 조용하고 훑기가 빠릅니다. */
.qd-row {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: ${px(spec.row.gap * 4)};
  width: 100%;
  min-height: ${px(spec.row.minHeight)};
  padding: ${spec.row.padding};
  background: var(--qd-surface);
  border: 1px solid var(--qd-border);
  border-left: ${px(spec.row.accentWidth)} solid var(--qd-row-accent, var(--qd-accent));
  border-radius: ${px(spec.row.radius)};
  color: var(--qd-text);
  text-align: left;
  text-decoration: none;
  transition: background ${spec.row.transition}, ${spec.row.hoverTransition};
}
/* 누를 수 있는 카드만 떠오릅니다. 못 누르는 카드가 반응하면 거짓 어포던스입니다. */
a.qd-row, button.qd-row { cursor: pointer; }
a.qd-row:hover, button.qd-row:hover {
  transform: ${spec.row.hoverLift};
  border-color: ${spec.row.hoverBorder};
  box-shadow: ${spec.row.hoverShadow};
}
@media (prefers-reduced-motion: reduce) {
  a.qd-row:hover, button.qd-row:hover { transform: none; }
}
.qd-row + .qd-row { margin-top: 8px; }

.qd-row-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: ${px(spec.row.chipSize)};
  height: ${px(spec.row.chipSize)};
  border-radius: 9999px;
  background: color-mix(in srgb, var(--qd-row-accent, var(--qd-accent)) ${Math.round(spec.row.chipAlpha * 100)}%, transparent);
  color: var(--qd-row-accent, var(--qd-accent));
}
.qd-row-body { flex: 1; min-width: 0; }
.qd-row-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 3px;
  flex-wrap: wrap;
}
.qd-row-code {
  font-family: var(--qd-font-mono);
  font-size: ${px(spec.row.codeFontSize)};
  font-weight: ${spec.row.codeWeight};
  letter-spacing: ${spec.row.codeTracking};
  color: var(--qd-accent);
}
.qd-row-code[data-hangul] {
  letter-spacing: 0;
  word-spacing: var(--qd-hangul-word-space);
}
.qd-row-title {
  font-size: ${px(spec.row.titleFontSize)};
  font-weight: ${spec.row.titleWeight};
  color: var(--qd-text);
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}
.qd-row-meta {
  margin-top: 2px;
  font-size: ${px(spec.row.metaFontSize)};
  color: var(--qd-subtle);
  line-height: 1.4;
}
.qd-row-right { flex-shrink: 0; }
.qd-row-chevron {
  flex-shrink: 0;
  margin-left: 4px;
  color: var(--qd-muted);
  font-size: 18px;
  line-height: 1;
}

/* ── 배지 ──────────────────────────────────────────────────────────────────
   색은 \`--qd-tag-color\` 로 받습니다. 안 주면 muted 입니다.
   층은 셋: primary(채움) · secondary(헤어라인, 기본) · tertiary(아주 옅게) */
.qd-tag {
  --_c: var(--qd-tag-color, var(--qd-muted));
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  white-space: nowrap;
  font-family: var(--qd-font-mono);
  line-height: 1.4;
  letter-spacing: ${px(spec.tag.tracking)};
  color: var(--_c);
  background: transparent;
  border: 1px solid ${mix(spec.tag.secondaryBorder)};
  border-radius: ${px(spec.tag.radius)};
}
.qd-tag[data-hangul] {
  letter-spacing: 0;
  word-spacing: var(--qd-hangul-word-space);
}
${tagSize('xs', spec.tag.xs)}
${tagSize('sm', spec.tag.sm)}
${tagSize('md', spec.tag.md)}
.qd-tag--primary {
  background: ${mix(spec.tag.primaryBg)};
  border-color: ${mix(spec.tag.primaryBorder)};
}
.qd-tag--tertiary {
  border-color: ${mix(spec.tag.tertiaryBorder)};
  color: var(--qd-muted);
}
.qd-tag-dot {
  border-radius: 50%;
  background: var(--_c);
  flex-shrink: 0;
}

/* 배지에 걸 수 있는 상태색. 이름은 저쪽 상태색과 같습니다.
   ⚠️ 이 일곱은 대비 계약 밖입니다(Q-Design 02) · 배지 «면» 위 글자로만 쓰세요. */
${['gray', 'cobalt', 'copper', 'gold', 'violet', 'green', 'red']
  .map((n) => `.qd-tag--${n} { --qd-tag-color: var(--qa-state-${n}, ${tokens.color.dark[`--qa-state-${n}`]}); }`)
  .join('\n')}

@media print {
  .qd-row { break-inside: avoid; }
  .qd-table tbody tr { break-inside: avoid; }
}
`;

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'q-design.list.css'), css, 'utf8');
writeFileSync(
  join(OUT, 'q-design.list.json'),
  JSON.stringify(
    {
      $meta: {
        generatedBy: 'tools/extract-list.mjs',
        source: 'source/components/components.tsx + source/tokens/tag-metrics.ts + source/css/globals.css',
        note: '손으로 고치지 마세요. 원본을 고치고 다시 돌리세요.',
      },
      ...spec,
    },
    null,
    2,
  ) + '\n',
  'utf8',
);

console.log(`dist/q-design.list.css   ${css.split('\n').length} 줄`);
console.log(`dist/q-design.list.json  치수 ${flat(spec).length} 개`);
console.log('');
console.log(`  표      셀 ${spec.table.padY}px ${spec.table.padX}px · 머리글 mono ${spec.table.headFontSize} · 본문 ${spec.table.cellFontSize}`);
console.log(`  카드    ${spec.row.padding} · 최소높이 ${spec.row.minHeight} · 왼쪽 띠 ${spec.row.accentWidth}px · 모서리 ${spec.row.radius}`);
console.log(`  배지    xs ${spec.tag.xs.minH} · sm ${spec.tag.sm.minH} · md ${spec.tag.md.minH}`);
