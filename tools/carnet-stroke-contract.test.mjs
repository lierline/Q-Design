import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const tw = createRequire('D:/Claude/DHR/package.json')('tailwindcss');
const postcss = createRequire('D:/Claude/Q-Works/package.json')('postcss');
const source = fs.readFileSync(new URL('../patterns/foundation/carnet-theme.css', import.meta.url), 'utf8');
const design = await tw.__unstable__loadDesignSystem(source);
function values(candidate, property) {
  const css = design.candidatesToCss([candidate])[0];
  assert.ok(css, `${candidate} compiles`);
  const found = [];
  postcss.parse(css).walkDecls(property, (d) => { if (d.parent.type === 'rule') found.push(d.value); });
  return found;
}
test('actual Tailwind border cascade ends in canonical width aliases, including responsive and file variants', () => {
  for (const [candidate, property, token] of [
    ['border','border-width','--qd-border-width'], ['border-2','border-width','--qd-border-width-2'],
    ['border-b','border-bottom-width','--qd-border-width'], ['border-b-2','border-bottom-width','--qd-border-width-2'],
    ['border-l','border-left-width','--qd-border-width'], ['border-y','border-block-width','--qd-border-width'],
    ['md:border-2','border-width','--qd-border-width-2'], ['file:border','border-width','--qd-border-width'],
  ]) assert.ok(values(candidate,property).at(-1).includes(`var(${token},`), candidate);
});
test('ring width aliases preserve Tailwind shadow/color/offset composition', () => {
  for (const n of [1,2,4]) {
    const value = values(`ring-${n}`, '--tw-ring-shadow').at(-1);
    assert.ok(value.includes(`var(--qd-ring-width-${n}, ${n}px)`));
    assert.ok(value.includes('var(--tw-ring-offset-width)'));
    assert.ok(value.includes('var(--tw-ring-color, currentcolor)'));
    assert.ok(values(`ring-${n}`, 'box-shadow').at(-1).includes('var(--tw-ring-shadow)'));
  }
});
test('divider width follows the common stroke without changing reverse-direction semantics', () => {
  for (const property of ['border-top-width','border-bottom-width']) {
    const value = values('divide-y',property).at(-1);
    assert.ok(value.includes('var(--qd-border-width, 1px)'));
    assert.ok(value.includes('var(--tw-divide-y-reverse)'));
  }
});
test('zero border is still removal and token fallback defaults preserve existing stroke sizes', () => {
  assert.equal(values('border-0','border-width').at(-1),'0px');
  assert.equal(values('border-t-0','border-top-width').at(-1),'0px');
  assert.equal(values('border','border-width').at(-1),'var(--qd-border-width, 1px)');
  assert.equal(values('border-2','border-width').at(-1),'var(--qd-border-width-2, 2px)');
});
test('hairline, focus and underline primitives also retain live aliases', () => {
  for(const [candidate,property,token] of [
    ['w-px','width','--qd-hairline-width'],['gap-px','gap','--qd-hairline-width'],
    ['mt-px','margin-top','--qd-hairline-width'],['pb-px','padding-bottom','--qd-hairline-width'],
    ['underline-offset-4','text-underline-offset','--qd-underline-offset'],
    ['focus-visible:outline-2','outline-width','--qd-focus-outline-width'],
  ]) assert.ok(values(candidate,property).at(-1).includes(`var(${token},`),candidate);
  assert.ok(values('sm:divide-x','border-inline-end-width').at(-1).includes('var(--qd-border-width, 1px)'));
});
