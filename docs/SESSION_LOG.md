# 세션 기록

무엇을 왜 고쳤는지, 그리고 무엇에 걸려 넘어졌는지를 남깁니다. 최신이 위에 옵니다.
맨 위 «남은 일» 은 도구가 모르는 할 일만 모읍니다. 도구가 아는 것은 `check.mjs` · `check.mjs --products` · `status.mjs` 가 답합니다([10장 «할 일은 어디서 보나»](10-rules.md)).
끝낸 줄은 지우고 그날의 기록으로 옮깁니다.

---

## 남은 일

다음 바퀴의 «바꿈» (시안을 먼저 보여 드리고 오너가 고름)

- 화면 글 말투. Q-Maison 82곳, Q-Carnet 12곳(상한 11). 정식 기록 문장과 검사기 오탐이 섞여 있어 바꿀 문장 목록부터 보여 드린다.
- 10-22 전수 검수의 «바꿈» 후보(아래 그날 기록). 세 제품 왼쪽 띠의 「THEME / DARK」 영문, Q-Atelier InfoDot · 「필수 아님」 글자색(대비 2.4 ~ 2.5), 대비 4.0 ~ 4.45 에 걸린 토큰들과 Q-Maison 알약 색, Q-Carnet 바닥글 상표(투명도 .35 · 대비 1.6), 「Documented.」 글자표.
- Q-Sonar 흐린 글자 가운데 단계 `#aaa395`. Q-Sonar 는 흐린 글자가 세 단계(#b7b0a5 · #aaa395 · #898271)이고 정본 어두운 테마는 둘(subtle · muted)이다. 가운데를 위나 아래로 합치거나, 정본에 단계를 하나 더하는 안을 실제 화면에 입혀 보여 드린다. 11-04 에 A(dim `#b7b0a5` 로 합침) · B(faint `#898271` 로 합침) 두 안을 /targets · /dashboard · /companies 다크 · 라이트에 입혀 오너께 보냈다(Q-Sonar 세션). 결정 대기.
- 폰 누름 자리 «바꿈» 13곳(10-22 비교판을 오너께 보냄 · 아래 그날 기록). 모양이 바뀌어야만 44 가 되는 것들이다. 오너가 번호로 고르면 그것만 고친다.
- 알림 두 가지(10-28 기록). 성공 알림의 초록이 셋(테두리 · 아이콘 · 줄어드는 막대)이라 막대나 테두리 색을 걷는 안, 오른쪽 위 알림이 머리띠의 알림 종 · 배지를 덮는 자리를 옮기는 안.

오너 결정을 기다리는 것

- 글꼴 폴백 얼굴을 정본으로 올릴지(11-04 Q-Carnet 에서 먼저 넣음 · 위 그날 기록). 첫 방문 글꼴 바뀜 밀림은 세 제품이 같은 글꼴 묶음이라 같은 원인일 가능성이 높다. Q-Atelier · Q-Maison 을 같은 조건(새 문맥 · 글꼴 캐시 없음)으로 재서 맞으면 글꼴 선언을 만드는 걸음에 넣는다. Q-Sonar 도 11-04 같은 얼굴로 /targets 0.28 → 0.001 이라 두 제품에서 맞았다(아래 그날 기록).
- 반응형 측정에서 못 잰 Q-Atelier 운영진(/admin) 25화면. 측정기에 저장된 로그인이 Demo co. 계정이라 /dashboard 로 돌아간다. 오너가 운영 계정으로 로그인해 주면 잰다(10-23 기록).
- rem 기준. 10-11 3163c82 부터 html 이 16px 이다(옛 문서는 14). 의도였는지 확인을 기다린다(10-16 기록).

다시 잴 것 (10-16 에 적은 문서와 코드가 다른 곳. 그 뒤 5단계를 지나 지금도 그런지 모른다)

- 안내 · 주의 · 경고 상자: 문서 결은 가로선 사이, 코드는 둥근 테두리.
- 단계 표시: 끝난 단계를 초록으로 채우는 Q-Atelier 화면 둘.
- 고르기 칸의 금색 화살표가 공용 규칙에 가려 안 보임.
- 표 머리 대문자가 공용 규칙에 덮임.
- `qa-soft-pulse` 와 리본 표류의 scale.
- 전문가 포털 값 통일의 결정 출처.

제품을 고쳐야 풀리는 작은 것 (고치면 그 제품 배포가 따름)

- Q-Atelier 표를 정본 `.qd-table` 로. 아뜰리에는 표에 정본 클래스를 걸지 않아 «늘어나는 열 하나»(10-28)가 닿지 않는다. 옮기면 열 폭 규칙과 글자 · 여백이 세 제품에서 같아진다.
- Q-Atelier 지표 부품을 사다리로. 아뜰리에 지표 부품의 인라인 clamp 가 아직 옛 토큰 둘(`--qd-kpi-min-size` · `--qd-kpi-fluid-size`, `components.css`)을 읽는다(10-27 «지표 값 사다리» 기록). 부품이 `.qd-kpi-value` 규칙을 그대로 쓰게 고치면 토큰 둘을 지우고 `extract-screen.mjs` 의 cqw 읽기 · 검사도 함께 지운다.

- 10-22 전수 검수에서 남긴 Q-Atelier 작은 것 하나. `/ra` 375 폭에서 지표 설명 창이 위아래 어느 쪽에도 다 안 들어가 바닥 밖으로 약 10px(공용 `components.tsx` 에서 화면 안으로 눌러 넣기). 자간 둘(`/vigilance` 「초과 37일」 · 검토 회의 날짜, 그린 부품은 `components/TeamActivityFeed.tsx`)은 10-22 전체 점검에서 `/ra` 카드 자간과 함께 고쳤다(Q-Atelier f9f58bde).
- 10-23 반응형 검수에서 남긴 패드(768 · 터치) 누름 자리. 폰 «바꿈» 13곳과 겹치지 않는 것: Q-Atelier 피드백 «긍정» 32, Q-Carnet 원가 «빈 기록 고치러 가기» 링크 14, Q-Maison 홈 «전체 →» 16 · 감사 모의 «관련 메뉴로 이동 →» 16 등 글귀 링크. 넓히면 옆을 덮는지부터 본다.
- 제품 개발자가 손으로 쓴 주석의 옛 문서 번호 36곳(Q-Atelier 8 · Q-Works 14 · DHR 14). README «옛 문서 번호» 표로 찾을 수 있어 급하지 않다.

도구의 빈틈

- 안 읽히는 폭 변수 둘. `--qd-reading-width`(820) · `--qd-detail-max`(1160)는 정본 foundation.css 와 세 제품 사본에 선언만 남았고 읽는 곳이 없다(10-27 «3» 뒤 grep). 걷으려면 세 제품 사본을 함께 받아야 한다.
- `check-hangul-source.mjs` 는 정본 클래스만 본다. Tailwind `tracking-[…]`, 제품 CSS(`.login-submit` 같은), 인라인 `letterSpacing` 을 못 보고 Q-Atelier 는 아예 대상이 아니다. 10-22 에 화면 실측으로만 잡은 한글 자간이 Q-Atelier 10곳(로그인 6곳 별도) · Q-Carnet 3곳 · Q-Maison 인쇄 3곳이었다.
- 전수 검수 측정기(`D:/Claude/.claude/design-sweep`)가 못 연 동적 주소: Q-Maison 103 · Q-Atelier 22 · Q-Carnet 9(인쇄). 자료가 있는 상세 화면을 찾아 넣는 일이 남았다.
- 같은 측정기의 누름 자리 재기는 붙박이 띠 · 고정 바닥 줄 옆의 요소를 띠에서 비켜 세우지 않고 잰다. 띠가 덮은 만큼 작게 나온다(Q-Atelier 「근거 방침」 26 은 바닥 차림 옆이라 그렇고, 띠가 없는 자리에서는 44). 여러 줄로 접힌 글 속 링크는 가운데 점이 줄 사이에 떨어져 0 으로 나온다.
  - 붙박이 띠 쪽은 10-22 에 메웠다. 측정기(`measure.js` probeHit)가 44 보다 작게 재면 요소를 가운데로 굴려 한 번 더 재고 큰 쪽을 쓴다(기록에 `recentred`). 운영 재측정에서 「근거 방침」 은 26.1 → 45 로 «넓힌 자리 있음» 으로 옮겨 갔고, 진짜 작은 것(0145e146 배포 전 옛 판의 현장 화면 머리 38 · 폰 메뉴 서랍 묶음 머리 32)은 그대로 빨갛다. 여러 줄 글 속 링크는 아직 남았다.
- `extract-all.mjs --sync` 를 `--only` 없이 돌리면 PENDING 인 Q-Sonar 사본 넷을 써 넣은 뒤 마지막 대조에서 exit 1 로 멈추고, 앱 오프라인 사본 걸음도 돌지 않는다. 지금은 `--sync --only=Q-Atelier,Q-Works,Q-Forge` 로 돌리고, 써 넣어졌으면 Lead-Radar 에서 `git checkout --` 로 되돌린다.

11-04 impeccable 감사에서 새로 생긴 것 (보고서 [docs/audits/2026-11-04-impeccable-q-suite-audit.md](audits/2026-11-04-impeccable-q-suite-audit.md) · 번호는 그 보고서의 지적 번호)

- ✅ 11-04 Q-Atelier 자리 밀림 21화면(1번): 같은 날 0c45b5e6 · f1d687ef 로 운영 43화면 전부 0.1 아래(20화면 0.000 · /research/[code] 0.067 → 0f5a9156 로컬에서 서류판까지 고침 · 푸시는 오빠 결정). 원인은 뼈대 하나가 아니라 셋이었다(PageGuide 팝업이 「움직임 줄임」 에서 한 프레임 왼쪽에 찍힘 · CAPA 서류판 빈 자리 · 글꼴 폴백 폭 → size-adjust 로 맞춘 'Pretendard Fallback' 24얼굴). 기록은 Q-Atelier `docs/SESSION_LOG.md` 11-04. Q-Carnet dev 설정 화면 8곳(18번)은 Carnet 세션 몫(글꼴 폴백 · DHR 0f982ff · 운영 재측정 뒤 확정).
- Q-Sonar 아웃리치 미리보기 iframe 이 www.medqraft.co.kr 의 X-Frame-Options 로 항상 빈 칸(4번).
- Q-Carnet 측정기 «마우스 전용» 에 남은 1(5 · 16번은 11-04 에 고침 · 아래 그날 기록): 목록 조각(`dist/q-design.list.css`)의 `.qd-pager-btn[aria-disabled='true']` 갈래가 `cursor: default` 를 안 되돌린다. `pointer-events: none` 이라 실제로는 화살표가 뜨고 계산값만 pointer. 한 줄이지만 목록 조각이라 세 제품 사본이 따라오므로 다음 목록 바퀴에.
- 진행 막대 transform 전환(40번 · 11-04 · 정본만 · 아래 그날 기록): 정본은 지금 width · transform 전환을 둘 다 둔다. ① 카르넷 `Progress`(DHR `components/ui.tsx:404`) · 메종 인라인 진행 막대를 width → `transform: scaleX` 로(제품 세션 몫) ② 그 뒤 정본에서 width 전환을 뺀다 ③ 세 제품에 보내는 sync 는 오너 결정이고, 돌릴 때 DHR · Q-Works 작업트리가 깨끗한지 `git status --short` 로 보고 한 번에(부모 세션이 순서를 맞춤). 상단 진행선 둘(`patterns/foundation/atelier.css` `.qa-top-progress` · `carnet.css` `.top-progress`)의 너비 전환은 제품 코드가 width 를 주는 자리라 제품 세션 몫으로 남겼다.
- Q-Design 견본 두 창(36 ~ 39번)은 11-04 에 고쳤다(아래 그날 기록 · 36 · 37번은 측정기 오탐). 남은 것은 정본 결정 넷이다. ① 목록 조각 `.qd-filter-clear`(「검색 지우기」 글귀 링크)가 글자 높이 12px 그대로라 폰에서 누름 자리 55 × 12(parts.html) · 64 × 12(아뜰리에 작업대). 정본에 `min-height: 44px` 를 주면 세 제품 사본이 따라온다. ② 거르개 띠 · 쪽 이동 단추 · 빈 목록 힌트 · 작은 단추(`--qd-control-height-sm` 36px)가 폰 폭에서 44 미만으로 잡힌다(parts.html 9곳 · index.html 「보조」 1곳). 정본이 36 으로 정한 값이라 측정기 기준을 36 으로 낮출지, 폰에서만 44 로 키울지. ③ `check.mjs` 에 「견본 쪽이 정본 CSS 를 읽고(404 없음) 글자 분포가 사다리 안인가」 걸음을 더할지(39번 재발 방지). 측정기 `D:/Claude/.claude/design-sweep/impeccable-2026-11-04/probe.mjs qdesign` 이 이미 재므로, 걸음은 그 결과의 «Times New Roman · Arial 0 · 사다리 밖 0 · h1 쪽마다 1» 만 읽는 얇은 것으로 하되 Playwright 와 4800 · 4818 두 서버가 있어야 돌아 평소 35걸음과 결이 다르다. ④ index.html 의 옛 빈 상태 견본은 정본이 09-28 에 걷은 빛무리 · 꾸밈 글리프를 아직 그린다(글리프는 aria-hidden 으로 숨김). 정본대로 걷을지.
- 설명서 왼쪽 선 · 위젯 흔들림 · bounce(41번 · 11-04 오너 결정 «A» · 정본만 고침 · 아래 그날 기록): 세 제품에 보내는 sync 는 오너 결정. 받을 때 Q-Atelier `components/dashboard/CustomizableWidgetBoard.tsx` 의 흔들림 주석 두 줄(327 · 368)이 낡아 지우는 일이 따라온다(CSS 는 이미 정본에서 뺐다). 설명서에 남은 왼쪽 선 둘(`.hits` 검색 결과 2px · `.rail nav a.on` 차림표 현재 표시 2px)은 강조선이 아니라 목록 · 현재 위치 표시라 그대로 뒀다. 바꾸려면 오너 결정.
- Q-Maison 로그인 뒤 53화면(42 ~ 51번 · 같은 날 20:48 보탬): 차림표(`qd-rail`) 글귀 `qd-nav-label` · `qd-nav-group` 줄간격이 1.5 로 정본 10-27 판(1.4 · 1a6e098)보다 한 판 뒤(45번 · Q-Maison 의 정본 사본 `app/q-design.list.css` 를 받으면 풀림). 상태 알약 「종결」 3.27 · 「계획서 작성·결재」 3.53 라이트 대비(43번)는 «남은 일» 의 Q-Maison 알약 색 결정과 함께 그림 먼저. 폰 44 미만 41자리(42번 · P1)는 10-23 글귀 링크 묶음과 겹친다.
- 정본 reduced-motion 규칙(foundation.css:261)이 `.qd-skeleton` 만 끈다. 전부 끄기로 넓힐지 결정(13 · 17번). Carnet `rise-soft`(17번)는 11-04 에 카르넷 조리법(`patterns/foundation/carnet.css`)의 `.stagger` 에 reduce 블록을 더해 먼저 껐다(결정 전 제품 쪽 최소 고침 · 29fd100). Atelier `qa-luxe-fadeup`(13번)은 그대로 돈다.

---

## Q-Sonar 따라잡기 (PENDING 세 조각 받음 · 새 조각 «소나 유틸리티») · impeccable 감사 Q-Sonar 2 · 3 · 4 · 30 ~ 35번 · 2026-11-04

- «남은 일» 의 Q-Sonar 따라잡기를 닫았다. `tools/sync-parts.mjs` 의 PENDING 을 비우고 차림표 · 목록 · 뼈대 세 조각을 Q-Sonar 에 받았다(판 4a413c18400a · 조각 7 · `status.mjs` 최신 7/7).
- 새 조각 `patterns/foundation/sonar-theme.css`(PARTS «소나 유틸리티» · 층 없이 그대로 복사 → Lead-Radar `src/styles/q-design.theme.css`). Q-Sonar 는 기반 · 컴포넌트 조각을 받지 않아 사본이 부르는 `--qd-*` 변수가 비어 있었다(실측: 표 글자가 폴백 13px 로 1,781곳 · `--qd-space-*` · `--qd-kpi-min-width` 를 쓰는 선언은 통째로 버려짐). 조각이 넷을 한다. ① 정본 값(사다리 · 굵기 · 줄간격 · 자간 · 모서리 10 · 조작부 44/36 · 표 여백 · 띄움 단위) ② 정본 폰 누름 자리 규칙 두 블록(640px 아래 min-height · `.qd-touch-hit`) 글자 그대로 ③ 표 열 폭 규칙(`patterns/components.css` 블록 그대로) ④ 테일윈드 `@theme inline` 잇기(`text-*` · `font-*` · `leading-*` · `rounded-*` · Q-Carnet 과 같은 길). 판 모양 변수(`--qd-card-*`)는 일부러 뺐다. 사본 폴백 «위 괘선 하나 · 모서리 0» 이 장부형 «3» 의 모양이다.
- `tools/type-ladder.test.mjs` 에 시험 하나. 조각의 `--qd-*` 값마다 정본(components + foundation)과 같은지(30개 이상 · 필수 이름 포함), 누름 자리 두 블록과 표 열 폭 블록이 정본과 글자로 같은지, `tableGrowGaps` 가 비었는지, 테일윈드 잇기가 정한 이름만 만드는지, b · strong 600. 8/8.
- Q-Sonar 쪽 결과(Lead-Radar `docs/SESSION_LOG.md` 11-04): 사다리 밖 1,900 → 0 · 굵기 700 88 → 0 · 412 폭 44 미만 103자리 → 0 · 카드 안 카드 31 → 0 · 모서리 6px 128 → 0 · CLS /targets 0.28 → 0.001 · 콘솔 오류 1 → 0. 🔴 Lead-Radar main 에는 아직 안 올렸다(오너가 전후 그림을 본 뒤 「올려」).
- 표 안 이름 링크에도 `.qd-touch-hit` 을 달았다. foundation.css 주석의 «줄 간격이 44 보다 좁은 목록 · 표» 는 넓힌 자리가 옆 줄 글자를 덮는 것을 막는 말이고, 정본 표 줄(여백 11 + 1.6 × 14 = 44.4)은 그 조건 밖이다. 주석에 «정본 표 줄(44.4)은 써도 된다» 를 보태는 것은 정본 손대기라 오너 결정으로 남긴다.
- 글꼴: Q-Sonar 도 Q-Carnet 과 같은 Pretendard 1.3.9 조각판 + 맑은 고딕 폭 맞춤 폴백 얼굴을 넣었다(CDN 끊음 · /targets CLS 0.28 → 0.001). «오너 결정을 기다리는 것» 의 글꼴 폴백 줄에 보탬.
- `check.mjs --products` 의 «사본을 부르는 곳 6 곳» 은 Q-Sonar 몫이 아니다(Atelier 4 · Works 1 · Forge 1 · 40번 진행 막대 정본 고침 뒤 sync 를 오너 결정으로 안 돌린 것). Q-Sonar 색 1(`#aaa395`)은 오너 A · B 결정 대기.
- 측정기(`probe.mjs`) 오탐 하나. 「본문으로 건너뛰기」 sr-only 링크(1×1)를 44 미만으로 센다(17화면). 측정기는 세션들이 같이 쓰는 파일이라 안 고쳤다.

## Q-Carnet 표 부품: 잘린 쪽 표시를 ScrollCut 으로 감쌈 (impeccable 감사 20번 · 제품에서 채택) · 2026-11-04

Q-Carnet 에서 레이아웃 하나에 둔 «훑개» 가 수화 전 HTML 에 `data-cut` 을 적어 폰 · 라이트 보기 41화면에서 수화 경고가 났다. 표 부품(`components/table.tsx`)의 `.qd-table-scroll` 을 요소마다 감싸는 `ScrollCut` 으로 바꿔 효과가 그 요소가 수화된 뒤에만 돌게 했다. 그리는 CSS(`[data-cut]`)는 그대로라 모양은 같다. 다시 잰 결과 수화 경고 41 → 0.

- 제품에서 먼저 고쳐 커밋(DHR 852ae9d)한 뒤 `node tools/build-component-implementations.mjs --adopt --only=Q-Forge` 로 정본 `patterns/component-implementations/carnet/components/table.tsx` 에 받았다. DHR 판 파일은 `node tools/sync.mjs --stamp --only=Q-Forge` 로 «지금 사본대로» 찍었다(DHR 60ccfbd). 작업본에 다른 세션의 커밋 전 조각(`patterns/components.css` · atelier 값 · Q-Sonar 테마)이 있어 전체 `--sync` 는 돌리지 않았다. `dist/q-design.component-implementations.json` 은 carnet 몫 한 줄만 함께 적었다(atelier 몫은 그 세션 것).
- `ScrollCut` 자체(`components/scroll-cut.tsx`)는 정본 밖 Q-Carnet 부품이고, 공용 부품 정본은 제품마다 따로라 이 채택은 carnet 사본에만 닿는다.
- 같은 날 Q-Carnet 쪽(기록은 DHR `docs/SESSION_LOG.md`): 글꼴 폴백 얼굴(맑은 고딕 폭 93% · 설정 화면 CLS 0.13 ~ 0.37 → 0.02) · 뼈대가 떠 있는 동안 바닥글 숨김(긴 화면 0.078 → 0.003) · Speed Insights 운영에서만(dev CSP 콘솔 오류 108 → 0) · autoFocus 둘 검토 · 측정기 `code-scan.mjs` 의 img alt 줄 단위 오탐 고침.
- 🔑 자리 밀림의 진짜 원인은 뼈대 · 표 머리가 아니라 **글꼴 바뀜** 이었다. `font-display: fallback` 이 폴백 글자로 먼저 그리고 Pretendard Variable 이 오면 바꿔 그리는데 한글 폭이 달라(프리텐다드 ÷ 맑은 고딕 0.85) 표 · 문단 · 탭이 밀린다. 정본 글꼴 스택 둘째 이름 «Pretendard» 를 제품 `app/fonts.css` 가 `local('Malgun Gothic')` + `size-adjust: 93%` 얼굴로 정의해 풀었다. unicode-range 로 한글 · 라틴 두 얼굴로 나누면 크롬이 조각이 오는 순간 줄 수를 뒤집어 0.9 가 난다(실측). 세 제품이 같은 글꼴 묶음이라 Q-Atelier · Q-Maison 도 같은 원인일 가능성이 높다(아직 안 쟀다 · «오너 결정을 기다리는 것» 에 적음).

---
## Q-Design 견본 두 창 고침 · 진행 막대 transform 전환 (감사 36 ~ 41번) · 2026-11-04

impeccable 감사가 Q-Design 자신에게 남긴 넷을 같은 날 고쳤다. 정본 `patterns/*.css` 값은 손대지 않았고 견본(`preview/`) · 작업대 틀(`tools/build-component-workbench.mjs`) · 도구만 고쳤다. 측정은 `D:/Claude/.claude/design-sweep/impeccable-2026-11-04/probe.mjs qdesign`(4800 정적 4쪽 + 4818 작업대 3쪽 × 4보기).

- 36 · 37번(작업대 다크에 제품 변수 7자리 빠짐 · 자리표시자 3.82)은 **측정기 오탐**이었다. 측정기가 쪽을 연 뒤 `data-theme` 만 바꾸고 바로 재서, 색 전환(transition)이 도는 사이의 «글자는 옛 테마 · 바탕은 새 테마» 를 읽었다(같은 쪽을 보통 브라우저로 열면 대비 미달 0 · 바꾼 직후와 0.7초 뒤를 나란히 재어 확인). 작업대는 제품 테마 묶음을 이미 다 싣고 있었다. 측정기는 이제 테마를 `?theme=` 으로 열 때부터 정하고, 속성을 바꿔야 했을 때는 0.7초 기다린 뒤 잰다. parts · workspace 라이트의 주 단추 1.13 도 같은 오탐이었다.
- 39번 정적 견본 4쪽의 404: `preview/index.html` 이 `../source/css/globals.css`(refresh-source 가 복사한 Q-Atelier 원본 · `@import` 넷뿐인 껍데기)를 읽어 정본 CSS 넷이 404 였다. `dist/q-design.foundation.atelier.css` · `dist/q-design.workspace.css` · `patterns/components.css` · `dist/q-design.palette.atelier.css` 를 제품과 같은 순서로 직접 읽게 했다(Times New Roman 70 · Arial 10 → 0).
- 견본 자신의 글자를 사다리로: index 의 10 · 11 · 11.5 · 13 · 15 · 17 · 22 · 36px 와 굵기 300 · 700 을 12 ~ 40 아홉 단 · 400/500/600 으로(배지 12 · 12 · 14px 에 높이 20 · 24 · 28, 지표 값 `--qd-kpi-size` 40, 입력칸 `--qd-control-height` 44, 글자 표본 카드는 `docs/03-typography.md` 표 그대로). icons 13 → 14px · 700 → 600 · 줄간격 1.25 · 1.5 → 1.2 · 1.4 · 1.6. workspace 13 → 14px · 650 → 600. 네 쪽 사다리 밖 0 · 12px 미만 0.
- 뼈대: 작업대 틀의 「공통 컴포넌트 검증」 은 h1 에서 `<p>` 로(제품 PageHead 가 쪽의 h1 · 쪽마다 h1 둘이던 것 하나로). 메종 · 카르넷 견본에 h2 묶음 이름을 두어 h1 → h3 건너뜀 0. index · parts · icons 에 `<main>`. parts 에 h1 과 `::placeholder` 흐린 색(제품은 기반 CSS 의 전역 규칙이 준다 · 조각 셋만 싣는 쪽이라 같은 값을 둠). 견본 쪽을 오가는 링크는 폰에서 44.
- index.html 라이트의 아슬한 대비 셋(배지 PRIMARY 4.49 · 안내 「완료」 4.45 · 「확인 필요」 4.41)은 견본 자신의 틴트 바탕(배지 10% · 안내 8%)이 원인. 6% · 4% 로 낮춰 4.64 ~ 4.73. 글자색은 정본 값 그대로. 폰 폭에서 글자 표본 줄(설명 220px 옆에 40px 표본)이 카드 밖으로 밀려 고정 테마 단추까지 화면 밖이던 것(412 에서 33px 넘침)은 767 이하에서 설명 아래로 표본이 내려오게. 테마는 `<head>` 스크립트가 CSS 보다 먼저 정한다(parts.html 과 같은 길 · 본문 끝에서 바꾸면 어두운 테마로 한 번 그려진 뒤 넘어가 측정에 잡힘).
- 아뜰리에 1440 의 가로 넘침 -10 은 `scrollbar-gutter: stable` 이 비워 둔 홈이라 넘침이 아니다. 측정기가 음수를 0 으로 둔다.
- 다시 잰 결과: 대비 미달 0(다크 · 라이트) · 자리표시자 0 · Times New Roman · Arial 0 · 사다리 밖 0 · h1 쪽마다 1 · 머리말 건너뜀 0 · main 일곱 쪽 전부 · 가로 넘침 0. 남은 것은 폰 폭 누름 자리(parts 10 · index 1 · 아뜰리에 작업대 1)로 전부 정본 값(36px 작은 조작부 · 12px 글귀 링크)이라 위 «남은 일» 로.
- `tools/check-chars.mjs`: impeccable 플러그인 훅의 캐시 `.impeccable/hook.cache.json`(깃 제외 · 훅이 지적 글귀에 em dash 를 씀)을 건너뛴다. 이 파일 때문에 금지 문자 걸음이 빨갰다. 같은 훅이 index.html 에 낸 지적(`#c97a7a` · `#7ab87a` 위 흰 바탕 · 빈 상태 빛무리)은 어두운 팔레트 상수를 흰 바탕과 짝지은 정적 스캔 오탐이라 무시 목록에 넣지 않았다(실브라우저 측정 대비 미달 0).
- 🔴 함정: 측정기 `probe.mjs` 는 이날 네 세션이 함께 쓰는 파일이다. 20:37 에 다른 세션이 덮어써 위 고침 셋이 사라졌다가(그 사이 index.html 라이트 측정에 「SECONDARY」 2.15 가 다시 찍혀 알았다) 다시 넣었다. 고치기 전 `grep theme= probe.mjs` 로 남아 있는지 볼 것.
- `node tools/check.mjs` 35걸음 가운데 「조각 사본」 하나만 빨갛다. Q-Sonar 세션이 `tools/sync-parts.mjs` 의 PENDING 을 비우는 중(미커밋)이라 Q-Sonar 사본 셋이 원본과 달라서다. 이 작업과 무관하고 그 세션이 받으면 초록.
- 41번(설명서 · 시뮬레이터 왼쪽 선 · 흔들림): 같은 날 저녁에 범위가 P2 로 넓어졌다(40 · 41번). 41번은 오너 결정이라 위 «남은 일» 에 셋(선 · 흔들림 · bounce)을 그림과 함께 적었고, 고치지 않았다. 측정기 `code-scan.mjs` 의 layoutTransition 규칙(`transition: width|height|top|left|…`)은 제품 네 곳만 훑고 Q-Design 은 안 훑는다. 같은 규칙을 정본에 대 보면 CSS 에 셋: `patterns/components.css:351`(진행 막대 · 40번) · `patterns/foundation/atelier.css:1545`(`.qa-top-progress` 상단 진행선) · `patterns/foundation/carnet.css:1589`(`.top-progress` 상단 진행선). 뒤의 둘은 제품 코드가 width 를 인라인으로 주는 자리라 제품 세션 몫.
- 40번(정본 진행 막대 `transition: width` → transform): `patterns/components.css` 의 `.qd-progress-fill` 에 `transform-origin: left` 와 transform 전환을 더했다. 채우는 쪽은 width 100% 에 `transform: scaleX(비율)` 을 인라인으로 준다(아뜰리에 `ProgressBar` 는 561c7de 에서 그렇게 바꿨다). 처음 커밋(06cc3c6)은 width 전환을 뺐는데, 부모 세션 · 아뜰리에 세션이 «width 만 주는 카르넷 `Progress`(DHR `components/ui.tsx:404`) · 메종 인라인 진행 막대가 scaleX 로 바뀌기 전에는 width 전환을 빼면 그 둘이 전환 없이 툭 바뀐다» 고 해서 같은 날 둘 다 두는 쪽으로 되돌렸다. 그 둘이 바뀐 뒤 width 를 빼는 것이 40번의 끝(탐지기 layoutTransition 도 그때 0). `docs/06-components.md` 진행 막대 줄과 견본 둘(`preview/fixtures/maison.tsx` · `maison-comparison.tsx`)도 맞췄다. 산출물은 `build-foundation` · `build-native-offline --write` · `build-atelier-simulator` 로 다시 만들었다. `check.mjs` 는 35걸음 가운데 둘이 빨갛다: 「조각 사본」(세 제품의 `app/q-design.components.css` 가 정본보다 이 한 줄 뒤 · Q-Sonar 세션의 셋을 합쳐 7곳)과 계약 시험 하나(`component-style-contract.test.mjs` «every target holds an exact generated component canon» · 같은 까닭 · 사본과 정본의 차이는 이 줄 하나뿐임을 diff 로 확인). 둘 다 sync 를 돌리면 초록이 되는 자리라 sync 결정 때까지 빨간 채로 둔다. **정본만 고쳤고 sync(`extract-all.mjs --sync`)는 오너 결정** · 세 제품의 사본 `app/q-design.components.css` 는 아직 옛 줄이다. 🔴 함정: 아뜰리에 세션이 같은 시각에 `dist/q-design.simulator.atelier.html` 을 다시 만들어 561c7de 에 담았는데, 그 산출물은 내 작업본의 새 줄로 만들어져 HEAD 의 정본과 산출물이 한 커밋 동안 어긋났다(이 커밋에서 맞음). 같은 작업트리를 쓰는 세션은 산출물을 다시 만들기 전에 `git status` 로 남의 미커밋 정본 변경이 있는지 볼 것.
- 41번 반영(오너 결정 «A 가로 괘선» · 흔들림 · bounce 는 «정리»): 설명서 조각 `patterns/foundation/atelier-manual.ts` 의 `aside`(tip · warn)를 왼쪽 3px 선 대신 위 1px(금색 · 주의색) + 아래 1px 괘선 · 모서리 0 으로, `figure.shot figcaption` 을 왼쪽 2px 선 대신 위 1px 괘선으로. 아뜰리에 조리법 `patterns/foundation/atelier.css` 의 위젯 편집 모드 흔들림(`qa-widget-jiggle` 키프레임 · 기울기 변수 셋 · reduce 블록)을 지우고 끌기 중 흐림(`.qa-dragging` 0.5)만 남겼다. 카르넷 유틸리티 `carnet-theme.css` 의 `--animate-bounce` 토큰과 `@keyframes bounce` 를 지웠다(DHR 어디서도 안 씀). 확인은 정본 설명서 CSS 를 배포본 `download-base.html` 의 `<style>` 에 그대로 끼워 찍어서(`out/qdesign-41/after-manual-41.png` · 계산값 왼쪽 0 · 위 1px · 모서리 0). 산출물은 `dist/q-design.foundation.atelier.css` 만 바뀌었고(오프라인 · 시뮬레이터는 흔들림 블록이 안 들어가는 쪽이라 그대로) `check.mjs` 의 「조각 사본」 은 6 → 9곳(설명서 · 카르넷 유틸리티 · 아뜰리에 기반 사본이 정본보다 뒤)으로 같은 까닭의 빨강. sync 는 오너 결정.

---

## Q-Carnet 접근성 넷 (감사 5 · 16 · 17 · 19번) · 2026-11-04

impeccable 감사에서 Q-Carnet 에 남은 접근성 지적 넷을 같은 날 고쳤다. 정본 쪽 바뀐 것은 둘(29fd100). 제품 쪽 기록은 DHR `docs/SESSION_LOG.md` 같은 날.

- `patterns/foundation/carnet.css`: `.stagger` 순차 등장에 `@media (prefers-reduced-motion: reduce) { .stagger > * { animation: none } }`. 공용 reduce 규칙은 `.qd-skeleton` 만 끄고, 전역 규칙은 길이만 0.01ms 로 줄여 지연(35~280ms) 동안 `both` 채움으로 카드가 안 보였고 측정기에 «도는 애니 10» 으로 잡혔다. 공용 규칙을 전부로 넓히는 결정(13 · 17번)은 위 «남은 일» 그대로.
- DHR `components/ui.tsx` 를 `--adopt` 로 받음: Panel 이름의 기본 수준 h3 → h2(16번 · 15화면). 제품 커밋 DHR 6f589f5 · 사본 받기 fc190ff.
- 정본 `.qd-table` 의 줄 링크 갈래(`tr[role='link']`)는 이미 있었고 Carnet `components/row-link.tsx` 가 그대로 쓴다. 5번(출하 목록 918)은 펼침 줄이라 줄 끝 글귀를 진짜 단추로 두는 쪽으로 제품에서 고쳤다. 새 부품은 만들지 않았다.
- 다시 잰 결과(카르넷 27주소 × 4보기 108상태): 입력 이름 없음 0 · 머리말 건너뜀 0 · reduce 에서 도는 애니 0 · 마우스 전용 925 → 7(체크 칸 `label` 안 글자 6 은 측정기 오탐, 페이저 1 은 위 «남은 일»).
- `node tools/check.mjs` 35걸음 통과. `status.mjs` 의 Q-Forge 는 18/18 · 부품 5/5.

## Q 제품군 impeccable 상세 감사 · 2026-11-04

오너가 `/impeccable audit` 를 Q 제품군 전체에 돌리자고 했고, Q-Design 까지 넣었다. 고친 것은 없고 적기만 했다. 보고서는 [docs/audits/2026-11-04-impeccable-q-suite-audit.md](audits/2026-11-04-impeccable-q-suite-audit.md), 화면별 수치는 옆의 `.tsv`, 측정기 · 코드 스캔 · 원자료는 `D:\Claude\.claude\design-sweep\impeccable-2026-11-04\`.

- 점수(20점 만점 · 접근성 · 성능 · 테마 · 반응형 · 정합성): Q-Carnet 18 · Q-Design 15(→ 16 · 36 · 37번이 측정기 오탐으로 드러나 같은 날 정정 · fbf7cbd) · Q-Atelier 14 · Q-Maison 13 · Q-Sonar 12. P0 없음, P1 여섯(Atelier 운영 CLS 21화면 · Sonar 사다리 미적용 + 12px 미만 866요소 · Sonar 폰 44 미만 467요소 · Sonar 미리보기 차단 · Carnet 표 줄 키보드 불가 · Maison 폰 44 미만 41자리). Q-Maison 은 처음엔 공개 5화면 + 코드만으로 15(신뢰 낮음)였고, 같은 날 20:48 오너가 도커를 켜 로그인 뒤 53화면을 잰 뒤 13 으로 확정했다(라이트 대비 미달 19자리 · 거르기 자리표시자 2.54 · 차림표 줄간격 1.5 ×1,800 · 폰 44 미만 41자리 · 보고서 42 ~ 51번). 자리 밀림 0 · 가로 넘침 0 · 모서리 · 그림자 · 카드 안 카드 0 으로 틀은 정본 안.
- 실측 범위: dev 네 제품 92화면 × 4보기(1440 어두운 · 밝은, 412 · 375 어두운) + Q-Maison 로그인 뒤 53화면 × 4보기(로컬 수파베이스 · SaaS 관리자 시드 계정 · 쿠키 방식) + Q-Design 정적 4쪽 · 작업대 3쪽 + 운영 로그인 4곳 + Q-Atelier 운영 로그인 뒤 43화면(1440 어두운). 반응형 감사(10-23)에서 못 잰 /admin 은 8화면을 잤다(사다리 밖 0 · 대비 0 · 누름 자리 0).
- 2026-10-26 글자 결정의 실측: 정본 사본을 받은 Atelier · Carnet 은 사다리 밖이 Atelier 제목 clamp(37/36.5px) 하나뿐이다. Q-Sonar 는 PENDING 3조각 그대로라 크기 8종 · 굵기 700 · 줄간격 10종이 밖에 있다.
- 걸려 넘어진 것: Git Bash 에서 측정기에 `--only=/login` 같은 경로 인자를 주면 MSYS 가 윈도 경로로 바꿔 anon 화면이 전부 건너뛰어진다(`MSYS_NO_PATHCONV=1` 로 해결). 4800 의 부품 견본 3쪽은 CSS · 글꼴 404 라 결과가 쓸모없어 4818 작업대로 다시 잤다. 측정기의 «초점 갇힘» 은 처음 40개 조작부 밖으로 넘어가면 오탐(실브라우저로 확인). Q-Sonar 쿠키 로그인은 로컬 전용이라 운영 로그인 뒤는 못 잼. 보고서 부록 D.

---

## R&D 상세 양식 단계 카드의 각진 강조 테두리 · 상자 60개 전부 10px 로 · 2026-10-28

오너가 폰(어두운 테마)에서 R&D 상세를 보고 「어떤 건 라운드고 어떤 건 사각이네요」. «R&D 양식» 의 단계 카드(임상 평가 보고서)는 각진 네모, 바로 아래 «07 문서 작업» 지표 상자(필수 문서 31)는 둥근 10px 였다.

- 실측(실화면 DOM 순회 · Q-Atelier `/research/RD-2026-001` · Demo co. · 412 · 375 · 1440 · 어두운 · 밝은): 네 변 테두리나 outline 이 있는 상자 60개 가운데 0px 는 하나뿐, 나머지 47개는 10px(원 11 · 알약 1 은 제외). 세 폭 · 두 테마 모두 같다.
- 원인은 정본이 아니라 제품 쪽. 단계 카드는 `Bx` 보통 갈래(10-23 «3» · 위 괘선 하나 · 모서리 0)인데, 그 위에 2px 강조 outline(내 차례 · 고른 문서 · 앞 단계 진행 중)을 그려 각진 네모로 보였다. 정본은 «색 테두리 강조는 상자(면 · 네 변 · 모서리 10)» 라 outline 이 아니라 상자여야 맞다.
- 고침(Q-Atelier `components/RdDocumentFlowPanel.tsx` 한 곳): 강조를 outline 대신 카드 자신의 `borderColor` 로. `Bx` 가 테두리 색을 받으면 상자 갈래로 그린다(2px outline → 1px 색 테두리, 같은 화면의 «지금 가장 중요한 작업» 카드와 같은 말). 정본 CSS 는 손대지 않았고 동기화도 돌리지 않았다.
- 비교판(지금 · A 상자 · B 지표 넷을 장부형으로 + 강조는 면만, 어두운 · 밝은, 412)을 덧입힘으로 찍어 보여 드린 뒤 오너 선택 **A**. 그림과 측정표: `D:\Claude\.claude\design-sweep
adius-2026-10-28\`(compare-412.png · scan-before.md · scan-after.md · after\).
- 고친 뒤 실측: 0px 0개 · 10px 48개(세 폭 · 두 테마 같음). 제품 시험 479 · typecheck 초록. 운영 반영 Q-Atelier main 0f45b7ba · 버셀 READY · 운영 www.qatelier.co.kr 같은 화면 실측(412 · 1440 · 두 테마) 0px 0개 · 10px 48개.
- 뒷정리(같은 날 오너 «지금 걷기»): 제품이 더 안 읽는 값은 **둘**(`--qd-atelier-document-outline-width` · `--qd-atelier-outline-offset-add1a4a27f`). 처음에 «셋» 으로 셌던 `--qd-atelier-outline-offset-de44b94b65` 는 `app/(app)/lots/page.tsx` 가 아직 읽어 남긴다(걷기 전에 제품 전체를 grep 으로 다시 셀 것). `atelier-core-values.css` 두 줄과 `atelier-conditional-values.json` 기록 하나를 걷고 `--sync --only=Q-Atelier` 로 받았다(Q-Atelier a316c6bf · 표 두 결 주석 b894807 도 함께 받음 · 화면 변화 없음). 정본 시험 210 · 제품 시험 466 초록.

## 알림 닫기 단추를 첫 줄 가운데로 · 2026-10-28

오너가 Q-Atelier 에서 저장한 뒤 뜬 «저장됨» 알림을 보고 「뭔가 이상하다」 고 지적. «고침» 갈래(결함만 없앰 · 시안 없이).

- 실측(견본 `serve-component-workbench`, 1366 · 375 · 밝음 · 어두움): 아뜰리에 닫기 단추(44 × 44)가 첫 줄(22.4) 위에 맞춰져 한 줄 알림이 70px 로 늘고, × 는 글보다 11px 아래(중심 35 대 24). 메종(Sonner 닫기 단추 top 12)도 11px 아래, 카르넷 «닫기»(36)는 7px 아래.
- 정본 `components.css`: `.qd-toast` 에 첫 줄 높이 `--qd-toast-line`(조작 글자 × 1.6). 닫기 단추는 누르는 자리를 지키고 위아래 음수 여백으로 첫 줄 가운데에 놓는다. `foundation.css`: 메종 닫기 단추 top 을 같은 식으로, 카르넷 «닫기» 는 640 이하에서 44 기준으로.
- 결과: 한 줄 알림 70 → 48.4px(카르넷 49.4), 닫기 중심 = 첫 줄 중심(24.2). 두 줄 이상이어도 첫 줄에 붙는다. 넘침 0.
- 🔑 함정: 단추가 알림 가장자리 2px 까지 올라가자 아뜰리에 키보드 초점 테두리(바깥 4px · 빛 번짐 4px)가 알림의 `overflow: hidden` 에 위아래가 잘렸다. 아뜰리에 초점 규칙(`button:focus-visible:not(:disabled)`)은 층 밖이라 `components.css`(층 안)에 쓴 줄은 졌다. 층 밖인 `foundation.css` 에 «알림 닫기 단추의 초점은 안쪽에» 를 두어 Tab 으로 테두리 전체가 보이는 것을 확인.
- 아뜰리에 `Toast.tsx`: 제목 없는 알림의 아이콘 위 여백 0 → 2px(아이콘 중심 22 → 24, 첫 줄 24.2). TTL 막대 주석을 실제(2px · 상태색)로.
- 남긴 것(«바꿈» 후보, 오너께 시안으로): 성공 알림의 초록이 셋(테두리 · 아이콘 · 줄어드는 막대), 오른쪽 위 알림이 머리띠의 알림 종 · 배지를 덮는 자리.
- 운영 반영(오너 승인 «둘 다 올려 줘»): Q-Carnet b0b4e49 · Q-Atelier bf16cf0f. 알림은 로그인 뒤에만 떠서, 운영 로그인 화면에 운영 CSS 그대로 같은 짜임을 띄워 쟀다. 아뜰리에 한 줄 48.4px · 닫기 중심 = 첫 줄(24.2) · Tab 초점 테두리 2.2 ~ 46.2 로 안에 다 보임. 카르넷 1024 · 375 둘 다 49.4px · «닫기» 중심 24.2 · 넘침 0.
- Q-Maison(Q-Works cd6f1418)은 로컬 커밋만. 아래에 다른 세션의 b0caed42(표 열 폭 · 117곳 실측 전)가 있어 함께 묶이므로, 그 실측 뒤 오너가 말할 때 같이 올린다.
- 앱 오프라인 사본 셋(Q-Atelier-App ff29983 · Q-Maison-App 52ed080 · Q-Carnet-App 6ffa764)은 105965f(표 열 폭)를, 메종 · 카르넷 앱은 c50df5e(지표 사다리)까지 이번에 처음 받았다. 그 두 날의 내보내기가 앱 사본을 커밋하지 않았던 것.

## 표는 두 결 · «기록 · 수치» 표는 data-grow="0" 으로 고른 펼침 · 2026-10-28

오너가 운영 Q-Carnet 배치 상세의 표 셋(공정 기록 · 일차별 기록지 · 제품 로트)을 보고 「표 배치 상태가 가관 · 세 표는 각각의 규칙이 있어야」 고 지적. 안 넷을 실측해 비교판으로 보여 드린 뒤 오너 결정 «두 결로 가요».
비교판: https://claude.ai/artifact/YCE7xGbwGkNCim1z2mvDeq

- 왜 그렇게 보였나: «늘어나는 열 하나» 는 그 열에 긴 글이 있을 때만 맞다. 배치 상세의 표 셋은 열이 전부 짧은 값(일차 · 시간 · 설비 · 수량 · 날짜 · 상태)이라 주인 열(투입 자재 · 1일차 · 형명)이 남는 폭을 빈 채로 받아 «왼쪽 덩어리 · 빈 자리 · 오른쪽 덩어리» 로 갈렸다. 1920 에서 빈 자리 600 ~ 1,100px.
- 결정: 표는 두 결. **장부**(긴 글 열이 하나 있는 목록 · 지금 규칙 그대로 `data-grow="N"`)와 **기록 · 수치**(열이 전부 짧은 표 · `data-grow="0"` · 어느 열도 늘지 않고 남는 폭을 모든 열이 똑같이 나눈다). 어느 결인지는 지금 든 자료가 아니라 열이 무엇을 담는지로 정한다.
- 🔑 `data-grow="0"` 은 새 CSS 가 아니다. 모든 열이 `width:1%` 이고 auto 열이 없으면 브라우저가 남는 폭을 열마다 같은 몫으로 나눈다(실측: 1920 에서 열마다 +69px, «표를 글 폭만큼만» 안과 열 폭이 같았다). 정본은 7장 «표» 와 `components.css` 주석에 적고, 시험 `table-grow.test.mjs` 에 «0 에 늘어나는 열이 걸리면 안 된다» 를 더했다.
- 뺀 안 둘: 가장 긴 글에 비례해 나누는 안은 알약 · 날짜 열이 세 배로 부풀었고, 주인 열을 40% 로 막는 안은 «일차» 세 글자 열에도 40% 가 남았다.
- 카르넷 표 부품 원본(`carnet/components/table.tsx`): `grow && grow !== 1` 이 0 을 떨어뜨려 `grow !== undefined && grow !== 1` 로. 0 의 뜻을 주석에.
- 카르넷 배치 상세 표 넷(제품 로트 · 일차별 기록지 · 공정 기록 · 인쇄 이력)을 `grow={0}` 으로(Q-Carnet 458925b). 1440 · 1920 실측: 빈 자리 없이 열 사이 틈이 고르게, 열 폭은 비교판의 «고른 펼침» 과 같은 값. 시험 302 · 단위 132 · tsc 0. 전후 그림을 본 오너 «둘 다 올려요» 로 Q-Carnet 458925b · Q-Maison 3cd0af2a(정본 주석 사본만 · 화면 변화 없음) 운영 푸시, 버셀 READY.
- 나머지 표 96개(카르넷 41 · 메종 55)를 열 내용으로 가른 목록(https://claude.ai/artifact/1N4Fd3PJzTNwLfSHuBW2Dm): 장부 76 · 기록 20 · 여쭘 5. 오너 «네, 바꿔요» → 카르넷 기록 결 13곳(마감 대기 · 최근 활동 · 감사 추적(부품 audit-table 하나) · 집계 둘(부품 하나) · 형명별 자재 원가 · 배치별 · 제품 로트별 원가 · 완제품 재고 · 작업 지시 · DMR 수량 · 사용자 · 출하 승인 · 출고 가능 · 추적 공정 기록)을 grow 0 으로(Q-Carnet 56615c3), 메종은 수율 공정별 하나(Q-Works 67676a90 · 로컬 스택 꺼져 실측 없음). 전후 그림을 본 오너 «둘 다 올려요» 로 두 커밋 운영 푸시, 버셀 둘 다 READY. 메종 위험 매트릭스 둘은 정본 `.qd-table` 이 아니라 규칙 밖. 여쭘 5개는 목록 표기대로.
- 🔑 함정: 카르넷 동작 열 머리(`ActionTh`)의 `w-0`(0px)은 그 칸만 퍼센트 폭이 아니라서, grow 0 표에서 브라우저가 남는 폭을 전부 그 칸에 주었다(마감 대기 517 · 작업 지시 251px). 정본 2aa3830 에서 걷고 폭을 규칙(1%)에 맡기니 열마다 같은 몫. 1440 재실측 26표: 기록 결 15개 모두 열마다 +10 ~ +277, 장부 결은 변화 없음, 넘침 0.
- 다음: 카르넷 제품 설정 표의 늘어날 열을 «공정 흐름» 으로(넘침 898px) · 메종 넘치는 표 9개는 열을 덜거나 굴리는 다른 손질 · 메종 상세 화면 표 62곳은 아직 안 봄. 그 밖의 표(카르넷 41 · 메종 55)는 열 내용으로 결을 하나씩 가려 목록을 보여 드린 뒤 바꾼다(짧은 표본 자료 때문에 빈 자리가 커 보이는 품목 · 문서명 표는 장부가 맞다).

## 표 열 폭 규칙 «표 하나에 늘어나는 열 하나» · 2026-10-28

오너가 Q-Carnet 홈 «마감 대기» 표를 보고 「표 너비에 통일성이 없다」 고 지적 → 카르넷 전 화면 표 41개(화면 26곳)를 Playwright 로 재고 전후 그림을 보여 드린 뒤 오너 결정.
보고서: https://claude.ai/artifact/6E9ndL2wYfBiQRd9RssMTn

- 실측: 표 41개 모두 1120px 인데 열 폭을 정한 표가 0. 남는 폭이 표마다 «가장 긴 글 열» 로 흘러 생김새가 제각각(마감 대기 603 → 남는 518 이 작업일 37% · 진행 26%). 제품 표준서는 공정 흐름 898px 라 1695px 로 넘침.
- 정본 `components.css` `.qd-table`: 늘어나는 열 하나(`data-grow="N"` · 없으면 첫 열 · 셀 `.qd-col-grow` 길도) 만 `width:auto; min-width: 8em; 줄바꿈`, 나머지 `width:1%; nowrap`. 적는 표(`--editable`) 밖, `.qd-table-description` · `[colspan]` 은 줄바꿈. `data-grow` 는 1 ~ 12 까지 nth-child 로 푼다. 규격은 [7장 표](07-screens.md).
- 시험 `tools/table-grow.test.mjs`: 정본 · dist 에 규칙이 있고 1 ~ 12 가 다 있는지.
- 규칙을 입힌 41개는 1440 에서 넘침 0. 🔴 늘릴 열을 기계(가장 긴 글)에 맡기면 10곳이 틀려 제품이 표마다 열을 적는다. 폰(412)은 다 넘치지만 `.qd-table-scroll` + `data-cut` 으로 굴린다.
- 제품: Q-Carnet `components/table.tsx` `Table` 에 `grow` 인자, 날것 표 · `TableWrap` 을 `Table` 로 옮김(그날 DHR 기록). Q-Atelier(4곳) · Q-Maison(117곳)은 같은 정본을 받으므로 전후를 찍어 오너께 보인 뒤 운영.
- 🔑 구현 함정 둘. 글 단추(`.qd-text-action`)가 글 폭 칸에서 «변경 항목 0» 두 줄로 꺾였다. 기초가 단추를 normal 로 두는 결정(10-22 한 글자씩 끊김 방지)은 그대로 두고, 표의 글 폭 칸 안 단추만 nowrap. 줄을 세로로 합친 표(rowSpan)는 합친 줄에서 몇째 열인지가 밀려 `data-grow` 가 어긋나므로 셀에 `.qd-col-grow`(카르넷 자재 지출). 바닥 12em 은 발주 표가 1440 에서 30px 넘쳐 8em 으로.
- Q-Atelier 는 표에 정본 `.qd-table` 을 걸지 않아(변수 · 머리글 고정만 씀) 이번 규칙이 닿지 않는다. 아뜰리에 표를 정본 클래스로 옮기는 일은 남은 일. Q-Maison 117곳은 로컬 스택(도커)이 꺼져 있어 못 쟀다.
- 메종 실측(같은 날 뒤에, 로컬 스택 도커 켜고 1440 · 내용 폭 1120): 고정 주소 화면의 표 55개. 규칙만 받으면 늘어나는 열이 첫 열(번호 · 코드)로 가고 넘치는 표가 3 → 8. 표마다 늘어날 열을 사람이 적어(`data-grow` 69곳 · 소스의 표 83곳 중 적는 표와 상세 화면 표는 제외) 55개 모두 이름 · 제목 · 품목 열이 남는 폭을 받고, 긴 글 열 넷(도면 비고 · 제품명, 재고 이동 위치, 추적 규격)은 `qd-table-description` 으로 줄바꿈. 넘침은 규칙 전과 같은 3개(설비 · 부적합 · 반품, 전부터 감싸개 안에서 굴리던 표 · 비고는 M69 로 일부러 줄인 것). Q-Works ed37e0e7(로컬 커밋 · 푸시는 오너 말 뒤). 전후 모음(비공개) https://claude.ai/artifact/DVACCiDDzQiP42rR4miD7j
- 🔑 메종 함정 둘(Q-Works 6c2f758c 로 막음): ① 정본 CSS 사본이 CRLF 로 체크아웃되면 `q-design-sync` 지문(sha256)이 어긋나 운다. `.gitattributes` 에 사본 전부를 LF 로 묶었다(전에는 `family-exchange.ts` 만). ② 실명 검사 시험이 git 이 무시하는 `.claude/worktrees/*`(다른 세션의 워크트리) 안 마이그레이션까지 읽어 178건을 찾았다. 건너뛰는 폴더에 `.claude` 를 더했다.
- 메종 운영 반영(오너 «올려요», 전후 그림을 본 뒤): Q-Works main 6c2f758c 푸시, 버셀 READY, 운영 CSS 묶음에 `data-grow="12"` · `--qd-table-grow-min-width` 바이트 확인. 네 커밋(b0caed42 규칙 사본 · cd6f1418 알림 닫기 단추 사본 · ed37e0e7 표 69곳 · 6c2f758c 시험 가드)이 함께 갔다. 이로써 10-28 알림 닫기 단추도 세 제품 모두 운영이다. 고정 주소가 아닌 상세 화면 표 62곳은 규칙은 닿지만 전후를 찍지 않았다.

## 지표 값 사다리 네 단 · 폰 탭 한 줄 · 잘림 표시 · 폰 머리줄 뒤로 · 2026-10-27

오빠 지시 «카르넷 정밀 감사 19건 전부 고치고, 정본에 구성할 수 있으면 정본에». 감사 보고(36화면 × 1440 · 412 × 밝음 · 어둠)의 지적 가운데 정본이 쥘 것을 정본으로 올렸다(c50df5e).

- 지표 값 크기(D1). `16cqw` 흐름 크기는 사다리 사이 값(1440 에서 27px 같은)을 냈다. 이제 `.qd-kpi-value` 는 `--qd-kpi-size`(40) 하나를 읽고, 지표 칸 폭이 260 · 200 · 150 아래로 내려갈 때 `@container` 로 32 · 28 · 24 를 고른다. `tools/kpi-ladder.test.mjs` 가 정본과 산출물 넷에서 사다리 밖 값과 cqw 를 막는다. 옛 토큰 둘(`--qd-kpi-min-size` · `--qd-kpi-fluid-size`)은 아뜰리에 지표 부품(인라인 clamp)이 아직 읽어 남겨 뒀다(아래 남은 일).
- 현황 지표 이름(D2) `workspace.css` 13px/1.5 → 14px/1.4. 입력 칸 줄 간격(D3) `html .qd-input { line-height: var(--qd-control-leading) }` 로 UA 기본을 덮는다(`<select>` 는 크롬이 normal 로 보고하지만 높이는 같다). 지표 보조 글자(D4) 자간 0.
- 폰 탭(U11) 640 아래 `.qd-tabs` 는 줄 바꿈 없이 가로 굴림. `.qd-tabs > * { flex: 0 0 auto }` 가 없으면 항목이 줄어들어 겹친다(처음 사진에서 설정 탭이 겹쳐 보여 알았다).
- 잘림 표시(U12) `.qd-table-scroll` · `.qa-scroll-table` · `.qd-tabs` 에 `data-cut="start end"` 가 붙으면 그 끝을 마스크로 흐리게 한다. 색은 `currentcolor`(DHR `check-theme` 가 `#000` 을 잡는다). 붙이는 쪽은 제품(카르넷 `components/scroll-cut.tsx`, 고른 탭을 가운데로 굴리는 것까지). 인쇄에서는 마스크를 끈다.
- 폰 머리줄 뒤로(U13) `.qd-mobile-back` 은 640 아래에서만 보인다(규칙 순서 주의: `display: none` 이 미디어 블록 뒤에 오면 이긴다). 카르넷의 떠 있는 뒤로 단추는 640 아래에서 숨기고 본문 아래 여백을 되돌린다.
- 카르넷 지표 줄(U2 · U10) `html .qd-grid-kpi.carnet-kpi-rows-N` 으로 올려 10-17 의 `html :is(.qd-grid-kpi …)` 보다 세게 했다(1440 에서 6+1 → 4+3). 넷 미만은 `carnet-kpi-few`(2열 → 762 부터 4열).
- 카르넷 공용 부품 `ui.tsx`: 끝난 상태 톤 `done`(회색 알약 + 점, 초록은 «출하 승인» 만), `Empty` 의 `reset`(찾아서 빈 목록에 «조건 풀기»). 정본 사본을 먼저 고치고 `--sync`.
- 안 한 것 하나(D7 차림표 바닥 «THEME · LIGHT»): `theme-toggle.tsx` 에 09-15 오너 지시 «세 제품 같은 영어 표기» 가 적혀 있어, 바꾸려면 세 제품을 같이 바꿔야 한다. 위 «남은 일» 의 «바꿈» 후보 그대로.
- 걸려 넘어진 것: `--only` 없는 `--sync` 가 Q-Sonar 넷을 또 썼다(위 10-27 기록대로 되돌림). 산출물 주석의 «cqw» 한 단어가 새 시험에 걸렸다. 정본 커밋 뒤 `--only=` 로 한 번 더 돌려야 제품 판 파일의 `since` 에 해시가 찍힌다.
- 검사 35 걸음 모두 초록. 카르넷 로컬 실측(1440 · 412): 지표 32 · 24px, 지표 줄 4+3 / 2+2+2+1, 폰 탭 한 줄 49px, 출하 화면 높이 10,532 → 5,850, 가로 넘침 0. 제품 사본 커밋은 DHR 78da75f · Q-Atelier ce9c5f01 · Q-Works f4210037(로컬 · 운영 푸시는 오너 승인 뒤) · Q-Atelier-App f9471bc(푸시).

## 카르넷도 이동 글귀 «F» · 공용 부품 GoLink · 2026-10-27

오빠 지시 «카르넷 «전체 보기 · 생산으로 · 감사 추적» 손 링크를 정본 이동 글귀 «F» 로». 카르넷은 «F» 를 정한 날(아래 기록) 규칙만 받았고, 화면은 금색 손 링크(`text-xs font-semibold text-brand`)로 남아 있었다.

- 카르넷 공용 부품 `components/ui.tsx` 에 `GoLink` 를 두었다. 정본 사본 `patterns/component-implementations/carnet/components/ui.tsx` 를 먼저 고치고 `--sync` 했다. 모양은 `.qd-text-action--go` 가 쥐고 부품은 끝 꺾쇠(`ChevronRight` · 14px)만 붙인다. 인쇄 화면처럼 `<a>` 로 거는 자리는 `native`.
- 바꾼 자리 다섯: 홈 판 머리 «전체 보기» · «생산으로» · «감사 추적», 생산 › 제품 화면 머리 «제품표준서 열기», 출하 승인 요청서 빈 회차 «인쇄 대장의 이 회차 보기»(손으로 적은 › 걷음).
- 그대로 둔 자리: 줄마다 되풀이되는 «제품표준서에서 고치기», 문장 안 링크(원가 설정의 설비 · 공급자 · 경영 › 원가), 표 안 번호 링크, 감사 추적의 «모든 기록 보기»(같은 화면의 조건 풀기).
- 로컬 실측(1440 · 412): 먹색 rgb(28, 26, 22) · 600 · 14px · 꺾쇠 14px · 판 머리 오른쪽 끝(틈 0) · 폰 높이 44. 폰의 화면 머리에서는 «제품표준서 열기» 가 제목 아래로 내려오고, 글귀 여백 8px 만큼 제목 왼쪽 선보다 안으로 들어간다(정본 글귀 여백 그대로).
- 카르넷 시험 132 · 정본 검사 35 걸음 모두 초록.

## 알약은 글자 수와 상관없이 같은 크기 · 너비 바닥 6.5em · 2026-10-27

오빠 지시 «알약 형태 있잖아.. 정본에서 알약 크기 맞춰줬으면 해 통일성있게» (카르넷 배치 목록의 «재단 완료» · «종료» 그림). 높이는 이미 xs 20 · sm 24 · md 28 로 하나였고, 갈린 것은 글자 수대로 늘던 너비였다.

- 정본: `patterns/components.css`(세 제품이 모두 부르는 공용 부품 정본)에 `--qd-tag-min-width: 6.5em` 과 `.qd-tag { min-width }` 한 줄. 목록 정본(`q-design.list.css`)은 Q-Atelier 가 부르지 않아 여기 두지 않았다(Atelier 의 `Tag` 는 인라인 스타일로 그리지만 너비는 적지 않아 이 줄을 받는다).
- 값의 근거: 카르넷 43화면 452개 · 메종 50화면 344개를 세니 4글자 이하가 94 ~ 95%. «4글자 + 점» 은 72.5px, 빈칸 둘인 «저장 안 됨» + 점은 75.5px 라 6.25em(75px)이면 그것만 비어져 나온다. 6.5em = 78px.
- 실화면(바닥을 덮지 않은 정본 그대로): 4글자 이하 알약의 너비 가짓수가 카르넷 11 → 1(428개 모두 78px), 메종 8 → 1(324개). 높이는 그대로. 칸 밖으로 나간 알약 0 / 452 · 0 / 344.
- Q-Atelier 의 표는 칸마다 고정 폭 격자라 넓어진 알약이 옆 칸으로 넘칠 자리가 셋 있었다(70 · 84 · 90px 칸, 칸 여백 좌우 12px). 110px 로 넓혔다: 검증 근거 «과소» · 기본 문서 «구분» · 템플릿 목록 «기본».
- 잠금: `component-style-contract.test.mjs` «status pills keep one width floor» (em 이어야 하고 6.5 이상).
- 🔴 Q-Atelier 실화면은 재지 못했다. 로컬 개발 서버가 운영 DB 를 보고, 로컬 DB 스택에는 자료가 거의 없다. 고정 폭 칸은 코드로 전수 훑었다(`width:` 가 92px 미만이고 `Tag` 를 그리는 열).
- ✅ 같은 날 운영 반영. 아뜰리에 75ad0c5d 배포 성공, 운영 두 주소(qatelier.co.kr · atelier.medqraft.app)의 CSS 에 바닥 규칙이 실린 것을 받아 확인했다.

## Q-Carnet 화면 점검 · 쪽 넘김 어절 공백 · 표 끝 세로선 · 숫자 뒤 칸 여백 · 2026-10-27

오빠 요청 «전체 화면을 찍어 보고 디자인적으로 이상한 것을 화면으로 확인한 뒤 고치고 정본에 반영». 카르넷 43화면을 1854×1000 · 412×915 로 찍어 사진에서 골랐다. 전후 그림: https://claude.ai/artifact/41XqRR8FRRQ4zj5dP8MR6T (비공개).

정본에서 고친 것

- `extract-list.mjs` 쪽 넘김 · 거르기 건수(`.qd-pager-count` · `.qd-filter-count` 의 `[data-hangul]`)가 글꼴을 본문체로 바꾸면서 `--qd-hangul-word-space`(-0.35em)를 그대로 걸어 «1-31/총31건» · «3682건1/74쪽» 처럼 붙었다. 그 값은 고정폭 공백(0.6em)을 본문 폭으로 줄이는 값이라 본문체(공백 0.251em)에서는 음수가 된다. `word-spacing: normal` 로. 세 제품 공통이라 카르넷 · 메종에 내려받았다(메종 사본 시험 144 통과).
- 되돌아오지 않게: `check-hangul-canon.mjs` 가 같은 규칙에서 본문체 글꼴과 어절 공백 줄임을 함께 거는 자리를 실패로 센다(옛 정본에서 두 곳을 잡는 것을 확인).
- 카르넷 표 부품(`table.tsx`) `ActionTh` · `ActionTd` 의 세로선(`border-l`)을 걷었다. 줄 링크의 꺾쇠 칸에는 선이 없어 머리칸에만 선이 떠 보였다.
- 카르넷 바탕(`foundation/carnet.css`, 층 밖) 오른쪽 정렬 칸 바로 뒤의 왼쪽 정렬 칸은 앞 여백을 2.5배(30px)로. 같은 12px 이면 «3 재단 완료» 처럼 숫자와 다음 칸이 한 덩이로 읽혔다.

카르넷에서 고친 것(정본 밖): 홈 «설정 필요» 띠(단추 한 번 · 오른쪽 끝), 번호 찾기 · 인쇄물 확인 검색 칸의 상자 안 상자, 제품 연동 표지 기호 · 영문 변수 이름, 공급자 «수정» → «고치기», 차림표가 고른 메뉴로 굴러가게(ResizeObserver 로 로고가 늦게 올라와도 다시 맞춤), 백업 «최근» 표지 간격, 바닥글 한글 자간.

걸려 넘어진 것

- 제품 파일에 줄을 더하면 `copy-bindings.current.json` 의 문구 위치를 다시 잇는데, 한 파일에 같은 글이 두 번(«메뉴 닫기») 나오면 `reanchor-copy-bindings.mjs` 가 «ambiguous» 로 멈춘다. 그 파일의 묶음만 더한 줄 수만큼 옮겨 적고 `--check` 로 0 을 확인했다.
- 촬영 도구가 전체 길이 사진을 먼저 찍으면 화면이 잠깐 길어져 차림표 안쪽 굴림이 처음으로 돌아간다. 첫 화면을 먼저 찍어야 고친 굴림이 보인다.

여쭐 것(위 그림 페이지에 시안): 구역 괘선을 판에도 «A» 처럼 제목 위로. 다음 시안 거리: 설정 탭 14개가 1440 에서도 두 줄 · 폰 네 줄, 폰 표가 오른쪽에서 잘리는데 밀 수 있다는 표시가 없음, 뒤로 단추가 폰에서 내용을 덮음, 흔한 상태(종료 · 승인)가 초록(C7).

## Q-Maison · Q-Carnet 상세 · 폼 «3» 옮김 · 잠긴 칸 회색 안내 숨김 · 2026-10-27

오너가 «카르넷 상세 · 폼 화면부터 새 틀로 옮기고, 끝나면 메종도» 라고 했다. 같은 날 Q-Atelier 에 먼저 들인 «3»(꽉 채움 + 칸 자동)을 두 제품 화면에도 입혔다.

- 정본: `patterns/components.css` 에 `.qd-input:is([readonly], :disabled)::placeholder { color: transparent }`. 잠긴 빈 칸의 «예: …» 가 적힌 값처럼 읽혔다(S10). Q-Atelier 는 `In` · `Txt` 가 안내를 빼고, 두 제품은 이 줄이 가린다.
  `patterns/foundation/maison.css` 의 `[data-shell="detail"]` 820 · `[data-shell="form"]` 720 폭 규칙을 걷고 까닭을 주석으로 남겼다.
- Q-Carnet(DHR c099028 · 6a133b9 · d6dbbb8): `PageShell` 뿌리에 `.qd-shell-page`, 읽기 칸 `Field` 에 `wide`, 30 파일의 칸을 `.qd-fields` 로. 옛 1160 상세 기둥(`carnet-detail-width`)은 사본에서 걷혔다.
  좁은 대화창 안에서는 칸 최소 300 때문에 저절로 한 칸이 된다. `check-nav.mjs` 가 손 격자를 막고(현장 모드 폼 넷은 520 기둥이라 뺌), `design-contract.test.mjs` 가 그 가드를 일부러 깨뜨려 본다.
- Q-Maison(Q-Works 0ccc4a2d · 220 파일): 화면 뿌리 126곳(`data-shell`)과 내 계정 화면에 `.qd-shell-page`. 손 격자 214곳을 `.qd-fields`, 긴 칸 62곳을 `.qd-field-wide`, 이어 놓은 묶음 39곳을 `.qd-field-groups` 로.
  글 칸 44곳에 회색 안내를 넣었다(이름 · 전화 · 금액 · 수량 · 부서 · 비고는 칸 이름으로 충분해 둠). 사고 보고 기록지 한 줄은 세 기둥 손 배치(col-start · row-start)를 걷고 적는 차례로 놓았다.
  가드 `tests/unit/field-grid.test.ts` 가 손 격자 · 좁히는 뿌리를 막는다. 좁은 옆 판의 숫자 줄 셋과 품목 규격 줄(줄마다 열이 맞아야 함)은 일부러 남겼다.
- 잰 것(로컬 메종 · 개발 계정): 53화면 × 1920 · 1440 · 412 에서 쪽 넘침 0 · 격자 넘침 0. 1920 에서 다섯 칸(302), 1440 에서 세 칸(352), 412 에서 한 칸(340). 고친 24화면을 다시 재 같은 결과.
- 사본: 공용 CSS 가 바뀌어 세 제품과 앱 셋의 오프라인 화면도 받았다. Q-Atelier 653c6628, Q-Atelier-App 0033898, Q-Maison-App aa19f81, Q-Carnet-App 002d8df, DHR d6dbbb8. `check.mjs` 35걸음 초록 · 원본 대조 114/114.
- ✅ 운영: 카르넷은 카르넷 세션이 시연 전 점검 커밋과 함께 올렸다. 메종(ea74aa25) · 아뜰리에(653c6628) · 아뜰리에 앱 · 정본(af3ef01)은 10-27 오너 지시로 푸시했고 두 배포가 끝났다.
  운영 CSS 를 받아 보니 메종 · 아뜰리에 모두 칸 격자 네 클래스와 `.qd-input:is([readonly],:disabled)::placeholder{color:transparent}` 가 실렸고, 메종의 옛 data-shell 폭 규칙은 없다. 메종 앱 · 카르넷 앱은 원격이 없어 로컬 커밋으로 끝.
- 틀 안 좁힘(04 «틀 안의 표 · 폼도 좁혀 두지 않습니다» 의 뒤따름): 메종(Q-Works db7fb86a)에서 일곱 자리를 걷었다. 도면 효력 발생일 · 평가 기준표 이름(좁힌 상자 → 칸 격자),
  통합 검색 두 줄 · 로트 추적 · 메뉴 권한 한눈에 보기(검색 줄 max-w), 회수 공고 배포(손 폭 칸 w-48 한 줄 → 칸 격자 + 그 아래 기록 단추 줄). 카르넷 check-nav 와 같은 가드를 `field-grid.test.ts` 에 달았고,
  고치기 전 파일에 대 보니 일곱 자리를 모두 잡는다. 표 쪽은 걸린 곳이 없었다: 정본 `.qd-table` 이 폭 100% 를 쥐고, `w-full` 없는 표 11개는 인쇄 서식 · 준비표(제 폭 규칙 있음)다.

걸려 넘어진 것

- 🔴 정본 사본(`app/q-design.*.css`)에 prettier 를 돌리면 모양만 바뀌어도 `q-design-sync.test` 가 빨갛다. `extract-all.mjs --sync --only=Q-Works` 로 되돌렸다. 메종 lint-staged 는 ts · tsx 만 다듬으니 손으로 전체 포맷을 돌리지 말 것.
- 손 격자를 기계로 바꾸다 칸이 아닌 카드 배치 셋까지 칸 격자가 됐다. 가드는 «격자 바로 아래 칸 이름» 을 태그 줄 들여쓰기로 판단하고, 화면을 나누는 `<form>` 두 판 · `<section>` 안 칸 · 열 폭을 손으로 정한 장부 줄(`grid-cols-[…]`)은 거른다.
- 칸 격자 자신이 안쪽 여백 있는 카드(`qd-fields qd-card p-5`)면 측정기가 격자 폭을 테두리 상자(1600)로, 긴 칸을 안쪽 폭(1560)으로 재 «안 닿음» 처럼 보인다. 어긋남이 아니다.

---

## 위험도 색 정본 · 막대 · 검토함 · 평가 상세 · 2026-10-27

오너가 경영진 카드판 «위험도 분포» 에 지금 색과 새 색을 입혀 찍은 그림을 보고 새 색을 골랐고, «막대뿐 아니라 검토함 · 평가 상세 위험도 표까지, 운영 전에 찍어서» 라고 했다.

- 정본: `patterns/foundation/atelier.css` 두 테마 블록에 `--qa-risk-{critical,high,medium,low}`(막대) 넷과 `-text`(글자) 넷. 종전에는 위험도가 red · warning · champagne · green 을 빌려 썼고 라이트에서 높음 · 중간의 맨눈 색차가 2.9 였다.
  막대 넷은 그래프 색 검사기의 색각 이상 · 맨눈 기준을 통과한다(이웃 색차 15.7 이상). 글자 넷은 같은 색상에서 밝기만 옮겨 면 셋 + 배지면 10% 최저 4.57 이상이다. 표는 [02 «위험도 색»](02-color.md), 숫자는 `tools/contrast-table.mjs` 가 쓴다(«생성:위험도» 블록 신설).
- 공용 부품 `DistributionBars` 의 단계 이름을 먹색으로 바꿨다. 색은 막대만 입는다(그래프 글자는 글자 토큰).
- Q-Atelier: `tokens.ts` 에 `RISK` · `riskFill()`, `riskColor()` 는 글자 토큰을 돌려준다. 경영진 카드판 막대는 `riskFill`, 판정 패널이 따로 들던 색 표는 `riskColor` 로 바꿨다. 검토함 · 평가 상세 · 보정 · 규칙표 등 `riskColor` 를 쓰는 곳은 그대로 따라온다.
  `contrast.test.ts` 에 위험도 글자 넷의 배지 실조건 시험을 더하고, 다크 치명 글자를 막대 값으로 바꿔 빨강을 본 뒤 되돌렸다. tsc 통과 · 544 파일 5,898건 통과. 정본 `check.mjs` 35걸음 초록.
- 화면: 로컬 시험 DB 로 찍었다(운영 평가 0건 · 세 화면 모두 서버 렌더). 운영 DB 에 붙은 다른 세션의 개발 서버가 같은 폴더에서 돌고 있어, `.env.development.local` 대신 작업 사본(`.claude/worktrees/risk-color`)에 로컬 키만 프로세스로 넘겨 띄웠다.
  경영진 카드판은 실제 계정 어디에서도 안 뜬다(관리자는 운영 홈, 대표 · 경영진은 대표 홈). 작업 사본에만 둔 임시 화면이 같은 블록을 같은 평가 목록으로 그려 찍었다.
- ✅ 10-27 오너 지시로 운영 반영: Q-Atelier 26db2d55 · Q-Atelier-App 3d4633e · Q-Atelier-iOS c9abf2a 푸시, 버셀 운영 배포 Ready. 위에 다른 세션이 쌓은 사본 커밋(Q-Atelier 653c6628 · App 0033898)은 그 세션 몫이라 `26db2d55:main` 처럼 커밋을 골라 밀었다.
  운영 재측정(www.qatelier.co.kr · atelier.medqraft.app, GET 만): 두 테마 모두 위험도 여덟 값이 커밋한 팔레트와 같고, 세 면 + 배지 바탕 최저 대비가 다크 4.63 · 6.23 · 9.53 · 5.03, 라이트 4.90 · 4.62 · 4.57 · 4.58. 두 주소의 `/offline.html` 에도 값이 실렸다. 운영 DB 에 평가가 0건이라 검토함 · 평가 상세의 실제 배지는 첫 평가가 생겨야 보인다.
- 메일의 위험도 배지(`lib/email.ts`)는 hex 를 따로 쓰는 별개 자리라 이번에 손대지 않았다.

---

## 상세 · 폼 꽉 채움 «3» · 폼 배치 점검 · 2026-10-27

오너가 상세 · 폼 화면의 좁은 가운데 기둥을 짚어 세 안을 보여 드렸고 «3»(꽉 채움 + 칸 자동)을 골랐다.
같은 날 두 번 더 짚었다: 긴 칸은 두 칸 폭이 아니라 줄 끝까지, 그리고 «단순히 넓히지 말고 쓰기 편한 구조로, 적을 내용은 칸 안에 회색으로».
끝에 «어제 영상으로 공부한 폼 배치를 반영해 보라» 고 해 그 대목과 화면을 대조했다.

- 정본: 화면 셸 `.qd-shell-page` · 칸 격자 `.qd-fields`(칸 최소 300 · 줄 사이 16 · 칸 사이 12) · 줄 끝까지 `.qd-field-wide` · 묶음 모음 `.qd-field-groups`(묶음 사이 24).
  `tools/page-shell-css.mjs` 가 `QDRuntime.fields` 값으로 짓고, 묶음 사이가 줄 사이보다 좁으면 멈춘다. 옛 `.qd-shell-detail` 820 · `.qd-shell-form` 720 은 걷고 현장 모드 520 만 남겼다.
  규칙은 [04 «칸 격자»](04-space-layout.md) · [07 «폭과 칸 격자»](07-screens.md) 1 ~ 7번, 계약은 [10장 ⑦](10-rules.md).
- Q-Atelier: 상세 · 폼 62화면을 `PageShell` · `Fields` 로 옮겼다. 칸은 적는 차례(누구 → 무엇 → 언제 → 판단)와 뜻으로 묶고, 글 칸에는 «무엇을 적는지» 회색 안내를 넣었다.
  기록 표 입력판(`RegisterSection`)은 펼친 보기와 같은 `view.groups` 차례로 그린다(짧은 칸을 먼저 모으면 «판정 → 관찰» 처럼 뒤집혔다).
- 영상 대조. 칸 높이 44 · 입력 글자 14 · 이름은 칸 위 · 이름은 약하게 값은 강하게(값 대비 17.4) · 카드 속 카드 없음은 이미 맞았다. 넷을 고쳤다.
  - 칸 이름 옆 긴 문장(최대 165자). 이름과 눈길을 다투고 이름 줄을 여러 줄로 밀었다. `FIELD_HINT_MAX`(20자)를 넘는 글귀는 `FldRow` 가 ⓘ 로 옮기고, 열두 곳은 회색 안내 · ⓘ 로 손으로도 옮겼다.
  - 잠긴 칸이 적는 칸과 같은 흰 상자 · 진한 테두리였다. `.qd-input[readonly]` · `:disabled` 가 화면 바탕 + 옅은 테두리를 쓴다.
  - 묶음 사이가 화면마다 12 · 36 · 40 · 48 로 갈렸다. `FieldGroups` 가 간격을 혼자 쥔다.
  - 도움말이 있는 칸만 입력 상자가 4px 내려앉았다(이름 줄 19.2 → 23.2). 이름 옆 도움말의 위 여백을 지웠다. 한 줄의 이름 줄 열네 개가 모두 19.2.
- 커밋: Q-Atelier 04f24148, Q-Maison(Q-Works) 17987ab1, Q-Carnet(DHR) fee1ff2, 정본 b2a0fb5. ✅ 10-27 오너 지시로 운영 반영: 세 제품 main · 정본 푸시, 세 배포 Ready.
  운영 CSS 를 받아 재 보니 Q-Atelier · Q-Carnet 은 칸 격자 · 묶음 모음 · 잠긴 칸 · 꺼진 칸 규칙이 모두 실렸다. Q-Maison 은 잠긴 칸 · 꺼진 칸만 실렸고 칸 격자는 쓰는 화면이 없어 테일윈드가 깎는다(정상).
  카르넷은 푸시 사이에 다른 세션이 시연 전 점검 고침(ff06bfd)을 먼저 올리며 제 커밋(a237c87)을 그 뒤로 옮겨 붙였다. 고친 내용은 같은 것을 대조했다.
- 시험: Q-Atelier `field-form-layout.test.tsx` 신설(긴 도움말 · 잠긴 칸 · 맨몸 `</Fields><Fields>`). 세 가드를 일부러 깨뜨려 빨강을 본 뒤 되돌렸다.
  Q-Atelier tsc 통과 · 544 파일 5,896건 통과. 정본 `check.mjs` 35걸음 초록. 카르넷 `check-nav` 통과 · 메종 사본 시험 92건 통과.

걸려 넘어진 것

- 🔴 층 안 규칙은 층 없는 규칙에 진다. 묶음 사이를 처음엔 `.qd-fields + .qd-fields` 위 여백으로 줬는데, 층 없는 atelier.css 의 `.qa-section-body > * + * { margin-top: 12px }` 가 이겨 구역 안에서만 12 였다.
  이웃 선택자로 간격을 주지 말고 감싸는 상자의 gap 으로 준다.
- 칸 상태(잠김 · 꺼짐)의 모양을 부품 인라인으로 넣으면 `q-design-adapter.test` 가 막는다. 상태 모양은 정본 CSS 몫이다.
- 정본 `.qd-field-hint` 는 «칸 아래» 도움말이라 위 여백 4px 를 갖는다. 이름 옆에 같은 클래스를 쓰면 그 여백이 이름 줄을 키운다. 정렬을 `center` 로 바꿔도 안 풀렸고, 줄 높이를 재서야 찾았다.
- 메종 · 카르넷의 필수 규칙 목록(`q-design-sync.test.ts` · `check-nav.mjs`)이 옛 `.qd-shell-detail` 820 을 붙잡고 있었다. 정본 틀을 바꾸면 세 제품의 필수 목록을 함께 grep 한다.

---

## 이동 글귀 «F» · 구역 위 괘선 «A» · 차림표 자간 0 · 단추 줄간격 1.4 · 2026-10-27

10-27 운영 재측정에서 남은 글자 사다리 둘을 풀고, 그 사이 오너가 짚은 화면 둘을 함께 고쳤다.

- 차림표 한글 자간 0.1px: 쓰는 곳 셋(Q-Atelier `Sidebar.tsx` 두 곳 · `components.tsx` 의 FieldError 한 곳)을 0 변수(`--qd-atelier-letter-spacing-1029873b1c`)로 바꿔 제품을 먼저 커밋하고,
  그 뒤 `--qd-atelier-letter-spacing-4a873a4bd2` 를 정본에서 지웠다. 메종 · 카르넷 차림표 항목 자간도 추출 정본을 따라 0.1px → 0.
- 줄간격을 안 적은 단추 · 입력칸: `patterns/foundation/atelier.css` 리셋의 `button, input, select, textarea` 에 `line-height: var(--qd-leading-snug)`(1.4).
  운영에서 높이가 바뀌는 곳을 재 보니 넷(0.8 ~ 3.6px). 그림을 보여 드리고 오너가 «차림표만 고정, 탭은 1.4» 를 골랐다.
  차림표 묶음 머리(32)와 «생산» 부서 묶음 단추(40)는 높이를 적어 그대로, 내 할 일 탭 · 변경평가 두 줄 탭은 3.6px 늘어난다.
- 이동 글귀(오너 지적: 「변경평가 목록으로」 가 옆 설명 문장과 구별되지 않는다). 첫 시안 넷은 «여전히 약하다» 여서 실제 디자인 시스템 예시를 띄워 본 뒤 새 안을 보여 드렸고,
  오너가 «F» 를 골랐다: 줄 오른쪽 끝 · 먹색 · 굵기 600 · 끝 꺾쇠 ›. 정본 `components.css` 에 `.qd-text-action--go`, Q-Atelier `TextLinkAction` 에 `go` 를 두어
  홀로 선 이동 글귀 49곳에 붙였다. 줄마다 되풀이되는 열기 · 보기, 내려받기, 취소 · 뒤로 · 홈으로 · 로그인으로는 흐린 글귀 그대로다. 글귀 끝 « →» 8곳은 꺾쇠가 대신해 걷었다.
  규칙은 [06-components.md](06-components.md) «`TextAction` · `TextLinkAction`».
- 구역 경계(오너 지적: 어두운 대표 홈에서 위젯 경계가 흐리다). 네 안(위 괘선 하나 · 굵은 먹 괘선 · 여백만 · 얇은 테 상자)을 입혀 보여 드리고 오너가 «A» 를 골랐다:
  `.qd-work-section` 위에 괘선 하나(밝은 테 색) · 괘선과 제목 사이 24, 제목 아래 괘선은 걷음. 일반 카드 «위 괘선 하나»(10-23 «3»)와 같은 말이다([08-paper.md](08-paper.md) 표).
- 커밋: Q-Atelier 3739b6bb · fd70eb33, Q-Maison(Q-Works) 84435a2b, Q-Carnet(DHR) f8e080c · 20b18e7(OQ 기록),
  앱 사본 Q-Atelier-App f07277a · iOS 04830ed · Q-Maison-App de22fb9 · Q-Carnet-App 96cc1e2. ✅ 10-27 오너 지시로 운영 반영: Q-Atelier · Q-Works · DHR main, Q-Design · Q-Atelier-App · iOS 푸시. 세 제품 배포 Ready, 운영 CSS 에 새 규칙이 실린 것을 받아 확인했다(메종은 이동 글귀를 쓰는 화면이 없어 테일윈드가 그 규칙을 깎는다 · 정상).
- 시험: Q-Atelier 543 파일 · 5,889건 · tsc 통과. Q-Maison tsc 통과, 시험은 세 제품을 한꺼번에 돌려 31건이 5초 시간 초과로 빨강이었고 그 20 파일만 다시 돌려 254건 통과.
  실명 검사 하나는 10-26 과 같이 다른 세션의 무시된 작업 폴더(`.claude/worktrees/security`) 때문이다(걸린 178줄이 모두 그 폴더 안). Q-Carnet tsc · OQ 302건 통과. 정본 `check.mjs` 35걸음 초록.
- 로컬 화면 실측(운영 DB · 시연 회사 · 1440): 이동 글귀 먹색 rgb(28, 26, 22) · 600 · 꺾쇠 있음 · 줄 오른쪽 끝. 차림표 묶음 머리 넷 모두 32(«생산» 묶음은 시연 회사에 없어 못 잼).
  대표 홈 구역 넷 위 괘선 1px · 제목 아래 0.

걸려 넘어진 것

- 🔴 정본 변수를 지우는 일은 두 번에 나눠야 한다. `refresh-source.mjs` 가 제품의 «커밋된» HEAD 를 읽어서, 제품이 아직 그 변수를 쓰는 채로 정본에서 지우면
  동기화와 `check.mjs` 가 「Unknown canonical variable」 로 멈춘다. 쓰는 곳을 바꿔 제품을 먼저 커밋하고, 그 뒤 변수를 지워 다시 동기화한다.
- 줄바꿈이 섞인 파일(CRLF 사이에 LF 몇 줄)을 CRLF 로만 나눠 줄 번호를 세면 grep 과 어긋난다. `re.split(r'(?<=\n)')` 로 나눠야 맞다.

---

## 글자 사다리 네 값 · 정본과 세 제품 · 2026-10-26

오너가 네 값을 정했다(유튜브 디자인 공부 뒤 «우리 규칙» 9절의 여쭐 거리 넷을 실제 화면에 입혀 보여 드리고 고름).
한글 자간 0 그대로, 크기 아홉 단(12 · 14 · 16 · 18 · 20 · 24 · 28 · 32 · 40 · 사이 값은 올림 · 44 넘는 장식 숫자는 밖),
굵기 400 · 500 · 600, 줄간격 1.2 · 1.4 · 1.6(+ 정렬 리셋 1). 정리는 [03-typography.md](03-typography.md) 맨 위 «2026-10-26 결정».

- 사전 작업: Q-Atelier 요구사항 엔진을 `tokens.ts` 에서 뗐다(f5d7d14a · 오너가 «엔진과 떼고 고치기» 를 고름). 이제 FS · LH 키를 지워도 엔진 근거가 «다시 해야 함» 이 되지 않는다.
- 정본: foundation 세 벌 · components · 추출기(nav · screen · list) · 작업대가 새 값만 쓴다. 옛 이름 `--qd-line-height-*` 를 걷었다.
  새 시험 `tools/type-ladder.test.mjs` 가 patterns · tools · dist 를 훑어 사다리 밖 값을 막고, 세 제품 기반 CSS 에 `b, strong { 600 }` 이 있는지 본다.
- 제품: Q-Atelier 456e7b07 · f001d12b · 4df8f908 · d352f0f7 · 23d036a9, Q-Maison(Q-Works) c4c630bc · b1a7a024 · b3ddbbf9, Q-Carnet(DHR) 7acee50 · 8060110 · 20388d6.
  앱 사본은 Q-Atelier-App · iOS · Q-Maison-App · Q-Carnet-App 에 각각 두 커밋(메종 · 카르넷 앱은 원격이 없어 이 PC 에만).
- ✅ 10-27 오너 지시로 운영 반영: Q-Atelier · Q-Works · DHR main 푸시, Q-Design · Q-Atelier-App · iOS 푸시. 세 제품 운영 배포 Ready.
  메종 · 카르넷 운영 CSS 에 `b, strong` 600 규칙이 실린 것을 받아 확인했다.
- 운영 Q-Atelier 재측정(10-27 · Demo co. 대표 · 1440 × 900): 대표 홈 크기 10 → 7가지 · 굵기 5 → 3 · 줄간격 6 → 4, 용어집 크기 10 → 6 · 굵기 5 → 3 · 줄간격 7 → 4.
  10-26 에 출처를 못 찾았던 12.5 · 13.5px 와 굵기 650 · 800 도 사라졌다. 남은 것 둘은 같은 날 풀었다(바로 위 기록).
- 시험: Q-Atelier 전체 543 파일 · tsc 통과. Q-Maison 은 새 `type-ladder` 시험 포함 통과(실명 검사 하나가 다른 세션의 무시된 작업 폴더 때문에 빨강, 이번 일과 무관). Q-Carnet 전체 통과 · OQ 302건(f45e5a9 · bc227d8). 정본 `check.mjs` 35걸음 초록.
- 실화면 대조: 진열판 여섯 화면(세 제품 × 부품 진열 · 제품 대조)에서 글자를 가진 요소를 모두 재 보니 반영 전에는 13 · 15 · 22 · 36px, 굵기 700, 줄간격 1.3 ~ 2 와 `normal` 이 있었고, 반영 뒤에는 사다리 밖 값이 0개.
- Q-Atelier 설명서 문서 양식(`lib/manual/q-design-styles.ts` · 700 · 1.35 · 1.5)은 화면이 아니라 문서 양식이라 일부러 그대로 뒀다.

걸려 넘어진 것

- 🔴 테일윈드 preflight 의 `b, strong { font-weight: bolder }`. 바깥이 400 이면 700, 600 이면 900 이 된다. 굵기 클래스를 다 바꿔도 `<b>` · `<strong>`(Q-Atelier 327 · Q-Maison 200 · Q-Carnet 238곳)이 700 으로 남았다. 실화면 측정에서만 보였다. 제품마다 맞는 층(아뜰리에 `q-design-reset`, 메종 · 카르넷 테일윈드 `base`)에 600 을 두어 부품의 굵기 지정은 그대로 이기게 했다.
- 🔴 테일윈드 4 의 `leading-N` 은 테마를 지워도 사라지지 않는다. 숫자 줄간격은 간격 단위(`calc(var(--spacing) * N)`)로 만들어진다. 테마로는 못 막아 카르넷 시험이 코드에서 막는다.
- 테일윈드 3 메종은 설정이 `presets` 라 설정 파일만 읽어서는 테마가 비어 보인다. `resolveConfig` 로 풀어서 시험한다.
- 정본 시험이 처음에 `dist/` 를 안 봐서, 추출기 안에 박힌 값(아바타 머리글자 15px · 지표 보조 글 줄간격)이 시험을 통과한 채 제품으로 나갔다. 실화면 측정이 잡았고, 이제 시험이 `dist/` 도 본다.

---

## 전체 점검 · 화면 문구 자리 한 곳 다시 잇기 · 2026-10-25

전체 시스템 점검에서 `check.mjs` 는 35걸음 모두 초록이었다. `check.mjs --products` 의 «화면 문구(제품 코드 전체)» 만 도구가 멈췄다
(`Copy binding changed outside Q-Design: components/ProductProfileWizard.tsx:571`). Q-Atelier 커밋본에서 그 글귀가 한 줄 아래(572)로
밀린 것이라 글자는 그대로다. `reanchor-copy-bindings.mjs --write` 로 줄 번호만 옮겼고(moved 1), 다시 돌린 감사에서 «145 bound» 초록.
남은 빨강 둘(«다 뽑았나» Q-Sonar 색 · «말투»)은 위 «남은 일» 의 다음 바퀴 몫 그대로다.

---

## 일반 카드 · 구역 카드 위 괘선 «3» · 정본 기본값 · 세 제품 · 2026-10-23

«B» 뒤에 오빠가 «남은 일반 카드 · 구역 카드도 장부형으로 바꿔 줘. 먼저 그림부터». 카르네 기한 판 · 메종 홈을
지금 · 2(위아래 괘선) · 3(위 괘선만)으로 입혀 보여 드렸고 «3번(위 괘선만)으로 세 제품 모든 카드에 반영».

- 정본: `.qd-card` · `.qd-panel` 기본값이 면 · 옆 선 · 아랫선 · 모서리 없이 위 괘선 하나. 값은 변수 넷
  (`--qd-card-face` · `-rule` · `-radius` · `-fill`)으로 읽고, 떠 있는 층 · 고른 칸 · 상태 판 · `--box` 가 상자 값을
  선언한다(`patterns/components.css`). 변수가 물려 내려가 창 안의 카드는 저절로 상자다. 규격은 [8장](08-paper.md) «일반 카드 · 구역 카드는 위 괘선 하나».
- 원본(Q-Atelier ee4b0b94): `Bx` 의 보통 갈래가 `RULE_CARD`. `Card` · `Panel` · `SectionCard` 가 모두 거친다.
  `style` 이 면 · 테두리 색 · 위치 · 그림자를 따로 주면 상자로 남는다(`isPlainCard`). 화면이 손으로 그린 카드 93곳도 `...RULE_CARD`.
  뼈대(`Skeleton`)는 지표 칸 아래 괘선 · 표 위아래 괘선으로 실제와 맞췄다(B 때 빠졌던 것).
- Q-Works 4425b49d: `rounded-md border bg-card` 488곳 → `qd-card`, 표 감싸개 4곳 → 표 상자. 단추 · 코드 칸 · 따라오는 띠 · 출하 인쇄 지면은 그대로.
- DHR: 유틸리티로 색을 입힌 경고 · 확인 판 16곳과 앱 설치 안내에 `qd-panel--box`. 현장(`.touch`)의 판 모서리 사본 줄을 걷었다.
- 🔑 카르네 `check-nav` 는 `qd-panel card` 를 붙은 글자로 센다. 상자 표시는 `qd-panel card qd-panel--box` 처럼 `card` 뒤에 둔다
  (앞에 끼웠더니 «정본 판을 29곳만 찾았습니다» 로 멈췄다).
- 🔴 파이썬으로 고친 메종 파일 넷이 CRLF → LF 로 바뀌어 `reanchor-copy-bindings` 가 «Missing or ambiguous unchanged copy» 로 멈췄다.
  문구 기록이 줄바꿈까지 대조한다. 기록이 CRLF 를 기대하는 파일만 되돌렸다. 고칠 때는 바이트로 읽고 쓸 것.
- 🔴 제품의 공용 부품(Q-Atelier `components.tsx` · `Skeleton.tsx`, Q-Works `page-skeleton.tsx`)을 고쳤으면 제품 커밋 뒤
  `build-component-implementations.mjs --adopt --only=<제품>` 이 먼저다. 커밋 전에는 «Commit the product change before adopting» 으로 거절한다.
- 로컬 아틀리에(운영 DB · Demo co.) 열 화면 실측: 남은 상자는 준수 점수 띠(상태 색 판) 하나뿐.
- 운영 실측(배포 뒤, 지난 반응형 전수가 연 주소를 다시 열어 «면이나 네 변 테두리 · 모서리가 남은 블록» 을 셈):
  Q-Atelier 295 → 27(126주소) · Q-Carnet 74 → 8 · Q-Works 387 → 33(157주소). 남은 것은 전부 일부러 둔 것이다.
  알림 상자(`qd-notice`) · 색 든 상태 판 · 색 테두리 강조 판 · 체크 칸을 감싼 이름표 · 점선 자리(파일 · 사진 · 외부 의뢰) ·
  고르기 목록 · 달력 · 준비 표 · 서명 · 로고 미리보기 · 들어간 면 · 경고 상자. 밝은 테마 · 폰 폭(412) 사진도 눈으로 봤다.
- Q-Works 뒤따름 셋. e378f15a: «면 없이 테두리만» 두른 입력 묶음 · 글 판 15곳 → `qd-card`, 첨부 · 항목 목록 15곳 →
  `qd-panel qd-panel--ledger`. 20d001e0: 옅은 면(bg-muted/10)만 깐 시정 조치 «점검 구분» · «구분» 묶음과 내부심사 지적 항목 → `qd-card`.
  1bbf96a9: 현장 관리의 점선 «…없습니다» 셋 → 정본 빈 목록(B 의 빈 칸이 놓친 자리). 빈 목록 가드
  (`tests/unit/canon-six-shape.test.tsx`)가 `(floor)` 를 건너뛰고 있었다. 이제 현장도 보고, 옛 파일로 되돌려 실패를 본 뒤 복원했다.
- 곁가지: 운영 사진에서 Q-Atelier «이 페이지 사용법» 창(층 50)을 목록 검색 줄(`Z.sticky` 100)이 가로지르는 게 보였다.
  카드 변경과 무관하게 검색 줄이 생긴 09-10 부터의 순서다. 창을 ⓘ 설명 창과 같은 `QD.zTooltip` 으로(f476820f).
  같은 50 을 쓰는 떠 있는 창 넷도 운영(Demo co. · RD-2026-001)에서 창 안을 12px 격자로 찍어 쟀다(Q-Atelier 12472248).
  PC(1440)는 모두 0. 이 화면들에는 목록 검색 줄이 없다. 폰(412)에서는 R&D 문서 흐름 ⓘ · 요구사항 지표 카드 넷 ·
  프로파일 «결정 도우미» 가 아랫부분을 바닥 메뉴 줄(`qa-mobile-tabbar` · 층 400)에 깔렸다(창마다 128 ~ 192점).
  셋을 `QD.zTooltip` 으로 올렸고 배포 뒤 다시 재니 폰 · PC 모두 0(지표 카드 #4 의 1점은 둥근 모서리로 깎인 창 밖 자리).
  AI 도우미의 층 50 은 오른쪽 아래 둥근 단추인데 유일하게 부르는 곳이 단추를 숨기고(`hideTrigger`) 창만 써서 그려지는 화면이 없다.
  R&D 팀 검토 화면(/research/review)의 같은 창은 «R&D 팀장 전용» 이라 Demo co. 대표로 못 열었다.
- 못 잰 것: Q-Atelier 운영진(/admin) 화면. 측정 목록에 운영진 주소가 없다(위 «남은 일» 의 운영진 25화면과 같은 이유).

---

## 지표 띠 · 표 상자 · 빈 칸 장부형 «B» · 정본 기본값 · 세 제품 · 2026-10-23

오빠 질문 «이건 왜 큐 디자인이 싱크가 안된거 같지..? 아이솔레이션 아일랜드 이야기 한적있지 않을까?»(카르네 경영 현황의 떠 있는 지표 카드).
동기화가 깨진 것이 아니었다. 10-10 «섬 걷기 · 장부형» 이 현황 개요 덮어쓰기(`patterns/workspace.css`)에만 들어가고 정본 기본값은 상자 그대로였다.
지금 · A(지표 띠만) · B(지표 띠 + 판) 그림을 보여 드렸고 오빠가 «B로 가자. 지표 띠와 판(표 상자 · 빈 칸)까지 정본 기본값을 괘선형으로».

- 원본(Q-Atelier 391425ad): `Bx` 에 `ledger` 갈래(면 · 옆 선 · 모서리 없음, 위아래 괘선, `--qd-table-fill` = 화면 바탕). `KPI` 는 장부형에 아래 선 하나, `EmptyState` 는 장부형. 표를 감싼 `Bx` 13곳에 `ledger`.
- 정본: `.qd-kpi` 아래 괘선 하나 · `.qd-empty` 위아래 괘선 · `.qd-panel` 은 «표나 빈 칸을 바로 담은 판» 만(`:has`) 장부형, `.qd-panel.qd-table-scroll` · `.qd-panel--ledger` 도. 판 안 빈 칸은 제 선을 내려놓는다(카르네 기초 CSS 의 사본 줄을 걷고 정본으로 옮김). 따라오는 머리글은 `--qd-table-fill` 을 읽는다. 개요 덮어쓰기에는 여백 · 글자만 남김. 규격은 [8장](08-paper.md) «지표 띠 · 표 상자 · 빈 칸은 장부형».
- 🔑 `.qd-panel` 기본값을 통째로 바꾸지 않은 까닭: 카르네가 서식 · 잠금 창 · 경고 상자 42곳에 같은 이름을 쓴다(표 판은 그중 일부). 통째로 바꾸면 PIN 창까지 줄만 남는다.
- 🔑 면이 없어지면 표의 붙는 칸(카르네 › 칸 · 아틀리에 첫 칸 고정 · 따라오는 머리글)이 판 바탕(surface)으로 흰 띠처럼 뜬다(라이트에서 뚜렷). 그래서 «표 밑바탕» 변수 하나를 두었다.
- 제품: Q-Works 표 감싸개 107곳(`overflow-x-auto rounded-md border bg-card` 등) → `qd-panel qd-table-scroll`(세로 한계 있는 것은 한계 유지). 오류 · 경고 상자 셋은 그대로. DHR › 칸 세 곳 `bg-surface` → `--qd-table-fill`.
- 생성기가 원본의 장부형 갈래를 못 찾으면 멈춘다(정규화된 원본은 `var(--qd-border-width)` 를 `1px` 로 읽는다. 처음 검사식이 그 차이로 멈췄다).
- 올리기 전 확인: 운영 화면에 변화분을 덧입혀 찍었다(카르네 /board 라이트 · /production, 메종 /capa, 아틀리에 /capa). 판 안 겹줄 0. 🔴 메종(테일윈드 3)은 정본이 층 밖이라 덧입힐 때 `@layer` 로 감싸면 진다(처음 지표 칸이 상자로 남아 헷갈렸다).
- 범위 밖으로 남긴 것: 아틀리에 `SectionCard` · 일반 `Bx` 카드, 메종 `qd-card` · `bg-card` 상자(글 판).

## 반응형 전수 검수(너비 · 높이) · 낮은 화면 차림표 A안 · 세 제품 · 2026-10-23

오빠 요청 «우리 전체 컴포넌트 다 반응형으로 제작되어있는거 맞아? 높이 및 너비 반응형 으로 된게 맞는지 전부 검수 해줘».

- 잰 것: 운영 세 제품 359화면(Q-Atelier 143 · Q-Maison 177 · Q-Carnet 39) × 일곱 크기(1920x1080 · 1280x600 · 1024x768 · 768x1024 · 812x375 · 360x640 · 320x568, 뒤 넷은 터치) = 2,477 상태. 측정기 `D:/Claude/.claude/design-sweep`(`rsweep.mjs` · 요약 `rreport.mjs` · 한 화면 `probe.mjs`).
- 너비: 가로 넘침 0(320 포함). 높이: 낮은 화면에서 연 창 700개(Q-Atelier 329 · Q-Maison 286 · Q-Carnet 85) 가운데 잘려서 못 내리는 창 0.
- 정본 3e99bdb: 화면 높이 값 vh → dvh(폰 주소창이 보일 때 창 · 로그인 틀 아래가 가려지지 않게). `qd-filter-bar--sticky` 는 높이 580 이하에서 따라오지 않는다(320x568 에서 머리띠와 함께 화면을 덮어 남는 높이가 Q-Carnet 품목 227 · Q-Maison 재고 이동 228 이었다 → 운영 재측정 504 · 500).
- 제품 고침: Q-Atelier 75bf2e2c · 7c8a92ba(회수 상세 지우기 단추 12 · 체크 상자 13 → 44, PMS · 허가 «2등 / 급» 쪼개짐, 알림 꼬리표 겹침), DHR 7e4ed8d · 98dc08a(출하 로트 번호 세로로 섬 · 꼬리표 겹침 · 고르기 줄 24 → 터치 44, 작업 화면 «알칼 / 리», 제품표준서 «개정 사유» 잘림), Q-Works ee0f31c4(사본). 운영에서 고친 화면만 다시 재어 문제 0.
- 낮은 화면 차림표(오너 결정 «A안», 비교 그림 지금 · A · B 를 보고 고름): 1366x657 에서 차림표가 Q-Carnet 9개 중 2개 · Q-Maison 3개 · Q-Atelier 13개 중 6개만 보였다. Q-Atelier 에만 있던 «낮은 화면만 줄이기»(09-27 · 로고 56 · 판 번호 접기)를 정본 차림표가 옮기지 않아 두 제품이 빠져 있었다.
  - 497adf8: `patterns/foundation/atelier.css` 의 높이 820 이하 블록이 «한 곳». 비교 그림 값으로 위아래 여백 12 · 로고 52 · 로고 아래 8 · 테마 줄 6 · 테마 단추 안쪽 6 12 · 바닥 위 8 · 계정 줄 아래 6.
  - `tools/extract-nav.mjs` 가 그 블록의 `.qa-sidebar-*` 를 짝(`LOW_PAIRS`)의 `.qd-rail-*` 로 옮겨 nav.css 에 낸다. 값을 생성기에 적지 않는다. 짝 없는 이름표가 원본에 생기면 멈춘다(일부러 넣어 멈추는 것을 보고 되돌렸다). 로고 높이는 옮기지 않는다(정본 표식은 폭만 정한다).
  - 🔴 처음엔 Q-Atelier 의 09-27 값(로고 56 · 아래 14)을 그대로 따랐더니 Q-Carnet 이 4개였다. 오너가 본 그림은 5개였다. 그림 값으로 한 곳을 고쳐 세 제품을 같게 했다.
  - 운영 재측정: Q-Carnet 1366x657 2 → 5 · 1280x600 0 → 3 · 1024x768 6, Q-Maison 차림표 자리 166 → 321 · 109 → 264. 1920x1080 은 그대로(Q-Carnet 9 전부 · Q-Maison 589). Q-Atelier(455d4304) 차림표 자리 350 → 402 · 293 → 345, 보이는 메뉴 13개 중 1366x657 6 → 6 · 1280x600 5 → 6 · 1024x768 9 · 1920x1080 11 그대로. 9월에 이미 줄여 둔 화면이라 늘어난 폭이 작다.
- 측정기 고침(깃 밖): 붙는 띠는 «실제로 붙어 있을 때» 만 띠로 센다(붙지 않은 sticky 가 띠로 잡혀 남는 높이가 작게 나왔다). 문서가 안 굴러가면 가장 큰 굴림 상자를 굴린다(Q-Maison 은 `MAIN.qm-app-main` 안에서 굴러간다). 자체 시험 8/8.
- 🔴 걸려 넘어진 것: Git Bash 에서 `/board` 같은 경로 인자가 `C:/Program Files/Git/board` 로 바뀌어 빈 화면을 쟀다. `MSYS_NO_PATHCONV=1` 을 붙인다.
- 남은 것: Q-Atelier 운영진 25화면(위 «오너 결정을 기다리는 것»), 패드 누름 자리(위 «제품을 고쳐야 풀리는 작은 것»). 폰 «바꿈» 13곳은 그대로 오너 선택을 기다린다.

## 로그인 폼 아래 · 바닥글 배치 규칙 통일 · 세 제품 · 2026-10-22

오빠 요청 «이부분.. 배치 규칙 통일해줘»(로그인 화면 아래 «비밀번호를 잊으셨나요?» 부터 바닥글 끝까지, Q-Atelier 와 Q-Maison 을 나란히 찍은 그림).

- 재 보니 놓인 차례는 셋이 이미 같았다(© → 만든 사람 → 바깥 고리 → 법적 고지 → 고지 글 → 권리 영문). 다른 것은 칸 높이와 사이였다. 찾기 글귀 높이가 32 · 44 · 36, 안내 줄 줄 간격이 1.6 · 1.9, 만든 사람 줄 위가 2 · 0 · 2, 바깥 고리 칸이 32 · 없음 · 44, 고지 글 줄 간격이 1.7 · 1.7 · 1.625, 「처음이신가요」 줄은 Q-Atelier 만 화살표가 있고 Q-Maison 만 누르는 낱말이 있었다.
- 원인은 사본이다. 세 제품이 같은 자리를 각자 그렸다(Q-Atelier 는 화면 파일의 인라인 값, Q-Maison 은 `qm-auth-after · qm-auth-link · qm-auth-note · qm-auth-footer*`, Q-Carnet 은 `carnet-auth-footer · login-hint · social-link` 와 Tailwind 여백).
- 정본 `foundation.css` 에 공용 짜임 `qd-auth-after · qd-auth-sublink · qd-auth-help(-arrow · -link) · qd-auth-foot(-credit · -name · -social · -legal · -note · -caps)` 를 두고, 제품 사본 규칙은 걷었다. 값은 세 제품 로그인 통일 때 정한 기준인 Q-Atelier 값이다. 제품마다 다른 것은 글 내용과 강조색(--qd-accent)뿐이고, 없는 칸은 그리지 않는다.
- 「처음이신가요」 줄은 세 제품이 «→ 와 한 줄, 누르는 낱말은 강조색 밑줄» 로 같다. Q-Atelier 는 「회원가입」 · 「로그인」 낱말이 위의 탭을 연다(전에는 글만 있었다). Q-Carnet 찾기 글귀의 말도 «비밀번호를 잊으셨나요?» 로 맞췄다.
- 폰 375 에서 Q-Carnet 고지 글의 «도구이며,» 가 혼자 다음 줄로 떨어졌다. 고지 글과 안내 줄에 낱말 단위 접기(keep-all)와 줄 길이 고르기(balance)를 넣었고, 괄호 앞과 가운뎃점 앞에서 갈리는 두 곳은 화면 파일에서 한 덩어리로 묶었다.
- Q-Atelier 폼 고리 넓힘(`.qa-auth-form-wrap a::after`)은 바깥 고리에도 걸린다. 사이가 8 이라 이웃 고리와 겹치므로, 터치에서 바깥 고리만 넓힘을 끄는 줄은 제품 규칙으로 남겼다(이름표만 `qd-auth-foot-social` 로).
- 실측(로컬 1440): 세 제품 모두 찾기 32 → 안내까지 22 → 선까지 28 → © → 2 → 12(고리 32) → 8 → 10(줄 간격 20.4) → 6. 폰 375 와 터치에서 바깥 고리는 44 칸. 글색 · 강조색 계산값도 셋이 같다.

## 로그인 첫 화면 새 짜임 · 열 때마다 판이 열리는 등장 · 세 제품 · 2026-10-22

- 오너 요청: Login 의 첫 접속 움직임을 Q 세 제품에도, 조금 더 고급스럽고 심플하게. 그림 만들기 · 디자인 검토는 코덱스와 함께. 오너가 고른 것: 짜임 A + «판이 열린다», 왼쪽 판은 제품 배경 그림 위에 입체 금속 Q · 제품 이름 · 한글 한 줄(«가»), 폼 강조색은 세 제품 공통 샴페인, 움직임은 부드러운 가속 → 감속 → 정지, 영어 문구 없음, 한 줄 문구는 그대로, 로그인 화면을 열 때마다. 배경 그림은 «이대로 좋아요», 반영은 «바로 운영까지».
- 정본(`patterns/foundation.css`)에 공용 로그인 묶음 `qd-auth-*` 을 새로 둔다.
  - 판 `qd-auth-panel` · `-bg` · `-center`, 표지 `qd-auth-mark` 와 빛 `qd-auth-sheen`, 이름 `qd-auth-name` · 한 줄 `qd-auth-line`, 폰 머리 `qd-auth-phone`, 늦게 오는 것 `qd-auth-late`, 폼 줄 `[data-qd-row]`.
  - 상태는 `data-qd-intro` 하나. on 으로 시작해 3.1초 뒤, 또는 첫 누름 · 키에서 off. 움직임은 전부 `prefers-reduced-motion: no-preference` 안이라 움직임 줄이기 설정이면 돌지 않는다.
  - 순서: 판이 화면을 덮은 채 Q 가 떠오르고 빛이 한 번 지나감 → 0.9초부터 1.5초 동안 판이 제 넓이로 물러남(데스크톱만) → 이름 · 한 줄 1.7초 → 폼 줄 1.7초부터 0.05초 간격 → 밝기 고르개 2.0초.
- 제품 결(`foundation/{atelier,maison,carnet}.css`)은 배경 그림 · 판 바탕색 · 빛 색 · 표지 어둡기만 변수로 준다. Q-Carnet 은 색 변수를 테마 블록 안에 둔다(DHR `check-theme` 이 블록 밖 16진 색을 막는다. 가림 그라데이션도 `rgb(0 0 0)`).
- 그림: `source/brand/login/`(만든 글 PROMPTS.md · 배경 · 표지 원본). `tools/app-icons.mjs` 가 세 제품 public 에 `login-mark.webp` · `login-bg-dark.jpg` · `login-bg-light.jpg` 를 쓴다(`asset-pipeline.test` 쓰기 수 4).
- 코덱스 검토(최종 그림 아홉 장). 받은 것 넷: Q-Maison 자동 로그인 체크 상자를 칸 왼쪽 끝(24)에 맞춤, Q-Atelier 폰 밝기 고르개를 24 안쪽으로(전에는 12), Q-Atelier 소셜 링크 테두리 없앰, Q-Atelier 바닥 약관 링크 누름 자리 44. 안 받은 것 둘: 점선 밑줄은 정본 `qd-text-action` 의 결이고, Q-Carnet 테두리 «i» 는 제품 전체가 쓰는 InfoTip 부품이라 로그인만 바꾸면 세 번째 변종이 된다.
- 잰 것: 세 제품 × 1440 · 1366 · 412 · 375 × 어둡게 · 밝게. 가로 넘침 0, 밝기 고르개 44 · 오른쪽 위 24/24, ⓘ 44, 키보드로 움직임 끊김 · 초점 윤곽 보임. 판 넓이 1440 → 1376(1.2초) → 997(1.8초) → 765(2.4초). Q-Carnet 제조소 이름이 폰에서 24 왼쪽으로 쏠려 있던 것을 가운데로(188 · 화면 가운데 187.5). `check.mjs` 35/35.
- 🔴 걸려 넘어진 것
  - 숨은 미리보기 창에서는 rAF · 타이머가 느려져 시각별 재기가 멈춘다. `document.getAnimations()` 를 멈추고 `currentTime` 을 옮겨 가며 상태를 찍었다.
  - DHR `check-theme` 의 종료 코드가 `| tail` 에 가려 초록처럼 보였다. `PIPESTATUS[0]` 로 봐야 한다.
  - Q-Maison `canon-polish` 시험은 foundation 사본에서 첫 `@media (min-width: 1024px)` 를 찾는다. 합친 미디어 질의는 `prefers-reduced-motion` 을 앞에 써서 그 자리를 뺏지 않게 했다.
  - Q-Maison `q-design-sync` 시험이 걷은 리본(`.qm-ribbon-1`)을 찾고 있었다. 새 판(`.qd-auth-panel`)으로 바꿨다.

## 폰 누름 자리 44 · 세 제품 · 2026-10-22

- 전수 검수 세션이 넘긴 일. 폰 폭(412 · 375)에서 손가락 누름 자리가 44 보다 작은 곳을 정리한다. 운영은 읽기만, 고침안 CSS 를 덧입혀 다시 재는 A/B 로 확인했다.
- 거짓 경보부터 걸렀다. 행 전체로 늘린 링크(`after:absolute after:inset-0`)는 측정기가 요소 상자만 재서 작게 나왔다. 측정기에 실제 눌리는 자리를 재는 걸음(`probeHit`, `elementFromPoint` 로 가운데 가로 · 세로 줄을 찍음)을 더해 «요소는 작아도 실제로는 44 이상» 을 `touchCovered` 로 따로 센다. 문장 속 링크는 WCAG 2.5.8 예외라 `touchInline` 으로 뺐다.
- 원칙은 «보이는 모양은 그대로, 누르는 자리만 넓힌다». 보이지 않는 `::after` 가 가로 · 세로 중 모자란 쪽만 가운데로 넓힌다(`inset: min(0px, calc((100% - 44) / 2))`). 넓히면 옆 줄 · 옆 단추를 덮는 곳은 고치지 않고 «바꿈» 으로 모았다.
- 정본(9b146a6).
  - `foundation.css`: 터치 화면의 `qd-touch-hit`(Q-Atelier `qa-touch-hit` 과 같은 계산). Q-Maison · Q-Carnet 에 처음 생긴 공용 규칙이다. 쓰지 않는 자리(촘촘한 목록 · 자르는 요소 · input · absolute 요소)를 주석에 적었다. 폰 폭에서 `qd-tab` 폭도 44(두 글자 탭 42).
  - `atelier.css`: 인증 · 법적 고지 링크의 가로 넓힘을 모자란 만큼으로(「로그인」 43). 전문가 포털 글귀 링크 · 비밀번호 보기 · 빈 화면 다음 할 일 링크(21 ~ 33).
  - `carnet.css`: 색 고르기 칸 40 → 44(상표 설정 강조색).
- 제품 고침(같은 날 오너 승인으로 운영에 올림 · 아래 «운영 올림 · 다시 재기»).
  - Q-Atelier cb6df40e: 달력 ◀ · ▶ · 오늘, 현장 화면 마무리 링크, 서식 고르기 칸 이름표, 과제 설정 제목 칸 · 단계 링크, 계약 · 문서 링크, 사용량 «자세히», RA 현황 띠 링크, 표 안 메일 링크. 계약 시험에 정본 CSS 시험 둘과 개수 셋.
  - Q-Works 35572cab: 화면 맨 위 «뒤로 가기» 21곳(16 → 30. 위가 메뉴 띠라 보이지 않게는 30 이 끝), 법적 고지 머리 · 로그인 바닥 약관 링크, 공장 «연결 KPI»(한 줄 자르기를 안쪽 글로 옮김), 조직도 · 위험 · 휴일 · 펼침 머리 · 관련 문서 링크들.
  - DHR 2b0d83e: 작업 화면 머리 로고 링크, 앞 일차 펼침, 제품표준서 열기.
  - 앱 오프라인 사본 넷: Q-Atelier-App 0137b2e · Q-Atelier-iOS a566832 · Q-Maison-App 9d05856 · Q-Carnet-App 2144699.
  - A/B(운영 + 덧입힘): Q-Carnet 넷 고침 · 새 문제 0, Q-Maison · Q-Atelier 고친 곳 모두 44.
- 「바꿈」 13곳(비교판을 오너께 보냄 · 번호마다 지금 화면과 바꾼 모습). 1 Q-Atelier 폰 서랍 묶음 머리 32, 2 Q-Maison 폰 서랍 묶음 머리 35, 3 Q-Maison 뒤로 가기 21곳(공용 글귀 단추 `qd-text-action` 으로 바꾸면 44), 4 Q-Maison 목록 표 줄 37, 5 특채 부적합 고르기 목록 36, 6 문서 나무 접기 단추 18 × 25, 7 안전 구역 표 숫자 칸 26 ~ 31, 8 안전 점검표 «모두 양호» 28 · 고르기 36, 9 월간 안전 기록 칸 32, 10 교육 미이수 줄 링크 셋 16 ~ 20, 11 AI 도우미 추천 질문 35, 12 관련 문서 창 «새 문서 작성» 칩 26, 13 Q-Carnet 감사 기록 거르기 알약 22. 그림 없는 하나: Q-Maison 첨부 줄의 «내려받기» · «삭제» 26(사이 4라 넓히면 삭제가 내려받기를 덮는다).
- 측정기 고침: 위 전수 검수 기록의 «Q-Maison 가림 7묶음». 누름 자리 재기가 굴러가는 조상(본문 main)까지 자리를 적어 두고 되돌린다. 굴린 거리도 창 스크롤이 아니라 요소가 움직인 만큼으로 잰다. 같은 다섯 화면(20 상태)을 다시 재니 가림 0.
- 시도했다가 되돌린 것: Q-Atelier 폰 서랍 묶음 머리에 `qa-touch-44` 를 달면 서랍 줄 간격이 눈에 띄게 바뀌었다. 모양을 바꾸는 일이라 되돌리고 «바꿈» 1번으로 옮겼다.
- 🔴 걸려 넘어진 것: Q-Atelier 를 받아 온 뒤 전체 시험에서 남의 구독 커밋(a8ffd7d8) 시험 하나(`lib/subscription/subscription-audit.test.ts`)가 빨갰다. 라우트 글을 `\n` 이 든 문자열로 찾는데 윈도 작업본은 CRLF 라 못 찾는다. 커밋본(LF)에는 그 글이 있어 운영 빌드는 초록이다. 이 PC 에서만 빨갛다. 또 두 제품 시험을 한꺼번에 돌리면 Q-Works 실명 검사가 5초를 넘겨 떨어진다(혼자 돌리면 1.6초).
- 운영 올림 · 다시 재기(오너 승인).
  - 올림: Q-Works 35572cab · DHR 2b0d83e · Q-Atelier 8724d5e6(대시보드 세션이 원격 구독 커밋 둘을 cb6df40e 위로 합친 커밋. 그 세션도 같은 커밋을 올려 배포는 한 번) · Q-Atelier-App 0137b2e · Q-Atelier-iOS a566832(쌓여 있던 디자인 사본 커밋 열하나와 함께). 세 곳 배포 Ready, 운영 CSS 에 새 규칙이 실린 것을 확인했다.
  - Q-Maison-App · Q-Carnet-App 은 깃허브 저장소가 없어 로컬 커밋만 있다(오너 결정 대기).
  - Q-Atelier 올리기 전 검사가 CRLF 구독 시험에 막혀, `app/api/admin/subscriptions/route.ts` 작업본만 커밋본(LF)으로 맞췄다(차이 0).
  - 다시 재기(운영 · 412 · 375 · 전체 화면, 배포 직전 운영 측정과 대조): Q-Maison 누름 자리 묶음 30 → 16 · 가림 9 → 2(남은 둘은 달력 창 날짜), Q-Carnet 7 → 3, Q-Atelier 8 → 3. 새로 생긴 문제 0.
  - 남은 것: Q-Maison 16 가운데 15 는 «바꿈», 하나는 로그인 바닥 약관 링크(맨 아래 자리라 측정 탓 · 직접 재면 44). Q-Carnet 셋은 «바꿈» 13번 둘과 여러 줄로 접힌 글 속 링크(측정기 빈틈). Q-Atelier 셋은 «바꿈» 1번, 품질 목표 「근거 방침」(바닥 차림 옆 측정 탓), 그리고 현장 화면 머리 「‹ 부적합 목록」 38.
  - 🔴 마지막 것은 내가 놓친 것이다. 측정기가 잡은 것은 머리 돌아가기 링크였는데, 같은 파일의 비슷한 마무리 링크만 넓혔다. Q-Atelier 0145e146 으로 머리 링크 · 단추에도 `qa-touch-hit` 을 달았다(운영에 덧입혀 84 × 44 · 계약 시험 개수 1 → 3). 상위 세션이 main 에 올렸고, 운영 배포 뒤 412 · 375 두 밝기에서 84 × 44(눌리는 자리 45)로 쟀다. Q-Atelier 에 남은 빨강은 «바꿈» 1번 하나다.
  - 측정기를 쓰면 로그인 상태 파일이 측정 폴더에 다시 생긴다. 다 쓰면 지운다.

## 세 제품 화면 전수 검수 · 2026-10-22

- 오너 «/frontend-design 전체 검수», 범위는 «소나 제외하고 나머지 3제품을 깊게». 운영 화면을 읽기만으로 잰다(쓰기 요청은 막음). 폭 1366 · 412 · 375, 다크 · 라이트, 차림표 화면 · 쓰기 · 상세 · 팝업. 세 제품 상태 3,000여 개.
- 측정기는 제품 밖 `D:/Claude/.claude/design-sweep` 에 둔다(정본에 제품 측정 도구를 두지 않는다). 고침안 CSS 를 덧입혀 다시 재고 묶음을 대조하는 A/B(`--inject` · `compare.mjs`)로 정본 고침을 먼저 확인했다.
- 🔴 측정기의 거짓 빨강 둘을 먼저 잡았다. 접힌 `<details>` 속은 자리를 잡아도 그려지지 않아(content-visibility) 글 겹침 29묶음이 전부 거짓이었다(`checkVisibility`). 새로 돈 세션이 이미 쓴 새로 고침 토큰을 다시 내밀지 않게 로그인 상태를 이어 쓴다.
- 정본 고침(1f2e513).
  - 표 칸 · 단추류 `overflow-wrap: break-word`. `anywhere` 가 칸까지 물려 내려와 표가 열을 한 글자 너비로 줄였다(「설 / 비번 / 호」). A/B: Q-Carnet 낱말 쪼개짐 13 → 5, Q-Maison 3묶음 사라짐, Q-Atelier 변화 없음, 셋 다 새 넘침 0.
  - `qa-touch-hit::after` 를 모자란 만큼만 가운데로 넓히는 계산으로(ⓘ 34×42 → 44×44).
  - Q-Carnet 로그인 칸 초점 고리(고른 칸의 금 그림자가 덮었다), 「로그인」 단추의 라틴 자간 · 대문자 걷음.
  - 거둬들인 공용 부품: Q-Atelier 지표 설명 창(화면 아래 카드에서 바닥 밖 최대 315px → 위로 열림), Q-Maison 달력(폰 한 달 · 태블릿 두 달) · 기간 고르기(열면 초점이 안으로).
- 제품 고침(로컬 커밋, 오너 승인 뒤 운영).
  - Q-Atelier 5e4ce3c5 · 8d96b3d4: 상태 알약 · 위젯 · 차림 단추 · 점수 띠 · 구독 창의 한글 자간, 폰 서랍과 폰 구독 창 초점.
  - Q-Works 12939105 · 6260aec4 · 9f8a27da: 「관련 문서」 차림이 375 에서 화면 밖 · Esc, 문서 나무 제목 「문..」, 인쇄 표지 한글 회사명 자간.
  - DHR 706c3b1 · c6adace: 설비 카드 머리 · 첫 설정 걸음 줄 · 공정 이름 줄바꿈, 상표 미리 보기 대비 1.9, PIN 칸 자간.
  - 앱 오프라인 사본 넷(Q-Atelier-App · Q-Atelier-iOS · Q-Maison-App · Q-Carnet-App)도 정본을 따라잡았다.
- 넘긴 것: Q-Atelier 로그인 화면 자간 6건은 로그인 첫 화면을 다시 짜는 세션이 맡았다.
- 결함이 아니었던 것: Q-Maison `/safety/monthly/print` 「페이지를 찾을 수 없」 는 달 없이 주소만 연 측정기 탓(화면은 늘 달을 붙여 연다). Q-Maison 날짜 한 칸 고르기 창이 초점을 입력칸에 두는 것은 의도(커서를 뺏지 않는다).
- 🔴 걸려 넘어진 것: npm 저장소(DHR)에서 `pnpm typecheck` 를 부르면 pnpm 이 설치를 시도해 `pnpm-lock.yaml` · `pnpm-workspace.yaml` 을 만들고 node_modules 를 pnpm 배치로 바꾼다. 지우고 `npm ci` 로 되돌렸다. DHR 검사는 `./node_modules/.bin/tsc` 와 `package.json` 의 test 줄을 직접 부른다.
- Q-Sonar 사본은 `--sync` 가 매번 써 넣지만 PENDING 이라 두 번 다 되돌렸다.
- 운영 올림 · 다시 재기(같은 날 오너 승인). 세 제품 main 에 올려 배포 완료를 본 뒤 운영을 처음과 같은 조건으로 다시 쟀다. 처음 측정에서 사라진 묶음 Q-Carnet 20 · Q-Atelier 101 · Q-Maison 15.
  - 새로 생긴 `touchCovered` 는 누름 자리 세션이 측정기에 더한 알림(«요소는 작아도 실제 누름 자리는 44 이상»)이라 결함이 아니다.
  - 🔴 Q-Maison 가림 7묶음은 측정기 탓이다. 누름 자리 재기(`probeHit`)가 화면 밖 요소를 가운데로 굴린 뒤 창 스크롤만 되돌린다. 본문 안에서 스크롤하는 Q-Maison 은 본문이 굴린 자리에 남은 채로 가림을 재서, 붙박이 띠(`qm-main-band` · 고정 거르기 줄 · 고정 첫 칸)가 덮은 것으로 셌다. 배포 전에 새 측정기로 잰 판(`maison-touch1`)에도 같은 7묶음이 있다. 누름 자리 세션에 넘겼다(같은 날 고침 · 위 기록).
- 대시보드 숫자 띠의 칸 번호(Q-Atelier 0fda0042). 번호는 지표를 누르면 내려가는 아래 구역의 번호다. 오너가 «빼지 말고 설명을 달자» 고 해서 그대로 두고, 대시보드 사용법에 «아래 구역 번호 · 위젯 편집으로 순서를 바꾸면 따라 바뀜 · 구역을 숨기면 번호가 빠지고 그 업무 전체 화면으로 감» 을 더했다. 위젯 순서 바꾸기 · 숨기기를 운영에서 해 보고 번호가 따라 바뀌는 것을 확인했다. 10-22 오빠 승인으로 운영 반영(f9f58bde 와 함께).

## 고치고 키우는 흐름 · 정본을 건너뛰는 길 막기 · 2026-10-22

- 오너 «Q-Design : UI/UX 개발 · 고도화 절차». 고른 길은 «적고 바로 돌리기», 설계는 «이대로 시작».
- 빨강 정리(23f2f40). 검사 3걸음이 빨갰다.
  - Q-Atelier 가 공용 부품 `lib/design/components.tsx` 를 제품에서 먼저 고친 커밋 셋(39464853 `SR_ONLY` · 6f3eb290 `SectionTitleInfo noMargin` · 17533035 `EntityRow` aria-expanded)을 정본으로 받았다. 내보내는 이름 190 → 192.
  - 문구 하나가 `app/(app)/layout.tsx` 에서 `components/ModuleLockedNotice.tsx` 로 옮겨 가(95993a58) 위치 재연결이 멈췄다. 결속 기록의 경로를 고쳤다.
  - 같은 문구의 규칙(`patterns/professional-atelier-copy.json`)도 경로가 적혀 있는데 그때 빠뜨렸다. 제품 감사 «화면 문구» 가 빨개져서 알았고 같은 날 고쳤다. 늘 초록인 검사는 정본 파일만 보므로 이것을 못 잡는다.
- 🔴 막은 길. 그 상태로 `--sync` 했다면 운영에 나간 세 고침이 옛 정본으로 소리 없이 덮였다.
  - 판 파일이 공용 부품 파일의 확인값을 든다(`implementations`, 아뜰리에 5 · 메종 24 · 카르넷 5).
  - 제품 판 시험이 파일마다 대조한다(Q-Atelier c6107646 · Q-Works 1a069acd · DHR c92703b). 카르넷 `components/dialog.tsx` 를 일부러 고쳐 빨강을 본 뒤 되돌렸다.
  - 내보내기는 정본과도, 판 파일 값과도 다른 제품 파일을 만나면 덮지 않고 멈춘다(5306ffe). 급할 때의 길은 `build-component-implementations.mjs --adopt`. 제품 커밋본만 받고, 작업본이 커밋본과 다르거나 정본도 바뀌었으면 거절한다(시험 둘).
  - `extract-all` 에서 부품 쓰기를 판 파일 쓰기 바로 앞으로 옮겼다. `status.mjs` 에 «부품 N/N».
- 10장 «고치고 키우는 흐름», 작업 기록 맨 위 «남은 일»(340bf40).
- 첫 바퀴의 고침.
  - 🔴 제품 한글 자간 8곳은 전부 감사 도구의 거짓 빨강이었다. 도구가 클래스 요소의 여는 태그부터 400자를 훑어, 요소가 닫힌 뒤의 형제(쪽 넘김 「다음」, Q-Sonar 이름표 옆 제목 · 설명)까지 «안» 으로 셌다. 정본은 그 요소 자신에 자간을 걸고(`.qd-pager-page[data-hangul]`), 자간은 자식에게만 내려간다.
    `check-hangul-source.mjs` 가 JSX 를 파싱해 요소가 닫히는 곳까지만 보게 고치고 시험 다섯을 더했다. 형제 시험은 옛 도구로 먼저 빨강을 봤다.
  - 고친 도구가 예전 창 밖이던 한 곳을 새로 잡았다. Q-Carnet 잠금 단추의 차림표 밖 갈래 `<span>잠금 {value}</span>`. 그 갈래에는 클래스가 붙지 않아 화면은 같지만, 도구가 조건을 못 따라가므로 `data-hangul` 표시만 붙였다(DHR 97a9090 · 카르넷 시험 통과).
  - 눈먼 도구가 아닌지: 제품의 `data-hangul` 표시를 메모리에서 걷고 돌리면 Q-Sonar 16 · Q-Carnet 282 · Q-Maison 548곳을 잡는다.
  - Q-Sonar 색 `#aaa395` 는 고침이 아니었다. 맞추면 글자색이 바뀌거나 정본에 단계가 늘어난다. 흐름 규칙대로 멈추고 «남은 일» 의 다음 바퀴로 옮겼다.
- 올림: Q-Design 은 커밋과 함께 올린다. 제품 셋(Q-Atelier · Q-Works · DHR)은 로컬 커밋만 두고 오너 승인을 기다린다(main 이 곧 운영).

## 카르넷 전역 초점 규칙에서 숫자 띠 칸을 비켜 세움 · 2026-10-21

- Q-Carnet `check-nav` 가 한 건으로 빨갰다. 카르넷 기반의 전역 초점 규칙 `:focus-visible:where(:not(…))` 예외 목록에 `.qd-work-metric-link` 가 없었다. 정본 뼈대가 그 이름에 초점 고리를 걸기 시작한 뒤(Q-Carnet 384b708 로 받음)부터다.
- `patterns/foundation/carnet.css` 예외 목록에 더했다. 이 꼴의 전역 규칙은 카르넷 기반에만 있다(아뜰리에 · 메종 기반에는 없다).
- 🔑 2afe166 의 `!important` 는 그대로 둔다. 세 제품 로그인 화면에 시험 칸을 붙이고 Tab 으로 초점을 준 뒤, 그 규칙에서 `!important` 만 떼고 글자 둘레 계산값을 쟀다.
  - Q-Carnet: 예외를 넣은 뒤에는 떼어도 윤곽 없음 · 그림자 없음. 예외가 없던 때로 흉내 내면 3px 고리가 한 겹 더 생긴다.
  - Q-Maison: 떼어도 윤곽 없음 · 그림자 없음.
  - Q-Atelier: 떼면 금 외곽선 2px 와 4px 고리가 글자 둘레에 다시 생긴다. 기반의 전역 `a:focus-visible`(겹 밖) 때문이다. 이 칸을 실제로 그리는 곳이 Q-Atelier 대표 홈이라 남긴다.
  - 칸 둘레(::after) 윤곽은 세 제품 모두 금 2px · 4px 띄움 하나.
- 내보내다 걸린 것 둘.
  - 문구 위치 재연결이 Q-Carnet `components/idle-lock.tsx` 에서 멈췄다. 같은 날 c7106ff 가 주석 아홉 줄을 더해 줄이 밀렸고, `'전체 삭제'` 가 두 번 나와 도구가 «모호» 로 거절했다. 그 두 자리는 순서대로 224 · 227 로 손으로 옮기고 나머지는 `--write` 로 옮겼다. 같은 실행이 Q-Atelier 두 자리(layout · Sidebar)도 옮겼지만 다른 세션의 아직 커밋 안 된 변경 때문이라 커밋본 줄 번호(429 · 606)로 두었다.
  - 🔴 `extract-all --sync` 를 제품 이름 없이 돌리면 Q-Sonar 의 차례 기다림 조각(차림표 · 목록 · 뼈대)까지 쓴다. `sync --write` 는 PENDING 을 보지 않기 때문이다. 이 실행이 쓴 네 파일을 되돌리고 `--only=Q-Atelier,Q-Works,Q-Forge` 로 다시 돌렸다.

## 숫자 띠 칸에 막대 · 범례 · 누르면 그 구역으로 · 2026-10-21

- 오너 지적 «이 부분은 좀 더 보기 좋게, 직관성 있게». 대표 홈 맨 위 숫자 띠 네 칸이 큰 숫자와 흐린 한 줄뿐이라 좋은지 나쁜지, 무엇부터인지가 안 읽혔다. 시안 셋(A 막대와 범례 · B 알약 · C 한 문장)을 실제 화면에 입혀 찍어 보여 드렸고 오너가 A 를 골랐다(«칸 누르면 아래 구역으로 가는 것까지»).
- `patterns/workspace.css` 에 더한 것. 모두 `.qd-work-metric` 안의 새 이름이라 메종 · 카르넷 화면은 그대로다(사본만 받음).
  - `.qd-work-meter` · `-track` · `-mark`: 큰 숫자 아래 6px 막대. 조각 색은 화면이 아래 구역과 같은 색표에서 넣고, 기준선 눈금(2 × 12)을 얹을 수 있다.
  - `.qd-work-legend` · `-legend-dot`: 막대와 같은 색 점의 범례 한 줄(13, 폰 12). 수는 굵게 본문색.
  - `.qd-work-metric[data-go]` · `-head` · `-no` · `-link` · `-go`: 칸 이름 링크를 칸 전체로 늘린다(늘린 링크). 이름 앞 번호는 구역 머리 번호와 같은 강조색 고정폭 12px(처음 11 로 넣었다가 Q-Atelier «화면 글자 12 이상» 계약에 잡혔다). 오른쪽 «보기 →» 는 폰에서 걷는다. 마우스를 올리거나 키보드 초점이 오면 이름과 «보기 →» 가 본문색으로, 초점이면 칸 둘레에 강조색 윤곽.
- 🔑 정본 규칙은 겹(layer) 안에 있어 같은 겹 안에서는 보통의 구체성 싸움을 한다. 기존 `.qd-work-metric dd`(큰 숫자 30 · 굵게)와 `dd span`(단위 13 · 흐림)이 새 dd · span 에도 걸리므로 새 규칙은 `.qd-workspace .qd-work-metric .이름` 으로 한 단 더 높였다.
- 3칸 띠(폰에서 한 줄 세 칸)는 종전 부제처럼 범례도 폰에서 걷는다.
- 🔑 Q-Atelier 로컬 실측에서 키보드 초점 윤곽이 두 겹(칸 둘레 + 글자 둘레)이었다. 제품의 전역 초점 규칙은 겹 밖이라 겹 안의 `outline: none` 이 졌다. 글자 둘레 윤곽 · 그림자를 끄는 한 줄에만 `!important` 를 붙였다(겹 안 !important 는 겹 밖 !important 보다도 이긴다).

## 대시보드 괘선 구역에 «오늘 먼저 할 일» · 큰 요약 줄 · 여섯 단계 줄 · 2026-10-20

- 오너 지적 «대표 홈화면이 내용이 많이 축소 되었다». 대시보드 A(숫자 띠 + 괘선 구역)로 바꾸며 종전 카드에 있던 내용이 걷혔다. 운영 Demo co. 자료로 종전 코드(b610ca8f)와 나란히 재 보니 빠진 것은 셋이었다: 심사 준비도의 «오늘 먼저 할 일»(가장 급한 일 + 채운 주 단추)이 작은 글귀 줄로 묻힘, 제품 변경 현황의 «제품 1 · 진행 중 변경 0 · 모든 단계 정상» 과 단계 분포가 «아직 등록된 변경 없음» 한 줄로 줄어듦, R&D 프로젝트의 여섯 단계 흐름(기획 → 허가)과 진행률이 사라짐. 화면 길이는 PC 1366 에서 약 2,030 → 1,540px.
- `patterns/workspace.css` 에 세 모양을 더했다. 모두 `.qd-workspace` 안의 새 이름이라 메종 · 카르넷 화면은 그대로다(사본만 받음).
  - `.qd-work-lead`: 구역 머리 바로 아래 한 줄. 구분 글자 · 큰 제목(17) · 근거 · 주 단추. 640 이하는 위아래로 접고 단추를 가득 채운다.
  - `.qd-work-headline` · `.qd-work-headline-sub`: 구역의 «규모» 한 줄(22~28)과 «예외» 한 줄. 값은 본문색 굵게, 이름은 흐리게.
  - `.qd-work-steps`: 여섯 단계 흐름 한 줄. 지난 단계 · 지금 단계(굵게) · 남은 단계(흐리게)를 가는 선으로 잇는다. 금색은 쓰지 않는다(구역 번호만 금색).
- 괘선 결(상자 없음 · 주 동작만 단추)은 그대로 두고 «내용» 만 되살린 것이다. 줄 목록은 여전히 한 건 한 줄.

## 손수 짠 고르기 52곳을 Sel 로 · 2026-10-20

- 오너 «네모칸 사이즈 통일 · 네모 높이 맞춰 줘야 통일성». Q-Atelier 의 손으로 짠 `<select>` 가 자리마다 높이 · 테두리를 따로 그려, 같은 줄의 단추 · 글 칸과 키가 갈렸다.
- `component-implementations/atelier/lib/design/components.tsx` 의 `Sel` 에 더한 것: `sm`(키 36, 목록 줄 · 도구줄에서 Btn sm 과 한 줄), `accent`(테두리 색으로 상태 · 바뀐 칸 · 걸린 거르개), 갈래별 `disabled`, 묶음 `{ g, opts }`(optgroup), `ariaLabel` · `title`. 폭은 감싸는 요소가 정한다. 설명은 `docs/06-components.md` 의 Sel 절.
- 제품 쪽: 48곳을 Sel 로 바꾸고 같은 폼의 날것 글 칸도 In · Txt 로 맞췄다. 옆 단추가 Btn sm 이던 줄은 보통 Btn(44)으로. 남긴 4곳은 이유 주석(현장 모드 52 칸 2곳 · 전문가 포털 기초 규칙 2곳). 사용자 승인 · 반려 단추와 의견 «보낼 대상» 줄(SegmentedChoice)도 공용 부품으로.
- 계약 `shared-controls-contract` 가 `<select>` 를 아예 세지 않아 52곳이 기준선 밖에서 살아 있었다. 이제 고르기도 입력칸으로 센다(일부러 하나 넣어 빨강을 본 뒤 지웠다).
- 로컬 스택에서 1280 · 768 · 375 로 잼: 한 줄의 고르기 · 글 칸 · 단추 키가 모두 같고(PC 44 또는 도구줄 36), 가로 넘침 0.
- 🔑 `Sel sm` 은 터치 화면 · 640 이하 창에서 `qa-input` 규칙으로 44 가 된다. `qa-touch-44` 와 같은 규칙이라 정렬 고르기에서 그 이름표를 걷어도 터치 키는 그대로다(시험 둘은 이름표 글자를 세던 것이라 고쳤다).

## 아뜰리에 전 화면 반응형 훑기 뒤 정본 고침 · 2026-10-20

- 오너 지적 «모든 컴포넌트를 반응형으로 · 이런 네모칸도 사이즈 통일 · 네모 높이 맞춰 줘야 통일성 · 디자인 얘기는 모두 큐 디자인에». Q-Atelier 로컬 스택에서 대표 144곳 · 운영진 27곳을 1920 · 1280 · 768 · 375 로 잰 뒤, 배치 규칙은 모두 정본에 두고 `--sync --only=Q-Atelier` 로만 내보냈다.
- `patterns/foundation/atelier.css`
  - `.qa-ld-in`: 상세 한 장 680 · 왼쪽 붙음 → 상세 칸을 채우다 1040 에서 멈춰 가운데. 용어집만 풀던 `:has(.qa-ld-split)` 예외는 걷었다.
  - `.qd-seg-wrap`: `SegmentedChoice` 의 wrap 배치를 같은 폭 · 같은 높이 칸(가장 긴 칸 기준)으로. 480 미만은 `--qd-seg-min`(minCol) 격자로 접힌다.
  - `.qd-stage-host` · `.qd-stage-timeline`: `StageTimeline` 이 담긴 자리가 460 미만이면 연결선을 걷고 두 칸 격자(컨테이너 질의). 폰에서 가로로 밀던 흐름도의 뿌리.
  - `.qa-users-grid`: 운영진 사용자 표(6칸)가 600~1023 에서 고정 폭 넷에 눌려 36px 넘치던 것을 비율 칸 + 칸별 최소 폭으로.
- `component-implementations/atelier/lib/design/segmented-choice.tsx` · `components.tsx`: 위 클래스를 붙이는 자리만 바꿨다(값은 CSS 한 곳).
- `docs/06-components.md` 의 SegmentedChoice · ListDetail 설명을 새 동작에 맞췄다.
- 🔑 정본 CSS 의 값 파일(`atelier-core-values.css`)은 `atelier.css` 규칙보다 뒤에 붙는다. `:root` 변수를 미디어 질의로 덮으려 하면 뒤의 정의가 이긴다. 폭마다 다른 격자는 변수를 덮지 말고 클래스 규칙(`!important`, 인라인 격자를 이겨야 함)으로 둔다.

## 단계 줄 폰 두 칸 · 2026-10-20 (운영 직접 점검 뒤)

- 오너 지적 «직접 다 보고 수정해 줘야지» 로 운영 Q-Atelier 를 Demo co. 계정으로 PC 1366 · 폰 412 · 375 에서 열어 봤다. `qd-work-stages` 가 폰에서 두 줄로 흐르며 줄 끝마다 세로 괘선이 남았다. `patterns/workspace.css` 의 640 이하 규칙에 두 칸 격자 · 괘선 없음을 더했다. 이 이름은 Q-Atelier 대시보드만 쓴다(메종 · 카르넷은 안 씀).

## 5단계 «화면에 힘 쓰기» 반영 · 2026-10-20

- 오너가 고른 시안(멤버 A · 설정 B · 대시보드 A)을 Q-Atelier 에 반영하며 공용 규칙을 정본에 먼저 두었다(357fa57). `patterns/workspace.css` 에 숫자 띠 칸 수(`data-cols`), 번호 괘선 구역(`qd-work-sections` · CSS counter), 줄 목록(`qd-work-line`), 단계 줄(`qd-work-stages`), 묶음 머리(`qd-work-subhead--group`). 모두 `.qd-workspace` 안의 새 이름이라 그 이름을 안 쓰는 메종 · 카르넷 화면은 그대로다(두 제품은 `.qd-workspace` · `--overview` 만 쓴다, 대조함).
- `patterns/foundation/atelier.css` 에 변경 줄 접기(`.qa-rev-row` 컨테이너 질의, 600 이하 3줄). 412 폭 가로 넘침의 뿌리였다.
- 기본안 A 대로 제품으로 나가는 CSS 주석의 옛 문서 번호를 새 장으로 고쳤다(7fd7eb8). 정본 소스 9곳 → 산출물 12줄. docs/24 → 08-paper.md «문서 결», docs/11 · 15 · 16 · 17 · 25 → 07-screens.md 의 해당 절, 보관된 docs/22 는 뺐다. 산출물에 옛 번호 0.
- 🔑 정본을 커밋하기 전에 `--sync` 하면 제품 판 파일의 `since` · `date` 가 비고 status 가 «커밋 안 됨» 이라 한다. 정본 커밋 뒤 한 번 더 맞추고, 제품 커밋 뒤 `refresh-source --write` 로 `_ORIGIN.json` 을 마지막 커밋에 맞춘다.
- 사본 따라잡기: Q-Works · DHR 사본, 폰 앱 오프라인 화면(Q-Atelier-App d6d2ad0 · Q-Carnet-App c4f0fce).
- 검사 35걸음 · 시험 191 초록. 세 제품 사본 대조 시험 통과(아뜰리에 81 · 메종 154 · 카르넷 82).
- 남은 것: 제품 개발자가 손으로 쓴 주석의 옛 번호 36곳(Q-Atelier 8 · Q-Works 14 · DHR 14). Q-Sonar 3조각이 10-10 판에 머묾. 제품 main 은 오너 승인으로 같은 날 올렸다(Q-Atelier 86df3bb7 · Q-Works 6bae1bfe · DHR a073c47, 버셀 배포 셋 모두 완료). Q-Atelier 는 올리기 전 훅이 시험 둘의 30초 시간 초과로 두 번 막혀 한도만 120초로 늘렸다.

## 라이브러리 빌림 끊기 · 2026-10-20

- 군살 빼기의 남은 결합 하나를 끊었다. Q-Design 에 자기 `package.json`(비공개)과 잠금 파일을 두고 개발 의존성 13개를 정확한 판으로 넣었다. 처음 받으면 `npm ci`.
  판은 Q-Works 가 지금 쓰는 판에 맞췄다(typescript 5.9.3 · postcss 8.5.28 · vite 8.3.2 · postcss-import 17.0.0 · react 19.2.6 · jsdom 25.0.1 · tailwindcss 3.4.19 · prettier 3.8.3 · 플러그인 0.6.14 · supabase-js 2.112.4).
  앱 아이콘 렌더러는 고정 판 그대로다(playwright 1.62.1 · sharp 0.34.5, 설치 뒤 libvips 8.17.3 · png 1.6.50 · webp 1.6.0 · zlib-ng 2.2.5 까지 고정값과 같음).
- 빌리던 곳: 도구 30개 파일 35곳(Q-Atelier 26 · Q-Works 9). 모두 `createRequire(import.meta.url)` 또는 맨 이름 `require('playwright')` 로 바꿨다. 앱 아이콘 · 반응형 확인은 `loadIconRuntime(Q-Design)`.
  일부러 둔 두 곳: 작업대가 제품 부품을 그 제품의 react · tailwind 로 그리는 별칭, 문구 도구가 제품 코드를 그 제품의 prettier 로 맞추는 기본값.
- 시험 둘을 손봤다. «prettier 없는 제품» 은 Q-Atelier 대신 Q-Design 밖 임시 폴더로 흉내 낸다(Q-Design 안에서는 자기 prettier 가 찾아지므로). 계단 시험의 읽기 감시는 이제 제품 `node_modules` 도 «제품 읽기» 로 센다.
- 대조: 파일 읽기 · 모듈 찾기를 모두 적는 추적기를 자식 프로세스까지 걸고 검사와 감사를 돌렸다. 제품 `node_modules` 를 연 일 0번(옛 빌림 모양, 곧 제품 `package.json` 에서 모듈 찾기를 같은 추적기가 자식 프로세스에서도 잡는 것을 먼저 확인).
  재현 26걸음이 전부 저장본과 바이트로 같다(postcss 가 아뜰리에 쪽 8.4.31 에서 8.5.28 로 바뀌었어도). 제품 감사는 걸음별 결과 · 내용이 전과 같다(줄 번호 하나 밀린 것만).
  작업대 빌드(Q-Design 자기 vite)도 세 제품 모두 돈다.
  `verify-responsive`(Q-Design 자기 playwright)도 42조합 · 패널 56건 통과로 전과 같다. `npm ci` 로 잠금 파일만 보고 다시 깔아도 같다.
  로그인이 필요한 손 도구 다섯(audit-family · check-focus · diff-rails · shoot-preview · shoot-rails)은 문법과 모듈 찾기만 봤고 실제로 돌려 보지 않았다.
  이 다섯은 playwright 가 1.60.0(Q-Atelier 맨 위) 에서 1.62.1 로 바뀐다.
- 🔴 같은 시각 검사의 빨강은 이 일과 별개다. 원본 2곳(Q-Atelier 가 새로 커밋한 data-source-contract 시험 · audit 화면을 아직 안 받음)은 바꾸기 전부터 빨강이었고,
  기본 UI 구현 1걸음 · 시험 1건은 12:41 에 다른 작업이 Q-Atelier 의 `lib/design/components.tsx` 를 커밋 없이 고치는 중이라 났다. Q-Atelier 커밋본은 정본과 바이트로 같다.
- 원본 2곳은 같은 날 `refresh-source --write` 로 받았다(Q-Atelier 9641a195 → b610ca8f). ⓘ «데이터 출처» 묶음에서 감사 화면의 KPI 두 칸 · 구역 제목에 `source` 글이 붙고, 데이터 출처 계약 시험이 줄었다.
  받은 뒤에도 재현 26걸음이 그대로다(뼈대가 읽는 감사 화면 KPI 격자 값은 안 바뀜).
- 오너 지시 «작업본 그대로 정본에». 5단계 «장부 표» 로 Q-Atelier 작업본(커밋 전, 12:41)의 `lib/design/components.tsx` 에 들어간 DataTable `expandedRow`(줄 아래 펼친 칸)를
  정본 `patterns/component-implementations/atelier/lib/design/components.tsx` 로 바이트 그대로 옮기고 부품 목록(`dist/q-design.component-implementations.json`)의 정본 지문을 새로 적었다.
  내보내는 이름 190 은 그대로다. 검사 걸음 35 · 시험 191 모두 초록. 제품 감사는 걸음별 결과가 같고, Q-Atelier 아이콘 쓰는 곳 191 → 190 은 같은 작업이 고치는 구성원 화면 작업본 때문이다.
  🔴 Q-Atelier 쪽 커밋 · 6장 DataTable 설명은 그 작업이 할 일이다. 그 작업본이 더 바뀌면 이 걸음이 다시 빨강이 된다.

## 운영 업무 화면 모바일 직접 검수 · 2026-10-17

- 마무리: 사용자가 현재 조직에서 가능한 범위로 종료하도록 지정했다. 데이터가 없는 상세·수정, 별도 관리자·전문가 권한, 구독 제한 화면은 미검수로 남긴다. 최종 운영 배포는 아뜰리에 `fd4c3867`, 메종 `761f9313`, 카르넷 `192e229` 모두 READY이며 각 운영 도메인 연결을 확인했다. 세 운영 사이트가 제공하는 공통 변수 10개·선택자 7개도 전부 대조 통과했다.
- 최종 실측에서 메종 등록 버튼은 66px·한 줄, 카르넷 권한 표는 화면 427px에서 페이지 넘침 0이고 내부 가로 이동 351px로 끝 열까지 접근한다. 접근성 숨김 문구 160개는 유지한다. 공통 35단계·191시험, 실제 부품 42조합·패널 56건, 아뜰리에 4,710시험, 메종 3,923시험, 카르넷 단위 82시험·업무 검증 299시험을 통과했다. 아뜰리에 린트는 오류 0이며 기존 경고 1,570개가 남는다.
- 별도 전체 제품 감사에는 한글 자간 8건, 범위 밖 Q-Sonar 색 누락, 카르넷 말투 기준 초과 등 세 분류가 남는다. 정식 기록 문장과 분석기 오탐 후보를 일괄 변경하지 않았으며 이 감사를 전체 통과로 보고하지 않는다. 중앙 규칙 수정은 생성·동기화·제품 배포를 거쳐 반영되며 저장 즉시 운영에 자동 반영되는 구조는 아니다.
- 사용자가 운영 사이트 검수를 요청하고 카르넷에 로그인했다. 실제 화면 너비를 재어 427~437px에서 같은 탭으로 세 제품의 운영 화면을 확인했다. 브라우저 크기 설정만으로는 너비가 바뀌지 않아 그 결과를 모바일 통과로 세지 않았다.
- 아뜰리에 주요 메뉴 35곳, 메종 주요 메뉴 63곳, 카르넷 주요·설정 메뉴 31곳의 첫 화면을 점검했다. 메종의 첫 수집에 로딩 화면이 섞여 제목과 로딩 종료를 기다리는 절차로 재검수 중이다. 이는 모든 작성·상세·팝업과 화면 아래쪽까지의 전수 검수 완료가 아니다.
- 실제 아뜰리에 모바일 상단에서 44px 버튼 두 개를 40px 간격으로 배치해 4px 겹침을 발견했다. 큐 디자인에 상단 오른쪽 여백·아이콘 사이 간격·계산된 앞 아이콘 위치를 정의하고 구독·알림 표시를 연결했다. 터치 판별이나 작은 화면 분기가 버튼 크기와 다른 오프셋을 쓰지 않게 한다.
- 설계 추적성의 DHF 목차에서 인코딩된 첨부파일 이름을 그대로 표시하는 문제를 발견했다. 기존 검증된 파일 이름 표시 함수로 사람이 읽을 수 있게 표시하고, 긴 이름 줄바꿈은 공통 `.qd-file-name` 규칙으로 연결했다. 원본 파일 이름이나 업무 기록은 변경하지 않는다.
- 공통 생성·동기화 후 35단계·191시험과 아뜰리에 파일 이름·판 파일 31시험 통과. 배포 후 실제 모바일 버튼 사이 간격과 첨부파일을 다시 확인한다.
- 메종 주요 메뉴 63곳은 로딩 종료와 제목을 기다려 본문으로 재확인했다. 이어 메종 작성 양식 42개(분류별 같은 양식 포함)·상세 및 보조 화면 유형 32개, 아뜰리에 작성 양식 16개·상세 및 보조 화면 21개를 실제 운영 모바일 437px에서 열었다. 저장·제출·승인·파일 업로드는 실행하지 않았다. 첫 화면 실측과 전체 시각 검수는 구분한다.
- 메종 검사 작성의 항목명 입력이 44px로 압축되어 실제 문구를 읽을 수 없는 문제를 추가 발견했다. `.qd-table--editable` 최소 너비를 중앙에서 관리하고 내부 가로 스크롤·영역 이름·키보드 초점을 연결했다. 세 제품 실제 입력을 사용하는 편집 표 회귀 사례를 추가해 42개 화면 조합과 패널 56건을 통과했다. 검사 업무 회귀 및 판 파일 시험 48건도 통과했다.
- 아뜰리에 정상 푸시 훅에서 pnpm 실행기를 찾지 못해 첫 푸시가 중단됐다. 기존 실행기로 연결하는 임시 경로만 보완했으며 훅은 생략하지 않았다. 전체 시험 4,710건·형식 검사·린트(오류 0, 기존 경고 1,570)를 통과하고 `5ad3c97a`를 푸시했다. 메종 `81446cec`와 카르넷 `b9c1712`의 첫 공통 변경 배포는 READY다. 추가 편집 표 변경은 별도 검증 후 반영한다.
- 운영 실측: 아뜰리에 상단 두 버튼은 각각 44px, 사이 8px로 겹침이 없어졌다. DHF 첨부파일 두 개는 인코딩 없이 한글로 표시되고 331px 부모 안에서 줄바꿈한다. 메종 검사 작성은 표 640px·감싸개 351px, 항목명 입력 190px로 기존 44px 압축을 해소했으며 페이지 가로 넘침은 0이다.
- 같은 양식 하단에서 필수 입력 안내가 등록 버튼을 압축해 두 글자가 세로로 갈라지는 문제도 발견했다. 메종 `MissingHint`를 정본 소유 목록에 추가(총 34파일·187내보내기)하고 `.qd-action-hint`로 부모 행 줄바꿈과 단추 축소 방지를 중앙에서 관리한다. 이 부품을 사용하는 양식 48곳에 같은 규칙이 적용된다. 필수 조건·동작·문구는 유지했다. 실제 안내 부품과 실제 버튼의 줄 수 회귀 검사, 공통 191시험·42화면 조합·패널 56건, 메종 전체 3,923시험이 통과했다.
- 코드의 페이지 파일과 실제 방문 경로도 대조 중이다. 관리자·전문가 별도 인증, 현재 구독으로 열리지 않는 시장, 제공 중지된 생산 화면, 데이터가 없는 상세 양식, 인쇄 전용 지면을 일반 업무 화면과 구분해야 한다. 코드 파일 수를 실제 시각 검수 완료 수로 보고하지 않는다. 운영 계약 목록은 0건이므로 계약 상세·수정 화면은 실제 데이터로 열어 확인하지 못했다.
- 카르넷 권한 표는 표 스크롤 자체가 아니라 셀 안의 화면낭독기용 숨김 문구 때문에 페이지 너비가 704px로 늘어났다(실제 화면 427px). 절대 배치된 숨김 문구의 오른쪽 끝 704.4px가 문서 넘침과 일치했다. 스크롤 감싸개를 상대 배치 기준으로 만들어 접근성 문구도 그 안에 머물게 한다. 접근성 문구를 삭제하거나 화면 전체를 가려 문제를 숨기지 않는다. 동일 구조 회귀 사례는 수정 전 320px에서 페이지 넘침 356px로 실패하고 수정 후 42조합·패널 56건을 통과했다. 공통 35단계·191시험도 통과했다.
- 카르넷은 실제 배치 상세·현장 공정 입력·배치 계보·자재 계보까지 읽기 검수했다. 작업 지시·발주·일탈·품목·공급자·제품·계정 등록 양식도 열고 닫았으며, 시작·저장·발행은 누르지 않았다. 멸균 배치 작성은 대상 로트가 없어 비활성 상태이므로 양식 검수 완료로 세지 않았다. 작업 지시서 미리 보기는 발행 전 화면만 확인했으며 인쇄 발행은 하지 않았다.

---

## 세 제품 공통 반응형 크기 계약 · 2026-10-17

- 열 수를 최대치로 바꾸고 실제 부모 너비에 따라 접히게 했다. 공통 `patterns/responsive.ts`를 세 제품에 배포하며, 일반 입력·지표 최소 너비와 간격은 `patterns/foundation.css`에서 바꾼다. 엔진 `tokens.ts`는 수정하지 않았다.
- 아뜰리에 Grid·foldGrid·StatGrid·로딩 지표와 메종 StatRow·로딩 카드, 세 제품의 입력 양식 배치를 연결했다. 메종 KPI 실적 입력 네 칸도 같은 계약에 연결했다. 긴 버튼 문구는 높이가 늘고, 카드의 긴 식별자는 부모 안에서 줄바꿈한다.
- 팝업·서랍은 화면 크기를 상한으로 삼고 본문은 내부 스크롤한다. 메종 팝업의 열림 변형이 중앙 정렬을 덮어쓰던 문제는 독립된 translate로 고쳤다. 표·인쇄·SVG·달력·숫자판의 의미 있는 치수는 별도 계약을 유지한다.
- 실제 제품 부품을 격리해 3제품 × 2테마 × 7화면 크기, 42건 통과. 측면·하단 패널은 아뜰리에·메종 실제 부품으로 56건 추가 통과. 260px·120px 부모, 긴 문구, 선택칸·탭·선택·빈 화면·로딩·진행률, 팝업 하단 동작을 확인했다. 중앙 최소 너비를 바꿔 세 제품의 기존 격자 열 수가 함께 변하는 것도 확인했다. 인증된 모든 업무 화면 검수를 대체하는 결과는 아니다.
- 정합성 35단계와 공통 시험 191건, 세 제품 형식 검사 통과. 아뜰리에 전체 시험 4,710건 통과(기존 예상 실패 1건·건너뜀 3건), 메종 전체 시험 3,923건, 카르넷 전체 시험 단위 82건 및 업무 검증 299건 통과. 세 제품 운영용 로컬 빌드도 통과했다. 메종은 로그인용 개발 서버를 유지하면서 별도 소스 복사본을 운영 환경으로 빌드했다.
- 메종 커밋의 필수 자동 서식이 정본과 따옴표·줄바꿈을 다르게 만드는 문제도 확인했다. 해당 정본과 공통 배치 도우미에 제품의 실제 서식을 적용하고 다시 동기화했다. 커밋 검사를 우회하지 않으며, 사본 대조의 정확도도 유지한다.
- 제품 커밋 후 원본 사본을 갱신해 다시 추출하는 경로까지 확인했다. StatGrid의 이전 숫자 기본값 탐침을 중앙 CSS 최소 너비에 연결하고, 그 값을 바꾸면 추출 결과도 달라지는 회귀 시험을 추가했다. 사용하지 않는 과거 숫자 기본값 두 개는 런타임에서 제거했다. 마지막 배치·판 시험 45건과 브라우저 42건·패널 56건을 다시 통과했다.
- 메종 전체 소스 감사 시험의 반복 파일 읽기를 캐시하고, 실명 검사의 이름이 바뀐 Next 빌드 보관본도 기존 생성물 제외 규칙에 포함했다. 소스 검증과 기존 5초 제한을 유지한 상태로 전체 시험이 통과한다. 아뜰리에 런타임 시험 로더에는 실제 공통 반응형 모듈을 연결했다.
- 기존 줄 이동 때문에 문구 배포가 멈추던 문제를 보완했다. 정본과 정확히 같은 문구가 유일하게 존재할 때만 위치를 옮기며, 변경·누락·중복은 거부한다. 기존 엄격한 문구 대조는 유지한다.
- 메종·카르넷 차림표는 공식 동기화 후 일치하므로 PENDING에서 제거했다. 범위 밖 Q-Sonar 3조각은 그대로 남긴다. 제품 감사의 말투·한글 자간 및 Q-Sonar 색 누락은 별도 잔여 사항이며, 전체 제품 감사 통과로 보고하지 않는다.
- 로컬 메종 로그인 문제는 살아 있는 운영 세션으로 대체해 검수했다. 병행 작업의 미커밋 ExpertNotificationsPanel·tsconfig.build·메종 app-version 변경은 보존했다. 아뜰리에 기존 용어집 커밋을 포함한 현재 main의 시험·빌드를 확인한 뒤 운영 반영했다.
- 큐 디자인과 웹 세 제품의 커밋·푸시를 완료했다. 운영은 아뜰리에 `55dfe3be`, 메종 `e0a0023a`, 카르넷 `1be7aa6`가 READY이며 각 운영 도메인 연결도 확인했다. 공개 CSS의 중앙 크기 설정 6개·배치 선택자 4개가 세 제품 모두 일치한다(`verify-responsive-release.mjs`). 중앙 변경도 생성·동기화·각 제품 배포를 거쳐야 운영에 반영된다.
- 운영 아뜰리에는 로그인 화면에서 중앙 값과 입력 높이 44px·가로 넘침 0을 확인했다. 메종은 계약 작성·품질목표·KPI 목록 및 원래 요청한 KPI 상세를 확인했다. 실적 입력 네 칸은 185.5px씩 균등 배치되고 가로 넘침이 없다. 계약 작성에서 333px 부모 안의 선택지 5개가 세로로 갈라지는 문제를 추가 발견해, 정본 ChoiceBoxes·ChoiceGrid를 공통 반응형 도우미에 연결했다. 전체 메종 시험 3,923건과 선택 묶음 시험 17건을 다시 통과했고, 운영 추가 배포 후 약 105.7px 세 열로 접히며 짧은 선택지 5개가 모두 한 줄임을 실측했다. 선택지 최소 너비를 중앙에서 바꾸면 실제 열 수도 달라지는 브라우저 회귀 검사를 추가했다.
- 운영 직접 확인은 데스크톱이다. 7가지 화면 크기·작은 부모·긴 문구 검사는 격리한 실제 제품 부품으로 했다. 아뜰리에·카르넷의 로그인된 업무 화면과 세 제품 모든 업무 화면의 전수 시각 검수 완료를 뜻하지 않는다. 최종 공통 검사 35단계·191시험과 42개 화면 조합·56개 패널 검사를 통과했다.
- Android 오프라인 자원은 아뜰리에 `a661186`(푸시 완료), 메종 `9b3c475`·카르넷 `bd1885e`(로컬 커밋, 원격은 사용자가 별도 담당자에게 위임)로 보존했다. Android 바이너리를 새로 빌드하거나 배포한 결과는 아니다. iOS 자원 커밋은 기존 제외 지시 때문에 자동 승인 검토에서 거부됐으며 재시도하지 않았다. 자동 생성된 오프라인 자원 1파일은 미커밋 상태다. iOS 빌드·설치·푸시는 하지 않았다.

---

## 군살 빼기 4단계 검사 하나 · 2026-10-16

- 오너 «4단계 5단계 다 진행합시다». 검사를 `node tools/check.mjs` 하나로 모았다(`extract-all --check` 도 이것을 부른다). 옛 `check-components.mjs` 는 이것으로 바뀌었다.
  걸음 35개(원본 1 · 재현 26 · 대비 · 문자 · 자간 · 정본 문구 · 사본 3 · 시험), 시험 188개, 13초. 처음부터 초록이다.
- 규칙: 늘 초록. 빨강이면 그날 고치거나 걸음을 지운다. 언제 내보낼지 정해진 어긋남은 `sync-parts.mjs` 의 `PENDING` 에 적고 「차례 기다림」 으로만 알린다(같아지면 줄을 지우라고 실패).
  지금 5곳: Q-Sonar 차림표 · 목록 · 뼈대(10-10 판 뒤를 못 받음), Q-Carnet · Q-Maison 차림표(날짜 줄 + 아래 자간 풀림 한 줄). 모두 5단계에서 내보낸다.
- 재현이 안 되던 것 둘을 고쳤다. 생성물의 날짜 도장(`generatedAt` · 차림표 머리 날짜)을 뺐고, 일곱 생성기에 `--check`(다시 만들어 저장본과 대조, 쓰지 않음)를 붙였다(`tools/emit.mjs`).
  틀린 생성 사실 하나: `rootFontSize` 가 14 로 박혀 있었다. 이제 `patterns/foundation.css` 의 `--qd-root-size`(16)에서 읽는다.
- 샴페인 계단을 정본 파일로 얼렸다(`patterns/champagne-ramp.json`). 만들기 · 검사는 그것만 읽고, 세 제품과 견주는 일은 감사 모드로 남겼다. 예전에는 만들 때마다 제품 CSS 에서 다시 뽑아 제품이 금색 하나를 바꾸면 산출물이 흔들렸다.
- 제품 코드를 훑는 일과 내 사본이 그대로인지 보는 일이 한 도구에 섞여 있던 넷을 갈랐다. `sync --consumers` · `sync-react-icons --copies` · `app-icons --check --copies` · `copy-spacing --check-canon`.
  훑는 쪽은 `node tools/check.mjs --products`(감사)로 모았다. 감사는 빨강이어도 검사를 막지 않는다. 지금 빨강 셋(제품 한글 자간 8곳 · Q-Sonar 색 #aaa395 · 말투 상한)은 모두 제품을 고쳐야 풀린다.
- 한글 자간 정본 검사(`check-hangul-canon`)를 새로 만들었다. 정본 화면 CSS 에서 자간 · 대문자를 거는 자리마다 `[data-hangul]` 풀림 짝이 있는지 `var()` 까지 풀어 본다(`hangul-tracking.mjs`).
  처음 돌려 실제 빈틈 하나를 잡았다: 차림표 판 번호 줄의 한글 이름이 대문자만 풀고 부모의 자간 0.6px 은 물려받았다. 생성기에서 고쳤고, 그 줄을 빼면 검사가 빨강을 내는 것을 확인했다.
  제품 감사(`check-hangul-source`)도 같은 풀이를 쓴다. 예전에는 `parseFloat('var(…)')` 가 NaN 이라 그 자리를 지나쳤다.
- 제품 경로를 알던 시험 12개를 정본 · 고정 자료(`tools/fixtures/`, 출처는 폴더마다 `SOURCE.md`)로 옮겼다. 제품 코드의 동작만 보던 시험 8개는 뺐다(Q-Design 이 쓰지 않는 Q-Carnet 부품 셋 등).
  업무 조작 대상 시험은 새로 짰다(장부를 읽던 옛 시험은 1단계에서 빠짐). `style-arguments-core` 는 쓰는 두 함수(hash · runtimeFiles)만 남겼다.
  아뜰리에 글꼴 선언은 시뮬레이터가 제품 작업 트리를 읽던 것을 원본 받기(`source/font-faces/atelier-fonts.css`)로 옮겼다. 시뮬레이터 결과물은 바이트까지 같다.
- 받아들이는 기준 확인: 추적기로 검사 전체를 돌려 제품 읽기를 모두 갈랐다. git 94건은 전부 원본 받기, 파일 읽기는 전부 사본 대조 대상(조각 · 부품 32 · 아이콘 329 + 31 · 모노 글꼴 11 · 앱 사본 17 + 아이콘 1)과 사본 폴더 이름 목록이다.
  10-17 추적을 앱 저장소까지 넓히자 사본이 아닌 읽기가 하나 더 나왔다: 앱 오프라인 생성기와 그 시험이 앱이 직접 쓰는 색 파일(`colors.xml` 낮 · 밤, `Palette.swift`)을 읽어 «중앙 색 이름을 부르는가» 를 봤다.
  제품이 계약을 지키는지 보는 일이라 감사로 옮겼다(`build-native-offline --check --contracts`, 내보낼 때는 늘 켬). 시험은 앱 커밋본 고정 자료(`tools/fixtures/native-consumers`)로, 시작 화면 · 알림은 Q-Design 이 내보내는 출력으로 읽는다.
  남은 결합은 라이브러리를 제품 `node_modules` 에서 빌려 쓰는 것 하나다(Node 가 모듈을 찾으며 `Q-Works/package.json` 을 연다). 자기 `package.json` 을 가지면 없어진다.
  🔴 추적기 빈틈 둘을 고친 뒤에 잰 값이다: 경로가 저장소 이름에서 끝나면 못 잡았고(git -C …), `Q-Design/../Q-Atelier` 처럼 돌아가는 경로도 못 잡았다. 처음 잰 «그 밖 6» 은 그래서 적게 나왔다.
- 도구 없이 사람이 지키는 규칙 셋(글꼴 실제 렌더 · 스타일 감사 판정 · 공개 부품 역할 등록)은 10장에 그렇게 적었다. 장부형 검사는 다시 만들지 않는다.
- 다음: 5단계(시안 먼저 · 오너가 고른 뒤 제품마다 반영 · 폰 폭 412 · 375). 내보내면 `PENDING` 다섯 줄이 같아짐으로 실패하므로 그때 지운다.

## 군살 빼기 3단계 정본 10장 · 2026-10-16

- 오너 «계획대로». 옛 문서 27편을 정본 10장(`docs/01`~`10`)으로, 참고 5편을 `docs/reference/` 로 옮겼다(이름에서 번호를 뺌).
  01~06 은 파일 이름을 그대로 두고(도구가 쓰는 `02-color.md` 포함), 07 화면 · 08 종이 · 09 글 · 10 규칙은 새 이름이다.
  옛 21편은 작업 트리에서 뺐다. 꼬리표 `archive/before-slim-2026-10-16` 와 깃 기록에 있다. README 를 새로 쓰고 «옛 문서 번호» 표를 넣었다.
- 다섯 갈래로 나눠 합쳤다. 규칙 · 값 · 계약 · 오너 결정은 남기고 진행 이야기는 뺐다. 뺀 것은 갈래마다 목록으로 받아 확인했다.
  손으로 적힌 값 190건 남짓을 산출물과 맞춰 고쳤다(갈래 보고서의 고친 항목 수 합. 배지 18 · 22 · 26 → 20 · 24 · 28, Btn 글자 12 → 13, Modal 본체 bg → surface, 라벨 10 → 12px, 샴페인 계단 한 칸 등).
  없어진 도구(component-registry · style-arguments · verify-fonts 등)를 쓰라는 안내는 지금 길로 바꾸거나 걷었다.
- 🔴 rem 기준: Q-Atelier 운영 화면을 재니 html 16px · body 14px 였다. 10-11 3163c82 가 공통 기반 `--qd-root-size: 16px` 을 html 에 걸었다.
  옛 «rem = 14px» 를 실제대로 고쳤다(3장 · 10장 · README). 이 변화가 의도였는지는 오너 확인을 기다린다.
- 주 단추는 크림색이라(6장) 2장 · 7장의 «금색이 주동작 면을 맡는다» 를 고쳤다.
- 매듭 5: `extract-mqdoc` 의 문서 경로를 `docs/08-paper.md` 로 바꿨다. `contrast-table` 은 `02-color.md` 그대로다.
  도구 주석 · 안내(check-voice · extract-list · extract-nav · screen-ai-cliches), 견본 HTML 링크, 팔레트 설정 설명도 새 장으로.
- 원본 사본 지도에서 Q-Atelier 판 파일 시험(`q-design-version.test.ts`)을 뺐다. 2단계 뒤 «없던 것» 1건으로 잡히던 것으로, 디자인 계약이 아니다. 대조가 2곳(전부터 있던 것)으로 돌아왔다.
- 일부러 둔 것: 제품으로 나가는 산출물 주석 속 옛 번호(9 파일 13곳 · docs/11 · 22 · 24 · 25 · 15~17). 바꾸면 세 제품 사본이 바뀌어 운영 배포가 따른다.
  README 표로 찾게 했고 오너 결정을 기다린다. `source/` 사본(mqhtml.py · v8 README · component-*.json)의 옛 번호는 원본 쪽 글이라 두었다.
- 대조: 대비표 최신 · v8 차이 0 · 끊긴 링크 65 → 0 · 긴 줄표 0 · 금지 문자 0 · dist 변경 0 · 검사기 초록.
  `extract-all --check` 의 빨강은 기준과 같다(원본 사본 2 · 색 축 1 · Q-Sonar 사본 3). 말투 검사 빨강(Q-Carnet 12 > 상한 11 · Q-Maison 82)은 바꾸기 전 판도 같다.
- 문서와 코드가 어긋난 것(5단계 또는 오너 판단): 안내 · 주의 · 경고 상자(문서 결은 가로선 사이, 코드는 둥근 테두리) · 단계 표시(끝난 단계를 초록으로 채우는 Q-Atelier 화면 둘) ·
  선택 칸 금색 화살표가 공용 규칙에 가려 안 보임 · 표 머리 대문자가 공용 규칙에 덮임 · `qa-soft-pulse` 와 리본 표류의 scale · 전문가 포털 값 통일의 결정 출처.
- 지킬 도구가 없는 규칙(4단계에서 정할 것): 공개 부품 역할 등록 · 스타일 인자 감사 판정 · 글꼴 실제 렌더 검증. `source/component-*.json` 은 읽는 도구가 없다.
- 다음: 4단계(검사 하나).

## 군살 빼기 2단계 판 맞추기 · 2026-10-16

- 오너 결정 2 = A(판 파일 + 상태 명령), 결정 3 = A(제품 파일 쓰기를 동기화 한 길로). Q-Design 8ea4bf6.
- 판 파일: `sync.mjs --write` 가 제품마다 `q-design.version.json` 을 쓴다(자리는 `sync-parts.mjs` 의 PRODUCTS).
  조각마다 본문 지문과 «그 내용이 Q-Design 에 들어온 커밋 · 날짜». 내보낸 때가 아니라 내용으로 정해서, 같은 내용을 다시 내보내도
  판 파일이 바이트까지 같다(제품 커밋 · 운영 배포가 생기지 않음). `--stamp` 는 사본을 두고 판 파일만 지금 사본대로 적는다.
- 제품 쪽 시험 넷은 Q-Design 을 읽지 않고 «사본 지문 = 판 파일» 만 본다. 일부러 깨뜨려(판 지문 하나 · 사본 한 글자) 우는 것을 보고 되돌렸다.
  Q-Atelier bfff11b4 · Q-Maison 3f058d28 · Q-Carnet 1d6d7e6 · Q-Sonar 0909322(모두 비공개 저장소 실측 후 main 푸시 = 운영 배포).
- 상태 명령 `tools/status.mjs`: 제품마다 한 줄(받은 판 · 뒤처짐 · 판 파일과 다른 사본 · 커밋 / 원격 여부).
  Q-Sonar 는 차림표 · 목록 · 뼈대가 10-10 판(14f8164 · 73cf157)이고 지금 정본은 10-11 판(3163c82). Q-Sonar 는 일부러 따라잡지 않았다(5단계).
- 🔴 지문을 줄바꿈 LF 로 맞춘 본문으로 센다. CRLF 원본 셋의 사본 지문이 바뀌어 Q-Atelier 2 · Q-Maison 1 사본의 머리표 한 줄씩 바뀌었다(본문 그대로).
  예전 지문은 CRLF 바이트로 찍혀 리눅스에서 받은 사본과 맞지 않았다. 4단계의 «줄바꿈 맞춘 대조» 는 이것으로 끝.
  sync 대조는 이제 머리표 지문까지 본다(본문만 같고 머리표가 낡으면 «어긋남(머리표 지문)»).
- 결정 3: `copy-spacing` · `build-mono-fonts` 의 `--write` 는 Q-Design 안만 쓰고, 제품 파일은 `--write-products` 로 `extract-all --sync` 에서만 쓴다.
  가짜 제품 폴더에서 정본 문구 하나 · 제품 문구 하나로 «검사 둘 다 잡음 → 만들기는 정본만 → 내보내기는 제품만 → 통과» 를 돌려 봤다.
  맞추지 않은 문구가 없는 지금은 두 도구를 어느 방식으로 돌려도 형제 저장소 · 연결 기록 · 글꼴 선언이 바이트까지 그대로였다.
- 걸린 것: 색 커버리지 감사가 새 판 파일을 «뽑아 올 원본» 으로 세어 축이 2개로 늘었다. 내보낸 파일 목록에 판 파일을 넣어 기준과 같게 돌렸다.
  Q-Maison 커밋 훅이 사본에도 서식 도구를 돌리므로 커밋된 사본으로 다시 대조했다(바뀐 것 없음).
- 대조: 기준 검사 11개 중 9개가 글자까지 같고, 동기화 확인은 줄바꿈 3조각 지문 값만, 문자 검사는 새 파일 1개만큼, 남긴 시험 185 통과(+1).
  검사기 초록, 형제 저장소 작업 트리 앞뒤 같음, 끊긴 import 0(남은 4건은 전부터 있던 코드 문자열).
- 판 파일이 덮지 않는 것: 앱 아이콘 · 기본 UI 구현 · 업무 아이콘 · 폰 앱 셋 · 화면 문구 · 모노 글꼴. 머리표 지문이 없는 내보내기라 판 파일 밖이다.
  4단계에서 검사 하나로 묶을 때 함께 다룰 것.
- 🔴 Q-Atelier GitHub 시험 작업(«typecheck + unit»)은 bfff11b4 에서도 빨강이지만 이 정리 탓이 아니다. 10-12 부터 줄곧 라이선스 게이트에서 멈춘다
  (`@lierline/ai-federation@0.3.0` 라이선스 미선언). 단위 시험은 그 뒤 빌드 단계 안에 있어 CI 에서는 돌지 않고, 푸시 훅과 버셀 빌드가 대신 돌린다.
- 다음: 3단계(정본 10장). 다른 세션의 Q-Design 수정 보류는 정리가 끝날 때까지 이어진다.

## 군살 빼기 1단계 빼기 · 2026-10-16

- 오너 승인 뒤 1,011개(228.9MB)를 한 커밋으로 뺐다(0efaa1d). 올린 지우기 목록이 분류 목록과 한 줄도 다르지 않음을 대조한 뒤 커밋했다.
  남은 추적 파일 927 · tools 는 도구 69 · 시험 27.
- 본 폴더에서 기준 검사를 다시 돌렸다: 11개 중 10개가 기준과 글자까지 같고, 문자 검사는 «감사 기록 24곳» 알림이 사라지고 검사 파일 수가 줄었을 뿐 초록.
  남기는 시험 27개 통과, 검사기 초록(만들기 확인 17 · 시험 184건), 끊긴 import 0, 형제 저장소 작업 트리 앞뒤 같음.
- 추적 안 된 파일(다른 세션의 시안 · 기록 68개)은 그대로다. 폴더 안 추적 파일이 다 빠져 `git status` 가 `preview/screens/` · `reviews/` 를 한 줄로 묶어 보여 줄 뿐.
- 다음: 2단계(판 파일 · 상태 명령 · copy-spacing 한 길) 결정 둘을 오너께 여쭐 것. 그때까지 다른 세션은 Q-Design 수정 보류.

## 군살 빼기 0단계 · 1단계 매듭 · 2026-10-16

- 오너 결정 1 = A안. 정리 직전 커밋 379af90 에 꼬리표 `archive/before-slim-2026-10-16` 을 달고 원격에 올렸다. 빼는 파일은 여기서 꺼낸다.
- 분류는 이름 · 위치로 먼저 갈랐다가, 만들기 입구에서 실제로 부르는 파일을 끝까지 따라가 71줄을 바로잡았다
  (공용 분석 부품 `style-arguments-core` 와 추출이 읽는 `source/style-adapters` 6개를 버릴 뻔했다). 남김 927 · 뺌 1,011.
- 기준은 읽기 전용으로만 떴다(검사 11개 + 남기는 시험 27개). 형제 저장소 작업 트리 지문이 앞뒤로 같았다.
  정리 전부터 빨강인 것 셋: 원본 사본 2곳(Q-Atelier `components.tsx` 가 앞섬) · 색 커버리지 축 1개 · Q-Sonar 사본 3곳.
- 매듭(5bdeec1): 없는 걸음 파일을 «건너뜀» 대신 실패로, 증명만 하던 만들기 걸음 넷을 뺌, `copy-spacing` 의 기록 쓰기 둘을 뺌,
  검사기를 걸음 248개에서 만들기 확인 17개 + 남기는 시험 27개(184건)로. 매듭 전후 기준 검사 11개가 바이트로 같았다.
  🔴 `copy-spacing --write` 는 `--sync` 없이도 맞지 않는 문구가 있으면 제품 파일을 직접 고친다. 기준은 `--check` 로만 뜰 것.
- 지우기 시험: 사본 두 벌(A 그대로 · B 1,011개 지움)에서 같은 걸음을 돌렸다. 검사 12개 · 검사기 · 만들기 10걸음 결과가 같고,
  다시 만든 산출물 3개는 바이트까지 같다(커밋본과는 `generatedAt` 날짜 한 줄만 다름). 끊긴 import 0(남은 4건은 A 에도 있는 코드 문자열).
- 🔴 새로 꺼낸 사본은 사본 대조가 3곳 더 «다름» 이다. `patterns/foundation/atelier-manual.ts` · `atelier-html.ts` · `maison-print-styles.tsx` 가
  본 폴더에는 CRLF 로 남아 있고(깃은 깨끗하다고 봄), 제품 사본은 그 CRLF 바이트로 지문이 찍혔다. 4단계 검사는 줄바꿈을 맞춘 뒤 대조할 것.
- 무시 목록(d8b725f): `reviews/atelier-onboarding-preview-fixture.json`(로컬 계정 · 출처)이 어느 무시 줄에도 안 걸려 있었다.

## 메종 생산 준비 표 브라우저 검사 흔들림 · 2026-10-16

- 원인은 검사 쪽이었다(재현으로 확인). 폰 폭(320 · 390)에서는 설비 줄이 세로로 쌓여 «확인» 체크칸이 설비 번호 선택 칸 아래에 온다.
  `check.check()` 가 마우스를 그 자리에 두면 열린 목록이 마우스를 덮고, 브라우저가 멈춘 마우스 밑 1번 줄(LOCAL-A)에 한 박자 늦게 mouseover 를 보낸다.
  메종 `Combobox` 는 mouseenter 로 활성 줄을 옮기므로, 그 신호가 End 뒤에 오면 활성 줄이 LOCAL-B 에서 LOCAL-A 로 되돌아간 채 Enter 가 눌린다.
- 증거: 사건 기록을 단 사본에서 End 를 목록 확인 없이 바로 누르게 하면 두 바퀴 모두 36번 고르기 중 5번 실패했고,
  10건 모두 «End → 활성 2 → 1번 줄 mouseover → 활성 1 → Enter» 순서였다. 폭 1280 은 0건(체크칸이 같은 줄 오른쪽이라 목록이 마우스를 덮지 않음).
- 고침(`tools/verify-maison-prep-table.mjs` 만): 체크한 뒤 마우스를 표 밖 (0,0) 으로 빼고, End 뒤에는 입력칸의 `aria-activedescendant` 가 마지막 줄을 가리킬 때까지 기다린 뒤 Enter.
  기다림만으로는 모자랐다(세 바퀴 중 한 번, 되돌아간 활성 줄 때문에 기다림이 시간 초과). 마우스를 빼면 목록 줄 mouseover 가 0건이 된다.
  키보드로 끝 줄(LOCAL-B)을 고르는 확인은 그대로다. 실패 메시지에 경우(공정 · 폭 · 글자 크기 · 테마)를 붙였다.
- 결과: 열 번 연속 열 번 통과(전체 시험과 동시에 돌린 바쁜 상태에서). 전체 시험 765 중 765(늘어난 5개는 같은 시각 다른 세션이 쓰던 maison-style 시험).
  저장된 `reviews/maison-prep-table-browser.json` 은 한 글자도 바뀌지 않았다.
- 🔑 제품 부품은 고치지 않았다. 다만 목록이 움직여 멈춘 마우스 밑에 다른 줄이 오면, 그 줄이 키보드로 고른 활성 줄을 덮어쓰는 동작은 Q-Works `components/ui/combobox.tsx` 의 것이다.
  검사 픽스처에서만 봤고, 실제 사용(긴 설비 목록 · 데스크톱 마우스)에서 문제가 되는지는 재지 않았다.

## 메종 판정 보고서 낡음 검사 · 2026-10-16

- 아래 항목의 «미분류 1,164 · 다른 기록 767» 은 저장본이 낡아서가 아니었다. 재현 사본이 ROOT 를 `'D:/Claude/Q-Design'` 문자열로 박아,
  수동 판정의 증거 경로 검사가 Q-Design 쪽 파일마다 거짓이 됐고 수동 판정 747건이 오류 없이 미분류로 떨어졌다. 767 = 로그인 20 + 747.
  바르게 돌리면 미분류 417 로 저장본과 같고, 다른 것은 로그인 화면(Q-Works 4d9361ae)의 줄 이동 20건뿐이다(판정은 그대로). 기록은 문서 118(보관).
- 오너 «추천안으로». 생성기가 제품 원본을 등록된 원본 층(`sourceLayers`, 지금은 로그인 층 하나)을 거쳐 읽고,
  새 `--fresh` 가 새 보고서를 저장본과 바이트로 비교한다(만든 시각만 빼고, 미분류 목록 파일까지). `--check` 는 미분류 0 과 낡음 0 을 함께 요구한다.
  증거 경로 읽기는 `manualHashReader` 로 옮겨 두 뿌리를 정규화했다. 명령 검사에 `--fresh` 를 넣었다.
- 일부러 깨뜨려 봄: 로그인 층을 빼면 낡음 시험이 원본 지문 1건 · 기록 20건을 짚고 실패, 저장본 사본의 판정 하나를 바꾸면 그 기록만 짚고 실패,
  빗금 문자열 ROOT 사본은 이제 417 로 통과. 저장 파일 두 개는 한 글자도 바꾸지 않았다.
- 🔑 제품 원본이 또 바뀌면 `--fresh` 가 바로 빨강이 된다. 모양 인자를 안 건드리는 정확한 고침이면 원본 층을 만들어 `sourceLayers` 맨 앞에 넣는다.

## 메종 로그인 화면 지문으로 탐색 목록 다시 묶기 · 2026-10-16

- 오래된 빨강의 원인이 하나였다. 전체 시험 셋(choice-glyph-revalidation · maison-current-navigation · release-history-refresh)과
  명령 검사 셋(choice-glyph-revalidation · maison-back-navigation · maison-back-navigation-evidence)이 모두 같은 원인이다.
  Q-Works 4d9361ae 가 `app/(auth)/login/login-form.tsx` 에서 효과 하나의 안쪽만 고쳤다(어느 알림 문구를 띄울지, 한 박자 뒤에).
  메종 탐색 목록은 1e27ab26 때의 화면 원본 전체 지문을 묶어 두고 있었다.
- 계약 안내 층(`maison-contract-hint-copy`)과 같은 길로 새 원본 층 `maison-login-session-notice` 를 붙였다.
  4d9361ae 의 로그인 화면과 정확히 같을 때만 2aff4e23 원본으로 되돌리고, 다른 내용은 그대로 흘려 기존의 정확한 검사가 거절한다.
  증명(`reviews/maison-login-session-notice.json`): 고친 덩어리는 45번째 줄의 3줄이 15줄로 바뀐 것 하나이고, 효과 하나의 몸통이다.
  모양 인자 20개는 12줄 밀린 것 말고 그대로이고, 상위 이동 링크 자리는 전후 모두 0이다. 저장된 검토 파일은 한 글자도 바꾸지 않았다.
- 결과: 전체 시험 760 중 760(새 층 시험 3 포함). 메종 명령 검사 62 중 60.
  남은 둘은 이번 일 전부터 실패했다. `maison-style-review --check` 는 미분류 417 규칙 때문이고,
  브라우저 검사 `verify-maison-prep-table` 은 선택 목록에서 End 바로 뒤 Enter 가 첫 줄을 고르는 흔들림이다(한 번 통과, 네 번 실패).
- 🔴 따로 본 것: `maison-style-review --check` 는 미분류가 0인지만 보고, 보고서가 낡았는지는 보지 않는다.
  지금 생성기를 그대로 돌리면 미분류 1,164개, 기록 767개가 저장본과 다르다(원본 지문이 다른 파일은 로그인 화면 하나뿐).
  저장본은 층을 거쳐 유지되는 것으로 보이며, 이번 일에서는 손대지 않았다.
  (같은 날 정정: 1,164 · 767 은 재현 사본이 ROOT 를 빗금 문자열로 박은 탓이었고 저장본은 낡지 않았다. 바로 위 항목과 문서 118(보관).)

## 장부형 패턴 층 증명 사슬 다시 묶기 · 2026-10-16

- 10-15 패턴 층(Q-Atelier f6fcc65b · 이 저장소 ecc29c5)이 원본 15개(덩어리 69개)를 고쳐 증명 사슬 시험 43개가 빨강이 됐다.
  오너 «시간이 걸려도 정석대로 전부 다시 묶어 줘». 검사를 느슨하게 하지 않고 사슬 맨 앞에 새 층 하나를 붙였다. 기록은 문서 117(보관).
- 새 층: `atelier-ledger-pattern-sources`(원본마다 고치기 전 · 뒤 지문과 고친 덩어리) · `atelier-ledger-pattern-review`(보고서마다 넘어온 것 · 폐기 · 새로 · 바뀐 것).
  고친 덩어리 안의 옛 판정은 넘기지 않고 폐기 뒤 다시 증명한다. 판정 보고서 53,999 → 54,098건(폐기 189 · 새로 288), 미분류 573 → 579(늘어난 6건은 모두 새 코드).
- 결과: 전체 시험 757 중 754 통과(실패 셋은 기준과 같은 메종 `login-form.tsx` 원인) · 명령 검사 54 중 52 통과(둘은 기준에서도 실패) · 판정 보고서 되풀이 만들기는 두 바퀴째에 멈춤.
- 🔑 제품 원본을 고치는 커밋이 생기면 이 저장소 증명 사슬은 다시 빨강이 된다. 그때도 같은 방식으로 «정확히 기록한 고침만 되돌리는 층» 을 맨 앞에 붙이고,
  지금 원본을 읽는 자리는 `beforeLedgerSourceIfLater` 처럼 그 층을 먼저 거치게 한다. 🔴 `atelier-unknown-contexts.json` 은 만든 시각을 찍어서 매번 바뀌므로 안정 확인에서 뺀다.

## 정본 점검 · 참고 사이트 조사 · 2026-10-15

- 오너 «Q-Design 점검. 참고할 만한 예시 사이트 전부 뒤져볼 것». 저장소 다섯 곳 모두 최신. `extract-all --check` 로 원본 사본 111/111,
  세 제품(Q-Atelier · Q-Maison · Q-Carnet)의 차림표 · 목록 · 화면 CSS 사본과 앱 아이콘 32/32 가 정본과 같다. 10-10 기초 층
  (조작 윤곽 · 줄 괘선 · 구역 괘선 · 구역 번호)은 제품 안에서 실제로 계산된다.
- 전체 시험 746 중 743 통과. 실패 셋(choice-glyph-revalidation · maison-current-navigation · release-history-refresh)은 원인 하나다.
  Q-Works 4d9361ae 가 `app/(auth)/login/login-form.tsx` 를 고쳤고 `maison-navigation-inventory-refresh.mjs` 는 옛 지문을 고정해 들고 있다.
  차림 링크 147개는 그대로이고 inventoryHash 만 다르다. 다시 찍기는 증거 사슬 작업이라 손대지 않았다.
  🔑 제품 원본이 바뀔 때마다 이 저장소 시험이 빨강이 되는 구조라, 빨강을 보면 먼저 «어느 제품 커밋이 지문을 바꿨나» 를 본다.
- dev 3600 실화면(1440 · 412): 왼쪽 강조선 0 · 12px 미만 글자 0 · 가로 넘침 0.
  🔴 대시보드 R&D 단계 이름표에 한글 자간 1.2px + 대문자 변환(Q-Atelier `components/OwnerResearchPipelineClient.tsx`), «시행» 꼬리표 0.48px.
  `label-tracking-contract.test.ts` 는 `lib/design/components.tsx` 만 보고, 정규식이 `"var(--qd-…)"` 문자열을 못 읽어 거짓 초록이었다.
  → 10-22 Q-Atelier 에서 2부를 더해 고쳤다: `app/` · `components/` 전체 · var() 토큰 · 함수 반환 · 부르는 쪽 props 까지 따라가고,
  정할 수 없는 자리는 파일별 기준선으로 센다. 규칙은 [03 글자](03-typography.md) · [10 규칙](10-rules.md) ⑩.
- 장부형 계획 3 · 4단계(패턴 층)는 제품에 없다. 테두리 상자 목록이 용어집 69 · 멤버 14 · 설정 14 · 대시보드 15, /settings/usage 에 상자 중첩 1.
  🔴 Q-Sonar 사본 셋(nav · list · screen)이 10-10 판에 멈춰 있다. 10-10 오너가 묶음을 풀었는데(`sync-parts.mjs` HOLD 비움),
  10-11 부터 문서 06 의 절차가 `--only=Q-Atelier,Q-Works,Q-Forge` 라 Q-Sonar 가 빠졌다. `globals.css:53` 에는 정본에서 10-11 에 뺀 #aaa395 가 남아 있다.
- 고침: README · 문서 27 · 32 · 36 이 링크하던 미추적 파일 14개를 올렸다(9279cf0) · `debug.log` 무시.
  패턴 층에 쓸 참고 사이트 80곳(6갈래 · 직접 열어 확인)을 [참고 사이트 문서](reference/reference-sites.md)으로 남겼다.

## Btn pending 호출부 전환 뒤 추출 재확인 · 2026-10-08

- Q-Atelier 에서 Btn `pending` 호출부 183곳을 바꾼 뒤(07624d43) `extract-all --sync` 를 돌렸다. 탐침 멈춤 0, 정본 CSS 값 변화 0.
  바뀐 것은 원본 날짜 · 해시 줄뿐이라 DHR · Q-Works 의 nav.css 사본은 되돌렸다(주석 한 줄로 운영 배포 둘을 내지 않음 · 다음 실제 변화 때 같이 간다).
  이 저장소의 dist · source 사본은 그대로 올린다(사본이 멈추면 탐침이 못 본다).
- 06 문서 `pending` 문단에 호출부 규칙(검증은 disabled 에 · 행 식별 깃발 · 삼항 금지 · 공유 깃발은 가른 뒤 · 숨은 글귀 «처리 중»)을 적었다.

## ui-ux-pro-max 스킬 대조 · 멈춰 있던 탐침 넷 · 2026-10-08

- 오너 «ui-ux-pro-max 스킬을 깃허브에서 찾아 굴려 봐» → 임시 폴더에서 돌려 본 결과 Tailwind 기본 팔레트(#2563EB) · 제목 = 본문 글꼴 ·
  한글 명조 추천 · 뉴모피즘 · 한글 질의 무반응이라 **설치하지 않기로**(오너 선택). UX 지침 119개를 이 저장소 문서 26편 · Q-Atelier 코드와
  대조해 정말 빈 것 6개를 찾았고, 공용 부품에서 닫을 수 있는 셋을 Q-Atelier 58108d42 로 고쳤다(Field 오류 · 도움말을 칸에 aria-describedby 로
  연결 · Btn pending · touch-action). 06 문서에 둘을 적었다. 남은 셋(오류 요약 + 초점 이동 · 확대 200% · 04 문서 폰 폭)은 별도.
- 🔴 **`extract-all --sync` 가 10-04 이후 멈춰 있었다.** 원본이 바뀐 자리 다섯을 탐침이 못 따라가 차례로 멈췄다(한 번에 하나씩만 보여 다섯 번 돌렸다):
  ① 차림표 IconBtn 이 공용 부품으로 걷힘(10-07 2e56225a) → 치수는 `components.tsx` 의 `size = TOUCH.min`, 모서리는 차림표의 `RAIL_ICON_BTN` 에서 읽는다(값 44 · 10 그대로).
  ② 발치 아바타에 `userId · avatarVersion` 이 붙음(10-06) → 탐침을 줄 끝까지 느슨하게.
  ③ 빈 화면 빛무리(radial-gradient)와 장식 글리프가 걷힘(09-28 2081910f · 금지 목록) → 정본에서도 두 구역 · CSS · 문서 16 · 견본(parts.html) 의 `.qd-empty-icon` 을 뺐다.
  ④ 목록 검색 단추가 공용 `Btn p={false} sm` 으로(10-07 b3179fa8) → 치수를 Btn 에서 읽고, 글자색 text → **subtle**, 옆 여백 16 → **14** 로 원본을 따랐다.
  ⑤ 건수 글이 «한글이면 본문체 · 숫자면 모노»(09-28 41d8b2eb) → 불변식을 바꾸고 `[data-hangul]` 에 `font-family: var(--qd-font-ui)` 를 더했다.
  내 Btn pending 이 Btn 안에 gap 을 하나 더 넣어 `btn.gap` 탐침이 둘 맞았다 → 바로 뒤가 padding 인 것만 잡게 좁혔다.
- 결과: 지도 119개 전부 같음 · 차림표 532줄 · 목록 742줄 · 모든 사본이 원본과 같음. Q-Carnet(DHR) · Q-Maison(Q-Works) 에 차림표 · 목록 사본 갱신
  (Q-Sonar 는 09-28 결정대로 묶어 둠). 🔑 탐침이 멈추면 «원본이 어느 커밋에서 왜 바뀌었는가» 를 `git log -S` 로 먼저 보고, 값을 적어 넣지 않는다.

## 설치 앱 상단 바 = 아이콘 금속 색 · 네 제품 대조 · 2026-09-29

- 오너 결정(두 화면을 나란히 본 자리): 「상단 바 색상을 넣을 거라면 각 아이콘에 들어간 색상으로」 → 시안 셋 가운데 **짙은 금속 색**,
  동결 중인 두 제품에도 이 색만은 지금. 결정 전문은 `tools/app-icons.mjs` 머리.
- `app-icons.mjs`: 틀 선 가운데 금속 색(STROKE)을 먹색 바탕 BG 에 26% 섞는 `titleBarOf` · `TITLE_BAR_MIX` 를 두고, 제품마다
  `titleBarIn`(상단 바 색을 적는 파일)을 더했다. `--check` 가 그 파일들에서 `theme_color` · `themeColor` 자리를 모두 찾아
  따옴표 친 그 색 하나인지 본다(배열 · 변수 · 함수 호출 · 다른 색 · 빠진 자리는 어긋남 · 주석은 걷고 봄).
  값: 은 `#393939` · 금 `#3d3425` · 구리 `#3d281d` · 강철 `#222e3a`(흰 글자 대비 11.6 · 12.2 · 13.8 · 13.8).
- 제품을 고치기 전에 `--check` 를 돌려 8곳 빨강을 봤다(Q-Maison 두 테마 배열 · Q-Carnet 회사 색 함수 · Q-Sonar 화면 쪽 자리 없음 등).
  고친 뒤 9곳 초록(Q-Atelier 는 전문가 영역 틀까지 셋). `dist/app-icons/README.md` 표에 «상단 바» 열. 아이콘 그림은 그대로(지문 같음).
- 이 도구는 제품에 색을 쓰지 않는다(대조만). 제품 파일은 각 저장소에서 손으로 고쳤다.

## 보조 글씨 최소 12px · 차림표 발치 한글 · 두 제품 동결(HOLD) · 2026-09-28

- 원본 Q-Atelier eb3e9bc8(12px · 차림표 발치 · 로그아웃 글귀)에서 다시 뽑았다. 정본 세 조각의 12px 미만이 0 이 됐다(전에는 27곳).
  뼈대 추출기가 원본의 옛 글자 `fontSize: FS[10]` 를 표지로 찾고 있어 멈췄다 → 표지를 FS[12] 로. 목록 조각의 오류 코드 11px(손으로 적은 값) → 12.
- 차림표 발치(오너 결정 2026-09-28 «한글 · 적힌 그대로 · 로그아웃 글귀»): `.qd-rail-org` · `.qd-rail-user-meta` 는 대문자로 바꾸지 않고,
  역할 줄은 한글 본문체. `.qd-rail-logout` 은 글귀(원본 LogoutButton → TextAction 에서 치수를 읽고, TextAction 을 안 쓰게 되면 추출기가 멈춘다).
- 🔴 **묶어 둠(HOLD)**: `tools/sync-parts.mjs` 에 HOLD 를 두고 `sync.mjs` 가 따른다. Q-Works(Q-Maison) · Q-Forge(Q-Carnet)는 모든 조각을 묶었다
  (오너 지시 2026-09-28 「메종, 카르넷은 동결하고 큐 아뜰리애만을 기준으로」). Q-Sonar 는 화면 정본 세 조각만(12px 규칙 제외 결정).
  풀 때는 오너 확인 뒤 그 줄을 지우고 `extract-all --sync`. 두 제품에 옮길 일은 Q-Atelier `docs/FAMILY_PORT_QUEUE.md`.
- `refresh-source.mjs`: 원본 경로를 `QD_QA_REPO` 로 바꿀 수 있다(D:/Claude/Q-Atelier 는 다른 세션의 폴더라 HEAD 가 뒤처질 수 있다).
  사본 지도에 LogoutButton · TextAction 을 더했다.
- 금점 다리 `.qd-nav-dot { display: none }` 를 정본에서 지웠다(옆 세션 요청 · docs/24). 세 제품 사본에는 동결로 남아 있다(무해).

## 문서 결 3차 · 두 제품으로 내려보냄 · sync --only · 2026-09-27

- Q-Carnet(0956727) · Q-Sonar(acb3c1e)에 차림표 · 목록 정본을 내려보냈다. 두 제품의 계약 검사가 찾던 옛 글자(금막대 ·
  카드 여백 · 금점 마크업)를 새 정본 글자로 바꾸고 금점 마크업을 걷었다. Q-Carnet 은 개발 계정으로 선택 항목 계산값
  (굵기 600 · 왼쪽 선 0 · 여백 17 · 밑줄 16px 금색 · 금점 없음)과 차림표 사진을 전후로 봤다. Q-Sonar 는 시험(623)만 ·
  눈으로 볼 시연 계정이 기록에 없다.
- `tools/sync.mjs --only=제품,제품`: 🔴 화면 검토 세션의 작업자가 Q-Maison 작업 폴더(D:\Claude\Q-Works)에서 커밋 안 된
  고침을 들고 일하는 중이었다. 그 폴더에 사본을 쓰면 인덱스가 섞인다. 빠진 제품은 지문이 «어긋남» 으로 남아 잊히지 않는다.
- Q-Maison 은 그 세션이 폴더를 비운 뒤 같은 일을 한다. 세 제품에서 금점 마크업이 다 빠지면 정본의 다리
  (`.qd-nav-dot { display: none }`)를 지운다.
- 문서 24: 이행 순서 3(PC 화면 180 → 6) · 4(두 제품 완료 · Q-Maison 대기) 갱신.

## 문서 결 2차 · 비율은 grain.ts 한 곳 · KPI 격자 탐침 · 2026-09-27

- 원본이 상태 색을 가는 선에 섞는 비율을 `lib/design/grain.ts` 의 `GRAIN.tint`(0.55) 한 곳에 두었다(Bx accent · Alert · InfoBox ·
  KPI 도움말 · 화면들이 부름). `refresh-source` 가 이 파일을 `source/tokens/grain.ts` 로 받고, `extract-list` 가 판 테두리 · 못 읽은 자리의
  선 비율을 여기서 읽는다. Bx 는 `tintBorder(accentColor)`, Alert 는 `...ruleBand(c)` 를 쓰는지 본다.
  🔴 tokens.ts 에 두지 않은 까닭: 원본의 요구사항 엔진 검증 근거가 그 파일의 지문을 들어, 한 줄만 더해도 배포 빌드 첫 단계가 멈춘다.
- 목록 정본의 줄 hover 에 `!important` 가 따라왔다. 원본이 인라인 바탕에 hover 가 가려지던 결함을 그렇게 고쳤기 때문이다.
- 🔴 뼈대 생성기가 또 다른 작업에 멈췄다: 화면 검토(A18)가 기준 화면(감사 로그)의 KPI 를 넷에서 둘로 줄였는데 탐침이
  `cols={4}` 를 못 박고 있었다. 칸 폭 · 간격(180 · 14)은 그대로라 칸 수를 풀고 폭 · 간격만 읽는다.
- 받는 세 제품 내려보내기는 아직(Q-Carnet · Q-Sonar 먼저, Q-Maison 은 화면 검토 세션이 폴더를 비운 뒤).

## 문서 결 1차 · 정본 생성기가 새 부품을 읽는다 · 2026-09-27

Q-Atelier 부품 1차(2e9e4d87: 목록 줄 · 경고 · 안내 · 강조 상자 · KPI 도움말 · 사이드바 선택 표시)에 맞춰
정본 생성기를 고쳤다. 받는 제품으로 내려보내기는 아직 안 했다(이행 순서 4).

- **차림표**(`extract-nav.mjs`): 탐침을 금막대 · 금점에서 왼쪽 여백(17) · 선택 밑줄(16 × 1.5 · 글자 아래 5 · 모서리 1)
  · 펼침(320ms)으로. 정본 CSS 는 이름표의 `::after` 로 밑줄을 긋는다. 🔑 이름표가 말줄임(overflow: hidden)이라
  밑줄이 잘린다 → 아래 안쪽 여백 5px + 바깥 여백 -5px 로 자리를 만들어 줄 높이가 그대로다. 걷은 금점은
  받는 제품 마크업에서 걷을 때까지 `display: none`.
- **목록**(`extract-list.mjs`): 항목 카드 → 괘선 줄(모서리는 원본 EntityRow 에서 읽어 0, 판 모서리는 토큰 10 을
  따로 둔다 · 섞었으면 판까지 각졌다). hover 는 `.qa-card-lift` 떠오름 대신 `.qa-row-clickable` 옅은 바탕.
  상태 판 · 못 읽은 자리의 왼쪽 선을 걷고, 섞는 비율(55%)을 원본 Bx · Alert 에서 읽는다. 원본 구역에 `borderLeft`
  가 다시 생기면 생성기가 멈춘다.
- **대조 도구**(`diff-rails.mjs`): «활성 점» 대신 «선택 밑줄»(정본은 `::after`, 원본은 별도 요소라 가상 요소를 재게 넓힘).
- **걸러내기**(`screen-ai-cliches.mjs`): «옆 색 선» 항목을 더했다(2px 이상 · 주석 줄 제외). Q-Atelier 화면 183 · 메일 16.
- 🔴 **다른 작업이 뼈대 생성기를 세워 두고 있었다**: Q-Atelier 가 손가락 기기 단추 규칙에 `!important` 를 붙이고
  같은 블록에 입력칸 · 작은 조작부의 44 를 더했는데(패드 UX 감사), 탐침이 «!important 없는 첫 min-height» 를
  찾아 «TOUCH.min 과 다르다» 로 멈췄다. 단추 규칙 하나를 짚어 읽게 고쳤다. 원본 사본도 20곳 뒤처져 있었다
  (그 사이 아무도 extract-all 을 안 돌렸다).
- 문서: 24(부품 표 ✅ · KPI 는 카드에 원래 왼쪽 선이 없었다고 바로잡음 · 정본 CSS 절) · 15(항목 치수 · 밑줄) ·
  05 · 07(움직임 이름).

## 문서 결 정본 · 왼쪽 강조선을 없앤다 · 2026-09-27

오빠 「모든 컴포넌트에 왼쪽 강조 라인이 붙어 있는데… 클로드 특유의 디자인 형태라서 다른 디자인 형태를」 ·
「눈을 현혹하는 디자인보다 깔끔하게 눈에 잘 보이는 디자인」. 대화 속 움직이는 시안 네 차례로 정했다.

- `docs/24-document-grain.md` 새로(강제 규격): 결재는 가로 결재 길, 결재 밖 강조는 «문서 결»(오빠 문서 기준
  STYLE_GUIDE 의 괘선 · 금색 라벨 강조문 · 요약표), 열 많은 목록은 «장부 결». 바꿀 부품 여섯(Bx accentColor ·
  InfoBox · Alert · KPI · EntityRow · NavLink)과 이행 순서, 물린 시안 목록.
- 🔴 금지 목록에는 9월 1일부터 «카드 한쪽의 굵은 컬러 보더» 가 있었는데, 클리셰 걸러내기(19)가 이 항목을
  세지 않았다. 금지 목록과 걸러내기 도구가 서로 다른 목록을 보고 있었다 → 도구에 더할 것(남은 일).
- Q-Atelier 쪽: 결재함 새 모양 · 가로 결재 길 부품(f561ffff · 운영 · 실제 폰 확인) · 옆 색 선 188곳 동결 계약.

## 화면용 붓 Q WebP · 원본 글꼴 방식 바뀜 반영 · 거울 갱신 · 2026-09-26

오빠 「전체 프로그램의 반응 속도 및 서버 속도 관련 점검 해줘봐」 → 선택지에서 「첫 방문 무게 줄이기」.

- **화면용 붓 Q**: `tools/app-icons.mjs` 가 원본 그림(`source/brand/logo-dark.png` · `logo-light.png`)에서
  `q-mark-on-dark.webp` · `q-mark-on-light.webp`(너비 360 · WebP 90 · 원본 비율 · 27KB / 24KB)를 만들어 붓 Q 를
  화면에 그리는 세 제품(Q-Atelier · Q-Carnet · Q-Sonar)에 씁니다. 전에는 제품마다 원본 PNG 사본(126KB · 286KB)을
  싣고 있었습니다. 2배 확대 대조에서 붓 끝 가는 획까지 구별되지 않았습니다(PNG 팔레트 · AVIF 도 견줘 봄).
  PRODUCTS 의 `marksIn` 이 붓 Q 를 그리는 파일이고, `--check` 가 그 파일이 WebP 두 장을 부르고 옛 PNG 사본을
  부르지 않는지 봅니다. 🔴 첫 판은 주석까지 봐서, 「옛날에 /logo-dark.png 를 박아 썼다」 는 사연 주석을 잡았습니다
  (Q-Atelier BrandLogo.tsx). 주석을 걷고 봅니다. 🔑 설치 앱 아이콘이 아니므로 판 번호 지문(ICON_VERSION)에 넣지
  않았습니다. 원본 PNG 는 그대로 둡니다(아이콘 생성기의 원본 그림이라 줄여 덮으면 아이콘 화질이 떨어짐).
- **원본 글꼴 방식이 바뀜**: Q-Atelier 가 Pretendard 를 공식 조각판 92조각으로, JetBrains Mono 를 이 저장소의
  그 파일로 자기 서버에서 냅니다(Q-Atelier 2f8b7aa9). `docs/03-typography.md` 의 「원본 앱의 로딩」 칸 ·
  `source/fonts/NOTICE.md` · `source/fonts/fonts.ts`(손 사본, 지도 밖) 를 고쳤습니다. `tools/audit-coverage.mjs`
  ⑥ 폰트는 이름이 아니라 «글꼴 종류» 로 셉니다(원본은 폴더 두 개, 여기는 온전한 파일이라 이름이 다름).
  ② CSS 축에서 원본의 `app/fonts.css`(꾸러미에서 만든 @font-face 목록 · 디자인 규칙 없음)는 뺐습니다.
- **거울 갱신**: `refresh-source.mjs --write` 로 34곳(오늘 여러 작업이 원본을 바꾼 뒤 멈춰 있던 것 포함 · 고아
  svg 둘 걷음). 다시 만든 `dist/q-design.nav.css` 는 머리글(원본 날짜 · 지문)만 바뀌어 세 제품에 내보냈습니다
  (Q-Carnet 427064f · Q-Sonar 5871546 · Q-Maison 은 그쪽 작업과 함께).
- 남은 것(이 작업 전부터 있던 빨간 불 · 손대지 않음): 감사 ② CSS 축 `components/qms/sheet-paper.css`(09-25) ·
  lib/design 축 `print.ts`(09-10) · Q-Forge 색 `#000000`.

## 설치 앱 이름 · 설명 한 줄의 원본을 제품 목록에 · 2026-09-26

오빠 「PWA 아이콘 설명.. 전체 시스템 동일하게 맞춰주고」(윈도 작업 표시줄 풍선 도움말 「Q-Atelier  Medical Device QMS」 캡처).
그 문구는 9/23 전 Q-Atelier 매니페스트의 앱 이름 「Q-Atelier: Medical Device QMS」 가 옛 설치에 남은 것이었고
(윈도가 쌍점을 공백으로 바꿈), 네 제품의 설명은 제각각이었습니다. 오빠 선택(선택지): 이름은 제품 이름만,
설명은 「… 시스템」 한 줄, Login 은 뺌.

- `tools/app-icons.mjs` 의 PRODUCTS 에 `tagline`(원본)과 `taglineIn`(그 글자가 있어야 할 파일)을 두고, `--check` 가
  대조합니다(`checkTaglines`). 코드 문자열의 «\uXXXX» 는 풀어서 봅니다(Q-Carnet 매니페스트가 그렇게 적음).
  - Q-Atelier 「의료기기 개발 · 인허가 시스템」: `public/manifest.json` · `public/offline.html`(영어 문구를 한글로) d280c05d
  - Q-Maison 「ISO 9001 품질경영 시스템」: `app/manifest.ts` d91bdd3d
  - Q-Carnet 「의료기기 제조기록서 시스템」: `app/manifest.ts`, 설치 앱 이름에서 제조소 이름을 뺌 40dad4e
  - Q-Sonar 「의료기기 잠재고객 발굴 시스템」: `src/lib/brand.ts` 의 PRODUCT_TAGLINE, 이름 · 탭 제목을 제품 이름만 cff4fbd
- `source/brand/manifest.json`(Q-Atelier 매니페스트 참고본)의 설명도 같게.
- 검증: `--check` 통과(설명 5곳). 원본 문구를 일부러 바꿔 Q-Maison(한글 그대로 적힌 쪽) · Q-Carnet(escape 로 적힌 쪽)
  둘 다 ❌ 로 잡히는 것을 본 뒤 되돌렸습니다(원본과 cmp 동일).
- 이미 설치한 앱은 설치 때 이름 · 설명을 들고 있습니다. 새 문구를 보려면 지우고 다시 설치합니다.

## 앱 창 제목 · 설치한 앱 창에서만 뒤의 제품 이름을 뗍니다 · 2026-09-26

오빠 「PWA 위에 이렇게 문구가 중복으로 나온다」(캡처: 창 제목 「Q-Maison - 대시보드 · Q-Maison」).

- 까닭(크롬 원본으로 확인): 크롬은 설치한 앱 창의 제목을 «앱 이름 - 페이지 제목» 으로 붙이고, 페이지
  제목이 앱 이름으로 시작할 때만 그대로 둡니다(`web_app_browser_controller.cc` 의 `GetTitle`). 앱 이름은
  매니페스트의 `name` 이고, 없을 때만 `short_name` 입니다(`jobs/manifest_to_web_app_install_info_job.cc`).
  «짧은 이름» 이라고 알고 있던 것을 여기서 바로잡았습니다. 우리 제목은 뒤에 제품 이름을 달아 두 번 나왔습니다.
- 고침: 새 부품 `source/components/app-window-title.tsx`. 앱 창(`display-mode` 가 browser 가 아닐 때)에서만
  제목 뒤의 «· 이름» · «: 이름» 을 떼고, 이름뿐인 제목은 비웁니다(크롬이 앱 이름만 보입니다). 브라우저 탭
  제목은 그대로입니다. 제품 이름은 `<meta name="application-name">` 에서 읽어, 회사 이름을 쓰는 Q-Carnet 도
  맞습니다. 받는 곳은 Q-Atelier · Q-Carnet · Q-Maison(`sync-parts.mjs` 「앱 창 제목」)입니다. Q-Sonar 는 제목이
  곧 앱 이름(`APP_TITLE`)이라 겹치지 않아 보내지 않았습니다.
- 버린 길 둘: ① 제목을 제품 이름으로 «시작» 하게 바꾸기. Q-Carnet 의 앱 이름은 «이름 · 한 줄 소개» 로 길어질
  수 있어 거기서 다시 겹칩니다. ② 크롬의 앱 창 제목 표시(`<meta name="application-title">`). 아직 시험
  기능입니다(`runtime_enabled_features.json5` 의 `AppTitle` 이 experimental).
- 검증: 크롬에는 `display-mode` 를 흉내 내는 개발 도구 설정이 없습니다(`media_values.cc`). 그래서 머리 없는
  크롬에서 페이지가 뜨기 «전에» `matchMedia` 를 바꿔 끼워 앱 창으로 만들고, 세 제품 개발 서버에서 쟀습니다.
  보통 탭은 그대로였고, 앱 창은 「로그인 · Q-Maison」 → 「로그인」 이었습니다. 제목 글자 바뀜 · 제목 요소
  갈아 끼움 · 실제 링크 이동(비밀번호 찾기)과 뒤로 가기에서 모두 다시 뗐고, 브라우저 탭으로 돌리면 원래
  제목으로 돌아왔습니다. Q-Atelier 는 제목 요소가 `<head>` 가 아니라 본문에 있었는데(Next 15 흘려보내기),
  문서 전체를 지켜보게 해 둔 덕에 잡혔습니다.

## 아이콘 주소에 판 번호(?v=2) · 2026-09-26

오빠 「이미 아이콘을 내려둔 사람은 어떻게 교체함?」. 크롬 144(2026-01)부터 설치된 앱은 매니페스트의 아이콘
«주소» 가 바뀔 때만 새 그림을 알아챕니다. 09-25 에는 주소를 그대로 두고 그림만 바꿨습니다. 오빠 선택
「판 번호 붙이기」. (오전 작업이라 커밋 메시지에만 있던 것을 옮겨 적습니다.)

- 생성기에 `ICON_VERSION = '2'` 를 두고, 제품 코드가 그 판 번호로 부르는지(`--check`)와 그림이 바뀌었는데
  판 번호를 안 올렸는지(`dist/app-icons/version.json`)를 봅니다. 네 제품 운영이 09:51 까지 모두 새 판으로
  바뀐 것을 쿠키 없는 요청으로 확인했습니다.
- 안내가 뜨는 조건(크롬 원본 `jobs/manifest_update_job.cc` · 2026-09-26 확인): 앱을 열거나 새로 고칠 때
  매니페스트를 다시 읽습니다. 새 아이콘이 설치된 아이콘과 10% 넘게 다르면 앱 창 점 세 개 옆에
  「앱 업데이트 있음」 이 뜨고 메뉴에 「앱 업데이트 검토」 가 생깁니다. 10% 안쪽이면 묻지 않고 조용히
  바꿉니다(조용한 교체는 하루 한 번까지, 그 안에 또 바뀌면 묻습니다). 그래서 이미 새 그림으로 설치한 앱에는
  아무 안내도 뜨지 않는 것이 정상입니다.

## 제품 앱 아이콘 다듬기 · Q 한 벌 · 붓 획 틀 · 2026-09-25 (이어서)

오빠 「외곽 틀을 조금 더 다듬을 방법 없을까? 큐 위치가 위아래로 안 맞기도 하고」. 첫 판은
틀마다 Q 를 따로 맞춰 넣었습니다(`LAYOUT` 표). 재 보니 Q 높이가 232 · 198 · 212 · 236 으로
제각각이었고, 집의 Q 는 다른 셋보다 44 아래, 수첩의 Q 는 16 왼쪽이었습니다.

### Q 에 맞춰 틀을 그린다

- Q 는 네 아이콘이 **한 벌**입니다: 높이 216, 알파 무게중심을 (256, 258) 에. 붓 꼬리가 아래 ·
  오른쪽으로 길게 나가 그림 상자의 가운데는 눈에 보이는 가운데보다 아래 · 오른쪽이므로, 상자
  대신 무게중심으로 맞춥니다.
- 틀은 그 Q 둘레에 같은 중심 · 비슷한 부피로 다시 그렸습니다. 집은 지붕 꼭짓점(72)부터
  바닥(440)까지의 가운데가 판의 가운데에 오고, 수첩은 **띠를 오른쪽 고무줄에서 왼쪽 제본선**으로
  옮겼습니다(Q 를 가운데에 두면 붓 꼬리가 오른쪽 띠에 닿습니다).
- 🔑 시안을 보여 드릴 때 기준선을 아이콘마다 그었더니 축소하면 안 보였습니다. **줄 전체를
  가로지르는 점선 두 줄(Q 의 위 끝 · 아래 끝)** 로 바꾸자 첫 판의 어긋남과 고친 판의 맞음이 한눈에
  보였습니다.

### 붓 획 틀 (시안 둘 가운데 오빠 선택)

- `frameStroke`: 선이 아니라 속을 판 도형을 채워, 붓 Q 처럼 세로 획은 굵고(14) 가로 · 비스듬한
  획은 가늡니다(6). 원은 디돈 O(바깥 원 - 좌우로 더 파인 안 타원), 음파는 가운데가 굵고 양 끝이
  가늘어지는 초승달 꼴입니다. 가는 획을 4.5 로 두었더니 60px 에서 집 지붕이 흐려져 6 으로
  올렸습니다.
- 🔴 첫 계산에서 집의 오른쪽 지붕이 판 밖으로 치솟았습니다. 지붕 높이를 `slope * (256 - x)` 로
  구해 오른쪽(x > 256)에서 부호가 뒤집혔습니다 → 가운데에서 떨어진 거리(절댓값)로.
- `frameLine`(고른 굵기)은 작은 판(16 · 32 · 48)과 알림 표식이 씁니다. 그 크기에서는 굵고 가는
  차이가 안 보이고 가는 획이 먼저 사라집니다.

### 안전 원 검사

maskable 을 그린 뒤 안드로이드 안전 원(반지름 40%) 밖에 먹색이 아닌 점이 있으면 생성기가
멈춥니다. 배율을 0.84 에서 1.0 으로 올린 임시 사본으로 돌려 **원은 통과, 집은 8382 점으로 멈추는**
것을 보고 판단했습니다(사본은 지웠습니다). 처음 판은 이 검사가 없어 눈으로만 봤습니다.

### 제품 쪽

아이콘 파일만 바뀌었습니다(코드 변경 없음): Q-Atelier `3fd16104` · Q-Maison `b7c4882a` ·
Q-Carnet `ff71fe2` · Q-Sonar `024a664`. `--write` 뒤 `--check` 25/25 같음.

## 제품 앱 아이콘 · 같은 붓 Q, 제품마다 금속 색과 상징 틀 · 2026-09-25

오빠 「각 제품의 PWA 아이콘 통일성 있게, 똑같이 검은 배경에 Q 만 있으면 헷갈리니까 특성을
넣어 달라」. 지금은 Q-Atelier 와 Q-Maison 이 같은 그림, Q-Carnet 은 아이콘 없음, Q-Sonar 는
Next.js 기본 삼각형이었습니다. 시안 세 방향(금속 색만 · 금속 색 + 상징 틀 · 은색 Q + 상징 틀)을
실제 크기로 그려 보여 드렸고 **「금속 색 + 상징 틀 · 네 제품 모두」** 로 정해졌습니다.

| 제품 | 금속 | 틀 |
|---|---|---|
| Q-Atelier | 은(원본 그대로) | 원(옛 아이콘의 금 고리) |
| Q-Maison | 샴페인 금 | 집 |
| Q-Carnet | 구리 | 수첩 · 고무줄 띠 |
| Q-Sonar | 강철 청 | 음파 |

### 생성기 한 곳: `tools/app-icons.mjs`

- 원본은 `source/brand/logo-dark.png`(크롬 붓 Q). 모양은 두고 명도를 금속 계단에 대응시켜 색만
  바꿉니다(감마 1.9 · 크롬의 명도 중앙값이 0.90 이라 그대로 대응시키면 금 · 구리가 옅게 나옵니다).
- 크롬 렌더러로 SVG 를 1024 에 그리고 sharp 로 줄입니다. 한 벌: 둥근 판 192 · 512, 안드로이드
  원형 오림용 192 · 512(안쪽 80% 원 안으로 0.84 배), iOS 180, 파비콘 ICO 16 · 32 · 48, 알림 표시줄
  단색 표식 96(Q-Atelier). 결과는 매번 같습니다(두 번 돌려 25/25 같음).
- 🔑 **작은 판은 크기마다 따로 그립니다.** 붓 Q 의 머리카락 획은 16px 에서 사라지므로 틀 선을 굵게,
  Q 획을 부풀립니다(feMorphology dilate). 🔴 크롬 그림을 그대로 부풀리면 dilate 가 채널마다 가장 큰
  값을 퍼뜨려 반사광이 번지고, 금 · 구리도 **거의 흰 Q** 가 됩니다(확대 실측). 부풀린 Q 는 가림막으로만
  쓰고 안을 틀과 같은 금속 결로 칠했습니다.
- 🔴 틀의 결은 `userSpaceOnUse` 로 겁니다. 기본값(objectBoundingBox)은 폭이 0 인 세로선(수첩의
  고무줄 띠)에서 계산이 안 되어 선이 통째로 사라졌습니다(시안 첫 판).
- `--write` 는 제품 public 에 쓰고 **다시 읽어 대조**, `--check` 는 쓰지 않고 대조만 하며 다르면 종료
  코드 1. 일부러 한 파일을 바꿔 24/25 · 종료 코드 1 로 잡히는 것을 보고 백업으로 되돌렸습니다.
  `extract-all.mjs` 의 만들기 · `--sync` · `--check` 에 각각 들어갔습니다.

### 🔴 Next 15 가 매니페스트 링크를 `<body>` 에 꽂는다

크롬은 `<head>` 밖의 매니페스트 링크를 무시합니다. Next 15 는 흘려보내며 그리는(동적) 화면에서
매니페스트 링크를 `<body>` 에 꽂습니다(아이콘 링크는 같은 화면에서도 `<head>`). 그 화면에서 CDP
`Page.getAppManifest` 가 빈 주소였고, **Q-Maison 운영 로그인 화면이 그 상태였습니다.** 링크가
«있다» 는 것만 보면 초록입니다. 두 제품(Q-Atelier · Q-Maison)의 layout `<head>` 에 링크를 직접
박았습니다. Next 16 인 Q-Carnet · Q-Sonar 는 처음부터 `<head>` 였습니다.

### 제품 쪽

Q-Atelier `41568ff7`(옛 그림 넷 걷음 · 서비스 워커 · 오프라인 화면 · theme_color) · Q-Maison
`f2b9babc`(홈 화면 이름 「QMS」 → 「Q-Maison」) · Q-Carnet `a36ba95`(로고를 안 올린 제조소에 제품
아이콘 · 옛 CI 아이콘 스크립트 걷음) · Q-Sonar `1ce79f1`(매니페스트 신설 · proxy 가 매니페스트를
비켜 가게). 네 제품 모두 tsc · 단위 시험 통과.

### 운영 실측 (배포 네 곳 모두 READY 뒤)

쿠키 없는 요청으로 로그인 화면의 링크 · 매니페스트 · 아이콘 여섯을 받고, 새 크롬으로 CDP
`Page.getAppManifest` · `getInstallabilityErrors` 를 불렀습니다.

| 운영 주소 | 매니페스트 링크 | 크롬이 읽은 매니페스트 | 설치 불가 사유 | 아이콘 여섯 |
|---|---|---|---|---|
| www.qatelier.co.kr · atelier.medqraft.app | `<head>` 하나 | manifest.json | 없음 | 200 · 지문 일치 |
| maison.medqraft.app | `<head>` + 본문(자동) | manifest.webmanifest (고치기 전 빈 주소) | 없음 | 200 · 지문 일치 |
| carnet.medqraft.app | `<head>` | manifest.webmanifest | 없음 | 200 · 지문 일치 |
| www.medqraft.cloud | `<head>` | manifest.webmanifest (로그인으로 안 돌려짐) | 없음 | 200 · 지문 일치 |

Q-Atelier 는 알림 표식 `badge-96.png` 200, 서비스 워커가 새 판(오프라인 캐시 `q-offline-v2`),
옛 `/icon.png` 는 404(저장소 안에서 부르는 곳 없음).

### 남은 것

- 설치한 앱은 저절로 안 바뀝니다. 아이폰은 다시 추가, 데스크톱 크롬은 아이콘 변경을 반영하지 않아
  다시 설치(web.dev 2024-09 판), 안드로이드는 크롬이 하루 한 번 매니페스트를 확인합니다. 오빠 몫은
  Q-Atelier 수동 검증 최종본 F4.
- `source/` 가 Q-Atelier HEAD 보다 20 파일 뒤처져 있습니다(오늘 다른 작업들이 올린 것 · 이 작업과
  무관). 다음 `extract-all.mjs --sync` 때 함께 따라옵니다. `source/brand` 의 아이콘 사본도 그때 새
  그림으로 바뀝니다(생성기는 `logo-dark.png` 만 읽으므로 결과에 영향 없음).

## 따라오는 머리글 · 붙을 자리를 함께 냅니다 (Q-Atelier 감사 #11 첫 덩이) · 2026-09-10

백 줄을 세로로 훑으면 머리글이 화면 밖으로 나가고, 그때부터 셋째 칸이 무엇인지
모르고 읽습니다. 세 제품이 같은 구멍을 갖고 있었습니다 · 정본 목록 CSS 에 이 장치가
하나도 없었습니다.

```css
.qd-table-scroll--tall { max-height: 70vh; overflow-y: auto; }
.qd-table--sticky thead th,
.qd-table--sticky .qd-thead .qd-th { position: sticky; top: 0; … }
```

### 🔴 «붙을 자리» 를 함께 내는 것이 이 항목의 핵심입니다

`position: sticky` 는 세로 한계가 있는 조상이 있어야 붙습니다. 감싸개에
`overflow-x: auto` 만 주면 `overflow-y` 가 auto 로 «계산»되어 그 상자가 sticky 의
기준이 되는데, 한계가 없으면 `scrollHeight == clientHeight` 라 붙을 자리가 없습니다.

Q-Forge 가 정확히 그 상태였습니다(실측 감싸개 294/294 · 그쪽 감사 #8). 그래서
정본이 `--sticky` 와 함께 `--tall` 을 냅니다. 제품이 자기 한계(`max-h-*`)를 이미
갖고 있으면 `--sticky` 만 걸면 됩니다.

⚠️ 스크롤 host 가 감싸개가 아니라 화면 전체인 제품도 있습니다(Q-Atelier 는
   `<main>` 이 host · 실측 1927/900). 그쪽은 `--tall` 없이도 붙습니다.

Q-Forge 는 오늘 오전에 제가 만든 옵트인 `.table-stick` 을 지우고 정본으로 갈음했습니다
(세 자리). 같은 말을 두 곳에서 하지 않습니다.

실측(Q-Forge `/settings/items` · 가짜 표로):

```
--sticky 걸은 표   th sticky · top 0 · 배경 rgb(20,20,20)
안 걸은 표         th static
```

### 🔴 템플릿 안의 백틱 · 오늘 세 번째

주석에 `` `position: sticky` `` 라고 적었더니 그 백틱이 `extract-list.mjs` 의 CSS
템플릿을 끊어 `SyntaxError` 가 났습니다. 아침에 같은 파일에서, 낮에
`check-hangul-live.mjs` 에서 같은 사고를 냈습니다. **생성기의 CSS·JS 본문은 통째로
템플릿 문자열입니다.**

정렬 표시(`.qd-th--sort` · `aria-sort`)는 **아직 안 넣었습니다.** 쓰는 곳이 없으면
「선언만 되고 아무도 안 읽는」 것이 됩니다 · 그 소비자는 다음 덩이에서 옵니다.

---
## 한글 어절 공백 · 훑개가 «자식의 한글» 을 제 것으로 셌습니다 (감사 #1) · 2026-09-10

정본 쪽(변수 `--qd-hangul-word-space` + 갈래 13개)은 이미 되어 있었습니다.
남은 것은 정본을 «안 쓰는» Q-Atelier 와, 검사 자체였습니다.

### 🔴 검사가 두 가지로 틀려 있었습니다

**① 자식의 한글을 제 것으로 셌습니다.** 판정을 `el.textContent` 로 하고 있어서,
Q-Forge 시계처럼 «바깥은 모노로 시각을 그리고 날짜는 본문 글꼴 자식이 그리는»
자리를 「모노에 한글이 걸렸다」고 여섯 화면에서 거짓 빨간불을 냈습니다.
자기 텍스트 노드만 이어 붙여 보게 고쳤더니 **Q-Forge 6곳 → 0곳** 이 됐습니다.
있지도 않던 결함이었습니다.

**② 세기만 하고 끝났습니다.** 보고서만 내는 검사는 수가 늘어도 초록이라 되돌아오는
것을 못 막습니다. 제품별 상한과 `process.exitCode = 1` 을 붙였습니다.

🔴 상한 판정에 «못 읽은 화면» 축을 함께 넣었습니다. 오늘 실제로 Q-Sonar 프록시
   세션이 만료돼 훑개가 **로그인 화면**에 떨어졌고, 한글 요소가 4곳뿐이라
   자간·공백이 0 으로 나왔습니다. 그것을 통과로 세면 그날부터 이 검사는 빈 그물입니다.
   세션을 되살리니 같은 자리가 1,369곳 · 공백 172곳이었습니다.

### 고친 뒤 실측 (1440x1000 · 다크 · 제품마다 6화면)

| 제품 | 한글 요소 | 자간 | 모노 어절공백 |
|---|---:|---:|---:|
| Q-Atelier | 778 | 53 | **136 → 88** |
| Q-Sonar | 1,369 | 6 | 172 |
| Q-Forge | 732 | 0 | **6 → 0** (훑개 오탐이었음) |

Q-Atelier 는 `labelWordSpacing()` 을 만들어 `labelTracking` 옆에 달았습니다(35곳).
🔑 **모노인 자리에만** 달았습니다. `word-spacing` 은 상속 속성이라 본문 글꼴 자리에
   -0.35em 을 걸면 어절이 겹칩니다. 38자리 중 셋(`Button` · `/audit` 두 곳)은
   `F.ui` 라 일부러 뺐습니다 · 개수로 밀었으면 그 셋이 망가졌을 자리입니다.

Q-Sonar 172곳은 Tailwind `font-mono` 유틸리티 자리라 정본 갈래 밖입니다.
그 저장소의 별도 항목으로 남깁니다.

### 🔴 템플릿 안의 백틱 · 오늘 두 번째

훑개를 고치면서 주석에 `` `.han` `` 이라고 적었더니 그 백틱이 `PROBE` 템플릿
문자열을 끊어 **세 제품이 전부 0곳**으로 나왔습니다. 0 이 너무 깨끗해서 바로
의심했지만, 그대로 상한을 찍었으면 영영 아무것도 안 잡는 검사가 됐습니다.
아침에 `extract-list.mjs` 에서 같은 사고를 냈습니다.

---
## 금색은 상태가 아닙니다 · 정본이 상태 톤을 엽니다 (감사 #10) · 2026-09-10

Q-Sonar 의 금색 하나가 브랜드 · 주동작 · 성공 · 경고 · 데이터속성 **다섯 뜻**을
겸하고 있었습니다. 같은 화면에서 `succeeded` 도 금색이고 「결측률 50% 이상」도
금색이었습니다. 뜻이 다섯이면 색은 아무것도 안 알려 줍니다.

정본에 둘을 열었습니다.

```css
/* nav · 차림표 알림 칸의 톤 */
.qd-rail-theme[data-tone='warning'] { … var(--qd-warn) 45% … }
.qd-rail-theme[data-tone='danger']  { … var(--qd-danger) 45% … }

/* list · 상태 판의 왼쪽 3px 세로줄 */
.qd-panel--ok  { border-left: 3px solid var(--qd-ok, …); }
.qd-panel--warn { border-left: 3px solid var(--qd-warn, …); }
.qd-panel--danger { border-left: 3px solid var(--qd-danger); }
```

### 🔴 왜 색만으로는 부족한가 · 실측

다크 판(#141414) 위에서 금색과의 색차 ΔE76 을 재면

| 짝 | ΔE76 | 판 위 대비 |
|---|---:|---:|
| 금 ↔ 성공 | 40.94 | ok 7.86 |
| 금 ↔ 막힘 | 32.84 | danger 5.74 |
| 금 ↔ **주의** | **10.37** | warn 8.22 |

성공과 막힘은 색만으로 갈리지만 **주의는 안 갈립니다.** 그 간격을 «형태»로
메웁니다 · 주의는 언제나 왼쪽 세로줄과 함께 나오고, 액센트 판에는 그 줄을
주지 않습니다.

### 🔴 값을 못 찾으면 «조용히 사라집니다»

`--qd-ok` · `--qd-warn` 은 `q-design.state.css` 가 내는데 그 파일을 **모든 제품이
받지는 않습니다**(Q-Forge 는 자기 이름을 이미 갖고 있어 안 받습니다). 값을 못 찾으면
`border-left` 와 `color` 선언이 통째로 무효가 되어 톤과 세로줄이 조용히 사라집니다.
화면이 깨지지 않고 «색만 없어지는» 꼴이라 눈에 잘 안 띕니다.

그래서 두 파일이 스스로 값을 들고 있습니다(`extract-nav` 의 Z 사다리와 같은 이유).
값은 `tokens.json` 에서 보간되므로 손으로 적는 것이 아니고 갈릴 수도 없습니다.

`docs/02-color.md` §5 에 계약을, `docs/15-navigation-canon.md` 에 `data-tone` 표를
적었습니다.

---
## 컨트롤 모서리를 정본이 내보냅니다 (2026-09-09 감사 · 주제 #13) · 2026-09-10

Q-Sonar 는 판(`.qd-panel`)이 10px 인데 그 «안»의 면 있는 부품이 전부 각졌습니다.
실측 여섯 화면에서 단추 191개 · 입력 12개 · 모달 1 · 팝오버 1 이 모두 0px 이었고,
굴린 것이 하나도 없었습니다. `docs/05-shape` 는 「10px 단일값 · 카드·버튼·입력
전부」를 규칙으로 적어 두고 있었습니다.

🔑 감사문의 「세 제품 중 Q-Sonar 만 단추가 각진다」는 **틀린 말입니다.** Q-Atelier
   도 면 있는 단추 66개 중 20개가 0px 이라 각진 단추 자체는 집안에 이미 있는
   무늬입니다. 실제 차이는 Q-Sonar 만 그것이 **100%** 라는 것입니다.

`tools/extract-list.mjs` 가 `--qd-radius-control` 을 `:root` 로 내보냅니다.

```css
--qd-radius-control: var(--qd-radius-control-src, 10px);
```

`--qd-radius-card` 와 달리 이쪽은 `:root` 에 **선언합니다.** 카드 쪽은 «선언 안 된
변수 + 폴백» 자체가 자매 테마의 스위치라 선언하는 순간 `docs/05-shape` 와
`16-list-canon` 의 계약이 바뀌지만, 컨트롤에는 그런 계약이 없습니다.
`html[data-theme='light']` 에는 넣지 않습니다 · **모서리는 테마 축이 아니라
사다리입니다.**

10 이라는 숫자는 이미 세 벌입니다(Q-Atelier `tokens.ts` · `q-design.tokens.json` ·
Q-Forge `globals.css`). 제품이 네 번째를 적지 않게 정본이 냅니다.

### 🔴 템플릿 안의 백틱

주석에 `` `--qd-radius-control-src: 0` `` 이라고 적었더니 그 백틱이 템플릿 문자열을
끊어 `SyntaxError: Invalid left-hand side expression` 이 났습니다. 이 파일의 CSS 는
통째로 템플릿 문자열이라 백틱을 반드시 벗어나야 합니다(주변 주석들이 이미 그렇게
되어 있었는데 새 줄만 빠뜨렸습니다).

실측(Q-Sonar 3405): 여섯 화면의 컨트롤 1,317개가 전부 10px · 0px 0개.
팝오버·자판 모달은 정본 판으로 옮겨 테두리가 `#333333` 에서 정본 `#242424` 로
한 단계 어두워졌습니다(정본 쪽이 맞는 값입니다). 발송 확인 모달은 `border-gold/60!`
로 금색 경고 테두리를 지켰습니다.

Q-Forge 는 같은 사본을 받지만 읽는 곳이 없어 화면이 안 바뀝니다. `check-nav.mjs`
초록 · `check-theme.mjs` 초록으로 확인했습니다.

---
## 화면 말투 정본과 검사 (2026-09-09 감사 · 주제 #12) · 2026-09-10

Q-Sonar 한 화면 «안»에서 말투가 갈렸습니다. `/targets` 는 위쪽 문단이
「…가리지 않는다.」인데 아래쪽이 「…넘어갑니다.」였습니다. 말투가 갈리면 읽는
사람은 **누가 말하고 있나**를 매번 다시 정합니다.

어느 쪽이 집안 말투인지는 세 저장소를 실측해 정했습니다.

| 저장소 | 고치기 전 | 고친 뒤 |
|---|---:|---:|
| Q-Atelier | 28곳 | 21곳 (격언 7 면제) |
| Q-Sonar | 38곳 | **0곳** |
| Q-Forge | 11곳 | 11곳 |

어긋난 쪽이 하나뿐이라 그쪽을 합니다체로 모았습니다. 나머지 둘은 이 주제 밖이라
지금 값 그대로 잠갔습니다. 상한은 `--record` 없이는 못 올라갑니다.

새 파일 넷 · `docs/21-voice-canon.md` · `tools/check-voice.mjs` ·
`tools/voice-baseline.json` · `tools/voice-allow.json`. README 165행 밑에 등록했습니다
(등록하지 않으면 아무도 안 부릅니다).

### 🔴 검사를 만들면서 오탐 넷을 실측으로 걷어냈습니다

판정은 「문장 끝이 다이고 니다가 아니면 해라체」 하나입니다. 그런데 그대로 두면
아래 넷이 거짓으로 잡힙니다. **거짓 경보를 한 번 내면 다음부터 아무도 이 검사를
안 봅니다.**

| 형태 | 잡혔던 것 | 왜 아닌가 |
|---|---|---|
| 부사 「다」 | 둘 다 | 앞이 공백입니다 |
| 조사 「마다」 | 생산 로트마다 | 종결이 아닙니다 |
| 조사 「보다」 | 서면보다 | 종결이 아닙니다 |
| 문장 안의 인용 | 걸려 「전부 죽었다」처럼 보입니다 | 「」 안은 증상을 흉내 낸 것입니다 |

줄 «끝»에 붙은 `//` 주석도 처음에는 화면 글로 셌습니다
(`factory_manage_no: …, // 대체키를 쓴다`). 따옴표 상태를 세며 걷도록 고쳤습니다 ·
`https://` 를 통째로 지우지 않기 위해서입니다.

### 🔴 카피 «키 목록» 을 두면 이름을 안 맞춘 자리가 조용히 빠집니다

처음에는 `why · sub · label · note · hint · impact …` 열 개를 적어 두고 그 키의
값만 봤습니다. 그런데 Q-Sonar `lib/diagnostics/mfds-probe.ts` 의 `IMPACT` 는 키
이름이 달라 **통째로 빠졌습니다.** 그것은 `/diagnostics` 화면에 그대로 그려지는
글입니다. 이름으로 고르는 대신 «한글이 든 문자열» 이면 다 보게 바꿨더니 그 넷이
들어왔습니다.

자기 검출력 시험을 네 묶음으로 둡니다. 하나라도 안 맞으면 아무것도 재지 않고
exit 2 로 죽습니다. 실제로 `endsWith('니다')` 한 줄을 망가뜨려 시험이 죽는 것을
확인했고, Q-Sonar 문장 하나를 해라체로 되돌려 상한 초과로 exit 1 이 나는 것도
확인한 뒤 되돌렸습니다.

---
## 「다 뽑았나」를 명령으로 답하게 · Q 계열 색 통일 (2026-09-10)

> 「디자인 추출은 일단 다 된건지를 계속 물어보는중임 / 나한테 거짓으로 말하지 말고」

### 🔴 제 답이 틀렸던 이유부터

「다 뽑았다」고 답할 때 쓴 기준에 `source/` 를 넣고 있었습니다. `source/` 는 원본의
**사본**이라 원본 파일이 자기 자신을 증명합니다. 무엇을 넣어도 100% 가 나오는 자였습니다.
`dist/` 만 기준으로 값을 다시 세니 실제로 빠진 것이 있었습니다.

### 사본이 «멈춰» 있었다

Q-Atelier 에서 AA 로 고친 상태색이 `source/` 가 낡은 탓에 dist 에 안 실려
**Q-Sonar·Q-Forge 가 미달 회색(3.46)을 하루 넘게** 쓰고 있었습니다.
어긋남이 아니라 «낡은 것에서 정확히 파생된 초록불» 이라 어떤 검사도 잡을 수 없었습니다.

- `tools/refresh-source.mjs` 신설. 원본의 **HEAD** 에서 80개를 받아옵니다. 추출 **맨 앞** 단계
- `tools/contrast-table.mjs` 가 `docs/02` 에 **직접 씁니다**. 종전엔 화면에 내기만 해서,
  붙이는 사람이 없으니 문서가 옛 값 일곱 개를 들고 있었습니다
- `tools/audit-coverage.mjs` 에 ⑦축 «제품별 색 커버리지». 이제 `extract-all --check` 한 줄로 답합니다
- `extract-brief.mjs` 가 대외 문서 토큰 **7개를 조용히 빠뜨리고** 있었습니다(의미색 배경 넷·그림자 둘).
  전수 훑는 «빠짐 없음» 검사를 넣었고, 면제 목록이 낡았는지도 함께 봅니다

### Q 계열 색 통일

세 제품이 같은 `#b8935a` 를 기준으로 **각자 금색 계단을 따로 발명**하고 있었습니다.

- `tools/extract-ramp.mjs` · 샴페인 계단 9칸.
  🔑 **발명하지 않았습니다.** 명도 균등 계단 세 가지를 재 보니 실제 값과 평균 dE 4.2 ·
  최대 14.8. 그런 계단으로 모으면 통일이 아니라 재디자인입니다. 이미 쓰는 값에서 골라 dE 1.3
- `tools/converge.mjs` · dE<6 은 정본으로 **모으고**, dE>=6 은 **정본이 배웁니다**(`--adopt`).
  그래서 **보이는 디자인을 안 바꾸고** 정본 밖이 0 이 됐습니다
- `dist/q-design.family.css` 18칸. 정본에 의미색 «글자» 만 있고 뒤에 까는 «면» 이 없어서
  Q-Forge 가 혼자 만들어 쓰고 있었습니다. 같은 빈칸을 같은 날 대외 문서 브랜드에서도 찾았습니다

### 걸려 넘어진 것

- **브랜드를 안 가려** Q-Sonar 금색이 MedQraft 문서 금색(`#d6b56d`)으로 갈 뻔했습니다
- **거리만 보고 역할을 안 봐서** 브랜드 금색이 위험도 색(`--risk-high`)으로 갈 뻔했습니다
- 고아로 잡힌 `audit-page.tsx` 를 지울 뻔했는데 `extract-screen.mjs` 가 **읽는 파일**이었습니다
- 🔴 **Turbopack 이 HMR 로 끼워 넣은 인라인 style 이 옛 값을 듭니다.** 파일과 청크는 새 값인데
  화면만 안 바뀐 것처럼 보였습니다. href 없는 시트를 `disabled=true` 로 끄면 진짜가 보입니다

### 결과

```
제품              정의   담김   빠짐   범위
Q-Atelier         80     80      0   정본
Q-Sonar           14     14      0   정본   (15 → 14)
Q-Forge           53     53      0   정본   (65 → 53, 사본 열둘 소멸)
MedQraft 문서      29     29      0   정본
MedQraft 홈       18      1     17   정본 밖 (Q 계열 아님)
```

⚠️ 남겨 둔 사실: MedQraft 홈 19색은 문서 브랜드보다 **Q-Atelier 쪽에 더 가깝습니다**
(문서 0 : Q 19). 홈페이지 브랜드를 정할 때 쓸 숫자입니다.

커밋 `fd11426` `43a1603` `fc33d02` `7a7dae6`

---
