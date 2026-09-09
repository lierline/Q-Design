# 실제 화면 22장

Q-Atelier 를 실제로 띄워 촬영한 것입니다. 데모 조직 데이터입니다.
**어느 이미지에서 무엇을 볼지는 [시각 참고 자료 문서](../../docs/14-visual-reference.md)에 있습니다.**

촬영일 2026-09-09 · 1600×1000 뷰포트 2배율 → 3200×2000 PNG
`_preview/` 는 문서에 붙이기 좋은 축소본입니다.

```
screens/
├ *.png              다크 16장 (원본)
├ _preview/          같은 것의 축소본
├ light/             라이트 모드 4장 (+ _preview/)
└ tokens/            토큰 견본 페이지 캡처 2장
```

## 다크 16장

| 파일 | 화면 | 보여 주는 것 |
|---|---|---|
| `hub-ra-workspace` | RA 워크스페이스 | 부서 허브 · 모듈 격자 · 탭 |
| `list-qms-documents` | QMS 통제문서 | 목록 · 상태별로 바뀌는 버튼 |
| `list-nonconformances` | 부적합 | 목록 |
| `list-deadlines` | 규제 일정 | 기한 추적 · 긴급도 색 |
| `detail-complaint` | 고객 불만 | 상세 · 단계 표시 · 다음 단계 카드 |
| `detail-research-project` | 연구 프로젝트 | 상세 · 산출물 |
| `detail-lot-trace` | 생산 로트 | 추적 · 계보 |
| `form-feedback-new` | 피드백 등록 | 기본 폼 |
| `form-udi-complex` | UDI 등록 | 복잡한 폼 |
| `field-receiving` | 입고 검사 | 현장 모드 (키보드 없음) |
| `dashboard-audit-readiness` | 심사 준비도 | 점수 대시보드 · 근거 접기 |
| `table-audit-trail` | 감사 로그 | 필터 바 + 표 + 분포 칩 |
| `matrix-design-trace` | 추적성 매트릭스 | 6열 교차표 · 3상 라디오 |
| `panel-design-review` | 설계 검토 | 회의 패널 |
| `panel-compliance-clause` | 조항 준수 | 확인 패널 |
| `doc-management-review` | 경영 검토 | 긴 문서형 |

## 라이트 4장 (`light/`)

`hub-ra-workspace` · `list-qms-documents` · `form-feedback-new` · `detail-complaint`

다크와 같은 화면입니다. 나란히 놓고 테마 처리를 비교하십시오.

## 토큰 견본 2장 (`tokens/`)

`swatches-dark` · `swatches-light` · `preview/index.html` 을 캡처한 것입니다.
서버를 안 띄우고 색과 부품을 확인할 때 씁니다.

## 다시 찍기

```bash
# 앱 화면 (Q-Atelier dev 서버가 3400 에 떠 있어야 합니다)
cd D:/Claude/Q-Atelier/scripts/screenshots
BASE=http://localhost:3400 THEME=dark OUT=D:/Claude/Q-Design/preview/screens node shoot.cjs 10 19 32

# 토큰 견본 (Q-Design 정적 서버가 4800 에 떠 있어야 합니다)
cd D:/Claude/Q-Design && node tools/shoot-preview.mjs
```

`shots.cjs` 에 42개 화면이 번호로 정의되어 있습니다. 위 이미지들은 그중 16개입니다.
번호와 파일 이름의 대응은 이 표의 순서가 아니라 촬영 후 손으로 바꾼 것이므로,
새로 찍으면 숫자 이름(`10.png`)으로 저장됩니다.

⚠️ 하네스의 `BASE` 기본값이 3000 입니다. **반드시 넘기십시오.** 안 넘기면 조용히 빈 화면이 찍힙니다.
⚠️ 클릭 동작이 붙은 항목(결재 상신 등)은 데이터 상태에 따라 실패합니다. 로그를 확인하십시오.
