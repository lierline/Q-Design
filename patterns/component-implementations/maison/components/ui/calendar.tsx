"use client";

import { ChevronLeft } from "@/components/q-design-icons/ChevronLeft";
import { ChevronRight } from "@/components/q-design-icons/ChevronRight";
import { ChevronsLeft } from "@/components/q-design-icons/ChevronsLeft";
import { ChevronsRight } from "@/components/q-design-icons/ChevronsRight";
import { addMonths, monthGrid, todayKst } from "@/lib/utils/dates";
import { inRange, type DateRange } from "@/lib/utils/calendar";

/**
 * 달력 격자: 단일 선택과 기간 선택이 **같은 격자**를 쓴다.
 *
 * 두 벌을 따로 만들면 「일요일이 빨강인가」 「지난달 칸을 누를 수 있는가」 같은
 * 규칙이 두 곳에서 갈라지고, 한쪽만 고쳐진 채로 오래 간다.
 *
 * 주(週)는 일요일 시작: `monthGrid` 와 `lib/utils/calendar` 의 프리셋 계산이
 * 모두 그 기준이라 셋이 어긋나면 「지난주」로 칠해지는 칸이 한 줄과 안 맞는다.
 */

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

type Props = {
  /** 몇 달을 나란히 보일지 (1 = 단일 선택, 3 = 기간 선택) */
  months?: number;
  /** 왼쪽 끝에 보이는 달의 아무 날짜 (`YYYY-MM-DD`) */
  cursor: string;
  onCursorChange: (ymd: string) => void;
  /** 단일 선택 값 */
  selected?: string;
  /** 기간 선택 값 */
  range?: DateRange;
  /** 기간을 고르는 중일 때, 마우스가 지나가는 날 (미리보기 칠) */
  hover?: string;
  onHover?: (ymd: string | null) => void;
  onPick: (ymd: string) => void;
  min?: string;
  max?: string;
};

export function Calendar({
  months = 1,
  cursor,
  onCursorChange,
  selected,
  range,
  hover,
  onHover,
  onPick,
  min,
  max,
}: Props) {
  const today = todayKst();

  /*
   * 기간을 고르는 중(시작만 찍힌 상태)에는 마우스가 지나는 곳까지 미리 칠한다.
   * 이게 없으면 「어디까지 잡히는지」를 두 번째 클릭 뒤에야 알게 된다.
   */
  const preview: DateRange | null =
    range && range.from && !range.to && hover
      ? hover >= range.from
        ? { from: range.from, to: hover }
        : { from: hover, to: range.from }
      : null;
  const painted = preview ?? range ?? null;

  const disabled = (ymd: string) =>
    (min != null && ymd < min) || (max != null && ymd > max);

  return (
    <div className="select-none">
      {/* 달 이동: «는 1년, ‹ 는 1달. 재작년 자료를 찾을 때 12번 누르지 않게 */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-0.5">
          <NavButton
            label="1년 전"
            onClick={() => onCursorChange(addMonths(cursor, -12))}
          >
            <ChevronsLeft className="h-4 w-4" />
          </NavButton>
          <NavButton
            label="이전 달"
            onClick={() => onCursorChange(addMonths(cursor, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </NavButton>
        </div>
        <div className="flex flex-1 justify-around gap-4">
          {Array.from({ length: months }, (_, i) => {
            const m = addMonths(cursor, i);
            return (
              <span
                key={m}
                className="qd-control-label font-semibold tabular-nums"
              >
                {m.slice(0, 4)}. {m.slice(5, 7)}.
              </span>
            );
          })}
        </div>
        <div className="flex items-center gap-0.5">
          <NavButton
            label="다음 달"
            onClick={() => onCursorChange(addMonths(cursor, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </NavButton>
          <NavButton
            label="1년 후"
            onClick={() => onCursorChange(addMonths(cursor, 12))}
          >
            <ChevronsRight className="h-4 w-4" />
          </NavButton>
        </div>
      </div>

      <div className="flex gap-4" onMouseLeave={() => onHover?.(null)}>
        {Array.from({ length: months }, (_, i) => {
          const m = addMonths(cursor, i);
          const [y, mm] = m.split("-").map(Number);
          const cells = monthGrid(y!, mm!);
          return (
            <div key={m} className="min-w-0">
              <div className="mb-1 grid grid-cols-7 text-center">
                {WEEKDAYS.map((w, wi) => (
                  <span
                    key={w}
                    className="qd-calendar-weekday"
                    data-weekday={wi}
                  >
                    {w}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-0.5">
                {cells.map((c) => {
                  const isSelected = selected === c.date;
                  const isEdge =
                    painted != null &&
                    (painted.from === c.date || painted.to === c.date);
                  const isInside =
                    painted != null && !isEdge && inRange(c.date, painted);
                  const off = disabled(c.date);
                  return (
                    <button
                      key={c.date}
                      type="button"
                      disabled={off}
                      onClick={() => onPick(c.date)}
                      onMouseEnter={() => onHover?.(c.date)}
                      aria-label={c.date}
                      aria-current={c.date === today ? "date" : undefined}
                      aria-pressed={isSelected || isEdge}
                      data-outside={!c.inMonth ? "true" : undefined}
                      data-weekday={c.weekday}
                      data-in-range={isInside ? "true" : undefined}
                      className="qd-calendar-day"
                    >
                      {c.day}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="qd-control-icon"
    >
      {children}
    </button>
  );
}
