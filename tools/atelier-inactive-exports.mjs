import path from 'node:path';

// This is a fresh runtime-use graph, not a filename or deprecated-name exemption.
// Recheck every source file each time. A new alias, dynamic namespace access or
// an indirect reference from a different token export blocks the entire group.
export function inactiveExportGroup({ts,root,files,target,names}){
 const options={noLib:true,noEmit:true,allowJs:true,skipLibCheck:true,types:[],jsx:ts.JsxEmit.Preserve,target:ts.ScriptTarget.Latest,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,baseUrl:root,paths:{'@/*':['./*']}};
 const full=path.resolve(root,target),canonical=f=>path.resolve(f).toLowerCase();
 const scripts=files.filter(f=>/\.[cm]?[jt]sx?$/.test(f));
 const program=ts.createProgram(scripts.map(f=>path.resolve(root,f)),options),checker=program.getTypeChecker(),source=program.getSourceFile(full);
 if(!source)return {inactive:false,ranges:[],references:[{reason:'Target source missing'}]};
 const module=checker.getSymbolAtLocation(source);
 if(!module)return {inactive:false,ranges:[],references:[{reason:'Target module unresolved'}]};
 const exported=new Map(checker.getExportsOfModule(module).filter(s=>names.includes(s.name)).map(s=>[s.name,s]));
 if(exported.size!==names.length)return {inactive:false,ranges:[],references:[{reason:'Reviewed export missing'}]};
 const declarations=[...exported.values()].flatMap(s=>s.declarations??[]);
 const ranges=declarations.map(d=>({name:d.name?.getText(source),start:source.getLineAndCharacterOfPosition(d.getStart(source)).line+1,end:source.getLineAndCharacterOfPosition(d.end).line+1}));
 const references=[],add=(sf,n,reason)=>references.push({path:path.relative(root,sf.fileName).replaceAll('\\','/'),line:sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1,reason});
 const symbol=n=>{let s=checker.getSymbolAtLocation(n);if(s?.flags&ts.SymbolFlags.Alias)try{s=checker.getAliasedSymbol(s);}catch{return null;}return s;};
 const erased=n=>{for(let p=n;p&&!ts.isSourceFile(p);p=p.parent){if(ts.isTypeNode(p)||ts.isImportDeclaration(p)||ts.isExportDeclaration(p))return true;if(ts.isStatement(p))break;}return false;};
 const inGroup=(sf,n)=>sf===source&&declarations.some(d=>n.getStart(sf)>=d.getStart(source)&&n.end<=d.end);
 for(const file of scripts){const sf=program.getSourceFile(path.resolve(root,file));if(!sf){references.push({path:file,reason:'Runtime source missing from program'});continue;}
  if(program.getSyntacticDiagnostics(sf).length){references.push({path:file,reason:'Runtime source has parse errors'});continue;}
  const visit=n=>{
   if(!erased(n)&&!inGroup(sf,n)){
    if(ts.isIdentifier(n)||ts.isStringLiteral(n)){
     const s=symbol(n);
     if(s&&[...exported.values()].includes(s))add(sf,n,'Runtime reference to reviewed export');
     if(ts.isIdentifier(n)&&s===module){const p=n.parent;
      if(ts.isPropertyAccessExpression(p)&&p.expression===n){if(!checker.getSymbolAtLocation(p.name))add(sf,p,'Unresolved namespace member');}
      else if(ts.isElementAccessExpression(p)&&p.expression===n){if(!ts.isStringLiteral(p.argumentExpression)||names.includes(p.argumentExpression.text))add(sf,p,'Dynamic or reviewed namespace member');}
      else add(sf,n,'Module namespace escapes static member access');
     }
    }
    if(ts.isCallExpression(n)&&(n.expression.kind===ts.SyntaxKind.ImportKeyword||n.expression.getText(sf)==='require')&&ts.isStringLiteral(n.arguments[0])){
     const resolved=ts.resolveModuleName(n.arguments[0].text,sf.fileName,options,ts.sys).resolvedModule;
     if(resolved&&canonical(resolved.resolvedFileName)===canonical(full))add(sf,n,'Dynamic module loading prevents an inactive-export proof');
    }
   }
   ts.forEachChild(n,visit);
  };visit(sf);
 }
 return {inactive:references.length===0,names,ranges,references,runtimeFiles:scripts.length};
}
