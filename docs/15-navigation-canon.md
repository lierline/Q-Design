# 차림표 정본

Q-Atelier · Q-Sonar · Q-Forge 세 제품의 **왼쪽 차림표를 한 벌로 묶는** 규격입니다.

다른 문서는 「이렇게 생겼습니다」를 설명하지만, 이 문서는 **강제합니다.**
치수가 `dist/q-design.nav.css` 한 파일에서 나오고, 세 제품이 그 파일을 링크합니다.

---

## 왜 차림표만 따로 정본을 두는가

나란히 놓았을 때 «같은 집안» 인지를 정하는 것은 본문이 아니라 차림표입니다.
본문은 제품마다 다른 일을 하니 달라도 됩니다. 공방(Q-Atelier)은 문서를 다루고,
소나(Q-Sonar)는 회사를 찾고, 대장간(Q-Forge)은 배치를 찍습니다.

**차림표는 세 제품이 똑같이 하는 유일한 일입니다.** 그래서 여기가 어긋나면
다른 회사 제품으로 읽히고, 여기가 같으면 본문이 달라도 형제로 읽힙니다.

그리고 차림표는 **어긋나기 쉽습니다.** 「11px 14px」 같은 값을 세 저장소에
손으로 적으면 세 값이 됩니다. 한 곳이 `py-2`(8px)로 적히는 순간 항목 높이가
6px 낮아지고, 열 칸이면 60px 이 어긋나 바닥 블록의 자리가 달라집니다.
[[duplicated-fact-drift]] 그대로입니다.

---

## 산출물

| 파일 | 무엇인가 |
|---|---|
| `dist/q-design.nav.css` | 세 제품이 링크하는 클래스 한 벌. **생성물** |
| `dist/q-design.nav.json` | 뽑힌 치수 47 개. 문서와 테스트가 읽습니다 |
| `tools/extract-nav.mjs` | Q-Atelier 원본에서 치수를 뽑는 추출기 |

```
node tools/extract-nav.mjs
```

추출기는 `source/components/Sidebar.tsx` 를 **읽습니다.** 숫자를 옮겨 적지
않습니다. 각 치수마다 탐침(probe)이 있고, 그 탐침은 지정한 구역 안에서
**정확히 한 번** 맞아야 합니다.

- **0 번 맞으면** 원본이 바뀐 것입니다. 값을 스크립트에 적어 넣지 말고 탐침을 고치세요.
- **2 번 이상 맞으면** 구역이 너무 넓은 것입니다. 접힘 상태 값과 펼침 상태 값이
  섞여 있을 수 있습니다 (접힌 레일과 펼친 레일이 같은 속성을 다른 값으로 씁니다).

실제로 이 규칙이 네 번 울었습니다. 파일 머리 주석의 `data-coachmark="sidebar"`
때문에 모바일 서랍까지 구역에 들어왔고, 한 항목 안의 조각 넷(링크·아이콘·점·배지)이
저마다 `fontSize` 를 갖고 있었습니다. **뽑히기는 뽑히는데 어느 값인지 모르는**
상태를 그대로 두었으면 정본이 거짓말을 했을 것입니다.

---

## 치수 (`dist/q-design.nav.json` 에서 나옵니다)

### 레일

```
폭          240px                 접으면 60px
서랍        264px  ·  max 85vw    1024px 미만에서 자동
높이        100dvh                100vh 가 아닙니다. iOS 주소창이 움직입니다
패딩        22px 16px             접히면 18px 6px
바탕        surface               오른쪽에 1px border
```

🔴 **스크롤하는 것은 `.qd-rail-nav` 이지 레일 전체가 아닙니다.**
레일을 통째로 스크롤로 두면 화면 높이가 768~1000px 일 때 로고와 바닥 계정
블록이 같이 밀려 올라가 「푸터가 없는」 것처럼 보입니다. Q-Atelier 가 M-16 으로
고친 자리이고, 같은 실수를 두 번 할 이유가 없습니다.

### 항목

```
여백        11px 14px             ← 가장 흔히 어긋나는 값
글자        14px · 자간 0.1px     쉴 때 400 · 활성 600
아이콘      자리 18px · 글리프 16px · 선 굵기 1.75
간격        12px  (아이콘과 글자 사이)
왼쪽 여백   17px  (옛 금막대 3px 를 여백으로 돌려 글자 자리가 그대로)
활성        굵은 글자 + surface2 바탕 + 글자 밑 16px 금색 선(1.5px · 글자 아래 5px)
전환        0.12s ease
```

**2026-09-27 «문서 결»(오너 결정 · [24](24-document-grain.md))**: 왼쪽 3px 금막대와 오른쪽 6px 금점을 걷었습니다.
「클로드 특유의 디자인 형태」 라는 오빠 지적이 계기입니다. 모서리는 여전히 굴리지 않습니다.

> 이것은 **항목** 이야기입니다. 발치의 테마 상자 · 아이콘 단추 · 로그아웃은 2026-09-14 부터
> 전부 10px 로 굴립니다(오너 결정 「통일성이 더 중요」). 값은 원본 Sidebar 에서 읽습니다.

**밑줄은 들어설 때 한 번만 왼쪽부터 펼쳐집니다** (320ms · `cubic-bezier(0.16, 1, 0.3, 1)` · scaleX 0 → 1).
`prefers-reduced-motion` 에서는 펼치지 않고 그대로 보입니다. 원본은 별도 요소(`qa-nav-active-underline`),
정본은 이름표의 `::after` 입니다(이름표가 말줄임으로 넘친 것을 자르므로 아래 안쪽 여백에 둡니다).

### 묶음 이름표

```
여백        12px 14px 4px
글자        모노 10px · 자간 1.6px · 대문자 · muted
```

🔴 **한글에는 자간과 대문자를 걸지 않습니다.** 그 장치는 라틴 글자 사이를
벌리라고 만든 값이라 한글에 걸면 「묶 음」 처럼 벌어집니다. 한글이 섞인
이름표에는 `data-hangul` 을 붙이세요. 자간과 대문자가 함께 풀립니다.
Q-Atelier `lib/design/tokens.ts` 의 `labelTracking()` 과 같은 규칙입니다.

⚠️ 원본 Q-Atelier 의 `SectionHeader` 는 이 규칙을 아직 안 거칩니다
(`letterSpacing: 1.6` 이 박혀 있고 한글 라벨을 받습니다). 정본은 규칙 쪽을
따랐습니다. 「원본과 같게」와 「규칙대로」가 갈릴 때는 규칙이 이깁니다.
규칙에는 근거가 있고 (03 타이포그래피), 박힌 값에는 없습니다.

### 바닥

```
판 번호     여백 4px 4px 8px · 모노 10px · 자간 0.6px
            왼쪽 이름 muted / 오른쪽 판 champagne
테마 줄     여백 10px 14px · 모노 10px · 자간 1.5px · 1px 테두리
            옆에 44x44 접기 단추
경계        위쪽 1px border · padding-top 12px
아바타      32px 원 · champagne 22% 를 섞은 면 · weight 600
이름        13px · weight 500 · text
역할        모노 10px · 자간 1.2px · 대문자 · muted   ← 한글이면 data-hangul
로그아웃    전폭 · 최소높이 36 · 여백 7px 14px · 11px · 1px 테두리
```

---

## 뼈대

클래스 이름이 곧 계약입니다. 이 순서와 이 이름을 씁니다.

```html
<aside class="qd-rail">
  <a class="qd-rail-brand" href="/">
    <img src="/logo-mark.png" alt="">
    <span class="qd-rail-org" data-hangul>회사 이름</span>
  </a>

  <nav class="qd-rail-nav">
    <div class="qd-nav-group" data-hangul>실행</div>
    <a class="qd-nav-item is-active" href="/dashboard">
      <span class="qd-nav-icon"><svg>...</svg></span>
      <span class="qd-nav-label">오늘 할 일</span>
    </a>
    <a class="qd-nav-item" href="/targets">
      <span class="qd-nav-icon"><svg>...</svg></span>
      <span class="qd-nav-label">타깃 정의</span>
      <span class="qd-nav-badge">3</span>
    </a>
  </nav>

  <div class="qd-rail-version"><span>Q-SONAR</span><b>v1.4.0</b></div>

  <div class="qd-rail-row">
    <button class="qd-rail-theme"><span>Theme</span><b>● Dark</b></button>
    <a class="qd-rail-theme" data-tone="danger"><span>Sender</span><b>미설정</b></a>
    <button class="qd-rail-iconbtn">‹</button>
  </div>

  <div class="qd-rail-foot">
    <a class="qd-rail-user" href="/me">
      <span class="qd-avatar">R</span>
      <span class="qd-rail-user-text">
        <span class="qd-rail-user-name">홍길동</span>
        <span class="qd-rail-user-meta" data-hangul>관리자 · 엔터프라이즈</span>
      </span>
    </a>
    <button class="qd-rail-logout">로그아웃</button>
  </div>
</aside>
```

### `data-tone` · 이 칸이 늘 「테마 토글」인 것은 아닙니다

`.qd-rail-theme` 자리는 기준 제품에서 테마 토글이지만, 제품에 따라 «막힘» 같은
상태가 들어가기도 합니다(Q-Sonar 는 발신 정보가 비어 메일 발송이 막힌 것을 여기
띄웁니다). 그래서 정본이 톤 둘을 엽니다.

| 값 | 테두리 | `<b>` 글자 |
|---|---|---|
| (없음) | `--qd-border` | `--qd-accent` |
| `data-tone='warning'` | `--qd-warn` 45% | `--qd-warn` |
| `data-tone='danger'` | `--qd-danger` 45% | `--qd-danger` |

> 🔑 정본이 톤을 안 열어 주면 제품이 인라인으로 덮게 되고, 그러면 «정본을 쓰지
> 않는 것»과 같습니다. 금색은 브랜드 · 주동작 «면» · 활성 차림표 셋만 맡습니다
> ([색 계약](02-color.md)).

좁은 화면의 서랍은 같은 `<aside>` 에 `qd-rail--drawer` 를 더합니다.
그 안에서는 레일 자체가 스크롤합니다 (안쪽에 또 스크롤을 두면 바깥을 만질 때
안쪽이 잡힙니다).

---

## 글꼴

차림표의 모노 글자(조직명 · 묶음 이름표 · 판 번호 줄 · 역할 줄)는 **세 제품이
같은 얼굴**을 씁니다. 사슬은 `dist/q-design.tokens.json` 에서 오고, 정본이
`--qd-font-mono` 의 바닥값으로 냅니다.

```
'JetBrains Mono', 'Consolas', 'Menlo', ui-monospace, Pretendard, monospace
```

🔴 **2026-09-09 에 셋이 전부 달랐습니다.** Q-Atelier 는 JetBrains Mono,
Q-Sonar 는 IBM Plex Mono, Q-Forge 는 Cascadia Mono 였습니다. 치수를 다 맞춰 놓고도
글자의 생김새만 갈려 있었는데, 사진으로는 잘 안 보이고 **계산된 값을 재서**
찾았습니다 (`tools/diff-rails.mjs`).

받는 법은 제품마다 다릅니다. 둘 다 사용자 브라우저가 바깥으로 나가지 않습니다.

```
Q-Sonar   next/font/google · 빌드할 때 받아 우리 서버에서 내보낸다
Q-Forge   woff2 를 실어 둔다 (public/fonts · Cinzel · Pretendard 와 같은 방식)
```

⚠️ **사슬의 «라틴 바로 뒤» 에 한글 글꼴을 둡니다.** 없으면 모노 칸에 한글이 한
조각 섞였을 때 브라우저가 아무 데나 떨어뜨려, 같은 글자가 자리마다 다른 얼굴로
나옵니다 (Q-Forge 가 실제로 겪었고 렌더 폭이 916 / 884 / 1020 / 828px 이었습니다).

---

## 색 잇기

색 **이름** 은 제품마다 다릅니다. Q-Atelier 는 `--qa-champagne`, Q-Sonar 는
`--color-gold`, Q-Forge 는 `--color-brand` 입니다. 이름을 통일하는 것은
저장소 셋을 동시에 뒤집는 일이라, 정본은 `--qd-*` 만 읽고 **잇는 줄** 을 받습니다.

```css
/* Q-Sonar */
:root {
  --qd-surface-src:   var(--color-panel);
  --qd-surface2-src:  var(--color-panel2);
  --qd-border-src:    var(--color-line);
  --qd-text-src:      var(--color-ivory);
  --qd-subtle-src:    var(--color-dim);
  --qd-muted-src:     var(--color-faint);
  --qd-accent-src:    var(--color-gold);
  --qd-on-accent-src: var(--color-onaccent);
  --qd-danger-src:    #c97a7a;
}
```

잇는 줄이 없으면 `--qa-*` 를 찾고, 그것도 없으면 이 파일이 생성될 때 박아 둔
Q-Atelier 값을 씁니다. 그 바닥값도 `dist/q-design.tokens.json` 에서 «생성» 된
것이지 손으로 적은 것이 아닙니다.

---

## 옮긴 뒤에 확인할 것

1. **항목 높이를 재 보세요.** 11 + 14 + 11 = 글자 높이 + 22. 굴린 모서리나
   `py-2` 가 남아 있으면 여기서 드러납니다.
2. **한글 이름표가 벌어지지 않았는지.** `data-hangul` 을 빠뜨리면 「실 행」이 됩니다.
3. **금점이 있는지.** 활성 항목의 오른쪽 끝입니다. 이것 하나가 빠지면
   「비슷한데 뭔가 다른」 인상이 됩니다.
4. **화면 높이를 800px 로 줄여 보세요.** 바닥 계정 블록이 붙어 있어야 합니다.
   밀려 올라가면 레일 전체를 스크롤로 둔 것입니다.
5. **모노 글자의 생김새.** 눈으로는 잘 안 갈리므로 `node tools/diff-rails.mjs`
   를 돌리십시오. 세 제품을 띄워 계산된 값 81개를 견주고 어긋난 자리만 짚습니다.
   한글이라 자간을 푼 자리는 「규칙대로 다름」 으로 따로 셉니다.

관련: [[11-screen-architecture]] 셸의 자리 · [[03-typography]] 한글 자간 규칙 ·
[[09-rules-and-contracts]] 테스트가 강제하는 것들
