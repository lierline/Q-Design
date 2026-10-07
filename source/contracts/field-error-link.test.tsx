import { describe, it, expect } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Btn, Field, FldRow, In, Sel, Txt } from './components';

// =============================================================================
// 오류 글귀는 칸에 «연결» 되어야 한다 (WCAG 3.3.1 · 1.3.1) · 저장 단추는 «처리 중» 을 안다
// =============================================================================
// 2026-10-08 ui-ux-pro-max 지침 119개를 Q-Design 과 대조해 남은 빈칸 둘.
//
// ① 오류 글귀에 role="alert" 는 있었지만, 칸 쪽에는 aria-describedby 가 어디에도 없었다.
//    화면 낭독기로 칸에 초점을 주면 오류를 못 듣고, 칸을 떠나야 알게 된다.
//    Field(id) 는 칸의 id 를 이미 알고 있으니, 오류 글귀에 `${id}-error` 를 달고
//    id 가 같은 자식 칸에 aria-describedby 를 끼워 넣으면 호출부 556곳은 손댈 것이 없다.
//    도움말(hint)도 같은 길로 `${id}-hint` 를 단다.
//
// ② Btn 에 처리 중 상태가 없어 화면마다 손으로 disabled 를 걸었고(474곳 중 236곳),
//    나머지는 두 번 누르면 두 번 저장된다. pending 하나로 disabled + aria-busy + 회전 표시를
//    묶고, 글자는 자리만 남겨(visibility) 폭이 흔들리지 않게 한다.
//
// (JSX 대신 createElement 를 쓴다. 까닭은 inline-strong.test.tsx 머리 주석과 같다.)

// Field · FldRow · Btn 은 children 이 필수라 createElement 의 props 인자만으로는 타입이 맞지 않는다
// (세 번째 인자로 주는 자식은 타입 검사가 props 에 합치지 않는다). 시험에서는 느슨한 서명으로 부른다.
// 2026-10-08 푸시 훅의 typecheck 15건이 전부 이것이었다.
const h = createElement as unknown as (type: unknown, props: unknown, ...children: unknown[]) => ReactElement;

const noop = () => {};

function attr(markup: string, tag: string, name: string): string | null {
  const open = markup.match(new RegExp(`<${tag}\\b[^>]*>`));
  if (!open) return null;
  const m = open[0].match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : null;
}

describe('① 오류 · 도움말 글귀가 칸에 연결된다', () => {
  it('In: 오류가 있으면 aria-describedby 와 aria-invalid 가 칸에, id 가 오류 글귀에 붙는다', () => {
    const out = renderToStaticMarkup(
      h(Field, { id: 'f1', label: '제목', error: '비어 있습니다' }, h(In, { id: 'f1', value: '', onChange: noop })),
    );
    expect(attr(out, 'input', 'aria-describedby')).toBe('f1-error');
    expect(attr(out, 'input', 'aria-invalid')).toBe('true');
    expect(out).toMatch(/<div[^>]*\bid="f1-error"[^>]*>/);
    expect(out).toMatch(/<div[^>]*\brole="alert"[^>]*\bid="f1-error"|<div[^>]*\bid="f1-error"[^>]*\brole="alert"/);
  });

  it('도움말만 있으면 aria-describedby 는 도움말 id 하나, aria-invalid 는 없다', () => {
    const out = renderToStaticMarkup(
      h(Field, { id: 'f2', label: '제목', hint: '30자 안' }, h(In, { id: 'f2', value: '', onChange: noop })),
    );
    expect(attr(out, 'input', 'aria-describedby')).toBe('f2-hint');
    expect(attr(out, 'input', 'aria-invalid')).toBeNull();
    expect(out).toMatch(/\bid="f2-hint"/);
  });

  it('둘 다 있으면 도움말 → 오류 순서로 두 id 를 잇는다', () => {
    const out = renderToStaticMarkup(
      h(
        Field,
        { id: 'f3', label: '제목', hint: '30자 안', error: '너무 깁니다' },
        h(In, { id: 'f3', value: '', onChange: noop }),
      ),
    );
    expect(attr(out, 'input', 'aria-describedby')).toBe('f3-hint f3-error');
  });

  it('Sel 과 Txt 도 같은 길을 탄다', () => {
    const sel = renderToStaticMarkup(
      h(Field, { id: 's1', label: '부서', error: '고르세요' }, h(Sel, { id: 's1', value: '', onChange: noop, opts: ['a'] })),
    );
    expect(attr(sel, 'select', 'aria-describedby')).toBe('s1-error');
    expect(attr(sel, 'select', 'aria-invalid')).toBe('true');
    const txt = renderToStaticMarkup(
      h(Field, { id: 't1', label: '사유', error: '적으세요' }, h(Txt, { id: 't1', value: '', onChange: noop })),
    );
    expect(attr(txt, 'textarea', 'aria-describedby')).toBe('t1-error');
    expect(attr(txt, 'textarea', 'aria-invalid')).toBe('true');
  });

  it('날것 <input> 자식도 id 가 같으면 연결된다', () => {
    const out = renderToStaticMarkup(
      h(Field, { id: 'r1', label: '값', error: '틀림' }, h('input', { id: 'r1', defaultValue: '' })),
    );
    expect(attr(out, 'input', 'aria-describedby')).toBe('r1-error');
    expect(attr(out, 'input', 'aria-invalid')).toBe('true');
  });

  it('id 가 다른 자식(보조 단추 등)에는 끼워 넣지 않는다', () => {
    const out = renderToStaticMarkup(
      h(
        Field,
        { id: 'f4', label: '값', error: '틀림' },
        h('div', null, h(In, { id: 'f4', value: '', onChange: noop }), h(Btn, { onClick: noop }, '찾기')),
      ),
    );
    // 한 겹 아래라도 id 가 맞는 칸은 찾고, 단추에는 붙이지 않는다
    expect(attr(out, 'input', 'aria-describedby')).toBe('f4-error');
    expect(attr(out, 'button', 'aria-describedby')).toBeNull();
  });

  it('오류도 도움말도 없으면 아무것도 끼워 넣지 않는다(기존 호출부 556곳의 결과가 같다)', () => {
    const out = renderToStaticMarkup(
      h(Field, { id: 'f5', label: '값' }, h(In, { id: 'f5', value: '', onChange: noop })),
    );
    expect(attr(out, 'input', 'aria-describedby')).toBeNull();
    expect(attr(out, 'input', 'aria-invalid')).toBeNull();
  });

  it('FldRow 는 htmlFor 가 없으면(이름표를 못 잇는 옛 호출) 연결도 하지 않는다', () => {
    const out = renderToStaticMarkup(
      h(FldRow, { label: '값', error: '틀림' }, h(In, { id: 'f6', value: '', onChange: noop })),
    );
    expect(attr(out, 'input', 'aria-describedby')).toBeNull();
  });

  it('호출부가 이미 준 aria-describedby 는 앞에 그대로 두고 뒤에 잇는다', () => {
    const out = renderToStaticMarkup(
      h(
        Field,
        { id: 'f7', label: '값', error: '틀림' },
        h('input', { id: 'f7', 'aria-describedby': 'outer-note', defaultValue: '' }),
      ),
    );
    expect(attr(out, 'input', 'aria-describedby')).toBe('outer-note f7-error');
  });
});

describe('② Btn 의 처리 중(pending) 상태', () => {
  it('pending 이면 disabled + aria-busy, 글자는 자리만 남고 회전 표시가 생긴다', () => {
    const out = renderToStaticMarkup(h(Btn, { onClick: noop, pending: true }, '저장'));
    expect(attr(out, 'button', 'disabled')).not.toBeNull();
    expect(attr(out, 'button', 'aria-busy')).toBe('true');
    expect(out).toContain('저장');
    expect(out).toMatch(/visibility:\s*hidden/);
    expect(out).toMatch(/qa-spin/);
    expect(out).toMatch(/aria-hidden="true"/);
  });

  it('pending 이 아니면 종전과 같다(aria-busy · 회전 없음)', () => {
    const out = renderToStaticMarkup(h(Btn, { onClick: noop }, '저장'));
    expect(attr(out, 'button', 'aria-busy')).toBeNull();
    expect(out).not.toMatch(/qa-spin/);
    expect(out).not.toMatch(/visibility:\s*hidden/);
  });

  it('pending 중에는 폭을 지키려 글자가 사라지지 않고 숨겨진다(최소 폭 변동 0)', () => {
    const a = renderToStaticMarkup(h(Btn, { onClick: noop }, '변경 저장'));
    const b = renderToStaticMarkup(h(Btn, { onClick: noop, pending: true }, '변경 저장'));
    const text = (s: string) => s.replace(/<[^>]+>/g, '');
    expect(text(b)).toContain(text(a).trim());
  });
});
