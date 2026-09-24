import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { hasRole, getRoles } from '@/lib/permissions/has-role';
import { composeFor, composeSidebarGroups, BUNDLES } from '@/lib/permissions';
import type { JobRole } from '@/lib/permissions';
import { gateMenusByModules, moduleAllowsMenu, MENU_REQUIRED_MODULES } from '@/lib/permissions/module-menus';
import { loadEnabledModules } from '@/lib/subscription/module-gate';
import { allowedModulesFor, ALL_MODULES, MODULE_LABEL_KR, SELF_SERVE_MODULES } from '@/lib/subscription/plan-policy';
import { menuForPath } from '@/lib/nav/menu-for-path';
import { ModuleLockedNotice } from '@/components/ModuleLockedNotice';
import { RealtimeNotifications } from '@/components/RealtimeNotifications';
import { RibbonBackground } from '@/components/RibbonBackground';
import { Sidebar } from '@/components/Sidebar';
import { SubscriptionIndicator, type SubscriptionSummaryData } from '@/components/SubscriptionIndicator';
import { NotificationBell } from '@/components/NotificationBell';
import { TopHeaderBand } from '@/components/TopHeaderBand';
import { BackButton } from '@/components/BackButton';
import { MAIN_PADDING } from '@/lib/design/main-padding';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Coachmark } from '@/components/Coachmark';
import { GlobalSearch } from '@/components/GlobalSearch';
import { SessionIdleMonitor } from '@/components/SessionIdleMonitor';
// AiHelperButton 은 AIQuickAccessFab 안에서 drawer 로만 사용 (floating mount 제거).
// ⏸ AI Assistant FAB: 2026-06-04 오빠 지시로 일시 비활성화. 기능/컴포넌트
//   (AIQuickAccessFab)는 그대로 보존. 복원 시 이 import 와 아래 FAB 렌더 주석을 해제.
//   (BACKLOG 「AI Assistant 재검토·복원」)
// import { AIQuickAccessFab } from '@/components/AIQuickAccessFab';
import { TopProgressBar } from '@/components/TopProgressBar';
import { PageTransition } from '@/components/PageTransition';
import { WelcomeFlow } from '@/components/WelcomeFlow';
import { resolveGsRole } from '@/lib/onboarding/getting-started';
import { InstallAppPrompt } from '@/components/InstallAppPrompt';
import { VaultProvider } from '@/lib/vault/vault-context';
import { T } from '@/lib/design/tokens';

// 사이드바 배지 카운트(미읽음 알림, 검토 큐 등)가 매 요청 최신이어야 함
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');


  // Profile + membership 병렬: 둘 다 user.id 만 의존하므로 직렬 대기 제거(로그인~홈 지연 단축).
  // Multi-role Phase 3: job_roles 배열 사용. job_role 은 Phase 1 트리거로 sync 된 fallback.
  // membership: 여러 조직 멤버일 수 있어 joined_at 오름차순 = 첫 가입 조직을 *주 조직* 으로
  //   일관 선택(api/research 와 동일 ordering). 전문가/pending 은 아래에서 redirect 되어
  //   결과를 쓰지 않지만, 정상 사용자(대다수)는 1 RTT 절약.
  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase
      .from('profiles')
      .select('job_role, job_roles, job_grade, full_name, account_status, welcome_completed_at, gs_dismissed_at')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('org_members')
      .select('role, org_id, organizations(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('joined_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);
  const showWelcome =
    !!profile && (profile as { welcome_completed_at?: string | null }).welcome_completed_at == null;
  const gsDismissed = !!(profile as { gs_dismissed_at?: string | null })?.gs_dismissed_at;

  // 가입 승인 게이트: pending/rejected 는 앱 접근 차단.
  // (전문가 인증과 별개: expert_status 는 자문 매칭용. 일반 앱 사용은 account_status 로 결정.)
  if (profile?.account_status && profile.account_status !== 'active') {
    // 전문가는 전용 프리미엄 대기 페이지로
    if (hasRole(profile, 'expert')) {
      redirect('/experts/portal/pending');
    }
    redirect('/pending-approval');
  }

  // Phase 3 (multi-role): jobRole 은 primary 표시용. 권한 검사는 hasRole/hasAnyRole.
  // profile.job_roles 가 진실의 원천 (Phase 1 트리거로 job_role 과 sync).
  const jobRole = (profile?.job_role as string | null) ?? 'ra';
  const isExpert = hasRole(profile, 'expert');

  // 전문가는 (app) 레이아웃 (회사용 사이드바) 진입 자체를 막고 luxe 포털로
  if (isExpert) {
    redirect('/experts/inbox');
  }

  // (membership 은 위에서 profile 과 병렬 fetch 됨. 직렬 대기 제거)
  if (!isExpert && !membership) {
    redirect('/onboarding');
  }

  // 전문가는 위 line 62 에서 이미 /experts/inbox 로 redirect 됨.
  // 과거 여기 있던 "expertOnlyAllowed" prefix check 블록은 unreachable dead code 였음 (audit MEDIUM): 제거.

  let orgName = '-';
  let role = 'member';
  let plan = 'free';
  let canSeeAudit = false;
  // 영지식 금고(P1): organizations(*) 에서 함께 읽어 VaultProvider 초기값으로(추가 쿼리 0).
  let vaultEnabled = false;
  let vaultKeyVersion = 0;
  if (membership) {
    const org = membership.organizations as unknown as {
      id: string;
      name: string;
      slug: string;
      plan: string;
      vault_enabled?: boolean;
      vault_key_version?: number;
    };
    orgName = org.name;
    role = membership.role as string;
    plan = org.plan;
    canSeeAudit = !isExpert && role === 'owner';
    vaultEnabled = org.vault_enabled ?? false;
    vaultKeyVersion = org.vault_key_version ?? 0;
  } else if (isExpert) {
    orgName = '외부 전문가';
  }

  // Phase B (capability SSOT): canSee* flag 를 bundle 의 sidebarMenus 로부터 자동 유도.
  // 각 권한이 가진 메뉴는 lib/permissions/bundles/{role}.ts 에 정의되어 있어
  // 여기서는 그 정의를 참조만 함. 한 권한 수정 시 bundle 파일만 보면 됨.
  const caps = composeFor(profile);
  const isMedqraftAdmin = hasRole(profile, 'admin');

  // 모듈식 게이팅(QMS-First 줄기+가지, 3차 전환 2026-07-26): 비활성 가지 모듈의 전속
  // 메뉴를 사이드바에서 게이팅. QMS 코어(문서·부적합·CAPA·불만)는 매핑에 없어 항상 노출.
  // medqraft admin 은 운영 계정이라 게이팅 제외(전체 노출).
  // 운영 계정도 PILOT_MODULES 밖의 가지는 못 본다(allowedModulesFor 가 교집합을 낸다).
  const enabledModules =
    membership && !isMedqraftAdmin
      ? await loadEnabledModules(supabase, membership.org_id as string)
      : allowedModulesFor(ALL_MODULES);
  // gatedMenus = caps 메뉴에서 비활성 모듈 전속 메뉴를 제거한 단일 진실.
  // 사이드바 가시성(menus prop)·canSee* 플래그·멀티롤 그룹이 모두 이걸 사용(누수 0).
  const gatedMenus = gateMenusByModules(caps.sidebarMenus, enabledModules);

  // 🔴 2026-09-18 (CTO 감사 3번): 꺼진 가지의 화면은 «주소를 쳐도» 열리지 않는다.
  //    화면 파일마다 assertMenuAccess 를 적는 방식은 50/164 에서 멈춰 있었고, /new · /m ·
  //    /sterilization 은 로그인만 보고 열렸다. 미들웨어가 실어 준 x-pathname 으로 메뉴를
  //    찾아(menuForPath, href 정본은 NAV_ITEMS) 사이드바와 같은 판정(moduleAllowsMenu)을 한다.
  //    운영 계정(isMedqraftAdmin)은 enabledModules 자체가 파일럿 전체라 자연히 통과한다.
  const pathname = (await headers()).get('x-pathname');
  const pathMenu = menuForPath(pathname);
  const lockedModule: (typeof ALL_MODULES)[number] | null =
    pathMenu && !moduleAllowsMenu(pathMenu, enabledModules)
      ? (MENU_REQUIRED_MODULES[pathMenu] ?? [])[0] ?? null
      : null;
  const lockedIsOffered = lockedModule != null && (SELF_SERVE_MODULES as string[]).includes(lockedModule);

  // 감사 추적: owner(L110) 외에 bundle sidebarMenus 에 'audit' 가진 직무
  // (RA/QA·Lead·R&D 팀장)도 메뉴 노출. page 가드(audit/page.tsx)와 동기.
  if (!isExpert && gatedMenus.has('audit')) canSeeAudit = true;
  const canSeeResearch = gatedMenus.has('research');
  const canSeeRAWorkspace = gatedMenus.has('ra-workspace');
  const canSeeQAWorkspace = gatedMenus.has('qa-workspace');
  // 생산 워크스페이스: 현장 모드 허브. 모듈(production 가지) ∩ 직무 번들로 이미 걸러진다.
  const canSeeProduction = gatedMenus.has('field-mode');
  // 임상평가는 RA Phase 3(2026-06-07) 흐름 일원화로 사이드바 진입점 철수
  // (clinical 직무 deprecate + 임상문서 category:'ra'). 목록은 읽기전용 코크핏 유지,
  // 작성=제품 흐름 「작업대 열기」, 감시=RA 워크스페이스(/ra)·대시보드 위젯.
  const isOrgAdmin = role === 'owner';
  // ISO 13485 자가 점검: bundle 의 menus 에 'compliance' 가 있거나 owner/admin.
  // ★ owner OR 분기도 모듈 게이팅: RA/QA 모듈 미구매 조직의 owner 에게 노출되는 누수 차단.
  const canSeeCompliance =
    (gatedMenus.has('compliance') || isOrgAdmin) && moduleAllowsMenu('compliance', enabledModules);
  // 변경평가: bundle 의 menus 에 'assessments' 가 있거나 owner/admin (모듈 게이팅 동일).
  const canSeeAssessments =
    (gatedMenus.has('assessments') || isOrgAdmin) && moduleAllowsMenu('assessments', enabledModules);
  // 대표/임원 간소화: exec capability 보유 OR org-role owner. admin 은 별도.
  const isOwnerExec =
    !isMedqraftAdmin && (hasRole(profile, 'exec') || role === 'owner');

  // Multi-role 사이드바 2계층 그룹: 다중 권한 사용자만 활성화.
  // expert / medqraft_admin 은 자체 메뉴 흐름이 있어 평탄 유지.
  // Owner+role 멀티 케이스도 그룹화: 다중 권한이면 권한별 헤더 분리가 더 유용.
  //
  // Codex audit 2026-05-27: BUNDLES 기반으로 전체 JobRole 인식.
  // 이전 hardcoded 배열에 ra_lead/qa_lead/clinical_lead 누락 → multi-role 사용자
  // (예: ['rd','ra_lead']) 의 Lead 권한이 사이드바 그룹 헤더 계산에서 빠지던 버그.
  const userRoles = getRoles(profile).filter((r): r is JobRole => r in BUNDLES);
  // 🔴 2026-08-21: «다중 직무일 때만» 계산하던 게이트를 걷어냈다.
  //   이 하나가 두 가지 일을 겸하고 있었다: ①2계층 UI 를 켤지 ②부서 분류를 줄지.
  //   그래서 단일 직무 사용자는 sidebarGroups 가 통째로 null 이라, 사이드바가
  //   소속을 알 길이 없어 「허브를 가졌으면 내 부서」로 떨어졌다(QA 에게 「워크스페이스
  //   › 생산」이 뜬 원인). ①은 isMultiRole 이 이미 스스로 판정하므로 여기서 겹칠 이유가 없다.
  const sidebarGroups =
    !isExpert && !isMedqraftAdmin ? composeSidebarGroups(userRoles, gatedMenus) : null;

  // Counts: external expert assignments + 내부 RA/QA/RD/Exec 큐 + 메시지 미읽음
  const [{ count: pendingCount }, { count: unreadMessages }] =
    await Promise.all([
      supabase
        .from('review_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('expert_id', user.id)
        .in('status', ['pending', 'accepted', 'in_progress']),
      supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .is('read_at', null),
    ]);

  // 내부 RA/QA/RD/Exec 큐 카운트 (역할별 정의는 InternalReviewQueue 와 동일)
  // Codex audit 2026-05-27: primary job_role 단일 대신 job_roles 합집합 기준.
  // Lead 역할 (ra_lead/qa_lead/rd_lead/clinical_lead) 은 base 역할로 정규화:
  // 부서장도 부서의 검토 큐를 가져야 함.
  const QUEUE_ROLES = ['ra', 'qa', 'rd', 'exec', 'clinical'] as const;
  type QueueRole = (typeof QUEUE_ROLES)[number];
  function normalizeQueueRole(r: string): string {
    if (r === 'ra_lead') return 'ra';
    if (r === 'qa_lead') return 'qa';
    if (r === 'rd_lead') return 'rd';
    if (r === 'clinical_lead') return 'clinical';
    return r;
  }
  const allRoles = profile?.job_roles ?? (profile?.job_role ? [profile.job_role] : []);
  const queueRoles = new Set<QueueRole>(
    (allRoles as string[])
      .map(normalizeQueueRole)
      .filter((r): r is QueueRole => (QUEUE_ROLES as readonly string[]).includes(r)),
  );

  let internalQueueCount = 0;
  if (membership && queueRoles.size > 0) {
    const orgId = membership.org_id as string;

    // 성능: 역할별 큐 카운트 쿼리를 순차 for-loop → Promise.all 병렬 실행.
    // 각 queueRole 은 독립 소스 → wall-clock ≈ max(단일 쿼리) instead of Σ.
    const perRoleCounts = await Promise.all(
      Array.from(queueRoles).map(async (queueRole): Promise<number> => {
        if (queueRole === 'ra' || queueRole === 'qa') {
          // count_unreviewed_for_role RPC: 2단계 쿼리(N+1) → 단일 DB 함수 (0073)
          const { data: rpcResult, error: rpcErr } = await supabase
            .rpc('count_unreviewed_for_role', {
              p_user_id: user.id,
              p_org_id: orgId,
              p_role: queueRole,
            });
          if (!rpcErr && typeof rpcResult === 'number') {
            return rpcResult;
          }
          // RPC 미적용 환경 fallback (마이그레이션 미실행 시)
          const { data: pendingForMe } = await supabase
            .from('assessments')
            .select('id')
            .eq('org_id', orgId)
            .eq('workflow_state', 'under_review');
          const ids = (pendingForMe ?? []).map((a: { id: string }) => a.id);
          if (ids.length === 0) return 0;
          const { data: myReviews } = await supabase
            .from('assessment_reviews')
            .select('assessment_id')
            .in('assessment_id', ids)
            .eq('reviewer_role', queueRole);
          const reviewedSet = new Set(
            ((myReviews ?? []) as Array<{ assessment_id: string }>).map(
              (r) => r.assessment_id,
            ),
          );
          return ids.filter((id: string) => !reviewedSet.has(id)).length;
        } else if (queueRole === 'exec') {
          const { count } = await supabase
            .from('assessments')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', orgId)
            .eq('workflow_state', 'final_decision');
          return count ?? 0;
        } else if (queueRole === 'rd') {
          // RD: 본인이 발안한 평가 중 진행 중인 것
          const { count } = await supabase
            .from('assessments')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', orgId)
            .eq('initiator_id', user.id)
            .in('workflow_state', ['under_review', 'preview_review', 'final_decision']);
          return count ?? 0;
        }
        // clinical: 변경평가 검토 제출 UI 가 아직 없어 검토 큐는 0 (열람만 가능).
        //   향후 임상 영향 검토(assessment_reviews reviewer_role='clinical') 추가 시 여기 분기.
        return 0;
      }),
    );
    internalQueueCount = perRoleCounts.reduce((sum, c) => sum + c, 0);
  }

  const inboxBadge = (pendingCount ?? 0) + internalQueueCount;

  // 구독 사용량: 우상단 신호등에 사용. subscription_usage_summary view 사용
  // (7-metric quota + 자산형 active_projects/storage/members 까지 한 번에 집계).
  // medqraft admin 은 자체 org 없을 수 있어 skip.
  // type 은 SubscriptionIndicator 가 export 한 SubscriptionSummaryData 를 직접 사용 (audit MEDIUM 정리).
  let subscriptionData: SubscriptionSummaryData | null = null;
  if (membership && !isMedqraftAdmin) {
    const { data: sub } = await supabase
      .from('subscription_usage_summary')
      .select('*')
      .eq('org_id', membership.org_id)
      .maybeSingle();
    if (sub) {
      // Supabase 는 view 의 row 를 generic record 로 반환: runtime 검증은 컴포넌트에서.
      subscriptionData = sub as unknown as SubscriptionSummaryData;
    }
  }

  return (
    <VaultProvider
      orgId={(membership?.org_id as string | null) ?? null}
      userId={user.id}
      initialVaultEnabled={vaultEnabled}
      initialKeyVersion={vaultKeyVersion}
    >
    <div
      // 인쇄에서 이 상자를 되돌려야 한다. 아래 인라인 height/overflow 는
      // @media print 규칙으로 못 덮으므로 globals.css 의 인쇄 블록이
      // .qa-app-root 로 !important 를 건다. 이름이 없으면 걸 자리가 없다.
      className="qa-app-root"
      style={{
        display: 'flex',
        // iOS Safari URL bar 변화 대응: 100dvh 로 통일 (100vh fallback maxHeight).
        // 이전엔 root: 100vh + main: 100dvh 였는데, main 이 root 를 넘어 overflow:hidden 으로 잘리고
        // 스크롤 시 부모 경계로 튕겨 올라가는 elastic bounce 버그 유발.
        height: '100dvh',
        maxHeight: '100vh',
        // background 제거: body 의 T.bg 가 fallback. ribbon 이 위로 보이도록.
        color: T.text,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Q-Atelier 시그니처 champagne ribbon: 본문 영역에서만 살짝 비침
         (사이드바/모달은 자체 opaque 배경으로 가려짐). ambient = 낮은 opacity. */}
      <RibbonBackground intensity="ambient" />

      {/* 라우트 전환 시 상단 champagne progress bar */}
      <TopProgressBar />

      {/* skip-link: 키보드 첫 Tab 시 노출, 사이드바 등 nav 건너뛰고 본문 이동.
         WCAG 2.4.1 Bypass Blocks. */}
      <a href="#main" className="qa-skip-link">
        메인 콘텐츠로 건너뛰기
      </a>
      <Sidebar
        orgName={orgName}
        userId={user.id}
        userEmail={user.email ?? ''}
        userName={profile?.full_name ?? undefined}
        role={role}
        plan={plan}
        canSeeAudit={canSeeAudit}
        canSeeResearch={canSeeResearch}
        canSeeRAWorkspace={canSeeRAWorkspace}
        canSeeQAWorkspace={canSeeQAWorkspace}
        canSeeProduction={canSeeProduction}
        canSeeCompliance={canSeeCompliance}
        canSeeAssessments={canSeeAssessments}
        isMedqraftAdmin={isMedqraftAdmin}
        isExpert={isExpert}
        isOwnerExec={isOwnerExec}
        pendingAssignments={inboxBadge}
        unreadMessages={unreadMessages ?? 0}
        sidebarGroups={sidebarGroups}
        menus={Array.from(gatedMenus)}
        isOnboarding={!gsDismissed}
      />
      <main
        id="main"
        tabIndex={-1}
        className="qa-main-content"
        style={{
          flex: 1,
          // 본문 padding 의 SSOT. sticky 밴드·액션바가 이 값을 실측해 inset 을 잡습니다
          // (lib/design/sticky-inset.ts). 패드·폰은 globals.css 가 !important 로 덮습니다.
          padding: `${MAIN_PADDING.top}px ${MAIN_PADDING.right}px ${MAIN_PADDING.bottom}px ${MAIN_PADDING.left}px`,
          overflowY: 'auto',
          overflowX: 'hidden',
          minWidth: 0,
          // height 를 100% 로 두어 부모 root(100dvh) 의 실측 높이를 그대로 사용.
          // 절대값 100dvh + maxHeight 100vh 조합은 부모-자식 사이에 미세한 불일치를 만들어
          // 모바일 elastic bounce 가 발생했음.
          height: '100%',
          // iOS Safari momentum scroll.
          WebkitOverflowScrolling: 'touch',
          // overscroll bounce 차단: 본문 위/아래 끝에서 시스템 elastic 으로 튕기는 현상 방지.
          overscrollBehavior: 'contain',
        }}
      >
        {/* M-01: 구독 칩·알림 종은 데스크톱에서 본문 상단 sticky 헤더 행(56px) 안에 놓입니다.
            종전 viewport fixed 는 스크롤 시 제목·KPI 를 덮고 인쇄에도 찍혔습니다. 모바일은 종전대로
            fixed 로 동작합니다(TopHeaderBand 가 모바일에서는 상자를 만들지 않습니다). */}
        <TopHeaderBand>
          {/* 모든 화면의 «뒤로» 단추(오빠 지시 2026-09-14). 띠의 왼쪽 끝, 홈에서는 안 그린다. */}
          <BackButton />
          {subscriptionData && membership && (
            <SubscriptionIndicator
              placement="static"
              orgId={membership.org_id as string}
              tier={subscriptionData.tier}
              status={subscriptionData.status}
              enforcement_mode={subscriptionData.enforcement_mode}
              expires_at={subscriptionData.expires_at}
              usage_resets_at={subscriptionData.usage_resets_at}
              ai_premium_used={subscriptionData.ai_premium_used}
              ai_premium_quota={subscriptionData.ai_premium_quota}
              ai_premium_topup={subscriptionData.ai_premium_topup}
              ai_calls_used={subscriptionData.ai_calls_used}
              ai_calls_quota={subscriptionData.ai_calls_quota}
              ai_calls_topup={subscriptionData.ai_calls_topup}
              rule_engine_runs={subscriptionData.rule_engine_runs}
              rule_engine_quota={subscriptionData.rule_engine_quota}
              rule_engine_topup={subscriptionData.rule_engine_topup}
              external_api_calls={subscriptionData.external_api_calls}
              external_api_quota={subscriptionData.external_api_quota}
              external_api_topup={subscriptionData.external_api_topup}
              active_projects={subscriptionData.active_projects}
              project_limit={subscriptionData.project_limit}
              storage_bytes_used={subscriptionData.storage_bytes_used}
              storage_limit_bytes={subscriptionData.storage_limit_bytes}
              active_members={subscriptionData.active_members}
              member_limit={subscriptionData.member_limit}
              expert_limit={subscriptionData.expert_limit}
            />
          )}
          <NotificationBell placement="static" userId={user.id} isRdLead={caps.sidebarMenus.has('rd-review')} />
        </TopHeaderBand>
        <PageTransition>
          {lockedModule ? (
            <ModuleLockedNotice
              title={MODULE_LABEL_KR[lockedModule]}
              moduleId={lockedModule}
              offered={lockedIsOffered}
              canActivate={lockedIsOffered && (role === 'owner' || hasRole(profile, 'exec'))}
              headline={
                lockedIsOffered
                  ? `${MODULE_LABEL_KR[lockedModule]} 업무를 시작할 준비가 되면 켜세요`
                  : `${MODULE_LABEL_KR[lockedModule]} 가지는 지금 제품에서 제공하지 않습니다`
              }
              description={
                lockedIsOffered
                  ? '이 화면은 아직 켜지 않은 업무 가지에 속합니다. 켜면 차림표와 화면이 함께 열립니다.'
                  : '첫 판매는 제품 개발 · 품질 · 인허가 관리 세 기둥입니다. 이 가지가 필요하면 MedQraft 에 알려 주십시오.'
              }
            />
          ) : (
            children
          )}
        </PageTransition>
      </main>
      <RealtimeNotifications userId={user.id} />
      {/* ⏸ AI Assistant FAB: 2026-06-04 오빠 지시로 일시 비활성화. 기능/컴포넌트는
          보존(삭제 X). "AI assistant 다시 보자" 요청 시 위 import 와 이 렌더 주석을
          해제하면 즉시 복원. (BACKLOG 「AI Assistant 재검토·복원」) */}
      {/* <AIQuickAccessFab /> */}
      <MobileBottomNav
        jobRole={jobRole}
        jobRoles={profile?.job_roles ?? null}
        orgRole={role}
        isMedqraftAdmin={isMedqraftAdmin}
        pendingAssignments={inboxBadge}
        showFieldMode={enabledModules.includes('production')}
      />
      {/* 신규 사용자 first-time tooltip: 한 번만 노출 (localStorage) */}
      <Coachmark
        id="sidebar-intro-v1"
        title="여기서 모든 일이 시작됩니다"
        body="좌측 사이드바에서 R&D 아이디어 등록, 변경평가, 문서 관리까지 한 번에. 위 ⌘K (Ctrl+K) 로 빠른 검색·이동이 가능합니다."
        targetSelector='[data-coachmark="sidebar"]'
        placement="right"
        delayMs={1200}
      />
      <GlobalSearch isMedqraftAdmin={isMedqraftAdmin} />
      {/* 무반응 자동 로그아웃: **현재 꺼져 있다**(2026-08-20 오빠 지시).
          스위치는 SessionIdleMonitor 의 IDLE_LOGOUT_ENABLED 하나뿐이라, 마운트는
          그대로 두고 거기서 끈다. 여기서 지우면 되돌릴 때 두 곳을 고쳐야 한다.
          창/탭 닫기 로그아웃은 sessionStorage 세션으로 계속 동작한다(client.ts). */}
      <SessionIdleMonitor />
      {/* AI 도우미는 AIQuickAccessFab 안으로 통합됨 (메뉴 "💬 AI 도우미").
          별도 floating button mount 안 함. 우하단 FAB 단일 진입점. */}
      {!isExpert && (
        <WelcomeFlow
          show={showWelcome}
          userName={profile?.full_name ?? user.email?.split('@')[0] ?? '회원'}
          gsRole={resolveGsRole(allRoles as string[], profile?.job_role ?? null)}
        />
      )}
      {/* PWA "앱으로 설치" 안내: 로그인 후 우하단에 잠깐 노출(설치 버튼 포함). */}
      <InstallAppPrompt />
    </div>
    </VaultProvider>
  );
}
