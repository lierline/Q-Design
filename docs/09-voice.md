# 9장 · 글 · 말투

세 제품이 사람에게 말을 거는 방식(화면 말투), «AI 가 만든 티» 로 읽히는 꾸밈과 어법을 걸러내는 기준, 그리고 글자 옆에 서는 업무 아이콘을 정합니다.
화면 말투는 `tools/check-voice.mjs` 가, AI 티 걸러내기는 `tools/screen-ai-cliches.mjs` 가 지키고, 아이콘은 `tools/build-icons.mjs` · `tools/build-react-icons.mjs` 가 만듭니다.

합친 옛 문서: 21 화면 말투 정본 · 19 AI 티 나는 디자인 요소 스크리닝 · 26 업무 아이콘

---

## 화면 말투

### 규칙 셋

**① 화면 «문장» 은 합니다체로 끝냅니다.** 합니다 · 입니다 · 습니다.

```
  ○  업종을 가리지 않습니다.
  ○  연락처가 없어 접촉 실행이 안 됩니다.
  ×  업종을 가리지 않는다.
  ×  연락처가 없어 접촉 실행이 안 된다.
```

**② 이름표 · 지표 · 표 머리 · 필터 칩 · 단추 글은 명사로 끝냅니다.** 문장이 아니므로
말투가 없습니다. 여기에 「…합니다」 를 붙이면 오히려 어긋납니다.

```
  ○  메일 주소가 있는 곳     ○  담을 수 있음     ○  전체 내려받기
  ×  메일 주소가 있습니다     ×  담을 수 있습니다
```

**③ 해라체(ㄴ다 · 는다 · 이다)는 화면에 쓰지 않습니다.**
코드 주석 · 커밋 메시지 · 설계 문서는 이 규칙 «밖» 입니다. 그쪽은 개발자가 개발자에게
하는 말이라 기존 어체를 그대로 씁니다.

### 왜 합니다체인가

한 화면 «안» 에서 말투가 갈리면 읽는 사람은 **누가 말하고 있나** 를 매번 다시 정합니다.
Q-Sonar `/targets` 에서 위쪽 문단이 「…가리지 않는다.」 인데 아래쪽이 「…넘어갑니다.」 였던 것이 그런 경우입니다.

어느 쪽이 집안 말투인지는 소스가 답했습니다. 문장꼴 문자열 중 합니다체 비율이 Q-Atelier 89% · Q-Carnet 95% · Q-Sonar 72% 였고,
어긋난 쪽이 하나뿐이라 합니다체로 모읍니다.

### 검사

```bash
node tools/check-voice.mjs            # 상한을 넘으면 exit 1
node tools/check-voice.mjs --list     # 걸린 문장을 전부 찍습니다
node tools/check-voice.mjs --record   # 지금 값을 상한으로 새로 찍습니다
```

**보는 저장소는 넷입니다.**

| 제품 | 도구 안 이름 | 폴더 | 보는 곳 |
|---|---|---|---|
| Q-Atelier | Q-Atelier | `D:/Claude/Q-Atelier` | `app` · `components` |
| Q-Sonar | Q-Sonar | `D:/Claude/Lead-Radar` | `src` |
| Q-Carnet | Q-Forge | `D:/Claude/DHR` | `app` · `components` · `lib` |
| Q-Maison | Q-Maison | `D:/Claude/Q-Works` | `app` · `components` · `lib` |

`.ts` · `.tsx` · `.mjs` 파일을 보고(시험 파일 제외), `node_modules` · `.next` · `.git` · `dist` · `build` · `coverage` · `public` 은 건너뜁니다.

**상한.** 저장소마다 해라체 개수의 상한을 `tools/voice-baseline.json` 에 잠급니다. 해라체가 남은 저장소도 이 주제 밖이면
지금 값 그대로 잠그고, 상한은 `--record` 없이는 못 올라갑니다. 상한이 없는 저장소는 넘은 것으로 셉니다.

**판정은 좁습니다.** 문장 끝이 「다」 이고 「니다」 가 아니면 해라체입니다. 마침표 · 물음표 · 느낌표 · 따옴표 · 중괄호가 붙어도 종결로 봅니다.
「자」 「라」 「까」 「네」 는 종결로 보지 않습니다. 시제품에서 그렇게 했더니 「공급자」 「품질책임자」 「같습니까?」 가 잡혀
Q-Atelier 50건 중 36건이 오탐이었습니다. **거짓 경보를 한 번 내면 다음부터 아무도 이 검사를 안 봅니다.**
공백이 하나도 없는 한 낱말(「…같다」)은 문장으로 보지 않습니다.

실측으로 걷어낸 오탐이 넷 더 있습니다.

| 형태 | 보기 | 왜 아닌가 |
|---|---|---|
| 부사 「다」 | 둘 다 · 모두 다 | 앞이 공백입니다 |
| 조사 「마다」 | 생산 로트마다 | 종결이 아닙니다 |
| 조사 「보다」 | 서면보다 | 종결이 아닙니다 |
| 문장 안의 인용 | 걸려 「전부 죽었다」 처럼 보입니다 | 「」 안은 증상을 흉내 낸 것입니다 |

**보는 자리는 넷입니다.** 태그 사이 글 · `title`/`placeholder`/`aria-label` ·
한글이 든 문자열 리터럴 전부 · 백틱 문자열. 주석(`{/* */}` · `/* */` · 줄 끝 `//`)은 지우고 봅니다.
따옴표 «안» 의 `//` 는 지우지 않습니다(`https://…` 가 통째로 사라지지 않게).

> 🔴 **카피 «키 목록» 을 두지 않습니다.** 키 이름(`why · sub · label …`)으로 고르면 이름을 안 맞춘 자리가
> 조용히 검사 밖이 됩니다. Q-Sonar `src/lib/diagnostics/mfds-probe.ts` 의 `IMPACT` 가 그렇게 빠졌는데, 그것은 `/diagnostics` 화면에
> 그대로 그려지는 글이었습니다. 그래서 «한글이 든 문자열» 이면 다 봅니다.

> 🔴 **자기 검출력 시험을 먼저 돌립니다.** 네 묶음(해라체 1건 · 문자열과 속성 2건 ·
> 줄 끝 주석은 화면 글로 안 봄 · 조사 꼬리 0건)이 정확히 맞지 않으면 **아무것도 재지 않고 exit 2 로
> 죽습니다.** 초록불을 내는 빈 그물이 가장 위험합니다.

### 면제

`tools/voice-allow.json` 에 **문장 전문**으로 적습니다. 줄번호로 적으면 파일이 자라는 날 어긋납니다.

면제할 만한 것은 «말하는 사람이 화면이 아닌» 글입니다(격언 · 표어 · 증상을 흉내 낸 인용). 지금 들어 있는 것은 Q-Atelier
`components/StudioNote.tsx` 의 격언 일곱 줄입니다(「규제는 제약이 아니라 안전의 언어다」 등). 격언은 화면이 사용자에게 하는 말이 아니라
인용이라 합니다체로 바꾸면 맛이 죽습니다.

고객에게 나가는 «편지» 본문(Q-Sonar `src/lib/outreach/draft.ts`)은 화면 글이 아니라
사람이 사람에게 보내는 메일이라 이 규칙 밖입니다.

---

## AI 티 걸러내기

화면에서 «AI 가 만든 티» 로 읽히는 꾸밈을 찾는 도구와, 이 시스템에서 무엇이 정당한지의 기준입니다.

```bash
node tools/screen-ai-cliches.mjs [저장소 경로]   # 경로를 안 주면 D:/Claude/Q-Atelier
```

- **범위가 셋입니다.** 같은 코드라도 자리에 따라 판정이 달라지기 때문입니다.
  화면(`app/**` · `components/**` · `lib/design/**`) · 메일(`lib/email` · `notify-*`) · 그 밖.
  사람이 보는 곳은 «화면» 이고, 메일은 메일 클라이언트의 제약이 달라 따로 봅니다.
- **색은 정규식이 아니라 파싱해서 판정합니다.** 정규식으로 잡으면 브랜드 금색 hex 를 «보라» 로 잡는 오탐이 납니다.
- 주석 줄은 «설명» 이지 «쓰임» 이 아니라 세지 않습니다.
- `.ts` · `.tsx` · `.css`(시험 파일 제외)를 보고, `node_modules` · `.next` · `.git` · `android` · `capacitor-www` · `public` · `docs` · `tests` · `scripts` 는 건너뜁니다.
- ⚠️ **«찾았다» 가 곧 «잘못» 은 아닙니다.** 판정은 화면을 보고 사람이 합니다. 이 도구는 어디를 볼지 좁혀 줍니다.

### 항목 아홉과 이 시스템의 기준

| 항목 | 도구가 세는 것 | 이 시스템에서 |
|---|---|---|
| 보라 그라데이션 | `linear-gradient` 안의 보라 ~ 인디고 hex (전부 금색이면 제외) | 금지 목록의 핵심. 쓰지 않습니다 |
| Inter / Geist | 따옴표 안의 `'Inter'` · `'Geist'` | 금지 목록의 핵심. 쓰지 않습니다 |
| 네온 글로우 | `box-shadow` 의 `0 0 20px` 이상 번짐 | 금지 목록의 핵심. 쓰지 않습니다 |
| 글자 그라데이션 | `background-clip: text` | 로그인 히어로와 `goldTextStyle()` 정의 같은 «얼굴 화면» 전용입니다([1장](01-brand-identity.md)). 업무 화면에는 쓰지 않습니다 |
| 글래스모피즘 | `backdrop-filter: blur` | 모달 · 드로어 백드롭(배경을 가리는 목적, `saturate(180%)` 를 함께 걸어 탁해지지 않게)만 정당합니다. 카드나 패널에 유리 효과를 쓰지 않습니다 |
| pill 라운드 | `9999px` · `999px` · `RADIUS.pill` · `50%` | `50%` 원형 점(상태 dot · 아바타 · 진행 링)은 정당합니다. 버튼이나 카드를 알약으로 만들지 않습니다 |
| eyebrow 라벨 | `eyebrow` 글자 | 라틴 대문자에 넓은 자간인 **영문** 라벨(전문가 포털)만 조건부로 정당합니다. 한글 라벨은 [3장](03-typography.md)의 한글 자간 규칙이 막고, 제품 화면의 절 머리는 [8장](08-paper.md) «문서 결» 에 따라 eyebrow 를 쓰지 않습니다 |
| 옆 색 선 | 2px 이상 `borderLeft` · `borderRight` · `border-left` · `border-right`(solid · dashed · double) | 오너 금지 목록의 «카드 한쪽의 굵은 컬러 보더». 쓰지 않습니다([8장](08-paper.md) «문서 결») |
| 이모지 | 따옴표 안의 이모지 블록 문자 | 화살표(`→` `↔`)와 기하 기호(`✦` `✓` `✕`)는 정당합니다. 빈 상태의 큰 금색 `✦` 는 브랜드에 맞습니다. 기기마다 모양이 다른 컬러 이모지는 줄이고 아이콘 자리는 아래 «업무 아이콘» 을 씁니다 |

금지 목록의 핵심 셋(보라 그라데이션 · Inter/Geist · 네온)을 피하는 것만으로는 부족합니다. **다른 축에서 AI 티가 납니다.** 아래가 그것입니다.

### AI 티로 읽히는 어법 (판단 기준)

꾸밈이 아니라 «화면이 말하는 방식» 의 문제입니다. 값이 아니라 판단이라, 무엇을 다듬을지는 화면을 보고 정합니다.

**① 대시보드가 사람처럼 말하면**

```
우리 회사는 지금 1개 제품에 대해 총 0건의 변경이 진행되고 있고,
모든 단계가 정상 흐름을 유지하고 있습니다.
```

두 줄짜리 큰 서술문에 숫자만 금색, 둘째 줄은 통째로 초록, 그 위에 영문 대문자 라벨. 이것이 가장 AI 티 나는 형태입니다. 까닭은 셋입니다.

1. **대시보드가 문장으로 말합니다.** 업무 도구는 값을 보여 주고 사람이 읽습니다. 문장으로 요약해 주는 것은 챗봇의 어법입니다.
2. **0 을 문장에 넣습니다.** 「총 0건의 변경이 진행되고 있고」 는 정보가 아니라 빈칸을 메운 말입니다.
3. **한 문장에 색이 셋**입니다(흰 · 금 · 초록). 강조가 강조를 지웁니다.

다듬는 방향은 이렇습니다.

```
지금             제품 1 · 진행 중 변경 0
상태             모든 단계 정상
```

문장을 값으로 되돌리고, 색은 「정상」 에만 씁니다. 「우리 회사는」 같은 1인칭 주어를 빼면 곧바로 도구의 어법이 됩니다.

> 「안녕하세요, 대표 (데모)님」 같은 인사 제목도 같은 축입니다.
> 매일 여는 화면에서 인사는 한 번만 새롭고 그다음부터는 자리만 차지합니다.

**② 0 이 화면을 채우면**

비어 있는 진행 막대 옆에 0 뿐인 범례를 늘어놓거나, 파이프라인 칸 대부분을 큰 글씨 0 으로 채우거나, 카드 안에 빈 상태를 또 넣으면
화면이 「아직 아무것도 없다」 고 말합니다. 설계가 «0 이어도 자리를 지킨다» 쪽이면 이렇게 됩니다.

- 0 인 구간은 **작게 접습니다.** 「6단계 중 진행 0」 한 줄이면 충분합니다.
- 비어 있는 진행 막대는 **그리지 않습니다.** 빈 막대는 오작동처럼 보입니다.
- 파이프라인은 **0 이 아닌 칸만** 크게, 나머지는 회색 한 줄로 둡니다.

**③ 한글 화면에 영문 단계명이 섞이면**

```
Planning · Development · Verification · Validation · Submission · Approval
```

다른 화면이 전부 한글인데 한 곳만 라틴이고, 라틴 자간까지 걸려 더 도드라집니다. 규제 용어라 영문이 정확한 경우가 있지만,
한글 대응어가 명확하면(기획 · 개발 · 검증 · 유효성확인 · 제출 · 승인) 한글을 씁니다.

> 같은 뜻을 화면마다 다른 언어로 적으면 **같은 사실의 사본이 갈리는** 것과 같은 문제입니다.

---

## 업무 아이콘

Q-Design 업무용 아이콘은 **Phosphor Icons 의 Regular** 스타일입니다(2026-10-03).
[아이콘 견본](../preview/icons.html)에서 고른 30종과 쓰임을 볼 수 있습니다.

### 고른 까닭

[Phosphor 공식 저장소](https://github.com/phosphor-icons/core)와 [Lucide 공식 저장소](https://github.com/lucide-icons/lucide)를 비교했고,
문서 · 검토 · 생산 · 재고를 같은 스타일로 표현하는 Phosphor Regular 를 골랐습니다.
라이브러리 자체가 AI 느낌을 없애는 것은 아닙니다. 과한 장식, 의미 없는 기호, 기기마다 다른 컬러 이모지를 줄이고
업무 이름 옆에 필요한 표시만 두는 것이 적용 기준입니다.

공식 저장소의 MIT 라이선스와 원본 SVG 를 함께 보관합니다. 가져온 커밋은 `2b75f3ad12b420c9504ef05df8d2564a28f8500e` 로 고정합니다.
실행 시 외부 CDN 이나 아이콘 폰트를 부르지 않습니다.

### 화면 규칙

- 기본은 20px, 큰 표시는 24px. 16px 는 글자가 함께 있는 좁은 조작부에서만 씁니다
  (`patterns/components.css` 의 `--qd-icon-size` 20px · `--qd-icon-size-sm` 16px, `.qd-icon--lg` 24px).
- Regular 한 굵기를 유지합니다. Fill · Duotone · 색 이모지를 한 조작부에 섞지 않습니다.
- 색은 `currentColor` 로 주변 글자색을 따릅니다. 상태 색은 기존 의미 색을 쓰고 상태 글자를 함께 둡니다.
- 문서 목록은 files, 검토는 clipboard-text, 생산은 factory, 분석은 chart-line 으로 뜻을 구분합니다.
- AI 기능이라는 이유로 반짝임 · 로봇 · 마술봉을 반복하지 않습니다. 분석 · 검토 · 작성 등 실제 하는 일로 고릅니다.
- 내부 이동에는 next, 새 창 · 외부 링크 표시에만 external 을 씁니다.
- 아이콘이 글자와 함께 있으면 `aria-hidden="true"`. 아이콘만 있는 버튼에는 `aria-label` 을 줍니다.
- 버튼 클릭 영역은 최소 44px 를 유지합니다. 아이콘 자체의 20px 크기와 구분합니다.
- 공식 Q 마크, PWA 아이콘, 회사 CI 는 기존 브랜드 자산을 씁니다.

### 쓰는 법: HTML (CSS mask)

`dist/q-design.icons.css` 와 `dist/icons/` 를 같은 상대 경로로 함께 배포합니다.
CSS mask 로 원본 SVG 의 형태를 표시하므로 밝은 테마와 어두운 테마에서 같은 파일을 씁니다.
CSS 의 mask 가 표시되지 않는 환경에서도 행동을 이해할 수 있도록 글자 이름을 유지합니다.

```html
<link rel="stylesheet" href="/design/q-design.icons.css">
<button type="button" class="qd-icon-label">
  <span class="qd-icon" data-icon="download" aria-hidden="true"></span>
  내려받기
</button>
<button type="button" aria-label="닫기">
  <span class="qd-icon" data-icon="close" aria-hidden="true"></span>
</button>
```

React 에서 이 CSS 방식을 쓸 때도 같은 클래스와 `data-icon` 을 씁니다. 두 번째 버튼의 이름을 `title` 만으로
대체하지 않습니다. CSS mask 가 사용하는 SVG 는 `img-src` 에서 같은 출처를 허용해야 합니다.

### 쓰는 법: React 제품

세 제품(Q-Atelier, Q-Maison(`Q-Works`), Q-Carnet(`DHR`))에 같은 Regular 원본을 내보냅니다(오너의 세 제품 전체 적용 지시, 2026-10-03).
30종 견본은 기본 업무 목록이고, 제품별 추가 기능도 같은 스타일을 씁니다. 기존 화면에서 필요한 아이콘은
`patterns/react-icons.json` 에 코드 이름과 Phosphor 원본 이름의 대응으로 적습니다.

- `node tools/build-react-icons.mjs` 가 원본 SVG 에서 아이콘별 TSX 모듈을 `dist/react-icons/` 에 만듭니다.
  공통 틀(`_icon.tsx`)은 `patterns/react-icon.tsx` 입니다. 원본이 path 만으로 된 모양이 아니면 실패합니다.
- 내보내기는 `tools/sync-react-icons.mjs` 입니다. 제품 화면이 실제로 가져오는 `@/components/q-design-icons/<이름>` 모듈과
  `_icon.tsx` · MIT 라이선스만 각 제품의 `components/q-design-icons/` 로 보냅니다. 입구 `node tools/extract-all.mjs --sync` 가
  `--write` 로, `--check` 가 대조로 부릅니다. 대응표에 없는 이름이나 옛 `lucide-react` 가져오기가 남아 있으면 쓰기 전에 멈춥니다.
- 다른 동결 조각을 갱신하지 않습니다. 런타임 네트워크 요청이나 아이콘 패키지 설치는 없습니다.

각 화면은 `@/components/q-design-icons/Search` 처럼 필요한 파일을 직접 가져옵니다. 기존 크기, 색, 클릭 동작, ref, 접근성 속성을
유지합니다. 기본 크기는 20px 이며, 기존 `strokeWidth` 는 Regular 외곽선을 다시 두껍게 만들지 않도록 무시합니다.
이름(`aria-label` · `aria-labelledby` · `role="img"`)이 없는 아이콘은 스스로 `aria-hidden` 이 됩니다.
`Sparkles` 라는 기존 코드 이름은 호환을 위해 남기되, 실제 모양은 분석을 뜻하는 chart-line 입니다.
로고, 바코드, 데이터 차트, 인쇄 도형은 업무 아이콘 교체 대상이 아닙니다.

### 원본과 만들기

- `patterns/icons.json`: 뜻 이름(`id`), 원본 파일(`source`), 한글 이름(`label`), 무리(`group`), 고정 커밋.
- `vendor/phosphor/`: 공식 SVG 원본(`regular/`)과 LICENSE. 제품에서 가져오는 `source/` 사본과 분리합니다.
- `tools/fetch-icons.py`: 고정 커밋에서 `patterns/icons.json` · `patterns/react-icons.json` 이 쓰는 원본만 다시 받습니다. 업데이트할 때만 네트워크가 필요합니다.
- `tools/build-icons.mjs`: 로컬 원본에서 `dist/q-design.icons.css` · `dist/icons/*.svg` · SHA-256 목록(`dist/q-design.icons.json`) · `dist/icons/LICENSE` 를 만듭니다.
  SVG 가 `viewBox="0 0 256 256"` 이 아니거나 script · 외부 참조 같은 내용을 품으면 실패합니다.
- `node tools/build-icons.mjs --check` · `node tools/build-react-icons.mjs --check`: 생성물이 원본과 일치하는지 검사합니다.
