import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {inspectActiveCopyBindings} from './active-copy-bindings.mjs';
import {applyBindings} from './copy-spacing.mjs';
const root='D:/Claude/Q-Design',read=p=>fs.readFileSync(root+'/'+p,'utf8');
test('the actual writer preserves the complete historical snapshot and uses the active current index',()=>{
 const beforeLegacy=read('dist/q-design.copy-bindings.json'),beforeActive=read('dist/q-design.copy-bindings.current.json');inspectActiveCopyBindings();
 const output=execFileSync(process.execPath,['tools/copy-spacing.mjs','--write','--only=carnet'],{cwd:root,encoding:'utf8'});assert.equal(JSON.parse(output).phrases,0);assert.equal(read('dist/q-design.copy-bindings.json'),beforeLegacy);assert.equal(read('dist/q-design.copy-bindings.current.json'),beforeActive);inspectActiveCopyBindings();
});
test('the active homepage binding changes with its central rule, and unrelated drift is rejected',()=>{
 const active=JSON.parse(read('dist/q-design.copy-bindings.current.json')),file='app/(admin)/page.tsx',binding=active.files.find(r=>r.product==='carnet'&&r.path===file).bindings.find(r=>r.line===465),before=fs.readFileSync('D:/Claude/DHR/'+file,'utf8'),term=JSON.parse(read('patterns/professional-carnet-copy.json')).terms.find(t=>t.id==='carnet-user-honorific-spacing');assert(binding);
 const result=applyBindings(file,before,[binding],[{...term,to:'님께'}]);assert.equal(result.changes.length,1);assert.equal(result.after,before.replace('${user.full_name}님','${user.full_name}님께'));
 const changed=structuredClone(active);changed.files[0].bindings[0].emitted='unreviewed';assert.throws(()=>inspectActiveCopyBindings({active:JSON.stringify(changed)}));assert.throws(()=>inspectActiveCopyBindings({legacy:read('dist/q-design.copy-bindings.json')+'x'}));assert.throws(()=>inspectActiveCopyBindings({pipeline:read('tools/copy-spacing.mjs').replace('q-design.copy-bindings.current.json','q-design.copy-bindings.json')}));
});
