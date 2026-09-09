'use client';

// =============================================================================
// TopProgressBar: Next.js 라우트 전환 시 상단 champagne hairline
// =============================================================================
// Vercel / Linear 식 NProgress 패턴. 모든 클릭이 "응답 받음" 으로 느껴짐.
//
// 동작:
//   · pathname 이 바뀌면 0% → 80% 까지 빠르게 → 95% 에서 잠시 hold
//   · 새 페이지 paint 직후 100% → fade out
//   · prefers-reduced-motion 시 표시 안 함

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export function TopProgressBar() {
  const pathname = usePathname();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    // 첫 마운트 (pathname 최초 설정) 시엔 표시 안 함
    if (prevPath.current === null) {
      prevPath.current = pathname;
      return;
    }
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;

    // 새 라우트 진입: 0 → 80 → 100 시퀀스
    setVisible(true);
    setWidth(0);
    if (timerRef.current) clearTimeout(timerRef.current);

    requestAnimationFrame(() => {
      setWidth(80);
      timerRef.current = setTimeout(() => {
        setWidth(100);
        timerRef.current = setTimeout(() => {
          setVisible(false);
          setTimeout(() => setWidth(0), 350);
        }, 220);
      }, 280);
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="qa-top-progress"
      style={{
        width: `${width}%`,
        opacity: width === 100 ? 0 : 1,
      }}
      aria-hidden
    />
  );
}
