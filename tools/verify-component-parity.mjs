// Compare equivalent live product adapters. Brand accent colors and domain-specific galleries remain separate.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {chromium}=createRequire(path.resolve(root,'../Q-Atelier/package.json'))('playwright');
const server=spawn(process.execPath,[root+'/tools/serve-component-workbench.mjs'],{cwd:root,env:{...process.env,QD_AUDIT_PORT:'4820'},windowsHide:true,stdio:['ignore','pipe','pipe']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(new Error('Comparison server exited '+code)));});
const browser=await chromium.launch({channel:'msedge',headless:true});
const groups=[],failures=[];
try{
 for(const theme of ['light','dark'])for(const width of [375,412,1440]){
  const rows=[];
  for(const product of ['atelier','maison','carnet']){
   const context=await browser.newContext({viewport:{width,height:1000},hasTouch:width<500,isMobile:width<500,reducedMotion:'reduce'});
   const page=await context.newPage();
   await page.goto('http://127.0.0.1:4820/preview/components/'+product+'/?theme='+theme+'&view=matched');
   await page.getByTestId('comparison-matrix').waitFor();await page.evaluate(()=>document.fonts.ready);
   const values=await page.evaluate(()=>{
    const roles={primary:'[data-testid=parity-primary] button',secondary:'[data-testid=parity-secondary] button',disabledButton:'[data-testid=parity-disabled-button] button',input:'[data-testid=parity-input] input',disabledInput:'[data-testid=parity-disabled-input] input',select:'[data-testid=parity-select] select',textarea:'[data-testid=parity-textarea] textarea',tag:'[data-testid=parity-tag] .qd-tag',card:'[data-testid=parity-card] .qd-card,[data-testid=parity-card] .qd-panel',tableHeader:'[data-testid=parity-table] th,[data-testid=parity-table] [role=columnheader]',tableCell:'[data-testid=parity-table] td,[data-testid=parity-table] [role=cell]',progress:'[data-testid=parity-progress] .qd-progress'};
    const properties=['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','borderRadius','paddingTop','paddingRight','paddingBottom','paddingLeft'];
    const result={};for(const [role,selector]of Object.entries(roles)){const el=document.querySelector(selector);if(!el)throw new Error('Missing actual adapter '+role);const s=getComputedStyle(el),r=el.getBoundingClientRect();result[role]=Object.fromEntries(properties.filter(p=>role!=='card'||!p.startsWith('padding')).map(p=>[p,s[p]]));if(!['card','tableCell','tableHeader'].includes(role))result[role].height=r.height;if(role==='card'){const content=el.querySelector('.qd-card-title').getBoundingClientRect();result[role].contentInsetTop=content.top-r.top;result[role].contentInsetLeft=content.left-r.left;result[role].height=r.height;}}
    result.disabledInput.color=getComputedStyle(document.querySelector(roles.disabledInput)).color;
    result.disabledInput.backgroundColor=getComputedStyle(document.querySelector(roles.disabledInput)).backgroundColor;
    result.fieldGroups={};
    for(const name of ['input','error','disabled-input','select','textarea'])result.fieldGroups[name]=document.querySelector('[data-testid=parity-'+name+']').getBoundingClientRect().height;
    const error=document.querySelector('[data-testid=parity-error] .qd-field-error'),errorStyle=getComputedStyle(error);
    result.fieldError=Object.fromEntries(['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','color'].map(p=>[p,errorStyle[p]]));
    result.fieldError.gap=error.getBoundingClientRect().top-document.querySelector('[data-testid=parity-error] input').getBoundingClientRect().bottom;
    return {roles:result,overflow:document.documentElement.scrollWidth>innerWidth+1};
   });
   if(values.overflow)failures.push({product,theme,width,issue:'Horizontal overflow'});
   await page.evaluate(()=>{document.documentElement.style.setProperty('--qd-field-gap','8px');document.documentElement.style.setProperty('--qd-textarea-min-height','120px');});
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const mutation=await page.evaluate(()=>({textarea:document.querySelector('[data-testid=parity-textarea] textarea').getBoundingClientRect().height,input:document.querySelector('[data-testid=parity-input] input').getBoundingClientRect().height,nameField:document.querySelector('[data-testid=parity-input]').getBoundingClientRect().height,errorGap:document.querySelector('[data-testid=parity-error] .qd-field-error').getBoundingClientRect().top-document.querySelector('[data-testid=parity-error] input').getBoundingClientRect().bottom}));
   if(mutation.textarea!==120||mutation.input!==44||Math.abs(mutation.nameField-values.roles.fieldGroups.input-4)>0.1||Math.abs(mutation.errorGap-8)>0.1)failures.push({product,theme,width,issue:'Field token propagation',mutation});
   await page.getByTestId('parity-open-dialog').locator('button').click();await page.getByRole('dialog').waitFor();
   const overlay=await page.getByRole('dialog').evaluate(e=>{const s=getComputedStyle(e);return {radius:s.borderRadius,font:s.fontSize};});
   await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
   rows.push({product,...values,mutation,overlay});await context.close();
  }
  const reference=rows[0];
  for(const row of rows.slice(1))for(const [role,styles]of Object.entries(reference.roles))for(const [property,expected]of Object.entries(styles)){
   const actual=row.roles[role][property];const equal=typeof expected==='number'?Math.abs(actual-expected)<0.1:actual===expected;
   if(!equal)failures.push({theme,width,product:row.product,role,property,expected,actual});
  }
  for(const row of rows.slice(1))if(JSON.stringify(row.overlay)!==JSON.stringify(reference.overlay))failures.push({theme,width,product:row.product,role:'dialog',expected:reference.overlay,actual:row.overlay});
  groups.push({theme,width,products:rows});
 }
}finally{await browser.close();server.kill();}
fs.writeFileSync(root+'/reviews/component-parity-results.json',JSON.stringify({scope:'Equal-role live adapters, 18 product/theme/viewport scenarios. Accent colors, content-specific layouts and business behavior are outside this parity check.',groups,failures},null,2)+'\n');
console.log(JSON.stringify({scenarios:18,differences:failures.length,failures:failures.slice(0,45)},null,2));
if(failures.length)process.exitCode=1;
