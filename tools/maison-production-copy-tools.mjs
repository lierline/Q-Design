import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash} from './style-arguments-core.mjs';
const reviewedTransitionHash="870d8b750f64b2227d749173d077ad1e0d32a17e793d811a89ad2a56b78bac38";
export function productionToolTransitions(){const root='D:/Claude/Q-Design',report=JSON.parse(fs.readFileSync(root+'/reviews/maison-production-copy-tool-transitions.json','utf8'));assert.equal(hash(fs.readFileSync(root+"/reviews/maison-production-copy-tool-transitions.json","utf8")),reviewedTransitionHash,"Reviewed tool transition cannot be edited silently");assert.equal(report.records.length,3);for(const r of report.records){assert.equal(hash(execFileSync('git',['show',report.ref+':'+r.path],{cwd:root,encoding:'utf8'})),r.beforeHash);assert.equal(hash(r.after),r.afterHash);assert.equal(hash(fs.readFileSync(root+'/'+r.path,'utf8')),r.afterHash,'Changed legacy tool requires a fresh reviewed projection');}return report.records;}
