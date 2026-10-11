import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {verifiedRouteBoundary,captureDecision} from './page-evidence-boundaries.mjs';
const source="const isExpert = hasRole(profile, 'expert');\nif (isExpert) {\n  redirect('/experts/inbox');\n}\n";
const record={route:'/inbox/[id]',role:'expert',state:'expected-role-redirect',destination:'/experts/inbox',detailRendered:false,evidence:[{path:'app/(app)/layout.tsx',line:2,hash:createHash('sha256').update(source).digest('hex'),expression:"if (isExpert) {\n  redirect('/experts/inbox');\n}"}]};
const capture={url:'http://localhost:3600/inbox/fixture',actualURL:'http://localhost:3600/experts/inbox',role:'expert'};
test('exact approved role guard and actual destination produce a separate boundary, never detail approval',()=>{
 const boundary=verifiedRouteBoundary(capture,[record],()=>source);assert.ok(boundary);assert.equal(boundary.detailRendered,false);
 assert.deepEqual(captureDecision(capture,[{reviewed:true,needsAttention:false,verdict:'redirect-destination-only'}],false,boundary),{allImagesReviewed:true,viewportMatches:true,usableVisualCapture:false,verifiedBoundaryCapture:true});
});
test('changed source, guard line, role, route, origin or destination fail closed',()=>{
 for(const changed of [{role:'owner'},{url:'http://localhost:3600/other/fixture'},{actualURL:'http://localhost:3600/login'},{actualURL:'https://elsewhere.test/experts/inbox'}])assert.equal(verifiedRouteBoundary({...capture,...changed},[record],()=>source),null);
 assert.equal(verifiedRouteBoundary(capture,[record],()=>source+'// changed'),null);
 assert.equal(verifiedRouteBoundary(capture,[{...record,evidence:[{...record.evidence[0],line:1}]}],()=>source),null);
 assert.equal(verifiedRouteBoundary(capture,[{...record,detailRendered:true}],()=>source),null);
});
test('source proof alone, blank captures and unapproved redirects never supply usable UI coverage',()=>{
 const boundary=verifiedRouteBoundary(capture,[record],()=>source);
 for(const images of [[],[{reviewed:false,needsAttention:false}],[{reviewed:true,needsAttention:true}]]){const result=captureDecision(capture,images,true,boundary);assert.equal(result.verifiedBoundaryCapture,false);assert.equal(result.usableVisualCapture,false);}
 assert.equal(captureDecision(capture,[{reviewed:true,needsAttention:false}],true,null).usableVisualCapture,false);
 assert.equal(captureDecision({...capture,actualURL:capture.url},[{reviewed:true,needsAttention:false}],true,null).usableVisualCapture,true);
});
test('legacy route aliases require the observed query as well as the destination path',()=>{
 const alias={...record,role:'SYS_ADMIN',route:'/material/items',state:'expected-route-alias',destination:'/settings/items?group=material'};
 const observed={role:'SYS_ADMIN',url:'http://localhost:3602/material/items',actualURL:'http://localhost:3602/settings/items?group=material'};
 assert.ok(verifiedRouteBoundary(observed,[alias],()=>source));
 assert.equal(verifiedRouteBoundary({...observed,actualURL:'http://localhost:3602/settings/items?group=product'},[alias],()=>source),null);
});

test('a disabled-feature guard remains separate from underlying feature UI and requires every source dependency',()=>{
 const gate="export function gate(enabled) { return enabled === true; }\n";
 const feature={...record,route:'/family-link',role:'owner',state:'expected-feature-redirect',destination:'/dashboard',evidence:[...record.evidence,{path:'lib/feature.ts',line:1,expression:gate.trim(),hash:createHash('sha256').update(gate).digest('hex')}]};
 const observed={role:'owner',url:'http://localhost:3600/family-link',actualURL:'http://localhost:3600/dashboard'};
 const read=p=>p==='lib/feature.ts'?gate:source;
 const boundary=verifiedRouteBoundary(observed,[feature],read);
 assert.equal(boundary.state,'expected-feature-redirect');assert.equal(boundary.detailRendered,false);assert.match(boundary.scope,/not underlying-page/);
 assert.equal(captureDecision(observed,[{reviewed:true,needsAttention:false}],true,boundary).usableVisualCapture,false);
 assert.equal(verifiedRouteBoundary(observed,[feature],p=>p==='lib/feature.ts'?gate+'// changed':source),null);
 assert.equal(verifiedRouteBoundary(observed,[{...feature,state:'arbitrary-bypass'}],read),null);
});

test('a desktop capture named mobile375 cannot certify the requested mobile viewport',()=>{
 const clean=[{reviewed:true,needsAttention:false}];
 const base={url:'http://localhost:3601/form',actualURL:'http://localhost:3601/form',role:'SaaS_Admin-mobile375'};
 for(const viewport of [[1280,720],undefined]){
  const result=captureDecision({...base,viewport},clean,true,null);
  assert.equal(result.viewportMatches,false);assert.equal(result.usableVisualCapture,false);
 }
 assert.equal(captureDecision({...base,viewport:[375,812]},clean,true,null).usableVisualCapture,true);
 assert.equal(captureDecision({...base,role:'SaaS_Admin',requestedViewport:[412,812],viewport:[375,812]},clean,true,null).usableVisualCapture,false);
});
