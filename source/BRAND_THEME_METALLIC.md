# 보관: 메탈릭 브랜드 테마 프리셋 (2026-06-07 실험, 미채택)

> 2026-06-07 브랜드 컬러 실험 결과를 **보관**한다(오빠 결정: 기존 골드/크림 테마로 롤백).
> 색 방향이 최종 톤과 안 맞아 prod 에는 미적용. 나중에 다시 검토할 수 있게 hex·설계를 박제.
> 적용처는 항상 `app/globals.css` 의 `--qa-*` + `lib/design/tokens.ts` 두 SSOT.

## 원본 팔레트 (BRAND_IDENTITY 이미지)

핵심(흑백+메탈릭): Noir `#080D10` · Obsidian `#111319` · Graphite `#1B1F24` · Silver `#D6D9DD` · Platinum `#F1F3F5`
상태 4색: Chrome `#6C7A89` · Muted Green `#2E7D68` · Caution `#F5C542` · NCR `#E06D6D`
질감: Metal(정밀) · Paper(명료/라이트) · Glass(다크 레이어) · Stone(안정/다크)
폰트(미적용): Cormorant Garamond(제목) · Pretendard(본문, 이미 적용) · IBM Plex Mono(데이터, 현 JetBrains)

## 다크: 메탈 블랙 + 딥그린 액센트 (실험 v2)

| 토큰 | hex |
|---|---|
| bg | `#0a0a0b` (새까만 중성 블랙) |
| surface | `#141416` |
| surface2 | `#1d1d20` |
| border | `#2a2a2e` |
| borderHi | `#3b3b41` |
| text | `#f1f3f5` (Platinum) |
| subtle | `#c7ccd2` (Silver) |
| muted | `#7d858f` (중성 메탈 그레이) |
| champagne(액센트) | `#3aae8c` (딥 메탈 그린) |
| onAccent | `#07140f` |
| green | `#3aae8c` (액센트와 통일) |
| red | `#e06d6d` (NCR) |
| warning | `#f5c542` (Caution) |
| blue | `#6f9cd6` |

## 라이트: 메탈 페이퍼 (실험 v1, 미채택)

| 토큰 | hex |
|---|---|
| bg | `#f1f3f5` (Platinum/Paper) |
| surface | `#ffffff` |
| surface2 | `#e7eaee` |
| border | `#d3d7dd` |
| borderHi | `#b8bfc7` |
| text | `#111319` (Obsidian) |
| subtle | `#3c4651` |
| muted | `#66717d` |
| champagne(액센트) | `#2a323b` (어두운 메탈) |
| onAccent | `#f1f3f5` |
| green | `#2e7d68` · red `#c84f4f` · warning `#8f6a12` · blue `#45596b` |

## 설계 노트 (재적용 시 참고)

- **액센트 키 이름은 `champagne` 유지**: 전 코드가 참조하므로 값만 바꾸면 전파됨.
- **`onAccent` 토큰 신설**: 액센트/상태색 면 위 텍스트. 액센트가 테마 반전(다크 밝음/라이트
  어두움)이면 onAccent 도 반전. 하드코딩 `#0a0908`(champagne 위 near-black)을 대체했음.
- **RibbonBackground** 는 `T.champagne` 를 따라감: 액센트가 무채색이면 검정 위에서 보라빛으로
  떠 보임(따로 노는 원인). 컬러 액센트(그린)면 그 색 무드로 정리됨.
- **select chevron SVG** 에 액센트 hex 가 직박혀 있음(`globals.css` 의 `%23...`): 중립 Chrome
  `#6c7a89` 로 두면 양 테마 무난.
- **숨은 하드코딩**: `#0a0908`(액센트 위 텍스트) 6파일(RoleReviewPanel·OwnerProductWorkflow·
  RevisionRowExpandable·CancelAssessmentButton·assessments/[code]) · `app/layout.tsx` themeColor.
- **state 7색(`--qa-state-*`)** · `app/experts/*` 독립 테마는 이 변경 범위 밖(유지).

## 회고: 왜 미채택

무채색 일변도라 밋밋·"따로 노는" 느낌(보라 ribbon) → 딥그린 액센트로 컬러를 넣어 통일감은
좋아졌으나, 최종 톤이 기존 골드/크림의 따뜻한 고급감과 맞지 않다는 판단(오빠). 기존 테마 유지.
재시도 시: 액센트 톤(그린 진하게/생생하게/골드 복귀) + 라이트 따뜻함 보존이 관건.
