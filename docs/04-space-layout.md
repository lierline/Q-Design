# 4장 · 간격 · 배치

이 장은 화면의 간격 사다리, 셸 폭, 끊는 폭(브레이크포인트), 앱 셸의 뼈대, 누르는 자리의 크기를 정합니다.
값은 `dist/q-design.tokens.css` · `dist/q-design.tokens.json` 과 세 제품 공통 기반(`patterns/foundation.css` · `patterns/components.css`), 아뜰리에 기반(`patterns/foundation/atelier.css`)에서 나옵니다.

합친 옛 문서: 04 간격과 레이아웃

---

## 간격 사다리 `S`

**4px 기준 + 2px 하프스텝.** 하프스텝은 에디토리얼 리듬을 위한 것으로,
4px 격자 밖에서 실제로 쓰이던 값(6 · 10 · 14 · 18 · 22 · 26 · 30)을 토큰으로 담습니다.

| 키 | px | | 키 | px | | 키 | px |
|---|---:|---|---|---:|---|---|---:|
| `0` | 0 | | `4` | 16 | | `9` | 36 |
| `0.5` | 2 | | `4.5` | 18 | | `10` | 40 |
| `1` | 4 | | `5` | 20 | | `11` | 44 |
| `1.5` | 6 | | `5.5` | 22 | | `12` | 48 |
| `2` | 8 | | `6` | 24 | | `14` | 56 |
| `2.5` | 10 | | `6.5` | 26 | | `16` | 64 |
| `3` | 12 | | `7` | 28 | | `18` | 72 |
| `3.5` | 14 | | `7.5` | 30 | | `20` | 80 |
| | | | `8` | 32 | | `24` | 96 |

TS 에서는 `S[3.5]`, CSS 에서는 `var(--qa-space-3_5)` 입니다(점을 밑줄로 바꿉니다).
세 제품 공통 기반은 같은 사다리를 `--qd-space-unit: 4px` 의 배수로 내고, 이름의 점을 하이픈으로 씁니다(`--qd-space-3-5` = 14px).

**참조는 반드시 브래킷 키(`S[4]`)로** 합니다. 식별자라서 raw 숫자를 찾는 검사를 피해 가고,
raw 값을 토큰으로 바꿀 때마다 동결 개수가 자연스럽게 줄어듭니다(동결은 [10장](10-rules.md)).

### 자주 쓰는 조합

원본에서 가장 많이 쓰이는 조합입니다. 옮겨 쓸 때 이 리듬을 따르면 인상이 비슷해집니다.

| 자리 | 값 |
|---|---|
| 카드 안쪽 여백 | `18px 20px` (KPI · 모달 머리) · `22px 24px` (Card) |
| 카드 사이 gap | 10 ~ 16 |
| 폼 칸 간격 | 12 ~ 16 |
| 구역 사이 | 32 (`PageHd` 의 아래 여백은 `S[7.5]` = 30) |
| 알림 · 안내 상자 | `12px 16px` |
| 배지 안쪽 | `4px 10px` (md) · `2px 8px` (sm) · `0 6px` (xs) |

---

## 셸 폭 `LAYOUT`

페이지 셸(가운데 정렬 컨테이너)의 최대 폭입니다. 화면 폭 기준점인 브레이크포인트와는 다른 축입니다.

| 키 | px | 용도 |
|---|---:|---|
| `mobile` | 520 | 현장 모드(PDA) |
| `form` | 720 | 신규 등록 화면 표준 |
| `detail` | 820 | 상세 화면 표준 |
| `wide` | 1140 | 본문 + 옆 칸 2단 격자 |

같은 역할에는 한 값만 씁니다. 역할이 같은데 화면마다 손으로 적은 폭이 갈리면(상세 화면이 800 · 820 · 840 · 860 · 880 으로 갈리는 식) 통일성이 무너집니다.

### 이 목록에 넣지 않는 것

값이 같아도 **축이 다르면** 넣지 않습니다. 나중에 한 키를 조정할 때 무관한 요소가 따라 움직이기 때문입니다.

- 산문 폭(설명 문단 720): 폼 폭과 다른 축
- 권한 게이트 패널(640): 페이지 폭이 아니라 안쪽 블록
- 모달 · 드로어 폭: 오버레이 안의 maxHeight 와 함께 도는 별개 축
- 부품 안쪽 상한(진행바 220 · 말줄임 280 · 칸 320): 지역 상수

셸 폭은 raw 숫자로 적지 않고, **폭을 잡았으면 가운데로 놓습니다.** 두 가지 모두 계약 시험이 지킵니다([10장](10-rules.md)의 ⑦).

---

## 브레이크포인트 `BP`

| 키 | px |
|---|---:|
| `sm` | 480 |
| `md` | 768 |
| `lg` | **1024** |
| `xl` | 1280 |
| `2xl` | 1536 |

**1024 가 이 시스템의 진짜 분기점입니다.** 사이드바가 고정에서 드로어로 바뀌는 지점입니다.

CSS 의 미디어 쿼리는 변수를 받지 못합니다. 그래서 원본(`patterns/foundation/atelier.css`)에서는 `qd-bp(md)` · `qd-bp(md-max)` 처럼 이름으로 적고,
`tools/build-foundation.mjs` 가 만들 때 BP 값으로 바꿉니다(`qd-bp(md)` → `768px`, `qd-bp(md-max)` → `767px`).

### 설계 · 측정 기준 폭

브레이크포인트는 «어디서 배치가 바뀌는가» 이고, 아래는 «어느 폭에서 재는가» 입니다.
새 화면과 고침은 이 폭들에서 잰 뒤 올립니다(오너 규칙 2026-10-01: 운영진 화면도 폰으로 바로 관리).

| 폭 | 무엇 | 재는 것 |
|---:|---|---|
| **375** | 작은 폰(iPhone SE · mini 급) | 가로 스크롤 없음 · 단추 44px · 표는 카드 줄 |
| **412** | 보통 안드로이드 폰 | 위와 같음. 폰 촬영 · 폰 앱 검토의 기본 폭 |
| 599 | `phoneRow` 가 카드 줄로 바꾸는 상한 | 600 부터 표가 다시 나오므로 넓은 표는 `minWidth` 도 가져야 함 |
| 640 | 데스크톱 1280 을 **200 % 확대** 한 폭 | 재배치(WCAG 1.4.10): 가로 스크롤 없이 읽혀야 함 |
| 320 | 데스크톱 1280 을 **400 % 확대** 한 폭 | 같은 기준의 하한. 본문 글 · 폼은 한 열로 |

### 3단 반응 구간

| 구간 | 사이드바 | 본문 여백(위 · 좌우 · 아래) | 하단 |
|---|---|---|---|
| `≥1024` 데스크톱 | 고정 240px, 접으면 60px | `32px 40px` | |
| `768~1023` 태블릿 | 드로어 264px | 머리 높이 · 28px · 100px | AI FAB 80px |
| `<768` 폰 | 드로어 264px | 머리 높이 · 16px · 128px | 하단 네비 |

아래 여백과 FAB 위치에는 `env(safe-area-inset-bottom)` 을 더해 노치를 피합니다.
태블릿 · 폰과 설치 앱(PWA standalone)의 위 여백 «머리 높이» 는 `--qd-atelier-mobile-header-height` 입니다.
안전 영역 위 + max(64px, 조작 높이 44 + 12 × 2) 이므로, 노치가 없으면 68px 입니다.

---

## 앱 셸 구조

```
html (100dvh, overflow hidden)
└ div  display:flex
  ├ aside.qa-sidebar-aside   240px | 60px | 드로어 264px
  │   background: surface · borderRight: 1px border · padding: 22px 16px (접으면 18px 6px)
  └ main.qa-main-content     flex:1 · height:100% · overflowY:auto
      padding: 32px 40px  ← MAIN_PADDING (한 곳)
```

**스크롤하는 것은 `main` 이고 페이지가 아닙니다.**
사이드바가 화면에 고정되고 본문만 흐릅니다.

`MAIN_PADDING = { top: 32, right: 40, bottom: 32, left: 40 }` 이 따로 모듈(`main-padding.ts`)로 빠져 있는 까닭이 있습니다.
서버 컴포넌트인 레이아웃과, 훅을 쓰는 sticky 계산이 같은 값을 봐야 하는데
서버 컴포넌트는 훅 모듈을 import 할 수 없기 때문입니다.

### sticky 요소는 여백을 «빼야» 합니다

본문에 padding 이 있으므로, 상단 밴드가 화면 맨 위에 붙으려면 그 여백만큼 음수 오프셋이 필요합니다.

```
상단 밴드   top:  -(main padding-top)
저장 바     bottom: -(main padding-bottom)         데스크톱
            bottom: -(padding) + 하단 네비 높이     모바일
```

리터럴 0 이 아니라 계산식을 써야 합니다(계약은 [10장](10-rules.md)의 ⑬).
패드 · 폰에서는 전역 CSS 가 `!important` 로 여백을 덮으므로 **측정으로만 알 수 있습니다.**

---

## 터치 타겟

```ts
TOUCH.min = 44          // WCAG 2.2 · iOS HIG
TOUCH.comfortable = 48
```

```css
@media (hover: none) and (pointer: coarse) {
  .qa-btn, .qa-btn-secondary { min-height: var(--qd-control-height, 44px) !important; }
}
```

`!important` 가 있어야 하는 까닭: 공용 `Btn` 이 높이를 인라인으로 적어(sm 36) 보통 규칙을 이깁니다.
같은 조건에서 `.qa-input` · `.qa-touch-44` 는 높이를, `.qa-touch-44sq` 는 가로 · 세로를 44 로 올리고,
`.qa-touch-hit` 는 모양을 두고 누르는 자리만 보이지 않게 넓힙니다(바로 아래에 창이 열리는 단추에는 쓰지 않습니다. 넓힌 자리가 열린 창을 가립니다).
폭 640 이하 창에서는 마우스여도 공용 조작부가 44 를 지킵니다(`patterns/foundation.css`).

단추 높이는 역할로 정합니다.

| 역할 | 높이 |
|---|---|
| 상자 단추 기본 | 44px (`--qd-control-height`) |
| 명시한 작은 변형 | 데스크톱 36px (`--qd-control-height-sm`), 터치 44px |
| 보조 글귀 행동 | 데스크톱 36px, 터치 44px |
| 아이콘만 있는 행동 | 44px |
| 카르넷 현장 입력 · 주요 현장 행동 | 56px (`--qd-field-control-height`). 이름 붙인 작업용 변형 |

제품 이름만으로 같은 역할의 기본 크기가 달라지지 않게 합니다.

---

## 반응형 유틸리티

### 세 제품 공통 크기 계약

화면 너비보다 실제 부모 영역의 너비를 기준으로 열을 접습니다. 열 수는 최대치입니다.
`patterns/responsive.ts`의 `responsiveColumns`를 세 제품의 `lib/design/q-design-responsive.ts`로 배포합니다.
아뜰리에 `Grid`·`foldGrid`·`StatGrid`·로딩 지표, 메종 `StatRow`·로딩 카드, 공통 입력 양식 배치가 이 계약을 사용합니다.

| 중앙 설정 | 역할 |
| --- | --- |
| `--qd-grid-min-width` | 일반 입력 열의 선호 최소 너비. 부모가 더 좁으면 부모 너비까지 축소 |
| `--qd-kpi-min-width` | 지표 열의 선호 최소 너비 |
| `--qd-grid-gap` | 열 너비 계산과 실제 간격에 함께 사용하는 값 |
| `--qd-grid-columns` | `.qd-responsive-grid`의 최대 열 수 |
| `--qd-overlay-screen-inset` | 팝업이 화면 가장자리와 유지하는 간격 |
| `--qd-textarea-max-height` | 여러 줄 입력의 최대 높이. 넘는 내용은 내부 스크롤 |
| `--qd-control-leading` | 버튼 문구가 여러 줄일 때의 줄 높이 |
| `--qd-header-action-inset` | 모바일 상단 아이콘의 오른쪽 여백 |
| `--qd-header-action-gap` | 모바일 상단 아이콘 사이 간격 |
| `--qd-header-action-leading-right` | 오른쪽 아이콘 너비와 간격으로 계산한 앞 아이콘 위치 |

위 설정의 정본은 `patterns/foundation.css`입니다. 생성 후 `extract-all.mjs --sync --only=Q-Atelier,Q-Works,Q-Forge`로 배포합니다.
`.grid`의 직접 자식이 `.qd-field` 또는 `.qd-kpi`이면 공통 배치가 자동 적용됩니다.
새 배치에는 `.qd-responsive-grid`와 최대 열 수를 명시합니다. 네 칸 입력은 `.qd-form-grid--four`를 사용합니다.
입력 양식의 열 병합 필드는 좁은 폭에서도 한 행 전체를 차지하며, 숨은 열을 추가하지 않습니다.
메종 `ChoiceBoxes`·`ChoiceGrid`도 부모 너비로 접힙니다. 선택지 최소 너비는 `--qd-choice-min-width`로 조정하며,
정본 선택 부품의 기본값은 `--qd-space-24`입니다. 넓은 화면 안의 좁은 입력 칸에서도 짧은 선택지가 한 글자씩 갈라지지 않게 합니다.

카드와 입력의 너비는 부모 안에 들어가고 높이는 내용에 맞춰 늘어납니다. 긴 식별자는 필요한 지점에서 줄바꿈합니다.
첨부파일 표시는 사람이 읽을 수 있는 파일 이름을 사용하며, `.qd-file-name`으로 긴 이름도 부모 안에서 줄바꿈합니다.
모바일 상단 아이콘은 `--qd-control-height`와 중앙 간격을 합산해 배치합니다. 화면 분기별 고정 오프셋으로 서로 겹치게 만들지 않습니다.
팝업과 서랍은 현재 화면의 너비·높이 안에 제한하고, 긴 본문은 내부에서 스크롤합니다.
팝업 중앙 정렬은 열림 애니메이션의 변형과 분리해 애니메이션 도중에도 화면 밖으로 밀리지 않게 합니다.

달력·숫자판의 의미 있는 열 수, 도면·SVG의 좌표, 인쇄 문서의 종이 치수는 유지합니다.
표는 열을 무조건 압축하지 않고 표 영역 안에서 가로 스크롤합니다.
이 예외를 일반 화면의 고정 너비 카드에 사용하지 않습니다.

검증: `build-component-workbench.mjs` 후 `verify-responsive.mjs`를 실행합니다.
실제 제품 컴포넌트로 320px부터 1920px까지, 짧은 가로 화면, 260px·120px 부모, 긴 문구, 팝업 하단 동작을 검사합니다.
중앙 최소 너비를 바꿨을 때 세 제품의 열 수가 함께 변하는지도 검사합니다. 인증된 업무 화면 검수는 별도입니다.

운영 배포가 완료된 뒤에는 `node tools/verify-responsive-release.mjs`로 공개 로그인 페이지의 CSS 자원을 대조합니다.
전역 크기 설정 6개와 배치 선택자 4개가 실제 운영 자원에 포함되는지 검사하며, 로그인된 업무 화면의 시각 검수를 대신하지 않습니다.

레이아웃을 CSS-in-JS 로 짜면 미디어 쿼리를 쓸 수 없어서, 전역 클래스로 보완합니다.

```css
.qa-grid-responsive   /* repeat(auto-fit, minmax(220px, 1fr)) → 768 미만 1열 */
.qa-compare-grid      /* 1fr auto 1fr → 768 미만 세로로 쌓고 화살표 숨김 */
.qa-field-screen      /* 520px → 768px 이상에서 760px */
.qa-hide-mobile · .qa-hide-tablet · .qa-desktop-only · .qa-mobile-only
.qa-phone-only · .qa-phone-hide   /* 599 / 600 선 */
```

현장 화면이 768 부터 넓어지는 까닭은 현장 모드의 주 기기가 패드이기 때문입니다(오너 지시 2026-08-20).
폰 기준 520 에 묶어 두면 패드에서 화면 절반이 비고, 장갑 낀 손이 누를 자리가 공연히 작아집니다.

화면별 1열 접기 규칙은 `@media (max-width: 767px)` 한 블록에 모여 있습니다
(`.qa-kpi-4` · `.qa-impact-grid` · `.qa-member-row` · `.qa-pipeline-row` 등 화면 이름이 박힌 클래스 16종).

> **이것은 배울 점이자 경고입니다.**
> 인라인 스타일을 주로 쓰면 반응형이 전역 CSS 의 `!important` 로 밀려납니다.
> 새로 만드신다면 레이아웃만큼은 클래스로 두시는 편이 낫습니다.

---

## 가로 스크롤 표

```css
.qa-scroll-table { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.qa-scroll-table.qa-sticky-first .qa-scroll-table-inner > * > *:first-child { position: sticky; left: 0; }
```

1024 미만에서는 좌우에 흐려지는 그라디언트가 붙어 «더 있다» 를 알립니다
(`background-attachment: local` 로 스크롤 끝에서 사라집니다).
`qa-sticky-first` 를 붙이면 첫 열이 고정되어 줄을 잃지 않습니다.
머리글을 붙이려면 세로 한계가 있어야 하므로, 붙는 머리글을 쓰는 표는 `.qa-scroll-table--tall` 을 함께 겁니다.
