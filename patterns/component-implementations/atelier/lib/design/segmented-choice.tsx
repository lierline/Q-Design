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
// 크기·배치는 prop 으로 받아 각 화면의 현재 모습을 그대로 유지합니다(font·padding·layout).
//
// 🔴 2026-09-27 화면 검토 A11 · A38 · A62: «골라진 칸» 이 주 단추와 같은 채운 면(갈색 · 초록 · 파랑)이었다.
//    선택 표시가 단추처럼 보여 «눌러야 하나» 헷갈렸고, 뜻 색(초록 = 정상)과 겹쳐 상태로 읽혔다.
//    이제 골라진 칸은 «짙은 테두리 + 체크» 한 가지다(choiceLook). 채운 면은 주 단추 전용이다.
//    항목 색(color)은 체크 표시에만 남는다. fill 은 옛 호출부 호환으로만 받고 모양을 가르지 않는다.
//
// 현장 모드 ChoiceGroup 은 장갑 손 규격(56px)이 따로 있어 그대로 둡니다.

import { QDPresentation } from '@/lib/design/q-design-runtime';
import { QDScale } from '@/lib/design/q-design-scale';
import { useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { S, FS, F, T, alpha } from '@/lib/design/tokens';
import { QD } from '@/lib/design/q-design-contract';
import { codeOrTextFont } from '@/lib/design/hangul-text';
import { QDRuntime } from '@/lib/design/q-design-runtime';

/**
 * 선택 칸의 모양 한 벌 (화면 검토 A11 · A38 · A62 · 2026-09-27).
 * 골라진 칸: 짙은 테두리(글자색 · 안쪽 그림자로 2px 처럼) + 아주 옅은 바탕. 안 골라진 칸: 보통 테두리.
 * 손으로 짠 선택 칩도 이것을 쓴다. 체크 글자는 CHOICE_CHECK 를 라벨 앞에 둔다.
 */
export function choiceLook(on: boolean): CSSProperties {
  // 모서리는 공용 값(10). 부르는 쪽이 radius 를 따로 주면 그 뒤에 덮는다
  return on
    ? {
        background: alpha(T.text, QDRuntime.alpha.tint0_04),
        color: T.text,
        border: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.text}`,
        borderRadius: QD.radius,
        boxShadow: `inset 0 0 0 var(--qd-border-width) ${T.text}`,
      }
    : {
        background: 'transparent',
        color: T.text,
        border: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${QD.ctl}`,
        borderRadius: QD.radius,
        boxShadow: 'none',
      };
}

/** 골라진 칸의 라벨 앞 체크 표시. 색은 항목의 뜻 색(없으면 글자색) */
export function ChoiceCheck({ on, color }: { on: boolean; color?: string }) {
  if (!on) return null;
  return (
    <span aria-hidden style={{ color: color ?? T.text, fontWeight: "var(--qd-font-weight-bold)", marginRight: QDScale.space[1] }}>
      ✓
    </span>
  );
}

/**
 * 하나씩 누르는 선택 칩 (화면 검토 A11 · A62 · 2026-09-27).
 * `<Btn p={골랐나}>` 로 선택을 그리면 골라진 칸이 주 단추와 같은 채운 면이 된다. 여러 화면이
 * 그렇게 짜여 있어 «눌러야 하나» 헷갈렸다. 라디오 묶음이면 SegmentedChoice, 칩 몇 개를 따로
 * 켜고 끄는 자리(여럿 고르기 포함)면 이것을 쓴다. aria-pressed 로 켜짐을 낭독기에 알린다.
 */
export function ChoiceChip({
  on,
  onClick,
  children,
  disabled,
  color,
  sm = true,
  style,
  title,
  ariaLabel,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  /** 체크 표시 색(뜻 색). 면에는 깔지 않는다 */
  color?: string;
  sm?: boolean;
  style?: CSSProperties;
  title?: string;
  /** 아이콘만 있는 칩의 낭독기 이름(2026-10-07 · 설계 추적 상태 칩이 날것에서 옮겨 오며 필요해졌다) */
  ariaLabel?: string;
}) {
  const look = choiceLook(on);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="qa-touch-44 qd-choice"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: sm ? 'var(--qd-choice-padding-y) var(--qd-choice-padding-x)' : QD.controlPadding,
        minHeight: sm ? QD.controlHeightSm : QD.controlHeight,
        fontFamily: QDScale.family.ui,
        fontSize: QD.controlSize, lineHeight: 'var(--qd-choice-line-height)',
        fontWeight: on ? "var(--qd-font-weight-semibold)" : "var(--qd-font-weight-medium)",
        borderRadius: QD.radius,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? "var(--qd-atelier-opacity-520d3a5350)" : "var(--qd-atelier-opacity-dc43f5a623)",
        transition: `background ${QD.motionFast}, border-color ${QD.motionFast}`,
        ...look,
        ...style,
      }}
    >
      <ChoiceCheck on={on} color={color} />
      {children}
    </button>
  );
}

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
  gap?: number | string;
  /** @deprecated 2026-09-27 부터 모양을 가르지 않는다(골라진 칸은 choiceLook 한 가지). 옛 호출부 호환용 */
  fill?: 'solid' | 'tint';
  /** 체크 표시 색. 항목별 color 가 우선합니다. */
  color?: string;
  font?: 'serif' | 'mono';
  fontSize?: number | string;
  fontWeight?: number;
  padding?: string;
  minHeight?: number | string;
  radius?: number | string;
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
  minCol = QDPresentation.choiceMinColumn[140],
  gap = QDScale.space[2],
  color = T.champagne,
  font = 'serif',
  fontSize = QD.controlSize,
  fontWeight = QDPresentation.choiceFontWeight[600],
  padding = QDPresentation.cssDefaults.choicePadding,
  minHeight = QD.controlHeight,
  radius = QD.radius,
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

  // wrap(기본)은 같은 크기 칸 묶음이다(2026-10-20 오너 «네모칸 크기 통일»). 칸마다 글자 길이대로 폭이 달라
  // 들쭉날쭉했다(165 · 173). 이제 가장 긴 칸에 맞춘 같은 폭 · 같은 높이로 서고, 폰에서는 minCol 기준으로 접힌다.
  // 배치 규칙은 정본 CSS 의 .qd-seg-wrap 한 곳에 있다(미디어 조건은 인라인으로 못 쓴다)
  const containerStyle: CSSProperties =
    layout === 'grid'
      ? { display: 'grid', minWidth: 0, gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minCol}px), 1fr))`, gap }
      : layout === 'column'
        ? { display: 'flex', flexDirection: 'column', gap }
        : ({ gap, '--qd-seg-min': `${minCol}px` } as CSSProperties);

  return (
    <div
      id={id}
      role="radiogroup"
      className={layout === 'wrap' ? 'qd-seg-wrap' : undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-readonly={readOnly || undefined}
      style={{ ...containerStyle, ...style }}
    >
      {options.map((o, i) => {
        const on = value === o.value;
        const c = o.color ?? color;
        const disabled = !!o.disabled;
        const look = choiceLook(on);
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            className="qa-touch-44 qd-choice"
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
              gap: o.sub ? "var(--qd-atelier-gap-04675ee191)" : QDScale.space[1.5],
              padding,
              minHeight,
              fontFamily: font === 'mono' ? QDScale.family.mono : QDScale.family.serif,
              fontSize,
              fontWeight,
              letterSpacing,
              ...look,
              color: disabled ? T.muted : look.color,
              borderRadius: radius,
              // 못 고르는 항목은 옅은 글자색 하나로 말한다. 불투명도(0.6)까지 겹치면 글자가 거의 안 보여
              // 무엇이 잠겼는지 읽을 수 없었다(화면 검토 A84 · 2026-09-27 · 부작용 보고 유형)
              opacity: "var(--qd-atelier-opacity-dc43f5a623)",
              cursor: disabled ? 'not-allowed' : readOnly ? 'default' : 'pointer',
              transition: `background ${QD.motionFast}, color ${QD.motionFast}, border-color ${QD.motionFast}`,
              ...itemStyle,
            }}
          >
            {o.sub ? (
              <span>
                <ChoiceCheck on={on} color={c} />
                {o.label}
              </span>
            ) : (
              <>
                <ChoiceCheck on={on} color={c} />
                {o.label}
              </>
            )}
            {o.sub && (
              // 보조 글이 한글이면 본문 글꼴(화면 검토 A44 · 2026-09-28). 날짜 · 코드만 고정폭
              <span style={{ fontSize: QDScale.font[12], opacity: "var(--qd-atelier-opacity-1cd8a80dee)", ...codeOrTextFont(o.sub), fontWeight: "var(--qd-font-weight-medium)" }}>{o.sub}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
