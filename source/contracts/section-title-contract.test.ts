import { describe, it, expect } from 'vitest';
import { readSource } from '@/lib/test-utils/contract-source';
import { QD } from './q-design-contract';
import { resolvedStyleValue } from '@/lib/test-utils/design-source';

// 구역 제목 글자 단계(2026-10-10 C안): 16/700 본문색, 금색은 앞의 모노 번호(.qa-sec-t::before)에만.
// 구역 제목 4곳은 SECTION_TITLE 한 벌을 쓴다. 손으로 다시 12px 금색 모노를 만들면 여기서 빨개진다.

const comp = readSource('lib/design/components.tsx', 'code');
const css = readSource('app/globals.css', 'raw'); // CSS 는 주석 제거(codeOnly)가 TS 규칙이라 원문으로 본다
const foundation = readSource('app/q-design.foundation.css', 'raw'); // Resolve the actual imported CSS declarations, including central typography variables.

describe('구역 제목 글자 단계', () => {
  it('SECTION_TITLE 은 16px · 700 · 본문색 · ui 글꼴이다', () => {
    const body = /export const SECTION_TITLE = \{[\s\S]*?\} as const;/.exec(comp)?.[0] ?? '';
    expect(body).toContain('fontSize: QD.sectionSize');
    expect(QD.sectionSize).toBe('var(--qd-section-size, 16px)');
    const weight = /fontWeight:\s*['"]([^'"]+)['"]/.exec(body)?.[1] ?? '';
    expect(weight).toBe('var(--qd-font-weight-bold)');
    expect(resolvedStyleValue(weight, foundation)).toBe('700');
    expect(resolvedStyleValue(weight, foundation.replace('--qd-font-weight-bold: 700;', '--qd-font-weight-bold: 650;'))).toBe('650');
    expect(body).toContain('color: T.text');
    expect(body).toContain('fontFamily: QDScale.family.ui');
  });

  it('구역 제목 4곳이 모두 qa-sec-t 와 SECTION_TITLE 을 쓴다', () => {
    expect((comp.match(/className="qa-sec-t"/g) ?? []).length).toBe(4);
    expect((comp.match(/style=\{SECTION_TITLE\}|\.\.\.SECTION_TITLE/g) ?? []).length).toBe(4);
  });

  it('번호는 CSS 카운터가 붙이고 금색이다', () => {
    expect(css).toContain('counter-reset: qa-sec');
    expect(css).toMatch(/\.qa-sec-t::before\s*\{[^}]*counter-increment: qa-sec[^}]*var\(--qa-champagne\)/);
  });
});
