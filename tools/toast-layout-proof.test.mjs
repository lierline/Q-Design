import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {applyToastLayout,verifyToastLayout} from './toast-layout-proof.mjs';
import {applyCarnetToastCopy,verifyCarnetToastCopy} from './carnet-toast-copy-proof.mjs';
test('shared layout proof rejects unrelated declarations and repeated appends',()=>{
 for(const file of ['patterns/foundation.css','patterns/foundation/carnet.css']){
  const before=execFileSync('git',['show','cf00e72:'+file],{encoding:'utf8'}),after=applyToastLayout(file,before);
  verifyToastLayout(file,before,after);
  assert.throws(()=>verifyToastLayout(file,before,after+'\n:root { --qd-space-5: 0px; }'));
  assert.throws(()=>applyToastLayout(file,after));
 }
});
test('Carnet toast migration preserves message, timer, error and portal behavior',()=>{
 const before=execFileSync('git',['show','93ce0ca:components/toast.tsx'],{cwd:'D:/Claude/DHR',encoding:'utf8'}),after=applyCarnetToastCopy(before);
 verifyCarnetToastCopy(before,after);
 for(const [from,to] of [['{n.text}','{"different message"}'],['6000','1000'],['createPortal','changedPortal']]){
  assert(after.includes(from));
  assert.throws(()=>verifyCarnetToastCopy(before,after.replace(from,to)));
 }
});
