# 세 제품 컴포넌트 규칙과 연동

2026-10-10. Q-Atelier, Q-Maison, Q-Carnet의 공용 UI 규칙을 Q-Design에서 관리하고 실제 제품 어댑터에 연결한다. [인계서 6절](28-handoff-to-codex-2026-10-10.md)의 기록부 우선 범위는 같은 날 오너가 요청한 세 제품 정밀 감사와 실제 통일 작업으로 확대되었다. 기존의 10px 모서리, C안 구역 제목, 정보 팝오버, 글자 행동, 금속색 제품 식별은 유지한다.

규칙 등록, 소스 연결, 실제 화면 검증은 별도의 증거다. 이 문서는 모든 화면의 공통화나 운영 배포가 끝났다는 선언이 아니다. 컴포넌트 외형은 중앙에서 바꾸고 권한·계산·검증·조회·저장·결재는 각 제품이 유지하는 구조를 설명한다.

## 원본과 책임

| 대상 | 수정할 원본 | 제품에서 받는 것 |
| --- | --- | --- |
| 공용 부품의 치수·글자·모서리·표면·상태·모션 | [patterns/components.css](../patterns/components.css) | 각 제품의 `app/q-design.components.css` |
| 로그인·배경·전역 글자·공통 화면 기반 | [patterns/foundation.css](../patterns/foundation.css), [제품별 기반 규칙](../patterns/foundation/) | 각 제품의 `app/q-design.foundation.css` |
| Maison 전체 유틸리티 스케일 | [maison-tailwind.ts](../patterns/foundation/maison-tailwind.ts) | `lib/design/q-design-tailwind.ts`, 제품 설정은 이 preset을 가져온다. |
| Maison 인쇄·문서·QR·엑셀 외형 | [maison-print.ts](../patterns/foundation/maison-print.ts), [maison-print-styles.tsx](../patterns/foundation/maison-print-styles.tsx) | `qdPrint`의 명시된 값과 공용 인쇄 CSS 사본 |
| 공통 화면 팔레트 | [patterns/palette-overrides.json](../patterns/palette-overrides.json) | 각 제품의 `app/q-design.palette.css` |
| 팔레트 변수·테마·예외 연결 | [patterns/palette-mappings.json](../patterns/palette-mappings.json), `tools/build-palette.mjs` | Atelier `--qa-*`, Maison HSL 채널, Carnet `--dhr-*` |
| 업무 화면 조합 | [patterns/workspace.css](../patterns/workspace.css) | 각 제품의 `app/q-design.workspace.css` |
| 차림표·목록·화면 뼈대 | 기존 추출기와 커밋된 원본 사본 | `q-design.nav.css`, `q-design.list.css`, `q-design.screen.css` |
| 규칙 계열 | [source/component-rules.json](../source/component-rules.json) | 전수 목록의 분류와 검토 기준 |
| 공용 부품 역할과 예외 | [source/component-roles.json](../source/component-roles.json) | [실제 구현 역할표](29-component-registry.md) |
| 수동 등록을 강제하는 공개 API 범위 | [source/component-public-api.json](../source/component-public-api.json) | 새 공개 부품·등록 삭제 검사 |
| 전체 파일·컴포넌트 목록 | `tools/component-registry.mjs` | [JSON 목록](../dist/q-design.components.json), [전체 검토표](31-component-inventory.md) |
| 개별 스타일 인자와 경계 | `tools/style-arguments.mjs`, [제품 연결 기록](../source/style-adapters/) | [스타일 인자 목록](../dist/q-design.style-arguments.json) |
| 내보내는 조각과 목적지 | [tools/sync-parts.mjs](../tools/sync-parts.mjs) | 원본 지문을 가진 제품 사본 |
| 제품의 데이터와 동작 | 제품 저장소의 컴포넌트와 업무 코드 | 기존 API, native 컨트롤, 라우팅과 업무 상태 |

새 공용 컴포넌트 치수와 상태를 바꿀 때는 `patterns/components.css`가 수정 지점이다. 공통 화면 색상은 `patterns/palette-overrides.json`의 `shared.dark`와 `shared.light`를 수정한다. 제품의 생성 CSS를 손으로 수정하지 않는다.

`source/components`, `source/screens`, `source/tokens`는 기존 Q-Atelier 커밋에서 가져오는 사본이므로 직접 편집할 새 원본으로 취급하지 않는다. `dist/q-design.tokens.css`와 JSON은 기존 팔레트 기준값을 추출한 생성물이다. 팔레트 생성기는 이 기준값에 Q-Design 소유의 override와 제품 매핑을 적용하므로, 원본을 다시 추출해도 중앙 색상 변경이 유지된다. 엔진 검증 근거인 제품 `tokens.ts`와 잠금 파일을 스타일 변경 수단으로 수정하지 않는다. 상세한 변수 대응과 예외는 [화면 팔레트 정본](33-palette-canon.md)을 따른다.

제품은 기존 테마를 `--qd-*-src`에 연결한다. Maison의 HSL 상태색과 Carnet의 테마 변수처럼 표현 방식이 달라도 공용 부품은 `--qd-text`, `--qd-surface`, `--qd-ctl` 같은 역할 이름을 사용한다. 이 연결부를 임의의 고정색으로 덮으면 중앙 변경이 끊긴다.

Maison의 기존 Tailwind `brand`, `status`, `severity` 23색도 생성된 `--qw-legacy-*` HSL 채널을 받는다. 기존 이름, 원본 테마의 의미와 `/15` 같은 투명도는 유지한다. Carnet의 제조사 맞춤 강조색은 제품이 계산한 `--qd-company-brand*`를 우선하며, 기본 제조사색은 중앙 팔레트를 받는다. 생성 팔레트의 공통 색상 변경은 화면에 적용하고, 인쇄와 Carnet 기록서의 별도 팔레트는 보존한다. Maison의 새 호환 변수는 인쇄에서도 유효하도록 기존 기준값을 별도 출력한다.

제품 경로는 Atelier가 `D:/Claude/Q-Atelier`, Maison이 `D:/Claude/Q-Works`, Carnet이 `D:/Claude/DHR`이다. 내보내기 명령의 Carnet 키는 기존 이름인 `Q-Forge`를 사용한다.

## 공용 규칙

| 항목 | 기준 |
| --- | --- |
| 바깥 모서리 | 카드·버튼·입력·팝오버·대화상자 10px. `--qd-radius`를 사용한다. |
| 제목 | 구역 C안 16px 본문색 굵은 글자와 금색 모노 번호. 대화상자 제목 18px, 화면 제목의 공용 기준 22px. |
| 글자 | 본문 14px, 보조 글자 12px, 일반 조작 글자 13px. 기존 인쇄 규칙과 구분한다. |
| 조작 영역 | 기본 44px. 조밀한 데스크톱 버튼은 36px 변형을 사용할 수 있으며 거친 포인터에서는 44px를 확보한다. 아이콘·닫기·달력 날짜·체크 클릭 영역은 44px를 기준으로 한다. |
| 현장 조작 예외 | Carnet `.touch`의 장갑 조작은 56px 이상을 유지한다. 관리 화면의 44px 규칙으로 줄이지 않는다. |
| 체크 표시 예외 | native 입력의 44px 클릭 영역 안에 16px 표시를 둔다. 표시의 4px 반경은 작은 기호의 예외이며 일반 조작부 반경을 바꾸지 않는다. |
| 작은 표시 예외 | Maison의 기존 비조작 배지·도식 표지는 6px를 유지한다. 높이 14px인 달력 일정 막대 두 곳은 기존 범위에 한해 6px 예외이며 `choice-chip-shape.test.ts`가 새 조작부의 예외 유입을 막는다. |
| 윤곽 | 조작 윤곽 `--qa-ctl`·`CTL`과 이를 받는 `--qd-ctl`은 구분선과 별개다. 조작부와 바탕의 3:1 대비를 유지한다. |
| 선택 상태 | 옅은 면·굵은 글자로 표현한다. 주 행동 버튼의 반전 면과 역할을 구분한다. |
| 표면과 설명 | 모달·서랍·팝오버는 불투명 면이다. 유리 효과와 왼쪽 강조선을 사용하지 않는다. 일반 설명은 정보 팝오버, 조치가 필요한 오류는 화면에 남는 안내로 둔다. |
| 보조 행동 | 돌아가기·닫기·더 보기·수정은 의미에 맞는 글자 행동을 사용한다. 보이지 않는 아이콘만 두면 접근 가능한 이름을 제공한다. |
| 움직임 | 빠른 상태 변화 160ms, 일반 전환 200ms와 중앙 이징을 사용한다. 동작 감소 설정에서 반복 로딩·오버레이 전환을 줄인다. |

표의 숫자는 공용 토큰의 현재 기본값이다. 화면 안에 같은 숫자를 다시 적는 대신 토큰이나 공용 클래스를 사용한다. 날짜 격자의 7열, 숫자판의 배열, 인쇄 표의 치수처럼 역할상 고정 구조가 필요한 곳은 별도로 등록한다.

## 제품 어댑터가 유지하는 동작

Atelier의 React 부품, Maison의 CVA·Radix 래퍼, Carnet의 native HTML과 현장 조합을 하나의 React API로 교체하지 않는다. 같은 역할의 외형을 중앙 규칙에 연결한다. Maison `Dialog`의 초점 가두기와 Escape, `Checkbox`의 native 폼 전송, `Combobox`의 검색·키보드 이동, 달력의 날짜 계산은 해당 제품이 유지한다.

Maison `Sheet`의 열리는 방향은 제품 어댑터가 정한다. 어느 방향이든 높이를 동적 뷰포트 이내로 제한하고 긴 내용은 서랍 안에서 스크롤한다. 내용이 많은 위·아래 서랍도 화면 밖에 남지 않아야 한다.

기존 배지·표·탭·페이지 머리와 함께 대화상자, 서랍, 툴팁, 알림, 진행, 스켈레톤, 카드, 선택, 달력, 체크 표시에 공용 클래스를 제공한다. 제품별 적용 위치와 남은 차이는 역할표에서 확인한다. 전용 숫자판, 문서 변경 비교, 계층 트리와 같은 업무 조합은 공용 토큰을 받더라도 제품 전용 책임을 유지한다.

Maison의 18개 `components/ui` 파일은 공개 렌더 부품을 역할표에 포함한다. `DialogTrigger`, `DialogClose`, `DialogPortal`, `DialogOverlay`처럼 자체 JSX가 없는 라이브러리 어댑터도 빠뜨리지 않는다. 금액 입력처럼 `Input`을 감싸는 부품은 간접 연결로 확인한다. 함수 이름만으로 공용 외형 사용을 단정하지 않는다.

## 갱신과 검사

로그인, 배경, 셸, 전역 글자와 간격은 공용 기반과 제품별 recipe가 함께 소유한다. Maison의 `globals.css`는 가져오기와 Tailwind 지시문만 두고, Tailwind 설정은 중앙 preset을 읽는다. 표준 유틸리티가 중앙 설정을 받는다는 사실과 각 화면의 임의 값까지 검토했다는 사실을 구분한다. 별도의 스타일 인자 목록이 인라인 객체, 임의 유틸리티, SVG 속성, 동적 계산과 내장 CSS를 남긴다.

Maison의 화면 작은 글자는 공용 보조 글자 규칙에 연결하고, 업무 트리의 깊이는 데이터로 유지하면서 들여쓰기 단위는 중앙 변수로 받는다. 인쇄·문서 외형은 기존 mm·pt 값 그대로 `qdPrint`와 공용 인쇄 소스로 옮겼다. 종이 규격, 내용에 따른 표 폭, 페이지 분할 계산과 QR 인코딩은 별도 역할이며, 색·글꼴·간격 전체를 예외로 처리하는 근거가 아니다.

기반과 Maison 유틸리티·인쇄 원본을 수정한 뒤에는 아래처럼 생성하고 내보낸다. 제품의 CSS 변수 변경은 로드된 CSS를 통해 적용되고, Tailwind preset과 정적 인쇄 값 변경은 제품 빌드를 통해 적용된다.

```powershell
node tools/build-foundation.mjs
node tools/build-foundation.mjs --check
node tools/sync.mjs --write --part="기반 메종" --only=Q-Works
node tools/sync.mjs --write --part="메종 유틸리티" --only=Q-Works
node tools/sync.mjs --write --part="메종 출력 인자" --only=Q-Works
node tools/sync.mjs --write --part="메종 출력 스타일" --only=Q-Works
node tools/style-arguments.mjs --write
node tools/style-arguments.mjs --check
```

공용 부품 CSS 변경은 Q-Design에서 한 번 고친 뒤 해당 조각을 세 제품에 내보낸다. 명령은 `D:/Claude/Q-Design`에서 실행한다.

```powershell
node tools/sync.mjs --write --part=컴포넌트 --only=Q-Atelier,Q-Works,Q-Forge
node tools/sync.mjs --part=컴포넌트 --only=Q-Atelier,Q-Works,Q-Forge
node tools/component-registry.mjs --write
node tools/component-registry.mjs --check
```

첫 명령은 제품 사본을 갱신한다. 둘째는 원본과 사본이 같은지 확인한다. 기록부의 `--write`는 중앙 JSON과 문서 목록을 갱신하고, `--check`는 기록된 파일·심볼·정적 연결·사본과 실제 소스의 차이를 확인한다. 기록부 명령 자체가 제품을 운영 배포하지는 않는다.

`--write`와 `--check` 모두 공개 부품의 수동 역할 등록 검사를 먼저 통과해야 한다. 검사 범위는 역할표와 별도로 고정하므로, 한 파일의 마지막 역할을 지워도 검사 대상에서 사라지지 않는다. 현재 범위는 Atelier의 `lib/design/components.tsx`와 `segmented-choice.tsx`, Maison의 `components/ui/` 전체와 명시된 shared 파일, Carnet의 명시된 공용 원시 부품 파일이다. Maison `components/ui/` 아래 새 파일과 하위 폴더도 자동으로 검사한다.

이 범위에서 새 JSX 반환 함수·래퍼·별칭·기본 export를 공개하면 실제 의미에 맞는 역할을 먼저 등록해야 한다. 이름이 소문자인 공개 렌더 보조 함수도 포함한다. 내부 함수는 전수 목록에 기록하지만 공개 역할 등록을 강제하지 않는다. 예외는 `file`, `symbol`, `reason`을 갖는 정확한 부품 한 개로만 지정하며, 와일드카드·파일 전체 면제·이유 없는 면제·사라진 부품의 면제는 거부한다. 현재 등록 면제는 없다. 범위 밖 업무 조합은 전수 목록과 규칙 분류에 남으며, 새 공용 라이브러리를 만들 때는 검사 범위 확장을 함께 검토한다.

공통 화면 팔레트 변경은 override를 수정한 뒤 생성·대비 검사·제품별 배포를 실행한다. 생성기는 알려진 토큰만 허용하며 본문 대비와 조작 윤곽 대비를 검사한다. 제품 상태색의 모든 조합과 실제 CSS 우선순위는 별도 확인이 필요하다.

```powershell
node tools/build-palette.mjs
node tools/build-palette.mjs --check
node --test tools/palette.test.mjs tools/maison-palette.test.mjs
node tools/sync.mjs --write --part="팔레트 아뜰리에"
node tools/sync.mjs --write --part="팔레트 메종"
node tools/sync.mjs --write --part="팔레트 카르넷"
node tools/sync.mjs --part="팔레트 아뜰리에"
node tools/sync.mjs --part="팔레트 메종"
node tools/sync.mjs --part="팔레트 카르넷"
node tools/component-registry.mjs --write
node tools/component-registry.mjs --check
```

팔레트 시험은 중앙값 변경의 세 제품 전파, 기존 제조사 계산, HSL 변환, 인쇄 분리를 확인한다. Maison 전용 시험은 실제 `globals.css` 가져오기 경로와 Tailwind 설정을 컴파일해 기존 업무 클래스의 색상과 투명도에 변경이 도달하는지도 확인한다. 제품 저장소의 정본 사본 검사는 본문 지문과 앱 진입점의 CSS 연결을 확인한다. 파일을 복사하는 것만으로 적용이 완료되었다고 판단하지 않는다.

기존 팔레트 기준값·차림표·목록·뼈대의 추출 원본을 바꾸는 작업은 기존 전체 추출 절차를 따른다.

```powershell
node tools/extract-all.mjs
node tools/sync.mjs --write --only=Q-Atelier,Q-Works,Q-Forge
```

`extract-all`은 커밋된 원본을 다시 가져오므로 아직 커밋되지 않은 제품 수정의 전달 명령으로 사용하지 않는다. 공용 컴포넌트 CSS나 공통 화면 팔레트만 수정한 경우에는 해당 조각의 명령으로 충분하다. 다른 조각을 불필요하게 덮어쓰지 않는다.

공용 부품의 추가·이름 변경·삭제, 새로운 예외, 중앙 값을 덮는 로컬 규칙은 역할표와 전수 목록의 변경으로 검토한다. 실제 부품을 가져오는 [세 제품 검증 예제](../preview/fixtures/)에서 좁은 화면과 넓은 화면, 밝은 테마와 어두운 테마, 사용 불가·오류·선택·키보드 상태를 확인한다. 정적 검사가 통과해도 브라우저에서 적용 순서와 넘침을 확인해야 한다.

## 확인한 사실과 아직 별도인 사실

| 증거 | 확인하는 내용 | 대신하지 못하는 내용 |
| --- | --- | --- |
| 규칙 계열 | 어떤 기준으로 검토할 부품인지 | 규칙의 실제 준수 |
| 클래스·토큰 참조 | 공용 원본에 연결된 소스 | CSS 우선순위와 화면 결과 |
| 공용 import | 직접·간접 의존 경로 | 런타임 분기와 동적 로딩 |
| 사본 지문 | 원본과 제품 CSS의 일치 | 그 CSS를 실제 사용하는지 |
| 앱 진입점 연결 | 앱에서 도달하는 정적 import 경로 | 사용자가 열 수 있는 모든 조건 |
| 실제 부품 예제 | 확인한 화면 폭·테마·조작 결과 | 전체 업무 화면의 종단 검증 |
| 제품 시험 | 시험에 포함된 동작의 회귀 | 운영 데이터·권한·인쇄의 모든 조합 |

전체 목록의 기본 `composition`은 제품 전용 조합이라는 분류다. 시각 규칙 예외를 자동 승인하는 표시는 아니다. 분류 수나 import 수를 전체 디자인 준수율로 표시하지 않는다.

## 식별과 허용되는 차이

공식 제품 식별은 Atelier 은색, Maison 샴페인 골드, Carnet 구리색을 유지한다. 근거는 [브랜드 자산 기준](../../marketing-operations/brand/BRAND_ASSETS.md)과 [업무 화면 제품 식별](25-workspace-refinement.md)이다. 제품 금속색과 업무 UI의 따뜻한 공통 강조색은 다른 축이며 모든 상태색과 주 버튼을 제품 금속색으로 바꾸지 않는다.

OS 선택기, native 날짜 입력, 파일 선택, 권한·계산·결재·저장, 인쇄 기록서의 판형·쪽 넘김·서명칸·바코드는 허용되는 제품 차이다. 예외에는 대상·범위·이유·확인 근거를 기록한다. 읽을 수 없는 글자, 초점 손실, 조작 영역 부족, 등록 누락은 예외로 정당화하지 않는다.
