import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// =============================================================================
// 디자인 가드: DARK/LIGHT 팔레트 동등성 (로드맵 5단계 마지막)
// =============================================================================
// 앱은 듀얼 테마(다크 기본 + 라이트). globals.css 의 `:root, html[data-theme='dark']`
// 와 `html[data-theme='light']` 가 **같은 --qa-* 변수 집합**을 정의해야 한 테마에서
// 색/그림자/상태색이 누락돼 렌더가 깨지는 일이 없다. 한쪽에만 추가하면 빨강.
//   · 새 --qa-* 는 반드시 양 테마에 함께 정의.
//   · 값(hex)은 테마별로 다른 게 정상(AA 튜닝): 이 가드는 '키 집합'만 검사.

const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');

// 셀렉터 다음 첫 '{' 부터 depth 매칭 '}' 까지 블록 본문 추출.
function block(selectorRe: RegExp): string {
  const m = selectorRe.exec(css);
  if (!m) throw new Error(`셀렉터 못 찾음: ${selectorRe}`);
  const open = css.indexOf('{', m.index);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') {
      depth--;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  throw new Error('블록 닫힘 못 찾음');
}

function qaVars(body: string): Set<string> {
  const out = new Set<string>();
  for (const m of body.matchAll(/(--qa-[\w-]+)\s*:/g)) out.add(m[1]);
  return out;
}

describe('디자인 가드: DARK/LIGHT 팔레트 동등성', () => {
  const dark = qaVars(block(/:root,\s*html\[data-theme='dark'\]\s*\{/));
  const light = qaVars(block(/html\[data-theme='light'\]\s*\{/));

  it('다크·라이트가 동일한 --qa-* 변수 집합을 정의', () => {
    const onlyDark = [...dark].filter((v) => !light.has(v));
    const onlyLight = [...light].filter((v) => !dark.has(v));
    if (onlyDark.length || onlyLight.length) {
      throw new Error(
        `테마 변수 불일치: 양 테마에 함께 정의하세요.\n` +
          `  다크에만: ${onlyDark.join(', ') || '(없음)'}\n` +
          `  라이트에만: ${onlyLight.join(', ') || '(없음)'}`,
      );
    }
    expect(dark.size).toBe(light.size);
    expect(dark.size).toBeGreaterThan(10); // 파싱 sanity
  });

  it('상태색 7종이 양 테마에 모두 존재', () => {
    for (const k of ['gray', 'cobalt', 'copper', 'gold', 'violet', 'green', 'red']) {
      expect(dark.has(`--qa-state-${k}`), `다크 --qa-state-${k}`).toBe(true);
      expect(light.has(`--qa-state-${k}`), `라이트 --qa-state-${k}`).toBe(true);
    }
  });
});
