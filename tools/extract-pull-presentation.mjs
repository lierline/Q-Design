import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',req=createRequire(import.meta.url),ts=req('typescript');
export function pullPresentation(){
 const source=fs.readFileSync(root+'/source/design/atelier-runtime.ts','utf8'),sf=ts.createSourceFile('runtime.ts',source,99,true,3);let obj;const visit=n=>{if(ts.isVariableDeclaration(n)&&n.name.getText(sf)==='QDPresentation'){let value=n.initializer;while(ts.isAsExpression(value))value=value.expression;obj=value;}ts.forEachChild(n,visit);};visit(sf);assert(ts.isObjectLiteralExpression(obj));const member=(o,key)=>{assert(ts.isObjectLiteralExpression(o));const p=o.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(sf).replaceAll('"','')===key);assert(p,key);return p.initializer;};
 const pull=member(member(obj,'visual'),'pull'),numeric=(o,key)=>{const value=member(o,key);assert(ts.isNumericLiteral(value));return Number(value.text);};
 const top=[];req('postcss').parse(fs.readFileSync(root+'/patterns/foundation/atelier-values.css','utf8')).walkDecls('--qd-atelier-top-77d24710ad',d=>top.push(d.value));assert.equal(top.length,1);
 return {restOffset:numeric(pull,'restOffset'),fadeDistance:numeric(pull,'fadeDistance'),degreesPerPixel:numeric(pull,'degreesPerPixel'),iconSize:numeric(member(obj,'iconSize'),'18'),safeAreaTop:top[0]};
}
export function pullPresentationOutput(){return '// Generated from Q-Atelier canonical pull presentation. Gesture logic stays product-owned.\nexport const qdPull = '+JSON.stringify(pullPresentation(),null,2)+' as const;\n';}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){const file=root+'/dist/q-design.pull.ts',result=pullPresentationOutput();if(process.argv.includes('--check'))assert.equal(hash(fs.readFileSync(file,'utf8')),hash(result));else fs.writeFileSync(file,result);console.log(JSON.stringify({settings:5,passed:true}));}
