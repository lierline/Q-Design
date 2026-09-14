// =============================================================================
// /ai/draft/ifu/client.tsx: IFU 위저드 클라이언트 (모바일 first swipe)
// =============================================================================

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { readDraftQuality, degradedNotice, type DraftQuality } from '@/lib/ai/degraded-notice';
import { useRouter } from 'next/navigation';
import {
  Tag as TagIcon,
  Hash,
  Target,
  UserCog,
  Building2,
  AlertTriangle,
  StickyNote,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { Btn, Bx, PageHd, SectionTitle, Tag } from '@/lib/design/components';
import { S, FS, F, T, alpha, RADIUS, SHADOW, MOTION, ICON, TYPE, LAYOUT, LH } from '@/lib/design/tokens';
import type { IFUWizardInput } from '@/lib/ai/prompts/ifu';

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7; // 0~6: questions, 7: result

interface Question {
  key: keyof IFUWizardInput;
  icon: LucideIcon;
  title: string;
  hint: string;
  placeholder: string;
  multiline?: boolean;
  type?: 'text' | 'class-select';
  optional?: boolean;
}

interface ClassifyResult {
  code: string;
  name_kr: string;
  name_en: string | null;
  grade: string;
  grade_label: string | null;
  major_label: string | null;
  confidence: 'low' | 'medium' | 'high';
}

const QUESTIONS: Question[] = [
  {
    key: 'productName',
    icon: TagIcon,
    title: '제품명이 무엇인가요?',
    hint: '모델명 / 시리즈명 그대로. 예: QraftOss-T 임플란트',
    placeholder: 'QraftOss-T 임플란트',
  },
  {
    key: 'deviceClass',
    icon: Hash,
    title: '의료기기 등급은?',
    hint: '한국 식약처 분류 (1/2/3/4). 모르면 가장 가까운 추정 등급.',
    placeholder: '',
    type: 'class-select',
  },
  {
    key: 'intendedUse',
    icon: Target,
    title: '한 줄로 어떤 용도인가요?',
    hint: '"무엇을 위해 사용하는지" 한 문장.',
    placeholder: '골절 부위 고정 및 골유합 촉진',
    multiline: true,
  },
  {
    key: 'primaryUser',
    icon: UserCog,
    title: '누가 사용하나요?',
    hint: '주요 사용자 또는 자격. 예: 정형외과 전문의',
    placeholder: '정형외과 전문의',
  },
  {
    key: 'useEnvironment',
    icon: Building2,
    title: '어디에서 사용하나요?',
    hint: '병원 수술실 / 외래 / 가정 / 시술실 등',
    placeholder: '병원 수술실',
  },
  {
    key: 'primaryRisk',
    icon: AlertTriangle,
    title: '가장 큰 위험 1가지는?',
    hint: '환자 안전에 직결되는 위험을 한 문장으로.',
    placeholder: '감염, 골유합 실패',
    multiline: true,
  },
  {
    key: 'notes',
    icon: StickyNote,
    title: '추가 메모 (선택)',
    hint: '재질 / 멸균 방법 / 특이사항 등: 비워두셔도 됩니다.',
    placeholder: 'PEEK 재질, 감마선 멸균, 인체 흡수 X',
    multiline: true,
    optional: true,
  },
];

export function IFUWizardClient() {
  const toast = useToast();
  const { copy: copyToClipboard } = useCopyToClipboard({
    toast: true,
    successMessage: '클립보드에 복사됨',
    errorMessage: '복사 실패. 텍스트를 직접 선택하세요.',
  });
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [answers, setAnswers] = useState<Partial<IFUWizardInput>>({});
  const [draft, setDraft] = useState<string>('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 🔴 2026-09-03 감사(A-02). 초안이 «축소된 엔진» 에서 나왔는지. null 은 «모른다».
  const [quality, setQuality] = useState<DraftQuality | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 자동 저장 draftId
  const [draftId, setDraftId] = useState<string | null>(null);

  // 품목 자동 분류 결과
  const [classifyResult, setClassifyResult] = useState<ClassifyResult | null>(null);
  const [classifyLoading, setClassifyLoading] = useState(false);

  // 제품 기획서 등록 promote 모달
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteMode, setPromoteMode] = useState<'new' | 'existing'>('new');
  const [promoteProjects, setPromoteProjects] = useState<{ code: string; title: string }[]>([]);
  const [promoteProject, setPromoteProject] = useState('');
  const [promoteBusy, setPromoteBusy] = useState(false);
  // a11y(감사 #6·#13): promote 모달: Esc·Tab trap·초기 포커스·트리거 복귀
  const promoteDialogRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap({ active: promoteOpen, rootRef: promoteDialogRef, onClose: () => { if (!promoteBusy) setPromoteOpen(false); } });

  // promote 모달 열릴 때 R&D 프로젝트 목록 로드 (existing 모드 전환 시 또는 처음 열릴 때)
  useEffect(() => {
    if (!promoteOpen) return;
    setPromoteMode('new');
    setPromoteProject('');
    void (async () => {
      try {
        const res = await fetch('/api/research?lite=1', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list: { code: string; title: string }[] = (data.projects ?? data.items ?? []).map((p: any) => ({
          code: p.code,
          title: p.title,
        }));
        setPromoteProjects(list);
        if (list[0]) setPromoteProject(list[0].code);
      } catch {/* ignore */}
    })();
  }, [promoteOpen]);

  // 현재 question
  const q = step < 7 ? QUESTIONS[step] : null;
  const currentValue = q ? (answers[q.key] as string | undefined) ?? '' : '';
  const canProceed = q ? Boolean(q.optional || currentValue.trim().length > 0) : false;
  const isLastQuestion = step === 6;

  // 키보드 단축키: 데스크탑 (←/→ + Enter)
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
    if (isLastQuestion) {
      void generate();
    } else {
      setStep((s) => (s + 1) as Step);
    }
  };

  const back = () => {
    if (step > 0 && step < 7) setStep((s) => (s - 1) as Step);
  };

  const generate = useCallback(async () => {
    setStep(7);
    setDraft('');
    setError(null);
    setStreaming(true);
    setClassifyResult(null);
    setClassifyLoading(false);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/ai/draft/ifu', {
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

      // Stream 디코딩
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
        // eslint-disable-next-line no-console
        if (chunkCount === 1) {
          console.info(`[ai-stream] 첫 chunk 도착: ${Math.round(performance.now() - t0)}ms, ${chunk.length} bytes`);
        }
        setDraft(accumulated);
      }
      // eslint-disable-next-line no-console
      console.info(`[ai-stream] 완료: ${chunkCount} chunks, ${accumulated.length} chars, ${Math.round(performance.now() - t0)}ms`);
      if (accumulated.length === 0) {
        setError(
          'Q-Atelier 분석 엔진이 응답을 생성하지 못했습니다. 일시 장애 가능성. ' +
          '잠시 후 다시 시도해주세요. (server logs 에 details 기록됨)',
        );
      } else {
        const title = (answers.productName as string | undefined)?.trim() || '제품 기획서 초안';

        // 백그라운드 저장 + 품목 분류 병렬 실행
        const savePromise = fetch('/api/ai/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind: 'ifu',
            title,
            inputs: answers,
            content: accumulated,
            meta: { chunks: chunkCount, durationMs: Math.round(performance.now() - t0) },
          }),
        })
          .then((r) => r.ok ? r.json() : null)
          .then((saved) => { if (saved?.id) setDraftId(saved.id); })
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.warn('[ai-drafts] 자동 저장 실패', err);
          });

        // 품목 분류: intendedUse + primaryRisk 를 description 으로 합산
        const classifyDesc = [
          (answers.intendedUse as string | undefined) ?? '',
          (answers.primaryRisk as string | undefined) ?? '',
        ].filter(Boolean).join(' ');

        if (classifyDesc.length >= 10) {
          setClassifyLoading(true);
          const classifyPromise = fetch('/api/research/classify-item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              description: classifyDesc,
              titleHint: (answers.productName as string | undefined) ?? '',
              refine: false,
            }),
          })
            .then((r) => r.ok ? r.json() : null)
            .then((data) => {
              if (data?.ok && data.top) {
                setClassifyResult({
                  code: data.top.code,
                  name_kr: data.top.name_kr,
                  name_en: data.top.name_en ?? null,
                  grade: data.top.grade,
                  grade_label: data.top.grade_label ?? null,
                  major_label: data.top.major_label ?? null,
                  confidence: data.confidence ?? 'low',
                });
              }
            })
            .catch((err) => {
              // 분류 실패는 비차단
              // eslint-disable-next-line no-console
              console.warn('[classify-item] 품목 분류 실패', err);
            })
            .finally(() => setClassifyLoading(false));

          // 두 작업 병렬 대기 (UI 블로킹 없음)
          void Promise.all([savePromise, classifyPromise]);
        } else {
          void savePromise;
        }
      }
      setStreaming(false);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        toast.info('생성을 중단했습니다.');
      } else {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      }
      setStreaming(false);
    } finally {
      abortRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, toast]);

  const cancel = () => {
    abortRef.current?.abort();
  };

  const restart = () => {
    setStep(0);
    setAnswers({});
    setDraft('');
    setError(null);
    setStreaming(false);
    setDraftId(null);
    setClassifyResult(null);
    setClassifyLoading(false);
    setPromoteOpen(false);
  };

  async function promote() {
    if (!draftId || !promoteProject) return;
    setPromoteBusy(true);
    try {
      const res = await fetch(`/api/ai/drafts/${draftId}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectCode: promoteProject }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? `등록 실패 (HTTP ${res.status})`);
        setPromoteBusy(false);
        return;
      }
      toast.success('제품 기획서가 R&D 문서함에 등록됐습니다.');
      setPromoteOpen(false);
      setPromoteBusy(false);
      if (data.redirectUrl) router.push(data.redirectUrl);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      setPromoteBusy(false);
    }
  }

  // 신뢰도 색상
  const confidenceColor = (c: ClassifyResult['confidence']) =>
    c === 'high' ? T.green : c === 'medium' ? T.champagne : T.subtle;
  const confidenceLabel = (c: ClassifyResult['confidence']) =>
    c === 'high' ? '높음' : c === 'medium' ? '보통' : '낮음';

  // ── Render
  return (
    <div
      className="qa-wizard-root"
      style={{
        maxWidth: LAYOUT.form,
        margin: '0 auto',
        // bottom: bottom-nav(64) + FAB(56) + safe-area
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
        title="제품 기획서 Q-Atelier 초안"
        sub="7개 질문에 답하면 Q-Atelier가 ISO 13485 / MDR / MFDS 표준 구조의 제품 기획서(IFU) 1차 초안을 작성합니다. 모바일에서 손가락 톡톡, 30초 안에 완성."
      />

      {/* Progress bar: hairline 2px + champagne smooth fill */}
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

      {/* Question card: 럭셔리 hairline + champagne ring 아이콘 */}
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

          {/* Input: type 별 분기 */}
          {q.type === 'class-select' ? (
            <div
              role="radiogroup"
              aria-label="의료기기 등급 선택"
              style={{ display: 'flex', gap: S[2.5], flexWrap: 'wrap' }}
            >
              {(['1', '2', '3', '4'] as const).map((cls) => (
                <button
                  key={cls}
                  type="button"
                  role="radio"
                  aria-checked={currentValue === cls}
                  aria-label={`${cls}등급`}
                  onClick={() => updateAnswer(cls)}
                  style={{
                    flex: '1 1 70px',
                    minHeight: 64,
                    padding: '12px 16px',
                    fontFamily: F.serif,
                    fontSize: FS[17],
                    fontWeight: 600,
                    letterSpacing: '-0.005em',
                    background: currentValue === cls ? T.champagne : 'transparent',
                    color: currentValue === cls ? T.bg : T.text,
                    border: `1px solid ${currentValue === cls ? T.champagne : T.border}`,
                    borderRadius: RADIUS.md,
                    cursor: 'pointer',
                    transition: `background ${MOTION.fast}, color ${MOTION.fast}, border-color ${MOTION.fast}`,
                  }}
                >
                  {cls}등급
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

          {/* Nav buttons */}
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

      {/* Result panel */}
      {step === 7 && (
        <div>
          <SectionTitle>
            {streaming ? 'Q-Atelier가 초안을 작성 중...' : error ? '생성 실패' : '초안 완성 ✓'}
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
            <style>{`
              @keyframes qa-cursor-blink {
                50% { opacity: 0; }
              }
            `}</style>
          </Bx>

          {/* 품목 자동 분류 카드 */}
          {!streaming && (classifyLoading || classifyResult) && (
            <div
              style={{
                marginTop: S[3],
                padding: '14px 16px',
                background: classifyResult
                  ? alpha(T.champagne, 0.04)
                  : alpha(T.border, 0.3),
                border: `1px solid ${classifyResult ? alpha(T.champagne, 0.25) : T.border}`,
                borderRadius: RADIUS.md,
              }}
            >
              <div
                style={{
                  fontSize: FS[10],
                  fontFamily: F.mono,
                  color: T.muted,
                  marginBottom: classifyLoading ? 0 : 10,
                }}
              >
                MFDS 품목 자동 분류
              </div>
              {classifyLoading ? (
                <div style={{ fontSize: FS[11], color: T.subtle, fontFamily: F.mono, marginTop: S[1.5] }}>
                  품목 분류 추론 중...
                </div>
              ) : classifyResult ? (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: S[4], flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontSize: FS[13], fontWeight: 500, color: T.text, lineHeight: LH.snug }}>
                      {classifyResult.name_kr}
                    </div>
                    {classifyResult.name_en && (
                      <div style={{ fontSize: FS[10], color: T.muted, fontFamily: F.mono, marginTop: S[0.5] }}>
                        {classifyResult.name_en}
                      </div>
                    )}
                    {classifyResult.major_label && (
                      <div style={{ fontSize: FS[10], color: T.subtle, marginTop: S[1] }}>
                        {classifyResult.major_label}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: S[1.5], flexShrink: 0 }}>
                    <span
                      style={{
                        fontFamily: F.mono,
                        fontSize: FS[10],
                        letterSpacing: 0.8,
                        padding: '2px 8px',
                        background: alpha(T.champagne, 0.1),
                        color: T.champagne,
                        borderRadius: RADIUS.sm,
                      }}
                    >
                      {classifyResult.code}
                    </span>
                    <span
                      style={{
                        fontFamily: F.mono,
                        fontSize: FS[10],
                        letterSpacing: 0.5,
                        padding: '2px 8px',
                        background: alpha(T.text, 0.05),
                        color: T.text,
                        borderRadius: RADIUS.sm,
                      }}
                    >
                      {classifyResult.grade}등급{classifyResult.grade_label ? ` (${classifyResult.grade_label})` : ''}
                    </span>
                    <span
                      style={{
                        fontFamily: F.mono,
                        fontSize: FS[9],
                        letterSpacing: 0.5,
                        color: confidenceColor(classifyResult.confidence),
                      }}
                    >
                      신뢰도 {confidenceLabel(classifyResult.confidence)}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: S[2], flexWrap: 'wrap', marginTop: S[4] }}>
            {streaming ? (
              <Btn p={false} sm onClick={cancel}>
                중단
              </Btn>
            ) : (
              <>
                <Btn p={false} sm onClick={restart}>
                  ← 다시 작성
                </Btn>
                {draft && (
                  <>
                    <Btn p={false} sm onClick={() => void copyToClipboard(draft)}>
                      복사
                    </Btn>
                    <Btn
                      sm
                      onClick={() => {
                        if (!draftId) {
                          toast.info('초안 자동 저장 중입니다. 잠시 후 다시 시도해주세요.');
                          return;
                        }
                        setPromoteOpen(true);
                      }}
                      style={{
                        background: T.champagne,
                        color: T.bg,
                        borderColor: T.champagne,
                      }}
                    >
                      검토 요청
                    </Btn>
                  </>
                )}
              </>
            )}
          </div>

          <div style={{ marginTop: S[6], fontSize: FS[11], color: T.subtle, lineHeight: LH.loose }}>
            <Tag size="sm">알림</Tag>{' '}
            본 초안은 Q-Atelier가 생성한 1차 초안입니다. RA / QA 검토 후 최종 승인이 필요합니다.
            모든 사실 / 수치는 작성자가 직접 검증해주세요.
          </div>
        </div>
      )}

      {/* ── 제품 기획서 등록 모달 ─────────────────────────────────── */}
      {promoteOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="qa-ifu-promote-title"
          onClick={(e) => { if (e.target === e.currentTarget) setPromoteOpen(false); }}
          style={{
            position: 'fixed',
            inset: 0,
            background: alpha(T.text, 0.5),
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: S[4],
          }}
        >
          <div
            ref={promoteDialogRef}
            style={{
              borderRadius: RADIUS.md,
              background: T.surface,
              border: `1px solid ${T.border}`,
              maxWidth: 480,
              width: '100%',
              padding: S[5],
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: `0 16px 48px ${alpha(T.text, 0.3)}`,
            }}
          >
            {/* 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: S[3], marginBottom: S[4] }}>
              <div style={{ flex: 1 }}>
                <div id="qa-ifu-promote-title" style={{ fontSize: FS[16], fontWeight: 500, color: T.text }}>
                  제품 기획서 등록
                </div>
                <div style={{ fontSize: FS[12], color: T.subtle, marginTop: S[0.5] }}>
                  다음 단계를 선택해주세요
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPromoteOpen(false)}
                aria-label="닫기"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: T.muted,
                  cursor: 'pointer',
                  padding: S[1.5],
                  minWidth: 44,
                  minHeight: 44,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {/* 품목 분류 결과 미리보기 */}
            {classifyResult && (
              <div
                style={{
                  padding: '8px 12px',
                  background: alpha(T.champagne, 0.06),
                  borderLeft: `2px solid ${T.champagne}`,
                  fontSize: FS[11],
                  color: T.subtle,
                  fontFamily: F.mono,
                  marginBottom: S[3.5],
                }}
              >
                품목 {classifyResult.code} · {classifyResult.name_kr} · {classifyResult.grade}등급
              </div>
            )}

            {/* 경로 선택 탭 */}
            <div style={{ display: 'flex', gap: S[2], marginBottom: S[4] }}>
              <button
                type="button"
                onClick={() => setPromoteMode('new')}
                style={{
                  borderRadius: RADIUS.md,
                  flex: 1,
                  padding: '10px 12px',
                  background: promoteMode === 'new' ? alpha(T.champagne, 0.12) : 'transparent',
                  border: `1px solid ${promoteMode === 'new' ? T.champagne : T.border}`,
                  color: promoteMode === 'new' ? T.champagne : T.subtle,
                  fontSize: FS[11],
                  fontFamily: F.mono,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                ✦ 신규 R&D 프로젝트
              </button>
              <button
                type="button"
                onClick={() => {
                  setPromoteMode('existing');
                  // 기존 프로젝트 목록 아직 안 로드됐으면 로드
                  if (promoteProjects.length === 0) {
                    void (async () => {
                      try {
                        const res = await fetch('/api/research?lite=1', { cache: 'no-store' });
                        if (!res.ok) return;
                        const data = await res.json();
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const list: { code: string; title: string }[] = (data.projects ?? data.items ?? []).map((p: any) => ({
                          code: p.code,
                          title: p.title,
                        }));
                        setPromoteProjects(list);
                        if (list[0]) setPromoteProject(list[0].code);
                      } catch {/* ignore */}
                    })();
                  }
                }}
                style={{
                  borderRadius: RADIUS.md,
                  flex: 1,
                  padding: '10px 12px',
                  background: promoteMode === 'existing' ? alpha(T.subtle, 0.08) : 'transparent',
                  border: `1px solid ${promoteMode === 'existing' ? T.subtle : T.border}`,
                  color: promoteMode === 'existing' ? T.text : T.subtle,
                  fontSize: FS[11],
                  fontFamily: F.mono,
                  letterSpacing: 0.8,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                기존 프로젝트에 등록
              </button>
            </div>

            {/* 신규 프로젝트 경로 */}
            {promoteMode === 'new' && (
              <div>
                <div
                  style={{
                    borderRadius: RADIUS.md,
                    padding: S[3.5],
                    background: alpha(T.champagne, 0.05),
                    border: `1px solid ${alpha(T.champagne, 0.2)}`,
                    marginBottom: S[4],
                    fontSize: FS[12],
                    color: T.subtle,
                    lineHeight: LH.loose,
                  }}
                >
                  제품 기획서 내용을 기반으로 <strong style={{ color: T.text }}>신규 R&D 프로젝트</strong>가 바로 시작됩니다.
                  제품명·사용 목적이 자동으로 채워지고, 검토 후 등록하시면 됩니다.
                </div>
                <div style={{ display: 'flex', gap: S[2], justifyContent: 'flex-end' }}>
                  <Btn p={false} sm onClick={() => setPromoteOpen(false)}>
                    취소
                  </Btn>
                  <Btn
                    sm
                    onClick={() => {
                      if (!draftId) {
                        toast.info('초안이 저장 중입니다. 잠시 후 다시 시도해주세요.');
                        return;
                      }
                      setPromoteOpen(false);
                      router.push(`/research/new?from_draft=${draftId}`);
                    }}
                    style={{ background: T.champagne, color: T.bg, borderColor: T.champagne, minWidth: 140 }}
                  >
                    ✦ 신규 프로젝트 시작
                  </Btn>
                </div>
              </div>
            )}

            {/* 기존 프로젝트 경로 */}
            {promoteMode === 'existing' && (
              <div>
                <div style={{ marginBottom: S[4] }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: FS[11],
                      fontFamily: F.mono,
                      color: T.subtle,
                      marginBottom: S[1.5],
                    }}
                  >
                    연결할 R&D 프로젝트
                  </label>
                  {promoteProjects.length === 0 ? (
                    <div style={{ fontSize: FS[12], color: T.subtle, padding: '12px 0' }}>
                      활성 R&D 프로젝트가 없습니다. 신규 프로젝트를 먼저 만들어주세요.
                    </div>
                  ) : (
                    <select
                      value={promoteProject}
                      onChange={(e) => setPromoteProject(e.target.value)}
                      aria-label="연결할 R&D 프로젝트 선택"
                      style={{
                        borderRadius: RADIUS.md,
                        width: '100%',
                        padding: '12px 14px',
                        fontSize: FS[16],
                        fontFamily: F.ui,
                        background: T.bg,
                        border: `1px solid ${T.border}`,
                        color: T.text,
                        minHeight: 44,
                      }}
                    >
                      {promoteProjects.map((p) => (
                        <option key={p.code} value={p.code}>[{p.code}] {p.title}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div
                  style={{
                    fontSize: FS[11],
                    color: T.subtle,
                    lineHeight: LH.loose,
                    marginBottom: S[4],
                    padding: S[3],
                    background: alpha(T.champagne, 0.04),
                  }}
                >
                  제품 기획서 초안이 선택한 프로젝트의 문서함에 &apos;초안&apos; 상태로 등록됩니다.
                  이후 RA/QA 검토 → 승인 흐름으로 진행할 수 있습니다.
                </div>
                <div style={{ display: 'flex', gap: S[2], justifyContent: 'flex-end' }}>
                  <Btn p={false} sm onClick={() => setPromoteOpen(false)} disabled={promoteBusy}>
                    취소
                  </Btn>
                  <Btn
                    sm
                    onClick={() => void promote()}
                    disabled={!promoteProject || promoteBusy}
                    style={{ background: T.champagne, color: T.bg, borderColor: T.champagne, minWidth: 120 }}
                  >
                    {promoteBusy ? '등록 중...' : '문서함에 등록'}
                  </Btn>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
