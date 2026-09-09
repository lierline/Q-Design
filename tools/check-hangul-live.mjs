// =============================================================================
// 한글에 라틴 자간이 걸린 자리를 «화면에서» 센다
// =============================================================================
//   node tools/check-hangul-live.mjs
//
// 이 집안의 규칙은 「한글에는 자간과 대문자를 걸지 않는다」 입니다. 그 장치는
// 라틴 글자 사이를 벌리라고 만든 값이라 한글에 걸면 「실 행」 처럼 벌어집니다.
//
// ── 왜 코드 검사로는 부족한가 ────────────────────────────────────────────────
// Q-Atelier 에는 이미 계약 테스트가 있습니다(label-tracking-contract.test.ts).
// 그런데 그 테스트는 **소스에 적힌 숫자 리터럴**을 봅니다. 값이 CSS 클래스에서
// 오거나, 부모에서 상속되거나, 유틸리티(`tracking-[0.2em]`)로 붙으면 안 걸립니다.
//
// 그래서 화면을 띄워 «실제로 그려진 letter-spacing» 을 봅니다. 상속이든 클래스든
// 인라인이든, 눈에 벌어져 보이면 여기서 잡힙니다.
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

/** 이만큼 넘으면 눈에 벌어져 보입니다. 0.3px 아래는 렌더 반올림입니다. */
const THRESHOLD = 0.3;

const PLAN = {
  'q-atelier': { base: 'http://localhost:3400', auth: 'magiclink',
    routes: ['/dashboard', '/ra', '/nonconformances', '/audit', '/qms-documents', '/settings'] },
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

const PROBE = (threshold) => `() => {
  const hangul = /[가-힣]/;
  const bad = [];
  let korean = 0;
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    /* 글자를 «직접» 가진 요소만. 부모가 자식 글자를 자기 것으로 세면 두 번 셉니다 */
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!own) continue;
    const t = el.textContent.trim();
    if (!hangul.test(t)) continue;
    korean++;
    const ls = cs.letterSpacing;
    const px = ls.endsWith('px') ? parseFloat(ls) : 0;
    const up = cs.textTransform === 'uppercase';
    if (px > ${threshold} || up) {
      bad.push({ text: t.slice(0, 30), ls, upper: up, size: cs.fontSize,
                 tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 50) });
    }
  }
  return { koreanNodes: korean, count: bad.length, sample: bad.slice(0, 20) };
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
  let sum = 0, nodes = 0;
  for (const route of cfg.routes) {
    try {
      const r = await page.goto(cfg.base + route, { waitUntil: 'networkidle', timeout: 60000 })
        .then(() => page.waitForTimeout(1200))
        .then(() => page.evaluate(`(${PROBE(THRESHOLD)})()`));
      report[product][route] = r;
      sum += r.count; nodes += r.koreanNodes;
      console.log(`  ${product.padEnd(11)} ${route.padEnd(18)} 한글 ${String(r.koreanNodes).padStart(4)}곳 중 ${String(r.count).padStart(3)}곳이 벌어짐`);
    } catch (e) {
      report[product][route] = { error: e.message.split('\n')[0].slice(0, 80) };
      console.log(`  ${product.padEnd(11)} ${route.padEnd(18)} 실패`);
    }
  }
  report[product]._합계 = { 한글요소: nodes, 벌어진곳: sum, 비율: nodes ? Math.round(sum / nodes * 1000) / 10 : 0 };
  console.log(`  ${product.padEnd(11)} ${'합계'.padEnd(18)} 한글 ${String(nodes).padStart(4)}곳 중 ${String(sum).padStart(3)}곳 (${report[product]._합계.비율}%)`);
  await ctx.close();
}

await browser.close();
writeFileSync(join(OUT, '_hangul.json'), JSON.stringify(report, null, 2), 'utf8');
console.log('');
console.log(`  ${join(OUT, '_hangul.json')}`);
