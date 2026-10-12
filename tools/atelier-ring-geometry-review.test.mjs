import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {ts,ringPath,inspectRingGeometry,createRingGeometryReview} from './atelier-ring-geometry-review.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Atelier',req=createRequire(repo+'/package.json');
const source=fs.readFileSync(repo+'/'+ringPath,'utf8'),React=req('react'),{renderToStaticMarkup}=req('react-dom/server');
function load(code,globals={}){const exports={};vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:req,...globals});return exports;}
test('ring proof matches only native circle arithmetic and fill resets',()=>{
 const report=createRingGeometryReview();assert.deepEqual(report,JSON.parse(fs.readFileSync(root+'/reviews/atelier-ring-geometry-review.json','utf8')));
 assert.equal(report.records.length,9);assert.equal(report.records.filter(r=>r.decision==='coordinate-boundary').length,7);
 assert(report.records.every(r=>['cx','cy','r','fill','strokeDasharray'].includes(r.property)));assert(!report.records.some(r=>r.property==='strokeWidth'||r.property==='color'));
});
test('authored Math, changed default and changed radius arithmetic invalidate geometry proof',()=>{
 for(const s of [source.replace('const r = (size - stroke) / 2;','const r = (size - stroke) / 3;'),source.replace('size = QDPresentation.progressSize[56]','size = 57'),source+'\nconst {Math} = {Math: {PI: 3}};\n']){assert.notEqual(s,source);assert.throws(()=>inspectRingGeometry(s));}
});
test('actual renderer preserves clamp and overrides and derives new coordinates from central defaults',()=>{
 const {sf,fn}=inspectRingGeometry(source),runtime=load(fs.readFileSync(root+'/source/design/atelier-runtime.ts','utf8'));
 const render=(presentation,props)=>{const {ProgressRing}=load(fn.getText(sf),{QDPresentation:presentation,QD:{motionFast:'160ms',captionSize:'12px',controlSize:'13px'},QDScale:{family:{mono:'monospace'}},T:{champagne:'#a98',border:'#333',text:'#eee'}});return renderToStaticMarkup(React.createElement(ProgressRing,props));};
 const circles=s=>Array.from(s.matchAll(/<circle\b([^>]+)>/g),m=>Object.fromEntries(Array.from(m[1].matchAll(/([\w-]+)="([^"]*)"/g),a=>[a[1],a[2]])));
 const check=(presentation,props,size,stroke)=>{const html=render(presentation,props),rows=circles(html);assert.equal(rows.length,2);const radius=(size-stroke)/2,circumference=2*Math.PI*radius;for(const r of rows){assert.equal(+r.cx,size/2);assert.equal(+r.cy,size/2);assert.equal(+r.r,radius);assert.equal(+r['stroke-width'],stroke);assert.equal(r.fill,'none');}const dash=rows[1]['stroke-dasharray'].split(' ').map(Number);assert(Math.abs(dash[0]+dash[1]-circumference)<1e-10);assert(Math.abs(dash[0]-Math.max(0,Math.min(100,props.pct))/100*circumference)<1e-10);assert.match(html,new RegExp('width="'+size+'" height="'+size+'"'));};
 const changed=structuredClone(runtime.QDPresentation);changed.progressSize[56]=70;changed.progressStroke[5]=7;
 for(const pct of [-5,0,37,100,150]){check(runtime.QDPresentation,{pct},56,5);check(changed,{pct},70,7);check(changed,{pct,size:100,stroke:10},100,10);}
});
