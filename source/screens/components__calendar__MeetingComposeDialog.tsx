'use client';

// =============================================================================
// MeetingComposeDialog: 새 회의 제안 모달 (v3: 공통 Modal 통일)
// =============================================================================
// 디자인 원칙:
//   · 럭셔리 / 통일성: 공통 <Modal> 사용(라운드·backdrop·focus trap·ESC 일원화).
//   · 명확한 시각 위계: title → group → field 3단계, 그룹 사이 분리선.
//   · 다크/라이트 모드 대응: colorScheme 명시 + picker 아이콘 invert(scopedCss).
//   · 입력 위젯 일관성: 모든 input/textarea 동일 focus state (champagne).
//
// 필드:
//   - 제목 *
//   - 날짜 * (단독 행, 전체 폭)
//   - 시작 시간 * / 종료 시간 * (2분할)
//   - 장소 (선택)
//   - 화상회의 링크 (선택)
//   - 안건 (선택)
//   - 참석자 multi-select (같은 org active 멤버)
//
// API: POST /api/meetings

import { useEffect, useId, useMemo, useState } from 'react';
import { S, FS, F, T, alpha, LH, RADIUS } from '@/lib/design/tokens';
import { Field, Modal } from '@/lib/design/components';
import { useTheme } from '@/lib/design/theme-provider';
import { MemberPicker } from '@/components/MemberPicker';
import { createClient } from '@/lib/supabase/client';
import type { OrgMember } from './CalendarClient';
import { DR_STAGES, DR_STAGE_LABEL, drStageOfNumber, type DrStage } from '@/lib/research/stage-config';

interface Props {
  members: OrgMember[];
  defaultDate?: Date;
  /** 회의 일정을 특정 R&D 프로젝트에 묶고 싶은 경우 (Design Review 인라인 생성) */
  projectId?: string;
  /** 변경요청(CR) 검토 회의로 묶을 경우: CR id. 지정 시 DR 단계 연결 UI 숨김. */
  changeRequestId?: string;
  /** 제목 기본값 (예: "DR-2 설계 입력 검토 회의") */
  defaultTitle?: string;
  /** 안건 기본값 */
  defaultAgenda?: string;
  /** dialog 제목 override (예: "Design Review 회의 잡기") */
  dialogTitle?: string;
  onClose: () => void;
  onCreated: () => void;
}

export function MeetingComposeDialog({
  members,
  defaultDate,
  projectId,
  changeRequestId,
  defaultTitle,
  defaultAgenda,
  dialogTitle,
  onClose,
  onCreated,
}: Props) {
  const { theme } = useTheme();

  // unique label↔input id 쌍 (WCAG 1.3.1 / 4.1.2)
  const titleId = useId();
  const dateId = useId();
  const startId = useId();
  const endId = useId();
  const locId = useId();
  const urlId = useId();
  const agendaId = useId();
  const drId = useId();
  const styleScopeId = useId();

  // 기본값: 선택된 날짜의 다음 시간대 (정시 기준).
  const defaults = useMemo(() => {
    const d = defaultDate ?? new Date();
    const now = new Date();
    const base = new Date(d);
    base.setHours(now.getHours() + 1, 0, 0, 0); // 1시간 뒤 정시
    const end = new Date(base);
    end.setHours(base.getHours() + 1);
    return {
      date: ymd(base),
      start: hm(base),
      end: hm(end),
    };
  }, [defaultDate]);

  const [title, setTitle] = useState(defaultTitle ?? '');
  const [date, setDate] = useState(defaults.date);
  const [startTime, setStartTime] = useState(defaults.start);
  const [endTime, setEndTime] = useState(defaults.end);
  const [location, setLocation] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [agenda, setAgenda] = useState(defaultAgenda ?? '');
  const [attendeeIds, setAttendeeIds] = useState<Set<string>>(new Set());
  // DR 연동: 프로젝트 회의일 때 설계검토 «단계» 를 지정하면 회의에 그 단계가 붙는다.
  // 회의록은 회의가 끝난 뒤 사람이 검토·회의 탭에서 채우고, 그때 폼의 단계가 이 값으로
  // 미리 채워진다(`meetings.design_review_stage`, 0354).
  //
  // 🔴 2026-08-31: 여기가 `Phase 1~5`(Concept/Planning/…) 라는 **다른 어휘** 를 쓰고 있었고,
  //    그 값이 `design_reviews`(0127) 라는 **아무도 읽지 않는 표** 로 갔다. 규제점수·검토탭·
  //    종료보고서는 전부 `design_review_meetings`(0055) 를 본다. 프로덕션 실측 1건 : 0건.
  //    그래서 캘린더로 잡은 DR 회의는 **어디에도 나타나지 않았다.**
  //    이제 어휘는 `DR_STAGES` SSOT 를 쓰고, 값은 회의 자신이 든다.
  //
  // DR 회의로 진입(defaultTitle 에 "DR-1"~"DR-6" 포함)하면 해당 단계 자동 선택.
  const [drStage, setDrStage] = useState<DrStage | null>(() => {
    const m = defaultTitle?.match(/DR-([1-6])\b/i);
    return m ? drStageOfNumber(Number(m[1])) : null;
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 참석자 목록에서 본인(로그인 계정) 제외: 본인은 작성자로 자동 참석 처리됨
  // (POST /api/meetings 가 호스트를 attendees 에 자동 포함·중복 제거).
  const [selfId, setSelfId] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (active) setSelfId(data.user?.id ?? null);
      });
    return () => {
      active = false;
    };
  }, []);
  const visibleMembers = useMemo(
    () => (selfId ? members.filter((m) => m.user_id !== selfId) : members),
    [members, selfId],
  );

  function toggleAttendee(id: string) {
    setAttendeeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    setBusy(true);
    setErr(null);
    try {
      const startsAt = new Date(`${date}T${startTime}:00`).toISOString();
      const endsAt = new Date(`${date}T${endTime}:00`).toISOString();
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          starts_at: startsAt,
          ends_at: endsAt,
          location: location.trim() || undefined,
          meeting_url: meetingUrl.trim() || undefined,
          agenda: agenda.trim() || undefined,
          attendees: Array.from(attendeeIds),
          project_id: projectId || undefined,
          change_request_id: changeRequestId || undefined,
          design_review_stage: projectId && !changeRequestId && drStage ? drStage : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.message ?? data.error ?? '제안 실패');
        return;
      }
      onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  // ─── 스타일 ───────────────────────────────────────────────
  // input/textarea focus state + picker icon invert(다크 모드).
  // useId 로 클래스를 격리해 다른 모달과 충돌 방지.
  const scopeClass = `qa-meeting-dialog-${styleScopeId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const scopedCss = `
    .${scopeClass} input,
    .${scopeClass} textarea {
      transition: border-color 0.15s ease, background 0.15s ease;
    }
    .${scopeClass} input:focus,
    .${scopeClass} textarea:focus {
      outline: none;
      border-color: ${T.champagne};
      background: ${alpha(T.champagne, 0.04)};
    }
    .${scopeClass} input[type="date"]::-webkit-calendar-picker-indicator,
    .${scopeClass} input[type="time"]::-webkit-calendar-picker-indicator {
      filter: ${theme === 'dark' ? 'invert(0.85) opacity(0.7)' : 'invert(0.3) opacity(0.7)'};
      cursor: pointer;
      transition: opacity 0.15s ease, filter 0.15s ease;
    }
    .${scopeClass} input[type="date"]::-webkit-calendar-picker-indicator:hover,
    .${scopeClass} input[type="time"]::-webkit-calendar-picker-indicator:hover {
      filter: ${theme === 'dark' ? 'invert(0.95) opacity(1)' : 'invert(0.1) opacity(1)'};
    }
  `;

  const inputBase: React.CSSProperties = {
    borderRadius: RADIUS.md,
    width: '100%',
    padding: '10px 12px',
    background: T.surface,
    border: `1px solid ${T.border}`,
    color: T.text,
    fontFamily: F.mono,
    fontSize: FS[13],
    boxSizing: 'border-box',
    colorScheme: theme,
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={dialogTitle ?? '새 회의 제안'}
      sub="참석자에게 일정이 통지됩니다"
      maxWidth={560}
      footer={
        <>
          {err && (
            <span
              role="alert"
              aria-live="assertive"
              style={{
                marginRight: 'auto',
                alignSelf: 'center',
                color: T.red,
                fontSize: FS[12],
                fontFamily: F.mono,
                lineHeight: LH.normal,
              }}
            >
              {err}
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{
              borderRadius: RADIUS.md,
              padding: '10px 18px',
              background: 'transparent',
              color: T.muted,
              border: `1px solid ${T.border}`,
              fontFamily: F.mono,
              fontSize: FS[12],
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy || !title.trim() || !date || !startTime || !endTime}
            style={{
              padding: '10px 22px',
              background: T.text,
              color: T.bg,
              border: 'none',
              fontFamily: F.mono,
              fontSize: FS[12],
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              cursor: busy ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: busy || !title.trim() ? 0.5 : 1,
            }}
          >
            {busy ? '전송 중…' : '회의 제안 · 참석자 통지'}
          </button>
        </>
      }
    >
      <style dangerouslySetInnerHTML={{ __html: scopedCss }} />
      <div className={scopeClass} style={{ display: 'flex', flexDirection: 'column', gap: S[4.5] }}>
        {/* 제목 */}
        <Field id={titleId} label="제목" required>
          <input
            id={titleId}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 설계 입력 검토 회의 (DR-2)"
            style={inputBase}
            disabled={busy}
            autoFocus
            aria-required="true"
          />
        </Field>

        {/* 날짜: 전체 폭, 단독 행 */}
        <Field id={dateId} label="날짜" required>
          <input
            id={dateId}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={inputBase}
            disabled={busy}
            aria-required="true"
          />
        </Field>

        {/* 시작 + 종료: 2분할 (각 칸 충분한 너비로 시간 안 잘림) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: S[3] }}>
          <Field id={startId} label="시작 시간" required>
            <input
              id={startId}
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={inputBase}
              disabled={busy}
              aria-required="true"
            />
          </Field>
          <Field id={endId} label="종료 시간" required>
            <input
              id={endId}
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={inputBase}
              disabled={busy}
              aria-required="true"
            />
          </Field>
        </div>

        {/* 구분선: 위치/링크 그룹 시작 */}
        <SectionDivider label="위치 · 링크" />

        <Field id={locId} label="장소" optional>
          <input
            id={locId}
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="예: 본사 3F 회의실 A"
            style={inputBase}
            disabled={busy}
          />
        </Field>

        <Field id={urlId} label="화상회의 링크" optional>
          <input
            id={urlId}
            type="url"
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
            placeholder="https://meet.google.com/... 또는 Zoom URL"
            style={inputBase}
            disabled={busy}
          />
        </Field>

        {/* DR 연동: 프로젝트 회의일 때 설계검토 단계 지정 → 연결된 DR 게이트 자동 생성.
            단 CR 검토 회의(changeRequestId)면 DR 과 무관하므로 숨김. */}
        {projectId && !changeRequestId && (
          <Field id={drId} label="설계검토(DR) 단계 연결" optional>
            <select
              id={drId}
              value={drStage ?? ''}
              onChange={(e) => setDrStage((e.target.value || null) as DrStage | null)}
              style={inputBase}
              disabled={busy}
            >
              <option value="">연결 안 함 (일반 회의)</option>
              {DR_STAGES.map((s) => (
                <option key={s} value={s}>
                  {DR_STAGE_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
        )}

        {/* 구분선: 안건 / 참석자 */}
        <SectionDivider label="안건 · 참석자" />

        <Field id={agendaId} label="안건" optional>
          <textarea
            id={agendaId}
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
            placeholder="검토 항목 / 의사결정 / 사전 자료 등"
            rows={3}
            style={{
              ...inputBase,
              resize: 'vertical',
              fontFamily: F.serif,
              fontSize: FS[13],
              lineHeight: LH.relaxed,
              padding: '10px 12px',
            }}
            disabled={busy}
          />
        </Field>

        {/* 참석자: 공통 MemberPicker (DesignReviewPanel 과 통일) */}
        <MemberPicker
          members={visibleMembers}
          selectedIds={attendeeIds}
          onToggle={toggleAttendee}
          label="참석자"
          disabled={busy}
          emptyHint="아직 같이 일할 멤버가 없습니다. 설정에서 동료를 초대해 주세요."
          maxHeight={180}
        />
      </div>
    </Modal>
  );
}

// ─── 작은 컴포넌트 ─────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: S[2.5],
        marginTop: S[1],
        marginBottom: -4,
      }}
    >
      <span
        style={{
          fontSize: FS[12],
          color: T.muted,
          fontFamily: F.mono,
          letterSpacing: 1.8,
          textTransform: 'uppercase',
          opacity: 0.7,
        }}
      >
        {label}
      </span>
      <span style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  );
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function hm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
