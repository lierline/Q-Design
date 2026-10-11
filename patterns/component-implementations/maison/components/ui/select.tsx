"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { useFieldControl } from "@/components/ui/field";

/**
 * 네이티브 <select> 프리미티브.
 *
 * 이 앱의 선택 입력은 전부 네이티브 select 다(모바일·현장 태블릿에서 OS 기본
 * 피커가 가장 빠르고 접근성이 검증돼 있다). 각 화면이 같은 클래스 문자열을
 * 따로 들고 있던 것을 여기로 모으고, Field 안에서는 id·aria 를 자동으로 받는다.
 *
 * 상자는 입력칸과 같은 정본(.qd-input)이 그린다. 고르개도 모서리 10 이다.
 */
const Select = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<"select">
>(({ className, id, "aria-describedby": describedBy, ...props }, ref) => {
  const a11y = useFieldControl({ id, "aria-describedby": describedBy });
  return (
    <select
      ref={ref}
      className={cn("qd-input", className)}
      {...a11y}
      {...props}
    />
  );
});
Select.displayName = "Select";

export { Select };
