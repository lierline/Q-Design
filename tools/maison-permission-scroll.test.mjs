import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const postcss=createRequire(new URL('../../Q-Works/package.json',import.meta.url))('postcss');
const source=fs.readFileSync(new URL('../patterns/components.css',import.meta.url),'utf8');
const root=postcss.parse(source);
function declarations(selector,print=false){
 const matches=[];
 root.walkRules(selector,r=>{const inPrint=r.parent.type==='atrule'&&r.parent.name==='media'&&r.parent.params==='print';if(inPrint===print)matches.push(r);});
 assert.equal(matches.length,1,selector);
 return Object.fromEntries(matches[0].nodes.filter(n=>n.type==='decl').map(d=>[d.prop,d.value]));
}
test('permission scroll height and header layering use mutable common rules',()=>{
 const vars={};root.walkRules(':root',r=>r.walkDecls(d=>{vars[d.prop]=d.value;}));
 const tall=declarations('.qd-table-scroll--tall'),head=declarations('.qd-table-scroll-header'),first=declarations('.qd-table-sticky-first');
 assert.equal(tall.overflow,'auto');assert.equal(tall['max-height'],'var(--qd-table-scroll-max-height)');
 assert.equal(head.position,'sticky');assert.equal(head.top,'0');assert.equal(head.background,'var(--qd-surface)');
 assert.equal(first.position,'sticky');assert.equal(first.left,'0');assert.equal(first.background,'var(--qd-surface)');
 assert.equal(first['z-index'],'calc(var(--qd-table-header-layer) - 1)');
 vars['--qd-table-scroll-max-height']='55dvh';vars['--qd-table-header-layer']='4';vars['--qd-surface']='rgb(17 23 31)';
 const resolve=v=>v.replace(/var\((--[\w-]+)\)/g,(_,key)=>vars[key]);
 assert.equal(resolve(tall['max-height']),'55dvh');assert.equal(resolve(head['z-index']),'4');
 assert.equal(resolve(first['z-index']),'calc(4 - 1)');assert.equal(resolve(head.background),'rgb(17 23 31)');
});
test('printing removes the scroll constraint and sticky positioning',()=>{
 assert.equal(declarations('.qd-table-scroll--tall',true)['max-height'],'none');
 assert.equal(declarations('.qd-table-scroll--tall',true).overflow,'visible');
 for(const selector of ['.qd-table-scroll-header','.qd-table-sticky-first','.qd-table-group-label'])assert.equal(declarations(selector,true).position,'static');
});

test('group labels anchor their content width instead of an oversized colspan cell',()=>{
 const label=declarations('.qd-table-group-label');
 assert.equal(label.display,'inline-block');assert.equal(label.position,'sticky');
 assert.equal(label.left,'var(--qd-space-3)');
 assert.equal(label.width,undefined);
 assert.equal(label.left.replace('var(--qd-space-3)','16px'),'16px');
});
