/** Email appearance canon. Concrete inline declarations support email clients.
 * Screen auth/layout variables do not apply to standalone email documents.
 * Business copy, destinations and HTML escaping stay with product templates.
 */
import { EMAIL_PALETTE } from "./q-design-email-palette";

export const EMAIL_LAYOUT = { width: 560, infoCellPadding: 6 } as const;
type EmailPalette = { [K in keyof typeof EMAIL_PALETTE]: string };

export function buildEmailStyles(p: EmailPalette) {
  const action = { approved: p.approved, rejected: p.rejected, published: p.published, retired: p.retired };
  return {
    body: `margin:0;padding:0;background:${p.paper};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${p.text};`,
    preheader: "display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;",
    outerTable: `background:${p.paper};`,
    outerCell: "padding:32px 16px;",
    card: `max-width:${EMAIL_LAYOUT.width}px;background:${p.white};border-radius:8px;overflow:hidden;border:1px solid ${p.champagne}33;`,
    header: `background:${p.ink};padding:20px 28px;`,
    brand: `font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:${p.champagne};font-weight:700;`,
    title: `margin:6px 0 0 0;font-size:18px;color:${p.ivory};font-weight:600;`,
    content: `padding:28px;font-size:14px;line-height:1.6;color:${p.text};`,
    ctaWrap: "margin-top:24px;text-align:center;",
    cta: `display:inline-block;padding:10px 24px;background:${p.ink};color:${p.ivory};text-decoration:none;border-radius:6px;font-weight:600;font-size:13px;`,
    footer: `padding:16px 28px 24px;border-top:1px solid ${p.champagne}22;font-size:11px;color:${p.textMuted};line-height:1.5;`,
    link: `color:${p.champagneDeep};`,
    copyright: `margin:16px 0 0;font-size:10px;color:${p.textMuted};letter-spacing:0.2em;text-transform:uppercase;`,
    greeting: "margin:0 0 12px;",
    paragraph: "margin:0 0 16px;",
    message: "margin:0 0 16px;white-space:pre-wrap;",
    infoTable: `font-size:13px;background:${p.panel};border-radius:6px;width:100%;`,
    resultTable: `font-size:13px;background:${p.panel};border-radius:6px;width:100%;margin-top:8px;`,
    documentLabel: `color:${p.textMuted};width:90px;`,
    label: `color:${p.textMuted};`,
    documentNo: `font-family:Menlo,Consolas,monospace;color:${p.champagneDeep};`,
    commentLabel: `color:${p.textMuted};vertical-align:top;`,
    comment: "white-space:pre-wrap;",
    action: (name: keyof typeof action) => `display:inline-block;padding:6px 14px;background:${action[name]};color:${p.white};border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;`,
  };
}

export const EMAIL_STYLES = buildEmailStyles(EMAIL_PALETTE);
