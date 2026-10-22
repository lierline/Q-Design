"use client";

import * as React from "react";
import { CalendarDays } from "@/components/q-design-icons/CalendarDays";
import { cn } from "@/lib/utils/cn";
import { Calendar } from "@/components/ui/calendar";
import {
  RANGE_PRESETS,
  formatRangeSummary,
  matchPreset,
  type DateRange,
} from "@/lib/utils/calendar";
import { addMonths, todayKst } from "@/lib/utils/dates";

/**
 * 기간 선택: 석 달을 나란히 놓고, 빠른 조각과 요약줄을 함께 둔다.
 *
 * ## 왜 석 달인가
 * 실무 질문은 「7월 15일 ~ 8월 3일」처럼 달을 넘나든다. 한 달만 보이면 끝날을
 * 고르려고 달을 넘기는 순간 시작날이 화면에서 사라져, 무엇을 고르고 있었는지를
 * 놓친다. 석 달이면 대부분의 기간이 한 화면에 들어온다.
 *
 * ## 왜 「적용」이 따로 있나
 * 고르는 도중의 반쪽 기간(시작만 찍힌 상태)으로 조회가 나가면, 사용자는 자기가
 * 누른 적 없는 결과를 본다. 두 날짜가 다 정해진 뒤에만 위로 올린다.
 */
export function DateRangePicker({
  value,
  onApply,
  className,
  label = "기간",
  disabled,
}: {
  value: DateRange;
  onApply: (range: DateRange) => void;
  className?: string;
  label?: string;
  disabled?: boolean;
}) {
  const today = todayKst();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DateRange>(value);
  const [hover, setHover] = React.useState<string | null>(null);
  // 왼쪽 끝 달: 열 때 «시작일이 보이는 자리»에 맞춘다
  const [cursor, setCursor] = React.useState(() => addMonths(today, -1));
  const rootRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setDraft(value), [value]);

  // 열면 초점이 창 안 첫 단추로 간다. 단추로 열고 Tab 을 치면 창을 건너뛰고 뒤의
  // 거르개로 갔다(실측 2026-10-22). Esc 로 닫으면 여는 단추로 돌아온다.
  React.useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>("button")?.focus();
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      rootRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openPanel = () => {
    setDraft(value);
    setCursor(value.from ? value.from : addMonths(today, -1));
    setOpen(true);
  };

  /*
   * 한 번 누르면 시작, 두 번째로 누르면 끝. 이미 둘 다 정해진 상태에서 누르면
   * **새로 시작**한다. 「끝날만 바꾸고 싶다」와 「다시 잡겠다」 중 뒤쪽이 훨씬 잦고,
   * 앞쪽은 한 번 더 누르면 되지만 그 반대는 되돌릴 방법이 없다.
   */
  const pick = (ymd: string) => {
    setDraft((d) => {
      if (!d.from || (d.from && d.to)) return { from: ymd, to: "" };
      if (ymd < d.from) return { from: ymd, to: d.from };
      return { from: d.from, to: ymd };
    });
  };

  const applyPreset = (code: string) => {
    const p = RANGE_PRESETS.find((x) => x.code === code);
    if (!p) return;
    const r = p.of(today);
    setDraft(r);
    setCursor(addMonths(r.from, 0));
  };

  const activePreset = matchPreset(draft, today)?.code;
  const ready = Boolean(draft.from && draft.to);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        /* 여는 칸은 이웃 고르개와 같은 정본 거르개 고르개다(.qd-filter-select · 키 36 ·
           글자 12 · 모서리 10). 이 달력은 목록 위 거르개 띠(DateRangeFilter)에서만 쓴다 */
        className={cn(
          "qd-filter-select inline-flex items-center gap-1.5 whitespace-nowrap text-left",
          open && "border-[color:var(--qd-accent)]",
          !(value.from || value.to) && "text-muted-foreground",
        )}
      >
        <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="tabular-nums">
          {value.from || value.to ? formatRangeSummary(value) : label}
        </span>
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="기간 선택"
          className="qd-popover absolute left-0 top-full z-[var(--qd-z-tooltip)] mt-1 w-max max-w-[var(--qd-maison-max-width-calc-100vw-negative--2rem)] overflow-x-auto"
        >
          {/* 빠른 조각: 「지난 7일」은 어제까지다(lib/utils/calendar 주석 참고) */}
          <div className="mb-3 flex flex-wrap gap-1 border-b pb-3">
            {RANGE_PRESETS.map((p) => (
              <button
                key={p.code}
                type="button"
                onClick={() => applyPreset(p.code)}
                aria-pressed={activePreset === p.code}
                className="qd-choice"
              >
                {p.label}
              </button>
            ))}
          </div>

          <Calendar
            months={3}
            cursor={cursor}
            onCursorChange={setCursor}
            range={draft}
            hover={hover ?? undefined}
            onHover={setHover}
            onPick={pick}
          />

          <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
            <span className="text-xs tabular-nums text-muted-foreground">
              {formatRangeSummary(draft)}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onApply({ from: "", to: "" });
                  setOpen(false);
                }}
                className="qd-text-action"
              >
                전체 기간
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="qd-text-action"
              >
                취소
              </button>
              <button
                type="button"
                disabled={!ready}
                onClick={() => {
                  onApply(draft);
                  setOpen(false);
                }}
                className="qd-btn qd-btn--primary qd-btn--sm"
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
