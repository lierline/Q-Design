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

## 옮긴 뒤에 확인할 것

1. **셀 높이를 재 보세요.** 11 + 13 + 11. `py-3` 이 남아 있으면 여기서 드러납니다.
2. **한글 머리글이 벌어지지 않았는지.** 빠뜨리기 쉬운 자리입니다.
3. **표가 판 안에 있는지.** 맨몸으로 놓이면 첫 줄과 끝 줄이 흐려집니다.
4. **못 누르는 행이 hover 에 반응하지 않는지.** 거짓 어포던스입니다.

관련: [15 차림표 정본](15-navigation-canon.md) · [06 컴포넌트](06-components.md) ·
[12 조합 패턴](12-composition-patterns.md) · [03 타이포그래피](03-typography.md) 한글 자간
