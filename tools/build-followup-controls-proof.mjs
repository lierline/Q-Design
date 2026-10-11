import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),repo='D:/Claude/Q-Atelier';
// The existing reviewer rejects every source difference outside four exact
// reviewed controls and one semantic heading. Generate the inverse only after
// that check passes, preserving the historical mixed line endings as well.
execFileSync(process.execPath,[new URL('./followup-reply-choice-evidence.mjs',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')],{cwd:root,stdio:'inherit'});
const proof=JSON.parse(fs.readFileSync(new URL('reviews/followup-reply-choice-evidence.json',root),'utf8'));
const hash=s=>createHash('sha256').update(s).digest('hex');
const records=proof.deltas.map(row=>{
 let beforeRaw=execFileSync('git',['show',proof.ref+':'+row.path],{cwd:repo,encoding:'utf8'});
 const before=beforeRaw.replaceAll('\r\n','\n');
 // Git normalized this historical mixed-ending file. The earlier migration
 // inserted exactly these three LF imports into the CRLF working file.
 // Its pinned hash and byte-offset edit independently validate reconstruction.
 if(row.path==='app/onboarding/page.tsx'){
  const lfImports=new Set(["import { QDText } from '@/lib/design/q-design-labels';","import { QDPresentation } from '@/lib/design/q-design-runtime';","import { QDScale } from '@/lib/design/q-design-scale';"]);
  for(const line of lfImports)assert.equal(before.split(line+'\n').length,2);
  const lines=before.split('\n');
  beforeRaw=lines.map((line,i)=>i<lines.length-1&&!lfImports.has(line)?line+'\r':line).join('\n');
  const oldManifest=JSON.parse(fs.readFileSync(new URL('reviews/atelier-final-visual-rules-migration.json',root),'utf8'));
  const pinned=oldManifest.records.find(record=>record.path===row.path);
  assert.equal(hash(before),pinned.afterHash);
  for(const edit of pinned.edits)assert.equal(beforeRaw.slice(edit.start,edit.start+edit.after.length),edit.after,'Pinned historical byte offset');
 }
 const after=fs.readFileSync(repo+'/'+row.path,'utf8').replaceAll('\r\n','\n');
 assert.equal(hash(before),row.beforeHash);assert.equal(hash(after),row.afterHash);
 let start=0;while(start<before.length&&start<after.length&&before[start]===after[start])start++;
 let suffix=0;while(suffix<before.length-start&&suffix<after.length-start&&before.at(-suffix-1)===after.at(-suffix-1))suffix++;
 const beforeLineEnding=beforeRaw.includes('\r\n')?'crlf':'lf';
 const lines=beforeRaw.split('\n');
 const beforeLFOnlyLines=beforeLineEnding==='crlf'?lines.flatMap((line,i)=>i<lines.length-1&&!line.endsWith('\r')?[i]:[]):[];
 return {path:row.path,beforeHash:row.beforeHash,afterHash:row.afterHash,beforeRawHash:hash(beforeRaw),beforeLineEnding,beforeLFOnlyLines,edits:[{start,before:before.slice(start,before.length-suffix),after:after.slice(start,after.length-suffix)}]};
});
fs.writeFileSync(new URL('reviews/atelier-followup-controls-migration.json',root),JSON.stringify({scope:proof.scope,ref:proof.ref,records},null,2)+'\n');
