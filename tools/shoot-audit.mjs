// =============================================================================
// 감사용 화면 촬영
// =============================================================================
//   node tools/shoot-audit.mjs
//
// 세 제품의 대표 화면을 한 벌로 찍습니다. 감사하는 사람이 «코드만 읽고» 판단하면
// 화면에서만 드러나는 것을 놓칩니다 - 겹침 · 잘림 · 빈 자리 · 눈에 안 띄는 주 동작
// 같은 것들입니다. 반대로 화면만 봐도 놓칩니다(왜 그렇게 됐는지가 코드에 있음).
// 둘 다 놓고 봅니다.
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

const VIEW = { width: 1440, height: 1000 };
const THEME = process.env.THEME === 'light' ? 'light' : 'dark';

/* 아키타입이 골고루 들어가게 골랐습니다: 허브 · 목록 · 상세 · 폼 · 설정 · 대시보드 */
const PLAN = {
  'q-atelier': {
    base: 'http://localhost:3400',
    auth: 'magiclink',
    routes: [
      ['hub-ra', '/ra'], ['dashboard', '/dashboard'], ['list-nc', '/nonconformances'],
      ['list-capa', '/capa'], ['audit-trail', '/audit'], ['docs', '/qms-documents'],
      ['settings', '/settings'], ['products', '/products'], ['suppliers', '/suppliers'],
      ['calendar', '/regulatory-calendar'],
    ],
  },
  'q-sonar': {
    base: 'http://localhost:3405',
    routes: [
      ['dashboard', '/dashboard'], ['leads', '/leads'], ['companies', '/companies'],
      ['targets', '/targets'], ['pipeline', '/pipeline'], ['outreach', '/outreach'],
      ['factories', '/factories'], ['products', '/products'], ['data-quality', '/data-quality'],
      ['diagnostics', '/diagnostics'], ['sent', '/sent'], ['me', '/me'],
      ['campaigns', '/campaigns'],
    ],
  },
  'q-forge': {
    base: 'http://localhost:3408',
    theme: 'dhr',
    routes: [
      ['board', '/board'], ['production', '/production'], ['production-setup', '/production/setup'],
      ['material', '/material'], ['material-stock', '/material/stock'], ['material-orders', '/material/orders'],
      ['equipment', '/equipment'], ['shipping', '/shipping'], ['trace', '/trace'],
      ['settings', '/settings'], ['settings-dmr', '/settings/dmr'], ['settings-items', '/settings/items'],
      ['settings-users', '/settings/users'], ['settings-audit', '/settings/audit'],
    ],
  },
};

const env = Object.fromEntries(
  readFileSync('D:/Claude/Q-Atelier/.env.local', 'utf8').split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }),
);

const browser = await chromium.launch();
const index = [];

for (const [product, cfg] of Object.entries(PLAN)) {
  const ctx = await browser.newContext({
    viewport: VIEW, deviceScaleFactor: 1, locale: 'ko-KR',
    timezoneId: 'Asia/Seoul', reducedMotion: 'reduce', colorScheme: THEME,
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

  for (const [name, route] of cfg.routes) {
    const file = `${product}--${name}.png`;
    try {
      await page.goto(cfg.base + route, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(1400);
      /* 전체 페이지를 찍되 너무 길면 자릅니다. 아래로 끝없이 이어지는 표는 위 두 화면이면 충분합니다 */
      const h = await page.evaluate(() => Math.min(document.documentElement.scrollHeight, 2400));
      await page.setViewportSize({ width: VIEW.width, height: h });
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(OUT, file) });
      await page.setViewportSize(VIEW);
      index.push({ product, name, route, file, url: page.url(), height: h });
      console.log(`  ${product.padEnd(11)} ${name.padEnd(18)} ${page.url()}`);
    } catch (e) {
      console.log(`  ${product.padEnd(11)} ${name.padEnd(18)} 실패: ${e.message.split('\n')[0].slice(0, 70)}`);
    }
  }
  await ctx.close();
}

await browser.close();
writeFileSync(join(OUT, `_index-${THEME}.json`), JSON.stringify({ theme: THEME, viewport: VIEW, shots: index }, null, 2), 'utf8');
console.log('');
console.log(`  ${index.length}장 · ${OUT}`);
