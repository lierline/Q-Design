import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

/**
 * 단추는 Q 제품군 정본(`.qd-btn` · app/q-design.screen.css)이 그린다.
 *
 * 주 단추는 «글자색 면» 이다. 다크에서 상아색, 라이트에서 먹색이 된다
 * (오너 결정 2026-09-24 「주 단추는 상아색 면」). 전에는 샴페인 면이라 네 제품
 * 가운데 이 제품만 튀었다. 샴페인은 강조 막대 · 초점 · 활성 표시의 몫이다.
 *
 * 🔴 정본과 겹치는 유틸리티(면 색 · 글자 색 · rounded · h · px · 글자 크기)를
 *    여기 다시 적지 말 것. 이 저장소의 정본 사본은 `@layer components` 안이라,
 *    같은 요소에 유틸리티가 붙으면 유틸리티가 이긴다. 적는 순간 정본이 조용히 진다.
 *
 * ghost · link 도 정본의 글자 행동을 사용한다.
 */
/** 정본이 그리는 변형 */
const CANON = ["default", "destructive", "outline", "secondary"] as const;
/** 중앙 정본의 글귀 변형 */
const TEXTUAL = ["ghost", "link"] as const;

const buttonVariants = cva(
  "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "qd-btn qd-btn--primary",
        destructive: "qd-btn qd-btn--danger",
        outline: "qd-btn qd-btn--secondary",
        secondary: "qd-btn qd-btn--secondary",
        ghost: "qd-text-action",
        link: "qd-text-action",
      },
      size: {
        default: "",
        sm: "",
        lg: "",
        icon: "",
      },
    },
    compoundVariants: [
      /* 상자형 기본 · lg 는 정본 44px, 명시한 sm 만 데스크톱 36px 로 선다 */
      { variant: [...CANON], size: "sm", class: "qd-btn--sm" },
      /* 아이콘 단추: 클릭 영역 44 · 모서리 10 */
      { variant: [...CANON], size: "icon", class: "qd-control-icon" },
      {
        variant: [...TEXTUAL],
        size: "sm",
        class: "qd-text-action--sm",
      },
      /* 글귀형 기본 · sm 은 36px, lg · icon 은 정본 44px 클릭 영역을 쓴다 */
      {
        variant: [...TEXTUAL],
        size: ["lg", "icon"],
        class: "qd-text-action--regular",
      },
      { variant: [...TEXTUAL], size: "icon", class: "qd-control-icon" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
