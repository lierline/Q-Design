'use client';

// =============================================================================
// ComplianceManager: ISO 13485 자가 점검 UI
// =============================================================================
// 세션 목록 + 새 세션 시작 + 현재 세션 상세 (절별 탭, 항목 응답, Gap 리포트)

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Bx, Btn, Field, LoadingState, SectionTitle, Tag } from '@/lib/design/components';
import { useConfirm } from '@/components/Confirm';
import { S, FS, F, T, alpha, LH } from '@/lib/design/tokens';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileText,
  HelpCircle,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  CHECKLIST,
  CLAUSE_LABEL,
  CLAUSE_RESPONSIBLE_LABEL,
  SEVERITY_LABEL,
  canAnswerClause,
  type ChecklistItem,
  type Clause,
  type Severity,
} from '@/lib/compliance/checklist';
import { getTemplateInfo } from '@/lib/template-catalog';
import type { ScoreResult } from '@/lib/compliance/scoring';
import { dateOnly } from '@/lib/date';

interface AssessmentRow {
  id: string;
  title: string;
  status: 'in_progress' | 'completed' | 'archived';
  overall_score: number | null;
  critical_gaps: number;
  major_gaps: number;
  minor_gaps: number;
  started_at: string;
  completed_at: string | null;
}

interface ItemRow {
  item_code: string;
  status: 'unset' | 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';
  evidence: string | null;
  notes: string | null;
  capa_required: boolean;
}

interface AssessmentDetail {
  assessment: AssessmentRow & {
    notes: string | null;
    org_id: string;
  };
  items: ItemRow[];
  score: ScoreResult;
  outlook: { outcome: string; message: string };
}

const STATUS_LABEL: Record<string, string> = {
  unset: '미응답',
  compliant: '준수',
  partial: '부분 준수',
  non_compliant: '미준수',
  not_applicable: '해당 없음',
};

const STATUS_COLOR: Record<string, string> = {
  unset: T.muted,
  compliant: T.green,
  partial: T.warning,
  non_compliant: T.red,
  not_applicable: T.subtle,
};

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: T.red,
  major: T.warning,
  minor: T.subtle,
};

export function ComplianceManager({
  orgId: _orgId,
  myJobRole,
  myOrgRole,
}: {
  orgId: string;
  myJobRole?: string | null;
  myOrgRole?: string | null;
}) {
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { confirm } = useConfirm();

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/compliance/assessments', { cache: 'no-store' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? `HTTP ${res.status}`);
        return;
      }
      const data = (await res.json()) as { assessments: AssessmentRow[] };
      setAssessments(data.assessments ?? []);
      // 활성 세션 없으면 최신 in_progress 자동 선택
      if (!activeId) {
        const first = data.assessments.find((a) => a.status === 'in_progress') ?? data.assessments[0];
        if (first) setActiveId(first.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  const loadDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/compliance/assessments/${encodeURIComponent(id)}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? `HTTP ${res.status}`);
        return;
      }
      const data = (await res.json()) as AssessmentDetail;
      setDetail(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (activeId) void loadDetail(activeId);
  }, [activeId, loadDetail]);

  async function startNew() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/compliance/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message ?? `HTTP ${res.status}`);
        return;
      }
      setActiveId(data.assessment.id);
      await loadList();
    } finally {
      setBusy(false);
    }
  }

  async function deleteAssessment(id: string) {
    if (
      !(await confirm({
        title: '점검 세션 삭제',
        message: '이 점검 세션을 삭제합니다. 응답 기록도 모두 사라지며 되돌릴 수 없습니다.',
        confirmLabel: '삭제',
        destructive: true,
      }))
    )
      return;
    setBusy(true);
    try {
      const res = await fetch(`/api/compliance/assessments/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? `HTTP ${res.status}`);
        return;
      }
      if (activeId === id) {
        setActiveId(null);
        setDetail(null);
      }
      await loadList();
    } finally {
      setBusy(false);
    }
  }

  async function complete() {
    if (!activeId) return;
    if (
      !(await confirm({
        title: '점검 완료 처리',
        message: '현재 응답을 기준으로 점검을 완료 상태로 표시합니다. 완료 후에도 다시 진행 중으로 되돌릴 수 있습니다.',
        confirmLabel: '완료 처리',
      }))
    )
      return;
    setBusy(true);
    try {
      await fetch(`/api/compliance/assessments/${encodeURIComponent(activeId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', recompute: true }),
      });
      await loadList();
      await loadDetail(activeId);
    } finally {
      setBusy(false);
    }
  }

  async function updateItem(item_code: string, patch: Partial<ItemRow>) {
    if (!activeId) return;
    await fetch(`/api/compliance/assessments/${encodeURIComponent(activeId)}/items`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_code, ...patch }),
    });
    // 세션 cached 점수 재계산 + 화면 갱신
    await fetch(`/api/compliance/assessments/${encodeURIComponent(activeId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recompute: true }),
    });
    await loadDetail(activeId);
    await loadList();
  }

  // ─── 렌더 ────────────────────────────────────────────────────────────
  if (loading) {
    return <LoadingState />;
  }

  return (
    <div>
      {error && (
        <div style={{ marginBottom: S[3.5] }}>
          <Alert kind="error" onClose={() => setError(null)}>{error}</Alert>
        </div>
      )}

      {/* ─── 세션 목록 + 새 점검 ──────────────────────────────────────
          세션 pill 과 '+ 새 점검' Btn sm 의 사이즈가 달라 한 줄에서 어긋났었음.
          pill 을 Btn sm 과 동일한 minHeight/padding/lineHeight/boxSizing 으로
          맞춰 같은 row 의 모든 사각형 높이 통일. */}
      <div style={{ display: 'flex', gap: S[2], alignItems: 'center', marginBottom: S[3.5], flexWrap: 'wrap' }}>
        <span style={{ fontSize: FS[10], color: T.muted, fontFamily: F.mono, letterSpacing: 1, textTransform: 'uppercase' }}>
          점검 세션
        </span>
        {assessments.map((a) => {
          const active = a.id === activeId;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setActiveId(a.id)}
              style={{
                // Btn sm 과 정확히 동일한 box: 36px 높이, 7×14 padding,
                // boxSizing:border-box, lineHeight:1.
                boxSizing: 'border-box',
                minHeight: 36,
                padding: '7px 14px',
                background: active ? alpha(T.champagne, 0.1) : 'transparent',
                border: `1px solid ${active ? T.champagne : T.border}`,
                color: active ? T.text : T.subtle,
                fontSize: FS[11],
                fontFamily: F.mono,
                letterSpacing: 0.3,
                lineHeight: LH.none,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: S[1.5],
                whiteSpace: 'nowrap',
              }}
            >
              <span>{dateOnly(a.started_at)}</span>
              {a.overall_score !== null && (
                <span style={{ color: T.champagne, fontWeight: 600 }}>{a.overall_score}%</span>
              )}
              {a.status === 'completed' && <Tag color={T.green}>완료</Tag>}
            </button>
          );
        })}
        <Btn sm onClick={startNew} disabled={busy}>
          <Plus size={11} style={{ marginRight: S[1] }} />새 점검
        </Btn>
      </div>

      {!detail ? (
        <Bx style={{ padding: S[8], textAlign: 'center' }}>
          <ClipboardCheck size={28} style={{ color: T.muted, marginBottom: S[2.5] }} />
          <div style={{ fontSize: FS[13], color: T.subtle, fontFamily: F.serif, marginBottom: S[1.5] }}>
            아직 점검 기록이 없습니다.
          </div>
          <div style={{ fontSize: FS[11], color: T.muted, fontFamily: F.mono, lineHeight: LH.relaxed }}>
            새 점검 을 눌러 ISO 13485 §4~§8 약 45개 항목을 자가 점검하세요.
            <br />외부 감사 대비 + Gap 우선순위 + 관련 양식 자동 연결.
          </div>
        </Bx>
      ) : (
        <ComplianceDetail
          detail={detail}
          busy={busy}
          onUpdateItem={updateItem}
          onComplete={complete}
          onDelete={() => deleteAssessment(detail.assessment.id)}
          myJobRole={myJobRole}
          myOrgRole={myOrgRole}
        />
      )}
    </div>
  );
}

// ─── 상세 ─────────────────────────────────────────────────────────────────
function ComplianceDetail({
  detail,
  busy,
  onUpdateItem,
  onComplete,
  onDelete,
  myJobRole,
  myOrgRole,
}: {
  detail: AssessmentDetail;
  busy: boolean;
  onUpdateItem: (code: string, patch: Partial<ItemRow>) => Promise<void>;
  onComplete: () => void;
  onDelete: () => void;
  myJobRole?: string | null;
  myOrgRole?: string | null;
}) {
  const [activeClause, setActiveClause] = useState<Clause | 'gaps'>('gaps');
  const { assessment, items, score, outlook } = detail;
  const itemByCode = new Map(items.map((i) => [i.item_code, i]));

  return (
    <>
      <ScoreOverview score={score} outlook={outlook} assessment={assessment} />

      {/* ─── 절별 탭 ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 0, marginTop: S[5], borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
        <ClauseTab
          active={activeClause === 'gaps'}
          onClick={() => setActiveClause('gaps')}
          label="Gap 리포트"
          sub={`${score.gaps.length}건`}
          accent={score.gaps.length > 0 ? T.red : T.muted}
        />
        {(['4', '5', '6', '7', '8'] as Clause[]).map((c) => {
          const cl = score.by_clause.find((x) => x.clause === c)!;
          const sectionItems = CHECKLIST.filter((i) => i.clause === c);
          return (
            <ClauseTab
              key={c}
              active={activeClause === c}
              onClick={() => setActiveClause(c)}
              label={`${CLAUSE_LABEL[c].num} ${CLAUSE_LABEL[c].title}`}
              sub={`${cl.answered}/${sectionItems.length}`}
              accent={cl.pct >= 85 ? T.green : cl.pct >= 70 ? T.warning : T.red}
              score={cl.answered > 0 ? `${cl.pct}%` : undefined}
            />
          );
        })}
      </div>

      <div style={{ marginTop: S[4] }}>
        {activeClause === 'gaps' ? (
          <GapReport gaps={score.gaps} onUpdateItem={onUpdateItem} />
        ) : (
          <ClauseItems
            clause={activeClause}
            itemByCode={itemByCode}
            onUpdateItem={onUpdateItem}
            myJobRole={myJobRole}
            myOrgRole={myOrgRole}
          />
        )}
      </div>

      {/* ─── 액션 ────────────────────────────────────────────────── */}
      <div
        style={{
          marginTop: S[6],
          padding: S[3.5],
          background: T.surface,
          border: `1px solid ${T.border}`,
          display: 'flex',
          gap: S[2.5],
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Tag color={assessment.status === 'completed' ? T.green : T.muted}>
          {assessment.status === 'completed' ? '완료됨' : '진행 중'}
        </Tag>
        <span style={{ fontSize: FS[11], color: T.muted, fontFamily: F.mono }}>
          시작 {dateOnly(assessment.started_at)}
          {assessment.completed_at && ' · 완료 ' + dateOnly(assessment.completed_at)}
        </span>
        <div style={{ flex: 1 }} />
        {assessment.status !== 'completed' && (
          <Btn sm onClick={onComplete} disabled={busy}>
            <CheckCircle2 size={11} style={{ marginRight: S[1] }} />점검 완료로 표시
          </Btn>
        )}
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          style={{
            padding: '7px 14px',
            background: 'transparent',
            color: T.red,
            border: `1px solid ${T.red}`,
            fontSize: FS[10],
            fontFamily: F.mono,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: S[1],
          }}
        >
          <Trash2 size={11} /> 삭제
        </button>
      </div>
    </>
  );
}

// ─── 점수 개요 ────────────────────────────────────────────────────────────
function ScoreOverview({
  score,
  outlook,
  assessment,
}: {
  score: ScoreResult;
  outlook: { outcome: string; message: string };
  assessment: AssessmentDetail['assessment'];
}) {
  const pct = score.overall.score_pct;
  const _ = assessment; // suppress unused warning
  void _;
  const outlookColor =
    outlook.outcome === 'likely_pass'
      ? T.green
      : outlook.outcome === 'pass_with_findings'
        ? T.subtle
        : outlook.outcome === 'likely_findings'
          ? T.warning
          : T.red;

  return (
    <div>
      <style>{`
        @media (max-width: 640px) {
          .qa-compliance-score-strip {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <SectionTitle>점수 개요</SectionTitle>
      <div className="qa-compliance-score-strip" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: S[2.5] }}>
        {/* ─── 전체 점수 큰 카드 ─── */}
        <Bx style={{ padding: S[4.5], borderLeft: `3px solid ${outlookColor}`, background: alpha(outlookColor, 0.04) }}>
          <div
            style={{
              fontSize: FS[10],
              color: T.muted,
              letterSpacing: 1.5,
              fontFamily: F.mono,
              textTransform: 'uppercase',
              marginBottom: S[1],
            }}
          >
            전체 점수
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: S[3], marginBottom: S[2] }}>
            <span style={{ fontSize: FS[40], color: T.text, fontFamily: F.serif, fontWeight: 500, lineHeight: LH.none }}>
              {pct}%
            </span>
            <span style={{ fontSize: FS[11], color: T.muted, fontFamily: F.mono }}>
              ({score.overall.compliant + score.overall.partial * 0.5 || 0}점 / {score.overall.weighted_total}점: 가중)
            </span>
          </div>
          {/* progress bar */}
          <div style={{ height: 4, background: alpha(T.muted, 0.2), marginBottom: S[2.5] }}>
            <div style={{ height: '100%', width: `${pct}%`, background: outlookColor, transition: 'width 300ms' }} />
          </div>
          <div style={{ fontSize: FS[11], color: T.subtle, lineHeight: LH.relaxed, fontFamily: F.serif }}>
            {outlook.message}
          </div>
        </Bx>

        <MetricCard label="치명적 부적합" value={score.overall.critical_gaps} accent={T.red} sub="Critical" />
        <MetricCard label="중대 부적합" value={score.overall.major_gaps} accent={T.warning} sub="Major" />
        <MetricCard label="경미 부적합" value={score.overall.minor_gaps} accent={T.subtle} sub="Minor" />
      </div>

      {/* ─── 응답 진행도 ─── */}
      <div
        style={{
          marginTop: S[2.5],
          padding: S[3],
          background: T.surface,
          border: `1px solid ${T.border}`,
          display: 'flex',
          gap: S[4],
          alignItems: 'center',
          flexWrap: 'wrap',
          fontSize: FS[11],
          fontFamily: F.mono,
          color: T.muted,
          letterSpacing: 0.3,
        }}
      >
        <span>
          응답 진행도: <strong style={{ color: T.text }}>{score.overall.answered}</strong>{' '}
          / {score.overall.total} ({score.overall.unset} 미응답
          {score.overall.not_applicable > 0 ? `, ${score.overall.not_applicable} 해당없음` : ''})
        </span>
        <span style={{ color: T.green }}>● 준수 {score.overall.compliant}</span>
        <span style={{ color: T.warning }}>● 부분 {score.overall.partial}</span>
        <span style={{ color: T.red }}>● 미준수 {score.overall.non_compliant}</span>
      </div>

      {/* ─── 절별 막대 차트 ─── */}
      <div style={{ marginTop: S[3] }}>
        <div
          style={{
            fontSize: FS[10],
            color: T.muted,
            letterSpacing: 1.5,
            fontFamily: F.mono,
            textTransform: 'uppercase',
            marginBottom: S[2],
          }}
        >
          절별 점수
        </div>
        <Bx style={{ padding: S[3.5] }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: S[2.5] }}>
            {score.by_clause.map((cl) => (
              <ClauseBar key={cl.clause} cl={cl} />
            ))}
          </div>
        </Bx>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
  sub,
}: {
  label: string;
  value: number | string;
  accent: string;
  sub?: string;
}) {
  return (
    <Bx style={{ padding: S[3.5], borderLeft: `2px solid ${accent}` }}>
      <div
        style={{
          fontSize: FS[10],
          color: T.muted,
          letterSpacing: 1.5,
          fontFamily: F.mono,
          textTransform: 'uppercase',
          marginBottom: S[1],
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: FS[24], color: accent, fontFamily: F.serif, fontWeight: 500 }}>{value}</div>
      {sub && (
        <div style={{ fontSize: FS[10], color: T.muted, fontFamily: F.mono, marginTop: S[0.5] }}>{sub}</div>
      )}
    </Bx>
  );
}

function ClauseBar({ cl }: { cl: ScoreResult['by_clause'][number] }) {
  const labelColor = cl.pct >= 85 ? T.green : cl.pct >= 70 ? T.warning : T.red;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: S[1] }}>
        <span style={{ fontSize: FS[11], color: T.text, fontFamily: F.serif }}>{cl.label}</span>
        <span style={{ fontSize: FS[11], color: labelColor, fontFamily: F.mono, fontWeight: 600, letterSpacing: 0.3 }}>
          {cl.answered > 0 ? `${cl.pct}%` : '미응답'}
          {cl.critical_gaps > 0 && (
            <span style={{ marginLeft: S[2], color: T.red, fontSize: FS[10] }}>● {cl.critical_gaps}</span>
          )}
          {cl.major_gaps > 0 && (
            <span style={{ marginLeft: S[1], color: T.warning, fontSize: FS[10] }}>● {cl.major_gaps}</span>
          )}
        </span>
      </div>
      <div style={{ height: 4, background: alpha(T.muted, 0.2) }}>
        <div style={{ height: '100%', width: `${cl.pct}%`, background: labelColor, transition: 'width 300ms' }} />
      </div>
    </div>
  );
}

// ─── 절 탭 버튼 ───────────────────────────────────────────────────────────
function ClauseTab({
  active,
  onClick,
  label,
  sub,
  accent,
  score,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string;
  accent: string;
  score?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '10px 14px',
        background: 'transparent',
        border: 'none',
        borderBottom: active ? `2px solid ${T.champagne}` : '2px solid transparent',
        color: active ? T.text : T.muted,
        cursor: 'pointer',
        fontFamily: F.serif,
        fontSize: FS[12],
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: S[0.5],
        minWidth: 100,
      }}
    >
      <span style={{ fontWeight: active ? 600 : 400, letterSpacing: 0.2 }}>{label}</span>
      <span style={{ fontSize: FS[10], color: T.muted, fontFamily: F.mono, letterSpacing: 0.5 }}>
        {sub}
        {score && (
          <span style={{ marginLeft: S[1.5], color: accent, fontWeight: 600 }}>{score}</span>
        )}
      </span>
    </button>
  );
}

// ─── 절 항목 리스트 ────────────────────────────────────────────────────────
function ClauseItems({
  clause,
  itemByCode,
  onUpdateItem,
  myJobRole,
  myOrgRole,
}: {
  clause: Clause;
  itemByCode: Map<string, ItemRow>;
  onUpdateItem: (code: string, patch: Partial<ItemRow>) => Promise<void>;
  myJobRole?: string | null;
  myOrgRole?: string | null;
}) {
  const items = CHECKLIST.filter((i) => i.clause === clause);

  // 같은 clause_label 끼리 그룹화
  const grouped = new Map<string, ChecklistItem[]>();
  for (const it of items) {
    const arr = grouped.get(it.clause_label) ?? [];
    arr.push(it);
    grouped.set(it.clause_label, arr);
  }

  // 이 절에 대한 답변 권한: ISO 13485 §5.5.1 책임·권한 매핑.
  const canAnswer = canAnswerClause(clause, {
    jobRole: myJobRole,
    orgRole: myOrgRole,
  });
  const responsibleLabel = CLAUSE_RESPONSIBLE_LABEL[clause];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: S[3] }}>
      {/* 책임자 안내 배너: 본인 직무가 책임자가 아니면 read-only 안내 */}
      {!canAnswer && (
        <div
          role="status"
          style={{
            padding: '10px 14px',
            background: alpha(T.warning, 0.08),
            border: `1px solid ${alpha(T.warning, 0.35)}`,
            borderLeft: `3px solid ${T.warning}`,
            fontSize: FS[12],
            color: T.text,
            fontFamily: F.serif,
            lineHeight: LH.notice,
          }}
        >
          <strong style={{ color: T.warning }}>이 절의 답변·평가 권한은 {responsibleLabel} 담당</strong>
          입니다. 본인 직무로는 진행 상황만 조회할 수 있습니다.
          {' '}답변이 필요하면 {responsibleLabel} 담당자에게 요청해 주세요.
        </div>
      )}
      {Array.from(grouped.entries()).map(([sub, list]) => (
        <Bx key={sub} style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '8px 14px',
              background: alpha(T.champagne, 0.05),
              borderBottom: `1px solid ${T.border}`,
              fontSize: FS[11],
              color: T.champagne,
              fontFamily: F.mono,
              letterSpacing: 1,
              fontWeight: 600,
            }}
          >
            {sub}
          </div>
          {list.map((it, i) => (
            <ItemBlock
              key={it.code}
              item={it}
              answer={itemByCode.get(it.code)}
              first={i === 0}
              canAnswer={canAnswer}
              onUpdate={(patch) => onUpdateItem(it.code, patch)}
            />
          ))}
        </Bx>
      ))}
    </div>
  );
}

// ─── 항목 블록 ────────────────────────────────────────────────────────────
function ItemBlock({
  item,
  answer,
  first,
  canAnswer,
  onUpdate,
}: {
  item: ChecklistItem;
  answer: ItemRow | undefined;
  first: boolean;
  canAnswer?: boolean;
  onUpdate: (patch: Partial<ItemRow>) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = answer?.status ?? 'unset';
  const evidence = answer?.evidence ?? '';
  const notes = answer?.notes ?? '';
  const editable = canAnswer ?? true;
  // 항목마다 반복 렌더되므로 item.code 를 섞어 id 충돌 방지 (4.2.4_a → 4-2-4-a).
  const idKey = item.code.replace(/[^a-zA-Z0-9]+/g, '-');
  const evidenceId = `compliance-${idKey}-evidence`;
  const notesId = `compliance-${idKey}-notes`;

  return (
    <div
      style={{
        padding: '12px 14px',
        borderTop: first ? 'none' : `1px dashed ${T.border}`,
      }}
    >
      <div style={{ display: 'flex', gap: S[3], alignItems: 'flex-start' }}>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: T.muted,
            marginTop: S[0.5],
          }}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: S[2], flexWrap: 'wrap', marginBottom: S[1] }}>
            <span style={{ fontSize: FS[12], color: T.text, fontFamily: F.serif, fontWeight: 500 }}>
              {item.question}
            </span>
            <Tag color={SEVERITY_COLOR[item.severity]}>{SEVERITY_LABEL[item.severity]}</Tag>
            <span style={{ fontSize: FS[10], color: T.muted, fontFamily: F.mono }}>
              {item.iso_reference}
            </span>
          </div>
          {item.hint && (
            <div style={{ fontSize: FS[11], color: T.subtle, fontFamily: F.serif, lineHeight: LH.normal, marginBottom: S[1.5] }}>
              <HelpCircle size={10} style={{ display: 'inline', marginRight: S[1], verticalAlign: 'middle' }} />
              {item.hint}
            </div>
          )}
          {item.related_doc_codes && item.related_doc_codes.length > 0 && (
            <div style={{ display: 'flex', gap: S[1.5], flexWrap: 'wrap', marginBottom: S[1.5] }}>
              {item.related_doc_codes.map((c) => {
                const info = getTemplateInfo(c);
                return (
                  <Link
                    key={c}
                    href="/settings/templates"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: S[1],
                      padding: '3px 8px',
                      background: 'transparent',
                      border: `1px solid ${alpha(T.champagne, 0.3)}`,
                      color: T.champagne,
                      fontSize: FS[10],
                      fontFamily: F.mono,
                      letterSpacing: 0.3,
                      textDecoration: 'none',
                    }}
                  >
                    <FileText size={9} />
                    {info?.name_kr ?? c}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        <select
          value={status}
          disabled={!editable}
          title={editable ? undefined : '본인 직무로는 답변 권한이 없습니다.'}
          onChange={(e) => onUpdate({ status: e.target.value as ItemRow['status'] })}
          style={{
            padding: '5px 8px',
            background: T.surface,
            border: `1px solid ${T.border}`,
            color: STATUS_COLOR[status] ?? T.text,
            fontSize: FS[11],
            fontFamily: F.mono,
            letterSpacing: 0.3,
            cursor: editable ? 'pointer' : 'not-allowed',
            opacity: editable ? 1 : 0.55,
          }}
        >
          {Object.entries(STATUS_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {expanded && (
        <div style={{ marginTop: S[2.5], marginLeft: S[6.5], display: 'flex', flexDirection: 'column', gap: S[2] }}>
          <Field id={evidenceId} label="증빙 / 근거">
            <textarea
              id={evidenceId}
              defaultValue={evidence}
              disabled={!editable}
              onBlur={(e) => {
                if (e.target.value !== evidence) onUpdate({ evidence: e.target.value });
              }}
              rows={2}
              placeholder={editable ? '문서 번호 / 위치 / 책임자 등' : '(권한 없음. 읽기 전용)'}
              style={{
                ...textareaStyle,
                opacity: editable ? 1 : 0.55,
                cursor: editable ? 'text' : 'not-allowed',
              }}
            />
          </Field>
          <Field id={notesId} label="개선 메모">
            <textarea
              id={notesId}
              defaultValue={notes}
              disabled={!editable}
              onBlur={(e) => {
                if (e.target.value !== notes) onUpdate({ notes: e.target.value });
              }}
              rows={2}
              placeholder={editable ? 'CAPA 계획 / 책임자 / 기한' : '(권한 없음. 읽기 전용)'}
              style={{
                ...textareaStyle,
                opacity: editable ? 1 : 0.55,
                cursor: editable ? 'text' : 'not-allowed',
              }}
            />
          </Field>
        </div>
      )}
    </div>
  );
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  background: T.surface,
  border: `1px solid ${T.border}`,
  color: T.text,
  fontSize: FS[11],
  fontFamily: F.serif,
  resize: 'vertical',
  outline: 'none',
  lineHeight: LH.normal,
};

// ─── Gap 리포트 ────────────────────────────────────────────────────────────
function GapReport({
  gaps,
  onUpdateItem,
}: {
  gaps: ScoreResult['gaps'];
  onUpdateItem: (code: string, patch: Partial<ItemRow>) => Promise<void>;
}) {
  if (gaps.length === 0) {
    return (
      <Bx style={{ padding: S[6], textAlign: 'center', borderLeft: `3px solid ${T.green}` }}>
        <CheckCircle2 size={28} style={{ color: T.green, marginBottom: S[2] }} />
        <div style={{ fontSize: FS[13], color: T.text, fontFamily: F.serif, marginBottom: S[1] }}>
          식별된 부적합이 없습니다.
        </div>
        <div style={{ fontSize: FS[11], color: T.muted, fontFamily: F.mono }}>
          미응답 항목이 있다면 절별 탭에서 답변하세요.
        </div>
      </Bx>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: S[2.5] }}>
      <div
        style={{
          padding: S[3],
          background: alpha(T.red, 0.04),
          borderLeft: `2px solid ${T.red}`,
          fontSize: FS[11],
          color: T.subtle,
          fontFamily: F.mono,
          letterSpacing: 0.3,
          lineHeight: LH.relaxed,
        }}
      >
        ▸ 심각도 순으로 정렬되었습니다. 치명적 부적합은 외부 감사 시 Major NCR 발급 가능성이 높습니다.
      </div>

      {gaps.map((g) => (
        <Bx
          key={g.item.code}
          style={{
            padding: S[3.5],
            borderLeft: `2px solid ${SEVERITY_COLOR[g.item.severity]}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: S[2], flexWrap: 'wrap', marginBottom: S[1.5] }}>
            {g.answer.status === 'non_compliant' ? (
              <XCircle size={14} style={{ color: T.red, flexShrink: 0 }} />
            ) : (
              <AlertTriangle size={14} style={{ color: T.warning, flexShrink: 0 }} />
            )}
            <Tag color={SEVERITY_COLOR[g.item.severity]}>{SEVERITY_LABEL[g.item.severity]}</Tag>
            <Tag color={STATUS_COLOR[g.answer.status]}>{STATUS_LABEL[g.answer.status]}</Tag>
            <span style={{ fontSize: FS[10], color: T.muted, fontFamily: F.mono }}>{g.item.iso_reference}</span>
          </div>
          <div style={{ fontSize: FS[12], color: T.text, fontFamily: F.serif, marginBottom: S[1.5], lineHeight: LH.normal }}>
            {g.item.question}
          </div>
          {g.item.hint && (
            <div style={{ fontSize: FS[11], color: T.subtle, fontFamily: F.serif, marginBottom: S[1.5], lineHeight: LH.normal }}>
              {g.item.hint}
            </div>
          )}
          {g.answer.notes && (
            <div
              style={{
                padding: S[2],
                background: T.surface,
                fontSize: FS[11],
                color: T.subtle,
                fontFamily: F.mono,
                lineHeight: LH.normal,
                marginTop: S[1.5],
              }}
            >
              개선 메모: {g.answer.notes}
            </div>
          )}
          {g.item.related_doc_codes && g.item.related_doc_codes.length > 0 && (
            <div style={{ display: 'flex', gap: S[1.5], flexWrap: 'wrap', marginTop: S[2] }}>
              {g.item.related_doc_codes.map((c) => {
                const info = getTemplateInfo(c);
                return (
                  <Link
                    key={c}
                    href="/settings/templates"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: S[1],
                      padding: '3px 8px',
                      background: 'transparent',
                      border: `1px solid ${alpha(T.champagne, 0.4)}`,
                      color: T.champagne,
                      fontSize: FS[10],
                      fontFamily: F.mono,
                      letterSpacing: 0.3,
                      textDecoration: 'none',
                    }}
                  >
                    <FileText size={9} />
                    관련 양식: {info?.name_kr ?? c}
                  </Link>
                );
              })}
            </div>
          )}
          <div style={{ marginTop: S[2.5], display: 'flex', gap: S[1.5] }}>
            <button
              type="button"
              onClick={() => onUpdateItem(g.item.code, { status: 'compliant' })}
              style={smallBtn(T.green)}
            >
              <CheckCircle2 size={10} /> 준수로 변경
            </button>
            <button
              type="button"
              onClick={() => onUpdateItem(g.item.code, { capa_required: !g.answer.capa_required })}
              style={smallBtn(g.answer.capa_required ? T.warning : T.subtle)}
            >
              {g.answer.capa_required ? '✓ CAPA 필요' : '+ CAPA 필요로 표시'}
            </button>
          </div>
        </Bx>
      ))}
    </div>
  );
}

function smallBtn(color: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: S[1],
    padding: '4px 10px',
    background: 'transparent',
    color,
    border: `1px solid ${color}`,
    fontSize: FS[10],
    fontFamily: F.mono,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    cursor: 'pointer',
    lineHeight: LH.none,
  };
}
