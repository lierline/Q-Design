import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// =============================================================================
// 화면의 «말투» 계약
// =============================================================================
// 2026-09-10 AI 티 스크리닝에서 고친 것들이 되돌아가지 않게 잠급니다.
// 색·크기 같은 «값» 이 아니라, 화면이 사람에게 말을 거는 «방식» 에 관한 규칙입니다.
//
// 고쳤지만 계약이 없으면 다음 사람이 같은 것을 다시 씁니다. 실제로 이 저장소에서
// 「양쪽 모두 변경」이라 적어 둔 사본이 어긋난 일이 여러 번 있었습니다.

const ROOT = process.cwd();
const SCAN = ['app', 'components'];
const SKIP = new Set(['node_modules', '.next', '.git', 'worktrees']);

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(name) && !/\.test\.tsx$/.test(name)) out.push(p);
  }
  return out;
}

const FILES = SCAN.flatMap((d) => walk(join(ROOT, d)));
const rel = (p: string) => relative(ROOT, p).split('\\').join('/');

/**
 * 주석은 «설명» 이지 «화면에 나가는 말» 이 아닙니다. 걷어내고 봅니다.
 *
 * ⚠️ **개행을 보존합니다.** 통째로 지우면 줄 수가 줄어 보고하는 줄 번호가
 *    엉뚱한 곳을 가리킵니다(처음에 그래서 세 건 다 잘못된 줄을 가리켰습니다).
 */
const stripComments = (s: string) =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/^([ \t]*)\/\/.*$/gm, (_m, indent) => indent);

describe('화면의 말투', () => {
  /*
   * ① 업무 도구는 값을 보여주고, 읽는 것은 사람이 합니다.
   *
   * 대시보드가 「우리 회사는 지금 N개 제품에 대해 총 M건의 변경이 진행되고 있고,
   * 모든 단계가 정상 흐름을 유지하고 있습니다」 라고 말하고 있었습니다.
   * 문장으로 요약해 주는 것은 챗봇의 어법이고, 0 을 문장에 넣으면 정보가 아니라
   * 빈칸을 메운 말이 됩니다(「총 0건의 변경이 진행되고 있고」).
   */
  it('화면이 1인칭으로 말하지 않는다', () => {
    /*
     * ⚠️ 한글은 부분 문자열이 잘 겹칩니다. 「제가」로만 찾으면 「**문**제가 발견되면」을
     *    잡습니다(처음에 세 건 전부 그 오탐이었습니다). 앞 글자가 한글이면 제외합니다.
     */
    const BAD = [/(?<![가-힣])우리\s*회사(는|가|의)/, /(?<![가-힣])저희\s*(는|가|의)/, /(?<![가-힣])제가\s/];
    const hits: string[] = [];
    for (const f of FILES) {
      const src = stripComments(readFileSync(f, 'utf-8'));
      for (const re of BAD) {
        const m = re.exec(src);
        if (m) {
          const line = src.slice(0, m.index).split('\n').length;
          hits.push(`${rel(f)}:${line}  ${m[0]}`);
        }
      }
    }
    expect(
      hits,
      '\n' + hits.join('\n') +
        '\n\n화면은 값을 보여주고 사람이 읽습니다. 「우리 회사는 …하고 있습니다」 대신\n' +
        '「제품 1 · 진행 중 변경 0」 처럼 값과 라벨로 적으십시오.\n' +
        '예외가 있다면(안내문·법적 고지 등) 그 이유를 주석으로 적고 이 목록을 고치십시오.\n',
    ).toEqual([]);
  });

  /*
   * ② 같은 사실을 화면마다 다른 형식으로 적지 않습니다.
   *
   * 제품 카드가 `device_class` raw 값을 그대로 찍어, 「2」로 저장된 제품은 제목 아래
   * 숫자 하나만 떴습니다(맥락 없는 고아 숫자). 다른 화면은 「2등급」입니다.
   * 표시 SSOT 인 formatDeviceClass() 가 이미 있었는데 아무도 안 쓰고 있었습니다.
   */
  it('의료기기 등급은 formatDeviceClass 를 거쳐 표시한다', () => {
    /*
     * «화면에 그대로 찍는» 자리만 봅니다: JSX children 위치, 즉 앞이 `>` 이고 뒤가 `<` 인
     * `{...device_class...}` 입니다.
     *
     * ⚠️ 이 좁힘이 필요한 이유: 넓게 잡으면 폼 value·상태 갱신 콜백·개수 세는 계산까지
     *    걸립니다(처음에 네 건이 전부 그런 오탐이었습니다). 그것들은 «표시» 가 아닙니다.
     *    좁은 그물이지만, 고아 숫자 「2」가 떴던 바로 그 형태는 잡습니다.
     */
    const RE = />\s*\{([^{}]*\bdevice_class\b[^{}]*)\}\s*</g;
    const hits: string[] = [];
    for (const f of FILES) {
      const src = stripComments(readFileSync(f, 'utf-8'));
      for (const m of src.matchAll(RE)) {
        const frag = m[1];
        if (frag.includes('formatDeviceClass')) continue;
        /*
         * 라벨 맵을 거친 것은 이미 «표시 형식» 을 갖췄습니다.
         * 예: NMPA_CLASS_LABEL[n.device_class] 는 중국 등급 체계라 한국 「N등급」과
         *     다른 축이고, 그 맵이 표시 SSOT 입니다.
         */
        if (/[A-Z_]+\s*\[/.test(frag)) continue;
        const line = src.slice(0, m.index).split('\n').length;
        hits.push(`${rel(f)}:${line}  {${frag.replace(/\s+/g, ' ').slice(0, 56)}}`);
      }
    }
    expect(
      hits,
      '\n' + hits.join('\n') +
        '\n\nraw 값을 그대로 찍으면 「2」처럼 맥락 없는 숫자가 됩니다.\n' +
        "lib/catalog.ts 의 formatDeviceClass() 를 쓰십시오 (「2」 → 「2등급」).\n",
    ).toEqual([]);
  });

  /*
   * ③ 세는 값과 나누는 값을 같은 변수로 쓰지 않습니다.
   *
   * `const total = a + b + c || 1` 이 있었습니다. 0 으로 나누는 것을 막으려는
   * 폴백인데 **표시에도 같은 값** 을 써서, 평가가 없을 때 화면이 「총 1건」이라고
   * 말했습니다. 게다가 `total === 0` 이 참이 되지 않아 「평가 없음」 처리가 한 번도
   * 동작하지 않았습니다.
   *
   * ⚠️ `|| 1` 자체는 정당한 쓰임이 많아 전면 금지할 수 없습니다. 그래서 «합계처럼
   *    보이는 이름» 에 붙은 것만 봅니다. 좁은 그물이지만 같은 사고를 막습니다.
   */
  it('합계 변수에 0 폴백을 붙이지 않는다', () => {
    const RE = /const\s+(total|count|sum|합계)[A-Za-z]*\s*=\s*[^;\n]*\|\|\s*1\s*[;\n]/g;
    const hits: string[] = [];
    for (const f of FILES) {
      const src = stripComments(readFileSync(f, 'utf-8'));
      for (const m of src.matchAll(RE)) {
        const line = src.slice(0, m.index).split('\n').length;
        hits.push(`${rel(f)}:${line}  ${m[0].trim().slice(0, 70)}`);
      }
    }
    expect(
      hits,
      '\n' + hits.join('\n') +
        '\n\n«세는 값» 과 «나누는 값» 은 다른 것입니다.\n' +
        '  const total = a + b + c;      // 표시에 쓰는 값\n' +
        '  const denom = total || 1;     // 나눗셈 전용\n' +
        '분모용 폴백을 표시에 쓰면 0 건일 때 화면이 「1건」이라고 말합니다.\n',
    ).toEqual([]);
  });

  /* 가드가 «빈 그물» 이 아닌지 확인합니다. 검사 대상을 못 찾으면 언제나 통과합니다. */
  it('검사 대상을 실제로 찾았다', () => {
    expect(FILES.length, 'tsx 파일을 하나도 못 찾았습니다').toBeGreaterThan(100);
    const anyDeviceClass = FILES.some((f) => readFileSync(f, 'utf-8').includes('device_class'));
    expect(anyDeviceClass, 'device_class 를 쓰는 화면이 하나도 없습니다. 검사가 헛돕니다').toBe(true);
  });
});
