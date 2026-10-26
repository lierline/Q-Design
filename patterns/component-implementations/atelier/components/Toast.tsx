'use client';

import { QDText } from '@/lib/design/q-design-labels';
import { QDPresentation } from '@/lib/design/q-design-runtime';
import { QDScale } from '@/lib/design/q-design-scale';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2 } from '@/components/q-design-icons/CheckCircle2';
import { AlertCircle } from '@/components/q-design-icons/AlertCircle';
import { Info } from '@/components/q-design-icons/Info';
import { AlertTriangle } from '@/components/q-design-icons/AlertTriangle';
import { F, FS, LH, S, T, alpha } from '@/lib/design/tokens';
import { QD } from '@/lib/design/q-design-contract';
import { QDRuntime } from '@/lib/design/q-design-runtime';

type ToastKind = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  kind: ToastKind;
  title?: string;
  message: string;
  ttlMs: number;
}

interface ToastContextValue {
  show: (kind: ToastKind, message: string, opts?: { title?: string; ttlMs?: number }) => void;
  success: (message: string, opts?: { title?: string; ttlMs?: number }) => void;
  error: (message: string, opts?: { title?: string; ttlMs?: number }) => void;
  info: (message: string, opts?: { title?: string; ttlMs?: number }) => void;
  warning: (message: string, opts?: { title?: string; ttlMs?: number }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let _idSeq = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback(
    (kind: ToastKind, message: string, opts?: { title?: string; ttlMs?: number }) => {
      const id = _idSeq++;
      const ttl = opts?.ttlMs ?? (kind === 'error' ? QDPresentation.interactionMotion.toastError : QDPresentation.interactionMotion.toastDefault);
      setItems((prev) => [...prev, { id, kind, message, title: opts?.title, ttlMs: ttl }]);
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, ttl);
    },
    []
  );

  // value 객체를 매 렌더마다 새로 만들면 모든 useToast 컨슈머가 매번 새 ref 를
  // 받아 다시 렌더링되고, 그게 다른 컴포넌트의 useEffect 디펜던시 비교를 깨서
  // 메시지 페이지 같은 곳에서 무한 재로딩 루프를 일으켰음 (router.refresh →
  // 레이아웃 재렌더 → ToastProvider 재렌더 → 새 value → useToast 새 ref →
  // loadConversation 새 ref → useEffect 재실행 → 다시 router.refresh ...)
  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (m, o) => show('success', m, o),
      error: (m, o) => show('error', m, o),
      info: (m, o) => show('info', m, o),
      warning: (m, o) => show('warning', m, o),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Viewport items={items} onDismiss={(id) => setItems((p) => p.filter((t) => t.id !== id))} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback for SSR or unmounted contexts
    return {
      show: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
      warning: () => {},
    };
  }
  return ctx;
}

const KIND_COLOR: Record<ToastKind, string> = {
  success: T.green,
  error: T.red,
  info: T.blue,
  warning: T.warning,
};

const KIND_ICON: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

function Viewport({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div
      // WCAG 4.1.3: aria-live 영역: 각 toast 는 ToastBubble 의 role 로 보조기기에 전달.
      // aria-live="polite" 로 컨테이너를 살아있는 영역으로 선언하되
      // 개별 bubble 에 role="alert"(error/warning) / role="status"(info/success) 부여.
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: 'fixed',
        // M4: safe-area-inset 인지: 노치/Dynamic Island 가 toast 를 가리지 않게.
        top: "var(--qd-toast-inset-top)",
        right: "var(--qd-toast-inset-right)",
        zIndex: QD.zToast,
        display: 'flex',
        flexDirection: 'column',
        gap: QDScale.space[2.5],
        pointerEvents: 'none',
        width: "var(--qd-toast-width)",
      }}
    >
      {items.map((t) => (
        <ToastBubble key={t.id} t={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastBubble({ t, onDismiss }: { t: ToastItem; onDismiss: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const c = KIND_COLOR[t.kind];
  const Icon = KIND_ICON[t.kind];
  // error 일 때 가벼운 shake: prefers-reduced-motion 사용자는 globals.css 가
  // qa-shake 애니메이션을 자동 무효화 (animation: none).
  const shakeClass = t.kind === 'error' ? 'qa-toast-shake' : '';

  return (
    <div
      className={`qd-toast ${shakeClass}`}
      data-kind={t.kind}
      // WCAG 4.1.3: error/warning = role="alert"(assertive), 그 외 = role="status"(polite)
      role={t.kind === 'error' || t.kind === 'warning' ? 'alert' : 'status'}
      aria-atomic="true"
      style={{
        pointerEvents: 'auto',
        opacity: mounted ? "var(--qd-atelier-opacity-dc43f5a623)" : "var(--qd-atelier-opacity-b53823ac50)",
        transform: mounted ? QDPresentation.visual.motion.settled : QDPresentation.visual.motion.toastHidden,
        transition: `opacity ${QD.motionNormal}, transform ${QD.motionNormal}`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: QDScale.space[3],
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 아이콘: 좌측 정렬, kind 색 */}
      <Icon
        size={QDPresentation.iconSize[18]}
        strokeWidth={1.8}
        color={c}
        style={{ flexShrink: 0, marginTop: t.title ? "var(--qd-atelier-margin-top-ebd484e183)" : "var(--qd-space-0)" }}
        aria-hidden
      />

      <div style={{ flex: "var(--qd-atelier-flex-83725d2c6e)", minWidth: "var(--qd-space-0)" }}>
        {t.title && (
          <div
            style={{
              fontSize: QD.captionSize,
              color: c,
              fontFamily: QDScale.family.ui,
              letterSpacing: "var(--qd-atelier-letter-spacing-1029873b1c)",
              textTransform: QDText.textTransform.v30a0924a33,
              marginBottom: QDScale.space[1],
              fontWeight: "var(--qd-font-weight-medium)",
            }}
          >
            {t.title}
          </div>
        )}
        <div
          style={{
            fontSize: QD.controlSize,
            color: T.text,
            lineHeight: QDScale.leading.relaxed,
          }}
        >
          {t.message}
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
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
          transition: `color ${QD.motionFast}`,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = T.text)}
        onMouseLeave={(e) => (e.currentTarget.style.color = T.muted)}
      >
        ×
      </button>

      {/* TTL progress bar: 하단 1px champagne 가 0%까지 줄어듦 */}
      <div
        style={{
          position: 'absolute',
          left: "var(--qd-atelier-left-090a0c84b4)",
          right: "var(--qd-atelier-right-bd2004684d)",
          bottom: "var(--qd-atelier-bottom-99ff6591d8)",
          height: "var(--qd-atelier-height-a237b38548)",
          background: alpha(c, QDRuntime.alpha.tint0_15),
          overflow: 'hidden',
        }}
        aria-hidden
      >
        <div
          style={{
            height: "var(--qd-atelier-height-26ecbf76a0)",
            background: c,
            transformOrigin: 'left',
            animation: `qa-toast-progress ${t.ttlMs}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}
