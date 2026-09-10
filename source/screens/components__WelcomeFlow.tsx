'use client';

// =============================================================================
// WelcomeFlow: 신규 가입자 첫 dashboard 진입 시 1회 노출
// =============================================================================
// 동작:
//   · profiles.welcome_completed_at IS NULL 인 경우 (서버에서 prop 으로 전달)
//   · 풀스크린 backdrop + 중앙 카드 (champagne ribbon 무드)
//   · "시작하기" 클릭 → POST /api/profile/welcome-complete → 닫힘
//   · ESC / backdrop 클릭 으로도 닫기 가능 (마킹은 동일하게 수행)
//
// 디자인:
//   · 좌측 brand manifesto 톤 헤드라인 + 우측 3단계 onboarding 힌트
//   · 진입 시 fade+scale (240ms cubic-bezier)
//   · prefers-reduced-motion 자동 무효

import { useEffect, useState } from 'react';
import { F, FS, LH, S, T, Z, alpha, goldTextStyle } from '@/lib/design/tokens';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { useRef } from 'react';
import { Lightbulb, ShieldCheck, Sparkles } from 'lucide-react';
import { WELCOME_STEPS, type GsRole } from '@/lib/onboarding/getting-started';

/** 스텝 아이콘: 문구는 SSOT 가, 그림은 화면이 갖는다(순서 고정). */
const STEP_ICONS = [
  <Lightbulb key="i0" size={18} />,
  <ShieldCheck key="i1" size={18} />,
  <Sparkles key="i2" size={18} />,
];

interface Props {
  /** 서버에서 결정: false 면 모달 자체를 mount 안 함 */
  show: boolean;
  /** 인사용 이름 */
  userName: string;
  /**
   * 온보딩 역할: 소개 문구가 역할별로 갈린다.
   * 🔴 2026-08-21 신설. 그전에는 **R&D 문구가 하드코딩**돼 전 직무에 똑같이 나갔고,
   *    생산 담당자가 「아이디어를 등록하세요 · R&D 탭에서…」를 보고 있었다(오빠 지적).
   *    문구는 `lib/onboarding/getting-started.ts` 가 소유한다. 여기서는 읽기만 한다.
   */
  gsRole?: GsRole | null;
}

export function WelcomeFlow({ show, userName, gsRole }: Props) {
  const [open, setOpen] = useState(show);
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap({ active: open, rootRef: dialogRef, onClose: () => close() });

  async function close() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch('/api/profile/welcome-complete', { method: 'POST' });
    } catch {
      /* silent */
    } finally {
      setOpen(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') void close();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes qa-welcome-in {
              from { opacity: 0; transform: translateY(16px) scale(0.98); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes qa-welcome-backdrop {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
            .qa-welcome-card { animation: qa-welcome-in 320ms cubic-bezier(0.16, 1, 0.3, 1) both; }
            .qa-welcome-backdrop { animation: qa-welcome-backdrop 240ms ease both; }
            @media (prefers-reduced-motion: reduce) {
              .qa-welcome-card, .qa-welcome-backdrop { animation: none; }
            }
          `,
        }}
      />
      <div
        className="qa-welcome-backdrop"
        onClick={() => void close()}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--qa-backdrop-strong)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: Z.overlay,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: S[5],
        }}
      >
        <div
          ref={dialogRef}
          className="qa-welcome-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qa-welcome-title"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: T.bg,
            border: `1px solid ${T.borderHi}`,
            padding: 0,
            width: 640,
            maxWidth: '100%',
            boxShadow: `var(--qa-shadow-xl), 0 0 0 1px ${alpha(T.champagne, 0.1)}`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header: manifesto */}
          <div
            style={{
              padding: '36px 40px 28px',
              background: `linear-gradient(135deg, ${alpha(T.champagne, 0.08)} 0%, transparent 70%)`,
              borderBottom: `1px solid ${T.border}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: S[2.5],
                fontSize: FS[10],
                color: T.champagne,
                fontFamily: F.mono,
                letterSpacing: 2.2,
                textTransform: 'uppercase',
                marginBottom: S[3],
              }}
            >
              {/* 패밀리 모티프(A안): 랜딩의 ▪ 골드 사각 불릿 + 라인 */}
              <span
                aria-hidden
                style={{ width: 5, height: 5, background: T.champagne, flexShrink: 0 }}
              />
              <span
                aria-hidden
                style={{ width: 24, height: 1, background: T.champagne, opacity: 0.7 }}
              />
              <span>Q-Atelier · Welcome</span>
            </div>
            <h2
              id="qa-welcome-title"
              style={{
                margin: 0,
                fontFamily: F.serif,
                fontSize: FS[26],
                fontWeight: 500,
                color: T.text,
                lineHeight: 1.25,
                letterSpacing: '-0.01em',
              }}
            >
              {userName}님,<br />
              {/* 패밀리 모티프(A안): 랜딩 골드 그라디언트 디스플레이 텍스트.
                  ★브랜드 규칙: 한글에 italic 금지(가짜 기울임): 로그인 히어로와 동일하게 weight 로만 강조. */}
              <span style={{ fontWeight: 600, ...goldTextStyle() }}>
                당신의 공방
              </span>
              에 오신 것을 환영합니다.
            </h2>
            <p
              style={{
                margin: '14px 0 0',
                fontFamily: F.serif,
                fontSize: FS[14],
                lineHeight: 1.65,
                color: T.subtle,
              }}
            >
              아이디어부터 인허가 신청까지: Q-Atelier 가 매 단계를 함께 합니다.
              <br />
              먼저 짧게 둘러보세요.
            </p>
          </div>

          {/* Body: 3단계 안내 */}
          <div
            style={{
              padding: '28px 40px',
              display: 'flex',
              flexDirection: 'column',
              gap: S[4],
            }}
          >
            {(WELCOME_STEPS[gsRole ?? 'rd'] ?? WELCOME_STEPS.rd).map((st, i) => (
              <Step
                key={st.title}
                icon={STEP_ICONS[i] ?? STEP_ICONS[0]}
                num={i + 1}
                title={st.title}
                body={st.body}
              />
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '18px 40px 24px',
              borderTop: `1px solid ${T.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: S[3],
              background: alpha(T.surface, 0.4),
            }}
          >
            <span
              style={{
                fontSize: FS[10],
                color: T.muted,
                fontFamily: F.mono,
              }}
            >
              언제든 좌측 사이드바 ‘설정 · 사용법’ 에서 다시 확인할 수 있습니다.
            </span>
            <button
              type="button"
              onClick={() => void close()}
              disabled={busy}
              style={{
                padding: '11px 24px',
                background: T.champagne,
                color: T.bg,
                border: 'none',
                fontFamily: F.mono,
                fontSize: FS[10],
                letterSpacing: 1.4,
                textTransform: 'uppercase',
                cursor: busy ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                transition: 'filter 0.15s ease',
                opacity: busy ? 0.6 : 1,
              }}
            >
              {busy ? '...' : '시작하기 →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Step({
  icon,
  num,
  title,
  body,
}: {
  icon: React.ReactNode;
  num: number;
  title: string;
  body: string;
}) {
  return (
    <div style={{ display: 'flex', gap: S[3.5], alignItems: 'flex-start' }}>
      <div
        style={{
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: alpha(T.champagne, 0.1),
          border: `1px solid ${alpha(T.champagne, 0.3)}`,
          color: T.champagne,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: S[2],
            marginBottom: S[1],
          }}
        >
          <span
            className="qa-tabular"
            style={{
              fontFamily: F.mono,
              fontSize: FS[10],
              letterSpacing: 1.6,
              color: T.muted,
              textTransform: 'uppercase',
            }}
          >
            Step {String(num).padStart(2, '0')}
          </span>
          <span
            style={{
              fontFamily: F.serif,
              fontSize: FS[14],
              fontWeight: 500,
              color: T.text,
              lineHeight: LH.heading,
            }}
          >
            {title}
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontFamily: F.serif,
            fontSize: FS[13],
            lineHeight: LH.relaxed,
            color: T.subtle,
          }}
        >
          {body}
        </p>
      </div>
    </div>
  );
}
