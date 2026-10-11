"use client";

import { useEffect, useState } from "react";
import { CHART_LABEL_LAYOUT } from "./q-design-chart-layout";

/** Measure CSS pixels so SVG coordinates cannot shrink the central typography. */
export function useChartViewport(initialWidth: number) {
  const [node, host] = useState<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState({ width: initialWidth, fontSize: CHART_LABEL_LAYOUT.fontBaseline as number });
  useEffect(() => {
    if (!node) return;
    const measure = () => {
      const width = node.getBoundingClientRect().width;
      const fontSize = parseFloat(getComputedStyle(node).fontSize);
      if (width <= 0 || !Number.isFinite(fontSize)) return;
      setViewport(previous => previous.width === width && previous.fontSize === fontSize ? previous : { width, fontSize });
    };
    const resize = new ResizeObserver(measure);
    resize.observe(node);
    const fonts = new MutationObserver(measure);
    fonts.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "class", "data-theme"] });
    measure();
    return () => { resize.disconnect(); fonts.disconnect(); };
  }, [node]);
  return { host, ...viewport };
}
