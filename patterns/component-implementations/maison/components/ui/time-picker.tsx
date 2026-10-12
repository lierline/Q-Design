"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CHOICE_ON } from "@/lib/ui/choice";
import { useFieldControl } from "@/components/ui/field";
import {
  hmFromParts,
  hmLabel,
  hmParts,
  isValidHm,
  normalizeHm,
  type Meridiem,
} from "@/lib/utils/time";

/**
 * 시각 한 칸: 브라우저 기본 시계를 우리 고르개로 바꾼다 (오빠 지시 2026-10-12
 * 「시계를 눌렀을때 디자인 변경 필요합니다」).
 *
 * 기본 시계(`type="time"`)는 흰 바탕에 파란 칸이 뜨는 브라우저 물건이라 어두운 화면
 * 안에서 혼자 튀었다(캡처). 날짜 칸(`DatePicker`)과 같은 짜임으로 바꾼다:
 *   · 진짜 `<input type="text">` 를 두고 고르개가 그 값을 채운다: `required` 가 산다
 *   · 손으로 쳐도 된다: `830` · `8:30` · `오후 3:30` 을 `normalizeHm` 이 받는다
 *   · 고르개는 오전/오후 · 시 · 분 세 줄, 고른 칸은 달력과 같은 색(숲색)
 *   · 분은 5분 간격을 늘어놓되, 손으로 친 분(08:07)도 그대로 받는다
 *
 * 값은 `HH:MM`(24시), `onChange` 는 기존 `type="time"` 과 같은 모양
 * (`e.target.value`): `Input type="time"` 이 이 부품으로 바뀌어 서므로 호출부는
 * 손대지 않는다.
 */
export type TimePickerProps = Omit<
  React.ComponentProps<"input">,
  "type" | "value" | "onChange"
> & {
  value?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
};

const HOURS = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const pad = (n: number) => String(n).padStart(2, "0");

export const TimePicker = React.forwardRef<HTMLInputElement, TimePickerProps>(
  (
    {
      className,
      id,
      "aria-describedby": describedBy,
      value,
      onChange,
      disabled,
      name,
      ...props
    },
    ref,
  ) => {
    const a11y = useFieldControl({ id, "aria-describedby": describedBy });
    const [open, setOpen] = React.useState(false);
    /* 치는 동안은 글자를 그대로 두고, 확정될 때만 위로 올린다 */
    const [draft, setDraft] = React.useState<string | null>(null);
    const rootRef = React.useRef<HTMLDivElement>(null);
    const hourRef = React.useRef<HTMLDivElement>(null);
    const minuteRef = React.useRef<HTMLDivElement>(null);

    const valid = isValidHm(value ?? "") ? (value as string) : null;
    const parts = valid ? hmParts(valid) : null;
    const shown = draft ?? (valid ? hmLabel(valid) : (value ?? ""));

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
      /* 연 순간 고른 시 · 분이 보이게 굴린다 */
      for (const box of [hourRef.current, minuteRef.current]) {
        const on = box?.querySelector<HTMLElement>('[aria-selected="true"]');
        if (box && on) box.scrollTop = on.offsetTop - box.clientHeight / 2 + 16;
      }
      return () => {
        document.removeEventListener("mousedown", onDown);
        document.removeEventListener("keydown", onKey);
      };
    }, [open]);

    const emit = (v: string) => onChange?.({ target: { value: v, name } });

    const commitDraft = () => {
      if (draft == null) return;
      const norm = normalizeHm(draft);
      setDraft(null);
      // 못 알아들으면 원래 값으로: 반쯤 친 글자를 남겨 두지 않는다
      if (norm != null && norm !== (value ?? "")) emit(norm);
    };

    /* 한 칸을 고르면 나머지는 지금 값(없으면 오전 9시 00분)에서 가져온다 */
    const base = parts ?? { meridiem: "am" as Meridiem, hour12: 9, minute: 0 };
    const pick = (patch: Partial<typeof base>) => {
      const next = { ...base, ...patch };
      setDraft(null);
      emit(hmFromParts(next.meridiem, next.hour12, next.minute));
    };

    const cell = (selected: boolean) =>
      cn(
        "qd-choice flex w-full items-center justify-center tabular-nums transition-colors",
        selected ? CHOICE_ON : "hover:bg-[var(--qd-surface2)]",
      );

    /* 5분 간격 밖의 분(08:07)이면 그 분도 줄에 세운다: 고른 값이 줄에서 사라지지 않게 */
    const minutes =
      parts && !MINUTES.includes(parts.minute)
        ? [...MINUTES, parts.minute].sort((a, b) => a - b)
        : MINUTES;

    return (
      <div ref={rootRef} className="relative">
        <input
          {...a11y}
          {...props}
          ref={ref}
          name={name}
          type="text"
          autoComplete="off"
          placeholder="오전 09:00"
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
          onClick={() => setOpen((o) => !o)}
          onMouseDown={(e) => e.preventDefault()}
          disabled={disabled}
          aria-label="시각 선택 열기"
          aria-haspopup="dialog"
          aria-expanded={open}
          className="qd-control-icon absolute inset-y-0 right-0"
        >
          <Clock className="h-4 w-4" aria-hidden="true" />
        </button>

        {open && (
          <div
            role="dialog"
            aria-label="시각 선택"
            className="qd-popover fixed inset-x-3 top-1/2 z-[var(--qd-z-tooltip)] -translate-y-1/2 overflow-x-auto md:absolute md:inset-x-auto md:left-0 md:top-full md:mt-1 md:w-64 md:max-w-[var(--qd-maison-max-width-calc-100vw-negative--2rem)] md:translate-y-0"
          >
            <div className="grid grid-cols-[4.5rem_1fr_1fr] gap-2">
              <p className="qd-calendar-weekday">오전 · 오후</p>
              <p className="qd-calendar-weekday">시</p>
              <p className="qd-calendar-weekday">분</p>
              <div
                role="listbox"
                aria-label="오전 · 오후"
                className="space-y-1"
              >
                {(
                  [
                    ["am", "오전"],
                    ["pm", "오후"],
                  ] as const
                ).map(([code, label]) => (
                  <button
                    key={code}
                    type="button"
                    role="option"
                    aria-selected={parts?.meridiem === code}
                    onClick={() => pick({ meridiem: code })}
                    className={cell(parts?.meridiem === code)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div
                ref={hourRef}
                role="listbox"
                aria-label="시"
                className="max-h-52 space-y-1 overflow-y-auto pr-1"
              >
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    role="option"
                    aria-selected={parts?.hour12 === h}
                    onClick={() => pick({ hour12: h })}
                    className={cell(parts?.hour12 === h)}
                  >
                    {pad(h)}
                  </button>
                ))}
              </div>
              <div
                ref={minuteRef}
                role="listbox"
                aria-label="분"
                className="max-h-52 space-y-1 overflow-y-auto pr-1"
              >
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="option"
                    aria-selected={parts?.minute === m}
                    onClick={() => pick({ minute: m })}
                    className={cell(parts?.minute === m)}
                  >
                    {pad(m)}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between border-t pt-2 text-xs">
              <span className="tabular-nums text-muted-foreground">
                {valid ? hmLabel(valid) : "-"}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="qd-text-action"
              >
                확인
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
);
TimePicker.displayName = "TimePicker";
