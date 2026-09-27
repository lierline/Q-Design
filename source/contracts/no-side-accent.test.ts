import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// =============================================================================
// 디자인 가드: 굵은 옆 색 선(side-tab accent) 새로 쓰지 않기 (2026-09-27)
// =============================================================================
// 상자 한쪽에 굵은 색 선을 긋는 강조(`borderLeft: 3px solid …`)는 오너 금지 목록에 2026-09-01 부터 있었다
// («카드 한쪽의 굵은 컬러 보더»). 그런데 아무것도 세지 않아 188곳이 남았고, 결재함 카드도 4px 금색 선이었다.
// 오너 2026-09-27: 「모든 컴포넌트에 왼쪽 강조 라인이 붙어 있는데… 클로드 특유의 디자인 형태라서 다른 디자인 형태를」.
// 대체는 «문서 결»(괘선 목록 · 금색 라벨 강조문 · 요약표)과 결재 화면의 «가로 결재 길»이다.
//
// 기존 사용량은 넓어(점진 정리 대상) «0» 이 아니라 **기준 동결**: 늘어나는 것만 막는다(no-new-hex 와 같은 모양).
//   · 굵기 2px 이상만 센다. 1px 옆 선은 나무 줄 · 칸 구분 같은 구조선일 수 있다.
//   · 줄였으면 BASELINE 을 낮춰 다시 동결한다(환영).
//
// 기록
//   188 [2026-09-27] 첫 동결(결재함 카드의 4px 금색 선을 가로 결재 길로 바꾼 뒤의 실측).
//   180 [2026-09-27] 정본 부품 1차: Bx accent · InfoBox · Alert · KPI 풍선 · EntityRow · 사이드바 선택 표시(둘) · 부서 단추 −8.

const ROOT = process.cwd();
const SCAN_DIRS = ['app', 'components', 'lib'];
const EXTS = ['.ts', '.tsx', '.css'];
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'worktrees']);

/** 인라인 스타일(borderLeft · borderRight)과 CSS(border-left · border-right) 둘 다 */
const INLINE = /border(?:Left|Right)\s*:\s*[`'"]?\s*(\d+(?:\.\d+)?)px\s+(?:solid|dashed|double)/g;
const CSS = /border-(?:left|right)\s*:\s*(\d+(?:\.\d+)?)px\s+(?:solid|dashed|double)/g;

function walk(dir: string): string[] {
  const out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      out.push(...walk(full));
    } else if (EXTS.some((e) => full.endsWith(e))) {
      if (/\.test\.tsx?$/.test(full)) continue;
      out.push(full);
    }
  }
  return out;
}

function countSideAccents(): { total: number; byFile: Record<string, number> } {
  const byFile: Record<string, number> = {};
  let total = 0;
  for (const dir of SCAN_DIRS) {
    for (const f of walk(join(ROOT, dir))) {
      const rel = f.slice(ROOT.length + 1).replace(/\\/g, '/');
      const text = readFileSync(f, 'utf8');
      const re = f.endsWith('.css') ? CSS : INLINE;
      let n = 0;
      for (const m of text.matchAll(re)) if (Number(m[1]) >= 2) n++;
      if (n) {
        byFile[rel] = n;
        total += n;
      }
    }
  }
  return { total, byFile };
}

const BASELINE = 180;

describe('디자인 가드: 굵은 옆 색 선을 새로 쓰지 않는다', () => {
  it(`굵은 옆 색 선이 기준(${BASELINE}) 이하`, () => {
    const { total, byFile } = countSideAccents();
    const top = Object.entries(byFile)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([f, n]) => `${n} ${f}`)
      .join('\n');
    expect(
      total,
      `굵은 옆 색 선이 ${total}곳(기준 ${BASELINE}). 새로 쓰지 말고 «문서 결»(괘선 · 금색 라벨 강조문 · 요약표)이나 가로 결재 길로. 많은 파일:\n${top}`,
    ).toBeLessThanOrEqual(BASELINE);
  });

  it('세는 틀이 실제로 잡는다(일부러 깨뜨린 예)', () => {
    const inline = "style={{ borderLeft: `3px solid ${T.champagne}` }} borderRight: '2px dashed red' borderLeft: `1px solid ${T.border}`";
    const css = '.x { border-left: 4px solid var(--gold); } .y { border-right: 1px solid #333; }';
    const count = (s: string, re: RegExp) => [...s.matchAll(re)].filter((m) => Number(m[1]) >= 2).length;
    expect(count(inline, INLINE), '1px 구조선은 세지 않는다').toBe(2);
    expect(count(css, CSS)).toBe(1);
  });
});
