import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {inspectConnections} from './all-screen-connections.mjs';
function fixture(run){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'qd-root-connections-'));try{
 const write=(name,text)=>{const file=path.join(dir,'app',name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text);};
 write('layout.tsx',"import './globals.css'; export default function Layout(){return null;}");
 write('globals.css',['foundation','components','palette'].map(s=>`@import './q-design.${s}.css';`).join('\n'));
 for(const s of ['foundation','components','palette'])write(`q-design.${s}.css`,':root {}');
 write('(work)/records/[id]/page.tsx','export default function Page(){return null;}');
 write('(work)/records/[id]/loading.tsx','export default function Loading(){return null;}');
 run(dir,write);
 }finally{assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));assert.ok(path.basename(dir).startsWith('qd-root-connections-'));fs.rmSync(dir,{recursive:true,force:true});}}
test('nested and dynamic route UI inherits the root CSS but global-error must load it independently',()=>fixture((dir,write)=>{
 let report=inspectConnections(dir,'fixture');assert.equal(report.connected,3);assert.equal(report.missing.length,0);
 write('global-error.tsx',"'use client'; export default function Error(){return null;}");
 report=inspectConnections(dir,'fixture');assert.equal(report.connected,3);assert.equal(report.surfaces,4);assert.equal(report.missing.length,3);
 write('global-error.tsx',"'use client'; import './globals.css'; export default function Error(){return null;}");
 report=inspectConnections(dir,'fixture');assert.equal(report.connected,4);assert.equal(report.missing.length,0);
}));
test('commented CSS imports cannot pass and removing one canonical import fails closed',()=>fixture((dir,write)=>{
 write('layout.tsx',"// import './globals.css';\nexport default function Layout(){return null;}");
 assert.equal(inspectConnections(dir,'fixture').missing.length,3);
 write('layout.tsx',"import './globals.css'; export default function Layout(){return null;}");
 write('globals.css',"@import './q-design.components.css'; @import './q-design.foundation.css';");
 const report=inspectConnections(dir,'fixture');assert.equal(report.missing.length,1);assert.equal(report.missing[0].missing,'q-design.palette.css');
}));
