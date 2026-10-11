import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { canonicalPatternPaths, colorSet, committedCssGraph, parseCoverageArgs } from './audit-coverage-imports.mjs';

function fixture(files) {
  const calls = [];
  return { calls, read: (_repo, path) => { calls.push(path); return files[path] ?? null; } };
}

test('committed local CSS imports include nested color definitions and read cycles only once', () => {
  const { calls, read } = fixture({
    'app/globals.css': '@import "./palette.css"; @import url(./nested/theme.css) screen;',
    'app/palette.css': '@import "./globals.css"; :root { --color: #123456; }',
    'app/nested/theme.css': '@import url("../palette.css") layer(theme); .dark { --color: #abcdef; }',
  });
  const graph = committedCssGraph('repo', ['app/globals.css', 'app/palette.css'], read);
  assert.deepEqual([...graph.keys()], ['app/globals.css', 'app/palette.css', 'app/nested/theme.css']);
  assert.equal(calls.length, 3);
  assert.match([...graph.values()].join('\n'), /--color: #123456/);
  assert.match([...graph.values()].join('\n'), /--color: #abcdef/);
});

test('comments, remote URLs and package imports never become local reads', () => {
  const { calls, read } = fixture({
    'app/globals.css': `/* @import './missing.css'; */
      @import "tailwindcss";
      @import "@scope/package";
      @import url("https://example.test/theme.css");
      @import '//example.test/other.css';
      @import 'data:text/css,body{}';
      :root { --example: "@import './also-missing.css';"; }`,
  });
  committedCssGraph('repo', ['app/globals.css'], read);
  assert.deepEqual(calls, ['app/globals.css']);
});

test('traversal, absolute paths and encoded escapes fail before reading outside the repository', () => {
  for (const path of ['../../outside.css', '%2e%2e/%2e%2e/outside.css', '/outside.css', '%2foutside.css', 'file:///outside.css', 'C:/outside.css', '..\\outside.css', '..%5coutside.css']) {
    const { calls, read } = fixture({ 'app/globals.css': `@import '${path}';` });
    assert.throws(() => committedCssGraph('repo', ['app/globals.css'], read), /escapes repository|Unsafe CSS import/);
    assert.deepEqual(calls, ['app/globals.css']);
  }
  assert.throws(() => committedCssGraph('repo', ['../outside.css'], () => assert.fail('Must not read')), /escapes repository/);
});

test('missing nested imports and invalid import syntax fail instead of yielding partial coverage', () => {
  const { read } = fixture({ 'app/globals.css': '@import "./missing.css";' });
  assert.throws(() => committedCssGraph('repo', ['app/globals.css'], read), /Missing committed CSS app\/missing.css \(imported from app\/globals.css\)/);
  assert.throws(() => committedCssGraph('repo', ['app/globals.css'], () => '@import var(--runtime-path);'), /Unsupported CSS import/);
  assert.throws(() => committedCssGraph('repo', ['app/globals.css'], () => '@import "";'), /Empty CSS import/);
});

test('each audit observes changed definitions and newly missing imports without a stale visited cache', () => {
  const files = { 'app/globals.css': '@import "./palette.css";', 'app/palette.css': ':root { --color: #123456; }' };
  const { read } = fixture(files);
  const before = committedCssGraph('repo', ['app/globals.css'], read);
  files['app/palette.css'] = ':root { --color: #654321; }';
  const after = committedCssGraph('repo', ['app/globals.css'], read);
  assert.notEqual(before.get('app/palette.css'), after.get('app/palette.css'));
  files['app/globals.css'] += '@import "./not-committed.css";';
  assert.throws(() => committedCssGraph('repo', ['app/globals.css'], read), /Missing committed CSS app\/not-committed.css/);
});

test('real git HEAD imports ignore working-tree edits and require imported files to be committed', t => {
  // Workspace temp avoids Windows sandbox TEMP metadata restrictions on Git.
  const taskRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const repo = mkdtempSync(join(taskRoot, '.tmp-css-head-'));
  t.after(() => {
    const target = resolve(repo);
    const within = relative(taskRoot, target);
    assert.ok(within && !within.startsWith('..') && !isAbsolute(within) && within.startsWith('.tmp-css-head-'));
    rmSync(target, { recursive: true, force: true });
  });
  function git(...args) {
    const result = spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  }
  const save = (path, text) => writeFileSync(join(repo, path), text);
  git('init', '--quiet');
  mkdirSync(join(repo, 'app'));
  save('app/globals.css', '@import "./palette.css";');
  save('app/palette.css', ':root { --color: #123456; }');
  git('add', 'app');
  git('-c', 'user.name=CSS audit test', '-c', 'user.email=css-audit@example.invalid', 'commit', '--quiet', '-m', 'CSS fixture');
  save('app/palette.css', ':root { --color: #654321; }');
  assert.match(committedCssGraph(repo, ['app/globals.css']).get('app/palette.css'), /#123456/);
  save('app/globals.css', '@import "./working-tree-only.css";');
  save('app/working-tree-only.css', ':root { --color: #abcdef; }');
  git('add', 'app/globals.css');
  git('-c', 'user.name=CSS audit test', '-c', 'user.email=css-audit@example.invalid', 'commit', '--quiet', '-m', 'Missing committed import');
  assert.throws(() => committedCssGraph(repo, ['app/globals.css']), /Cannot read committed CSS app\/working-tree-only.css/);
});

test('scope parsing preserves the unscoped audit and accepts the three current sync targets', () => {
  assert.equal(parseCoverageArgs([]).only, null);
  const parsed = parseCoverageArgs(['--only=Q-Atelier,Q-Works,Q-Forge', 'D:/fixture/Atelier']);
  assert.equal(parsed.source, 'D:/fixture/Atelier');
  assert.deepEqual([...parsed.only], ['Q-Atelier', 'Q-Works', 'Q-Forge']);
  assert.equal(parsed.only.has('Q-Sonar'), false);
  assert.equal(parseCoverageArgs(['--only=Q-Sonar']).only.has('Q-Sonar'), true);
});

test('empty, mistyped, duplicate and unsupported scope arguments fail', () => {
  for (const args of [['--only='], ['--only=Q-Ateler'], ['--only=Q-Atelier,'], ['--only=Q-Works,Q-Works'], ['--only=Q-Works', '--only=Q-Forge'], ['--unknown'], ['a', 'b']]) {
    assert.throws(() => parseCoverageArgs(args));
  }
});

test('color baseline admits only exact outgoing patterns and still detects an unknown product color', () => {
  const paths = canonicalPatternPaths([
    { src: 'patterns/components.css', to: { Atelier: 'app/copy.css' } },
    { src: 'patterns/components.css', to: { Maison: 'app/copy.css' } },
    { src: 'source/css/globals.css', to: { Atelier: 'app/globals.css' } },
    { src: 'patterns/../source/css/mirror.css', to: { Atelier: 'app/mirror.css' } },
    { src: 'patterns/unpublished.css', to: {} },
  ]);
  assert.deepEqual(paths, ['patterns/components.css']);
  const files = { 'patterns/components.css': ':root { --qd-info: var(--qa-blue, #3d5f8a); }', 'source/css/globals.css': ':root { --unextracted: #010203; }' };
  const baseline = colorSet([':root { --color: #fff; }', ...paths.map(path => files[path])]);
  const productColors = colorSet(['#ffffff #3d5f8a #010203']);
  assert.deepEqual([...productColors].filter(color => !baseline.has(color)), ['#010203']);
  assert.throws(() => canonicalPatternPaths([{ src: '../outside.css', to: { Atelier: 'x' } }]), /escapes repository/);
});
