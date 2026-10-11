import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {hash} from './style-arguments-core.mjs';
import {verifiedParameterLeaves} from './atelier-parameter-leaves-review.mjs';
import {PARTS} from './sync-parts.mjs';
import {centralOutputs,copyProblems} from './audit-coverage-core.mjs';

const root=path.resolve(import.meta.dirname,'..'),product=path.resolve(root,'../Q-Atelier'),file='components/TimeSeriesChart.tsx';
const read=p=>fs.readFileSync(path.join(/^(source|patterns|dist)\//.test(p)?root:product,p),'utf8');
const currentHash=p=>hash(read(p));
const own=read(file),manifest=JSON.parse(fs.readFileSync(path.join(root,'reviews/atelier-responsive-chart-migration.json'),'utf8')).records[0];
const ts=createRequire(path.join(product,'package.json'))('typescript');
const evidence=(p,line=1)=>({path:p,line,hash:currentHash(p)});

export function chartSeriesPalette(ts,sf,checker){
 const imported=sf.statements.filter(ts.isImportDeclaration).flatMap(n=>n.moduleSpecifier.text==='@/lib/design/tokens'?n.importClause?.namedBindings?.elements??[]:[]).find(e=>e.name.text==='T'&&!e.propertyName);
 if(!imported)throw Error('Palette binding changed');
 const paletteSymbol=checker.getSymbolAtLocation(imported.name),calls=[],bindings=[];
 const visit=n=>{if(ts.isVariableDeclaration(n)&&n.name.getText(sf)==='series')bindings.push(n.initializer);if((ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n))&&n.tagName.getText(sf)==='TimeSeriesChart')calls.push(n);ts.forEachChild(n,visit);};visit(sf);
 if(calls.length!==1||calls[0].attributes.properties.some(ts.isJsxSpreadAttribute))throw Error('Unreviewed chart call shape');
 let series=calls[0].attributes.properties.find(n=>ts.isJsxAttribute(n)&&n.name.getText(sf)==='series')?.initializer?.expression;
 if(series&&ts.isIdentifier(series)&&series.text==='series'&&bindings.length===1)series=bindings[0];
 if(!series||!ts.isArrayLiteralExpression(series)||series.elements.length!==2)throw Error('Series composition changed');
 const colors=series.elements.map(element=>{
  if(!ts.isObjectLiteralExpression(element)||element.properties.some(p=>!ts.isPropertyAssignment(p)))throw Error('Unknown chart color composition');
  const value=element.properties.find(p=>p.name.getText(sf)==='color')?.initializer;
  if(!value||!ts.isPropertyAccessExpression(value)||value.expression.getText(sf)!=='T'||!['champagne','red','blue','green'].includes(value.name.text)||!paletteSymbol||checker.getSymbolAtLocation(value.expression)!==paletteSymbol)throw Error('Chart color is not the exact imported palette role');
  return value.getText(sf);
 });
 return{colors,line:sf.getLineAndCharacterOfPosition(calls[0].getStart(sf)).line+1};
}

export function createChartLayoutReview(){
 if(hash(own)!==manifest.afterHash)throw Error('Chart source differs from the exact reviewed responsive migration');
 const flow=JSON.parse(fs.readFileSync(path.join(root,'reviews/atelier-parameter-leaves-review.json'),'utf8')).flows.find(f=>f.path===file&&f.prop==='height');
 if(!verifiedParameterLeaves(flow,currentHash)||flow.callers.length!==2)throw Error('Chart height flow needs new review');
 const callers=['components/dashboard/ExecDashboardView.tsx','app/(app)/quality-objectives/[id]/client.tsx'];
 if(flow.callers.some(c=>!callers.includes(c.path)))throw Error('Unreviewed chart caller');
 const config=ts.readConfigFile(path.join(product,'tsconfig.json'),ts.sys.readFile);
 const options=ts.parseJsonConfigFileContent(config.config,ts.sys,product).options;
 const program=ts.createProgram(callers.map(p=>path.join(product,p)),{...options,noEmit:true,incremental:false}),checker=program.getTypeChecker();
 const palette=[];
 for(const caller of callers){
  const sf=program.getSourceFile(path.join(product,caller)),result=chartSeriesPalette(ts,sf,checker);
  palette.push({path:caller,colors:result.colors,evidence:evidence(caller,result.line)});
 }
 const part=centralOutputs(PARTS,'Q-Atelier',product).find(p=>p.path==='lib/design/q-design-chart-layout.ts');
 if(!part||copyProblems(part,read(part.src),read(part.path)).length)throw Error('Chart layout is not the canonical copy');
 const common=[evidence(file),...flow.evidence,...palette.map(p=>p.evidence),...['source/design/chart-layout.ts','source/design/atelier-runtime.ts','lib/design/q-design-chart-layout.ts','lib/design/q-design-runtime.ts','lib/design/q-design-scale.ts','lib/design/tokens.ts','patterns/foundation.css','patterns/foundation/atelier-core-values.css','dist/q-design.palette.atelier.css'].map(p=>evidence(p))];
 const reviews=JSON.parse(fs.readFileSync(path.join(root,'reviews/atelier-style-decisions.json'),'utf8')).records;
 const exact=new Map();
 const add=(line,kind,property,decision,reason)=>exact.set(JSON.stringify([line,kind,property]),{decision,reason});
 const data='Exact point/path/tick coordinates derive from unchanged data calculations, measured chart width, the symbol-traced central height input, and central font/padding/offset rules. No authored local pixel offset is accepted.';
 for(const [line,kind,property] of [[34,'named-style-value','padding'],[40,'named-style-value','width'],[41,'named-style-value','fontSize'],[66,'named-style-value','w'],[67,'named-style-value','h'],[79,'object-property','x'],[79,'object-property','y'],[86,'object-property','y'],[116,'svg-geometry','viewBox'],[124,'svg-geometry','x1'],[125,'svg-geometry','y1'],[126,'svg-geometry','x2'],[127,'svg-geometry','y2'],[132,'svg-geometry','x'],[133,'svg-geometry','y'],[147,'svg-geometry','d'],[148,'svg-geometry','d'],[152,'svg-geometry','cx'],[153,'svg-geometry','cy'],[161,'object-property','marginTop'],[161,'object-property','paddingLeft'],[161,'object-property','paddingRight']])add(line,kind,property,'coordinate-boundary',data);
 add(45,'named-style-value','resize','structural-behavior','Exact ResizeObserver measures the host; its subscription and MutationObserver are disconnected by effect cleanup. It is not a motion default.');
 add(161,'class-utility','className','structural-behavior','Exact axis container marker names the browser-test target. It does not supply any authored CSS declaration; layout is independently reviewed.');
 for(const [line,kind,property] of [[80,'object-property','color'],[147,'presentation-attribute','fill'],[148,'presentation-attribute','stroke'],[155,'presentation-attribute','fill'],[197,'object-property','background']])add(line,kind,property,'token-reference-verified','All actual symbol-traced TimeSeriesChart callers pass only the reviewed central T palette roles. The path/point/legend colors forward those exact values; area tint reads QDRuntime.alpha.tint0_08.');
 for(const [line,kind,property] of [[97,'style-expression','style'],[118,'style-expression','style'],[161,'object-property','gridTemplateColumns'],[161,'style-expression','style'],[163,'style-expression','style'],[193,'style-expression','style']])add(line,kind,property,'confirmed-style-composition','This complete expression was inspected: dimensions come from the measured viewport or symbol-traced central height; label count/alignment and exact selected data-position anchors from canonical chart-layout; font, gap, width, margin and palette from central roles. Zero min-width and wrapping are structural. No arbitrary caller style or hardcoded visual default is accepted.');
 const records=[];
 for(const record of reviews.filter(r=>r.path===file)){
  const spec=exact.get(JSON.stringify([record.line,record.kind,record.property]));if(!spec)continue;
  if(record.sourceHash!==hash(own))throw Error('Style inventory is stale');
  records.push({path:file,line:record.line,sourceHash:record.sourceHash,argumentHash:record.argumentHash,kind:record.kind,property:record.property,reviewedExpression:record.value,decision:spec.decision,ruleId:'exact-responsive-chart-layout-and-input-flow',reason:spec.reason,evidence:[...new Map(common.concat(evidence(file,record.line)).map(e=>[JSON.stringify(e),e])).values()]});
 }
 if(records.length!==exact.size)throw Error('Exact chart argument positions changed');
 return{version:1,scope:'Exact chart arguments and all current symbol-traced height/color callers. Data geometry, central presentation and structural observation are distinct. Every other argument stays separately inventoried. Not an all-screen visual certificate.',palette,records};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=createChartLayoutReview();fs.writeFileSync(path.join(root,'reviews/atelier-chart-layout-review.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({records:report.records.length,paletteCallers:report.palette.length}));
}
