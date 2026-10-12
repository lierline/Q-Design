import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile, replaceClassLiterals } from './maison-layout-tokens.mjs';
import {verifyLayoutRetirement} from './maison-layout-handoff-history.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const plan=JSON.parse(readFileSync(resolve(root,'reviews/maison-layout-migration.json'),'utf8'));
const central=readFileSync(resolve(root,'patterns/foundation/maison.css'),'utf8');
const normalized=value=>value.replace(/\s+/g,'').replaceAll(',0fr',',0');

test('every migrated class emits the same property and exact current layout value through the central variable',async()=>{
  const classes=plan.entries.flatMap(entry=>[entry.original,entry.replacement]);
  const compiled=await compile(classes);
  for(const entry of plan.entries){
    assert.deepEqual(compiled.get(entry.original),[[entry.property,entry.value]],entry.original);
    const declarations=compiled.get(entry.replacement);
    assert.ok(declarations?.length,`No CSS generated for ${entry.replacement}`);
    assert.equal(declarations.length,1);
    assert.equal(declarations[0][0],entry.property);
    assert.equal(normalized(declarations[0][1]),`var(${entry.token})`,entry.replacement);
    assert.ok(central.includes(`${entry.token}: ${entry.value};`),entry.token);
  }
});
test('migration touches only the reviewed literal line, not same-looking business text or a dynamic expression',()=>{
  const code='const help="min-w-[760px]";\nconst x=<div className="min-w-[760px] p-4"/>;\nconst y=<div className={`min-w-[${width}px]`}/>;';
  const result=replaceClassLiterals(code,'x.tsx',[['min-w-[760px]','min-w-[var(--qd-width)]','unused',2]]);
  assert.equal(result.code,'const help="min-w-[760px]";\nconst x=<div className="min-w-[var(--qd-width)] p-4"/>;\nconst y=<div className={`min-w-[${width}px]`}/>;');
  assert.equal(result.count,1);
});
test('every reviewed product site contains its new token and preserves responsive variants',()=>{
  const retirements=JSON.parse(readFileSync(resolve(root,'reviews/maison-layout-handoff-retirements.json'),'utf8'));
  for(const entry of plan.entries)for(const site of entry.sites){
    const retired=retirements.records.find(r=>r.path===site.path&&r.line===site.line&&r.replacement===entry.replacement);
    if(retired){assert(verifyLayoutRetirement(entry,site,retired));continue;}
    const source=readFileSync(resolve(root,'../Q-Works',site.path),'utf8');
    if(site.retired){assert.equal(site.reason,'Current central empty-state canon removed decorative glyphs on 2026-09-28.');assert.ok(!source.includes(entry.replacement));continue;}
    assert.ok(source.includes(entry.replacement),`${site.path} (migration origin line ${site.line})`);
    assert.equal(entry.replacement.split(':').slice(0,-1).join(':'),entry.original.split(':').slice(0,-1).join(':'));
  }
});
test('transition and overlay animation defaults use the central motion variable',async()=>{
  const compiled=await compile(['transition-[r]','data-[state=open]:animate-in']);
  assert.ok(compiled.get('transition-[r]').some(([p,v])=>p==='transition-duration'&&v==='var(--qd-maison-motion-default)'));
  assert.ok(compiled.get('data-[state=open]:animate-in').some(([p,v])=>p==='animation-duration'&&v==='var(--qd-maison-motion-default)'));
  assert.ok(central.includes('--qd-maison-motion-default: 150ms;'));
});
