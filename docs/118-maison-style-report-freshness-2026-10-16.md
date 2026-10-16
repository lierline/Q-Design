# 118 메종 판정 보고서 낡음 검사 · 2026-10-16

## 왜 했나

- `node tools/maison-style-review.mjs --check` 는 미분류가 0인지만 봤다. 저장된 `reviews/maison-style-decisions.json` 이 지금 원본과 맞는지는 보지 않았다.
- 게다가 미분류 417 때문에 이 검사는 늘 실패한다. 그래서 저장본이 낡아도 알려 줄 검사가 하나도 없었다.
- 10-16 메종 탐색 목록 다시 묶기 중에 재현 사본이 «미분류 1,164 · 저장본과 다른 기록 767» 을 내서 저장본이 낡았다고 의심했다.

## 원인

- 저장본은 낡지 않았다. 지금 원본으로 생성기를 바르게 돌리면 미분류 417로 같다.
- 다른 기록은 로그인 화면(Q-Works 4d9361ae) 20건뿐이다. 12줄 밀린 줄 번호와 그에 따른 argumentHash · sourceHash 만 다르고, 판정 · 규칙 · 근거는 그대로다.
- 1,164 · 767 은 재현 사본이 ROOT 를 `'D:/Claude/Q-Design'` 문자열로 박은 탓이었다.
  - 수동 판정의 증거 경로 검사(`full.startsWith(base+path.sep)`)는 `path.resolve` 결과(역슬래시)를 정규화되지 않은 ROOT 와 비교해서 늘 거짓이 됐다.
  - 그래서 Q-Design 쪽 파일(tools · patterns · dist · source)을 증거로 쓰는 수동 판정 747건이 오류 없이 미분류로 떨어졌다.
  - 767 = 로그인 20 + 탈락 747. 같은 조건으로 다시 돌려 두 숫자가 그대로 나오는 것을 확인했다.
- 생성기는 `beforeContractHintReport` 같은 보고서 층을 쓰지 않는다. 수동 판정 기록 30개를 직접 읽고, 원본 · 증거 지문이 지금과 맞는 것만 받는다.
- 보고서 층들은 저장본을 읽는 다른 도구들이 옛 저장본을 되살릴 때 쓴다. 대부분 «바뀐 파일 밖의 행은 옛 커밋과 똑같아야 한다» 고 본다.
  그래서 저장본은 «가장 최근 원본 층 이전» 의 원본 기준으로 남아 있어야 한다. 지금 원본 기준으로 다시 쓰면 그 층들이 깨진다.

## 고친 것

| 자리 | 바뀐 것 |
|---|---|
| `tools/maison-style-review.mjs` | 제품 원본을 등록된 원본 층(`sourceLayers`, 지금은 `beforeLoginNoticeSource` 하나)을 거쳐 읽는다. 층은 검토한 «고친 뒤» 원본과 정확히 같을 때만 «고치기 전» 원본으로 되돌리고, 다른 내용은 그대로 흘린다. |
| `--fresh` (새 방식) | 새로 만든 보고서에 저장본의 만든 시각만 넣어 저장본과 바이트로 비교한다. 미분류 목록 파일도 바이트로 비교한다. 다르면 무엇이 다른지(머리 · 원본 지문 · 기록 · 미분류 목록 · 형식) 열 개까지 알려 주고 실패한다. 미분류 개수는 보지 않는다. |
| `--check` | 미분류 0 과 `--fresh` 를 함께 요구한다. |
| `--write` | 같은 층을 거치므로 지금 돌리면 저장본에서 만든 시각만 바뀐다. |
| `tools/maison-style-manual.mjs` | 증거 경로 읽기를 `manualHashReader` 로 옮기고 두 뿌리를 `path.resolve` 로 정규화했다. 빗금 문자열 ROOT 로도 판정이 떨어지지 않는다. |
| `tools/maison-style-output.mjs` | 비교(`compareSaved`)와 `--fresh` 모드. |
| `tools/check-components.mjs` | 명령 검사에 `maison-style-review.mjs --fresh` 를 넣었다. `--check` 줄보다 앞이라 미분류 실패에 가려지지 않는다. |

시험:

- `tools/maison-style-freshness.test.mjs`: 실제 생성기를 `--fresh` 로 돌려 저장본과 바이트까지 같은지 본다.
- `tools/maison-style-output.test.mjs`: 6개. 만든 시각만 다르면 통과, 판정 · 원본 지문 · 미분류 목록 · 형식이 다르면 실패, 저장본이 없으면 실패, 어떤 모드도 저장 파일을 건드리지 않음.
- `tools/maison-style-manual.test.mjs`: 빗금 문자열 뿌리에서도 증거가 읽히고, 뿌리 밖 경로는 거절되는지.

## 일부러 깨뜨려 본 것

| 깨뜨린 것 | 결과 | 되돌린 뒤 |
|---|---|---|
| 실제 저장소에서 `sourceLayers` 를 비움(로그인 층 빼기) | `maison-style-freshness` 시험 실패. 원본 지문 1건(`login-form.tsx` 9f99f8d6 → c02171b1)과 기록 20건을 짚음 | 파일을 바이트까지 되돌리고 통과 |
| 저장본 사본에서 기록 하나(21330번, `purchasing/analysis/delivery-tab.tsx` 231줄)의 판정을 바꿈 | `--fresh` 종료 1, 그 기록 하나와 `decision` 칸만 짚음 | 원래 저장본으로는 종료 0 |
| 이전 세션처럼 ROOT 를 `'D:/Claude/Q-Design'` 문자열로 박은 사본 | 고치기 전에는 미분류 1,164 · 다른 기록 767. 고친 뒤에는 미분류 417 · 낡음 0 으로 통과 | 해당 없음 |

저장 파일 두 개(`maison-style-decisions.json` · `maison-style-unknowns.json`)는 이 일 내내 한 글자도 바꾸지 않았다.

## 다음에 제품 원본이 바뀌면

- `--fresh` 와 `maison-style-freshness` 시험이 실패하고, 바뀐 원본 지문과 기록을 알려 준다.
- 고침이 모양 인자를 건드리지 않는 정확한 고침이면, 원본 층을 하나 만들어(`maison-login-session-notice` 처럼) `sourceLayers` 맨 앞에 넣는다. 저장본은 다시 쓰지 않는다.
- 모양 인자가 바뀌는 고침이면, 그 기록을 다시 판정하고 저장본을 읽는 보고서 층 사슬을 함께 다시 묶어야 한다. 이것은 오너 판단으로 정한다.
