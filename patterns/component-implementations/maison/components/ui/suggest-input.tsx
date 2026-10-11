"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

/**
 * 대장 · 조직도에서 «골라 쓰는» 글 칸 (화면 검토 M28 · 2026-09-27).
 *
 * 부서 · 사람 · 업체 · 제품 · 문서 번호를 글자로만 치게 두면 같은 대상이 여러
 * 이름으로 쌓인다(「품질보증부」 · 「품질 보증부」). 그러면 집계와 추적이 끊기고,
 * 문서함에 없는 번호가 기록에 남는다. 이 칸은 입력하는 동안 등록된 값을 제안하고
 * (브라우저 기본 `datalist`), 목록에 없는 값을 적으면 그 사실을 칸 아래에 적는다.
 *
 * 목록에 없는 값을 막지는 않는다: 아직 대장에 없는 새 업체 · 옛 문서처럼 적어야 할
 * 까닭이 있다. 대신 «직접 입력» 임을 적어 보이게 한다.
 */
export function SuggestInput({
  value,
  onChange,
  options,
  unknownNote = "목록에 없는 값입니다. 적은 그대로 저장됩니다 (직접 입력).",
  ...rest
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "list"> & {
  value: string;
  onChange: (value: string) => void;
  /** 제안할 값: 대장 · 조직도에 등록된 이름 · 번호 */
  options: readonly string[];
  /** 목록 밖 값을 적었을 때 칸 아래 한 줄. null 이면 적지 않는다 */
  unknownNote?: string | null;
}) {
  const listId = `${React.useId()}-list`;
  const typed = value.trim();
  const known = typed === "" || options.length === 0 || options.includes(typed);
  return (
    <>
      <Input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        list={listId}
        autoComplete="off"
      />
      <datalist id={listId}>
        {[...new Set(options)].map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
      {!known && unknownNote && (
        <p className="qd-field-hint" role="status">
          {unknownNote}
        </p>
      )}
    </>
  );
}
