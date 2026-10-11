import fs from 'node:fs';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),req=createRequire(new URL('../../Q-Atelier/package.json',import.meta.url));
const {chromium}=req('playwright');
const css=fs.readFileSync(new URL('patterns/components.css',root),'utf8');
const browser=await chromium.launch({channel:'msedge',headless:true});
const cases=[];
try{
 for(const width of [375,1280])for(const fontSize of [12,24])for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width,height:812}});
  const labels=['고객불만 승인 (품질 책임자): 검토 → 승인, 반려','패밀리 제품과 자료 주고받기 (내보내기 · 받아 오기)'];
  const cells=Array.from({length:13},()=>'<td>✓</td>').join('');
  await page.setContent(`<style>${css}
   body{margin:16px;word-break:keep-all;overflow-wrap:break-word;font-family:sans-serif;font-size:${fontSize}px}
   body{--qd-surface:${theme==='dark'?'#141414':'#ffffff'};color:${theme==='dark'?'#f0ebe0':'#302c25'}}
   .qd-table-scroll--tall{width:100%;border:1px solid;box-sizing:border-box}
   table{min-width:100%;border-collapse:collapse}th,td{padding:12px}th{white-space:nowrap}
   </style><div class="qd-table-scroll--tall"><table><thead class="qd-table-scroll-header"><tr><th class="qd-table-sticky-first qd-table-description">권한</th>${Array.from({length:13},(_,i)=>'<th>업무 역할 '+i+'</th>').join('')}</tr></thead><tbody>${labels.map(label=>'<tr><td class="qd-table-sticky-first qd-table-description">'+label+'</td>'+cells+'</tr>').join('')}</tbody></table></div>`);
  const inspect=()=>page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth,host:document.querySelector('.qd-table-scroll--tall').clientWidth,table:document.querySelector('table').getBoundingClientRect().width,columns:[...document.querySelectorAll('.qd-table-description')].map(e=>({width:e.getBoundingClientRect().width,client:e.clientWidth,scroll:e.scrollWidth})),minimum:getComputedStyle(document.documentElement).getPropertyValue('--qd-table-description-min-width').trim()}));
  const initial=await inspect();assert.equal(initial.page,width);assert.equal(initial.minimum,'160px');assert(initial.table>initial.host);assert(initial.columns.every(c=>c.width>=160&&c.scroll<=c.client+1));
  await page.evaluate(()=>document.documentElement.style.setProperty('--qd-table-description-min-width','192px'));
  const modified=await inspect();assert.equal(modified.page,width);assert(modified.columns.every(c=>c.width>=192&&c.scroll<=c.client+1));assert(modified.columns[0].width>initial.columns[0].width);
  cases.push({width,fontSize,theme,initial,modified});await page.close();
 }
 fs.writeFileSync(new URL('reviews/table-description-browser-results.json',root),JSON.stringify({scope:'Browser layout fixture using the central CSS and permission/menu description classes. Original source behavior and production permission values are not changed or certified by this fixture.',cases,passed:cases.length,failures:0},null,2)+'\n');
 console.log(JSON.stringify({passed:cases.length,failures:0}));
}finally{await browser.close();}
