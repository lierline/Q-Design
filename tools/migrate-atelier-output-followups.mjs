import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root='D:/Claude/Q-Design',qa='D:/Claude/Q-Atelier',output=root+'/reviews/atelier-output-followups-migration.json';
if(fs.existsSync(output))throw Error('Historical output followup manifest already exists.');
const hash=code=>createHash('sha256').update(code.replaceAll('\r\n','\n')).digest('hex'),records=[];
const definitions={tabStopTwip:{headerFooterRight:9026},legacyHtmlPalette:{primary:'A8854F',text:'1C1A16',subtle:'5A5550',muted:'8A8478',light:'C0BCB5',border:'E2DFD8',bg:'FAF8F3',bgSurface:'F3F1EC',green:'4A7C59',red:'C83E3E',warning:'B8893B'}};
const file='lib/export/docx-builder/header-footer.ts',original=fs.readFileSync(qa+'/'+file,'utf8');let source=original,edits=[];
for(let i=0;i<2;i++){const before='position: 9026',after='position: QDOutput.tabStopTwip.headerFooterRight',start=source.indexOf(before);if(start<0)throw Error('Missing tab stop');edits.push({start,before,after});source=source.slice(0,start)+after+source.slice(start+before.length);}
records.push({path:file,beforeHash:hash(original),afterHash:hash(source),edits});
const legacyFile='lib/export/doc-style.ts',legacy=fs.readFileSync(qa+'/'+legacyFile,'utf8');
const match=legacy.match(/export const BRAND = \{[\s\S]*?\n\};/);if(!match)throw Error('Missing legacy palette');
const legacyEdits=[{start:match.index,before:match[0],after:'export const BRAND = QDOutput.legacyHtmlPalette;'}];
let changed=legacy.replace(match[0],legacyEdits[0].after);const importText="import { QDOutput } from '@/lib/design/q-design-output';\n";legacyEdits.push({start:0,before:'',after:importText});changed=importText+changed;
records.push({path:legacyFile,beforeHash:hash(legacy),afterHash:hash(changed),edits:legacyEdits});
const canonicalPath=root+'/source/design/atelier-output.ts',canonical=fs.readFileSync(canonicalPath,'utf8'),insertion=Object.entries(definitions).map(([key,value])=>'  '+JSON.stringify(key)+': '+JSON.stringify(value,null,2).replaceAll('\n','\n  ')+',').join('\n');
if(!canonical.includes('export const QDOutput = {'))throw Error('Missing canonical output object');
if(process.argv.includes('--write')){fs.writeFileSync(qa+'/'+file,source);fs.writeFileSync(qa+'/'+legacyFile,changed);fs.writeFileSync(canonicalPath,canonical.replace('export const QDOutput = {','export const QDOutput = {\n'+insertion));fs.writeFileSync(output,JSON.stringify({version:1,scope:'Exact DOCX right-aligned tab-stop geometry and retained legacy export palette, with unchanged values.',definitions,records},null,2)+'\n');}
console.log(JSON.stringify({files:records.length,edits:records.reduce((n,r)=>n+r.edits.length,0),written:process.argv.includes('--write')}));
