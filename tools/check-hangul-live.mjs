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
  const 모노공백 = [];
  let korean = 0;
  /* 같은 글자를 두 글꼴로 그려 폭을 잽니다. 이름으로 판단하면 폴백을 못 봅니다 */
  const 재기 = (글, font) => { const c = document.createElement('canvas').getContext('2d'); c.font = font; return c.measureText(글).width; };
  const 본문글꼴 = getComputedStyle(document.body).fontFamily;
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

    /*
     * 🔴 자간을 풀었다고 끝이 아닙니다.
     *
     * 한글 이름표에 모노 글꼴이 걸려 있으면, 한글 글자 자체는 폴백(Pretendard)이
     * 그려서 폭이 같습니다. 그런데 **어절 사이 공백**은 모노가 그립니다. 10px
     * 에서 모노 공백은 6px, 본문 글꼴 공백은 2.5px 입니다. 두 배 넘게 벌어집니다.
     *
     * 그래서 「자간 0 · 대문자 없음」 인데도 「오늘  먼저  할  일」 처럼 보입니다.
     * 자간만 세는 검사는 이것을 0곳으로 보고합니다.
     */
    if (t.includes(' ')) {
      const 이글꼴 = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      const 본문 = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + 본문글꼴;
      const a = 재기(' ', 이글꼴), b = 재기(' ', 본문);
      if (b > 0 && a / b > 1.5) {
        모노공백.push({ text: t.slice(0, 30), size: cs.fontSize,
          공백: Math.round(a * 100) / 100, 본문공백: Math.round(b * 100) / 100,
          글꼴: cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(),
          tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 50) });
      }
    }
  }
  return { koreanNodes: korean, count: bad.length, sample: bad.slice(0, 20),
           모노공백수: 모노공백.length, 모노공백: 모노공백.slice(0, 12) };
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
  let sum = 0, nodes = 0, 공백 = 0;
  for (const route of cfg.routes) {
    try {
      const r = await page.goto(cfg.base + route, { waitUntil: 'networkidle', timeout: 60000 })
        .then(() => page.waitForTimeout(1200))
        .then(() => page.evaluate(`(${PROBE(THRESHOLD)})()`));
      report[product][route] = r;
      sum += r.count; nodes += r.koreanNodes; 공백 += r.모노공백수;
      console.log(`  ${product.padEnd(11)} ${route.padEnd(18)} 한글 ${String(r.koreanNodes).padStart(4)}곳 중 자간 ${String(r.count).padStart(3)}곳 · 모노 어절공백 ${String(r.모노공백수).padStart(3)}곳`);
    } catch (e) {
      report[product][route] = { error: e.message.split('\n')[0].slice(0, 80) };
      console.log(`  ${product.padEnd(11)} ${route.padEnd(18)} 실패`);
    }
  }
  report[product]._합계 = { 한글요소: nodes, 벌어진곳: sum, 비율: nodes ? Math.round(sum / nodes * 1000) / 10 : 0,
                           모노어절공백: 공백, 공백비율: nodes ? Math.round(공백 / nodes * 1000) / 10 : 0 };
  const h = report[product]._합계;
  console.log(`  ${product.padEnd(11)} ${'합계'.padEnd(18)} 한글 ${String(nodes).padStart(4)}곳 · 자간 ${String(sum).padStart(3)}곳 (${h.비율}%) · 모노 어절공백 ${String(공백).padStart(3)}곳 (${h.공백비율}%)`);
  await ctx.close();
}

await browser.close();
writeFileSync(join(OUT, '_hangul.json'), JSON.stringify(report, null, 2), 'utf8');
console.log('');
console.log(`  ${join(OUT, '_hangul.json')}`);
