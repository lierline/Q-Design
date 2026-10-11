// Runtime mutation audit of actual product adapters, independent of default-value parity.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {buildPalettes,readInputs} from './build-palette.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {chromium}=createRequire(path.resolve(root,'../Q-Atelier/package.json'))('playwright');
const server=spawn(process.execPath,[root+'/tools/serve-component-workbench.mjs'],{cwd:root,env:{...process.env,QD_AUDIT_PORT:'4821'},windowsHide:true,stdio:['ignore','pipe','pipe']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(new Error('Server exited '+code)));});
const browser=await chromium.launch({channel:'msedge',headless:true});
const probes=[
 ['--qd-radius','17px',[['primary','borderRadius','17px'],['input','borderRadius','17px'],['card','borderRadius','17px'],['dialog','borderRadius','17px']]],
 ['--qd-control-height','52px',[['primary','minHeight','52px'],['input','minHeight','52px']]],
 ['--qd-control-size','17px',[['primary','fontSize','17px'],['input','fontSize','17px'],['select','fontSize','17px']]],
 ['--qd-caption-size','15px',[['label','fontSize','15px'],['tag','fontSize','15px'],['error','fontSize','15px'],['description','fontSize','15px']]],
 ['--qd-section-size','19px',[['cardTitle','fontSize','19px']]],
 ['--qd-font-family-ui','monospace',[['primary','fontFamily','monospace'],['input','fontFamily','monospace'],['tableCell','fontFamily','monospace']]],
 ['--qd-font-family-mono','serif',[['label','fontFamily','serif']]],
 ['--qd-font-weight-medium','550',[['primary','fontWeight','550'],['label','fontWeight','550']]],
 ['--qd-font-weight-semibold','650',[['cardTitle','fontWeight','650']]],
 ['--qd-space-unit','5px',[['card','contentInsetLeft',31]]],
 ['--qd-field-gap','8px',[['error','errorGap',8]]],
 ['--qd-textarea-min-height','120px',[['textarea','height',120]]],
 ['--qd-select-end-padding','40px',[['select','paddingRight','40px']]],
 ['--qd-table-size','16px',[['tableCell','fontSize','16px']]],
 ['--qd-table-pad-y','17px',[['tableCell','paddingTop','17px'],['tableCell','paddingBottom','17px']]],
 ['--qd-table-pad-x','19px',[['tableCell','paddingLeft','19px'],['tableHeader','paddingLeft','19px']]],
 ['--qd-progress-height','9px',[['progress','height',9]]],
 ['--qd-dialog-width','620px',[['dialog','maxWidth','620px']]],
 ['--qd-overlay-padding','32px',[['dialogPadding','paddingTop','32px']]],
 ['--qd-overlay-title-size','23px',[['dialogTitle','fontSize','23px']]],
];
const scenarios=[],failures=[],paletteScenarios=[];
try{
 for(const theme of ['light','dark'])for(const width of [375,1440])for(const product of ['atelier','maison','carnet']){
  const context=await browser.newContext({viewport:{width,height:1000},hasTouch:width<500,isMobile:width<500,reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.goto(`http://127.0.0.1:4821/preview/components/${product}/?theme=${theme}&view=matched`);
  await page.getByTestId('comparison-matrix').waitFor();await page.evaluate(()=>document.fonts.ready);
  await page.getByTestId('parity-open-dialog').locator('button').click();await page.getByRole('dialog').waitFor();
  const results=[];
  for(const [token,value,assertions]of probes){
   const measured=await page.evaluate(async({token,value,assertions})=>{
    const selectors={primary:'[data-testid=parity-primary] button',input:'[data-testid=parity-input] input',select:'[data-testid=parity-select] select',textarea:'[data-testid=parity-textarea] textarea',label:'[data-testid=parity-input] label',error:'[data-testid=parity-error] .qd-field-error',tag:'[data-testid=parity-tag] .qd-tag',card:'[data-testid=parity-card] .qd-card,[data-testid=parity-card] .qd-panel',cardTitle:'[data-testid=parity-card] .qd-card-title',description:'[data-testid=parity-card] .qd-card-description',tableHeader:'[data-testid=parity-table] th,[data-testid=parity-table] [role=columnheader]',tableCell:'[data-testid=parity-table] td,[data-testid=parity-table] [role=cell]',progress:'[data-testid=parity-progress] .qd-progress',dialog:'[role=dialog]',dialogPadding:'[role=dialog][data-layout=sections] > .qd-dialog-body,[role=dialog]:not([data-layout=sections])',dialogTitle:'[role=dialog] .qd-dialog-title'};
    const root=document.documentElement,previous=root.style.getPropertyValue(token);
    root.style.setProperty(token,value);
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const result=assertions.map(([role,property,expected])=>{
     const el=document.querySelector(selectors[role]);if(!el)return{role,property,expected,actual:null};
     const s=getComputedStyle(el),r=el.getBoundingClientRect();let actual=s[property];
     if(property==='height')actual=r.height;
     if(property==='contentInsetLeft')actual=el.querySelector('.qd-card-title').getBoundingClientRect().left-r.left;
     if(property==='errorGap')actual=r.top-document.querySelector('[data-testid=parity-error] input').getBoundingClientRect().bottom;
     return{role,property,expected,actual};
    });
    if(previous)root.style.setProperty(token,previous);else root.style.removeProperty(token);
    return result;
   },{token,value,assertions});
   for(const item of measured){item.pass=typeof item.expected==='number'?Math.abs(item.actual-item.expected)<0.1:item.actual===item.expected;if(!item.pass)failures.push({product,theme,width,token,...item});}
   results.push({token,value,assertions:measured});
  }
  scenarios.push({product,theme,width,results});
  // Exercise the editable palette generator, not just qd aliases in the preview.
  const paletteInputs=structuredClone(readInputs(root));
  const colors=theme==='dark'?{bg:'#080808',surface:'#101010',text:'#ffffff'}:{bg:'#ffffff',surface:'#fafafa',text:'#111111'};
  for(const [role,color]of Object.entries(colors))paletteInputs[2].shared[theme]['--qa-'+role]=color;
  await page.addStyleTag({content:buildPalettes(...paletteInputs)[product]});
  const rgb=hex=>'rgb('+[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(', ')+')';
  const paletteExpected={background:rgb(colors.bg),surface:rgb(colors.surface),text:rgb(colors.text)};
  // Theme transitions are allowed; compare their settled result, not the first frame.
  await page.waitForFunction(expected=>{
   const input=getComputedStyle(document.querySelector('[data-testid=parity-input] input'));
   return getComputedStyle(document.body).backgroundColor===expected.background&&input.backgroundColor===expected.surface&&input.color===expected.text;
  },paletteExpected,{timeout:1500}).catch(()=>{});
  const paletteResult=await page.evaluate(async()=>{
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   const input=getComputedStyle(document.querySelector('[data-testid=parity-input] input'));
   return{background:getComputedStyle(document.body).backgroundColor,surface:input.backgroundColor,text:input.color};
  });
  for(const [role,expected]of Object.entries(paletteExpected))if(paletteResult[role]!==expected)failures.push({product,theme,width,token:'generated-shared-palette',role,expected,actual:paletteResult[role]});
  paletteScenarios.push({product,theme,width,colors,expected:paletteExpected,actual:paletteResult});
  await context.close();
 }
}finally{await browser.close();server.kill();}
const checks=scenarios.flatMap(s=>s.results.flatMap(r=>r.assertions)).length;
fs.writeFileSync(root+'/reviews/design-propagation-results.json',JSON.stringify({scope:'20 shared parameter mutations and generated shared background/surface/text palette on actual equal-role product adapters, 12 product/theme/viewport scenarios. Authentication is audited separately. This is not full business-screen coverage.',checks,paletteChecks:paletteScenarios.length*3,scenarios,paletteScenarios,failures},null,2)+'\n');
console.log(JSON.stringify({scenarios:scenarios.length,checks,paletteChecks:paletteScenarios.length*3,failures:failures.length,uniqueFailures:[...new Map(failures.map(f=>[`${f.product}:${f.token}:${f.role}:${f.property}`,f])).values()].map(({theme,width,...f})=>f)},null,2));
if(failures.length)process.exitCode=1;
