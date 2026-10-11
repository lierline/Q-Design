/**
 * 인쇄 전용 스타일: 인쇄 페이지들이 공유한다.
 *
 * 왜 한 파일인가: 지금까지 세 인쇄 페이지가 같은 @media print 블록을 복붙해 왔고
 * 이미 서로 어긋났다(다크모드 방어가 documents 에만, 그것도 절반만 있었다).
 * 지면 규격은 한 곳이 소유해야 한 번 고치면 세 곳이 같이 낫는다.
 *
 * 왜 색 변수를 .print-paper 스코프에서 재정의하는가: 테마 기본값이 `system`
 * 이라 사용자가 토글을 만진 적 없어도 OS 다크 설정이면 다크로 인쇄된다.
 * 브라우저는 배경을 안 찍고 전경색만 찍으므로 «백지에 크림색 글씨» = 빈 종이가
 * 나온다. 색이 전부 hsl(var(--x)) 배선이므로 변수만 덮으면 !important 없이
 * 지면 전체가 흰 종이·검은 글씨로 고정된다. 화면 미리보기도 같이 흑백이 되는데,
 * 그게 오히려 맞다. 미리보기는 출력물과 같아야 한다.
 *
 * pageBreak=false 는 지면이 1장뿐인 인쇄(문서 본문 인쇄)용: 마지막 장 뒤에
 * 빈 장이 붙는 것을 막는다.
 *
 * ── 스코프 규칙 (구현자는 절대 풀지 마라) ──────────────────────────────
 * documents/[id]/print 는 TipTap 본문(.prose)을 이 지면 안에 렌더한다.
 * 그래서 «서식»을 위한 새 규칙은 전부 .form-table / h2.sec-head 로 잠근다.
 *   · 전역 .print-paper table{table-layout:fixed} 를 쓰면 절차서 본문 표의
 *     열 폭이 내용과 무관해져 조용히 망가진다.
 *   · 전역 .print-paper h2{border-top:0.5mm} 를 쓰면 절차서 본문의 모든
 *     소제목 위에 굵은 실선이 그어진다.
 */
export function PrintStyles({
  pageBreak = true,
  orientation = "portrait",
}: {
  pageBreak?: boolean;
  /**
   * 가로(landscape)는 열이 많은 «대장» 인쇄용이다. 세로 180mm 에 9열을 넣으면
   * 주소·사유가 5줄씩 접혀 행 대응이 무너진다. 가로는 267mm 라 그 폭이 산다.
   */
  orientation?: "portrait" | "landscape";
}) {
  const landscape = orientation === "landscape";
  return (
    <style>{`
/* ══════════════════════════════════════════════════════════════════
   지면 규격: 화면·인쇄 공통. 미리보기가 곧 출력물이 되게 한다.
   A4 210mm, 좌우 여백 15mm → 본문 폭 정확히 180mm.
   ══════════════════════════════════════════════════════════════════ */
.print-paper{
  width:${landscape ? "297mm" : "210mm"};
  max-width:100%;
  padding:15mm 15mm 18mm;
  box-sizing:border-box;
  margin-inline:auto;

  /* 다크 모드 무력화: 지면은 언제나 흰 종이·검은 글씨 */
  --background:0 0% 100%;
  --foreground:0 0% 0%;
  --card:0 0% 100%;
  --card-foreground:0 0% 0%;
  --popover:0 0% 100%;
  --popover-foreground:0 0% 0%;
  --muted:0 0% 96%;
  /* 28% → 20%. 라벨·근거 캡션이 이 색인데, 9.5pt 한글이 28% 회색이면
     흑백 레이저에서 하프톤 점으로 찍혀 획이 무너진다. */
  --muted-foreground:0 0% 20%;
  --primary:0 0% 0%;
  --primary-foreground:0 0% 100%;
  --secondary:0 0% 96%;
  --secondary-foreground:0 0% 0%;
  --accent:0 0% 96%;
  --accent-foreground:0 0% 0%;
  --border:0 0% 20%;
  --input:0 0% 20%;
  --ring:0 0% 20%;
  --destructive:0 0% 0%;
  --destructive-foreground:0 0% 100%;

  background:#fff;
  color:#000;
  font-size:10.5pt;
  line-height:1.45;

  /* ── 서체를 «지면 안에서» 명시적으로 고정한다 ──────────────────────────
     이 앱의 폰트는 웹폰트가 아니라 «설치돼 있으면 쓰는» 스택이다. 화면에서는
     그래도 되지만 인쇄물은 관리 문서라, 같은 기록을 다른 PC 에서 뽑았을 때
     서체가 달라지면 안 된다. 그래서 마지막에 실제로 존재가 보장되는 활자
     (Malgun Gothic / Apple SD Gothic Neo)를 못 박아 최악의 경우에도
     «본문용 고딕»으로 수렴시킨다. 여기서 generic sans-serif 로 끝내면
     OS 기본값이 무엇이냐에 따라 결과가 갈린다. */
  font-family:"Pretendard Variable", Pretendard,
              "Malgun Gothic", "맑은 고딕",
              "Apple SD Gothic Neo", "Noto Sans KR",
              system-ui, sans-serif;
}

/* 화면 미리보기는 A4 폭을 유지한다. 좁은 화면에 표를 눌러 넣으면 결재
   날짜와 서명 열이 넘치고 실제 인쇄와 줄바꿈도 달라진다. 스크롤은 문서
   영역 안에서만 발생하며 종이의 폭·여백·쪽 나눔 규칙은 아래에서 유지한다. */
@media screen{
  .print-area{ min-width:0; max-width:100%; overflow-x:auto; }
  .print-paper{ max-width:none; }
}

/* ── 지면은 한 서체로 간다 ───────────────────────────────────────────────
   화면에서는 기록번호·Lot 을 등폭(font-mono)으로 눌러 «식별자»임을 드러냈다.
   그런데 종이에서는 두 가지가 어긋난다.
   ① 미학이 아니라 사실의 문제: JetBrains Mono 는 웹폰트로 싣지 않아서
      설치된 PC 에서만 그 서체로 나온다. 없으면 ui-monospace → SFMono →
      generic monospace 로 흘러 PC 마다 다른 활자가 찍힌다. 본문은 고딕인데
      식별자만 Courier 계열로 나오는 «통일 안 된» 인쇄물이 여기서 나온다.
   ② 한 장짜리 서식에 두 서체가 섞이면 양식으로서 읽기 나쁘다.
   식별자의 가독성(0/O·1/l 구분, 열 정렬)은 서체를 바꾸지 않고 자릿수 고정
   숫자와 자간으로 확보한다. 그게 인쇄 서식의 정석이다. */
.print-paper .font-mono{
  font-family:inherit;
  font-variant-numeric:tabular-nums;
  letter-spacing:0.02em;
}

/* globals.css 의 .dark .text-brand-* 오버라이드는 !important 라 변수 재정의를
   우회한다. 인쇄 지면이 쓰는 브랜드 색만 명시적으로 눌러 준다. */
.print-paper .text-brand-copperDark,
.print-paper .text-brand-forestDark,
.print-paper .text-brand-forest,
.print-paper .text-brand-forestLight{ color:#000 !important; }

/* ── 활자: 9.5pt 가 한글 표의 하한이다. 이 값은 «지킨다».
   지면을 1장에 넣는 일은 활자를 줄여서가 아니라 중복·포장을 걷어서 한다. ── */
.print-paper .text-xs   { font-size:9.5pt;  line-height:1.35; }
.print-paper .text-sm   { font-size:10.5pt; line-height:1.45; }
.print-paper .text-base { font-size:11.5pt; }
.print-paper .text-lg   { font-size:13pt; }
.print-paper .text-xl   { font-size:15pt; }
/* 지면 제목: **국문 12.5pt** (오빠 지시 2026-09-10, 전 인쇄 서류 공통).
   서식형 지면(form-grid 의 제목 칸)과 같은 크기여야 한 철에 섞여 꽂혀도
   같은 규격의 종이로 읽힌다. 낱말은 한가운데서 자르지 않는다. */
.print-paper h1{ font-size:12.5pt; line-height:1.25; word-break:keep-all; }
/* 지면 전체도 한글은 낱말 단위로만 꺾는다. 결재란의 「홍길동 공장 / 장」,
   범례의 「고 / 위험」 처럼 낱말 가운데서 끊기던 것 (화면 검토 M70) */
.print-paper{ word-break:keep-all; overflow-wrap:break-word; }
/* 제목 옆 영문 병기: 국문보다 3pt 작게(9.5pt) */
.print-paper h1 .title-en{ font-size:9.5pt; font-weight:400; }

/* ══════════════════════════════════════════════════════════════════
   여백 리듬: «덩어리»를 만든다. 덩어리 안은 2mm, 덩어리 끝은 4mm.
   왜 rem/Tailwind(mb-5) 가 아니라 mm 인가: mb-5 는 globals.css 의
   루트 글자에 매달려 있어, 루트 폰트를 누가 건드리면 A4 지면 높이가
   조용히 움직인다. 종이는 물리 단위로 못 박아야 한다.
   (2026-09-24 화면 루트를 16px 로 올리면서 인쇄만 15px 에 남겼다. globals.css)
   ══════════════════════════════════════════════════════════════════ */
.print-paper .gap-in { margin-bottom:2mm; }   /* 덩어리 «안» */
.print-paper .gap-out{ margin-bottom:4mm; }   /* 덩어리 «끝» */

/* ══════════════════════════════════════════════════════════════════
   섹션 표제: h2.sec-head 로 «잠근다».
   ① 특정도: 지금까지 모든 h2 가 text-sm 을 달고 있어 .print-paper .text-sm
      (0,2,0) 이 .print-paper h2 (0,1,1) 을 이겨 11pt 규칙이 죽어 있었다.
      h2.sec-head 는 (0,2,1) 이라 확실히 이긴다. JSX 에서 text-sm 도 뗀다.
   ② 스코프: 전역 h2 규칙을 쓰면 절차서 본문 소제목마다 굵은 실선이 그어진다.
   왜 밑줄이 아니라 «상단» 실선인가: 앞 블록과 끊고 아래 내용과 묶는 방향이
   h2{break-after:avoid} 와 같다. 그리고 표 괘선(0.25mm)과 굵기가 겹치던
   문제가 0.5mm 로 벌어지며 해소된다.
   ══════════════════════════════════════════════════════════════════ */
.print-paper h2.sec-head{
  display:flex;
  align-items:baseline;
  justify-content:space-between;
  gap:4mm;
  font-size:11.5pt;
  line-height:1.25;
  font-weight:700;
  letter-spacing:0.01em;
  border-top:0.5mm solid #000;
  border-bottom:0;
  padding-top:1.2mm;
  margin-bottom:1.5mm;
}
/* 근거 조항: h2 행 «안»에 얹는다. 9.5pt×1.35=12.83pt 라
   11.5pt×1.25=14.38pt 행 상자에 들어가므로 높이 비용이 0 이다. */
.print-paper h2.sec-head .sec-clause{
  flex:0 0 auto;
  font-size:9.5pt;
  font-weight:400;
  color:hsl(var(--muted-foreground));
  white-space:nowrap;
}

/* 지면 머리: 이 종이에서 가장 굵은 선 */
.print-paper .sheet-head{
  border-bottom:0.7mm solid #000;
  padding-bottom:2mm;
}
/* 기록번호·Lot: 서식의 존재 이유가 «식별»이다. 여기에 지면을 쓴다. */
.print-paper .id-val{
  font-size:13pt;
  font-weight:700;
  font-variant-numeric:tabular-nums;
  letter-spacing:0.02em;
}

/* ══════════════════════════════════════════════════════════════════
   표: 수량 값과 다음 열이 붙어 보이던 결함을 여기서 끝낸다.
   원인: border-collapse:collapse 라 border-spacing 이 무효인데 th/td 에
   가로 패딩이 없어 셀 사이 여백이 UA 기본 1px+1px 뿐이었다. 우측정렬 열
   바로 뒤에 좌측정렬 열이 오면 열 폭과 무관하게 항상 맞닿는다.

   세로 padding 1.6mm 는 손대지 않는다: 현장에서 펜으로 체크·정정이 들어가는
   종이라 행 높이 7.97mm 를 지킨다(6.5mm 가 실무 하한).
   ══════════════════════════════════════════════════════════════════ */
.print-paper table{ width:100%; border-collapse:collapse; }
.print-paper th,
.print-paper td{
  padding:1.6mm 2.5mm;
  border-bottom:0.25mm solid #333;
  vertical-align:top;
  text-align:left;
}
.print-paper thead th{ border-bottom:0.5mm solid #000; font-weight:600; }
.print-paper th:first-child,
.print-paper td:first-child{ padding-left:0; }
.print-paper th:last-child,
.print-paper td:last-child{ padding-right:0; }

/* 열 위치를 장마다 고정한다. 서식은 1장차와 4장차의 «수량» 열이 같은 자리에
   있어야 대조가 된다. colgroup 은 각 표가 준다.
   ★ .form-table 로 잠근 이유는 파일 머리 주석 참조 (절차서 본문 표 보호) */
.print-paper .form-table{ table-layout:fixed; }

/* 표가 «닫히지» 않아 마지막 행 밑줄이 다음 섹션의 시작선처럼 보이던 문제 */
.print-paper .form-table tbody tr:last-child > td{
  border-bottom:0.45mm solid #000;
}

/* ══════════════════════════════════════════════════════════════════
   .form-grid: 사방이 닫힌 «격자» 표.
   ══════════════════════════════════════════════════════════════════
   .form-table 은 가로 괘선만 긋는다. 여러 건을 세로로 훑는 «대장»에는 그게
   맞다. 세로선이 많으면 행을 따라가는 눈이 자꾸 걸린다.

   그런데 결재란이 붙는 «서식 한 장»(고객 불만 발생 보고서 등)은 원본 .docx 가
   사방이 닫힌 격자다. 한 행에 라벨-값이 두세 쌍씩 들어가는 표라, 세로선이
   없으면 「구매처」의 값이 오른쪽 「구매 일자」의 값인지 종이에서 갈리지 않는다.
   그래서 격자용 클래스를 따로 둔다. .form-table 규칙은 손대지 않는다.

   th 배경(#f2f2f2)에 print-color-adjust:exact 를 주는 이유: 라벨 칸의 음영은
   장식이 아니라 «여기는 서식이 인쇄해 둔 글자, 저기는 채워 넣은 값» 을 가르는
   신호다. 브라우저 기본값(economy)은 배경을 안 찍어 그 구분이 사라진다.
   ══════════════════════════════════════════════════════════════════ */
.print-paper .form-grid{
  table-layout:fixed;
  border:0.4mm solid #000;
}
.print-paper .form-grid th,
.print-paper .form-grid td{
  border:0.2mm solid #000;
  padding:1.4mm 2mm;
  vertical-align:middle;
  text-align:left;
}
/* 전역 «첫/마지막 열은 안쪽 여백 0» 규칙은 격자에서 글자를 선에 붙인다 */
.print-paper .form-grid th:first-child,
.print-paper .form-grid td:first-child{ padding-left:2mm; }
.print-paper .form-grid th:last-child,
.print-paper .form-grid td:last-child{ padding-right:2mm; }
/* 격자의 칸 배치(여백 · 폭)는 그대로 두고 선만 지운다: 공문의 본문처럼 «상자 없이»
   읽혀야 하는 자리 (회수 시행 공고 본문 · 오빠 지시 2026-09-30 「본문영역 테이블
   테두리 색상 투명으로 변경」). 선을 없애지 않고 투명으로 두는 이유: 두께가 남아
   있어야 앞뒤 표와 글줄 위치가 한 치도 움직이지 않는다. */
.print-paper .form-grid.clear-lines,
.print-paper .form-grid.clear-lines th,
.print-paper .form-grid.clear-lines td{ border-color:transparent; }

.print-paper .form-grid th{
  background:#f2f2f2;
  font-weight:700;
  text-align:center;
  -webkit-print-color-adjust:exact;
  print-color-adjust:exact;
}
/* 값 칸인데 «서식이 인쇄해 둔 글자»인 자리: 제목 칸처럼.
   th 는 아니지만(라벨이 아니라 제목이다) 같은 음영을 써야 «채워 넣은 값이 아님»
   이 한 가지 신호로 읽힌다. 배경을 실제로 찍으려면 print-color-adjust 가 필요하다. */
.print-paper .form-grid td.shaded{
  background:#f2f2f2;
  -webkit-print-color-adjust:exact;
  print-color-adjust:exact;
}
/* 선택지(☑/☐) 칸: **한 줄에 둘씩** (오빠 지시 2026-09-10).
   넷을 한 줄에 밀어 넣으면 칸 너비에 따라 「정기 특별 수시 / 재평가」처럼 3+1 로
   접혀 마지막 하나가 떠 보인다. 2열 격자로 못 박으면 넷이든 셋이든 모양이 같다.

   🔴 격자는 **칸 안쪽 상자**가 진다. td 자신을 display:grid 로 만들면 그 칸이
   표의 테두리 합치기(border-collapse)에서 빠져 혼자 두 겹으로 굵게 그려진다
   (오빠 지적 2026-09-10 「평가 유형의 표 테두리가 다른 것에 비해 굵습니다」). */
.print-paper .form-grid td.choices{ text-align:left; }
.print-paper .form-grid td.choices .choice-grid{
  display:grid;
  grid-template-columns:repeat(2, 1fr);
  gap:0.5mm 2mm;
  justify-items:start;
  align-content:center;
}
/* 한 줄 전체를 쓰는 선택지 칸(wide)은 «가운데로 모은다» (오빠 지시 2026-09-17
   「평가 유형 표 병합하고 가운데 정렬합니다」). 칸이 넓어진 만큼 왼쪽 끝에
   붙어 있으면 오른쪽이 통째로 비어 보인다. 격자 자체를 가운데 두고, 글자는
   서로 왼쪽을 맞춘 채로 둔다(☑ 자리가 들쭉날쭉하면 더 읽기 어렵다) */
.print-paper .form-grid td.choices.wide .choice-grid{
  justify-content:center;
  grid-template-columns:repeat(2, max-content);
  column-gap:10mm;
}
/* 격자가 아니라 «글자로 늘어선» 선택지 줄을 가운데로 (오빠 지시 2026-09-22: 
   회의록 안건의 부서 체크줄). wide 는 격자(.choice-grid)를 미는 규칙이라 격자가
   없는 줄에는 듣지 않는다. 이 줄은 칸 자신의 정렬로 민다. */
.print-paper .form-grid td.choices.centered{ text-align:center; }
/* 글자로 늘어선 선택지 사이를 띄운다 (오빠 지시 2026-09-30: 고객 불만 발생
   보고서의 조치 구분 · 접수 유형 「답답해 보여서요」, 회의록 안건의 부서 체크줄).
   칸마다 따로 붙은 span 이라 사이에 빈칸이 하나도 없어 「☑ 반품☐ 교환」으로 붙어 읽혔다. 좌우에 반씩 두르면
   줄이 접혀도 가운데 정렬이 한쪽으로 쏠리지 않는다. ☐ 와 이름은 떼지 않는다. */
.print-paper .form-grid td.choices.spread .choice,
/* 격자 없이 칸에 바로 늘어선 선택지는 spread 를 빠뜨려도 띄운다 (오빠 지시 2026-09-30
   「전산시스템 내부 문서의 간격 확인 및 정돈」: 출하 목적 · 검사 수준 · 대응 결정이
   「☑ 직접 판매☐ 창고 납품」으로 붙어 있었다). 새 지면이 클래스를 잊어도 붙지 않는다. */
.print-paper .form-grid td.choices > .choice{
  display:inline-block;
  margin:0 0.5em;
  white-space:nowrap;
}
/* 한 구획을 표 둘로 이어 그릴 때(열 수가 달라 한 표에 못 담을 때) 맞닿는 선을
   **한 줄**로 (오빠 지시 2026-09-30 「출하 승인요청서 2번의 가운데 줄 bold 처리한거
   bold 해제」 → 「bold 테두리가 사라지지 않아서 확인 바랍니다」).
   두 표가 각자 바깥 테두리(0.4mm)를 두르면 맞닿는 자리에서 0.4 + 0.4 로 겹쳐, 구획
   한가운데에 굵은 줄이 선다. 윗표는 아래 테두리를, 아랫표는 위 테두리를 내려놓고
   그 자리는 칸 선(0.2mm) 하나가 맡는다: 한 표로 그린 구획(1번)과 같은 굵기다. */
.print-paper .form-grid.join-next{ border-bottom:none; }
.print-paper .form-grid.join-next > tbody > tr:last-child > *{ border-bottom:none; }
.print-paper .form-grid.join-prev{ border-top:none; }
/* 아홉 갈래처럼 많으면 세 칸으로: 두 칸이면 세로로 길어져 머리가 늘어진다 */
.print-paper .form-grid td.choices.wide.many .choice-grid{
  grid-template-columns:repeat(3, max-content);
  column-gap:8mm;
}
/* 라벨의 영문 병기: 원본 서식이 국·영문 2행이다 */
.print-paper .form-grid .en{
  display:block;
  font-size:8pt;
  font-weight:400;
  line-height:1.2;
}
/* ── 결재란의 날짜: 반드시 한 줄 ──────────────────────────────────────
   결재 세 칸은 서식이 정한 폭(지면의 12%씩)이라 넓힐 수 없는데, 9.5pt 로 찍은
   「2026-08-18」이 그 폭을 아슬아슬하게 넘겨 「2026-08-」 / 「18」 로 접혔다.
   날짜가 두 줄이 되면 세 칸의 높이가 서로 달라져 **도장 자리가 어긋나고**,
   결재란이 서식 원본과 다른 모양이 된다.

   ⚠️ 이 파일은 «9.5pt 가 한글 표의 하한» 을 규칙으로 둔다. 여기서 8.5pt 로
   내리는 것은 그 규칙의 예외가 아니라 **적용 대상이 아니다**: 하한의 근거는
   한글 획이 흑백 하프톤에서 뭉개지는 것인데, 이 칸은 숫자와 하이픈뿐이라
   뭉갤 획이 없다(전화번호 열과 같은 판단). 대신 등폭 숫자로 자릿수를 고정해
   세 칸의 날짜가 같은 자리에서 시작하게 한다.

   가로 여백도 함께 좁힌다. 가운데 정렬이라 여백을 줄여도 글자가 선에 붙지 않고,
   그만큼이 곧 한 줄을 지키는 여유가 된다. */
.print-paper .form-grid td.stamp-date{
  white-space:nowrap;
  font-size:8.5pt;
  font-variant-numeric:tabular-nums;
  letter-spacing:-0.01em;
  padding-left:1mm;
  padding-right:1mm;
  text-align:center;
}
/* 전역 «첫/마지막 열 안쪽 여백» 규칙(2mm)이 뒤에 와도 지도록 함께 눌러 둔다 */
.print-paper .form-grid td.stamp-date:first-child,
.print-paper .form-grid td.stamp-date:last-child{
  padding-left:1mm;
  padding-right:1mm;
}

/* 자유 서술 칸: 여러 줄이 위에서부터 읽혀야 한다 */
.print-paper .form-grid td.free{
  vertical-align:top;
  white-space:pre-wrap;
}
/* 체크칸 한 개: 격자가 간격을 잡으므로 여백은 두지 않는다 */
.print-paper .form-grid .choice{ white-space:nowrap; }
/* 격자 없이 한 줄로 늘어선 선택지의 간격은 위 «td.choices > .choice» 규칙 하나가
   맡는다(좌우 반씩). 예전에는 여기서 오른쪽에만 4mm 를 따로 주었는데(위험 계획서 ·
   불만 · 입고 검사 · 출하 · 회의록 부서 줄), 두 규칙이 겹치면 좌우가 달라져 가운데
   정렬이 한쪽으로 쏠린다. */

/* 세부 내용 칸 «안의» 작은 표: 서식이 칸 속에 표를 둔 경우(회수 검토 및
   승인서의 「회수 대상 정보」 · 「회수 사유 및 발생 내용」, 마이그 358).
   바깥 칸의 pre-wrap 을 끊고, 선은 안쪽 격자와 같은 가는 선으로 긋는다. */
.print-paper .form-grid td.free table.sub-grid{
  width:100%;
  table-layout:fixed;
  border-collapse:collapse;
  white-space:normal;
  margin:0;
}
.print-paper .form-grid td.free table.sub-grid th,
.print-paper .form-grid td.free table.sub-grid td{
  border:0.2mm solid #000;
  padding:1mm 1.2mm;
  text-align:center;
  vertical-align:middle;
  word-break:keep-all;
  overflow-wrap:anywhere;
}
.print-paper .form-grid td.free table.sub-grid th{
  background:#f2f2f2;
  font-weight:700;
  -webkit-print-color-adjust:exact;
  print-color-adjust:exact;
}
.print-paper .form-grid td.free .sub-note{ margin-top:1.5mm; white-space:pre-wrap; }

/* 숫자 열: 우측정렬 다음이 좌측정렬 열이면 시각적으로 가장 붙어 보인다.
   표준 패딩보다 넉넉히 띄우고 자릿수가 달라도 우단이 흔들리지 않게 한다. */
.print-paper th.num,
.print-paper td.num{
  text-align:right;
  font-variant-numeric:tabular-nums;
  padding-right:6mm;
  white-space:nowrap;
}
/* wrap 열이 2줄이 되면 행 대응이 무너지므로 숫자 열만 최소한의 세로 괘선 */
.print-paper .form-table th.num,
.print-paper .form-table td.num{ border-left:0.2mm solid #999; }
/* 첫 열의 세로 괘선은 «표 왼쪽 테두리»가 되어 서식의 다른 표와 안 맞는다 */
.print-paper .form-table th.num:first-child,
.print-paper .form-table td.num:first-child{ border-left:0; }
.print-paper td.num:last-child,
.print-paper th.num:last-child{ padding-right:0; }

/* 긴 텍스트 열: 열 폭 재분배로 인한 붙음 재발 방지.
   한글은 여기서도 낱말 단위로 꺾는다. word-break:break-word 가 지면 전체의
   keep-all(M70)을 덮어 「표면 불 / 량」 처럼 끊겼다 (화면 검토 M11 · 2026-09-27).
   칸보다 긴 한 덩어리(번호 · 주소)만 anywhere 로 넘긴다. */
.print-paper td.wrap{ word-break:keep-all; overflow-wrap:anywhere; }

/* ── 전화번호 열 ─────────────────────────────────────────────────────
   「010-9945-」 / 「5529」로 접히던 것을 한 줄로 되돌린다.

   이 종이의 쓸모가 «전화를 거는 것» 이라, 번호가 두 줄로 접히면 그 자리에서
   가장 자주 쓰는 값이 가장 읽기 나쁜 값이 된다. 뒷자리만 눈에 남으면 옆 행의
   번호와 섞이기까지 한다.

   ⚠️ 이 파일은 «9.5pt 가 한글 표의 하한, 이 값은 지킨다» 를 규칙으로 둔다.
   여기서 8.5pt 로 내리는 것은 그 규칙의 예외가 아니라 **적용 대상이 아니다**:
   하한의 근거는 한글 획이 흑백 하프톤에서 뭉개지는 것인데, 이 열은 숫자와
   하이픈뿐이라 획이 뭉갤 것이 없다. 대신 등폭 숫자로 자릿수를 고정해
   행 사이 정렬이 흔들리지 않게 한다. */
.print-paper th.tel,
.print-paper td.tel{ white-space:nowrap; }
/* 작게 가는 것은 **값 칸뿐**이다. 머리글(「전화번호」)은 한글이라 9.5pt 를 지킨다. */
.print-paper td.tel{
  font-size:8.5pt;
  font-variant-numeric:tabular-nums;
  letter-spacing:-0.01em;
}
/* nowrap 은 «항상 짧은» 열(일자)에만 쓴다. 식별자(이동번호·Lot)는
   table-layout:fixed 아래에서 nowrap 이면 열 밖으로 삐져나온다.
   하이픈에서 끊기게 두는 편이 안전하다. */
.print-paper td.nowrap{ white-space:nowrap; }

/* ── 묶음 머리 ────────────────────────────────────────────────────────
   한 표 안에서 «여기부터 다른 종류» 를 알리는 줄(예: 교환분 / 반품분).
   굵은 실선을 «위» 에 그어 앞 묶음과 끊는다. h2.sec-head 와 같은 방향이라
   지면 전체에서 «굵은 선 = 여기서 끊긴다» 가 한 가지 뜻으로 읽힌다.
   첫 묶음은 표 머리선(0.5mm)이 이미 그 일을 하므로 선을 겹치지 않는다. */
.print-paper .form-table tr.grp-head > td{
  border-top:0.8mm solid #000;
  border-bottom:0.25mm solid #333;
  padding-top:1.8mm;
  font-weight:700;
  letter-spacing:0.02em;
}
.print-paper .form-table tr.grp-head.first > td{ border-top:0; }
/* 묶음 머리만 남고 첫 데이터 행이 다음 장으로 넘어가면 읽는 순서가 끊긴다 */
.print-paper .form-table tr.grp-head{ break-after:avoid; }

/* 표가 장을 넘길 때 각 장 하단에 신원을 반복 인쇄한다.
   쪽번호는 바닥 여백 상자가 찍고(아래 @page), tfoot(table-footer-group)은
   «이 낱장이 어느 기록인가»를 보장한다. */
.print-paper .tbl-id td{
  border-bottom:0;
  border-top:0.25mm solid #333;
  font-size:9.5pt;
  padding-top:1.2mm;
}

/* ── 흑백 신호 분리 ──────────────────────────────────────────────────
   지금까지 font-semibold 하나에 «검색 Lot 일치 / 집계 잘림 경고 / 부적합 행 /
   부적합 이동 누락» 네 가지 뜻이 실려 있었다. 흑백에서 굵기가 네 뜻이면
   아무 뜻도 아니다. 셋으로 쪼갠다(굵기는 «검색 일치»에만 남긴다). */
.print-paper .row-nc > td:first-child{
  border-left:0.8mm solid #000;
  padding-left:2mm;
}
.print-paper .row-nc{ font-weight:600; }
.print-paper .notice{
  border:0.3mm solid #000;
  padding:1mm 2mm;
  font-weight:600;
  break-inside:avoid;
}
.print-paper .banner{
  border-top:0.5mm solid #000;
  border-bottom:0.5mm solid #000;
  padding:1mm 0;
  text-align:center;
  font-weight:700;
}
.print-paper .legend{ font-size:9.5pt; color:hsl(var(--muted-foreground)); }

/* ── 확인란 ──────────────────────────────────────────────────────────
   ① 칸 사이가 빈 여백뿐이라 «세 칸»이 분리돼 보이지 않았다 → 세로 괘선.
   ② 날인칸을 «항상» 두면 해롭다. 이름이 인쇄된 사본에 빈 도장칸이 있으면
      누군가 찍고, 그 순간 시스템 원본과 경쟁하는 종이 원본이 생겨
      7.5.3.2(판 관리)가 깨진다. 꼬리의 «원본은 시스템에 보관됩니다»와
      정면 모순이다. 그래서 이름이 null 인 칸에만 박스를 낸다
      (수기 결재 동선은 그대로 산다).
   ③ 밑줄 하나가 아니라 «칸»이어야 어디 찍는지 읽힌다. 16mm 는 법인 인감
      ø18 까지 받는 높이. */
.print-paper .sign-cell + .sign-cell{
  border-left:0.2mm solid #000;
  padding-left:3mm;
}
.print-paper .sign-box{
  margin-top:2mm;
  height:16mm;
  border:0.3mm solid #000;
}

/* 지면 꼬리: 확인란을 닫는 실선 바로 아래 또 실선이 오면
   «확인란이 안 닫힌» 모양이 된다. 그래서 점선. */
.print-paper .sheet-foot{
  border-top:0.2mm dashed #666;
  padding-top:2mm;
  margin-top:2mm;
}
/* 꼬리 첫 줄: 서식 원본(.docx)의 꼬리와 같은 배치.
   좌(회사) · 중(장수) · 우(서식번호)를 3등분으로 못 박는다. space-between 만
   쓰면 가운데 값이 좌우 글자 길이에 따라 흔들려 «가운데»가 아니게 된다. */
.print-paper .sheet-foot .foot-line{
  display:grid;
  grid-template-columns:1fr auto 1fr;
  align-items:baseline;
  column-gap:4mm;
}
.print-paper .sheet-foot .foot-line > span:last-child{ text-align:right; }
.print-paper .sheet-foot .foot-mid{
  text-align:center;
  font-variant-numeric:tabular-nums;
}

/* ══════════════════════════════════════════════════════════════════
   페이지 나눔: @media print «밖»에 둔다.
   이 파일의 선언(머리 주석)이 «미리보기는 출력물과 같아야 한다»인데, 지금까지
   이 규칙들이 print 블록 안에만 있어 화면에서는 검증이 안 됐다.
   break-* 는 화면(단일 컬럼)에서 무해하므로 밖으로 뺀다.
   ══════════════════════════════════════════════════════════════════ */
.print-paper thead{ display:table-header-group; }
.print-paper tfoot{ display:table-footer-group; }
/* 표 «통째» 는 장을 넘겨도 된다. 지키는 것은 줄(tr)이다.
   정본 인쇄 CSS(q-design.print.css)가 모든 table 에 break-inside:avoid 를 걸어,
   한 장보다 긴 「세부 내용」 표가 **통째로 다음 장으로 밀렸다.** 첫 장은 머리만
   남고 반 넘게 비었고, 두 쪽으로 잰 보고서가 세 쪽으로 나와 목차 · 장수가 실제
   종이와 어긋났다(화면 검토 M72 · 2026-09-27 PDF 로 실측). 머리 · 목차처럼
   통째로 지킬 표는 .avoid-break 가 따로 잡는다(특정도가 더 높다). */
.print-paper table{ break-inside:auto; }
.print-paper tr{ break-inside:avoid; }
/* ── 긴 자유 서술 줄은 «쪼개져도» 된다 (오빠 지시 2026-09-23) ─────────────
   「표가 잘리더라도 문서 여백이 적도록 해주십시오」

   줄을 통째로 지키면(위 규칙) 한 장의 절반을 넘는 줄이 다음 장으로 밀리고 앞
   장이 그만큼 통째로 빈다. 개선 제안서 1장이 아래 45% 를 비운 채 나왔고,
   그렇게 밀린 것이 3장까지 이어져 마지막 장에 「7. 첨부 문서」 한 줄만 남았다.

   짧은 줄은 그대로 지킨다. 한 줄이 두 장에 걸치면 대장은 읽기 나빠진다.
   **자유 서술 칸을 품은 줄만** 푼다. 거기만 한 장을 넘을 만큼 길어진다.
   :has() 를 모르는 브라우저에서는 이 규칙이 무시되어 예전대로 밀린다(안전). */
.print-paper .form-grid tr:has(> td.free){ break-inside:auto; }
/* 쪼개지더라도 한 장에 한 줄만 남기지는 않는다 */
.print-paper .form-grid td.free{ orphans:2; widows:2; }
.print-paper .avoid-break{ break-inside:avoid; }
.print-paper h1,
.print-paper h2{ break-after:avoid; }
/* 제목 직후 분리는 h2 가 막지만, «제목 + 머리글 행»만 남고 첫 데이터 행이
   다음 장으로 가는 것은 못 막는다. 이 둘이 그 구멍을 메운다.
   ★ 자라는 블록(투입 자재·재고 이동) 자체에는 break-inside:avoid 를 걸지
     않는다. 한 장보다 길어진 블록에 걸면 Chromium 이 통째로 다음 장으로
     밀어 앞 장을 반쯤 비운다. */
.print-paper thead{ break-after:avoid; }
.print-paper .form-table{ break-before:avoid; }
.print-paper .keep-with-next{ break-after:avoid; }
.print-paper footer{ break-inside:avoid; }
/* 자유 서술(작업 조건·비고)이 장 경계에서 한 줄만 넘어가는 것을 막는다 */
.print-paper p,
.print-paper li{ orphans:3; widows:3; }

/* ══════════════════════════════════════════════════════════════════
   인쇄
   ══════════════════════════════════════════════════════════════════ */
@media print{
  /* 하단 18mm 는 쪽번호 자리값이다. 15mm 로 줄이면 3mm 를 버는 것처럼 보이지만
     쪽번호가 지면 꼬리와 겹친다. 건드리지 않는다.

     ── 쪽번호는 장마다 바닥에 «직접» 찍는다 (오너 결정 2026-09-27 · 화면 검토 M72) ──
     예전에는 인쇄 대화상자의 «머리글 및 바닥글» 을 켜야 쪽번호가 나왔고, 그
     설정을 끄면 쪽번호 없는 낱장이 나가 낱장 관리가 안 됐다. 여백 상자
     (@bottom-center)는 Chrome 131 · Edge · Safari 18.2 부터 찍고, 같은 가장자리의
     브라우저 바닥글은 스스로 물러난다(겹치지 않는다). 쪽 수는 브라우저가 실제로
     나눈 장으로 센다(counter(pages)): 추정한 번호가 아니다. 파이어폭스는 아직
     여백 상자를 몰라 그때는 대화상자의 바닥글이 쪽번호를 맡는다. */
  @page{
    size:A4 ${landscape ? "landscape" : "portrait"};
    margin:15mm 15mm 18mm;
    @bottom-center{
      content:counter(page) " / " counter(pages) " 쪽";
      font-family:"Pretendard Variable", Pretendard, "Malgun Gothic", "맑은 고딕",
                  "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
      font-size:9.5pt;
      font-variant-numeric:tabular-nums;
      color:#000;
    }
  }
  /* 지면 꼬리 가운데의 장수는 종이에서는 비운다: 같은 장에 쪽번호가 두 번
     찍히지 않게. 칸은 남겨 좌(회사) · 우(서식번호) 자리가 흔들리지 않게 한다 */
  .print-paper .sheet-foot .foot-mid{ visibility:hidden; }

  html,body{
    height:auto !important;
    min-height:0 !important;
    overflow:visible !important;
    background:#fff !important;
  }

  /* 앱 셸이 지면을 1장에 가둔다.
     (app)/layout.tsx 의 루트 div 가 h-dvh + overflow-hidden, 안쪽 div 도 h-dvh,
     main#main-content 는 flex-1 overflow-y-auto: 스크롤 컨테이너는 분할이 안 돼
     Chrome 이 «현재 보이는 만큼»만 인쇄하고 나머지 기록을 통째로 버린다.
     layout.tsx 는 이번 작업 범위 밖이라 클래스 훅을 못 넣는다. 대신 :has() 로
     «지면을 품고 있는 조상»만 골라 클리핑을 해제한다. */
  body :has(.print-area){
    height:auto !important;
    max-height:none !important;
    min-height:0 !important;
    overflow:visible !important;
    display:block !important;
    padding:0 !important;
    margin:0 !important;
  }
  .print-area{ overflow:visible !important; }
  .no-print{ display:none !important; }

  /* 지면과 무관한 형제는 전부 숨긴다.
     차림표와 본문 위 띠(종)는 이미 no-print 를 달고 있지만(sidebar.tsx ·
     main-band.tsx), 토스트·PWA 설치배너·커맨드 팔레트는 아무 방어가 없다. */
  body > *:not(:has(.print-area)):not(script):not(style){ display:none !important; }
  body :has(.print-area) > *:not(:has(.print-area)):not(.print-area):not(script):not(style){
    display:none !important;
  }

  /* @page 가 여백을 소유하므로 지면 자신은 여백 0. 폭도 auto 로 두어
     인쇄 가능 영역에 정확히 맞춘다 (180mm 를 못 박으면 반올림으로 빈 장이 생긴다). */
  .print-paper{
    width:auto !important;
    max-width:none !important;
    padding:0 !important;
    margin:0 !important;
    border:0 !important;
    border-radius:0 !important;
    box-shadow:none !important;
  }
  ${
    pageBreak
      ? `
  .print-paper{ break-after:page; }
  .print-paper:last-child{ break-after:auto; }
  /* space-y-6 의 24px 가 2장째부터 @page 여백 위에 덧붙어
     장마다 첫 줄 위치가 미묘하게 달라진다 */
  .print-paper + .print-paper{ margin-top:0 !important; }
  `
      : ""
  }
}
`}</style>
  );
}
