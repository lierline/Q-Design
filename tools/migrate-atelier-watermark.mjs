import fs from 'node:fs';
import { hash } from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',qa='D:/Claude/Q-Atelier';
const manifest=root+'/reviews/atelier-watermark-migration.json';
if(fs.existsSync(manifest))throw Error('Historical watermark migration already exists.');
const file='lib/manual/watermark.ts',before=fs.readFileSync(qa+'/'+file,'utf8');
const definitions={width:460,height:240,textX:10,textY:150,rotationDegrees:-24,fontFamily:'sans-serif',fontSize:15,fill:'#8d7c58'};
const old=[
  `    '<svg xmlns="http://www.w3.org/2000/svg" width="460" height="240">' +`,
  `    '<text x="10" y="150" transform="rotate(-24 10 150)" ' +`,
  `    'font-family="sans-serif" font-size="15" fill="#8d7c58">' +`,
];
const replacements=[
  '    `<svg xmlns="http://www.w3.org/2000/svg" width="${tile.width}" height="${tile.height}">` +',
  '    `<text x="${tile.textX}" y="${tile.textY}" transform="rotate(${tile.rotationDegrees} ${tile.textX} ${tile.textY})" ` +',
  '    `font-family="${escapeMarkup(tile.fontFamily)}" font-size="${tile.fontSize}" fill="${escapeMarkup(tile.fill)}">` +',
];
let code=before;const edits=[];
const replace=(old,value)=>{const start=code.indexOf(old);if(start<0||code.indexOf(old,start+old.length)>=0)throw Error('Expected unique original fragment: '+old);edits.push({start,before:old,after:value});code=code.slice(0,start)+value+code.slice(start+old.length);};
for(let i=0;i<old.length;i++)replace(old[i],replacements[i]);
replace('  const t = escapeMarkup(line);','  const t = escapeMarkup(line);\n  const tile = QDOutput.manualWatermark;');
const imported="import { QDOutput } from '@/lib/design/q-design-output';\n";
edits.push({start:0,before:'',after:imported});code=imported+code;
const canonicalPath=root+'/source/design/atelier-output.ts',canonical=fs.readFileSync(canonicalPath,'utf8');
const insertion='  "manualWatermark": '+JSON.stringify(definitions,null,2).replaceAll('\n','\n  ')+',';
if(!canonical.includes('export const QDOutput = {'))throw Error('Missing canonical output object');
if(process.argv.includes('--write')){
  fs.writeFileSync(canonicalPath,canonical.replace('export const QDOutput = {','export const QDOutput = {\n'+insertion));
  fs.writeFileSync(qa+'/'+file,code);
  fs.writeFileSync(manifest,JSON.stringify({version:1,scope:'Feature-gated manual watermark SVG presentation only. Existing auth, feature flag, markup escaping, wording and output bytes are retained at default settings.',definitions,records:[{path:file,beforeHash:hash(before),afterHash:hash(code),edits}]},null,2)+'\n');
}
console.log(JSON.stringify({files:1,edits:edits.length,written:process.argv.includes('--write')}));
