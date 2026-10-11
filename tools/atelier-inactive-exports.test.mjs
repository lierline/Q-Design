import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createRequire} from 'node:module';import {inactiveExportGroup} from './atelier-inactive-exports.mjs';
const ts=createRequire('D:/Claude/Q-Atelier/package.json')('typescript');
function fixture(consumer,extra=''){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'qd-inactive-'));
 try{fs.writeFileSync(path.join(root,'tokens.ts'),`export const TYPE={body:{fontSize:14}};export function typeStyle(){return TYPE.body};export function goldTextStyle(){return {color:'gold'}};export const FS=12;${extra}`);fs.writeFileSync(path.join(root,'consumer.tsx'),consumer);return inactiveExportGroup({ts,root,files:['tokens.ts','consumer.tsx'],target:'tokens.ts',names:['TYPE','typeStyle','goldTextStyle']});}
 finally{assert(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep+'qd-inactive-'));fs.rmSync(root,{recursive:true,force:true});}
}
test('unused imports, comments and erased type queries are inactive',()=>{assert(fixture("import {TYPE,typeStyle} from './tokens';type T=typeof TYPE; // TYPE.body\nexport const x=1;").inactive);});
test('an aliased JSX consumer and a live function call invalidate the proof',()=>{assert(!fixture("import {TYPE as F} from './tokens';export const x=<div style={F.body}/>;").inactive);assert(!fixture("import {typeStyle as style} from './tokens';export const x=style();").inactive);});
test('unrelated static namespace members remain allowed, dynamic or escaped namespaces fail closed',()=>{assert(fixture("import * as T from './tokens';export const x=T.FS;").inactive);for(const use of ['T.TYPE.body',"T['TYPE']",'T[name]','send(T)'])assert(!fixture(`import * as T from './tokens';declare const name:string;declare function send(x:unknown):unknown;export const x=${use};`).inactive);});
test('a reference from another token export cannot hide an indirect UI use',()=>{assert(!fixture("import {live} from './tokens';export const x=live();",'export function live(){return TYPE.body}').inactive);});
test('dynamic loading blocks the group even before a property is inspected',()=>{assert(!fixture("export const x=import('./tokens');").inactive);});
