'use client';

// =============================================================================
// Dashboard 공용 위젯: 여러 View 에서 재사용되는 작은 UI 조각
// =============================================================================
// ★'use client' 필수: OrgSubTable/RecentList 가 클라 프리미티브 DataTable 에 render·
//   getRowStyle *함수 prop* 을 넘긴다. 서버 컴포넌트(대시보드 View)에서 렌더되면 RSC 가
//   함수를 직렬화 못 해 크래시("Functions cannot be passed to Client Components").
//   client 모듈로 두면 함수 prop 전달이 client→client 라 안전.
//   (docCompletionStageV2 헬퍼는 외부 서버 사용처 없음. client 화 안전.)
// 분리 이전엔 app/(app)/dashboard/page.tsx (2,765줄) 안에 모두 들어 있었음.
// 같은 위젯 (KpiItemList tooltip 등) 이 6개 View 에서 호출되므로 한 곳에서 관리.

import Link from 'next/link';
import { Bx, Btn, Card, CardTitle, DataTable, Tag, type DataTableColumn } from '@/lib/design/components';
import { F, FS, LH, S, T, alpha, labelTracking, labelWordSpacing, riskColor } from '@/lib/design/tokens';
import { isoDateTime } from '@/lib/date';
import { computeResearchProgress } from '@/lib/research/progress';
import { latestResult } from './utils';
import type { AssessmentRow, OrgSubRow } from './types';
import { subscriptionPlanLabel, SUBSCRIPTION_STATUS_LABEL } from '@/lib/subscription/plan-policy';

// ═══════════════════════════════════════════════════════════════════════════
// OrgBreakdownList: KPI 툴팁 안에서 조직별 breakdown 표시.
// ═══════════════════════════════════════════════════════════════════════════
export function OrgBreakdownList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  if (rows.length === 0) {
    return (
      <div>
        <strong>{title}</strong>
        <br />
        해당 조직이 없습니다.
      </div>
    );
  }
  return (
    <div>
      <div
        style={{
          fontSize: FS[12],
          color: T.champagne,
          fontFamily: F.mono,
          letterSpacing: labelTracking(title, 1.2),
          wordSpacing: labelWordSpacing(title),
          textTransform: 'uppercase',
          fontWeight: 600,
          marginBottom: S[2],
        }}
      >
        {title} ({rows.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: S[1] }}>
        {rows.slice(0, 12).map((r, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: S[2.5],
              fontSize: FS[12],
              fontFamily: F.serif,
            }}
          >
            <span
              style={{
                color: T.text,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
            >
              {r.label}
            </span>
            <span
              style={{
                color: T.muted,
                fontFamily: F.mono,
                fontSize: FS[12],
                letterSpacing: 0.3,
                whiteSpace: 'nowrap',
              }}
            >
              {r.value}
            </span>
          </div>
        ))}
        {rows.length > 12 && (
          <div style={{ fontSize: FS[12], color: T.muted, fontFamily: F.mono }}>
            ... 외 {rows.length - 12}개 조직
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// KpiItemList: KPI 툴팁 안에 "그 숫자를 구성하는 실제 항목" drill-down.
// OrgBreakdownList 와 동일 패턴이지만 항목 길이가 다양한 일반 list 용
// (프로젝트 코드·제목, 평가 코드·제목, doc 카운트 등).
//
// - rows 가 비면 emptyHint 메시지 표시
// - 6개 이상이면 처음 maxVisible (default 5) 만 표시 후 "외 X건" footer
// ═══════════════════════════════════════════════════════════════════════════
export function KpiItemList({
  title,
  rows,
  emptyHint,
  maxVisible = 5,
}: {
  title: string;
  rows: Array<{ label: string; value?: string }>;
  emptyHint?: string;
  maxVisible?: number;
}) {
  if (rows.length === 0) {
    return (
      <div>
        <div
          style={{
            fontSize: FS[12],
            color: T.champagne,
            fontFamily: F.mono,
            letterSpacing: labelTracking(title, 1.2),
            wordSpacing: labelWordSpacing(title),
            textTransform: 'uppercase',
            fontWeight: 600,
            marginBottom: S[2],
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: FS[12], color: T.muted, fontFamily: F.serif }}>
          표시할 항목 없음
        </div>
        {emptyHint && (
          <div
            style={{
              marginTop: S[1.5],
              fontSize: FS[12],
              color: T.subtle,
              fontFamily: F.serif,
              lineHeight: LH.normal,
            }}
          >
            {emptyHint}
          </div>
        )}
      </div>
    );
  }
  const visible = rows.slice(0, maxVisible);
  const remaining = rows.length - visible.length;
  return (
    <div>
      <div
        style={{
          fontSize: FS[12],
          color: T.champagne,
          fontFamily: F.mono,
          letterSpacing: labelTracking(title, 1.2),
          wordSpacing: labelWordSpacing(title),
          textTransform: 'uppercase',
          fontWeight: 600,
          marginBottom: S[2],
        }}
      >
        {title} ({rows.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: S[1] }}>
        {visible.map((r, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: S[2.5],
              fontSize: FS[12],
              fontFamily: F.serif,
            }}
          >
            <span
              style={{
                color: T.text,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
            >
              {r.label}
            </span>
            {r.value && (
              <span
                style={{
                  color: T.muted,
                  fontFamily: F.mono,
                  fontSize: FS[12],
                  letterSpacing: 0.3,
                  whiteSpace: 'nowrap',
                }}
              >
                {r.value}
              </span>
            )}
          </div>
        ))}
        {remaining > 0 && (
          <div
            style={{
              fontSize: FS[12],
              color: T.muted,
              fontFamily: F.mono,
              marginTop: S[0.5],
            }}
          >
            외 {remaining}건
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AdminToolCard: 도구 카드. 제목·설명·우측하단 진입 버튼.
// ═══════════════════════════════════════════════════════════════════════════
export function AdminToolCard({
  title,
  description,
  href,
  buttonLabel,
}: {
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
}) {
  return (
    <Card>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          // Card 의 내부 padding 만큼 빼고 채우기: 카드들 끼리 높이 자동 정렬.
          minHeight: 132,
        }}
      >
        <CardTitle>{title}</CardTitle>
        <div
          style={{
            fontSize: FS[12],
            color: T.subtle,
            lineHeight: LH.relaxed,
            flex: 1,
          }}
        >
          {description}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: S[3.5],
          }}
        >
          <Link href={href}>
            <Btn p={false} sm>
              {buttonLabel}
            </Btn>
          </Link>
        </div>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 조직별 구독 상세: 모든 조직 (Top N 상시 + 나머지 inline 확장)
// ═══════════════════════════════════════════════════════════════════════════
// 위험 우선 정렬된 rows 가 들어옴. 처음 initialVisible (default 3) 만 상시
// 노출하고, 나머지는 <details> 로 inline 펼치기. 별도 페이지 이동 없이 한
// 화면에서 전체를 확인.
export function OrgSubTable({
  rows,
  initialVisible = 3,
}: {
  rows: OrgSubRow[];
  initialVisible?: number;
}) {
  const tierColor: Record<string, string> = {
    trial: T.muted,
    starter: T.blue,
    professional: T.champagne,
    enterprise: T.green,
  };

  const head = rows.slice(0, initialVisible);
  const tail = rows.slice(initialVisible);

  return (
    <Bx style={{ padding: 0, overflow: 'hidden', marginBottom: S[7] }}>
      <div
        style={{
          padding: '12px 18px',
          fontSize: FS[12],
          color: T.muted,
          fontFamily: F.mono,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          borderBottom: `1px solid ${T.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: S[2.5],
        }}
      >
        <span>
          조직별 상세 · 전체 {rows.length}개
          {tail.length > 0 ? ` (Top ${initialVisible} 상시)` : ''}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: FS[12], letterSpacing: 1, color: T.subtle }}>
          한도 임박 · 만료 임박 순
        </span>
      </div>

      <DataTable
        columns={orgSubColumns(tierColor)}
        rows={head}
        getRowKey={(row) => row.org_id}
        showHeader
        dividers="solid"
        minWidth={780}
        stickyFirstCol
        getRowStyle={(row) => ({ background: orgSubRowState(row).rowBg })}
        ariaLabel="조직별 구독 상세"
      />

      {/* 나머지 조직: 펼치기 (native <details>). 별도 페이지 이동 없이 inline. */}
      {tail.length > 0 && (
        <details className="qa-org-details">
          <summary
            style={{
              padding: '10px 18px',
              fontSize: FS[12],
              color: T.champagne,
              fontFamily: F.mono,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              borderTop: `1px solid ${T.border}`,
              cursor: 'pointer',
              listStyle: 'none',
              userSelect: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'background 0.12s ease',
            }}
          >
            <span className="qa-org-details-label">
              ▼ 나머지 {tail.length}개 조직 펼치기
            </span>
            <span style={{ fontSize: FS[12], color: T.muted }}>
              전체 {rows.length}개 / Top {head.length} 노출
            </span>
          </summary>
          <DataTable
            columns={orgSubColumns(tierColor)}
            rows={tail}
            getRowKey={(row) => row.org_id}
            showHeader={false}
            dividers="solid"
            minWidth={780}
            stickyFirstCol
            getRowStyle={(row) => ({ background: orgSubRowState(row).rowBg })}
            ariaLabel="조직별 구독 상세 (나머지)"
          />
        </details>
      )}

      {/* 펼친 상태일 때 summary 라벨을 '접기' 로 자동 전환: CSS only */}
      <style>{`
        details[open] > summary .qa-org-details-label::before {
          content: '▲ 접기: Top ${head.length} 만 보기';
        }
        details[open] > summary .qa-org-details-label {
          font-size: 0;
        }
        details[open] > summary .qa-org-details-label::before {
          font-size: 12px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }
      `}</style>
    </Bx>
  );
}

// OrgSubTable 행 파생 상태: usage/expiry 임계값에 따른 색·강조·행 배경 tint.
function orgSubRowState(row: OrgSubRow) {
  const isOverQuota = row.usage_pct >= 100;
  const isNearQuota = row.usage_pct >= 80;
  const isExpired = row.expires_in_days < 0;
  const isExpiringSoon = row.expires_in_days >= 0 && row.expires_in_days < 30;
  const usageColor = isOverQuota ? T.red : isNearQuota ? T.warning : T.text;
  const expiryColor = isExpired ? T.red : isExpiringSoon ? T.warning : T.muted;
  const rowBg =
    isOverQuota || isExpired
      ? `${alpha(T.red, 0.03)}`
      : isNearQuota || isExpiringSoon
      ? `${alpha(T.warning, 0.03)}`
      : 'transparent';
  return { isOverQuota, isNearQuota, isExpired, isExpiringSoon, usageColor, expiryColor, rowBg };
}

// OrgSubTable 컬럼 정의: head/tail 두 DataTable 이 공유. 행 배경 tint(사용량/만료
// 임계)는 DataTable getRowStyle 로 행 단위 적용. 셀 render 는 순수 시각(도트·
// ellipsis·mono·progress bar·Tag·조건부 색/강조)만 담당.
function orgSubColumns(tierColor: Record<string, string>): DataTableColumn<OrgSubRow>[] {
  return [
    {
      key: 'org',
      header: '조직',
      width: '1fr',
      render: (row) => {
        const s = orgSubRowState(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: S[2], overflow: 'hidden' }}>
            {(s.isOverQuota || s.isExpired) && <span style={{ color: T.red, fontSize: FS[12] }}>●</span>}
            {!s.isOverQuota && !s.isExpired && (s.isNearQuota || s.isExpiringSoon) && (
              <span style={{ color: T.warning, fontSize: FS[12] }}>●</span>
            )}
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: 500,
              }}
            >
              {row.org_name}
            </span>
          </div>
        );
      },
    },
    {
      key: 'plan',
      header: '플랜',
      width: '110px',
      // 요금제 표기를 한 벌로 (화면 검토 A29 · 2026-09-27)
      render: (row) => <Tag color={tierColor[row.tier] ?? T.muted}>{subscriptionPlanLabel(row.tier)}</Tag>,
    },
    {
      key: 'usage',
      header: '월 사용량 / 한도',
      width: '1.4fr',
      render: (row) => {
        const s = orgSubRowState(row);
        return (
          <div>
            <div
              style={{
                fontSize: FS[12],
                fontFamily: F.mono,
                color: s.usageColor,
                marginBottom: 3,
                fontWeight: s.isOverQuota || s.isNearQuota ? 600 : 400,
              }}
            >
              {row.usage_count.toLocaleString()} / {row.monthly_quota.toLocaleString()}
              <span style={{ color: T.muted, marginLeft: S[1.5], fontWeight: 400 }}>
                ({row.usage_pct.toFixed(1)}%)
              </span>
            </div>
            <div style={{ height: 3, background: T.surface2, borderRadius: 2, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(row.usage_pct, 100)}%`,
                  height: '100%',
                  background: s.usageColor,
                }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: '상태',
      width: '110px',
      render: (row) => (
        <Tag color={row.status === 'active' ? T.green : T.red}>{SUBSCRIPTION_STATUS_LABEL[row.status] ?? row.status}</Tag>
      ),
    },
    {
      key: 'expiry',
      header: '만료',
      width: '120px',
      align: 'right',
      render: (row) => {
        const s = orgSubRowState(row);
        return (
          <div
            style={{
              textAlign: 'right',
              fontFamily: F.mono,
              fontSize: FS[12],
              color: s.expiryColor,
              fontWeight: s.isExpired || s.isExpiringSoon ? 600 : 400,
            }}
          >
            {s.isExpired
              ? `만료 ${Math.abs(row.expires_in_days)}일 전`
              : row.expires_in_days === 0
              ? '오늘 만료'
              : `D-${row.expires_in_days}`}
          </div>
        );
      },
    },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// Recent assessments list: RA/QA/Clinical/Exec View 가 공유
// ═══════════════════════════════════════════════════════════════════════════
export function RecentList({ items }: { items: AssessmentRow[] }) {
  if (items.length === 0) {
    return (
      <Bx style={{ padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: FS[12], color: T.muted }}>표시할 평가가 없습니다.</div>
      </Bx>
    );
  }
  const columns: DataTableColumn<AssessmentRow>[] = [
    {
      key: 'code',
      width: '120px',
      render: (a) => (
        <span
          style={{
            fontFamily: F.mono,
            fontSize: FS[12],
            color: T.champagne,
            letterSpacing: 0.5,
          }}
        >
          {a.code}
        </span>
      ),
    },
    {
      key: 'title',
      width: '1fr',
      render: (a) => (
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {a.title}
        </span>
      ),
    },
    {
      key: 'target',
      width: '130px',
      render: (a) => (
        <span style={{ fontSize: FS[12], color: T.subtle, fontFamily: F.mono }}>
          {a.target ?? '-'}
        </span>
      ),
    },
    {
      key: 'risk',
      width: '110px',
      render: (a) => {
        const risk = latestResult(a)?.risk_level?.toUpperCase();
        return risk ? (
          <Tag color={riskColor(risk)}>{risk}</Tag>
        ) : (
          <Tag color={T.muted}>평가 전</Tag>
        );
      },
    },
    {
      key: 'created',
      width: '140px',
      align: 'right',
      render: (a) => (
        <span
          style={{
            fontSize: FS[12],
            color: T.muted,
            fontFamily: F.mono,
            textAlign: 'right',
          }}
        >
          {isoDateTime(a.created_at)}
        </span>
      ),
    },
  ];
  return (
    <Bx style={{ overflow: 'hidden', marginBottom: S[6] }}>
      <DataTable
        columns={columns}
        rows={items}
        getRowKey={(a) => a.id}
        rowHref={(a) => `/assessments/${a.code}`}
        showHeader={false}
        dividers="solid"
        minWidth={720}
        stickyFirstCol
      />
    </Bx>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// R&D 프로젝트 현황 (공용 위젯: Exec View 등이 사용)
// ═══════════════════════════════════════════════════════════════════════════
const RD_DOC_LABEL: Record<'proposal' | 'plan' | 'input_spec', string> = {
  proposal: '제안서',
  plan: '계획서',
  input_spec: '입력서',
};

// 공유 helper (lib/research/progress.ts) 를 래핑: UI 표시 색상까지 결합.
// 프로파일 미작성이면 구 시스템(proposal/plan/input_spec) fallback.
export function docCompletionStageV2(
  project: {
    profile_device_class: number | null;
    profile_sterile: string | null;
    profile_body_contact: string | null;
    profile_contact_duration: string | null;
    profile_software_type: string | null;
    profile_active_device: boolean | null;
    profile_clinical_likely: boolean | null;
    profile_target_markets: string[] | null;
    profile_working_principle: string | null;
    profile_completed_at: string | null;
  },
  statuses: Array<{ doc_code: string; status: string }> | undefined,
  legacyDocs: Array<{ doc_type: string; status: string }> | undefined,
): { label: string; color: string; pct: number; sub?: string } {
  const hasProfile = !!project.profile_completed_at;
  if (hasProfile) {
    const progress = computeResearchProgress(project, statuses);
    if (progress.rdRequired === 0) {
      return { label: '필수 문서 없음', color: T.muted, pct: 0 };
    }
    const pct = progress.rdPct;
    const color = pct >= 100 ? T.green : pct >= 60 ? T.champagne : pct >= 30 ? T.warning : T.blue;
    return {
      label: progress.label,
      color,
      pct,
      sub: `${pct}%`,
    };
  }

  // 프로파일 없음. 구 시스템 fallback (proposal/plan/input_spec)
  if (!legacyDocs || legacyDocs.length === 0)
    return { label: '프로파일 미작성', color: T.muted, pct: 0 };
  const order = ['proposal', 'plan', 'input_spec'] as const;
  let completedIdx = -1;
  for (let i = 0; i < order.length; i++) {
    const d = legacyDocs.find((x) => x.doc_type === order[i]);
    if (d && (d.status === 'approved' || d.status === 'review')) {
      completedIdx = i;
    } else {
      break;
    }
  }
  if (completedIdx === 2) return { label: '입력서 완료', color: T.green, pct: 100 };
  if (completedIdx === 1) return { label: '계획서 완료', color: T.champagne, pct: 66 };
  if (completedIdx === 0) return { label: '제안서 완료', color: T.warning, pct: 33 };
  const anyDraft = legacyDocs.find((d) => d.status === 'draft');
  if (anyDraft)
    return {
      label: `${RD_DOC_LABEL[anyDraft.doc_type as 'proposal' | 'plan' | 'input_spec']} 작성 중`,
      color: T.blue,
      pct: 10,
    };
  return { label: '진행 없음', color: T.muted, pct: 0 };
}
