// =============================================================================
// 편의성·접근성 실측
// =============================================================================
//   node tools/measure-ux.mjs           다크
//   THEME=light node tools/measure-ux.mjs
//
// 코드를 읽어 아는 것과 화면을 재서 아는 것은 다릅니다. 여기서 재는 것은
// «화면을 실제로 그려 봐야만» 알 수 있는 값들입니다.
//
// ── 🔴 이 도구가 한 번 거짓말을 했습니다 (2026-09-09) ────────────────────────
// 처음 판은 대비 미달 18건을 냈는데 **전부 오탐**이었습니다. 세 가지가 겹쳤습니다.
//
//   ① 그라디언트 단추.  `background-color` 는 투명이고 색은 `background-image`
//      에 있습니다. 조상을 거슬러 올라가다 그 단추를 지나쳐 뒤쪽 어두운 면과
//      견줬고, 그래서 «검정 위 검정 1.08» 이 됐습니다. 실제로는 금색 위 검정입니다.
//   ② oklch.  요즘 크롬은 `color` 를 적힌 색공간 그대로 돌려줍니다
//      (`oklch(0.704 0.191 22.216)`). 숫자만 긁어 RGB 로 읽으면 완전히 다른 색이 됩니다.
//   ③ 문장 속 링크.  WCAG 2.2 는 글줄 안의 링크를 크기 규정에서 뺍니다.
//      그걸 세면 표 한 장에서 「작은 타깃 101개」 같은 숫자가 나옵니다.
//
// 그래서 지금은 **못 재는 것을 «못 잰다» 고 따로 셉니다.** 재지 못한 것을 통과로
// 세는 것도, 미달로 세는 것도 거짓말입니다. [[metric-inflated-by-eval-set]]
//
// 미리 띄워 둘 것: 3400 (Q-Atelier dev) · 3405 · 3408 (각 저장소 preview-as.mjs)
// =============================================================================

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('D:/Claude/Q-Atelier/node_modules/playwright');
const { createClient } = require('D:/Claude/Q-Atelier/node_modules/@supabase/supabase-js');

const OUT = 'D:/Claude/Q-Design/preview/screens/audit';
mkdirSync(OUT, { recursive: true });
const THEME = process.env.THEME === 'light' ? 'light' : 'dark';
const VIEW = { width: 1440, height: 1000 };

const PLAN = {
  'q-atelier': { base: 'http://localhost:3400', auth: 'magiclink',
    routes: ['/ra', '/dashboard', '/nonconformances', '/audit', '/qms-documents', '/settings'] },
  'q-sonar': { base: 'http://localhost:3405',
    routes: ['/dashboard', '/leads', '/companies', '/targets', '/outreach', '/me'] },
  'q-forge': { base: 'http://localhost:3408', theme: 'dhr',
    routes: ['/board', '/production', '/material', '/settings', '/trace', '/settings/users'] },
};

const env = Object.fromEntries(
  readFileSync('D:/Claude/Q-Atelier/.env.local', 'utf8').split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }),
);

const PROBE = `() => {
  /* ── 색 읽기 ──────────────────────────────────────────────────────────────
     캔버스에 실제로 칠해 보고 그 픽셀을 읽습니다. 이러면 oklch · color() ·
     이름 있는 색 무엇이 오든 브라우저가 sRGB 로 바꿔 줍니다. 문자열에서 숫자만
     긁는 방법은 색공간이 바뀌는 순간 조용히 틀립니다. */
  const cv = document.createElement('canvas');
  cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const memo = new Map();
  const toRGBA = (css) => {
    if (memo.has(css)) return memo.get(css);
    cx.clearRect(0, 0, 1, 1);
    cx.fillStyle = '#000';
    cx.fillStyle = css;                       /* 못 읽는 값이면 #000 이 남습니다 */
    cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data;
    const v = [d[0], d[1], d[2], d[3] / 255];
    memo.set(css, v);
    return v;
  };

  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const over = (fg, bg) => {           /* 알파 합성 */
    const a = fg[3];
    return [0, 1, 2].map((i) => Math.round(fg[i] * a + bg[i] * (1 - a)));
  };

  /* ── 이 글자 뒤에 실제로 깔린 면 ──────────────────────────────────────────
     조상을 거슬러 올라가며 반투명 면을 합성합니다. 도중에 그라디언트나 그림이
     나오면 «못 잰다» 로 돌려보냅니다 - 한 픽셀 색으로 줄일 수 없는 면입니다. */
  const backdrop = (el) => {
    const stack = [];
    let n = el;
    while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return { unmeasurable: 'background-image' };
      const c = toRGBA(cs.backgroundColor);
      if (c[3] > 0) stack.push(c);
      if (c[3] >= 0.999) {
        let acc = c.slice(0, 3);
        for (let i = stack.length - 2; i >= 0; i--) acc = over(stack[i], acc);
        return { rgb: acc };
      }
      n = n.parentElement;
    }
    const rootCs = getComputedStyle(document.documentElement);
    if (rootCs.backgroundImage && rootCs.backgroundImage !== 'none') return { unmeasurable: 'root background-image' };
    let acc = toRGBA(rootCs.backgroundColor).slice(0, 3);
    for (let i = stack.length - 1; i >= 0; i--) acc = over(stack[i], acc);
    return { rgb: acc };
  };

  const hidden = (el, cs, r) =>
    cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.15
    || r.width < 1 || r.height < 1
    /* sr-only 관용구: 1x1 로 눌러 두고 clip 으로 가린 것 */
    || (r.width <= 2 && r.height <= 2)
    || (cs.clipPath && cs.clipPath !== 'none' && r.width <= 2);

  const fails = [], unmeasured = [], small = [], taps = [], sizes = {};
  let textChecked = 0;

  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (hidden(el, cs, r)) continue;

    /* 글자를 «직접» 가진 요소만. 부모가 자식 글자를 자기 것으로 세면 안 됩니다 */
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (own) {
      const px = parseFloat(cs.fontSize);
      const bold = Number(cs.fontWeight) >= 700;
      sizes[px] = (sizes[px] || 0) + 1;
      if (px < 11) small.push({ px, tag: el.tagName.toLowerCase(), text: (el.textContent || '').trim().slice(0, 28) });

      const bd = backdrop(el);
      const info = {
        px, bold, tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().slice(0, 60),
        text: (el.textContent || '').trim().slice(0, 28),
      };
      if (bd.unmeasurable) { unmeasured.push({ ...info, why: bd.unmeasurable }); continue; }
      const fg = toRGBA(cs.color);
      const composited = fg[3] < 0.999 ? over(fg, bd.rgb) : fg.slice(0, 3);
      const need = (bold && px >= 18.66) || px >= 24 ? 3 : 4.5;
      const cr = Math.round(ratio(composited, bd.rgb) * 100) / 100;
      textChecked++;
      if (cr < need) fails.push({ ...info, ratio: cr, need, color: cs.color, on: 'rgb(' + bd.rgb.join(',') + ')' });
    }

    /* ── 누를 수 있는 것의 크기 ────────────────────────────────────────────
       WCAG 2.2 SC 2.5.8 은 «글줄 안의 링크» 를 뺍니다. 문장 속 링크까지 세면
       표 한 장에서 백 개가 나오는데, 그건 규정 위반이 아니라 글입니다. */
    if (el.matches('a[href], button, [role=button], [role=link], input:not([type=hidden]), select, summary')) {
      const inlineInText = cs.display.startsWith('inline') && !cs.display.includes('flex') && !cs.display.includes('block');
      if (inlineInText) continue;
      const min = Math.min(r.width, r.height);
      if (min < 24) {
        taps.push({ w: Math.round(r.width), h: Math.round(r.height), tag: el.tagName.toLowerCase(),
                    display: cs.display, cls: (el.className || '').toString().slice(0, 50),
                    label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 24) });
      }
    }
  }

  /* 이름 없는 아이콘 단추. 스크린리더가 「단추」 라고만 읽는 자리 */
  const nameless = [...document.querySelectorAll('a[href], button, [role=button]')].filter((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (hidden(el, cs, r)) return false;
    const t = (el.textContent || '').trim();
    return !t && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !el.getAttribute('title');
  }).map((el) => ({ tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 50) }));

  return {
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
      ? { doc: document.documentElement.scrollWidth, view: document.documentElement.clientWidth } : null,
    textChecked,
    contrastFails: fails.slice(0, 25), contrastFailCount: fails.length,
    unmeasured: unmeasured.slice(0, 10), unmeasuredCount: unmeasured.length,
    tinyText: small.slice(0, 12), tinyTextCount: small.length,
    smallTaps: taps.slice(0, 15), smallTapCount: taps.length,
    namelessButtons: nameless.slice(0, 10), namelessCount: nameless.length,
    fontSizes: Object.fromEntries(Object.entries(sizes).sort((a, b) => Number(a[0]) - Number(b[0]))),
    h1: (document.querySelector('h1') || {}).textContent?.trim().slice(0, 40) ?? null,
    h1Count: document.querySelectorAll('h1').length,
    landmarks: {
      main: document.querySelectorAll('main').length,
      nav: document.querySelectorAll('nav').length,
      skipLink: !!document.querySelector('a[href="#main"], a[href^="#"][class*=sr-only]'),
    },
  };
}`;

const browser = await chromium.launch();
const report = {};

for (const [product, cfg] of Object.entries(PLAN)) {
  const ctx = await browser.newContext({
    viewport: VIEW, locale: 'ko-KR', timezoneId: 'Asia/Seoul',
    reducedMotion: 'reduce', colorScheme: THEME,
  });
  if (product === 'q-atelier') {
    await ctx.addInitScript((theme) => {
      const orig = Storage.prototype.getItem;
      Storage.prototype.getItem = function (k) {
        if (typeof k === 'string' && k.startsWith('qa-coachmark-')) return 'done';
        if (k === 'qa-theme') return theme;
        if (k === 'qa-novice-mode') return 'off';
        return orig.call(this, k);
      };
    }, THEME);
  }
  if (cfg.theme === 'dhr') {
    await ctx.addInitScript((theme) => {
      const orig = Storage.prototype.getItem;
      Storage.prototype.getItem = function (k) { return k === 'dhr-theme' ? theme : orig.call(this, k); };
      document.documentElement.dataset.theme = theme;
    }, THEME);
  }
  const page = await ctx.newPage();
  if (cfg.auth === 'magiclink') {
    const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data, error } = await sb.auth.admin.generateLink({ type: 'magiclink', email: 'ex@demo.com' });
    if (error) throw error;
    await page.goto(`${cfg.base}/auth/callback?token_hash=${data.properties.hashed_token}&type=magiclink&next=/dashboard`,
      { waitUntil: 'networkidle', timeout: 90000 });
  }

  report[product] = {};
  for (const route of cfg.routes) {
    try {
      await page.goto(cfg.base + route, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(1200);
      /* 🔴 문자열을 넘기면 playwright 는 그것을 «식» 으로 평가합니다. 함수 리터럴을
         그대로 주면 함수가 값이 되어 직렬화되지 못하고 undefined 가 돌아옵니다. */
      const r = await page.evaluate(`(${PROBE})()`);
      report[product][route] = r;
      console.log(`  ${product.padEnd(11)} ${route.padEnd(18)} 잰글자 ${String(r.textChecked).padStart(4)} · 대비미달 ${String(r.contrastFailCount).padStart(3)} · 못잼 ${String(r.unmeasuredCount).padStart(3)} · 작은타깃 ${String(r.smallTapCount).padStart(3)} · 이름없는단추 ${String(r.namelessCount).padStart(2)}${r.overflowX ? ' · 가로넘침!' : ''}`);
    } catch (e) {
      report[product][route] = { error: e.message.split('\n')[0].slice(0, 90) };
      console.log(`  ${product.padEnd(11)} ${route.padEnd(18)} 실패: ${e.message.split('\n')[0].slice(0, 60)}`);
    }
  }
  await ctx.close();
}

await browser.close();
writeFileSync(join(OUT, `_measure-${THEME}.json`), JSON.stringify(report, null, 2), 'utf8');
console.log('');
console.log(`  ${join(OUT, `_measure-${THEME}.json`)}`);
