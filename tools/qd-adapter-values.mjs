import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { readRuntimeValues } from './atelier-runtime-values.mjs';

const uncomment = text => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const escaped = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Read the limited declarative adapter grammar without executing product code. */
export function createQdValues({ contract, css, foundationCss = '', additionalCss = [], tokens, runtime = {} }) {
  const adapter = uncomment(contract).match(/export const QD = \{([\s\S]*?)\}\s*as const/);
  if (!adapter) throw new Error('QD adapter object missing');
  const properties = new Map();
  for (const match of adapter[1].matchAll(/^\s*(\w+):\s*([^\r\n]+),\s*$/gm)) {
    if (properties.has(match[1])) throw new Error(`Duplicate QD property: ${match[1]}`);
    properties.set(match[1], match[2]);
  }
  const root = uncomment(css).match(/(?:^|\n):root\s*\{([^}]+)\}/);
  if (!root) throw new Error('Canonical :root block missing');
  const variables = new Map();
  for (const match of root[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    if (variables.has(match[1])) throw new Error(`Duplicate canonical variable: ${match[1]}`);
    variables.set(match[1], match[2].trim());
  }
  const foundationRoot = uncomment(foundationCss).match(/(?:^|\n):root\s*\{([^}]+)\}/);
  if (foundationCss && !foundationRoot) throw new Error('Canonical foundation :root block missing');
  const foundationNames = new Set();
  for (const match of (foundationRoot?.[1] ?? '').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    if (foundationNames.has(match[1])) throw new Error(`Duplicate foundation variable: ${match[1]}`);
    foundationNames.add(match[1]);
    variables.set(match[1], match[2].trim());
  }
  for (const extra of additionalCss) {
    const roots = [...uncomment(extra).matchAll(/(?:^|\n):root\s*\{([^}]+)\}/g)];
    if (!roots.length) throw new Error('Additional canonical :root block missing');
    for (const root of roots) for (const match of root[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      if (variables.has(match[1])) throw new Error(`Duplicate additional canonical variable: ${match[1]}`);
      variables.set(match[1], match[2].trim());
    }
  }

  function scalar(expression) {
    const expr = expression.trim();
    if (/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(expr)) return Number(expr);
    let match = expr.match(/^(FS|S)\[([\d.]+)\]$/);
    if (match) {
      const value = match[1] === 'FS' ? Number(match[2]) : tokens.space.scale[match[2]];
      if (typeof value !== 'number') throw new Error(`Unknown token: ${expr}`);
      return value;
    }
    match = expr.match(/^(RADIUS|Z|TOUCH)\.(\w+)$/);
    if (match) {
      const group = { RADIUS: tokens.radius, Z: runtime.Z ?? tokens.z, TOUCH: tokens.space.touch }[match[1]];
      const value = group?.[match[2]];
      if (typeof value !== 'number') throw new Error(`Unknown token: ${expr}`);
      return value;
    }
    throw new Error(`Unsupported scalar expression: ${expr}`);
  }

  function value(expression, visited = []) {
    const expr = expression.trim();
    const legacyScale = expr.match(/^(FS|S)\[([\d.]+)\]$/);
    if (legacyScale) return value(`QDScale.${legacyScale[1] === 'FS' ? 'font' : 'space'}[${legacyScale[2]}]`, visited);
    let scale = expr.match(/^QDScale\.(font|space)\[([\d.]+)\]$/);
    if (scale) {
      const fallback = scale[1] === 'font' ? Number(scale[2]) : tokens.space.scale[scale[2]];
      if (typeof fallback !== 'number') throw new Error(`Unknown UI scale: ${expr}`);
      return `var(--qd-${scale[1] === 'font' ? 'font-size' : 'space'}-${scale[2].replaceAll('.', '-')}, ${fallback}px)`;
    }
    scale = expr.match(/^QDScale\.leading\.(\w+)$/);
    if (scale) {
      const fallback = tokens.typography.lineHeight[scale[1]];
      if (typeof fallback !== 'number') throw new Error(`Unknown UI leading: ${expr}`);
      return `var(--qd-leading-${scale[1]}, ${fallback})`;
    }
    scale = expr.match(/^QDScale\.family\.(ui|serif|mono|display)$/);
    if (scale) return `var(--qd-font-family-${scale[1] === 'serif' ? 'ui' : scale[1]}, ${tokens.typography.fontFamily[scale[1]]})`;
    if (expr === 'QDScale.radius') return value('QD.radius', visited);
    const reference = expr.match(/^QD\.(\w+)$/);
    if (reference) {
      if (visited.includes(reference[1])) throw new Error(`Cyclic QD adapter: ${expr}`);
      const next = properties.get(reference[1]);
      if (next === undefined) throw new Error(`Unknown QD adapter: ${expr}`);
      return value(next, [...visited, reference[1]]);
    }
    if (/^(['"`])[\s\S]*\1$/.test(expr)) {
      return expr.slice(1, -1).replace(/\$\{([^}]+)\}/g, (_, embedded) => {
        return /^(?:QD\.|QDScale\.)/.test(embedded.trim()) ? value(embedded, visited) : scalar(embedded);
      });
    }
    return `${scalar(expr)}px`;
  }

  function resolved(text, trail = []) {
    // Innermost vars first. This supports nested fallbacks and aliases, but not CSS arithmetic.
    const variable = /var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g;
    let output = text;
    for (let step = 0; /var\(/.test(output); step++) {
      if (step > 40) throw new Error(`Unresolved CSS variable: ${output}`);
      let replaced = false;
      output = output.replace(variable, (whole, name, fallback) => {
        replaced = true;
        if (trail.includes(name)) throw new Error(`Cyclic canonical variable: ${name}`);
        const definition = variables.get(name);
        if (definition !== undefined) return resolved(definition, [...trail, name]);
        if (name.startsWith('--qd-') || fallback === undefined) throw new Error(`Unknown canonical variable: ${name}`);
        return fallback.trim();
      });
      if (!replaced) throw new Error(`Unsupported CSS variable expression: ${output}`);
    }
    return output.replace(/calc\(\s*(-?[\d.]+)(px)?\s*([*/])\s*(-?[\d.]+)(px)?\s*\)/g, (whole, a, ua, op, b, ub) => {
      if (ua && ub || op === '/' && (ub || Number(b) === 0)) throw new Error(`Unsupported canonical calculation: ${whole}`);
      return `${op === '*' ? Number(a) * Number(b) : Number(a) / Number(b)}${ua || ub || ''}`;
    });
  }

  function pixels(expression) {
    const result = resolved(value(expression));
    if (!/^-?(?:\d+(?:\.\d+)?|\.\d+)px$/.test(result)) throw new Error(`Expected one pixel dimension: ${expression} -> ${result}`);
    return Number(result.slice(0, -2));
  }

  function property(zone, name) {
    const atom = '(?:QDScale\\.(?:(?:font|space)\\[[\\d.]+\\]|(?:leading|family)\\.\\w+|radius)|QD\\.\\w+|(?:FS|S)\\[[\\d.]+\\]|(?:RADIUS|Z|TOUCH)\\.\\w+|\'[^\'\\r\\n]*\'|"[^"\\r\\n]*"|`[^`\\r\\n]*`|-?[\\d.]+)';
    const re = new RegExp('\\b' + escaped(name) + '\\s*:\\s*(' + atom + ')(?=\\s*[,}])', 'g');
    const matches = [...uncomment(zone).matchAll(re)];
    if (matches.length !== 1) throw new Error(`Expected one ${name} property, found ${matches.length}`);
    return matches[0][1];
  }

  return {
    css: value, pixels, property, resolve: expression => resolved(value(expression)),
    font: key => pixels(`QDScale.font[${key}]`),
    space: key => pixels(`QDScale.space[${key}]`),
    step: key => pixels(`QDScale.space[${key}]`) / 4,
    leading: key => Number(resolved(value(`QDScale.leading.${key}`))),
  };
}

/** Preserve existing region markers, but dimensions are resolved through canonical probes. */
export function normalizeScaleSyntax(text) {
  return text
    .replace(/\$\{QDScale\.(font|space)\[([\d.]+)\]\}/g, (_, group, key) => '${' + (group === 'font' ? 'FS' : 'S') + `[${key}]}px`)
    .replace(/QDScale\.font\[/g, 'FS[').replace(/QDScale\.space\[/g, 'S[')
    .replace(/QDScale\.family\./g, 'F.').replace(/QDScale\.leading\./g, 'LH.')
    .replace(/QDScale\.radius\b/g, 'QD.radius');
}

export function loadQdValues(root) {
  const read = path => readFileSync(join(root, path), 'utf8').replace(/\r\n/g, '\n');
  // Product recipe roots contain viewport-aware canonical defaults as well as
  // legacy --qa aliases. Only the --qd declarations belong to this resolver.
  const recipe = existsSync(join(root,'patterns/foundation/atelier.css')) ? uncomment(read('patterns/foundation/atelier.css')) : '';
  const recipeRoots = [...recipe.matchAll(/(?:^|\n):root\s*\{([^}]+)\}/g)].flatMap(match => [...match[1].matchAll(/(--qd-[\w-]+)\s*:\s*([^;]+);/g)].map(decl => `${decl[1]}: ${decl[2]};`));
  return createQdValues({
    contract: read('source/tokens/q-design-contract.ts'),
    css: read('patterns/components.css'),
    foundationCss: existsSync(join(root, 'patterns/foundation.css')) ? read('patterns/foundation.css') : '',
    additionalCss: [...['patterns/foundation/atelier-values.css', 'patterns/foundation/atelier-core-values.css'].filter(file => existsSync(join(root, file))).map(read),...(recipeRoots.length?[`:root { ${recipeRoots.join('\n')} }`]:[])],
    tokens: JSON.parse(read('dist/q-design.tokens.json')),
    runtime: existsSync(join(root, 'source/design/atelier-runtime.ts')) ? readRuntimeValues(root) : {},
  });
}

/** Preserve source grammar for probes while reading the current canonical literal value. */
export function normalizeStyleLiterals(text, root) {
  if (!/var\(--qd-/.test(text)) return text;
  const formats = new Map();
  // Semantic recipe tokens do not have a historical literal-migration record.
  // Register their grammar explicitly; never infer a JS type from an arbitrary
  // canonical declaration or copy a layer value into the extractor.
  const semanticFormats = new Map([
    ['--qd-atelier-mobile-header-layer', ['zIndex', 'integer']],
    ['--qd-atelier-mobile-control-layer', ['zIndex', 'integer']],
    ['--qd-atelier-section-leading', ['lineHeight', 'unitless']],
    ['--qd-atelier-line-clamp-single', ['WebkitLineClamp', 'integer']],
    ['--qd-atelier-line-clamp-double', ['WebkitLineClamp', 'integer']],
    ['--qd-atelier-hub-link-underline-offset', ['textUnderlineOffset', 'number']],
  ]);
  const tokenFormats = new Map([...semanticFormats].map(([name, [, format]]) => [name, format]));
  for (const file of ['atelier-literal-values.json', 'atelier-core-values.json', 'atelier-grid-values.json', 'atelier-conditional-values.json', 'atelier-function-values.json', 'atelier-style-fragments.json']) {
    const path = join(root, 'source/style-adapters', file);
    if (!existsSync(path)) continue;
    for (const entry of JSON.parse(readFileSync(path, 'utf8')).files) {
      for (const item of entry.conversions) {
        const items = item.values ?? [item];
        for (const value of items) {
          if (!value.token) throw new Error(`Missing canonical token in ${file}`);
          const source = value.old ?? value.value;
          if (typeof source !== 'string') throw new Error(`Missing canonical value format in ${file}: ${value.token}`);
          const format = /^-?[\d.]+$/.test(source.trim()) ? 'number' : 'string';
          // Earlier ledgers preserve original JS number/string distinctions. Later ledgers
          // record CSS fragments, so they must not override that stronger information.
          const key = `${item.property}:${value.token}`;
          if (!formats.has(key)) formats.set(key, format);
          if (!tokenFormats.has(value.token)) tokenFormats.set(value.token, format);
        }
      }
    }
  }
  let values;
  const normalized = text.replace(/(\b([A-Za-z][\w]*)\s*:\s*)(['"])(var\((--qd-[\w-]+)\))\3/g, (whole, prefix, property, _quote, variable, name) => {
    if (semanticFormats.has(name) && property !== semanticFormats.get(name)[0]) throw new Error(`Invalid semantic style argument: ${property} ${name}`);
    const format = formats.get(`${property}:${name}`) ?? tokenFormats.get(name);
    if (!format) {
      if (name.startsWith('--qd-atelier-')) throw new Error(`Unregistered canonical style argument: ${property} ${name}`);
      return whole;
    }
    values ??= loadQdValues(root);
    const resolved = values.resolve(`'${variable}'`);
    if (format === 'integer') {
      if (!/^-?\d+$/.test(resolved)) throw new Error(`Expected integer style argument: ${property} ${resolved}`);
      return prefix + resolved;
    }
    if (format === 'unitless') {
      if (!/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(resolved)) throw new Error(`Expected unitless style argument: ${property} ${resolved}`);
      return prefix + resolved;
    }
    if (format === 'number') {
      // Safe-area coordinates are browser measurements, not scalar defaults.
      // Keep their live central expression instead of inventing a zero inset.
      if (/env\(safe-area-inset-(?:top|right|bottom|left),\s*0px\)/.test(resolved)) return prefix + `'${variable}'`;
      if (!/^-?[\d.]+(?:px)?$/.test(resolved)) throw new Error(`Expected numeric style argument: ${property} ${resolved}`);
      return prefix + resolved.replace(/px$/, '');
    }
    return prefix + `'${resolved.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
  });
  const scalars = normalized.replace(/(['"])(var\((--qd-[\w-]+)\))\1/g, (whole, _quote, variable, name) => {
    const format = tokenFormats.get(name);
    if (!format) return whole;
    values ??= loadQdValues(root);
    const result = values.resolve(`'${variable}'`);
    if (format === 'integer') {
      if (!/^-?\d+$/.test(result)) throw new Error(`Expected integer style argument: ${name} ${result}`);
      return result;
    }
    if (format === 'unitless') {
      if (!/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(result)) throw new Error(`Expected unitless style argument: ${name} ${result}`);
      return result;
    }
    if (format === 'number') {
      if (/env\(safe-area-inset-(?:top|right|bottom|left),\s*0px\)/.test(result)) return whole;
      if (!/^-?[\d.]+(?:px)?$/.test(result)) throw new Error(`Expected numeric style argument: ${name} ${result}`);
      return result.replace(/px$/, '');
    }
    return `'${result.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
  });
  // Border templates retain dynamic colors, but their static width/style fragments
  // now belong to the central recipe. Resolve only explicitly registered fragments.
  return scalars.replace(/var\((--qd-(?:border-width(?:-2)?|atelier-border-style-[\w-]+))\)/g, (whole, name) => {
    if (!tokenFormats.has(name)) throw new Error(`Unregistered canonical border fragment: ${name}`);
    values ??= loadQdValues(root);
    return values.resolve(`'${whole}'`);
  });
}
