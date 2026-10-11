// Q-Design owns UI label typography. Language detection remains in the locked pure helper.
import { hasHangul } from '@/lib/design/tokens';

export const QDText = {
  "tracking": {
    "codeDefault": 0,
    "codeMeta": "0.06em",
    "codeFine": 0.3,
    "v1a948f1b43": 1.4,
    "v4be350027f": "0.14em",
    "v6b86b273ff": 1,
    "v77ac319bfe": 1.2,
    "v7c1681a74c": "0.12em",
    "v914204c25f": 2.2,
    "v9f29a13043": 1.5,
    "vae83a9aee5": "0.1em",
    "vd2cbad71ff": 0.5,
    "vec6c168f44": 1.6,
    "vf3e360d899": 0.4
  },
  "fontStyle": {
    "v2cd63dd677": "italic",
    "v82fbb169e7": "normal"
  },
  "textDecoration": {
    "v30a0924a33": "none",
    "v9c3ff05cab": "underline",
    "vbfa27938af": "line-through"
  },
  "textTransform": {
    "v30a0924a33": "none",
    "v642d85873e": "uppercase"
  },
  "wordSpacing": {
    "v82fbb169e7": "normal"
  }
} as const;

export const LABEL = {
  defaultTracking: '0.08em',
  hangulTracking: 0,
  hangulWordSpacing: '-0.35em',
  hangulCase: 'none',
  latinCase: 'uppercase',
} as const;

export function labelTracking(node: unknown, value: number | string = LABEL.defaultTracking): number | string {
  return hasHangul(node) ? LABEL.hangulTracking : value;
}

export function labelWordSpacing(node: unknown): string | undefined {
  return hasHangul(node) ? LABEL.hangulWordSpacing : undefined;
}

export function labelCase(node: unknown): typeof LABEL.hangulCase | typeof LABEL.latinCase {
  return hasHangul(node) ? LABEL.hangulCase : LABEL.latinCase;
}

// UI-only counterpart of the protected legacy TYPE ladder.
export const QDType = {
  "display": {
    "fontFamily": "var(--qd-atelier-type-display-font-family)",
    "fontSize": "var(--qd-atelier-type-display-font-size)",
    "fontWeight": "var(--qd-atelier-type-display-font-weight)",
    "letterSpacing": "var(--qd-atelier-type-display-letter-spacing)",
    "lineHeight": "var(--qd-atelier-type-display-line-height)"
  },
  "h1": {
    "fontFamily": "var(--qd-atelier-type-h1-font-family)",
    "fontSize": "var(--qd-atelier-type-h1-font-size)",
    "fontWeight": "var(--qd-atelier-type-h1-font-weight)",
    "letterSpacing": "var(--qd-atelier-type-h1-letter-spacing)",
    "lineHeight": "var(--qd-atelier-type-h1-line-height)"
  },
  "h2": {
    "fontFamily": "var(--qd-atelier-type-h2-font-family)",
    "fontSize": "var(--qd-atelier-type-h2-font-size)",
    "fontWeight": "var(--qd-atelier-type-h2-font-weight)",
    "letterSpacing": "var(--qd-atelier-type-h2-letter-spacing)",
    "lineHeight": "var(--qd-atelier-type-h2-line-height)"
  },
  "h3": {
    "fontFamily": "var(--qd-atelier-type-h3-font-family)",
    "fontSize": "var(--qd-atelier-type-h3-font-size)",
    "fontWeight": "var(--qd-atelier-type-h3-font-weight)",
    "letterSpacing": "var(--qd-atelier-type-h3-letter-spacing)",
    "lineHeight": "var(--qd-atelier-type-h3-line-height)"
  },
  "body": {
    "fontFamily": "var(--qd-atelier-type-body-font-family)",
    "fontSize": "var(--qd-atelier-type-body-font-size)",
    "fontWeight": "var(--qd-atelier-type-body-font-weight)",
    "letterSpacing": "var(--qd-atelier-type-body-letter-spacing)",
    "lineHeight": "var(--qd-atelier-type-body-line-height)"
  },
  "caption": {
    "fontFamily": "var(--qd-atelier-type-caption-font-family)",
    "fontSize": "var(--qd-atelier-type-caption-font-size)",
    "fontWeight": "var(--qd-atelier-type-caption-font-weight)",
    "letterSpacing": "var(--qd-atelier-type-caption-letter-spacing)",
    "lineHeight": "var(--qd-atelier-type-caption-line-height)"
  },
  "mono": {
    "fontFamily": "var(--qd-atelier-type-mono-font-family)",
    "fontSize": "var(--qd-atelier-type-mono-font-size)",
    "fontWeight": "var(--qd-atelier-type-mono-font-weight)",
    "letterSpacing": "var(--qd-atelier-type-mono-letter-spacing)",
    "lineHeight": "var(--qd-atelier-type-mono-line-height)",
    "textTransform": "uppercase"
  }
} as const;
