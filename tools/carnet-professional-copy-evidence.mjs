import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {applyBindings,termsForFile,copyNodes} from './copy-spacing.mjs';
import {hash,scanArguments,cssProperties} from './style-arguments-core.mjs';
import {createRequire} from 'node:module';
const root='D:/Claude/Q-Design',base='D:/Claude/DHR',ref='545d0c4d7c001dbb06eb48060e1110c2ea1a601e';
const read=p=>fs.readFileSync(p,'utf8').replaceAll('\r\n','\n');
const rules=JSON.parse(read(root+'/patterns/copy-rules.json'));
const terms=[...rules.terms,...(rules.additionalRuleFiles??[]).flatMap(p=>JSON.parse(read(root+'/'+p)).terms)];
const files=[...new Set(JSON.parse(read(root+'/patterns/professional-carnet-copy.json')).terms.flatMap(t=>t.paths))].sort();
export function inspectProfessionalCopy(){
 const records=[];
 for(const file of files){
  const before=execFileSync('git',['show',ref+':'+file],{cwd:base,encoding:'utf8'}).replaceAll('\r\n','\n');
  const replacement=applyBindings(file,before,[],termsForFile(terms,'carnet',file));
  let expected=replacement.after;
  if(file==='lib/forms.ts')expected=expected.replace("import { ROLE_LABEL } from './roles.ts';\n","import { ROLE_LABEL } from './roles.ts';\nimport { QDCarnetRecordLabels } from './design/q-design-record-labels.ts';\n").replace('TABLE_LABEL[name] ?? name;','QDCarnetRecordLabels[name] ?? TABLE_LABEL[name] ?? name;');
  const after=read(base+'/'+file);
  assert.equal(after,expected,'Unreviewed source change: '+file);
  records.push({path:file,beforeHash:hash(before),afterHash:hash(after),literalChanges:replacement.changes.length,centralLabelImport:file==='lib/forms.ts'});
 }
 return {product:'carnet',ref,scope:'Whole-source comparison. Reviewed literals plus exactly one display-label import and lookup; no database or state-code changes.',records};
}
export function beforeCarnetProfessionalSource(file,code){
 if(!files.includes(file))return code;
 const proof=inspectProfessionalCopy(),record=proof.records.find(r=>r.path===file);
 assert.equal(hash(code),record.afterHash,'Only the reviewed current copy may be restored');
 const before=execFileSync('git',['show',ref+':'+file],{cwd:base,encoding:'utf8'}).replaceAll('\r\n','\n');
 assert.equal(hash(before),record.beforeHash);return before;
}
export function rebindFormsImport(){
 const file=root+'/dist/q-design.copy-bindings.json',report=JSON.parse(read(file)),row=report.files.find(r=>r.product==='carnet'&&r.path==='lib/forms.ts');
 assert(row);
 const after=read(base+'/lib/forms.ts'),before=after.replace("import { QDCarnetRecordLabels } from './design/q-design-record-labels.ts';\n",'').replace('QDCarnetRecordLabels[name] ?? TABLE_LABEL[name] ?? name;','TABLE_LABEL[name] ?? name;');
 const oldNodes=copyNodes('lib/forms.ts',before),newNodes=copyNodes('lib/forms.ts',after);
 for(const binding of row.bindings){
  const same=newNodes.find(n=>n.line===binding.line&&n.kind===binding.kind&&n.ordinal===binding.ordinal&&n.raw===binding.emitted);
  if(same)continue;
  const old=oldNodes.find(n=>n.line===binding.line&&n.kind===binding.kind&&n.ordinal===binding.ordinal&&n.raw===binding.emitted);assert(old,'Missing exact prior binding');
  const next=newNodes.find(n=>n.line===binding.line+1&&n.kind===binding.kind&&n.ordinal===binding.ordinal&&n.raw===binding.emitted);assert(next,'Import must only shift existing bindings by one line');
  binding.line++;
 }
 fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
}
export function revalidateDmrConsumers({write=false}={}){
 inspectProfessionalCopy();
 const file='app/(admin)/settings/dmr/dmr-forms.tsx',name='reviews/carnet-consumer-review.json';
 const req=createRequire('D:/Claude/Q-Atelier/package.json'),ts=req('typescript'),postcss=createRequire('D:/Claude/Q-Works/package.json')('postcss');
 const properties=cssProperties(ts,read(path.join(path.dirname(req.resolve('typescript')),'lib.dom.d.ts')));
 const before=execFileSync('git',['show',ref+':'+file],{cwd:base,encoding:'utf8'}),after=read(base+'/'+file);
 const oldArgs=scanArguments(file,before,{ts,postcss,properties}),newArgs=scanArguments(file,after,{ts,postcss,properties});
 assert.deepEqual(newArgs,oldArgs,'Every DMR style argument must remain identical after the copy-only change');
 const prior=JSON.parse(execFileSync('git',['show','63372ef3622c9ae2eb7f2584fc058f0d0167704b:'+name],{cwd:root,encoding:'utf8'}));let count=0;
 for(const row of prior.records)if(row.path===file){
  assert.equal(row.sourceHash,hash(before));
  assert(oldArgs.some(a=>a.line===row.line&&hash(JSON.stringify([file,a.line,a.kind,a.property,a.value]))===row.argumentHash));
  row.sourceHash=hash(after);
  for(const e of row.evidence??[])if(e.path===file){assert.equal(e.hash,hash(before));assert.equal(before.replaceAll('\r\n','\n').split('\n')[e.line-1],after.split('\n')[e.line-1]);e.hash=hash(after);}
  count++;
 }
 assert.equal(count,5);
 if(write)fs.writeFileSync(root+'/'+name,JSON.stringify(prior,null,2)+'\n');
 else assert.deepEqual(JSON.parse(read(root+'/'+name)),prior);
 return count;
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const result=inspectProfessionalCopy(),file=root+'/reviews/carnet-professional-copy-evidence.json';
 if(process.argv.includes('--write')){rebindFormsImport();fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n');}
 else assert.deepEqual(JSON.parse(read(file)),result);
 const rebound=revalidateDmrConsumers({write:process.argv.includes('--write')});
 console.log(JSON.stringify({files:result.records.length,literalChanges:result.records.reduce((n,r)=>n+r.literalChanges,0),rebound}));
}
