# 문서 디자인

화면 밖으로 나가는 것들입니다. DOCX · PDF · 인쇄물 · 제안서.

> **먼저 알아야 할 것: 문서 브랜드는 «둘» 입니다.**
> 섞으면 둘 다 무너집니다.

| | 제품 문서 | 대외 문서 |
|---|---|---|
| 무엇 | 앱이 만들어 내는 DOCX·인쇄물 | 제안서·견적서·계약서·요건서·RFI·IR 덱 |
| 브랜드 | **Q-Atelier** | **MedQraft** |
| 바탕 | 먹색 계열 | 네이비 `#0E1116` |
| 액센트 | 샴페인 `#8a6838`(종이) | 금 `#D6B56D` |
| 보조 액센트 | 없음 | 인디고 `#5B6CFF` |
| 글꼴 | Pretendard | Noto Sans KR |
| 모서리 | 10px | **0px** (각짐) |
| 간격 눈금 | 4px | **8pt** |
| 산출물 | `dist/q-design.doc.*` | `dist/q-design.brief.json` |
| 원본 | 웹 라이트 팔레트에서 파생 | `MedQraft/templates/assets/colors_and_type.css` |

**장치는 같고 값이 다릅니다.** 금색 짧은 선 + 대문자 라벨, 카드 왼쪽 액센트 띠,
조용한 표면 계단은 양쪽 다 씁니다. 그래서 «패밀리» 로 보입니다.

---

## 1. 제품 문서 (Q-Atelier)

앱이 생성하는 DOCX 와, 화면을 종이로 내보내는 인쇄 경로입니다.

### 산출물

```
dist/q-design.doc.json   문서 토큰 (색 15 · 크기 8 · 간격 7)
dist/q-design.doc.ts     받는 쪽이 그대로 import
dist/q-design.print.css  HTML 을 종이로
```

`tools/extract-doc.mjs` 가 **웹 라이트 팔레트에서 파생**하고 종이 위 AA 를 검증합니다.

### 화면과 다른 점 다섯

**① 종이는 언제나 흰색입니다.** 다크 축이 없습니다.

**② 표면이 둘입니다.** 흰 종이(`#FFFFFF`)와 음영 표(`#F3F1EC`).
**음영 표 위가 더 어렵습니다.** 흰 배경만 보고 색을 고르면 표 안에서 미달합니다.

**③ 색 표기가 OOXML 형식입니다.** `#` 없는 6자 대문자.

**④ 글꼴 폴백이 다릅니다.** Word 는 Pretendard 가 없으면 **한글을 명조로 대체**하므로
`eastAsia` 를 Malgun Gothic 으로 못박습니다.

```ts
sans: { ascii: 'Pretendard', hAnsi: 'Pretendard', eastAsia: 'Malgun Gothic' }
```

**⑤ 크기 단위가 다릅니다.** half-point(pt×2)와 twip(pt×20).

| 자리 | half-pt | pt |
|---|---:|---:|
| 표지 제목 | 56 | 28 |
| h1 | 32 | 16 |
| h2 | 26 | 13 |
| h3 | 22 | 11 |
| 본문 | 20 | 10 |
| 캡션 | 18 | 9 |
| 라벨 | 16 | 8 |
| 푸터 | 14 | 7 |

A4 여백은 `18mm 16mm 22mm`(twip 1020 / 907 / 1247)로 화면 `@page` 와 같습니다.

### 🔴 이 범주가 생긴 이유

`lib/export/docx-builder/brand.ts` 가 라이트 팔레트를 **손으로 베낀 사본**이었습니다.
머리말에 「색 수정 시 양쪽 모두 변경」이라 적혀 있었지만 실측하니 세 값이 어긋나 있었습니다.

```
inkMuted  7A7468  ← 웹 라이트 muted 는 726B5E (2026-06-30 에 AA 미달로 고침)
frame     7A7468  ← 같은 값
red       B54040  ← 웹 라이트 red 는 A83838
```

`#7A7468` 은 **음영 표 위 4.11** 로 AA 미달입니다.
웹에서는 이미 고쳐진 값이 **심사원이 읽는 출력물에만** 남아 있었습니다.

> 🔑 「양쪽 모두 변경」이라고 적어 두는 것으로는 사본이 지켜지지 않습니다.
> 이제 파생하고, 사본에 지문을 찍고, 계약이 대조합니다 (`q-design-copy.test.ts`).

---

## 2. 대외 문서 (MedQraft)

제안서 · 견적서 · 계약서 · 요건서 · RFI. 밖으로 나가는 문서입니다.

원본은 `MedQraft/templates/assets/colors_and_type.css` 이고 IR 덱에서 왔습니다.
생성 경로는 `templates/make.js` → HTML → DOCX/PDF 입니다.

### 팔레트

```
/* 다크 (원본) */
--mq-bg      #0E1116    --mq-panel   #121824    --mq-panel-2 #1A2230
--mq-line    #273140    --mq-line-2  #354154
--mq-gold    #D6B56D    --mq-indigo  #5B6CFF
--mq-text-1  #F3F6FA    --mq-text-2  #C2CAD6    --mq-text-3  #8A97A8

/* 종이 (거울) */
--mq-paper   #FFFFFF    --mq-ivory   #F3F6FA
--mq-ink-1   #0E1116    --mq-ink-2   #354154    --mq-ink-3   #8A97A8
--mq-rule    #E2E6EC    --mq-rule-strong #C2CAD6
```

### 타이포

```
display 64 · h1 40 · h2 28 · h3 20 · h4 16
lead 18 · body 15 · ui 14 · caption 13 · micro 11   (px)

줄간격  display 1.12 · 헤딩 1.28 · 본문 1.62 · UI 1.45
자간    display -0.01em · 헤딩 -0.005em · eyebrow **0.18em**
```

### 부품

```
.mq-eyebrow-rule::before   28×2px 금색 선          ← Q-Atelier PageHd 의 32×1.5 와 같은 장치
.mq-card                   각진 모서리 · padding 32 · 1px line
.mq-card--accent           border-left 2px 금색     ← Q-Atelier EntityRow 와 같은 장치
.mq-badge                  높이 22 · pill · 12px · weight 600
.mq-btn--primary           금색 배경 + #1A1206 글자 · 높이 40 · radius 4
```

간격은 **8pt 그리드**(4·8·12·16·24·32·48·64·96·128), 모서리는 0·4·8·12·pill,
이징은 `cubic-bezier(0.2, 0.7, 0.2, 1)` 입니다 (앱의 `0.16,1,0.3,1` 과 다릅니다).

---

## 3. 🔴 실제 문서에서 발견한 것 둘

2026-09-10 에 실제로 나간 PDF 5종(제안서·RFI·견적서·요건서·계약서)을 열어
내부 구조를 실측했습니다. 전부 A4, 6~12쪽입니다.

### ① Noto Sans KR 이 한 번도 안 실렸습니다

CSS 는 `--mq-font-sans: "Noto Sans KR", …` 을 요구하는데, 실제 PDF 에 임베드된 글꼴은 이렇습니다.

| 문서 | 임베드된 글꼴 |
|---|---|
| 제안서 | Arial-BoldMT · ArialMT · **GulimChe** |
| RFI | Arial-BoldMT · ArialMT |
| 견적서 | Arial-BoldMT · ArialMT |
| 요건서 | Arial-BoldMT · ArialMT |
| 계약서 | Arial-BoldMT · ArialMT · **GulimChe** |

**Noto Sans KR 은 다섯 문서 어디에도 없습니다.**
둘은 굴림체로 떨어졌고, 셋은 **한글 글꼴이 아예 임베드되지 않았습니다.**
임베드가 없으면 받는 쪽 PC 에 있는 글꼴로 그려집니다. **어떻게 보일지 알 수 없습니다.**

문서마다 한글 얼굴이 다르다는 뜻이기도 합니다.
같은 회사에서 같은 날 보낸 다섯 문서가 서로 다른 글꼴로 읽힙니다.

> 전문가 포털에서 「한글이 자리마다 다른 폰트로 그려진」 사고와 같은 형태이고,
> 이쪽은 **밖으로 나간다는 점**에서 더 무겁습니다.

### ② 종이 위 대비가 미달입니다

이 팔레트는 **dark-first** 입니다. 다크 배경용으로 고른 색이 종이에 그대로 쓰이고 있습니다.

| 토큰 | 값 | 흰 종이 | 아이보리 | 판정 |
|---|---|---:|---:|---|
| `ink-1` | `#0E1116` | 18.91 | 17.45 | 좋음 |
| `ink-2` | `#354154` | 10.32 | 9.52 | 좋음 |
| **`ink-3`** | `#8A97A8` | **2.97** | **2.74** | **미달** |
| **`gold`** | `#D6B56D` | **1.96** | **1.81** | **미달** |

실제 PDF 에서 쓰인 횟수를 세면 `#8A97A8` 이 문서당 56~118회, `#D6B56D` 이 36~80회입니다.
**대량으로 쓰이고 있습니다.**

`ink-3` 은 캡션·meta·라벨이고, `gold` 는 eyebrow 라벨(`.mq-eyebrow`)의 글자색입니다.
12px 대문자 금색 라벨이 흰 종이에서 **1.96:1** 이면 사실상 안 읽힙니다.

> 🔑 **다크용으로 고른 색을 종이에 그대로 쓰면 안 됩니다.**
> 앱은 이 문제를 라이트 팔레트를 따로 두어 풀었습니다(샴페인이 `#b8935a` → `#8a6838`).
> 대외 문서도 «종이용 금색»과 «종이용 보조색»이 따로 필요합니다.

---

## 4. 옮겨 쓸 때

### 제품 문서

```bash
node tools/extract-doc.mjs && node tools/sync.mjs --write
```

받는 쪽은 `q-design.doc.ts` 를 import 하고, 값을 손으로 적지 않습니다.
사본 지문 계약(`q-design-copy.test.ts`)을 함께 두면 조용히 갈리지 않습니다.

### 대외 문서

`MedQraft/templates/assets/colors_and_type.css` 가 원본입니다.
Q-Design 은 그것을 `source/brief/` 에 두고 `dist/q-design.brief.json` 으로 뽑습니다.

```bash
node tools/extract-brief.mjs
```

지금은 «읽기」 방향입니다. 값을 고칠 일이 생기면 MedQraft 쪽 원본을 고치고 다시 뽑습니다.

### 두 브랜드를 섞지 않는 법

- 앱이 만든 문서에 네이비·인디고를 쓰지 마십시오
- 제안서에 앱 샴페인을 쓰지 마십시오
- **금색이 두 가지라는 것을 기억하십시오** (`#8a6838` 과 `#D6B56D`)

한 화면·한 문서에 두 금색이 함께 나오면 곧바로 어색해집니다.
전문가 포털에서 같은 일이 실제로 있었습니다 ([8번 문서](08-expert-portal.md)).
