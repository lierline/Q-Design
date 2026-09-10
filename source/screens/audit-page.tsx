// =============================================================================
// /audit: 감사 추적 (Audit Trail)
// =============================================================================
// owner / admin 만 접근. 평가, 검토, 멤버 활동, 시스템 이벤트 로그 표시.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  Alert,
  Bx,
  EmptyState,
  En,
  Grid,
  KPI,
  PageHd,
  ScrollTable,
  SectionTitle,
} from '@/lib/design/components';
import { PageGuide } from '@/components/PageGuide';
import { F, FS, LH, S, T, labelTracking } from '@/lib/design/tokens';
import { isoDateTime } from '@/lib/date';
import { ListPager } from '@/components/ListPager';
import { parsePage, pageRange, clampPage } from '@/lib/api/list-page';
import {
  AUDIT_SELECT,
  parseAuditFilters,
  applyAuditFilters,
  resolveAuditEntityIds,
  auditFiltersToQuery,
} from '@/lib/audit/log-query';
import { actionLabel, humanizeAuditSummary } from '@/lib/audit-labels';
import { AuditFilterBar } from './filter-bar';
import { AuditExportButton } from './export-button';

interface AuditLog {
  id: number;
  ts: string;
  actor_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  summary: string | null;
  // Solo Mode / 상세 컨텍스트 (단일역할워크플로, 결재 단계 등)
  details: Record<string, unknown> | null;
}

interface ProductOption {
  id: string;
  local_id: string;
  name: string;
}

interface PageProps {
  searchParams: Promise<{
    product?: string;
    action?: string;
    q?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}

export default async function AuditPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const productFilter = sp.product?.trim() || '';
  const actionFilter = sp.action?.trim() || '';
  const queryText = sp.q?.trim() || '';
  const dateFrom = sp.dateFrom?.trim() || '';
  const dateTo = sp.dateTo?.trim() || '';
  // 필터 해석·적용은 공용 모듈이 한다. 화면과 CSV 내보내기가 갈리지 않게 하려는 것이다.
  const filters = parseAuditFilters(sp);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();
  const { data: profile } = await supabase
    .from('profiles')
    .select('job_role, job_roles')
    .eq('id', user.id)
    .maybeSingle();

  const role = membership?.role ?? 'member';
  const jobRoles = (profile?.job_roles ?? (profile?.job_role ? [profile.job_role] : [])) as string[];
  // 감사 추적: owner/admin 외에 RA/QA(및 Lead)·R&D 팀장도 접근: R&D 문서
  // 작성·검토·승인 이력 추적(ISO 13485 §8.2.4 / 규제·품질 가시성).
  // org-role 'admin' 은 0172 에서 제거(owner 단일). job_role 'admin'(MedQraft 운영)은
  // is_admin RLS 로 전체 접근하므로 여기 별도 분기 불요.
  const canViewAudit =
    role === 'owner' ||
    jobRoles.some((r) => ['ra', 'ra_lead', 'qa', 'qa_lead', 'rd_lead'].includes(r));

  if (!canViewAudit) {
    return (
      <div>
        <PageHd title="감사 추적" sub={<En>Audit Trail</En>} />
        <Alert kind="warning" title="권한 부족">
          감사 로그는 owner / RA / QA / R&D 팀장 만 조회할 수 있습니다.
        </Alert>
      </div>
    );
  }

  // 제품 옵션 (필터 드롭다운용)
  const { data: productRows } = await supabase
    .from('products')
    .select('id, local_id, name')
    .order('name', { ascending: true });
  const products = (productRows ?? []) as ProductOption[];

  // 실제 사용된 액션 목록: 동적 조회 (필터 드롭다운에 진짜 존재하는 액션만 표시)
  // 성능: action 종류는 실제 50개 미만. 2000 행 풀스캔 불필요 → 200 으로 축소.
  // (최신 audit_logs 의 action 분포만 봐도 거의 모든 종류 커버됨)
  const { data: actionRows } = await supabase
    .from('audit_logs')
    .select('action')
    .order('ts', { ascending: false })
    .limit(200);
  const distinctActions = Array.from(
    new Set(((actionRows ?? []) as Array<{ action: string }>).map((r) => r.action)),
  ).sort((a, b) => actionLabel(a).localeCompare(actionLabel(b)));

  // 제품 필터 처리: 해석은 공용 모듈이 한다(내보내기 라우트와 같은 규칙을 써야 하므로).
  const selectedProduct: ProductOption | null = productFilter
    ? (products.find((p) => p.id === productFilter) ?? null)
    : null;
  const relatedEntityIds = await resolveAuditEntityIds(supabase, selectedProduct?.id ?? '');

  // 🔴 2026-08-29 (5렌즈 검수 P1-1): 여기는 `.limit(500)` 이었고, 그 배열이 그대로
  //    CSV 가 됐다. 실사 증빙이 조용히 잘렸다. 게다가 필터를 걸면 그 500 을
  //    「필터 적용됨 · 500건」이라고 **진짜 건수처럼 다시 라벨**해 잘렸다는 사실조차
  //    숨겼다. 이제 총건수는 DB 가 세고, 목록은 페이지 단위로 읽고, CSV 는 서버
  //    라우트가 전량을 이어 읽는다.
  //    정렬 키에 `id` 를 더한 이유: `ts` 는 유일하지 않아 range 가 행을 중복·누락시킨다.
  const totalRes = await applyAuditFilters(
    supabase.from('audit_logs').select('id', { count: 'exact', head: true }),
    filters,
    relatedEntityIds,
  );
  const totalLogs = totalRes.count ?? 0;
  const page = clampPage(parsePage(sp.page), totalLogs);
  const { from, to } = pageRange(page);

  const { data: logs } = await applyAuditFilters(
    supabase
      .from('audit_logs')
      .select(AUDIT_SELECT)
      .order('ts', { ascending: false })
      .order('id', { ascending: false })
      .range(from, to),
    filters,
    relatedEntityIds,
  );
  const logList = (logs ?? []) as AuditLog[];

  // 액션별 분포 (필터 적용된 결과 기준)
  const byAction: Record<string, number> = {};
  for (const l of logList) {
    byAction[l.action] = (byAction[l.action] ?? 0) + 1;
  }

  // KPI: 총건수·24시간은 **DB 가 센다**(배열을 세면 페이지만 세게 된다).
  //   사용자·액션 «종류» 는 DISTINCT 라 PostgREST 로 셀 수 없어 이 페이지 기준으로
  //   두되 라벨에 그렇게 적는다. 모르는 것을 아는 척하지 않는다.
  const totalCount = totalLogs;
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const last24hRes = await applyAuditFilters(
    supabase.from('audit_logs').select('id', { count: 'exact', head: true }).gte('ts', since24h),
    filters,
    relatedEntityIds,
  );
  const last24h = last24hRes.count ?? 0;
  const uniqueActors = new Set(logList.map((l) => l.actor_email).filter(Boolean))
    .size;
  const uniqueActions = Object.keys(byAction).length;

  const filterActive = !!(productFilter || actionFilter || queryText || dateFrom || dateTo);

  return (
    <div>
      <PageHd
        title="감사 추적"
        sub={
          filterActive
            ? `필터 적용됨 · 총 ${totalLogs.toLocaleString()}건`
            : `전체 ${totalLogs.toLocaleString()}건의 활동 기록`
        }
        actions={<AuditExportButton query={auditFiltersToQuery(filters)} total={totalLogs} />}
      />
      <PageGuide pageId="audit" />

      <AuditFilterBar
        products={products}
        selectedProduct={productFilter}
        selectedAction={actionFilter}
        availableActions={distinctActions}
        queryText={queryText}
        filterActive={filterActive}
        selectedProductInfo={selectedProduct}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />

      <Grid cols={4} minCol={180} gap={14} style={{ marginBottom: S[7] }}>
        <KPI
          label="총 활동"
          value={totalCount}
          sub={filterActive ? '필터 결과 전체' : '전체 기록'}
        />
        <KPI
          label="최근 24시간"
          value={last24h}
          sub="활동 기록"
          color={last24h > 0 ? T.champagne : undefined}
        />
        <KPI label="고유 사용자" value={uniqueActors} sub="이 페이지 기준" />
        <KPI label="액션 종류" value={uniqueActions} sub="이 페이지 기준" />
      </Grid>

      {/* Action stats: 모노크롬 chip (카테고리별 색 빼고 깔끔하게) */}
      {Object.keys(byAction).length > 0 && (
        <>
          <SectionTitle>액션별 분포</SectionTitle>
          <Bx style={{ padding: S[4.5], marginBottom: S[7] }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: S[2] }}>
              {Object.entries(byAction)
                .sort(([, a], [, b]) => b - a)
                .map(([action, count]) => (
                  <div
                    key={action}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: S[2],
                      padding: '5px 12px',
                      border: `1px solid ${T.border}`,
                      background: T.surface,
                    }}
                    title={action}
                  >
                    <span
                      style={{
                        fontSize: FS[11],
                        color: T.text,
                        fontFamily: F.ui,
                        letterSpacing: labelTracking(actionLabel(action), 0.3),
                        fontWeight: 500,
                      }}
                    >
                      {actionLabel(action)}
                    </span>
                    <span
                      style={{
                        fontSize: FS[10],
                        color: T.champagne,
                        fontFamily: F.mono,
                        fontWeight: 600,
                      }}
                    >
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </Bx>
        </>
      )}

      <SectionTitle>활동 로그</SectionTitle>
      {logList.length === 0 ? (
        <EmptyState
          title={filterActive ? '필터 결과 없음' : '아직 활동 로그가 없습니다'}
          description={
            filterActive
              ? '선택한 조건에 해당하는 활동이 없습니다. 필터를 일부 해제해보세요.'
              : '평가 생성, 로그인, 검토 요청 등의 이벤트가 여기에 기록됩니다.'
          }
        />
      ) : (
        <Bx>
          {/* 4-컬럼 fixed-width 테이블 → ScrollTable 로 감싸 모바일에서 가로 스크롤. */}
          <ScrollTable minWidth={760}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '160px 180px 220px 1fr',
              gap: S[3.5],
              padding: '12px 18px',
              borderBottom: `1px solid ${T.border}`,
            }}
          >
            {['시간', '액션', '사용자', '요약'].map((l) => (
              <div
                key={l}
                style={{
                  fontSize: FS[10],
                  color: T.muted,
                  letterSpacing: 1.5,
                  fontFamily: F.mono,
                  textTransform: 'uppercase',
                }}
              >
                {l}
              </div>
            ))}
          </div>
          {logList.map((l, i) => {
            const summaryKr = humanizeAuditSummary(l.summary);
            return (
              <div
                key={l.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 180px 220px 1fr',
                  gap: S[3.5],
                  padding: '14px 18px',
                  borderBottom:
                    i < logList.length - 1 ? `1px solid ${T.border}` : 'none',
                  alignItems: 'center',
                  fontSize: FS[12],
                }}
              >
                <span style={{ fontFamily: F.mono, color: T.muted, fontSize: FS[10] }}>
                  {isoDateTime(l.ts)}
                </span>
                <span
                  title={l.action}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '4px 10px',
                    border: `1px solid ${T.border}`,
                    background: T.surface,
                    color: T.text,
                    fontSize: FS[11],
                    fontFamily: F.ui,
                    letterSpacing: labelTracking(actionLabel(l.action), 0.3),
                    fontWeight: 500,
                    width: 'fit-content',
                  }}
                >
                  {actionLabel(l.action)}
                </span>
                <span
                  style={{
                    fontSize: FS[11],
                    color: T.subtle,
                    fontFamily: F.mono,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={l.actor_email ?? ''}
                >
                  {l.actor_email ?? '-'}
                </span>
                <div>
                  <span
                    style={{
                      fontSize: FS[12],
                      color: T.text,
                      fontFamily: F.serif,
                      lineHeight: LH.relaxed,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                    title={summaryKr ?? ''}
                  >
                    {summaryKr ??
                      (`${l.entity_type ?? ''} ${l.entity_id ?? ''}`.trim() || '-')}
                  </span>
                  {/* Solo Mode 가시성: single_role_workflow 플래그 + details 요약 */}
                  {l.details && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: S[1], marginTop: S[1], alignItems: 'center' }}>
                      {(l.details as Record<string, unknown>).single_role_workflow === true && (
                        <span
                          title="1인 조직 Solo Mode: SOD(직무분리) 완화 워크플로. ISO 13485 §5.5.1(소규모 조직 책임·권한)·§5.5.2(경영대리인 겸직) 근거 · audit_logs 에 기록되어 추적성 보증 · §8.2.4 내부심사는 외부 위탁 필수."
                          style={{
                            fontSize: FS[9],
                            padding: '2px 6px',
                            border: `1px solid ${T.champagne}`,
                            color: T.champagne,
                            fontFamily: F.mono,
                            letterSpacing: 0.8,
                            textTransform: 'uppercase',
                          }}
                        >
                          solo mode
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </ScrollTable>
        </Bx>
      )}

      {/* 필터를 유지한 채 페이지를 넘긴다. 안 넘기면 2페이지에서 필터가 풀려
          «내가 건 조건이 사라진» 목록을 보게 된다. */}
      <ListPager
        page={page}
        total={totalLogs}
        basePath="/audit"
        params={{
          product: filters.product,
          action: filters.action,
          q: filters.q,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        }}
      />
    </div>
  );
}
