import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const ts = createRequire(fileURLToPath(new URL('../../Q-Atelier/package.json', import.meta.url)))('typescript');

// A slot describes where one exact expression is consumed. It says nothing about
// whether arbitrary HTML data is safe, or whether child CSS has been reviewed.
export function htmlInterpolationSlots(source, path = 'fixture.ts') {
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const slots = [];
  function context(span) {
    const template = span.parent;
    let before = template.head.text;
    for (const sibling of template.templateSpans) {
      if (sibling === span) break;
      before += '__DYNAMIC_VALUE__' + sibling.literal.text;
    }
    const tagStart = before.lastIndexOf('<');
    const tagEnd = before.lastIndexOf('>');
    const openTag = tagStart > tagEnd ? before.slice(tagStart) : '';
    const attribute = openTag.match(/\b([\w-]+)\s*=\s*(["'])(?:(?!\2)[\s\S])*$/);
    let slot;
    if (attribute) slot = attribute[1] === 'style' ? 'style-attribute' : `${attribute[1]}-attribute`;
    else if (openTag) slot = 'unknown-tag-position';
    else if (before.lastIndexOf('<style') > before.lastIndexOf('</style>')) slot = 'style-block';
    else if (before.includes('>')) slot = 'text-or-markup';
    else {
      let ancestor = template.parent;
      while (ancestor && !ts.isTemplateSpan(ancestor)) ancestor = ancestor.parent;
      slot = ancestor ? context(ancestor).slot : 'unproven-fragment';
    }
    return { slot, before: before.slice(-220), after: span.literal.text.slice(0, 220) };
  }
  function visit(node) {
    if (ts.isTemplateSpan(node)) {
      let owner = node.parent;
      while (owner && !ts.isFunctionDeclaration(owner)) owner = owner.parent;
      slots.push({
        line: file.getLineAndCharacterOfPosition(node.expression.getStart(file)).line + 1,
        value: node.expression.getText(file),
        start: node.expression.getStart(file),
        owner: owner?.name?.text ?? null,
        ownerLine: owner ? file.getLineAndCharacterOfPosition(owner.getStart(file)).line + 1 : null,
        ...context(node),
      });
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return slots;
}
