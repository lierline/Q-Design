import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {beforeBannerUtilityInventory} from './carnet-banner-foundation.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),repo=path.resolve(root,'../DHR');
const ref='93ce0ca5cb9f74bcbe6519fb46547be36b4928f1',file='components/toast.tsx';
const edit={before:'          <span className="flex-1">{n.text}</span>',after:'          <span className="flex-1" style={{ minWidth: \'var(--qd-space-0)\' }}>{n.text}</span>'};
const edits=[edit,{before:'      className="pointer-events-none fixed right-4 top-4 z-[var(--qd-z-toast)] flex w-[var(--qd-carnet-screen-w-3e6e4f30)] flex-col gap-2"',after:'      className="pointer-events-none fixed right-[var(--qd-toast-inset-right)] top-[var(--qd-toast-inset-top)] z-[var(--qd-z-toast)] flex w-[var(--qd-toast-width)] flex-col gap-2"'}];
export function applyCarnetToastCopy(source){source=source.replaceAll('\r\n','\n');for(const e of edits){assert.equal(source.split(e.before).length,2,'Exact message span');source=source.replace(e.before,e.after);}return source;}
export function verifyCarnetToastCopy(before,after){assert.equal(after.replaceAll('\r\n','\n'),applyCarnetToastCopy(before),'Only central message flex minimum may change');}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const before=execFileSync('git',['show',ref+':'+file],{cwd:repo,encoding:'utf8'}),after=fs.readFileSync(repo+'/'+file,'utf8');verifyCarnetToastCopy(before,after);
 const proof={ref,scope:'Exact central flex minimum and shared safe-area placement. Timers, error/success selection, message values, ARIA roles, dismissal and portal behavior are unchanged.',records:[{path:file,beforeHash:hash(before),afterHash:hash(after),edits}]};
 const target=root+'/reviews/carnet-toast-copy-migration.json';if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(fs.readFileSync(target,'utf8')),proof);else fs.writeFileSync(target,JSON.stringify(proof,null,2)+'\n');console.log('Carnet toast copy source proof passed.');
 const inventory=JSON.parse(execFileSync('git',['show','cf00e72:source/style-adapters/carnet-utility-values.json'],{cwd:root,encoding:'utf8'}));
 const rows=inventory.occurrences.filter(r=>r.file===file&&r.variable==='--qd-carnet-screen-w-3e6e4f30');assert.equal(rows.length,1);
 assert.equal(rows[0].replacement,'w-[var(--qd-carnet-screen-w-3e6e4f30)]');
 rows[0].replacement='w-[var(--qd-toast-width)]';rows[0].variable='--qd-toast-width';rows[0].currentBindingProof='reviews/carnet-toast-copy-migration.json';
 const inventoryPath=root+'/source/style-adapters/carnet-utility-values.json';
 if(process.argv.includes('--check'))assert.deepEqual(beforeBannerUtilityInventory(JSON.parse(fs.readFileSync(inventoryPath,'utf8'))),inventory,'Only the exact toast width caller may be rebound');
 else fs.writeFileSync(inventoryPath,JSON.stringify(inventory,null,2)+'\n');
}
