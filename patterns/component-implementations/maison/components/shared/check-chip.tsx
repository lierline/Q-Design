"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils/cn";
import { CHOICE_ON } from "@/lib/ui/choice";

/**
 * 고르는 칸 한 개: 테두리 상자 안의 체크칸 + 글자 (다중 선택 · rules/02 §10-2).
 *
 * 오빠 지시 2026-09-29 「조치 구분에 해당하는 버튼이 조금 가독성이 떨어집니다. 2번
 * 이미지와 같은 버튼으로 변경합니다. 단, 다수 선택 가능한 버튼으로요」: 문서 반출의
 * 「신청 구분」 라디오 상자(h-10 · text-sm)와 같은 모양에 체크칸을 넣었다. 작은 둥근
 * 칩(h-8 · text-xs · ☐ 글자)은 읽히지 않았다. 골라진 상자는 테두리 · 바탕이 구리색.
 *
 * 고객 불만 폼 안에만 있던 것을 건강 이상 기록지의 조치 사항(2026-10-01)이 두 번째로
 * 쓰게 되어 공용으로 올렸다(rules/09 「공용 부품부터」).
 */
export function CheckChip({
  label,
  on,
  onClick,
  disabled,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <label
      aria-disabled={disabled || undefined}
      className={cn(
        /* 격자(`ChoiceGrid`) 안에서는 한 칸을 꽉 채운다. 긴 글은 칸 안에서 접힌다 */
        "qd-choice qd-choice-hit qd-selection-row flex w-full cursor-pointer items-center gap-2",
        on ? CHOICE_ON : "hover:bg-[var(--qd-surface2)]",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <Checkbox
        className="!min-w-[var(--qd-choice-glyph-size)] shrink-0"
        checked={on}
        onChange={onClick}
        disabled={disabled}
      />
      <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
    </label>
  );
}
