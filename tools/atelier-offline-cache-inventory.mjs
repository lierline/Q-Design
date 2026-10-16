// Cache revision data cannot introduce or remove a ChoiceGroup caller.
// Preserve an older complete caller inventory only for this exact generated-data update.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,runtimeFiles} from './style-arguments-core.mjs';
import {copiedBody,copyProblems} from './audit-coverage-core.mjs';
import {offlineRevision} from './build-foundation.mjs';
import {PARTS} from './sync-parts.mjs';
import {beforeLedgerInventory,ledgerFiles,ledgerSourceTexts} from './atelier-ledger-pattern-sources.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Atelier',ref='45466f3f7ddf80bcd83dc0d1d7a2a67fa10538c4',file='public/q-design.offline-revision.js';
const norm=s=>s.replaceAll('\r\n','\n');
export function verifyOfflineRevisionSource(before,after,html,canonical){
 const body=offlineRevision(html);assert.equal(norm(canonical),body,'Cache data must derive from the exact current offline HTML');
 const part=PARTS.find(p=>p.src==='dist/q-design.offline-revision.atelier.js');assert.deepEqual(copyProblems(part,canonical,after),[]);
 const oldBody=copiedBody(before,'ts'),newBody=copiedBody(after,'ts');assert.equal(norm(newBody),body);
 assert.match(norm(oldBody),/^\/\/ Generated from the standalone offline HTML\. Import from the service worker\.\nself\.QD_OFFLINE_CACHE = 'q-offline-[a-f0-9]{16}';\n$/);
 const marker=after.match(/q-design-nav-sha256:\s*([a-f0-9]{64})\b/)[1];
 const expected=norm(before).replace(norm(oldBody),body).replace(/(q-design-nav-sha256:\s*)[a-f0-9]{64}\b/,'$1'+marker);
 assert.equal(norm(after),expected,'Only the generated cache value and its copy fingerprint may change');
}
// The ledger pattern edits neither declares nor calls ChoiceGroup, so it cannot add or remove a caller.
function ledgerKeepsChoiceCallers(){
 for(const file of ledgerFiles()){
  assert.notEqual(file,'app/(app)/m/field-ui.tsx','The ChoiceGroup owner needs its own review');
  const {before,after}=ledgerSourceTexts(file),count=t=>(t.match(/\bChoiceGroup\b/g)??[]).length;
  assert.equal(count(after),count(before),'ChoiceGroup references changed in '+file);
 }
}
export function verifiesChoiceInventoryWithOfflineRevision(expected){
 let items=runtimeFiles(repo).filter(p=>/\.[jt]sx?$/.test(p)).map(p=>[p,hash(fs.readFileSync(repo+'/'+p,'utf8'))]);
 if(hash(JSON.stringify(items))===expected)return true;
 if(items.some(([p])=>ledgerFiles().includes(p))){ledgerKeepsChoiceCallers();items=beforeLedgerInventory(items);if(hash(JSON.stringify(items))===expected)return true;}
 const before=execFileSync('git',['show',ref+':'+file],{cwd:repo,encoding:'utf8'}),after=fs.readFileSync(repo+'/'+file,'utf8');
 verifyOfflineRevisionSource(before,after,fs.readFileSync(root+'/dist/q-design.offline.atelier.html','utf8'),fs.readFileSync(root+'/dist/q-design.offline-revision.atelier.js','utf8'));
 const row=items.find(r=>r[0]===file);assert(row);row[1]=hash(before);
 assert.equal(hash(JSON.stringify(items)),expected,'Other caller/source changes cannot inherit the cache-only revalidation');return true;
}
