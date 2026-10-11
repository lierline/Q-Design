# 홈 위젯 편집 움직임 규칙

2026-10-10. 아뜰리에 적용 커밋: `4845a601`.

위젯 편집에서는 이름과 조작 단추를 포함한 바깥 틀을 회전하거나 이동하지 않는다. 미리보기 본체에만 작은 편집 진입 표시를 적용한다. 기본값은 회전 각도 0.12도, 주기 1.4초, 반복 2회이며, 2.8초 후 수평 상태로 멈춘다.

마우스를 올리거나 내부 조작 단추에 키보드 초점이 들어오면 본체 움직임도 정지한다. 드래그 중에는 회전을 정지하고 기존 투명도 표시를 유지한다. 터치 중심 입력과 움직임 최소화 설정에서는 편집 회전을 사용하지 않는다. 드래그, 순서 변경, 숨기기 동작과 단추 크기는 변경하지 않았다.

정본은 `patterns/foundation/atelier.css`이다. `--qd-widget-edit-tilt`, `--qd-widget-edit-cycle`, `--qd-widget-edit-cycles`로 조절하고, `build-foundation.mjs`와 `sync.mjs`를 통해 제품에 반영한다. 생성된 제품 CSS를 직접 수정하지 않는다.

기존 로컬 소유자 계정의 실제 홈 화면에서 숨기기 단추를 누르고 표시 상태를 복원했다. 실제 위젯 HTML과 정본 CSS를 사용하는 독립 브라우저 검사에서는 두 반복의 각 시점에서 조작 단추 위치가 동일함을 확인했다. 각도 제한, 종료 후 수평 복원, 마우스 접근, 키보드 초점, 터치 입력 조건, 움직임 최소화 조건이 통과했다. 실제 모바일 기기 전체 검수를 대신하는 결과는 아니다.

CSS 변경 블록을 역변환해 이전 전체 파일 지문과 대조했다. 변경 블록 밖의 본문은 동일하며 제품 생성 지문만 함께 갱신했다. 관련 검토 근거는 해당 역변환과 위치 대조를 거쳐 갱신했다.

관련 회귀 검사 11개가 통과했다. 변경된 인자 목록과 소스 목록을 갱신한 뒤 `extract-all.mjs --check --only=Q-Atelier,Q-Works,Q-Forge` 전체 릴리스 자동 검사도 종료 코드 0으로 통과했다. 중앙 소스 사본 110개와 제품 앱 아이콘 32개가 모두 일치한다. 별도로 남아 있는 전체 디자인 감사의 미검토 항목이 해소되었다는 뜻은 아니다. 아뜰리에 미분류 인자는 1,036개로 유지된다. 푸시와 배포는 하지 않았다.

- [수정 화면](D:/Claude/Q-Design/reviews/atelier-widget-edit-stable.png)
- [실제 화면 관찰](D:/Claude/Q-Design/reviews/atelier-widget-edit-live-observation.json)
- [브라우저 동작 검사](D:/Claude/Q-Design/reviews/atelier-widget-motion-browser.json)
- [CSS 역변환 대조](D:/Claude/Q-Design/reviews/atelier-widget-motion-revalidation.json)
- [최종 릴리스 검사 로그](D:/Claude/tmp/qd-widget-release-final.log)
