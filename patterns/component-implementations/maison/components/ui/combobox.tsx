"use client";

import * as React from "react";
import { Check } from "@/components/q-design-icons/Check";
import { ChevronsUpDown } from "@/components/q-design-icons/ChevronsUpDown";
import { Search } from "@/components/q-design-icons/Search";
import { cn } from "@/lib/utils/cn";
import { useFieldControl } from "@/components/ui/field";
import { filterOptions, type SearchableOption } from "@/lib/ui/option-search";

/**
 * 검색되는 선택 칸: 고를 것이 많을 때만 쓴다.
 *
 * 이 앱의 선택 입력은 원칙적으로 **네이티브 `<select>`** 다
 * (`components/ui/select.tsx` 주석 · 현장 태블릿에서 OS 기본 피커가 가장 빠르고
 * 접근성이 검증돼 있다). 다만 그 장점은 «목록이 한 화면에 들어올 때» 의 이야기다.
 * 문서함처럼 수백 건이 되면 네이티브 목록은 굴려서 눈으로 찾는 수밖에 없고,
 * 찾는 문서의 번호를 이미 알고 있어도 그 지식을 쓸 방법이 없다.
 *
 * 그래서 **항목이 많은 칸에서만** 이걸로 바꿔 끼운다. 규칙은 하나:
 * 「치면 걸러지고, 지우면 전체가 돌아온다」(사이드바 메뉴 검색과 같은 규칙).
 * 매칭 규칙 자체는 `lib/ui/option-search.ts` 에 순수 함수로 있고 시험이 지킨다.
 *
 * 값은 `value` · `onChange(value)` 로 주고받는다. 네이티브 select 와 달리
 * 이벤트가 아니라 **고른 값**을 그대로 준다(진짜 `<select>` 가 아닌데 이벤트를
 * 흉내 내면 호출부가 없는 DOM 을 믿게 된다).
 *
 * 키보드: ↓↑ 이동 · Enter 선택 · Esc 닫기 · Home/End 처음·끝.
 * **닫힌 상태의 Enter 는 막지 않는다**: 그대로 폼 제출로 흘러가야 손이 안 멈춘다.
 */
export type ComboboxOption = SearchableOption;

export type ComboboxProps = {
  options: readonly ComboboxOption[];
  /** 고른 값. 아무것도 안 골랐으면 "" */
  value: string;
  onChange: (value: string) => void;
  /**
   * "" 를 고를 수 있게 할 때 첫 줄에 놓을 이름.
   * 없으면 «비움» 이 선택지에 아예 없다(필수 칸).
   */
  emptyLabel?: string;
  /** 아무것도 안 골랐을 때 흐리게 보일 글자 */
  placeholder?: string;
  /** 걸리는 항목이 하나도 없을 때 보일 글자 */
  noResultLabel?: string;
  disabled?: boolean;
  className?: string;
  /** 폼 데이터로도 함께 보내야 할 때 */
  name?: string;
  id?: string;
  "aria-describedby"?: string;
  "aria-label"?: string;
  /**
   * 칸의 얼굴. 기본(`field`)은 폼 입력칸(정본 `.qd-input`)이다.
   *
   * `filter` 는 목록 위 거르개 띠의 고르개(정본 `.qd-filter-select` · 키 36 · 글자 12)다.
   * 같은 줄의 찾기 칸 · 줄 수 고르개와 키와 글자가 같아야 한 줄로 읽힌다. 돋보기 ·
   * 화살표 자리는 정본 찾기 칸과 같은 32 로 둔다. 동작(검색 · 키보드 · 값)은 같다.
   */
  tone?: "field" | "filter";
};

export function Combobox({
  options,
  value,
  onChange,
  emptyLabel,
  placeholder = "이름·번호로 검색",
  noResultLabel = "검색 결과가 없습니다",
  disabled,
  className,
  name,
  id,
  "aria-describedby": describedBy,
  "aria-label": ariaLabel,
  tone = "field",
}: ComboboxProps) {
  const a11y = useFieldControl({ id, "aria-describedby": describedBy });
  const filter = tone === "filter";
  const base = React.useId();
  const listId = `${base}-list`;
  const optionId = (i: number) => `${base}-opt-${i}`;

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  /** 비움 선택지도 평범한 항목으로 취급한다. 검색어에도 똑같이 걸린다 */
  const all = React.useMemo<ComboboxOption[]>(
    () =>
      emptyLabel == null
        ? [...options]
        : [{ value: "", label: emptyLabel }, ...options],
    [options, emptyLabel],
  );

  const selected = all.find((o) => o.value === value);
  const shown = React.useMemo(() => filterOptions(all, query), [all, query]);

  /* 목록이 바뀌면 커서는 맨 위로: 안 그러면 없는 줄을 가리킨 채 Enter 가 눌린다 */
  React.useEffect(() => {
    setActive(0);
  }, [query]);

  /* 바깥을 누르면 닫는다(달력과 같은 규칙) */
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  /* 키보드 커서가 보이는 자리 밖으로 나가면 목록을 따라 굴린다 */
  React.useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [open, active, query]);

  const openList = () => {
    if (disabled) return;
    setQuery("");
    // 지금 고른 것이 첫 화면에 바로 보이도록 커서를 거기 둔다
    setActive(
      Math.max(
        0,
        all.findIndex((o) => o.value === value),
      ),
    );
    setOpen(true);
  };

  const commit = (o: ComboboxOption) => {
    onChange(o.value);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const move = (delta: number) => {
    if (shown.length === 0) return;
    setActive((i) => (i + delta + shown.length) % shown.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (open) move(1);
        else openList();
        break;
      case "ArrowUp":
        e.preventDefault();
        if (open) move(-1);
        else openList();
        break;
      case "Home":
        if (open) {
          e.preventDefault();
          setActive(0);
        }
        break;
      case "End":
        if (open) {
          e.preventDefault();
          setActive(Math.max(0, shown.length - 1));
        }
        break;
      case "Enter": {
        if (!open) break; // 닫혀 있으면 폼 제출: 가로채지 않는다
        e.preventDefault();
        const o = shown[active];
        if (o) commit(o);
        break;
      }
      case "Escape":
        if (open) {
          e.preventDefault();
          setQuery("");
          setOpen(false);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
      onBlur={(e) => {
        // 포커스가 이 칸 밖으로 나가면 닫고, 치던 글자는 버린다
        if (!rootRef.current?.contains(e.relatedTarget as Node)) {
          setQuery("");
          setOpen(false);
        }
      }}
    >
      {name && <input type="hidden" name={name} value={value} />}
      <Search
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          filter ? "left-2.5 h-3.5 w-3.5" : "left-3 h-4 w-4",
        )}
        aria-hidden="true"
      />
      <input
        {...a11y}
        ref={inputRef}
        type="text"
        role="combobox"
        autoComplete="off"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={
          open && shown[active] ? optionId(active) : undefined
        }
        // 닫혀 있으면 «고른 것», 열려 있으면 «치는 중인 검색어»
        value={open ? query : (selected?.label ?? "")}
        placeholder={open ? (selected?.label ?? placeholder) : placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        onMouseDown={() => {
          if (!open) openList();
        }}
        className={cn(
          filter
            ? "qd-filter-select w-full pl-8 pr-[var(--qd-control-height)]"
            : "qd-input pl-9 pr-[var(--qd-control-height)]",
        )}
      />
      <button
        type="button"
        // 이 단추는 입력칸이 이미 하는 일을 손으로 한 번 더 할 수 있게 둔 것뿐이라
        // 탭 차례에는 넣지 않는다. 키보드는 ↓ 로 연다.
        tabIndex={-1}
        disabled={disabled}
        aria-label={open ? "목록 닫기" : "목록 열기"}
        // 입력칸의 커서를 뺏지 않는다
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          inputRef.current?.focus();
          openList();
        }}
        className="qd-control-icon absolute inset-y-0 right-0"
      >
        <ChevronsUpDown
          className={filter ? "h-3.5 w-3.5" : "h-4 w-4"}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="qd-popover absolute left-0 top-full z-[var(--qd-z-tooltip)] mt-1 max-h-72 w-full overflow-auto"
        >
          {shown.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              {noResultLabel}
            </li>
          )}
          {shown.map((o, i) => {
            const isSelected = o.value === value;
            return (
              /* eslint-disable-next-line jsx-a11y/click-events-have-key-events --
                 키보드는 입력칸이 통째로 받는다(↓↑·Enter). 목록 줄에 따로 핸들러를
                 달면 포커스가 두 곳으로 갈라져 aria-activedescendant 가 깨진다. */
              <li
                key={o.value === "" ? "__empty" : o.value}
                id={optionId(i)}
                role="option"
                aria-selected={isSelected}
                data-active={i === active ? "true" : undefined}
                // 누르는 순간 포커스가 빠져 목록이 닫히는 것을 막는다
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => commit(o)}
                className="qd-combobox-option"
              >
                <Check
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0 text-foreground",
                    !isSelected && "invisible",
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className={cn("block", isSelected && "font-medium")}>
                    {o.label}
                  </span>
                  {o.hint && (
                    <span className="qd-field-hint block">{o.hint}</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
