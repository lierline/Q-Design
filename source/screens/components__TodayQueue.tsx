// =============================================================================
// components/TodayQueue.tsx: "오늘 처리할 것" 상위 5건 (Phase 1 W1)
// =============================================================================
// 사용자 비전 "다음 행동이 명확한 첫 화면" 구현.
// 모든 권한 통합: KPI 보다 액션 우선.

'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useNoviceMode } from '@/lib/novice-mode';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  ChevronRight,
  RefreshCw,
  Eye,
  CheckCircle,
  GitPullRequest,
  PenLine,
  Hourglass,
  Reply,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  MessageSquareWarning,
  Info,
  Bell,
  FileText,
  Wrench,
  FlaskConical,
  type LucideIcon,
} from 'lucide-react';
import { Bx, SectionTitle, Tag, infoPopoverStyle } from '@/lib/design/components';
import { F, FS, ICON, LH, MOTION, RADIUS, S, SHADOW, STATE, T, TYPE, alpha, labelTracking, labelWordSpacing } from '@/lib/design/tokens';
import { httpStatusMessage } from '@/lib/api/client-error';
import { captureBestEffort } from '@/lib/observability';
import type { TodayQueueItem, TodayQueueKind } from '@/lib/today-queue/score';

const KIND_ICON: Record<TodayQueueKind, LucideIcon> = {
  research_doc_review: Eye,
  research_doc_approve: CheckCircle,
  change_request_decision: GitPullRequest,
  change_impact_revision: PenLine,
  opinion_received: CheckCircle,
  assessment_review: Eye,
  assessment_dispute_response: Reply,
  assessment_initiator_response: MessageSquare,
  capa_owner_action: ShieldAlert,
  capa_effectiveness: ShieldCheck,
  complaint_critical: AlertTriangle,
  complaint_received: MessageSquareWarning,
  audit_finding_capa: AlertTriangle,
  nc_pending_disposition: ShieldAlert,
  nc_capa_required: AlertTriangle,
  vigilance_deadline: AlertTriangle,
  overdue_draft: PenLine,
  doc_request: FileText,
  approval_turn: PenLine,
  stage_doc_authoring: PenLine,
  // 생산(2026-08-21): 설비 보전·공정 재밸리데이션 기한
  pm_due: Wrench,
  revalidation_due: FlaskConical,
  // 배정된 조치(2026-09-03 P-01·P-10): 경영검토 조치항목 · 품질목표 실행계획
  mr_action_due: FileText,
  qo_action_due: CheckCircle,
  // 네 관점(오너 결정 2026-09-13): 이 큐(내가 할 일)에는 안 나오지만 종류 표는 전수여야 한다.
  waiting_review: Eye,
  waiting_approval: CheckCircle,
  waiting_reply: MessageSquare,
  waiting_supplement: FileText,
  waiting_cr: GitPullRequest,
  drafting_doc: PenLine,
  team_stale_request: MessageSquareWarning,
  team_stale_supplement: FileText,
  team_stale_review: Eye,
  notification: Bell,
};

interface TodayQueueResponse {
  items: TodayQueueItem[];
  count: number;
  totalScanned: number;
  /** C-04: 조회에 실패한 업무 원본 이름. 비어 있지 않으면 «깨끗함» 을 말하지 않는다. */
  failedSources?: string[];
  /** 결재함에 있는 결재 건수. 결재는 이 목록에 없고(오너 결정 2026-09-27 「결재는 결재함에만」) 입구만 둔다 */
  approvalCount?: number;
}

// 권한별 오늘 처리할 것 설명 데이터
// matchRoles: 이 섹션을 볼 수 있는 job_role 값 목록. 빈 배열 = 모든 역할 공통.
const ROLE_INFO = [
  {
    role: 'RA / QA 담당자',
    color: STATE.copper,
    matchRoles: ['ra', 'ra_lead', 'qa', 'qa_lead'],
    items: [
      'R&D 문서 1차 검토 대기',
      'R&D 문서 최종 승인 대기',
      '변경평가 RA/QA 검토 대기 (본인 의견 없음)',
      '변경 의뢰 결재 대기',
      '부작용 보고 기한 임박/초과',
    ],
  },
  {
    role: 'R&D / R&D 팀장',
    color: STATE.cobalt,
    matchRoles: ['rd', 'rd_lead'],
    items: [
      '본인 발안 변경평가에 이의 / 추가정보 요청 도착',
      'CAPA 소유자: 본인 책임 CAPA 진행 필요',
      '오래된 임시 저장 초안 (30일+)',
      'RA/QA 의 서류 제출/공유 요청 도착 (R&D 팀장)',
    ],
  },
  {
    role: '소유자 / 경영진',
    color: T.green,
    matchRoles: ['exec', 'admin'],
    items: [
      'R&D 문서 최종 승인 대기',
      '변경 의뢰 결재 대기',
      '부작용 보고 기한 임박/초과',
    ],
  },
  {
    role: 'QA / 관리자',
    color: T.red,
    matchRoles: ['qa', 'qa_lead', 'admin'],
    items: [
      '치명 고객 불만 또는 MDR 보고 대상 접수',
      '신규 고객 불만 조사 미시작',
      '심사 발견 사항: CAPA 미발행',
      '부적합: 처분 미결정 또는 CAPA 필요',
    ],
  },
  // 생산(2026-08-21 신설): 오빠 지적으로 실측하니 이 큐가 생산 직무에는 **구조적으로
  // 항상 0건**이었다(모든 소스가 rd/ra/qa/exec/owner 축). 설명만 QA·RA 와 비슷해 보였던
  // 이유가 그것이다. 생산용 항목 자체가 없었다.
  // 현장의 「오늘 할 일」은 문서 검토가 아니라 **기한이 닥친 설비·공정**이다.
  {
    role: '생산 담당자',
    color: T.warning,
    matchRoles: ['production', 'production_lead'],
    items: [
      '생산설비 예방보전 기한 임박/초과 (§6.3)',
      '공정 재밸리데이션 기한 임박/만료 (§7.5.6)',
    ],
  },
  {
    role: '모든 권한 공통',
    color: T.champagne,
    matchRoles: [] as string[],
    items: [
      '본인이 이의를 보낸 변경평가에 발안자 응답 도착',
      '외부 자문 회신 도착 (요청자 후속 액션 필요)',
      'CAPA 효과성 확인 단계 폐쇄 대기',
    ],
  },
];

export function TodayQueue({
  roles = [],
  initial = null,
  all = false,
}: {
  roles?: string[];
  /** 서버 렌더에서 미리 받아 온 값. 있으면 첫 왕복을 건너뛴다(2026-08-30). */
  initial?: TodayQueueResponse | null;
  /** C-05: /my-actions 에서는 상위 5건이 아니라 전체 목록을 같은 조회로 받는다. */
  all?: boolean;
}) {
  const router = useRouter();
  const { novice } = useNoviceMode();
  const [data, setData] = useState<TodayQueueResponse | null>(initial);
  const [loading, setLoading] = useState(initial === null);
  const [error, setError] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoRect, setInfoRect] = useState<DOMRect | null>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const infoBtnRef = useRef<HTMLButtonElement>(null);

  // owner 는 job_roles 에 명시 안 되는 경우가 있어 org_role=owner 케이스도 커버
  const isOwnerOrExec = roles.some((r) => ['exec', 'admin', 'owner'].includes(r));
  const filteredRoleInfo = ROLE_INFO.filter(
    (g) => g.matchRoles.length === 0 || g.matchRoles.some((r) => roles.includes(r)) || isOwnerOrExec,
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(all ? '/api/today-queue?all=1' : '/api/today-queue', { cache: 'no-store' });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        console.error('[TodayQueue] load failed:', res.status, e);
        setError(e?.message ?? httpStatusMessage(res.status));
        setLoading(false);
        return;
      }
      const json = (await res.json()) as TodayQueueResponse;
      setData(json);
      setLoading(false);
      lastLoadedAt.current = Date.now();
    } catch (e) {
      console.error('[TodayQueue] load exception:', e);
      setError('일시적 오류예요. 잠시 후 다시 시도해 주세요.');
      setLoading(false);
    }
  }

  // C-09 (Codex 협업 감사): 새 알림으로 서버가 다시 그려 새 initial 을 주면 큐도 따라간다(종전엔 최초 값만 썼다).
  useEffect(() => {
    if (initial !== null) setData(initial);
  }, [initial]);

  useEffect(() => {
    // 서버가 이미 채워 줬으면 첫 왕복을 하지 않는다. 새로고침 버튼·읽음 처리는 그대로.
    if (initial !== null) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // C-09 나머지 (Codex 협업 감사 2026-09-13): 다른 탭에 갔다 오거나(visibilitychange · focus) 연결이 끊겼다 붙으면(online)
  //   큐가 스스로 다시 조회한다. 결재 · 요청은 다른 사람이 만드는 일이라 «내가 아무것도 안 해도» 목록이 바뀐다.
  //   30초 안에 조회한 적이 있으면 건너뛴다(탭을 빠르게 오갈 때 왕복 폭주 방지).
  const lastLoadedAt = useRef<number>(Date.now());
  useEffect(() => {
    const REFETCH_MIN_MS = 30_000;
    const refetchIfStale = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastLoadedAt.current < REFETCH_MIN_MS) return;
      lastLoadedAt.current = Date.now();
      void load();
    };
    document.addEventListener('visibilitychange', refetchIfStale);
    window.addEventListener('online', refetchIfStale);
    window.addEventListener('focus', refetchIfStale);
    return () => {
      document.removeEventListener('visibilitychange', refetchIfStale);
      window.removeEventListener('online', refetchIfStale);
      window.removeEventListener('focus', refetchIfStale);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all]);

  // 알림 기반 항목 클릭: 종 알림과 동일하게 is_read 처리 + 목록에서 즉시 제거(optimistic).
  //   "확인"이 공갈 버튼이던 문제 해소: 클릭하면 실제로 읽음 처리되어 다시 안 뜬다.
  //   의미 있는 link 면 이동하고, 정보성 알림(link 없음=/notifications)은 그 자리서 제거만.
  // 읽음 처리 UPDATE 는 lazy thenable: 반드시 await 해야 HTTP 가 발사된다.
  //   (이전: `void <PostgrestBuilder>` 는 .then() 미호출로 요청이 나가지 않아 서버 미반영
  //    = 공갈 버튼. 여기선 async 함수(Promise)를 void 하므로 내부 await 이 실제 발사한다.)
  //   실패해도 UX 는 optimistic 제거를 유지하고 best-effort 로만 캡처.
  async function markNotificationRead(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) captureBestEffort('today-queue.markRead', error, { notificationId: id });
  }

  function handleNotificationItem(item: TodayQueueItem) {
    if (item.notificationId) {
      void markNotificationRead(item.notificationId);
    }
    setData((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.filter((i) => i.id !== item.id),
            totalScanned: Math.max(0, prev.totalScanned - 1),
            count: Math.max(0, prev.count - 1),
          }
        : prev,
    );
    if (item.href && item.href !== '/notifications') router.push(item.href);
  }

  // 팝업 외부 클릭 시 닫기
  useEffect(() => {
    if (!infoOpen) return;
    function onOutside(e: MouseEvent) {
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) {
        setInfoOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [infoOpen]);

  // 비어있을 때: 평온한 메시지 (다 처리됨)
  const items = data?.items ?? [];
  const failed = data?.failedSources ?? [];
  const approvalCount = data?.approvalCount ?? 0;

  return (
    // marginBottom 제거: 대시보드 보드(CustomizableWidgetBoard)의 gap 이 섹션 간
    // 세로 간격을 단독 제어(줄간격 통일). 위젯이 자체 마진을 들고 있으면 보드 gap 과
    // 겹쳐 들쭉날쭉해짐.
    <section>
      <div style={{ display: 'flex', alignItems: 'center', gap: S[2.5], marginBottom: S[3] }}>
        <SectionTitle noMargin>오늘 처리할 것</SectionTitle>
        {/* 당신 차례 총 건수: 상위 5건만 리스트되지만 헤더엔 전체(totalScanned) 노출(첫눈에 "내 차례 N건") */}
        <Tag size="sm">{data?.totalScanned ?? items.length}건</Tag>
        {/* ⓘ info 버튼 + 팝업 */}
        {/* 초보자 모드 OFF 면 기준 설명(ⓘ)도 숨긴다 (설정의 약속 · 2026-09-14 전수 검수) */}
        {novice && (
        <div style={{ position: 'relative' }} ref={infoRef}>
          <button
            ref={infoBtnRef}
            type="button"
            aria-label="오늘 처리할 것 기준 설명"
            aria-expanded={infoOpen}
            onClick={() => {
              if (!infoOpen && infoBtnRef.current) {
                setInfoRect(infoBtnRef.current.getBoundingClientRect());
              }
              setInfoOpen((v) => !v);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: infoOpen ? T.champagne : T.muted,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 32,
              minHeight: 32,
              padding: S[1],
              transition: `color 150ms ease`,
            }}
          >
            <Info size={14} aria-hidden="true" />
          </button>
          {infoOpen && infoRect && typeof document !== 'undefined' && createPortal(
            <div
              role="tooltip"
              style={{
                ...infoPopoverStyle(),
                position: 'fixed',
                top: infoRect.bottom + 6,
                left: infoRect.left,
                width: 320,
                zIndex: 9999,
              }}
            >
              <div style={{ marginBottom: S[3] }}>
                <div style={{ fontFamily: F.serif, fontSize: FS[13], fontWeight: 600, color: T.text }}>
                  오늘 처리할 것: 선정 기준
                </div>
              </div>
              <div style={{ fontSize: FS[11], color: T.subtle, lineHeight: LH.relaxed, marginBottom: S[3], fontFamily: F.serif }}>
                우선순위 점수 = 경과 시간(60%) + 항목 중요도(25%) + 제품 등급(15%) 로 자동 계산.
                상위 5건만 표시됩니다.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: S[2.5] }}>
                {filteredRoleInfo.map((group) => (
                  <div key={group.role}>
                    <div
                      style={{
                        fontSize: FS[10],
                        fontFamily: F.mono,
                        letterSpacing: labelTracking(group.role, 1.4),
                        wordSpacing: labelWordSpacing(group.role),
                        textTransform: 'uppercase',
                        color: group.color,
                        marginBottom: S[1],
                        paddingBottom: 3,
                        borderBottom: `1px solid ${alpha(group.color, 0.2)}`,
                      }}
                    >
                      {group.role}
                    </div>
                    <ul style={{ margin: 0, padding: '0 0 0 14px', listStyleType: 'disc' }}>
                      {group.items.map((item) => (
                        <li key={item} style={{ fontSize: FS[11], color: T.subtle, lineHeight: LH.relaxed, fontFamily: F.serif }}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>,
            document.body
          )}
        </div>
        )}
        <button
          type="button"
          onClick={() => void load()}
          aria-label="새로고침"
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: 'none',
            color: T.subtle,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            // WCAG 2.5.5: 44x44 touch target
            minWidth: 44,
            minHeight: 44,
            padding: S[1],
          }}
        >
          <RefreshCw size={16} className={loading ? 'qa-spin' : ''} aria-hidden="true" />
        </button>
      </div>

      <style>{`
        @keyframes qa-spin {
          to { transform: rotate(360deg); }
        }
        .qa-spin { animation: qa-spin 0.8s linear infinite; }
        /* 360px 미만에서는 CTA 라벨 숨김: 제목/부제목 우선 */
        @media (max-width: 359px) {
          .qa-today-cta { display: none; }
        }
      `}</style>

      {/* 결재 입구: 결재는 결재함에서만 처리한다(오너 결정 2026-09-27). 목록 줄과 같은 모양으로 맨 위에 둔다 */}
      {approvalCount > 0 && (
        <Link
          href="/approve"
          aria-label={`결재할 안건 ${approvalCount}건: 결재함 열기`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: S[3.5],
            padding: '16px 18px',
            marginBottom: S[2.5],
            background: T.surface,
            border: `1px solid ${alpha(T.champagne, 0.35)}`,
            borderLeft: `2px solid ${T.champagne}`,
            borderRadius: RADIUS.md,
            textDecoration: 'none',
            color: T.text,
            minHeight: 68,
            boxShadow: SHADOW.hairline,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: RADIUS.pill,
              background: alpha(T.champagne, 0.06),
              flexShrink: 0,
            }}
          >
            <PenLine size={ICON.sizeMd} strokeWidth={ICON.strokeWidth} aria-hidden="true" style={{ color: T.champagne }} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontFamily: F.serif, fontSize: FS[15], fontWeight: 600, color: T.text, marginBottom: 3, lineHeight: 1.35 }}>
              결재할 안건 {approvalCount}건
            </span>
            <span style={{ display: 'block', fontFamily: F.serif, fontSize: FS[12], color: T.subtle, lineHeight: LH.normal }}>
              결재는 결재함에서 처리합니다. 폰에서도 됩니다.
            </span>
          </span>
          <span
            className="qa-today-cta"
            aria-hidden="true"
            style={{
              fontSize: FS[12],
              fontWeight: 500,
              color: T.champagne,
              padding: '6px 12px',
              border: `1px solid ${alpha(T.champagne, 0.35)}`,
              borderRadius: RADIUS.md,
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            결재함 열기
          </span>
          <ChevronRight size={ICON.sizeSm} strokeWidth={ICON.strokeWidth} color={T.subtle} style={{ flexShrink: 0 }} aria-hidden="true" />
        </Link>
      )}

      {loading && !data && (
        <Bx style={{ padding: S[6], background: alpha(T.champagne, 0.02) }}>
          <div style={{ fontSize: FS[13], color: T.subtle }}>오늘 처리할 것을 정리 중...</div>
        </Bx>
      )}

      {error && (
        <Bx style={{ padding: S[6], borderColor: T.red, background: alpha(T.red, 0.04) }}>
          <div style={{ fontSize: FS[13], color: T.red }}>{error}</div>
        </Bx>
      )}

      {!loading && !error && items.length === 0 && (
        <Bx
          style={{
            padding: '36px 32px',
            background: T.surface,
            borderColor: T.border,
            borderRadius: RADIUS.md,
            textAlign: 'center',
            boxShadow: SHADOW.hairline,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: RADIUS.pill,
              border: `1px solid ${alpha(T.champagne, 0.25)}`,
              background: alpha(T.champagne, 0.04),
              marginBottom: S[3.5],
            }}
          >
            <Hourglass
              size={ICON.sizeLg}
              strokeWidth={ICON.strokeWidthThin}
              aria-hidden="true"
              color={T.champagne}
            />
          </div>
          <div
            style={{
              ...TYPE.h3,
              color: T.text,
              marginBottom: S[1.5],
            }}
          >
            {failed.length > 0 ? '일부 업무를 불러오지 못했습니다.' : approvalCount > 0 ? '결재 말고 다른 할 일은 없습니다.' : '오늘은 깨끗합니다.'}
          </div>
          <div style={{ ...TYPE.caption, color: failed.length > 0 ? T.warning : T.subtle }}>
            {failed.length > 0
              ? `${failed.join(' · ')} 조회가 실패해 그쪽 할 일은 보이지 않습니다. 잠시 뒤 새로고침하십시오.`
              : '다음 작업을 기다리는 중입니다.'}
          </div>
        </Bx>
      )}

      {items.length > 0 && failed.length > 0 && (
        <div role="status" style={{ ...TYPE.caption, color: T.warning, marginBottom: S[2] }}>
          {failed.join(' · ')} 조회가 실패해 그쪽 할 일은 이 목록에 없습니다.
        </div>
      )}
      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: S[2.5] }}>
          {items.map((item) => {
            const ItemIcon = KIND_ICON[item.kind] ?? Eye;
            const aria = `${item.title}: ${item.subtitle}: ${item.cta}`;
            const baseStyle: CSSProperties = {
              display: 'flex',
              alignItems: 'center',
              gap: S[3.5],
              padding: '16px 18px',
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderLeft: `2px solid ${scoreToColor(item.score)}`,
              borderRadius: RADIUS.md,
              textDecoration: 'none',
              color: T.text,
              transition: `background ${MOTION.fast}, border-color ${MOTION.fast}, transform ${MOTION.fast}`,
              minHeight: 68,
              overflow: 'hidden',
              boxShadow: SHADOW.hairline,
            };
            const onEnter = (e: { currentTarget: HTMLElement }) => {
              e.currentTarget.style.background = alpha(T.champagne, 0.04);
              e.currentTarget.style.borderColor = alpha(T.champagne, 0.35);
              e.currentTarget.style.boxShadow = SHADOW.surface;
            };
            const onLeave = (e: { currentTarget: HTMLElement }) => {
              e.currentTarget.style.background = T.surface;
              e.currentTarget.style.borderColor = T.border;
              e.currentTarget.style.boxShadow = SHADOW.hairline;
            };
            const inner = (
              <>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: RADIUS.pill,
                    background: alpha(T.champagne, 0.06),
                    flexShrink: 0,
                  }}
                >
                  <ItemIcon
                    size={ICON.sizeMd}
                    strokeWidth={ICON.strokeWidth}
                    aria-hidden="true"
                    style={{ color: T.champagne }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: F.serif,
                      fontSize: FS[15],
                      fontWeight: 600,
                      letterSpacing: '-0.005em',
                      color: T.text,
                      marginBottom: 3,
                      lineHeight: 1.35,
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontFamily: F.serif,
                      fontSize: FS[12],
                      color: T.subtle,
                      lineHeight: LH.normal,
                    }}
                  >
                    {item.subtitle}
                  </div>
                </div>
                <div
                  className="qa-today-cta"
                  style={{
                    fontFamily: F.mono,
                    fontSize: FS[10],
                    fontWeight: 500,
                    letterSpacing: labelTracking(item.cta, '0.12em'),
                    wordSpacing: labelWordSpacing(item.cta),
                    color: T.champagne,
                    padding: '6px 12px',
                    border: `1px solid ${alpha(T.champagne, 0.35)}`,
                    borderRadius: RADIUS.md,
                    flexShrink: 0,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                  aria-hidden="true"
                >
                  {item.cta}
                </div>
                <ChevronRight
                  size={ICON.sizeSm}
                  strokeWidth={ICON.strokeWidth}
                  color={T.subtle}
                  style={{ flexShrink: 0 }}
                  aria-hidden="true"
                />
              </>
            );
            // 알림 기반 항목 = 버튼(클릭 시 is_read 처리 + 목록에서 제거, 종 알림과 동일).
            //   작업 기반 항목 = 링크(이동: 소스 상태로 자동 해소되므로 read 개념 없음).
            return item.notificationId ? (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNotificationItem(item)}
                aria-label={aria}
                style={{ ...baseStyle, width: '100%', textAlign: 'left', font: 'inherit', cursor: 'pointer' }}
                onMouseEnter={onEnter}
                onMouseLeave={onLeave}
              >
                {inner}
              </button>
            ) : (
              <Link
                key={item.id}
                href={item.href}
                aria-label={aria}
                style={baseStyle}
                onMouseEnter={onEnter}
                onMouseLeave={onLeave}
              >
                {inner}
              </Link>
            );
          })}
          {/* 전체 보기 링크: Today Queue 가 5건이면 추가 액션이 있을 수 있음을 알림 */}
          {data && data.totalScanned > items.length && (
            <Link
              href="/my-actions"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: S[1.5],
                marginTop: S[1],
                padding: '10px 14px',
                fontFamily: F.serif,
                fontSize: FS[13],
                color: T.subtle,
                textDecoration: 'none',
                letterSpacing: '-0.005em',
                borderRadius: RADIUS.md,
                transition: `color ${MOTION.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = T.champagne;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = T.subtle;
              }}
            >
              전체 {data.totalScanned}건 보기
              <ChevronRight size={ICON.sizeXs} strokeWidth={ICON.strokeWidth} aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

/** 점수 기반 좌측 border 색상: 높을수록 시급 (champagne / warning / red) */
function scoreToColor(score: number): string {
  if (score >= 70) return T.red;
  if (score >= 45) return T.warning;
  return T.champagne;
}
