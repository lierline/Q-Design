import { describe, it, expect } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { FIELD_HINT_MAX, FldRow, In, Sel, Txt } from './components';
import { readSource, REPO_ROOT } from '@/lib/test-utils/contract-source';

// =============================================================================
// 폼 배치: 칸 이름 옆 글귀 · 잠긴 칸 · 칸 묶음 사이 (2026-10-27)
// =============================================================================
// 오너가 «어제 공부한 폼 배치를 반영해 보라» 고 해서 영상 공부(2026-10-26)의 폼 대목과 화면을 대조했다.
// 칸 높이 44 · 글자 14 · 이름은 칸 위 · 이름은 약하게 값은 강하게는 이미 맞았고, 셋이 어긋났다.
//
//   ① 칸 이름 옆에 긴 문장(최대 165자)이 붙어 이름 줄을 여러 줄로 밀고 칸을 내려앉혔다.
//      «무엇을 적는지 · 예» 는 칸 안 회색 안내가 맡고, 설명은 ⓘ 안으로. 이름 옆에는 짧은 형식만.
//   ② 잠긴 칸이 적는 칸과 같은 흰 상자 · 진한 테두리라 «적어야 하나, 이미 적혔나» 가 갈리지 않았다.
//   ③ 칸 묶음(Fields)을 맨몸으로 잇달아 두면 묶음 사이가 놓인 상자의 간격을 따라 12 · 36 · 40 · 48 로 갈렸다.
//      묶음 모음(FieldGroups) 하나가 간격을 쥔다.
//
// (JSX 대신 createElement 를 쓴다. 까닭은 inline-strong.test.tsx 머리 주석과 같다.)

const h = createElement as unknown as (type: unknown, props: unknown, ...children: unknown[]) => ReactElement;
const noop = () => {};

describe('① 칸 이름 옆에는 짧은 형식 안내만', () => {
  it('짧은 도움말은 이름 옆에 보이고 칸에 연결된다', () => {
    const out = renderToStaticMarkup(h(FldRow, { label: '요약', htmlFor: 'x', hint: '최소 5자' }, h(In, { id: 'x', value: '', onChange: noop })));
    expect(out).toContain('class="qd-field-hint"');
    expect(out).toMatch(/<input[^>]*aria-describedby="x-hint"/);
    // 공용 .qd-field-hint 의 위 여백(칸 아래 도움말용)이 이름 줄을 4px 키워 이 칸만 입력 상자가 내려앉았다
    expect(out).toMatch(/class="qd-field-hint" style="[^"]*margin-top:0/);
  });

  it(`${FIELD_HINT_MAX}자를 넘는 도움말은 ⓘ 안으로 가고, 낭독기 연결은 남는다`, () => {
    const long = '설계검토에서 나온 부적합을 해당 개발 프로젝트에 연결하면 알림이 갑니다';
    expect(long.length).toBeGreaterThan(FIELD_HINT_MAX);
    const out = renderToStaticMarkup(h(FldRow, { label: '개발 프로젝트', htmlFor: 'p', hint: long }, h(In, { id: 'p', value: '', onChange: noop })));
    expect(out, '이름 옆에 긴 문장이 그대로 깔렸다').not.toContain('class="qd-field-hint"');
    expect(out, 'ⓘ 단추가 없다').toContain('aria-label="개발 프로젝트 설명 보기"');
    expect(out, '낭독기용 도움말이 사라졌다').toMatch(new RegExp(`<span id="p-hint"[^>]*>${long}</span>`));
    expect(out).toMatch(/<input[^>]*aria-describedby="p-hint"/);
  });

  it('이미 ⓘ 설명이 있으면 긴 도움말은 그 뒤에 붙고 ⓘ 는 하나다', () => {
    const out = renderToStaticMarkup(h(FldRow, { label: '사유', htmlFor: 'r', info: '감사 기록에 남습니다', hint: '이 사유는 조직 전체에 공개되며 바꿀 수 없습니다. 짧게 적으십시오' }, h(In, { id: 'r', value: '', onChange: noop })));
    expect(out.match(/설명 보기/g)?.length).toBe(1);
  });
});

describe('② 잠긴 칸은 적는 칸과 달라 보인다', () => {
  // 칸 상태의 모양은 정본 CSS 가 쥔다(q-design-adapter.test 참조). 부품은 잠금 표시(readonly · disabled)와 qd-input 만 단다
  const css = readSource('app/q-design.components.css', 'raw'); // 정본 CSS 를 그대로 대조한다
  it.each([
    ['input', 'readOnly=""', (ro: boolean) => h(In, { value: '값', onChange: noop, ro })],
    ['textarea', 'readOnly=""', (ro: boolean) => h(Txt, { value: '값', onChange: noop, ro })],
    ['select', 'disabled=""', (ro: boolean) => h(Sel, { value: 'a', onChange: noop, ro, opts: [{ v: 'a', l: '가' }] })],
  ])('%s: 잠그면 정본의 잠긴 칸 모양을 받는다', (tag, mark, el) => {
    expect(renderToStaticMarkup(el(false))).not.toContain(mark);
    const locked = renderToStaticMarkup(el(true));
    expect(locked).toContain(mark);
    expect(locked).toMatch(new RegExp(`<${tag}\\b[^>]*class="[^"]*\\bqd-input\\b`));
  });
  it('정본 CSS: 잠긴 칸 · 꺼진 칸은 화면 바탕 + 옅은 테두리', () => {
    for (const sel of ['\\.qd-input\\[readonly\\]', '\\.qd-input:disabled']) {
      const rule = css.match(new RegExp(`${sel}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
      expect(rule, `${sel} 규칙이 없다`).toMatch(/background:\s*var\(--qd-bg\)/);
      expect(rule).toMatch(/border-color:\s*var\(--qd-border\)/);
    }
  });
});

describe('③ 칸 묶음을 잇달아 놓을 때는 FieldGroups 로 감싼다', () => {
  const files = (dir: string): string[] => readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === 'node_modules' || n === '.next' ? [] : files(p);
    return n.endsWith('.tsx') ? [p] : [];
  });
  it('맨몸으로 이어 붙은 </Fields><Fields> 가 없다', () => {
    // 주석을 지운 원문이라 사이에 낀 JSX 주석은 빈 중괄호로 남는다
    const ADJ = /<\/Fields>(\s*(\{\s*\}\s*)*)<Fields>/g;
    const offenders: string[] = [];
    let seen = 0;
    for (const p of ['app', 'components'].flatMap((d) => files(join(REPO_ROOT, d)))) {
      const rel = relative(REPO_ROOT, p).split(sep).join('/');
      const s = readSource(rel, 'code');
      for (const m of s.matchAll(ADJ)) {
        seen++;
        const before = s.slice(0, m.index);
        const open = before.lastIndexOf('<FieldGroups>');
        const close = before.lastIndexOf('</FieldGroups>');
        if (open < 0 || close > open) offenders.push(`${rel}:${before.split('\n').length}`);
      }
    }
    expect(seen, '이어 놓은 묶음을 하나도 못 찾았다. 찾는 식이 낡았다').toBeGreaterThan(10);
    expect(offenders, '칸 묶음이 맨몸으로 이어졌다. <FieldGroups> 로 감쌀 것(묶음 사이가 놓인 상자 간격을 따라 갈린다)').toEqual([]);
  });
});
