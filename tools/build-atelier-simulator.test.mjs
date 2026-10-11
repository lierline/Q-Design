import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { composeSimulator } from './build-atelier-simulator.mjs';
const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const inputs = () => ({ template: read('patterns/foundation/atelier-simulator.html'), recipe: read('patterns/foundation/atelier-simulator.css'),
  components: read('patterns/components.css'), foundation: read('patterns/foundation.css'), palette: read('dist/q-design.palette.atelier.css'), fontResources: '' });

test('standalone simulator embeds canonical live typography, control and palette dependencies', () => {
  const original = inputs(); const html = composeSimulator(original);
  assert.match(html, /button \{ min-height: var\(--qd-control-height\); border-radius: var\(--qd-radius\)/);
  assert.match(html, /--bg: var\(--qd-bg\)/);
  assert.match(html, /font-family:var\(--qd-font-family-ui\)/);
  assert.match(html, /font-size:var\(--qd-caption-size\)/);
  assert.match(html, /prefers-color-scheme: light/);
  assert.match(html, /<script src="\/__sim\.js"><\/script>/);
  assert.doesNotMatch(html, /fonts\.googleapis|{{QD_SIMULATOR_CSS}}/);
  const mutated = composeSimulator({ ...original,
    components: original.components.replace('--qd-radius: 10px', '--qd-radius: 18px').replace('--qd-control-height: 44px', '--qd-control-height: 52px'),
    palette: original.palette.replaceAll('#0c0c0c', '#102030').replaceAll('#faf9f6', '#eeeedd'),
  });
  assert.match(mutated, /--qd-radius: 18px/); assert.match(mutated, /--qd-control-height: 52px/);
  assert.match(mutated, /--qa-bg: #102030/); assert.match(mutated, /--qa-bg: #eeeedd/);
  assert.notEqual(mutated, html);
});

test('missing palette or template slot fails rather than silently retaining stale defaults', () => {
  assert.throws(() => composeSimulator({ ...inputs(), palette: ':root { --qa-bg: black; }' }), /light palette/);
  assert.throws(() => composeSimulator({ ...inputs(), template: '<html></html>' }), /slot/);
});

test('standalone bundle resolves required variables locally and rejects a typo or removed semantic token', () => {
  const original = inputs();
  assert.match(composeSimulator(original), /\.sum \.num b\{display:block; font-size:var\(--qd-kpi-size\)/);
  assert.throws(() => composeSimulator({ ...original, recipe: original.recipe.replace('var(--qd-kpi-size)', 'var(--qd-font-size-25)') }), /Unbound standalone CSS variables: --qd-font-size-25/);
  assert.throws(() => composeSimulator({ ...original, components: original.components.replace(/--qd-kpi-size:\s*36px;/, '') }), /--qd-kpi-size/);
});
