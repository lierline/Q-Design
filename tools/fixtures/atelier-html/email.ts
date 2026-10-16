import { HTML_STYLE } from '@/lib/design/q-design-html';
import { HTML_PALETTE } from '@/lib/design/q-design-html-palette';
// =============================================================================
// Email: Resend API 래퍼
// =============================================================================
// 환경변수:
//   RESEND_API_KEY    : Resend 콘솔에서 발급 (선택: 없으면 no-op)
//   RESEND_FROM       : 발신 이메일 (예: Q-Atelier <no-reply@qatelier.io>)
//   NEXT_PUBLIC_APP_URL: 링크 절대 URL 생성용

import { describeDue } from '@/lib/reviews/due';
import { externalFetch } from '@/lib/observability/external-fetch';
import { recordServiceFailure } from '@/lib/observability/service-failure';
import { dateOnly } from '@/lib/date';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface SendResult {
  ok: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
}

export async function sendEmail(p: SendEmailParams): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? 'Q-Atelier <onboarding@resend.dev>';

  if (!apiKey) {
    // 개발/시연 환경에서는 조용히 skip (콘솔에 출력)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[email] (no RESEND_API_KEY: skipped)', {
        to: p.to,
        subject: p.subject,
      });
    }
    return { ok: false, skipped: true, error: 'RESEND_API_KEY not configured' };
  }

  try {
    // 🔴 2026-09-12 감사(§1-3). 여기는 맨 fetch 였다. externalFetch 는 추적 도구가 붙이는
    //    baggage 헤더를 떼고 보낸다(정부 API 를 400 으로 죽인 실사고의 보험).
    const res = await externalFetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(p.to) ? p.to : [p.to],
        subject: p.subject,
        html: p.html,
        text: p.text,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = (data.message ?? data.error ?? 'send failed') as string;
      await recordSendFailure(new Error(msg), res.status);
      return { ok: false, error: msg };
    }
    return { ok: true, id: data.id };
  } catch (e) {
    await recordSendFailure(e);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * 메일 발송 실패를 «관측 가능하게» 남긴다.
 *
 * 🔴 2026-09-12 감사(§1-3). 종전에는 실패를 `{ ok: false, error }` 로 «돌려주기만»
 *    했고, 호출부 21곳 중 9곳이 그 값을 버렸다. 그래서 메일이 안 나가도 어디에도
 *    기록이 남지 않았다. openai · anthropic · gemini · mfds · openfda 는 전부
 *    `recordServiceFailure` 를 쓰는데 메일만 빠져 있었다.
 *
 *    메일은 전문가 초대 · 사용자 승인 · 검토 요청의 **유일한 통로**다. 안 나가면
 *    사람이 기다리다 일이 멈추는데, 그 사실을 아무도 모른다. 이 저장소는 이미
 *    3개월짜리 무음 장애를 겪었다.
 *
 * ⚠️ `service: 'other'` 로 적는다. `external_service_failures.service` 의 CHECK 제약에
 *    아직 'resend' 가 없기 때문이다(실측: anthropic · openai · gemini · gateway ·
 *    mfds · hira · openfda · other). 마이그레이션으로 넓히는 것은 별건으로 두고,
 *    지금은 `operation` 에 이름을 실어 구분할 수 있게 한다. 「기록이 아예 없다」보다
 *    「other 로라도 남는다」가 낫다.
 */
async function recordSendFailure(error: unknown, status?: number): Promise<void> {
  await recordServiceFailure({
    service: 'other',
    operation: 'resend.send',
    error,
    status,
  });
}

/**
 * HTML 특수문자 이스케이프: 사용자 유래 값(이름·제목·조직명·자유서술·코드)을 메일
 * 본문에 보간하기 전 XSS/HTML 주입을 차단. 자가가입 사용자가 org_name·소속·전문분야
 * 등에 임의 HTML(피싱 링크·스크립트)을 넣어 운영자/전문가 메일에 주입하던 것 방지(감사 #19).
 * 시스템 라벨(enum→라벨)·URL(appUrl)·하드코딩 문구는 대상 아님.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── 템플릿 ───────────────────────────────────────────────────────────────
// SA-3c: export: 외부 알림 헬퍼(notify-doc-review·notify-license-change·comments)가
//   도메인을 하드코딩하지 않고 이 단일 헬퍼(NEXT_PUBLIC_APP_URL env 우선)를 공유한다.
/** 이 값이 이상하면 돌아갈 곳. 라이브 실측 200 (2026-08-25). */
const FALLBACK_BASE = 'https://www.qatelier.co.kr';

/**
 * 「밖에서 열리는 URL」의 단일 출처. 메일 링크 · 명함 QR 처럼 **우리 브라우저 밖에서**
 * 열리는 주소는 전부 여기를 지난다.
 *
 * 🔴 2026-08-25 오빠와 화면을 둘러보다 손봤다. 종전 코드는 한 줄이었다:
 *      `process.env.NEXT_PUBLIC_APP_URL ?? FALLBACK`
 *    주석에는 「미설정/**잘못 설정**되어도 안전망」이라 적혀 있었지만 **코드는 그렇지 않았다.**
 *
 *    ① `??` 는 `null`·`undefined` 만 막는다. **빈 문자열은 그대로 통과한다.**
 *       (실측: `'' ?? 기본값` → `''` · `'' || 기본값` → 기본값)
 *       빈 값이면 결과가 `/experts/portal?...` 같은 **상대 경로**가 되어,
 *       메일에서는 깨진 링크가 되고 QR 로는 아예 열리지 않는다.
 *       ⚠️ 빈 값은 «있을 법한 실수» 다: Vercel 에 `echo |` 파이프로 넣으면
 *          「Added」를 찍고 빈 값이 들어간다(이 저장소가 이미 겪음).
 *    ② `http://localhost:3000` 같은 «틀린» 값도 그대로 통과한다. 명함에 인쇄된 QR 이
 *       localhost 를 가리키면 되돌릴 수 없다.
 *
 * 🔑 그래서 「비어 있음」이 아니라 **「밖에서 열 수 있는 주소인가」**로 검사한다.
 *    조용히 넘기지 않고 경고를 남긴다. 고장은 화면이 멀쩡해 보일 때 가장 오래 산다.
 */
export function publicBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const bad = (why: string): string => {
    console.warn(
      `[publicBaseUrl] NEXT_PUBLIC_APP_URL 을 쓸 수 없어 기본값으로 돌아갑니다 (${why}): ` +
        `${JSON.stringify(process.env.NEXT_PUBLIC_APP_URL)} → ${FALLBACK_BASE}`,
    );
    return FALLBACK_BASE;
  };
  if (!raw) return bad('비어 있음');
  if (!/^https?:\/\//i.test(raw)) return bad('절대 URL 이 아님');
  // 개발 중에는 localhost 가 «맞는» 값이다. 배포본에서만 막는다.
  if (process.env.NODE_ENV === 'production' && /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(raw)) {
    return bad('프로덕션인데 localhost');
  }
  return raw.replace(/\/$/, '');
}

/**
 * SA-3c: 외부 알림 헬퍼(notify-doc-review·notify-license-change·comments)와
 * 명함 QR 라우트가 도메인을 하드코딩하지 않고 공유하는 단일 헬퍼.
 * ⚠️ 같은 식을 복사하지 말고 **이것을 import** 할 것. 사본은 반드시 어긋난다.
 */
export function appUrl(path: string): string {
  return publicBaseUrl() + path;
}

/**
 * 메일 수신자 축. 푸터 문구·링크가 달라진다.
 *
 * 🔴 2026-08-25 신설. 종전에는 **모든** 메일 푸터가 이렇게 말했다:
 *      「이메일 알림은 [설정]에서 끌 수 있어요.」  (링크: /settings)
 *    그런데 외부 전문가에게는 이 문장이 **세 겹으로 거짓**이었다(실측):
 *      ① `/settings` 는 (app) 영역이라 전문가가 가면 `/experts/inbox` 로 튕긴다
 *      ② `/experts/settings` 에는 알림 제어가 아예 없다
 *      ③ 애초에 전문가 배정 메일은 `email_notify_enabled` 를 **검사하지 않는다**
 *         (그 플래그는 내부 수신자 3곳에서만 쓰인다)
 *
 * 🔑 지키지 못할 약속을 하는 것이 «기능이 없는 것» 보다 나쁘다.
 *    끌 수 없다면 끌 수 있다고 적지 않는다. 대신 «왜 항상 오는지» 를 말한다.
 */
export type EmailAudience = 'internal' | 'expert';

export function shell(title: string, body: string, audience: EmailAudience = 'internal'): string {
  // Appearance is owned by Q-Design concrete HTML recipes for email-client compatibility.
  const domain = appUrl('/').replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="color-scheme" content="light only" /><title>${title}</title></head>
<body style="${HTML_STYLE.body}">
  <div style="${HTML_STYLE.card}">
    <div style="${HTML_STYLE.header}">
      <div style="${HTML_STYLE.wordmark}">Q-Atelier</div>
      <div style="${HTML_STYLE.tagline}">Medical Device Quality, Crafted</div>
    </div>
    <div style="${HTML_STYLE.headerRule}">&nbsp;</div>
    <div style="${HTML_STYLE.content}">
      ${body}
    </div>
    <div style="${HTML_STYLE.footer}">
      <div style="${HTML_STYLE.footerMeta}">
        Q-Atelier · MedQraft<br/>
        <a href="${appUrl('/')}" style="${HTML_STYLE.footerLink}">${domain}</a>
      </div>
      <div style="${HTML_STYLE.footerHint}">
        ${
          audience === 'expert'
            ? `자문 배정 안내는 자문 진행에 필요해 항상 보내드립니다. 수신 주소와 프로필은 <a href="${appUrl('/experts/settings')}" style="${HTML_STYLE.link}">전문가 설정</a>에서 관리하실 수 있습니다.`
            : `이메일 알림은 <a href="${appUrl('/settings')}" style="${HTML_STYLE.link}">설정</a>에서 끌 수 있습니다.`
        }
      </div>
    </div>
  </div>
</body></html>`;
}

export function reviewRequestEmail(opts: {
  assessmentCode: string;
  assessmentTitle: string;
  requesterName: string;
  notes?: string;
  assignmentId: string;
  /** 회신 희망 기한(ISO). 없으면 메일에 기한 줄을 넣지 않는다. */
  dueAt?: string | null;
}) {
  // ★E2: 수신자=외부 전문가. 전문가 자문 상세는 /experts/inbox/[id] (/inbox 는 (app)
  //   가드가 /experts/inbox 로 redirect 하며 assignmentId 를 버림 → 특정 자문 도달 불가).
  const link = appUrl(`/experts/inbox/${opts.assignmentId}`);
  const due = describeDue(opts.dueAt);
  // Canonical generated colors stay concrete for email clients.
  const hot = due.tone === 'overdue' || due.tone === 'urgent';
  const dueBg = hot ? HTML_PALETTE.dangerPanel : HTML_PALETTE.canvas;
  const dueFg = hot ? HTML_PALETTE.danger : HTML_PALETTE.accent;
  const dueLine = due.has
    ? `<div style="${HTML_STYLE.deadlinePanel(dueBg, dueFg)}">
       <strong style="${HTML_STYLE.deadlineLabel(dueFg)}">회신 기한</strong><br/>
       ${escapeHtml(dateOnly(opts.dueAt as string))} · ${escapeHtml(due.label)}
     </div>`
    : '';
  return shell(
    `[${escapeHtml(opts.assessmentCode)}] 검토 요청 도착`,
    `<h2 style="${HTML_STYLE.heading}">새 검토 요청이 도착했습니다</h2>
     <p style="${HTML_STYLE.paragraph}">
       ${escapeHtml(opts.requesterName)} 님이 변경평가에 대한 외부 자문을 요청했습니다.
     </p>
     <div style="${HTML_STYLE.infoCard}">
       <div style="${HTML_STYLE.code}">${escapeHtml(opts.assessmentCode)}</div>
       <div style="${HTML_STYLE.value}">${escapeHtml(opts.assessmentTitle)}</div>
     </div>
     ${opts.notes ? `<div style="${HTML_STYLE.note}">
       <strong style="${HTML_STYLE.noteLabel}">메모</strong><br/>${escapeHtml(opts.notes)}
     </div>` : ''}
     ${
       // 🔑 마감은 메일에서 «가장 먼저» 알아야 할 정보다. 링크를 누르기 전에 급한지
       //    판단할 수 있어야 인박스를 열지 말지 정한다. 기한이 없으면 줄 자체를 안 넣는다
       //    (「기한 없음」이라고 적으면 오히려 «안 급하다» 로 읽힌다).
       dueLine
     }
     <p style="${HTML_STYLE.guide}">아래 링크에서 평가 내용을 확인하고 의견을 제출해주십시오.</p>
     <a href="${link}" style="${HTML_STYLE.action}">검토 시작하기 →</a>`,
    'expert',
  );
}

/**
 * 부작용 보고 메일의 머리글 · 안내. 남은 날(daysLeft)이 음수면 기한이 «지난» 것이다(기한 지남 재알림 2026-09-29).
 * 전에는 음수여도 «-1일 남았습니다 · 기한 내 보고를 진행해 주십시오» 로 나갔다.
 */
export function vigilanceDeadlineCopy(daysLeft: number | undefined): { heading: string; guide: string } {
  if (daysLeft === undefined) {
    return {
      heading: '보고 대상 부작용 사건이 등록되었습니다',
      guide: '법정 기한 내 규제기관 보고가 필요한 사건입니다. 기한을 확인하고 보고를 진행해 주십시오.',
    };
  }
  if (daysLeft < 0) {
    return {
      heading: `부작용 보고 법정 기한이 ${-daysLeft}일 지났습니다`,
      guide: '법정 기한이 지났고 아직 제출 전입니다. 바로 규제기관에 보고하고 늦은 사유를 기록하십시오.',
    };
  }
  if (daysLeft === 0) {
    return {
      heading: '부작용 보고 법정 기한이 오늘입니다',
      guide: '오늘 안에 규제기관 보고를 마치십시오.',
    };
  }
  return {
    heading: `부작용 보고 법정 기한이 ${daysLeft}일 남았습니다`,
    guide: '법정 기한 내 규제기관 보고가 필요한 사건입니다. 기한을 확인하고 보고를 진행해 주십시오.',
  };
}

export function vigilanceReportableEmail(opts: {
  code: string;
  severityLabel: string;
  reportTypeLabel: string;
  deadline: string | null;
  link: string;
  /** 기한 재알림(D-7 · D-3 · D-1, 지난 뒤에는 음수 · 기한 묶음 알림 2026-09-29). 없으면 «등록» 알림. */
  daysLeft?: number;
}) {
  const { heading, guide } = vigilanceDeadlineCopy(opts.daysLeft);
  return shell(
    `[${escapeHtml(opts.code)}] Vigilance 법정기한 보고 대상`,
    `<h2 style="${HTML_STYLE.heading}">${heading}</h2>
     <p style="${HTML_STYLE.paragraph}">
       ${guide}
     </p>
     <div style="${HTML_STYLE.infoCard}">
       <div style="${HTML_STYLE.code}">${escapeHtml(opts.code)} · ${opts.reportTypeLabel}</div>
       <div style="${HTML_STYLE.valueSpaced}">${opts.severityLabel}</div>
       <div style="${HTML_STYLE.caption}">법정 기한: ${opts.deadline ?? '확인 필요'}</div>
     </div>
     <a href="${appUrl(opts.link)}" style="${HTML_STYLE.action}">보고서 열기 →</a>`
  );
}

export function reviewCompletedEmail(opts: {
  assessmentCode: string;
  assessmentTitle: string;
  expertName: string;
  opinionKind: 'agree' | 'partial' | 'disagree';
  assessmentLink: string;
}) {
  const kindLabel =
    opts.opinionKind === 'agree' ? '동의'
    : opts.opinionKind === 'partial' ? '부분 동의'
    : '비동의';
  const kindColor =
    opts.opinionKind === 'agree' ? HTML_PALETTE.success
    : opts.opinionKind === 'partial' ? HTML_PALETTE.warning
    : HTML_PALETTE.danger;
  return shell(
    `[${escapeHtml(opts.assessmentCode)}] 검토 의견 도착`,
    `<h2 style="${HTML_STYLE.heading}">새 검토 의견이 도착했습니다</h2>
     <p style="${HTML_STYLE.paragraph}">
       <strong style="${HTML_STYLE.strong}">${escapeHtml(opts.expertName)}</strong> 님이 검토를 완료하고 의견을 제출했습니다.
     </p>
     <div style="${HTML_STYLE.infoCard}">
       <div style="${HTML_STYLE.code}">${escapeHtml(opts.assessmentCode)}</div>
       <div style="${HTML_STYLE.value}">${escapeHtml(opts.assessmentTitle)}</div>
     </div>
     <div style="${HTML_STYLE.actionWrap}">
       <span style="${HTML_STYLE.opinionBadge(kindColor)}">의견: ${kindLabel.toUpperCase()}</span>
     </div>
     <a href="${appUrl(opts.assessmentLink)}" style="${HTML_STYLE.action}">결과 보기 →</a>`
  );
}

export function reviewDeclinedEmail(opts: {
  assessmentCode: string;
  assessmentTitle: string;
  expertName: string;
  reason?: string;
  assessmentLink: string;
}) {
  return shell(
    `[${escapeHtml(opts.assessmentCode)}] 검토 요청이 거절되었습니다`,
    `<h2 style="${HTML_STYLE.heading}">검토 요청이 거절되었습니다</h2>
     <p style="${HTML_STYLE.paragraph}">
       <strong style="${HTML_STYLE.strong}">${escapeHtml(opts.expertName)}</strong> 님이 검토 요청을 거절했습니다.
     </p>
     <div style="${HTML_STYLE.rejectedCard}">
       <div style="${HTML_STYLE.rejectedCode}">${escapeHtml(opts.assessmentCode)}</div>
       <div style="${HTML_STYLE.value}">${escapeHtml(opts.assessmentTitle)}</div>
     </div>
     ${opts.reason?.trim() ? `<div style="${HTML_STYLE.reasonPanel}">
       <div style="${HTML_STYLE.reasonLabel}">사유</div>
       <div style="${HTML_STYLE.reason}">${escapeHtml(opts.reason.trim())}</div>
     </div>` : ''}
     <p style="${HTML_STYLE.guide}">다른 전문가에게 재요청하시거나 평가를 자체 진행하실 수 있습니다.</p>
     <a href="${appUrl(opts.assessmentLink)}" style="${HTML_STYLE.action}">평가로 이동 →</a>`
  );
}

export function rdReviewNotificationEmail(opts: {
  assessmentCode: string;
  assessmentTitle: string;
  raqaName: string;
  riskLevel: string;
  regulatoryImpact: string;
  changeTarget: string;
  rdImpactSummary: string;
  assessmentLink: string;
}) {
  const riskColor =
    opts.riskLevel === 'CRITICAL' ? HTML_PALETTE.danger
    : opts.riskLevel === 'HIGH' ? HTML_PALETTE.danger
    : opts.riskLevel === 'MEDIUM' ? HTML_PALETTE.warning
    : HTML_PALETTE.success;
  return shell(
    `[${escapeHtml(opts.assessmentCode)}] R&D 검토 요청: ${escapeHtml(opts.assessmentTitle)}`,
    `<h2 style="${HTML_STYLE.heading}">변경평가에 R&D 영향이 있습니다</h2>
     <p style="${HTML_STYLE.paragraph}">
       <strong style="${HTML_STYLE.strong}">${escapeHtml(opts.raqaName)}</strong> 님 (RA/QA)이 생성한 변경평가에서 R&D 영향이 식별되어 검토 요청드립니다.
     </p>
     <div style="${HTML_STYLE.infoCard}">
       <div style="${HTML_STYLE.code}">${escapeHtml(opts.assessmentCode)}</div>
       <div style="${HTML_STYLE.valueMargin}">${escapeHtml(opts.assessmentTitle)}</div>
       <div style="${HTML_STYLE.mutedCaption}">변경 대상: ${escapeHtml(opts.changeTarget)}</div>
     </div>
     <div style="${HTML_STYLE.badgeRow}">
       <span style="${HTML_STYLE.riskBadge(riskColor)}">위험도: ${opts.riskLevel}</span>
       <span style="${HTML_STYLE.neutralBadge}">규제: ${opts.regulatoryImpact.replace(/_/g, ' ')}</span>
     </div>
     ${opts.rdImpactSummary ? `<div style="${HTML_STYLE.reasonPanelAlternate}">
       <div style="${HTML_STYLE.reasonLabel}">R&D 영향 체크</div>
       <div style="${HTML_STYLE.reasonSmall}">${escapeHtml(opts.rdImpactSummary)}</div>
     </div>` : ''}
     <p style="${HTML_STYLE.guide}">설계·성능·안전성 검토 후 의견을 RA/QA 담당자에게 전달해주십시오.</p>
     <a href="${appUrl(opts.assessmentLink)}" style="${HTML_STYLE.action}">평가 결과 보기 →</a>`
  );
}

export function signupAdminNotificationEmail(opts: {
  email: string;
  fullName: string;
  audience: 'company' | 'expert';
  jobRole?: string | null;
  orgName?: string | null;
  specialty?: string | null;
  affiliation?: string | null;
}): { subject: string; html: string } {
  const audienceLabel = opts.audience === 'expert' ? '외부 자문 전문가' : '기업';
  const rows: Array<[string, string]> = [
    ['이메일', opts.email],
    ['이름', opts.fullName || '-'],
    ['유형', audienceLabel],
  ];
  if (opts.audience === 'company') {
    if (opts.orgName) rows.push(['조직', opts.orgName]);
    if (opts.jobRole) rows.push(['직무', opts.jobRole]);
  } else {
    if (opts.specialty) rows.push(['전문 분야', opts.specialty]);
    if (opts.affiliation) rows.push(['소속', opts.affiliation]);
  }
  const tableRows = rows
    .map(
      ([k, v]) => `<tr>
        <td style="${HTML_STYLE.tableLabel}">${k}</td>
        <td style="${HTML_STYLE.tableValue}">${escapeHtml(v)}</td>
      </tr>`,
    )
    .join('');
  const subject = `[Q-Atelier] 신규 회원가입: ${opts.email} (${audienceLabel})`;
  const html = shell(
    '신규 회원가입',
    `<h2 style="${HTML_STYLE.sectionHeading}">신규 회원가입 완료</h2>
     <p style="${HTML_STYLE.paragraphSmall}">신규 사용자가 가입을 완료했습니다. 필요 시 관리자 페이지에서 확인하십시오.</p>
     <table style="${HTML_STYLE.infoTable}">
       ${tableRows}
     </table>
     <a href="${appUrl('/admin/subscriptions')}" style="${HTML_STYLE.actionCompact}">관리자 페이지 →</a>`,
  );
  return { subject, html };
}

export function signupApprovedEmail(opts: {
  email: string;
  fullName: string;
}): { subject: string; html: string } {
  const greeting = escapeHtml(opts.fullName || opts.email);
  return {
    subject: '[Q-Atelier] 가입 승인 완료',
    html: shell(
      '가입 승인 완료',
      `<h2 style="${HTML_STYLE.heading}">${greeting} 님, 가입이 승인되었습니다</h2>
       <p style="${HTML_STYLE.paragraphRelaxed}">
         Q-Atelier 회원가입이 승인되어 이제 서비스를 정상적으로 이용하실 수 있습니다.
         아래 버튼을 눌러 로그인 후 대시보드로 이동하십시오.
       </p>
       <a href="${appUrl('/login')}" style="${HTML_STYLE.action}">로그인 →</a>
       <p style="${HTML_STYLE.finePrint}">
         문의: contact@medqraft.co.kr
       </p>`,
    ),
  };
}

export function accountDeactivatedEmail(opts: {
  email: string;
  fullName: string;
}): { subject: string; html: string } {
  const greeting = escapeHtml(opts.fullName || opts.email);
  return {
    subject: '[Q-Atelier] 계정 비활성화 안내',
    html: shell(
      '계정 비활성화',
      `<h2 style="${HTML_STYLE.heading}">${greeting} 님, 계정이 비활성화되었습니다</h2>
       <p style="${HTML_STYLE.paragraphRelaxed}">
         관리자에 의해 본 계정이 비활성화되어 현재 로그인이 불가능합니다.
         재활성화가 필요하신 경우 아래 이메일로 문의해주십시오.
       </p>
       <p style="${HTML_STYLE.paragraphGap}">
         문의: <a href="mailto:contact@medqraft.co.kr" style="${HTML_STYLE.link}">contact@medqraft.co.kr</a>
       </p>`,
    ),
  };
}

export function signupRejectedEmail(opts: {
  email: string;
  fullName: string;
}): { subject: string; html: string } {
  const greeting = escapeHtml(opts.fullName || opts.email);
  return {
    subject: '[Q-Atelier] 가입 승인 결과 안내',
    html: shell(
      '가입 승인 결과',
      `<h2 style="${HTML_STYLE.heading}">${greeting} 님, 가입 승인이 거절되었습니다</h2>
       <p style="${HTML_STYLE.paragraphRelaxed}">
         검토 결과 본 가입 신청은 승인되지 않았습니다. 자세한 사유나 재신청
         절차는 아래 이메일로 문의해주십시오.
       </p>
       <p style="${HTML_STYLE.paragraphGap}">
         문의: <a href="mailto:contact@medqraft.co.kr" style="${HTML_STYLE.link}">contact@medqraft.co.kr</a>
       </p>`,
    ),
  };
}

export function expertVerifiedEmail(opts: { fullName: string; verified: boolean }) {
  return shell(
    opts.verified ? '전문가 인증 완료' : '전문가 인증 반려',
    opts.verified
      ? `<h2 style="${HTML_STYLE.heading}">${escapeHtml(opts.fullName)} 님, 전문가 인증이 완료되었습니다</h2>
         <p style="${HTML_STYLE.paragraphLargeGap}">
           이제 자문 요청 시 verified 배지가 표시되며, RA/QA에게 우선 매칭됩니다.
         </p>
         <a href="${appUrl('/experts/inbox')}" style="${HTML_STYLE.action}">인박스로 이동 →</a>`
      : `<h2 style="${HTML_STYLE.heading}">전문가 인증이 반려되었습니다</h2>
         <p style="${HTML_STYLE.paragraphLargeGap}">
           제출하신 자격 정보가 충분하지 않습니다. 프로필을 보완하여 재제출해주십시오.
         </p>
         <a href="${appUrl('/experts/settings')}" style="${HTML_STYLE.action}">프로필 보완 →</a>`,
    'expert',
  );
}
