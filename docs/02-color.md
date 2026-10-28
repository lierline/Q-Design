# 2장 · 색

이 장은 Q-Design 의 색을 정합니다. 팔레트 네 벌의 값, 상태색과 대비 기준, 색을 쓰는 관용구와 금지 사항,
그리고 같은 팔레트를 Q-Atelier · Q-Maison · Q-Carnet 세 제품의 변수로 내보내는 길을 적습니다.

합친 옛 문서: 02 색 · 33 세 제품 화면 팔레트 정본

팔레트는 네 벌입니다. **다크(기본) · 라이트 · 인쇄 · 전문가 포털.**
앞의 셋은 같은 변수 이름을 공유하고 값만 바뀝니다. 넷째는 [8장 종이 · 문서](08-paper.md)에서 다룹니다.
값의 뿌리는 `dist/q-design.tokens.json` 이고, `node tools/extract-all.mjs` 가 원본 사본 → 토큰 → 제품 팔레트 → 계단 → 대비 문서를 차례로 만듭니다.

색을 고칠 때 지켜야 할 한 가지 원칙이 있습니다.

> **가장 어려운 표면을 기준으로 잡습니다.**
> 배경 하나만 보고 맞추면 카드 위에서 조용히 미달합니다.

---

## 구조

색은 **세 층**으로 되어 있습니다.

| 층 | 예 | 성격 |
|---|---|---|
| 표면 | `bg` `surface` `surface2` | 무엇 위에 놓이는가 |
| 경계 | `border` `borderHi` · 조작 윤곽 `ctl` | 구획을 나누는 실선, 누르는 곳의 테두리 |
| 전경 | `text` `subtle` `muted` + 액센트 5종 | 그 위에 놓이는 것 |

표면이 셋인 이유는 층위가 셋이기 때문입니다.
`bg`(페이지) 위에 `surface`(카드)가 놓이고, 그 안에서 다시 한 겹 들어가면 `surface2`(입력칸·강조 블록)입니다.

---

## 다크 (기본)

```css
--qa-bg:        #0c0c0c   /* 페이지 바닥 */
--qa-surface:   #141414   /* 카드 */
--qa-surface2:  #1b1b1b   /* 카드 안의 한 겹 더 */
--qa-border:    #242424
--qa-borderHi:  #333333   /* hover · 강조 경계 */
--qa-ctl:       #7a7364   /* 조작 윤곽 · 아래 «조작 윤곽» 절 */
--qa-text:      #f0ebe0   /* 순백이 아닌 «크림» 입니다. 이게 톤을 만듭니다 */
--qa-subtle:    #b7b0a5
--qa-muted:     #898271
--qa-champagne: #b8935a   /* 브랜드 액센트 */
--qa-green:     #7ab87a
--qa-red:       #c97a7a
--qa-warning:   #c9a87a
--qa-blue:      #7a9ac9
--qa-on-accent: #0a0908   /* 액센트 «면» 위에 놓는 글자색 */
```

**`text` 가 `#ffffff` 가 아니라 `#f0ebe0` 인 것이 이 시스템의 핵심입니다.**
순백을 쓰면 차가운 개발자 도구가 되고, 크림을 쓰면 종이의 온기가 남습니다.
검정도 마찬가지로 `#000` 이 아니라 `#0c0c0c` 입니다.

### 왜 샴페인인가

브랜드가 «아틀리에(공방)» 이고, 금은 장인의 재료입니다.
다만 화려한 금(`#d4af37` 류)이 아니라 **한 단계 죽인 금**(`#b8935a`)입니다.

---

## 라이트

```css
--qa-bg:        #faf9f6   /* 흰색이 아닌 «따뜻한 종이» */
--qa-surface:   #ffffff
--qa-surface2:  #f3f1ec
--qa-border:    #e2dfd8
--qa-borderHi:  #c8c4ba
--qa-ctl:       #8c8575
--qa-text:      #1c1a16
--qa-subtle:    #4a4540
--qa-muted:     #726b5e
--qa-champagne: #8a6838   /* 다크보다 훨씬 어둡습니다 */
--qa-green:     #3d7a3d
--qa-red:       #a83838
--qa-warning:   #97621f
--qa-blue:      #2d5fa8
--qa-on-accent: #ffffff   /* 반대로 뒤집힙니다 */
```

### 액센트가 테마에 따라 뒤집힙니다

다크의 샴페인(`#b8935a`)은 밝고, 라이트의 샴페인(`#8a6838`)은 어둡습니다.
대비를 맞추려면 그럴 수밖에 없습니다. 그래서 **액센트 면 위에 놓는 글자색도 뒤집힙니다.**

```css
/* 이렇게 하면 라이트 모드에서 진한 금 위에 검정이 되어 안 읽힙니다 */
background: var(--qa-champagne); color: #0a0908;   /* ✗ */

/* 토큰이 알아서 뒤집습니다 */
background: var(--qa-champagne); color: var(--qa-on-accent);   /* ✓ */
```

원본은 이 규칙을 계약으로 강제합니다(Q-Atelier `lib/design/on-accent-contract.test.ts`: 부품에 흰 글자 리터럴 0개).

### 라이트의 그림자는 회색이 아닙니다

흰 배경에 검정 그림자를 쓰면 거칩니다. 따뜻한 sepia 톤을 씁니다.

```css
/* 다크 */  --qa-shadow-md: 0 6px 18px rgba(0, 0, 0, 0.35);
/* 라이트 */ --qa-shadow-md: 0 6px 18px rgba(80, 65, 40, 0.14);
```

백드롭도 마찬가지입니다. 라이트는 `rgba(40, 30, 18, 0.32)` 로 갈색기가 돕니다.

---

## 인쇄

`@media print` 에서 팔레트가 통째로 갈립니다. 다크 모드로 보고 있어도 종이는 흽니다. 값은 모두 `!important` 로 덮습니다.

```css
--qa-bg: #ffffff · --qa-surface: #ffffff · --qa-surface2: #f5f3ee
--qa-border: #d4d0c8 · --qa-borderHi: #999488 · --qa-ctl: #7a7568
--qa-text: #1a1814 · --qa-subtle: #4a4540 · --qa-muted: #746e62
--qa-champagne: #8a6a3a · --qa-on-accent: #ffffff
```

`@page { margin: 18mm 16mm 22mm; size: A4 }` 이고, 모든 페이지 하단에 브랜드 워터마크가 찍힙니다.
사이드바·버튼·리본 배경은 인쇄에서 사라집니다.

**이 시스템이 규제 문서를 다루기 때문에 인쇄가 일급 시민입니다.** 심사원은 출력물을 읽습니다.
종이 문서의 짜임은 [8장 종이 · 문서](08-paper.md)에 있습니다.

---

## 조작 윤곽 `--qa-ctl`

입력 칸 · 보조 단추 · 아이콘 단추 · 목록 쪽 이동 단추 · 거르개 칸의 테두리는 «누르는 곳» 을 알리는 선이라 인접 면과 **3:1 이상**(WCAG 1.4.11)이어야 합니다.
행 구분선 색(`--qa-border`)은 1.2~1.3:1 이라 이 자리에 쓰면 칸이 보이지 않습니다.

| 층 | 변수 | 다크 | 라이트 | 대비(`bg` 위) | 쓰는 곳 |
|---|---|---|---|---|---|
| 행 구분 | `--qa-border` | #242424 | #e2dfd8 | 1.26 | 표 행 · 목록 줄. 장식(구조선) |
| 구역 구분 | `--qa-borderHi` | #333333 | #c8c4ba | 1.55 / 1.65 | 구역 윗선. 장식 |
| **조작 윤곽** | **`--qa-ctl`** | **#7a7364** | **#8c8575** | **4.16 / 3.48** | 입력 칸 · 보조 단추 · 아이콘 단추 |

`--qa-ctl` 은 세 면(`bg` · `surface` · `surface2`) 가운데 가장 낮은 곳에서도 다크 3.66, 라이트 3.25 입니다.

- 두 층을 섞지 않습니다. 구분선에 `--qa-ctl` 을 쓰면 장부가 격자로 보이고, 조작부에 구분선 색을 쓰면 칸이 사라집니다.
- 호버는 `--qa-muted`. 초점은 기존 전역 규칙(2px 윤곽 · 간격 2px, 채운 단추는 4px)을 그대로 씁니다.
- 🔴 값은 `tokens.ts` 가 아니라 CSS 의 `--qa-ctl` 에 두고, TS 는 `lib/design/grain.ts` 의 `CTL`(`var(--qa-ctl)`)로 부릅니다. CSS 원본은 Q-Design `patterns/foundation/atelier.css` 의 `app/globals.css` 구역입니다. 그때는 `tokens.ts` 가 요구사항 엔진 검증 근거라 한 줄만 더해도 엔진 근거가 «다시 해야 함» 으로 바뀌었습니다(2026-10-26 에 엔진과 뗐습니다 · Q-Atelier f5d7d14a).
- 가드: Q-Atelier `lib/design/control-outline-contrast.test.ts` (두 테마 × 세 면 3:1, 공용 부품이 `CTL` 을 쓰는지).

---

## 상태색 7종

워크플로 상태를 나타내는 별도 축입니다. 액센트와 섞지 않습니다.

> ### 계약 · 금색은 상태가 아닙니다
>
> **금색은 브랜드 · 활성 차림표 · 1장의 서명 장치(제목 위 막대 · 매거진 구분자 · 리본)만 맡습니다.**
> 주 단추도 금색이 아니라 크림색 면입니다([6장 부품](06-components.md)).
> 성공 · 주의 · 막힘은 `--qd-ok` · `--qd-warn` · `--qd-danger` 로만 적습니다
> (`dist/q-design.state.css` · `--qd-danger` 는 `dist/q-design.nav.css`).
>
> 금색 하나가 브랜드 · 주동작 · 성공 · 경고 · 데이터속성을 함께 맡으면, 같은 화면에서 «성공» 도 금색이고
> «결측률 50% 이상» 도 금색이 됩니다. 뜻이 다섯이면 색은 아무것도 알려 주지 않습니다.
>
> 🔑 **주의는 색만으로 안 갈립니다.** 다크 판 위에서 액센트(금)와의 색차 ΔE76 을 재면
> 성공 40.94 · 막힘 32.84 인데 **주의는 10.37** 입니다. 그래서 주의 판은 색과 함께
> 판 **안의 글자**(«주의» · «막힘» 같은 첫 낱말)로 가릅니다. 상태 판을 쓰는 쪽이 그 말을 둡니다
> (`dist/q-design.list.css` 의 `.qd-panel--*`).
>
> 실측 대비(판 #141414 위): ok 7.86 · warn 8.22 · danger 5.74 · 금 6.46 · 모두 AA 통과

<!-- 생성:상태색-팔레트 -->

| 토큰 | 뜻 | 다크 | 라이트 |
|---|---|---|---|
| `--qa-state-gray` | draft · not_started · NA | `#928c86` | `#676562` |
| `--qa-state-cobalt` | preview_review · reviewed | `#6b8fc4` | `#3864a0` |
| `--qa-state-copper` | under_review · in_progress | `#d49850` | `#8a5820` |
| `--qa-state-gold` | final_decision · review | `#c9a878` | `#7a5828` |
| `--qa-state-violet` | execution_tracking · waived | `#a27dca` | `#8049ba` |
| `--qa-state-green` | completed · approved | `#7ab87a` | `#367236` |
| `--qa-state-red` | cancelled | `#c97a7a` | `#b23b3b` |

<!-- /생성:상태색-팔레트 -->

색이 «단계» 를 따라 도는 순서(회색 → 코발트 → 구리 → 금 → 보라 → 초록)라는 점이 설계 의도입니다.
빨강만 흐름 밖의 «취소» 입니다.

---

## 대비 실측표

아래 숫자는 손으로 적은 것이 아니라 `tools/contrast-table.mjs` 가 `dist/q-design.tokens.json` 에서 계산해 이 파일에 직접 씁니다.
손으로 옮겨 적은 대비 숫자는 어긋납니다(「4.5 통과」라 적힌 값이 실제로는 4.45 였던 일이 있습니다).
표를 손으로 고치지 않습니다. 값이 바뀌면 `node tools/contrast-table.mjs --write` 를 돌리고, `--check` 로 문서가 최신인지 봅니다.

<!-- 생성:대비-실측표 -->

### 다크 · 텍스트/액센트

| 전경 | `bg` | `surface` | `surface2` | 최저 |
|---|---:|---:|---:|---:|
| `text` #f0ebe0 | 16.45 | 15.50 | 14.49 | **14.49** |
| `subtle` #b7b0a5 | 9.10 | 8.57 | 8.01 | **8.01** |
| `muted` #898271 | 5.12 | 4.82 | 4.51 | **4.51** |
| `champagne` #b8935a | 6.86 | 6.46 | 6.04 | **6.04** |
| `green` #7ab87a | 8.35 | 7.86 | 7.35 | **7.35** |
| `red` #c97a7a | 6.10 | 5.74 | 5.37 | **5.37** |
| `warning` #c9a87a | 8.72 | 8.22 | 7.68 | **7.68** |
| `blue` #7a9ac9 | 6.79 | 6.40 | 5.98 | **5.98** |

### 다크 · 상태색 7종

| 전경 | `bg` | `surface` | `surface2` | 최저 |
|---|---:|---:|---:|---:|
| `state-gray` #928c86 | 5.88 | 5.54 | 5.18 | **5.18** |
| `state-cobalt` #6b8fc4 | 5.92 | 5.57 | 5.21 | **5.21** |
| `state-copper` #d49850 | 7.83 | 7.37 | 6.90 | **6.90** |
| `state-gold` #c9a878 | 8.71 | 8.21 | 7.67 | **7.67** |
| `state-violet` #a27dca | 5.89 | 5.55 | 5.19 | **5.19** |
| `state-green` #7ab87a | 8.35 | 7.86 | 7.35 | **7.35** |
| `state-red` #c97a7a | 6.10 | 5.74 | 5.37 | **5.37** |

### 라이트 · 텍스트/액센트

| 전경 | `bg` | `surface` | `surface2` | 최저 |
|---|---:|---:|---:|---:|
| `text` #1c1a16 | 16.50 | 17.37 | 15.39 | **15.39** |
| `subtle` #4a4540 | 9.00 | 9.47 | 8.39 | **8.39** |
| `muted` #726b5e | 5.01 | 5.28 | 4.67 | **4.67** |
| `champagne` #8a6838 | 4.84 | 5.10 | 4.52 | **4.52** |
| `green` #3d7a3d | 4.93 | 5.19 | 4.59 | **4.59** |
| `red` #a83838 | 6.07 | 6.39 | 5.66 | **5.66** |
| `warning` #97621f | 4.89 | 5.14 | 4.56 | **4.56** |
| `blue` #2d5fa8 | 6.02 | 6.34 | 5.61 | **5.61** |

### 라이트 · 상태색 7종

| 전경 | `bg` | `surface` | `surface2` | 최저 |
|---|---:|---:|---:|---:|
| `state-gray` #676562 | 5.52 | 5.81 | 5.15 | **5.15** |
| `state-cobalt` #3864a0 | 5.70 | 6.00 | 5.32 | **5.32** |
| `state-copper` #8a5820 | 5.70 | 6.00 | 5.32 | **5.32** |
| `state-gold` #7a5828 | 6.13 | 6.45 | 5.72 | **5.72** |
| `state-violet` #8049ba | 5.57 | 5.87 | 5.20 | **5.20** |
| `state-green` #367236 | 5.51 | 5.81 | 5.14 | **5.14** |
| `state-red` #b23b3b | 5.57 | 5.86 | 5.19 | **5.19** |

### 인쇄 팔레트 · 흰 종이 위

| 전경 | 흰 배경 위 |
|---|---:|
| `text` #1a1814 | 17.73 |
| `subtle` #4a4540 | 9.47 |
| `muted` #746e62 | 5.06 |
| `champagne` #8a6a3a | 5.00 |

### 액센트 면 위 글자

| 면 | 위 글자 | 대비 |
|---|---|---:|
| 다크 `champagne` | `on-accent` #0a0908 | 6.97 |
| 다크 `green` | `on-accent` #0a0908 | 8.49 |
| 다크 `red` | `on-accent` #0a0908 | 6.20 |
| 다크 `warning` | `on-accent` #0a0908 | 8.87 |
| 다크 `blue` | `on-accent` #0a0908 | 6.91 |
| 라이트 `champagne` | `on-accent` #ffffff | 5.10 |
| 라이트 `green` | `on-accent` #ffffff | 5.19 |
| 라이트 `red` | `on-accent` #ffffff | 6.39 |
| 라이트 `warning` | `on-accent` #ffffff | 5.14 |
| 라이트 `blue` | `on-accent` #ffffff | 6.34 |

<!-- /생성:대비-실측표 -->

---

## 배지는 «순수 표면» 위에 놓이지 않습니다

배지(`Tag` primary)는 배경을 `alpha(색, 0.1)` 로 깝니다.
즉 글자가 놓이는 바닥은 순수 표면이 아니라 **표면에 그 색을 10% 섞은 면**이고,
그만큼 대비가 더 낮아집니다. 표면만 재면 배지에서 조용히 미달합니다.

<!-- 생성:배지-실조건 -->

| 상태색 | 카드 위(surface) | 배지 실조건(surface + 10%) | 판정 |
|---|---:|---:|---|
| 다크 `gray` | 5.54 | **4.89** | AA |
| 다크 `cobalt` | 5.57 | **4.94** | AA |
| 다크 `copper` | 7.37 | **6.37** | AA |
| 다크 `gold` | 8.21 | **6.97** | AA |
| 다크 `violet` | 5.55 | **4.89** | AA |
| 다크 `green` | 7.86 | **6.76** | AA |
| 다크 `red` | 5.74 | **5.09** | AA |
| 라이트 `gray` | 5.81 | **5.09** | AA |
| 라이트 `cobalt` | 6.00 | **5.24** | AA |
| 라이트 `copper` | 6.00 | **5.21** | AA |
| 라이트 `gold` | 6.45 | **5.59** | AA |
| 라이트 `violet` | 5.87 | **5.10** | AA |
| 라이트 `green` | 5.81 | **5.06** | AA |
| 라이트 `red` | 5.86 | **5.04** | AA |

가장 나쁜 자리가 **4.89** 입니다 (AA 기준 4.5).

<!-- /생성:배지-실조건 -->

### 재는 법과 고치는 법

- **표면 셋 × 배지 실조건을 모두 잽니다.** 흰 배경 하나 기준으로 적은 숫자는 그 자체로 맞아도, 다른 표면과 배지 위에서 미달을 놓칩니다.
  초안 · 미시작을 뜻하는 `gray` 처럼 가장 흔한 상태가 가장 나쁜 자리일 수 있습니다.
- **상태색을 고칠 때는 색상과 채도는 두고 명도만 옮깁니다.** 팔레트의 «얼굴» 을 바꾸지 않고 읽히게 만드는 방법입니다. 색을 새로 고르면 상태색 일곱이 서로 안 어울리게 됩니다.
- **값을 고치는 것으로 끝내지 않고 검사에 넣습니다.** Q-Atelier `lib/design/contrast.test.ts` 가 상태색 7종을 표면 셋과 배지 실조건(10% 섞은 면)에서 AA 로 검사합니다. 값만 고치면 다음 사람이 되돌립니다.

> 🔑 **「가드가 있다」는 「전수를 본다」가 아닙니다.** 이 교훈은 [10장 지키는 규칙](10-rules.md)에 있습니다.

---

## 샴페인 계단

샴페인 칸이 하나뿐이면 나머지 농도를 `color-mix` 로 즉석에서 만들게 되고, 제품마다 금색 계단을 따로 발명합니다.
그래서 정본이 계단을 냅니다. 계단의 정본은 `patterns/champagne-ramp.json` 이고, `tools/extract-ramp.mjs --write` 가 거기서 `dist/q-design.ramp.css` 를 만듭니다.
만들기와 검사는 제품을 읽지 않습니다. 세 제품이 지금 쓰는 값과 견주는 일은 감사입니다(`node tools/extract-ramp.mjs`). 정본을 바꾸려면 사람이 감사 결과를 보고 `--adopt` 를 붙이거나 정본 파일을 고칩니다.

🔑 **계단을 발명하지 않습니다.** 명도를 일정 간격으로 자른 «깔끔한» 계단은 가족의 실제 값과 평균 dE 4.2, 최대 14.8 벌어집니다.
그런 계단으로 모으면 통일이 아니라 **재디자인**입니다. 그래서 가족이 이미 쓰는 값에서 대표를 골랐습니다(평균 dE 1.3).

🔑 **갈래가 둘입니다.** 같은 명도라도 채도를 낮춘 샴페인이 따로 쓰입니다
(라이트 테마의 브랜드 틴트). 한 계단에 욱여넣으면 dE 15 가 넘습니다.

```
--qa-champagne-1       #5d4a2d   L27.1
--qa-champagne-2       #8a6838   L38.0
--qa-champagne-3       #937648   L42.9
--qa-champagne-4       #b8935a   L53.7   ← 세 제품이 공유하는 기준
--qa-champagne-5       #c9a87a   L63.3
--qa-champagne-mute-1  #1a1712   L 8.6
--qa-champagne-mute-2  #52442f   L25.3
--qa-champagne-mute-3  #9d8869   L51.4
--qa-champagne-mute-4  #baab95   L65.7
```

---

## 가족 계층: 정본이 «배운» 역할

정본에는 의미색 «글자» 만 있고 그 뒤에 까는 «면» 이 없었습니다. 그 빈칸을 제품이 혼자 메워 쓰고 있었으므로,
정본이 그 역할을 배워 `dist/q-design.family.css` 로 냅니다(18칸). 값은 발명한 것이 아니라 제품이 이미 쓰던 값입니다.

| 역할 | 토큰 |
|---|---|
| 의미색 «면» | `--qa-ok-bg` `--qa-warn-bg` `--qa-danger-bg` `--qa-info-bg` (다크·라이트) |
| 의미색 «선» | `--qa-danger-line` |
| 브랜드 틴트 면 | `--qa-brand-tint` `--qa-brand-soft` `--qa-brand-line` |
| 본문 한 단 | `--qa-body` |
| 금색 밝은 칸 | `--qa-goldhi` `--qa-brand-pale` |

### 모을 것과 배울 것을 가르는 법

`tools/converge.mjs` 가 CIE Lab 거리로 판정합니다(`--write` 는 가까운 것을 정본 값으로 고치고, `--adopt` 는 먼 것을 정본이 배우게 합니다).

| dE | 뜻 | 조치 |
|---:|---|---|
| < 1 | 못 알아봄 | 정본 값으로 **모음** |
| 1~3 | 나란히 놔야 보임 | 모음 |
| 3~6 | 보임 | 모음 |
| ≥ 6 | 그냥 다른 색 | **정본이 배움** (`--adopt`) |

이렇게 가르면 **보이는 디자인을 바꾸지 않고** 정본 밖을 0 으로 만들 수 있습니다.

🔴 **거리만 보면 역할이 어긋납니다.** 브랜드 금색의 밝은 칸이 거리로는 위험도 «높음» 색에 가장 가까울 수 있습니다.
눈에는 비슷하고 뜻은 완전히 다릅니다. 그래서 브랜드를 가리고 **역할이 같은 후보 중에서만** 고릅니다.

---

## 색을 쓰는 관용구

### 투명도는 `color-mix` 로

```css
background: color-mix(in srgb, var(--qa-champagne) 22%, var(--qa-surface2));
border-bottom: 1px solid color-mix(in srgb, var(--qa-champagne) 40%, transparent);
```

TS 쪽에서는 `alpha(color, 0.22)` 헬퍼가 같은 일을 합니다. hex 면 알파 채널을 붙이고,
`var()` 면 `color-mix` 로 합성합니다.

### 무채색 회색 대신 브랜드색을 섞은 면

이 시스템이 «비싸 보이는» 이유의 상당 부분이 여기 있습니다.
스크롤바와 선택 영역에 순수 회색이 없습니다.

```css
/* 스크롤바: 경계선에 금을 22% */
background: color-mix(in srgb, var(--qa-champagne) 22%, var(--qa-border));
/* 텍스트 선택: 금 30% */
::selection { background: color-mix(in srgb, var(--qa-champagne) 30%, transparent); }
```

### 위험도 색

2026-10-27 오너가 정했습니다(경영진 카드판 «위험도 분포» 에 지금 색과 새 색을 입혀 찍은 그림을 보고 새 색).
종전에는 위험도가 `red` · `warning` · `champagne` · `green` 을 빌려 썼습니다. 그러면 «높음» 과 «중간» 이 같은 갈색 계열이 되어, 라이트 테마에서 둘의 맨눈 색차가 2.9(OKLab ×100)밖에 안 됐습니다. 나란히 놓아도 거의 같은 색입니다.

이제 위험도는 자기 토큰을 씁니다. 빨강 · 주황 · 노랑 · 초록이고, 밝기는 치명 < 높음 < 중간 > 낮음입니다(빨강이 가장 짙고 노랑이 가장 밝은 상태색 결).
한 단계에 값이 둘입니다.

| 쓰임 | 토큰 | TS |
|---|---|---|
| 막대 · 점 · 그래프 면 | `--qa-risk-{critical,high,medium,low}` | `riskFill(level)` |
| 글자 · 배지 · 큰 숫자 · 테두리 | `--qa-risk-{…}-text` | `riskColor(level)` |
| 단계를 모를 때 | `--qa-muted` | 둘 다 `T.muted` |

- 막대 색은 그래프용입니다. 라이트 «높음» · «중간» 막대는 흰 면 위 3.30 · 1.92 라 글자로 쓰면 읽히지 않습니다. 그래서 글자 색을 따로 둡니다. 막대 옆에는 늘 이름과 건수가 붙습니다.
- 글자 색은 막대와 같은 색상에서 밝기만 옮겼습니다. 다크는 치명 하나만 밝혔고 나머지 셋은 막대와 같은 값입니다.
- 그래프의 단계 이름 · 건수는 먹색(`T.text` · `T.subtle`)으로 씁니다. 색은 막대만 입습니다(`DistributionBars` 가 이렇게 그립니다).
- 막대 넷의 이웃 맨눈 색차는 다크 16.7 · 15.7 · 24.1, 라이트 17.4 · 15.7 · 28.4 이고, 색각 이상으로 봐도 13.2 이상입니다(그래프 색 검사기 기준 8 · 15 통과).
- 값의 정본은 `patterns/foundation/atelier.css` 두 테마 블록입니다. 아래 표는 `node tools/contrast-table.mjs --write` 가 씁니다.

<!-- 생성:위험도 -->

| 단계 | 다크 막대 | 다크 글자 | 다크 글자 최저 | 라이트 막대 | 라이트 글자 | 라이트 글자 최저 |
|---|---|---|---:|---|---|---:|
| 치명 | `#ca5551` | `#e16964` | **4.63** | `#a83838` | `#a83838` | **4.91** |
| 높음 | `#e99653` | `#e99653` | **6.23** | `#cf7828` | `#985100` | **4.62** |
| 중간 | `#efd780` | `#efd780` | **9.53** | `#d3b968` | `#7a6200` | **4.57** |
| 낮음 | `#60a56b` | `#60a56b` | **5.03** | `#3d7a3d` | `#347134` | **4.58** |

<!-- /생성:위험도 -->

### 골드 그라디언트는 «얼굴» 화면만

```css
--qa-gold-gradient: linear-gradient(135deg,
  var(--qa-champagne) 0%,
  color-mix(in oklab, var(--qa-champagne) 55%, white) 50%,
  color-mix(in oklab, var(--qa-champagne) 82%, black) 100%);
```

로그인 히어로처럼 큰 장식 텍스트에만 씁니다. **본문·라벨에 쓰면 안 됩니다** (가독성).
업무 화면은 단색 샴페인으로 절제합니다.
큰 글에서도 문장 전체가 아니라 **끝 낱말 하나**에 둡니다. 우리 금은 글자보다 한 층 아래 밝기(바탕 위 6.86 · 크림 16.45)라 큰 면을 맡기면 흐려 보이고, 선 · 숫자 · 라벨에서 빛납니다. 견준 기록은 [참고 · 포스터 색 배치 조사](reference/poster-colour-layout-study.md)에 있습니다.

---

## 금지 사항

- **새 hex 리터럴을 만들지 않습니다.** 원본은 사용량을 326개로 동결해 두고 초과하면 테스트가 실패합니다(Q-Atelier `lib/design/no-new-hex.test.ts`). hex 를 정의해도 되는 파일은 `tokens.ts` 와 Q-Design 생성물 `lib/design/q-design.doc.ts`(지문 계약이 따로 지킵니다) 둘뿐입니다.
- **`#fff` · `white` 를 부품에 직접 쓰지 않습니다.** `var(--qa-on-accent)` 를 씁니다.
- **`var(--qa-state-*)` 를 코드에서 직접 쓰지 않습니다.** TS 쪽 `STATE.*` 를 거칩니다 (동결값 0).
- **팔레트를 한쪽만 고치지 않습니다.** `tokens.ts` 와 CSS 팔레트(`globals.css`) 두 곳이 같은 값이어야 하고, 계약이 대조합니다(`tools/extract-tokens.mjs` 도 추출할 때 두 곳을 대조합니다).

---

## 세 제품 화면 팔레트

Q-Atelier · Q-Maison · Q-Carnet 의 공통 화면 색은 Q-Design 에서 고치고 내보냅니다.
제품의 업무 상태 뜻, 제조사 설정, 인쇄 팔레트는 구분해서 보존합니다.

### 고치는 곳

`patterns/palette-overrides.json` 의 `shared.dark` 와 `shared.light` 가 공통 색을 고치는 자리입니다.
키는 `dist/q-design.tokens.json` 에 있는 `--qa-*` 이름만 받습니다. 빈 객체는 커밋된 원본에서 뽑은 색 그대로를 뜻합니다.

```json
{
  "shared": {
    "dark": { "--qa-text": "#ffffff" },
    "light": {}
  }
}
```

이 변경은 아뜰리에 `--qa-text`, 메종 HSL 채널 `--foreground`, 카르넷 `--dhr-ink` 와 이를 읽는 공통 부품에 전달됩니다.
값은 제품의 기존 변수 이름으로 바꿔 내보내므로 화면별 코드를 다시 쓸 필요가 없습니다.

`dist/q-design.tokens.json` 과 원본 엔진 `tokens.ts` 를 손으로 고치지 않습니다.
`tools/refresh-source.mjs` 가 커밋된 원본을 다시 받아도, 별도 소유 파일인 `patterns/palette-overrides.json` 의 변경은 유지됩니다.
전체 순서는 커밋된 원본 → 토큰 추출 → 팔레트 변환 → 제품 사본 배포입니다.

### 연결 규칙

| 제품 | 화면 변수 | 테마 | 유지하는 의미 |
| --- | --- | --- | --- |
| Q-Atelier | `--qa-*` | `data-theme`, 기본 다크 | 공통 팔레트 이름과 값 |
| Q-Maison | `--background`, `--foreground`, `--primary`, `--qw-state-*` | `html.dark`, 기본 라이트 | HSL 채널과 투명도 유틸리티 |
| Q-Carnet | `--dhr-*`, 기존 Tailwind 색 별칭 | `data-theme`, 기본 다크 | 현장용 상태색과 제조사 강조색 |

`patterns/palette-mappings.json` 은 각 변수의 토큰, 고정 원본 테마, 예외값, HSL 변환, 제조사 우선 변수를 적어 둡니다.
팔레트 CSS 는 층(`@layer`) 밖 `html:root` 선택자로 만들어, 그 뒤에 선언된 기존 globals 값보다 우선합니다. `!important` 는 쓰지 않습니다.
`tools/sync-parts.mjs` 의 `PARTS` 에서 팔레트 세 항목은 `layer: false` 여야 합니다.

메종의 `brand`, `status`, `severity` Tailwind 이름은 고정된 테마의 색을 쓰던 호환 이름입니다.
23개의 `--qw-legacy-*` HSL 채널로 이어 기존 색과 상태 뜻을 유지합니다.
메종의 다크 `muted-foreground` 는 `subtle`, 삭제 단추의 면(`--destructive-surface`)은 두 테마 모두 라이트 `red` 를 씁니다. 용도가 다르므로 같은 값으로 합치지 않습니다.

카르넷의 라이트 `surface-sub`, 본문색 `body`, 머리띠 면(`indigo`), 상태별 옅은 바탕, vignette 는 `products.carnet` 의 예외값으로 적어 둡니다.
상태의 초록, 주의, 안내는 각각 기존 `green`, `warning`, `blue` 를 유지합니다. 메종의 업무 단계 `state-green`, `state-copper`, `state-cobalt` 와 임의로 바꾸지 않습니다.

### 카르넷 제조사 강조색

기본 강조색 7단계는 `carnetBrand` 설정과 카르넷 `lib/tone.ts` 의 계산 규칙으로 만듭니다.
라이트 강조색은 다크 샴페인을 대비 기준면 `#f4f2ee` 에 대해 보정한 값입니다. 공통 라이트 샴페인을 그대로 복사하지 않습니다.
공통 다크 샴페인을 바꾸면 기본 7단계도 다시 계산됩니다.

기본 7단계의 기준은 실제 실행 결과(카르넷 `lib/brand.ts` 의 `brandCss('#b8935a')`)입니다. 기존 globals 에 적힌 정적 브랜드 값이 아닙니다.

`#b8935a` 는 기존 기본값을 알아보는 고정값입니다. 데이터에 이 값이 저장되어 있으면 Q-Design 기본 팔레트가 화면을 정합니다.
다른 제조사 색은 기존 계산으로 얻은 7개의 `--qd-company-brand*` 변수를 따로 내려보냅니다.
생성 CSS 는 이 변수를 우선하고, 변수가 없으면 Q-Design 기본색을 씁니다. 회사가 기본색과 같은 값을 명시해 저장한 경우도 기본값으로 다룹니다.

회사별 색 계산, 회사 이름과 로고, 사업 데이터는 제품이 소유합니다. Q-Design 공통 팔레트 변경이 제조사 맞춤 강조색을 덮어쓰지 않습니다.
기존 `--dhr-brand*` 런타임 선언도 유지해 종이 출력의 동작은 바꾸지 않습니다.

기존 DB 기본색을 판별하는 `DEFAULT_BRAND_COLOR = '#b8935a'`(카르넷 `lib/tone.ts`)는 데이터 호환 표식이므로 바꾸지 않습니다.
중앙 기본 강조색을 바꾸면 화면과 기본 설치 시작 배경이 새 색을 쓰고, 사용자가 지정한 회사 색은 유지됩니다.

### 화면과 종이

생성된 공통 팔레트는 `@media screen` 에 한정됩니다. 제품의 기존 인쇄 규칙과 카르넷 `.sheet` 의 직접 선언은 계속 적용됩니다.
메종의 호환 변수는 인쇄에서도 필요하므로 `@media print` 에는 공통 override 이전의 고정 테마 기준값을 따로 내보냅니다. 화면 색 수정이 이 인쇄값을 바꾸지 않습니다.

전문가 전용 화면의 별도 팔레트, 제품 PWA 아이콘 그림, 그래프 데이터 계열과 인쇄용 색은 각자의 역할 규칙으로 관리합니다.
카르넷의 PWA 상단 바 색은 `patterns/palette-overrides.json` 의 `carnetPlatform.themeColor` 에 적고, 기존 구리색 아이콘 규약(`tools/app-icons.mjs` 의 `titleBarOf`)과 대조합니다.
회사별 입력 색은 데이터로 유지하지만, 대비 계산의 바탕과 최소 대비값은 같은 중앙 팔레트에서 받습니다.

### 만들기와 확인

```powershell
node tools/build-palette.mjs
node tools/build-palette.mjs --check
node --test tools/palette.test.mjs
node tools/sync.mjs --write --part="팔레트 아뜰리에"
node tools/sync.mjs --write --part="팔레트 메종"
node tools/sync.mjs --write --part="팔레트 카르넷"
node tools/sync.mjs --write --part="카르넷 런타임 팔레트" --only=Q-Forge
```

산출물은 `dist/q-design.palette.atelier.css`, `dist/q-design.palette.maison.css`, `dist/q-design.palette.carnet.css` 입니다.
각 제품은 `app/q-design.palette.css` 를 한 번 가져옵니다.
카르넷은 `dist/q-design.palette.carnet.ts` 도 받아 `lib/design/q-design-palette.ts` 로 둡니다. 화면 CSS 와 같은 입력으로 PWA 메타데이터와 회사 색 대비 계산을 잇습니다.
산출물은 직접 고치지 않습니다.

생성기(`tools/build-palette.mjs`)는 알 수 없는 토큰, 잘못된 매핑, 쓰이지 않는 예외값, CSS 주입 구문을 거부합니다.
공통 `text`, `subtle`, `muted` 는 바탕 세 종류에 대해 4.5:1, 조작 윤곽 `ctl` 은 3:1, 주 동작 글자는 강조색 면에 대해 4.5:1 을 검사합니다.
모든 상태 배지 조합의 대비를 대신 보장하는 검사는 아니므로, 상태색 뜻을 바꾸면 제품별 대비 검사도 다시 돌립니다.

회귀 검사(`tools/palette.test.mjs`)는 HSL 왕복 변환, 기존 색 보존, 중앙값 변경의 세 제품 전파, 제조사 우선순위, 기존 7단계 계산과의 일치, 인쇄값 보존, 생성물 누락과 변조를 확인합니다.
브라우저 검사는 실제 적용 순서와 화면 결과를 따로 확인합니다.
