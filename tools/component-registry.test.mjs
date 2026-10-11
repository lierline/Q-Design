import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { resolve, dirname, join, basename, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { scanProduct, checkProduct, identities, digest, exportedPublicCoverage } from '../source/component-registry-core.mjs';

const temporaryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../tmp');
const typescriptModules = resolve(dirname(fileURLToPath(import.meta.url)), '../../Q-Atelier/node_modules');
const typescriptEntry = createRequire(join(typescriptModules, '../package.json')).resolve('typescript');
const fixturePrefix = 'q-design-component-registry-';
const catalog = { families: [{ id: 'foundation', match: '.*' }] };

function fixture(t, extra = {}) {
  mkdirSync(temporaryRoot, { recursive: true });
  const root = mkdtempSync(join(temporaryRoot, fixturePrefix));
  t.after(() => {
    // Delete only the exact directory created by this fixture.
    assert.equal(dirname(resolve(root)), temporaryRoot);
    assert.ok(basename(root).startsWith(fixturePrefix));
    rmSync(root, { recursive: true, force: true });
  });
  const put = (path, text) => {
    const full = resolve(root, path);
    const child = relative(root, full);
    assert.ok(child && !child.startsWith('..') && !isAbsolute(child));
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, text, 'utf8');
  };
  put('package.json', '{"private":true}');
  // Use the real installed parser through a fixture-local loader, without Windows symlink privileges.
  put('node_modules/typescript/package.json', '{"main":"index.cjs"}');
  put('node_modules/typescript/index.cjs', `module.exports = require(${JSON.stringify(typescriptEntry)});\n`);
  const initial = {
    'app/layout.tsx': "import './globals.css'; export default function Layout({ children }) { return <main>{children}</main>; }",
    'app/page.tsx': "export default function Page() { return <h1>Fixture</h1>; }",
    'app/globals.css': "@import './canonical.css';\nbody { margin: 0; }\n",
    'app/canonical.css': '.qd-btn { min-height: 44px; }\n',
    ...extra,
  };
  for (const [path, text] of Object.entries(initial)) put(path, text);
  const scan = () => scanProduct(root, catalog);
  const lock = (copies = [{ path: 'app/canonical.css', runtime: true }]) => ({
    catalog,
    files: identities(scan().files),
    copies: copies.map(copy => ({ ...copy, sha256: digest(readFileSync(join(root, copy.path), 'utf8')) })),
  });
  return { root, put, scan, lock };
}

test('discovers function, arrow, wrapped, alias, nested, default and class components', t => {
  const f = fixture(t, {
    'components/widgets.tsx': `
      import React, { memo, forwardRef } from 'react';
      export function FunctionCard() { return <div />; }
      export const ArrowCard = () => <section />;
      export const MemoCard = memo(() => <article />);
      export const RefCard = forwardRef((props, ref) => <button ref={ref} />);
      export const DirectAlias = FunctionCard;
      const Namespace = { Card: FunctionCard };
      export const PropertyAlias = Namespace.Card;
      export function OuterCard() {
        function InnerCard() { return <span />; }
        return <InnerCard />;
      }
      export class ClassCard extends React.Component { render() { return <aside />; } }
      export const UPPER_CONSTANT = 'not a component';
      export const UPPER_OBJECT = { size: 44 };
      export const UPPER_ELEMENT = <i />;
      export const NumberConstant = Math.PI;
    `,
    'components/anonymous.tsx': 'export default () => <div />;',
    'components/nullable.tsx': 'export default function Nullable() { return null; }',
  });
  const files = new Map(f.scan().files.map(file => [file.path, file]));
  assert.deepEqual(files.get('components/widgets.tsx').components.map(component => component.name).sort(), [
    'ArrowCard', 'ClassCard', 'DirectAlias', 'FunctionCard', 'InnerCard', 'MemoCard', 'OuterCard', 'PropertyAlias', 'RefCard',
  ].sort());
  assert.equal(files.get('components/widgets.tsx').components.find(component => component.name === 'ClassCard').kind, 'class');
  assert.deepEqual(files.get('components/anonymous.tsx').components.map(component => component.name), ['default']);
  assert.deepEqual(files.get('components/nullable.tsx').components.map(component => component.name), ['Nullable']);
});

test('inventories every TSX module, including modules without a component, while excluding tests', t => {
  const f = fixture(t, {
    'components/config.tsx': 'export const SIZE = 44;',
    'components/config.test.tsx': 'export const TestOnly = () => <i />;',
    'components/config.stories.tsx': 'export const StoryOnly = () => <i />;',
    'components/__tests__/hidden.tsx': 'export const TestOnly = () => <i />;',
  });
  const files = f.scan().files;
  assert.deepEqual(files.find(file => file.path === 'components/config.tsx').components, []);
  assert.equal(files.filter(file => /test|stories/.test(file.path)).length, 0);
  assert.ok(files.some(file => file.path === 'app/canonical.css' && file.kind === 'stylesheet'));
});

test('uses live JSX syntax without treating JSX or JS comments as imports, controls, classes or styles', t => {
  const f = fixture(t, {
    'app/page.tsx': `
      // import '../components/comment-only';
      /* const Ghost = () => <button className="qd-ghost" style={{ color: 'red' }} />; */
      export default function Page() {
        return <section className="qd-live" style={{ color: 'var(--qa-text)' }}>
          {/* import('../components/comment-only'); <button className="qd-comment" style={{}} /> */}
          <input />
        </section>;
      }
    `,
    'components/comment-only.tsx': 'export const CommentOnly = () => <aside />;',
  });
  const result = f.scan();
  const page = result.files.find(file => file.path === 'app/page.tsx');
  assert.deepEqual(page.components.map(component => component.name), ['Page']);
  assert.deepEqual(page.classes, ['qd-live']);
  assert.deepEqual(page.tokens, ['--qa-text']);
  assert.deepEqual(page.nativeControls, ['input']);
  assert.equal(page.inlineStyles, 1);
  assert.equal(result.reachable.has('components/comment-only.tsx'), false);
});

test('a valid lock survives CRLF differences and unrelated business text edits', t => {
  const f = fixture(t);
  const lock = f.lock();
  assert.deepEqual(checkProduct(f.root, lock), []);
  f.put('app/page.tsx', 'export default function Page() { return <h1>Updated business text</h1>; }\r\n');
  f.put('app/canonical.css', '.qd-btn { min-height: 44px; }\r\n');
  assert.deepEqual(checkProduct(f.root, lock), []);
});

test('a new component in an existing file fails registration even without a new import', t => {
  const f = fixture(t);
  const lock = f.lock();
  f.put('app/page.tsx', 'export default function Page() { return <h1 />; } export const NewCard = () => <aside />;');
  assert.ok(checkProduct(f.root, lock).includes('Component registration changed: app/page.tsx'));
});

test('new TSX files and removed registered files cannot silently escape the inventory', t => {
  const f = fixture(t, { 'components/existing.tsx': 'export const Existing = () => <div />;' });
  const lock = f.lock();
  f.put('components/new.tsx', 'export const NewCard = () => <aside />;');
  // The literal is a fixture child file, never a computed directory deletion.
  rmSync(join(f.root, 'components/existing.tsx'));
  const failures = checkProduct(f.root, lock);
  assert.ok(failures.includes('Component registration changed: components/new.tsx'));
  assert.ok(failures.includes('Registered file missing: components/existing.tsx'));
});

test('removing the canonical import fails despite an intact copy and intact component identities', t => {
  const f = fixture(t);
  const lock = f.lock();
  f.put('app/globals.css', 'body { margin: 0; }\n');
  assert.deepEqual(checkProduct(f.root, lock), ['Canonical copy is not imported from an application entrypoint: app/canonical.css']);
});

test('a commented CSS import does not count as runtime use of a canonical copy', t => {
  const f = fixture(t);
  const lock = f.lock();
  f.put('app/globals.css', "/* @import './canonical.css'; */\nbody { margin: 0; }\n");
  assert.deepEqual(checkProduct(f.root, lock), ['Canonical copy is not imported from an application entrypoint: app/canonical.css']);
});

test('type-only import and export bindings do not make a canonical component reachable', t => {
  const f = fixture(t, { 'components/canonical.tsx': 'export const CanonicalCard = () => <div />;' });
  const lock = f.lock([{ path: 'components/canonical.tsx', runtime: true }]);
  for (const declaration of [
    "import type { CanonicalCard } from '../components/canonical';",
    "import { type CanonicalCard } from '../components/canonical';",
    "export type { CanonicalCard } from '../components/canonical';",
    "export { type CanonicalCard } from '../components/canonical';",
  ]) {
    f.put('app/page.tsx', declaration + '\nexport default function Page() { return <h1 />; }');
    assert.ok(checkProduct(f.root, lock).includes('Canonical copy is not imported from an application entrypoint: components/canonical.tsx'), declaration);
  }
});

test('tampering with a canonical copy fails its source digest', t => {
  const f = fixture(t);
  const lock = f.lock();
  f.put('app/canonical.css', '.qd-btn { min-height: 30px; }\n');
  assert.deepEqual(checkProduct(f.root, lock), ['Canonical copy changed: app/canonical.css']);
});

test('runtime alias imports, value re-exports and literal dynamic imports form a usable path', t => {
  const f = fixture(t, {
    'app/page.tsx': "import { Card } from '@/components/barrel'; export default function Page() { return <Card />; }",
    'components/barrel.ts': "export { CanonicalCard as Card } from './canonical';",
    'components/canonical.tsx': 'export const CanonicalCard = () => <div />;',
  });
  const lock = f.lock([{ path: 'components/canonical.tsx', runtime: true }]);
  assert.deepEqual(checkProduct(f.root, lock), []);
  f.put('app/page.tsx', "const lazyCard = () => import('../components/canonical'); export default function Page() { return <h1 />; }");
  assert.deepEqual(checkProduct(f.root, lock), []);
});

test('an empty application graph cannot certify otherwise intact canonical files', t => {
  const f = fixture(t);
  const lock = f.lock();
  rmSync(join(f.root, 'app/page.tsx'));
  rmSync(join(f.root, 'app/layout.tsx'));
  const failures = checkProduct(f.root, lock);
  assert.ok(failures.includes('No application entrypoints found'));
  assert.ok(failures.includes('Canonical copy is not imported from an application entrypoint: app/canonical.css'));
});

test('missing canonical files and malformed TSX fail instead of reporting success', t => {
  const f = fixture(t);
  const lock = f.lock();
  rmSync(join(f.root, 'app/canonical.css'));
  const failures = checkProduct(f.root, lock);
  assert.ok(failures.includes('Canonical copy missing: app/canonical.css'));
  assert.ok(failures.includes('Registered file missing: app/canonical.css'));
  f.put('app/page.tsx', 'export default function Page() { return <main>; }');
  assert.throws(() => f.scan(), /Cannot parse app\/page\.tsx/);
});

test('registers lowercase render helpers and PascalCase components that render null', t => {
  const f = fixture(t, {
    'components/renderers.tsx': `
      export function renderLabel() { return <span>Label</span>; }
      export const renderRow = () => <div>Row</div>;
      export function NullFunction() { return null; }
      export const NullArrow = () => null;
      export const NullBlockArrow = () => { return null; };
      export const NullExpression = function () { return null; };
      export function formatLabel() { return 'text'; }
      export const findValue = () => null;
      export const SIZE = 44;
    `,
  });
  const file = f.scan().files.find(item => item.path === 'components/renderers.tsx');
  assert.deepEqual(file.components.map(component => component.name).sort(), [
    'renderLabel', 'renderRow', 'NullFunction', 'NullArrow', 'NullBlockArrow', 'NullExpression',
  ].sort());
  for (const name of ['renderLabel', 'renderRow']) {
    assert.equal(file.components.find(component => component.name === name).kind, 'render-helper');
  }
  const lock = f.lock();
  f.put('components/renderers.tsx', readFileSync(join(f.root, 'components/renderers.tsx'), 'utf8') + '\nexport const renderNew = () => <aside />;');
  assert.ok(checkProduct(f.root, lock).includes('Component registration changed: components/renderers.tsx'));
});

test('CSS comments cannot register ghost selectors, tokens or canonical import reachability', t => {
  const f = fixture(t, {
    'app/globals.css': `
      /* @import './canonical.css'; .qd-ghost { color: var(--ghost); } */
      .qd-live { color: var(--live); }
      /*
       .qa-multiline-ghost { background: var(--ghost-background); }
       @import url('./canonical.css');
      */
    `,
  });
  const scan = f.scan();
  const css = scan.files.find(file => file.path === 'app/globals.css');
  assert.deepEqual(css.classes, ['qd-live']);
  assert.deepEqual(css.tokens, ['--live']);
  assert.deepEqual(css.imports, []);
  assert.equal(scan.reachable.has('app/canonical.css'), false);
  const lock = f.lock();
  f.put('app/globals.css', "@import url('./canonical.css');\n.qd-live { color: var(--live); }");
  assert.deepEqual(checkProduct(f.root, lock), []);
});

test('src/app entrypoints reach their canonical styles and reject an import removal', t => {
  const f = fixture(t, {
    'src/app/layout.tsx': "import './globals.css'; export default function Layout({ children }) { return <main>{children}</main>; }",
    'src/app/(workspace)/page.tsx': 'export default function Page() { return <h1>Workspace</h1>; }',
    'src/app/globals.css': "@import './canonical.css';\n",
    'src/app/canonical.css': '.qd-btn { min-height: 44px; }\n',
  });
  rmSync(join(f.root, 'app/layout.tsx'));
  rmSync(join(f.root, 'app/page.tsx'));
  const scan = f.scan();
  assert.deepEqual(scan.entrypoints.sort(), ['src/app/(workspace)/page.tsx', 'src/app/layout.tsx']);
  assert.ok(scan.reachable.has('src/app/canonical.css'));
  const lock = f.lock([{ path: 'src/app/canonical.css', runtime: true }]);
  assert.deepEqual(checkProduct(f.root, lock), []);
  f.put('src/app/globals.css', 'body { margin: 0; }\n');
  assert.deepEqual(checkProduct(f.root, lock), ['Canonical copy is not imported from an application entrypoint: src/app/canonical.css']);
});

const publicScope = (files = [], prefixes = ['components/ui/'], exemptions = []) => ({ files, prefixes, exemptions });
const publicRoles = (...entries) => ({ roles: [{ id: 'reviewed-role', implementations: entries.map(([file, ...symbols]) => ({ product: 'maison', kind: 'component', file, symbols })) }] });

test('public coverage requires exported render helpers but leaves internal implementation helpers in the inventory only', t => {
  const f = fixture(t, {
    'components/ui/card.tsx': `
      function Internal() { return <span />; }
      const localRender = () => <i />;
      export function Card() { return <Internal />; }
      export function renderLabel() { return <b />; }
      export const SIZE = 44;
    `,
  });
  const scan = f.scan();
  const components = scan.files.find(file => file.path === 'components/ui/card.tsx').components;
  assert.equal(components.find(c => c.name === 'Internal').exported, false);
  assert.equal(components.find(c => c.name === 'localRender').exported, false);
  assert.equal(components.find(c => c.name === 'renderLabel').exported, true);
  const coverage = exportedPublicCoverage(scan, publicRoles(['components/ui/card.tsx', 'Card', 'renderLabel']), publicScope(), 'maison');
  assert.deepEqual(coverage.failures, []);
  assert.equal(coverage.required, 2);
});

test('regenerating identities cannot bypass a new exported renderer in an existing public module', t => {
  const f = fixture(t, { 'components/ui/card.tsx': 'export function Card() { return <main />; }' });
  const roles = publicRoles(['components/ui/card.tsx', 'Card']);
  assert.deepEqual(exportedPublicCoverage(f.scan(), roles, publicScope(), 'maison').failures, []);
  f.put('components/ui/card.tsx', 'export function Card() { return <main />; } export const NewCard = () => <aside />;');
  // Even a freshly regenerated inventory lock is not a reviewed semantic role.
  assert.deepEqual(checkProduct(f.root, f.lock()), []);
  const coverage = exportedPublicCoverage(f.scan(), roles, publicScope(), 'maison');
  assert.deepEqual(coverage.unmapped, ['components/ui/card.tsx#NewCard']);
  assert.match(coverage.failures[0], /assign a reviewed component role before regenerating/);
});

test('a private renderer becoming public is caught even when component identity is unchanged', t => {
  const f = fixture(t, { 'components/ui/card.tsx': 'function Card() { return <main />; }' });
  const before = identities(f.scan().files);
  assert.deepEqual(exportedPublicCoverage(f.scan(), publicRoles(), publicScope(), 'maison').failures, []);
  f.put('components/ui/card.tsx', 'export function Card() { return <main />; }');
  assert.deepEqual(identities(f.scan().files), before);
  assert.deepEqual(exportedPublicCoverage(f.scan(), publicRoles(), publicScope(), 'maison').unmapped, ['components/ui/card.tsx#Card']);
});

test('new nested public files require roles without forcing similarly named directory neighbors', t => {
  const f = fixture(t, {
    'components/ui/card.tsx': 'export const Card = () => <main />;',
    'components/ui-private/internal.tsx': 'export const PrivateCard = () => <aside />;',
  });
  const roles = publicRoles(['components/ui/card.tsx', 'Card']);
  f.put('components/ui/new/field.tsx', 'export function NewField() { return <input />; }');
  const coverage = exportedPublicCoverage(f.scan(), roles, publicScope(), 'maison');
  assert.deepEqual(coverage.unmapped, ['components/ui/new/field.tsx#NewField']);
  assert.deepEqual(exportedPublicCoverage(f.scan(), publicRoles(['components/ui/card.tsx', 'Card'], ['components/ui/new/field.tsx', 'NewField']), publicScope(), 'maison').failures, []);
});

test('deleting the only role for an explicitly scoped file cannot shrink public API coverage', t => {
  const f = fixture(t, { 'components/shared/card.tsx': 'export const Card = () => <main />;' });
  const scope = publicScope(['components/shared/card.tsx'], []);
  assert.deepEqual(exportedPublicCoverage(f.scan(), publicRoles(['components/shared/card.tsx', 'Card']), scope, 'maison').failures, []);
  assert.deepEqual(exportedPublicCoverage(f.scan(), publicRoles(), scope, 'maison').unmapped, ['components/shared/card.tsx#Card']);
  // A renamed/deleted file also requires a reviewed scope change.
  rmSync(join(f.root, 'components/shared/card.tsx'));
  assert.match(exportedPublicCoverage(f.scan(), publicRoles(), scope, 'maison').failures[0], /scope file missing/);
});

test('exemptions need an exact current exported symbol and a reason, never an entire file or wildcard', t => {
  const f = fixture(t, { 'components/ui/card.tsx': 'export const Card = () => <main />; function Internal() { return <i />; }' });
  const exemption = { file: 'components/ui/card.tsx', symbol: 'Card', reason: 'Temporary legacy adapter with a tracked replacement.' };
  const allowed = exportedPublicCoverage(f.scan(), publicRoles(), publicScope([], ['components/ui/'], [exemption]), 'maison');
  assert.deepEqual(allowed.failures, []);
  assert.equal(allowed.exempted, 1);
  for (const invalid of [
    { ...exemption, reason: ' ' },
    { ...exemption, file: 'components/ui/*' },
    { ...exemption, symbol: '*' },
    { ...exemption, symbol: 'Internal' },
    { ...exemption, symbol: 'Removed' },
  ]) assert.ok(exportedPublicCoverage(f.scan(), publicRoles(), publicScope([], ['components/ui/'], [invalid]), 'maison').failures.length > 0);
  assert.ok(exportedPublicCoverage(f.scan(), publicRoles(['components/ui/card.tsx', 'Card']), publicScope([], ['components/ui/'], [exemption]), 'maison').failures.some(message => message.includes('no longer needs exemption')));
  f.put('components/ui/card.tsx', 'export const Card = () => <main />; export const NewCard = () => <aside />;');
  assert.deepEqual(exportedPublicCoverage(f.scan(), publicRoles(), publicScope([], ['components/ui/'], [exemption]), 'maison').unmapped, ['components/ui/card.tsx#NewCard']);
});

test('anonymous default functions and exported aliases are public while type-only aliases are not', t => {
  const f = fixture(t, {
    'components/ui/default.tsx': 'export default function () { return <main />; }',
    'components/ui/aliases.tsx': `
      import * as Dialog from '@radix-ui/react-dialog';
      const Content = Dialog.Content;
      const Internal = () => <i />;
      export { Content as PublicContent };
      export type { Internal };
    `,
  });
  const coverage = exportedPublicCoverage(f.scan(), publicRoles(), publicScope(), 'maison');
  assert.deepEqual(coverage.unmapped, ['components/ui/aliases.tsx#Content', 'components/ui/default.tsx#default']);
  assert.deepEqual(exportedPublicCoverage(f.scan(), publicRoles(['components/ui/default.tsx', 'default'], ['components/ui/aliases.tsx', 'Content']), publicScope(), 'maison').failures, []);
});

test('invalid, absent, or empty coverage scopes fail closed', t => {
  const f = fixture(t, { 'components/ui/card.tsx': 'export const Card = () => <main />;' });
  for (const scope of [undefined, publicScope([], []), publicScope([], ['components/']), publicScope([], ['components/ui']), publicScope([], ['components/missing/']), publicScope(['../components/ui/card.tsx'], [])]) {
    assert.ok(exportedPublicCoverage(f.scan(), publicRoles(), scope, 'maison').failures.length > 0);
  }
});
