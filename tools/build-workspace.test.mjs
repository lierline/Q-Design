// 업무 조작 대상(dist/q-design.workspace.css) 시험. 2026-10-16(군살 빼기 4단계)에 새로 짰습니다.
// 옛 시험(workspace-targets.test.mjs)은 제품 스타일 장부(reviews/)를 읽었고 1단계에서 장부와 함께 빠졌습니다.
// 이 시험은 Q-Design 파일만 읽습니다. 제품 사본이 같은지는 sync.mjs(검사의 사본 대조)가 봅니다.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { composeWorkspace, buildWorkspace } from './build-workspace.mjs';
import { pageShellCss, readPageShellCss } from './page-shell-css.mjs';

const root = path.resolve(import.meta.dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('compose joins the two canon files with LF, one blank line and one trailing newline', () => {
  assert.equal(composeWorkspace('a\r\n\r\n', 'b\r\n'), 'a\n\nb\n');
  assert.equal(composeWorkspace('a', 'b'), 'a\n\nb\n');
});

test('stored output is the composition of the canon, the text-action targets and the page shell', () => {
  const output = buildWorkspace({ check: true });
  assert.equal(output, composeWorkspace(read('patterns/workspace.css'), read('patterns/action-targets.css'), readPageShellCss(root)));
  assert.ok(output.includes(read('patterns/action-targets.css').replaceAll('\r\n', '\n').trimEnd()));
  assert.ok(output.trimEnd().endsWith(readPageShellCss(root).trimEnd()));
});

test('page shell: detail and form screens are not narrowed and the field grid keeps the field width (2026-10-27 «3»)', () => {
  const css = readPageShellCss(root);
  assert.doesNotMatch(css, /\.qd-shell-page\s*\{[^}]*max-width/);
  assert.match(css, /\.qd-fields\s*\{[^}]*repeat\(auto-fill, minmax\(min\(100%, 300px\), 1fr\)\)/);
  // 긴 칸은 줄 끝까지. 몇 칸이 드는 폭이든 옆에 빈 칸이 남지 않고, 한 칸뿐인 폰에서도 넘치지 않는다
  assert.match(css, /\.qd-fields > \.qd-field-wide \{ grid-column: 1 \/ -1; \}/);
  assert.doesNotMatch(css, /span 2/);
  // 이어 놓은 칸 묶음 사이는 묶음 모음 상자 하나가 정본 값으로 쥔다(놓인 상자의 간격을 따라 갈리지 않게)
  assert.match(css, /\.qd-field-groups \{ display: flex; flex-direction: column; gap: 24px; min-width: 0; \}/);
  assert.doesNotMatch(css, /\.qd-fields \+ \.qd-fields|--qd-stack-gap/);
  const runtime = { LAYOUT: { mobile: 520 }, QDRuntime: { fields: { min: 280, gapX: 10, gapY: 16, groupGap: 20 } } };
  assert.match(pageShellCss(runtime), /minmax\(min\(100%, 280px\), 1fr\)/);
  assert.match(pageShellCss(runtime), /gap: 16px 10px/);
  assert.match(pageShellCss(runtime), /\.qd-field-groups \{[^}]*gap: 20px/);
  assert.throws(() => pageShellCss({ ...runtime, QDRuntime: { fields: { min: 280, gapX: 10, gapY: 16, groupGap: 16 } } }), /묶음 사이/);
  assert.throws(() => pageShellCss({ ...runtime, LAYOUT: { mobile: 520, detail: 820 } }), /좁히지 않습니다/);
  assert.throws(() => pageShellCss({ ...runtime, QDRuntime: { fields: { min: 300, gapX: 12, groupGap: 24 } } }), /gapY/);
});

test('short text actions keep the shared touch target of at least 44px', () => {
  const rule = /\.qd-text-action\s*\{[^}]*min-width:\s*var\((--[\w-]+)\)/.exec(read('patterns/action-targets.css'));
  assert.ok(rule, '.qd-text-action must take its min-width from a shared variable');
  const value = new RegExp(`:root[^{]*\\{[^}]*${rule[1]}:\\s*(\\d+)px`).exec(read('patterns/components.css'));
  assert.ok(value, `${rule[1]} must be defined on :root in patterns/components.css`);
  assert.ok(Number(value[1]) >= 44, `${rule[1]} is ${value[1]}px`);
});

test('check mode fails on a stale output and write mode refreshes it', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'qd-workspace-'));
  try {
    for (const file of ['patterns/workspace.css', 'patterns/action-targets.css', 'dist/q-design.workspace.css', 'source/design/atelier-runtime.ts']) {
      fs.mkdirSync(path.dirname(path.join(base, file)), { recursive: true });
      fs.copyFileSync(path.join(root, file), path.join(base, file));
    }
    assert.doesNotThrow(() => buildWorkspace({ check: true, base }));
    fs.appendFileSync(path.join(base, 'patterns/action-targets.css'), '.qd-text-action { min-width: 1px; }\n');
    assert.throws(() => buildWorkspace({ check: true, base }), /stale/);
    buildWorkspace({ base });
    assert.doesNotThrow(() => buildWorkspace({ check: true, base }));
    assert.match(fs.readFileSync(path.join(base, 'dist/q-design.workspace.css'), 'utf8'), /min-width: 1px/);
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});
