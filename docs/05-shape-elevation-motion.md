# 5장 · 모양 · 깊이 · 움직임

이 장은 모서리, 그림자와 배경막, 겹의 순서(Z), 움직임의 곡선 · 시간 · 어휘, 그리고 포커스 · 호버 · 스크롤의 표시를 정합니다.
값은 `dist/q-design.tokens.css` · `dist/q-design.tokens.json` 과 세 제품 공통 부품(`patterns/components.css` · `patterns/foundation.css`), 아뜰리에 기반(`patterns/foundation/atelier.css`)에서 나옵니다.

합친 옛 문서: 05 모양 · 깊이 · 모션 · 39 홈 위젯 편집 움직임

---

## 모서리 `RADIUS`

### 세 제품의 운영 규칙

일반 버튼, 입력, 카드, 상단 아이콘 버튼과 메뉴 버튼은 `patterns/components.css` 의 `--qd-radius` 를 따릅니다. 기본값은 10px 입니다(오너 결정 2026-09-24).
아이콘 버튼만 6px 로 바꾸거나 제품 화면에 숫자를 다시 적지 않습니다. `--qd-radius-control` 과 `--qd-radius-card` 는 같은 중앙 값의 역할 이름입니다.
공통 기반(`patterns/foundation.css`)은 유틸리티 크기 이름(`--qd-radius-sm` ~ `--qd-radius-3xl`)도 모두 `--qd-radius` 로 묶어, 직사각형 면은 크기 이름과 상관없이 한 모서리를 씁니다.

아래 표는 원본 토큰의 계단입니다. 표의 작은 값이 일반 아이콘 버튼의 규칙을 뜻하지 않습니다. 원형 프로필이나 상태 점처럼 형태 자체가 원인 요소는 사각 조작부와 구분하며, 화면별 예외는 사용처와 중앙 소유 규칙을 확인해야 합니다.

| 키 | px | 용도 |
|---|---:|---|
| `sm` | 6 | 원본 호환값 · 배지. 일반 아이콘 버튼에는 쓰지 않음 |
| **`md`** | **10** | **카드 · 버튼 · 입력 전부** |
| `lg` | 14 | 큰 패널 |
| `xl` | 20 | 드물게 |
| `pill` | 9999 | 알약 |

**10px 단일값이 이 시스템의 결정입니다.** 8 과 12 사이의 값으로 통일합니다.
8 은 조금 딱딱하고 12 는 조금 물렁합니다. 10 은 «정밀하게 다듬은» 인상을 줍니다.

정본 CSS 가 이 10 을 `--qd-radius-control` 로 내보냅니다(`dist/q-design.list.css` · 목록은 [7장](07-screens.md)).
제품은 그 변수를 읽기만 하고 10 을 다시 적지 않습니다.

### 모서리는 맥락을 읽습니다

```css
border-radius: var(--qd-radius, var(--qa-radius-card, 10px));             /* 아뜰리에 Bx */
--qd-radius-control: var(--qd-radius-control-src, var(--qd-radius, 10px)); /* 목록 정본 */
```

부품은 모서리 숫자를 직접 갖지 않고 맥락의 변수를 읽습니다. 지금은 전문가 포털도 앱과 같은 10 을 씁니다(오너 결정 2026-09-14).
다른 모서리가 필요한 맥락이 생기면 부품을 포크해 사본을 만들지 않고, 그 맥락에서 변수 한 줄만 덮습니다.

---

## 깊이

### 세 제품 공통 부품

공통 부품에서 카드는 그림자가 없습니다(`.qd-card { box-shadow: none }` · `--qd-shadow-sm` · `--qd-shadow-md` 가 `none`).
떠 있는 겹(대화상자 · 서랍 · 팝오버 · 툴팁 · 토스트)만 `--qd-shadow-overlay: 0 12px 36px rgb(0 0 0 / 0.16)` 을 씁니다.
배경막은 뒤의 작업을 흐리지 않고(`backdrop-filter: none`), 내용 면은 불투명합니다. 배경막 색은 `--qd-backdrop: rgb(0 0 0 / 0.48)` 입니다.
부품별 쓰임은 [6장](06-components.md)에 있습니다.

아래는 아뜰리에 원본 토큰의 그림자 두 계열입니다. **성격이 다릅니다.**

### 테마 인지 `ELEVATION` (새 코드 권장)

```css
/* 다크 */                                  /* 라이트 */
--qa-shadow-sm: 0 2px 8px   rgba(0,0,0,0.25)    0 2px 8px   rgba(80,65,40,0.10)
--qa-shadow-md: 0 6px 18px  rgba(0,0,0,0.35)    0 6px 18px  rgba(80,65,40,0.14)
--qa-shadow-lg: 0 20px 60px rgba(0,0,0,0.55)    0 20px 50px rgba(80,65,40,0.18)
--qa-shadow-xl: 0 30px 90px rgba(0,0,0,0.6)     0 30px 70px rgba(80,65,40,0.22)
```

라이트에서 색이 검정이 아니라 **따뜻한 sepia** 입니다. 흰 배경에 검정 그림자는 거칩니다.

### 고정 다크 `SHADOW` (2겹)

```
hairline  0 1px 0 rgba(255,255,255,0.04) inset,  0 1px 2px rgba(0,0,0,0.2)
surface   0 1px 0 rgba(255,255,255,0.05) inset,  0 4px 16px -4px rgba(0,0,0,0.35)
float     0 1px 0 rgba(255,255,255,0.06) inset,  0 12px 32px -8px rgba(0,0,0,0.45)
anchor    0 1px 0 rgba(255,255,255,0.06) inset,  0 20px 60px -20px rgba(0,0,0,0.55)
```

CSS 변수로는 `--qa-shadow-fixed-hairline` 처럼 나갑니다.
**위쪽 안쪽 흰 선 + 아래쪽 깊은 그림자**의 2겹 구조입니다.
안쪽 흰 선이 «금속에 빛이 스치는» 인상을 만듭니다. 이것이 럭셔리 톤의 핵심 장치입니다.

다만 다크 고정값이므로 **라이트에서도 흰 선이 남습니다.** 새로 쓰신다면 `ELEVATION` 쪽을 쓰십시오.

### 배경막

```css
--qa-backdrop:        rgba(0,0,0,0.65)    /* 라이트: rgba(40,30,18,0.32) */
--qa-backdrop-strong: rgba(0,0,0,0.75)    /* 라이트: rgba(40,30,18,0.45) */

.qa-backdrop {
  background: color-mix(in srgb, var(--qa-bg) 70%, transparent);
  backdrop-filter: none;
}
```

아뜰리에의 `.qa-backdrop` 도 공통 부품과 같이 흐림 없이 바탕색을 섞은 반투명 면입니다.

---

## 겹의 순서 `Z`

| 키 | 값 | 무엇 |
|---|---:|---|
| `base` | 1 | |
| `dropdown` | 50 | |
| `sticky` | 100 | |
| `header` | 200 | |
| `fab` | 300 | 떠 있는 단추 |
| `bottomNav` | 400 | 모바일 아래 탭줄 |
| `drawerFab` | 500 | 서랍 여는 햄버거 |
| `drawerBackdrop` | 600 | 서랍 배경막 |
| `drawer` | 700 | 서랍 본체 |
| `overlay` | 1000 | 모달 배경막 |
| `modal` | 1100 | 모달 본체 |
| `popover` | 1200 | 팝오버 |
| `tooltip` | 9999 | 최상위 힌트 |
| `toast` | 10000 | 실패 메시지. 모달 위에서도 읽혀야 함 |
| `blocking` | 10001 | 파괴 확인. 「지울까요?」 위에 다른 것이 뜨면 안 됨 |
| `sessionGate` | 10002 | 로그인이 풀렸다는 사실. 그 위의 어떤 것도 더는 뜻이 없음 |

떠 있는 층은 사다리에 **칸이 있어야** 합니다. 칸이 없으면 각자 숫자를 지어내고, 값이 같아지면 순서는 DOM 이, 즉 우연이 정합니다.
위로 갈수록 «가려지면 안 되는 정도» 입니다. 계약이 단조 증가와 raw 숫자를 지킵니다([10장](10-rules.md)의 ⑥ · ⑨).

---

## 움직임

### 곡선

```
cubic-bezier(0.16, 1, 0.3, 1)   /* ease-out expo */
```

빠르게 나가서 아주 부드럽게 멈춥니다. 등장 움직임의 기본 곡선입니다(`--qa-motion-easeOutExpo` · 세 제품 공통 `--qd-ease`).
보조로 `cubic-bezier(0.65, 0, 0.35, 1)` (ease-in-out)이 있고, 접기 · 펼치기는 `(0.22, 1, 0.36, 1)` 을 씁니다.
이 셋이 다른 집과 어떻게 다른지는 [참고 · 이징 조사](reference/easing-study.md)에 숫자로 있습니다(기본 곡선은 흔한 ease-out 보다 한 단 급해 90% 에 전체 시간의 33% 만에 닿고, 보조 곡선은 «자리를 옮길 때» 의 표준값과 같습니다). 나가는 움직임의 곡선은 아직 정하지 않았습니다.

### 지속 시간 `MOTION`

| 키 | 시간 | 용도 |
|---|---|---|
| `instant` | 120ms | 호버 색 변화 |
| `fast` | 200ms | 모달 페이드, 카드 호버 |
| `normal` | 320ms | 페이지 전환, 드로어 |
| `slow` | 480ms | 1회성 강조 |

세 제품 공통 부품은 `--qd-motion-fast: 160ms` · `--qd-motion-normal: 200ms` 를 쓰고, 움직임 줄이기에서는 둘 다 0ms 입니다.
실제 CSS 는 더 짧은 값(0.12s · 0.15s · 0.18s · 0.22s)도 씁니다. 작은 반응은 짧을수록 «반응이 좋다» 고 느껴집니다.

### 회전 금지 · scale 금지

움직임은 **이동(translate)과 투명도(opacity)** 로 합니다.
예외는 스피너(`qa-spin`), 알림의 남은 시간 띠(`qa-toast-progress` · scaleX), 사이드바 선택 밑줄의 1회 펼침(scaleX 0 → 1 · 오너 결정 2026-09-27 «문서 결»),
그리고 아래 «홈 위젯 편집 움직임» 의 아주 작은 기울임입니다.

| 클래스 | 키프레임 | 움직임 | 시간 |
|---|---|---|---|
| `.qa-page-fade` | `qa-page-fade-in` | 페이드만(떠오름 없음) | 160ms |
| `.qa-stagger` | `qa-stagger-rise` | 6px 떠오름, 자식마다 35ms 지연 | 360ms |
| `.qa-fade-in` | `qa-fade-in-soft` | 6px 떠오름 | 480ms |
| `.qa-skeleton` | `qd-skeleton-pulse` | 투명도 1 → 0.5 → 1 | 1.6s 무한 |
| `.qa-pulse` | `qa-soft-pulse` | opacity 1 → 0.6, scale 1 → 1.08 | 2s 무한 |
| `.qa-toast-shake` | `qa-toast-shake` | ±3px 좌우 | 240ms 1회 |
| `.qa-nav-active-underline` | `qa-nav-active-underline-in` | 선택 밑줄 scaleX 0 → 1 (왼쪽부터) | 320ms **1회** |
| `.qa-ribbon-layer-1` · `-2` | `qa-ribbon-drift-1` · `-2` | 리본 2겹 표류 | 32s / 38s 무한 |

선택 밑줄은 반복하지 않습니다. 계속 깜빡이는 표시는 불편합니다.

### 우아함은 느림이 아닙니다

거리와 시간을 줄이고 «순서» 만 남깁니다. 크게 미끄러지며 오래 출렁이는 페이지 전환과 제각각 뜨는 위젯은 「떠걱떠걱」 하는 인상을 줍니다.
페이지 전환이 페이드만 160ms 인 까닭도 같습니다. 누르는 순간 진행선이 움직여도 도착한 내용이 오래 투명하면 «빨라졌다» 가 성립하지 않고,
떠오르는 몇 px 동안 글이 한 번 더 흔들립니다.

### 순차 등장 구현

```css
.qa-stagger > *:nth-child(1) { animation-delay: 0ms; }
/* … 35ms 씩 … */
.qa-stagger > *:nth-child(n + 9) { animation-delay: 280ms; }   /* 9번째부터 고정 */
```

**9번째부터 지연을 고정**하는 것이 요점입니다. 그러지 않으면 목록이 길 때 마지막 항목이 몇 초 뒤에 뜹니다.

> **`.qa-stagger` 는 «한 묶음» 컨테이너에 겁니다.**
> KPI 행, 카드 목록처럼 서로 형제인 항목 대여섯 개짜리 묶음이 대상입니다. 페이지 루트에 걸지 않습니다.
> 페이지 루트(직계 자식 스물한 개)에 걸었을 때 합성 레이어가 길게 살아 있어, 스크롤 뒤 화면 캡처가 통째로 빈 화면으로 잡힌 일이 있습니다(내용은 DOM 에 다 있었고 `opacity` 도 1 이었습니다). 범위를 KPI 행 하나로 좁히면 정상입니다.

### 키프레임이 있는 곳

아뜰리에의 전역 키프레임 45종은 `patterns/foundation/atelier.css` 에 있습니다.
서랍이 미끄러지는 3종(`qa-drawer-slide-r` · `-l` · `-b`)은 CSS 파일이 아니라 `source/design/atelier-runtime.ts` 의 중앙 규칙에 있고, 부품이 `<style>` 로 넣습니다.
**CSS 파일만 읽으면 이 셋이 빠집니다.** 부품별 색인은 `dist/inline-styles-index.md` 에 있고, 원본은 `source/screens/` 에 있습니다.
「얼굴」 화면(로그인 입장 연출 등)의 움직임은 [참고 · 얼굴 화면](reference/signature-screens.md)에서 다룹니다.
제품 밖에서 움직이는 것(소개 영상 · 홍보 클립)을 도구에 시킬 때의 브리프 뼈대는 [참고 · 움직임 브리프 조사](reference/motion-brief-study.md)에 있습니다. 값은 이 장에서 가져가고, 스프링 · 바운스 · 젖빛 유리는 거기서도 쓰지 않습니다.
폰 아래 탭줄의 전환 연출(지금은 글자색 140ms 뿐)은 [참고 · 아래 탭줄 움직임 조사](reference/tabbar-motion-study.md)에 시안 셋(금선 이동 · 금선 1회 펼침 · 아이콘 뒤 면 투명도)을 두었습니다. 오너가 고르면 이 장의 키프레임 표에 오릅니다.
화면 사이 전환(지금은 페이드만 160ms · 방향 없음)은 [참고 · 화면 전환 조사](reference/screen-transition-study.md)에 시안 셋(폰 앱 목록 → 상세에 6px 방향 · 제목 이어짐 시험 · 순차 등장 범위)을 두었습니다. 커지고 작아지는 전환은 거기서도 쓰지 않습니다.

### 홈 위젯 편집 움직임

위젯 편집에서는 이름과 조작 단추를 포함한 바깥 틀(`.qa-edit-item`)을 회전하거나 이동하지 않습니다.
미리보기 본체(`.qa-edit-body`)에만 짧은 편집 진입 표시를 줍니다.

| 변수 | 기본값 | 뜻 |
|---|---|---|
| `--qd-widget-edit-tilt` | 0.12deg | 기울임 각도 |
| `--qd-widget-edit-cycle` | 1.4s | 한 번의 주기 |
| `--qd-widget-edit-cycles` | 2 | 반복 횟수. 2.8초 뒤 수평으로 멈춤 |

- 마우스를 올리거나 내부 조작 단추에 키보드 초점이 들어오면(`:focus-within`) 본체 움직임도 멈춥니다.
- 드래그 중에는 기울임을 멈추고 투명도 표시(0.5)를 유지합니다.
- 터치 중심 입력(`pointer: coarse`)과 움직임 줄이기 설정에서는 기울이지 않습니다.
- 편집 표시는 드래그 · 순서 변경 · 숨기기 동작과 단추 크기를 바꾸지 않습니다.

정본은 `patterns/foundation/atelier.css` 입니다. 위 세 변수로 조절하고, `tools/build-foundation.mjs` 와 `tools/sync.mjs` 를 거쳐 제품에 반영합니다(`node tools/extract-all.mjs --sync` 가 둘을 차례로 부릅니다).
생성된 제품 CSS 를 직접 고치지 않습니다.

---

## 움직임 줄이기 (WCAG 2.3.3)

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

전역 `*` 규칙이라 CSS-in-JS 인라인 트랜지션까지 함께 꺼집니다.

> **그런데 이 전역 규칙만으로는 무한 반복이 안 꺼집니다.**
> `animation-duration: 0.01ms` + `iteration-count: 1` 이면 **아주 빠른 깜빡임**이 됩니다.
> 그래서 무한 반복 애니메이션은 **개별로 `animation: none` 을 선언**해야 합니다.
> 지금은 `.qa-skeleton` · `.qa-pulse` · `.qa-stagger > *` · `.qa-page-fade` · `.qa-fade-in` · 리본 레이어에 각각 적혀 있습니다.
> 새 무한 애니메이션을 만들 때마다 이 한 줄을 잊지 마십시오.

---

## 포커스 표시 (WCAG 2.4.7)

```css
:focus-visible {
  outline: 2px solid var(--qa-champagne);
  outline-offset: 2px;
}
:focus:not(:focus-visible) { outline: none; }
```

버튼 · 링크 · 입력칸 · 역할 요소는 더 강하게 그립니다.

```css
outline: 2px solid var(--qa-champagne);
outline-offset: 4px;
box-shadow: 0 0 0 4px color-mix(in srgb, var(--qa-champagne) 22%, transparent);
```

**offset 을 4px 로 띄우고 보조 글로우를 더하는 까닭**은 샴페인 바탕 버튼 위에서
같은 색 outline 이 묻히기 때문입니다.
입력칸(`input` · `textarea` · `select`)도 이 규칙에 들어 있어야 합니다. 인라인 `outline: none` 은 클래스를 이기지만 `box-shadow` 는 건드리지 않으므로, 전역 규칙을 넓혀 두면 인라인이 새로 생겨도 표시가 남습니다(계약은 [10장](10-rules.md)의 ⑳).

`:focus` 단독은 마우스 클릭에도 걸려 공격적이므로 끕니다.

---

## 호버

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

## 스크롤

```css
html { scroll-behavior: smooth; scroll-padding-top: 24px; scroll-padding-bottom: 24px; }
body { overscroll-behavior-y: none; }   /* iOS 당겨서 새로고침 차단 */

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

`scroll-padding` 이 있어야 앵커 이동 때 sticky 머리가 목적지를 가리지 않습니다.
스크롤바 손잡이는 각져 있고 호버에서 금빛이 진해집니다.
