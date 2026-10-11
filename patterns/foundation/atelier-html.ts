/** Q-Design canon for standalone email and export HTML.
 * Concrete inline CSS is required by email clients. Content, recipients and
 * escaping stay in product code. Change these recipes, then scoped sync.
 */
import { HTML_PALETTE, HTML_METRICS } from "./q-design-html-palette";

type HtmlPalette = { [K in keyof typeof HTML_PALETTE]: string };
const checkedColor = (value: string) => { if (!/^#[\da-f]{6}$/i.test(value)) throw new Error("HTML style color must be a canonical six-digit hex"); return value; };

type HtmlMetrics = { [K in keyof typeof HTML_METRICS]: string };

export function buildHtmlStyles(p: HtmlPalette, metrics: HtmlMetrics = HTML_METRICS) {
  // Recipes are inserted inside double-quoted HTML attributes. Keep standalone
  // stylesheet values raw, but encode font names here so canonical quotes are safe.
  const m = Object.fromEntries(Object.entries(metrics).map(([key, value]) =>
    [key, value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')])) as HtmlMetrics;
  return {
    body: `margin:0;padding:0;background:${p.canvas};font-family:${m.fontUI};color:${p.text};`,
    card: `max-width:560px;margin:32px auto;background:${p.surface};border:1px solid ${p.border};border-radius:${m.radius};overflow:hidden;`,
    header: `background:${p.text};padding:26px 32px 22px;`,
    wordmark: `font-family:${m.fontBrand};font-size:23px;color:${p.brand};line-height:1;letter-spacing:0.5px;`,
    tagline: `font-family:${m.fontMono};font-size:${m.captionSize};color:${p.onDarkMuted};letter-spacing:3px;text-transform:uppercase;margin-top:8px;`,
    headerRule: `height:2px;font-size:0;line-height:0;background:${p.border};`,
    content: `padding:32px;`,
    footer: `background:${p.panel};border-top:1px solid ${p.border};padding:20px 32px;`,
    footerMeta: `font-size:${m.captionSize};color:${p.muted};font-family:${m.fontMono};letter-spacing:0.5px;line-height:1.7;`,
    footerLink: `color:${p.accent};text-decoration:none;`,
    footerHint: `font-size:${m.captionSize};color:${p.muted};margin-top:8px;`,
    link: `color:${p.accent};`,
    deadlinePanel: (dueBg: string, dueFg: string) => `padding:10px 14px;background:${checkedColor(dueBg)};border:1px solid ${checkedColor(dueFg)};font-size:${m.controlSize};color:${p.subtle};line-height:1.6;margin-bottom:18px;border-radius:${m.radius};`,
    deadlineLabel: (dueFg: string) => `color:${checkedColor(dueFg)};letter-spacing:1px;font-size:${m.captionSize};font-family:${m.fontMono};`,
    heading: `font-family:${m.fontUI};font-size:${m.titleSize};margin:0 0 12px;`,
    paragraph: `font-size:${m.bodySize};line-height:1.6;color:${p.subtle};margin:0 0 16px;`,
    infoCard: `padding:14px 16px;background:${p.panel};border:1px solid ${p.accent};margin:0 0 18px;border-radius:${m.radius};`,
    code: `font-family:${m.fontMono};font-size:${m.captionSize};color:${p.accent};letter-spacing:1px;margin-bottom:4px;`,
    value: `font-size:${m.bodySize};color:${p.text};`,
    note: `padding:10px 14px;background:${p.canvas};border:1px solid ${p.accent};font-size:${m.captionSize};color:${p.subtle};line-height:1.6;margin-bottom:18px;border-radius:${m.radius};`,
    noteLabel: `color:${p.accent};letter-spacing:1px;font-size:${m.captionSize};font-family:${m.fontMono};`,
    guide: `font-size:${m.controlSize};color:${p.subtle};margin:0 0 24px;`,
    action: `display:inline-block;background:${p.accent};color:${p.surface};text-decoration:none;min-height:${m.controlHeight};box-sizing:border-box;padding:12px 24px;line-height:20px;font-size:${m.controlSize};font-weight:600;font-family:${m.fontUI};border-radius:${m.radius};`,
    valueSpaced: `font-size:${m.bodySize};color:${p.text};margin-bottom:6px;`,
    caption: `font-size:${m.captionSize};color:${p.subtle};`,
    strong: `color:${p.text};`,
    actionWrap: `margin:0 0 24px;`,
    opinionBadge: (kindColor: string) => `display:inline-block;padding:4px 10px;border:1px solid ${checkedColor(kindColor)};color:${checkedColor(kindColor)};font-family:${m.fontMono};font-size:${m.captionSize};letter-spacing:1px;`,
    rejectedCard: `padding:14px 16px;background:${p.panel};border:1px solid ${p.danger};margin:0 0 18px;border-radius:${m.radius};`,
    rejectedCode: `font-family:${m.fontMono};font-size:${m.captionSize};color:${p.danger};letter-spacing:1px;margin-bottom:4px;`,
    reasonPanel: `margin:0 0 18px;padding:12px 14px;background:${p.canvas};border:1px solid ${p.borderStrong};border-radius:${m.radius};`,
    reasonLabel: `font-size:${m.captionSize};color:${p.muted};letter-spacing:1.5px;text-transform:uppercase;font-family:${m.fontMono};margin-bottom:4px;`,
    reason: `font-size:${m.controlSize};color:${p.subtle};white-space:pre-wrap;`,
    valueMargin: `font-size:${m.bodySize};color:${p.text};margin-bottom:8px;`,
    mutedCaption: `font-size:${m.captionSize};color:${p.subtle};`,
    badgeRow: `margin:0 0 18px;display:flex;gap:8px;flex-wrap:wrap;`,
    riskBadge: (riskColor: string) => `display:inline-block;padding:4px 10px;border:1px solid ${checkedColor(riskColor)};color:${checkedColor(riskColor)};font-family:${m.fontMono};font-size:${m.captionSize};letter-spacing:1px;`,
    neutralBadge: `display:inline-block;padding:4px 10px;border:1px solid ${p.muted};color:${p.subtle};font-family:${m.fontMono};font-size:${m.captionSize};letter-spacing:1px;`,
    reasonPanelAlternate: `padding:12px 14px;background:${p.canvas};border:1px solid ${p.borderStrong};margin:0 0 18px;border-radius:${m.radius};`,
    reasonSmall: `font-size:${m.captionSize};color:${p.subtle};white-space:pre-wrap;`,
    tableLabel: `padding:6px 12px;color:${p.muted};font-size:${m.captionSize};letter-spacing:1px;text-transform:uppercase;font-family:${m.fontMono};white-space:nowrap;`,
    tableValue: `padding:6px 12px;color:${p.text};font-size:${m.controlSize};`,
    sectionHeading: `font-family:${m.fontUI};font-size:${m.overlayTitleSize};margin:0 0 16px;`,
    paragraphSmall: `font-size:${m.controlSize};color:${p.subtle};margin:0 0 16px;`,
    infoTable: `width:100%;border-collapse:collapse;background:${p.panel};border:1px solid ${p.border};margin:0 0 20px;`,
    actionCompact: `display:inline-block;background:${p.accent};color:${p.surface};text-decoration:none;min-height:${m.controlHeight};box-sizing:border-box;padding:12px 24px;line-height:20px;font-size:${m.controlSize};font-weight:600;font-family:${m.fontUI};border-radius:${m.radius};`,
    paragraphRelaxed: `font-size:${m.bodySize};line-height:1.7;color:${p.subtle};margin:0 0 20px;`,
    finePrint: `font-size:${m.captionSize};color:${p.muted};margin:24px 0 0;line-height:1.6;`,
    paragraphGap: `font-size:${m.controlSize};color:${p.subtle};margin:0 0 20px;`,
    paragraphLargeGap: `font-size:${m.bodySize};line-height:1.6;color:${p.subtle};margin:0 0 24px;`,
    approvedCard: `padding:14px 16px;background:${p.panel};border:1px solid ${p.success};margin:0 0 18px;border-radius:${m.radius};`,
    approvedCode: `font-family:${m.fontMono};font-size:${m.captionSize};color:${p.success};letter-spacing:1px;margin-bottom:4px;`,
    finalApprovalCard: `padding:14px 16px;background:${p.panel};border:1px solid ${p.accent};margin:0 0 18px;border-radius:${m.radius};`,
    finalApprovalCode: `font-family:${m.fontMono};font-size:${m.captionSize};color:${p.accent};letter-spacing:1px;margin-bottom:4px;`,
    finalApprovalAction: `display:inline-block;background:${p.accent};color:${p.surface};text-decoration:none;min-height:${m.controlHeight};box-sizing:border-box;padding:12px 24px;line-height:20px;font-size:${m.controlSize};font-weight:600;font-family:${m.fontUI};border-radius:${m.radius};`,
    comment: `font-size:${m.controlSize};color:${p.text};line-height:1.6;`,
    divider: `margin:40px 0;border:none;border-top:1px solid ${p.border};`,
  };
}

export const HTML_STYLE = buildHtmlStyles(HTML_PALETTE);

export function buildExportStyles(p: HtmlPalette, m: HtmlMetrics = HTML_METRICS) { return `
  body{font-family:${m.fontUI};max-width:900px;
       margin:40px auto;padding:0 20px;line-height:1.7;color:${p.text}}
  h1{font-size:${m.titleSize};margin-bottom:4px} h2{font-size:${m.overlayTitleSize};margin-top:36px}
  .sub{color:${p.muted};font-size:${m.bodySize};margin-top:0}
  table{border-collapse:collapse;width:100%;font-size:${m.bodySize};margin:12px 0}
  th,td{border:1px solid ${p.border};padding:6px 10px;text-align:left}
  th{background:${p.panel}}
  td.n{text-align:right;font-variant-numeric:tabular-nums}
  .warn{background:${p.warningPanel};border:1px solid ${p.warning};border-radius:${m.radius};padding:14px 16px;margin:18px 0}
  .note{background:${p.infoPanel};border:1px solid ${p.info};border-radius:${m.radius};padding:14px 16px;margin:18px 0}
  code{background:${p.panel};padding:1px 5px;border-radius:${m.radius};font-size:${m.controlSize}}
`; }
export const EXPORT_STYLE = buildExportStyles(HTML_PALETTE);
