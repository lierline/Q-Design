import React from "react";
import Link, { type LinkProps } from "next/link";
import { cn } from "@/lib/utils/cn";
import { hasHangul } from "@/lib/ui/has-hangul";
import { STAT_ACCENT, type StatAccent } from "@/lib/ui/stat-accent";

/**
 * 목록 화면 머리의 **지표 카드**: 「지금 어떤가」에 한눈에 답하는 자리.
 * Q 제품군 정본 `.qd-kpi` 를 그린다 (Q-Design docs/22 2절).
 *
 *     진행 중 부적합          ← 라벨: 모노 10px (한글이면 자간을 푼다)
 *     2                       ← 숫자: 크게, 칸 색은 여기에만
 *     아직 닫히지 않은 건      ← 부제: 값이 없어도 높이를 잡아 둔다
 *
 * ## 모양은 정본이 쥔다
 *
 * 판(무채 surface · 1px 테두리 · 10px 모서리) · 여백 · 숫자 크기(칸 폭 따라
 * 20~36px) · 라벨 글꼴은 전부 `q-design.screen.css` 가 준다. 여기서 크기나 색을
 * 다시 적지 않는다. 이 저장소의 정본 사본은 유틸리티에 지므로, 같은 값을 또 적으면
 * 정본이 조용히 진다(globals.css 머리말).
 *
 * 전에는 이 부품이 색 바탕 · 한쪽 색 띠 · 색 테두리 · 오른쪽 위 아이콘을 그렸다.
 * 띠는 금지 목록의 side-tab 이고, 집안의 지표 카드에는 아이콘이 없다. 감사 22 에서
 * 이 제품만 튀던 자리라 걷었다.
 *
 * ## 색은 숫자에만
 *
 * 칸마다 «무엇을 세는 칸인가» 의 색은 남긴다(`lib/ui/stat-accent`). 다만 판이 아니라
 * 숫자 한 곳, 정본 `--qd-kpi-color` 로 준다. 0 과 「-」 는 정본 `.qd-kpi--zero` 가
 * 누르고, 못 센 칸은 `.qd-kpi--unread` 가 따로 칠한다. 0 은 사실이고 못 셈은 모름이다.
 *
 * ## 🔴 크기는 **여기 한 곳**에서만 정한다 (오빠 지적 2026-09-15)
 *
 * > 「그리드 너비와 높이가 사이즈가 다른데 모든 그리드의 사이즈를 동일하게」
 *
 * 같은 줄에 서는 카드가 세 벌(StatBlock · CountCard · MonitoringStats)이었고 안쪽
 * 리듬이 달라 높이가 튀었다. 지금은 셋 다 이 부품을 거쳐 정본 한 벌을 쓴다.
 * 다른 것은 껍데기뿐이다(그냥 칸 / 누르면 좁혀지는 칸 / 링크). **새 카드를 만들지 말 것.**
 */
export function StatBlock({
  label,
  value,
  hint,
  accent,
  href,
  delta,
  deltaUnit,
  deltaNote,
  deltaEmpty,
  unit,
  active,
  unread,
  tag,
  onToggle,
  expanded,
}: {
  label: string;
  value: string | number;
  /**
   * 숫자 아래 줄: «이 수가 무엇인가». 여러 줄이면 배열로 준다. 줄 안의 한 낱말만
   * 주의색으로 세워야 할 때(「미달 2」 · 화면 검토 M76)는 요소로 준다.
   */
  hint?: React.ReactNode | React.ReactNode[];
  /**
   * 라벨 줄 오른쪽 끝의 배지 하나: 칸의 «이름표 코드»(PC · CS …)처럼 칸을 가르는 표.
   * 칸 색을 판에 칠하지 않고 이름표로 남기는 자리다(모니터링 구분 띠 · 2026-09-24).
   */
  tag?: React.ReactNode;
  /** 이 칸의 색: 상태가 아니라 «무엇을 재는 칸인가». 숫자에만 칠한다 */
  accent: StatAccent;
  /** 주면 카드가 통째로 링크가 된다 (그 목록으로 좁혀 가는 자리) */
  href?: LinkProps["href"];
  /** 전 회차 대비 증감. `null` 이면 견줄 기록이 없다는 뜻 */
  delta?: number | null;
  deltaUnit?: string;
  /** 무엇과 견준 값인가: 기본은 「전 회차 대비」, 분기로 재면 「전분기 대비」 */
  deltaNote?: string;
  /** 견줄 기록이 없을 때 그 자리에 적을 말 */
  deltaEmpty?: string;
  /** 숫자 뒤 단위: 「0 개」 · 「3/5 개」 */
  unit?: string;
  /** 지금 고른 칸인가: 색은 «정체성» 이라 «고름» 을 말하지 못한다 (globals.css) */
  active?: boolean;
  /**
   * 세다가 실패했나. 숫자 자리에 0 을 그리면 사람은 그것을 «잰 값» 으로 읽는다.
   * 정본 `.qd-kpi--unread` 가 0 과 다른 얼굴로 그린다.
   */
  unread?: boolean;
  /**
   * 누르면 카드 아래에 내역이 펼쳐지는 칸(심사 대비 점검의 적합 · 권고 · 부적합).
   * 카드가 단추(`aria-expanded`)가 된다. 링크(`href`)와 함께 주지 않는다.
   */
  onToggle?: () => void;
  /** 지금 펼쳐져 있나: 고른 칸과 같은 얼굴로 그린다 (globals.css) */
  expanded?: boolean;
}) {
  const color = STAT_ACCENT[accent];
  /*
   * 0 과 「-」(잴 것이 없음 · 기록 없음)는 눌러 둔다. 칸 색으로 세운 「-」 는 아무
   * 값도 없는데 신호처럼 보였다(고객 만족 화면 실측). 못 셈은 여기서 빠진다.
   */
  const quiet = !unread && (value === 0 || value === "0" || value === "-");

  /*
   * 단추 안에는 div 를 둘 수 없다(HTML 규칙 · React 가 수화 오류로 운다). 단추 꼴에서는
   * 칸을 span 으로 그린다. 정본이 라벨 · 숫자에 display:flex 를 주므로 모양은 같고,
   * 부제만 블록으로 세운다(비어도 높이를 잡는 자리라 인라인이면 높이가 사라진다).
   */
  const Part = onToggle ? "span" : "div";

  const body = (
    <>
      <Part
        className="qd-kpi-label"
        data-hangul={hasHangul(label) || undefined}
      >
        {label}
        {tag && <span className="ml-auto">{tag}</span>}
      </Part>
      <Part className="qd-kpi-value">
        {value}
        {unit && <span className="qd-kpi-unit">{unit}</span>}
      </Part>
      {/* 부제 자리는 비어도 둔다: 정본이 높이를 잡아 격자 아랫줄이 맞는다 */}
      <Part className={cn("qd-kpi-sub", onToggle && "block")}>
        {delta != null ? (
          <span className="block">
            <span
              style={{
                color:
                  delta > 0
                    ? "var(--qa-state-green)"
                    : delta < 0
                      ? "var(--qa-state-red)"
                      : undefined,
              }}
            >
              {delta > 0 ? "▲" : delta < 0 ? "▼" : "±"}{" "}
              {Math.abs(delta).toFixed(1)}
              {deltaUnit ?? ""}
            </span>{" "}
            ({deltaNote ?? "전 회차 대비"})
          </span>
        ) : (
          deltaEmpty && <span className="block">{deltaEmpty}</span>
        )}
        {(Array.isArray(hint) ? hint : hint ? [hint] : []).map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </Part>
    </>
  );

  const shell = cn(
    "qd-kpi",
    (href || onToggle) && "qd-kpi--link",
    quiet && "qd-kpi--zero",
    unread && "qd-kpi--unread",
  );
  const style = color
    ? ({ "--qd-kpi-color": color } as React.CSSProperties)
    : undefined;

  if (onToggle) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded ?? false}
        /* 단추의 기본 가운데 정렬 · 폭을 판(div)과 같게 되돌린다 */
        className={cn(shell, "w-full text-left")}
        style={style}
      >
        {body}
      </button>
    );
  }

  return href ? (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={shell}
      style={style}
    >
      {body}
    </Link>
  ) : (
    <div className={shell} style={style}>
      {body}
    </div>
  );
}

/**
 * 카드가 서는 줄: 정본 `.qd-grid-kpi` 위에 **넓은 화면에서는 몇 장이든 한 줄**.
 *
 * 오빠 지시 2026-09-20: 「카드 그리드는 무조건 1행에 다 표기합니다. 4개가 되건
 * 5개가 되건 동일한 사이즈로요.」 정본 격자는 칸 폭이 180px 아래로 안 내려가게
 * 접는데(auto-fit), 그대로 두면 좁은 데스크톱에서 다섯째 장이 둘째 줄에 혼자
 * 남는다. 같은 묶음인데 한 칸만 떨어져 있으면 «다른 것» 으로 읽힌다. 그래서
 * lg 부터는 칸 수를 **자식 수**로 못 박는다. 이 한 가지만 제품 것이고, 간격과
 * 좁은 화면의 접기는 정본 그대로다.
 *
 * 칸 수는 `Children.toArray` 로 센다(null · false 를 걷어낸다 · 조건부로 감춘
 * 카드를 빈 칸으로 세지 않는다).
 */
export function StatRow({
  children,
  label,
  cols,
}: {
  children: React.ReactNode;
  /** 읽어 주는 이름: 카드 묶음이 무엇을 세는가 */
  label?: string;
  /**
   * 한 줄에 세울 칸 수를 따로 정할 때만. 금액처럼 긴 값을 여섯 장 한 줄에 세우면
   * 칸이 좁아 숫자가 넘친다(구매 분석은 셋씩 두 줄). 안 주면 자식 수다.
   */
  cols?: number;
}) {
  const count = cols ?? Math.max(1, React.Children.toArray(children).length);
  return (
    <section
      aria-label={label}
      className="qd-grid-kpi qd-responsive-grid"
      style={
        {
          "--stat-cols": count,
          "--qd-grid-columns": count,
        } as React.CSSProperties
      }
    >
      {children}
    </section>
  );
}
