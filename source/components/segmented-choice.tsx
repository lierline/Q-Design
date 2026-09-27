'use client';

// =============================================================================
// lib/design/segmented-choice.tsx: 단일 선택 세그먼트 버튼 묶음 (라디오 의미)
// =============================================================================
// 2026-09-03 감사 ui-ux M-08. 「세그먼트 버튼 그리드(단일선택, 의도적 UI)」가 여덟 화면에
// 각자 <button> 나열로 복붙돼 있었고, 어느 것도 라디오 의미를 내보내지 않았습니다.
// 스크린리더는 «버튼 셋» 으로만 읽고 무엇이 골라졌는지 말하지 않았으며, 키보드는 Tab 으로
// 하나씩 건너야 했습니다. 현장 모드의 ChoiceGroup(app/(app)/m/field-ui.tsx)만 radiogroup 이었습니다.
//
// 여기서 정하는 것은 «의미와 조작» 뿐입니다.
//   · role="radiogroup" + role="radio" + aria-checked
//   · roving tabindex: 골라진 것(없으면 첫 활성 항목)만 Tab 순서에 들어갑니다.
//   · 좌우(상하) 화살표로 이동하면 곧 선택됩니다(WAI-ARIA 라디오 관례). Home/End 지원.
//   · disabled 항목은 건너뜁니다. readOnly 는 이동만 하고 선택을 바꾸지 않습니다.
// 색·크기·배치는 prop 으로 받아 각 화면의 현재 모습을 그대로 유지합니다(fill·color·font·padding·layout).
//
// 현장 모드 ChoiceGroup 은 장갑 손 규격(56px)이 따로 있어 그대로 둡니다.

import { useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { S, FS, F, T, RADIUS, MOTION, alpha } from '@/lib/design/tokens';

export interface SegmentedOption<V extends string> {
  value: V;
  label: ReactNode;
  /** 두 번째 줄(기한·설명 등). */
  sub?: ReactNode;
  disabled?: boolean;
  /** disabled 이유 등 툴팁. */
  title?: string;
  /** 선택 시 색. 미지정이면 묶음의 color. */
  color?: string;
}

export interface SegmentedChoiceProps<V extends string> {
  options: ReadonlyArray<SegmentedOption<V>>;
  value: V | null;
  onChange: (v: V) => void;
  /** 접근성 이름. ariaLabelledBy 와 둘 중 하나는 꼭 줍니다. */
  ariaLabel?: string;
  ariaLabelledBy?: string;
  id?: string;
  /** 확정 기록 등 읽기 전용. 초점 이동은 되지만 선택은 바뀌지 않습니다. */
  readOnly?: boolean;
  /** wrap: 인라인 칩 · grid: auto-fit(minCol) · column: 세로 카드. */
  layout?: 'wrap' | 'grid' | 'column';
  minCol?: number;
  gap?: number;
  /** solid: 색 배경 + 반전 글자 · tint: 옅은 배경 + 색 글자. */
  fill?: 'solid' | 'tint';
  /** 기본 선택 색. 항목별 color 가 우선합니다. */
  color?: string;
  font?: 'serif' | 'mono';
  fontSize?: number;
  fontWeight?: number;
  padding?: string;
  minHeight?: number;
  radius?: number;
  letterSpacing?: string;
  /** 항목 버튼에 덧씌우는 스타일(정렬·폭 등 화면 고유 모양). */
  itemStyle?: CSSProperties;
  style?: CSSProperties;
}

/**
 * `from` 에서 `delta`(±1) 방향으로 감아 돌며 다음 활성 항목의 인덱스를 찾습니다.
 * 활성 항목이 없으면 null. 순수 함수라 테스트가 직접 잽니다.
 */
export function nextEnabledIndex(
  options: ReadonlyArray<{ disabled?: boolean }>,
  from: number,
  delta: 1 | -1,
): number | null {
  const n = options.length;
  if (n === 0) return null;
  for (let step = 1; step <= n; step++) {
    const i = (((from + delta * step) % n) + n) % n;
    if (!options[i].disabled) return i;
  }
  return null;
}

/** Tab 순서에 들어갈 항목: 골라진 활성 항목, 없으면 첫 활성 항목. 전부 비활성이면 null. */
export function rovingIndex<V extends string>(
  options: ReadonlyArray<SegmentedOption<V>>,
  value: V | null,
): number | null {
  const picked = options.findIndex((o) => o.value === value && !o.disabled);
  if (picked >= 0) return picked;
  const first = options.findIndex((o) => !o.disabled);
  return first >= 0 ? first : null;
}

export function SegmentedChoice<V extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  ariaLabelledBy,
  id,
  readOnly = false,
  layout = 'wrap',
  minCol = 140,
  gap = S[2],
  fill = 'solid',
  color = T.champagne,
  font = 'serif',
  fontSize = FS[13],
  fontWeight = 600,
  padding = '10px 16px',
  minHeight,
  radius = RADIUS.md,
  letterSpacing,
  itemStyle,
  style,
}: SegmentedChoiceProps<V>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const tabIdx = rovingIndex(options, value);

  function moveTo(i: number | null) {
    if (i === null) return;
    refs.current[i]?.focus();
    if (!readOnly) onChange(options[i].value);
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        moveTo(nextEnabledIndex(options, i, 1));
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        moveTo(nextEnabledIndex(options, i, -1));
        break;
      case 'Home':
        e.preventDefault();
        moveTo(nextEnabledIndex(options, -1, 1));
        break;
      case 'End':
        e.preventDefault();
        moveTo(nextEnabledIndex(options, options.length, -1));
        break;
      default:
    }
  }

  const containerStyle: CSSProperties =
    layout === 'grid'
      ? { display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${minCol}px, 1fr))`, gap }
      : layout === 'column'
        ? { display: 'flex', flexDirection: 'column', gap }
        : { display: 'flex', flexWrap: 'wrap', gap };

  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-readonly={readOnly || undefined}
      style={{ ...containerStyle, ...style }}
    >
      {options.map((o, i) => {
        const on = value === o.value;
        const c = o.color ?? color;
        const disabled = !!o.disabled;
        const onBg = fill === 'solid' ? c : alpha(c, 0.12);
        const onFg = fill === 'solid' ? T.onAccent : c;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            className="qa-touch-44"
            aria-checked={on}
            aria-disabled={disabled || undefined}
            disabled={disabled}
            tabIndex={tabIdx === i ? 0 : -1}
            title={o.title}
            onClick={() => {
              if (!disabled && !readOnly) onChange(o.value);
            }}
            onKeyDown={(e) => onKeyDown(e, i)}
            style={{
              display: 'inline-flex',
              flexDirection: o.sub ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: o.sub ? 3 : S[1.5],
              padding,
              minHeight,
              fontFamily: font === 'mono' ? F.mono : F.serif,
              fontSize,
              fontWeight,
              letterSpacing,
              background: on ? onBg : 'transparent',
              color: disabled ? T.muted : on ? onFg : T.text,
              border: `1px solid ${on ? c : T.border}`,
              borderRadius: radius,
              opacity: disabled ? 0.6 : 1,
              cursor: disabled ? 'not-allowed' : readOnly ? 'default' : 'pointer',
              transition: `background ${MOTION.fast}, color ${MOTION.fast}, border-color ${MOTION.fast}`,
              ...itemStyle,
            }}
          >
            {o.label}
            {o.sub && (
              <span style={{ fontSize: FS[10], opacity: 0.8, fontFamily: F.mono, fontWeight: 500 }}>{o.sub}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
