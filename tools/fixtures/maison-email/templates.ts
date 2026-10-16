/** Email markup and business copy. Appearance comes from Q-Design's email canon. */

import { appUrl as resolveAppUrl } from "@/lib/utils/app-url";
import { EMAIL_LAYOUT, EMAIL_STYLES } from "@/lib/design/q-design-email";

function shell(opts: {
  title: string;
  preheader?: string;
  body: string;
  cta?: { label: string; url: string };
}) {
  const appUrl = resolveAppUrl();
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escape(opts.title)}</title>
</head>
<body style="${EMAIL_STYLES.body}">
  ${opts.preheader ? `<div style="${EMAIL_STYLES.preheader}">${escape(opts.preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${EMAIL_STYLES.outerTable}">
    <tr>
      <td align="center" style="${EMAIL_STYLES.outerCell}">
        <table role="presentation" width="${EMAIL_LAYOUT.width}" cellpadding="0" cellspacing="0" border="0" style="${EMAIL_STYLES.card}">
          <tr>
            <td style="${EMAIL_STYLES.header}">
              <div style="${EMAIL_STYLES.brand}">Q-MAISON · QMS</div>
              <h1 style="${EMAIL_STYLES.title}">${escape(opts.title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="${EMAIL_STYLES.content}">
              ${opts.body}
              ${
                opts.cta
                  ? `<div style="${EMAIL_STYLES.ctaWrap}">
                  <a href="${escape(opts.cta.url)}" style="${EMAIL_STYLES.cta}">${escape(opts.cta.label)}</a>
                </div>`
                  : ""
              }
            </td>
          </tr>
          <tr>
            <td style="${EMAIL_STYLES.footer}">
              본 메일은 Q-Maison 워크플로우에서 자동 발송되었습니다.<br />
              알림 설정은 <a href="${appUrl}/notifications" style="${EMAIL_STYLES.link}">${appUrl}/notifications</a> 에서 관리하세요.
            </td>
          </tr>
        </table>
        <p style="${EMAIL_STYLES.copyright}">
          © ${new Date().getFullYear()} Q-Maison · Designed &amp; Developed by Kayden Kim · SoonWon Jung
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** 결재 요청 (검토자에게) */
export function approvalRequestEmail(input: {
  recipientName: string;
  documentNo: string;
  documentTitle: string;
  level: string;
  requesterName: string;
  comment?: string | null;
  documentUrl: string;
}): { subject: string; html: string } {
  const subject = `[결재 요청] ${input.documentNo} ${input.documentTitle}`;
  const body = `
    <p style="${EMAIL_STYLES.greeting}"><strong>${escape(input.recipientName)}</strong> 님,</p>
    <p style="${EMAIL_STYLES.paragraph}">새 결재 요청이 도착했습니다. 검토 후 승인 또는 반려해 주세요.</p>
    <table cellpadding="${EMAIL_LAYOUT.infoCellPadding}" cellspacing="0" style="${EMAIL_STYLES.infoTable}">
      <tr><td style="${EMAIL_STYLES.documentLabel}">문서번호</td><td><strong style="${EMAIL_STYLES.documentNo}">${escape(input.documentNo)}</strong></td></tr>
      <tr><td style="${EMAIL_STYLES.label}">레벨</td><td>${escape(input.level)}</td></tr>
      <tr><td style="${EMAIL_STYLES.label}">제목</td><td><strong>${escape(input.documentTitle)}</strong></td></tr>
      <tr><td style="${EMAIL_STYLES.label}">요청자</td><td>${escape(input.requesterName)}</td></tr>
      ${input.comment ? `<tr><td style="${EMAIL_STYLES.commentLabel}">코멘트</td><td style="${EMAIL_STYLES.comment}">${escape(input.comment)}</td></tr>` : ""}
    </table>`;
  return {
    subject,
    html: shell({
      title: "결재 요청",
      preheader: `${input.documentNo} 결재 요청: ${input.requesterName}`,
      body,
      cta: { label: "문서 검토하기", url: input.documentUrl },
    }),
  };
}

/** 결재 결과 (요청자에게): approved / rejected / published */
export function approvalResultEmail(input: {
  recipientName: string;
  documentNo: string;
  documentTitle: string;
  action: "approved" | "rejected" | "published" | "retired";
  actorName: string;
  comment?: string | null;
  documentUrl: string;
}): { subject: string; html: string } {
  const ACTION_LABEL: Record<typeof input.action, string> = {
    approved: "승인됨",
    rejected: "반려됨",
    published: "발행됨",
    retired: "폐기됨",
  };
  const label = ACTION_LABEL[input.action];
  const subject = `[${label}] ${input.documentNo} ${input.documentTitle}`;
  const body = `
    <p style="${EMAIL_STYLES.greeting}"><strong>${escape(input.recipientName)}</strong> 님,</p>
    <p style="${EMAIL_STYLES.paragraph}">문서 결재가 처리되었습니다.</p>
    <div style="${EMAIL_STYLES.action(input.action)}">${escape(label)}</div>
    <table cellpadding="${EMAIL_LAYOUT.infoCellPadding}" cellspacing="0" style="${EMAIL_STYLES.resultTable}">
      <tr><td style="${EMAIL_STYLES.documentLabel}">문서번호</td><td><strong style="${EMAIL_STYLES.documentNo}">${escape(input.documentNo)}</strong></td></tr>
      <tr><td style="${EMAIL_STYLES.label}">제목</td><td><strong>${escape(input.documentTitle)}</strong></td></tr>
      <tr><td style="${EMAIL_STYLES.label}">처리자</td><td>${escape(input.actorName)}</td></tr>
      ${input.comment ? `<tr><td style="${EMAIL_STYLES.commentLabel}">코멘트</td><td style="${EMAIL_STYLES.comment}">${escape(input.comment)}</td></tr>` : ""}
    </table>`;
  return {
    subject,
    html: shell({
      title: `결재 ${label}`,
      preheader: `${input.documentNo} ${label}: ${input.actorName}`,
      body,
      cta: { label: "문서 보기", url: input.documentUrl },
    }),
  };
}

/** 알림 일반 (NC/CAPA 등): 보조 알림 채널 */
export function genericNotificationEmail(input: {
  recipientName: string;
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
}): { subject: string; html: string } {
  const body = `
    <p style="${EMAIL_STYLES.greeting}"><strong>${escape(input.recipientName)}</strong> 님,</p>
    <p style="${EMAIL_STYLES.message}">${escape(input.message)}</p>`;
  return {
    subject: `[Q-Maison] ${input.title}`,
    html: shell({
      title: input.title,
      preheader: input.message.slice(0, 100),
      body,
      cta:
        input.actionLabel && input.actionUrl
          ? { label: input.actionLabel, url: input.actionUrl }
          : undefined,
    }),
  };
}
