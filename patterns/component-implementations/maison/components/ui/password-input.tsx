"use client";

import * as React from "react";
import { Eye } from "@/components/q-design-icons/Eye";
import { EyeOff } from "@/components/q-design-icons/EyeOff";
import { cn } from "@/lib/utils/cn";
import { Input } from "@/components/ui/input";

/**
 * 비밀번호 입력칸: 오른쪽 끝에 「보기」 눈 단추가 붙는다.
 *
 * 임시 비밀번호를 받아 옮겨 적는 자리가 많아서(초기 변경·재설정), 오타를 눈으로
 * 확인할 길이 없으면 사용자가 같은 화면을 몇 번씩 되풀이한다.
 *
 * `Input` 을 그대로 감싸므로 `Field` 안에서의 id·aria 연결은 손대지 않는다.
 * 단추는 `type="button"`: 안 그러면 폼이 제출된다.
 */
const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<"input">, "type">
>(({ className, ...props }, ref) => {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        ref={ref}
        type={visible ? "text" : "password"}
        className={cn("pr-[var(--qd-control-height)]", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        // 마우스로 누를 때 입력칸의 포커스·커서 위치를 뺏지 않는다
        onMouseDown={(e) => e.preventDefault()}
        // 탭 순서에서 빼 둔다. 키보드 사용자는 비밀번호를 치고 바로
        // 다음 칸으로 가야 하고, 눈 단추는 그 길에 끼어들 이유가 없다
        tabIndex={-1}
        disabled={props.disabled}
        aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
        aria-pressed={visible}
        title={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
        className="qd-control-icon absolute inset-y-0 right-0"
      >
        {visible ? (
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Eye className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
