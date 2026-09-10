import { describe, it, expect } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Alert } from './components';

// =============================================================================
// Alert 은 종류를 «색 말고도» 알려 준다 (2026-09-09 감사 · 주제 #3)
// =============================================================================
// 감사 전의 Alert 은 role 도 aria-live 도 아이콘도 없는 순수 div 였고, 종류를
// 알려 주는 단서가 배경 8% · 테두리 30% · 왼쪽 3px 막대의 «색» 뿐이었다.
// 호출 107곳 중 title 을 함께 주는 곳은 41곳뿐이라, 나머지 66곳은 색약인
// 사람에게 「저장했습니다」와 「저장하지 못했습니다」가 같은 상자로 보였다.
// 낭독기에게는 넷 다 그냥 문단이라 «지금 뜬 것이 오류» 라는 사실 자체가 없었다.
//
// 🔑 이 검사의 핵심은 아래 두 개의 «색을 지운 뒤» it 이다. 색을 전부 지운 뒤에도
//    네 종류가 서로 달라야 한다. 아이콘을 지우거나 넷을 같은 모양으로 바꾸면 멈춘다.
//    (WCAG 1.4.1 색 사용 · 4.1.3 상태 메시지)
//
// (JSX 대신 createElement 를 쓴다. vitest 의 JSX 변환은 vitest.config.ts 의 oxc
//  설정에 기댄다 - inline-strong.test.tsx 와 같은 이유다.)

const 종류들 = ['error', 'warning', 'success', 'info'] as const;
const 그리기 = (kind: (typeof 종류들)[number], 글 = '무언가 일어났습니다.') =>
  renderToStaticMarkup(h(Alert, { kind, children: 글 }));

/**
 * 색을 지운다.
 *
 * 🔴 처음에는 rgb()·#hex 만 지웠다. 그러고서 네 아이콘을 일부러 같게 만들었는데도
 *    검사가 **통과했다.** 이 저장소의 색은 `var(--qa-red)` 라 하나도 안 지워졌고,
 *    검사는 색을 비교하면서 「색 말고도 다르다」고 말하고 있었다.
 *    (감사 메모 「도구가 먼저 거짓말을 했다」의 그 형태다)
 *
 *    그래서 `var(--…)` 를 먼저 지운다. 그러면 color-mix(…) 도 넷이 같아진다.
 *    글꼴 var 까지 함께 지워지지만 넷이 같은 값이라 판정에 영향이 없다.
 */
function 색없이(s: string): string {
  return s
    .replace(/var\(--[^)]*\)/g, '<색>')
    .replace(/rgba?\([^)]*\)/g, '<색>')
    .replace(/#[0-9a-fA-F]{3,8}\b/g, '<색>');
}

describe('Alert 은 색만으로 종류를 말하지 않는다', () => {
  it('네 종류 모두 role 이 있다', () => {
    for (const kind of 종류들) {
      expect(그리기(kind), kind).toMatch(/ role="(alert|status)"/);
    }
  });

  it('급한 것은 alert, 알림은 status 다 (Toast 와 같은 판단)', () => {
    expect(그리기('error')).toContain('role="alert"');
    expect(그리기('warning')).toContain('role="alert"');
    expect(그리기('success')).toContain('role="status"');
    expect(그리기('info')).toContain('role="status"');
  });

  it('아이콘에 이름이 있고, 네 이름이 서로 다르다', () => {
    const 이름들 = 종류들.map((kind) => {
      const m = /<svg[^>]*aria-label="([^"]+)"/.exec(그리기(kind));
      expect(m, `${kind} 의 아이콘에 aria-label 이 없습니다`).not.toBeNull();
      return m![1];
    });
    expect(new Set(이름들).size, `이름이 겹칩니다: ${이름들.join(' · ')}`).toBe(4);
  });

  it('아이콘은 aria-hidden 이 아니다 (제목 없는 66곳이 여기에 기댄다)', () => {
    for (const kind of 종류들) {
      const svg = /<svg[^>]*>/.exec(그리기(kind))![0];
      expect(svg, kind).not.toContain('aria-hidden');
    }
  });

  it('🔑 색을 전부 지워도 네 종류가 서로 다르다', () => {
    const 모양 = 종류들.map((kind) => 색없이(그리기(kind)));
    expect(new Set(모양).size, '색을 지우니 구별이 사라졌습니다 - 종류 단서가 색뿐입니다').toBe(4);
  });

  it('role 이 같은 둘도 서로 다르다 (error vs warning)', () => {
    /*
     * error 와 warning 은 role 이 둘 다 alert 이라, 이 둘을 가르는 것은 아이콘뿐이다.
     * 위의 «넷이 서로 다르다» 는 role 이 절반을 갈라 주므로 이보다 무르다.
     * 제목도 주지 않는다 - 제목을 주면 그 글자가 단서가 되어 조건이 쉬워진다.
     */
    const 오류 = 색없이(renderToStaticMarkup(h(Alert, { kind: 'error', children: '같은 글' })));
    const 주의 = 색없이(renderToStaticMarkup(h(Alert, { kind: 'warning', children: '같은 글' })));
    expect(오류, '색을 지우니 오류와 주의가 같아졌습니다').not.toBe(주의);
  });
});
