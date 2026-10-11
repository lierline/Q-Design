import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const repo=path.resolve(root,'../Q-Atelier');
const ref='6b781a8509e1d463afbdc6a2f28de29b5034445a';
const file='components/Toast.tsx';
export const toastCopyEdit={before:"            lineHeight: QDScale.leading.notice,\n            wordBreak: 'break-word',",after:"            lineHeight: QDScale.leading.notice,"};
export const toastCopyEdits=[toastCopyEdit,{before:'minWidth: "var(--qd-atelier-min-width-f24a3b2189)"',after:'minWidth: "var(--qd-space-0)"'},{before:'top: "var(--qd-atelier-top-2b4a5c2363)"',after:'top: "var(--qd-toast-inset-top)"'},{before:'right: "var(--qd-atelier-right-1301a84022)"',after:'right: "var(--qd-toast-inset-right)"'},{before:'maxWidth: "var(--qd-atelier-max-width-b7675c5965)"',after:'width: "var(--qd-toast-width)"'}];
export function applyToastCopy(source){
 source=source.replaceAll('\r\n','\n');
 for(const edit of toastCopyEdits){assert.equal(source.split(edit.before).length,2,'Exact toast message replacement');source=source.replace(edit.before,edit.after);}
 return source;
}
export function verifyToastCopy(before,after){assert.equal(after.replaceAll('\r\n','\n'),applyToastCopy(before),'Only central message wrapping may change');}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const before=execFileSync('git',['show',ref+':'+file],{cwd:repo,encoding:'utf8'});
 const after=fs.readFileSync(path.join(repo,file),'utf8');
 verifyToastCopy(before,after);
 const proof={ref,scope:'Exact toast-message wrapping, flex minimum and shared safe-area placement bindings. Timers, dismissal, ARIA roles, kind, text, motion and message values are unchanged.',records:[{path:file,beforeHash:hash(before),afterHash:hash(after),edits:toastCopyEdits}]};
 const target=path.join(root,'reviews/atelier-toast-copy-migration.json');
 if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(fs.readFileSync(target,'utf8')),proof,'Stale toast copy proof');
 else fs.writeFileSync(target,JSON.stringify(proof,null,2)+'\n');
 console.log('Toast copy source proof passed.');
}
