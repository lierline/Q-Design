# 컴포넌트

원본은 부품 60여 종이 **파일 하나(`components.tsx`, 3,733줄)** 에 모여 있습니다.
스타일은 CSS 클래스가 아니라 **인라인 style 객체**로 들어갑니다.
호버·포커스처럼 인라인으로 표현할 수 없는 것만 전역 CSS 클래스(`qa-*`)를 씁니다.

전문은 `source/components/components.tsx` 에 있습니다. 아래는 실측 스펙 표입니다.

---

## 1. 폼

### `In` · `Sel` · `Txt` (입력·선택·다중행)

```
width: 100%  ·  padding: 10px 14px  ·  fontSize: 13
background: surface  ·  border: 1px solid border  ·  color: text
class: qa-input  →  border-radius 10px
```

상태는 전역 CSS 가 담당합니다.

```css
.qa-input:hover:not(:focus)  { border-color: var(--qa-borderHi); }
.qa-input:focus {
  border-color: var(--qa-champagne);
  background-color: var(--qa-surface2);          /* 포커스 시 한 겹 들어갑니다 */
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--qa-champagne) 18%, transparent);
}
```

**포커스에서 배경이 `surface` → `surface2` 로 바뀌는 것**이 이 시스템의 촉감입니다.
테두리만 바뀌는 것과 다릅니다.

`Sel` 은 네이티브 화살표를 지우고 SVG 셰브론을 data URI 로 깝니다.
data URI 는 `var()` 를 못 받으므로 **테마별로 두 벌**이 있습니다 (다크 `#b8935a` · 라이트 `#8a6838`).

모바일(≤1023px)에서 입력 글자는 14px 로 커집니다.
iOS 는 16px 미만 입력에 포커스하면 자동 확대하는데, **디자인 통일을 우선해 14px 를 택한 결정**입니다.

### `Btn`

| | 기본 | `sm` |
|---|---|---|
| padding | `11px 22px` | `7px 14px` |
| minHeight | 44 | 36 (터치 기기에서 44) |
| fontSize | 12 | 11 |

```
lineHeight: 1  ·  fontWeight: 500  ·  gap: 6  ·  whiteSpace: nowrap
letterSpacing: labelTracking(children, 1.2)     ← 한글이면 0
textTransform: 한글이면 없음, 아니면 uppercase
border: 항상 1px  (primary 는 transparent)
```

**primary 에도 투명 1px 테두리를 두는 것**이 요령입니다.
안 그러면 primary 와 secondary 의 크기가 1px 씩 어긋납니다.

| 변형 | 배경 | 글자 | 테두리 |
|---|---|---|---|
| primary | `text` (크림) | `bg` | transparent |
| secondary | transparent | `subtle` | `border` |
| danger primary | `red` | `bg` | `red` |
| danger secondary | transparent | `red` | `red` |

**주 버튼이 금색이 아니라 크림색입니다.** 금은 액센트로 아껴 두고, 행동은 밝기로 부릅니다.

### `IconBtn`

```
44×44  ·  border-radius 6  ·  transparent 배경  ·  color muted
hover → color text · border-color borderHi
```

### `Switch` · `Checkbox` · `FilterChip`

```
Switch      md 48×26 · sm 40×22 · border-radius pill · 배경 전환 160ms
Checkbox    16px 상자 · 행 전체가 padding 10px 12px · radius 10 · 체크 시 액센트 배경
FilterChip  padding 5px 12px · fontSize 10 · 활성 시 색 채움
```

---

## 2. 컨테이너

### `Bx` (기본 상자)

모든 카드의 바탕입니다.

```
background: surface  ·  border: 1px solid border
border-radius: var(--qa-radius-card, 10px)
box-sizing: border-box
accent prop → border-left: 3px solid (champagne|green|warning|red|blue|muted)
lift prop  → class qa-card-lift
```

> **⚠️ `Bx` 에는 기본 padding 이 없습니다.**
> 일부러 그렇게 두었고, 계약(`bx-padding.test.ts`)이 **모든 사용처가 padding 을 주는지** 검사합니다.
> 이 전제가 깨지면(기본값을 넣으면) 계약도 함께 무너집니다.

### `Card` · `SectionCard` · `Panel`

```
Card         padding 22px 24px · minHeight 124 (KPI 와 행 높이를 맞추기 위해)
SectionCard  padding 24 · gap 12
Panel        loading/error/empty 상태를 감싸는 래퍼. 각각 SkeletonPanel · Alert · 빈 노드
```

`Panel` 은 «데이터가 오는 자리» 의 표준입니다. 로딩이면 스켈레톤, 실패면 알림, 비면 빈 상태를 알아서 그립니다.

### `Grid`

**인라인 스타일로는 미디어 쿼리를 못 쓰기 때문에** `<style>` 규칙을 동적으로 만들어 주입합니다.

```
cols={4}  →  기본 1열 · md 2열 · lg 4열
gap 기본 10
```

계약(`grid-rules.test.tsx`)이 잠그는 것: 규칙이 있으면 **인라인 `gridTemplateColumns` 를 내지 않습니다.**
인라인은 클래스를 이기기 때문에, 남아 있으면 브레이크포인트 규칙이 한 번도 적용되지 않습니다.
실제로 원본에 그 버그가 있었습니다.

---

## 3. 페이지 뼈대

### `PageHd` (페이지 머리)

```
┌ 32×1.5px 샴페인 막대            ← accent (기본 켜짐). 페이지마다 반복되는 서명
│ mono·10px·자간2.2 부제           ← 한글이면 자간 0
│ h1  clamp(22px, 5vw, 32px) · weight 700 · 자간 -0.02em · lineHeight 1.1
└ 1px 하단 경계선                  ← marginTop 18
marginBottom: 30
```

**`fontSize` 를 인라인으로 주지 않습니다.** 클래스의 `clamp` 가 담당합니다.
인라인이 클래스를 이겨 모바일에서 제목이 안 줄던 버그가 있었습니다.

### `SectionTitle`

```
mono · 10px · champagne · 자간 2.2 · weight 500 · marginBottom 14
```

전 페이지 섹션 헤더입니다. **한글 자간 사고가 가장 널리 퍼졌던 지점**이기도 합니다.

### 매거진 구분자 (CSS 전용)

```
.qa-mag-divider        display:flex · align-items:baseline · gap 16 · margin 32 0 18
  -num                 32px · weight 300 · champagne · 자간 -0.02em · tnum
  -label               mono · 10px · 자간 2.2 · uppercase · muted
  -title               18px · weight 500 · text
  -line                flex:1 · 1px · champagne 40% → transparent 그라디언트
```

---

## 4. 표시

### `Tag` (배지) · 97개 파일이 쓰는 최다 부품

| 크기 | minH | 글자 | padding | 점 | 실제 높이 | 지배 |
|---|---:|---:|---|---:|---:|---|
| `xs` | 18 | 10 | `0 6px` | 5 | 18 | minHeight |
| `sm` | 22 | 11 | `2px 8px` | 6 | 22 | minHeight |
| `md` | 26 | 11.5 | `4px 10px` | 7 | **26.1** | **lineHeight** |

```
fontFamily: mono  ·  lineHeight: 1.4  ·  letterSpacing: labelTracking(children, 1.0)
```

세 층위(`tier`)가 있습니다.

| tier | 배경 | 테두리 | 글자 |
|---|---|---|---|
| `primary` | 색 10% | 색 55% | 색 |
| `secondary` (기본) | 없음 | 색 33% | 색 |
| `tertiary` | 없음 | 색 18% | `muted` |

**같은 색으로 세 단계의 «소리 크기»를 만드는 구조**입니다.
한 행에 배지가 여럿일 때 핵심만 primary 로 두고 나머지를 낮춥니다.

`dot` 을 켜면 왼쪽에 원형 점이 붙습니다.

### `KPI` · `Stat`

```
KPI    padding 18px 20px · minHeight 124
       라벨  mono 10px · subtle · 자간 1.5
       값    weight 700 · 36px · lineHeight 1.05 · 자간 -0.02em
       보조  11px · muted · marginTop 10
Stat   라벨 10 · 값 14 weight 600
```

**숫자가 36px 에 자간 -0.02em 인 것**이 대시보드 인상을 만듭니다.
크게 쓰고 조입니다.

### `Alert` · `InfoBox`

```
Alert    padding 12px 16px · 배경 색 8% · 테두리 색 30% · 12px · lineHeight 1.6
         제목 mono 10px · 색 · 자간 1.5 · marginBottom 4
         marginBottom 16  ← 계약이 이 기본 여백을 강제합니다
InfoBox  padding 12px 16px · 배경 색 6% · 12px · subtle
```

`Alert` 의 `marginBottom` 이 계약으로 잠겨 있는 이유는, 없으면 다음 요소가 테두리에 달라붙기 때문입니다.

### `EmptyState`

```
padding: 96px 24px   (compact 는 32px 24px)
배경: 상단에서 퍼지는 champagne 4% 방사 그라디언트
아이콘/글리프: 56px · champagne 45% · weight 300
제목: serif · weight 700 · 22px · subtle · 자간 -0.01em
설명: 13px · muted · lineHeight 1.7 · maxWidth 460 · 가운데
힌트 칩: padding 6px 12px · 테두리 champagne 40% · 10px
```

**빈 화면에 96px 여백을 주는 것**이 이 시스템의 성격을 잘 보여줍니다.
비었을 때 초라해 보이지 않고 «의도된 여백» 으로 읽힙니다.

### `Skeleton` (CSS 전용)

```css
.qa-skeleton {
  background: color-mix(in srgb, var(--qa-champagne) 4%, var(--qa-surface));
  border: 1px solid color-mix(in srgb, var(--qa-champagne) 8%, var(--qa-border));
}
.qa-skeleton::after {   /* 금빛 띠가 1.4초마다 통과 */
  background: linear-gradient(90deg, transparent,
              color-mix(in srgb, var(--qa-champagne) 18%, transparent) 50%, transparent);
  animation: qa-shimmer 1.4s ease-in-out infinite;
}
```

### `ProgressBar` · `ProgressRing`

```
Bar   height 6 (기본) · radius height/2 · 트랙은 border 색 알파
      색 미지정이면 100% 는 green, 그 외 champagne
      전환 .35s
Ring  size 56 · SVG · -90deg 회전 · 트랙 border 색
```

### `Spinner`

```
1.5px 테두리 · borderTopColor champagne · 원형 · qa-spin 0.8s linear infinite
```

이 시스템에서 **회전이 허용되는 유일한 자리**입니다.

---

## 5. 목록·표

### `DataTable`

```
헤더  padding (padY+1)px 12px · mono 10px · weight 500 · 하단 1px 경계
셀    padding 20px 12px · 12px
컬럼  minmax(0, ...) 로 grid template 구성
```

### `EntityRow`

```
padding 16px 18px · minHeight 72 · gap 14
background surface · border 1px · border-left 2px 액센트 · radius 10
전환 background 200ms
```

**왼쪽 2px 색 띠**로 상태를 표시합니다. 배지보다 조용하고 스캔이 빠릅니다.

---

## 6. 오버레이

### `Modal`

```
백드롭  var(--qa-backdrop-strong) · padding 20 · z-index 1000
본체    background bg · border 1px borderHi · radius 10 · shadow var(--qa-shadow-xl)
        maxWidth 560 (기본)
헤더    padding 18px 20px · 제목 17px weight 600 lineHeight 1.3
                          · 부제 13px subtle lineHeight 1.5
본문    padding 20 · overflowY auto
바닥    padding 14px 20px · gap 10
```

**본체 배경이 `surface` 가 아니라 `bg`(가장 어두운 색)** 입니다.
카드보다 더 «깊은» 층으로 읽히게 하는 선택입니다.

포커스 트랩이 들어 있습니다 (Tab 순환 · Esc 닫기 · 열릴 때 첫 요소로 포커스).

### `Drawer`

```
백드롭 동일 · 본체 background bg · boxShadow SHADOW.anchor
헤더/바닥 padding 14px 18px · 아이콘 champagne
제목 serif 14 weight 600 · 부제 mono 10 muted
```

### `Tip` (툴팁)

```
@keyframes qa-tip-rise: 2px 떠오르며 페이드
translateX 는 CSS 변수 --qa-tip-tx 로 넘겨 중앙 정렬을 유지합니다
```

---

## 7. 셸

### `Sidebar`

```
데스크톱  240px (접으면 60px)   전환 220ms ease-out-expo
드로어    264px                 <1024px 에서 자동
background surface · border-right 1px · padding 22px 16px (접히면 18px 6px)

nav 항목   padding 11px 14px · 아이콘 자리 24px
활성       배경 champagne 10% · 왼쪽 점이 1회 펄스(600ms)
```

접기 상태는 계정별 키로 `localStorage` 에 저장됩니다.
모바일에서는 좌측 스와이프(임계 60px)로 닫힙니다.

### `TopProgressBar`

```css
.qa-top-progress {
  position: fixed; top: 0; height: 2px; z-index: 9999;
  background: linear-gradient(90deg, transparent,
    var(--qa-champagne) 30%,
    color-mix(in srgb, var(--qa-champagne) 80%, white) 60%,
    var(--qa-champagne));
  box-shadow: 0 0 12px color-mix(in srgb, var(--qa-champagne) 70%, transparent);
}
```

라우트 전환 때 나타나는 **2px 금색 실선**입니다. 가운데가 밝고 빛 번짐이 있습니다.

움직임은 `source/components/TopProgressBar.tsx` 가 정합니다(sync 로 두 제품이 받습니다).
**누르는 순간 시작해 90% 에서 멈추고, 화면이 실제로 바뀔 때만 100% 로 채우고 걷습니다.**

- 종전에는 `usePathname` 이 바뀔 때 시작했습니다. App Router 에서 그 값은 새 트리가
  커밋된 «뒤» 에 바뀌므로, 막대가 도착한 다음에 처음 움직였습니다(감사 주제 #8).
- 90% 에서 멈추는 이유: 남은 시간을 모르면서 100% 를 그리면 다 됐다고 말하는 것이 되고,
  그 뒤로도 화면이 안 바뀌면 그 표시를 다시는 안 믿습니다.
- 15초 안에 도착하지 않으면 스스로 걷습니다(취소·서버 오류).
- `prefers-reduced-motion: reduce` 면 **아무것도 그리지 않습니다**(시작도 끝맺음도).
- 링크가 아닌 이동은 `startRouteProgress()` 를 부릅니다. 클릭 감시는 `a` 태그만 봅니다.
- `className` 만 받습니다. 위 CSS 처럼 겉모습은 제품이 정합니다.

### `RibbonBackground`

샴페인 SVG 리본 두 겹이 32초 / 38초 주기로 흐릅니다.
viewBox 2400×1200 에 좌표가 화면 밖까지 나가 있어 초광폭 모니터에서도 잘리지 않습니다.

```
intensity="full"     opacity 0.14 / 0.08   로그인
intensity="ambient"  opacity 0.07 / 0.04   앱 내부
pointer-events: none · position: fixed · z-index 0
```

인쇄에서는 사라집니다.

---

## 8. 접근성 부품

### `SegmentedChoice`

라디오 그룹의 모범 사례가 그대로 들어 있습니다. 계약이 전부 검사합니다.

- `role="radiogroup"` 안에 `role="radio"`, 선택된 것만 `aria-checked="true"`
- **roving tabindex**: 선택된 항목만 `0`, 나머지는 `-1`
- 선택이 없으면 첫 «활성» 항목이 `0` (비활성은 Tab 순서에서 빠짐)
- 화살표 이동은 비활성을 건너뛰고 끝에서 감깁니다
- Home/End 는 범위 밖 인덱스로 호출해 첫/마지막 활성으로 갑니다
- 전부 비활성이면 `null` (무한 루프 없이)

### 건너뛰기 링크

```css
.qa-skip-link { position: absolute; left: -9999px; }
.qa-skip-link:focus {
  position: fixed; left: 16px; top: 16px;
  padding: 10px 18px; background: var(--qa-champagne); color: var(--qa-bg);
}
```

WCAG 2.4.1 (Bypass Blocks). 평소엔 화면 밖, Tab 하면 나타납니다.

---

## 9. 옮겨 쓸 때

이 컴포넌트들을 그대로 가져가려면 React 19 + Next.js 가 필요합니다.
**그럴 필요는 없습니다.** 위 표의 수치만 있으면 어떤 프레임워크에서도 같은 인상이 나옵니다.

우선순위를 매기면 이 셋이 인상의 8할입니다.

1. **`Bx` + `qa-card-lift`** (카드와 금테 호버)
2. **`Tag` 3층위** (같은 색으로 소리 크기 조절)
3. **`PageHd`** (금색 막대 + mono 부제 + 큰 제목 + 하단선)
