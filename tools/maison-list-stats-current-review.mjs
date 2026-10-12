import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {beforeMaisonProductionCopy} from './maison-production-copy.mjs';
import {createStatsColumnsReview} from './maison-list-stats-columns-review.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',file='components/shared/list-stats.tsx';
export function inspectStatsHistory(current){
 const saved=JSON.parse(fs.readFileSync(root+'/reviews/maison-list-stats-columns-review.json','utf8')),code=fs.readFileSync(repo+'/'+file,'utf8'),before=beforeMaisonProductionCopy(file,code);
 assert.equal(current.records.length,1);assert.equal(current.records[0].sourceHash,hash(code));assert.equal(current.records[0].evidence[0].path,file);assert.equal(current.records[0].evidence[0].hash,hash(code));
 const inverse=structuredClone(current);inverse.records[0].sourceHash=hash(before);inverse.records[0].evidence[0].hash=hash(before);assert.deepEqual(inverse,saved,'Only the exact verified five-copy-literal ListStats source transition may extend the historical forwarding proof');return inverse;
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){inspectStatsHistory(await createStatsColumnsReview());console.log(JSON.stringify({records:1,sourceTransition:'exact-professional-copy',passed:true}));}
