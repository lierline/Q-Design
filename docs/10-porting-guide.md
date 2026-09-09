# 옮겨 쓰기

---

## 1단계 · 최소 (30분)

토큰 파일 하나만 걸면 색과 스케일이 전부 따라옵니다.

```html
<link rel="stylesheet" href="dist/q-design.tokens.css">
```

```css
body {
  background: var(--qa-bg);
  color: var(--qa-text);
  font-size: 14px;
  line-height: var(--qa-lh-relaxed);
  font-feature-settings: 'ss03', 'tnum';
  -webkit-font-smoothing: antialiased;
}
```

폰트는 `source/fonts/PretendardVariable.woff2` 를 함께 실어야 같은 얼굴이 됩니다.

```css
@font-face {
  font-family: 'Pretendard Variable';
  src: url('./PretendardVariable.woff2') format('woff2-variations');
  font-weight: 45 920;
  font-display: swap;
}
:root { --qa-font-pretendard: 'Pretendard Variable'; }
```

**이 단계만 해도 인상의 절반이 옵니다.** 크림색 글자와 샴페인 액센트가 핵심이기 때문입니다.

---

## 2단계 · 인상 (반나절)

값만으로는 「단조롭다」는 말을 듣습니다. **옮겨야 할 것은 장치입니다.**
아래 다섯을 `globals.css` 에서 그대로 복사하십시오.

| 장치 | 위치 |
|---|---|
| `.qa-card-lift` | 카드 호버의 **금테** (`0 0 0 1px` 금색 링) |
| `.qa-stagger` | 순차 등장 (35ms 간격, 9번째부터 고정) |
| `.qa-skeleton` | 금빛 시머 |
| `.qa-mag-divider` | 매거진 구분자 |
| `.qa-top-progress` | 상단 2px 금색 실선 |

그리고 **회색을 쓰지 마십시오.**

```css
/* 이렇게 하지 말고 */  background: #2a2a2a;
/* 이렇게 */           background: color-mix(in srgb, var(--qa-champagne) 4%, var(--qa-surface));
```

스켈레톤 · 스크롤바 · 선택 영역 · 아바타 어디에도 순수 회색이 없다는 점이
이 시스템이 «비싸 보이는» 이유의 상당 부분입니다.

### 포커스도 함께 가져가십시오

```css
:focus-visible { outline: 2px solid var(--qa-champagne); outline-offset: 2px; }
:focus:not(:focus-visible) { outline: none; }

button:focus-visible, a:focus-visible, [role='button']:focus-visible {
  outline-offset: 4px;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--qa-champagne) 22%, transparent);
}
```

---

## 3단계 · 규칙 (하루)

[규칙과 계약](09-rules-and-contracts.md) 에서 넷을 골라 테스트로 만드십시오.

1. 대비 (모든 표면 × 모든 텍스트)
2. 팔레트 사본 동기화
3. 한글 자간 0
4. raw 값 동결(baseline)

`tools/contrast-table.mjs` 를 조금만 고치면 1번은 바로 테스트가 됩니다.

---

## 무엇을 가져가고 무엇을 두고 갈 것인가

### 가져갈 것

- **크림 + 깊은 검정 + 샴페인 골드** 팔레트
- **Pretendard 단일 글꼴 + weight 로 위계**
- **rem 14px 기준** (다만 새 프로젝트라면 16 으로 두고 값을 환산하는 편이 낫습니다)
- **10px 단일 모서리**
- **한글 자간 규칙** (`labelTracking`)
- **ease-out expo 하나로 통일**
- **인쇄 팔레트 교체**
- **계약 테스트 방식**

### 두고 갈 것

**① 인라인 스타일 위주 구조**
반응형이 «화면 이름이 박힌 전역 `!important` 규칙» 으로 밀려납니다. 원본에 그런 규칙이 14종 있습니다.
새로 만드신다면 레이아웃만큼은 클래스로 두십시오.

**② `SHADOW` (다크 고정 그림자)**
안쪽 흰 선이 라이트에서도 남습니다. 테마 인지인 `ELEVATION` 쪽을 쓰십시오.

**③ 상태색 7종의 현재 값**
넷이 실측 AA 미달입니다. 값을 조정하고 대비 계약에 포함시키십시오.

**④ 129KB 단일 컴포넌트 파일**
`components.tsx` 3,733줄에 부품 60여 종이 들어 있습니다. 참고는 되지만 구조는 따라 하지 마십시오.

---

## ⚠️ 다른 사이트에 옮길 때 조심할 것

Q-Atelier 는 **로그인 뒤의 업무 시스템**입니다.
마케팅 사이트나 랜딩 페이지로 옮기면 다르게 읽히는 장치들이 있습니다.

| 장치 | 업무 시스템에서 | 공개 웹에서 |
|---|---|---|
| 글자 그라디언트 (`goldTextStyle`) | 로그인 히어로 한 줄 | **AI 가 만든 티가 납니다.** 쓰지 마십시오 |
| eyebrow 라벨 (mono·대문자·넓은 자간) | 정보 밀도를 나누는 장치 | 남용하면 템플릿처럼 보입니다 |
| pill 배지 | 상태 표시 | 장식으로 쓰면 클리셰 |
| 카드 안의 카드 | 데이터 위계상 불가피 | 중첩하지 마십시오 |
| 테두리 + 그림자 동시 | 호버 순간에만 | 상시로 두면 지저분합니다 |

원본에서도 골드 그라디언트는 **「얼굴」 화면 전용**이고 업무 화면은 단색으로 절제한다고 못박혀 있습니다.
그 절제가 이 시스템의 핵심입니다.

---

## 흔한 실수 일곱

**① rem 을 16 으로 계산합니다.**
`0.9375rem` 은 15px 이 아니라 **13.125px** 입니다. 기준이 14px 입니다.

**② 한글 라벨에 자간을 줍니다.**
「오늘  처리할  것」처럼 흩어집니다. 원본에서 166곳 / 93파일에 걸쳐 일어났습니다.

**③ 액센트 면 위에 흰 글자를 박습니다.**
`var(--qa-on-accent)` 를 쓰십시오. 테마에 따라 뒤집힙니다.

**④ 배경 하나만 보고 색 대비를 맞춥니다.**
`surface2` 위가 가장 어렵습니다. 원본이 이 실수를 세 번 했습니다.

**⑤ 무한 애니메이션에 개별 `reduced-motion` 을 안 답니다.**
전역 `0.01ms` 규칙만으로는 **초고속 깜빡임**이 됩니다.

**⑥ SVG 아이콘을 CSS 배경 이미지로 씁니다.**
data URI 는 `var()` 를 못 받아 테마를 못 따라갑니다.
`mask-image` + `background-color` 로 바꾸면 변수를 쓸 수 있습니다.

**⑦ 스크롤 컨테이너를 인쇄에서 안 풉니다.**
셸이 `100dvh` + `overflow: hidden` 이면 첫 화면 한 장만 인쇄됩니다.

```css
@media print {
  main { height: auto !important; overflow: visible !important; }
}
```

---

## 체크리스트

도입한 뒤 이것들을 실제로 확인하십시오. 눈으로 보지 않으면 모릅니다.

- [ ] 다크/라이트 양쪽에서 모든 화면을 열어 봤는가
- [ ] `prefers-reduced-motion` 을 켜고 깜빡임이 없는가
- [ ] Tab 만으로 전체를 돌아다닐 수 있는가 (포커스가 보이는가)
- [ ] 실제로 인쇄 미리보기를 열어 봤는가
- [ ] 모바일 폭(375px)에서 가로 스크롤이 안 생기는가
- [ ] 대비 계산을 **돌려서** 확인했는가 (주석을 믿지 마십시오)
- [ ] 한글 라벨이 벌어져 보이지 않는가

마지막 항목이 가장 자주 놓칩니다. 라틴 견본으로만 확인하면 안 보입니다.
