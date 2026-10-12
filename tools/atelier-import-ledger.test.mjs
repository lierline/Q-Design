import fs from 'node:fs';import test from 'node:test';import assert from 'node:assert/strict';
import {createImportLedger,proveImportedComposition,beforeImportLedger,importBaseline} from './atelier-import-ledger.mjs';import {createAtelierProofContext} from './atelier-proof-context.mjs';
const current=JSON.parse(fs.readFileSync('D:/Claude/Q-Design/reviews/atelier-style-decisions.json','utf8'));
test('55 new central compositions preserve every other full record and project to the exact prior ledger',()=>{
 const proof=createImportLedger(current);assert.equal(proof.changes.length,55);assert.equal(proof.afterUnknown,681);assert.equal(proof.unchanged,53936);assert.equal(beforeImportLedger(current),importBaseline());
});
test('changed sources, borrowed evidence, false reasons and unrelated decisions cannot enter the projection',()=>{
 const saved=JSON.parse(fs.readFileSync('D:/Claude/Q-Design/reviews/atelier-import-ledger.json','utf8')),row=current.records[saved.changes[0].index],code=fs.readFileSync('D:/Claude/Q-Atelier/'+row.path,'utf8'),context=createAtelierProofContext({expanded:true});
 for(const changed of [{...row,value:'913'},{...row,evidence:[]},{...row,reason:'all imports are owned'},{...row,decision:'structural-behavior'}])assert.throws(()=>proveImportedComposition(changed,code,context));
 assert.throws(()=>proveImportedComposition(row,code+'\nconst added=1;',context));
 const wrong=structuredClone(current);wrong.records.find(r=>r.decision==='unknown').decision='token-reference-verified';assert.throws(()=>beforeImportLedger(wrong));
 const other=structuredClone(current);other.records.find(r=>r.decision!=='unknown').reason='unrelated';assert.throws(()=>createImportLedger(other));
});
