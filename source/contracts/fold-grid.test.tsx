import { readDesignFile, resolveStyleValues } from '@/lib/test-utils/design-source';
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { foldGrid } from './components';
import { codeOnly, REPO_ROOT } from '@/lib/test-utils/contract-source';

// =============================================================================
// 고정 열 격자는 확대(폭 320)에서 열이 줄어야 한다 (2026-10-08 · WCAG 1.4.10 재배치)
// =============================================================================
// 손으로 `gridTemplateColumns: '1fr 1fr'` 를 쓰면 한 열이 날짜 · 글자 칸의 최소 폭보다 좁아져도 열이 안 줄어,
// 확대 400%(폭 320)에서 오른쪽이 잘렸다. scripts/screenshots/reflow.cjs 가 42화면 중 8화면에서 잡았고,
// 앱 전체 41파일 59곳이 같은 꼴이었다. 이제 «열은 n 개를 넘지 않고 칸이 min 보다 좁아지면 줄어드는»
// foldGrid(n, gap, { min, rowGap }) 로 쓴다. 열 수가 뜻인 곳(숫자판 · 등급 · 예/아니오 · 단계 표시)은
// `repeat(n, minmax(0, 1fr))` 로 둔다(1fr 만 쓰면 칸이 글자 최소 폭에 밀려 터진다).
// 열이 줄어드는 규칙 자체는 브라우저에서 폭 260~1024(소수점 포함)로 잼. 세션 로그 2026-10-08.

describe('foldGrid: 최대 n 열 · 칸이 좁으면 줄어드는 격자 style', () => {
  it('격자 + auto-fit + 한 열 최소 폭 = max(min, 균등 1/n 폭)', () => {
    const s = foldGrid(2, 12);
    expect(s.display).toBe('grid');
    expect(s.gap).toBe(12);
    expect(s.gridTemplateColumns).toBe('repeat(auto-fit, minmax(max(150px, calc((100% - 12px) / 2 - 1px)), 1fr))');
  });

  it('n 열이면 열 사이 간격 (n-1)개를 뺀다', () => {
    expect(foldGrid(3, 8).gridTemplateColumns).toContain('calc((100% - 16px) / 3 - 1px)');
    expect(foldGrid(4, 10).gridTemplateColumns).toContain('calc((100% - 30px) / 4 - 1px)');
  });

  it('min 을 바꾸면 그 값이 하한', () => {
    expect(foldGrid(2, 14, { min: 240 }).gridTemplateColumns).toContain('max(240px,');
    expect(foldGrid(3, 8, { min: 110 }).gridTemplateColumns).toContain('max(110px,');
  });

  it('행 간격이 열 간격과 다르면 «행 열» 순서의 두 값', () => {
    expect(foldGrid(2, 24, { rowGap: 16 }).gap).toBe('16px 24px');
  });

  it('중앙 CSS 간격은 열 너비 계산에도 같은 변수로 남는다', () => {
    const gap = 'var(--qd-space-3, 12px)';
    const s = foldGrid(3, gap);
    expect(s.gap).toBe(gap);
    expect(s.gridTemplateColumns).toBe('repeat(auto-fit, minmax(max(150px, calc((100% - (2 * var(--qd-space-3, 12px))) / 3 - 1px)), 1fr))');
    expect(foldGrid(1, gap).gridTemplateColumns).toContain('(0 * var(--qd-space-3, 12px))');
  });

  it('CSS 행 간격과 숫자 열 간격을 섞어도 단위를 중복하지 않는다', () => {
    expect(foldGrid(2, 24, { rowGap: 'var(--qd-space-4, 16px)' }).gap).toBe('var(--qd-space-4, 16px) 24px');
    expect(foldGrid(2, 'var(--qd-space-6, 24px)', { rowGap: 16 }).gap).toBe('16px var(--qd-space-6, 24px)');
  });
});

// 날것 고정 열 격자가 다시 생기지 않는지: 1fr 등분만 센다(px 열이 섞인 표 행은 DataTable · 스크롤 상자 몫).
const RAW = /gridTemplateColumns:\s*['"`](?:1fr(?: 1fr)+|repeat\(\d+,\s*1fr\))['"`]/g;

/** 남겨도 되는 곳. 스스로 접히는 경로가 있고, 그 경로가 실제로 있어야 한다. */
const ALLOWED: ReadonlyArray<{ file: string; count: number; why: string; proof: { file: string; text: string } }> = [
  {
    file: 'app/(app)/pmda/[id]/client.tsx',
    count: 2,
    why: '자체 @media (max-width: 640px) 로 1열 접힘',
    proof: { file: 'app/(app)/pmda/[id]/client.tsx', text: 'qa-pmda-grid-2' },
  },
  {
    file: 'components/AssessmentPreviewPanel.tsx',
    count: 1,
    why: '핵심 지표 4개는 globals.css 의 .qa-kpi-4 가 767 이하에서 2열로 접는다',
    proof: { file: 'app/globals.css', text: '.qa-kpi-4' },
  },
];

function walk(dir: string, out: string[]) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(name) && !/\.test\.tsx$/.test(name)) out.push(p);
  }
}

describe('날것 «등분 고정 열» 격자가 없다', () => {
  const found = new Map<string, number>();
  for (const root of ['app', 'components', 'lib']) {
    const files: string[] = [];
    walk(join(REPO_ROOT, root), files);
    for (const f of files) {
      const rel = relative(REPO_ROOT, f).split('\\').join('/');
      // Central grid parameters must satisfy the same reflow rules as former inline tracks.
      const n = (resolveStyleValues(codeOnly(readDesignFile(f, 'utf8'))).match(RAW) ?? []).length;
      if (n > 0) found.set(rel, n);
    }
  }

  it('허용 목록 밖에는 한 곳도 없다 (foldGrid 또는 repeat(n, minmax(0, 1fr)) 를 쓸 것)', () => {
    const allowed = new Map(ALLOWED.map((a) => [a.file, a.count]));
    const stray = [...found].filter(([f, n]) => allowed.get(f) !== n).map(([f, n]) => `${f} (${n}곳)`);
    expect(stray).toEqual([]);
  });

  for (const a of ALLOWED) {
    it(`허용 근거가 살아 있다: ${a.file} (${a.why})`, () => {
      expect(found.get(a.file)).toBe(a.count);
      expect(readDesignFile(join(REPO_ROOT, a.proof.file), 'utf8')).toContain(a.proof.text);
    });
  }
});
