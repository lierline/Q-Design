import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash} from './style-arguments-core.mjs';
import {beforeLoginNoticeSource,proveEffectBodyEdit,createLoginNoticeProof} from './maison-login-session-notice.mjs';
import {createCurrentMaisonNavigation} from './maison-current-navigation.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',file='app/(auth)/login/login-form.tsx';
const show=ref=>execFileSync('git',['show',ref+':'+file],{cwd:repo,encoding:'utf8'}).replaceAll('\r\n','\n');
test('the exact live login notice edit reverses to the earlier source and keeps the complete navigation inventory',()=>{
 const proof=createLoginNoticeProof();assert.deepEqual(JSON.parse(fs.readFileSync(root+'/reviews/maison-login-session-notice.json','utf8')),proof);
 assert.deepEqual(proof.hunk,{beforeStart:45,beforeLines:3,afterStart:45,afterLines:15});assert.equal(proof.appearanceArguments,20);
 const live=fs.readFileSync(repo+'/'+file,'utf8');assert.equal(hash(beforeLoginNoticeSource(file,live)),proof.beforeHash);
 assert.equal(beforeLoginNoticeSource('app/other.tsx','unchanged'),'unchanged');
 const saved=JSON.parse(fs.readFileSync(root+'/reviews/maison-current-navigation-review.json','utf8'));assert.equal(createCurrentMaisonNavigation().inventoryHash,saved.inventoryHash);
});
test('any other login source passes through and cannot inherit the earlier inventory',()=>{
 const live=fs.readFileSync(repo+'/'+file,'utf8'),changed=live.replace('비활성 계정입니다.','다른 안내입니다.');assert.notEqual(changed,live);
 assert.equal(beforeLoginNoticeSource(file,changed),changed);assert.throws(()=>createLoginNoticeProof(changed),/exact reviewed/);
 const saved=JSON.parse(fs.readFileSync(root+'/reviews/maison-current-navigation-review.json','utf8'));
 assert.notEqual(createCurrentMaisonNavigation(new Map([[file,beforeLoginNoticeSource(file,changed)]])).inventoryHash,saved.inventoryHash);
});
test('an edit outside the effect body or carrying appearance cannot be proven',()=>{
 const before=show('2aff4e23ec3b4bcd622ae39905c5085cfc638c99'),after=show('4d9361aeb054880c5354a79b21390c3a06256ddd');
 assert.doesNotThrow(()=>proveEffectBodyEdit(before,after));
 for(const altered of[after.replace('mb-4','mb-6'),after.replace('export function LoginForm','export function LoginFormX'),after.replace('toast.error(message), 0)','toast.error(message, { className: "text-red-500" }), 0)'),after.replace('if (!message) return;','if (!message) return <span />;')]){
  assert.notEqual(altered,after);assert.throws(()=>proveEffectBodyEdit(before,altered));
 }
});
