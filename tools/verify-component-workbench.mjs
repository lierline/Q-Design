// Run after build-component-workbench and serve-component-workbench.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { spawn } from 'node:child_process';
import { buildPalettes, readInputs } from './build-palette.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(root, '../Q-Atelier/package.json'));
const { chromium } = require('playwright');
const out = join(root, 'preview/screens/components');
mkdirSync(out, { recursive: true });
const browserTemp = join(root, '../tmp/qd-component-workbench/browser');
mkdirSync(browserTemp, { recursive: true });
process.env.TEMP = browserTemp;
process.env.TMP = browserTemp;
const port = 4819;
const server = spawn(process.execPath, [join(root, 'tools/serve-component-workbench.mjs')], { cwd: root, env: { ...process.env, QD_AUDIT_PORT: String(port) }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); server.once('exit', code=>reject(new Error(`Preview server exited ${code}`))); });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const findings = [];
const failures = [];
const paletteInputs=readInputs(root);
const paletteOverride=structuredClone(paletteInputs[2]);
paletteOverride.shared.light['--qa-text']='#30291f';
paletteOverride.shared.dark['--qa-text']='#fff4de';
const changedPalettes=buildPalettes(paletteInputs[0],paletteInputs[1],paletteOverride);
function check(condition, message) { if (!condition) failures.push(message); }
async function focusRestored(locator) {
  const element=await locator.elementHandle();
  try { await locator.page().waitForFunction(e=>document.activeElement===e,element,{timeout:2000}); return true; }
  catch { return false; }
  finally { await element.dispose(); }
}
const captureSessions=new WeakMap();
async function capture(page, path, fullPage=false) {
  // The installed Edge resets touch emulation during capture and on CDP
  // detach. Restore the explicit test condition and retain the session until
  // context.close(), then assert that capture has not changed the next test.
  const dimensions=await page.evaluate(full=>({width:innerWidth,height:full?Math.max(document.documentElement.scrollHeight,innerHeight):innerHeight,coarse:matchMedia('(pointer:coarse)').matches}),fullPage);
  let cdp=captureSessions.get(page);
  if(!cdp){cdp=await page.context().newCDPSession(page);captureSessions.set(page,cdp);}
  const shot=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:true,clip:{x:0,y:0,width:dimensions.width,height:dimensions.height,scale:1}});
  writeFileSync(path,Buffer.from(shot.data,'base64'));
  await cdp.send('Emulation.setTouchEmulationEnabled',dimensions.coarse?{enabled:true,maxTouchPoints:1}:{enabled:false});
  await page.waitForFunction(coarse=>matchMedia('(pointer:coarse)').matches===coarse,dimensions.coarse,{timeout:2000});
  check(await page.evaluate(()=>matchMedia('(pointer:coarse)').matches)===dimensions.coarse,'Screenshot changed pointer emulation');
}
try {
  for (const product of ['atelier', 'maison', 'carnet']) for (const theme of ['light', 'dark']) for (const width of [375, 412, 1440]) {
    const key = `${product}-${theme}-${width}`;
    const context = await browser.newContext({ viewport: { width, height: 1000 }, isMobile: width < 500, hasTouch: width < 500, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/preview/components/${product}/?theme=${theme}`);
    await page.locator('[data-testid="open-dialog"]').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const baseline = await page.evaluate(() => {
      const inputs = [...document.querySelectorAll('input:not([type=checkbox]),select,textarea')].filter(e => e.getBoundingClientRect().width);
      const style = e => ({ tag: e.tagName, radius: getComputedStyle(e).borderRadius, font: getComputedStyle(e).fontSize, height: e.getBoundingClientRect().height });
      const coarse=matchMedia('(pointer: coarse)').matches;
      const shortControls=coarse?[...document.querySelectorAll('.qd-btn,.qd-text-action,.qd-control-icon,.qd-input,.qd-choice,.qd-calendar-day')].filter(e=>{const r=e.getBoundingClientRect();return r.width && r.height<43.5;}).map(e=>({text:e.textContent?.slice(0,30),class:e.className,height:e.getBoundingClientRect().height})):[];
      return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, coarse, shortControls, inputs: inputs.map(style), bg: getComputedStyle(document.body).backgroundColor, color: getComputedStyle(document.body).color,
        overflow: [...document.querySelectorAll('body *')].filter(e => { const r=e.getBoundingClientRect(); return r.width && r.right > innerWidth + 1 && !e.closest('[class*=overflow]'); }).slice(0,12).map(e=>({tag:e.tagName,cls:e.className,right:e.getBoundingClientRect().right})) };
    });
    check(baseline.scrollWidth <= width + 1, `${key}: root horizontal overflow ${baseline.scrollWidth}`);
    check(baseline.inputs.length > 0 && baseline.inputs.every(i => i.radius === '10px'), `${key}: input radii ${JSON.stringify(baseline.inputs)}`);
    const radiusProbes=await page.locator('[data-testid=radius-probes] > *').evaluateAll(es=>es.map(e=>({id:e.dataset.testid,radius:getComputedStyle(e).borderRadius})));
    check(radiusProbes.length>7&&radiusProbes.every(e=>e.radius==='10px'),`${key}: mixed rectangular radii ${JSON.stringify(radiusProbes)}`);
    check(!baseline.shortControls.length,`${key}: coarse controls below44 ${JSON.stringify(baseline.shortControls)}`);
    check(!errors.length, `${key}: runtime ${errors.join('; ')}`);
    check(await page.getByTestId('canonical-icon').evaluate(e=>getComputedStyle(e).width)==='20px',`${key}: default icon size`);
    check(await page.getByTestId('explicit-icon').evaluate(e=>getComputedStyle(e).width)==='28px',`${key}: explicit icon size`);
    await capture(page,join(out,`${key}.png`),true);
    const host = page.getByTestId('open-dialog');
    const trigger = await host.evaluate(e=>e.tagName) === 'BUTTON' ? host : host.locator('button');
    await trigger.click();
    const dialog = page.locator('[role=dialog]').last();
    await dialog.waitFor({ state: 'visible' });
    await page.waitForFunction(()=>[...document.querySelectorAll('[role=dialog]')].some(e=>e.contains(document.activeElement)));
    const modal = await dialog.evaluate(e => { const r=e.getBoundingClientRect(),s=getComputedStyle(e); return { left:r.left,right:r.right,top:r.top,bottom:r.bottom,radius:s.borderRadius,bg:s.backgroundColor,focused:e.contains(document.activeElement),font:s.fontSize }; });
    check(modal.left >= -1 && modal.right <= width + 1, `${key}: modal outside viewport ${JSON.stringify(modal)}`);
    check(modal.radius === '10px', `${key}: modal radius ${modal.radius}`);
    check(modal.focused, `${key}: modal does not receive focus`);
    const controls=dialog.locator('button:visible:not([disabled]),input:visible:not([disabled]),textarea:visible:not([disabled]),select:visible:not([disabled]),a[href]:visible');
    const last=controls.last(); await last.focus(); await page.keyboard.press('Tab');
    check(await dialog.evaluate(e=>e.contains(document.activeElement)), `${key}: Tab escaped modal`);
    await controls.first().focus(); await page.keyboard.press('Shift+Tab');
    check(await dialog.evaluate(e=>e.contains(document.activeElement)), `${key}: Shift+Tab escaped modal`);
    await capture(page,join(out,`${key}-dialog.png`));
    await page.evaluate(()=>{for(const [name,value] of Object.entries({'--qd-radius':'14px','--qd-control-size':'15px','--qd-control-height':'48px','--qd-control-icon':'48px','--qd-progress-height':'9px','--qd-icon-size':'24px'}))document.documentElement.style.setProperty(name,value);});
    await page.waitForFunction(()=>[...document.querySelectorAll('[role=dialog],input:not([type=checkbox]),select,textarea')].filter(e=>e.getBoundingClientRect().width).every(e=>getComputedStyle(e).borderRadius==='14px' && (e.getAttribute('role')==='dialog' || getComputedStyle(e).fontSize==='15px')),null,{timeout:3000}).catch(()=>{});
    const mutation=await page.evaluate(()=>({inputs:[...document.querySelectorAll('input:not([type=checkbox]),select,textarea')].filter(e=>e.getBoundingClientRect().width).map(e=>({radius:getComputedStyle(e).borderRadius,font:getComputedStyle(e).fontSize})),modal:[...document.querySelectorAll('[role=dialog]')].map(e=>getComputedStyle(e).borderRadius)}));
    check(mutation.inputs.every(i=>i.radius==='14px'),`${key}: radius propagation failed ${JSON.stringify(mutation)}`);
    check(mutation.inputs.every(i=>i.font==='15px'),`${key}: input type propagation failed ${JSON.stringify(mutation)}`);
    check(mutation.modal.every(r=>r==='14px'),`${key}: modal radius propagation failed`);
    await page.waitForFunction(()=>[...document.querySelectorAll('[data-testid=radius-probes] > *')].every(e=>getComputedStyle(e).borderRadius==='14px'),null,{timeout:3000}).catch(()=>{});
    const radiusMutation=await page.locator('[data-testid=radius-probes] > *').evaluateAll(es=>es.map(e=>({id:e.dataset.testid,radius:getComputedStyle(e).borderRadius})));
    check(radiusMutation.every(e=>e.radius==='14px'),`${key}: square caller/utility radius escaped central update ${JSON.stringify(radiusMutation)}`);
    // The reduced-motion reset still permits a negligible transition; wait for
    // the property being asserted, not an unrelated font/radius transition.
    await page.waitForFunction(()=>[...document.querySelectorAll('.qd-progress')].every(e=>getComputedStyle(e).height==='9px'),null,{timeout:3000}).catch(()=>{});
    const heights=await page.evaluate(()=>({controls:[...document.querySelectorAll('.qd-btn,.qd-text-action,.qd-control-icon,.qd-input,.qd-choice')].filter(e=>e.getBoundingClientRect().width>0).map(e=>({class:e.className,height:e.getBoundingClientRect().height})),progress:[...document.querySelectorAll('.qd-progress')].map(e=>getComputedStyle(e).height)}));
    check(!baseline.coarse||heights.controls.every(e=>e.height>=47.5),`${key}: touch height propagation failed ${JSON.stringify(heights.controls.filter(e=>e.height<47.5))}`);
    check(heights.progress.every(height=>height==='9px'),`${key}: progress height propagation failed ${JSON.stringify(heights.progress)}`);
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-testid=canonical-icon]')).width==='24px',null,{timeout:3000});
    check(await page.getByTestId('explicit-icon').evaluate(e=>getComputedStyle(e).width)==='28px',`${key}: central icon default changed explicit size`);
    if(product!=='atelier') check(await page.getByTestId('utility-icon').evaluate(e=>parseFloat(getComputedStyle(e).width))===16,`${key}: explicit utility icon size lost to central default`);
    const paletteStyle=await page.addStyleTag({content:changedPalettes[product]});
    const expectedInk=theme==='light'?'rgb(48, 41, 31)':'rgb(255, 244, 222)';
    await page.waitForFunction(expected=>getComputedStyle(document.querySelector('[role=dialog]')).color===expected,expectedInk,{timeout:3000}).catch(()=>{});
    const paletteResult=await page.evaluate(()=>({dialog:getComputedStyle(document.querySelector('[role=dialog]')).color,input:getComputedStyle(document.querySelector('input:not(:disabled):not([readonly]):not([type=checkbox])')).color}));
    check(paletteResult.dialog===expectedInk && paletteResult.input===expectedInk,`${key}: generated palette propagation failed ${JSON.stringify(paletteResult)}`);
    await paletteStyle.evaluate(e=>e.remove());
    await page.keyboard.press('Escape');
    await dialog.waitFor({state:'hidden'});
    check(await focusRestored(trigger),`${key}: trigger focus not restored`);
    await page.evaluate(()=>{for(const name of ['--qd-radius','--qd-control-size','--qd-control-height','--qd-control-icon','--qd-progress-height'])document.documentElement.style.removeProperty(name);});
    await page.waitForFunction(()=>[...document.querySelectorAll('input:not([type=checkbox]),select,textarea')].filter(e=>e.getBoundingClientRect().width).every(e=>getComputedStyle(e).borderRadius==='10px' && getComputedStyle(e).fontSize==='13px'),null,{timeout:3000}).catch(()=>{});
    const drawerHost=page.getByTestId('open-drawer');
    if(await drawerHost.count()) {
      const drawerTrigger=await drawerHost.evaluate(e=>e.tagName)==='BUTTON'?drawerHost:drawerHost.locator('button');
      await drawerTrigger.click();
      const drawer=page.getByRole('dialog').last();
      await drawer.waitFor();
      await page.waitForFunction(()=>[...document.querySelectorAll('[role=dialog]')].some(e=>e.contains(document.activeElement)));
      const bounds=await drawer.boundingBox();
      check(bounds && bounds.x>=-1 && bounds.x+bounds.width<=width+1,`${key}: drawer exceeds viewport`);
      await page.keyboard.press('Escape'); await drawer.waitFor({state:'hidden'});
      check(await focusRestored(drawerTrigger),`${key}: drawer focus not restored`);
    }
    if(product==='atelier') {
      const toggle=page.getByRole('switch',{name:'자동 검토 알림'});
      await toggle.focus();await page.keyboard.press('Space');
      check(await toggle.getAttribute('aria-checked')==='true',`${key}: switch keyboard state did not change`);
      if(baseline.coarse)await page.waitForFunction(()=>[...document.querySelectorAll('[data-testid=list-toolbar] input[name=q], [data-testid=list-toolbar] select, [data-testid=list-pager] a')].every(e=>e.getBoundingClientRect().height>=44),null,{timeout:3000}).catch(()=>{});
      const listControls=await page.locator('[data-testid=list-toolbar] input[name=q], [data-testid=list-toolbar] select, [data-testid=list-pager] a').evaluateAll(es=>es.map(e=>({font:getComputedStyle(e).fontSize,height:e.getBoundingClientRect().height,tag:e.tagName})));
      check(listControls.length>=4 && listControls.every(c=>c.font==='13px'),`${key}: list control type mismatch ${JSON.stringify(listControls)}`);
      check(!baseline.coarse || listControls.every(c=>c.height>=44),`${key}: list coarse targets below44 ${JSON.stringify(listControls)}`);
      await trigger.click(); await page.getByRole('dialog').waitFor();
      for(const testid of ['open-nested-drawer','open-nested-confirm']) {
        const nestedHost=page.getByTestId(testid);
        if(!(await nestedHost.count())) throw new Error('Missing nested-overlay fixture: '+testid);
        const nestedTrigger=await nestedHost.evaluate(e=>e.tagName)==='BUTTON'?nestedHost:nestedHost.locator('button');
        await nestedTrigger.click();
        await page.waitForFunction(()=>document.querySelectorAll('[role=dialog],[role=alertdialog]').length===2);
        await page.keyboard.press('Escape');
        await page.waitForFunction(()=>document.querySelectorAll('[role=dialog],[role=alertdialog]').length===1);
        check(await page.evaluate(()=>document.body.style.overflow==='hidden'),`${key}: inner close unlocks outer scroll`);
        check(await focusRestored(nestedTrigger),`${key}: inner focus not restored`);
      }
      await page.keyboard.press('Escape'); await page.getByRole('dialog').waitFor({state:'hidden'});
      check(await focusRestored(trigger),`${key}: nested final focus not restored`);
      await page.getByTestId('show-toast').locator('button').click();
      check(await page.locator('.qd-toast').count()>0,`${key}: toast missing`);
    }
    if(product==='maison') {
      const checkbox=page.getByRole('checkbox',{name:'검토 항목 선택'});
      const hit=await checkbox.boundingBox();
      check(hit && hit.width>=44 && hit.height>=44,`${key}: checkbox hit area under44`);
      await checkbox.check(); check(await checkbox.isChecked(),`${key}: checkbox state did not change`);
      const days=await page.locator('.qd-calendar-day').evaluateAll(es=>es.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})));
      check(days.length>27 && days.every(d=>d.w>=44 && d.h>=44),`${key}: calendar target under44`);
      for (const side of ['top','bottom']) {
        const opener=page.getByTestId(`open-sheet-${side}`);
        await opener.click();
        const sheet=page.getByRole('dialog'); await sheet.waitFor();
        const sizing=await sheet.evaluate(e=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom,viewport:innerHeight,scroll:e.scrollHeight,client:e.clientHeight}));
        check(sizing.top>=-1 && sizing.bottom<=sizing.viewport+1,`${key}: ${side} sheet exceeds viewport ${JSON.stringify(sizing)}`);
        check(sizing.scroll>sizing.client,`${key}: long ${side} sheet is not scrollable`);
        // Browser keyboard navigation scrolls a target into view. Playwright's
        // focus() deliberately prevents scrolling, so it is not this UX check.
        await sheet.getByRole('button',{name:'닫기',exact:true}).focus();
        await page.keyboard.press('Shift+Tab');
        await page.waitForFunction(()=>[...document.querySelectorAll('[role=dialog] button')].filter(e=>e.textContent==='확인 완료').some(e=>{const r=e.getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight+1;}),null,{timeout:2000}).catch(()=>{});
        const end=await sheet.getByRole('button',{name:'확인 완료'}).boundingBox();
        check(end && end.y>=0 && end.y+end.height<=1001,`${key}: long ${side} sheet final action inaccessible ${JSON.stringify(end)}`);
        await page.keyboard.press('Escape'); await sheet.waitFor({state:'hidden'});
        check(await focusRestored(opener),`${key}: ${side} sheet focus not restored`);
      }
    }
    if(product==='carnet' && width<500) {
      const menu=page.locator('.qd-mobile-menu').first(); await menu.click();
      const navigation=page.getByRole('dialog').last(); await navigation.waitFor();
      await page.keyboard.press('Escape'); await navigation.waitFor({state:'hidden'});
      check(await focusRestored(menu),`${key}: mobile menu focus not restored`);
    }
    findings.push({key,baseline,modal,mutation,paletteResult,errors});
    console.log(`${key}: checked`);
    await context.close();
  }
  for(const product of ['atelier','maison','carnet']) {
    const context=await browser.newContext({viewport:{width:412,height:900},reducedMotion:'no-preference'});
    const page=await context.newPage();
    await page.goto(`http://127.0.0.1:${port}/preview/components/${product}/?theme=light`);
    const host=page.getByTestId('open-dialog');
    const trigger=await host.evaluate(e=>e.tagName)==='BUTTON'?host:host.locator('button');
    await trigger.click();
    const dialog=page.getByRole('dialog').last(); await dialog.waitFor();
    await dialog.evaluate(async e=>{await Promise.allSettled(e.getAnimations({subtree:true}).map(a=>a.finished));});
    const bounds=await dialog.boundingBox();
    check(bounds && bounds.x>=-1 && bounds.y>=-1 && bounds.x+bounds.width<=413 && bounds.y+bounds.height<=901,`${product}: normal-motion dialog exceeds viewport`);
    await page.keyboard.press('Escape'); await dialog.waitFor({state:'hidden'});
    check(await focusRestored(trigger),`${product}: normal-motion focus not restored`);
    await context.close();
  }
  const compareContext=await browser.newContext({viewport:{width:1440,height:1180},reducedMotion:'reduce'});
  const compare=await compareContext.newPage();
  await compare.goto(`http://127.0.0.1:${port}/preview/components.html`);
  for(const frame of compare.frames().filter(f=>f.parentFrame()))await frame.locator('[data-testid=parity-open-dialog]').waitFor();
  await capture(compare,join(out,'three-products.png'),true);
  await compare.locator('#radius').evaluate(e=>{e.value='14';e.dispatchEvent(new Event('input',{bubbles:true}));});
  for(const frame of compare.frames().filter(f=>f.parentFrame())) {
    await frame.waitForFunction(()=>getComputedStyle(document.querySelector('input:not([type=checkbox])')).borderRadius==='14px');
  }
  await compare.locator('#theme').selectOption('dark');
  for(const frame of compare.frames().filter(f=>f.parentFrame()))check(await frame.evaluate(()=>document.documentElement.dataset.theme==='dark'), 'Compare controls: theme propagation failed');
  await compare.locator('#reset').click();
  await compare.locator('#mode').selectOption('product');
  for(const frame of compare.frames().filter(f=>f.parentFrame()))await frame.locator('[data-testid=open-dialog]').waitFor();
  await compare.locator('#mode').selectOption('components');
  for(const frame of compare.frames().filter(f=>f.parentFrame()))await frame.locator('[data-testid=comparison-matrix]').waitFor();
  await compareContext.close();
} catch(error) { failures.push(error.stack); } finally { await browser.close(); server.kill(); }
writeFileSync(join(out,'results.json'),JSON.stringify({findings,failures},null,2)+'\n');
console.log(JSON.stringify({scenarios:findings.length,failures},null,2));
if(failures.length) process.exitCode=1;
