// =============================================================================
// 같은 자리의 글자가 세 제품에서 같은 크기인가
// =============================================================================
//   node tools/measure-scale.mjs
//
// 차림표를 같게 맞추고 나면 「이제 같은 디자인인가」 를 묻게 됩니다. 차림표는
// 같습니다 - 정본이 한 벌이고 사본이 지문으로 대조되니까요. 그런데 **본문**은
// 정본이 뼈대만 줍니다(.qd-table 의 칸 여백, .qd-kpi 의 크기). 그 안에 들어가는
// 글자 크기는 각 제품의 유틸리티가 정합니다.
//
// 그래서 여기서는 «같은 뜻의 자리» 를 골라 세 제품에서 나란히 잽니다.
// 표 머리글 · 표 칸 · KPI 값 · 화면 제목처럼, 세 곳 모두에 있고 같은 일을 하는
// 자리입니다. 값이 갈리면 그것이 곧 「보면 다르게 느껴지는」 지점입니다.
//
// 코드를 읽어서는 알 수 없습니다. 크기가 rem 이면 밑동(html font-size)이
// 제품마다 다르고(Q-Atelier 14px · Q-Forge 16px), 유틸리티면 어느 것이 이기는지
// 화면에서만 정해집니다. 그래서 띄워서 잽니다.
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

/**
 * 잴 자리. 이름은 «뜻» 이고 선택자는 그 뜻이 사는 곳입니다.
 *
 * 🔴 정본 클래스(.qd-*)로 고르면 안 됩니다. Q-Atelier 는 정본을 **뽑아낸 원본**
 * 이라 그 클래스를 안 씁니다 - 같은 값을 인라인 스타일로 들고 있습니다. .qd-table
 * 로 재면 Q-Atelier 만 「없음」 이 나오고, 그것을 「다르다」 로 읽으면 거짓말이
 * 됩니다. 그래서 세 제품에 다 있는 **뼈대 선택자**로만 잽니다.
 *
 * 차림표 · 지표 카드 · 표 뼈대는 여기서 재지 않습니다. 그쪽은 정본 한 벌을
 * 지문으로 대조하니 이미 같음이 보장됩니다(sync.mjs · diff-rails.mjs). 여기서
 * 묻는 것은 **그 뼈대 안에 들어가는 글자의 척도**입니다 - 정본이 안 정하는 부분.
 */
const 자리 = [
  ['화면 제목', 'h1'],
  ['표 머리글', 'table thead th'],
  ['표 칸', 'table tbody td'],
  ['본문 문단', 'main p'],
  ['보통 단추', 'main button'],
  ['본문 링크', 'main a'],
  ['작은 글씨', 'main small, main [class*="text-[10px]"], main [class*="text-[11px]"]'],
];

const PLAN = {
  'q-atelier': { base: 'http://localhost:3400', auth: 'magiclink', routes: ['/dashboard', '/nonconformances', '/qms-documents'] },
  'q-sonar': { base: 'http://localhost:3405', routes: ['/dashboard', '/leads', '/companies'] },
  'q-forge': { base: 'http://localhost:3408', theme: 'dhr', routes: ['/board', '/production', '/material'] },
};

const env = Object.fromEntries(
  readFileSync('D:/Claude/Q-Atelier/.env.local', 'utf8').split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }),
);

/**
 * 한 자리에서 여러 요소가 잡히면 «가장 흔한 값» 을 그 자리의 값으로 삼습니다.
 * 평균이 아니라 최빈값인 이유: 표 칸 하나가 강조돼 굵어도 그 표의 성질은
 * 나머지 스무 칸이 정합니다. 평균은 그 하나에 끌려갑니다.
 */
const PROBE = (spec) => `() => {
  const 자리 = ${JSON.stringify(spec)};
  const 결과 = {};
  const 밑동 = getComputedStyle(document.documentElement).fontSize;
  for (const [이름, sel] of 자리) {
    const els = [...document.querySelectorAll(sel)].filter((el) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    if (!els.length) { 결과[이름] = null; continue; }
    const 표 = new Map();
    for (const el of els) {
      const cs = getComputedStyle(el);
      const key = [cs.fontSize, cs.fontWeight, cs.letterSpacing, cs.lineHeight, cs.textTransform].join('|');
      const 칸 = 표.get(key) || { n: 0, v: {
        크기: cs.fontSize, 굵기: cs.fontWeight, 자간: cs.letterSpacing,
        줄높이: cs.lineHeight, 대문자: cs.textTransform,
        글꼴: cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(),
      } };
      칸.n++; 표.set(key, 칸);
    }
    const 최빈 = [...표.values()].sort((a, b) => b.n - a.n)[0];
    결과[이름] = { ...최빈.v, 잡힌수: els.length, 이값: 최빈.n };
  }
  return { 밑동, 자리: 결과 };
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

  /* 여러 화면에서 잰 뒤 자리마다 «가장 많이 나온 값» 을 남깁니다. 한 화면에만
     있는 별종이 그 제품의 척도로 굳지 않게 하려는 것입니다. */
  const 모음 = {};
  let 밑동 = null;
  for (const route of cfg.routes) {
    try {
      await page.goto(cfg.base + route, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(1000);
      const r = await page.evaluate(`(${PROBE(자리)})()`);
      밑동 = r.밑동;
      for (const [이름, v] of Object.entries(r.자리)) {
        if (!v) continue;
        (모음[이름] ||= []).push(v);
      }
    } catch (e) {
      console.log(`  ${product} ${route} 실패: ${e.message.split('\n')[0].slice(0, 60)}`);
    }
  }

  const 자리값 = {};
  for (const [이름] of 자리) {
    const cand = 모음[이름];
    if (!cand?.length) { 자리값[이름] = null; continue; }
    const 표 = new Map();
    for (const v of cand) {
      const key = [v.크기, v.굵기, v.자간, v.대문자].join('|');
      const 칸 = 표.get(key) || { n: 0, v };
      칸.n += v.이값; 표.set(key, 칸);
    }
    자리값[이름] = [...표.values()].sort((a, b) => b.n - a.n)[0].v;
  }
  report[product] = { 밑동, 자리: 자리값 };
  await ctx.close();
}

await browser.close();
writeFileSync(join(OUT, '_scale.json'), JSON.stringify(report, null, 2), 'utf8');

/* ── 나란히 찍어 봅니다. 갈린 줄에만 ✗ 를 답니다 ────────────────────────────── */
const 제품 = Object.keys(report);
console.log('');
console.log(`  ${'자리'.padEnd(14)} ${제품.map((p) => p.padEnd(22)).join('')}`);
console.log(`  ${'-'.repeat(14)} ${제품.map(() => '-'.repeat(21)).join(' ')}`);
console.log(`  ${'밑동(rem)'.padEnd(13)} ${제품.map((p) => (report[p].밑동 || '?').padEnd(22)).join('')}`);
let 갈린수 = 0;
for (const [이름] of 자리) {
  const vs = 제품.map((p) => report[p].자리[이름]);
  const 글 = vs.map((v) => (v ? `${v.크기} ${v.굵기}${v.자간 !== 'normal' && parseFloat(v.자간) ? ` ${v.자간}` : ''}${v.대문자 === 'uppercase' ? ' 대문자' : ''}` : '없음'));
  const 같음 = new Set(글).size === 1;
  if (!같음) 갈린수++;
  console.log(`  ${같음 ? ' ' : '✗'}${이름.padEnd(13)} ${글.map((g) => g.padEnd(22)).join('')}`);
}
console.log('');
console.log(`  잰 자리 ${자리.length}개 중 ${갈린수}개가 제품마다 다릅니다`);
console.log(`  ${join(OUT, '_scale.json')}`);
