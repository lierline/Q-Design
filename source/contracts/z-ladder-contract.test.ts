import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Z } from './tokens';

// =============================================================================
// 겹침 순서는 «사다리 한 벌» 에서만 나온다 (2026-09-09 감사 · 주제 #9)
// =============================================================================
// 사다리에 칸이 없으면 층은 숫자를 «지어낸다». 실제로 그랬다:
// Z 를 부르는 곳이 3곳이었고 raw zIndex 리터럴이 58곳이었다.
//
// 그래서 390px 화면에서 Ctrl/Cmd+K 로 전역 검색을 열면 백드롭(100)·패널(110) 위에
// 햄버거(150)가 남아 **어두워진 화면에 단추 하나만 밝게 떠 있었다.**
// elementFromPoint(32, 32) 가 백드롭이 아니라 「사이드바 열기」 단추를 돌려줬다.
//
// 🔑 총량 baseline(no-raw-scale.test.ts 의 zIndex 축)은 «정작 충돌하는 자리» 를 못 본다.
//    47곳이 46곳이 되고 대신 GlobalSearch 에 새 숫자가 하나 생겨도 통과한다.
//    그래서 여기서는 «떠 있는 층 파일» 만 골라 0 으로 본다.

const ROOT = join(__dirname, '..', '..');

/**
 * 서로 겹치는 것이 실제로 문제가 되는 층들. 여기서는 숫자를 짓지 않는다.
 *
 * 목록에 이름을 더할 때는 그 파일의 raw zIndex 를 먼저 없앨 것. 그러지 않으면
 * 이 검사가 그 자리에서 바로 멈춘다(그것이 이 검사의 일이다).
 */
const 떠있는층 = [
  'components/GlobalSearch.tsx',
  'components/Sidebar.tsx',
  'components/MobileBottomNav.tsx',
  'components/AIQuickAccessFab.tsx',
  'components/Confirm.tsx',
  'components/Toast.tsx',
  'components/WelcomeFlow.tsx',
  'components/BarcodeScanButton.tsx',
  'components/KeywordReviewModal.tsx',
  'components/SessionExpiryGate.tsx',
];

describe('Z 사다리', () => {
  it('선언 순서대로 «엄격히» 오름차순이다', () => {
    /*
     * 같은 값이 둘 있으면 그 둘의 순서는 DOM 이 정한다. 즉 «우연» 이 정한다.
     * 사다리는 그것을 없애려고 있는 것이다.
     */
    const 칸 = Object.entries(Z);
    for (let i = 1; i < 칸.length; i++) {
      const [앞이름, 앞] = 칸[i - 1];
      const [뒷이름, 뒤] = 칸[i];
      expect(
        뒤,
        `${앞이름}(${앞}) 다음에 ${뒷이름}(${뒤}) 가 옵니다. 사다리는 오르기만 해야 합니다`,
      ).toBeGreaterThan(앞 as number);
    }
  });

  it('같은 값을 쓰는 칸이 없다', () => {
    const 값 = Object.values(Z);
    expect(new Set(값).size, `겹치는 값: ${값.join(' · ')}`).toBe(값.length);
  });

  it('떠 있는 층에는 숫자를 직접 적지 않는다', () => {
    const 나쁜곳: string[] = [];
    for (const rel of 떠있는층) {
      const 줄 = readFileSync(join(ROOT, rel), 'utf8').split(/\r?\n/);
      줄.forEach((t, i) => {
        if (/zIndex:\s*['"]?[0-9]/.test(t)) 나쁜곳.push(`${rel}:${i + 1}  ${t.trim().slice(0, 70)}`);
      });
    }
    expect(
      나쁜곳,
      '떠 있는 층에 숫자가 직접 적혀 있습니다. 이웃이 그 숫자를 모르므로 언젠가 넘어섭니다.\n' +
        'lib/design/tokens.ts 의 Z.* 를 쓰십시오. 맞는 칸이 없으면 «만들어» 주십시오.\n' +
        나쁜곳.join('\n'),
    ).toEqual([]);
  });

  it('서랍 무리가 전역 검색보다 아래에 있다 (이 감사가 찾은 바로 그 어긋남)', () => {
    for (const 칸 of ['drawerFab', 'drawerBackdrop', 'drawer'] as const) {
      expect(Z[칸], `${칸}(${Z[칸]}) 가 overlay(${Z.overlay}) 위에 있습니다`).toBeLessThan(Z.overlay);
    }
  });

  it('파괴 확인 대화상자가 토스트·툴팁보다 위에 있다', () => {
    /* 「지울까요?」를 물으면서 그 위에 다른 것이 뜨면 안 된다 */
    expect(Z.blocking).toBeGreaterThan(Z.toast);
    expect(Z.blocking).toBeGreaterThan(Z.tooltip);
  });
});
