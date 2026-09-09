'use client';

// =============================================================================
// PageTransition: 라우트 전환 시 main 영역 fade+rise (200ms)
// =============================================================================
// 동작:
//   · pathname 변경 → key 변경 → React 가 자식 remount
//   · CSS animation 으로 opacity 0 → 1 + translateY(6px → 0)
//   · prefers-reduced-motion 자동 무효
//
// 주의:
//   · TopProgressBar 와 협력: progress 가 가는 동안 페이지가 살짝 olid

import { usePathname } from 'next/navigation';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="qa-page-fade">
      {children}
    </div>
  );
}
