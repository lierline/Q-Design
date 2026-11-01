# @ui_motion_prompts 훑어보기 · 미세 상호작용 연출 묶음

조사일: 2026-11-01. 출처: 인스타그램 [@ui_motion_prompts](https://www.instagram.com/ui_motion_prompts/) 의 릴스 둘과 같은 이름의 판매 사이트 [uimotionprompts.com](https://uimotionprompts.com/).
오빠 지시 «이 사람 게시글 좀 한번 훑어봐. 좋은 게 많네». 규칙이 아니라 참고라 이 폴더에 둡니다. 정본 값은 바꾸지 않았습니다.

> **한 줄 요약.** 이 계정은 «AI 코딩 도구에 붙여 넣는 움직임 프롬프트» 를 파는 곳입니다. 릴스는 주제 하나(탭줄 · 단추)에 연출 여섯을 번호로 보여 주고 「당신 앱이라면 몇 번?」 하고 묻습니다.
> 우리와 겹치는 것은 **이징 곡선이 같다**는 것(`cubic-bezier(0.16, 1, 0.3, 1)` · 5장과 같은 값) 하나이고, 나머지는 거의 반대편입니다(스프링 · 알약 · 그라디언트 · 글로우 · 입자 · 반복 루프).
> 가져올 것은 연출이 아니라 **묻는 법**(주제 하나 · 후보 여섯 · 번호로 고르기)과 **프롬프트의 짜임**(라이브러리 · 이징 · 시간 · 상태 · 어긋남 간격을 적어야 평범한 페이드가 안 나온다)입니다.

---

## 1. 무엇을 읽었고 무엇을 못 읽었나

| 자료 | 읽음 | 비고 |
| --- | --- | --- |
| 릴스 «Tab Bar Part 1» | ○ 표지 | 따로 적었습니다: [아래 탭줄 움직임 조사](tabbar-motion-study.md) |
| 릴스 «Button Part 2» | ○ 표지 | 아래 2절. 캡션 «buttons that do something after the tap» |
| 계정의 나머지 게시물 | × | 프로필은 로그인 벽(429 · 임베드도 목록을 안 내줌). «Part 1 · 2» 로 미루어 주제별 연재입니다 |
| 영상 본문 | × | 둘 다 «Watch on Instagram» 만. 시간 · 이징은 표지 설명에서 읽히는 만큼 |
| 사이트 카탈로그(27종) | ○ | 아래 3절. 묶음 €99 · 낱개 €9.99 ~ 49.99 · 프롬프트 `.md` + React `.tsx` (+ Rive 파일) |
| 사이트 블로그 «vibe-coded 앱에 움직임 더하기» | ○ | 아래 4절. 프롬프트 짜임과 값 셋 |

---

## 2. 릴스 «Button Part 2» 여섯 (표지에서 읽음)

캡션 원문: «Button Part 2 — buttons that do something after the tap. Which one would you use? Comment the number».

| # | 이름 | 표지 설명(원문) | 5장 · 9장 판정 | 우리 자리 |
| --- | --- | --- | --- | --- |
| 1 | Hold to Confirm | Hold it down: a ring fills around the button, then it turns into a ✓. | 고리 채움은 `stroke-dashoffset`(이동 계열) ○ · ✓ 로 바뀜 ○ | **파괴 동작**(삭제 · 폐기)에 맞습니다. 지금은 «지울까요?» 확인 창(층 10001). 길게 누르기는 창 없이 실수를 막는 또 다른 길이지만, 키보드 · 보조기기에서는 길게 누르기가 없어 창을 없애지는 못합니다. 창 안의 «지우기» 단추에만 붙이는 변형은 가능 |
| 2 | Paper Plane | The paper plane flies off with a trail and the label flips to "Sent!". | 날아감 ○(이동 + 투명도) · 꼬리(trail) × · 글자 뒤집힘(flip = 회전) × | 제출 · 보내기 뒤의 «보냈습니다» 는 우리 `Btn pending` → 알림(토스트)이 맡습니다. 단추 글자를 바꾸는 것은 6장 «제출 실패는 단추 위에 남는 요약으로» 와 결이 다름 |
| 3 | Confetti Burst | A tap bursts confetti out of the button; the pieces flutter and fall. | 입자 × | 안 씁니다. 심사원이 보는 도구에 축하 연출은 없습니다 |
| 4 | Copy Feedback | The copy icon morphs into a ✓ and a "Copied!" tooltip pops up. | 아이콘 교체 ○(투명도 교차) · 변형(morph) × · 팝(scale) × | **쓸 만합니다.** 문서 번호 · UDI · 링크 «복사» 자리. 지금은 복사 뒤 알림이 뜹니다. 아이콘이 ✓ 로 바뀌고 1.2초 뒤 돌아오는 것이 알림보다 조용합니다(5장 «끝 상태를 1.2초 이상 멈춤» 과 짝). 툴팁 팝은 우리 `qa-tip-rise`(2px 떠오름)로 |
| 5 | Shine Sweep | A diagonal shine sweeps across the button and sparkles twinkle. | 빛 쓸기 × · 반짝임 × | 안 씁니다. 골드 그라디언트조차 얼굴 화면 전용(1장) |
| 6 | Slide to Confirm | Drag the knob to the end: the track fills and the knob turns into a ✓. | 끌기 ○(이동) · 채움 ○ | 파괴 동작의 또 다른 길. 다만 폰 한 손 · 패드 마우스 양쪽에서 끌기는 부담이고, 키보드 대안이 필요합니다. 1 보다 낫지 않음 |

여섯 중 살아남는 것은 **4(복사 피드백)** 하나와, 파괴 확인 창 안에 한정한 **1(길게 눌러 확인)** 의 변형입니다.

---

## 3. 사이트 카탈로그 27종을 우리 결에 비추면

사이트가 묶음을 나누지 않아 제가 묶었습니다. 판정은 5장(이동 · 투명도만 · 회전 · scale 금지 · 반복 금지)과 9장(보라 그라데이션 · 네온 · 글래스 · pill · 이모지 금지)입니다.

### 뼈대만 가져올 수 있는 것 (4)

| 항목 | 사이트 설명 | 가져올 뼈대 | 버릴 것 |
| --- | --- | --- | --- |
| See More Interaction | 높이 전환으로 펼치는 구역 | 우리 `Collapse` 가 이미 함(접기 · 펼치기 곡선 `(0.22, 1, 0.36, 1)`) | 없음. 확인만 |
| Thinking Orbs | 채팅 · 에이전트용 로딩 상태 아홉 | «AI 가 생각 중» 상태를 글자가 아니라 **면의 숨쉬기**로 (우리 `Skeleton` 1.6s 투명도 맥박과 같은 생각) | 구슬 · 글로우 · 색 |
| Animated Nav Icons | 차림표 아이콘 다섯이 저마다 움직임(굴뚝 연기 · 말풍선 점 · 종) | **종 아이콘만**: 새 알림이 올 때 1회 ±3px 흔들림(우리 `qa-toast-shake` 240ms 어휘) | 상시 반복 · 나머지 넷 |
| Copy Feedback(릴스 4) | 복사 아이콘 → ✓ | 위 2절 | 변형 · 팝 |

### 우리에게 이미 다른 답이 있는 것 (5)

| 항목 | 우리 답 |
| --- | --- |
| Liquid Segmented Control(손잡이가 늘어나며 옮겨감) | `SegmentedChoice` · `WorkspaceTab`. 늘림 없이 선택 면만 바뀜. 탭줄 시안 A(금선 이동)가 이 뼈대의 우리 판 |
| Mute Bell · Lock · Walking Figure Toggle(아이콘이 연기하는 토글) | `Switch` 52×28 · 160ms. 상태는 손잡이 위치 하나로. 아이콘 연기는 두 상태를 세 번째 그림으로 가려 심사 기록 화면에 맞지 않음 |
| Star Rating(튀는 별 · 다섯째에 반짝임) | 평점 입력이 없음. 있더라도 `SegmentedChoice` |
| Voice Input · Voice Glow | 음성 입력 없음 |
| Carousel Card(끌기 · 스냅) | 목록은 세로 스크롤 · 가로는 `.qd-table-scroll` 잘림 표시. 회전목마는 쓰지 않음(7장 «이 시스템이 안 하는 것») |

### 결이 반대라 안 가져오는 것 (18)

Emoji Reactions · Magnetic Hover Link(스프링 끌림 + scale) · Publish Button Icon(로켓) · Springy Icon Hover · Line Icon Set(아이콘마다 호버 연기) · Delivery Scooter · Star Burst · Basket & Cart · Web Icons Pack · Travel Icons Pack · 3D Game Icons(떠다니는 루프) · Pixel Image Loader(WebGL) · Bot Avatars(광택 18종) · Pointer-Tracking Face · Border Beam(테두리 도는 빛) · Liquid Metal(반사 · 커서 빛) · Confetti · Shine Sweep.

까닭은 셋으로 모입니다. ① **반복 루프**(떠다님 · 도는 빛 · 걷는 사람): 5장 «계속 깜빡이는 표시는 불편». ② **광택 · 글로우 · 반사 · 3D**: 9장 금지 목록이고 1장 «따뜻한 고급감» 과 반대(금속은 «빛이 스치는 안쪽 흰 선 1px» 로만). ③ **아이콘이 연기함**: 업무 아이콘(9장)은 글자 옆에 서는 보조이지 주인공이 아닙니다.

---

## 4. 그들의 프롬프트 짜임 (블로그에서)

> 「"Add a hover effect to the card component" 라고 하면 generic fade-in 이 나온다. 라이브러리 · 이징 곡선 · 시간 · 상호작용(hover · click · enter/exit) · 자식 어긋남 간격 · 스프링 값을 적어 줘야 한다.」

블로그가 밝힌 값은 셋뿐입니다.

| 값 | 그들 | 우리(5장) |
| --- | --- | --- |
| 이징 | `cubic-bezier(0.16, 1, 0.3, 1)` | **같은 값**(`--qd-ease` · ease-out expo) |
| 스프링 | damping 20 · stiffness 300 | 안 씀(출렁임 없음) |
| 자식 어긋남 | 50ms | `.qa-stagger` 35ms · 9번째부터 고정 |
| 시간 | 적지 않음 | 120 · 200 · 320 · 480ms |
| 움직임 줄이기 | 적지 않음 | 전역 규칙 + 무한 반복은 개별 `animation: none` |
| 성능(transform · opacity 만) | 적지 않음 | 1장 원칙 ③ |

**이 표가 이 문서의 요점입니다.** 그들 프롬프트가 «적어야 한다» 고 하는 것이 5장에 이미 다 있고, 그들이 비워 둔 칸(시간 · 움직임 줄이기 · 성능)을 우리는 채워 두었습니다. 그러니 우리 제품에 움직임을 시킬 때 사야 할 것은 없고, **5장을 그대로 프롬프트로 붙이면 됩니다.** [움직임 브리프 조사](motion-brief-study.md) 7절의 «5 움직임» 줄이 그것입니다.

---

## 5. 가져올 것 · 안 가져올 것

### 가져올 것 (쓰는 법)

1. **묻는 법.** 주제 하나에 후보 여섯을 번호로 나란히 보여 주고 고르게 하는 꼴. 우리 «바꿈» 갈래(시안을 먼저 보여 드리고 오너가 고름)와 같습니다. 탭줄 시안 A · B · C 를 그 꼴(한 장에 나란히 · 번호)로 만들어 보여 드립니다.
2. **복사 피드백.** 복사 단추 아이콘이 ✓ 로 바뀌고 1.2초 뒤 돌아옴(투명도 교차 · 팝 없음). 알림(토스트)보다 조용합니다. 어디서 복사 뒤 알림을 띄우는지 세어 본 뒤 «바꿈» 후보로.
3. **종 아이콘 1회 흔들림.** 새 알림 도착 때 ±3px 240ms 한 번(`qa-toast-shake` 어휘). 반복 없음.
4. **AI 생각 중은 면의 숨쉬기.** 글자(「생각 중…」)가 아니라 `Skeleton` 처럼 면이 숨 쉼. 이미 우리 어휘.
5. **5장을 프롬프트로.** 바깥 도구에 움직임을 시킬 때 5장(곡선 · 시간 · 금지 · 줄이기)을 그대로 붙입니다.

### 안 가져올 것

스프링 · 바운스 · 늘림 · 팝 · 회전(flip) · 알약 · 그라디언트 · 글로우 · 반사 · 3D · 입자(색종이 · 거품 · 반짝임) · 반복 루프 · 연기하는 아이콘 · 회전목마 · 끌어서 확인.

---

## 6. 남은 일

- 탭줄 시안 셋을 «한 장에 여섯 번호» 꼴로 만들어 보여 드립니다([아래 탭줄 움직임 조사](tabbar-motion-study.md) 7절).
- 복사 뒤 알림을 띄우는 자리(세 제품)를 세어 «복사 피드백» 을 «바꿈» 후보로 올립니다.
- 계정의 다른 연재(Button Part 1 · 그 밖)는 못 봤습니다. 주소를 주시면 같은 표로 더합니다.
