import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {hash} from './style-arguments-core.mjs';
import {createLedgerSources,ledgerManifest,ledgerSource,ledgerFiles,ledgerRefs,beforeLedgerSource,afterLedgerSource,beforeLedgerInventory,ledgerLineMap,ledgerOffsetMap,forwardLedgerTree,historicalLedgerEvidence} from './atelier-ledger-pattern-sources.mjs';
const product='D:/Claude/Q-Atelier',root='D:/Claude/Q-Design';
const show=(cwd,ref,file)=>execFileSync('git',['show',ref+':'+file],{cwd,encoding:'utf8',maxBuffer:128*1024*1024});
test('the saved record is exactly the edit list of the two reviewed commits',()=>{
 const result=createLedgerSources();assert.deepEqual(result,ledgerManifest());
 assert.equal(result.sources.length,15);assert.equal(result.sources.reduce((n,s)=>n+s.edits.length,0),69);
});
test('every current source reverses to the exact earlier revision and moves forward again',()=>{
 for(const s of ledgerManifest().sources){
  const cwd=s.repo==='product'?product:root,current=fs.readFileSync(cwd+'/'+s.path,'utf8'),before=beforeLedgerSource(s.path,current,s.repo);
  assert.equal(hash(before),s.beforeHash);assert.equal(hash(before),hash(show(cwd,ledgerRefs[s.repo].before,s.path)));
  assert.equal(hash(afterLedgerSource(s.path,before,s.repo)),s.afterHash);
  assert.equal(beforeLedgerSource(s.path,before,s.repo),before,'An earlier revision passes through');
 }
});
test('a change outside the reviewed edits is refused, and unrelated files pass through',()=>{
 const file='lib/design/components.tsx',current=fs.readFileSync(product+'/'+file,'utf8');
 assert.throws(()=>beforeLedgerSource(file,current.replace('export function StatGrid','export function StatGrid2')));
 assert.throws(()=>beforeLedgerSource(file,current+'\n// later edit\n'));
 const other='lib/design/tokens.ts',text=fs.readFileSync(product+'/'+other,'utf8');assert.equal(beforeLedgerSource(other,text),text);
 assert.equal(ledgerSource(other),null);assert(!ledgerFiles().includes(other));
});
test('positions inside an edit have no counterpart; positions outside move by the exact line count',()=>{
 const map=ledgerLineMap('app/(app)/approve/client.tsx');
 assert.equal(map.toAfter(18),18);assert.equal(map.toAfter(19),22);assert.equal(map.toAfter(148),null);assert.equal(map.toBefore(map.toAfter(184)),184);
 const components=ledgerLineMap('lib/design/components.tsx');assert.equal(components.toAfter(1445),1445);assert.equal(components.toAfter(4362),null);assert.equal(components.toBefore(4400),null);
 const offsets=ledgerOffsetMap('lib/design/components.tsx'),before=beforeLedgerSource('lib/design/components.tsx',fs.readFileSync(product+'/lib/design/components.tsx','utf8')),at=before.indexOf('export function StatGrid');
 assert.equal(offsets.toAfter(at),at);assert.equal(offsets.toAfter(before.indexOf('export function DetailRow')),null);
});
test('a moved review changes only earlier fingerprints and anchored positions, and refuses edited positions',()=>{
 const s=ledgerSource('app/(app)/udi/[id]/client.tsx'),entry={path:s.path,line:225,sourceHash:s.beforeHash,argumentHash:'a',evidence:[{path:s.path,line:225,hash:s.beforeHash},{path:'lib/lot.ts',line:3,hash:'x'}]};
 const moved=forwardLedgerTree(entry);assert.equal(moved.sourceHash,s.afterHash);assert.equal(moved.line,225);assert.equal(moved.evidence[0].hash,s.afterHash);assert.deepEqual(moved.evidence[1],entry.evidence[1]);
 assert.throws(()=>forwardLedgerTree({...entry,line:200}),/inside a ledger edit/);
 assert.throws(()=>forwardLedgerTree({path:s.path,line:7}),/Unanchored/);
 const older={path:s.path,line:200,hash:'an-older-revision'};assert.deepEqual(forwardLedgerTree(older),older,'Other revisions are never moved');
});
test('an inventory restores only exact later fingerprints',()=>{
 const s=ledgerSource('lib/glossary.ts');
 assert.deepEqual(beforeLedgerInventory([[s.path,s.afterHash],['lib/lot.ts','x']]),[[s.path,s.beforeHash],['lib/lot.ts','x']]);
 assert.throws(()=>beforeLedgerInventory([[s.path,'unreviewed']]));
});
test('fresh evidence reads back only for a record proven on the earlier ledger revision',()=>{
 const s=ledgerSource('app/q-design.foundation.css'),map=ledgerLineMap(s.path),other={path:'lib/lot.ts',line:3,hash:'x'};
 const fresh=[{path:s.path,line:map.toAfter(6945),hash:s.afterHash},other],prior=[{path:s.path,line:6945,hash:s.beforeHash},other];
 assert.deepEqual(historicalLedgerEvidence(fresh,prior),prior);
 assert.deepEqual(historicalLedgerEvidence(fresh,[{path:s.path,line:7237,hash:s.afterHash}]),fresh,'A later record keeps later evidence');
 assert.deepEqual(historicalLedgerEvidence(fresh,[other]),fresh,'A record without ledger evidence changes nothing');
 const inside=[{path:s.path,line:1320,hash:s.afterHash}];assert.deepEqual(historicalLedgerEvidence(inside,prior),inside,'A new line has no earlier position');
 const unreviewed=[{path:s.path,line:7237,hash:'unreviewed'}];assert.deepEqual(historicalLedgerEvidence(unreviewed,prior),unreviewed,'Only the exact later fingerprint reads back');
});
