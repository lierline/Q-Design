import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createAtelierProofContext} from './atelier-proof-context.mjs';
import {PARTS} from './sync-parts.mjs';
import {copyProblems} from './audit-coverage-core.mjs';
import {hash,scanArguments,cssProperties} from './style-arguments-core.mjs';
import {createRequire} from 'node:module';
import {beforeChoiceColumnsLedger} from './atelier-choice-columns-ledger.mjs';
import {inspectGlobalTypographyLayer} from './typography-links-core.mjs';
export {inspectGlobalTypographyLayer} from './typography-links-core.mjs';

const root='D:/Claude/Q-Design', product='D:/Claude/Q-Atelier';
const manifest=root+'/reviews/global-typography-ledger.json';
const serialize=value=>JSON.stringify(value,null,2)+'\n';
const copyPath='app/q-design.foundation.css';
const centralPath='dist/q-design.foundation.atelier.css';
const layerPath='patterns/typography-links.css';
const normalized=value=>value.replaceAll('\r\n','\n');
const show=(ref,file)=>execFileSync('git',['show',ref+':'+file],{cwd:root,encoding:'utf8',maxBuffer:128*1024*1024});

export function createGlobalTypographyLedger(current,ref=JSON.parse(fs.readFileSync(manifest,'utf8')).ref){
  current=beforeChoiceColumnsLedger(current);
  const before=JSON.parse(show(ref,'reviews/atelier-style-decisions.json'));
  const oldCentral=show(ref,centralPath),oldCopy=execFileSync('git',['show',JSON.parse(show(ref,'source/_ORIGIN.json'))['원본'].qa['커밋']+':'+copyPath],{cwd:product,encoding:'utf8',maxBuffer:32*1024*1024});
  const central=fs.readFileSync(root+'/'+centralPath,'utf8'),copy=fs.readFileSync(product+'/'+copyPath,'utf8'),layer=fs.readFileSync(root+'/'+layerPath,'utf8');
  const {ts,postcss,variables}=createAtelierProofContext();
  inspectGlobalTypographyLayer(layer,postcss);
  assert(variables.has('--qd-font-family-ui')&&variables.has('--qd-font-family-mono'));
  assert.equal(normalized(central),normalized(oldCentral).trimEnd()+'\n\n'+normalized(layer).trimEnd()+'\n','No old foundation byte or selector may be replaced');
  const part=PARTS.find(p=>p.src===centralPath);assert(part);
  assert.deepEqual(copyProblems(part,central,copy),[]);
  assert.deepEqual(copyProblems(part,oldCentral,oldCopy),[]);
  const req=createRequire(product+'/package.json');
  const properties=cssProperties(ts,fs.readFileSync(path.join(path.dirname(req.resolve('typescript')),'lib.dom.d.ts'),'utf8'));
  const oldArgs=scanArguments(copyPath,oldCopy,{ts,postcss,properties,owner:centralPath});
  const newArgs=scanArguments(copyPath,copy,{ts,postcss,properties,owner:centralPath});
  const prior=new Set(oldArgs.map(a=>hash(JSON.stringify(a))));
  assert.equal(prior.size,oldArgs.length);
  assert.deepEqual(newArgs.filter(a=>prior.has(hash(JSON.stringify(a)))),oldArgs,'Every prior argument and line must remain unchanged');
  const added=newArgs.filter(a=>!prior.has(hash(JSON.stringify(a))));
  assert.equal(added.length,6);
  const addedHashes=new Set(added.map(a=>hash(JSON.stringify(a))));
  const inserted=current.records.filter(r=>r.path===copyPath&&addedHashes.has(r.argumentHash));
  assert.equal(inserted.length,6);
  for(const [i,row]of inserted.entries()){
    const argument=added[i];
    const expected={path:copyPath,...argument,argumentHash:hash(JSON.stringify(argument)),sourceHash:hash(copy),originalStatus:argument.status,decision:'central-source-verified',ruleId:'central-copy',reason:'Complete argument comes from the verified canonical body.',evidence:[{path:centralPath,line:1,hash:hash(central)}]};
    assert.deepEqual(row,expected,'New role is accepted only as an exact verified complete canonical copy');
  }
  const insertedSet=new Set(inserted),remaining=current.records.filter(r=>!insertedSet.has(r));
  assert.equal(remaining.length,before.records.length);
  let rebound=0;
  for(const [i,old]of before.records.entries()){
    const row=structuredClone(remaining[i]);
    if(row.path===copyPath){assert.equal(row.sourceHash,hash(copy));assert.equal(old.sourceHash,hash(oldCopy));row.sourceHash=old.sourceHash;rebound++;}
    for(const e of row.evidence??[]){if(e.path===centralPath){assert.equal(e.hash,hash(central));e.hash=hash(oldCentral);}if(e.path===copyPath){assert.equal(e.hash,hash(copy));e.hash=hash(oldCopy);}}
    assert.deepEqual(row,old,'No other full argument or decision can change: '+i);
  }
  assert.deepEqual(current.counts,{...before.counts,'central-source-verified':before.counts['central-source-verified']+6});
  const a=structuredClone(current),b=structuredClone(before);
  for(const report of[a,b]){delete report.records;delete report.counts;}
  const entry=a.fileHashes.find(f=>f.path===copyPath);assert.equal(entry.hash,hash(copy));entry.hash=hash(oldCopy);
  assert.deepEqual(a,b);
  return{version:1,ref,layerPath,layerHash:hash(layer),copyPath,centralPath,beforeSourceHash:hash(oldCopy),afterSourceHash:hash(copy),beforeCentralHash:hash(oldCentral),afterCentralHash:hash(central),beforeReportHash:hash(serialize(before)),afterReportHash:hash(serialize(current)),beforeRecords:before.records.length,afterRecords:current.records.length,unknown:current.counts.unknown,inserted:inserted.map(r=>({line:r.line,property:r.property,argumentHash:r.argumentHash})),reboundRecords:rebound,scope:'Five whole canonical font-role declarations and the print media role appended to the existing foundation. All previous source arguments, lines and decisions remain exact, with only freshly verified copy fingerprints updated.'};
}

export function beforeGlobalTypographyLedger(current){
  if(!fs.existsSync(manifest))return current;
  const saved=JSON.parse(fs.readFileSync(manifest,'utf8')),before=JSON.parse(show(saved.ref,'reviews/atelier-style-decisions.json'));
  if(hash(serialize(current))===hash(serialize(before)))return current;
  current=beforeChoiceColumnsLedger(current);
  assert.deepEqual(createGlobalTypographyLedger(current,saved.ref),saved);
  return before;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const ref=process.argv.find(a=>a.startsWith('--ref='))?.slice(6);
  const report=createGlobalTypographyLedger(JSON.parse(fs.readFileSync(root+'/reviews/atelier-style-decisions.json','utf8')),ref);
  if(process.argv.includes('--write'))fs.writeFileSync(manifest,serialize(report));
  else assert.deepEqual(report,JSON.parse(fs.readFileSync(manifest,'utf8')));
  console.log(JSON.stringify({inserted:report.inserted.length,unknown:report.unknown}));
}
