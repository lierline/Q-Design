// Q-Design owns axis label density. Width and font size are actual DOM measurements.
export const CHART_LABEL_LAYOUT = {
  minimumSpacing: 112,
  fontBaseline: 12,
  minimumCount: 2,
  yAnchor: 'end',
  aspectRatio: 'none',
  emptyPaint: 'none',
  axisColumns: 'minmax(0, 1fr)',
} as const;

export function chartLabelIndices(length: number, width: number, fontSize: number, maximumCount: number): number[] {
  if (length <= 1) return length === 1 ? [0] : [];
  const spacing = CHART_LABEL_LAYOUT.minimumSpacing * fontSize / CHART_LABEL_LAYOUT.fontBaseline;
  const count = Math.min(length, Math.max(CHART_LABEL_LAYOUT.minimumCount, maximumCount), Math.max(CHART_LABEL_LAYOUT.minimumCount, Math.floor(width / spacing)));
  return Array.from({ length: count }, (_, i) => Math.round(i * (length - 1) / (count - 1)));
}

export function chartLabelColumns(count: number): string {
  return `repeat(${count}, minmax(0, 1fr))`;
}

export function chartLabelAlignment(index: number, count: number): 'start' | 'center' | 'end' {
  return count > 1 && index === 0 ? 'start' : count > 1 && index === count - 1 ? 'end' : 'center';
}

export function chartPadding(fontSize: number, base: { top: number; right: number; bottom: number; left: number }) {
  const scale = Math.max(1, fontSize / CHART_LABEL_LAYOUT.fontBaseline);
  return { top: base.top * scale, right: base.right * scale, bottom: base.bottom * scale, left: base.left * scale };
}

export function chartLabelStyle(indices: number[], position: number, length: number, gap: string) {
  if (length < 1 || !Number.isInteger(position) || position < 0 || position >= indices.length || indices.some(index => !Number.isInteger(index) || index < 0 || index >= length)) throw new RangeError('Chart label must reference an existing data point');
  const anchors = indices.map(index => length === 1 ? 50 : index * 100 / (length - 1));
  const anchor = anchors[position]!;
  const first = position === 0, last = position === indices.length - 1;
  const slot = indices.length === 1 ? 100 : first ? (anchors[1]! - anchor) / 2 : last ? (anchor - anchors[position - 1]!) / 2 : Math.min(anchor - anchors[position - 1]!, anchors[position + 1]! - anchor);
  return {
    gridArea: '1 / 1',
    minWidth: 0,
    overflowWrap: 'anywhere' as const,
    width: `calc(${slot}% - ${gap})`,
    marginLeft: `${anchor}%`,
    transform: indices.length === 1 ? 'translateX(-50%)' : first ? 'none' : last ? 'translateX(-100%)' : 'translateX(-50%)',
    textAlign: chartLabelAlignment(position, indices.length),
  };
}
