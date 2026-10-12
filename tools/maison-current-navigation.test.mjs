import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createCurrentMaisonNavigation} from './maison-current-navigation.mjs';
import {beforeClass,afterClass} from './maison-back-navigation.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Works';
test('the entire current app inventory binds every inspected central parent-navigation link',()=>{
 const saved=JSON.parse(fs.readFileSync(root+'/reviews/maison-current-navigation-review.json','utf8')),current=createCurrentMaisonNavigation();
 assert.deepEqual(current,saved);assert(current.records.length>0);
 assert.equal(new Set(current.records.map(r=>r.path+':'+r.line)).size,current.records.length);
});
test('a legacy appearance, changed renderer or omitted consumer cannot inherit current navigation evidence',()=>{
 const saved=JSON.parse(fs.readFileSync(root+'/reviews/maison-current-navigation-review.json','utf8')),file=saved.records[0].path,code=fs.readFileSync(product+'/'+file,'utf8');
 assert.throws(()=>createCurrentMaisonNavigation(new Map([[file,code.replace(afterClass,beforeClass)]])),/Legacy/);
 assert.throws(()=>createCurrentMaisonNavigation(new Map([[file,code.replace('"next/link"','"unreviewed/link"')]])));
 const changed=createCurrentMaisonNavigation(new Map([[file,code.replace(afterClass,'w-fit')]]));
 assert.notEqual(changed.inventoryHash,saved.inventoryHash);assert.notEqual(changed.records.length,saved.records.length);
});
