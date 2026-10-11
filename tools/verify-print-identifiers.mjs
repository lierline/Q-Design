import fs from 'node:fs';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const require=createRequire(new URL('../../Q-Works/package.json',import.meta.url));
const ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const source=fs.readFileSync(new URL('patterns/foundation/maison-print-styles.tsx',root),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const exports={};
new Function('require','exports',compiled)(require,exports);
const styles=renderToStaticMarkup(React.createElement(exports.PrintStyles,{pageBreak:false,orientation:'landscape'}));
const consumer=fs.readFileSync(new URL('../../Q-Works/app/(app)/traceability/print/page.tsx',import.meta.url),'utf8');
assert.match(consumer,/<td className="wrap">\s*\{r\.code\}/);
const {chromium}=createRequire(new URL('../../Q-Atelier/package.json',import.meta.url))('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true}),cases=[];
try{
 for(const paperWidth of [950,1123])for(const fontSize of [12,24]){
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const codes=['RM-SUS304-40-EX','FG-SH3-900-EX (옛 체계)','IDENTIFIERWITHOUTBREAKPOINT'.repeat(3)];
  await page.setContent(`${styles}<style>.print-paper{width:${paperWidth}px}td{font-size:${fontSize}px}</style><article class="print-paper"><table class="form-table"><colgroup>${[12,22,14,16,10,10,10,6].map(w=>`<col style="width:${w}%">`).join('')}</colgroup><tbody>${codes.map(code=>`<tr><td class="wrap">${code}</td><td class="wrap">스테인리스 선재, 완제품 이름</td>${Array.from({length:6},()=>'<td class="wrap">표 설명</td>').join('')}</tr>`).join('')}</tbody></table></article>`);
  const measure=()=>page.locator('td:first-child').evaluateAll(cells=>cells.map(cell=>({text:cell.textContent,width:cell.clientWidth,scrollWidth:cell.scrollWidth,whiteSpace:getComputedStyle(cell).whiteSpace,overflowWrap:getComputedStyle(cell).overflowWrap})));
  const after=await measure();
  assert(after.every(cell=>cell.scrollWidth<=cell.width+1),'identifier crosses its own column');
  await page.locator('td:first-child').evaluateAll(cells=>cells.forEach(cell=>cell.className='nowrap'));
  const before=await measure();
  assert(before.some(cell=>cell.scrollWidth>cell.width+1),'fixture must reproduce original nowrap overflow');
  cases.push({paperWidth,fontSize,before,after});
  await page.close();
 }
}finally{await browser.close();}
fs.writeFileSync(new URL('reviews/print-identifier-browser-results.json',root),JSON.stringify({scope:'Central PrintStyles and exact traceability consumer class, synthetic long codes at desktop and landscape paper widths. Not a production data or PDF pagination certificate.',cases},null,2)+'\n');
console.log(JSON.stringify({cases:cases.length,passed:true}));
