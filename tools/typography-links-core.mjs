import assert from 'node:assert/strict';

export function inspectGlobalTypographyLayer(css,postcss){
  const expected=[
    ['html .qd-workspace,\nhtml .qd-workspace[data-product]','--qd-font-ui','var(--qd-font-family-ui)',null],
    ['html .qd-workspace,\nhtml .qd-workspace[data-product]','--qd-font-mono','var(--qd-font-family-mono)',null],
    ['html .qa-sec-t::before,\nhtml .qa-mag-divider-label','font-family','var(--qd-font-family-mono)',null],
    ['html .qa-mag-divider-num,\nhtml .qa-mag-divider-title,\nhtml .qa-skip-link:focus','font-family','var(--qd-font-family-ui)',null],
    ['html body::after','font-family','var(--qd-font-family-mono)','print'],
  ];
  const rows=[],ast=postcss.parse(css);
  ast.walkAtRules(at=>assert(at.name==='media'&&at.params==='print','Only the print role can have an at-rule'));
  ast.walkDecls(decl=>{assert(!decl.important);assert.equal(decl.parent.type,'rule');rows.push([decl.parent.selector,decl.prop,decl.value,decl.parent.parent.type==='atrule'?decl.parent.parent.params:null]);});
  assert.deepEqual(rows,expected,'Every authored font selection must be exactly one declared central UI or mono role');
  const rules=[];ast.walkRules(rule=>rules.push(rule));assert.equal(rules.length,4);
  return rows;
}

export function validateTypographyLinks(shared,links,postcss){
  inspectGlobalTypographyLayer(links,postcss);
  const families=new Set();
  postcss.parse(shared).walkDecls(decl=>{
    if(['--qd-font-family-ui','--qd-font-family-mono'].includes(decl.prop)&&decl.value.trim())families.add(decl.prop);
  });
  assert.deepEqual([...families].sort(),['--qd-font-family-mono','--qd-font-family-ui'],'Both actual shared family definitions are required');
}
