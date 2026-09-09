// =============================================================================
// 화면의 «뼈대» 를 잰다 - 제목 차례 · 지형지물 · 표의 의미
// =============================================================================
//   node tools/measure-structure.mjs
//
// 색과 여백이 같아도 뼈대가 다르면 다른 제품입니다. 그리고 뼈대는 눈에 안 보여서
// 스크린샷을 아무리 나란히 놓아도 안 드러납니다. 여기서 재는 것은 셋입니다.
//
//   제목 차례   h1 → h2 → h3 가 건너뛰지 않는가. 화면에 제목이 하나뿐이면
//               키보드 · 낭독기 사용자에게 그 화면은 «덩어리 하나» 입니다
//   지형지물    main · nav · aside 가 있는가. 이름표(aria-label)가 붙었는가.
//               nav 가 둘 이상인데 이름이 없으면 「어느 nav 인지」 를 못 고릅니다
//   표의 의미   <table> 이거나 role="table" 인가. 격자로만 그린 표는 낭독기가
//               「3행 2열」 을 못 말해 줍니다
//
// 🔴 이 검사는 «없음» 을 곧바로 «결함» 으로 읽으면 안 됩니다. 목록을 표가 아니라
//    낱장 카드로 그린 화면이라면 표가 없는 것이 맞습니다. 그래서 표 개수와 함께
//    «카드 목록으로 보이는 것» 도 같이 세어 둡니다.
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

const PLAN = {
  'q-atelier': { base: 'http://localhost:3400', auth: 'magiclink',
    routes: ['/dashboard', '/nonconformances', '/qms-documents', '/audit', '/ra', '/settings', '/design-trace'] },
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
  const 보임 = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const 제목 = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(보임);
  const 차례 = 제목.map((e) => +e.tagName[1]);

  /* 건너뛴 자리를 «어디서» 건너뛰었는지까지 남깁니다. 「h2 가 없다」 보다
     「h1 다음이 바로 h3 였다」 가 고칠 자리를 가리킵니다 */
  const 건너뜀 = [];
  for (let i = 1; i < 차례.length; i++) {
    if (차례[i] - 차례[i - 1] > 1) {
      건너뜀.push(\`h\${차례[i - 1]} → h\${차례[i]} (\${(제목[i].textContent || '').trim().slice(0, 18)})\`);
    }
  }

  const navs = [...document.querySelectorAll('nav')].filter(보임);
  const 이름없는nav = navs.filter((n) => !n.getAttribute('aria-label') && !n.getAttribute('aria-labelledby'));

  const 표 = [...document.querySelectorAll('table, [role="table"], [role="grid"]')].filter(보임);
  /* 격자로 그린 표: 열 서식이 반복되는 격자 컨테이너. 표처럼 보이지만 표가 아닌 것 */
  const 격자표 = [...document.querySelectorAll('div')].filter((el) => {
    if (!보임(el)) return false;
    const cs = getComputedStyle(el);
    if (cs.display !== 'grid') return false;
    const cols = cs.gridTemplateColumns.split(' ').length;
    return cols >= 3 && el.children.length >= cols * 3 && !el.closest('table');
  });

  return {
    제목차례: 차례.map((n) => 'h' + n).join(' ') || '(없음)',
    제목수: 제목.length,
    건너뜀,
    h1: 제목.filter((e) => e.tagName === 'H1').map((e) => (e.textContent || '').trim().slice(0, 26)),
    main: document.querySelectorAll('main').length,
    nav: navs.length, 이름없는nav: 이름없는nav.length,
    표: 표.length,
    표의미: 표.map((t) => (t.tagName === 'TABLE' ? 'table' : t.getAttribute('role'))),
    격자표: 격자표.length,
    카드목록: document.querySelectorAll('.qd-row, .qa-card-lift').length,
    lang: document.documentElement.lang || '(없음)',
    제목태그: document.title.slice(0, 40),
  };
}`;

const browser = await chromium.launch();
const report = {};

for (const [product, cfg] of Object.entries(PLAN)) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 }, locale: 'ko-KR',
    timezoneId: 'Asia/Seoul', reducedMotion: 'reduce', colorScheme: 'dark',
  });
  if (product === 'q-atelier') {
    await ctx.addInitScript(() => {
      const orig = Storage.prototype.getItem;
      Storage.prototype.getItem = function (k) {
        if (typeof k === 'string' && k.startsWith('qa-coachmark-')) return 'done';
        if (k === 'qa-theme') return 'dark';
        if (k === 'qa-novice-mode') return 'off';
        return orig.call(this, k);
      };
    });
  }
  if (cfg.theme === 'dhr') {
    await ctx.addInitScript(() => {
      const orig = Storage.prototype.getItem;
      Storage.prototype.getItem = function (k) { return k === 'dhr-theme' ? 'dark' : orig.call(this, k); };
      document.documentElement.dataset.theme = 'dark';
    });
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
      await page.waitForTimeout(1000);
      const r = await page.evaluate(`(${PROBE})()`);
      report[product][route] = r;
      const 표글 = r.표 ? `${r.표}개(${[...new Set(r.표의미)].join('/')})` : (r.격자표 ? `격자 ${r.격자표}` : '없음');
      console.log(`  ${product.padEnd(10)} ${route.padEnd(17)} 제목 ${r.제목차례.padEnd(20)} 건너뜀 ${String(r.건너뜀.length).padStart(1)} · nav ${r.nav}(이름없음 ${r.이름없는nav}) · 표 ${표글.padEnd(16)} 카드 ${r.카드목록}`);
    } catch (e) {
      report[product][route] = { error: e.message.split('\n')[0].slice(0, 80) };
      console.log(`  ${product.padEnd(10)} ${route.padEnd(17)} 실패`);
    }
  }
  await ctx.close();
}

await browser.close();
writeFileSync(join(OUT, '_structure.json'), JSON.stringify(report, null, 2), 'utf8');

console.log('');
for (const [p, routes] of Object.entries(report)) {
  const rs = Object.values(routes).filter((r) => !r.error);
  const 제목하나 = rs.filter((r) => r.제목수 <= 1).length;
  const 건너뛴화면 = rs.filter((r) => r.건너뜀.length).length;
  const 이름없는nav = rs.reduce((a, r) => a + r.이름없는nav, 0);
  console.log(`  ${p.padEnd(10)} 잰 화면 ${rs.length} · 제목이 하나뿐 ${제목하나} · 제목 차례를 건너뜀 ${건너뛴화면} · 이름 없는 nav ${이름없는nav}`);
}
console.log('');
console.log(`  ${join(OUT, '_structure.json')}`);
