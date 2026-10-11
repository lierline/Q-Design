// Root CSS inheritance is a connection check, not a visual-completion certificate.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const req=createRequire(path.resolve(root,'../Q-Atelier/package.json'));
const ts=req('typescript'),postcss=createRequire(req.resolve('next/package.json'))('postcss');
const slash=s=>s.replaceAll('\\','/');
const hash=s=>createHash('sha256').update(s).digest('hex');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const needed=['q-design.foundation.css','q-design.components.css','q-design.palette.css'];

export function inspectConnections(product,id){
 const app=fs.existsSync(path.join(product,'app'))?path.join(product,'app'):path.join(product,'src/app');
 const files=walk(app),entries=files.filter(f=>/(?:^|[\\/])(?:page|layout|loading|error|not-found|global-error|template|default)\.[jt]sx?$/.test(f));
 const read=f=>fs.readFileSync(f,'utf8');
 function cssClosure(entry){
  const source=ts.createSourceFile(entry,read(entry),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),css=new Set();
  function visitCss(file){
   if(css.has(file))return;css.add(file);
   postcss.parse(read(file)).walkAtRules('import',rule=>{
    const match=/^(?:url\()?['"]([^'"]+)['"]/.exec(rule.params);
    if(match?.[1].startsWith('.'))visitCss(path.resolve(path.dirname(file),match[1]));
   });
  }
  for(const n of source.statements)if(ts.isImportDeclaration(n)&&ts.isStringLiteral(n.moduleSpecifier)&&n.moduleSpecifier.text.endsWith('.css')){
   const name=n.moduleSpecifier.text;
   if(name.startsWith('.'))visitCss(path.resolve(path.dirname(entry),name));
   else if(name.startsWith('@/'))visitCss(path.resolve(product,name.slice(2)));
  }
  return [...css];
 }
 const rootLayout=path.join(app,'layout.tsx');
 const roots=new Map([[rootLayout,cssClosure(rootLayout)]]);
 for(const f of entries.filter(f=>path.basename(f)==='global-error.tsx'))roots.set(f,cssClosure(f));
 const missing=[];
 for(const [entry,css]of roots)for(const expected of needed)if(!css.some(f=>path.basename(f)===expected))missing.push({entry:slash(path.relative(product,entry)),missing:expected});
 const surfaces=entries.map(file=>{
  const replacesRoot=path.basename(file)==='global-error.tsx',owner=replacesRoot?file:rootLayout;
  const inherited=[];
  if(!replacesRoot)for(let dir=path.dirname(file);dir.startsWith(app);dir=path.dirname(dir)){
   const layout=path.join(dir,'layout.tsx');if(fs.existsSync(layout))inherited.push(slash(path.relative(product,layout)));
  }
  return {file:slash(path.relative(product,file)),kind:path.basename(file).split('.')[0],layoutChain:inherited,cssOwner:slash(path.relative(product,owner)),connected:needed.every(name=>roots.get(owner).some(f=>path.basename(f)===name))};
 });
 const cssEvidence=[...new Set([...roots.values()].flat())].map(file=>({file:slash(path.relative(product,file)),hash:hash(read(file))}));
 return {product:id,scope:'All App Router pages and UI conventions, including explicit CSS on global-error which replaces the root layout. API HTML, email, print and offline outputs require their separate output contracts.',surfaces:surfaces.length,pages:surfaces.filter(s=>s.kind==='page').length,connected:surfaces.filter(s=>s.connected).length,missing,roots:[...roots].map(([file])=>({file:slash(path.relative(product,file)),hash:hash(read(file))})),cssEvidence,entries:surfaces};
}

if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);if(args.some(a=>!['--write','--check'].includes(a)))throw Error('Use --write or --check');
 const products=[['Q-Atelier','atelier'],['Q-Works','maison'],['DHR','carnet']].map(([dir,id])=>inspectConnections(path.resolve(root,'..',dir),id));
 const report={version:1,scope:'Shared CSS inheritance only. Individual component overrides and visual/interaction audit remain separate.',products};
 if(args.includes('--write'))fs.writeFileSync(path.join(root,'reviews/all-screen-connections.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(products.map(({product,pages,surfaces,connected,missing})=>({product,pages,surfaces,connected,missing})),null,2));
 if(args.includes('--check')&&products.some(p=>p.missing.length||p.connected!==p.surfaces))process.exitCode=1;
}
