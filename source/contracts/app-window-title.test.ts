/**
 * 앱 창 제목 규칙 (Q-Design 정본 components/AppWindowTitle.tsx · 2026-09-26)
 *
 * 크롬은 설치한 앱 창 제목을 «앱 이름 - 페이지 제목» 으로 붙이고, 페이지 제목이 앱 이름으로 시작할 때만
 * 그대로 둔다. 그래서 앱 창에서는 뒤에 단 제품 이름만 떼면 된다. 세 제품의 실제 제목 모양으로 묶는다.
 * 부품 자체(앱 창 판정 · 제목 감시)는 머리 없는 크롬에서 display-mode 를 바꿔 끼워 실측했다(세션 로그).
 */
import { describe, expect, it } from 'vitest';
import { appWindowTitle } from '@/components/AppWindowTitle';

describe('appWindowTitle: 뒤의 제품 이름만 뗀다', () => {
  it.each([
    // Q-Maison: 제목 틀 «%s · Q-Maison»
    ['대시보드 · Q-Maison', 'Q-Maison', '대시보드'],
    // Q-Atelier: 콜론으로 단 제목과 가운뎃점으로 단 제목이 섞여 있다
    ['현장 모드: Q-Atelier', 'Q-Atelier', '현장 모드'],
    ['용어집 · Q-Atelier', 'Q-Atelier', '용어집'],
    // Q-Carnet: 이름이 회사 설정에서 온다(띄어쓰기가 든 이름)
    ['작업할 배치 · 가나제약 제조기록', '가나제약 제조기록', '작업할 배치'],
    // 정규식 글자가 든 이름도 글자 그대로 본다
    ['설정 · A (B) 시스템', 'A (B) 시스템', '설정'],
    // document.title 처럼 공백을 한 칸으로 줄인다
    ['  대시보드   ·  Q-Maison ', 'Q-Maison', '대시보드'],
  ])('%s → %s 를 떼면 %s', (title, product, expected) => {
    expect(appWindowTitle(title, product)).toBe(expected);
  });

  it('제품 이름뿐인 제목은 비운다 (크롬이 앱 이름만 보인다)', () => {
    expect(appWindowTitle('Q-Maison', 'Q-Maison')).toBe('');
  });

  it.each([
    // 제품 이름으로 시작하면 크롬이 그대로 둔다. 건드리지 않는다
    ['Q-Atelier · 이용약관', 'Q-Atelier'],
    ['Q-Atelier: Farewell', 'Q-Atelier'],
    // 제품 이름이 없으면 크롬이 앞에 붙인다. 겹치지 않으므로 그대로
    ['대시보드', 'Q-Atelier'],
    // 이름이 가운데 있으면 뒤에 단 것이 아니다
    ['Q-Maison 사용법 · 도움말', 'Q-Maison'],
    // 이름을 못 읽었으면 아무것도 떼지 않는다
    ['대시보드 · Q-Maison', ''],
  ])('%s 는 그대로 둔다', (title, product) => {
    expect(appWindowTitle(title, product)).toBe(title);
  });
});
