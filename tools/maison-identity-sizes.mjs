// Narrow explicit component/prop migration, preserving exact numeric defaults.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { runtimeFiles,hash } from './style-arguments-core.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),product=path.resolve(root,'../Q-Works');
const require=createRequire(path.join(product,'package.json')),ts=require('typescript');
const cases={CompanyMark:{maxHeightMm:{11:'qdPrint.companyMark.bandMaxHeightMm',14:'qdPrint.companyMark.maxHeightMm',16:'qdPrint.companyMark.headerMaxHeightMm'}},BrandLogo:{size:{28:'qdMaison.logoLegalSize',56:'qdMaison.logoAuthMobileSize',96:'qdMaison.logoSize',108:'qdMaison.logoRailSize'}},QrCode:{size:{88:'qdPrint.documentQrSize'}}};
const sites=[],writes=[];
for(const file of runtimeFiles(product).filter(file=>file.endsWith('.tsx'))){
  const full=path.join(product,file),source=fs.readFileSync(full,'utf8'),sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),edits=[];
  const visit=node=>{
    if(ts.isJsxSelfClosingElement(node)||ts.isJsxOpeningElement(node)){
      const component=node.tagName.getText(sf),rules=cases[component];
      if(rules)for(const attr of node.attributes.properties)if(ts.isJsxAttribute(attr)&&attr.initializer&&ts.isJsxExpression(attr.initializer)&&attr.initializer.expression&&ts.isNumericLiteral(attr.initializer.expression)){
        const property=attr.name.getText(sf),literal=attr.initializer.expression,replacement=rules[property]?.[literal.text];
        if(replacement){edits.push({start:literal.getStart(sf),end:literal.end,replacement});sites.push({path:file,line:sf.getLineAndCharacterOfPosition(attr.getStart(sf)).line+1,component,property,original:literal.text,replacement,sourceHash:hash(source)});}
      }
    }ts.forEachChild(node,visit);
  };visit(sf);
  if(!edits.length)continue;
  let code=source;for(const edit of edits.sort((a,b)=>b.start-a.start))code=code.slice(0,edit.start)+edit.replacement+code.slice(edit.end);
  for(const [symbol,module]of [['qdPrint','q-design-print'],['qdMaison','q-design-runtime']])if(edits.some(e=>e.replacement.startsWith(symbol+'.'))&&!sf.statements.some(statement=>ts.isImportDeclaration(statement)&&statement.moduleSpecifier.text===`@/lib/design/${module}`&&statement.importClause?.namedBindings&&ts.isNamedImports(statement.importClause.namedBindings)&&statement.importClause.namedBindings.elements.some(binding=>binding.name.text===symbol))){
    const directive=sf.statements.find(statement=>ts.isExpressionStatement(statement)&&statement.expression.text==='use client');
    const index=directive?.end??0;code=code.slice(0,index)+`\nimport { ${symbol} } from "@/lib/design/${module}";\n`+code.slice(index);
  }
  writes.push([full,code]);
}
if(process.argv.includes('--write')){for(const[file,code]of writes)fs.writeFileSync(file,code);fs.writeFileSync(path.join(root,'reviews/maison-identity-size-migration.json'),JSON.stringify({version:1,sites},null,2)+'\n');}
console.log(JSON.stringify({files:writes.length,sites:sites.length,write:process.argv.includes('--write')}));
