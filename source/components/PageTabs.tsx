// =============================================================================
// PageTabs: 화면 안을 주소(?tab=)로 가르는 탭 줄
// =============================================================================
// 서버 화면에서 그대로 쓴다(링크만 있다). 「QMS 문서」 의 기록 관리 탭(0407)과
// 교육의 역량 탭(0411)이 같은 모양을 쓴다.

import Link from 'next/link';
import { S, FS, F, T } from '@/lib/design/tokens';

export function PageTabs({
  label, tabs, active,
}: {
  label: string;
  tabs: ReadonlyArray<{ key: string; href: string; label: string }>;
  active: string;
}) {
  return (
    // 가로 스크롤을 두지 않는다(탭이 몇 개뿐이고, 좁은 화면에서는 줄을 바꾼다). 손으로 적은 스크롤은
    // 인쇄 배율 계약(lib/design/print-fit)이 세고 있다.
    <div role="tablist" aria-label={label} style={{ display: 'flex', flexWrap: 'wrap', borderBottom: `1px solid ${T.border}`, marginBottom: S[5] }}>
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <Link key={t.key} href={t.href} role="tab" aria-selected={on}
            style={{
              padding: '12px 18px', borderBottom: on ? `2px solid ${T.champagne}` : '2px solid transparent',
              color: on ? T.text : T.muted, fontSize: FS[13], fontFamily: F.serif, fontWeight: on ? 600 : 400,
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
