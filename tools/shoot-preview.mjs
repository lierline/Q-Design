// 견본 페이지(preview/index.html)를 이미지로 남깁니다.
// 문서에 붙이거나 다른 사람에게 보여줄 때 서버를 안 띄우고도 볼 수 있게.
//
//   node tools/shoot-preview.mjs
//
// playwright 는 Q-Design 자기 package.json 의 것을 씁니다.
// 서버가 4800 에 떠 있어야 합니다:
//   python -m http.server 4800 --directory D:/Claude/Q-Design

import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '..', 'preview', 'screens', 'tokens');
mkdirSync(OUT, { recursive: true });

const URL = process.env.URL || 'http://localhost:4800/preview/index.html';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

await page.goto(URL, { waitUntil: 'networkidle' });
// 순차 등장 애니메이션이 끝난 뒤에 찍습니다. 진행 중에 찍으면 반투명하게 잡힙니다.
await page.waitForTimeout(1200);
// 자동화 캡처에서는 부드러운 스크롤이 방해가 됩니다.
await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });

for (const theme of ['dark', 'light']) {
  await page.evaluate((t) => {
    document.documentElement.dataset.theme = t;
    const btn = document.getElementById('themeBtn');
    if (btn) btn.textContent = t.toUpperCase();
    // 견본은 팔레트를 JS 로 그리므로 테마를 바꾸면 다시 그려야 합니다.
    if (typeof window.paint === 'function') window.paint();
  }, theme);
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, 'swatches-' + theme + '.png'), fullPage: true });
  console.log('  ' + theme + ' 저장');
}

await browser.close();
console.log('생성 완료 · preview/screens/tokens/');
