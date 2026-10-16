# 얼굴 화면

업무 화면은 절제하지만, **「얼굴」 화면에서는 브랜드가 소리를 냅니다.**
로그인 · 환영 · 작별 셋입니다.

여기 있는 연출은 `globals.css` 에 없습니다. 각 화면의 `<style>` 블록 안에 있고,
원본은 `source/screens/` 에 있습니다. 46종 중 27종이 이런 식으로 숨어 있습니다.

> **업무 화면에 이 연출을 가져오지 마십시오.**
> 골드 그라디언트도, 빛줄기도, 입자도 「얼굴」 전용입니다.
> 대시보드에 쓰면 이 시스템이 지키려는 절제가 무너집니다.

---

## 1. 로그인 (`app/(auth)/login/page.tsx`)

### 레이아웃: 2단 분할

```
≥1024px                              <1024px
┌──────────────┬───────────────┐    ┌────────────────┐
│              │               │    │  (브랜드 숨김)  │
│  브랜드      │   로그인 폼    │    │   로고         │
│  선언문      │               │    │   폼           │
│  신뢰 표시   │               │    │                │
└──────────────┴───────────────┘    └────────────────┘
 1.15fr          1fr                  1fr
```

**왼쪽이 조금 더 넓습니다** (1.15 : 1). 브랜드 쪽에 무게를 실은 것입니다.

두 면에 **방향이 반대인 그라디언트**가 걸립니다.

```css
/* 브랜드 면: 105deg, 오른쪽으로 갈수록 금빛 */
background: linear-gradient(105deg,
  color-mix(in oklab, var(--qa-bg) 75%, transparent) 0%,
  color-mix(in oklab, var(--qa-champagne) 6%, transparent) 100%);
border-right: 1px solid color-mix(in oklab, var(--qa-border) 60%, transparent);

/* 폼 면: 255deg, 반대 방향으로 표면 톤 */
background: linear-gradient(255deg,
  color-mix(in oklab, var(--qa-bg) 82%, transparent) 0%,
  color-mix(in oklab, var(--qa-surface) 70%, transparent) 100%);
backdrop-filter: blur(1px);
```

두 그라디언트가 **가운데 경계에서 마주 보며** 갈라집니다.
그 뒤로 리본 배경(`intensity="full"`, opacity 0.14 / 0.08)이 흐릅니다.
폼 면의 `blur(1px)` 은 리본 위에서 글자 가독성을 지키기 위한 것입니다.

```
브랜드 면   padding 56px 64px · 등장 700ms
폼 면       padding 56px 56px · 폼 최대폭 440 (모바일 460)
폼 카드     padding 28px 30px · background surface · border 1px
            ⚠️ border-radius 없음. 로그인 카드만 각집니다
```

### 입장 연출: 다섯 겹

로그인 성공 후 홈으로 들어가기 전에 한 번 재생됩니다. 총 1.1~1.2초입니다.

| 겹 | 클래스 | 무엇 | 시간 |
|---|---|---|---|
| ① 베일 | `.qa-entrance-veil` | 전체 오버레이. 11%에 차오르고 82%까지 유지, 끝에 사라짐 | 전 구간 |
| ② 광채 | `.qa-entrance-glow` | 중앙 금빛 방사. `scale 0.84 → 1.14`, opacity 0 → 1 → 0.72 | 1150ms |
| ③ 빛줄기 | `.qa-entrance-sweep` | 폭 46% 띠가 `-150% → 330%` 로 화면을 쓸고 지나감 | 1100ms · 지연 80ms |
| ④ 입자 | `.qa-entrance-ember` | 금빛 입자가 위로 210px 떠오르며 **깜빡깜빡 반짝** | 개별 |
| ⑤ 마크 | `.qa-entrance-mark` | 로고가 `scale 0.8 → 1.02 → 1` 로 안착 + 금빛 halo(300px) | |

```css
/* ③ 빛줄기: 기울여야 «스친다» 는 느낌이 납니다 */
transform: translateX(-150%) skewX(-14deg);
background: linear-gradient(100deg, transparent,
            color-mix(in oklab, var(--qa-champagne) 82%, white), transparent);

/* ④ 입자: opacity 를 오르내리게 해서 «반짝임» 을 만듭니다 */
0% { opacity: 0; transform: translate(0, 16px) scale(0.5); }
12% { opacity: 0.66; }  26% { opacity: 0.18; }
40% { opacity: 0.7; }   56% { opacity: 0.26; }  72% { opacity: 0.6; }
100% { opacity: 0; transform: translate(var(--drift, 0px), -210px) scale(1.1); }

/* ⑤ 마크: 1.02 로 살짝 넘겼다가 1 로 돌아옵니다 */
0% { scale(0.8) }  40% { scale(1.02) }  100% { scale(1) }
```

**요령 셋을 뽑으면 이렇습니다.**

1. **입자의 opacity 를 오르내리게** 하면 «반짝임» 이 됩니다. 단조 증가시키면 그냥 떠오르는 점입니다
2. **빛줄기는 기울입니다.** `skewX(-14deg)` 없이 수직 띠로 지나가면 스캐너처럼 보입니다
3. **로고는 1.02 까지 갔다가 1 로 돌아옵니다.** 정확히 1 에서 멈추면 «붙는» 느낌이 없습니다

입자의 `--drift` 는 개별 CSS 변수로 넘겨 입자마다 다른 궤적을 줍니다.

---

## 2. 환영 흐름 (`components/WelcomeFlow.tsx`)

첫 로그인 사용자에게 뜨는 모달입니다.

```css
.qa-welcome-card {
  animation: qa-welcome-in 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes qa-welcome-in {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.qa-welcome-backdrop { animation: qa-welcome-backdrop 240ms ease both; }
```

**이 시스템에서 `scale` 을 쓰는 몇 안 되는 자리입니다.**
`0.98 → 1` 은 아주 작은 폭이라 «튀어나온다» 가 아니라 «놓인다» 로 읽힙니다.
백드롭이 먼저(240ms) 차오르고 카드가 그 위에(320ms) 놓입니다.

---

## 3. 작별 (`app/experts/farewell/page.tsx`)

전문가가 계정을 정리하고 떠날 때의 화면입니다. 키프레임 7종이 걸려 있습니다.

```
qa-wash-in          배경 워시가 차오름
qa-hairline-draw    금색 실선이 «그어짐»       ← 선을 그리는 연출
qa-hairline-appear  실선이 나타남
qa-headline-drop    제목이 내려앉음
qa-rise-soft        본문이 부드럽게 떠오름
qa-wm-fadein        워터마크 등장
qa-wm-breathe       워터마크가 «숨쉼»         ← 아주 느린 무한 반복
```

**`qa-hairline-draw` 가 이 시스템다운 연출입니다.**
선을 페이드인시키지 않고 **폭을 0 에서 늘려 그어지게** 합니다.
아틀리에의 «손으로 긋는» 감각을 모션으로 옮긴 것입니다.

떠나는 화면에까지 이 정도를 들이는 것이 브랜드의 성격을 말해 줍니다.

---

## 4. 그 밖의 인라인 연출

| 키프레임 | 어디 | 무엇 |
|---|---|---|
| `qa-cursor-blink` | AI 초안 3종 | 생성 중 타이핑 커서 |
| `qa-drawer-slide-in` / `-l` / `-r` | 사이드바 | 모바일 드로어 |
| `qa-fab-rise` | AI 빠른 접근 FAB | 떠오르는 버튼 |
| `qa-assist-rise` | AI 초안 도우미 | 패널 등장 |
| `qa-widget-jiggle` | 위젯 보드 | **편집 모드에서 카드가 흔들림** |
| `qa-spin-fj` · `qa-item-spin` | 최종 판단 · 품목 분류 | 지역 스피너 |
| `qa-luxe-*` (5종) | 전문가 포털 | 포털 전용 등장 연출 |
| `fadeUp` | 한 곳 | **접두어가 없는 유일한 키프레임** |

`qa-widget-jiggle` 은 눈여겨볼 만합니다.
편집 모드에서 카드를 살짝 흔들어 «지금 만질 수 있다»를 알립니다. 모드 배너를 띄우는 대신입니다.

`fadeUp` 은 이름 규칙(`qa-` 접두)에서 벗어난 유일한 것입니다.
전역 키프레임과 이름이 충돌할 위험이 있으니 옮겨 쓸 때는 접두어를 붙이십시오.

---

## 5. 옮겨 쓸 때

**전부 가져갈 필요는 없습니다.** 다만 이 원칙은 가져갈 만합니다.

> **소리를 내는 자리를 세 곳으로 제한합니다.** 들어올 때 · 처음 만날 때 · 떠날 때.
> 그 사이의 모든 화면은 조용합니다.

로그인에 1.2초짜리 연출을 넣을 수 있는 이유는, 나머지 화면에서 아무것도 안 하기 때문입니다.
모든 화면이 조금씩 화려하면 어느 화면도 특별하지 않습니다.
