import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {hash} from './style-arguments-core.mjs';import {primitiveFlowType} from './atelier-primitive-leaves.mjs';
const ts=createRequire('D:/Claude/Q-Atelier/package.json')('typescript');
function inspect(code,prop='color'){const sf=ts.createSourceFile('components/fixture.tsx',code,99,true,4),fn=sf.statements.find(ts.isFunctionDeclaration),binding=fn.parameters[0].name.elements.find(e=>(e.propertyName??e.name).getText(sf)===prop),flow={path:sf.fileName,sourceHash:hash(code),component:fn.name.text,declarationLine:sf.getLineAndCharacterOfPosition(fn.getStart(sf)).line+1,prop,binding:binding.getText(sf)};return {sf,flow,kind:primitiveFlowType(ts,sf,flow)};}
test('exact local primitive contracts identify scalar shape without approving values',()=>{
 assert.equal(inspect('function Item({color}:{color?:string}){return color}').kind,'string');
 assert.equal(inspect('interface Props{size?:number;}function Item({size=913}:Props){return size}','size').kind,'number');
 assert.equal(inspect('type Props={color:string|number|null};function Item({color}:Props){return color}').kind,'mixed');
 assert.equal(inspect('function Item({color:c="red"}:{color?:string}){return c}').kind,'string');
});
test('objects, unknown imported types, any, arrays and incomplete unions are never primitive contracts',()=>{
 for(const type of ['object','any','unknown','string[]','string|{nested:string}','CSSProperties'])assert.equal(inspect(`function Item({color}:{color:${type}}){return color}`).kind,null);
});
test('a changed source, declaration, binding, renderer or property invalidates the type shape proof',()=>{
 const {sf,flow}=inspect('function Item({color}:{color:string}){return color}');for(const change of [{sourceHash:'wrong'},{path:'other.tsx'},{declarationLine:2},{component:'Other'},{prop:'size'},{binding:'color=913'}])assert.equal(primitiveFlowType(ts,sf,{...flow,...change}),null);
});
