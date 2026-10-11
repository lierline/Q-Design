import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { resolveStyleValues } from '@/lib/test-utils/design-source';

// =============================================================================
// 강조 배경 위 글자색 계약: components/** 에 흰 글자 리터럴 금지 (2026-09-03 · M-13)
// =============================================================================
// 파랑·빨강·초록 «채운» 배경 위에 `color: '#fff'` 를 손으로 적은 곳이 5곳 있었습니다. 라이트에선
// 맞지만 다크 팔레트의 강조색은 밝아서 흰 글자가 배경에 묻혔습니다(대비 미달). 토큰 `T.onAccent`
// 가 이미 두 테마 값을 갖고 있었는데(다크 #0a0908 · 라이트 #ffffff) 아무도 쓰지 않았습니다.
//
// 이 계약은 «색 하나» 를 잠급니다: components/** 의 `color:` 값이 '#fff' · '#ffffff' · 'white' 이면
// 실패합니다. no-new-hex 의 baseline 동결과 달리 기준이 0 입니다. 흰 글자는 예외 없이 토큰으로 갑니다.
//
// 면제(ALLOW)는 이유를 함께 적습니다. 면제 파일에서 흰 글자가 사라지면 면제도 낡은 것이라 실패합니다
// (「가드가 있다 ≠ 전수를 본다」: 면제 목록이 조용히 늘거나 낡는 것을 막습니다).
//
// rgba( 는 여기서 막지 않습니다. 반투명 오버레이 등 정당한 사용이 많고 별도 감사 대상입니다.

const ROOT = process.cwd();
const SCAN_DIR = 'components';
const EXTS = ['.ts', '.tsx'];
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'worktrees']);

/** 면제: 파일 → 이유. 이유 없는 면제는 넣지 않습니다. */
const ALLOW: Record<string, string> = {
  'components/BarcodeScanButton.tsx':
    '카메라 오버레이: 검정 반투명 위 흰 글자라 테마와 무관하고 배경이 토큰이 아닙니다',
};

const WHITE_LITERAL = /(['"])(#fff|#ffffff|white)\1/i;

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

/** 줄 단위: `color:` 뒤(같은 줄)에 흰 글자 리터럴이 오면 위반입니다. 삼항(`? '#fff' :`)도 잡습니다. */
function whiteColorLines(text: string): { line: number; src: string }[] {
  const hits: { line: number; src: string }[] = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((src, i) => {
    const idx = src.search(/\bcolor:/);
    if (idx < 0) return;
    if (WHITE_LITERAL.test(src.slice(idx))) hits.push({ line: i + 1, src: src.trim() });
  });
  return hits;
}

function scan(): Record<string, { line: number; src: string }[]> {
  const byFile: Record<string, { line: number; src: string }[]> = {};
  for (const f of walk(join(ROOT, SCAN_DIR))) {
    const rel = f.slice(ROOT.length + 1).replace(/\\/g, '/');
    const hits = whiteColorLines(resolveStyleValues(readFileSync(f, 'utf8')));
    if (hits.length) byFile[rel] = hits;
  }
  return byFile;
}

describe('강조 배경 위 글자색: components/** 에 흰 글자 리터럴이 없습니다', () => {
  const byFile = scan();

  it("color: 값이 '#fff' · '#ffffff' · 'white' 인 곳이 0 입니다(면제 제외)", () => {
    const violations = Object.entries(byFile)
      .filter(([rel]) => !(rel in ALLOW))
      .flatMap(([rel, hits]) => hits.map((h) => `  ${rel}:${h.line}  ${h.src}`));
    expect(
      violations,
      `흰 글자 리터럴 ${violations.length}곳. 채운 배경 위 글자는 T.onAccent 를 쓰십시오` +
        `(다크에서 어두운 글자, 라이트에서 흰 글자). 정당한 예외면 ALLOW 에 이유와 함께 넣으십시오.\n` +
        violations.join('\n'),
    ).toHaveLength(0);
  });

  for (const [rel, why] of Object.entries(ALLOW)) {
    it(`면제가 낡지 않았습니다: ${rel} (${why})`, () => {
      expect(
        byFile[rel]?.length ?? 0,
        `${rel} 에 더는 흰 글자 리터럴이 없습니다. ALLOW 에서 지우십시오(낡은 면제는 다음 위반을 숨깁니다).`,
      ).toBeGreaterThan(0);
    });
  }
});
