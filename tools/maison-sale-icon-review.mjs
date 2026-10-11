// Revalidate two previously reviewed row-data spreads after an exact icon-only migration.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {hash} from './style-arguments-core.mjs';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),product=path.resolve(root,'../Q-Works');
const file='app/(app)/store/sale-items-table.tsx',beforeRef='876d05b1206bc4882660e140b2d7ffccadf48b0a';
const before=execFileSync('git',['show',`${beforeRef}:${file}`],{cwd:product,encoding:'utf8'}).replaceAll('\r\n','\n');
const after=fs.readFileSync(path.join(product,file),'utf8').replaceAll('\r\n','\n');
const edits=[
 {before:'className="text-muted-foreground hover:text-destructive disabled:opacity-30"',after:'className="qd-control-icon qd-control-icon--danger disabled:opacity-30"'},
 {before:'<Trash2 className="h-3.5 w-3.5" />',after:'<Trash2 aria-hidden="true" />'},
];
let restored=after;
for(const edit of edits){assert.equal(restored.split(edit.after).length,2,'icon migration is not unique');restored=restored.replace(edit.after,edit.before);}
assert.equal(hash(restored),hash(before),'non-icon source changed');
const reportFile=path.join(root,'reviews/maison-style-spread-review.json'),report=JSON.parse(fs.readFileSync(reportFile,'utf8'));
const records=report.records.filter(r=>r.path===file);
assert.equal(records.length,2);
for(const r of records){assert([hash(before),hash(after)].includes(r.sourceHash));assert.equal(r.line,79);assert(before.split('\n')[78].includes('...r, ...patch'));assert(after.split('\n')[78].includes('...r, ...patch'));r.sourceHash=hash(after);for(const e of r.evidence??[])if(e.path===file){assert([hash(before),hash(after)].includes(e.hash));e.hash=hash(after);}}
fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(root,'reviews/maison-sale-icon-migration.json'),JSON.stringify({scope:'Only common icon role and decorative SVG visibility change. Row data spreads, disabled last-row guard and delete handler are unchanged.',path:file,beforeRef,beforeHash:hash(before),afterHash:hash(after),edits,revalidatedRecords:records.map(r=>({line:r.line,argumentHash:r.argumentHash}))},null,2)+'\n');
console.log(JSON.stringify({revalidated:records.length}));
