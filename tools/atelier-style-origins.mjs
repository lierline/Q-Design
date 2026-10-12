// Trace immutable local objects into actual JSX style attributes. This supplies
// context only; every leaf still needs the existing central/structural proof.
export function collectStyleObjectOrigins({ts,sf,locals,hash}) {
 const origins=new Map(), sourceHash=hash(sf.text);
 const line=n=>sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1;
 const follow=(node,consumer,seen=new Set(),depth=0)=>{
  if(!node||depth>15||seen.has(node))return;
  const next=new Set(seen);next.add(node);
  if(ts.isAsExpression(node)||ts.isSatisfiesExpression(node)||ts.isParenthesizedExpression(node)){follow(node.expression,consumer,next,depth+1);return;}
  if(ts.isIdentifier(node)){const local=locals.resolve(node);if(local)follow(local.node,consumer,next,depth+1);return;}
  if(ts.isConditionalExpression(node)){follow(node.whenTrue,consumer,next,depth+1);follow(node.whenFalse,consumer,next,depth+1);return;}
  if(ts.isBinaryExpression(node)&&[ts.SyntaxKind.QuestionQuestionToken,ts.SyntaxKind.BarBarToken].includes(node.operatorToken.kind)){follow(node.left,consumer,next,depth+1);follow(node.right,consumer,next,depth+1);return;}
  if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)){
   const callable=locals.callable(node.expression);
   if(callable&&node.arguments.length<=callable.fn.parameters.length&&!node.arguments.some(ts.isSpreadElement))for(const returned of callable.returns)follow(returned,consumer,next,depth+1);
   return;
  }
  if(!ts.isObjectLiteralExpression(node))return;
  for(const prop of node.properties){
   if(ts.isSpreadAssignment(prop)){follow(prop.expression,consumer,next,depth+1);continue;}
   if(!ts.isPropertyAssignment(prop)||ts.isComputedPropertyName(prop.name))continue;
   const key=`${line(prop)}:${prop.name.getText(sf).replace(/^['"]|['"]$/g,'')}:${prop.initializer.getText(sf)}`;
   const evidence={path:sf.fileName,line:line(consumer),hash:sourceHash};
   const rows=origins.get(key)??[];if(!rows.some(r=>r.line===evidence.line))rows.push(evidence);origins.set(key,rows);
  }
 };
 const visit=node=>{
  if(ts.isJsxAttribute(node)&&['style','itemStyle'].includes(node.name.getText(sf))&&node.initializer&&ts.isJsxExpression(node.initializer))follow(node.initializer.expression,node);
  ts.forEachChild(node,visit);
 };visit(sf);return origins;
}
