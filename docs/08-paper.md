# 8장 · 종이 · 문서

화면 밖으로 나가는 것(DOCX · PDF · 인쇄물 · 제안서)의 규격과, 화면과 문서가 함께 쓰는 강조 표시인 «문서 결» 을 정합니다.
뼈대는 하나입니다. 문서 브랜드는 둘(제품 문서 Q-Atelier · 대외 문서 MedQraft)이고, 대외 문서는 다시 두 판(어두운 브리핑 · 흰 종이 v8)입니다.
맨 끝 절은 같은 제품 안에서 다른 결을 쓰는 전문가 포털입니다.

합친 옛 문서: 20 문서 디자인 · 23 MedQraft 종이 문서 양식 v8 · 24 문서 결 · 08 전문가 포털 테마

---

## 문서 브랜드는 둘입니다

> 섞으면 둘 다 무너집니다.

| | 제품 문서 | 대외 문서 |
|---|---|---|
| 무엇 | 앱이 만들어 내는 DOCX · 인쇄물 | 제안서 · 견적서 · 계약서 · 요건서 · RFI · IR 덱 |
| 브랜드 | **Q-Atelier** | **MedQraft** |
| 바탕 색 계열 | 먹색 계열 | 네이비 `#0E1116` |
| 액센트 | 샴페인 `#8a6838`(종이) | 금 `#D6B56D` |
| 보조 액센트 | 없음 | 인디고 `#5B6CFF` (어두운 브리핑 판만) |
| 글꼴 | Pretendard | Noto Sans KR |
| 모서리 | 10px | **0px** (각짐) |
| 간격 눈금 | 4px | **8pt** |
| 산출물 | `dist/q-design.doc.*` | `dist/q-design.brief.json` · `dist/q-design.mqdoc.*` |
| 원본 | 웹 라이트 팔레트에서 파생 | MedQraft Docs 저장소 `templates/` |

대외 문서(MedQraft)는 다시 **두 판** 입니다. 같은 장치를 쓰되 값이 다르고, 둘을 한 문서에 섞지 않습니다.

| | 브리핑 · 1-pager (어두운 판) | 종이 문서 (밝은 판, v8) |
|---|---|---|
| 바탕 | 네이비 `#0E1116` | 흰 종이 |
| 금색 | `#D6B56D` (장식 · 어두운 바탕 위 글자) | 글자는 `#8C6C27`, 선 · 면 · 워터마크만 `#D6B56D` |
| 본문 글꼴 | Noto Sans KR | Noto Sans KR (DOCX 는 맑은 고딕) · 숫자와 문서번호는 JetBrains Mono |
| 산출물 | `dist/q-design.brief.json` | `dist/q-design.mqdoc.*` |
| 원본 | `templates/assets/colors_and_type.css` | `templates/spec-v8/` 규격서 |

🔴 흰 종이 위의 `#D6B56D` 글자는 1.96:1 이라 읽히지 않습니다. 종이에서 금색 «글자» 는 언제나 어두운 금색입니다.

**장치는 같고 값이 다릅니다.** 금색 짧은 선과 조용한 표면 계단은 두 브랜드가 같이 씁니다(제품 쪽은 `PageHd` 제목 위 32×1.5px 샴페인 선,
브리핑 쪽은 `.mq-eyebrow-rule` 의 28×2px 금색 선). 그래서 «패밀리» 로 보입니다. 카드 왼쪽 액센트 띠(`.mq-card--accent`)와 머리 위 작은 대문자 라벨(eyebrow)은
대외 문서 쪽 장치이고, 세 제품 화면은 아래 «문서 결» 에 따라 쓰지 않습니다.

### 두 브랜드를 섞지 않는 법

- 앱이 만든 문서에 네이비 · 인디고를 쓰지 않습니다.
- 제안서에 앱 샴페인을 쓰지 않습니다.
- **금색이 두 가지라는 것을 기억합니다** (`#8a6838` 과 `#D6B56D`). 한 화면 · 한 문서에 두 금색이 함께 나오면 곧바로 어색해집니다.
  같은 일이 전문가 포털에서 실제로 있었고, 그 해법이 이 장 끝 절의 «변수 갈아 끼우기» 입니다.

---

## 제품 문서 (Q-Atelier)

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

### 손으로 베낀 사본을 두지 않습니다

Q-Atelier 의 DOCX 빌더(`lib/export/docx-builder/brand.ts`)가 라이트 팔레트를 손으로 베껴 두었을 때, 머리말에
「색 수정 시 양쪽 모두 변경」 이라고 적혀 있었는데도 웹에서 AA 미달로 고친 값이 **심사원이 읽는 출력물에만** 옛 값으로 남았습니다.

> 🔑 「양쪽 모두 변경」 이라고 적어 두는 것으로는 사본이 지켜지지 않습니다.
> 그래서 파생하고, 사본에 지문을 찍고, 계약이 대조합니다(Q-Atelier `lib/design/q-design-copy.test.ts`).

### 화면을 종이로: 인쇄는 늘 밝은 색으로

**인쇄는 늘 밝은 색으로 나갑니다(오너 결정 2026-09-25).** 브라우저는 인쇄할 때 바탕색을 빼므로, 다크 테마 그대로 찍으면
흰 종이에 상아색 글자만 남습니다(표 글자가 흰 종이 대비 1.19).

원본 Q-Atelier 는 인쇄에서 색 이름(`--qa-*`)을 종이 값으로 덮어 처음부터 밝게 찍힙니다. 인쇄 정본(`q-design.print.css`)이 그 규칙을
옮겨 두었지만 **다른 제품에는 통하지 않습니다.** 제품마다 글자색을 다른 이름에서 받기 때문입니다.

그래서 색 값이 아니라 **테마 표시를 돌립니다.** 정본 부품 `PrintLight`(`source/components/print-light.tsx`, 여기가 원본)가 인쇄 직전에
테마 표시를 밝은 쪽으로 돌렸다가 인쇄가 끝나면 되돌립니다. 제품마다 이미 가진 밝은 팔레트를 그대로 쓰므로 색 값을 다시 적지 않습니다.

| 제품 | 테마 표시 | 받는 곳 | 앱 셸 |
|---|---|---|---|
| Q-Carnet | `<html data-theme>` | `components/print-light.tsx` | `<PrintLight except=".sheet" />` |
| Q-Sonar | `<html data-theme>` | `src/components/PrintLight.tsx` | `<PrintLight />` |
| Q-Maison | `<html class="dark">` | `components/shared/print-light.tsx` | `<PrintLight />` |
| Q-Atelier | (받지 않음) | 원본 CSS 가 종이 값으로 덮습니다 | |

- `except=".sheet"`: Q-Carnet 제조기록서는 서식(`.sheet`)이 스스로 밝은 팔레트를 쥐고 있어, 그 서식이 있는 화면에서는 부품이
  아무것도 하지 않습니다. 기록서 인쇄에는 손대지 않습니다.
- 브라우저 인쇄(Ctrl+P · 인쇄 단추)와 크롬의 PDF 만들기 모두 인쇄 직전 · 직후에 알림을 보내므로 같은 부품 하나로 둘 다 됩니다.
- 부품 주석에는 제품 이름을 적지 않습니다. Q-Sonar 에 «제품 이름은 한 곳에만» 계약이 있어 사본이 걸립니다.
- 인쇄 정본(`dist/q-design.print.css`)을 받는 제품은 **Q-Maison 하나**입니다. 받아 두기만 하고 불러 쓰지 않는 사본은
  «여기 고치면 된다» 는 착각만 남기므로 보내지 않습니다. `tools/sync.mjs` 가 그런 사본을 이름으로 알립니다.
  내보내는 자리는 `tools/sync-parts.mjs` 의 «인쇄는 밝게» · «인쇄» 항목입니다.

### 옮겨 쓸 때

```bash
node tools/extract-doc.mjs && node tools/sync.mjs --write
```

전체를 한 번에 다시 만들어 내보낼 때는 입구 `node tools/extract-all.mjs --sync` 가 같은 일을 합니다.
받는 쪽(Q-Atelier `lib/design/q-design.doc.ts`)은 `q-design.doc.ts` 를 import 하고, 값을 손으로 적지 않습니다.
사본 지문 계약(`q-design-copy.test.ts`)을 함께 두면 조용히 갈리지 않습니다.

---

## 대외 브리핑 (MedQraft · 어두운 판)

IR 덱에서 온 팔레트입니다. 원본은 MedQraft Docs 저장소의 `templates/assets/colors_and_type.css` 이고,
생성 경로는 `templates/make.py`(양식 5종의 글은 `forms5.py`) · `mqhtml.py` → HTML → DOCX/PDF 입니다.
흰 종이로 나가는 문서의 판형 · 글자 · 표 규격은 아래 «대외 종이 문서 양식 v8» 을 따릅니다.

### 팔레트

```
/* 어두운 판 (원본) */
--mq-bg      #0E1116    --mq-panel   #121824    --mq-panel-2 #1A2230
--mq-line    #273140    --mq-line-2  #354154
--mq-gold    #D6B56D    --mq-indigo  #5B6CFF
--mq-text-1  #F3F6FA    --mq-text-2  #C2CAD6    --mq-text-3  #8A97A8

/* 종이 (거울) */
--mq-paper   #FFFFFF    --mq-ivory   #F3F6FA
--mq-ink-1   #0E1116    --mq-ink-2   #354154    --mq-ink-3   #647286
--mq-gold-ink   #8C6C27 --mq-indigo-ink #4A5DFF
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
.mq-card--accent           border-left 2px 금색     (브리핑에만 있는 장치. 제품 화면은 문서 결)
.mq-badge                  높이 22 · pill · 12px · weight 600
.mq-btn--primary           금색 배경 + #1A1206 글자 · 높이 40 · radius 4
```

간격은 **8pt 그리드**(4·8·12·16·24·32·48·64·96·128), 모서리는 0·4·8·12·pill,
이징은 `cubic-bezier(0.2, 0.7, 0.2, 1)` 입니다(앱의 `0.16,1,0.3,1` 과 다릅니다).

### 종이 위 글자색: 금색을 «장식» 과 «글자» 로 나눕니다

이 팔레트는 **dark-first** 입니다. 어두운 바탕용으로 고른 색을 종이에 그대로 쓰면 미달합니다.
`ink-3` 은 캡션 · meta · 표 셀이고, `gold` 는 eyebrow 라벨 · 문서번호 · 섹션 번호의 글자색이라 문서마다 수십 번 쓰입니다.
12px 대문자 금색 라벨이 흰 종이에서 1.96:1 이면 사실상 안 읽힙니다.

| 토큰 | 어두운 판 값 | 흰 종이 | 아이보리 | 종이 위 글자 값 | 흰 종이 / 아이보리 |
|---|---|---:|---:|---|---:|
| `ink-1` | `#0E1116` | 18.91 | 17.45 | (같음) | |
| `ink-2` | `#354154` | 10.32 | 9.52 | (같음) | |
| **`ink-3`** | `#8A97A8` | **2.97** | **2.74** | **`#647286`** | 4.89 / 4.51 |
| **`gold`(글자)** | `#D6B56D` | **1.96** | **1.81** | **`#8C6C27`** | 4.90 / 4.52 |
| **`indigo`** | `#5B6CFF` | **4.17** | **3.85** | **`#4A5DFF`** | 4.88 / 4.50 |

```python
GOLD     = '#D6B56D'   # 브랜드 금색. 장식 전용: 선 · 면 · 표지 워터마크
GOLD_INK = '#8C6C27'   # 종이 위 «글자» 용 (4.52)
```

장식(선 · 면 · opacity 0.05 워터마크)은 대비 규칙 밖이라 브랜드 금색을 지키고, 뜻을 전달하는 글자에만 어두운 금색을 씁니다.
표 안의 흐름 화살표(`→`)도 «뜻을 전달하므로» 글자 쪽입니다. 색상 · 채도는 그대로 두고 명도만 옮겼습니다. AA 를 통과하는 가장 작은 변경입니다.

> 🔑 **어두운 바탕용으로 고른 색을 종이에 그대로 쓰지 않습니다.**
> 앱도 같은 문제를 라이트 팔레트를 따로 두어 풀었습니다(샴페인 `#b8935a` → `#8a6838`).
> `GOLD_INK` 가 그 값과 거의 같은 자리에 오는 것은 우연이 아닙니다.

`tools/extract-brief.mjs` 는 종이 위 글자색(흰 종이 · 아이보리 중 낮은 쪽)이 4.5 에 못 미치면 산출물을 쓰지 않고 실패합니다.

### 글꼴: 폴백을 우리가 정합니다

PDF 는 Word 가 아니라 **HTML 을 Chrome 으로 인쇄**해 만들고, 웹폰트(Noto Sans KR)가 그대로 실립니다.
문제는 폴백입니다. 글꼴 지정이 `'Noto Sans KR', sans-serif` 이면 Noto Sans KR 에 없는 글리프(일부 기호)가 `sans-serif` 로 떨어지고,
Windows 에서 그것이 **굴림체(GulimChe)** 가 됩니다. 굴림은 옛 비트맵 느낌이라 이 문서 톤과 맞지 않습니다.
그래서 «무엇으로 떨어질지» 를 명시합니다.

```python
SANS = "'Noto Sans KR','Malgun Gothic',sans-serif"
MONO = "'JetBrains Mono',Consolas,monospace"
```

PDF 에 실린 글꼴은 `/BaseFont` 만 보면 안 보입니다. 압축된 객체 스트림 안의 `/FontName` 까지 풀어 봐야 합니다.

**DOCX** 는 `templates/tools/html2docx.js` 가 만들고, 이 변환기는 CSS 의 `font-family` 를 읽지 않고 자기 상수를 씁니다.

- DOCX 글꼴은 **맑은 고딕(Malgun Gothic)** 입니다(오너 결정 2026-09-18). Noto Sans KR 은 받는 PC 에 없으면 Word 가 임의로 대체합니다.
- 글꼴은 **run 마다 직접** 적습니다. `styles.xml` 의 docDefaults 에만 적으면 Word 가 그것을 따르지 않고 자기 기본값(Calibri)을 씁니다.
  파일이 조금 커지지만 «무엇으로 그려질지» 가 확실해집니다.
- mono 는 Consolas 입니다. JetBrains Mono 가 없는 PC 에서 Word 가 무엇으로 대체할지 알 수 없기 때문입니다.

> 🔑 **대외 발송은 PDF 로 합니다.** DOCX 는 폴백 «체인» 을 못 쓰고 이름 하나만 적히므로,
> 받는 쪽에 그 글꼴이 없으면 Word 가 임의로 대체합니다. PDF 는 글꼴을 파일 안에 심습니다.

### 옮겨 쓸 때

원본은 MedQraft Docs 저장소 `templates/assets/colors_and_type.css` 입니다. `tools/refresh-source.mjs` 가 그 «커밋된» 내용을
`source/brief/` 로 받아 오고, `tools/extract-brief.mjs` 가 `dist/q-design.brief.json` 으로 뽑습니다.

```bash
node tools/extract-brief.mjs
```

Q-Design 쪽은 «읽기» 방향입니다. 값을 고칠 일이 생기면 MedQraft Docs 쪽 원본을 고치고 다시 뽑습니다.

---

## 대외 종이 문서 양식 v8 (MedQraft · 밝은 판)

대외 **종이** 문서의 판형 · 글자 · 표 · 쪽 넘김 · 표지 규격입니다. 견적서 · 계약서 · 업무범위 · 검토보고서 ·
설계개발계획처럼 고객에게 PDF 나 DOCX 로 나가는 문서가 이것을 따릅니다.

> 이 절의 표와 숫자는 사람이 적지 않습니다. `node tools/extract-mqdoc.mjs` 가 규격서에서 뽑아
> `<!-- 생성:… -->` 사이에 직접 씁니다. 값을 고치려면 규격서를 고치고 도구를 다시 돌립니다.

### 어디서 오는가

```
오너가 준 「MedQraft 문서 양식_rev.8.zip」 (규격서 · 예시 · 로고)
  → MedQraft Docs 저장소 templates/spec-v8/   손대지 않은 원본을 커밋
  → tools/refresh-source.mjs                   그 «커밋된» 내용을 source/brief/v8/ 로 받아 옴
  → tools/extract-mqdoc.mjs                    규격서의 표를 읽어 토큰을 뽑고 검증
  → dist/q-design.mqdoc.json · dist/q-design.mqdoc.css · 이 절의 생성 구간
```

<!-- 생성:mqdoc-원본 -->
규격서 SP-MQ-2026-001 rev.02 · 2026.08.28 · 회사 문서 양식 규격 v8. 표 7개를 읽었습니다.
<!-- /생성:mqdoc-원본 -->

견본은 `source/brief/v8/` 의 두 HTML(규격서 · 예시)을 브라우저로 그대로 열면 됩니다. 글꼴과 그림이 한 파일에
묶여 있습니다. 로고는 `source/brief/v8/logo/` 에 있습니다.

### 색

도구가 흰 종이 위 대비를 계산하고, 글자색이 4.5:1 에 못 미치면 실패합니다.

<!-- 생성:mqdoc-색 -->
| 역할 | 값 | 흰 종이 대비 |
|---|---|---:|
| 먹 | `#0E1116` | 18.91:1 |
| 본문 | `#1B2230` | 15.93:1 |
| 소절 | `#354154` | 10.32:1 |
| 뮤트 | `#647286` | 4.89:1 |
| 금 글자 | `#8C6C27` | 4.9:1 |
| 선 | `#E2E6EC` | 글자 아님 |
| 차트 기본막대 | `#CFC7B6` | 글자 아님 |
| 차트 강조 | `#8C6C27` | 글자 아님 |
| 차트 경고 | `#B3403A` | 글자 아님 |
| 차트 격자선 | `#F1EFE9` | 글자 아님 |
| 차트 기준선 | `#CFC9BB` | 글자 아님 |
<!-- /생성:mqdoc-색 -->

### 규격서의 표

규격서 원문은 긴 줄표를 씁니다. 이 문서로 옮기면서 칸 전체가 줄표인 자리는 「없음」, 문장 안의 줄표는 「 · 」 로
바꿨습니다(원본 파일은 그대로입니다). 장 번호 칸의 줄표 규칙을 적은 문장만은 「긴 줄표(U+2014)」 라는 글로 풀어 적습니다.

<!-- 생성:mqdoc-표1 -->
**표 1 · 판형과 여백**

| 항목 | 값 | 이유 | Word 값 |
|---|---|---|---|
| 판형 | A4 210 × 297 mm | 국내 제출·사내 보관 모두 A4 | pgSz 11906×16838 |
| 좌·우 여백 | 22.0 mm | 10 pt 기준 한 줄 45 ~ 48자. 본문 폭 166 mm | left/right 1247 |
| 위 여백 | 22.0 mm | 머리말 아래 공백 6 mm 고정 | top 1247 · header 794 |
| 아래 여백 | 22.0 mm + 13.0 mm | 본문 여백 22 mm 아래에 쪽번호 띠 13 mm를 따로 둔다. 이 띠가 없으면 쪽번호가 인쇄 영역 밖으로 잘린다 | bottom 1247 · footer 737 |
| 본문 폭 | 166 mm | 표·그림도 이 폭에 맞춘다 | tblW 9412 |
| 본문 높이 | 약 231 mm | 한 덩어리로 묶을 수 있는 최대 높이. 이를 넘는 표는 묶지 아니하고 나눈다 | 없음 |
<!-- /생성:mqdoc-표1 -->

<!-- 생성:mqdoc-표2 -->
**표 2 · 타입 스케일**

| 역할 | 크기 | 굵기 | 줄간격 | 색 · 앞뒤 간격 | w:sz |
|---|---|---|---|---|---|
| 표지 제목 | 30 pt | 700 | 1.24 | #0E1116 · 자간 −0.02em | 60 |
| 아이브로우 | 8 pt | 700 | 1.0 | #8C6C27 · 자간 0.30em · 대문자 | 16 · spacing 48 |
| 장 제목 | 15 pt | 700 | 1.3 | #0E1116 · 위 1.2 pt 먹선 + 3.5 mm · 번호는 왼쪽 14 mm 열 | 30 |
| 장 번호 | 10 pt | 600 mono | 없음 | #8C6C27 · 부록과 면책은 번호 대신 긴 줄표(U+2014) | 20 |
| 절 제목 (1.1) | 11.5 pt | 700 | 1.35 | #0E1116 · 위 11 mm 아래 2.5 mm · 절 사이를 한 줄 띄운다 | 23 |
| 소절 제목 (1.2.1) | 10 pt | 700 | 1.4 | #354154 · 위 8.5 mm · 본문 먹색과 구분해 위계를 셋으로 | 20 |
| 본문 | 10 pt | 400 | 1.62 | #1B2230 · 문단 사이 3 mm · 들여쓰기 없음 | 20 · line 340 |
| 표 본문 | 8.5 pt | 400 | 1.45 | #1B2230 · 첫 열만 500. 압축 시 8 pt / 1.4 | 17 |
| 캡션 · 주석 | 7.5 pt | 400 | 1.6 | #647286 · ※ 로 시작 | 15 |
| 머리말 · 꼬리말 | 7.5 pt | 400 | 1.3 | #647286 · 쪽번호는 8 pt 모노 | 15 |
<!-- /생성:mqdoc-표2 -->

<!-- 생성:mqdoc-표3 -->
**표 3 · 표**

| 요소 | 규격 | Word 값 |
|---|---|---|
| 표 번호 | 골드 모노 「표 N」 7.5 pt. 표와 분리되지 아니하도록 <caption> 으로 표 안에 넣는다. 문서 안에서 1번부터 연속으로 매기며, 장이 바뀌어도 번호는 이어진다 | keepNext |
| 머리행 | 8 pt 700, 위 1.2 pt 먹선 · 아래 0.75 pt 먹선. 바탕색 없음 | tblHeader · sz 10 / 6 |
| 행 구분선 | 0.4 pt #E2E6EC 가로선만. 세로선·격자 없음. 마지막 행 아래는 0.75 pt 먹선으로 닫는다 | sz 3 / 6 |
| 셀 여백 | 상하 1.9 mm · 좌우 2.5 mm (첫 열 왼쪽 0, 끝 열 오른쪽 0 · 본문 왼쪽선에 글자를 맞춘다) | 108 / 142 |
| 열 너비 | 고정. 첫 행의 셀에만 너비를 지정하고 나머지 행은 그 값을 따른다. 라벨 열 18 ~ 34 mm, 판정·비고 열 30 ~ 52 mm. 자동 너비 금지 | tblLayout fixed |
| 셀 줄바꿈 | 모든 셀에 overflow-wrap: anywhere . URL·DOI 같은 긴 문자열이 열 너비를 넘어 옆 칸 글자와 겹치는 것을 막는다 | 없음 |
| 정렬 | 글자 왼쪽 · 위. 숫자·연도·금액은 오른쪽 + 모노(자릿수 맞춤) | jc right |
| 주석 | 표 아래 1.8 mm, 7.5 pt #647286, ※ 로 시작. 표 안에 넣지 아니한다 | sz 15 |
<!-- /생성:mqdoc-표3 -->

<!-- 생성:mqdoc-표4 -->
**표 4 · 쪽 넘김**

| 상황 | 규칙 | Word 값 |
|---|---|---|
| 장 시작 | 새 쪽에서 시작한다. 장 제목 아래에 절 목록 한 줄(8 pt #647286)을 둔다 | pageBreakBefore |
| 절 제목 | 제목과 뒤따르는 본문 두 문단을 한 덩어리로 묶는다. 제목만 남은 쪽 끝을 금지 | keepNext · widowControl |
| 제목 + 표 | 장·절 제목 바로 뒤에 오는 표가 20행 이하이면 제목·도입문·표를 한 덩어리로 묶어 같은 쪽에 놓는다. 장 뒤는 위 8 mm, 절 뒤는 위 7 mm를 띄운다 | keepNext |
| 큰 표 압축 | 묶인 덩어리 안의 표가 16행 이상이면 본문 8 pt · 줄간격 1.4 · 셀 여백 상하 1.2 mm로 압축하여 한 쪽에 넣는다. 압축해도 231 mm를 넘으면 묶지 아니하고 나눈다 | sz 16 · 68 |
| 표 쪽 넘김 | 머리행은 쪽마다 반복한다. 한 행은 쪼개지 아니한다. 라벨과 머리행은 항상 붙어 다닌다 | tblHeader · cantSplit |
| 그림 | 그림·캡션·출처는 한 덩어리로 넘긴다. 쪽 끝 55 mm 미만이 남으면 다음 쪽으로 보낸다 | keepNext · keepLines |
| 목차 | 새 쪽에서 시작하고 제목·규칙선·표를 한 덩어리로 묶는다. 한 쪽에 들어가도록 행 여백을 1.5 mm로 줄인다 | pageBreakBefore |
<!-- /생성:mqdoc-표4 -->

<!-- 생성:mqdoc-표5 -->
**표 5 · 그림과 차트**

| 요소 | 규격 |
|---|---|
| 작도 방식 | 차트는 이미지가 아니라 문서 안에서 벡터로 그린다. 확대·인쇄에서 깨지지 아니하고 글자가 본문 글꼴을 따른다 |
| 폭과 여백 | 본문 폭 166 mm에 맞추고 위 4 mm 아래 2 mm를 띄운다. 테두리 상자는 두지 아니한다 |
| 차트 색 | 기본 막대 #CFC7B6, 강조 한 계열만 #8C6C27, 경고 #B3403A. 격자선 0.4 pt #F1EFE9, 기준선 #CFC9BB |
| 차트 글자 | 축 눈금·범례·데이터 라벨 모두 최소 15 px(본문 환산 약 8 pt 이상). 수치는 모노, 단위는 왼쪽 위에 한 줄로 |
| 캡션 | 그림 아래 2.2 mm. 골드 모노 「그림 N」 + 먹색 제목 8.5 pt 700, 다음 줄에 출처 7.5 pt |
<!-- /생성:mqdoc-표5 -->

<!-- 생성:mqdoc-표지머리말 -->
**06 · 표지 · 머리말 · 꼬리말 · 워터마크**

- **6.1 표지** 위에서부터 26 mm 공백 → 아이브로우·제목·부제 → 1.2 pt 먹선 → TO 블록과 문서정보 표(2단) → 아래 여백에 발신 블록. 표지에는 머리말·꼬리말·쪽번호를 넣지 아니한다. 문서정보 표의 항목은 문서번호 · 개정 · 준용 양식 · 상태 · 작성일 · 상위 문서 순이며, 마지막 행 아래를 0.75 pt 먹선으로 닫는다.
- **6.2 머리말** 왼쪽에 로고(높이 3.2 mm) + 2.5 mm 간격 + Q-Atelier · 문서명, 오른쪽에 CONFIDENTIAL(6 pt, 자간 0.3em) + 3 mm + 문서번호(모노 7.5 pt). 아래 0.5 pt #E2E6EC 선, 선과 본문 사이 6 mm. 머리말 바깥 상자에는 position 을 지정하지 아니한다 · 인쇄 시 머리말이 쪽 폭을 잡지 못하고 어긋난다.
- **6.3 꼬리말과 쪽번호** 꼬리말은 왼쪽에 회사명, 오른쪽에 문서번호 · rev만 둔다. 한 줄 결론은 꼬리말에 넣지 아니하고 문서 끝에 ◆ 밴드로 한 번만 둔다. 쪽번호는 꼬리말이 아니라 인쇄 엔진의 쪽 하단 여백에 「n / 전체」 형식으로 자동으로 찍는다(모노 8 pt #647286). 이 때문에 아래 여백에 13 mm의 쪽번호 띠를 따로 확보한다.
- **6.4 워터마크** 머리말 안에 높이 0의 상자를 두고 그 안에서 절대 위치로 배치한다. 오른쪽 끝에 맞추고 위에서 179 mm, 폭 105 mm, 불투명도 0.05. 인쇄 시에도 색이 빠지지 아니하도록 print-color-adjust: exact 를 지정한다. 표지에는 넣지 아니한다. 07
<!-- /생성:mqdoc-표지머리말 -->

<!-- 생성:mqdoc-표6 -->
**표 6 · 문서 번호 · 상태 · 표기**

| 항목 | 규칙 |
|---|---|
| 문서번호 | 종류-고객-연도-일련 (예 CR-IMH-2026-001). 종류는 QT 견적 · CT 계약 · SW 업무범위 · CR 검토보고서 · DP 설계개발계획 · DI 설계입력 · PL 개발계획 · RA 리스크검토 |
| 개정 번호 | 발행본은 rev.01로 통일한다. 내부 작업 판본의 번호는 최종본에 남기지 아니한다 |
| 개정 이력 | 외부 배포본에는 개정 이력 쪽을 두지 아니한다. 이력은 사내 대장에서 관리한다 |
| 상태 | 발행 / 초안 둘 중 하나. 외부로 내보내는 문서는 발행, 요건이 아직 충족되지 아니한 문서는 초안과 그 사유를 함께 적는다 |
| 문서 끝 | 부록 다음에 번호 없는 「면책」 장을 둔다. 장 번호 자리에는 긴 줄표(U+2014)를 찍는다 |
| 요구수준 | 의무 · 권고 · 허용으로 적는다. shall · should · may를 그대로 쓰지 아니하고, 대응 관계는 범례에 한 번만 밝힌다 |
| 강조 | 용어를 도드라지게 할 때에는 굵은 글씨가 아니라 "따옴표"를 쓴다. 굵은 글씨는 표 라벨과 결론 문장의 첫 구에만 쓴다 |
| 문체 | 평서형 종결(~한다 · ~아니한다). 번역투를 쓰지 아니한다 · 핵심 긴장, ~에 다름 아니다, ~라고 할 수 있다, ~함에 있어, 보여진다, 양날의 검 |
| 상호 참조 | 쪽번호가 아니라 절 번호(제4.2절)와 문서번호로 가리킨다. 다른 문서의 부록을 가리킬 때에는 문서번호를 함께 적는다 |
<!-- /생성:mqdoc-표6 -->

### 쓰는 법

HTML · 인쇄 경로는 CSS 변수를 씁니다. 색은 `--mqd-<역할>`, 글자는 `--mqd-font-<역할>` 입니다.

```css
@import 'q-design.mqdoc.css';
body { font: var(--mqd-font-body); font-family: var(--mqd-sans); color: var(--mqd-body); }
h3 { font: var(--mqd-font-section); color: var(--mqd-ink); }
.caption { font: var(--mqd-font-caption); color: var(--mqd-muted); }
```

DOCX 경로(회사 Word 변환기 `templates/mqhtml.py`)는 `dist/q-design.mqdoc.json` 의 `판형` · `색` · `글자` 를 읽습니다.
규격서 표 2 의 `w:sz` 는 half-point 입니다. 도구가 pt 와 w:sz 가 서로 맞는지(pt × 2)도 확인합니다.

### 회사 Word 변환기와의 차이

도구가 `templates/mqhtml.py` 의 상수(먹 · 본문 · 소절 제목 · 뮤트 · 선 · 금 글자 · 본문 폭)와 규격서 값을 대조합니다.
차이는 «알려진 차이» 목록에 사유와 함께 있어야 하고, 목록에 없는 차이가 생기거나 목록의 차이가 사라지면 도구가 실패합니다
(낡은 예외를 남겨 두지 않으려고).

<!-- 생성:mqdoc-변환기 -->
규격서와 변환기의 값이 모두 같습니다.
<!-- /생성:mqdoc-변환기 -->

### QMS 문서세트: v8 그대로 (2026-10-29 오너 「우리 회사의 문서는 하나의 문서 규격 디자인을 따라가는게 맞아」)

**QMS 문서세트(고객에게 파는 매뉴얼 · 절차서 · 부속서 · 기입 양식)** 는 v8 로 찍힙니다. 공용 렌더 틀(MedQraft Docs `ops/_template`)은
회사 운영 규정도 쓰므로 고치지 않고, 기본값이 꺼진 «프로필» 연결 고리로 QMS 문서세트에만 v8 덮개를 씌웁니다
(`ops/컨설팅산출물_QMS문서세트/_build/v8_profile.py` · `_build/v8/qms-v8.css`).

9-24 판에서 v8 과 일부러 다르게 두었던 것을 모두 v8 로 되돌렸습니다.

| 항목 | 9-24 판 | 지금(v8) |
|---|---|---|
| 장 시작 | 이어서 흐름 | 새 쪽(v8 표 4). 디자인 검사 W · T 는 다음 쪽이 장 머리면 빈 아래를 낭비로 보지 않습니다 |
| 표 열 너비 | 자동 · break-word | 고정(`v8_profile.fix_columns`) · anywhere |
| 머리말 모노 | Lucida Console | Consolas(뽑은 글의 하이픈 · 가운뎃점을 지킨 머리말용 판, `v8_fonts.mono_ensure`) |
| 기입 양식 | 격자선 · 칸 채움 · 작은 제목 | v8 표 3: 세로선 · 채움 없이 가로선만(덩어리 위 1.2 pt · 머리행 아래와 끝 0.75 pt · 줄 사이 0.4 pt), 첫 열 왼쪽 · 끝 열 오른쪽 여백 0, 절 제목 11.5 pt |
| 양식 PDF | Word 가 맑은 고딕으로 내보냄 · Word 머리말 | 맑은 고딕을 Noto Sans KR 로 바꾼 임시 사본을 Word 가 내보내고(`_build/v8_wordpdf.py`), 머리말 · 꼬리말 · 쪽번호 · 워터마크는 절차서와 같은 `v8_profile.stamp` 가 그립니다 |
| 목차 제목 | 15 pt | 17 pt(v8 예시) |

그대로 둔 것(QMS 통제 문서라서): 개정 이력 · 승인란(ISO 13485 4.2.4 문서 통제 구조)과 판 표기 rev.01(261026).
v8 도 Word 편집본은 맑은 고딕입니다(9-24 판 표에 «다르게 둔 것» 처럼 적었던 것은 잘못).

**Word 편집본의 줄 높이**: Word 의 맑은 고딕 «한 줄» 은 글꼴 높이(1.33 em)가 아니라 **1.73 em** 입니다(동아시아 글꼴에 행간을 더 얹음.
2026-10-29 Word 내보내기 실측). 그래서 PDF 의 본문 1.62 · 표 1.45 는 Word 에서 1.62 / 1.73 · 1.45 / 1.73 배로 겁니다
(`v8_docx.WORD_EM` · `formkit.WORD_EM`). 양식 PDF 용 Noto 는 Word 의 줄 높이 값(usWinAscent · usWinDescent)을 맑은 고딕 비율로 고쳐
심어서, Word 편집본과 PDF 의 줄 자리가 같습니다. 머리말 선 16 mm · 꼬리말 268 mm · 쪽번호 290 mm 도 Word 편집본에서 재어 맞췄습니다.

**🔴 워터마크가 가려진 까닭(2026-10-29 오너 지적)**: 도장(`v8_profile.stamp`)은 워터마크를 쪽의 «글 아래» 에 깝니다(v8 6.4 는 글 뒤).
그런데 공용 틀(`mqdoc.css`)의 `html,body{background:#fff}` 를 크롬이 쪽마다 본문 칸(22~188 × 22~262 mm)만 한 흰 면 두 장으로 그려,
그 아래 깔린 워터마크의 3/4 이 덮이고 오른쪽 · 아래 끝만 조각처럼 남았습니다. 양식은 Word 가 흰 면을 그리지 않아 멀쩡했습니다.
→ v8 덮개에서 배경을 칠하지 않습니다(종이가 이미 흰색). 디자인 감사 `audit_design.watermark_cover` 가 워터마크 «뒤에» 그린 칠한 면의
넓이를 재어 1/4 넘게 덮이면 V 로 잡습니다(그리는 순서는 `get_bboxlog`).
같은 흰 면이 본문 끝(262 mm)까지 깔려 있어서 «빈 쪽» 검사(W · T)도 모든 쪽을 꽉 찬 것으로 읽고 있었습니다. 걷어내자 드러난 빈 쪽은
두 가지였습니다. 목차 쪽(v8 대로 한 쪽에 따로 두므로 낭비가 아님 · 감사에서 뺌)과, 20행 이하라 제목과 통째로 묶은 «높은 표» 가
다음 쪽으로 넘어가 앞 쪽을 비운 것(QP-22 나라별 보고 기한: 79% 빔). 묶음은 이제 행 수와 함께 **어림 높이**(`v8_profile.table_mm`)로 가릅니다.
76 mm 넘는 덩어리는 제목 · 도입문 · 첫 두 줄만 붙이고 쪽에서 갈립니다(`KEEP_MAX_MM`, 머리행은 쪽마다 다시 찍힘).

**Word 편집본의 워터마크**: PDF 에만 있었습니다. 이제 머리말에 글 뒤로 띄운 고정 그림(쪽 기준 오른쪽 끝 · 위 179 mm · 폭 105 mm,
불투명도 0.05 를 구운 같은 그림)을 답니다(`v8_profile.word_watermark`). 양식 PDF 는 Word 머리말을 비운 사본으로 뽑고 도장이 다시 그리므로
두 겹이 되지 않습니다(두 겹이면 덮임 검사가 잡습니다).

QMS 문서세트에 더한 것(오너 결정 2026-09-24)

- **목차**: 절이 15개 이상인 문서에 표지 다음 새 쪽으로 둡니다(`v8_profile.toc_html`).
- **Word 편집본**: 절차서 · 매뉴얼을 PDF 와 같은 원고로 Word 로도 만듭니다(`_build/v8_docx.py`). 장 · 절 · 소절은 Word 의
  「제목 1 · 2 · 3」 스타일, 번호는 원고 글자 그대로, 글꼴은 맑은 고딕(받는 PC 에 없는 글꼴은 Word 가 바꿉니다). 같은 원고 해시를
  문서 속성에 새기고 판매판 생성기가 PDF 와 함께 대조합니다.
- **납품 안내**(DG-QMS-2026-001): 회사 변환기로 찍는 v8 문서입니다(`_build/make_guide.py`).

### 🔴 v8 글꼴을 PDF 에 심을 때의 함정 둘

1. 설치된 **가변 글꼴**(`NotoSansKR-VF.ttf`)을 크롬이 그대로 쓰면 PDF 에 **Type3**(글자마다 따로 그린 도형)로 심깁니다.
   PyMuPDF 로 같은 파일을 쓰면 **Thin** 굵기로 그려집니다. → 고정 굵기(400 · 500 · 700)를 fontTools 로 뽑아 씁니다.
2. 고정 굵기 원판을 PyMuPDF 로 심으면 공백이 U+00A0, 하이픈이 U+2011 로 **뽑힙니다**(같은 글자 모양을 쓰는 문자 중 뒤의 것).
   화면은 같지만 검색과 짝대기 검사가 조용히 깨집니다. → 머리말용 판에서 그 문자 연결을 지웁니다.

절차서 디자인 검사(`_build/audit_design.py` 의 V)가 둘 다 잡습니다.

### 오너 결정 (2026-09-24 「전체를 v8 이랑 맞춰줘」)

1. **회사 변환기를 v8 에 맞췄습니다.** MedQraft Docs `templates/mqhtml.py` 와 DOCX 변환기 `templates/tools/html2docx.js`.
   본문색 #1B2230 · 소절 #354154 · 본문 폭 166 mm · 장 번호 14 mm 열 · 「표 N」 캡션 · 바탕 없는 표 · 면책 장 ·
   표지에 머리말 없음 · 꼬리말 「회사 | 문서번호 · rev」 · 쪽번호 「n / 전체」(Word 는 필드, PDF 는 `Doc.to_pdf` 가 QMS 와 같은
   도장으로). 추출기가 변환기의 소절 제목색(`SUB`)까지 대조합니다.
   옛 생성기의 대외 문서는 다시 뽑으면 새 모양이 됩니다. 이미 나간 문서는 그대로입니다. 회사명은 v8 대로 「메드크래프트」(법인 전환 전).
2. **줄표: v8 대로 씁니다.** 부록 · 면책 장의 «장 번호 칸»(과 목차의 같은 칸)에만 긴 줄표(U+2014) 한 글자. 그 밖은 여전히 금지입니다.
   변환기는 그 글자를 코드포인트로 만들고 `data-slot="장번호"` 로 표시하며, 검사는 표시된 칸 한 글자만 빼고 전부 보고
   표시의 개수도 «번호 없는 장 + 면책» 만큼으로 묶습니다. 이 문서의 표에는 그 규칙이 「긴 줄표(U+2014)」 라는 글로 적힙니다
   (추출기 `clean` 이 규칙 문장의 줄표만 글로 풀고, 나머지 줄표는 가운뎃점으로 바꿉니다).

---

## 문서 결: 강조 · 결재 표시 (오너 결정 2026-09-27)

세 제품의 **강조 표시**를 한 벌로 묶는 규격입니다. 차림표 · 목록 정본([7장](07-screens.md))과 같은 성격이고, 설명이 아니라 강제입니다.

### 왜

오너 지적(2026-09-27): 「모든 컴포넌트에 왼쪽 강조 라인이 붙어 있는데… 클로드 특유의 디자인 형태라서 다른 디자인 형태를
고안하고 싶다. 지금 화면의 구조가 적절하지 않은 기분도 든다.」
그리고 원칙 하나: **「눈을 현혹하는 디자인보다 깔끔하게 눈에 잘 보이는 디자인」.**

상자 한쪽에 굵은 색 선을 긋는 강조(`borderLeft: 3px solid …`)는 오너 금지 목록의 «카드 한쪽의 굵은 컬러 보더» 입니다.
금지 목록과 걸러내기 도구가 서로 다른 목록을 보고 있으면 금지한 것이 그대로 남으므로, 이제 걸러내기 도구도 이 항목을 셉니다([9장](09-voice.md)).

대체의 근거는 오너가 정한 문서 기준(`D:/Claude/document-standards/STYLE_GUIDE.md`)입니다.

> 카드와 장식 상자는 상시 사용하지 않는다. 작은 강조문은 금색 라벨과 얇은 가로선 사이의
> 한두 문장으로 표현된다. 표는 진한 상단선 또는 머리행 아래 선, 연한 회색 행 구분선.

화면과 문서가 한 결이 됩니다.

### 정한 것

| 자리 | 쓰는 것 | 버리는 것 |
|---|---|---|
| 결재 화면(결재함 · 문서의 결재 관리 판) | **가로 결재 길**: 작성 → 검토 → 승인 한 줄. 지나온 칸은 옅은 금빛 원에 체크 · 서명 시각, 지금 차례는 금빛 겹원과 «지금», 남은 칸은 빈 원 | 카드 왼쪽 금색 선 · 종류별 큰 아이콘 · 카드 속 파일 상자 |
| 상태가 있는 항목 목록 | **괘선 목록**: 상자 없이 행 사이 가는 선, 상태는 오른쪽 **글자**(상태 색) | 항목 카드의 왼쪽 색 선 |
| 안내 · 주의 · 경고 | **강조문**: 금색(주의는 호박색 · 위험은 붉은색) 라벨 한 단어 + 한두 문장, 위아래 가는 가로선 사이 | 왼쪽 색 선 상자 · 큰 아이콘 |
| 지표 | **요약표**: 진한 윗선, 칸 사이 세로 가는 선, 숫자는 고정폭 글꼴 | 지표 카드의 왼쪽 색 선 |
| 열이 많은 목록 | **장부 표**: 열 머리 + 진한 윗선 + 머리 아래 선 + 연한 행 선, 합계는 겹밑줄, 세로 테두리 없음 | 행 왼쪽 색 선 |
| 절(구획) 머리 | 금색 두 자리 번호(고정폭) + 굵은 제목 + 먹색 선 | 머리 위 작은 대문자 라벨(eyebrow) |
| 선택된 메뉴 | 굵은 글자 + 글자 밑 짧은 금색 선(16px) | 메뉴 왼쪽 색 막대 |

**읽힘 규칙**(원칙 「깔끔하게 눈에 잘 보이게」):

- 상태는 **색만으로 말하지 않습니다**. 늘 글자(«지연 3일» · «오늘» · «예정»)가 같이 갑니다.
- 상태 · 이름 글자는 12px 이상. 흐린 글자는 대비 4.5:1 을 넘는 토큰만(`T.subtle` · `T.muted`) 씁니다.
- 금빛과 가는 선은 아껴 씁니다. 한 화면에 금빛 강조가 여럿이면 그중 하나만 남깁니다.

### 부품 (원본은 Q-Atelier)

부품 원본은 Q-Atelier 에 있고, `node tools/extract-all.mjs --sync` 가 정본 CSS · 사본을 세 제품에
내려보냅니다([Q-Design 흐름](../README.md)). 강조 표시를 맡는 부품은 아래와 같습니다.

| 부품(Q-Atelier) | 문서 결에서 하는 일 |
|---|---|
| `components/ApprovalRoute.tsx` | 가로 결재 길. 결재함과 문서의 결재 관리 판 두 벌(R&D `DocumentApprovalPanel` · 변경평가 `AssessmentDocApprovalPanel`) |
| `lib/approvals/route-view.ts` | 결재선 + 서명 → 길의 칸(«지금» 은 my-turn 과 같은 규칙) |
| `lib/design/components.tsx` `Bx` | `accent` 는 테두리 전체를 옅은 상태 색(55%)으로 칠합니다 |
| `InfoBox` | 위아래 가는 가로선 사이의 강조문 · 13px |
| `Alert` | 첫 줄에 종류 말(오류 · 주의 · 완료 · 안내). 면과 테두리는 정본 `qd-notice` 한 벌을 받습니다([6장](06-components.md)) |
| `KPI` | 카드에 왼쪽 선이 없습니다. 도움말 풍선도 테두리 전체로 그립니다 |
| `EntityRow` | 괘선 줄: 행 아래 가는 선 · 누르면 옅은 바탕(`qa-row-clickable`) |
| 사이드바 `NavLink` | 굵은 글자(600) + 글자 밑 16px 금색 선. 막대가 쓰던 3px 는 왼쪽 여백으로 돌립니다 |

### 정본 CSS (받는 제품이 쓰는 것)

`tools/extract-nav.mjs` · `tools/extract-list.mjs` 가 위 부품을 읽어 같은 모양을 냅니다. 자세한 값은 [7장](07-screens.md) 차림표 · 목록 정본에 있습니다.

- `.qd-nav-item`: 왼쪽 금막대 대신 `padding-left` 17px, 선택은 굵은 글자와 이름표의 `::after` 밑줄(16 × 1.5px, 한 번 펼쳐짐).
  이름표는 말줄임 때문에 넘친 것을 자르므로 밑줄 자리를 아래 안쪽 여백으로 만들고 같은 만큼 바깥 여백을 줄입니다.
- `.qd-row`: 괘선 줄(행 아래 가는 선 · 모서리 없음 · 떠오름 없음 · 줄 사이 띄움 없음 · 누를 수 있는 줄만 옅은 바탕). 안쪽 여백 `14px 6px`.
- `.qd-panel--accent · ok · warn · danger`: 왼쪽 3px 대신 테두리 전체를 옅은 상태 색(원본 Bx 와 같은 55%).
  🔴 주의(호박색)와 금은 색차가 작아(ΔE76 10.37) 색만으로 갈리지 않습니다. 판 안의 **글자**(«주의» · «막힘» 같은 첫 낱말)가 가릅니다.
- `.qd-state-error`(못 읽은 자리): 왼쪽 선을 쓰지 않습니다. 면과 테두리는 정본 notice 표면을 받습니다.

### 지표 띠 · 표 상자 · 빈 칸은 장부형 (오너 결정 2026-10-23 «B»)

10-10 «섬 걷기 · 장부형» 은 현황 개요(`.qd-workspace--overview`)에만 닿아, 다른 화면의 지표 칸 · 표 상자 · 빈 칸은
떠 있는 상자(면 + 네 변 선 + 둥근 모서리)로 남아 있었습니다. 오너가 카르네 경영 현황에서 «섬» 을 보고 지적했고,
지금 · A(지표 띠만) · B(지표 띠 + 판) 세 그림 가운데 **B** 를 골랐습니다. 이제 정본 기본값입니다.

| 자리 | 모양 | 원본(Q-Atelier) | 정본 CSS |
|---|---|---|---|
| 지표 띠 | 면 · 모서리 없음, 칸마다 **아래 괘선 하나** | `KPI` → `Bx ledger` + 아래 선만 | `.qd-kpi` |
| 표 상자 | 면 · 옆 선 · 모서리 없음, **위아래 괘선** | 표를 감싼 `Bx` 에 `ledger` | `.qd-panel` 이 표 · 빈 칸을 바로 담으면(`:has`), `.qd-panel.qd-table-scroll`, `.qd-panel--ledger` |
| 빈 칸 | 위와 같음. 판 안이면 제 선을 내려놓음(겹줄 방지) | `EmptyState` → `Bx ledger` | `.qd-empty` · `.qd-panel > .qd-empty` |

- **글 · 입력 · 경고를 담은 판은 그대로 판**입니다. 카르네는 서식 · 잠금 창 · 경고 상자에도 `.qd-panel` 을 써서,
  기본값을 통째로 바꾸면 그쪽까지 줄만 남습니다. 그래서 «표나 빈 칸을 바로 담은 판» 만 장부형으로 가립니다.
  짜임이 달라 판별이 안 되는 자리는 `.qd-panel--ledger` 를 직접 겁니다.
- 면이 없으니 표의 따라오는 머리글 · 오른쪽 고정 칸이 덮을 바탕은 **화면 바탕**입니다. 장부형 판이 `--qd-table-fill` 을
  화면 바탕(`--qd-bg`)으로 주고, 정본 머리글(`.qd-table--sticky`) · 원본 `DataTable` · 아틀리에 첫 칸 고정 · 카르네 › 칸이 그 값을 읽습니다.
  안 읽으면 판 바탕(surface)이 흰 띠로 떠 보입니다(라이트에서 뚜렷함).
- 개요 작업대의 덮어쓰기(`patterns/workspace.css`)에는 개요만의 여백 · 글자 크기만 남았습니다.
- 생성기가 원본의 장부형 갈래(`Bx` 의 면 없음 · 위아래 선 · 모서리 0 · 표 밑바탕, `KPI` 의 아래 선 하나, `EmptyState` 의 `ledger`)를
  못 찾으면 멈춥니다(`extract-list.mjs` · `extract-screen.mjs`).
- 이때 범위 밖에 두었던 일반 카드 · 구역 카드는 같은 날 «3» 으로 뒤따랐습니다(아래 절).

### 일반 카드 · 구역 카드는 위 괘선 하나 (오너 결정 2026-10-23 «3»)

«B» 뒤에도 글 · 입력을 담은 카드(아틀리에 `SectionCard` · 일반 `Bx`, 메종 `qd-card` · 손으로 그린 `bg-card` 상자,
카르네 글 판)는 상자로 남아 있었습니다. 지금 · 2(위아래 괘선) · 3(위 괘선만) 그림 가운데 오너가 **3** 을 골랐습니다.
이제 정본 기본값입니다.

| 자리 | 모양 | 원본(Q-Atelier) | 정본 CSS |
|---|---|---|---|
| 일반 카드 · 구역 카드 · 글 판 | 면 · 옆 선 · 아랫선 · 모서리 없음, **위 괘선 하나** | `Bx` 의 보통 갈래 → `RULE_CARD`(`Card` · `Panel` · `SectionCard` 가 모두 거침), 화면이 손으로 그린 카드도 `...RULE_CARD` | `.qd-card` · `.qd-panel` 기본값 |
| 작업대 구역(대표 홈 위젯 · 번호 구역) | 상자 없이 **위 괘선 하나**(밝은 테 색) · 괘선과 제목 사이 24 · 제목 아래 괘선 없음 (2026-10-27 오너 결정 «A») | `qd-work-sections` 를 쓰는 화면 | `.qd-workspace .qd-work-section` (`patterns/workspace.css`) |
| 표 상자 · 빈 칸 · 지표 띠 | «B» 그대로(위아래 괘선 · 아래 괘선) | 위 절 | 위 절 |

상자로 남는 자리는 **변수 넷**으로 정합니다(`patterns/components.css`): `--qd-card-face`(면) · `--qd-card-rule`(선 굵기) ·
`--qd-card-radius`(모서리) · `--qd-card-fill`(표 밑바탕). 카드 · 판은 이 변수를 읽고, 없으면 장부형 값으로 떨어집니다.
변수는 선언한 자리에서 값이 정해져 아래로 물려 내려가므로, 상자 맥락 안의 카드는 저절로 상자입니다.

- **떠 있는 층**: `dialog` · `[role=dialog|alertdialog|menu|listbox|tooltip]` · Radix 말풍선 감싸개 · `.qd-dialog-content` · `.qd-drawer-content` · `.qd-popover` · `.qd-tooltip`.
  창 · 메뉴 안의 카드는 면이 있어야 창 면과 섞이지 않습니다.
- **고른 칸**: `aria-current` · `aria-pressed=true` · `aria-selected=true` 인 카드 · 판. 면과 네 변으로 고른 것을 알립니다.
- **상태 판**: `.qd-panel--accent` · `--ok` · `--warn` · `--danger`. 테두리 색이 뜻을 거듭니다.
- **직접 거는 상자**: `.qd-card--box` · `.qd-panel--box`(아틀리에는 `<Bx box>`). 카르네는 유틸리티로 색을 입힌 경고 · 확인 판
  (`bg-warn-bg` 처럼)과 앱 설치 안내에 겁니다. 정본 판이 층 안(components)이라 색 유틸리티가 이기지만, 선 굵기 · 모서리는
  정본이 주므로 상자 표시를 함께 걸어야 네 변이 섭니다.
- 아틀리에 원본에서 상자로 남는 것: 상태 색 · 장부형 · `box` 갈래, 그리고 `style` 이 면(surface 가 아닌) · 테두리 색 ·
  위치(fixed · sticky) · 그림자를 따로 주는 카드(`isPlainCard`). 들어간 면(surface2 · bg) · 단추 · 글자 칸 · 그림도 그대로입니다.
- 손이 얹히면: 아틀리에 `lift` 카드는 뜨지 않고 면이 한 단계 밝아집니다(`.qa-card-lift[data-card='rule']:hover` 가
  `--qd-card-face` 를 surface2 로). 카르네 `card-lift` · 메종 `hover:border-*` 는 면 · 윗선 색으로 알립니다.
- 카르네 현장 화면(`.touch`)이 판 모서리를 다시 적던 사본 줄을 걷었습니다. 남겨 두면 위 괘선 판까지 둥글어집니다.
- 그대로 둔 것: 메종 단추 · 코드 칸 · 따라오는 띠 · 출하 인쇄 지면, 점선 자리 · 선택 칩 · 현장 타일, 인쇄 서식.
- 생성기가 원본 `RULE_CARD` 의 네 값(면 · 위 괘선 · 모서리 · 표 밑바탕)과 `Bx` 의 갈래 조건을 못 찾으면 멈춥니다(`extract-list.mjs`).

### 되돌아오지 않게

- Q-Atelier `lib/design/no-side-accent.test.ts`: 굵기 2px 이상 옆 색 선(`borderLeft` · `borderRight` · CSS `border-left` · `border-right`)을 셉니다.
  기준은 **0** 이고, 새로 쓰면 계약이 막습니다. 1px 옆 선은 나무 줄 · 칸 구분 같은 구조선일 수 있어 세지 않습니다.
- 걸러내기 도구 `tools/screen-ai-cliches.mjs` 에 «옆 색 선» 항목이 있습니다(같은 규칙 · 주석 줄 제외, [9장](09-voice.md)).
- 정본 생성기가 원본 부품에 왼쪽 선이 다시 생기면 멈춥니다(`extract-list.mjs` 가 Bx · Alert 구역에서 `borderLeft` 를 찾으면 실패).
- 차림표에서 걷은 금점(`qd-nav-dot`)은 Q-Maison 계약 `tests/unit/q-design-sync.test.ts` 가 마크업에 다시 생기면 막습니다.

### 보여 주고 물린 시안 (다시 내밀지 말 것)

움직이는 시안으로 네 차례 골랐습니다. 오너는 매번 «다른 디자인 더» 로 넓혔고,
꾸밈 하나를 바꾸는 안보다 **화면을 세우는 방식이 다른 안**에 반응했습니다.

- 카드 꾸밈: 문서 머리띠 + 결재 도장 · 선 없이 면 · 모서리 재단 표시
- 결재함 세우기: 결재란 서류 · 목록과 아래 시트 · 한 문장 조판 (가로 결재 길만 채택)
- 강조 체계: 마름모 표식 · 책갈피 리본 · 면 색조 · 인주 도장 · 선의 모양(실선 · 점선 · 겹선) · 기한 실
- 문서 결 갈래: 목차 결(점선 잇기) · 여백 주석 (문서 결 기본 + 장부 결만 채택)

---

## 다른 결을 쓰는 곳: 전문가 포털

같은 제품 안에 있지만 **다른 디자인 언어**를 쓰는 영역입니다.
외부 전문가(자문위원)가 들어오는 포털이라, 업무 도구가 아니라 «초대장» 처럼 보여야 합니다.
앱은 정밀한 작업대이고, 포털은 서신입니다.

정본: `patterns/foundation/atelier.css` 의 `.expert-portal-root` 구역입니다. `node tools/build-foundation.mjs` 가
`dist/q-design.foundation.atelier.css` 로 묶고, 내보내기가 Q-Atelier `app/q-design.foundation.css` 로 보냅니다.
Q-Atelier 의 `app/experts/expert-theme.css` 에는 그쪽을 가리키는 한 줄만 있습니다.

### 무엇이 다른가

| | 메인 앱 | 전문가 포털 |
|---|---|---|
| 모서리 | **10px** | **10px**. 앱과 같습니다(오너 결정 2026-09-14 「전문가 포털도 굴려줘 · 통일」). 배지도 같은 값을 받습니다 |
| 헤딩 글꼴 | Pretendard | **Cormorant Garamond** (영문) |
| 입력 | 상자 (테두리 4면) | **밑줄만** |
| 금색 | 공용 강조색 `--qd-accent` | 같은 값(`--champagne: var(--qd-accent)`) |
| 경계선 | 무채색 | **금빛 반투명** (금색 12% · 강한 선 28%) |
| 배경 | 단색 | 금빛 워시 + **필름 그레인** + 비네트 |
| 크기 사다리 | 값보존 사다리 `FS`([3장](03-typography.md)) | **역할 기반(7칸)** |
| 라틴 라벨 자간 | 0.08em (모노 라벨) | 0.3em ~ 0.4em |
| 이징 | `cubic-bezier(0.16, 1, 0.3, 1)` | `cubic-bezier(0.22, 1, 0.36, 1)` |

같은 브랜드인데 «격» 이 다릅니다. 색 값은 패밀리 토큰을 가리키고, 다른 것은 장치(글꼴 · 입력 · 선 · 배경 · 사다리)입니다.

### 포털 이름은 공용 토큰을 가리킵니다

```css
.expert-portal-root {
  --ink:      var(--qd-bg);                          /* 배경 */
  --obsidian: var(--qd-surface2, var(--qd-surface));
  --velvet:   var(--qd-surface);                     /* 카드 */
  --hairline:        color-mix(in srgb, var(--champagne) 12%, transparent);  /* 실선이 금빛입니다 */
  --hairline-strong: color-mix(in srgb, var(--champagne) 28%, transparent);

  --champagne: var(--qd-accent);   /* -soft · -bright 도 같은 값 */
  --cream:       var(--qd-text);
  --cream-muted: var(--qd-subtle);
  --mist:    var(--qd-muted);      /* 라벨 · 섹션제목 · meta */
  --whisper: var(--qd-muted);      /* 힌트 · 부가정보 */

  --burgundy: var(--qd-danger);    /* 위험 · 경고 패밀리 이름. -bright · -soft · -deep 도 같은 값 */
  --status-verified: var(--qd-ok);   --status-pending: var(--qd-warn);
  --status-progress: var(--qd-info); --status-rejected: var(--qd-danger);
  --risk-critical: var(--qd-danger); --risk-high: var(--qd-warn); --risk-medium: var(--qd-warn);
  --risk-low: var(--qd-ok);          --risk-unknown: var(--qd-muted);
}
```

**경계선이 금빛 반투명**인 것이 결정적입니다. 무채색 실선은 «칸막이» 로 보이고, 금빛 실선은 «장정(裝幀)» 으로 보입니다.
밝은 판(`html[data-theme='light']`)에서는 금색 18% · 36% 입니다.

### 🔑 공용 부품이 포털 말투를 쓰게 하는 법

**이 대목이 이 절에서 가장 옮길 가치가 있습니다.**

포털 안에서 메인 앱 공용 부품(버튼 · 카드 · 입력)을 그대로 쓰는데, 그것들이 앱 팔레트로 그려지면
**한 화면에 금색이 두 가지**가 되고 경계선 성격도 갈립니다. 부품을 포크해 사본을 만드는 대신, **변수를 갈아 끼웁니다.**

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
}
```

CSS 변수는 상속되므로 **여기서 한 번 갈아 끼우면 포털 안의 모든 공용 부품이 자동으로 포털 말투**가 됩니다.
포털 밖은 한 픽셀도 안 바뀝니다. 라이트 모드도 저절로 따라옵니다. 값을 «베껴 적지» 않고 **토큰을 가리켰기** 때문입니다.

두 가지 요령:

**① 경계선은 `hairline`(12%) 이 아니라 `hairline-strong`(28%) 으로 갑니다.**
`--qa-border` 는 카드 테두리뿐 아니라 **버튼 · 입력 테두리**로도 쓰이는데, 12% 로 가면 거의 사라져 «조작할 수 있는 것» 으로 안 보입니다.

**② `--qa-green` 은 `--risk-low` 가 아니라 `--status-verified` 에 잇습니다.**
공용 green 은 «성공 / 확인» 이지 «위험도 낮음» 이 아닙니다. 뜻이 다른 토큰에 이으면 한쪽 값을 고칠 때 다른 뜻이 따라 흔들립니다.

### 글꼴 체인

```css
--serif: var(--qd-font-family-display);  /* Cormorant Garamond → Pretendard → Georgia, serif */
--sans:  var(--qd-font-family-ui);       /* Pretendard → 시스템 sans */
--mono:  var(--qd-font-family-mono);     /* JetBrains Mono → Consolas → Menlo → Pretendard */
```

**Pretendard 를 각 체인의 «라틴 폰트 바로 뒤»** 에 둡니다. 라틴은 의도한 얼굴로, 한글은 언제나 Pretendard 로 갑니다.
더 뒤에 두면 `next/font` 가 만든 자동 대체 폰트가 한글을 먼저 가로챕니다(실제로 일어난 일과 까닭은 [3장](03-typography.md)).

#### italic 전면 차단

```css
.expert-portal-root, .expert-portal-root *,
.expert-portal-root em, .expert-portal-root i,
.expert-portal-root cite, .expert-portal-root address {
  font-style: normal !important;
}
.expert-portal-root .hl-champagne { color: var(--champagne); font-weight: 500; }
```

브랜드 규칙입니다. 강조는 기울임이 아니라 **금색 + weight 500** 으로 합니다. Cormorant italic 은 애초에 로드하지도 않습니다.

### 역할 기반 크기 사다리

메인 앱이 «값보존» 사다리를 쓰는 것과 대조적으로, 포털은 **역할로 7칸**만 둡니다.

```css
--fs-label:  var(--qd-caption-size);  /* 12px · 모노 · 대문자 · 넓은 자간: eyebrow · 필드 라벨 · 코드 · 탭 */
--fs-ui:     var(--qd-control-size);  /* 13px · 산세리프 UI 문자열: 버튼 · 칩 · 알림 · 각주 */
--fs-body:   var(--qd-body-size);     /* 14px · 본문 */
--fs-lead:   var(--qd-section-size);  /* 16px · 리드문 · 입력 · 인용 */
--fs-title:  var(--qd-font-size-20);  /* 20px · 카드 제목 */
--fs-brand:  var(--qd-title-size);    /* 22px · 워드마크 */
--fs-figure: 44px;                    /* 숫자 · 장식 인용부호 */
```

라벨 12 · UI 13 은 «보조 글씨 최소 12px»(오너 결정 2026-09-27)을 따른 값입니다. 사다리 칸은 서로 다른 값이어야 합니다.

**크기가 많은 게 문제가 아니라 «같은 역할이 두 크기, 같은 크기가 두 역할» 인 게 문제**입니다.
**나눔 기준: 모노 · 대문자 · 넓은 자간 = 라벨 / 산세리프 = UI 문자열.**
반응형 축소와 아이콘 글리프는 이 사다리 밖입니다. 거긴 «크기가 곧 뜻» 이라 묶으면 오히려 잘못됩니다.
Q-Atelier 계약 `lib/design/expert-type-scale.test.ts` 가 새 raw px 을 막고, 사다리 밖 예외는 그 자리에 «사다리 밖» 이라는 까닭을 적어야 통과합니다.

#### 배지 기하도 변수로

```css
--badge-pad:      5px 12px;
--badge-size:     12px;
--badge-tracking: 0.12em;
```

나란히 놓이는 상태 배지와 마감 배지의 높이가 갈리면 «네모 크기가 왜 다르냐» 가 됩니다.
값을 맞추기만 하면 또 갈리므로 **변수로 묶습니다.** 카드 머리에 새 배지를 더할 때도 이 세 값을 씁니다.

### 분위기 3겹

```css
.expert-portal-root::before {         /* 금빛 워시 */
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background:
    radial-gradient(ellipse 70% 50% at 50% 0%,   color-mix(in srgb, var(--champagne) 6%, transparent), transparent 70%),
    radial-gradient(ellipse 60% 40% at 50% 100%, color-mix(in srgb, var(--champagne) 3%, transparent), transparent 60%);
}

.expert-portal-noise {                /* 필름 그레인 */
  position: fixed; inset: 0; opacity: 0.025; z-index: 1;
  background-image: url("data:image/svg+xml,…feTurbulence baseFrequency='0.85'…");
  mix-blend-mode: overlay;
}

.expert-portal-vignette {             /* 비네트 */
  position: fixed; inset: 0; z-index: 2;
  background: radial-gradient(ellipse 80% 60% at center, transparent 50%, rgba(0, 0, 0, 0.35) 100%);
}

.expert-portal-root > *:not(.expert-portal-noise):not(.expert-portal-vignette) {
  position: relative; z-index: 10;
}
```

**SVG `feTurbulence` 로 만든 필름 그레인**(외부 이미지 없이 CSS 만으로)이 평평한 다크 배경을 «인쇄물» 처럼 만듭니다.
opacity 0.025 로 거의 안 보이는데, 끄면 확실히 밋밋해집니다.

**밝은 판은 어두운 판에서 온 장치 셋을 걷습니다(오너 결정 2026-09-27 «A 종이»).** 상아색 위에서 가장자리 검정 그늘은 조명이 아니라
먼지로 읽히고, 휴대폰에서는 화면 절반이 회색이 됩니다.

- 비네트를 끕니다(`display: none`).
- 카드(`.luxe-card` · `.panel` · `.expert-danger-card`)는 반투명 + 흐림 대신 불투명 상아 종이 `--paper: #fcfaf6`(누르면 `#fffdf9`),
  그림자는 금색 8% 의 1px 한 겹입니다.
- 머리 띠와 아래 차림표는 `--ink` 단색, 흐림 · 그림자 없음.

모노그램 · 세리프 · 금선 · 영문 표제 · 여백은 그대로 둡니다. 고급스러움은 남기고 회색만 걷는 것이 기준입니다. 어두운 판은 건드리지 않습니다.

### 대표 부품

```css
.eyebrow            mono · var(--fs-label) · weight 500 · 자간 0.3em · uppercase · mist
.display-1          serif · clamp(40px, 6vw, 80px) · weight 500 · 자간 -0.025em · lh 1.1
.luxe-section-title mono · var(--fs-label) · 자간 0.4em · champagne · uppercase
                    margin clamp(48px, 6vw, 72px) 0 24px · flex + gap 16
                    앞에 32 × 1px 금색 선, 뒤에 hairline-strong 선이 남은 폭을 채움
.luxe-card          background velvet 40% · border 1px hairline · radius var(--radius) · padding 32
                    전환 border-color 280ms
.btn-gold           padding 16px 32px · 최소 높이 48px · cream 배경 · ink 글자
                    weight 600 · 자간 0.02em · radius var(--radius)
.luxe-input         밑줄만 (border-bottom 1px var(--qd-ctl)) · 바탕 var(--qd-surface)
                    padding 10px 0 14px · var(--fs-lead) · radius 0
.status-pill        badge-pad · badge-size · badge-tracking · mono · uppercase · border 1px · radius var(--radius)
```

`--radius` 와 `--radius-sm`(배지 · 작은 메뉴 항목)은 둘 다 `var(--qd-radius)` 입니다.

**자간이 앱보다 훨씬 넓습니다**(0.3em ~ 0.4em, 앱의 모노 라벨은 0.08em). 이것은 **라틴 라벨** 이야기입니다. 영문 위주 화면이라 가능한 선택이고,
한글에는 걸지 않습니다(앱과 같은 규칙: 한글 자간 0 · 모노 칸 공백 -0.35em). 포털은 라벨이 CSS 클래스라, 내용을 보고 표지를 붙이는
`components/expert/HangulTracking` 한 곳이 한글이 든 라벨에 `data-hangul` 을 달고, 기반 CSS 의 `[data-hangul]` 규칙이 자간을 0 으로 되돌립니다.

### 옮겨 쓴다면

포털 테마 전체를 가져갈 일은 드물 것입니다. 다만 세 가지는 어디서나 쓸 만합니다.

1. **변수 갈아 끼우기로 자매 테마 만들기.** 부품을 포크하지 않고 스코프 하나로 다른 말투를 만드는 법.
2. **역할 기반 크기 사다리.** 값이 아니라 역할로 나누면 «같은 역할 두 크기» 가 안 생깁니다.
3. **`feTurbulence` 필름 그레인.** 이미지 없이 평평한 배경에 질감을 주는 가장 싼 방법입니다.

#### 그리고 경고 하나

포털 안의 공용 의견서 폼(Q-Atelier `components/OpinionForm.tsx`)은 이 사다리를 따르지 않습니다.
메인 앱과 함께 쓰는 부품이라 앱 스케일을 **인라인**으로 쓰고, **인라인은 CSS 로 못 이깁니다.**

> 부품을 공유하면서 테마만 바꾸려면, 그 부품이 값을 **변수로** 받아야 합니다.
> 인라인으로 박힌 값은 스코프 재정의가 닿지 않습니다.
