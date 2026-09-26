import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { PAGE_MARGIN_MM, PRINT_CONTENT_W, PRINT_MAIN_PAD_X, printZoom } from './print';

// =============================================================================
// 표가 종이 밖으로 나가지 않는다 (2026-09-09 감사 · 주제 #10)
// =============================================================================
// 화면의 가로 스크롤 감싸개는 종이에서 «스크롤할 수 없는 상자» 가 된다. 담긴 것이
// 넓으면 오른쪽 끝이 **잘렸다는 표시도 없이** 사라지고, 받아 본 사람은 그 열이
// 원래 없다고 읽는다.
//
// 실측(A4 794px · @media print):
//   고치기 전  /assessments 448px · /audit 32px · /settings 32px 가 사라짐 (3/3 잘림)
//   고친 뒤    /audit 0 · /settings 0 · /assessments 280 (1/3 · 아래 ⬜ 참조)
//
// 🔑 이 검사가 지키는 것은 «치수가 두 곳에 적혀 갈리지 않는 것» 이다.
//    globals.css 의 @page 여백과 print.ts 의 숫자가 어긋나면, 표가 종이 밖으로
//    나가거나 여백이 낭비되는데 **아무도 울지 않는다.** 이 저장소가 반복해서
//    배운 것이다(CLAUDE.md 「사본이 어긋나면 계약이 조용히 무력해진다」).

const ROOT = join(__dirname, '..', '..');
const CSS = readFileSync(join(ROOT, 'app', 'globals.css'), 'utf8');
const COMPONENTS = readFileSync(join(ROOT, 'lib', 'design', 'components.tsx'), 'utf8');

/**
 * 손으로 적은 가로 스크롤 감싸개. ScrollTable 을 안 쓰므로 배율도 안 받는다.
 * 지금 있는 것만 허용하고 **늘지 않는 것** 만 지킨다. 옮길 때마다 낮춰 적을 것.
 *
 * 🔴 이 검사가 «직접 센» 값이어야 한다. 감사 보고서가 말한 수(12)도, 넉넉하게 잡은
 *    수도 아니다. 처음에 26 으로 적었는데 실제는 15 였다. 그러면 오늘 당장 열한 곳이
 *    공짜로 늘어난다.
 */
const 동결_손스크롤 = 15;

describe('종이 치수가 한 곳에서 나온다', () => {
  it('@page 좌우 여백이 print.ts 와 같다', () => {
    const m = /@page\s*\{[^}]*margin:\s*([0-9.]+)mm\s+([0-9.]+)mm\s+([0-9.]+)mm/.exec(CSS);
    expect(m, 'globals.css 에서 @page margin 을 못 찾았습니다').not.toBeNull();
    expect(Number(m![1]), '위 여백').toBe(PAGE_MARGIN_MM.top);
    expect(Number(m![2]), '좌우 여백').toBe(PAGE_MARGIN_MM.right);
    expect(Number(m![2]), '좌우 여백').toBe(PAGE_MARGIN_MM.left);
    expect(Number(m![3]), '아래 여백').toBe(PAGE_MARGIN_MM.bottom);
  });

  it('인쇄 때 main 의 좌우 안쪽 여백이 print.ts 와 같다', () => {
    /* 0 은 단위 없이 적는 것이 CSS 관행이라 `0px` 를 강요하지 않는다 */
    const m = /main\.qa-main-content\s*\{[^}]*padding:\s*(\d+)(?:px)?\s+(\d+)(?:px)?\s*!important/.exec(CSS);
    expect(m, 'print 블록의 main padding 을 못 찾았습니다').not.toBeNull();
    expect(Number(m![2]), '좌우 padding').toBe(PRINT_MAIN_PAD_X);
  });

  it('가용폭 계산이 A4 178mm 와 맞는다', () => {
    /* 210mm - 16 - 16 = 178mm · 96dpi 에서 672.75px */
    expect(PRINT_CONTENT_W).toBe(672);
  });
});

describe('배율 규칙이 제자리에 있다', () => {
  it('print 블록이 감싸개를 풀고 배율을 건다', () => {
    const at = CSS.indexOf('@media print');
    expect(at).toBeGreaterThan(-1);
    const 블록 = CSS.slice(at);
    expect(블록, '감싸개를 안 풀면 종이에서도 잘린다').toContain('overflow: visible !important');
    expect(블록, '배율을 안 걸면 넓은 표가 그대로 넘친다').toContain('zoom: var(--qa-print-zoom, 1)');
    /*
     * 모바일 fade 그라데이션 규칙에 media type 이 없어서, A4 인쇄 상자(794px)가
     * `max-width: 1023px` 에 걸린다. 안 지우면 표 좌우에 회색 띠가 찍힌다.
     */
    expect(블록, '인쇄에서 표 좌우에 회색 띠가 찍힌다').toContain('background: none !important');
    // 2026-09-25 실측: 어두운 테마에서 뽑으면 종이 여백(@page 여백)이 검게 찍혔다
    expect(블록, '어두운 테마에서 종이 여백이 검게 찍힌다').toContain('color-scheme: light !important');
  });

  it('ScrollTable 이 배율을 실어 보낸다', () => {
    expect(COMPONENTS).toContain('printZoom(minWidth)');
    expect(COMPONENTS).toContain("'--qa-print-zoom'");
  });
});

describe('printZoom 이 «내림» 한다', () => {
  it('종이에 들어가면 줄이지 않는다', () => {
    expect(printZoom(620)).toBe(1);
    expect(printZoom(PRINT_CONTENT_W)).toBe(1);
  });

  it('넘치면 딱 맞게 줄인다', () => {
    for (const w of [680, 720, 760, 780, 860, 900, 1004]) {
      const z = printZoom(w);
      expect(z, `${w}px 는 줄여야 한다`).toBeLessThan(1);
      /*
       * 🔑 반올림하면 0.5px 이 넘쳐 오른쪽 한 줄이 다시 잘린다. 조금 작게 그리는 것은
       *    아무도 못 알아보지만, 잘리는 것은 보인다. 그래서 «내림» 이어야 한다.
       */
      expect(w * z, `${w}px * ${z} 가 가용폭을 넘는다`).toBeLessThanOrEqual(PRINT_CONTENT_W);
    }
  });

  it('말이 안 되는 값에도 안 터진다', () => {
    expect(printZoom(0)).toBe(1);
    expect(printZoom(-5)).toBe(1);
    expect(printZoom(Number.NaN)).toBe(1);
  });
});

describe('손으로 적은 스크롤 감싸개', () => {
  it(`${동결_손스크롤}곳을 넘지 않는다`, () => {
    /*
     * ScrollTable 을 안 쓰고 overflowX 를 손으로 적으면 배율을 못 받는다.
     * 새로 생기는 것만 막는다. 옮길 때마다 위 숫자를 낮춰 적을 것.
     */
    const SKIP = new Set(['node_modules', '.next', '.git', 'dist', 'build', 'coverage']);
    function* 파일들(dir: string): Generator<string> {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (e.name.startsWith('.') || SKIP.has(e.name)) continue;
        const p = join(dir, e.name);
        if (e.isDirectory()) yield* 파일들(p);
        else if (e.name.endsWith('.tsx') && !e.name.includes('.test.')) yield p;
      }
    }
    let 셈 = 0;
    const 목록: string[] = [];
    for (const 곳 of ['app', 'components']) {
      for (const p of 파일들(join(ROOT, 곳))) {
        readFileSync(p, 'utf8')
          .split(/\r?\n/)
          .forEach((t, i) => {
            if (!/overflowX:\s*'auto'/.test(t)) return;
            셈++;
            if (목록.length < 10) 목록.push(`${relative(ROOT, p).replace(/\\/g, '/')}:${i + 1}`);
          });
      }
    }
    expect(
      셈,
      `손으로 적은 가로 스크롤이 ${동결_손스크롤}곳에서 ${셈}곳으로 늘었습니다.\n` +
        'ScrollTable 을 쓰면 인쇄 배율을 함께 받습니다.\n' +
        목록.join('\n'),
    ).toBeLessThanOrEqual(동결_손스크롤);
  });
});
