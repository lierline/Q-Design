# 목록 정본

세 제품의 **목록 화면**을 한 벌로 묶는 규격입니다. [차림표 정본](15-navigation-canon.md)과
같은 성격이고 (설명이 아니라 강제), `dist/q-design.list.css` 한 파일에서 나옵니다.

---

## 왜 목록인가

차림표를 맞춘 다음 세 제품의 본문을 나란히 놓아 보니, 인상이 가장 크게 갈리는
자리가 목록이었습니다. **화면 면적의 대부분을 목록이 차지하는데** 셀 여백 ·
머리글 글꼴 · 행 경계가 전부 달랐습니다.

```
             셀 여백        머리글                  본문
Q-Atelier    11px 12px     mono 10 · 500 · 0.12em  13px
Q-Forge      13px 16px     sans 11 · 700 · 0.05em  14px
Q-Sonar      화면마다 다름  mono 10 · 0.8px         14px
```

Q-Sonar 는 공용 표 부품이 없어 페이지 열두 곳이 각자 `<table>` 을 짰습니다.
같은 저장소 안에서도 화면마다 달랐다는 뜻입니다.

---

## 꼴을 하나로 합치지 않습니다

Q-Atelier 에는 두 가지가 다 있습니다.

| 부품 | 언제 |
|---|---|
| `.qd-row` (항목 카드) | 항목 수가 적고 **하나하나가 사건** 인 목록. 부적합 · 불만 · 변경평가 |
| `.qd-table` (표) | 수백~수천 줄을 훑는 자리. 밀도가 값어치입니다 |

4만 개 회사와 55개 자재 로트를 전부 카드로 바꾸면 한 화면에 여섯 줄만 보입니다.
**통일은 «같은 꼴끼리» 맞추는 것**이지 꼴을 하나로 줄이는 것이 아닙니다.

---

## 진짜 `<table>` 에도 걸립니다

원본 `DataTable` 은 grid 로 짠 div 이지만, 두 제품은 진짜 `<table>` 을 씁니다.
마크업을 통째로 바꾸면 열 너비 · `colspan` · sticky 칸이 다 흔들립니다.
그래서 `.qd-table` 은 `table/th/td` 와 `div` 양쪽에 같은 값을 겁니다.

```html
<div class="qd-panel">
  <div class="qd-table-scroll">
    <table class="qd-table">
      <thead><tr><th>기업명</th><th data-hangul>상태</th></tr></thead>
      <tbody><tr><td>…</td><td class="qd-num">12</td></tr></tbody>
    </table>
  </div>
</div>
```

### 한글 머리글

표 머리글은 모노 · 대문자 · 넓은 자간입니다. 한글에 걸면 「로 트 번 호」 처럼
벌어지므로 그 머리글에 `data-hangul` 을 붙입니다.

🔑 **머리글이 «거의 다» 한글인 제품은 표에 `qd-table--hangul` 을 겁니다.**
기본이 뒤집히고, 섞여 있는 라틴 머리글만 `data-latin` 을 답니다.
표를 400곳 넘게 손으로 짠 저장소에서는 언젠가 한 곳이 빠지고 그 한 곳만
벌어집니다. **많은 쪽을 기본으로 두면 빠뜨려도 조용히 틀리지 않습니다.**

---

## 치수 (`dist/q-design.list.json` 에서 나옵니다)

### 판 (`.qd-panel`)

```
background surface · border 1px · radius 10
```

목록은 캔버스 위에 맨몸으로 놓이지 않습니다. 판이 없으면 표의 첫 줄과 마지막
줄이 어디서 시작하고 끝나는지 흐려집니다.

모서리는 **맥락을 읽습니다.** `--qd-radius-card: 0` 한 줄이면 각진 모서리를
브랜드로 쓰는 자매 테마가 자기 언어를 말합니다. 값을 두 벌로 두지 않고 폴백으로
처리한 원본의 설계를 그대로 옮겼습니다.

### 판 «안»의 컨트롤도 같은 사다리에서 옵니다

```css
:root {
  --qd-radius-control: var(--qd-radius-control-src, 10px);
}
```

`--qd-radius-card` 와 달리 이쪽은 `:root` 에 **선언합니다.** 카드 쪽은 «선언 안 된
변수 + 폴백» 자체가 자매 테마의 스위치라 선언하는 순간 계약이 바뀌지만, 컨트롤은
그런 계약이 없습니다. 각진 컨트롤을 브랜드로 쓰는 쪽은 `--qd-radius-control-src: 0`
한 줄이면 됩니다.

`html[data-theme='light']` 블록에는 넣지 않습니다. **모서리는 테마 축이 아니라
사다리입니다.**

> 🔴 2026-09-09 감사에서 Q-Sonar 는 판이 10px 인데 그 «안»의 단추 191개 · 입력
> 12개가 전부 0px 이었습니다. 10 이라는 숫자가 이미 세 벌이라(Q-Atelier
> `tokens.ts` · `dist/q-design.tokens.json` · Q-Forge `globals.css`) 제품이
> 네 번째를 적지 않도록 정본이 내보냅니다.

### 표 (`.qd-table`)

```
머리글  padding 12px 12px · mono 10px · weight 500 · 자간 0.12em · 대문자 · subtle
셀      padding 11px 12px · 13px · text
경계    행마다 1px · 마지막 행은 없음
hover   누를 수 있는 행만 surface2   ← 안에 링크·단추가 있거나 role="link" 이거나
조밀    .qd-table--dense 는 8px
숫자    .qd-num 은 오른쪽 정렬 + tabular-nums
```

**누를 수 있는 행만 반응합니다.** 전부 반응하면 어디가 링크인지 알 수 없습니다.
`<tr>` 은 `<a>` 로 감쌀 수 없어 `role="link"` 로 다니는 제품이 있어서, 알아보는
길을 셋 두었습니다 (안에 링크·단추 / `role="link"` / `.qd-tr--click`).

### 항목 카드 (`.qd-row`)

```
padding 16px 18px · minHeight 72 · gap 14 · radius 10
background surface · border 1px · border-left 2px 액센트
hover  translateY(-2px) + 샴페인 그림자   ← 누를 수 있는 카드만
```

**왼쪽 2px 색 띠가 상태를 말합니다.** 배지보다 조용하고 훑기가 빠릅니다.
색은 `--qd-row-accent` 로 줍니다.

```html
<a class="qd-row" style="--qd-row-accent: var(--qd-danger)">
  <span class="qd-row-chip">아이콘</span>
  <span class="qd-row-body">
    <span class="qd-row-head">
      <span class="qd-row-code">NC-2026-001</span>
      <span class="qd-tag qd-tag--xs qd-tag--red" data-hangul>중대</span>
    </span>
    <span class="qd-row-title">광출력 측정값이 규격 상한을 초과했습니다</span>
    <span class="qd-row-meta">인지일 2026-08-30</span>
  </span>
  <span class="qd-row-chevron" aria-hidden>›</span>
</a>
```

### 배지 (`.qd-tag`)

```
xs  18px · 10px      조밀한 목록
sm  22px · 11px      기본
md  26px · 11.5px    강조

층  primary   면을 10% 채우고 테두리 55%   ← 이 행의 핵심 상태
    secondary 테두리 33% (기본)
    tertiary  테두리 18% · 글자 muted      ← 보조 정보
```

색은 `--qd-tag-color` 로 줍니다. 상태색 일곱(`qd-tag--gray` 등)을 미리 두었습니다.

⚠️ 그 일곱은 **대비 계약 밖**입니다 ([02 색](02-color.md)). 배지 «면» 위의 글자로만
쓰고, 본문 글자색으로 쓰지 마십시오.

---

## 목록 둘레 셋 (2026-09-24 · 감사 22 10절)

네 제품을 원본과 나란히 찍었을 때 «정본에 자리가 없어» 제품마다 달랐던 곳입니다. 오너 결정
「정본을 늘려 모두 맞추기」 로 원본 부품에서 값을 읽어 올렸습니다. 한 장에서 보려면
`preview/parts.html`(라이트는 `?theme=light`).

### 빈 목록 (`.qd-empty`) · 원본 EmptyState

목록이 «통째로» 비었을 때 목록 자리를 대신합니다. 판 하나 · 여백 96 · 가운데 · 조용한 제목(22 · subtle).
다음에 할 일은 단추(`.qd-btn`)나 금색 테두리 표지(`.qd-empty-hint`)로 둡니다. 좁은 자리는 `--compact`.

```html
<div class="qd-empty">
  <div class="qd-empty-icon" aria-hidden="true">◇</div>
  <div class="qd-empty-title">아직 등록된 부적합이 없습니다</div>
  <p class="qd-empty-desc">검사에서 벗어난 것이 나오면 여기에 쌓입니다.</p>
  <div class="qd-empty-actions"><a class="qd-btn qd-btn--primary" href="…">부적합 등록</a></div>
  <div class="qd-empty-hints"><a class="qd-empty-hint" data-hangul href="…">검사 기록 보기</a></div>
</div>
```

표 «안» 의 한 줄(찾은 것 없음)은 여전히 `.qd-table-empty` 입니다. 둘을 섞지 않습니다.

### 쪽 이동 줄 (`.qd-pager`) · 원본 ListPager

목록 «아래» 를 닫는 줄: 윗선 · 왼쪽 건수 「1-20 / 총 57건」 · 오른쪽 이전 · 쪽 번호 · 다음.
한 쪽에 다 들어오면 이동은 그리지 않고 **건수만** 둡니다. 목록 «위» 에 둘 때는 `--top`.

```html
<nav class="qd-pager" aria-label="목록 페이지 이동">
  <span class="qd-pager-count" data-hangul>1-20 / 총 57건</span>
  <span class="qd-pager-nav">
    <a class="qd-pager-btn" href="?page=1" aria-disabled="true">이전</a>
    <span class="qd-pager-page">1 / 3</span>
    <a class="qd-pager-btn" href="?page=2">다음</a>
  </span>
</nav>
```

### 거르개 띠 (`.qd-filter-bar`) · 원본 ListToolbar

목록 «위» 에서 좁히는 줄: 찾기 칸(36 · 돋보기 자리 32) · 정렬 · 찾기 단추 · 검색 지우기 · 오른쪽 끝 건수.
GET 폼으로 두면 JS 없이 돌고 지금 좁힌 것이 주소창에 남습니다. 따라오게 하려면 `--sticky` 와
`--qd-sticky-top`(제품의 머리띠 높이).

```html
<div class="qd-filter-bar">
  <form class="qd-filter-row" method="get" action="/nc">
    <span class="qd-filter-search">
      <svg class="qd-filter-search-icon" aria-hidden="true">…</svg>
      <input class="qd-filter-input" type="search" name="q" placeholder="코드·제목 검색" aria-label="코드·제목 검색">
    </span>
    <select class="qd-filter-select" name="sort" aria-label="정렬">…</select>
    <button class="qd-filter-submit" type="submit">찾기</button>
    <span class="qd-filter-count" data-hangul>1-20 / 총 57건</span>
  </form>
</div>
```

### 한글 규칙

- 건수 글 · 검색 지우기 · 다음 할 일 표지에 한글이 있으면 `data-hangul` 을 붙입니다(자간이 풀립니다).
- 단추(이전 · 다음 · 검색)는 기본이 한글이라 자간이 없습니다. 라틴(PREV · NEXT)만 `data-latin` 으로
  대문자 · 1.2px 를 받습니다(`.qd-btn` 과 같은 규칙).
- 원본 ListPager · ListToolbar 도 2026-09-25 부터 같은 규칙입니다(Q-Atelier `476e8096`). 전에는 한글
  단추 · 건수 글에도 1.2 · 0.4px 를 두었습니다.
- 찾기 단추의 글은 네 제품 모두 **「검색」** 입니다(오너 결정 2026-09-25. 전에는 「찾기」 · 「검색」 ·
  「조회하기」 로 갈렸습니다). 찾기 칸 안내(「… 검색」)와도 같은 말입니다.

### 초점 · 줄 높이 · 표 안 빈 줄 (2026-09-25 다듬기)

- 초점: 쪽 이동 단추 · 거르개 칸 · 찾기 단추 · 다음 할 일 표지는 원본 전역 규칙과 같은 고리(금색 2px ·
  4px 띄움 · 옅은 금색 4px)를 스스로 겁니다. 제품의 전역 규칙에 기대지 않습니다.
- 줄 높이: 빈 목록 제목 · 표지는 원본 본문 줄간격 1.6 을 못 박습니다(제품 바탕 줄간격이 달라 1px 씩 갈렸습니다).
- 표 안 빈 줄: `.qd-table-empty` 를 표 칸(`td` · `.qd-td`)에 걸어도 같은 얼굴입니다. 전에는 표 칸 규칙이 이겼습니다.
- 거르개 띠를 굴려도 따라오게: `.qd-filter-bar--sticky` 와 `--qd-sticky-top`(제품의 머리띠 높이, 없으면 0).
  세 제품 모두 원본처럼 따라오게 합니다. 폰 폭에서도 따라옵니다(오너 결정 2026-09-25 두 번).
- 따라오는 띠가 키보드 초점을 가리지 않게: 정본 부품 `StickyFocusGuard`(원본은 여기
  `source/components/sticky-focus-guard.tsx`, 네 제품이 sync 로 받음)를 앱 셸에 한 번 둡니다. 띠가 붙는
  자리 + 띠 높이 + 8px 를 재서 스크롤 틀의 `scroll-padding-top` 으로 둡니다(WCAG 2.4.11 · 오너 결정
  「초점 가림 고침」). 띠 높이가 화면 폭 · 칩 줄에 따라 달라 CSS 로 못 박지 않고 잽니다.
- 인쇄: 따라오는 띠는 제자리로 돌리고 찾기 폼(`.qd-filter-row`)은 종이에서 걷습니다(이 목록 정본의
  `@media print` · 원본 `.qa-list-toolbar` 인쇄 규칙과 같음). 🔴 인쇄 정본(`q-design.print.css`)에 두지 않습니다.
  그 파일을 불러 쓰는 제품은 Q-Maison 하나뿐이라 나머지 셋에서는 규칙이 «받아 두기만» 됩니다(2026-09-25 운영
  CSS 로 확인하고 옮김). 「검색 지우기」 도 다른 조작부와 같은 초점 고리를 받습니다.
  표 안 빈 줄에 한글이 있으면 `data-hangul`(모노 빈칸을 한글 낱말 간격으로).

---

## 옮긴 뒤에 확인할 것

1. **셀 높이를 재 보세요.** 11 + 13 + 11. `py-3` 이 남아 있으면 여기서 드러납니다.
2. **한글 머리글이 벌어지지 않았는지.** 빠뜨리기 쉬운 자리입니다.
3. **표가 판 안에 있는지.** 맨몸으로 놓이면 첫 줄과 끝 줄이 흐려집니다.
4. **못 누르는 행이 hover 에 반응하지 않는지.** 거짓 어포던스입니다.

관련: [15 차림표 정본](15-navigation-canon.md) · [06 컴포넌트](06-components.md) ·
[12 조합 패턴](12-composition-patterns.md) · [03 타이포그래피](03-typography.md) 한글 자간
