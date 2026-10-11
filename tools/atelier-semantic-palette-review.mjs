import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {hash,scanArguments,cssProperties,runtimeFiles} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Atelier',req=createRequire(product+'/package.json'),ts=req('typescript'),postcss=req('postcss');
const properties=cssProperties(ts,fs.readFileSync(path.join(path.dirname(req.resolve('typescript')),'lib.dom.d.ts'),'utf8'));
const consumers={
 'components/ChangeImpactDecisionTree.tsx':'fbd50d17f4920b4c6040856bb0ca7e372dffd378918499da7cb448907e21be88',
 'app/(app)/letter-to-file/page.tsx':'443dee80a3665a62c2a818884a3656b159acaa81ea321e765fc73ebb8b6f0004',
 'app/(app)/letter-to-file/[id]/client.tsx':'2f9720b2ff33b581680db2b636e3f7f66aa3214bf1ffc1011e1a30d230448ea0',
 'app/(app)/assessments/[code]/page.tsx':'0e9050c2627fead257e9c4a60ab62b49451d5f7faf25a1e44c15c3d0ce70effb',
 'app/api/assessments/[code]/docx/route.ts':'aa16f4a964ad82ed6146e9610c136b1bc4aa69ab0de3ec7ae495d120df4837c9',
 'components/dashboard/RDDashboardView.tsx':'987d25866381e3529846d86f6f9e570f6fc146ecc95c271ae6aaf792291b4221',
};
const specs=[
 {path:'lib/change-impact/decision-tree.ts',binding:'CONCLUSION_INFO',values:['red','warning','green','subtle'],sinks:[['components/ChangeImpactDecisionTree.tsx','const colorMap = {'],['components/ChangeImpactDecisionTree.tsx','const c = colorMap[info.color];']],reason:'Conclusion metadata selects a semantic key. The reviewed renderer maps all four keys to T.red/warning/green/subtle before any CSS use. These enum strings are never literal CSS colors.'},
 {path:'lib/letter-to-file.ts',binding:'LTF_CONCLUSION_INFO',values:['red','green','warning'],sinks:[['app/(app)/letter-to-file/page.tsx',"const color = info?.color === 'red'"],['app/(app)/letter-to-file/[id]/client.tsx',"const concColor = info.color === 'red'"]],reason:'Conclusion metadata is compared as a domain enum. Both actual renderers select only the central T.red/green/warning/subtle values, including the missing-conclusion fallback.'},
 {path:'lib/mfds-labels.ts',binding:'MFDS_TYPE_LABELS',values:['red','warning','blue','green','warning'],sinks:[['app/(app)/assessments/[code]/page.tsx','summary={MFDS_TYPE_LABELS[e.mfdsClassification.type]?.label'],['app/api/assessments/[code]/docx/route.ts','const typeLabel = MFDS_TYPE_LABELS[m.type]?.label']],unused:true,reason:'This retained metadata field is not read by the current UI or document exporter. Both runtime consumers read .label; the UI uses explicit central Tag colors and the DOCX exporter adds escaped label text. The color enum itself has no current paint effect.'},
 {path:'lib/research/dashboard-priority.ts',binding:'rankProjectsByPriority',values:['champagne','warning','blue','warning','red','warning'],sinks:[['components/dashboard/RDDashboardView.tsx','function badgeColor('],['components/dashboard/RDDashboardView.tsx','const c = badgeColor(top1.badge?.color);'],['components/dashboard/RDDashboardView.tsx','<Tag color={badgeColor(r.badge.color)}>']],reason:'Priority scoring emits semantic badge metadata. The hero and portfolio renderer both pass it through badgeColor, whose every branch returns a central T token. Priority score arithmetic is not approved by this palette-boundary record.'},
];
export function buildSemanticPaletteReview(read=(file)=>fs.readFileSync(path.join(/^(patterns|dist|source)\//.test(file)?root:product,file),'utf8')){
 const mfdsConsumers=[];for(const file of runtimeFiles(product).filter(file=>/\.[jt]sx?$/.test(file))){const code=read(file);if(!code.includes('mfds-labels'))continue;const sf=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,file.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);let found=false;const walk=n=>{if((ts.isImportDeclaration(n)||ts.isExportDeclaration(n))&&n.moduleSpecifier&&ts.isStringLiteral(n.moduleSpecifier)&&n.moduleSpecifier.text.endsWith('/mfds-labels'))found=true;if(ts.isCallExpression(n)&&n.arguments.some(a=>ts.isStringLiteral(a)&&a.text.endsWith('/mfds-labels')))found=true;ts.forEachChild(n,walk);};walk(sf);if(found)mfdsConsumers.push(file);}
 if(JSON.stringify(mfdsConsumers)!==JSON.stringify(['app/(app)/assessments/[code]/page.tsx','app/api/assessments/[code]/docx/route.ts']))throw Error('Re-review changed MFDS metadata consumer graph');
 const evidence=(file,needle)=>{const code=read(file);if(consumers[file]&&hash(code)!==consumers[file])throw Error('Re-review changed semantic consumer: '+file);const index=needle?code.indexOf(needle):0;if(index<0)throw Error('Missing semantic consumer: '+needle);return {path:file,line:code.slice(0,index).split('\n').length,hash:hash(code)};};
 const records=[];
 for(const spec of specs){const code=read(spec.path),sf=ts.createSourceFile(spec.path,code,ts.ScriptTarget.Latest,true),nodes=[];
  const walk=n=>{if(ts.isPropertyAssignment(n)&&n.name.getText(sf)==='color'&&ts.isStringLiteral(n.initializer)){let owner=n.parent;while(owner&&!((ts.isVariableDeclaration(owner)||ts.isFunctionDeclaration(owner))&&owner.name?.getText(sf)===spec.binding))owner=owner.parent;if(owner)nodes.push(n);}ts.forEachChild(n,walk);};walk(sf);
  if(JSON.stringify(nodes.map(n=>n.initializer.text))!==JSON.stringify(spec.values))throw Error('Re-review changed semantic keys: '+spec.path);
  const argumentsFound=scanArguments(spec.path,code,{ts,postcss,properties});
  for(const node of nodes){const line=sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1,value=node.initializer.getText(sf),argument=argumentsFound.find(a=>a.kind==='object-property'&&a.property==='color'&&a.line===line&&a.value===value);if(!argument)throw Error('Missing exact semantic scanner argument');
   records.push({path:spec.path,line,sourceHash:hash(code),argumentHash:hash(JSON.stringify(argument)),reviewedKind:argument.kind,reviewedProperty:argument.property,reviewedExpression:argument.value,decision:spec.unused?'compatibility-noop':'delegated-renderer-parameter',ruleId:'exact-semantic-palette-key',reason:spec.reason,evidence:[evidence(spec.path),...spec.sinks.map(([file,needle])=>evidence(file,needle)),evidence('lib/design/tokens.ts'),evidence('dist/q-design.palette.atelier.css'),evidence('app/q-design.palette.css')]});
  }
 }
 return {version:1,scope:'Exact reviewed enum-to-palette consumers. Renderer CSS arguments remain independently inventoried. No raw RGB value or business scoring expression is approved.',records};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const report=buildSemanticPaletteReview();fs.writeFileSync(root+'/reviews/atelier-semantic-palette-review.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({records:report.records.length}));}
