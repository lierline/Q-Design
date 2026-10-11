import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root='D:/Claude/Q-Design',file='lib/design/components.tsx',target='D:/Claude/Q-Atelier/'+file,output=root+'/reviews/atelier-table-density-migration.json';
if(fs.existsSync(output))throw Error('Historical density manifest already exists.');
const before=fs.readFileSync(target,'utf8');let source=before;const edits=[];
const replacements=[
 ['const padY = dense ? 8 : 11;',"const padY = dense ? 'var(--qd-table-pad-y-dense)' : 'var(--qd-table-pad-y, 11px)';"],
 ['${dense ? `${padY}px` : `var(--qd-table-pad-y, ${padY}px)`}','${padY}'],
 ['${dense ? `${padY}px` : `var(--qd-table-pad-y, ${padY}px)`}','${padY}'],
];
for(const[before,after]of replacements){const start=source.indexOf(before);if(start<0)throw Error('Missing '+before);edits.push({start,before,after});source=source.slice(0,start)+after+source.slice(start+before.length);}
const definitions={'--qd-table-pad-y-dense':'var(--qd-space-2)'};
const hash=code=>createHash('sha256').update(code.replaceAll('\r\n','\n')).digest('hex');
const result={version:1,scope:'The dense table variant consumes canonical padding while normal density and header stroke arithmetic remain unchanged.',definitions,records:[{path:file,beforeHash:hash(before),afterHash:hash(source),edits}]};
if(process.argv.includes('--write')){fs.writeFileSync(target,source);fs.appendFileSync(root+'/patterns/foundation/atelier-core-values.css','\n/* Dense table spacing follows the shared scale. */\n:root { --qd-table-pad-y-dense: var(--qd-space-2); }\n');fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');}
console.log(JSON.stringify({files:1,edits:edits.length,written:process.argv.includes('--write')}));
