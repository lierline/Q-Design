import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { readSource } from '@/lib/test-utils/contract-source';

// =============================================================================
// 글꼴은 «쓰인 글자의 조각만», 우리 서버에서 (2026-09-26 · 오빠 결정 「첫 방문 무게 줄이기」)
// =============================================================================
// 전에는 Pretendard 2MB 한 파일을 next/font/local 로 미리 받기(preload)까지 걸었고, JetBrains Mono 는
// globals.css 가 구글 글꼴 CSS 를 @import 했다. 처음 들어오는 사람은 어느 화면에서나 2MB 를 먼저 받았고,
// 외부 서버 두 곳과 연결을 맺기 전에는 화면을 그리지 못했다. 실사용자 기록(느린 쪽 기준)은 대시보드
// 첫 화면 3.8초였다.
//
// 지금은 scripts/fonts/build-fonts.mjs 가 만든 app/fonts.css 가 공식 조각판 92조각과 JetBrains Mono 를
// 자체 서버에서 싣는다. 이 시험은 그 묶음이 어긋나거나, 옛 방식이 슬그머니 돌아오는 것을 잡는다.
// 🔑 /fonts/* 는 1년 불변 캐시다(next.config.ts). 그래서 내용이 바뀌면 «주소» 가 바뀌어야 한다.

const ROOT = join(__dirname, '..', '..');
// 원문 검사는 공용 읽기로 한다(주석 속 낱말에 걸리지 않게). import 를 봐야 하는 자리는 'code' 모드.
const read = (p: string) => readSource(p, 'code');
const css = read('app/fonts.css');
const urls = [...css.matchAll(/url\('([^']+)'\)/g)].map((m) => m[1]);

// 폴백 얼굴(2026-11-04): 조각이 오기 전 잠깐 보이는 시스템 글꼴의 폭을 Pretendard 에 맞춘 'Pretendard Fallback' 스물네 얼굴
// (굵기 400 · 500 · 600 × 한글 · 라틴 · 숫자 · 공백 × Noto · 윈도(맑은 고딕 · Segoe UI)). 파일 없이 local() 만 가리키므로 주소 수는 94 그대로다.
const FALLBACK = 24;
const fallbackBlocks = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]).filter((b) => b.includes("'Pretendard Fallback'"));

describe('글꼴 묶음 (app/fonts.css)', () => {
  it(`Pretendard 92조각 + 폴백 ${FALLBACK} + JetBrains Mono 2 = @font-face ${94 + FALLBACK}개, 주소 94개마다 파일이 있다`, () => {
    expect((css.match(/@font-face/g) || []).length).toBe(94 + FALLBACK);
    expect(urls).toHaveLength(94);
    const missing = urls.filter((u) => !existsSync(join(ROOT, 'public', u)));
    expect(missing).toEqual([]);
  });

  it('폴백 얼굴 스물넷은 local() 만 가리키고, 범위 · 폭(size-adjust) · 세로(ascent · descent · line-gap) 를 다 적는다', () => {
    expect(fallbackBlocks).toHaveLength(FALLBACK);
    for (const b of fallbackBlocks) {
      expect(b).toMatch(/src:\s*local\('/);
      expect(b).not.toMatch(/url\(/);
      expect(b).toMatch(/unicode-range:\s*U\+/);
      // 폭 보정은 84~117% 사이여야 말이 된다(실측 84.9~116.5 · 숫자 얼굴이 가장 크다). 50% 나 150% 가 나오면 잰 값이 틀린 것이다
      const size = Number((b.match(/size-adjust:\s*([\d.]+)%/) || [])[1]);
      expect(size).toBeGreaterThanOrEqual(84);
      expect(size).toBeLessThanOrEqual(117);
      expect(b).toMatch(/ascent-override:\s*[\d.]+%/);
      expect(b).toMatch(/descent-override:\s*[\d.]+%/);
      expect(b).toMatch(/line-gap-override:\s*0%/);
    }
  });

  it('폴백 얼굴은 scripts/fonts/fallback-faces.mjs 가 만든 것과 같다 (build-fonts --check 가 대조한다)', () => {
    // scripts/ 는 tsconfig 의 include 밖이라 import 로는 못 부른다(gate-contract 와 같은 사정) → 검사기를 그대로 돌린다
    const out = execFileSync(process.execPath, [join(ROOT, 'scripts', 'fonts', 'build-fonts.mjs'), '--check'], { encoding: 'utf8' });
    expect(out).toContain('글꼴 묶음 맞음');
  });

  it('Pretendard 조각은 판 번호 폴더 안에 있고, 폴더의 조각 수와 CSS 가 같다', () => {
    const pret = urls.filter((u) => u.includes('/PretendardVariable.subset.'));
    expect(pret).toHaveLength(92);
    const dirs = new Set(pret.map((u) => u.split('/')[2]));
    expect([...dirs]).toHaveLength(1);
    const [dir] = [...dirs];
    expect(dir).toMatch(/^pretendard-\d+\.\d+\.\d+$/);
    const onDisk = readdirSync(join(ROOT, 'public', 'fonts', dir)).filter((n) => n.endsWith('.woff2'));
    expect(onDisk).toHaveLength(92);
  });

  it('JetBrains Mono 파일 이름의 해시가 내용과 같다 (불변 캐시라 내용이 바뀌면 이름이 바뀌어야 한다)', () => {
    const jbm = urls.filter((u) => u.includes('/jetbrains-mono/'));
    expect(jbm).toHaveLength(2);
    for (const u of jbm) {
      const h = createHash('sha256').update(readFileSync(join(ROOT, 'public', u))).digest('hex').slice(0, 8);
      expect(u).toContain(`.${h}.woff2`);
    }
  });

  it("--qa-font-pretendard 를 :root 에 세운다: 'Pretendard Variable' 다음에 'Pretendard Fallback' (순서가 바뀌면 Pretendard 가 영영 안 쓰인다)", () => {
    expect(css).toMatch(/:root\s*\{\s*--qa-font-pretendard:\s*'Pretendard Variable',\s*'Pretendard Fallback';/);
  });

  it('public/fonts 에는 쓰이는 두 폴더만 있다 (2MB 단일 파일이 돌아오지 않는다)', () => {
    const inUse = new Set(urls.map((u) => u.split('/')[2]));
    expect(readdirSync(join(ROOT, 'public', 'fonts')).sort()).toEqual([...inUse].sort());
  });
});

describe('옛 방식이 돌아오지 않는다', () => {
  it('next/font/local 로 Pretendard 를 싣지 않는다', () => {
    expect(read('lib/fonts.ts')).not.toMatch(/from\s+['"]next\/font\/local['"]|localFont\(/);
  });

  it('globals.css 가 구글 글꼴 CSS 를 @import 하지 않는다 (받기 전에는 화면을 못 그린다)', () => {
    expect(read('app/globals.css')).not.toMatch(/@import\s+url\(['"]?https:\/\/fonts\.googleapis\.com/);
  });

  it('루트 layout 이 fonts.css 를 globals.css 보다 먼저 부른다', () => {
    const layout = read('app/layout.tsx');
    const a = layout.indexOf("import './fonts.css'");
    const b = layout.indexOf("import './globals.css'");
    expect(a).toBeGreaterThan(-1);
    expect(a).toBeLessThan(b);
  });

  it('글꼴 주소는 미들웨어(로그인 확인)를 거치지 않는다', () => {
    // 🔴 2026-09-26 첫 판에서 실제로 났다. matcher 의 확장자 목록에 woff2 가 없어 로그인 전에는 /login 화면(HTML)이
    //    글꼴 자리로 돌아왔고, 브라우저는 조용히 시스템 글꼴로 그렸다. 파일이 «있다» 만 보던 이 계약은 초록이었다.
    //    읽는 법은 lib/pwa/android-asset-links.test.ts 와 같다(원문의 matcher 문자열 → 정규식).
    const src = read('middleware.ts');
    const literal = src.match(/matcher:\s*\[[\s\S]*?'(\/\(\(\?![^']+)'/)?.[1];
    expect(literal, 'middleware.ts 의 matcher 를 읽지 못했습니다').toBeTruthy();
    const matcher = new RegExp('^' + (literal as string).replace(/\\\\/g, '\\') + '$');
    expect(matcher.test('/dashboard'), '읽은 matcher 가 보통 화면을 안 잡습니다(읽기 규칙 확인)').toBe(true);
    const caught = urls.filter((u) => matcher.test(u));
    expect(caught, '이 글꼴 주소들이 미들웨어에 걸려 로그인 화면으로 돌아간다').toEqual([]);
  });

  it('글꼴 주소는 1년 불변 캐시다 (next.config.ts)', () => {
    const cfg = read('next.config.ts');
    expect(cfg).toMatch(/source:\s*'\/fonts\/:path\*'[\s\S]{0,200}public, max-age=31536000, immutable/);
  });
});
