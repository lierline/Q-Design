'use client';

// =============================================================================
// CalendarClient: 월간 캘린더 + 회의 상세 + 새 회의 제안
// =============================================================================
// 레이아웃:
//   ┌──────────────────┬─────────────────────┐
//   │  월간 그리드      │  선택된 날짜의 회의 │
//   │  (회의 dot 표시)  │  상세 / 응답 액션   │
//   └──────────────────┴─────────────────────┘
//
// 디자인:
//   - 캘린더는 7×6 그리드, 한국 주 (월 시작): Sun 아닌 Mon.
//   - 오늘 = champagne ring, 회의 있는 날 = champagne dot.
//   - 선택된 날짜 = champagne 배경.
//   - 호스트만 [편집] [취소] 버튼.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bx, Btn, SectionTitle, SkeletonPanel, Alert } from '@/lib/design/components';
import { S, FS, F, T, alpha } from '@/lib/design/tokens';
import { MeetingComposeDialog } from './MeetingComposeDialog';
import { MeetingDetailPanel } from './MeetingDetailPanel';
import { TextAction } from '@/components/TextAction';

export interface OrgMember {
  user_id: string;
  full_name: string | null;
  email: string | null;
  job_role: string | null;
}

export interface ResearchProject {
  id: string;
  code: string;
  title: string;
}

export interface MeetingRow {
  id: string;
  title: string;
  agenda: string | null;
  starts_at: string;
  ends_at: string;
  location: string | null;
  meeting_url: string | null;
  project_id: string | null;
  host_id: string;
  status: 'scheduled' | 'cancelled' | 'completed';
  created_at: string;
  cancellation_reason: string | null;
  attendees: Array<{
    user_id: string;
    response: 'pending' | 'accepted' | 'declined' | 'tentative';
    /** H-S4: response_note 는 list view 에서 제외: PII 보호. */
    role_label: string | null;
    responded_at: string | null;
  }>;
}

interface Props {
  currentUserId: string;
  members: OrgMember[];
  projects?: ResearchProject[];
}

export function CalendarClient({ currentUserId, members, projects = [] }: Props) {
  const searchParams = useSearchParams();
  const focusMeetingId = searchParams.get('meeting');
  // 다른 화면(예: R&D 단계 진행의 design review 조건)에서 "회의 일정 잡기 →" 로
  // 넘어오면 ?new=1 + title/agenda prefill 로 새 회의 모달을 바로 띄움.
  const wantNewMeeting = searchParams.get('new');
  const prefillTitle = searchParams.get('title') ?? undefined;
  const prefillAgenda = searchParams.get('agenda') ?? undefined;

  // 보고 있는 달 (1일 기준)
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  // 월간 회의 fetch: viewMonth 변경 시
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).toISOString();
      const to = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1).toISOString();
      const res = await fetch(`/api/meetings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&status=all`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        setError(`로드 실패 (${res.status})`);
        return;
      }
      const data = (await res.json()) as { meetings: MeetingRow[] };
      setMeetings(data.meetings ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [viewMonth]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // ?new=1 로 진입하면 새 회의 제안 모달 자동 오픈 (제목·안건 prefill 은 dialog 로 전달).
  useEffect(() => {
    if (wantNewMeeting) setComposeOpen(true);
  }, [wantNewMeeting]);

  // focus meeting 이 있으면 해당 회의 날짜로 자동 점프
  useEffect(() => {
    if (!focusMeetingId) return;
    const m = meetings.find((x) => x.id === focusMeetingId);
    if (m) {
      const d = new Date(m.starts_at);
      setSelectedDate(d);
      const monthFirst = new Date(d.getFullYear(), d.getMonth(), 1);
      if (monthFirst.getTime() !== viewMonth.getTime()) setViewMonth(monthFirst);
    }
  }, [focusMeetingId, meetings, viewMonth]);

  // ─── derived ───────────────────────────────────────────────────────────
  // 월간 그리드 셀들: 한 달의 첫째 주 월요일부터 마지막 주 일요일까지 (최대 42칸)
  const cells = useMemo(() => buildMonthCells(viewMonth), [viewMonth]);

  // 날짜별 회의 카운트
  const meetingsByDate = useMemo(() => {
    const map = new Map<string, MeetingRow[]>();
    for (const m of meetings) {
      const k = ymdKey(new Date(m.starts_at));
      const arr = map.get(k) ?? [];
      arr.push(m);
      map.set(k, arr);
    }
    return map;
  }, [meetings]);

  const selectedDayMeetings = meetingsByDate.get(ymdKey(selectedDate)) ?? [];
  const focusMeeting = focusMeetingId
    ? meetings.find((m) => m.id === focusMeetingId) ?? null
    : null;

  return (
    <div>
      {error && (
        // 옅은 빨강 상자 → 공용 알림(위아래 괘선 · 화면 검토 A35 · 2026-09-28)
        <Alert kind="error" style={{ marginBottom: S[3.5] }}>
          {error}
        </Alert>
      )}

      {/* 헤더: 월 네비게이션 + 새 회의 버튼 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: S[4],
          gap: S[3],
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: S[2] }}>
          <MonthNavBtn
            label="◀"
            onClick={() => setViewMonth(addMonth(viewMonth, -1))}
            title="이전 달"
          />
          <div
            style={{
              fontFamily: F.serif,
              fontSize: FS[20],
              color: T.text,
              minWidth: 140,
              textAlign: 'center',
            }}
          >
            {viewMonth.getFullYear()}년 {viewMonth.getMonth() + 1}월
          </div>
          <MonthNavBtn
            label="▶"
            onClick={() => setViewMonth(addMonth(viewMonth, 1))}
            title="다음 달"
          />
          <MonthNavBtn
            label="오늘"
            onClick={() => {
              const now = new Date();
              setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
              setSelectedDate(now);
            }}
            title="오늘로 이동"
          />
        </div>
        <Btn sm onClick={() => setComposeOpen(true)}>
          + 새 회의 제안
        </Btn>
      </div>

      {/* 본문: 캘린더 그리드(전체폭) 위 + 선택된 날짜 패널 아래 (세로 스택).
          오빠 요청(2026-06-09): 달력을 한 줄(전체폭)로 펴고, "이 날에 회의 제안"
          영역을 달력 밑으로 내려 크게. */}
      <style dangerouslySetInnerHTML={{ __html: `
        .qa-cal-body { display: flex; flex-direction: column; gap: 18px; }
      ` }} />
      <div className="qa-cal-body">
        <Bx style={{ padding: 0, overflow: 'hidden' }}>
          {/* 요일 헤더 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              borderBottom: `1px solid ${T.border}`,
              background: T.surface,
            }}
          >
            {['월', '화', '수', '목', '금', '토', '일'].map((d, i) => (
              <div
                key={d}
                style={{
                  padding: '10px 0',
                  textAlign: 'center',
                  fontSize: FS[12],
                  color: i === 5 ? T.blue : i === 6 ? T.red : T.muted,
                  // 요일이 한글이라 본문 글꼴 (화면 검토 A44 · 2026-09-28)
                  fontFamily: F.ui,
                }}
              >
                {d}
              </div>
            ))}
          </div>
          {/* 셀 그리드: H4 (WCAG 2.1.1 Keyboard):
              role="grid" + role="gridcell" + roving tabIndex + Arrow/Home/End/PageUp/Down.
              선택된 셀만 tabIndex=0, 나머지 -1 → Tab 한 번에 그리드 진입/탈출. */}
          <div
            role="grid"
            aria-label={`${viewMonth.getFullYear()}년 ${viewMonth.getMonth() + 1}월 회의 일정`}
            onKeyDown={(e) => {
              // 선택된 날짜 기준으로 키 누를 때 setSelectedDate.
              // ArrowLeft/Right: ±1일, Up/Down: ±7일, Home/End: 주의 시작/끝,
              // PageUp/Down: 이전/다음 달 같은 날.
              const KEY_DELTA: Record<string, number | 'home' | 'end' | 'monthPrev' | 'monthNext'> = {
                ArrowLeft: -1,
                ArrowRight: 1,
                ArrowUp: -7,
                ArrowDown: 7,
                Home: 'home',
                End: 'end',
                PageUp: 'monthPrev',
                PageDown: 'monthNext',
              };
              const action = KEY_DELTA[e.key];
              if (action === undefined) return;
              e.preventDefault();
              const cur = new Date(selectedDate);
              if (typeof action === 'number') {
                cur.setDate(cur.getDate() + action);
              } else if (action === 'home') {
                // 그 주의 월요일
                const wd = (cur.getDay() + 6) % 7;
                cur.setDate(cur.getDate() - wd);
              } else if (action === 'end') {
                const wd = (cur.getDay() + 6) % 7;
                cur.setDate(cur.getDate() + (6 - wd));
              } else if (action === 'monthPrev') {
                cur.setMonth(cur.getMonth() - 1);
              } else if (action === 'monthNext') {
                cur.setMonth(cur.getMonth() + 1);
              }
              setSelectedDate(cur);
              // 셀이 viewMonth 밖으로 나가면 viewMonth 도 같이 이동
              const newMonthFirst = new Date(cur.getFullYear(), cur.getMonth(), 1);
              if (newMonthFirst.getTime() !== viewMonth.getTime()) {
                setViewMonth(newMonthFirst);
              }
            }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gridAutoRows: '1fr',
              minHeight: 380,
            }}
          >
            {cells.map((cell, i) => {
              const dayMeetings = meetingsByDate.get(ymdKey(cell.date)) ?? [];
              const isToday = isSameDay(cell.date, new Date());
              const isSelected = isSameDay(cell.date, selectedDate);
              const isOtherMonth = cell.date.getMonth() !== viewMonth.getMonth();
              const dayOfWeek = (cell.date.getDay() + 6) % 7; // 월=0 ... 일=6
              // H5: SR 라벨: 날짜 + 요일 + 회의 수 + 선택/오늘 표시
              const weekdayName = ['월','화','수','목','금','토','일'][dayOfWeek];
              const ariaLabel =
                `${cell.date.getFullYear()}년 ${cell.date.getMonth() + 1}월 ${cell.date.getDate()}일 ${weekdayName}요일` +
                (dayMeetings.length > 0 ? `, 회의 ${dayMeetings.length}건` : ', 회의 없음') +
                (isToday ? ', 오늘' : '') +
                (isSelected ? ', 선택됨' : '');
              return (
                <button
                  key={i}
                  type="button"
                  role="gridcell"
                  aria-selected={isSelected}
                  aria-current={isToday ? 'date' : undefined}
                  aria-label={ariaLabel}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setSelectedDate(cell.date)}
                  style={{
                    minHeight: 70,
                    padding: S[1.5],
                    border: `1px solid ${T.border}`,
                    borderTop: 'none',
                    borderLeft: i % 7 === 0 ? 'none' : `1px solid ${T.border}`,
                    // 다른 달 칸은 반투명(opacity)이라 뒤의 물결 바탕이 비쳐 음영처럼 보였다 (화면 검토 A46 · 2026-09-27).
                    // 칸 바탕은 늘 불투명하게 두고, 다른 달은 옅은 면 · 흐린 글자로 가른다.
                    background: isSelected
                      ? alpha(T.champagne, 0.15)
                      : isOtherMonth
                        ? T.surface2
                        : T.bg,  // transparent → T.bg: 라이트 모드에서 셀 분리 현상 방지
                    boxShadow: isToday && !isSelected
                      ? `inset 0 0 0 2px ${alpha(T.champagne, 0.5)}`
                      : 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: S[1],
                    color: isOtherMonth ? T.muted : undefined,
                    transition: 'background 150ms ease',
                  }}
                >
                  <div
                    style={{
                      fontSize: FS[12],
                      color: isToday
                        ? T.champagne
                        : dayOfWeek === 5
                          ? T.blue
                          : dayOfWeek === 6
                            ? T.red
                            : T.text,
                      fontWeight: isToday ? 600 : 400,
                      fontFamily: F.mono,
                    }}
                  >
                    {cell.date.getDate()}
                  </div>
                  {dayMeetings.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: S[0.5] }}>
                      {dayMeetings.slice(0, 2).map((m) => (
                        <div
                          key={m.id}
                          style={{
                            fontSize: FS[12],
                            color: m.status === 'cancelled' ? T.muted : T.subtle,
                            fontFamily: F.ui,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            background: m.status === 'cancelled'
                              ? 'transparent'
                              : alpha(T.champagne, 0.12),
                            padding: '1px 4px',
                            textDecoration: m.status === 'cancelled' ? 'line-through' : 'none',
                          }}
                          title={m.title}
                        >
                          {fmtTime(m.starts_at)} {m.title}
                        </div>
                      ))}
                      {dayMeetings.length > 2 && (
                        <div
                          style={{
                            fontSize: FS[12],
                            color: T.muted,
                            fontFamily: F.ui,
                          }}
                        >
                          + {dayMeetings.length - 2}건
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Bx>

        {/* 우측 패널: 선택된 날짜 회의 목록 + 상세 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: S[3] }}>
          <SectionTitle>
            {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 (
            {weekdayKr(selectedDate)})
          </SectionTitle>
          {loading && selectedDayMeetings.length === 0 ? (
            <SkeletonPanel height={90} lines={2} />
          ) : selectedDayMeetings.length === 0 ? (
            <Bx style={{ padding: '44px 24px', color: T.muted, fontSize: FS[13], textAlign: 'center' }}>
              이 날에 잡힌 회의 없음
              <br />
              {/* 위 «새 회의 제안» 과 같은 채운 단추가 둘이었다. 이쪽은 글귀 (화면 검토 A46 · A11 · 2026-09-27) */}
              <span style={{ display: 'inline-block', marginTop: S[4] }}>
                <TextAction onClick={() => setComposeOpen(true)}>+ 이 날에 회의 제안</TextAction>
              </span>
            </Bx>
          ) : (
            selectedDayMeetings.map((m) => (
              <MeetingDetailPanel
                key={m.id}
                meeting={m}
                currentUserId={currentUserId}
                members={members}
                projects={projects}
                onChanged={refresh}
              />
            ))
          )}
          {focusMeeting &&
            !selectedDayMeetings.some((m) => m.id === focusMeeting.id) && (
              <>
                <SectionTitle>알림으로 이동한 회의</SectionTitle>
                <MeetingDetailPanel
                  meeting={focusMeeting}
                  currentUserId={currentUserId}
                  members={members}
                  projects={projects}
                  onChanged={refresh}
                />
              </>
            )}
        </div>
      </div>

      {/* 새 회의 제안 모달 */}
      {composeOpen && (
        <MeetingComposeDialog
          members={members.filter((m) => m.user_id !== currentUserId)}
          defaultDate={selectedDate}
          defaultTitle={prefillTitle}
          defaultAgenda={prefillAgenda}
          onClose={() => setComposeOpen(false)}
          onCreated={() => {
            // M11 fix: 기존 refresh() 만으로 충분: router.refresh() 는 RSC
            // 전체 재요청 → 같은 데이터 두 번 fetch. 클라이언트 fetch 만 사용.
            setComposeOpen(false);
            void refresh();
          }}
        />
      )}
    </div>
  );
}

// ─── helpers ────────────────────────────────────────────────────────────────
function ymdKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return ymdKey(a) === ymdKey(b);
}

function addMonth(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function buildMonthCells(viewMonth: Date): Array<{ date: Date }> {
  // 월 시작 (월요일 시작 기준)
  const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  // JS: Sun=0, Mon=1 ... 우리는 Mon 시작 → offset = (getDay() + 6) % 7
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  const cells: Array<{ date: Date }> = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({ date: d });
  }
  return cells;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function weekdayKr(d: Date): string {
  return ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
}

// ─── MonthNavBtn ────────────────────────────────────────────────────────────
function MonthNavBtn({
  label,
  onClick,
  title,
}: {
  label: string;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      // 달 넘기기(◀ · ▶ · 오늘)는 보조 동작이라 상자가 아니라 글귀 (화면 검토 A11 · 2026-09-28).
      // 누르는 자리는 터치 화면에서 44 로 넓힌다(globals.css)
      className="qa-touch-44"
      style={{
        padding: '6px 10px',
        minHeight: 36,
        background: 'transparent',
        border: 'none',
        color: T.subtle,
        fontSize: FS[13],
        fontFamily: F.ui,
        cursor: 'pointer',
        transition: 'color 150ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = T.text;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = T.subtle;
      }}
    >
      {label}
    </button>
  );
}
