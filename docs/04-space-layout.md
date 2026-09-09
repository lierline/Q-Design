# 간격과 레이아웃

---

## 1. 간격 사다리 `S`

**4px 기준 + 2px 하프스텝.** 하프스텝은 에디토리얼 리듬을 위해 나중에 추가된 것으로,
4px 그리드 밖의 실사용값(6 · 10 · 14 · 18 · 22 · 26 · 30)을 토큰으로 흡수한 결과입니다.

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

TS 에서는 `S[3.5]`, CSS 에서는 `var(--qa-space-3_5)` 입니다 (점을 밑줄로 바꿉니다).

**참조는 반드시 브래킷 키(`S[4]`)로** 합니다. 식별자라서 raw 숫자 검출 정규식을 피해 가고,
치환할 때 동결 카운트가 자연스럽게 줄어듭니다.

### 실사용 빈도

원본에서 가장 많이 쓰이는 조합입니다. 옮겨 쓸 때 이 리듬을 따르면 인상이 비슷해집니다.

| 자리 | 값 |
|---|---|
| 카드 안쪽 여백 | `18px 20px` (KPI · 모달 헤더) · `22px 24px` (Card) |
| 카드 사이 gap | 10 ~ 16 |
| 폼 필드 간격 | 12 ~ 16 |
| 섹션 사이 | 32 (`marginBottom: S[7.5]` = 30 이 PageHd) |
| 알림·인포박스 | `12px 16px` |
| 배지 안쪽 | `4px 10px` (md) · `2px 8px` (sm) · `0 6px` (xs) |

---

## 2. 셸 폭 `LAYOUT`

페이지 셸(중앙정렬 컨테이너)의 최대폭입니다. 뷰포트 기준점인 브레이크포인트와는 다른 축입니다.

| 키 | px | 용도 |
|---|---:|---|
| `mobile` | 520 | 현장 모드(PDA) |
| `form` | 720 | 신규 등록 화면 표준 |
| `detail` | 820 | 상세 화면 표준 |
| `wide` | 1140 | 본문 + 사이드 2단 그리드 |

원본 실측 당시 생성폼 720 을 25개 파일이 손으로 반복하고 있었고,
상세는 800 · 820 · 840 · 860 · 880 다섯 가지로 갈려 있었습니다. 같은 역할에 다른 값이었습니다.

### 이 목록에 넣지 않는 것

값이 같아도 **축이 다르면** 넣지 않습니다. 나중에 한 키를 조정할 때 무관한 요소가 따라 움직이기 때문입니다.

- 산문 measure (설명 문단 720): 폼 폭과 다른 축
- 권한 게이트 패널 (640): 페이지 폭이 아니라 중첩 블록
- 모달·드로어 폭: 오버레이 안의 maxHeight 와 함께 도는 별개 축
- 컴포넌트 내부 캡 (진행바 220 · 말줄임 280 · 필드 320): 지역 상수

계약(`page-shell-contract.test.ts`)이 **폭을 잡았으면 가운데로 놓는다**까지 검사합니다.

---

## 3. 브레이크포인트 `BP`

| 키 | px |
|---|---:|
| `sm` | 480 |
| `md` | 768 |
| `lg` | **1024** |
| `xl` | 1280 |
| `2xl` | 1536 |

**1024 가 이 시스템의 진짜 분기점입니다.** 사이드바가 고정에서 드로어로 바뀌는 지점입니다.

미디어 쿼리 헬퍼도 함께 있습니다.

```ts
media.md        // @media (min-width: 768px)
media.maxLg     // @media (max-width: 1023px)
media.touch     // @media (hover: none) and (pointer: coarse)
media.hover     // @media (hover: hover) and (pointer: fine)
media.reduceMotion
```

### 3단 반응 구간

| 구간 | 사이드바 | 본문 여백 | 하단 |
|---|---|---|---|
| `≥1024` 데스크톱 | 고정 (240px, 접으면 60px) | `32px 40px` | |
| `768~1023` 태블릿 | 드로어 (264px) | `68px 28px` | AI FAB 80px |
| `<768` 폰 | 드로어 | `68px 16px` | 하단 네비 + 128px |

여백은 `env(safe-area-inset-bottom)` 을 더해 노치를 피합니다.
PWA standalone 에서는 상단도 `max(68px, env(safe-area-inset-top) + 44px)` 로 늘어납니다.

---

## 4. 앱 셸 구조

```
html (100dvh, overflow hidden)
└ div  display:flex
  ├ aside.qa-sidebar-aside   240px | 60px | 드로어 264px
  │   background: surface · borderRight: 1px border · padding: 22px 16px
  └ main.qa-main-content     flex:1 · height:100% · overflowY:auto
      padding: 32px 40px  ← MAIN_PADDING (SSOT)
```

**스크롤하는 것은 `main` 이고 페이지가 아닙니다.**
사이드바가 화면에 고정되고 본문만 흐릅니다.

`MAIN_PADDING = { top: 32, right: 40, bottom: 32, left: 40 }` 이 별도 모듈로 빠져 있는 이유가 있습니다.
서버 컴포넌트인 레이아웃과, 훅을 쓰는 sticky 계산이 같은 값을 봐야 하는데
서버 컴포넌트는 훅 모듈을 import 할 수 없기 때문입니다.

### sticky 요소는 여백을 «빼야» 합니다

본문에 padding 이 있으므로, 상단 밴드가 화면 맨 위에 붙으려면 그 여백만큼 음수 오프셋이 필요합니다.

```
상단 밴드   top:  -(main padding-top)
저장 바     bottom: -(main padding-bottom)         데스크톱
            bottom: -(padding) + 하단 네비 높이     모바일
```

계약(`sticky-inset.test.ts`)이 **리터럴 0 이 아니라 계산식을 쓰는지**까지 검사합니다.
패드·폰에서는 전역 CSS 가 `!important` 로 여백을 덮으므로 **측정으로만 알 수 있습니다.**

---

## 5. 터치 타겟

```ts
TOUCH.min = 44          // WCAG 2.2 · iOS HIG
TOUCH.comfortable = 48
```

```css
@media (hover: none) and (pointer: coarse) {
  .qa-btn, .qa-btn-secondary { min-height: 44px; }
}
```

기본 버튼은 44px, 보조(`sm`) 버튼은 36px 인데 **터치 기기에서는 sm 도 44px 로 올라갑니다.**

---

## 6. 반응형 유틸리티

레이아웃을 CSS-in-JS 로 짜면 미디어 쿼리를 못 쓰기 때문에, 전역 클래스로 보완합니다.

```css
.qa-grid-responsive   /* repeat(auto-fit, minmax(220px, 1fr)) → 모바일 1열 */
.qa-compare-grid      /* 1fr auto 1fr → 모바일 수직 스택, 화살표 숨김 */
.qa-field-screen      /* 520px → 768px 이상에서 760px */
.qa-hide-mobile · .qa-hide-tablet · .qa-desktop-only · .qa-mobile-only
```

그리고 화면별 1열 붕괴 규칙이 `@media (max-width: 767px)` 안에 모여 있습니다
(`.qa-kpi-4` · `.qa-impact-grid` · `.qa-member-row` · `.qa-pipeline-row` 등 14종).

> **이건 배울 점이자 경고입니다.**
> 인라인 스타일을 주로 쓰면 반응형이 전역 CSS 의 `!important` 로 밀려납니다.
> 새로 만드신다면 레이아웃만큼은 클래스로 두시는 편이 낫습니다.

---

## 7. 가로 스크롤 표

```css
.qa-scroll-table { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.qa-scroll-table.qa-sticky-first > * > *:first-child { position: sticky; left: 0; }
```

모바일에서는 좌우 fade 그라디언트가 붙어 «더 있다»를 알립니다
(`background-attachment: local` 로 스크롤 끝에서 사라집니다).
`qa-sticky-first` 를 붙이면 첫 컬럼이 고정되어 행을 잃지 않습니다.
