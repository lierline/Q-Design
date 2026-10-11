# 인라인 스타일 색인

생성물입니다. `node tools/extract-inline-styles.mjs` 로 다시 만듭니다.

컴포넌트의 인라인 CSS와 해당 파일이 직접 가져와 호출하는 중앙 CSS 규칙을 함께 색인합니다.
중앙 규칙은 `source/design/atelier-runtime.ts`에서 읽습니다. CSS 파일만 읽으면 이 규칙이 빠집니다.

| | 개수 |
|---|---:|
| 키프레임 전체 | **3종** |
| CSS 파일에 있는 것 | 0종 |
| 인라인에만 있는 것 | **3종** |
| `<style>` 을 가진 파일 | 1개 |

원본은 `source/screens/` 에 있습니다 (경로의 `/` 를 `__` 로 바꾼 이름).

## 인라인에만 있는 키프레임

`qa-drawer-slide-b` · `qa-drawer-slide-l` · `qa-drawer-slide-r`

## 파일별

| 파일 | 키프레임 | 클래스 | @media |
|---|---|---|---:|
| `lib/design/components.tsx` | `qa-drawer-slide-b` `qa-drawer-slide-l` `qa-drawer-slide-r` | 없음 | 4 |
| `audit-page.tsx` | 없음 | 없음 | 0 |
