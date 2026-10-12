import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';
import {hash} from './style-arguments-core.mjs';import {retainNavigationEvidence} from './maison-back-navigation-evidence.mjs';
import {beforeBannerFoundation,beforeBannerDist,beforeBannerUtilityInventory,bannerAppendix} from './carnet-banner-foundation.mjs';
test('new banner recipe can be reversed only over the exact unchanged prior foundation',()=>{
 const before=execFileSync('git',['show','830fa9d:patterns/foundation/carnet.css'],{encoding:'utf8'});assert.equal(beforeBannerFoundation(before+bannerAppendix),before);
 for(const wrong of [(before+bannerAppendix).replace('gap: var(--qd-space-2)','gap: 17px'),before+bannerAppendix+'\n:root{color:red}',(before+bannerAppendix).replace('--qd-carnet-root-size: 16px','--qd-carnet-root-size: 17px')])assert.throws(()=>beforeBannerFoundation(wrong));
 const current=fs.readFileSync('dist/q-design.foundation.carnet.css','utf8');assert.notEqual(beforeBannerDist(current),current);assert.throws(()=>beforeBannerDist(current.replace('--qd-carnet-root-size: 16px','--qd-carnet-root-size: 17px')));
});
test('manual decisions never survive changed arguments or evidence lines',()=>{
 const argument={line:1,kind:'object-property',property:'content',value:'value'},before='const content=value;\nold class',after='const content=value;\nnew class',key=hash(JSON.stringify(['page.tsx',1,argument.kind,argument.property,argument.value]));
 const b={before,after,beforeHash:hash(before),afterHash:hash(after),oldArgs:new Map([[key,argument]]),newArgs:new Map([[key,argument]])},sources=new Map([['page.tsx',b]]),review={records:[{path:'page.tsx',line:1,argumentHash:key,sourceHash:b.beforeHash,evidence:[{path:'page.tsx',line:1,hash:b.beforeHash}]}]};
 const retained=retainNavigationEvidence(review,sources);assert.equal(retained.records[0].sourceHash,b.afterHash);assert.equal(review.records[0].sourceHash,b.beforeHash);
 assert.throws(()=>retainNavigationEvidence(review,new Map([['page.tsx',{...b,newArgs:new Map([[key,{...argument,value:'changed'}]])}]])));
 const changedLine=structuredClone(review);changedLine.records[0].evidence[0].line=2;assert.throws(()=>retainNavigationEvidence(changedLine,sources));
});
test('only the exact retired banner width occurrence can leave the utility ledger',()=>{
 const current=JSON.parse(fs.readFileSync('source/style-adapters/carnet-utility-values.json','utf8')),before=beforeBannerUtilityInventory(current);assert.equal(before.occurrences.length,current.occurrences.length+1);
 const altered=structuredClone(current);altered.occurrences[0].variable='--qd-other';assert.throws(()=>beforeBannerUtilityInventory(altered));
 const old=execFileSync('git',['show','8fcd78b:components/demo-banner.tsx'],{cwd:'D:/Claude/DHR',encoding:'utf8'}).replaceAll('\r\n','\n'),actual=fs.readFileSync('D:/Claude/DHR/components/demo-banner.tsx','utf8').replaceAll('\r\n','\n');
 assert.equal(actual,old.replace('mx-auto flex max-w-[var(--qd-work-max)] flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-2','qd-demo-banner-content'));
});
