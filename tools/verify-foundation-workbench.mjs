import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { spawn } from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const {chromium}=createRequire(join(root,'../Q-Atelier/package.json'))('playwright');
const out=join(root,'preview/screens/foundation');mkdirSync(out,{recursive:true});
process.env.TEMP=join(root,'../tmp/qd-component-workbench/browser');process.env.TMP=process.env.TEMP;
const port=4820;
const server=spawn(process.execPath,[join(root,'tools/serve-component-workbench.mjs')],{cwd:root,env:{...process.env,QD_AUDIT_PORT:String(port)},windowsHide:true,stdio:['ignore','pipe','pipe']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(new Error(`Server exit ${code}`)));});
const browser=await chromium.launch({channel:'msedge',headless:true});
const failures=[],findings=[],editorFindings=[];
const check=(condition,message)=>{if(!condition)failures.push(message);};
const contrast=(a,b)=>{
 const lightness=color=>{const match=/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(color);if(!match||match[4]&&Number(match[4])!==1)throw new Error('Opaque RGB outline evidence required: '+color);return match.slice(1,4).map(Number).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);};
 const x=lightness(a),y=lightness(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
};
const previewCss='body{overflow:hidden}.qd-audit-shell{visibility:hidden}[data-testid="foundation-auth"]{display:block;visibility:visible;position:fixed!important;inset:0!important;z-index:20000;width:100%;height:100dvh;max-width:none!important;margin:0!important;overflow:auto;background:var(--qd-auth-background)}[data-testid="foundation-auth"] *{visibility:visible}';
const changes={
  '--qd-auth-title-size':'42px','--qd-auth-card-padding':'32px',
  '--qd-auth-background':'rgb(18, 52, 86)','--qd-auth-surface':'rgb(52, 86, 120)',
  '--qd-control-size':'15px','--qd-radius':'14px',
  '--qd-font-family-ui':'monospace','--qd-font-family-mono':'monospace',
  '--qd-background-ribbon-primary-opacity':'.2',
};
try{
 for(const product of ['atelier','maison','carnet'])for(const theme of ['light','dark'])for(const width of [375,412,1440]){
  const key=`${product}-${theme}-${width}`;
  const context=await browser.newContext({viewport:{width,height:900},isMobile:width<500,hasTouch:width<500,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/preview/components/${product}/?theme=${theme}`);
  await page.getByTestId('foundation-auth').waitFor({state:'attached'});await page.evaluate(()=>document.fonts.ready);
  await page.addStyleTag({content:previewCss});
  const measure=()=>page.evaluate(()=>{
   const auth=document.querySelector('[data-testid=foundation-auth]'),title=auth.querySelector('[data-testid=foundation-auth-title]'),input=auth.querySelector('[data-testid=foundation-auth-input],#fixture-auth-email'),card=auth.querySelector('.qa-auth-card,.qm-auth-card,.login-card');
   const style=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return{font:s.fontSize,family:s.fontFamily,padding:s.padding,bg:s.backgroundColor,border:s.borderColor,radius:s.borderRadius,x:r.x,right:r.right,width:r.width,height:r.height};};
   const ribbon=auth.querySelector('.qa-ribbon-layer-1,.qm-ribbon-1,.carnet-ribbon-primary');
   return{auth:style(auth),title:style(title),input:style(input),card:style(card),ribbonOpacity:ribbon?getComputedStyle(ribbon).opacity:null,scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,motion:[...auth.querySelectorAll('*')].flatMap(e=>{const s=getComputedStyle(e);return s.animationName!=='none'&&parseFloat(s.animationDuration)>.001?[{name:s.animationName,duration:s.animationDuration}]:[];})};
  });
  const before=await measure();check(before.scrollWidth<=width+1,`${key}: horizontal overflow ${before.scrollWidth}`);
  check(contrast(before.input.border,before.input.bg)>=3,`${key}: auth input outline has less than 3:1 contrast`);
  check(before.input.width>100&&before.input.x>=0&&before.input.right<=width+1,`${key}: auth field outside viewport`);
  check(before.input.height>=43.5,`${key}: auth field below44`);
  check(!before.motion.length,`${key}: reduced motion still animates ${JSON.stringify(before.motion)}`);
  // Capture before mutation, after all interaction assertions in this context.
  await page.screenshot({path:join(out,`${key}.png`)});
  await page.evaluate(values=>{for(const [name,value]of Object.entries(values))document.documentElement.style.setProperty(name,value);},changes);
  await page.waitForFunction(()=>{
    const auth=document.querySelector('[data-testid=foundation-auth]'),card=auth.querySelector('.qa-auth-card,.qm-auth-card,.login-card'),title=auth.querySelector('[data-testid=foundation-auth-title]'),input=auth.querySelector('[data-testid=foundation-auth-input],#fixture-auth-email');
    return getComputedStyle(input).fontSize==='15px'&&getComputedStyle(card).padding==='32px'&&getComputedStyle(title).fontSize==='42px'&&getComputedStyle(auth).backgroundColor==='rgb(18, 52, 86)';
  },null,{timeout:2500}).catch(()=>{});
  const after=await measure();
  check(after.auth.bg==='rgb(18, 52, 86)',`${key}: auth background does not propagate ${after.auth.bg}`);
  check(after.card.bg==='rgb(52, 86, 120)',`${key}: auth surface does not propagate ${after.card.bg}`);
  check(after.card.padding==='32px',`${key}: auth card spacing does not propagate ${after.card.padding}`);
  check(after.title.font==='42px',`${key}: auth title does not propagate ${after.title.font}`);
  check(after.input.font==='15px'&&after.input.radius==='14px',`${key}: auth control does not propagate ${JSON.stringify(after.input)}`);
  check(after.input.family==='monospace',`${key}: auth font family does not propagate ${after.input.family}`);
  check(after.ribbonOpacity==='0.2',`${key}: ribbon opacity does not propagate ${after.ribbonOpacity}`);
  check(!errors.length,`${key}: runtime ${errors.join('; ')}`);
  findings.push({key,before,after,errors});console.log(`${key}: foundation checked`);await context.close();
 }
 const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce'}),page=await context.newPage();
 await page.goto(`http://127.0.0.1:${port}/preview/components.html`);
 await page.waitForFunction(()=>document.querySelector('#parameter').options.length>100);
 await page.selectOption('#mode','auth');
 for(const frame of page.frames().filter(f=>f.parentFrame()))await frame.getByTestId('foundation-auth').waitFor();
 for(const frame of page.frames().filter(f=>f.parentFrame()))check(await frame.evaluate(()=>!document.documentElement.style.getPropertyValue('--qd-radius')&&!document.documentElement.style.getPropertyValue('--qd-control-size')),'Editor: initial load masks canonical defaults');
 await page.screenshot({path:join(out,'three-auth-products.png'),fullPage:true});
 await page.locator('details > summary').click();
 await page.selectOption('#parameter','--qd-auth-card-padding');await page.fill('#parameter-value','36px');await page.click('#parameter-apply');
 for(const frame of page.frames().filter(f=>f.parentFrame())){
  await frame.waitForFunction(()=>getComputedStyle(document.querySelector('[data-testid="foundation-auth"] .qa-auth-card,[data-testid="foundation-auth"] .qm-auth-card,[data-testid="foundation-auth"] .login-card')).padding==='36px',null,{timeout:2500}).catch(()=>{});
  const measurement=await frame.evaluate(()=>({url:location.pathname,variable:getComputedStyle(document.documentElement).getPropertyValue('--qd-auth-card-padding').trim(),cards:[...document.querySelectorAll('.qa-auth-card,.qm-auth-card,.login-card')].map(card=>({className:card.className,inAuth:Boolean(card.closest('[data-testid="foundation-auth"]')),padding:getComputedStyle(card).padding,variable:getComputedStyle(card).getPropertyValue('--qd-auth-card-padding').trim()}))}));
  editorFindings.push(measurement);
  check(measurement.cards[0]?.padding==='36px',`Editor: card parameter did not propagate ${JSON.stringify(measurement)}`);
 }
 await page.click('#reset');
 for(const frame of page.frames().filter(f=>f.parentFrame()))check(await frame.evaluate(()=>['--qd-auth-card-padding','--qd-radius','--qd-control-size'].every(key=>!document.documentElement.style.getPropertyValue(key))),'Editor: reset retained override');
 // A future canonical default must remain visible both on load and after reset.
 for(const frame of page.frames().filter(f=>f.parentFrame()))await frame.addStyleTag({content:':root{--qd-radius:17px;--qd-control-size:16px}'});
 await page.selectOption('#theme','dark');
 check(await page.inputValue('#radius')==='17'&&await page.inputValue('#type')==='16','Editor: controls ignore changed canonical defaults');
 await page.locator('#radius').fill('12');await page.locator('#radius').dispatchEvent('input');
 await page.click('#reset');
 for(const frame of page.frames().filter(f=>f.parentFrame()))check(await frame.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--qd-radius').trim())==='17px','Editor: reset masks changed canonical default');
 await context.close();
 const offlineContext=await browser.newContext({viewport:{width:375,height:812},offline:true,reducedMotion:'reduce'}),offlinePage=await offlineContext.newPage();
 const offlineHTML=readFileSync(join(root,'dist/q-design.offline.atelier.html'),'utf8');
 // The service worker precaches this same unchanged official icon; supply it locally.
 const offlineIcon=readFileSync(join(root,'../Q-Atelier/public/icon-192.png')).toString('base64');
 await offlinePage.setContent(offlineHTML.replace('/icon-192.png?v=4',`data:image/png;base64,${offlineIcon}`));
 const offline=await offlinePage.evaluate(()=>({width:document.documentElement.scrollWidth,buttonHeight:document.querySelector('.qd-offline-action')?.getBoundingClientRect().height,externalCSS:document.querySelectorAll('link[rel="stylesheet"]').length}));
 check(offline.width<=375&&offline.buttonHeight>=44&&offline.externalCSS===0,'Offline: viewport, action size or self-contained stylesheet failed');
 await offlinePage.screenshot({path:join(out,'atelier-offline-375.png')});await offlineContext.close();
}catch(error){failures.push(error.stack);}finally{await browser.close();server.kill();}
writeFileSync(join(out,'results.json'),JSON.stringify({findings,editorFindings,failures},null,2)+'\n');
console.log(JSON.stringify({scenarios:findings.length,failures},null,2));if(failures.length)process.exitCode=1;
