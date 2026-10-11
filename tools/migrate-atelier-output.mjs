// Narrow, replayable migration of the inspected DOCX renderer and invitation QR defaults.
// The ledger records exact substitutions. Body text, parsing, access checks and caller data stay in place.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {hash} from './style-arguments-core.mjs';
const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/,'$1')),'..');
const QA=path.resolve(ROOT,'../Q-Atelier'),ts=createRequire(QA+'/package.json')('typescript');
const files=['approval','body','cover','header-footer','index','markdown','table','utils'].map(name=>`lib/export/docx-builder/${name}.ts`)
  .concat(['lib/export/signature-manifest.ts','lib/export/merge-into-template.ts','app/api/admin/expert-invites/[id]/qr/route.ts']);
const allowed=new Set(['size','width','height','top','right','bottom','left','before','after','line','space','hanging','firstLine','characterSpacing','bold','italics','color','fill']);
const values={},records=[],outputs=new Map();
function ref(group,value){const key='v'+hash(JSON.stringify(value)).slice(0,10);(values[group]??={})[key]=value;return `QDOutput.${group}.${key}`;}
function groupFor(node){const name=node.name.getText().replace(/^['"]|['"]$/g,'');const ancestors=[];for(let p=node.parent;p;p=p.parent){if(ts.isPropertyAssignment(p))ancestors.push(p.name.getText().toLowerCase());if(ts.isVariableDeclaration(p))ancestors.push(p.name.getText().toLowerCase());}
  const trail=ancestors.join('.');if(name==='size')return /border/.test(trail)?'borderEighthPoint':ancestors[0]==='width'?'tableWidthPercent':'fontHalfPoint';
  if(name==='width')return /transformation/.test(trail)?'imagePx':'tableWidthPercent';
  if(name==='height')return'imagePx';if(name==='space')return'borderSpacePoint';
  if(['color','fill','bold','italics'].includes(name))return name;
  return name+'Twip';
}
for(const file of files){const code=fs.readFileSync(QA+'/'+file,'utf8'),sf=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS),edits=[];
  const add=(node,after,role)=>{const before=node.getText(sf);if(before===after)return;edits.push({start:node.getStart(sf),end:node.end,before,after,role});};
  function scalar(node,group){if(ts.isNumericLiteral(node)){add(node,ref(group,Number(node.text)),group);return;}
    if(ts.isStringLiteral(node)){if(group==='color'||group==='fill'){if(/^[a-fA-F0-9]{6}$/.test(node.text))add(node,ref(group,node.text),group);}return;}
    if(node.kind===ts.SyntaxKind.TrueKeyword||node.kind===ts.SyntaxKind.FalseKeyword){add(node,ref(group,node.kind===ts.SyntaxKind.TrueKeyword),group);return;}
    if(ts.isConditionalExpression(node)){scalar(node.whenTrue,group);scalar(node.whenFalse,group);}
    if(ts.isBinaryExpression(node)&&[ts.SyntaxKind.QuestionQuestionToken,ts.SyntaxKind.BarBarToken].includes(node.operatorToken.kind))scalar(node.right,group);
  }
  function visit(node){
    if(file.includes('docx-builder/')||file.endsWith('signature-manifest.ts')){
      if(ts.isPropertyAssignment(node)&&allowed.has(node.name.getText(sf).replace(/^['"]|['"]$/g,'')))scalar(node.initializer,groupFor(node));
      if(ts.isPropertyAssignment(node)&&node.name.getText(sf)==='value'&&ts.isPropertyAssignment(node.parent.parent)&&node.parent.parent.name.getText(sf)==='height')scalar(node.initializer,'rowHeightTwip');
      if(ts.isCallExpression(node)&&node.expression.getText(sf)==='convertInchesToTwip'&&node.arguments.length===1)scalar(node.arguments[0],'pageMarginInch');
      if(ts.isParameter(node)&&node.name.getText(sf)==='sizeEighths'&&node.initializer)scalar(node.initializer,'borderEighthPoint');
      if(ts.isVariableDeclaration(node)&&node.name.getText(sf)==='size'&&node.initializer&&file.endsWith('/markdown.ts'))scalar(node.initializer,'fontHalfPoint');
    }
    if(file.endsWith('merge-into-template.ts')){
      if(ts.isVariableDeclaration(node)&&node.name.getText(sf)==='DEFAULT_BRAND')add(node.initializer,ref('appendColor','D4AF7A'),'appendColor');
      if(ts.isVariableDeclaration(node)&&node.name.getText(sf)==='size')scalar(node.initializer,'appendFontHalfPoint');
      if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)||ts.isTemplateExpression(node)){
        const before=node.getText(sf);if(before.includes('<w:')){
          let after=before.replace(/(<w:(sz|spacing|color|rFonts|ind|bottom)\b[^<>]*?\bw:(val|after|before|left|hanging|sz|space|color|ascii|hAnsi)=")([A-Za-z0-9]+)(")/g,(all,start,tag,attr,value,end)=>{
            if(!/^(?:\d+|[A-Fa-f0-9]{6}|Consolas)$/.test(value))return all;
            const group=tag==='sz'?'appendFontHalfPoint':tag==='color'||attr==='color'?'appendColor':tag==='rFonts'?'appendFont':tag==='bottom'&&attr==='sz'?'appendBorderEighthPoint':tag==='bottom'&&attr==='space'?'appendBorderSpacePoint':'append'+tag[0].toUpperCase()+tag.slice(1)+'Twip';
            return start+'${'+ref(group,/^\d+$/.test(value)?Number(value):value)+'}'+end;
          });
          // More than one visual attribute may be present in the same element.
          for(let i=0;i<5;i++)after=after.replace(/(<w:(spacing|rFonts|ind|bottom)\b[^<>]*?\bw:(after|before|left|hanging|sz|space|color|ascii|hAnsi)=")([A-Za-z0-9]+)(")/g,(all,start,tag,attr,value,end)=>{
            if(!/^(?:\d+|[A-Fa-f0-9]{6}|Consolas)$/.test(value))return all;
            const group=attr==='color'?'appendColor':tag==='rFonts'?'appendFont':tag==='bottom'&&attr==='sz'?'appendBorderEighthPoint':tag==='bottom'&&attr==='space'?'appendBorderSpacePoint':'append'+tag[0].toUpperCase()+tag.slice(1)+'Twip';
            return start+'${'+ref(group,/^\d+$/.test(value)?Number(value):value)+'}'+end;
          });
          if(after!==before){if(ts.isStringLiteral(node))after='`'+after.slice(1,-1)+'`';add(node,after,'OOXML presentation attributes');return;}
        }
      }
    }
    ts.forEachChild(node,visit);
  }visit(sf);
  if(file.includes('/qr/')){
    const exact=[['Math.min(2048, Math.max(128, parseInt(url.searchParams.get(\'size\') ?? \'512\', 10)))','Math.min(QDOutput.qr.maxSize, Math.max(QDOutput.qr.minSize, parseInt(url.searchParams.get(\'size\') ?? String(QDOutput.qr.defaultSize), 10)))'],
      ['margin: 2','margin: QDOutput.qr.margin'],["'#c9a86a'",'QDOutput.qr.darkForeground'],["'#0a0908'",'QDOutput.qr.ink'],["'#ffffff'",'QDOutput.qr.paper']];
    for(const[before,after]of exact){let start=code.indexOf(before);if(start<0)throw Error(file+' missing '+before);while(start>=0){edits.push({start,end:start+before.length,before,after,role:'QR presentation'});start=code.indexOf(before,start+before.length);}}
  }
  edits.sort((a,b)=>b.start-a.start);for(let i=0;i<edits.length-1;i++)if(edits[i+1].end>edits[i].start)throw Error('overlapping '+file);
  let after=code;for(const edit of edits)after=after.slice(0,edit.start)+edit.after+after.slice(edit.end);
  if(edits.length)after="import { QDOutput } from '@/lib/design/q-design-output';\n"+after;
  if(edits.length){records.push({path:file,beforeHash:hash(code),afterHash:hash(after),edits:edits.map(({start,end,...rest})=>rest)});outputs.set(file,after);}
}
values.qr={defaultSize:512,minSize:128,maxSize:2048,margin:2,darkForeground:'#c9a86a',ink:'#0a0908',paper:'#ffffff'};
const canonical='// Q-Design owns finite DOCX and invitation QR presentation defaults.\n// Physical units remain separate from screen CSS; user content and authorization are not in this module.\nexport const QDOutput = '+JSON.stringify(values,null,2)+' as const;\n';
console.log(JSON.stringify({files:records.length,edits:records.reduce((n,r)=>n+r.edits.length,0),groups:Object.keys(values),mode:process.argv.includes('--write')?'write':'dry-run'},null,2));
if(process.argv.includes('--write')){
  if(fs.existsSync(ROOT+'/reviews/atelier-output-migration.json'))throw Error('Output migration already recorded; do not overwrite historical evidence');
  fs.writeFileSync(ROOT+'/source/design/atelier-output.ts',canonical);
  fs.writeFileSync(ROOT+'/reviews/atelier-output-migration.json',JSON.stringify({version:1,records,canonicalHash:hash(canonical)},null,2)+'\n');
  for(const[file,code]of outputs)fs.writeFileSync(QA+'/'+file,code);
}
