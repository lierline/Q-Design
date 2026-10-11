import { F, FS, LH, RADIUS, S } from './tokens';

// UI values are CSS references. Engine, chart and geometry consumers retain numeric tokens.
function cssScale<T extends Record<string, number>>(name: string, values: T, unit: string): { [K in keyof T]: string } {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [
    key, `var(--qd-${name}-${key.replaceAll('.', '-')}, ${value}${unit})`,
  ])) as { [K in keyof T]: string };
}

export const QDScale = {
  space: cssScale('space', S, 'px'),
  font: cssScale('font-size', FS, 'px'),
  leading: cssScale('leading', LH, ''),
  family: {
    ui: `var(--qd-font-family-ui, ${F.ui})`,
    serif: `var(--qd-font-family-ui, ${F.serif})`,
    mono: `var(--qd-font-family-mono, ${F.mono})`,
    display: `var(--qd-font-family-display, ${F.display})`,
  },
  radius: `var(--qd-radius, ${RADIUS.md}px)`,
  radiusFull: `var(--qd-radius-full, ${RADIUS.pill}px)`,
} as const;
