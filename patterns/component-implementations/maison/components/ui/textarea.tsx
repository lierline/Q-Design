"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { useFieldControl } from "@/components/ui/field";

/** 여러 줄 입력 프리미티브: Field 안에서는 id·aria 를 자동으로 받는다. */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, id, "aria-describedby": describedBy, ...props }, ref) => {
  const a11y = useFieldControl({ id, "aria-describedby": describedBy });
  return (
    <textarea
      ref={ref}
      className={cn("qd-input resize-y", className)}
      {...a11y}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
