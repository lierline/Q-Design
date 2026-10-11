// =============================================================================
// PageTabs: 화면 안을 주소(?tab=)로 가르는 탭 줄
// =============================================================================
// 서버 화면에서 그대로 쓴다(링크만 있다). 「QMS 문서」 의 기록 관리 탭(0407)과
// 교육의 역량 탭(0411)이 같은 모양을 쓴다.

import { QDText } from '@/lib/design/q-design-labels';
import { QDScale } from '@/lib/design/q-design-scale';
import Link from 'next/link';
import { S, F, T } from '@/lib/design/tokens';
import { QD } from '@/lib/design/q-design-contract';

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
    <div className="qd-tabs" role="tablist" aria-label={label} style={{ display: 'flex', flexWrap: 'wrap', borderBottom: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${T.border}`, marginBottom: QDScale.space[5] }}>
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <Link key={t.key} href={t.href} className="qd-tab" role="tab" aria-selected={on}
            style={{
              padding: "var(--qd-atelier-padding-32c3630eb9)", borderBottom: on ? `var(--qd-border-width-2) var(--qd-atelier-border-style-5ed175bd8d) ${T.champagne}` : "var(--qd-atelier-border-bottom-8a9040d989)",
              color: on ? T.text : T.muted, fontSize: QD.controlSize, fontFamily: QDScale.family.serif, fontWeight: on ? "var(--qd-font-weight-semibold)" : "var(--qd-font-weight-normal)",
              textDecoration: QDText.textDecoration.v30a0924a33, whiteSpace: 'nowrap', minHeight: QD.controlHeight, display: 'inline-flex', alignItems: 'center',
            }}>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
