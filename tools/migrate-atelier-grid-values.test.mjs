import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { transformGridValues } from './migrate-atelier-grid-values.mjs';

test('only proven CSS and DataTable column literals migrate, with equivalent defaults', () => {
  const code = `const data={width:'10px', gridTemplateColumns:'business-data'};
const columns: DataTableColumn<Row>[]=[{key:'name',width:'minmax(140px, 1fr)',render:r=>r.name}];
const style: React.CSSProperties={gridTemplateColumns:'1fr 100px'};
export const View=()=> <DataTable columns={[{key:'x',width:'2fr'}]} style={{gridTemplateColumns:wide?'2fr 1fr':'1fr',width:percent+'%'}}/>;`;
  const result = transformGridValues('fixture.tsx', code);
  assert.equal(result.edits.length, 5);
  assert.match(result.output, /const data=\{width:'10px', gridTemplateColumns:'business-data'\}/);
  assert.match(result.output, /width:percent\+'%'/);
  assert.deepEqual([...result.parameters.values()].sort(), ['1fr', '1fr 100px', '2fr', '2fr 1fr', 'minmax(140px, 1fr)'].sort());
  for (const edit of result.edits) assert.equal(result.parameters.get(edit.token), edit.value);
  assert.equal(transformGridValues('fixture.tsx', result.output).edits.length, 0);
});

test('render callback data and template interpolation retain numeric/data behavior', () => {
  const code = "const columns: DataTableColumn<Row>[]=[{width:'1fr',render:r=>({width:'4px'})}];\n"
    + "const View=()=> <div style={{gridTemplateColumns:`repeat(${count},1fr)`,width:enabled?'100%':measured}}/>;";
  const result = transformGridValues('fixture.tsx', code);
  assert.equal(result.edits.length, 2);
  assert.match(result.output, /render:r=>\(\{width:'4px'\}\)/);
  assert.ok(result.output.includes('`repeat(${count},1fr)`'));
  assert.match(result.output, /:measured/);
});

test('every recorded migration reads the central default with identical CSS track semantics', () => {
  const postcss = createRequire('D:/Claude/Q-Atelier/package.json')('postcss');
  const ledger = JSON.parse(readFileSync(new URL('../source/style-adapters/atelier-grid-values.json', import.meta.url), 'utf8'));
  const source = ['atelier-values.css','atelier-core-values.css'].map(file => readFileSync(new URL(`../patterns/foundation/${file}`, import.meta.url), 'utf8')).join('\n');
  const declarations = new Map();
  postcss.parse(source).walkDecls(decl => declarations.set(decl.prop, decl.value));
  assert.ok(ledger.files.length > 0);
  for (const file of ledger.files) {
    const code = readFileSync(`D:/Claude/Q-Atelier/${file.path}`, 'utf8');
    for (const conversion of file.conversions) {
      assert.equal(declarations.get(conversion.token), conversion.value, `${file.path}:${conversion.line}`);
      assert.ok(code.includes(`var(${conversion.token})`), `${file.path} consumes ${conversion.token}`);
    }
  }
});
