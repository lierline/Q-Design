// Conservative, syntax-only evidence. No product module is executed.
export function finiteStrings(node, ts, limit = 32) {
  if (ts.isStringLiteralLike(node)) return [node.text];
  if (ts.isParenthesizedExpression(node)) return finiteStrings(node.expression, ts, limit);
  if (ts.isConditionalExpression(node)) {
    const yes = finiteStrings(node.whenTrue, ts, limit), no = finiteStrings(node.whenFalse, ts, limit);
    return yes && no && yes.length + no.length <= limit ? [...new Set([...yes, ...no])] : null;
  }
  if (!ts.isTemplateExpression(node)) return null;
  let values = [node.head.text];
  for (const span of node.templateSpans) {
    const replacements = finiteStrings(span.expression, ts, limit);
    if (!replacements || values.length * replacements.length > limit) return null;
    values = values.flatMap(prefix => replacements.map(value => prefix + value + span.literal.text));
  }
  return [...new Set(values)];
}

export function embeddedStyleSheets(code, ts, filename) {
  const sf = ts.createSourceFile(filename, code, ts.ScriptTarget.Latest, true, filename.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const sheets = [];
  const add = node => {
    const values = finiteStrings(node, ts);
    if (values) for (const css of values) sheets.push({ css, line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1 });
  };
  const visit = node => {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(sf) === 'style') {
      for (const child of node.children) if (ts.isJsxExpression(child) && child.expression) add(child.expression);
    }
    if (ts.isVariableDeclaration(node) && node.name.getText(sf) === 'qdPrintDocumentCss' && node.initializer) add(node.initializer);
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return sheets;
}

// The exhaustive scanner intentionally captures every string in className/cn.
// Predicates are separately identifiable: neither equality operands nor the
// condition of a ternary are returned as CSS class values.
export function predicateClassTokens(sf, ts) {
  const tokens = new Set(), otherTokens = new Set();
  const comparisons = [ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken];
  const visit = node => {
    if (ts.isStringLiteralLike(node)) {
      let predicate = false;
      for (let parent = node.parent; parent; parent = parent.parent) {
        if (ts.isConditionalExpression(parent) && node.pos >= parent.condition.pos && node.end <= parent.condition.end) predicate = true;
        if (ts.isBinaryExpression(parent) && comparisons.includes(parent.operatorToken.kind)) predicate = true;
        if (ts.isStatement(parent) || ts.isJsxAttribute(parent)) break;
      }
      const start = node.getStart(sf) + 1;
      for (const match of node.text.matchAll(/\S+/g)) (predicate ? tokens : otherTokens).add(`${sf.getLineAndCharacterOfPosition(start + match.index).line + 1}:${match[0]}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  // The scanner records line/value rather than byte offsets. A same-line
  // predicate/returned-value collision must remain unresolved.
  for (const token of otherTokens) tokens.delete(token);
  return tokens;
}

export function utilityBase(value) {
  let depth = 0, split = -1;
  for (let index = 0; index < value.length; index++) {
    if (value[index] === '[') depth++;
    else if (value[index] === ']') depth--;
    else if (value[index] === ':' && depth === 0) split = index;
  }
  return value.slice(split + 1);
}

export function inlineStyleDependencies(sf, ts) {
  const groups = new Map();
  const visit = node => {
    if (ts.isJsxAttribute(node) && node.name.getText(sf) === 'style' && node.initializer && ts.isJsxExpression(node.initializer)) {
      let expression = node.initializer.expression;
      while (expression && (ts.isAsExpression(expression) || ts.isParenthesizedExpression(expression))) expression = expression.expression;
      if (expression && ts.isObjectLiteralExpression(expression)) {
        const dependencies=[];
        let complete=true;
        for(const member of expression.properties){
          if(!ts.isPropertyAssignment(member)&&!ts.isSpreadAssignment(member)){complete=false;break;}
          const line=sf.getLineAndCharacterOfPosition(member.getStart(sf)).line+1;
          dependencies.push({line,kind:ts.isSpreadAssignment(member)?'object-spread':'object-property',property:ts.isSpreadAssignment(member)?'...':member.name.getText(sf).replace(/^['"]|['"]$/g,''),value:ts.isSpreadAssignment(member)?member.expression.getText(sf):member.initializer.getText(sf)});
        }
        if(complete)groups.set(`${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1}:${node.initializer.getText(sf)}`,dependencies);
      }
    }
    ts.forEachChild(node,visit);
  };visit(sf);
  return groups;
}

export function canResolveInlineStyle(dependencies, find) {
  return dependencies.every(dependency=>{
    const decision=find(dependency)?.decision;
    return decision && ['central-source-verified','token-reference-verified','structural-behavior','coordinate-boundary','confirmed-style-composition'].includes(decision);
  });
}

// Resolve the actual imported JSX renderer, never a component name alone.
// The ledger keys by line/value, so ambiguous collisions and shadowed imports
// deliberately stay unresolved even when ordinary TypeScript would resolve them.
export function importedAttributeTargets(sf, ts) {
  const imports=new Map(),shadowed=new Set(),result=new Map();
  for(const statement of sf.statements){
    if(!ts.isImportDeclaration(statement)||!ts.isStringLiteral(statement.moduleSpecifier))continue;
    const bindings=statement.importClause?.namedBindings;
    if(bindings&&ts.isNamedImports(bindings))for(const binding of bindings.elements)imports.set(binding.name.text,{module:statement.moduleSpecifier.text,exported:binding.propertyName?.text??binding.name.text});
  }
  const names=node=>{
    if(ts.isIdentifier(node)){if(imports.has(node.text))shadowed.add(node.text);}
    else if(ts.isObjectBindingPattern(node)||ts.isArrayBindingPattern(node))for(const element of node.elements)if(ts.isBindingElement(element))names(element.name);
  };
  const inspect=node=>{
    if(ts.isVariableDeclaration(node)||ts.isParameter(node))names(node.name);
    if((ts.isFunctionDeclaration(node)||ts.isClassDeclaration(node))&&node.name)names(node.name);
    ts.forEachChild(node,inspect);
  };inspect(sf);
  const visit=node=>{
    if(ts.isJsxOpeningElement(node)||ts.isJsxSelfClosingElement(node)){
      const tag=node.tagName.getText(sf),target=imports.get(tag);
      if(target&&!shadowed.has(tag))for(const attr of node.attributes.properties){
        if(!ts.isJsxAttribute(attr)||!attr.initializer)continue;
        const key=`${sf.getLineAndCharacterOfPosition(attr.getStart(sf)).line+1}:${attr.name.getText(sf)}:${attr.initializer.getText(sf)}`;
        const value={...target,tag};
        if(result.has(key)&&JSON.stringify(result.get(key))!==JSON.stringify(value))result.set(key,null);else if(!result.has(key))result.set(key,value);
      }
    }
    ts.forEachChild(node,visit);
  };visit(sf);return result;
}

// Only unique const objects explicitly typed as CSSProperties participate.
// Other objects, mutable bindings and shadowed names need separate review.
export function typedStyleDependencies(sf, ts) {
  const candidates=new Map(),names=new Map();
  const note=name=>{if(ts.isIdentifier(name))names.set(name.text,(names.get(name.text)??0)+1);else if(ts.isObjectBindingPattern(name)||ts.isArrayBindingPattern(name))for(const element of name.elements)if(ts.isBindingElement(element))note(element.name);};
  const visit=node=>{
    if(ts.isVariableDeclaration(node)||ts.isParameter(node))note(node.name);
    if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.type&&/(?:^|\.)CSSProperties\b/.test(node.type.getText(sf))&&node.initializer&&ts.isObjectLiteralExpression(node.initializer)&&(node.parent.flags&ts.NodeFlags.Const)){
      const dependencies=[];let complete=true;
      for(const member of node.initializer.properties){
        if(!ts.isPropertyAssignment(member)&&!ts.isSpreadAssignment(member)){complete=false;break;}
        dependencies.push({line:sf.getLineAndCharacterOfPosition(member.getStart(sf)).line+1,kind:ts.isSpreadAssignment(member)?'object-spread':'object-property',property:ts.isSpreadAssignment(member)?'...':member.name.getText(sf).replace(/^['"]|['"]$/g,''),value:ts.isSpreadAssignment(member)?member.expression.getText(sf):member.initializer.getText(sf)});
      }
      if(complete)candidates.set(node.name.text,dependencies);
    }
    ts.forEachChild(node,visit);
  };visit(sf);
  for(const name of candidates.keys())if(names.get(name)!==1)candidates.delete(name);
  // A const object's properties can still be mutated. Any assignment through
  // a candidate, including Object.assign, invalidates this simple proof.
  const writes=node=>{
    if(ts.isBinaryExpression(node)&&node.operatorToken.kind>=ts.SyntaxKind.FirstAssignment&&node.operatorToken.kind<=ts.SyntaxKind.LastAssignment){for(const name of candidates.keys())if(node.left.getText(sf).startsWith(name+'.')||node.left.getText(sf).startsWith(name+'['))candidates.delete(name);}
    if(ts.isCallExpression(node)&&node.expression.getText(sf)==='Object.assign'&&node.arguments[0])candidates.delete(node.arguments[0].getText(sf));
    if(ts.isIdentifier(node)&&candidates.has(node.text)){
      const parent=node.parent;
      const declaration=ts.isVariableDeclaration(parent)&&parent.name===node;
      const spread=ts.isSpreadAssignment(parent);
      const style=ts.isJsxExpression(parent)&&ts.isJsxAttribute(parent.parent)&&parent.parent.name.getText(sf)==='style';
      if(!declaration&&!spread&&!style)candidates.delete(node.text);
      if(declaration&&parent.parent.parent.modifiers?.some(modifier=>modifier.kind===ts.SyntaxKind.ExportKeyword))candidates.delete(node.text);
    }
    ts.forEachChild(node,writes);
  };writes(sf);return candidates;
}

// A scanner candidate such as `const r = await action()` is not an SVG radius
// when every lexical use reads a result-envelope field. Unknown direct uses,
// shadowing, escaped values and any other property prevent this classification.
export function businessResultBindings(sf,ts){
  const result=new Set();
  const awaited=node=>ts.isAwaitExpression(node)||(ts.isParenthesizedExpression(node)&&awaited(node.expression))||(ts.isConditionalExpression(node)&&awaited(node.whenTrue)&&awaited(node.whenFalse));
  const visit=node=>{
    if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.initializer&&awaited(node.initializer)){
      const name=node.name.text;let scope=node.parent,valid=true,references=0,bindings=0;
      while(scope.parent&&!ts.isFunctionLike(scope)&&!ts.isSourceFile(scope))scope=scope.parent;
      const inspect=current=>{
        if((ts.isVariableDeclaration(current)||ts.isParameter(current))&&ts.isIdentifier(current.name)&&current.name.text===name)bindings++;
        if(ts.isIdentifier(current)&&current.text===name&&current!==node.name){
          const parent=current.parent;
          if(ts.isPropertyAccessExpression(parent)&&parent.name===current){/* unrelated obj.r key */}
          else if(ts.isPropertyAccessExpression(parent)&&parent.expression===current&&['data','error','success','ok','status'].includes(parent.name.text))references++;
          else valid=false;
        }
        ts.forEachChild(current,inspect);
      };inspect(scope);
      if(valid&&references&&bindings===1)result.add(`${sf.getLineAndCharacterOfPosition(node.name.getStart(sf)).line+1}:${name}:${node.initializer.getText(sf)}`);
    }
    ts.forEachChild(node,visit);
  };visit(sf);return result;
}

export function ignoresObjectParameter(sf,ts,exported,property){
  const matches=sf.statements.filter(node=>ts.isFunctionDeclaration(node)&&node.name?.text===exported);
  if(matches.length!==1)return false;
  const fn=matches[0],parameter=fn.parameters[0];
  if(!parameter||!ts.isObjectBindingPattern(parameter.name)||parameter.name.elements.some(element=>element.dotDotDotToken||(element.propertyName??element.name).getText(sf)===property))return false;
  let usesArguments=false;const visit=node=>{if(ts.isIdentifier(node)&&node.text==='arguments')usesArguments=true;ts.forEachChild(node,visit);};visit(fn.body);
  return !usesArguments;
}

export function explicitlyDiscardedBinding(sf,ts,name){
  let bindings=0,discards=0,other=0;
  const visit=node=>{
    if(ts.isIdentifier(node)&&node.text===name){
      const parent=node.parent;
      if(ts.isBindingElement(parent)&&parent.name===node)bindings++;
      else if(ts.isVoidExpression(parent))discards++;
      else if(ts.isPropertySignature(parent)&&parent.name===node){/* API type only */}
      else other++;
    }
    ts.forEachChild(node,visit);
  };visit(sf);return bindings===1&&discards===1&&other===0;
}

export function uniqueConstScalars(sf,ts){
  const values=new Map(),counts=new Map();
  const note=name=>{if(ts.isIdentifier(name))counts.set(name.text,(counts.get(name.text)??0)+1);else if(ts.isObjectBindingPattern(name)||ts.isArrayBindingPattern(name))for(const element of name.elements)if(ts.isBindingElement(element))note(element.name);};
  const visit=node=>{
    if(ts.isVariableDeclaration(node)||ts.isParameter(node))note(node.name);
    if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.initializer&&(node.parent.flags&ts.NodeFlags.Const))values.set(node.name.text,node.initializer.getText(sf));
    ts.forEachChild(node,visit);
  };visit(sf);for(const name of values.keys())if(counts.get(name)!==1)values.delete(name);return values;
}

export function conditionalScalarLeaves(value,ts,aliases=new Map(),seen=new Set()){
  const sf=ts.createSourceFile('scalar.ts',`const value=(${value});`,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
  if(sf.parseDiagnostics.length)return null;
  const visit=node=>{
    if(ts.isParenthesizedExpression(node)||ts.isAsExpression(node))return visit(node.expression);
    if(ts.isConditionalExpression(node)){const yes=visit(node.whenTrue),no=visit(node.whenFalse);return yes&&no?[...yes,...no]:null;}
    if(ts.isIdentifier(node)&&aliases.has(node.text)){
      if(seen.has(node.text))return null;
      return conditionalScalarLeaves(aliases.get(node.text),ts,aliases,new Set([...seen,node.text]));
    }
    if(ts.isStringLiteralLike(node))return [node.text];
    if(ts.isNumericLiteral(node))return [node.text];
    if(ts.isIdentifier(node)||ts.isPropertyAccessExpression(node))return[node.getText(sf)];
    return null;
  };return visit(sf.statements[0].declarationList.declarations[0].initializer);
}

// The exact export and member must exist. A token-looking spelling alone is
// insufficient, and any local shadow of an import invalidates this simple proof.
export function importedValueBindings(sf,ts){
  const imports=new Map();
  for(const statement of sf.statements){
    if(!ts.isImportDeclaration(statement)||!ts.isStringLiteral(statement.moduleSpecifier))continue;
    const bindings=statement.importClause?.namedBindings;
    if(bindings&&ts.isNamedImports(bindings))for(const spec of bindings.elements)imports.set(spec.name.text,{module:statement.moduleSpecifier.text,exported:spec.propertyName?.text??spec.name.text});
  }
  const remove=name=>{
    if(ts.isIdentifier(name))imports.delete(name.text);
    else if(ts.isObjectBindingPattern(name)||ts.isArrayBindingPattern(name))for(const item of name.elements)if(ts.isBindingElement(item))remove(item.name);
  };
  const visit=node=>{
    if(ts.isVariableDeclaration(node)||ts.isParameter(node))remove(node.name);
    if((ts.isFunctionDeclaration(node)||ts.isClassDeclaration(node))&&node.name)remove(node.name);
    ts.forEachChild(node,visit);
  };visit(sf);return imports;
}

export function exportedMemberPaths(sf,ts){
  const paths=new Set(),functions=new Map();
  for(const statement of sf.statements)if(ts.isFunctionDeclaration(statement)&&statement.name)functions.set(statement.name.text,statement);
  const unwrap=node=>{
    while(node&&(ts.isAsExpression(node)||ts.isParenthesizedExpression(node)||ts.isSatisfiesExpression(node)))node=node.expression;
    return node;
  };
  const descend=(prefix,input,seen=new Set())=>{
    paths.add(prefix);let node=unwrap(input);
    if(node&&ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&functions.has(node.expression.text)&&!seen.has(node.expression.text)){
      const fn=functions.get(node.expression.text),returns=[];
      const visit=current=>{if(current!==fn.body&&ts.isFunctionLike(current))return;if(ts.isReturnStatement(current)&&current.expression)returns.push(current.expression);ts.forEachChild(current,visit);};
      if(fn.body)visit(fn.body);
      if(returns.length===1){descend(prefix,returns[0],new Set([...seen,node.expression.text]));return;}
    }
    if(!node||!ts.isObjectLiteralExpression(node))return;
    // Spreads and dynamic computed keys can overwrite a known member. Keep
    // only the exported root in that case rather than inventing a member map.
    if(node.properties.some(member=>ts.isSpreadAssignment(member)||(member.name&&ts.isComputedPropertyName(member.name))))return;
    for(const member of node.properties){
      if(!member.name||(!ts.isIdentifier(member.name)&&!ts.isStringLiteralLike(member.name)&&!ts.isNumericLiteral(member.name)))continue;
      const child=prefix+'.'+member.name.text;
      if(ts.isPropertyAssignment(member))descend(child,member.initializer,seen);
      else paths.add(child);
    }
  };
  for(const statement of sf.statements){
    if(!ts.isVariableStatement(statement)||!statement.modifiers?.some(item=>item.kind===ts.SyntaxKind.ExportKeyword))continue;
    for(const declaration of statement.declarationList.declarations)if(ts.isIdentifier(declaration.name)&&declaration.initializer)descend(declaration.name.text,declaration.initializer);
  }
  return paths;
}
