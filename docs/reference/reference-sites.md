# 참고 사이트 조사 · 장부형 다음 단계용

조사일: 2026-10-15. 대상: Q-Atelier, Q-Maison, Q-Carnet (Q-Sonar 는 참고만).

[기초 참고 사례](foundation-reference-study.md)가 기초(토큰 · 간격 · 색) 사례를 골랐다면, 이 문서는 10-10 장부형 계획의 **패턴 층**(괘선 목록 · 목록과 상세 · 폰 줄 카드 · 결재 길 · 이력 · 합계 줄)에 쓸 사례를 모읍니다. 모든 주소는 2026-10-15 에 직접 열어 내용을 확인했습니다. 색이나 브랜드를 베끼지 않고 규칙만 가져옵니다. 웹 디자인 금지 목록에 걸리는 부분은 각 줄의 «피할 것» 칸에 적었습니다.

모두 80곳 · 6갈래 · 피할 점을 적은 곳 32곳. 맞춤 정도: **바로 씀**(그대로 옮김) · **일부 가져옴** · **참고만**.

## 다음 단계에 바로 쓸 것

| 단계 | 왜 | 볼 곳 |
| --- | --- | --- |
| 목록을 상자 대신 괘선 줄로 | 용어집 · 멤버 관리 · 대시보드 위젯이 아직 테두리 상자를 쌓아요. | [GOV.UK · 요약 목록](https://design-system.service.gov.uk/components/summary-list/) · [GitLab Pajamas · 표](https://design.gitlab.com/components/table) · [KRDS 범정부 디자인 시스템 · 표](https://www.krds.go.kr/html/site/component/component_04_11.html) · [LaTeX booktabs · 전문가 표](https://en.wikibooks.org/wiki/LaTeX/Tables#Professional_tables) |
| 폰에서 표를 줄 카드로 접기 | 운영진 화면은 폰으로도 관리해야 해요. | [미국 정부 USWDS · 표](https://designsystem.digital.gov/components/table/) · [Shopify Polaris · 표](https://shopify.dev/docs/api/app-home/latest/web-components/layout-and-structure/table) · [Elastic EUI · 기본 표](https://eui.elastic.co/docs/components/tables/basic/) · [싱가포르 정부 SGDS · 설명 목록](https://www.designsystem.tech.gov.sg/components/description-list) |
| 목록 + 상세 나란히(연속 검토) | 10-10 계획 3단계. 시안만 있고 제품에는 아직 없어요. | [SAP Fiori · 유연한 칸 배치](https://www.sap.com/design-system/fiori-design-web/v1-142/page-types/page-layouts/flexible-column-layout/usage) · [Linear · 미리보기](https://linear.app/docs/peek) · [Airtable · 레코드 검토 화면](https://support.airtable.com/docs/interface-layout-record-review) |
| 가로 결재 길 · 서명 줄 | 결재 길은 이미 있어요. 서명 기록과 폰 축약을 다듬을 때 봐요. | [일본 디지털청 DADS · 단계 내비게이션](https://design.digital.go.jp/dads/components/step-navigation/) · [KRDS · 단계 표시기](https://www.krds.go.kr/html/site/component/component_07_01.html) · [Fieldwire · 양식 서명 줄](https://help.fieldwire.com/hc/en-us/articles/360021926052-Introduction-to-Safety-Audit-forms) · [Tulip · 전자서명 위젯](https://support.tulip.co/docs/how-to-use-the-electronic-signature-widget) |
| 이력 · 감사 기록 | 결재 길(진행)과 이력(지난 일)을 나눠 그리는 기준이에요. | [영국 법무부 MOJ · 타임라인](https://design-patterns.service.justice.gov.uk/components/timeline/) · [GitHub Primer · 타임라인](https://primer.style/product/components/timeline/) · [SmartHR · 타임라인](https://smarthr.design/products/components/timeline/) |
| 숫자 · 합계 줄 | 장부 결의 마지막 조각. 같은 폭 숫자와 겹밑줄이에요. | [hledger · 대차대조표 예시](https://hledger.org/) · [Practical Typography · 숫자 모양](https://practicaltypography.com/alternate-figures.html) · [Pretendard · 글꼴 기능 설명](https://cactus.tistory.com/306) · [Ant Design · 데이터 표기 규칙](https://ant.design/docs/spec/data-format) |

## 공공 디자인 시스템 (13곳)

정부 · 공공 서비스의 규칙. 화려함이 없고 읽힘이 기준이라 «문서 결» 과 가장 가까워요.

| 사례 | 맞춤 | 가져올 것 | 피할 것 |
| --- | --- | --- | --- |
| [GOV.UK · 요약 목록](https://design-system.service.gov.uk/components/summary-list/) | 바로 씀 | 한 줄에 항목명 · 값 · '바꾸기' 글귀를 두고 줄마다 가는 괘선으로 나눠요. 고치기는 상자 단추가 아니라 글귀 링크예요. 변경 상세 · 제품 정보 화면에서 상자를 걷어낼 때 바로 써요. | 목록을 상자로 감싸는 '요약 카드' 변형은 쓰지 않아요. |
| [GOV.UK · 답변 확인 패턴](https://design-system.service.gov.uk/patterns/check-answers/) | 바로 씀 | 상신 전 확인 화면의 틀이에요. 구역마다 제목과 요약 목록, 빈 칸은 '입력 안 함', 끝에 '제출하면 내용이 맞다고 확인하는 것' 한 문장과 '결재 올리기' 같은 동작 이름 단추를 둬요. | 없음 |
| [GOV.UK · 할 일 목록](https://design-system.service.gov.uk/components/task-list/) | 바로 씀 | 줄 전체가 링크이고 상태는 오른쪽 끝에 둬요. 끝난 일은 바탕 없이 글자로만, 남은 일에만 표시를 붙여 눈이 할 일로 가게 해요. 문서 세트 작성 현황판에 맞아요. | 없음 |
| [KRDS 범정부 디자인 시스템 · 표](https://www.krds.go.kr/html/site/component/component_04_11.html) | 바로 씀 | 세로 칸막이 없이 가로 줄로만 나누고, 양은 오른쪽 · 날짜와 번호는 왼쪽에 맞추고, 빈 칸에는 '-' 를 넣어요. 폰에서 단순한 표는 세로로 쌓고 복잡한 표는 첫 열을 고정한 가로 스크롤로 나눠요. | 없음 |
| [KRDS · 상세 정보 확인 패턴](https://www.krds.go.kr/html/site/global/global_06.html) | 바로 씀 | 제목, 2~3줄 요약, 구역별 본문, 변경 이력 표(변경일 · 변경 내용 · 관련 자료), 동작 순서로 놓아요. 넓은 화면은 쪽 안 목차를 오른쪽에 고정, 좁은 화면은 제목 아래로 내려요. 문서 개정 이력에 바로 써요. | 없음 |
| [KRDS · 단계 표시기](https://www.krds.go.kr/html/site/component/component_07_01.html) | 바로 씀 | 단계는 3~7개. 지금 단계는 색만으로 구분하지 않고 밑줄이나 1px 이상 테두리 차이를 함께 써요. 폰에서는 '4단계 중 1단계' 로 줄여요. 가로 결재 길에 그대로 맞아요. | 없음 |
| [일본 디지털청 DADS · 표 사용법](https://design.digital.go.jp/dads/components/table/usage/) | 바로 씀 | 머리 칸과 본문 사이를 검은 선으로 가르고 머리 글자는 굵게. 밀도는 기본과 촘촘 두 가지이고, 촘촘한 쪽은 터치로 다루기 어렵다고 밝혀 둬요. 칸 안 글자를 공백으로 맞추지 말라는 CJK 규칙도 있어요. | 폰 가로 스크롤을 그림자로 알리는 부분은 가는 선으로 바꿔 써요. |
| [일본 디지털청 DADS · 단계 내비게이션](https://design.digital.go.jp/dads/components/step-navigation/) | 바로 씀 | 끝난 단계는 회색 원에 체크, 지금 단계는 검은 이중 원, 남은 단계는 흰 원. 색 없이 모양만으로 구분해서, 무채색에 금빛 겹원을 쓰는 우리 결재 길과 결이 같아요. 가로형 · 세로형이 둘 다 있어요. | 없음 |
| [영국 법무부 MOJ · 타임라인](https://design-patterns.service.justice.gov.uk/components/timeline/) | 바로 씀 | 사건 이력을 제목 · 작성자 · 날짜와 시각 · 설명 네 칸으로 적고 최신을 위에 둬요. '진행 표시나 할 일 목록으로 쓰지 말 것' 이라는 경계가 분명해서 결재 이력과 결재 길을 나누는 기준이 돼요. | 없음 |
| [미국 정부 USWDS · 표](https://designsystem.digital.gov/components/table/) | 바로 씀 | 쌓기 변형은 폰 폭에서 줄마다 세로 묶음이 되고 칸마다 이름표가 붙어요. 숫자 칸은 고정폭 · 같은 폭 숫자 · 오른쪽 맞춤을 한 묶음으로. 운영진 표를 412 · 375 폭에서 줄 카드로 접는 구현 예예요. | 줄무늬 변형은 괘선 장부 결과 겹치니 쓰지 않아요. |
| [싱가포르 정부 SGDS · 설명 목록](https://www.designsystem.tech.gov.sg/components/description-list) | 일부 가져옴 | 기본은 이름표와 값을 가로로, 폰에서는 이름표를 값 위로 올리고 이름표 폭에 상한을 둬요. 테두리는 기본으로 없고 고르면 항목 사이 구분선만 생겨요. | 없음 |
| [네덜란드 NL Design System · 표](https://nldesignsystem.nl/table/) | 일부 가져옴 | 표 제목은 caption 으로 달고 머리 칸에 scope 를 줘요. 400% 확대에서도 읽혀야 하고, 작은 표에 폭 100% 를 주지 말라는 지적이 좋아요. | 없음 |
| [GOV.UK · 꼬리표](https://design-system.service.gov.uk/components/tag/) | 일부 가져옴 | 상태 꼬리표는 누를 수 없게 두고, 이름은 동사가 아닌 상태 말('완료', '검토 중')로 써요. 상태 가짓수는 최소로, 같은 상태는 어디서나 같은 색으로. | 색이 아홉 가지라 다 쓰면 시끄러워요. 보라 · 자홍은 빼요. |

## 기업 디자인 시스템 (17곳)

업무용 제품을 만드는 회사들의 공개 규칙. 표 · 설명 목록 · 상태 표시 · 이력이 촘촘해요.

| 사례 | 맞춤 | 가져올 것 | 피할 것 |
| --- | --- | --- | --- |
| [SAP Fiori · 개체 상세](https://www.sap.com/design-system/fiori-design-web/page-types/floorplans/object-page/) | 바로 씀 | 머리에 번호 · 상태 · 핵심 값(다섯 쌍까지), 그 아래 구역 바로가기 띠, 본문 구역, 아래 고정 동작 줄. 보기와 편집 전환도 한 화면에서 해요. '단건 상세는 한 칸' 원칙과 맞는 변경 건 상세의 뼈대예요. | 없음 |
| [SAP Fiori · 유연한 칸 배치](https://www.sap.com/design-system/fiori-design-web/v1-142/page-types/page-layouts/flexible-column-layout/usage) | 바로 씀 | 처음엔 한 칸, 항목을 누르면 오른쪽에 상세 칸이 열려요. 칸 너비는 끌어서 바꾸고 오른쪽 칸은 전체 화면으로 키워요. CAPA · 변경 요청을 이어서 검토하는 '목록 + 상세' 의 뼈대로 써요. | 없음 |
| [GitLab Pajamas · 표](https://design.gitlab.com/components/table) | 바로 씀 | 바깥 테두리와 세로줄을 없애고 줄 사이 가로줄만(마지막 줄 뒤에도). 숫자는 자릿수를 맞춰 오른쪽 정렬. 폰에서 줄끼리 비교할 일이 없으면 이름표 붙은 묶음으로 쌓으라는 판단 기준이 분명해요. | 빈 값에 긴 줄표를 쓰라는 대목은 '-' 나 '없음' 으로 바꿔요. |
| [SmartHR · 정의 목록](https://smarthr.design/products/components/definition-list/) | 바로 씀 | 읽기 전용 확인 화면은 항목명과 값을 짝지은 목록으로. 항목 최소 폭 12em, 붙어 다니는 값은 나란히, 긴 값은 한 줄 전체로 두는 열 규칙을 그대로 가져와요. | 없음 |
| [freee vibes · 숫자 표](https://vibes.freee.co.jp/?path=/docs/lv2-numerictable-numerictable--docs) | 바로 씀 | 회계 제품의 숫자 표예요. 왼쪽 몇 열을 행 머리로 고정하고 머리 줄도 고정, 금액은 오른쪽, 줄 끝에 상태. 로트 · 수량 장부 표에 맞는 구성이에요. | 없음 |
| [Shopify Polaris · 표](https://shopify.dev/docs/api/app-home/latest/web-components/layout-and-structure/table) | 바로 씀 | 넓으면 표, 좁으면 목록으로 저절로 바뀌어요. 열마다 목록에서 앉을 자리(주 제목 · 보조 · 줄 안 · 이름표)를 정하는 방식이 우리 폰 줄 카드 설계와 같은 생각이에요. | 제목 위 작은 이름표(kicker) 자리는 eyebrow 금지에 걸려요. |
| [Ant Design · 데이터 표기 규칙](https://ant.design/docs/spec/data-format) | 바로 씀 | 세 자리 쉼표, 표에서는 오른쪽 정렬, 날짜 YYYY-MM-DD, 시각 24시간 HH:MM:SS, 단위는 숫자 뒤, 진행은 12/30. 모노 숫자 표기 규칙표로 바로 옮길 수 있어요. | 빈 값 '--' 는 '-' 하나로 맞춰요. |
| [GitHub Primer · 타임라인](https://primer.style/product/components/timeline/) | 바로 씀 | 감사 기록을 세로 줄 하나에 이어 붙여요. 중요한 일은 기호 배지와 본문, 잔일은 '압축 줄' 로 낮추고, 구간이 바뀌는 곳은 끊김 줄로 나눠요. | 같은 Primer 의 상태 라벨은 알약 모양이라 가져오지 않아요. |
| [SmartHR · 상태 라벨](https://smarthr.design/products/components/status-label/) | 일부 가져옴 | 상태 꼬리표는 정해진 생애 주기(미착수 · 진행 중 · 완료)에만 써요. 한 대상에 하나만, 링크로 쓰지 않고, '3일 남음' 같은 값은 넣지 않아요. | 없음 |
| [SmartHR · 타임라인](https://smarthr.design/products/components/timeline/) | 일부 가져옴 | 조작 · 갱신 이력을 시간 순으로. 날짜 형식을 고정하고 지금 항목만 강조, 줄 오른쪽에 동작 자리를 둬요. 결재 이력 · 감사 기록의 틀로 써요. | 없음 |
| [Red Hat PatternFly · 설명 목록](https://www.patternfly.org/components/description-list/) | 일부 가져옴 | 화면 폭마다 가로 · 세로 배치와 1~3열을 따로 정하고 촘촘한 형도 있어요. 항목명 옆 도움말 단추로 설명을 팝업에 넣는 방식이 우리 칸 ⓘ 와 같아요. | 없음 |
| [Elastic EUI · 기본 표](https://eui.elastic.co/docs/components/tables/basic/) | 일부 가져옴 | 중간 폭 아래에서 줄이 카드로 바뀌고 머리 글자가 값 위로 올라가요. 숫자 열은 저절로 오른쪽. 전환 폭과 칸 모양을 열 단위로 정하는 방식이 참고가 돼요. | 줄 카드에 테두리와 그림자를 같이 두지 말고 괘선만 써요. |
| [Workday Canvas · 상태 표시](https://design.workday.com/design-system/components/web/status-indicator) | 일부 가져옴 | 강조 두 단계: 진하게는 제목 옆에서 아껴, 옅게는 표처럼 촘촘한 곳에. 한 단어 · 줄바꿈 금지 · 최대 폭 200px, 색의 뜻이 정리돼 있어요. | 같은 시스템의 Pill 부품은 알약 모양이라 가져오지 않아요. |
| [IBM Carbon · 상태 표시 패턴](https://carbondesignsystem.com/patterns/status-indicator-pattern/) | 일부 가져옴 | 상태는 색에 모양이나 기호를 더하고 글자도 붙여요. 여러 상태가 묶이면 가장 높은 단계의 색을 따르는 규칙이 표 요약 줄에 맞아요. | '이상값' 에 보라를 쓰는 부분은 빼요. |
| [Base Web · 표](https://baseweb.design/components/table-semantic/) | 일부 가져옴 | 구분선은 가로 · 세로 · 격자 · 없음 넷, 밀도는 촘촘 · 기본 · 넉넉 셋으로 이름을 붙여 뒀어요. 표 토큰 이름을 지을 때 참고가 돼요. | 없음 |
| [토스 TDS Mobile · TableRow](https://tossmini-docs.toss.im/tds-mobile/components/table-row/) | 일부 가져옴 | 왼쪽 이름표, 오른쪽 값을 한 줄에. 양끝 정렬과 왼쪽 붙임 두 가지, 왼쪽 폭 비율을 숫자로 정해요. 폰 결재함 요약 줄에 써요. | 토스 앱의 큰 둥근 카드 묶음 화면은 장부형과 결이 달라요. |
| [당근 SEED · 글쓰기 원칙](https://seed-design.io/foundations/writing) | 일부 가져옴 | 단추 · 메뉴 · 이름표 · 큰 제목에 마침표를 찍지 않고, 숫자는 아라비아 숫자로, 한 문장에 목적 하나. | '전문용어를 피하라' 는 우리 업무 용어 원칙과 부딪혀요. 표기 규칙만 가져와요. |

## 품질 · 전자서명 · 제조 현장 화면 (9곳)

eQMS · MES · 연구 기록 제품의 실제 화면 안내. 서명 · 검토 · 현장 입력이 있어요.

| 사례 | 맞춤 | 가져올 것 | 피할 것 |
| --- | --- | --- | --- |
| [Fieldwire · 양식 서명 줄](https://help.fieldwire.com/hc/en-us/articles/360021926052-Introduction-to-Safety-Audit-forms) | 바로 씀 | 서명 칸을 한 줄 장부로 써요. 왼쪽에 서명자 · 직책 · 소속, 시각, 어느 기기에서, 오른쪽에 서명 그림, 위아래는 가는 줄로만. Q-Carnet 공정 단계 서명에 그대로 맞아요. | 없음 |
| [Tulip · 전자서명 위젯](https://support.tulip.co/docs/how-to-use-the-electronic-signature-widget) | 바로 씀 | 서명 칸마다 무엇에 서명하나 · 누가 서명할 수 있나 · 서명의 뜻을 미리 정하고, 자기 작업에 자기가 서명하지 못하게 막아요. 서명은 완료 기록에 남고 이력에서 다시 봐요. | 없음 |
| [Jama Connect · 검토 전자서명](https://help2.jamasoftware.com/ah/en/reviews-in-jama-connect/approver-tasks/sign-a-review-electronically.html) | 바로 씀 | 검토를 마치는 창에서 아이디 · 비밀번호로 서명하고 '승인하고 서명' 단추 하나로 끝내요. 서명의 뜻은 고정 문장, 서명자 역할과 일시는 활동 기록에 남겨요. | 없음 |
| [Dynamics 365 · 생산 현장 실행](https://learn.microsoft.com/en-us/dynamics365/supply-chain/production-control/production-floor-execution-use) | 바로 씀 | 작업 목록은 위, 고른 작업의 상세는 아래, 시작 · 진행 보고 같은 주 동작은 오른쪽 세로 줄에 늘 보여요. 수량은 숫자 자판 창으로 받아요. 태블릿 공정 입력의 배치로 참고해요. | 짙은 남색 바탕에 하늘색 강조(청록 네온 느낌), 동그란 아이콘 단추. |
| [Scilife · 문서 서명 창](https://support.scilife.io/hc/en-us/articles/360019582599-How-do-electronic-signatures-work-in-Scilife) | 일부 가져옴 | 서명 창에 사용자 · 비밀번호 · 의견 칸, '이 전자서명은 손 서명과 같아요' 경고 문장. 뒤쪽 표에는 '서명 일시' 열을 따로 둬요. | 사이드바와 칸 이름의 대문자 소제목. |
| [Veeva Vault QMS · 서명 쪽 보기](https://quality.veevavault.help/en/lr/40560/) | 일부 가져옴 | 문서 정보의 '서명' 구역에 서명 수를 먼저 보여 주고, 펼치면 서명자 · 자격 · 일시를 최근 5건까지. 나머지는 따로 뽑는 서명 쪽으로 넘겨요. | 없음 |
| [Polarion ALM 18.2 · 작업 항목 전자서명](https://blogs.sw.siemens.com/polarion/polarion-alm-18-2-whats-new-and-noteworthy/) | 일부 가져옴 | 전자서명마다 서명자 · 날짜 · 목적을 사람이 읽을 수 있게 기록 양식 안에 남기고 그대로 인쇄돼요. 상태 변경 서명은 '워크플로 서명' 구역에 따로 모아요. | 없음 |
| [Benchling · 검토 절차](https://help.benchling.com/hc/en-us/articles/39952320412685-Create-and-use-review-processes) | 일부 가져옴 | 검토 단계마다 단추 이름(승인 · 입회 등)과 그 서명의 뜻을 관리자가 정해요. 혼자 · 순서 없이 · 순서대로 세 가지 검토 방식에서 골라요. | 상태 알약, 대문자 소제목, 왼쪽 굵은 강조선 안내 상자. |
| [Odoo · 작업 현장](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/manufacturing/shop_floor/shop_floor_overview.html) | 일부 가져옴 | 작업지시 머리에 지시 번호 · 제품 · 수량 · 타이머, 몸통에 공정 단계 줄, 맨 아래 '생산 등록' 줄. 서명한 작업자 목록은 접히는 판에 둬요. | 카드를 여러 장 띄워 놓은 판, 보라 강조색. |

## ERP · 결재 · 업무 SaaS 화면 (15곳)

결재선 · 변경 지시 · 목록과 상세 · 분류함처럼 매일 쓰는 업무 흐름이에요.

| 사례 | 맞춤 | 가져올 것 | 피할 것 |
| --- | --- | --- | --- |
| [네이버웍스 · 결재 문서함](https://help.worksmobile.com/ko/admin-guides/manage-service/manage-approval/document-box/) | 바로 씀 | 결재선 요약 표에 승인자 서명을 찍고 반려 · 위임은 도장으로 구분해요. 부서 결재는 결재 전엔 부서명만, 결재 뒤엔 '홍길동/기획팀' 처럼 바꿔 적어요. | 없음 |
| [Odoo PLM · 변경 지시 승인](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/plm/management/approvals.html) | 바로 씀 | 단계마다 승인자를 '꼭 승인 · 승인하지만 선택 · 의견만' 세 갈래로 나눠요. 꼭 필요한 승인이 빠지면 '변경 적용' 단추가 먹지 않고, 반려되면 '막힘' 상태가 크게 보여요. | Odoo 고유의 보라 강조색. |
| [Odoo PLM · 변경 지시 상세](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/plm/manage_changes/engineering_change_orders.html) | 일부 가져옴 | 변경 요청 화면 오른쪽 위에 단계 흐름, '부품 변경' 탭에는 바뀌기 전과 뒤의 차이만. 승인 뒤 '변경 적용' 을 누르면 옛 판은 보관되고 새 판이 살아나요. | Odoo 보라 강조색. |
| [Oracle · 문서 이력 · 승인자 서랍](https://docs.oracle.com/en/cloud/saas/readiness/scm/26a/ssproc26a/26A-ssproc-wn-f40028.htm) | 일부 가져옴 | 문서 이력을 제출 회차별로 접고 펴는 줄로 묶고, 결재 진행은 옆 서랍에 승인자를 순서대로 세워 보여요. 서랍에는 이번 회차만 보여 주는 규칙도 참고해요. | 머리 띠의 장식 무늬 배경. |
| [ERPNext · 결재 흐름](https://docs.frappe.io/erpnext/user/manual/en/workflows) | 일부 가져옴 | 상태 이름에 누구 차례인지를 그대로 적어요('팀장 승인 대기'). 승인 · 반려 단추는 차례인 사람에게만 보여요. | 상태를 색 알약으로만 칠하는 방식. |
| [flex · 승인 구조 이해하기](https://guide.flex.team/ko/articles/10283585-%ED%94%8C%EB%A0%89%EC%8A%A4-%EC%8A%B9%EC%9D%B8-%EA%B5%AC%EC%A1%B0-%EC%9D%B4%ED%95%B4%ED%95%98%EA%B8%B0) | 일부 가져옴 | 결재선을 조직도에서 1차 · 2차 조직장으로 자동으로 채우고, 같은 단계에 승인자가 여럿이면 모두 승인해야 넘어가요. 참조자는 시작 · 최종 승인 때만 알림을 받아요. | 없음 |
| [flex · 커스텀 승인 라벨](https://guide.flex.team/ko/articles/10289835-%EC%BB%A4%EC%8A%A4%ED%85%80-%EC%8A%B9%EC%9D%B8-%EB%9D%BC%EB%B2%A8) | 일부 가져옴 | 결재 단계에 '승인' 말고 '합의 · 협의' 같은 이름표를 붙이고 설명을 달아요. 이름표는 6개까지만 둬서 결재 구분이 늘어지지 않게 해요. | 없음 |
| [GitHub · 필수 검토 승인](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/approving-a-pull-request-with-required-reviews) | 일부 가져옴 | 검토 창에서 '승인 · 변경 요청' 중 하나를 고르고, 검토자 목록은 '반영되는 승인' 과 '참고 승인' 을 나눠 보여요. 작성자는 자기 건을 승인하지 못해요. | 없음 |
| [Linear · 분류함](https://linear.app/docs/triage) | 일부 가져옴 | 들어온 건을 한 건씩 열어 받기 · 거절 · 중복 · 미루기 넷 중 하나로 빨리 처리하고 숫자 단축키를 붙여요. 불만 접수함의 1차 분류에 맞아요. | Inter 글꼴, 어두운 바탕에 보라 강조. |
| [Linear · 미리보기](https://linear.app/docs/peek) | 일부 가져옴 | 목록에서 스페이스 키로 상세를 살짝 보고 화살표로 다음 건으로 넘어가요. 미리보기에는 상태 · 담당 · 우선순위 · 날짜만. 연속 검토의 가벼운 형태예요. | Inter 글꼴. |
| [Airtable · 레코드 검토 화면](https://support.airtable.com/docs/interface-layout-record-review) | 일부 가져옴 | 검토 화면을 '걸러 낸 목록' 과 '고른 건의 상세' 둘로 나누고, 목록 줄마다 미리 볼 칸을 하나 붙여요. 분류별로 묶어 접어 볼 수 있어요. | 알록달록한 알약 칩. |
| [비즈플레이 · 결재선 설정](https://docs.bizplay.co.kr/core_guide/setting-company-regulations/approval-line) | 참고만 | 결재선을 네 규칙(양식별 결재자 · 직원별 결재선 · 양식별 결재선 · 조건부 결재선)으로 정해요. 운영진 결재선 설정 화면의 갈래로 참고해요. | 없음 |
| [Attio · 활동 타임라인 거름](https://attio.com/changelog/2026/new-activity-timeline) | 참고만 | 활동 줄을 사건 종류(메모 · 일정 · 값 바뀜 · 할 일)로 걸러 보고, 고른 거름을 대상 종류별로 기억해요. 감사 기록 거름 칸에 써요. | Inter 글꼴. |
| [Basecamp · 힐 차트](https://basecamp.com/hill-charts) | 참고만 | 진행률을 숫자로 계산하지 않고 '아직 모름 → 다 앎 → 실행만 남음' 언덕 위에 사람이 점을 옮기고 기록을 남겨요. CAPA 조사의 '확신 정도' 표시로만 참고해요. | 없음 |
| [토스페이먼츠 · 상점관리자 첫 사용 안내](https://www.tosspayments.com/blog/articles/34999) | 참고만 | 정산일 · 수수료 · 지급 보류처럼 헷갈리는 말마다 화면 옆에 한 줄 풀이를 붙여요. 운영진 화면 ⓘ 도움말 문구를 쓰는 방식으로 참고해요. | 없음 |

## 장부 · 문서 결 (11곳)

선 긋는 법, 합계 줄, 숫자 맞춤, 여백 메모. 화면을 «잘 짠 문서» 처럼 보이게 하는 근거예요.

| 사례 | 맞춤 | 가져올 것 | 피할 것 |
| --- | --- | --- | --- |
| [Practical Typography · 선과 테두리](https://practicaltypography.com/rules-and-borders.html) | 바로 씀 | 선은 0.5~1pt 한 굵기 실선만, 여백으로 먼저 나눠 본 뒤 안 될 때만 선을 그어요. 제목에 붙는 선은 제목 위에 둬서 앞 구역과 끊으라는 규칙이 '번호 + 굵은 제목 + 먹선' 구역 머리와 딱 맞아요. | 없음 |
| [Practical Typography · 숫자 모양](https://practicaltypography.com/alternate-figures.html) | 바로 씀 | 본문 숫자는 비례 숫자, 표처럼 세로로 맞추는 숫자는 같은 폭 숫자. 0 을 한 줄 치고 그 아래 1 을 한 줄 쳐서 길이가 같은지 보는 검사법을 글꼴 점검표에 넣어요. | 없음 |
| [LaTeX booktabs · 전문가 표](https://en.wikibooks.org/wiki/LaTeX/Tables#Professional_tables) | 바로 씀 | 선은 맨 위 · 머리 아래 · 맨 아래 세 줄만, 세로 선은 긋지 않아요. 장부 표의 '굵은 윗선 + 머리 밑선' 뼈대 근거예요. 겹선은 최종 합계 한 줄에만 예외로 둬요. | 없음 |
| [hledger · 대차대조표 예시](https://hledger.org/) | 바로 씀 | 금액은 고정폭으로 오른쪽 끝을 맞추고, 소계 위엔 가는 줄, 마지막 합계 위엔 겹줄. 합계 줄 규칙이 실제 장부 출력에서 어떻게 보이는지 바로 보여 주는 견본이에요. | 없음 |
| [JATS · 회계 밑줄 관례](https://jats.nlm.nih.gov/archiving/tag-library/1.3/attribute/underline-style.html) | 일부 가져옴 | 회계에서 소계는 한 줄 밑줄, 최종 합계는 겹밑줄이라고 표준 문서 예시에 적혀 있어요. '합계 줄 겹밑줄' 규칙의 근거로 남겨 둬요. | 없음 |
| [Fava · 손익계산서 데모](https://fava.pythonanywhere.com/example-beancount-file/income_statement/) | 일부 가져옴 | 계정을 펼치고 접는 나무 모양 손익 표, 금액 칸만 고정폭으로 오른쪽 맞춤. 브라우저가 한국어면 제목이 한국어로 바뀌어 한글 장부 화면의 실물로 볼 수 있고, 밝은 · 어두운 테마가 둘 다 있어요. | 없음 |
| [Ink & Switch · 글쓰기 양식 안내](https://www.inkandswitch.com/article-style-guide/) | 일부 가져옴 | 짧은 곁글은 관련 문단 바로 뒤에 두면 여백에 떠서 옆에 붙어요. 표엔 숫자 열 오른쪽 맞춤 규칙을 따로 둬요. 여백 메모와 표 규칙을 한 장에 정리한 본보기예요. | 없음 |
| [Stripe · 인보이스 꾸미기](https://docs.stripe.com/invoicing/customize) | 일부 가져옴 | 문서 번호는 '접두어-0001' 처럼 이어 매기고, 머리엔 이름 · 값 칸 최대 4개, 꼬리엔 사업자 번호 같은 법정 문구 칸. 줄 항목을 묶어 소계만 보여 주는 방식은 출고 문서 · 성적서에 맞아요. | 없음 |
| [Tufte CSS](https://edwardtufte.github.io/tufte-css/) | 일부 가져옴 | 번호가 붙는 곁주와 번호 없는 여백 메모를 나누고, 좁은 화면에선 눌러야 펼쳐지게 해요. 여백 메모의 기본 동작으로 가져와요. | 미색 바탕과 세리프 한 벌로 다 쓰는 구성은 가져오지 않아요. |
| [Shape Up · 2장](https://basecamp.com/shapeup/1.1-chapter-02) | 일부 가져옴 | 부와 장 번호, 장 첫머리의 작은 차례, 그림 아래 짧은 설명, 앞뒤 장으로 가는 글귀 링크. 꾸밈 없이 문서만으로 읽히는 구성의 본보기예요. | 제목과 본문 모두 세리프 한 벌(글꼴 하나로 전부). |
| [Linear Method · 목차](https://linear.app/method) | 일부 가져옴 | '2.3' 처럼 장.절 번호를 제목에 붙이고 묶음 제목 아래로 차례를 늘어놓아요. 구역 머리의 두 자리 번호와 결이 같아 문서형 목차에 써요. | 어두운 바탕 기본, 본문 Inter, 큰 제목 세리프. |

## 한글 조판 · 표기 규칙 (15곳)

한글 자간 · 줄바꿈 · 숫자 · 단위 · 문장 부호. 글꼴 고르는 기준도 여기 있어요.

| 사례 | 맞춤 | 가져올 것 | 피할 것 |
| --- | --- | --- | --- |
| [KRDS · 타이포그래피](https://www.krds.go.kr/html/site/style/style_03.html) | 바로 씀 | Pretendard GOV 기준 본문 17px, 줄 높이 150% 이상, 굵기는 400 · 700 위주로 네 가지 이하. 우리 글자 크기 단계를 공공 기준선과 맞춰 보는 데 써요. | 큰 제목에 자간 1px 을 주는 대목은 한글 자간 0 원칙과 부딪혀요. |
| [Pretendard · 글꼴 기능 설명](https://cactus.tistory.com/306) | 바로 씀 | tnum 으로 금액 · 날짜 · 수량 열을 맞추고, ss06 으로 I · l · 1 과 O · 0 을 갈라요. calt 는 '12:34' 의 쌍점 높이를 맞춰 줘서 시각 · 문서 번호 표기가 깔끔해져요. | 영문 글자가 Inter 바탕이에요. 영문만 Inter 를 따로 불러 쓰지는 않아요. |
| [토스 프로덕트 산스 제작기](https://toss.im/tossfeed/article/beginning-of-tps) | 바로 씀 | 실시간으로 바뀌는 수치엔 같은 폭 숫자, 혼자 크게 보여 주는 숫자엔 비례 숫자. 숫자 · 영문을 한글보다 살짝 두껍게 맞춘 이야기는 한글 · 영문 섞인 화면을 점검할 기준이 돼요. | 없음 |
| [국립국어원 · 맞춤법 43 · 44항과 문장 부호](https://korean.go.kr/kornorms/regltn/regltnView.do?regltn_code=0001&regltn_no=200) | 바로 씀 | 단위는 띄어 쓰되 숫자와 함께면 붙여도 되고, 큰 수는 만 단위로 띄어요(12억 3456만). 쌍점은 앞말에 붙이지만 시각은 10:20, 가운뎃점은 앞뒤에 붙이고 기간은 물결표(9월 15일~9월 25일). | 없음 |
| [MDN · word-break: keep-all](https://developer.mozilla.org/en-US/docs/Web/CSS/word-break) | 바로 씀 | keep-all 을 기본으로 둬서 한글이 글자가 아니라 어절 단위로 줄을 바꾸게 해요. 좁은 폰 표 칸에서 낱말이 반으로 쪼개지는 걸 막아요. | 없음 |
| [W3C · 한국어 텍스트 레이아웃 요구사항](https://www.w3.org/TR/klreq/) | 일부 가져옴 | 한글은 기본 글자 사이 0, 띄어쓰기는 어절 단위, 숫자 묶음은 줄 끝에서 끊지 않아요. '한글 자간 0' 과 줄바꿈 규칙의 근거 문서예요. | 없음 |
| [일본 디지털청 DADS · 타이포그래피](https://design.digital.go.jp/dads/foundations/typography/) | 일부 가져옴 | 본문 · 화면 글자 최소 16px, 14px 은 좁은 곳에만, 14px 미만 금지. 촘촘한 관리 화면 줄 높이 120~130%, 한 줄 단추 100% 로 나눈 표가 우리 '상태 글자 12px 이상' 규칙을 다듬을 근거가 돼요. | 작은 글자에 자간 1~2% 를 주는 값은 한글에는 빼요. |
| [SmartHR · 숫자 표기](https://smarthr.design/products/contents/idiomatic-usage/count/) | 일부 가져옴 | 세 자리 쉼표, 시각은 24시간제 hh:mm, 시스템 날짜는 두 자리로 채운 YYYY/MM/DD, 용량은 단위를 붙여 5GB. 한국어 화면 날짜를 따로 정해 둔 점도 참고해요. | 없음 |
| [SmartHR · 기호 표기](https://smarthr.design/products/contents/idiomatic-usage/symbol/) | 일부 가져옴 | 괄호마다 역할을 정해요(단추 · 탭 이름, 사용자가 넣은 값, 사용자가 만든 이름). 우리 표기 규칙 한 장의 틀로 쓰되, 영숫자 앞뒤 띄어쓰기 규칙은 한국어와 달라 옮기지 않아요. | 없음 |
| [토스 TDS Mobile · 타이포그래피](https://tossmini-docs.toss.im/tds-mobile/foundation/typography/) | 일부 가져옴 | 모든 단계를 줄 높이 1.5배로 맞춘 크기 표예요. 큰 글씨 설정에서 비율대로 커지도록 숫자를 직접 쓰지 말고 토큰만 쓰라는 원칙도 가져와요. | 11px 토큰은 최소 12px 원칙에 걸려요. |
| [SUIT 글꼴](https://sun.fo/suit/) | 일부 가져옴 | 같은 폭 숫자의 폭이 모든 굵기에서 같아서 굵기를 바꿔도 숫자 열이 흔들리지 않아요. 로트 · 시리얼 표기 점검 기준으로 좋아요. | 없음 |
| [스포카 한 산스 Neo](https://spoqa.github.io/spoqa-han-sans/) | 일부 가져옴 | 숫자 · 쉼표와 결을 맞추려고 글자를 다듬은 사례예요. '한글 옆에서 숫자가 따로 놀지 않나' 를 보는 기준으로 써요. | 없음 |
| [D2Coding](https://github.com/naver/d2codingfont) | 일부 가져옴 | 한글 폭이 영문의 딱 두 배인 고정폭 글꼴이에요. JetBrains Mono 에 한글이 없으니 문서 번호 칸에 한글이 섞일 때의 대체 후보로 둬요. | 없음 |
| [JetBrains Mono](https://www.jetbrains.com/lp/mono/) | 일부 가져옴 | 0 안의 점과 1 · l · I 구분이 또렷해서 문서 번호 · 로트 · UDI 표기에 맞아요. 코드용 합자는 숫자 칸에서 끄고, 한글은 Pretendard 로 넘어가게 글꼴 순서를 짜요. | 없음 |
| [LINE Design System · 타이포그래피](https://designsystem.line.me/LDSM/foundation/typography-ex-en/) | 참고만 | 12pt 미만은 권하지 않고, 같은 내용도 한국어 · 일본어가 영어보다 길어질 수 있다고 짚어요. 가장 작은 글자의 기준선을 확인할 때 써요. | 없음 |

## 확인하지 못한 곳

| 곳 | 까닭 |
| --- | --- |
| [Oracle Redwood 디자인 사이트](https://redwood.oracle.com/) | 열면 빈 화면만 나와 지침을 확인하지 못했어요. |
| [Gusto Workbench](https://medium.com/gusto-design) | 문서 사이트가 막혀 있고 블로그로 넘어가요. |
| [Twilio Paste](https://github.com/twilio-labs/paste) | 문서가 저장소로 넘어가 지침 페이지를 볼 수 없어요. |
| [Money Forward MFUI](https://design.moneyforward.com/) | 제목만 뜨고 내용이 비어 있어요. |
| [네이버 나눔글꼴 안내](https://hangeul.naver.com/font) | 열어 보지 못했고, 명조 계열이 함께 실려 있어 쓸 때 조심해야 해요. |
