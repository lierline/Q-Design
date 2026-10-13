import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {inspectProfessionalCopy} from './carnet-professional-copy-evidence.mjs';
import {recordLabelsSource,buildRecordLabels} from './build-record-labels.mjs';
import {applyBindings,termsForFile} from './copy-spacing.mjs';
import {beforeHonorificBindings} from './carnet-honorific-review.mjs';
const root='D:/Claude/Q-Design',base='D:/Claude/DHR';
const ts=createRequire('D:/Claude/Q-Atelier/package.json')('typescript');
const read=p=>fs.readFileSync(p,'utf8');
test('professional terminology preserves complete product source outside reviewed literals and the display-label lookup',()=>{
 const proof=inspectProfessionalCopy();
 assert.equal(proof.records.length,13);
 assert.equal(proof.records.reduce((n,r)=>n+r.literalChanges,0),59);
});
test('demo confirmation rejects unauthorized, empty, old and incorrect phrases before reaching the database boundary',async()=>{
 const code=ts.transpileModule(read(base+'/app/demo-actions.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 let admin=false,calls=0,revalidations=0;
 const exports={};
 const require=id=>({
  'next/cache':{revalidatePath:()=>revalidations++},
  '@/lib/session':{requireUser:async()=>({id:'local-test'}),hasRole:(_me,role)=>admin&&role==='SYS_ADMIN'},
  '@/lib/db':{withActor:async()=>{calls++;return null;},dbMessage:String}
 })[id]??assert.fail('Unexpected import: '+id);
 vm.runInNewContext(code,{exports,require});
 const submit=phrase=>exports.purgeDemoData({},new Map([['confirm',phrase]]));
 assert.match((await submit('초기화')).error,/시스템 관리자/);
 admin=true;
 for(const phrase of ['', '비웁니다', '초기', '초기화합니다'])assert.match((await submit(phrase)).error,/초기화/);
 assert.equal(calls,0);assert.equal(revalidations,0);
 assert.equal((await submit(' 초기화 ')).ok,true);
 assert.equal(calls,1);assert.equal(revalidations,1);
 // withActor is a stub. No actual database or purge function is called.
});
test('shared labels reject identifier drift and retain the reviewed Carnet bindings after other product updates',()=>{
 buildRecordLabels({check:true});
 assert.throws(()=>recordLabelsSource({link_connection:'연동',extra:'추가'}),/identifiers/);
 assert.throws(()=>recordLabelsSource({link_connection:'연동\n연결',link_inbox:'수신'}),/single-line/);
 const current=beforeHonorificBindings(JSON.parse(read(root+'/dist/q-design.copy-bindings.json')));
 const rows=(report,product)=>report.files.filter(r=>r.product===product).sort((a,b)=>a.path.localeCompare(b.path));
 const reviewed=JSON.parse(execFileSync('git',['show','cb5789de1676125fb2336e6fb46a0321d727afa2:dist/q-design.copy-bindings.json'],{cwd:root,encoding:'utf8'}));
 assert.deepEqual(rows(current,'carnet'),rows(reviewed,'carnet'));
});
test('a future central terminology edit changes the already migrated homepage without changing its layout',()=>{
 const file='app/(admin)/page.tsx',code=read(base+'/'+file);
 const bindings=JSON.parse(read(root+'/dist/q-design.copy-bindings.json')).files.find(r=>r.product==='carnet'&&r.path===file).bindings;
 const rules=JSON.parse(read(root+'/patterns/copy-rules.json'));
 const terms=[...rules.terms,...rules.additionalRuleFiles.flatMap(f=>JSON.parse(read(root+'/'+f)).terms)].map(t=>t.id==='carnet-process-open-professional'?{...t,to:'미완료 공정'}:t);
 const result=applyBindings(file,code,bindings,termsForFile(terms,'carnet',file));
 assert.equal(result.after,code.replaceAll('미종료 공정','미완료 공정'));
 assert(result.changes.length>0);
});
