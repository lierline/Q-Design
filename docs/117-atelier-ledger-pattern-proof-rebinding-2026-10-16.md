# 장부형 패턴 층의 증명 사슬 다시 묶기

2026-10-15 오너 결정(이름 · 값 목록은 A 장부 두 칸, 용어집과 검토 화면은 C 목록 + 상세)으로 아뜰리에 f6fcc65b와 Q-Design ecc29c5를 만들었다. 두 커밋은 원본 15개를 고쳤다. 아뜰리에가 11개, Q-Design 정본이 4개이고 고친 덩어리는 69개다. Q-Design 증명 사슬은 아뜰리에 61ddd606의 원본 지문을 고정해 들고 있어서 시험 43개가 실패했다. 이번 일은 검사를 느슨하게 하지 않고, 새 층 하나를 사슬 맨 앞에 붙여 다시 묶은 기록이다.

## 원칙

새 층은 정확히 기록한 고침만 되돌린다. 원본마다 고치기 전 지문, 고친 뒤 지문, 고친 줄 덩어리를 `reviews/atelier-ledger-pattern-sources.json`에 적었다. 고친 뒤 지문과 정확히 같은 원본만 고치기 전 원본으로 돌아간다. 다른 내용은 그대로 지나가고, 이전 층들의 정확한 검사가 거절한다.

고친 덩어리 안의 줄에는 짝이 없다. 그래서 고친 자리에 있던 옛 판정은 새 코드로 넘어오지 않는다. 고친 덩어리 밖의 줄은 줄 번호만 옮기고, 줄이 바뀐 판정은 인자 지문을 다시 계산해 맞춘다. 자기 지문이 없는 기록은 위치를 옮기지 않는다. 폐기하고 그 보고서의 증명 도구가 새로 증명하게 한다.

## 원본 사슬

이전 층들이 지금 원본을 읽던 자리는 장부 층을 먼저 되돌린 원본을 읽는다. 기존 전문가 글꼴 층이 쓰던 방식과 같다.

- 기반 CSS, 전체 글자, 소셜 터치: `global-typography-evidence`, `global-typography-ledger`, `atelier-social-touch-foundation`
- 뼈대 증명, 스타일 조각 이전 시험, 오프라인 목록, 이동 역변환: `atelier-skeleton-parity-proof`, `migrate-atelier-style-fragments.test`, `atelier-offline-cache-inventory`, `atelier-migration-inverse`
- 판정 원장 네 개: `atelier-forwarded-ledger`, `atelier-residual-ledger`, `atelier-import-ledger`, `atelier-supplementary-ledger`
- 데이터 소비 검토: 장부 고침이 닿지 않은 `components.tsx` 1996줄의 기준 기록만 새 지문으로 옮기고 다시 증명한다.

오프라인 목록은 고친 파일이 `ChoiceGroup`을 부르는 수가 고치기 전과 같은지 따로 잰 뒤에만 되돌린다.

옛 판정을 옛 원본으로 다시 증명할 때는 그 세계의 검토와 지문을 본다. `forwardedNodes`와 `supplementaryNodes`는 원본이 장부 고침 전 원본이면 매개변수 잎 검토와 보충 매개변수 검토를 커밋본으로 되돌려 읽고, 장부 파일의 지문도 고치기 전 지문으로 본다. 새 증명의 근거가 장부 파일을 가리키면 `historicalLedgerEvidence`가 고친 뒤 지문과 줄을 고치기 전 것으로 되돌린다. 근거 사슬의 머리인 `historicalChoiceGlyphEvidence`가 이것을 먼저 부른다.

## 판정 보고서

손으로 쓴 소비 검토 네 개(`atelier-style-spread-review`, `atelier-style-bindings-review`, `atelier-style-consumer-review`, `atelier-data-ratio-review`)는 지문과 고치지 않은 줄 번호만 옮겼다. 폐기한 기록은 0건이다.

도구가 만드는 보고서 15개는 각자의 증명 도구로 다시 만들었다. 판정 보고서와 검토 도구들은 서로를 읽으므로 지문이 더 바뀌지 않을 때까지 되풀이했고, 두 바퀴째에 멈췄다. 도구를 마지막으로 고친 뒤에도 한 번 더 돌려 바뀌는 보고서가 없음을 확인했다. 미분류 맥락 목록(`atelier-unknown-contexts.json`)도 다시 만들었지만 만든 시각을 찍는 목록이고 어느 층도 읽지 않아 기록에서 뺐다.

`reviews/atelier-ledger-pattern-review.json`이 보고서마다 고치기 전 지문, 고친 뒤 지문, 넘어온 것, 폐기한 것, 새로 생긴 것, 바뀐 것을 적는다. 사슬 머리 네 곳(`beforeCopyLeafOffsets`, `beforeChoiceGlyphReview`, `beforeWorkspaceTargets`, `beforeHeadingIconBoundaries`)은 이 층을 먼저 부른다. 이 층은 정확히 검토한 뒤 보고서만 커밋된 이전 보고서로 돌려준다. 복사 잎 위치 검사(`createCopyLeafOffsetReview`)도 새로 만든 매개변수 잎 검토를 이 층으로 먼저 되돌린 뒤 비교한다.

판정 보고서(`atelier-style-decisions.json`)는 53,999건에서 54,098건이 됐다. 고친 자리의 옛 기록 189건은 폐기했다(결재함 70, 용어집 48, 교육 기록 28, 부품 27, 로트 8, 공급자 4, UDI 4). 새 코드의 기록 288건은 생성기 규칙으로 새로 판정했다. 중앙 원본 확인 186, 토큰 참조 확인 39, 중앙 선택자 33, 구조 동작 19, 렌더러 매개변수 위임 5, 미분류 6이다. 바뀐 것 7건은 머리 · 아이콘 경계 기록으로, 판정은 같고 고친 증명 도구의 지문만 바뀌었다.

다른 보고서에서 바뀐 것은 모두 고친 파일의 호출 목록이거나, 자기 지문이 없어 폐기 뒤 다시 증명된 기록이다(크기 렌더러 6, 스타일 매개변수 흐름 2, 매개변수 잎 흐름 1). 스타일 매개변수 흐름 검토의 `public/q-design.offline-revision.js` 지문 하나는 이번 일과 관계없다. 10-12 아뜰리에 d25894e0이 그 파일을 고친 뒤 검토를 다시 만들지 않아 남아 있던 차이를 이번에 다시 만들면서 맞췄다.

부품 구현 목록(`dist/q-design.component-implementations.json`)은 정본 `components.tsx` 지문 하나만 바뀌어 다시 만들었다.

## 새로 생긴 미분류

미분류는 573건에서 579건이 됐다. 늘어난 6건은 모두 이번에 쓴 새 코드다.

| 자리 | 내용 |
|---|---|
| 결재함 `approve/client.tsx` 451 | 목록 + 상세 머리의 `position` 값(«3 / 10» 글자) |
| 용어집 `GlossaryPanel.tsx` 103 | 같은 `position` 글자 |
| 용어집 `GlossaryPanel.tsx` 31 | 분야 목록 `...c` 펼침(분야 이름 자료) |
| `components.tsx` 4386 | `Ledger`의 `qa-ledger`와 넘겨받은 className 잇기 |
| `components.tsx` 4485 | `ListDetail`의 `--qa-ld-height` 높이 변수 |
| `components.tsx` 4539 | 고른 줄을 목록 안에 보이게 하려는 화면 위치 재기 |

기준 보고서에도 같은 모양이 미분류로 남아 있다(`components.tsx` 3504의 `--qa-kpi-cols`). 이번 일에서 새 판정 규칙을 만들지 않고 미분류로 남겼다. 판정은 미분류 묶음을 다루는 다음 판정 층에서 한다.

## 결과

- 전체 시험(`node --test tools/*.test.mjs`)은 757개 중 754개가 통과한다. 실패 3개는 이번 일 전과 같은 시험이고 원인도 같다(아래 남은 일).
- `check-components.mjs`가 부르는 아뜰리에 관련 명령 검사 52개와 새 층 도구 2개를 하나씩 돌렸다. 54개 중 52개가 통과한다. `atelier-style-review --check`는 미분류가 하나라도 있으면 실패하는 검사라 기준(573건)에서도 실패했다. 보고서가 최신인지 보는 부분은 통과한다. `choice-glyph-revalidation --check`는 아래 메종 로그인 원인이다.
- 처음 명령 검사에서 도구 다섯 개가 걸렸다. 모두 위 원본 사슬과 같은 방식으로 고쳤다.
  - 복사 잎 위치(`atelier-copy-leaf-offsets`): 저장된 매개변수 잎 검토도 이 층으로 되돌린 뒤 새로 만든 것과 비교한다.
  - 프로필 격자 근거와 반응형 근거(`atelier-profile-grid-evidence`, `atelier-profile-responsive-evidence`): 소비 파일 지문을 장부 고침 전 원본으로 잰다.
  - 반응형 원장(`atelier-profile-responsive-ledger`): 새로 만든 반응형 검토를 이 층으로 되돌린 뒤 비교한다.
  - 소셜 터치 근거(`atelier-social-touch-evidence`): 기반 CSS 정본(`patterns/foundation/atelier.css`)과 소비 파일을 장부 고침 전 원본으로 읽는다. 근거 458건과 흐름 근거 11건이 그대로 넘어온다.
- 소셜 링크 화면 측정(`reviews/social-link-touch-browser.json`)은 검사를 돌리며 다시 쟀다. 20개 경우가 모두 그대로이고, 기록한 기반 CSS 지문만 지금 것으로 바뀌었다.

## 남은 일

- 두 저장소 모두 로컬 커밋만 있다. 아뜰리에 main 푸시는 운영 배포라 오너 확인 뒤에 한다.
- 기존부터 실패하던 시험 3개는 그대로다. 모두 메종 `app/(auth)/login/login-form.tsx` 지문이 탐색 목록 검토와 달라서 생긴다(`choice-glyph-revalidation`, `maison-current-navigation`, `release-history-refresh`에서 하나씩). 이번 일과 관계없다.
