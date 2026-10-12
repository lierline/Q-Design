import type { CSSProperties } from "react";

/** 작업 환경 점검표의 열 비율과 미측정 표시. 원본 서식의 구조를 유지한다. */
export const qdSafetyPrint = {
  dayWidth: "5%",
  areaWidthPercent: 82,
  unmeasured: {
    backgroundImage:
      "linear-gradient(to top right, transparent calc(50% - 0.12mm), #000 50%, transparent calc(50% + 0.12mm))",
    WebkitPrintColorAdjust: "exact",
    printColorAdjust: "exact",
  } satisfies CSSProperties,
} as const;
