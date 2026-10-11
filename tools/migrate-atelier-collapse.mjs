import fs from 'node:fs';
import {createHash} from 'node:crypto';
const ROOT='D:/Claude/Q-Design',PRODUCT='D:/Claude/Q-Atelier',file='lib/design/components.tsx';
const manifest=ROOT+'/reviews/atelier-collapse-migration.json';
if(fs.existsSync(manifest))throw new Error('Collapse migration already recorded; never overwrite its historical hashes.');
const original=fs.readFileSync(PRODUCT+'/'+file,'utf8');let source=original;
const replacements=[
  ["? 'cubic-bezier(0.22, 1, 0.36, 1)' // ease-out expo","? 'var(--qd-atelier-collapse-open-easing)' // ease-out expo"],
  [": 'cubic-bezier(0.4, 0, 0.2, 1)'; // standard ease",": 'var(--qd-atelier-collapse-close-easing)'; // standard ease"],
  ["transform: open ? 'translateY(0)' : 'translateY(-4px)'","transform: open ? 'translateY(0)' : 'var(--qd-atelier-collapse-hidden-transform)'"],
];
const edits=[];
for(const[before,after]of replacements){const start=source.indexOf(before);if(start<0||source.indexOf(before,start+1)>=0)throw new Error('Ambiguous or missing exact substitution '+before);edits.push({start,before,after});source=source.slice(0,start)+after+source.slice(start+before.length);}
const definitions={'--qd-atelier-collapse-open-easing':'cubic-bezier(0.22, 1, 0.36, 1)','--qd-atelier-collapse-close-easing':'cubic-bezier(0.4, 0, 0.2, 1)','--qd-atelier-collapse-hidden-transform':'translateY(-4px)'};
const hash=value=>createHash('sha256').update(value.replaceAll('\r\n','\n')).digest('hex');
const report={version:1,scope:'Only finite Collapse animation curve and hidden translation defaults. Duration, reduced-motion behavior, DOM/inert state and caller overrides are preserved.',definitions,records:[{path:file,beforeHash:hash(original),afterHash:hash(source),edits}]};
if(process.argv.includes('--write')){
 fs.writeFileSync(PRODUCT+'/'+file,source);
 fs.appendFileSync(ROOT+'/patterns/foundation/atelier-core-values.css','\n/* Collapse finite appearance defaults. */\n:root {\n'+Object.entries(definitions).map(([key,value])=>`  ${key}: ${value};`).join('\n')+'\n}\n');
 fs.writeFileSync(manifest,JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify({files:1,edits:edits.length,definitions:Object.keys(definitions).length,written:process.argv.includes('--write')}));
