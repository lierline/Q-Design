/**
 * 첫 그림(서버가 보낸 HTML 이 스크립트 없이 그려지는 순간)의 폰 · 패드 세로 모양 (2026-09-27)
 *
 * 가상 폰에서 앱을 켜 화면을 연달아 찍었더니, 결재함이 뜨기 전에 데스크탑 차림표가 화면의 60% 를 덮은 채
 * 먼저 그려졌고 아래 탭줄은 없었다. 둘 다 «붙은 뒤(마운트 뒤)에 폭을 재서» 모양을 정하는 부품이라, 서버가
 * 그린 첫 그림은 데스크탑 모양이었다. 망이 느린 폰일수록 스크립트가 늦게 와 그 모양이 오래 남는다.
 *
 * 고친 길: 차림표는 CSS 가 폭으로 먼저 감추고 자리표시 단추를 켠다. 탭줄은 서버가 폰 앱이라고 본 요청이면
 * 첫 그림부터 그린다. 폭 판정 훅(구독 칩 · 알림 종 · 머리띠가 씀)도 폰 앱이면 첫 값을 폰으로 준다(배포 뒤 다시
 * 찍어 보니 칩만 PC 모양으로 먼저 그려졌다가 줄며 자리를 옮겼다). 이 계약은 그 배선이 남아 있는지와, CSS 의 폭이
 * 차림표의 기준 폭과 같은지를 본다.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { readSource, REPO_ROOT } from '@/lib/test-utils/contract-source';
import { BP } from '@/lib/design/tokens';
import { BreakpointsFirstGuess, PHONE_GUESS, useBreakpoints } from '@/lib/hooks/useBreakpoints';

const css = readFileSync(join(REPO_ROOT, 'app/globals.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** 선택자 하나의 규칙 본문들(미디어 블록 안팎 모두). 공백은 하나로 줄인다 */
function rulesFor(selector: string, source: string): string[] {
  const out: string[] = [];
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, (c) => String.fromCharCode(92) + c);
  const re = new RegExp(esc + '\\s*\\{([^}]*)\\}', 'g');
  for (let m = re.exec(source); m; m = re.exec(source)) out.push(m[1].replace(/\s+/g, ' ').trim());
  return out;
}

/** '@media (max-width: Npx) {' 로 여는 블록 중 selector 를 가진 것의 본문 */
function mediaBlockWith(selector: string): { width: number; body: string } | null {
  const re = /@media \(max-width: (\d+)px\) \{/g;
  for (let m = re.exec(css); m; m = re.exec(css)) {
    let depth = 0;
    const start = m.index + m[0].length - 1;
    for (let j = start; j < css.length; j++) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}' && --depth === 0) {
        const body = css.slice(start + 1, j);
        if (body.includes(selector)) return { width: Number(m[1]), body };
        break;
      }
    }
  }
  return null;
}

describe('첫 그림의 차림표: 폭이 lg 미만이면 CSS 가 먼저 감춘다', () => {
  it('감싸개는 평소 display: contents(데스크탑 배치가 그대로), 자리표시 단추는 평소 감춘다', () => {
    const outside = css.replace(/@media[^{]*\{(?:[^{}]*\{[^}]*\})*[^{}]*\}/g, '');
    expect(rulesFor('.qa-sidebar-ssr', outside)).toContain('display: contents;');
    expect(rulesFor('.qa-drawer-fab-ssr', outside)).toContain('display: none;');
  });

  it('lg 미만에서는 감싸개를 감추고 자리표시 단추를 켠다. 폭은 Sidebar 의 DRAWER_BP(BP.lg) - 1', () => {
    const block = mediaBlockWith('.qa-sidebar-ssr');
    expect(block, '첫 그림 차림표의 미디어 블록이 없다').not.toBeNull();
    expect(block!.width).toBe(BP.lg - 1);
    expect(rulesFor('.qa-sidebar-ssr', block!.body)).toContain('display: none;');
    expect(rulesFor('.qa-drawer-fab-ssr', block!.body)).toContain('display: flex;');
  });

  it('Sidebar 의 마운트 전 갈래가 감싸개와 자리표시 단추를 쓴다', () => {
    const src = readSource('components/Sidebar.tsx');
    const i = src.indexOf('if (!mounted)');
    expect(i, '마운트 전 갈래가 없다').toBeGreaterThan(-1);
    const branch = src.slice(i, src.indexOf('if (!isMobile)', i));
    expect(branch).toContain('className="qa-sidebar-ssr"');
    expect(branch).toContain('className="qa-drawer-fab-ssr"');
    expect(src).toMatch(/const DRAWER_BP = BP\.lg;/);
  });

  it('차림표 단추의 공용 모양에는 display 가 없다(인라인이 있으면 CSS 의 감춤을 이긴다)', () => {
    const src = readSource('components/Sidebar.tsx');
    const i = src.indexOf('const DRAWER_FAB_STYLE');
    expect(i).toBeGreaterThan(-1);
    const body = src.slice(i, src.indexOf('};', i));
    expect(body).not.toMatch(/\bdisplay\s*:/);
    expect(src).toContain("style={{ ...DRAWER_FAB_STYLE, display: 'flex' }}");
  });
});

describe('첫 그림의 탭줄: 서버가 폰 앱이라고 본 요청은 처음부터 그린다', () => {
  it('MobileBottomNav 의 isMobile 첫 값은 initialPhoneApp 이면 true', () => {
    expect(readSource('components/MobileBottomNav.tsx')).toMatch(
      /useState<boolean \| null>\(initialPhoneApp \? true : null\)/,
    );
  });

  it('레이아웃이 탭줄에 서버의 폰 앱 판정을 넘긴다', () => {
    expect(readSource('app/(app)/layout.tsx')).toMatch(/<MobileBottomNav[\s\S]*?initialPhoneApp=\{phoneApp\}/);
  });
});

/** 폭 판정 훅의 값을 글로 내보내는 시험용 부품 */
function Probe() {
  const b = useBreakpoints();
  return createElement('i', null, [b.isMobile, b.isCompact, b.isTouch].join('/'));
}

describe('첫 그림의 구독 칩 · 알림 종 · 머리띠: 폰 앱이면 폭 판정의 첫 값이 폰', () => {
  it('서버 그림(효과가 돌지 않음)에서 폰 앱이면 폰 값, 아니면 PC 값, 감싸개 밖이면 PC 값', () => {
    const phone = renderToString(createElement(BreakpointsFirstGuess, { phone: true }, createElement(Probe)));
    const desk = renderToString(createElement(BreakpointsFirstGuess, { phone: false }, createElement(Probe)));
    const bare = renderToString(createElement(Probe));
    expect(phone).toContain('<i>true/true/true</i>');
    expect(desk).toContain('<i>false/false/false</i>');
    expect(bare).toContain('<i>false/false/false</i>');
    expect(PHONE_GUESS).toEqual({ isMobile: true, isCompact: true, isTouch: true });
  });

  it('레이아웃이 서버의 폰 앱 판정으로 감싼다(구독 칩 · 알림 종 · 머리띠 · 탭줄이 모두 그 안에 있다)', () => {
    const src = readSource('app/(app)/layout.tsx');
    const open = src.indexOf('<BreakpointsFirstGuess phone={phoneApp}>');
    const close = src.indexOf('</BreakpointsFirstGuess>');
    expect(open, '감싸개가 없다').toBeGreaterThan(-1);
    for (const part of ['<TopHeaderBand>', '<SubscriptionIndicator', '<NotificationBell', '<MobileBottomNav']) {
      const at = src.indexOf(part);
      expect(at > open && at < close, `${part} 가 감싸개 밖에 있다`).toBe(true);
    }
  });
});
