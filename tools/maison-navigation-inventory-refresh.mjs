import fs from 'node:fs';
import {beforeContractHintSource} from './maison-contract-hint-copy.mjs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,runtimeFiles} from './style-arguments-core.mjs';
import {createCurrentMaisonNavigation} from './maison-current-navigation.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',ref='1e27ab26c9900690a1013d0f4b5bcb541341a7c4',reviewRef='712ccc1c47f21f803f969fedfdb0d816548cf4d0';
export function beforeNavigationInventory(current){
 const old=JSON.parse(execFileSync('git',['show',reviewRef+':reviews/maison-current-navigation-review.json'],{cwd:root,encoding:'utf8'}));if(JSON.stringify(current)===JSON.stringify(old))return current;
 const inverse={...current,inventoryHash:old.inventoryHash};assert.deepEqual(inverse,old,'All 147 navigation destinations, labels, classes, positions, source hashes and canonical recipe must remain exact');
 const files=runtimeFiles(repo).filter(p=>p.startsWith('app/')&&p.endsWith('.tsx'));assert(files.every(f=>!/[\r\n]/.test(f)));const blobs=execFileSync('git',['cat-file','--batch'],{cwd:repo,input:files.map(f=>ref+':'+f+'\n').join(''),maxBuffer:64*1024*1024});let offset=0;for(const file of files){const end=blobs.indexOf(10,offset),header=blobs.subarray(offset,end).toString('utf8'),match=header.match(/^[0-9a-f]{40} blob (\d+)$/);assert(match,'Pinned app source missing: '+file);const size=Number(match[1]),expected=blobs.subarray(end+1,end+1+size).toString('utf8');assert.equal(hash(beforeContractHintSource(file,fs.readFileSync(repo+'/'+file,'utf8'))),hash(expected),'A changed live app source requires a new navigation inventory review: '+file);offset=end+1+size+1;}assert.equal(offset,blobs.length);
 assert.deepEqual(current,createCurrentMaisonNavigation());return old;
}
