/* Local browser checks for the two focus transitions and the review agreement. */
const { chromium } = require(process.env.QD_PLAYWRIGHT || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const output = path.resolve(__dirname, '../preview/screens/context-review');
const report = { checks: [], errors: [], contrast: [] };
const passed = message => { report.checks.push(message); console.log('PASS', message); };
(async () => {
 const browser = await chromium.launch({ channel: 'msedge', headless: true });
 try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => report.errors.push(error.message));
  await page.goto('http://127.0.0.1:4817/preview/context-review.html?motion=connected');
  await page.evaluate(() => document.fonts.ready);
  const list = page.locator('#list-pane'), work = page.locator('#workspace');
  const width = () => page.locator('#detail-pane').evaluate(el => el.getBoundingClientRect().width);
  const wait = () => page.waitForFunction(() => !document.getElementById('workspace').dataset.connecting);
  await page.locator('[data-document="DEV-2026-001"]').click();
  await page.locator('#note').fill('두 전환에서 같은 초안');
  await page.locator('#note').evaluate(el => { el.motionIdentity = 'same-node'; });
  await page.locator('#list-scroll').evaluate(el => { el.scrollTop = 230; });
  await page.locator('#detail-scroll').evaluate(el => { el.scrollTop = 160; });
  const listTop = await page.locator('#list-scroll').evaluate(el => el.scrollTop);
  const detailTop = await page.locator('#detail-scroll').evaluate(el => el.scrollTop);
  await page.locator('#slow-motion').click();
  const before = await width();
  await page.locator('#try-focus').click(); await page.waitForTimeout(160);
  const during = await width();
  assert(during > before + 20, 'Detail must visibly expand between frames');
  assert.equal(await list.evaluate(el => el.inert), true);
  await page.screenshot({ path: path.join(output, 'connected-midpoint-dark.png'), fullPage: true });
  await wait(); const after = await width(); assert(after > during + 1);
  assert.equal(await list.isVisible(), false);
  assert.equal(await page.locator('#note').evaluate(el => el.motionIdentity), 'same-node');
  await page.locator('#try-focus').click(); await page.waitForTimeout(100);
  assert(await width() < after - 20); await wait();
  assert(Math.abs(await width() - before) < 1);
  assert.equal(await page.locator('#list-scroll').evaluate(el => el.scrollTop), listTop);
  assert.equal(await page.locator('#detail-scroll').evaluate(el => el.scrollTop), detailTop);
  assert.equal(await page.locator('#note').inputValue(), '두 전환에서 같은 초안');
  passed('연속 폭 전환의 중간 프레임, 같은 본문 DOM, 초안·목록·본문 위치 복원');

  await page.locator('#try-focus').click(); await page.waitForTimeout(90);
  // A second click reverses the ongoing transition, rather than queuing it.
  await page.locator('#try-focus').click(); await wait();
  assert.equal(await work.getAttribute('data-mode'), 'split');
  assert.equal(await list.evaluate(el => el.inert), false);
  assert.equal(await page.locator('#list-scroll').evaluate(el => el.scrollTop), listTop);
  await page.locator('#try-focus').click(); await page.locator('#motion-current').click();
  assert.equal(await work.getAttribute('data-connecting'), null);
  assert.equal(await list.isVisible(), false);
  await page.locator('#try-focus').click();
  assert.equal(await work.getAttribute('data-connecting'), null);
  assert(await width() < after - 20);
  assert.equal(await page.locator('#article').evaluate(el => el.getAnimations()[0]?.effect.getTiming().duration), 540);
  passed('전환 도중 방향 반전과 비교 방식 변경, 기존 본문 전환 유지');

  await page.locator('#motion-connected').click(); await page.locator('#try-focus').click();
  await page.setViewportSize({ width: 1100, height: 850 });
  await wait();
  assert.equal(await work.getAttribute('data-connecting'), null);
  await page.locator('#try-focus').click(); await wait();
  await page.goBack(); await wait(); assert.equal(await work.getAttribute('data-mode'), 'focus');
  await page.goForward(); await wait(); assert.equal(await work.getAttribute('data-mode'), 'split');
  passed('크기 변경으로 전환 중단 후 복구, 브라우저 뒤로·앞으로');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#try-focus').click();
  assert.equal(await work.getAttribute('data-connecting'), null);
  assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
  assert.match(await page.locator('#announcement').textContent(), /집중 보기/);
  assert.equal(await page.locator('#document-title').evaluate(el => el === document.activeElement), true);
  await page.locator('#try-focus').click();
  passed('모션 줄이기의 즉시 전환·상태 안내·초점 유지');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.locator('#try-focus').click();
  await page.locator('#detail-scroll').dispatchEvent('wheel', { deltaY: 100 });
  assert.equal(await work.getAttribute('data-connecting'), null);
  assert.equal(await list.isVisible(), false);
  await page.locator('#try-focus').click(); await wait();
  passed('전환 중 읽기 조작이 애니메이션보다 우선');
  await page.emulateMedia({ reducedMotion: 'reduce' });

  for (const theme of ['dark', 'light']) {
   await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
   const ratios = await page.evaluate(() => {
    function luminance(rgb) { const vals = rgb.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return vals[0] * .2126 + vals[1] * .7152 + vals[2] * .0722; }
    return ['note', 'save', 'sort'].map(id => { const style = getComputedStyle(document.getElementById(id)); const a = luminance(style.borderTopColor), b = luminance(style.backgroundColor); return { id, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) }; });
   });
   for (const value of ratios) assert(value.ratio >= 3, `${theme}/${value.id}: ${value.ratio}`);
   report.contrast.push({ theme, controls: ratios });
  }
  passed('라이트·다크 입력·선택·보조 버튼 경계의 계산 대비 3:1 이상');

  await page.setViewportSize({ width: 375, height: 812 });
  await page.locator('#detail-scroll').evaluate(el => { el.scrollTop = 400; });
  const titleBounds = await page.locator('#current-document-title').boundingBox();
  assert.equal(await page.locator('#current-document-title').textContent(), '설계 입력 검토서');
  assert(titleBounds.height > 0);
  await page.locator('#mobile-menu-toggle').click();
  const scroll = await page.locator('#detail-scroll').evaluate(el => el.scrollTop);
  await page.setViewportSize({ width: 412, height: 580 });
  assert.equal(await page.locator('#mobile-menu').isVisible(), true);
  await page.locator('#mobile-menu-close').click();
  assert.equal(await page.locator('#detail-scroll').evaluate(el => el.scrollTop), scroll);
  await page.locator('#mobile-menu-toggle').click(); await page.keyboard.press('Escape');
  assert.equal(await page.locator('#mobile-menu').isVisible(), false);
  assert.equal(await page.locator('#detail-view').isVisible(), true);
  assert.equal(await page.locator('#mobile-menu-toggle').evaluate(el => el === document.activeElement), true);
  passed('모바일 제목·번호 유지, 메뉴 크기 변경·닫기·Escape의 읽기 위치 유지');

  for (const w of [320, 375, 412, 768, 1024, 1440]) {
   await page.setViewportSize({ width: w, height: 900 });
   assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow: ${w}`);
   assert.equal(await page.locator('#detail-pane').evaluate(el => el.scrollWidth > el.clientWidth), false, `panel overflow: ${w}`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.locator('#slow-motion').click();
  await page.evaluate(() => { document.getElementById('theme').textContent = '어두운 화면'; });
  await page.locator('#detail-scroll').evaluate(el => { el.scrollTop = 0; });
  await page.screenshot({ path: path.join(output, 'comparison-light.png'), fullPage: true });
  await page.locator('#try-focus').click(); await wait();
  await page.screenshot({ path: path.join(output, 'focus-light.png'), fullPage: true });
  await page.locator('#try-focus').click(); await wait();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#detail-scroll').evaluate(el => { el.scrollTop = 350; });
  await page.screenshot({ path: path.join(output, 'mobile-header-light.png'), fullPage: true });
  passed('비교 조작부 포함 320·375·412·768·1024·1440px 넘침 없음');
  assert.deepEqual(report.errors, []);
  fs.writeFileSync(path.join(output, 'motion-verification.json'), JSON.stringify(report, null, 2) + '\n');
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
