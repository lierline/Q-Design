// =============================================================================
// Skeleton: Loading 텍스트 대체 (champagne shimmer)
// =============================================================================
// 사용:
//   <Skeleton height={20} width="60%" />
//   <Skeleton.Row count={3} />        // 3줄 텍스트 모양
//   <Skeleton.Card height={120} />    // 카드 모양 (border 포함)

import type { CSSProperties } from 'react';
import { S, T, RADIUS } from '@/lib/design/tokens';

interface BaseProps {
  width?: number | string;
  height?: number | string;
  style?: CSSProperties;
  className?: string;
}

export function Skeleton({ width = '100%', height = 14, style, className }: BaseProps) {
  return (
    <div
      className={`qa-skeleton ${className ?? ''}`}
      style={{
        width,
        height,
        ...style,
      }}
      aria-hidden
    />
  );
}

Skeleton.Row = function SkeletonRow({
  count = 1,
  gap = 8,
  lastWidth = '70%',
}: {
  count?: number;
  gap?: number;
  /** 마지막 줄을 살짝 짧게 → 단락 끝 느낌 */
  lastWidth?: number | string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }} aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          width={i === count - 1 && count > 1 ? lastWidth : '100%'}
        />
      ))}
    </div>
  );
};

Skeleton.Card = function SkeletonCard({ height = 120 }: { height?: number }) {
  return <Skeleton height={height} style={{ padding: 0 }} />;
};

/**
 * KPI grid skeleton: 대시보드 첫 진입 시 3-4 카드 placeholder.
 * 카드 안에 label (10px) + value (24px) + sub (10px) layout 모사.
 */
Skeleton.KPIGrid = function SkeletonKPIGrid({
  cols = 4,
  minHeight = 124,
}: {
  cols?: number;
  minHeight?: number;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap: S[3.5],
        marginBottom: S[6],
      }}
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          style={{
            border: `1px solid ${T.border}`,
            borderRadius: RADIUS.md, // 실 카드(Bx)와 동일 모서리(로딩↔실화면 점프 방지)
            padding: '18px 20px',
            minHeight,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: S[2.5],
          }}
        >
          <Skeleton height={10} width="40%" />
          <Skeleton height={26} width="55%" style={{ marginTop: S[1.5] }} />
          <Skeleton height={10} width="65%" />
        </div>
      ))}
    </div>
  );
};

/**
 * Page header skeleton: PageHd 동등 시각 무게 (title 28px + 제목 아래 설명 줄 14px).
 *
 * 제목 위 이름표 줄은 기본으로 그리지 않는다. 이름표는 «뜻 있을 때만» 두기로 해 대부분 화면에 없고,
 * 비워 둔 줄이 있으면 자료가 올 때 머리가 한 줄 뛴다. 이름표가 있는 화면(홈의 «직무 · 날짜»)만 sub 로 켠다.
 * 설명 줄(desc)은 이 뼈대를 쓰는 화면 대부분에 있어 기본으로 둔다 (화면 검토 A35 · A66 · 2026-09-27).
 */
Skeleton.PageHd = function SkeletonPageHd({ sub = false, desc = true }: { sub?: boolean; desc?: boolean } = {}) {
  return (
    <div style={{ marginBottom: S[7] }} aria-busy="true">
      {sub && <Skeleton height={11} width={140} style={{ marginBottom: S[3] }} />}
      <Skeleton height={28} width="42%" />
      {desc && <Skeleton height={14} width="28%" style={{ marginTop: S[2.5] }} />}
    </div>
  );
};

/**
 * Table skeleton: row 가 같은 grid 로 정렬되어 자연스러운 표 형태.
 */
Skeleton.Table = function SkeletonTable({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div
      style={{
        border: `1px solid ${T.border}`,
        borderRadius: RADIUS.md, // 실 테이블 카드와 동일
        overflow: 'hidden',
      }}
      aria-busy="true"
    >
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          style={{
            display: 'grid',
            gridTemplateColumns: `2fr repeat(${cols - 1}, 1fr)`,
            gap: S[4],
            padding: '14px 18px',
            borderBottom: r < rows - 1 ? '1px solid var(--qa-border)' : 'none',
          }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} height={12} width={c === 0 ? '85%' : '60%'} />
          ))}
        </div>
      ))}
    </div>
  );
};
