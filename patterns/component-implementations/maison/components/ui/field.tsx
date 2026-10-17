"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";

/**
 * 접근 가능한 폼 필드 래퍼.
 *
 * 문제: 이 코드베이스의 <Label> 은 대부분 htmlFor 없이 입력 «옆에» 놓여 있었다.
 * 눈으로는 라벨처럼 보이지만 보조기기에는 «이름 없는 입력»이라, 스크린리더
 * 사용자는 무엇을 넣는 칸인지 알 수 없고 라벨을 눌러도 포커스가 가지 않는다.
 *
 * 해결: Field 가 id 를 한 개 만들어 **라벨과 컨트롤을 자동으로 묶는다.**
 * 안에 들어가는 Input·Select·Textarea 는 컨텍스트에서 id 를 받아 쓰므로
 * 사용처가 id 를 직접 적을 필요가 없다. 적으면 그 값이 우선한다.
 * 도움말·오류 문구도 aria-describedby 로 함께 연결한다.
 */

type FieldCtx = {
  id: string;
  describedBy?: string;
  invalid: boolean;
  required: boolean;
};

const FieldContext = React.createContext<FieldCtx | null>(null);

/** 컨트롤이 자기 이름·설명을 컨텍스트에서 받아 쓰기 위한 훅 */
export function useFieldControl(own: {
  id?: string;
  "aria-describedby"?: string;
}) {
  const ctx = React.useContext(FieldContext);
  if (!ctx) return own;
  return {
    id: own.id ?? ctx.id,
    "aria-describedby": own["aria-describedby"] ?? ctx.describedBy,
    "aria-invalid": ctx.invalid ? true : undefined,
    "aria-required": ctx.required ? true : undefined,
  };
}

export function Field({
  label,
  hint,
  error,
  required = false,
  className,
  children,
}: {
  label: React.ReactNode;
  /** 입력 아래 회색 도움말 */
  hint?: React.ReactNode;
  /** 검증 실패 문구: 있으면 필드가 오류 상태가 된다 */
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const base = React.useId();
  const id = `${base}-control`;
  const hintId = hint ? `${base}-hint` : undefined;
  const errorId = error ? `${base}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  const ctx: FieldCtx = {
    id,
    describedBy,
    invalid: !!error,
    required,
  };

  return (
    <div className={["qd-field", className].filter(Boolean).join(" ")}>
      {/*
        칸 이름표는 정본 `.qd-field-label` 이다(원본 Lbl · 모노 10 · subtle). 칸과의 간격
        7 도 정본이 쥔다. 그래서 이름표는 아래 묶음(칸 · 오류 · 도움말)의 `space-y` 밖에
        둔다: 안에 두면 정본 7 에 묶음 간격 6 이 더해져 13 이 된다.
      */}
      <Label htmlFor={id} variant="field">
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden>
            *
          </span>
        )}
      </Label>
      <div className="qd-field-stack">
        <FieldContext.Provider value={ctx}>{children}</FieldContext.Provider>
        {error && (
          <p id={errorId} role="alert" className="qd-field-error">
            {error}
          </p>
        )}
        {hint && (
          <p id={hintId} className="qd-field-hint">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
