import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Atelier';
execFileSync(process.execPath,[root+'/tools/followup-expert-copy-evidence.mjs'],{stdio:'inherit'});
const proof=JSON.parse(fs.readFileSync(root+'/reviews/followup-expert-copy-evidence.json','utf8'));
const exact=new Map([
 ['app/experts/settings/profile-form.tsx',['<Field label="경력(년)">','<Field label="경력 (년)">']],
 ['app/experts/portal/signup/page.tsx',['<option value="">(선택해주십시오)</option>','<option value="">고르십시오</option>']],
]);
const records=proof.deltas.map(row=>{
 const [before,after]=exact.get(row.path),old=execFileSync('git',['show',proof.ref+':'+row.path],{cwd:repo,encoding:'utf8'}),current=fs.readFileSync(repo+'/'+row.path,'utf8');
 assert.equal(old.split(before).length,2);assert.equal(current.split(after).length,2);
 assert.equal(hash(old.replace(before,after)),hash(current));
 return {path:row.path,beforeHash:row.beforeHash,afterHash:row.afterHash,edits:[{before,after}]};
});
fs.writeFileSync(root+'/reviews/atelier-expert-copy-migration.json',JSON.stringify({scope:proof.scope,ref:proof.ref,records},null,2)+'\n');
