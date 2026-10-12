// =============================================================================
// 내보낼 조각과 받는 곳 (sync.mjs · refresh-source.mjs 가 함께 읽습니다)
// =============================================================================
// 새 조각이나 새 제품이 늘면 여기에 한 줄 더합니다.
//
// 🔑 src 가 `source/…` 인 조각은 «여기(Q-Design)가 원본» 입니다. refresh-source 는 이 목록에서
//    그 파일들을 골라, 원본 갱신 때 덮거나 고아로 지우지 않습니다. 종전에는 그 목록을 따로 손으로
//    적어 두어, 새 부품을 넣을 때마다 두 곳을 고쳐야 했습니다(2026-09-25 여기로 모음).
//
// 2026-09-20: Q-Works(ISO 9001 판 · 지금 이름 Q-Maison)가 넷째 제품으로 늘었습니다. Login 에서
// 복제해 온 터라 원본의 짜임을 아직 들고 있고, 이 세 벌로 얼굴을 맞춥니다.
// 받는 쪽 경로가 저장소마다 다른 것은 폴더 구조가 달라서입니다(Next 의 app 위치).
// =============================================================================

/*
 * ── 묶어 둠 (HOLD · 2026-09-28) ─────────────────────────────────────────────────
 * 오너가 «이 제품에는 정본 변경을 내보내지 말라» 고 정한 조각. sync --write 가 이 제품의 이 조각은
 * 건너뛰고 「묶어 둠」 이라고 알립니다(지문이 어긋난 채 남아 잊히지 않습니다). parts 가 '*' 면 모든 조각.
 *
 * Q-Works(Q-Maison) · Q-Forge(Q-Carnet): 2026-09-28 동결, 2026-10-04 오너가 «동결 줄 전체 해제» 를 선택해 풀었다
 *   (연동 규약 조각을 내보내기 위해 물은 자리). 이 두 줄은 이제 없다.
 *
 * (해제됨 2026-10-10) Q-Sonar: 보조 글씨 최소 12px · 대비 4.5 규칙(오너 결정 2026-09-27 · 화면 검토 M77 · M43)을
 *   «세 제품(Q-Atelier · Q-Maison · Q-Carnet)» 에만 적용하기로 했다(2026-09-28 오너 결정 «Q-Sonar 는 빼기»).
 *   화면 정본 세 조각은 그 규칙이 들어간 판부터 Q-Sonar 로 나가지 않는다. 🔴 그 뒤의 다른 정본 변경도
 *   Q-Sonar 로는 안 간다. 풀려면 오너께 여쭌 뒤 이 줄을 지우고 sync --write 를 돌린다.
 */
export const HOLD = {};  // 2026-10-10 오너가 Q-Sonar 묶음을 풀었다(구역 제목 C안 반영 때 «정본 전부 받기» 선택). 12px · 대비 4.5 규칙도 Sonar 에 들어간다.

export const PARTS = [
  { name: '공통 당겨서 새로고침 표시', src: 'dist/q-design.pull.ts', lang: 'ts',
    to: { 'Q-Works': 'D:/Claude/Q-Works/lib/design/q-design-pull.ts' } },
  { name: '메종 생산 준비 표', src: 'patterns/foundation/maison-prep-table.css', layer: false,
    to: { 'Q-Works': 'D:/Claude/Q-Works/app/q-design.prep-table.css' } },
  { name: '메종 안전관리 인쇄 규칙', src: 'patterns/foundation/maison-safety-print.ts', lang: 'ts',
    to: { 'Q-Works': 'D:/Claude/Q-Works/lib/design/q-design-safety-print.ts' } },
  { name: '카르넷 기록 유형 명칭', src: 'dist/q-design.carnet-record-labels.ts', lang: 'ts',
    to: { 'Q-Forge': 'D:/Claude/DHR/lib/design/q-design-record-labels.ts' } },
  { name: '공통 모노 글꼴', src: 'dist/q-design.mono-fonts.css', layer: false,
    to: { 'Q-Works': 'D:/Claude/Q-Works/app/q-design.mono-fonts.css',
      'Q-Forge': 'D:/Claude/DHR/app/q-design.mono-fonts.css' } },
  { name: '권한 설명 문구', src: 'dist/q-design.permission-copy.maison.ts', lang: 'ts',
    to: { 'Q-Works': 'D:/Claude/Q-Works/lib/design/q-design-permission-copy.ts' } },
  { name: '차트 축 문장 배치', src: 'source/design/chart-layout.ts', lang: 'ts',
    to: { 'Q-Atelier': 'D:/Claude/Q-Atelier/lib/design/q-design-chart-layout.ts', 'Q-Works': 'D:/Claude/Q-Works/lib/design/q-design-chart-layout.ts' } },
  { name: '차트 실제 표시 폭', src: 'source/design/chart-viewport.ts', lang: 'ts',
    to: { 'Q-Works': 'D:/Claude/Q-Works/lib/design/q-design-chart-viewport.ts' } },
  { name: '아뜰리에 설명서 출력 규칙', src: 'patterns/foundation/atelier-manual.ts', lang: 'ts',
    to: { 'Q-Atelier': 'D:/Claude/Q-Atelier/lib/manual/q-design-styles.ts' } },
  { name: '아뜰리에 출력 규칙', src: 'source/design/atelier-output.ts', lang: 'ts',
    to: { 'Q-Atelier': 'D:/Claude/Q-Atelier/lib/design/q-design-output.ts' } },
  { name: '아뜰리에 라벨 글꼴', src: 'patterns/foundation/atelier-labels.ts', lang: 'ts',
    to: { 'Q-Atelier': 'D:/Claude/Q-Atelier/lib/design/q-design-labels.ts' } },
  { name: '아뜰리에 배경', src: 'patterns/foundation/atelier-backgrounds.tsx', lang: 'ts',
    to: { 'Q-Atelier': 'D:/Claude/Q-Atelier/lib/design/q-design-backgrounds.tsx' } },
  { name: '아뜰리에 HTML 팔레트', src: 'dist/q-design.html-palette.atelier.ts', lang: 'ts',
    to: { 'Q-Atelier': 'D:/Claude/Q-Atelier/lib/design/q-design-html-palette.ts' } },
  { name: '아뜰리에 HTML 스타일', src: 'patterns/foundation/atelier-html.ts', lang: 'ts',
    to: { 'Q-Atelier': 'D:/Claude/Q-Atelier/lib/design/q-design-html.ts' } },
  { name: '아뜰리에 접근 시뮬레이터', src: 'dist/q-design.simulator.atelier.html', lang: 'html', layer: false,
    to: { 'Q-Atelier': 'D:/Claude/Q-Atelier/public/__sim.html' } },
  { name: '메종 수치 규칙', src: 'patterns/foundation/maison-runtime.ts', lang: 'ts',
    to: { 'Q-Works': 'D:/Claude/Q-Works/lib/design/q-design-runtime.ts' } },
  { name: '메종 이메일 팔레트', src: 'dist/q-design.email-palette.maison.ts', lang: 'ts',
    to: { 'Q-Works': 'D:/Claude/Q-Works/lib/design/q-design-email-palette.ts' } },
  { name: '메종 이메일 스타일', src: 'patterns/foundation/maison-email.ts', lang: 'ts',
    to: { 'Q-Works': 'D:/Claude/Q-Works/lib/design/q-design-email.ts' } },
  { name: '아뜰리에 수치 규칙', src: 'source/design/atelier-runtime.ts', lang: 'ts',
    to: { 'Q-Atelier': 'D:/Claude/Q-Atelier/lib/design/q-design-runtime.ts' } },
  { name: '아뜰리에 오프라인 캐시', src: 'dist/q-design.offline-revision.atelier.js', lang: 'ts',
    to: { 'Q-Atelier': 'D:/Claude/Q-Atelier/public/q-design.offline-revision.js' } },
  { name: '아뜰리에 오프라인', src: 'dist/q-design.offline.atelier.html', lang: 'html', layer: false,
    to: { 'Q-Atelier': 'D:/Claude/Q-Atelier/public/offline.html' } },
  { name: '카르넷 런타임 팔레트', src: 'dist/q-design.palette.carnet.ts', lang: 'ts',
    to: { 'Q-Forge': 'D:/Claude/DHR/lib/design/q-design-palette.ts' } },
  { name: '카르넷 유틸리티', src: 'patterns/foundation/carnet-theme.css', layer: false,
    to: { 'Q-Forge': 'D:/Claude/DHR/app/q-design.theme.css' } },
  { name: '메종 출력 인자', src: 'patterns/foundation/maison-print.ts', lang: 'ts',
    to: { 'Q-Works': 'D:/Claude/Q-Works/lib/design/q-design-print.ts' } },
  { name: '메종 출력 스타일', src: 'patterns/foundation/maison-print-styles.tsx', lang: 'ts',
    to: { 'Q-Works': 'D:/Claude/Q-Works/components/print/print-styles.tsx' } },
  { name: '메종 유틸리티', src: 'patterns/foundation/maison-tailwind.ts', lang: 'ts',
    to: { 'Q-Works': 'D:/Claude/Q-Works/lib/design/q-design-tailwind.ts' } },
  { name: '기반 아뜰리에', src: 'dist/q-design.foundation.atelier.css', layer: false,
    to: { 'Q-Atelier': 'D:/Claude/Q-Atelier/app/q-design.foundation.css' } },
  { name: '기반 메종', src: 'dist/q-design.foundation.maison.css', layer: false,
    to: { 'Q-Works': 'D:/Claude/Q-Works/app/q-design.foundation.css' } },
  { name: '기반 카르넷', src: 'dist/q-design.foundation.carnet.css', layer: false,
    to: { 'Q-Forge': 'D:/Claude/DHR/app/q-design.foundation.css' } },
  {
    name: '팔레트 아뜰리에',
    src: 'dist/q-design.palette.atelier.css',
    layer: false,
    to: { 'Q-Atelier': 'D:/Claude/Q-Atelier/app/q-design.palette.css' },
  },
  {
    name: '팔레트 메종',
    src: 'dist/q-design.palette.maison.css',
    layer: false,
    to: { 'Q-Works': 'D:/Claude/Q-Works/app/q-design.palette.css' },
  },
  {
    name: '팔레트 카르넷',
    src: 'dist/q-design.palette.carnet.css',
    layer: false,
    to: { 'Q-Forge': 'D:/Claude/DHR/app/q-design.palette.css' },
  },
  {
    name: '컴포넌트',
    src: 'patterns/components.css',
    to: {
      'Q-Atelier': 'D:/Claude/Q-Atelier/app/q-design.components.css',
      'Q-Works': 'D:/Claude/Q-Works/app/q-design.components.css',
      'Q-Forge': 'D:/Claude/DHR/app/q-design.components.css',
    },
  },
  {
    name: '업무 화면',
    src: 'dist/q-design.workspace.css',
    to: {
      'Q-Atelier': 'D:/Claude/Q-Atelier/app/q-design.workspace.css',
      'Q-Works': 'D:/Claude/Q-Works/app/q-design.workspace.css',
      'Q-Forge': 'D:/Claude/DHR/app/q-design.workspace.css',
    },
  },
  {
    name: '차림표',
    src: 'dist/q-design.nav.css',
    to: {
      'Q-Sonar': 'D:/Claude/Lead-Radar/src/styles/q-design.nav.css',
      'Q-Forge': 'D:/Claude/DHR/app/q-design.nav.css',
      'Q-Works': 'D:/Claude/Q-Works/app/q-design.nav.css',
    },
  },
  {
    name: '목록',
    src: 'dist/q-design.list.css',
    to: {
      'Q-Sonar': 'D:/Claude/Lead-Radar/src/styles/q-design.list.css',
      'Q-Forge': 'D:/Claude/DHR/app/q-design.list.css',
      'Q-Works': 'D:/Claude/Q-Works/app/q-design.list.css',
    },
  },
  {
    name: '뼈대',
    src: 'dist/q-design.screen.css',
    to: {
      'Q-Sonar': 'D:/Claude/Lead-Radar/src/styles/q-design.screen.css',
      'Q-Forge': 'D:/Claude/DHR/app/q-design.screen.css',
      'Q-Works': 'D:/Claude/Q-Works/app/q-design.screen.css',
    },
  },
  /*
   * ── 2026-09-10 확장: 문서 범주 ────────────────────────────────────────────
   * 화면 밖(종이·DOCX)도 같은 체계로 내보냅니다.
   *
   * 🔴 이 범주가 생긴 이유: Q-Atelier 의 `lib/export/docx-builder/brand.ts` 가
   *    라이트 팔레트를 손으로 베낀 사본이었습니다. 주석에 「색 수정 시 양쪽 모두
   *    변경」이라 적혀 있었지만 실제로는 **세 값이 어긋나** 있었고, 그중 둘(#7a7468)은
   *    웹에서 이미 AA 미달로 고친 값이었습니다. 심사원이 읽는 출력물에만 남았습니다.
   *
   * ⚠️ Q-Atelier 도 받는 쪽입니다. 화면 토큰의 원본은 Q-Atelier 지만,
   *    «문서 토큰» 의 원본은 Q-Design 입니다(라이트 팔레트에서 파생하고 검증합니다).
   */
  /*
   * ── 2026-09-10 확장: 상태색 ───────────────────────────────────────────────
   * 위험 · 정상 · 주의 · 안내. Q-Sonar 가 이 이름을 안 갖고 있어 화면 87곳이
   * Tailwind 기본 팔레트를 직접 부르고 있었습니다(감사 Q-Sonar #11).
   *
   * ⚠️ 지금은 Q-Sonar 만 받습니다. Q-Forge 는 --dhr-danger/-ok/-warn 을 이미
   *    갖고 있어, 보내면 «있는데 아무도 안 읽는» 파일이 하나 늘 뿐입니다.
   *    그쪽 이름을 정본으로 옮길 때 함께 붙입니다.
   */
  {
    name: '상태색',
    src: 'dist/q-design.state.css',
    to: {
      'Q-Sonar': 'D:/Claude/Lead-Radar/src/styles/q-design.state.css',
    },
  },
  {
    name: '문서 토큰',
    src: 'dist/q-design.doc.ts',
    lang: 'ts',
    to: {
      'Q-Atelier': 'D:/Claude/Q-Atelier/lib/design/q-design.doc.ts',
    },
  },
  /*
   * ── 2026-09-10 확장: 움직임 ───────────────────────────────────────────────
   * 겉모습이 아니라 «언제 무엇이 움직이는가» 도 정본이 정합니다.
   *
   * 🔴 이 조각이 생긴 이유(감사 주제 #8): 같은 부품이 세 벌 있었고, 그중 Q-Forge
   *    사본만 「누른 순간 시작해 90% 에서 멈추는」 형태로 고쳐져 있었습니다.
   *    정본과 Q-Atelier 는 옛 형태 그대로 바이트가 같았습니다. 고친 것이
   *    한 저장소에만 남는 것이 바로 사본이 갈리는 모습입니다.
   *
   * ⚠️ 앞의 조각들과 달리 src 가 dist 가 아니라 source 입니다. 움직임에는
   *    추출기가 없습니다. 이 파일 자체가 원본입니다.
   * ⚠️ TS 머리표는 줄 주석이라 'use client' «위» 에 놓입니다. 두 저장소에 같은
   *    모양(주석이 지시어보다 위인 client 컴포넌트)이 이미 스무 개 넘게 빌드됩니다.
   */
  {
    name: '진행선',
    src: 'source/components/TopProgressBar.tsx',
    lang: 'ts',
    to: {
      'Q-Atelier': 'D:/Claude/Q-Atelier/components/TopProgressBar.tsx',
      'Q-Forge': 'D:/Claude/DHR/components/top-progress.tsx',
    },
  },
  /*
   * ── 2026-09-25 확장: 초점 여백 ─────────────────────────────────────────────
   * 따라오는 거르개 띠가 키보드 초점을 가리지 않게 스크롤 틀에 띠 높이만큼 여백을 둡니다
   * (오너 결정 「초점 가림 고침」). 진행선처럼 여기가 원본이고 네 제품이 받습니다.
   * 받는 쪽은 앱 셸에 <StickyFocusGuard /> 를 한 번 둡니다.
   */
  {
    name: '초점 여백',
    src: 'source/components/sticky-focus-guard.tsx',
    lang: 'ts',
    to: {
      'Q-Atelier': 'D:/Claude/Q-Atelier/components/StickyFocusGuard.tsx',
      'Q-Sonar': 'D:/Claude/Lead-Radar/src/components/StickyFocusGuard.tsx',
      'Q-Forge': 'D:/Claude/DHR/components/sticky-focus-guard.tsx',
      'Q-Works': 'D:/Claude/Q-Works/components/shared/sticky-focus-guard.tsx',
    },
  },
  /*
   * ── 2026-09-25 확장: 인쇄는 밝게 ───────────────────────────────────────────
   * 다크 테마로 인쇄하면 흰 종이에 상아색 글자만 남습니다(대비 1.19). 인쇄하는 동안만 테마 표시를
   * 밝은 쪽으로 돌렸다가 되돌립니다(오너 결정 「인쇄는 늘 밝은 색으로」). 원본 Q-Atelier 는 인쇄에서
   * 색 이름을 종이 값으로 덮어 이미 밝게 찍히므로 받지 않습니다(받아 두기만 하는 사본을 만들지 않음).
   * 받는 쪽은 앱 셸에 <PrintLight /> 를 한 번 둡니다. Q-Carnet 은 기록서 서식을 비켜 가게
   * <PrintLight except=".sheet" /> 입니다.
   */
  {
    name: '인쇄는 밝게',
    src: 'source/components/print-light.tsx',
    lang: 'ts',
    to: {
      'Q-Sonar': 'D:/Claude/Lead-Radar/src/components/PrintLight.tsx',
      'Q-Forge': 'D:/Claude/DHR/components/print-light.tsx',
      'Q-Works': 'D:/Claude/Q-Works/components/shared/print-light.tsx',
    },
  },
  /*
   * ⚠️ 인쇄 조각은 Q-Works(Q-Maison)만 받습니다(2026-09-25).
   *    9월 10일부터 Q-Atelier · Q-Sonar · Q-Forge 에도 보냈지만 셋 다 한 번도 불러 쓰지 않았습니다
   *    (sync.mjs 의 «받아 두기만 하는 사본» 알림이 잡았습니다). 그 사이 이 조각에 넣은 거르개 띠 규칙은
   *    그 세 제품에서 아무 일도 하지 않았습니다. 받아 두기만 하는 파일은 «여기 고치면 된다» 는 착각만
   *    남기므로 보내지 않습니다(상태색과 같은 원칙). Q-Atelier 는 이 조각의 원본(globals.css 인쇄 규칙)을
   *    직접 갖고 있고, 다크 테마 인쇄는 «인쇄는 밝게» 부품이, 거르개 띠 인쇄는 목록 조각이 맡습니다.
   */
  {
    name: '인쇄',
    src: 'dist/q-design.print.css',
    /* 층으로 감싸지 않고 있습니다. 그 까닭으로 적어 두었던 「감싸면 제품의 층 밖 규칙에 진다」 는
       반대였습니다(2026-09-25 실측). sync.mjs 의 🔴 설명을 보십시오 */
    layer: false,
    to: {
      'Q-Works': 'D:/Claude/Q-Works/app/q-design.print.css',
    },
  },
  /*
   * ── 2026-09-25 확장: 자료 교환 ───────────────────────────────────────────
   * 화면이 아니라 «자료» 의 정본입니다. 세 제품(Q-Atelier · Q-Maison · Q-Carnet)이 공급자 · 품목 ·
   * 장비 · 로트 · 생산 부적합을 주고받는 파일 형식과 받을 계획(누가 원본인가 · 무엇을 덮어쓰지 않는가).
   * 여기가 원본이고, 시험은 tools/family-exchange.test.mjs 입니다(node --test).
   * 🔑 세 제품이 같은 파일을 써야 한 제품이 만든 파일을 다른 제품이 같은 뜻으로 읽습니다.
   */
  {
    name: '자료 교환',
    src: 'source/exchange/family-exchange.ts',
    lang: 'ts',
    to: {
      'Q-Atelier': 'D:/Claude/Q-Atelier/lib/exchange/family-exchange.ts',
      'Q-Works': 'D:/Claude/Q-Works/lib/exchange/family-exchange.ts',
      'Q-Forge': 'D:/Claude/DHR/lib/exchange/family-exchange.ts',
    },
  },
  /*
   * ── 2026-10-04: Q-Atelier 와 Q-Carnet 연동 규약(서명 · 봉투 · 로트 카드 · 건강 판정) ──
   * 순수 규약만 정본에 둡니다. 암호 연산(HMAC · SHA-256)은 각 제품이 LinkCrypto 로 주입합니다.
   * 시험은 tools/link-protocol.test.mjs. Q-Maison 은 이 연동의 당사자가 아니라 받지 않습니다.
   */
  {
    name: '연동 규약',
    src: 'source/exchange/link-protocol.ts',
    lang: 'ts',
    to: {
      'Q-Atelier': 'D:/Claude/Q-Atelier/lib/exchange/link-protocol.ts',
      'Q-Forge': 'D:/Claude/DHR/lib/exchange/link-protocol.ts',
    },
  },
  /*
   * ── 2026-09-26 확장: 앱 창 제목 ────────────────────────────────────────────
   * 설치한 앱 창의 제목에 제품 이름이 두 번 나왔습니다(「Q-Maison - 대시보드 · Q-Maison」 · 오너 지적).
   * 크롬이 앞에 앱 이름을 붙이는데 우리 제목 뒤에도 제품 이름이 있어서입니다. 앱 창에서만 뒤의 이름을
   * 뗍니다. 받는 쪽은 루트 레이아웃에 <AppWindowTitle /> 를 한 번 두고, metadata 에 applicationName 을
   * 둡니다(부품이 제품 이름을 거기서 읽습니다).
   * ⚠️ Q-Sonar 는 받지 않습니다. 제목이 곧 앱 이름(매니페스트 name · APP_TITLE)이라 크롬이 그대로 두고,
   *    겹치지 않습니다(받아 두기만 하는 사본은 보내지 않는다는 원칙).
   */
  {
    name: '앱 창 제목',
    src: 'source/components/app-window-title.tsx',
    lang: 'ts',
    to: {
      'Q-Atelier': 'D:/Claude/Q-Atelier/components/AppWindowTitle.tsx',
      'Q-Forge': 'D:/Claude/DHR/components/app-window-title.tsx',
      'Q-Works': 'D:/Claude/Q-Works/components/shared/app-window-title.tsx',
    },
  },
];

/** 여기(Q-Design)가 원본인 파일들. `source/` 아래 상대 경로로 돌려줍니다. */
export const 여기가원본 = new Set(
  PARTS.filter((p) => p.src.startsWith('source/')).map((p) => p.src.slice('source/'.length)),
);
