import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

// =============================================================================
// 키보드 사용자는 «지금 어디에 있는지» 를 볼 수 있어야 한다 (2026-09-09 감사 · 주제 #2)
// =============================================================================
// 인라인 `style={{ outline: 'none' }}` 이 26곳 있었다. globals.css 의
// `:focus-visible { outline: 2px }` 은 **인라인 style 에 진다**(우선순위).
// 그래서 그 규칙 위에 「인라인 style 로 outline 을 무력화한 버튼들에 focus
// indicator 제공」이라고 적혀 있었지만, 실제로는 제공하지 못하고 있었다.
//
// 두 겹으로 막는다.
//   ① 인라인 outline:none 을 걷어낸다(24곳). 남은 2곳은 이유가 코드에 있다.
//   ② box-shadow 로도 알린다. 인라인들이 건드리지 않는 속성이라 같은 방식으로
//      지워지지 않는다. 그 규칙에 input·textarea·select 가 빠져 있어서 넓혔다.
//
// 실측(dev 3400, Tab 으로 훑음): 고치기 전 /audit 29칸 중 1칸이 «아무 변화 없음»,
// 고친 뒤 5개 화면 196칸 전부 고리가 생겼다.
//
// 🔑 ①만으로는 27번째가 생기면 도로 사라진다. ②만으로는 box-shadow 를 함께
//    인라인으로 쓰는 자리에서 사라진다. 그래서 둘 다 검사한다.

const ROOT = join(__dirname, '..', '..');
const SCAN = ['app', 'components', 'lib'];
const SKIP = new Set(['node_modules', '.next', '.git', 'dist', 'build', 'coverage']);

/**
 * 오늘 남은 수. **줄이는 커밋만 허용한다.**
 * 남은 2곳은 Modal·Drawer 의 `role="dialog" tabIndex={-1}` 껍데기다. Tab 순서에
 * 들어오지 않고 열릴 때 프로그램이 초점을 주는 자리라, 상자 «전체» 에 고리가
 * 그려지면 안쪽 버튼의 고리와 겹쳐 오히려 흐려진다. 이유는 그 자리 주석에도 있다.
 */
const 동결 = 2;

function* 파일들(dir: string): Generator<string> {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* 파일들(p);
    else if (e.name.endsWith('.tsx')) yield p;
  }
}

function 인라인끈곳(): { 셈: number; 목록: string[] } {
  let 셈 = 0;
  const 목록: string[] = [];
  for (const 곳 of SCAN) {
    for (const p of 파일들(join(ROOT, 곳))) {
      const 줄들 = readFileSync(p, 'utf8').split(/\r?\n/);
      줄들.forEach((줄, i) => {
        if (!/outline:\s*['"]none['"]/.test(줄)) return;
        셈++;
        목록.push(`${relative(ROOT, p).replace(/\\/g, '/')}:${i + 1}`);
      });
    }
  }
  return { 셈, 목록 };
}

describe('초점 표시', () => {
  it(`인라인 outline:none 이 ${동결}곳을 넘지 않는다`, () => {
    const { 셈, 목록 } = 인라인끈곳();
    expect(
      셈,
      `인라인 outline:none 이 ${동결}곳에서 ${셈}곳으로 늘었습니다.\n` +
        '키보드 사용자가 지금 어디에 있는지 볼 수 없게 됩니다(WCAG 2.4.7).\n' +
        'globals.css 의 :focus:not(:focus-visible) 가 이미 마우스 클릭에는 안 보이게 하므로,\n' +
        '인라인으로 한 번 더 끄면 얻는 것 없이 잃기만 합니다.\n' +
        목록.join('\n'),
    ).toBeLessThanOrEqual(동결);
  });

  it('남은 곳은 이유가 코드에 적혀 있다', () => {
    const { 목록 } = 인라인끈곳();
    const 파일 = new Set(목록.map((m) => m.split(':')[0]));
    for (const f of 파일) {
      const s = readFileSync(join(ROOT, f), 'utf8');
      expect(s, `${f} 에 outline:none 을 남긴 이유가 없습니다`).toContain('남겨 두는 outline:none');
    }
  });

  it('globals.css 의 초점 고리가 입력칸 세 종류를 덮는다', () => {
    /*
     * 🔴 주석을 «먼저» 걷어낸다. CSS 주석 안에 중괄호가 하나만 있어도
     *    아래 «여는 괄호 찾기» 가 그 자리로 빨려 들어가 규칙 경계가 어긋난다.
     *    실제로 그랬다: 이 검사를 처음 돌렸을 때 button 이 없다고 나왔는데,
     *    바로 위 주석에 적어 둔 중괄호 때문이었다.
     */
    const css = readFileSync(join(ROOT, 'app', 'globals.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ');
    /*
     * 정규식 하나로 CSS 를 파싱하려다 «앞 규칙까지 빨아들여» 엉뚱한 선택자를
     * 모은 적이 있다. 그래서 규칙을 하나씩 끊어 본다: `}` 다음부터 다음 `{` 까지가
     * 선택자 목록이고, 그 뒤 `{`…`}` 가 본문이다.
     */
    const 덮는것 = new Set<string>();
    let i = 0;
    while (i < css.length) {
      const 열림 = css.indexOf('{', i);
      if (열림 < 0) break;
      const 닫힘 = css.indexOf('}', 열림);
      if (닫힘 < 0) break;
      const 본문 = css.slice(열림 + 1, 닫힘);
      const 선택자 = css.slice(i, 열림);
      i = 닫힘 + 1;
      if (!본문.includes('box-shadow')) continue;
      for (const sel of 선택자.split(',')) {
        const t = sel.trim();
        if (!t.includes(':focus-visible')) continue;
        덮는것.add(t.replace(/:.*$/, '').split(/\s+/).pop()!);
      }
    }
    for (const 태그 of ['input', 'textarea', 'select', 'button', 'a']) {
      expect(덮는것, `${태그} 가 box-shadow 초점 고리에서 빠졌습니다`).toContain(태그);
    }
  });
});
