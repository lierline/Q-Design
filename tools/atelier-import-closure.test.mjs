import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {adapterImportClosure} from './atelier-import-closure.mjs';import {collectAdapterReferences,expressionProof,localBindings,sourceImports} from './atelier-style-proof.mjs';import {hash} from './style-arguments-core.mjs';
const ts=createRequire('D:/Claude/Q-Atelier/package.json')('typescript');
test('actual static local imports and re-exports add existing modules in stable order only',()=>{
 const files=new Map([['app/view.tsx','import {X} from "@/lib/status";import Unknown from "external";import type{T}from "../lib/type";'],['lib/status.ts','export {Y}from "./inner";'],['lib/type.ts','export type T=string;'],['lib/inner.ts','export const Y=unknown;']]);
 assert.deepEqual(adapterImportClosure({ts,files,seeds:['lib/base.ts','lib/base.ts']}),['lib/base.ts','lib/status.ts','lib/type.ts','lib/inner.ts']);
});
test('missing modules, dynamic imports and paths outside the source inventory do not grant discovery',()=>{
 const files=new Map([['app/view.tsx','import{x}from "../../outside";import{y}from "@/../outside";import{z}from "./missing";const a=import(path);const b=require(path);'],['outside.ts','export const x=1;']]);assert.deepEqual(adapterImportClosure({ts,files,seeds:[]}),[]);
});
test('discovered exports still require every visual branch and reject mutations and caller colors',()=>{
 const variables=new Map([['--qd-text',{path:'central.css',line:1,hash:'css'}]]);
 const prove=body=>{const files=new Map([['lib/domain.ts',body],['app/view.tsx','import{COLOR}from "@/lib/domain";const value=COLOR[state];']]),closure=adapterImportClosure({ts,files,seeds:[]}),references=collectAdapterReferences({ts,files:new Map(closure.map(p=>[p,files.get(p)])),variables,hash});const sf=ts.createSourceFile('app/view.tsx',files.get('app/view.tsx'),99,true,4);return expressionProof({ts,node:sf.statements.at(-1).declarationList.declarations[0].initializer,sf,property:'color',imports:sourceImports(ts,sf),file:sf.fileName,references,variables,locals:localBindings(ts,sf,hash,references)});};
 assert(prove('export const COLOR={ok:"var(--qd-text)",bad:"var(--qd-text)"};')?.central);
 for(const body of ['export const COLOR={ok:"var(--qd-text)",bad:"red"};','export const COLOR={ok:"var(--qd-text)",bad:callerColor};','export const COLOR={ok:"var(--qd-text)"};COLOR.ok="red";','export const COLOR={ok:"var(--qd-text)"};external(COLOR);'])assert.equal(prove(body),null);
});
