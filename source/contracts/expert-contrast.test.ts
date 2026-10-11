import { readDesignFile, rootPalette } from '@/lib/test-utils/design-source';
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// =============================================================================
// 디자인 가드: 전문가 포털 색 대비(WCAG AA) - 두 테마 × 모든 표면
// =============================================================================
// 🔴 2026-08-26 신설. `lib/design/contrast.test.ts` 는 **`app/globals.css` 만** 읽는다.
//    전문가 포털은 자기 팔레트(`app/experts/expert-theme.css`)를 따로 갖고 있어서
//    **그 계약 밖에 있었다.** 실측했더니 두 종류의 미달이 나왔다:
//
//      ① `--whisper` #7a7468  : ink 4.33 · obsidian 4.15 · velvet 3.87 (전부 미달)
//         장식이 아니라 텍스트 색이고 9px 라벨에도 쓰인다.
//      ② 라이트 모드 `--risk-*` : critical 2.27 · high 1.76 · medium 2.06 · low 1.89
//         다크용 파스텔이 라이트에 그대로 남아 있었다. 같은 파일 주석이 「파스텔은
//         대비 미달」이라 적어 놓고 옆줄(`--status-*`)만 고쳐 둔 상태였다.
//
// 🔑 내부 앱이 2026-08-20 에 똑같은 실수(`--qa-muted`)를 했고 계약을 만들었다.
//    **계약이 있다 ≠ 전수를 본다.** 새 팔레트를 만들면 계약도 따라와야 한다.
// 🔑 기준 표면을 배경 하나로 잡으면 안 된다. 카드 표면이 더 밝아 대비가 «더 나쁘다».

const CSS = readDesignFile(join(process.cwd(), 'app', 'experts', 'expert-theme.css'), 'utf8');

/** 주석 안의 예시 값을 변수 정의로 오해하지 않도록 먼저 지운다. */
const BODY = CSS.replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * 선택자 블록에서 커스텀 속성을 캔다.
 *
 * ⚠️ 같은 선택자의 블록이 여러 개일 수 있다. 색이 없는 블록을 집으면 아래 루프가
 *    조용히 전부 건너뛰어 **거짓 통과**가 된다(내부 앱 계약이 실제로 그렇게 됐었다).
 *    그래서 기준 변수(`--ink`)를 가진 블록을 찾을 때까지 넘기고, 없으면 던진다.
 */
function vars(selector: string): Record<string, string> {
  // 🔑 정규식을 쓰지 않는다. 처음엔 셀렉터를 정규식으로 이스케이프했는데,
  //    파일을 heredoc 으로 쓰다가 백슬래시가 한 겹 먹혀 문법 오류가 났다
  //    (이 저장소가 이미 겪은 함정). 문자열 탐색이면 이스케이프가 아예 필요 없다.
  let from = 0;
  for (;;) {
    const hit = BODY.indexOf(selector, from);
    if (hit < 0) break;
    const open = BODY.indexOf('{', hit);
    from = hit + selector.length;
    if (open < 0) break;
    // 셀렉터와 여는 중괄호 사이에 다른 셀렉터가 끼면 이 블록이 아니다.
    if (/[{};]/.test(BODY.slice(hit + selector.length, open))) continue;
    const close = BODY.indexOf('}', open);
    const out: Record<string, string> = {};
    for (const d of BODY.slice(open + 1, close).matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
      out[d[1]] = d[2].trim();
    }
    if (out['--ink']) return out;
  }
  throw new Error(selector + ' 에서 --ink 를 가진 블록을 못 찾았다. 계약이 아무것도 안 보고 있다.');
}

const DARK = { ...rootPalette('dark'), ...vars('.expert-portal-root') };
const LIGHT = { ...vars('.expert-portal-root'), ...rootPalette('light'), ...vars("html[data-theme='light'] .expert-portal-root") };

/** `var(--x)` 사슬을 끝까지 따라간다. 라이트 값들이 서로를 가리키기 때문에 필요하다. */
function resolve(name: string, table: Record<string, string>, depth = 0): string {
  const raw = table[name];
  if (raw === undefined) throw new Error(`${name} 이 정의돼 있지 않다`);
  if (depth > 8) throw new Error(`${name} 의 var() 참조가 순환한다`);
  const ref = raw.match(/^var\(\s*(--[a-z0-9-]+)/i);
  if (ref) return resolve(ref[1], table, depth + 1);
  if (!/^#[0-9a-f]{6}$/i.test(raw)) throw new Error(`${name} 이 6자리 hex 가 아니다: ${raw}`);
  return raw.toLowerCase();
}

function luminance(hex: string): number {
  const ch = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = ch.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function ratio(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** 텍스트가 실제로 놓이는 표면. 카드가 더 밝아 «더 나쁜» 쪽이다. */
const SURFACES = ['--ink', '--obsidian', '--velvet'] as const;

/** 뜻을 나르는 텍스트 색. 여기 없는 색을 새로 만들면 이 목록에 추가할 것. */
const TEXT_TOKENS = [
  '--cream',
  '--cream-muted',
  '--mist',
  '--whisper',
  '--champagne',
  '--risk-critical',
  '--risk-high',
  '--risk-medium',
  '--risk-low',
  '--risk-unknown',
  '--status-verified',
  '--status-pending',
  '--status-progress',
  '--status-rejected',
] as const;

const AA = 4.5;

describe.each([
  ['다크', DARK],
  ['라이트', LIGHT],
])('전문가 포털 대비 (%s)', (label, table) => {
  it('기준 표면을 실제로 읽었다', () => {
    // 🔑 「0건을 대조하고 통과」를 막는다.
    for (const s of SURFACES) expect(resolve(s, table), `${label} ${s}`).toMatch(/^#[0-9a-f]{6}$/);
  });

  it(`텍스트 토큰 ${TEXT_TOKENS.length}종이 모든 표면 위에서 AA(${AA}:1)를 넘는다`, () => {
    const fails: string[] = [];
    for (const t of TEXT_TOKENS) {
      const fg = resolve(t, table);
      for (const s of SURFACES) {
        const r = ratio(fg, resolve(s, table));
        if (r < AA) fails.push(`${t} ${fg} on ${s} ${resolve(s, table)} = ${r.toFixed(2)}`);
      }
    }
    expect(fails, `${label}에서 AA 미달:\n  ${fails.join('\n  ')}`).toEqual([]);
  });

  it('내부 앱 공용 팔레트도 포털 값으로 갈아 끼워져 있다', () => {
    // 공용 부품(Btn·Bx·Toast)이 내부 앱 색으로 그려지면 한 화면에 팔레트가 둘이 된다.
    // 실제로 그랬다: 금색이 #c9a86a 와 #b8935a 두 개였고, 정보 토스트만 파랬다.
    const MAPPED = [
      '--qa-bg', '--qa-surface', '--qa-surface2', '--qa-text', '--qa-subtle', '--qa-muted',
      '--qa-border', '--qa-borderHi', '--qa-champagne', '--qa-green', '--qa-red',
      '--qa-warning', '--qa-blue',
    ];
    const missing = MAPPED.filter((n) => !DARK[n]);
    expect(missing, `포털이 갈아 끼우지 않은 내부 색: ${missing.join(', ')}`).toEqual([]);
    // 갈아 끼운 값은 반드시 «포털 토큰을 가리켜야» 한다. 값을 베껴 적으면 라이트에서 어긋난다.
    const copied = MAPPED.filter((n) => !/^var\(/.test(DARK[n]));
    expect(copied, `값을 베껴 적었다(포털 토큰을 가리킬 것): ${copied.join(', ')}`).toEqual([]);
  });
});

/**
 * 텍스트로 «쓰이지 않는» 색. 배경·외곽선 전용이라 AA 4.5 대상이 아니다.
 * ⚠️ 목록에서 빼는 것으로 끝내면, 나중에 누가 텍스트로 쓰는 순간 계약이 눈을 감는다.
 *    그래서 아래 테스트가 **정말 color 로 안 쓰이는지** 실제 CSS 를 뒤져 확인한다.
 */
const NON_TEXT_TOKENS = ['--champagne-soft', '--champagne-bright'] as const;

describe('텍스트 아님으로 면제한 색', () => {
  it('정말 color 로 쓰이지 않는다', () => {
    const used: string[] = [];
    // 속성 이름이 정확히 `color` 인 선언만 본다.
    // `background-color` / `border-color` 는 텍스트가 아니므로 앞 글자로 걸러낸다.
    for (const m of BODY.matchAll(/(^|[;{\s])color\s*:\s*([^;]+);/gi)) {
      for (const t of NON_TEXT_TOKENS) {
        if (m[2].includes('var(' + t + ')')) used.push(t + ' -> ' + m[2].trim().slice(0, 50));
      }
    }
    expect(used, '텍스트로 쓰이고 있다. TEXT_TOKENS 로 옮기고 AA 를 맞출 것: ' + used.join(' | ')).toEqual([]);
  });

  it('accent tint consumes the live color instead of duplicated RGB channels', () => {
    expect(BODY).not.toMatch(/--champagne-rgb\s*:|var\(--champagne-rgb\)/);
    expect(BODY).toContain('color-mix(in srgb, var(--champagne)');
    for (const file of ['app/experts/settings/danger-zone.tsx', 'app/experts/inbox/user-menu.tsx']) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      expect(source).not.toMatch(/rgba\(var\(--(?:champagne|ink|velvet|raise)-rgb\)/);
    }
  });
});

describe('전문가 포털 대비 (라이트 카드 종이)', () => {
  // 🔴 2026-09-27(A41 · 오너 결정 «A 종이»): 밝은 판의 카드가 비치는 유리에서 불투명 종이(--paper)로
  //    바뀌었다. 지금은 페이지보다 밝아 대비가 오히려 좋지만, 누가 종이 색을 어둡게 바꾸면
  //    위 SURFACES 목록은 이 표면을 모른다. 어두운 판에는 이 표면이 없다(카드는 반투명 그대로).
  it(`텍스트 토큰 ${TEXT_TOKENS.length}종이 --paper 위에서도 AA(${AA}:1)를 넘는다`, () => {
    const paper = resolve('--paper', LIGHT);
    const fails = TEXT_TOKENS.map((t) => [t, resolve(t, LIGHT)] as const)
      .filter(([, fg]) => ratio(fg, paper) < AA)
      .map(([t, fg]) => `${t} ${fg} on --paper ${paper} = ${ratio(fg, paper).toFixed(2)}`);
    expect(fails, `라이트 카드 종이 위 AA 미달:\n  ${fails.join('\n  ')}`).toEqual([]);
  });
});
