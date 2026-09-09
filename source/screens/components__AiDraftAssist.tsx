'use client';

// =============================================================================
// AiDraftAssist: in-flow AI 작성 보조 (작성 화면 필드 옆 1-tap 초안)
// =============================================================================
// 철학: SaaS 는 대필 도구가 아니다. AI 는 사용자가 준 사실을 *구조화/표현*만 하고,
//   author of record 는 항상 사람(Part 11). 그래서:
//     · 글로벌 FAB(잡탕·산만) 아니라 *딱 그 필드 맥락*에 in-flow 로만 붙는다.
//     · 생성 초안은 패널 안 미리보기 → 사용자가 "이 초안 넣기" 를 **직접 눌러야** 주입.
//       (자동 주입·자동 제출 절대 X) 주입 후에도 본 필드에서 편집·검토 가능.
//
// 재사용: endpoint + extraBody + onInject 만 바꾸면 다른 작성 화면에도 부착.

import { useState } from 'react';
import { Sparkles, X, RefreshCw } from 'lucide-react';
import { Btn, Txt } from '@/lib/design/components';
import { S, FS, F, T, alpha, RADIUS, MOTION, ICON, LH } from '@/lib/design/tokens';

interface Props {
  /** 초안 생성 API (POST). body = { ...extraBody, keywords }. */
  endpoint: string;
  /** endpoint 에 함께 보낼 컨텍스트(유형·원천 등). */
  extraBody?: Record<string, unknown>;
  /** 응답 JSON 에서 초안 텍스트를 꺼내는 키 (기본 'draft'). */
  draftKey?: string;
  /** 사용자가 "이 초안 넣기" 를 누르면 호출: 대상 필드에 주입. */
  onInject: (text: string) => void;
  /** 트리거 라벨 (기본 'AI로 초안 잡기'). */
  label?: string;
  /** 키워드 입력 placeholder. */
  placeholder?: string;
}

export function AiDraftAssist({
  endpoint,
  extraBody,
  draftKey = 'draft',
  onInject,
  label = 'AI로 초안 잡기',
  placeholder = '상황을 한두 줄로 적어주세요. 언제·어디서·무엇이·어떻게 발견됐는지. (사실 위주, 모르는 건 비워도 됩니다)',
}: Props) {
  const [open, setOpen] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = keywords.trim().length >= 4 && !busy;

  async function generate() {
    if (!canGenerate) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...extraBody, keywords: keywords.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? data?.error ?? `오류 (HTTP ${res.status})`);
      } else {
        setDraft((data?.[draftKey] as string) ?? '(빈 응답)');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function inject() {
    if (!draft) return;
    onInject(draft);
    reset();
  }

  function reset() {
    setOpen(false);
    setKeywords('');
    setDraft(null);
    setError(null);
  }

  // ── 트리거 (필드 라벨 옆 작은 버튼) ─────────────────────────────────
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="AI 가 사실을 6하원칙 초안으로 정리해 줍니다 (편집 가능)"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 10px',
          background: 'transparent',
          border: `1px solid ${alpha(T.champagne, 0.5)}`,
          borderRadius: RADIUS.pill,
          color: T.champagne,
          fontSize: FS[11],
          fontFamily: F.mono,
          letterSpacing: '0.04em',
          cursor: 'pointer',
          lineHeight: LH.none,
          transition: `background ${MOTION.fast}, border-color ${MOTION.fast}`,
        }}
      >
        <Sparkles size={12} strokeWidth={ICON.strokeWidth} aria-hidden="true" />
        {label}
      </button>
    );
  }

  // ── 인라인 패널 ────────────────────────────────────────────────────
  return (
    <div
      style={{
        border: `1px solid ${alpha(T.champagne, 0.35)}`,
        borderRadius: RADIUS.md,
        background: alpha(T.champagne, 0.04),
        padding: S[3.5],
        marginBottom: S[2.5],
        display: 'flex',
        flexDirection: 'column',
        gap: S[2.5],
        animation: `qa-assist-rise ${MOTION.normal}`,
      }}
    >
      <style>{`@keyframes qa-assist-rise { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* 헤더 + 가드레일 라벨 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: S[2] }}>
        <Sparkles size={14} strokeWidth={ICON.strokeWidth} aria-hidden="true" style={{ color: T.champagne }} />
        <span style={{ flex: 1, fontFamily: F.serif, fontSize: FS[13], fontWeight: 600, color: T.text }}>
          AI 초안 도움
        </span>
        <button
          type="button"
          onClick={reset}
          aria-label="AI 초안 닫기"
          style={{ background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer', padding: S[0.5], display: 'inline-flex' }}
        >
          <X size={15} aria-hidden="true" />
        </button>
      </div>
      <div style={{ fontFamily: F.mono, fontSize: FS[10], color: T.subtle, letterSpacing: '0.03em', lineHeight: LH.normal }}>
        ▸ AI 는 적어주신 사실을 정리만 합니다. 없는 내용은 지어내지 않아요. <strong style={{ color: T.champagne }}>초안을 받은 뒤 반드시 사실을 확인하고 수정</strong>하세요.
      </div>

      {/* 키워드 입력 */}
      <Txt
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
        placeholder={placeholder}
        rows={3}
      />

      {error && (
        <div
          style={{
            padding: S[2],
            background: alpha(T.red, 0.08),
            border: `1px solid ${alpha(T.red, 0.4)}`,
            borderRadius: RADIUS.sm,
            color: T.red,
            fontSize: FS[11],
            fontFamily: F.mono,
            lineHeight: LH.normal,
          }}
        >
          {error}
        </div>
      )}

      {/* 생성 초안 미리보기: 주입 전 사용자 확인 */}
      {draft && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: S[1.5] }}>
          <div style={{ fontFamily: F.mono, fontSize: FS[10], letterSpacing: '0.12em', textTransform: 'uppercase', color: T.muted }}>
            생성된 초안 (미리보기)
          </div>
          <div
            style={{
              padding: S[3],
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: RADIUS.sm,
              fontFamily: F.serif,
              fontSize: FS[13],
              color: T.text,
              lineHeight: LH.relaxed,
              whiteSpace: 'pre-wrap',
              maxHeight: 220,
              overflowY: 'auto',
            }}
          >
            {draft}
          </div>
        </div>
      )}

      {/* 액션 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: S[2] }}>
        {draft ? (
          <>
            <Btn p={false} sm onClick={generate} disabled={busy}>
              <RefreshCw size={12} strokeWidth={ICON.strokeWidth} aria-hidden="true" style={{ marginRight: S[1] }} />
              {busy ? '생성 중...' : '다시 생성'}
            </Btn>
            <Btn
              sm
              onClick={inject}
              style={{ background: T.champagne, color: T.bg, borderColor: T.champagne, borderRadius: RADIUS.md, fontWeight: 600 }}
            >
              이 초안 넣기
            </Btn>
          </>
        ) : (
          <Btn
            sm
            onClick={generate}
            disabled={!canGenerate}
            style={{
              background: canGenerate ? T.champagne : 'transparent',
              color: canGenerate ? T.bg : T.subtle,
              borderColor: canGenerate ? T.champagne : T.border,
              borderRadius: RADIUS.md,
              fontWeight: 600,
            }}
          >
            {busy ? '생성 중...' : '초안 생성'}
          </Btn>
        )}
      </div>
    </div>
  );
}
