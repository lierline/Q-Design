# Q-Design

Q-Atelier 의 디자인 시스템을 통째로 뽑아 둔 참고용 저장소입니다.
다른 사이트에서 이 언어를 다시 말하게 하려고 만들었습니다.

## 업무 화면 다듬기 · 2026-10-03

[업무 아이콘 30종](preview/icons.html): Phosphor Regular 단색 SVG를 메뉴·검색·문서·상태에 적용했다.
[선정과 사용 규칙](docs/26-interface-icons.md), 원본·라이선스는 `vendor/phosphor/`에 있다.
`node tools/build-icons.mjs`로 로컬 자산을 생성하며 제품 운영 배포는 실행하지 않는다.
세 제품의 React 적용본은 `node tools/build-react-icons.mjs`로 만들고,
`python tools/sync-react-icons.py --write`로 사용 아이콘만 내보낸다. 다른 동결 조각은 갱신하지 않는다.

[작동하는 업무 화면 견본](preview/workspace.html)에서 제품·밝기·문서 검색·상태 필터·상세 보기를 확인할 수 있습니다.
작은 글씨와 흐린 행동을 정돈하고, 검토할 일을 먼저 보여주는 배치를 추가했습니다.
실제 공통 CSS를 사용하며, 예시 데이터만 표시합니다.

- 규칙과 적용 범위: [업무 화면 정돈](docs/25-workspace-refinement.md)
- 조합 규칙 원본: [patterns/workspace.css](patterns/workspace.css)
- 재생성: `node tools/extract-screen.mjs` (제품 자동 배포 없음)

기존 부품은 `source/`의 원본 사본에서 추출합니다. 새 조합 규칙은 Q-Design이 소유하고,
`.qd-workspace`를 붙인 화면에서만 적용됩니다. 두 원본의 소유 범위를 구분합니다.

추출일: 2026-09-09 · 원본: `D:\Claude\Q-Atelier` (커밋 `17876c4c`)

---

## 한 줄 요약

**깊은 무채색 위의 샴페인 골드. 에디토리얼 여백, 절제된 모션, 10px 모서리.**
장식이 아니라 «장인의 정밀함» 을 보이려는 시스템입니다.

---

## 무엇이 들어 있나

| 폴더 | 내용 |
|---|---|
| `docs/` | 규칙 문서 10편. **여기서 시작하세요.** |
| `dist/` | 프레임워크 무관 산출물. CSS 변수 파일 + JSON |
| `source/` | 원본 파일 그대로. 문서가 애매하면 여기가 진실입니다 |
| `preview/` | 브라우저로 열어 보는 살아 있는 견본 |
| `tools/` | 산출물 재생성 스크립트 |

## 문서 순서

1. [브랜드 정체성](docs/01-brand-identity.md) · 왜 이렇게 생겼는가
2. [색](docs/02-color.md) · 팔레트 4벌, 대비 규칙, 상태색 7종
3. [타이포그래피](docs/03-typography.md) · 폰트 3종, 크기 사다리, **한글 자간 규칙**
4. [간격과 레이아웃](docs/04-space-layout.md) · 4px 리듬, 셸 폭, 브레이크포인트
5. [모양·깊이·모션](docs/05-shape-elevation-motion.md) · 10px 모서리, 그림자 2계열, 이징
6. [컴포넌트](docs/06-components.md) · 부품 60여 종의 실측 스펙
7. [전역 CSS](docs/07-global-css.md) · 유틸리티 클래스 55종, 키프레임, 인쇄
8. [전문가 포털 테마](docs/08-expert-portal.md) · 각진 모서리를 쓰는 자매 테마
9. [규칙과 계약](docs/09-rules-and-contracts.md) · **테스트가 강제하는 26가지**
10. [옮겨 쓰기](docs/10-porting-guide.md) · 최소 도입부터 전면 이식까지
11. [화면 구조](docs/11-screen-architecture.md) · **아키타입 5종**, 셸, 사이드바, 위젯 보드, 폭 고르기
12. [조합 패턴](docs/12-composition-patterns.md) · 부품이 모여 만드는 덩어리 11가지
13. [얼굴 화면](docs/13-signature-screens.md) · 로그인 입장 연출 5겹, 환영, 작별
14. [시각 참고 자료](docs/14-visual-reference.md) · **실제 화면 22장**, 무엇을 볼지 안내
15. [차림표 정본](docs/15-navigation-canon.md) · 🔴 **설명이 아니라 강제.** 세 제품이 같은 CSS 를 링크합니다
16. [목록 정본](docs/16-list-canon.md) · 🔴 같은 성격. 표 · 항목 카드 · 배지 · 판
17. [화면 뼈대 정본](docs/17-screen-canon.md) · 🔴 같은 성격. 요약 지표 · 구역 이름표 · **폭**
18. [세 제품 정밀 감사](docs/18-audit-2026-09-09.md) · 접근성·자간·구조 실측
19. [AI 티 스크리닝](docs/19-ai-cliche-screening.md) · 시각 클리셰를 찾아 정리한 **판단 자료**
20. [문서 디자인](docs/20-document-design.md) · **문서 브랜드는 둘**. 제품 문서(Q-Atelier) vs 대외 문서(MedQraft)
22. [네 제품 통일성 감사](docs/22-audit-family-2026-09-24.md) · 정본이 CSS 로 쥔 자리는 맞고, 안 쥔 자리에서 갈린다
23. [MedQraft 종이 문서 양식 v8](docs/23-medqraft-paper-document-v8.md) · 회사 문서 양식 규격서 v8 에서 뽑은 판형 · 글자 · 표 · 쪽 넘김. 종이 위 금색 글자는 `#8C6C27`
24. [문서 결 정본](docs/24-document-grain.md) · 🔴 **왼쪽 강조선을 없앤다**(2026-09-27 오너 결정). 결재는 가로 결재 길, 강조는 괘선 목록 · 금색 라벨 강조문 · 요약표, 열 많은 목록은 장부 표. 원칙 «현혹보다 깔끔하게 잘 보이게»

문서 6번이 부품 하나하나의 스펙이라면, 11번과 12번은 **그것들을 어떻게 놓는가**입니다.
토큰을 다 옮겨도 화면이 다르게 보인다면 거기를 보십시오.

15~17번만 성격이 다릅니다. 다른 문서는 「이렇게 생겼습니다」를 적지만, 이 셋은
`dist/q-design.{nav,list,screen}.css` 세 파일로 **화면을 실제로 묶습니다.**
Q-Sonar 와 Q-Forge 가 그 파일을 그대로 링크하고, 각 저장소의 검사가 사본의
지문을 대조합니다.

```bash
node tools/extract-nav.mjs && node tools/extract-list.mjs && node tools/extract-screen.mjs
node tools/sync.mjs --write     # 두 제품으로 내보냅니다
node tools/shoot-rails.mjs      # 세 제품을 띄워 나란히 찍습니다
```

## 「다 뽑혔나」

주장이 아니라 실측으로 답하도록 감사 도구를 두었습니다.

```bash
node tools/audit-coverage.mjs
```

여섯 축(키프레임 · CSS 파일 · `<style>` 블록 파일 · `lib/design` · 브랜드 자산 · 폰트)을
원본과 대조하고, 하나라도 빠지면 실패합니다. 감사 자신이 「빈 그물」이 아닌지도 먼저 시험합니다.

현재: **누락 없음** (키프레임 46 · CSS 2 · style 파일 28 · lib/design 25 · 브랜드 자산 10 · 폰트 1)

> ⚠️ **키프레임은 46종이고 27종은 CSS 파일에 없습니다.**
> 스타일이 인라인 객체 위주라 컴포넌트 안의 `<style>` 블록에 들어갑니다.
> `globals.css` 만 읽으면 절반 이상을 놓칩니다.
> 어디에 무엇이 있는지는 [`dist/inline-styles-index.md`](dist/inline-styles-index.md) 를 보십시오.

## 가장 빨리 쓰는 법

```html
<link rel="stylesheet" href="dist/q-design.tokens.css">
<link rel="stylesheet" href="dist/q-design.nav.css">
<link rel="stylesheet" href="dist/q-design.list.css">
<link rel="stylesheet" href="dist/q-design.screen.css">
```

그다음 `var(--qa-bg)` · `var(--qa-text)` · `var(--qa-champagne)` 로 칠하면 됩니다.
다크가 기본이고, `<html data-theme="light">` 로 라이트가 됩니다.

차림표 · 목록 · 요약 지표는 뒤의 세 파일이 통째로 그립니다. 클래스 이름과 뼈대는
[15](docs/15-navigation-canon.md) · [16](docs/16-list-canon.md) ·
[17](docs/17-screen-canon.md) 에 있습니다.

폰트는 `source/fonts/PretendardVariable.woff2` 를 함께 실어야 같은 얼굴이 됩니다.

## 견본 보기

`preview/index.html` 이 살아 있는 견본입니다. **원본 `globals.css` 를 그대로 링크**하므로
소스가 바뀌면 견본도 함께 바뀝니다 (사본이 아닙니다).

상대 경로로 원본 CSS 와 폰트를 참조하기 때문에 `file://` 로 열면 스타일이 안 붙습니다.
저장소 루트에서 서버를 띄우십시오.

```bash
python -m http.server 4800 --directory D:/Claude/Q-Design
```

그다음 `http://localhost:4800/preview/index.html` 을 엽니다.
오른쪽 위 버튼으로 다크와 라이트를 오갑니다.

담긴 것: 팔레트 스와치 · 상태색 7종 · 타이포 사다리 · **한글 자간 비교** ·
버튼 7종 · 입력 · 배지 3층위 × 3크기 · KPI · 알림 3종 · 스켈레톤 시머 · 진행바 · 빈 상태.

## 실제 화면 22장

`preview/screens/` 에 Q-Atelier 를 띄워 찍은 화면이 있습니다.
다크 16 · 라이트 4 · 토큰 견본 2.

허브 · 목록 · 상세 · 폼 · 현장 모드 같은 아키타입뿐 아니라
점수 대시보드 · 교차 매트릭스 · 필터가 붙은 표 · 기한 추적처럼 **패턴이 다른 화면**도 담았습니다.

**어느 이미지에서 무엇을 볼지는 [14번 문서](docs/14-visual-reference.md)에 있습니다.**
「이런 화면을 만들고 싶다」로 찾아 들어가는 표를 앞에 두었습니다.
[화면 구조](docs/11-screen-architecture.md) 문서의 내용도 전부 이 사진들에서 나왔습니다.

## 산출물 다시 만들기

명령은 **하나**입니다. 손으로 베끼지 마세요.

```bash
node tools/extract-all.mjs --sync
```

순서가 중요합니다. 맨 앞이 `source/` 를 원본 저장소의 **커밋된** 내용으로 맞추는 단계입니다.
사본이 낡으면 그 뒤가 전부 «낡은 것에서 정확히 파생된» 값이 되고, 그것은 실패가 아니라
**초록불**로 나옵니다. 가장 위험한 실패 형태라 맨 앞에 두었습니다.

```
원본 사본 → 토큰 → 글꼴 → 대비 문서 → 문서 토큰 → 차림표·목록·뼈대 → 인라인 색인
→ 금지 문자 → 세 제품으로 내보내기 → «정말 같아졌는지» 재확인
```

스크립트는 뽑기만 하지 않고 검증도 합니다. 다크와 라이트의 변수 집합이 어긋나거나,
줄간격 사다리가 TS 와 CSS 사이에서 갈리거나, 팔레트 사본이 원본과 달라지거나,
배지 높이의 지배 요인이 알려진 값과 달라지면 산출물을 쓰지 않고 실패합니다.

아무것도 쓰지 않고 «어긋난 곳» 만 보려면 이렇게 합니다.

```bash
node tools/extract-all.mjs --check
```

낱개로 부를 수 있는 것들.

```bash
node tools/refresh-source.mjs      # source/ 가 원본과 같은가 (--write 로 맞춤)
node tools/audit-coverage.mjs      # 「다 뽑았나」에 숫자로 답합니다 (제품별 색 커버리지 포함)
node tools/extract-ramp.mjs        # Q 계열이 쓰는 샴페인 계단 (--write)
node tools/converge.mjs Q-Forge    # 그 제품의 정본 밖 색을 모읍니다 (--write / --adopt)
node tools/contrast-table.mjs      # 대비 실측표 (--write 로 docs/02 에 직접 씀)
node tools/check-chars.mjs         # 긴 대시 등 금지 문자 검사 (자체 검출력 시험 포함)
node tools/check-voice.mjs         # 화면 글의 종결 검사 (자체 검출력 시험 포함)
node tools/verify-fonts.mjs        # 글꼴이 «이름만» 이 아니라 실제로 그려지는가
node tools/app-icons.mjs           # 네 제품 앱 아이콘(홈 화면 · 파비콘). --write 로 제품 public 에 씀
```

> 🔑 **제품 앱 아이콘**(2026-09-25 오너 결정): 네 제품이 같은 크롬 붓 Q 를 쓰고 **금속 색 + 상징 틀**로
> 갈립니다. Q-Atelier 은 · 원 / Q-Maison 샴페인 금 · 집 / Q-Carnet 구리 · 수첩 / Q-Sonar 강철 청 · 음파.
> 견본은 `dist/app-icons/sheet.png`, 규칙은 `tools/app-icons.mjs` 머리에 있습니다.

> 🔴 **문서의 숫자를 손으로 고치지 마십시오.** `docs/02-color.md` 의 표 세 벌은
> `<!-- 생성:이름 -->` 표시 사이에 도구가 씁니다. 손으로 고치면 다음 실행에 덮어씁니다.

## 이 시스템을 다룰 때 먼저 알아야 할 세 가지

**rem 기준은 16px 이 아니라 14px 입니다.**
`body { font-size: 14px }` 이므로 `0.9375rem` 은 15px 이 아니라 13.125px 입니다.
이걸 모르고 환산하면 타이포 계산이 전부 틀립니다.

**한글에는 자간을 주지 않습니다.**
대문자 변환과 넓은 자간은 라틴 약어 라벨을 위한 장치입니다. 한글에 걸면 낱글자로 흩어집니다.
원본은 이걸 `labelTracking()` 함수로 강제합니다.

**색은 두 곳에 살고, 계약이 둘을 묶고 있습니다.**
`tokens.ts` 의 hex 와 `globals.css` 의 CSS 변수는 같은 사실의 사본입니다.
한쪽만 고치면 테스트가 실패하도록 되어 있습니다. 옮겨 쓸 때도 이 구조를 유지하는 편이 낫습니다.
