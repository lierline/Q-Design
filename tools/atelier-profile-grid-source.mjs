import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
export const profileGridPath='components/ProductProfileWizard.tsx';
export const profileProductRef='1c0a3f8e0d5ded5dbd53c0ba0d86e733a0dc2519';
export const normalizeProfileGrid=s=>s.replaceAll('\r\n','\n');
export function profileGridSources(){
 const before=normalizeProfileGrid(execFileSync('git',['show',profileProductRef+':'+profileGridPath],{cwd:'D:/Claude/Q-Atelier',encoding:'utf8',maxBuffer:8*1024*1024}));
 const values=[];const after=before.replace(/cols=\{([234])\}/g,(original,n)=>{values.push(Number(n));return 'cols={QDPresentation.rendererInputs.gridColumns['+n+']}';});
 assert.deepEqual(values,[2,3,3,3,2,2,2,2,4],'Only the nine reviewed profile choices may change');
 assert.equal(before.split("import { QDPresentation } from '@/lib/design/q-design-runtime';").length,2);
 return {before,after,beforeHash:hash(before),afterHash:hash(after),values};
}
export function beforeProfileGrid(source){const bodies=profileGridSources(),current=normalizeProfileGrid(source);assert(current===bodies.before||current===bodies.after,'No profile behavior, copy or other style may change');return bodies.before;}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)&&process.argv.includes('--write')){const current=fs.readFileSync('D:/Claude/Q-Atelier/'+profileGridPath,'utf8');beforeProfileGrid(current);const after=profileGridSources().after;fs.writeFileSync('D:/Claude/Q-Atelier/'+profileGridPath,current.includes('\r\n')?after.replaceAll('\n','\r\n'):after);console.log('Nine profile-grid inputs connected; all other source bytes retained.');}
