// Exact CSS-only correction. Unrelated canonical evidence is retained only
// when its referenced declaration line is byte-for-byte unchanged.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {beforeSocialFoundation} from './atelier-social-touch-foundation.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ref='c424302',file='patterns/foundation/atelier.css';
export function applyFieldLabelSpacing(css,{stage=true,clip=true}={}){
 const matches=[...css.matchAll(/(\.expert-portal-root \.field-label \{[^}]*?letter-spacing:) 0\.18em;/g)];
 if(matches.length!==1)throw Error('Expected exact expert field tracking declaration');
 return css.replace(matches[0][0],matches[0][1]+' var(--qd-tracking-normal);')
  +'\n/* Form labels keep ordinary word spacing, including optional Korean hints. */\n.expert-portal-root label.field-label > span {\n  letter-spacing: var(--qd-tracking-normal) !important;\n}\n'
  +(stage?'\n/* Keep the same brand stage for short and long desktop access forms.\n   The intrinsic minimum keeps short windows from clipping the brand content. */\n@media (min-width: qd-bp(lg)) {\n'
   +(clip?'  .expert-portal-root:has(.luxe-login-shell) {\n    overflow-x: clip;\n    overflow-y: visible;\n  }\n':'')
   +'  .expert-portal-root .luxe-login-stage {\n    position: sticky;\n    top: 0;\n    align-self: start;\n    height: 100vh;\n    height: 100dvh;\n    min-height: min-content;\n  }\n}\n':'');
}
export function verifyFieldLabelSpacing(before,after){
 if(after!==applyFieldLabelSpacing(before))throw Error('Unreviewed canonical CSS change');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const before=execFileSync('git',['show',ref+':'+file],{cwd:root,encoding:'utf8'}).replaceAll('\r\n','\n');
 const after=beforeSocialFoundation(fs.readFileSync(path.join(root,file),'utf8'));
 verifyFieldLabelSpacing(before,after);
 const intermediate=applyFieldLabelSpacing(before,{stage:false});
 const priorStage=applyFieldLabelSpacing(before,{clip:false});
 const retained=[];
 if(!process.argv.includes('--check'))for(const name of ['atelier-color-flow-review.json','atelier-fold-grid-review.json','atelier-style-bindings-review.json']){
  const full=path.join(root,'reviews',name),report=JSON.parse(fs.readFileSync(full,'utf8'));
  for(const record of report.records??[])for(const e of record.evidence??[])if(e.path===file&&[hash(before),hash(intermediate),hash(priorStage)].includes(e.hash)){
   if(before.split('\n')[e.line-1]!==after.split('\n')[e.line-1])throw Error('Changed declaration cannot retain evidence '+name+':'+e.line);
   e.hash=hash(after);retained.push({report:name,path:record.path,line:record.line,evidenceLine:e.line});
  }
  fs.writeFileSync(full,JSON.stringify(report,null,2)+'\n');
 }
 const proof={ref,path:file,beforeHash:hash(before),afterHash:hash(after),scope:'One exact field-label tracking substitution, a scoped child-span rule and a desktop-only brand-stage layout. Only unchanged referenced declarations retain evidence. Other source changes are rejected.',retained};
 if(!process.argv.includes('--check'))fs.writeFileSync(path.join(root,'reviews/field-label-spacing-proof.json'),JSON.stringify(proof,null,2)+'\n');
 else{const saved=JSON.parse(fs.readFileSync(path.join(root,'reviews/field-label-spacing-proof.json'),'utf8'));for(const key of ['ref','path','beforeHash','afterHash','scope'])if(saved[key]!==proof[key])throw Error('Stale field-label CSS proof');}
 console.log(JSON.stringify({verified:true,retained:retained.length}));
}
