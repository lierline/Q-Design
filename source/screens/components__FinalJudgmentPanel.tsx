'use client';

// =============================================================================
// FinalJudgmentPanel: 3-tier 통합 판단 표시 (Rule Engine + AI + Expert)
// =============================================================================
// 사용자에게는 "정밀 분석 적용" 정도로 표시. 어느 소스가 무엇을 기여했는지는
// audit 로그에만 남고, UI 에는 통합된 메시지로 나옴.
// =============================================================================

import { useEffect, useState } from 'react';
import { Bx, Collapse } from '@/lib/design/components';
import { S, FS, F, T, alpha, LH, RADIUS } from '@/lib/design/tokens';
import {
  Sparkles,
  TriangleAlert,
  ListChecks,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface FinalJudgment {
  assessment_id: string;
  rule_risk_level: string;
  rule_regulatory: string;
  final_risk_level: string;
  final_regulatory: string;
  final_overridden: boolean;
  confidence: 'low' | 'medium' | 'high';
  confidence_reason: string | null;
  considerations: string[];
  suggested_actions: string[];
  expert_count: number;
  weights: {
    re: number;
    ai: number;
    expert_total: number;
    expert_each: number;
    num_experts: number;
    ai_present: boolean;
  } | null;
  weighted_score: number | null;
  ai_synthesis: string | null;
}

const RISK_COLOR: Record<string, string> = {
  LOW: T.green,
  MEDIUM: T.champagne,
  HIGH: T.warning,
  CRITICAL: T.red,
};

const CONF_COLOR = { low: T.warning, medium: T.blue, high: T.green } as const;
const CONF_LABEL = { low: '추가 검토 권장', medium: '보통', high: '높음' } as const;

export function FinalJudgmentPanel({ assessmentCode }: { assessmentCode: string }) {
  const [judgment, setJudgment] = useState<FinalJudgment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    void load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentCode]);

  async function load(force: boolean) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/rule-engine/final-judgment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessment_code: assessmentCode, force }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? data.error ?? '분석 실패');
      } else {
        setJudgment(data.judgment);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  // 로딩 중 표시: 첫 분석 시 3-5초 소요. 부드럽게.
  if (loading && !judgment) {
    return (
      <Bx style={{ padding: S[5], marginTop: S[6] }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: S[2.5],
            color: T.muted,
            fontSize: FS[12],
            fontFamily: F.mono,
          }}
        >
          <Loader2 size={14} className="animate-spin" />
          정밀 분석 중...
        </div>
      </Bx>
    );
  }

  // 에러 (analytics 안 됐어도 메인 결과는 영향 X)
  if (error && !judgment) {
    return null; // 조용히 숨김: Rule Engine 결과는 이미 위에 표시되어 있음
  }

  if (!judgment) return null;

  const hasContent =
    judgment.considerations.length > 0 || judgment.suggested_actions.length > 0;

  return (
    <Bx style={{ padding: S[6], marginTop: S[6] }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: S[2.5], marginBottom: S[3] }}>
        <Sparkles size={16} style={{ color: T.champagne }} />
        <div style={{ fontSize: FS[13], fontFamily: F.serif, fontWeight: 600, color: T.text }}>
          심층 분석
        </div>
        <span
          style={{
            fontSize: FS[12],
            color: CONF_COLOR[judgment.confidence],
            fontFamily: F.mono,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            padding: '2px 8px',
            border: `1px solid ${CONF_COLOR[judgment.confidence]}`,
            borderRadius: RADIUS.sm,
          }}
        >
          신뢰도 {CONF_LABEL[judgment.confidence]}
        </span>
        {judgment.expert_count > 0 && (
          <span
            style={{
              fontSize: FS[12],
              color: T.muted,
              fontFamily: F.mono,
            }}
          >
            · 외부 전문가 {judgment.expert_count}명 검토 반영
          </span>
        )}
      </div>

      {judgment.confidence_reason && (
        <div
          style={{
            fontSize: FS[12],
            color: T.muted,
            marginBottom: S[3.5],
            fontFamily: F.ui,
            lineHeight: LH.normal,
          }}
        >
          {judgment.confidence_reason}
        </div>
      )}

      {/* 위험도 변동 안내 */}
      {judgment.final_overridden && (
        <div
          style={{
            padding: '10px 14px',
            marginBottom: S[3.5],
            background: `${alpha(T.champagne, 0.06)}`,
            fontSize: FS[12],
            lineHeight: LH.relaxed,
            color: T.text,
          }}
        >
          <strong style={{ color: T.champagne }}>위험도 조정됨</strong>
          {': '}
          1차 룰 판정 <code style={{ fontFamily: F.mono }}>{judgment.rule_risk_level}</code>
          {' → '}
          외부 자문·정밀 분석 종합 후 최종{' '}
          <code style={{ fontFamily: F.mono, color: RISK_COLOR[judgment.final_risk_level] }}>
            {judgment.final_risk_level}
          </code>
        </div>
      )}

      {/* AI 종합 정돈 narrative */}
      {judgment.ai_synthesis && (
        <div
          style={{
            padding: '14px 16px',
            marginBottom: S[3.5],
            background: T.surface2,
            fontSize: FS[14],
            lineHeight: 1.75,
            color: T.text,
            fontFamily: F.ui,
          }}
        >
          {judgment.ai_synthesis}
        </div>
      )}

      {/* 가중치 breakdown 바 */}
      {judgment.weights && (
        <WeightsBar weights={judgment.weights} />
      )}

      {hasContent && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: S[3.5] }}>
          {/* Considerations */}
          {judgment.considerations.length > 0 && (
            <JudgmentSection
              icon={<TriangleAlert size={13} style={{ color: T.warning }} />}
              title="추가 고려사항"
              items={judgment.considerations}
              color={T.warning}
            />
          )}

          {/* Suggested actions */}
          {judgment.suggested_actions.length > 0 && (
            <JudgmentSection
              icon={<ListChecks size={13} style={{ color: T.green }} />}
              title="권장 행동"
              items={judgment.suggested_actions}
              color={T.green}
            />
          )}

          {/* 세부 정보 토글: 작게 */}
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              alignSelf: 'flex-start',
              background: 'transparent',
              border: 'none',
              color: T.muted,
              fontSize: FS[12],
              fontFamily: F.mono,
              letterSpacing: 1,
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: S[1],
              padding: 0,
            }}
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? '세부 정보 닫기' : '세부 정보'}
          </button>

          <Collapse open={expanded}>
            <div
              style={{
                padding: '12px 14px',
                background: T.surface,
                fontSize: FS[12],
                fontFamily: F.mono,
                color: T.muted,
                display: 'grid',
                gridTemplateColumns: '120px 1fr',
                gap: '6px 12px',
              }}
            >
              <div>1차 판정</div>
              <div>
                MedQraft Core v{judgment.rule_risk_level} · {judgment.rule_regulatory}
              </div>
              <div>2차 분석</div>
              <div>심층 분석 적용</div>
              <div>3차 검토</div>
              <div>
                {judgment.expert_count > 0
                  ? `외부 전문가 ${judgment.expert_count}명 의견 반영`
                  : '외부 전문가 검토 미진행'}
              </div>
              <div>최종</div>
              <div>
                {judgment.final_risk_level} · {judgment.final_regulatory}
              </div>
              <div style={{ gridColumn: 'span 2', marginTop: S[1.5] }}>
                <button
                  onClick={() => load(true)}
                  disabled={loading}
                  style={{
                    borderRadius: RADIUS.md,
                    background: 'transparent',
                    border: `1px solid ${T.border}`,
                    color: T.muted,
                    padding: '4px 10px',
                    fontSize: FS[12],
                    fontFamily: F.mono,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: S[1.5],
                  }}
                >
                  {loading && (
                    <span
                      aria-hidden
                      style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        border: `1.5px solid ${T.muted}`,
                        borderTopColor: 'transparent',
                        animation: 'qa-spin-fj 0.9s linear infinite',
                      }}
                    />
                  )}
                  {loading ? '재분석 중...' : '강제 재분석'}
                </button>
                <style>{`@keyframes qa-spin-fj { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            </div>
          </Collapse>
        </div>
      )}
    </Bx>
  );
}

function WeightsBar({
  weights,
}: {
  weights: {
    re: number;
    ai: number;
    expert_total: number;
    expert_each: number;
    num_experts: number;
    ai_present: boolean;
  };
}) {
  const segments = [
    { label: 'Rule', value: weights.re, color: T.blue },
    { label: '정밀 분석', value: weights.ai, color: T.champagne },
    {
      label: `외부 자문 ${weights.num_experts}명`,
      value: weights.expert_total,
      color: T.green,
    },
  ].filter((s) => s.value > 0);

  return (
    <div style={{ marginBottom: S[3.5] }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          fontSize: FS[12],
          color: T.muted,
          fontFamily: F.mono,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginBottom: S[1.5],
        }}
      >
        <span>판정 가중치</span>
        <span style={{ color: T.subtle }}>합 100%</span>
      </div>
      <div
        style={{
          borderRadius: RADIUS.md,
          display: 'flex',
          height: 6,
          overflow: 'hidden',
          background: T.surface,
          border: `1px solid ${T.border}`,
        }}
      >
        {segments.map((s) => (
          <div
            key={s.label}
            style={{
              flex: s.value,
              background: s.color,
              transition: 'flex 240ms ease',
            }}
            title={`${s.label} ${(s.value * 100).toFixed(1)}%`}
          />
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: S[3.5],
          marginTop: S[2],
          fontSize: FS[12],
          fontFamily: F.mono,
          color: T.subtle,
        }}
      >
        {segments.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                background: s.color,
              }}
            />
            <span>
              {s.label} <span style={{ color: T.text }}>{(s.value * 100).toFixed(1)}%</span>
            </span>
          </div>
        ))}
      </div>
      {weights.num_experts > 0 && (
        <div
          style={{
            marginTop: S[2],
            fontSize: FS[12],
            color: T.muted,
            fontFamily: F.mono,
            letterSpacing: 0.5,
          }}
        >
          {weights.num_experts >= 4
            ? '전문가 4명+ → 외부 자문 가중치 40%'
            : `전문가 ${weights.num_experts}명 → 외부 자문 가중치 20% (4명 이상 시 40%로 증가)`}
        </div>
      )}
    </div>
  );
}

function JudgmentSection({
  icon,
  title,
  items,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  color: string;
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: S[1.5],
          fontSize: FS[12],
          color: T.muted,
          fontFamily: F.mono,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginBottom: S[1.5],
        }}
      >
        {icon}
        {title}
      </div>
      <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
        {items.map((it, i) => (
          <li
            key={i}
            style={{
              fontSize: FS[13],
              lineHeight: LH.notice,
              color: T.text,
              paddingLeft: S[3.5],
              marginBottom: S[1],
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: 8,
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: color,
              }}
            />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
