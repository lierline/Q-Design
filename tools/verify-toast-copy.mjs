// Render the actual product ToastProvider with synthetic, non-persistent text.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {chromium}=createRequire(path.resolve(root,'../Q-Atelier/package.json'))('playwright');
const port=4830;
const server=spawn(process.execPath,[root+'/tools/serve-component-workbench.mjs'],{cwd:root,env:{...process.env,QD_AUDIT_PORT:String(port)},windowsHide:true,stdio:['ignore','pipe','pipe']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error('Preview server exited '+code)));});
const browser=await chromium.launch({channel:'msedge',headless:true});
const cases=[],failures=[],negativeControls=[];
const measure=async page=>page.locator('.qd-toast').evaluate(e=>{
 const message=e.querySelector('[data-title]')??e.querySelector(':scope > span:not([aria-hidden])')??e.querySelector(':scope > div > div:last-child'),style=getComputedStyle(message),box=message.getBoundingClientRect(),toastBox=e.getBoundingClientRect();
 const container=e.querySelector('[data-content]')??e.querySelector(':scope > span:not([aria-hidden])')??e.querySelector(':scope > div');
 const text=message.firstChild,words=[];
 for(const m of message.textContent.matchAll(/\S+/g)){
  const range=document.createRange();range.setStart(text,m.index);range.setEnd(text,m.index+m[0].length);
  const rects=[...range.getClientRects()];words.push({text:m[0],lines:new Set(rects.map(r=>Math.round(r.top))).size});
 }
 const stackStyle=getComputedStyle(e.parentElement),close=e.querySelector('button'),closeStyle=getComputedStyle(close),closeBox=close.getBoundingClientRect();
 return {closeRadius:closeStyle.borderRadius,closeColor:closeStyle.color,closeBackground:closeStyle.backgroundColor,closeInside:closeBox.left>=toastBox.left-1&&closeBox.right<=toastBox.right+1&&closeBox.top>=toastBox.top-1&&closeBox.bottom<=toastBox.bottom+1,logicalToastWidth:parseFloat(getComputedStyle(e).width),stackTop:parseFloat(stackStyle.top),stackRight:parseFloat(stackStyle.right),message:message.textContent,wordBreak:style.wordBreak,overflowWrap:style.overflowWrap,messageWidth:box.width,containerMinWidth:getComputedStyle(container).minWidth,scrollWidth:message.scrollWidth,clientWidth:message.clientWidth,messageLeft:box.left,messageRight:box.right,toastLeft:toastBox.left,toastRight:toastBox.right,viewportWidth:innerWidth,words};
});
try{
 for(const product of ['atelier','maison','carnet'])for(const theme of ['light','dark'])for(const width of [1280,390,375]){
  const page=await browser.newPage({viewport:{width,height:844}});
  await page.goto(`http://127.0.0.1:${port}/preview/components/${product}/?theme=${theme}`);
  await page.evaluate(()=>document.fonts.ready);
  for(const kind of ['korean','identifier']){
   await page.getByRole('button',{name:kind==='korean'?'한국어 알림 줄바꿈':'긴 식별자 알림',exact:true}).click();
   await page.locator('.qd-toast').waitFor({state:'visible'});
   const measured=await measure(page);cases.push({product,theme,width,kind,...measured});
   if(measured.wordBreak!=='keep-all'||measured.overflowWrap!=='break-word'||measured.containerMinWidth!=='0px')failures.push({product,theme,width,kind,issue:'central-copy-token-not-applied'});
   if(Math.abs(measured.logicalToastWidth-Math.min(360,width-40))>1||measured.stackTop!==20||measured.stackRight!==20)failures.push({product,theme,width,kind,issue:'shared-toast-width-or-inset-not-applied'});
   if(product==='maison'&&(!measured.closeInside||measured.closeBackground!=='rgba(0, 0, 0, 0)'||measured.closeRadius!=='10px'))failures.push({product,theme,width,kind,issue:'sonner-default-dismiss-style-bypasses-shared-rule'});
   if(measured.scrollWidth>measured.clientWidth+1||measured.messageRight>measured.toastRight+1||measured.messageLeft<measured.toastLeft-1||measured.toastRight>width+1||measured.toastLeft< -1)failures.push({product,theme,width,kind,issue:'message-or-toast-overflow'});
   if(kind==='korean'&&measured.words.some(w=>w.lines>1))failures.push({product,theme,width,kind,issue:'korean-word-split',words:measured.words});
   if(kind==='identifier'&&!measured.words.some(w=>w.lines>1))failures.push({product,theme,width,kind,issue:'long-identifier-not-wrapped'});
   if(kind==='korean'&&theme==='dark'&&width===1280){
    await page.evaluate(()=>document.documentElement.style.setProperty('--qd-copy-word-break','normal'));
    await page.evaluate(()=>document.documentElement.style.setProperty('--qd-copy-overflow-wrap','anywhere'));
    await page.evaluate(()=>document.documentElement.style.setProperty('--qd-space-0','8px'));
    await page.evaluate(()=>document.documentElement.style.setProperty('--qd-toast-max-width','280px'));
    await page.evaluate(()=>document.documentElement.style.setProperty('--qd-space-5','24px'));
    await page.evaluate(()=>document.documentElement.style.setProperty('--qd-radius-control','6px'));
    const control=await measure(page);negativeControls.push({product,...control});
    if(control.wordBreak!=='normal'||control.overflowWrap!=='anywhere'||control.containerMinWidth!=='8px'||(product==='atelier'&&!control.words.some(w=>w.lines>1)))failures.push({product,issue:'central-mutation-negative-control-did-not-change-word-wrapping'});
    if(Math.abs(control.logicalToastWidth-280)>1||control.stackTop!==24||control.stackRight!==24)failures.push({product,issue:'central-layout-mutation-did-not-propagate'});
    if(product==='maison'&&control.closeRadius!=='6px')failures.push({product,issue:'central-dismiss-radius-mutation-did-not-propagate'});
    await page.evaluate(()=>document.documentElement.style.removeProperty('--qd-copy-word-break'));
    await page.evaluate(()=>document.documentElement.style.removeProperty('--qd-copy-overflow-wrap'));
    await page.evaluate(()=>document.documentElement.style.removeProperty('--qd-space-0'));
    await page.evaluate(()=>document.documentElement.style.removeProperty('--qd-toast-max-width'));
    await page.evaluate(()=>document.documentElement.style.removeProperty('--qd-space-5'));
    await page.evaluate(()=>document.documentElement.style.removeProperty('--qd-radius-control'));
   }
   await page.locator('.qd-toast button').click();
   await page.locator('.qd-toast').waitFor({state:'detached'});
  }
  await page.close();
 }
}finally{await browser.close();server.kill();}
const report={scope:'Actual Q-Atelier ToastProvider, Q-Maison Sonner adapter and Q-Carnet Toasts, central copy tokens, synthetic Korean text and long identifiers. No business messages, timers, user accounts or other screen states are certified.',cases,negativeControls,failures};
fs.writeFileSync(root+'/reviews/toast-copy-browser-results.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({cases:cases.length,centralMutationVerified:negativeControls.length===3&&negativeControls.every(c=>c.wordBreak==='normal'&&c.overflowWrap==='anywhere'),failures},null,2));
if(failures.length)process.exitCode=1;
