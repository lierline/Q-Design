import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// =============================================================================
// 디자인 가드: 조작 윤곽(--qa-ctl)은 인접 면과 3:1 이상 (2026-10-10)
// =============================================================================
// 입력 칸 · 보조 단추 · 아이콘 단추의 테두리는 «여기가 누르는 곳» 을 알리는 선이라 WCAG 1.4.11(비텍스트 대비 3:1)을 받는다.
// 종전에는 행 구분선 색(--qa-border)을 그대로 썼고 실측 1.2 ~ 1.3:1 이라 칸 경계가 거의 보이지 않았다.
// 행 · 구역 구분선(--qa-border · --qa-borderHi)은 구조선이라 이 기준 밖(장식)에 둔다. 두 층을 섞지 말 것.
//
// 값은 globals.css 의 `--qa-ctl` 한 곳에서 읽는다(손으로 옮겨 적지 않는다).

const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');

function lum(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** 블록(선택자 { … }) 안에서 변수 값을 읽는다. 블록 시작 위치는 선택자 문자열로 찾는다. */
function varIn(block: string, name: string): string {
  const m = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(block);
  if (!m) throw new Error(`${name} 을 블록에서 찾지 못했습니다`);
  return m[1];
}
function blockAt(selector: string): string {
  const i = css.indexOf(selector);
  if (i < 0) throw new Error(`${selector} 블록이 없습니다`);
  return css.slice(i, css.indexOf('}', i));
}

const THEMES = [
  { name: '다크', block: blockAt(':root,') },
  { name: '라이트', block: blockAt("html[data-theme='light'] {") },
];
const FACES = ['--qa-bg', '--qa-surface', '--qa-surface2'];

describe('조작 윤곽 --qa-ctl 은 인접 면과 3:1 이상', () => {
  for (const t of THEMES) {
    for (const face of FACES) {
      it(`${t.name} · ${face}`, () => {
        const ctl = varIn(t.block, '--qa-ctl');
        expect(ratio(ctl, varIn(t.block, face))).toBeGreaterThanOrEqual(3);
      });
    }
  }

  it('입력 칸 · 보조 단추 · 아이콘 단추가 구분선 색이 아니라 CTL 을 쓴다', () => {
    const comp = readFileSync(join(process.cwd(), 'lib/design/components.tsx'), 'utf8');
    const input = /const inputStyle[\s\S]*?\n\};/.exec(comp)?.[0] ?? '';
    expect(input).toContain('${CTL}');
    expect(input).not.toMatch(/border: `1px solid \$\{T\.border/);
  });

  it('목록 쪽 이동 단추 · 거르개 칸도 CTL 을 쓴다', () => {
    for (const f of ['components/ListPager.tsx', 'components/ListToolbar.tsx']) {
      const src = readFileSync(join(process.cwd(), f), 'utf8');
      expect(src, f).toContain('border: `1px solid ${CTL}`');
    }
  });
});
