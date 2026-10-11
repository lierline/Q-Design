// Route CSS transition/animation adapters to shared Q-Design motion settings.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { codeFiles } from '../source/component-registry-core.mjs';
const ROOT='D:/Claude/Q-Design',PRODUCT='D:/Claude/Q-Atelier',ts=createRequire(path.join(PRODUCT,'package.json'))('typescript');
const write=process.argv.includes('--write'),ledger=path.join(ROOT,'source/style-adapters/atelier-motion-values.json');
if(write&&fs.existsSync(ledger))throw new Error('Existing motion ledger must not be overwritten');
const manifest=JSON.parse(fs.readFileSync(path.join(PRODUCT,'lib/engine/validation-manifest.generated.json'),'utf8'));
const protectedFiles=new Set(Object.values(manifest).flatMap(engine=>Object.keys(engine.dependencies))),files=[];
const hash=value=>createHash('sha256').update(value.replaceAll('\r\n','\n')).digest('hex');
for(const file of codeFiles(PRODUCT).filter(file=>file.endsWith('.tsx')&&!protectedFiles.has(file))){
  const code=fs.readFileSync(path.join(PRODUCT,file),'utf8');
  if(code.includes('q-design-header-end'))continue;
  const sf=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),edits=[];
  function visit(node){
    if(ts.isPropertyAccessExpression(node)&&ts.isIdentifier(node.expression)&&node.expression.text==='MOTION'&&['fast','normal'].includes(node.name.text)){
      let style=false;
      for(let parent=node.parent;parent;parent=parent.parent){
        if(ts.isPropertyAssignment(parent)){style=['transition','animation'].includes(parent.name.getText(sf));break;}
        if(ts.isFunctionLike(parent))break;
      }
      if(!style)throw new Error(`Unreviewed MOTION consumer ${file}:${sf.getLineAndCharacterOfPosition(node.pos).line+1}`);
      edits.push({start:node.getStart(sf),end:node.end,old:node.getText(sf),next:`QD.motion${node.name.text==='fast'?'Fast':'Normal'}`,line:sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1});
    }
    ts.forEachChild(node,visit);
  }visit(sf);
  if(!edits.length)continue;
  const hasQD=sf.statements.some(statement=>ts.isImportDeclaration(statement)&&statement.importClause?.namedBindings&&ts.isNamedImports(statement.importClause.namedBindings)&&statement.importClause.namedBindings.elements.some(spec=>spec.name.text==='QD'));
  let output=code;
  for(const edit of edits.slice().sort((a,b)=>b.start-a.start))output=output.slice(0,edit.start)+edit.next+output.slice(edit.end);
  if(!hasQD){
    const firstImport=sf.statements.find(ts.isImportDeclaration);
    if(!firstImport)throw new Error(`Expected import boundary: ${file}`);
    const offset=firstImport.getStart(sf);
    output=output.slice(0,offset)+"import { QD } from '@/lib/design/q-design-contract';\n"+output.slice(offset);
  }
  files.push({path:file,beforeHash:hash(code),afterHash:hash(output),conversions:edits.map(({start,end,...record})=>record)});
  if(write)fs.writeFileSync(path.join(PRODUCT,file),output);
}
fs.writeFileSync(write?ledger:path.join(ROOT,'../tmp/atelier-motion-values-dry.json'),JSON.stringify({version:1,scope:'Exact CSS animation/transition reads of legacy MOTION.fast/normal now consume QD.motionFast/Normal. Shared durations/easing and reduced-motion overrides apply.',files},null,2)+'\n');
console.log(JSON.stringify({write,files:files.length,conversions:files.reduce((n,file)=>n+file.conversions.length,0)}));
