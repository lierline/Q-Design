import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { htmlInterpolationSlots } from './atelier-html-slots.mjs';

const read = url => readFileSync(fileURLToPath(url), 'utf8').replaceAll('\r\n', '\n');
const root = new URL('../', import.meta.url);
const qa = new URL('../../Q-Atelier/', import.meta.url);
const hash = text => createHash('sha256').update(text).digest('hex');
const catalog = JSON.parse(read(new URL('reviews/atelier-html-content-review.json', root)));

test('each reviewed HTML content argument matches its exact current AST slot and evidence', () => {
  assert.equal(catalog.records.length, 140);
  const seen = new Set();
  for (const record of catalog.records) {
    assert.ok(!seen.has(record.argumentHash)); seen.add(record.argumentHash);
    const source = read(new URL(record.path, qa));
    assert.equal(hash(source), record.sourceHash, record.path);
    const matches = htmlInterpolationSlots(source, record.path).filter(slot =>
      slot.line === record.line && slot.value.trim() === record.reviewedExpression.replaceAll('\r\n', '\n').trim());
    assert.equal(matches.length, 1, `${record.path}:${record.line}`);
    assert.deepEqual(matches[0], record.consumerContext);
    assert.ok(['text-or-markup', 'href-attribute'].includes(matches[0].slot));
    assert.equal(record.decision, 'business-content');
    assert.ok(record.escaping && record.reason);
    for (const proof of record.evidence) {
      const evidence = read(new URL(proof.path, qa));
      assert.equal(hash(evidence), proof.hash, proof.path);
      assert.ok(proof.line > 0 && proof.line <= evidence.split('\n').length);
    }
  }
});

test('template context distinguishes text and navigation from style even with earlier attributes', () => {
  const source = 'const html = `<div id="a" style="${css}" title="${title}">${body}<a title="link" href="${href}" style="${linkStyle}">${label}</a></div>`;';
  const slots = htmlInterpolationSlots(source);
  assert.deepEqual(slots.map(slot => [slot.value, slot.slot]), [
    ['css', 'style-attribute'], ['title', 'title-attribute'], ['body', 'text-or-markup'],
    ['href', 'href-attribute'], ['linkStyle', 'style-attribute'], ['label', 'text-or-markup'],
  ]);
  const relocated = htmlInterpolationSlots('const html = `<p style="${body}">text</p>`;')[0];
  assert.equal(relocated.slot, 'style-attribute');
  assert.notEqual(hash(source), hash(source.replace('${body}', '${changed}')));
  assert.equal(htmlInterpolationSlots('const css = `<style>${value}</style>`;')[0].slot, 'style-block');
});

test('CSS recipe call slots remain reported rather than approved as content', () => {
  assert.equal(catalog.reported.length, 4);
  for (const record of catalog.reported) {
    assert.equal(record.decision, 'unknown');
    assert.equal(record.consumerContext.slot, 'style-attribute');
    assert.ok(!catalog.records.some(other => other.argumentHash === record.argumentHash));
    const source = read(new URL(record.path, qa));
    assert.equal(hash(source), record.sourceHash);
    assert.ok(htmlInterpolationSlots(source, record.path).some(slot => slot.line === record.line && slot.value === record.reviewedExpression && slot.slot === 'style-attribute'));
  }
});

test('raw content and composed HTML are not misrepresented as sanitized', () => {
  const rawComment = catalog.records.find(record => record.path.endsWith('/comments/route.ts') && record.reviewedExpression === 'opts.comment');
  assert.equal(rawComment.escaping, 'no local HTML escaping at this interpolation');
  assert.match(rawComment.reason, /not a claim.*injection-safe/);
  const shell = catalog.records.find(record => record.path === 'lib/email.ts' && record.reviewedExpression === 'body');
  assert.match(shell.escaping, /composed HTML/);
  assert.match(shell.reason, /does not exempt descendant style/);
  const escaped = catalog.records.find(record => record.reviewedExpression === 'escapeHtml(opts.notes)');
  assert.equal(escaped.escaping, 'explicit HTML text escaping');
});
