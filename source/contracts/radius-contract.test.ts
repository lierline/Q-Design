import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { readSource } from '@/lib/test-utils/contract-source';

/** 주석을 지우되 줄 수는 지킨다(실패 메시지의 줄 번호가 맞도록). 주석 속 `border:` 가 상자로 잡히지 않게. */
function stripCommentsKeepLines(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[ \t])\/\/[^\n]*/gm, '$1');
}

// =============================================================================
// 디자인 가드: 모서리 라운드 계약 (2026-09-14 전수 감사에서 신설)
// =============================================================================
// 오빠 지적: 「제품 카드는 모서리가 둥근데 일부 항목(R&D 파이프라인 카드 등)은 각져 있다」.
// 실측: 네 변 테두리(border: '1px solid …')를 그리면서 borderRadius 를 안 적은 인라인
// 스타일이 390곳(114파일)이었고, 공용 부품 Tag·FilterChip·Alert·툴팁도 각져 있었다.
// 정본(Q-Design docs/05): 카드·버튼·입력 = RADIUS.md(10) · 배지·아이콘 단추 = RADIUS.sm(6).
//
// 이 계약이 잠그는 것 세 가지:
//  ① style={{ }} 블록에 네 변 테두리가 있으면 borderRadius 를 «적어야» 한다.
//     각진 것이 의도라면 `borderRadius: 0` 을 적어 의도를 드러낸다(채팅 말풍선이 그렇다).
//  ② borderRadius 숫자 리터럴 금지 → RADIUS.* 토큰. (진행 막대 트랙 height ≤ 6 은 제외)
//  ③ 공용 부품 Tag 는 RADIUS.sm 을 가진다 (정본 CSS .qd-tag 6px 와 일치).
//
// 제외(이유가 있는 각진 것):
//  · app/experts/**  전문가 포털은 각진 모서리가 브랜드 (--qa-radius-card: 0)
//  · components/Sidebar.tsx  차림표 정본(docs/15)이 「모서리를 굴리지 않는다」
//  · 이어 붙은 칸(borderTop/Right/Bottom: 'none') 은 격자·조합 컨트롤이라 개별 판단
//
// 2026-06-09 에 「border 엔 radius 동반」 가드가 오탐(borderTop 등 방향 지정)으로 보류됐다.
// 이 계약은 **네 변 shorthand 만** 본다. 방향 지정은 대상이 아니다.

const ROOT = process.cwd();
const SCAN_DIRS = ['app', 'components', 'lib'];
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'worktrees']);
const SKIP_FILES = [/^app\/experts\//, /^components\/Sidebar\.tsx$/];

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
      if (!SKIP_DIRS.has(name)) out.push(...walk(full));
    } else if (/\.(tsx|ts)$/.test(name) && !/\.test\.tsx?$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

type Block = { file: string; line: number; block: string };

function styleBlocks(file: string): Block[] {
  const src = stripCommentsKeepLines(readFileSync(file, 'utf8'));
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  const out: Block[] = [];
  let idx = 0;
  while ((idx = src.indexOf('style={{', idx)) !== -1) {
    let depth = 0;
    let i = idx + 'style={'.length;
    const start = i;
    for (; i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') {
        depth--;
        if (depth === 0) break;
      }
    }
    out.push({ file: rel, line: src.slice(0, idx).split('\n').length, block: src.slice(start, i + 1) });
    idx = i;
  }
  return out;
}

const FOUR_SIDE_BORDER = /(^|[\s{,])border:\s*(?:[`'"]\s*1px\s+(?:solid|dashed)|`\$\{)/;
const JOINED_CELL = /border(Top|Right|Bottom):\s*'none'|border(Top|Right|Bottom):\s*0[,\s}]/;
const LITERAL_RADIUS = /borderRadius:\s*(\d+(?:\.\d+)?)\s*(?=[,}\n])/;

function heightOf(block: string): number | null {
  const m = block.match(/(^|[\s{,])height:\s*(\d+(?:\.\d+)?)\s*[,}]/);
  return m ? Number(m[2]) : null;
}

// style={{ }} 밖의 객체 리터럴(const inputStyle = {...} · return {...})도 본다.
// 2026-09-14 실측: 인라인 396곳을 고친 뒤에도 R&D 설정·신규 화면의 입력칸이 각져 있었다.
// 상수 객체로 스타일을 준 30곳이 첫 스캔에서 빠졌기 때문이다.
function constObjectBlocks(file: string): Block[] {
  const src = stripCommentsKeepLines(readFileSync(file, 'utf8'));
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  const out: Block[] = [];
  const re = /(=|:|\?|\(|,|return)\s*\{(?!\{)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (src.slice(Math.max(0, m.index - 6), m.index + 2).includes('style={')) continue;
    let depth = 0;
    let i = m.index + m[0].length - 1;
    const start = i;
    for (; i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') {
        depth--;
        if (depth === 0) break;
      }
    }
    const block = src.slice(start, i + 1);
    if (block.length > 2500) continue;
    // 최상위(depth 1)에 border: 가 있을 때만 스타일 객체로 본다
    let top = false;
    for (const x of block.matchAll(/(^|[\s{,])border:\s*(?:[`'"]\s*1px\s+(?:solid|dashed)|`\$\{)/g)) {
      let d2 = 0;
      for (let k = 0; k < (x.index ?? 0) + 1; k++) {
        if (block[k] === '{') d2++;
        else if (block[k] === '}') d2--;
      }
      if (d2 === 1) top = true;
    }
    if (!top) continue;
    out.push({ file: rel, line: src.slice(0, m.index).split('\n').length, block });
  }
  return out;
}

const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d))).filter(
  (f) => !SKIP_FILES.some((re) => re.test(relative(ROOT, f).replace(/\\/g, '/'))),
);
const blocks = [...files.flatMap(styleBlocks), ...files.flatMap(constObjectBlocks)];

describe('모서리 라운드 계약', () => {
  it('네 변 테두리를 그리는 인라인 스타일은 borderRadius 를 적는다', () => {
    const offenders = blocks
      .filter((b) => FOUR_SIDE_BORDER.test(b.block) && !/borderRadius/.test(b.block) && !JOINED_CELL.test(b.block))
      .map((b) => `${b.file}:${b.line}`);
    expect(offenders, `테두리만 있고 모서리 값이 없는 곳 (각진 것이 의도면 borderRadius: 0 을 적을 것)\n${offenders.join('\n')}`).toEqual([]);
  });

  it('borderRadius 숫자 리터럴 대신 RADIUS 토큰을 쓴다 (진행 막대 · 명시적 0 제외)', () => {
    const offenders = blocks
      .filter((b) => {
        const m = b.block.match(LITERAL_RADIUS);
        if (!m) return false;
        const v = Number(m[1]);
        if (v === 0) return false; // 의도된 각진 것
        const h = heightOf(b.block);
        if (h !== null && h <= 6) return false; // 진행 막대 트랙(radius = height/2)
        if (/height:\s*'100%'/.test(b.block)) return false; // 진행 막대 채움
        return true;
      })
      .map((b) => `${b.file}:${b.line} ${b.block.match(LITERAL_RADIUS)![0]}`);
    expect(offenders, `숫자 리터럴 모서리 (RADIUS.sm/md/lg/pill 로)\n${offenders.join('\n')}`).toEqual([]);
  });

  it('공용 Tag 배지는 RADIUS.sm (정본 .qd-tag 6px 와 같다)', () => {
    const src = readSource('lib/design/components.tsx', 'code'); // 주석은 지우고 본다 (이름이 주석에만 남아도 통과하지 않게)
    const at = src.indexOf('export function Tag(');
    expect(at).toBeGreaterThan(0);
    const fn = src.slice(at, src.indexOf('\n}\n', at));
    expect(fn).toMatch(/borderRadius:\s*RADIUS\.sm/);
  });
});
