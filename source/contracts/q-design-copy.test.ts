import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

// =============================================================================
// Q-Design 사본 지문 대조
// =============================================================================
// 이 저장소에는 Q-Design 에서 «내려받은» 파일이 있습니다. 세 제품이 한 대장간에
// 있지 않아(각자 private repo · 패키지 매니저도 다름) npm 꾸러미로 나눌 수 없어서,
// 사본을 두되 **사본인 줄 알게** 합니다.
//
//   · 사본 머리에 본문의 sha256 이 찍혀 있습니다.
//   · 이 계약이 그 지문을 다시 계산해 대조합니다.
//   · 사본을 손으로 고치면 여기서 웁니다.
//
// 🔴 이 계약이 생긴 경위:
//    `lib/export/docx-builder/brand.ts` 가 웹 라이트 팔레트를 손으로 베낀 사본이었고,
//    머리말에 「색 수정 시 양쪽 모두 변경」이라 적혀 있었지만 **세 값이 어긋나** 있었습니다.
//    그중 둘(#7A7468)은 웹에서 이미 AA 미달로 고친 값이라, 심사원이 읽는 출력물에만
//    미달 색이 남아 있었습니다(음영 표 위 4.11).
//    🔑 「양쪽 모두 변경」이라고 적어 두는 것으로는 사본이 지켜지지 않습니다.
//
// 갱신하려면 Q-Design 에서:
//   node tools/extract-doc.mjs && node tools/sync.mjs --write

const ROOT = process.cwd();
const MARK = 'q-design-nav-sha256:';
const END_MARK = '// q-design-header-end';

/** 머리표를 뺀 본문. Q-Design 의 `tools/sync.mjs` 의 bodyOf 와 «같은 규칙» 이어야 합니다. */
function bodyOf(text: string, lang: 'css' | 'ts'): string {
  const mark = text.indexOf(MARK);
  if (mark < 0) return text;
  if (lang === 'ts') {
    // TS 머리표는 끝 표시로 닫습니다. 본문이 주석으로 시작해도 안전하게 자르기 위한 것입니다.
    const at = text.indexOf(END_MARK);
    if (at < 0) return text;
    const nl = text.indexOf('\n', at);
    if (nl < 0) return '';
    const rest = text.slice(nl + 1);
    return rest.startsWith('\n') ? rest.slice(1) : rest;
  }
  const at = text.indexOf('*' + '/', mark);
  if (at < 0) return text;
  const rest = text.slice(at + 2);
  return rest.startsWith('\r\n') ? rest.slice(2) : rest.startsWith('\n') ? rest.slice(1) : rest;
}

const COPIES: Array<{ name: string; path: string; lang: 'css' | 'ts' }> = [
  { name: '문서 토큰', path: 'lib/design/q-design.doc.ts', lang: 'ts' },
  { name: '인쇄 CSS', path: 'app/q-design.print.css', lang: 'css' },
];

describe('Q-Design 사본: 손으로 고치지 않았는가', () => {
  for (const copy of COPIES) {
    it(`${copy.name} 의 지문이 본문과 맞는다 (${copy.path})`, () => {
      const full = join(ROOT, copy.path);
      expect(existsSync(full), `${copy.path} 가 없습니다. Q-Design 에서 sync 를 돌리세요.`).toBe(true);

      const text = readFileSync(full, 'utf8');
      const at = text.indexOf(MARK);
      expect(at, `${copy.path} 에 지문 머리표가 없습니다. 손으로 만든 파일이 아닌지 보세요.`).toBeGreaterThan(-1);

      const declared = text.slice(at + MARK.length).trim().split(/\s/)[0];
      expect(declared, '지문이 64자 hex 가 아닙니다').toMatch(/^[0-9a-f]{64}$/);

      const body = bodyOf(text, copy.lang);
      // 자르기가 실패하면 본문에 머리표가 남습니다. 그러면 대조가 무의미해집니다.
      expect(body.includes(MARK), '머리표를 못 잘랐습니다. bodyOf 규칙이 sync.mjs 와 어긋났습니다.').toBe(false);
      expect(body.length, '본문이 비었습니다').toBeGreaterThan(100);

      const actual = createHash('sha256').update(body, 'utf8').digest('hex');
      expect(
        actual,
        `\n${copy.path} 가 원본과 다릅니다.\n` +
          '이 파일을 손으로 고쳤거나, Q-Design 이 앞서 나갔습니다.\n' +
          '고칠 일이 있으면 Q-Design 의 원본을 고치고 다음을 돌리세요:\n' +
          '  cd D:/Claude/Q-Design\n' +
          '  node tools/extract-doc.mjs && node tools/sync.mjs --write\n',
      ).toBe(declared);
    });
  }

  it('DOCX 빌더가 사본에서 색을 가져온다 (값을 손으로 적지 않는다)', () => {
    const src = readFileSync(join(ROOT, 'lib/export/docx-builder/brand.ts'), 'utf8');
    // 배선이 살아 있는가
    expect(src).toContain("from '@/lib/design/q-design.doc'");
    // 주석을 걷어낸 뒤 hex 리터럴이 남아 있으면 «손으로 적은 값» 이 다시 생긴 것입니다.
    const noComment = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    const hexes = noComment.match(/'[0-9A-F]{6}'/g) ?? [];
    expect(
      hexes,
      '\nbrand.ts 에 hex 리터럴이 다시 생겼습니다. 색은 q-design.doc.ts 에서 옵니다.\n' +
        '새 색이 필요하면 Q-Design 의 라이트 팔레트를 고치고 extract-doc 을 다시 돌리세요.\n',
    ).toEqual([]);
  });
});
