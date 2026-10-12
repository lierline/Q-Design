# 전문가 알림 글꼴 운영 반영과 릴리스 검사

아뜰리에 전문가 알림 패널의 글꼴 선택 3곳을 QDScale.family.mono에 연결했다. 기존 --qa-font-mono 변수는 정의되지 않아 일반 monospace로 표시됐으며, 수정 후에는 큐 디자인의 중앙 글꼴과 한국어 대체 글꼴을 따른다. 제품 커밋 99c19675384ba937dc5457848038c78566c5b797을 main에 반영했고 Vercel 운영 배포 dpl_Dz7rB1f9VbZX2gdMHaivZyHZwY8W의 READY 상태, 동일 커밋과 atelier.medqraft.app 연결을 확인했다.

미분류는 588건에서 582건으로 줄었다. 53,991개 인자의 순서와 전체 지문을 검사했으며, 변경한 6개 인자에는 현재 소스에서 다시 계산한 중앙 연결 근거를 요구했다. 그 밖의 판정은 유지했다. 변경된 파일을 참조하는 기존 검수 보고서 4개와 5개 참조를 새 지문으로 다시 검증했고, 이전 단계의 보고서를 정확히 복원하는 역검증도 통과했다.

실제 패널의 JSX, 중앙 모듈과 실제 WOFF2 파일을 사용한 브라우저 검사 12개가 통과했다. 밝음·어두움 테마와 320~1280px 폭에서 글꼴 선택 3곳, 표시 요소 5개의 중앙 글꼴 변경 전파와 가로 넘침 부재를 확인했다. 합성 알림만 사용했으며 외부 발송이나 운영 데이터 변경은 없다. 운영 배포 확인과 별개로 전문가 권한으로 인증한 운영 패널 자체는 이번 단계에서 열지 않았다.

현재 소스를 항상 먼저 읽고 전체 바이트와 경로 목록이 같은 경우에만 AST 근거를 재사용하도록 검수 속도를 개선했다. 같은 수정 시간의 내용 변경, 경로 추가·삭제, 호출자에 의한 근거 변조를 탐지하며, 이전 구현과 결과가 같다는 시험 4개를 통과했다. 검사 생략이나 수정 시간만 사용하는 캐시는 없다.

전체 릴리스 명령은 PLAYWRIGHT_BROWSERS_PATH를 설치된 고정 브라우저 경로로 지정하고 node tools/extract-all.mjs --check --only=Q-Atelier,Q-Works,Q-Forge를 실행했다. 최종 종료 코드 0으로 컴포넌트 계약, 원본 사본, 팔레트, 문구, 앱 독립 화면과 중앙 자원, 문서, 커버리지, 제품 동기화 및 아이콘 32/32 대조가 통과했다. 앞선 실행의 오래된 컴포넌트 레지스트리를 재생성한 후 전체 명령을 다시 실행한 결과다. 시뮬레이터의 간접 연결에 대한 정적 참조 안내는 남아 있으며, 모든 업무 화면의 운영 육안 검수를 완료했다는 뜻은 아니다.

검사 로그는 D:/Claude/tmp/qd-phase77-release-final.log, qd-phase77-font-browser.log, qd-phase77-font-tests.log, qd-phase77-manual-tests.log, qd-phase77-history-tests.log, qd-phase77-current-historical-source-tests.log, qd-phase77-context-cache-tests.log, qd-phase77-atelier-push.log에 있다. 운영 근거는 reviews/phase77-production.json에 기록했다. 추가로 발견한 업무 영역의 글꼴 덮어쓰기와 남은 582건은 다음 단계에서 이어서 검수한다.
