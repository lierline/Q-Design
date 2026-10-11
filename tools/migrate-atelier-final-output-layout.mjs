import fs from 'node:fs';
import {hash} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',qa='D:/Claude/Q-Atelier';
const output=root+'/reviews/atelier-final-output-layout-migration.json';
if(fs.existsSync(output))throw Error('Historical output/layout migration already exists');
const records=[],pending=[];
function edit(file,changes,importText){
  const original=fs.readFileSync(qa+'/'+file,'utf8');let code=original;const edits=[];
  for(const[before,after,count=1]of changes){
    if(code.split(before).length-1!==count)throw Error(file+': expected '+count+' copies of '+before);
    for(let i=0;i<count;i++){const start=code.indexOf(before);edits.push({start,before,after});code=code.slice(0,start)+after+code.slice(start+before.length);}
  }
  if(importText){const at=code.indexOf('import ');if(at<0)throw Error(file+': no import anchor');edits.push({start:at,before:'',after:importText+'\n'});code=code.slice(0,at)+importText+'\n'+code.slice(at);}
  records.push({path:file,beforeHash:hash(original),afterHash:hash(code),edits});pending.push([qa+'/'+file,code]);
}
edit('components/AvatarUploader.tsx',[["ctx.fillStyle = '#ffffff'",'ctx.fillStyle = QDOutput.avatarJpeg.background']],"import { QDOutput } from '@/lib/design/q-design-output';");
edit('app/experts/inbox/user-menu.tsx',[["'1px solid var(--hairline-strong)'","'var(--qd-border-width) solid var(--hairline-strong)'"]]);
edit('components/ExpertNotificationsPanel.tsx',[["'1px solid var(--qa-border, rgba(0,0,0,0.08))'","'var(--qd-border-width) solid var(--qd-border)'" ]]);
edit('components/admin/DocsetStructurePanel.tsx',[["width: '84px'","width: 'var(--qd-atelier-docset-tier-width)'"]]);
edit('components/dashboard/widgets.tsx',[["width: '110px'","width: 'var(--qd-atelier-org-table-plan-width)'",2],["width: '120px'","width: 'var(--qd-atelier-org-table-expiry-width)'"],["width: '1.4fr'","width: 'var(--qd-atelier-org-table-usage-track)'"]]);
const mainFile='lib/design/main-padding.ts',main=fs.readFileSync(qa+'/'+mainFile,'utf8');
const mainBefore='export const MAIN_PADDING: EdgePadding = { top: 32, right: 40, bottom: 32, left: 40 };';
if(!main.includes(mainBefore))throw Error('Missing main padding');
const mainAfter='export const MAIN_PADDING: EdgePadding = QDPresentation.mainPadding;';
const mainImport="import { QDPresentation } from './q-design-runtime';\n";
records.push({path:mainFile,beforeHash:hash(main),afterHash:hash(mainImport+main.replace(mainBefore,mainAfter)),edits:[{start:main.indexOf(mainBefore),before:mainBefore,after:mainAfter},{start:0,before:'',after:mainImport}]});pending.push([qa+'/'+mainFile,mainImport+main.replace(mainBefore,mainAfter)]);
const printFile='lib/design/print.ts',print=fs.readFileSync(qa+'/'+printFile,'utf8');let printCode=print;const printEdits=[];
for(const[before,after]of [
 ['export const PAGE_MARGIN_MM = { top: 18, right: 16, bottom: 22, left: 16 } as const;','export const PAGE_MARGIN_MM = QDOutput.print.marginMm;'],
 ['export const PRINT_MAIN_PAD_X = 0;','export const PRINT_MAIN_PAD_X = QDOutput.print.mainPadXpx;'],
 ['((210 - PAGE_MARGIN_MM.left - PAGE_MARGIN_MM.right) / 25.4) * 96','((QDOutput.print.paperWidthMm - PAGE_MARGIN_MM.left - PAGE_MARGIN_MM.right) / 25.4) * 96']
]){const start=printCode.indexOf(before);if(start<0)throw Error('Missing print fragment');printEdits.push({start,before,after});printCode=printCode.slice(0,start)+after+printCode.slice(start+before.length);}
const printImport="import { QDOutput } from './q-design-output';\n";printEdits.push({start:0,before:'',after:printImport});printCode=printImport+printCode;
records.push({path:printFile,beforeHash:hash(print),afterHash:hash(printCode),edits:printEdits});pending.push([qa+'/'+printFile,printCode]);
const colors={PERF:'#7a9ac9',COST:'#9fc98a',SECURITY:'#c97a7a',REG:'#c9a878',CUSTOMER:'#c98aaa',DEFECT:'#c9a87a',FEATURE:'#a8c9b8',SUPPLY:'#aaa8c9',QUALITY:'#9fc98a',OBSO:'#a09890'};
const catalog=fs.readFileSync(qa+'/lib/catalog.ts','utf8');
edit('lib/catalog.ts',Object.entries(colors).map(([id,color])=>{const match=catalog.match(new RegExp("\\{ id: '"+id+"', label: '[^']+', color: '"+color+"' \\}"));if(!match)throw Error('Missing catalog '+id);return [match[0],match[0].replace("'"+color+"'",'QDPresentation.changeReasonColor.'+id)];}),"import { QDPresentation } from '@/lib/design/q-design-runtime';");
const runtimePath=root+'/source/design/atelier-runtime.ts',runtime=fs.readFileSync(runtimePath,'utf8');
const runtimeDefinitions={mainPadding:{top:32,right:40,bottom:32,left:40},changeReasonColor:colors};
const outputDefinitions={avatarJpeg:{background:'#ffffff'},print:{paperWidthMm:210,paperHeightMm:297,marginMm:{top:18,right:16,bottom:22,left:16},mainPadXpx:0,mainPadYpx:24}};
const insert=definitions=>Object.entries(definitions).map(([key,value])=>'  '+JSON.stringify(key)+': '+JSON.stringify(value,null,2).replaceAll('\n','\n  ')+',').join('\n');
pending.push([runtimePath,runtime.replace('export const QDPresentation = {','export const QDPresentation = {\n'+insert(runtimeDefinitions))]);
const canonicalOutputPath=root+'/source/design/atelier-output.ts',canonicalOutput=fs.readFileSync(canonicalOutputPath,'utf8');
pending.push([canonicalOutputPath,canonicalOutput.replace('export const QDOutput = {','export const QDOutput = {\n'+insert(outputDefinitions))]);
const cssPath=root+'/patterns/foundation/atelier-core-values.css',cssDefinitions={'--qd-atelier-docset-tier-width':'84px','--qd-atelier-org-table-plan-width':'110px','--qd-atelier-org-table-expiry-width':'120px','--qd-atelier-org-table-usage-track':'1.4fr'};
pending.push([cssPath,fs.readFileSync(cssPath,'utf8')+'\n/* Finite table-track defaults verified at the actual DataTable consumers. */\n:root {\n'+Object.entries(cssDefinitions).map(([key,value])=>`  ${key}: ${value};`).join('\n')+'\n}\n']);
if(process.argv.includes('--write')){for(const[file,code]of pending)fs.writeFileSync(file,code);fs.writeFileSync(output,JSON.stringify({version:1,scope:'Finite UI/table defaults, JPEG compositing and physical print presentation. Application data, photo geometry/encoding, auth and print scaling algorithm remain unchanged.',runtimeDefinitions,outputDefinitions,cssDefinitions,records},null,2)+'\n');}
console.log(JSON.stringify({files:records.length,edits:records.reduce((n,r)=>n+r.edits.length,0),write:process.argv.includes('--write')}));
