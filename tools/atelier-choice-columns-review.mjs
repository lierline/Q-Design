import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createParameterLeafReview,verifiedParameterLeaves} from './atelier-parameter-leaves-review.mjs';
import {primitiveFlowType} from './atelier-primitive-leaves.mjs';
import {createAtelierProofContext} from './atelier-proof-context.mjs';
import {expressionProof,localBindings,sourceImports} from './atelier-style-proof.mjs';
import {hash,runtimeFiles} from './style-arguments-core.mjs';
import {verifiesChoiceInventoryWithOfflineRevision} from './atelier-offline-cache-inventory.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Atelier',file='app/(app)/m/field-ui.tsx';
const target=[file,'ChoiceGroup','columns'],manifest=root+'/reviews/atelier-choice-columns-review.json';
export const choiceInventory=()=>hash(JSON.stringify(runtimeFiles(product).filter(p=>/\.[jt]sx?$/.test(p)).map(p=>[p,hash(fs.readFileSync(product+'/'+p,'utf8'))])));
export function createChoiceColumnsReview(){
 const review=createParameterLeafReview(product,[target]);
 return {...review,inventoryHash:choiceInventory()};
}
export function verifiedChoiceColumns(ts,sf,review){
 if(sf.fileName!==file)return [];
 assert(verifiesChoiceInventoryWithOfflineRevision(review.inventoryHash),'Complete caller/source inventory changed');
 assert.equal(review.flows.length,1);const flow=review.flows[0];
 assert.deepEqual([flow.path,flow.component,flow.prop],target);
 const currentHash=p=>!p||path.isAbsolute(p)||p.split(/[\\/]/).includes('..')?null:fs.existsSync(product+'/'+p)?hash(fs.readFileSync(product+'/'+p,'utf8')):null;
 const leaves=verifiedParameterLeaves(flow,currentHash);assert(leaves&&flow.callers.length===6,'Every caller and reference must be indexed');
 assert.equal(primitiveFlowType(ts,sf,flow),'number');
 const declarations=[];const visit=n=>{if(ts.isFunctionDeclaration(n)&&n.name?.text===flow.component&&sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1===flow.declarationLine)declarations.push(n);ts.forEachChild(n,visit);};visit(sf);
 assert.equal(declarations.length,1);
 const binding=declarations[0].parameters.flatMap(p=>ts.isObjectBindingPattern(p.name)?p.name.elements:[]).find(b=>b.getText(sf)===flow.binding);
 assert(binding?.initializer&&binding.initializer.getText(sf)===flow.defaultValue);
 const context=createAtelierProofContext({expanded:true}),locals=localBindings(ts,sf,hash,context.references);
 const proof=expressionProof({ts,node:binding.initializer,sf,property:'columns',imports:sourceImports(ts,sf),file,references:context.references,variables:context.variables,locals,reviewedNodes:new Map(),extendedAliases:true});
 assert(proof?.central,'The authored default requires its own complete central proof');
 return leaves.map(leaf=>({...leaf,proof:{...leaf.proof,primitiveType:'number'}}));
}
export function addChoiceColumnsNodes(ts,sf,nodes){
 if(sf.fileName!==file||!fs.existsSync(manifest))return nodes;
 const leaves=verifiedChoiceColumns(ts,sf,JSON.parse(fs.readFileSync(manifest,'utf8'))),bindings=new Map(leaves.map(l=>[`${l.start}:${l.end}:${l.text}`,l.proof]));
 const visit=n=>{if(ts.isIdentifier(n)){const proof=bindings.get(`${n.getStart(sf)}:${n.end}:${n.text}`);if(proof)nodes.set(n,proof);}ts.forEachChild(n,visit);};visit(sf);return nodes;
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const review=createChoiceColumnsReview();
 if(process.argv.includes('--write'))fs.writeFileSync(manifest,JSON.stringify(review,null,2)+'\n');
 else {
  const saved=JSON.parse(fs.readFileSync(manifest,'utf8'));
  assert(verifiesChoiceInventoryWithOfflineRevision(saved.inventoryHash),'Complete caller/source inventory changed');
  assert.deepEqual(saved,{...review,inventoryHash:saved.inventoryHash});
 }
 const {ts}=createAtelierProofContext(),sf=ts.createSourceFile(file,fs.readFileSync(product+'/'+file,'utf8'),99,true,4);
 const leaves=verifiedChoiceColumns(ts,sf,review);
 console.log(JSON.stringify({flows:1,callers:review.flows[0].callers.length,leaves:leaves.length}));
}
