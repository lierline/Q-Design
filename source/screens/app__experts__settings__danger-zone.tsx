// =============================================================================
// /experts/settings/danger-zone.tsx: 전문가 본인 계정 영구 삭제 (luxe)
// =============================================================================
// GDPR 권리 + 21 CFR Part 11 audit trail: 전문가 본인이 자신의 계정과 프로필
// 정보를 영구 삭제할 수 있어야 함. 일반 사용자의 DangerZone (components/DangerZone.tsx)
// 와 동일 API (/api/account/delete) 사용하되, luxe 디자인 (champagne / serif / dark) 으로 통일.
//
// 차이점 (vs 일반 DangerZone):
//   - 전문가는 org 멤버 X: owner transfer 로직 불필요. ownerOf 조회 생략.
//   - 본인이 만든 opinion / opinion_attachments 는 author_id 가 NULL 되며 보존됨
//     (audit trail 보존: ISO 13485 §4.2.5 / 21 CFR §11.10(e)).
//   - 삭제 후 /experts/farewell 로 이동 (브랜드 일관성).
//
// 2단계 확인:
//   ① 입력란에 확인 문구(ACCOUNT_DELETE_PHRASE)를 정확히 입력
//   ② 영구 삭제 버튼 클릭 → 브라우저 confirm 다이얼로그 최종 확인

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOutAndClear } from '@/lib/auth/sign-out';
import { useConfirm } from '@/components/Confirm';
import { ACCOUNT_DELETE_PHRASE } from '@/lib/account/delete-phrase';

const CONFIRMATION_PHRASE = ACCOUNT_DELETE_PHRASE;

export function ExpertDangerZone() {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    // ── 2단계: 최종 confirm 다이얼로그 (브랜드 모달) ──
    const finalConfirm = await confirm({
      // 🔑 마지막 확인창이야말로 모국어여야 한다. 여기서 잘못 이해하면 되돌릴 수 없다.
      title: '⚠ 마지막 확인',
      message: [
        '계정과 전문가 프로필이 영구히 삭제됩니다.',
        '이미 제출하신 자문 의견은 남되, 작성자 정보는 익명 처리됩니다',
        '(ISO 13485 §4.2.5 · 21 CFR Part 11 감사추적 보존 의무).',
        '',
        '이 작업은 되돌릴 수 없습니다.',
        '',
        '정말 진행하시겠습니까?',
      ].join('\n'),
      confirmLabel: '영구 삭제',
      cancelLabel: '취소',
      destructive: true,
    });
    if (!finalConfirm) return;

    setBusy(true);
    setError(null);

    const res = await fetch('/api/account/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation: confirmText, final_confirmation: true }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message ?? data.error ?? 'Account deletion failed. Please try again later.');
      setBusy(false);
      return;
    }

    // sign out + redirect to farewell (luxe 브랜드 통일 · V-17: 탭 상태·금고 열쇠까지 지우는 단일 출처)
    await signOutAndClear();
    router.push('/experts/farewell');
  }

  return (
    <>
      <style>{`
        /* 전문가 luxe DangerZone: champagne 톤 위에 burgundy 경고 액센트. */
        .expert-danger-eyebrow {
          /* 🔴 2026-08-25: 같은 페이지의 다른 섹션 제목과 기하가 달랐다
             (10px/0.32em vs section-title 12px/0.28em vs form-eyebrow 11px/0.42em).
             «거의 같은데 다른» 것이라 실수처럼 보였다. 색만 다르게 하고 기하는 맞춘다. */
          font-family: var(--mono);
          font-weight: 500;
          font-size: 12px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          /* burgundy: luxe palette 와 조화되는 어두운 적색. red(#ef4444) 같은
             밝은 톤은 dark theme + champagne 와 부조화. */
          color: var(--burgundy);
          margin-bottom: 14px;
          margin-top: 8px;
        }

        .expert-danger-card {
          /* luxe-card 기본값 + 왼쪽 burgundy 라인. */
          background: rgba(24, 22, 26, 0.55);
          border: 1px solid var(--hairline);
          border-left: 2px solid var(--burgundy);
          border-radius: var(--radius);
          padding: 28px 32px;
          transition: border-color 280ms var(--ease);
        }
        .expert-danger-card:hover {
          border-left-color: var(--burgundy-bright);
        }

        /* 🔴 이 페이지에서 유일하게 세리프였다(다른 카드 제목은 모노 대문자).
           스케일의 t-subhead 를 쓰고 여백만 여기서 준다. */
        .expert-danger-title {
          margin-bottom: 10px;
        }

        .expert-danger-desc {
          /* 본문이므로 Pretendard. 세리프면 문장 속 «ISO 13485 §4.2.5» 숫자만
             다른 얼굴이 되어 한 줄이 두 목소리로 읽힌다. */
          font-family: var(--sans);
          font-weight: 300;
          font-size: 13px;
          color: var(--cream-muted);
          line-height: 1.75;
          margin-bottom: 18px;
        }

        .expert-danger-hint {
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 0.16em;
          color: var(--mist);
          line-height: 1.75;
          margin-bottom: 14px;
          text-transform: uppercase;
        }
        .expert-danger-hint .accent {
          color: var(--burgundy-bright);
          font-weight: 500;
        }

        .expert-danger-input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(8, 7, 10, 0.6);
          border: 1px solid var(--hairline);
          color: var(--cream);
          font-family: var(--mono);
          font-size: 13px;
          letter-spacing: 0.06em;
          margin-bottom: 16px;
          transition: border-color 200ms var(--ease);
        }
        .expert-danger-input:focus {
          outline: none;
          border-color: var(--burgundy-bright);
        }
        .expert-danger-input::placeholder {
          color: var(--mist);
          letter-spacing: 0.06em;
        }

        .expert-danger-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          flex-wrap: wrap;
        }

        .expert-danger-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 24px;
          font-family: var(--sans);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          border: 1px solid var(--hairline);
          background: transparent;
          color: var(--cream-muted);
          cursor: pointer;
          transition: border-color 200ms var(--ease), color 200ms var(--ease);
          border-radius: var(--radius);
        }
        .expert-danger-btn:hover {
          border-color: var(--hairline-strong);
          color: var(--cream);
        }
        .expert-danger-btn:focus-visible {
          outline: 2px solid var(--champagne);
          outline-offset: 2px;
        }
        .expert-danger-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .expert-danger-btn.primary {
          background: var(--burgundy-deep);
          border-color: var(--burgundy-deep);
          color: var(--cream);
        }
        .expert-danger-btn.primary:hover:not(:disabled) {
          background: var(--burgundy-deep-bright);
          border-color: var(--burgundy-deep-bright);
        }
        .expert-danger-btn.primary:focus-visible {
          outline: 2px solid var(--burgundy);
          outline-offset: 2px;
          box-shadow: 0 0 0 1px var(--ink), 0 0 0 4px var(--burgundy);
        }

        .expert-danger-error {
          padding: 12px 14px;
          margin-bottom: 14px;
          background: rgba(184, 98, 76, 0.08);
          border: 1px solid rgba(184, 98, 76, 0.3);
          color: var(--burgundy-soft);
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.04em;
          line-height: 1.6;
        }
      `}</style>

      <div style={{ marginTop: 48 }}>
        <div className="expert-danger-eyebrow">Danger Zone</div>

        <div className="expert-danger-card">
          <div className="expert-danger-title t-subhead">계정 삭제</div>
          {/* 🔴 2026-08-25 오빠 지적(「계정 삭제는 왜 영어 설명이야?」).
              오빠 결정은 «영문 표제 + 한국어 본문» 인데 이 카드만 통째로 영문이었다.
              🔑 게다가 여기는 **되돌릴 수 없는 행위**다. 문체 문제가 아니라 안전 문제다.
                 무엇이 지워지고 무엇이 남는지는 모국어로 읽혀야 한다.
              ⚠️ 버튼도 한국어로 바꿨다. 「Enter Atelier」 같은 «브랜드 목소리» 버튼과 달리
                 이건 «결과가 있는 기능» 버튼이라 정확한 이해가 먼저다. */}
          <p className="expert-danger-desc">
            전문가 계정과 프로필 정보가 <strong>영구히 삭제</strong>됩니다.
            <br />
            이미 제출하신 자문 의견은 <strong>남습니다.</strong> 다만 작성자 정보는 익명 처리됩니다
            (ISO 13485 §4.2.5 · 21 CFR Part 11 감사추적 보존 의무).
          </p>

          {!showConfirm ? (
            <button
              type="button"
              className="expert-danger-btn"
              onClick={() => setShowConfirm(true)}
              style={{ borderColor: 'var(--burgundy-deep)', color: 'var(--burgundy-bright)' }}
            >
              계정 삭제
            </button>
          ) : (
            <div>
              <div className="expert-danger-hint">
                <span className="accent">2단계 확인</span> · ① 아래에{' '}
                <span className="accent">{CONFIRMATION_PHRASE}</span> 를 그대로 입력하고
                {' '}② 「영구 삭제」를 누르시면 진행됩니다.
                {/* ⚠️ 입력 문구는 영문 그대로 둔다. 한국어로 바꾸면 IME 전환이 필요해
                    오히려 오타가 늘고, 대문자 영문은 한글 자판에서 바로 쳐진다. */}
              </div>

              <input
                type="text"
                className="expert-danger-input"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={CONFIRMATION_PHRASE}
                aria-label="계정 삭제 확인 문구 입력"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />

              {error && (
                <div className="expert-danger-error" role="alert">
                  {error}
                </div>
              )}

              <div className="expert-danger-actions">
                <button
                  type="button"
                  className="expert-danger-btn"
                  onClick={() => {
                    setShowConfirm(false);
                    setConfirmText('');
                    setError(null);
                  }}
                  disabled={busy}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="expert-danger-btn primary"
                  disabled={confirmText !== CONFIRMATION_PHRASE || busy}
                  onClick={() => void handleDelete()}
                >
                  {busy ? '삭제 중...' : '영구 삭제'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
