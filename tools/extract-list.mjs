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
// `EntityRow`(괘선 줄 · 2026-09-27 전에는 카드), 수천 줄을 훑는 자리는 `DataTable`(표)입니다. 4만 개 회사와
// 55개 자재 로트를 전부 카드로 바꾸면 한 화면에 여섯 줄만 보입니다.
// **꼴을 통일하는 것이 아니라 «같은 꼴끼리» 맞춥니다.**
//
// ── 진짜 <table> 에도 걸립니다 ────────────────────────────────────────────────
// 저쪽 DataTable 은 grid 로 짠 div 인데, 두 제품은 진짜 `<table>` 을 씁니다.
// 마크업을 통째로 바꾸면 열 너비 · colspan · 정렬이 다 흔들립니다. 그래서
// `.qd-table` 은 `table/th/td` 와 `div` 양쪽에 같은 값을 겁니다.
// =============================================================================

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emit, emitDone, CHECK } from './emit.mjs';
import { read, slice, probeAll, put, flat, assertFilled, bindingsBlock, px } from './probe.mjs';
import { loadQdValues } from './qd-adapter-values.mjs';
import { readRuntimeValues } from './atelier-runtime-values.mjs';
import { centralTagMetrics } from './tag-metrics-probe.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const OUT = join(ROOT, 'dist');
const SRC = join(ROOT, 'source');

const comp = read(join(SRC, 'components', 'components.tsx'));
const globals = read(join(SRC, 'css', 'globals.css'));
const tagMetrics = readFileSync(join(SRC, 'tokens', 'tag-metrics.ts'), 'utf8');
const tokens = JSON.parse(read(join(OUT, 'q-design.tokens.json')));
const qd = loadQdValues(ROOT);
const canonicalComponents = read(join(ROOT, 'patterns', 'components.css'));
const live = {};
const cssPixels = text => qd.pixels(JSON.stringify(text));
const densityPixels = text => /^['"]/.test(text.trim()) ? qd.pixels(text.trim()) : Number(text);

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
  ['table.padY',        Z.tablePad,  /const padY = dense \? [^:;]+ : ([^;]+);/, densityPixels],
  ['table.padYDense',   Z.tablePad,  /const padY = dense \? ([^:;]+) : [^;]+;/, densityPixels],
  ['table.padX',        Z.tableCell, /(var\(--qd-table-pad-x, [\d.]+px\))/, cssPixels],
  ['table.headFontSize',Z.tableHead, /fontSize: FS\[(\d+)\],/, qd.font],
  ['table.headWeight',  Z.tableHead, /fontWeight: (\d+),/, Number],
  ['table.headTracking',Z.tableHead, /letterSpacing: labelTracking\(c\.header, '([\d.]+em)'\),/, String],
  ['table.cellFontSize',Z.tableCell, /fontSize: ('[^']+'|QD\.\w+|FS\[[\d.]+\]),/, qd.pixels],

  // ── 항목 줄 (EntityRow) ─────────────────────────────────────────────────
  // 2026-09-27 «문서 결»(오너 결정 · docs/08-paper.md): 상자 · 왼쪽 색 띠 대신 행 아래 가는 괘선 하나
  ['row.gap',           Z.rowBox,    /gap: S\[([\d.]+)\],/, qd.step],
  ['row.padding',       Z.rowBox,    /padding: '([^']+)',/, String],
  ['row.ruleWidth',     Z.rowBox,    /borderBottom: `(\d+)px solid \$\{T\.border\}`,/, Number],
  ['row.radius',        Z.rowBox,    /borderRadius: (\d+),/, Number],
  ['row.minHeight',     Z.rowBox,    /minHeight: (\d+),/, Number],
  ['row.chipSize',      Z.rowChip,   /width: (\d+),/, Number],
  ['row.chipAlpha',     Z.rowChip,   /background: alpha\(chipColor, ([\d.]+)\),/, Number],
  ['row.codeFontSize',  Z.rowCode,   /fontSize: FS\[(\d+)\],/, qd.font],
  ['row.codeWeight',    Z.rowCode,   /fontWeight: (\d+),/, Number],
  ['row.codeTracking',  Z.rowCode,   /letterSpacing: labelTracking\(code, '([\d.]+em)'\),/, String],
  ['row.titleFontSize', Z.rowTitleBox, /fontSize: FS\[(\d+)\],/, qd.font],
  ['row.titleWeight',   Z.rowTitleBox, /fontWeight: (\d+),/, Number],
  ['row.metaFontSize',  Z.rowMeta,   /fontSize: FS\[(\d+)\],/, qd.font],

  // ── 배지 (Tag) ──────────────────────────────────────────────────────────
  ['tag.tracking',      Z.tagBox,    /letterSpacing: labelTracking\(children, ([\d.]+)\),/, Number],
]);
// Both density variants retain their live source references. Older committed
// snapshots are accepted until their corresponding product change is committed.
const density = Z.tablePad.match(/const padY = dense \? ([^:;]+) : ([^;]+);/);
if (!density) throw new Error('DataTable 의 밀도별 세로 여백을 못 찾았습니다.');
const legacyPadY = Z.tableCell.match(/var\(--qd-table-pad-y, \$\{padY\}px\)/)?.[0];
live.tablePadY = /^['"]/.test(density[2].trim()) ? qd.css(density[2].trim()) : legacyPadY?.replace('${padY}', String(spec.table.padY));
live.tablePadYDense = /^['"]/.test(density[1].trim()) ? qd.css(density[1].trim()) : px(spec.table.padYDense);
if (!live.tablePadY) throw new Error('DataTable 의 중앙 세로 여백을 못 찾았습니다.');
live.tablePadX = Z.tableCell.match(/var\(--qd-table-pad-x, [\d.]+px\)/)[0];
live.tableSize = qd.css(qd.property(Z.tableCell, 'fontSize'));
put(spec, 'table.padY', cssPixels(live.tablePadY));

/* 판 안쪽 여백. `SectionCard` 가 `S[6]` 을 씁니다 (간격 사다리는 4의 배수). */
{
  const card = slice(comp, 'export function SectionCard({', 'export function DetailRow', 'SectionCard');
  const m = card.match(/padding: S\[(\d+)\],/);
  if (!m) throw new Error('SectionCard 의 여백을 못 찾았습니다.');
  put(spec, 'panel.padding', qd.space(m[1]));
}

/* 모서리·전환·그림자는 토큰에서 옵니다. 여기서 다시 재지 않습니다.
   판(.qd-panel)의 모서리입니다. 항목 줄은 2026-09-27 부터 모서리가 없어(괘선) 원본에서 따로 읽습니다. */
put(spec, 'panel.radius', qd.pixels('QD.radius'));

/*
 * 판의 상태 색 테두리(2026-09-27 «문서 결»). 원본 Bx 의 accent 가 왼쪽 3px 색 띠에서
 * «테두리 전체를 옅은 상태 색으로» 바뀌었습니다. 몇 % 섞는지는 원본 lib/design/grain.ts 의 GRAIN.tint
 * 한 곳에 있고(Bx · Alert · InfoBox · 화면들이 함께 부름), 여기서도 그 값을 읽습니다.
 * (tokens.ts 가 아닌 까닭: 그 파일은 원본의 요구사항 엔진 검증 근거가 지문을 듭니다.)
 */
{
  const grainTs = read(join(SRC, 'tokens', 'grain.ts'));
  const g = grainTs.match(/export const GRAIN = \{[\s\S]*?tint: ([\d.]+),/);
  if (!g) throw new Error('원본 grain.ts 의 GRAIN.tint 를 못 찾았습니다.');
  if (!/export const ruleBand = [\s\S]*?tintBorder\(color\)/.test(grainTs)) {
    throw new Error('원본 ruleBand 가 tintBorder(GRAIN.tint)를 거치지 않습니다. 두 비율이 갈립니다.');
  }
  const bx = slice(comp, 'export function Bx({', '// ─── DIVIDER', 'Bx');
  if (!/borderColor: tintBorder\(accentColor\)/.test(bx)) {
    throw new Error('Bx 의 상태 색 테두리(borderColor: tintBorder(accentColor))를 못 찾았습니다.');
  }
  if (/borderLeft/.test(bx)) throw new Error('Bx 에 왼쪽 선이 다시 생겼습니다. docs/08-paper.md 의 문서 결을 보세요.');
  /* 장부형 갈래(2026-10-23 «B»). 아래 .qd-panel 장부형 규칙 · .qd-empty 가 이 모양을 그대로 옮깁니다 */
  for (const [what, re] of [
    ['면 없음', /background: ledger \? 'transparent' : T\.surface,/],
    ['위아래 괘선만 · 표 밑바탕은 화면 바탕', /ledger \? \(\{ borderWidth: '1px 0', '--qd-table-fill': T\.bg \}/],
    ['모서리 없음', /borderRadius: ledger \? 0 :/],
  ]) {
    if (!re.test(bx)) throw new Error(`Bx 의 장부형 갈래가 바뀌었습니다: ${what}. 정본 .qd-panel 장부형 규칙을 다시 보세요.`);
  }
  put(spec, 'panel.accentMix', Number(g[1]));
}

/*
 * Alert now delegates its opaque surface and full outline to canonical qd-notice.
 * Read that visual recipe while preserving the error block's existing document layout.
 */
{
  const al = slice(comp, 'export function Alert({', '// ─── ', 'Alert');
  if (!/className="qd-notice"/.test(al) || !/data-kind=\{kind\}/.test(al)) throw new Error('Alert 의 중앙 notice 연결을 못 찾았습니다.');
  if (/borderLeft/.test(al)) throw new Error('Alert 에 왼쪽 선이 다시 생겼습니다. docs/08-paper.md 의 문서 결을 보세요.');
  const notice = slice(canonicalComponents, '.qd-notice, .qd-toast {', '}', 'canonicalNotice');
  const declarations = notice.split('\n').filter(line => /^\s*(?:box-sizing|padding|border|border-radius|background|color|font-size|line-height):/.test(line));
  if (declarations.length !== 8) throw new Error('중앙 notice 표면 선언이 바뀌었습니다. 탐침을 검토하십시오.');
  put(spec, 'state.surfaceDeclarations', declarations.join('\n'));
}
put(spec, 'tag.radius', qd.pixels(qd.property(Z.tagBox, 'borderRadius')));
/* 단추·입력의 모서리도 같은 사다리에서 옵니다(2026-09-09 감사 · 주제 #13).
   Q-Sonar 는 판이 10px 인데 그 안의 단추 191개·입력 12개가 전부 0px 이었습니다.
   10 이라는 숫자가 이미 세 벌(Q-Atelier tokens.ts · dist/q-design.tokens.json ·
   Q-Forge globals.css)이라 제품이 네 번째를 적지 않게 여기서 내보냅니다. */
put(spec, 'control.radius', qd.pixels('QD.radius'));
put(spec, 'row.transition', tokens.motion.fast);
put(spec, 'table.transition', tokens.motion.fast);

/* 배지 규격 세 벌. tag-metrics.ts 가 SSOT 이고 거기 테스트가 높이 사슬을 잠급니다. */
{
  if (/export const TAG_DIMS = QDPresentation\.visual\.tag\.dims;/.test(tagMetrics)) {
    const { dims } = centralTagMetrics(tagMetrics, readRuntimeValues(ROOT));
    for (const [size, { dotSize, ...dimensions }] of Object.entries(dims)) {
      put(spec, `tag.${size}`, { ...dimensions, dot: dotSize });
    }
  } else {
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
  }
  for (const s of ['xs', 'sm', 'md']) {
    if (!spec.tag[s]) throw new Error(`배지 규격 ${s} 를 못 읽었습니다.`);
    for (const [key, variable] of Object.entries({ minH: 'min-height', fs: 'size', padY: 'padding-y', padX: 'padding-x', dot: 'dot-size', gap: 'gap' })) {
      spec.tag[s][key] = qd.pixels(`'var(--qd-tag-${s}-${variable})'`);
    }
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
 * 줄 hover. 저쪽은 `.qa-row-clickable` 이 맡습니다(2026-09-27 «문서 결» 부터 · 종전 `.qa-card-lift` 는
 * 떠오르는 카드였습니다). 누를 수 있는 줄만 옅은 바탕으로 답합니다.
 */
{
  const base = slice(globals, '.qa-row-clickable {', '\n}', 'rowClickable');
  const hover = slice(globals, '.qa-row-clickable:hover {', '\n}', 'rowClickableHover');
  const t = base.match(/transition:\s*([^;]+);/);
  const bg = hover.match(/background-color:\s*([^;]+);/);
  if (!t || !bg) throw new Error('.qa-row-clickable 값을 못 찾았습니다.');
  /*
   * 저쪽 변수 이름(`--qa-*`)을 정본 이름(`--qd-*`)으로 바꿔 넣습니다.
   * 안 바꾸면 받는 제품에는 그 이름이 없어 **바탕이 통째로 사라집니다** ·
   * CSS 는 없는 변수를 에러로 만들지 않고 그냥 아무것도 안 그립니다.
   */
  const hoverBg = bg[1].trim().replace(/--qa-surface2\b/g, '--qd-surface2');
  if (/--qa-/.test(hoverBg)) throw new Error(`정본 이름으로 못 바꾼 원본 변수가 있습니다: ${hoverBg}`);
  put(spec, 'row.hoverTransition', t[1].trim());
  put(spec, 'row.hoverBackground', hoverBg);
}

/*
 * ── 빈 목록 · 쪽 이동 줄 · 거르개 띠 (2026-09-24 · docs/22 10절) ─────────────────
 * 네 제품을 원본과 나란히 찍었을 때 «정본에 자리가 없어» 제품마다 달랐던 곳입니다
 * (빈 목록: 점선 반투명 · 다음 할 일 줄 · 실선 판 / 쪽 이동: 테두리 판 · 선 아래 모노 글 /
 * 거르개: 제품마다 제각각). 오너 결정 「정본을 늘려 모두 맞추기」 로 원본
 * EmptyState · ListPager · ListToolbar 에서 읽습니다.
 */
{
  const pagerSrc = read(join(SRC, 'components', 'ListPager.tsx'));
  const barSrc = read(join(SRC, 'components', 'ListToolbar.tsx'));
  const empty = slice(comp, 'export function EmptyState({', '// ─── GRID', 'EmptyState');
  const Q = {
    /* 2026-09-25 원본이 한글 글에 자간 0 을 주려고 글을 받는 함수로 바뀌었다(476e8096) */
    pagerLabel: slice(pagerSrc, 'const label = (text: string): React.CSSProperties => ({', '});', 'ListPager.label'),
    pagerBtn: slice(pagerSrc, 'const btn = (enabled: boolean, text: string): React.CSSProperties => ({', '});', 'ListPager.btn'),
    pagerNav: slice(pagerSrc, 'aria-label="목록 페이지 이동"', 'flexWrap', 'ListPager.nav'),
    pagerPages: slice(pagerSrc, '{showNav && (', '<Link', 'ListPager.pages'),
    pagerPageNo: slice(pagerSrc, '<span style={{ ...label(쪽), minWidth', '}}>', 'ListPager.pageNo'),
    barOuter: slice(barSrc, 'className="qa-list-toolbar"', '<form', 'ListToolbar.outer'),
    barForm: slice(barSrc, 'method="get"', '{함께보낼것.map', 'ListToolbar.form'),
    barField: slice(barSrc, 'const 칸: React.CSSProperties = {', '};', 'ListToolbar.field'),
    barLabel: slice(barSrc, 'const 라벨 = (text: string): React.CSSProperties => ({', '});', 'ListToolbar.label'),
    barSearch: slice(barSrc, "<span style={{ position: 'relative'", '<input', 'ListToolbar.search'),
    /* 2026-10-20(Q-Atelier 85555d48) 원본이 손수 짠 정렬 고르기를 공용 Sel(sm)로 걷었다. 가로 여백은 Sel 의 작은 판에서 읽는다 */
    barSelect: slice(comp, 'export function Sel({', '</select>', 'Sel'),
    /* 2026-10-07(b3179fa8) 원본이 손수 짠 submit 단추를 공용 Btn(p={false} sm)으로 걷었다. 치수는 Btn 에서 읽는다 */
    barSubmit: slice(comp, 'export function Btn({', '// ─── ICON BUTTON', 'Btn'),
    barSubmitText: slice(barSrc, 'const 검색글 = ', ';', 'ListToolbar.submitText'),
    /* 원본의 전역 초점 고리. 정본의 새 조작부(탭 · 거르개 칸 · 이동 단추 · 표지)가 이 값을 받는다 */
    /* 🔴 선택자 목록 사이 주석에 `style={{ outline: 'none' }}` 이 있어 앞에서 자르면 거기서 끝난다.
       선언이 시작되는 마지막 선택자부터 자른다 */
    focus: slice(globals, "[tabindex]:focus-visible {", '}', 'globals.focus-visible'),
    emptyBox: slice(empty, 'padding: compact ?', 'textAlign', 'EmptyState.box'),
    /* 빛무리(backgroundImage radial-gradient)와 큰 장식 글리프(icon)는 원본이 2026-09-28(2081910f)에 걷었다
       (금지 목록: 배경 radial glow · 제목 위 장식). 정본도 같은 날짜 기준으로 두 구역을 뺀다. */
    emptyTitle: slice(empty, 'fontFamily: F.serif, fontWeight: 700,', '{title}', 'EmptyState.title'),
    emptyDesc: slice(empty, '{description && (', '{description}', 'EmptyState.desc'),
    emptyAction: slice(empty, '{action && <div', '{action}', 'EmptyState.action'),
    emptyHintRow: slice(empty, '{hints && hints.length > 0 && (', '{hints.map', 'EmptyState.hintRow'),
    emptyHint: slice(empty, 'const styles: React.CSSProperties = {', '};', 'EmptyState.hint'),
    emptyArrow: slice(empty, 'const content = (', '</span>\n              );', 'EmptyState.arrow'),
  };
  const S4 = (n) => Number(n) * 4; /* S[n] 는 4의 배수입니다 */
  const got = probeAll([
    // ── 쪽 이동 줄 (ListPager) ─────────────────────────────────────────────
    ['pager.gap',         Q.pagerNav,   /gap: S\[([\d.]+)\],/, qd.space],
    ['pager.gapAbove',    Q.pagerNav,   /marginTop: 위 \? 0 : S\[([\d.]+)\],/, qd.space],
    ['pager.padAbove',    Q.pagerNav,   /paddingTop: 위 \? 0 : S\[([\d.]+)\],/, qd.space],
    ['pager.labelSize',   Q.pagerLabel, /fontSize: FS\[(\d+)\],/, qd.font],
    ['pager.labelTracking', Q.pagerLabel, /letterSpacing: labelTracking\(text, ([\d.]+)\),/, Number],
    ['pager.navGap',      Q.pagerPages, /gap: S\[([\d.]+)\] \}\}>/, qd.space],
    ['pager.pageMinWidth', Q.pagerPageNo, /minWidth: (\d+),/, Number],
    ['pager.btnGap',      Q.pagerBtn,   /gap: S\[([\d.]+)\],/, qd.space],
    ['pager.btnPadding',  Q.pagerBtn,   /padding: '([^']+)',/, String],
    ['pager.btnMinHeight', Q.pagerBtn,  /minHeight: (QD\.\w+|\d+),/, qd.pixels],
    ['pager.btnSize',     Q.pagerBtn,   /fontSize: (QD\.\w+|FS\[[\d.]+\]),/, qd.pixels],
    ['pager.btnTracking', Q.pagerBtn,   /letterSpacing: labelTracking\(text, ([\d.]+)\),/, Number],
    ['pager.disabledOpacity', Q.pagerBtn, /opacity: enabled \? 1 : ([\d.]+),/, Number],
    // ── 거르개 띠 (ListToolbar) ─────────────────────────────────────────────
    ['bar.padTop',        Q.barOuter,   /paddingTop: S\[([\d.]+)\],/, qd.space],
    ['bar.padBottom',     Q.barOuter,   /paddingBottom: S\[([\d.]+)\],/, qd.space],
    ['bar.gapBelow',      Q.barOuter,   /marginBottom: S\[([\d.]+)\],/, qd.space],
    ['bar.gap',           Q.barForm,    /gap: S\[([\d.]+)\],/, qd.space],
    ['bar.fieldHeight',   Q.barField,   /height: (QD\.\w+|\d+),/, qd.pixels],
    ['bar.fieldPadX',     Q.barField,   /padding: `0 \$\{S\[([\d.]+)\]\}px 0 (?:var\(--qd-space-[\d-]+\)|\d+px)`,/, qd.space],
    ['bar.fieldPadIcon',  Q.barField,   /padding: `0 \$\{S\[[\d.]+\]\}px 0 (var\(--qd-space-[\d-]+\)|\d+px)`,/, cssPixels],
    ['bar.fieldSize',     Q.barField,   /fontSize: (QD\.\w+|FS\[[\d.]+\]),/, qd.pixels],
    ['bar.searchBasis',   Q.barSearch,  /flex: '1 1 (\d+)px'/, Number],
    ['bar.iconSize',      Q.barSearch,  /size=\{(\d+)\}/, Number],
    ['bar.iconLeft',      Q.barSearch,  /left: (\d+),/, Number],
    ['bar.selectPadX',    Q.barSelect,  /sm \? \{ minHeight: QD\.controlHeightSm, padding: `\$\{QD\.\w+\} \$\{(QD\.\w+)\}` \}/, qd.pixels],
    ['bar.submitHeight',  Q.barSubmit,  /const minHeight = sm \? (QD\.\w+) : QD\.\w+;/, qd.pixels],
    ['bar.submitPadX',    Q.barSubmit,  /padding: sm \? (QD\.\w+) :/, expression => {
      const padding = qd.resolve(expression).match(/^[\d.]+px ([\d.]+)px$/);
      if (!padding) throw new Error('Btn 의 작은 단추 여백이 두 축 px 표현이 아닙니다.');
      return Number(padding[1]);
    }],
    ['bar.submitSize',    Q.barSubmit,  /fontSize: (QD\.\w+),/, qd.pixels],
    ['bar.submitTracking', Q.barSubmit, /letterSpacing: labelTracking\(children, ([\d.]+)\),/, Number],
    ['bar.submitText',    Q.barSubmitText, /const 검색글 = '([^']+)'/, String],
    ['bar.labelSize',     Q.barLabel,   /fontSize: FS\[(\d+)\],/, qd.font],
    ['bar.labelTracking', Q.barLabel,   /letterSpacing: labelTracking\(text, ([\d.]+)\),/, Number],
    // ── 원본 전역 초점 고리 ────────────────────────────────────────────────
    ['focus.outline',     Q.focus,      /outline: (\d+)px solid var\(--qa-champagne\);/, Number],
    ['focus.offset',      Q.focus,      /outline-offset: (\d+)px;/, Number],
    ['focus.ring',        Q.focus,      /box-shadow: 0 0 0 (\d+)px color-mix/, Number],
    ['focus.ringMix',     Q.focus,      /var\(--qa-champagne\) (\d+)%, transparent\)/, Number],
    // ── 빈 목록 (EmptyState) ───────────────────────────────────────────────
    ['empty.paddingCompact', Q.emptyBox, /padding: compact \? '([^']+)' :/, String],
    ['empty.padding',     Q.emptyBox,   /padding: compact \? '[^']+' : '([^']+)',/, String],
    ['empty.titleSizeCompact', Q.emptyTitle, /fontSize: compact \? (\d+) :/, Number],
    ['empty.titleSize',   Q.emptyTitle, /fontSize: compact \? \d+ : (\d+),/, Number],
    ['empty.titleTracking', Q.emptyTitle, /letterSpacing: '(-?[\d.]+em)',/, String],
    ['empty.titleGapDesc', Q.emptyTitle, /marginBottom: description \? (\d+) :/, Number],
    ['empty.titleGapNext', Q.emptyTitle, /marginBottom: description \? \d+ : action \|\| hints \? (\d+) : 0,/, Number],
    ['empty.descSize',    Q.emptyDesc,  /fontSize: FS\[(\d+)\],/, qd.font],
    ['empty.descMax',     Q.emptyDesc,  /maxWidth: (\d+),/, Number],
    ['empty.descGapNext', Q.emptyDesc,  /margin: action \|\| hints \? '0 auto (\d+)px' : '0 auto',/, Number],
    ['empty.actionGapHints', Q.emptyAction, /marginBottom: hints \? (\d+) : 0/, Number],
    ['empty.hintsGap',    Q.emptyHintRow, /gap: S\[([\d.]+)\],/, qd.space],
    ['empty.hintsGapNoAction', Q.emptyHintRow, /marginTop: action \? 0 : (\d+),/, Number],
    ['empty.hintPadding', Q.emptyHint,  /padding: '([^']+)',/, String],
    ['empty.hintBorderAlpha', Q.emptyHint, /border: `1px solid \$\{alpha\(T\.champagne, ([\d.]+)\)\}`,/, Number],
    ['empty.hintSize',    Q.emptyHint,  /fontSize: FS\[(\d+)\],/, qd.font],
    ['empty.hintTracking', Q.emptyHint, /letterSpacing: labelTracking\(h\.label, ([\d.]+)\),/, Number],
    ['empty.hintArrowGap', Q.emptyArrow, /marginRight: S\[([\d.]+)\]/, qd.space],
  ]);
  Object.assign(spec, got);
  live.pagerHeight = qd.css(qd.property(Q.pagerBtn, 'minHeight'));
  live.pagerSize = qd.css(qd.property(Q.pagerBtn, 'fontSize'));
  live.fieldHeight = qd.css(qd.property(Q.barField, 'height'));
  live.fieldSize = qd.css(qd.property(Q.barField, 'fontSize'));
  live.fieldPadIcon = Q.barField.match(/padding: `0 \$\{S\[[\d.]+\]\}px 0 (var\(--qd-space-[\d-]+\)|\d+px)`,/)[1];
  live.submitHeight = qd.css(Q.barSubmit.match(/const minHeight = sm \? (QD\.\w+) :/)[1]);
  live.submitPadding = qd.css(Q.barSubmit.match(/padding: sm \? (QD\.\w+) :/)[1]);
  live.submitSize = qd.css(qd.property(Q.barSubmit, 'fontSize'));
  /* 원본이 말하는 색 · 글꼴이 정본 변수와 같은 뜻인지 봅니다. 다르면 이름을 잘못 잇게 됩니다 */
  for (const [what, zone, re] of [
    ['쪽 이동 줄 윗선 = border', Q.pagerNav, /borderTop: 위 \? undefined : `1px solid \$\{T\.border\}`,/],
    /* 2026-09-28(41d8b2eb) 고정폭 한글 걷기: 한글이 섞인 건수 글은 본문체, 숫자만이면 모노 */
    ['건수 글 = 한글은 본문체 · 숫자는 모노 · muted', Q.pagerLabel, /fontFamily: hasHangul\(text\) \? F\.ui : F\.mono,[\s\S]*color: T\.muted,/],
    ['이동 단추 = 조작 윤곽(QD.ctl) 테두리 · 투명 · text', Q.pagerBtn, /border: `1px solid \$\{QD\.ctl\}`,\s*background: 'transparent',\s*color: enabled \? T\.text : T\.muted,/],
    ['이동 단추 모서리 = QD.radius', Q.pagerBtn, /borderRadius: QD\.radius,/],
    ['거르개 띠 바탕 = bg', Q.barOuter, /background: T\.bg,/],
    ['거르개 칸 = surface 바탕 · 조작 윤곽(QD.ctl) 테두리 · QD.radius', Q.barField, /borderRadius: QD\.radius,\s*border: `1px solid \$\{QD\.ctl\}`,\s*background: T\.surface,/],
    ['거르개 단추 = 공용 Btn 보조(투명 · 조작 윤곽(QD.ctl) · subtle)', Q.barSubmit, /: `1px solid \$\{QD\.ctl\}`,[\s\S]*?p \? QD\.text : 'transparent',[\s\S]*?p \? QD\.bg : QD\.subtle,/],
    ['건수 글(도구줄) = 한글은 본문체 · 숫자는 모노 · muted', Q.barLabel, /fontFamily: hasHangul\(text\) \? F\.ui : F\.mono,[\s\S]*color: T\.muted,/],
    ['빈 목록 제목 = subtle', Q.emptyTitle, /color: T\.subtle,/],
    ['빈 목록 설명 = muted · LH.loose', Q.emptyDesc, /color: T\.muted,\s*lineHeight: LH\.loose,/],
    ['다음 할 일 표지 = champagne · 모노 · QD.radius', Q.emptyHint, /borderRadius: QD\.radius,[\s\S]*color: T\.champagne,[\s\S]*fontFamily: F\.mono,/],
  ]) {
    if (!re.test(zone)) throw new Error(`원본의 뜻이 바뀌었습니다: ${what}`);
  }
  /* 빈 목록은 장부형 Bx(판) 위에 섭니다: 면 없음 · 위아래 괘선 · 모서리 없음(2026-10-23 «B») */
  if (!/<Bx\s+ledger\s+className=\{`qd-empty\$\{compact \? ' qd-empty--compact' : ''\}`\}\s*\n\s*style=\{\{\s*\n\s*padding: compact \?/.test(empty)) {
    throw new Error('빈 목록이 더는 장부형 Bx 판 위에 서지 않습니다. 판 규칙을 다시 보세요.');
  }
  /* 두 건수 글(목록 아래 · 도구줄)은 한 모양이어야 합니다. 갈리면 사람이 두 셈을 못 믿습니다 */
  if (spec.pager.labelSize !== spec.bar.labelSize || spec.pager.labelTracking !== spec.bar.labelTracking) {
    throw new Error('쪽 이동 줄과 거르개 띠의 건수 글이 서로 다릅니다.');
  }
  /*
   * 본문 줄간격. 원본은 body 에 --qa-lh-relaxed(LH.relaxed)를 두고 줄간격을 안 적은 글이 모두
   * 물려받는다. 제품마다 바탕 줄간격이 1.5 · 1.6 · 1.7 로 달라 상속에 맡기면 1px 씩 갈렸다
   * (2026-09-25 세 제품 대조). 정본 글자리에 원본 값을 못 박는다.
   */
  {
    const bodyBlock = slice(globals, 'body {\n  background: var(--qa-bg);', '\n}', 'globals.body');
    if (!/line-height: var\(--qd-leading-relaxed, var\(--qa-lh-relaxed\)\);/.test(bodyBlock)) throw new Error('원본 본문 줄간격이 더는 --qa-lh-relaxed 가 아닙니다.');
    const relaxed = qd.leading('relaxed');
    if (typeof relaxed !== 'number') throw new Error('LH.relaxed 를 토큰에서 못 읽었습니다.');
    put(spec, 'body.lineHeight', relaxed);
  }
  /* 설명 줄간격(LH.loose)과 붙어 따라오는 층(Z.sticky)은 토큰에서 옵니다. 없으면 멈춥니다 */
  const loose = qd.leading('loose');
  if (typeof loose !== 'number') throw new Error('LH.loose 를 토큰에서 못 읽었습니다.');
  put(spec, 'empty.lineHeight', loose);
  if (typeof tokens.z.sticky !== 'number') throw new Error('Z.sticky 를 토큰에서 못 읽었습니다.');
  put(spec, 'bar.z', tokens.z.sticky);
}

assertFilled(spec);
if (!/^\d+(?:\.\d+)?px \d+(?:\.\d+)?px$/.test(spec.row.padding)) throw new Error(`항목 줄 여백이 두 CSS 길이가 아닙니다: ${spec.row.padding}`);
if (spec.table.padX <= 0) throw new Error(`셀 좌우 여백은 양수여야 합니다: ${spec.table.padX}`);

// ── CSS ──────────────────────────────────────────────────────────────────────
const BINDINGS = [
  ['bg', 'bg'],
  ['surface', 'surface'],
  ['surface2', 'surface2'],
  ['border', 'border'],
  ['borderHi', 'borderHi'],
  ['ctl', 'ctl'],
  ['text', 'text'],
  ['subtle', 'subtle'],
  ['muted', 'muted'],
  ['accent', 'champagne'],
];
const bind = (mode) => bindingsBlock(tokens.color, mode, BINDINGS);
const mix = (pct) => `color-mix(in srgb, var(--_c) ${Math.round(pct * 100)}%, transparent)`;

const tagSize = (name, d) => `
.qd-tag--${name} {
  min-height: var(--qd-tag-${name}-min-height, ${px(d.minH)});
  font-size: var(--qd-tag-${name}-size, ${d.fs}px);
  padding: var(--qd-tag-${name}-padding-y, ${d.padY}px) var(--qd-tag-${name}-padding-x, ${d.padX}px);
  gap: var(--qd-tag-${name}-gap, ${px(d.gap)});
}
.qd-tag--${name} .qd-tag-dot { width: var(--qd-tag-${name}-dot-size, ${px(d.dot)}); height: var(--qd-tag-${name}-dot-size, ${px(d.dot)}); }`;

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
  --qd-radius-control: var(--qd-radius-control-src, ${qd.css('QD.radius')});
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
  border-radius: var(--qd-radius-card, ${qd.css('QD.radius')});
}
/* 표 상자 · 빈 칸 판은 장부형입니다(2026-10-23 오너 결정 «B» · docs/08-paper.md).
   면 · 옆 선 · 모서리를 걷고 위아래 괘선만 남깁니다. 떠 있는 섬이 화면을 조각내지 않게,
   목록이 문서의 한 단락처럼 화면 바탕 위에 놓입니다(원본 Bx 의 ledger 갈래와 같은 모양).

   «표나 빈 칸을 바로 담은 판» 만 해당합니다. 글 · 입력 · 경고를 담은 판은 그대로 판입니다.
   카르네는 서식 · 잠금 창 · 경고 상자에도 .qd-panel 을 써서, 기본값을 통째로 바꾸면 그쪽까지 줄만 남습니다.
   짜임이 달라 판별이 안 되는 자리는 --ledger 를 직접 겁니다.

   면이 없으니 표의 따라오는 머리글 · 고정 칸이 덮을 바탕(--qd-table-fill)은 화면 바탕입니다. */
.qd-panel:has(> .qd-table-scroll, > .qd-table, > .qd-empty),
.qd-panel.qd-table-scroll,
.qd-panel--ledger {
  --qd-table-fill: var(--qd-bg);
  background: transparent;
  border-width: 1px 0;
  border-radius: 0;
}
/* 상태 판 · 강조 판. 2026-09-27 «문서 결»(오너 결정 · docs/08-paper.md): 왼쪽 3px 세로줄을 걷고
   **테두리 전체를 옅은 상태 색**으로 칠합니다(원본 Bx 의 accent 와 같은 규칙 · ${Math.round(spec.panel.accentMix * 100)}%).

   🔴 색«만»으로 가르지 않습니다. 다크 판 위에서 주의색과 액센트(금)의 색차 ΔE76 이 10.37 밖에
      안 됩니다(성공 40.94 · 막힘 32.84 는 색만으로 갈립니다). 종전에는 그 간격을 세로줄로 메웠고,
      이제는 판 **안의 글자**(«주의» · «막힘» 같은 첫 낱말)가 메웁니다. 상태 판을 쓰는 쪽이 그 말을 둡니다.

   🔑 ok·warn 은 q-design.state.css 가 내는데 그 파일을 «모든» 제품이 받지는
      않습니다(Q-Forge 는 자기 이름을 이미 갖고 있어 안 받습니다). 값을 못 찾으면
      선언이 통째로 무효가 되어 «조용히 테두리 색만 사라집니다» · 그래서
      이 파일이 스스로 값을 들고 있습니다(extract-nav 의 Z 사다리와 같은 이유). */
.qd-panel--accent { border-color: color-mix(in srgb, var(--qd-panel-accent, var(--qd-accent)) ${Math.round(spec.panel.accentMix * 100)}%, transparent); }
.qd-panel--ok { border-color: color-mix(in srgb, var(--qd-ok, var(--qa-green, ${tokens.color.dark['--qa-green']})) ${Math.round(spec.panel.accentMix * 100)}%, transparent); }
.qd-panel--warn { border-color: color-mix(in srgb, var(--qd-warn, var(--qa-warning, ${tokens.color.dark['--qa-warning']})) ${Math.round(spec.panel.accentMix * 100)}%, transparent); }
.qd-panel--danger { border-color: color-mix(in srgb, var(--qd-danger) ${Math.round(spec.panel.accentMix * 100)}%, transparent); }
/* 표가 아니라 글이 들어가는 판 */
.qd-panel--pad { padding: ${px(spec.panel.padding)}; }
/* 판 안에 표가 꽉 차게 들어갈 때, 표의 모서리가 판 밖으로 삐져나오지 않게 */
.qd-panel > .qd-table-scroll:first-child,
.qd-panel > .qd-table:first-child { border-top-left-radius: inherit; border-top-right-radius: inherit; }
.qd-panel > .qd-table-scroll:last-child,
.qd-panel > .qd-table:last-child { border-bottom-left-radius: inherit; border-bottom-right-radius: inherit; }
/* 모서리를 자르는 것은 맨 표뿐입니다. 감싸개는 제 overflow-x: auto 로 이미 자기 모서리에서
   잘립니다. 🔴 감싸개까지 hidden 으로 덮었더니(선택자 무게가 .qd-table-scroll 보다 셉니다)
   판의 마지막 표가 가로로 안 밀렸습니다. 넓은 표의 오른쪽 칸이 보이지도 닿지도 않았습니다
   (2026-09-24 Q-Carnet 육안 대조 · /settings/users 실측 auto → hidden). */
.qd-panel > .qd-table:last-child { overflow: hidden; }

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
  max-height: var(--qd-table-scroll-max-height, 70vh);
  overflow-y: auto;
}
.qd-table--sticky thead th,
.qd-table--sticky .qd-thead .qd-th {
  position: sticky;
  top: 0;
  z-index: 1;
  /* 덮는 바탕은 표가 놓인 자리의 바탕입니다. 장부형 판(면 없음) 안이면 화면 바탕(.qd-panel 규칙이 줍니다) */
  background: var(--qd-table-fill, var(--qd-surface));
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
  padding: calc(${live.tablePadY} + 1px) ${live.tablePadX};
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
  padding: ${live.tablePadY} ${live.tablePadX};
  font-size: ${live.tableSize};
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
.qd-table--dense .qd-th { padding: calc(${live.tablePadYDense} + var(--qd-border-width, 1px)) ${live.tablePadX}; }
.qd-table--dense td,
.qd-table--dense .qd-td { padding: ${live.tablePadYDense} ${live.tablePadX}; }

/* 빈 목록. 「없음」 을 조용히 말합니다 */
.qd-table-empty {
  padding: 20px ${px(spec.table.padX)};
  font-family: var(--qd-font-mono);
  font-size: 12px;
  color: var(--qd-muted);
}
/* 표 «안» 의 빈 줄(td colspan)에 걸어도 같은 얼굴이어야 합니다. 표 칸 규칙(13px · text)이 더 무거워
   글꼴만 바뀌고 색은 오히려 밝아졌습니다(2026-09-25 Q-Sonar 실측). 칸 선택자보다 무겁게 겁니다. */
.qd-table td.qd-table-empty,
.qd-table .qd-td.qd-table-empty {
  padding: 20px ${px(spec.table.padX)};
  font-family: var(--qd-font-mono);
  font-size: 12px;
  color: var(--qd-muted);
}
/* 한글 글이면 모노 글꼴의 넓은 빈칸을 한글 낱말 간격으로 되돌립니다(이름표와 같은 한글 규칙) */
.qd-table-empty[data-hangul] { word-spacing: var(--qd-hangul-word-space); }
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
/* The error block receives the current canonical notice surface. Its code stays below the message. */
.qd-state-error {
  --qd-status: var(--qd-danger);
${spec.state.surfaceDeclarations}
  font-family: var(--qd-font-ui);
}
.qd-state-error code {
  display: block;
  margin-top: 4px;
  color: var(--qd-subtle);
  font-size: 12px; /* 보조 글씨 최소 12px (오너 결정 2026-09-27 · 원본 오류 코드 줄도 12) */
  word-break: break-all;
}

/* ── 빈 목록 ───────────────────────────────────────────────────────────────
   목록이 «통째로» 비었을 때 목록 자리를 대신합니다(원본 EmptyState). 판 하나 · 넉넉한
   여백 · 가운데 · 조용한 제목. 다음에 할 일이 있으면 단추(.qd-btn)나 금색 테두리 표지로 둡니다.
   .qd-table-empty 와 다릅니다. 그쪽은 표 «안» 의 한 줄(찾은 것 없음)입니다.
   🔴 대조에서 점선 반투명 · 다음 할 일 줄 · 실선 판(원본)으로 갈렸습니다.

     <div class="qd-empty">
       <div class="qd-empty-title">아직 등록된 부적합이 없습니다</div>
       <p class="qd-empty-desc">검사에서 벗어난 것이 나오면 여기에 쌓입니다.</p>
       <div class="qd-empty-actions"><a class="qd-btn qd-btn--primary" href="…">부적합 등록</a></div>
       <div class="qd-empty-hints"><a class="qd-empty-hint" data-hangul href="…">검사 기록 보기</a></div>
     </div>

   옆 판 · 대화상자처럼 좁은 자리는 .qd-empty--compact 입니다(여백 · 글자만 작아집니다).
   제목 아래 간격은 뒤따르는 것이 정합니다(원본과 같은 계산: 설명 ${px(spec.empty.titleGapDesc)} ·
   단추나 표지 ${px(spec.empty.titleGapNext)}). */
.qd-empty {
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  padding: ${spec.empty.padding};
  text-align: center;
  /* 빛무리(radial-gradient)와 장식 글리프(.qd-empty-icon)는 2026-09-28 원본에서 걷혔다.
     2026-10-23 오너 결정 «B»: 면 · 옆 선 · 모서리도 걷고 위아래 괘선만 남는다(원본 EmptyState 의 Bx ledger) */
  background-color: transparent;
  border: 1px solid var(--qd-border);
  border-width: 1px 0;
  border-radius: 0;
}
/* 판 안의 빈 칸은 겉 판이 이미 괘선을 그으므로 제 선을 내려놓습니다(겹줄 방지) */
.qd-panel > .qd-empty { border: 0; }
.qd-empty--compact {
  padding: ${spec.empty.paddingCompact};
}
.qd-empty-title {
  font-family: var(--qd-font-ui);
  font-size: ${px(spec.empty.titleSize)};
  font-weight: 700;
  /* 원본은 본문 줄간격(${spec.body.lineHeight})을 물려받습니다. 제품마다 바탕 줄간격이 달라 못 박습니다 */
  line-height: ${spec.body.lineHeight};
  letter-spacing: ${spec.empty.titleTracking};
  color: var(--qd-subtle);
}
.qd-empty--compact .qd-empty-title { font-size: ${px(spec.empty.titleSizeCompact)}; }
.qd-empty-desc {
  max-width: ${px(spec.empty.descMax)};
  margin: 0 auto;
  font-size: ${px(spec.empty.descSize)};
  line-height: ${spec.empty.lineHeight};
  color: var(--qd-muted);
}
.qd-empty-title + .qd-empty-desc { margin-top: ${px(spec.empty.titleGapDesc)}; }
.qd-empty-title + .qd-empty-actions { margin-top: ${px(spec.empty.titleGapNext)}; }
.qd-empty-title + .qd-empty-hints { margin-top: ${px(spec.empty.titleGapNext + spec.empty.hintsGapNoAction)}; }
.qd-empty-desc + .qd-empty-actions { margin-top: ${px(spec.empty.descGapNext)}; }
.qd-empty-desc + .qd-empty-hints { margin-top: ${px(spec.empty.descGapNext + spec.empty.hintsGapNoAction)}; }
.qd-empty-actions + .qd-empty-hints { margin-top: ${px(spec.empty.actionGapHints)}; }
.qd-empty-hints {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${px(spec.empty.hintsGap)};
}
.qd-empty-hint {
  padding: ${spec.empty.hintPadding};
  border: 1px solid color-mix(in srgb, var(--qd-accent) ${Math.round(spec.empty.hintBorderAlpha * 100)}%, transparent);
  border-radius: var(--qd-radius-control, ${px(tokens.radius.md)});
  background: transparent;
  color: var(--qd-accent);
  font-family: var(--qd-font-mono);
  font-size: ${px(spec.empty.hintSize)};
  line-height: ${spec.body.lineHeight};
  letter-spacing: ${px(spec.empty.hintTracking)};
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  transition: background ${tokens.motion.fast}, border-color ${tokens.motion.fast};
}
.qd-empty-hint[data-hangul] {
  letter-spacing: 0;
  text-transform: none;
  word-spacing: var(--qd-hangul-word-space);
}
.qd-empty-hint::before { content: '→'; margin-right: ${px(spec.empty.hintArrowGap)}; }

/* ── 쪽 이동 줄 ────────────────────────────────────────────────────────────
   목록 «아래» 를 닫는 줄입니다(원본 ListPager). 윗선 하나 · 왼쪽에 「1-20 / 총 57건」 ·
   오른쪽에 이전 · 쪽 번호 · 다음. 한 쪽에 다 들어오면 이동은 그리지 않고 건수만 둡니다.
   「내가 보는 것이 전부인가」 에 답이 없으면 목록을 믿을 수 없습니다.
   목록 «위» (거르개 띠 안)에 둘 때는 --top: 선과 건수를 빼고 오른쪽에 붙습니다.
   🔴 대조에서 테두리 판 · 선 아래 모노 글(원본)로 갈렸습니다.

     <nav class="qd-pager" aria-label="목록 페이지 이동">
       <span class="qd-pager-count">1-20 / 총 57건</span>
       <span class="qd-pager-nav">
         <a class="qd-pager-btn" href="?page=1" aria-disabled="true">이전</a>
         <span class="qd-pager-page">1 / 3</span>
         <a class="qd-pager-btn" href="?page=2">다음</a>
       </span>
     </nav>

   🔑 한글 단추(이전 · 다음)는 자간을 두지 않습니다. 라틴(PREV · NEXT)만 data-latin 을 붙여
      대문자 · ${px(spec.pager.btnTracking)} 를 받습니다(.qd-btn 과 같은 한글 규칙). 원본도 2026-09-25 부터
      같습니다(Q-Atelier 476e8096 · 전에는 한글에도 벌렸다). 찾기 단추 글은 원본을 따라 「${spec.bar.submitText}」 입니다. */
.qd-pager {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${px(spec.pager.gap)};
  margin-top: ${px(spec.pager.gapAbove)};
  padding-top: ${px(spec.pager.padAbove)};
  border-top: 1px solid var(--qd-border);
}
.qd-pager--top {
  justify-content: flex-end;
  margin-top: 0;
  padding-top: 0;
  border-top: 0;
}
.qd-pager-count,
.qd-pager-page {
  font-family: var(--qd-font-mono);
  font-size: ${px(spec.pager.labelSize)};
  line-height: 1;
  letter-spacing: ${px(spec.pager.labelTracking)};
  font-variant-numeric: tabular-nums;
  color: var(--qd-muted);
}
.qd-pager-page {
  min-width: ${px(spec.pager.pageMinWidth)};
  text-align: center;
}
/* 건수 글에 한글(총 · 건)이 들어가면 data-hangul 을 붙입니다. 숫자만이면 그대로 둡니다.
   원본(2026-09-28 고정폭 한글 걷기)은 한글이 섞이면 글꼴도 본문체로 바꿉니다 */
.qd-pager-count[data-hangul],
.qd-pager-page[data-hangul] {
  font-family: var(--qd-font-ui);
  letter-spacing: 0;
  word-spacing: var(--qd-hangul-word-space);
}
.qd-pager-nav {
  display: inline-flex;
  align-items: center;
  gap: ${px(spec.pager.navGap)};
}
.qd-pager-btn {
  display: inline-flex;
  align-items: center;
  gap: ${px(spec.pager.btnGap)};
  box-sizing: border-box;
  min-height: ${live.pagerHeight};
  padding: ${spec.pager.btnPadding};
  border: 1px solid var(--qd-ctl);
  border-radius: var(--qd-radius-control, ${px(tokens.radius.md)});
  background: transparent;
  color: var(--qd-text);
  font-family: var(--qd-font-ui);
  font-size: ${live.pagerSize};
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
}
.qd-pager-btn[data-latin] {
  letter-spacing: ${px(spec.pager.btnTracking)};
  text-transform: uppercase;
}
.qd-pager-btn[aria-disabled='true'],
.qd-pager-btn:disabled {
  color: var(--qd-muted);
  opacity: ${spec.pager.disabledOpacity};
  pointer-events: none;
}

/* ── 거르개 띠 ─────────────────────────────────────────────────────────────
   목록 «위» 에서 좁히는 줄입니다(원본 ListToolbar): 찾기 칸 · 정렬 · 찾기 단추 · 오른쪽
   끝에 건수. GET 폼으로 두면 JS 없이 돌고, 지금 좁혀 놓은 것이 주소창에 남습니다.
   좁혀 놓았으면 푸는 길(검색 지우기)이 화면에 있어야 합니다.
   🔴 대조에서 제품마다 모양이 달랐습니다(알약 고르개 · 제각각의 거르개).

     <div class="qd-filter-bar">
       <form class="qd-filter-row" method="get" action="/nc">
         <span class="qd-filter-search">
           <svg class="qd-filter-search-icon" aria-hidden="true">…</svg>
           <input class="qd-filter-input" type="search" name="q" placeholder="코드·제목 검색" aria-label="코드·제목 검색">
         </span>
         <select class="qd-filter-select" name="sort" aria-label="정렬">…</select>
         <button class="qd-filter-submit" type="submit">찾기</button>
         <a class="qd-filter-clear" href="/nc">검색 지우기</a>
         <span class="qd-filter-count">1-20 / 총 57건</span>
       </form>
       <nav class="qd-pager qd-pager--top">…</nav>
     </div>

   굴려도 따라오게 하려면 --sticky 와 --qd-sticky-top 을 줍니다. 원본은 머리띠 아래에 붙는데
   머리띠 높이가 제품마다 달라 그 값은 제품이 줍니다(없으면 0). 단추의 한글 규칙은 쪽 이동 줄과 같습니다. */
.qd-filter-bar {
  padding: ${px(spec.bar.padTop)} 0 ${px(spec.bar.padBottom)};
  margin-bottom: ${px(spec.bar.gapBelow)};
  background: var(--qd-bg);
}
.qd-filter-bar--sticky {
  position: sticky;
  top: var(--qd-sticky-top, 0px);
  z-index: var(--qd-z-sticky, ${spec.bar.z});
}
/* 낮은 화면(작은 폰 세로 · 폰 가로)에서는 따라오지 않습니다. 좁으면 띠가 여러 줄로 접혀
   머리띠와 함께 화면의 절반 넘게 덮었습니다(2026-10-23 실측: Q-Carnet 품목 320×568 에서 남는 높이 227px,
   Q-Maison 재고 이동 228px). 노트북 낮은 창(1280×600)은 띠가 한 줄이라 그대로 붙습니다. */
@media (max-height: 580px) {
  .qd-filter-bar--sticky { position: static; }
}
.qd-filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${px(spec.bar.gap)};
}
.qd-filter-search {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex: 1 1 ${px(spec.bar.searchBasis)};
}
.qd-filter-search-icon {
  position: absolute;
  left: ${px(spec.bar.iconLeft)};
  width: ${px(spec.bar.iconSize)};
  height: ${px(spec.bar.iconSize)};
  color: var(--qd-muted);
  pointer-events: none;
}
.qd-filter-input,
.qd-filter-select {
  box-sizing: border-box;
  height: ${live.fieldHeight};
  min-width: 0;
  padding: 0 ${px(spec.bar.selectPadX)};
  border: 1px solid var(--qd-ctl);
  border-radius: var(--qd-radius-control, ${px(tokens.radius.md)});
  background: var(--qd-surface);
  color: var(--qd-text);
  font-family: var(--qd-font-ui);
  font-size: ${live.fieldSize};
}
.qd-filter-input {
  flex: 1;
  padding: 0 ${px(spec.bar.fieldPadX)} 0 ${live.fieldPadIcon};
}
.qd-filter-select { flex: 0 0 auto; }
.qd-filter-submit {
  box-sizing: border-box;
  flex: 0 0 auto;
  min-height: ${live.submitHeight};
  padding: ${live.submitPadding};
  border: 1px solid var(--qd-ctl);
  border-radius: var(--qd-radius-control, ${px(tokens.radius.md)});
  background: transparent;
  /* 원본은 공용 Btn 보조 단추(2026-10-07)다: 글자는 subtle, 옆 여백 ${px(spec.bar.submitPadX)}(전에는 text · 16) */
  color: var(--qd-subtle);
  font-family: var(--qd-font-ui);
  font-size: ${live.submitSize};
  line-height: 1;
  cursor: pointer;
}
.qd-filter-submit[data-latin] {
  letter-spacing: ${px(spec.bar.submitTracking)};
  text-transform: uppercase;
}
.qd-filter-count,
.qd-filter-clear {
  flex: 0 0 auto;
  font-family: var(--qd-font-mono);
  font-size: ${px(spec.bar.labelSize)};
  line-height: 1;
  letter-spacing: ${px(spec.bar.labelTracking)};
  font-variant-numeric: tabular-nums;
  color: var(--qd-muted);
}
.qd-filter-count { margin-left: auto; }
.qd-filter-clear { text-decoration: underline; }
.qd-filter-count[data-hangul],
.qd-filter-clear[data-hangul] {
  font-family: var(--qd-font-ui);
  letter-spacing: 0;
  word-spacing: var(--qd-hangul-word-space);
}

/* ── 초점 고리 (목록 둘레 조작부) ──────────────────────────────────────────
   원본은 전역 :focus-visible 규칙이 단추 · 링크 · 입력칸 · 탭에 금색 외곽선과 옅은 고리를 겁니다.
   제품마다 그 규칙이 있다고 믿지 않고 정본 조작부에 같은 값을 둡니다(.qd-btn · .qd-input 과 같은 이유). */
.qd-pager-btn:focus-visible,
.qd-filter-submit:focus-visible,
.qd-filter-input:focus-visible,
.qd-filter-select:focus-visible,
.qd-filter-clear:focus-visible,
.qd-empty-hint:focus-visible {
  outline: ${px(spec.focus.outline)} solid var(--qd-accent);
  outline-offset: ${px(spec.focus.offset)};
  box-shadow: 0 0 0 ${px(spec.focus.ring)} color-mix(in srgb, var(--qd-accent) ${spec.focus.ringMix}%, transparent);
}

/* ── 항목 줄 ───────────────────────────────────────────────────────────────
   2026-09-27 «문서 결»(오너 결정 · docs/08-paper.md): 상자(바탕 · 테두리 · 둥근 모서리 · 떠오름)와 왼쪽 색 띠를
   걷고 **괘선 목록** 으로 섭니다. 행 아래 가는 선 하나, 상태는 배지 글자와 아이콘 칩 색이 말합니다.
   --qd-row-accent 는 아이콘 칩의 색으로만 씁니다. */
.qd-row {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: ${px(spec.row.gap * 4)};
  width: 100%;
  min-height: ${px(spec.row.minHeight)};
  padding: ${spec.row.padding};
  background: transparent;
  border: 0;
  border-bottom: ${px(spec.row.ruleWidth)} solid var(--qd-border);
  border-radius: ${px(spec.row.radius)};
  color: var(--qd-text);
  text-align: left;
  text-decoration: none;
  transition: ${spec.row.hoverTransition};
}
/* 누를 수 있는 줄만 옅은 바탕으로 답합니다. 못 누르는 줄이 반응하면 거짓 어포던스입니다. */
a.qd-row, button.qd-row { cursor: pointer; }
a.qd-row:hover, button.qd-row:hover { background-color: ${spec.row.hoverBackground}; }

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
  /* 원본 Tag 는 굵기를 적지 않고 둘레의 400 을 물려받아 그렇게 보입니다. 제목(700) 안에 놓이면
     배지까지 굵어져서(Q-Forge 배치 상세 · Q-Sonar 600) 물려받지 않게 원본이 «그려지는» 값을 적습니다 (2026-09-24) */
  font-weight: 400;
  line-height: 1.4;
  letter-spacing: ${px(spec.tag.tracking)};
  color: var(--_c);
  background: transparent;
  border: 1px solid ${mix(spec.tag.secondaryBorder)};
  border-radius: ${qd.css(qd.property(Z.tagBox, 'borderRadius'))};
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

  /* 따라오는 거르개 띠: 종이에는 스크롤이 없어 sticky 가 첫 장에만 남고 나머지 장에서 자리만
     차지합니다. 제자리로 돌리고, 찾기 폼(칸 · 단추 · 건수)은 종이에서 쓸 수 없으니 걷습니다.
     지금 무엇으로 좁혀 놓았는지는 주소가 말합니다(원본 globals.css 의 .qa-list-toolbar 인쇄 규칙과 같음).
     인쇄 정본(q-design.print.css)이 아니라 여기 두는 까닭: 목록 정본은 네 제품이 모두 불러 쓰지만
     인쇄 정본을 불러 쓰는 곳은 Q-Maison 하나뿐입니다(2026-09-25 운영 CSS 로 확인) */
  .qd-filter-bar { position: static !important; }
  .qd-filter-row { display: none !important; }
}
`;

/* 거르개 띠 인쇄 규칙은 원본이 그렇게 하기 때문에 둡니다. 원본이 바뀌면 여기서 멈춥니다 */
if (!/\.qa-list-toolbar \{ position: static; \}/.test(globals) || !/\.qa-list-toolbar form \{ display: none; \}/.test(globals)) {
  throw new Error('원본의 도구줄 인쇄 규칙(.qa-list-toolbar)이 바뀌었습니다. 목록 정본의 거르개 띠 인쇄 규칙을 다시 보세요.');
}

emit(join(OUT, 'q-design.list.css'), css);
emit(
  join(OUT, 'q-design.list.json'),
  JSON.stringify(
    {
      $meta: {
        generatedBy: 'tools/extract-list.mjs',
        source: 'source/components/components.tsx + source/tokens/tag-metrics.ts + source/css/globals.css + source/components/ListPager.tsx + source/components/ListToolbar.tsx + source/tokens/q-design-contract.ts + patterns/components.css',
        note: '손으로 고치지 마세요. 원본을 고치고 다시 돌리세요.',
      },
      ...spec,
    },
    null,
    2,
  ) + '\n',
);

emitDone('목록');
if (CHECK) process.exit(process.exitCode ?? 0);

console.log(`dist/q-design.list.css   ${css.split('\n').length} 줄`);
console.log(`dist/q-design.list.json  치수 ${flat(spec).length} 개`);
console.log('');
console.log(`  표      셀 ${spec.table.padY}px ${spec.table.padX}px · 머리글 mono ${spec.table.headFontSize} · 본문 ${spec.table.cellFontSize}`);
console.log(`  줄      ${spec.row.padding} · 최소높이 ${spec.row.minHeight} · 괘선 ${spec.row.ruleWidth}px · 모서리 ${spec.row.radius} · 판 테두리 ${Math.round(spec.panel.accentMix * 100)}%`);
console.log(`  배지    xs ${spec.tag.xs.minH} · sm ${spec.tag.sm.minH} · md ${spec.tag.md.minH}`);
