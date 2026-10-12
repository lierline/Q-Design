// Private local role probes use each product's complete compiled workbench CSS.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {inspectWorkspaceTargets} from './workspace-targets-review.mjs';
const root='D:/Claude/Q-Design',proof=inspectWorkspaceTargets(),{chromium}=createRequire(root+'/../Q-Atelier/package.json')('playwright'),port=4826;
const server=spawn(process.execPath,[root+'/tools/serve-component-workbench.mjs'],{cwd:root,env:{...process.env,QD_AUDIT_PORT:String(port)},windowsHide:true,stdio:['ignore','pipe','pipe']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error('Private fixture server exited '+code)));});
let browser;const cases=[];
try{
 browser=await chromium.launch({channel:'msedge',headless:true});
 for(const product of ['atelier','maison','carnet'])for(const width of [320,390,1280])for(const theme of ['light','dark'])for(const touch of [false,true]){
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:touch,isMobile:touch}),page=await context.newPage();await page.goto('http://127.0.0.1:'+port+'/preview/components/'+product+'/?theme='+theme+'&view=matched');await page.getByTestId('comparison-matrix').waitFor();await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>{const probe=document.createElement('section');probe.id='qd-action-probe';probe.style.cssText='display:flex;gap:16px;flex-wrap:wrap;padding:16px;';probe.innerHTML='<button class="qd-text-action" type="button">취소</button><a class="qd-text-action" href="#qd-action-probe">닫기</a>';probe.querySelector('button').addEventListener('click',()=>probe.dataset.clicked='true');document.querySelector('main')?.prepend(probe)??document.body.prepend(probe);});
  const measure=()=>page.locator('#qd-action-probe .qd-text-action').evaluateAll(nodes=>nodes.map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return{label:e.textContent,width:r.width,height:r.height,minWidth:s.minWidth,radius:s.borderRadius,font:s.fontFamily,x:r.x,right:r.right};}));
  const before=await measure();assert.equal(before.length,2);assert(before.every(r=>r.width>=44&&r.height>=(touch?44:36)&&r.radius==='10px'&&r.x>=0&&r.right<=width),'Short actions must have distinct in-viewport targets: '+JSON.stringify({product,width,theme,touch,before}));
  await page.locator('#qd-action-probe button').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#qd-action-probe').getAttribute('data-clicked'),'true');const focused=await measure();assert(focused.every(r=>r.radius==='10px'),'Keyboard focus must preserve the canonical corners');
  await page.evaluate(()=>document.documentElement.style.setProperty('--qd-control-height','48px'));const mutation=await measure();assert(mutation.every(r=>r.width>=48&&r.minWidth==='48px'),'Both action types must follow the central control dimension');
  await page.evaluate(()=>document.documentElement.style.removeProperty('--qd-control-height'));assert.deepEqual(await measure(),before);
  cases.push({product,width,theme,touch,before,focused,mutation,keyboardActivation:true});
  if(product==='maison'&&width===320&&theme==='dark'&&!touch)await page.screenshot({path:'D:/Claude/tmp/qd-phase98-short-action-targets.png'});
  await context.close();
 }
 assert.equal(cases.length,36);fs.writeFileSync(root+'/reviews/action-targets-browser.json',JSON.stringify({scope:'Shared text-action button and link probes in the actual three-product compiled CSS. Three widths, two themes and two pointer modes. Central width mutation and keyboard activation checked. No business forms or services are submitted. This is role verification, not a certificate for every work screen or a physical device installation.',sources:proof.sources,cases,passed:36},null,2)+'\n');console.log(JSON.stringify({cases:36,minimumWidth:44,centralMutation:48,passed:true}));
}finally{await browser?.close();server.kill();}
