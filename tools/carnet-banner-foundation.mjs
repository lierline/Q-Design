import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {hash} from './style-arguments-core.mjs';
export const bannerAppendix='.qd-demo-banner-content { display: flex; flex-wrap: wrap; align-items: center; gap: var(--qd-space-1-5) var(--qd-space-4); max-width: var(--qd-work-max); margin-inline: auto; padding: var(--qd-space-2) var(--qd-space-5); }\n@media (max-width: 640px) {\n  .qd-demo-banner-content { display: grid; grid-template-columns: minmax(0, 1fr); justify-items: start; gap: var(--qd-space-2); }\n  .qd-demo-banner-content > p { width: 100%; }\n}\n';
const previousHash='18c3f160f618991cdd662203d0cf0e753f82a2f92134d510adc2659a3b9e6ad1';
export function beforeBannerFoundation(source){
 source=source.replaceAll('\r\n','\n');if(hash(source)===previousHash)return source;
 assert(source.endsWith(bannerAppendix),'Exact new responsive banner recipe only');const before=source.slice(0,-bannerAppendix.length);assert.equal(hash(before),previousHash,'Every earlier declaration must remain byte-identical');return before;
}
export function beforeBannerDist(source){
 source=source.replaceAll('\r\n','\n');const old=execFileSync('git',['show','830fa9d:dist/q-design.foundation.carnet.css'],{cwd:'D:/Claude/Q-Design',encoding:'utf8'}).replaceAll('\r\n','\n');if(source===old)return old;
 const recipe=execFileSync('git',['show','830fa9d:patterns/foundation/carnet.css'],{cwd:'D:/Claude/Q-Design',encoding:'utf8'}).replaceAll('\r\n','\n');assert.equal(hash(recipe),previousHash);assert.equal(old.split(recipe.trimEnd()).length,2);
 assert.equal(source,old.replace(recipe.trimEnd(),(recipe+bannerAppendix).trimEnd()),'Only the exact banner recipe may enter the generated foundation');return old;
}
export function beforeBannerCopy(source){
 source=source.replaceAll('\r\n','\n');const current=fs.readFileSync('D:/Claude/Q-Design/dist/q-design.foundation.carnet.css','utf8').replaceAll('\r\n','\n'),before=beforeBannerDist(current);
 assert.equal(source.split(current).length,2);assert.equal(source.split('q-design-nav-sha256: '+hash(current)).length,2);
 return source.replace(current,before).replace('q-design-nav-sha256: '+hash(current),'q-design-nav-sha256: '+hash(before));
}
export function beforeBannerUtilityInventory(current){
 const p=JSON.parse(fs.readFileSync('D:/Claude/Q-Design/reviews/carnet-banner-utility-migration.json','utf8')),serialize=j=>JSON.stringify(j,null,2)+'\n';
 assert.equal(hash(serialize(current)),p.afterHash);assert.equal(p.index,227);assert.deepEqual(p.row,{file:'components/demo-banner.tsx',line:71,original:'max-w-[1400px]',replacement:'max-w-[var(--qd-work-max)]',variable:'--qd-work-max',scope:'screen'});
 const before=structuredClone(current);before.occurrences.splice(p.index,0,p.row);assert.equal(hash(serialize(before)),p.beforeHash);return before;
}
