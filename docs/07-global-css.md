# 전역 CSS

`globals.css` 1,044줄의 지도입니다. 전문은 `source/css/globals.css` 에 있습니다.

스타일이 인라인 위주라, 전역 CSS 는 **인라인으로 표현할 수 없는 것**만 맡습니다.
호버 · 포커스 · 미디어 쿼리 · 키프레임 · 의사 요소 · 인쇄.

---

## 1. 구성

| 구간 | 줄 | 내용 |
|---|---|---|
| 팔레트 | 1~120 | 다크 · 라이트 · 줄간격 사다리 |
| 기초 | 121~250 | reset · body · 스크롤 · 포커스 · 스크롤바 · 선택 |
| 부품 상태 | 251~400 | `.qa-input` · `.qa-btn` · `.qa-nav-item` · `.qa-avatar` |
| 접근성 | 385~430 | focus-visible 강화 · prefers-reduced-motion |
| 반응형 | 430~640 | 3단 구간 · 1열 붕괴 14종 · 표시 토글 |
| 폴리시 | 640~900 | 카드 리프트 · 진행바 · 스켈레톤 · 매거진 구분자 · 모션 |
| 폼 장식 | 900~980 | select 셰브론 (테마별 2벌) |
| 인쇄 | 980~1044 | 팔레트 교체 · A4 · 워터마크 |

---

## 2. 리셋

```css
* {
  box-sizing: border-box;
  margin: 0; padding: 0;
  -webkit-tap-highlight-color: transparent;   /* 모바일 회색 하이라이트 제거 */
}
```

탭 하이라이트를 지우는 대신 `:focus-visible` 과 `:active` 로 **명시적으로** 표현합니다.
지우기만 하고 대체하지 않으면 모바일에서 「눌렸는지 모르겠다」가 됩니다.

```css
html { transition: background-color 0.2s ease, color 0.2s ease; }
```

테마를 바꿀 때 색이 0.2초에 걸쳐 넘어갑니다. 즉시 전환보다 훨씬 부드럽습니다.

---

## 3. 유틸리티 클래스 55종

### 부품 상태

| 클래스 | 역할 |
|---|---|
| `.qa-input` | radius 10 · hover 테두리 · focus 금테 + 배경 한 겹 + 글로우 |
| `.qa-btn` | radius 10 · hover opacity 0.88 · active 1px 내려앉음 |
| `.qa-btn-secondary` | radius 10 · hover 테두리·글자색 상승 |
| `.qa-nav-item` | 배경/글자/테두리 120ms · `.active` 는 relative |
| `.qa-row-clickable` | hover 시 `surface2` |
| `.qa-avatar` | 원형 · champagne 22% 섞은 배경 · weight 600 |
| `.qa-link` | 금색 + `border-bottom` 밑줄 (hover 시 진해짐) |

### 시각 효과

| 클래스 | 역할 |
|---|---|
| `.qa-card-lift` | hover 시 -2px + 그림자 + **금테** |
| `.qa-lift` | 가벼운 버전 (-1px, 테두리만) |
| `.qa-backdrop` | `blur(10px) saturate(180%)` |
| `.qa-skeleton` | 금 4% 바탕 + 금 18% 시머 |
| `.qa-top-progress` | 상단 2px 금색 그라디언트 + 글로우 |
| `.qa-mark` | 검색어 강조 (금 25%) |
| `.qa-tabular` | `font-variant-numeric: tabular-nums` |
| `.qa-easing` | ease-out expo 곡선만 지정 |

### 모션

| 클래스 | 역할 |
|---|---|
| `.qa-page-fade` | 페이지 등장 (8px · 360ms) |
| `.qa-stagger` | 직계 자식 순차 등장 (6px · 35ms 간격 · 9번째부터 고정) |
| `.qa-fade-in` | 비동기 위젯 등장 (6px · 480ms) |
| `.qa-pulse` | 부드러운 맥박 (2s 무한) |
| `.qa-toast-shake` | 좌우 흔들림 (240ms 1회) |
| `.qa-nav-active-underline` | 사이드바 선택 밑줄 (왼쪽부터 펼침 · 320ms 1회 · 2026-09-27 금점을 대신함) |
| `.qa-row-clickable` | 누를 수 있는 괘선 줄 (올리면 surface2 바탕 · EntityRow) |

### 레이아웃

| 클래스 | 역할 |
|---|---|
| `.qa-main-content` | 본문 스크롤 컨테이너. 반응형 여백의 기준점 |
| `.qa-grid-responsive` | `auto-fit minmax(220px, 1fr)` → 모바일 1열 |
| `.qa-compare-grid` | `1fr auto 1fr` → 모바일 수직 (화살표 숨김) |
| `.qa-scroll-table` | 가로 스크롤 + 좌우 fade + sticky 첫 컬럼 |
| `.qa-field-screen` | 현장 모드 셸 (520 → 패드 760) |
| `.qa-skip-link` | 건너뛰기 링크 |

### 표시 토글

```
.qa-hide-mobile   <768 에서 숨김
.qa-hide-tablet   768~1023 에서 숨김
.qa-desktop-only  <1024 에서 숨김
.qa-mobile-only   ≥1024 에서 숨김
```

### 화면별 1열 붕괴 (`@media max-width: 767px`)

`.qa-kpi-4` · `.qa-impact-grid` · `.qa-attach-row` · `.qa-rolereview-2` ·
`.qa-submission-form` · `.qa-template-edit` · `.qa-member-header` · `.qa-member-row` ·
`.qa-admin-table-header` · `.qa-admin-table-row` · `.qa-ra-4col` · `.qa-pipeline-row` ·
`.qa-assess-impact` · `.qa-assess-checklist` · `.qa-regulatory-grid` · `.qa-rddoc-chips`

전부 `!important` 입니다. 인라인 스타일을 이겨야 하기 때문입니다.

> **이 구간은 배울 점이자 경고입니다.**
> 인라인 스타일을 주로 쓰면 반응형이 이렇게 «화면 이름이 박힌 전역 규칙» 으로 밀려납니다.
> 새 프로젝트라면 레이아웃만큼은 클래스로 두시는 편이 낫습니다.

---

## 4. 키프레임 11종

```
qa-spin           회전 (스피너 전용 · 유일한 회전)
qa-shimmer        띠 좌→우 통과 (스켈레톤)
qa-soft-pulse     opacity + scale 맥박
qa-page-rise      8px 떠오름
qa-page-fade-in   페이드
qa-stagger-rise   6px 떠오름 + 페이드
qa-fade-in-soft   6px 떠오름 + 페이드 (느리게)
qa-toast-progress scaleX 1→0 (TTL 카운트다운)
qa-toast-shake    ±3px
qa-fld-error-rise -4px 에서 내려옴 (입력 오류)
qa-tip-rise       2px 떠오름 (툴팁, translateX 보존)
qa-nav-active-underline-in  scaleX 0→1 (1회 · 선택 밑줄)
```

**무한 반복은 각각 `prefers-reduced-motion` 에서 `animation: none` 을 따로 선언합니다.**
전역 `0.01ms` 규칙만으로는 초고속 깜빡임이 되기 때문입니다.

---

## 5. select 셰브론

네이티브 화살표를 지우고 SVG 를 배경 이미지로 깝니다.

```css
select.qa-input {
  appearance: none;
  background-image: url("data:image/svg+xml,…stroke='%23b8935a'…");
  background-position: right 12px center;
  background-size: 10px 6px;
  padding-right: 32px !important;
}
```

**data URI 는 `var()` 를 못 받습니다.** 그래서 테마별로 네 벌이 있습니다
(다크 기본/hover · 라이트 기본/hover). 라이트에서 다크용 금색은 흰 입력칸 위 2.6:1 로 흐릿합니다.

> 옮겨 쓰실 때 흔히 놓치는 지점입니다. SVG 아이콘을 CSS 배경으로 쓰면 테마를 못 따라갑니다.
> `mask-image` + `background-color` 로 바꾸면 변수를 쓸 수 있습니다.

---

## 6. 인쇄

```css
@media print {
  :root, html, html[data-theme='dark'], html[data-theme='light'] {
    --qa-bg: #ffffff !important;  /* 팔레트 10개를 통째로 교체 */
    …
  }
  aside.qa-sidebar-aside, .qa-skip-link, .qa-top-progress, button { display: none !important; }
  main.qa-main-content { height: auto !important; overflow: visible !important; padding: 24px 32px !important; }
  .qa-card-lift { transform: none !important; box-shadow: none !important; }
  .qa-ribbon-layer-1, .qa-ribbon-layer-2 { display: none !important; }

  @page { margin: 18mm 16mm 22mm; size: A4; }

  body::after {          /* 매 페이지 하단 워터마크 */
    content: 'Q-Atelier · Medical Device Regulatory Workspace · Crafted with Q-Atelier';
    position: fixed; bottom: 8mm;
    font-size: 8pt; color: #8a6a3a;
    font-family: 'JetBrains Mono', monospace; letter-spacing: 1.5px;
    border-top: 0.5pt solid #d4d0c8; padding-top: 4mm;
  }

  .qa-card-lift, table, .qa-mag-divider { break-inside: avoid; }
  h1, h2, h3 { break-after: avoid-page; }
  a { color: #1a1814 !important; text-decoration: none !important; }
}
```

**핵심은 `main` 의 `height: auto` + `overflow: visible`** 입니다.
앱 셸이 `100dvh` + `overflow: hidden` 이므로, 이걸 풀지 않으면 첫 화면 한 장만 인쇄됩니다.
스크롤 컨테이너를 쓰는 모든 앱이 겪는 문제입니다.

`break-inside: avoid` 로 카드가 페이지 경계에서 잘리지 않게 하고,
헤딩 뒤에 한 줄만 남는 widow 를 막습니다.

---

## 7. 그 밖에 눈여겨볼 두 가지

### 폰트 로딩

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
```

한글 본문(Pretendard)은 self-host 하고 **영문 모노만 외부에서 받습니다.**
한글 웹폰트를 CDN 에서 받으면 용량이 크고 FOUT 가 눈에 띕니다.

### 색 스킴 선언

```css
:root { color-scheme: dark; }
html[data-theme='light'] { color-scheme: light; }
```

이 한 줄로 **네이티브 폼 컨트롤**(날짜 선택기 · select 드롭다운 · 스크롤바)이 앱 테마를 따라갑니다.
컴포넌트마다 `colorScheme` 을 인라인으로 박는 대신 전역 단일 출처로 둔 것입니다.
