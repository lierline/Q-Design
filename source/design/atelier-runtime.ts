// Q-Design owns numeric presentation inputs required by JavaScript, SVG and media queries.
// Measured coordinates, application data and locked engine tokens do not belong here.
// Update this source and sync; do not edit the product copy.

export const BP = {
  "sm": 480,
  "md": 768,
  "lg": 1024,
  "xl": 1280,
  "2xl": 1536
} as const;

export const LAYOUT = {
  "mobile": 520,
  "form": 720,
  "detail": 820,
  "wide": 1140
} as const;

export const ICON = {
  "strokeWidth": 1.5,
  "strokeWidthThin": 1.25,
  "sizeXs": 14,
  "sizeSm": 16,
  "sizeMd": 20,
  "sizeLg": 24,
  "sizeXl": 32,
  "size2xl": 48
} as const;

export const QDRuntime = {
  "avatar": {
    "size": 30,
    "minFontSize": 12,
    "fontScale": 0.45
  },
  "popover": {
    "width": 340,
    "infoWidth": 360,
    "viewportGutter": 16,
    "leaveDelayMs": 120
  },
  "switch": {
    "sm": {
      "w": 40,
      "h": 22,
      "knob": 16
    },
    "md": {
      "w": 52,
      "h": 28,
      "knob": 22
    },
    "inset": 3
  },
  "grid": {
    "minColumn": 240,
    "foldMinColumn": 150,
    "roundingAllowance": 1
  },
  "ribbon": {
    "durationSeconds": 1.7
  },
  "grain": {
    "tint": 0.55
  },
  "alpha": {
    "tint0_02": 0.02,
    "tint0_03": 0.03,
    "tint0_04": 0.04,
    "tint0_05": 0.05,
    "tint0_06": 0.06,
    "tint0_07": 0.07,
    "tint0_08": 0.08,
    "tint0_1": 0.1,
    "tint0_12": 0.12,
    "tint0_14": 0.14,
    "tint0_15": 0.15,
    "tint0_18": 0.18,
    "tint0_2": 0.2,
    "tint0_22": 0.22,
    "tint0_25": 0.25,
    "tint0_28": 0.28,
    "tint0_3": 0.3,
    "tint0_33": 0.33,
    "tint0_35": 0.35,
    "tint0_4": 0.4,
    "tint0_45": 0.45,
    "tint0_5": 0.5,
    "tint0_55": 0.55,
    "tint0_6": 0.6,
    "tint0_7": 0.7,
    "tint0_8": 0.8,
    "tint0_82": 0.82,
    "tint0_9": 0.9
  }
} as const;

// Explicit presentation dimensions, grouped by consumer contract. Values remain
// numbers because Grid/SVG/measurement consumers perform arithmetic or append px.
// Grid gap uses QDScale instead so shared spacing changes propagate through CSS.
export const QDPresentation = {
  "rendererInputs": {
    "gridColumns": { "2": 2, "3": 3, "4": 4 },
    "statMinColumn": { "140": 140, "160": 160 },
    "skeletonColumns": { "3": 3, "4": 4, "5": 5 }
  },
  "visual": {
    "drawer": {
      "classificationWidth": "min(480px, 96vw)",
      "approvalWidth": "min(480px, 100vw)"
    },
    "chart": {
      "minimumBarPercent": 2,
      "lineJoin": "round",
      "sparseThreshold": 2,
      "sparseTicks": [
        0,
        1
      ],
      "normalTicks": [
        0,
        0.5,
        1
      ]
    },
    "treeIndent": 16,
    "statusOutlinePercent": 25,
    "statusFillPercent": 6,
    "rotation": {
      "diagonal": "rotate(45deg)",
      "reverse": "rotate(180deg)",
      "quarter": "rotate(90deg)",
      "negativeQuarter": "rotate(-90deg)",
      "zero": "rotate(0deg)",
      "none": "none"
    },
    "iconBaselineTransform": "translateY(2px)",
    "motion": {
      "settled": "translateY(0) scale(1)",
      "confirmHidden": "translateY(8px) scale(0.98)",
      "toastHidden": "translateY(-8px) scale(0.98)",
      "translateSettled": "translateY(0)",
      "installHidden": "translateY(16px)",
      "installEase": "cubic-bezier(.2,.8,.2,1)",
      "opacityEase": "ease",
      "authOpacity": "opacity var(--qd-motion-normal, 200ms) ease"
    },
    "pull": {
      "restOffset": 44,
      "fadeDistance": 40,
      "degreesPerPixel": 4
    },
    "menuAnchorGap": 4,
    "tooltipAnchorGap": 6,
    "paperNumberColumnPercent": 6,
    "scrollbarWidth": "thin",
    "ring": {
      "lineCap": "round",
      "captionThreshold": 48
    },
    "panel": {
      "compactPadding": "10px 12px",
      "padding": "14px 16px"
    },
    "subscription": {
      "mobilePanelWidth": "min(340px, calc(100vw - 24px))",
      "panelWidth": "340px",
      "compactRight": 52,
      "mobileRight": 54,
      "desktopRight": 64,
      "touchAllowance": 12,
      "compactTracking": 0.6,
      "tracking": 1
    },
    "header": {
      "mobileTop": 12,
      "desktopTop": 18,
      "mobileRight": 12,
      "desktopRight": 22
    },
    "bottomNavHeight": 64,
    "stroke": {
      "normal": 1,
      "emphasis": 2,
      "approvalIdle": 1.5,
      "selected": 3
    },
    "summaryLabelTrack": "2fr",
    "fabBottom": "calc(env(safe-area-inset-bottom, 0) + var(--qa-fab-bottom, 80px))",
    "battery": {
      "maximumHue": 125,
      "saturation": 62,
      "lightness": 52
    },
    "goldText": {
      "backgroundImage": "linear-gradient(135deg, var(--qa-champagne) 0%, color-mix(in oklab, var(--qa-champagne) 55%, white) 50%, color-mix(in oklab, var(--qa-champagne) 82%, black) 100%)",
      "WebkitBackgroundClip": "text",
      "backgroundClip": "text",
      "color": "transparent"
    },
    "tag": {
      "border": 1,
      "lineHeight": 1.4,
      "dims": {
        "xs": {
          "minH": 20,
          "fs": 12,
          "padY": 0,
          "padX": 6,
          "dotSize": 5,
          "gap": 4
        },
        "sm": {
          "minH": 24,
          "fs": 12,
          "padY": 2,
          "padX": 8,
          "dotSize": 6,
          "gap": 4
        },
        "md": {
          "minH": 28,
          "fs": 13,
          "padY": 4,
          "padX": 10,
          "dotSize": 7,
          "gap": 5
        }
      }
    },
    "grid": {
      "tabletThreshold": 3,
      "tabletColumns": 2
    }
  },
  "mainPadding": {
    "top": 32,
    "right": 40,
    "bottom": 32,
    "left": 40
  },
  "changeReasonColor": {
    "PERF": "#7a9ac9",
    "COST": "#9fc98a",
    "SECURITY": "#c97a7a",
    "REG": "#c9a878",
    "CUSTOMER": "#c98aaa",
    "DEFECT": "#c9a87a",
    "FEATURE": "#a8c9b8",
    "SUPPLY": "#aaa8c9",
    "QUALITY": "#9fc98a",
    "OBSO": "#a09890"
  },
  "iconStroke": { "1.8": 1.8 },
  "fieldChoiceColumns": { "1": 1, "2": 2, "3": 3 },
  "tableMinWidth": {
    "560": 560,
    "620": 620,
    "640": 640,
    "720": 720,
    "760": 760,
    "780": 780,
    "820": 820,
    "860": 860,
    "900": 900,
    "960": 960
  },
  "iconSize": {
    "8": 8,
    "9": 9,
    "10": 10,
    "11": 11,
    "12": 12,
    "13": 13,
    "14": 14,
    "15": 15,
    "16": 16,
    "17": 17,
    "18": 18,
    "20": 20,
    "22": 22,
    "24": 24,
    "26": 26,
    "28": 28,
    "32": 32,
    "44": 44
  },
  "gridMinColumn": {
    "100": 100,
    "110": 110,
    "120": 120,
    "140": 140,
    "160": 160,
    "170": 170,
    "180": 180,
    "200": 200,
    "220": 220,
    "240": 240
  },
  "skeletonHeight": {
    "10": 10,
    "11": 11,
    "12": 12,
    "14": 14,
    "20": 20,
    "26": 26,
    "28": 28,
    "90": 90,
    "120": 120,
    "124": 124,
    "150": 150,
    "160": 160,
    "180": 180,
    "200": 200,
    "240": 240,
    "260": 260,
    "280": 280,
    "300": 300,
    "340": 340
  },
  "modalWidth": {
    "480": 480,
    "520": 520,
    "560": 560,
    "580": 580,
    "600": 600,
    "640": 640,
    "760": 760,
    "1100": 1100
  },
  "choiceMinColumn": {
    "110": 110,
    "120": 120,
    "140": 140,
    "160": 160,
    "180": 180
  },
  "choiceFontWeight": {
    "400": 400,
    "500": 500,
    "600": 600
  },
  "choiceMinHeight": {
    "44": 44,
    "48": 48,
    "60": 60
  },
  "coachmarkDelay": {
    "800": 800,
    "1200": 1200
  },
  "memberListHeight": {
    "160": 160,
    "170": 170,
    "180": 180,
    "200": 200
  },
  "iconButtonSize": {
    "30": 30,
    "32": 32,
    "34": 34,
    "48": 48
  },
  "chartHeight": {
    "200": 200,
    "220": 220
  },
  "infoWidth": {
    "300": 300,
    "320": 320,
    "360": 360,
    "380": 380
  },
  "logoSize": {
    "22": 22,
    "28": 28,
    "32": 32,
    "36": 36,
    "56": 56,
    "96": 96,
    "108": 108,
    "120": 120,
    "160": 160
  },
  "avatarSize": {
    "32": 32,
    "34": 34,
    "72": 72
  },
  "installLogoSize": {
    "36": 36
  },
  "progressSize": {
    "40": 40,
    "56": 56
  },
  "progressStroke": {
    "4": 4,
    "5": 5
  },
  "skeletonWidth": {
    "140": 140
  },
  "skeletonGap": {
    "8": 8
  },
  "chartGeometry": {
    "width": 1000,
    "padding": {
      "top": 12,
      "right": 12,
      "bottom": 28,
      "left": 36
    },
    "tickLabelOffsetX": 6,
    "tickLabelOffsetY": 4,
    "xLabelInset": 6,
    "maxLabels": 8,
    "lineWidth": 1.8,
    "pointRadius": 2.5,
    "gridDash": "2 4"
  },
  "coachmarkGeometry": {
    "panelWidth": 280,
    "estimatedHeight": 100,
    "targetGap": 12,
    "viewportGutter": 8,
    "viewportReserveX": 16,
    "viewportReserveY": 40
  },
  "commonDefaults": {
    "kpiMaxSingleRow": 5,
    "kpiRows": 2,
    "fieldChoiceColumns": 3,
    "tooltipOffset": 6,
    "permissionLabelWidth": 260,
    "permissionRoleWidth": 64,
    "permissionGutterWidth": 40,
  "cardMinHeight": 124,
  "stageNodeMinWidth": 100,
  "statGridMinColumn": 120,
  "tableSqueeze": 48,
  "expertFieldMarginBottom": 22,
  "topBandHeight": 56,
  "approvalChainColumn": 86,
  "textareaRows": 3,
  "skeletonLines": 3,
  "skeletonRows": 5,
  "skeletonColumns": 4,
  "skeletonCount": 1
},
  "motionDefaults": {
  "countUp": 800,
  "foldOpen": 520,
  "foldClose": 380,
  "installShowDelay": 2500,
  "installAutoHide": 13000,
  "installAnimation": 320
},
  "interactionMotion": {
  "feedbackDwell": {
    "1200": 1200,
    "1500": 1500,
    "2000": 2000,
    "2500": 2500,
    "3000": 3000
  },
  "highlightDwell": {
    "2600": 2600,
    "4000": 4000
  },
  "scrollSettle": {
    "50": 50,
    "100": 100,
    "150": 150,
    "200": 200
  },
  "refreshDwell": 800,
  "hoverLeave": 200,
  "loginEntrance": 1200,
  "toastDefault": 3500,
  "toastError": 6500
},
  "cssDefaults": {
  "checkboxGlyph": "var(--qd-choice-glyph-size)",
  "choicePadding": "var(--qd-atelier-padding-0ddf63605b)",
  "drawerWidth": "var(--qd-atelier-width-260a93c4b6)",
  "portalFooterPadding": "var(--qd-space-10) var(--qd-space-6) var(--qd-space-8)"
}
} as const;

export const Z = {
  "base": 1,
  "dropdown": 50,
  "sticky": 100,
  "header": 200,
  "fab": 300,
  "bottomNav": 400,
  "drawerFab": 500,
  "drawerBackdrop": 600,
  "drawer": 700,
  "overlay": 1000,
  "modal": 1100,
  "popover": 1200,
  "tooltip": 9999,
  "toast": 10000,
  "blocking": 10001,
  "sessionGate": 10002
} as const;

export const workflowDivider = (color: string, faded: string): string => `linear-gradient(90deg, ${color}, ${faded}, transparent)`;

export function pageHeadingRules(headerClass: string): string { return `
.${headerClass}-title{font-size:var(--qd-title-size, 22px)}
@media (max-width:${BP.md - 1}px){
  .${headerClass}-actions{width:100%;flex-wrap:wrap}
  .${headerClass}-row{align-items:flex-start}
}`; }

export function gridTemplateFor(cols: number | undefined, minCol: number): string {
  if (typeof cols === 'number' && cols > 0) {
    return `repeat(${cols}, minmax(0, 1fr))`;
  }
  return `repeat(auto-fit, minmax(${minCol}px, 1fr))`;
}

export function gridRulesFor(className: string, cols: number | undefined, minCol: number, responsive?: {base?:number;sm?:number;md?:number;lg?:number;xl?:number}): string[] {
  const rules: string[] = [];
  if (responsive) {
    if (responsive.base) {
      rules.push(
        `.${className}{grid-template-columns:${gridTemplateFor(responsive.base, minCol)}}`,
      );
    }
    if (responsive.sm) {
      rules.push(
        `@media (min-width:${BP.sm}px){.${className}{grid-template-columns:${gridTemplateFor(responsive.sm, minCol)}}}`,
      );
    }
    if (responsive.md) {
      rules.push(
        `@media (min-width:${BP.md}px){.${className}{grid-template-columns:${gridTemplateFor(responsive.md, minCol)}}}`,
      );
    }
    if (responsive.lg) {
      rules.push(
        `@media (min-width:${BP.lg}px){.${className}{grid-template-columns:${gridTemplateFor(responsive.lg, minCol)}}}`,
      );
    }
    if (responsive.xl) {
      rules.push(
        `@media (min-width:${BP.xl}px){.${className}{grid-template-columns:${gridTemplateFor(responsive.xl, minCol)}}}`,
      );
    }
  } else if (typeof cols === 'number') {
    // cols 만 있을 때:
    //   - mobile (~sm): 1열 (자동 auto-fit minmax 가 이미 1열로 wrap)
    //   - tablet (md~lg): cols 가 3 이상이면 명시적으로 2열 (auto-fit minmax 가
    //     좁은 화면에서 어색한 3+ 열을 시도하는 문제 차단)
    //   - desktop (≥lg): cols 강제
    if (cols >= QDPresentation.visual.grid.tabletThreshold) {
      rules.push(
        `@media (min-width:${BP.md}px){.${className}{grid-template-columns:repeat(${QDPresentation.visual.grid.tabletColumns},minmax(0,1fr))}}`,
      );
    }
    rules.push(
      `@media (min-width:${BP.lg}px){.${className}{grid-template-columns:${gridTemplateFor(cols, minCol)}}}`,
    );
  }

  // 2026-09-03 M-06: 인라인 style 은 클래스 룰보다 셉니다. 그래서 위 @media 룰이 «있어도»
  // 인라인 gridTemplateColumns 가 이겨 한 번도 적용된 적이 없었습니다(`<Grid cols={4}>` 가
  // 데스크톱에서도 auto-fit 으로 남음). 룰이 하나라도 있으면 기본 템플릿을 «룰 맨 앞»에
  // 같은 클래스 룰로 넣고 인라인은 생략합니다. 뒤의 룰이 같은 특이성으로 덮어씁니다.
  // 룰이 없으면 종전대로 인라인입니다. grid-rules.test.tsx 가 이 배선을 잠급니다.
  return rules;
}

export const drawerMotionRules = `
        @keyframes qa-drawer-slide-r { from { transform: translateX(var(--qd-space-6)); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes qa-drawer-slide-l { from { transform: translateX(calc(-1 * var(--qd-space-6))); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes qa-drawer-slide-b { from { transform: translateY(var(--qd-space-6)); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `;
