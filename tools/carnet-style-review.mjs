// Evidence-based disposition of the current Carnet argument ledger.
// Unknowns stay unknown. A changed source hash invalidates the saved review.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { PARTS } from './sync-parts.mjs';
import { centralOutputs, copyProblems } from './audit-coverage-core.mjs';
import { hash, runtimeFiles, cssProperties, scanArguments } from './style-arguments-core.mjs';
import { reviewedScriptBoundary } from './carnet-style-boundaries.mjs';
import { publishCarnetStyleReport } from './carnet-style-report.mjs';
import { verifiedConsumerReview } from './atelier-style-manual.mjs';
const ROOT = 'D:/Claude/Q-Design', PRODUCT = 'D:/Claude/DHR';
const scriptReview = JSON.parse(fs.readFileSync(path.join(ROOT,'reviews/carnet-script-boundaries.json'),'utf8'));
const consumerReviews = new Map(JSON.parse(fs.readFileSync(path.join(ROOT,'reviews/carnet-consumer-review.json'),'utf8')).records.map(row=>[row.argumentHash,row]));
const consumerHashes = new Map();
const consumerHash = file => {
 if(!consumerHashes.has(file)){
  const base=path.resolve(/^(?:patterns|dist)\//.test(file)?ROOT:PRODUCT),target=path.resolve(base,file);
  consumerHashes.set(file,target.startsWith(base+path.sep)&&fs.existsSync(target)?hash(fs.readFileSync(target,'utf8')):null);
 }
 return consumerHashes.get(file);
};
const qa = createRequire('D:/Claude/Q-Atelier/package.json');
const ts = qa('typescript');
const postcss = createRequire('D:/Claude/Q-Works/package.json')('postcss');
const tw = createRequire('D:/Claude/DHR/package.json')('tailwindcss');
const properties = cssProperties(ts, fs.readFileSync(path.join(path.dirname(qa.resolve('typescript')), 'lib.dom.d.ts'), 'utf8'));
const copies = new Map(centralOutputs(PARTS, 'Q-Forge', PRODUCT).map((p) => [p.path,p]));
const cssFiles = ['patterns/foundation.css','patterns/foundation/carnet.css','patterns/foundation/carnet-theme.css',
  'patterns/components.css','dist/q-design.nav.css','dist/q-design.list.css','dist/q-design.screen.css',
  'dist/q-design.workspace.css','dist/q-design.palette.carnet.css'].filter((p) => fs.existsSync(path.join(ROOT,p)));
const variableOwners = new Map(), classOwners = new Map();
for (const file of cssFiles) {
  const code = fs.readFileSync(path.join(ROOT,file),'utf8');
  const ast = postcss.parse(code);
  ast.walkDecls((d) => { if (d.prop.startsWith('--') && !variableOwners.has(d.prop)) variableOwners.set(d.prop,{ path:file,line:d.source.start.line }); });
  ast.walkRules((r) => { for (const m of r.selector.matchAll(/\.([A-Za-z_][\w-]*)/g)) if (!classOwners.has(m[1])) classOwners.set(m[1],{ path:file,line:r.source.start.line }); });
}
const design = await tw.__unstable__loadDesignSystem(fs.readFileSync(path.join(ROOT,'patterns/foundation/carnet-theme.css'),'utf8'));
const themeEvidence = [{path:'patterns/foundation/carnet-theme.css',line:1}];
const utilityCache = new Map();
function utility(value) {
  if (utilityCache.has(value)) return utilityCache.get(value);
  const css = design.candidatesToCss([value])[0];
  if (!css) return null;
  // The final declaration in each rule is authoritative when a central utility
  // intentionally overrides Tailwind's original numeric declaration.
  const final = [];
  postcss.parse(css).walkRules((r) => { const props = new Map(); r.each((d) => { if(d.type==='decl') props.set(d.prop,d.value); }); final.push(...props); });
  const direct = final.filter(([,v])=>/var\(--(?:qd|dhr|color|spacing|text|font|radius|ease|leading|tracking|animate|shadow|drop-shadow|blur|perspective|aspect|container)-?/.test(v));
  const finite = final.filter(([p,v]) => !p.startsWith('--tw-') && !/var\(/.test(v) && /(?:^|\s|\()(?:[1-9]\d*(?:\.\d+)?|0\.\d+)(?:px|rem|em|ms|s)(?:\b|\))/.test(v));
  const result = { cssHash:hash(css), final, direct, finite };
  utilityCache.set(value,result); return result;
}
const decide = (decision,ruleId,reason,evidence=[]) => ({decision,ruleId,reason,evidence});
const runtimeReasons = {
  'app/(admin)/settings/brand/brand-forms.tsx': ['company-brand-preview','Background is the selected company color or computed contrast preview, not a style default.','lib/tone.ts'],
  'components/demo-banner.tsx': ['measured-banner-offset','Rail offset is measured banner height so the current text does not cover navigation.','components/demo-banner.tsx'],
  'components/info-tip.tsx': ['measured-tooltip-placement','Coordinates are measured from the trigger and viewport; insets and gaps read canonical tokens.','lib/tooltip-placement.ts'],
  'components/stat-detail.tsx': ['measured-tooltip-placement','Coordinates are measured from the trigger and viewport; insets and gaps read canonical tokens.','lib/tooltip-placement.ts'],
  'components/print-light.tsx': ['physical-paper-theme','Print presentation temporarily uses the light paper theme, then restores the prior theme and color scheme.','components/print-light.tsx'],
  'components/table.tsx': ['caller-table-column','Width is a caller-supplied column contract. The shared table recipe owns padding, type, strokes and scrolling.','components/table.tsx'],
  'components/ui.tsx': ['data-progress-geometry','Filled width represents a bounded percentage. Track width default is a canonical token.','components/ui.tsx'],
  'lib/css-metrics.ts': ['layout-neutral-css-probe','Hidden zero-size probe resolves length/time units through normal computed CSS; it is always removed.','lib/css-metrics.ts'],
  'lib/modal-focus.ts': ['modal-scroll-lock','Overflow hidden prevents scrolling behind an active modal and restores the previous value on cleanup.','lib/modal-focus.ts'],
  'lib/tooltip-placement.ts': ['measured-tooltip-placement','Pixel coordinates derive from actual bounds, with canonical insets and gaps converted by css-metrics.','lib/tooltip-placement.ts'],
};
const assetFiles = new Set(['components/barcode.tsx','components/ribbon.tsx','components/brand-mark.tsx','components/app-mark.tsx','components/social-links.tsx']);
const reviewedSpreads = {
  'app/(admin)/equipment/equipment-forms.tsx': [363],
  'app/(admin)/settings/audit/entry.tsx': [79], 'app/(admin)/settings/audit/page.tsx': [116],
  'app/(admin)/settings/dmr/dmr-forms.tsx':[184,800], 'app/(admin)/settings/dmr/workbench.tsx':[280],
  'app/(admin)/settings/users/page.tsx':[139], 'app/(admin)/shipping/shipping-forms.tsx':[159,170,324],
  'app/(admin)/trace/[kind]/[id]/page.tsx':[381], 'app/api/daily/route.ts':[60], 'app/api/restore/route.ts':[160],
  'app/manifest.ts':[136], 'app/password/pin-form.tsx':[61],
  'app/print/cover/[id]/page.tsx':[227,242], 'app/print/day-record/[id]/[day]/[worker]/page.tsx':[378],
  'app/print/equipment-log/[id]/page.tsx':[199], 'app/print/label-request/[id]/page.tsx':[134,141],
  'app/print/release-request/[id]/page.tsx':[224], 'app/print/work-order/[id]/page.tsx':[294],
  'lib/link/receive.ts':[177], 'lib/print.ts':[436,450,484,486,543], 'lib/session.ts':[171],
};
const rules = {
  'central-copy': 'Verified PARTS ownership plus copyProblems source/body/fingerprint equivalence.',
  'canonical-variable': 'Every non-internal referenced design variable has a declaration in current central CSS.',
  'central-selector': 'Exact class selector is present in a central authored recipe.',
  'tailwind-live-utility': 'Installed Tailwind compiles the utility to live canonical or centrally bridged primitive variables.',
  'tailwind-structural': 'Compiled rule expresses layout, alignment, visibility, zero removal, or dimensionless fractions; no finite length/time remains.',
  'finite-utility-unresolved': 'A compiled utility retains a finite visual length/time not governed by a variable.',
  'font-resource': 'Font-face metadata describes shipped font binaries; selected UI/mono/brand faces are controlled by central family tokens.',
  'physical-artifact': 'Barcode scanner geometry or approved vector coordinate data, preserved by the Carnet adapter boundary.',
  'business-data': 'AST candidate is used as SQL/result/content/count/pagination/data arithmetic, not a CSS presentation argument.',
  'state-class-expression': 'Expression selects existing classes; finite literal utility fragments are reviewed independently in this report.',
};
const records = [];
const fileHashes = [];
for (const file of runtimeFiles(PRODUCT)) {
  const code = fs.readFileSync(path.join(PRODUCT,file),'utf8'), sourceHash=hash(code), part=copies.get(file);
  fileHashes.push({path:file,hash:sourceHash});
  const canonical = part ? fs.readFileSync(path.join(ROOT,part.src),'utf8') : null;
  const copyVerified = part && copyProblems(part,canonical,code).length===0;
  const iconCanonical = file.startsWith('components/q-design-icons/') ? `dist/react-icons/${path.basename(file)}` : null;
  const iconVerified = iconCanonical && fs.existsSync(path.join(ROOT,iconCanonical)) && hash(fs.readFileSync(path.join(ROOT,iconCanonical),'utf8'))===sourceHash;
  for (const argument of scanArguments(file,code,{ts,postcss,properties,owner:part?.src})) {
    let result;
    const { kind, property, value } = argument;
    const refs = [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map(m=>m[1]);
    if (kind==='parse-error') result=decide('unknown','parser-failure','Parsing failed; central ownership cannot approve an unread argument.',[{path:file,line:argument.line}]);
    else if (reviewedScriptBoundary(file,sourceHash,argument,scriptReview)) result=reviewedScriptBoundary(file,sourceHash,argument,scriptReview);
    else if (copyVerified) result=decide('central-source-verified','central-copy','The complete authored argument is distributed from the verified central source.',[{path:part.src,line:1}]);
    else if(iconVerified) result=decide('central-source-verified','central-icon-copy','Exact normalized source hash matches the generated Phosphor component/helper.',[{path:iconCanonical,line:argument.line}]);
    else if(file==='app/globals.css'&&kind==='css-at-rule') result=decide('dependency-entry','central-style-import','Import activates the generated central layer or installed Tailwind compiler primitives.',[{path:file,line:argument.line}]);
    else if (file==='app/fonts.css') result=decide('font-resource','font-resource','Bundled Pretendard subset declarations are binary font metadata; central family aliases select the face.',[{path:'source/style-adapters/carnet.json',line:1}]);
    else if (kind==='class-utility') {
      if(value==='sr-only') result=decide('structural-behavior','assistive-visibility','1px clipped box is the screen-reader-only hiding mechanism, not a visible visual size.',themeEvidence);
      else if(value==='group') result=decide('structural-behavior','variant-group-marker','Class is a selector marker for group variants and has no independent style declaration.',themeEvidence);
      else if (classOwners.has(value)) result=decide('central-selector','central-selector','Exact class exists in central recipe.',[classOwners.get(value)]);
      else {
        const compiled=utility(value);
        if(compiled?.finite.length) result=decide('unknown','finite-utility-unresolved',JSON.stringify(compiled.finite),themeEvidence);
        else if(compiled?.direct.length) result=decide('central-utility','tailwind-live-utility',`Installed Tailwind compiled CSS hash ${compiled.cssHash}; final declarations read theme/live aliases.`,themeEvidence);
        else if(compiled) result=decide('structural-behavior','tailwind-structural',`Installed Tailwind compiled CSS hash ${compiled.cssHash}; ${JSON.stringify(compiled.final)}`,themeEvidence);
        else if(['APPROVED','AVAILABLE','clear','back','closed','.','number','full','warn','ok'].includes(value)) result=decide('business-data','business-data','This literal is a condition/state value inside a class expression, not an emitted standalone class.',[{path:file,line:argument.line}]);
      }
    }
    else if(refs.length && refs.every(r=>r.startsWith('--tw-')||variableOwners.has(r))) result=decide('token-reference-verified','canonical-variable','All referenced design variables resolve to current central declarations.',refs.filter(r=>variableOwners.has(r)).map(r=>({...variableOwners.get(r),variable:r})));
    else if(kind==='class-expression') result=decide('state-class-expression','state-class-expression','State conditional or composed class names; constituent literal utilities have individual records.',[{path:file,line:argument.line}]);
    else if(['style-expression','style-call','dynamic-style'].includes(kind) && runtimeReasons[file]) {
      const [rule,reason,evidence]=runtimeReasons[file]; result=decide('runtime-boundary',rule,reason,[{path:evidence,line:1}]);
    }
    else if(assetFiles.has(file) && ['svg-geometry','presentation-attribute','named-style-value','object-property'].includes(kind)) result=decide('physical-artifact','physical-artifact','Coordinate system/scanner geometry or approved vector data; authored appearance is in the central Carnet recipe.',[{path:'source/style-adapters/carnet.json',line:1},{path:file,line:argument.line}]);
    else if(file.startsWith('public/') && /\.svg$/.test(file)) result=decide('physical-artifact','physical-artifact','Stored identity/installation vector asset; not a runtime component style literal.',[{path:file,line:argument.line}]);
    else if(kind==='named-style-value') {
      if(/await with(?:Actor|User)|await db\.|await client\.|await (?:fetch|exportExchange|previewExchange|applyExchange|previewFinished|saveConnection)|daysUntilKST|remain\(|rows\.filter|ops\.filter|steps\.filter|r\.keep|cell\.get|form\.get|new Date|d\.getFullYear|date\.slice|createDecipheriv|Buffer\.from|readRule\(|lotGap\(|await unlock|ms - \(Date\.now|rows\.length|Math\.max\(1, Number\(sp\.page/.test(value)
        || file.startsWith('lib/exchange/') || file==='lib/net.ts' || file==='lib/work-record-index.ts'
        || (file==='app/login/login-form.tsx'&&property==='mask')
        || (file==='app/(admin)/settings/model/forms.tsx'&&property==='fill')) result=decide('business-data','business-data','Read-through confirms this binding feeds business data, identity, counts, timestamps, record formatting or conditional behavior.',[{path:file,line:argument.line}]);
      else if(/getBoundingClientRect\(|new ResizeObserver/.test(value)) result=decide('runtime-measurement','measured-element-bounds','Actual DOM bounds or observer, not a finite style default.',[{path:file,line:argument.line}]);
      else if(file.startsWith('app/print/')||file==='components/print-frame.tsx') result=decide('physical-artifact','physical-paper-pagination','Page number and remaining printable row capacity are content pagination data.',[{path:file,line:argument.line}]);
      else if(file==='components/ui.tsx'&&property==='color') result=decide('state-class-expression','state-class-expression','Tone map chooses centrally bridged semantic palette class names.',[{path:file,line:argument.line}]);
    }
    else if(kind==='object-property' && !['style','CSS'].some(s=>(argument.context??'').startsWith(s))) {
      if(['left','right','page','d','length','r','x','y','top'].includes(property)&&!file.includes('brand-forms')&&!file.includes('info-tip')&&!file.includes('stat-detail')&&!file.includes('tooltip-placement')) result=decide('business-data','business-data','Reviewed consumer is content column, pagination, row count, cryptographic setting or data binding, not a style object.',[{path:file,line:argument.line}]);
      else if(runtimeReasons[file]) {const [rule,reason,evidence]=runtimeReasons[file];result=decide('runtime-boundary',rule,reason,[{path:evidence,line:1}]);}
      else if(file==='app/layout.tsx'||file==='app/manifest.ts') result=decide('structural-behavior','platform-display-contract','Viewport device-width and installed standalone display mode are platform behavior.',[{path:file,line:argument.line}]);
    }
    else if(kind==='presentation-attribute' && ['right','top','bottom','all','width'].includes(property) && !/[0-9](px|rem|em)/.test(value)) result=decide('component-data-prop','business-data','Custom component prop controls semantic column content, alignment or a centrally styled layout variant.',[{path:file,line:argument.line}]);
    else if(kind==='object-spread') {
      if(reviewedSpreads[file]?.includes(argument.line)) result=decide('business-data','reviewed-data-spread','Exact source location reviewed: merges record/state/print metadata or API response fields, never passed as CSS style.',[{path:file,line:argument.line}]);
      else if(['components/info-tip.tsx','components/stat-detail.tsx'].includes(file)&&value==='at') result=decide('runtime-measurement','measured-tooltip-placement','Spreads measured anchor coordinates before passing them to tooltipPosition.',[{path:'lib/tooltip-placement.ts',line:1}]);
      else result=decide('unknown','spread-consumer-review','Spread may carry style or data props; retain until its exact target and source are traced.',[{path:file,line:argument.line}]);
    }
    if(!result && kind==='svg-geometry' && ((file==='app/(admin)/production/deviation/page.tsx'&&value==='{r}')||(file==='app/(work)/work/[id]/work-panel.tsx'&&value==='{x}'))) result=decide('business-data','custom-prop-not-svg','Prop d/x belongs to DeviationRow/IssueRow and contains a business record, not an SVG element.',[{path:file,line:argument.line}]);
    if(!result && kind==='presentation-attribute' && (property==='page'||property==='mask'||property==='clear')) result=decide('component-data-prop','custom-behavior-prop','Custom component page counter, PIN masking or clear-action callback; not a CSS property.',[{path:file,line:argument.line}]);
    if(!result && kind==='presentation-attribute' && file==='app/(admin)/settings/brand/page.tsx'&&property==='color') result=decide('business-data','company-brand-input','Company color is persisted user data passed to its edit form, not a fixed visual default.',[{path:file,line:argument.line}]);
    if(!result && kind==='presentation-attribute' && property==='height'&&['components/q-mark.tsx','components/install-app.tsx'].includes(file)) result=decide('physical-artifact','intrinsic-image-metadata','Image dimensions preserve aspect ratio before CSS loads; rendered dimensions are governed by the central q-mark/install-app-icon selectors.',[{path:'patterns/foundation/carnet.css',line:1},{path:file,line:argument.line}]);
    if(!result && kind==='presentation-attribute'&&property==='height'&&['components/print-frame.tsx','app/print/label/[id]/page.tsx'].includes(file)) result=decide('physical-artifact','physical-barcode-layout','Barcode SVG height is scanner/paper coordinate geometry (physical label/footer constraint), not a screen control size.',[{path:'source/style-adapters/carnet.json',line:1},{path:file,line:argument.line}]);
    if(!result && kind==='named-style-value'&&file==='lib/tooltip-placement.ts'&&/cssLengthPixels/.test(value)) result=decide('token-reference-verified','computed-canonical-length','Helper resolves the named canonical CSS length through actual computed CSS, including rem/calc.',[{path:'lib/css-metrics.ts',line:1}]);
    if(!result && kind==='named-style-value'&&((file==='app/(admin)/tools/link/actions.ts'&&property==='r')||(file==='lib/release-evidence.ts'&&property==='gap'))) result=decide('business-data','reviewed-business-binding','Link action result or equipment evidence deficiencies, not a visual metric.',[{path:file,line:argument.line}]);
    if(!result){const argumentHash=hash(JSON.stringify([file,argument.line,kind,property,value]));result=verifiedConsumerReview({path:file,line:argument.line,sourceHash,argumentHash},consumerReviews.get(argumentHash),consumerHash);}
    if(!result) result=decide('unknown','unclassified','No evidence rule establishes this argument yet.',[{path:file,line:argument.line}]);
    records.push({path:file,sourceHash,argumentHash:hash(JSON.stringify([file,argument.line,kind,property,value])),...argument,originalStatus:argument.status,...result});
  }
}
const counts={};for(const r of records)counts[r.decision]=(counts[r.decision]??0)+1;
const report={version:1,generatedAt:new Date().toISOString(),product:'carnet',scope:'Source adjudication only, not browser visual approval.',rules,fileHashes,counts,unknownCount:counts.unknown??0,records};
const outcome=publishCarnetStyleReport(report,path.join(ROOT,'reviews/carnet-style-decisions.json'),{check:process.argv.includes('--check')});
process.exitCode=outcome.exitCode;
console.log(JSON.stringify({total:records.length,counts},null,2));
console.log(records.filter(r=>r.decision==='unknown').map(r=>`${r.path}:${r.line} ${r.kind} ${r.value.replaceAll('\n',' ').slice(0,120)}`).join('\n'));
