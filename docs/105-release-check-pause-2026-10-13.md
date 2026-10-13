# 105번 작업 중단 기록

2026-10-13. 계정 주간 사용량 50% 도달로 사용자의 지시에 따라 중단했다.

완료 및 푸시: Q-Design 17b688785d17156dc1a8febb1110f06d83655f3b. 미분류는 아뜰리에 573, 메종 534, 카르넷 0, 합계 1,107건. 104번 검수의 24건을 포함해 이번 진행에서 총 80건을 정리했다. 104번 회귀 검사 20개 통과, 줄바꿈 해시 보정 후 관련 5개 재검사 통과.

전체 실행 tmp/qd-phase105-full-release.log는 종료 코드 7로 실패했다. 메종 과거 문구 연결 검사에 카르넷의 최신 호칭 연결 1건이 들어가 전체 비교가 실패했다. 기본 브라우저 캐시 경로도 샌드박스 경로로 잡혀 아이콘 렌더러를 찾지 못했다. 범위 밖 Q-Sonar 사본 3개 차이도 포함됐다. 이를 전체 통과로 보고하지 않는다.

별도 재검사: PLAYWRIGHT_BROWSERS_PATH=C:/Users/lierl/AppData/Local/ms-playwright 지정 후 아이콘 32/32 일치, 종료 코드 0 (tmp/qd-phase105-icons-repaired.log). sync --only=Q-Atelier,Q-Works,Q-Forge 종료 코드 0 (tmp/qd-phase105-three-product-sync.log). 정적 참조 미확인 public/__sim.html 1곳은 남는다.

운영 실제 화면: 카르넷 홈 호칭 수정 및 공통 글꼴 확인 완료. 메종 건강 이상 보고 입력·선택·텍스트 영역 모서리 10px, 공통 글꼴 확인. 취소 44x44px 확인. 계약 검토서는 표 너비 1024px을 내부 가로 스크롤로 처리하며 문서 전체 넘침 없음. 계약 화면 취소 44x36px, 등록 68.484375x44px, 두 모서리 10px. 측정 실제 뷰포트는 800 또는 1050px이다. 요청한 320px이 실제 측정에 반영되지 않아 모바일 320px 통과로 계산하지 않는다. 스크린샷은 tmp/qd-phase105-maison-health-form-production.png 및 tmp/qd-phase105-maison-contract-form-production.png.

남은 실제 문구: 메종 건강 이상 보고의 '이 값으로 가르고', '인쇄에는 찍히지 않습니다', '한 줄씩 더합니다', '번 줄 빼기'. 계약 양식의 '서식에 찍히는 구분', '필수 3칸', 첨부 안내의 '25MB 까지'. 아뜰리에 도움말의 괄호 뒤 조사 공백도 실제 운영에 남는다. 아직 수정했다고 주장하지 않는다.

미커밋 작업: dist/q-design.copy-bindings.current.json을 현재 문구 연결 대장으로 만들고, 기존 dist/q-design.copy-bindings.json을 12d9deb의 검수 당시 상태로 복원했다. copy-spacing.mjs의 실제 읽기·쓰기 경로와 carnet-honorific-review.mjs의 현재 대장 읽기·쓰기 경로만 변경했다. 새 active-copy-bindings.mjs와 검사 및 check-components 연결이 있다. 현재 양식 문구나 제품 코드는 이 단계에서 변경하지 않았다. 기존 대장에 새 호칭 연결이 들어가 과거 메종 검사가 실패하는 문제를 분리하는 작업이다.

직접 확인: maison-production-copy-bindings --check 통과, copy-spacing --check 142개 파일 통과. 새 검사 로그 tmp/qd-phase105-active-bindings-contracts.log에서 실제 작성기의 과거 대장 보존·현재 대장 사용, 미래 중앙 규칙 반영, 호칭·카르넷 검사 9개 통과를 확인했다. 50%에서 진행 중인 검사 세션을 중단 요청했다. 메종 관련 검사까지 전체 결과는 다음 진행에서 로그를 확인하고 끝내야 한다. 새 분리 수정은 미커밋 상태이며, 재검증 전 커밋·전체 릴리스 통과를 주장하지 않는다.

다음 후보는 tmp/qd-phase106-form-candidate-probe.json 및 tmp/qd-phase106-pinned-form-sinks.json. 메종 12개 양식 27건에 대해 타입, 실제 저장 호출 19개와 전체 소스 29개를 대조했다. 후보만 조사했으며 판정은 아직 하지 않아 1,107건에 포함된다.

기존 다른 작업 파일, 검수 계정 fixture, tokens.ts를 수정하지 않았다. iOS는 제외하고 Android 메종·카르넷 원격 작업은 Claude 담당이다. 다음 단계는 미커밋 현재 문구 대장 분리 검사를 마무리하고 정상 커밋·푸시, 현재 범위 전체 검사, 남은 실제 문구 수정과 27개 후보 판정이다.
