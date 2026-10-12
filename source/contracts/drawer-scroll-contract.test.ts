// 폰 서랍(차림표)이 손가락으로 스크롤되는가 (2026-09-28 오너 보고 «앱에서 메뉴 터치 스크롤이 안 된다»)
//
// 폰 서랍은 aside 가 스크롤하고 nav 는 스크롤하지 않는다. 그런데 nav 에 overflowX: hidden 이 있으면 브라우저가
// overflowY 의 visible 을 auto 로 바꿔 nav 가 «스크롤할 게 없는 스크롤 칸» 이 된다. 여기에 overscroll-behavior: contain 이
// 걸리면 손가락 스크롤이 aside 로 넘어가지 않아 서랍이 한 칸도 안 움직였다(운영에서 터치 끌기로 재현 · 본문은 396 내려가고
// 서랍은 0). 데스크톱은 nav 가 진짜 스크롤 칸이라 contain 이 맞다.
import { describe, expect, it } from 'vitest';
import { readSource } from '@/lib/test-utils/contract-source';

const src = readSource('components/Sidebar.tsx');

describe('폰 서랍 손가락 스크롤', () => {
  it('nav 의 overscroll 막기는 데스크톱에서만 건다', () => {
    const nav = src.slice(src.indexOf('aria-label="주 메뉴"'));
    const style = nav.slice(0, nav.indexOf('}}'));
    expect(style).toMatch(/overscrollBehavior:\s*isMobile\s*\?\s*'auto'\s*:\s*'contain'/);
    expect(style).not.toMatch(/overscrollBehavior:\s*'contain'/);
  });

  it('폰 서랍에서는 aside 가 스크롤한다', () => {
    expect(src).toMatch(/overflowY:\s*isMobile\s*\?\s*'auto'\s*:\s*'hidden'/);
  });
});
