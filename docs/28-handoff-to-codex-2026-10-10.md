# 코덱스 인계: Q-Design 작업 현황과 판단 (2026-10-10)

오너 결정: 앞으로 프로그램의 디자인 작업은 코덱스에게 맡긴다. 이 문서는 지금까지의 판단, 이미 끝난 것, 남은 것, 지켜야 할 규칙, 함정을 한곳에 모은 인계서다. 클로드는 구현과 검증 쪽에서 계속 돕는다.

## 1. 한 줄 요약

네 제품(Q-Atelier, Q-Maison, Q-Carnet, Q-Sonar)을 "떠 있는 섬" 모양에서 "장부형"으로 바꾸는 중이다. 기초 층(조작 윤곽, 구역 제목 글자 단계)은 네 제품에 반영해 푸시까지 끝났다. 다음 일은 "모든 부품을 규칙으로 정리하고 Q-Design 정본과 잇는 기록부"다. 이 기록부 작업은 시작 직전에 멈췄다.

## 2. 방향 (코덱스와 3차까지 합의한 것)

- 상자와 그림자를 걷고 괘선과 면 차이로 구분한다. 모서리 10px, 유리 효과 없음, 상태는 점 + 글자.
- 핵심 동작은 항상 보이고 보조 동작만 호버에서 나타난다. 폰에는 호버가 없으니 줄을 누르면 상세로 간다.
- 연속 검토는 목록 + 상세를 나란히 놓는다(코덱스의 context-review 구조).
- 폰은 상태 줄 아래 머리줄에 메뉴를 붙이고, 번호와 제목이 고정된 머리, 탭 대신 쌓기, 하단 고정 바, 터치 44px 이상.
- 정본 시안: `preview/final-plan.md`, `preview/pages-proposal-v3-*.png`, `preview/phones-proposal-v3-*.png`.
- 🔴 선택 표시에 왼쪽 강조선을 쓰지 않는다(2026-09-27 오너 금지, 가드 `no-side-accent`). 선택은 면 색 + 굵은 제목.
- 웹 디자인 금지 목록(보라 그라데이션, 글래스모피즘, eyebrow/pill, Inter/Geist, 카드 속 카드, 한글 명조)은 어떤 스킬 기본값보다 위다.

## 3. 이미 끝난 것 (모두 푸시됨, 롤백 태그 `rollback-2026-10-10-before-ledger`)

### 3-1. 조작 윤곽 `--qa-ctl`
- 입력 칸, 보조 단추, 아이콘 단추, 목록 쪽 이동, 거르개 칸, 토글 꺼짐 상태의 테두리를 구분선 색(대비 1.2 ~ 1.3)에서 조작 윤곽 색으로 바꿨다. 값은 다크 `#7a7364`, 라이트 `#8c8575`, 인쇄 `#7a7568`이고 배경과 3:1 이상이다(WCAG 1.4.11).
- 행과 구역 구분선(`--qa-border`, `--qa-borderHi`)은 장식이라 그대로다. 두 층을 섞지 않는다.
- 값은 `tokens.ts`에 넣지 않는다(요구사항 엔진 검증 근거라 건드리면 안 됨). `app/globals.css`와 `lib/design/grain.ts`의 `CTL`에 둔다.
- 가드: Q-Atelier `lib/design/control-outline-contrast.test.ts`. 한계: 변수 이름이 정해진 스타일만 잡고 인라인 테두리나 `borderColor` 덮어쓰기는 못 잡는다. 코덱스 검토로 놓친 세 곳(결정 사유, 검토 메모, 현장 선택 단추)은 고쳤다.
- Q-Maison은 `html.dark`로 테마를 가르므로 `--qd-ctl-src`를 `app/globals.css`에 이어야 한다(이어 둠). Q-Carnet은 `data-theme`라 자동.

### 3-2. 구역 제목 글자 단계 C안 (오너 선택)
- 구역 제목 16px 굵게 본문색, 앞에 금색 모노 번호(01, 02 ...). 번호는 CSS 카운터 `.qa-sec-t::before`가 붙이고, 화면(main)과 팝업 창(dialog) 안에서 새로 센다.
- 부품 네 곳이 `SECTION_TITLE` 한 벌을 쓴다(`lib/design/components.tsx`): SectionTitle, SectionTitleInfo, Section, FormSection.
- 가드: `lib/design/section-title-contract.test.ts`. 정본 추출기 `tools/extract-screen.mjs`의 구역 이름 규칙도 새 규격으로 바꿨다.
- 비교 시안: `preview/type-proposal-dark.png`, `preview/type-proposal-light.png`(A 지금, B 큰 제목, C 중간안).
- 알려진 미결: 한 화면에 구역이 많으면 번호가 15번대까지 간다. 거슬리면 "구역 제목이 3개 이상인 화면에만 번호"로 줄일 수 있다.

### 3-3. 아이콘
- 네 제품 모두 완성 그림이고 판 번호 `?v=4`. Q-Sonar는 코덱스 시안 A(왼쪽 신호 호 두 겹).
- 생성기 `tools/app-icons.mjs` 한 곳. 그림을 바꾸면 `ICON_VERSION`(?v=)을 올린다. `source/brand/app-icon-*.webp`는 Q-Design이 원본이다.

### 3-4. Q-Sonar 묶음 해제
- 2026-09-28의 "Q-Sonar는 화면 정본 동기화를 받지 않는다(보조 글씨 12px 규칙 제외)" 결정을 오너가 2026-10-10에 풀었다(`tools/sync-parts.mjs`의 `HOLD`를 비움). 이제 네 제품이 같은 화면 정본을 받는다. Q-Sonar 쪽 확인은 시험(642건)만 했고 화면은 안 봤다. 작은 글씨 표 화면을 봐야 한다.

## 4. 작업 순서와 도구 (어기면 조용히 어긋남)

1. **원본은 Q-Atelier에서 고친다.** Q-Design의 `source/`는 Q-Atelier HEAD의 사본이라 직접 고치지 않는다.
2. Q-Atelier에서 커밋한다.
3. `cd D:\Claude\Q-Design && node tools/extract-all.mjs --sync`로 정본(토큰, 차림표, 목록, 화면 뼈대, 인쇄)을 다시 뽑고 Maison, Carnet, Sonar에 사본을 보낸다. 추출기에는 "원본 뜻 점검" 정규식이 있어 원본 문구를 바꾸면 `extract-list.mjs`, `extract-screen.mjs`도 같이 고쳐야 한다.
4. 사본이 안 갔으면 `node tools/sync.mjs --write`.
5. 각 제품에서 시험을 돌린다. Q-Atelier와 Q-Maison, Q-Sonar는 `npx vitest run`, Q-Carnet은 `npm test`.
6. `source/brand/app-icon-*.webp`가 sync 뒤에 지워졌는지 `git status`로 본다(고아 삭제 결함은 고침).
7. 푸시 전에 오너 확인. 🔴 Q-Atelier, Q-Maison, Q-Carnet은 main 푸시가 곧 운영 배포다. 푸시 직전 커밋에 롤백 태그를 달았다.
8. 줄바꿈: 저장소 설정이 CRLF라 `git stash pop`이나 파일 재작성 뒤 지문(sha) 검사가 깨질 수 있다. 깨지면 `sync --write`를 다시 돌린다.

## 5. 지켜야 할 규칙 (오너 확정)

- 화면 표기는 한글. 영어는 규제 약어, 표준 번호, 제품명처럼 꼭 필요할 때만.
- 긴 줄표(U+2014) 금지. 대화, 코드, 콘텐츠 전부. 검사는 파이썬 문자 스캔으로 커밋 직전에. 예외는 v8 문서 부록의 장 번호 칸 한 자리.
- 화면 문구는 업무 용어로. "걸음", "칸" 같은 지어낸 말 금지.
- 단추는 공용 부품(Btn, ChoiceChip, In, FilterChip, TextAction)을 쓴다. `<button style>`을 손으로 짜지 않는다. 가드 `shared-controls-contract.test.ts`.
- 설명 글귀는 세 층(화면 머리, 구역, 칸)의 ⓘ 팝업 안으로. 본문을 밀어내는 안내 금지. 가드 `explanation-text-contract`.
- 보조 동작(뒤로, 닫기, 더 보기)은 글귀만, 주 동작만 상자 단추.
- 운영진 화면은 폰으로도 즉시 관리 가능해야 한다(412, 375 폭, 터치 44px, 표는 폰에서 카드 줄, 구역이 셋 이상이면 쭉 쌓지 말고 구역 탭).
- 왼쪽 강조선 금지. 모서리는 예외 없이 통일(10).
- 푸시 전 repo 공개 여부는 비인증 API로 실측한다.
- 새 기능을 만들 때 같은 사실을 두 곳에 손으로 적지 않는다(사본은 어긋난다). 값을 맞추지 말고 사본을 없앤다.

## 6. 오너가 방금 정한 다음 일: 모든 부품을 규칙으로 정리하고 Q-Design과 잇기

오너 요지: "큐 디자인 시스템이 모든 디자인 요소를 뿌리지 못하고 있다. Q-Atelier, Q-Maison, Q-Carnet의 모든 컴포넌트를 규칙으로 정리하고 Q-Design과 연동해야 한다." 선택지에서 1번 "기록부 먼저"를 골랐다(코드 변경 없는 전수 기록, 그다음 단계적으로 정본 승격).

### 현황 측정 (클로드가 센 대략치)
- Q-Atelier 공용 부품 76개(`lib/design/components.tsx` 내보내기). 정본이 CSS로 쥐는 부류는 약 27개 계열(`qd-avatar, btn, empty, field, filter, grid, input, kpi, label, main, nav, page, pager, panel, rail, row, section, shell, stat, state, tab, tabs, table, tag, workspace`)이다. 모달, 서랍, 데이터 표, 진행 링, 단계 타임라인, 툴팁, 알림 등은 정본에 규칙이 없고 제품 코드에만 있다.
- Q-Atelier `components/`에는 업무 패널까지 합쳐 191개 파일이 있다. 공용 성격(Avatar, BackButton, Coachmark, Confirm, DangerZone, FilePickButton, ListPager, ListToolbar, MemberPicker, PageTabs, Sidebar, Skeleton, TextAction, Toast, TopProgressBar 등)과 업무 성격을 가르는 일이 먼저다.
- Q-Maison 공용 부품은 `components/ui`(shadcn 기반 18개)와 `components/shared`(50여 개). Q-Carnet은 `components/` 평면 36개 파일(Table, Dialog, Shell, Ui 묶음 포함).
- 세 제품이 같은 역할의 부품을 각자 만들었다. 예: 빈 상태(EmptyState / EmptyState / Empty), 모달(Modal / Dialog / Dialog), 표(DataTable / SortHeader 계열 / Table), 상태 배지(Tag / Badge / Tag), 진행(ProgressBar, StepProgress, Progress), 페이지 머리(PageHd / PageHead / PageShell), 거르개 줄(ListToolbar / ListSearch + ListFilterSelect / FilterBar), 쪽 이동(ListPager / ListPagination / 없음).

### 제안한 기록부 구조
1. 범위 정의: "공용 부품"은 업무 화면 없이 여러 화면에서 쓰는 부품. 업무 패널은 개수만 센다.
2. 역할표: 역할 한 줄마다 세 제품의 구현 부품, 정본 상태(CSS 정본 / 패턴 / 없음 / 제품만), 어긋남 메모를 적는다. 역할은 단추, 입력, 선택, 문장 입력, 체크와 토글, 칩, 태그와 배지, 구역 제목, 머리, 탭, 표, 목록 도구, 쪽 이동, 모달, 서랍, 알림과 토스트, 빈 상태, 로딩, 진행, 툴팁과 ⓘ, 지표, 카드 줄, 폼 구역, 단계 표시 등으로 시작한다.
3. 자동 확인 도구: `tools/`에 기록부 도구를 두어 (a) 표에 적힌 부품이 실제로 있는지, (b) 공용 폴더에 표에 없는 새 부품이 생겼는지를 잡는다. 목록은 손으로 쓰고 존재와 누락은 기계가 본다.
4. 산출물: `docs/29-component-registry.md`(표)와 JSON 사본, 그리고 새 공용 부품이 표 없이 늘지 않게 하는 가드.
5. 그다음 단계(오너와 따로 정함): 모달, 서랍, 표 같은 핵심 부품부터 정본 CSS로 승격. 세 제품 모양이 바뀌어 운영 영향이 있으니 로컬 확인 뒤 푸시 확인을 받는다.

## 7. 별건: 연구 화면 "문서 작업" 정돈 (로컬 커밋, 푸시 전)

Q-Atelier 커밋 `d24e6f36`. 화면 `app/(app)/research/[code]/page.tsx` 07 "문서 작업"과 08 "맞춤 요구사항"은 같은 구역(08은 07 안 요약 카드의 제목)이라 하나로 합쳤고 네 수치 풀이는 07 제목 ⓘ로 옮겼다. 단계를 눌러도 문서가 안 뜨던 원인은 (1) R&D 직무에서 "R&D 작성 문서만"이 기본 켜져 임상, 허가 신청, 시판 후 단계가 0건, (2) 허가 완료와 보관 단계는 정해진 문서가 없음, (3) 필요 문서 구역이 접혀 있고 로드맵에서 멀어 눌러도 변화가 안 보임이다. 제외된 문서는 두 종류다: R&D 필터가 가린 RA, QA 문서와, 어느 단계에도 속하지 않아 "전체"에서만 보이는 6종(change_assessment, device_master_record, medical_device_file, process_validation, packaging_validation, shelf_life_study). 목록 위에 "표시 N건 · 함께 보기" 줄과 빈 결과 안내를 넣었다.
- 오너 결정 대기: 06 "R&D 핵심 문서"와 07이 R&D 직무에게 같은 문서를 두 번 보여 주는 중복을 합칠지(스크롤이 가장 많이 줄지만 화면 구성이 바뀜).

## 8. 함정 메모

- Windows 제외 포트 3345~3444, 3897~4596이라 개발 서버 3400~3411이 안 열린다. 로컬 확인은 포트 3600(`.claude/launch.json`의 `qatelier-dev`)을 쓴다.
- 개발 서버는 `.env.local`이 운영 DB를 가리키면 가드가 막는다. 로컬 DB(`supabase_*_qatelier-cloud` 컨테이너, `npx supabase status -o json`)에 붙이려면 `.env.development.local`을 만든다(깃 무시). 끝나면 지운다.
- 머리 없는 크롬 캡처는 한 Bash 호출에 한 장만 저장되는 경우가 있다. 호출을 나눈다.
- `source/screens`와 `source/components`는 Q-Atelier HEAD의 사본이라 Q-Atelier 변경을 커밋한 뒤에 뽑아야 반영된다.
- Q-Atelier 소스 파일은 `readFileSync`로 소스를 검사하는 새 시험을 만들면 공용 읽기(`@/lib/test-utils/contract-source`의 `readSource`)를 써야 한다. 안 쓰면 위생 시험이 빨개진다. CSS 원문은 `'raw'`로 읽고 같은 줄 끝에 `// 이유`를 적는다.
- `tokens.ts`와 잠금 파일은 엔진 검증 근거다. 바꾸면 엔진 식별값이 바뀐다.
- 정본 CSS를 바꿀 때 제품별 연결 변수(`--qd-*-src`)가 빠지면 Maison에서 라이트 화면이 다크 값으로 샌다. 동기화 시험이 잡아 준다.

## 9. 현재 저장소 상태 (2026-10-10 기준)

- Q-Atelier main: 구역 제목 C안까지 푸시됨. 이후 로컬 커밋 `d24e6f36`(문서 작업 정돈)만 푸시 전.
- Q-Maison, Q-Carnet, Q-Sonar: 정본 동기화까지 푸시됨.
- Q-Design: 정본 갱신과 Sonar 묶음 해제까지 푸시됨. 이 인계서와, 코덱스가 만든 미커밋 파일(`docs/27-context-review-prototype.md`, `preview/context-review.*`, `README.md` 수정 등)은 별도.
- 롤백 태그: 다섯 저장소에 `rollback-2026-10-10-before-ledger`.
- 개발 서버는 모두 닫힘.

## 10. 코덱스가 이어서 하면 좋은 순서

1. 6절의 기록부(역할표 + 도구 + 가드)를 설계한다. 클로드가 도구 구현과 시험, 정본 반영을 맡는다.
2. 기록부의 "정본 없음" 항목 중 영향이 큰 것(모달, 서랍, 표, 툴팁, 알림, 진행)부터 장부형 규칙으로 시안을 낸다. 시안은 실제 화면 폭(데스크톱과 폰 412, 375)과 다크, 라이트 둘 다 확인한다.
3. 7절 06과 07 중복 합침을 오너에게 선택지로 묻는다.
4. 구역 번호 노출 범위(전부 vs 구역 3개 이상)를 오너가 정하게 한다.
