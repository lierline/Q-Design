import fs from 'node:fs';import test from 'node:test';import assert from 'node:assert/strict';
import {beforeSocialFoundation,beforeSocialDist,beforeSocialCopy,socialTouchAppendix} from './atelier-social-touch-foundation.mjs';
import {beforeSocialTouchReview} from './atelier-social-touch-review-inverse.mjs';
import {hash} from './style-arguments-core.mjs';
import {beforeLedgerSource} from './atelier-ledger-pattern-sources.mjs';
test('only the exact social touch appendix and its generated copy may change',()=>{
 const root='D:/Claude/Q-Design',recipe=fs.readFileSync(root+'/patterns/foundation/atelier.css','utf8'),dist=fs.readFileSync(root+'/dist/q-design.foundation.atelier.css','utf8'),copy=fs.readFileSync('D:/Claude/Q-Atelier/app/q-design.foundation.css','utf8');
 // The ledger pattern layer (2026-10-15) later inserted its own recipe before this appendix.
 assert.equal(beforeLedgerSource('patterns/foundation/atelier.css',recipe,'design'),beforeSocialFoundation(recipe)+socialTouchAppendix);
 assert.notEqual(beforeSocialDist(dist),dist);assert.notEqual(beforeSocialCopy(copy),copy);
 assert.throws(()=>beforeSocialFoundation(recipe.replace('min-width: var(--qd-control-height); min-height','min-width: 48px; min-height')));
 assert.throws(()=>beforeSocialDist(dist+'\n.other { color: red; }'));
 assert.throws(()=>beforeSocialCopy(copy.replace('q-design-nav-sha256:','q-design-nav-sha256-changed:')));
});
test('review inverse restores all prior fields and refuses changed arguments or dependency metadata',()=>{
 const root='D:/Claude/Q-Design',proof=JSON.parse(fs.readFileSync(root+'/reviews/atelier-social-touch-revalidation.json','utf8'));
 for(const report of proof.reports){const current=JSON.parse(fs.readFileSync(root+'/reviews/'+report.name,'utf8')),before=beforeSocialTouchReview(report.name,current);assert.equal(hash(JSON.stringify(before,null,2)+'\n'),report.beforeHash);
  const changed=structuredClone(current);changed.records[report.changes[0].recordIndex].argumentHash='changed';assert.throws(()=>beforeSocialTouchReview(report.name,changed));
 }
});
