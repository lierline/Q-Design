// =============================================================================
// Q-Design 문서 토큰 · 생성물
// =============================================================================
// 손으로 고치지 마세요. Q-Design 에서 `node tools/extract-doc.mjs` 를 돌려 만듭니다.
// 웹 라이트 팔레트에서 파생되므로, 색을 바꾸려면 거기를 바꾸고 다시 내보냅니다.
//
// ⚠️ 종이는 면이 둘입니다: 흰 종이와 음영 표(#f3f1ec).
//    음영 표 위가 더 어렵습니다. 흰 배경만 보고 색을 고르면 표 안에서 미달합니다.
//
// 색은 OOXML 표기(# 없는 6자 대문자)입니다.

export const DOC_COLOR = {
  champagne: '805F32',  // 흰 5.83 · 음영 5.17
  champagneSoft: 'B8935A',
  ink: '1C1A16',  // 흰 17.37 · 음영 15.39
  inkSubtle: '4A4540',  // 흰 9.47 · 음영 8.39
  inkMuted: '726B5E',  // 흰 5.28 · 음영 4.67
  border: 'C8C4BA',
  borderSoft: 'E2DFD8',
  frame: '726B5E',  // 흰 5.28 · 음영 4.67
  paper: 'FAF9F6',
  surface: 'FFFFFF',
  surfaceAlt: 'F3F1EC',
  red: 'A83838',  // 흰 6.39 · 음영 5.66
  green: '3D7A3D',  // 흰 5.19 · 음영 4.59
  warning: '97621F',  // 흰 5.14 · 음영 4.56
  blue: '2D5FA8',  // 흰 6.34 · 음영 5.61
} as const;

/** Word 는 Pretendard 미설치 시 한글을 명조로 대체합니다. eastAsia 를 못박습니다. */
export const DOC_FONT = {
  sans: { ascii: 'Pretendard', hAnsi: 'Pretendard', eastAsia: 'Malgun Gothic' },
  serif: { ascii: 'Pretendard', hAnsi: 'Pretendard', eastAsia: 'Malgun Gothic' },
  mono: 'Consolas',
} as const;

/** DOCX 는 half-point(pt×2). 화면 px 사다리와 다른 축입니다. */
export const DOC_SIZE = {
  coverTitle: 56, // 28pt
  h1: 32, // 16pt
  h2: 26, // 13pt
  h3: 22, // 11pt
  body: 20, // 10pt
  caption: 18, // 9pt
  label: 16, // 8pt
  footer: 14, // 7pt
} as const;

/** twip = pt × 20 */
export const DOC_SPACING = {
  pageMarginTop: 1020,
  pageMarginSide: 907,
  pageMarginBottom: 1247,
  paraAfter: 120,
  paraAfterHeading: 200,
  lineBody: 276,
  lineNotice: 312,
} as const;

export const DOC_RULE = {
  accentBarWidthTwip: 640,
  hairlineSize: 4,
  frameSize: 8,
} as const;
