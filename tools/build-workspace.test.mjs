// 업무 조작 대상(dist/q-design.workspace.css) 시험. 2026-10-16(군살 빼기 4단계)에 새로 짰습니다.
// 옛 시험(workspace-targets.test.mjs)은 제품 스타일 장부(reviews/)를 읽었고 1단계에서 장부와 함께 빠졌습니다.
// 이 시험은 Q-Design 파일만 읽습니다. 제품 사본이 같은지는 sync.mjs(검사의 사본 대조)가 봅니다.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { composeWorkspace, buildWorkspace } from './build-workspace.mjs';

const root = path.resolve(import.meta.dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('compose joins the two canon files with LF, one blank line and one trailing newline', () => {
  assert.equal(composeWorkspace('a\r\n\r\n', 'b\r\n'), 'a\n\nb\n');
  assert.equal(composeWorkspace('a', 'b'), 'a\n\nb\n');
});

test('stored output is the composition of the canon and ends with the short text-action targets', () => {
  const output = buildWorkspace({ check: true });
  assert.equal(output, composeWorkspace(read('patterns/workspace.css'), read('patterns/action-targets.css')));
  assert.ok(output.trimEnd().endsWith(read('patterns/action-targets.css').replaceAll('\r\n', '\n').trimEnd()));
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
    for (const file of ['patterns/workspace.css', 'patterns/action-targets.css', 'dist/q-design.workspace.css']) {
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
