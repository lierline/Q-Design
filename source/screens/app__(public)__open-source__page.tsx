// =============================================================================
// app/(public)/open-source/page.tsx: 오픈소스 라이선스 고지 (공개)
// =============================================================================
// 🔑 **이 화면은 손으로 고치지 않는다.** 본문 자료는 전부
//    `lib/legal/oss-notice.generated.json` 에서 오고, 그 파일은
//    `scripts/licenses/notice.cjs` 가 실제 설치 트리를 훑어 만든다.
//    의존성을 바꾸면 `pnpm run licenses:build` 한 번으로 여기까지 따라온다.
//
// ── 왜 이 화면이 필요한가 ───────────────────────────────────────────────────
// MIT 는 「저작권 고지와 허가 고지를 소프트웨어의 모든 사본 또는 주요 부분에 포함할 것」을,
// Apache-2.0 §4(d)는 「NOTICE 의 귀속 고지를 배포물에 포함할 것」을 요구한다.
// 둘 다 요구하는 것은 **원문**이지 「MIT 를 씁니다」라는 한 줄이 아니다.
//
// 2026-09-10 에는 안드로이드 APK(Capacitor · AndroidX)가 배포되는 트리라서 이 화면이 생겼다.
// 2026-09-18 안드로이드 껍데기를 저장소에서 지웠다(출시된 적 없음 · CTO 감사 3번). 지금 배포되는
// 트리는 웹뿐이지만, 넉넉히 고지하는 편이 안전하므로 화면은 그대로 둔다. 옛 안드로이드 절은
// git 이력에 있다.

import type { Metadata } from 'next';
import Link from 'next/link';
import { BP, S, FS, F, T, LH, RADIUS, alpha } from '@/lib/design/tokens';
import notice from '@/lib/legal/oss-notice.generated.json';
import { isoDateTime } from '@/lib/date';

export const metadata: Metadata = {
  title: 'Q-Atelier · 오픈소스 라이선스',
  description:
    'Q-Atelier 가 사용하는 오픈소스 소프트웨어의 저작권 고지 및 라이선스 원문입니다.',
};

// ⚠️ **이 화면은 무겁다.** 실측(2026-09-10): 원본 2.28MB · gzip 265KB.
//    라이선스 원문 168종을 전부 싣기 때문이고, React 서버 컴포넌트가 같은 문자열을
//    HTML 과 RSC 페이로드에 두 번 담아 크기가 배로 뛴다(MIT 전문이 286회 등장).
//
// 🔑 그래도 나누지 않았다. 고지 의무는 «원문이 전달되는 것»으로 이행되고, 링크 뒤로
//    숨기면 한 겹이 더 생긴다. 안드로이드 시스템의 「오픈소스 라이선스」 화면도 같은
//    모양이다. 대신 요청마다 다시 그리지 않도록 빌드 때 한 번만 렌더한다.
//    (이 화면을 여는 사람은 사실상 스토어 심사원과 고객 실사 담당자뿐이다.)
export const dynamic = 'force-static';

// 색인에서 각 패키지가 어느 원문으로 가는지 미리 짝지어 둔다.
const anchorOf = new Map<string, string>();
for (const group of notice.groups) {
  for (const pkg of group.packages) anchorOf.set(pkg.name, `lic-${group.hash}`);
}
for (const pkg of notice.noText) anchorOf.set(pkg.name, 'no-text');

const indexEntries = [...notice.groups.flatMap((g) => g.packages), ...notice.noText].sort(
  (a, b) => a.name.localeCompare(b.name),
);

export default function OpenSourcePage() {
  const s = notice.scope;

  return (
    <article className="qa-legal-doc qa-oss">
      <style dangerouslySetInnerHTML={{ __html: ossCss }} />

      <h1>오픈소스 라이선스</h1>
      <p className="qa-legal-meta">
        문서 종류: 오픈소스 소프트웨어 고지
        <br />
        {/* 원문 UTC 대신 한국 시각으로 (화면 검토 A33 · 2026-09-27). 자료(JSON)는 그대로다 */}
        생성 시각: {isoDateTime(notice.generatedAt)} (한국 시각 · 실제 설치 트리에서 자동 생성)
        <br />
        스캔 지문: <code>{notice.fingerprint}</code>
      </p>

      <p>
        Q-Atelier 는 아래의 오픈소스 소프트웨어를 사용합니다. 각 소프트웨어의 저작권은 해당
        저작권자에게 있으며, 아래에 각 라이선스의 원문을 그대로 싣습니다. 이 목록은 사람이
        적은 것이 아니라 <strong>실제로 설치된 의존성 트리를 훑어 자동 생성</strong>한
        것이며, 구성이 바뀌면 함께 갱신됩니다.
      </p>

      {/* ── 범위를 먼저 밝힌다. 분모 없는 목록은 감사에서 쓸 수 없다. ────────── */}
      <h2>이 고지의 범위</h2>
      <div className="qa-legal-table-wrap">
        <table>
          <thead>
            <tr>
              <th>구분</th>
              <th>개수</th>
              <th>포함 여부</th>
              <th>사유</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>서비스 구성 (npm)</td>
              <td>{s.npmProduction}</td>
              <td>포함</td>
              <td>
                서비스를 구동하는 구성요소 전부입니다. 서버에서만 실행되어 이용자에게 전달되지
                않는 것까지 포함했습니다. <strong>모자라게 고지하는 것보다 넉넉히 고지하는
                편이 안전하기 때문입니다.</strong>
              </td>
            </tr>
            <tr>
              <td>개발 도구</td>
              <td>{s.npmDevelopmentExcluded}</td>
              <td>제외</td>
              <td>
                시험·빌드·타입 검사에만 쓰이며 서비스나 앱에 포함되지 않습니다.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="qa-oss-note">
        고지 대상 <strong>{s.totalListed}개</strong> · 라이선스 원문{' '}
        <strong>{s.licenseTextGroups}종</strong> (같은 원문을 쓰는 구성요소는 하나로 묶어
        실었습니다) · 원문 파일을 확인하지 못한 항목 <strong>{s.withoutLicenseText}개</strong>
      </p>

      {/* ── 색인 ─────────────────────────────────────────────────────────────── */}
      <h2 id="index">구성요소 목록</h2>
      <p>
        이름을 누르면 해당 라이선스 원문으로 이동합니다. 총 {indexEntries.length}개입니다.
      </p>
      <ul className="qa-oss-index">
        {indexEntries.map((pkg) => (
          <li key={`${pkg.name}@${pkg.version}`}>
            <a href={`#${anchorOf.get(pkg.name) ?? 'no-text'}`}>{pkg.name}</a>{' '}
            <span className="qa-oss-ver">{pkg.version}</span>
          </li>
        ))}
      </ul>

      {/* ── 원문 ─────────────────────────────────────────────────────────────── */}
      <h2>라이선스 원문</h2>
      <p>
        아래는 각 구성요소가 배포한 라이선스 파일의 원문입니다. 여러 구성요소가 동일한 원문을
        사용하는 경우 하나로 묶었습니다.
      </p>

      {notice.groups.map((group) => (
        <section key={group.hash} id={`lic-${group.hash}`} className="qa-oss-license">
          <h3>
            {group.packages[0].license}
            <span className="qa-oss-count"> · {group.packages.length}개 구성요소</span>
          </h3>
          <p className="qa-oss-members">
            {group.packages.map((p) => `${p.name} ${p.version}`).join(' · ')}
          </p>
          <pre className="qa-oss-text">{group.text}</pre>
          <p className="qa-oss-back">
            <a href="#index">목록으로</a>
          </p>
        </section>
      ))}

      {/* ── 🔑 없는 것을 없다고 적는다 ───────────────────────────────────────── */}
      <h2 id="no-text">원문 파일을 확인하지 못한 항목</h2>
      <p>
        아래 {notice.noText.length}개 구성요소는 배포 패키지 안에 라이선스 원문 파일을 포함하고
        있지 않습니다. 각 구성요소가 선언한 라이선스 종류는 아래와 같으며, 원문은 해당
        라이선스의 표준 전문과 동일합니다. <strong>확인하지 못한 사실을 확인한 것처럼 적지
        않기 위해 별도로 구분해 둡니다.</strong>
      </p>
      <div className="qa-legal-table-wrap">
        <table>
          <thead>
            <tr>
              <th>구성요소</th>
              <th>버전</th>
              <th>선언한 라이선스</th>
              <th>저작권자</th>
            </tr>
          </thead>
          <tbody>
            {notice.noText.map((p) => (
              <tr key={`${p.name}@${p.version}`}>
                <td>
                  <code>{p.name}</code>
                </td>
                <td>{p.version}</td>
                <td>{p.license}</td>
                <td>{p.author ?? '표기 없음'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>문의</h2>
      <p>
        이 고지의 내용에 대한 문의나 정정 요청은{' '}
        <a href="mailto:contact@medqraft.co.kr">contact@medqraft.co.kr</a> 로 보내 주시기
        바랍니다. 서비스 이용 조건은 <Link href="/terms">이용약관</Link>, 개인정보 처리에
        관한 사항은 <Link href="/privacy">개인정보처리방침</Link>에서 확인할 수 있습니다.
      </p>
    </article>
  );
}

// ─── 이 화면 전용 스타일 ────────────────────────────────────────────────────
// 부모 레이아웃의 `legalCss` 는 «모든» 공개 문서가 읽는다. 목록·원문처럼 이 화면에만
// 필요한 것을 거기 넣으면 약관·처리방침도 함께 받게 되므로 여기서만 정의한다.
//
// ⚠️ 숫자는 전부 토큰 보간이다. CSS 문자열 안의 raw 숫자는
//    `lib/design/no-raw-scale.test.ts` 의 baseline 을 갉아먹는다.
const ossCss = `
.qa-oss .qa-oss-note {
  padding: ${S[3]}px ${S[3.5]}px;
  border: 1px solid ${T.border};
  border-radius: ${RADIUS.md}px;
  background: ${T.surface2};
  font-size: ${FS[12]}px;
  line-height: ${LH.relaxed};
}

/* 색인: 이름이 길고 개수가 많아 여러 단으로 흘린다. 좁은 화면에서는 한 단이 된다. */
.qa-oss .qa-oss-index {
  columns: 2;
  column-gap: ${S[6]}px;
  list-style: none;
  margin: 0 0 ${S[6]}px;
  padding: 0;
}

.qa-oss .qa-oss-index li {
  break-inside: avoid;
  margin-bottom: ${S[1]}px;
  font-size: ${FS[12]}px;
  line-height: ${LH.snug};
}

.qa-oss .qa-oss-index a {
  color: ${T.subtle};
  text-decoration: none;
  border-bottom: 1px solid transparent;
}

.qa-oss .qa-oss-index a:hover {
  color: ${T.champagne};
  border-bottom-color: ${T.border};
}

.qa-oss .qa-oss-ver {
  font-family: ${F.mono};
  font-size: ${FS[12]}px;
  color: ${T.muted};
}

.qa-oss .qa-oss-license {
  margin: 0 0 ${S[8]}px;
  padding-top: ${S[2]}px;
  /* 앵커로 뛰었을 때 제목이 화면 위로 잘리지 않게 한다. */
  scroll-margin-top: ${S[6]}px;
}

.qa-oss .qa-oss-license h3 {
  font-family: ${F.mono};
  color: ${T.champagne};
}

.qa-oss .qa-oss-count {
  font-family: ${F.mono};
  font-size: ${FS[12]}px;
  color: ${T.muted};
  font-weight: 400;
}

.qa-oss .qa-oss-members {
  font-size: ${FS[12]}px;
  line-height: ${LH.relaxed};
  color: ${T.muted};
  margin: 0 0 ${S[2]}px;
}

/* 원문은 «있는 그대로» 보여야 한다. 줄바꿈을 살리고 긴 줄은 접는다. */
.qa-oss .qa-oss-text {
  margin: 0;
  padding: ${S[3]}px ${S[3.5]}px;
  border: 1px solid ${T.border};
  border-radius: ${RADIUS.sm}px;
  background: ${T.surface2};
  color: ${T.subtle};
  font-family: ${F.mono};
  font-size: ${FS[12]}px;
  line-height: ${LH.relaxed};
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: auto;
}

.qa-oss .qa-oss-back {
  margin: ${S[1.5]}px 0 0;
  font-size: ${FS[12]}px;
}

.qa-oss code {
  font-family: ${F.mono};
  font-size: ${FS[12]}px;
  color: ${T.text};
  background: ${alpha(T.champagne, 0.08)};
  padding: 0 ${S[1]}px;
  border-radius: ${RADIUS.sm}px;
}

@media (max-width: ${BP.sm}px) {
  .qa-oss .qa-oss-index { columns: 1; }
}
`;
