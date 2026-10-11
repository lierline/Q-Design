// =============================================================================
// 문서 결(2026-09-27 · 오너 결정 · Q-Design docs/24): 왼쪽 색 띠 대신 쓰는 두 가지
// =============================================================================
// 상태 색을 가는 선에 섞는 비율을 한 곳에 둔다. Bx accent · Alert · InfoBox · KPI 도움말과 화면들이
// 함께 부르고, Q-Design 정본 생성기(extract-list)도 이 값을 읽는다. 값을 옮겨 적지 말 것.
//
// 🔴 tokens.ts 에 두지 않은 까닭: tokens.ts 는 요구사항 엔진의 검증 근거(lib/engine/validation-manifest)가
//    지문을 드는 파일이라, 한 줄만 더해도 엔진 근거가 «다시 해야 함» 으로 바뀌고 배포 빌드 첫 단계가 멈춘다
//    (2026-09-27 이 값을 처음 tokens.ts 에 넣었다가 validation-manifest 시험 2건이 빨개져 옮겼다).
import { alpha } from './tokens';
import { QDRuntime } from './q-design-runtime';

export const GRAIN = {
  /** 상태 색을 가는 선에 섞는 비율 */
  tint: QDRuntime.grain.tint,
} as const;

/** 상자 테두리 전체를 옅은 상태 색으로(종전 «왼쪽 3px 색 띠» 자리). style 의 borderColor · border 색에 쓴다. */
export const tintBorder = (color: string): string => alpha(color, GRAIN.tint);

/** 강조문: 위아래 가는 가로선(종류 색) 사이. style 에 펼쳐 쓴다(`...ruleBand(T.warning)`). */
export const ruleBand = (color: string): { borderTop: string; borderBottom: string } => ({
  borderTop: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${tintBorder(color)}`,
  borderBottom: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${tintBorder(color)}`,
});

/** 조작 윤곽 색(입력 칸 · 보조 단추 · 아이콘 단추): 인접 면과 3:1 이상. 행 · 구역 구분선(T.border · T.borderHi)과 다른 층이다(2026-10-10).
 *  🔴 tokens.ts 에 두지 않은 까닭은 위와 같다(엔진 검증 근거). 값은 globals.css 의 --qa-ctl. */
export const CTL = 'var(--qa-ctl)';
