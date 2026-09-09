import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// =============================================================================
// 디자인 가드: 색 대비(WCAG AA)를 «모든 표면 위에서» 강제
// =============================================================================
// 2026-08-20 감사에서 실측으로 드러난 것:
//
//   --qa-muted #7e7868 은 주석에 「WCAG AA 4.5:1 on #0c0c0c」 이라 적혀 있었지만
//   실제 값은 **bg 위 4.45 · surface 위 4.19 · surface2 위 3.92** 로 전부 미달이었다.
//
// 두 가지가 겹친 실수다:
//   ① 기준 표면을 **bg 하나로만** 잡았다. 그런데 muted 텍스트가 실제로 놓이는 곳은
//      카드(surface·surface2)이고, 그쪽이 더 밝아 대비가 «더 나쁘다».
//   ② 계산이 경계에 아슬아슬했다(4.53 이라 적혔지만 실측 4.45).
//
// 그래서 이 가드는 **텍스트 토큰 × 모든 표면 토큰**을 전수 대조한다.
// 한 표면만 통과하는 값은 통과가 아니다.
//
// SSOT 는 app/globals.css 의 CSS 변수다. 런타임이 읽는 값이 거기이기 때문이다.
// (lib/design/tokens.ts 의 팔레트 객체는 «사본» 이라 아래 두 번째 테스트가 대조한다.)

const CSS = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8');

/**
 * 선택자에 해당하는 블록에서 --qa-* 색을 캔다.
 *
 * ⚠️ **같은 선택자가 여러 번 나온다.** `:root` 만 해도 색 블록과 줄간격(--qa-lh-*)
 *    블록이 따로 있다. 처음 만난 것을 집으면 색이 하나도 없는 블록을 잡고,
 *    그러면 아래 대조 루프가 조용히 전부 건너뛰어 **«거짓 통과»** 가 된다
 *    (이 가드를 처음 쓸 때 실제로 그렇게 됐다).
 *    → `--qa-bg` 를 가진 블록을 찾을 때까지 넘기고, 못 찾으면 **던진다**.
 */
function vars(blockStart: RegExp): Record<string, string> {
  const re = new RegExp(blockStart.source, blockStart.flags.includes('g') ? blockStart.flags : blockStart.flags + 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(CSS)) !== null) {
    const open = CSS.indexOf('{', m.index);
    const close = CSS.indexOf('}', open);
    const body = CSS.slice(open, close);
    const out: Record<string, string> = {};
    for (const v of body.matchAll(/--qa-([a-zA-Z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})/g)) out[v[1]] = v[2];
    if (out.bg) return out;
  }
  throw new Error(`--qa-bg 를 가진 블록을 못 찾음: ${blockStart}. 선택자가 바뀌었으면 이 테스트를 고칠 것.`);
}

/** 대조할 값을 «실제로 찾았는지» 확인한다. 못 찾고 통과하는 것이 가장 나쁘다. */
function assertFound(v: Record<string, string>, keys: readonly string[], where: string) {
  const missing = keys.filter((k) => !v[k]);
  if (missing.length) throw new Error(`${where}: ${missing.join(', ')} 를 못 찾았다. 파서가 헛돌고 있다.`);
}

function rgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}
function luminance(c: [number, number, number]): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
}
export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(rgb(a)), luminance(rgb(b))];
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const SURFACES = ['bg', 'surface', 'surface2'] as const;
/** 본문·보조 텍스트로 쓰이는 토큰. 큰 제목 전용이 아니므로 전부 4.5:1 기준. */
const TEXT_TOKENS = ['text', 'subtle', 'muted', 'champagne', 'green', 'red', 'warning', 'blue'] as const;
const AA_NORMAL = 4.5;

// 선택자는 `:root,\n html[data-theme='dark'] {` 처럼 묶여 있다. 콤마까지 감안한다.
const DARK_RE = /html\[data-theme='dark'\][^{]*\{/;
const LIGHT_RE = /html\[data-theme='light'\][^{]*\{/;

const THEMES = [
  { name: '다크', re: DARK_RE },
  { name: '라이트', re: LIGHT_RE },
] as const;

describe('디자인 가드: 색 대비 (WCAG AA 4.5:1)', () => {
  for (const theme of THEMES) {
    it(`${theme.name}: 텍스트 토큰이 «모든» 표면 위에서 AA 를 통과한다`, () => {
      const v = vars(theme.re);
      assertFound(v, [...SURFACES, ...TEXT_TOKENS], `${theme.name} 팔레트`);
      const fails: string[] = [];
      for (const t of TEXT_TOKENS) {
        if (!v[t]) continue;
        for (const s of SURFACES) {
          if (!v[s]) continue;
          const cr = contrast(v[t], v[s]);
          if (cr < AA_NORMAL) {
            fails.push(`--qa-${t}(${v[t]}) on --qa-${s}(${v[s]}) = ${cr.toFixed(2)} < ${AA_NORMAL}`);
          }
        }
      }
      expect(fails, `\n${fails.join('\n')}\n\n색을 고칠 때는 **가장 어려운 표면**(대개 surface2)을 기준으로 잡을 것.\nbg 하나만 보고 맞추면 카드 위에서 조용히 미달한다.`).toEqual([]);
    });
  }

  // 인쇄 팔레트도 텍스트가 놓이는 표면이 둘(#ffffff · surface2)이다.
  // 심사원은 출력물을 읽는다. 화면만 맞추면 반쪽이다.
  it('인쇄 팔레트도 AA 를 통과한다', () => {
    const idx = CSS.indexOf('@media print');
    expect(idx, '@media print 블록이 있어야 한다').toBeGreaterThan(-1);
    const body = CSS.slice(idx, idx + 1600);
    const v: Record<string, string> = {};
    for (const m of body.matchAll(/--qa-([a-zA-Z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})/g)) v[m[1]] = m[2];
    const fails: string[] = [];
    for (const t of ['text', 'subtle', 'muted', 'champagne']) {
      if (!v[t]) continue;
      for (const s of ['bg', 'surface', 'surface2']) {
        if (!v[s]) continue;
        const cr = contrast(v[t], v[s]);
        if (cr < AA_NORMAL) fails.push(`인쇄 --qa-${t}(${v[t]}) on ${s}(${v[s]}) = ${cr.toFixed(2)}`);
      }
    }
    expect(fails, `\n${fails.join('\n')}`).toEqual([]);
  });
});

describe('디자인 가드: 팔레트 사본 동기화', () => {
  // tokens.ts 의 DARK/LIGHT_PALETTE 는 globals.css 의 **사본**이다.
  // 파일 주석이 「색 수정 시 양쪽 모두 변경」이라 적어 두었지만, 규칙을 적어 두는 것만으로는
  // 어긋남을 막지 못한다(2026-08-20 감사에서 라이트 4색이 실제로 갈려 있었다).
  // 값을 맞추라고 말하는 대신 **어긋나면 실패**하게 한다.
  const TOKENS = readFileSync(join(process.cwd(), 'lib', 'design', 'tokens.ts'), 'utf8');

  function paletteOf(constName: string): Record<string, string> {
    const i = TOKENS.indexOf(`const ${constName}`);
    if (i < 0) throw new Error(`${constName} 를 못 찾음`);
    const body = TOKENS.slice(i, TOKENS.indexOf('} as const', i));
    const out: Record<string, string> = {};
    for (const m of body.matchAll(/(\w+)\s*:\s*'(#[0-9a-fA-F]{3,8})'/g)) out[m[1]] = m[2].toLowerCase();
    return out;
  }
  // tokens.ts 는 camelCase(surface2·borderHi·onAccent), CSS 는 kebab 도 섞여 있다.
  const CSS_NAME: Record<string, string> = { onAccent: 'on-accent' };

  for (const [constName, themeRe, label] of [
    ['DARK_PALETTE', DARK_RE, '다크'],
    ['LIGHT_PALETTE', LIGHT_RE, '라이트'],
  ] as const) {
    it(`${label}: tokens.ts 팔레트가 globals.css 와 값이 같다`, () => {
      const ts = paletteOf(constName);
      const css = vars(themeRe);
      const diffs: string[] = [];
      for (const [k, val] of Object.entries(ts)) {
        const cssKey = CSS_NAME[k] ?? k;
        const cssVal = css[cssKey]?.toLowerCase();
        if (!cssVal) continue; // CSS 에 없는 키는 이 테스트의 대상이 아니다
        if (cssVal !== val) diffs.push(`${k}: tokens.ts=${val} ≠ globals.css=${cssVal}`);
      }
      expect(diffs, `\n${diffs.join('\n')}\n\nglobals.css 가 SSOT 다(런타임이 읽는 값). tokens.ts 를 그쪽에 맞출 것.`).toEqual([]);
    });
  }
});
