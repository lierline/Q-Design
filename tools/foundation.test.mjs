import test from 'node:test';
import assert from 'node:assert/strict';
import { composeFoundation, validateSharedAliases, offlineRevision } from './build-foundation.mjs';
test('product scope follows shared defaults and preserves print/media order', () => {
  const recipe = '@media print{body{font-size:10pt}}\n.auth{padding:var(--qd-auth-pad)}';
  const css = composeFoundation(':root{--qd-auth-pad:24px}', recipe, 'atelier');
  assert.ok(css.indexOf(':root') < css.indexOf('@media print'));
  assert.ok(css.endsWith(recipe + '\n'));
});
test('rejects invalid CSS and accidental nested imports', () => {
  assert.throws(() => composeFoundation(':root{', '', 'maison'));
  assert.throws(() => composeFoundation(':root{--qd-a:1}', '@import "local.css";', 'maison'), /imports/);
});
test('rejects missing token aliases instead of silent CSS invalidation', () => {
  assert.throws(() => validateSharedAliases(':root{--qd-a:var(--qd-missing)}', ''), /Undefined/);
  assert.doesNotThrow(() => validateSharedAliases(':root{--qd-a:var(--qd-optional, 4px)}', ''));
});
test('rejects font and spacing cycles', () => {
  assert.throws(() => validateSharedAliases(':root{--qd-a:var(--qd-b);--qd-b:var(--qd-a)}', ''), /cycle/);
});
test('central component aliases resolve without duplicating values', () => {
  assert.doesNotThrow(() => validateSharedAliases(':root{--qd-auth-background:var(--qd-bg)}', ':root{--qd-bg:#fff}'));
});

test('offline cache revision follows content changes and ignores platform line endings', () => {
  const before = '<style>:root{--qd-radius:10px}</style>\n<h1>Offline</h1>\n';
  assert.notEqual(offlineRevision(before), offlineRevision(before.replace('10px', '14px')));
  assert.equal(offlineRevision(before), offlineRevision(before.replaceAll('\n', '\r\n')));
  assert.match(offlineRevision(before), /self\.QD_OFFLINE_CACHE = 'q-offline-[a-f0-9]{16}';/);
});
