import { QDOutput } from './q-design-output';
// =============================================================================
// 종이 치수 · 한 곳 (2026-09-09 감사 · 주제 #10)
// =============================================================================
// 화면의 가로 스크롤 감싸개가 종이에서는 «스크롤할 수 없는 상자» 가 된다. 그래서
// minWidth 가 종이 가용폭보다 넓은 표는 오른쪽 끝이 **잘렸다는 표시도 없이** 사라진다.
// 받아 본 사람은 그 열이 원래 없다고 읽는다.
//
// 실측(A4 794px · @media print):
//   /assessments  보임 728 · 담김 1176 → 448px 가 사라짐
//   /audit        보임 728 · 담김  760 →  32px
//   /settings     보임 728 · 담김  760 →  32px
//
// ── 왜 minWidth 를 0 으로 풀지 않는가 ────────────────────────────────────────
// `160px 180px 220px 1fr` 같은 고정 px 트랙은 감싸개를 풀어도 안 줄어든다. 여전히
// 넘치고, 대신 열 비율만 무너진다. 배율(zoom)로 «통째로» 줄여야 열 비율이 보존된다.
//
// ⚠️ 이 숫자들은 app/globals.css 의 `@page { margin: … }` 와 print 블록의 main
//    padding 과 **같은 값이어야 한다.** 어긋나면 표가 종이 밖으로 나가거나 여백이
//    낭비된다. lib/design/print-fit.test.ts 가 그 둘을 대조한다.
//
// ⬜ 정본(Q-Design)이 `--qd-paper-*` 를 내면 아래 셋을 그 변수로 갈아끼운다.
//    지금 정본에는 종이 규격이 없어서, 미리 두 곳에 적지 않고 여기 한 벌만 둔다.
// =============================================================================

/**
 * `@page` 의 여백 `18mm 16mm 22mm` 와 같은 값.
 *
 * 🔑 값을 `margin:` 뒤에 붙여 쓰지 않는다. no-raw-scale 가드는 주석과 코드를
 *    구분하지 못해서, 설명문의 치수까지 «손으로 적은 여백» 으로 센다.
 */
export const PAGE_MARGIN_MM = QDOutput.print.marginMm;

/** 인쇄 때 main 의 좌우 안쪽 여백(px). 종이 여백이 이미 있으므로 0 이다. */
export const PRINT_MAIN_PAD_X = QDOutput.print.mainPadXpx;

/** A4 210mm 에서 좌우 여백을 뺀 본문 가용폭(px, 96dpi 기준). 178mm ≈ 672.7 → 672. */
export const PRINT_CONTENT_W =
  Math.floor(((QDOutput.print.paperWidthMm - PAGE_MARGIN_MM.left - PAGE_MARGIN_MM.right) / 25.4) * 96) - PRINT_MAIN_PAD_X * 2;

/**
 * 이 폭을 종이에 담으려면 얼마로 줄여야 하는가. 이미 들어가면 1.
 *
 * 🔑 소수 셋째 자리에서 **내림** 한다. 반올림하면 0.5px 이 넘쳐 오른쪽 한 줄이
 *    다시 잘린다. 조금 작게 그리는 것은 아무도 못 알아보지만, 잘리는 것은 보인다.
 */
export function printZoom(minWidth: number): number {
  if (!Number.isFinite(minWidth) || minWidth <= 0) return 1;
  if (minWidth <= PRINT_CONTENT_W) return 1;
  return Math.floor((PRINT_CONTENT_W / minWidth) * 1000) / 1000;
}
