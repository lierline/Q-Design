// =============================================================================
// /ai/draft/risk/client.tsx: Risk Assessment 위저드 (ISO 14971)
// =============================================================================
// IFU 위저드와 동일 UX 패턴. 7-question swipe + AI stream.

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { readDraftQuality, degradedNotice, type DraftQuality } from '@/lib/ai/degraded-notice';
import {
  Tag as TagIcon,
  AlertTriangle,
  Stethoscope,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  StickyNote,
  type LucideIcon,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
import { Btn, Bx, PageHd, SectionTitle, Tag } from '@/lib/design/components';
import { S, FS, F, T, alpha, RADIUS, SHADOW, MOTION, ICON, TYPE, LAYOUT, LH } from '@/lib/design/tokens';
import type { RiskWizardInput } from '@/lib/ai/prompts/risk';

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface Question {
  key: keyof RiskWizardInput;
  icon: LucideIcon;
  title: string;
  hint: string;
  placeholder: string;
  multiline?: boolean;
  type?: 'text' | 'severity' | 'probability';
  optional?: boolean;
}

const QUESTIONS: Question[] = [
  {
    key: 'productName',
    icon: TagIcon,
    title: '제품과 등급은?',
    hint: '제품명 + 의료기기 등급. 예: QraftOss-T 임플란트 / 3등급',
    placeholder: 'QraftOss-T 임플란트 / 3등급',
  },
  {
    key: 'hazard',
    icon: AlertTriangle,
    title: '위해 요소(hazard)는?',
    hint: '환자/사용자에게 발생할 수 있는 잠재 위해 한 가지.',
    placeholder: '골절 부위 감염',
  },
  {
    key: 'hazardousSituation',
    icon: Stethoscope,
    title: '어떤 상황에서 발생하나요?',
    hint: '위해가 발현되는 시나리오 / 사용 상황.',
    placeholder: '수술 중 비멸균 도구 접촉, 멸균 부족 임플란트 삽입',
    multiline: true,
  },
  {
    key: 'severity',
    icon: BarChart3,
    title: '심각도 (Severity)?',
    hint: 'S1 무시 / S2 경미 / S3 중대 / S4 치명 / S5 사망',
    placeholder: '',
    type: 'severity',
  },
  {
    key: 'probability',
    icon: TrendingUp,
    title: '발생 빈도 (Probability)?',
    hint: 'P1 매우낮음 ~ P5 매우높음',
    placeholder: '',
    type: 'probability',
  },
  {
    key: 'currentControls',
    icon: ShieldCheck,
    title: '현재 적용된 통제는?',
    hint: '이미 적용된 예방 / 통제 조치. 비워두셔도 됩니다.',
    placeholder: '감마선 멸균 (25kGy), 멸균 포장, 사용 전 시각 검사',
    multiline: true,
    optional: true,
  },
  {
    key: 'notes',
    icon: StickyNote,
    title: '추가 메모 (선택)',
    hint: '특이사항 / 참고 표준 / 과거 사례 등.',
    placeholder: 'ISO 11137 멸균 검증 통과, FDA Recall #12345 참고',
    multiline: true,
    optional: true,
  },
];

const SEVERITY_OPTIONS = [
  { value: 'S1', label: 'S1', desc: '무시' },
  { value: 'S2', label: 'S2', desc: '경미' },
  { value: 'S3', label: 'S3', desc: '중대' },
  { value: 'S4', label: 'S4', desc: '치명' },
  { value: 'S5', label: 'S5', desc: '사망' },
] as const;

const PROBABILITY_OPTIONS = [
  { value: 'P1', label: 'P1', desc: '매우낮음' },
  { value: 'P2', label: 'P2', desc: '낮음' },
  { value: 'P3', label: 'P3', desc: '보통' },
  { value: 'P4', label: 'P4', desc: '높음' },
  { value: 'P5', label: 'P5', desc: '매우높음' },
] as const;

export function RiskWizardClient() {
  const toast = useToast();
  const { copy } = useCopyToClipboard({
    toast: true,
    successMessage: '클립보드에 복사됨',
    errorMessage: '복사 실패. 텍스트를 직접 선택하세요.',
  });
  const [step, setStep] = useState<Step>(0);
  const [answers, setAnswers] = useState<Partial<RiskWizardInput>>({});
  const [draft, setDraft] = useState<string>('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 🔴 2026-09-03 감사(A-02). 초안이 «축소된 엔진» 에서 나왔는지. null 은 «모른다».
  const [quality, setQuality] = useState<DraftQuality | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const q = step < 7 ? QUESTIONS[step] : null;
  const currentValue = q ? (answers[q.key] as string | undefined) ?? '' : '';
  const canProceed = q ? Boolean(q.optional || currentValue.trim().length > 0) : false;
  const isLastQuestion = step === 6;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (step >= 7) return;
      if (e.key === 'ArrowLeft' && step > 0) {
        e.preventDefault();
        setStep((s) => (s - 1) as Step);
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canProceed) {
        e.preventDefault();
        if (isLastQuestion) void generate();
        else setStep((s) => (s + 1) as Step);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, canProceed, isLastQuestion]);

  const updateAnswer = (value: string) => {
    if (!q) return;
    setAnswers((prev) => ({ ...prev, [q.key]: value }));
  };

  const next = () => {
    if (!canProceed) return;
    if (isLastQuestion) void generate();
    else setStep((s) => (s + 1) as Step);
  };

  const back = () => {
    if (step > 0 && step < 7) setStep((s) => (s - 1) as Step);
  };

  const generate = useCallback(async () => {
    setStep(7);
    setDraft('');
    setError(null);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/ai/draft/risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        setError(data.message ?? '초안 생성 실패');
        setStreaming(false);
        return;
      }
      // 🔑 헤더는 스트림이 시작되기 «전» 에 확정된다. 본문을 읽기 전에 잡아 둔다.
      setQuality(readDraftQuality(res.headers));

      if (!res.body) {
        setError('응답 본문이 없습니다.');
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let chunkCount = 0;
      const t0 = performance.now();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunkCount += 1;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        if (chunkCount === 1) {
          // eslint-disable-next-line no-console
          console.info(`[ai-stream] 첫 chunk: ${Math.round(performance.now() - t0)}ms, ${chunk.length} bytes`);
        }
        setDraft(accumulated);
      }
      // eslint-disable-next-line no-console
      console.info(`[ai-stream] 완료: ${chunkCount} chunks, ${accumulated.length} chars, ${Math.round(performance.now() - t0)}ms`);
      if (accumulated.length === 0) {
        setError('Q-Atelier 분석 엔진이 응답을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        const product = (answers.productName as string | undefined)?.trim() || '';
        const hazard = (answers.hazard as string | undefined)?.trim() || '';
        const title = [product, hazard].filter(Boolean).join(' / ') || '제목 미정 Risk';
        void fetch('/api/ai/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind: 'risk',
            title,
            inputs: answers,
            content: accumulated,
            meta: { chunks: chunkCount },
          }),
        }).catch((err) => {
          // eslint-disable-next-line no-console
          console.warn('[ai-drafts] 자동 저장 실패', err);
        });
      }
      setStreaming(false);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        toast.info('생성을 중단했습니다.');
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
      setStreaming(false);
    } finally {
      abortRef.current = null;
    }
  }, [answers, toast]);

  const cancel = () => abortRef.current?.abort();

  const restart = () => {
    setStep(0);
    setAnswers({});
    setDraft('');
    setError(null);
    setStreaming(false);
  };

  return (
    <div
      className="qa-wizard-root"
      style={{
        maxWidth: LAYOUT.form,
        margin: '0 auto',
        padding: '20px 16px calc(120px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <style>{`
        .qa-wizard-card { padding: 28px; }
        .qa-wizard-q-title { font-size: 20px; }
        @media (max-width: 479px) {
          .qa-wizard-card { padding: 20px 16px; }
          .qa-wizard-q-title { font-size: 18px; }
          .qa-wizard-kbd-hint { display: none; }
        }
      `}</style>
      <PageHd
        title="Risk Assessment Q-Atelier 초안"
        sub="ISO 14971 + MFDS 위험관리. 7개 질문 → 단일 hazard 1건 위험 평가 1차 초안 (S × P 매트릭스 + 통제 옵션)."
      />

      {step < 7 && (
        <div style={{ marginBottom: S[7] }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: F.mono,
              fontSize: FS[10],
              fontWeight: 500,
              letterSpacing: '0.12em',
              color: T.subtle,
              marginBottom: S[2],
              textTransform: 'uppercase',
            }}
          >
            <span>Step {step + 1} / 7</span>
            <span>{Math.round(((step + 1) / 7) * 100)}%</span>
          </div>
          <div style={{ height: 2, background: alpha(T.champagne, 0.12), borderRadius: 1 }}>
            <div
              style={{
                height: '100%',
                width: `${((step + 1) / 7) * 100}%`,
                background: T.champagne,
                borderRadius: 1,
                transition: `width ${MOTION.normal}`,
              }}
            />
          </div>
        </div>
      )}

      {q && (
        <Bx
          className="qa-wizard-card"
          style={{
            minHeight: 340,
            display: 'flex',
            flexDirection: 'column',
            gap: S[6],
            background: T.surface,
            borderColor: T.border,
            borderRadius: RADIUS.md,
            boxShadow: SHADOW.hairline,
          }}
        >
          {(() => {
            const QIcon = q.icon;
            return (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 56,
                  height: 56,
                  borderRadius: RADIUS.pill,
                  border: `1px solid ${alpha(T.champagne, 0.3)}`,
                  background: alpha(T.champagne, 0.05),
                }}
              >
                <QIcon
                  size={ICON.sizeLg}
                  strokeWidth={ICON.strokeWidthThin}
                  aria-hidden="true"
                  style={{ color: T.champagne }}
                />
              </div>
            );
          })()}
          <div>
            <div
              className="qa-wizard-q-title"
              style={{
                ...TYPE.h2,
                color: T.text,
                marginBottom: S[2.5],
              }}
            >
              {q.title}
              {q.optional && (
                <span
                  style={{
                    marginLeft: S[2.5],
                    fontFamily: F.mono,
                    fontSize: FS[10],
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    color: T.subtle,
                    textTransform: 'uppercase',
                  }}
                >
                  Optional
                </span>
              )}
            </div>
            <div style={{ ...TYPE.caption, color: T.subtle }}>{q.hint}</div>
          </div>

          {q.type === 'severity' || q.type === 'probability' ? (
            <div
              role="radiogroup"
              aria-label={q.type === 'severity' ? '심각도 선택' : '발생 빈도 선택'}
              className="qa-risk-grid"
              style={{ display: 'grid', gap: S[1.5] }}
            >
              <style>{`
                .qa-risk-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
                /* 320~419px: 단일 행 5열 비좁음 → 3+2 행으로 wrap */
                @media (max-width: 419px) {
                  .qa-risk-grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
                }
              `}</style>
              {(q.type === 'severity' ? SEVERITY_OPTIONS : PROBABILITY_OPTIONS).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={currentValue === opt.value}
                  aria-label={`${opt.label} ${opt.desc}`}
                  onClick={() => updateAnswer(opt.value)}
                  style={{
                    minHeight: 76,
                    padding: '10px 4px',
                    fontFamily: F.serif,
                    fontSize: FS[13],
                    background: currentValue === opt.value ? T.champagne : 'transparent',
                    color: currentValue === opt.value ? T.bg : T.text,
                    border: `1px solid ${currentValue === opt.value ? T.champagne : T.border}`,
                    borderRadius: RADIUS.md,
                    cursor: 'pointer',
                    transition: `background ${MOTION.fast}, color ${MOTION.fast}, border-color ${MOTION.fast}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: S[1],
                  }}
                >
                  <span style={{ fontSize: FS[16], fontWeight: 600 }}>{opt.label}</span>
                  <span style={{ fontSize: FS[10], opacity: 0.8 }}>{opt.desc}</span>
                </button>
              ))}
            </div>
          ) : q.multiline ? (
            <textarea
              value={currentValue}
              onChange={(e) => updateAnswer(e.target.value)}
              placeholder={q.placeholder}
              rows={4}
              autoFocus
              className="qa-input"
              style={{
                width: '100%',
                padding: '14px 16px',
                fontFamily: F.serif,
                fontSize: FS[16],
                background: alpha(T.champagne, 0.02),
                border: `1px solid ${T.border}`,
                borderRadius: RADIUS.md,
                color: T.text,
                resize: 'vertical',
                lineHeight: 1.65,
                transition: `border-color ${MOTION.fast}`,
              }}
            />
          ) : (
            <input
              type="text"
              value={currentValue}
              onChange={(e) => updateAnswer(e.target.value)}
              placeholder={q.placeholder}
              autoFocus
              className="qa-input"
              style={{
                width: '100%',
                padding: '14px 16px',
                fontFamily: F.serif,
                fontSize: FS[16],
                background: alpha(T.champagne, 0.02),
                border: `1px solid ${T.border}`,
                borderRadius: RADIUS.md,
                color: T.text,
                transition: `border-color ${MOTION.fast}`,
              }}
            />
          )}

          <div style={{ display: 'flex', gap: S[2], justifyContent: 'space-between', marginTop: 'auto' }}>
            <Btn p={false} sm onClick={back} disabled={step === 0}>
              ← 이전
            </Btn>
            <Btn
              sm
              onClick={next}
              disabled={!canProceed}
              style={{
                background: canProceed ? T.champagne : 'transparent',
                color: canProceed ? T.bg : T.subtle,
                borderColor: canProceed ? T.champagne : T.border,
                borderRadius: RADIUS.md,
                minWidth: 120,
                fontWeight: 600,
                letterSpacing: '-0.005em',
              }}
            >
              {isLastQuestion ? 'Q-Atelier 초안 생성' : '다음 →'}
            </Btn>
          </div>

          <div
            className="qa-wizard-kbd-hint"
            style={{
              fontFamily: F.mono,
              fontSize: FS[9],
              fontWeight: 500,
              letterSpacing: '0.14em',
              color: T.muted,
              textAlign: 'right',
              textTransform: 'uppercase',
            }}
          >
            Cmd+Enter 다음 · ← 이전
          </div>
        </Bx>
      )}

      {step === 7 && (
        <div>
          <SectionTitle>
            {streaming ? 'Q-Atelier가 위험 평가를 작성 중...' : error ? '생성 실패' : '초안 완성 ✓'}
          </SectionTitle>
          <Bx
            style={{
              padding: S[6],
              maxHeight: '60vh',
              overflowY: 'auto',
              background: T.surface,
              borderColor: T.border,
              fontFamily: F.mono,
              fontSize: FS[13],
              lineHeight: LH.loose,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: T.text,
            }}
          >
            {degradedNotice(quality) && (
              // 🔴 2026-09-03 감사(A-02). 저하된 엔진의 초안과 정상 초안이 화면에서
              //    같아 보이면 검토 강도가 근거 없이 정해진다. 여기서 갈라 준다.
              <div
                role="status"
                style={{
                  marginBottom: 12,
                  padding: '10px 12px',
                  borderRadius: RADIUS.md,
                  border: `1px solid ${T.warning}`,
                  background: T.surface,
                  color: T.text,
                  fontSize: 13,
                  lineHeight: 1.6,
                  whiteSpace: 'normal',
                }}
              >
                {degradedNotice(quality)}
              </div>
            )}
            {error ? (
              <span style={{ color: T.red }}>{error}</span>
            ) : draft ? (
              draft
            ) : (
              <span style={{ color: T.subtle }}>모델에 요청 중...</span>
            )}
            {streaming && (
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 16,
                  background: T.champagne,
                  marginLeft: S[0.5],
                  animation: 'qa-cursor-blink 1s steps(2) infinite',
                  verticalAlign: 'middle',
                }}
              />
            )}
            <style>{`@keyframes qa-cursor-blink { 50% { opacity: 0; } }`}</style>
          </Bx>

          <div style={{ display: 'flex', gap: S[2], flexWrap: 'wrap', marginTop: S[4] }}>
            {streaming ? (
              <Btn p={false} sm onClick={cancel}>중단</Btn>
            ) : (
              <>
                <Btn p={false} sm onClick={restart}>← 다시 작성</Btn>
                {draft && (
                  <>
                    <Btn p={false} sm onClick={() => void copy(draft)}>복사</Btn>
                    <Btn
                      sm
                      onClick={() => toast.info('Risk Log 등록 기능은 다음 sprint 에 추가됩니다')}
                    >
                      Risk Log 등록
                    </Btn>
                  </>
                )}
              </>
            )}
          </div>

          <div style={{ marginTop: S[6], fontSize: FS[11], color: T.subtle, lineHeight: LH.loose }}>
            <Tag size="sm">알림</Tag>{' '}
            본 초안은 Q-Atelier가 생성한 단일 hazard 1건 초안입니다. RA / QA 검토 후 Risk Management File 등록 필요.
            S/P 값과 사실은 작성자가 검증해주세요.
          </div>
        </div>
      )}
    </div>
  );
}
