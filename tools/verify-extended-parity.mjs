import fs from 'node:fs';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {chromium}=createRequire(path.resolve(root,'../Q-Atelier/package.json'))('playwright');
const before=process.argv.includes('--before');
const server=spawn(process.execPath,[root+'/tools/serve-component-workbench.mjs'],{cwd:root,env:{...process.env,QD_AUDIT_PORT:'4823'},windowsHide:true,stdio:['ignore','pipe','pipe']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const browser=await chromium.launch({channel:'msedge',headless:true});
const groups=[],failures=[];
try{
 for(const theme of ['light','dark'])for(const width of [375,412,1440])for(const touch of width<500?[true,false]:[false]){
  const rows=[];
  for(const product of ['atelier','maison','carnet']){
   const context=await browser.newContext({viewport:{width,height:1000},isMobile:width<500&&touch,hasTouch:touch,reducedMotion:'no-preference'});
   const page=await context.newPage();await page.goto(`http://127.0.0.1:4823/preview/components/${product}/?theme=${theme}&view=matched`);
   await page.getByTestId('parity-empty').waitFor();await page.evaluate(()=>document.fonts.ready);
   const measure=()=>page.evaluate(()=>{
    const style=e=>{if(!e)throw Error('Missing rendered role');const s=getComputedStyle(e),r=e.getBoundingClientRect();return {...Object.fromEntries(['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','borderRadius','paddingTop','paddingRight','paddingBottom','paddingLeft'].map(k=>[k,s[k]])),height:r.height};};
    const result={};
    for(const [name,compact] of [['empty',false],['empty-compact',true]]){
     const host=document.querySelector(`[data-testid=parity-${name}]`),panel=host.firstElementChild;
     const title=panel.querySelector('.qd-empty-title')||panel.firstElementChild.firstElementChild;
     const desc=panel.querySelector('.qd-empty-desc')||title.nextElementSibling;
     result[name]=style(panel);result[name+'-title']=style(title);result[name+'-description']=style(desc);
     result[name+'-gap']={gap:desc.getBoundingClientRect().top-title.getBoundingClientRect().bottom,maxWidth:getComputedStyle(desc).maxWidth};
    }
    result.choice=style(document.querySelector('[data-testid=parity-choice] button'));
    result.selectedChoice=style(document.querySelector('[data-testid=parity-choice-selected] button'));
    const tabs=document.querySelectorAll('[data-testid=parity-tabs] .qd-tab');result.activeTab=style(tabs[0]);result.inactiveTab=style(tabs[1]);
    const skeleton=document.querySelector('[data-testid=parity-skeleton] .qd-skeleton'),s=getComputedStyle(skeleton);
    result.skeleton={radius:s.borderRadius,height:skeleton.getBoundingClientRect().height,duration:s.animationDuration,timing:s.animationTimingFunction,iterations:s.animationIterationCount};
    for(const name of ['empty-action','empty-title-action']){
     const host=document.querySelector(`[data-testid=parity-${name}]`);if(!host)continue;
     const action=host.querySelector('.qd-empty-actions'),previous=action.previousElementSibling;
     result[name]={gap:action.getBoundingClientRect().top-previous.getBoundingClientRect().bottom};
    }
    const hints=document.querySelector('[data-testid=parity-empty-hints] .qd-empty-hints');
    if(hints)result.emptyHints={gap:hints.getBoundingClientRect().top-hints.previousElementSibling.getBoundingClientRect().bottom};
    const row=document.querySelector('[data-testid=selection-rows] .qd-selection-row');
    if(row){const s=getComputedStyle(row),remove=document.querySelector('[data-testid=selection-rows] .qd-control-icon');result.selectionRow={height:row.getBoundingClientRect().height,paddingLeft:s.paddingLeft,removeHeight:remove.getBoundingClientRect().height,removeWidth:remove.getBoundingClientRect().width};}
    return result;
   });
   const baseline=await measure();
   if(width<500&&baseline.choice.height<44)failures.push({product,theme,width,touch,kind:'mobile-target',expected:44,actual:baseline.choice.height});
   if(baseline.selectionRow&&Object.entries(baseline.selectionRow).filter(([k])=>k!=='paddingLeft').some(([,v])=>v<44))failures.push({product,theme,width,touch,kind:'person-selection-target',expected:44,actual:baseline.selectionRow});
   await page.evaluate(()=>{
    const r=document.documentElement.style;
    for(const [n,v]of Object.entries({'--qd-font-weight-semibold':'650','--qd-empty-padding-y':'80px','--qd-empty-padding-y-compact':'24px','--qd-empty-title-size':'24px','--qd-empty-title-size-compact':'18px','--qd-empty-description-size':'14px','--qd-empty-description-leading':'1.8','--qd-empty-description-max-width':'420px','--qd-empty-description-gap':'12px','--qd-skeleton-duration':'2.4s','--qd-tab-padding-x':'22px','--qd-choice-padding-x':'18px','--qd-empty-action-gap':'20px','--qd-empty-description-action-gap':'24px','--qd-empty-action-hint-gap':'20px'}))r.setProperty(n,v);
   });
   await page.evaluate(()=>{document.documentElement.style.setProperty('--qd-selection-row-height','52px');document.documentElement.style.setProperty('--qd-selection-row-padding-x','20px');});
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const mutation=await measure();rows.push({product,baseline,mutation});
   if(!before){
    const checks=[['empty','paddingTop','80px'],['empty-compact','paddingTop','24px'],['empty-title','fontSize','24px'],['empty-compact-title','fontSize','18px'],['empty-description','fontSize','14px'],['empty-description','lineHeight','25.2px'],['empty-gap','maxWidth','420px'],['empty-gap','gap',12],['skeleton','duration','2.4s'],['activeTab','fontWeight','650'],['selectedChoice','fontWeight','650'],['activeTab','paddingLeft','22px'],['choice','paddingLeft','18px']];
    for(const[role,property,expected]of checks){const actual=mutation[role][property];if(actual!==expected)failures.push({product,theme,width,kind:'propagation',role,property,expected,actual});}
    for(const[role,expected]of [['empty-action',24],['empty-title-action',20],['emptyHints',20]])if(mutation[role]&&Math.abs(mutation[role].gap-expected)>0.1)failures.push({product,theme,width,kind:'propagation',role,expected,actual:mutation[role].gap});
    if(mutation.selectionRow&&(mutation.selectionRow.height!==52||mutation.selectionRow.paddingLeft!=='20px'))failures.push({product,theme,width,kind:'person-selection-propagation',actual:mutation.selectionRow});
   }
   await page.emulateMedia({reducedMotion:'reduce'});
   const reduced=await page.locator('[data-testid=parity-skeleton] .qd-skeleton').evaluate(e=>getComputedStyle(e).animationName);
   if(reduced!=='none')failures.push({product,theme,width,kind:'reduced-motion',expected:'none',actual:reduced});
   await context.close();
  }
  for(const row of rows.slice(1))for(const[role,styles]of Object.entries(rows[0].baseline))for(const[property,expected]of Object.entries(styles)){
   if(!row.baseline[role])continue;
   const actual=row.baseline[role][property];if(typeof expected==='number'?Math.abs(expected-actual)>0.1:expected!==actual)failures.push({product:row.product,theme,width,kind:'parity',role,property,expected,actual});
  }
  groups.push({theme,width,touch,products:rows});
 }
}finally{await browser.close();server.kill();}
fs.writeFileSync(root+`/reviews/extended-parity-${before?'before':'results'}.json`,JSON.stringify({scope:'Actual product empty-state renderers, page-tab and choice adapters, loading recipes. Mobile widths are tested with both touch and fine pointers. This does not certify all business screens.',groups,failures},null,2)+'\n');
console.log(JSON.stringify({scenarios:groups.length*3,differences:failures.length,failures:failures.slice(0,28)},null,2));
if(!before&&failures.length)process.exitCode=1;
