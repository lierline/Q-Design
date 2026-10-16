import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createQdValues, normalizeScaleSyntax, normalizeStyleLiterals } from './qd-adapter-values.mjs';
import { readRuntimeValues, normalizeRuntimeReferences, normalizeTypographyReferences, resolveAtelierMedia } from './atelier-runtime-values.mjs';
import { buildFoundation } from './build-foundation.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(join(root, path), 'utf8');
const contract = read('source/tokens/q-design-contract.ts');
const css = read('patterns/components.css');
const tokens = JSON.parse(read('dist/q-design.tokens.json'));
const foundationCss = read('patterns/foundation.css');
const make = (overrides = {}) => createQdValues({ contract, css, foundationCss, tokens, ...overrides });

test('UI scales resolve foundation mutations while source normalization only preserves probe markers', () => {
  const changed = make({ foundationCss: foundationCss
    .replace('--qd-font-size-14: 14px;', '--qd-font-size-14: 17px;')
    .replace('--qd-space-unit: 4px;', '--qd-space-unit: 5px;')
    .replace('--qd-leading-loose: 1.7;', '--qd-leading-loose: 1.9;') });
  assert.equal(changed.pixels('QDScale.font[14]'), 17);
  assert.equal(changed.pixels('QDScale.space[3]'), 15);
  assert.equal(changed.leading('loose'), 1.9);
  assert.equal(changed.css('QDScale.font[14]'), 'var(--qd-font-size-14, 14px)');
  assert.equal(normalizeScaleSyntax('fontSize: QDScale.font[14],'), 'fontSize: FS[14],');
  assert.equal(normalizeScaleSyntax('padding: `${QDScale.space[3]} 0`'), 'padding: `${S[3]}px 0`');
  assert.throws(() => changed.pixels('QDScale.space[999]'), /Unknown UI scale/);
  assert.throws(() => make({ foundationCss: foundationCss.replace('--qd-font-size-14:', '--missing-font-14:') }).pixels('QDScale.font[14]'), /Unknown canonical/);
});

test('canonical dimension mutations change extraction while emitted variables remain live', () => {
  const current = make();
  const changed = make({ css: css.replace('--qd-radius: 10px;', '--qd-radius: 14px;').replace('--qd-control-size: 13px;', '--qd-control-size: 15px;') });
  assert.equal(current.pixels('QD.radius'), 10);
  assert.equal(changed.pixels('QD.radius'), 14);
  assert.equal(changed.pixels('QD.controlSize'), 15);
  assert.equal(changed.css('QD.radius'), current.css('QD.radius'));
  assert.match(changed.css('QD.radius'), /^var\(--qd-radius,/);
  assert.equal(changed.resolve('QD.controlPaddingSm'), '7px 14px');
});

test('source property changes are followed and ambiguous or unsupported probes fail closed', () => {
  const values = make();
  assert.equal(values.pixels(values.property('fontSize: QD.captionSize,', 'fontSize')), 12);
  assert.equal(values.pixels(values.property('fontSize: FS[13],', 'fontSize')), 13);
  assert.equal(values.pixels(values.property('padding: S[3],', 'padding')), tokens.space.scale[3]);
  assert.equal(values.property('/* fontSize: FS[99], */ fontSize: QD.controlSize,', 'fontSize'), 'QD.controlSize');
  assert.throws(() => values.property('fontSize: FS[12], fontSize: FS[13],', 'fontSize'), /found 2/);
  assert.throws(() => values.property('fontSize: readFromNetwork(),', 'fontSize'), /found 0/);
  assert.throws(() => values.css('process.exit(1)'), /Unsupported/);
  assert.throws(() => values.pixels('QD.missing'), /Unknown QD/);
  assert.throws(() => values.pixels("'var(--qd-unregistered, 12px)'"), /Unknown canonical/);
  assert.throws(() => values.pixels('QD.controlPaddingSm'), /one pixel dimension/);
});

test('canonical aliases resolve and cycles or duplicate declarations cannot pass', () => {
  const alias = make({ css: css.replace('--qd-radius: 10px;', '--qd-radius: var(--qd-custom-radius);\n  --qd-custom-radius: 17px;') });
  assert.equal(alias.pixels('QD.radius'), 17);
  assert.throws(() => make({ css: css.replace('--qd-radius: 10px;', '--qd-radius: var(--qd-radius);') }).pixels('QD.radius'), /Cyclic/);
  assert.throws(() => make({ css: css.replace('--qd-radius: 10px;', '--qd-radius: 10px; --qd-radius: 12px;') }), /Duplicate/);
  assert.throws(() => make({ foundationCss: foundationCss.replace('--qd-border-width: 1px;', '--qd-border-width: 1px; --qd-border-width: 1px;') }), /Duplicate foundation variable/);
  assert.throws(() => make({ contract: contract.replace("radius: `var(--qd-radius, ${RADIUS.md}px)`", 'radius: QD.radius') }).css('QD.radius'), /Cyclic/);
});

test('nav, list and screen regeneration follows central changes and rejects broken adapters', () => {
  const parent = resolve(root, '..', 'tmp');
  mkdirSync(parent, { recursive: true });
  const fixture = mkdtempSync(join(parent, 'qd-extract-adapter-'));
  const fixtureReal = realpathSync(fixture);
  const child = relative(realpathSync(parent), fixtureReal);
  assert.ok(child.startsWith('qd-extract-adapter-') && !child.includes(sep) && child !== '..');
  try {
    const files = [
      'tools/extract-nav.mjs', 'tools/extract-list.mjs', 'tools/extract-screen.mjs', 'tools/extract-tokens.mjs', 'tools/emit.mjs', 'patterns/champagne-ramp.json', 'tools/probe.mjs', 'tools/qd-adapter-values.mjs', 'tools/atelier-runtime-values.mjs', 'tools/tag-metrics-probe.mjs',
      'source/design/atelier-runtime.ts', 'source/design/atelier-output.ts', 'tools/atelier-output-values.mjs', 'patterns/foundation/atelier-labels.ts',
      'source/components/Sidebar.tsx', 'source/components/components.tsx', 'source/components/TextAction.tsx',
      'source/components/LogoutButton.tsx', 'source/components/ListPager.tsx', 'source/components/ListToolbar.tsx',
      'source/tokens/tokens.ts', 'source/tokens/q-design-contract.ts', 'source/tokens/grain.ts', 'source/tokens/tag-metrics.ts',
      'source/tokens/main-padding.ts', 'source/screens/audit-page.tsx', 'source/components/PageTabs.tsx',
      'source/css/globals.css', 'source/css/expert-theme.css', 'dist/q-design.tokens.json', 'patterns/components.css', 'patterns/workspace.css', 'patterns/foundation.css', 'patterns/foundation/atelier.css',
      'patterns/foundation/atelier-values.css', 'patterns/foundation/atelier-core-values.css', 'patterns/typography-links.css',
      'source/style-adapters/atelier-literal-values.json', 'source/style-adapters/atelier-core-values.json',
      'source/style-adapters/atelier-grid-values.json', 'source/style-adapters/atelier-conditional-values.json',
      'source/style-adapters/atelier-function-values.json', 'source/style-adapters/atelier-style-fragments.json',
    ];
    for (const file of files) {
      mkdirSync(dirname(join(fixture, file)), { recursive: true });
      copyFileSync(join(root, file), join(fixture, file));
    }
    const run = file => execFileSync(process.execPath, [join(fixture, 'tools', file)], { cwd: fixture, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const numeric = readRuntimeValues(fixture);
    numeric.BP.md = 800;
    numeric.BP.lg = 1100;
    numeric.LAYOUT.detail = 900;
    numeric.ICON.sizeMd = 24;
    numeric.QDRuntime.grain.tint = 0.63;
    numeric.QDRuntime.alpha.tint0_1 = 0.27;
    numeric.QDPresentation.iconSize['1.75'] = 2.25;
    numeric.QDPresentation.gridMinColumn['180'] = 190;
    numeric.QDPresentation.mainPadding = { top: 36, right: 44, bottom: 28, left: 42 };
    const runtimeFile = join(fixture, 'source/design/atelier-runtime.ts');
    const runtimeSource = readFileSync(runtimeFile, 'utf8');
    writeFileSync(runtimeFile, runtimeSource.replace(/export const (BP|LAYOUT|ICON|QDRuntime|QDPresentation|Z) = (\{[\s\S]*?\}) as const;/g,
      (_match, key) => `export const ${key} = ${JSON.stringify(numeric[key], null, 2)} as const;`));
    const grainPath = join(fixture, 'source/tokens/grain.ts');
    writeFileSync(grainPath, readFileSync(grainPath, 'utf8').replace('tint: 0.55,', 'tint: QDRuntime.grain.tint,'));
    assert.equal(normalizeRuntimeReferences('alpha(c, QDRuntime.alpha.tint0_1)', fixture), 'alpha(c, 0.27)');
    assert.equal(normalizeRuntimeReferences('QDPresentation.iconSize[1.75]', fixture), '2.25');
    assert.equal(normalizeRuntimeReferences('QDPresentation.gridMinColumn[180]', fixture), '190');
    assert.equal(normalizeRuntimeReferences('QDPresentation.chartGeometry.gridDash', fixture), "'2 4'");
    assert.equal(normalizeRuntimeReferences('QDPresentation.chartGeometry.padding', fixture), '{"top":12,"right":12,"bottom":28,"left":36}');
    assert.throws(() => normalizeRuntimeReferences('QDPresentation.gridMinColumn[999]', fixture), /Unknown numeric runtime adapter/);
    const labelFile = join(fixture, 'patterns/foundation/atelier-labels.ts');
    const labelSource = readFileSync(labelFile, 'utf8');
    const labelMatch = labelSource.match(/export const QDText = (\{[\s\S]*?\}) as const;/);
    const typography = JSON.parse(labelMatch[1]);
    const trackingKey = Object.keys(typography.tracking).find(key => typography.tracking[key] === 1.2);
    assert.ok(trackingKey);
    typography.tracking[trackingKey] = 1.7;
    writeFileSync(labelFile, labelSource.replace(labelMatch[1], JSON.stringify(typography, null, 2)));
    assert.equal(normalizeTypographyReferences(`labelTracking(sub, QDText.tracking.${trackingKey})`, fixture), 'labelTracking(sub, 1.7)');
    assert.throws(() => normalizeTypographyReferences('QDText.tracking.missing', fixture), /Unknown typography adapter/);
    assert.throws(() => normalizeRuntimeReferences('QDRuntime.alpha.missing', fixture), /Unknown numeric runtime adapter/);
    assert.equal(resolveAtelierMedia('@media (min-width: qd-bp(md)) and (max-width: qd-bp(lg-max)) {}', numeric), '@media (min-width: 800px) and (max-width: 1099px) {}');
    assert.throws(() => resolveAtelierMedia('@media (min-width: qd-bp(missing)) {}', numeric), /Unknown or invalid central breakpoint/);
    buildFoundation(fixture, { only: ['atelier'] });
    const compiled = readFileSync(join(fixture, 'dist/q-design.foundation.atelier.css'), 'utf8');
    assert.match(compiled, /@media \(min-width: 800px\) and \(max-width: 1099px\)/);
    assert.doesNotMatch(compiled, /qd-bp\(/);
    run('extract-tokens.mjs');
    const numericTokens = JSON.parse(readFileSync(join(fixture, 'dist/q-design.tokens.json'), 'utf8'));
    assert.equal(numericTokens.space.layout.detail, 900);
    assert.equal(numericTokens.breakpoint.lg, 1100);
    assert.equal(numericTokens.icon.sizeMd, 24);
    const changed = css.replace('--qd-radius: 10px;', '--qd-radius: 14px;')
      .replace('--qd-control-height-sm: 36px;', '--qd-control-height-sm: 40px;')
      .replace('--qd-control-height: 44px;', '--qd-control-height: 48px;')
      .replace('--qd-control-size: 13px;', '--qd-control-size: 15px;')
      .replace('--qd-title-size: 22px;', '--qd-title-size: 24px;')
      .replace('--qd-section-size: 16px;', '--qd-section-size: 18px;')
      .replace('--qd-field-gap: var(--qd-space-1);', '--qd-field-gap: 9px;')
      .replace('--qd-kpi-min-size: 20px;', '--qd-kpi-min-size: 21px;')
      .replace('--qd-kpi-fluid-size: 16cqw;', '--qd-kpi-fluid-size: 18cqw;')
      .replace('--qd-table-pad-y: 11px;', '--qd-table-pad-y: 15px;')
      .replace('--qd-table-pad-y-dense: var(--qd-space-2);', '--qd-table-pad-y-dense: 14px;')
      .replace('--qd-table-pad-x: 12px;', '--qd-table-pad-x: 18px;')
      .replace('var(--qd-status) 45%', 'var(--qd-status) 60%');
    writeFileSync(join(fixture, 'patterns/components.css'), changed);
    writeFileSync(join(fixture, 'patterns/foundation.css'), foundationCss
      .replace('--qd-font-size-14: 14px;', '--qd-font-size-14: 17px;')
      .replace('--qd-space-unit: 4px;', '--qd-space-unit: 5px;')
      .replace('--qd-leading-loose: 1.7;', '--qd-leading-loose: 1.9;'));
    const auditFile = join(fixture, 'source/screens/audit-page.tsx');
    writeFileSync(auditFile, readFileSync(auditFile, 'utf8').replace(/minCol=\{180\} gap=\{14\}/, 'minCol={QDPresentation.gridMinColumn[180]} gap={QDScale.space[3.5]}'));
    const core = readFileSync(join(fixture, 'patterns/foundation/atelier-core-values.css'), 'utf8')
      .replace('--qd-tag-sm-min-height: 24px;', '--qd-tag-sm-min-height: 32px;')
      .replace('--qd-atelier-width-aebc026e77: 240px;', '--qd-atelier-width-aebc026e77: 260px;')
      .replace('--qd-atelier-height-e737496ec6: 1.5px;', '--qd-atelier-height-e737496ec6: 2.5px;')
      .replace('--qd-atelier-section-leading: 1.35;', '--qd-atelier-section-leading: 1.45;')
      .replace('--qd-atelier-hub-link-underline-offset: 3px;', '--qd-atelier-hub-link-underline-offset: 4px;');
    writeFileSync(join(fixture, 'patterns/foundation/atelier-core-values.css'), core);
    const densityComponent=join(fixture,'source/components/components.tsx');
    writeFileSync(densityComponent,readFileSync(densityComponent,'utf8').replace(
      'const padY = dense ? 8 : 11;',"const padY = dense ? 'var(--qd-table-pad-y-dense)' : 'var(--qd-table-pad-y, 11px)';"));
    const sidebarPath = join(fixture, 'source/components/Sidebar.tsx');
    writeFileSync(sidebarPath, readFileSync(sidebarPath, 'utf8').replace(
      'const width = collapsed ? 60 : 240;',
      'const width = collapsed ? "var(--qd-atelier-width-8071f21693)" : "var(--qd-atelier-width-aebc026e77)";',
    ));
    assert.equal(normalizeStyleLiterals('height: "var(--qd-atelier-height-e737496ec6)",', fixture), 'height: 2.5,');
    assert.equal(normalizeStyleLiterals('lineHeight: "var(--qd-atelier-section-leading)",', fixture), 'lineHeight: 1.45,');
    assert.equal(normalizeStyleLiterals('WebkitLineClamp: "var(--qd-atelier-line-clamp-single)",', fixture), 'WebkitLineClamp: 1,');
    assert.equal(normalizeStyleLiterals('WebkitLineClamp: "var(--qd-atelier-line-clamp-double)",', fixture), 'WebkitLineClamp: 2,');
    assert.equal(normalizeStyleLiterals('textUnderlineOffset: "var(--qd-atelier-hub-link-underline-offset)",', fixture), 'textUnderlineOffset: 4,');
    assert.throws(() => normalizeStyleLiterals('height: "var(--qd-atelier-height-not-defined)",', fixture), /Unregistered canonical style argument/);
    const recipePath = join(fixture, 'patterns/foundation/atelier.css');
    const recipe = readFileSync(recipePath, 'utf8');
    assert.equal(normalizeStyleLiterals('zIndex: "var(--qd-atelier-mobile-control-layer)",', fixture), 'zIndex: 500,');
    assert.equal(normalizeStyleLiterals('zIndex: "var(--qd-atelier-mobile-header-layer)",', fixture), 'zIndex: 200,');
    const changedLayers = recipe.replace('--qd-atelier-mobile-control-layer: 500;', '--qd-atelier-mobile-control-layer: 550;');
    assert.notEqual(changedLayers, recipe);
    writeFileSync(recipePath, changedLayers);
    assert.equal(normalizeStyleLiterals('zIndex: mobile ? "var(--qd-atelier-mobile-control-layer)" : 89,', fixture), 'zIndex: mobile ? 550 : 89,');
    assert.throws(() => normalizeStyleLiterals('height: "var(--qd-atelier-mobile-control-layer)",', fixture), /Invalid semantic style argument/);
    assert.throws(() => normalizeStyleLiterals('zIndex: "var(--qd-atelier-unregistered-layer)",', fixture), /Unregistered canonical style argument/);
    writeFileSync(recipePath, recipe.replace('--qd-atelier-mobile-control-layer: 500;', '--qd-atelier-mobile-control-layer: 500px;'));
    assert.throws(() => normalizeStyleLiterals('zIndex: "var(--qd-atelier-mobile-control-layer)",', fixture), /Expected integer style argument/);
    writeFileSync(recipePath, recipe.replace('--qd-atelier-mobile-control-layer: 500;', ''));
    assert.throws(() => normalizeStyleLiterals('zIndex: "var(--qd-atelier-mobile-control-layer)",', fixture), /Unknown canonical variable/);
    writeFileSync(recipePath, recipe);
    run('extract-nav.mjs');
    run('extract-list.mjs');
    run('extract-screen.mjs');
    const nav = JSON.parse(readFileSync(join(fixture, 'dist/q-design.nav.json'), 'utf8'));
    const list = JSON.parse(readFileSync(join(fixture, 'dist/q-design.list.json'), 'utf8'));
    const screen = JSON.parse(readFileSync(join(fixture, 'dist/q-design.screen.json'), 'utf8'));
    assert.equal(nav.logout.minHeight, 40);
    assert.equal(nav.logout.fontSize, 15);
    assert.equal(nav.item.fontSize, 17);
    assert.equal(nav.rail.width, 260);
    assert.equal(list.row.titleFontSize, 17);
    assert.equal(list.panel.padding, 30);
    assert.equal(list.panel.accentMix, 0.63);
    assert.equal(list.empty.lineHeight, 1.9);
    assert.equal(list.tag.sm.minH, 32);
    assert.equal(list.table.padY, 15);
    assert.equal(list.table.padYDense, 14);
    assert.equal(list.table.padX, 18);
    assert.equal(list.control.radius, 14);
    assert.equal(list.bar.submitHeight, 40);
    assert.equal(list.bar.submitSize, 15);
    assert.equal(list.bar.fieldSize, 15);
    assert.equal(list.bar.fieldPadIcon, 40);
    assert.equal(list.pager.btnSize, 15);
    assert.equal(screen.head.titleSize, 24);
    assert.equal(screen.head.stackBelow, 799);
    assert.equal(screen.input.narrowBelow, 1099);
    assert.equal(screen.shell.detail, 900);
    assert.deepEqual(screen.main, { top: 36, right: 44, bottom: 28, left: 42 });
    assert.equal(screen.section.fontSize, 18);
    assert.equal(screen.btn.fontSize, 15);
    assert.equal(screen.input.fontSize, 15);
    assert.equal(screen.field.gapBelow, 9);
    assert.equal(screen.btn.minHeight, 48);
    assert.equal(screen.input.minHeight, 48);
    assert.equal(screen.btn.radius, 14);
    assert.equal(screen.input.radius, 14);
    assert.equal(screen.kpi.gridMinCol, 190);
    assert.equal(screen.kpi.gridGap, 17.5);
    assert.equal(screen.kpi.valueMin, 21);
    assert.equal(screen.kpi.valueFluid, 18);
    const navCss = readFileSync(join(fixture, 'dist/q-design.nav.css'), 'utf8');
    const listCss = readFileSync(join(fixture, 'dist/q-design.list.css'), 'utf8');
    const screenCss = readFileSync(join(fixture, 'dist/q-design.screen.css'), 'utf8');
    assert.match(navCss, /font-size: var\(--qd-control-size,/);
    assert.match(navCss, /@media \(max-width: 1099px\)/);
    assert.match(navCss, /--qd-font-ui: var\(--qd-font-ui-src, var\(--qd-font-family-ui,/);
    assert.match(listCss, /padding: calc\(var\(--qd-table-pad-y,/);
    assert.match(listCss, /padding: calc\(var\(--qd-table-pad-y-dense\) \+ var\(--qd-border-width, 1px\)\)/);
    assert.match(listCss, /var\(--qd-status\) 60%/);
    assert.match(listCss, /padding: 0 15px 0 var\(--qd-space-8\);/);
    assert.match(listCss, /min-height: var\(--qd-tag-sm-min-height, 32px\)/);
    assert.doesNotMatch(listCss, /NaN|undefined/);
    assert.match(screenCss, /font-size: var\(--qd-title-size,/);
    assert.match(screenCss, /font-size: var\(--qd-control-size,/);
    assert.match(screenCss, /clamp\(var\(--qd-kpi-min-size\), var\(--qd-kpi-fluid-size\), var\(--qd-kpi-size,/);
    assert.doesNotMatch(screenCss, /NaN|undefined/);
    writeFileSync(join(fixture, 'patterns/components.css'), changed.replace('--qd-kpi-fluid-size: 18cqw;', '--qd-kpi-fluid-size: 18px;'));
    assert.throws(() => run('extract-screen.mjs'), error => /KPI fluid size must use cqw/.test(String(error.stderr)));
    writeFileSync(join(fixture, 'patterns/components.css'), changed);
    const componentFile = join(fixture, 'source/components/components.tsx');
    writeFileSync(componentFile, readFileSync(componentFile, 'utf8').replace('className="qd-notice"', 'className="local-notice"'));
    assert.throws(() => run('extract-list.mjs'), error => /Alert 의 중앙 notice 연결/.test(String(error.stderr)));
    copyFileSync(join(root, 'source/components/components.tsx'), componentFile);
    writeFileSync(join(fixture, 'source/tokens/q-design-contract.ts'), contract.replace('controlSize:', 'unknownControlSize:'));
    assert.throws(() => run('extract-screen.mjs'), error => /Unknown QD adapter: QD.controlSize/.test(String(error.stderr)));
    writeFileSync(join(fixture, 'source/tokens/q-design-contract.ts'), contract);
    const sharedFoundation = join(fixture, 'patterns/foundation.css');
    const beforeBorder = readFileSync(sharedFoundation, 'utf8');
    assert.match(beforeBorder, /--qd-border-width: 1px;/);
    writeFileSync(sharedFoundation, beforeBorder.replace('--qd-border-width: 1px;', '--qd-border-width: 3px;'));
    assert.equal(normalizeStyleLiterals('borderTop: `var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${tone}`', fixture), 'borderTop: `3px solid ${tone}`');
    assert.throws(() => normalizeStyleLiterals('borderTop: `var(--qd-atelier-border-style-unregistered) ${tone}`', fixture), /Unregistered canonical border fragment/);
  } finally {
    // The generated literal child is verified before removing this test's fixture only.
    assert.equal(realpathSync(fixture), fixtureReal);
    rmSync(fixtureReal, { recursive: true, force: true });
  }
});
