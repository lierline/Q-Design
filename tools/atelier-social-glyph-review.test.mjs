import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {ts,glyphPath,inspectSocialGlyphs,createSocialGlyphReview} from './atelier-social-glyph-review.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Atelier',req=createRequire(repo+'/package.json');
const source=fs.readFileSync(repo+'/'+glyphPath,'utf8');
const React=req('react'),{renderToStaticMarkup}=req('react-dom/server');
function load(code,globals={}){const exports={};vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:req,...globals});return exports;}

test('fresh exact proof covers only nineteen native social glyph attributes',()=>{
 const report=createSocialGlyphReview();assert.deepEqual(report,JSON.parse(fs.readFileSync(root+'/reviews/atelier-social-glyph-review.json','utf8')));
 assert.equal(report.records.length,19);assert.equal(report.records.filter(r=>r.decision==='coordinate-boundary').length,14);
 assert(report.records.every(r=>r.path===glyphPath&&r.line>=1053&&r.line<=1065));
 assert(report.records.some(r=>r.tag==='rect'&&r.property==='rx'&&r.value==='"5"'));
 assert(!report.records.some(r=>r.property==='strokeWidth'||r.line===850||r.property==='className'));
});

test('changed glyphs, hardcoded displayed size, local shadows and wrong imports cannot inherit review',()=>{
 for(const mutation of [s=>s.replace('rx="5"','rx="10"'),s=>s.replace('QDPresentation.iconSize[16]} height={QDPresentation.iconSize[16]} viewBox="0 0 24 24" fill="currentColor"','22} height={22} viewBox="0 0 24 24" fill="currentColor"'),s=>s.replace('function SocialLinks() {','function SocialLinks() { const T = {muted: "red"};'),s=>s.replace("import { QDPresentation } from '@/lib/design/q-design-runtime';","import { QDPresentation } from '@/lib/design/local-runtime';")]){
  const changed=mutation(source);assert.notEqual(changed,source);assert.throws(()=>inspectSocialGlyphs(changed));
 }
});

test('real native JSX follows displayed size, stroke, link radius and inherited palette while glyph geometry stays fixed',()=>{
 const {fn,sf}=inspectSocialGlyphs(source),runtime=load(fs.readFileSync(root+'/source/design/atelier-runtime.ts','utf8'));
 const render=(presentation,radius,muted)=>{const {SocialLinks}=load('export '+fn.getText(sf),{QDPresentation:presentation,QDScale:{space:{2:'8px',3:'12px'},radius},QDText:{textDecoration:{v30a0924a33:'none'}},T:{border:'#aaa',muted,champagne:'#ac956a'},Globe:()=>null});return renderToStaticMarkup(React.createElement(SocialLinks));};
 const before=render(runtime.QDPresentation,'10px','#aaa');
 const presentation=structuredClone(runtime.QDPresentation);presentation.iconSize[16]=22;presentation.iconStroke[1.8]=2.25;
 const after=render(presentation,'6px','#bbb');
 const native=s=>Array.from(s.matchAll(/<svg\b[\s\S]*?<\/svg>/g),m=>m[0]);
 const original=native(before),changed=native(after);assert.equal(original.length,2);assert.equal(changed.length,2);
 for(let i=0;i<2;i++){assert.match(original[i],/width="16" height="16"/);assert.match(changed[i],/width="22" height="22"/);const normalized=s=>s.replace(/ width="(?:16|22)" height="(?:16|22)"/,'').replace(/stroke-width="(?:1\.8|2\.25)"/,'');assert.equal(normalized(original[i]),normalized(changed[i]));}
 assert.match(changed[1],/stroke-width="2.25"/);assert.match(changed[1],/<rect x="3" y="3" width="18" height="18" rx="5"/);
 assert.match(before,/border-radius:10px/);assert.match(after,/border-radius:6px/);assert.match(after,/color:#bbb/);assert.match(changed[0],/fill="currentColor"/);
});
