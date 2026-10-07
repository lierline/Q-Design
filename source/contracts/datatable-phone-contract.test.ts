// 표(DataTable)가 «폰에서 쓰이는가» 를 소스로 지킨다.
// 2026-10-03 오너 질문 「AI 총괄: 핸드폰에선 모델 변경이 안 되게 되어 있나?」 에서 나온 결함이다:
//   · 모델 탭의 역할 표는 phoneRow 도 minWidth 도 없었다. DataTable 은 둘 중 하나가 없으면 칸 폭 그대로 그려지고 가로로 밀 수도 없다.
//     최소 폭 합이 620px 라 폰(412 · 375)에서 「바꾸기」 가 화면 오른쪽 밖(597~641)에 있어 누를 수 없었다. 운영진 화면은 폰으로도
//     즉시 관리할 수 있어야 한다(2026-10-01 오너 규칙).
// 그래서 모든 DataTable 은 아래 중 하나를 가져야 한다:
//   · phoneRow         : 폰(599 이하)에서 표 대신 카드 줄(PhoneSwap). 동작 단추가 있는 표는 이것이다.
//   · minWidth         : 표가 가로 스크롤 칸(ScrollTable)에 들어간다. 행렬처럼 열을 서로 맞춰 봐야 하는 읽기용 표.
//   · stickyFirstCol   : 같은 스크롤 칸(첫 열 고정).
// 🔴 phoneRow 는 폭 599 이하에서만 카드로 바꾼다. 600 이상에서는 표가 다시 나오므로, 칸 최소 폭의 합이 (폭 - 66)보다 큰 표는
//    phoneRow 와 함께 minWidth 도 가져야 한다(600~685 폭 태블릿 세로 · 좁힌 창에서 잘림. 검토에서 모델 탭 · 기본 양식함이 걸렸다).
//    칸 폭의 합은 소스에서 믿을 만하게 읽을 수 없으므로(fr · minmax · 계산식), 알려진 넓은 표는 아래에 이름으로 못 박는다.
//    새 넓은 표는 만든 사람이 같은 곳에 적는다(실화면 폭 600 · 640 측정으로 확인: scratchpad 의 audit 스크립트 방식).
// 셋 다 없으면 폭이 모자랄 때 조용히 잘린다. 새 표를 추가하다 빠뜨리면 여기서 걸린다.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT, codeOnly, readSource } from '@/lib/test-utils/contract-source';

const DEFINITION = 'lib/design/components.tsx';

/** 폰에서 칸이 줄어드는 방식으로 이미 안전한 표(한 줄 말줄임 · 머리줄 없음 · 칸이 1fr 하나). 이유와 함께 적는다. */
const SHRINKS_BY_DESIGN: Record<string, { count: number; why: string }> = {
  'components/item-classification/MfdsRegisteredProducts.tsx': {
    count: 3,
    why: '머리줄 없는 조밀 목록이다. 첫 칸이 1fr 이고 글은 한 줄 말줄임(ellipsis)이라 폭에 맞춰 줄어든다. 동작 단추가 없다.',
  },
};

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name.startsWith('.')) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (name.endsWith('.tsx') && !name.endsWith('.test.tsx')) yield p;
  }
}

/**
 * 여는 태그에서 «바로 그 태그의 속성 이름» 만 남긴다: 중괄호 안(칸 정의 · 화살표 함수 · 스타일 객체)과 따옴표 안은 비운다.
 * 칸 정의 안의 `style={{ minWidth: 0 }}` 이 «이 표의 minWidth» 로 읽히지 않게 하려는 것이다(검토에서 나온 거짓 초록).
 */
function topLevelOf(tag: string): string {
  let out = '';
  let depth = 0;
  let quote: string | null = null;
  for (const c of tag) {
    if (quote) {
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      if (depth === 0) quote = c;
      continue;
    }
    if (c === '{') {
      depth++;
      if (depth === 1) out += '{';
      continue;
    }
    if (c === '}') {
      depth--;
      if (depth === 0) out += '}';
      continue;
    }
    if (depth === 0) out += c;
  }
  return out;
}

interface Usage {
  file: string;
  line: number;
  phoneRow: boolean;
  scrolls: boolean;
}

/** <DataTable ...> 여는 태그를 찾아 속성에 phoneRow · minWidth · stickyFirstCol 이 있는지 본다(제네릭 · 중괄호 안의 > 는 건너뛴다). */
function usagesIn(file: string, src: string): Usage[] {
  const out: Usage[] = [];
  const re = /<DataTable\b(?!Column)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length;
    if (src[i] === '<') {
      let d = 0;
      let k = i;
      for (; k < src.length; k++) {
        if (src[k] === '<') d++;
        else if (src[k] === '>' && --d === 0) break;
      }
      i = k + 1;
    }
    let depth = 0;
    let j = i;
    for (; j < src.length; j++) {
      const c = src[j];
      if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === '>' && depth === 0 && src[j - 1] !== '=') break;
    }
    const tag = topLevelOf(src.slice(i, j));
    out.push({
      file,
      line: src.slice(0, m.index).split('\n').length,
      phoneRow: /\bphoneRow\b/.test(tag),
      scrolls: /\bminWidth\b/.test(tag) || /\bstickyFirstCol\b/.test(tag),
    });
  }
  return out;
}

const all: Usage[] = [];
for (const top of ['app', 'components', 'lib']) {
  for (const p of walk(join(REPO_ROOT, top))) {
    const rel = relative(REPO_ROOT, p).replace(/\\/g, '/');
    if (rel === DEFINITION) continue;
    // 주석을 걷은 소스만 본다: 주석 처리한 `// phoneRow={...}` 가 통과시키지 않게(contract-source.ts 가 있는 이유)
    all.push(...usagesIn(rel, codeOnly(readFileSync(p, 'utf8'))));
  }
}

describe('표(DataTable)는 폰에서 쓰인다: phoneRow 이거나 가로 스크롤 칸이다', () => {
  it('표를 찾아낸다(검사가 아무것도 안 보고 통과하지 않게)', () => {
    expect(all.length).toBeGreaterThanOrEqual(28);
    // 읽는 방식이 맞는지: 이 시험이 고친 모델 탭 · 조건 규칙 표는 phoneRow 를 가진 것으로 읽혀야 한다
    for (const f of ['app/(app)/admin/ai-control/_tabs/Models.tsx', 'components/admin/ConditionRulesPanel.tsx']) {
      const u = all.filter((x) => x.file === f);
      expect(u.length, f).toBeGreaterThan(0);
      for (const x of u) expect(x.phoneRow, `${f}:${x.line}`).toBe(true);
    }
  });

  it('🔴 phoneRow 도 minWidth(stickyFirstCol)도 없는 표가 없다(폭이 모자라면 동작 단추가 화면 밖으로 밀려 누를 수 없다)', () => {
    const naked = all.filter((u) => !u.phoneRow && !u.scrolls && !SHRINKS_BY_DESIGN[u.file]);
    expect(naked.map((u) => `${u.file}:${u.line}`)).toEqual([]);
  });

  it('🔴 칸 폭이 넓다고 알려진 표는 phoneRow 만으로 두지 않는다: 600~685 폭에서 다시 표가 나오므로 minWidth 도 있어야 가로로 밀 수 있다', () => {
    // 모델 탭의 역할 표(칸 최소 폭 합 620)와 기본 양식함의 분류별 표(합 630): 둘 다 600 폭에서 「바꾸기」 · 「삭제」 가 잘렸다.
    const models = all.filter((x) => x.file === 'app/(app)/admin/ai-control/_tabs/Models.tsx');
    expect(models.length, '모델 탭의 표는 둘(역할 · 이력)').toBe(2);
    expect(models[0].phoneRow && models[0].scrolls, '역할 표: phoneRow + minWidth').toBe(true);
    const defaults = all.filter((x) => x.file === 'app/(app)/admin/default-templates/page.tsx');
    expect(defaults.length).toBeGreaterThan(0);
    for (const x of defaults) expect(x.phoneRow && x.scrolls, `기본 양식함 표(${x.line}행): phoneRow + minWidth`).toBe(true);
  });

  it('읽기 도구 시험: 칸 정의 안의 minWidth: 0 · 주석 처리한 phoneRow 는 이 표의 속성으로 읽지 않는다(거짓 초록 방지)', () => {
    const nested = `<DataTable<Row> columns={[{ key: 'a', render: (r) => <div style={{ minWidth: 0 }}>x</div> }]} rows={rows} getRowKey={(r) => r.id} />`;
    const [u1] = usagesIn('x.tsx', nested);
    expect(u1.scrolls, '칸 안의 minWidth: 0 은 표의 minWidth 가 아니다').toBe(false);
    expect(u1.phoneRow).toBe(false);
    const real = `<DataTable<Row> columns={cols} rows={rows} getRowKey={(r) => r.id} minWidth={620} phoneRow={(r) => <CardRow title="x" />} />`;
    const [u2] = usagesIn('x.tsx', real);
    expect(u2.scrolls).toBe(true);
    expect(u2.phoneRow).toBe(true);
    const commented = codeOnly(`<DataTable columns={cols} rows={rows} getRowKey={(r) => r.id}\n  // phoneRow={rolePhoneRow}\n/>`);
    const [u3] = usagesIn('x.tsx', commented);
    expect(u3.phoneRow, '주석 처리한 phoneRow 는 없는 것').toBe(false);
  });

  it('AI 총괄 모델 탭: 폰 카드 줄의 「바꾸기」 는 표의 것과 같은 startEdit 를 부르고, 누를 때마다 편집 칸이 보이는 자리로 올라온다', () => {
    const s = readSource('app/(app)/admin/ai-control/_tabs/Models.tsx', 'code');
    const from = s.indexOf('const rolePhoneRow');
    const to = s.indexOf('const historyPhoneRow');
    expect(from).toBeGreaterThan(-1);
    expect(to).toBeGreaterThan(from);
    // 카드 줄 단추와 표 단추가 같은 동작(갈라지지 않게 한 함수)
    expect(s.slice(from, to)).toContain('<TextAction onClick={() => startEdit(r)}>바꾸기</TextAction>');
    expect(s).toContain('render: (r) => <TextAction onClick={() => startEdit(r)}>바꾸기</TextAction>');
    // 폰에서는 줄이 카드로 길게 쌓여 «바꾸기» 를 누른 줄과 편집 칸이 한 화면에 안 들어온다: 누르면 편집 칸으로 올려 준다(고정 머리줄에 가리지 않게 여백)
    expect(s).toContain('editorRef.current?.scrollIntoView(');
    expect(s).toMatch(/ref=\{editorRef\}[^>]*scrollMarginTop/);
    // 🔴 이미 열린 같은 역할의 「바꾸기」 를 다시 눌러도 반응이 있어야 한다: 올리는 시점은 역할 이름이 아니라 누를 때마다 오르는 신호(scrollTick)에 건다
    const start = s.slice(s.indexOf('function startEdit'), s.indexOf('async function save'));
    expect(start).toContain('setScrollTick((n) => n + 1)');
    expect(s).toMatch(/useEffect\(\(\) => \{[\s\S]*?scrollIntoView[\s\S]*?\}, \[scrollTick\]\)/);
    expect(s).not.toContain('editing?.role');
    expect(s).toContain('phoneRow={historyPhoneRow}');
  });

  it('줄어들게 설계된 표의 예외 목록은 실제와 맞는다(예외가 늘거나 낡아도 걸린다)', () => {
    for (const [file, { count, why }] of Object.entries(SHRINKS_BY_DESIGN)) {
      const u = all.filter((x) => x.file === file);
      expect(u.length, `${file} 의 표 개수`).toBe(count);
      for (const x of u) expect(x.phoneRow || x.scrolls, `${file}:${x.line} 은 이제 스스로 폰 대응을 하니 예외에서 뺄 것`).toBe(false);
      expect(why.length).toBeGreaterThan(10);
    }
  });
});
