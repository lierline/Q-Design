# 화면 뼈대 정본

[차림표](15-navigation-canon.md) · [목록](16-list-canon.md)에 이어 **목록의 위와 아래**를
묶는 규격입니다. `dist/q-design.screen.css` 한 파일에서 나옵니다.

2026-10-03: [업무 화면 정돈](25-workspace-refinement.md)의 조합 규칙도 같은 CSS에 포함됩니다.
`.qd-workspace`를 붙인 화면에만 적용하며, 원본은 `patterns/workspace.css`입니다.
기존 부품의 기본 치수와 새 조합 규칙의 읽기 크기를 구분합니다.

| 클래스 | 무엇 |
|---|---|
| `.qd-kpi` / `.qd-grid-kpi` | 요약 지표 카드와 그 격자 |
| `.qd-stat` / `.qd-grid-stat` | 조밀한 짝. 카드 «안»에 여럿 늘어놓을 때 |
| `.qd-label` | 구역 이름표. 모노 · 작게 · muted |
| `.qd-shell-*` | 폭을 좁히고 가운데 두는 규칙 |

---

## 1. 요약 지표

목록 위에서 「지금 상태」를 숫자로 말합니다.

```
┌──────────────────────┐
│ 오늘 생산             │  ← 라벨: 모노 10px · weight 500 · muted
│                      │
│ 204 개                │  ← 값: 36px · weight 700 · tabular-nums
│                      │
│ 이번 주 대비 +12       │  ← 부제: 11px · muted
└──────────────────────┘
  padding 18px 20px · minHeight 124 · radius 10
  격자 auto-fit minmax(180px, 1fr) · gap 14
```

**라벨이 위, 숫자가 아래입니다.** 훑는 사람이 찾는 것은 라벨이 아니라 숫자이므로,
라벨을 작게 얹고 숫자를 크게 세웁니다. Q-Sonar 는 반대로 되어 있었습니다.

🔑 **부제 자리는 값이 없어도 높이를 잡아 둡니다.** 안 그러면 부제가 있는 카드와
없는 카드의 높이가 달라 격자의 아랫줄이 들쭉날쭉해집니다.

**0 은 눌러 둡니다** (`.qd-kpi--zero`). 0 을 강조하면 아무 일도 없는 것이 일처럼
보입니다.

**색은 한 변수로 받습니다.**

```html
<div class="qd-kpi" style="--qd-kpi-color: var(--qd-danger)">
  <div class="qd-kpi-label" data-hangul>이번 달 불량률</div>
  <div class="qd-kpi-value">0.49<span class="qd-kpi-unit">%</span></div>
  <div class="qd-kpi-sub">지난달 0.31%</div>
</div>
```

### 카드를 붙이지 않습니다

한 상자 안에 칸을 붙이고 칸마다 선을 그으면, 항목이 줄바꿈될 때 남는 자리가
회색 덩어리로 남습니다 (Q-Forge 가 그 문제를 그렇게 풀고 있었습니다).
**카드를 따로 세우면 그 문제 자체가 없습니다** - 남는 자리는 그냥 빈 자리입니다.

---

## 2. 구역 이름표

「인허가 모듈」 · 「활동 로그」 · 화면 머리의 눈썹처럼 덩어리 위에 붙는 한 줄입니다.
모노 · 작게 · muted 이고, 누를 수 없는 글이므로 아주 조용합니다.

⚠️ **한글이면 `data-hangul` 을 붙이세요.** 자간 0.12em 과 대문자가 함께 풀립니다.
Q-Sonar 의 화면 눈썹이 메뉴 이름(한글)에서 오는데 자간이 걸려 있어
「점 검 · 데 이 터」로 벌어져 있었습니다.

---

## 3. 폭

```
현장  520   장갑 낀 손으로 한 번에 한 가지
폼    720   쓰는 화면
상세  820   읽는 화면
2단  1140   본문 + 옆단
목록  제한 없음
```

🔑 **읽는 화면은 좁힙니다.** 전체폭으로 펼치면 글줄이 길어져 눈이 줄을 잃습니다.
목록만 폭 제한이 없는데, 표와 행은 넓을수록 좋기 때문입니다.

「인상을 만드는 것」의 상당 부분이 이 규칙입니다 ([11 화면 구조](11-screen-architecture.md)).
두 제품 모두 셸에 `max-width` 하나(1400 / 1160)만 두고 화면마다 좁히지 않고 있었습니다.

```html
<div class="qd-shell-detail space-y-6">…</div>   <!-- 읽는 화면 -->
<div class="qd-shell-form space-y-6">…</div>     <!-- 쓰는 화면 -->
```

본문 여백은 `--qd-main-pad-y` / `--qd-main-pad-x` (32px / 40px)로도 냅니다.
sticky 밴드가 이 값을 실측해 inset 을 잡는 제품이 있습니다.

---

## 4. 구역 이름 · 칸 이름표 · 2차 탭 (2026-09-24 · 감사 22 10절)

네 제품을 원본과 나란히 찍었을 때 «정본에 자리가 없어» 제품마다 달랐던 곳입니다. 오너 결정
「정본을 늘려 모두 맞추기」 로 원본 SectionTitle · Lbl · PageTabs 에서 값을 읽어 올렸습니다.
한 장에서 보려면 `preview/parts.html`.

| 클래스 | 원본 | 모양 | 쓰는 자리 |
|---|---|---|---|
| `.qd-section-title` | SectionTitle | 금색 · 모노 10 · 굵기 500 · 라틴 2.2px · 아래 14 | 판 «밖» 에서 덩어리의 이름 |
| `.qd-field-label` | Lbl | subtle · 모노 10 · 굵기 500 · 라틴 1.5px · 아래 7 | 입력칸 바로 위 |
| `.qd-tabs` · `.qd-tab` | PageTabs | 밑선 위 글자 13 · 고른 탭 금색 밑줄 2 · 굵기 600 | 화면 «안» 을 가르는 탭 |

- `.qd-label`(2절)과 `.qd-section-title` 은 다릅니다. 앞은 카드 «안» 의 조용한 이름표(muted),
  뒤는 화면을 구역으로 나누는 표지(강조색)입니다.
- 한글이면 `data-hangul`(자간 · 대문자가 풀립니다). 탭 글자에는 처음부터 자간이 없습니다.
- 고른 탭은 `aria-selected="true"` 로 말합니다(`.qd-tab--active` 도 받습니다). 상자 · 알약 · 폴더
  모양 탭은 쓰지 않습니다(오너 결정 2026-09-24 「금색 밑줄 탭으로 통일」).
- 2026-09-25 다듬기: 셋 모두 원본 본문 줄간격 1.6 을 못 박습니다(제품 바탕 줄간격이 달라 탭 46 ~ 48 ·
  이름표 15 ~ 17 로 갈렸습니다. 이제 원본과 같은 47 · 16). 탭은 원본 전역 규칙과 같은 초점 고리를
  스스로 겁니다. 이름표가 단추 · 배지와 한 줄에 서는 머리 줄에서는 `.qd-field-label--flush`(아래 여백 0).

```html
<div class="qd-tabs" role="tablist" aria-label="기록 관리">
  <a class="qd-tab" role="tab" aria-selected="true" href="?tab=a">개요</a>
  <a class="qd-tab" role="tab" aria-selected="false" href="?tab=b">기록</a>
</div>
<h2 class="qd-section-title" data-hangul>오늘 처리할 것</h2>
<label class="qd-field-label" for="due" data-hangul>기한</label>
<input class="qd-input" id="due">
```

## 옮긴 뒤에 확인할 것

1. **KPI 카드 높이가 고르게 맞는지.** 부제 자리를 안 잡으면 아랫줄이 들쭉날쭉합니다.
2. **한글 라벨이 벌어지지 않았는지.** `data-hangul` 을 빠뜨리기 쉬운 자리입니다.
3. **상세 화면이 820 인지.** 브라우저를 1600px 로 넓혀 보면 바로 드러납니다.
4. **0 인 값이 눌려 있는지.**

관련: [15 차림표 정본](15-navigation-canon.md) · [16 목록 정본](16-list-canon.md) ·
[11 화면 구조](11-screen-architecture.md)
