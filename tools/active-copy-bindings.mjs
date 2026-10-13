import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {deriveHonorific,inspectHonorific} from './carnet-honorific-review.mjs';
const root='D:/Claude/Q-Design',ref='17b688785d17156dc1a8febb1110f06d83655f3b',read=p=>fs.readFileSync(root+'/'+p,'utf8'),show=(pin,p)=>execFileSync('git',['show',pin+':'+p],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});
export function inspectActiveCopyBindings(overrides={}){
 const legacy=overrides.legacy??read('dist/q-design.copy-bindings.json'),active=overrides.active??read('dist/q-design.copy-bindings.current.json');
 assert.equal(hash(legacy),hash(show('12d9deb00166911c7f249d7532ebf261774a8661','dist/q-design.copy-bindings.json')),'Historical binding snapshot changed');
 assert.equal(hash(active),hash(show(ref,'dist/q-design.copy-bindings.json')),'Active complete binding index changed without review');assert.deepEqual(JSON.parse(active),deriveHonorific().bindings);inspectHonorific();
 const file='tools/copy-spacing.mjs',before=show(ref,file),from="const out=root+'/dist/q-design.copy-bindings.json';",to="const out=root+'/dist/q-design.copy-bindings.current.json';";assert.equal(before.split(from).length-1,1);assert.equal(hash(overrides.pipeline??read(file)),hash(before.replace(from,to)),'Only the active output path changes in the pipeline');
 const helper='tools/carnet-honorific-review.mjs',oldHelper=show(ref,helper),expected=oldHelper.replaceAll("root+'/dist/q-design.copy-bindings.json'","root+'/dist/q-design.copy-bindings.current.json'");assert.equal(oldHelper.split("root+'/dist/q-design.copy-bindings.json'").length-1,2);assert.equal(hash(read(helper)),hash(expected),'Honorific inspection and writes must use the active index');return{legacyHash:hash(legacy),activeHash:hash(active),files:JSON.parse(active).files.length};
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url))console.log(JSON.stringify({...inspectActiveCopyBindings(),passed:true}));
