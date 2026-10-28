
/* ---------------------------------------------------------------------------
   표

   이 시스템에서 사람이 가장 오래 보는 것이 표다. 그래서 표에 규칙을 둔다.

     첫 칸은 신원이다.   로트번호 · 배치번호 · 제조번호. 고정폭, 굵게, 줄바꿈 없음.
     그 아래 한 줄까지.  코드 · 개정 같은 딸린 값은 작게 아래에 붙인다.
     숫자는 오른쪽.      자릿수가 흔들리지 않게 tnum.
     상태는 점과 글자로. 색 없이도 상태를 구별할 수 있어야 한다.
     동작은 맨 오른쪽.   표가 넘쳐도 잘리지 않게 고정한다.

   행 전체가 어딘가로 가는 목록이면 RowLink 를 쓴다. 누를 수 있다는 것이
   보여야 하고, 마지막 칸의 작은 단추를 겨냥하게 만들면 안 된다.
--------------------------------------------------------------------------- */

/*
 * 치수는 정본이 정한다 (`app/q-design.list.css` · `.qd-table`).
 * 저쪽 DataTable 은 grid 로 짠 div 이지만 값은 같다 - 마크업을 바꾸면 열 너비 ·
 * colspan · sticky 가 다 흔들리므로 진짜 <table className="qd-table qd-table--hangul"> 에 같은 값을 건다.
 * 규격: D:/Claude/Q-Design/docs/16-list-canon.md
 */
/*
 * 열 폭은 «표 하나에 늘어나는 열 하나» 다 (2026-10-28 오너 결정 · 카르넷 표 41개 실측 · 정본 7장 «표»).
 * 열 폭을 아무도 정하지 않으면 남는 폭이 «가장 긴 글이 있는 열» 로 흘러 표마다 생김새가 갈렸다
 * (홈 «마감 대기» 는 글 폭 603px 에 남는 518px 가 작업일 37% · 진행 알약 26% 로 갔다).
 * 이제 표의 주인 열(배치 · 품목 · 형명 · 이름 · «무엇을» 적은 글) 하나만 남는 폭을 받고 줄바꿈하며,
 * 나머지 열은 글 폭으로 줄바꿈 없이 선다. 정본 `.qd-table` 이 `data-grow` 를 읽는다.
 *
 *   grow  늘어날 열, 1부터. 적지 않으면 첫 열. 🔴 «가장 긴 글 열» 에 맡기면 41개 중 10곳이 틀렸다
 *         (자재 지출이 «월» 을, 사용자 표가 «상태» 를 늘림). 표를 만드는 사람이 열을 적는 것이 규칙의 일부다.
 *   className  고정 머리글(qd-table--sticky) · 화면 최소 폭처럼 표 자체에 걸 것만.
 */
export function Table({ children, grow, className = '' }: {
  children: React.ReactNode; grow?: number; className?: string;
}) {
  return (
    <div className="qd-table-scroll">
      <table className={`qd-table qd-table--hangul ${className}`.trim()}
             data-grow={grow && grow !== 1 ? grow : undefined}>
        {children}
      </table>
    </div>
  );
}

/**
 * 머리글에 한글이 «없는» 가.
 *
 * 표 머리글은 모노 · 대문자 · 넓은 자간이다(정본). 그 장치는 라틴 글자 사이를
 * 벌리라고 만든 값이라 한글에 걸면 「로 트 번 호」 처럼 벌어진다. 이 시스템의
 * 머리글이 거의 다 한글이라 표 단위로 기본을 뒤집어 두었다(정본 .qd-table--hangul).
 * 그래서 여기서 표시할 것은 반대쪽 - «이건 라틴이다» 뿐이다. 표를 400곳 넘게
 * 손으로 짠 저장소라, 많은 쪽을 기본으로 두어야 빠뜨려도 조용히 틀리지 않는다.
 */
function hasHangul(node: React.ReactNode): boolean {
  if (typeof node === 'string' || typeof node === 'number') {
    return /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(String(node));
  }
  if (Array.isArray(node)) return node.some(hasHangul);
  if (node && typeof node === 'object' && 'props' in node) {
    return hasHangul((node as { props?: { children?: React.ReactNode } }).props?.children);
  }
  return false;
}

/* 폭 인자(w)는 걷었다 (2026-10-28). 아무도 안 썼고, 열 폭은 Table 의 grow 하나가 정한다 */
export function Th({
  children, right, className = '',
}: { children?: React.ReactNode; right?: boolean; className?: string }) {
  return (
    <th
      className={`th ${right ? 'text-right' : ''} ${className}`}
      data-latin={children != null && !hasHangul(children) ? '' : undefined}
    >
      {children}
    </th>
  );
}

export function Td({
  children, right, className = '', mono, nowrap,
}: {
  children?: React.ReactNode; right?: boolean; className?: string;
  mono?: boolean; nowrap?: boolean;
}) {
  return (
    <td className={`td ${right ? 'tnum text-right' : ''} ${mono ? 'font-mono text-xs' : ''} ${
      nowrap ? 'whitespace-nowrap' : ''} ${className}`}>
      {children}
    </td>
  );
}

/** 첫 칸. 신원과 그 아래 딸린 값 한 줄. */
export function IdCell({
  id, sub,
}: {
  id: React.ReactNode; sub?: React.ReactNode;
}) {
  /*
   * 왼쪽 색 띠를 걷었다 (화면 검토 C24 · 2026-09-27). 한쪽 굵은 띠는 디자인 금지 목록의
   * 장치이고, 쓰던 네 표(생산 · 자재 로트 · 현황 두 표)는 모두 상태 칸이 같은 뜻을 글로
   * 말하고 있었다. 줄 강조는 상태 칸의 글자가 맡는다.
   */
  return (
    <td className="td whitespace-nowrap">
      <div className="font-mono text-[length:var(--qd-font-size-14)] font-semibold text-ink">{id}</div>
      {sub && <div className="mt-0.5 text-xs text-faint">{sub}</div>}
    </td>
  );
}

/** 이름과 코드처럼 한 칸에 두 줄이 들어가는 자리. */
export function TwoLine({
  top, bottom, nowrap = true,
}: { top: React.ReactNode; bottom?: React.ReactNode; nowrap?: boolean }) {
  return (
    <td className={`td ${nowrap ? 'whitespace-nowrap' : ''}`}>
      <div className="text-sm text-body">{top}</div>
      {bottom && <div className="mt-0.5 font-mono text-xs text-faint">{bottom}</div>}
    </td>
  );
}

/** 맨 오른쪽 동작 칸. 표가 가로로 넘쳐도 붙어 있는다. */
export function ActionTd({ children }: { children: React.ReactNode }) {
  return (
    /* 붙는 칸은 표가 놓인 자리의 바탕으로 덮는다. 장부형 판(면 없음) 안이면 화면 바탕(정본 --qd-table-fill) */
    <td className="td sticky right-0 bg-[var(--qd-table-fill,var(--color-surface))] text-right">
      {children}
    </td>
  );
}

/* 세로 괘선을 두지 않는다. 줄 링크(RowLink)의 꺾쇠 칸에는 선이 없어 머리칸에만 선이 떠 보였다
   (2026-10-27 Q-Carnet 화면 점검 · 장부 결은 가로 괘선만) */
export function ActionTh() {
  return <th className="th sticky right-0 w-0" scope="col" aria-label="동작" />;
}

/*
 * 행 전체가 링크인 목록. 구현은 클라이언트 조각이라 따로 두고 여기서 다시
 * 내보낸다. 표 부품은 이 파일 하나에서 가져다 쓰는 것이 규칙이다.
 */
export { RowLink } from './row-link';
