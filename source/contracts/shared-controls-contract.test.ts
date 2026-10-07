/**
 * 단추 · 칩 · 입력칸은 공용 부품으로 (2026-10-07 오너 지적 «단추들도 Q-Design 반영된 것 맞아?»)
 *
 * 결재선 편집 창의 담당자 칩 · 더할 단계 칩 · 이름 검색 칸이 손으로 짠 스타일이었다. 전수 점검(docs/audits/
 * RAW_BUTTONS_AUDIT_2026-10-07.md)에서 같은 모양이 상자 단추 125 · 입력칸 33 · 글귀 단추 24 곳 더 나왔다.
 * 공용 부품(Btn · ChoiceChip · FilterChip · In · TextAction)을 베낀 사본은 모양이 조금씩 갈리고, 공용 부품을
 * 고쳐도(터치 44 · 상아색 주 단추 · 모서리 10) 사본에는 닿지 않는다.
 *
 * 이 계약은 «날것 <button> · <input> 중 공용 부품 자리에 있는 것» 을 파일별로 세어 기준선과 같은지 본다.
 *   · 상자 단추(boxed): inline style 에 배경이나 테두리를 그린 <button>. 줄 · 타일(width 100% · textAlign left ·
 *     grid · column · 높이 60 이상 · absolute/fixed) · 아이콘 정사각(≤60)은 뺀다(단추가 아니거나 별도 규격 · 아이콘
 *     정사각은 IconBtn 자리지만 떠 있는 단추 · 점수 눈금 · 사진 위 지우기 표가 섞여 있어 손으로 걷는다). 현장 모드
 *     app/(app)/m · 전문가 포털 · 전역 오류 화면은 별도 테마라 뺀다.
 *   · 입력칸(input): type 이 글자인 <input> 에 border 를 직접 그린 것. In 자리.
 *   · 글귀 단추(text): 배경 · 테두리 없는 <button> 중 흐린 글자(T.subtle) · 금색 글자(T.champagne) · 밑줄. TextAction 자리.
 * 기준선은 «남아 있는 것» 의 목록이다. 줄어들면 기준선도 줄여야 하고(안 줄이면 «남은 게 있다» 는 거짓 안내가 남는다),
 * 늘면 빨강이다. 영영 남길 것은 이유를 적는다.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { codeOnly, REPO_ROOT } from '@/lib/test-utils/contract-source';

type Counts = { boxed: number; input: number; text: number; why?: string };

/** 남아 있는 날것 부품. 파일 → 개수. 0 이 되면 줄을 지운다. */
const REMAINING: ReadonlyArray<[string, Counts]> = [
  // 영영 남기는 것(이유 있음)
  ['components/Sidebar.tsx', { boxed: 1, input: 0, text: 1, why: '발치 상자 · 2026-09-14 오너 결정 · 정본(extract-nav)이 이 값을 읽는다 · 차림표 글귀 한 곳' }],
  ['components/SubscriptionIndicator.tsx', { boxed: 1, input: 0, text: 1, why: '신호등 칩(상단 바 규격 32) · 칩 안 글귀' }],
  ['components/Confirm.tsx', { boxed: 1, input: 0, text: 1, why: '확인 창의 주 단추 · 강조색 인자(accent)를 받는다 · qa-btn 클래스 · 취소 글귀는 ref(열릴 때 초점)' }],
  ['components/GlobalSearch.tsx', { boxed: 0, input: 1, text: 0, why: '콤보박스(ref · aria-activedescendant) · 테두리 없는 칸' }],
  ['components/ApprovalDocFile.tsx', { boxed: 0, input: 0, text: 1, why: '닫기 글귀가 ref(초점 복귀)를 든다' }],
  ['components/calendar/CalendarClient.tsx', { boxed: 0, input: 0, text: 1, why: '달 넘기기 단추가 onMouseEnter/Leave 로 색을 직접 바꾼다' }],
  // 2026-10-07 오너 결정 «2안»: 상자 117 · 입력칸 33 · 글귀 35 를 네 묶음으로 걷었다. 위 여섯 자리만 이유와 함께 남는다.
];

/** 공용 부품 정의 파일과 별도 테마 · 규격 화면은 보지 않는다 */
const SKIP_FILE = new Set(['lib/design/components.tsx', 'lib/design/segmented-choice.tsx', 'components/TextAction.tsx']);
const SKIP_DIR = (rel: string) => rel.startsWith('app/(app)/m/') || rel.startsWith('app/experts/') || rel.startsWith('app/global-error');

function walk(dir: string, out: string[]) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(name) && !/\.test\.tsx$/.test(name)) out.push(p);
  }
}

/** 태그 끝 `>`: 중괄호 깊이 0 · 문자열 밖에서만(onChange={(e) => …} 의 > 에 속지 않게) */
function tagEnd(src: string, i: number): number {
  let depth = 0;
  let q: string | null = null;
  for (let k = i; k < src.length; k++) {
    const c = src[k];
    if (q) {
      if (c === q && src[k - 1] !== '\\') q = null;
      continue;
    }
    if (depth === 0 && (c === '"' || c === "'")) { q = c; continue; }
    if (c === '`') { q = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '>' && depth === 0) return k;
  }
  return src.length - 1;
}

function styleOf(tag: string): string {
  const si = tag.indexOf('style={');
  if (si < 0) return '';
  let depth = 0;
  for (let k = si + 6; k < tag.length; k++) {
    if (tag[k] === '{') depth++;
    else if (tag[k] === '}' && --depth === 0) return tag.slice(si + 7, k).replace(/\s+/g, ' ');
  }
  return '';
}

export function classify(tag: string, kind: 'button' | 'input'): 'boxed' | 'input' | 'text' | null {
  const s = styleOf(tag);
  if (kind === 'input') {
    const type = (tag.match(/type=["']([a-z]+)/) || [])[1] || 'text';
    if (['checkbox', 'radio', 'file', 'hidden', 'range', 'color'].includes(type)) return null;
    if (/className=["'][^"']*qa-input/.test(tag)) return null;
    return /border/.test(s) ? 'input' : null;
  }
  if (/aria-pressed|aria-checked|role=["'](radio|tab)/.test(tag)) return null;
  const bgLit = /background(Color)?:\s*(['"`]?(none|transparent)|'none')/.test(s);
  const hasBg = /background/.test(s);
  const bdNone = /border:\s*['"`]?none/.test(s);
  const hasBd = /border(Color|Width)?:/.test(s) || /border:/.test(s);
  const boxed = (hasBg && !bgLit) || (hasBd && !bdNone);
  if (boxed) {
    const w = s.match(/width:\s*(\d+)/);
    const h = s.match(/height:\s*(\d+)/);
    if (w && h && w[1] === h[1] && Number(w[1]) <= 60) return null; // 아이콘 정사각
    if (/width: '100%'|textAlign: 'left'|display: 'grid'|flexDirection: 'column'|minHeight: (6|7|8|9)\d|position: '(absolute|fixed)'/.test(s)) return null; // 줄 · 타일
    // 2026-10-07 저녁: 파일 안 공용 스타일 객체(btnBase)를 펼친 단추도 사본이라 걷었다. 이제는 지나가지 않는다
    return 'boxed';
  }
  return /textDecoration|color: T\.champagne|color: T\.subtle/.test(s) ? 'text' : null;
}

export function scan(): Map<string, Counts> {
  const files: string[] = [];
  for (const d of ['components', 'app', 'lib']) walk(join(REPO_ROOT, d), files);
  const per = new Map<string, Counts>();
  for (const f of files) {
    const rel = relative(REPO_ROOT, f).replace(/\\/g, '/');
    if (SKIP_FILE.has(rel) || SKIP_DIR(rel)) continue;
    const src = codeOnly(readFileSync(f, 'utf8'));
    const re = /<(button|input)\b/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      const tag = src.slice(m.index, tagEnd(src, m.index) + 1);
      const c = classify(tag, m[1] as 'button' | 'input');
      if (!c) continue;
      const cur = per.get(rel) ?? { boxed: 0, input: 0, text: 0 };
      cur[c]++;
      per.set(rel, cur);
    }
  }
  return per;
}

/** 어긋났을 때 그대로 붙여 넣을 수 있는 기준선 리터럴(이유 있는 줄은 그대로 둔다) */
function literal(found: Map<string, Counts>, expected: Map<string, Counts>): string {
  const keep = [...expected.entries()].filter(([, c]) => c.why);
  const rest = [...found.entries()].filter(([f]) => !expected.get(f)?.why).sort(([a], [b]) => a.localeCompare(b));
  const row = ([f, c]: [string, Counts]) => `  ['${f}', { boxed: ${c.boxed}, input: ${c.input}, text: ${c.text}${c.why ? `, why: '${c.why}'` : ''} }],`;
  return ['  // 영영 남기는 것(이유 있음)', ...keep.map(row), '  // 아래는 걷는 중', ...rest.map(row)].join('\n');
}

describe('단추 · 칩 · 입력칸은 공용 부품으로(날것 사본은 기준선 이하)', () => {
  const found = scan();
  const expected = new Map(REMAINING);

  it('기준선에 없는 파일에 날것 사본이 생기지 않았다', () => {
    const extra = [...found.entries()].filter(([f]) => !expected.has(f)).map(([f, c]) => `${f} ${JSON.stringify(c)}`);
    if (extra.length) console.log('현재 상태의 기준선:\n' + literal(found, expected));
    expect(extra, '새 날것 단추 · 입력칸. Btn · ChoiceChip · FilterChip · In · TextAction 을 쓰거나 이유를 적고 기준선에 더할 것').toEqual([]);
  });

  it('기준선의 개수가 실제와 같다(줄었으면 기준선도 줄일 것 · 늘었으면 되돌릴 것)', () => {
    const diff: string[] = [];
    for (const [f, exp] of expected) {
      const got = found.get(f) ?? { boxed: 0, input: 0, text: 0 };
      if (got.boxed !== exp.boxed || got.input !== exp.input || got.text !== exp.text) {
        diff.push(`${f}: 기준선 ${exp.boxed}/${exp.input}/${exp.text} → 실제 ${got.boxed}/${got.input}/${got.text}`);
      }
    }
    if (diff.length) console.log('현재 상태의 기준선:\n' + literal(found, expected));
    expect(diff, '(상자/입력칸/글귀)').toEqual([]);
  });

  it('영영 남기는 것은 이유가 있고, 걷는 중인 것은 줄어들기만 한다(기록용 합계)', () => {
    let boxed = 0, input = 0, text = 0;
    for (const [, c] of expected) { boxed += c.boxed; input += c.input; text += c.text; }
    // 2026-10-07 시작 기준선은 상자 117 · 입력칸 33 · 글귀 35 였다. 같은 날 2안으로 걷어 상자 3 · 입력칸 1 · 글귀 5 가 남았다.
    // 이 숫자는 내려가기만 한다.
    expect(boxed).toBeLessThanOrEqual(3);
    expect(input).toBeLessThanOrEqual(1);
    expect(text).toBeLessThanOrEqual(5);
  });

  it('분류기는 베낀 단추를 잡고 공용 부품 · 줄 · 아이콘은 지나간다(일부러 깨뜨려 본 것)', () => {
    expect(classify(`<button type="button" style={{ padding: '9px 20px', background: T.red, color: T.onAccent, border: 'none' }}>`, 'button')).toBe('boxed');
    expect(classify(`<button type="button" style={{ background: 'transparent', border: \`1px solid \${T.border}\`, padding: '7px 14px' }}>`, 'button')).toBe('boxed');
    expect(classify(`<button type="button" style={{ background: 'transparent', border: 'none', color: T.subtle }}>`, 'button')).toBe('text');
    expect(classify(`<button type="button" aria-pressed={on} style={{ ...choiceLook(on), padding: '8px 14px' }}>`, 'button')).toBeNull();
    expect(classify(`<button type="button" style={{ width: 44, height: 44, border: \`1px solid \${T.border}\` }}>`, 'button')).toBeNull();
    expect(classify(`<button type="button" style={{ width: '100%', textAlign: 'left', border: \`1px solid \${T.border}\` }}>`, 'button')).toBeNull();
    expect(classify(`<button type="button" style={{ background: 'none', border: 'none', color: T.text }}>`, 'button')).toBeNull();
    expect(classify(`<input type="text" style={{ padding: '8px 12px', border: \`1px solid \${T.border}\` }} />`, 'input')).toBe('input');
    expect(classify(`<input type="text" className="qa-input" style={{ border: 'none' }} />`, 'input')).toBeNull();
    expect(classify(`<input type="checkbox" style={{ border: '1px solid red' }} />`, 'input')).toBeNull();
  });
});
