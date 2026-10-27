// 상세 · 폼 화면의 공용 틀과 칸 격자 (2026-10-27 오너 결정 «3» 꽉 채움 + 칸 자동)
//
// 값은 source/design/atelier-runtime.ts 의 QDRuntime.fields 하나에서 온다. 세 제품이 모두 받는
// dist/q-design.workspace.css 끝에 붙어 나간다(아뜰리에는 뼈대 CSS 를 받지 않는다).
import { readRuntimeValues } from './atelier-runtime-values.mjs';

export function pageShellCss(runtime) {
  const f = runtime.QDRuntime?.fields;
  for (const k of ['min', 'gapX', 'gapY', 'groupGap']) {
    if (!Number.isFinite(f?.[k]) || f[k] <= 0) throw new Error(`칸 격자 ${k} 를 못 읽었습니다.`);
  }
  if (Object.keys(runtime.LAYOUT).join() !== 'mobile') {
    throw new Error('상세 · 폼 화면은 폭을 좁히지 않습니다(2026-10-27 «3»). LAYOUT 에는 현장 폭 mobile 만 둡니다.');
  }
  if (f.min >= runtime.LAYOUT.mobile) throw new Error('칸 폭이 현장 폭보다 넓습니다.');
  // 묶음 안 간격은 묶음 사이보다 좁게(우리 디자인 규칙 S1). 같으면 묶음이 사라진다
  if (f.groupGap <= f.gapY) throw new Error('칸 묶음 사이 간격이 줄 사이 간격보다 넓어야 합니다.');
  return `/* ── 상세 · 폼 화면의 공용 틀과 칸 격자 (2026-10-27 오너 결정 «3») ─────────────
   만든 곳: tools/page-shell-css.mjs · 값: source/design/atelier-runtime.ts QDRuntime.fields

   상세 · 폼 화면은 폭을 좁히지 않고 .qd-shell-page 한 틀에 둡니다. 좁히는 것은 현장 모드(520)뿐입니다.
   칸은 .qd-fields 에 놓습니다. 칸 하나의 폭(${f.min}px)을 지키며 들어가는 만큼 한 줄에 놓으므로,
   틀이 넓어져도 칸이 늘어나지 않고 한 줄의 칸 수가 늘어납니다(1920 다섯 칸 · 1366 세 칸 · 폰 한 칸).
   주소 · 비고처럼 긴 칸은 .qd-field-wide 로 줄 끝까지 씁니다. 처음에는 두 칸 폭이었으나, 한 줄에
   세 칸이 드는 폭에서 긴 칸 옆에 빈 칸이 남아 오너가 «끝까지» 로 고쳤습니다(같은 날).

   한 구역 안에서 칸을 뜻으로 묶을 때(연락처 / 계약 기간처럼)는 .qd-fields 를 .qd-field-groups 로 감싸
   잇달아 놓습니다. 묶음 사이는 ${f.groupGap}px 로, 줄 사이(${f.gapY}px)보다 넓어야 묶음이 보입니다.
   맨몸으로 잇달아 두면 묶음 사이가 놓인 상자의 간격(12 · 16 · 24)을 따라 화면마다 갈렸습니다. 이 상자가
   간격을 혼자 쥐므로 어느 상자 안에 놓여도 같습니다. */
.qd-shell-page { min-width: 0; }
.qd-fields {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, ${f.min}px), 1fr));
  gap: ${f.gapY}px ${f.gapX}px;
  min-width: 0;
}
.qd-fields > .qd-field-wide { grid-column: 1 / -1; }
.qd-field-groups { display: flex; flex-direction: column; gap: ${f.groupGap}px; min-width: 0; }
`;
}

export function readPageShellCss(root) {
  return pageShellCss(readRuntimeValues(root));
}
