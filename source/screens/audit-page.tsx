// =============================================================================
// /audit: 감사 추적 (Audit Trail)
// =============================================================================
// owner / admin 만 접근. 평가, 검토, 멤버 활동, 시스템 이벤트 로그 표시.

import { QDPresentation } from '@/lib/design/q-design-runtime';
import { QDScale } from '@/lib/design/q-design-scale';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  Alert,
  Bx,
  EmptyState,
  Grid,
  KPI,
  PageHd,
  ScrollTable,
  SectionTitle,
} from '@/lib/design/components';
import { PageGuide } from '@/components/PageGuide';
import { F, FS, LH, S, T, alpha, RADIUS } from '@/lib/design/tokens';
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
import { loadMenuAccess, menuAllowed } from '@/lib/permissions/route-access';
import { QDRuntime } from '@/lib/design/q-design-runtime';

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

  // 감사 추적(ISO 13485 §8.2.4): 메뉴 권한 그대로 본다(번들 exec · lead · qa · ra + 소유자 · MedQraft 운영).
  // 정본 값(오너 추천 2026-10-07). 종전엔 화면이 RA · QA · R&D 팀장만 따로 적어, 메뉴는 보이는데 화면이 막는 짝이었다.
  // 직책(job_grade)이 투영한 팀장도 메뉴 권한 계산이 이미 본다(화면 검토 A73 후속 · 2026-09-27).
  const canViewAudit = menuAllowed(await loadMenuAccess(supabase, user.id), 'audit');

  if (!canViewAudit) {
    return (
      <div>
        <PageHd title="감사 로그" />
        <Alert kind="warning" title="권한 부족">
          감사 로그는 소유자 · 대표 · 팀장 · RA · QA 만 조회할 수 있습니다.
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
  //   사용자·활동 «종류» 는 DISTINCT 라 PostgREST 로 셀 수 없어 요약 칸에서 뺐다(화면 검토 A18).
  //   종류별 분포는 목록 아래 접힌 칸에서 «이 쪽 기준» 이라고 적고 보인다.
  const totalCount = totalLogs;
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const last24hRes = await applyAuditFilters(
    supabase.from('audit_logs').select('id', { count: 'exact', head: true }).gte('ts', since24h),
    filters,
    relatedEntityIds,
  );
  const last24h = last24hRes.count ?? 0;

  const filterActive = !!(productFilter || actionFilter || queryText || dateFrom || dateTo);

  return (
    <div>
      {/* 차림표(«감사 로그»)와 같은 이름 (화면 검토 A12 · 2026-09-27).
          전체 건수는 아래 «총 활동» 카드가 말한다. 제목 위에 되풀이하지 않는다 (화면 검토 A35 · A66 · 2026-09-27) */}
      <PageHd
        title="감사 로그"
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

      {/*
        요약 숫자는 모두 «전체 기준» 만 둔다 (화면 검토 A18 · 2026-09-27). «고유 사용자 · 액션 종류» 는
        이 쪽 기준이라 같은 줄의 전체 숫자와 섞여 «사용자 3명» 을 그대로 믿으면 틀렸다.
      */}
      <Grid cols={QDPresentation.rendererInputs.gridColumns[2]} minCol={QDPresentation.gridMinColumn[180]} gap={QDScale.space[3.5]} style={{ marginBottom: QDScale.space[7] }}>
        <KPI
          label="총 활동"
          value={totalCount}
          sub={filterActive ? '필터 결과 전체' : '전체 기록'}
        />
        <KPI
          label="최근 24시간"
          value={last24h}
          sub="활동 기록"
        />
      </Grid>


      <SectionTitle>활동 기록</SectionTitle>
      {logList.length === 0 ? (
        <EmptyState
          title={filterActive ? '필터 결과 없음' : '아직 활동 로그가 없습니다'}
          description={
            filterActive
              ? '선택한 조건에 해당하는 활동이 없습니다. 필터를 일부 해제해보십시오.'
              : '평가 생성, 로그인, 검토 요청 등의 이벤트가 여기에 기록됩니다.'
          }
        />
      ) : (
        <Bx>
          {/* 4-컬럼 fixed-width 테이블 → ScrollTable 로 감싸 모바일에서 가로 스크롤. */}
          <ScrollTable minWidth={QDPresentation.tableMinWidth[760]}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: "var(--qd-atelier-grid-template-columns-425074bb1c)",
              gap: QDScale.space[3.5],
              padding: "var(--qd-atelier-padding-32c3630eb9)",
              borderBottom: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}`,
            }}
          >
            {['시간', '활동', '사용자', '요약'].map((l) => (
              <div
                key={l}
                // 머리 칸 이름이 한글이라 본문 글꼴(고정폭 · 자간 1.5 · 대문자 걷기 · 화면 검토 A44 · 2026-09-28)
                style={{
                  fontSize: QDScale.font[12],
                  color: T.muted,
                  fontFamily: QDScale.family.ui,
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
                  gridTemplateColumns: "var(--qd-atelier-grid-template-columns-425074bb1c)",
                  gap: QDScale.space[3.5],
                  padding: "var(--qd-atelier-padding-453be8fe1b)",
                  borderBottom:
                    i < logList.length - 1 ? `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}` : 'none',
                  alignItems: 'center',
                  fontSize: QDScale.font[12],
                }}
              >
                <span style={{ fontFamily: QDScale.family.mono, color: T.muted, fontSize: QDScale.font[12] }}>
                  {isoDateTime(l.ts)}
                </span>
                <span
                  title={l.action}
                  style={{
                    // 줄마다 테두리 칩(한 화면 수십 개)이던 것을 보통 글로: 표 칸이 이미 경계다 (화면 검토 A35 · 2026-09-28)
                    color: T.text,
                    fontSize: QDScale.font[13],
                    fontFamily: QDScale.family.ui,
                    fontWeight: "var(--qd-atelier-font-weight-51f1217b48)",
                  }}
                >
                  {actionLabel(l.action)}
                </span>
                <span
                  style={{
                    fontSize: QDScale.font[12],
                    color: T.subtle,
                    fontFamily: QDScale.family.mono,
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
                      fontSize: QDScale.font[12],
                      color: T.text,
                      fontFamily: QDScale.family.serif,
                      lineHeight: QDScale.leading.relaxed,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 'var(--qd-atelier-line-clamp-double)',
                      WebkitBoxOrient: 'vertical',
                    }}
                    title={summaryKr ?? ''}
                  >
                    {summaryKr ??
                      (`${l.entity_type ?? ''} ${l.entity_id ?? ''}`.trim() || '-')}
                  </span>
                  {/* Solo Mode 가시성: single_role_workflow 플래그 + details 요약 */}
                  {l.details && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: QDScale.space[1], marginTop: QDScale.space[1], alignItems: 'center' }}>
                      {(l.details as Record<string, unknown>).single_role_workflow === true && (
                        <span
                          title="1인 조직 모드: SOD(직무분리) 완화 흐름. ISO 13485 §5.5.1(소규모 조직 책임·권한)·§5.5.2(경영대리인 겸직) 근거 · audit_logs 에 기록되어 추적성 보증 · §8.2.4 내부심사는 외부 위탁 필수."
                          style={{
                            borderRadius: QDScale.radius,
                            fontSize: QDScale.font[12],
                            padding: "var(--qd-atelier-padding-03e93ce316)",
                            border: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${alpha(T.champagne, QDRuntime.alpha.tint0_5)}`,
                            color: T.champagne,
                            fontFamily: QDScale.family.ui,
                          }}
                        >
                          {/* 영어 대문자 «SOLO MODE» → 설정 화면과 같은 이름(«1인 결재 허용») · 화면 검토 A66 · 2026-09-28 */}
                          1인 결재
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

      {/*
        종류별 분포는 접어서 목록 아래로 (화면 검토 A18 · 2026-09-27). 칩 70여 개가 첫 화면 절반을
        채워 정작 «누가 언제 무엇을 했나» 기록 줄이 밀려났다. 이 쪽에 보이는 기록 기준이다.
      */}
      {Object.keys(byAction).length > 0 && (
        <details style={{ marginTop: QDScale.space[5], marginBottom: QDScale.space[5] }}>
          <summary style={{ cursor: 'pointer', fontSize: QDScale.font[13], color: T.subtle, fontFamily: QDScale.family.ui }}>
            종류별 보기 (이 쪽의 기록 {logList.length}건 기준 · {Object.keys(byAction).length}종)
          </summary>
          {/* 이름 · 건수 두 칸 목록(가는 구분선). 상자 무리는 금지 장치였다(화면 검토 A35 · 2026-09-28) */}
          <Bx style={{ padding: `${QDScale.space[1]} ${QDScale.space[4.5]}`, marginTop: QDScale.space[2.5] }}>
            <div style={{ display: 'grid', gridTemplateColumns: "var(--qd-atelier-grid-template-columns-6a7670410f)", columnGap: QDScale.space[6] }}>
              {Object.entries(byAction)
                .sort(([, a], [, b]) => b - a)
                .map(([action, count]) => (
                  <div
                    key={action}
                    title={action}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      gap: QDScale.space[3],
                      padding: `${QDScale.space[2]} 0`,
                      borderBottom: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}`,
                    }}
                  >
                    <span style={{ fontSize: QDScale.font[13], color: T.text, fontFamily: QDScale.family.ui }}>{actionLabel(action)}</span>
                    <span style={{ fontSize: QDScale.font[13], color: T.subtle, fontFamily: QDScale.family.mono, fontVariantNumeric: 'tabular-nums' }}>{count}건</span>
                  </div>
                ))}
            </div>
          </Bx>
        </details>
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
