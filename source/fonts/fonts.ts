// =============================================================================
// Fonts
// =============================================================================
// Pretendard Variable (한글+영문 UI 본문) 와 JetBrains Mono 는 app/fonts.css 가 싣는다
// (scripts/fonts/build-fonts.mjs 가 만든다 · 자체 서버에서 · 쓰인 글자의 조각만).
// 전에는 Pretendard 2MB 한 파일을 next/font/local 로 미리 받기까지 걸어 실었다. 처음 들어오는
// 사람이 어느 화면에서나 2MB 를 먼저 받았다(2026-09-26 걷음 · 사연은 그 스크립트 머리 주석).
// --qa-font-pretendard 이름은 그대로다(lib/design/tokens.ts 의 글꼴 사슬이 부른다).
//
// 메인 앱은 Pretendard 단일 글꼴 정책 (한글/영문 일관성 최우선).
// 럭셔리 디스플레이 세리프 (Cormorant Garamond) 는 "얼굴" 화면(로그인 히어로 등)의
// 영문 디스플레이 전용: root layout 에서 전역 로드해 --qa-font-cormorant 로 노출.
// (외부 전문가 포털 `app/experts/*` 는 자체 layout 에서 별도 스코프 로드 유지.)
// 본문·페이지 헤딩(TYPE.*)은 Pretendard 그대로: 메인 앱 단일 글꼴 정책 불변.

import { Cormorant_Garamond } from 'next/font/google';

// =============================================================================
// Cormorant Garamond: 럭셔리 디스플레이 세리프 ("얼굴" 화면 영문 히어로 전용)
// =============================================================================
// 로그인 히어로 등 영문 위주 디스플레이 텍스트에서 Times New Roman(제네릭 시스템
// 세리프) 대신 사용. F.display 토큰이 이 변수를 참조한다.
//
// · style ['normal'] 만 로드: 브랜드 규칙(반복 확정): Cormorant italic 절대 금지.
//   전문가 layout 과 동일 정책. italic 글리프가 폴백 경로로 섞일 여지를 원천 차단.
// · preload: false: 디스플레이 전용이라 대다수 라우트(대시보드 등)에선 쓰이지 않음.
//   전역 preload 로 모든 페이지에 부담 주지 않고, 실제 사용하는 라우트에서 swap 로드.
export const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal'],
  variable: '--qa-font-cormorant',
  display: 'swap',
  preload: false,
});
