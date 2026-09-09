// =============================================================================
// 임의 화면 촬영
// =============================================================================
// Q-Atelier 의 `shots.cjs` 에 없는 화면을 찍습니다. 원본 하네스를 고치지 않고
// 인증 방식(Supabase admin 매직링크)만 같은 것을 씁니다.
//
//   node tools/shoot-any.mjs [--light] [--out 폴더] <계정>:<경로>[:<이름>] ...
//
//   node tools/shoot-any.mjs ra:/admin/vigilance:emoji-icons qa:/capa:badges
//
// 계정: ex(대표) · qa · pr(생산) · ra · rd
// dev 서버가 3400 에 떠 있어야 합니다. 다른 세션의 서버여도 됩니다.

import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const APP = 'D:/Claude/Q-Atelier';
const { chromium } = require(APP + '/node_modules/playwright');
const { createClient } = require(APP + '/node_modules/@supabase/supabase-js');

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const LIGHT = args.includes('--light');
const outIdx = args.indexOf('--out');
const OUT = outIdx >= 0 ? args[outIdx + 1] : resolve(HERE, '..', 'preview', 'screens', 'audit');
const targets = args.filter((a, i) => !a.startsWith('--') && (outIdx < 0 || i !== outIdx + 1));

if (!targets.length) {
  console.error('찍을 화면을 주세요: <계정>:<경로>[:<이름>]');
  process.exit(2);
}

const BASE = process.env.BASE || 'http://localhost:3400';
const THEME = LIGHT ? 'light' : 'dark';
const ACCOUNTS = { ex: 'ex@demo.com', qa: 'qa@demo.com', pr: 'pr@demo.com', ra: 'ra@demo.com', rd: 'rd@demo.com' };

// .env.local 에서 키를 읽습니다. 값은 절대 출력하지 않습니다.
const env = Object.fromEntries(
  readFileSync(APP + '/.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
    }),
);
if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('.env.local 에 SUPABASE_SERVICE_ROLE_KEY 가 없습니다.');
  process.exit(2);
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ctxFor(browser, who) {
  const ctx = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 2,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    reducedMotion: 'reduce',
    colorScheme: THEME,
  });
  // 첫 방문 코치마크를 «본 것» 으로 처리하고 테마를 고정합니다.
  await ctx.addInitScript(
    ({ theme }) => {
      const orig = Storage.prototype.getItem;
      Storage.prototype.getItem = function (k) {
        if (typeof k === 'string' && k.startsWith('qa-coachmark-')) return 'done';
        if (k === 'qa-theme') return theme;
        if (k === 'qa-novice-mode') return 'off';
        return orig.call(this, k);
      };
    },
    { theme: THEME },
  );
  const { data, error } = await sb.auth.admin.generateLink({ type: 'magiclink', email: ACCOUNTS[who] });
  if (error) throw error;
  const p = await ctx.newPage();
  await p.goto(
    `${BASE}/auth/callback?token_hash=${data.properties.hashed_token}&type=magiclink&next=/dashboard`,
    { waitUntil: 'networkidle', timeout: 90000 },
  );
  if (!p.url().includes('/dashboard')) throw new Error(`로그인 실패 ${who}: ${p.url()}`);
  await p.close();
  return ctx;
}

const browser = await chromium.launch();
const ctxCache = new Map();
let ok = 0;
let fail = 0;

for (const t of targets) {
  const [who, path, name, scrollY] = t.split(':');
  if (!ACCOUNTS[who]) {
    console.error('  ? 모르는 계정: ' + who);
    fail++;
    continue;
  }
  try {
    if (!ctxCache.has(who)) ctxCache.set(who, await ctxFor(browser, who));
    const page = await ctxCache.get(who).newPage();
    const t0 = Date.now();
    await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
    await sleep(1400);
    // 앱 셸이 100dvh + overflow hidden 이라 window 가 아니라 «본문 컨테이너» 가 스크롤됩니다.
    // fullPage 도 그래서 안 먹습니다. 가장 큰 스크롤 컨테이너를 찾아 옮깁니다.
    if (scrollY) {
      await page.evaluate((y) => {
        const cands = [...document.querySelectorAll('*')].filter((el) => {
          const cs = getComputedStyle(el);
          return /(auto|scroll)/.test(cs.overflowY) && el.clientWidth > 600 && el.scrollHeight > el.clientHeight + 40;
        });
        cands.sort((a, b) => b.clientHeight - a.clientHeight);
        const target = cands[0];
        const to = y === 'bottom' ? 999999 : Number(y);
        if (target) target.scrollTop = to;
        else window.scrollTo(0, to);
      }, scrollY);
      await sleep(700);
    }
    const file = join(OUT, (name || path.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')) + (LIGHT ? '-light' : '') + '.png');
    await page.screenshot({ path: file });
    await page.close();
    console.log('  OK ' + path + ' → ' + file.split(/[\\/]/).pop() + ' (' + (Date.now() - t0) + 'ms)');
    ok++;
  } catch (e) {
    console.error('  실패 ' + path + ': ' + String(e.message).slice(0, 140));
    fail++;
  }
}

await browser.close();
console.log('');
console.log('찍음 ' + ok + ' · 실패 ' + fail + ' · ' + OUT);
if (fail) process.exit(1);
