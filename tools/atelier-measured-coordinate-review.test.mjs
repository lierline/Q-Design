import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {hash,scanArguments,cssProperties} from './style-arguments-core.mjs';
import {verifiedConsumerReview} from './atelier-style-manual.mjs';
import {PARTS} from './sync-parts.mjs';
import {centralOutputs,copyProblems} from './audit-coverage-core.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),product=path.resolve(root,'../Q-Atelier');
const req=createRequire(path.join(product,'package.json')),ts=req('typescript'),postcss=req('postcss');
const properties=cssProperties(ts,fs.readFileSync(path.join(path.dirname(req.resolve('typescript')),'lib.dom.d.ts'),'utf8'));
const review=JSON.parse(fs.readFileSync(path.join(root,'reviews/atelier-measured-coordinate-review.json'),'utf8'));
const read=file=>fs.readFileSync(path.join(file.startsWith('source/')?root:product,file),'utf8');
const currentHash=file=>hash(read(file));
test('each measured-coordinate boundary matches its current AST, definitions and central runtime copy',()=>{
 assert.equal(review.records.length,18);const scans=new Map();
 for(const r of review.records){
  if(!scans.has(r.path))scans.set(r.path,scanArguments(r.path,read(r.path),{ts,postcss,properties}));
  const args=scans.get(r.path).filter(a=>a.line===r.line&&a.kind===r.kind&&a.property===r.property&&a.value===r.reviewedExpression);
  assert.equal(args.length,1,r.path+':'+r.line);assert.equal(hash(JSON.stringify(args[0])),r.argumentHash);
  assert.ok(verifiedConsumerReview(r,r,currentHash));
  for(const ev of r.evidence)assert.equal(read(ev.path).split(/\r?\n/)[ev.line-1],ev.inspectedLine);
 }
 const part=centralOutputs(PARTS,'Q-Atelier',product).find(p=>p.path==='lib/design/q-design-runtime.ts');
 assert.ok(part);assert.deepEqual(copyProblems(part,read(part.src),read(part.path)),[]);
});
test('source or central offset changes invalidate the exact prior coordinate decision',()=>{
 const row=review.records.find(r=>r.path==='components/Coachmark.tsx');
 assert.equal(verifiedConsumerReview(row,row,p=>p===row.path?hash('new raw offset'):currentHash(p)),null);
 assert.equal(verifiedConsumerReview(row,row,p=>p==='source/design/atelier-runtime.ts'?hash('changed central geometry'):currentHash(p)),null);
});
test('the actual coachmark calculator follows both DOM movement and central gap mutations',()=>{
 const sf=ts.createSourceFile('coach.tsx',read('components/Coachmark.tsx'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const fn=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='calcPosition');assert.ok(fn);
 const runtime=ts.createSourceFile('runtime.ts',read('source/design/atelier-runtime.ts'),ts.ScriptTarget.Latest,true);let geometry;
 const visit=n=>{if(ts.isPropertyAssignment(n)&&n.name.getText(runtime).replaceAll('"','')==='coachmarkGeometry')geometry=JSON.parse(n.initializer.getText(runtime));ts.forEachChild(n,visit);};visit(runtime);assert.ok(geometry);
 const script=ts.transpileModule(fn.getText(sf)+'\ncalcPosition(rect, "right");',{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
 const calculate=(rect,changes={})=>JSON.parse(JSON.stringify(vm.runInNewContext(script,{rect,QDPresentation:{coachmarkGeometry:{...geometry,...changes}}})));
 const rect={left:100,right:140,top:80,bottom:100,width:40,height:20};
 assert.deepEqual(calculate(rect),{top:40,left:152});
 assert.deepEqual(calculate(rect,{targetGap:20}),{top:40,left:160});
 assert.deepEqual(calculate({...rect,right:200},{targetGap:20}),{top:40,left:220});
});
