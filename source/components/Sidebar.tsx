'use client';

import { Z } from '@/lib/design/q-design-runtime';
import { labelCase, labelTracking, labelWordSpacing, QDText } from '@/lib/design/q-design-labels';
import { QDPresentation } from '@/lib/design/q-design-runtime';
import { QDScale } from '@/lib/design/q-design-scale';
import { Monitor } from '@/components/q-design-icons/Monitor';
import { Moon } from '@/components/q-design-icons/Moon';
import { Sun } from '@/components/q-design-icons/Sun';
import Link from 'next/link';
import { ChevronLeft } from '@/components/q-design-icons/ChevronLeft';
import { Menu } from '@/components/q-design-icons/Menu';
import { usePathname } from 'next/navigation';
import { Children, useEffect, useRef, useState, type ComponentType, type CSSProperties } from 'react';
import { LayoutDashboard } from '@/components/q-design-icons/LayoutDashboard';
import { ClipboardList } from '@/components/q-design-icons/ClipboardList';
import { Package } from '@/components/q-design-icons/Package';
import { Mail } from '@/components/q-design-icons/Mail';
import { MessageSquare } from '@/components/q-design-icons/MessageSquare';
import { Users } from '@/components/q-design-icons/Users';
import { ScrollText } from '@/components/q-design-icons/ScrollText';
import { ShieldCheck } from '@/components/q-design-icons/ShieldCheck';
import { UserCheck } from '@/components/q-design-icons/UserCheck';
import { Building2 } from '@/components/q-design-icons/Building2';
import { Sparkles } from '@/components/q-design-icons/Sparkles';
import { Lightbulb } from '@/components/q-design-icons/Lightbulb';
import { Calendar as CalendarIcon } from '@/components/q-design-icons/Calendar';
import { ClipboardCheck } from '@/components/q-design-icons/ClipboardCheck';
import { HardHat } from '@/components/q-design-icons/HardHat';
import { BookOpen } from '@/components/q-design-icons/BookOpen';
import { BookText } from '@/components/q-design-icons/BookText';
import { Settings as SettingsIcon } from '@/components/q-design-icons/Settings';
import { User as UserIcon } from '@/components/q-design-icons/User';
import { Gauge as GaugeIcon } from '@/components/q-design-icons/Gauge';
// 도메인별 아이콘은 lib/nav/nav-items.ts (NAV_ITEMS) 로 이전: 메뉴 SSOT.
import { useTheme } from '@/lib/design/theme-provider';
import { F, FS, LH, RADIUS, S, T, alpha } from '@/lib/design/tokens';
import { IconBtn } from '@/lib/design/components';
import { isMyDept } from '@/lib/permissions';
import type { SidebarGroups, SidebarMenuId } from '@/lib/permissions';
import { NAV_ITEMS, FLOW_DOCUMENT_MENUS, NAV_SUBGROUP_LABEL, NAV_SUBGROUP_ORDER, type NavGroup, type NavSubGroup } from '@/lib/nav/nav-items';
import { Avatar } from './Avatar';
// Coachmark 는 layout.tsx 에서 직접 마운트: 본 컴포넌트는 data-coachmark="sidebar" 만 표시.
import { Logo, LogoMark } from './Logo';
import { LogoutButton } from './LogoutButton';
import { orgRolePlanLabel } from '@/lib/labels/org';
import { PasskeyDrawerLink } from './PasskeyDrawerLink';
import { detectAdminGroup } from './AdminHubTabs';
import { RuleEngineBadge } from './RuleEngineBadge';
import { APP_VERSION_LABEL } from '@/lib/app-version';
import { isOrgOwner } from '@/lib/rules/who';
import { BP, QDRuntime } from '@/lib/design/q-design-runtime';

type IconType = ComponentType<{ size?: number; strokeWidth?: number }>;

interface SidebarProps {
  orgName: string;
  userEmail: string;
  userName?: string;
  /** 프로필 사진 판 번호(없으면 첫 글자 동그라미) */
  avatarVersion?: string | null;
  role: string;
  plan: string;
  canSeeAudit: boolean;
  /**
   * 들어갈 수 있는 부서 허브(research · ra-workspace · qa-workspace · field-mode). 레이아웃이 화면의
   * 문지기와 같은 판정(lib/permissions/hub-entry)으로 계산한다. 연계 부서 이름은 여기 있으면 허브 링크다.
   */
  enterableHubs?: SidebarMenuId[];
  /** ISO 13485 자가 점검 (owner/admin/QA/RA/medqraft_admin) */
  canSeeCompliance?: boolean;
  /** 변경평가 메뉴 (RA/QA/owner/admin/exec/medqraft_admin): R&D 는 숨김 */
  canSeeAssessments?: boolean;
  isMedqraftAdmin?: boolean;
  isExpert?: boolean;
  isOwnerExec?: boolean; // 대표/임원: 간소화된 사이드바
  pendingAssignments?: number;
  /** 메시지 미읽음 수: 메뉴 옆 빨간 배지 */
  unreadMessages?: number;
  /**
   * Multi-role 2계층 그룹: 다중 권한 사용자만 비-null.
   * null 이면 기존 평탄 메뉴 (single-role / expert / admin / owner-exec) 유지.
   */
  sidebarGroups?: SidebarGroups | null;
  /** 사용자가 보유한 전체 메뉴(워크스페이스 펼침 메뉴의 도메인 모듈 도출용). */
  menus?: SidebarMenuId[];
  /** gs_dismissed_at null → 온보딩 중 → 설정 그룹 기본 접힘 */
  isOnboarding?: boolean;
  /** 접힘 상태를 계정별로 기억하기 위한 식별자. 없으면 이메일 → 브라우저 공용 순으로 떨어진다. */
  userId?: string;
}

// 접힘 상태는 **계정별**로 기억한다. 같은 브라우저를 여러 계정이 쓸 때 서로의 취향을
// 덮어쓰지 않도록. 홈 위젯 배치가 이미 `dash-${user.id}` 로 계정별이라 스코프를 맞춘 것.
const STORAGE_KEY_LEGACY = 'qa-sidebar-collapsed'; // 계정 구분이 없던 시절 키: 승계용
const collapseKeyFor = (who: string) => `qa-sidebar-collapsed:${who}`;
const DRAWER_BP = BP.lg; // 1024px: 그 미만은 drawer 모드
const SWIPE_CLOSE_THRESHOLD = 60; // px: 좌측 스와이프 임계값

/** 좌상단 차림표 열기 단추. display 는 넣지 않는다: 첫 그림의 자리표시 단추는 globals.css 가 폭으로 켠다 */
const DRAWER_FAB_STYLE: CSSProperties = {
  position: 'fixed',
  // L1: notch / dynamic island 회피: safe-area-inset-top 만큼 내려서 배치
  top: "var(--qd-atelier-top-02a3a6bea5)",
  left: "var(--qd-atelier-left-128cd8727f)",
  zIndex: 'var(--qd-atelier-mobile-control-layer)',
  width: "var(--qd-atelier-width-d1caead449)",
  height: "var(--qd-atelier-height-351c89cba0)",
  background: T.surface,
  border: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}`,
  borderRadius: QDScale.radius, // 2026-09-14 오빠 결정: 차림표 발치도 전부 굴린다(통일)
  color: T.text,
  cursor: 'pointer',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: 'var(--qa-shadow-sm)',
};

export function Sidebar(props: SidebarProps) {
  const { theme, mode, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  // drawerOpen: lg 미만 모바일/태블릿 drawer 의 열림 상태. 기본 닫힘.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  // id 우선(이메일은 바뀔 수 있다). 둘 다 없으면 브라우저 공용 키로 떨어진다.
  const storageKey = collapseKeyFor(props.userId ?? props.userEmail ?? 'anon');

  // 접힘 상태 복원: 계정별. matchMedia 감지와 분리해 둔다(계정이 바뀌면 이것만 다시 읽으면 됨).
  useEffect(() => {
    try {
      // 새 키가 없으면 계정 구분이 없던 시절 값을 승계: 쓰던 사람이 상태를 잃지 않도록.
      const saved = localStorage.getItem(storageKey) ?? localStorage.getItem(STORAGE_KEY_LEGACY);
      setCollapsed(saved === '1');
    } catch {
      // localStorage 미사용 (Private Browsing 등): 기본값 유지, 의도적 no-op
    }
  }, [storageKey]);

  // 마운트 + 리사이즈 감지로 단일 진실의 isMobile 결정 (CSS/JS 모순 제거).
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${DRAWER_BP - 1}px)`);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    setMounted(true);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // body scroll lock: drawer 열린 동안
  useEffect(() => {
    if (!isMobile || !drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobile, drawerOpen]);

  // ESC 로 drawer 닫기
  useEffect(() => {
    if (!isMobile || !drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobile, drawerOpen]);

  // 열면 초점을 서랍 안으로, 닫으면 연 단추로 돌려준다. 초점이 뒤 화면에 남아 있으면 키보드 ·
  // 화면 읽기로는 열린 서랍을 찾을 수 없었다(2026-10-22 폰 375 실측). 메뉴를 눌러 주소가 바뀌어
  // 닫힌 때는 돌려주지 않는다: 새 화면에서 초점이 단추로 튀면 안 된다.
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const fabRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (!isMobile || !drawerOpen) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const openedAt = window.location.pathname;
    drawerRef.current?.querySelector<HTMLElement>('a[href], button:not([disabled])')?.focus();
    return () => {
      if (window.location.pathname !== openedAt) return;
      (opener?.isConnected ? opener : fabRef.current)?.focus();
    };
  }, [isMobile, drawerOpen]);

  // 좌측 swipe(왼쪽으로 끌어 닫기) 감지
  useEffect(() => {
    if (!isMobile || !drawerOpen) return;
    let startX = 0;
    let tracking = false;
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      tracking = true;
    };
    const onMove = (e: TouchEvent) => {
      if (!tracking || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - startX;
      if (dx < -SWIPE_CLOSE_THRESHOLD) {
        setDrawerOpen(false);
        tracking = false;
      }
    };
    const onEnd = () => {
      tracking = false;
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isMobile, drawerOpen]);

  // 경로 변경 시 drawer 자동 닫기
  const pathname = usePathname();
  useEffect(() => {
    if (isMobile) setDrawerOpen(false);
  }, [pathname, isMobile]);

  // MobileBottomNav 의 "더보기" 버튼이 dispatch 하는 글로벌 이벤트 수신.
  // sibling 컴포넌트 간 통신용: props drilling 회피.
  useEffect(() => {
    if (!isMobile) return;
    const handler = () => setDrawerOpen(true);
    window.addEventListener('qa-open-drawer', handler);
    return () => window.removeEventListener('qa-open-drawer', handler);
  }, [isMobile]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, next ? '1' : '0');
      } catch {
        // localStorage 미사용 (Private Browsing 등): 세션 한정 토글로만 동작
      }
      return next;
    });
  }

  // SSR / 첫 paint: 서버는 화면 폭을 모르므로 데스크탑 차림표를 그리고, 폭이 lg 미만이면 CSS 가 그것을 감추고
  // 자리표시 단추를 켠다(globals.css 「첫 그림의 차림표」). 마운트 후 isMobile 로 진짜 모양이 들어선다.
  // 🔴 2026-09-27 가상 폰 앱을 켤 때 데스크탑 차림표가 화면의 60% 를 덮은 채 먼저 그려졌다. 스크립트를 받을
  //    때까지 그 모양이라, 망이 느린 폰일수록 오래 보였다. 감싸개는 display: contents 라 데스크탑 배치는 그대로다.
  if (!mounted) {
    return (
      <>
        <div className="qa-sidebar-ssr">
          <SidebarBody
            {...props}
            collapsed={false}
            theme={theme}
            mode={mode}
            toggleTheme={toggleTheme}
            onToggle={() => {}}
            isMobile={false}
            drawerOpen={false}
          />
        </div>
        {/* 스크립트가 붙기 전이라 눌러도 열리지 않는다. 붙는 즉시 같은 자리의 진짜 단추로 바뀐다 */}
        <button type="button" className="qa-drawer-fab-ssr" aria-label="사이드바 열기" aria-expanded={false} style={DRAWER_FAB_STYLE}>
          <MenuIcon size={QDPresentation.iconSize[20]} />
        </button>
      </>
    );
  }

  // 데스크탑(≥lg): 기존 사이드바, collapse 토글 유지.
  if (!isMobile) {
    return (
      <SidebarBody
        {...props}
        collapsed={collapsed}
        theme={theme}
        mode={mode}
        toggleTheme={toggleTheme}
        onToggle={toggleCollapsed}
        isMobile={false}
        drawerOpen={false}
      />
    );
  }

  // 모바일(< lg): drawer 패턴: hamburger FAB + overlay + slide-in.
  return (
    <>
      {/* Hamburger FAB: 좌상단 fixed. drawer 닫혀있을 때만 보임. */}
      {!drawerOpen && (
        <button
          ref={fabRef}
          onClick={() => setDrawerOpen(true)}
          aria-label="사이드바 열기"
          aria-expanded={false}
          style={{ ...DRAWER_FAB_STYLE, display: 'flex' }}
        >
          <MenuIcon size={QDPresentation.iconSize[20]} />
        </button>
      )}

      {/* Overlay backdrop + slide-in sidebar: drawer 열렸을 때 */}
      {drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            aria-hidden
            style={{
              position: 'fixed',
              inset: "var(--qd-atelier-inset-4199adc115)",
              background: 'var(--qa-backdrop)',
              backdropFilter: 'var(--qd-backdrop-filter)',
              WebkitBackdropFilter: 'var(--qd-backdrop-filter)',
              zIndex: Z.drawerBackdrop,
            }}
          />
          {/* 창 표시(role · aria-modal): 폰 앱(2.7.0)의 뒤로가 이 서랍만 닫는다(Esc 와 같은 길 · 앱 bridge.js __qatelierBack).
              표시가 없으면 뒤로가 서랍 뒤의 이전 화면으로 넘어갔다(2026-09-28 가상 폰 실측). 당겨서 새로 고침도 이 표시를 보고 멈춘다 */}
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="메뉴"
            style={{
              position: 'fixed',
              top: "var(--qd-atelier-top-13ae86191f)",
              left: "var(--qd-atelier-left-090a0c84b4)",
              // 모바일 drawer wrapper: 100dvh 로 동적 viewport (iOS URL bar 변화 대응).
              // L2: maxHeight: 100vh 제거: dvh 가 vh 보다 클 때 효과 무력화 방지.
              height: "var(--qd-atelier-height-8ce6d713d7)",
              zIndex: Z.drawer,
              boxShadow: 'var(--qa-shadow-xl)',
              animation: "var(--qd-atelier-animation-e2fb7e6e84)",
            }}
          >

            <SidebarBody
              {...props}
              collapsed={false}
              theme={theme}
              mode={mode}
              toggleTheme={toggleTheme}
              onToggle={() => setDrawerOpen(false)}
              isMobile={true}
              drawerOpen={true}
            />
          </div>
        </>
      )}
    </>
  );
}

interface BodyProps extends SidebarProps {
  theme: 'dark' | 'light';
  mode: 'dark' | 'light' | 'system';
  toggleTheme: () => void;
  collapsed: boolean;
  onToggle: () => void;
  isMobile: boolean;
  drawerOpen: boolean;
}

function SidebarBody({
  orgName,
  userEmail,
  userName,
  avatarVersion,
  userId,
  role,
  plan,
  canSeeAudit,
  canSeeCompliance,
  canSeeAssessments,
  isMedqraftAdmin,
  isExpert,
  isOwnerExec,
  pendingAssignments = 0,
  unreadMessages = 0,
  sidebarGroups,
  menus = [],
  enterableHubs = [],
  isOnboarding = false,
  theme,
  mode,
  toggleTheme,
  collapsed,
  onToggle,
  isMobile,
}: BodyProps) {
  // 사용자 피드백 history:
  //   264 (초기) → 224 (1차 축소) → 200 (2차 축소, 너무 좁아 THEME 줄바뀜)
  //   → 224 (복구) → 240 (2026-06-06, THEME 행 "◑ System" 줄바뀜 재발: 너비 보강
  //   + 아래 Theme 버튼 값 span 에 whiteSpace:nowrap 으로 근본 차단).
  const width = collapsed ? "var(--qd-atelier-width-8071f21693)" : "var(--qd-atelier-width-aebc026e77)";
  /* 발치 사용자 줄: «소유자 · 엔터프라이즈» 처럼 한글로(오너 결정 2026-09-28 · 화면 검토 A09 · A64) */
  const footMeta = isExpert ? '전문가 · 외부 자문' : orgRolePlanLabel(role, plan);
  const pathname = usePathname();
  // Admin 허브 active 감지: 하나의 hub entry 가 그룹 내 모든 sub-tab 에 대해
  // active 표시되도록.
  const activeAdminHub = detectAdminGroup(pathname);

  // M-16: 마운트 시 활성 메뉴가 nav 스크롤 밖에 있으면 보이는 자리까지만 끌어옵니다(block: nearest).
  // 마운트 한 번만입니다. 경로가 바뀔 때마다 끌어오면 사용자가 잡고 있던 스크롤 위치를 빼앗습니다.
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const active = nav.querySelector<HTMLElement>('.qa-nav-item.active');
    if (!active) return;
    const n = nav.getBoundingClientRect();
    const a = active.getBoundingClientRect();
    if (a.top < n.top || a.bottom > n.bottom) active.scrollIntoView({ block: 'nearest' });
  }, []);

  const collapsedNav = collapsed && !isMobile;

  // Multi-role 그룹 모드: workspace 메뉴(예: research / ra-workspace / qa-workspace)
  // 를 권한 헤더 아래로 묶음. 각 menuId 에 대한 NavLink 정의.
  // collapsedNav 일 때는 헤더 라벨이 보이지 않으므로 그룹화 효과가 줄어들지만
  // active 강조와 NavLink 자체는 그대로 작동.
  // 메뉴 항목은 lib/nav/nav-items.ts (NAV_ITEMS SSOT) 에서 label/href/icon 조회.
  // 각 항목은 `nav.<id>` 태그를 가진 개별 데이터 항목(docs/FEATURE_TAGS §메뉴).
  function renderWorkspaceLink(menuId: SidebarMenuId): React.ReactNode {
    const meta = NAV_ITEMS[menuId];
    if (!meta) return null;
    // admin 허브는 그룹 내 모든 sub-tab 에 대해 active 표시 (forceActive).
    const forceActive =
      menuId === 'admin-ai'
        ? activeAdminHub === 'ai'
        : menuId === 'admin-identity'
          ? activeAdminHub === 'customers'
          : menuId === 'admin-templates'
            ? activeAdminHub === 'system'
            : menuId === 'admin-ops'
              ? pathname === '/admin'
              : undefined;
    return (
      <NavLink
        key={menuId}
        href={meta.href}
        label={meta.label}
        icon={meta.icon}
        collapsed={collapsedNav}
        forceActive={forceActive}
      />
    );
  }

  // ── 워크스페이스 펼침 메뉴: 각 워크스페이스(QA/RA/R&D) 아래 도메인 모듈을
  //    인라인으로(group SSOT 매칭 + 잔여는 주 워크스페이스 귀속 → 누락0).
  //    사이드바를 얇게 유지하면서도 심사 준비도·CAPA 등을 1클릭 거리로.
  const menuSet = new Set(menus);
  const WS_GROUP: Partial<Record<SidebarMenuId, NavGroup>> = {
    research: 'rnd',
    'ra-workspace': 'ra',
    'qa-workspace': 'qms',
    'field-mode': 'production',
  };
  const presentWorkspaces = (['research', 'ra-workspace', 'qa-workspace', 'field-mode'] as SidebarMenuId[]).filter((w) => menuSet.has(w));
  const DOMAIN_GROUPS: NavGroup[] = ['rnd', 'qms', 'ra', 'production'];
  const workspaceModules: Record<string, SidebarMenuId[]> = {};
  // 어느 워크스페이스에도 안 잡힌 도메인 모듈(예: RA 단독 사용자가 접근권한 가진 QMS
  // 모듈 CAPA·불만·부적합·표준·PMS). 예전엔 주 워크스페이스(RA)에 떠밀어 "RA 밑에 10개"
  // 처럼 보였음 → 별도 「관련 모듈」 그룹으로 분리(도달성은 보존, RA 그룹은 순수 인허가만).
  let leftoverModules: SidebarMenuId[] = [];
  {
    const domain = (Object.keys(NAV_ITEMS) as SidebarMenuId[]).filter(
      (m) =>
        DOMAIN_GROUPS.includes(NAV_ITEMS[m].group) &&
        menuSet.has(m) &&
        !FLOW_DOCUMENT_MENUS.has(m) && // 서류형 → 인허가 로드맵 흐름으로(북극성, 임상평가 포함)
        !presentWorkspaces.includes(m),
    );
    const assigned = new Set<SidebarMenuId>();
    for (const ws of presentWorkspaces) {
      const g = WS_GROUP[ws];
      const mods = domain.filter((m) => NAV_ITEMS[m].group === g);
      workspaceModules[ws] = mods;
      mods.forEach((m) => assigned.add(m));
    }
    // 🔴 2026-08-30: 여기 `if (presentWorkspaces.length > 0)` 가 있었다. 그래서
    //    **허브 메뉴가 하나도 없는 직무는 leftoverModules 가 언제나 비었다.**
    //    경영진(exec)이 정확히 그런 직무다: 번들에 도메인 메뉴가 24개나 있는데
    //    research·ra-workspace·qa-workspace·field-mode 중 무엇도 없다.
    //    그 결과 번들이 준 메뉴가 사이드바에 **한 줄도 그려지지 않았다.**
    // 🔑 「허브가 없으면 담을 그릇도 없다」가 아니라 「허브가 없으면 전부가 잔여다」가 맞다.
    //    assigned 가 비어 있으면 filter 는 domain 전체를 돌려주므로 식은 그대로 둔다.
    leftoverModules = domain.filter((m) => !assigned.has(m));
  }

  // ── 남은 도메인 모듈을 «부서»로 되돌린다 (2026-08-21, 오빠 지적) ─────────────
  // 🔴 문제였던 구조: 부서 그룹은 **허브 메뉴를 번들로 가져야** 생긴다(위 WS_GROUP).
  //    그런데 `qa-workspace` 허브는 qa 직무 전용이라, RA 처럼 QMS 모듈만 여럿 가진
  //    직무에게는 담을 그릇이 없어 **12개가 통째로 「관련 모듈」로 쏟아졌다.**
  //    그래서 화면이 「짬뽕」으로 보였다. 권한 문제가 아니라 분류 문제였다.
  //    (코드 주석에도 흔적이 있다: 예전엔 RA 그룹에 떠밀었다가 「관련 모듈」로 옮겼다.
  //     자리만 옮겼을 뿐 «갈 곳이 없다» 는 원인은 그대로였다.)
  // → 허브 보유와 **무관하게** group 으로 나눠 부서 그룹을 만든다. 허브가 있으면
  //   WorkspaceNavGroup(허브 링크 포함), 없으면 순수 접이식 그룹으로 렌더한다.
  /** 소속 부서: 「내 부서 ↔ 연계 부서」 판정 축(접근권과 다르다). */
  const myDeptGroups = sidebarGroups?.myDeptGroups ?? [];
  const DEPT_META: Array<{
    group: NavGroup;
    label: string;
    icon: IconType;
    hub: SidebarMenuId;
    hubHref: string;
  }> = [
    { group: 'rnd', label: 'R&D', icon: Lightbulb, hub: 'research', hubHref: '/research' },
    { group: 'ra', label: 'RA', icon: ShieldCheck, hub: 'ra-workspace', hubHref: '/ra' },
    { group: 'qms', label: 'QA', icon: ClipboardCheck, hub: 'qa-workspace', hubHref: '/qa' },
    { group: 'production', label: '생산', icon: HardHat, hub: 'field-mode', hubHref: '/m' },
  ];
  // 🔑 2026-10-21 오빠 지적: 「대표 계정에서 R&D 를 누르면 메뉴 온오프밖에 안 된다」.
  //    대표는 네 부서 화면에 모두 들어가는데(운영 실측) 경영진 번들에는 허브 메뉴가 없어
  //    (exec-sidebar-contract) 연계 부서 이름이 펼침 단추로만 동작했다. «들어갈 수는 있는데 가는 길이 없는» 형태다.
  //    이제 연계 부서 이름은 «그 허브 화면에 들어갈 수 있으면» 허브 링크다. 판정은 화면의 문지기와 같은 규칙
  //    (lib/permissions/hub-entry → 레이아웃이 enterableHubs 로 넘김). 화살표는 펼치기만 한다. 번들은 그대로.
  const hubOpen = new Set<SidebarMenuId>(enterableHubs);
  /** 허브가 없어 갈 곳이 없던 모듈들을 부서별로 묶은 것. 비어 있는 부서는 빠진다. */
  const leftoverByDept = DEPT_META.map((d) => ({
    ...d,
    modules: leftoverModules.filter((m) => NAV_ITEMS[m]?.group === d.group),
  })).filter((d) => d.modules.length > 0);
  // 워크스페이스 2개까지는 기본 펼침(내 도구 바로 보임): 멀티롤 QA Lead 등이
  // "메뉴가 비었다"고 느끼지 않게. 3개+면 접힘(사이드바 과길이 방지).
  const wsDefaultOpen = presentWorkspaces.length <= 2;
  // 화면 검토 A75 · 2026-09-27: 묶음이 품은 경로. 지금 화면이 그 아래면 접힌 묶음도 펼친다(CollapsibleNavGroup).
  const hrefsOf = (ids: readonly SidebarMenuId[]): string[] =>
    ids.map((m) => NAV_ITEMS[m]?.href).filter((h): h is string => !!h);
  const WORK_HREFS = ['/assessments', '/products', '/experts', '/audit', '/settings/compliance'] as const;
  const COMMON_HREFS = ['/inbox', '/messages', '/calendar'] as const;

  return (
    <aside
      data-coachmark="sidebar"
      className="qa-sidebar-aside"
      style={{
        width: isMobile ? "var(--qd-atelier-width-973b02d046)" : width,
        background: T.surface,
        borderRight: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}`,
        padding: isMobile || !collapsed ? "var(--qd-atelier-padding-6655ed15d7)" : "var(--qd-atelier-padding-20c4134aae)",
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        // 데스크탑은 sticky 로 main scroll 동기. 모바일 drawer 는 부모 wrapper 가
        // 이미 position:fixed 라 여기선 relative 유지.
        position: isMobile ? 'relative' : 'sticky',
        top: "var(--qd-atelier-top-13ae86191f)",
        // 100dvh: iOS Safari 의 동적 URL bar 변화에 대응. 100vh 는 처음 한 번
        // 만 측정해 키보드/URL bar 변화 시 잘림 발생. dvh 는 실제 가시 영역.
        // L2: maxHeight: 100vh 제거 (dvh > vh 일 때 dvh 효과 무력화 방지).
        height: "var(--qd-atelier-height-8ce6d713d7)",
        transition: isMobile
          ? undefined
          : "var(--qd-atelier-transition-f7c7537b7b)",
        // M-16 (2026-09-03): 데스크톱은 aside 가 아니라 **nav 만** 스크롤합니다. 종전엔 aside 전체가
        // 스크롤이라 768~1000px 높이에서 로고·버전·테마 행이 함께 밀려 올라가 «푸터가 없는» 것처럼
        // 보였고, 활성 메뉴가 화면 밖에 있으면 어디에 있는지 알 수 없었습니다.
        // 모바일 drawer 는 종전대로 aside 가 스크롤합니다(nav 안에 또 스크롤을 두면 중첩 스크롤).
        overflowY: isMobile ? 'auto' : 'hidden',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Logo: flexShrink:0. 클릭 시 홈(/dashboard) 이동.
          접힘 상태: Q 글리프(LogoMark) 만: PNG object-fit:contain 으로 좁은 폭에
          맞게 정상 축소(이전 crop 문제 해소). 펼침 상태: 워드마크 + 조직명. */}
      {collapsed && !isMobile ? (
        <Link
          href="/dashboard"
          aria-label="홈으로"
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: QDScale.space[3.5],
            flexShrink: 0,
          }}
        >
          <LogoMark size={QDPresentation.logoSize[36]} />
        </Link>
      ) : (
        <Link
          href="/dashboard"
          aria-label="홈으로"
          // qa-sidebar-logo: 높이 820 이하 화면에서 로고를 줄인다(globals.css · 오너 결정 2026-09-27)
          className="qa-sidebar-logo"
          style={{
            marginBottom: QDScale.space[5.5],
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            textDecoration: QDText.textDecoration.v30a0924a33,
          }}
        >
          <Logo size={QDPresentation.logoSize[108]} style={{ display: 'block' }} />
          <div
            style={{
              fontSize: QDScale.font[12],
              color: isExpert ? T.champagne : T.muted,
              fontFamily: QDScale.family.mono,
              // 2026-09-09: 한글 조직명이 «메 드 크 래 프 트» 로 벌어지던 자리
              // 2026-09-28: 등록한 표기 그대로 둔다(«Demo co.» 가 «DEMO CO.» 로 바뀌어 보였다 · 오너 결정 · 화면 검토 A64)
              letterSpacing: labelTracking(isExpert ? '외부 자문 전문가' : orgName, QDText.tracking.vf3e360d899),
              wordSpacing: labelWordSpacing(isExpert ? '외부 자문 전문가' : orgName),
              textTransform: QDText.textTransform.v30a0924a33,
              marginTop: QDScale.space[1.5],
              wordBreak: 'break-all',
              textAlign: 'center',
            }}
          >
            {isExpert ? '외부 자문 전문가' : orgName}
          </div>
        </Link>
      )}

      {/* Nav: 데스크톱은 여기만 스크롤(로고·푸터 고정, M-16). 모바일 drawer 는 aside 가 스크롤하므로
            nav 는 자체 overflow 를 두지 않습니다(중첩 scroll container 는 바깥을 만질 때 안쪽이 잡힘). */}
      <nav
        ref={navRef}
        // 이름표가 없으면 낭독기가 「탐색」 이라고만 읽는다. 이 화면에는 nav 가
        // 둘 이상인 곳이 있어 어느 것인지 못 고른다 (2026-09-09 감사 · 세 제품에서
        // 잰 28개가 전부 이름이 없었다).
        aria-label="주 메뉴"
        style={{
          flex: isMobile ? "var(--qd-atelier-flex-824afcc06b)" : "var(--qd-atelier-flex-7fff97ee23)",
          minHeight: "var(--qd-atelier-min-height-558c2060a3)",
          overflowY: isMobile ? 'visible' : 'auto',
          overflowX: 'hidden',
          // 🔴 폰 서랍에서는 contain 을 걸지 않는다. overflowX 가 hidden 이면 브라우저가 overflowY 의 visible 을
          // auto 로 바꿔 nav 가 «스크롤할 게 없는 스크롤 칸» 이 되고, contain 이 손가락 스크롤을 aside 로 넘기지 않아
          // 서랍이 한 칸도 안 움직였다(2026-09-28 오너 보고 «앱에서 메뉴 터치 스크롤이 안 된다» · 터치 끌기로 재현)
          overscrollBehavior: isMobile ? 'auto' : 'contain',
          display: 'flex',
          flexDirection: 'column',
          gap: collapsed && !isMobile ? "var(--qd-atelier-gap-dfec023665)" : "var(--qd-atelier-gap-04675ee191)",
        }}
      >
        {isExpert ? (
          <>
            {/* Expert (외부 자문 전문가): 단순 메뉴 */}
            <NavLink href="/inbox" label="검토함" icon={Mail} collapsed={collapsed && !isMobile} badge={pendingAssignments > 0 ? pendingAssignments : undefined} />
            <NavLink href="/settings" label="내 프로필" icon={UserIcon} collapsed={collapsed && !isMobile} />
          </>
        ) : sidebarGroups?.isMultiRole ? (
          <>
            {/* ── Multi-Role 2계층: 권한별 헤더 + workspace 메뉴 + 공통 섹션 ── */}
            <NavLink href="/dashboard" label="홈" icon={LayoutDashboard} collapsed={collapsedNav} />

            {/* 각 권한 그룹: 헤더 + 해당 권한의 workspace 메뉴 */}
            {sidebarGroups.roleGroups.map((group) => (
              <div key={group.role} style={{ display: 'contents' }}>
                <SectionHeader label={group.label} collapsed={collapsedNav} />
                {group.menus.map((m) => {
                  const g = WS_GROUP[m];
                  const mods = workspaceModules[m] ?? [];
                  const meta = NAV_ITEMS[m];
                  if (g && meta && mods.length > 0) {
                    return (
                      <WorkspaceNavGroup key={m} hubHref={meta.href} label={meta.label} icon={meta.icon} modules={mods} collapsed={collapsedNav} defaultOpen={false} renderModule={renderWorkspaceLink} />
                    );
                  }
                  return renderWorkspaceLink(m);
                })}
              </div>
            ))}

            {/* 허브가 없어 갈 곳이 없던 도메인 모듈: 「관련 모듈」이라는 한 통에 쏟지 않고
                **부서별로 나눠** 보여 준다(2026-08-21). 이름이 있어야 찾을 수 있다. */}
            {leftoverByDept.length > 0 && (
              <CollapsibleNavGroup label="연계 부서" groupKey="multi-linked-depts" collapsed={collapsedNav} defaultOpen={false} activeHrefs={[...leftoverByDept.filter((d) => hubOpen.has(d.hub)).map((d) => d.hubHref), ...hrefsOf(leftoverByDept.flatMap((d) => d.modules))]}>
                {leftoverByDept.map((d) => (
                  <WorkspaceNavGroup
                    key={d.group}
                    hubHref={hubOpen.has(d.hub) ? d.hubHref : undefined}
                    label={d.label}
                    icon={d.icon}
                    modules={d.modules}
                    collapsed={collapsedNav}
                    defaultOpen={false}
                    renderModule={renderWorkspaceLink}
                  />
                ))}
              </CollapsibleNavGroup>
            )}

            {/* ── 업무 그룹: 부서에 따라 갈리는 업무 도구 (2026-08-21 신설) ──
                「공통」에 섞여 있던 것들을 여기로 내렸다. 생산 직무는 이 넷을 쓰지 않는다.
                제품은 menuSet(번들)로 판정: 하드코딩 노출이 번들과 어긋나던 것을 맞춘다. */}
            <CollapsibleNavGroup label="업무" groupKey="multi-work" collapsed={collapsedNav} defaultOpen={true} activeHrefs={WORK_HREFS}>
              {canSeeAssessments && (
                <NavLink href="/assessments" label="변경평가" icon={ClipboardList} collapsed={collapsedNav} />
              )}
              {menuSet.has('products') && (
                <NavLink href="/products" label="제품" icon={Package} collapsed={collapsedNav} />
              )}
              {/* 🔴 조건이 canSeeAudit 이었다. /experts 페이지는 owner 만 통과시키므로
                  RA·QA 에게 «메뉴는 보이는데 눌렀더니 튕김» 이 나고 있었다(2026-08-21 감사).
                  단일롤 사이드바는 이미 owner 조건이었다. 두 경로가 갈려 있던 것. */}
              {isOrgOwner(role) && (
                <NavLink href="/experts" label="외부 전문가" icon={Users} collapsed={collapsedNav} />
              )}
              {canSeeAudit && (
                <NavLink href="/audit" label="감사 로그" icon={ScrollText} collapsed={collapsedNav} />
              )}
              {/* 적합성 점검은 자주 쓰는 점검이라 «설정» 이 아니라 «업무» 에 둔다(화면 검토 A75 · 오너 결정 2026-09-28) */}
              {canSeeCompliance && (
                <NavLink href="/settings/compliance" label="적합성 점검" icon={ClipboardCheck} collapsed={collapsedNav} />
              )}
            </CollapsibleNavGroup>

            {/* ── 공통 그룹: **모든 부서가 접근 가능한 것만** (오빠 기준, 2026-08-21) ──
                판정은 전부 menuSet(번들)로 한다. 조건 없이 렌더하면 번들에 없는 직무에게도
                보여 「공통」의 정의가 무너진다. 실제로 그렇게 어긋나 있었다. */}
            <CollapsibleNavGroup label="공통" groupKey="multi-common" collapsed={collapsedNav} defaultOpen={true} activeHrefs={COMMON_HREFS}>
              {menuSet.has('inbox') && (
                <NavLink
                  href="/inbox"
                  label="검토함"
                  icon={Mail}
                  collapsed={collapsedNav}
                  badge={pendingAssignments > 0 ? pendingAssignments : undefined}
                />
              )}
              {menuSet.has('messages') && (
                <NavLink
                  href="/messages"
                  label="메시지"
                  icon={MessageSquare}
                  collapsed={collapsedNav}
                  badge={unreadMessages > 0 ? unreadMessages : undefined}
                />
              )}
              {menuSet.has('calendar') && (
                <NavLink href="/calendar" label="회의 일정" icon={CalendarIcon} collapsed={collapsedNav} />
              )}
              {/* 교육은 2026-08-21 오빠 지시로 **품질(QA) 밑**으로 옮겼다. nav-items 의
                  group 을 `qms`·subGroup `resource` 로 바꿨으므로 부서 그룹이 자동으로
                  담는다. 여기서 하드코딩할 필요가 없어졌다. */}
            </CollapsibleNavGroup>

            {/* 설정 그룹: 온보딩 중 기본 접힘 */}
            <CollapsibleNavGroup label="설정" groupKey="multi-settings" collapsed={collapsedNav} defaultOpen={!isOnboarding} activeHrefs={['/settings']}>
              {isOrgOwner(role) && (
                <NavLink href="/settings/members" label="멤버 관리" icon={Users} collapsed={collapsedNav} />
              )}
              <NavLink href="/settings" label="설정" icon={SettingsIcon} collapsed={collapsedNav} />
            </CollapsibleNavGroup>
          </>
        ) : (
          <>
            {/* ── 홈 (항상 고정) ── */}
            <NavLink href="/dashboard" label="홈" icon={LayoutDashboard} collapsed={collapsedNav} />

            {/* QMS 문서: 오너/경영진 전용 직접 진입점.
                실무자에게는 바로 아래 「워크스페이스 > QA」 안에 같은 메뉴가 뜨므로
                중복을 피해 isOwnerExec 일 때만 노출한다.
                (오너/경영진은 워크스페이스 그룹이 통째로 숨겨지는데 exec 번들엔
                 qa-workspace 가 없어 workspaceModules·leftoverModules 대체 경로까지
                 비었다 → 사이드바에서 품질문서로 가는 길이 아예 없어 URL 직접입력이나
                 심사 준비도 링크에 의존하던 것을 복구. ISO 13485 §4.2 는 최고경영자
                 책임이라 오너 동선이 가장 짧아야 한다.) */}
            {/* 🔴 2026-08-30: 부서 그룹이 경영진에게도 열리면서 이 링크가 «중복» 이 됐다
                (qms-documents 는 group:'qms' 라 연계 부서 > QA 안에도 들어간다).
                다만 **직무가 없는 오너**는 menuSet 이 비어 그룹이 안 생기므로 이 단축
                링크가 유일한 길이다. 그래서 「그룹이 못 그릴 때만」 남긴다.
                (ISO 13485 §4.2 는 최고경영자 책임이라 오너 동선이 짧아야 한다는
                 원래 취지는 그대로다.) */}
            {isOwnerExec && !menuSet.has('qms-documents') && (
              <NavLink href="/qms-documents" label="QMS 문서" icon={BookText} collapsed={collapsedNav} />
            )}

            {/* ── 워크스페이스 그룹 (실무자 전용) ── */}
            {/* ⚠️ 조건에서 canSeeAssessments 를 뺐다(2026-08-21): 변경평가가 「공통」으로
                옮겨갔으므로, 남겨 두면 **부서 워크스페이스가 하나도 없는 사용자에게 빈
                그룹**이 열린다. 그룹 조건은 그 안에 실제로 렌더될 것과 같아야 한다. */}
            {/* 🔴 2026-08-21: 「관련 모듈」을 없애고 **부서를 DEPT_META 로 한 번에 순회**한다.
                종전에는 부서 그룹이 «허브 메뉴 보유» 로만 생겨서, RA 처럼 QMS 모듈을 여럿
                가진 직무는 담을 그릇이 없어 12개가 「관련 모듈」 한 통에 쏟아졌다
                (오빠 지적: 「메뉴가 지금 짬뽕되어있어… 어째서 정돈이 전혀 안돼어있지」).
                이제 허브가 있으면 허브 링크가 붙은 그룹으로, 없으면 순수 접이식 그룹으로
                렌더한다. 순회 순서가 곧 화면 순서라 R&D·RA·QA·생산이 **항상 같은 자리**다. */}
            {/* 🔴 2026-08-30: 조건에 `!isOwnerExec` 가 있어 **경영진·오너에게는 이 그룹이
                통째로 숨겨졌다.** 그래서 exec 번들의 도메인 메뉴 24개가 갈 자리가 없었다.
                오빠 결정(「exec 는 관리자라 볼 수는 있어야 한다」)을 번들에만 반영하면
                아무 일도 일어나지 않는다: 그리는 쪽이 안 보고 있었기 때문이다.
                🔑 그룹은 «담을 것이 있을 때만» 나타난다(depts.length === 0 이면 null).
                   직무가 없는 오너는 menuSet 이 비어 있어 종전과 똑같다.
                   경영진은 자기 부서가 없으므로 네 부서가 전부 「연계 부서」로 접혀 붙는다. */}
            {!isMedqraftAdmin && (
              (() => {
                // 🔴 2026-08-21(2): 「내 부서」 판정을 **허브 보유 → 소속**으로 바꾼다.
                //   오빠 지적: 「요렇게 2개는 QA 에서도 연계부서로서 메뉴가 뜨나??」
                //   그랬다. QA 는 수입검사(IQC)를 하러 현장 모드(/m)를 가질 뿐인데,
                //   허브를 가졌다는 이유로 「워크스페이스 › 생산」이 자기 부서처럼 떴다.
                //   **접근권과 소속은 다른 축**이다. 판정은 ROLE_DEPT_GROUP 이 한다.
                //   연계로 내려가도 허브 자체는 «메뉴 한 줄» 로 남겨 접근을 잃지 않게 한다
                //   (QA 가 /m 을 못 열면 수입검사가 통째로 막힌다).
                const depts = DEPT_META.map((d) => {
                  const hasHubMenu = menuSet.has(d.hub);
                  const mineDept = isMyDept(d.group, hasHubMenu, myDeptGroups);
                  const mods = hasHubMenu
                    ? workspaceModules[d.hub] ?? []
                    : leftoverModules.filter((m) => NAV_ITEMS[m]?.group === d.group);
                  // 들어갈 수 있는 허브는 연계 부서 이름이 곧 허브 링크라 모듈 줄로 한 번 더 넣지 않는다.
                  // 🔑 부서가 «새로» 생기지는 않는다: 종전에 허브 한 줄만 담던 부서(품질의 생산 · /m)가 남을 뿐이다.
                  const hubAsLabel = hubOpen.has(d.hub);
                  return {
                    ...d,
                    mineDept,
                    hubAsLabel,
                    keepForHub: hasHubMenu && hubAsLabel,
                    modules: mineDept || !hasHubMenu || hubAsLabel ? mods : [d.hub, ...mods],
                  };
                }).filter((d) => d.mineDept || d.modules.length > 0 || d.keepForHub);
                if (depts.length === 0) return null;
                // ★ 소속을 그룹으로 가른다(2026-08-21, 오빠 지적: 「이 계정 QA 권한이
                //   없는 계정 아니야?」). 허브 보유 = **내 부서**, 모듈만 있음 = **연계**.
                //   둘을 한 그룹에 섞으면 RA 사용자에게 「QA」가 자기 부서처럼 읽힌다:
                //   실제로는 /qa 허브에 들어가지도 못한다(「권한 부족」 안내가 뜬다).
                //   RA 가 QMS 모듈을 보는 이유는 소속이 아니라 **당국 보고(§8.2.3) 판단**
                //   때문이므로, 「연계」가 그 관계를 정확히 말해 준다.
                const mine = depts.filter((d) => d.mineDept);
                const linked = depts.filter((d) => !d.mineDept);
                return (
                  <>
                    {mine.length > 0 && (
                      <CollapsibleNavGroup label="워크스페이스" groupKey="workspace" collapsed={collapsedNav} defaultOpen={true} activeHrefs={[...mine.map((d) => d.hubHref), ...hrefsOf(mine.flatMap((d) => d.modules))]}>
                        {mine.map((d) => (
                          <WorkspaceNavGroup
                            key={d.group}
                            hubHref={d.hubHref}
                            label={d.label}
                            icon={d.icon}
                            modules={d.modules}
                            collapsed={collapsedNav}
                            defaultOpen={wsDefaultOpen}
                            renderModule={renderWorkspaceLink}
                          />
                        ))}
                      </CollapsibleNavGroup>
                    )}
                    {linked.length > 0 && (
                      /* 연계 부서: 내 부서는 아니지만 접근 권한이 있는 도메인.
                         라벨이 링크가 아니라 표제인 이유가 여기 있다(허브에 못 들어간다).
                         단, 그 허브에 들어갈 수 있으면(대표 · 경영진 등) 라벨이 허브 링크다(위 hubOpen).
                         기본 접힘: 내 부서보다 뒤에 있고 자주 쓰지 않는다. */
                      <CollapsibleNavGroup label="연계 부서" groupKey="linked-depts" collapsed={collapsedNav} defaultOpen={false} activeHrefs={[...linked.filter((d) => d.hubAsLabel).map((d) => d.hubHref), ...hrefsOf(linked.flatMap((d) => d.modules))]}>
                        {linked.map((d) => (
                          <WorkspaceNavGroup
                            key={d.group}
                            hubHref={d.hubAsLabel ? d.hubHref : undefined}
                            label={d.label}
                            icon={d.icon}
                            modules={d.modules}
                            collapsed={collapsedNav}
                            defaultOpen={false}
                            renderModule={renderWorkspaceLink}
                          />
                        ))}
                      </CollapsibleNavGroup>
                    )}
                  </>
                );
              })()
            )}

            {/* ── 업무 그룹: 부서에 따라 갈리는 업무 도구 (2026-08-21 신설) ──
                멀티롤 경로의 같은 이름 그룹과 **구성·조건을 일치**시킨다. */}
            {!isMedqraftAdmin && (
              <CollapsibleNavGroup label="업무" groupKey="work" collapsed={collapsedNav} defaultOpen={true} activeHrefs={WORK_HREFS}>
                {canSeeAssessments && (
                  <NavLink href="/assessments" label="변경평가" icon={ClipboardList} collapsed={collapsedNav} />
                )}
                {menuSet.has('products') && (
                  <NavLink href="/products" label="제품" icon={Package} collapsed={collapsedNav} />
                )}
                {/* 외부 전문가 풀 = owner 전용 통계 화면(/experts 가 owner 아니면 튕긴다).
                    페이지 권한과 메뉴 노출을 일치시켜 빈 화면을 막는다. (R&D/RA/QA·Lead 의
                    자문 '의뢰'는 서류·평가 상세의 "외부 자문 요청" 버튼으로 한다)
                    🔴 2026-10-21: 조건에 `!isOwnerExec` 가 있었다. 소유자는 전부 isOwnerExec(billing.manage)라
                    이 줄은 «아무에게도» 그려지지 않았고, 겸직 경로만 그렸다. 오빠 결정: 모든 소유자에게 보인다. */}
                {isOrgOwner(role) && (
                  <NavLink href="/experts" label="외부 전문가" icon={Users} collapsed={collapsedNav} />
                )}
                {canSeeAudit && (
                  <NavLink href="/audit" label="감사 로그" icon={ScrollText} collapsed={collapsedNav} />
                )}
                {/* 적합성 점검은 자주 쓰는 점검이라 «설정» 이 아니라 «업무» 에 둔다(화면 검토 A75 · 오너 결정 2026-09-28) */}
                {canSeeCompliance && (
                  <NavLink href="/settings/compliance" label="적합성 점검" icon={ClipboardCheck} collapsed={collapsedNav} />
                )}
              </CollapsibleNavGroup>
            )}

            {/* ── 공통 그룹: **모든 부서가 접근 가능한 것만** (오빠 기준, 2026-08-21) ──
                판정은 전부 menuSet(번들)로 한다. 조건 없이 렌더하면 번들에 없는 직무에게도
                보여 「공통」의 정의가 무너진다. 실제로 그렇게 어긋나 있었다. */}
            {!isMedqraftAdmin && (
              <CollapsibleNavGroup label="공통" groupKey="common" collapsed={collapsedNav} defaultOpen={true} activeHrefs={COMMON_HREFS}>
                {menuSet.has('inbox') && (
                  <NavLink
                    href="/inbox"
                    label="검토함"
                    icon={Mail}
                    collapsed={collapsedNav}
                    badge={pendingAssignments > 0 ? pendingAssignments : undefined}
                  />
                )}
                {menuSet.has('messages') && (
                  <NavLink
                    href="/messages"
                    label="메시지"
                    icon={MessageSquare}
                    collapsed={collapsedNav}
                    badge={unreadMessages > 0 ? unreadMessages : undefined}
                  />
                )}
                {menuSet.has('calendar') && (
                  <NavLink href="/calendar" label="회의 일정" icon={CalendarIcon} collapsed={collapsedNav} />
                )}
                {/* 교육은 2026-08-21 오빠 지시로 **품질(QA) 밑**으로 옮겼다. nav-items 의
                    group 을 `qms`·subGroup `resource` 로 바꿔 부서 그룹이 자동으로 담는다. */}
              </CollapsibleNavGroup>
            )}

            {/* ── MedQraft Admin 도구 (cross-org) ─────────────────────
              4개의 의미적 허브로 통합. 각 허브는 첫 sub-tab 으로 진입하고,
              페이지 상단의 AdminHubTabs 로 형제 페이지를 이동.

                판단 엔진 교육   : 가르치기(Q-Match 학습·라벨 퀴즈·지식 베이스) → 보정하기 → 확인하기
                사용자·전문가   : 계정 관리 / 전문가 인증 / 전문가 초대
                운영             : 고객사 현황 / 구독 관리 / 활동 통계 / 멀티 계정 뷰
                기본 양식함      : 단독
            ──────────────────────────────────────────────────────────── */}
            {/* 2026-09-13: 운영자가 일하는 순서. 운영 홈(대기열) → 고객사 · 계정 → 판단 엔진 교육 → 시스템 · 도구.
                라벨 · 경로는 lib/nav/nav-items.ts 의 admin-* 와 같아야 한다(시뮬레이터 계약이 그쪽을 본다). */}
            {isMedqraftAdmin && (
              <NavLink
                href="/admin"
                label="운영 홈"
                icon={Building2}
                collapsed={collapsedNav}
                forceActive={pathname === '/admin'}
              />
            )}
            {isMedqraftAdmin && (
              <NavLink
                href="/admin/screening"
                label="고객사 · 계정"
                icon={UserCheck}
                collapsed={collapsedNav}
                forceActive={activeAdminHub === 'customers'}
              />
            )}
            {isMedqraftAdmin && (
              <NavLink
                href="/admin/q-match-training"
                label="판단 엔진 교육"
                icon={Sparkles}
                collapsed={collapsedNav}
                forceActive={activeAdminHub === 'ai'}
              />
            )}
            {isMedqraftAdmin && (
              <NavLink
                href="/admin/default-templates"
                label="시스템 · 도구"
                icon={ClipboardCheck}
                collapsed={collapsedNav}
                forceActive={activeAdminHub === 'system'}
              />
            )}

            {/* ── 설정 그룹: 온보딩 중 기본 접힘, 졸업 후 펼침 ── */}
            {!isMedqraftAdmin && (
              <CollapsibleNavGroup label="설정" groupKey="settings" collapsed={collapsedNav} defaultOpen={!isOnboarding} activeHrefs={['/glossary', '/settings']}>
                {/* 용어집: 2026-08-21 오빠 지시로 최상위 단독에서 이 그룹 안으로 옮겼다
                    (「덩그러니 나와 있는 메뉴는 홈 하나면 충분」). 조건부 항목들보다 위에
                    두는 이유: 아래 셋은 권한·역할에 따라 사라지지만 이것은 전 사용자에게
                    보이므로, 그룹을 열었을 때 항상 첫 줄이 있게 된다.
                    ⚠️ **지금 이것이 용어집의 유일한 진입점이다**: AIQuickAccessFab(용어집
                    탭을 품은 전역 FAB)이 layout.tsx 에서 주석 상태다. 온보딩 중에는 이
                    그룹이 기본 접힘이라 신규 사용자는 한 번 펼쳐야 닿는다. 본문 용어는
                    GlossaryTooltip 이 인라인으로 설명하므로 «뜻을 못 보는» 상태는 아니다.
                    FAB 을 되살리면 이 제약은 함께 풀린다. */}
                <NavLink href="/glossary" label="용어집" icon={BookOpen} collapsed={collapsedNav} />
                {isOwnerExec && (
                  <NavLink href="/settings/usage" label="사용량 · 결제" icon={GaugeIcon} collapsed={collapsedNav} />
                )}
                {isOrgOwner(role) && (
                  <NavLink href="/settings/members" label="멤버 관리" icon={Users} collapsed={collapsedNav} />
                )}
                <NavLink href="/settings" label="설정" icon={SettingsIcon} collapsed={collapsedNav} />
              </CollapsibleNavGroup>
            )}

            {/* MedQraft Admin 은 설정 그룹 대신 단독 설정 메뉴 (기존 고정 동작 보존).
                운영 계정은 메뉴가 전부 단독 나열이라 용어집도 여기서는 단독으로 둔다:
                그룹이 없는 화면에서 이것만 그룹에 넣을 수는 없다. */}
            {isMedqraftAdmin && (
              <>
                <NavLink href="/glossary" label="용어집" icon={BookOpen} collapsed={collapsedNav} />
                <NavLink href="/settings" label="설정" icon={SettingsIcon} collapsed={collapsedNav} />
              </>
            )}
          </>
        )}
      </nav>

      {/* Rule Engine 버전 + Q-Atelier 앱 버전: 사이드바 하단 (Theme/접기 행 위).
          flexShrink:0 으로 줄어들지 않게.
          ★ 디자인 통일: RuleEngineBadge 의 'left brand / right version' 레이아웃을
            동일 패턴으로 Q-Atelier 에도 적용. fontSize / letterSpacing / color tone 정렬. */}
      {/* qa-sidebar-versions: 높이 820 이하 화면에서는 접는다(globals.css · 오너 결정 2026-09-27 「낮은 화면만 줄이기」) */}
      <div className="qa-sidebar-versions" style={{ flexShrink: 0 }}>
        <RuleEngineBadge variant="sidebar" compact={collapsed && !isMobile} />
        {!(collapsed && !isMobile) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: "var(--qd-atelier-padding-10130e168f)",
              fontSize: QDScale.font[12],
              color: T.muted,
              fontFamily: QDScale.family.mono,
              letterSpacing: "var(--qd-atelier-letter-spacing-6fc355123f)",
            }}
            title={`Q-Atelier ${APP_VERSION_LABEL}`}
          >
            <span style={{ textTransform: QDText.textTransform.v642d85873e }}>Q-Atelier</span>
            <span style={{ color: T.champagne }}>{APP_VERSION_LABEL}</span>
          </div>
        )}
      </div>

      {/* Theme + Collapse 행 (한 줄에 묶기): flexShrink:0 으로 줄어들지 않게. */}
      {collapsed && !isMobile ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: QDScale.space[1.5],
            marginTop: QDScale.space[3],
            marginBottom: QDScale.space[3],
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <IconBtn
            onClick={toggleTheme}
            title={`Theme: ${mode === 'system' ? `System (${theme})` : mode === 'dark' ? 'Dark' : 'Light'}: 클릭하여 순환`}
            style={RAIL_ICON_BTN}
          >
            <span style={{ color: T.champagne, fontFamily: QDScale.family.serif, fontWeight: "var(--qd-font-weight-semibold)", fontSize: QDScale.font[16], lineHeight: QDScale.leading.none }}>
              {mode === 'system' ? <Monitor size={QDPresentation.iconSize[16]} /> : mode === 'dark' ? <Moon size={QDPresentation.iconSize[16]} /> : <Sun size={QDPresentation.iconSize[16]} />}
            </span>
          </IconBtn>
          <IconBtn onClick={onToggle} title="사이드바 펼치기" style={RAIL_ICON_BTN}>
            <ChevronIcon dir="right" />
          </IconBtn>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: QDScale.space[1.5], marginTop: QDScale.space[3], marginBottom: QDScale.space[3], alignItems: 'stretch', flexShrink: 0 }}>
          <button
            type="button"
            onClick={toggleTheme}
            className="qa-nav-item"
            title={`화면 테마: ${mode === 'system' ? `System (현재 ${theme === 'dark' ? 'Dark' : 'Light'})` : mode === 'dark' ? 'Dark' : 'Light'}. 누를 때마다 Dark → Light → System 순서로 바뀝니다.`}
            style={{
              flex: "var(--qd-atelier-flex-83725d2c6e)",
              background: 'transparent',
              border: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}`,
              borderRadius: QDScale.radius, // 2026-09-14 오빠 결정: 발치 상자도 굴린다. 정본(extract-nav)이 이 값을 읽는다
              color: T.subtle,
              fontSize: QDScale.font[12],
              fontFamily: QDScale.family.mono,
              letterSpacing: "var(--qd-atelier-letter-spacing-2cfff841a4)",
              textTransform: QDText.textTransform.v642d85873e,
              padding: "var(--qd-atelier-padding-961915113e)",
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: "var(--qd-atelier-transition-903f6a1058)",
            }}
          >
            <span style={{ whiteSpace: 'nowrap' }}>Theme</span>
            <span style={{ color: T.champagne, fontWeight: "var(--qd-font-weight-medium)", whiteSpace: 'nowrap' }}>
              {mode === 'system' ? <Monitor size={QDPresentation.iconSize[16]} /> : mode === 'dark' ? <Moon size={QDPresentation.iconSize[16]} /> : <Sun size={QDPresentation.iconSize[16]} />}{' '}
              {mode === 'system' ? 'System' : mode === 'dark' ? 'Dark' : 'Light'}
            </span>
          </button>
          <IconBtn onClick={onToggle} title={isMobile ? '사이드바 닫기' : '사이드바 접기'} style={RAIL_ICON_BTN}>
            <ChevronIcon dir="left" />
          </IconBtn>
        </div>
      )}

      {/* Footer (avatar + logout): flexShrink:0 (잘림 방지) */}
      <div style={{ paddingTop: QDScale.space[3], borderTop: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}`, flexShrink: 0 }}>
        {collapsed && !isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: QDScale.space[2.5] }}>
            <Avatar name={userName} email={userEmail} size={QDPresentation.avatarSize[34]} userId={userId} avatarVersion={avatarVersion} />
            <LogoutButton compact />
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: QDScale.space[2.5], marginBottom: QDScale.space[3] }}>
              <Avatar name={userName} email={userEmail} size={QDPresentation.avatarSize[32]} userId={userId} avatarVersion={avatarVersion} />
              <div style={{ minWidth: "var(--qd-atelier-min-width-f24a3b2189)", flex: "var(--qd-atelier-flex-83725d2c6e)" }}>
                <p
                  style={{
                    margin: "var(--qd-space-0)",
                    fontSize: QDScale.font[13],
                    color: T.text,
                    fontWeight: "var(--qd-font-weight-medium)",
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: QDScale.leading.heading,
                  }}
                  title={userName || userEmail}
                >
                  {userName || userEmail.split('@')[0]}
                </p>
                <p
                  style={{
                    margin: "var(--qd-atelier-margin-a3079d51f3)",
                    fontSize: QDScale.font[12],
                    color: T.muted,
                    fontFamily: QDScale.family.ui,
                    letterSpacing: labelTracking(footMeta, QDText.tracking.vf3e360d899),
                    // 🔴 한글 좁은 띄어쓰기(labelWordSpacing · -0.35em)는 고정폭 글꼴 전용이다. 본문 글꼴에 걸면
                    //    «소유자 · 엔터프라이즈» 가 «소유자엔터프라이즈» 로 겹친다(2026-09-28 운영에서 봄)
                    textTransform: QDText.textTransform.v30a0924a33,
                  }}
                >
                  {footMeta}
                </p>
              </div>
            </div>
            {/* 계정 글귀는 한 줄에 하나씩, 같은 왼쪽 선에(2026-09-28 오너 «위치 정돈»: 두 글귀가 한 줄에 붙어 있었다).
                좁은 화면(폰 · 더보기 서랍)에는 설정이 안내 뒤라 지문 등록 칸으로 곧장 가는 글귀가 로그아웃 위에 선다. */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              {isMobile && <PasskeyDrawerLink onNavigate={onToggle} />}
              <LogoutButton />
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

// 모든 사이드바 항목 href: NavLink 가 longest-prefix-match 로 active 결정.
// /settings 와 /settings/compliance 가 둘 다 active 되는 버그 방지.
// 화면 검토 A75 · 2026-09-27: 부서 묶음의 모듈 경로(NAV_ITEMS)도 함께 센다. 손으로 적은 목록에 없던
//   /research/review 에서는 「R&D」 허브와 「팀 검토」 가 함께 강조됐다. 모듈 경로는 NAV_ITEMS 에서 파생한다.
const FIXED_NAV_HREFS = [
  '/dashboard',
  '/research',
  '/ra',
  '/qa',
  '/assessments',
  '/products',
  '/experts',
  '/inbox',
  '/messages',
  '/notifications',
  '/calendar',
  '/audit',
  '/calibration',
  '/admin/knowledge',
  '/admin/q-match-training',
  '/admin/qmatch-quiz',
  '/admin/default-templates',
  '/admin/users',
  '/admin/experts',
  '/admin/expert-invites',
  '/admin/subscriptions',
  '/admin/billing',
  '/admin/screening',
  '/admin/activity',
  '/admin/multi-view',
  '/admin/vigilance',
  '/admin/permissions-matrix',
  '/settings/compliance',
  '/settings/usage',
  // '/settings/templates' 는 사이드바에 렌더되는 nav 항목이 아니다. ALL_NAV_HREFS 에 있으면
  //  그 페이지에서 부모 '/settings' 의 active 표시가 사라져 현위치를 잃는다(감사 #21). 제외.
  '/settings/members',
  '/settings',
];
const ALL_NAV_HREFS = [
  ...new Set([
    ...FIXED_NAV_HREFS,
    ...Object.values(NAV_ITEMS)
      .map((m) => m.href)
      .filter((h): h is string => !!h),
  ]),
];

/** 지금 경로가 이 경로들 가운데 하나이거나 그 아래인가(묶음을 펼칠지 가른다). */
function containsPath(hrefs: readonly string[] | undefined, pathname: string | null | undefined): boolean {
  if (!pathname || !hrefs) return false;
  return hrefs.some((h) => pathname === h || pathname.startsWith(h + '/'));
}

function isActiveForHref(pathname: string | null | undefined, href: string): boolean {
  if (!pathname) return false;
  // 더 구체적인(긴) href 가 매칭되는 경우 본 href 는 active 가 아님
  const matches = (h: string) => pathname === h || pathname.startsWith(h + '/');
  if (!matches(href)) return false;
  const longerMatching = ALL_NAV_HREFS.find(
    (h) => h !== href && h.startsWith(href + '/') && matches(h),
  );
  return !longerMatching;
}

/**
 * 사이드바 한 줄의 공통 치수. NavLink 와 «허브 없는 부서 헤더» 가 나란히 보이려면
 * 이 값이 같아야 한다. 각자 적으면 한쪽만 바뀌어 그 줄만 어긋난다.
 * (S 스케일에 11 이 없어 raw 로 두되, 출처를 하나로 모아 사본을 만들지 않는다.)
 */
const NAV_ITEM_PADDING = "var(--qd-atelier-padding-42dfea79bd)";

function NavLink({
  href,
  label,
  icon: Icon,
  badge,
  collapsed,
  forceActive,
}: {
  href: string;
  label: string;
  icon: IconType;
  badge?: number;
  collapsed: boolean;
  /** 허브 entry 처럼 현재 경로가 자식 탭에 있어도 active 표시해야 하는 경우 */
  forceActive?: boolean;
}) {
  const pathname = usePathname();
  const active = forceActive ?? isActiveForHref(pathname, href);

  if (collapsed) {
    return (
      <Link
        href={href}
        title={label}
        className={`qa-nav-item${active ? ' active' : ''}`}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: "var(--qd-atelier-height-e85d246b1d)",
          margin: "var(--qd-atelier-margin-93937849d9)",
          color: active ? T.champagne : T.subtle,
          // 접힘 상태: champagne 옅은 사각 + 금빛 아이콘으로 active 강조(2026-09-27 왼쪽 2px 선은 걷었다 · «문서 결»)
          background: active ? `${alpha(T.champagne, QDRuntime.alpha.tint0_1)}` : 'transparent',
          transition: "var(--qd-atelier-transition-4db5304ca2)",
        }}
      >
        {/* Fixed-size SVG icon: same dimensions for every nav item */}
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: "var(--qd-atelier-width-ae5abd2361)",
            height: "var(--qd-atelier-height-eb78790f84)",
            color: active ? T.champagne : T.muted,
          }}
        >
          <Icon size={QDPresentation.iconSize[18]} strokeWidth={1.75} />
        </span>
        {badge !== undefined && (
          <span
            style={{
              position: 'absolute',
              top: "var(--qd-atelier-top-7cdfab3373)",
              right: "var(--qd-atelier-right-d428a85cbe)",
              fontSize: QDScale.font[12],
              color: T.bg,
              background: T.red,
              padding: "var(--qd-atelier-padding-03e93ce316)",
              fontFamily: QDScale.family.mono,
              lineHeight: QDScale.leading.heading,
              fontWeight: "var(--qd-font-weight-bold)",
              minWidth: "var(--qd-atelier-min-width-491600e090)",
              textAlign: 'center',
              borderRadius: QDScale.radiusFull,
              boxShadow: `var(--qd-atelier-avatar-ring-geometry) ${T.surface}`,
            }}
          >
            {badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      key={`${href}-${active ? 'active' : 'idle'}`}  /* active 진입 시 밑줄 remount → 한 번 펼쳐짐 */
      className={`qa-nav-item${active ? ' active' : ''}`}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: QDScale.space[3],
        // 선택 표시(2026-09-27 «문서 결» · Q-Design docs/24): 왼쪽 3px 금색 막대 · 오른쪽 금색 점 대신 굵은 글자 +
        //   글자 밑 짧은 금색 선. 막대가 차지하던 3px 는 왼쪽 여백으로 돌려 글자 자리가 그대로다.
        padding: NAV_ITEM_PADDING,
        paddingLeft: "var(--qd-atelier-padding-left-2da5cadfb6)",
        color: active ? T.text : T.subtle,
        background: active ? T.surface2 : 'transparent',
        fontSize: QDScale.font[14],
        fontFamily: QDScale.family.ui,
        fontWeight: active ? "var(--qd-font-weight-semibold)" : "var(--qd-font-weight-normal)",
        letterSpacing: "var(--qd-atelier-letter-spacing-4a873a4bd2)",
        transition: "var(--qd-atelier-transition-4db5304ca2)",
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: "var(--qd-atelier-width-06f0618ae8)",
          height: "var(--qd-atelier-height-1ca2107b5a)",
          color: active ? T.champagne : T.muted,
          flexShrink: 0,
        }}
      >
        <Icon size={QDPresentation.iconSize[16]} strokeWidth={1.75} />
      </span>
      <span style={{ flex: "var(--qd-atelier-flex-83725d2c6e)", position: 'relative' }}>
        {label}
        {/* 선택 표시: 글자 밑 짧은 금색 선(16px). 진입 시 한 번 펼쳐진다(qa-nav-active-underline) */}
        {active && (
          <span
            aria-hidden
            className="qa-nav-active-underline"
            style={{ position: 'absolute', left: "var(--qd-atelier-left-090a0c84b4)", bottom: "var(--qd-atelier-bottom-0b345d4976)", width: "var(--qd-atelier-width-0f88141c20)", height: "var(--qd-atelier-height-e737496ec6)", borderRadius: "var(--qd-atelier-border-radius-d806be1e94)", background: T.champagne }}
          />
        )}
      </span>
      {badge !== undefined && (
        <span
          style={{
            fontSize: QDScale.font[12],
            color: T.bg,
            background: T.red,
            padding: "var(--qd-atelier-padding-b26b9ada6f)",
            fontFamily: QDScale.family.mono,
            lineHeight: QDScale.leading.heading,
            fontWeight: "var(--qd-font-weight-bold)",
            borderRadius: QDScale.radiusFull,
            minWidth: "var(--qd-atelier-min-width-a8fa375fbf)",
            textAlign: 'center',
          }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

/* ─── Subcomponents ──────────────────────────────────────────── */

// 차림표의 아이콘 정사각(테마 · 접기 · 펼치기)은 공용 IconBtn(lib/design/components)이다(2026-10-07 · 이 파일의 사본을 걷음).
// 옆의 THEME 상자와 같은 줄 · 같은 높이라 모서리만 RADIUS.md 로 맞춘다.
const RAIL_ICON_BTN = { borderRadius: QDScale.radius } as const;

/** Clean chevron SVG (Apple-style hairline). dir: left(<) right(>) up(^) down(v) */
function ChevronIcon({ dir, size = QDPresentation.iconSize[14] }: { dir: 'left' | 'right' | 'up' | 'down'; size?: number }) {
  // 밑그림은 «<»(꼭짓점이 왼쪽)다. 화면 회전은 시계 방향이 +라 꼭짓점을 위로 보내려면 +90 이다.
  // 화면 검토 A75 · 2026-09-27: 'up' · 'down' 이 서로 뒤바뀌어 있었다(이름은 up 인데 v 로 그려졌다).
  //   그래서 호출부가 «펼침 = up» 을 적고 화면에는 v 가 나와 접힌 묶음이 ^ 로 보였다.
  const rotation =
    dir === 'right' ? QDPresentation.visual.rotation.reverse
    : dir === 'up' ? QDPresentation.visual.rotation.quarter
    : dir === 'down' ? QDPresentation.visual.rotation.negativeQuarter
    : undefined;
  return (
    <ChevronLeft size={size} style={{ transform: rotation }} />
  );
}

/**
 * 사이드바 섹션 헤더: Multi-Role 그룹 구분용. 권한 이름 또는 "공통".
 * collapsed 일 때는 점 1px 구분선만 (텍스트 숨김).
 */
function SectionHeader({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) {
    return (
      <div
        aria-hidden
        style={{
          height: "var(--qd-atelier-height-2264278404)",
          background: T.border,
          margin: "var(--qd-atelier-margin-6d71facf62)",
          opacity: "var(--qd-atelier-opacity-fab5edc654)",
        }}
      />
    );
  }
  return (
    <div
      style={{
        padding: "var(--qd-atelier-padding-f5778c8c22)",
        fontSize: QDScale.font[12],
        fontFamily: QDScale.family.mono,
        // 2026-09-09: 여기만 labelTracking 을 안 거치고 있었습니다. 그룹 라벨은
        // 한글(「워크스페이스」·「연계 부서」)인데 1.6px 이 그대로 걸려 «워 크 스
        // 페 이 스» 로 벌어져 있었습니다. 대문자는 한글에 아무 일도 하지 않고,
        // 이 자간은 라틴 글자 사이를 벌리라고 만든 값입니다 (M-02/M-03 과 같은 건).
        // Q-Design 차림표 정본(docs/15)도 이 규칙을 따르므로 세 제품이 같아집니다.
        letterSpacing: labelTracking(label, QDText.tracking.vec6c168f44),
        wordSpacing: labelWordSpacing(label),
        textTransform: labelCase(label),
        color: T.muted,
        userSelect: 'none',
      }}
    >
      {label}
    </div>
  );
}

/**
 * 카테고리별 접기/펼치기 그룹. 온보딩 연동 + localStorage 우선 토글.
 * collapsed=true(아이콘 모드) 시에는 구분선만 렌더하고 children 그대로 표시.
 */
function CollapsibleNavGroup({
  label,
  groupKey,
  collapsed,
  defaultOpen,
  activeHrefs,
  children,
}: {
  label: string;
  groupKey: string;
  collapsed: boolean;
  defaultOpen: boolean;
  /** 이 묶음 안 항목의 경로. 지금 화면이 그 아래면 접혀 있어도 펼친다(화면 검토 A75). */
  activeHrefs?: readonly string[];
  children: React.ReactNode;
}) {
  const storageKey = `qa-nav-grp-${groupKey}`;
  const pathname = usePathname();
  const holdsCurrent = containsPath(activeHrefs, pathname);
  const [open, setOpen] = useState(defaultOpen || holdsCurrent);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) setOpen(saved === '1');
    } catch {
      // localStorage 미사용 (Private Browsing 등): 기본값 유지, 의도적 no-op
    }
  }, [storageKey]);

  // 화면 검토 A75 · 2026-09-27: 접힌 「연계 부서」 안의 부적합 · PMS · UDI 에 있어도 아무 항목도 강조되지 않았다.
  //   지금 화면이 이 묶음 아래면 펼친다(저장된 접힘보다 뒤에 돌아 이긴다). 사용자가 접은 기록은 건드리지 않는다.
  useEffect(() => {
    if (holdsCurrent) setOpen(true);
  }, [holdsCurrent, pathname]);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, next ? '1' : '0');
      } catch {
        // localStorage 미사용: 세션 한정 토글
      }
      return next;
    });
  }

  // 담을 것이 없으면 이름표도 그리지 않는다. 생산 직무에게 «업무» 가 이름표만 덩그러니 떠 있었다
  // (2026-10-21 홈 전수 점검 03절 결정 2). 조건부 줄이 전부 false 면 여기서 걸린다.
  if (Children.toArray(children).length === 0) return null;

  if (collapsed) {
    return (
      <>
        <div aria-hidden style={{ height: "var(--qd-atelier-height-2264278404)", background: T.border, margin: "var(--qd-atelier-margin-6d71facf62)", opacity: "var(--qd-atelier-opacity-fab5edc654)" }} />
        {children}
      </>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: "var(--qd-atelier-width-b7aa1ec004)",
          padding: "var(--qd-atelier-padding-f5778c8c22)",
          fontSize: QDScale.font[12],
          fontFamily: QDScale.family.mono,
          // 2026-09-09: SectionHeader 만 고치고 여기를 놓쳤다. 화면에 실제로 보이는
          // 묶음 이름표는 접이식인 이쪽이고, 「워 크 스 페 이 스」가 여기서 나왔다.
          letterSpacing: labelTracking(label, QDText.tracking.vec6c168f44),
          wordSpacing: labelWordSpacing(label),
          textTransform: labelCase(label),
          color: T.muted,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = T.subtle; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = T.muted; }}
      >
        <span>{label}</span>
        {/* 꺾쇠 규칙 하나(화면 검토 A75): 펼침 = v, 접힘 = >. 워크스페이스 묶음과 같다 */}
        <ChevronIcon dir={open ? 'down' : 'right'} size={QDPresentation.iconSize[10]} />
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

/**
 * 워크스페이스 펼침 항목: 허브 링크(좌, /qa 등) + 펼침 토글(우 chevron).
 * 펼치면 그 워크스페이스의 도메인 모듈을 인라인 표시. 접힘(아이콘 레일)이거나
 * 모듈이 없으면 단순 허브 링크로 폴백. open 상태는 기기별 localStorage 영속.
 */
function WorkspaceNavGroup({
  hubHref,
  label,
  icon,
  modules,
  collapsed,
  defaultOpen,
  renderModule,
}: {
  /**
   * 부서 «허브 화면» 경로. 없을 수도 있다(2026-08-21): 예컨대 RA 가 가진 QMS 모듈들은
   * 「QA」 라는 부서로 묶여야 하지만 `/qa` 허브는 QA 직무 전용이라(들어가면 「권한 부족」
   * 안내가 뜬다) 링크를 걸면 안 된다. 그때는 라벨이 링크가 아니라 **표제**가 된다.
   * ★ 모양은 형제(허브 있는 부서)와 같아야 한다. 다르면 그 부서만 계층이 어긋나 보인다.
   */
  hubHref?: string;
  label: string;
  icon: IconType;
  modules: SidebarMenuId[];
  collapsed: boolean;
  defaultOpen: boolean;
  renderModule: (id: SidebarMenuId) => React.ReactNode;
}) {
  const Icon = icon;
  // v2: 기본 펼침 정책 변경 시 묵은 접힘 상태 리셋(키 버전 올림).
  const storageKey = `qa-nav-ws2-${hubHref ?? label}`;
  const pathname = usePathname();
  // 화면 검토 A75: 지금 화면이 이 부서의 모듈 아래면 펼친다(CollapsibleNavGroup 과 같은 규칙).
  const holdsCurrent = containsPath(
    modules.map((m) => NAV_ITEMS[m]?.href).filter((h): h is string => !!h),
    pathname,
  );
  const [open, setOpen] = useState(defaultOpen || holdsCurrent);
  useEffect(() => {
    try {
      const s = localStorage.getItem(storageKey);
      if (s !== null) setOpen(s === '1');
    } catch {
      // localStorage 미사용: 기본값 유지
    }
  }, [storageKey]);
  useEffect(() => {
    if (holdsCurrent) setOpen(true);
  }, [holdsCurrent, pathname]);
  function toggle() {
    setOpen((p) => {
      const n = !p;
      try {
        localStorage.setItem(storageKey, n ? '1' : '0');
      } catch {
        // 세션 한정
      }
      return n;
    });
  }

  // 접힘(아이콘 레일) 또는 모듈 없음 → 허브 링크만 (기존 동작).
  // 허브가 없으면 갈 곳도 보여 줄 것도 없으므로 아무것도 그리지 않는다.
  if (collapsed || modules.length === 0) {
    return hubHref ? <NavLink href={hubHref} label={label} icon={icon} collapsed={collapsed} /> : null;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ flex: "var(--qd-atelier-flex-83725d2c6e)", minWidth: "var(--qd-atelier-min-width-f24a3b2189)" }}>
          {hubHref ? (
            <NavLink href={hubHref} label={label} icon={icon} collapsed={false} />
          ) : (
            /* 허브 화면이 없는 부서: 라벨을 누르면 펼침/접힘. NavLink 와 **같은 치수**로
               그려야 형제 부서와 계층이 나란히 보인다(패딩·간격·글자·아이콘 크기 일치).
               단추는 링크보다 4px 낮게 그려진다(40). 터치 화면에서는 qa-touch-44 로 44 에 맞춘다. 줄이 40 이면
               옆 화살표의 누르는 자리(44)가 위아래 줄과 2px 씩 겹쳐 42 만 남았다(2026-10-21 폰 실측). */
            <button
              type="button"
              className="qa-touch-44"
              onClick={toggle}
              aria-expanded={open}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: QDScale.space[3],
                width: "var(--qd-atelier-width-b7aa1ec004)",
                padding: NAV_ITEM_PADDING,
                paddingLeft: "var(--qd-atelier-padding-left-2da5cadfb6)", // NavLink 과 같은 글자 자리(종전 투명 3px 왼쪽 선 대신 · 2026-09-27)
                background: 'transparent',
                border: 'none',
                color: T.subtle,
                fontSize: QDScale.font[14],
                fontFamily: QDScale.family.ui,
                fontWeight: "var(--qd-font-weight-normal)",
                letterSpacing: "var(--qd-atelier-letter-spacing-4a873a4bd2)",
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <span
                aria-hidden
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: "var(--qd-atelier-width-06f0618ae8)",
                  height: "var(--qd-atelier-height-1ca2107b5a)",
                  color: T.muted,
                  flexShrink: 0,
                }}
              >
                <Icon size={QDPresentation.iconSize[16]} strokeWidth={1.75} />
              </span>
              <span style={{ flex: "var(--qd-atelier-flex-83725d2c6e)" }}>{label}</span>
            </button>
          )}
        </div>
        {/* 화살표는 펼치기만 한다. 터치 화면에서는 모양(30×34)은 두고 누르는 자리만 44×44 로 넓힌다(qa-touch-hit-end).
            빗맞히면 옆 이름 링크를 눌러 다른 화면으로 넘어갔다(2026-10-21 폰 실측). */}
        <button
          type="button"
          className="qa-touch-hit-end"
          onClick={toggle}
          aria-expanded={open}
          aria-label={`${label} 모듈 ${open ? '접기' : '펼치기'}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: "var(--qd-atelier-width-d01ec87d92)",
            height: "var(--qd-atelier-height-2702c45a17)",
            flexShrink: 0,
            background: 'transparent',
            border: 'none',
            color: T.muted,
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = T.subtle; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = T.muted; }}
        >
          <ChevronIcon dir={open ? 'down' : 'right'} size={QDPresentation.iconSize[11]} />
        </button>
      </div>
      {open && (
        <div style={{ marginLeft: QDScale.space[4], paddingLeft: QDScale.space[2], borderLeft: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}`, display: 'flex', flexDirection: 'column', gap: "var(--qd-atelier-gap-b888c81e5f)", marginBottom: QDScale.space[1] }}>
          {(() => {
            // subGroup 메타가 있으면 ISO 프로세스 소그룹으로 묶어 소헤더 렌더(QA 등),
            // 없으면 평면 렌더(R&D·RA 워크스페이스: 하위호환). "CAPA 부모 착시" 해소.
            const bySub = new Map<NavSubGroup, SidebarMenuId[]>();
            const ungrouped: SidebarMenuId[] = [];
            for (const m of modules) {
              const sg = NAV_ITEMS[m]?.subGroup;
              if (sg) { const arr = bySub.get(sg) ?? []; arr.push(m); bySub.set(sg, arr); }
              else ungrouped.push(m);
            }
            if (bySub.size === 0) return modules.map((m) => renderModule(m));
            return (
              <>
                {ungrouped.map((m) => renderModule(m))}
                {NAV_SUBGROUP_ORDER.filter((sg) => bySub.has(sg)).map((sg) => (
                  <div key={sg} style={{ display: 'flex', flexDirection: 'column', gap: "var(--qd-atelier-gap-b888c81e5f)" }}>
                    <div style={{ fontSize: QDScale.font[12], color: T.muted, fontFamily: QDScale.family.mono, letterSpacing: labelTracking(NAV_SUBGROUP_LABEL[sg], QDText.tracking.v77ac319bfe), wordSpacing: labelWordSpacing(NAV_SUBGROUP_LABEL[sg]), textTransform: labelCase(NAV_SUBGROUP_LABEL[sg]), padding: "var(--qd-atelier-padding-6dbda940f2)" }}>
                      {NAV_SUBGROUP_LABEL[sg]}
                    </div>
                    {bySub.get(sg)!.map((m) => renderModule(m))}
                  </div>
                ))}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

/** Hamburger-style 3-line icon for mobile FAB */
function MenuIcon({ size = QDPresentation.iconSize[18] }: { size?: number }) {
  return (
    <Menu size={size} />
  );
}
