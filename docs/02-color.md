# 색

팔레트는 네 벌입니다. **다크(기본) · 라이트 · 인쇄 · 전문가 포털.**
앞의 셋은 같은 변수 이름을 공유하고 값만 바뀝니다. 넷째는 [별도 문서](08-expert-portal.md)에서 다룹니다.

색을 고칠 때 지켜야 할 한 가지 원칙이 있습니다.

> **가장 어려운 표면을 기준으로 잡습니다.**
> 배경 하나만 보고 맞추면 카드 위에서 조용히 미달합니다.
> 원본은 이 실수를 세 번 했습니다 (`--qa-muted` 2026-08-20 · 전문가 `--whisper` 2026-08-26 · 상태색은 지금도).

---

## 1. 구조

색은 **세 층**으로 되어 있습니다.

| 층 | 예 | 성격 |
|---|---|---|
| 표면 | `bg` `surface` `surface2` | 무엇 위에 놓이는가 |
| 경계 | `border` `borderHi` | 구획을 나누는 실선 |
| 전경 | `text` `subtle` `muted` + 액센트 5종 | 그 위에 놓이는 것 |

표면이 셋인 이유는 층위가 셋이기 때문입니다.
`bg`(페이지) 위에 `surface`(카드)가 놓이고, 그 안에서 다시 한 겹 들어가면 `surface2`(입력칸·강조 블록)입니다.

---

## 2. 다크 (기본)

```css
--qa-bg:        #0c0c0c   /* 페이지 바닥 */
--qa-surface:   #141414   /* 카드 */
--qa-surface2:  #1b1b1b   /* 카드 안의 한 겹 더 */
--qa-border:    #242424
--qa-borderHi:  #333333   /* hover · 강조 경계 */
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
다만 화려한 금(`#d4af37` 류)이 아니라 **한 단계 죽인 금**입니다.
원본은 2026년 중반에 `#c9a878` 에서 `#b8935a` 로 더 깊게 내렸습니다.

---

## 3. 라이트

```css
--qa-bg:        #faf9f6   /* 흰색이 아닌 «따뜻한 종이» */
--qa-surface:   #ffffff
--qa-surface2:  #f3f1ec
--qa-border:    #e2dfd8
--qa-borderHi:  #c8c4ba
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

원본은 이 규칙을 계약으로 강제합니다 (`on-accent-contract.test.ts`: 컴포넌트에 흰 글자 리터럴 0개).

### 라이트의 그림자는 회색이 아닙니다

흰 배경에 검정 그림자를 쓰면 거칩니다. 따뜻한 sepia 톤을 씁니다.

```css
/* 다크 */  --qa-shadow-md: 0 6px 18px rgba(0, 0, 0, 0.35);
/* 라이트 */ --qa-shadow-md: 0 6px 18px rgba(80, 65, 40, 0.14);
```

백드롭도 마찬가지입니다. 라이트는 `rgba(40, 30, 18, 0.32)` 로 갈색기가 돕니다.

---

## 4. 인쇄

`@media print` 에서 팔레트가 통째로 갈립니다. 다크 모드로 보고 있어도 종이는 흽니다.

```css
--qa-bg: #ffffff · --qa-surface: #ffffff · --qa-surface2: #f5f3ee
--qa-border: #d4d0c8 · --qa-borderHi: #999488
--qa-text: #1a1814 · --qa-subtle: #4a4540 · --qa-muted: #746e62
--qa-champagne: #8a6a3a · --qa-on-accent: #ffffff
```

`@page { margin: 18mm 16mm 22mm; size: A4 }` 이고, 모든 페이지 하단에 브랜드 워터마크가 찍힙니다.
사이드바·버튼·리본 배경은 인쇄에서 사라집니다.

**이 시스템이 규제 문서를 다루기 때문에 인쇄가 일급 시민입니다.** 심사원은 출력물을 읽습니다.

---

## 5. 상태색 7종

워크플로 상태를 나타내는 별도 축입니다. 액센트와 섞지 않습니다.

| 토큰 | 뜻 | 다크 | 라이트 |
|---|---|---|---|
| `--qa-state-gray` | draft · not_started · NA | `#7d7670` | `#72706c` |
| `--qa-state-cobalt` | preview_review · reviewed | `#6b8fc4` | `#3864a0` |
| `--qa-state-copper` | under_review · in_progress | `#d49850` | `#8a5820` |
| `--qa-state-gold` | final_decision · review | `#c9a878` | `#7a5828` |
| `--qa-state-violet` | execution_tracking · waived | `#a07ac9` | `#8a58c0` |
| `--qa-state-green` | completed · approved | `#7ab87a` | `#3d803d` |
| `--qa-state-red` | cancelled | `#c97a7a` | `#c04040` |

색이 «단계» 를 따라 도는 순서(회색 → 코발트 → 구리 → 금 → 보라 → 초록)라는 점이 설계 의도입니다.
빨강만 흐름 밖의 «취소» 입니다.

---

## 6. 대비 실측표

아래 숫자는 손으로 적은 것이 아니라 `tools/contrast-table.mjs` 가 계산한 것입니다.
원본에서 「4.5 통과」라 적어 두고 실제로는 4.45 였던 사고가 두 번 있었습니다.

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

`muted` 의 최저가 4.51 입니다. **여유가 0.01 뿐입니다.** 이 색을 조금이라도 밝히면 미달합니다.

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

라이트는 액센트 넷이 전부 4.5~4.6 구간에 몰려 있습니다. **여유가 거의 없습니다.**
이 색들을 «조금 밝게» 조정하면 곧바로 접근성이 깨집니다.

### 인쇄 · 흰 종이 위

| 전경 | 대비 |
|---|---:|
| `text` #1a1814 | 17.73 |
| `subtle` #4a4540 | 9.47 |
| `muted` #746e62 | 5.06 |
| `champagne` #8a6a3a | 5.00 |

### 액센트 «면» 위 글자

| 면 | 위 글자 | 대비 |
|---|---|---:|
| 다크 champagne | `on-accent` #0a0908 | 6.97 |
| 다크 green / red / warning / blue | `on-accent` #0a0908 | 8.49 / 6.20 / 8.87 / 6.91 |
| 라이트 champagne | `on-accent` #ffffff | 5.10 |
| 라이트 green / red / warning / blue | `on-accent` #ffffff | 5.19 / 6.39 / 5.14 / 6.34 |

---

## 7. ⚠️ 알려진 미달: 상태색은 대비 계약 밖입니다

원본의 대비 계약(`contrast.test.ts`)이 검사하는 목록은 `text · subtle · muted · champagne · green · red · warning · blue` 여덟입니다.
**`--qa-state-*` 7종은 그 목록에 없습니다.** 실측하면 이렇습니다.

배지(`Tag` primary)는 배경을 `alpha(색, 0.1)` 로 깝니다.
즉 글자가 놓이는 바닥은 순수 표면이 아니라 **표면에 그 색을 10% 섞은 면**이고, 그만큼 대비가 더 낮아집니다.

| 상태색 | 카드 위 | 배지 실조건 | 판정 |
|---|---:|---:|---|
| 다크 `gray` | 4.12 | **3.72** | 미달 |
| 라이트 `gray` | 4.94 | **4.37** | 미달 |
| 라이트 `violet` | 4.96 | **4.34** | 미달 |
| 라이트 `green` | 4.82 | **4.24** | 미달 |
| 나머지 10 | | 4.50 ~ 6.97 | AA |

소스 주석은 「4.95:1 on white」처럼 **흰 배경 기준으로만** 적혀 있고, 그 숫자 자체는 맞습니다.
문제는 표면이 셋인데 하나만 봤다는 것입니다. 그리고 가장 흔한 상태인 **`gray`(초안·미시작)가 가장 나쁩니다.**

옮겨 쓰신다면 이 넷은 값을 조정하시고, 대비 계약의 검사 목록에 상태색을 포함시키기를 권합니다.

---

## 8. 색을 쓰는 관용구

### 투명도는 `color-mix` 로

```css
background: color-mix(in srgb, var(--qa-champagne) 22%, var(--qa-surface2));
border-bottom: 1px solid color-mix(in srgb, var(--qa-champagne) 40%, transparent);
```

TS 쪽에서는 `alpha(color, 0.22)` 헬퍼가 같은 일을 합니다. hex 면 알파 채널을 붙이고,
`var()` 면 `color-mix` 로 합성합니다.

### 무채색 회색 대신 브랜드색을 섞은 면

이 시스템이 «비싸 보이는» 이유의 상당 부분이 여기 있습니다.
스켈레톤·스크롤바·선택 영역 어디에도 순수 회색이 없습니다.

```css
/* 스켈레톤 바탕: 표면에 금을 4% */
background: color-mix(in srgb, var(--qa-champagne) 4%, var(--qa-surface));
/* 스크롤바: 경계선에 금을 22% */
background: color-mix(in srgb, var(--qa-champagne) 22%, var(--qa-border));
/* 텍스트 선택: 금 30% */
::selection { background: color-mix(in srgb, var(--qa-champagne) 30%, transparent); }
```

### 위험도 색 매핑

```ts
CRITICAL → red · HIGH → warning · MEDIUM → champagne · LOW → green · 그 외 → muted
```

### 골드 그라디언트는 «얼굴» 화면만

```css
--qa-gold-gradient: linear-gradient(135deg,
  var(--qa-champagne) 0%,
  color-mix(in oklab, var(--qa-champagne) 55%, white) 50%,
  color-mix(in oklab, var(--qa-champagne) 82%, black) 100%);
```

로그인 히어로처럼 큰 장식 텍스트에만 씁니다. **본문·라벨에 쓰면 안 됩니다** (가독성).
업무 화면은 단색 샴페인으로 절제합니다.

---

## 9. 금지 사항

- **새 hex 리터럴을 만들지 않습니다.** 원본은 사용량을 326개로 동결해 두고 초과하면 테스트가 실패합니다. hex 를 정의해도 되는 파일은 `tokens.ts` 하나입니다.
- **`#fff` · `white` 를 컴포넌트에 직접 쓰지 않습니다.** `var(--qa-on-accent)` 를 씁니다.
- **`var(--qa-state-*)` 를 코드에서 직접 쓰지 않습니다.** TS 쪽 `STATE.*` 를 거칩니다 (동결값 0).
- **팔레트를 한쪽만 고치지 않습니다.** `tokens.ts` 와 `globals.css` 두 곳이 같은 값이어야 하고, 계약이 대조합니다.
