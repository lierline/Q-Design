// =============================================================================
// app/(public)/layout.tsx: 비로그인 공개 문서 영역 (약관·처리방침·사업자정보)
// =============================================================================
// 🔴 2026-08-29 전수 적대 감사 §3. 「첫 유료 계약이 통과해야 하는 관문 넷」 중 하나가
//    이용약관·개인정보처리방침이고, 실측 결과 app 전역에 해당 라우트가 0건이었다.
//    개인정보처리방침 게시 의무는 결제가 아니라 «수집을 시작한 시점» 에 이미 발생한다.
//
// ── 왜 (app) 이 아니라 별도 그룹인가 ───────────────────────────────────────
// `app/(app)/layout.tsx:44` 가 세션이 없으면 **무조건** /login 으로 보낸다.
// 공개 문서를 거기 두면 「공개」가 성립하지 않는다. 그래서 별도 라우트 그룹에 둔다.
//
// 🔑 **문이 하나가 아니다.** 이 파일만으로는 여전히 안 열린다.
//    `lib/supabase/middleware.ts` 의 `PUBLIC_EXACT_PATHS` 에 세 경로를 함께 등록해야
//    미인증 요청이 /login 으로 307 리다이렉트되지 않는다. 한 겹만 열면 조용히 막힌다.
//
// ── robots ────────────────────────────────────────────────────────────────
// 루트 레이아웃(`app/layout.tsx`)의 metadata 가 전역 `noindex, nofollow` 라, 그대로
// 두면 이 세 문서도 색인 거부다. 「게시」 의무는 누구나 도달할 수 있는 상태를 요구하므로
// 이 그룹에서만 덮는다. 제품 화면의 전역 noindex 정책은 건드리지 않는다.

import type { Metadata } from 'next';
import Link from 'next/link';
import { BP, S, FS, F, T, LH, RADIUS, alpha } from '@/lib/design/tokens';

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

const NAV = [
  { href: '/terms', label: '이용약관' },
  { href: '/privacy', label: '개인정보처리방침' },
  { href: '/business-info', label: '사업자정보' },
  // ★ /open-source 는 앞의 셋과 성격이 다르다. 앞은 «회사가 쓰는» 문서이고 이것은
  //   «다른 사람의 저작권 고지를 우리가 전달하는» 문서다. 그래도 같은 자리에 둔다:
  //   안드로이드 앱이 원격 웹뷰라 이 웹 화면이 곧 앱 안의 「오픈소스 라이선스」 화면이고,
  //   스토어 심사·고객 실사 모두 「법적 고지가 모인 곳」에서 이것을 찾기 때문이다.
  { href: '/open-source', label: '오픈소스 라이선스' },
] as const;

export default function PublicLegalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="qa-legal-shell">
      <style dangerouslySetInnerHTML={{ __html: legalCss }} />

      <header className="qa-legal-header">
        <Link href="/login" className="qa-legal-brand">
          Q · ATELIER
        </Link>
        <nav className="qa-legal-nav" aria-label="법적 고지 문서">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
          <Link href="/login" className="qa-legal-nav-login">
            로그인
          </Link>
        </nav>
      </header>

      <main className="qa-legal-main">
        {/*
          초안 배너는 종전에 여기서 «모든» 자식에게 무조건 그려졌다. 이 그룹에 법률 초안
          셋뿐일 때는 맞았지만, /open-source 가 들어오면서 전제가 깨졌다. 오픈소스 고지는
          초안이 아니라 실제 트리에서 뽑은 사실이라 「최종 입장이 아니다」를 붙이면 안 된다.
          → `_components/legal-draft-banner.tsx` 한 곳에 정의하고 «초안인 문서만» 부른다.
             문구의 사본은 여전히 없다(정의 1 · 호출 3).
        */}
        {children}
      </main>

      <footer className="qa-legal-footer">
        {/*
          사업자 정보를 여기 또 적으면 사본이 된다(등록번호·주소가 두 곳에서 갈린다).
          숫자는 /business-info 한 곳에만 두고 여기서는 가리키기만 한다.
        */}
        <div>메드크래프트 (MedQraft) · Q-Atelier</div>
        <div>
          <Link href="/business-info">사업자정보 전문 보기</Link>
          {' · '}
          <a href="mailto:contact@medqraft.co.kr">contact@medqraft.co.kr</a>
        </div>
        <div className="qa-legal-footer-note">
          이 서비스는 의료기기 R&amp;D · 인허가 · QMS 운영을 지원하는 도구이며, 식약처 ·
          FDA · EU 등 규제기관의 공식 판정을 대체하지 않습니다.
        </div>
        <div>© {new Date().getFullYear()} MedQraft</div>
      </footer>
    </div>
  );
}

// ─── 문서 타이포그래피 ──────────────────────────────────────────────────────
// 법적 고지 문서는 본문이 길고 구조가 깊다(조 → 항 → 호). 페이지마다 인라인 스타일로
// 문단을 꾸미면 세 문서가 서로 다른 모양이 되므로, 여기서 한 번만 정의하고 페이지는
// 의미 태그(h2/h3/p/ul/table)만 쓴다.
//
// ⚠️ 숫자는 전부 토큰 보간(`${S[n]}px`)으로 쓴다. CSS 문자열 안의 raw 숫자는
//    `lib/design/no-raw-scale.test.ts` 의 baseline 을 갉아먹는다(가드는 camelCase 가
//    아니라 `padding:` 같은 단어 자체를 본다).
const legalCss = `
.qa-legal-shell {
  min-height: 100dvh;
  background: ${T.bg};
  color: ${T.text};
  display: flex;
  flex-direction: column;
}

.qa-legal-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${S[3]}px;
  padding: ${S[5]}px ${S[6]}px;
  border-bottom: 1px solid ${T.border};
}

.qa-legal-brand {
  font-family: ${F.mono};
  font-size: ${FS[11]}px;
  letter-spacing: 0.22em;
  color: ${T.champagne};
  text-decoration: none;
}

.qa-legal-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${S[4]}px;
  font-size: ${FS[12]}px;
}

.qa-legal-nav a {
  color: ${T.subtle};
  text-decoration: none;
}

.qa-legal-nav a:hover { color: ${T.text}; }

.qa-legal-nav .qa-legal-nav-login {
  color: ${T.champagne};
  border-bottom: 1px dashed ${T.border};
  padding-bottom: 1px;
}

.qa-legal-main {
  flex: 1;
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  padding: ${S[8]}px ${S[6]}px ${S[14]}px;
  box-sizing: border-box;
}

.qa-legal-draft {
  display: flex;
  flex-direction: column;
  gap: ${S[1.5]}px;
  padding: ${S[4]}px ${S[4.5]}px;
  margin-bottom: ${S[8]}px;
  border: 1px solid ${alpha(T.warning, 0.45)};
  border-radius: ${RADIUS.md}px;
  background: ${alpha(T.warning, 0.08)};
  font-size: ${FS[12]}px;
  line-height: ${LH.relaxed};
  color: ${T.subtle};
}

.qa-legal-draft strong {
  font-size: ${FS[13]}px;
  color: ${T.warning};
}

.qa-tbd {
  background: ${alpha(T.warning, 0.22)};
  color: ${T.text};
  padding: 0 ${S[1]}px;
  border-radius: ${RADIUS.sm}px;
  font-family: ${F.mono};
  font-size: ${FS[11]}px;
  white-space: nowrap;
}

.qa-legal-doc h1 {
  font-size: ${FS[28]}px;
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: ${LH.tight};
  margin: 0 0 ${S[2]}px;
}

.qa-legal-doc .qa-legal-meta {
  font-family: ${F.mono};
  font-size: ${FS[11]}px;
  color: ${T.muted};
  line-height: ${LH.relaxed};
  margin: 0 0 ${S[8]}px;
}

.qa-legal-doc h2 {
  font-size: ${FS[17]}px;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: ${LH.heading};
  color: ${T.text};
  margin: ${S[9]}px 0 ${S[3]}px;
  padding-top: ${S[4]}px;
  border-top: 1px solid ${T.border};
}

.qa-legal-doc h3 {
  font-size: ${FS[14]}px;
  font-weight: 600;
  line-height: ${LH.snug};
  color: ${T.text};
  margin: ${S[6]}px 0 ${S[2]}px;
}

.qa-legal-doc p,
.qa-legal-doc li {
  font-size: ${FS[13]}px;
  line-height: ${LH.loose};
  color: ${T.subtle};
}

.qa-legal-doc p { margin: 0 0 ${S[3]}px; }

.qa-legal-doc ul,
.qa-legal-doc ol {
  margin: 0 0 ${S[3]}px;
  padding-left: ${S[5]}px;
}

.qa-legal-doc li { margin-bottom: ${S[1.5]}px; }

.qa-legal-doc strong { color: ${T.text}; font-weight: 600; }

.qa-legal-doc a { color: ${T.champagne}; }

.qa-legal-doc .qa-legal-table-wrap {
  overflow-x: auto;
  margin: 0 0 ${S[4]}px;
}

.qa-legal-doc table {
  width: 100%;
  min-width: 460px;
  border-collapse: collapse;
  font-size: ${FS[12]}px;
  line-height: ${LH.relaxed};
}

.qa-legal-doc th,
.qa-legal-doc td {
  border: 1px solid ${T.border};
  padding: ${S[2]}px ${S[2.5]}px;
  text-align: left;
  vertical-align: top;
  color: ${T.subtle};
}

.qa-legal-doc th {
  background: ${T.surface2};
  color: ${T.text};
  font-weight: 600;
  white-space: nowrap;
}

.qa-legal-footer {
  border-top: 1px solid ${T.border};
  padding: ${S[6]}px;
  text-align: center;
  font-size: ${FS[11]}px;
  line-height: ${LH.loose};
  color: ${T.muted};
}

.qa-legal-footer a { color: ${T.champagne}; }

.qa-legal-footer-note {
  max-width: 520px;
  margin: ${S[2]}px auto;
}

@media (max-width: ${BP.sm}px) {
  .qa-legal-header { padding: ${S[4]}px; }
  .qa-legal-main { padding: ${S[6]}px ${S[4]}px ${S[10]}px; }
}
`;
