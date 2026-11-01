# 아래 탭줄 움직임 조사 · Tab Bar Part 1 (@ui_motion_prompts)

조사일: 2026-11-01. 출처: 인스타그램 [릴스 @ui_motion_prompts «Tab Bar Part 1»](https://www.instagram.com/reel/DfLt74CjduQ/) (탭 전환 연출 여섯 · 영문 · 일문).
오빠 지시 «우리 어플 하단부 메뉴 애니메이션 공부». 규칙이 아니라 참고라 이 폴더에 둡니다. 정본 값은 바꾸지 않았습니다.
«우리 어플» 은 Q-Atelier 폰 앱(WebView · [Q-Atelier-App](../../../Q-Atelier-App/README.md))이 띄우는 사이트의 아래 탭줄 `MobileBottomNav`(`.qa-mobile-tabbar`)입니다.

> **한 줄 요약.** 여섯 연출은 전부 «활성 표시가 어디에 있는지» 를 움직임으로 알리는 것이고, 쓰는 수단이 다릅니다(이동 · 늘림 · 액체 변형 · 채움 · 폭 · 입자).
> 우리 탭줄은 지금 **움직임이 없습니다.** 활성 표시 넷(글자색 · 2px 상단 금선 · 획 굵기 · 굵기)이 동시에 즉시 바뀌고 글자색만 140ms 입니다.
> 5장 규칙(이동 · 투명도만, 회전 · scale 금지, 사이드바 밑줄 1회 펼침은 예외) 안에서 가능한 것은 셋입니다: **금선이 미끄러짐(A) · 금선이 1회 펼쳐짐(B) · 아이콘 뒤 면이 투명도로 채워짐(C).** «바꿈» 갈래라 시안을 입혀 보여 드리고 오너가 고릅니다.

---

## 1. 무엇을 읽었고 무엇을 못 읽었나

| 자료 | 읽음 | 비고 |
| --- | --- | --- |
| 캡션 | ○ | «Tab Bar Part 1 · tab switching animations for your app. Which one would you use? Comment the number». 일문 같은 뜻. 태그 #uidesign #microinteractions #vibecoding |
| 표지 프레임(1080×1920) | ○ | 여섯 연출의 이름 · 한 줄 설명 · 정지 그림이 전부 들어 있습니다. 아래 2절. |
| 영상 본문(움직이는 모습) | × | 임베드는 «Watch on Instagram» 만 내주고 동영상 주소가 없습니다(로그인 벽). 시간 · 이징은 표지 설명에서 읽히는 만큼만 적었습니다. |
| 프롬프트(계정 이름이 «prompts») | × | 표지와 캡션에 없습니다. DM 이나 다른 글로 주는 듯합니다. |

---

## 2. 여섯 연출 (표지에서 읽음)

표지의 탭줄은 넷(홈 · 찾기 · 좋아요 · 프로필)이 든 알약 모양이고, 활성색은 보라 → 시안 그라디언트, 바탕은 어두운 남색입니다.

| # | 이름 | 표지 설명(원문) | 무엇이 움직이나 | 쓰는 수단 |
| --- | --- | --- | --- | --- |
| 1 | Sliding Pill | A violet→cyan pill springs to the tapped tab, stretching as it slides. | 활성 알약 하나가 탭 사이를 미끄러지며 늘어났다 줄어듦 | `translateX` + `scaleX` 스프링 · 그라디언트 면 |
| 2 | Liquid Bulge | The bar bulges like liquid under the active tab, and the bulge flows over. | 탭줄 윗선이 액체처럼 부풀어 활성 탭 쪽으로 흐름 | SVG 경로 변형(morph) · 탭줄 밖으로 넘침 |
| 3 | Floating Notch | A floating ball rides a curved notch to the new tab, hopping on the way. | 탭줄 위에 뜬 공이 홈을 타고 옮겨 가며 한 번 뜀 | 공 `translateX` + 포물선 `translateY` · 홈은 경로 변형 |
| 4 | Icon Fill | The tapped icon fills violet→cyan from its center, pops, and gains a dot. | 아이콘이 가운데서 채워지고 한 번 커졌다 돌아오며 아래 점이 생김 | 마스크 채움 · `scale` 팝 · 점 등장 |
| 5 | Expanding Label | The active tab grows into a pill and its label slides out. Others shrink. | 활성 탭이 알약으로 넓어지며 이름이 옆으로 나오고 나머지는 좁아짐 | 폭(`width`) 애니메이션 · 글자 등장 · 다른 탭 재배치 |
| 6 | Bubble Float | The tapped icon lifts and glows while bubbles float up from it and pop. | 아이콘이 떠오르며 빛나고 거품이 올라가 터짐 | `translateY` + 글로우 + 입자 |

공통점 둘. ① 전부 **활성 표시의 위치를 움직임으로** 알립니다(「어디로 갔나」 를 눈이 따라감). ② 다섯이 **알약 · 그라디언트 · 글로우** 중 하나 이상을 씁니다. 9장 «AI 티 거르기» 의 금지 목록(보라 그라데이션 · 네온 · pill)과 그대로 겹칩니다. 그 계정은 SNS 용 «예쁜 연출» 모음이고, 우리는 심사원이 쓰는 업무 도구라 걸러 가져옵니다.

---

## 3. 우리 탭줄의 지금 (코드 실측)

Q-Atelier `components/MobileBottomNav.tsx` 와 정본 사본 `dist/q-design.foundation.atelier.css` 의 값입니다.

| 자리 | 지금 |
| --- | --- |
| 틀 | `position: fixed; bottom: 0` · 면 `surface` · 위 1px `border` 선 · 안전 영역 `env(safe-area-inset-bottom)` · 층 `Z.bottomNav`(400) · 흐림 없음(`--qd-surface-filter: none`) |
| 탭 | `<a>` 링크 · `flex: 1` · 세로 쌓기 · 안쪽 여백 `10px 4px` · 아이콘 20(감싸개 24×20) · 이름 12px mono 자간 0.3 |
| 활성 표시 | 글자색 `muted` → `champagne` · 위 2px 금선(`border-top`, 비활성은 투명 2px 로 자리만 차지) · 아이콘 획 1.6 → 1.9 · 이름 굵기 400 → 600 |
| 움직임 | `transition: color 140ms ease` 하나. 금선 · 획 · 굵기는 즉시 바뀜 |
| 탭 수 | 폰 브라우저 4 + 더보기(현장 조직은 5 ~ 6) · **폰 앱은 2 ~ 3**(결재함 · 알림 · 운영진은 운영) |
| 뒤로 | 폰 앱 `assets/bridge.js` 가 `.qa-mobile-tabbar` 클래스와 탭 링크 주소로 «탭 화면» 을 읽어 뒤로 두 번이면 앱을 닫음 |

즉 지금은 **전환 연출이 없습니다.** 누르면 다른 탭의 금선이 사라지고 새 탭의 금선이 나타나는데 둘 사이에 이음이 없어 «옮겨 갔다» 가 아니라 «바뀌었다» 로 읽힙니다. 폰 앱은 탭이 둘뿐이라 이것이 더 두드러집니다(왼쪽 끝 ↔ 가운데).

같은 집의 선례: 사이드바 선택 밑줄은 2026-09-27 오너 결정 «문서 결» 로 **진입 때 한 번 왼쪽부터 펼쳐지고**(`qa-nav-active-underline-in` · scaleX 0 → 1 · 320ms · ease-out expo · 1회) 종전의 금색 점 펄스(`qa-nav-active-dot`)는 걷었습니다. 「계속 깜빡이는 표시는 불편」 이 그때의 까닭입니다(5장).

---

## 4. 여섯을 우리 규칙에 비추면

| # | 5장 · 9장 판정 | 가져올 뼈대 | 버릴 것 |
| --- | --- | --- | --- |
| 1 Sliding Pill | 이동 ○ · 늘림(scale) × · 그라디언트 × · 알약 × | **활성 표시 하나가 탭 사이를 이동한다** | 늘림 · 스프링 출렁임 · 그라디언트 · 알약 면 |
| 2 Liquid Bulge | 경로 변형 × · 틀 밖 넘침 × | 없음 | 전부. 「우아함은 느림이 아닙니다」 의 반대편 |
| 3 Floating Notch | 뜀(포물선) × · 틀 밖 공 × | 없음 | 전부. 공이 본문 위로 튀어나와 저장 단추 · 액션바(`field-ui`)를 덮음 |
| 4 Icon Fill | 채움 △(투명도로 바꾸면 ○) · 팝(scale) × · 점 ×(걷어낸 `nav-active-dot` 과 같음) | **아이콘이 «채워진다» 는 느낌을 투명도로** | 팝 · 점 · 그라디언트 |
| 5 Expanding Label | 폭 애니메이션 × (재배치 · 다른 탭 누름 자리가 움직여 오탭) · 이름 숨김 × (A71 결정: 이름 12px 로 키움) | 없음 | 전부 |
| 6 Bubble Float | 글로우 × · 입자 × · 떠오름 ○ | 떠오름 6px 는 이미 우리 어휘 | 글로우 · 입자 |

살아남는 뼈대는 둘입니다. **표시가 이동한다(1)** 와 **채움을 투명도로(4)**. 거기에 우리 선례(사이드바 밑줄 1회 펼침)를 더해 시안 셋이 됩니다.

---

## 5. 시안 셋 (오너가 고를 것 · 아직 안 만듦)

공통 조건: `transform` · `opacity` 만(합성 레이어 · WebView 에서 매끄러움) · `cubic-bezier(0.16, 1, 0.3, 1)` · 320ms 안팎 · 반복 없음 · `prefers-reduced-motion` 에서 `animation: none` · 탭의 DOM 꼴(`nav.qa-mobile-tabbar > a`)과 누름 자리 44 는 그대로(폰 앱 `bridge.js` 가 읽음).

### A. 금선이 미끄러진다 (Sliding Pill 의 뼈대를 «선» 으로)

- 탭마다 금선을 두지 않고 탭줄에 **금선 하나**(2px · `champagne`)를 두고, 활성 탭의 자리로 `translateX` 로 옮깁니다. 폭은 탭 하나(`100% / n`).
- 320ms ease-out expo. 늘림 없음. 첫 그림(SSR)에서는 활성 자리에 바로 놓여 있고, 누를 때만 움직입니다.
- 장점: 「어디로 갔나」 가 보입니다. 폰 앱처럼 탭이 둘이면 이동 거리가 커서 효과가 분명합니다. 우리 어휘(선 · 금 · 이동)만 씁니다.
- 주의: `flex: 1` 이라 폭이 같아야 합니다(지금 같음). 더보기 단추도 같은 폭이라 `n` 에 셉니다. 화면 폭이 바뀌면(회전) 위치를 다시 잽니다.

### B. 금선이 한 번 펼쳐진다 (사이드바 밑줄과 같은 말)

- 새 활성 탭의 위 금선이 왼쪽부터 `scaleX(0 → 1)` 320ms 1회. 지난 탭의 금선은 즉시 사라집니다.
- 이미 허용된 예외(5장 «회전 금지 · scale 금지» 의 예외 셋째)라 규칙을 늘리지 않습니다. 가장 작은 변경입니다. 사이드바(패드 · 데스크톱)와 폰이 같은 말을 하게 됩니다.
- 단점: 이동이 없어 「어디서 왔나」 는 안 보입니다.

### C. 아이콘 뒤 면이 투명도로 채워진다 (Icon Fill 의 뼈대를 투명도로)

- 활성 아이콘 뒤에 `champagne` 10% 를 섞은 면(24×20 감싸개 · 모서리 `--qd-radius` 10px · **알약 아님**)을 두고 `opacity 0 → 1` 200ms. 획 1.6 → 1.9 도 같은 시간에 `transition` 으로.
- 금선(A 또는 B)과 함께 쓸 수 있습니다. 혼자 쓰면 금선과 면 둘 다 금색이라 「한 화면에 강조 하나」 와 부딪힐 수 있어, 함께 쓸 때는 금선을 빼거나 면을 `brand-tint` 로 낮춥니다.
- 주의: 배지(검토함 빨간 수)가 아이콘 감싸개 오른쪽 위에 있어 면이 배지와 겹치지 않는지 봅니다.

### 하지 않을 것

- 알약 · 그라디언트 · 글로우 · 입자 · 액체 변형 · 뜀 · 팝. 9장 금지 목록이고 업무 도구의 결이 아닙니다.
- 폭 애니메이션과 이름 숨김(5). 누름 자리가 움직이면 한 손 조작에서 오탭이 나고, 이름은 A71 결정으로 키운 것입니다.
- 반복되는 표시(점 펄스 등). 09-27 에 걷은 것입니다.

---

## 6. 채택되면 손댈 자리

| 층 | 자리 |
| --- | --- |
| 정본 | `patterns/foundation/atelier.css` 에 키프레임 · 클래스(이름 후보 `qa-tabbar-active-line`) · `prefers-reduced-motion` 한 줄 |
| 5장 | 키프레임 표에 한 줄(클래스 · 움직임 · 시간) · 예외 목록 갱신(A 는 이동이라 예외가 아님, B 는 기존 예외 안) |
| 6장 | 부품 등록부의 아래 탭줄 줄 |
| 제품 | Q-Atelier `components/MobileBottomNav.tsx`: 인라인 `borderTop` 대신 클래스. 전문가 포털 `app/experts/inbox/bottom-nav.tsx` 는 따로 CSS(`ExpertShell`)라 같이 봄 |
| 사본 | `node tools/extract-all.mjs --sync --only=Q-Atelier,Q-Works,Q-Forge` · 앱 오프라인 사본 |
| 확인 | 412 · 다크 · 라이트 · 폰 앱(탭 2 ~ 3) · 움직임 줄이기 · 뒤로 두 번 닫힘이 그대로인지 |

---

## 7. 남은 일

- 시안 A · B · C 를 실제 탭줄(412 폭 · 다크 · 라이트 · 폰 앱 탭 2개)에 입혀 짧게 녹화해 오너께 보여 드리고 번호로 고르게 합니다. 릴스의 «Which one would you use? Comment the number» 와 같은 방식입니다.
- 영상 본문(실제 움직임 · 시간)은 못 봤습니다. 오빠가 화면 녹화를 주시면 시간 · 이징을 이 문서 2절에 더합니다.
