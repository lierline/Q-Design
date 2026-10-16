// Reports after the ledger and list-detail pattern layer (owner decision 2026-10-15, A + C).
// Each named report is pinned twice: its exact content committed with the canon change, and its
// exact reviewed content after that change. The earlier content is returned only for the later one.
// Hand-written consumer reviews move by forwardLedgerTree alone: earlier fingerprints become the later
// ones and unedited positions move. A review anchored inside an edit is retired, never carried.
// Generated reports are rebuilt by their own proof tools. This layer records what each rebuild
// carried, retired, added or changed, so every new or changed entry stays visible for review.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {ledgerRefs,forwardLedgerTree,ledgerSource,ledgerRepoOf} from './atelier-ledger-pattern-sources.mjs';
const root='D:/Claude/Q-Design',manifest=root+'/reviews/atelier-ledger-pattern-review.json',serialize=j=>JSON.stringify(j,null,2)+'\n';
const show=file=>execFileSync('git',['show',ledgerRefs.design.after+':'+file],{cwd:root,encoding:'utf8',maxBuffer:128*1024*1024});
// Hand-written consumer reviews without their own generator.
export const movedReviews=['atelier-style-spread-review.json','atelier-style-bindings-review.json','atelier-style-consumer-review.json','atelier-data-ratio-review.json'];
// Reports rebuilt from current sources by their own proof tools.
export const rebuiltReports=['atelier-style-decisions.json','atelier-heading-icon-boundaries.json','atelier-data-consumer-review.json','atelier-size-renderer-review.json','atelier-style-prop-flow-review.json','atelier-fold-grid-review.json','atelier-widget-width-review.json','atelier-renderer-enum-review.json','atelier-renderer-slot-review.json','atelier-dimension-flow-review.json','atelier-color-flow-review.json','atelier-parameter-leaves-review.json','atelier-supplementary-parameter-review.json','atelier-ring-geometry-review.json','atelier-profile-responsive-review.json'];
// The unknown context inventory is rebuilt as well, but it is not a proof: it stamps its creation time and no layer reads it.
const identity=v=>v&&typeof v==='object'&&typeof v.path==='string'?JSON.stringify([v.path,v.line??v.declarationLine??null,v.argumentHash??null,v.kind??null,v.property??null,v.component??null,v.prop??null]):null;
// Move one earlier element; null when it is anchored inside an edit.
function forwardOrRetire(element){
 try{return forwardLedgerTree(element);}catch(error){if(/^(?:Position inside a ledger edit|Unanchored ledger position)/.test(error.message))return null;throw error;}
}
// The exact moved content of a hand-written review: every record moves or retires as a whole.
export function moveReview(previous){
 const retired=[],records=[];
 for(const record of previous.records){const moved=forwardOrRetire(record);if(moved)records.push(moved);else retired.push(identity(record)??JSON.stringify(record));}
 const rest=forwardLedgerTree(Object.fromEntries(Object.entries(previous).filter(([k])=>k!=='records')));
 return {current:Object.fromEntries(Object.keys(previous).map(k=>[k,k==='records'?records:rest[k]])),retired};
}
// A rebuilt report compared element by element with its moved earlier content.
export function compareRebuilt(previous,current){
 const result={carried:0,retired:[],added:[],changed:[]};
 for(const key of Object.keys({...previous,...current})){
  const before=previous[key],after=current[key];
  if(!Array.isArray(before)&&!Array.isArray(after)){
   const moved=before===undefined?undefined:forwardOrRetire(before);
   if(JSON.stringify(moved)!==JSON.stringify(after))result.changed.push({key});
   continue;
  }
  assert(Array.isArray(before)&&Array.isArray(after),'Report shape changed: '+key);
  const pending=new Map();for(const element of after){const text=JSON.stringify(element);pending.set(text,(pending.get(text)??0)+1);}
  const unmatched=[];
  for(const element of before){
   const moved=forwardOrRetire(element),text=moved&&JSON.stringify(moved);
   if(text&&pending.get(text)){pending.set(text,pending.get(text)-1);result.carried++;}else unmatched.push({element,moved});
  }
  const remaining=after.filter(element=>{const text=JSON.stringify(element),n=pending.get(text);if(n){pending.set(text,n-1);return true;}return false;});
  const byId=new Map();for(const element of remaining){const id=identity(element);if(id)byId.set(id,[...(byId.get(id)??[]),element]);}
  for(const {element,moved} of unmatched){
   const id=identity(moved??element),partner=id&&moved?byId.get(id)?.shift():null;
   if(partner){remaining.splice(remaining.indexOf(partner),1);result.changed.push({key,id,before:element.decision??null,after:partner.decision??null});}
   else result.retired.push({key,id:identity(element)});
  }
  for(const element of remaining)result.added.push({key,id:identity(element),decision:element.decision??null});
 }
 return result;
}
export function createLedgerReviewRecord(){
 const reports=[];
 for(const name of [...movedReviews,...rebuiltReports]){
  const beforeText=show('reviews/'+name),previous=JSON.parse(beforeText),currentText=fs.readFileSync(root+'/reviews/'+name,'utf8'),current=JSON.parse(currentText);
  assert.equal(serialize(previous),beforeText.replaceAll('\r\n','\n'),'Canonical earlier serialization: '+name);assert.equal(serialize(current),currentText.replaceAll('\r\n','\n'),'Canonical later serialization: '+name);
  if(movedReviews.includes(name)){
   const {current:expected,retired}=moveReview(previous);
   assert.deepEqual(current,expected,'A moved review may change only exact fingerprints and unedited positions: '+name);
   reports.push({name,kind:'moved',beforeHash:hash(beforeText),afterHash:hash(currentText),carried:expected.records.length,retired});
  }else reports.push({name,kind:'rebuilt',beforeHash:hash(beforeText),afterHash:hash(currentText),...compareRebuilt(previous,current)});
 }
 return {version:1,refs:ledgerRefs,scope:'Every report that names a source of the ledger pattern commits. Moved reviews change only exact fingerprints and unedited positions; rebuilt reports list each retired, added and changed entry. Nothing inside an edit inherits an earlier review.',reports};
}
let saved;
const record=()=>saved??=(fs.existsSync(manifest)?JSON.parse(fs.readFileSync(manifest,'utf8')):null);
// The exact earlier report, only for the exact reviewed later report. Every other content, including
// the earlier report and any intermediate historical state, passes unchanged to the earlier layers,
// whose own exact checks refuse anything they did not review. This layer is therefore safe to call
// first from every existing chain entry.
export function beforeLedgerReview(name,current){
 const report=record()?.reports.find(r=>r.name===name);if(!report||hash(serialize(current))!==report.afterHash)return current;
 const before=JSON.parse(show('reviews/'+name));assert.equal(hash(serialize(before)),report.beforeHash,'Committed earlier report: '+name);return before;
}
// A proof over the exact earlier source of a ledger file sees the earlier world: the committed reports and the
// earlier fingerprint of every ledger source. Every other source keeps the current world.
export function earlierLedgerSource(file,code){const s=ledgerSource(file,ledgerRepoOf(file));return !!s&&hash(code)===s.beforeHash;}
export function earlierLedgerHash(file,value){const s=value&&ledgerSource(file,ledgerRepoOf(file));return s&&value===s.afterHash?s.beforeHash:value;}
export function beforeLedgerReport(current){return current?.product==='atelier'?beforeLedgerReview('atelier-style-decisions.json',current):current;}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 if(process.argv.includes('--move')){
  for(const name of movedReviews){const file=root+'/reviews/'+name,previous=JSON.parse(show('reviews/'+name));assert.equal(hash(fs.readFileSync(file,'utf8')),hash(serialize(previous)),'Move from the exact committed review: '+name);fs.writeFileSync(file,serialize(moveReview(previous).current));}
 }
 const result=createLedgerReviewRecord();
 if(process.argv.includes('--write'))fs.writeFileSync(manifest,serialize(result));
 else if(!process.argv.includes('--move'))assert.deepEqual(JSON.parse(fs.readFileSync(manifest,'utf8')),result);
 console.log(JSON.stringify(result.reports.map(r=>({name:r.name,kind:r.kind,carried:r.carried,retired:r.retired.length,added:r.added?.length,changed:r.changed?.length}))));
}
