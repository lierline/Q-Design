# 업무 아이콘

2026-10-03. Q-Design 업무용 아이콘은 Phosphor Icons의 Regular 스타일로 정한다.
[아이콘 견본](../preview/icons.html)에서 선정한 30종과 쓰임을 확인할 수 있다.

## 선택 이유

[Phosphor 공식 저장소](https://github.com/phosphor-icons/core)와
[Lucide 공식 저장소](https://github.com/lucide-icons/lucide)를 비교했다.
이번에는 문서·검토·생산·재고를 같은 스타일로 표현하는 Phosphor Regular를 선택했다.
라이브러리 자체가 AI 느낌을 없애는 것은 아니다. 과한 장식, 의미 없는 기호, 기기마다 다른
컬러 이모지를 줄이고 업무 이름 옆에 필요한 표시만 두는 것이 적용 기준이다.

공식 저장소의 MIT 라이선스와 원본 SVG를 함께 보관한다. 가져온 커밋은
`2b75f3ad12b420c9504ef05df8d2564a28f8500e`다. 실행 시 외부 CDN이나 아이콘 폰트를 부르지 않는다.

## 화면 규칙

- 기본은 20px, 큰 표시는 24px. 16px는 글자가 함께 있는 좁은 조작부에서만 쓴다.
- Regular 한 굵기를 유지한다. Fill·Duotone·색 이모지를 한 조작부에 섞지 않는다.
- 색은 `currentColor`로 주변 글자색을 따른다. 상태 색은 기존 의미 색을 쓰고 상태 글자를 함께 둔다.
- 문서 목록은 files, 검토는 clipboard-text, 생산은 factory, 분석은 chart-line으로 뜻을 구분한다.
- AI 기능이라는 이유로 반짝임·로봇·마술봉을 반복하지 않는다. 분석·검토·작성 등 실제 하는 일로 고른다.
- 내부 이동에는 next, 새 창·외부 링크 표시에만 external을 쓴다.
- 아이콘이 글자와 함께 있으면 `aria-hidden="true"`. 아이콘만 있는 버튼에는 `aria-label`을 준다.
- 버튼 클릭 영역은 최소 44px를 유지한다. 아이콘 자체의 20px 크기와 구분한다.
- 공식 Q 마크, PWA 아이콘, 회사 CI는 기존 브랜드 자산을 쓴다.

## 사용

`dist/q-design.icons.css`와 `dist/icons/`를 같은 상대 경로로 함께 배포한다.
CSS mask로 원본 SVG의 형태를 표시하므로 밝은 테마와 어두운 테마에서 같은 파일을 쓴다.
CSS의 mask가 표시되지 않는 환경에서도 행동을 이해할 수 있도록 글자 이름을 유지한다.

```html
<link rel="stylesheet" href="/design/q-design.icons.css">
<button type="button" class="qd-icon-label">
  <span class="qd-icon" data-icon="download" aria-hidden="true"></span>
  내려받기
</button>
<button type="button" aria-label="닫기">
  <span class="qd-icon" data-icon="close" aria-hidden="true"></span>
</button>
```

React에서도 같은 클래스와 `data-icon`을 사용한다. 두 번째 버튼의 이름을 `title`만으로
대체하지 않는다. CSS mask가 사용하는 SVG는 `img-src`에서 같은 출처를 허용해야 한다.

## 원본과 빌드

- `patterns/icons.json`: 의미 이름, 원본 파일, 한글 이름, 고정 커밋.
- `vendor/phosphor/`: 공식 SVG 원본과 LICENSE. 제품에서 가져오는 `source/` 사본과 분리한다.
- `tools/fetch-icons.py`: 고정 커밋의 선정 파일만 다시 받는다. 업데이트할 때만 네트워크가 필요하다.
- `tools/build-icons.mjs`: 로컬 원본에서 CSS, SVG, SHA-256 목록, 라이선스를 만든다.
- `node tools/build-icons.mjs --check`: 생성물이 원본과 일치하는지 검사한다.

Q-Design의 부품 견본, 업무 화면 견본, 새 아이콘 견본에 적용했다. 부품 견본의 직접 그린
검색 SVG와 빈 목록의 기하 문자를 교체하고, 업무 화면의 메뉴·이동·닫기를 같은 아이콘으로 맞췄다.
운영 제품으로의 동기화와 배포는 이번 변경에 포함하지 않는다.
