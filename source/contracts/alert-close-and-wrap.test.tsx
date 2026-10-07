import { describe, it, expect } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Alert } from './components';
import { readSource } from '@/lib/test-utils/contract-source';

// =============================================================================
// 오류가 떠도 로그인 화면이 무너지지 않게 (2026-09-28 오빠 지적)
// =============================================================================
// 오빠: 「지문 · 얼굴 확인을 취소했거나 시간이 지났습니다」 오류가 뜨면 화면 구조가 다 틀어진다.
// 재 보니 셋이었다.
//   ① 오른쪽 칸이 화면보다 길어지면 두 칸이 한 줄이라 왼쪽 판도 같이 늘어났다. 큰 제목이 가운데를 따라
//      내려가고(1440x900 · 지문 단추 있음 · 324 → 374px, 운영에서 잼) 아래 버전 표시가 화면 밖으로 나갔다.
//   ② 오류 글이 한글 음절마다 끊겨 «누르십시 / 오.» 가 됐다(wordBreak: break-word).
//   ③ 닫기 단추에 type 이 없어 <form> 안에서는 제출 단추였다. 누르면 알림이 먼저 지워져 실제 제출은
//      없었지만(운영 옛 판에서 잼: 제출 시도 0), 닫는 방식이 바뀌면 로그인을 다시 보낸다. 예방으로 못 박는다.
// 🔑 로그인 틀 검사는 «일부러 되돌린 원문» 으로도 한 번씩 돌려, 검사가 그 규칙을 실제로 본다는 것까지 지킨다
//    (통과만 보는 가드는 규칙이 사라져도 초록일 수 있다 · CLAUDE.md «가드는 본다로 확인한다»).
// (JSX 대신 createElement: alert-not-color-only.test.tsx 와 같은 이유)

describe('Alert: 닫기 단추와 줄바꿈', () => {
  const 그리기 = (onClose?: () => void) =>
    renderToStaticMarkup(
      h(Alert, { kind: 'error', onClose, children: '지문 · 얼굴 확인을 취소했거나 시간이 지났습니다. 다시 누르십시오.' }),
    );

  it('닫기 단추는 양식을 제출하지 않는다(type="button")', () => {
    const btn = /<button[^>]*aria-label="닫기"[^>]*>/.exec(그리기(() => {}));
    expect(btn, '닫기 단추가 그려지지 않았다').not.toBeNull();
    expect(btn![0], '<form> 안에서 type 없는 단추는 제출 단추다').toContain('type="button"');
  });

  it('본문은 한글을 낱말 단위로 바꾸고(keep-all), 띄어쓰기 없는 긴 글만 넘치지 않게 끊는다', () => {
    const html = 그리기();
    expect(html).toContain('word-break:keep-all');
    expect(html).toContain('overflow-wrap:anywhere');
    expect(html, 'break-word 는 한글을 음절마다 끊는다').not.toContain('word-break:break-word');
  });
});

/** `시작` 뒤 첫 `{` 부터 짝이 맞는 `}` 까지의 안쪽. 없으면 null */
function 덩어리(src: string, 시작: string): string | null {
  const i = src.indexOf(시작);
  if (i < 0) return null;
  const open = src.indexOf('{', i);
  let depth = 0;
  for (let k = open; k < src.length; k++) {
    if (src[k] === '{') depth++;
    else if (src[k] === '}') {
      depth--;
      if (depth === 0) return src.slice(open + 1, k);
    }
  }
  return null;
}

/** 로그인 틀이 «오른쪽이 길어져도 왼쪽은 제자리» 인지. 어긋난 것을 말로 돌려준다(없으면 빈 배열) */
function 로그인틀_어긋남(src: string): string[] {
  const 문제: string[] = [];
  const 넓은화면 = 덩어리(src, '@media (min-width: 1024px)');
  if (!넓은화면) return ['넓은 화면(1024 이상) 규칙 덩어리를 못 찾았다'];
  const 왼쪽 = 덩어리(넓은화면, '.qa-auth-brand {') ?? '';
  if (!/position:\s*sticky/.test(왼쪽) || !/top:\s*0/.test(왼쪽)) {
    문제.push('왼쪽 판(.qa-auth-brand)이 sticky · top 0 이 아니다: 오른쪽이 길어지면 같이 늘어난다');
  }
  if (!/min-height:\s*100d?vh/.test(왼쪽)) {
    문제.push('왼쪽 판의 높이가 화면 높이(min-height 100vh)가 아니다');
  }
  const 두칸 = 덩어리(넓은화면, '.qa-auth-split {') ?? '';
  if (!/align-items:\s*start/.test(두칸)) {
    문제.push('두 칸 격자(.qa-auth-split)가 align-items: start 가 아니다: 왼쪽 판이 줄 높이만큼 늘어난다');
  }
  if (!/html:has\(\.qa-auth-split\)\s*\{\s*scrollbar-gutter:\s*stable/.test(넓은화면)) {
    문제.push('스크롤 막대 자리를 비워 두지 않는다: 막대가 생길 때 두 판이 옆으로 흔들린다');
  }
  // sticky 는 가장 가까운 스크롤 상자에 붙는다. 바깥 상자가 overflow hidden 이면 스크롤하지 않는 그 상자에 붙어 먹지 않는다.
  if (!/overflow:\s*'clip'/.test(src) || /overflow:\s*'hidden'/.test(src)) {
    문제.push("바깥 상자가 overflow: 'clip' 이 아니다: hidden 이면 왼쪽 판의 sticky 가 먹지 않는다");
  }
  const 바탕 = 덩어리(src, '.qa-auth-split {') ?? '';
  if (!/word-break:\s*keep-all/.test(바탕)) {
    문제.push('로그인 화면이 한글을 낱말 단위로 줄바꿈하지 않는다(폰 바닥글이 «오픈소 / 스» 로 끊겼다)');
  }
  return 문제;
}

describe('로그인 화면: 오류 · 지문 단추 · 가입 탭으로 오른쪽이 길어져도 왼쪽 판은 제자리', () => {
  // 주석을 걷은 원문(CSS 주석도 걷힌다: 설명 글이 검사를 통과시키지 못하게)
  const 원문 = readSource('app/(auth)/login/page.tsx', 'code');

  it('지금 원문은 어긋남이 없다', () => {
    expect(로그인틀_어긋남(원문)).toEqual([]);
  });

  it.each([
    ['왼쪽 판 sticky 를 relative 로', (s: string) => s.replace('position: sticky', 'position: relative')],
    ['두 칸 격자의 align-items: start 를 지움', (s: string) => s.replace('align-items: start;', '')],
    ['스크롤 막대 자리를 안 비움', (s: string) => s.replace('scrollbar-gutter: stable', 'scrollbar-gutter: auto')],
    ["바깥 상자를 overflow: 'hidden' 으로", (s: string) => s.replace("overflow: 'clip'", "overflow: 'hidden'")],
    ['한글 낱말 줄바꿈을 지움', (s: string) => s.replace('word-break: keep-all;', '')],
  ])('검사가 실제로 본다: %s → 잡힌다', (_이름, 되돌리기) => {
    const 되돌린것 = 되돌리기(원문);
    expect(되돌린것, '되돌리기가 원문을 바꾸지 못했다(검사 문구와 원문이 갈렸다)').not.toBe(원문);
    expect(로그인틀_어긋남(되돌린것).length).toBeGreaterThan(0);
  });
});
