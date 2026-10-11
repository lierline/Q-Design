import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { renderToStaticMarkup } from 'react-dom/server';
import { FieldScreen } from '@/app/(app)/m/field-ui';
import { readSource } from '@/lib/test-utils/contract-source';

function doubledUnits(source: string): string[] {
  const file = ts.createSourceFile('probe.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const hits: string[] = [];
  function visit(node: ts.Node) {
    if (ts.isTemplateSpan(node) && /^(px|rem|em|vh|vw|%)/.test(node.literal.text)
      && /QDScale\.(?:space|font)\[|QDScale\.radius\b/.test(node.expression.getText(file))) {
      hits.push(node.getText(file));
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return hits;
}

describe('Q-Design CSS lengths keep one unit', () => {
  it('detects conditional and direct CSS-length suffixes but accepts numeric geometry', () => {
    expect(doubledUnits('const x = `${on ? QDScale.space[6] : QDScale.space[2]}px`;')).toHaveLength(1);
    expect(doubledUnits('const x = `${QDScale.font[14]}px`;')).toHaveLength(1);
    expect(doubledUnits('const x = `${on ? QDScale.space[6] : QDScale.space[2]} ${width}px`;')).toEqual([]);
  });

  it('all runtime UI templates reject units appended to CSS-length scale values', () => {
    const root = process.cwd();
    const hits: string[] = [];
    function walk(dir: string) {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const file = join(dir, entry.name);
        if (entry.isDirectory()) walk(file);
        else if (/\.tsx?$/.test(file) && !/\.(test|spec)\./.test(file)) {
          for (const hit of doubledUnits(readSource(relative(root, file), 'code'))) hits.push(`${relative(root, file)}: ${hit}`);
        }
      }
    }
    for (const dir of ['app', 'components', 'lib/design']) walk(join(root, dir));
    expect(hits).toEqual([]);
  });

  it('actual field screen retains valid spacing in both centered states', () => {
    for (const centered of [false, true]) {
      const html = renderToStaticMarkup(<FieldScreen centered={centered}>내용</FieldScreen>);
      expect(html).toContain(`padding:var(--qd-space-${centered ? 6 : 2}, ${centered ? 24 : 8}px) var(--qd-space-1, 4px) var(--qd-space-10, 40px)`);
      expect(html).not.toMatch(/\)px/);
    }
  });
});
