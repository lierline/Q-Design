"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { hasHangul } from "@/lib/ui/has-hangul";

/**
 * 이름표.
 *
 * `variant="field"` 는 입력칸 바로 위의 칸 이름표다. Q-Design 정본 `.qd-field-label`
 * (원본 Q-Atelier Lbl · 모노 10 · subtle · 칸과 7 띄움)이 그린다. 전에는 14px 굵은
 * 글이라 원본과 나란히 찍으면 폼만 따로 보였다(2026-09-24 육안 대조). 글자 크기 · 굵기 ·
 * 색을 여기 다시 적지 않는다: 정본 사본이 `@layer components` 안이라 유틸리티가 이긴다.
 *
 * 정본 칸 이름표는 라틴 대문자 · 자간 1.5px 이다. 한글에 그대로 걸면 「기 한」 처럼
 * 벌어지므로 글에 한글이 있으면 부품이 `data-hangul` 을 스스로 단다(부르는 쪽이
 * 기억할 일이 아니다 · `PageHead` 부제와 같은 규칙).
 *
 * 기본(`default`)은 옛 모양이다. 로그인 곁 화면(가입 · 비밀번호)이 쓴다.
 */
const labelVariants = cva(
  "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      variant: {
        default: "qd-control-label",
        field: "qd-field-label",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, variant, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants({ variant }), className)}
    data-hangul={
      variant === "field" && hasHangul(props.children) ? "" : undefined
    }
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
