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
  kpiLabel: slice(P.kpi, '            fontSize: FS[10],\n            color: T.subtle,', '{label}', 'kpiLabel'),
  kpiValue: slice(P.kpi, '            fontFamily: F.serif,\n            fontWeight: 700,', '{displayedValue}', 'kpiValue'),
  kpiSub: slice(P.kpi, '            fontSize: FS[11],\n            color: T.muted,', '{sub ??', 'kpiSub'),
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
  ['kpi.valueSize',   Z.kpiValue, /fontSize: FS\[(\d+)\],/, Number],
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
  const m = audit.match(/<Grid cols=\{4\} minCol=\{(\d+)\} gap=\{(\d+)\}/);
  if (!m) throw new Error('KPI 격자 값을 못 찾았습니다 (source/screens/audit-page.tsx).');
  put(spec, 'kpi.gridMinCol', Number(m[1]));
  put(spec, 'kpi.gridGap', Number(m[2]));
}

put(spec, 'panel.radius', tokens.radius.md);

assertFilled(spec);
if (spec.kpi.valueSize !== 36) throw new Error(`KPI 숫자 크기가 바뀌었습니다: ${spec.kpi.valueSize}`);
if (spec.shell.detail !== 820) throw new Error(`상세 폭이 바뀌었습니다: ${spec.shell.detail}`);

// ── CSS ──────────────────────────────────────────────────────────────────────
const BINDINGS = [
  ['surface', 'surface'],
  ['surface2', 'surface2'],
  ['border', 'border'],
  ['text', 'text'],
  ['subtle', 'subtle'],
  ['muted', 'muted'],
  ['accent', 'champagne'],
];
const bind = (mode) => bindingsBlock(tokens.color, mode, BINDINGS);

const css = `/* =============================================================================
   q-design.screen.css · 화면 뼈대 정본
   생성물입니다. 손대지 마세요.  node tools/extract-screen.mjs
   원본: Q-Atelier lib/design/components.tsx (KPI · Stat · Grid) + tokens.ts (LAYOUT)
   =============================================================================

   목록 «위와 아래» 를 맡습니다.

     .qd-kpi        요약 지표 카드. 목록 위에서 「지금 상태」를 숫자로 말합니다
     .qd-grid-kpi   그 카드를 담는 반응형 격자
     .qd-stat       조밀한 짝. 카드 안에 여럿 늘어놓을 때
     .qd-label      구역 이름표. 모노 · 작게 · muted
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
  font-size: ${px(spec.kpi.valueSize)};
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

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'q-design.screen.css'), css, 'utf8');
writeFileSync(
  join(OUT, 'q-design.screen.json'),
  JSON.stringify(
    {
      $meta: {
        generatedBy: 'tools/extract-screen.mjs',
        source: 'source/components/components.tsx + source/tokens/tokens.ts + source/tokens/main-padding.ts',
        note: '손으로 고치지 마세요. 원본을 고치고 다시 돌리세요.',
      },
      ...spec,
    },
    null,
    2,
  ) + '\n',
  'utf8',
);

console.log(`dist/q-design.screen.css   ${css.split('\n').length} 줄`);
console.log(`dist/q-design.screen.json  치수 ${flat(spec).length} 개`);
console.log('');
console.log(`  KPI    ${spec.kpi.padding} · 최소높이 ${spec.kpi.minHeight} · 숫자 ${spec.kpi.valueSize}/${spec.kpi.valueWeight}`);
console.log(`  격자   minmax(${spec.kpi.gridMinCol}) · gap ${spec.kpi.gridGap}`);
console.log(`  폭     현장 ${spec.shell.mobile} · 폼 ${spec.shell.form} · 상세 ${spec.shell.detail} · 2단 ${spec.shell.wide}`);
console.log(`  본문   ${spec.main.top}px ${spec.main.right}px`);
