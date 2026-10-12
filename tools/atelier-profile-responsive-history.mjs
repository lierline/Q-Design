import {beforeExpertFontReview} from './atelier-expert-font-evidence.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {hash} from './style-arguments-core.mjs';import {responsiveDesignRef,assertResponsiveProfile} from './atelier-profile-responsive-source.mjs';
const root='D:/Claude/Q-Design',serialize=j=>JSON.stringify(j,null,2)+'\n';
import {beforeResidualLedger} from './atelier-residual-ledger.mjs';
export function beforeResponsiveReview(name,current){
 current=beforeExpertFontReview(name,current);
 const file=root+'/reviews/atelier-profile-responsive-revalidation.json';if(!fs.existsSync(file))return current;const report=JSON.parse(fs.readFileSync(file,'utf8')).reports.find(r=>r.name===name);if(!report||hash(serialize(current))===report.beforeHash)return current;
 assert.equal(hash(serialize(current)),report.afterHash,'Unrelated responsive report edits');const before=structuredClone(current);for(const change of report.changes){const owner=change.location.slice(0,-1).reduce((v,k)=>v[k],before),key=change.location.at(-1);assert.deepEqual(owner[key],change.after);owner[key]=change.before;}assert.equal(hash(serialize(before)),report.beforeHash);return before;
}
export function beforeResponsiveLedger(current){
 current=beforeResidualLedger(current);
 const file=root+'/reviews/atelier-profile-responsive-ledger.json';if(!fs.existsSync(file))return current;const proof=JSON.parse(fs.readFileSync(file,'utf8'));if(hash(serialize(current))===proof.beforeReportHash)return current;
 assertResponsiveProfile(fs.readFileSync('D:/Claude/Q-Atelier/components/ProductProfileWizard.tsx','utf8'));assert.equal(hash(serialize(current)),proof.afterReportHash,'Unrelated current ledger edits');const before=JSON.parse(execFileSync('git',['show',responsiveDesignRef+':reviews/atelier-style-decisions.json'],{cwd:root,encoding:'utf8',maxBuffer:128*1024*1024}));assert.equal(hash(serialize(before)),proof.beforeReportHash);return before;
}
