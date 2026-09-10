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

/*
 * 제품별 상한. **넘으면 exit 1 입니다.**
 *
 * 🔴 2026-09-10 까지 이 검사는 «세기만» 했습니다. 보고서만 내는 검사는 수가 늘어도
 *    초록이라, 되돌아오는 것을 못 막습니다. 상한을 두고 종료코드를 세웁니다.
 *
 * 값은 실측입니다(2026-09-10 · 1440x1000 · 다크 · 제품마다 6화면).
 *
 *   제품        한글 요소   자간   모노 어절공백
 *   Q-Atelier      778      53         88
 *   Q-Sonar      1,369       6        172
 *   Q-Forge        732       0          0
 *
 * 🔑 0 이 아닌 상한은 «봐준 것» 이 아니라 «아직 안 한 일» 입니다. 남은 것이
 *    무엇인지는 각 저장소 백로그에 적혀 있습니다. 줄이면 여기 값도 함께 내리세요 ·
 *    내리지 않으면 다시 늘어도 안 걸립니다.
 */
const 상한 = {
  'q-atelier': { 자간: 53, 공백: 88 },
  'q-sonar': { 자간: 6, 공백: 172 },
  'q-forge': { 자간: 0, 공백: 0 },
};

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
    /*
     * 글자를 «직접» 가진 요소만. 부모가 자식 글자를 자기 것으로 세면 두 번 셉니다.
     *
     * 🔴 2026-09-10. 판정을 el.textContent 로 하고 있었습니다. 그러면 «자식의»
     *    한글을 제 것으로 셉니다. Q-Forge 시계에서 드러났습니다: 바깥 span 은
     *    모노로 시각(17:39:32)을 그리고 날짜(9월 10일)는 .han 자식이 본문
     *    글꼴로 그리는데, 훑개가 «모노에 한글이 걸렸다» 고 여섯 화면에서
     *    거짓 빨간불을 냈습니다. 자기 텍스트 노드만 이어 붙여 봅니다.
     */
    const 제글 = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
    if (제글.length <= 1) continue;
    if (!hangul.test(제글)) continue;
    const t = 제글;
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
      /*
       * 🔴 canvas 의 measureText 는 word-spacing 을 안 봅니다.
       *
       * 정본이 한글 갈래에 word-spacing: -0.35em 을 걸어 공백을 되돌려도, 글꼴만
       * 재면 여전히 「모노 공백」 으로 나옵니다. 고쳐 놓고도 검사가 못 보는
       * 형태입니다 - 실제로 이 검사가 그렇게 거짓 빨간불을 냈습니다.
       *
       * 사람이 보는 것은 «글꼴 공백 + word-spacing» 입니다. 그것을 잽니다.
       */
      const ws = cs.wordSpacing === 'normal' ? 0 : (parseFloat(cs.wordSpacing) || 0);
      const a = 재기(' ', 이글꼴) + ws, b = 재기(' ', 본문);
      if (b > 0 && a / b > 1.5) {
        모노공백.push({ text: t.slice(0, 30), size: cs.fontSize,
          공백: Math.round(a * 100) / 100, 본문공백: Math.round(b * 100) / 100,
          wordSpacing: cs.wordSpacing,
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

/* ── 상한 판정 ─────────────────────────────────────────────────────────────
   🔑 «못 읽은 화면» 을 통과로 세지 않습니다. 로그인 화면에 떨어지면 한글 요소가
      몇 개뿐이라 자간·공백이 0 으로 나옵니다 - 실제로 그렇게 거짓 초록을 낸 적이
      있습니다(q-sonar 프록시 세션 만료). 그래서 «잰 요소 수» 도 함께 봅니다.
--------------------------------------------------------------------------- */
let 나쁨 = false;
console.log('');
for (const [product, cfg] of Object.entries(상한)) {
  const h = report[product]?._합계;
  if (!h) { console.log(`  🔴 ${product} 결과가 없습니다`); 나쁨 = true; continue; }
  const 못읽음 = h.한글요소 < 100;
  const 넘음 = h.벌어진곳 > cfg.자간 || h.모노어절공백 > cfg.공백;
  if (못읽음) console.log(`  🔴 ${product.padEnd(11)} 한글 요소가 ${h.한글요소}곳뿐입니다 · 로그인 화면에 떨어진 것으로 봅니다`);
  else if (넘음) console.log(`  🔴 ${product.padEnd(11)} 자간 ${h.벌어진곳}/${cfg.자간} · 공백 ${h.모노어절공백}/${cfg.공백}`);
  else console.log(`     ${product.padEnd(11)} 자간 ${h.벌어진곳}/${cfg.자간} · 공백 ${h.모노어절공백}/${cfg.공백}`);
  if (못읽음 || 넘음) 나쁨 = true;
}
if (나쁨) {
  console.log('');
  console.log('  한글에는 라틴 자간·대문자를 걸지 않습니다. 모노가 걸린 자리는 어절 공백도 되돌립니다.');
  console.log('  줄인 뒤에는 이 파일의 상한도 함께 내리십시오.');
  process.exitCode = 1;
}
