# 모양 · 깊이 · 모션

---

## 1. 모서리 `RADIUS`

| 키 | px | 용도 |
|---|---:|---|
| `sm` | 6 | 아이콘 버튼 |
| **`md`** | **10** | **카드 · 버튼 · 입력 전부** |
| `lg` | 14 | 큰 패널 |
| `xl` | 20 | 드물게 |
| `pill` | 9999 | 알약 |

**10px 단일값이 이 시스템의 결정입니다.**
`rounded-lg`(8) 과 `rounded-xl`(12) 이 섞여 있던 것을 그 사이값으로 통일했습니다.

정본 CSS 가 이 `md`(10) 를 `--qd-radius-control` 로 내보냅니다
(`dist/q-design.list.css` · [목록 정본](16-list-canon.md) 참조). 제품은 그 변수를
읽기만 하고 10 을 다시 적지 않습니다.

8 은 조금 딱딱하고 12 는 조금 물렁합니다. 10 은 «정밀하게 다듬은» 인상을 줍니다.

### 카드 모서리는 맥락을 읽습니다

```css
border-radius: var(--qa-radius-card, 10px);
```

폴백이 10px 이므로 앱은 그대로입니다.
다만 전문가 포털은 `--qa-radius-card: 0` 을 선언해 **같은 부품이 각지게** 그려집니다.

> 이 요령이 이 시스템에서 배울 만한 대목입니다.
> 부품을 포크해 사본을 만들지 않고, **주변 맥락을 읽을 수 있게** 만들었습니다.

---

## 2. 그림자

**두 계열이 있고 성격이 다릅니다.**

### 테마 인지 `ELEVATION` (신규 코드 권장)

```css
--qa-shadow-sm: 0 2px 8px   rgba(0,0,0,0.25)   /* 라이트: rgba(80,65,40,0.10) */
--qa-shadow-md: 0 6px 18px  rgba(0,0,0,0.35)   /* 라이트: rgba(80,65,40,0.14) */
--qa-shadow-lg: 0 20px 60px rgba(0,0,0,0.55)   /* 라이트: rgba(80,65,40,0.18) */
--qa-shadow-xl: 0 30px 90px rgba(0,0,0,0.6)    /* 라이트: rgba(80,65,40,0.22) */
```

라이트에서 색이 검정이 아니라 **따뜻한 sepia** 입니다. 흰 배경에 검정 그림자는 거칩니다.

### 고정 다크 `SHADOW` (2겹 럭셔리)

```
hairline  0 1px 0 rgba(255,255,255,0.04) inset,  0 1px 2px rgba(0,0,0,0.2)
surface   0 1px 0 rgba(255,255,255,0.05) inset,  0 4px 16px -4px rgba(0,0,0,0.35)
float     0 1px 0 rgba(255,255,255,0.06) inset,  0 12px 32px -8px rgba(0,0,0,0.45)
anchor    0 1px 0 rgba(255,255,255,0.06) inset,  0 20px 60px -20px rgba(0,0,0,0.55)
```

**위쪽 안쪽 흰 선 + 아래쪽 깊은 그림자**의 2겹 구조입니다.
안쪽 흰 선이 «금속에 빛이 스치는» 인상을 만듭니다. 이것이 럭셔리 톤의 핵심 장치입니다.

다만 다크 고정값이므로 **라이트에서도 흰 선이 남습니다.** 새로 쓰신다면 `ELEVATION` 쪽을 권합니다.

### 백드롭

```css
--qa-backdrop:        rgba(0,0,0,0.65)    /* 라이트: rgba(40,30,18,0.32) */
--qa-backdrop-strong: rgba(0,0,0,0.75)    /* 라이트: rgba(40,30,18,0.45) */

.qa-backdrop {  /* 블러 버전 */
  background: color-mix(in srgb, var(--qa-bg) 70%, transparent);
  backdrop-filter: blur(10px) saturate(180%);
}
```

`saturate(180%)` 가 함께 붙는 것이 요령입니다. 블러만 걸면 뒤가 탁해지는데,
채도를 올리면 «유리» 가 아니라 «맑은 안개» 가 됩니다.

---

## 3. 레이어 `Z`

```
base 1 · dropdown 50 · sticky 100 · header 200
overlay 1000 · modal 1100 · popover 1200 · toast 1300 · tooltip 9999
```

계약이 **단조 증가**를 검사합니다. 매직넘버(1 · 50 · 1000 · 9999)가 흩어지는 것을 막습니다.

---

## 4. 모션

### 이징은 하나입니다

```
cubic-bezier(0.16, 1, 0.3, 1)   /* ease-out expo */
```

빠르게 나가서 아주 부드럽게 멈춥니다. 이 시스템의 모든 등장·호버가 이 곡선입니다.
보조로 `cubic-bezier(0.65, 0, 0.35, 1)` (ease-in-out) 이 있고, 접기/펼치기는 `(0.22, 1, 0.36, 1)` 을 씁니다.

### ⚠️ 키프레임은 46종이고, 27종은 CSS 파일에 없습니다

아래 표는 `globals.css` 에 있는 것만입니다. **전체의 절반이 안 됩니다.**

스타일이 인라인 객체 위주라, 키프레임은 컴포넌트 안의 `<style>` 블록으로 들어갑니다.
`globals.css` 만 읽으면 로그인 입장 연출도, 드로어 슬라이드도, 타이핑 커서도 안 보입니다.

| | 개수 |
|---|---:|
| 전체 | **46종** |
| `globals.css` + `expert-theme.css` | 19종 |
| 컴포넌트 인라인 | **27종** |

어느 파일에 무엇이 있는지는 [`dist/inline-styles-index.md`](../dist/inline-styles-index.md) 에 있고,
원본은 `source/screens/` 에 있습니다. 「얼굴」 화면의 연출은 [13번 문서](13-signature-screens.md)에서 다룹니다.

### 지속시간 `MOTION`

| 키 | 시간 | 용도 |
|---|---|---|
| `instant` | 120ms | 호버 색 변화 |
| `fast` | 200ms | 모달 페이드, 카드 호버 |
| `normal` | 320ms | 페이지 전환, 드로어 |
| `slow` | 480ms | 1회성 강조 |

실제 CSS 는 더 짧은 값(0.12s · 0.15s · 0.18s · 0.22s)도 씁니다. 마이크로 인터랙션은 짧을수록 «반응이 좋다»고 느껴집니다.

### 🔴 회전 금지 · scale 금지

이 시스템의 모션 어휘는 **`translateY` 와 `opacity` 뿐**입니다.
예외는 스피너(`qa-spin`)와 사이드바 활성 점의 1회 펄스뿐입니다.

| 이름 | 움직임 | 시간 |
|---|---|---|
| `qa-page-fade` | 8px 떠오름 + 페이드 | 360 / 300ms |
| `qa-stagger` | 6px 떠오름, 자식마다 35ms 지연 | 360ms |
| `qa-fade-in` | 6px 떠오름 | 480ms |
| `qa-shimmer` | 띠가 좌→우 통과 | 1.4s 무한 |
| `qa-soft-pulse` | opacity 1→0.6, scale 1→1.08 | 2s 무한 |
| `qa-toast-shake` | ±3px 좌우 | 240ms 1회 |
| `qa-nav-active-pulse` | scale 1→1.4 | 600ms **1회** |
| `qa-ribbon-drift` | 리본 2겹 표류 | 32s / 38s 무한 |

### 값이 «너무 느려서» 되돌려진 기록

페이지 전환은 원래 **52px · 1400ms** 였습니다.
페이지마다 콘텐츠가 크게 슬라이드하며 1.4초 출렁여 「떠걱떠걱」의 원인이 되어
**8px · 360ms** 로 줄였습니다.

순차 등장도 원래 10px · 560ms · 간격 70ms(최대 600ms 지연)였는데
「위젯이 제각각 뜬다」는 인상 때문에 **6px · 360ms · 간격 35ms** 로 줄였습니다.

> **교훈: 우아함은 느림이 아닙니다.** 거리와 시간을 줄이고 «순서» 만 남기는 편이 낫습니다.

### 순차 등장 구현

```css
.qa-stagger > *:nth-child(1) { animation-delay: 0ms; }
/* … 35ms 씩 … */
.qa-stagger > *:nth-child(n + 9) { animation-delay: 280ms; }   /* 9번째부터 고정 */
```

**9번째부터 지연을 고정**하는 것이 요점입니다. 안 그러면 목록이 길 때 마지막 항목이 몇 초 뒤에 뜹니다.

> **⚠️ `.qa-stagger` 는 «한 묶음» 컨테이너에 겁니다.**
> KPI 행, 카드 목록처럼 서로 형제인 항목 대여섯 개짜리 묶음이 대상입니다.
> 페이지 루트에 걸면 안 됩니다. 이 저장소의 견본을 만들면서 실제로 그렇게 해 봤더니,
> 직계 자식이 스물한 개가 되면서 합성 레이어가 길게 살아 있어
> **스크롤 후 화면 캡처가 통째로 빈 화면으로 잡혔습니다.** (콘텐츠는 DOM 에 다 있었고 `opacity` 도 1이었습니다.)
> KPI 행 하나로 범위를 좁히자 바로 정상이 되었습니다.

---

## 5. 모션 줄이기 (WCAG 2.3.3)

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

전역 `*` 규칙이라 CSS-in-JS 인라인 트랜지션까지 함께 무력화됩니다.

> **🔴 그런데 이 전역 규칙만으로는 무한 반복이 안 꺼집니다.**
> `animation-duration: 0.01ms` + `iteration-count: 1` 이면 **초고속 깜빡임**이 됩니다.
> 그래서 무한 반복 애니메이션은 **개별로 `animation: none` 을 선언**해야 합니다.
> 원본은 `.qa-skeleton::after` · `.qa-pulse` · `.qa-stagger > *` · 리본 레이어에 각각 적어 두었습니다.
> 새 무한 애니메이션을 만들 때마다 이 한 줄을 잊지 마십시오.

---

## 6. 포커스 표시 (WCAG 2.4.7)

```css
:focus-visible {
  outline: 2px solid var(--qa-champagne);
  outline-offset: 2px;
}
:focus:not(:focus-visible) { outline: none; }
```

버튼·링크·역할 요소는 더 강화됩니다.

```css
outline: 2px solid var(--qa-champagne);
outline-offset: 4px;
box-shadow: 0 0 0 4px color-mix(in srgb, var(--qa-champagne) 22%, transparent);
```

**offset 을 4px 로 띄우고 보조 글로우를 더한 이유**는 샴페인 배경 버튼 위에서
같은 색 outline 이 묻히기 때문입니다.

`:focus` 단독은 마우스 클릭에도 걸려 공격적이므로 무력화합니다.

---

## 7. 호버

```css
.qa-btn:hover:not(:disabled)  { opacity: 0.88; }
.qa-btn:active:not(:disabled) { transform: translateY(1px); }

.qa-card-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.18),
              0 0 0 1px color-mix(in srgb, var(--qa-champagne) 18%, transparent);
  border-color: color-mix(in srgb, var(--qa-champagne) 30%, var(--qa-border));
}
```

**카드가 뜰 때 테두리에 금이 배어 나옵니다.** 그림자만 주는 것과 인상이 다릅니다.
`0 0 0 1px` 로 겹친 금색 링이 「금테」 효과를 냅니다.

누를 때 1px 내려앉는 것도 작지만 촉감을 만듭니다.

---

## 8. 스크롤

```css
html { scroll-behavior: smooth; scroll-padding-top: 24px; scroll-padding-bottom: 24px; }
body { overscroll-behavior-y: none; }   /* iOS pull-to-refresh 차단 */

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--qa-champagne) 22%, var(--qa-border));
  border-radius: 0;                      /* 스크롤바만 각집니다 */
}
::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--qa-champagne) 55%, var(--qa-borderHi));
}
* { scrollbar-width: thin; scrollbar-color: /* 같은 색 */ ; }
```

`scroll-padding` 이 있어야 앵커 이동 시 sticky 헤더가 목적지를 가리지 않습니다.
스크롤바 손잡이는 각져 있고 호버에서 금빛이 진해집니다.
