import test from 'node:test';
import assert from 'node:assert/strict';
import {loadingControlBodies,verifyLoadingControls,retainLoadingControlEvidence} from './maison-loading-control-proof.mjs';
test('actual generated loading implementation changes only seven central-height placeholders',()=>{
 const bodies=loadingControlBodies();verifyLoadingControls(bodies.before,bodies.after,bodies.migration);
 for(const changed of [bodies.after.replace('--qd-control-height','--qd-control-height-sm'),bodies.after.replace('h-9 w-52','h-10 w-52'),bodies.after+'\nconst unreviewed=1;\n'])assert.throws(()=>verifyLoadingControls(bodies.before,changed,bodies.migration));
});
test('only exact unchanged arguments retain decisions across the inserted recipe declaration',()=>{
 const bodies=loadingControlBodies();
 const record={path:'components/shared/page-skeleton.tsx',sourceHash:bodies.migration.beforeHash,line:47,argumentHash:'not-an-inspected-argument',evidence:[]};
 assert.throws(()=>retainLoadingControlEvidence({records:[record]},bodies));
 assert.throws(()=>retainLoadingControlEvidence({records:[{...record,sourceHash:'unreviewed-source'}]},bodies));
});
