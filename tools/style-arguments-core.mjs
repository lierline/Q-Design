import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
export const hash = text => createHash('sha256').update(text.replaceAll('\r\n', '\n')).digest('hex');
export const jsxStyleAttributes = new Set(['style', 'itemStyle']);
const portable = path => path.replaceAll('\\', '/');
const ignored = new Set(['node_modules', '.next', '.git', 'tests', 'test', '__tests__', '__fixtures__']);
const svg = new Set('fill fillOpacity fillRule stroke strokeWidth strokeOpacity strokeDasharray strokeDashoffset strokeLinecap strokeLinejoin opacity viewBox d points x y x1 x2 y1 y2 cx cy r rx ry width height transform preserveAspectRatio stopColor stopOpacity offset filter mask clipPath fontSize fontFamily fontWeight fontStyle letterSpacing wordSpacing textAnchor dominantBaseline alignmentBaseline vectorEffect paintOrder colorInterpolation colorInterpolationFilters shapeRendering textRendering'.split(' '));
// SVG strings can contain authored motion/filter geometry without CSS at all.
// Keep these as candidates, including SMIL timing and effect parameters.
const svgOnly = new Set('dx dy pathLength gradientTransform gradientUnits spreadMethod filterUnits primitiveUnits stdDeviation baseFrequency numOctaves seed scale kernelMatrix kernelUnitLength order targetX targetY edgeMode preserveAlpha radius operator k1 k2 k3 k4 floodColor floodOpacity lightingColor surfaceScale diffuseConstant specularConstant specularExponent limitingConeAngle azimuth elevation amplitude exponent intercept slope tableValues markerWidth markerHeight markerUnits refX refY orient patternUnits patternContentUnits patternTransform textLength lengthAdjust startOffset rotate dur begin end min max repeatCount repeatDur keyTimes keySplines keyPoints calcMode values from to by additive accumulate attributeName attributeType'.split(' '));
// Some SVG attribute names (min, max, values, from) are also ordinary business
// data props. Only intrinsic SVG elements give those names visual meaning.
const svgTags = new Set('svg g defs symbol use path rect circle ellipse line polyline polygon text tspan textPath image foreignObject switch desc title metadata marker pattern mask clipPath linearGradient radialGradient stop filter feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feDropShadow feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence animate animateMotion animateTransform mpath set'.split(' '));
const svgMarkupTags = new Set([...svgTags].map(name => name.toLowerCase()));
const structural = /^(?:display|position|boxSizing|overflow[XY]?|flexDirection|flexWrap|alignItems|justifyContent|objectFit|pointerEvents|visibility|userSelect|whiteSpace|textOverflow|appearance|cursor|isolation|contain)$/;
// Component adapters commonly express visual values in a required unit.
// Capture candidates, including compound names, without treating them as CSS
// compliance. Bytes, record counts and other units are not presentation units.
const colorParameters = new Set(['accent', 'badgeColor', 'trackColor', 'connectorColor', 'chipColor', 'iconColor', 'dotColor']);
export const presentationParameter = name => /^(?:size|w|h|radius|minCol|cols)$/.test(name) || colorParameters.has(name) || /(?:width|height|size|radius|diameter|gap|padding|margin|inset|strokeWidth|fontSize|lineHeight|letterSpacing|blur|offset)(?:Px|Pt|Mm|Cm|In|Rem|Em|Vw|Vh|Dvh|Svh|Lvh|Percent)$/i.test(name) || /(?:duration|delay)(?:Ms|Sec)$/i.test(name);
export function parameterFamily(property) {
  if (/^--/.test(property)) return 'token-definition';
  if (/color|fill|stroke$|background|shadow|outline|border.*(?:color|style)/i.test(property)) return 'surface-color-effect';
  if (/font|text|letter|line.?height|word|white.?space/i.test(property)) return 'typography';
  if (/animation|transition|easing|duration|transform|rotate|scale/i.test(property)) return 'motion-transform';
  if (/z.?index|position|inset|top|right|bottom|left/i.test(property)) return 'position-layer';
  if (/padding|margin|gap|space/i.test(property)) return 'spacing';
  if (/width|height|size|radius|aspect|grid|flex/i.test(property)) return 'geometry';
  return 'behavior-structure';
}
export function runtimeFiles(root) {
  const files = [];
  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory() && !ignored.has(entry.name)) walk(path);
      else if (entry.isFile() && /\.(?:[cm]?[jt]sx?|css|html|svg)$/.test(entry.name) && !/\.(?:test|spec|stories|d)\.[cm]?[jt]sx?$/.test(entry.name)) files.push(portable(relative(root, path)));
    }
  }
  for (const dir of ['app', 'components', 'lib', 'src', 'public']) walk(join(root, dir));
  for (const file of ['tailwind.config.ts', 'tailwind.config.js', 'next.config.ts', 'next.config.mjs']) if (existsSync(join(root, file))) files.push(file);
  return files.sort();
}

export function cssProperties(ts, libDom) {
  const source = ts.createSourceFile('lib.dom.d.ts', libDom, ts.ScriptTarget.Latest, true);
  const props = new Set();
  for (const statement of source.statements) if (ts.isInterfaceDeclaration(statement) && statement.name.text === 'CSSStyleDeclaration') {
    for (const member of statement.members) if (ts.isPropertySignature(member)) props.add(member.name.getText(source));
  }
  if (props.size < 200) throw new Error('CSS property vocabulary could not be loaded');
  // React uses an uppercase vendor prefix where CSSStyleDeclaration uses webkit.
  for (const property of [...props]) if (/^(?:webkit|moz|o)[A-Z]/.test(property)) props.add(property[0].toUpperCase() + property.slice(1));
  return props;
}

// Records are evidence, never a compliance certificate. Unknown expressions and
// parser failures stay visible. No literal is silently approved by generation.
export function scanArguments(path, code, { ts, postcss, properties, owner = null }) {
  const records = [];
  const seen = new Set();
  const at = (offset, index = 0) => typeof offset === 'function' ? offset(index) : offset + index;
  function add(kind, property, value, offset, context = '') {
    const signature = `${offset}:${kind}:${property}:${value}`;
    if (seen.has(signature)) return; seen.add(signature);
    let status = owner ? 'central-source' : 'review-required';
    if (!owner && /var\(\s*--(?:qd|qa|dhr|qw|color)-|\bQD(?:Scale)?\.|\bT\./.test(value)) status = 'token-reference';
    else if (!owner && structural.test(property) && /^['"]?[\w -]+['"]?$/.test(value)) status = 'structural-literal';
    if (kind === 'svg-geometry' || kind === 'asset') status = 'asset-or-data-boundary';
    if (kind === 'parse-error' || kind === 'dynamic-style' || kind === 'class-expression') status = 'review-required';
    records.push({ line: code.slice(0, offset).split('\n').length, kind, property, value, family: parameterFamily(property), status, ...(context ? { context } : {}), ...(owner ? { owner } : {}) });
  }
  function css(text, offset, context) {
    try {
      const root = postcss.parse(text, { from: path });
      root.walkDecls(decl => add('css-declaration', decl.prop, decl.value, at(offset, decl.source?.start?.offset ?? 0), `${context} ${decl.parent.selector ?? decl.parent.name ?? ''}`.trim()));
      root.walkAtRules(rule => add('css-at-rule', `@${rule.name}`, rule.params, at(offset, rule.source?.start?.offset ?? 0), context));
    } catch (error) { add('parse-error', 'css', error.reason ?? error.message, at(offset), context); }
  }
  function classes(value, offset, context) {
    // A token in one utility never approves its neighboring literals.
    for (const match of value.matchAll(/\S+/g)) add('class-utility', 'className', match[0], at(offset, match.index), context);
  }
  function markup(text, offset, context) {
    // Inspect CSS islands, never parse the HTML/SVG document as a stylesheet.
    // Raw-text script/style bodies are excluded from the attribute scanner.
    const raw = [];
    for (const match of text.matchAll(/<(style|script)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi)) {
      const start = match.index + match[0].indexOf('>') + 1;
      raw.push([start, start + match[2].length]);
      if (match[1].toLowerCase() === 'style') css(match[2], index => at(offset, start + index), `${context}-style`);
      else add('dynamic-style', 'embedded-script', match[2], at(offset, start), `${context} script requires runtime review`);
    }
    const tags = /<!--[\s\S]*?-->|<[a-z][\w:-]*\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
    for (const tag of text.matchAll(tags)) {
      if (tag[0].startsWith('<!--') || raw.some(([start, end]) => tag.index >= start && tag.index < end)) continue;
      const svgElement = svgMarkupTags.has(/^<([\w:-]+)/.exec(tag[0])?.[1].toLowerCase());
      for (const match of tag[0].matchAll(/\b([\w-]+)\s*=\s*(["'])([\s\S]*?)\2/g)) {
        const name = match[1].replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        if (!['style', 'class'].includes(name) && !svg.has(name) && !(svgElement && svgOnly.has(name)) && !properties.has(name)) continue;
        const valueIndex = tag.index + match.index + match[0].indexOf(match[2]) + 1;
        if (name === 'style') css(`x{${match[3]}}`, index => at(offset, valueIndex + index - 2), `${context}-inline`);
        else if (name === 'class') classes(match[3], index => at(offset, valueIndex + index), context);
        else add(path.endsWith('.svg') || /<svg\b/i.test(text) ? 'asset' : 'html-attribute', match[1], match[3], at(offset, tag.index + match.index), context);
      }
    }
  }
  if (path.endsWith('.css')) css(code, 0, 'stylesheet');
  else if (/\.(?:html|svg)$/.test(path)) markup(code, 0, 'standalone');
  else {
    const sf = ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true, /\.[jt]sx$/.test(path) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    for (const error of sf.parseDiagnostics) add('parse-error', 'typescript', ts.flattenDiagnosticMessageText(error.messageText, ' '), error.start ?? 0);
    const literal = node => ts.isStringLiteralLike(node) || ts.isNumericLiteral(node) || node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword;
    const text = node => node.getText(sf);
    function literalPositions(node) {
      // TypeScript exposes cooked text. Map every cooked UTF-16 unit back to its
      // source position so escaped newlines and long ${expressions} cannot move
      // later declarations onto the wrong source line in the evidence ledger.
      const start = node.getStart(sf) + 1;
      const closing = node.kind === ts.SyntaxKind.TemplateHead || node.kind === ts.SyntaxKind.TemplateMiddle ? 2 : 1;
      const raw = text(node).slice(1, -closing), positions = [];
      for (let i = 0; i < raw.length;) {
        const from = i;
        let units = 1;
        if (raw[i] === '\\') {
          i++;
          if (raw[i] === '\r' || raw[i] === '\n') { if (raw[i++] === '\r' && raw[i] === '\n') i++; units = 0; }
          else if (raw[i] === 'u' && raw[i + 1] === '{') {
            const end = raw.indexOf('}', i + 2);
            if (end >= 0) { units = Number.parseInt(raw.slice(i + 2, end), 16) > 0xffff ? 2 : 1; i = end + 1; }
            else i++;
          }
          else if (raw[i] === 'u' && /^[\da-f]{4}$/i.test(raw.slice(i + 1, i + 5))) i += 5;
          else if (raw[i] === 'x' && /^[\da-f]{2}$/i.test(raw.slice(i + 1, i + 3))) i += 3;
          else if (/[0-7]/.test(raw[i] ?? '')) { const octal = /^[0-3][0-7]{0,2}|^[4-7][0-7]?/.exec(raw.slice(i)); i += octal?.[0].length ?? 1; }
          else i++;
        } else { i++; if (raw[from] === '\r' && raw[i] === '\n') i++; }
        for (let unit = 0; unit < units; unit++) positions.push(start + from);
      }
      positions.push(start + raw.length);
      return positions;
    }
    function visit(node) {
      if (ts.isJsxAttribute(node)) {
        const name = text(node.name), value = node.initializer ? text(node.initializer) : 'true';
        if (jsxStyleAttributes.has(name)) add('style-expression', name, value, node.getStart(sf));
        else if (name === 'className') {
          if (ts.isStringLiteral(node.initializer ?? node)) classes(node.initializer.text, node.initializer.getStart(sf) + 1, 'JSX className');
          else {
            add('class-expression', name, value, node.getStart(sf));
            const visitClass = part => {
              if (ts.isStringLiteralLike(part)) classes(part.text, part.getStart(sf) + 1, 'JSX class expression literal');
              else if (ts.isTemplateExpression(part)) {
                classes(part.head.text, part.head.getStart(sf) + 1, 'JSX class template fragment');
                for (const span of part.templateSpans) classes(span.literal.text, span.literal.getStart(sf) + 1, 'JSX class template fragment');
              }
              ts.forEachChild(part, visitClass);
            };
            if (node.initializer) visitClass(node.initializer);
          }
        }
        else if (svg.has(name) || (svgTags.has(text(node.parent.parent.tagName)) && svgOnly.has(name)) || properties.has(name) || presentationParameter(name)) add(/^(?:d|points|viewBox|x|y|x1|x2|y1|y2|cx|cy|r|rx|ry|preserveAspectRatio)$/.test(name) ? 'svg-geometry' : 'presentation-attribute', name, value, node.getStart(sf));
      }
      if (ts.isPropertyAssignment(node)) {
        const name = text(node.name).replace(/^['"]|['"]$/g, '');
        if (properties.has(name) || presentationParameter(name) || name.startsWith('--') || /^(?:fillStyle|strokeStyle|lineWidth|globalAlpha|shadowBlur)$/.test(name)) {
          add('object-property', name, text(node.initializer), node.getStart(sf), 'candidate: includes style maps and data objects; inspect context');
        }
      }
      if ((ts.isBindingElement(node) || ts.isParameter(node) || ts.isVariableDeclaration(node)) && node.initializer && ts.isIdentifier(node.name)) {
        const name = node.name.text;
        if (properties.has(name) || presentationParameter(name) || /^(?:size|radius|gap|cols|minCol|duration|delay|strokeWidth|knob)$/.test(name)) {
          add('named-style-value', name, text(node.initializer), node.getStart(sf), 'candidate default or local binding; follow its consumers before classifying');
        }
      }
      if (ts.isSpreadAssignment(node)) add('object-spread', '...', text(node.expression), node.getStart(sf), 'unresolved object composition');
      // Color builders can return paint without a CSS-named local binding or
      // property. Keep those return values as candidates too. This recognizes
      // explicit CSS color syntax, not function names or arbitrary strings.
      if ((ts.isReturnStatement(node) && node.expression) || (ts.isArrowFunction(node) && !ts.isBlock(node.body))) {
        const value = ts.isReturnStatement(node) ? node.expression : node.body;
        const prefix = ts.isTemplateExpression(value) ? value.head.text : ts.isStringLiteralLike(value) ? value.text : '';
        if (/^\s*(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\s*\(/i.test(prefix)) {
          add('paint-return', 'color', text(value), value.getStart(sf), 'explicit CSS color builder result; trace actual callers and every parameter');
        }
      }
      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && /(?:\.style\.|\.style\[|\.(?:fillStyle|strokeStyle|lineWidth|globalAlpha|shadowBlur)$)/.test(text(node.left))) add('dynamic-style', text(node.left), text(node.right), node.getStart(sf));
      if (ts.isCallExpression(node) && /(?:\.setProperty|\.setAttribute|\b(?:cva|clsx|cn|twMerge))$/.test(text(node.expression))) add('style-call', text(node.expression), node.arguments.map(text).join(', '), node.getStart(sf));
      if (ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node) || ts.isStringLiteral(node)) {
        // A comment keeps interpolation boundaries syntactically neutral both in
        // declaration values and between complete CSS rules. Its expression is
        // retained below as unresolved evidence, including centrally owned files.
        let content = '', positions = [];
        const appendLiteral = part => { content += part.text; positions.push(...literalPositions(part).slice(0, part.text.length)); };
        if (ts.isTemplateExpression(node)) {
          appendLiteral(node.head);
          for (const span of node.templateSpans) {
            const placeholder = '/*QD_DYNAMIC*/';
            content += placeholder;
            positions.push(...Array(placeholder.length).fill(span.expression.getStart(sf)));
            appendLiteral(span.literal);
          }
        } else appendLiteral(node);
        const offset = index => positions[Math.max(0, Math.min(index, positions.length - 1))] ?? node.getStart(sf) + 1;
        const isMarkup = /<\/?[a-z][\w:-]*(?:\s|\/?>)|<!doctype\b/i.test(content);
        let binding = node.parent;
        while ((ts.isBinaryExpression(binding) && binding.operatorToken.kind === ts.SyntaxKind.PlusToken) || ts.isParenthesizedExpression(binding)) binding = binding.parent;
        const name = ts.isVariableDeclaration(binding) && ts.isIdentifier(binding.name) ? binding.name.text : '';
        const isScript = !isMarkup && (/(?:script|boot)$/i.test(name) || /^\s*;?\s*\(?\s*(?:function(?:\s+[\w$]+)?\s*\(|\([^)]*\)\s*=>|(?:const|let|var)\s|try\s*\{)/.test(content));
        const isCss = !isMarkup && !isScript && /[{}]/.test(content) && /(?:[\w-]+\s*:\s*[^;{}]+;|@(?:media|keyframes|supports))/.test(content);
        if (isMarkup) markup(content, offset, 'embedded-html');
        else if (isScript) add('dynamic-style', 'embedded-script', content, at(offset), 'script string requires runtime review');
        else if (isCss) css(content, offset, 'embedded-css');
        if ((isMarkup || isScript || isCss) && ts.isTemplateExpression(node)) for (const span of node.templateSpans) add('dynamic-style', 'embedded-interpolation', text(span.expression), span.expression.getStart(sf));
      }
      ts.forEachChild(node, visit);
    }
    visit(sf);
  }
  return records.sort((a, b) => a.line - b.line || a.kind.localeCompare(b.kind) || a.property.localeCompare(b.property));
}
