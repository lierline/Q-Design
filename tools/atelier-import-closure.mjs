import path from 'node:path';

// Discovery only. Imports add candidate modules, never approved style values.
// Callers still use the lexical, branch-complete value proof on each argument.
export function adapterImportClosure({ts,files,seeds}) {
 const result=[...new Set(seeds)],known=new Set(result);
 for(const [file,code]of files){
  const sf=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,file.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  for(const statement of sf.statements){
   if(!ts.isImportDeclaration(statement)&&!ts.isExportDeclaration(statement))continue;
   const spec=statement.moduleSpecifier;if(!spec||!ts.isStringLiteral(spec))continue;
   const module=spec.text,base=module.startsWith('@/')?module.slice(2):module.startsWith('.')?path.posix.normalize(path.posix.join(path.posix.dirname(file),module)):null;
   if(!base||path.posix.isAbsolute(base)||base.split('/').some(p=>p==='..'||p===''))continue;
   const target=['.ts','.tsx','/index.ts','/index.tsx'].map(s=>base+s).find(p=>files.has(p));
   if(target&&!known.has(target)){known.add(target);result.push(target);}
  }
 }
 return result;
}
