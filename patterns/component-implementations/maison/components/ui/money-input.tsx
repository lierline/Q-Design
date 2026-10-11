"use client";

import {
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type ChangeEvent,
} from "react";
import { Input } from "./input";

/**
 * 금액 칸: 적는 동안에도 자릿점을 찍는다 (화면 검토 M37 · 2026-09-27).
 *
 * 과제 사업비 칸이 「150000000」 처럼 자릿점 없이 보여, 9자리 금액에서 0 하나를
 * 틀려도 알아챌 수 없었다. 보이는 글자만 「150,000,000」 이고, 부르는 쪽이 주고받는
 * 값(`value` · `onChange`)은 여전히 자릿점 없는 숫자 글자다: 저장 규칙은 그대로.
 *
 * 자릿점이 끼어들면 글자 수가 바뀌어 커서가 끝으로 튄다. 커서 앞의 «숫자 개수» 를
 * 세어 두었다가, 다시 그린 뒤 같은 개수의 숫자 뒤에 커서를 돌려놓는다.
 */
export function MoneyInput({
  value,
  onChange,
  ...rest
}: {
  /** 자릿점 없는 숫자 글자 (빈 글자 = 비움) */
  value: string;
  onChange: (digits: string) => void;
} & Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type">) {
  const ref = useRef<HTMLInputElement>(null);
  /** 다시 그린 뒤 커서를 둘 자리: 커서 앞 숫자 개수 */
  const caretDigits = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const want = caretDigits.current;
    if (!el || want == null) return;
    caretDigits.current = null;
    let pos = 0;
    let seen = 0;
    while (pos < el.value.length && seen < want) {
      if (/\d/.test(el.value[pos] ?? "")) seen += 1;
      pos += 1;
    }
    el.setSelectionRange(pos, pos);
  });

  const handle = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const caret = e.target.selectionStart ?? raw.length;
    caretDigits.current = raw.slice(0, caret).replace(/\D/g, "").length;
    onChange(plainNumber(raw));
  };

  return (
    <Input
      {...rest}
      ref={ref}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={groupDigits(value)}
      onChange={handle}
    />
  );
}

/**
 * 적힌 글자에서 숫자와 소수점 하나만 남긴다: `1,500,000` → `1500000`.
 * 앞자리 0 은 떼되 「0」 하나는 남긴다.
 */
export function plainNumber(raw: string): string {
  let out = "";
  let dot = false;
  for (const ch of raw) {
    if (ch >= "0" && ch <= "9") out += ch;
    else if (ch === "." && !dot) {
      out += ".";
      dot = true;
    }
  }
  return out.replace(/^0+(?=\d)/, "");
}

/** `150000000` → `150,000,000` (소수 부분은 그대로 붙인다) */
export function groupDigits(value: string): string {
  const [int = "", frac] = plainNumber(value).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac === undefined ? grouped : `${grouped}.${frac}`;
}
