# 타이포그래피

이 시스템에서 가장 조심해야 할 영역입니다. 함정이 셋 있습니다.

> **① rem 기준이 14px 입니다** (16 아님)
> **② 한글에는 자간을 주지 않습니다**
> **③ 크기 사다리에 0.5 단계가 없습니다** (일부러 지웠습니다)

---

## 1. 글꼴 세 벌

| 역할 | 글꼴 | 원본 앱의 로딩 | Q-Design |
|---|---|---|---|
| 본문·UI·헤딩 전부 | **Pretendard Variable** | self-host · 공식 조각판 92조각(`app/fonts.css`, weight 45~920) | 파일 있음 (조각 전 온전한 한 파일 2MB) |
| 코드·라벨·배지 | **JetBrains Mono** | self-host · 이 저장소의 그 파일(가변 한 파일 · latin/latin-ext) | **파일 있음** (400~700 × latin/latin-ext · 네 굵기가 같은 가변 파일) |
| 영문 디스플레이 | **Cormorant Garamond** | `next/font/google`, **italic 미로드** | **파일 있음** (italic 제외) |

```css
--qa-font-pretendard  /* 원본은 app/fonts.css 가 :root 에 세운다 (2026-09-26 전에는 next/font 가 주입) */
--qa-font-cormorant   /* next/font 가 주입 */
```

> **2026-09-26 원본이 바뀌었습니다(오너 결정 「첫 방문 무게 줄이기」).** 전에는 Pretendard 2MB 한 파일을
> next/font/local 로 미리 받기까지 걸었고, JetBrains Mono 는 구글 글꼴 CSS 를 `@import` 했습니다. 처음 들어오는
> 사람이 어느 화면에서나 2MB 를 받고 외부 서버 두 곳을 기다렸습니다. 지금 원본은 Pretendard 1.3.9 공식 조각판
> (쓰인 글자가 든 조각만 받음 · 로그인 화면 약 0.25MB)과 JetBrains Mono 를 자기 서버에서 냅니다
> (`scripts/fonts/build-fonts.mjs` · `/fonts/*` 1년 불변 캐시). 🔴 원본의 미들웨어가 `/fonts/` 를 로그인 확인에서
> 빼야 합니다. 안 빼면 로그인 전에 글꼴 자리로 로그인 화면(HTML)이 가 조용히 시스템 글꼴로 그려집니다.

이 저장소는 **세 벌 모두 파일로 갖고 있습니다**(Cormorant 까지).
CDN 이 막힌 환경에서 라벨 글꼴이 시스템 monospace 로 떨어지면 라벨 언어가 통째로 무너지기 때문입니다.

```html
<link rel="stylesheet" href="dist/q-design.fonts.css">   <!-- 이 한 줄로 세 벌 -->
<link rel="stylesheet" href="dist/q-design.tokens.css">
```

`tools/verify-fonts.mjs` 가 CDN 을 차단한 채 렌더 폭을 재서 실제로 붙는지 검증합니다.
자세한 출처와 라이선스는 [`source/fonts/NOTICE.md`](../source/fonts/NOTICE.md) 에 있습니다.

### 메인 앱은 Pretendard 단일 정책입니다

헤딩도 본문도 같은 글꼴입니다. **위계는 글꼴이 아니라 굵기와 자간으로 만듭니다.**

```
디스플레이 톤 = weight 700 + letter-spacing -0.02em + tabular-nums
```

세리프를 헤딩에 섞지 않는 이유는 한글 때문입니다.
Cormorant 같은 영문 세리프는 한글 글리프가 없어서, 혼용 헤딩에서 영문만 튀어 보입니다.

### Cormorant 는 «얼굴» 화면의 영문 한 줄에만

로그인 히어로처럼 영문 위주 대형 디스플레이에만 씁니다.
**italic 은 아예 로드하지 않습니다.** 브랜드 규칙이고, 폴백 경로로 기울어질 여지까지 차단한 것입니다.

### 모노는 라틴만 담당합니다

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
> (이 저장소에서 그걸 몰라 「한글이 Pretendard 로 안 간다」고 한 번 오판했습니다.)

> **⚠️ 전문가 포털에서 실제로 일어난 사고**
> 각 체인 앞쪽 폰트(Cormorant · Noto Sans KR)가 `next/font` 로 로드되면 **자동 생성 대체 폰트**가 함께 붙는데,
> 그것이 한글을 먼저 가로챕니다. 그래서 뒤에 있던 Pretendard 에 **한 번도 도달하지 못했고**,
> 한글이 자리마다 다른 폰트로 그려졌습니다 (실측 렌더 폭 916 / 884 / 1020 / 828px).
> 해법은 **Pretendard 를 각 체인의 라틴 폰트 바로 뒤**에 두는 것입니다. 더 뒤에 두면 소용없습니다.

---

## 2. 기준 크기: 14px

```css
html, body { font-size: 14px; line-height: var(--qa-lh-relaxed); }
font-feature-settings: 'ss03', 'tnum';
-webkit-font-smoothing: antialiased;
text-rendering: optimizeLegibility;
```

**rem 을 16 으로 환산하면 전부 틀립니다.** 실렌더 픽셀은 이렇습니다.

| 토큰 | 선언값 | 14px 기준 실렌더 | 16 으로 착각하면 |
|---|---|---|---|
| `TYPE.h3` | `1.0625rem` | **14.875px** | 17px |
| `TYPE.body` | `0.9375rem` | **13.125px** | 15px |
| `TYPE.caption` | `0.8125rem` | **11.375px** | 13px |
| `TYPE.mono` | `0.6875rem` | **9.625px** | 11px |

`ss03` 은 Pretendard 의 정렬 가독성 세트, `tnum` 은 숫자 폭 고정입니다.
표에서 숫자가 흔들리지 않는 이유가 이 한 줄입니다.

### 🔴 보조 글씨는 최소 12px 입니다 (오너 결정 2026-09-27 · 화면 검토 M77 · M43)

차림표 묶음 이름 · 표 머리 · 지표 이름표 · 제목 위 글 · 배지가 10 ~ 11px 에 흐린 색이라 노트북으로 결재하는
대표 · 부서장이 읽기 어려웠습니다. 화면에 그려지는 글자는 **계산된 크기로 12px 이상**입니다(메일 본문 · 인쇄 지면은 뺍니다).

- Q-Atelier 는 2026-09-28 에 화면 코드의 12px 미만 2,178곳을 12 로 올렸고, 계약 `lib/design/min-font-size.test.ts` 가 막습니다.
- 위 표의 `TYPE.caption`(11.375px) · `TYPE.mono`(9.625px)는 그대로입니다. `tokens.ts` 가 요구사항 엔진의 검증 근거 파일이라
  디자인 한 줄로 엔진 재검증을 부르지 않으려고, **쓰는 자리에서** `fontSize: FS[12]` 로 덮습니다(계약이 덮지 않은 줄을 잡습니다).
- 배지는 12 · 12 · 13px(높이 20 · 24 · 28)입니다(`tag-metrics.ts`).
- 정본 세 조각(차림표 · 목록 · 뼈대)은 원본 부품에서 뽑으므로 12 이상입니다. 🔴 **받는 쪽은 아직 옛 값입니다**:
  Q-Maison · Q-Carnet 은 동결(오너 지시 2026-09-28 · `tools/sync-parts.mjs` HOLD), Q-Sonar 는 이 규칙에서 빠졌습니다(오너 결정 2026-09-28).
  두 제품에 옮길 일은 Q-Atelier `docs/FAMILY_PORT_QUEUE.md` 에 꼬리표로 모여 있습니다.

---

## 3. 의미 스케일 `TYPE`

굵기·줄간격·자간까지 묶인 완성된 조합입니다. **헤딩과 본문은 여기서 고릅니다.**

| 키 | 크기 | 굵기 | 자간 | 줄간격 | 용도 |
|---|---|---|---|---|---|
| `display` | `clamp(2.5rem, 1.5rem + 4vw, 4.5rem)` = 35~63px | 700 | -0.02em | 1.05 | 랜딩 히어로 |
| `h1` | `clamp(1.75rem, 1.25rem + 1.5vw, 2.25rem)` = 24.5~31.5px | 700 | -0.015em | 1.15 | 페이지 타이틀 |
| `h2` | `clamp(1.25rem, 1rem + 0.8vw, 1.5rem)` = 17.5~21px | 600 | -0.01em | 1.25 | 섹션 타이틀 |
| `h3` | 14.875px | 600 | -0.005em | 1.35 | 카드 헤더 |
| `body` | 13.125px | 400 | 0 | 1.65 | 본문 |
| `caption` | 11.375px | 400 | 0 | 1.55 | 보조 정보 |
| `mono` | 9.625px | 500 | 0.08em | 1.4 | 코드·라벨·배지 (uppercase) |

**크면 클수록 자간이 좁아집니다.** 큰 글자는 자간이 벌어져 보이기 때문입니다.
`display` 는 -0.02em 까지 조입니다.

헤딩은 `clamp()` 반응형이라 **고정 px 로 넣으면 안 됩니다.**
원본에는 인라인 `fontSize` 가 클래스의 `clamp` 를 이겨 모바일에서 제목이 안 줄던 버그가 있었습니다.

---

## 4. 값보존 사다리 `FS`

의미가 하나로 수렴하지 않는 미세 크기들입니다. 배지·칩·표·글리프를 넘나듭니다.

```
8 · 9 · 10 · 11 · 12 · 13 · 14 · 15 · 16 · 17 · 18 · 19 · 20 · 22 · 24 · 26 · 28
· 30 · 32 · 36 · 38 · 40 · 48 · 80
```

**rem 이 아니라 px 입니다.** rem 이면 사용자가 브라우저 글꼴을 키울 때 배지·칩이 넘칩니다.

### 0.5 단계는 일부러 없앴습니다

원래는 「럭셔리 미세조정용」으로 10.5 · 11.5 같은 하프스텝이 있었습니다.
실측해 보니 그 용도로 쓰이지 않고 **표류값**이 되어 있었습니다.

- 대시보드 한 화면에 크기가 12종
- 같은 역할의 대문자 라벨이 9 · 10 · 10.5 · 11.5 네 가지로 갈림

0.5px 차이는 **어떤 위계도 만들지 못하면서 「맞추려다 만」 인상만 남깁니다.**
331곳을 올림으로 접었습니다 (10.5→11 · 11.5→12 · 12.5→13 · 9.5→10).
올림 방향인 이유는 직전 감사에서 「9~11px 가 전체의 59%」로 글씨가 작다는 지적이 있었기 때문입니다.

> **키를 지운 것 자체가 가드입니다.** 0.5 를 다시 쓰면 타입 에러로 즉시 막힙니다.

---

## 5. 줄간격 사다리 `LH`

색과 달리 줄간격은 테마에 따라 바뀌지 않습니다.
그래서 테마 블록이 아니라 **자기 `:root`** 에 둡니다. 「테마 축이 아님」을 구조로 드러낸 것입니다.

| 키 | 값 | 용도 |
|---|---|---|
| `none` | 1 | **비율이 아니라 정렬 리셋.** 아이콘·버튼·대형 숫자. 문장에 쓰지 않습니다 |
| `tight` | 1.2 | 타이틀·대형 텍스트 |
| `heading` | 1.3 | 카드·모달·드로어 제목 |
| `snug` | 1.4 | 배지·칩·한 줄 라벨 |
| `normal` | 1.5 | 본문 기본 |
| `notice` | 1.55 | 안내문·콜아웃 |
| `relaxed` | 1.6 | 설명 문단 (앱 최빈값 · body 상속 기준선) |
| `loose` | 1.7 | 긴 산문·도움말 |

TS 상수와 CSS 변수(`--qa-lh-*`) 양쪽에 있고, 계약이 두 사다리의 키 집합과 값을 대조합니다.

### `LH.snug` 는 배지 높이도 결정합니다

이 값이 줄간격만 바꾸는 것이 아닙니다.

```
md 배지 = 11.5px × 1.4 + padding 4×2 + border 1×2 = 26.1px  >  minHeight 26
```

**즉 `minHeight` 가 아니라 줄간격이 배지 높이를 정합니다.**
`LH.snug` 를 1px 만 만지면 앱의 모든 mono 라벨과 97개 파일이 쓰는 md 배지가 **동시에** 움직입니다.
원본은 이 사슬을 `tag-metrics.test.ts` 로 잠가 두었습니다.

| 크기 | minHeight | 콘텐츠 높이 | 무엇이 지배하나 | 여유 |
|---|---:|---:|---|---:|
| `xs` | 18 | 16.0 | minHeight | 2.0px |
| `sm` | 22 | 21.4 | minHeight | 0.6px |
| `md` | 26 | **26.1** | **lineHeight** | 넘어섬 |

---

## 6. 🔴 한글에는 자간을 주지 않습니다

이 시스템에서 가장 중요한 타이포 규칙입니다.

`letter-spacing` + `uppercase` + mono 조합은 **영문 약어 라벨**(ISO · CAPA · RA)을 위한 장치입니다.
라틴 대문자는 벌려야 읽히지만, **한글은 벌리면 낱글자로 흩어집니다.**
`uppercase` 는 한글에 아무 효과도 없어 「있어도 그만」인데, 트래킹만 남아 해를 끼칩니다.

원본 실측: mono + 자간 1px 이상이 한글에 걸린 곳이 **166곳 / 93개 파일**이었습니다.
화면에서 「오늘  처리할  것」·「모든  권한  공통」처럼 벌어져 보였습니다.
게다가 그 값들(2.2px)은 정식 토큰 `TYPE.mono`(0.08em ≈ 0.8px)보다 **두 배 이상 넓었습니다.**

### 해법: 내용을 보고 결정하는 함수

```ts
/** ReactNode 안에 한글이 있는지: 문자열·배열·element children 을 훑습니다. */
hasHangul(node): boolean            // /[가-힣]/

/** 한글이 섞이면 0, 아니면 주어진 값 */
labelTracking(node, value = '0.08em'): number | string
```

```tsx
letterSpacing: labelTracking(children, 2.2),
textTransform: hasHangul(children) ? undefined : 'uppercase',
```

계약(`label-tracking-contract.test.ts`)이 강제합니다:
**uppercase 근처에 raw `letterSpacing` 리터럴이 있으면 실패**합니다.

> 이 규칙은 한국어 UI 를 만드는 어느 프로젝트에나 그대로 옮길 가치가 있습니다.
> CJK 전반에 해당합니다.

---

## 7. 라벨의 시각 언어

이 시스템의 «에디토리얼» 인상은 대부분 라벨에서 나옵니다.

```
mono · uppercase · 넓은 자간 · muted 색 · 아주 작게(9~11px)
```

| 자리 | 크기 | 자간 | 색 |
|---|---|---|---|
| 페이지 부제 (`PageHd sub`) | 10px | 2.2 | `subtle` |
| 섹션 제목 (`SectionTitle`) | 10px | 2.2 | `champagne` |
| KPI 라벨 | 10px | 1.5 | `subtle` |
| 매거진 구분자 | 10px | 2.2 | `muted` |
| 알림 제목 (`Alert`) | 10px | 1.5 | 알림색 |

**전부 한글이면 자간이 0 으로 떨어집니다.**

---

## 8. 링크와 선택

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

---

## 9. 옮겨 쓸 때 최소 세트

```css
:root { font-size: 14px; }
body {
  font-family: var(--qa-font-pretendard), -apple-system, BlinkMacSystemFont,
               system-ui, 'Segoe UI', 'Noto Sans KR', sans-serif;
  line-height: 1.6;
  font-feature-settings: 'ss03', 'tnum';
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
```

그리고 라벨을 만들 때마다 **한글이 섞였는지** 확인하십시오. 그 한 가지가 절반입니다.
