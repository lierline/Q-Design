import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash} from './style-arguments-core.mjs';
import {PARTS} from './sync-parts.mjs';
import {copyProblems} from './audit-coverage-core.mjs';
import {beforeWorkspaceTargets} from './workspace-targets-review.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Atelier',ref='712ccc1c47f21f803f969fedfdb0d816548cf4d0';
const paths=['public/__sim.html','public/offline.html','public/q-design.offline-revision.js'];
const baseline=()=>JSON.parse(execFileSync('git',['show',ref+':reviews/atelier-style-decisions.json'],{cwd:root,encoding:'utf8',maxBuffer:128*1024*1024}));
export function beforePublicFingerprints(current){
 current=beforeWorkspaceTargets(current);
 const old=baseline(),oldFiles=new Map(old.fileHashes.map(f=>[f.path,f.hash]));
 // Historical reports already carry the earlier public fingerprints. Their
 // remaining differences are verified by the next existing history layer.
 if(paths.every(p=>current.fileHashes.find(f=>f.path===p)?.hash===oldFiles.get(p)))return current;
 const updates=new Map();for(const p of paths){const part=PARTS.find(x=>x.to?.['Q-Atelier']===repo+'/'+p);assert(part);const canonical=fs.readFileSync(root+'/'+part.src,'utf8'),actual=fs.readFileSync(repo+'/'+p,'utf8');assert.deepEqual(copyProblems(part,canonical,actual),[]);updates.set(p,{sourceHash:hash(actual),evidence:[{path:part.src,line:1,hash:hash(canonical)}]});}
 assert.equal(current.records.length,old.records.length);const inverse=structuredClone(current);let changed=0,bindings=0;const glyphSites=new Set(['public/__sim.html:1166','public/__sim.html:1167','public/__sim.html:1176','public/offline.html:312','public/offline.html:313','public/offline.html:322']);
 for(const[i,row]of current.records.entries()){const previous=old.records[i],update=updates.get(row.path);if(!update){assert.deepEqual(row,previous,'Unexpected report content: unrelated argument changed during the public contract refresh');continue;}assert.equal(row.decision,'central-source-verified');assert.equal(row.ruleId,'central-copy');assert.equal(row.sourceHash,update.sourceHash);assert.deepEqual(row.evidence,update.evidence);const restored={...row,sourceHash:previous.sourceHash,evidence:previous.evidence};if(row.value!==previous.value){assert(glyphSites.has(row.path+':'+row.line));assert.equal(row.kind,'css-declaration');assert(['width','height'].includes(row.property));assert(['16px','12px'].includes(previous.value));assert.equal(row.value,previous.value==='16px'?'var(--qd-choice-glyph-size)':'calc(var(--qd-choice-glyph-size) * .75)');const {path,sourceHash,argumentHash,originalStatus,decision,ruleId,reason,evidence,...argument}=row;assert.equal(argumentHash,hash(JSON.stringify(argument)));restored.value=previous.value;restored.argumentHash=previous.argumentHash;bindings++;}assert.deepEqual(restored,previous,'Only twelve already distributed choice-glyph bindings may change public argument semantics');inverse.records[i]=previous;changed++;}
 assert.equal(changed,2940);assert.equal(bindings,12);assert.equal(current.fileHashes.length,old.fileHashes.length);for(const[i,f]of current.fileHashes.entries()){const previous=old.fileHashes[i];assert.equal(f.path,previous.path);assert.equal(f.hash,updates.get(f.path)?.sourceHash??previous.hash);inverse.fileHashes[i]=previous;}
 assert.deepEqual(inverse,old,'All classifications, values, source positions and other files remain exact');return old;
}
