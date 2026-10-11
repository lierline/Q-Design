import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {hash} from './style-arguments-core.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const product=path.resolve(root,'../Q-Atelier');
const ts=createRequire(path.join(product,'package.json'))('typescript');
const review=JSON.parse(fs.readFileSync(path.join(root,'reviews/atelier-style-spread-review.json'),'utf8'));
const cache=new Map();
function source(file){
  if(!cache.has(file)){
    const full=path.resolve(product,file);
    assert.ok(full.startsWith(product+path.sep),'Evidence path stays inside the product');
    const code=fs.readFileSync(full,'utf8');
    cache.set(file,{code,sf:ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,file.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS)});
  }
  return cache.get(file);
}
function styleAncestor(node,sf){
  for(let p=node.parent;p;p=p.parent){
    if(ts.isJsxAttribute(p))return p.name.getText(sf)==='style';
    if((ts.isVariableDeclaration(p)||ts.isAsExpression(p)||ts.isSatisfiesExpression(p)||ts.isFunctionLike(p))&&p.type&&/CSSProperties\b/.test(p.type.getText(sf)))return true;
    if(ts.isFunctionLike(p)||ts.isJsxElement(p)||ts.isJsxSelfClosingElement(p))return false;
  }
  return false;
}

test('manual spread evidence binds to current source and the exact real AST spread',()=>{
  const seen=new Set();
  for(const entry of review.records){
    const key=JSON.stringify([entry.path,entry.line,entry.argumentHash]);
    assert.ok(!seen.has(key),'Duplicate exact path/argument identity '+key);seen.add(key);
    const {code,sf}=source(entry.path);
    assert.equal(hash(code),entry.sourceHash,'Re-review changed source '+entry.path);
    const matches=[];
    function walk(node){if(ts.isSpreadAssignment(node)&&sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1===entry.line&&node.expression.getText(sf)===entry.value)matches.push(node);ts.forEachChild(node,walk);}walk(sf);
    assert.ok(matches.length>0,'Missing actual spread '+entry.path+':'+entry.line);
    assert.ok(matches.every(n=>!styleAncestor(n,sf)),'A direct CSS spread must not receive a data/manual behavior classification '+entry.path+':'+entry.line);
    assert.ok(entry.evidence.length&&entry.reason&&entry.consumer);
    for(const evidence of entry.evidence)assert.equal(hash(source(evidence.path).code),evidence.hash,'Stale evidence '+evidence.path);
  }
});

test('reported visual spreads and changed evidence are excluded from approved records',()=>{
  const approved=new Set(review.records.map(r=>JSON.stringify([r.path,r.line,r.value])));
  for(const r of [...review.unapproved,...review.stale])assert.ok(!approved.has(JSON.stringify([r.path,r.line,r.value])),'Unresolved visual or changed-source entry was silently approved');
  assert.ok(review.unapproved.some(r=>r.path==='lib/export/docx-builder/utils.ts'&&r.value==='opts'),'DOCX options retain explicit unresolved appearance scope');
  assert.ok(review.unapproved.some(r=>r.path==='components/Avatar.tsx'&&r.value==='style'),'Caller style override remains subject to actual caller proof');
});

test('style-context guard distinguishes record state from inline and typed CSS mutations',()=>{
  const sf=ts.createSourceFile('fixture.tsx',`const state={...record,status:'done'}; const css: React.CSSProperties={...record}; const render=<div style={{...record}}/>;`,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const result=[];function walk(n){if(ts.isSpreadAssignment(n))result.push(styleAncestor(n,sf));ts.forEachChild(n,walk);}walk(sf);
  assert.deepEqual(result,[false,true,true]);
});
