import { readDesignFile } from '@/lib/test-utils/design-source';
// =============================================================================
// 계약: sticky inset 은 스크롤 컨테이너의 padding 을 감안한다 (UI-01 · UI-02)
// =============================================================================
// 🔴 2026-09-03 실사고. 상단 밴드가 top 0, 현장 모드 저장 바가 bottom 0 으로
//    「화면 맨 위 · 맨 아래」에 붙는다고 가정했는데, sticky inset 은 **스크롤 컨테이너의
//    내용 상자** 기준이라 main 의 padding(32px)만큼 어긋났습니다.
//      · 밴드가 32px 내려앉아 본문 첫 줄(뒤로가기 링크)을 통째로 덮었습니다(클릭 불가).
//      · 저장 바가 32px 떠서 그 틈으로 폼이 비쳤습니다.
//    실측(1600x1000): 밴드 {top 32, bottom 88} · 본문 첫 줄 {top 56} · 바 {bottom 968}.
//
// 🔑 padding 은 화면 폭에 따라 세 가지(데스크톱 32 · 패드 100+safe · 폰 128+safe)라
//    컴포넌트가 숫자를 베끼면 어느 한 층에서 반드시 어긋납니다. 그래서 이 계약은
//    ① 계산식이 세 padding 모두에서 «화면 가장자리에 정확히» 붙는지를 모델로 검사하고,
//    ② 두 컴포넌트가 그 계산식을 실제로 쓰는지(리터럴 0 으로 되돌아가지 않았는지),
//    ③ main 의 padding 이 MAIN_PADDING 한 곳에서 나오는지를 봅니다.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  MAIN_PADDING, stickyBottomInset, stickyTopInset, stuckBottom, stuckTop,
} from './sticky-inset';

const ROOT = join(__dirname, '..', '..');
const read = (rel: string) => readDesignFile(join(ROOT, rel), 'utf8');

/** 주석은 계약 대상이 아닙니다. 주석 안에서는 함정을 설명하느라 같은 문구를 씁니다. */
function code(rel: string): string {
  return read(rel)
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      return !(t.startsWith('//') || t.startsWith('*') || t.startsWith('/*'));
    })
    .join('\n');
}

/** calc(64px - 100px) 같은 결과 문자열을 px 숫자로 되돌립니다(reserve 가 숫자일 때만). */
function calcPx(css: string): number {
  const m = /^calc\((-?[0-9.]+)px - (-?[0-9.]+)px\)$/.exec(css);
  if (!m) throw new Error(`숫자 calc 가 아닙니다: ${css}`);
  return Number(m[1]) - Number(m[2]);
}

/** app/globals.css 가 !important 로 덮는 실제 padding 3종(safe-area 는 0 으로 본다). */
const HOSTS = [
  { name: '데스크톱', padTop: MAIN_PADDING.top, padBottom: MAIN_PADDING.bottom },
  { name: '패드(768~1023)', padTop: 68, padBottom: 100 },
  { name: '폰(<768)', padTop: 68, padBottom: 128 },
];

const VIEWPORT_TOP = 0;
const VIEWPORT_BOTTOM = 1000;
/** 모바일 하단 네비(MobileBottomNav)의 높이. 저장 바는 그 위에 앉아야 합니다. */
const NAV = 64;

describe('sticky inset 계약', () => {
  it('상단 밴드는 padding 과 무관하게 화면 맨 위에 붙는다', () => {
    for (const h of HOSTS) {
      const stuck = stuckTop(VIEWPORT_TOP, h.padTop, stickyTopInset(h.padTop));
      expect(stuck, `${h.name}: 밴드가 화면 맨 위에 붙지 않습니다`).toBe(VIEWPORT_TOP);
    }
  });

  it('데스크톱 저장 바는 화면 밑변에 붙는다 (아래에 틈이 없다)', () => {
    const inset = calcPx(stickyBottomInset(MAIN_PADDING.bottom));
    expect(stuckBottom(VIEWPORT_BOTTOM, MAIN_PADDING.bottom, inset)).toBe(VIEWPORT_BOTTOM);
  });

  it('모바일 저장 바는 하단 네비 바로 위에 붙는다', () => {
    for (const h of HOSTS.slice(1)) {
      const inset = calcPx(stickyBottomInset(h.padBottom, `${NAV}px`));
      const stuck = stuckBottom(VIEWPORT_BOTTOM, h.padBottom, inset);
      expect(stuck, `${h.name}: 저장 바와 하단 네비 사이에 틈이 있습니다`).toBe(VIEWPORT_BOTTOM - NAV);
    }
  });

  it('safe-area 가 섞인 reserve 도 그대로 calc 로 넘어간다', () => {
    // 측정한 padding 에는 env() 가 이미 풀려 들어 있으므로 계산 안에서 서로 상쇄됩니다.
    expect(stickyBottomInset(128, 'calc(64px + env(safe-area-inset-bottom, 0px))'))
      .toBe('calc(calc(64px + env(safe-area-inset-bottom, 0px)) - 128px)');
  });

  it('두 컴포넌트가 리터럴 0 이 아니라 계산식을 쓴다', () => {
    const band = code('components/TopHeaderBand.tsx');
    expect(band).toContain('top: stickyTopInset(');
    expect(band, '밴드가 리터럴 top inset 으로 되돌아갔습니다').not.toMatch(/\btop:\s*0\b/);

    const field = code('app/(app)/m/field-ui.tsx');
    expect(field).toContain('bottom: stickyBottomInset(');
    expect(field, '저장 바가 리터럴 bottom inset 으로 되돌아갔습니다').not.toMatch(/\bbottom:\s*(?:0\b|isMobile)/);
  });

  it('main 의 padding 은 MAIN_PADDING 한 곳에서 나온다', () => {
    const layout = code('app/(app)/layout.tsx');
    expect(layout).toContain('${MAIN_PADDING.top}px');
    expect(layout, 'main padding 이 다시 리터럴로 적혔습니다').not.toMatch(/padding:\s*'[0-9]+px [0-9]+px'/);
  });
});
