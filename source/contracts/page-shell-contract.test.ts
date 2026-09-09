// =============================================================================
// 화면 셸: 폭은 토큰으로, 정렬은 가운데로 (2026-08-30)
// =============================================================================
// 🔴 오빠 지적. 「교육과정등록 메뉴는 왜 또 왼쪽에 UI 가 치우쳐져 있어? 디자인을
//    전체다 통일성 있게 잡아야 할 거 같은데」
//
//    실측해 보니 `maxWidth: LAYOUT.*` 를 쓰는 54곳 중 **53곳은 가운데 정렬이 있었고
//    교육 과정 등록 한 곳만 `margin: '0 auto'` 가 빠져 있었다.** 폭은 720 으로 맞춰
//    두고 정렬만 빠뜨렸으니, 넓은 화면에서 그 화면만 왼쪽에 붙는다.
//
//    같이 재 보니 폭 쪽에도 다섯 곳이 눈금 밖이었다(1100 · 1080 · 920 · 860 · 640).
//    전부 토큰에서 40~100px 씩 어긋난 값이라 «의도한 예외» 가 아니라 그때그때 손으로
//    적은 숫자였다.
//
// 🔑 통일성은 «눈으로 훑어» 지키는 것이 아니라 **눈금을 하나만 두고 거기서 고르게**
//    해서 지킨다. 그래서 이 계약은 두 가지만 본다.
//      ① 화면 셸의 폭은 LAYOUT 토큰에서 고른다 (숫자를 직접 적지 않는다)
//      ② 폭을 잡았으면 가운데로 놓는다
//
// 「화면 셸」의 정의: 가운데 정렬된 폭 600px 이상의 컨테이너. 진행바(220)·표 셀(150)·
// 모달(480) 같은 «안쪽 요소» 는 대상이 아니다. 그것들은 화면 폭이 아니라 부품 폭이다.

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { LAYOUT } from './tokens';

const ROOT = join(__dirname, '..', '..');
const SCAN_DIRS = ['app', 'components'];

/** 이보다 좁으면 «화면 셸» 이 아니라 부품이다. */
const SHELL_MIN_PX = 600;

const TOKEN_WIDTH = /maxWidth:\s*LAYOUT\.([A-Za-z0-9_]+)/;
const HARD_WIDTH = /maxWidth:\s*['"]?(\d{3,4})(?:px)?['"]?/;
/** `margin: '0 auto'` · `margin: \`${S[10]}px auto\`` · marginInline: 'auto' 를 모두 인정한다. */
const CENTERED = /margin[A-Za-z]*:\s*[`'"][^`'"]*\bauto\b/;

/**
 * 면제: «안내 박스» 는 화면 셸이 아니다. 권한이 없거나 준비가 안 됐을 때 화면 한가운데
 * 띄우는 좁은 카드라, 본문 폭 눈금과는 다른 축이다.
 *
 * ⚠️ 면제에는 이유를 적을 것. 그리고 그 줄이 아직 있는지도 아래에서 검사한다.
 */
const EXEMPT: Array<{ file: string; match: string; why: string }> = [
  {
    file: 'app/(app)/assessments/page.tsx',
    match: 'maxWidth: 640',
    why: '본문이 아니라 «모듈 미사용» 안내 카드. 화면 한가운데 띄우는 좁은 박스라 본문 폭 눈금과 다른 축이다.',
  },
  {
    file: 'app/(app)/settings/compliance/page.tsx',
    match: 'maxWidth: 640',
    why: '본문이 아니라 «권한 없음» 안내 카드. 위와 같은 이유.',
  },
];

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === 'node_modules' || name === '.next') continue;
      out.push(...tsxFiles(p));
    } else if (name.endsWith('.tsx')) {
      out.push(p);
    }
  }
  return out;
}

interface Shell {
  file: string;
  line: number;
  src: string;
  /** 토큰을 썼으면 토큰 이름, 숫자를 박았으면 null. */
  token: string | null;
  px: number | null;
  centered: boolean;
}

function scan(): Shell[] {
  const out: Shell[] = [];
  for (const base of SCAN_DIRS) {
    for (const p of tsxFiles(join(ROOT, base))) {
      const lines = readFileSync(p, 'utf-8').split(/\r?\n/);
      lines.forEach((ln, i) => {
        const tok = TOKEN_WIDTH.exec(ln);
        const hard = tok ? null : HARD_WIDTH.exec(ln);
        if (!tok && !hard) return;
        const px = tok ? (LAYOUT as Record<string, number>)[tok[1]] : Number(hard![1]);
        // 스타일 객체가 여러 줄로 쪼개지므로 앞뒤를 함께 본다.
        const window = lines.slice(Math.max(0, i - 4), i + 3).join('\n');
        const centered = CENTERED.test(window);
        // 토큰을 썼으면 «화면 셸» 로 본다. 숫자면 폭과 정렬로 셸인지 가린다.
        if (!tok && (!centered || !px || px < SHELL_MIN_PX)) return;
        out.push({
          file: relative(ROOT, p).split(sep).join('/'),
          line: i + 1,
          src: ln.trim(),
          token: tok ? tok[1] : null,
          px: px ?? null,
          centered,
        });
      });
    }
  }
  return out;
}

const isExempt = (s: Shell) => EXEMPT.some((e) => e.file === s.file && s.src.includes(e.match));

describe('화면 셸은 눈금 하나에서 고른다', () => {
  const shells = scan();

  it('스캔이 살아 있다', () => {
    // 정규식이 죽거나 폴더가 옮겨지면 «0곳» 으로 조용히 통과한다.
    expect(shells.length, '화면 셸을 하나도 못 찾았다').toBeGreaterThan(30);
    expect(shells.filter((s) => s.token).length, '토큰을 쓰는 셸이 없다').toBeGreaterThan(30);
    for (const e of EXEMPT) {
      const found = shells.find((s) => s.file === e.file && s.src.includes(e.match));
      expect(found, `면제가 낡았다: ${e.file} 에 「${e.match}」 가 더 이상 없다`).toBeTruthy();
      expect(e.why.length, '면제에는 이유를 적을 것').toBeGreaterThan(20);
    }
  });

  it('폭은 LAYOUT 토큰에서 고른다', () => {
    const offenders = shells
      .filter((s) => !s.token && !isExempt(s))
      .map((s) => `${s.file}:${s.line}  (${s.px}px)\n    ${s.src.slice(0, 120)}`);
    expect(
      offenders,
      '화면 셸 폭에 숫자를 직접 적었다. 눈금이 둘이 되면 화면마다 조금씩 어긋난다. '
        + `LAYOUT 에서 고를 것 (${Object.entries(LAYOUT).map(([k, v]) => `${k}=${v}`).join(' · ')})`,
    ).toEqual([]);
  });

  it('폭을 잡았으면 가운데로 놓는다', () => {
    const offenders = shells
      .filter((s) => !s.centered && !isExempt(s))
      .map((s) => `${s.file}:${s.line}\n    ${s.src.slice(0, 120)}`);
    expect(
      offenders,
      "maxWidth 만 잡고 margin: '0 auto' 를 빠뜨렸다. 넓은 화면에서 이 화면만 왼쪽에 붙는다",
    ).toEqual([]);
  });
});
