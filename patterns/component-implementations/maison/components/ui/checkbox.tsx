"use client";

import * as React from "react";
import { Check } from "@/components/q-design-icons/Check";
import { Minus } from "@/components/q-design-icons/Minus";
import { cn } from "@/lib/utils/cn";

/**
 * 체크칸: 전 모듈 공용 (오빠 지적 2026-09-12 「체크 박스 너무 이질적입니다」).
 *
 * ## 왜 브라우저 것이 튀었나
 *
 * `<input type="checkbox">` 는 화면의 색을 따르지 않는다. OS 와 브라우저가 그리는
 * 물건이라 어두운 화면 위에 **흰 네모**가 그대로 얹혔고, 옆의 칸(`Input`·`Select`)
 * 은 우리 테두리·둥근 모서리를 쓰는데 이것만 각지고 밝았다. 42화면에 같은 모양으로
 * 흩어져 있어서 한 곳을 고쳐도 티가 안 났다.
 *
 * ## 어떻게 고쳤나: 그림만 바꾸고 «물건» 은 그대로
 *
 * 네이티브 `<input>` 을 버리지 않는다. 버리면 라벨 클릭·키보드(Space)·`required`·
 * 폼 전송이 전부 다시 만들 일이 되고, 그 구현은 반드시 어딘가 모자란다. 대신
 * 중앙 `.qd-checkbox` 가 네이티브 입력의 클릭 영역을 44px로 유지하고, 형제인
 * `.qd-checkbox-mark` 가 16px 체크 표시와 상태를 그린다.
 *
 * 그래서 호출부는 `<input type="checkbox" …>` 를 `<Checkbox …>` 로 바꾸기만 하면
 * 된다. `checked`·`onChange`·`disabled`·`name` 이 그대로다.
 *
 * ## 세 가지 상태
 *
 *   · 꺼짐   테두리만
 *   · 켜짐   정본 강조색 바탕 + 체크
 *   · 중간   `indeterminate`: 「일부만 골랐다」(목록 머리의 전체 선택)
 */
const Checkbox = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<"input">, "type"> & {
    /** 「일부만 골랐다」. 목록 머리의 전체 선택 칸에서 쓴다 */
    indeterminate?: boolean;
  }
>(({ className, indeterminate, ...props }, ref) => {
  const inner = React.useRef<HTMLInputElement | null>(null);

  /* indeterminate 는 HTML 속성이 아니라 **DOM 프로퍼티** 다. 그려진 뒤에 넣는다 */
  React.useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate === true;
  }, [indeterminate]);

  return (
    <span className={cn("qd-choice-hit", className)}>
      <input
        type="checkbox"
        {...props}
        ref={(node) => {
          inner.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        className="qd-checkbox"
      />
      {/*
        체크 표시: 입력칸 «위에» 얹는다. `pointer-events-none` 이라 눌러도 밑의
        진짜 칸이 받는다. 아이콘을 입력칸 안에 넣을 수는 없다(void 요소).
      */}
      <span className="qd-checkbox-mark" aria-hidden="true">
        {indeterminate ? (
          <Minus className="qd-checkbox-icon" strokeWidth={3} />
        ) : (
          <Check className="qd-checkbox-icon" strokeWidth={3} />
        )}
      </span>
    </span>
  );
});
Checkbox.displayName = "Checkbox";

export { Checkbox };
