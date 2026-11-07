# Q-Design

MedQraft 제품군(Q-Atelier · Q-Maison · Q-Carnet · Q-Sonar)의 디자인 정본입니다. 네 제품이 같은 집안으로 보이게 하는 규칙과, 그 규칙에서 나오는 산출물(CSS · 토큰 · 팔레트 · 글꼴 · 아이콘)을 한곳에서 만듭니다.

**깊은 무채색 위의 샴페인 골드. 에디토리얼 여백, 절제된 모션, 10px 모서리.** 장식이 아니라 «장인의 정밀함» 을 보이려는 시스템입니다.

이 저장소는 비공개 작업 저장소에서 **정본만 골라 내보낸 공개본**입니다. 제품 코드 사본 · 제품 화면 · 작업 기록은 들어 있지 않습니다.

## 무엇이 들어 있나

| 자리 | 내용 |
|---|---|
| `docs/01` ~ `docs/10` | 규칙 열 장. 브랜드 · 색 · 글자 · 여백과 배치 · 모양과 움직임 · 부품 · 화면 · 종이 문서 · 말투 · 운영 규칙 |
| `docs/reference/` | 참고 자료(참고 사이트 · 시각 기준 · 대표 화면 연구) |
| `patterns/` | 정본 CSS(`components.css` · `foundation.css` · `workspace.css` · `action-targets.css` · `typography-links.css`)와 아이콘 · 팔레트 · 글꼴 목록 |
| `dist/` | 도구가 만든 산출물: 토큰(JSON · CSS) · 제품별 팔레트 · 기반 CSS · 글꼴 CSS · 아이콘(SVG · React) · 앱 아이콘 · 네이티브 색 · 글자 파일 |
| `source/fonts/` | 글꼴 파일(Pretendard · Cormorant Garamond · JetBrains Mono) |
| `tools/` | 산출물을 만들고 검사하는 스크립트 |
| `preview/` | 정적 견본 세 쪽(`index.html` 글자 · 색 · 부품, `parts.html` 조각, `icons.html` 아이콘) |

견본은 폴더를 정적 서버로 띄우면 바로 열립니다(`python -m http.server 4800` 뒤 `/preview/index.html`). `?theme=light` 로 밝은 테마.

## 무엇이 빠져 있나

제품 저장소에서 가져온 코드 사본(`source/` 의 나머지 · `patterns/component-implementations` · `patterns/foundation` 조리법), 제품 화면을 담은 HTML(오프라인 · 시뮬레이터), 제품 화면 문구, 회사 문서 양식, 세션 기록과 감사 보고서, 검토 자료, 견본 fixtures. `tools/` 의 여러 스크립트는 비공개 제품 저장소가 옆에 있어야 돌아갑니다.

## 저작권

© MedQraft. 규칙 문서와 정본 CSS · 산출물의 저작권은 MedQraft 에 있습니다. 보는 것은 자유이지만 가져다 쓰는 권리는 따로 드리지 않습니다.

글꼴은 각자의 라이선스를 따릅니다: Pretendard · Cormorant Garamond · JetBrains Mono 는 SIL Open Font License 1.1(`source/fonts/` 의 라이선스 파일). 아이콘 원본 Phosphor 는 MIT(`vendor/phosphor/LICENSE` · `dist/icons/LICENSE`).
