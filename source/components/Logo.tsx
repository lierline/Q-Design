'use client';

/**
 * Q-Atelier Brand Logo
 *
 * 실제 브랜드 자산(PNG) 을 사용하며, 라이트/다크 테마에 맞춰 자동 전환된다.
 *
 * 파일:
 *   public/logo-dark.png : 다크 모드용 (1024×1024 RGBA)
 *   public/logo-light.png: 라이트 모드용 (530×540 RGBA)
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
  const src = theme === 'dark' ? '/logo-dark.png' : '/logo-light.png';
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
 * 브랜드 PNG 를 그대로 사용하되, object-fit:contain 으로
 * 두 테마 이미지(1024×1024 / 530×540)의 크기 차이를 정규화한다.
 */
export function LogoMark({
  size = 32,
  style,
}: {
  size?: number;
  style?: React.CSSProperties;
}) {
  const { theme } = useTheme();
  const src = theme === 'dark' ? '/logo-dark.png' : '/logo-light.png';

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
