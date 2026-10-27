import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readPageShellCss} from './page-shell-css.mjs';
const root=path.resolve(import.meta.dirname,'..');
export function composeWorkspace(workspace,targets,shell=''){
 const parts=[workspace,targets,shell].map(x=>x.replaceAll('\r\n','\n').trimEnd()).filter(Boolean);
 return parts.join('\n\n')+'\n';
}
export function buildWorkspace({check=false,base=root}={}){
 const output=composeWorkspace(fs.readFileSync(base+'/patterns/workspace.css','utf8'),fs.readFileSync(base+'/patterns/action-targets.css','utf8'),readPageShellCss(base)),file=base+'/dist/q-design.workspace.css';
 if(check){if(fs.readFileSync(file,'utf8').replaceAll('\r\n','\n')!==output)throw Error('Shared workspace target output is stale');}
 else fs.writeFileSync(file,output);
 return output;
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){buildWorkspace({check:process.argv.includes('--check')});console.log('Shared workspace and text-action targets verified.');}
