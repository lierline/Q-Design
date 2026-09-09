import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// =============================================================================
// 디자인 가드: 전문가 포털 글자 크기는 «역할 토큰» 으로만 정한다
// =============================================================================
// 🔴 2026-08-26 실측. 포털 CSS 의 고정 글자 크기가 **14종**이었다. 수가 많은 게
//    문제가 아니라 «같은 역할이 두 크기, 같은 크기가 두 역할» 인 게 문제였다.
//    화면에서 눈으로 잡힌 것:
//
//      「검토 대상 문서」 .section-title 12px  vs  「진행 중인 자문」 .luxe-section-title 11px
//      .wordmark-name-row .wm-sub 12px        vs  .wordmark .wm-sub 11px
//
//    옛 클래스와 luxe 클래스, 두 세대가 섞여 있었다. 값을 맞추면 또 갈리므로 토큰으로 묶었다.
//
// 🔑 이 계약은 «새 raw px 이 다시 생기는 것» 을 막는다. 정당한 예외는 세 가지뿐이고
//    전부 **이유가 코드 주석에 있어야** 통과한다(「사다리 밖」 표시).

const CSS = readFileSync(join(process.cwd(), 'app', 'experts', 'expert-theme.css'), 'utf8');

/** 사다리 토큰. 늘리려면 여기와 CSS 를 함께 고쳐야 한다(그게 벨이다). */
const LADDER = ['--fs-label', '--fs-ui', '--fs-body', '--fs-lead', '--fs-title', '--fs-brand', '--fs-figure'];

/** 예외 표식. 이 문구가 같은 줄이나 바로 위에 없으면 위반이다. */
const EXEMPT_MARK = '사다리 밖';

describe('전문가 포털 글자 크기 사다리', () => {
  it('사다리 토큰이 전부 정의돼 있다', () => {
    for (const t of LADDER) {
      expect(CSS, `${t} 이 정의돼 있지 않다`).toContain(t + ':');
    }
  });

  it('토큰이 실제로 쓰인다(정의만 해 두고 안 쓰면 사다리가 아니다)', () => {
    const unused = LADDER.filter((t) => !CSS.includes('var(' + t + ')'));
    expect(unused, `정의만 되고 안 쓰이는 토큰: ${unused.join(', ')}`).toEqual([]);
  });

  it('raw px font-size 는 이유가 적힌 예외뿐이다', () => {
    const lines = CSS.split('\n');
    const offenders: string[] = [];
    lines.forEach((line, i) => {
      if (!/font-size:\s*\d+px/.test(line)) return;
      // 주석 줄 자체(설명문 안의 예시)는 위반이 아니다.
      const code = line.replace(/\/\*[\s\S]*?\*\//g, '');
      if (!/font-size:\s*\d+px/.test(code)) return;
      const near = [lines[i - 2], lines[i - 1], line].filter(Boolean).join('\n');
      if (near.includes(EXEMPT_MARK)) return;
      offenders.push(`L${i + 1}: ${line.trim().slice(0, 76)}`);
    });
    expect(
      offenders,
      `사다리 토큰을 쓰거나, 왜 raw px 인지 「${EXEMPT_MARK}」 이유를 적을 것:\n  ${offenders.join('\n  ')}`,
    ).toEqual([]);
  });

  it('예외가 늘지 않는다', () => {
    // 🔑 「이유만 적으면 통과」로 두면 예외가 조용히 불어난다. 개수를 동결한다.
    //    줄이면 이 숫자를 낮춰 다시 동결할 것(환영).
    const n = CSS.split(EXEMPT_MARK).length - 1;
    // 정의 블록의 설명 주석 1회 + 실제 예외 4곳.
    expect(n, `「${EXEMPT_MARK}」 표식이 ${n}개다. 예외를 새로 만들었다면 정말 필요한지 볼 것.`).toBe(5);
  });

  it('사다리 값은 서로 다르다(같은 값 두 토큰이면 접다 만 것이다)', () => {
    const vals = LADDER.map((t) => {
      const m = CSS.match(new RegExp(t + ':\s*([^;]+);'));
      if (!m) throw new Error(t + ' 값을 못 읽었다');
      return m[1].trim();
    });
    expect(new Set(vals).size, `중복된 사다리 값: ${vals.join(', ')}`).toBe(LADDER.length);
  });
});
