import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { readSource } from '@/lib/test-utils/contract-source';

vi.mock('@/lib/design/q-design-runtime', async importOriginal => {
  const original = await importOriginal<typeof import('@/lib/design/q-design-runtime')>();
  const { readSource: readRuntimeSource } = await import('@/lib/test-utils/contract-source');
  const { default: compiler } = await import('typescript');
  const { runInNewContext } = await import('node:vm');
  const source = readRuntimeSource('lib/design/q-design-runtime.ts', 'raw'); // Re-evaluate the real module so helper closures use the changed canonical breakpoints.
  const changed = source.replace('"md": 768', '"md": 800').replace('"lg": 1024', '"lg": 1100');
  if (changed === source) throw new Error('Canonical breakpoint declarations were not found');
  const compiled = compiler.transpileModule(changed, { compilerOptions: { module: compiler.ModuleKind.CommonJS } }).outputText;
  const runtimeExports: Record<string, unknown> = {};
  const responsive = await import('@/lib/design/q-design-responsive');
  runInNewContext(compiled, { exports: runtimeExports, require: (id: string) => {
    if (id === '@/lib/design/q-design-responsive') return responsive;
    throw new Error('Unexpected runtime dependency: ' + id);
  } });
  return {
    ...original,
    gridRulesFor: runtimeExports.gridRulesFor as typeof original.gridRulesFor,
    BP: { ...original.BP, md: 800, lg: 1100 },
    QDRuntime: {
      ...original.QDRuntime,
      switch: { ...original.QDRuntime.switch, md: { w: 64, h: 32, knob: 24 }, inset: 4 },
      grid: { minColumn: 300, foldMinColumn: 200, roundingAllowance: 2 },
      ribbon: { durationSeconds: 2.25 },
      grain: { tint: 0.63 },
      alpha: { ...original.QDRuntime.alpha, tint0_1: 0.27 },
      avatar: { size: 40, minFontSize: 14, fontScale: 0.5 },
      popover: { ...original.QDRuntime.popover, width: 410 },
    },
  };
});

import { Grid, Switch, Tag, foldGrid, infoPopoverStyle } from './components';
import { ruleBand, tintBorder } from './grain';
import { resolvedStyleValue } from '@/lib/test-utils/design-source';
import { EntranceRibbon } from '@/components/EntranceRibbon';
import { Avatar } from '@/components/Avatar';

describe('central numeric presentation settings reach real renderers', () => {
  it('rule-band width and style remain central while the status tint is preserved', () => {
    const rules = ruleBand('#123456');
    expect(rules.borderTop).toBe('var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) #123456a1');
    expect(rules.borderBottom).toBe(rules.borderTop);
    const changed = ':root { --qd-border-width: 2px; --qd-atelier-border-style-5ed175bd8d: dashed; }';
    expect(resolvedStyleValue(rules.borderTop, changed)).toBe('2px dashed #123456a1');
  });
  it('changes avatar sizing and popover defaults while explicit dimensions still win', () => {
    expect(renderToStaticMarkup(<Avatar name="검토" />)).toContain('width:40px;height:40px;font-size:20px');
    expect(renderToStaticMarkup(<Avatar name="검토" size={20} />)).toContain('width:20px;height:20px;font-size:14px');
    expect(infoPopoverStyle().width).toBe(410);
    expect(infoPopoverStyle({ width: 280 }).width).toBe(280);
    expect(infoPopoverStyle().maxWidth).toBe('var(--qd-atelier-popover-max-width)');
  });
  it('moves switch track, knob and both positions while preserving semantics', () => {
    const on = renderToStaticMarkup(<Switch checked onChange={() => {}} ariaLabel="Test switch" />);
    const off = renderToStaticMarkup(<Switch checked={false} onChange={() => {}} disabled ariaLabel="Test switch" />);
    expect(on).toContain('width:64px;height:32px');
    expect(on).toContain('top:4px;left:36px;width:24px;height:24px');
    expect(on).toContain('aria-checked="true"');
    expect(off).toContain('top:4px;left:4px;width:24px;height:24px');
    expect(off).toContain('aria-checked="false"');
    expect(off).toContain('disabled=""');
  });

  it('changes grid media queries and defaults without changing explicit caller geometry', () => {
    const html = renderToStaticMarkup(<Grid cols={4}><span>item</span></Grid>);
    expect(html).toContain('minmax(min(100%, var(--qd-grid-min-width)), 1fr)');
    expect(html).toContain('@media (min-width:800px)');
    expect(html).toContain('@media (min-width:1100px)');
    expect(renderToStaticMarkup(<Grid minCol={172}><span>item</span></Grid>)).toContain('minmax(min(100%, 172px), 1fr)');
    expect(foldGrid(3, 12).gridTemplateColumns).toContain('min(100%, max(var(--qd-grid-min-width), calc((100% - 24px) / 3 - 2px)))');
    expect(foldGrid(3, 12, { min: 175 }).gridTemplateColumns).toContain('max(175px,');
  });

  it('changes rendered alpha blends and every ribbon track from central values', () => {
    expect(tintBorder('#123456')).toBe('#123456a1');
    expect(renderToStaticMarkup(<Tag color="#123456" tier="primary">status</Tag>)).toContain('background:#12345645');
    const ribbon = renderToStaticMarkup(<EntranceRibbon />);
    expect([...ribbon.matchAll(/dur="2\.25s"/g)]).toHaveLength(6);
    expect(ribbon).not.toContain('dur="1.7s"');
  });

  it('UI consumers cannot quietly re-import numeric presentation settings from locked engine tokens', () => {
    const root = process.cwd();
    const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
      ? walk(join(dir, entry.name))
      : /\.(ts|tsx)$/.test(entry.name) && !/\.(test|spec)\./.test(entry.name) ? [join(dir, entry.name)] : []);
    const offenders: string[] = [];
    for (const file of ['app', 'components', 'lib/design', 'lib/hooks'].flatMap(dir => walk(join(root, dir)))) {
      const path = relative(root, file).replaceAll('\\', '/');
      const code = readSource(path, 'code');
      const ast = ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true, path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      for (const statement of ast.statements) {
        if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || !/(?:^|\/)tokens$/.test(statement.moduleSpecifier.text)) continue;
        const bindings = statement.importClause?.namedBindings;
        if (bindings && ts.isNamedImports(bindings) && bindings.elements.some(spec => ['BP', 'LAYOUT', 'ICON'].includes((spec.propertyName ?? spec.name).text))) offenders.push(path);
      }
    }
    expect(offenders).toEqual([]);
    expect(readSource('lib/hooks/useBreakpoints.ts', 'code')).toContain('`(max-width: ${BP.lg - 1}px)`');
  });
});
