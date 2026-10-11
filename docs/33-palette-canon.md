# 세 제품 화면 팔레트 정본

2026-10-10. Q-Atelier, Q-Maison, Q-Carnet의 공통 화면 색상을 Q-Design에서 수정하고 배포하는 경로다. 제품의 업무 상태 뜻, 제조사 설정, 인쇄 팔레트는 구분해서 보존한다.

## 수정하는 곳

`patterns/palette-overrides.json`의 `shared.dark`와 `shared.light`가 공통 색상 편집 자리다. 키는 `dist/q-design.tokens.json`에 존재하는 `--qa-*` 이름만 허용한다. 빈 객체는 기존 커밋에서 추출한 색상 그대로를 뜻한다.

```json
{
  "shared": {
    "dark": { "--qa-text": "#ffffff" },
    "light": {}
  }
}
```

이 변경은 아뜰리에 `--qa-text`, 메종 HSL 채널 `--foreground`, 카르넷 `--dhr-ink`와 이를 읽는 공통 부품에 전달된다. 값은 제품의 기존 변수 이름으로 변환하므로 화면별 코드를 다시 작성할 필요가 없다.

`dist/q-design.tokens.json`과 원본 엔진 `tokens.ts`를 손으로 고치지 않는다. `refresh-source`가 커밋된 원본을 다시 받아도 별도 소유 파일인 `patterns/palette-overrides.json`의 변경은 유지된다. 전체 추출 순서는 커밋된 원본, 토큰 추출, 팔레트 변환, 제품 사본 배포다.

## 연결 규칙

| 제품 | 화면 변수 | 테마 | 유지하는 의미 |
| --- | --- | --- | --- |
| Q-Atelier | `--qa-*` | `data-theme`, 기본 다크 | 공통 팔레트 이름과 값 |
| Q-Maison | `--background`, `--foreground`, `--primary`, `--qw-state-*` | `html.dark`, 기본 라이트 | HSL 채널과 투명도 유틸리티 |
| Q-Carnet | `--dhr-*`, 기존 Tailwind 색상 별칭 | `data-theme`, 기본 다크 | 현장용 상태색과 제조사 강조색 |

`patterns/palette-mappings.json`은 각 변수의 토큰, 고정 원본 테마, 예외값, HSL 변환, 제조사 우선 변수를 기록한다. 팔레트 CSS는 층 밖 `html:root` 선택자로 생성해 이후에 선언된 기존 globals 값보다 우선한다. `!important`는 쓰지 않는다. `PARTS`의 팔레트 세 항목은 `layer: false`여야 한다.

메종의 `brand`, `status`, `severity` Tailwind 이름은 고정된 테마의 색을 사용하던 호환 이름이다. 23개의 `--qw-legacy-*` HSL 채널로 연결하며 기존 색과 상태 의미를 유지한다. 메종의 다크 `muted-foreground`는 `subtle`, 삭제 버튼의 면은 양쪽 테마 모두 라이트 `red`를 사용한다. 별개의 용도이므로 같은 값으로 합치지 않는다.

카르넷의 라이트 `surface-sub`, 본문색 `body`, 머리띠 면, 상태별 옅은 바탕, vignette는 `products.carnet`의 예외값으로 기록했다. 상태의 초록, 주의, 안내는 각각 기존 `green`, `warning`, `blue`를 유지한다. 메종의 업무 단계 `state-green`, `state-copper`, `state-cobalt`와 임의로 바꾸지 않는다.

## 카르넷 제조사 강조색

기본 강조색 7단계는 `carnetBrand` 설정과 기존 `lib/tone.ts`의 계산 규칙으로 만든다. 라이트 강조색은 다크 샴페인을 기존 대비 기준면 `#f4f2ee`에 대해 보정한 값이다. 공통 라이트 샴페인을 직접 복사하지 않는다. 공통 다크 샴페인을 변경하면 기본 7단계도 다시 계산된다.

초기 생성값은 실제 `brandCss('#b8935a')`의 계산 결과를 보존한다. 기존 globals의 브랜드 바닥값 중 일부는 실제 계산과 달랐으므로 그 정적 값보다 실행 결과를 기준으로 삼았다. 이 차이는 브랜드 설정이 없는 미리보기와 실제 제품 사이의 기존 차이였다.

`#b8935a`는 기존 기본값을 식별하는 고정값이다. 데이터에 이 값이 저장되어 있으면 Q-Design 기본 팔레트가 화면을 결정한다. 다른 제조사 색상은 기존 계산으로 얻은 7개의 `--qd-company-brand*` 변수를 추가로 내려보낸다. 생성 CSS는 이 변수를 우선하고, 변수가 없으면 Q-Design 기본색을 사용한다. 회사가 기본색과 같은 값을 명시 저장한 경우도 기본값으로 취급한다.

회사별 색상 계산, 회사 이름과 로고, 사업 데이터는 제품이 소유한다. Q-Design 공통 팔레트 변경이 제조사 맞춤 강조색을 덮어쓰지 않는다. 기존 `--dhr-brand*` 런타임 선언도 유지해 종이 출력의 동작은 바꾸지 않는다.

## 화면과 종이

생성된 공통 팔레트는 `@media screen`에 한정된다. 제품의 기존 인쇄 규칙과 카르넷 `.sheet`의 직접 선언은 계속 적용된다. 메종의 새 호환 변수는 인쇄에서도 필요하므로 `@media print`에는 공통 override 이전의 고정 테마 기준값을 따로 내보낸다. 화면 색상 수정이 이 인쇄값을 바꾸지 않는다.

전문가 전용 화면의 별도 팔레트, 제품 PWA 아이콘 그림, 그래프 데이터 계열과 인쇄용 색상은 별도 역할 규칙으로 관리한다. 카르넷의 PWA 상단 바 색은 `carnetPlatform.themeColor`에 기록하며 기존 구리색 아이콘 규약과 대조한다. 회사별 입력 색상은 데이터로 유지하지만, 대비 계산의 바탕과 최소 대비값은 같은 중앙 팔레트에서 받는다.

## 생성과 확인

```powershell
node tools/build-palette.mjs
node tools/build-palette.mjs --check
node --test tools/palette.test.mjs
node tools/sync.mjs --write --part="팔레트 아뜰리에"
node tools/sync.mjs --write --part="팔레트 메종"
node tools/sync.mjs --write --part="팔레트 카르넷"
```

산출물은 `dist/q-design.palette.atelier.css`, `dist/q-design.palette.maison.css`, `dist/q-design.palette.carnet.css`다. 각 제품은 `app/q-design.palette.css`를 한 번 가져온다. 카르넷은 `dist/q-design.palette.carnet.ts`도 생성해 `lib/design/q-design-palette.ts`로 받는다. 화면 CSS와 동일한 입력으로 PWA 메타데이터와 회사 색상 대비 계산을 연결한다. 파일은 직접 수정하지 않는다.

기존 DB 기본색을 판별하는 `DEFAULT_BRAND_COLOR = '#b8935a'`는 데이터 호환 표식이므로 변경하지 않는다. 중앙 기본 강조색을 바꾸면 화면과 기본 설치 시작 배경이 새 색을 사용하고, 사용자가 지정한 회사 색은 유지된다. 런타임 사본은 `node tools/sync.mjs --write --part="카르넷 런타임 팔레트" --only=Q-Forge`로 반영한다.

생성기는 알 수 없는 토큰과 잘못된 매핑, CSS 주입 구문을 거부한다. 공통 text, subtle, muted는 바탕 세 종류에 대해 4.5:1, 조작 윤곽 ctl은 3:1, 주 동작 글자는 강조색 면에 대해 4.5:1을 검사한다. 모든 상태 배지 조합의 대비를 대신 보장하는 검사는 아니며 상태색 의미를 바꾸면 제품별 대비 검사도 다시 실행한다.

회귀 검사는 HSL 왕복 변환, 기존 색상 보존, 중앙값 변경의 세 제품 전파, 제조사 우선순위, 기존 7단계 계산과의 일치, 인쇄값 보존, 생성물 누락과 변조를 확인한다. 브라우저 검사는 실제 적용 순서와 화면 결과를 추가로 확인한다.
