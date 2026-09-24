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

> 대외 문서(MedQraft)는 다시 **두 판** 입니다. 위 표는 IR 덱에서 온 어두운 **브리핑** 판입니다.
> 흰 종이로 나가는 제안서 · 계약서 · 보고서는 회사 문서 양식 규격서 v8 을 따르고, 종이 위 금색 «글자» 는
> `#8C6C27` 입니다. [23 MedQraft 종이 문서 양식 v8](23-medqraft-paper-document-v8.md) 을 보십시오.

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
생성 경로는 `templates/make.py`(양식 5종의 글은 `forms5.py`) · `mqhtml.py` → HTML → DOCX/PDF 입니다. 2026-09-24 부터 회사 문서 양식 v8([docs/23](23-medqraft-paper-document-v8.md))을 따릅니다.

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

### ① 굴림체가 섞여 있었습니다 (고침)

> ⚠️ **처음 진단은 틀렸습니다.** `/BaseFont` 만 보고 「Noto Sans KR 이 한 번도 안 실렸다」고
> 적었는데, 임베드 실체는 `/FontName` 에 있습니다. 거기까지 풀어 보니 **Noto Sans KR 은
> 제대로 실려 있었습니다.** PDF 는 Word 가 아니라 **HTML 을 Chrome 으로 인쇄**해 만들고,
> 웹폰트가 정상 로드됩니다. 압축된 객체 스트림 안에 있어 겉만 훑으면 안 보입니다.

진짜 문제는 **폴백이었습니다.** 글꼴 지정이 `'Noto Sans KR', sans-serif` 였는데,
Noto Sans KR 에 없는 글리프(일부 기호)가 `sans-serif` 로 떨어지고
Windows 에서 그것이 **굴림체(GulimChe)** 가 됩니다. 다섯 문서 중 둘에 섞여 있었습니다.

굴림은 옛 비트맵 느낌이라 이 문서 톤과 맞지 않습니다.

**고침**: 폴백을 명시해 «무엇으로 떨어질지» 를 우리가 정합니다.

```python
SANS = "'Noto Sans KR','Malgun Gothic',sans-serif"
MONO = "'JetBrains Mono',Consolas,monospace"
```

Chrome 으로 다시 뽑아 실측하니 **굴림이 사라지고 맑은 고딕으로** 갑니다.

### ①-2 DOCX 는 통째로 맑은 고딕이었습니다 (고침)

PDF 와 달리 DOCX 경로는 `templates/tools/html2docx.js` 가 만듭니다.
그 변환기가 **CSS 의 `font-family` 를 읽지 않고 자기 상수를 씁니다.**

```js
const FONT_KO = '맑은 고딕', FONT_EN = 'Malgun Gothic', FONT_MONO = 'Consolas';
```

즉 글꼴이 세 곳(`colors_and_type.css` · `mqhtml.py` · `html2docx.js`)에 따로 적혀 있고,
DOCX 로 나가는 것은 세 번째였습니다.

**고침**: Noto Sans KR 로 맞추고, **run 마다 직접 적습니다.**
`styles.xml` 의 docDefaults 에만 적으면 **Word 가 그것을 따르지 않고** 자기 기본값(Calibri)을 씁니다
(실측 확인). 파일이 조금 커지지만 「무엇으로 그려질지」가 확실해집니다.

mono 는 Consolas 로 둡니다. JetBrains Mono 가 이 PC 에 없어서, 적어 두면 Word 가
무엇으로 대체할지 알 수 없기 때문입니다.

> 🔑 **대외 발송은 PDF 로 하십시오.** DOCX 는 폴백 «체인» 을 못 쓰고 이름 하나만 적히므로,
> 받는 쪽에 그 글꼴이 없으면 Word 가 임의로 대체합니다. PDF 는 글꼴을 파일 안에 심습니다.

### ② 종이 위 대비가 미달이었습니다 (고침)

이 팔레트는 **dark-first** 입니다. 다크 배경용으로 고른 색이 종이에 그대로 쓰이고 있었습니다.

| 토큰 | 전 | 흰 종이 | 아이보리 | 후 | 새 최저 |
|---|---|---:|---:|---|---:|
| `ink-1` | `#0E1116` | 18.91 | 17.45 | (그대로) | |
| `ink-2` | `#354154` | 10.32 | 9.52 | (그대로) | |
| **`ink-3`** | `#8A97A8` | **2.97** | **2.74** | **`#647286`** | 4.51 |
| **`gold`(글자)** | `#D6B56D` | **1.96** | **1.81** | **`#8C6C27`** | 4.52 |
| **`indigo`** | `#5B6CFF` | **4.17** | **3.85** | **`#4A5DFF`** | 4.50 |

실제 PDF 에서 쓰인 횟수를 세면 `#8A97A8` 이 문서당 56~118회, `#D6B56D` 이 36~80회였습니다.
`ink-3` 은 캡션·meta·표 셀이고, `gold` 는 eyebrow 라벨·문서번호·섹션 번호의 글자색입니다.
12px 대문자 금색 라벨이 흰 종이에서 1.96:1 이면 사실상 안 읽힙니다.

**고침 방향: 금색을 «장식» 과 «글자» 로 나눴습니다.**

```python
GOLD     = '#D6B56D'   # 브랜드 금색. 장식 전용: 선·면·표지 워터마크
GOLD_INK = '#8C6C27'   # 종이 위 «글자» 용 (4.52)
```

장식(선·면·opacity 0.05 워터마크)은 대비 규칙 밖이라 브랜드 금색을 지키고,
뜻을 전달하는 글자에만 어두운 금색을 씁니다.
표 안의 흐름 화살표(`→`)도 «뜻을 전달하므로» 글자 쪽으로 보냈습니다.

색상·채도는 그대로 두고 명도만 옮겼습니다. AA 를 통과하는 가장 작은 변경입니다.

> 🔑 **다크용으로 고른 색을 종이에 그대로 쓰면 안 됩니다.**
> 앱도 같은 문제를 라이트 팔레트를 따로 두어 풀었습니다(샴페인 `#b8935a` → `#8a6838`).
> `GOLD_INK` 가 그 값과 거의 같은 자리에 온 것은 우연이 아닙니다.

**검증**: 4종 문서를 다시 만들어 «글자로 쓰인 색» 만 골라 재니 전부 AA 를 통과합니다.
`tools/extract-brief.mjs` 가 이제 글자 색이 미달이면 산출물을 쓰지 않고 실패합니다.

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
