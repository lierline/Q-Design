import { readDesignFile } from '@/lib/test-utils/design-source';
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { STATE, OVERLAY, ELEVATION, Z, S, type StateKey } from './tokens';

// =============================================================================
// 디자인 SSOT 감사 1단계: globals.css 의 분할 색/그림자/백드롭 출처를 tokens 표면
// (STATE·OVERLAY·ELEVATION·Z)으로 승격. 이 가드는 토큰↔globals.css 동기화를 동결해
// 'tokens 에서 가져오면 실제 CSS 변수와 항상 일치'를 보장한다(분할 출처 재발 방지).
// =============================================================================

const read = (rel: string) => readDesignFile(join(process.cwd(), rel), 'utf8');

describe('[디자인 1단계] 승격 토큰: 분할 출처 닫기', () => {
  const css = read('app/globals.css');

  it('STATE 7색이 globals.css --qa-state-* 와 1:1 매핑', () => {
    const keys = Object.keys(STATE) as StateKey[];
    expect(keys).toHaveLength(7);
    for (const k of keys) {
      expect(STATE[k]).toBe(`var(--qa-state-${k})`);
      expect(css).toContain(`--qa-state-${k}:`);
    }
  });

  it('OVERLAY·ELEVATION 이 globals.css 테마 인지 변수를 참조', () => {
    expect(OVERLAY.backdrop).toBe('var(--qa-backdrop)');
    expect(OVERLAY.backdropStrong).toBe('var(--qa-backdrop-strong)');
    expect(css).toContain('--qa-backdrop:');
    for (const s of ['sm', 'md', 'lg', 'xl'] as const) {
      expect(ELEVATION[s]).toBe(`var(--qa-shadow-${s})`);
      expect(css).toContain(`--qa-shadow-${s}:`);
    }
  });

  it('Z 레이어 스케일이 단조 증가(스태킹 순서 보장)', () => {
    const vals = Object.values(Z);
    for (let i = 1; i < vals.length; i++) {
      expect(vals[i]).toBeGreaterThanOrEqual(vals[i - 1]);
    }
  });

  it('[2단계] S 하프스텝(.5 키)이 2px 단위로 정확 + 기존 정수 키 불변(무파괴)', () => {
    expect(S[0.5]).toBe(2);
    expect(S[1.5]).toBe(6);
    expect(S[2.5]).toBe(10);
    expect(S[3.5]).toBe(14);
    expect(S[4.5]).toBe(18);
    expect(S[5.5]).toBe(22);
    // 기존 정수 키는 그대로(공용 컴포넌트 px 치환이 시각 변화를 일으키지 않음)
    expect(S[1]).toBe(4);
    expect(S[4]).toBe(16);
    expect(S[6]).toBe(24);
    expect(S[8]).toBe(32);
  });
});
