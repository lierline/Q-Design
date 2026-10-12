import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import path from 'node:path';import {fileURLToPath} from 'node:url';import {hash} from './style-arguments-core.mjs';
export const responsiveProfilePath='components/ProductProfileWizard.tsx',responsiveProductRef='498584bbe5b8cddfe25324ed5eafa5749c8518eb',responsiveDesignRef='dfda589558d19fff3950d6d89cba03560426a20f';
export const normalizeResponsiveProfile=s=>s.replaceAll('\r\n','\n');
let cachedSources;
export function responsiveProfileSources(){
 if(cachedSources)return cachedSources;
 const before=normalizeResponsiveProfile(execFileSync('git',['show',responsiveProductRef+':'+responsiveProfilePath],{cwd:'D:/Claude/Q-Atelier',encoding:'utf8',maxBuffer:8*1024*1024}));
 const edits=[{before:'gridTemplateColumns: `repeat(${cols}, 1fr)`',after:'gridTemplateColumns: foldGrid(cols, QDScale.space[2], { min: QDPresentation.choiceMinColumn[110] }).gridTemplateColumns'},{before:'식약처 공공 DB 에서 등급',after:'식약처 공공 DB에서 등급'}];let after=before;
 for(const edit of edits){assert.equal(after.split(edit.before).length,2);after=after.replace(edit.before,edit.after);}
 cachedSources=Object.freeze({before,after,edits:Object.freeze(edits.map(Object.freeze)),beforeHash:hash(before),afterHash:hash(after)});return cachedSources;
}
export function beforeResponsiveProfile(source){const current=normalizeResponsiveProfile(source),bodies=responsiveProfileSources();return current===bodies.after?bodies.before:current;}
export function assertResponsiveProfile(source){assert.equal(normalizeResponsiveProfile(source),responsiveProfileSources().after,'Only one central layout expression and one copy spacing correction qualify');}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)&&process.argv.includes('--write')){const file='D:/Claude/Q-Atelier/'+responsiveProfilePath,current=fs.readFileSync(file,'utf8'),bodies=responsiveProfileSources();assert.equal(normalizeResponsiveProfile(current),bodies.before);fs.writeFileSync(file,current.includes('\r\n')?bodies.after.replaceAll('\n','\r\n'):bodies.after);console.log('One responsive central grid expression and one Korean spacing correction applied.');}
