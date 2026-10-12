import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function recordLabelsSource(labels){
 if(!labels||Object.keys(labels).sort().join(',')!=='link_connection,link_inbox')throw Error('Expected exactly the reviewed record type identifiers.');
 if(Object.values(labels).some(v=>typeof v!=='string'||!v.trim()||v!==v.trim()||/[\r\n]/.test(v)))throw Error('Record labels must be nonempty single-line text.');
 return '/* Generated from patterns/carnet-record-labels.json. Display labels only. */\n'+
  'export const QDCarnetRecordLabels: Readonly<Record<string, string>> = '+JSON.stringify(labels,null,2)+';\n';
}
export function buildRecordLabels({check=false}={}){
 const output=recordLabelsSource(JSON.parse(fs.readFileSync(root+'/patterns/carnet-record-labels.json','utf8'))),file=root+'/dist/q-design.carnet-record-labels.ts';
 if(check){if(!fs.existsSync(file)||fs.readFileSync(file,'utf8').replaceAll('\r\n','\n')!==output)throw Error('Record type labels are stale.');}
 else fs.writeFileSync(file,output);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 if(process.argv.slice(2).some(a=>a!=='--check'))throw Error('Use optional --check.');
 buildRecordLabels({check:process.argv.includes('--check')});
 console.log('Central record display labels '+(process.argv.includes('--check')?'checked':'built'));
}
