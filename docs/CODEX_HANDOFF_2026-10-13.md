# 코덱스 전달: Q-Design 시험 실패 5건과 커밋 전 변경 확인 요청

작성: 2026-10-13 13:50경 (클로드 세션에서 점검한 결과)
목적: Q-Design 을 커밋·푸시하기 전에 코덱스가 확인하고 고쳐야 하는 것을 모았습니다.

## 1. 지금 상태

| 저장소 | 상태 |
|---|---|
| Q-Atelier | GitHub 와 같음. 올릴 것 없음 (아래 4번 참고) |
| Q-Works (Q-Maison) | 클로드가 첨부 안내 문구 1건과 시험 3개 파일을 커밋·푸시함 (커밋 2aff4e23) |
| DHR (Q-Carnet) | GitHub 와 같음. 시험 출력물 `reports/OQ-PGLITE-20261011074049.txt` 만 미추적 |
| Q-Design | 59건 커밋 전 (수정 11건 + 미추적 다수). 아래 시험 5건 실패 상태 |

타입 검사(`tsc --noEmit`)는 Q-Atelier, Q-Works, DHR 모두 통과했습니다.

## 2. Q-Design 시험 실패 5건 (확인 필요)

실행: `cd D:\Claude\Q-Design && node --test tools/*.test.mjs`
결과: 743건 중 738 통과, 5 실패. 전부 «저장해 둔 증거 ↔ 현재 제품 소스» 불일치입니다.

| # | 시험 파일 | 실패 내용 |
|---|---|---|
| 1 | `tools/atelier-icon-compatibility-review.test.mjs:21` | 저장된 아이콘 굵기 검토 목록에 없는 항목이 현재 소스에서 발견됨. Q-Atelier `lib/design/components.tsx` 1696줄 `{1.8}` (사유: 중앙 아이콘의 숫자 굵기 옵션이 아님, 면제 없음) |
| 2 | `tools/choice-glyph-revalidation.test.mjs:6` | 세 제품 컴포넌트 사본이 같은 글리프 배율을 쓰는지 대조에서 실패 (자세한 메시지는 아래 실행으로 재현) |
| 3 | `tools/maison-accent-review.test.mjs:18` | Q-Works `app/(app)/purchasing/analysis/delivery-tab.tsx` 231줄 해시가 저장값 `bbd1ace6…` 와 다름 (현재 `ed5a1cbb…`) |
| 4 | `tools/maison-current-navigation.test.mjs:7` | 부모 이동 링크 목록의 `inventoryHash` 불일치. 저장 `35d8538b…` 대 현재 `5f2c1558…` |
| 5 | `tools/release-history-refresh.test.mjs:12` | 「A changed live app source requires a new navigation inventory review: app/(app)/contracts/contract-form.tsx」. 해시 저장 `1155af2e…` 대 현재 `4485b460…` |

3, 4, 5번은 Q-Works 소스(`delivery-tab.tsx`, `contract-form.tsx` 와 앱 소스 전체 목록)가 증거 이후에 바뀌어서 생긴 것으로 보입니다.
Q-Works 는 오늘 클로드가 `components/attachments/attachment-panel.tsx` 한 줄(첨부 안내 문구)을 커밋했습니다. 이 파일이 위 5건에 들어가는지도 함께 봐 주세요.

## 3. 코덱스가 확인·결정해야 할 것

1. 위 5건의 증거 파일(`reviews/*.json`, `dist/*.json`)을 현재 제품 소스 기준으로 다시 만들어 주세요. 만든 뒤 `node --test tools/*.test.mjs` 가 전부 통과하는지 봐 주세요.
2. 미추적 파일 중 커밋하지 않을 것을 골라 주세요. 후보:
   - `debug.log`
   - `tools/atelier-parameter-node-debug.mjs` (이름이 임시 점검용으로 보임)
   - `preview/*.png`, `preview/*.html` 시안 비교판 (남길지 결정)
3. 수정 11건 중 `dist/` 와 `reviews/` 의 생성 파일이 `tools/` 변경과 같은 실행에서 나온 것인지 확인해 주세요 (어긋난 채 올라가지 않게).
4. 끝나면 오빠에게 «Q-Design 시험 전부 통과, 올려도 됨» 이라고 알려 주세요. 클로드가 이어서 커밋·푸시합니다.

## 4. 올리지 않기로 한 것 (참고)

- Q-Atelier `tsconfig.build.json`: `include` 에 감사용 임시 경로(`.next-qdesign-audit/types/**/*.ts`)가 들어감. 운영 빌드 설정에 넣기엔 부적절해서 보류했습니다. 필요한 변경이면 이유를 알려 주세요.
- Q-Atelier `components/ExpertNotificationsPanel.tsx`: 내용 차이 없이 줄바꿈 문자(LF/CRLF)만 다름.
- Q-Works `lib/app-version.ts`: 빌드 스탬프가 359 → 421 로 바꾼 흔적. 의도한 버전 갱신이면 알려 주세요.
- 빌드 산출물 폴더 `.next-qdesign-audit-before-review-20261011-1550/` (Q-Atelier), `.next-before-review-20261011-1550/` (Q-Works): 커밋 대상 아님. 필요 없으면 오빠 확인 뒤 정리.

## 5. 재현 명령

```
cd D:\Claude\Q-Design
node --test tools/atelier-icon-compatibility-review.test.mjs tools/choice-glyph-revalidation.test.mjs tools/maison-accent-review.test.mjs tools/maison-current-navigation.test.mjs tools/release-history-refresh.test.mjs
```

주의: 전체 시험은 오래 걸립니다 (한 시험이 7분 이상). 다른 무거운 작업과 동시에 돌리면 시간 초과가 날 수 있습니다.
