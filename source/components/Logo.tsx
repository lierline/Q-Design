'use client';

/**
 * Q-Atelier Brand Logo
 *
 * 실제 브랜드 자산(붓 Q) 을 사용하며, 라이트/다크 테마에 맞춰 자동 전환된다.
 *
 * 파일 (화면용 · Q-Design tools/app-icons.mjs 가 원본 PNG 에서 만든다. 손으로 고치지 않는다):
 *   public/q-mark-on-dark.webp : 다크 모드용 은색 Q (360×353 · 27KB)
 *   public/q-mark-on-light.webp: 라이트 모드용 검정 Q (360×357 · 24KB)
 *   원본 public/logo-dark.png(530×520 · 126KB) · logo-light.png(860×852 · 286KB)는 그 도구의
 *   원본 그림이라 남겨 둔다. 화면이 원본을 그대로 싣던 것을 2026-09-26 에 바꿨다(첫 방문 무게).
 *   가장 크게 그리는 자리가 120px 라 3배 화면에서도 너비 360 이면 된다.
 *
 * `Logo`    : 전체 로고. 인증 페이지 헤더 등에 사용.
 * `LogoMark`: 접힌 사이드바, 모바일 FAB 등 작은 공간 전용.
 *              두 이미지 픽셀 크기가 다르므로 object-fit:contain 으로 정규화.
 */

import { useTheme } from '@/lib/design/theme-provider';

interface LogoProps {
  /** 컨테이너 한 변(px). object-fit:contain 으로 이미지 비율 유지. */
  size?: number;
  style?: React.CSSProperties;
  /** @deprecated PNG 가 테마별로 자동 전환되므로 더 이상 적용되지 않음. */
  color?: string;
}

export function Logo({ size = 160, style }: LogoProps) {
  const { theme } = useTheme();
  const src = theme === 'dark' ? '/q-mark-on-dark.webp' : '/q-mark-on-light.webp';
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Q-Atelier"
      width={size}
      height={size}
      draggable={false}
      // L5: 브랜드 로고는 above-the-fold critical asset: eager + high priority.
      loading="eager"
      fetchPriority="high"
      style={{
        display: 'block',
        objectFit: 'contain',
        userSelect: 'none',
        ...style,
      }}
    />
  );
}

/**
 * LogoMark: 접힌 사이드바, 모바일 FAB 등 작은 공간 전용.
 * 같은 붓 Q 를 쓰되, object-fit:contain 으로
 * 두 테마 이미지(360×353 / 360×357)의 비율 차이를 정규화한다.
 */
export function LogoMark({
  size = 32,
  style,
}: {
  size?: number;
  style?: React.CSSProperties;
}) {
  const { theme } = useTheme();
  const src = theme === 'dark' ? '/q-mark-on-dark.webp' : '/q-mark-on-light.webp';

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Q-Atelier"
      width={size}
      height={size}
      draggable={false}
      loading="eager"
      style={{
        display: 'block',
        objectFit: 'contain',
        userSelect: 'none',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
