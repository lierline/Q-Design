// =============================================================================
// 네 제품이 «한 집안» 으로 보이는가 · 통일성 정밀 감사
// =============================================================================
//   node tools/audit-family.mjs            다크 + 라이트 둘 다
//   THEME=dark node tools/audit-family.mjs
//
// 2026-09-24 오빠 지시 「전체 디자인 통일성 정밀 감사」. 9월 9일 감사는 세 제품이었고
// 도구마다 제품 목록을 따로 들고 있었다. 넷째(Q-Maison)가 생겨 한 도구로 모은다.
//
// 무엇을 재나
//   1. 바탕값   html 글자 크기 · 본문 글꼴 · 모노 글꼴 · 바탕/글자/강조 색
//   2. 같은 뜻의 자리   화면 제목 · 눈썹줄 · 표 머리글/칸 · 단추 · 입력칸 · 판(카드) ·
//                       배지 · 차림표 항목. 각 자리의 «최빈값» 을 Q-Atelier 와 견준다
//   3. 전수 집계   화면에 보이는 요소 전부의 모서리 · 글자 크기 · 글꼴 · 색 · 그림자 종류.
//                  정본 밖 값이 몇 개, 어디에 있는지
//   4. 로그인 화면   같은 자리(머리글 · 카드 · 단추)의 좌표와 글꼴
//
// 🔴 정본 클래스(.qd-*)로 고르지 않는다. Q-Atelier 는 정본을 뽑아낸 원본이라 그
//    클래스를 안 쓴다(measure-scale.mjs 머리말). 뜻으로 고른다.
//
// 미리 띄워 둘 것
//   3400 Q-Atelier dev · 3405 Q-Sonar preview-as(→3403) · 3408 Q-Carnet preview-as(→3404)
//   3409 Q-Maison dev (pnpm --dir D:/Claude/Q-Works exec next dev -p 3409)
// =============================================================================

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('D:/Claude/Q-Atelier/node_modules/playwright');
const { createClient } = require('D:/Claude/Q-Atelier/node_modules/@supabase/supabase-js');

const OUT = 'D:/Claude/Q-Design/preview/screens/audit/family';
mkdirSync(OUT, { recursive: true });
const VIEW = { width: 1440, height: 1000 };
const THEMES = process.env.THEME ? [process.env.THEME] : ['dark', 'light'];

/* 아키타입을 맞춰 골랐다: 첫 화면 · 목록 둘 · 설정 · 쓰는 화면 */
const PLAN = {
  'q-atelier': {
    base: 'http://localhost:3400', login: 'http://localhost:3400/login', auth: 'magiclink', themeKey: 'qa-theme',
    routes: [['home', '/dashboard'], ['list', '/nonconformances'], ['list2', '/qms-documents'], ['settings', '/settings'], ['form', '/nonconformances/new']],
  },
  'q-sonar': {
    base: 'http://localhost:3405', login: 'http://localhost:3403/login',
    routes: [['home', '/dashboard'], ['list', '/leads'], ['list2', '/companies'], ['settings', '/me'], ['form', '/targets']],
  },
  'q-carnet': {
    base: 'http://localhost:3408', login: 'http://localhost:3404/login', themeKey: 'dhr-theme', dataTheme: true,
    routes: [['home', '/board'], ['list', '/production'], ['list2', '/material'], ['settings', '/settings'], ['form', '/production/setup']],
  },
  'q-maison': {
    base: 'http://localhost:3409', login: 'http://localhost:3409/login', auth: 'form', themeKey: 'qms-theme',
    user: 'dev@q-maison.local', pass: 'qworks-local-dev',
    routes: [['home', '/dashboard'], ['list', '/nc'], ['list2', '/documents'], ['settings', '/settings/company'], ['form', '/nc/new']],
  },
};
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;

const env = Object.fromEntries(
  readFileSync('D:/Claude/Q-Atelier/.env.local', 'utf8').split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }),
);

/* ---------------------------------------------------------------------------
   화면 안에서 도는 탐침. 문자열이 아니라 함수로 넘긴다(page.evaluate).
   --------------------------------------------------------------------------- */
function probe() {
  const vis = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight * 3;
  };
  const txt = (el) => (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  const fam = (f) => (f || '').split(',')[0].replace(/["']/g, '').trim();
  const pick = (el, props) => {
    const cs = getComputedStyle(el);
    const o = {};
    for (const p of props) {
      if (p === 'font-family') o[p] = fam(cs.fontFamily);
      else o[p] = cs.getPropertyValue(p);
    }
    const r = el.getBoundingClientRect();
    o.h = Math.round(r.height);
    o.w = Math.round(r.width);
    return o;
  };
  const mode = (arr) => {
    const m = new Map();
    for (const a of arr) { const k = JSON.stringify(a); m.set(k, (m.get(k) || 0) + 1); }
    let best = null, n = 0;
    for (const [k, c] of m) if (c > n) { best = k; n = c; }
    return best ? { ...JSON.parse(best), _n: n, _of: arr.length } : null;
  };
  const main = document.querySelector('main') || document.body;
  const inMain = (sel) => [...main.querySelectorAll(sel)].filter(vis);

  const TYPE = ['font-size', 'font-weight', 'font-family', 'letter-spacing', 'text-transform', 'color', 'line-height'];
  const BOX = ['border-radius', 'background-color', 'border-top-color', 'border-top-width', 'box-shadow', 'padding-top', 'padding-left'];

  const spots = {};
  const h1 = inMain('h1')[0];
  if (h1) {
    spots['화면 제목'] = pick(h1, TYPE);
    spots['화면 제목'].text = txt(h1);
    /* 눈썹줄: 제목 바로 위에 선 짧은 글. 같은 머리 묶음 안에서 제목보다 앞에 있는 글 요소 */
    const head = h1.closest('header') || h1.parentElement;
    const before = [...head.querySelectorAll('p,span,div')].filter((e) => vis(e) && e.children.length === 0
      && (e.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING) && txt(e).length > 1);
    if (before.length) { spots['눈썹줄'] = pick(before[before.length - 1], TYPE); spots['눈썹줄'].text = txt(before[before.length - 1]); }
    /* 금색 막대: 제목 머리 묶음 안(또는 ::before)의 짧고 얇은 막대 */
    const bars = [head, ...head.querySelectorAll('*')].flatMap((e) => {
      const out = [];
      for (const pse of ['::before', null]) {
        const cs = getComputedStyle(e, pse);
        if (pse && cs.content === 'none') continue;
        const w = parseFloat(cs.width), h = parseFloat(cs.height);
        if (w >= 12 && w <= 80 && h > 0 && h <= 4 && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') out.push({ w, h, bg: cs.backgroundColor });
      }
      return out;
    });
    spots['제목 금막대'] = bars[0] || { 없음: true };
  }
  const col = (sel, props) => { const els = inMain(sel).slice(0, 80); return els.length ? mode(els.map((e) => pick(e, props))) : null; };
  spots['표 머리글'] = col('table thead th', [...TYPE, 'padding-top', 'padding-left', 'background-color']);
  spots['표 칸'] = col('table tbody td', [...TYPE, 'padding-top', 'padding-left']);
  /* 배지: 글이 짧고 낮으며 바탕이나 테두리가 있는 인라인 상자 */
  const badges = inMain('span,a,div').filter((e) => {
    if (e.children.length > 1) return false;
    const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    const t = txt(e);
    return r.height >= 14 && r.height <= 26 && t.length > 0 && t.length <= 12 && cs.display.includes('inline')
      && (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(cs.borderTopWidth) > 0) && parseFloat(cs.borderRadius) >= 2;
  });
  spots['배지'] = badges.length ? mode(badges.slice(0, 60).map((e) => pick(e, ['font-size', 'font-family', 'font-weight', 'letter-spacing', 'border-radius', 'padding-left']))) : null;
  const btns = inMain('button, a[role=button], a[class*="btn"], a[class*="button"]').filter((e) => txt(e).length > 1);
  const solid = btns.filter((e) => { const b = getComputedStyle(e).backgroundColor; return b !== 'rgba(0, 0, 0, 0)' && !b.endsWith(', 0)'); });
  spots['단추(면)'] = solid.length ? mode(solid.slice(0, 40).map((e) => pick(e, ['font-size', 'font-weight', 'font-family', 'letter-spacing', 'border-radius', 'background-color', 'color', 'padding-left']))) : null;
  spots['단추(전체)'] = btns.length ? mode(btns.slice(0, 60).map((e) => pick(e, ['font-size', 'border-radius', 'font-family']))) : null;
  spots['입력칸'] = col('input[type=text], input[type=search], input:not([type]), input[type=email], input[type=date], select, textarea',
    ['font-size', 'border-radius', 'background-color', 'border-top-color', 'border-top-width', 'padding-left', 'font-family']);
  /* 판: 테두리가 있고 큼직한 상자 */
  const panels = inMain('div,section,article').filter((e) => {
    const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    return r.width >= 220 && r.height >= 80 && parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none';
  });
  spots['판(카드)'] = panels.length ? mode(panels.slice(0, 60).map((e) => pick(e, BOX))) : null;

  /* 차림표 */
  const rail = document.querySelector('aside nav, nav[aria-label], aside');
  if (rail && vis(rail)) {
    const aside = rail.closest('aside') || rail;
    spots['차림표 레일'] = pick(aside, ['width', 'background-color', 'border-right-color', 'padding-top', 'padding-left']);
    const items = [...aside.querySelectorAll('a')].filter((a) => vis(a) && txt(a).length > 1);
    spots['차림표 항목'] = items.length ? mode(items.slice(0, 40).map((e) => pick(e, ['font-size', 'font-family', 'font-weight', 'padding-top', 'padding-left', 'border-radius', 'color']))) : null;
    const act = aside.querySelector('[aria-current=page]');
    if (act) spots['차림표 활성'] = pick(act, ['background-color', 'color', 'box-shadow', 'border-left-color', 'border-left-width']);
  }

  /* 바탕값 */
  const bs = getComputedStyle(document.body);
  const base = {
    'html 글자': getComputedStyle(document.documentElement).fontSize,
    '본문 글꼴': fam(bs.fontFamily),
    '바탕색': bs.backgroundColor,
    '글자색': bs.color,
  };
  const monoEl = [...document.querySelectorAll('code, kbd, [class*="mono"]')].find(vis);
  base['모노 글꼴'] = monoEl ? fam(getComputedStyle(monoEl).fontFamily) : null;

  /* 전수 집계: 본문(main) 안의 보이는 요소 */
  const all = [...main.querySelectorAll('*')].filter(vis).slice(0, 4000);
  const census = { radius: {}, size: {}, family: {}, color: {}, bg: {}, shadow: {}, weight: {} };
  const bump = (k, v, el) => {
    if (!census[k][v]) census[k][v] = { n: 0, ex: [] };
    census[k][v].n++;
    if (census[k][v].ex.length < 3) census[k][v].ex.push(`${el.tagName.toLowerCase()}「${txt(el).slice(0, 18)}」`);
  };
  for (const el of all) {
    const cs = getComputedStyle(el);
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (parseFloat(cs.borderRadius) > 0 && (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(cs.borderTopWidth) > 0)) bump('radius', cs.borderRadius, el);
    if (cs.boxShadow !== 'none') bump('shadow', cs.boxShadow.replace(/\s+/g, ' ').slice(0, 80), el);
    if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)') bump('bg', cs.backgroundColor, el);
    if (hasText) {
      bump('size', cs.fontSize, el); bump('family', fam(cs.fontFamily), el);
      bump('color', cs.color, el); bump('weight', cs.fontWeight, el);
    }
  }
  return { url: location.pathname, base, spots, census };
}

function loginProbe() {
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const fam = (f) => (f || '').split(',')[0].replace(/["']/g, '').trim();
  const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), size: cs.fontSize, family: fam(cs.fontFamily), weight: cs.fontWeight, color: cs.color, bg: cs.backgroundColor, radius: cs.borderRadius, text: (el.innerText || '').trim().slice(0, 40) }; };
  const h = [...document.querySelectorAll('h1, h2, [class*="display"]')].filter(vis).sort((a, b) => parseFloat(getComputedStyle(b).fontSize) - parseFloat(getComputedStyle(a).fontSize))[0];
  const submit = [...document.querySelectorAll('button[type=submit]')].find(vis);
  const form = submit ? submit.closest('form') : null;
  let card = form; while (card && card.parentElement && !(parseFloat(getComputedStyle(card).borderTopWidth) > 0)) card = card.parentElement;
  const input = [...document.querySelectorAll('input')].find(vis);
  return { 머리글: box(h), 카드: box(card), 단추: box(submit), 입력칸: box(input), 바탕: getComputedStyle(document.body).backgroundColor, 본문글꼴: fam(getComputedStyle(document.body).fontFamily) };
}

async function themeContext(browser, product, cfg, theme) {
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1, locale: 'ko-KR', timezoneId: 'Asia/Seoul', reducedMotion: 'reduce', colorScheme: theme });
  await ctx.addInitScript(({ theme, key, dataTheme }) => {
    const orig = Storage.prototype.getItem;
    Storage.prototype.getItem = function (k) {
      if (typeof k === 'string' && k.startsWith('qa-coachmark-')) return 'done';
      if (k === 'qa-novice-mode') return 'off';
      if (key && k === key) return theme;
      return orig.call(this, k);
    };
    if (dataTheme) document.documentElement.dataset.theme = theme;
  }, { theme, key: cfg.themeKey, dataTheme: cfg.dataTheme });
  return ctx;
}

async function signIn(page, cfg) {
  if (cfg.auth === 'magiclink') {
    const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data, error } = await sb.auth.admin.generateLink({ type: 'magiclink', email: 'ex@demo.com' });
    if (error) throw error;
    await page.goto(`${cfg.base}/auth/callback?token_hash=${data.properties.hashed_token}&type=magiclink&next=/dashboard`, { waitUntil: 'networkidle', timeout: 120000 });
  } else if (cfg.auth === 'form') {
    await page.goto(cfg.login, { waitUntil: 'networkidle', timeout: 120000 });
    await page.fill('input[type=email]', cfg.user);
    await page.fill('input[type=password]', cfg.pass);
    await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 120000 }), page.click('button[type=submit]')]);
  }
}

const browser = await chromium.launch();
const result = { at: new Date().toISOString(), products: {} };

for (const theme of THEMES) {
  for (const [product, cfg] of Object.entries(PLAN)) {
    if (ONLY && !ONLY.includes(product)) continue;
    const r = (result.products[product] ??= {});
    r[theme] = { screens: {}, login: null };

    /* 로그인 화면은 로그인하지 않은 판에서 */
    {
      const ctx = await themeContext(browser, product, cfg, theme);
      const page = await ctx.newPage();
      try {
        await page.goto(cfg.login, { waitUntil: 'networkidle', timeout: 120000 });
        await page.waitForTimeout(1200);
        r[theme].login = await page.evaluate(loginProbe);
        await page.screenshot({ path: join(OUT, `${theme}--${product}--login.png`) });
      } catch (e) { r[theme].login = { 실패: e.message.split('\n')[0] }; }
      await ctx.close();
    }

    const ctx = await themeContext(browser, product, cfg, theme);
    const page = await ctx.newPage();
    try { await signIn(page, cfg); } catch (e) { console.log(`  ${product} 로그인 실패: ${e.message.split('\n')[0]}`); }
    for (const [name, route] of cfg.routes) {
      try {
        await page.goto(cfg.base + route, { waitUntil: 'networkidle', timeout: 120000 });
        await page.waitForTimeout(1500);
        const m = await page.evaluate(probe);
        m.finalUrl = page.url();
        r[theme].screens[name] = m;
        await page.screenshot({ path: join(OUT, `${theme}--${product}--${name}.png`) });
        console.log(`  ${theme} ${product.padEnd(10)} ${name.padEnd(9)} ${page.url()}`);
      } catch (e) {
        r[theme].screens[name] = { 실패: e.message.split('\n')[0].slice(0, 120) };
        console.log(`  ${theme} ${product.padEnd(10)} ${name.padEnd(9)} 실패: ${e.message.split('\n')[0].slice(0, 80)}`);
      }
    }
    await ctx.close();
  }
}
await browser.close();
const file = join(OUT, `_family${process.env.ONLY ? '-' + process.env.ONLY : ''}.json`);
writeFileSync(file, JSON.stringify(result, null, 1));
console.log('\n결과:', file);
