// =============================================================================
// 키보드로 다닐 때 «지금 어디 있는지» 보이는가
// =============================================================================
//   node tools/check-focus.mjs
//
// Tab 을 실제로 눌러 가며 초점이 어디로 가는지 봅니다. 코드에 :focus-visible
// 규칙이 있는 것과 그 규칙이 이 요소에 실제로 걸리는 것은 다릅니다. 덮어쓰는
// 규칙 하나면 조용히 사라집니다.
//
// ── 🔴 개발 오버레이를 제품으로 세면 안 됩니다 ───────────────────────────────
// dev 서버에는 Next.js 의 오류 오버레이(<nextjs-portal>)가 항상 붙어 있습니다.
// 그것도 Tab 순서에 들어오는데, 초점 테두리가 없고 화면 밖에 있고 이름도
// 없습니다. 그대로 세면 「Q-Sonar /me 는 초점표시 없음 3 · 화면 밖 3 ·
// 이름 없음 7」 이 나옵니다. 셋 다 제품의 결함이 아닙니다.
//
// 실제로 그렇게 셌고, 보고서에 실을 뻔했습니다. 그래서 여기서는 걸러 내고,
// **몇 개를 걸러 냈는지도 함께 찍습니다** - 조용히 빼면 그것도 거짓말입니다.
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
    routes: ['/dashboard', '/nonconformances', '/qms-documents', '/settings'] },
  'q-sonar': { base: 'http://localhost:3405', routes: ['/leads', '/me', '/dashboard', '/targets'] },
  'q-forge': { base: 'http://localhost:3408', theme: 'dhr',
    routes: ['/production', '/settings/users', '/material', '/board'] },
};

const env = Object.fromEntries(
  readFileSync('D:/Claude/Q-Atelier/.env.local', 'utf8').split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }),
);

const SNAP = `() => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  /* 개발 도구가 붙인 것인가. 태그 이름과 조상을 함께 봅니다 */
  const 개발것 = !!(el.closest('nextjs-portal, [data-nextjs-dialog], #__next-build-watcher')
                   || /^nextjs-/.test(el.tagName.toLowerCase()));
  /*
   * 🔴 «이름» 은 aria-label 만이 아닙니다.
   *
   * 처음에는 aria-label · title · 글자만 봤더니 <input> 22개가 전부 「이름 없음」
   * 으로 나왔습니다. 그런데 그중 대부분은 <label for> 로 제대로 묶여 있었습니다.
   * 낭독기는 그것을 읽습니다. 그대로 두었으면 없는 결함 22개를 보고할 뻔했습니다.
   *
   * 그래서 낭독기가 실제로 쓰는 차례대로 찾습니다. placeholder 는 마지막이고,
   * 그것뿐이면 «약한 이름» 으로 따로 셉니다 - 값을 넣으면 사라지는 이름입니다.
   */
  const 이름찾기 = () => {
    const byId = el.getAttribute('aria-labelledby');
    if (byId) {
      const t = byId.split(/\s+/).map((i) => document.getElementById(i)?.textContent || '').join(' ').trim();
      if (t) return { 이름: t, 출처: 'aria-labelledby' };
    }
    const al = el.getAttribute('aria-label');
    if (al && al.trim()) return { 이름: al.trim(), 출처: 'aria-label' };
    if (el.id) {
      const lab = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
      if (lab && lab.textContent.trim()) return { 이름: lab.textContent.trim(), 출처: 'label for' };
    }
    const 감싼 = el.closest('label');
    if (감싼 && 감싼.textContent.trim()) return { 이름: 감싼.textContent.trim(), 출처: 'label 안' };
    const ti = el.getAttribute('title');
    if (ti && ti.trim()) return { 이름: ti.trim(), 출처: 'title' };
    const t = (el.textContent || '').trim();
    if (t) return { 이름: t, 출처: '글자' };
    const ph = el.getAttribute('placeholder');
    if (ph && ph.trim()) return { 이름: ph.trim(), 출처: 'placeholder' };
    return { 이름: '', 출처: '없음' };
  };
  const nm = 이름찾기();
  return {
    tag: el.tagName.toLowerCase(),
    label: nm.이름.slice(0, 30),
    이름출처: nm.출처,
    cls: (el.className || '').toString().slice(0, 44),
    개발것,
    /* 테두리든 그림자 고리든 «보이면» 됩니다. Q-Forge 차림표는 그림자로 알립니다 */
    ring: (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none',
    inView: r.top >= -2 && r.bottom <= innerHeight + 2 && r.width > 0 && r.height > 0,
  };
}`;

const browser = await chromium.launch();
const out = {};

for (const [product, cfg] of Object.entries(PLAN)) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 }, locale: 'ko-KR',
    colorScheme: 'dark', reducedMotion: 'reduce',
  });
  if (product === 'q-atelier') {
    await ctx.addInitScript(() => {
      const o = Storage.prototype.getItem;
      Storage.prototype.getItem = function (k) {
        if (typeof k === 'string' && k.startsWith('qa-coachmark-')) return 'done';
        if (k === 'qa-theme') return 'dark';
        if (k === 'qa-novice-mode') return 'off';
        return o.call(this, k);
      };
    });
  }
  if (cfg.theme === 'dhr') {
    await ctx.addInitScript(() => {
      const o = Storage.prototype.getItem;
      Storage.prototype.getItem = function (k) { return k === 'dhr-theme' ? 'dark' : o.call(this, k); };
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

  out[product] = {};
  for (const route of cfg.routes) {
    try {
      await page.goto(cfg.base + route, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(1200);
      await page.evaluate(() => document.body.focus?.());
      const 전부 = [];
      for (let i = 0; i < 45; i++) {
        await page.keyboard.press('Tab');
        const s = await page.evaluate(`(${SNAP})()`);
        if (!s) break;
        전부.push(s);
      }
      const 제품것 = 전부.filter((s) => !s.개발것);
      const 걸러냄 = 전부.length - 제품것.length;
      const r = {
        칸: 제품것.length, 걸러냄,
        초점표시없음: 제품것.filter((s) => !s.ring).length,
        화면밖: 제품것.filter((s) => !s.inView).length,
        이름없음: 제품것.filter((s) => !s.label).length,
        약한이름: 제품것.filter((s) => s.label && s.이름출처 === 'placeholder').length,
        첫칸: 제품것.slice(0, 4).map((s) => `${s.tag}:${s.label || '(이름없음)'}`),
        문제: 제품것.filter((s) => !s.ring || !s.inView || !s.label || s.이름출처 === 'placeholder')
          .slice(0, 8).map((s) => ({ tag: s.tag, cls: s.cls, label: s.label, 이름출처: s.이름출처,
            없는것: [!s.ring && '초점표시', !s.inView && '화면밖', !s.label && '이름',
                     s.label && s.이름출처 === 'placeholder' && '약한이름'].filter(Boolean).join('·') })),
      };
      out[product][route] = r;
      console.log(`  ${product.padEnd(10)} ${route.padEnd(18)} 제품 ${String(r.칸).padStart(2)}칸 (개발 오버레이 ${r.걸러냄}칸 제외) · 초점표시없음 ${r.초점표시없음} · 화면밖 ${r.화면밖} · 이름없음 ${r.이름없음} · 약한이름 ${r.약한이름}`);
    } catch (e) {
      out[product][route] = { error: e.message.split('\n')[0].slice(0, 70) };
      console.log(`  ${product.padEnd(10)} ${route.padEnd(18)} 실패`);
    }
  }
  await ctx.close();
}

await browser.close();
writeFileSync(join(OUT, '_focus.json'), JSON.stringify(out, null, 2), 'utf8');

console.log('');
for (const [p, routes] of Object.entries(out)) {
  const rs = Object.values(routes).filter((r) => !r.error);
  const s = (k) => rs.reduce((a, r) => a + r[k], 0);
  console.log(`  ${p.padEnd(10)} 잰 칸 ${s('칸')} · 초점표시없음 ${s('초점표시없음')} · 화면밖 ${s('화면밖')} · 이름없음 ${s('이름없음')} · 약한이름(placeholder 뿐) ${s('약한이름')}  (개발 오버레이 ${s('걸러냄')}칸은 뺐습니다)`);
}
console.log('');
console.log(`  ${join(OUT, '_focus.json')}`);
