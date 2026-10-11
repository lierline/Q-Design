import { QDPresentation } from './q-design-runtime';
// =============================================================================
// main-padding: 본문 스크롤 컨테이너의 padding SSOT
// =============================================================================
// `app/(app)/layout.tsx`(서버 컴포넌트)와 sticky 계산(lib/design/sticky-inset.ts,
// 클라이언트)이 같은 값을 봐야 하는데, 서버 컴포넌트는 훅을 쓰는 모듈을 import 할 수
// 없습니다(Next 가 빌드에서 막습니다). 그래서 «값» 만 여기 따로 둡니다.

export interface EdgePadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * 데스크톱 본문(main.qa-main-content)의 padding. layout 이 이 값으로 main 을 그리고,
 * sticky 훅이 측정 전 첫 페인트의 기본값으로 씁니다.
 * 패드·폰은 app/globals.css 가 !important 로 덮으므로 측정으로만 알 수 있습니다.
 */
export const MAIN_PADDING: EdgePadding = QDPresentation.mainPadding;
