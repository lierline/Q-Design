// =============================================================================
// components/AIQuickAccessFab.tsx: 모든 (app) 화면 우하단 AI 단축 액세스
// =============================================================================
// 사용자 비전 "손가락 톡톡 클릭": 모든 화면에서 1-tap 으로 AI 기능 접근.
//
// 동작:
//   1. 우하단 둥근 ✨ 버튼 (FAB: Floating Action Button)
//   2. Tap → 메뉴 expand:
//        - 📝 IFU AI 초안
//        - (다음 sprint) 🛡 Risk Assessment
//        - (다음 sprint) 🔄 Change Request
//        - (다음 sprint) 🎤 음성 명령
//   3. 메뉴 항목 tap → 해당 라우트 이동
//   4. 외부 클릭 / ESC → 닫기
//
// 모바일 우선:
//   - 우하단 safe-area-inset 적용 (iOS notch / home indicator)
//   - 64px touch target (WCAG 2.5.5)
//   - 큰 emoji + 짧은 라벨

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  X,
  Check,
  MessageCircle,
  ScanSearch,
  type LucideIcon,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { F, FS, ICON, MOTION, RADIUS, S, SHADOW, T, Z, alpha } from '@/lib/design/tokens';

// AI 도구 드로어는 "열 때만" 로드(lazy): 모든 화면에 상시 얹히지 않도록.
// 닫혀 있을 땐 아래에서 조건부 렌더(미마운트)라 초기 번들/런타임 비용 0.
const AiHelperButton = dynamic(
  () => import('@/components/AiHelperButton').then((m) => ({ default: m.AiHelperButton })),
  { ssr: false },
);
const IfuClassifyDrawer = dynamic(
  () => import('@/components/IfuClassifyDrawer').then((m) => ({ default: m.IfuClassifyDrawer })),
  { ssr: false },
);
const QuickApproveDrawer = dynamic(
  () => import('@/components/QuickApproveDrawer').then((m) => ({ default: m.QuickApproveDrawer })),
  { ssr: false },
);

interface FabAction {
  /** href 가 있으면 Link, 없으면 onAction 으로 동작 (drawer 같은 비-navigation 액션) */
  href?: string;
  onAction?: 'open-helper' | 'open-classifier' | 'open-approve';
  icon: LucideIcon;
  label: string;
  desc: string;
  badge?: string;
}

const ACTIONS: FabAction[] = [
  {
    onAction: 'open-approve',
    icon: Check,
    label: '빠른 결재',
    desc: '결재 대기 빠른 처리',
  },
  {
    onAction: 'open-classifier',
    icon: ScanSearch,
    label: '품목·등급 유추',
    desc: '제품 기획서 → MFDS 품목·등급 추정',
  },
  {
    onAction: 'open-helper',
    icon: MessageCircle,
    label: 'Q-Atelier 도우미',
    desc: 'QMS / RA / ISO 자유 질문',
  },
  // 향후 추가: Phase 3
  // { href: '/ai/voice', icon: Mic, label: '음성 명령', desc: '말로 작업 지시' },
];

export function AIQuickAccessFab() {
  const [open, setOpen] = useState(false);
  const [helperOpen, setHelperOpen] = useState(false);
  const [classifyOpen, setClassifyOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 외부 클릭 + ESC 닫기
  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="qa-ai-fab"
      style={{
        position: 'fixed',
        right: 'max(16px, env(safe-area-inset-right))',
        // 모바일: bottom-nav (~64px) + safe-area-inset 위로. 데스크탑: 16px.
        // 1024px 이상 desktop 에서는 bottom-nav 숨김 → 16px.
        // 모바일 (≤1023px) 에서는 bottom-nav 가 보임 → 80px + safe-area.
        bottom: 'calc(env(safe-area-inset-bottom, 0) + var(--qa-fab-bottom, 80px))',
        zIndex: Z.fab,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: S[3],
      }}
    >
      {/* Desktop (≥1024px) 에서는 bottom-nav 미표시 → FAB 도 화면 하단으로 */}
      <style>{`
        @media (min-width: 1024px) {
          .qa-ai-fab { --qa-fab-bottom: 16px; }
        }
      `}</style>

      {/* Action menu (open 일 때만): 럭셔리 톤: scale 제거, fade + 6px translateY */}
      {open && (
        <div
          role="menu"
          aria-label="Q-Atelier 도우미 메뉴"
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: RADIUS.md,
            padding: S[1.5],
            minWidth: 260,
            // 모바일 320px 안전: viewport - right(16) - safe-area - 16px 여유
            maxWidth: 'calc(100vw - 32px - env(safe-area-inset-right, 0px) - env(safe-area-inset-left, 0px))',
            // 모바일: 헤더(~60px) + 상단 여유(20px) + 하단 FAB(~80px) 제외한 영역으로 제한
            maxHeight: 'calc(100dvh - 160px)',
            overflowY: 'auto',
            boxShadow: SHADOW.float,
            animation: `qa-fab-rise ${MOTION.normal}`,
          }}
        >
          <style>{`
            @keyframes qa-fab-rise {
              from { opacity: 0; transform: translateY(6px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          {ACTIONS.map((a) => {
            const itemStyle: React.CSSProperties = {
              display: 'flex',
              alignItems: 'center',
              gap: S[3.5],
              padding: '14px 14px',
              borderRadius: RADIUS.sm,
              textDecoration: 'none',
              color: T.text,
              transition: `background ${MOTION.fast}`,
              minHeight: 64,
              width: '100%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            };
            const ActionIcon = a.icon;
            const innerContent = (
              <>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: RADIUS.pill,
                    background: alpha(T.champagne, 0.06),
                    flexShrink: 0,
                  }}
                >
                  <ActionIcon
                    size={ICON.sizeMd}
                    strokeWidth={ICON.strokeWidth}
                    aria-hidden="true"
                    style={{ color: T.champagne }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: S[2] }}>
                    <span
                      style={{
                        fontFamily: F.serif,
                        fontSize: FS[14],
                        fontWeight: 600,
                        letterSpacing: '-0.005em',
                        color: T.text,
                      }}
                    >
                      {a.label}
                    </span>
                    {a.badge && (
                      <span
                        style={{
                          fontFamily: F.mono,
                          fontSize: FS[12],
                          fontWeight: 500,
                          letterSpacing: '0.12em',
                          color: T.champagne,
                          background: 'transparent',
                          border: `1px solid ${alpha(T.champagne, 0.35)}`,
                          padding: '2px 6px',
                          borderRadius: RADIUS.sm,
                          textTransform: 'uppercase',
                        }}
                      >
                        {a.badge}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: F.serif,
                      fontSize: FS[12],
                      color: T.subtle,
                      marginTop: 3,
                      lineHeight: 1.45,
                    }}
                  >
                    {a.desc}
                  </div>
                </div>
              </>
            );
            const hoverHandlers = {
              onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
                e.currentTarget.style.background = alpha(T.champagne, 0.05);
              },
              onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
                e.currentTarget.style.background = 'transparent';
              },
              onTouchStart: (e: React.TouchEvent<HTMLElement>) => {
                e.currentTarget.style.background = alpha(T.champagne, 0.1);
              },
              onTouchEnd: (e: React.TouchEvent<HTMLElement>) => {
                e.currentTarget.style.background = 'transparent';
              },
            };
            // onAction: 비-navigation 액션 (drawer 열기)
            if (a.onAction) {
              const action = a.onAction;
              return (
                <button
                  key={`action-${action}`}
                  type="button"
                  role="menuitem"
                  aria-label={`${a.label}: ${a.desc}`}
                  onClick={() => {
                    setOpen(false);
                    if (action === 'open-helper') setHelperOpen(true);
                    else if (action === 'open-classifier') setClassifyOpen(true);
                    else if (action === 'open-approve') setApproveOpen(true);
                  }}
                  style={itemStyle}
                  {...hoverHandlers}
                >
                  {innerContent}
                </button>
              );
            }
            // 기본: Link navigation
            return (
              <Link
                key={a.href ?? a.label}
                href={a.href ?? '#'}
                role="menuitem"
                aria-label={`${a.label}: ${a.desc}`}
                onClick={() => setOpen(false)}
                style={itemStyle}
                {...hoverHandlers}
              >
                {innerContent}
              </Link>
            );
          })}
          {/* Footer hint */}
          <div
            style={{
              borderTop: `1px solid ${T.border}`,
              marginTop: S[1],
              padding: '12px 16px',
              fontFamily: F.mono,
              fontSize: FS[12],
              fontWeight: 500,
              letterSpacing: '0.14em',
              color: T.muted,
              textAlign: 'center',
              textTransform: 'uppercase',
            }}
          >
            Q-Atelier 도우미 · Beta
          </div>
        </div>
      )}

      {/* FAB button: 럭셔리 톤: 회전 제거, hover scale 제거, color shift 만 */}
      <button
        type="button"
        aria-label="Q-Atelier 도우미 열기"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: open ? `1px solid ${T.border}` : `1px solid ${alpha(T.champagne, 0.8)}`,
          background: open ? T.surface : T.champagne,
          color: open ? T.text : T.bg,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: open ? SHADOW.surface : SHADOW.float,
          transition: `background ${MOTION.fast}, color ${MOTION.fast}, border-color ${MOTION.fast}, box-shadow ${MOTION.fast}`,
        }}
      >
        {open ? (
          <X size={ICON.sizeMd} strokeWidth={ICON.strokeWidth} aria-hidden="true" />
        ) : (
          <Sparkles size={ICON.sizeMd} strokeWidth={ICON.strokeWidth} aria-hidden="true" />
        )}
      </button>

      {/* 드로어들은 "열렸을 때만" 마운트 → dynamic import 청크가 그때 로드(lazy).
          닫혀 있을 땐 미마운트라 모든 화면 초기 비용 0. */}

      {/* AI 도우미 drawer: FAB 메뉴와 통합된 단일 진입점.
          AiHelperButton 의 drawer 만 활용 (hideTrigger). 외부 controlled open. */}
      {helperOpen && (
        <AiHelperButton
          hideTrigger
          controlledOpen={helperOpen}
          onControlledClose={() => setHelperOpen(false)}
        />
      )}

      {/* IFU 기반 품목·등급 유추 drawer: FAB 메뉴에서 진입. */}
      {classifyOpen && (
        <IfuClassifyDrawer controlledOpen={classifyOpen} onClose={() => setClassifyOpen(false)} />
      )}

      {/* Quick Approve: 결재함(/approve)과 같은 부품을 팝업으로 띄운다. */}
      {approveOpen && (
        <QuickApproveDrawer controlledOpen={approveOpen} onClose={() => setApproveOpen(false)} />
      )}
    </div>
  );
}
