// =============================================================================
// /ai/draft/cr/client.tsx: Change Request 위저드 (ISO 13485 §7.3.9)
// =============================================================================

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { readDraftQuality, degradedNotice, type DraftQuality } from '@/lib/ai/degraded-notice';
import { useRouter } from 'next/navigation';
import {
  Target,
  LayoutList,
  ArrowLeftCircle,
  ArrowRightCircle,
  Lightbulb,
  Clock,
  StickyNote,
  PenLine,
  Cog,
  FlaskConical,
  Factory,
  Tag as TagIcon,
  Code2,
  HelpCircle,
  Package,
  FlaskRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { Btn, Bx, PageHd, SectionTitle, Tag } from '@/lib/design/components';
import { S, FS, F, T, alpha, RADIUS, SHADOW, MOTION, ICON, TYPE, LAYOUT, LH } from '@/lib/design/tokens';
import { createClient } from '@/lib/supabase/client';
import type { CRWizardInput } from '@/lib/ai/prompts/cr';
import { STAGE_LABEL } from '@/lib/research/stage-labels';

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface Question {
  key: keyof CRWizardInput;
  icon: LucideIcon;
  title: string;
  hint: string;
  placeholder: string;
  multiline?: boolean;
  type?: 'text' | 'change-type' | 'urgency' | 'product-select';
  optional?: boolean;
}

interface ProductItem {
  id: string;
  name: string;
  localId: string;
  deviceClass: string | null;
  isPostMarket: boolean;
  rdCode?: string;
  rdStage?: string;
}

const QUESTIONS: Question[] = [
  {
    key: 'changeTarget',
    icon: Target,
    title: '무엇을 변경하나요?',
    hint: '변경할 제품을 선택하거나 직접 입력하세요.',
    placeholder: 'QraftOss-T 임플란트 멸균 방법',
    type: 'product-select',
  },
  {
    key: 'changeType',
    icon: LayoutList,
    title: '변경 유형은?',
    hint: '7가지 중 가장 적합한 것 tap.',
    placeholder: '',
    type: 'change-type',
  },
  {
    key: 'currentState',
    icon: ArrowLeftCircle,
    title: '현재 상태는?',
    hint: '변경 전 (Before): 현재 어떻게 되어 있는가?',
    placeholder: 'EO 가스 멸균 (잔류 가스 시험 1주 소요)',
    multiline: true,
  },
  {
    key: 'proposedState',
    icon: ArrowRightCircle,
    title: '변경 후 상태는?',
    hint: '변경 후 (After): 어떻게 바뀌는가?',
    placeholder: '감마선 멸균 25kGy (당일 출하 가능)',
    multiline: true,
  },
  {
    key: 'reason',
    icon: Lightbulb,
    title: '왜 변경해야 하나요?',
    hint: '비즈니스 / 규제 / 품질 / 임상 사유.',
    placeholder: '리드타임 단축 (1주 → 당일), 잔류 EO 가스 제거',
    multiline: true,
  },
  {
    key: 'urgency',
    icon: Clock,
    title: '시급도는?',
    hint: 'routine 일반 / expedited 신속 / emergency 긴급',
    placeholder: '',
    type: 'urgency',
  },
  {
    key: 'notes',
    icon: StickyNote,
    title: '추가 메모 (선택)',
    hint: '참고 표준, 과거 변경 이력, 예상 일정 등.',
    placeholder: 'ISO 11137 검증, 2024-Q3 시범 적용 예정',
    multiline: true,
    optional: true,
  },
];

const CHANGE_TYPE_OPTIONS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'design', label: '설계', icon: PenLine },
  { value: 'process', label: '공정', icon: Cog },
  { value: 'material', label: '재료', icon: FlaskConical },
  { value: 'supplier', label: '공급자', icon: Factory },
  { value: 'labeling', label: '라벨/IFU', icon: TagIcon },
  { value: 'software', label: '소프트웨어', icon: Code2 },
  { value: 'other', label: '기타', icon: HelpCircle },
];

const URGENCY_OPTIONS = [
  { value: 'routine', label: '일반', desc: '정상 흐름', color: 'subtle' },
  { value: 'expedited', label: '신속', desc: '영업/임상 영향', color: 'warning' },
  { value: 'emergency', label: '긴급', desc: '환자 안전', color: 'red' },
] as const;

export function CRWizardClient() {
  const toast = useToast();
  const { copy } = useCopyToClipboard({
    toast: true,
    successMessage: '클립보드에 복사됨',
    errorMessage: '복사 실패. 텍스트를 직접 선택하세요.',
  });
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>(0);
  const [answers, setAnswers] = useState<Partial<CRWizardInput>>({});
  const [draft, setDraft] = useState<string>('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 🔴 2026-09-03 감사(A-02). 초안이 «축소된 엔진» 에서 나왔는지. null 은 «모른다».
  const [quality, setQuality] = useState<DraftQuality | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 제품 목록 (허가 완료 + 개발 중)
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [selectedMeta, setSelectedMeta] = useState<{ id: string; name: string; isPostMarket: boolean; rdCode?: string } | null>(null);
  const [productItemsLoading, setProductItemsLoading] = useState(true);

  // CR 등록 promote 모달
  const [draftId, setDraftId] = useState<string | null>(null);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteProjects, setPromoteProjects] = useState<{ code: string; title: string }[]>([]);
  const [promoteProject, setPromoteProject] = useState('');
  const [promoteBusy, setPromoteBusy] = useState(false);
  // a11y(감사 #6·#13): promote 모달: Esc·Tab trap·초기 포커스·트리거 복귀
  const promoteDialogRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap({ active: promoteOpen, rootRef: promoteDialogRef, onClose: () => { if (!promoteBusy) setPromoteOpen(false); } });

  // 마운트 시 제품 목록 로드
  useEffect(() => {
    setProductItemsLoading(true);
    Promise.all([
      // 허가 완료 정식 제품
      supabase
        .from('products')
        .select('id, name, local_id, device_class')
        .order('created_at', { ascending: false })
        .limit(30),
      // 개발 중 R&D 프로젝트
      fetch('/api/research?lite=1', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .catch(() => ({ items: [] })),
    ])
      .then(([prodResult, rdData]) => {
        const items: ProductItem[] = [];
        for (const p of (prodResult.data ?? [])) {
          items.push({
            id: p.id,
            name: p.name,
            localId: p.local_id,
            deviceClass: p.device_class ?? null,
            isPostMarket: true,
          });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const r of ((rdData.items ?? rdData.projects ?? []) as any[])) {
          items.push({
            id: r.id,
            name: r.title,
            localId: r.code,
            deviceClass: null,
            isPostMarket: false,
            rdCode: r.code,
            rdStage: r.stage,
          });
        }
        setProductItems(items);
      })
      .catch(() => {/* 로드 실패 시 목록 없이 직접 입력 유도 */})
      .finally(() => setProductItemsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // promote 모달 열릴 때 프로젝트 목록 로드
  useEffect(() => {
    if (!promoteOpen) return;
    setPromoteProject('');
    // selectedMeta 에 rdCode 있으면 pre-select
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
        const preCode = selectedMeta?.rdCode ?? (list[0]?.code ?? '');
        setPromoteProject(preCode);
      } catch {/* ignore */}
    })();
  }, [promoteOpen, selectedMeta]);

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

  const selectProduct = (item: ProductItem) => {
    setAnswers((prev) => ({ ...prev, changeTarget: item.name }));
    setSelectedMeta({ id: item.id, name: item.name, isPostMarket: item.isPostMarket, rdCode: item.rdCode });
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

    // 허가 전/후 컨텍스트를 AI 프롬프트에 포함
    const postMarketCtx = selectedMeta?.isPostMarket === true
      ? '이 변경은 이미 허가받은 시판 제품에 대한 변경입니다 (허가 후 변경: MFDS 변경허가/변경신고 해당 여부 반드시 검토).'
      : selectedMeta?.isPostMarket === false
        ? '이 변경은 개발 중인 R&D 프로젝트에 대한 변경입니다 (허가 전 변경).'
        : null;

    try {
      const res = await fetch('/api/ai/draft/cr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...answers,
          ...(postMarketCtx ? { _postMarketContext: postMarketCtx } : {}),
        }),
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
        const target = (answers.changeTarget as string | undefined)?.trim() || '제목 미정 CR';
        // 백그라운드 저장: 완료 후 draftId 기록
        void fetch('/api/ai/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind: 'cr',
            title: target,
            inputs: { ...answers, _isPostMarket: selectedMeta?.isPostMarket, _rdCode: selectedMeta?.rdCode },
            content: accumulated,
            meta: { chunks: chunkCount, isPostMarket: selectedMeta?.isPostMarket },
          }),
        })
          .then((r) => r.ok ? r.json() : null)
          .then((saved) => { if (saved?.id) setDraftId(saved.id); })
          .catch((err) => {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, selectedMeta, toast]);

  const cancel = () => abortRef.current?.abort();

  const restart = () => {
    setStep(0);
    setAnswers({});
    setDraft('');
    setError(null);
    setStreaming(false);
    setDraftId(null);
    setSelectedMeta(null);
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
      toast.success(data.crNumber ? `${data.crNumber} 변경 의뢰 등록 완료` : 'CR 등록 완료');
      setPromoteOpen(false);
      setPromoteBusy(false);
      if (data.redirectUrl) router.push(data.redirectUrl);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      setPromoteBusy(false);
    }
  }

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
        .qa-product-card { transition: background ${MOTION.fast}, border-color ${MOTION.fast}; }
        .qa-product-card:hover { background: ${alpha(T.champagne, 0.05)} !important; }
      `}</style>
      <PageHd
        title="Change Request Q-Atelier 초안"
        sub="ISO 13485 §7.3.9 + 21 CFR Part 820.30(i) 변경 의뢰. 7개 질문 → 영향 분석 + 검증 계획 + 결재 흐름까지 자동."
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

          {q.type === 'product-select' ? (
            /* ── 제품 목록 선택 ─────────────────────────────────────── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: S[3] }}>
              {productItemsLoading ? (
                <div style={{ fontSize: FS[11], color: T.muted, fontFamily: F.mono }}>제품 목록 로드 중...</div>
              ) : productItems.length > 0 ? (
                <>
                  {/* 허가 완료 제품 */}
                  {productItems.filter((it) => it.isPostMarket).length > 0 && (
                    <div>
                      <div style={{ fontSize: FS[10], color: T.muted, fontFamily: F.mono, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: S[1.5] }}>
                        허가 완료 제품: 허가 후 변경
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: S[1.5] }}>
                        {productItems.filter((it) => it.isPostMarket).map((item) => {
                          const selected = selectedMeta?.id === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              aria-pressed={selected}
                              className="qa-product-card"
                              onClick={() => selectProduct(item)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: S[3],
                                padding: '10px 14px',
                                background: selected ? alpha(T.champagne, 0.08) : 'transparent',
                                border: `1px solid ${selected ? T.champagne : T.border}`,
                                borderRadius: RADIUS.md,
                                cursor: 'pointer',
                                textAlign: 'left',
                                width: '100%',
                              }}
                            >
                              <Package size={16} style={{ color: selected ? T.champagne : T.subtle, flexShrink: 0 }} aria-hidden="true" />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: FS[13], color: selected ? T.champagne : T.text, fontWeight: 500, lineHeight: LH.heading }}>{item.name}</div>
                                <div style={{ fontSize: FS[10], color: T.muted, fontFamily: F.mono, marginTop: S[0.5] }}>
                                  {item.localId}{item.deviceClass ? ` · ${item.deviceClass}` : ''}
                                </div>
                              </div>
                              <span
                                style={{
                                  fontSize: FS[9],
                                  fontFamily: F.mono,
                                  letterSpacing: 1,
                                  padding: '2px 6px',
                                  background: alpha(T.green, 0.1),
                                  color: T.green,
                                  borderRadius: 2,
                                  flexShrink: 0,
                                }}
                              >
                                허가 후
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* 개발 중 R&D 프로젝트 */}
                  {productItems.filter((it) => !it.isPostMarket).length > 0 && (
                    <div>
                      <div style={{ fontSize: FS[10], color: T.muted, fontFamily: F.mono, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: S[1.5] }}>
                        개발 중 R&D: 허가 전 변경
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: S[1.5] }}>
                        {productItems.filter((it) => !it.isPostMarket).map((item) => {
                          const selected = selectedMeta?.id === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              aria-pressed={selected}
                              className="qa-product-card"
                              onClick={() => selectProduct(item)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: S[3],
                                padding: '10px 14px',
                                background: selected ? alpha(T.champagne, 0.08) : 'transparent',
                                border: `1px solid ${selected ? T.champagne : T.border}`,
                                borderRadius: RADIUS.md,
                                cursor: 'pointer',
                                textAlign: 'left',
                                width: '100%',
                              }}
                            >
                              <FlaskRound size={16} style={{ color: selected ? T.champagne : T.subtle, flexShrink: 0 }} aria-hidden="true" />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: FS[13], color: selected ? T.champagne : T.text, fontWeight: 500, lineHeight: LH.heading }}>{item.name}</div>
                                <div style={{ fontSize: FS[10], color: T.muted, fontFamily: F.mono, marginTop: S[0.5] }}>
                                  {item.localId} · {STAGE_LABEL[item.rdStage ?? ''] ?? item.rdStage}
                                </div>
                              </div>
                              <span
                                style={{
                                  fontSize: FS[9],
                                  fontFamily: F.mono,
                                  letterSpacing: 1,
                                  padding: '2px 6px',
                                  background: alpha(T.champagne, 0.1),
                                  color: T.champagne,
                                  borderRadius: 2,
                                  flexShrink: 0,
                                }}
                              >
                                허가 전
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* 구분선 */}
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: S[2.5] }}>
                    <div style={{ fontSize: FS[10], color: T.muted, fontFamily: F.mono, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: S[1.5] }}>
                      직접 입력
                    </div>
                    <input
                      type="text"
                      value={selectedMeta ? '' : currentValue}
                      onChange={(e) => {
                        setSelectedMeta(null);
                        updateAnswer(e.target.value);
                      }}
                      onFocus={() => { if (selectedMeta) setSelectedMeta(null); }}
                      placeholder={q.placeholder}
                      className="qa-input"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontFamily: F.serif,
                        fontSize: FS[15],
                        background: alpha(T.champagne, 0.02),
                        border: `1px solid ${T.border}`,
                        borderRadius: RADIUS.md,
                        color: T.text,
                        transition: `border-color ${MOTION.fast}`,
                      }}
                    />
                  </div>
                </>
              ) : (
                /* 제품 없을 때: 직접 입력만 */
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

              {/* 선택된 제품 컨텍스트 배지 */}
              {selectedMeta && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: S[2],
                    padding: '8px 12px',
                    background: alpha(T.champagne, 0.06),
                    borderLeft: `2px solid ${T.champagne}`,
                    fontSize: FS[11],
                    color: T.subtle,
                    fontFamily: F.mono,
                  }}
                >
                  <span style={{ color: T.champagne }}>✓</span>
                  <span>
                    <strong style={{ color: T.text }}>{selectedMeta.name}</strong>
                    {': '}
                    {selectedMeta.isPostMarket
                      ? '허가 후 변경 (MFDS 변경허가/신고 검토 대상)'
                      : 'R&D 개발 중 변경 (허가 전)'}
                  </span>
                </div>
              )}
            </div>
          ) : q.type === 'change-type' ? (
            <div
              role="radiogroup"
              aria-label="변경 유형 선택"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))', gap: S[2] }}
            >
              {CHANGE_TYPE_OPTIONS.map((opt) => {
                const OptIcon = opt.icon;
                const selected = currentValue === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={opt.label}
                    onClick={() => updateAnswer(opt.value)}
                    style={{
                      minHeight: 76,
                      padding: '10px 8px',
                      fontFamily: F.serif,
                      fontSize: FS[13],
                      fontWeight: 500,
                      background: selected ? T.champagne : 'transparent',
                      color: selected ? T.bg : T.text,
                      border: `1px solid ${selected ? T.champagne : T.border}`,
                      borderRadius: RADIUS.md,
                      cursor: 'pointer',
                      transition: `background ${MOTION.fast}, color ${MOTION.fast}, border-color ${MOTION.fast}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: S[1.5],
                    }}
                  >
                    <OptIcon
                      size={20}
                      aria-hidden="true"
                      style={{ color: selected ? T.bg : T.champagne }}
                    />
                    <span style={{ fontSize: FS[12], fontWeight: 500 }}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          ) : q.type === 'urgency' ? (
            <div
              role="radiogroup"
              aria-label="시급도 선택"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: S[2] }}
            >
              {URGENCY_OPTIONS.map((opt) => {
                const accent =
                  opt.color === 'red' ? T.red : opt.color === 'warning' ? T.warning : T.text;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={currentValue === opt.value}
                    aria-label={`${opt.label}: ${opt.desc}`}
                    onClick={() => updateAnswer(opt.value)}
                    style={{
                      minHeight: 88,
                      padding: '12px 8px',
                      fontFamily: F.serif,
                      fontSize: FS[13],
                      background: currentValue === opt.value ? alpha(accent, 0.1) : 'transparent',
                      color: currentValue === opt.value ? accent : T.text,
                      border: `1px solid ${currentValue === opt.value ? accent : T.border}`,
                      borderRadius: RADIUS.md,
                      cursor: 'pointer',
                      transition: `background ${MOTION.fast}, color ${MOTION.fast}, border-color ${MOTION.fast}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: S[1.5],
                    }}
                  >
                    <span style={{ fontSize: FS[16], fontWeight: 600 }}>{opt.label}</span>
                    <span style={{ fontSize: FS[10], opacity: 0.8 }}>{opt.desc}</span>
                  </button>
                );
              })}
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
          {/* 선택된 제품 컨텍스트 배지 */}
          {selectedMeta && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: S[2],
                padding: '8px 14px',
                background: alpha(selectedMeta.isPostMarket ? T.green : T.champagne, 0.06),
                borderLeft: `2px solid ${selectedMeta.isPostMarket ? T.green : T.champagne}`,
                fontSize: FS[11],
                color: T.subtle,
                fontFamily: F.mono,
                marginBottom: S[3.5],
              }}
            >
              <span style={{ color: selectedMeta.isPostMarket ? T.green : T.champagne }}>
                {selectedMeta.isPostMarket ? '허가 후' : '허가 전'}
              </span>
              <span>
                <strong style={{ color: T.text }}>{selectedMeta.name}</strong>
                {selectedMeta.isPostMarket
                  ? ': MFDS 변경허가/신고 해당 여부를 Q-Atelier 분석 엔진이 판정합니다.'
                  : ': 허가 전 개발 변경으로 분석합니다.'}
              </span>
            </div>
          )}

          <SectionTitle>
            {streaming ? 'Q-Atelier가 변경 의뢰를 작성 중...' : error ? '생성 실패' : '초안 완성 ✓'}
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
                  borderRadius: 10,
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
                      onClick={() => {
                        if (!draftId) {
                          toast.info('초안 자동 저장 중입니다. 잠시 후 다시 시도해주세요.');
                          return;
                        }
                        setPromoteOpen(true);
                      }}
                      style={{ background: T.champagne, color: T.bg, borderColor: T.champagne }}
                    >
                      CR 등록 + 결재
                    </Btn>
                  </>
                )}
              </>
            )}
          </div>

          <div style={{ marginTop: S[6], fontSize: FS[11], color: T.subtle, lineHeight: LH.loose }}>
            <Tag size="sm">알림</Tag>{' '}
            본 초안은 Q-Atelier가 생성한 단일 변경 1건 초안입니다. 영향 분석 / 검증 계획은 RA/QA 검토 후 확정.
            규제 영향 (MFDS / FDA / MDR) 은 RA 가 별도 평가 필요.
          </div>
        </div>
      )}

      {/* ── CR 등록 모달 ─────────────────────────────────────────── */}
      {promoteOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="qa-cr-promote-title"
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
            <div style={{ display: 'flex', alignItems: 'center', gap: S[3], marginBottom: S[4] }}>
              <div style={{ flex: 1 }}>
                <div id="qa-cr-promote-title" style={{ fontSize: FS[16], fontWeight: 500, color: T.text }}>
                  변경 의뢰(CR) 등록
                </div>
                <div style={{ fontSize: FS[12], color: T.subtle, marginTop: S[0.5] }}>
                  어떤 R&D 프로젝트에 CR을 등록할까요?
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPromoteOpen(false)}
                aria-label="닫기"
                style={{ background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer', padding: S[1.5], minWidth: 44, minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {selectedMeta && (
              <div
                style={{
                  padding: '8px 12px',
                  background: alpha(selectedMeta.isPostMarket ? T.green : T.champagne, 0.06),
                  borderLeft: `2px solid ${selectedMeta.isPostMarket ? T.green : T.champagne}`,
                  fontSize: FS[11],
                  color: T.subtle,
                  fontFamily: F.mono,
                  marginBottom: S[3.5],
                }}
              >
                {selectedMeta.isPostMarket ? '허가 후 변경' : '허가 전 변경'}: {selectedMeta.name}
              </div>
            )}

            <div style={{ marginBottom: S[4] }}>
              <label
                style={{ display: 'block', fontSize: FS[10], fontFamily: F.mono, color: T.subtle, letterSpacing: 1, marginBottom: S[1.5], textTransform: 'uppercase' }}
              >
                연결할 R&D 프로젝트
              </label>
              {promoteProjects.length === 0 ? (
                <div style={{ fontSize: FS[12], color: T.subtle, padding: '12px 0' }}>
                  활성 R&D 프로젝트가 없습니다. 먼저 프로젝트를 생성해주세요.
                </div>
              ) : (
                <select
                  value={promoteProject}
                  onChange={(e) => setPromoteProject(e.target.value)}
                  aria-label="연결할 R&D 프로젝트 선택"
                  style={{ width: '100%', padding: '12px 14px', fontSize: FS[16], fontFamily: F.ui, background: T.bg, border: `1px solid ${T.border}`, color: T.text, minHeight: 44 }}
                >
                  {promoteProjects.map((p) => (
                    <option key={p.code} value={p.code}>[{p.code}] {p.title}</option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ fontSize: FS[11], color: T.subtle, lineHeight: LH.loose, marginBottom: S[5], padding: S[3], background: alpha(T.champagne, 0.04) }}>
              CR 번호 자동 부여 → 변경 의뢰 등록 → RA/QA 검토 결재 흐름으로 이동합니다.
            </div>

            <div style={{ display: 'flex', gap: S[2], justifyContent: 'flex-end' }}>
              <Btn p={false} sm onClick={() => setPromoteOpen(false)} disabled={promoteBusy}>취소</Btn>
              <Btn
                sm
                onClick={() => void promote()}
                disabled={!promoteProject || promoteBusy}
                style={{ background: T.champagne, color: T.bg, borderColor: T.champagne, minWidth: 120 }}
              >
                {promoteBusy ? '등록 중...' : 'CR 등록'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
