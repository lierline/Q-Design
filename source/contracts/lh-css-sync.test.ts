import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LH } from './tokens';

// =============================================================================
// LH ↔ CSS 변수 동기화 가드 (2026-08-06)
// =============================================================================
// 배경: LH(lib/design/tokens.ts)는 TS 상수라 **CSS 파일에 닿지 못한다.**
// app/globals.css 의 body line-height 는 「lineHeight 를 안 적은 모든 텍스트」의
// 상속 기준선인데, 전에는 사다리 최빈값(relaxed 1.6)과 «값만 같고 연결이 없었다».
// 그 상태로 LH.relaxed 를 한 번이라도 조정하면 인라인 232곳만 움직이고 상속
// 기준선은 1.6 에 남아, 같은 화면에서 두 갈래로 갈라진다.
//
// 해법: globals.css 가 --qa-lh-* 를 발행하고 CSS 쪽은 그것을 참조한다.
// 값이 두 곳(TS·CSS)에 적히는 것은 피할 수 없으므로: CSS 는 TS 를 import 할 수
// 없다. **테스트로 두 곳을 묶는다.** 한쪽만 고치면 여기서 실패한다.
//
// 왜 LH 를 var(--qa-lh-*) 문자열로 만들지 않았나:
//  · 색(T.*)은 var() 참조가 맞다. 테마 전환 때 런타임에 값이 바뀌어야 하니까.
//  · 줄간격은 테마 축이 아니다. 문자열로 바꾸면 585곳의 타입이 number→string 이 되고
//    산술(FS[12] * LH.relaxed)이 불가능해진다. number 를 유지하는 편이 낫다.

const ROOT = process.cwd();
const CSS = readFileSync(join(ROOT, 'app', 'globals.css'), 'utf8');

/** globals.css 에서 --qa-lh-* 정의를 파싱 */
function cssLadder(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const m of CSS.matchAll(/--qa-lh-([a-zA-Z]+):\s*([0-9]*\.?[0-9]+)\s*;/g)) {
    out[m[1]] = Number(m[2]);
  }
  return out;
}

describe('LH ↔ --qa-lh-* 동기화', () => {
  it('TS 사다리와 CSS 사다리의 키 집합이 같다', () => {
    const css = Object.keys(cssLadder()).sort();
    const ts = Object.keys(LH).sort();
    expect(
      css,
      `LH(tokens.ts)와 --qa-lh-*(globals.css)의 키가 어긋났습니다.\n` +
        `한쪽에만 키를 추가하면 CSS 파일이 그 칸을 못 쓰거나(TS 만 추가),\n` +
        `죽은 변수가 남습니다(CSS 만 추가). 양쪽 다 고치세요.\n` +
        `  TS : ${ts.join(', ')}\n  CSS: ${css.join(', ')}`,
    ).toEqual(ts);
  });

  it('같은 키의 값이 정확히 같다', () => {
    const css = cssLadder();
    const drift = Object.entries(LH)
      .filter(([k, v]) => css[k] !== undefined && css[k] !== v)
      .map(([k, v]) => `  ${k}: TS ${v} ≠ CSS ${css[k]}`);
    expect(
      drift,
      `LH 값이 TS 와 CSS 에서 갈라졌습니다. 인라인 style 과 CSS 파일이 서로 다른\n` +
        `줄간격으로 렌더됩니다. 같은 화면 안에서 갈라지므로 눈에 잘 안 띕니다.\n` +
        drift.join('\n'),
    ).toEqual([]);
  });

  it('globals.css 에 raw line-height 가 없다 (전부 var(--qa-lh-*))', () => {
    // 사다리 밖 값이 정말 필요하면 --qa-lh-* 에 칸을 만들고 LH 에도 추가할 것.
    // app/experts/expert-theme.css(독립 브랜딩)와 offline.html(globals.css 를 로드조차
    // 하지 않는 독립 폴백 문서)은 변수가 닿지 않으므로 이 가드 대상이 아니다.
    const raw = [...CSS.matchAll(/line-height:\s*([0-9][^;]*);/g)].map((m) => m[1].trim());
    expect(
      raw,
      `globals.css 는 line-height 를 var(--qa-lh-*) 로 쓰세요.\n` +
        `raw 로 적으면 LH 를 조정해도 이 줄만 옛 값에 남습니다.\n` +
        `  발견: ${raw.join(' · ')}`,
    ).toEqual([]);
  });
});
