# Q-Design

Q-Atelier 의 디자인 시스템을 통째로 뽑아 둔 참고용 저장소입니다.
다른 사이트에서 이 언어를 다시 말하게 하려고 만들었습니다.

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
9. [규칙과 계약](docs/09-rules-and-contracts.md) · **테스트가 강제하는 18가지**
10. [옮겨 쓰기](docs/10-porting-guide.md) · 최소 도입부터 전면 이식까지
11. [화면 구조](docs/11-screen-architecture.md) · **아키타입 5종**, 셸, 사이드바, 위젯 보드, 폭 고르기
12. [조합 패턴](docs/12-composition-patterns.md) · 부품이 모여 만드는 덩어리 11가지
13. [얼굴 화면](docs/13-signature-screens.md) · 로그인 입장 연출 5겹, 환영, 작별

문서 6번이 부품 하나하나의 스펙이라면, 11번과 12번은 **그것들을 어떻게 놓는가**입니다.
토큰을 다 옮겨도 화면이 다르게 보인다면 거기를 보십시오.

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
```

그다음 `var(--qa-bg)` · `var(--qa-text)` · `var(--qa-champagne)` 로 칠하면 됩니다.
다크가 기본이고, `<html data-theme="light">` 로 라이트가 됩니다.

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

## 실제 화면

`preview/screens/` 에 Q-Atelier 를 띄워 찍은 화면 다섯 장이 있습니다.
아키타입 대표입니다: 허브 · 목록 · 상세 · 생성 폼 · 현장 모드.
[화면 구조](docs/11-screen-architecture.md) 문서의 내용은 전부 이 사진들에서 나왔습니다.

## 산출물 다시 만들기

원본이 바뀌면 `source/` 를 갱신하고 아래를 돌립니다. 손으로 베끼지 마세요.

```bash
node tools/extract-tokens.mjs
```

스크립트는 뽑기만 하지 않고 검증도 합니다. 다크와 라이트의 변수 집합이 어긋나거나,
줄간격 사다리가 TS 와 CSS 사이에서 갈리거나, 팔레트 사본이 원본과 달라지거나,
배지 높이의 지배 요인이 알려진 값과 달라지면 산출물을 쓰지 않고 실패합니다.

함께 있는 도구 둘.

```bash
node tools/contrast-table.mjs   # 대비 실측표를 계산해서 냅니다 (문서의 숫자 출처)
node tools/check-chars.mjs      # 긴 대시 등 금지 문자 검사 (자체 검출력 시험 포함)
```

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
