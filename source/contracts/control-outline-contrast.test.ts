import { readDesignFile, resolveStyleValues } from '@/lib/test-utils/design-source';
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { readSource } from '@/lib/test-utils/contract-source';
import { QD } from './q-design-contract';
import { CTL } from './grain';

// =============================================================================
// 디자인 가드: 조작 윤곽(--qa-ctl)은 인접 면과 3:1 이상 (2026-10-10)
// =============================================================================
// 입력 칸 · 보조 단추 · 아이콘 단추의 테두리는 «여기가 누르는 곳» 을 알리는 선이라 WCAG 1.4.11(비텍스트 대비 3:1)을 받는다.
// 종전에는 행 구분선 색(--qa-border)을 그대로 썼고 실측 1.2 ~ 1.3:1 이라 칸 경계가 거의 보이지 않았다.
// 행 · 구역 구분선(--qa-border · --qa-borderHi)은 구조선이라 이 기준 밖(장식)에 둔다. 두 층을 섞지 말 것.
//
// 값은 globals.css 의 `--qa-ctl` 한 곳에서 읽는다(손으로 옮겨 적지 않는다).

const css = readSource('app/globals.css', 'raw'); // 색 값은 CSS 원문에서 읽는다(codeOnly 는 TS 주석 규칙이라 CSS 를 망가뜨릴 수 있음);

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
    const comp = readSource('lib/design/components.tsx', 'code');
    const input = /const inputStyle[\s\S]*?\n\};/.exec(comp)?.[0] ?? '';
    expect(input).toContain('${QD.ctl}');
    expect(QD.ctl).toBe(`var(--qd-ctl, ${CTL})`);
    expect(input).not.toMatch(/border: `1px solid \$\{T\.border/);
  });

  it('손으로 만든 입력 칸 스타일(inputStyle · selectStyle · fieldStyle · inp)이 구분선 색을 테두리로 쓰지 않는다', () => {
    const walk = (dir: string, out: string[] = []): string[] => {
      for (const n of readdirSync(dir)) {
        const p = join(dir, n);
        if (n === 'node_modules' || n.startsWith('.')) continue;
        if (statSync(p).isDirectory()) walk(p, out);
        else if (p.endsWith('.tsx') && !p.endsWith('.test.tsx')) out.push(p);
      }
      return out;
    };
    const decl = /const (inputStyle|inputCss|selectStyle|fieldStyle|inp)\b[^\n=]*=\s*(?:\([^)]*\)\s*=>\s*)?\(?\{/g;
    const bad: string[] = [];
    for (const f of [...walk(join(process.cwd(), 'app')), ...walk(join(process.cwd(), 'components'))]) {
      const src = resolveStyleValues(readDesignFile(f, 'utf8'));
      for (const m of src.matchAll(decl)) {
        let depth = 0;
        let i = m.index! + m[0].length - 1;
        const start = i;
        for (; i < src.length; i++) {
          if (src[i] === '{') depth++;
          else if (src[i] === '}' && --depth === 0) break;
        }
        const body = src.slice(start, i + 1);
        if (/border:\s*`1px solid \$\{T\.border(?:Hi)?\}`/.test(body)) bad.push(`${f.replace(process.cwd(), '')} · ${m[1]}`);
      }
    }
    expect(bad, '입력 칸 테두리는 CTL(--qa-ctl)을 쓸 것').toEqual([]);
    // app · components 의 화면 파일을 전부 읽는다. 따로 돌리면 3초대지만 시험 전체를 한꺼번에 돌리면
    // 기본 30초를 넘겨 main 올리기 전 훅이 시간 초과로 막혔다(2026-10-20, 세 번 연달아). 한도만 늘린다.
  }, 120_000);

  it('목록 쪽 이동 단추 · 거르개 칸도 CTL 을 쓴다', () => {
    for (const f of ['components/ListPager.tsx', 'components/ListToolbar.tsx']) {
      const src = resolveStyleValues(readSource(f, 'code'));
      expect(src, f).toContain('border: `1px solid ${QD.ctl}`');
    }
  });
});
