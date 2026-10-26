# 3장 · 글자

이 장은 글꼴 세 벌과 기준 크기, 크기 · 굵기 · 줄간격 사다리, 라벨의 모양과 한글 자간 규칙을 정합니다.
이 시스템에서 가장 조심해야 할 영역이고, 함정이 셋 있습니다.

합친 옛 문서: 03 타이포그래피

> **① rem 기준은 html 의 16px, 본문은 body 의 14px 입니다** (둘을 섞어 환산하지 않습니다)
> **② 한글에는 자간을 주지 않습니다**
> **③ 크기는 아홉 단, 굵기는 셋, 줄간격은 셋뿐입니다** (2026-10-26 오너 결정 · 사이 값은 일부러 지웠습니다)

## 2026-10-26 결정: 네 값

| 축 | 정한 값 | 지운 것은 이렇게 접었습니다 |
|---|---|---|
| 한글 자간 | **0** 그대로 | (바꾸지 않음. 아래 «한글에는 자간을 주지 않습니다») |
| 크기 | **12 · 14 · 16 · 18 · 20 · 24 · 28 · 32 · 40** | 사이 값은 큰 쪽으로(13→14 · 15→16 · 17→18 · 19→20 · 22→24 · 26→28 · 30→32 · 36 · 38→40). 44px 를 넘는 장식 숫자(48 · 60 · 72 · 96 · 128)만 밖에 둡니다 |
| 굵기 | **400 · 500 · 600** | 700 · 800 · 900 은 600, 100 ~ 300 은 400 |
| 줄간격 | 큰 글(20px 이상) **1.2** · 한 줄 글 **1.4** · 문단과 목록 **1.6**, 정렬 리셋 **1** | 1.3 → 1.4(20px 이상 글이면 1.2) · 1.5 · 1.55 · 1.7 → 1.6 |

정본 CSS(`patterns/` · 제품이 받는 `dist/`)와 세 제품 화면 코드가 이 값 밖을 쓰면 시험이 실패합니다.

| 자리 | 시험 |
|---|---|
| Q-Design 정본 | `tools/type-ladder.test.mjs`(기반 변수 · 테일윈드 연결 · `dist/` 전부 · `b` · `strong` 600 · 배지 글자) |
| Q-Atelier | `FS` · `LH` 키를 지운 것 자체가 타입 가드 · `lib/design/lh-css-sync.test.ts` · `tag-metrics.test.ts` · `min-font-size.test.ts` |
| Q-Maison | `tests/unit/type-ladder.test.ts`(화면 코드 훑기 + 테일윈드가 실제로 합친 설정) |
| Q-Carnet | `test/type-ladder.test.mjs`(화면 코드 훑기 + 테일윈드 4 로 실제 CSS 를 뽑아 사라진 이름을 잼) |

🔴 테일윈드 제품은 이름이 사라진 클래스(`font-bold` · `leading-normal`)가 남으면 **아무 스타일도 붙지 않은 채 조용히 보통 글씨**가 됩니다. 그래서 두 제품의 시험이 화면과 인쇄 코드를 함께 훑습니다.
테일윈드 4 의 `leading-6` 같은 숫자 줄간격은 줄간격 이름표가 아니라 «간격 단위 × 6» 으로 만들어져 테마로는 지울 수 없습니다. 카르넷 시험이 그 이름을 막습니다.

---

## 글꼴 세 벌

| 역할 | 글꼴 | 원본 앱의 로딩 | Q-Design |
|---|---|---|---|
| 본문·UI·헤딩 전부 | **Pretendard Variable** | self-host · 공식 조각판 92조각(`app/fonts.css`, weight 45~920) | 파일 있음 (조각 전 온전한 한 파일 2MB) |
| 코드·라벨·배지 | **JetBrains Mono** | self-host · `app/fonts.css` 가 부름(가변 한 파일 · latin/latin-ext) | **파일 있음** (400~700 × latin/latin-ext · 네 굵기가 같은 가변 파일) |
| 영문 디스플레이 | **Cormorant Garamond** | `next/font/google`, **italic 미로드** | **파일 있음** (italic 제외) |

```css
--qa-font-pretendard  /* 원본은 app/fonts.css 가 :root 에 세운다 */
--qa-font-cormorant   /* next/font 가 주입 */
```

원본 앱은 Pretendard 1.3.9 공식 조각판(쓰인 글자가 든 조각만 받음)과 JetBrains Mono 를 자기 서버에서 냅니다
(Q-Atelier `scripts/fonts/build-fonts.mjs` · `/fonts/*` 1년 불변 캐시). 첫 방문에 2MB 한 파일이나 외부 글꼴 서버를 기다리지 않게 하려는 것입니다(오너 결정 2026-09-26 «첫 방문 무게 줄이기»).
🔴 원본의 미들웨어가 `/fonts/` 를 로그인 확인에서 빼야 합니다. 안 빼면 로그인 전에 글꼴 자리로 로그인 화면(HTML)이 가서 조용히 시스템 글꼴로 그려집니다.

이 저장소는 **세 벌 모두 파일로 갖고 있습니다**(Cormorant 까지).
CDN 이 막힌 환경에서 라벨 글꼴이 시스템 monospace 로 떨어지면 라벨 언어가 통째로 무너지기 때문입니다.

```html
<link rel="stylesheet" href="dist/q-design.fonts.css">   <!-- 이 한 줄로 세 벌 -->
<link rel="stylesheet" href="dist/q-design.tokens.css">
```

`dist/q-design.fonts.css` 는 `tools/fetch-fonts.mjs` 가 만듭니다(`--offline` 은 검증해 둔 캐시만 씁니다).
자세한 출처와 라이선스는 [`source/fonts/NOTICE.md`](../source/fonts/NOTICE.md) 에 있습니다.

### 메인 앱은 Pretendard 단일 정책입니다

헤딩도 본문도 같은 글꼴입니다. **위계는 글꼴이 아니라 굵기와 자간으로 만듭니다.**

```
디스플레이 톤 = weight 600 + letter-spacing -0.02em + tabular-nums
```

세리프를 헤딩에 섞지 않는 이유는 한글 때문입니다.
Cormorant 같은 영문 세리프는 한글 글리프가 없어서, 혼용 헤딩에서 영문만 튀어 보입니다.

### Cormorant 는 «얼굴» 화면의 영문 한 줄에만

로그인 히어로처럼 영문 위주 대형 디스플레이에만 씁니다.
**italic 은 아예 로드하지 않습니다.** 브랜드 규칙이고, 폴백 경로로 기울어질 여지까지 막은 것입니다.

### 모노는 라틴만 맡습니다

```css
--mono: 'JetBrains Mono', 'Consolas', 'Menlo', ui-monospace,
        var(--qa-font-pretendard), 'Pretendard Variable', monospace;
```

Pretendard 를 체인 **중간**에 둔 것이 요령입니다.
ASCII 는 JetBrains 로 가고, 한글은 시스템 monospace 로 떨어지지 않고 Pretendard 로 갑니다.

> **⚠️ 공백은 라틴 글꼴이 가져갑니다.**
> 공백(U+0020)은 latin 서브셋이라, mono 체인에서 **JetBrains Mono 가 공백을 그립니다.**
> monospace 공백(0.6em)이 Pretendard 공백보다 넓어서, 한글 문장에 공백이 섞이면
> 폭이 커집니다. 실측: 「품질을빚는아틀리에」 777.8px 인데 어절을 띄우면 897.8px 로 늘어납니다.
> 글꼴이 제대로 붙었는지 폭으로 판정할 때 **공백 없는 표본**을 쓰십시오.
> 한글 라벨의 어절 공백을 좁히는 법은 아래 «한글에는 자간을 주지 않습니다» 에 있습니다.

> **⚠️ Pretendard 는 각 체인의 라틴 글꼴 바로 뒤에 둡니다.**
> 체인 앞쪽 글꼴(Cormorant · Noto Sans KR)을 `next/font` 로 실으면 **자동 생성 대체 글꼴**이 함께 붙고,
> 그것이 한글을 먼저 가로챕니다. 그러면 뒤에 있는 Pretendard 에 한 번도 닿지 못해 한글이 자리마다 다른 글꼴로 그려집니다.
> Pretendard 를 라틴 글꼴 바로 뒤에 두면 막힙니다. 더 뒤에 두면 소용없습니다.

---

## 기준 크기: html 16px · body 14px

```css
:root { --qd-root-size: 16px; }                    /* 공통 기반 patterns/foundation.css */
html { font-size: var(--qd-root-size, 16px); }      /* 제품 기반이 마지막에 둡니다 */
html, body { font-size: 14px; line-height: var(--qd-leading-relaxed); }   /* 원본 globals: body 만 14px 로 남습니다 */
font-feature-settings: 'ss03', 'tnum';
-webkit-font-smoothing: antialiased;
text-rendering: optimizeLegibility;
```

원본 globals 는 `html, body` 를 14px 로 두지만, 제품 기반 CSS 의 `html { font-size: var(--qd-root-size, 16px) }` 가
뒤에 와서 html 은 16px 이 됩니다(Q-Atelier 운영 화면에서 html 16px · body 14px 로 쟀습니다).
`dist/q-design.tokens.json` 의 `rootFontSize` 는 이 `--qd-root-size` 에서 읽어 적습니다. 손으로 적은 숫자가 아니라, 기반 값을 바꾸면 함께 바뀝니다.
그래서 **body 를 물려받는 글은 14px, rem 으로 적은 글은 16px 기준**입니다. rem 을 14 로 환산하면 틀립니다.

| 토큰 | 선언값 | 실렌더(16px 기준) |
|---|---|---|
| `TYPE.h3` | `1.125rem` | **18px** |
| `TYPE.body` | `1rem` | **16px** |
| `TYPE.caption` | `0.875rem` | **14px** |
| `TYPE.mono` | `0.75rem` | **12px** |

치수를 옮길 때는 그 화면의 html 계산값부터 봅니다.

`ss03` 은 Pretendard 의 정렬 가독성 세트, `tnum` 은 숫자 폭 고정입니다.
표에서 숫자가 흔들리지 않는 이유가 이 한 줄입니다.

### 🔴 보조 글씨는 최소 12px 입니다 (오너 결정 2026-09-27 · 화면 검토 M77 · M43)

차림표 묶음 이름 · 표 머리 · 지표 이름표 · 제목 위 글 · 배지가 10 ~ 11px 에 흐린 색이면 노트북으로 결재하는
대표 · 부서장이 읽기 어렵습니다. 화면에 그려지는 글자는 **계산된 크기로 12px 이상**입니다(메일 본문 · 인쇄 지면은 뺍니다).

- Q-Atelier 는 계약 `lib/design/min-font-size.test.ts` 가 손으로 적은 12px 미만을 막습니다. `FS` 에는 2026-10-26 부터 12 미만 키가 없어 타입이 먼저 막습니다.
- `TYPE.caption` 은 14px, `TYPE.mono` 는 12px 입니다(2026-10-26). 전에는 13 · 11px 이라 쓰는 자리마다 12px 로 덮었습니다.
  그때 선언값을 못 바꾼 까닭은 `tokens.ts` 가 요구사항 엔진의 검증 근거였기 때문인데, 2026-10-26 에 엔진을 이 파일에서 뗐습니다
  (Q-Atelier f5d7d14a · 어떤 엔진도 `lib/design/` 을 근거로 들지 않는다는 시험이 `validation-manifest.test.ts` 에 있습니다).
- 배지는 12 · 12 · 14px(높이 20 · 24 · 28)입니다(`tag-metrics.ts` · `dist/q-design.tokens.json` 의 `tag.dims`).
- 정본 세 조각(차림표 · 목록 · 뼈대)은 원본 부품에서 뽑으므로 12 이상이고, 받는 제품도 그 값을 받습니다.
  Q-Sonar 도 이 규칙을 받습니다(오너 결정 2026-10-10 · `tools/sync-parts.mjs` 의 `HOLD` 주석).

---

## 의미 스케일 `TYPE`

굵기·줄간격·자간까지 묶인 완성된 조합입니다. **헤딩과 본문은 여기서 고릅니다.**

| 키 | 크기 | 굵기 | 자간 | 줄간격 | 용도 |
|---|---|---|---|---|---|
| `display` | `2.5rem` = 40px | 600 | -0.02em | 1.2 | 랜딩 히어로 |
| `h1` | `clamp(1.75rem, 1.25rem + 1.5vw, 2.5rem)` = 28~40px | 600 | -0.015em | 1.2 | 페이지 타이틀 |
| `h2` | `clamp(1.25rem, 1rem + 0.8vw, 1.5rem)` = 20~24px | 600 | -0.01em | 1.2 | 섹션 타이틀 |
| `h3` | 18px | 600 | -0.005em | 1.4 | 카드 헤더 |
| `body` | 16px | 400 | 0 | 1.6 | 본문 |
| `caption` | 14px | 400 | 0 | 1.6 | 보조 정보 |
| `mono` | 12px | 500 | 0.08em | 1.4 | 코드·라벨·배지 (uppercase) |

(2026-10-26 전에는 display 40~72 · 700 · 1.05, h1 28~36 · 700 · 1.15, h3 17 · 1.35, body 15 · 1.65, caption 13 · 1.55, mono 11 이었습니다.)

**크면 클수록 자간이 좁아집니다.** 큰 글자는 자간이 벌어져 보이기 때문입니다.
`display` 는 -0.02em 까지 조입니다.

헤딩은 `clamp()` 반응형이라 **고정 px 로 넣으면 안 됩니다.**
인라인 `fontSize` 가 클래스의 `clamp` 를 이겨 모바일에서 제목이 줄지 않게 됩니다.
`clamp()` 의 양 끝(28 · 40, 20 · 24)은 사다리 위에 있고, 그 사이는 화면 폭을 따라 흐릅니다. 사다리 밖 크기가 생기는 자리는 이 반응형 제목뿐입니다.

---

## 크기 사다리 `FS`: 아홉 단

```
12 · 14 · 16 · 18 · 20 · 24 · 28 · 32 · 40
```

CSS 는 `--qd-font-size-12` ~ `--qd-font-size-40`, 아뜰리에 TS 는 `FS[12]` ~ `FS[40]`(부품 안에서는 `QDScale.font[…]`), 테일윈드 제품은 `text-xs`(12) ~ `text-4xl`(40)입니다.
`--qd-font-size-48 · 60 · 72 · 96 · 128` 은 44px 를 넘는 장식 숫자 몫이라 사다리 밖에 둡니다.

**rem 이 아니라 px 입니다.** rem 이면 사용자가 브라우저 글꼴을 키울 때 배지·칩이 넘칩니다.

### 사이 값은 일부러 없앴습니다

13 · 15 · 17 · 22 처럼 1 ~ 2px 차이는 눈으로 갈리지 않으면서 단계만 늘립니다. 2026-10-26 전에는 사다리가 24단(8 ~ 80)이었고,
세 제품 진열판에서 13px 와 22px 가 같은 역할에 섞여 있었습니다. 사이 값은 **큰 쪽으로** 접었습니다(글씨가 작다는 지적이 있었기 때문입니다).
그 전에 0.5 단계(10.5 · 11.5)를 지울 때와 같은 까닭이고, 같은 방법입니다.

> **키를 지운 것 자체가 가드입니다.** 사이 값을 다시 쓰면 타입 에러로 즉시 막힙니다.

계산으로 크기를 내는 자리도 사다리에서 올려 잡습니다. 아바타 머리글자는 «지름 × 0.45» 를 사다리에서 올려
30 → 14 · 32 → 16 · 20 → 12 가 됩니다(Q-Atelier `components/Avatar.tsx` · nav 추출기 `avatarInitialSize`).

---

## 굵기: 400 · 500 · 600

| 값 | 이름 | 자리 |
|---|---|---|
| 400 | `normal` | 본문 · 설명 · 표의 값 |
| 500 | `medium` | 단추 · 칸 이름 · 라벨 · 탭 |
| 600 | `semibold` | 제목 · 강조 · 지표 숫자 · 선택된 탭 |

CSS 는 `--qd-font-weight-normal · medium · semibold`, 테일윈드는 `font-normal · font-medium · font-semibold` 만 남깁니다
(메종은 테마 단계에서 덮고, 카르넷은 `--font-weight-*: initial` 로 기본 이름을 지웁니다).

🔴 **`b` · `strong` 은 600 입니다.** 브라우저 기본은 `bold`(700)이고, 테일윈드 preflight 는 `bolder` 라
바깥 글씨가 400 이면 700, 600 이면 900 까지 올립니다. 세 제품에 `b` · `strong` 이 200 ~ 330곳씩 있어(Q-Atelier 327 · Q-Maison 200 · Q-Carnet 238) 가장 큰 구멍이었습니다.
제품마다 맞는 층에 둡니다: 아뜰리에는 `q-design-reset` 층, 메종 · 카르넷은 테일윈드 `base` 층.
그래서 기본값만 600 이 되고, 부품이 `style` 이나 `font-medium` 으로 준 굵기는 그대로 이깁니다.

---

## 줄간격 사다리 `LH`

색과 달리 줄간격은 테마에 따라 바뀌지 않습니다.
그래서 테마 블록이 아니라 **자기 `:root`** 에 둡니다. 「테마 축이 아님」을 구조로 드러낸 것입니다.

| 키 | 값 | 용도 |
|---|---|---|
| `none` | 1 | **비율이 아니라 정렬 리셋.** 아이콘·버튼·대형 숫자. 문장에 쓰지 않습니다 |
| `tight` | 1.2 | 큰 글(20px 이상): 제목 · 큰 숫자 |
| `snug` | 1.4 | 한 줄 글: 배지 · 칩 · 라벨 · 단추 · 선택 단추 · 카드/목록 제목 · 표 |
| `relaxed` | 1.6 | 문단과 목록: 설명 · 안내문 · 긴 글 · 입력 상자(textarea) (body 상속 기준선) |

2026-10-26 에 여덟 키를 넷으로 줄였습니다. `heading`(1.3)은 `snug`(20px 이상 글이면 `tight`)로, `normal`(1.5) · `notice`(1.55) · `loose`(1.7)는 `relaxed` 로 접었습니다.
CSS 는 `--qd-leading-none · tight · snug · relaxed` 와 크기별 짝(`--qd-leading-xs` ~ `--qd-leading-4xl`, 20px 이상은 `tight`)이고,
아뜰리에는 TS 상수 `LH` 와 CSS 변수 `--qa-lh-*` 양쪽에 있어 계약(`lib/design/lh-css-sync.test.ts`)이 둘의 키와 값을 대조합니다.
옛 사본 이름 `--qd-line-height-*` 는 걷었습니다(정본 시험이 다시 생기면 실패합니다).

입력칸 · 단추는 줄간격을 물려받지 않아 브라우저 기본값(`normal`)이 돌았습니다. 2026-10-27 부터 아뜰리에 foundation 리셋이 `button, input, select, textarea` 에 1.4(`--qd-leading-snug`)를 줍니다.
메종(테일윈드 3)은 preflight 가 `line-height: inherit`, 카르넷(테일윈드 4)은 `font: inherit` 로 바깥 줄간격을 물려받습니다.
줄간격을 따로 적은 부품은 그쪽이 이깁니다(선택 단추 `--qd-choice-line-height` 1.4, `textarea.qd-input` 1.6).
높이를 여백으로 내던 아뜰리에 차림표 단추 둘(묶음 머리 32 · «생산» 부서 묶음 40)은 높이를 적어 그대로 두었고, 내 할 일 탭 · 변경평가 두 줄 탭은 3.6px 늘었습니다(오너 결정 «차림표만 고정, 탭은 1.4»).

### 배지 높이는 이제 `minHeight` 가 정합니다

전에는 md 배지가 `13px × 1.4 + 4×2 + 2 = 28.2px` 로 `minHeight` 28 을 넘어, 줄간격을 만지면 배지 높이가 함께 움직였습니다.
2026-10-26 에 md 글자를 14 로 올리고 위아래 여백을 3 으로 줄여, 세 크기 모두 `minHeight` 가 높이를 정합니다.

| 크기 | 글자 | minHeight | 콘텐츠 높이 | 무엇이 지배하나 | 여유 |
|---|---:|---:|---:|---|---:|
| `xs` | 12 | 20 | 18.8 | minHeight | 1.2px |
| `sm` | 12 | 24 | 22.8 | minHeight | 1.2px |
| `md` | 14 | 28 | **27.6** | minHeight | 0.4px |

콘텐츠 높이 = 글자 크기 × 1.4 + 위아래 padding + 위아래 테두리 1px 입니다(`tag-metrics.ts` 의 `tagContentHeight`).
md 의 여유가 0.4px 라 `LH.snug` 를 올리면 다시 줄간격이 지배합니다. `tag-metrics.test.ts` 가 그 순간 실패해 알려 줍니다.

---

## 🔴 한글에는 자간을 주지 않습니다

이 시스템에서 가장 중요한 타이포 규칙입니다.

`letter-spacing` + `uppercase` + mono 조합은 **영문 약어 라벨**(ISO · CAPA · RA)을 위한 장치입니다.
라틴 대문자는 벌려야 읽히지만, **한글은 벌리면 낱글자로 흩어집니다.**
화면에서 「오늘  처리할  것」·「모든  권한  공통」처럼 벌어져 보입니다.
`uppercase` 는 한글에 아무 효과도 없어 「있어도 그만」인데, 트래킹만 남아 해를 끼칩니다.

### 해법: 내용을 보고 정하는 함수

```ts
/** ReactNode 안에 한글이 있는지: 문자열·배열·element children 을 훑습니다. */
hasHangul(node): boolean                    // /[가-힣]/

/** 한글이 섞이면 0, 아니면 주어진 값 */
labelTracking(node, value = '0.08em'): number | string

/** 한글이 섞이면 '-0.35em'(모노가 그리는 넓은 공백을 좁힘), 아니면 지정 없음 */
labelWordSpacing(node): string | undefined

/** 한글이 섞이면 'none', 아니면 'uppercase' */
labelCase(node): 'none' | 'uppercase'
```

```tsx
letterSpacing: labelTracking(children, 2.2),
wordSpacing: labelWordSpacing(children),
textTransform: labelCase(children),
```

`hasHangul` 은 원본 `tokens.ts` 에 있고, 나머지 셋은 `patterns/foundation/atelier-labels.ts` 가 냅니다.

- **`textTransform` 은 `undefined` 가 아니라 `'none'` 을 적어야 합니다.** 상속 속성이라 자기 값을 안 적으면 부모의 `uppercase` 가 그대로 내려옵니다. 그래서 `labelCase()` 를 씁니다.
- **자간을 0 으로 해도 어절 공백이 남습니다.** 모노 체인에서 공백은 JetBrains Mono 가 그려 Pretendard 공백보다 두 배 넘게 넓습니다. `labelWordSpacing()` 이 그 폭을 좁힙니다.

계약(Q-Atelier `lib/design/label-tracking-contract.test.ts`)이 두 겹으로 강제합니다.

- **1부**: `lib/design/components.tsx` 에서 **uppercase 근처에 raw `letterSpacing` 리터럴이 있으면 실패**합니다.
- **2부**(2026-10-22): `app/` · `components/` 의 모든 .tsx 를 구문 트리로 훑습니다. `var(--qd-…)` 토큰과 `QDText.tracking.*` 까지 px 로 풀어,
  **0.3px 넘는 양수 자간이 걸린 글귀가 한글이면 실패**합니다. 글귀는 끝까지 따라갑니다:
  함수가 돌려준 객체의 속성(`resolveKind(k).label`), 부품을 부르는 곳이 넘긴 props(`<Field hint="선택" />`),
  배열을 도는 콜백의 원소(`OPTIONS.map((o) => o.label)`), 매개변수의 타입.
  그래도 정할 수 없는 자리(DB 에서 온 코드 · 날짜 등)는 «모름» 으로 세어 시험 파일 안의 파일별 기준선(`UNKNOWN_BASELINE`)과 맞춥니다.
  새 파일에 «모름» 이 생기면 실패하고, 실패 메시지가 붙여 넣을 기준선을 그대로 보여 줍니다.

1부만 있던 때는 `"var(--qd-atelier-letter-spacing-…)"` 꼴의 자간을 읽지 못해 운영 화면의 한글 자간을 놓쳤습니다(거짓 초록).

> 이 규칙은 한국어 UI 를 만드는 어느 프로젝트에나 그대로 옮길 가치가 있습니다.
> CJK 전반에 해당합니다.

---

## 라벨의 시각 언어

이 시스템의 «에디토리얼» 인상은 대부분 라벨에서 나옵니다.

```
mono · uppercase · 넓은 자간 · 흐린 색 · 작게(12px)
```

| 자리 | 크기 | 자간(영문일 때) | 색 |
|---|---|---|---|
| 페이지 부제 (`PageHd sub`) | 12px | 2.2px | `subtle` |
| 지표 이름 (`KPI` · `Card` label) | 12px | 1.5px | `subtle` |
| 매거진 구분자 이름표 (`.qa-mag-divider-label`) | 12px | 1.5px | `muted` |
| 구역 제목 번호 (`.qa-sec-t::before`) | 12px | 0.1em | `champagne` |

**전부 한글이면 자간이 0 으로 떨어집니다.**

구역 제목(`SectionTitle`) 자체는 라벨이 아닙니다. ui 글꼴 16px · 600 · 줄간격 1.4 · 본문색이고, 금색은 앞의 모노 번호에만 남깁니다
(2026-10-10 C안 · 원본 계약 `section-title-contract.test.ts` · 굵기는 2026-10-26 에 700 에서 600).

---

## 링크와 선택

```css
a { color: inherit; text-decoration: none; }

.qa-link {
  color: var(--qa-champagne);
  border-bottom: 1px solid color-mix(in srgb, var(--qa-champagne) 40%, transparent);
  padding-bottom: 1px;
}
.qa-link:hover { border-bottom-color: var(--qa-champagne); }
```

밑줄을 `text-decoration` 이 아니라 `border-bottom` 으로 그립니다.
디센더를 자르지 않고, 색을 따로 줄 수 있으며, 호버에서 진해집니다.
선택 영역의 색은 [2장 색](02-color.md)의 «색을 쓰는 관용구» 에 있습니다.

---

## 옮겨 쓸 때 최소 세트

```css
html { font-size: 16px; }   /* rem 기준. 제품과 같게 */
body {
  font-size: 14px;
  font-family: var(--qa-font-pretendard), -apple-system, BlinkMacSystemFont,
               system-ui, 'Segoe UI', 'Noto Sans KR', sans-serif;
  line-height: 1.6;
  font-feature-settings: 'ss03', 'tnum';
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
```

그리고 라벨을 만들 때마다 **한글이 섞였는지** 확인하십시오. 그 한 가지가 절반입니다.
