import path from 'node:path';

// Reviewed cssScale body: key-preserving map to a CSS var with a numeric fallback.
// A changed helper is deliberately left unknown until its new semantics are reviewed.
export const REVIEWED_CSS_SCALE = '81d9f944f8e00439f0b47512610bee5f2e37374c9552387f44f865f5b24e6e1a';
export const REVIEWED_FETCH_JSON = 'fedb3d8cef45e84d18a55549d1f0e5eb3ee0de8f5bb9bc6cf7196680a3b4e713';
export const REVIEWED_PROGRESS_COLOR = '9af0e6f9869fb2a551e3df05320e6a5fcc5272931c9b676e5c381c4b681f4ffa';
const REVIEWED_GRAIN = 'a6756472622e7dc01d571d243bb3966d7e01fa493d786c4e8e4842ce4e83b458';
const REVIEWED_HANGUL_STYLE = '9ea0e0ff3afb380592818d2e3a16e8be1144ff28f052046e219e699c2784c30e';
const REVIEWED_LABEL_HELPERS = {
  labelTracking: 'a466158a8d2109920b8842eb4c059aeb6573de37b6e92ca1e8f762b78be1ae7a',
  labelWordSpacing: 'b519e748de05f5a1201c593260581fc9600e993c2f418c6b5659fca5cdc884b8',
  labelCase: 'e5e639ab40efac17b21cc498051485b769ea4b4202bd1fd40084b5e2a9ab110e',
};

export function primaryVariables(text, variables) {
  const found = [];
  let rest = text.trim();
  while (rest) {
    const start = /^var\(\s*(--[\w-]+)\s*(?=[,)])/.exec(rest);
    if (!start || !variables.has(start[1])) return null;
    let depth = 0, quote = '', end = -1;
    for (let i = 3; i < rest.length; i++) {
      const char = rest[i];
      if (quote) { if (char === quote && rest[i - 1] !== '\\') quote = ''; continue; }
      if (char === '"' || char === "'") { quote = char; continue; }
      if (char === '(') depth++;
      if (char === ')' && --depth === 0) { end = i; break; }
    }
    if (end < 0) return null;
    found.push(start[1]); rest = rest.slice(end + 1).trim();
  }
  return found.length ? [...new Set(found)] : null;
}

// Exact consumer reviews are reusable only at the reviewed AST leaf. They do
// not turn other references to the same spelling into approved parameters.
export function reviewedLeafProof(argument, review) {
  if(!review)return null;
  const forwarded=new Set(['exact-style-prop-flow','exact-dimension-forwarding','exact-color-forwarding']);
  if(forwarded.has(review.ruleId)&&review.decision==='delegated-renderer-parameter'
    &&['object-spread','object-property','presentation-attribute','dynamic-style','style-expression'].includes(argument.kind))
    return {central:false,evidence:review.evidence.map(item=>({...item,delegatedReview:true}))};
  if(review.ruleId==='exact-fold-grid-consumer')return {central:true,evidence:review.evidence};
  if(review.ruleId==='exact-sized-renderer-metric'&&review.decision==='token-reference-verified'&&argument.kind==='object-property')return {central:true,evidence:review.evidence};
  if(['exact-domain-ratio-rendering','exact-measured-element-position'].includes(review.ruleId)
    &&['object-property','presentation-attribute','dynamic-style'].includes(argument.kind))
    return {central:false,evidence:review.evidence.map(item=>({...item,dataGeometryReview:true}))};
  return null;
}

export function collectAdapterReferences({ ts, files, variables, hash, numericFiles = new Set(), centralFiles = new Map() }) {
  const references = new Map();
  for (const [file, code] of files) {
    const sf = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const sourceHash = hash(code);
    if(centralFiles.has(file))for(const statement of sf.statements){
      if(ts.isFunctionDeclaration(statement)&&statement.name&&statement.modifiers?.some(modifier=>modifier.kind===ts.SyntaxKind.ExportKeyword)
        &&statement.parameters.every(parameter=>ts.isIdentifier(parameter.name)&&!parameter.dotDotDotToken))references.set(`${file}::${statement.name.text}#recipeCall`,[{path:file,line:sf.getLineAndCharacterOfPosition(statement.getStart(sf)).line+1,hash:sourceHash,recipeParameters:statement.parameters.length,requiredRecipeParameters:statement.parameters.filter(parameter=>!parameter.initializer&&!parameter.questionToken).length},centralFiles.get(file)]);
    }
    if (file === 'lib/design/q-design-labels.ts' && centralFiles.has(file)) {
      for (const node of sf.statements) if (ts.isFunctionDeclaration(node) && REVIEWED_LABEL_HELPERS[node.name?.text]) {
        const reviewedFunctionHash = REVIEWED_LABEL_HELPERS[node.name.text];
        if (hash(ts.createPrinter({ removeComments: true }).printNode(ts.EmitHint.Unspecified, node, sf)) === reviewedFunctionHash) {
          references.set(`${file}::${node.name.text}#language`, [{ path: file,
            line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, hash: sourceHash,
            reviewedFunctionHash, adapterFunction: node.name.text }, centralFiles.get(file)]);
        }
      }
    }
    const fetchJson = sf.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'fetchJson');
    if (file === 'lib/api/fetch-json.ts' && fetchJson
      && hash(ts.createPrinter({ removeComments: true }).printNode(ts.EmitHint.Unspecified, fetchJson, sf)) === REVIEWED_FETCH_JSON) {
      references.set(`${file}::fetchJson#response`, [{ path: file,
        line: sf.getLineAndCharacterOfPosition(fetchJson.getStart(sf)).line + 1,
        hash: sourceHash, reviewedFunctionHash: REVIEWED_FETCH_JSON }]);
    }
    const unwrap = node => ts.isAsExpression(node) || ts.isParenthesizedExpression(node) || ts.isSatisfiesExpression(node) ? unwrap(node.expression) : node;
    const helper = sf.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'cssScale');
    const scaleVerified = helper && hash(ts.createPrinter({ removeComments: true }).printNode(ts.EmitHint.Unspecified, helper, sf)) === REVIEWED_CSS_SCALE;
    const add = (key, node, tokens, extra = []) => references.set(`${file}::${key}`, [
      { path: file, line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, hash: sourceHash,
        ...(ts.isNumericLiteral(node)||ts.isPrefixUnaryExpression(node)&&ts.isNumericLiteral(node.operand)?{valueKind:'number'}:ts.isStringLiteralLike(node)||ts.isTemplateExpression(node)?{valueKind:'string'}:{}) },
      ...extra, ...tokens.map(token => variables.get(token)),
    ]);
    function visit(node, key, depth = 0) {
      if (depth > 8) return;
      node = unwrap(node);
      if (centralFiles.has(file)) add(key, node, [], [centralFiles.get(file)]);
      if (centralFiles.has(file) && (ts.isArrowFunction(node) || ts.isFunctionExpression(node))
        && node.parameters.every(parameter=>ts.isIdentifier(parameter.name)&&!parameter.dotDotDotToken)) {
        references.set(`${file}::${key}#recipeCall`, [{path:file,line:sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1,hash:sourceHash,
          recipeParameters:node.parameters.length,requiredRecipeParameters:node.parameters.filter(parameter=>!parameter.initializer&&!parameter.questionToken).length},centralFiles.get(file)]);
      }
      // A verified canonical module may construct a recipe object through a local
      // builder. Inspect its one explicit returned object without executing code.
      // This records only declared members, never arbitrary caller keys or calls.
      if (centralFiles.has(file) && ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const builder = sf.statements.find(statement => ts.isFunctionDeclaration(statement)
          && statement.name?.text === node.expression.text);
        const returns = builder?.body?.statements.filter(statement => ts.isReturnStatement(statement)) ?? [];
        if (returns.length === 1 && returns[0].expression && ts.isObjectLiteralExpression(unwrap(returns[0].expression))) {
          visit(returns[0].expression, key, depth + 1);
        }
      }
      if (ts.isObjectLiteralExpression(node)) {
        if(node.properties.every(property=>ts.isPropertyAssignment(property)&&!ts.isComputedPropertyName(property.name))){
          references.set(`${file}::${key}#keys`,[{path:file,line:sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1,hash:sourceHash,
            closedObjectKeys:node.properties.map(property=>property.name.getText(sf).replace(/^['"]|['"]$/g,''))}]);
        }
        for (const property of node.properties) if (ts.isPropertyAssignment(property) && !ts.isComputedPropertyName(property.name)) {
          visit(property.initializer, key + '.' + property.name.getText(sf).replace(/^['"]|['"]$/g, ''), depth + 1);
        }
        return;
      }
      let value;
      if (ts.isStringLiteralLike(node)) value = node.text;
      else if (ts.isTemplateExpression(node)) value = node.head.text + node.templateSpans.map(span => '__FALLBACK__' + span.literal.text).join('');
      if (value !== undefined) {
        const tokens = primaryVariables(value, variables);
        if (tokens) add(key, node, tokens);
      }
      if (numericFiles.has(file) && (ts.isNumericLiteral(node) || ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand))) add(key, node, []);
      if (scaleVerified && ts.isCallExpression(node) && node.expression.getText(sf) === 'cssScale'
        && node.arguments.length === 3 && ts.isStringLiteral(node.arguments[0])) {
        const prefix = node.arguments[0].text;
        const expected = { space: ['S', 'px'], 'font-size': ['FS', 'px'], leading: ['LH', ''] }[prefix];
        if (!expected || node.arguments[1].getText(sf) !== expected[0] || !ts.isStringLiteral(node.arguments[2]) || node.arguments[2].text !== expected[1]) return;
        const imported = sf.statements.some(statement => ts.isImportDeclaration(statement) && statement.moduleSpecifier.text === './tokens'
          && statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings)
          && statement.importClause.namedBindings.elements.some(spec => spec.name.text === expected[0] && (spec.propertyName?.text ?? spec.name.text) === expected[0]));
        if (!imported) return;
        for (const variable of variables.keys()) if (variable.startsWith(`--qd-${prefix}-`)) {
          const suffix = variable.slice(`--qd-${prefix}-`.length);
          if (prefix !== 'leading' && !/^\d+(?:-\d+)?$/.test(suffix)) continue;
          add(`${key}.${suffix.replace('-', '.')}`, node, [variable], [{ path: file,
            line: sf.getLineAndCharacterOfPosition(helper.getStart(sf)).line + 1, hash: sourceHash,
            reviewedFunctionHash: REVIEWED_CSS_SCALE }]);
        }
      }
    }
    const immutable = centralFiles.has(file) ? null : localBindings(ts, sf, hash, references);
    for (const statement of sf.statements) if (ts.isVariableStatement(statement)
      && statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const declaration of statement.declarationList.declarations) if (ts.isIdentifier(declaration.name) && declaration.initializer) {
        if (!immutable || immutable.resolve(declaration.name)) visit(declaration.initializer, declaration.name.text);
        if (file === 'lib/design/tokens.ts' && declaration.name.text === 'alpha'
          && hash(ts.createPrinter({ removeComments: true }).printNode(ts.EmitHint.Unspecified, declaration.initializer, sf)) === '97ef1dda07de5bc1d1969b1844ac24f5f56f4e118e8ba936bb02788538eb56a4') {
          references.set(`${file}::alpha()`, [{ path: file, line: sf.getLineAndCharacterOfPosition(declaration.getStart(sf)).line + 1,
            hash: sourceHash, reviewedFunctionHash: '97ef1dda07de5bc1d1969b1844ac24f5f56f4e118e8ba936bb02788538eb56a4' }]);
        }
      }
    }
  }
  // The progress value is domain data. Only this complete reviewed clamping
  // and HSL recipe is accepted; its three display settings must be central.
  const progressCode=files.get('lib/design/components.tsx');
  if(progressCode){
    const sf=ts.createSourceFile('lib/design/components.tsx',progressCode,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
    const fn=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='batteryColor');
    const imported=sourceImports(ts,sf).get('QDPresentation');
    const keys=['maximumHue','saturation','lightness'].map(key=>'lib/design/q-design-runtime.ts::QDPresentation.visual.battery.'+key);
    if(fn&&hash(ts.createPrinter({removeComments:true}).printNode(ts.EmitHint.Unspecified,fn,sf))===REVIEWED_PROGRESS_COLOR
      &&imported?.module==='@/lib/design/q-design-runtime'&&imported.exported==='QDPresentation'
      &&centralFiles.has('lib/design/q-design-runtime.ts')&&keys.every(key=>references.get(key)?.[0]?.valueKind==='number')){
      references.set('lib/design/components.tsx::batteryColor#progressColor',[{path:'lib/design/components.tsx',line:sf.getLineAndCharacterOfPosition(fn.getStart(sf)).line+1,hash:hash(progressCode),reviewedFunctionHash:REVIEWED_PROGRESS_COLOR,valueKind:'string',dataGeometryReview:true},...keys.flatMap(key=>references.get(key))]);
    }
  }
  const grainCode = files.get('lib/design/grain.ts');
  if (grainCode) {
    const sf = ts.createSourceFile('lib/design/grain.ts', grainCode, ts.ScriptTarget.Latest, true);
    const ratio = references.get('lib/design/q-design-runtime.ts::QDRuntime.grain.tint');
    const alpha = references.get('lib/design/tokens.ts::alpha()');
    if (ratio && alpha && hash(ts.createPrinter({ removeComments: true }).printFile(sf)) === REVIEWED_GRAIN) {
      const own = { path: 'lib/design/grain.ts', line: 1, hash: hash(grainCode), reviewedFunctionHash: REVIEWED_GRAIN };
      references.set('lib/design/grain.ts::tintBorder#visualUnary', [own, ...ratio, ...alpha]);
      const fragments = ['--qd-border-width', '--qd-atelier-border-style-5ed175bd8d'];
      if (fragments.every(name => variables.has(name))) references.set('lib/design/grain.ts::ruleBand#visualUnary', [own, ...ratio, ...alpha, ...fragments.map(name => variables.get(name))]);
    }
  }
  const hangulFile='lib/design/hangul-text.tsx',hangulCode=files.get(hangulFile);
  if(hangulCode){
    const sf=ts.createSourceFile(hangulFile,hangulCode,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
    const fn=sf.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='codeOrTextFont');
    const expected=['lib/design/q-design-scale.ts::QDScale.family.ui','lib/design/q-design-scale.ts::QDScale.family.mono','lib/design/q-design-labels.ts::QDText.tracking.codeDefault'];
    const imports=sourceImports(ts,sf);
    if(fn&&hash(ts.createPrinter({removeComments:true}).printNode(ts.EmitHint.Unspecified,fn,sf))===REVIEWED_HANGUL_STYLE
      &&imports.get('QDScale')?.module==='@/lib/design/q-design-scale'&&imports.get('QDText')?.module==='@/lib/design/q-design-labels'
      &&expected.every(key=>references.has(key))&&variables.has('--qd-atelier-letter-spacing-1029873b1c')){
      references.set(hangulFile+'::codeOrTextFont#language',[{path:hangulFile,line:sf.getLineAndCharacterOfPosition(fn.getStart(sf)).line+1,hash:hash(hangulCode),reviewedFunctionHash:REVIEWED_HANGUL_STYLE,adapterFunction:'codeOrTextFont'},...expected.flatMap(key=>references.get(key)),variables.get('--qd-atelier-letter-spacing-1029873b1c')]);
    }
  }
  // Exported selectors are accepted only if every possible visual return is
  // independently central/structural without trusting any caller parameter.
  for (let pass = 0; pass < 3; pass++) for (const [file, code] of files) {
    if (centralFiles.has(file)) continue;
    const sf = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const locals = localBindings(ts, sf, hash, references), imports = sourceImports(ts, sf);
    for (const statement of sf.statements) {
      if (!statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
      if(ts.isVariableStatement(statement)) for(const declaration of statement.declarationList.declarations) {
        if(!ts.isIdentifier(declaration.name)||!declaration.initializer)continue;
        const visit=(node,key)=>{
          const proof=expressionProof({ts,node,sf,property:'style',imports,file,references,variables,locals});
          if(proof?.central)references.set(`${file}::${key}`,[{path:file,line:sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1,hash:hash(code),...(numericExpression({ts,node,sf,imports,file,references,locals})?{valueKind:'number'}:primitiveExpression({ts,node,sf,imports,file,references,locals})?{valueKind:'primitive'}:{})},...proof.evidence]);
          while(ts.isAsExpression(node)||ts.isSatisfiesExpression(node)||ts.isParenthesizedExpression(node))node=node.expression;
          // A direct imported-object alias exposes only its already proven
          // members. An alias never grants arbitrary descendant-key authority.
          const aliasText=node.getText(sf).replace(/\[['"]([\w-]+)['"]\]/g,'.$1');
          if(proof?.central&&/^[\w$]+(?:\.[\w$]+)*$/.test(aliasText)&&imports.has(aliasText.split('.')[0])){
            const[binding,...members]=aliasText.split('.'),imported=imports.get(binding),base=imported.module.startsWith('@/')?imported.module.slice(2):imported.module.startsWith('.')?path.posix.normalize(path.posix.join(path.posix.dirname(file),imported.module)):null;
            if(base)for(const suffix of ['.ts','.tsx']){
              const originRoot=`${base}${suffix}::${imported.exported}${members.length?'.'+members.join('.'):''}`;
              const own={path:file,line:sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1,hash:hash(code)};
              const keys=references.get(originRoot+'#keys');
              if(keys)references.set(`${file}::${key}#keys`,[own,...keys]);
              const prefix=originRoot+'.';
              for(const[origin,evidence]of [...references])if(origin.startsWith(prefix))references.set(`${file}::${key}.${origin.slice(prefix.length)}`,[{...own,...(evidence[0]?.valueKind?{valueKind:evidence[0].valueKind}:{})},...evidence]);
            }
          }
          if(ts.isObjectLiteralExpression(node))for(const member of node.properties)if(ts.isPropertyAssignment(member)&&!ts.isComputedPropertyName(member.name))visit(member.initializer,key+'.'+member.name.getText(sf).replace(/^['"]|['"]$/g,''));
        };
        // Use the immutable declaration through its symbol. A directly proven
        // initializer must not conceal later mutation or escaped aliases.
        if(locals.resolve(declaration.name))visit(declaration.initializer,declaration.name.text);
      }
      const names = ts.isFunctionDeclaration(statement) ? [statement.name] : ts.isVariableStatement(statement)
        ? statement.declarationList.declarations.map(declaration => declaration.name).filter(ts.isIdentifier) : [];
      for (const name of names.filter(Boolean)) {
        const callable = locals.callable(name); if (!callable) continue;
        const proofs = callable.returns.map(node => expressionProof({ ts, node, sf, property: 'style', imports,
          file, references, variables, locals }));
        if (proofs.every(Boolean) && proofs.some(proof => proof.central)) references.set(`${file}::${name.text}#selector`,
          [{...callable.evidence,...(callable.returns.every(node=>primitiveExpression({ts,node,sf,imports,file,references,locals}))?{valueKind:'primitive'}:{})}, ...proofs.flatMap(proof => proof.evidence)]);
        // A returned record may mix business labels with independently central
        // colors. Probe only actual member names with deliberately unknown args.
        // Caller-provided style fields therefore cannot acquire selector trust.
        const memberNames=new Set();
        const memberVisit=node=>{if(ts.isPropertyAssignment(node)&&!ts.isComputedPropertyName(node.name))memberNames.add(node.name.getText(sf).replace(/^['"]|['"]$/g,''));ts.forEachChild(node,memberVisit);};
        for(const returned of callable.returns)memberVisit(returned);
        const visual=[...memberNames].filter(key=>/^(?:color|background|backgroundColor|borderColor|fill|stroke|opacity)$/.test(key));
        if(visual.length){
          const prefix='__qd_unproven_argument_',probeName='__qd_member_probe_';
          if(code.includes(prefix)||code.includes(probeName))continue;
          const args=callable.fn.parameters.map((_,index)=>prefix+index).join(',');
          const probeSource=ts.createSourceFile(file,code+'\n'+visual.map((key,index)=>`const ${probeName}${index}=${name.text}(${args}).${key};`).join('\n'),ts.ScriptTarget.Latest,true,file.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
          const probeLocals=localBindings(ts,probeSource,hash,references),probeImports=sourceImports(ts,probeSource);
          visual.forEach((key,index)=>{const statement=probeSource.statements.at(-visual.length+index),node=statement.declarationList.declarations[0].initializer;
            const proof=expressionProof({ts,node,sf:probeSource,property:key,imports:probeImports,file,references,variables,locals:probeLocals});
            if(proof?.central)references.set(`${file}::${name.text}#member:${key}`,[callable.evidence,...proof.evidence.map(item=>item.path===file?{...item,hash:hash(code)}:item)]);
          });
        }
      }
    }
  }
  return references;
}

export function sourceImports(ts, sf) {
  const imports = new Map(), shadowed = new Set();
  const names = name => {
    if (ts.isIdentifier(name)) shadowed.add(name.text);
    else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) for (const element of name.elements) if (ts.isBindingElement(element)) names(element.name);
  };
  for (const statement of sf.statements) if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) for (const spec of bindings.elements) {
      imports.set(spec.name.text, { module: statement.moduleSpecifier.text, exported: spec.propertyName?.text ?? spec.name.text });
    }
  }
  // Conservative: even a same-name binding in an unrelated scope leaves this file's reference unknown.
  function walk(node) {
    if (ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isBindingElement(node)) names(node.name);
    if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name) names(node.name);
    ts.forEachChild(node, walk);
  }
  walk(sf);
  for (const name of shadowed) imports.delete(name);
  return imports;
}

export function importedReference(value, imports, file, references, suffix = '') {
  const normalized = value.replace(/\[(\d+(?:\.\d+)?|['"][\w-]+['"])\]/g, (_, key) => '.' + key.replace(/^['"]|['"]$/g, ''));
  if (!/^[A-Za-z_$][\w$]*(?:\.[\w$-]+)*$/.test(normalized)) return null;
  const [binding, ...members] = normalized.split('.');
  const imported = imports.get(binding);
  if (!imported) return null;
  let source;
  if (imported.module.startsWith('@/')) source = imported.module.slice(2);
  else if (imported.module.startsWith('.')) source = path.posix.normalize(path.posix.join(path.posix.dirname(file), imported.module));
  else return null;
  const member = `${imported.exported}${members.length ? '.' + members.join('.') : ''}`;
  return references.get(`${source}.ts::${member}${suffix}`) ?? references.get(`${source}.tsx::${member}${suffix}`) ?? null;
}

function importedCall(name, imports, file, references, suffix = '()') {
  const imported = imports.get(name); if (!imported) return null;
  const source = imported.module.startsWith('@/') ? imported.module.slice(2)
    : imported.module.startsWith('.') ? path.posix.normalize(path.posix.join(path.posix.dirname(file), imported.module)) : null;
  return source ? references.get(`${source}.ts::${imported.exported}${suffix}`)
    ?? references.get(`${source}.tsx::${imported.exported}${suffix}`) ?? null : null;
}

// Structural keywords control formatting, flow, reset and visibility. No nonzero
// length, color, timing, opacity fraction, font size or weight is admitted here.
const structuralValues = {
  display: /^(?:none|block|inline|inline-block|flex|inline-flex|grid|inline-grid|contents|table|table-row|table-cell)$/,
  position: /^(?:static|relative|absolute|fixed|sticky)$/,
  flexDirection: /^(?:row|column|row-reverse|column-reverse)$/,
  flexWrap: /^(?:wrap|nowrap|wrap-reverse)$/,
  alignItems: /^(?:normal|stretch|center|start|end|flex-start|flex-end|baseline)$/,
  alignSelf: /^(?:auto|normal|stretch|center|start|end|flex-start|flex-end|baseline)$/,
  justifyContent: /^(?:normal|stretch|center|start|end|flex-start|flex-end|space-between|space-around|space-evenly)$/,
  justifySelf: /^(?:auto|normal|stretch|center|start|end|flex-start|flex-end)$/,
  placeItems: /^(?:center|start|end|stretch)$/,
  flexGrow: /^[01]$/, flexShrink: /^[01]$/,
  textAlign: /^(?:left|center|right|start|end|justify)$/,
  textOverflow: /^(?:clip|ellipsis)$/,
  whiteSpace: /^(?:normal|nowrap|pre|pre-wrap|pre-line|break-spaces)$/,
  overflow: /^(?:visible|hidden|clip|scroll|auto)$/,
  overflowX: /^(?:visible|hidden|clip|scroll|auto)$/,
  overflowY: /^(?:visible|hidden|clip|scroll|auto)$/,
  overflowWrap: /^(?:normal|break-word|anywhere)$/,
  wordBreak: /^(?:normal|break-all|keep-all|break-word)$/,
  boxSizing: /^(?:border-box|content-box)$/,
  cursor: /^(?:auto|default|pointer|text|not-allowed|wait|progress|grab|grabbing|move|col-resize|row-resize|help)$/,
  resize: /^(?:none|vertical|horizontal|both)$/,
  userSelect: /^(?:none|text|auto|all)$/,
  pointerEvents: /^(?:none|auto)$/,
  touchAction: /^(?:none|auto|manipulation|pan-x|pan-y)$/,
  visibility: /^(?:visible|hidden|collapse)$/,
  fontVariantNumeric: /^tabular-nums$/,
  textDecoration: /^(?:none|underline|line-through)$/,
  listStyle: /^none$/,
  alignContent: /^(?:normal|stretch|center|start|end|flex-start|flex-end|space-between|space-around|space-evenly)$/,
  background: /^(?:none|transparent)$/, backgroundColor: /^transparent$/,
  border: /^(?:none|0|transparent)$/, outline: /^(?:none|0)$/,
  verticalAlign: /^(?:middle|top|bottom|baseline|text-top|text-bottom)$/,
  objectFit: /^(?:contain|cover|fill|none|scale-down)$/,
  isolation: /^(?:auto|isolate)$/,
  tableLayout: /^(?:auto|fixed)$/,
  overscrollBehavior: /^(?:auto|contain|none)$/,
  WebkitBoxOrient: /^(?:horizontal|vertical)$/,
  textWrap: /^(?:wrap|nowrap|balance|pretty|stable)$/,
  containerType: /^(?:normal|size|inline-size)$/,
  appearance: /^(?:none|auto)$/,
  borderCollapse: /^(?:collapse|separate)$/,
  clip: /^rect\(0 0 0 0\)$/,
  transform: /^(?:none|translate[XY]?\(0(?:,\s*0)?\))$/,
  wordSpacing: /^0$/,
  transition: /^0$/,
};
export function isStructural(property, value) {
  return Boolean(structuralValues[property]?.test(value))
    || /^border(?:Top|Right|Bottom|Left)?(?:Color)?$/.test(property) && value === 'transparent'
    || /^(?:border(?:Top|Right|Bottom|Left)?|outline|boxShadow)$/.test(property) && /^(?:none|0)$/.test(value)
    || value === 'inherit'
    || /^(?:gridColumn|gridRow)$/.test(property) && value === '1 / -1'
    || /^(?:(?:min|max)?(?:Width|Height)|width|height)$/.test(property) && /^(?:0|auto|none|100%)$/.test(value)
    || /^(?:top|right|bottom|left|inset)$/.test(property) && /^(?:0|auto)$/.test(value)
    || property === 'flex' && /^(?:0|1|none|auto|initial|0 0 auto|1 1 auto|1 1 0)$/.test(value)
    || /^(?:margin|padding)(?:Top|Right|Bottom|Left|Inline|Block|InlineStart|InlineEnd|BlockStart|BlockEnd)?$/.test(property) && /^(?:0|auto)(?: (?:0|auto))*$/.test(value);
}

// Class branches are independently inventoried and must all exist in central CSS.
// A familiar prefix never establishes ownership of an unknown selector.
export function classExpressionProof({ts,node,sf,classes,locals,depth=0}){
  if(!node||depth>15)return null;
  const prove=child=>classExpressionProof({ts,node:child,sf,classes,locals,depth:depth+1});
  const combine=proofs=>proofs.every(Boolean)?{evidence:proofs.flatMap(proof=>proof.evidence)}:null;
  if(ts.isParenthesizedExpression(node)||ts.isAsExpression(node)||ts.isSatisfiesExpression(node))return prove(node.expression);
  if(node.kind===ts.SyntaxKind.NullKeyword||node.kind===ts.SyntaxKind.FalseKeyword||ts.isIdentifier(node)&&node.text==='undefined'&&!locals?.bound(node))return {evidence:[]};
  if(ts.isStringLiteralLike(node)){
    const names=node.text.trim().split(/\s+/).filter(Boolean);
    return names.every(name=>classes.has(name))?{evidence:names.map(name=>classes.get(name))}:null;
  }
  if(ts.isIdentifier(node)){const local=locals?.resolve(node),proof=local&&prove(local.node);return proof?{evidence:[local.evidence,...proof.evidence]}:null;}
  if(ts.isConditionalExpression(node))return combine([prove(node.whenTrue),prove(node.whenFalse)]);
  if(ts.isBinaryExpression(node)&&[ts.SyntaxKind.BarBarToken,ts.SyntaxKind.QuestionQuestionToken].includes(node.operatorToken.kind))return combine([prove(node.left),prove(node.right)]);
  if(ts.isBinaryExpression(node)&&node.operatorToken.kind===ts.SyntaxKind.AmpersandAmpersandToken)return prove(node.right);
  if(ts.isTemplateExpression(node)){
    // Interpolation must delimit whole classes; constructed suffixes are not a selector proof.
    const chunks=[node.head.text,...node.templateSpans.map(span=>span.literal.text)];
    if(chunks.some((chunk,index)=>index<chunks.length-1&&chunk&&!/\s$/.test(chunk)||index>0&&chunk&&!/^\s/.test(chunk)))return null;
    const staticProof=chunks.map(chunk=>{const names=chunk.trim().split(/\s+/).filter(Boolean);return names.every(name=>classes.has(name))?{evidence:names.map(name=>classes.get(name))}:null;});
    return combine([...staticProof,...node.templateSpans.map(span=>prove(span.expression))]);
  }
  return null;
}

// The single-file checker supplies lexical binding identity, not type-based trust.
// Only immutable local const initializers may be followed. Writes or escapes to
// unknown functions block object references; shadowed names resolve independently.
export function localBindings(ts, sf, hash, references = new Map()) {
  const host = { getSourceFile: name => name === sf.fileName ? sf : undefined,
    getDefaultLibFileName: () => '', writeFile() {}, getCurrentDirectory: () => '',
    getDirectories: () => [], fileExists: name => name === sf.fileName,
    readFile: name => name === sf.fileName ? sf.text : undefined,
    getCanonicalFileName: name => name, useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n' };
  const checker = ts.createProgram([sf.fileName], { noResolve: true, noLib: true, target: ts.ScriptTarget.Latest }, host).getTypeChecker();
  const declarations = new Map(), unsafe = new Set(), written = new Set(), finiteMaps = [];
  const root = node => ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node) ? root(node.expression) : node;
  const symbol = node => ts.isIdentifier(node) ? (ts.isShorthandPropertyAssignment(node.parent)
    ? checker.getShorthandAssignmentValueSymbol(node.parent) : checker.getSymbolAtLocation(node)) : undefined;
  const mark = (node, write = false) => { const binding = symbol(root(node)); if (binding) { unsafe.add(binding); if(write)written.add(binding); } };
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer
      && ts.isVariableDeclarationList(node.parent) && node.parent.flags & ts.NodeFlags.Const) {
      const binding = symbol(node.name); if (binding) declarations.set(binding, node);
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && node.operatorToken.kind <= ts.SyntaxKind.LastAssignment) mark(node.left,true);
    if (ts.isPostfixUnaryExpression(node) || ts.isPrefixUnaryExpression(node) && [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(node.operator)) mark(node.operand,true);
    if (ts.isDeleteExpression(node)) mark(node.expression,true);
    if (ts.isCallExpression(node)) {
      // Calling a member can mutate its receiver. Passing the object itself can
      // also transfer mutation authority. Reading a scalar member is safe.
      const readMap = ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'map'
        && node.arguments.length === 1 && (ts.isArrowFunction(node.arguments[0]) || ts.isFunctionExpression(node.arguments[0]))
        && node.arguments[0].parameters.length > 0 && (ts.isIdentifier(node.arguments[0].parameters[0].name)||ts.isObjectBindingPattern(node.arguments[0].parameters[0].name));
      if (readMap) finiteMaps.push(node);
      else if (ts.isPropertyAccessExpression(node.expression) || ts.isElementAccessExpression(node.expression)) mark(node.expression.expression);
      for (const argument of node.arguments) if (ts.isIdentifier(argument)) mark(argument);
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  const imports=sourceImports(ts,sf);
  const primitiveProjection=(node,depth=0)=>{
    if(!node||depth>10)return false;
    if(ts.isParenthesizedExpression(node)||ts.isAsExpression(node)||ts.isSatisfiesExpression(node))return primitiveProjection(node.expression,depth+1);
    if(ts.isStringLiteralLike(node)||ts.isNumericLiteral(node)||ts.isTemplateExpression(node))return true;
    const ref=importedReference(node.getText(sf),imports,sf.fileName,references);if(ref?.[0]?.valueKind)return true;
    if(ts.isConditionalExpression(node))return primitiveProjection(node.whenTrue,depth+1)&&primitiveProjection(node.whenFalse,depth+1);
    if((ts.isPropertyAccessExpression(node)||ts.isElementAccessExpression(node))&&ts.isIdentifier(node.expression)){
      const binding=symbol(node.expression),declaration=declarations.get(binding);if(!declaration||unsafe.has(binding))return false;
      let object=declaration.initializer;while(ts.isAsExpression(object)||ts.isSatisfiesExpression(object)||ts.isParenthesizedExpression(object))object=object.expression;
      if(!ts.isObjectLiteralExpression(object)||object.properties.some(item=>!ts.isPropertyAssignment(item)||ts.isComputedPropertyName(item.name)))return false;
      const key=ts.isPropertyAccessExpression(node)?node.name.text:ts.isStringLiteralLike(node.argumentExpression)||ts.isNumericLiteral(node.argumentExpression)?node.argumentExpression.text:null;
      const members=object.properties.filter(item=>key===null||item.name.getText(sf).replace(/^['"]|['"]$/g,'')===key);
      return members.length>0&&members.every(item=>primitiveProjection(item.initializer,depth+1));
    }
    return false;
  };
  // Mutating or escaping a map element also invalidates the source collection.
  for (const call of finiteMaps) {
    const name=call.arguments[0].parameters[0].name;
    if(ts.isIdentifier(name)?unsafe.has(symbol(name)):name.elements.some(item=>unsafe.has(symbol(item.name))))mark(call.expression.expression);
  }
  // Writes through a direct local alias still invalidate the original object.
  for (let changed = true; changed;) {
    changed = false;
    for (const [binding, declaration] of declarations) if (unsafe.has(binding)) {
      // Escaping an immutable primitive projection cannot mutate its container.
      // Unknown/object-valued projections still propagate mutation authority.
      if(primitiveProjection(declaration.initializer))continue;
      const original = symbol(root(declaration.initializer));
      if (original && !unsafe.has(original)) { unsafe.add(original); changed = true; }
    }
  }
  return { resolve(node, primitiveOnly = false) {
    const binding = symbol(node), declaration = declarations.get(binding);
    if (!declaration || written.has(binding) || !primitiveOnly && unsafe.has(binding)) return null;
    return { node: declaration.initializer, evidence: { path: sf.fileName,
      line: sf.getLineAndCharacterOfPosition(declaration.getStart(sf)).line + 1, hash: hash(sf.text) } };
  }, destructuredValues(node) {
    const binding=symbol(node),declaration=binding?.declarations?.find(ts.isBindingElement);
    if(!declaration||written.has(binding)||declaration.dotDotDotToken||declaration.initializer||!ts.isObjectBindingPattern(declaration.parent))return null;
    const pattern=declaration.parent,parent=pattern.parent;
    const key=(declaration.propertyName??declaration.name).getText(sf).replace(/^['"]|['"]$/g,'');
    if(!ts.isIdentifier(declaration.name)||!/^[$\w]+$/.test(key)||pattern.elements.some(item=>item.dotDotDotToken))return null;
    let origin,array=false;
    if(ts.isVariableDeclaration(parent)&&parent.initializer&&ts.isVariableDeclarationList(parent.parent)&&parent.parent.flags&ts.NodeFlags.Const)origin=parent.initializer;
    if(ts.isParameter(parent)&&finiteMaps.includes(parent.parent.parent)&&parent.parent.parameters[0]===parent){origin=parent.parent.parent.expression.expression;array=true;}
    if(!origin)return null;
    const closed=(value,depth=0)=>{
      if(!value||depth>10)return null;
      if(ts.isAsExpression(value)||ts.isParenthesizedExpression(value)||ts.isSatisfiesExpression(value))return closed(value.expression,depth+1);
      if(ts.isIdentifier(value)){const resolved=this.resolve(value);return resolved?closed(resolved.node,depth+1):null;}
      return value;
    };
    const container=closed(origin);if(!container)return null;
    if(array&&(!ts.isArrayLiteralExpression(container)||container.elements.some(ts.isSpreadElement)))return null;
    const returnedObjects=(value,depth=0)=>{
      if(!value||depth>10)return null;const resolved=closed(value);if(!resolved)return null;
      if(ts.isConditionalExpression(resolved)){const a=returnedObjects(resolved.whenTrue,depth+1),b=returnedObjects(resolved.whenFalse,depth+1);return a&&b?[...a,...b]:null;}
      if(ts.isCallExpression(resolved)&&ts.isIdentifier(resolved.expression)){
        const callable=this.callable(resolved.expression);if(!callable||resolved.arguments.length>callable.fn.parameters.length||resolved.arguments.some(ts.isSpreadElement))return null;
        const branches=callable.returns.map(n=>returnedObjects(n,depth+1));return branches.every(Boolean)?branches.flat():null;
      }
      return ts.isObjectLiteralExpression(resolved)?[resolved]:null;
    };
    const objects=array?container.elements.map(value=>closed(value)):returnedObjects(container),values=[];if(!objects)return null;
    for(const object of objects){
      if(!object||!ts.isObjectLiteralExpression(object)||object.properties.some(item=>!ts.isPropertyAssignment(item)||ts.isComputedPropertyName(item.name)))return null;
      const property=object.properties.find(item=>item.name.getText(sf).replace(/^['"]|['"]$/g,'')===key);if(!property)return null;
      values.push(property.initializer);
    }
    return values.length?{values,escaped:unsafe.has(binding),evidence:{path:sf.fileName,line:sf.getLineAndCharacterOfPosition(declaration.getStart(sf)).line+1,hash:hash(sf.text)}}:null;
  }, parameter(node) {
    const declaration = symbol(node)?.declarations?.find(ts.isParameter);
    return declaration && !unsafe.has(symbol(node)) ? declaration : null;
  }, mapElements(node) {
    const binding = symbol(node);
    if (!binding || unsafe.has(binding)) return null;
    const declaration = binding.declarations?.find(ts.isParameter), fn = declaration?.parent;
    const call = fn?.parent;
    if (!declaration || fn.parameters[0] !== declaration || !finiteMaps.includes(call)) return null;
    return { node: call.expression.expression, evidence: { path: sf.fileName,
      line: sf.getLineAndCharacterOfPosition(call.getStart(sf)).line + 1, hash: hash(sf.text) } };
  }, callable(node) {
    const binding = symbol(node);
    if (!binding || unsafe.has(binding)) return null;
    const declaration = binding.declarations?.find(ts.isFunctionDeclaration);
    const initializer = declarations.get(binding)?.initializer;
    const fn = declaration ?? (initializer && (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)) ? initializer : null);
    if (!fn?.body || fn.asteriskToken || fn.modifiers?.some(m=>m.kind===ts.SyntaxKind.AsyncKeyword) || fn.parameters.some(parameter => !ts.isIdentifier(parameter.name) || parameter.dotDotDotToken)) return null;
    const returns = [];
    if (!ts.isBlock(fn.body)) returns.push(fn.body);
    else {
      const visit = child => {
        if (ts.isFunctionLike(child)) return;
        if (ts.isReturnStatement(child)) { if (child.expression) returns.push(child.expression); return; }
        ts.forEachChild(child, visit);
      };
      visit(fn.body);
    }
    return returns.length ? { fn, returns, evidence: { path: sf.fileName,
      line: sf.getLineAndCharacterOfPosition(fn.getStart(sf)).line + 1, hash: hash(sf.text) } } : null;
  }, imported(node) { const declarations=symbol(node)?.declarations??[];return declarations.length===1&&ts.isImportSpecifier(declarations[0]);
  }, bound(node) { return Boolean(symbol(node)?.declarations?.length); } };
}

// Escaping an object can mutate it; passing a proven primitive cannot. This
// separate type-shape proof never approves its value, and excludes unknown
// calls, object aliases, property reads without central scalar metadata and all
// written bindings. The regular value proof still runs independently.
function primitiveExpression({ts,node,sf,imports,file,references,locals,reviewedNodes,depth=0}) {
  if(!node||depth>12)return false;
  if(['string','number','boolean','mixed'].includes(reviewedNodes?.get(node)?.primitiveType))return true;
  const primitive=child=>primitiveExpression({ts,node:child,sf,imports,file,references,locals,reviewedNodes,depth:depth+1});
  if(ts.isAsExpression(node)||ts.isSatisfiesExpression(node)||ts.isParenthesizedExpression(node))return primitive(node.expression);
  if(ts.isStringLiteralLike(node)||ts.isNumericLiteral(node)||ts.isTemplateExpression(node))return true;
  if(ts.isConditionalExpression(node))return primitive(node.whenTrue)&&primitive(node.whenFalse);
  if(ts.isBinaryExpression(node)&&[ts.SyntaxKind.QuestionQuestionToken,ts.SyntaxKind.BarBarToken].includes(node.operatorToken.kind))return primitive(node.left)&&primitive(node.right);
  const direct=importedReference(node.getText(sf),imports,file,references);
  if(direct?.[0]?.valueKind)return true;
  if((ts.isPropertyAccessExpression(node)||ts.isElementAccessExpression(node))&&ts.isIdentifier(node.expression)){
    let object=locals?.resolve(node.expression)?.node;
    while(object&&(ts.isAsExpression(object)||ts.isSatisfiesExpression(object)||ts.isParenthesizedExpression(object)))object=object.expression;
    if(object&&ts.isObjectLiteralExpression(object)&&object.properties.every(item=>ts.isPropertyAssignment(item)&&!ts.isComputedPropertyName(item.name))){
      const key=ts.isPropertyAccessExpression(node)?node.name.text:node.argumentExpression&&(ts.isStringLiteralLike(node.argumentExpression)||ts.isNumericLiteral(node.argumentExpression))?node.argumentExpression.text:null;
      const members=object.properties.filter(item=>key===null||item.name.getText(sf).replace(/^['"]|['"]$/g,'')===key);
      return members.length>0&&members.every(item=>primitive(item.initializer));
    }
  }
  if(ts.isIdentifier(node)){const local=locals?.resolve(node,true);return Boolean(local&&primitive(local.node));}
  if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)){
    const progress=locals?.imported(node.expression)&&importedCall(node.expression.text,imports,file,references,'#progressColor');
    if(progress&&node.arguments.length===1&&!ts.isSpreadElement(node.arguments[0]))return true;
    const selector=importedCall(node.expression.text,imports,file,references,'#selector');
    if(selector?.[0]?.valueKind)return true;
    const callable=locals?.callable(node.expression);return Boolean(callable&&callable.returns.every(primitive));
  }
  return false;
}

// Resolve closed central lookup paths through immutable local aliases. Dynamic
// keys enumerate every declared branch; no arbitrary descendant is invented.
function importedValueCandidates({ts,node,sf,imports,file,references,locals,depth=0}) {
  if(!node||depth>12)return null;
  const follow=child=>importedValueCandidates({ts,node:child,sf,imports,file,references,locals,depth:depth+1});
  if(ts.isParenthesizedExpression(node)||ts.isAsExpression(node)||ts.isSatisfiesExpression(node))return follow(node.expression);
  if(ts.isIdentifier(node)){
    if(imports.has(node.text))return [{name:node.text,evidence:[]}];
    const resolved=locals?.resolve(node),values=resolved&&follow(resolved.node);
    return values?.map(value=>({...value,evidence:[resolved.evidence,...value.evidence]}))??null;
  }
  if(!ts.isPropertyAccessExpression(node)&&!ts.isElementAccessExpression(node))return null;
  const parents=follow(node.expression);if(!parents)return null;
  const key=ts.isPropertyAccessExpression(node)?node.name.text:node.argumentExpression&&(ts.isStringLiteralLike(node.argumentExpression)||ts.isNumericLiteral(node.argumentExpression))?node.argumentExpression.text:null;
  if(key!==null)return parents.map(parent=>({...parent,name:parent.name+'.'+key}));
  const expanded=[];
  for(const parent of parents){
    const proof=importedReference(parent.name,imports,file,references,'#keys'),keys=proof?.find(item=>item.closedObjectKeys)?.closedObjectKeys;
    if(!keys?.length)return null;
    expanded.push(...keys.map(key=>({name:parent.name+'.'+key,evidence:[...parent.evidence,...proof]})));
  }
  return expanded;
}

function numericExpression({ts,node,sf,imports,file,references,locals,depth=0}) {
  if(!node||depth>12)return false;
  const numeric=child=>numericExpression({ts,node:child,sf,imports,file,references,locals,depth:depth+1});
  if(ts.isParenthesizedExpression(node)||ts.isAsExpression(node)||ts.isSatisfiesExpression(node))return numeric(node.expression);
  if(ts.isNumericLiteral(node))return true;
  const reference=importedReference(node.getText(sf),imports,file,references);
  if(reference)return reference[0]?.valueKind==='number';
  if(ts.isConditionalExpression(node))return numeric(node.whenTrue)&&numeric(node.whenFalse);
  if(ts.isBinaryExpression(node)&&[ts.SyntaxKind.PlusToken,ts.SyntaxKind.MinusToken,ts.SyntaxKind.AsteriskToken,ts.SyntaxKind.SlashToken].includes(node.operatorToken.kind))return numeric(node.left)&&numeric(node.right);
  const candidates=importedValueCandidates({ts,node,sf,imports,file,references,locals});
  if(candidates?.length&&candidates.every(value=>importedReference(value.name,imports,file,references)?.[0]?.valueKind==='number'))return true;
  if(ts.isIdentifier(node)){const local=locals?.resolve(node,true);return Boolean(local&&numeric(local.node));}
  return false;
}

export function expressionProof({ ts, node, sf, property, imports, file, references, variables, locals, reviewedNodes, extendedAliases = false, parameters = new Map(), depth = 0 }) {
  if (!node || depth > 15) return null;
  const reviewed=reviewedNodes?.get(node);if(reviewed)return reviewed;
  const prove = (child, childProperty = property, bindings = parameters) => expressionProof({ ts, node: child, sf, property: childProperty, imports, file, references, variables, locals, reviewedNodes, extendedAliases, parameters: bindings, depth: depth + 1 });
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) return prove(node.expression);
  const direct = importedReference(node.getText(sf), imports, file, references);
  if (direct) return { evidence: direct, central: true };
  if (node.kind === ts.SyntaxKind.NullKeyword || ts.isIdentifier(node) && node.text === 'undefined' && !locals?.bound(node)) return { evidence: [], central: false };
  if (ts.isIdentifier(node) && locals) {
    const parameter = locals.parameter(node);
    if (parameter && parameters.has(parameter)) return prove(parameters.get(parameter));
    const local = locals.resolve(node) ?? (primitiveExpression({ts,node,sf,imports,file,references,locals,reviewedNodes:extendedAliases?reviewedNodes:undefined}) ? locals.resolve(node,true) : null);
    const proven = local && prove(local.node);
    if (proven) return { evidence: [local.evidence, ...proven.evidence], central: proven.central };
    const destructured=locals.destructuredValues?.(node);
    if(destructured&&(!destructured.escaped||destructured.values.every(node=>primitiveExpression({ts,node,sf,imports,file,references,locals,reviewedNodes:extendedAliases?reviewedNodes:undefined})))){const proofs=destructured.values.map(value=>prove(value));if(proofs.every(Boolean))return {evidence:[destructured.evidence,...proofs.flatMap(proof=>proof.evidence)],central:proofs.some(proof=>proof.central)};}
  }
  if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
    const aliases=importedValueCandidates({ts,node,sf,imports,file,references,locals});
    if(aliases?.length){const proofs=aliases.map(value=>importedReference(value.name,imports,file,references));if(proofs.every(Boolean))return {central:true,evidence:[...aliases.flatMap(value=>value.evidence),...proofs.flat()]};}
    if(ts.isPropertyAccessExpression(node)&&ts.isCallExpression(node.expression)&&ts.isIdentifier(node.expression.expression)){
      const selected=importedCall(node.expression.expression.text,imports,file,references,'#member:'+node.name.text);
      if(selected)return {central:true,evidence:selected};
    }
    let indexed=false;
    const importedPaths=value=>{
      if(ts.isIdentifier(value))return imports.has(value.text)?[value.text]:null;
      if(!ts.isPropertyAccessExpression(value)&&!ts.isElementAccessExpression(value))return null;
      const parents=importedPaths(value.expression);if(!parents)return null;
      if(ts.isPropertyAccessExpression(value))return parents.map(parent=>parent+'.'+value.name.text);
      if(value.argumentExpression&&(ts.isStringLiteralLike(value.argumentExpression)||ts.isNumericLiteral(value.argumentExpression)))return parents.map(parent=>parent+'.'+value.argumentExpression.text);
      indexed=true;const expanded=[];
      for(const parent of parents){const keys=importedReference(parent,imports,file,references,'#keys')?.find(item=>item.closedObjectKeys)?.closedObjectKeys;if(!keys?.length)return null;expanded.push(...keys.map(key=>parent+'.'+key));}
      return expanded;
    };
    const candidates=importedPaths(node);
    if(indexed&&candidates){const proofs=candidates.map(value=>importedReference(value,imports,file,references));if(proofs.every(Boolean))return {central:true,evidence:proofs.flat()};}
    const local = ts.isIdentifier(node.expression) && locals?.resolve(node.expression);
    // The receiver must be an immutable, unescaped imported selector result.
    // Provider member proof covers every returned color branch independently.
    if(extendedAliases&&local&&ts.isCallExpression(local.node)&&ts.isIdentifier(local.node.expression)&&locals.imported(local.node.expression)&&ts.isPropertyAccessExpression(node)&&!local.node.arguments.some(ts.isSpreadElement)){
      const selected=importedCall(local.node.expression.text,imports,file,references,'#member:'+node.name.text);
      if(selected)return {central:true,evidence:[local.evidence,...selected]};
    }
    let object = local?.node;
    while (object && (ts.isAsExpression(object) || ts.isSatisfiesExpression(object) || ts.isParenthesizedExpression(object))) object = object.expression;
    if (object && ts.isObjectLiteralExpression(object)) {
      const key = ts.isPropertyAccessExpression(node) ? node.name.text : ts.isStringLiteralLike(node.argumentExpression) || ts.isNumericLiteral(node.argumentExpression) ? node.argumentExpression.text : null;
      const members = object.properties.filter(item => ts.isPropertyAssignment(item) && !ts.isComputedPropertyName(item.name));
      if (members.length === object.properties.length) {
        const selected = key === null ? members : members.filter(item => item.name.getText(sf).replace(/^['"]|['"]$/g, '') === key);
        const proofs = selected.map(item => prove(item.initializer));
        if (proofs.length && proofs.every(Boolean)) return { evidence: [local.evidence, ...proofs.flatMap(proof => proof.evidence)], central: proofs.some(proof => proof.central) };
      }
    }
    // Follow immutable, finite lookup containers through nested member reads.
    // A dynamic index must prove every candidate branch; spreads and mutations
    // cannot be treated as a closed set of styles.
    const containers = (value, level = 0, bindings = parameters) => {
      if (!value || level > 8) return null;
      if (ts.isAsExpression(value) || ts.isSatisfiesExpression(value) || ts.isParenthesizedExpression(value)) return containers(value.expression, level + 1, bindings);
      if (ts.isIdentifier(value)) {
        const parameter=locals?.parameter(value);
        if(parameter&&bindings.has(parameter))return containers(bindings.get(parameter),level+1,bindings);
        const resolved = locals?.resolve(value);
        const candidates = resolved && containers(resolved.node, level + 1, bindings);
        if (candidates) return candidates.map(candidate => ({ ...candidate, evidence: [resolved.evidence, ...candidate.evidence] }));
        const mapped = locals?.mapElements(value), sources = mapped && containers(mapped.node, level + 1, bindings);
        if (!sources) return null;
        const elements = [];
        for (const source of sources) {
          if (!ts.isArrayLiteralExpression(source.node) || source.node.elements.some(item => ts.isSpreadElement(item) || ts.isOmittedExpression(item))) return null;
          for (const element of source.node.elements) {
            const nested = containers(element, level + 1, source.parameters??bindings);
            if (!nested) return null;
            elements.push(...nested.map(item => ({ ...item, evidence: [mapped.evidence, ...source.evidence, ...item.evidence] })));
          }
        }
        return elements.length ? elements : null;
      }
      if (ts.isConditionalExpression(value)) {
        const yes = containers(value.whenTrue, level + 1, bindings), no = containers(value.whenFalse, level + 1, bindings);
        return yes && no ? [...yes, ...no] : null;
      }
      if(ts.isCallExpression(value)&&ts.isIdentifier(value.expression)){
        const callable=locals?.callable(value.expression);if(!callable||value.arguments.length>callable.fn.parameters.length)return null;
        const nextBindings=new Map(bindings);callable.fn.parameters.forEach((parameter,index)=>nextBindings.set(parameter,value.arguments[index]??parameter.initializer));
        const results=callable.returns.map(result=>containers(result,level+1,nextBindings));
        return results.every(Boolean)?results.flat().map(result=>({...result,evidence:[callable.evidence,...result.evidence]})):null;
      }
      if (ts.isPropertyAccessExpression(value) || ts.isElementAccessExpression(value)) {
        const parents = containers(value.expression, level + 1, bindings);
        if (!parents) return null;
        const key = ts.isPropertyAccessExpression(value) ? value.name.text
          : value.argumentExpression && (ts.isStringLiteralLike(value.argumentExpression) || ts.isNumericLiteral(value.argumentExpression)) ? value.argumentExpression.text : null;
        const selected = [];
        for (const parent of parents) {
          const object = parent.node;
          if (ts.isObjectLiteralExpression(object)) {
            if (object.properties.some(item => !(ts.isPropertyAssignment(item)||ts.isShorthandPropertyAssignment(item)&&!item.objectAssignmentInitializer) || ts.isComputedPropertyName(item.name))) return null;
            const members = object.properties.filter(item => key === null || item.name.getText(sf).replace(/^['"]|['"]$/g, '') === key);
            if (!members.length) return null;
            for (const item of members) selected.push({ node: ts.isShorthandPropertyAssignment(item)?item.name:item.initializer, evidence: parent.evidence, parameters:parent.parameters });
          } else if (ts.isArrayLiteralExpression(object)) {
            if (object.elements.some(item => ts.isSpreadElement(item) || ts.isOmittedExpression(item))) return null;
            const members = key === null ? object.elements : /^\d+$/.test(key) && object.elements[Number(key)] ? [object.elements[Number(key)]] : [];
            if (!members.length) return null;
            for (const item of members) selected.push({ node: item, evidence: parent.evidence, parameters:parent.parameters });
          } else return null;
        }
        return selected;
      }
      return ts.isObjectLiteralExpression(value) || ts.isArrayLiteralExpression(value) ? [{ node: value, evidence: [],parameters:bindings }] : null;
    };
    const selected = containers(node);
    if (selected) {
      const proofs = selected.map(candidate => prove(candidate.node,property,candidate.parameters??parameters));
      if (proofs.length && proofs.every(Boolean)) return { evidence: [...selected.flatMap(candidate => candidate.evidence), ...proofs.flatMap(proof => proof.evidence)], central: proofs.some(proof => proof.central) };
    }
  }
  if (ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) {
    const value = node.text;
    const names = primaryVariables(value, variables);
    if (names) return { evidence: names.map(name => variables.get(name)), central: true };
    if (isStructural(property, value)) return { evidence: [], central: false };
    return null;
  }
  const combine = proofs => proofs.every(Boolean) ? { evidence: proofs.flatMap(proof => proof.evidence), central: proofs.some(proof => proof.central) } : null;
  if(ts.isBinaryExpression(node)&&[ts.SyntaxKind.PlusToken,ts.SyntaxKind.MinusToken,ts.SyntaxKind.AsteriskToken,ts.SyntaxKind.SlashToken].includes(node.operatorToken.kind)
    &&numericExpression({ts,node,sf,imports,file,references,locals}))return combine([prove(node.left),prove(node.right)]);
  if (ts.isCallExpression(node) && (ts.isPropertyAccessExpression(node.expression)||ts.isIdentifier(node.expression))) {
    const recipe=importedReference(node.expression.getText(sf),imports,file,references,'#recipeCall');
    const arity=recipe?.find(item=>Number.isInteger(item.recipeParameters));
    if(arity&&node.arguments.length>=arity.requiredRecipeParameters&&node.arguments.length<=arity.recipeParameters){
      const args=combine(node.arguments.map(argument=>prove(argument)));
      if(args)return {evidence:[...recipe,...args.evidence],central:true};
    }
  }
  if (ts.isConditionalExpression(node)) return combine([prove(node.whenTrue), prove(node.whenFalse)]);
  if (ts.isBinaryExpression(node) && [ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.BarBarToken].includes(node.operatorToken.kind)) return combine([prove(node.left), prove(node.right)]);
  if (ts.isTemplateExpression(node)) {
    const chunks = [node.head.text, ...node.templateSpans.map(span => span.literal.text)];
    const spanProofs=node.templateSpans.map(span=>prove(span.expression));
    const complete=node.head.text+node.templateSpans.map(span=>'__INTERPOLATION__'+span.literal.text).join('');
    const primary=primaryVariables(complete,variables);
    if(primary){
      const fallbacks=combine(node.templateSpans.map(span=>prove(span.expression)));
      if(fallbacks)return {central:true,evidence:[...primary.map(name=>variables.get(name)),...fallbacks.evidence]};
    }
    // Static zero is a spacing reset. Any nonzero length or other authored fragment remains unknown.
    const spacing = /^(?:margin|padding|gap|rowGap|columnGap)(?:Top|Right|Bottom|Left|Inline|Block)?$/.test(property)||property==='borderRadius';
    const chunksProof = chunks.map((chunk,index) => {
      // Units are only valid after a definitely numeric expression. One numeric
      // branch must never disguise a CSS-variable string in another branch.
      if(index>0&&/^(?:px|ms|s|%)(?=\s|,|\)|$)/.test(chunk)&&numericExpression({ts,node:node.templateSpans[index-1].expression,sf,imports,file,references,locals}))chunk=chunk.replace(/^(?:px|ms|s|%)/,'');
      if ((spacing ? /^[\s0]*$/ : /^\s*$/).test(chunk)) return { evidence: [], central: false };
      if (property === 'transition' && /^(?:\s|,|\b(?:all|background|background-color|color|border-color|opacity|transform|box-shadow|width|height|max-height|filter|grid-template-rows|left|right|top|bottom|stroke-dasharray|ms|s)\b)*$/.test(chunk)) return { evidence: [], central: false };
      if(spacing&&/^(?:\s|[()*+,-]|\bcalc\b|-1|0)*$/.test(chunk))return {evidence:[],central:false};
      if(/^(?:color|background|backgroundColor|border(?:Top|Bottom|Left|Right)?|borderColor|boxShadow)$/.test(property)){
        const tokens=[],rest=chunk.replace(/var\((--[\w-]+)\)/g,(value,name)=>{if(!variables.has(name))return value;tokens.push(name);return '';});
        if(/^(?:\s|[(),]|\b(?:color-mix|in|srgb|oklab|transparent)\b)*$/.test(rest))return {evidence:tokens.map(name=>variables.get(name)),central:tokens.length>0};
      }
      if (property === 'boxShadow' || /^(?:gridTemplateColumns|gridTemplateRows|width|height|minWidth|maxWidth|minHeight|maxHeight)$/.test(property)) {
        const tokens = [], rest = chunk.replace(/var\((--[\w-]+)\)/g, (value, name) => {
          if (!variables.has(name)) return value;
          tokens.push(name); return '';
        });
        const syntax=property==='boxShadow'?/^(?:\s|,|0|\binset\b)*$/:/^(?:\s|[(),+*/-]|\b(?:calc|minmax|repeat|auto|auto-fit|auto-fill)\b|100%|1fr|0)*$/;
        if (syntax.test(rest)) return { evidence: tokens.map(name => variables.get(name)), central: tokens.length > 0 };
      }
      const names = primaryVariables(chunk, variables);
      return names ? { evidence: names.map(name => variables.get(name)), central: true } : null;
    });
    return combine([...chunksProof, ...spanProofs]);
  }
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
    const selector = importedCall(node.expression.text, imports, file, references, '#selector');
    if (selector) return { evidence: selector, central: true };
    const callable = locals?.callable(node.expression);
    if (callable && node.arguments.length <= callable.fn.parameters.length) {
      const bindings = new Map(parameters);
      callable.fn.parameters.forEach((parameter, index) => bindings.set(parameter, node.arguments[index] ?? parameter.initializer));
      const proof = combine(callable.returns.map(result => prove(result, property, bindings)));
      if (proof) return { evidence: [callable.evidence, ...proof.evidence], central: proof.central };
    }
    const progressColor=locals?.imported(node.expression)&&importedCall(node.expression.text,imports,file,references,'#progressColor');
    if(progressColor){
      if(node.arguments.length!==1||ts.isSpreadElement(node.arguments[0]))return null;
      // This proves the bounded data-driven color recipe, not ownership or
      // validity of the business percentage supplied by the caller.
      return {evidence:progressColor,central:false};
    }
    const visualUnary = importedCall(node.expression.text, imports, file, references, '#visualUnary');
    if (visualUnary) {
      if (node.arguments.length !== 1) return null;
      const color = prove(node.arguments[0], 'color');
      return color ? { evidence: [...visualUnary, ...color.evidence], central: true } : null;
    }
    const callee = importedCall(node.expression.text, imports, file, references, '#language');
    if (callee) {
      const kind = callee.find(item => item.adapterFunction)?.adapterFunction;
      if (node.arguments.length === 1) return { evidence: callee, central: true };
      if ((kind === 'labelTracking'||kind==='codeOrTextFont') && node.arguments.length === 2) {
        const tracking = prove(node.arguments[1], 'letterSpacing');
        if (tracking) return { evidence: [...callee, ...tracking.evidence], central: true };
      }
      return null;
    }
  }
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.arguments.length === 2) {
    const callee = importedCall(node.expression.text, imports, file, references);
    if (!callee) return null;
    const argumentsProof = combine(node.arguments.map(argument => prove(argument)));
    return argumentsProof ? { evidence: [...callee, ...argumentsProof.evidence], central: argumentsProof.central } : null;
  }
  if (ts.isObjectLiteralExpression(node)) {
    const proofs = [];
    for (const item of node.properties) {
      if (ts.isSpreadAssignment(item)) { proofs.push(prove(item.expression)); continue; }
      if (ts.isShorthandPropertyAssignment(item) && !item.objectAssignmentInitializer) { proofs.push(prove(item.name, item.name.text)); continue; }
      if (!ts.isPropertyAssignment(item) || ts.isComputedPropertyName(item.name)) return null;
      proofs.push(prove(item.initializer, item.name.getText(sf).replace(/^['"]|['"]$/g, '')));
    }
    return combine(proofs);
  }
  return null;
}

// These are complete data-envelope bindings accidentally selected by short CSS
// names such as r/d. Descendant members and their visual uses remain separately
// inventoried. This does not approve CSS data received from an endpoint.
export function namedValueBoundary({ ts, node, sf, imports, file, references, locals }) {
  while (node && (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node))) node = node.expression;
  if (!node) return null;
  if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'Date' && !locals?.bound(node.expression)) {
    return { reason: 'This binding contains a native Date object, not an SVG path or visual scalar. Any later formatting or style use is inventoried independently.', evidence: [] };
  }
  if (!ts.isAwaitExpression(node) || !ts.isCallExpression(node.expression)) return null;
  const call = node.expression;
  if (ts.isIdentifier(call.expression) && call.expression.text === 'fetch' && !locals?.bound(call.expression)) {
    return { reason: 'This binding is the complete native HTTP Response object. Its name matching a CSS/SVG property does not make the response envelope a presentation default.', evidence: [] };
  }
  if (ts.isIdentifier(call.expression)) {
    const imported = imports.get(call.expression.text);
    if (imported?.module === '@/lib/api/fetch-json' && imported.exported === 'fetchJson') {
      const evidence = references.get('lib/api/fetch-json.ts::fetchJson#response');
      if (evidence) return { reason: 'Exact reviewed fetchJson returns an HTTP success/failure envelope. Nested data and any subsequent visual use remain separately inventoried.', evidence };
    }
  }
  return null;
}
