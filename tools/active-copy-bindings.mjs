import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {applyBindings,termsForFile} from './copy-spacing.mjs';
import {implementationOwners} from './build-component-implementations.mjs';
import {inspectHonorific} from './carnet-honorific-review.mjs';
const root='D:/Claude/Q-Design',ref='17b688785d17156dc1a8febb1110f06d83655f3b',read=p=>fs.readFileSync(root+'/'+p,'utf8'),show=(pin,p)=>execFileSync('git',['show',pin+':'+p],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});
const repos={atelier:'Q-Atelier',maison:'Q-Works',carnet:'DHR'};
export function inspectActiveCopyBindings(overrides={}){
 const legacy=overrides.legacy??read('dist/q-design.copy-bindings.json'),activeText=overrides.active??read('dist/q-design.copy-bindings.current.json');assert.equal(hash(legacy),hash(show('12d9deb00166911c7f249d7532ebf261774a8661','dist/q-design.copy-bindings.json')),'Historical binding snapshot changed');
 const active=JSON.parse(activeText);assert.deepEqual(Object.keys(active).sort(),['files','rules','version']);assert.equal(active.version,1);assert.equal(active.rules,'patterns/copy-rules.current.json');assert(Array.isArray(active.files));
 const rules=JSON.parse(read(active.rules)),terms=[...rules.terms];for(const file of rules.additionalRuleFiles??[]){assert(/^patterns\/[a-z0-9-]+\.json$/.test(file));const extra=JSON.parse(read(file));assert.equal(extra.version,1);assert(Array.isArray(extra.terms));terms.push(...extra.terms);}
 const owners=implementationOwners(root),keys=new Set(),baseline=JSON.parse(show(ref,'dist/q-design.copy-bindings.json'));
 for(const row of active.files){assert(repos[row.product]);assert(typeof row.path==='string'&&!row.path.startsWith('/')&&!row.path.includes('..')&&!row.path.includes('\\'));const key=row.product+':'+row.path;assert(!keys.has(key));keys.add(key);const canonical=owners.get(key);assert.deepEqual(Object.keys(row).sort(),canonical?['bindings','canonical','path','product']:['bindings','path','product']);assert.equal(row.canonical,canonical);assert(Array.isArray(row.bindings));const locations=new Set();
  for(const b of row.bindings){assert.deepEqual(Object.keys(b).sort(),['emitted','kind','line','ordinal','original']);assert(Number.isInteger(b.line)&&b.line>0&&Number.isInteger(b.ordinal)&&b.ordinal>=0);assert(typeof b.original==='string'&&typeof b.emitted==='string');const location=b.line+':'+b.kind+':'+b.ordinal;assert(!locations.has(location));locations.add(location);}
  const before=readProduct(row,canonical),result=applyBindings(row.path,before,row.bindings,termsForFile(terms,row.product,row.path));assert.equal(result.changes.length,0,'Active binding or central copy is not synchronized: '+key);
  const old=baseline.files.find(f=>f.product===row.product&&f.path===row.path),remaining=[...(row.bindings??[])];for(const b of old?.bindings??[]){const i=remaining.findIndex(c=>c.kind===b.kind&&c.original===b.original);assert(i>=0,'An existing binding was dropped: '+key);remaining.splice(i,1);}for(const b of remaining)assert(termsForFile(terms,row.product,row.path).some(t=>b.original.includes(t.from)),'New bindings must derive from an applicable central rule');
 }
 for(const old of baseline.files)assert(keys.has(old.product+':'+old.path),'A previously bound file was dropped');
 const file='tools/copy-spacing.mjs',before=show(ref,file),expected=before.replace("const out=root+'/dist/q-design.copy-bindings.json';","const out=root+'/dist/q-design.copy-bindings.current.json';").replace("root+'/patterns/copy-rules.json'","root+'/patterns/copy-rules.current.json'").replace("rules:'patterns/copy-rules.json'","rules:'patterns/copy-rules.current.json'");assert.equal(hash(overrides.pipeline??read(file)),hash(expected),'Only active rule and binding paths may change in the pipeline');inspectHonorific();return{legacyHash:hash(legacy),activeHash:hash(activeText),files:active.files.length};
}
function readProduct(row,canonical){return fs.readFileSync(canonical?root+'/'+canonical:'D:/Claude/'+repos[row.product]+'/'+row.path,'utf8');}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url))console.log(JSON.stringify({...inspectActiveCopyBindings(),passed:true}));
