# 실제 화면

Q-Atelier 를 실제로 띄워 촬영한 것입니다. 데모 조직 데이터이며 다크 테마입니다.
[화면 구조 문서](../../docs/11-screen-architecture.md)와 [조합 패턴 문서](../../docs/12-composition-patterns.md)의 근거입니다.

촬영일 2026-09-09 · 1600×1000 뷰포트 · 2배율 → 3200×2000 PNG
`_preview/` 는 문서에 붙이기 좋은 축소본입니다.

| 파일 | 아키타입 | 화면 |
|---|---|---|
| `hub-ra-workspace.png` | 허브 | RA 워크스페이스 (`/ra`) |
| `list-qms-documents.png` | 목록 | 조직 QMS 통제문서 (`/qms-documents`) |
| `detail-complaint.png` | 상세 | 고객 불만 (`/complaints/[id]`) |
| `form-feedback-new.png` | 생성 폼 | 피드백 등록 (`/feedback/new`) |
| `field-receiving.png` | 현장 모드 | 입고 검사 (`/m/receiving`) |

## 다시 찍으려면

Q-Atelier 저장소의 촬영 하네스를 씁니다. 매직링크로 로그인하므로 비밀번호가 필요 없습니다.

```bash
cd D:/Claude/Q-Atelier/scripts/screenshots
BASE=http://localhost:3400 THEME=dark OUT=D:/Claude/Q-Design/preview/screens node shoot.cjs 10 19 20 21 33
```

`shots.cjs` 에 42개 화면이 번호로 정의되어 있습니다. 위 다섯은 아키타입 대표로 고른 것입니다.
`THEME=light` 로 하면 라이트 모드로 찍힙니다.

⚠️ dev 서버가 3400 포트에 떠 있어야 합니다. 하네스의 `BASE` 기본값은 3000 이라 반드시 넘겨야 합니다.
