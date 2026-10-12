// Isolated CSS propagation probe for the exact three shipped component copies.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {inspectChoiceGlyphSources} from './choice-glyph-revalidation.mjs';
const root='D:/Claude/Q-Design';inspectChoiceGlyphSources();
const {chromium}=createRequire('D:/Claude/Q-Atelier/package.json')('playwright'),browser=await chromium.launch({channel:'msedge',headless:true}),records=[];
try{
 for(const [product,repo]of [['atelier','Q-Atelier'],['maison','Q-Works'],['carnet','DHR']])for(const theme of ['dark','light']){
  const page=await browser.newPage({viewport:{width:390,height:844}});await page.route('**/*',r=>r.abort());
  const css=fs.readFileSync('D:/Claude/'+repo+'/app/q-design.components.css','utf8')+'\n'+fs.readFileSync('D:/Claude/'+repo+'/app/q-design.foundation.css','utf8')+'\n'+fs.readFileSync(root+'/dist/q-design.palette.'+product+'.css','utf8');
  await page.setContent('<html data-product="'+product+'" data-theme="'+theme+'" class="'+theme+'"><head><style>'+css+'\n*{box-sizing:border-box}body{margin:0;padding:16px}</style></head><body><label class="qd-choice-hit"><input type="radio" class="qd-radio" checked>라디오</label><label class="qd-choice-hit"><input type="checkbox" class="qd-checkbox" checked><span class="qd-checkbox-mark"><svg class="qd-checkbox-icon" aria-hidden="true"></svg></span>체크 표시</label></body></html>');
  const measure=()=>page.evaluate(()=>{const size=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return[r.width,r.height];};return{radio:size('.qd-radio'),checkbox:size('.qd-checkbox-mark'),icon:size('.qd-checkbox-icon'),overflow:document.documentElement.scrollWidth-innerWidth};});
  const before=await measure();assert.deepEqual(before.radio,[16,16]);assert.deepEqual(before.checkbox,[16,16]);assert.deepEqual(before.icon,[12,12]);assert.equal(before.overflow,0);
  await page.evaluate(()=>document.documentElement.style.setProperty('--qd-choice-glyph-size','20px'));const mutation=await measure();assert.deepEqual(mutation.radio,[20,20]);assert.deepEqual(mutation.checkbox,[20,20]);assert.deepEqual(mutation.icon,[15,15]);assert.equal(mutation.overflow,0);
  records.push({product,theme,before,mutation});await page.close();
 }
}finally{await browser.close();}
fs.writeFileSync(root+'/reviews/choice-glyph-family-browser.json',JSON.stringify({scope:'Six exact shipped CSS fixtures across three products and two themes. Baseline geometry is retained, then one shared glyph variable changes radio, checkbox mark and the inner icon proportion. No operating pages, accounts or business writes.',records,passed:records.length,failures:0},null,2)+'\n');console.log(JSON.stringify({cases:records.length,passed:true}));
