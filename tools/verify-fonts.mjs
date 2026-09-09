// =============================================================================
// 글꼴 검증: CDN 을 끊고도 세 글꼴이 «실제로» 붙는가
// =============================================================================
//   node tools/verify-fonts.mjs
//
// 견본을 열되 Google Fonts 를 통째로 차단합니다. 그 상태에서
//   ① document.fonts.check() 가 참인가
//   ② 렌더 «폭» 이 폴백과 다른가        ← 이게 진짜 판정입니다
// 를 봅니다.
//
// ②가 필요한 이유: `font-family` 에 이름만 적혀 있으면 check() 가 참을 낼 수 있고,
// 실제로는 시스템 글꼴로 그려질 수 있습니다. 전문가 포털에서 실제로 그런 일이 있었고
// (한글이 자리마다 다른 폰트로 그려짐) 그때도 «렌더 폭 실측» 으로 잡아냈습니다.
//
// 서버가 4800 에 떠 있어야 합니다:
//   python -m http.server 4800 --directory D:/Claude/Q-Design

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('D:/Claude/Q-Atelier/node_modules/playwright');

const URL = process.env.URL || 'http://localhost:4800/preview/index.html';

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

// ── Google Fonts 를 통째로 막습니다 ─────────────────────────────────────────
let blocked = 0;
await page.route('**://fonts.googleapis.com/**', (r) => { blocked++; return r.abort(); });
await page.route('**://fonts.gstatic.com/**', (r) => { blocked++; return r.abort(); });

const failedFonts = [];
page.on('requestfailed', (r) => {
  if (/\.(woff2?|ttf|otf)(\?|$)/.test(r.url()) && !/fonts\.g/.test(r.url())) {
    failedFonts.push(r.url());
  }
});

await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);

// @font-face 는 «쓰일 때» 로드됩니다. 견본이 Cormorant 를 안 쓰면 로드되지 않아
// check() 가 거짓을 냅니다. 재기 전에 명시적으로 불러 둡니다.
await page.evaluate(async () => {
  const names = ['Pretendard Variable', 'JetBrains Mono', 'Cormorant Garamond'];
  await Promise.all(
    names.flatMap((n) => [400, 500, 600, 700].map((w) => document.fonts.load(w + ' 100px "' + n + '"'))),
  );
  await document.fonts.ready;
});
await page.waitForTimeout(200);

const result = await page.evaluate(() => {
  const probe = 'Handgloves 0123 ISO 13485';
  // ⚠️ 한글 표본에 «공백을 넣지 않습니다».
  //    공백(U+0020)은 latin 서브셋이라 mono 체인에서 JetBrains Mono 가 가져갑니다.
  //    monospace 공백(0.6em)이 Pretendard 공백보다 넓어, 공백이 섞이면 폭이 커져
  //    「한글이 Pretendard 로 안 간다」로 잘못 읽힙니다(실제로 한 번 오판했습니다).
  const hangul = '품질을빚는아틀리에';
  // 앱이 실제로 쓰는 체인. 한글은 이 체인을 타고 Pretendard 까지 가야 합니다.
  const MONO_CHAIN =
    "'JetBrains Mono', 'Consolas', 'Menlo', ui-monospace, 'Pretendard Variable', monospace";

  // 같은 문구를 두 글꼴로 그려 폭을 잽니다. 폭이 같으면 폴백입니다.
  function width(text, family) {
    const el = document.createElement('span');
    el.textContent = text;
    el.style.cssText =
      'position:absolute;left:-9999px;white-space:pre;font-size:100px;font-family:' + family;
    document.body.appendChild(el);
    const w = el.getBoundingClientRect().width;
    el.remove();
    return Math.round(w * 10) / 10;
  }

  const names = ['Pretendard Variable', 'JetBrains Mono', 'Cormorant Garamond'];
  const out = { checks: {}, widths: {}, hangulWidths: {}, loaded: [] };

  for (const n of names) {
    out.checks[n] = document.fonts.check('100px "' + n + '"');
    out.widths[n] = width(probe, '"' + n + '", __nope__');
    out.hangulWidths[n] = width(hangul, '"' + n + '", __nope__');
  }
  // 폴백 기준선: 존재하지 않는 글꼴 이름 → 브라우저 기본
  out.widths['(폴백 serif)'] = width(probe, '__nope__, serif');
  out.widths['(폴백 monospace)'] = width(probe, '__nope__, monospace');
  out.widths['(폴백 sans)'] = width(probe, '__nope__, sans-serif');
  out.hangulWidths['(폴백 sans)'] = width(hangul, '__nope__, sans-serif');
  // 실제 mono 체인으로 잰 한글. 라틴은 JetBrains, 한글은 Pretendard 로 가야 합니다.
  out.hangulWidths['mono 체인(실사용)'] = width(hangul, MONO_CHAIN);
  out.widths['mono 체인(실사용)'] = width(probe, MONO_CHAIN);

  for (const f of document.fonts) {
    if (f.status === 'loaded') out.loaded.push(f.family + ' ' + f.weight);
  }

  // 화면에서 실제로 쓰이는 자리도 봅니다.
  const label = document.querySelector('.head-sub');
  const body = document.body;
  out.applied = {
    'mono 라벨': label ? getComputedStyle(label).fontFamily.split(',')[0].replace(/["']/g, '') : null,
    본문: getComputedStyle(body).fontFamily.split(',')[0].replace(/["']/g, ''),
  };
  return out;
});

await browser.close();

// ── 판정 ────────────────────────────────────────────────────────────────────
console.log('Google Fonts 차단: ' + blocked + '건');
console.log('');
console.log('document.fonts.check()');
for (const [k, v] of Object.entries(result.checks)) console.log('  ' + (v ? 'OK  ' : '실패 ') + k);
console.log('');
console.log('렌더 폭 (100px · "' + 'Handgloves 0123 ISO 13485' + '")');
for (const [k, v] of Object.entries(result.widths)) console.log('  ' + String(v).padStart(8) + '  ' + k);
console.log('');
console.log('한글 렌더 폭 (100px · 품질을 빚는 아틀리에)');
for (const [k, v] of Object.entries(result.hangulWidths)) console.log('  ' + String(v).padStart(8) + '  ' + k);
console.log('');
console.log('실제 적용: mono 라벨 = ' + result.applied['mono 라벨'] + ' · 본문 = ' + result.applied['본문']);
console.log('로드된 face ' + result.loaded.length + '개');

const problems = [];
for (const [k, v] of Object.entries(result.checks)) if (!v) problems.push(k + ' 가 로드되지 않았습니다');
// 폭이 폴백과 같으면 이름만 적힌 것입니다.
const fb = result.widths;
if (fb['JetBrains Mono'] === fb['(폴백 monospace)']) problems.push('JetBrains Mono 가 시스템 monospace 로 떨어졌습니다 (폭이 같음)');
if (fb['Cormorant Garamond'] === fb['(폴백 serif)']) problems.push('Cormorant 가 시스템 serif 로 떨어졌습니다 (폭이 같음)');
if (fb['Pretendard Variable'] === fb['(폴백 sans)']) problems.push('Pretendard 가 시스템 sans 로 떨어졌습니다 (폭이 같음)');
// 실사용 mono 체인의 한글은 Pretendard 로 가야 합니다.
// (JetBrains Mono 단독으로 재면 한글 글리프가 없어 시스템으로 떨어지는 게 정상입니다.
//  그래서 «체인» 으로 재야 합니다. 전문가 포털 사고가 정확히 이 지점이었습니다.)
const hw = result.hangulWidths;
if (hw['mono 체인(실사용)'] !== hw['Pretendard Variable']) {
  problems.push(
    'mono 체인의 한글이 Pretendard 로 안 갑니다 (' +
      hw['mono 체인(실사용)'] + ' vs Pretendard ' + hw['Pretendard Variable'] + ')',
  );
}
if (result.widths['mono 체인(실사용)'] !== result.widths['JetBrains Mono']) {
  problems.push('mono 체인의 라틴이 JetBrains Mono 로 안 갑니다');
}
if (failedFonts.length) problems.push('로컬 글꼴 요청 실패 ' + failedFonts.length + '건: ' + failedFonts[0]);

console.log('');
if (problems.length) {
  console.error('검증 실패:\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log('통과 · CDN 을 끊어도 세 글꼴이 모두 로컬에서 붙고, 한글은 Pretendard 로 갑니다.');
