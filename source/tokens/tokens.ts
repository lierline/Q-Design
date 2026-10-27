// =============================================================================
// DESIGN TOKENS: Q-Atelier Cloud (Dual theme: Dark default + Light)
// Ported from v0.3.0 desktop app
// =============================================================================

// 다크 팔레트: globals.css 의 :root CSS 변수와 동기화. 색 수정 시 양쪽 모두 변경.
//   ▶ subtle/muted: WCAG AA (4.5:1) 통과 보정값.
//     (subtle #b7b0a5 ~7.5:1, muted #7e7868 ~4.53:1 on #0c0c0c)
//     ※ 이전 muted #6e685f 는 ~3.54:1 으로 AA 미달: 2026-06-01 보정.
//   ▶ champagne: 럭셔리 톤을 위해 더 깊은 골드 #b8935a 사용.
// 🔑 두 팔레트는 globals.css 의 «사본» 이고 lib/design/contrast.test 가 동기화를 잰다. 화면은 T 를 쓸 것.
export const DARK_PALETTE = {
  bg:        '#0c0c0c',
  surface:   '#141414',
  surface2:  '#1b1b1b',
  border:    '#242424',
  borderHi:  '#333333',
  text:      '#f0ebe0',
  subtle:    '#b7b0a5',
  muted:     '#898271',
  champagne: '#b8935a',
  green:     '#7ab87a',
  red:       '#c97a7a',
  warning:   '#c9a87a',
  blue:      '#7a9ac9',
  // 액센트 솔리드 면 위 텍스트: 다크 액센트는 밝아 near-black.
  onAccent:  '#0a0908',
} as const;

// 라이트 팔레트: globals.css 의 html[data-theme='light'] 변수와 동기화.
//   ▶ subtle/muted: 라이트 배경 위 WCAG AA (4.5:1) 통과 보정값 (Batch A).
//   ▶ 옛 값 (#5a5550 / #8a8478) 은 globals.css 에서 더 진한 톤으로 통일됨.
export const LIGHT_PALETTE = {
  bg:        '#faf9f6',
  surface:   '#ffffff',
  surface2:  '#f3f1ec',
  border:    '#e2dfd8',
  borderHi:  '#c8c4ba',
  text:      '#1c1a16',
  subtle:    '#4a4540',
  muted:     '#726b5e',
  // 2026-06-01: globals.css --qa-champagne 를 #8a6838 로 보정 (WCAG AA 4.5:1↑ on white).
  // 이전 #9a7842 는 ~3.98:1 로 AA 미달. 새 값 ~4.80:1 으로 링크·포커스·강조 텍스트 적합.
  champagne: '#8a6838',
  green:     '#3d7a3d',
  red:       '#a83838',
  warning:   '#97621f',
  blue:      '#2d5fa8',
  // 라이트 액센트는 AA 보정으로 어두움 → 위 텍스트는 white.
  onAccent:  '#ffffff',
} as const;

export type ThemeName = 'dark' | 'light';
export type PaletteKey = keyof typeof DARK_PALETTE;

export const T: Record<PaletteKey, string> = {
  bg:        'var(--qa-bg)',
  surface:   'var(--qa-surface)',
  surface2:  'var(--qa-surface2)',
  border:    'var(--qa-border)',
  borderHi:  'var(--qa-borderHi)',
  text:      'var(--qa-text)',
  subtle:    'var(--qa-subtle)',
  muted:     'var(--qa-muted)',
  champagne: 'var(--qa-champagne)',
  green:     'var(--qa-green)',
  red:       'var(--qa-red)',
  warning:   'var(--qa-warning)',
  blue:      'var(--qa-blue)',
  // 액센트(champagne/green/warning 등) 솔리드 버튼·배지 위 텍스트.
  // 테마 따라 반전(다크=near-black/라이트=white): '#0a0908'·'#fff' 하드코딩 금지.
  onAccent:  'var(--qa-on-accent)',
};

// next/font/local 로 self-host 된 Pretendard Variable 을 CSS variable 로 받는다.
// (`--qa-font-pretendard` 는 lib/fonts.ts 에서 설정됨)
//
// 디자인 결정 (2026-05 단순화):
//   ▶ 메인 앱은 **Pretendard 단일 글꼴**: 한글/영문 일관성 최우선.
//   ▶ "디스플레이" 톤 (헤딩, KPI 값) 은 별도 글꼴 대신
//     fontWeight 700 + tight letter-spacing(-0.02em) + tabular-nums 로 표현.
//   ▶ F.mono 는 ASCII 만 JetBrains Mono 로 렌더, 한글 글자는 Pretendard 로
//     자동 폴백되도록 체인 구성 (코드 블록·뱃지·라벨 전용).
//   ▶ Cormorant Garamond 같은 영문 세리프는 한글과 시각 무게가 안 맞아
//     혼용 헤딩에서 영문만 가는 이탈릭처럼 튀는 문제 → 메인 앱에서 제거.
//     (외부 전문가 포털 `app/experts/*` 만 영문 위주라 별도 로드 유지.)
const PRETENDARD =
  "var(--qa-font-pretendard), 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', 'Noto Sans KR', sans-serif";

export const F = {
  /** 본문/UI/헤딩: Pretendard 단일. weight 로 위계 표현. */
  serif: PRETENDARD,
  /** 본문/UI 별칭: serif 와 동일. */
  ui: PRETENDARD,
  /** 모노스페이스: ASCII 는 JetBrains Mono, 한글은 Pretendard 폴백. */
  mono:
    "'JetBrains Mono', 'Consolas', 'Menlo', ui-monospace, var(--qa-font-pretendard), 'Pretendard Variable', monospace",
  /**
   * 럭셔리 디스플레이 세리프 (Cormorant Garamond): "얼굴" 화면(로그인·랜딩 히어로)의
   * **영문 위주** 대형 디스플레이 텍스트 전용. lib/fonts.ts 에서 --qa-font-cormorant 로
   * self-host(root layout 전역). italic 미로드(브랜드 규칙).
   *
   * ⚠️ 본문·라벨·페이지 헤딩(TYPE.h1/h2/…)에는 쓰지 말 것: 그건 Pretendard 단일
   *    정책(F.serif). 한글이 섞이면 Cormorant 가 한글을 지원 못 해 폴백이 튄다.
   *    이 토큰은 영문 히어로 한 줄 같은 의도적 디스플레이 지점에만.
   */
  // 🔴 2026-09-24 오너 규칙: 한글 명조 금지. 한글 폴백은 'Noto Serif KR' 이 아니라 Pretendard
  //    (expert-theme.css 의 --serif 와 같은 순서: 라틴 얼굴 바로 뒤에 Pretendard).
  //    이 파일은 요구사항 엔진의 검증 의존 파일이라 매니페스트를 함께 다시 만들었다(오너 결정).
  display:
    "var(--qa-font-cormorant), 'Cormorant Garamond', var(--qa-font-pretendard), 'Pretendard Variable', Pretendard, Georgia, serif",
};

// ─────────────────────────────────────────────────────────────────────────────
// BREAKPOINTS: mobile-first 기준점.
// 사용처에서 미디어 쿼리 문자열로 합성: ``${media.md} { ... }`` (CSS-in-JS) 또는
// CSS 모듈에서 직접 사용.
// ─────────────────────────────────────────────────────────────────────────────
export const BP = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type BpKey = keyof typeof BP;

// ─────────────────────────────────────────────────────────────────────────────
// SPACING RHYTHM: 4px base + 2px 하프스텝(.5 키).
// `S[4]` = 16, `S[3.5]` = 14 처럼 키로 참조. 하프스텝(2·6·10·14·18·22)은 럭셔리
// 에디토리얼 리듬: 디자인 감사 2단계에서 공용 컴포넌트 실사용값을 흡수하기 위해 추가
// (4px 그리드 밖 비표준 px 를 토큰으로 표현 가능 → 공용 컴포넌트가 S 를 소비·전파).
// ─────────────────────────────────────────────────────────────────────────────
export const S = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  4.5: 18,
  5: 20,
  5.5: 22,
  6: 24,
  6.5: 26,
  7: 28,
  7.5: 30,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  18: 72,
  20: 80,
  24: 96,
} as const;

export type SpaceKey = keyof typeof S;

// ─────────────────────────────────────────────────────────────────────────────
// FONT SIZE SCALE: 기능적(비의미) 폰트 사이즈 사다리. S 간격 토큰과 동일 취지:
// raw px 사다리(9·10·11·12·13·14…)를 **값 그대로** 흡수해 시각 변화 0 으로 중앙화.
// 앱 실측상 이 미세 사이즈들은 본문·라벨·캡션·표·글리프를 넘나들어 '단일 의미' 가
// 아니므로(의미 토큰 TYPE 로 강제하면 크기 왜곡·한글 자간 붕괴) 값보존 스케일로 담는다.
//   ▶ 의미가 하나로 수렴하는 텍스트(헤딩·본문·모달타이틀·mono 라벨)는 FS 가 아니라
//     TYPE / typeStyle() 을 쓴다(굵기·줄간격·자간까지 통일). 헤딩은 clamp 반응형이라
//     FS(고정 px)로 넣지 말 것.
//   ▶ 참조는 브래킷 키: `fontSize: FS[12]`. (식별자라 no-raw-scale FONT_RE 회피 →
//     치환 시 baseline_font 자연 감소, 시각 0. S[*] 가 SPACING_RE 회피하는 것과 동형.)
//   ▶ rem 아닌 **px 숫자**: rem 이면 사용자 브라우저 폰트 확대 시 배지·pill 이 넘침.
//   ▶ 🔴 **half-step(.5)은 없앴다** (2026-08-21, 오빠 지적 「글씨 크기가 들쑥날쑥」).
//     원래는 「럭셔리 미세조정·터치타깃 보강값 흡수용」이었으나, 실측하니 그 용도로
//     쓰이지 않고 **표류값**이 됐다. 대시보드 한 화면에서만 크기가 12종이었고,
//     같은 역할의 대문자 라벨이 9 · 10 · 10.5 · 11.5 네 가지로 갈려 있었다.
//     0.5px 차이는 **어떤 위계도 만들지 못하면서 «맞추려다 만» 인상만 남긴다.**
//     331곳을 올림으로 접었다(10.5→11 · 11.5→12 · 12.5→13 · 13.5→14 · 9.5→10 …).
//     올림 방향인 이유: 2026-08-20 감사에서 「9~11px 가 전체의 59%」로 글씨가 전반적으로
//     작다는 지적이 있었기 때문이다.
//     ★ 키를 **지운 것 자체가 가드다**: 0.5 를 다시 쓰면 타입 에러로 즉시 막힌다.
// ─────────────────────────────────────────────────────────────────────────────
// ─ 2026-10-26 오너 결정(Q-Design 03 «크기 9단»): 12 · 14 · 16 · 18 · 20 · 24 · 28 · 32 · 40 만 남겼다.
//   사이 값은 큰 쪽으로 접었다(13→14 · 15→16 · 17→18 · 19→20 · 22→24 · 26→28 · 30→32 · 36 · 38 · 48→40).
//   1px 차이는 눈으로 갈리지 않아 단계만 늘렸다. 12 미만(8~11)은 화면에 쓰지 않아(보조 글씨 최소 12px) 함께 지웠다.
//   ★ 하프스텝 때처럼 키를 지운 것이 가드다. 사이 값을 다시 쓰면 타입 에러로 막힌다.
export const FS = {
  12: 12, 14: 14, 16: 16, 18: 18, 20: 20,
  24: 24, 28: 28, 32: 32, 40: 40,
} as const;

export type FontSizeKey = keyof typeof FS;

// ─────────────────────────────────────────────────────────────────────────────
// LH: 무단위 줄간격(leading) 사다리. FS(크기)의 짝.
// 2026-08-06 디자인 감사 실측: 같은 12px 문장이 화면마다 1.5~1.8 로 갈려 있었고
// (1.6×230 · 1.7×117 · 1.5×111), tokens 에 lineHeight 축 자체가 없었다.
// 값을 바꾸지 않고 이름만 붙여 이후 조정 지점을 한 곳으로 모은다.
//
//   ▶ 선언 위치는 **TYPE(:240 이하) 보다 반드시 위**. 후속 라운드에서 TYPE 의
//     lineHeight 를 LH 로 배선할 때, 아래에 두면 TDZ(ReferenceError: Cannot access
//     'LH' before initialization)로 tokens 를 import 하는 앱 전역이 죽는다. 제약이다.
//   ▶ `none: 1` 은 비율이 아니라 **정렬 리셋**: 아이콘·글리프·버튼의 상하 여백 제거용.
//     문장에는 쓰지 말 것.
//   ▶ 대상은 무단위 숫자만. `lineHeight: '56px'`(minHeight 와 짝지은 수직중앙정렬)과
//     `lineHeight: 0`(flex 아이콘 래퍼 디센더 제거)은 이 스케일 밖이다.
//   ▶ 미포함 표류값(1.55·1.65·1.45·1.75·1.35 등)은 키를 만들지 않는다:
//     접기는 육안 확인이 필요해 별도 라운드로 둔다.
// ─────────────────────────────────────────────────────────────────────────────
// ─ 2026-10-26 오너 결정(Q-Design 03 «줄 간격 세 값»): 큰 글(20px 이상) 1.2 · 한 줄 글 1.4 · 문단과 목록 1.6.
//   1 은 비율이 아니라 정렬 리셋이라 따로 둔다. 지운 키는 이렇게 접었다:
//   normal(1.5) · notice(1.55) · loose(1.7) → relaxed · heading(1.3) → snug(20px 이상 글이면 tight).
export const LH = {
  /** 정렬 리셋: 아이콘·버튼·대형 숫자 (비율 아님) */
  none: 1,
  /** 큰 글(20px 이상): 제목 · 큰 숫자 */
  tight: 1.2,
  /**
   * 한 줄 글: 배지 · 칩 · 라벨 · 카드/목록 제목 · 표.
   *
   * ⚠️ 이 값으로 배지 «높이» 가 정해질 수 있다(Tag 크기마다 글자 × 1.4 + 위아래 여백 + 테두리 와
   *   minHeight 중 큰 쪽). lib/design/tag-metrics.test.ts 가 그 사슬을 잠근다. 바꾸면 거기서 알려준다.
   */
  snug: 1.4,
  /** 문단과 목록: 설명 · 안내문 · 긴 글 (body 상속 기준선) */
  relaxed: 1.6,
} as const;

export type LineHeightKey = keyof typeof LH;

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT: 페이지 셸(중앙정렬 컨테이너) 최대폭. BP(뷰포트 기준점)의 짝인 "컨테이너 폭" 차원.
// 화면이 읽는 값은 q-design-runtime.ts 의 LAYOUT(정본 source/design/atelier-runtime.ts)이고,
// 이것은 정본 토큰 추출기가 함께 읽는 사본이라 같은 값을 둔다(추출기는 런타임 값을 우선한다).
//
// 2026-08-06 에 생성폼 720 · 기록상세 820 · 2단 1140 을 토큰으로 묶었으나, 2026-10-27 오너 결정
// «3»(상세 · 폼은 꽉 채움 + 칸 자동)으로 셋 다 걷었다. 상세 · 폼 화면은 공용 틀 PageShell 에 두고
// 칸은 Fields 격자에 놓는다(lib/design/components.tsx). 좁히는 것은 현장 모드뿐이다.
// 다시 좁히면 page-shell-contract 가 막는다.
// ─────────────────────────────────────────────────────────────────────────────
export const LAYOUT = {
  /** 현장모드(PDA) 셸: app/(app)/m/* */
  mobile: 520,
} as const;

export type LayoutKey = keyof typeof LAYOUT;

// ─────────────────────────────────────────────────────────────────────────────
// TOUCH TARGET: WCAG 2.2 (44×44) + iOS HIG.
// ─────────────────────────────────────────────────────────────────────────────
export const TOUCH = {
  min: 44,
  comfortable: 48,
} as const;

export const alpha = (color: string, a: number): string => {
  const clampedA = Math.max(0, Math.min(1, a));
  if (typeof color === 'string' && color.startsWith('#') && color.length === 7) {
    const hexA = Math.round(clampedA * 255).toString(16).padStart(2, '0');
    return color + hexA;
  }
  const pct = Math.round(clampedA * 100);
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
};

// 위험도 네 단계 (2026-10-27 오너 결정 · Q-Design 02 «위험도 색»).
// 종전에는 red · warning · champagne · green 을 빌려 썼고 높음과 중간이 거의 같은 색이었다.
// 단계마다 값이 둘이다. 막대 · 점은 fill, 글자 · 배지 · 큰 숫자는 text.
// 라이트의 높음 · 중간 fill 은 흰 면 위 3.30 · 1.92 라 글자로 쓰면 안 된다.
export const RISK = {
  critical: { fill: 'var(--qa-risk-critical)', text: 'var(--qa-risk-critical-text)' },
  high:     { fill: 'var(--qa-risk-high)',     text: 'var(--qa-risk-high-text)' },
  medium:   { fill: 'var(--qa-risk-medium)',   text: 'var(--qa-risk-medium-text)' },
  low:      { fill: 'var(--qa-risk-low)',      text: 'var(--qa-risk-low-text)' },
} as const;

const riskOf = (risk: string) => {
  switch (risk?.toUpperCase()) {
    case 'CRITICAL': return RISK.critical;
    case 'HIGH':     return RISK.high;
    case 'MEDIUM':   return RISK.medium;
    case 'LOW':      return RISK.low;
    default:         return null;
  }
};

/** 위험도 글자 · 배지 · 큰 숫자 색. 모든 면과 배지면에서 4.5 이상. */
export const riskColor = (risk: string): string => riskOf(risk)?.text ?? T.muted;

/** 위험도 막대 · 점 색. 글자에 쓰지 말 것. */
export const riskFill = (risk: string): string => riskOf(risk)?.fill ?? T.muted;

// ─────────────────────────────────────────────────────────────────────────────
// LUXE TYPOGRAPHY SCALE: 위계 컨트라스트 강화 (2026-05-27 럭셔리 톤 재검토)
// 본문 vs heading weight 차이를 명확히: 럭셔리 호텔 카탈로그 톤.
//
// 2026-10-26 오너 결정(Q-Design 03): 크기는 9단 사다리 위에서만, 굵기는 600 까지, 줄 간격은 LH 세 값.
// rem 기준은 html 의 16px 이다(Q-Design 03 «기준 크기» · 운영 화면 실측). body 의 14px 와 섞어 환산하지 말 것.
// ─────────────────────────────────────────────────────────────────────────────
export const TYPE = {
  /** 디스플레이: 랜딩/세션 헤더 (사다리 맨 위 40px) */
  display: {
    fontFamily: F.serif,
    fontSize: '2.5rem',
    fontWeight: 600,
    letterSpacing: '-0.02em',
    lineHeight: LH.tight,
  },
  /** H1: 페이지 타이틀 (폰 28 ~ 넓은 화면 40) */
  h1: {
    fontFamily: F.serif,
    fontSize: 'clamp(1.75rem, 1.25rem + 1.5vw, 2.5rem)',
    fontWeight: 600,
    letterSpacing: '-0.015em',
    lineHeight: LH.tight,
  },
  /** H2: 섹션 타이틀 (20 ~ 24) */
  h2: {
    fontFamily: F.serif,
    fontSize: 'clamp(1.25rem, 1rem + 0.8vw, 1.5rem)',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    lineHeight: LH.tight,
  },
  /** H3: 카드 헤더 (18) */
  h3: {
    fontFamily: F.serif,
    fontSize: '1.125rem',
    fontWeight: 600,
    letterSpacing: '-0.005em',
    lineHeight: LH.snug,
  },
  /** Body: 본문 (16) */
  body: {
    fontFamily: F.serif,
    fontSize: '1rem',
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: LH.relaxed,
  },
  /** Caption: 보조 정보 (14) */
  caption: {
    fontFamily: F.serif,
    fontSize: '0.875rem',
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: LH.relaxed,
  },
  /** Mono: 코드/라벨/뱃지 (12) */
  mono: {
    fontFamily: F.mono,
    fontSize: '0.75rem',
    fontWeight: 500,
    letterSpacing: '0.08em',
    lineHeight: LH.snug,
    textTransform: 'uppercase' as const,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 라벨 자간: 한글에는 트래킹을 주지 않는다
// ─────────────────────────────────────────────────────────────────────────────
// 🔴 2026-08-21 오빠 지적: 「전 페이지에서 나오는 안내 문구가 자연스러운 형태로
//    표기되고 있는지」: 화면에서 「오늘  처리할  것」·「모든  권한  공통」처럼
//    **자간이 벌어져** 보였다.
//
// 원인: `letterSpacing` + `uppercase` + mono 는 **영문 약어 라벨**(ISO·CAPA·RA)을 위한
// 조합이다. 라틴 대문자는 벌려야 읽히지만, **한글은 벌리면 낱글자로 흩어진다.**
// (`uppercase` 는 한글에 아무 효과도 없어 «있어도 그만» 인데, 트래킹만 남아 해를 끼친다.)
//
// 실측: mono + 자간 ≥ 1px 이 한글에 걸린 곳이 **166곳 / 93개 파일**.
// 그중 `SectionTitle`(자간 2.2)이 전 페이지 섹션 헤더라 가장 넓게 퍼져 있었다.
// 게다가 그 값들은 정식 토큰 `TYPE.mono`(0.08em ≈ 0.8px)보다 **두 배 이상 넓다**:
// 토큰이 있는데 손으로 적은 사본이 더 벌어진, 이 저장소의 단골 형태다.
//
// 규칙: **라벨 문구에 한글이 있으면 자간 0.** 영문만이면 트래킹을 그대로 준다.

/** ReactNode 안에 한글이 있는지: 문자열·배열·element children 을 훑는다. */
export function hasHangul(node: unknown): boolean {
  if (node == null || typeof node === 'boolean') return false;
  if (typeof node === 'string') return /[가-힣]/.test(node);
  if (typeof node === 'number') return false;
  if (Array.isArray(node)) return node.some(hasHangul);
  const props = (node as { props?: { children?: unknown } }).props;
  return props ? hasHangul(props.children) : false;
}

/**
 * 라벨 자간 결정: 한글이 섞이면 0, 아니면 주어진 값.
 *
 * @example letterSpacing: labelTracking(children, 2.2)
 */
export function labelTracking(
  node: unknown,
  value: number | string = '0.08em',
): number | string {
  return hasHangul(node) ? 0 : value;
}

/**
 * 한글 이름표의 «어절 공백». 모노 글꼴이 걸린 자리에서만 쓴다.
 *
 * 🔴 2026-09-09 감사(주제 #1). 자간과 대문자를 풀어도 «공백»이 남는다.
 *    한글 «글자» 자체는 폴백(Pretendard)이 그려서 폭이 같은데, 어절 사이 공백은
 *    모노가 그린다. 실측: 10px 에서 JetBrains Mono 6px · Pretendard 2.51px 로
 *    두 배 넘게 벌어진다. 그래서 「자간 0 · 대문자 없음」인데도
 *    「오늘  먼저  할  일」처럼 보인다. 자간만 세는 검사는 이것을 0곳으로 본다.
 *
 *    글꼴을 바꾸지 않고 «공백 폭만» 되돌린다. 그래야 「생산 로트 LOT-2026-004」
 *    같은 섞인 이름표에서 코드가 모노로 남는다.
 *    0.6em - 0.35em = 0.25em 이라 본문 글꼴 공백과 맞는다.
 *
 * ⚠️ **모노가 아닌 요소에 걸면 안 된다.** word-spacing 은 상속 속성이라
 *    본문 글꼴 자리에 -0.35em 을 걸면 어절이 겹친다. 실제로 이 저장소에서
 *    labelTracking 을 쓰는 38자리 중 셋(Button · /audit 두 곳)은 `F.ui` 라
 *    일부러 빼 두었다. 붙일 때는 같은 style 에 `fontFamily: F.mono` 가
 *    있는지 먼저 볼 것.
 *
 * 🔑 정본(Q-Design)은 같은 값을 CSS 변수 `--qd-hangul-word-space` 로 낸다.
 *    이 저장소는 정본 CSS 를 안 쓰므로 여기서 같은 폭을 든다.
 *
 * @example wordSpacing: labelWordSpacing(children)
 */
export const HANGUL_WORD_SPACE = '-0.35em';

export function labelWordSpacing(node: unknown): string | undefined {
  return hasHangul(node) ? HANGUL_WORD_SPACE : undefined;
}

/**
 * 라벨 대소문자 결정: 한글이 섞이면 'none', 아니면 'uppercase'.
 *
 * 🔴 **`undefined` 를 돌려주면 안 된다** (2026-09-09 감사 · 주제 #7).
 *    `textTransform` 은 **상속 속성**이다. `hasHangul(x) ? undefined : 'uppercase'` 는
 *    자기 값을 «안 적을» 뿐이라 부모의 uppercase 가 그대로 내려온다.
 *    실측: 자기 style 에 textTransform 이 없는 한글 span(「미시작」)이 화면에서
 *    uppercase 로 잡혔다. 끊으려면 'none' 을 «적어야» 한다.
 *
 * ⚠️ 이 함수는 **그 요소 자신만** 푼다. 부모에 uppercase 를 걸고 자식 라틴이
 *    그것을 받아 쓰는 자리는 부모를 건드리지 말 것. 부모를 풀면 형제 라틴이
 *    함께 소문자가 된다.
 *
 * @example textTransform: labelCase(children)
 */
export function labelCase(node: unknown): 'uppercase' | 'none' {
  return hasHangul(node) ? 'none' : 'uppercase';
}

// ─────────────────────────────────────────────────────────────────────────────
// RADIUS: rounded-[10px] 단일 통일 (럭셔리 비례: 8과 12 사이)
// 기존 rounded-lg(8) / rounded-xl(12) 혼재 정리.
// ─────────────────────────────────────────────────────────────────────────────
export const RADIUS = {
  sm: 6,
  md: 10,    // ← 럭셔리 표준: 모든 카드/버튼/입력
  lg: 14,
  xl: 20,
  pill: 9999,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// MOTION: 절제된 럭셔리 이징 (회전 금지, scale 금지)
// ─────────────────────────────────────────────────────────────────────────────
export const MOTION = {
  /** 가장 빠른 마이크로 인터랙션 (hover color shift) */
  instant: '120ms cubic-bezier(0.16, 1, 0.3, 1)',
  /** 표준: 모달 페이드, 카드 호버 */
  fast: '200ms cubic-bezier(0.16, 1, 0.3, 1)',
  /** 표준 진입: 페이지 전환, 드로어 */
  normal: '320ms cubic-bezier(0.16, 1, 0.3, 1)',
  /** 우아한 진입: 1회성 강조 */
  slow: '480ms cubic-bezier(0.16, 1, 0.3, 1)',
  /** Easing 키 */
  easeOutExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// SHADOW: 2-layer 럭셔리 그림자 (얕은 광택 + 깊은 anchor)
// 모든 색은 oklch 또는 rgba: 알파 채널 컨트롤로 미세 톤.
// ─────────────────────────────────────────────────────────────────────────────
export const SHADOW = {
  /** Hairline: 카드/입력 기본 */
  hairline:
    '0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 1px 2px rgba(0, 0, 0, 0.2)',
  /** Surface: 떠있는 카드 (호버) */
  surface:
    '0 1px 0 rgba(255, 255, 255, 0.05) inset, 0 4px 16px -4px rgba(0, 0, 0, 0.35)',
  /** Float: FAB, 모달 본체 */
  float:
    '0 1px 0 rgba(255, 255, 255, 0.06) inset, 0 12px 32px -8px rgba(0, 0, 0, 0.45)',
  /** Anchor: 드롭다운, 풀스크린 시트 */
  anchor:
    '0 1px 0 rgba(255, 255, 255, 0.06) inset, 0 20px 60px -20px rgba(0, 0, 0, 0.55)',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// STATE: 워크플로/문서 상태 색 (테마 인지). 디자인 감사 1단계: globals.css 의
//   --qa-state-* 를 tokens 표면으로 승격(분할 색 출처 닫기). workflow-states.ts·
//   doc-status-labels.ts 등이 raw var(--qa-state-*) 대신 STATE.* 로 참조 → 타입
//   안전·자동완성·일원 관리. 라이트/다크 값은 globals.css 가 var() 로 해소(AA 튜닝).
// ─────────────────────────────────────────────────────────────────────────────
export const STATE = {
  gray: 'var(--qa-state-gray)',     // draft / not_started / NA
  cobalt: 'var(--qa-state-cobalt)', // preview_review / reviewed
  copper: 'var(--qa-state-copper)', // under_review / in_progress
  gold: 'var(--qa-state-gold)',     // final_decision / review
  violet: 'var(--qa-state-violet)', // execution_tracking / waived
  green: 'var(--qa-state-green)',   // completed / approved
  red: 'var(--qa-state-red)',       // cancelled
} as const;
export type StateKey = keyof typeof STATE;

// ─────────────────────────────────────────────────────────────────────────────
// OVERLAY: 모달/시트 백드롭 (테마 인지). globals.css --qa-backdrop* 승격.
// ─────────────────────────────────────────────────────────────────────────────
export const OVERLAY = {
  backdrop: 'var(--qa-backdrop)',
  backdropStrong: 'var(--qa-backdrop-strong)',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// ELEVATION: 테마 인지 깊이 그림자 (globals.css --qa-shadow-* 승격).
//   ★ SHADOW(위)는 다크 고정 rgba: 떠있는 요소/모달/드로어/드롭다운은 라이트
//   테마까지 대응하는 ELEVATION 을 쓴다(테마 인지 단일 출처). 신규 코드 권장.
// ─────────────────────────────────────────────────────────────────────────────
export const ELEVATION = {
  sm: 'var(--qa-shadow-sm)',
  md: 'var(--qa-shadow-md)',
  lg: 'var(--qa-shadow-lg)',
  xl: 'var(--qa-shadow-xl)',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Z: 스태킹(레이어) 스케일 SSOT. z-index 매직넘버(1·50·1000·9999) 산재 방지.
//   떠있는 UI 는 raw 숫자 대신 Z.* 로: 충돌 방어·일관 순서.
// ─────────────────────────────────────────────────────────────────────────────
export const Z = {
  base: 1,
  dropdown: 50,
  sticky: 100,
  header: 200,
  /*
   * 🔴 2026-09-09 감사(주제 #9)에서 실측으로 찾은 것.
   *    떠 있는 층이 사다리에 «칸이 없어서» 각자 숫자를 지어냈다. 이 파일을 부르는
   *    곳은 3곳뿐이고 raw zIndex 리터럴은 58곳이었다. 그 결과 390px 화면에서
   *    Ctrl+K 로 전역 검색을 열면 백드롭(100)·패널(110) 위에 햄버거(150)가 남아
   *    **어두워진 화면에 단추 하나만 밝게 떠 있었다**(elementFromPoint 로 실측).
   *
   * 🔑 칸을 «만들어» 준다. 없는 칸은 지어내진다.
   */
  fab: 300,            // 떠 있는 단추 (AIQuickAccessFab)
  bottomNav: 400,      // 모바일 아래 탭줄
  drawerFab: 500,      // 서랍 여는 햄버거
  drawerBackdrop: 600, // 서랍 백드롭
  drawer: 700,         // 서랍 본체
  overlay: 1000,   // 모달 백드롭
  modal: 1100,     // 모달 본체
  popover: 1200,   // 팝오버
  tooltip: 9999,   // 최상위 힌트 (기존 KPI 툴팁 관행 보존)
  /*
   * ── 꼭대기 세 칸 ────────────────────────────────────────────────────────
   * 🔴 2026-09-10 실측으로 다시 정한 자리다. 종전 사다리는 toast 1300 · tooltip 9999
   *    였는데, **toast · tooltip · popover 를 부르는 곳이 한 곳도 없었다.**
   *    대신 여덟 곳이 raw 9999 를 적어 두고 서로 같은 값으로 겹쳐 있었다
   *    (Toast · SessionIdleMonitor · RdDocumentFlowPanel 3 · DocChecklistPanel ·
   *     TodayQueue · components.tsx). 값이 같으면 순서는 DOM 이, 즉 «우연» 이 정한다.
   *
   * 그래서 사다리를 현실에 맞춘다. 위로 갈수록 «가려지면 안 되는 정도» 다.
   */
  /** 실패 메시지는 모달 위에서도 읽혀야 한다. 종전에는 9999 로 여덟과 동점이었다 */
  toast: 10000,
  /** 파괴 확인. 「지울까요?」를 물으면서 그 위에 다른 것이 뜨면 안 된다 */
  blocking: 10001,
  /** 로그인이 풀렸다는 사실. 그 위의 어떤 것도 더는 뜻이 없다 */
  sessionGate: 10002,
} as const;
export type ZKey = keyof typeof Z;

// ─────────────────────────────────────────────────────────────────────────────
// ICON: lucide-react strokeWidth + size 표준화
// ─────────────────────────────────────────────────────────────────────────────
export const ICON = {
  strokeWidth: 1.5,        // ← 럭셔리 hairline (이전 2.0 → 1.5 톤 다운)
  strokeWidthThin: 1.25,   // 매우 절제된 톤 (heading 옆 등)
  sizeXs: 14,
  sizeSm: 16,
  sizeMd: 20,    // button 표준
  sizeLg: 24,    // header 표준
  sizeXl: 32,    // empty state 표준
  size2xl: 48,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS: typography style → React.CSSProperties 변환
// ─────────────────────────────────────────────────────────────────────────────
import type { CSSProperties } from 'react';

export function typeStyle(key: keyof typeof TYPE): CSSProperties {
  const t = TYPE[key];
  return { ...t } as CSSProperties;
}

// ─────────────────────────────────────────────────────────────────────────────
// BRAND: medqraft.co.kr(랜딩)과 공유하는 패밀리 모티프 (2026-06-10 A안)
// 랜딩 실측: bg #0c0c0c·text #f0ebe0·Pretendard·easeOutExpo 까지 이미 동일:
// 여기는 마지막 연결고리(골드 그라디언트·태그라인)만 토큰화한다.
// ⚠️ 적용 범위 = "얼굴" 화면(로그인·환영·포털 히어로)의 디스플레이 요소 한정.
//    업무 화면(대시보드·폼·패널)은 절제 유지: 단색 champagne 그대로.
// ─────────────────────────────────────────────────────────────────────────────
export const BRAND = {
  /**
   * 랜딩 골드 그라디언트(--gold-gradient) 의 토큰판: champagne 변수 기반
   * color-mix 합성이라 다크/라이트 테마 자동 대응(라이트의 진한 champagne 도 유지).
   */
  goldGradient:
    'linear-gradient(135deg, var(--qa-champagne) 0%, color-mix(in oklab, var(--qa-champagne) 55%, white) 50%, color-mix(in oklab, var(--qa-champagne) 82%, black) 100%)',
  /** 브랜드 태그라인: 랜딩 로고 서브와 동일 문구. */
  tagline: 'Documents precise. Systems adaptive.',
} as const;

/**
 * 디스플레이 헤딩용 골드 그라디언트 텍스트.
 * 큰 장식 텍스트(WCAG 장식 예외 급) 에만: 본문·라벨엔 금지(가독성).
 */
export function goldTextStyle(): CSSProperties {
  return {
    backgroundImage: BRAND.goldGradient,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  };
}
