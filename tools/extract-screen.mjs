// =============================================================================
// Q-Design 화면 뼈대 정본 추출기
// =============================================================================
//   node tools/extract-screen.mjs
//
// 산출물
//   dist/q-design.screen.json
//   dist/q-design.screen.css
//
// 여기 담기는 것은 «목록 위와 아래» 입니다.
//
//   .qd-kpi       요약 지표 카드. 목록 위에서 「지금 상태」를 숫자로 말합니다
//   .qd-grid-kpi  그 카드를 담는 반응형 격자
//   .qd-label     구역 이름표. 모노 · 작게 · muted
//   .qd-page-head 화면 머리. 금색 막대 · 부제 · 제목 · 하단선 (2026-09-24)
//   .qd-btn       단추. 주는 글자색 면(다크 상아 · 라이트 먹) · 보조는 테두리 (2026-09-24)
//   .qd-input     입력칸. 글 · 고르개 · 여러 줄 한 상자 · 모서리 10 (2026-09-24)
//   .qd-section-title 판 밖의 구역 이름. 금색 · 모노 (2026-09-24 · docs/22 10절)
//   .qd-field-label   입력칸 위 이름표. 모노 · subtle (같은 날)
//   .qd-tabs          화면 안을 가르는 탭 줄. 금색 밑줄 (같은 날)
//   .qd-shell-*   읽는 화면 820 · 쓰는 화면 720 으로 좁히고 가운데
//
// ── 폭이 왜 규격인가 ─────────────────────────────────────────────────────────
// 저쪽 화면을 재 보면 **상세는 820 · 폼은 720 으로 좁히고 가운데** 둡니다.
// 전체폭으로 펼치면 글줄이 120자를 넘어 읽는 눈이 줄을 잃습니다. 목록만 폭
// 제한이 없는데, 표와 행은 넓을수록 좋기 때문입니다.
// 「인상을 만드는 것」의 상당 부분이 이 규칙입니다 (Q-Design 11).
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
const tokensTs = read(join(SRC, 'tokens', 'tokens.ts'));
const tokens = JSON.parse(read(join(OUT, 'q-design.tokens.json')));

/* 부품 하나를 먼저 자르고 그 안에서 다시 자릅니다 (extract-list.mjs 와 같은 이유). */
const P = {
  kpi: slice(comp, 'export function KPI({', '// ─── ', 'KPI'),
  stat: slice(comp, 'export function Stat({', '/** Stat 을 담는', 'Stat'),
  statGrid: slice(comp, 'export function StatGrid({', 'export function DetailRow', 'StatGrid'),
};

const Z = {
  kpiBox: slice(P.kpi, "          padding: '18px 20px',", '<div', 'kpiBox'),
  kpiLabel: slice(P.kpi, '            fontSize: FS[12],\n            color: T.subtle,', '{label}', 'kpiLabel'),
  kpiValue: slice(P.kpi, '            fontFamily: F.serif,\n            fontWeight: 700,', '{displayedValue}', 'kpiValue'),
  kpiSub: slice(P.kpi, '            fontSize: FS[12],\n            color: T.muted,', '{sub ??', 'kpiSub'),
  statLabel: slice(P.stat, 'fontFamily: F.mono,', '{label}', 'statLabel'),
  statValue: slice(P.stat, '<div style={{ fontSize:', '</div>', 'statValue'),
  statGrid: P.statGrid,
};

const spec = probeAll([
  // ── KPI 카드 ────────────────────────────────────────────────────────────
  ['kpi.padding',     Z.kpiBox,   /padding: '([^']+)',/, String],
  ['kpi.minHeight',   Z.kpiBox,   /minHeight: (\d+),/, Number],
  ['kpi.labelSize',   Z.kpiLabel, /fontSize: FS\[(\d+)\],/, Number],
  ['kpi.labelWeight', Z.kpiLabel, /fontWeight: (\d+),/, Number],
  ['kpi.labelTracking', Z.kpiLabel, /letterSpacing: labelTracking\(label, ([\d.]+)\),/, Number],
  ['kpi.labelGapBelow', Z.kpiLabel, /marginBottom: S\[([\d.]+)\],/, Number],
  // 값 크기: 2026-09-15 부터 clamp(최소px, 칸폭 % cqw, 최대 FS). 최대가 종전의 36 이다
  ['kpi.valueMin',    Z.kpiValue, /fontSize: `clamp\((\d+)px, /, Number],
  ['kpi.valueFluid',  Z.kpiValue, /px, ([\d.]+)cqw, /, Number],
  ['kpi.valueSize',   Z.kpiValue, /cqw, \$\{FS\[(\d+)\]\}px\)`,/, Number],
  ['kpi.valueWeight', Z.kpiValue, /fontWeight: (\d+),/, Number],
  ['kpi.valueLine',   Z.kpiValue, /lineHeight: ([\d.]+),/, Number],
  ['kpi.valueTracking', Z.kpiValue, /letterSpacing: '(-?[\d.]+em)',/, String],
  ['kpi.subSize',     Z.kpiSub,   /fontSize: FS\[(\d+)\],/, Number],
  ['kpi.subGapAbove', Z.kpiSub,   /marginTop: S\[([\d.]+)\],/, Number],
  ['kpi.subMinHeight', Z.kpiSub,  /minHeight: (\d+),/, Number],

  // ── 작은 지표 (Stat) · KPI 의 조밀한 짝 ─────────────────────────────────
  ['stat.labelSize',  Z.statLabel, /fontSize: FS\[(\d+)\],/, Number],
  ['stat.labelTracking', Z.statLabel, /letterSpacing: labelTracking\(label, '([\d.]+em)'\),/, String],
  ['stat.labelGapBelow', Z.statLabel, /marginBottom: S\[([\d.]+)\],/, Number],
  ['stat.valueSize',  Z.statValue, /fontSize: FS\[(\d+)\],/, Number],
  ['stat.valueWeight', Z.statValue, /fontWeight: (\d+),/, Number],
  ['stat.gridMinCol', Z.statGrid, /minCol = (\d+)/, Number],
  ['stat.gridGap',    Z.statGrid, /gap: S\[([\d.]+)\],/, Number],
]);

/*
 * ── 화면 머리 · 단추 · 입력칸 (2026-09-24 · docs/22) ───────────────────────
 * 정본이 CSS 로 안 쥐던 세 자리입니다. 제품마다 손으로 만들어서 네 제품 감사에서
 * 제목 32 · 26 · 26 · 22.5px, 주 단추 상아색 · 금색, 입력칸 모서리 6 · 10 · 7.375 로
 * 갈렸습니다. 원본 부품(PageHd · Btn · In)과 원본 globals.css 의 클래스 규칙에서
 * 읽습니다. 값을 여기 적지 않습니다.
 */
const gcss = read(join(SRC, 'css', 'globals.css'));
const H = {
  pageHd: slice(comp, 'export function PageHd({', '// ─── CARD', 'PageHd'),
  btn: slice(comp, 'export function Btn({', '// ─── ICON BUTTON', 'Btn'),
  input: slice(comp, 'const inputStyle: CSSProperties = {', '};', 'inputStyle'),
  qaBtn: slice(gcss, '.qa-btn {', '}', 'qa-btn'),
  qaBtnHover: slice(gcss, '.qa-btn:hover:not(:disabled) {', '}', 'qa-btn:hover'),
  qaBtnFocus: slice(gcss, '.qa-btn:focus-visible:not(:disabled),', '}', 'qa-btn:focus'),
  qaInput: slice(gcss, '.qa-input {', '}', 'qa-input'),
  qaInputFocus: slice(gcss, '.qa-input:focus-visible {', '}', 'qa-input:focus'),
};
Object.assign(H, {
  hdOuter: slice(H.pageHd, 'return (', '<style', 'PageHd.outer'),
  hdCss: slice(H.pageHd, 'const responsiveCss = `', '`;', 'PageHd.css'),
  hdRow: slice(H.pageHd, 'className={`${headerClass}-row`}', '<div style={{ minWidth', 'PageHd.row'),
  hdBar: slice(H.pageHd, '{accent && (', '{sub && (', 'PageHd.bar'),
  hdSub: slice(H.pageHd, '{sub && (', '<h1', 'PageHd.sub'),
  hdTitle: slice(H.pageHd, '<h1', '</h1>', 'PageHd.title'),
  hdActions: slice(H.pageHd, 'className={`${headerClass}-actions`}', '{actions}', 'PageHd.actions'),
  hdRule: slice(H.pageHd, '<div style={{ marginTop:', '/>', 'PageHd.rule'),
});

Object.assign(spec, probeAll([
  // ── 화면 머리 (PageHd) · 막대 → 부제 → 제목 → 하단선 ───────────────────
  ['head.gapBelow',     H.hdOuter,   /marginBottom: S\[([\d.]+)\]/, Number],
  ['head.rowGap',       H.hdRow,     /gap: S\[([\d.]+)\],/, Number],
  ['head.actionsGap',   H.hdActions, /gap: S\[([\d.]+)\]/, Number],
  ['head.barWidth',     H.hdBar,     /width: (\d+),/, Number],
  ['head.barHeight',    H.hdBar,     /height: ([\d.]+),/, Number],
  ['head.barGapBelow',  H.hdBar,     /marginBottom: S\[([\d.]+)\],/, Number],
  ['head.subSize',      H.hdSub,     /fontSize: FS\[(\d+)\],/, Number],
  ['head.subTracking',  H.hdSub,     /letterSpacing: labelTracking\(sub, ([\d.]+)\),/, Number],
  ['head.subGapBelow',  H.hdSub,     /marginBottom: S\[([\d.]+)\],/, Number],
  ['head.titleMin',     H.hdCss,     /font-size:clamp\((\d+)px, /, Number],
  ['head.titleFluid',   H.hdCss,     /px, ([\d.]+)vw, /, Number],
  ['head.titleMax',     H.hdCss,     /vw, (\d+)px\)/, Number],
  ['head.stackBp',      H.hdCss,     /max-width:\$\{BP\.(\w+) - 1\}px/, String],
  ['head.titleWeight',  H.hdTitle,   /fontWeight: (\d+),/, Number],
  ['head.titleLine',    H.hdTitle,   /lineHeight: ([\d.]+),/, Number],
  ['head.titleTracking', H.hdTitle,  /letterSpacing: '(-?[\d.]+em)',/, String],
  ['head.ruleGapAbove', H.hdRule,    /marginTop: S\[([\d.]+)\],/, Number],

  // ── 단추 (Btn · .qa-btn) · 주(면) 와 보조(테두리) 가 같은 상자 ────────────
  ['btn.padding',       H.btn,       /padding: sm \? '[^']+' : '([^']+)',/, String],
  ['btn.paddingSm',     H.btn,       /padding: sm \? '([^']+)' :/, String],
  ['btn.minHeightSm',   H.btn,       /const minHeight = sm \? (\d+) : TOUCH\.min;/, Number],
  ['btn.fontSize',      H.btn,       /fontSize: sm \? FS\[\d+\] : FS\[(\d+)\],/, Number],
  ['btn.fontSizeSm',    H.btn,       /fontSize: sm \? FS\[(\d+)\] :/, Number],
  ['btn.tracking',      H.btn,       /letterSpacing: labelTracking\(children, ([\d.]+)\),/, Number],
  /* 2026-10-08 Btn pending(회전 표시) 안에도 gap 이 있어, 단추 자신의 gap(바로 뒤가 padding)만 잡는다 */
  ['btn.gap',           H.btn,       /gap: S\[([\d.]+)\],\n\s*padding: sm \?/, Number],
  ['btn.weight',        H.btn,       /fontWeight: (\d+),/, Number],
  ['btn.disabledOpacity', H.btn,     /opacity: disabled \? ([\d.]+) : 1,/, Number],
  ['btn.radius',        H.qaBtn,     /border-radius: (\d+)px;/, Number],
  ['btn.hoverOpacity',  H.qaBtnHover, /opacity: ([\d.]+);/, Number],
  ['btn.focusOutline',  H.qaBtnFocus, /outline: (\d+)px solid var\(--qa-champagne\);/, Number],
  ['btn.focusOffset',   H.qaBtnFocus, /outline-offset: (\d+)px;/, Number],
  ['btn.focusRing',     H.qaBtnFocus, /box-shadow: 0 0 0 (\d+)px color-mix/, Number],
  ['btn.focusRingMix',  H.qaBtnFocus, /var\(--qa-champagne\) (\d+)%, transparent\)/, Number],

  // ── 입력칸 (In · Sel · .qa-input) ─────────────────────────────────────────
  ['input.padding',     H.input,     /padding: '([^']+)',/, String],
  ['input.fontSize',    H.input,     /fontSize: FS\[(\d+)\],/, Number],
  ['input.radius',      H.qaInput,   /border-radius: (\d+)px;/, Number],
  ['input.focusRing',   H.qaInputFocus, /box-shadow: 0 0 0 (\d+)px color-mix/, Number],
  ['input.focusRingMix', H.qaInputFocus, /var\(--qa-champagne\) (\d+)%, transparent\)/, Number],
]));
{
  const m = tokensTs.match(/export const TOUCH = \{\s*min: (\d+),/);
  if (!m) throw new Error('TOUCH.min 을 못 찾았습니다.');
  put(spec, 'btn.minHeight', Number(m[1]));
  const bp = tokensTs.match(new RegExp(`export const BP = \\{[\\s\\S]*?\\b${spec.head.stackBp}: (\\d+),`));
  if (!bp) throw new Error(`BP.${spec.head.stackBp} 를 못 찾았습니다.`);
  put(spec, 'head.stackBelow', Number(bp[1]) - 1);
}
/* 원본이 말하는 색이 정본 변수와 같은 뜻인지 확인합니다. 다르면 이름을 잘못 잇게 됩니다 */
for (const [what, zone, re] of [
  ['주 단추 면 = 글자색', H.btn, /: p \? T\.text : 'transparent',/],
  ['주 단추 글자 = 바탕색', H.btn, /: p \? T\.bg : T\.subtle,/],
  ['보조 단추 테두리 = border', H.btn, /: `1px solid \$\{T\.border\}`,/],
  ['입력칸 바탕 = surface', H.input, /background: T\.surface,/],
  ['입력칸 테두리 = border', H.input, /border: `1px solid \$\{T\.border\}`,/],
  ['입력칸 초점 = champagne 테두리 · surface2 바탕', H.qaInputFocus, /border-color: var\(--qa-champagne\)[^;]*;\s*background-color: var\(--qa-surface2\);/],
  ['보조 단추 올림 = borderHi', gcss, /\.qa-btn-secondary:hover:not\(:disabled\) \{\s*border-color: var\(--qa-borderHi\);/],
]) {
  if (!re.test(zone)) throw new Error(`원본의 색 뜻이 바뀌었습니다: ${what}`);
}
/* 좁은 화면의 입력칸 글자 · 손가락 기기의 단추 높이 (원본 globals.css) */
{
  const narrow = slice(gcss, '@media (max-width: 1023px) {\n  .qa-input,', '}\n}', 'qa-input narrow');
  const m1 = narrow.match(/font-size: (\d+)px !important;/);
  if (!m1) throw new Error('좁은 화면 입력칸 글자 크기를 못 찾았습니다.');
  put(spec, 'input.fontSizeNarrow', Number(m1[1]));
  put(spec, 'input.narrowBelow', 1023);
  const touch = slice(gcss, '@media (hover: none) and (pointer: coarse) {\n  .qa-btn,', '}\n}', 'qa-btn touch');
  /* 2026-09-27 원본이 이 규칙에 !important 를 붙였다(인라인 style 에 져서 한 번도 안 걸리던 터치 44).
     같은 블록에 입력칸 · 작은 조작부의 44 도 들어와, 단추 규칙 하나를 짚어 읽는다 */
  const m2 = touch.match(/\.qa-btn-secondary \{\s*min-height: (\d+)px(?: !important)?;/);
  if (!m2 || Number(m2[1]) !== spec.btn.minHeight) throw new Error('손가락 기기 단추 높이가 TOUCH.min 과 다릅니다.');
}

/* 모서리는 RADIUS.md(10) 하나입니다 (docs/05 · 오너 결정 2026-09-24 「작은 조작부도 전부 10」) */
for (const [k, v] of [['단추', spec.btn.radius], ['입력칸', spec.input.radius]]) {
  if (v !== tokens.radius.md) throw new Error(`${k} 모서리 ${v} 가 RADIUS.md(${tokens.radius.md}) 와 다릅니다.`);
}

/* 셸 폭. tokens.ts 의 LAYOUT 이 SSOT 입니다. */
{
  const block = slice(tokensTs, 'export const LAYOUT = {', '} as const;', 'LAYOUT');
  for (const m of block.matchAll(/(\w+): (\d+),/g)) put(spec, `shell.${m[1]}`, Number(m[2]));
  for (const k of ['mobile', 'form', 'detail', 'wide']) {
    if (!spec.shell?.[k]) throw new Error(`셸 폭 ${k} 를 못 읽었습니다.`);
  }
}

/* 본문 여백. main-padding.ts 가 SSOT 입니다. */
{
  const mp = read(join(SRC, 'tokens', 'main-padding.ts'));
  const m = mp.match(/MAIN_PADDING: EdgePadding = \{ top: (\d+), right: (\d+), bottom: (\d+), left: (\d+) \}/);
  if (!m) throw new Error('MAIN_PADDING 을 못 찾았습니다.');
  put(spec, 'main.top', Number(m[1]));
  put(spec, 'main.right', Number(m[2]));
  put(spec, 'main.bottom', Number(m[3]));
  put(spec, 'main.left', Number(m[4]));
}

/*
 * KPI 격자는 «부르는 쪽» 이 정합니다. Grid 의 기본값(240 / 10)은 KPI 용이 아니라
 * 네 칸이 한 줄에 안 들어갑니다. 그래서 실제로 KPI 를 쓰는 화면 하나를
 * source/screens/ 에 두고 그 값을 읽습니다 - 문서에 적힌 숫자가 아니라
 * **화면이 쓰는 숫자** 가 정본입니다.
 */
{
  const audit = read(join(SRC, 'screens', 'audit-page.tsx'));
  /* 칸 수는 화면이 정합니다. 2026-09-27 화면 검토(A18)가 이 화면의 KPI 를 넷에서 둘로 줄였고(세지 못하는
     «종류» 칸을 뺐다) 칸 폭 · 간격(180 · 14)은 그대로라, 칸 수를 못 박지 않고 폭과 간격만 읽습니다. */
  const m = audit.match(/<Grid cols=\{\d+\} minCol=\{(\d+)\} gap=\{(\d+)\}/);
  if (!m) throw new Error('KPI 격자 값을 못 찾았습니다 (source/screens/audit-page.tsx).');
  put(spec, 'kpi.gridMinCol', Number(m[1]));
  put(spec, 'kpi.gridGap', Number(m[2]));
}

put(spec, 'panel.radius', tokens.radius.md);

/*
 * ── 2차 탭 · 구역 이름 · 칸 이름표 (2026-09-24 · docs/22 10절) ────────────────
 * 네 제품을 원본과 나란히 찍었을 때 «정본에 자리가 없어» 제품마다 달랐던 곳입니다
 * (탭: 알약 · 폴더 · 밑줄 / 구역 이름: 판 안 제목 · 14px 굵게 · 금색 모노 / 칸 이름표:
 * 산세리프 12 · 14 굵게 · 모노 10). 오너 결정 「정본을 늘려 모두 맞추기」 로 원본
 * PageTabs · SectionTitle · Lbl 에서 읽습니다.
 */
{
  const tabsSrc = read(join(SRC, 'components', 'PageTabs.tsx'));
  const Q = {
    tabsRow: slice(tabsSrc, '<div role="tablist"', '>', 'PageTabs.row'),
    tab: slice(tabsSrc, 'role="tab" aria-selected={on}', '}}>', 'PageTabs.tab'),
    section: slice(comp, 'export function SectionTitle({', '// ─── SECTION (', 'SectionTitle'),
    field: slice(comp, 'export function Lbl({', '// ─── INPUT', 'Lbl'),
  };
  const got = probeAll([
    ['tabs.gapBelow',   Q.tabsRow, /marginBottom: S\[([\d.]+)\]/, Number],
    ['tabs.padding',    Q.tab,     /padding: '([^']+)',/, String],
    ['tabs.barWidth',   Q.tab,     /borderBottom: on \? `(\d+)px solid \$\{T\.champagne\}`/, Number],
    ['tabs.fontSize',   Q.tab,     /fontSize: FS\[(\d+)\],/, Number],
    ['tabs.weightOn',   Q.tab,     /fontWeight: on \? (\d+) : \d+,/, Number],
    ['tabs.weightOff',  Q.tab,     /fontWeight: on \? \d+ : (\d+),/, Number],
    ['section.fontSize', Q.section, /fontSize: FS\[(\d+)\],/, Number],
    ['section.tracking', Q.section, /letterSpacing: labelTracking\(children, ([\d.]+)\),/, Number],
    ['section.gapBelow', Q.section, /marginBottom: noMargin \? 0 : (\d+),/, Number],
    ['section.weight',   Q.section, /fontWeight: (\d+),/, Number],
    ['field.fontSize',  Q.field,   /fontSize: FS\[(\d+)\],/, Number],
    ['field.tracking',  Q.field,   /letterSpacing: labelTracking\(children, ([\d.]+)\),/, Number],
    ['field.gapBelow',  Q.field,   /marginBottom: (\d+),/, Number],
    ['field.weight',    Q.field,   /fontWeight: (\d+),/, Number],
  ]);
  Object.assign(spec, got);
  /*
   * 줄 높이와 초점 고리 (2026-09-25 다듬기).
   * 원본은 이 셋이 줄간격을 안 적고 본문 줄간격(--qa-lh-relaxed)을 물려받는다. 제품마다 바탕
   * 줄간격이 1.5 · 1.6 · 1.7 로 달라 탭 높이 46 ~ 48 · 이름표 15 ~ 17 로 갈렸다. 원본 값을 못 박는다.
   * 탭의 초점은 원본 전역 규칙([role='tab']:focus-visible)이 준다. 같은 값을 정본에 둔다.
   */
  {
    const bodyBlock = slice(gcss, 'body {\n  background: var(--qa-bg);', '\n}', 'globals.body');
    if (!/line-height: var\(--qa-lh-relaxed\);/.test(bodyBlock)) throw new Error('원본 본문 줄간격이 더는 --qa-lh-relaxed 가 아닙니다.');
    const relaxed = tokens.typography.lineHeight.relaxed;
    if (typeof relaxed !== 'number') throw new Error('LH.relaxed 를 토큰에서 못 읽었습니다.');
    put(spec, 'body.lineHeight', relaxed);
    /* 🔴 선택자 목록 사이 주석에 `}}` 가 있어 앞에서 자르면 거기서 끝난다. 선언 직전 선택자부터 자른다 */
    const focus = slice(gcss, "[tabindex]:focus-visible {", '}', 'globals.focus-visible');
    if (!/\[role='tab'\]:focus-visible,/.test(slice(gcss, 'button:focus-visible:not(:disabled),', "[tabindex]:focus-visible {", 'globals.focus-list'))) {
      throw new Error('원본 전역 초점 규칙이 더는 탭을 덮지 않습니다.');
    }
    Object.assign(spec, probeAll([
      ['focus.outline', focus, /outline: (\d+)px solid var\(--qa-champagne\);/, Number],
      ['focus.offset',  focus, /outline-offset: (\d+)px;/, Number],
      ['focus.ring',    focus, /box-shadow: 0 0 0 (\d+)px color-mix/, Number],
      ['focus.ringMix', focus, /var\(--qa-champagne\) (\d+)%, transparent\)/, Number],
    ]));
  }
  /* 원본이 말하는 색 · 글꼴이 정본 변수와 같은 뜻인지 봅니다. 다르면 이름을 잘못 잇게 됩니다 */
  for (const [what, zone, re] of [
    ['탭 줄 밑선 = border', Q.tabsRow, /borderBottom: `1px solid \$\{T\.border\}`/],
    ['탭 글자 = 고르면 text · 아니면 muted', Q.tab, /color: on \? T\.text : T\.muted,/],
    ['탭 글꼴 = serif(= Pretendard, ui 와 같음)', Q.tab, /fontFamily: F\.serif,/],
    ['구역 이름 = champagne · 모노', Q.section, /color: T\.champagne,[\s\S]*fontFamily: F\.mono,/],
    ['칸 이름표 = subtle · 모노', Q.field, /color: T\.subtle,[\s\S]*fontFamily: F\.mono,/],
  ]) {
    if (!re.test(zone)) throw new Error(`원본의 뜻이 바뀌었습니다: ${what}`);
  }
  if (!/serif: PRETENDARD,/.test(tokensTs) || !/ui: PRETENDARD,/.test(tokensTs)) {
    throw new Error('F.serif 가 더는 F.ui 와 같은 글꼴이 아닙니다. 탭 글꼴을 다시 보세요.');
  }
}

assertFilled(spec);
if (spec.kpi.valueSize !== 36) throw new Error(`KPI 숫자 크기가 바뀌었습니다: ${spec.kpi.valueSize}`);
if (spec.shell.detail !== 820) throw new Error(`상세 폭이 바뀌었습니다: ${spec.shell.detail}`);

// ── CSS ──────────────────────────────────────────────────────────────────────
/* 이름은 차림표 · 목록 정본과 같게 둡니다(borderHi · danger). 한 변수를 두 이름으로 부르면 제품이 둘 다 이어야 합니다 */
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
  ['danger', 'red'],
];
const bind = (mode) => bindingsBlock(tokens.color, mode, BINDINGS);

const css = `/* =============================================================================
   q-design.screen.css · 화면 뼈대 정본
   생성물입니다. 손대지 마세요.  node tools/extract-screen.mjs
   원본: Q-Atelier lib/design/components.tsx (KPI · Stat · Grid · PageHd · Btn · In · SectionTitle · Lbl)
         + components/PageTabs.tsx
         + tokens.ts (LAYOUT · TOUCH · BP) + app/globals.css (.qa-btn · .qa-input)
   =============================================================================

   목록 «위와 아래» 를 맡습니다.

     .qd-kpi        요약 지표 카드. 목록 위에서 「지금 상태」를 숫자로 말합니다
     .qd-grid-kpi   그 카드를 담는 반응형 격자
     .qd-stat       조밀한 짝. 카드 안에 여럿 늘어놓을 때
     .qd-label      구역 이름표. 모노 · 작게 · muted
     .qd-page-head  화면 머리. 막대 · 부제 · 제목 · 하단선
     .qd-btn        단추. 주(글자색 면) · 보조(테두리) · 위험 · 작은 것
     .qd-input      입력칸. 글 · 고르개 · 여러 줄
     .qd-section-title  판 밖의 구역 이름(금색 · 모노)
     .qd-field-label    입력칸 위 이름표(모노 · subtle)
     .qd-tabs · .qd-tab 화면 안을 가르는 탭 줄(금색 밑줄)
     .qd-shell-*    폭을 좁히고 가운데 두는 규칙

   색은 \`q-design.nav.css\` 와 같은 \`--qd-*\` 를 읽습니다.
   ============================================================================= */

:root {
${bind('dark')}
}

html[data-theme='light'] {
${bind('light')}
}

/* ── 요약 지표 ─────────────────────────────────────────────────────────────
   목록 위에서 「지금 상태」를 숫자로 말합니다. 라벨은 작고 조용하며 숫자가
   크게 섭니다 - 훑는 사람이 찾는 것은 라벨이 아니라 숫자입니다.

   🔑 부제 자리는 값이 없어도 **높이를 잡아 둡니다**. 안 그러면 부제가 있는
   카드와 없는 카드의 높이가 달라 격자의 아랫줄이 들쭉날쭉해집니다. */
.qd-grid-kpi {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(${px(spec.kpi.gridMinCol)}, 1fr));
  gap: ${px(spec.kpi.gridGap)};
}

.qd-kpi {
  box-sizing: border-box;
  /* 가리키면 뜨는 내역이 카드 전체를 덮을 수 있게. 안 주면 겹칠 자리가 화면 전체가 됩니다 */
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: ${px(spec.kpi.minHeight)};
  padding: ${spec.kpi.padding};
  /* 값 글자가 칸 폭(cqw)을 재도록 크기 컨테이너로 둡니다 (.qd-kpi-value 의 clamp 와 한 벌) */
  container-type: inline-size;
  background: var(--qd-surface);
  border: 1px solid var(--qd-border);
  border-radius: var(--qd-radius-card, ${px(spec.panel.radius)});
  color: inherit;
  text-decoration: none;
}
/* 눌러서 갈 곳이 있는 카드만 반응합니다 */
.qd-kpi--link { transition: background ${tokens.motion.fast}; }
.qd-kpi--link:hover { background: var(--qd-surface2); }
.qd-kpi-label {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: ${px(spec.kpi.labelGapBelow * 4)};
  font-family: var(--qd-font-mono);
  font-size: ${px(spec.kpi.labelSize)};
  font-weight: ${spec.kpi.labelWeight};
  letter-spacing: ${px(spec.kpi.labelTracking)};
  text-transform: uppercase;
  color: var(--qd-subtle);
}
.qd-kpi-label[data-hangul] {
  letter-spacing: 0;
  text-transform: none;
  word-spacing: var(--qd-hangul-word-space);
}
.qd-kpi-value {
  flex: 1;
  display: flex;
  align-items: center;
  /* 좁은 칸에서 긴 금액이 넘치지 않게 칸 폭에 따라 줄어듭니다. 넓으면 ${px(spec.kpi.valueSize)} 그대로 */
  font-size: clamp(${px(spec.kpi.valueMin)}, ${spec.kpi.valueFluid}cqw, ${px(spec.kpi.valueSize)});
  font-weight: ${spec.kpi.valueWeight};
  line-height: ${spec.kpi.valueLine};
  letter-spacing: ${spec.kpi.valueTracking};
  font-variant-numeric: tabular-nums;
  color: var(--qd-kpi-color, var(--qd-text));
}
/* 값 뒤의 단위. 숫자보다 작고 조용하게, 밑줄을 맞춘다 */
.qd-kpi-unit {
  margin-left: 4px;
  font-size: ${px(spec.kpi.subSize)};
  font-weight: 400;
  letter-spacing: 0;
  color: var(--qd-muted);
}
.qd-kpi-sub {
  margin-top: ${px(spec.kpi.subGapAbove * 4)};
  min-height: ${px(spec.kpi.subMinHeight)};
  font-size: ${px(spec.kpi.subSize)};
  letter-spacing: 0.2px;
  line-height: 1.5;
  color: var(--qd-muted);
}
/* 0 은 눌러 둡니다. 0 을 강조하면 아무 일도 없는 것이 일처럼 보입니다. */
.qd-kpi--zero .qd-kpi-value { color: var(--qd-muted); }
/* 🔴 0 과 「못 읽음」 이 같은 얼굴이면 안 됩니다. 0 은 사실이고 못 읽음은 모름입니다.
   숫자 자리에 0 을 그려 놓으면 사람은 그것을 «잰 값» 으로 읽습니다. */
.qd-kpi--unread .qd-kpi-value,
.qd-kpi--unread .qd-kpi-sub { color: var(--qd-danger); }

/* ── 조밀한 지표 ───────────────────────────────────────────────────────────
   카드 «안» 에 여럿 늘어놓을 때. 위와 같은 문법이고 크기만 작습니다. */
.qd-grid-stat {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(${px(spec.stat.gridMinCol)}, 1fr));
  gap: ${px(spec.stat.gridGap * 4)};
}
.qd-stat-label {
  margin-bottom: ${px(spec.stat.labelGapBelow * 4)};
  font-family: var(--qd-font-mono);
  font-size: ${px(spec.stat.labelSize)};
  letter-spacing: ${spec.stat.labelTracking};
  text-transform: uppercase;
  color: var(--qd-muted);
}
.qd-stat-label[data-hangul] {
  letter-spacing: 0;
  text-transform: none;
  word-spacing: var(--qd-hangul-word-space);
}
.qd-stat-value {
  font-size: ${px(spec.stat.valueSize)};
  font-weight: ${spec.stat.valueWeight};
  color: var(--qd-stat-color, var(--qd-text));
  font-variant-numeric: tabular-nums;
}

/* ── 구역 이름표 ───────────────────────────────────────────────────────────
   「인허가 모듈」 · 「활동 로그」 처럼 덩어리 위에 붙는 한 줄.
   누를 수 없는 글이므로 아주 조용하게 둡니다. */
.qd-label {
  font-family: var(--qd-font-mono);
  font-size: ${px(spec.stat.labelSize)};
  letter-spacing: ${spec.stat.labelTracking};
  text-transform: uppercase;
  color: var(--qd-muted);
}
.qd-label[data-hangul] {
  letter-spacing: 0;
  text-transform: none;
  word-spacing: var(--qd-hangul-word-space);
}

/* ── 구역 이름 ─────────────────────────────────────────────────────────────
   판 «밖» 에서 덩어리의 이름을 말하는 한 줄입니다(원본 SectionTitle). 금색 · 모노 · 작게.
   .qd-label 과 다릅니다. 그쪽은 카드 «안» 의 조용한 이름표(muted)이고, 이쪽은 화면을
   구역으로 나누는 표지(강조색)입니다.
   🔴 네 제품 대조에서 판 안 제목 + 구분선 · 14px 굵은 제목 · 금색 모노(원본)로 갈렸습니다.

     <h2 class="qd-section-title" data-hangul>오늘 처리할 것</h2>
     <div class="qd-panel">…</div>

   제목 옆에 배지 · 단추가 함께 서는 머리 줄에서는 --flush 로 아래 여백을 뺍니다. */
.qd-section-title {
  margin: 0 0 ${px(spec.section.gapBelow)};
  font-family: var(--qd-font-mono);
  font-size: ${px(spec.section.fontSize)};
  font-weight: ${spec.section.weight};
  /* 원본은 본문 줄간격(${spec.body.lineHeight})을 물려받습니다. 제품마다 바탕 줄간격이 달라 못 박습니다 */
  line-height: ${spec.body.lineHeight};
  letter-spacing: ${px(spec.section.tracking)};
  text-transform: uppercase;
  color: var(--qd-accent);
}
.qd-section-title[data-hangul] {
  letter-spacing: 0;
  text-transform: none;
  word-spacing: var(--qd-hangul-word-space);
}
.qd-section-title--flush { margin-bottom: 0; }

/* ── 칸 이름표 ─────────────────────────────────────────────────────────────
   입력칸 바로 위의 이름입니다(원본 Lbl). 모노 · 작게 · subtle, 칸과 ${px(spec.field.gapBelow)} 띄웁니다.
   🔴 대조에서 산세리프 12 굵게 · 14 굵게 · 모노 10(원본)으로 갈렸습니다.

     <label class="qd-field-label" for="due" data-hangul>기한</label>
     <input class="qd-input" id="due"> */
.qd-field-label {
  display: block;
  margin-bottom: ${px(spec.field.gapBelow)};
  font-family: var(--qd-font-mono);
  font-size: ${px(spec.field.fontSize)};
  font-weight: ${spec.field.weight};
  line-height: ${spec.body.lineHeight};
  letter-spacing: ${px(spec.field.tracking)};
  text-transform: uppercase;
  color: var(--qd-subtle);
}
.qd-field-label[data-hangul] {
  letter-spacing: 0;
  text-transform: none;
  word-spacing: var(--qd-hangul-word-space);
}
/* 이름표가 단추 · 배지와 한 줄에 서는 머리 줄에서는 아래 여백을 뺍니다 */
.qd-field-label--flush { margin-bottom: 0; }

/* ── 2차 탭 ────────────────────────────────────────────────────────────────
   화면 «안» 을 가르는 탭 줄입니다(원본 PageTabs). 밑선 하나 위에 글자만 놓고, 고른 탭은
   금색 밑줄 ${px(spec.tabs.barWidth)} 와 굵기로 말합니다. 상자 · 알약 · 폴더 모양을 쓰지 않습니다.
   🔴 대조에서 알약 묶음 · 폴더 탭 · 밑줄(원본)로 갈렸고, 한 제품 안에서 두 모양이 섞인
      곳도 있었습니다(오너 결정 2026-09-24 「금색 밑줄 탭으로 통일」).

     <div class="qd-tabs" role="tablist" aria-label="기록 관리">
       <a class="qd-tab" role="tab" aria-selected="true" href="?tab=a">개요</a>
       <a class="qd-tab" role="tab" aria-selected="false" href="?tab=b">기록</a>
     </div>

   고른 탭은 aria-selected="true" 로 말합니다(클래스 .qd-tab--active 도 받습니다).
   탭 글자에는 자간을 두지 않습니다(원본도 두지 않습니다). 좁은 화면에서는 줄을 바꿉니다. */
.qd-tabs {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: ${px(spec.tabs.gapBelow * 4)};
  border-bottom: 1px solid var(--qd-border);
}
.qd-tab {
  padding: ${spec.tabs.padding};
  border: 0;
  border-bottom: ${px(spec.tabs.barWidth)} solid transparent;
  background: none;
  color: var(--qd-muted);
  font-family: var(--qd-font-ui);
  font-size: ${px(spec.tabs.fontSize)};
  font-weight: ${spec.tabs.weightOff};
  line-height: ${spec.body.lineHeight};
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
}
/* 원본 전역 초점 규칙([role='tab'])과 같은 고리. 제품의 전역 규칙에 기대지 않습니다 */
.qd-tab:focus-visible {
  outline: ${px(spec.focus.outline)} solid var(--qd-accent);
  outline-offset: ${px(spec.focus.offset)};
  box-shadow: 0 0 0 ${px(spec.focus.ring)} color-mix(in srgb, var(--qd-accent) ${spec.focus.ringMix}%, transparent);
}
.qd-tab[aria-selected='true'],
.qd-tab--active {
  border-bottom-color: var(--qd-accent);
  color: var(--qd-text);
  font-weight: ${spec.tabs.weightOn};
}

/* ── 화면 머리 ─────────────────────────────────────────────────────────────
   모든 화면 맨 위에 같은 모양으로 섭니다: 금색 막대 · 부제 · 제목 · 하단선.
   나란히 놓았을 때 「같은 집안」 을 가장 먼저 말하는 자리입니다 (docs/11 · docs/22).

     <header class="qd-page-head">
       <div class="qd-page-head-row">
         <div class="qd-page-head-text">
           <p class="qd-page-head-sub">NON-CONFORMANCE</p>     한글이면 data-hangul
           <h1 class="qd-page-head-title">부적합</h1>
         </div>
         <div class="qd-page-head-actions">…</div>
       </div>
     </header>

   막대와 하단선은 가상 요소라 따로 적지 않습니다. 막대를 빼려면 --plain.
   🔴 제목 크기를 제품에서 다시 적지 마십시오. 26 · 22.5 로 갈렸던 자리입니다. */
.qd-page-head { margin-bottom: ${px(spec.head.gapBelow * 4)}; }
.qd-page-head::after {
  content: '';
  display: block;
  margin-top: ${px(spec.head.ruleGapAbove * 4)};
  border-bottom: 1px solid var(--qd-border);
}
.qd-page-head-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: ${px(spec.head.rowGap * 4)};
  flex-wrap: wrap;
}
.qd-page-head-text { min-width: 0; flex: 1 1 auto; }
.qd-page-head-text::before {
  content: '';
  display: block;
  width: ${px(spec.head.barWidth)};
  height: ${px(spec.head.barHeight)};
  margin-bottom: ${px(spec.head.barGapBelow * 4)};
  background: var(--qd-accent);
}
.qd-page-head--plain .qd-page-head-text::before { display: none; }
.qd-page-head-sub {
  margin: 0 0 ${px(spec.head.subGapBelow * 4)};
  font-family: var(--qd-font-mono);
  font-size: ${px(spec.head.subSize)};
  font-weight: 400;
  letter-spacing: ${px(spec.head.subTracking)};
  text-transform: uppercase;
  color: var(--qd-subtle);
}
.qd-page-head-sub[data-hangul] {
  letter-spacing: 0;
  text-transform: none;
  word-spacing: var(--qd-hangul-word-space);
}
.qd-page-head-title {
  margin: 0;
  font-family: var(--qd-font-ui);
  font-size: clamp(${px(spec.head.titleMin)}, ${spec.head.titleFluid}vw, ${px(spec.head.titleMax)});
  font-weight: ${spec.head.titleWeight};
  line-height: ${spec.head.titleLine};
  letter-spacing: ${spec.head.titleTracking};
  color: var(--qd-text);
}
.qd-page-head-actions { display: flex; gap: ${px(spec.head.actionsGap * 4)}; align-items: center; }
@media (max-width: ${px(spec.head.stackBelow)}) {
  .qd-page-head-row { align-items: flex-start; }
  .qd-page-head-actions { width: 100%; flex-wrap: wrap; }
}

/* ── 단추 ──────────────────────────────────────────────────────────────────
   주 단추는 «글자색 면» 입니다. 다크에서는 상아색, 라이트에서는 먹색이 됩니다
   (오너 결정 2026-09-24 「주 단추는 상아색 면」). 금색 면이 아닙니다 - 금색은
   강조 막대 · 초점 · 활성 표시의 몫이고, 면으로 깔면 화면에서 가장 큰 금덩이가 됩니다.

     <button class="qd-btn qd-btn--primary">등록</button>
     <a class="qd-btn qd-btn--secondary qd-btn--sm">취소</a>
     <button class="qd-btn qd-btn--primary" data-latin>STEP INSIDE</button>

   🔑 기본은 한글입니다(자간 0). 단추 글은 거의 다 한글이라 많은 쪽을 기본으로
      두어야 빠뜨려도 조용히 틀리지 않습니다. 영문 단추에만 data-latin. */
.qd-btn {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${px(spec.btn.gap * 4)};
  min-height: ${px(spec.btn.minHeight)};
  padding: ${spec.btn.padding};
  border: 1px solid transparent;
  border-radius: var(--qd-radius-control, ${px(spec.btn.radius)});
  font-family: var(--qd-font-ui);
  font-size: ${px(spec.btn.fontSize)};
  font-weight: ${spec.btn.weight};
  line-height: 1;
  letter-spacing: 0;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  transition: opacity ${tokens.motion.fast}, border-color ${tokens.motion.fast}, color ${tokens.motion.fast}, transform 0.05s ease;
}
.qd-btn[data-latin] { letter-spacing: ${px(spec.btn.tracking)}; text-transform: uppercase; }
.qd-btn--sm { min-height: ${px(spec.btn.minHeightSm)}; padding: ${spec.btn.paddingSm}; font-size: ${px(spec.btn.fontSizeSm)}; }
.qd-btn--primary { background: var(--qd-text); color: var(--qd-bg); }
.qd-btn--primary:hover:not(:disabled) { opacity: ${spec.btn.hoverOpacity}; }
.qd-btn--primary:active:not(:disabled) { transform: translateY(1px); }
.qd-btn--secondary { background: transparent; border-color: var(--qd-border); color: var(--qd-subtle); }
.qd-btn--secondary:hover:not(:disabled) { border-color: var(--qd-borderHi); color: var(--qd-text); }
.qd-btn--danger { background: var(--qd-danger); border-color: var(--qd-danger); color: var(--qd-bg); }
.qd-btn--secondary.qd-btn--danger { background: transparent; color: var(--qd-danger); }
.qd-btn:disabled,
.qd-btn[aria-disabled='true'] { opacity: ${spec.btn.disabledOpacity}; cursor: not-allowed; }
.qd-btn:focus-visible:not(:disabled) {
  outline: ${px(spec.btn.focusOutline)} solid var(--qd-accent);
  outline-offset: ${px(spec.btn.focusOffset)};
  box-shadow: 0 0 0 ${px(spec.btn.focusRing)} color-mix(in srgb, var(--qd-accent) ${spec.btn.focusRingMix}%, transparent);
}
/* 손가락 기기에서는 작은 단추도 ${spec.btn.minHeight}px (WCAG 2.2) */
@media (hover: none) and (pointer: coarse) {
  .qd-btn--sm { min-height: ${px(spec.btn.minHeight)}; }
}

/* ── 입력칸 ────────────────────────────────────────────────────────────────
   글 · 고르개 · 여러 줄 모두 같은 상자입니다. 검색칸 · 정렬 고르개처럼 «작은»
   자리도 모서리는 ${px(spec.input.radius)} 입니다 (오너 결정 2026-09-24 「전부 10」). */
.qd-input {
  box-sizing: border-box;
  width: 100%;
  padding: ${spec.input.padding};
  background: var(--qd-surface);
  border: 1px solid var(--qd-border);
  border-radius: var(--qd-radius-control, ${px(spec.input.radius)});
  color: var(--qd-text);
  font-family: var(--qd-font-ui);
  font-size: ${px(spec.input.fontSize)};
  /* 원본 입력칸은 줄간격을 적지 않아 브라우저 기본값(normal)으로 그려집니다(높이 36~37).
     Tailwind preflight 를 쓰는 제품은 본문 줄간격(1.5~1.7)을 물려받아 42 · 44 로 커졌습니다 (2026-09-24) */
  line-height: normal;
  transition: border-color ${tokens.motion.fast}, background-color ${tokens.motion.fast}, box-shadow ${tokens.motion.fast};
}
.qd-input:hover:not(:focus):not(:disabled):not([readonly]) { border-color: var(--qd-borderHi); }
.qd-input:focus {
  border-color: var(--qd-accent);
  background-color: var(--qd-surface2);
  box-shadow: 0 0 0 ${px(spec.input.focusRing)} color-mix(in srgb, var(--qd-accent) ${spec.input.focusRingMix}%, transparent);
}
/* 원본은 전역 :focus-visible 규칙이 입력칸에도 외곽선을 겁니다. 제품마다 그 규칙이 있다고 믿지 않고 여기 둡니다 */
.qd-input:focus-visible {
  outline: ${px(spec.btn.focusOutline)} solid var(--qd-accent);
  outline-offset: ${px(spec.btn.focusOffset)};
}
.qd-input[readonly] { color: var(--qd-muted); cursor: default; }
.qd-input[aria-invalid='true'] { border-color: var(--qd-danger); }
@media (max-width: ${px(spec.input.narrowBelow)}) {
  .qd-input { font-size: ${px(spec.input.fontSizeNarrow)}; }
}

/* ── 셸 폭 ─────────────────────────────────────────────────────────────────
   🔑 **읽는 화면은 좁힙니다.** 전체폭으로 펼치면 글줄이 길어져 눈이 줄을 잃습니다.
   목록만 폭 제한이 없습니다 - 표와 행은 넓을수록 좋기 때문입니다.

     현장  ${spec.shell.mobile}   장갑 낀 손으로 한 번에 한 가지
     폼    ${spec.shell.form}   쓰는 화면
     상세  ${spec.shell.detail}   읽는 화면
     2단   ${spec.shell.wide}  본문 + 옆단
     목록  제한 없음 */
.qd-shell-field  { max-width: ${px(spec.shell.mobile)}; margin-left: auto; margin-right: auto; }
.qd-shell-form   { max-width: ${px(spec.shell.form)}; margin-left: auto; margin-right: auto; }
.qd-shell-detail { max-width: ${px(spec.shell.detail)}; margin-left: auto; margin-right: auto; }
.qd-shell-wide   { max-width: ${px(spec.shell.wide)}; margin-left: auto; margin-right: auto; }

/* 본문 여백. sticky 밴드가 이 값을 실측해 inset 을 잡는 제품이 있어 변수로도 냅니다. */
:root {
  --qd-main-pad-y: ${px(spec.main.top)};
  --qd-main-pad-x: ${px(spec.main.right)};
}
.qd-main { padding: var(--qd-main-pad-y) var(--qd-main-pad-x); }

@media print {
  .qd-kpi { break-inside: avoid; }
}
`;

// Q-Design owns opt-in composition patterns; source/ remains an upstream mirror.
const workspaceCss = read(join(ROOT, 'patterns', 'workspace.css'));
const screenCss = css + '\n' + workspaceCss;
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'q-design.screen.css'), screenCss, 'utf8');
writeFileSync(
  join(OUT, 'q-design.screen.json'),
  JSON.stringify(
    {
      $meta: {
        generatedBy: 'tools/extract-screen.mjs',
        source: 'source/components/components.tsx + source/tokens/tokens.ts + source/tokens/main-padding.ts + patterns/workspace.css',
        note: '손으로 고치지 마세요. 원본을 고치고 다시 돌리세요.',
      },
      ...spec,
    },
    null,
    2,
  ) + '\n',
  'utf8',
);

console.log(`dist/q-design.screen.css   ${screenCss.split('\n').length} 줄`);
console.log(`dist/q-design.screen.json  치수 ${flat(spec).length} 개`);
console.log('');
console.log(`  KPI    ${spec.kpi.padding} · 최소높이 ${spec.kpi.minHeight} · 숫자 ${spec.kpi.valueMin}~${spec.kpi.valueSize}(${spec.kpi.valueFluid}cqw)/${spec.kpi.valueWeight}`);
console.log(`  격자   minmax(${spec.kpi.gridMinCol}) · gap ${spec.kpi.gridGap}`);
console.log(`  폭     현장 ${spec.shell.mobile} · 폼 ${spec.shell.form} · 상세 ${spec.shell.detail} · 2단 ${spec.shell.wide}`);
console.log(`  본문   ${spec.main.top}px ${spec.main.right}px`);
