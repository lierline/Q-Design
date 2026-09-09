// =============================================================================
// 세 제품의 차림표를 나란히 찍는다
// =============================================================================
//   node tools/shoot-rails.mjs
//
// 「같아졌다」는 주장이 아니라 사진이어야 합니다. 치수를 재는 것(check-nav)과
// 띄워서 보는 것은 다른 질문입니다 - 값은 맞는데 그림이 다를 수 있습니다.
//
// ── 미리 띄워 둘 것 ───────────────────────────────────────────────────────
//   Q-Atelier   npm --prefix D:/Claude/Q-Atelier run dev            (3400)
//   Q-Sonar     pnpm --dir D:/Claude/Lead-Radar dev                 (3403)
//               node --env-file=.env.local scripts/preview-as.mjs   (3405 대리)
//   Q-Forge     node scripts/dev.mjs                                (3404)
//               node --env-file=.env.local scripts/preview-as.mjs 000000 3404 3408
//
// 두 대리 서버는 각 저장소의 scripts/preview-as.mjs 입니다. 비밀번호를 대신
// 치지 않고 세션 쿠키만 붙여 주는 개발용 문입니다.
//
// Q-Atelier 는 매직링크 콜백 라우트가 있어 대리 서버가 필요 없습니다.
//
// playwright 는 Q-Atelier 것을 빌려 씁니다 (이 저장소는 의존성을 두지 않습니다).
// =============================================================================

import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('D:/Claude/Q-Atelier/node_modules/playwright');
const { createClient } = require('D:/Claude/Q-Atelier/node_modules/@supabase/supabase-js');

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '..', 'preview', 'screens', 'rails');
mkdirSync(OUT, { recursive: true });

const THEME = process.env.THEME === 'light' ? 'light' : 'dark';

/** 레일만 담는 창. 폭은 레일(240) + 본문 한 뼘, 높이는 흔한 노트북 */
const VIEW = { width: 1440, height: 900 };
/** 잘라 낼 자리. 서랍 폭(264)까지 담아 오른쪽 경계선이 보이게 한다 */
const CLIP = { x: 0, y: 0, width: 268, height: 900 };

const envOf = (p) =>
  Object.fromEntries(
    readFileSync(p, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
      }),
  );

const browser = await chromium.launch();

async function shoot(name, url, prepare) {
  const ctx = await browser.newContext({
    viewport: VIEW,
    deviceScaleFactor: 2,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    reducedMotion: 'reduce',
    colorScheme: THEME,
  });
  if (prepare) await prepare(ctx);
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
    /* 로고 그림과 글꼴이 다 온 뒤에 찍는다. 먼저 찍으면 레일이 한 번 출렁인다 */
    await page.waitForSelector('.qd-rail, aside.qa-sidebar-aside', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const file = join(OUT, `${name}-${THEME}.png`);
    await page.screenshot({ path: file, clip: CLIP });
    console.log(`  ${name.padEnd(10)} ${page.url()}`);
    return file;
  } catch (e) {
    console.log(`  ${name.padEnd(10)} 실패: ${e.message.split('\n')[0]}`);
    return null;
  } finally {
    await ctx.close();
  }
}

/* ── Q-Atelier: 매직링크 콜백으로 들어간다 ─────────────────────────────────── */
const qaEnv = envOf('D:/Claude/Q-Atelier/.env.local');
const sb = createClient(qaEnv.NEXT_PUBLIC_SUPABASE_URL, qaEnv.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const { data: link, error } = await sb.auth.admin.generateLink({
  type: 'magiclink',
  email: process.env.QA_ACCOUNT || 'ra@demo.com',
});
if (error) throw error;

await shoot(
  'q-atelier',
  `http://localhost:3400/auth/callback?token_hash=${link.properties.hashed_token}&type=magiclink&next=/ra`,
  async (ctx) => {
    /* 첫 방문 코치마크는 전부 «본 것» 으로. 안 그러면 레일 위에 안내가 덮인다 */
    await ctx.addInitScript(({ theme }) => {
      const orig = Storage.prototype.getItem;
      Storage.prototype.getItem = function (k) {
        if (typeof k === 'string' && k.startsWith('qa-coachmark-')) return 'done';
        if (k === 'qa-theme') return theme;
        if (k === 'qa-novice-mode') return 'off';
        return orig.call(this, k);
      };
    }, { theme: THEME });
  },
);

await shoot('q-sonar', 'http://localhost:3405/leads');

/*
 * Q-Forge 는 기기 설정을 따라가지 않는다. 관리 화면의 기본이 «어둡게» 로 못
 * 박혀 있고(components/theme-toggle.tsx), 사람이 고른 값만 localStorage 에
 * 남는다. colorScheme 만 바꾸면 라이트로 안 넘어가므로 그 열쇠를 심어 준다.
 */
await shoot('q-forge', 'http://localhost:3408/production', async (ctx) => {
  await ctx.addInitScript((theme) => {
    const orig = Storage.prototype.getItem;
    Storage.prototype.getItem = function (k) {
      return k === 'dhr-theme' ? theme : orig.call(this, k);
    };
    document.documentElement.dataset.theme = theme;
  }, THEME);
});

/* ── 세 장을 한 장으로 ───────────────────────────────────────────────────────
   따로 놓으면 «비슷한가» 를 기억으로 견줘야 합니다. 나란히 붙여야 어긋난 자리가
   눈에 걸립니다 - 판 번호 줄의 대문자 하나도 이렇게 해서 잡았습니다. */
{
  const names = ['q-atelier', 'q-sonar', 'q-forge'];
  const titles = { 'q-atelier': 'Q-Atelier · 공방', 'q-sonar': 'Q-Sonar · 소나', 'q-forge': 'Q-Forge · 대장간' };
  const ink = THEME === 'light' ? '#1c1a16' : '#f0ebe0';
  const muted = THEME === 'light' ? '#726b5e' : '#898271';
  const bg = THEME === 'light' ? '#faf9f6' : '#0c0c0c';

  const cells = names
    .map((n) => `
      <figure>
        <figcaption>${titles[n]}</figcaption>
        <img src="${n}-${THEME}.png">
      </figure>`)
    .join('');

  const html = `<!doctype html><meta charset="utf-8">
<style>
  :root { color-scheme: ${THEME}; }
  body { margin: 0; padding: 28px 24px 24px; background: ${bg}; color: ${ink};
         font: 14px/1.5 'Pretendard Variable', Pretendard, 'Malgun Gothic', sans-serif; }
  h1 { margin: 0 0 4px; font-size: 17px; font-weight: 600; letter-spacing: 0; }
  p  { margin: 0 0 20px; font-size: 12px; color: ${muted}; }
  .row { display: flex; gap: 20px; align-items: flex-start; }
  figure { margin: 0; }
  figcaption { font-family: 'JetBrains Mono', Consolas, monospace; font-size: 10px;
               letter-spacing: 0; color: ${muted}; padding: 0 0 8px 2px; }
  img { display: block; width: 268px; height: auto; border: 1px solid ${muted}55; }
</style>
<h1>세 제품의 차림표</h1>
<p>같은 CSS 한 벌(dist/q-design.nav.css)에서 나온 것입니다 · ${THEME} · 1440x900 에서 촬영</p>
<div class="row">${cells}</div>`;

  const ctx = await browser.newContext({
    viewport: { width: 920, height: 1040 },
    deviceScaleFactor: 2,
    colorScheme: THEME,
  });
  const page = await ctx.newPage();
  const sheet = join(OUT, `_compare-${THEME}.html`);
  const { writeFileSync } = await import('node:fs');
  writeFileSync(sheet, html, 'utf8');
  await page.goto('file:///' + sheet.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
  await page.screenshot({ path: join(OUT, `_compare-${THEME}.png`), fullPage: true });
  await ctx.close();
  console.log(`  대조표     _compare-${THEME}.png`);
}

await browser.close();
console.log('');
console.log(`  ${OUT}`);
