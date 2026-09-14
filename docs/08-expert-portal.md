# 전문가 포털 테마

같은 제품 안에 있지만 **다른 디자인 언어**를 쓰는 영역입니다.
외부 전문가(자문위원)가 들어오는 포털이라, 업무 도구가 아니라 «초대장» 처럼 보여야 합니다.

원본: `source/css/expert-theme.css` (2,486줄) · 스코프: `.expert-portal-root`

---

## 무엇이 다른가

| | 메인 앱 | 전문가 포털 |
|---|---|---|
| 모서리 | **10px** | ~~0 (각짐)~~ → **10px** (2026-09-14 오너 결정 「전문가 포털도 굴려줘 · 통일」. 배지는 6) |
| 헤딩 글꼴 | Pretendard | **Cormorant Garamond** (영문) |
| 입력 | 상자 (테두리 4면) | **밑줄만** |
| 금색 | `#b8935a` | `#c9a86a` (더 밝음) |
| 경계선 | 무채색 `#242424` | **금빛 반투명** `rgba(금, 0.12)` |
| 배경 | 단색 | 금빛 워시 + **필름 그레인** + 비네트 |
| 크기 사다리 | 값보존(24종) | **역할 기반(7종)** |
| 위험색 | 액센트 재사용 | **버건디 패밀리 별도** |

같은 브랜드인데 «격» 이 다릅니다. 앱은 정밀한 작업대이고, 포털은 서신입니다.

---

## 1. 팔레트

```css
--ink:      #08070a     /* 배경. 앱보다 더 깊습니다 */
--obsidian: #100e0c
--velvet:   #18161a     /* 카드 */
--hairline:        rgba(var(--champagne-rgb), 0.12)   /* 실선이 금빛입니다 */
--hairline-strong: rgba(var(--champagne-rgb), 0.28)

--champagne:        #c9a86a
--champagne-soft:   #b8995d
--champagne-bright: #e0c084

--cream:       #f3ede0
--cream-muted: #cfc5b3
--mist:    #aaa395     /* 라벨·섹션제목·meta */
--whisper: #8a8377     /* 힌트·부가정보 */

--burgundy: #b8624c    /* 위험·경고 패밀리 (빨강 대신) */
--burgundy-bright / -soft / -deep / -deep-bright

--status-verified/pending/progress/rejected     /* 인증 상태 4색 */
--risk-critical/high/medium/low/unknown         /* 위험도 5색 */
```

**경계선이 금빛 반투명**인 것이 결정적입니다.
무채색 실선은 «칸막이» 로 보이고, 금빛 실선은 «장정(裝幀)» 으로 보입니다.

빨강 대신 버건디를 쓰는 이유는, `#ef4444` 같은 밝은 빨강이 다크 + 금색과 부조화하기 때문입니다.

---

## 2. 🔑 공용 부품이 포털 말투를 쓰게 하는 법

**이 대목이 이 문서에서 가장 옮길 가치가 있습니다.**

포털 안에서 메인 앱 공용 부품(버튼·카드·입력)을 그대로 쓰는데,
그것들이 앱 팔레트로 그려져 **한 화면에 금색이 두 가지**였습니다.

| | 포털 | 앱 |
|---|---|---|
| 금색 | `#c9a86a` | `#b8935a` |
| 경계 | 금빛 실선 | `#242424` 무채색 |
| 보조 글자 | `#cfc5b3` | `#b7b0a5` |

부품을 포크해 사본을 만드는 대신, **변수를 갈아 끼웠습니다.**

```css
.expert-portal-root {
  --qa-bg:        var(--ink);
  --qa-surface:   var(--velvet);
  --qa-surface2:  var(--obsidian);
  --qa-text:      var(--cream);
  --qa-subtle:    var(--cream-muted);
  --qa-muted:     var(--mist);
  --qa-border:    var(--hairline-strong);
  --qa-borderHi:  var(--champagne-soft);
  --qa-champagne: var(--champagne);
  --qa-green:     var(--status-verified);
  --qa-red:       var(--status-rejected);
  --qa-warning:   var(--status-pending);
  --qa-blue:      var(--status-progress);
  --qa-radius-card: 0;          /* 카드가 각지게 */
}
```

CSS 변수는 상속되므로 **여기서 한 번 갈아 끼우면 포털 안의 모든 공용 부품이 자동으로 포털 말투**가 됩니다.
포털 밖은 한 픽셀도 안 바뀝니다.

라이트 모드도 저절로 따라옵니다. 값을 «베껴 적지» 않고 **토큰을 가리켰기** 때문입니다.
값을 복사했다면 라이트에서 어긋났을 것입니다.

### 세 가지 실전 요령

**① 경계선은 `hairline`(0.12) 이 아니라 `hairline-strong`(0.28) 으로 갑니다.**
`--qa-border` 는 카드 테두리뿐 아니라 **버튼·입력 테두리**로도 쓰이는데,
0.12 로 가면 거의 사라져 «조작할 수 있는 것» 으로 안 보입니다.

**② `--qa-green` 을 `--risk-low` 에 연결했다가 되돌렸습니다.**
그 토큰에 라이트 대비값이 없었고, 의미도 다릅니다.
공용 green 은 «성공/확인» 이지 «위험도 낮음» 이 아닙니다.

**③ 카드 모서리는 부품이 폴백으로 읽게 만들었습니다.**

```css
/* 부품 쪽 */ border-radius: var(--qa-radius-card, 10px);
/* 포털 쪽 */ --qa-radius-card: 0;
```

포털에서 둥근 요소가 정확히 5개였고 전부 앱 공용 부품이었습니다.
「카드 안의 다른 카드」로 보였습니다.

---

## 3. 글꼴 체인

```css
--serif: var(--font-cormorant), 'Cormorant Garamond', var(--qa-font-pretendard), Georgia, serif;
--sans:  var(--qa-font-pretendard), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--mono:  'JetBrains Mono', 'SF Mono', Consolas, var(--qa-font-pretendard), monospace;
```

**Pretendard 를 각 체인의 «라틴 폰트 바로 뒤»** 에 둡니다. 라틴은 의도한 얼굴로, 한글은 언제나 Pretendard 로 갑니다.

> 이 배치를 몰라서 실제로 사고가 났습니다.
> `next/font` 로 로드된 폰트는 **자동 생성 대체 폰트**를 함께 갖는데 그것이 한글을 먼저 가로챕니다.
> 그래서 한글이 자리마다 다른 폰트로 그려졌습니다 (같은 문구 렌더 폭 916 / 884 / 1020 / 828px).
> 셋 다 «아무도 고르지 않은» 폰트였고 OS 마다 달라졌습니다.
> `Noto Serif KR` · `Noto Sans KR` 은 이름만 있고 **로드되지 않았습니다.**

### italic 전면 차단

```css
.expert-portal-root, .expert-portal-root *,
.expert-portal-root em, .expert-portal-root i,
.expert-portal-root cite, .expert-portal-root address {
  font-style: normal !important;
}
.expert-portal-root .hl-champagne { color: var(--champagne); font-weight: 500; }
```

브랜드 규칙입니다. 강조는 기울임이 아니라 **금색 + weight 500** 으로 합니다.
Cormorant italic 은 애초에 로드하지도 않습니다.

---

## 4. 역할 기반 크기 사다리

메인 앱이 «값보존» 사다리(24종)를 쓰는 것과 대조적으로, 포털은 **역할로 7칸**만 둡니다.

```css
--fs-label:  11px   /* 모노 · 대문자 · 넓은 자간: eyebrow · 필드 라벨 · 코드 · 탭 */
--fs-ui:     12px   /* 산세리프 UI 문자열: 버튼 · 칩 · 알림 · 각주 */
--fs-body:   14px   /* 본문 */
--fs-lead:   16px   /* 리드문 · 입력 · 인용 */
--fs-title:  20px   /* 카드 제목 */
--fs-brand:  22px   /* 워드마크 */
--fs-figure: 44px   /* 숫자 · 장식 인용부호 */
```

원래 고정 크기가 14종이었습니다. **크기가 많은 게 문제가 아니라 «같은 역할이 두 크기, 같은 크기가 두 역할» 인 게 문제**였습니다.
옛 클래스와 새 클래스 두 세대가 섞여 「검토 대상 문서」(12px)와 「진행 중인 자문」(11px)이 같은 위계인데 다른 크기였습니다.

**나눔 기준이 깨끗했습니다: 모노·대문자·넓은 자간 = 라벨 / 산세리프 = UI 문자열.**

반응형 축소와 아이콘 글리프는 이 사다리 밖입니다. 거긴 «크기가 곧 뜻» 이라 묶으면 오히려 잘못됩니다.

### 배지 기하도 변수로

```css
--badge-pad:      5px 12px;
--badge-size:     12px;
--badge-tracking: 0.12em;
```

상태 배지와 마감 배지 높이가 22 vs 31.2px 로 갈려 「네모 크기가 왜 다르냐」는 지적을 받았습니다.
값을 맞추기만 하면 또 갈리므로 **변수로 묶었습니다.**

---

## 5. 분위기 3겹

```css
.expert-portal-root::before {         /* 금빛 워시 */
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background:
    radial-gradient(ellipse 70% 50% at 50% 0%,   rgba(금, 0.06), transparent 70%),
    radial-gradient(ellipse 60% 40% at 50% 100%, rgba(금, 0.03), transparent 60%);
}

.expert-portal-noise {                /* 필름 그레인 */
  position: fixed; inset: 0; opacity: 0.025; z-index: 1;
  background-image: url("data:image/svg+xml,…feTurbulence baseFrequency='0.85'…");
  mix-blend-mode: overlay;
}

.expert-portal-vignette {             /* 비네트 */
  position: fixed; inset: 0; z-index: 2;
  background: radial-gradient(ellipse 80% 60% at center, transparent 50%, rgba(0,0,0,0.35));
}

.expert-portal-root > *:not(.expert-portal-noise):not(.expert-portal-vignette) {
  position: relative; z-index: 10;
}
```

**SVG `feTurbulence` 로 만든 필름 그레인**(외부 이미지 없이 CSS 만으로)이
평평한 다크 배경을 «인쇄물» 처럼 만듭니다. opacity 0.025 로 거의 안 보이는데, 끄면 확실히 밋밋해집니다.

---

## 6. 대표 부품

```css
.eyebrow            mono · 11px · 자간 0.3em · uppercase · mist
.display-1          serif · clamp(40px, 6vw, 80px) · weight 500 · 자간 -0.025em · lh 1.1
.luxe-section-title mono · 11px · 자간 0.4em · champagne · uppercase
                    margin clamp(48px, 6vw, 72px) 0 24px · flex + gap 16
.luxe-card          background rgba(velvet, 0.4) · border 1px hairline · padding 32
                    전환 border-color 280ms
.btn-gold           padding 16px 32px · champagne 배경 · ink 글자
                    weight 600 · 자간 0.12em · uppercase · radius 0
.luxe-input         밑줄만 (border-bottom 1px hairline-strong)
                    padding 10px 0 14px · 16px · 배경 transparent
.status-pill        badge-pad · badge-size · badge-tracking · border 1px · radius 0
```

**자간이 앱보다 훨씬 넓습니다** (0.3em ~ 0.4em vs 앱의 0.08em).

> 2026-09-14: 이 자간은 **라틴 라벨** 이야기입니다. 한글에는 걸지 않습니다(앱과 같은 규칙:
> 한글 자간 0 · 모노 칸 공백 -0.35em). 포털은 라벨이 CSS 클래스라 내용을 보고 표지를 붙이는
> `components/expert/HangulTracking` 한 곳이 담당하고, 모서리도 앱과 같은 10px 로 바뀌었습니다
> (`--qa-radius-card: 0` 덮어쓰기는 없어졌습니다. 아래 §의 「각지게」 설명은 그때의 기록입니다).
영문 위주 화면이라 가능한 선택입니다. 한글에는 이 값을 걸면 안 됩니다.

이징도 다릅니다: `cubic-bezier(0.22, 1, 0.36, 1)` (앱은 `0.16, 1, 0.3, 1`).

---

## 7. 옮겨 쓴다면

포털 테마 전체를 가져갈 일은 드물 것입니다. 다만 세 가지는 어디서나 쓸 만합니다.

1. **변수 갈아 끼우기로 자매 테마 만들기.** 부품을 포크하지 않고 스코프 하나로 다른 말투를 만드는 법.
2. **역할 기반 크기 사다리.** 값이 아니라 역할로 나누면 「같은 역할 두 크기」가 안 생깁니다.
3. **`feTurbulence` 필름 그레인.** 이미지 없이 평평한 배경에 질감을 주는 가장 싼 방법입니다.

### 그리고 경고 하나

포털 안의 공용 의견서 폼은 이 사다리를 따르지 않습니다.
메인 앱과 함께 쓰는 부품이라 앱 스케일을 **인라인**으로 쓰고, **인라인은 CSS 로 못 이깁니다.**

> 부품을 공유하면서 테마만 바꾸려면, 그 부품이 값을 **변수로** 받아야 합니다.
> 인라인으로 박힌 값은 스코프 재정의가 닿지 않습니다.
