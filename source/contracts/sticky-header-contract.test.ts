import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// =============================================================================
// 따라오는 머리글은 «붙을 자리» 가 있어야 붙는다 (2026-09-09 감사 · 주제 #11)
// =============================================================================
// 백 줄을 세로로 훑으면 머리글이 화면 밖으로 나가고, 그때부터 셋째 칸이 무엇인지
// 모르고 읽는다. 저장소 전체에서 이것을 한 곳(admin/permissions-matrix)이 손으로
// 적고 있었다 · 부품이 없어서다.
//
// 🔴 `position: sticky` 는 «세로 한계가 있는 조상» 이 있어야 붙는다. 같은 날
//    Q-Forge 에서 이 한계 없이 `thead .th { position: sticky }` 를 걸어 둔 것을
//    실측했다 · 감싸개가 294/294 라 **한 번도 안 붙었다**(그쪽 감사 #8).
//
//    이 저장소의 `.qa-scroll-table` 도 `overflow-x: auto` 라 `overflow-y` 가
//    auto 로 «계산»된다. 그래서 DataTable 의 stickyHeader 는 ScrollTable 에
//    `tall`(70vh)을 함께 걸어 붙을 자리를 만든다.
//
//    실측(/design-trace · 1440x900): 감싸개 746/630 · 머리글 sticky · top 0 ·
//    z 100 · 100px 내려도 머리글이 감싸개 위쪽(828px)에 그대로 남았다.
//
// 🔑 정규식을 쓰지 않는다. 낱말 포함으로만 본다.

const ROOT = process.cwd();
const 부품 = 'lib/design/components.tsx';
const 전역 = 'app/globals.css';

const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/** 주석을 걷어 낸 코드. 「이렇게 하면 안 된다」고 적은 주석이 걸리면 안 된다 */
function bare(rel: string): string {
  return read(rel)
    .split('/*')
    .map((seg, i) => (i === 0 ? seg : seg.slice(seg.indexOf('*/') + 2)))
    .join('')
    .split(String.fromCharCode(10))
    .filter((l) => !l.trim().startsWith('//'))
    .join(String.fromCharCode(10));
}

describe('따라오는 머리글', () => {
  const 코드 = bare(부품);

  it('DataTable 이 stickyHeader 를 받는다', () => {
    expect(코드).toContain('stickyHeader');
    expect(코드).toContain("position: 'sticky' as const");
  });

  /*
   * 이 한 줄이 빠지면 붙을 자리가 없어져 «선언만 되고 한 번도 안 붙는» 상태가
   * 된다. 화면은 멀쩡해 보인다 · 그래서 사람이 못 알아챈다.
   */
  it('stickyHeader 가 ScrollTable 에 세로 한계를 함께 준다', () => {
    expect(코드).toContain('tall={stickyHeader}');
    expect(코드).toContain("tall ? ' qa-scroll-table--tall' : ''");
  });

  it('그 한계가 CSS 에 실제로 있다', () => {
    const css = read(전역);
    const i = css.indexOf('.qa-scroll-table--tall');
    expect(i, '.qa-scroll-table--tall 규칙이 없습니다').toBeGreaterThan(-1);
    const 블록 = css.slice(i, css.indexOf('}', i));
    expect(블록).toContain('max-height');
    expect(블록).toContain('overflow-y: auto');
  });

  /* 겹침은 사다리에서 받는다. 숫자를 여기 적으면 사다리가 두 벌이 된다 */
  it('겹침 값을 손으로 적지 않는다', () => {
    expect(코드).toContain('zIndex: Z.sticky');
  });

  /*
   * 부품이 생겼으니 화면이 같은 것을 손으로 적으면 안 된다.
   * 지금 한 곳(permissions-matrix)이 자기 격자를 직접 그려 여기 남아 있다 ·
   * DataTable 로 옮길 때 이 면제를 지운다.
   */
  it('화면이 머리글 고정을 손으로 적지 않는다', () => {
    const 면제 = ['app/(app)/admin/permissions-matrix/page.tsx'];
    const 화면들: string[] = [];
    const walk = (dir: string) => {
      for (const e of readdirSync(dir)) {
        if (e === 'node_modules' || e === '.next') continue;
        const p = join(dir, e);
        if (statSync(p).isDirectory()) walk(p);
        else if (p.endsWith('.tsx')) 화면들.push(p);
      }
    };
    for (const d of ['app', 'components']) walk(join(ROOT, d));
    expect(화면들.length).toBeGreaterThan(100);

    const 나쁜곳: string[] = [];
    for (const f of 화면들) {
      const rel = relative(ROOT, f).split(sep).join('/');
      if (rel === 부품 || 면제.includes(rel)) continue;
      const src = readFileSync(f, 'utf8');
      /* 인라인 style 로 머리글을 고정한 자리 */
      if (src.includes("position: 'sticky'") && src.includes('columnheader')) 나쁜곳.push(rel);
    }
    expect(
      나쁜곳,
      ['머리글 고정을 손으로 적었습니다. DataTable 의 stickyHeader 를 쓰십시오.', 나쁜곳.join(String.fromCharCode(10))].join(
        String.fromCharCode(10),
      ),
    ).toEqual([]);

    /* 면제가 헐거워지지 않았는지 · 지우지 않으면 다시 늘어도 안 걸린다 */
    for (const f of 면제) {
      const src = readFileSync(join(ROOT, f), 'utf8');
      expect(src.includes("position: 'sticky'"), `면제 '${f}' 는 이제 걸리는 것이 없습니다. 면제를 지우십시오`).toBe(true);
    }
  });

  it('쓰는 곳이 있다 · 선언만 되고 아무도 안 쓰면 소용없다', () => {
    const 쓰는곳: string[] = [];
    const walk = (dir: string) => {
      for (const e of readdirSync(dir)) {
        if (e === 'node_modules' || e === '.next') continue;
        const p = join(dir, e);
        if (statSync(p).isDirectory()) walk(p);
        else if (p.endsWith('.tsx') && !p.includes('components.tsx')) {
          if (readFileSync(p, 'utf8').includes('stickyHeader')) {
            쓰는곳.push(relative(ROOT, p).split(sep).join('/'));
          }
        }
      }
    };
    for (const d of ['app', 'components']) walk(join(ROOT, d));
    expect(쓰는곳.length, 'stickyHeader 를 아무도 안 씁니다').toBeGreaterThan(0);
  });
});
