/** Numeric appearance inputs also used by layout calculations or canvas APIs.
 * Edit this canon, sync and rebuild. Data-derived positions remain in consumers. */
export const qdMaison = {
  toastPosition: "top-right",
  logoSize: 96,
  logoRailSize: 108,
  logoLegalSize: 28,
  logoAuthMobileSize: 56,
  qrSize: 96,
  calendarPopover: { width: 280, estimatedHeight: 180, edge: 8, gap: 6 },
  statRowColumns: { purchasingAnalysis: 4, kpiClassification: 4 },
  chart: {
    axisLabelGap: 4,
    axisLabelBaseline: 3,
    targetLabelGap: 4,
    trend: { width: 600, height: 180, paddingX: 40, paddingY: 22, labelBottom: 6, tooltipTopThreshold: 0.2, tooltipTransform: "translateY(-50%)", lineCap: "round", lineJoin: "round" },
    period: { width: 600, height: 170, paddingX: 44, paddingTop: 16, paddingBottom: 26, rightInset: 12, lineEndInset: 6, barSlotRatio: 0.6, barMaxWidth: 36, barMinHeight: 1, labelBottom: 8, tooltipTopThreshold: 0.34, tooltipTransform: "translateY(-100%)" },
  },
  ribbon: { start: "0%", primaryMidpoint: "40%", secondaryMidpoint: "50%", end: "100%", edgeOpacity: 0, midpointOpacity: 1, lineCap: "round" },
} as const;
