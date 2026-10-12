"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { useFieldControl } from "@/components/ui/field";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";

/**
 * 날짜 칸은 **우리 달력**으로 바꿔 끼운다.
 *
 * `type="date"` 를 쓰는 화면이 85곳인데, 브라우저 기본 달력은
 *   · 연도 상한이 서기 275760년이라 `111111-11-01` 이 그대로 들어가고
 *   · 생김새가 브라우저·OS 마다 달라 화면 안에서 혼자 튀며
 *   · 기간 선택기와 규칙(주 시작 요일·주말 색·오늘 표시)이 갈린다.
 *
 * 여기서 한 번 갈아 끼우면 85곳이 전부 바뀐다. `DatePicker` 가 `value` ·
 * `onChange(e.target.value)` 를 기존과 **같은 모양**으로 주고받으므로 호출부는
 * 손대지 않는다. 진짜 `<input>` 을 쓰기 때문에 `required` 도 그대로 산다.
 *
 * 시각 칸(`type="time"`)도 같은 까닭으로 우리 고르개(`TimePicker`)로 바꿔 끼운다
 * (오빠 지시 2026-10-12 「시계를 눌렀을때 디자인 변경 필요합니다」).
 *
 * 날짜 · 시각이 아닌 나머지 타입은 종전 그대로다.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, id, "aria-describedby": describedBy, ...props }, ref) => {
    // Field 안에 있으면 라벨과 묶인 id·aria 를 자동으로 받는다.
    // 밖에 있으면 넘어온 값을 그대로 쓴다. 기존 사용처는 무변경.
    const a11y = useFieldControl({ id, "aria-describedby": describedBy });

    if (type === "date") {
      return (
        <DatePicker
          {...props}
          ref={ref}
          id={id}
          aria-describedby={describedBy}
          className={className}
          value={typeof props.value === "string" ? props.value : ""}
          onChange={
            props.onChange as unknown as (e: {
              target: { value: string; name?: string };
            }) => void
          }
        />
      );
    }

    if (type === "time") {
      return (
        <TimePicker
          {...props}
          ref={ref}
          id={id}
          aria-describedby={describedBy}
          className={className}
          value={typeof props.value === "string" ? props.value : ""}
          onChange={
            props.onChange as unknown as (e: {
              target: { value: string; name?: string };
            }) => void
          }
        />
      );
    }

    return (
      <input
        type={type}
        {...a11y}
        className={cn(
          // 상자는 정본(.qd-input)이 그린다. 모서리 · 여백 · 색을 여기 다시 적으면
          // 유틸리티가 정본을 이긴다(정본 사본이 @layer components 안이다)
          "qd-input file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
