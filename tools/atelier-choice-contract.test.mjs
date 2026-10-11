import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {hash} from './style-arguments-core.mjs';
import {reverseChoiceContract} from './atelier-migration-inverse.mjs';
const qa='D:/Claude/Q-Atelier',qd='D:/Claude/Q-Design';
const ts=createRequire(qa+'/package.json')('typescript');
test('both impact choices use the shared recipe and every other source byte is preserved',()=>{
 const manifest=JSON.parse(fs.readFileSync(qd+'/reviews/atelier-choice-contract-migration.json','utf8'));
 assert.equal(manifest.records.length,1);
 const row=manifest.records[0],current=fs.readFileSync(qa+'/'+row.path,'utf8');
 assert.equal(hash(current),row.afterHash);
 assert.equal(hash(reverseChoiceContract(row.path,current)),row.beforeHash);
 assert.equal(row.edits.length,2);
 const sf=ts.createSourceFile(row.path,current,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 let count=0;
 const visit=n=>{if(ts.isJsxElement(n)&&n.openingElement.tagName.getText(sf)==='button'){
  const attrs=n.openingElement.attributes.properties;
  const style=attrs.find(a=>a.name?.text==='style');
  if(style?.getText(sf).includes('...choiceLook(val ===')){
   assert.equal(attrs.find(a=>a.name?.text==='className').initializer.text,'qa-touch-44 qd-choice');count++;
  }
 }ts.forEachChild(n,visit);};visit(sf);assert.equal(count,2);
});
