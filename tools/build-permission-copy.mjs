import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function permissionCopySource(terms) {
  const selected=terms.filter(term=>term.displayContexts?.includes('maison-permission-description'));
  for(const term of selected)if(!term.from||!term.to||!term.products?.includes('maison'))throw Error('Invalid permission display term');
  return '/* Generated from patterns/copy-rules.json. Display text only; never persist this result. */\n'+
    'const terms = '+JSON.stringify(selected.map(({from,to})=>({from,to})),null,2)+' as const;\n\n'+
    'export function formatPermissionDescription(value: string): string {\n'+
    '  let result = value;\n'+
    '  for (const term of terms) result = result.replaceAll(term.from, term.to);\n'+
    '  return result;\n}\n';
}
export function buildPermissionCopy({check=false}={}) {
  const rules=JSON.parse(fs.readFileSync(path.join(root,'patterns/copy-rules.json'),'utf8'));
  const output=permissionCopySource(rules.terms),file=path.join(root,'dist/q-design.permission-copy.maison.ts');
  if(check){if(!fs.existsSync(file)||fs.readFileSync(file,'utf8').replaceAll('\r\n','\n')!==output)throw Error('Permission display copy is stale');}
  else fs.writeFileSync(file,output);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  if(process.argv.slice(2).some(arg=>arg!=='--check'))throw Error('Use optional --check');
  buildPermissionCopy({check:process.argv.includes('--check')});
  console.log('Central permission display copy '+(process.argv.includes('--check')?'checked':'built'));
}
