import {createHash} from 'node:crypto';
// Inputs must be freshly read complete source texts, including path inventories.
// No modification-time, previous result or partial declaration fingerprint is used.
const digest=s=>createHash('sha256').update(s).digest('hex');
export function proofSnapshotKey(groups){return digest(JSON.stringify(groups.map(([name,texts])=>[name,[...texts].map(([file,text])=>[file,digest(text)])])));}
export function createFreshProofCache(){const entries=new Map();return function reuse(scope,groups,build){const key=proofSnapshotKey(groups),prior=entries.get(scope);if(!prior||prior.key!==key)entries.set(scope,{key,value:structuredClone(build())});return structuredClone(entries.get(scope).value);};}
