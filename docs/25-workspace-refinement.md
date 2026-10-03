# 업무 화면 정돈

2026-10-03. Q-Design 공통 규칙에 **업무 현황과 문서 목록의 조합 규칙**을 추가했다.
기존 먹색·오프화이트 바탕, Pretendard, 10px 조작부, 괘선 중심의 문서 결을 유지한다.

## 먼저 볼 화면

[업무 화면 견본](../preview/workspace.html)에서 세 제품과 밝은 화면을 바꿔 볼 수 있다.
검토할 문서 보기, 검색, 상태 필터, 정렬, 검색 초기화, 문서 상세와 Escape 닫기가 동작한다.
모든 데이터는 명시적으로 표시한 견본이다. 서버·인증·저장 API는 연결하지 않았다.

## 달라진 규칙

| 자리 | 적용한 규칙 | 목적 |
|---|---|---|
| 화면 머리 | 제목, 한 문장의 설명, 주요 행동 하나 | 첫 행동을 빨리 찾게 한다 |
| 요약 지표 | 세 칸의 요약표와 그 아래 검토 대기 목록 | 통계 다음에 바로 업무를 이어간다 |
| 문서 목록 | 제목 15px, 메타데이터 13px, 번호 12px | 이름과 부가 정보를 구분한다 |
| 조작부 | 버튼 14px, 높이 최소 44px, 보조 행동도 선명한 글자색 | 링크처럼 흐린 주요 조작을 줄인다 |
| 검색 | 이름표, 검색어, 상태, 정렬을 한 묶음으로 | 무엇을 거르고 있는지 보이게 한다 |
| 모바일 | 행의 행동을 다음 줄로, 입력 글자 16px, 좁은 칸은 두 줄 배치 | 제목과 버튼이 서로 밀리지 않게 한다 |
| 상태 | 제품과 무관한 의미 색상과 상태 글자 | 제품 색을 상태의 의미와 혼동하지 않는다 |
| 안내 | 같은 설명을 반복하지 않고 관련 업무 옆에 한 번 | 본문보다 안내가 커지는 것을 막는다 |

12px는 번호·시간 같은 짧은 메타데이터에만 쓴다. 보조 설명은 13px 이상이며 긴 한글 문장에
고정폭 글꼴이나 넓은 자간을 쓰지 않는다. 모바일 요약표에서는 긴 부제를 생략해도
라벨·값·단위가 남는다. 상태 색상은 기존 토큰을 따른다.

## 제품 식별 색

전체 배경, 주 버튼, 오류·완료 색은 공통이다. 제품명과 메뉴의 작은 식별 표시에만 금속색을 쓴다.
PWA 색은 그대로 보존하고, 밝은 바탕 위 작은 글자에는 읽을 수 있게 조정한 색을 쓴다.

| 제품 | 어두운 화면 | 밝은 화면의 식별 글자 |
|---|---|---|
| Q-Atelier | `#b9b9b9` | `#595959` |
| Q-Maison | `#c9a66b` | `#84632f` |
| Q-Carnet | `#c7784f` | `#97522f` |

아이콘은 기존 `dist/app-icons/`의 실제 자산을 사용한다. 금속색을 경고·성공에 덮어쓰지 않는다.

## 적용 방법

기존 `q-design.screen.css`를 다시 생성하면 조합 규칙이 함께 들어간다.
화면 바깥에 `.qd-workspace`를 붙인 경우에만 새 규칙이 적용된다.

```html
<main class="qd-workspace" data-product="atelier">
  <header class="qd-work-head">
    <div>
      <h1 class="qd-work-title">문서 목록</h1>
      <p class="qd-work-intro">검토가 필요한 문서를 확인합니다.</p>
    </div>
    <a class="qd-btn qd-btn--primary" href="/my-tasks">검토할 문서 보기</a>
  </header>
</main>
```

`data-product`는 `atelier`, `maison`, `carnet` 중 하나다. 테마는 기존처럼
`html[data-theme="light"]`로 선택한다. 앱이 다른 테마 속성을 쓰면 기존 어댑터에서 연결해야 한다.
전체 마크업은 `preview/workspace.html`, 공통 스타일 원본은 `patterns/workspace.css`에 있다.
견본의 상단 제품 선택기·예시 안내·사이드바 배치는 `workspace-preview.css`에만 있다.
운영 앱의 인증·메뉴 권한·문서 상태·저장 기능은 기존 구현을 연결한다.

## 원본과 생성물

- `source/`: 다른 저장소의 커밋된 원본을 가져오는 기존 사본. 이번에 직접 수정하지 않았다.
- `patterns/workspace.css`: Q-Design이 직접 소유하는 화면 조합 규칙. 원본 새로고침 대상 밖에 있다.
- `tools/extract-screen.mjs`: 기존 부품에서 추출한 CSS 뒤에 조합 규칙을 붙인다.
- `dist/q-design.screen.css`: 생성물. 직접 고치지 않는다.

```powershell
node tools/extract-screen.mjs
node tools/check-chars.mjs
python -m http.server 3421 --bind 127.0.0.1 --directory D:/Claude/Q-Design
```

브라우저에서 `http://127.0.0.1:3421/preview/workspace.html`을 연다.
`?product=carnet&theme=light#documents`로 제품·테마·화면을 지정할 수 있다.

2026-10-03 운영 적용 요청에 따라 세 제품의 업무 현황과 Q-Atelier 기본 문서 화면에 연결했다.
기존 화면 정본 전체를 덮지 않고 `patterns/workspace.css`만 `q-design.workspace.css`로 내보낸다.
이 사본은 각 제품의 기존 해시 검사에 등록되어 있다. Q-Maison과 Q-Carnet의 기존 조각 동결은
유지하고, 이번에 승인된 업무 화면 조각만 예외로 내보낸다. Q-Sonar에는 내보내지 않는다.

```powershell
node tools/sync.mjs --write --part="업무 화면" --only=Q-Atelier,Q-Works,Q-Forge
```

운영 현황은 `.qd-workspace--overview`를 함께 쓴다. 기존 지표 수, 링크, 0과 조회 실패의
구분을 유지하며 라벨·부제는 13px로 맞춘다. Q-Atelier의 기존 인라인 지표 스타일을 위한
좁은 선택자에만 `!important`를 사용한다. 기존 지표의 의미 색과 숫자 크기 계산은 보존한다.
카르넷의 현장 작업 화면은 이 적용 범위 밖이다. 메종의 `.dark` 테마도 지원한다.

복구 기준과 배포 결과는 `D:/Claude/reviews/q-design-rollout-2026-10-03/`에 기록한다.
세 제품과 Q-Design의 작업 전 커밋에는 `rollback/q-design-2026-10-03` 태그를 남겼다.

## 확인한 범위

- 업무 현황: 세 제품 × 두 테마 × 390px·1280px 창 크기, 12개 조합에서 가로 넘침 없음.
  스크롤바를 제외한 실제 내용 폭은 각각 375px·1265px였다.
- 주요 버튼 높이 44px 이상. 제품 식별 글자와 배경의 최소 대비 5.24:1.
- 문서 목록: 검색 결과 없음, 조건 초기화, 검토 대기 필터, 이름순 정렬을 확인했다.
- 상세 보기: 닫기 버튼으로 초점 이동, Escape 닫기, 원래 버튼으로 초점 복귀를 확인했다.
- 본문 건너뛰기: 문서 목록을 유지한 채 본문으로 이동한다.
- 기존 부품 견본: 모바일 입력 두 칸을 한 열로 바꾸고 가로 넘침이 없음을 확인했다.
- 생성물 재생성 결과 동일. 기존 화면 CSS 본문은 보존하고 새 규칙만 뒤에 추가했다.

검증 결과: [verification.json](../preview/screens/workspace/verification.json).
화면: [어두운 업무 현황](../preview/screens/workspace/atelier-dark.png),
[밝은 문서 목록](../preview/screens/workspace/maison-light.png),
[모바일 목록](../preview/screens/workspace/maison-mobile.png).
이는 견본과 CSS에 대한 확인이며 운영 세 제품의 회귀 검증을 대신하지 않는다.
