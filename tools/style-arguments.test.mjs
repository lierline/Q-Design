import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { scanArguments, cssProperties, parameterFamily } from './style-arguments-core.mjs';
const req = createRequire(new URL('../../Q-Atelier/package.json', import.meta.url));
const ts = req('typescript'), postcss = createRequire(new URL('../../Q-Works/package.json', import.meta.url))('postcss');
const options = { ts, postcss, properties: cssProperties(ts, readFileSync(join(dirname(req.resolve('typescript')), 'lib.dom.d.ts'), 'utf8')) };

test('itemStyle renderer adapters retain a complete independently reviewed style argument',()=>{
  const code='const value=<Choice itemStyle={{justifyContent:"space-between",width:"100%"}}/>;';
  const records=scanArguments('item.tsx',code,options);
  const entire=records.find(record=>record.kind==='style-expression'&&record.property==='itemStyle');
  assert.ok(entire);assert.equal(entire.value,'{{justifyContent:"space-between",width:"100%"}}');
  assert.ok(records.some(record=>record.kind==='object-property'&&record.property==='width'));
});
test('discovers native, object, variable, spread, embedded and SVG arguments', () => {
  const code = 'const s={color:"red",fontSize:12,...custom}; const css=`.a{padding:4px;color:${color};}`; function A(){return <svg viewBox="0 0 20 20" fill="currentColor" style={s} className={cn("p-4", active && "text-red-500")}/>;}';
  const result = scanArguments('a.tsx', code, options);
  for (const kind of ['object-property', 'object-spread', 'css-declaration', 'dynamic-style', 'presentation-attribute', 'svg-geometry', 'style-expression', 'class-expression', 'style-call']) assert.ok(result.some(r => r.kind === kind), kind);
});
test('malformed embedded CSS remains an explicit unresolved finding', () => {
  const result = scanArguments('a.css', '.a{color:red;', options);
  assert.equal(result[0].kind, 'parse-error'); assert.equal(result[0].status, 'review-required');
});
test('central ownership and semantic references are different evidence', () => {
  assert.equal(scanArguments('x.css', '.a{color:var(--qd-text)}', options)[0].status, 'token-reference');
  assert.equal(scanArguments('x.css', '.a{color:red}', { ...options, owner: 'patterns/example.css' })[0].status, 'central-source');
  assert.equal(scanArguments('x.css', '.a{color:red}', options)[0].status, 'review-required');
});
test('standalone offline HTML retains style and presentation evidence', () => {
  const records = scanArguments('public/offline.html', '<style>body{background:#fff}</style><div style="padding:12px" class="offline">Text</div>', options);
  assert.ok(records.some(r => r.property === 'padding'));
  assert.ok(records.some(r => r.property === 'background'));
  assert.ok(records.some(r => r.kind === 'class-utility'));
});
test('imperative canvas and DOM style mutations stay unresolved', () => {
  const records = scanArguments('a.ts', 'el.style.width = width + "px"; ctx.fillStyle = color; el.style.setProperty("--x", x);', options);
  assert.equal(records.filter(r => r.kind === 'dynamic-style').length, 2);
  assert.ok(records.some(r => r.kind === 'style-call'));
});
test('property families include typography, motion and layers', () => {
  assert.equal(parameterFamily('lineHeight'), 'typography');
  assert.equal(parameterFamily('transitionDuration'), 'motion-transform');
  assert.equal(parameterFamily('zIndex'), 'position-layer');
});

test('a token utility cannot hide an unrelated literal in the same class list', () => {
  for (const source of ['<div className="text-[var(--qd-text)] rounded-[37px]"/>', '<div className={cn("text-[var(--qd-text)] rounded-[37px]", active && "h-[39px]")}/>']) {
    const records = scanArguments('a.tsx', source, options);
    assert.ok(records.some(r => r.kind === 'class-utility' && r.value === 'text-[var(--qd-text)]' && r.status === 'token-reference'));
    assert.ok(records.some(r => r.kind === 'class-utility' && r.value === 'rounded-[37px]' && r.status === 'review-required'));
  }
});

test('SVG typography and React vendor-prefixed styles are retained', () => {
  const records = scanArguments('a.tsx', '<text fontSize="12" fontFamily="serif" textAnchor="middle" style={{WebkitLineClamp:2}}/>', options);
  for (const property of ['fontSize', 'fontFamily', 'textAnchor', 'WebkitLineClamp']) assert.ok(records.some(r => r.property === property), property);
  const html = scanArguments('public/example.html', '<svg><text font-size="12" text-anchor="middle">X</text></svg>', options);
  assert.ok(html.some(r => r.property === 'font-size'));
  assert.ok(html.some(r => r.property === 'text-anchor'));
});

test('style-like defaults and named values remain visible even through identifiers', () => {
  const records = scanArguments('a.tsx', 'function Track({height=6, size=20}) { const opacity=.5; return <div style={{height,opacity}}/>; }', options);
  for (const [property,value] of [['height','6'],['size','20'],['opacity','.5']]) {
    assert.ok(records.some(r => r.kind === 'named-style-value' && r.property === property && r.value === value));
  }
});

test('HTML email templates expose style islands and interpolation without parsing markup as CSS', () => {
  const source = 'const email = `<h2 style="padding:12px;color:${ink}">${title}</h2><style>.card{border-radius:10px}</style>`;';
  const records = scanArguments('email.ts', source, options);
  assert.equal(records.filter(r => r.kind === 'parse-error').length, 0);
  assert.ok(records.some(r => r.kind === 'css-declaration' && r.property === 'padding' && r.value === '12px'));
  assert.ok(records.some(r => r.kind === 'css-declaration' && r.property === 'border-radius' && r.value === '10px'));
  for (const value of ['ink','title']) assert.ok(records.some(r => r.kind === 'dynamic-style' && r.value === value && r.status === 'review-required'));
});

test('SVG string templates retain coordinate and inline paint evidence', () => {
  const source = 'const svg = `<svg viewBox="0 0 20 20"><path d="M0 0L20 20" style="stroke-width:2;fill:var(--qd-text)"/><animate dur="${duration}s"/></svg>`;';
  const records = scanArguments('ribbon.ts', source, options);
  assert.equal(records.filter(r => r.kind === 'parse-error').length, 0);
  assert.ok(records.some(r => r.kind === 'asset' && r.property === 'viewBox'));
  assert.ok(records.some(r => r.property === 'stroke-width' && r.value === '2'));
  assert.ok(records.some(r => r.kind === 'dynamic-style' && r.value === 'duration'));
});

test('SVG SMIL timing, gradient and filter parameters cannot disappear outside CSS', () => {
  const source = '<svg><defs><filter filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="10"/></filter><radialGradient gradientTransform="translate(4 8) scale(20 10)"/></defs><path pathLength="100"><animate attributeName="d" dur="1.7s" keyTimes="0;.5;1" keySplines=".2 0 .8 1;.2 0 .8 1" values="M0 0;M1 1;M0 0"/></path></svg>';
  for (const [file,code] of [['shape.svg',source],['shape.ts','const vector=`'+source+'`;'],['shape.tsx','const Vector=()=>('+source+');']]) {
    const records=scanArguments(file,code,options);
    for(const property of ['filterUnits','stdDeviation','gradientTransform','pathLength','dur','keyTimes','keySplines','values']) assert.ok(records.some(r=>r.property===property),`${file} ${property}`);
  }
});

test('SVG-only motion vocabulary does not turn form bounds or component data into presentation', () => {
  for (const [file,code] of [
    ['mixed.tsx','const A=()=> <><input min="0" max="100"/><BusinessTable values={rows} from={start}/><svg><animate min="1s" max="3s" values="0;1"/></svg></>;'],
    ['mixed.html','<input min="0" max="100"><svg><animate min="1s" max="3s" values="0;1"/></svg>'],
  ]) {
    const records=scanArguments(file,code,options);
    assert.equal(records.filter(r=>r.property==='min').length,1,file);
    assert.equal(records.filter(r=>r.property==='max').length,1,file);
    assert.equal(records.filter(r=>r.property==='values').length,1,file);
    assert.equal(records.filter(r=>r.property==='from').length,0,file);
    assert.ok(records.some(r=>r.property==='min' && r.value.includes('1s')),file);
  }
});

test('theme boot scripts remain runtime evidence instead of false CSS failures', () => {
  const source = 'const THEME_INIT_SCRIPT = `(function(){var dark=mode==="dark"?true:false;document.documentElement.classList.toggle("dark",dark);})();`;';
  const records = scanArguments('theme.ts', source, options);
  assert.equal(records.filter(r => r.kind === 'parse-error' || r.kind === 'css-declaration').length, 0);
  assert.ok(records.some(r => r.property === 'embedded-script' && r.status === 'review-required'));
  const concatenated = scanArguments('theme.ts', 'const THEME_BOOT = `(function(){` + `document.documentElement.dataset.theme="dark";` + `})();`;', options);
  assert.equal(concatenated.filter(r => r.property === 'embedded-script').length, 3);
  assert.ok(concatenated.some(r => r.value.includes('dataset.theme')));
});

test('HTML raw script text and comments do not create fictitious style attributes', () => {
  const source = '<!-- <div style="color:red"> --><script>const x=\'<div style="color:blue">\';</script>\n<div style="padding:8px">ok</div>';
  const records = scanArguments('offline.html', source, options);
  assert.equal(records.filter(r => r.kind === 'css-declaration' && r.property === 'color').length, 0);
  assert.equal(records.find(r => r.property === 'padding').line, 2);
  assert.ok(records.some(r => r.property === 'embedded-script'));
});

test('dynamic complete CSS fragments remain unknown while static neighboring rules still parse', () => {
  const source = 'const css = `${base}\n.a{width:${wide ? "297mm" : "210mm"};padding:15mm;}\n${extra}\n.b{color:black}`;';
  const records = scanArguments('print.tsx', source, { ...options, owner:'patterns/print.tsx' });
  assert.equal(records.filter(r => r.kind === 'parse-error').length, 0);
  assert.ok(records.some(r => r.property === 'padding' && r.value === '15mm' && r.line === 2));
  assert.ok(records.some(r => r.property === 'color' && r.value === 'black' && r.line === 4));
  for (const value of ['base','extra']) assert.ok(records.some(r => r.kind === 'dynamic-style' && r.value === value && r.status === 'review-required'));
});

test('embedded CSS and HTML keep exact source lines after long expressions and JS escapes', () => {
  const source = 'const css=`\n.a{width:${calculateAReallyLongWidthExpressionWithManyArguments(a,b,c,d,e,f)};}\n.b{color:red;}\n.c{padding:8px;}\n`;';
  const records = scanArguments('a.ts', source, options);
  assert.equal(records.find(r=>r.property==='width').line,2);
  assert.equal(records.find(r=>r.property==='color').line,3);
  assert.equal(records.find(r=>r.property==='padding').line,4);
  const html = 'const mail = `<div style="color:${computeLongBrandColorForCompanyAndTheme(company, theme)}">${body}</div>\n<div style="padding:12px">next</div>`;';
  assert.equal(scanArguments('a.ts',html,options).find(r=>r.property==='padding').line,2);
  const escaped = String.raw`const css = ".a{content:'\u0061';color:red;}\n.b{padding:12px}";`;
  assert.equal(scanArguments('a.ts',escaped,options).find(r=>r.property==='padding').line,1);
  const continuation = 'const css=".a{color:red;}\\\n.b{padding:12px}";';
  assert.equal(scanArguments('a.ts',continuation,options).find(r=>r.property==='padding').line,2);
});

test('custom component size and unit-bearing appearance props retain their exact source lines',()=>{
  const code='const A=()=> <>\n<BrandLogo size={108}/>\n<CompanyMark maxHeightMm={16} fontSizePt={11}/>\n<Panel labelLineHeightRem={1.4} animationDurationMs={160}/>\n</>;';
  const records=scanArguments('size.tsx',code,options);
  for(const [property,line,value]of [['size',2,'{108}'],['maxHeightMm',3,'{16}'],['fontSizePt',3,'{11}'],['labelLineHeightRem',4,'{1.4}'],['animationDurationMs',4,'{160}']]){
    const record=records.find(r=>r.property===property);
    assert.equal(record?.kind,'presentation-attribute');assert.equal(record.line,line);assert.equal(record.value,value);assert.equal(record.status,'review-required');
  }
});
test('unit-bearing defaults and style maps are candidates, while byte/count data is not guessed as a visual unit',()=>{
  const code='function A({maxHeightMm=16,fileSizeBytes=4096}){const options={badgeRadiusPx:4,recordCount:20};return <Panel fileSizeBytes={4096} pageSize={20}/>;}';
  const records=scanArguments('size.tsx',code,options);
  assert.ok(records.some(r=>r.kind==='named-style-value'&&r.property==='maxHeightMm'&&r.value==='16'));
  assert.ok(records.some(r=>r.kind==='object-property'&&r.property==='badgeRadiusPx'&&r.value==='4'));
  assert.ok(!records.some(r=>['fileSizeBytes','recordCount','pageSize'].includes(r.property)));
});

test('actual renderer color props and defaults remain exact review candidates without swallowing unrelated data props',()=>{
  const code='function A({accent=palette.warning,accountColorCode="red"}){const look={badgeColor:palette.gold};return <>\n<Checkbox accent={palette.warning}/>\n<Row badgeColor={palette.gold} trackColor={palette.track} connectorColor={palette.line}/>\n<Card chipColor={palette.chip} iconColor={palette.icon} dotColor={palette.dot} accountColorCode={record.code} accentLabel={record.label}/></>;}';
  const records=scanArguments('colors.tsx',code,options);
  for(const [property,line] of [['accent',2],['badgeColor',3],['trackColor',3],['connectorColor',3],['chipColor',4],['iconColor',4],['dotColor',4]]){
    const record=records.find(r=>r.kind==='presentation-attribute'&&r.property===property);
    assert.ok(record,property);assert.equal(record.line,line);assert.equal(record.status,'review-required');
  }
  assert.ok(records.some(r=>r.kind==='named-style-value'&&r.property==='accent'&&r.value==='palette.warning'));
  assert.ok(records.some(r=>r.kind==='object-property'&&r.property==='badgeColor'&&r.value==='palette.gold'));
  assert.ok(!records.some(r=>['accountColorCode','accentLabel'].includes(r.property)));
});

test('typeof function string is not an embedded script while executable function templates remain inventoried',()=>{
  const code="const active=typeof callback==='function';const boot=`(function(){document.body.style.color='red';})();`;const other='function named(){return 1;}';";
  const scripts=scanArguments('a.ts',code,options).filter(row=>row.property==='embedded-script');
  assert.equal(scripts.length,2);assert.ok(scripts.every(row=>row.value!=='function'));
});

test('explicit CSS color builder returns remain candidates without a CSS-named binding',()=>{
  const code='function battery(percent){const hue=percent*125;return `hsl(${hue},62%,52%)`;}\nconst tint=()=>"rgb(1 2 3 / .5)";\nfunction data(){return "hsl measurement";}\nconst html=()=>"<div>red</div>";';
  const records=scanArguments('paint.ts',code,options).filter(row=>row.kind==='paint-return');
  assert.equal(records.length,2);
  assert.equal(records[0].line,1);assert.equal(records[1].line,2);
  assert.ok(records.every(row=>row.property==='color'&&row.status==='review-required'));
  assert.ok(records[0].value.includes('62%,52%'));
  assert.equal(scanArguments('paint.ts','function paint(){return `hsl(${h},var(--qd-s),var(--qd-l))`;}',options).find(row=>row.kind==='paint-return').status,'token-reference');
});

test('actual compact dimension and grid props are inventoried without assuming their consumer meaning',()=>{
 const records=scanArguments('compact.tsx','function A({w=20,h=12,radius=4,minCol=220,cols=3}){return <><Skeleton w={w} h={h} radius={radius}/><Grid minCol={minCol} cols={cols}/><Data shadow={20} whole={4}/></>;}',options);
 for(const name of ['w','h','radius','minCol','cols']){
  assert.ok(records.some(row=>row.kind==='named-style-value'&&row.property===name),name+' default');
  assert.ok(records.some(row=>row.kind==='presentation-attribute'&&row.property===name),name+' caller');
 }
 assert.ok(!records.some(row=>['shadow','whole'].includes(row.property)));
});
