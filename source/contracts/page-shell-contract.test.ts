// =============================================================================
// 화면 셸: 상세 · 폼은 좁히지 않는다 (2026-10-27 오너 결정 «3» 꽉 채움 + 칸 자동)
// =============================================================================
// 2026-08-30 판은 «폭은 LAYOUT 토큰(form 720 · detail 820 · wide 1140)에서 고르고 가운데로» 를
// 지켰다. 2026-10-27 운영 1920 실측에서 그 폭이 본문의 절반을 비우고, 같은 «상세» 가
// 820 · 1140 · 꽉 채움 세 갈래로 갈려 있었다(상세 16 · 3 · 8, 새로 만들기 17 · 3 · 10).
// 오너가 운영 화면에 입힌 시안 다섯 장을 보고 «3» 을 골랐다.
//
//   ① 상세 · 폼 화면은 공용 틀 `PageShell`(폭 제한 없음) 하나에 둔다. 칸은 `Fields` 격자.
//   ② 화면 셸을 가운데로 좁히는 것은 현장 모드(LAYOUT.mobile)뿐이다.
//
// 「화면 셸」의 정의는 그대로: 가운데 정렬된 폭 600px 이상의 컨테이너. 진행바(220)·표 셀(150)·
// 모달(480) 같은 «안쪽 요소» 는 대상이 아니다. 그것들은 화면 폭이 아니라 부품 폭이다.

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { LAYOUT } from './q-design-runtime';
import { resolveStyleValues } from '@/lib/test-utils/design-source';

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
  // 2026-10-08: settings/compliance/page.tsx 의 «권한 없음» 안내 카드(maxWidth: 640)는 EmptyState 로 바꿔 면제가 필요 없어졌다.
  // 2026-10-08(ⓘ 묶음 8): assessments/page.tsx 의 «RA · QA 전용» 안내 카드(maxWidth: 640)도 EmptyState 로 바꿔 면제를 걷었다.
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
      const lines = resolveStyleValues(readFileSync(p, 'utf-8')).split(/\r?\n/);
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

/** 공용 틀을 쓰는 파일. 스캔이 죽으면 0 이 된다. */
function pageShellFiles(): string[] {
  const out: string[] = [];
  for (const base of SCAN_DIRS) {
    for (const p of tsxFiles(join(ROOT, base))) {
      if (/<PageShell>/.test(readFileSync(p, 'utf-8'))) out.push(relative(ROOT, p).split(sep).join('/'));
    }
  }
  return out;
}

describe('상세 · 폼 화면은 좁히지 않는다 (2026-10-27 «3»)', () => {
  const shells = scan();

  it('스캔이 살아 있다', () => {
    // 정규식이 죽거나 폴더가 옮겨지면 «0곳» 으로 조용히 통과한다.
    expect(pageShellFiles().length, '공용 틀(PageShell)을 쓰는 화면을 못 찾았다').toBeGreaterThan(50);
    expect(shells.filter((s) => s.token === 'mobile').length, '현장 셸(LAYOUT.mobile)을 못 찾았다').toBeGreaterThan(0);
    expect(Object.keys(LAYOUT), 'LAYOUT 에는 현장 폭만 둔다. 상세 · 폼 폭을 되살리지 말 것').toEqual(['mobile']);
    for (const e of EXEMPT) {
      const found = shells.find((s) => s.file === e.file && s.src.includes(e.match));
      expect(found, `면제가 낡았다: ${e.file} 에 「${e.match}」 가 더 이상 없다`).toBeTruthy();
      expect(e.why.length, '면제에는 이유를 적을 것').toBeGreaterThan(20);
    }
  });

  it('화면 셸을 좁히는 것은 현장 모드뿐이다', () => {
    const offenders = shells
      .filter((s) => s.token !== 'mobile' && !isExempt(s))
      .map((s) => `${s.file}:${s.line}  (${s.px}px)\n    ${s.src.slice(0, 120)}`);
    expect(
      offenders,
      '상세 · 폼 화면을 가운데로 좁혔다. 2026-10-27 오너 결정 «3»: 상세 · 폼은 꽉 채운다. '
        + '화면 뿌리는 PageShell, 칸은 Fields(긴 칸은 wide) 로 놓을 것.',
    ).toEqual([]);
  });

  it('현장 셸은 가운데로 놓는다', () => {
    const offenders = shells
      .filter((s) => s.token === 'mobile' && !s.centered)
      .map((s) => `${s.file}:${s.line}\n    ${s.src.slice(0, 120)}`);
    expect(
      offenders,
      "maxWidth 만 잡고 margin: '0 auto' 를 빠뜨렸다. 넓은 화면에서 이 화면만 왼쪽에 붙는다",
    ).toEqual([]);
  });
});
