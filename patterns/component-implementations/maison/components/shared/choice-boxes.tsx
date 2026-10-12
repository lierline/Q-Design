"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { choiceGridClass } from "@/lib/ui/choice-grid";
import { CHOICE_ON } from "@/lib/ui/choice";

function responsiveChoiceGrid(
  cols: string | undefined,
  labels: readonly string[],
) {
  if (!cols) return choiceGridClass(labels);
  const tokens = cols.split(/\s+/);
  const base = tokens.find((token) =>
    /^grid-cols-(?:[3-9]|1[0-2])$/.test(token),
  );
  if (!base) return cols;
  const mobile = choiceGridClass(labels)
    .split(/\s+/)
    .filter((token) => !token.includes(":"));
  const responsive = tokens.filter((token) => token !== base);
  if (!responsive.some((token) => /^sm:grid-cols-/.test(token)))
    responsive.unshift("sm:" + base);
  return [...mobile, ...responsive].join(" ");
}

/**
 * 고르는 칸 한 묶음: 테두리 상자 안의 라디오 + 글자 (하나만 고른다 · rules/02 §10-2).
 *
 * 서식의 ☐ 선택지(「☐ 완제품 ☐ 반제품 …」)와 「~ 여부」 줄을 폼에서 받는 칸이다
 * (rules/06 §5-1). 여럿을 고르는 칸은 `CheckChip`.
 *
 * 부적합품 발생 · 처리 보고서(마이그 368)에서 손으로 짠 두 벌을 올렸다: 오빠 지시
 * 2026-10-01 「포맷이 너무 괜찮아서 다른 보고서에도 참고하고 싶네요」.
 *
 * 열은 줄 폭을 같은 너비로 나눠 채운다(`choiceGridClass`: 선택지 수와 글 길이로, 줄마다
 * 고르게 · 2026-10-01 「그리드 내 균일하게 배분」). 한쪽으로 쏠리는 폭 제한(`max-w-*`)은
 * 두지 않는다. 종이의 격자를 따라야 하는 자리(줄마다 세 칸 등)만 `cols` 로 덮는다. 빈 값(`""`)은 «아직 안 고름»: 종이가 답을 강제하지
 * 않는 줄은 짐작해 미리 고르지 않는다(rules/06 §5).
 *
 * `clearable` 이면 골라진 칸을 **다시 누르면 풀린다**(빈 값으로). 라디오는 한 번 고르면
 * 스스로 못 푼다: 고르는 칸으로 옮기기 전 「(미판정)」 · 「(미정)」 같은 빈 선택지가 있던
 * 칸, 빈 값이 «모름» 으로 저장되는 칸에 켠다. 빈 값이 안 되는 칸(필수 코드 · NOT NULL)
 * 에는 켜지 않는다.
 */
export function ChoiceBoxes({
  name,
  value,
  options,
  onChange,
  disabled,
  cols,
  clearable = false,
}: {
  /** 라디오 묶음 이름: 한 화면에서 겹치지 않게 */
  name: string;
  /** 골라진 코드. 빈 값이면 아무것도 안 골랐다 */
  value: string;
  options: ReadonlyArray<{ code: string; label: string }>;
  onChange: (code: string) => void;
  disabled?: boolean;
  /** 격자 열: 없으면 선택지 수로 정한다 */
  cols?: string;
  /** 골라진 칸을 다시 누르면 빈 값으로: 빈 값이 뜻 있는 칸에만 */
  clearable?: boolean;
}) {
  const grid = responsiveChoiceGrid(
    cols,
    options.map((o) => o.label),
  );
  return (
    <div role="radiogroup" className={cn("grid gap-2", grid)}>
      {options.map((o) => (
        <label
          key={o.code}
          aria-disabled={disabled || undefined}
          title={
            clearable && value === o.code
              ? "다시 누르면 선택이 풀립니다"
              : undefined
          }
          className={cn(
            /* 긴 선택지는 칸 안에서 접힌다: 한 줄의 칸은 가장 높은 칸에 맞춰 선다 */
            "qd-choice qd-choice-hit qd-selection-row flex w-full cursor-pointer items-center gap-2",
            value === o.code ? CHOICE_ON : "hover:bg-[var(--qd-surface2)]",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <input
            className="qd-radio"
            type="radio"
            name={name}
            checked={value === o.code}
            onChange={() => onChange(o.code)}
            /* 이미 골라진 라디오는 change 가 안 난다: 누름으로 풀어 준다 */
            onClick={() => {
              if (clearable && value === o.code) onChange("");
            }}
            disabled={disabled}
          />
          <span className="min-w-0 [overflow-wrap:anywhere]">{o.label}</span>
        </label>
      ))}
    </div>
  );
}

/**
 * 「~ 여부」 줄의 두 칸: 종이에 인쇄된 말 그대로 넘긴다(있음 / 없음 · 함 / 안 함 ·
 * 필요 / 불필요 · 가능 / 불가). 값은 "yes" · "no", 안 고르면 "".
 */
export const yesNoOptions = (yes = "예", no = "아니오") =>
  [
    { code: "yes", label: yes },
    { code: "no", label: no },
  ] as const;

/**
 * 여럿 고르는 칸(`CheckChip`) 묶음의 격자: `ChoiceBoxes` 와 같은 열 규칙.
 *
 * `labels` 는 그 묶음의 선택지 글(열 수를 정한다). 칸은 격자 한 칸을 꽉 채운다.
 * `flex flex-wrap` 으로 늘어놓으면 줄 오른쪽이 비어 한쪽으로 쏠린다(시험: `choice-grid`).
 */
export function ChoiceGrid({
  labels,
  cols,
  className,
  children,
}: {
  labels: readonly string[];
  /** 종이의 격자를 따라야 하는 자리만 덮는다 */
  cols?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="group"
      className={cn(
        "grid gap-2",
        responsiveChoiceGrid(cols, labels),
        className,
      )}
    >
      {children}
    </div>
  );
}
