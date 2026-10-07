// 폰의 구독 요약: 작은 아이콘 → 화면을 덮는 창 (오너 2026-09-28 «폰에서도 요약이라도 간단하게 · 누르면 화면을 덮는 팝업»)
//
// 9월 27일(화면 검토 A71)에는 폰에서 통째로 숨겼다(qa-hide-mobile). 이제 폰도 아이콘을 둔다.
// 창은 body 에 띄워야 아래 탭줄을 덮고, 창 표시가 있어야 폰 앱의 뒤로가 이 창만 닫는다.
import { describe, expect, it } from 'vitest';
import { readSource } from '@/lib/test-utils/contract-source';

const src = readSource('components/SubscriptionIndicator.tsx');

describe('폰 구독 요약 창', () => {
  it('폰에서 통째로 숨기지 않는다', () => {
    expect(src).not.toMatch(/className="qa-hide-mobile"/);
  });

  it('창은 body 에 띄우고 창 표시(role · aria-modal)를 단다', () => {
    expect(src).toMatch(/createPortal\(/);
    expect(src).toMatch(/document\.body/);
    expect(src).toMatch(/role="dialog"\s+aria-modal="true"/);
    expect(src).toMatch(/zIndex: Z\.modal/);
  });

  it('창 안을 누른 것을 바깥 누름으로 보고 닫지 않는다', () => {
    expect(src).toMatch(/dialogRef\.current && dialogRef\.current\.contains\(target\)\) return;/);
  });

  it('터치 화면에서는 마우스 올림으로 열지 않는다(누름과 겹쳐 곧바로 닫혔다)', () => {
    expect(src).toMatch(/if \(isTouch\) return;/);
  });
});
