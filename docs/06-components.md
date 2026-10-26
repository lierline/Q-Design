# 6장 · 부품

이 장은 세 제품(Q-Atelier · Q-Maison · Q-Carnet)이 함께 쓰는 부품의 원본 자리, 공용 치수와 상태, 제품이 따로 지키는 동작을 정합니다.
역할마다 세 제품의 실제 구현을 한 표(역할별 등록부)에 적고, 부품을 바꿀 때 어느 파일을 고쳐 어떻게 내보내는지도 정합니다.
색 · 글자 · 간격 · 모양과 움직임의 토큰은 2~5장, 화면을 짜는 법은 [07-screens.md](07-screens.md) 가 정합니다.

합친 옛 문서: 06 컴포넌트 · 07 전역 CSS(부록) · 29 공용 컴포넌트 역할표 · 30 컴포넌트 규칙과 연동

---

## 원본과 책임

부품의 겉모습은 Q-Design 한 곳에서 바꾸고, 권한 · 계산 · 검증 · 조회 · 저장 · 결재는 각 제품이 지킵니다.
규칙을 등록한 것, 소스에 연결한 것, 실제 화면에서 확인한 것은 서로 다른 증거입니다.

| 대상 | 고칠 원본 | 제품이 받는 것 |
| --- | --- | --- |
| 공용 부품의 치수 · 글자 · 모서리 · 표면 · 상태 · 움직임 | [patterns/components.css](../patterns/components.css) | 각 제품의 `app/q-design.components.css` |
| 로그인 · 배경 · 전역 글자 · 공통 화면 기반 | [patterns/foundation.css](../patterns/foundation.css), [제품별 기반 규칙](../patterns/foundation/) | 각 제품의 `app/q-design.foundation.css` |
| 아뜰리에 인라인 스타일의 값 | [atelier-values.css](../patterns/foundation/atelier-values.css), [atelier-core-values.css](../patterns/foundation/atelier-core-values.css). 원래 자리는 [제품 연결 기록](../source/style-adapters/)에 있습니다 | 기반 CSS 의 `--qd-atelier-*` · `--qd-tag-*` 변수 |
| Maison 유틸리티 스케일 | [maison-tailwind.ts](../patterns/foundation/maison-tailwind.ts) | `lib/design/q-design-tailwind.ts`. 제품 설정은 이 preset 을 가져옵니다 |
| Maison 인쇄 · 문서 · QR · 엑셀 외형 | [maison-print.ts](../patterns/foundation/maison-print.ts), [maison-print-styles.tsx](../patterns/foundation/maison-print-styles.tsx) | `lib/design/q-design-print.ts`(`qdPrint`) · `components/print/print-styles.tsx` |
| 공통 화면 팔레트 | [patterns/palette-overrides.json](../patterns/palette-overrides.json) | 각 제품의 `app/q-design.palette.css` |
| 팔레트 변수 · 테마 · 예외 연결 | [patterns/palette-mappings.json](../patterns/palette-mappings.json) | Atelier `--qa-*`, Maison HSL 채널, Carnet `--dhr-*` |
| 업무 화면 조합 | [patterns/workspace.css](../patterns/workspace.css) | 각 제품의 `app/q-design.workspace.css` |
| 차림표 · 목록 · 화면 뼈대 | 커밋된 제품 원본에서 추출기가 뽑습니다 | `q-design.nav.css`, `q-design.list.css`, `q-design.screen.css` |
| 기본 UI 구현(마크업 · 접근성 · 입력 부품) | [patterns/component-implementations/](../patterns/component-implementations/) | 제품의 구현 파일 32개(아래 «구현 정본») |
| 규칙 계열 | [source/component-rules.json](../source/component-rules.json) | 부품 분류와 검토 기준 |
| 공용 부품 역할과 예외 | [source/component-roles.json](../source/component-roles.json) | 이 장의 «역할별 등록부» |
| 역할 등록이 필요한 공개 API 범위 | [source/component-public-api.json](../source/component-public-api.json) | 새 공개 부품의 등록 기준 |
| 내보내는 조각과 목적지 | [tools/sync-parts.mjs](../tools/sync-parts.mjs) | 원본 지문을 단 제품 사본과 판 파일 |
| 제품의 데이터와 동작 | 제품 저장소의 부품과 업무 코드 | 기존 API, native 컨트롤, 라우팅과 업무 상태 |

공용 부품의 치수와 상태를 바꿀 때는 `patterns/components.css` 를 고칩니다. 공통 화면 색은 `patterns/palette-overrides.json` 의 `shared.dark` 와 `shared.light` 를 고칩니다. 제품에 생긴 사본과 생성 CSS 는 손으로 고치지 않습니다.

`source/components`, `source/screens`, `source/tokens` 는 Q-Atelier 커밋에서 가져오는 사본이라 새 원본으로 고치지 않습니다. `dist/q-design.tokens.css` 와 `dist/q-design.tokens.json` 은 팔레트 기준값을 뽑은 생성물입니다. 팔레트 생성기는 이 기준값에 Q-Design 의 override 와 제품 매핑을 얹으므로, 원본을 다시 뽑아도 중앙 색 변경이 남습니다. 엔진 검증 근거인 잠금 파일은 스타일을 바꾸는 수단으로 쓰지 않습니다. 제품 `tokens.ts` 는 2026-10-26 에 엔진과 떼어(Q-Atelier f5d7d14a) 고쳐도 엔진 근거가 바뀌지 않습니다. 변수 대응과 예외는 [02-color.md](02-color.md) 를 따릅니다.

제품은 기존 테마를 `--qd-*-src` 에 연결합니다. Maison 의 HSL 상태색과 Carnet 의 테마 변수처럼 표현이 달라도 공용 부품은 `--qd-text`, `--qd-surface`, `--qd-ctl` 같은 역할 이름을 씁니다. 이 연결부를 고정색으로 덮으면 중앙 변경이 끊깁니다.

Maison 의 기존 Tailwind `brand`, `status`, `severity` 23색도 생성된 `--qw-legacy-*` HSL 채널을 받습니다. 기존 이름, 원본 테마의 뜻과 `/15` 같은 투명도는 그대로입니다. Carnet 의 제조사 맞춤 강조색은 제품이 계산한 `--qd-company-brand*` 가 먼저이고, 기본 제조사색은 중앙 팔레트를 받습니다. 생성 팔레트의 공통 색 변경은 화면에 적용하고, 인쇄와 Carnet 기록서의 별도 팔레트는 지킵니다. Maison 의 호환 변수는 인쇄에서도 쓰이도록 기존 기준값을 따로 냅니다.

제품 폴더는 Atelier 가 `D:/Claude/Q-Atelier`, Maison 이 `D:/Claude/Q-Works`, Carnet 이 `D:/Claude/DHR` 입니다. 내보내기 명령에서 Carnet 의 키는 옛 이름 `Q-Forge` 입니다.

---

## 공용 규칙

| 항목 | 기준 |
| --- | --- |
| 바깥 모서리 | 카드 · 버튼 · 입력 · 팝오버 · 대화상자 10px. `--qd-radius` 를 씁니다(오너 결정 2026-09-24). |
| 제목 | 구역 제목은 C안: 16px 본문색 굵은 글자와 금색 모노 번호(오너 결정 2026-10-10). 대화상자 제목 18px, 화면 제목의 공용 기준 22px. |
| 글자 | 본문 14px, 보조 글자 12px, 일반 조작 글자 13px. 인쇄 규칙과 구분합니다. 보조 글자 최소 12px 의 근거는 [03-typography.md](03-typography.md) 에 있습니다. |
| 조작 영역 | 기본 44px. 조밀한 데스크톱 버튼은 36px 변형을 쓸 수 있고, 거친 포인터에서는 44px 를 확보합니다. 아이콘 · 닫기 · 달력 날짜 · 체크의 누르는 자리는 44px 가 기준입니다. |
| 현장 조작 예외 | Carnet `.touch` 의 장갑 조작은 56px 이상을 지킵니다. 관리 화면의 44px 규칙으로 줄이지 않습니다. |
| 체크 표시 예외 | native 입력의 44px 누르는 자리 안에 16px 표시를 둡니다. 표시의 4px 반경은 작은 기호의 예외이며 일반 조작부 반경을 바꾸지 않습니다. |
| 작은 표시 예외 | Maison 의 비조작 배지 · 도식 표지는 6px 를 지킵니다. 높이 14px 인 달력 일정 막대 두 곳은 그 범위에 한해 6px 예외이고, `choice-chip-shape.test.ts` 가 새 조작부에 예외가 들어오는 것을 막습니다. |
| 윤곽 | 조작 윤곽 `--qa-ctl` · `CTL` 과 이를 받는 `--qd-ctl` 은 구분선과 별개입니다. 조작부와 바탕의 3:1 대비를 지킵니다. |
| 선택 상태 | 옅은 면과 굵은 글자로 나타냅니다. 주 행동 버튼의 반전 면과 역할을 구분합니다. |
| 표면과 설명 | 모달 · 서랍 · 팝오버는 불투명 면입니다. 유리 효과와 왼쪽 강조선을 쓰지 않습니다. 일반 설명은 정보 팝오버, 조치가 필요한 오류는 화면에 남는 안내로 둡니다. |
| 보조 행동 | 돌아가기 · 닫기 · 더 보기 · 수정은 뜻에 맞는 글자 행동을 씁니다. 아이콘만 두면 접근 가능한 이름을 줍니다. |
| 움직임 | 빠른 상태 변화 160ms, 일반 전환 200ms 와 중앙 이징을 씁니다. 동작 줄이기 설정에서 반복 로딩 · 오버레이 전환을 줄입니다. |

표의 숫자는 공용 토큰의 지금 기본값입니다. 화면 안에 같은 숫자를 다시 적지 말고 토큰이나 공용 클래스를 씁니다. 날짜 격자의 7열, 숫자판의 배열, 인쇄 표의 치수처럼 역할상 고정 구조가 필요한 곳은 따로 등록합니다.

---

## 제품 어댑터가 지키는 동작

Atelier 의 React 부품, Maison 의 CVA · Radix 래퍼, Carnet 의 native HTML 과 현장 조합을 하나의 React API 로 바꾸지 않습니다. 같은 역할의 외형을 중앙 규칙에 연결합니다. Maison `Dialog` 의 초점 가두기와 Escape, `Checkbox` 의 native 폼 전송, `Combobox` 의 검색 · 키보드 이동, 달력의 날짜 계산은 그 제품이 지킵니다.

Maison `Sheet` 의 열리는 방향은 제품 어댑터가 정합니다. 어느 방향이든 높이를 동적 뷰포트 안으로 제한하고 긴 내용은 서랍 안에서 스크롤합니다. 내용이 많은 위 · 아래 서랍도 화면 밖에 남지 않아야 합니다.

배지 · 표 · 탭 · 화면 머리와 함께 대화상자, 서랍, 툴팁, 알림, 진행, 스켈레톤, 카드, 선택, 달력, 체크 표시에 공용 클래스를 줍니다. 제품별 적용 자리와 남은 차이는 아래 «역할별 등록부» 에서 봅니다. 전용 숫자판, 문서 변경 비교, 계층 트리 같은 업무 조합은 공용 토큰을 받더라도 제품 전용 책임입니다.

Maison 의 19개 `components/ui` 파일은 공개 렌더 부품을 등록부에 넣습니다. `DialogTrigger`, `DialogClose`, `DialogPortal`, `DialogOverlay` 처럼 자체 JSX 가 없는 라이브러리 어댑터도 빠뜨리지 않습니다. 금액 입력처럼 `Input` 을 감싸는 부품은 간접 연결로 확인합니다. 함수 이름만 보고 공용 외형을 쓴다고 단정하지 않습니다.

로그인, 배경, 셸, 전역 글자와 간격은 공용 기반과 제품별 recipe 가 함께 맡습니다. Maison 의 `globals.css` 는 가져오기와 Tailwind 지시문만 두고, Tailwind 설정은 중앙 preset 을 읽습니다. 표준 유틸리티가 중앙 설정을 받는다는 것과 화면마다의 임의 값까지 검토했다는 것은 다른 사실입니다.

Maison 의 화면 작은 글자는 공용 보조 글자 규칙에 연결하고, 업무 트리의 깊이는 데이터로 두되 들여쓰기 단위는 중앙 변수로 받습니다. 인쇄 · 문서 외형은 mm · pt 값 그대로 `qdPrint` 와 공용 인쇄 소스에 있습니다. 종이 규격, 내용에 따른 표 폭, 쪽 나눔 계산과 QR 인코딩은 별도 역할이며, 색 · 글꼴 · 간격 전체를 예외로 두는 근거가 아닙니다.

---

## 구현 정본

### 기본 UI 구현

검토한 기본 UI 구현 32개 파일은 `patterns/component-implementations/` 가 정본입니다.

| 제품 | 파일 수 | 범위 |
| --- | ---: | --- |
| Q-Atelier | 5 | 기본 부품(`lib/design/components.tsx`) · 선택(`segmented-choice.tsx`) · 한글 표시(`hangul-text.tsx`) · 알림(`Toast.tsx`) · 로딩 묶음(`Skeleton.tsx`) |
| Q-Maison | 22 | `components/ui` 19개, 공용 화면 로딩 묶음 · 선택 상자 · 체크 칩(`components/shared` 3개) |
| Q-Carnet | 5 | 기본 UI · 표 · 대화상자 · 알림 · 행 링크 |

범위는 [patterns/component-implementations.json](../patterns/component-implementations.json), 실제 공개 내보내기와 제품 연결은 [dist/q-design.component-implementations.json](../dist/q-design.component-implementations.json) 에서 봅니다. 값 내보내기 172개와 타입 내보내기 12개는 부품뿐 아니라 보조 함수 · 타입을 포함합니다. Skeleton 의 다섯 부속 렌더러는 따로 적습니다.

제품 사본의 본문 전체를 정본과 대조하며, 새 Maison UI 파일, 목록 밖 정본 파일과 검토하지 않은 재내보내기를 거부합니다. 생성 전에 모든 정본 구문과 고른 대상 경로를 확인해 앞 제품만 먼저 고쳐지는 것을 막습니다. 문구 교정도 이 범위에서는 정본을 고친 뒤 생성으로 제품에 보냅니다. 기존 `lib/design` 제외를 풀 때는 명시한 세 UI 파일만 더하고 검증 엔진 · 토큰 원문은 뺍니다.

가족 전체의 외형은 공통 CSS · 팔레트 · 표시 인자를 고칩니다. 제품별 마크업 · 접근성 · 입력 부품 구현을 바꿀 때는 그 구현 정본을 고칩니다. 업무 데이터, 콜백, 기기 설정, 호출부의 `style` · `className` 과 외부 도메인 라벨은 별도 입력입니다. 구현 파일을 정본이 가진다고 해서 분류되지 않은 표시 인자나 모든 화면 상태를 자동으로 승인하지 않습니다.

아뜰리에의 기본 부품은 파일 하나(`lib/design/components.tsx`, 정본 4,677줄, 값 내보내기 82개)에 모여 있습니다. 스타일은 CSS 클래스가 아니라 인라인 style 객체로 들어가고, 값은 `QD` · `QDScale` · `QDPresentation` · `QDRuntime` 과 `--qd-atelier-*` 변수에서 읽습니다. 호버 · 초점처럼 인라인으로 나타낼 수 없는 것만 전역 클래스(`qa-*`, 아래 부록)를 씁니다.

### 알림 너비 · 여백 · 줄바꿈

세 제품의 알림은 `patterns/foundation.css` 의 `--qd-toast-width` 를 씁니다. 최대 너비는 `--qd-toast-max-width`(360px), 화면 끝 여백은 `--qd-space-5`(20px)와 그 방향의 안전 영역을 더한 값입니다. 모바일에서는 양쪽 여백을 뺀 화면 너비까지 줄어듭니다. 위치별 토큰은 `--qd-toast-inset-top`, `right`, `bottom`, `left` 입니다. 한글은 `--qd-copy-word-break`(keep-all)로 단어 사이에서 줄바꾸고, 긴 식별자는 `--qd-copy-overflow-wrap`(break-word)으로 상자 안에서 줄바꿉니다. 글자의 flex 최소 너비는 `--qd-space-0` 입니다.

아뜰리에 ToastProvider, 메종 Sonner 어댑터, 카르넷 Toasts 가 같은 규칙을 읽습니다. 메종의 라이브러리 닫기 단추는 알림 오른쪽 안에 두고 중앙 조작 높이, 모서리, 보조 글자색, 호버 색과 키보드 초점 규칙을 적용합니다. 메시지 내용, 성공 · 오류 판정, 유지 시간과 닫기 동작은 바꾸지 않습니다. 앱 오프라인 자산에도 이 정본이 들어갑니다.

### 로딩 묶음

아뜰리에 `components/Skeleton.tsx` 의 기본형과 `Row`, `Card`, `KPIGrid`, `PageHd`, `Table` 은 같은 정본 파일에서 생성합니다. 면은 `--qd-surface2`, 모서리는 `--qd-radius`, 반복 시간은 `--qd-skeleton-duration`(1.6s)을 읽습니다. 공통 효과는 투명도를 바꾸는 pulse 이며, 움직임 줄이기 설정에서는 멈춥니다.

메종 `components/shared/page-skeleton.tsx` 도 구현 정본에서 생성합니다. 필터 입력 · 선택, 양식 입력과 제출 자리의 높이는 `--qd-control-height`(44px)를 읽습니다. 머리의 작은 동작 자리는 `--qd-control-height-sm`(36px)을 쓰되, 화면 폭 640px 이하나 터치 포인터에서는 일반 조작 높이를 최소 높이로 적용합니다. 제목 자리의 높이와 내용 반복 개수는 별도 규칙입니다.

기본 높이 · 간격 · 반복 개수는 중앙 `QDPresentation` 에서 받습니다. 명시한 폭 · 높이 · 행 · 열 개수와 호출부 스타일은 별도 입력입니다. 다섯 부속 렌더러의 공개 이름과 실제 함수 이름을 명시해 등록했고, 이름 변경 · 누락 · 추가 · 계산된 속성 · 중첩 대입을 생성 전에 거부합니다. React `displayName` 문자열은 표시용 메타데이터라 부품으로 세지 않습니다.

### 자동 채움 입력 상태

브라우저가 채운 `input` 과 `textarea` 도 중앙 팔레트를 따릅니다. `--qd-autofill-surface` 는 `--qd-surface`, `--qd-autofill-ink` 는 `--qd-text` 에 연결합니다. 브라우저 고유 배경은 중앙 inset paint 로 덮으며 자동 채움 기능과 값은 바꾸지 않습니다. 키보드 초점은 중앙 강조색 · 테두리 두께 · 간격을 따릅니다. 비활성 상태는 `--qd-bg` 와 `--qd-muted` 로 바꿉니다. 시스템 강제 색 모드에서는 `FieldText`, `GrayText`, `Highlight` 를 쓰고 inset paint 를 풉니다.

이 규칙은 세 웹 제품, 아뜰리에의 독립 시뮬레이터와 오프라인 화면, 세 Android 앱과 아뜰리에 iOS 의 생성 오프라인 자산에 들어갑니다. 설치 앱에 들어가는 변경은 앱 재빌드와 서명 · 배포까지 해야 반영됩니다.

### Android 시작 화면

세 Android 앱의 `LaunchView.java` 는 [patterns/native/launch-view.java.tpl](../patterns/native/launch-view.java.tpl) 한 벌에서 생성합니다. 제품별로 바뀌는 것은 패키지명과 제품명뿐입니다. 그리기, 위치 계산, 시작 · 대기 · 종료 애니메이션과 접근성 대응은 공통 템플릿이 맡습니다. 글자 크기, 바탕색과 안내 문구 줄바꿈 전략은 중앙 생성 리소스를 읽습니다. 로고 · 글꼴 파일, 시스템 애니메이션 배율, 화면 크기와 실행 상태는 별도의 자산 · 플랫폼 입력입니다.

`--check` 는 템플릿, 생성 파일, 세 앱의 실제 소스와 목록(`dist/q-design.native-launchers.json`)이 맞는지 봅니다. 제품 사본을 직접 고치면 전체 파일 비교가 실패합니다. 템플릿 한 곳을 고치면 세 사본이 함께 바뀌는지, 사본이 낡으면 검사가 실패하는지는 회귀 시험(`tools/build-native-launcher.test.mjs`)이 봅니다. 설치 앱에는 재빌드 · 서명 · 배포가 필요합니다.

---

## 아뜰리에 부품 치수

아래 값은 아뜰리에 구현 정본(`patterns/component-implementations/atelier/lib/design/components.tsx`)과 기반 CSS(`patterns/foundation/atelier.css`, `patterns/components.css`)에서 다시 잰 지금 값입니다.
Maison 과 Carnet 은 같은 역할을 공용 `qd-*` 클래스로 받습니다(역할별 등록부 참고).

### 입력 · 선택 · 여러 줄 (`In` · `Sel` · `Txt`)

```
class: qa-input qd-input  ·  minHeight 44  ·  padding 8px 12px  ·  fontSize 13
background surface  ·  border 1px solid ctl  ·  color text  ·  radius 10
Txt  resize vertical · 기본 3줄 · 최소 높이 80 (--qd-textarea-min-height)
```

상태는 전역 CSS 가 맡습니다.

```css
.qa-input:hover:not(:focus):not(:disabled):not([readonly]) { border-color: var(--qa-muted) !important; }
.qa-input:focus,
.qa-input:focus-visible {
  border-color: var(--qa-champagne) !important;
  background-color: var(--qa-surface2);          /* 초점에서 한 겹 들어갑니다 */
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--qa-champagne) 18%, transparent);
}
```

초점에서 배경이 `surface` 에서 `surface2` 로 바뀌는 것이 이 시스템의 촉감입니다. 테두리만 바뀌는 것과 다릅니다.

`Sel` 은 `qd-input` 을 함께 달아 공용 규칙(`select.qd-input`: `appearance: auto` · `background-image: none` · 오른쪽 여백 32px)을 받으므로 OS 화살표를 씁니다. 금색 SVG 화살표는 `qd-input` 없이 `qa-input` 만 단 select 에 남아 있습니다(부록 «select 화살표»).

`Sel` 의 키는 두 단입니다(2026-10-20, 손으로 짠 고르기 52곳을 걷으며). 한 줄에 선 조작 상자는 같은 키를 씁니다.

```
Sel       44  ·  In · Btn 과 한 줄(입력 양식 · 조회 줄)
Sel sm    36  ·  Btn sm 과 한 줄(목록 줄 안의 상태 고르기 · 도구줄 정렬)
          터치 화면 · 640 이하에서는 둘 다 44(Btn sm 과 함께 오릅니다)
```

폭은 `Sel` 이 아니라 감싸는 자리가 정합니다(`Sel` 은 늘 100%). 갈래마다 `disabled` 를 줄 수 있고, `{ g, opts }` 로 묶음 제목(`optgroup`)을 답니다. 보이는 이름이 없으면 `ariaLabel`, 상태를 테두리 색으로 알릴 때는 `accent`(바뀐 칸 · 걸린 거르개 · 상태별 색)를 씁니다.

1023px 이하에서 입력 글자는 조작 글자 크기(13px)를 지킵니다. iOS 는 16px 미만 입력에 초점이 가면 자동 확대하지만, 디자인 통일을 우선해 13px 를 택했습니다(사용자 결정, `patterns/foundation/atelier.css` 주석).

### `Field` 가 오류 · 도움말을 칸에 연결합니다

`<Field id="x" error="…" hint="…"><In id="x" … /></Field>` 로 쓰면 Field 가 자식 가운데 id 가 같은 칸을 찾아 `aria-describedby="x-hint x-error"` 와 `aria-invalid` 를 끼워 넣습니다.
오류 글귀는 `id="x-error"` 와 `role="alert"` 를, 도움말은 `id="x-hint"` 를 갖습니다.
호출부가 이미 준 `aria-describedby` 는 앞에 그대로 남습니다. `FldRow` 를 `htmlFor` 없이 쓰면(이름표도 잇지 못하는 옛 호출) 연결도 하지 않습니다.
계약: `field-error-link.test.tsx`.

### 제출 실패는 단추 위에 남는 요약으로, 초점도 거기로

실패를 토스트 한 줄로만 알리면 곧 사라지고 초점이 단추에 남아, 어느 칸이 문제인지 찾을 수 없습니다. 그래서 실패는 제출 단추 바로 위에 남는 `Alert`(오류 · `role="alert"`)로 나타나고, 초점이 거기로 옮겨 가며, 칸마다 이름표 글귀를 눌러 그 칸으로 갑니다.
서버가 `invalidInput` 으로 준 `issues.fieldErrors` 는 `Field` 의 inline 오류로도 이어집니다(위 연결 규칙 그대로).

```tsx
const sf = useSubmitFailure({ title: 'qo-title', period_end: 'qo-end' });   // API 칸 이름 → 화면 칸 id
async function submit() {
  sf.clear();
  …
  if (!res.ok) { sf.fail(failureFromResponse(json, '저장하지 못했습니다.')); return; }
}
<Field id="qo-end" error={sf.fieldError('period_end')}>…</Field>
<SubmitFailureSummary failure={sf.failure} nonce={sf.nonce} fieldIds={sf.fieldIds} onClose={sf.clear} />
<FormActions>…</FormActions>
```

- 화면 쪽 검증(비어 있는 필수 칸)도 `sf.fail({ message, fields: { name: … } })` 로 같은 길을 씁니다.
- 요약은 `FormActions` 바로 앞에 둡니다. 누른 뒤 사용자의 눈과 초점이 거기 있습니다(원칙 «다음 단계는 화면에 보여야 한다»).
- 같은 실패가 반복돼도 `nonce` 가 올라 요약이 다시 초점을 받습니다. 초점 고리는 전역 `:focus-visible` 에 맡기고 인라인 `outline` 은 쓰지 않습니다(계약 ⑳, [10-rules.md](10-rules.md)).
- 계약: `submit-failure.test.tsx`.

### `Btn`

| | 기본 | `sm` |
|---|---|---|
| padding | `11px 22px` | `7px 14px` |
| minHeight | 44 | 36 (거친 포인터에서 44) |
| fontSize | 13 | 13 |

```
lineHeight: 1  ·  fontWeight: 500  ·  gap: 6  ·  whiteSpace: nowrap
letterSpacing: labelTracking(children, 1.2)     ← 한글이면 0
textTransform: 한글이면 없음, 아니면 uppercase
border: 항상 1px  (primary 는 transparent)  ·  disabled opacity 0.4
```

primary 에도 투명 1px 테두리를 두는 것이 요령입니다. 그러지 않으면 primary 와 secondary 의 크기가 1px 씩 어긋납니다.

| 변형 | 배경 | 글자 | 테두리 |
|---|---|---|---|
| primary | `text` (크림) | `bg` | transparent |
| secondary | transparent | `subtle` | `ctl` |
| danger primary | `red` | `bg` | `red` |
| danger secondary | transparent | `red` | `red` |

주 버튼은 금색이 아니라 크림색입니다. 금은 강조로 아껴 두고, 행동은 밝기로 부릅니다.

`pending`: 저장 · 제출처럼 서버를 기다리는 단추는 `pending={saving}` 하나로 `disabled` + `aria-busy` + 회전 표시(`qa-spin`)가 함께 켜집니다. 글자는 지우지 않고 `visibility: hidden` 으로 자리만 남겨 폭이 흔들리지 않습니다. 동작 줄이기 설정에서는 전역 규칙이 회전을 멈춥니다. 계약: `field-error-link.test.tsx` ②.

호출부 규칙:

- 검증 조건은 `disabled` 에 남깁니다(`pending={saving} disabled={!ok}`).
- 행마다 다른 깃발이면 `pending={busy === 'sync'} disabled={busy !== null}` 처럼 «이 단추가 도는 중» 과 «다른 동작 중 잠금» 을 가릅니다.
- 글귀에 «…중» 삼항을 두지 않습니다. 스피너가 대신하고 글자 폭이 흔들리지 않게 합니다.
- 한 깃발을 여러 단추가 나눠 쓰면 어느 단추가 눌렸는지 알 수 없으니 깃발을 `null | '동작이름'` 으로 가른 뒤에 씁니다.
- 처리 중에는 숨은 글귀 «처리 중» 이 단추 이름을 잇습니다(visibility: hidden 은 접근성 트리에서도 빠지므로).

### `IconBtn`

```
44×44  ·  radius 10  ·  border 1px ctl  ·  transparent 배경  ·  color muted
hover → color text (danger 는 red) · border-color muted  ·  전환 160ms  ·  disabled opacity 0.4
```

### `Switch` · `Checkbox` · `FilterChip`

```
Switch      md 52×28 (손잡이 22) · sm 40×22 (손잡이 16) · radius 10 · 전환 160ms · disabled 0.5
Checkbox    행 전체가 누르는 자리(qd-choice-hit · 최소 44) · gap 10 · 표시 16px (--qd-choice-glyph-size)
            card 변형: padding 10px 12px · radius 10 · 체크 시 테두리 강조색 55% · 배경 6%
FilterChip  밑줄 탭 모양: padding 8px 12px · 13px · 활성은 아래 2px champagne 선 + 굵은 글자 · 그 밖은 muted
```

---

### `Bx` (기본 상자)

모든 카드의 바탕입니다.

```
background: surface  ·  border: 1px solid border
border-radius: var(--qd-radius, var(--qa-radius-card, 10px))
box-sizing: border-box
accent prop → 테두리 전체를 그 색 55% 로 물들임 (champagne|green|warning|red|blue|muted)
lift prop   → class qa-card-lift
```

`accent` 는 왼쪽 띠가 아니라 테두리 전체의 색입니다(오너 결정 2026-09-27 «문서 결»: 왼쪽 강조선을 쓰지 않음).

> **`Bx` 에는 기본 padding 이 없습니다.**
> 일부러 그렇게 두었고, 계약(`bx-padding.test.ts`)이 모든 사용처가 padding 을 주는지 검사합니다.
> 기본값을 넣으면 이 계약도 함께 무너집니다.

### `Card` · `SectionCard` · `Panel`

```
Card         padding 22px 24px · minHeight 124 (KPI 와 행 높이를 맞추기 위해)
SectionCard  padding 24 · gap 12 · marginBottom 16
Panel        loading · error · empty 상태를 감싸는 래퍼. 각각 SkeletonPanel · Alert · 빈 노드
```

`Panel` 은 «데이터가 오는 자리» 의 표준입니다. 로딩이면 스켈레톤, 실패면 알림, 비면 빈 상태를 알아서 그립니다.

### `Div` · `Collapse`

```
Div       border-top 1px border · margin 16px 0
Collapse  열기 520ms cubic-bezier(0.22, 1, 0.36, 1) · 닫기 380ms cubic-bezier(0.4, 0, 0.2, 1)
          닫힌 내용은 inert · 위로 4px 들어가며 사라짐
```

### `Grid`

인라인 스타일로는 미디어 쿼리를 쓸 수 없어 `<style>` 규칙을 만들어 넣습니다.

```
기본       repeat(auto-fit, minmax(240px, 1fr))
cols={4}   768 이상 2열 · 1024 이상 4열 (cols 가 3 이상일 때 768 구간은 2열)
gap 기본 10
```

계약(`grid-rules.test.tsx`)이 잠그는 것: 규칙이 있으면 인라인 `gridTemplateColumns` 를 내지 않습니다.
인라인은 클래스를 이기므로, 남아 있으면 끊는 폭 규칙이 한 번도 적용되지 않습니다.

### 폼 칸 두세 개를 나란히 놓을 때는 `foldGrid`

날짜 두 칸 · 글자 두 칸처럼 «n 열로 놓되 좁으면 줄어야 하는» 자리에 `gridTemplateColumns: '1fr 1fr'` 를 손으로 쓰지 않습니다.
한 열이 칸의 최소 폭보다 좁아져도 열이 안 줄어, 확대 400%(폭 320)에서 오른쪽이 잘립니다.

```tsx
<div style={foldGrid(2, S[3])}>                                   // 최대 2열, 한 열이 150px 보다 좁아지면 1열
<div style={foldGrid(3, S[2], { min: 110 })}>                     // 입력 세 칸(최소 · 최대 · 단위)
<div style={{ ...foldGrid(2, S[3]), marginBottom: S[3] }}>        // 다른 style 과 같이
<div style={foldGrid(2, S[6], { min: 200, rowGap: S[4] })}>       // 행 간격이 다를 때
```

- 규칙은 `repeat(auto-fit, minmax(max(min, 균등 1/n 폭), 1fr))` 입니다. 열은 n 개를 넘지 않고, 들어가지 않으면 줄어듭니다.
  뷰포트가 아니라 «칸이 놓인 상자의 폭» 으로 정해져 모달 · 좁은 카드 안에서도 맞습니다.
- 균등 폭에서 1px 를 뺀 것은 소수점 반올림으로 n 열이 «한 칸 모자라게» 접히는 것을 막는 여유입니다.
- 열 수가 뜻인 곳은 접지 않습니다. 숫자판 · 의료기기 등급 · 예/아니오 · 진행 단계 · 7열 달력은 `repeat(n, minmax(0, 1fr))` 로 둡니다.
  `1fr` 만 쓰면(`minmax(auto, 1fr)`) 칸이 글자 최소 폭에 밀려 터집니다.
- 스스로 접는 길이 따로 있으면 날것 `1fr 1fr` 이 남아도 됩니다. 허용 목록(이유 + 근거 확인)이 `fold-grid.test.tsx` 에 있고, 목록 밖에 새로 생기면 시험이 빨강입니다.

---

### `PageHd` (화면 머리)

```
┌ 32×1.5px 샴페인 막대            ← accent (기본 켜짐). 화면마다 반복되는 서명
│ mono · 12px · 자간 2.2 부제      ← 한글이면 자간 0
│ h1  class qd-page-head-title (--qd-title-size 22px) · weight 700 · 자간 -0.02em · lineHeight 1.3
└ 1px 하단 경계선                  ← marginTop 18
marginBottom: 30
```

`fontSize` 를 인라인으로 주지 않습니다. 제목 크기는 클래스가 맡습니다. 인라인이 클래스를 이기면 화면별 규칙(예: 개요 화면의 `clamp(24px, 3vw, 32px)`, `dist/q-design.screen.css`)이 적용되지 않습니다.

### `SectionTitle`

```
16px · weight 700 · 본문색 · lineHeight 1.35 · marginBottom 14
번호: class qa-sec-t 의 ::before (CSS counter) · mono 12px · weight 600 · champagne
```

전 화면의 구역 제목입니다(C안, 오너 결정 2026-10-10). 한글 자간 사고가 가장 널리 퍼졌던 자리이기도 하니 자간은 [03-typography.md](03-typography.md) 를 따릅니다.

### 매거진 구분자 (CSS 전용)

```
.qa-mag-divider        display:flex · align-items:baseline · gap 16 · margin 32 0 18
  -num                 32px · weight 300 · champagne · 자간 -0.02em · tnum
  -label               mono · 12px · 자간 1.5px · uppercase · muted
  -title               18px · weight 500 · text
  -line                flex:1 · 1px · champagne 40% → transparent 그라디언트
```

---

### `Tag` (배지)

| 크기 | 최소 높이 | 글자 | padding | 점 | 실제 높이 | 높이를 정하는 것 |
|---|---:|---:|---|---:|---:|---|
| `xs` | 20 | 12 | `0 6px` | 5 | 20 | 최소 높이 |
| `sm` | 24 | 12 | `2px 8px` | 6 | 24 | 최소 높이 |
| `md` | 28 | 13 | `4px 10px` | 7 | **28.2** | **줄 높이** |

```
fontFamily: mono  ·  lineHeight: 1.4  ·  radius 10  ·  letterSpacing: labelTracking(children, 1)
치수 변수: --qd-tag-{xs|sm|md}-{min-height|size|padding-y|padding-x|dot-size|gap}
```

세 층위(`tier`)가 있습니다.

| tier | 배경 | 테두리 | 글자 |
|---|---|---|---|
| `primary` | 색 10% | 색 55% | 색 |
| `secondary` (기본) | 없음 | 색 33% | 색 |
| `tertiary` | 없음 | 색 18% | `muted` |

같은 색으로 세 단계의 «소리 크기» 를 만드는 구조입니다. 한 행에 배지가 여럿일 때 핵심만 primary 로 두고 나머지를 낮춥니다.
`color` 가 champagne 이고 tier 를 주지 않으면 primary 로 그립니다. `dot` 을 켜면 왼쪽에 원형 점이 붙습니다.

### `KPI` · `Stat`

```
KPI    padding 18px 20px · minHeight 124 · container-type: inline-size
       라벨  mono 12px · subtle · 자간 1.5
       값    weight 700 · clamp(20px, 16cqw, 36px) · lineHeight 1.05 · 자간 -0.02em · tnum
       보조  12px · muted · marginTop 10
Stat   라벨 mono 12 · muted · 자간 0.12em  ·  값 14 weight 600
```

숫자가 36px 에 자간 -0.02em 인 것이 대시보드 인상을 만듭니다. 크게 쓰고 조입니다.
카드가 자기 폭을 재므로(`container-type`) 칸이 좁으면 값이 칸 폭에 맞춰 줄어들고 20px 아래로는 내려가지 않습니다. 긴 금액이 칸을 넘지 않게 하기 위해서입니다.

### `Alert` · `InfoBox`

```
Alert    class qd-notice · padding 12px 16px · 바탕 surface · 테두리 상태색 45% · 13px · lineHeight 1.6
         머리  아이콘 16px(오류 · 주의 · 완료 · 안내) + 12px 굵은 종류 글귀 «· 제목»
         role  error · warning 은 alert, info · success 는 status
         marginBottom 16  ← 계약이 이 기본 여백을 강제합니다
         닫기  qd-dialog-close 44×44 «닫기»
InfoBox  padding 10px 2px · 위아래 옅은 괘선(ruleBand) · 13px · subtle · lineHeight 1.6
```

색만으로 종류를 알리지 않도록 아이콘과 종류 글귀를 함께 둡니다.
`Alert` 의 `marginBottom` 이 계약으로 잠겨 있는 까닭은, 없으면 다음 요소가 테두리에 달라붙기 때문입니다.

### `EmptyState`

```
padding: 96px 24px   (compact 는 32px 24px)
제목: ui 글꼴 · weight 700 · 22px (compact 16px) · subtle · 자간 -0.01em
설명: 13px · muted · lineHeight 1.7 · maxWidth 460 · 가운데
힌트 칩: padding 6px 12px · 테두리 champagne 40% · champagne 글자 · mono 12px
```

빈 화면에 96px 여백을 주는 것이 이 시스템의 성격을 보여 줍니다. 비었을 때 초라해 보이지 않고 «의도된 여백» 으로 읽힙니다.
장식 글리프와 바탕 방사 그라디언트는 쓰지 않습니다(화면 검토 A38 · A76).

### `Skeleton` · `LoadingState`

```css
.qa-skeleton {
  background: var(--qa-surface2);
  border: none;
  border-radius: var(--qd-radius, 10px);
  animation: qd-skeleton-pulse var(--qd-skeleton-duration, 1.6s) ease-in-out infinite;   /* 투명도만 바뀜 */
}
```

```
Skeleton       class qa-skeleton qd-skeleton · 기본 높이 14 · radius 10
SkeletonPanel  padding 18 · border 1px · surface · 기본 3줄
LoadingState   화면 단위 padding 72px 24px · Spinner + mono 12px 글귀 · 자간 2.2
```

### `ProgressBar` · `ProgressRing`

```
Bar   height var(--qd-progress-height, 6px) · radius 10 · 트랙은 border 색 알파
      색 미지정이면 100% 는 green, 그 밖은 champagne · 너비 전환 200ms
Ring  size 56 · stroke 5 · SVG · -90deg 회전 · 트랙 border 색
```

### `Spinner`

```
14×14 · 1.5px 테두리 · borderTopColor champagne · 원형 · qa-spin 0.8s linear infinite
```

회전은 로딩 표시에만 씁니다. 움직임의 허용 범위는 [05-shape-elevation-motion.md](05-shape-elevation-motion.md) 를 따릅니다.

---

### `DataTable`

```
헤더  padding (padY+1)px 12px · mono 12px · weight 500 · 하단 1px 경계
셀    padding padY 12px · var(--qd-table-size, 13px)
      padY = var(--qd-table-pad-y, 11px) · dense 는 var(--qd-table-pad-y-dense) = 8px
빈 행 padding 20px 12px
컬럼  minmax(0, 1fr) 로 grid template 구성
phoneRow → 폰 폭에서 카드 줄로 바꿈 · minWidth · stickyFirstCol → 가로 스크롤 표(ScrollTable)
expandedRow → 값을 돌려준 줄 아래에 표 폭 전체 칸 하나(편집기 · 보조 동작) · 줄과 칸 사이 선 없음
              phoneRow 는 이것을 읽지 않음 · 폰에서도 펼치려면 phoneRow 안에서 그림 (2026-10-20 · 장부 표)
```

### `EntityRow`

```
padding 14px 6px · minHeight 68 · gap 14
background transparent · 아래 1px 괘선만 · radius 0 · 전환 background 160ms
아이콘 칩 36×36 원형 · 코드 mono 12 champagne · 제목 14 medium 한 줄 · 보조 13 subtle
누를 수 있으면 qa-row-clickable (올리면 surface2)
expanded → 펼치는 줄이면 지금 펼쳐졌는지 aria-expanded 로 알림 · 누를 수 있는 줄에만 붙음
```

항목 행은 상자가 아니라 괘선 행입니다(오너 결정 2026-09-27 «문서 결»). 상태는 왼쪽 색 띠가 아니라 배지와 글귀로 나타냅니다.

---

### `Modal`

```
배경막  --qd-backdrop (rgb(0 0 0 / 0.48)) · padding 24 (640 이하 20) · z-index --qd-z-modal (1100)
본체    background surface · border 1px borderHi · radius 10 · shadow --qd-shadow-overlay
        maxWidth 560 (기본) · maxHeight calc(100dvh - 2 × padding)
머리    padding 24 · 아래 경계 · 제목 18px weight 600 lineHeight 1.3 · 부제 13px lineHeight 1.5
닫기    IconBtn (qd-dialog-close)
본문    padding 24 · overflowY auto
바닥    padding 24 · gap 10 · 위 경계
```

초점 가두기가 들어 있습니다(Tab 순환 · Esc 닫기 · 열릴 때 첫 요소로 초점 · 닫으면 초점 되돌림 · 바탕 스크롤 잠금). body 아래 portal 로 그리고, 창이 겹치면 맨 위 창만 키를 받습니다. `Drawer` 도 같은 초점 처리를 씁니다.

### `Drawer`

```
폭      기본 min(480px, 96vw) · 방향 right | left | bottom (bottom 은 maxHeight 85dvh · 안전 영역 여백)
배경막  --qd-backdrop · z-index --qd-z-overlay (1000)
본체    background surface · shadow --qd-shadow-overlay · 열릴 때 24px 미끄러짐 (200ms)
머리    padding 24 · 아이콘 champagne · 제목 18px weight 600 lineHeight 1.3 · 부제 mono 12 muted
본문    padding 0 · 바닥 padding 24
```

겹의 순서(Z) 전체는 [05-shape-elevation-motion.md](05-shape-elevation-motion.md) 에 있습니다.

### 툴팁 · 팝오버

정보 설명은 공용 `qd-tooltip` · `qd-popover` 를 씁니다. 불투명 surface 면, 1px ctl 테두리, radius 10, 12px 글자, `--qd-shadow-overlay` 그림자입니다. 툴팁의 z-index 는 `--qd-z-tooltip`(9999)입니다.

---

### 셸

사이드바의 폭 · 접힘 · 드로어 · 스와이프 규칙은 [07-screens.md](07-screens.md) 에 있습니다.

### `TopProgressBar`

```css
.qa-top-progress {
  position: fixed; top: 0; height: 2px; z-index: 9999;
  background: linear-gradient(90deg, transparent,
    var(--qa-champagne) 30%,
    color-mix(in srgb, var(--qa-champagne) 80%, white) 60%,
    var(--qa-champagne));
  box-shadow: 0 0 12px color-mix(in srgb, var(--qa-champagne) 70%, transparent);
}
```

라우트 전환 때 나타나는 2px 금색 실선입니다. 가운데가 밝고 빛 번짐이 있습니다.

움직임은 [source/components/TopProgressBar.tsx](../source/components/TopProgressBar.tsx) 가 정합니다(조각 «진행선» 으로 Q-Atelier 와 Q-Carnet 이 받습니다).
누르는 순간 시작해 90% 에서 멈추고, 화면이 실제로 바뀔 때만 100% 로 채우고 걷습니다.

- 누르는 순간 시작하는 까닭: App Router 에서 경로 값은 새 화면이 그려진 «뒤» 에 바뀌므로, 경로를 보고 시작하면 막대가 도착한 다음에야 움직입니다.
- 90% 에서 멈추는 까닭: 남은 시간을 모르면서 100% 를 그리면 다 됐다고 말하는 것이 되고, 그 뒤로도 화면이 안 바뀌면 사용자는 그 표시를 다시 믿지 않습니다.
- 15초 안에 도착하지 않으면 스스로 걷습니다(취소 · 서버 오류).
- `prefers-reduced-motion: reduce` 면 아무것도 그리지 않습니다(시작도 끝맺음도).
- 링크가 아닌 이동은 `startRouteProgress()` 를 부릅니다. 클릭 감시는 `a` 태그만 봅니다.
- `className` 만 받습니다. 겉모습은 위 CSS 처럼 제품이 정합니다.

### `RibbonBackground`

샴페인 SVG 리본 두 겹이 32초 / 38초 주기로 흐릅니다. 정본은 [patterns/foundation/atelier-backgrounds.tsx](../patterns/foundation/atelier-backgrounds.tsx) 입니다.
viewBox 2400×1200 에 좌표가 화면 밖까지 나가 있어 초광폭 모니터에서도 잘리지 않습니다.

```
intensity="full"     opacity 0.14 / 0.08   로그인
intensity="ambient"  opacity 0.07 / 0.04   앱 내부
pointer-events: none · position: fixed · z-index 0
```

인쇄에서는 그리지 않고, 동작 줄이기 설정에서는 흐름을 멈춥니다.

---

### `SegmentedChoice`

라디오 그룹의 모범 사례가 그대로 들어 있습니다. 계약(`segmented-choice.test.tsx`)이 전부 검사합니다.

- `role="radiogroup"` 안에 `role="radio"`, 선택된 것만 `aria-checked="true"`
- roving tabindex: 선택된 항목만 `0`, 나머지는 `-1`
- 선택이 없으면 첫 «활성» 항목이 `0` (비활성은 Tab 순서에서 빠짐)
- 화살표 이동은 비활성을 건너뛰고 끝에서 감깁니다
- Home/End 는 범위 밖 인덱스로 호출해 첫/마지막 활성으로 갑니다
- 전부 비활성이면 `null` (무한 루프 없이)
- 기본 배치(`wrap`)는 같은 크기 칸 묶음입니다(2026-10-20 오너 «네모칸 크기 통일»). 가장 긴 칸에 맞춘 같은 폭 · 같은 높이로 한 줄에 서고, 줄이 넘치면 줄 폭 안에서 고르게 나눕니다. 폰(`sm` 미만)은 `minCol` 기준으로 같은 칸 격자로 접힙니다. 규칙은 `patterns/foundation/atelier.css` 의 `.qd-seg-wrap` 한 곳입니다

### 건너뛰기 링크

```css
.qa-skip-link { position: absolute; left: -9999px; }
.qa-skip-link:focus {
  position: fixed; left: 16px; top: 16px;
  padding: 10px 18px; background: var(--qa-champagne); color: var(--qa-bg);
}
```

WCAG 2.4.1 (Bypass Blocks). 평소엔 화면 밖, Tab 하면 나타납니다.

---

## 옮겨 쓸 때

이 부품들을 그대로 가져가려면 React 19 + Next.js 가 필요합니다. 그럴 필요는 없습니다. 위 표의 수치만 있으면 어떤 프레임워크에서도 같은 인상이 나옵니다.

우선순위를 매기면 이 셋이 인상의 8할입니다.

1. **`Bx` + `qa-card-lift`** (카드와 금테 호버)
2. **`Tag` 3층위** (같은 색으로 소리 크기 조절)
3. **`PageHd`** (금색 막대 + mono 부제 + 제목 + 하단선)

---

## 역할별 등록부

역할마다 세 제품의 실제 구현, 정본 상태와 근거, 제품 차이를 적습니다.
**이 표는 지금 손으로 고칩니다. 원본 데이터 [source/component-roles.json](../source/component-roles.json) 과 함께 고치십시오.**

정본 상태의 «CSS 정본» 은 기본 외형을 공용 CSS 가 정한다는 뜻이며, 모든 업무 조합과 런타임 동작이 같다는 뜻은 아닙니다. 규칙 계열은 [source/component-rules.json](../source/component-rules.json) 에 있습니다.

| 역할 | Q-Atelier | Q-Maison | Q-Carnet | 정본 상태와 근거 | 제품 차이 |
| --- | --- | --- | --- | --- | --- |
| 주 행동·아이콘 버튼 | `Btn` · `IconBtn` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx) | `Button` <br> [components/ui/button.tsx](../../Q-Works/components/ui/button.tsx) | `.qd-btn` <br> [app/q-design.screen.css](../../DHR/app/q-design.screen.css) | CSS 정본<br>[07-screens.md](07-screens.md) | 공통 버튼 CSS는 있으나 Atelier는 원본 React, Maison은 CVA 래퍼, Carnet은 native button 클래스가 중심이다. Carnet 현장 .btn-*는 별도 역할로 남는다. |
| 보조 글자 행동 | `TextAction` · `TextLinkAction` <br> [components/TextAction.tsx](../../Q-Atelier/components/TextAction.tsx)<br>`BackButton` <br> [components/BackButton.tsx](../../Q-Atelier/components/BackButton.tsx) | `Button` <br> [components/ui/button.tsx](../../Q-Works/components/ui/button.tsx) | 공용 래퍼 미등록 | CSS 정본<br>[patterns/components.css](../patterns/components.css)<br>[patterns/action-targets.css](../patterns/action-targets.css)<br>[dist/q-design.workspace.css](../dist/q-design.workspace.css) | Maison Button의 link·ghost, 정렬 머리와 닫기·수정 글귀는 qd-text-action을 사용한다. Atelier 전용 TextAction 및 Carnet 행동 링크의 API는 제품별로 유지한다. 보조 행동을 글자로 두는 결정은 같다. |
| 문자·숫자 입력 | `In` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx) | `Input` <br> [components/ui/input.tsx](../../Q-Works/components/ui/input.tsx)<br>`MoneyInput` <br> [components/ui/money-input.tsx](../../Q-Works/components/ui/money-input.tsx)<br>`PasswordInput` <br> [components/ui/password-input.tsx](../../Q-Works/components/ui/password-input.tsx)<br>`SuggestInput` <br> [components/ui/suggest-input.tsx](../../Q-Works/components/ui/suggest-input.tsx) | `.qd-input` <br> [app/q-design.screen.css](../../DHR/app/q-design.screen.css) | CSS 정본 | 공통 입력 외형은 연결되어 있다. 금액·비밀번호·추천 입력의 동작은 Maison 래퍼이며 Carnet 현장 .input과 숫자판은 별도로 남는다. |
| 선택·검색 선택 | `Sel` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx) | `Select` <br> [components/ui/select.tsx](../../Q-Works/components/ui/select.tsx)<br>`Combobox` <br> [components/ui/combobox.tsx](../../Q-Works/components/ui/combobox.tsx) | `.qd-input` <br> [app/q-design.screen.css](../../DHR/app/q-design.screen.css) | CSS 정본 | 세 제품 native select와 Maison 검색형 Combobox를 구분한다. Maison 팝오버 표면·옵션 상태는 중앙 규칙을 사용한다. OS 선택기와 검색·키보드·값 전달 동작은 제품 어댑터에 남는다. |
| 여러 줄 입력 | `Txt` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx) | `Textarea` <br> [components/ui/textarea.tsx](../../Q-Works/components/ui/textarea.tsx) | `.qd-input` <br> [app/q-design.screen.css](../../DHR/app/q-design.screen.css) | CSS 정본 | Atelier·Maison에는 래퍼가 있고 Carnet은 textarea에 공통 클래스를 붙인다. 행 수·크기 조절·읽기 전용 처리의 인터페이스는 다르다. |
| 필드 이름표·오류 연결 | `Lbl` · `Field` · `FldRow` · `FldError` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx) | `Label` <br> [components/ui/label.tsx](../../Q-Works/components/ui/label.tsx)<br>`Field` <br> [components/ui/field.tsx](../../Q-Works/components/ui/field.tsx) | `Field` <br> [components/ui.tsx](../../DHR/components/ui.tsx) | CSS 정본<br>[07-screens.md](07-screens.md) | 이름표의 외형은 정본이다. 오류·도움말 id 연결은 Atelier와 Maison의 구현이 다르며 Carnet Field는 이름표와 children을 묶는 별도 어댑터다. |
| 날짜·시각·달력 | 공용 래퍼 미등록 | `Calendar` <br> [components/ui/calendar.tsx](../../Q-Works/components/ui/calendar.tsx)<br>`DatePicker` <br> [components/ui/date-picker.tsx](../../Q-Works/components/ui/date-picker.tsx)<br>`TimePicker` <br> [components/ui/time-picker.tsx](../../Q-Works/components/ui/time-picker.tsx)<br>`DateRangePicker` <br> [components/ui/date-range-picker.tsx](../../Q-Works/components/ui/date-range-picker.tsx)<br>`DateRangeFilter` <br> [components/shared/date-range-filter.tsx](../../Q-Works/components/shared/date-range-filter.tsx) | 공용 래퍼 미등록 | CSS 정본<br>[patterns/components.css](../patterns/components.css) | Maison Calendar·DatePicker·DateRangePicker·TimePicker는 중앙 입력칸·팝오버·선택 항목·행동 규칙을 사용한다. 날짜·시각 계산과 키보드·값 전달은 유지한다. 7열 날짜 격자는 44px 클릭 영역을 보존한다. Atelier·Carnet의 native 입력은 각 제품의 실제 구현으로 검수한다. |
| 체크·토글 | `Checkbox` · `Switch` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx)<br>`MemberPicker` <br> [components/MemberPicker.tsx](../../Q-Atelier/components/MemberPicker.tsx) | `Checkbox` <br> [components/ui/checkbox.tsx](../../Q-Works/components/ui/checkbox.tsx) | 공용 래퍼 미등록 | CSS 정본<br>[patterns/components.css](../patterns/components.css) | Maison은 native input의 44px 클릭 영역과 16px 표시를 분리해 qd-choice-hit·qd-checkbox·qd-checkbox-mark로 연결한다. 표시만 반경 4px 예외이며 바깥 조작부는 10px다. 체크·중간·사용 불가·초점은 중앙 규칙, native 라벨·키보드·폼 전송은 그대로다. 제품별 Switch와 상태 API는 구분한다. |
| 선택 칩·분할 선택·라디오 묶음 | `FilterChip` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx)<br>`ChoiceChip` · `ChoiceCheck` · `SegmentedChoice` <br> [lib/design/segmented-choice.tsx](../../Q-Atelier/lib/design/segmented-choice.tsx) | `FilterChip` <br> [components/shared/filter-chip.tsx](../../Q-Works/components/shared/filter-chip.tsx)<br>`ChoiceBoxes` · `ChoiceGrid` <br> [components/shared/choice-boxes.tsx](../../Q-Works/components/shared/choice-boxes.tsx)<br>`CheckChip` <br> [components/shared/check-chip.tsx](../../Q-Works/components/shared/check-chip.tsx) | 공용 래퍼 미등록 | CSS 정본<br>[patterns/components.css](../patterns/components.css) | Maison CHOICE_ON·CHIP와 FilterChip은 중앙 qd-choice 선택 규칙을 사용한다. 최신 결정에 따라 선택 상태는 옅은 면과 굵은 글자로 표현한다. Atelier 분할 선택과 Carnet ActionChip의 업무 의미는 각각 유지한다. |
| 상태 태그·배지 | `Tag` · `RiskPill` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx) | `Badge` · `BadgeRaw` <br> [components/shared/badge.tsx](../../Q-Works/components/shared/badge.tsx)<br>`StatusBadge` · `LevelBadge` <br> [components/shared/doc-badges.tsx](../../Q-Works/components/shared/doc-badges.tsx)<br>`NcSeverityBadge` · `NcStatusBadge` <br> [components/shared/nc-capa-badges.tsx](../../Q-Works/components/shared/nc-capa-badges.tsx) | `Tag` · `LockMark` <br> [components/ui.tsx](../../DHR/components/ui.tsx)<br>`ActionChip` <br> [components/action-chip.tsx](../../DHR/components/action-chip.tsx) | CSS 정본<br>[07-screens.md](07-screens.md) | qd-tag 외형이 공통이다. 업무 상태를 색·문구에 대응시키는 함수와 잠금·행동 배지의 의미는 제품이 소유한다. |
| 구역 제목 | `SectionTitle` · `SectionTitleInfo` · `CardTitle` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx) | `.qd-section-title` <br> [app/q-design.screen.css](../../Q-Works/app/q-design.screen.css) | `Panel` <br> [components/ui.tsx](../../DHR/components/ui.tsx) | CSS 정본 | C안 16px 본문색 제목과 번호가 현재 기준이다. Maison은 CSS 클래스를 직접 쓰고 Carnet Panel이 내부 제목을 그린다. 전용 SectionTitle export가 없는 것을 누락된 파일로 보지 않는다. |
| 화면 머리 | `PageHd` · `EntityCardHeader` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx) | `PageHead` <br> [components/shared/page-head.tsx](../../Q-Works/components/shared/page-head.tsx)<br>`ApprovalHeader` <br> [components/shared/approval-header.tsx](../../Q-Works/components/shared/approval-header.tsx) | `PageShell` <br> [components/shell.tsx](../../DHR/components/shell.tsx) | CSS 정본<br>[07-screens.md](07-screens.md) | PageShell은 머리와 본문 폭을 함께 맡는다. 제품별 액션·상태·결재 정보 연결이 다르며 동일한 함수 인터페이스로 이행한 상태는 아니다. |
| 화면 내 탭 | `PageTabs` <br> [components/PageTabs.tsx](../../Q-Atelier/components/PageTabs.tsx)<br>`WorkspaceTab` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx) | `ViewTabs` · `TabButton` · `TabCount` <br> [components/shared/view-tabs.tsx](../../Q-Works/components/shared/view-tabs.tsx) | `FilterBar` <br> [components/shell.tsx](../../DHR/components/shell.tsx) | CSS 정본<br>[07-screens.md](07-screens.md) | Maison은 링크 탭과 버튼 탭을 나눈다. Carnet은 FilterBar 안에서 탭을 만든다. 탭의 선택 속성·주소·목록 조건은 각 제품에서 확인해야 한다. |
| 표·열 머리·정렬 | `DataTable` · `ScrollTable` · `PhoneSwap` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx) | `SortHeader` <br> [components/shared/sort-header.tsx](../../Q-Works/components/shared/sort-header.tsx)<br>`SortHeaderButton` <br> [components/shared/sort-header-button.tsx](../../Q-Works/components/shared/sort-header-button.tsx) | `Table` · `Th` · `Td` · `IdCell` · `TwoLine` · `ActionTd` · `ActionTh` <br> [components/table.tsx](../../DHR/components/table.tsx)<br>`TableWrap` <br> [components/ui.tsx](../../DHR/components/ui.tsx) | CSS 정본<br>[07-screens.md](07-screens.md) | 표 CSS의 기본 외형만 정본이다. DataTable의 데이터·폰 카드 행·정렬 전체 동작은 공통화되지 않았다. Maison에는 표 전체 래퍼보다 화면별 table과 정렬 머리가 많다. |
| 목록 검색·필터 | `ListToolbar` <br> [components/ListToolbar.tsx](../../Q-Atelier/components/ListToolbar.tsx) | `ListSearch` <br> [components/shared/list-search.tsx](../../Q-Works/components/shared/list-search.tsx)<br>`ListFilterSelect` <br> [components/shared/list-filter-select.tsx](../../Q-Works/components/shared/list-filter-select.tsx)<br>`DateRangeFilter` <br> [components/shared/date-range-filter.tsx](../../Q-Works/components/shared/date-range-filter.tsx)<br>`PageSizeSelect` <br> [components/shared/pagination.tsx](../../Q-Works/components/shared/pagination.tsx) | `FilterBar` · `FilterSearch` <br> [components/shell.tsx](../../DHR/components/shell.tsx) | CSS 정본<br>[07-screens.md](07-screens.md) | Atelier는 통합 Toolbar, Maison은 여러 작은 부품, Carnet은 FilterBar와 FilterSearch다. 검색 조건의 주소 반영과 초기화는 제품별 어댑터에 있다. |
| 쪽 이동·목록 건수 | `ListPager` <br> [components/ListPager.tsx](../../Q-Atelier/components/ListPager.tsx) | `ListPagination` · `PageSizeSelect` <br> [components/shared/pagination.tsx](../../Q-Works/components/shared/pagination.tsx) | `ListCount` · `Truncated` <br> [components/ui.tsx](../../DHR/components/ui.tsx) | CSS 정본<br>[07-screens.md](07-screens.md) | Carnet ListCount는 qd-pager 형태의 건수 표시이며 실제 이전·다음 페이지 이동 부품과 같지 않다. 독립된 공용 페이지 이동 구현이 없는 차이를 남긴다. |
| 모달·확인 창 | `Modal` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx)<br>`ConfirmProvider` <br> [components/Confirm.tsx](../../Q-Atelier/components/Confirm.tsx)<br>`GlobalSearch` <br> [components/GlobalSearch.tsx](../../Q-Atelier/components/GlobalSearch.tsx) | `Dialog` · `DialogContent` · `DialogHeader` · `DialogFooter` · `DialogTitle` · `DialogDescription` · `DialogTrigger` · `DialogClose` · `DialogPortal` · `DialogOverlay` <br> [components/ui/dialog.tsx](../../Q-Works/components/ui/dialog.tsx)<br>`FormDialog` <br> [components/shared/form-dialog.tsx](../../Q-Works/components/shared/form-dialog.tsx)<br>`ConfirmJudgmentDialog` <br> [components/shared/confirm-judgment-dialog.tsx](../../Q-Works/components/shared/confirm-judgment-dialog.tsx)<br>`DeleteWithReasonDialog` <br> [components/shared/delete-with-reason-dialog.tsx](../../Q-Works/components/shared/delete-with-reason-dialog.tsx) | `Dialog` <br> [components/dialog.tsx](../../DHR/components/dialog.tsx) | CSS 정본<br>[patterns/components.css](../patterns/components.css) | 배경막·표면·모서리·글자·여백·크기·모션의 공통 CSS가 있다. Maison Radix Dialog와 FormDialog는 이를 사용한다. Portal·Trigger·Close·Overlay도 역할표에 포함한다. 초점 관리·취소·저장·스크롤 배치는 각 제품의 어댑터를 유지한다. |
| 서랍 | `Drawer` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx) | `Sheet` · `SheetContent` · `SheetTitle` · `SheetDescription` · `SheetTrigger` · `SheetClose` <br> [components/ui/sheet.tsx](../../Q-Works/components/ui/sheet.tsx)<br>`PageHelp` <br> [components/shared/page-help.tsx](../../Q-Works/components/shared/page-help.tsx) | 공용 래퍼 미등록 | CSS 정본<br>[patterns/components.css](../patterns/components.css) | 공통 서랍 표면과 머리·본문·행동 규칙을 사용한다. Maison Sheet와 PageHelp는 같은 규칙에 연결하고 방향·폭·Radix 초점 처리를 유지한다. Carnet AdminChrome 메뉴 서랍은 내비게이션 역할이므로 범용 상세 서랍과 구분한다. |
| 안내·오류·조회 실패 | `Alert` · `InfoBox` · `SubmitFailureSummary` · `NextStep` · `LegalNote` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx) | `ListLoadFailed` <br> [components/shared/list-load-failed.tsx](../../Q-Works/components/shared/list-load-failed.tsx)<br>`MissingHint` <br> [components/shared/missing-hint.tsx](../../Q-Works/components/shared/missing-hint.tsx)<br>`AccessDeniedBanner` <br> [components/shared/access-denied-banner.tsx](../../Q-Works/components/shared/access-denied-banner.tsx)<br>`UnsavedNotice` <br> [components/shared/unsaved-guard.tsx](../../Q-Works/components/shared/unsaved-guard.tsx)<br>`ChangedMark` <br> [components/shared/batch-save-bar.tsx](../../Q-Works/components/shared/batch-save-bar.tsx)<br>`ImportSummary` <br> [components/shared/import-kit.tsx](../../Q-Works/components/shared/import-kit.tsx) | `Msg` · `Warnings` · `Caution` <br> [components/ui.tsx](../../DHR/components/ui.tsx) | CSS 정본<br>[08-paper.md](08-paper.md)<br>[patterns/components.css](../patterns/components.css) | 중앙 qd-notice·qd-field-error·qd-field-hint를 제공한다. Maison 접근 제한·미저장·판정 결과와 필드 오류는 이 규칙을 사용한다. 조치가 필요한 오류는 화면에 남기고, 일반 설명은 정보 팝오버로 구분한다. 서버 상태 판정과 문구는 제품 책임이다. |
| 토스트 | `ToastProvider` <br> [components/Toast.tsx](../../Q-Atelier/components/Toast.tsx) | `Toaster` <br> [components/ui/sonner.tsx](../../Q-Works/components/ui/sonner.tsx)<br>`InstallPwa` <br> [components/shared/install-pwa.tsx](../../Q-Works/components/shared/install-pwa.tsx) | `Toasts` <br> [components/toast.tsx](../../DHR/components/toast.tsx) | CSS 정본<br>[patterns/components.css](../patterns/components.css) | 표면·상태색·타이포·여백은 중앙 qd-toast를 제공한다. Maison Sonner와 설치 안내는 이 표면을 사용한다. Atelier provider, Maison Sonner, Carnet 토스트의 API·지속 시간은 유지하며 폼 오류의 유일한 전달 수단으로 쓰지 않는다. |
| 빈 상태 | `EmptyState` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx) | `EmptyState` <br> [components/shared/empty-state.tsx](../../Q-Works/components/shared/empty-state.tsx) | `Empty` <br> [components/ui.tsx](../../DHR/components/ui.tsx) | CSS 정본<br>[07-screens.md](07-screens.md) | 기본 빈 상태 CSS를 공유한다. 이름·설명·다음 행동의 전달 props는 다르며 조회 실패와 구분하는 책임은 호출 화면에 남는다. |
| 로딩·스켈레톤 | `LoadingState` · `Skeleton` · `SkeletonPanel` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx)<br>`Skeleton` <br> [components/Skeleton.tsx](../../Q-Atelier/components/Skeleton.tsx) | `SkeletonHead` · `ListSkeleton` · `CardGridSkeleton` · `DetailSkeleton` · `FormSkeleton` · `TreeSkeleton` · `BoardSkeleton` <br> [components/shared/page-skeleton.tsx](../../Q-Works/components/shared/page-skeleton.tsx) | 공용 래퍼 미등록 | CSS 정본<br>[patterns/components.css](../patterns/components.css) | 중앙 qd-skeleton이 면·모서리·동작 감소를 제공한다. Maison은 화면 형태별 스켈레톤의 빈 자리 배치를 유지하고 로딩 표면을 연결했다. 제품별 라우트 로딩과 자료 조회의 완료 판정은 공통화하지 않는다. |
| 진행 막대·링 | `ProgressBar` · `ProgressRing` · `SectionProgressCard` · `DistributionBars` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx) | 공용 래퍼 미등록 | `Progress` <br> [components/ui.tsx](../../DHR/components/ui.tsx) | CSS 정본<br>[patterns/components.css](../patterns/components.css) | 중앙 qd-progress·qd-progress-fill이 연속 수치 진행의 외형을 제공한다. Maison StepProgress는 단계 표시 역할이며 수치 막대와 구분한다. 라우트 진행선의 완료 판정은 제품 동작에 남는다. |
| 툴팁·정보 설명 | `InfoDot` · `TooltipBody` · `TooltipRow` · `TooltipDivider` · `TooltipNote` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx)<br>`Coachmark` <br> [components/Coachmark.tsx](../../Q-Atelier/components/Coachmark.tsx) | `PageHelp` <br> [components/shared/page-help.tsx](../../Q-Works/components/shared/page-help.tsx) | `InfoTip` <br> [components/info-tip.tsx](../../DHR/components/info-tip.tsx) | CSS 정본<br>[patterns/components.css](../patterns/components.css) | 중앙 qd-tooltip·qd-popover를 제공한다. Atelier InfoDot, Maison PageHelp 서랍, Carnet InfoTip은 정보 전달 목적이 같아도 구조·초점·본문 배치가 다르다. PageHelp는 drawer 역할에도 등록한다. |
| 지표·요약 | `KPI` · `KpiGrid` · `Card` · `Stat` · `StatGrid` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx) | `StatBlock` · `StatRow` <br> [components/shared/stat-block.tsx](../../Q-Works/components/shared/stat-block.tsx)<br>`CountCard` <br> [components/shared/count-card.tsx](../../Q-Works/components/shared/count-card.tsx) | `StatStrip` <br> [components/shell.tsx](../../DHR/components/shell.tsx)<br>`Stat` <br> [components/ui.tsx](../../DHR/components/ui.tsx)<br>`StatDetail` <br> [components/stat-detail.tsx](../../DHR/components/stat-detail.tsx) | CSS 정본<br>[07-screens.md](07-screens.md) | 기본 KPI 외형과 업무 화면 조합은 연결되어 있다. 지표별 집계·단위·설명·상세보기 및 0과 조회 실패 구분은 제품이 유지한다. |
| 항목 행·상세 값 | `EntityRow` · `CardRows` · `CardRow` · `CardFigure` · `DetailRow` · `Ledger` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx) | `DetailField` <br> [components/shared/detail-field.tsx](../../Q-Works/components/shared/detail-field.tsx)<br>`RecordFoot` <br> [components/shared/record-foot.tsx](../../Q-Works/components/shared/record-foot.tsx)<br>`LinkedDocRow` · `LinkedDocCard` <br> [components/shared/linked-doc-card.tsx](../../Q-Works/components/shared/linked-doc-card.tsx)<br>`ImportActionCell` <br> [components/shared/import-kit.tsx](../../Q-Works/components/shared/import-kit.tsx) | `RowLink` <br> [components/row-link.tsx](../../DHR/components/row-link.tsx)<br>`TwoLine` <br> [components/table.tsx](../../DHR/components/table.tsx) | CSS 정본<br>[07-screens.md](07-screens.md)<br>[08-paper.md](08-paper.md) | qd-row는 괘선 항목의 기준이다. 모바일 카드 행·정의 목록·표 링크의 의미는 서로 달라 클래스 한 개로 전부 대체하지 않는다. Atelier 의 이름 · 값 목록은 2026-10-15 오너 결정(용어집 시안 A)으로 Ledger(dl) 안의 DetailRow 장부 두 칸이다. |
| 목록 + 상세(연속 검토) | `ListDetail` · `ListDetailGroup` · `ListDetailRow` · `ListDetailHead` · `ListDetailNav` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx) | 공용 래퍼 미등록 | 공용 래퍼 미등록 | 제품 전용<br>[reference/reference-sites.md](reference/reference-sites.md)<br>[patterns/foundation/atelier.css](../patterns/foundation/atelier.css) | 2026-10-15 오너 결정(용어집 시안 C). 담긴 자리가 700 이상이면 왼쪽 목록 · 오른쪽 상세, 좁으면 한 칸씩(← 목록). 상세 한 장은 상세 칸을 채우다 1040 에서 멈춰 가운데에 섭니다(2026-10-20 · 종전 680 왼쪽 붙음은 설정 · 멤버의 오른쪽 절반을 비웠다). 선택은 면 색 + 굵은 제목. 무엇을 고르고 무엇을 결정하는지(결재 서명 · 용어 풀이)는 제품이 유지한다. |
| 폼 구역·행동 묶음 | `FormSection` · `Section` · `FormActions` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx)<br>`DangerZone` <br> [components/DangerZone.tsx](../../Q-Atelier/components/DangerZone.tsx) | `EditableCard` <br> [components/shared/editable-card.tsx](../../Q-Works/components/shared/editable-card.tsx)<br>`RowsEditor` <br> [components/shared/rows-editor.tsx](../../Q-Works/components/shared/rows-editor.tsx)<br>`NewRecordPanel` <br> [components/shared/new-record-panel.tsx](../../Q-Works/components/shared/new-record-panel.tsx)<br>`BatchSaveBar` <br> [components/shared/batch-save-bar.tsx](../../Q-Works/components/shared/batch-save-bar.tsx)<br>`ImportRules` · `ImportCommitBar` <br> [components/shared/import-kit.tsx](../../Q-Works/components/shared/import-kit.tsx) | `Panel` · `Field` <br> [components/ui.tsx](../../DHR/components/ui.tsx) | 패턴<br>[07-screens.md](07-screens.md) | Atelier는 FormSection과 FormActions, Maison은 편집 패널·행 편집기·일괄 저장, Carnet은 Panel과 Field 조합이다. 공통 제목·입력 외형을 사용해도 업무 동작은 제품 전용이다. |
| 단계·결재 표시 | `StageTimeline` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx)<br>`StageTrack` <br> [components/StageTrack.tsx](../../Q-Atelier/components/StageTrack.tsx)<br>`ApprovalRoute` · `RouteNode` <br> [components/ApprovalRoute.tsx](../../Q-Atelier/components/ApprovalRoute.tsx) | `StepProgress` <br> [components/shared/step-progress.tsx](../../Q-Works/components/shared/step-progress.tsx)<br>`ApprovalFlow` <br> [components/shared/approval-flow.tsx](../../Q-Works/components/shared/approval-flow.tsx) | 공용 래퍼 미등록 | CSS 정본<br>[08-paper.md](08-paper.md)<br>[patterns/components.css](../patterns/components.css) | 중앙 qd-step의 글자·현재 단계 상태를 사용한다. Maison StepProgress의 완료·생략·현재 단계 표시와 ApprovalFlow의 결재 데이터 해석은 제품 어댑터다. 동일한 결재 엔진을 세 제품에 배포하지 않는다. |
| 패널·카드·격자 | `Bx` · `Card` · `SectionCard` · `Panel` · `Grid` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx) | `Card` · `CardHeader` · `CardContent` · `CardFooter` · `CardTitle` · `CardDescription` <br> [components/ui/card.tsx](../../Q-Works/components/ui/card.tsx) | `Panel` <br> [components/ui.tsx](../../DHR/components/ui.tsx) | CSS 정본<br>[07-screens.md](07-screens.md)<br>[04-space-layout.md](04-space-layout.md)<br>[patterns/components.css](../patterns/components.css) | Maison Card·CardHeader·CardTitle·CardDescription·CardContent·CardFooter는 중앙 qd-card 외형에 연결한다. 카드 · 판의 기본 외형은 위 괘선 하나다(2026-10-23 «3» · [8장](08-paper.md)). 기존 qd-panel과 제품별 Grid·반응형 배치를 동일한 컴포넌트 구현으로 간주하지 않는다. |
| 현장 숫자판 | 공용 래퍼 미등록 | 공용 래퍼 미등록 | `NumPad` · `PresetPicker` <br> [components/num-pad.tsx](../../DHR/components/num-pad.tsx) | 제품 전용 | Carnet 현장 입력 전용 공용 부품이다. 물리적 숫자 배열·빠른 수량 선택을 일반 폼 입력과 합치지 않는다. |
| 파일 선택 | `FilePickButton` <br> [components/FilePickButton.tsx](../../Q-Atelier/components/FilePickButton.tsx) | `ImportFilePicker` <br> [components/shared/import-kit.tsx](../../Q-Works/components/shared/import-kit.tsx) | 공용 래퍼 미등록 | 제품 전용<br>[patterns/components.css](../patterns/components.css) | Atelier FilePickButton과 Maison ImportFilePicker는 공용 행동 외형에서 native 파일 선택기를 연다. 허용 형식·파싱·미리보기·업무 검증은 각 제품 어댑터와 호출 화면이 소유한다. |
| 계층 목록 탐색 | 공용 래퍼 미등록 | `ClauseTree` <br> [components/shared/clause-tree.tsx](../../Q-Works/components/shared/clause-tree.tsx) | 공용 래퍼 미등록 | 제품 전용<br>[patterns/components.css](../patterns/components.css) | Maison 조항 트리는 업무 계층·펼침·다중 선택을 유지한다. 글자·모서리·상태색은 공유 토큰을 받지만 트리 배치와 업무 동작을 공통 트리 엔진으로 이행한 것은 아니다. |
| 문서 변경 비교 | 공용 래퍼 미등록 | `RevisionDiff` <br> [components/shared/revision-diff.tsx](../../Q-Works/components/shared/revision-diff.tsx) | 공용 래퍼 미등록 | 제품 전용<br>[patterns/components.css](../patterns/components.css) | Maison 개정 비교는 추가·삭제 상태에 테마별 의미색을 사용한다. 변경 계산·비교 문구는 제품 어댑터 책임이며 인쇄 문서의 지면 규칙과 구분한다. |
| 내용 구분선 | `Div` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx) | 공용 래퍼 미등록 | 공용 래퍼 미등록 | 패턴 | Atelier Div는 내용 구역 사이의 얇은 선이다. 판이나 조작부의 윤곽과 구분하며 색은 구분선 토큰을 따른다. |
| 펼침과 등장 | `Collapse` · `Reveal` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx) | 공용 래퍼 미등록 | 공용 래퍼 미등록 | 패턴 | Atelier Collapse는 접힌 내용의 inert 상태와 높이 전환, Reveal은 등장 동작을 담당한다. 업무 상태와 데이터는 바꾸지 않으며 동작 감소 설정과 초점 접근을 별도로 확인한다. |
| 문장 의미와 강조 | `En` · `InlineStrong` <br> [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx) | 공용 래퍼 미등록 | 공용 래퍼 미등록 | 패턴 | Atelier En의 언어 지정과 InlineStrong의 부분 강조는 읽기 의미를 유지하는 텍스트 어댑터다. 전체 문장을 장식용 대문자나 별도 색으로 바꾸지 않는다. |
| 사용자 사진과 이름 표시 | `Avatar` <br> [components/Avatar.tsx](../../Q-Atelier/components/Avatar.tsx) | 공용 래퍼 미등록 | 공용 래퍼 미등록 | 패턴 | Atelier Avatar는 저장된 사진을 사용하고 없거나 읽지 못하면 머리글자를 표시한다. 공식 제품 로고와 구분한다. 사진 조회·대체 문구·크기 인자는 제품 어댑터에 남는다. |

«공용 래퍼 미등록» 은 그 제품에 대응하는 공용 래퍼가 등록되지 않았다는 뜻입니다. 화면의 네이티브 구현이 없다는 뜻이 아닙니다. 제품 전용 조합도 규칙 계열의 검사 대상입니다.

---

## 바꾸는 절차

언제 시안을 먼저 받는지, 걸음마다 무엇을 재야 끝났다고 보는지는 [10장 «고치고 키우는 흐름»](10-rules.md)에 있습니다. 이 절은 명령만 적습니다.

1. **고칠 원본을 고릅니다.** 위 «원본과 책임» 표대로입니다. 부품 치수 · 상태는 `patterns/components.css`, 기반은 `patterns/foundation.css` · `patterns/foundation/`, 화면 색은 `patterns/palette-overrides.json` · `patterns/palette-mappings.json`, 업무 화면 조합은 `patterns/workspace.css`, 마크업 · 접근성은 `patterns/component-implementations/` 입니다.
2. **Q-Design 안에서 만들고 맞춰 봅니다.** 명령은 `D:/Claude/Q-Design` 에서 실행합니다.

   ```powershell
   node tools/extract-all.mjs            # 산출물을 Q-Design 안에서 다시 만듭니다
   node tools/check.mjs                  # 검사 하나: 다시 만들어 저장본과 대조 · 사본 대조 · 남긴 시험(아무것도 안 씀)
   ```

3. **제품으로 내보냅니다.**

   ```powershell
   node tools/extract-all.mjs --sync --only=Q-Atelier,Q-Works,Q-Forge
   node tools/status.mjs
   ```

제품 사본은 손으로 고치지 않습니다. 제품 저장소에 쓰는 길은 `node tools/extract-all.mjs --sync` 하나입니다(군살 빼기 결정 3, 2026-10-16). 어느 조각이 어느 제품 파일로 가는지는 [tools/sync-parts.mjs](../tools/sync-parts.mjs) 가 정합니다.

내보낼 때 제품마다 판 파일 `q-design.version.json` 을 함께 씁니다. 제품 시험이 «내 사본의 지문 = 판 파일» 을 대조하므로, 사본을 손으로 고치면 제품 시험이 실패합니다.
2026-10-22 부터 판 파일은 공용 부품 파일(기본 UI 구현)의 확인값도 듭니다. 제품에서 부품 파일을 고치면 제품 시험이 실패하고, 내보내기는 그 파일을 덮지 않고 멈춥니다. 급해서 제품에서 먼저 고쳤으면 커밋한 뒤 `node tools/build-component-implementations.mjs --adopt --only=제품` 으로 정본에 받고 다시 내보냅니다. `node tools/status.mjs` 는 제품마다 판 파일이 지금 정본과 같은지, 제품 사본과 같은지, 원격 main 에 올라갔는지를 봅니다. 파일을 복사한 것만으로 적용이 끝났다고 판단하지 않습니다.

- `extract-all` 은 맨 앞에서 `source/` 를 원본 저장소의 커밋된 내용으로 다시 맞춥니다. 커밋하지 않은 제품 수정을 전달하는 데 쓰지 않습니다.
- 제품의 CSS 변수 변경은 로드된 CSS 로 바로 적용되고, Tailwind preset 과 정적 인쇄 값 변경은 제품 빌드를 거쳐 적용됩니다. 설치 앱에 들어가는 변경은 재빌드 · 서명 · 배포가 필요합니다.
- 팔레트 생성기는 알려진 토큰만 받고 본문 대비와 조작 윤곽 대비를 검사합니다. 팔레트 시험(`tools/palette.test.mjs`)은 중앙값 변경의 세 제품 전파, 기존 제조사 계산, HSL 변환, 인쇄 분리를 봅니다. 제품 상태색의 모든 조합과 실제 CSS 우선순위는 따로 확인합니다.

**공개 부품은 역할을 먼저 등록합니다.** [source/component-public-api.json](../source/component-public-api.json) 의 범위는 Atelier 의 `lib/design/components.tsx` 와 `segmented-choice.tsx`, Maison 의 `components/ui/` 전체(새 파일과 하위 폴더 포함)와 명시한 shared 파일, Carnet 의 명시한 공용 원시 부품 파일입니다. 이 범위에서 새 JSX 반환 함수 · 래퍼 · 별칭 · 기본 export 를 공개하면 실제 뜻에 맞는 역할을 등록부와 `source/component-roles.json` 에 먼저 적습니다. 이름이 소문자인 공개 렌더 보조 함수도 포함합니다. 내부 함수는 등록을 강제하지 않습니다. 예외는 `file`, `symbol`, `reason` 을 가진 정확한 부품 한 개로만 두며, 와일드카드 · 파일 전체 면제 · 이유 없는 면제 · 사라진 부품의 면제는 받지 않습니다. 지금 등록 면제는 없습니다. 이 등록을 자동으로 막는 도구는 지금 없으므로, 바꾸는 사람이 등록부와 함께 확인합니다. 범위 밖 업무 조합은 규칙 분류에 남고, 새 공용 라이브러리를 만들 때는 범위 확장을 함께 검토합니다.

**공용 부품의 추가 · 이름 변경 · 삭제, 새 예외, 중앙 값을 덮는 로컬 규칙**은 등록부의 변경으로 검토합니다. 실제 부품을 가져오는 [세 제품 검증 예제](../preview/fixtures/)에서 좁은 화면과 넓은 화면, 밝은 테마와 어두운 테마, 사용 불가 · 오류 · 선택 · 키보드 상태를 확인합니다. 정적 검사가 통과해도 브라우저에서 적용 순서와 넘침을 확인합니다.

---

## 확인한 사실과 따로 확인할 사실

| 증거 | 확인하는 것 | 대신하지 못하는 것 |
| --- | --- | --- |
| 규칙 계열 | 어떤 기준으로 검토할 부품인지 | 규칙의 실제 준수 |
| 클래스 · 토큰 참조 | 공용 원본에 연결된 소스 | CSS 우선순위와 화면 결과 |
| 공용 import | 직접 · 간접 의존 경로 | 런타임 분기와 동적 로딩 |
| 사본 지문 · 판 파일 | 원본과 제품 사본의 일치 | 그 CSS 를 실제로 쓰는지 |
| 앱 진입점 연결 | 앱에서 닿는 정적 import 경로 | 사용자가 열 수 있는 모든 조건 |
| 실제 부품 예제 | 확인한 화면 폭 · 테마 · 조작 결과 | 전체 업무 화면의 종단 검증 |
| 제품 시험 | 시험에 든 동작의 회귀 | 운영 데이터 · 권한 · 인쇄의 모든 조합 |

분류 수나 import 수를 전체 디자인 준수율로 내보이지 않습니다. 제품 전용 조합이라는 분류는 시각 규칙 예외를 자동으로 승인하는 표시가 아닙니다.

---

## 식별과 허용되는 차이

공식 제품 식별은 Atelier 은색, Maison 샴페인 골드, Carnet 구리색을 지킵니다. 근거는 [브랜드 자산 기준](../../marketing-operations/brand/BRAND_ASSETS.md)과 [07-screens.md](07-screens.md) 의 업무 화면 제품 식별입니다. 제품 금속색과 업무 UI 의 따뜻한 공통 강조색은 다른 축이며, 모든 상태색과 주 버튼을 제품 금속색으로 바꾸지 않습니다.

OS 선택기, native 날짜 입력, 파일 선택, 권한 · 계산 · 결재 · 저장, 인쇄 기록서의 판형 · 쪽 넘김 · 서명칸 · 바코드는 허용되는 제품 차이입니다. 예외에는 대상 · 범위 · 이유 · 확인 근거를 적습니다. 읽을 수 없는 글자, 초점 손실, 누르는 자리 부족, 등록 누락은 예외로 정당화하지 않습니다.

---

## 부록 · 전역 CSS

아뜰리에는 스타일이 인라인 위주라, 전역 CSS 는 인라인으로 나타낼 수 없는 것만 맡습니다. 호버 · 초점 · 미디어 쿼리 · 키프레임 · 의사 요소 · 인쇄입니다.

### 어디에 있나

제품의 `app/globals.css` 는 이제 Q-Design 사본 네 개를 가져오기만 합니다(`source/css/globals.css` 다섯 줄).

```css
@import './q-design.foundation.css';
@import './q-design.workspace.css';
@import './q-design.components.css';
@import './q-design.palette.css';
```

예전의 전역 규칙은 [patterns/foundation/atelier.css](../patterns/foundation/atelier.css) 에 있고(`qa-*` 클래스와 키프레임), 공통 기반 [patterns/foundation.css](../patterns/foundation.css) 와 함께 `tools/build-foundation.mjs` 가 `dist/q-design.foundation.atelier.css` 로 묶습니다. 제품은 이것을 `app/q-design.foundation.css` 로 받습니다.

| 다루는 것 | 있는 곳 |
|---|---|
| 팔레트 · 인쇄 팔레트 | [02-color.md](02-color.md) |
| 글꼴 로딩(self-host) | [03-typography.md](03-typography.md) |
| 레이아웃 클래스 · 표시 토글 · 화면별 1열 접기 · 가로 스크롤 표 | [04-space-layout.md](04-space-layout.md) |
| 초점 · 호버 · 카드 리프트 · 배경막 · 움직임 클래스 · 키프레임 · 동작 줄이기 | [05-shape-elevation-motion.md](05-shape-elevation-motion.md) |
| 부품 상태 · 리셋 · 색 스킴 · select 화살표 · 인쇄 배치 | 이 부록 |

### 리셋

```css
* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;   /* 모바일 회색 하이라이트 제거 */
}
@layer q-design-reset { * { margin: 0; padding: 0; } }
```

탭 하이라이트를 지우는 대신 `:focus-visible` 과 `:active` 로 명시적으로 나타냅니다. 지우기만 하고 대체하지 않으면 모바일에서 «눌렸는지 모르겠다» 가 됩니다.

```css
html { transition: background-color 0.2s ease, color 0.2s ease; }
```

테마를 바꿀 때 색이 0.2초에 걸쳐 넘어갑니다.

### 색 스킴 선언

```css
:root { color-scheme: dark; }
html[data-theme='light'] { color-scheme: light; }
```

이 선언으로 네이티브 폼 컨트롤(날짜 선택기 · select 드롭다운 · 스크롤바)이 앱 테마를 따라갑니다. 부품마다 `colorScheme` 을 인라인으로 넣는 대신 전역 한 곳에 둡니다.

### 부품 상태 클래스

| 클래스 | 역할 |
|---|---|
| `.qa-input` | radius 10 · hover 테두리 muted · focus 금테 + 배경 한 겹 + 3px 글로우 · 전환 160ms |
| `.qa-btn` · `.qa-btn-secondary` | radius 10 · 호버와 누름 표시는 [05-shape-elevation-motion.md](05-shape-elevation-motion.md) |
| `.qa-nav-item` | 배경 · 글자 · 테두리 120ms |
| `.qa-row-clickable` | 누를 수 있는 괘선 줄. hover 시 `surface2` |
| `.qa-avatar` | 원형 · champagne 22% 섞은 바탕 · weight 600 |
| `.qa-link` | 금색 + 1px 밑줄(champagne 40%, hover 시 진해짐) |
| `.qa-mark` | 검색어 강조 (금 25%) |
| `.qa-tabular` | `font-variant-numeric: tabular-nums` |
| `.qa-easing` | ease-out expo 곡선만 지정 |
| `.qa-top-progress` · `.qa-skeleton` · `.qa-mag-divider` | 위 부품 치수 절 |
| `.qa-skip-link` | 위 «건너뛰기 링크» |

### select 화살표

```css
select.qa-input {
  appearance: none;
  background-image: url("data:image/svg+xml,…stroke='%23b8935a'…");
  background-position: right 12px center;
  background-size: 10px 6px;
  padding-right: 32px !important;
}
```

data URI 는 `var()` 를 받지 못해 테마별로 네 벌(다크 기본 · 다크 hover · 라이트 기본 · 라이트 hover)이 있습니다. 라이트에서 다크용 금색은 흰 입력칸 위 2.6:1 로 흐릿해 라이트는 `#8a6838` 을 씁니다.
`Sel` 처럼 `qd-input` 을 함께 단 select 는 공용 규칙(`select.qd-input`, `!important`)이 이 화살표를 걷고 OS 화살표를 씁니다.

> 옮겨 쓸 때 흔히 놓치는 지점입니다. SVG 아이콘을 CSS 배경으로 쓰면 테마를 따라가지 못합니다.
> `mask-image` + `background-color` 로 바꾸면 변수를 쓸 수 있습니다.

### 인쇄 배치

인쇄 팔레트(값 11개)와 `@page` 여백은 [02-color.md](02-color.md) 에 있습니다. 여기는 배치와 워터마크 규칙입니다.

```css
@media print {
  :root { color-scheme: light !important; }          /* 어두운 테마에서도 종이 여백이 검게 찍히지 않게 */
  aside.qa-sidebar-aside, .qa-coachmark, .qa-skip-link, .qa-top-progress,
  [aria-hidden='true']:not(.qa-print-watermark), button { display: none !important; }
  .qa-app-root { height: auto !important; max-height: none !important; overflow: visible !important; display: block !important; }
  main.qa-main-content { height: auto !important; overflow: visible !important; padding: 24px 0px !important; }
  .qa-scroll-table { overflow: visible !important; background: none !important; zoom: var(--qa-print-zoom, 1); }
  nav[data-mobile-tabbar], .qa-mobile-tabbar { display: none !important; }
  .qa-card-lift { transform: none !important; box-shadow: none !important; }
  body::after {                                       /* 매 쪽 하단 워터마크 */
    content: 'Q-Atelier · Medical Device Regulatory Workspace · Crafted with Q-Atelier';
    position: fixed; bottom: 8mm; left: 16mm; right: 16mm; text-align: center;
    font-size: 8pt; color: #8a6a3a;
    font-family: 'JetBrains Mono', monospace; letter-spacing: 1.5px;
    border-top: 0.5pt solid #d4d0c8; padding-top: 4mm;
  }
  .qa-card-lift, table, .qa-mag-divider { break-inside: avoid; }
  h1, h2, h3 { break-after: avoid-page; }
  a { color: #1a1814 !important; text-decoration: none !important; }
  .qa-ribbon-layer-1, .qa-ribbon-layer-2 { display: none !important; }
}
```

- 핵심은 셸 뿌리(`.qa-app-root`)와 `main` 의 `height: auto` + `overflow: visible` 입니다. 앱 셸이 `100dvh` + `overflow: hidden` 을 인라인으로 들고 있어, 뿌리부터 풀지 않으면 첫 화면 한 장만 인쇄됩니다. 스크롤 컨테이너를 쓰는 모든 앱이 겪는 문제입니다.
- `main` 의 좌우 여백을 0 으로 둡니다. `@page` 여백이 이미 있어 두 번째 여백이 되기 때문입니다. 값(세로 24px · 좌우 0)은 아뜰리에 출력 규칙 `source/design/atelier-output.ts` 에서 옵니다.
- 종이에는 가로 스크롤이 없습니다. 넓은 표를 감싸개만 풀면 오른쪽이 잘렸다는 표시도 없이 사라지므로, `ScrollTable` 이 `--qa-print-zoom` 배율을 실어 보내 통째로 줄입니다.
- 아래 탭줄은 링크라 `button` 규칙에 걸리지 않으므로 따로 숨깁니다.
- `break-inside: avoid` 로 카드가 쪽 경계에서 잘리지 않게 하고, 제목 뒤에 한 줄만 남는 것을 막습니다.
