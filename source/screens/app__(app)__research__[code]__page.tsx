'use client';

// =============================================================================
// /research/[code]: 프로젝트 홈 허브
// =============================================================================
// 단 하나의 질문에 답함: "지금 뭐 해야 하지?"
// • 한 줄 상태
// • Hero Next Action 카드 (제일 큰 1개)
// • Secondary actions (top 3)
// • Quick KPI 4개
// • 최근 활동 5건
//
// 모든 세부 정보 → 별도 sub-page 로 이동.

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Alert, Bx, En, LoadingState, PageHd, SectionTitle, SectionTitleInfo, SkeletonPanel, Tag } from '@/lib/design/components';
import { PageGuide } from '@/components/PageGuide';
import { HelpNote } from '@/components/HelpNote';
import { TextLinkAction } from '@/components/TextAction';
import { S, FS, F, T, alpha, LH } from '@/lib/design/tokens';
import { tintBorder } from '@/lib/design/grain';
import { shortDate } from '@/lib/date';
import { AlertTriangle } from '@/components/q-design-icons/AlertTriangle';
import { AssigneeDialog, fetchAssignees, type AssigneeInfo } from '@/components/AssigneeDialog';
import { TextAction } from '@/components/TextAction';
import { ArrowRight } from '@/components/q-design-icons/ArrowRight';
import { CheckCircle2 } from '@/components/q-design-icons/CheckCircle2';
import { Clock } from '@/components/q-design-icons/Clock';
import { FileText } from '@/components/q-design-icons/FileText';
import { Lightbulb } from '@/components/q-design-icons/Lightbulb';
import { Sparkles } from '@/components/q-design-icons/Sparkles';
import { Target } from '@/components/q-design-icons/Target';
import { computeResearchProgress } from '@/lib/research/progress';
import { buildDocClassMap, type DocClass } from '@/lib/research/stage-doc-set';
import { latestDecisionByStage, STAGE_IDS } from '@/lib/research/stage-config';
import { getRegistryDoc } from '@/lib/research/document-registry';
import { STAGE_LABEL, STAGE_COLOR } from '@/lib/research/stage-labels';
import { type StageFilter } from '@/components/RegulatoryRoadmap';
import { RaProgressPanel } from '@/components/RaProgressPanel';
import { useVault } from '@/lib/vault/vault-context';
import { canDo } from '@/lib/rules/actions';

// =============================================================================
// 흐름 컴포넌트 (북극성: 제품을 열면 = 인허가 로드맵 흐름)
// =============================================================================
// 기존 '일정·작업'(timeline) 화면에 있던 흐름 패널들을 홈으로 이관: 제품을
// 클릭하면 첫 화면에서 곧바로 그 제품의 인허가 흐름을 따라갈 수 있게 함.
// timeline 과 동일하게 거대 client 컴포넌트를 dynamic(ssr:false) 로 분리
// (초기 홈 payload 감소).
// 각 패널은 dynamic(ssr:false) 라 JS 청크 + 자체 데이터 fetch 시차로 제각각
// 뜬다. loading fallback 을 디자인 시스템 <SkeletonPanel>(qa-skeleton shimmer
// SSOT)로 통일: 패널별 실제 높이에 가까운 자리를 잡아 레이아웃 점프(CLS) 없이
// "같은 자리에 일관되게" 채워지게 한다.
const BackwardsPlanner = dynamic(
  () => import('@/components/BackwardsPlanner').then((m) => ({ default: m.BackwardsPlanner })),
  { ssr: false, loading: () => <SkeletonPanel height={120} lines={2} /> },
);
const RegulatoryRoadmap = dynamic(
  () => import('@/components/RegulatoryRoadmap').then((m) => ({ default: m.RegulatoryRoadmap })),
  { ssr: false, loading: () => <SkeletonPanel height={260} lines={5} /> },
);
const StageProgressionAction = dynamic(
  () => import('@/components/StageProgressionAction').then((m) => ({ default: m.StageProgressionAction })),
  { ssr: false, loading: () => <SkeletonPanel height={150} lines={2} /> },
);
const StageRevertAction = dynamic(
  () => import('@/components/StageRevertAction').then((m) => ({ default: m.StageRevertAction })),
  { ssr: false, loading: () => null },
);
const GraduateProjectAction = dynamic(
  () => import('@/components/GraduateProjectAction').then((m) => ({ default: m.GraduateProjectAction })),
  { ssr: false, loading: () => <SkeletonPanel height={150} lines={2} /> },
);
const RequirementsDashboard = dynamic(
  () => import('@/components/RequirementsDashboard').then((m) => ({ default: m.RequirementsDashboard })),
  { ssr: false, loading: () => <SkeletonPanel height={300} lines={6} /> },
);
const RdDocumentFlowPanel = dynamic(
  () => import('@/components/RdDocumentFlowPanel').then((m) => ({ default: m.RdDocumentFlowPanel })),
  { ssr: false, loading: () => <SkeletonPanel height={340} lines={6} /> },
);

interface ProjectLite {
  id: string;
  code: string;
  title: string;
  stage: string;
  profile_completed_at: string | null;
  approval_number: string | null;
  approved_at: string | null;
  target_approval_date: string | null;
  graduated_product_id: string | null;
  created_by: string;
  created_at: string;
  // 보관(soft-delete) 여부: 보관된 프로젝트는 목록에서 숨겨지며 상단 배너로 안내.
  archived: boolean;
  // AI 분석: 신규 생성 직후 비동기 trigger 판정에 사용
  ai_analyzed_at: string | null;
  // profile cols (subset)
  profile_device_class: number | null;
  profile_sterile: string | null;
  profile_body_contact: string | null;
  profile_contact_duration: string | null;
  profile_software_type: string | null;
  profile_active_device: boolean | null;
  profile_clinical_likely: boolean | null;
  profile_target_markets: string[] | null;
  profile_working_principle: string | null;
}

type Severity = 'info' | 'recommend' | 'warning';

interface Suggestion {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  source: string;
  priority: number;
}

interface BriefingDocItem {
  code: string;
  name_kr: string;
  iso_clause?: string;
  status: string;
  last_updated_at: string | null;
  stale_days: number | null;
}

interface BlockingItem extends BriefingDocItem {
  blocks_stage: string;
}

interface WaitingItem {
  kind: string;
  cr_number?: string;
  cr_title?: string;
  requested_at: string;
  days_since: number;
}

interface Briefing {
  blocking: BlockingItem[];
  waiting: WaitingItem[];
  in_progress: BriefingDocItem[];
  suggestions: Suggestion[];
  activity_health: number;
}

export default function ResearchHomePage() {
  const params = useParams();
  const code = String(params?.code ?? '');
  const vault = useVault();

  const [project, setProject] = useState<ProjectLite | null>(null);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [rdPct, setRdPct] = useState<number>(0);
  const [rdMissing, setRdMissing] = useState<string[]>([]);
  // 분모(필수 문서 수)를 함께 보여준다. % 만 보이면 「0%」 가 «내가 한 게 반영 안 됐다»
  // 로 읽힌다. 실제로는 «development 필수문서 N개 중 완료 0개» 라는 뜻이다.
  const [rdDone, setRdDone] = useState<number>(0);
  const [rdTotal, setRdTotal] = useState<number>(0);
  const [complianceScore, setComplianceScore] = useState<number | null>(null);
  const [planNextDeadline, setPlanNextDeadline] = useState<{ label: string; date: string; days: number } | null>(null);
  // ── 흐름 패널 공유 state (timeline 에서 이관) ──
  const [myUserId, setMyUserId] = useState<string | null>(null);
  // 담당 실무자(RA · QA) 상태: 개발 단계 이후에 비었거나 사라졌으면 상단 알림 + 재지정 창(오너 결정 2026-10-07)
  const [assignInfo, setAssignInfo] = useState<AssigneeInfo | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [myJobRole, setMyJobRole] = useState<string | null>(null);
  const [myJobRoles, setMyJobRoles] = useState<string[]>([]);
  const [myOrgRole, setMyOrgRole] = useState<string | null>(null);
  const [orgIsSoloMode, setOrgIsSoloMode] = useState<boolean>(false);
  // 변경평가 메뉴(RA·QA 모듈) 가시성: 졸업 안내 카피가 그 메뉴를 가리킬지 분기.
  const [hasRaOrQa, setHasRaOrQa] = useState<boolean>(false);
  const [orgHasOtherApprover, setOrgHasOtherApprover] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [docStatusByCode, setDocStatusByCode] = useState<Map<string, string>>(new Map());
  const [docClassByCode, setDocClassByCode] = useState<Map<string, DocClass>>(new Map());
  const [drDecisionByStage, setDrDecisionByStage] = useState<Map<string, string>>(new Map());
  // ★ 단계 선택 SSOT: 인허가 로드맵 = 마스터 컨트롤.
  //   [사용자 명시 불변식] 로드맵 노드를 클릭하면 이 selectedStage 하나로 단계
  //   진행 · R&D 양식 · 카탈로그 문서 패널이 전부 같은 단계로 동기화된다. 절대
  //   따로 놀면 안 되며, 특정 패널에서 selectedStage 연결을 떼지 말 것
  //   (#158 회귀 → #166 복구 전력).
  const [selectedStage, setSelectedStage] = useState<StageFilter>('current');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── ?doc= 딥링크 착지 (3B in-flow 개정 정확착지) ─────────────────────
  // 알림·today-queue 등에서 특정 문서로 진입(?doc=code)하면, 그 문서의 stage 로
  // ★selectedStage(마스터)를 맞춰 로드맵·R&D양식·필요문서가 함께 그 단계로 동기화
  // 되게 한다(사용자 불변식 유지: setSelectedStage 하나로만 제어). 그러면
  // RdDocumentFlowPanel 이 그 stage 카드를 노출하고 focusDocCode 로 스크롤·champagne
  // 착지한다. registry.stage 가 null(QMS 등 stage 무관)이면 stage 는 건드리지 않는다.
  // mount 후 1회만(그 뒤엔 사용자의 로드맵 클릭이 마스터).
  const searchParams = useSearchParams();
  // C-07: ?doc= 는 문서 코드나 문서 id, #doc-<id> 는 결재 알림(F-20)의 해시. 셋 다 같은 카드에 내린다.
  const [hashDoc, setHashDoc] = useState<string | null>(null);
  useEffect(() => {
    const m = /^#doc-([0-9a-f-]{36})$/i.exec(window.location.hash);
    if (m) setHashDoc(m[1]);
  }, []);
  const focusDoc = searchParams?.get('doc') ?? hashDoc;
  // UUID 로 왔으면 패널이 문서 목록으로 코드로 풀어 알려 준다. 그때 단계를 맞춘다.
  const [focusResolved, setFocusResolved] = useState<string | null>(null);
  const stageSyncedFor = useRef<string | null>(null);
  useEffect(() => {
    const target = focusResolved ?? focusDoc;
    if (!target || stageSyncedFor.current === target) return;
    const stage = getRegistryDoc(target)?.stage;
    if (stage) setSelectedStage(stage);
    if (stage || !/^[0-9a-f-]{36}$/i.test(target)) stageSyncedFor.current = target;
  }, [focusDoc, focusResolved]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Parallel fetch: 모든 sub-systems + 흐름(design-reviews)
      const encoded = encodeURIComponent(code);
      const [projRes, brfRes, reqRes, complRes, planRes, drRes] = await Promise.all([
        fetch(`/api/research/${encoded}`, { cache: 'no-store' }),
        fetch(`/api/research/${encoded}/briefing`, { cache: 'no-store' }),
        fetch(`/api/research/${encoded}/requirements`, { cache: 'no-store' }),
        fetch(`/api/research/${encoded}/compliance`, { cache: 'no-store' }),
        fetch(`/api/research/${encoded}/plan`, { cache: 'no-store' }),
        fetch(`/api/research/${encoded}/design-reviews`, { cache: 'no-store' }),
      ]);

      const projData = await projRes.json();
      if (!projRes.ok) {
        setError(projData?.message ?? '프로젝트 로드 실패');
        return;
      }
      setProject(projData.project as ProjectLite);
      if ((projData.project as ProjectLite).stage !== 'idea') {
        void fetchAssignees({ project: code }).then((i) => setAssignInfo(i));
      }
      // me: 흐름 패널 권한/Solo Mode 판정 (timeline 과 동일 규약)
      const me = projData.me as
        | { id?: string; job_role?: string; job_roles?: string[]; org_role?: string; org_is_solo_mode?: boolean; has_ra_or_qa?: boolean; org_has_other_approver?: boolean }
        | undefined;
      setMyUserId(me?.id ?? null);
      setMyJobRole(me?.job_role ?? null);
      setMyJobRoles(me?.job_roles ?? (me?.job_role ? [me.job_role] : []));
      setMyOrgRole(me?.org_role ?? null);
      setOrgIsSoloMode(me?.org_is_solo_mode ?? false);
      setHasRaOrQa(me?.has_ra_or_qa ?? false);
      setOrgHasOtherApprover(me?.org_has_other_approver ?? true);

      if (brfRes.ok) setBriefing((await brfRes.json()).briefing);
      if (reqRes.ok) {
        const r = await reqRes.json();
        // R&D progress + 단계별 문서 상태 (흐름 패널 동기화용)
        const statuses = (r.statuses ?? []) as Array<{ doc_code: string; status: string }>;
        const progress = computeResearchProgress(projData.project, statuses);
        setRdPct(progress.rdPct);
        setRdMissing(progress.rdMissing);
        setRdDone(progress.rdCompleted);
        setRdTotal(progress.rdRequired);
        setDocStatusByCode(new Map(statuses.map((s) => [s.doc_code, s.status])));
        // 엔진 문서 분류: StageProgressionAction 의 doc_codes_or 게이트가 '비해당' 코드를
        // 후보 제외하도록(서버 evaluateGate 와 동일 데이터·3패널 동기화).
        setDocClassByCode(buildDocClassMap(r.requirements?.documents));
      }
      if (complRes.ok) {
        const c = await complRes.json();
        setComplianceScore(c.score?.overall_pct ?? null);
      }
      if (planRes.ok) {
        const p = await planRes.json();
        if (p.plan?.stages) {
          // 다음 deadline = 현재 공식 단계 '이후' 단계 중 가장 임박한 미래 deadline.
          // (백워드 플래너는 목표 허가일 기준 역산이라 이미 완료한 과거 단계의
          //  deadline 도 days_remaining 이 양수일 수 있음 → 완료된 단계가 "다음
          //  deadline" 으로 잡히던 버그 수정. plan.stages 는 canonical 순서 정렬.)
          const stages = p.plan.stages as Array<{
            stage_id: string;
            label: string;
            deadline: string;
            days_remaining: number;
          }>;
          const curIdx = stages.findIndex((s) => s.stage_id === projData.project.stage);
          const upcoming = stages.filter(
            (s, i) => (curIdx < 0 || i > curIdx) && s.days_remaining >= 0,
          );
          if (upcoming.length > 0) {
            const next = upcoming[0];
            setPlanNextDeadline({
              label: next.label,
              date: next.deadline,
              days: next.days_remaining,
            });
          } else {
            setPlanNextDeadline(null);
          }
        }
      }
      // design review 회의록: stage 게이트용. «가장 최근 회의의 decision» 은 서버 게이트·
      // DesignReviewPanel 과 같은 함수(latestDecisionByStage)로 정합니다(rd-ra M-01).
      if (drRes.ok) {
        const dr = await drRes.json();
        const meetings = (dr.meetings ?? []) as Array<{
          stage: string; decision: string; meeting_date: string; created_at?: string | null;
        }>;
        setDrDecisionByStage(latestDecisionByStage(meetings));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // 신규 생성 직후 AI 분석이 비어 있으면 자동 trigger (fire-and-forget).
  // POST /api/research/[code] 가 재분석 endpoint: 50초까지 걸릴 수 있어 await
  // 안 하고 그냥 보냄. 끝나면 사용자가 다음 새로고침 / 페이지 재진입 시 반영.
  // 중복 trigger 방지를 위해 sessionStorage 에 'analyzed:[code]' flag.
  useEffect(() => {
    if (!project) return;
    if (project.ai_analyzed_at) return; // 이미 분석됨
    const flagKey = `qa-analysis-triggered:${code}`;
    if (typeof window !== 'undefined' && sessionStorage.getItem(flagKey)) return;
    sessionStorage.setItem(flagKey, String(Date.now()));
    // fire-and-forget: 응답 대기 안 함
    void fetch(`/api/research/${encodeURIComponent(code)}`, {
      method: 'POST',
    }).catch(() => {
      // 실패해도 무시: 사용자가 '전문 분석 다시 실행' 버튼으로 재시도 가능
    });
  }, [project, code]);

  // ── 금고 자동 잠금 해제 안내: 이 화면 진입 시 잠겨 있으면 팝업(오빠 지침 2026-07-11) ──
  //   문서 업로드·복호 열람이 이 화면의 핵심 작업이라, 작업 버튼에서 매번 막히기 전에 진입 시
  //   1회 선제로 잠금 해제를 안내한다. requestUnlock 이 내부에서 probe→상태 판정→(잠김이면)
  //   팝업 표시. 이미 해제됐거나 평문 조직(vault 미사용)이면 아무 동작도 안 한다.
  const vaultPromptedRef = useRef(false);
  useEffect(() => {
    if (vaultPromptedRef.current) return;
    if (!vault.vaultEnabled) return; // 평문 조직: 안 띄움
    if (vault.status === 'unlocked') return; // 이미 해제됨
    vaultPromptedRef.current = true;
    void vault.requestUnlock();
  }, [vault]);

  if (loading && !project) {
    return <LoadingState />;
  }

  if (!project) {
    return (
      <div>
        <PageHd title="프로젝트 없음" />
        <Alert kind="error">{error ?? '프로젝트를 찾을 수 없습니다.'}</Alert>
      </div>
    );
  }

  // ─── Next Action 결정 ────────────────────────────────────────────────────
  // 1. blocking 첫 번째 → '작업' 페이지로
  // 2. waiting > 7일 → 'reviews' 페이지로
  // 3. profile 미완성 → 'profile' 페이지로
  // 4. suggestion priority 가장 높은 것
  const nextAction = computeNextAction(briefing, project);

  // ─── 한 줄 상태 ───────────────────────────────────────────────────────────
  const isApproved = project.stage === 'approved' || project.stage === 'post_market';
  const bump = () => setRefreshKey((k) => k + 1);

  return (
    <div className="qa-fade-in">
      <PageHd
        title={project.title}
        sub={<><En>{project.code}</En> · {shortDate(project.created_at)}</>}
        actions={
          <Tag color={STAGE_COLOR[project.stage] ?? T.muted}>
            {STAGE_LABEL[project.stage] ?? project.stage}
          </Tag>
        }
      />
      <PageGuide pageId="research-home" />

      {assignInfo && assignInfo.needs.length > 0 && (
        <div style={{ marginBottom: S[4] }}>
          <Alert kind="warning">
            이 프로젝트의 {assignInfo.needs.map((d) => (d === 'ra' ? 'RA' : 'QA')).join(' · ')} 담당 실무자가
            {assignInfo.needs.some((d) => assignInfo.status[d] === 'inactive') ? ' 더 이상 활성 멤버가 아닙니다' : ' 지정되어 있지 않습니다'}.
            결재 검토가 담당자에게 먼저 가려면 다시 지정하십시오.{' '}
            <TextAction onClick={() => setAssignOpen(true)}>담당 실무자 지정</TextAction>
          </Alert>
        </div>
      )}
      {assignOpen && (
        <AssigneeDialog
          open
          target={{ project: code }}
          info={assignInfo}
          onClose={() => setAssignOpen(false)}
          onSaved={() => {
            setAssignOpen(false);
            void fetchAssignees({ project: code }).then((i) => setAssignInfo(i));
          }}
        />
      )}
      {project.archived && (
        <div style={{ marginBottom: S[4] }}>
          <Alert kind="warning">
            이 프로젝트는 <b>보관</b>되어 목록(신규 개발·허가 후)에서 숨겨져 있습니다. 데이터는
            모두 보존됩니다. 복원하려면 위 <b>설정</b> 탭의 Danger Zone 에서 「프로젝트 복원」을 누르십시오.
          </Alert>
        </div>
      )}

      <HelpNote>
        이 화면은 이 제품의 <strong>인허가 로드맵 흐름</strong>입니다. 아래 「일정 / 단계」의
        로드맵에서 단계를 클릭하면 단계 진행 · R&D 양식 · 문서 작업이 모두 그 단계로 함께
        맞춰집니다. 위에서부터 <strong>「지금 가장 중요한 작업」 → 로드맵 → 문서 작업</strong>
        순서로 따라가면 흐름을 놓치지 않습니다.
      </HelpNote>

      {/* AI 분석 진행 중 안내: ai_analyzed_at null 이면 백그라운드 trigger 중 */}
      {!project.ai_analyzed_at && (
        <div
          // 안내 상자 세 겹(사용법 · 분석 중 · 현재 단계)을 줄였다(화면 검토 A76 · 2026-09-28). 분석 중은 상자 없는 한 줄
          style={{
            marginBottom: S[4],
            fontSize: FS[12],
            color: T.subtle,
            fontFamily: F.ui,
            lineHeight: LH.relaxed,
            display: 'flex',
            alignItems: 'center',
            gap: S[2],
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: T.champagne,
              animation: 'qa-pulse 1.4s ease-in-out infinite',
            }}
          />
          <span>
            <strong style={{ color: T.champagne }}>코어 분석 진행 중</strong>: 약 1분 후 페이지를 새로고침하시면 등급·predicate·규제 경로 등이
            채워집니다. 그동안 제품 정보·문서 작업은 이어가실 수 있습니다.
          </span>
          <style>{`@keyframes qa-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }`}</style>
        </div>
      )}

      {/* 한 줄 상태: 판이 아니라 위아래 괘선 사이의 줄(화면 검토 A76 · 2026-09-28) */}
      <div
        style={{
          padding: `${S[2.5]}px 2px`,
          marginBottom: S[5],
          borderTop: `1px solid ${T.border}`,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: S[3.5], flexWrap: 'wrap', fontSize: FS[12] }}>
          <span style={{ color: T.text, fontFamily: F.serif }}>
            현재 단계 <strong style={{ color: T.champagne }}>{STAGE_LABEL[project.stage]}</strong>
          </span>
          <span style={{ color: T.muted }}>·</span>
          <span style={{ color: T.subtle, fontFamily: F.ui }}>
            R&D 진행률 <strong style={{ color: T.text }}>{rdPct}%</strong>
            {rdTotal > 0 && (
              <span style={{ color: T.muted }}> (필수 {rdDone}/{rdTotal})</span>
            )}
          </span>
          {complianceScore !== null && (
            <>
              <span style={{ color: T.muted }}>·</span>
              <span style={{ color: T.subtle, fontFamily: F.ui }}>
                §7.3 점수 <strong style={{ color: T.text }}>{complianceScore}%</strong>
              </span>
            </>
          )}
          {planNextDeadline && (
            <>
              <span style={{ color: T.muted }}>·</span>
              <span style={{ color: T.subtle, fontFamily: F.ui }}>
                다음 deadline <strong style={{ color: planNextDeadline.days < 30 ? T.warning : T.text }}>
                  {planNextDeadline.label} ({planNextDeadline.days}일 후)
                </strong>
              </span>
            </>
          )}
          {project.approval_number && (
            <>
              <span style={{ color: T.muted }}>·</span>
              <Tag color={T.green}>{project.approval_number}</Tag>
            </>
          )}
        </div>
      </div>

      {/* [D] 결재 데드락 경고: 최종 승인자 부재(본인 외 0명·solo OFF·reviewed 문서 존재) */}
      {/* 검토 «중» 인 문서가 생긴 순간부터 알린다. 종전엔 reviewed 가 생긴 뒤에야 떠서 이미 막힌 뒤에 알았다(R&D 흐름 감사 C-11). */}
      {!orgHasOtherApprover && !orgIsSoloMode && Array.from(docStatusByCode.values()).some((s) => s === 'review' || s === 'reviewed') && (
        <Alert kind="warning" title="최종 승인자가 없어 결재가 멈출 수 있습니다" style={{ marginBottom: S[5] }}>
              1차 검토를 통과한 문서를 최종 승인하려면 경영진 · R&D 팀장 · 소유자 권한이 필요한데, 본인 외에 승인 가능한 멤버가 없습니다. 설정에서 <strong>1인 조직 모드</strong>를 켜거나 <strong>경영진 · R&D 팀장</strong> 직무 멤버를 추가하십시오.
          <div style={{ marginTop: S[1] }}>
            <TextLinkAction href="/settings/members">멤버 · 직무 설정으로</TextLinkAction>
          </div>
        </Alert>
      )}

      {/* Hero Next Action */}
      {nextAction && (
        <div style={{ marginBottom: S[6] }}>
          <SectionTitle>지금 가장 중요한 작업</SectionTitle>
          {/* Hover 럭셔리 강조: champagne hairline glow + translateY(-1px).
              prefers-reduced-motion 시 globals.css 전역 룰로 transition/transform 무력화. */}
          <style dangerouslySetInnerHTML={{ __html: `
            .qa-hero-action > .qa-hero-card {
              transition:
                background 220ms cubic-bezier(0.16, 1, 0.3, 1),
                box-shadow 220ms cubic-bezier(0.16, 1, 0.3, 1),
                transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
              will-change: transform;
            }
            .qa-hero-action:hover > .qa-hero-card {
              transform: translateY(-1px);
              box-shadow:
                0 0 0 1px var(--qa-champagne),
                0 12px 32px color-mix(in srgb, var(--qa-champagne) 12%, transparent);
            }
          ` }} />
          <Link
            href={nextAction.href}
            className="qa-hero-action"
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <div className="qa-hero-card">
              <Bx
                style={{
                  padding: S[6],
                  borderColor: tintBorder(nextAction.color),
                  background: alpha(nextAction.color, 0.06),
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: S[4.5],
                }}
              >
                <nextAction.Icon size={32} style={{ color: nextAction.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: FS[12], color: T.muted, fontFamily: F.ui, marginBottom: S[1] }}>
                    {nextAction.category}
                  </div>
                  <div style={{ fontSize: FS[18], color: T.text, fontFamily: F.serif, fontWeight: 600, marginBottom: S[1] }}>
                    {nextAction.title}
                  </div>
                  <div style={{ fontSize: FS[12], color: T.subtle, fontFamily: F.serif, lineHeight: LH.normal }}>
                    {nextAction.detail}
                  </div>
                </div>
                <ArrowRight size={20} style={{ color: nextAction.color, flexShrink: 0 }} />
              </Bx>
            </div>
          </Link>
        </div>
      )}

      {/* KPI 카드(필수문서·블로킹·응답대기) 제거: 상태 배너 + '지금 가장 중요한 작업'
          카드와 중복. 정보 절제(R&D 정보 노출 원칙, 2026-06-03). 블로킹/대기는 Next
          Action 이, 진행률·점수는 상태 배너가 이미 짚어줌. */}

      {/* '추가 추천 작업'(Secondary actions) 제거: 가장 중요한 작업(Next Action) 단일 노출로
          헤맴·과잉정보 방지(오빠 요청 2026-06-27, R&D 정보 절제 원칙). briefing.suggestions 데이터는
          유지(다른 활용 여지), 이 홈 화면에서는 표시하지 않음. */}

      {/* ── 흐름: 인허가 로드맵을 따라가며 단계별 문서 작업 ──────────────────────
          ★ 제품을 열면 = 흐름. 로드맵(selectedStage 마스터)을 클릭하면 단계 진행 ·
          R&D 양식 · 카탈로그 문서가 같은 단계로 함께 동기화된다. (기존 '일정·작업'
          탭의 흐름을 홈으로 이관: 사용자 3패널 불변식 보존.) */}
      <div id="flow" style={{ scrollMarginTop: 24 }}>
        <SectionTitle>일정 / 단계</SectionTitle>
      </div>

      {/* 로드맵 누르는 법은 화면 머리 안내에서 한 번 말한다(화면 검토 A76 · 두 상자가 같은 말을 했다) */}

      {/* Backwards Planner: 목표 출시일 기반 역산 */}
      <BackwardsPlanner code={code} refreshKey={refreshKey} currentStage={project.stage} />

      {/* 로드맵: 단계 클릭으로 아래 문서 리스트도 함께 필터됨 */}
      <RegulatoryRoadmap
        code={code}
        profileCompletedAt={project.profile_completed_at}
        currentStage={project.stage}
        selectedStage={selectedStage}
        onSelectStage={setSelectedStage}
        refreshKey={refreshKey}
      />

      {/* Stage Progression + Graduate */}
      {!isApproved && project.stage !== 'archived' && (
        <>
          <div style={{ marginBottom: S[7] }}>
            {/* ★ [사용자 불변식] 인허가 로드맵 selectedStage 와 반드시 연동. 로드맵
                노드 클릭 시 이 패널도 함께 그 단계로 동기화: 절대 떼지 말 것
                (#158 에서 떼어냈다가 #166 으로 복구). */}
            <StageProgressionAction
              projectCode={code}
              stage={project.stage}
              selectedStage={selectedStage}
              profileCompletedAt={project.profile_completed_at}
              rdPct={rdPct}
              rdMissing={rdMissing}
              docStatusByCode={docStatusByCode}
              docClassByCode={docClassByCode}
              drDecisionByStage={drDecisionByStage}
              onAdvanced={() => {
                bump();
                void load();
              }}
            />
            {/* 🔑 되돌리기는 진행 버튼 «바로 아래» 에 둔다. 잘못 올린 것을 알아채는
                자리가 곧 여기이고, 다른 화면으로 보내면 사람은 DB 를 고치러 간다.
                한 칸 이전 단계는 STAGE_IDS(SSOT)에서 파생한다. */}
            <div style={{ marginTop: S[3] }}>
              <StageRevertAction
                projectCode={code}
                stage={project.stage}
                previousStage={
                  STAGE_IDS.indexOf(project.stage as (typeof STAGE_IDS)[number]) > 0
                    ? STAGE_IDS[STAGE_IDS.indexOf(project.stage as (typeof STAGE_IDS)[number]) - 1]
                    : null
                }
                orgRole={myOrgRole}
                jobRoles={myJobRoles}
                onReverted={() => {
                  bump();
                  void load();
                }}
              />
            </div>
          </div>
          {/* GraduateProjectAction 은 submission 일 때만 자체 노출. */}
          {project.stage === 'submission' && (
            <div style={{ marginBottom: S[7] }}>
              <GraduateProjectAction
                projectCode={code}
                stage={project.stage}
                profileCompletedAt={project.profile_completed_at}
                rdPct={rdPct}
                hasRaOrQa={hasRaOrQa}
                // SA-4a: 졸업풀(owner OR ra/qa/rd_lead/exec/admin) 미충족이면 버튼 대신 안내
                //   → 일반 rd 가 누른 뒤 서버 403 막다른 길 방지.
                canGraduate={canDo({ profile: { job_roles: myJobRoles }, orgRole: myOrgRole }, 'project.graduate')}
                onGraduated={() => {
                  bump();
                  void load();
                }}
              />
            </div>
          )}
        </>
      )}

      {/* R&D 핵심 문서 (제안서 / 계획서 / 입력서): 양식 ↔ 업로드 */}
      <div
        style={{
          margin: '8px 0 24px',
          paddingTop: S[3],
          borderTop: `1px solid ${T.border}`,
        }}
      >
        <SectionTitleInfo
          info={
            <>
              제안서·계획서·입력서 등 R&D 단계별 핵심 양식입니다. 양식 다운로드 → 작성 →
              업로드 후 검토를 요청하면 RA/QA 로 넘어갑니다.
            </>
          }
        >
          R&D 핵심 문서 (양식 작성)
        </SectionTitleInfo>
        <RdDocumentFlowPanel
          projectCode={code}
          userId={myUserId ?? undefined}
          jobRole={myJobRole}
          jobRoles={myJobRoles}
          orgRole={myOrgRole}
          projectStage={project.stage}
          selectedStage={selectedStage}
          focusDocCode={focusDoc ?? undefined}
          onFocusResolved={(docType) => setFocusResolved(docType)}
          orgIsSoloMode={orgIsSoloMode}
          onChanged={() => {
            setRefreshKey((k) => k + 1);
            void load();
          }}
        />
      </div>

      {/* 카탈로그 문서 작업 (RA/QA 문서 등) */}
      <div
        style={{
          margin: '8px 0 12px',
          paddingTop: S[3],
          borderTop: `1px solid ${T.border}`,
        }}
      >
        <SectionTitleInfo
          info={
            <>
              위 로드맵에서 단계를 클릭하면 해당 단계 문서로 자동 필터됩니다. 양식
              다운로드 / 진행 상태 변경 / 질문은 카드 내부에서 진행하십시오.
            </>
          }
        >
          문서 작업 (전체 카탈로그)
        </SectionTitleInfo>
        <RequirementsDashboard
          code={code}
          profileCompletedAt={project.profile_completed_at}
          jobRole={myJobRole}
          orgRole={myOrgRole}
          projectStage={project.stage}
          stageFilter={selectedStage}
          onStageFilter={setSelectedStage}
          refreshKey={refreshKey}
          onDocStatusChanged={() => setRefreshKey((k) => k + 1)}
        />
      </div>

      {/* RA 인허가·UDI 진척 (읽기전용): 허가 단계는 RA 담당, R&D 는 모니터링만 */}
      {/* 큐의 서류 요청 항목(#ra-progress)이 여기로 내린다. 패널은 조회 뒤에 그려지므로 id 는 바깥 상자에. */}
      <div id="ra-progress">
        <RaProgressPanel code={code} />
      </div>

      {/* 최근 활동은 '검토·회의'(/reviews) 탭으로: 홈은 흐름에 집중 (2026-06-03 컴팩트화) */}

      {/* AI Helper floating FAB 은 (app) layout 으로 이동: 모든 화면에서 노출되도록.
          이 페이지에선 pathname 으로 code 가 자동 추출되어 project 컨텍스트가 동일하게 첨부됨. */}
    </div>
  );
}

// ─── Next Action 결정 함수 ───────────────────────────────────────────────────
interface NextAction {
  category: string;
  title: string;
  detail: string;
  href: string;
  color: string;
  Icon: typeof Lightbulb;
}

function computeNextAction(
  briefing: Briefing | null,
  project: ProjectLite,
): NextAction | null {
  // 0. 프로파일 미작성이면 그게 최우선
  if (!project.profile_completed_at) {
    return {
      category: '시작 단계',
      title: '제품 프로파일을 먼저 작성하십시오',
      detail: '약 2분: 9문항. 이걸 완성해야 시스템이 「내 제품에 맞춤」 안내 가능.',
      href: `/research/${encodeURIComponent(project.code)}/profile`,
      color: T.champagne,
      Icon: Lightbulb,
    };
  }
  // 0.5. 졸업(허가 단계 진입/시판) → 인허가 착수가 다음 행동(R&D 동결 후 RA 인계).
  if (project.stage === 'approved' || project.stage === 'post_market') {
    return {
      category: '인허가 진행 (RA)',
      title: '이제 인허가를 시작하십시오',
      detail: '제품 개발이 완료(졸업)됐습니다. 인허가 트래커에서 시장별 인허가 신청을 진행하십시오.',
      href: '/device-licenses',
      color: T.champagne,
      Icon: Target,
    };
  }
  // 1. 블로킹 있으면
  if (briefing && briefing.blocking.length > 0) {
    const b = briefing.blocking[0];
    return {
      category: '블로킹: 다음 단계 진입 막음',
      title: `${b.name_kr} 작성·완료 처리`,
      detail: `${b.iso_clause ?? ''} · ${b.blocks_stage} 단계 진행을 막고 있음. 아래 문서 작업에서 진행하십시오.`,
      href: `/research/${encodeURIComponent(project.code)}#flow`,
      color: T.red,
      Icon: AlertTriangle,
    };
  }
  // 2. 7일 이상 응답 대기
  if (briefing && briefing.waiting.length > 0) {
    const w = briefing.waiting.find((x) => x.days_since >= 7);
    if (w) {
      return {
        category: '응답 확인 필요',
        title: w.cr_title ?? '검토 응답 확인',
        detail: `${w.days_since}일째 대기 중. 검토자에게 확인을 요청하시기 바랍니다.`,
        href: `/research/${encodeURIComponent(project.code)}/reviews`,
        color: T.warning,
        Icon: Clock,
      };
    }
  }
  // 3. AI 제안 priority 가장 높은 것
  if (briefing && briefing.suggestions.length > 0) {
    const s = briefing.suggestions[0];
    let href = `/research/${encodeURIComponent(project.code)}`;
    let category = 'Q-Atelier 추천';
    let Icon = Sparkles;
    if (s.id.includes('rmf')) {
      href += '#flow';
      category = '위험관리 업데이트';
      Icon = FileText;
    } else if (s.id.includes('stage_can_advance')) {
      href += '#flow';
      category = '단계 진행';
      Icon = Target;
    } else if (s.id.includes('design_review')) {
      href += '/reviews';
      category = '회의록 작성';
      Icon = FileText;
    } else if (s.id.includes('target')) {
      href += '#flow';
      category = '일정 점검';
      Icon = Clock;
    }
    return {
      category,
      title: s.title,
      detail: s.detail,
      href,
      color: s.severity === 'warning' ? T.warning : T.champagne,
      Icon,
    };
  }
  // 4. 모든 것 OK
  return {
    category: '진행 중',
    title: '특별한 블로킹 없음. 진행 계속',
    detail: '오늘 큰 이슈는 없습니다. 아래 로드맵에서 단계 진행 가능성을 확인하십시오.',
    href: `/research/${encodeURIComponent(project.code)}#flow`,
    color: T.green,
    Icon: CheckCircle2,
  };
}
