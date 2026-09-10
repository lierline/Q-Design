import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

// =============================================================================
// 진행선은 «기다리는 동안» 움직여야 한다 (2026-09-09 감사 · 주제 #8)
// =============================================================================
// 종전 부품은 `usePathname` 이 바뀔 때 시작했다. 그런데 App Router 에서
// **pathname 은 새 트리가 커밋된 «뒤» 에 바뀐다.** 위쪽에 loading.tsx 경계가 없는
// 화면에서는 막대가 «도착한 다음에» 처음 움직였다. 실측: app/(app) 의 page.tsx
// 158개 중 139개가 맨몸이었다.
//
// 기다림이 끝난 뒤에 움직이는 진행 표시는 아무것도 알려 주지 않는다.
//
// 이 파일은 Q-Design 에서 온 사본이다. 그래서 두 가지를 함께 본다:
//   ① 사본이 정본과 같은가(머리표의 sha256)
//   ② 그 안에 «있어야 할 성질» 이 있는가
//
// ②가 없으면 ①은 「같다」고만 말한다. 정본에서 성질이 빠져도 둘이 나란히 빠진다.
//
// 🔑 정규식을 쓰지 않는다. 히어독이 백슬래시를 먹어 «아무것도 안 잡는 초록 가드» 가
//    된 사고가 이 집안에 여러 번 있었다. 글자를 그대로 찾는다.

const ROOT = join(__dirname, '..', '..');
const 부품 = join(ROOT, 'components', 'TopProgressBar.tsx');
const MARK = 'q-design-nav-sha256:';
const END_MARK = '// q-design-header-end';

function 본문(s: string): string {
  const at = s.indexOf(END_MARK);
  if (at < 0) return s;
  const nl = s.indexOf('\n', at);
  const rest = s.slice(nl + 1);
  return rest.startsWith('\n') ? rest.slice(1) : rest;
}

describe('상단 진행선', () => {
  const s = readFileSync(부품, 'utf8');

  it('사본이 정본과 같다 (머리표의 지문)', () => {
    const at = s.indexOf(MARK);
    expect(at, '머리에 지문이 없습니다. Q-Design 에서 sync.mjs --write 로 다시 받으십시오').toBeGreaterThan(-1);
    const 찍힌값 = s.slice(at + MARK.length, s.indexOf('\n', at)).trim();
    const 실제 = createHash('sha256').update(본문(s), 'utf8').digest('hex');
    expect(실제, `이 파일을 손으로 고쳤거나 사본이 낡았습니다.\n  찍힌 값 ${찍힌값}\n  실제   ${실제}`).toBe(찍힌값);
  });

  it('누르는 «순간» 시작한다 (pathname 을 기다리지 않는다)', () => {
    expect(s).toContain("document.addEventListener('click'");
  });

  it('링크가 아닌 이동도 시작시킬 수 있다', () => {
    /* click 감시는 a 태그만 본다. router.push 는 이 이름으로 알린다 */
    expect(s).toContain("'qd:route-start'");
    expect(s).toContain('export function startRouteProgress');
  });

  it('움직임을 줄여 달라는 사람에게는 그리지 않는다', () => {
    /*
     * 🔴 종전 파일은 머리 주석에 그렇게 «적어 두고» 코드에는 검사가 없었다.
     *    그래서 주석이 아니라 코드에서 찾는다.
     */
    expect(s).toContain("window.matchMedia?.('(prefers-reduced-motion: reduce)')");
  });

  it('안 오면 스스로 걷는다', () => {
    expect(s).toContain('STALL_MS');
  });

  it('다 차지 않는다 (100 은 «도착했다» 는 뜻이다)', () => {
    expect(s).toContain('const HOLD = 90');
  });

  it('겉모습은 제품이 정한다 (className 을 받는다)', () => {
    expect(s).toContain('className = ');
  });
});
