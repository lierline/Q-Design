// =============================================================================
// RibbonBackground: Q-Atelier 시그니처 champagne ribbon 무드 (공용)
// =============================================================================
// 로그인 화면 + 인앱 레이아웃 모두에서 사용.
//
// 동작:
//   · 2겹의 champagne SVG ribbon 이 viewport 전체에 천천히 흐름 (32s / 38s)
//   · viewBox 2400×1200 + path 좌표 화면 밖까지 → ultra-wide 모니터 대응
//   · prefers-reduced-motion 존중: 모션 끔
//   · pointerEvents: none → 클릭 방해 안 함
//   · zIndex: 0 + position: fixed → 모든 컨텐츠 뒤에서 부드럽게 깔림
//
// 사용 예:
//   <RibbonBackground intensity="full" />     // 로그인 (강조)
//   <RibbonBackground intensity="ambient" />  // 인앱 (배경 무드, 더 옅음)

import { T } from '@/lib/design/tokens';

interface Props {
  /** full = 로그인용 (opacity 0.14/0.08), ambient = 인앱용 (0.07/0.04) */
  intensity?: 'full' | 'ambient';
  /** vignette 어둠 처리: 로그인엔 true, 인앱엔 사이드바·카드가 있어 false 권장 */
  vignette?: boolean;
}

export function RibbonBackground({ intensity = 'full', vignette = false }: Props) {
  const op1 = intensity === 'full' ? 0.14 : 0.07;
  const op2 = intensity === 'full' ? 0.08 : 0.04;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes qa-ribbon-drift-1 {
              0%   { transform: translate3d(-3%, -2%, 0) scale(1.02); }
              50%  { transform: translate3d(2%, 1%, 0) scale(1.05); }
              100% { transform: translate3d(-3%, -2%, 0) scale(1.02); }
            }
            @keyframes qa-ribbon-drift-2 {
              0%   { transform: translate3d(2%, 1%, 0) scale(1.03); }
              50%  { transform: translate3d(-2%, -1%, 0) scale(1.06); }
              100% { transform: translate3d(2%, 1%, 0) scale(1.03); }
            }
            .qa-ribbon-layer-1 {
              animation: qa-ribbon-drift-1 32s ease-in-out infinite;
              transform-origin: 50% 50%;
              will-change: transform;
            }
            .qa-ribbon-layer-2 {
              animation: qa-ribbon-drift-2 38s ease-in-out infinite;
              transform-origin: 50% 50%;
              will-change: transform;
            }
            @media (prefers-reduced-motion: reduce) {
              .qa-ribbon-layer-1, .qa-ribbon-layer-2 { animation: none; }
            }
          `,
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        {/* Layer 1: large ribbon curve */}
        <svg
          className="qa-ribbon-layer-1"
          width="100%"
          height="100%"
          viewBox="0 0 2400 1200"
          preserveAspectRatio="xMidYMid slice"
          style={{ position: 'absolute', inset: 0, opacity: op1 }}
        >
          <defs>
            <linearGradient id="qa-ribbon-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={T.champagne} stopOpacity="0" />
              <stop offset="40%" stopColor={T.champagne} stopOpacity="1" />
              <stop offset="100%" stopColor={T.champagne} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M -200 720 Q 500 280 1100 600 T 2600 460"
            stroke="url(#qa-ribbon-grad-1)"
            strokeWidth="200"
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        {/* Layer 2: secondary thin ribbon, counter-direction */}
        <svg
          className="qa-ribbon-layer-2"
          width="100%"
          height="100%"
          viewBox="0 0 2400 1200"
          preserveAspectRatio="xMidYMid slice"
          style={{ position: 'absolute', inset: 0, opacity: op2 }}
        >
          <defs>
            <linearGradient id="qa-ribbon-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={T.champagne} stopOpacity="0" />
              <stop offset="50%" stopColor={T.champagne} stopOpacity="1" />
              <stop offset="100%" stopColor={T.champagne} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M 2700 240 Q 1800 840 800 480 T -300 840"
            stroke="url(#qa-ribbon-grad-2)"
            strokeWidth="120"
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        {vignette && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              // 테마 인지 vignette: 다크에선 가장자리 어둡게, 라이트에선 champagne tint
              background: 'var(--qa-vignette)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </>
  );
}
