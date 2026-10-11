import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {NATIVE_OFFLINE} from './build-native-offline.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {chromium}=createRequire(path.resolve(root,'../Q-Atelier/package.json'))('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[],failures=[];
try{
 for(const config of NATIVE_OFFLINE)for(const theme of ['light','dark'])for(const width of [320,375,412])for(const largeText of [false,true]){
  const page=await browser.newPage({viewport:{width,height:812},colorScheme:theme});
  await page.setContent(fs.readFileSync(path.join(root,`dist/q-design.native-offline.${config.product}.html`),'utf8'));
  if(largeText)await page.evaluate(()=>{
   for(const element of document.querySelectorAll('h1,p,a')){const size=parseFloat(getComputedStyle(element).fontSize);element.style.fontSize=size*2+'px';element.style.lineHeight='1.5';element.style.letterSpacing='.12em';element.style.wordSpacing='.16em';}
  });
  const measured=await page.evaluate(()=>{
   const action=document.querySelector('a'),s=getComputedStyle(action),r=action.getBoundingClientRect();
   const clipped=[...document.querySelectorAll('h1,p,a')].flatMap(element=>{const range=document.createRange();range.selectNodeContents(element);const box=element.getBoundingClientRect();return [...range.getClientRects()].filter(line=>line.width>0&&(line.left<box.left-1||line.right>box.right+1)).map(line=>({element:element.tagName,width:line.width,containerWidth:box.width}));});
   return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:r.height,radius:s.borderRadius,wordBreak:getComputedStyle(document.body).wordBreak,overflowWrap:getComputedStyle(document.body).overflowWrap,clipped};
  });
  if(theme==='dark'&&width===375&&!largeText||theme==='light'&&width===320&&largeText){
   await page.screenshot({path:path.join(root,`reviews/native-offline-${config.product}-${theme}-${width}-${largeText?'large':'normal'}.png`),fullPage:true});
  }
  if(measured.scrollWidth>width||measured.height<44||measured.radius!=='10px'||measured.wordBreak!=='keep-all'||measured.overflowWrap!=='break-word'||measured.clipped.length)failures.push({product:config.product,theme,width,largeText,measured});
  await page.evaluate(()=>{const s=document.documentElement.style;s.setProperty('--qd-radius','14px');s.setProperty('--qd-title-size','24px');s.setProperty('--qd-body-size','17px');s.setProperty('--qd-control-size','16px');});
  if(!largeText){const values=await page.evaluate(()=>({radius:getComputedStyle(document.querySelector('a')).borderRadius,title:getComputedStyle(document.querySelector('h1')).fontSize,body:getComputedStyle(document.querySelector('p')).fontSize,action:getComputedStyle(document.querySelector('a')).fontSize}));if(JSON.stringify(values)!==JSON.stringify({radius:'14px',title:'24px',body:'17px',action:'16px'}))failures.push({kind:'native-offline-propagation',product:config.product,values});}
  results.push({product:config.product,theme,width,largeText,...measured});await page.close();
 }
}finally{await browser.close();}
fs.writeFileSync(path.join(root,'reviews/native-offline-browser-results.json'),JSON.stringify({scope:'Generated native offline HTML rendered in Chromium. Three palettes, 320/375/412 widths, normal and doubled fonts with user spacing overrides, live token mutation. This is not an Android device or iOS simulator approval.',results,failures},null,2)+'\n');
console.log(JSON.stringify({scenarios:results.length,failures:failures.length,examples:failures.slice(0,8)},null,2));
if(failures.length)process.exitCode=1;
