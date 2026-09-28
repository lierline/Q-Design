// =============================================================================
// /experts/farewell: 로그아웃 후 작별 페이지 (시네마틱 luxe)
// =============================================================================
// 사용자 제공 디자인(farewell.html) 그대로 포팅. 자동 redirect / countdown bar
// 제거. «다시 로그인» 은 가운데 문구 밑에 둔다(화면 검토 A42). 모든 스타일이 self-contained.
//
// 브랜드 통일 (2026-05):
// - Google Fonts(Cormorant/Noto Serif KR/Montserrat) 별도 로드 제거.
// - 폰트는 부모 expert layout 이 이미 로드한 변수를 사용: Cormorant 는 var(--font-cormorant),
//   본문은 var(--qa-font-pretendard). Montserrat 는 mono variable 로 대체 (브랜드 외 폰트 정리).
//
// 글꼴 일관성 audit (2026-05): farewell-mono/serif/sans 별칭이 parent 의
// --mono/--serif/--sans 와 동일 정의였으나, 별칭 레이어를 두면 글꼴 변경 시
// 두 곳을 동시에 업데이트해야 함. 부모 변수를 직접 사용하여 단일 출처(SSOT) 로
// 정돈. Farewell 도 .expert-portal-root 컨텍스트 안에 있어 변수가 inherited 됨.

import Link from 'next/link';

export const metadata = {
  title: 'Q-Atelier: Farewell',
};

export default function ExpertFarewellPage() {
  return (
    <>
      <style>{`
        .farewell-root, .farewell-root *,
        .farewell-root *::before, .farewell-root *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .farewell-root {
          /* expert-theme.css 의 토큰과 동일한 값: 브랜드 일관성. */
          --gold: #c9a86a;
          --gold-light: #e0c084;
          --gold-dim: rgba(201, 168, 106, 0.18);
          --white: #f3ede0;
          /* 폰트: parent (.expert-portal-root) 의 --mono/--serif/--sans 를 직접
             참조. 별칭 레이어 제거로 단일 출처(SSOT) 유지. */

          /* 자연스러운 normal-flow 화면. fixed/z:99999 는 다른 라우트의 토스트나
             모달을 가리는 과한 처리였음. min-height: 100dvh 로 충분. */
          position: relative;
          min-height: 100dvh;
          width: 100%;
          background: #000;
          overflow: hidden;
        }

        /* ── 배경 검정 ── */
        .farewell-root .bg-layer {
          position: fixed;
          inset: 0;
          background: #000;
          z-index: 0;
        }

        /* ── 로고 워터마크 ── */
        .farewell-root .logo-watermark {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
          pointer-events: none;
          opacity: 0;
          animation:
            qa-wm-fadein 4s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards,
            qa-wm-breathe 12s ease-in-out 4.3s infinite;
        }

        .farewell-root .logo-watermark img {
          width: min(44vw, 44vh, 520px);
          height: min(44vw, 44vh, 520px);
          object-fit: contain;
          filter: brightness(2.4) contrast(0.7);
          opacity: 1;
        }

        @keyframes qa-wm-fadein {
          from { opacity: 0; }
          to   { opacity: 0.08; }
        }

        @keyframes qa-wm-breathe {
          0%, 100% { opacity: 0.08; }
          50%      { opacity: 0.05; }
        }

        /* ── 라디얼 골드 워시 ── */
        .farewell-root .gold-wash {
          position: fixed;
          inset: 0;
          background: radial-gradient(
            ellipse 70% 60% at 50% 50%,
            rgba(201, 169, 110, 0.13) 0%,
            rgba(201, 169, 110, 0.06) 40%,
            transparent 75%
          );
          z-index: 2;
          opacity: 0;
          animation: qa-wash-in 2.2s ease 0.4s forwards;
        }

        @keyframes qa-wash-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ── 메인 스테이지 ── */
        .farewell-root .stage {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        /* eyebrow */
        .farewell-root .eyebrow {
          font-family: var(--mono);
          font-weight: 300;
          font-size: clamp(10px, 1.4vw, 14px);
          letter-spacing: 0.38em;
          color: var(--gold);
          text-transform: uppercase;
          opacity: 0;
          transform: translateY(10px);
          animation: qa-rise-soft 1.2s cubic-bezier(0.4, 0, 0.2, 1) 1.5s forwards;
          margin-bottom: 22px;
        }

        @keyframes qa-rise-soft {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* 메인 헤드라인 */
        .farewell-root .headline {
          font-family: var(--serif);
          font-weight: 300;
          font-size: clamp(40px, 6.5vw, 88px);
          color: var(--white);
          letter-spacing: -0.01em;
          line-height: 1.1;
          text-align: center;
          opacity: 0;
          transform: translateY(-16px);
          animation: qa-headline-drop 1.8s cubic-bezier(0.4, 0, 0.2, 1) 2.0s forwards;
          padding: 0 24px;
        }

        @keyframes qa-headline-drop {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* hairline */
        .farewell-root .hairline-wrap {
          width: min(480px, 80vw);
          height: 1px;
          margin: 36px 0 32px;
          overflow: hidden;
          opacity: 0;
          animation: qa-hairline-appear 0.01s linear 3.0s forwards;
        }

        @keyframes qa-hairline-appear {
          to { opacity: 1; }
        }

        .farewell-root .hairline {
          width: 100%;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            var(--gold) 30%,
            var(--gold-light) 50%,
            var(--gold) 70%,
            transparent 100%
          );
          transform-origin: left center;
          transform: scaleX(0);
          animation: qa-hairline-draw 1.1s cubic-bezier(0.4, 0, 0.2, 1) 3.0s forwards;
        }

        @keyframes qa-hairline-draw {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }

        /* 서브 텍스트 */
        .farewell-root .subtext {
          font-family: var(--serif);
          font-weight: 300;
          font-size: clamp(13px, 1.6vw, 17px);
          color: rgba(245, 240, 232, 0.65);
          letter-spacing: 0.06em;
          text-align: center;
          opacity: 0;
          transform: translateY(8px);
          animation: qa-rise-soft 1.4s cubic-bezier(0.4, 0, 0.2, 1) 3.5s forwards;
          padding: 0 24px;
        }

        /* ── 푸터 ── */
        .farewell-root .farewell-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 0 24px 40px;
          opacity: 0;
          animation: qa-rise-soft 1.2s cubic-bezier(0.4, 0, 0.2, 1) 4.0s forwards;
        }

        .farewell-root .footer-brand {
          font-family: var(--mono);
          font-weight: 300;
          font-size: 12px;
          letter-spacing: 0.32em;
          color: rgba(201, 169, 110, 0.8);
          text-transform: uppercase;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        /* 줄바꿈 두 번째 행: Quality, Documented. */
        .farewell-root .footer-brand-slogan {
          font-family: var(--mono);
          font-weight: 300;
          font-size: 12px;
          letter-spacing: 0.32em;
          text-transform: uppercase;
        }
        .farewell-root .footer-brand-slogan .word-q {
          color: rgba(201, 169, 110, 0.8);
        }
        .farewell-root .footer-brand-slogan .word-d {
          color: rgba(201, 169, 110, 1);
        }

        /* 다시 로그인: 가운데 문구 밑에 뚜렷하게 (화면 검토 A42 · 2026-09-27).
           바닥의 작은 글귀라 로그아웃을 잘못 누른 사람이 돌아갈 길을 찾기 어려웠다. */
        .farewell-root .relogin {
          margin-top: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          padding: 0 30px;
          font-family: var(--sans);
          font-size: 15px;
          font-weight: 500;
          color: var(--white);
          border: 1px solid rgba(201, 169, 110, 0.55);
          border-radius: 10px;
          text-decoration: none;
          transition: border-color 0.3s, background 0.3s;
          opacity: 0;
          animation: qa-rise-soft 1.2s cubic-bezier(0.4, 0, 0.2, 1) 3.8s forwards;
        }
        .farewell-root .relogin:hover {
          border-color: var(--gold);
          background: rgba(201, 169, 110, 0.08);
        }

        /* 접근성: reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .farewell-root .logo-watermark,
          .farewell-root .gold-wash,
          .farewell-root .eyebrow,
          .farewell-root .headline,
          .farewell-root .hairline-wrap,
          .farewell-root .hairline,
          .farewell-root .subtext,
          .farewell-root .relogin,
          .farewell-root .farewell-footer {
            animation-duration: 0.01s !important;
            animation-delay: 0s !important;
          }
        }
      `}</style>

      <div className="farewell-root">
        {/* 검정 배경 */}
        <div className="bg-layer" />

        {/* 로고 워터마크 */}
        <div className="logo-watermark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-dark.png" alt="" draggable={false} />
        </div>

        {/* 라디얼 골드 워시 */}
        <div className="gold-wash" />

        {/* 메인 스테이지 */}
        <main className="stage" role="main">
          <p className="eyebrow" aria-label="Until we meet again">
            UNTIL WE MEET AGAIN
          </p>
          <h1 className="headline">다시 만나뵙겠습니다.</h1>
          <div className="hairline-wrap" aria-hidden>
            <div className="hairline" />
          </div>
          <p className="subtext">오늘도 Q-Atelier 와 함께해 주셔서 감사합니다.</p>
          <Link className="relogin" href="/experts/portal/login">
            다시 로그인
          </Link>
        </main>

        {/* 푸터. 브랜드 줄만 (다시 로그인은 가운데로 올렸다 · 자동 redirect 없음) */}
        <footer className="farewell-footer">
          <div className="footer-brand">
            <span>Q-Atelier</span>
            <span className="footer-brand-slogan">
              <span className="word-q">Quality, </span>
              <span className="word-d">Documented.</span>
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}
