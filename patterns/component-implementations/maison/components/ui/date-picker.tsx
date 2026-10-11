"use client";

import * as React from "react";
import { CalendarDays } from "@/components/q-design-icons/CalendarDays";
import { cn } from "@/lib/utils/cn";
import { useFieldControl } from "@/components/ui/field";
import { Calendar } from "@/components/ui/calendar";
import { normalizeYmd, isValidYmd } from "@/lib/utils/calendar";
import { todayKst } from "@/lib/utils/dates";

/**
 * 날짜 한 칸: 브라우저 기본 달력을 우리 달력으로 바꾼다.
 *
 * ## 왜 `type="date"` 를 안 쓰나
 * 기본 달력은 연도 상한이 서기 275760년이라 `111111-11-01` 이 그대로 들어가고,
 * 생김새가 브라우저·OS 마다 달라 화면 안에서 혼자 튄다. 무엇보다 기간 선택과
 * 규칙이 갈린다(주 시작 요일·주말 색·오늘 표시).
 *
 * ## 왜 `type="text"` 인가: `required` 를 살리려고
 * 이 레포에는 `required` 가 붙은 날짜 칸이 **27곳**이다. 버튼만 두면 브라우저의
 * 폼 검증이 통째로 사라진다. 진짜 `<input>` 을 그대로 두고 달력이 그 값을 채우는
 * 구조라, `required` 도 `pattern` 도 종전대로 동작한다. 손으로 치는 사람도 있다.
 * `20260804` · `2026.8.4` 를 `normalizeYmd` 가 받아 준다.
 *
 * 값은 `YYYY-MM-DD` 문자열이고, `onChange` 는 기존 `type="date"` 와 **같은 모양**
 * 으로 부른다(`e.target.value`). 그래서 85곳의 호출부를 고치지 않아도 된다.
 */
export type DatePickerProps = Omit<
  React.ComponentProps<"input">,
  "type" | "value" | "onChange"
> & {
  value?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
};

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      className,
      id,
      "aria-describedby": describedBy,
      value,
      onChange,
      min,
      max,
      disabled,
      name,
      ...props
    },
    ref,
  ) => {
    const a11y = useFieldControl({ id, "aria-describedby": describedBy });
    const [open, setOpen] = React.useState(false);
    // 타이핑 중에는 화면 글자를 그대로 두고, 확정될 때만 위로 올린다.
    // 「2026-0」 같은 중간 상태를 부모에 넘기면 값이 매 글자마다 되감긴다.
    const [draft, setDraft] = React.useState<string | null>(null);
    const [cursor, setCursor] = React.useState(() =>
      isValidYmd(value ?? "") ? value! : todayKst(),
    );
    const rootRef = React.useRef<HTMLDivElement>(null);

    const shown = draft ?? value ?? "";

    React.useEffect(() => {
      if (!open) return;
      const onDown = (e: MouseEvent) => {
        if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("mousedown", onDown);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("mousedown", onDown);
        document.removeEventListener("keydown", onKey);
      };
    }, [open]);

    const emit = (v: string) => onChange?.({ target: { value: v, name } });

    const commitDraft = () => {
      if (draft == null) return;
      const norm = normalizeYmd(draft);
      setDraft(null);
      // 못 알아들으면 원래 값으로 되돌린다. 반쯤 친 글자를 남겨 두면
      // 저장할 때가 되어서야 「형식이 틀렸다」는 말을 듣는다
      if (norm != null && norm !== (value ?? "")) emit(norm);
    };

    const pick = (ymd: string) => {
      setDraft(null);
      emit(ymd);
      setOpen(false);
    };

    return (
      <div ref={rootRef} className="relative">
        <input
          {...a11y}
          {...props}
          ref={ref}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="연도-월-일"
          // 연도 네 자리를 브라우저 검증으로도 못 박는다
          pattern="\d{4}-\d{2}-\d{2}"
          title="연도-월-일 (예: 2026-08-04)"
          disabled={disabled}
          value={shown}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => {
            commitDraft();
            props.onBlur?.(e);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commitDraft();
              setOpen(false);
            }
            props.onKeyDown?.(e);
          }}
          className={cn(
            "qd-input pr-[var(--qd-control-height)] tabular-nums",
            className,
          )}
        />
        <button
          type="button"
          onClick={() => {
            if (isValidYmd(value ?? "")) setCursor(value!);
            setOpen((o) => !o);
          }}
          // 입력칸의 커서를 뺏지 않는다
          onMouseDown={(e) => e.preventDefault()}
          disabled={disabled}
          aria-label="달력 열기"
          aria-haspopup="dialog"
          aria-expanded={open}
          className="qd-control-icon absolute inset-y-0 right-0"
        >
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
        </button>

        {open && (
          <div
            role="dialog"
            aria-label="날짜 선택"
            className="qd-popover absolute left-0 top-full z-[var(--qd-z-tooltip)] mt-1 w-max max-w-[var(--qd-maison-max-width-calc-100vw-negative--2rem)] overflow-x-auto"
          >
            <Calendar
              cursor={cursor}
              onCursorChange={setCursor}
              selected={isValidYmd(value ?? "") ? value : undefined}
              onPick={pick}
              min={typeof min === "string" ? min : undefined}
              max={typeof max === "string" ? max : undefined}
            />
            <div className="mt-2 flex items-center justify-between border-t pt-2 text-xs">
              <button
                type="button"
                onClick={() => pick("")}
                className="qd-text-action"
              >
                지우기
              </button>
              <button
                type="button"
                onClick={() => pick(todayKst())}
                className="qd-text-action"
              >
                오늘
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
);
DatePicker.displayName = "DatePicker";
