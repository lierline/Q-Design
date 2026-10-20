'use client';

import { pageHeadingRules, gridTemplateFor, gridRulesFor, drawerMotionRules, Z } from '@/lib/design/q-design-runtime';
import { labelCase, labelTracking, labelWordSpacing, QDText, QDType } from '@/lib/design/q-design-labels';
import { QDPresentation } from '@/lib/design/q-design-runtime';
import { QDScale } from '@/lib/design/q-design-scale';
import { Children, Fragment, cloneElement, isValidElement, useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, CSSProperties, FocusEvent, KeyboardEvent, MouseEvent, ReactElement, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { AlertCircle } from '@/components/q-design-icons/AlertCircle';
import { AlertTriangle } from '@/components/q-design-icons/AlertTriangle';
import { CheckCircle2 } from '@/components/q-design-icons/CheckCircle2';
import { Circle } from '@/components/q-design-icons/Circle';
import { Info } from '@/components/q-design-icons/Info';
import { TextAction } from '@/components/TextAction';
import { F, FS, LH, MOTION, RADIUS, S, T, TOUCH, alpha } from './tokens';
// ⓘ 여는 방법(올리면 · 눌러야)은 설정 › 표시(이 기기)에서 고른다(2026-10-08 오너 지시). 기본은 «눌러야».
import { useInfoTrigger } from '@/lib/novice-mode';
import { ruleBand, tintBorder } from './grain';
import { QD } from './q-design-contract';
import { useModalFocus } from './modal-focus';
import { TAG_DIMS } from './tag-metrics';
import { riskLabelKo } from '@/lib/labels/risk';
import { printZoom } from './print';
import { BP, QDRuntime } from '@/lib/design/q-design-runtime';

// prefers-reduced-motion 감지 (SSR-safe). JS 기반 애니메이션 (count-up 등) 에서 사용.
// CSS 트랜지션은 globals.css 의 전역 `@media (prefers-reduced-motion: reduce)` 룰로 무력화.
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReduced(mq.matches);
    handler();
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
    mq.addListener(handler);
    return () => mq.removeListener(handler);
  }, []);
  return reduced;
}

// 0 → target 카운트업 (800ms ease-out, requestAnimationFrame 기반).
// enabled=false (reduced motion 또는 string value) 시 즉시 target 반환.
function useCountUp(target: number, durationMs = QDPresentation.motionDefaults.countUp, enabled = true): number {
  const [value, setValue] = useState(enabled ? 0 : target);
  const rafRef = useRef<number | null>(null);
  const fromRef = useRef(0);
  useEffect(() => {
    if (!enabled) {
      setValue(target);
      fromRef.current = target;
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const current = from + (target - from) * eased;
      const rounded = Number.isInteger(target)
        ? Math.round(current)
        : Math.round(current * 10) / 10;
      setValue(rounded);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs, enabled]);
  return value;
}

// ─── LABEL ───────────────────────────────────────────────────────────────────
// htmlFor 로 컨트롤(In/Sel/Txt 의 id)과 연결하면 스크린리더가 포커스 시 라벨을 낭독하고
// 라벨 클릭으로 컨트롤이 포커스된다(WCAG 1.3.1/4.1.2). htmlFor 는 옵셔널이라 기존 호출 호환.
export function Lbl({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="qd-control-label qd-field-label"
      style={{
        fontSize: QD.captionSize,
        color: T.subtle,
        // 2026-09-03 M-02: 한글 라벨이면 자간 0 · uppercase 해제(tokens 의 labelTracking 규칙).
        letterSpacing: labelTracking(children, QDText.tracking.v9f29a13043),
        wordSpacing: labelWordSpacing(children),
        textTransform: labelCase(children),
        fontFamily: QDScale.family.mono,
        display: 'block',
        marginBottom: "var(--qd-field-gap)",
        fontWeight: "var(--qd-font-weight-medium)",
      }}
    >
      {children}
    </label>
  );
}

// ─── INPUT ───────────────────────────────────────────────────────────────────
const inputStyle: CSSProperties = {
  borderRadius: QD.radius,
  width: "var(--qd-atelier-width-b7aa1ec004)",
  padding: `${QD.space2} ${QD.space3}`,
  minHeight: QD.controlHeight,
  border: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${QD.ctl}`,
  fontSize: QD.controlSize,
  fontFamily: QDScale.family.ui,
};

interface InProps {
  value: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  ro?: boolean;
  type?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  autoFocus?: boolean;
  name?: string;
  id?: string;
  invalid?: boolean;
  /** 보이는 칸 이름(label)이 없을 때의 화면 낭독 이름 */
  ariaLabel?: string;
  // 2026-10-07 날것 <input> 34곳을 이 부품으로 걷으며 더한 것(손으로 테두리를 그리던 칸들이 쓰던 속성)
  disabled?: boolean;
  maxLength?: number;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  inputMode?: 'text' | 'numeric' | 'decimal' | 'search' | 'email' | 'tel' | 'url' | 'none';
  /** <datalist id> 연결 */
  list?: string;
  title?: string;
  /** 배치만(flex · width · maxWidth). 색 · 테두리 · 글꼴은 여기서 바꾸지 않는다 */
  style?: CSSProperties;
  /** 오류 · 도움말 글귀의 id. 보통 Field 가 끼워 넣는다(2026-10-08) · 직접 줄 수도 있다 */
  'aria-describedby'?: string;
}
export function In({
  value,
  onChange,
  onBlur,
  onFocus,
  ro,
  type = 'text',
  placeholder,
  required,
  minLength,
  autoComplete,
  autoFocus,
  name,
  id,
  invalid,
  ariaLabel,
  disabled,
  maxLength,
  onKeyDown,
  inputMode,
  list,
  title,
  style,
  'aria-describedby': ariaDescribedBy,
}: InProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      readOnly={ro}
      disabled={disabled}
      required={required}
      minLength={minLength}
      maxLength={maxLength}
      inputMode={inputMode}
      list={list}
      title={title}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      name={name}
      id={id}
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      aria-describedby={ariaDescribedBy}
      className="qa-input qd-input"
      style={{
        ...inputStyle,
        ...(ro && !disabled ? { color: QD.muted, cursor: 'default' } : {}),
        ...(invalid ? { borderColor: T.red } : {}),
        ...style,
      }}
    />
  );
}

// ─── SELECT ──────────────────────────────────────────────────────────────────
export interface SelOpt {
  v: string;
  l: string;
}
interface SelProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  opts: Array<SelOpt | string>;
  ro?: boolean;
  disabled?: boolean;
  // F-04: Field(htmlFor=id) 와 라벨 연결을 위해 id 를 DOM 으로 전달(In 과 동일 계약).
  id?: string;
  name?: string;
  required?: boolean;
  invalid?: boolean;
  /** 오류 · 도움말 글귀의 id. 보통 Field 가 끼워 넣는다(In 과 같은 계약) */
  'aria-describedby'?: string;
}
export function Sel({ value, onChange, opts, ro, disabled, id, name, required, invalid, 'aria-describedby': ariaDescribedBy }: SelProps) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={ro || disabled}
      id={id}
      name={name}
      required={required}
      aria-invalid={invalid || undefined}
      aria-describedby={ariaDescribedBy}
      className="qa-input qd-input"
      style={inputStyle}
    >
      {opts.map((o) => {
        const v = typeof o === 'string' ? o : o.v;
        const l = typeof o === 'string' ? o : o.l;
        return (
          <option key={v} value={v}>
            {l}
          </option>
        );
      })}
    </select>
  );
}

// ─── TEXTAREA ────────────────────────────────────────────────────────────────
interface TxtProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  ro?: boolean;
  disabled?: boolean;
  placeholder?: string;
  // F-04: Field(htmlFor=id) 와 라벨 연결을 위해 id 를 DOM 으로 전달(In 과 동일 계약).
  id?: string;
  name?: string;
  required?: boolean;
  invalid?: boolean;
  /** 오류 · 도움말 글귀의 id. 보통 Field 가 끼워 넣는다(In 과 같은 계약) */
  'aria-describedby'?: string;
}
export function Txt({ value, onChange, rows = QDPresentation.commonDefaults.textareaRows, ro, disabled, placeholder, id, name, required, invalid, 'aria-describedby': ariaDescribedBy }: TxtProps) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      readOnly={ro}
      disabled={disabled}
      id={id}
      name={name}
      required={required}
      aria-invalid={invalid || undefined}
      aria-describedby={ariaDescribedBy}
      className="qa-input qd-input"
      style={{ ...inputStyle, resize: 'vertical', ...(ro && !disabled ? { color: QD.muted } : {}) }}
    />
  );
}

// ─── BUTTON ──────────────────────────────────────────────────────────────────
interface BtnProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  p?: boolean;
  sm?: boolean;
  disabled?: boolean;
  /** 위험/삭제 액션: 빨강 톤. p=true 면 채움(빨강), p=false 면 외곽선(빨강). */
  danger?: boolean;
  style?: CSSProperties;
  /** 호버 툴팁 (disabled 사유 안내 등). */
  title?: string;
  // 2026-10-07 날것 <button> 99곳을 이 부품으로 걷으며 더한 것
  /** 낭독기가 읽을 이름(보이는 글귀만으로 대상을 알 수 없을 때 · 「서명 내려받기」) */
  ariaLabel?: string;
  /** 접고 펴는 단추면 지금 펼쳐져 있는가 */
  ariaExpanded?: boolean;
  id?: string;
  /**
   * 처리 중(서버를 기다리는 저장 · 제출). disabled + aria-busy + 회전 표시가 함께 켜진다 (2026-10-08).
   * 글자는 지우지 않고 visibility 로 자리만 남겨 폭이 흔들리지 않는다. 종전에는 화면마다
   * `disabled={saving}` 을 손으로 걸었고(474곳 중 236곳), 안 건 곳은 두 번 누르면 두 번 저장됐다.
   */
  pending?: boolean;
}
// 화면에서는 안 보이고 낭독기만 읽는 글귀(WCAG 시각 숨김 관용구)
const SR_ONLY: CSSProperties = {
  position: 'absolute',
  width: "var(--qd-atelier-width-7f153c20f1)",
  height: "var(--qd-atelier-height-2264278404)",
  padding: "var(--qd-space-0)",
  margin: "var(--qd-atelier-margin-bb3ec884dd)",
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: "var(--qd-atelier-border-b5ff2739b2)",
};

export function Btn({
  children,
  onClick,
  type = 'button',
  p = true,
  sm,
  disabled,
  danger,
  style,
  title,
  ariaLabel,
  ariaExpanded,
  id,
  pending,
}: BtnProps) {
  // 터치 타겟: `sm` 은 보조 액션용으로 36px 유지, 기본은 44px (WCAG 2.2).
  // 터치 디바이스에서 sm 도 44px 로 끌어올리는 룰은 globals.css 에 있음.
  const minHeight = sm ? QD.controlHeightSm : QD.controlHeight;
  const inert = Boolean(disabled || pending);

  // ★ 완성도: primary(filled) 와 secondary(outline) 버튼 사이즈 통일:
  //   - primary 는 border:none, secondary 는 border:1px solid 라서 box-sizing
  //     content-box 일 때 outline 이 2px 더 큼. border-box 로 묶고, primary
  //     에도 1px 투명 border 를 둬 padding box 가 항상 동일.
  //   - inline-flex + alignItems: center: 여러 줄/아이콘 children 도 정확히 정렬.
  //   - 긴 문구의 줄바꿈과 줄 높이는 공통 qd-btn 규칙을 따른다.
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={inert}
      aria-busy={pending || undefined}
      title={title}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      id={id}
      className={p ? 'qa-btn qd-btn' : 'qa-btn-secondary qd-btn qd-btn--secondary'}
      data-size={sm ? 'sm' : 'md'}
      style={{
        boxSizing: 'border-box',
        position: pending ? 'relative' : undefined,
        borderRadius: QD.radius,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: QDScale.space[1.5],
        padding: sm ? QD.controlPaddingSm : QD.controlPadding,
        minHeight,
        // 2026-08-21: raw 0.5(10.5/11.5)였다. **공용 버튼**이라 화면 어디서나 나타나는데,
        // 주변 텍스트는 FS 정수 토큰을 쓰니 버튼만 0.5 어긋난 크기로 떠 있었다.
        // 「글씨 크기가 들쑥날쑥」의 큰 몫이 여기였다. raw 라서 토큰 치환도 닿지 않았다.
        fontSize: QD.controlSize,
        // 2026-09-03 M-02: 한글 버튼 문구는 자간 0 · uppercase 해제. minWidth 는 호출부 불변.
        letterSpacing: labelTracking(children, QDText.tracking.v77ac319bfe),
        textTransform: labelCase(children),
        cursor: pending ? 'progress' : disabled ? 'not-allowed' : 'pointer',
        // border 는 항상 1px: primary 는 transparent (시각 효과 없음, 사이즈만 통일)
        // danger=빨강 톤(채움/외곽선), 그 외 기본(cream 채움/중립 외곽선)
        border: danger
          ? `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.red}`
          : p
            ? "var(--qd-atelier-border-6b5ff9d123)"
            : `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${QD.ctl}`,
        background: danger ? (p ? T.red : 'transparent') : p ? QD.text : 'transparent',
        color: danger ? (p ? QD.bg : T.red) : p ? QD.bg : QD.subtle,
        // pending 은 «바쁨» 이지 «못 누름» 이 아니다: 흐리게 하지 않는다
        opacity: disabled ? "var(--qd-atelier-opacity-86c88eaa9e)" : "var(--qd-atelier-opacity-dc43f5a623)",
        fontFamily: QDScale.family.ui,
        fontWeight: "var(--qd-font-weight-medium)",
        ...style,
      }}
    >
      {pending ? (
        <>
          {/* 글자는 자리만 남긴다(폭 보존). visibility:hidden 은 접근성 트리에서도 빠지므로
              낭독기용 이름은 아래 숨은 글귀가 잇는다(aria-busy 와 함께) */}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: QDScale.space[1.5], visibility: 'hidden' }}>{children}</span>
          <span style={SR_ONLY}>처리 중</span>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: "var(--qd-atelier-inset-4199adc115)",
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                width: "var(--qd-atelier-width-732e621989)",
                height: "var(--qd-atelier-height-95e4053dfa)",
                borderRadius: QDScale.radiusFull,
                border: "var(--qd-atelier-border-5614885022)",
                borderRightColor: 'transparent',
                // 동작 줄이기 설정은 globals.css 의 전역 규칙이 멈춘다
                animation: "var(--qd-atelier-animation-f980f830ce)",
              }}
            />
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

// ─── ICON BUTTON ─────────────────────────────────────────────────────────────
// 44×44 (WCAG 2.2 / iOS HIG) 정사각 아이콘 버튼. Sidebar 등에서 토글/액션용.
interface IconBtnProps {
  children: ReactNode;
  onClick?: () => void;
  title: string;
  disabled?: boolean;
  size?: number; // 기본 44
  style?: CSSProperties;
  // 2026-10-07 화면마다 따로 짠 아이콘 정사각(종 · 구독 칩 · 로그아웃 · 첨부 · 위젯 순서)을 이 부품으로 걷으며 더한 것
  /** 터치 화면 이름표(qa-touch-44sq 등). 보이는 틀은 size 그대로, 누르는 자리만 44 로 넓힌다 */
  className?: string;
  /** 낭독기가 읽을 이름이 title 과 다를 때(「알림 (3개 새 알림)」) */
  ariaLabel?: string;
  ariaExpanded?: boolean;
  ariaHasPopup?: 'menu' | 'dialog';
  /** 되돌릴 수 없는 동작(로그아웃): 올리면 빨강 */
  danger?: boolean;
}
export function IconBtn({
  children,
  onClick,
  title,
  disabled,
  size = TOUCH.min,
  style,
  className,
  ariaLabel,
  ariaExpanded,
  ariaHasPopup,
  danger,
}: IconBtnProps) {
  // 호출부가 색이나 테두리 색을 정했으면(구독 칩의 신호등 테두리 · 종의 흐린 글자) 올렸다 내릴 때 그 값으로 돌아간다.
  // 테두리 색이 뜻을 들고 있으면 올려도 바꾸지 않는다(신호등이 잠깐 사라지면 안 된다).
  const baseColor = (style?.color as string | undefined) ?? T.muted;
  const ownBorder = style?.borderColor as string | undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel ?? title}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup}
      disabled={disabled}
      className={`qd-control-icon ${className ?? ''}`}
      data-size={size < TOUCH.min ? 'sm' : 'md'}
      style={{
        width: size === TOUCH.min ? QD.controlHeight : size,
        height: size === TOUCH.min ? QD.controlHeight : size,
        flexShrink: 0,
        background: 'transparent',
        border: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${QD.ctl}`,
        borderRadius: QD.radius,
        color: T.muted,
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: "var(--qd-space-0)",
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? "var(--qd-atelier-opacity-86c88eaa9e)" : "var(--qd-atelier-opacity-dc43f5a623)",
        transition: `color ${QD.motionFast}, border-color ${QD.motionFast}`,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.color = danger ? T.red : T.text;
        if (!ownBorder) e.currentTarget.style.borderColor = danger ? T.red : T.muted;
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.color = baseColor;
        if (!ownBorder) e.currentTarget.style.borderColor = QD.ctl;
      }}
    >
      {children}
    </button>
  );
}

// ─── BOX ─────────────────────────────────────────────────────────────────────
// accent: 상태 색(champagne/green/warning/red/blue/muted). 2026-09-27 부터 **테두리 전체를 옅은 상태 색**으로 칠한다.
//   종전엔 왼쪽 3px 색 띠였다. 오너 결정 «문서 결»(Q-Design docs/24): 「클로드 특유의 디자인 형태라서 다른 형태를」.
//   상태의 뜻은 상자 안의 글자가 말하고, 테두리 색은 거들기만 한다.
// boxSizing 'border-box': 테두리가 outer 사이즈에 영향 안 주도록.
type AccentColor = 'champagne' | 'green' | 'warning' | 'red' | 'blue' | 'muted';
const ACCENT_MAP: Record<AccentColor, string> = {
  champagne: T.champagne,
  green: T.green,
  warning: T.warning,
  red: T.red,
  blue: T.blue,
  muted: T.muted,
};

export function Bx({
  children,
  style,
  accent,
  lift = false,
  className,
  onClick,
  role,
  tabIndex,
  onKeyDown,
  ariaLabel,
}: {
  children: ReactNode;
  style?: CSSProperties;
  accent?: AccentColor;
  /** hover 시 살짝 떠오르는 효과 + champagne shadow (qa-card-lift 클래스) */
  lift?: boolean;
  className?: string;
  /** 카드 전체를 클릭 가능하게: role='button'·tabIndex={0}·onKeyDown 과 함께 접근성 확보.
   *  이벤트 인자 제공 → 호출부가 내부 인터랙티브 자식(Link 등) 버블을 e.target 으로 구분 가능
   *  (기존 `() => void` 호출부는 하위호환). */
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  role?: string;
  tabIndex?: number;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  ariaLabel?: string;
}) {
  const accentColor = accent ? ACCENT_MAP[accent] : null;
  const klass = [lift ? 'qa-card-lift' : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  return (
    <div
      className={klass || undefined}
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
      style={{
        boxSizing: 'border-box',
        background: T.surface,
        border: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}`,
        // 🔴 2026-08-26: 이 카드가 **전문가 포털 안에서도** 10px 둥근 모서리로 떴다.
        //    포털은 각진 모서리(`--radius: 0`)가 브랜드인데, 공용 카드 하나가
        //    다른 디자인 언어를 들고 들어와 「카드 안의 다른 카드」로 보였다.
        //    실측: 포털 화면에서 둥근 요소가 정확히 5개였고 전부 내부 앱 공용 부품이었다.
        // 🔑 사본을 만들지 않는다. 값을 두 벌로 두는 대신 **주변 맥락을 읽을 수 있게** 한다.
        //    폴백이 RADIUS.md 라 내부 앱은 한 픽셀도 바뀌지 않고,
        //    포털만 `.expert-portal-root { --qa-radius-card: 0 }` 로 자기 언어를 말한다.
        borderRadius: `var(--qd-radius, var(--qa-radius-card, ${QDScale.radius}))`, // 럭셔리 표준: 카드 10px 라운드
        ...(accentColor ? { borderColor: tintBorder(accentColor) } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── DIVIDER ─────────────────────────────────────────────────────────────────
export function Div() {
  return <div style={{ borderTop: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}`, margin: "var(--qd-atelier-margin-8e48ce1c18)" }} />;
}

// ─── COLLAPSE ────────────────────────────────────────────────────────────────
// 럭셔리 펼침/접힘 트랜지션: 팍팍 열리는 싸구려 반응 제거.
//
// 기법:
//   1) outer wrapper: display:grid + grid-template-rows: 0fr → 1fr
//      → auto-height 컨테이너의 너무 어려운 height transition 을 우회.
//        (CSS-only 로 부드러운 height 변경, JS measure 불필요.)
//   2) inner wrapper: min-height:0 + overflow:hidden
//      → grid row 크기에 맞춰 자식이 잘리며 펼쳐짐.
//   3) content: opacity + translateY(-4px → 0) 페이드인.
//      → 럭셔리 마감 (열릴 때 약간 위에서 내려옴).
//
// 타이밍:
//   - open: 320ms cubic-bezier(0.22, 1, 0.36, 1)  ← "ease-out expo"
//   - close: 220ms ease (살짝 빨라도 무방, 닫힐 때는 자연스러움)
//   - reduce-motion: 즉시 (전역 @media 룰에서 0ms override)
//
// 사용:
//   <Collapse open={isOpen}>
//     <Form … />
//   </Collapse>
//
// 주의:
//   - aria-hidden 속성은 호출 측에서 제어 (보통 trigger 의 aria-expanded 와 짝).
//   - 닫혀있어도 DOM 은 유지 (form state 보존). 완전 unmount 가 필요하면
//     `mountWhenClosed={false}` 로 첫 open 시점부터 mount, close 후 unmount.
export function Collapse({
  open,
  children,
  durationMs,
  mountWhenClosed = true,
  style,
}: {
  open: boolean;
  children: ReactNode;
  durationMs?: number;
  mountWhenClosed?: boolean;
  style?: CSSProperties;
}) {
  const reduced = usePrefersReducedMotion();
  // 닫혀있고 mountWhenClosed=false 면 한 번이라도 열린 적 있을 때만 mount.
  const [hasOpened, setHasOpened] = useState(open);
  useEffect(() => {
    if (open) setHasOpened(true);
  }, [open]);

  // 사용자 피드백: "조금 더 부드럽고 느리게": 320/220 → 520/380.
  // open 은 살짝 더 길게 (~0.5s) 해서 럭셔리 느낌, close 는 답답하지 않게 적당히.
  const dur = reduced ? 0 : (durationMs ?? (open ? QDPresentation.motionDefaults.foldOpen : QDPresentation.motionDefaults.foldClose));
  const easing = open
    ? 'var(--qd-atelier-collapse-open-easing)' // ease-out expo (열릴 때 살짝 가속 → 부드럽게 감속)
    : 'var(--qd-atelier-collapse-close-easing)'; // standard ease (닫힐 때)

  if (!mountWhenClosed && !hasOpened) return null;

  return (
    <div
      aria-hidden={!open}
      // aria-hidden 만으로는 닫힌 안쪽의 단추 · 링크가 tab 으로 계속 잡힌다(낭독기에는 안 보이는데 초점만 들어가는 상태).
      // inert 는 초점 · 클릭 · 낭독을 한꺼번에 끈다. 닫는 애니메이션 중에도 바로 꺼진다.
      inert={!open}
      style={{
        display: 'grid',
        gridTemplateRows: open ? "var(--qd-atelier-grid-template-rows-11f1d87b5a)" : "var(--qd-atelier-grid-template-rows-83f858e009)",
        transition: `grid-template-rows ${dur}ms ${easing}`,
        ...style,
      }}
    >
      <div style={{ minHeight: "var(--qd-atelier-min-height-558c2060a3)", overflow: 'hidden' }}>
        <div
          style={{
            opacity: open ? "var(--qd-atelier-opacity-dc43f5a623)" : "var(--qd-atelier-opacity-b53823ac50)",
            transform: open ? 'translateY(0)' : 'var(--qd-atelier-collapse-hidden-transform)',
            transition: `opacity ${dur}ms ${easing}, transform ${dur}ms ${easing}`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── TAG ─────────────────────────────────────────────────────────────────────
// champagne color 인 경우 → 럭셔리 마감: hairline border (alpha 0.6) + 옅은 배경 (alpha 0.06).
// 그 외 색 (red/green/warning/blue/muted) 은 기존 톤 유지.
//
// Batch D: fontSize 9 → 11 (옛 9 는 WCAG 권장 최소 가독성 미만 + 한글 자소 식별 어려움).
// letter-spacing 1.5 → 1.0 (11px 톤에 맞게 살짝 좁힘). padding 도 한 단계 키움.
export function Tag({
  children,
  color,
  tier = 'secondary',
  dot,
  size = 'sm',
}: {
  children: ReactNode;
  color?: string;
  /**
   * 시각 우선순위:
   *  - primary    = fill (이번 row 의 핵심 상태)
   *  - secondary  = hairline (일반 metadata): 기본
   *  - tertiary   = ghost (보조 정보, 색 비중 X)
   */
  tier?: 'primary' | 'secondary' | 'tertiary';
  /** 좌측 ● dot prefix: 상태가 한 눈에 들어와야 할 때 (변경평가/문서 status) */
  dot?: boolean;
  /**
   * xs=18px (조밀한 list), sm=22px (기본), md=**26.1px** (강조).
   * md 만 소수점인 이유: minHeight 26 을 콘텐츠(11.5×LH.snug + padding + border)가
   * 0.1px 이겨 lineHeight 가 높이를 정한다. 규격·계산은 lib/design/tag-metrics.ts.
   */
  size?: 'xs' | 'sm' | 'md';
}) {
  const c = color || T.muted;
  const isChampagne = color === T.champagne;
  // Champagne primary 호환: 기존 호출 (color=T.champagne 만 전달) 은 자동으로 primary 톤
  const effTier = isChampagne && tier === 'secondary' ? 'primary' : tier;

  // 규격·높이 계산은 lib/design/tag-metrics.ts 가 SSOT: 거기 테스트가 「무엇이 높이를
  // 결정하는가」를 잠근다. md 는 minHeight 가 아니라 lineHeight 가 높이를 정한다.
  const dims = TAG_DIMS[size];
  const tagLength = (name: string, fallback: number) => `var(--qd-tag-${size}-${name}, ${fallback}px)`;

  const bg =
    effTier === 'primary' ? alpha(c, QDRuntime.alpha.tint0_1)
    : effTier === 'tertiary' ? 'transparent'
    : 'transparent';
  const border =
    effTier === 'primary' ? `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${alpha(c, QDRuntime.alpha.tint0_55)}`
    : effTier === 'tertiary' ? `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${alpha(c, QDRuntime.alpha.tint0_18)}`
    : `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${alpha(c, QDRuntime.alpha.tint0_33)}`;
  const tagColor = effTier === 'tertiary' ? T.muted : c;

  return (
    <span
      className="qd-tag"
      style={{
        boxSizing: 'border-box',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: tagLength('gap', dims.gap),
        minHeight: tagLength('min-height', dims.minH),
        fontSize: tagLength('size', dims.fs),
        // ⚠️ md 에서는 이 값이 minHeight 를 이겨 «높이를 결정»한다(11.5×1.4+8+2 = 26.1 > 26).
        //    LH.snug 는 QDType.mono.lineHeight 와 같은 키라, 건드리면 mono 라벨 전체와
        //    97파일이 쓰는 md 배지가 동시에 움직인다. tag-metrics.test.ts 가 이 관계를 잠근다.
        lineHeight: QDScale.leading.snug,
        color: tagColor,
        border,
        // 2026-09-14 모서리 전수 감사: 배지가 각져 있었다(정본 .qd-tag 는 6px · Q-Sonar·Q-Forge 는 이미 6px).
        borderRadius: QD.radius,
        background: bg,
        padding: `${tagLength('padding-y', dims.padY)} ${tagLength('padding-x', dims.padX)}`,
        fontFamily: QDScale.family.mono,
        // 2026-09-03 M-02: 한글 배지는 자간 0. 높이 사슬(tag-metrics.test.ts)은 자간과 무관.
        letterSpacing: labelTracking(children, QDText.tracking.v6b86b273ff),
        wordSpacing: labelWordSpacing(children),
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
      }}
    >
      {dot && (
        <span
          aria-hidden
          style={{
            width: tagLength('dot-size', dims.dotSize),
            height: tagLength('dot-size', dims.dotSize),
            borderRadius: "var(--qd-atelier-border-radius-f44e751c2d)",
            background: c,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}

// ─── PROGRESSBAR: 진행률 바 (track + fill). 완료율·체크리스트 공용 프리미티브 ────────
// 5개 시장 상세(fda/eu-mdr/nmpa/pmda)에 복붙돼 있던 진행바를 단일 프리미티브로 통합(디자인 3단계).
// value 0~100. 색 미지정 시 100%=green(완료) / else champagne(진행) 자동.
// 채움 transition 은 globals.css 전역 prefers-reduced-motion 룰로 자동 무력화(접근성).
export function ProgressBar({
  value,
  color,
  height,
  trackColor,
  ariaLabel = '진행률',
}: {
  value: number;
  /** 미지정 시 100%=T.green / else T.champagne 자동 */
  color?: string;
  /** bar 높이(px). 기본 6 */
  height?: number;
  trackColor?: string;
  ariaLabel?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const fill = color ?? (pct === 100 ? T.green : T.champagne);
  return (
    <div className="qd-progress" role="progressbar" aria-label={ariaLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} style={{ height: height ?? 'var(--qd-progress-height, 6px)', background: trackColor ?? alpha(T.border, QDRuntime.alpha.tint0_6), borderRadius: QD.radius, overflow: 'hidden' }}>
      <div className="qd-progress-fill" style={{ width: `${pct}%`, height: "var(--qd-atelier-height-26ecbf76a0)", background: fill, transition: `width ${QD.motionNormal}` }} />
    </div>
  );
}

// ─── SECTIONPROGRESSCARD: 라벨 + % + ProgressBar 카드 (시장 상세 섹션 완료율 공용) ──
// label 은 시장별로 다름("섹션/기술문서/STED/申报资料 완료율 …"). value 0~100.
export function SectionProgressCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const fill = value === 100 ? T.green : T.champagne;
  return (
    <div style={{ marginBottom: QDScale.space[6], padding: QDScale.space[4.5], borderRadius: QD.radius, border: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}`, background: alpha(T.champagne, QDRuntime.alpha.tint0_02) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: QDScale.space[2] }}>
        <span style={{ fontFamily: QDScale.family.mono, fontSize: QDScale.font[12], letterSpacing: labelTracking(label, QDText.tracking.v7c1681a74c), wordSpacing: labelWordSpacing(label), color: T.subtle, textTransform: labelCase(label) }}>{label}</span>
        <span style={{ fontFamily: QDScale.family.serif, fontSize: QDScale.font[20], fontWeight: "var(--qd-font-weight-bold)", color: fill }}>{value}%</span>
      </div>
      <ProgressBar value={value} />
    </div>
  );
}

// ─── SWITCH: on/off 토글 스위치 (트랙 + knob). 설정·옵션 공용 프리미티브 ──────────
// 설정 화면 스위치 복붙(role=switch·52x28·champagne)을 단일 컴포넌트로 통합(디자인 3단계).
// 시각 = 기존 복붙 스펙 100% 보존(md 52x28 knob 22). slide transition 은 globals.css
// 전역 prefers-reduced-motion 으로 자동 무력화(접근성).
export function Switch({
  checked,
  onChange,
  disabled,
  size = 'md',
  color = T.champagne,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** md=52x28(기본·설정 카드) / sm=40x22(조밀) */
  size?: 'sm' | 'md';
  color?: string;
  ariaLabel?: string;
}) {
  const dims = QDRuntime.switch[size];
  const onLeft = dims.w - dims.knob - QDRuntime.switch.inset;
  return (
    <button
      type="button"
      role="switch"
      className="qd-switch qa-touch-hit"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => { if (!disabled) onChange(!checked); }}
      disabled={disabled}
      style={{
        position: 'relative', width: dims.w, height: dims.h, flexShrink: 0, borderRadius: QD.radius,
        cursor: disabled ? 'default' : 'pointer',
        background: checked ? color : T.border,
        // 꺼진 상태 윤곽: 트랙 색(--qa-border)만으로는 면과 1.2:1 이라 보이지 않았다(조작 윤곽 3:1)
        boxShadow: checked ? 'none' : `inset 0 0 0 var(--qd-border-width) ${QD.ctl}`,
        border: 'none', transition: `background ${QD.motionFast}, box-shadow ${QD.motionFast}`, opacity: disabled ? "var(--qd-atelier-opacity-520d3a5350)" : "var(--qd-atelier-opacity-dc43f5a623)",
      }}
    >
      <span style={{ position: 'absolute', top: QDRuntime.switch.inset, left: checked ? onLeft : QDRuntime.switch.inset, width: dims.knob, height: dims.knob, borderRadius: QD.radius, background: checked ? T.bg : T.surface, transition: `left ${QD.motionFast}` }} />
    </button>
  );
}

// ─── CHECKBOX: accentColor 통일 체크박스 (plain/card/consent 변형) ────────────────
// raw <input type=checkbox> 가 accentColor 혼재(미지정 시 브라우저 기본 파랑 노출)·크기
// 제각각(11/13/18)이던 것을 통합(디자인 3단계). accent 는 의미별로 prop(동의/일반=champagne,
// 검토 OK=green, MDR 위험=red) 유지. card=checked 시 컨테이너 강조, consent=상단정렬(전자서명).
export function Checkbox({
  checked,
  onChange,
  disabled,
  children,
  accent = T.champagne,
  variant = 'plain',
  align = 'center',
  size,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  children: ReactNode;
  /** 예: «qa-touch-44»(터치 화면에서 줄 높이 44 · 체크 목록이 칩을 대신할 때 · 화면 검토 A35) */
  className?: string;
  /** 의미별 색(기본 champagne). 미지정 raw 파랑 제거 */
  accent?: string;
  /** plain=인라인 / card=checked 컨테이너 강조 / consent=상단정렬(긴 동의문) */
  variant?: 'plain' | 'card' | 'consent';
  align?: 'center' | 'start';
  /** 체크박스 px(기본 16) */
  size?: number;
}) {
  const startAlign = align === 'start' || variant === 'consent';
  return (
    <label
      className={`qd-choice-hit ${className ?? ''}`}
      style={{
        display: 'flex',
        minHeight: QD.controlHeight,
        alignItems: startAlign ? 'flex-start' : 'center',
        gap: QDScale.space[2.5],
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? "var(--qd-atelier-opacity-fab5edc654)" : "var(--qd-atelier-opacity-dc43f5a623)",
        ...(variant === 'card'
          ? {
              padding: "var(--qd-atelier-padding-071d0f3c74)",
              borderRadius: QD.radius,
              border: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${checked ? alpha(accent, QDRuntime.alpha.tint0_55) : T.border}`,
              background: checked ? alpha(accent, QDRuntime.alpha.tint0_06) : 'transparent',
              transition: "var(--qd-atelier-transition-ccf3ab5062)",
            }
          : {}),
      }}
    >
      <input
        type="checkbox"
        className="qd-checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: size ?? QDPresentation.cssDefaults.checkboxGlyph, height: size ?? QDPresentation.cssDefaults.checkboxGlyph, accentColor: accent, cursor: disabled ? 'default' : 'pointer', flexShrink: 0, ...(startAlign ? { marginTop: QDScale.space[0.5] } : {}) }}
      />
      <span style={{ fontSize: QD.controlSize, color: T.text, lineHeight: QDScale.leading.notice }}>{children}</span>
    </label>
  );
}

// ─── FILTERCHIP: 걸러보기 한 칸 (목록 위 상태 걸러보기 공용) ────────────────────
// 🔑 화면 검토 A35 · A66(2026-09-28): 칩마다 테두리 색이 달라(승인 초록 · 반려 빨강 …) «누르는 것 · 표시만 하는 것 ·
//    고른 것» 이 구분되지 않았다. 이제 탭 줄(PageTabs)과 같은 모양: 테두리 · 채움 없이 글자만, 고른 칸은 진한 글자 +
//    금색 밑줄. 줄 전체의 아래 테두리는 부르는 쪽이 둔다(FILTER_TAB_ROW). 색은 받지만 모양에 쓰지 않는다.
export const FILTER_TAB_ROW: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  borderBottom: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}`,
};

export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  /** 예전 칩의 상태 색. 🔑 모양에 쓰지 않는다(화면 검토 A35 · 색이 저마다 달라 신호가 되지 못했다) */
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      // 터치 화면에서는 높이 44(globals.css · 2026-09-27 패드 UX 감사: 거르기 칩 22). PC 는 그대로
      className="qa-touch-44 qd-choice"
      style={{
        padding: `${QD.space2} ${QD.space3}`,
        marginBottom: "var(--qd-atelier-margin-bottom-e0810202f6)",
        background: 'transparent',
        border: 'none',
        borderBottom: `var(--qd-border-width-2) var(--qd-atelier-border-style-5ed175bd8d) ${active ? T.champagne : 'transparent'}`,
        color: active ? T.text : T.muted,
        fontSize: QD.controlSize,
        fontFamily: QDScale.family.ui,
        fontWeight: active ? "var(--qd-font-weight-semibold)" : "var(--qd-font-weight-normal)",
        cursor: 'pointer',
        lineHeight: QDScale.leading.none,
        whiteSpace: 'nowrap',
        transition: `color ${QD.motionFast}, border-color ${QD.motionFast}`,
      }}
    >
      {label}
    </button>
  );
}

// ─── EN: 영문 약어 lang 헬퍼 ───────────────────────────────────────────────
// 한글이 주 콘텐츠(`<html lang="ko">`) 인데 영문 약어 (MFDS, RA/QA, ISO, FDA)
// 와 코드 (CR-2025, RD-2026-001) 가 다수 노출됨. 스크린리더가 영문을 한국어
// 발음 ("엠에프디에스") 으로 읽지 않도록 `<span lang="en">` 으로 감싼다.
//
// 사용 예: <En>MFDS</En>, <En>RA/QA</En>, <En>RD-2026-001</En>
export function En({ children }: { children: ReactNode }) {
  return <span lang="en">{children}</span>;
}

// ─── INLINE STRONG: **굵게** 마크다운만 <strong> 으로 ─────────────────────────
// 2026-09-03 M-05: AI 초안(변경 영향 평가 등)이 `**...**` 를 섞어 보내면 화면에
// 별표가 그대로 찍혔습니다. 서버가 기호를 걷어내는 것이 1차 방어이고, 이미 저장된 본문과
// 다른 경로로 들어온 텍스트를 위해 렌더에서 한 번 더 받습니다. 다른 마크다운은 손대지 않습니다.
//
// 사용 예: <InlineStrong text={cr.impact_safety} />
export function InlineStrong({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/);
  return (
    <>
      {parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}
    </>
  );
}

// ─── FIELD ROW ───────────────────────────────────────────────────────────────
export function FldRow({
  label,
  required,
  optional,
  hint,
  info,
  error,
  htmlFor,
  children,
}: {
  label: ReactNode;
  required?: boolean;
  /**
   * 「선택」 표시: required 의 짝. **label 요소 «안»에 렌더된다**(hint 와 다른 점).
   * 스크린리더가 컨트롤 이름을 «장소 선택» 으로 읽어야 «안 채워도 된다»는 정보가
   * 음성에도 전달된다. hint 로 대신하면 label 바깥 형제가 되어 그 정보가 사라진다.
   */
  optional?: boolean;
  /** 라벨 우측 11px 도움말 (form fill 안내). 짧은 형식 안내(«YYYY-MM-DD» · «최대 10MB»)에만. 설명 문장은 info 로. */
  hint?: ReactNode;
  /** 칸 ⓘ: 이 칸에 무엇을 넣는지 · 고르면 무엇이 달라지는지(2026-10-08 «설명 글귀는 ⓘ 안으로»). 이름표 옆 InfoDot. */
  info?: ReactNode;
  /** inline 검증 오류. 비면 정상, 있으면 input 아래 빨강 메시지 표시. */
  error?: string | null;
  /** label htmlFor 연결: 접근성(WCAG 2.1) + 라벨 클릭 시 input 포커스. */
  htmlFor?: string;
  children: ReactNode;
}) {
  // htmlFor 유무로 «요소»는 달라지지만 «모습»은 하나여야 한다.
  //
  // 2026-08-06 이전에는 htmlFor 가 없으면 <Lbl>(FS[12] · T.subtle · ls 1.5 ·
  // marginBottom 7) 로 빠져, 같은 폼 안에서도 id 를 준 필드와 안 준 필드의 라벨이
  // 크기·색·자간이 다르고 컨트롤이 7px 내려앉았다. SSOT 컴포넌트가 «입력에 따라
  // 모습을 바꾸는» 패턴: Tag 가 색으로 tier 를 바꾸던 것과 같은 결함이다.
  // 이제 둘 다 lblStyleFor 를 쓴다. (독립 <Lbl> 사용처는 그대로 유효하다.)
  //
  // 오류 · 도움말 글귀의 id: htmlFor(칸 id)가 있을 때만 만들고, 칸에 aria-describedby 로 잇는다
  // (linkFieldChildren 참조). 도움말 → 오류 순서. htmlFor 가 없으면 이름표도 못 잇는 옛 호출이라
  // 연결도 하지 않는다.
  const hintId = htmlFor && hint ? `${htmlFor}-hint` : undefined;
  const errorId = htmlFor && error ? `${htmlFor}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  const labelNode = (
    <>
      {label}
      {required && <span style={{ color: T.red, marginLeft: QDScale.space[0.5] }}>*</span>}
      {/* 화면 검토 A81 · 2026-09-27: 「선택」 은 «필수 아님» 인데 «고르라» 로도 읽혀 필수 칸을 건너뛰게 했다 */}
      {optional && (
        <span
          style={{
            color: T.muted, opacity: "var(--qd-atelier-opacity-fab5edc654)", fontSize: QDScale.font[12],
            // 고정폭 이름표 안의 한글: 자간 0 · 어절 공백 되돌림을 스스로 건다(이름표가 영어여도) · 화면 검토 A44 · 2026-09-28
            letterSpacing: "var(--qd-atelier-letter-spacing-1029873b1c)", wordSpacing: labelWordSpacing('필수 아님'), textTransform: QDText.textTransform.v30a0924a33, marginLeft: QDScale.space[1],
          }}
        >
          필수 아님
        </span>
      )}
    </>
  );
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: QDScale.space[2], marginBottom: 'var(--qd-field-gap)' }}>
        {htmlFor ? (
          <label htmlFor={htmlFor} style={lblStyleFor(label)}>{labelNode}</label>
        ) : (
          <span style={lblStyleFor(label)}>{labelNode}</span>
        )}
        {info && (
          <InfoDot label={typeof label === 'string' ? `${label} 설명 보기` : '칸 설명 보기'}>{info}</InfoDot>
        )}
        {hint && (
          <span id={hintId} className="qd-field-hint" style={{ fontSize: QD.captionSize, color: T.muted, fontFamily: QDScale.family.ui }}>
            {hint}
          </span>
        )}
      </div>
      {linkFieldChildren(children, htmlFor, describedBy, Boolean(error))}
      {error && <FldError id={errorId}>{error}</FldError>}
    </div>
  );
}

/**
 * 오류 · 도움말 글귀를 칸에 «연결» 한다 (WCAG 3.3.1 · 1.3.1 · 2026-10-08).
 *
 * 오류 글귀에 role="alert" 만 있으면 글귀가 «나타날 때» 한 번 읽히고 끝이다. 낭독기로 칸에
 * 초점을 다시 줄 때 오류를 들으려면 칸 쪽에 aria-describedby 가 있어야 하는데, 호출부 556곳
 * 어디에도 없었다. Field 는 칸의 id(htmlFor)를 이미 아니, 자식 가운데 id 가 같은 칸을 찾아
 * 속성을 끼워 넣는다. 호출부는 손댈 것이 없다.
 *
 * · 끼워 넣는 대상: 날것 요소(input · select · textarea …)와 공용 In · Sel · Txt 뿐.
 *   다른 부품(DatePicker 류)은 그 안으로 더 내려가 보기만 하고, 부품 자체에는 붙이지 않는다
 *   (알 수 없는 속성이 그 부품의 DOM 에 닿는다는 보장이 없다).
 * · 세 겹까지만 내려간다. 칸이 더 깊이 숨어 있는 호출은 직접 'aria-describedby' 를 주면 된다.
 * · 호출부가 이미 준 aria-describedby 는 앞에 그대로 두고 뒤에 잇는다.
 * · 오류도 도움말도 없으면 아무것도 하지 않는다(결과 markup 이 종전과 같다).
 */
function linkFieldChildren(children: ReactNode, id: string | undefined, describedBy: string | undefined, invalid: boolean): ReactNode {
  if (!id || !describedBy) return children;
  const visit = (node: ReactNode, depth: number): ReactNode => {
    if (depth > 3 || !isValidElement(node)) return node;
    const el = node as ReactElement<Record<string, unknown>>;
    const props = el.props;
    const isField = props.id === id && (typeof el.type === 'string' || el.type === In || el.type === Sel || el.type === Txt);
    if (isField) {
      const prev = typeof props['aria-describedby'] === 'string' ? (props['aria-describedby'] as string) : '';
      const merged = prev ? `${prev} ${describedBy}` : describedBy;
      const extra: Record<string, unknown> = { 'aria-describedby': merged };
      if (invalid) {
        if (typeof el.type === 'string') extra['aria-invalid'] = true;
        else extra.invalid = true;
      }
      return cloneElement(el, extra);
    }
    if (props.children === undefined || props.children === null) return node;
    const next = Children.map(props.children as ReactNode, (c) => visit(c, depth + 1));
    return cloneElement(el, undefined, ...(Array.isArray(next) ? next : [next]));
  };
  return Children.map(children, (c) => visit(c, 0));
}

/**
 * Field: FldRow alias (Codex Audit 권장 네이밍).
 * 신규 폼에서는 Field 사용 권장 (기존 FldRow 도 계속 동작).
 * htmlFor 필수로 받아 접근성(WCAG 2.1) 기본값 강제.
 */
export function Field({
  id,
  label,
  required,
  optional,
  hint,
  info,
  error,
  children,
}: {
  /** input/select/textarea 의 id: htmlFor 연결. 필수. */
  id: string;
  label: ReactNode;
  required?: boolean;
  /** 「선택」 표시: label 안에 렌더돼 스크린리더가 함께 읽는다. FldRow 참조. */
  optional?: boolean;
  hint?: ReactNode;
  /** 칸 ⓘ. FldRow 참조. */
  info?: ReactNode;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <FldRow label={label} required={required} optional={optional} hint={hint} info={info} error={error} htmlFor={id}>
      {children}
    </FldRow>
  );
}

/**
 * FormSection: 긴 폼의 IA(정보구조) 구분.
 * 신규 컴포넌트 없이 라이트 라벨 + divider 로 섹션 구분 (Codex Audit 권장).
 * 사용 예:
 *   <FormSection title="기본 정보">
 *     <Field id={titleId} label="제목"><In id={titleId} ... /></Field>
 *   </FormSection>
 */
export function FormSection({
  title,
  description,
  source,
  children,
}: {
  title: string;
  /** 구역 제목 옆 ⓘ 안에 들어갈 설명 (선택). 화면에는 깔리지 않는다. */
  description?: ReactNode;
  /** 이 구역 데이터가 어디서 오는가(2026-10-18). ⓘ 안 «데이터 출처» 로 붙는다. null 은 «데이터 없는 구역». */
  source?: ReactNode;
  children: ReactNode;
}) {
  description = withSource(description, source);
  return (
    <section style={{ marginTop: QDScale.space[5] }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: QDScale.space[1.5],
          marginBottom: QDScale.space[2],
          paddingBottom: QDScale.space[1],
          borderBottom: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}`,
        }}
      >
        <div className="qa-sec-t" style={SECTION_TITLE}>
          {title}
        </div>
        {/* 구역 제목 ⓘ(2026-10-08): 설명은 화면에 깔지 않고 팝업으로 */}
        {description && <InfoDot label={`${title}: 설명 보기`}>{description}</InfoDot>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: QDScale.space[3] }}>
        {children}
      </div>
    </section>
  );
}

/**
 * FormActions: 폼 하단 액션 버튼 정렬 통일 (Codex Audit 권장).
 * Primary action 1개 원칙. 취소는 좌측, 저장은 우측.
 * 모바일에서는 flex-wrap 으로 자연 줄바꿈.
 * 사용 예:
 *   <FormActions>
 *     <Btn p={false} onClick={onCancel}>취소</Btn>
 *     <Btn onClick={onSave}>저장</Btn>
 *   </FormActions>
 */
export function FormActions({
  children,
  align = 'right',
}: {
  children: ReactNode;
  /** 정렬: right(기본, 저장이 우측) / between(취소 좌·저장 우) / center. */
  align?: 'right' | 'between' | 'center';
}) {
  const justify =
    align === 'between' ? 'space-between' : align === 'center' ? 'center' : 'flex-end';
  return (
    <div
      style={{
        marginTop: QDScale.space[4.5],
        paddingTop: QDScale.space[3.5],
        borderTop: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}`,
        display: 'flex',
        gap: QDScale.space[2],
        justifyContent: justify,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      {children}
    </div>
  );
}

/**
 * EntityCardHeader: 반복 카드(DR/CR/Submission 등) 헤더의 2단 구조 통일.
 * Codex Audit P1: 모바일 wrap 안정 + accordion accessibility 내장.
 *
 * 구조:
 *   1단(메타): badge(번호·mono) · tags... · meta(날짜·우측 정렬) · chevron
 *   2단(제목): wordBreak 적용 · 모바일에서도 가독성 보장
 *
 * 사용 예:
 *   <EntityCardHeader
 *     badge="CR-001"
 *     badgeColor={T.champagne}
 *     tags={<><Tag>요청</Tag><Tag>v2</Tag></>}
 *     meta="2026-05-30"
 *     title={cr.title}
 *     expanded={open}
 *     onToggle={() => setOpen(v => !v)}
 *     ariaLabel={`${cr.cr_number} ${cr.title}`}
 *   />
 */
export function EntityCardHeader({
  badge,
  badgeColor,
  tags,
  meta,
  title,
  expanded,
  onToggle,
  ariaLabel,
  panelId,
}: {
  /** 좌측 mono 식별자: DR-001 / CR-001 등 */
  badge: ReactNode;
  /** badge 색: 기본은 champagne */
  badgeColor?: string;
  /** badge 옆 Tag list: React fragment 로 전달 */
  tags?: ReactNode;
  /** 우측 보조 정보: 보통 날짜 (mono, muted) */
  meta?: ReactNode;
  /** 2단 본문: 제목·핵심 텍스트 */
  title: ReactNode;
  expanded: boolean;
  onToggle: () => void;
  /** Screen reader 용: 보통 `${번호} ${제목}` */
  ariaLabel: string;
  /** 펼친 패널의 id: aria-controls 연결 */
  panelId?: string;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      aria-controls={panelId}
      aria-label={`${ariaLabel}: ${expanded ? '접기' : '펼치기'}`}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      style={{
        padding: `${QDScale.space[3.5]} ${QDScale.space[4.5]}`,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: QDScale.space[1.5],
      }}
    >
      {/* 1단: 메타 행: 번호 · 태그들 · 날짜 · 화살표 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: QDScale.space[2.5], flexWrap: 'wrap' }}>
        <span
          style={{
            fontFamily: QDScale.family.mono,
            fontSize: QDScale.font[12],
            color: badgeColor ?? T.champagne,
            fontWeight: "var(--qd-font-weight-semibold)",
            minWidth: "var(--qd-atelier-min-width-b00c37e669)",
          }}
        >
          {badge}
        </span>
        {tags}
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: QDScale.space[2.5] }}>
          {meta != null && (
            <span style={{ fontSize: QDScale.font[12], color: T.muted, fontFamily: QDScale.family.mono }}>{meta}</span>
          )}
          <span style={{ color: T.muted, fontSize: QDScale.font[12] }}>{expanded ? '▼' : '▶'}</span>
        </span>
      </div>
      {/* 2단: 제목 행: 전체 폭, 가독성 우선 */}
      <div
        style={{
          color: T.text,
          fontWeight: "var(--qd-font-weight-medium)",
          fontSize: QDScale.font[14],
          lineHeight: "var(--qd-atelier-line-height-305f939377)",
          wordBreak: 'break-word',
        }}
      >
        {title}
      </div>
    </div>
  );
}

// Lbl 컴포넌트의 스타일을 label 요소에도 재사용하기 위한 함수.
// 2026-09-03 M-02: 상수였습니다. 라벨 문구를 모르니 한글에도 자간 1.2 가 걸렸습니다.
// 문구를 받아 labelTracking 으로 정합니다. 크기·색·굵기는 종전과 같습니다.
function lblStyleFor(label: ReactNode): CSSProperties {
  return {
    fontSize: QD.captionSize,
    color: T.muted,
    fontFamily: QDScale.family.mono,
    letterSpacing: labelTracking(label, QDText.tracking.v77ac319bfe),
    wordSpacing: labelWordSpacing(label),
    textTransform: labelCase(label),
    fontWeight: "var(--qd-font-weight-medium)",
    display: 'inline-block',
  };
}

/**
 * Inline 검증 오류 메시지: slide-down + fade-in. luxury 톤 (작은 폰트 + red).
 * FldRow 에 error prop 주거나, 독립 사용 가능.
 */
export function FldError({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <div
      id={id}
      role="alert"
      className="qd-field-error"
      style={{
        fontSize: QD.captionSize,
        color: T.red,
        fontFamily: QDScale.family.ui,
        marginTop: QDScale.space[1.5],
        lineHeight: QDScale.leading.snug,
        letterSpacing: "var(--qd-atelier-letter-spacing-4a873a4bd2)",
        animation: `qa-fld-error-rise ${QD.motionNormal} both`,
      }}
    >
      {children}
    </div>
  );
}

// ─── PAGE HEADER ─────────────────────────────────────────────────────────────
/** 두 글이 공백을 빼면 같은가. PageHd 가 제목을 되풀이하는 이름표를 거를 때 쓴다. */
function sameHeadText(a: string, b: string): boolean {
  return a.replace(/\s+/g, '') === b.replace(/\s+/g, '');
}
interface PageHdProps {
  title: string;
  /**
   * 제목 위 작은 이름표. **뜻 있을 때만** 둔다: 조항 · 규격, 기록 번호, 날짜 · 기간, 판,
   * 상위 기록, 상세 화면의 상태 · 분류. 제목 되풀이 · 차림표나 역할 이름 · «-» 는 두지 않고,
   * 설명문 · 건수 · 조직 이름은 desc 로 보낸다(오너 결정 2번 · 화면 검토 A35 · A66 · 2026-09-27).
   * ReactNode 허용: 영문 약어를 <En> 으로 감싸 lang 힌트 부여 가능.
   */
  sub?: ReactNode;
  /**
   * 제목 아래 설명 한 줄. 본문 글꼴 · 보조 색 · 줄바꿈 허용(고정폭 · 대문자 · 넓은 자간 없음).
   * 한글 문장을 이름표 자리에 두면 고정폭으로 벌어졌다(화면 검토 A44). 글 · 인라인 요소만 넣는다(<p> 안).
   */
  desc?: ReactNode;
  /** 화면 머리 ⓘ(2026-10-08): desc 줄 끝의 ⓘ 팝업. 설명 문장은 desc 가 아니라 여기로. desc 는 짧은 이름표로 둔다. */
  info?: ReactNode;
  /**
   * 이 화면 데이터가 어디서 오는가(2026-10-18). 제목 옆 ⓘ 안 «데이터 출처» 로 붙는다. 화면 머리 안내(PageGuide)가 있는
   * 화면은 PAGE_GUIDES 의 dataSource 에 적고 여기는 비운다. null 은 «데이터 없는 화면».
   */
  source?: ReactNode;
  actions?: ReactNode;
  /** title 위에 1.5px × 32px champagne 가로선 accent. 기본 true. */
  accent?: boolean;
  /**
   * @deprecated 한글/영문 혼용 헤딩에서 Cormorant + Pretendard 가 섞여 영문이
   *   가는 이탈릭처럼 튀는 문제. 항상 Pretendard 통일로 고정: prop 무시.
   *   호출부에서 점진적으로 제거.
   */
  display?: boolean;
}
export function PageHd({ title, sub, desc, info, source, actions, accent = true }: PageHdProps) {
  info = withSource(info, source);
  // 안전망: 이름표가 제목과 같은 글자(공백 무시)면 그리지 않는다(화면 검토 A35 · A66 · 2026-09-27).
  // 🔴 걸러낸 값을 새 이름에 담지 않고 매개변수를 다시 대입한다. Q-Design 추출기
  //    (tools/extract-screen.mjs)가 아래 JSX 의 이름표 조각을 글자 그대로 찾아 값을 뽑는다.
  if (typeof sub === 'string' && sameHeadText(sub, title)) sub = undefined;
  const id = useId().replace(/:/g, '');
  const headerClass = `qa-page-hd-${id}`;
  // 제목 단계는 Q-Design 에서 정하고 모바일에서는 동작 영역이 줄을 바꾼다.
  const responsiveCss = pageHeadingRules(headerClass);
  return (
    <div style={{ marginBottom: QDScale.space[7.5] }}>
      <style dangerouslySetInnerHTML={{ __html: responsiveCss }} />
      <div
        className={`${headerClass}-row`}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: QDScale.space[4],
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: "var(--qd-atelier-min-width-f24a3b2189)", flex: "var(--qd-atelier-flex-7fff97ee23)" }}>
          {accent && (
            <div
              aria-hidden
              style={{
                width: "var(--qd-atelier-width-63349069ab)",
                height: "var(--qd-atelier-height-e737496ec6)",
                background: T.champagne,
                marginBottom: QDScale.space[3.5],
              }}
            />
          )}
          {sub && (
            <div
              style={{
                fontSize: QDScale.font[12],
                color: T.subtle,
                fontFamily: QDScale.family.mono,
                letterSpacing: labelTracking(sub, QDText.tracking.v914204c25f),
                wordSpacing: labelWordSpacing(sub),
                textTransform: labelCase(sub),
                marginBottom: QDScale.space[2],
              }}
            >
              {sub}
            </div>
          )}
          <h1
            className={`${headerClass}-title qd-page-head-title`}
            style={{
              // 항상 Pretendard: 한글/영문 혼용에서 글꼴 섞임 방지.
              // "디스플레이" 톤은 weight 700 + tight letter-spacing 으로 표현.
              fontFamily: QDScale.family.serif,
              fontWeight: "var(--qd-font-weight-bold)",
              // 제목 크기는 위 규칙의 --qd-title-size 로 이어진다.
              color: T.text,
              lineHeight: QDScale.leading.heading,
              letterSpacing: "var(--qd-atelier-letter-spacing-0eb1693ce1)",
              margin: "var(--qd-space-0)",
              // ⓘ 가 제목 줄에 붙을 때만 줄 안 상자로(없으면 종전 그대로 블록)
              display: info ? 'inline-block' : undefined,
            }}
          >
            {title}
          </h1>
          {/* 화면 머리 ⓘ(2026-10-08): 설명 문장은 제목 바로 옆 ⓘ 팝업으로(제목은 info 가 있을 때만 줄 안에 놓는다) */}
          {info && (
            <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginLeft: QDScale.space[2] }}>
              <InfoDot label={`${title}: 설명 보기`}>{info}</InfoDot>
            </span>
          )}
          {desc && (
            <p
              style={{
                margin: "var(--qd-space-0)",
                marginTop: QDScale.space[2],
                maxWidth: "var(--qd-atelier-max-width-108516c287)",
                fontFamily: QDScale.family.ui,
                fontSize: QDScale.font[13],
                lineHeight: QDScale.leading.relaxed,
                color: T.subtle,
                // 한글은 낱말 단위로 줄을 바꾼다(폰 폭에서 낱말 가운데서 끊기지 않게)
                wordBreak: 'keep-all',
                overflowWrap: 'break-word',
              }}
            >
              {desc}
            </p>
          )}
        </div>
        {actions && (
          <div
            className={`${headerClass}-actions`}
            style={{ display: 'flex', gap: QDScale.space[2], alignItems: 'center' }}
          >
            {actions}
          </div>
        )}
      </div>
      <div style={{ marginTop: QDScale.space[4.5], borderBottom: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}` }} />
    </div>
  );
}

// ─── CARD ────────────────────────────────────────────────────────────────────
interface CardProps {
  label?: string;
  value?: string | number;
  color?: string;
  sub?: string;
  children?: ReactNode;
  style?: CSSProperties;
  /** 같은 Grid 안에서 KPI 와 섞일 때 row-height 일치 (기본 124: KPI 와 동일). */
  minHeight?: number;
}
export function Card({ label, value, color, sub, children, style, minHeight = QDPresentation.commonDefaults.cardMinHeight }: CardProps) {
  const isContainerMode = value === undefined && children !== undefined;
  return (
    <Bx style={{ flex: "var(--qd-atelier-flex-83725d2c6e)", minHeight, padding: "var(--qd-atelier-padding-9056e848e0)", ...style }}>
      {!isContainerMode && label && (
        <div
          style={{
            fontSize: QDScale.font[12],
            color: T.subtle,
            letterSpacing: labelTracking(label, QDText.tracking.v9f29a13043),
            wordSpacing: labelWordSpacing(label),
            fontFamily: QDScale.family.mono,
            textTransform: labelCase(label),
            marginBottom: QDScale.space[3],
            fontWeight: "var(--qd-font-weight-medium)",
          }}
        >
          {label}
        </div>
      )}
      {!isContainerMode && value !== undefined && (
        <div
          style={{
            // 한글이 섞여도 글꼴이 튀지 않도록 Pretendard 통일.
            // 럭셔리 톤은 weight 700 + tabular-nums + tight letter-spacing 으로.
            fontFamily: QDScale.family.serif,
            fontWeight: "var(--qd-font-weight-bold)",
            fontSize: QDScale.font[36],
            color: color || T.text,
            lineHeight: "var(--qd-atelier-line-height-89aa2d62d2)",
            letterSpacing: "var(--qd-atelier-letter-spacing-0eb1693ce1)",
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </div>
      )}
      {!isContainerMode && sub && (
        <div style={{ fontSize: QDScale.font[12], color: T.muted, marginTop: QDScale.space[2.5], lineHeight: QDScale.leading.normal }}>{sub}</div>
      )}
      {children}
    </Bx>
  );
}

// ─── INFO BOX ────────────────────────────────────────────────────────────────
export function InfoBox({
  children,
  color,
  style,
}: {
  children: ReactNode;
  color?: string;
  style?: CSSProperties;
}) {
  const c = color || T.champagne;
  // 2026-09-27 «문서 결»(Q-Design docs/24): 옅은 바탕 · 왼쪽 2px 막대를 걷고 위아래 가는 가로선 사이의 한두 문장으로.
  //   오너 문서 기준(STYLE_GUIDE): 「작은 강조문은 금색 라벨과 얇은 가로선 사이의 한두 문장」.
  return (
    <div
      // 띠 · 바탕 없이 위아래 가는 가로선 사이(화면 검토 A10 · 문서 결 · 2026-09-27). 뜻은 글이 말한다
      style={{
        padding: "var(--qd-atelier-padding-93cf53dedd)",
        ...ruleBand(c),
        fontSize: QDScale.font[13],
        color: T.subtle,
        lineHeight: QDScale.leading.relaxed,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── ALERT ───────────────────────────────────────────────────────────────────
interface AlertProps {
  kind: 'error' | 'success' | 'warning' | 'info';
  children: ReactNode;
  title?: string;
  onClose?: () => void;
  style?: CSSProperties;
}

/*
 * 🔴 2026-09-09 감사(주제 #3)에서 실측으로 찾은 것.
 *    Alert 은 `role` 도 `aria-live` 도 아이콘도 없는 **순수 div** 였고, 종류를
 *    알려 주는 단서가 «배경 8% · 테두리 30% · 왼쪽 3px 막대의 색» 뿐이었다.
 *
 *    호출 107곳 중 `title` 을 함께 주는 곳은 41곳뿐이다. 나머지 66곳은
 *    **색 말고 종류 단서가 하나도 없다.** 색약인 사람에게 「저장했습니다」와
 *    「저장하지 못했습니다」가 같은 상자로 보인다(WCAG 1.4.1 색 사용).
 *    낭독기에게는 넷 다 그냥 문단이라 «지금 뜬 것이 오류» 라는 사실 자체가 없다.
 *
 *    이 저장소는 같은 문제를 이미 두 곳에서 옳게 풀어 두었다. 새 방식을 짓지 않고
 *    그것을 따른다:
 *      · components/Toast.tsx  아이콘 + error/warning=alert · info/success=status
 *      · FldError (위)          role="alert" + ⚠ 글자
 *
 *    아이콘에 `aria-label` 을 준다(`aria-hidden` 이 아니다). Toast 는 제목이 항상
 *    있어 숨겨도 됐지만 Alert 은 66곳이 제목 없이 쓰이므로, 아이콘이 «색이 아닌
 *    유일한 종류 단서» 다. 눈에는 모양으로, 낭독기에는 말로 같은 것이 전해진다.
 */
const ALERT_KIND = {
  error: { color: T.red, Icon: AlertCircle, 말: '오류' },
  warning: { color: T.warning, Icon: AlertTriangle, 말: '주의' },
  success: { color: T.green, Icon: CheckCircle2, 말: '완료' },
  info: { color: T.blue, Icon: Info, 말: '안내' },
} as const;

export function Alert({ kind, children, title, onClose, style }: AlertProps) {
  const { color: c, Icon, 말 } = ALERT_KIND[kind];
  return (
    <div
      /*
       * error·warning 은 assertive(role="alert"), info·success 는 polite(role="status").
       * Toast 와 같은 판단이다. 화면에 처음부터 있던 Alert 은 낭독기가 읽지 않고,
       * **행동에 대한 답으로 나타난 Alert** 만 읽는다 - 그것이 우리가 원하는 것이다.
       */
      className="qd-notice"
      data-kind={kind}
      role={kind === 'error' || kind === 'warning' ? 'alert' : 'status'}
      style={{
        // 면 · 네 변 테두리 · 여백은 Q-Design 의 qd-notice 한 벌로 정한다.
        fontFamily: QDScale.family.ui,
        lineHeight: QDScale.leading.relaxed,
        display: 'flex',
        alignItems: 'flex-start',
        gap: QDScale.space[2.5],
        // 🔴 2026-08-25 오빠 지적(디자인 통일성)에서 실측으로 찾은 것.
        //    Alert 에 기본 아래 여백이 없어서 **다음 요소가 테두리에 딱 붙는다.**
        //    권한 매트릭스에서 재 보니 Alert 3개 전부 아래 간격이 «0px» 이었다.
        //    호출 101곳 중 손으로 여백을 주는 곳은 6곳뿐이고, 그 6곳의 값도
        //    S[2]·S[2.5]·S[3]·S[3]·S[4]·S[7] 로 제각각이다. 기준이 없으니 다들 짐작했다.
        //
        //    🔑 `Bx` 는 같은 이유로도 기본값을 «안» 넣었다(여백 없는 컨테이너로 쓰는
        //       정당한 용법이 69곳 있어서다). Alert 은 다르다. 테두리·배경을 항상 그리므로
        //       «여백 없는 Alert» 이라는 정당한 용법이 없다. 그래서 여기는 기본값을 준다.
        //
        //    ⚠️ `...style` 이 뒤에 오므로 기존 6곳은 자기 값을 그대로 쓴다(회귀 없음).
        marginBottom: QDScale.space[4],
        ...style,
      }}
    >
      {/* 색이 아닌 종류 단서. 눈에는 모양으로, 낭독기에는 말로 */}
      <Icon
        size={QDPresentation.iconSize[16]}
        strokeWidth={1.8}
        color={c}
        role="img"
        aria-label={말}
        style={{ flexShrink: 0, marginTop: QDScale.space[0.5] }}
      />

      <div style={{ flex: "var(--qd-atelier-flex-83725d2c6e)", minWidth: "var(--qd-atelier-min-width-f24a3b2189)" }}>
        {/* 라벨: 종류 말(색 · 낭독기는 아이콘 이름으로 이미 읽으므로 숨김) + 제목 */}
        <div style={{ fontSize: QDScale.font[12], fontWeight: "var(--qd-font-weight-semibold)", lineHeight: QDScale.leading.normal, marginBottom: "var(--qd-space-0-5)" }}>
          <span aria-hidden="true" style={{ color: c }}>{말}</span>
          {title && <span style={{ color: T.text }}> · {title}</span>}
        </div>
        {/* 한글은 낱말 단위로 줄을 바꾼다(2026-09-28 오빠 지적: 로그인 오류가 «누르십시 / 오.» 로 끊겼다).
            break-word 는 한글을 음절마다 끊는다. 띄어쓰기 없는 긴 주소 · 코드만 anywhere 로 넘치지 않게 끊고,
            pretty 는 마지막 줄에 낱말 하나만 남지 않게 한다. */}
        <div style={{ wordBreak: 'keep-all', overflowWrap: 'anywhere', textWrap: 'pretty' }}>{children}</div>
      </div>
      {onClose && (
        <button
          // type 이 없으면 <form> 안에서 «제출» 단추다(로그인 양식의 오류 알림이 그 자리). 지금은 누르는 순간
          // 알림이 먼저 지워져 단추가 양식을 벗어나므로 제출까지 가지 않는다(2026-09-28 운영 옛 판에서 마우스 ·
          // Enter · Space · 칸을 채운 채로 재어 제출 시도 0). 닫기가 늦게 지워지는 방식으로 바뀌면 로그인을
          // 다시 보내게 되므로 미리 못 박아 둔다.
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="qd-dialog-close"
          style={{
            background: 'transparent',
            border: 'none',
            color: T.muted,
            cursor: 'pointer',
            fontSize: QDScale.font[16],
            padding: "var(--qd-space-0)",
            minWidth: QD.controlHeight,
            minHeight: QD.controlHeight,
            lineHeight: QDScale.leading.none,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * 제출 실패 요약 · 초점 이동 (2026-10-08 · UX 지침 119 대조에서 남은 빈칸)
 *
 * 긴 폼이 실패하면 토스트 한 줄이 떴다 사라졌다. 사용자는 어느 칸이 문제인지 찾아야 했고, 낭독기 ·
 * 키보드 사용자는 초점이 단추에 남아 아무 데도 못 갔다. 이제 실패는 제출 단추 바로 위에 «남는» 요약으로
 * 나타나고(Alert · role=alert), 초점이 거기로 옮겨 가며, 칸마다 «이름표 글귀» 를 눌러 그 칸으로 간다.
 * 서버가 invalidInput(lib/api/error-response.ts)으로 준 issues.fieldErrors 는 칸 아래 inline 오류로도 이어진다.
 *
 * 쓰는 법(새 기록 폼 아홉이 본이다 · 2026-10-08):
 *   const sf = useSubmitFailure({ title: 'qo-title', period_end: 'qo-end' });   // API 칸 이름 → 화면 칸 id
 *   async function submit() { sf.clear(); …; if (!res.ok) { sf.fail(failureFromResponse(json, '저장하지 못했습니다.')); return; } }
 *   <Field id="qo-end" error={sf.fieldError('period_end')}>…</Field>
 *   <SubmitFailureSummary failure={sf.failure} nonce={sf.nonce} fieldIds={sf.fieldIds} onClose={sf.clear} />
 *   <FormActions>…</FormActions>
 * ──────────────────────────────────────────────────────────────────────────── */

/** 제출이 실패한 까닭. message 는 한 줄 요약, fields 는 «API 칸 이름 → 그 칸의 오류». */
export type SubmitFailure = { message: string; fields?: Record<string, string> };

/**
 * API 실패 응답(json)에서 SubmitFailure 를 만든다. message 가 없으면 fallback.
 * error 는 보통 'invalid_input' 같은 기계 문자열이라 쓰지 않되, 한글 문장이면(옛 API) 그대로 쓴다.
 * zod 의 fieldErrors(칸마다 문장 배열)는 첫 문장만 든다.
 */
export function failureFromResponse(json: unknown, fallback: string): SubmitFailure {
  const j = (json && typeof json === 'object' ? json : {}) as {
    message?: unknown;
    error?: unknown;
    issues?: { fieldErrors?: Record<string, unknown> } | null;
  };
  const message =
    typeof j.message === 'string' && j.message
      ? j.message
      : typeof j.error === 'string' && /[가-힣]/.test(j.error)
        ? j.error
        : fallback;
  const fields: Record<string, string> = {};
  const fe = j.issues?.fieldErrors;
  if (fe && typeof fe === 'object') {
    for (const [k, v] of Object.entries(fe)) {
      const first = Array.isArray(v) ? v.find((x): x is string => typeof x === 'string') : typeof v === 'string' ? v : undefined;
      if (first) fields[k] = first;
    }
  }
  return Object.keys(fields).length ? { message, fields } : { message };
}

/**
 * 폼 하나의 «마지막 제출 실패» 를 쥔다. fail() 할 때마다 nonce 가 올라, 같은 실패가 반복돼도 요약이 다시 초점을 받는다.
 * fieldIds: API 칸 이름 → 화면 칸 id. 요약의 칸 글귀(눌러서 그 칸으로)와 Field 의 inline 오류(fieldError)가 이것으로 이어진다.
 */
export function useSubmitFailure(fieldIds: Record<string, string> = {}) {
  const [failure, setFailure] = useState<SubmitFailure | null>(null);
  const [nonce, setNonce] = useState(0);
  const fail = useCallback((f: SubmitFailure | string) => {
    setFailure(typeof f === 'string' ? { message: f } : f);
    setNonce((n) => n + 1);
  }, []);
  const clear = useCallback(() => setFailure(null), []);
  const fieldError = useCallback((name: string) => failure?.fields?.[name] ?? null, [failure]);
  return { failure, nonce, fieldIds, fail, clear, fieldError };
}

/** 칸으로 초점을 옮긴다(보이게 굴린 뒤). 요약의 칸 글귀가 부른다. */
export function focusField(id: string) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ block: 'center' });
  el.focus();
}

/** 칸의 이름표 글귀(label[for]). 별표 · «필수 아님» 은 뺀다. 없으면 null. */
function fieldLabelText(id: string): string | null {
  if (typeof document === 'undefined') return null;
  const l = document.querySelector(`label[for="${CSS.escape(id)}"]`);
  const t = l?.textContent?.replace(/\*|필수 아님/g, '').trim();
  return t || null;
}

/**
 * 제출 실패 요약. 실패가 생기면(또는 같은 실패가 다시 오면) 자기에게 초점을 준다.
 * 제출 단추 바로 위(FormActions 앞)에 둔다: 사용자의 눈과 초점이 거기 있다.
 */
export function SubmitFailureSummary({
  failure,
  nonce = 0,
  fieldIds = {},
  onClose,
}: {
  failure: SubmitFailure | null;
  nonce?: number;
  fieldIds?: Record<string, string>;
  onClose?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!failure || !ref.current) return;
    ref.current.focus({ preventScroll: true });
    ref.current.scrollIntoView({ block: 'nearest' });
  }, [failure, nonce]);
  if (!failure) return null;
  const entries = Object.entries(failure.fields ?? {});
  return (
    // tabIndex -1: 프로그램만 초점을 준다(Tab 순서에는 안 들어감). 초점 고리는 전역 :focus-visible 규칙에 맡긴다(계약 ⑳ · 인라인 outline 금지).
    <div ref={ref} tabIndex={-1} data-submit-failure="">
      <Alert kind="error" onClose={onClose}>
        {failure.message}
        {entries.length > 0 && (
          <ul style={{ margin: `${QDScale.space[1]} 0 0`, paddingLeft: QDScale.space[4] }}>
            {entries.map(([name, msg]) => {
              const id = fieldIds[name];
              const label = id ? fieldLabelText(id) : null;
              return (
                <li key={name}>
                  {id && label ? (
                    <>
                      <TextAction onClick={() => focusField(id)}>{label}</TextAction>
                      {' · '}
                    </>
                  ) : null}
                  {msg}
                </li>
              );
            })}
          </ul>
        )}
      </Alert>
    </div>
  );
}

// ─── LOADING STATE ───────────────────────────────────────────────────────────
export function LoadingState({
  label = '불러오는 중',
  mode = 'page',
}: {
  label?: string;
  mode?: 'page' | 'inline' | 'fullscreen';
}) {
  if (mode === 'inline') {
    return (
      <span
        style={{
          fontSize: QDScale.font[12],
          color: T.muted,
          fontFamily: QDScale.family.mono,
          letterSpacing: labelTracking(label, QDText.tracking.v9f29a13043),
          wordSpacing: labelWordSpacing(label),
          textTransform: labelCase(label),
        }}
      >
        {label}…
      </span>
    );
  }
  const wrapperStyle: CSSProperties =
    mode === 'fullscreen'
      ? {
          minHeight: "var(--qd-atelier-min-height-57b2eb2748)",
          background: T.bg,
          color: T.muted,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }
      : {
          padding: "var(--qd-atelier-padding-2fced8fcbc)",
          textAlign: 'center',
          color: T.muted,
        };
  return (
    <div style={wrapperStyle}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: QDScale.space[3.5],
          fontFamily: QDScale.family.mono,
          fontSize: QDScale.font[12],
          letterSpacing: labelTracking(label, QDText.tracking.v914204c25f),
          wordSpacing: labelWordSpacing(label),
          textTransform: labelCase(label),
          color: T.subtle,
        }}
      >
        <Spinner />
        {label}
      </div>
    </div>
  );
}

// =============================================================================
// Skeleton: 로딩 placeholder SSOT (qa-skeleton shimmer)
// =============================================================================
// 페이지/패널마다 제각각이던 로딩 표시(텍스트 "로드 중…" / 자체 스피너 등)를
// 하나로 통일. dynamic(ssr:false) 청크 로딩·컴포넌트 내부 fetch 양쪽에서 같은
// shimmer 를 써서 화면 어디서든 일관된 로딩 경험 + 레이아웃 점프(CLS) 방지.
//
// - <Skeleton>      : 단일 shimmer 바(텍스트 줄·썸네일 등)
// - <SkeletonPanel> : 카드형 패널 자리표시(헤더 바 + 본문 라인 + 최소 높이)

/** 단일 shimmer 바: 텍스트 줄/이미지 자리 등. */
export function Skeleton({
  w = '100%',
  h = QDPresentation.skeletonHeight[14],
  radius,
  style,
}: {
  w?: number | string;
  h?: number | string;
  radius?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      className="qa-skeleton qd-skeleton"
      aria-hidden="true"
      style={{ width: w, height: h, borderRadius: radius ?? QD.radius, ...style }}
    />
  );
}

/**
 * 카드형 패널 로딩 자리표시: 헤더 바 + 본문 라인 N개 + 최소 높이.
 * dynamic import 의 loading fallback 또는 패널 내부 `if (loading)` 에 사용.
 * height 로 실제 패널과 비슷한 높이를 잡아 콘텐츠 도착 시 출렁임을 없앤다.
 */
export function SkeletonPanel({
  height,
  lines = QDPresentation.commonDefaults.skeletonLines,
  label = '로드 중',
}: {
  height?: number;
  lines?: number;
  label?: string;
}) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      style={{
        minHeight: height,
        padding: QDScale.space[4.5],
        marginBottom: QDScale.space[4],
        border: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}`,
        borderRadius: QD.radius,
        background: T.surface,
      }}
    >
      <Skeleton w="38%" h={QDPresentation.skeletonHeight[14]} style={{ marginBottom: QDScale.space[4] }} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          w={i === lines - 1 ? '55%' : '100%'}
          h={QDPresentation.skeletonHeight[12]}
          style={{ marginBottom: i === lines - 1 ? "var(--qd-atelier-margin-bottom-dba5d0300b)" : "var(--qd-atelier-margin-bottom-8774b7f498)" }}
        />
      ))}
    </div>
  );
}

/**
 * content 등장 fade: 로딩/skeleton 직후 콘텐츠가 '퍽' 대신 부드럽게 나타나게.
 * skeleton(자리표시)이 부드럽게 떴는데 데이터 도착 시 콘텐츠가 갑자기 swap 되는
 * "퍽퍽" 현상을 완화. 패널 메인 콘텐츠 root 를 감싸거나, root 에 직접
 * className="qa-fade-in" 을 부여(추가 div 가 레이아웃에 영향 주는 경우).
 * 애니메이션 SSOT = globals.css `.qa-fade-in` (opacity+rise 480ms, reduced-motion 대응).
 */
export function Reveal({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="qa-fade-in" style={style}>
      {children}
    </div>
  );
}

/**
 * Panel: 패널의 모든 상태(로딩·에러·빈·콘텐츠)를 한 컴포넌트로 묶은 SSOT.
 * 패널마다 SkeletonPanel/Reveal/Bx/Alert/EmptyState 를 직접 조합하던 것을 통합 →
 * 로딩 shimmer·라운드·content fade·에러·빈 처리가 자동으로 일관.
 *
 *   loading → <SkeletonPanel>(shimmer)
 *   error   → <Alert kind="error">
 *   empty   → emptyNode (fade-in)
 *   else    → children (fade-in). card=true 면 <Bx> 외형(라운드 카드).
 *
 * children 은 **함수(render-prop) 권장**: loading/error/empty 시 평가되지 않아
 * data 접근(`data.x`)이 안전. 일반 노드도 허용.
 */
export function Panel({
  loading = false,
  error = null,
  empty = false,
  emptyNode = null,
  height,
  lines,
  card = false,
  children,
  style,
}: {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyNode?: ReactNode;
  /** skeleton 높이: 실제 패널과 비슷하게 잡아 레이아웃 점프 방지 */
  height?: number;
  /** skeleton 본문 라인 수 */
  lines?: number;
  /** true 면 Bx 외형(라운드 카드 테두리·배경) */
  card?: boolean;
  children: ReactNode | (() => ReactNode);
  style?: CSSProperties;
}) {
  if (loading) return <SkeletonPanel height={height} lines={lines} />;
  if (error) return <Alert kind="error">{error}</Alert>;
  if (empty) return <div className="qa-fade-in">{emptyNode}</div>;
  const content = typeof children === 'function' ? (children as () => ReactNode)() : children;
  if (card) {
    return (
      <Bx className="qa-fade-in" style={style}>
        {content}
      </Bx>
    );
  }
  return (
    <div className="qa-fade-in" style={style}>
      {content}
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      style={{
        width: "var(--qd-atelier-width-732e621989)",
        height: "var(--qd-atelier-height-95e4053dfa)",
        border: `var(--qd-atelier-border-width-629f400716) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}`,
        borderTopColor: T.champagne,
        borderRadius: "var(--qd-atelier-border-radius-f44e751c2d)",
        display: 'inline-block',
        animation: "var(--qd-atelier-animation-f980f830ce)",
      }}
    />
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
// 넉넉한 여백(96px) + 제목 · 설명 · 다음 할 일. compact 모드는 사이드 패널 등 좁은 영역용(32px 패딩).
// 큰 장식 글리프(✦ 등)와 배경 번짐 빛은 걷었다: 장식보다 읽힘 (화면 검토 A38 · A76 · 2026-09-28).
// hints: 사용자가 다음에 할 행동 1-3개 chip: 신규/빈 화면에서 navigation hint.
export function EmptyState({
  title,
  description,
  action,
  hints,
  compact,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  /** 다음에 할 일 hint chip (1-3개). label + href, 또는 onClick. */
  hints?: Array<{ label: string; href?: string; onClick?: () => void }>;
  compact?: boolean;
}) {
  return (
    <Bx className={`qd-empty${compact ? ' qd-empty--compact' : ''}`}
      style={{
        padding: compact ? "var(--qd-atelier-padding-2de4de37b2)" : "var(--qd-atelier-padding-b5b76465e0)",
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'relative', zIndex: "var(--qd-atelier-z-index-8fc771a8bb)" }}>
        <div className="qd-empty-title"
          style={{
            fontFamily: QDScale.family.serif, fontWeight: "var(--qd-font-weight-bold)",
            fontSize: compact ? "var(--qd-atelier-font-size-c4c2451b3f)" : "var(--qd-atelier-font-size-281e2e0411)",
            color: T.subtle,
            letterSpacing: "var(--qd-atelier-letter-spacing-b926f96940)",
            marginBottom: description ? "var(--qd-atelier-margin-bottom-8774b7f498)" : action || hints ? "var(--qd-atelier-margin-bottom-761177ce75)" : "var(--qd-atelier-margin-bottom-dba5d0300b)",
          }}
        >
          {title}
        </div>
        {description && (
          <div className="qd-empty-desc"
            style={{
              fontSize: QDScale.font[13],
              color: T.muted,
              lineHeight: QDScale.leading.loose,
              maxWidth: "var(--qd-atelier-max-width-4a4cc8febf)",
              margin: action || hints ? "var(--qd-atelier-margin-56bc7ec797)" : "var(--qd-atelier-margin-4a5cbbd240)",
            }}
          >
            {description}
          </div>
        )}
        {action && <div className="qd-empty-actions" style={{ marginBottom: hints ? "var(--qd-atelier-margin-bottom-761177ce75)" : "var(--qd-atelier-margin-bottom-dba5d0300b)" }}>{action}</div>}
        {hints && hints.length > 0 && (
          <div className="qd-empty-hints"
            style={{
              display: 'flex',
              gap: QDScale.space[2],
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: action ? "var(--qd-atelier-margin-top-38db7dc3b0)" : "var(--qd-atelier-margin-top-1788b51a41)",
            }}
          >
            {hints.map((h, i) => {
              const styles: React.CSSProperties = {
                borderRadius: QD.radius,
                padding: "var(--qd-atelier-padding-1c48da5609)",
                background: 'transparent',
                border: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${alpha(T.champagne, QDRuntime.alpha.tint0_4)}`,
                color: T.champagne,
                fontSize: QDScale.font[12],
                fontFamily: QDScale.family.mono,
                letterSpacing: labelTracking(h.label, QDText.tracking.vd2cbad71ff),
                wordSpacing: labelWordSpacing(h.label),
                textTransform: labelCase(h.label),
                textDecoration: QDText.textDecoration.v30a0924a33,
                cursor: 'pointer',
                transition: "var(--qd-atelier-transition-47cf84485a)",
              };
              const content = (
                <span>
                  <span style={{ marginRight: QDScale.space[1.5] }}>→</span>
                  {h.label}
                </span>
              );
              if (h.href) {
                return (
                  <a key={i} href={h.href} style={styles}>
                    {content}
                  </a>
                );
              }
              return (
                <button key={i} type="button" onClick={h.onClick} style={styles}>
                  {content}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Bx>
  );
}

// ─── GRID ────────────────────────────────────────────────────────────────────
// 반응형 그리드.
//   ▶ 기본 (cols/responsive/minCol 모두 없음): `auto-fit, minmax(240px, 1fr)`
//   ▶ `cols=4` 만: 데스크탑(≥1024) 에서 4열, 그 아래에선 minCol 기준 auto-fit.
//   ▶ `responsive={{sm:1, md:2, lg:4}}` 으로 breakpoint 별 명시도 가능.
//   ▶ 기존 사용처는 `<Grid cols={N}>` 시그니처 유지: Breaking change 없음.
interface GridProps {
  /** 데스크탑(≥lg) 컬럼 수. 명시되면 그 이하 breakpoint 는 auto-fit. */
  cols?: number;
  /** auto-fit minmax 의 최소 컬럼 폭. 기본 240px. */
  minCol?: number;
  /** breakpoint 별 컬럼 명시. cols 보다 우선순위 높음. */
  responsive?: {
    base?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  children: ReactNode;
  style?: CSSProperties;
  gap?: number | string;
}



export function Grid({
  cols,
  minCol,
  responsive,
  children,
  style,
  gap = QDScale.space[2.5],
}: GridProps) {
  // responsive 가 없으면, cols 만 명시된 경우에도 모바일에선 auto-fit 으로 자동 wrap.
  // → 기존 사용처(`<Grid cols={4}>`) 가 모바일에서 1열까지 자연스럽게 collapse.
  const id = useId().replace(/:/g, '');
  const className = `qa-grid-${id}`;

  // SSR 안전한 default: auto-fit 으로 시작 → media query 로 cols 강제.
  const minimum = minCol ?? 'var(--qd-grid-min-width)';
  const baseTemplate = gridTemplateFor(undefined, minimum);

  // breakpoint 별 룰 합성.
  const rules = gridRulesFor(className, cols, minimum, responsive);
  const hasRules = rules.length > 0;
  if (hasRules) rules.unshift(`.${className}{grid-template-columns:${baseTemplate}}`);

  return (
    <>
      {hasRules && (
        <style dangerouslySetInnerHTML={{ __html: rules.join('') }} />
      )}
      <div
        className={`${className} qd-intrinsic-grid`}
        style={{
          display: 'grid',
          ...(hasRules ? {} : { gridTemplateColumns: baseTemplate }),
          ...({ '--qd-grid-gap': typeof gap === 'number' ? `${gap}px` : gap } as CSSProperties),
          minWidth: 0,
          gap,
          ...style,
        }}
      >
        {children}
      </div>
    </>
  );
}

/**
 * 최대 n 열로 놓되, 칸이 `min` px 보다 좁아지면 스스로 열을 줄이는 격자 style (2026-10-08).
 *
 * 손으로 `gridTemplateColumns: '1fr 1fr'` 를 쓰면 한 열이 글자 · 날짜 칸의 최소 폭보다 좁아져도 열이 안 줄어
 * 확대 400%(폭 320)에서 오른쪽이 잘렸다(WCAG 1.4.10 · reflow.cjs 가 8화면에서 잡음). 이 격자는
 * auto-fit + 한 열의 최소 폭 = max(min, 균등 1/n 폭)이라 «열은 n 개를 넘지 않고, 들어가지 않으면 줄어든다».
 * 뷰포트가 아니라 «칸이 놓인 상자의 폭» 으로 정해지므로 모달 · 좁은 카드 안에서도 맞는다.
 *
 * 쓰기: `<div style={foldGrid(2, S[3])}>` · 다른 style 은 `style={{ ...foldGrid(2, S[3]), marginBottom: S[3] }}`.
 * 행 간격이 열 간격과 다르면 `{ rowGap }`. 숫자판 · 등급 단추처럼 «열 수가 뜻» 인 곳은 쓰지 말고
 * `repeat(n, minmax(0, 1fr))` 로 두면 된다. 규칙 검증은 lib/design/fold-grid.test.tsx.
 */
export function foldGrid(
  n: number,
  gap: number | string,
  opts: { min?: number; rowGap?: number | string } = {},
): CSSProperties {
  const min = opts.min === undefined ? 'var(--qd-grid-min-width)' : `${opts.min}px`;
  // 1px 는 소수점 반올림으로 n 열이 «한 칸 모자라게» 접히는 것을 막는 여유
  const length = (value: number | string) => typeof value === 'number' ? `${value}px` : value;
  const totalGap = typeof gap === 'number' ? `${(n - 1) * gap}px` : `(${n - 1} * ${gap})`;
  const track = `max(${min}, calc((100% - ${totalGap}) / ${n} - ${QDRuntime.grid.roundingAllowance}px))`;
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${track}), 1fr))`,
    minWidth: 0,
    gap: opts.rowGap === undefined ? gap : `${length(opts.rowGap)} ${length(gap)}`,
  };
}

// ─── KPI ─────────────────────────────────────────────────────────────────────
// 데스크탑: hover 로 tooltip 표시. 모바일 (touch device): tap 으로 toggle.
// - role="button" + tabIndex=0 + aria-expanded + Enter/Space 키보드 지원
// - ESC / outside click 으로 닫힘
// - 터치 디바이스에서 close 버튼 (X) 노출
export function KPI({
  label,
  value,
  sub,
  color,
  tooltip,
  source,
}: {
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
  /** 호버 (또는 모바일에서 tap) 시 카드 아래에 표시할 풍부한 안내 컨텐츠 */
  tooltip?: ReactNode;
  /** 이 숫자가 어디서 오는가(2026-10-18). 팝업 안 «데이터 출처» 로 붙는다. */
  source?: ReactNode;
}) {
  tooltip = withSource(tooltip, source);
  const [hover, setHover] = useState(false);
  const [tapOpen, setTapOpen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const tooltipId = useId();
  const accent = color ?? T.subtle;
  // 2026-10-08: 지표 옆 ⓘ 도 초보자 모드와 상관없이 늘 보인다(오너 결정)
  const interactive = Boolean(tooltip);
  // 올려서 여는 것은 설정이 «올리면 열림» 일 때만. 기본(«눌러야»)은 누르거나 Enter 로만 연다
  const hoverOpens = useInfoTrigger() === 'hover';
  const isOpen = interactive && ((hoverOpens && hover) || tapOpen);

  // 팝업 열릴 때 카드 위치 계산: portal 렌더 좌표 기준
  useEffect(() => {
    if (isOpen && wrapRef.current) {
      setTooltipRect(wrapRef.current.getBoundingClientRect());
    }
  }, [isOpen]);

  // count-up animation: value 가 number 이고 reduced-motion 아닐 때만.
  const reducedMotion = usePrefersReducedMotion();
  const isNumeric = typeof value === 'number' && Number.isFinite(value);
  const animatedValue = useCountUp(
    isNumeric ? (value as number) : 0,
    QDPresentation.motionDefaults.countUp,
    isNumeric && !reducedMotion,
  );
  const displayedValue: number | string = isNumeric ? animatedValue : (value as string);

  // 터치 디바이스 감지 (hover: none AND pointer: coarse)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(hover: none) and (pointer: coarse)');
    const update = () => setIsTouch(mq.matches);
    update();
    if (mq.addEventListener) {
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
    }
    // legacy Safari
    mq.addListener(update);
    return () => mq.removeListener(update);
  }, []);

  // outside click & ESC: tapOpen 일 때만
  useEffect(() => {
    if (!tapOpen) return;
    const onDocPointer = (e: PointerEvent) => {
      const node = wrapRef.current;
      if (node && e.target instanceof Node && !node.contains(e.target)) {
        setTapOpen(false);
      }
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setTapOpen(false);
    };
    document.addEventListener('pointerdown', onDocPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDocPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [tapOpen]);

  const toggleTap = () => {
    if (!interactive) return;
    setTapOpen((v) => !v);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTap();
    }
  };

  const ariaProps = interactive
    ? {
        role: 'button' as const,
        tabIndex: 0,
        'aria-expanded': isOpen,
        'aria-controls': tooltipId,
        'aria-label': `${label}: 자세히 보기`,
      }
    : {};

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', height: "var(--qd-atelier-height-26ecbf76a0)" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={interactive ? toggleTap : undefined}
      onKeyDown={interactive ? onKeyDown : undefined}
      {...ariaProps}
    >
      <Bx
        // 폰(599 이하)에서는 여백 · 최소 높이를 줄인다(globals.css .qa-kpi-card · 2026-09-28 운영 화면 폰 · 패드)
        className="qa-kpi-card"
        style={{
          padding: "var(--qd-atelier-padding-0230ce59c8)",
          // 값 글자가 칸 폭(cqw)을 재도록 카드를 크기 컨테이너로 (위 fontSize clamp 와 한 벌)
          containerType: 'inline-size',
          display: 'flex',
          flexDirection: 'column',
          height: "var(--qd-atelier-height-26ecbf76a0)",
          minHeight: "var(--qd-atelier-min-height-baaa9dc6ef)",
          boxSizing: 'border-box',
          cursor: interactive ? (isTouch || !hoverOpens ? 'pointer' : 'help') : 'default',
          boxShadow: isOpen ? `0 0 0 var(--qd-border-width) ${alpha(accent, QDRuntime.alpha.tint0_4)}` : 'none',
          transition: "var(--qd-atelier-transition-bc79e320e5)",
        }}
      >
        <div
          style={{
            fontSize: QDScale.font[12],
            color: T.subtle,
            fontFamily: QDScale.family.mono,
            letterSpacing: labelTracking(label, QDText.tracking.v9f29a13043),
            wordSpacing: labelWordSpacing(label),
            textTransform: labelCase(label),
            marginBottom: QDScale.space[2.5],
            fontWeight: "var(--qd-font-weight-medium)",
            display: 'flex',
            alignItems: 'center',
            gap: "var(--qd-atelier-gap-0d6046eefe)",
          }}
        >
          {label}
          {tooltip && (
            <span
              aria-hidden="true"
              style={{ fontSize: QDScale.font[12], color: T.muted, opacity: "var(--qd-atelier-opacity-fab5edc654)" }}
            >
              ⓘ
            </span>
          )}
        </div>
        <div
          style={{
            // Pretendard 통일: 한글이 섞여도 글꼴이 튀지 않도록.
            // 럭셔리 톤은 weight 700 + tabular-nums + tight letter-spacing 으로.
            fontFamily: QDScale.family.serif,
            fontWeight: "var(--qd-font-weight-bold)",
            // 🔴 2026-09-15 오빠 지적(Q-Forge 「이번 달 자재 지출 4,370,000원」 이 칸 밖으로 넘침).
            //    36px 고정이면 좁은 칸에서 긴 금액이 넘친다. 카드를 크기 컨테이너로 두고(아래 kpiBox 의
            //    containerType) 칸 폭의 16% 로 줄어들되 36px 를 넘지 않고 20px 아래로는 안 내려간다.
            //    16%: 안쪽 폭 225px 이상이면 36px 그대로(큐아뜰리에 지표 카드), 173px(Q-Forge 8칸 띠)면 28px 로
            //    「4,370,000원」 이 들어간다. 12% 로 했더니 넓은 카드에서도 20px 로 줄어 인상이 죽었다(실측).
            //    정본(Q-Design extract-screen)이 이 세 값을 그대로 읽어 세 제품에 내보낸다.
            fontSize: `clamp(var(--qd-kpi-min-size), var(--qd-kpi-fluid-size), var(--qd-kpi-size, ${QDScale.font[36]}))`,
            lineHeight: "var(--qd-atelier-line-height-89aa2d62d2)",
            letterSpacing: "var(--qd-atelier-letter-spacing-0eb1693ce1)",
            color: color ?? T.text,
            fontVariantNumeric: 'tabular-nums',
            flex: "var(--qd-atelier-flex-83725d2c6e)",
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {displayedValue}
        </div>
        {/* sub 자리: 값이 없을 때도 동일 높이로 자리 확보 */}
        <div
          style={{
            fontSize: QDScale.font[12],
            color: T.muted,
            fontFamily: QDScale.family.ui,
            marginTop: QDScale.space[2.5],
            letterSpacing: "var(--qd-atelier-letter-spacing-7ced33ba9c)",
            lineHeight: QDScale.leading.normal,
            minHeight: "var(--qd-atelier-min-height-353f128cde)",
            visibility: sub ? 'visible' : 'hidden',
          }}
        >
          {sub ?? ' '}
        </div>
      </Bx>
      {/* 팝업: portal로 body에 직접 렌더해 위젯 stacking context 겹침 방지 */}
      {tooltip && isOpen && tooltipRect && typeof document !== 'undefined' && createPortal(
        <div
          id={tooltipId}
          role="tooltip"
          className="qd-tooltip"
          onClick={(e) => e.stopPropagation()}
          style={{
            borderRadius: QD.radius,
            position: 'fixed',
            top: tooltipRect.bottom + QDPresentation.visual.tooltipAnchorGap,
            left: tooltipRect.left,
            width: tooltipRect.width,
            background: QD.surface,
            border: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${QD.ctl}`,
            padding: QD.space3,
            paddingRight: isTouch ? "var(--qd-atelier-padding-right-5a7a43c1e0)" : "var(--qd-space-3-5)",
            zIndex: QD.zTooltip,
            boxShadow: QD.shadowOverlay,
          }}
        >
          {tooltip}
          {isTouch && (
            <button
              type="button"
              aria-label="툴팁 닫기"
              onClick={(e) => {
                e.stopPropagation();
                setTapOpen(false);
              }}
              style={{
                borderRadius: QD.radius,
                position: 'absolute',
                top: "var(--qd-atelier-top-0025c53646)",
                right: "var(--qd-atelier-right-6b2cf427e3)",
                width: "var(--qd-atelier-width-99c58a1579)",
                height: "var(--qd-atelier-height-1ef1d2ac3e)",
                background: 'transparent',
                border: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}`,
                color: T.subtle,
                cursor: 'pointer',
                fontSize: QDScale.font[14],
                lineHeight: QDScale.leading.none,
                padding: "var(--qd-space-0)",
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: QDScale.family.ui,
              }}
            >
              ✕
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── KPI / METRIC TOOLTIP 헬퍼들 ─────────────────────────────────────────────
// KPI / MetricCard 의 `tooltip` prop 안에 일관된 구조로 정보를 넣을 때 사용.
//
// 사용 예:
//   <KPI ... tooltip={
//     <TooltipBody title="상세 분포">
//       <TooltipRow label="완료" value="12종" dotColor={T.green} />
//       <TooltipNote>긴 설명...</TooltipNote>
//     </TooltipBody>
//   } />

export function TooltipBody({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: QDScale.font[12],
          color: T.champagne,
          letterSpacing: labelTracking(title, QDText.tracking.v9f29a13043),
          wordSpacing: labelWordSpacing(title),
          fontFamily: QDScale.family.mono,
          textTransform: labelCase(title),
          marginBottom: QDScale.space[2],
          fontWeight: "var(--qd-font-weight-semibold)",
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: QDScale.space[1] }}>{children}</div>
    </div>
  );
}

export function TooltipRow({
  label,
  value,
  dotColor,
}: {
  label: string;
  value: string;
  dotColor?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: QDScale.space[1.5],
        fontSize: QDScale.font[12],
        fontFamily: QDScale.family.mono,
        color: T.subtle,
        letterSpacing: "var(--qd-atelier-letter-spacing-de0a108215)",
      }}
    >
      {dotColor && (
        <span
          style={{
            width: "var(--qd-atelier-width-6dbc1e0ee1)",
            height: "var(--qd-atelier-height-e593254ea2)",
            background: dotColor,
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      )}
      <span style={{ flex: "var(--qd-atelier-flex-83725d2c6e)", minWidth: "var(--qd-atelier-min-width-f24a3b2189)" }}>{label}</span>
      <span style={{ color: T.text, fontWeight: "var(--qd-font-weight-medium)", flexShrink: 0 }}>{value}</span>
    </div>
  );
}

export function TooltipDivider() {
  return (
    <div style={{ borderTop: `var(--qd-border-width) var(--qd-atelier-border-style-95c01bc47f) ${T.border}`, margin: "var(--qd-atelier-margin-5c2df38eed)" }} aria-hidden />
  );
}

export function TooltipNote({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        marginTop: QDScale.space[2],
        paddingTop: QDScale.space[2],
        borderTop: `var(--qd-border-width) var(--qd-atelier-border-style-95c01bc47f) ${T.border}`,
        fontSize: QDScale.font[12],
        lineHeight: QDScale.leading.relaxed,
        color: T.muted,
        fontFamily: QDScale.family.serif,
      }}
    >
      {children}
    </div>
  );
}

// ─── INFO POPOVER: 정보/설명 팝업 통일 디자인 (SSOT) ────────────────────────
// Q-Design 의 불투명 면 · 조작 윤곽 · 10px 모서리 · 그림자를 모든 설명 팝업에 잇는다.
// 기존 import 이름은 호출부 호환을 위해 유지한다.
export const POPOVER_GLOW = QD.shadowOverlay;

/**
 * 정보 팝업 컨테이너 표준 스타일.
 * position(absolute/fixed)·top·left 등 배치 속성은 호출부에서 병합한다.
 */
export function infoPopoverStyle(opts?: {
  width?: number | string;
  maxWidth?: number | string;
}): CSSProperties {
  return {
    borderRadius: QD.radius,
    width: opts?.width ?? QDRuntime.popover.width,
    maxWidth: opts?.maxWidth ?? 'var(--qd-atelier-popover-max-width)',
    background: QD.surface,
    border: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${QD.ctl}`,
    padding: QD.space3,
    boxShadow: POPOVER_GLOW,
    textTransform: QDText.textTransform.v30a0924a33,
  };
}

// ─── INFO DOT: 칸 · 구역 · 지표 옆 ⓘ ───────────────────────────────────────────
/*
 * 2026-10-08 오너 결정 «설명 글귀는 ⓘ 안으로»: 화면에 깔려 있던 사용법 문장(«~하십시오» · «~됩니다»)을 세 층의 ⓘ 로
 * 옮긴다. 화면 머리 ⓘ(PageGuide) · 구역 제목 ⓘ(SectionTitleInfo) · 칸 ⓘ(FldRow info=). 셋 다 이 손잡이 하나와
 * infoPopoverStyle 팝업 하나를 쓴다. 화면에 그대로 남는 글은 네 가지뿐이다: 오류 · 경고(Alert) · 빈 화면 한 줄
 * (EmptyState) · 다음 할 일 한 줄(NextStep) · 법규 문구(LegalNote). 가드는 lib/design/explanation-text-contract.test.ts.
 *
 * 🔑 ⓘ 는 초보자 모드와 상관없이 늘 보인다(같은 날 결정 3). 초보자 모드는 화면 머리 안내가 처음부터 펼쳐져 있는지만 정한다.
 *   · 마우스를 올리면 열리고(hover 가 되는 기기에서만) 내리면 닫힌다. 누르면 고정되고, 다시 누르거나 바깥을 누르거나
 *     Esc 로 풀린다. 폰은 올릴 수 없으므로 누르는 것이 전부다.
 *   · label 은 낭독기용 이름(«대상 제품 설명 보기»). 팝업은 role=tooltip · aria-controls 로 묶는다.
 *   · <label> 안에 두지 않는다(단추는 label 의 자식이 될 수 없다). FldRow 는 이름표 옆 형제로 둔다.
 */
export function InfoDot({
  label,
  children,
  align = 'left',
  width,
}: {
  /** 낭독기용 이름. 예: «대상 제품 설명 보기» */
  label: string;
  /** 팝업 안에 보일 설명 */
  children: ReactNode;
  /** 오른쪽 끝 칸이면 right: 팝업이 화면 밖으로 나가지 않게 */
  align?: 'left' | 'right';
  width?: number | string;
}) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const leaveTimer = useRef<number | null>(null);
  const popId = useId();

  useEffect(() => {
    if (!pinned) return;
    const onOutside = (e: PointerEvent) => {
      if (rootRef.current && e.target instanceof Node && !rootRef.current.contains(e.target)) {
        setPinned(false);
        setOpen(false);
      }
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPinned(false);
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [pinned]);

  // 설정이 «올리면 열림» 이고 기기가 마우스를 쓸 때만 올려서 연다. «눌러야 열림»(기본)이면 누르거나 초점을 줘야 열린다.
  const trigger = useInfoTrigger();
  const canHover = () =>
    trigger === 'hover' && typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(hover: hover)').matches;

  // 폰처럼 좁은 화면에서 팝업이 오른쪽 밖으로 나가지 않게: 열릴 때 ⓘ 의 자리를 재어 폭과 왼쪽 밀림을 정한다
  // (2026-10-08 폰 412px 촬영에서 360px 팝업이 잘려 나갔다). 여백은 양쪽 16px.
  const [fit, setFit] = useState<{ width: number | string; shift: number }>({ width: width ?? QDRuntime.popover.infoWidth, shift: 0 });
  useEffect(() => {
    if (!open || !rootRef.current || typeof window === 'undefined') return;
    const gutter = QDRuntime.popover.viewportGutter;
    const vw = window.innerWidth;
    const want = typeof width === 'number' ? width : QDRuntime.popover.infoWidth;
    const w = Math.min(want, vw - gutter * 2);
    const rect = rootRef.current.getBoundingClientRect();
    let shift = 0;
    if (align === 'left') {
      const overflow = rect.left + w - (vw - gutter);
      if (overflow > 0) shift = -overflow;
    } else {
      // right 정렬은 왼쪽으로 삐져나올 수 있다. right 값을 음수로 주면 팝업이 오른쪽으로 밀린다
      const overflow = gutter - (rect.right - w);
      if (overflow > 0) shift = -overflow;
    }
    setFit({ width: typeof width === 'string' ? width : w, shift });
  }, [open, width, align]);

  return (
    <span
      ref={rootRef}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}
      onMouseEnter={() => {
        if (!canHover()) return;
        if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
        setOpen(true);
      }}
      onMouseLeave={() => {
        if (!canHover() || pinned) return;
        leaveTimer.current = window.setTimeout(() => setOpen(false), QDRuntime.popover.leaveDelayMs);
      }}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? popId : undefined}
        className="qa-touch-hit"
        onClick={(e) => {
          e.stopPropagation();
          if (pinned) {
            setPinned(false);
            setOpen(false);
          } else {
            setPinned(true);
            setOpen(true);
          }
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          if (!pinned) setOpen(false);
        }}
        style={{
          display: 'inline-grid',
          placeItems: 'center',
          width: "var(--qd-atelier-width-5e7a1d201a)",
          height: "var(--qd-atelier-height-866eaa306a)",
          margin: "var(--qd-atelier-margin-3c2f7af20d)",
          padding: "var(--qd-space-0)",
          borderRadius: "var(--qd-atelier-border-radius-f44e751c2d)",
          border: 'none',
          background: 'transparent',
          color: open ? T.champagne : T.muted,
          fontFamily: QDScale.family.ui,
          fontSize: QDScale.font[13],
          fontWeight: "var(--qd-font-weight-normal)",
          lineHeight: "var(--qd-atelier-line-height-3e0b4c5306)",
          letterSpacing: "var(--qd-atelier-letter-spacing-1029873b1c)",
          cursor: 'help',
          transition: "var(--qd-atelier-transition-d40a051b2d)",
        }}
      >
        ⓘ
      </button>
      {open && (
        <span
          id={popId}
          role="tooltip"
          className="qd-tooltip"
          onClick={(e) => e.stopPropagation()}
          style={{
            ...infoPopoverStyle({ width: fit.width }),
            position: 'absolute',
            top: "var(--qd-atelier-top-5041ca331f)",
            ...(align === 'right' ? { right: fit.shift } : { left: fit.shift }),
            marginTop: QDScale.space[1.5],
            zIndex: QD.zTooltip,
            display: 'block',
            fontFamily: QDScale.family.ui,
            fontSize: QD.captionSize,
            fontWeight: "var(--qd-font-weight-normal)",
            color: T.subtle,
            lineHeight: QDScale.leading.loose,
            letterSpacing: "var(--qd-atelier-letter-spacing-1029873b1c)",
            wordSpacing: 0,
            textAlign: 'left',
            whiteSpace: 'normal',
            cursor: 'auto',
          }}
        >
          {children}
        </span>
      )}
    </span>
  );
}

/** 화면에 남는 글 ②: «다음 할 일 한 줄». 앞에 → 를 붙여 안내임을 드러낸다(2026-10-08 오너 결정 2). */
export function NextStep({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <p style={{ margin: "var(--qd-space-0)", fontFamily: QDScale.family.ui, fontSize: QDScale.font[12], color: T.subtle, lineHeight: QDScale.leading.relaxed, ...style }}>
      <span aria-hidden style={{ color: T.champagne, marginRight: QDScale.space[1] }}>→</span>
      {children}
    </p>
  );
}

/** 화면에 남는 글 ④: 법규 문구(서명 동의문 · 고지). 글자 그대로 보여야 하는 것이라 ⓘ 로 접지 않는다. */
export function LegalNote({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <p style={{ margin: "var(--qd-space-0)", fontFamily: QDScale.family.ui, fontSize: QDScale.font[12], color: T.subtle, lineHeight: QDScale.leading.relaxed, ...style }}>
      {children}
    </p>
  );
}

// ─── DATA SOURCE: ⓘ 안의 «데이터 출처» 한 칸 ──────────────────────────────────────
/*
 * 2026-10-18 오너 결정 «가 안»: 빈 화면을 처음 본 사람은 «이 숫자 · 이 줄은 어디서 왔지?» 를 먼저 묻는다.
 * 그래서 세 층 ⓘ 안에 «데이터 출처» 자리를 둔다. 설명(info)과 같은 팝업 안, 가는 선 아래에 붙는다.
 *   · 화면 머리: PAGE_GUIDES 의 dataSource(PageGuide 가 «데이터는 어디서 오나요?» 로 보인다) 또는 PageHd source=.
 *   · 구역: Section · SectionCard · SectionTitleInfo · SectionTitle · FormSection 의 source=.
 *   · 지표: KPI source=. 직접 적는 기록부(Register)는 «이 회사가 이 칸에서 직접 적은 줄» 이 기본으로 붙는다.
 * 🔑 source={null} 은 «데이터를 담지 않는 구역(안내 · 단추 묶음)» 이라는 명시적 선언이다. 아무것도 그리지 않지만
 *    가드는 «출처를 따져 봤다» 로 센다. 가드: lib/design/data-source-contract.test.ts.
 * 문장 결은 page-guides 와 같은 합니다체. «이 회사가 어느 화면에서 적은 것인지 · MedQraft 가 기본으로 넣어 둔 것인지 ·
 * 다른 기록을 세어 계산한 것인지 · 바깥 공개 자료인지 · MedQraft Core 가 분석한 것인지» 를 쉬운 말로 쓴다.
 */
export const SOURCE_TITLE = '데이터 출처';

const present = (v: ReactNode) => v !== undefined && v !== null && v !== false && v !== '';

export function SourceNote({ children, divided = false }: { children: ReactNode; divided?: boolean }) {
  return (
    <span
      style={{
        display: 'block',
        ...(divided
          ? {
              marginTop: QDScale.space[2],
              paddingTop: QDScale.space[2],
              borderTop: `var(--qd-border-width) var(--qd-atelier-border-style-95c01bc47f) ${T.border}`,
            }
          : {}),
      }}
    >
      <span style={{ display: 'block', color: T.text, fontWeight: "var(--qd-font-weight-semibold)", marginBottom: QDScale.space[0.5] }}>
        {SOURCE_TITLE}
      </span>
      {children}
    </span>
  );
}

/** 설명(info)과 출처(source)를 ⓘ 팝업 한 벌로 합친다. 둘 다 없으면 undefined(ⓘ 를 그리지 않는다). */
export function withSource(info: ReactNode, source: ReactNode): ReactNode {
  if (!present(source)) return present(info) ? info : undefined;
  if (!present(info)) return <SourceNote>{source}</SourceNote>;
  return (
    <>
      {info}
      <SourceNote divided>{source}</SourceNote>
    </>
  );
}

// ─── SECTION TITLE ───────────────────────────────────────────────────────────
// 2026-10-10 글자 단계 C안(오너 결정): 구역 제목은 16px 굵게 본문색, 금색은 앞의 모노 번호에만 남긴다.
//   번호는 CSS 카운터(globals.css .qa-sec-t::before)가 붙인다. 예전 12px 금색 모노 자간 넓힘은 구역이 데이터 줄에 묻혔다.
//   구역 제목 4곳(SectionTitle · SectionTitleInfo · Section · FormSection)이 이 한 벌을 쓴다.
export const SECTION_TITLE = {
  margin: 0,
  fontSize: QD.sectionSize,
  fontWeight: 'var(--qd-font-weight-bold)',
  color: T.text,
  fontFamily: QDScale.family.ui,
  lineHeight: 'var(--qd-atelier-section-leading)',
} as const;

export function SectionTitle({
  children,
  noMargin,
  as: Comp = 'div',
  source,
}: {
  children: ReactNode;
  /** flex 헤더 행(제목+배지)에서 세로 중앙정렬이 깨지지 않도록 하단 마진 제거용. */
  noMargin?: boolean;
  /**
   * 문서 구조상 제목이면 h2 · h3 로. 기본은 div(기존 178곳 호환). UX-08 (Codex 2026-09-13): 긴 설정 화면이
   * 제목 탐색으로 구역을 못 찾았다. 화면의 «큰 구역» 제목에만 쓸 것(중첩은 h3).
   */
  as?: 'div' | 'h2' | 'h3';
  /** 이 구역 데이터가 어디서 오는가(2026-10-18). 주면 제목 옆 ⓘ 안에 «데이터 출처» 로 보인다. null 은 «데이터 없는 구역». */
  source?: ReactNode;
}) {
  const hasSource = present(source);
  const marginBottom = noMargin ? "var(--qd-atelier-margin-bottom-dba5d0300b)" : "var(--qd-atelier-margin-bottom-f0e60d1fe1)";
  // 제목 태그는 한 벌만 둔다. 출처가 있으면 아래 여백은 ⓘ 와 함께 묶은 줄이 진다(section-title-contract 가 4곳을 센다)
  const title = (
    <Comp className="qa-sec-t" style={hasSource ? SECTION_TITLE : { ...SECTION_TITLE, marginBottom }}>
      {children}
    </Comp>
  );
  if (!hasSource) return title;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: QDScale.space[1.5], marginBottom }}>
      {title}
      <InfoDot label={typeof children === 'string' ? `${children}: 데이터 출처 보기` : '구역 데이터 출처 보기'}>
        <SourceNote>{source}</SourceNote>
      </InfoDot>
    </div>
  );
}

// ─── SECTION (상세/편집 폼 섹션 래퍼: DESIGN-D 승격 2026-06-11) ──────────────
// [id] 상세 폼 페이지들이 로컬 복붙하던 Section 래퍼 2종을 SSOT 로 승격.
// (FinalJudgmentPanel·OpinionForm·PageGuide 의 Section 은 고유 UI: 별개 유지.)

/** 라벨형 섹션: mono uppercase 헤더 + 본문(카드 없이 그룹 구분). [id] 폼 표준. */
export function Section({ title, info, source, children }: {
  title: ReactNode;
  /** 구역 제목 ⓘ(2026-10-08) */
  info?: ReactNode;
  /** 이 구역 데이터가 어디서 오는가(2026-10-18). ⓘ 안 «데이터 출처» 로 붙는다. null 은 «데이터 없는 구역». */
  source?: ReactNode;
  children: ReactNode;
}) {
  // qa-section-body: 칸과 칸 사이를 띄운다(globals.css). 화면 검토 A81 · 2026-09-27: 간격이 0 이라
  //   이름표가 위 칸과 아래 칸 사이 가운데 떠서 어느 칸의 이름인지 헷갈렸다(공급자 상세 등 [id] 양식).
  info = withSource(info, source);
  return (
    <div className="qa-section-body" style={{ marginBottom: QDScale.space[6] }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: QDScale.space[1.5], marginBottom: QDScale.space[3] }}>
        <div className="qa-sec-t" style={SECTION_TITLE}>
          {title}
        </div>
        {info && <InfoDot label={typeof title === 'string' ? `${title}: 설명 보기` : '구역 설명 보기'}>{info}</InfoDot>}
      </div>
      {children}
    </div>
  );
}

/** 카드형 섹션: Bx 카드 + h3 제목 + 캡션 부제. QMS [id] 폼(audits·capa 등) 표준. */
export function SectionCard({
  title,
  subtitle,
  info,
  source,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  /** 구역 제목 옆 ⓘ 팝업(2026-10-08 ⓘ 묶음 3): 설명 문장은 본문에 깔지 않고 여기로 */
  info?: ReactNode;
  /** 이 구역 데이터가 어디서 오는가(2026-10-18). ⓘ 안 «데이터 출처» 로 붙는다. null 은 «데이터 없는 구역». */
  source?: ReactNode;
  children: ReactNode;
}) {
  info = withSource(info, source);
  return (
    <Bx
      style={{
        padding: QDScale.space[6],
        marginBottom: QDScale.space[4],
        background: T.surface,
        borderColor: T.border,
        borderRadius: QD.radius,
        // 2026-09-03 M-14: boxShadow 를 뺐습니다. 테두리와 그림자를 함께 쓰지 않는 규칙입니다(Modal·Drawer 만 예외).
        display: 'flex',
        flexDirection: 'column',
        gap: QDScale.space[3],
      }}
    >
      <div>
        <div style={{ ...QDType.h3, color: T.text, marginBottom: subtitle ? "var(--qd-atelier-margin-bottom-4686eaf157)" : "var(--qd-atelier-margin-bottom-dba5d0300b)", display: 'flex', alignItems: 'center', gap: QDScale.space[1.5] }}>
          {title}
          {info && <InfoDot label={`${typeof title === 'string' ? title : '구역'}: 설명 보기`}>{info}</InfoDot>}
        </div>
        {subtitle && <div style={{ ...QDType.caption, fontSize: QDScale.font[12], color: T.subtle }}>{subtitle}</div>}
      </div>
      {children}
    </Bx>
  );
}

// ─── SECTION TITLE + INFO (호버 설명 팝업) ────────────────────────────────────
// 긴 인라인 설명은 화면을 어지럽힘 → 제목 옆 ⓘ 에 마우스 올리면(또는 포커스 시)
// 설명 팝업으로 표시. 모바일은 tap 으로 toggle.
// 사용: <SectionTitleInfo info={<>긴 설명…</>}>문서 작업 (전체 카탈로그)</SectionTitleInfo>
export function SectionTitleInfo({
  children,
  info,
  source,
}: {
  children: ReactNode;
  /** 호버 시 팝업으로 보일 설명. 없으면 일반 SectionTitle 과 동일. */
  info?: ReactNode;
  /** 이 구역 데이터가 어디서 오는가(2026-10-18). ⓘ 안 «데이터 출처» 로 붙는다. null 은 «데이터 없는 구역». */
  source?: ReactNode;
}) {
  // 2026-10-08: ⓘ 는 초보자 모드와 상관없이 늘 보인다(오너 결정). 손잡이 · 팝업은 InfoDot 하나.
  info = withSource(info, source);
  if (!info) return <SectionTitle>{children}</SectionTitle>;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: QDScale.space[1.5], marginBottom: QDScale.space[3.5] }}>
      <span className="qa-sec-t" style={SECTION_TITLE}>
        {children}
      </span>
      <InfoDot label={typeof children === 'string' ? `${children}: 설명 보기` : '구역 설명 보기'}>{info}</InfoDot>
    </div>
  );
}

// ─── CARD TITLE ──────────────────────────────────────────────────────────────
export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: QDScale.font[12],
        color: T.muted,
        fontFamily: QDScale.family.mono,
        letterSpacing: labelTracking(children, QDText.tracking.v6b86b273ff),
        wordSpacing: labelWordSpacing(children),
        textTransform: labelCase(children),
        marginBottom: QDScale.space[3.5],
      }}
    >
      {children}
    </div>
  );
}

// ─── DISTRIBUTION BARS ───────────────────────────────────────────────────────
export function DistributionBars({
  data,
  total,
}: {
  data: { label: string; count: number; color: string }[];
  total: number;
}) {
  if (total === 0) {
    return (
      <div
        style={{
          fontSize: QDScale.font[12],
          color: T.muted,
          fontFamily: QDScale.family.mono,
          padding: "var(--qd-atelier-padding-cb2e44d3f6)",
          textAlign: 'center',
          fontStyle: QDText.fontStyle.v2cd63dd677,
        }}
      >
        데이터 없음
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: QDScale.space[2.5] }}>
      {data.map((d) => {
        const pct = total > 0 ? (d.count / total) * 100 : 0;
        return (
          <div key={d.label}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: QDScale.font[12],
                fontFamily: QDScale.family.mono,
                marginBottom: QDScale.space[1],
              }}
            >
              <span style={{ color: d.color, letterSpacing: "var(--qd-atelier-letter-spacing-c7e9f7cfec)" }}>{d.label}</span>
              <span style={{ color: T.subtle }}>
                {d.count}{' '}
                <span style={{ color: T.muted, marginLeft: QDScale.space[1] }}>({pct.toFixed(0)}%)</span>
              </span>
            </div>
            <div
              style={{
                height: "var(--qd-atelier-height-e593254ea2)",
                background: T.surface2,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: "var(--qd-atelier-left-090a0c84b4)",
                  top: "var(--qd-atelier-top-13ae86191f)",
                  bottom: "var(--qd-atelier-bottom-99ff6591d8)",
                  width: `${pct}%`,
                  background: d.color,
                  transition: "var(--qd-atelier-transition-7715dabda1)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SCROLL TABLE ────────────────────────────────────────────────────────────
// 멀티 컬럼 grid 테이블의 모바일 대응 wrapper.
//
// 데스크탑 시각 디자인 (grid template columns) 은 그대로 두되, 모바일에서는
// 부모 컨테이너 폭이 minWidth 보다 작으면 horizontal scroll 로 전환.
// 한 row 안의 컬럼들이 좁아 짜부라지지 않도록 child 의 min-width 를 보존.
//
// 사용: 기존 ColHeader + Row 들을 통째로 감싸기:
//   <ScrollTable minWidth={760} stickyFirstCol>
//     <ColHeader />
//     {items.map(item => <Row key={item.id} ... />)}
//   </ScrollTable>
//
// stickyFirstCol: 첫 번째 grid 컬럼 (보통 code 등 primary identifier) 을
// 좌측에 고정. 가로 스크롤 시에도 어느 row 인지 식별 가능.
/** 표가 옆으로 밀리기 전에 줄여 담는 폭(px). 768 폭 패드 세로(본문 712)에 최소 폭 760 표가 들어간다 */
export const SCROLL_TABLE_SQUEEZE = QDPresentation.commonDefaults.tableSqueeze;

export function ScrollTable({
  children,
  minWidth = QDPresentation.tableMinWidth[760],
  stickyFirstCol = false,
  tall = false,
  className,
}: {
  children: ReactNode;
  /** desktop layout 을 유지할 최소 폭 (px). 부모가 이보다 작으면 가로 스크롤. */
  minWidth?: number;
  /** 첫 컬럼 sticky 고정 (가로 스크롤 시 식별용). */
  stickyFirstCol?: boolean;
  /**
   * 세로 한계를 준다(70vh). 머리글을 붙이려면 «붙을 자리»가 있어야 한다.
   *
   * 🔴 이 감싸개는 overflow-x: auto 라 overflow-y 가 auto 로 «계산»된다.
   *    그러면 이 상자가 sticky 의 기준이 되는데, 세로 한계가 없으면
   *    scrollHeight == clientHeight 라 붙을 자리가 없다. Q-Forge 가 이 한계
   *    없이 sticky 를 걸어 두어 한 번도 안 붙었다(그쪽 감사 #8 · 실측 294/294).
   */
  tall?: boolean;
  className?: string;
}) {
  const id = useId().replace(/:/g, '');
  const wrapperCls = `qa-scroll-table qa-st-${id}${stickyFirstCol ? ' qa-sticky-first' : ''}${tall ? ' qa-scroll-table--tall' : ''}${className ? ` ${className}` : ''}`;
  /*
   * 🔴 2026-09-09 감사(주제 #10). 종이에는 가로 스크롤이 없다. minWidth 가 종이
   *    가용폭보다 넓으면 오른쪽 끝이 **잘렸다는 표시도 없이** 사라진다.
   *    실측(A4 794px): /assessments 가 448px, /audit·/settings 가 32px 씩 잃었다.
   *
   *    화면에는 아무 영향이 없다. `--qa-print-zoom` 은 globals.css 의 @media print
   *    안에서만 읽힌다. 여기서는 값만 실어 보낸다.
   */
  const z = printZoom(minWidth);
  // 옆으로 밀기 전에 SCROLL_TABLE_SQUEEZE 만큼은 줄여 담는다(2026-09-27 패드 UX 감사). 패드 세로에서 표가 들어갈 폭이
  // 742(800 폭) · 712(768 폭)인데 최소 폭이 760 이라 18~48px 때문에 표 전체를 옆으로 밀어야 했다(5개 화면).
  // 말줄임이 칸 안에서 동작하므로(qa-dt-cell) 이만큼 좁아져도 글이 넘치지 않는다. 인쇄 배율은 원래 최소 폭으로 잰다.
  const innerMin = Math.max(0, minWidth - SCROLL_TABLE_SQUEEZE);
  return (
    <div
      className={wrapperCls}
      style={z < 1 ? ({ '--qa-print-zoom': String(z) } as CSSProperties) : undefined}
    >
      <div className="qa-scroll-table-inner" style={{ minWidth: innerMin }}>
        {children}
      </div>
    </div>
  );
}

// ─── DATA TABLE ──────────────────────────────────────────────────────────────
// 테이블형 그리드 프리미티브(디자인 시스템 3단계). 화면마다 손으로 재구현하던
// "헤더 행 + gridTemplateColumns 데이터 행" 을 하나로 통일. columns 의 render(row)
// 로 셀 내용은 자유(복합 셀·배지·버튼·progress 허용)하되, 헤더 톤·행 구분선·패딩·
// 행 클릭/링크·빈 상태를 통일한다. 모바일 가로스크롤·첫 컬럼 고정은 기존 ScrollTable
// 재사용. ★정렬·필터·페이지네이션·펼치기 등 데이터 로직은 상위가 소유(정렬·슬라이스한
//   rows 를 전달): DataTable 은 '표시'만. 순수·재사용.
export interface DataTableColumn<T> {
  key: string;
  /** 헤더 라벨. 생략 시 빈 헤더 셀(폭만 차지, 예: 액션 컬럼). */
  header?: ReactNode;
  /** CSS grid track (예: '110px', '1fr', '1.4fr', 'minmax(0,1fr)'). 기본 'minmax(0, 1fr)'. */
  width?: string;
  align?: 'left' | 'center' | 'right';
  render: (row: T, index: number) => ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  rowHref,
  showHeader = true,
  dividers = 'solid',
  minWidth,
  dense = false,
  stickyFirstCol = false,
  stickyHeader = false,
  empty,
  getRowStyle,
  ariaLabel,
  phoneRow,
  expandedRow,
}: {
  columns: DataTableColumn<T>[];
  rows: readonly T[];
  getRowKey: (row: T, index: number) => string;
  /** 행 클릭 핸들러(rowHref 와 배타). */
  onRowClick?: (row: T) => void;
  /** 행 전체를 Link 로 감싸 이동(onRowClick 와 배타). */
  rowHref?: (row: T) => string;
  /** 헤더 행 표시(기본 true). false 면 헤더 없이 폭 구조만 유지. */
  showHeader?: boolean;
  /** 행 구분선 스타일('none'=구분선 없는 조밀 리스트). */
  dividers?: 'solid' | 'dashed' | 'none';
  /** 모바일 가로스크롤 최소폭(px): 지정 시 ScrollTable 로 감쌈. */
  minWidth?: number;
  dense?: boolean;
  /** 가로 스크롤 시 첫 컬럼 고정(ScrollTable). */
  stickyFirstCol?: boolean;
  /**
   * 세로로 훑을 때 머리글을 따라오게 한다.
   *
   * 🔴 2026-09-09 감사(주제 #11). 100건짜리 목록을 훑으면 머리글이 화면 밖으로
   *    나가고, 그때부터 셋째 칸이 무엇인지 모르고 읽는다. 저장소 전체에서 이것을
   *    한 곳(admin/permissions-matrix)이 손으로 적고 있었다 · 부품이 없어서다.
   *
   * ⚠️ `position: sticky` 는 «세로 한계가 있는 조상» 이 있어야 붙는다.
   *    이 제품은 `<main>` 이 스크롤 host 라(실측 1927/900) 그대로 붙는다.
   *    Q-Forge 는 감싸개가 `overflow-x` 뿐이라 같은 선언이 한 번도 안 붙었다
   *    (그쪽 감사 #8). 새 자리에 걸 때는 조상을 먼저 볼 것.
   */
  stickyHeader?: boolean;
  /** rows 가 비었을 때 표시할 내용. */
  empty?: ReactNode;
  /** 행 단위 스타일(배경 tint·opacity 등): per-row 상태/강조 표현. */
  getRowStyle?: (row: T, index: number) => CSSProperties | undefined;
  ariaLabel?: string;
  /**
   * 폰(폭 599 이하)에서 표 대신 그릴 «카드 줄» 한 줄(보통 `<CardRow …/>`). 주면 폰에서는 이것만, 그 위에서는
   * 표만 보인다(CSS 로 가른다 · PhoneSwap). 2026-09-28 오너 결정 «폰의 표는 카드 줄»: 칸이 한 글자 폭으로
   * 좁아져 글이 세로로 흘러내렸다(운영 규칙표 · 평가 세트 · 폰 412 실측).
   */
  phoneRow?: (row: T, index: number) => ReactNode;
  /**
   * 줄 아래로 펼친 칸(2026-10-20 · 5단계 «장부 표»). 값을 돌려주는 줄만 그 아래에 표 폭 전체의 칸이 하나 더 붙는다
   * (줄 끝 글귀로 연 편집기 · 보조 동작). 펼친 줄과 그 칸은 한 묶음이라 둘 사이에는 선을 긋지 않는다.
   * 폰 카드 줄(phoneRow)은 이것을 읽지 않으므로, 폰에서도 펼치려면 phoneRow 안에서 같은 내용을 그린다.
   */
  expandedRow?: (row: T, index: number) => ReactNode;
}) {
  const template = columns.map((c) => c.width ?? 'minmax(0, 1fr)').join(' ');
  const padY = dense ? 'var(--qd-table-pad-y-dense)' : 'var(--qd-table-pad-y, 11px)';
  const alignItemsOf = (a?: 'left' | 'center' | 'right') =>
    a === 'center' ? 'center' : a === 'right' ? 'flex-end' : 'flex-start';

  const headerRow = showHeader ? (
    <div
      role="row"
      style={{
        display: 'grid',
        gridTemplateColumns: template,
        borderBottom: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}`,
        ...(stickyHeader
          ? { position: 'sticky' as const, top: "var(--qd-atelier-top-13ae86191f)", zIndex: Z.sticky, background: T.surface }
          : null),
      }}
    >
      {columns.map((c) => (
        <div
          key={c.key}
          role="columnheader"
          style={{
            padding: `calc(${padY} + var(--qd-border-width)) var(--qd-table-pad-x, 12px)`,
            textAlign: c.align ?? 'left',
            fontFamily: QDScale.family.mono,
            fontSize: QDScale.font[12],
            fontWeight: "var(--qd-font-weight-medium)",
            letterSpacing: labelTracking(c.header, QDText.tracking.v7c1681a74c),
            wordSpacing: labelWordSpacing(c.header),
            color: T.subtle,
            textTransform: labelCase(c.header),
          }}
        >
          {c.header ?? ''}
        </div>
      ))}
    </div>
  ) : null;

  const body =
    rows.length === 0 ? (
      <div role="row" style={{ padding: "var(--qd-atelier-padding-93bdbf7350)" }}>
        {empty ?? (
          // 한글 문장이라 본문 글꼴 (화면 검토 A44 · 2026-09-28)
          <span style={{ fontSize: QDScale.font[12], color: T.muted, fontFamily: QDScale.family.ui }}>
            표시할 항목이 없습니다.
          </span>
        )}
      </div>
    ) : (
      rows.map((row, i) => {
        const isLast = i === rows.length - 1;
        const expanded = expandedRow?.(row, i) ?? null;
        const ruleBelow = `var(--qd-border-width) ${dividers} ${T.border}`;
        const rowStyle: CSSProperties = {
          display: 'grid',
          gridTemplateColumns: template,
          borderBottom: expanded !== null || isLast || dividers === 'none' ? 'none' : ruleBelow,
          transition: `background ${QD.motionFast}`,
          textDecoration: QDText.textDecoration.v30a0924a33,
          color: 'inherit',
          ...(getRowStyle?.(row, i) ?? {}),
        };
        const cells = columns.map((c) => (
          <div
            key={c.key}
            role="cell"
            // qa-dt-cell: 칸 안의 부품을 칸 폭으로 묶는다(globals.css). 세로 flex 라 자식이 «내용 폭» 으로 서서
            // 한 줄 말줄임 글이 옆 칸 위로 넘쳤다(2026-09-26 패드 점검 · /assessments 허가 전 CR 목록).
            className="qa-dt-cell qd-td"
            style={{
              padding: `${padY} var(--qd-table-pad-x, 12px)`,
              minWidth: "var(--qd-atelier-min-width-f24a3b2189)",
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: alignItemsOf(c.align),
              textAlign: c.align ?? 'left',
              fontSize: 'var(--qd-table-size, 13px)',
              color: T.text,
            }}
          >
            {c.render(row, i)}
          </div>
        ));
        const key = getRowKey(row, i);
        const line = rowHref ? (
          <Link key={key} href={rowHref(row)} role="row" className="qa-row-clickable" style={rowStyle}>
            {cells}
          </Link>
        ) : (
          <div
            key={key}
            role="row"
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={onRowClick ? 'qa-row-clickable' : undefined}
            style={{ ...rowStyle, cursor: onRowClick ? 'pointer' : undefined }}
          >
            {cells}
          </div>
        );
        if (expanded === null) return line;
        return (
          <Fragment key={key}>
            {line}
            <div role="row" style={{ borderBottom: isLast || dividers === 'none' ? 'none' : ruleBelow }}>
              <div role="cell" className="qa-dt-expanded" style={{ padding: `0 var(--qd-table-pad-x, 12px) ${padY}`, minWidth: 0 }}>
                {expanded}
              </div>
            </div>
          </Fragment>
        );
      })
    );

  const content = (
    <div role="table" aria-label={ariaLabel} className="qd-table">
      {headerRow}
      {body}
    </div>
  );

  const table =
    minWidth || stickyFirstCol ? (
      <ScrollTable minWidth={minWidth} stickyFirstCol={stickyFirstCol} tall={stickyHeader}>
        {content}
      </ScrollTable>
    ) : (
      content
    );
  if (!phoneRow) return table;
  return (
    <PhoneSwap
      phone={
        rows.length === 0 ? (
          <div style={{ padding: "var(--qd-atelier-padding-93bdbf7350)" }}>
            {empty ?? <span style={{ fontSize: QDScale.font[12], color: T.muted }}>표시할 항목이 없습니다.</span>}
          </div>
        ) : (
          <CardRows ariaLabel={ariaLabel}>
            {rows.map((row, i) => (
              <Fragment key={getRowKey(row, i)}>{phoneRow(row, i)}</Fragment>
            ))}
          </CardRows>
        )
      }
    >
      {table}
    </PhoneSwap>
  );
}

// ─── 폰 · 패드 (2026-09-28 오너 결정 · 운영 화면 폰 · 패드 다듬기) ───────────────────────
// 폰 = 폭 599 이하(앱이 폰으로 보는 «짧은 변 600 미만» 과 같은 선 · lib/nav/phone-mode.ts PHONE_SHORT_SIDE_MAX).
// 폴드 펼침(약 750) · 패드는 표 · 탭 그대로 쓴다. 가르는 것은 CSS(.qa-phone-only · .qa-phone-hide)라 첫 그림부터 맞다.

/** 같은 자료를 폰에서는 phone 으로, 그 위에서는 children 으로 그린다 */
export function PhoneSwap({ phone, children }: { phone: ReactNode; children: ReactNode }) {
  return (
    <>
      <div className="qa-phone-only">{phone}</div>
      <div className="qa-phone-hide">{children}</div>
    </>
  );
}

/** 카드 줄 묶음: 줄 사이 가는 선(«문서 결» 괘선 · 상자를 겹치지 않는다). 마지막 줄은 선이 없다 */
export function CardRows({ children, ariaLabel }: { children: ReactNode; ariaLabel?: string }) {
  return (
    <div className="qa-card-rows" role="list" aria-label={ariaLabel}>
      {children}
    </div>
  );
}

/**
 * 폰의 «카드 줄» 한 줄(오너 결정 2026-09-28): 첫 줄 = 이름 + 상태 표시, 둘째 줄 = 부가 정보,
 * 셋째 줄 = 숫자, 맨 아래 = 단추. href 를 주면 줄 전체가 링크다(그때는 actions 를 두지 않는다 · 링크 안 단추 금지).
 */
export function CardRow({
  title,
  badge,
  meta,
  figures,
  actions,
  href,
  onClick,
}: {
  title: ReactNode;
  badge?: ReactNode;
  meta?: ReactNode;
  figures?: ReactNode;
  actions?: ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: QDScale.space[2] }}>
        <div
          style={{
            minWidth: "var(--qd-atelier-min-width-f24a3b2189)",
            flex: "var(--qd-atelier-flex-83725d2c6e)",
            fontSize: QDScale.font[14],
            fontWeight: "var(--qd-font-weight-semibold)",
            color: T.text,
            lineHeight: QDScale.leading.snug,
            overflowWrap: 'anywhere',
          }}
        >
          {title}
        </div>
        {badge && (
          <div style={{ flexShrink: 0, display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: QDScale.space[1] }}>
            {badge}
          </div>
        )}
      </div>
      {meta && (
        <div style={{ marginTop: "var(--qd-space-1)", fontSize: QDScale.font[12], color: T.subtle, lineHeight: QDScale.leading.relaxed, overflowWrap: 'anywhere' }}>
          {meta}
        </div>
      )}
      {figures && (
        <div
          style={{
            marginTop: "var(--qd-space-1-5)",
            display: 'flex',
            flexWrap: 'wrap',
            gap: "var(--qd-atelier-gap-813e1ff4f7)",
            fontSize: QDScale.font[13],
            color: T.text,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {figures}
        </div>
      )}
      {actions && (
        <div style={{ marginTop: QDScale.space[2.5], display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: QDScale.space[2] }}>
          {actions}
        </div>
      )}
    </>
  );
  // 목록 항목(줄 사이 선)과 누르는 자리(링크)를 나눈다. 링크에 role 을 덮으면 «링크» 라는 뜻이 사라진다.
  const inner: CSSProperties = { display: 'block', padding: "var(--qd-atelier-padding-634e55ac34)", textDecoration: QDText.textDecoration.v30a0924a33, color: 'inherit' };
  return (
    <div role="listitem" className="qa-card-row" style={{ borderBottom: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}` }}>
      {href ? (
        <Link href={href} className="qa-row-clickable" style={inner}>
          {body}
        </Link>
      ) : (
        <div
          className={onClick ? 'qa-row-clickable' : undefined}
          onClick={onClick}
          style={{ ...inner, cursor: onClick ? 'pointer' : undefined }}
        >
          {body}
        </div>
      )}
    </div>
  );
}

/** 카드 줄 셋째 줄의 «이름 값» 한 쌍 */
export function CardFigure({ label, value, color }: { label: string; value: ReactNode; color?: string }) {
  return (
    <span style={{ whiteSpace: 'nowrap' }}>
      <span style={{ color: T.muted, fontSize: QDScale.font[12] }}>{label} </span>
      <span style={{ color: color ?? T.text, fontWeight: "var(--qd-font-weight-semibold)" }}>{value}</span>
    </span>
  );
}

/**
 * 지표 카드 격자(오너 결정 2026-09-28): 폰(599 이하)은 두 칸 · 개수가 홀수면 마지막 카드가 두 칸을 채운다.
 * 그 위로는 다섯 개까지 한 줄, 여섯 개부터 두 줄로 나눈다. 종전 auto-fit 은 폰에서 한 줄에 하나씩 크게 쌓이고
 * (고객사 현황 다섯 장이 화면 한 장), 패드에서는 3+1 · 4+1 로 하나만 외톨이로 남았다.
 */
export function KpiGrid({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const n = Children.toArray(children).filter(Boolean).length;
  const cols = Math.max(1, n <= QDPresentation.commonDefaults.kpiMaxSingleRow ? n : Math.ceil(n / QDPresentation.commonDefaults.kpiRows));
  return (
    <div className="qa-kpi-grid" style={{ ['--qa-kpi-cols' as string]: cols, ...style } as CSSProperties}>
      {children}
    </div>
  );
}

// ─── ENTITY ROW ──────────────────────────────────────────────────────────────
// 목록 화면의 표준 "항목 행": 아이콘 칩 + (코드/배지 행) + 제목
// 🔑 2026-09-27 «문서 결»(오너 결정 · Q-Design docs/24): 상자(바탕 · 테두리 · 둥근 모서리 · 그림자)와 왼쪽 2px 색 띠를
//    걷고 **괘선 행**으로. 행 사이 가는 선, 상태는 배지 글자와 아이콘 칩 색이 말한다. 누르면 옅은 바탕(qa-row-clickable).
//    accent 는 호출부 호환을 위해 남기고 아이콘 칩 색의 기본값으로만 쓴다.
// + 우측 메타. 이전엔 complaints/vigilance/capa/pms 등 화면마다 거의 동일한
// Link 카드를 각자 손으로 재구현 → 패딩(16 vs 14)·보더(2 vs 3px)·배지 정렬이
// 미세하게 달라 "통일성 없음" 의 주범이었음. 단일 컴포넌트로 통일 + qa-card-lift
// hover 로 럭셔리 마감.
//
// 사용:
//   <EntityRow
//     href={`/complaints/${c.id}`}
//     accent={sevColor}
//     icon={<StatusIcon size={ICON.sizeMd} style={{ color: meta.color }} />}
//     iconColor={meta.color}
//     code={c.code}
//     badges={<><Tag size="xs" color={sev}>…</Tag><Tag size="xs" color={st}>…</Tag></>}
//     title={c.summary}
//     meta={<>인지일 {c.date}</>}
//     right={<DDay … />}
//   />
export function EntityRow({
  href,
  onClick,
  accent,
  icon,
  iconColor,
  code,
  badges,
  title,
  meta,
  right,
}: {
  /** 있으면 Link, 없으면 div(+onClick). */
  href?: string;
  onClick?: () => void;
  /** 상태/심각도 색. 아이콘 칩의 기본 색(2026-09-27 부터 왼쪽 색 띠는 없다). */
  accent: string;
  /** 이미 색을 입힌 아이콘 엘리먼트 (없으면 칩 생략). */
  icon?: ReactNode;
  /** 아이콘 칩 배경 alpha 색 (기본 accent). */
  iconColor?: string;
  /** 코드/식별자: mono champagne 로 통일 렌더. */
  code?: ReactNode;
  /** 배지 묶음. <Tag> 들을 조합해서 전달. */
  badges?: ReactNode;
  /** 제목: serif, 1줄 clamp. */
  title: ReactNode;
  /** 제목 아래 보조 1줄 (선택). */
  meta?: ReactNode;
  /** 우측 정렬 메타 (D-day / 완료 아이콘 등). */
  right?: ReactNode;
}) {
  const chipColor = iconColor ?? accent;
  const interactive = !!href || !!onClick;
  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: QDScale.space[3.5],
    padding: "var(--qd-atelier-padding-8a238426cb)",
    background: 'transparent',
    border: 'none',
    borderBottom: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}`,
    borderRadius: "var(--qd-atelier-border-radius-3bbf9cbec6)",
    textDecoration: QDText.textDecoration.v30a0924a33,
    color: T.text,
    transition: `background ${QD.motionFast}`,
    minHeight: "var(--qd-atelier-min-height-e59744e50f)",
    width: "var(--qd-atelier-width-b7aa1ec004)",
    textAlign: 'left',
    cursor: interactive ? 'pointer' : 'default',
  };

  const inner = (
    <>
      {icon && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: "var(--qd-atelier-width-c2cf54abc1)",
            height: "var(--qd-atelier-height-0fff0a1524)",
            borderRadius: QDScale.radiusFull,
            background: alpha(chipColor, QDRuntime.alpha.tint0_08),
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      )}
      <div style={{ flex: "var(--qd-atelier-flex-83725d2c6e)", minWidth: "var(--qd-atelier-min-width-f24a3b2189)" }}>
        {(code || badges) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: QDScale.space[2],
              marginBottom: "var(--qd-atelier-margin-bottom-9378f643b6)",
              flexWrap: 'wrap',
            }}
          >
            {code && (
              <span
                style={{
                  fontFamily: QDScale.family.mono,
                  fontSize: QDScale.font[12],
                  fontWeight: "var(--qd-font-weight-medium)",
                  letterSpacing: labelTracking(code, QDText.tracking.vae83a9aee5),
                  wordSpacing: labelWordSpacing(code),
                  color: T.champagne,
                }}
              >
                {code}
              </span>
            )}
            {badges}
          </div>
        )}
        <div
          style={{
            fontFamily: QDScale.family.serif,
            fontSize: QDScale.font[14],
            fontWeight: "var(--qd-font-weight-medium)",
            color: T.text,
            lineHeight: QDScale.leading.snug,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 'var(--qd-atelier-line-clamp-single)',
            WebkitBoxOrient: 'vertical',
          }}
        >
          {title}
        </div>
        {meta && (
          <div
            style={{
              fontFamily: QDScale.family.serif,
              fontSize: QDScale.font[13],
              color: T.subtle,
              marginTop: QDScale.space[0.5],
              lineHeight: QDScale.leading.snug,
            }}
          >
            {meta}
          </div>
        )}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
      {/* 누를 수 있는 줄에 절제된 chevron 어포던스. 올리면 옅은 바탕(qa-row-clickable)과 함께. */}
      {(href || onClick) && (
        <span
          aria-hidden
          style={{
            color: T.muted,
            fontSize: QDScale.font[18],
            lineHeight: QDScale.leading.none,
            flexShrink: 0,
            marginLeft: right ? "var(--qd-space-0-5)" : "var(--qd-space-1)",
          }}
        >
          ›
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="qa-row-clickable" style={rowStyle}>
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="qa-row-clickable" style={rowStyle}>
        {inner}
      </button>
    );
  }
  // 비대화형: hover lift / chevron 없음 (잘못된 클릭 어포던스 방지).
  return <div style={rowStyle}>{inner}</div>;
}

// ─── RISK PILL ───────────────────────────────────────────────────────────────
export function RiskPill({ level }: { level?: string }) {
  if (!level) return <span style={{ color: T.muted }}>-</span>;
  const upper = level.toUpperCase();
  const color =
    upper === 'CRITICAL'
      ? T.red
      : upper === 'HIGH'
        ? T.warning
        : upper === 'MEDIUM'
          ? T.champagne
          : upper === 'LOW'
            ? T.green
            : T.muted;
  return <Tag color={color}>{riskLabelKo(upper)}</Tag>;
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
// 접근성 모달 primitive: 하드코딩 position:fixed 모달 대신 항상 이것을 사용.
//   role="dialog" + aria-modal + aria-labelledby (title 자동 연결)
//   Esc 닫기 (capture 단계: 내부 핸들러보다 우선)
//   Tab / Shift+Tab 포커스 트랩 (패널 밖으로 탈출 방지)
//   body 스크롤 잠금 + 닫힐 때 직전 포커스 복원
//   오버레이 mousedown 닫기 (드래그-선택이 밖에서 끝나도 닫히지 않게 onMouseDown 사용)
//   createPortal 로 body 직속 렌더: transform 된 조상(qa-card-lift 등) 안에서
//   position:fixed 가 viewport 가 아닌 조상 기준이 되는 버그 회피.
// 진입 애니메이션 클래스는 의도적으로 생략 (qa-tip-rise 는 translateX(-50%) 가
//   섞여 패널을 어긋나게 함, 그 외 modal 전용 keyframe 부재).
export function Modal({
  open,
  onClose,
  title,
  sub,
  children,
  footer,
  maxWidth,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  sub?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
  /** title 을 쓰지 않고 외부 제목 엘리먼트 id 로 aria-labelledby 를 지정할 때 */
  labelledBy?: string;
}) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const headingId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useModalFocus(open && mounted, panelRef, onClose, { layerRef: overlayRef });

  if (!open || !mounted) return null;

  const content = (
    <div
      ref={overlayRef}
      className="qd-dialog-backdrop"
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      style={{
        position: 'fixed',
        inset: "var(--qd-atelier-inset-4199adc115)",
        background: QD.backdrop,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: QD.overlayPadding,
        zIndex: QD.zModal,
      }}
    >
      <div
        ref={panelRef}
        className="qd-dialog-content"
        data-layout="sections"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy ?? (title ? headingId : undefined)}
        tabIndex={-1}
        style={{
          boxSizing: 'border-box',
          background: QD.surface,
          border: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.borderHi}`,
          borderRadius: QD.radius,
          boxShadow: QD.shadowOverlay, // 테마 인지 그림자(라이트=부드러운 sepia)
          width: "var(--qd-atelier-width-b7aa1ec004)",
          maxWidth: maxWidth ?? QD.dialogWidth,
          maxHeight: 'calc(100dvh - 2 * var(--qd-overlay-padding, 24px))',
          display: 'flex',
          flexDirection: 'column',
          /*
           * 🔑 남겨 두는 outline:none 이다(2026-09-09 감사 · 주제 #2에서 24곳을 걷어냈다).
           * 이 상자는 `tabIndex={-1}` 이라 Tab 순서에 들어오지 않는다. 열릴 때 프로그램이
           * 초점을 주는 자리라, 대화상자 «전체» 에 고리가 그려지면 안쪽 버튼의 고리와
           * 겹쳐 오히려 어디에 있는지 흐려진다. 안쪽 요소들은 전역 :focus-visible 을 받는다.
           */
          outline: 'none',
        }}
      >
        {(title || sub) && (
          <div
            className="qd-dialog-header"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: QDScale.space[3],
              padding: QD.overlayPadding,
              borderBottom: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}`,
            }}
          >
            <div style={{ flex: "var(--qd-atelier-flex-83725d2c6e)", minWidth: "var(--qd-atelier-min-width-f24a3b2189)" }}>
              {title && (
                <div
                  id={headingId}
                  className="qd-dialog-title"
                  style={{
                    fontFamily: QDScale.family.serif,
                    fontSize: QD.overlayTitleSize,
                    fontWeight: "var(--qd-font-weight-semibold)",
                    color: T.text,
                    lineHeight: QDScale.leading.heading,
                  }}
                >
                  {title}
                </div>
              )}
              {sub && (
                <div
                  style={{
                    fontFamily: QDScale.family.serif,
                    fontSize: QDScale.font[13],
                    color: T.subtle,
                    marginTop: QDScale.space[1],
                    lineHeight: QDScale.leading.normal,
                  }}
                >
                  {sub}
                </div>
              )}
            </div>
            <IconBtn title="닫기" onClick={onClose} className="qd-dialog-close">
              ✕
            </IconBtn>
          </div>
        )}
        <div className="qd-dialog-body" style={{ padding: QD.overlayPadding, overflowY: 'auto', flex: "var(--qd-atelier-flex-83725d2c6e)" }}>{children}</div>
        {footer && (
          <div
            className="qd-dialog-actions"
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: QDScale.space[2.5],
              padding: QD.overlayPadding,
              borderTop: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}`,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

// ─────────────────────────────────────────────────────────────────────────────
// Drawer: 측면 슬라이드 패널 (Modal 의 측면 변형·SSOT).
//   portal · body scroll lock · focus trap · Tab cycling · ESC 를 Modal 과 동일
//   메커니즘으로 통일. 우측 패널(Quick Approve·IFU 유추 등) 손제작 position:fixed
//   드로어를 이 프리미티브로 대체: z-index/애니메이션/a11y 제각각이던 것을 일원화.
//   본문 패딩은 자식이 직접 제어(0): 풀블리드 클라이언트(MobileApprovalClient 등) 수용.
// ─────────────────────────────────────────────────────────────────────────────
export function Drawer({
  open,
  onClose,
  title,
  sub,
  icon,
  children,
  footer,
  width = QDPresentation.cssDefaults.drawerWidth,
  side = 'right',
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  sub?: ReactNode;
  /** 헤더 좌측 아이콘(champagne 톤). */
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number | string;
  /**
   * 'bottom' 은 폰의 «아래에서 올라오는 판»이다(2026-09-28 오너 결정 · 운영 허브 고르기). 폭은 화면 전체,
   * 높이는 내용만큼(화면의 85% 까지), 위 두 모서리만 둥글다. width 는 쓰지 않는다.
   */
  side?: 'right' | 'left' | 'bottom';
  /** title 대신 외부 제목 id 로 aria-labelledby 지정 시. */
  labelledBy?: string;
}) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const headingId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useModalFocus(open && mounted, panelRef, onClose, { layerRef: overlayRef });

  if (!open || !mounted) return null;

  const anim = side === 'left' ? 'qa-drawer-slide-l' : side === 'bottom' ? 'qa-drawer-slide-b' : 'qa-drawer-slide-r';
  const place: CSSProperties =
    side === 'bottom'
      ? {
          left: "var(--qd-atelier-left-090a0c84b4)",
          right: "var(--qd-atelier-right-bd2004684d)",
          bottom: "var(--qd-atelier-bottom-99ff6591d8)",
          width: "var(--qd-atelier-width-b7aa1ec004)",
          maxHeight: "var(--qd-atelier-max-height-39454964ea)",
          borderTop: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}`,
          borderTopLeftRadius: QD.radius,
          borderTopRightRadius: QD.radius,
          // 폰의 몸짓 막대(아래 가장자리)에 마지막 줄이 가리지 않게
          paddingBottom: "var(--qd-atelier-padding-bottom-d68136376b)",
        }
      : {
          top: "var(--qd-atelier-top-13ae86191f)",
          bottom: "var(--qd-atelier-bottom-99ff6591d8)",
          [side]: 0,
          width,
          maxWidth: "var(--qd-atelier-max-width-6e15e025f4)",
          [side === 'left' ? 'borderRight' : 'borderLeft']: `1px solid ${T.border}`,
        };

  const content = (
    <div
      ref={overlayRef}
      className="qd-drawer-backdrop"
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      style={{
        position: 'fixed',
        inset: "var(--qd-atelier-inset-4199adc115)",
        background: QD.backdrop,
        zIndex: QD.zOverlay,
      }}
    >
      <style>{drawerMotionRules}</style>
      <div
        ref={panelRef}
        className="qd-drawer-content"
        data-layout="sections"
        data-side={side}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy ?? (title ? headingId : undefined)}
        tabIndex={-1}
        style={{
          position: 'absolute',
          ...place,
          background: QD.surface,
          boxShadow: QD.shadowOverlay,
          display: 'flex',
          flexDirection: 'column',
          /*
           * 🔑 남겨 두는 outline:none 이다(2026-09-09 감사 · 주제 #2에서 24곳을 걷어냈다).
           * 이 상자는 `tabIndex={-1}` 이라 Tab 순서에 들어오지 않는다. 열릴 때 프로그램이
           * 초점을 주는 자리라, 대화상자 «전체» 에 고리가 그려지면 안쪽 버튼의 고리와
           * 겹쳐 오히려 어디에 있는지 흐려진다. 안쪽 요소들은 전역 :focus-visible 을 받는다.
           */
          outline: 'none',
          animation: `${anim} ${QD.motionNormal}`,
        }}
      >
        {(title || sub || icon) && (
          <div
            className="qd-drawer-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: QDScale.space[2.5],
              padding: QD.overlayPadding,
              borderBottom: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}`,
              flexShrink: 0,
            }}
          >
            {icon && (
              <span style={{ display: 'inline-flex', color: T.champagne, flexShrink: 0 }}>{icon}</span>
            )}
            <div style={{ flex: "var(--qd-atelier-flex-83725d2c6e)", minWidth: "var(--qd-atelier-min-width-f24a3b2189)" }}>
              {title && (
                <div
                  id={headingId}
                  className="qd-drawer-title"
                  style={{ fontFamily: QDScale.family.serif, fontSize: QD.overlayTitleSize, fontWeight: "var(--qd-font-weight-semibold)", color: T.text, lineHeight: QDScale.leading.heading }}
                >
                  {title}
                </div>
              )}
              {sub && (
                <div
                  style={{ fontFamily: QDScale.family.mono, fontSize: QDScale.font[12], color: T.muted, letterSpacing: "var(--qd-atelier-letter-spacing-c7e9f7cfec)", marginTop: "var(--qd-atelier-margin-top-9c745fb12c)" }}
                >
                  {sub}
                </div>
              )}
            </div>
            <IconBtn title="닫기" onClick={onClose} className="qd-dialog-close">
              ✕
            </IconBtn>
          </div>
        )}
        <div className="qd-drawer-body" style={{ padding: "var(--qd-space-0)", flex: "var(--qd-atelier-flex-83725d2c6e)", overflowY: 'auto' }}>{children}</div>
        {footer && (
          <div
            className="qd-drawer-actions"
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: QDScale.space[2.5],
              padding: QD.overlayPadding,
              borderTop: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}`,
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

// ─────────────────────────────────────────────────────────────────────────────
// batteryColor: 진행률(0~100) → 색. 배터리처럼 빨강→노랑→초록 보간(hsl).
//   0% 빨강(0°) · 50% 노랑(~62°) · 100% 초록(125°). ProgressRing color 등에 사용.
// ─────────────────────────────────────────────────────────────────────────────
export function batteryColor(pct: number): string {
  const c = Math.max(0, Math.min(100, pct));
  const hue = (c / 100) * QDPresentation.visual.battery.maximumHue;
  return `hsl(${Math.round(hue)}, ${QDPresentation.visual.battery.saturation}%, ${QDPresentation.visual.battery.lightness}%)`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ProgressRing: 원형 진행률 도넛 (SVG). 홈 R&D 흐름 카드 등에서 사용.
//   pct: 0~100, size: 지름(px), stroke: 링 두께, color: 진행 색(기본 champagne).
//   가운데에 children(보통 "72%") 표시. 트랙은 border 색.
// ─────────────────────────────────────────────────────────────────────────────
export function ProgressRing({
  pct,
  size = QDPresentation.progressSize[56],
  stroke = QDPresentation.progressStroke[5],
  color,
  trackColor,
  children,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  children?: ReactNode;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (clamped / 100) * c;
  const ring = color ?? T.champagne;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: QDPresentation.visual.rotation.negativeQuarter }} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor ?? T.border} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={ring}
          strokeWidth={stroke}
          strokeLinecap={QDPresentation.visual.ring.lineCap}
          strokeDasharray={`${dash} ${c - dash}`}
          style={{ transition: `stroke-dasharray ${QD.motionFast}` }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: "var(--qd-atelier-inset-4199adc115)",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: QDScale.family.mono,
          fontSize: size <= QDPresentation.visual.ring.captionThreshold ? QD.captionSize : QD.controlSize,
          fontWeight: "var(--qd-font-weight-semibold)",
          color: T.text,
          letterSpacing: "var(--qd-atelier-letter-spacing-0eb1693ce1)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StageTimeline: 가로 단계 타임라인 (원형 노드 + 연결선)
//   인허가 로드맵(RegulatoryRoadmap)과 변경평가 흐름(RevisionRowExpandable)이
//   공유하는 시각 SSOT. 노드의 색·마커·캡션·선택여부는 호출측이 계산해 넘기고,
//   이 컴포넌트는 "큰 원형 노드 + serif 라벨 + 굵은 연결선" 형태만 책임진다.
//   → 두 화면이 항상 같은 디자인. 색 정책(R&D 상태색 vs 변경평가 단계 고유색)은
//     각 호출측이 자기 의미에 맞게 넘기므로 정보는 보존된다.
// ─────────────────────────────────────────────────────────────────────────────
export type StageMarker = 'check' | 'dot' | 'circle' | 'cancel' | 'none';

export interface StageTimelineNode {
  id: string;
  /** 노드 아래 라벨 (serif) */
  label: string;
  /** 이 노드의 기준 색 (상태색 또는 단계 고유색) */
  color: string;
  /** 노드 원 안 마커 */
  marker: StageMarker;
  /** 원을 color 로 채울지 (done 류: 채우면 마커는 대비색) */
  filled?: boolean;
  /** 선택 강조: champagne ring + glow (R&D 단계 필터 선택용) */
  selected?: boolean;
  /** 라벨·캡션 강조 (현재 단계) */
  emphasis?: boolean;
  /** 노드 아래 부가 정보 (카운트 / 날짜·일수·RA·QA 등) */
  caption?: ReactNode;
  /** 이 노드 → 다음 노드 사이 연결선 색 (기본 흐린 회색) */
  connectorColor?: string;
  /** 클릭 핸들러 (R&D 단계 필터). 없으면 표시 전용. */
  onClick?: () => void;
  title?: string;
}

export function StageTimeline({
  nodes,
  nodeMinWidth = QDPresentation.commonDefaults.stageNodeMinWidth,
  fill = false,
}: {
  nodes: StageTimelineNode[];
  /** 각 노드 최소 폭 (단계 수가 적으면 넓게) */
  nodeMinWidth?: number;
  /**
   * true 면 컨테이너 전체 폭에 노드를 균등 분배(연결선이 공간을 채움).
   * 단계 수가 적은 변경평가 흐름용: 좌측 쏠림 방지. 기본 false(R&D 로드맵:
   * 단계가 많아 fit-content + 가로 스크롤).
   */
  fill?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: fill ? "var(--qd-atelier-gap-dfec023665)" : "var(--qd-atelier-gap-ab5acf201a)",
        minWidth: fill ? undefined : "var(--qd-atelier-min-width-73e2326cbc)",
        width: fill ? "var(--qd-atelier-width-b7aa1ec004)" : undefined,
        position: 'relative',
      }}
    >
      {nodes.map((n, i) => (
        <StageTimelineItem
          key={n.id}
          node={n}
          isLast={i === nodes.length - 1}
          nodeMinWidth={nodeMinWidth}
          fill={fill}
        />
      ))}
    </div>
  );
}

function StageTimelineItem({
  node,
  isLast,
  nodeMinWidth,
  fill,
}: {
  node: StageTimelineNode;
  isLast: boolean;
  nodeMinWidth: number;
  fill: boolean;
}) {
  const { color, marker, filled, selected, emphasis, caption, connectorColor, onClick, title, label } =
    node;
  const interactive = !!onClick;

  const inner = (
    <>
      {/* 원형 노드 */}
      <div
        style={{
          width: "var(--qd-atelier-width-1ea5e112d4)",
          height: "var(--qd-atelier-height-bab11f1424)",
          borderRadius: "var(--qd-atelier-border-radius-f44e751c2d)",
          background: selected ? T.champagne : filled ? color : 'transparent',
          border: `${selected ? QDPresentation.visual.stroke.selected : QDPresentation.visual.stroke.emphasis}px var(--qd-atelier-border-style-5ed175bd8d) ${selected ? T.champagne : color}`,
          boxShadow: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: `background ${QD.motionNormal}, border-color ${QD.motionNormal}`,
          flexShrink: 0,
        }}
      >
        {selected ? (
          // 선택: 진하게 채운 도트 (high contrast)
          <span style={{ width: "var(--qd-atelier-width-732e621989)", height: "var(--qd-atelier-height-95e4053dfa)", borderRadius: "var(--qd-atelier-border-radius-f44e751c2d)", background: T.bg }} />
        ) : marker === 'check' ? (
          <CheckCircle2 size={QDPresentation.iconSize[20]} style={{ color: T.bg }} />
        ) : marker === 'cancel' ? (
          <span style={{ fontSize: QDScale.font[16], color, fontWeight: "var(--qd-font-weight-bold)", lineHeight: QDScale.leading.none }}>✕</span>
        ) : marker === 'dot' ? (
          <span style={{ width: "var(--qd-atelier-width-7001be5058)", height: "var(--qd-atelier-height-7ec4898503)", borderRadius: "var(--qd-atelier-border-radius-f44e751c2d)", background: color }} />
        ) : marker === 'circle' ? (
          <Circle size={QDPresentation.iconSize[18]} style={{ color, opacity: "var(--qd-atelier-opacity-fab5edc654)" }} />
        ) : null}
      </div>

      {/* 라벨 + 캡션 */}
      <div style={{ textAlign: 'center', minHeight: "var(--qd-atelier-min-height-73cf042009)" }}>
        <div
          style={{
            fontSize: QD.captionSize,
            color: selected ? T.champagne : emphasis ? T.text : filled ? T.subtle : T.muted,
            fontFamily: QDScale.family.serif,
            fontWeight: selected || emphasis ? "var(--qd-font-weight-bold)" : "var(--qd-font-weight-normal)",
            letterSpacing: "var(--qd-atelier-letter-spacing-7ced33ba9c)",
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
        {caption != null && <div style={{ marginTop: QDScale.space[0.5] }}>{caption}</div>}
      </div>
    </>
  );

  const sharedStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: QDScale.space[2],
    padding: "var(--qd-atelier-padding-62190e055c)",
    background: 'transparent',
    border: 'none',
    minWidth: nodeMinWidth,
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        // fill 모드: 마지막 외 항목은 flex:1 로 공간 균등 분배(노드 고정 + 연결선 가변).
        flex: fill && !isLast ? "var(--qd-atelier-flex-b8d2a02f9a)" : "var(--qd-atelier-flex-8037400c24)",
        minWidth: "var(--qd-atelier-min-width-f24a3b2189)",
      }}
    >
      {interactive ? (
        <button
          type="button"
          onClick={onClick}
          className="qd-step"
          aria-current={selected ? 'step' : undefined}
          title={title}
          style={{ ...sharedStyle, cursor: 'pointer', color: 'inherit' }}
        >
          {inner}
        </button>
      ) : (
        <div title={title} style={sharedStyle}>
          {inner}
        </div>
      )}

      {/* 연결선: fill 이면 flex:1 로 늘어나 노드 사이를 균등하게 벌림 */}
      {!isLast && (
        <div
          style={{
            flex: fill ? "var(--qd-atelier-flex-b8d2a02f9a)" : "var(--qd-atelier-flex-8037400c24)",
            width: fill ? 'auto' : "var(--qd-atelier-width-1ea5e112d4)",
            minWidth: fill ? "var(--qd-atelier-min-width-a3f66ba00d)" : undefined,
            height: "var(--qd-atelier-height-a237b38548)",
            background: connectorColor ?? alpha(T.muted, QDRuntime.alpha.tint0_3),
            marginTop: QDScale.space[6],
            transition: "var(--qd-atelier-transition-325a3097b9)",
          }}
        />
      )}
    </div>
  );
}

// ─── STAT · STAT GRID (요약 지표) ─────────────────────────────────────────────
// 상세 화면 상단의 «작은 라벨 + 큰 값» 요약 블록. 2026-08-06 품질목표·회수·피드백
// 세 모듈이 각자 로컬로 같은 컴포넌트를 정의했고(피드백만 글자 크기·color prop 이
// 달라 미묘하게 어긋났다) 여기로 합쳤다. 새 모듈은 이걸 import 할 것.
//
// 사용:
//   <StatGrid>
//     <Stat label="목표치" value="2건" />
//     <Stat label="달성률" value="67%" color={T.red} />
//   </StatGrid>
export function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: ReactNode;
  /** 값 색상: 위험/경고 강조용. 미지정이면 기본 텍스트색. */
  color?: string;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: QDScale.family.mono,
          fontSize: QDScale.font[12],
          color: T.muted,
          letterSpacing: labelTracking(label, QDText.tracking.v7c1681a74c),
          wordSpacing: labelWordSpacing(label),
          textTransform: labelCase(label),
          marginBottom: QDScale.space[1],
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: QDScale.font[14], fontWeight: "var(--qd-font-weight-semibold)", color: color ?? T.text }}>{value}</div>
    </div>
  );
}

/** Stat 을 담는 반응형 그리드: 좁아지면 자동 줄바꿈. */
export function StatGrid({ children, minCol }: { children: ReactNode; minCol?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minCol === undefined ? 'var(--qd-kpi-min-width)' : `${minCol}px`}), 1fr))`,
        minWidth: 0,
        gap: QDScale.space[3],
      }}
    >
      {children}
    </div>
  );
}

/**
 * DetailRow: 상세 화면의 «속성 한 줄». 장부 두 칸(이름 칸 · 값 칸)의 한 줄이다.
 *
 * `Stat` 의 가로형 짝이다. `Stat` 은 라벨이 위·값이 아래(요약 그리드용),
 * 이쪽은 라벨과 값이 한 줄에 마주 본다(상세 나열용).
 * 2026-08-06 D4: lots/[id] 와 udi/[id] 가 **바이트 단위로 같은** 지역 정의를
 * 각자 갖고 있었다(복사-붙여넣기).
 * 2026-10-15 오너 결정(용어집 시안 A): 라벨 왼쪽 · 값 오른쪽 끝(사이가 휑하게 벌어짐)에서
 * «이름 칸 + 값 칸» 장부로 바꿨다. 줄 사이는 가는 선, 상자 없음. 반드시 `Ledger` 안에 둔다(dt · dd).
 */
export function DetailRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="qa-ledger-row">
      <dt className="qa-ledger-label">{label}</dt>
      <dd className="qa-ledger-value">{value}</dd>
    </div>
  );
}

/**
 * Ledger: 이름 · 값 목록을 담는 장부(dl). 담긴 자리의 폭이 420 아래면 이름 위 · 값 아래로 쌓는다.
 * 겉 상자(Bx · 테두리 div)로 감싸지 않는다: 줄 사이 선이 이미 묶음을 보여 준다.
 */
export function Ledger({ children, ariaLabel, className }: { children: ReactNode; ariaLabel?: string; className?: string }) {
  return (
    <dl className={className ? `qa-ledger ${className}` : 'qa-ledger'} aria-label={ariaLabel}>
      {children}
    </dl>
  );
}

/** 한 칸에서 상세 머리를 올릴 기준: 바깥 상자의 scroll-margin-top(폰 상단 바 높이)보다 위로 갔으면 올린다 */
function listDetailAboveFold(host: HTMLElement): boolean {
  return host.getBoundingClientRect().top < (parseFloat(getComputedStyle(host).scrollMarginTop) || 0);
}

/** 목록 + 상세에서 한 칸만 보일 때(담긴 자리 700 아래)인가: 상세 칸이 숨었거나 목록 칸이 숨었으면 한 칸이다 */
function listDetailSingle(host: HTMLElement | null): boolean {
  const list = host?.querySelector<HTMLElement>('.qa-ld-list');
  const detail = host?.querySelector<HTMLElement>('.qa-ld-detail');
  if (!list || !detail) return false;
  return getComputedStyle(list).display === 'none' || getComputedStyle(detail).display === 'none';
}

/**
 * ListDetail: 왼쪽 목록 · 오른쪽 상세(2026-10-15 오너 결정 · 용어집 시안 C).
 *
 * 화면 폭이 아니라 «담긴 자리의 폭» 을 본다(@container). 용어집은 전용 화면과 AI 도우미의 좁은 탭이
 * 같은 부품이라, 같은 화면 폭에서도 자리마다 한 칸 · 두 칸이 갈린다.
 *   · 두 칸(700 이상): 목록과 상세가 각자 굴러간다. 선택은 면 색 + 굵은 제목(왼쪽 강조선 금지).
 *   · 한 칸: `view` 가 보일 칸을 고른다. 상세 위에 «← 목록» 글귀가 선다.
 * 목록에서 ↑ ↓ (Home · End)로 줄을 옮긴다. 두 칸이면 옮기는 즉시 상세가 바뀌고, 한 칸이면 초점만 옮긴다.
 * 선택 · 보기 상태는 쓰는 쪽이 쥔다(고르면 view 를 'detail' 로, 뒤로는 'list' 로).
 */
export function ListDetail({
  list,
  detail,
  view,
  onBack,
  detailKey,
  listLabel,
  detailLabel,
  backLabel = '목록',
  height,
}: {
  list: ReactNode;
  detail: ReactNode;
  /** 한 칸일 때 보일 칸 */
  view: 'list' | 'detail';
  /** «← 목록» 을 눌렀을 때(한 칸에서만 보인다) */
  onBack: () => void;
  /** 상세가 바뀌는 열쇠(고른 항목 id). 바뀌면 상세가 맨 위에서 살짝 떠오른다 */
  detailKey?: string | number;
  listLabel: string;
  detailLabel: string;
  backLabel?: string;
  /** 두 칸일 때 높이(CSS 값). 기본은 화면 높이에 맞춘 값 */
  height?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const firstView = useRef(true);

  // 상세가 바뀌면 상세 칸은 맨 위부터. 두 칸이면 상세 칸이 스스로 굴러가고,
  // 한 칸이면 바깥(main · 서랍)이 굴러가므로 상세 머리가 화면 위로 지나갔을 때만 되돌린다(같은 분야 · 다음 건으로 건너갈 때)
  useEffect(() => {
    if (detailRef.current) detailRef.current.scrollTop = 0;
    const host = hostRef.current;
    if (host && view === 'detail' && listDetailSingle(host) && listDetailAboveFold(host)) host.scrollIntoView({ block: 'start' });
  }, [detailKey]);

  // 한 칸에서 칸을 바꾸면: 상세로 가면 상세 머리로 초점 · 화면을, 목록으로 오면 고른 줄로 되돌린다
  useEffect(() => {
    if (firstView.current) {
      firstView.current = false;
      return;
    }
    const host = hostRef.current;
    if (!host || !listDetailSingle(host)) return;
    if (view === 'detail') {
      // 목록 아래쪽에서 골랐으면 상세 머리(← 목록)까지 올린다
      if (listDetailAboveFold(host)) host.scrollIntoView({ block: 'start' });
      detailRef.current?.focus({ preventScroll: true });
    } else {
      const row = host.querySelector<HTMLElement>('.qa-ld-row[aria-current="true"]');
      row?.scrollIntoView({ block: 'center' });
      row?.focus({ preventScroll: true });
    }
  }, [view]);

  const onListKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;
    const rows = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[data-ld-row]'));
    const at = rows.indexOf(document.activeElement as HTMLButtonElement);
    if (at < 0) return;
    e.preventDefault();
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? rows.length - 1 : Math.min(rows.length - 1, Math.max(0, at + (e.key === 'ArrowDown' ? 1 : -1)));
    const row = rows[to];
    row.focus();
    if (!listDetailSingle(hostRef.current)) row.click();
  };

  return (
    <div className="qa-ld-host" ref={hostRef}>
      <div className="qa-ld" data-view={view} style={height ? ({ ['--qa-ld-height' as string]: height } as CSSProperties) : undefined}>
        <section className="qa-ld-list" aria-label={listLabel} onKeyDown={onListKey}>
          {list}
        </section>
        <section className="qa-ld-detail" aria-label={detailLabel} ref={detailRef} tabIndex={-1}>
          <button type="button" className="qa-ld-back" onClick={onBack}>
            ← {backLabel}
          </button>
          <div key={detailKey} className="qa-ld-in">
            {detail}
          </div>
        </section>
      </div>
    </div>
  );
}

/** 목록 칸의 묶음 머리(분류 이름 + 건수). 두 칸일 때 목록 위에 붙어 따라온다 */
export function ListDetailGroup({ title, count }: { title: ReactNode; count?: number }) {
  return (
    <div className="qa-ld-gh">
      <span>{title}</span>
      {count != null && <span className="qa-ld-n">{count}</span>}
    </div>
  );
}

/**
 * 목록 칸의 한 줄. 고르면 면 색이 깔리고 제목이 굵어진다(aria-current).
 * 두 칸에서 이전 · 다음으로 고른 줄이 목록 밖으로 나가면 목록 칸만 굴려 보이게 한다(바깥 화면은 굴리지 않는다).
 */
export function ListDetailRow({
  selected,
  onSelect,
  title,
  sub,
  code,
  label,
}: {
  selected: boolean;
  onSelect: () => void;
  title: ReactNode;
  sub?: ReactNode;
  /** 제목이 약어 · 번호(DHF · ISO 13485 · CAPA-0012)면 고정폭 글꼴 */
  code?: boolean;
  /** 낭독기 이름(보이는 제목이 앞에 와야 한다) */
  label?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const row = ref.current;
    const box = row?.closest<HTMLElement>('.qa-ld-list');
    if (!selected || !row || !box || box.scrollHeight <= box.clientHeight) return;
    if (getComputedStyle(box).overflowY === 'visible') return;
    const r = row.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    if (r.top < b.top + 40) box.scrollTop -= b.top + 40 - r.top;
    else if (r.bottom > b.bottom) box.scrollTop += r.bottom - b.bottom;
  }, [selected]);
  return (
    <button
      ref={ref}
      type="button"
      className="qa-ld-row"
      data-ld-row=""
      aria-current={selected ? 'true' : undefined}
      aria-label={label}
      onClick={onSelect}
    >
      <span className={code ? 'qa-ld-row-title is-code' : 'qa-ld-row-title'}>{title}</span>
      {sub != null && sub !== '' && <span className="qa-ld-row-sub">{sub}</span>}
    </button>
  );
}

/**
 * 상세 칸의 머리: 위치 줄(번호 · 분류 · 몇 번째) → 큰 제목 → 곁말 → 한 줄 요약.
 * 제목이 약어 · 번호면 `code` 로 고정폭 금색 큰 글자(용어집 시안 C 의 얼굴).
 */
export function ListDetailHead({
  kicker,
  position,
  title,
  code,
  aside,
  lede,
}: {
  kicker?: ReactNode;
  /** 오른쪽 끝의 «3 / 140» */
  position?: string;
  title: ReactNode;
  code?: boolean;
  aside?: ReactNode;
  lede?: ReactNode;
}) {
  return (
    <header>
      {(kicker != null || position) && (
        <div className="qa-ld-kicker">
          {kicker}
          {position && <span className="is-end">{position}</span>}
        </div>
      )}
      <h2 className={code ? 'qa-ld-title is-code' : 'qa-ld-title'}>{title}</h2>
      {aside != null && aside !== '' && <p className="qa-ld-aside">{aside}</p>}
      {lede != null && lede !== '' && <p className="qa-ld-lede">{lede}</p>}
    </header>
  );
}

/** 상세 칸 바닥의 이전 · 다음 글귀. 끝이면 그쪽 자리를 비운다 */
export function ListDetailNav({
  prev,
  next,
  onPrev,
  onNext,
  disabled,
}: {
  prev?: string;
  next?: string;
  onPrev: () => void;
  onNext: () => void;
  /** 보내는 중(결재 서명 등)에는 건너가지 못하게 */
  disabled?: boolean;
}) {
  return (
    <nav className="qa-ld-nav" aria-label="이전 · 다음">
      {prev ? <TextAction onClick={onPrev} disabled={disabled} label={`이전: ${prev}`}>← {prev}</TextAction> : <span />}
      {next ? <TextAction onClick={onNext} disabled={disabled} label={`다음: ${next}`}>{next} →</TextAction> : <span />}
    </nav>
  );
}

/**
 * WorkspaceTab: 워크스페이스 상단 탭. 라벨 + 건수 + 부제(한 줄 설명).
 *
 * 이름에 «Workspace» 를 넣은 이유: 앱에는 다른 형태의 탭 버튼도 있다
 * (login 의 단순 children 형, AiHelperButton 의 aria-controls 형).
 * 그것들을 이 이름이 가리지 않도록 역할을 이름에 박아 둔다.
 * 2026-08-06 D4: qa·ra 워크스페이스가 **48줄 완전히 같은** 지역 정의를 갖고 있었다.
 */
export function WorkspaceTab({
  active,
  onClick,
  label,
  count,
  countUnit,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  /** 건수가 무엇을 세는지(예: 「제품」). 탭 이름과 다른 것을 셀 때 붙인다 · 화면 검토 A89 */
  countUnit?: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "var(--qd-atelier-padding-78aea79b63)",
        background: 'transparent',
        border: 'none',
        borderBottom: `var(--qd-border-width-2) var(--qd-atelier-border-style-5ed175bd8d) ${active ? T.champagne : 'transparent'}`,
        color: active ? T.text : T.muted,
        fontFamily: QDScale.family.serif,
        fontSize: QDScale.font[14],
        fontWeight: active ? "var(--qd-font-weight-semibold)" : "var(--qd-font-weight-normal)",
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div>
        {label} <span style={{ color: T.champagne, fontWeight: "var(--qd-font-weight-medium)" }}>({countUnit ? `${countUnit} ${count}` : count})</span>
      </div>
      <div
        style={{
          fontSize: QDScale.font[12],
          color: T.muted,
          fontFamily: QDScale.family.mono,
          letterSpacing: labelTracking(sub, QDText.tracking.vd2cbad71ff),
          wordSpacing: labelWordSpacing(sub),
          marginTop: "var(--qd-atelier-margin-top-9c745fb12c)",
          textTransform: labelCase(sub),
        }}
      >
        {sub}
      </div>
    </button>
  );
}
