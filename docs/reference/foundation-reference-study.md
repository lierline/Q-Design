# 세 제품의 디자인 참고 조사

검토일: 2026-10-10. 대상: Q-Atelier, Q-Maison, Q-Carnet.

제품의 역할은 다르지만 배경, 입력, 탐색, 상태와 인증 화면에서 같은 가족으로 보여야 한다. 다음 공식 디자인 시스템의 실제 규칙과 예제를 비교했다. 특정 서비스의 색상이나 브랜드를 복제하지 않고, Q 제품에 필요한 규칙을 골랐다.

| 사례 | 참고할 구체적인 예시 | Q 제품에 적용하는 결정 |
| --- | --- | --- |
| [Atlassian 디자인 토큰](https://atlassian.design/foundations/design-tokens) | 같은 값이 아니라 같은 의미를 공유하는 토큰, 테마별 값 교체 | 배경·표면·텍스트·상태·초점의 역할을 유지하고 세 제품 이름에 연결한다. |
| [Atlassian 간격](https://atlassian.design/foundations/spacing) | 조작 내부, 컴포넌트 사이, 페이지 사이 간격 구분 | Q의 기존 4px 단위를 유지한다. 공통 간격 인자와 제품별 배치 규칙을 분리한다. |
| [Atlassian 동작](https://atlassian.design/foundations/motion) | 지속 시간, 이징, 움직이는 속성의 조합 | 배경 리본, 진입, 대화상자와 상태 변화의 시간을 중앙에 둔다. 감소된 동작에서는 장식을 멈춘다. |
| [Carbon 색상](https://www.carbondesignsystem.com/building-blocks/foundations/color/overview) | 배경, 층, 입력 면, 경계, 글자, 아이콘, 상태색의 역할 | 제품별 하드코딩 색 대신 공통 의미 색을 연결한다. 전문가 화면도 별도 팔레트가 공통 변경을 가로막지 않게 한다. |
| [Carbon 색상 토큰](https://www.carbondesignsystem.com/building-blocks/foundations/color/tokens) | 기본, hover, active, selected와 selected-hover 구분 | 선택·포커스·오류·읽기 전용·비활성 상태를 별도로 기록한다. 단순 배경색 교체만으로 검증하지 않는다. |
| [Carbon 전역 머리말](https://www.carbondesignsystem.com/building-blocks/core/patterns/global-header) | 같은 제품군의 머리말과 좌우 패널 구성 | 앱 머리, 탐색, 본문 시작 위치, 모바일 메뉴와 고정 영역을 같은 규칙으로 관리한다. |
| [Carbon 데이터 표](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines) | 도구 띠와 행 밀도의 관계, 확장 행과 상세 화면의 구분 | 표 크기, 검색·거르개, 선택 상태, 빈 상태, 페이지 이동을 함께 조정한다. 긴 업무는 과도한 모달 중첩을 피한다. |
| [Carbon 레이아웃](https://www.carbondesignsystem.com/building-blocks/foundations/2x-grid/guidelines) | 탐색 패널과 본문 그리드의 관계 | 앱 전체 폭, 상세 읽기 폭, 인증 폼 폭을 별도 의미 인자로 둔다. 모든 화면을 같은 폭에 강제로 맞추지 않는다. |
| [Spectrum 색상](https://spectrum.adobe.com/page/color-system/) | 중립색 기반 화면과 의미 색, 범주별 차트 색의 구분 | 금속색은 제품 식별에 사용한다. 오류·정상·주의와 차트 범주를 제품색으로 덮지 않는다. |
| [Spectrum 테마](https://spectrum.adobe.com/page/theming/) | 다른 제품 성격에서도 공통 기반과 조작 규칙 유지 | 아뜰리에·메종의 업무 밀도와 카르넷 현장 입력의 차이는 명시적인 변형으로 둔다. |
| [Visa 폼](https://design.visa.com/patterns/forms/) | 제목, 레이블, 설명, 메시지, 행동의 순서와 한 열 흐름 | 로그인과 비밀번호 화면을 같은 인증 구성으로 묶고 입력의 읽는 순서와 오류 위치를 맞춘다. |
| [GOV.UK 비밀번호 입력](https://design-system.service.gov.uk/components/password-input/) | 비밀번호 표시 행동의 이름과 피드백 | 표시·숨김과 키보드 조작을 명확히 한다. 디자인 작업에서 인증 정책 자체를 바꾸지 않는다. |
| [GOV.UK 오류 요약](https://design-system.service.gov.uk/components/error-summary/) | 상단 요약, 해당 입력으로 연결, 입력 옆의 같은 오류 문구 | 여러 오류가 있는 폼은 이동 가능한 요약과 필드 오류를 함께 둔다. 성공과 오류를 색만으로 표현하지 않는다. |
| [Lightning 화면 밀도](https://www.lightningdesignsystem.com/2e1ef8501/v/55390/p/805bbe-display-density) | 여유 있는 구성과 조밀한 구성의 명시적 선택 | 밀도 변형을 임의의 작은 글씨로 구현하지 않는다. 기본 터치 44px, 카르넷 현장 56px를 유지한다. |
| [Design Tokens 형식](https://www.designtokens.org/tr/drafts/format/) | 형식이 있는 값, 별칭과 그룹 | 별칭의 누락과 순환을 생성 단계에서 검사한다. 현재 CSS 인자 체계를 해당 표준의 완전한 구현이라고 주장하지 않는다. |

## 선택한 화면 방향

1. 배경: 조용한 중립 바탕, 콘텐츠 표면, 입력 표면을 구분한다. 리본은 배경에만 낮은 강도로 사용한다.
2. 인증: 브랜드 소개 영역과 폼 영역의 같은 구성, 공통 제목 크기, 440px 폼 폭, 같은 카드 간격을 사용한다. 작은 화면에서는 한 열로 전환한다.
3. 업무 화면: 페이지 제목, 행동, 검색·거르개, 표 또는 본문의 순서를 맞춘다. 빈 카드와 장식 상자를 늘리지 않는다.
4. 상태: 같은 정보·정상·주의·오류 팔레트와 문구 구조를 사용한다. 데이터 없음, 불러오는 중, 권한 없음과 실패를 구분한다.
5. 강조: 은색·샴페인·구리색의 제품 자산을 유지하되 업무 행동과 상태의 의미를 금속색으로 바꾸지 않는다.
6. 검증: 공식 예시를 참고한 것과 실제 제품에 적용된 것을 구분한다. 코드 사본, CSS 연결, 런타임 값 변경, 키보드 동작과 화면 폭을 각각 확인한다.

## 구현 연결

- 공통 인자: `patterns/foundation.css`, `patterns/components.css`
- 제품별 배경·인증·전역·출력 규칙: `patterns/foundation/{atelier,maison,carnet}.css`
- 메종 유틸리티 체계: `patterns/foundation/maison-tailwind.ts`
- 실물 컴포넌트 비교: `preview/components.html`
- 인자 감사: `tools/style-arguments.mjs`, `dist/style-arguments/*.ndjson`

이 문서의 사례는 설계 판단의 근거다. 적용 완료 여부는 구현과 검사 기록으로 판단한다.
