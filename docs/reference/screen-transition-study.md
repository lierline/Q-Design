# 화면 전환 조사 · Screen Transition Part 1 (@ui_motion_prompts)

조사일: 2026-11-07. 출처: 인스타그램 [릴스 @ui_motion_prompts «Screen Transition Part 1»](https://www.instagram.com/reel/Dfa2G_4jJ9e/) (화면 사이를 옮겨 가는 고전적 방법 여섯 · 영문 · 일문).
오빠 지시 «공부하자». 규칙이 아니라 참고라 이 폴더에 둡니다. 정본 값은 바꾸지 않았습니다. 같은 계정의 앞선 둘은 [아래 탭줄](tabbar-motion-study.md) · [단추 · 카탈로그](ui-motion-prompts-study.md)에 있습니다.

> **한 줄 요약.** 여섯 중 넷(Fade Through · Shared Element · Card Expand · App Zoom)은 **크기가 변하는** 전환이라 1장 «회전 · scale 금지» 밖입니다. 남는 둘은 **밀기(Push Slide)** 와 **순차 등장(Stagger In)** 이고, 순차 등장은 이미 우리 것(`.qa-stagger`)입니다.
> 우리 화면 전환은 2026-09-10 에 «페이드만 160ms» 로 깎았고 그 까닭이 기록돼 있습니다(진행선을 누르는 순간으로 당겼는데 내용이 늦게 보이면 «빨라졌다» 가 성립하지 않는다). 그래서 밀기는 전체 화면이 아니라 **폰 앱의 목록 → 상세 한 자리**에 방향(앞 · 뒤)을 주는 «바꿈» 후보로만 둡니다.

---

## 1. 무엇을 읽었고 무엇을 못 읽었나

| 자료 | 읽음 | 비고 |
| --- | --- | --- |
| 캡션 | ○ | «Screen Transition Part 1: classic ways to move between screens. Which one would you use? Comment the number». 이번에는 «Free prompts → link in bio» 가 붙었습니다 |
| 표지 프레임(1080×1920) | ○ | 여섯 연출의 이름 · 한 줄 설명 · 정지 그림. 아래 2절 |
| 영상 본문 | × | 로그인 벽(«Watch on Instagram»). 시간 · 이징은 표지 설명에서 읽히는 만큼 |
| 프로필의 무료 프롬프트 링크 | × | 프로필이 로그인 벽. 사이트는 [uimotionprompts.com](https://uimotionprompts.com/)(앞 문서 3절) |

---

## 2. 여섯 연출 (표지에서 읽음)

표지의 보기는 사진 앱입니다(«Explore» 목록의 Peaks · Ocean · Garden 카드 → 상세). 사진이 주인공인 앱이라 크기가 변하는 전환이 자연스럽고, 그 점이 우리와 가장 다릅니다.

| # | 이름 | 표지 설명(원문) | 무엇이 움직이나 | 쓰는 수단 |
| --- | --- | --- | --- | --- |
| 1 | Push Slide | The detail slides in from the right; the list shifts left and dims. | 상세가 오른쪽에서 밀고 들어오고 목록은 왼쪽으로 조금 밀리며 어두워짐 | `translateX` 둘 + 어둡기(투명도). iOS 기본 밀기 |
| 2 | Fade Through | Old screen fades and shrinks away; the new one fades in and grows. | 옛 화면이 작아지며 사라지고 새 화면이 커지며 나타남 | 투명도 + `scale` 0.92 ↔ 1 언저리. Material 의 fade-through |
| 3 | Shared Element | The tapped photo flies and grows into the big photo of the detail page. | 누른 사진이 날아가 상세의 큰 사진이 됨 | 공유 요소(View Transitions 류). 위치 + 크기 |
| 4 | Card Expand | The tapped card stretches to fill the screen and becomes the page. | 누른 카드가 화면을 채우며 그 자체가 화면이 됨 | 컨테이너 변형(container transform). 크기 |
| 5 | App Zoom | Zoom into the card like opening an app: the page grows out of it. | 앱 열듯 카드로 줌인, 화면이 거기서 자람 | `scale` 큰 값 + 투명도 |
| 6 | Stagger In | The new screen builds itself: photo, title, lines and button in turn. | 새 화면이 사진 · 제목 · 줄 · 단추 순으로 지어짐 | 자식마다 지연을 둔 떠오름 |

둘로 갈립니다. **크기가 변하는 것**(2 · 3 · 4 · 5)과 **자리만 옮기거나 차례로 나타나는 것**(1 · 6). 앞의 넷이 사진 · 쇼핑 앱에서 멋진 까닭은 큰 그림이 있어서이고, 우리 화면의 주인공은 글과 표라 커지는 동안 글이 흐릿하고 흔들립니다.

---

## 3. 우리 화면 전환의 지금 (코드와 기록)

| 자리 | 지금 | 근거 |
| --- | --- | --- |
| 화면 본문 | `PageTransition` 이 경로가 바뀔 때 `main` 자식을 다시 붙이고 `.qa-page-fade` **페이드만 160ms**(ease-out expo) | 2026-06-06 «52px · 1400ms 출렁임» → 8px · 360ms, 2026-09-10 다시 깎아 떠오름을 뺌(`atelier.css` 주석 · 5장 «우아함은 느림이 아닙니다») |
| 진행선 | `TopProgressBar` 2px 금선. 누르는 순간 시작 → 90% 에서 멈춤 → 도착하면 100% | 6장. App Router 는 경로 값이 새 화면이 그려진 «뒤» 에 바뀌므로 |
| 서랍 · 창 | 24px(`--qd-space-6`) 미끄러짐 + 투명도(`qa-drawer-slide-r · -l · -b`) | `source/design/atelier-runtime.ts` |
| 순차 등장 | `.qa-stagger` 6px · 360ms · 자식마다 35ms · 9번째부터 고정. **한 묶음에만**(페이지 뿌리에 걸면 합성 레이어가 오래 살아 화면 캡처가 비는 일이 있었음) | 5장 |
| 얼굴 화면 | 로그인은 «판이 열린다»(3.1초 · 첫 누름에 끝 · reduce 면 안 돎) | 10-22 기록 |
| 방향 | **없음.** 앞으로 가든 뒤로 가든 같은 페이드 | 폰 앱(WebView)은 뒤로 단추가 물리 단추라 방향이 더 아쉬움 |
| 움직임 줄이기 | `.qa-page-fade` 는 reduce 에서 걷음(11-05 감사 13번) | 작업 기록 |

즉 우리는 이미 **2 Fade Through 에서 scale 을 뺀 것**을 쓰고 있고, 6 Stagger In 은 어휘로 갖고 있습니다. 없는 것은 **방향**과 **이어짐(같은 것이 옮겨 간다)** 둘입니다.

---

## 4. 여섯을 우리 규칙에 비추면

| # | 5장 · 1장 판정 | 가져올 뼈대 | 버릴 것 |
| --- | --- | --- | --- |
| 1 Push Slide | 이동 ○ · 어두워짐(투명도) ○ | **방향.** 앞으로는 오른쪽에서, 뒤로는 왼쪽에서. 거리는 서랍과 같은 6 ~ 24px 이지 화면 폭이 아님 | 화면 폭만큼 미는 것(09-10 결정의 반대) · 옛 화면을 함께 미는 것(두 화면이 동시에 그려져 WebView 가 무거움) |
| 2 Fade Through | 투명도 ○ · `scale` × | 이미 우리 것(페이드만) | 작아지고 커짐 |
| 3 Shared Element | 크기 변화 × · 자리 이동 ○ | **이어짐.** 목록 행의 제목이 상세 머리(`PageHd`)의 제목 자리로 «옮겨 간다» 는 뜻은 우리 결에 맞음. 다만 브라우저 View Transitions 는 기본으로 크기까지 보간하므로 크기 보간을 끄고 자리만 옮기거나, 끄지 못하면 안 씀 | 사진이 날아가 커지는 것 |
| 4 Card Expand | 크기 × | 없음 | 전부 |
| 5 App Zoom | `scale` × | 없음 | 전부 |
| 6 Stagger In | 이동 6px + 투명도 ○ | 이미 우리 것. 상세 화면에서 «사실 블록 묶음» 한 곳에만 | 페이지 뿌리에 거는 것 · 사진 → 제목 → 줄 → 단추처럼 네 층을 다 따로 늦추는 것(5장: 9번째부터 고정) |

---

## 5. 시안 (오너가 고를 것 · 아직 안 만듦)

공통 조건: `transform` · `opacity` 만 · ease-out expo · 반복 없음 · `prefers-reduced-motion` 에서 끔 · 진행선과의 약속(누르는 순간 시작 · 도착하면 내용이 바로 읽혀야 함)은 그대로. 09-10 결정을 되돌리지 않습니다. 내용은 160ms 안에 다 보여야 하고, 방향은 그 160ms 안에서 6px 만 움직입니다.

### A. 방향 있는 페이드 (Push Slide 의 뼈대만 · 폰 앱 목록 → 상세)

- 앞으로 갈 때 새 본문이 **오른쪽 6px** 에서 페이드와 함께 제자리로, 뒤로 갈 때는 **왼쪽 6px** 에서. 시간은 지금과 같은 160ms. 옛 화면은 움직이지 않습니다(다시 붙이는 구조라 옛 화면이 없음).
- 앞 · 뒤 판정: 폰 앱 `bridge.js` 의 `__qatelierBack` 이 뒤로를 처리하므로 거기서 `data-qd-nav="back"` 한 줄을 `html` 에 찍고, 다음 경로 바뀜에서 `PageTransition` 이 읽어 방향 클래스를 고른 뒤 지웁니다. 탭줄 전환(같은 층)은 방향 없이 페이드만.
- 어디에: 폰 앱(WebView)만. 패드 · 데스크톱은 사이드바가 늘 보여 방향이 필요 없고, 09-10 에 «글이 한 번 더 흔들린다» 고 뺀 떠오름과 같은 성질이라 넓게 걸지 않습니다.
- 재는 것: 412 폭 · 다크 · 라이트에서 글이 흐릿한 시간이 160ms 를 넘지 않는지, 진행선 100% 와 본문 등장이 어긋나지 않는지.

### B. 제목이 이어진다 (Shared Element 의 뼈대만 · 시험)

- 목록 행의 제목과 상세 `PageHd` 제목에 같은 `view-transition-name` 을 주고, `::view-transition-group` 의 기본 크기 보간을 끄고(`animation: none` 뒤 위치만 우리 키프레임으로) 자리만 옮깁니다. 글자 크기가 달라 크기 보간을 끄면 옛 · 새 제목이 겹쳐 교차 페이드됩니다. 그것이 읽기에 더 나쁘면 접습니다.
- Next.js 는 15.2 무렵부터 실험 기능으로 View Transitions 를 받습니다(판은 Q-Atelier 에서 확인). 실험 플래그가 필요하면 보류.
- 어디에: 결재함 → 결재 상세 한 흐름에서만 먼저.

### C. 상세 화면 사실 블록 순차 등장 (Stagger In · 이미 있는 어휘의 범위 정리)

- 상세 화면의 `SectionCard` 묶음 하나에만 `.qa-stagger`. 지표 행처럼 형제 대여섯 개. 머리 · 표 · 단추까지 층층이 늦추지 않습니다.
- 지금 어느 화면에 걸려 있는지 세어(`qa-stagger` 사용처 1곳 · 감사 준비 화면) 넓힐 자리를 고릅니다.

### 하지 않을 것

- 커지고 작아지는 전환 넷(Fade Through 의 scale · Shared Element 의 크기 · Card Expand · App Zoom). 1장 «회전 · scale 금지», 그리고 글이 주인공인 화면에서 흐릿한 시간을 늘립니다.
- 화면 폭만큼 미는 밀기. 09-10 에 «출렁임» 으로 뺀 것과 같습니다.
- 옛 화면과 새 화면을 동시에 그리는 전환. WebView 폰에서 무겁고, 우리 구조(다시 붙임)와 맞지 않습니다.

---

## 6. 채택되면 손댈 자리

| 층 | 자리 |
| --- | --- |
| 정본 | `patterns/foundation/atelier.css` 의 `qa-page-fade` 옆에 방향 키프레임 둘(`-fwd` · `-back`) · reduce 블록 |
| 5장 | 키프레임 표에 두 줄 · «우아함은 느림이 아닙니다» 에 «방향은 6px 안에서» 한 줄 |
| 부품 | `source/components/PageTransition.tsx`(Q-Atelier 사본 `components/PageTransition.tsx`)가 방향을 읽어 클래스를 고름 |
| 폰 앱 | Q-Atelier-App `assets/bridge.js` `__qatelierBack` 에서 방향 표시 한 줄 |
| 사본 | `node tools/extract-all.mjs --sync --only=Q-Atelier,Q-Works,Q-Forge` · 앱 오프라인 사본 |
| 확인 | 412 · 다크 · 라이트 · 폰 앱 뒤로 단추 · 움직임 줄이기 · 진행선과 어긋남 없음 · 화면 캡처가 비지 않음(합성 레이어) |

---

## 7. 남은 일

- 시안 A 를 폰 앱 «결재함 → 결재 상세 → 뒤로» 에 입혀 지금(페이드만)과 나란히 녹화해 보여 드립니다. B 는 Next.js 판과 실험 플래그를 먼저 봅니다.
- 영상 본문과 «무료 프롬프트» 는 못 봤습니다. 프롬프트 원문을 주시면 5장과 대조해 2절에 더합니다.
