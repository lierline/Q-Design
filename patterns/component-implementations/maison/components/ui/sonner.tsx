"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      style={{ width: "var(--qd-toast-width)" }}
      offset={{
        top: "var(--qd-toast-inset-top)",
        right: "var(--qd-toast-inset-right)",
        bottom: "var(--qd-toast-inset-bottom)",
        left: "var(--qd-toast-inset-left)",
      }}
      mobileOffset={{
        top: "var(--qd-toast-inset-top)",
        right: "var(--qd-toast-inset-right)",
        bottom: "var(--qd-toast-inset-bottom)",
        left: "var(--qd-toast-inset-left)",
      }}
      toastOptions={{
        unstyled: true,
        style: {
          width: "100%",
        },
        classNames: {
          toast: "group toast qd-toast",
          content: "min-w-[var(--qd-space-0)]",
          description: "qd-toast-description",
          // 알림의 할 일 단추도 주 단추라 «글자색 면» 이다(샴페인 면이 아니다)
          actionButton: "qd-btn qd-btn--primary qd-btn--sm",
          cancelButton: "qd-text-action",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
