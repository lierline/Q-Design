import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {hash} from './style-arguments-core.mjs';
const qd='D:/Claude/Q-Design',qa='D:/Claude/Q-Atelier';
const file='app/(app)/assessments/new/page.tsx';
const ts=createRequire(qa+'/package.json')('typescript');
const before=fs.readFileSync(qa+'/'+file,'utf8');
const sf=ts.createSourceFile(file,before,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const edits=[];
function visit(node){
 if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(sf)==='button'){
  const attrs=node.openingElement.attributes.properties;
  const style=attrs.find(a=>ts.isJsxAttribute(a)&&a.name.text==='style');
  if(style?.getText(sf).includes('...choiceLook(val ===')){
   const cls=attrs.find(a=>ts.isJsxAttribute(a)&&a.name.text==='className');
   assert.equal(cls?.initializer?.text,'qa-touch-44');
   edits.push({start:cls.initializer.getStart(sf),before:cls.initializer.getText(sf),after:'"qa-touch-44 qd-choice"'});
  }
 }
 ts.forEachChild(node,visit);
}
visit(sf);assert.equal(edits.length,2);
let after=before;for(const e of [...edits].sort((a,b)=>b.start-a.start))after=after.slice(0,e.start)+e.after+after.slice(e.start+e.before.length);
let shift=0;for(const e of edits.sort((a,b)=>a.start-b.start)){e.start+=shift;shift+=e.after.length-e.before.length;}
const report={version:1,scope:'Only the two R&D impact selection buttons receive the shared choice class. Their conditions, handlers, labels and inline styles are unchanged. Shared 36px compact / 44px coarse-pointer minimum prevents the check glyph from changing height.',records:[{path:file,beforeHash:hash(before),afterHash:hash(after),edits:edits.sort((a,b)=>a.start-b.start)}]};
if(process.argv.includes('--write')){fs.writeFileSync(qa+'/'+file,after);fs.writeFileSync(qd+'/reviews/atelier-choice-contract-migration.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));
