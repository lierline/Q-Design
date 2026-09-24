'use client';

// =============================================================================
// CustomizableWidgetBoard: 홈 위젯을 사용자가 직접 배치 (A안 v1)
// =============================================================================
// 서버에서 렌더된 위젯 노드를 props 로 받아, 사용자가 정한 "순서 + 표시여부" 로
// 클라이언트에서 재배치한다. (위젯 자체는 서버 컴포넌트여도 무방: 여기선
// 그저 React 노드로 받아 위치만 조정.)
//
// v1 범위:
//   - 편집 모드 토글 → 드래그로 순서 변경 + 위/아래 버튼(접근성/모바일) + 표시/숨김
//   - localStorage 영속 (기기별). 서버 영속(교차기기)은 후속(B안 메모 참조).
//   - 권한/역할에 따라 보일 위젯은 호출부(dashboard)가 items 로 이미 필터해 전달.
//
// 디자인: 평소엔 위젯만 깔끔히. 편집 모드에서만 컨트롤 바 노출.

import { useEffect, useState, type ReactNode } from 'react';
import { GripVertical, ChevronUp, ChevronDown, Eye, EyeOff, Lock, SlidersHorizontal, RotateCcw, Check } from 'lucide-react';
import { S, FS, F, T, alpha, RADIUS, MOTION, ICON, LH } from '@/lib/design/tokens';

export interface BoardItem {
  /** 고정 위젯 id (widget.* / dash.* 태그와 정렬). localStorage 키로 사용. */
  id: string;
  /** 편집 모드에서 보일 위젯 이름. */
  title: string;
  /** 서버/클라이언트에서 렌더된 위젯 노드. */
  node: ReactNode;
  /** 일반 모드 너비: full(기본, 1줄 전체) / half(½) / quarter(¼, KPI 그리드용). */
  width?: 'full' | 'half' | 'quarter';
  /**
   * 핵심 항목 잠금: true 면 순서 변경은 가능하되 '숨기기' 불가.
   * 폼 본문·저장 버튼바·주요 테이블 등 숨기면 작업이 막히는 항목에 사용.
   * (전 화면 위젯 편집 시 필수 UI 가 사라지는 사고 방지.)
   */
  locked?: boolean;
}

interface SavedLayout {
  order: string[];
  hidden: string[];
}

function loadLayout(storageKey: string): SavedLayout | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedLayout;
    if (!Array.isArray(parsed.order) || !Array.isArray(parsed.hidden)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function CustomizableWidgetBoard({
  items: rawItems,
  storageKey,
  leftSlot,
}: {
  items: BoardItem[];
  /** 사용자별 키 (예: dash-layout-<userId>). */
  storageKey: string;
  /**
   * 편집 토글 행 좌측에 함께 정렬할 슬롯 (예: PageGuide 칩).
   * 있으면 좌·우 분리 정렬, 없으면 기존처럼 우측 정렬만.
   */
  leftSlot?: ReactNode;
}) {
  // ★ 중복 id 방어: 다중 역할 보드 합성 시 widget.* 가 겹칠 수 있음
  //   (예: RA + QA 둘 다 widget.regulatory-deadlines 를 emit). 중복 id 가 있으면
  //   byId Map 충돌 + order indexOf 가 첫 항목만 잡아 드래그/표시토글/순서변경이
  //   깨짐 → 다중 역할 대시보드에서 "위젯 편집이 안 되는" 원인. 첫 항목만 유지.
  const seenIds = new Set<string>();
  const items = rawItems.filter((it) => {
    if (seenIds.has(it.id)) return false;
    seenIds.add(it.id);
    return true;
  });
  const itemIds = items.map((i) => i.id);
  // 잠금 항목 id 집합: 숨김 불가 (load/persist/toggle 전부에서 방어).
  const lockedIds = new Set(items.filter((i) => i.locked).map((i) => i.id));
  const [order, setOrder] = useState<string[]>(itemIds);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  // 마운트 후 저장된 레이아웃 적용 (SSR hydration mismatch 방지: 첫 페인트는 기본 순서).
  useEffect(() => {
    const saved = loadLayout(storageKey);
    if (saved) {
      // 저장된 순서에 현재 items 만 남기고, 새로 추가된 위젯은 뒤에 append.
      const known = new Set(itemIds);
      const merged = saved.order.filter((id) => known.has(id));
      for (const id of itemIds) if (!merged.includes(id)) merged.push(id);
      setOrder(merged);
      // 잠금 항목은 숨김에서 제외: 과거에 숨겼던 항목이 잠금으로 바뀌어도 항상 표시.
      setHidden(new Set(saved.hidden.filter((id) => known.has(id) && !lockedIds.has(id))));
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function persist(nextOrder: string[], nextHidden: Set<string>) {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ order: nextOrder, hidden: Array.from(nextHidden) } satisfies SavedLayout),
      );
    } catch {
      /* localStorage 불가 환경: 무시 (세션 내 상태만 유지) */
    }
  }

  function move(id: string, dir: -1 | 1) {
    setOrder((prev) => {
      const idx = prev.indexOf(id);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      persist(copy, hidden);
      return copy;
    });
  }

  function reorderByDrag(fromId: string, toId: string) {
    if (fromId === toId) return;
    setOrder((prev) => {
      const from = prev.indexOf(fromId);
      const to = prev.indexOf(toId);
      if (from < 0 || to < 0) return prev;
      const copy = [...prev];
      copy.splice(from, 1);
      copy.splice(to, 0, fromId);
      persist(copy, hidden);
      return copy;
    });
  }

  function toggleHidden(id: string) {
    if (lockedIds.has(id)) return; // 잠금 항목은 숨김 불가
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      persist(order, next);
      return next;
    });
  }

  function resetLayout() {
    setOrder(itemIds);
    setHidden(new Set());
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* noop */
    }
  }

  const byId = new Map(items.map((i) => [i.id, i]));
  const ordered = order.map((id) => byId.get(id)).filter((x): x is BoardItem => !!x);

  // 편집 토글 버튼 (항상 우상단).
  // leftSlot 이 있으면 좌·우 분리 정렬(예: PageGuide 칩과 같은 줄).
  const editToggle = (
    <div
      style={{
        display: 'flex',
        justifyContent: leftSlot ? 'space-between' : 'flex-end',
        alignItems: 'center',
        gap: S[3],
        marginBottom: S[2.5],
        flexWrap: 'wrap',
      }}
    >
      {leftSlot ? <div style={{ display: 'flex', alignItems: 'center' }}>{leftSlot}</div> : null}
      <button
        type="button"
        onClick={() => setEditing((v) => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: S[1.5],
          padding: '6px 12px',
          background: editing ? T.champagne : 'transparent',
          color: editing ? T.bg : T.subtle,
          border: `1px solid ${editing ? T.champagne : T.border}`,
          borderRadius: RADIUS.md,
          fontFamily: F.mono,
          fontSize: FS[10],
          cursor: 'pointer',
          transition: `background ${MOTION.fast}, color ${MOTION.fast}, border-color ${MOTION.fast}`,
        }}
      >
        {editing ? (
          <>
            <Check size={ICON.sizeXs} strokeWidth={ICON.strokeWidth} aria-hidden="true" /> 완료
          </>
        ) : (
          <>
            <SlidersHorizontal size={ICON.sizeXs} strokeWidth={ICON.strokeWidth} aria-hidden="true" /> 위젯 편집
          </>
        )}
      </button>
    </div>
  );

  // 편집 모드 (안드로이드 홈 스타일): 위젯을 "평소 그리드·크기 그대로" 두되
  // 살짝 흔들고(jiggle), 위젯 위에 오버레이 컨트롤(드래그/숨김/순서)을 띄움.
  // → 컴팩트 목록처럼 작아지지도, full-width 로 갑자기 커지지도 않음.
  if (editing) {
    return (
      <div>
        {editToggle}
        <div
          style={{
            padding: '10px 14px',
            marginBottom: S[3],
            background: alpha(T.champagne, 0.05),
            border: `1px dashed ${alpha(T.champagne, 0.4)}`,
            borderRadius: RADIUS.md,
            fontFamily: F.mono,
            fontSize: FS[11],
            color: T.subtle,
            letterSpacing: 0.3,
            lineHeight: LH.relaxed,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: S[2.5],
            flexWrap: 'wrap',
          }}
        >
          <span>위젯을 드래그해 위치 변경 · 👁 로 표시/숨김 · 변경은 이 기기에 저장됩니다.</span>
          <button
            type="button"
            onClick={resetLayout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              background: 'transparent',
              color: T.muted,
              border: `1px solid ${T.border}`,
              borderRadius: RADIUS.md,
              fontFamily: F.mono,
              fontSize: FS[10],
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <RotateCcw size={12} strokeWidth={ICON.strokeWidth} aria-hidden="true" /> 기본값
          </button>
        </div>

        {/* jiggle 키프레임. 위젯마다 미세하게 다른 위상으로 흔들어 '편집 중' 표현.
            prefers-reduced-motion 시 정지(접근성). */}
        <style>{`
          @keyframes qa-widget-jiggle {
            0%, 100% { transform: rotate(-0.55deg); }
            50% { transform: rotate(0.55deg); }
          }
          .qa-edit-item { animation: qa-widget-jiggle 0.42s ease-in-out infinite; transform-origin: 50% 50%; }
          .qa-edit-item:nth-child(2n) { animation-duration: 0.48s; animation-delay: -0.12s; }
          .qa-edit-item:nth-child(3n) { animation-duration: 0.39s; animation-delay: -0.06s; }
          .qa-edit-item.qa-dragging { animation: none; opacity: 0.5; }
          @media (prefers-reduced-motion: reduce) {
            .qa-edit-item { animation: none !important; }
          }
          /* 데이터가 없어 본체가 null 을 반환하는 위젯(규제 일정·파이프라인·시장 진출 등):
             편집 모드에선 빈 점선 박스가 '고장난 것'처럼 보이므로 안내 문구를 띄운다.
             (::after 생성 콘텐츠는 :empty 매칭에 영향 없음. 안정적으로 동작) */
          .qa-edit-body:empty::after {
            content: '표시할 데이터가 아직 없습니다. 데이터가 생기면 이 자리에 자동 표시됩니다';
            display: flex; align-items: center; justify-content: center;
            min-height: 76px; padding: 18px 14px; text-align: center;
            font-family: ${F.mono}; font-size: 10.5px; line-height: ${LH.relaxed};
            color: ${T.muted}; letter-spacing: 0.3px;
          }
        `}</style>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: S[4], alignItems: 'stretch' }}>
          {ordered.map((item) => {
            const isHidden = hidden.has(item.id);
            const isLocked = lockedIds.has(item.id);
            const w = item.width ?? 'full';
            const basis = w === 'quarter' ? 'calc(25% - 12px)' : w === 'half' ? 'calc(50% - 8px)' : '100%';
            return (
              <div
                key={item.id}
                className={`qa-edit-item${dragId === item.id ? ' qa-dragging' : ''}`}
                draggable
                onDragStart={() => setDragId(item.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragId) reorderByDrag(dragId, item.id);
                  setDragId(null);
                }}
                onDragEnd={() => setDragId(null)}
                style={{
                  flex: `1 1 ${basis}`,
                  minWidth: w === 'full' ? '100%' : 200,
                  maxWidth: '100%',
                  position: 'relative',
                  cursor: 'grab',
                }}
              >
                {/* 위젯 본체: 편집 중엔 클릭/링크 비활성(pointer-events none),
                    숨김이면 흐리게 + 흑백 처리. 점선 테두리로 '편집 대상' 표시.
                    qa-edit-body: 본체가 null 이면(데이터 없음) :empty 안내 문구 자동 표시. */}
                <div
                  className="qa-edit-body"
                  style={{
                    pointerEvents: 'none',
                    userSelect: 'none',
                    opacity: isHidden ? 0.32 : 1,
                    filter: isHidden ? 'grayscale(0.7)' : 'none',
                    border: `1px dashed ${alpha(T.champagne, 0.45)}`,
                    borderRadius: RADIUS.md,
                    transition: `opacity ${MOTION.fast}, filter ${MOTION.fast}`,
                  }}
                >
                  {item.node}
                </div>

                {/* 오버레이 컨트롤: 우상단 부유 툴바 */}
                <div
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    display: 'flex',
                    gap: S[1],
                    padding: 3,
                    background: alpha(T.bg, 0.82),
                    border: `1px solid ${T.borderHi}`,
                    borderRadius: RADIUS.sm,
                    backdropFilter: 'blur(4px)',
                    zIndex: 3,
                  }}
                >
                  <CtrlBtn label="위로" onClick={() => move(item.id, -1)}>
                    <ChevronUp size={14} strokeWidth={ICON.strokeWidth} aria-hidden="true" />
                  </CtrlBtn>
                  <CtrlBtn label="아래로" onClick={() => move(item.id, 1)}>
                    <ChevronDown size={14} strokeWidth={ICON.strokeWidth} aria-hidden="true" />
                  </CtrlBtn>
                  {isLocked ? (
                    <span
                      aria-label="핵심 항목: 숨길 수 없음"
                      title="핵심 항목: 순서만 변경할 수 있고 숨길 수 없습니다"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 30,
                        height: 30,
                        color: T.muted,
                      }}
                    >
                      <Lock size={13} strokeWidth={ICON.strokeWidth} aria-hidden="true" />
                    </span>
                  ) : (
                    <CtrlBtn label={isHidden ? '표시' : '숨기기'} onClick={() => toggleHidden(item.id)}>
                      {isHidden ? (
                        <EyeOff size={14} strokeWidth={ICON.strokeWidth} aria-hidden="true" />
                      ) : (
                        <Eye size={14} strokeWidth={ICON.strokeWidth} aria-hidden="true" />
                      )}
                    </CtrlBtn>
                  )}
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 30,
                      height: 30,
                      color: T.muted,
                      cursor: 'grab',
                    }}
                    title="드래그해 이동"
                  >
                    <GripVertical size={14} strokeWidth={ICON.strokeWidth} />
                  </span>
                </div>

                {/* 좌상단 위젯 이름 칩 + 숨김 표시 */}
                <div
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: S[1.5],
                    padding: '3px 8px',
                    background: alpha(T.bg, 0.82),
                    border: `1px solid ${T.borderHi}`,
                    borderRadius: RADIUS.sm,
                    backdropFilter: 'blur(4px)',
                    fontFamily: F.mono,
                    fontSize: FS[10],
                    color: isHidden ? T.muted : T.subtle,
                    letterSpacing: 0.3,
                    maxWidth: 'calc(100% - 150px)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    zIndex: 3,
                  }}
                >
                  {item.title}
                  {isLocked && <span style={{ color: T.muted }}>· 잠금</span>}
                  {isHidden && <span style={{ color: T.muted }}>· 숨김</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 일반 모드: 표시 위젯만 순서대로. width 에 따라 flex-wrap 그리드
  // (full=1줄 전체, half=½, quarter=¼: KPI 카드를 한 줄에 4개).
  const visible = ordered.filter((item) => !(hydrated && hidden.has(item.id)));
  return (
    <div>
      {editToggle}
      {/* 일반 모드에서 본체가 null 인 위젯(데이터 없음)은 래퍼까지 통째로 숨김 →
          flex 그리드에 빈 칸/간격이 남지 않음. (인라인 display 미지정이라 적용됨) */}
      <style>{`.qa-normal-item:empty { display: none; }`}</style>
      <div className="qa-stagger" style={{ display: 'flex', flexWrap: 'wrap', gap: S[3], alignItems: 'stretch' }}>
        {visible.map((item) => {
          const w = item.width ?? 'full';
          const basis = w === 'quarter' ? 'calc(25% - 9px)' : w === 'half' ? 'calc(50% - 6px)' : '100%';
          return (
            <div
              key={item.id}
              className="qa-normal-item"
              style={{
                flex: `1 1 ${basis}`,
                minWidth: w === 'full' ? '100%' : 200,
                maxWidth: '100%',
              }}
            >
              {item.node}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CtrlBtn({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 30,
        height: 30,
        background: 'transparent',
        border: `1px solid ${T.border}`,
        borderRadius: RADIUS.sm,
        color: T.subtle,
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}
