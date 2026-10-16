// Ledger and list-detail pattern layer (owner decision 2026-10-15, A + C).
// One Q-Atelier product commit and its Q-Design canon commit, recorded as exact line edits.
// Every later proof layer reverses only these edits. A source that differs anywhere else
// from the reviewed revision cannot inherit an older review.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Atelier';
export const ledgerRefs={product:{before:'61ddd606f1c222c23175a8858e76ce6df75082dd',after:'f6fcc65b7206d9620671a1ab514b10f5804a93c5'},design:{before:'9f9fff5db9af9dab042a9463d35d77c6348c81b9',after:'ecc29c540540a29bdcfbc283dffee42c656a7945'}};
const repos={product,design:root};
// Canon inputs only. Generated catalogs and documents are proven by their own builders.
const designInputs=['patterns/foundation/atelier.css','dist/q-design.foundation.atelier.css','patterns/component-implementations/atelier/lib/design/components.tsx','source/component-roles.json'];
const manifest=root+'/reviews/atelier-ledger-pattern-sources.json',serialize=j=>JSON.stringify(j,null,2)+'\n';
const lf=s=>s.replaceAll('\r\n','\n');
const show=(repo,ref,file)=>execFileSync('git',['show',ref+':'+file],{cwd:repos[repo],encoding:'utf8',maxBuffer:128*1024*1024});
const lines=text=>text.split('\n');
// Exact git hunks become whole-line edits on LF text. Offsets are positions in the later text.
function editsFor(repo,file,before,after){
 const out=execFileSync('git',['diff','-U0','--no-color','--no-ext-diff',ledgerRefs[repo].before,ledgerRefs[repo].after,'--',file],{cwd:repos[repo],encoding:'utf8',maxBuffer:64*1024*1024});
 const oldLines=lines(before),newLines=lines(after),edits=[];
 const starts=[0];for(const l of newLines)starts.push(starts.at(-1)+l.length+1);
 for(const m of out.matchAll(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/gm)){
  const a=+m[1],b=m[2]===undefined?1:+m[2],c=+m[3],d=m[4]===undefined?1:+m[4];
  const beforeLine=b===0?a+1:a,afterLine=d===0?c+1:c;
  const take=(arr,from,count)=>arr.slice(from-1,from-1+count).map(l=>l+'\n').join('');
  edits.push({beforeLine,beforeCount:b,afterLine,afterCount:d,start:starts[afterLine-1],before:take(oldLines,beforeLine,b),after:take(newLines,afterLine,d)});
 }
 assert(edits.length>0,'No edit recorded: '+file);
 return edits;
}
function applyForward(text,edits){let out='',at=0;for(const e of edits){const oldStart=oldStartOf(edits,e);assert.equal(text.slice(oldStart,oldStart+e.before.length),e.before);out+=text.slice(at,oldStart)+e.after;at=oldStart+e.before.length;}return out+text.slice(at);}
function oldStartOf(edits,edit){let delta=0;for(const e of edits){if(e===edit)break;delta+=e.after.length-e.before.length;}return edit.start-delta;}
function applyReverse(text,edits){for(const e of [...edits].reverse()){assert.equal(text.slice(e.start,e.start+e.after.length),e.after,'Exact ledger inverse offset '+e.start);text=text.slice(0,e.start)+e.before+text.slice(e.start+e.after.length);}return text;}
export function createLedgerSources(){
 const sources=[];
 for(const repo of ['product','design']){
  const changed=execFileSync('git',['diff','--name-only',ledgerRefs[repo].before,ledgerRefs[repo].after],{cwd:repos[repo],encoding:'utf8'}).trim().split('\n').filter(Boolean);
  if(repo==='design')for(const file of designInputs)assert(changed.includes(file),'Canon input changed in the ledger commit: '+file);
  const files=repo==='design'?designInputs:changed;
  for(const file of files){
   const before=lf(show(repo,ledgerRefs[repo].before,file)),after=lf(show(repo,ledgerRefs[repo].after,file)),current=fs.readFileSync(repos[repo]+'/'+file,'utf8');
   assert.equal(hash(current),hash(after),'Working source differs from the reviewed ledger commit: '+repo+':'+file);
   const edits=editsFor(repo,file,before,after);
   assert.equal(applyForward(before,edits),after,'Forward edits reproduce '+file);assert.equal(applyReverse(after,edits),before,'Reverse edits reproduce '+file);
   sources.push({repo,path:file,beforeHash:hash(before),afterHash:hash(after),lineEnding:current.includes('\r\n')?'crlf':'lf',edits});
  }
 }
 return {version:1,refs:ledgerRefs,scope:'Exact whole-line edits of one Q-Atelier product commit and its Q-Design canon commit. Positions and fingerprints of unedited lines may move; nothing inside an edit inherits an earlier review.',sources};
}
let saved;
export function ledgerManifest(){
 if(saved===undefined)saved=fs.existsSync(manifest)?JSON.parse(fs.readFileSync(manifest,'utf8')):null;
 return saved;
}
export function ledgerSource(file,repo='product'){return ledgerManifest()?.sources.find(s=>s.repo===repo&&s.path===file)??null;}
export function ledgerFiles(repo='product'){return (ledgerManifest()?.sources??[]).filter(s=>s.repo===repo).map(s=>s.path);}
// Current source to the reviewed earlier revision. Returns LF text; unrelated sources pass through.
export function beforeLedgerSource(file,code,repo='product'){
 const s=ledgerSource(file,repo);if(!s||hash(code)===s.beforeHash)return code;
 assert.equal(hash(code),s.afterHash,'Unreviewed source after the ledger pattern: '+repo+':'+file);
 const before=applyReverse(lf(code),s.edits);assert.equal(hash(before),s.beforeHash,'Exact ledger inverse: '+file);return before;
}
// For chains that also see older revisions: only the exact later revision is reversed;
// anything else passes unchanged to the caller's own exact checks.
export function beforeLedgerSourceIfLater(file,code,repo='product'){const s=ledgerSource(file,repo);return s&&hash(code)===s.afterHash?beforeLedgerSource(file,code,repo):code;}
export function afterLedgerSource(file,code,repo='product'){
 const s=ledgerSource(file,repo);if(!s||hash(code)===s.afterHash)return code;
 assert.equal(hash(code),s.beforeHash,'Unreviewed source before the ledger pattern: '+repo+':'+file);
 const after=applyForward(lf(code),s.edits);assert.equal(hash(after),s.afterHash);return after;
}
// A complete [path, hash] inventory of the current product, restored to the reviewed earlier revision.
// Only files whose current fingerprint is exactly the reviewed later revision are restored.
export function beforeLedgerInventory(items){
 return items.map(([file,h])=>{const s=ledgerSource(file);if(!s||h===s.beforeHash)return [file,h];assert.equal(h,s.afterHash,'Unreviewed inventory source after the ledger pattern: '+file);return [file,s.beforeHash];});
}
export function ledgerSourceTexts(file,repo='product'){
 const s=ledgerSource(file,repo);assert(s);
 return {before:lf(show(repo,ledgerRefs[repo].before,file)),after:lf(show(repo,ledgerRefs[repo].after,file))};
}
// Line and offset maps. null means the position lies inside an edit and needs its own review.
export function ledgerLineMap(file,repo='product'){
 const s=ledgerSource(file,repo);
 const toAfter=line=>{if(!s)return line;let delta=0;for(const e of s.edits){if(line<e.beforeLine)break;if(line<e.beforeLine+e.beforeCount)return null;delta+=e.afterCount-e.beforeCount;}return line+delta;};
 const toBefore=line=>{if(!s)return line;let delta=0;for(const e of s.edits){if(line<e.afterLine)break;if(line<e.afterLine+e.afterCount)return null;delta+=e.afterCount-e.beforeCount;}return line-delta;};
 return {toAfter,toBefore,edited:!!s};
}
export function ledgerOffsetMap(file,repo='product'){
 const s=ledgerSource(file,repo),spans=s?s.edits.map(e=>({old:oldStartOf(s.edits,e),oldEnd:oldStartOf(s.edits,e)+e.before.length,delta:e.after.length-e.before.length})):[];
 // A start offset at an insertion point names the following character, which moves.
 const toAfter=(offset,kind='start')=>{let delta=0;for(const sp of spans){if(kind==='end'?offset<=sp.old:offset<sp.old)break;if(offset<sp.oldEnd&&offset>sp.old)return null;if(offset===sp.old&&sp.oldEnd>sp.old&&kind==='start')return null;delta+=sp.delta;}return offset+delta;};
 return {toAfter,edited:!!s};
}
// Q-Design paths name canon files; every other path names a Q-Atelier file.
export const ledgerRepoOf=file=>/^(?:source|patterns|dist|tools)\//.test(file)?'design':'product';
let historicalArguments;
// The exact argument behind a reviewed earlier report row, from the report committed with the canon.
function historicalArgument(file,line,argumentHash){
 if(!historicalArguments){
  historicalArguments=new Map();
  const report=JSON.parse(show('design',ledgerRefs.design.after,'reviews/atelier-style-decisions.json'));
  for(const r of report.records){const keys=Object.keys(r),argument=Object.fromEntries(keys.slice(keys.indexOf('argumentHash')+1,keys.indexOf('originalStatus')).map(k=>[k,r[k]]));historicalArguments.set(JSON.stringify([r.path,r.line,r.argumentHash]),argument);}
 }
 const argument=historicalArguments.get(JSON.stringify([file,line,argumentHash]));
 assert(argument&&hash(JSON.stringify(argument))===argumentHash,'No exact earlier argument '+file+':'+line);return argument;
}
// Fresh proof names current ledger fingerprints and positions; a record proven before the ledger pattern names
// the earlier ones. Only for a path the record itself names by an earlier fingerprint is fresh evidence read back:
// the exact later fingerprint becomes the earlier one and an unedited line moves back. A line inside an edit has no
// earlier position and stays as it is, so it can never match an earlier record.
export function historicalLedgerEvidence(evidence,recordEvidence){
 const earlier=new Set((recordEvidence??[]).filter(e=>{const s=typeof e?.path==='string'&&ledgerSource(e.path,ledgerRepoOf(e.path));return s&&e.hash!==s.afterHash;}).map(e=>e.path));
 if(!earlier.size)return evidence;
 return evidence.map(e=>{
  const repo=ledgerRepoOf(e.path),s=earlier.has(e.path)&&ledgerSource(e.path,repo);
  if(!s||e.hash!==s.afterHash)return e;
  if(!Number.isInteger(e.line))return {...e,hash:s.beforeHash};
  const line=ledgerLineMap(e.path,repo).toBefore(e.line);
  return line===null?e:{...e,line,hash:s.beforeHash};
 });
}
// A review tree anchored to the earlier revision, moved to the later one. Only fingerprints that
// name the earlier revision change, and only positions anchored by such a fingerprint move.
// A position inside an edit has no later counterpart: the move stops instead of guessing.
// extra lists other exactly reviewed fingerprint pairs, such as a revised proof tool.
export function forwardLedgerTree(tree,extra=[]){
 const visit=value=>{
  if(Array.isArray(value))return value.map(visit);
  if(!value||typeof value!=='object')return value;
  const out=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,visit(v)]));
  if(typeof value.path!=='string')return out;
  const file=value.path,repo=ledgerRepoOf(file),s=ledgerSource(file,repo),other=extra.find(e=>e.path===file);
  const anchored=s&&['hash','sourceHash'].some(k=>value[k]===s.beforeHash);
  for(const k of ['hash','sourceHash']){if(anchored&&value[k]===s.beforeHash)out[k]=s.afterHash;if(other&&value[k]===other.before)out[k]=other.after;}
  if(s&&!anchored&&Number.isInteger(value.line)&&!['hash','sourceHash'].some(k=>k in value))throw new Error('Unanchored ledger position '+file+':'+value.line);
  if(anchored&&Number.isInteger(value.line)){
   const line=ledgerLineMap(file,repo).toAfter(value.line);if(line===null)throw new Error('Position inside a ledger edit '+file+':'+value.line);
   if(line!==value.line&&'argumentHash' in value)out.argumentHash=hash(JSON.stringify({...historicalArgument(file,value.line,value.argumentHash),line}));
   out.line=line;
  }
  return out;
 };
 return visit(tree);
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const result=createLedgerSources();
 if(process.argv.includes('--write')){assert(!fs.existsSync(manifest),'The ledger source record is written once');fs.writeFileSync(manifest,serialize(result));}
 else assert.deepEqual(JSON.parse(fs.readFileSync(manifest,'utf8')),result);
 console.log(JSON.stringify({sources:result.sources.length,edits:result.sources.reduce((n,s)=>n+s.edits.length,0),passed:true}));
}
