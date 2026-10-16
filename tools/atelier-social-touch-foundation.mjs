// Strict inverse of one new touch-target recipe. Prior CSS is unchanged.
import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash} from './style-arguments-core.mjs';
import {beforeGlobalTypographySource} from './global-typography-evidence.mjs';
import {beforeLedgerSource} from './atelier-ledger-pattern-sources.mjs';
import {readRuntimeValues,resolveAtelierMedia} from './atelier-runtime-values.mjs';
import {readOutputValues,resolveAtelierOutputCss} from './atelier-output-values.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Atelier',ref='12a8e0dfbc52455b360f7025d7b8a5860d0e72d8',productRef='4e2ab6a4ab31dcb4d03e37b0c232923bff7d3c01';
const normalize=s=>s.replaceAll('\r\n','\n');
const old=(file,cwd=root,revision=ref)=>normalize(execFileSync('git',['show',revision+':'+file],{cwd,encoding:'utf8',maxBuffer:8*1024*1024}));
export const socialTouchAppendix=`
/* Social controls keep separate, non-overlapping targets on small or touch screens. */
@media (max-width: qd-bp(md-max)), (hover: none) and (pointer: coarse) {
  .qa-auth-form-wrap a.qa-social-link { min-width: var(--qd-control-height); min-height: var(--qd-control-height); }
}
@media (hover: none) and (pointer: coarse) {
  .qa-auth-form-wrap a.qa-social-link::after { inset: var(--qd-space-0); }
}
`;
export function beforeSocialFoundation(source){source=normalize(beforeLedgerSource('patterns/foundation/atelier.css',source,'design'));const before=old('patterns/foundation/atelier.css');if(source===before)return before;assert(source===before+socialTouchAppendix,'Only the exact social touch appendix is permitted');return before;}
export function beforeSocialDist(source){
 source=normalize(source);const before=old('dist/q-design.foundation.atelier.css');if(source===before)return before;
 source=beforeGlobalTypographySource('dist/q-design.foundation.atelier.css',source);
 const values=readRuntimeValues(root),recipe=resolveAtelierOutputCss(resolveAtelierMedia(old('patterns/foundation/atelier.css'),values),readOutputValues(root)),addition=resolveAtelierMedia(socialTouchAppendix,values);
 assert.equal(before.split(recipe.trimEnd()).length,2,'Single compiled recipe required');
 assert(source===before.replace(recipe.trimEnd(),(recipe+addition).trimEnd()),'Only the compiled social touch appendix is permitted');return before;
}
export function beforeSocialCopy(source){
 source=normalize(source);const before=old('app/q-design.foundation.css',repo,productRef);if(source===before)return before;
 source=beforeGlobalTypographySource('app/q-design.foundation.css',source);
 const current=beforeGlobalTypographySource('dist/q-design.foundation.atelier.css',normalize(fs.readFileSync(root+'/dist/q-design.foundation.atelier.css','utf8'))),prior=beforeSocialDist(current);
 assert.equal(source.split(current).length,2);assert.equal(source.split('q-design-nav-sha256: '+hash(current)).length,2);
 const restored=source.replace(current,prior).replace('q-design-nav-sha256: '+hash(current),'q-design-nav-sha256: '+hash(prior));
 assert(restored===before,'No product-copy change outside the new recipe or its hash');return restored;
}
