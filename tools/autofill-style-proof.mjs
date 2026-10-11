// Exact additive shared-control correction. Earlier declaration evidence may
// be retained only when its original referenced line remains unchanged.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {hash} from './style-arguments-core.mjs';

const root='D:/Claude/Q-Design',ref='f8e1463',file='patterns/components.css';
const postcss=createRequire('D:/Claude/Q-Atelier/package.json')('postcss');
export const autofillStyles=`
/* Browser-populated text fields share the same palette as ordinary fields.
   The inset paint covers the browser's private autofill background; it does
   not disable autofill, alter values or add a delayed background animation. */
:root {
  --qd-autofill-surface: var(--qd-surface);
  --qd-autofill-ink: var(--qd-text);
  --qd-autofill-cover: 100vmax;
}
html :is(input, textarea):is(:autofill, :-webkit-autofill) {
  -webkit-text-fill-color: var(--qd-autofill-ink) !important;
  caret-color: var(--qd-accent);
  box-shadow: inset 0 0 0 var(--qd-autofill-cover) var(--qd-autofill-surface) !important;
}
html :is(input, textarea):is(:autofill, :-webkit-autofill):focus-visible {
  outline: var(--qd-focus-outline-width) solid var(--qd-accent) !important;
  outline-offset: var(--qd-space-1) !important;
}
html :is(input, textarea):is(:autofill, :-webkit-autofill):disabled {
  --qd-autofill-surface: var(--qd-bg);
  --qd-autofill-ink: var(--qd-muted);
}
@media (forced-colors: active) {
  html :is(input, textarea):is(:autofill, :-webkit-autofill) {
    -webkit-text-fill-color: FieldText !important;
    caret-color: FieldText;
    box-shadow: none !important;
    outline-color: Highlight !important;
  }
  html :is(input, textarea):is(:autofill, :-webkit-autofill):disabled {
    -webkit-text-fill-color: GrayText !important;
  }
}
`;
export const applyAutofillStyles=before=>before+autofillStyles;
export function verifyAutofillStyles(before,after){
 assert.equal(after,applyAutofillStyles(before),'Only the reviewed autofill addendum may change');
 const namedRules=css=>{const rules=[];postcss.parse(css).walkRules(r=>{if(/\.[A-Za-z_]/.test(r.selector))rules.push(r.toString());});return rules;};
 assert.deepEqual(namedRules(after),namedRules(before),'Existing named component recipes must remain unchanged');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const before=execFileSync('git',['show',ref+':'+file],{cwd:root,encoding:'utf8'}).replaceAll('\r\n','\n');
 let after=fs.readFileSync(root+'/'+file,'utf8').replaceAll('\r\n','\n');
 if(process.argv.includes('--apply')){assert.equal(after,before,'Canonical file already changed');after=applyAutofillStyles(before);fs.writeFileSync(root+'/'+file,after);}
 verifyAutofillStyles(before,after);
 const target=root+'/reviews/autofill-style-proof.json';
 const prior=fs.existsSync(target)?JSON.parse(fs.readFileSync(target,'utf8')):null;
 const retained=prior?.ref===ref&&prior.beforeHash===hash(before)&&prior.afterHash===hash(after)?[...prior.retained]:[];
 const currentReports=['atelier-size-renderer-review.json','atelier-write-guard-review.json','atelier-style-spread-review.json','atelier-style-bindings-review.json','atelier-style-consumer-review.json','atelier-style-prop-flow-review.json','atelier-fold-grid-review.json','atelier-widget-width-review.json','atelier-final-presentation-boundaries.json','atelier-renderer-enum-review.json','atelier-renderer-slot-review.json','atelier-html-content-review.json','atelier-dimension-flow-review.json','atelier-api-output-consumer-review.json','atelier-data-ratio-review.json','atelier-measured-coordinate-review.json','atelier-semantic-palette-review.json','atelier-color-flow-review.json','atelier-watermark-content-review.json','atelier-chart-layout-review.json','atelier-parameter-leaves-review.json','atelier-icon-compatibility-review.json','maison-style-manual-review.json','maison-style-spread-review.json','maison-style-bindings-review.json','maison-accent-review.json'];
 if(process.argv.includes('--retain'))for(const name of currentReports){
  const target=root+'/reviews/'+name,report=JSON.parse(fs.readFileSync(target,'utf8'));let count=0;
  const visit=node=>{
   if(Array.isArray(node)){node.forEach(visit);return;}
   if(!node||typeof node!=='object')return;
   if(node.path===file&&node.hash===hash(before)){
    assert(Number.isInteger(node.line)&&node.line>0,'Evidence needs an exact declaration line: '+name);
    assert.equal(before.split('\n')[node.line-1],after.split('\n')[node.line-1],'Changed declaration cannot retain evidence');
    assert.notEqual(before.split('\n')[node.line-1],undefined,'Evidence line must exist');
    node.hash=hash(after);retained.push({report:name,line:node.line});count++;
   }
   for(const [key,child] of Object.entries(node))if(key!=='supersededRecords')visit(child);
  };visit(report);
  if(count)fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
 }
 const proof={ref,path:file,beforeHash:hash(before),afterHash:hash(after),scope:'Only an EOF autofill-state addendum. Ordinary declarations and every named component recipe are byte-for-byte unchanged. Existing line references, including finite named-class reviews, retain evidence solely for this exact non-class-selector addition. Historical archives, other hashes and source files are not updated.',retained};
 if(process.argv.includes('--check')){
  const saved=JSON.parse(fs.readFileSync(target,'utf8'));for(const key of ['ref','path','beforeHash','afterHash','scope'])assert.equal(saved[key],proof[key],'Stale autofill addendum proof');
 }else fs.writeFileSync(target,JSON.stringify(proof,null,2)+'\n');
 console.log(JSON.stringify({verified:true,retained:retained.length}));
}
