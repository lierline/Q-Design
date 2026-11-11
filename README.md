# Q-Design

MedQraft 제품군의 디자인 정본입니다. 네 제품이 같은 집안으로 보이게 하는 규칙과,
그 규칙에서 나오는 산출물(CSS · JSON · TS · 글꼴 · 아이콘)을 한곳에서 만들고 제품으로 내보냅니다.

**깊은 무채색 위의 샴페인 골드. 에디토리얼 여백, 절제된 모션, 10px 모서리.**
장식이 아니라 «장인의 정밀함» 을 보이려는 시스템입니다.

| 제품 | 저장소 폴더 | 판 이름 |
|---|---|---|
| Q-Atelier | `D:/Claude/Q-Atelier` | Q-Atelier |
| Q-Maison | `D:/Claude/Q-Works` | Q-Works |
| Q-Carnet | `D:/Claude/DHR` | Q-Forge |
| Q-Sonar | `D:/Claude/Lead-Radar` | Q-Sonar |

판 이름은 `tools/sync-parts.mjs` 와 제품의 판 파일이 쓰는 이름입니다.

---

## 정본 10장

규칙은 이 열 장에만 있습니다. 값을 손으로 옮겨 적지 않고, 표의 숫자는 도구가 산출물에서 뽑아 씁니다.

| 장 | 파일 | 무엇을 정하나 |
|---|---|---|
| 1 정체성 | [01-brand-identity.md](docs/01-brand-identity.md) | 왜 이렇게 생겼는가 |
| 2 색 | [02-color.md](docs/02-color.md) | 팔레트 · 대비 · 상태색 · 제품별 변수 연결 |
| 3 글자 | [03-typography.md](docs/03-typography.md) | 글꼴 · 크기 사다리 · 한글 자간 |
| 4 간격 · 배치 | [04-space-layout.md](docs/04-space-layout.md) | 4px 리듬 · 셸 폭 · 끊는 폭 |
| 5 모양 · 깊이 · 움직임 | [05-shape-elevation-motion.md](docs/05-shape-elevation-motion.md) | 모서리 · 그림자 · 이징 · 위젯 편집 움직임 |
| 6 부품 | [06-components.md](docs/06-components.md) | 부품 스펙 · 역할별 등록부 · 바꾸는 절차 · 전역 CSS |
| 7 화면 짜임 | [07-screens.md](docs/07-screens.md) | 아키타입 · 조합 패턴 · 차림표 · 목록 · 화면 뼈대 · 업무 화면 |
| 8 종이 · 문서 | [08-paper.md](docs/08-paper.md) | 문서 디자인 · 종이 문서 v8 · 문서 결 · 전문가 포털 |
| 9 글 · 말투 | [09-voice.md](docs/09-voice.md) | 화면 글 종결 · AI 티 거르기 · 아이콘 |
| 10 지키는 규칙 | [10-rules.md](docs/10-rules.md) | 고치고 키우는 흐름 · 계약과 검사 · 옮겨 쓰는 법 · 기반 규칙 |

7장의 차림표 · 목록 · 화면 뼈대는 설명이 아니라 **강제**입니다. 치수가 `dist/q-design.nav.css` ·
`list.css` · `screen.css` 에서 나오고, 제품은 그 사본을 받습니다.

참고 자료(규칙이 아닌 조사 · 안내)는 [docs/reference/](docs/reference/) 에 둡니다.
[참고 사이트 80곳](docs/reference/reference-sites.md) ·
[기초 참고 사례](docs/reference/foundation-reference-study.md) ·
[얼굴 화면](docs/reference/signature-screens.md) ·
[시각 참고 자료](docs/reference/visual-reference.md) ·
[목록 + 상세 시안 설명](docs/reference/context-review-prototype.md) ·
[움직임 브리프 조사](docs/reference/motion-brief-study.md) ·
[포스터 색 배치 조사](docs/reference/poster-colour-layout-study.md) ·
[아래 탭줄 움직임 조사](docs/reference/tabbar-motion-study.md) ·
[@ui_motion_prompts 훑어보기](docs/reference/ui-motion-prompts-study.md) ·
[화면 전환 조사](docs/reference/screen-transition-study.md) ·
[입력 칸 움직임 조사(영상 실측)](docs/reference/text-field-motion-study.md) ·
[이징 조사(공 여덟 개 · 영상 실측)](docs/reference/easing-study.md) ·
[모션 기초 공부 노트](docs/reference/motion-fundamentals.md) ·
[AI 티 걷어내기 «unslop» 대조](docs/reference/unslop-study.md) ·
[조명 이름 34개 · 빛의 어휘](docs/reference/lighting-vocabulary-study.md).

작업 기록은 [docs/SESSION_LOG.md](docs/SESSION_LOG.md) 한 장에만 이어 씁니다. 진행 문서를 따로 만들지 않습니다.

## 폴더

| 폴더 | 내용 |
|---|---|
| `docs/` | 정본 10장 · 참고 자료 · 작업 기록 |
| `patterns/` | Q-Design 이 원본인 규칙(부품 · 기반 · 팔레트 · 업무 화면 · 화면 문구) |
| `source/` | 제품 저장소에서 받아 온 원본 사본. 문서가 애매하면 여기가 진실입니다 |
| `dist/` | 산출물. **생성물이니 손대지 않습니다** |
| `preview/` | 브라우저로 여는 견본과 시안 |
| `tools/` | 만들기 · 내보내기 · 검사 도구 |
| `vendor/` | 아이콘 원본과 라이선스 |

## 만들기와 내보내기

입구는 하나입니다. 도구를 하나씩 돌리면 하나를 빠뜨리고, 그러면 일부만 갱신된 채 내보내집니다.
도구가 쓰는 라이브러리는 이 저장소의 `package.json` 에 판 번호를 고정해 두었습니다. 처음 받으면 `npm ci` 를 한 번 돌립니다.

```bash
npm ci                               # 처음 한 번. 제품 저장소의 node_modules 는 빌리지 않습니다
node tools/extract-all.mjs --check   # 검사 하나(tools/check.mjs). 아무것도 쓰지 않고, 늘 초록이어야 합니다
node tools/extract-all.mjs           # Q-Design 안의 산출물을 다시 만듭니다
node tools/extract-all.mjs --sync    # 만든 뒤 제품 저장소로 내보냅니다
```

맨 앞 걸음은 `source/` 를 제품 저장소의 **커밋된** 내용으로 맞추는 것입니다. 사본이 낡으면 그 뒤가 전부
«낡은 것에서 정확히 파생된» 값이 되고, 그것은 실패가 아니라 초록불로 나옵니다. 그래서 맨 앞에 둡니다.

- **제품 저장소에 쓰는 길은 `--sync` 하나입니다.** 만들기 걸음은 Q-Design 안에만 씁니다.
  화면 문구와 모노 글꼴의 제품 쓰기도 `--sync` 안에서만 합니다.
- 내보낼 조각과 받는 제품은 `tools/sync-parts.mjs` 한 곳에 있습니다.
- 사본을 쓰면 제품마다 **판 파일** `q-design.version.json` 도 함께 씁니다. 조각마다 본문 지문과,
  그 내용이 Q-Design 에 들어온 커밋 · 날짜가 적힙니다. 제품의 시험이 «사본 지문 = 판 파일» 을 대조하므로
  제품에서 사본을 손으로 고치면 그 제품의 시험이 웁니다.
- 제품마다 어느 판을 받았는지, 뒤처진 조각이 있는지는 상태 명령으로 봅니다.

```bash
node tools/status.mjs                # 제품마다 받은 판 · 뒤처진 조각 · 커밋 / 원격 여부
node tools/sync.mjs                  # 쓰지 않고 사본 대조만
node tools/sync.mjs --write --only=Q-Atelier   # 한 제품만 내보내기
```

🔴 제품 저장소의 main 푸시는 곧 운영 배포입니다. 내보낸 뒤 제품에서 커밋 · 푸시할 때 그 점을 먼저 생각합니다.

낱개로 부를 수 있는 도구입니다.

```bash
node tools/refresh-source.mjs      # source/ 가 제품 원본과 같은가 (--write 로 맞춤)
node tools/check.mjs               # 검사 하나: 늘 초록이어야 합니다 (extract-all --check 와 같음)
node tools/check.mjs --products    # 제품 감사: 제품 코드를 훑습니다 (빨강이어도 검사를 막지 않음)
node tools/audit-coverage.mjs      # «다 뽑았나» 를 숫자로 답합니다 (제품별 색 커버리지 포함)
node tools/contrast-table.mjs      # 대비 실측표 (--write 로 docs/02-color.md 에 씀)
node tools/extract-mqdoc.mjs       # 종이 문서 v8 값 (docs/08-paper.md 생성 구간에 씀)
node tools/check-chars.mjs         # 긴 줄표 같은 금지 문자
node tools/check-voice.mjs         # 화면 글의 종결
node tools/app-icons.mjs           # 네 제품 앱 아이콘 (견본 dist/app-icons/sheet.png)
```

🔴 **문서의 생성 구간을 손으로 고치지 않습니다.** `<!-- 생성:이름 -->` 과 `<!-- /생성:이름 -->` 사이는 도구가 씁니다
(`docs/02-color.md` 의 표 세 벌, `docs/08-paper.md` 의 v8 값). 손으로 고치면 다음 실행에 덮어쓰거나 검사가 웁니다.

## 가장 빨리 쓰는 법

```html
<link rel="stylesheet" href="dist/q-design.tokens.css">
<link rel="stylesheet" href="dist/q-design.nav.css">
<link rel="stylesheet" href="dist/q-design.list.css">
<link rel="stylesheet" href="dist/q-design.screen.css">
```

그다음 `var(--qa-bg)` · `var(--qa-text)` · `var(--qa-champagne)` 로 칠합니다.
다크가 기본이고 `<html data-theme="light">` 로 라이트가 됩니다.
글꼴은 `source/fonts/PretendardVariable.woff2` 를 함께 실어야 같은 얼굴이 됩니다. 자세한 것은 [10장](docs/10-rules.md)의 옮겨 쓰는 법을 봅니다.

## 견본 보기

견본은 상대 경로로 CSS 와 글꼴을 읽으므로 `file://` 로 열면 스타일이 붙지 않습니다. 저장소 뿌리에서 서버를 띄웁니다.

```bash
python -m http.server 4800 --directory D:/Claude/Q-Design
```

`http://localhost:4800/preview/index.html` 이 살아 있는 견본입니다(원본 CSS 를 그대로 링크합니다).
`preview/components.html` 은 세 제품의 실제 부품을 같은 조건에서 비교합니다.

## 먼저 알아야 할 세 가지

**rem 은 html 의 계산된 글꼴 크기를 기준으로 합니다.** html 이 16px 이면 `0.9375rem` 은 15px 입니다.
body 가 14px 이어도 rem 기준은 바뀌지 않습니다. 치수를 환산할 때는 그 화면의 html 값을 먼저 봅니다.

**한글에는 자간을 주지 않습니다.** 대문자 변환과 넓은 자간은 라틴 약어 라벨을 위한 장치입니다.
한글에 걸면 낱글자로 흩어집니다. 자세한 것은 [3장](docs/03-typography.md)에 있습니다.

**같은 사실을 두 곳에 두지 않습니다.** 사본은 반드시 어긋납니다. 값은 한 원본에서 도구로 뽑고,
사본에는 원본 지문을 찍어 대조합니다. 이 저장소의 도구와 검사는 거의 모두 이 원칙에서 나왔습니다.

## 옛 문서 번호

2026-10-16 에 옛 문서 27편을 정본 10장으로 합쳤습니다. 제품 코드나 산출물 주석이 옛 번호를 가리키면 이 표로 찾습니다.

| 옛 번호 | 지금 |
|---|---|
| 01 | 1장 |
| 02 · 33 | 2장 |
| 03 | 3장 |
| 04 | 4장 |
| 05 · 39 | 5장 |
| 06 · 07 · 29 · 30 | 6장 |
| 11 · 12 · 15 · 16 · 17 · 25 | 7장 |
| 08 · 20 · 23 · 24 | 8장 |
| 19 · 21 · 26 | 9장 |
| 09 · 10 · 35 | 10장 |
| 13 · 14 · 27 · 34 · 116 | 참고 자료 |
| 그 밖의 번호(18 · 22 · 28 · 31 · 32 · 36 · 117 · 118 등) | 보관 |

보관한 문서와 파일은 꼬리표 `archive/before-slim-2026-10-16` 에 있습니다. 작업 트리를 건드리지 않고 보려면
`git worktree add ../qd-archive archive/before-slim-2026-10-16` 로 다른 폴더에 꺼냅니다.
