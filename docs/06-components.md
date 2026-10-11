# 컴포넌트

현재 세 제품의 공통 표시 규칙은 `patterns/components.css`와 제품별 기반 규칙에서 관리한다. 아래 원본 실측 표는 초기 추출 당시의 기록이다. 현재 값과 중앙 연결 여부는 `dist/q-design.components.json`, `dist/q-design.style-arguments.json` 및 제품별 검토 기록을 함께 확인한다.

### 알림 너비·여백·줄바꿈 (2026-10-12)

세 제품의 알림은 `patterns/foundation.css`의 `--qd-toast-width`를 사용한다. 최대 너비는 `--qd-toast-max-width`(360px), 각 화면 끝 여백은 `--qd-space-5`와 해당 방향의 안전 영역을 합친다. 모바일에서는 양쪽 여백을 뺀 화면 너비까지 줄어든다. 위치별 토큰은 `--qd-toast-inset-top`, `right`, `bottom`, `left`다. 한글은 `--qd-copy-word-break`로 단어 사이에서 줄바꾸고, 긴 식별자는 `--qd-copy-overflow-wrap`으로 상자 안에서 줄바꾼다. 텍스트의 flex 최소 너비는 `--qd-space-0`이다.

아뜰리에 ToastProvider, 메종 Sonner 어댑터, 카르넷 Toasts가 같은 규칙을 읽는다. 메종의 라이브러리 닫기 버튼은 알림 오른쪽 내부에 배치하고 중앙 제어 높이, 모서리, 보조 글자색, 호버 색과 키보드 초점 규칙을 적용한다. 메시지 내용, 성공·오류 판정, 유지 시간과 닫기 동작은 변경하지 않는다. 실제 세 제품 부품의 36개 조건과 중앙 값 변경 전파를 `tools/verify-toast-copy.mjs`로 확인한다. 앱 오프라인 자산에도 이 정본이 포함된다.

### 기본 UI 구현 정본 (2026-10-12)

검토한 기본 UI 구현 29개 파일은 `patterns/component-implementations/`가 정본이다. 아뜰리에의 기본 부품·선택·한글 표시·알림·로딩 묶음 5개 파일, 메종 `components/ui`의 18개 파일과 공용 화면 로딩 묶음 1개 파일, 카르넷 기본 UI·표·대화상자·알림·행 링크 5개 파일이 해당한다. 범위는 `patterns/component-implementations.json`, 실제 공개 내보내기와 제품 연결은 `dist/q-design.component-implementations.json`에서 확인한다. 161개 값 내보내기와 11개 타입 내보내기는 부품뿐 아니라 보조 함수·타입을 포함한다. Skeleton의 다섯 부속 렌더러는 별도 항목으로 기록한다.

제품 사본의 전체 본문을 정본과 대조하며 새 메종 UI 파일, 목록 밖 정본 파일과 검토되지 않은 재내보내기를 거부한다. 생성 전에 모든 정본 구문과 선택된 대상 경로를 확인해 앞 제품만 먼저 고치는 것을 막는다. 문구 교정도 이 범위에서는 정본을 수정한 뒤 생성으로 제품에 전달한다. 기존 `lib/design` 제외를 풀 때는 명시된 세 UI 파일만 추가하고 검증 엔진·토큰 원문은 제외한다.

가족 전체의 외형은 공통 CSS·팔레트·표시 인자를 수정한다. 제품별 마크업·접근성·입력 부품 구현을 바꿀 때는 해당 구현 정본을 수정한다. `extract-all --sync --only=Q-Atelier,Q-Works,Q-Forge`와 최종 `--check`, 제품 검사·빌드·배포를 수행한다. 업무 데이터, 콜백, 기기 설정, 호출부의 `style`·`className`과 외부 도메인 라벨은 별도 입력이다. 구현 파일의 정본 소유를 이유로 미분류 표시 인자나 모든 화면 상태를 자동 승인하지 않는다.

### 로딩 묶음의 현재 규칙 (2026-10-12)

아뜰리에 `components/Skeleton.tsx`의 기본형과 `Row`, `Card`, `KPIGrid`, `PageHd`, `Table`은 같은 정본 파일에서 생성한다. 면은 `--qd-surface2`, 모서리는 `--qd-radius`, 반복 시간은 `--qd-skeleton-duration`을 읽는다. 현재 공통 효과는 투명도를 바꾸는 pulse이며, 움직임 줄이기 설정에서는 애니메이션을 멈춘다. 아래 초기 실측 표의 champagne shimmer는 현재 구현 규칙이 아니다.

메종 `components/shared/page-skeleton.tsx`도 구현 정본에서 생성한다. 필터 입력·선택, 양식 입력과 제출 자리의 높이는 `--qd-control-height`를 읽는다. 머리의 작은 동작 자리는 `--qd-control-height-sm`을 사용하되 화면 폭 640px 이하 또는 터치 포인터에서는 일반 제어 높이를 최소 높이로 적용한다. 현재 기본값은 일반 44px, 데스크톱 작은 동작 36px다. 제목 자리의 높이와 콘텐츠 반복 개수는 별도 규칙이다. 실제 Input·Button과 로딩을 현재 제품 CSS로 렌더링하는 `tools/verify-maison-loading-controls.mjs`가 두 테마, 다섯 화면 폭과 두 포인터 조건에서 중앙 높이 변경까지 대조한다. 전체 업무 화면과 날짜 입력의 시각 인증은 별도 검사다.

기본 높이·간격·반복 개수는 중앙 `QDPresentation`에서 전달한다. 명시한 폭·높이·행·열 개수와 호출부 스타일은 별도 입력이다. 다섯 부속 렌더러의 공개 이름과 실제 함수 이름을 명시적으로 등록했고, 이름 변경·누락·추가·계산된 속성·중첩 대입을 생성 전에 거부한다. React `displayName` 문자열은 표시용 메타데이터이므로 부품으로 세지 않는다.

### Android 시작 화면 정본 (2026-10-12)

세 Android 앱의 `LaunchView.java`는 `patterns/native/launch-view.java.tpl` 한 벌에서 생성한다. 제품별로 바뀌는 것은 패키지명과 제품명이다. 그리기, 위치 계산, 시작·대기·종료 애니메이션과 접근성 대응은 공통 템플릿에서 관리한다. 글자 크기, 바탕색과 안내 문구 줄바꿈 전략은 기존 중앙 생성 리소스를 계속 읽는다. 로고·글꼴 파일, 시스템 애니메이션 배율, 화면 크기와 실행 상태는 별도의 자산·플랫폼 입력이다.

`node tools/extract-all.mjs --sync --only=Q-Atelier,Q-Works,Q-Forge`로 생성과 앱 소스 동기화를 함께 수행한다. `--check`는 템플릿, 생성 파일, 세 실제 앱 소스와 Java 구문 트리 목록의 일치를 검사한다. 제품 사본을 직접 수정하면 전체 파일 비교가 실패한다. 템플릿 한 곳 변경의 세 사본 전파와 동기화 누락을 별도 회귀 검사로 확인한다. 설치 앱에는 재빌드·서명·배포가 필요하다.

구문 트리 목록은 제품별 428개, 합계 1,284개 표현을 기록한다. 리터럴·변수 초기화·호출 인자·매개변수·대입 값이 포함되며 서로 겹치는 표현도 있다. 이 수를 독립 디자인 조절값 개수로 해석하지 않는다. 다른 Android 클래스, iOS 부품과 설치 화면까지 완료한 기록은 아니다.

### 자동 채움 입력 상태 (2026-10-11)

브라우저가 채운 `input`과 `textarea`도 중앙 팔레트를 따른다. `--qd-autofill-surface`는 `--qd-surface`, `--qd-autofill-ink`는 `--qd-text`에 연결한다. 브라우저 고유 배경은 중앙 inset paint로 덮으며 자동 채움 기능과 값은 변경하지 않는다. 키보드 초점은 중앙 강조색·테두리 두께·간격을 따른다. 비활성 상태는 `--qd-bg`와 `--qd-muted`로 바꾼다. 시스템 강제 색상 모드에서는 `FieldText`, `GrayText`, `Highlight`를 사용하고 inset paint를 해제한다.

이 규칙은 세 웹 제품, 아뜰리에의 독립 시뮬레이터와 오프라인 화면, 세 Android 앱과 아뜰리에 iOS의 생성 오프라인 자산에 포함된다. 중앙 수정 후 생성·동기화·제품 빌드·배포를 수행해야 반영된다. 설치 앱에 포함되는 변경은 앱 재빌드와 서명·배포도 필요하다.

원본은 부품 60여 종이 **파일 하나(`components.tsx`, 3,733줄)** 에 모여 있습니다.
스타일은 CSS 클래스가 아니라 **인라인 style 객체**로 들어갑니다.
호버·포커스처럼 인라인으로 표현할 수 없는 것만 전역 CSS 클래스(`qa-*`)를 씁니다.

전문은 `source/components/components.tsx` 에 있습니다. 아래는 실측 스펙 표입니다.

---

## 1. 폼

### `In` · `Sel` · `Txt` (입력·선택·다중행)

```
width: 100%  ·  padding: 10px 14px  ·  fontSize: 13
background: surface  ·  border: 1px solid border  ·  color: text
class: qa-input  →  border-radius 10px
```

상태는 전역 CSS 가 담당합니다.

```css
.qa-input:hover:not(:focus)  { border-color: var(--qa-borderHi); }
.qa-input:focus {
  border-color: var(--qa-champagne);
  background-color: var(--qa-surface2);          /* 포커스 시 한 겹 들어갑니다 */
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--qa-champagne) 18%, transparent);
}
```

**포커스에서 배경이 `surface` → `surface2` 로 바뀌는 것**이 이 시스템의 촉감입니다.
테두리만 바뀌는 것과 다릅니다.

`Sel` 은 네이티브 화살표를 지우고 SVG 셰브론을 data URI 로 깝니다.
data URI 는 `var()` 를 못 받으므로 **테마별로 두 벌**이 있습니다 (다크 `#b8935a` · 라이트 `#8a6838`).

모바일(≤1023px)에서 입력 글자는 14px 로 커집니다.
iOS 는 16px 미만 입력에 포커스하면 자동 확대하는데, **디자인 통일을 우선해 14px 를 택한 결정**입니다.

#### `Field` 가 오류 · 도움말을 칸에 «연결» 합니다 (2026-10-08)

`<Field id="x" error="…" hint="…"><In id="x" … /></Field>` 로 쓰면 Field 가 자식 가운데
**id 가 같은 칸**을 찾아 `aria-describedby="x-hint x-error"` 와 `aria-invalid` 를 끼워 넣습니다.
오류 글귀는 `id="x-error"` 와 `role="alert"` 를, 도움말은 `id="x-hint"` 를 갖습니다.
호출부 556곳은 손댈 것이 없고, 호출부가 이미 준 `aria-describedby` 는 앞에 그대로 남습니다.
`FldRow` 를 `htmlFor` 없이 쓰면(이름표도 못 잇는 옛 호출) 연결도 하지 않습니다.
계약: `field-error-link.test.tsx`. ui-ux-pro-max 지침 119개 대조에서 남은 빈칸이었습니다.

#### 제출 실패는 단추 위에 «남는» 요약으로, 초점도 거기로 (2026-10-08)

긴 폼이 실패하면 토스트 한 줄이 떴다 사라졌습니다. 어느 칸이 문제인지 찾아야 했고, 낭독기 · 키보드
사용자는 초점이 단추에 남아 아무 데도 못 갔습니다. 이제 실패는 제출 단추 바로 위에 남는 `Alert`(오류 ·
`role="alert"`)로 나타나고, **초점이 거기로 옮겨 가며**, 칸마다 이름표 글귀를 눌러 그 칸으로 갑니다.
서버가 `invalidInput` 으로 준 `issues.fieldErrors` 는 `Field` 의 inline 오류로도 이어집니다(위 연결 규칙 그대로).

```tsx
const sf = useSubmitFailure({ title: 'qo-title', period_end: 'qo-end' });   // API 칸 이름 → 화면 칸 id
async function submit() {
  sf.clear();
  …
  if (!res.ok) { sf.fail(failureFromResponse(json, '저장하지 못했습니다.')); return; }
}
<Field id="qo-end" error={sf.fieldError('period_end')}>…</Field>
<SubmitFailureSummary failure={sf.failure} nonce={sf.nonce} fieldIds={sf.fieldIds} onClose={sf.clear} />
<FormActions>…</FormActions>
```

- 화면 쪽 검증(비어 있는 필수 칸)도 `sf.fail({ message, fields: { name: … } })` 로 같은 길을 씁니다.
- 요약은 `FormActions` 바로 앞에 둡니다. 누른 뒤 사용자의 눈과 초점이 거기 있습니다(원칙 «다음 단계는 화면에 보여야 한다»).
- 같은 실패가 반복돼도 `nonce` 가 올라 요약이 다시 초점을 받습니다. 초점 고리는 전역 `:focus-visible` 에 맡기고 인라인 `outline` 은 쓰지 않습니다(계약 ⑳).
- 본은 새 기록 폼 아홉(품질목표 · 리콜 · 피드백 · 장비 · 대리인 · 로트 · 허가 · 생산 설비 · 공정 검증). 계약: `submit-failure.test.tsx`.

### `Btn`

| | 기본 | `sm` |
|---|---|---|
| padding | `11px 22px` | `7px 14px` |
| minHeight | 44 | 36 (터치 기기에서 44) |
| fontSize | 12 | 11 |

```
lineHeight: 1  ·  fontWeight: 500  ·  gap: 6  ·  whiteSpace: nowrap
letterSpacing: labelTracking(children, 1.2)     ← 한글이면 0
textTransform: 한글이면 없음, 아니면 uppercase
border: 항상 1px  (primary 는 transparent)
```

**primary 에도 투명 1px 테두리를 두는 것**이 요령입니다.
안 그러면 primary 와 secondary 의 크기가 1px 씩 어긋납니다.

| 변형 | 배경 | 글자 | 테두리 |
|---|---|---|---|
| primary | `text` (크림) | `bg` | transparent |
| secondary | transparent | `subtle` | `border` |
| danger primary | `red` | `bg` | `red` |
| danger secondary | transparent | `red` | `red` |

**주 버튼이 금색이 아니라 크림색입니다.** 금은 액센트로 아껴 두고, 행동은 밝기로 부릅니다.

**`pending` (2026-10-08):** 저장 · 제출처럼 서버를 기다리는 단추는 `pending={saving}` 하나로
`disabled` + `aria-busy` + 회전 표시(`qa-spin`)가 함께 켜집니다. 글자는 지우지 않고 `visibility: hidden`
으로 자리만 남겨 **폭이 흔들리지 않습니다.** 화면마다 `disabled={saving}` 을 손으로 걸던 것
(474곳 중 236곳만 걸려 있었음)을 대신합니다. 동작 줄이기 설정에서는 전역 규칙이 회전을 멈춥니다.
계약: `field-error-link.test.tsx` ②.
호출부 규칙(2026-10-08 · Q-Atelier 183곳 전환): 검증 조건은 `disabled` 에 남긴다(`pending={saving} disabled={!ok}`). 행마다 다른 깃발이면 `pending={busy === 'sync'} disabled={busy !== null}` 처럼 «이 단추가 도는 중» 과 «다른 동작 중 잠금» 을 가른다. 글귀에 «…중» 삼항을 두지 않는다(스피너가 대신하고 글자 폭이 흔들리지 않게). 한 깃발을 여러 단추가 나눠 쓰면 어느 단추가 눌렸는지 알 수 없으니 깃발을 `null | '동작이름'` 으로 가른 뒤에 쓴다. 처리 중에는 숨은 글귀 «처리 중» 이 단추 이름을 잇는다(visibility:hidden 은 접근성 트리에서도 빠지므로).

### `IconBtn`

```
44×44  ·  border-radius 6  ·  transparent 배경  ·  color muted
hover → color text · border-color borderHi
```

### `Switch` · `Checkbox` · `FilterChip`

```
Switch      md 48×26 · sm 40×22 · border-radius pill · 배경 전환 160ms
Checkbox    16px 상자 · 행 전체가 padding 10px 12px · radius 10 · 체크 시 액센트 배경
FilterChip  padding 5px 12px · fontSize 10 · 활성 시 색 채움
```

---

## 2. 컨테이너

### `Bx` (기본 상자)

모든 카드의 바탕입니다.

```
background: surface  ·  border: 1px solid border
border-radius: var(--qa-radius-card, 10px)
box-sizing: border-box
accent prop → border-left: 3px solid (champagne|green|warning|red|blue|muted)
lift prop  → class qa-card-lift
```

> **⚠️ `Bx` 에는 기본 padding 이 없습니다.**
> 일부러 그렇게 두었고, 계약(`bx-padding.test.ts`)이 **모든 사용처가 padding 을 주는지** 검사합니다.
> 이 전제가 깨지면(기본값을 넣으면) 계약도 함께 무너집니다.

### `Card` · `SectionCard` · `Panel`

```
Card         padding 22px 24px · minHeight 124 (KPI 와 행 높이를 맞추기 위해)
SectionCard  padding 24 · gap 12
Panel        loading/error/empty 상태를 감싸는 래퍼. 각각 SkeletonPanel · Alert · 빈 노드
```

`Panel` 은 «데이터가 오는 자리» 의 표준입니다. 로딩이면 스켈레톤, 실패면 알림, 비면 빈 상태를 알아서 그립니다.

### `Grid`

**인라인 스타일로는 미디어 쿼리를 못 쓰기 때문에** `<style>` 규칙을 동적으로 만들어 주입합니다.

```
cols={4}  →  기본 1열 · md 2열 · lg 4열
gap 기본 10
```

계약(`grid-rules.test.tsx`)이 잠그는 것: 규칙이 있으면 **인라인 `gridTemplateColumns` 를 내지 않습니다.**
인라인은 클래스를 이기기 때문에, 남아 있으면 브레이크포인트 규칙이 한 번도 적용되지 않습니다.
실제로 원본에 그 버그가 있었습니다.

#### 폼 칸 두세 개를 나란히 놓을 때는 `foldGrid` (2026-10-08)

날짜 두 칸 · 글자 두 칸처럼 «n 열로 놓되 좁으면 줄어야 하는» 자리에 `gridTemplateColumns: '1fr 1fr'` 를 손으로 쓰지 않습니다.
한 열이 칸의 최소 폭보다 좁아져도 열이 안 줄어, 확대 400%(폭 320)에서 오른쪽이 잘렸습니다(42화면 중 8화면, 앱 전체 59곳).

```tsx
<div style={foldGrid(2, S[3])}>                                   // 최대 2열, 한 열이 150px 보다 좁아지면 1열
<div style={foldGrid(3, S[2], { min: 110 })}>                     // 입력 세 칸(최소 · 최대 · 단위)
<div style={{ ...foldGrid(2, S[3]), marginBottom: S[3] }}>        // 다른 style 과 같이
<div style={foldGrid(2, S[6], { min: 200, rowGap: S[4] })}>       // 행 간격이 다를 때
```

- 규칙은 `repeat(auto-fit, minmax(max(min, 균등 1/n 폭), 1fr))` 입니다. **열은 n 개를 넘지 않고, 들어가지 않으면 줄어듭니다.**
  뷰포트가 아니라 «칸이 놓인 상자의 폭» 으로 정해져 모달 · 좁은 카드 안에서도 맞습니다.
- 균등 폭에서 1px 를 뺀 것은 소수점 반올림으로 n 열이 «한 칸 모자라게» 접히는 것을 막는 여유입니다(폭 260~1024 를 소수점까지 재서 확인).
- **열 수가 뜻인 곳은 접지 않습니다.** 숫자판 · 의료기기 등급 · 예/아니오 · 진행 단계 · 7열 달력은 `repeat(n, minmax(0, 1fr))` 로 둡니다.
  `1fr` 만 쓰면(`minmax(auto, 1fr)`) 칸이 글자 최소 폭에 밀려 터집니다.
- 스스로 접는 길이 따로 있으면 날것 `1fr 1fr` 이 남아도 됩니다. 허용 목록(이유 + 근거 확인)이 `fold-grid.test.tsx` 에 있고, 목록 밖에 새로 생기면 시험이 빨강입니다.
- 이 부품이 `lib/design/components.tsx` 에 있어 정본 추출이 세 제품 사본으로 퍼뜨립니다.

---

## 3. 페이지 뼈대

### `PageHd` (페이지 머리)

```
┌ 32×1.5px 샴페인 막대            ← accent (기본 켜짐). 페이지마다 반복되는 서명
│ mono·10px·자간2.2 부제           ← 한글이면 자간 0
│ h1  clamp(22px, 5vw, 32px) · weight 700 · 자간 -0.02em · lineHeight 1.1
└ 1px 하단 경계선                  ← marginTop 18
marginBottom: 30
```

**`fontSize` 를 인라인으로 주지 않습니다.** 클래스의 `clamp` 가 담당합니다.
인라인이 클래스를 이겨 모바일에서 제목이 안 줄던 버그가 있었습니다.

### `SectionTitle`

```
mono · 10px · champagne · 자간 2.2 · weight 500 · marginBottom 14
```

전 페이지 섹션 헤더입니다. **한글 자간 사고가 가장 널리 퍼졌던 지점**이기도 합니다.

### 매거진 구분자 (CSS 전용)

```
.qa-mag-divider        display:flex · align-items:baseline · gap 16 · margin 32 0 18
  -num                 32px · weight 300 · champagne · 자간 -0.02em · tnum
  -label               mono · 10px · 자간 2.2 · uppercase · muted
  -title               18px · weight 500 · text
  -line                flex:1 · 1px · champagne 40% → transparent 그라디언트
```

---

## 4. 표시

### `Tag` (배지) · 97개 파일이 쓰는 최다 부품

| 크기 | minH | 글자 | padding | 점 | 실제 높이 | 지배 |
|---|---:|---:|---|---:|---:|---|
| `xs` | 18 | 10 | `0 6px` | 5 | 18 | minHeight |
| `sm` | 22 | 11 | `2px 8px` | 6 | 22 | minHeight |
| `md` | 26 | 11.5 | `4px 10px` | 7 | **26.1** | **lineHeight** |

```
fontFamily: mono  ·  lineHeight: 1.4  ·  letterSpacing: labelTracking(children, 1.0)
```

세 층위(`tier`)가 있습니다.

| tier | 배경 | 테두리 | 글자 |
|---|---|---|---|
| `primary` | 색 10% | 색 55% | 색 |
| `secondary` (기본) | 없음 | 색 33% | 색 |
| `tertiary` | 없음 | 색 18% | `muted` |

**같은 색으로 세 단계의 «소리 크기»를 만드는 구조**입니다.
한 행에 배지가 여럿일 때 핵심만 primary 로 두고 나머지를 낮춥니다.

`dot` 을 켜면 왼쪽에 원형 점이 붙습니다.

### `KPI` · `Stat`

```
KPI    padding 18px 20px · minHeight 124
       라벨  mono 10px · subtle · 자간 1.5
       값    weight 700 · clamp(20px, 칸 폭 12%, 36px) · lineHeight 1.05 · 자간 -0.02em
       보조  11px · muted · marginTop 10
Stat   라벨 10 · 값 14 weight 600
```

**숫자가 36px 에 자간 -0.02em 인 것**이 대시보드 인상을 만듭니다. 다만 칸이 좁으면 칸 폭의 12% 까지 줄어들고 20px 아래로는 안 내려갑니다(2026-09-15 · 긴 금액이 칸을 넘치던 것). 카드가 `container-type: inline-size` 라 그 폭을 잽니다.
크게 쓰고 조입니다.

### `Alert` · `InfoBox`

```
Alert    padding 12px 16px · 배경 색 8% · 테두리 색 30% · 12px · lineHeight 1.6
         제목 mono 10px · 색 · 자간 1.5 · marginBottom 4
         marginBottom 16  ← 계약이 이 기본 여백을 강제합니다
InfoBox  padding 12px 16px · 배경 색 6% · 12px · subtle
```

`Alert` 의 `marginBottom` 이 계약으로 잠겨 있는 이유는, 없으면 다음 요소가 테두리에 달라붙기 때문입니다.

### `EmptyState`

```
padding: 96px 24px   (compact 는 32px 24px)
배경: 상단에서 퍼지는 champagne 4% 방사 그라디언트
아이콘/글리프: 56px · champagne 45% · weight 300
제목: serif · weight 700 · 22px · subtle · 자간 -0.01em
설명: 13px · muted · lineHeight 1.7 · maxWidth 460 · 가운데
힌트 칩: padding 6px 12px · 테두리 champagne 40% · 10px
```

**빈 화면에 96px 여백을 주는 것**이 이 시스템의 성격을 잘 보여줍니다.
비었을 때 초라해 보이지 않고 «의도된 여백» 으로 읽힙니다.

### `Skeleton` (CSS 전용)

```css
.qa-skeleton {
  background: color-mix(in srgb, var(--qa-champagne) 4%, var(--qa-surface));
  border: 1px solid color-mix(in srgb, var(--qa-champagne) 8%, var(--qa-border));
}
.qa-skeleton::after {   /* 금빛 띠가 1.4초마다 통과 */
  background: linear-gradient(90deg, transparent,
              color-mix(in srgb, var(--qa-champagne) 18%, transparent) 50%, transparent);
  animation: qa-shimmer 1.4s ease-in-out infinite;
}
```

### `ProgressBar` · `ProgressRing`

```
Bar   height 6 (기본) · radius height/2 · 트랙은 border 색 알파
      색 미지정이면 100% 는 green, 그 외 champagne
      전환 .35s
Ring  size 56 · SVG · -90deg 회전 · 트랙 border 색
```

### `Spinner`

```
1.5px 테두리 · borderTopColor champagne · 원형 · qa-spin 0.8s linear infinite
```

이 시스템에서 **회전이 허용되는 유일한 자리**입니다.

---

## 5. 목록·표

### `DataTable`

```
헤더  padding (padY+1)px 12px · mono 10px · weight 500 · 하단 1px 경계
셀    padding 20px 12px · 12px
컬럼  minmax(0, ...) 로 grid template 구성
```

### `EntityRow`

```
padding 16px 18px · minHeight 72 · gap 14
background surface · border 1px · border-left 2px 액센트 · radius 10
전환 background 200ms
```

**왼쪽 2px 색 띠**로 상태를 표시합니다. 배지보다 조용하고 스캔이 빠릅니다.

---

## 6. 오버레이

### `Modal`

```
백드롭  var(--qa-backdrop-strong) · padding 20 · z-index 1000
본체    background bg · border 1px borderHi · radius 10 · shadow var(--qa-shadow-xl)
        maxWidth 560 (기본)
헤더    padding 18px 20px · 제목 17px weight 600 lineHeight 1.3
                          · 부제 13px subtle lineHeight 1.5
본문    padding 20 · overflowY auto
바닥    padding 14px 20px · gap 10
```

**본체 배경이 `surface` 가 아니라 `bg`(가장 어두운 색)** 입니다.
카드보다 더 «깊은» 층으로 읽히게 하는 선택입니다.

포커스 트랩이 들어 있습니다 (Tab 순환 · Esc 닫기 · 열릴 때 첫 요소로 포커스).

### `Drawer`

```
백드롭 동일 · 본체 background bg · boxShadow SHADOW.anchor
헤더/바닥 padding 14px 18px · 아이콘 champagne
제목 serif 14 weight 600 · 부제 mono 10 muted
```

### `Tip` (툴팁)

```
@keyframes qa-tip-rise: 2px 떠오르며 페이드
translateX 는 CSS 변수 --qa-tip-tx 로 넘겨 중앙 정렬을 유지합니다
```

---

## 7. 셸

### `Sidebar`

```
데스크톱  240px (접으면 60px)   전환 220ms ease-out-expo
드로어    264px                 <1024px 에서 자동
background surface · border-right 1px · padding 22px 16px (접히면 18px 6px)

nav 항목   padding 11px 14px · 아이콘 자리 24px
활성       배경 champagne 10% · 왼쪽 점이 1회 펄스(600ms)
```

접기 상태는 계정별 키로 `localStorage` 에 저장됩니다.
모바일에서는 좌측 스와이프(임계 60px)로 닫힙니다.

### `TopProgressBar`

```css
.qa-top-progress {
  position: fixed; top: 0; height: 2px; z-index: 9999;
  background: linear-gradient(90deg, transparent,
    var(--qa-champagne) 30%,
    color-mix(in srgb, var(--qa-champagne) 80%, white) 60%,
    var(--qa-champagne));
  box-shadow: 0 0 12px color-mix(in srgb, var(--qa-champagne) 70%, transparent);
}
```

라우트 전환 때 나타나는 **2px 금색 실선**입니다. 가운데가 밝고 빛 번짐이 있습니다.

움직임은 `source/components/TopProgressBar.tsx` 가 정합니다(sync 로 두 제품이 받습니다).
**누르는 순간 시작해 90% 에서 멈추고, 화면이 실제로 바뀔 때만 100% 로 채우고 걷습니다.**

- 종전에는 `usePathname` 이 바뀔 때 시작했습니다. App Router 에서 그 값은 새 트리가
  커밋된 «뒤» 에 바뀌므로, 막대가 도착한 다음에 처음 움직였습니다(감사 주제 #8).
- 90% 에서 멈추는 이유: 남은 시간을 모르면서 100% 를 그리면 다 됐다고 말하는 것이 되고,
  그 뒤로도 화면이 안 바뀌면 그 표시를 다시는 안 믿습니다.
- 15초 안에 도착하지 않으면 스스로 걷습니다(취소·서버 오류).
- `prefers-reduced-motion: reduce` 면 **아무것도 그리지 않습니다**(시작도 끝맺음도).
- 링크가 아닌 이동은 `startRouteProgress()` 를 부릅니다. 클릭 감시는 `a` 태그만 봅니다.
- `className` 만 받습니다. 위 CSS 처럼 겉모습은 제품이 정합니다.

### `RibbonBackground`

샴페인 SVG 리본 두 겹이 32초 / 38초 주기로 흐릅니다.
viewBox 2400×1200 에 좌표가 화면 밖까지 나가 있어 초광폭 모니터에서도 잘리지 않습니다.

```
intensity="full"     opacity 0.14 / 0.08   로그인
intensity="ambient"  opacity 0.07 / 0.04   앱 내부
pointer-events: none · position: fixed · z-index 0
```

인쇄에서는 사라집니다.

---

## 8. 접근성 부품

### `SegmentedChoice`

라디오 그룹의 모범 사례가 그대로 들어 있습니다. 계약이 전부 검사합니다.

- `role="radiogroup"` 안에 `role="radio"`, 선택된 것만 `aria-checked="true"`
- **roving tabindex**: 선택된 항목만 `0`, 나머지는 `-1`
- 선택이 없으면 첫 «활성» 항목이 `0` (비활성은 Tab 순서에서 빠짐)
- 화살표 이동은 비활성을 건너뛰고 끝에서 감깁니다
- Home/End 는 범위 밖 인덱스로 호출해 첫/마지막 활성으로 갑니다
- 전부 비활성이면 `null` (무한 루프 없이)

### 건너뛰기 링크

```css
.qa-skip-link { position: absolute; left: -9999px; }
.qa-skip-link:focus {
  position: fixed; left: 16px; top: 16px;
  padding: 10px 18px; background: var(--qa-champagne); color: var(--qa-bg);
}
```

WCAG 2.4.1 (Bypass Blocks). 평소엔 화면 밖, Tab 하면 나타납니다.

---

## 9. 옮겨 쓸 때

이 컴포넌트들을 그대로 가져가려면 React 19 + Next.js 가 필요합니다.
**그럴 필요는 없습니다.** 위 표의 수치만 있으면 어떤 프레임워크에서도 같은 인상이 나옵니다.

우선순위를 매기면 이 셋이 인상의 8할입니다.

1. **`Bx` + `qa-card-lift`** (카드와 금테 호버)
2. **`Tag` 3층위** (같은 색으로 소리 크기 조절)
3. **`PageHd`** (금색 막대 + mono 부제 + 큰 제목 + 하단선)
