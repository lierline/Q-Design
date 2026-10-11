// Render real product components without connecting to authentication or business data.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WORKSPACE = resolve(ROOT, '..');
const cache = join(WORKSPACE, 'tmp/qd-component-workbench/cache');
mkdirSync(cache, { recursive: true });
process.env.TEMP = cache;
process.env.TMP = cache;
const buildRequire = createRequire(join(WORKSPACE, 'Q-Works/package.json'));
const { build } = await import(pathToFileURL(buildRequire.resolve('vite')));
const definitions = [
  { id: 'atelier', repo: 'Q-Atelier', title: 'Q-Atelier' },
  { id: 'maison', repo: 'Q-Works', title: 'Q-Maison' },
  { id: 'carnet', repo: 'DHR', title: 'Q-Carnet' },
];
const selected = process.argv.find(arg => arg.startsWith('--only='))?.slice(7).split(',');
if (selected?.some(id => !definitions.some(item => item.id === id))) throw new Error('Unknown product in --only');
const write = (path, text) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text, 'utf8'); };
for (const product of definitions.filter(item => !selected || selected.includes(item.id))) {
  const productRoot = join(WORKSPACE, product.repo);
  const require = createRequire(join(productRoot, 'package.json'));
  const stage = join(WORKSPACE, 'tmp/qd-component-workbench', product.id);
  const output = join(ROOT, 'preview/components', product.id);
  const fixture = join(ROOT, 'preview/fixtures', `${product.id}.tsx`);
  const comparison = join(ROOT, 'preview/fixtures', `${product.id}-comparison.tsx`);
  if (!existsSync(fixture)) throw new Error(`Missing fixture ${fixture}`);
  const slash = path => path.replaceAll('\\', '/');
  write(join(stage, 'link.tsx'), `import React from 'react'; export default function Link({href,children,prefetch,replace,scroll,...props}) { return <a href={typeof href==='string'?href:'#'} {...props}>{children}</a>; }`);
  write(join(stage, 'navigation.ts'), `export const useRouter=()=>({push(){},replace(){},refresh(){},back(){},prefetch(){}}); export const usePathname=()=>'/design'; export const useSearchParams=()=>new URLSearchParams(); export const useSelectedLayoutSegment=()=>null;`);
  const fontImport = product.id === 'maison' ? '' : `import ${JSON.stringify(slash(join(productRoot, 'app/fonts.css')))};`;
  write(join(stage, 'entry.tsx'), `import React from 'react'; import {createRoot} from 'react-dom/client'; import Gallery from ${JSON.stringify(slash(fixture))}; import Comparison from ${JSON.stringify(slash(comparison))}; import {Search} from '@/components/q-design-icons/Search'; import ${JSON.stringify(slash(join(productRoot, 'app/globals.css')))}; ${fontImport} import './workbench.css'; const query=new URLSearchParams(location.search); const theme=query.get('theme')||'light'; const Fixture=query.get('view')==='matched'?Comparison:Gallery; document.documentElement.dataset.theme=theme; document.documentElement.classList.toggle('dark',theme==='dark'); createRoot(document.getElementById('root')!).render(<div className="qd-audit-shell"><header className="qd-audit-head"><span>${product.title}</span><div aria-label="아이콘 크기 검증"><Search data-testid="canonical-icon" /><Search size={28} data-testid="explicit-icon" /><Search className="w-4 h-4" data-testid="utility-icon" /></div><h1>공통 컴포넌트 검증</h1><p>실제 제품 부품 · 예시 데이터</p></header><main><Fixture /></main></div>);`);
  write(join(stage, 'workbench.css'), `*{box-sizing:border-box}body{margin:0;background:var(--qd-bg);color:var(--qd-text);font-family:var(--qd-font-family-ui);font-size:var(--qd-body-size)}.qd-audit-shell{max-width:1120px;margin:auto;padding:40px 32px}.qd-audit-head{border-bottom:1px solid var(--qd-borderHi);padding-bottom:24px;margin-bottom:24px}.qd-audit-head>span{font-size:12px;color:var(--qd-accent)}.qd-audit-head h1{font-size:22px;font-weight:700;margin:8px 0}.qd-audit-head p{font-size:12px;color:var(--qd-muted)}.qd-audit-shell main{display:grid;gap:28px}.qd-audit-shell section{min-width:0}[data-testid=foundation-auth]{display:none}.qd-audit-shell h2:not([data-testid=foundation-auth-title]){font-size:16px;font-weight:700;margin:0 0 16px}.qd-audit-shell button{font-family:inherit}@media(max-width:640px){.qd-audit-shell{padding:24px 16px}}`);
  write(join(stage, 'index.html'), `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${product.title} 컴포넌트 검증</title></head><body><div id="root"></div><script type="module" src="./entry.tsx"></script></body></html>`);
  write(join(stage, 'workbench.css'), readFileSync(join(stage, 'workbench.css'), 'utf8') + `\nbody{line-height:1.6}.qd-audit-head{line-height:1.6}.qd-audit-head h1{line-height:1.3}.qd-audit-head p{margin:0;line-height:1.6}.qd-audit-head [aria-label]{display:flex;gap:8px;height:28px}.qd-comparison-matrix{display:grid;gap:28px}.qd-comparison-fields{display:grid;gap:16px}.qd-comparison-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px}.qd-comparison-matrix > section{display:grid;grid-template-columns:minmax(0,1fr);gap:16px}.qd-comparison-matrix > section > div{min-width:0}.qd-audit-shell .qd-comparison-matrix h2{margin:0;line-height:1.35}.qd-comparison-matrix [data-testid=parity-progress]{margin-top:8px}.qd-comparison-matrix .qd-card-description{margin-bottom:0}`);
  // Include legacy caller radii and utility aliases in the real product CSS build.
  const probe=join(stage,'radius-probes.tsx');
  write(probe, `export default function RadiusProbes(){return <section data-testid="radius-probes" style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:24}}><button type="button" className="qd-control-icon" data-testid="radius-legacy-small" style={{borderRadius:4}}>A</button><button type="button" className="qd-control-icon" data-testid="radius-legacy-large" style={{borderRadius:16}}>B</button>{['sm','md','lg','xl','2xl','3xl'].map(size=><div key={size} data-testid={'radius-alias-'+size} style={{width:44,height:44,border:'1px solid var(--qd-border)',borderRadius:'var(--qd-radius-'+size+')',display:'grid',placeItems:'center'}}>{size}</div>)}${product.id==='atelier'?'':`<div className="rounded-sm" data-testid="radius-utility-sm" style={{width:44,height:44,border:'1px solid var(--qd-border)'}}>sm</div><div className="rounded-md" data-testid="radius-utility-md" style={{width:44,height:44,border:'1px solid var(--qd-border)'}}>md</div><div className="rounded-lg" data-testid="radius-utility-lg" style={{width:44,height:44,border:'1px solid var(--qd-border)'}}>lg</div>`}</section>}`);
  if(product.id==='atelier')write(probe,readFileSync(probe,'utf8')
    .replace('export default function',`import {IconBtn} from '@/lib/design/components'; import {Gauge} from '@/components/q-design-icons/Gauge'; import {Bell} from '@/components/q-design-icons/Bell'; export default function`)
    .replace(/<button[^>]+data-testid="radius-legacy-small"[^>]*>A<\/button>/,`<IconBtn title="구독 · 사용량 모서리 검수" className="qa-touch-44sq radius-header-gauge" size={32} style={{borderRadius:16,background:'var(--qd-surface)'}}><Gauge size={16}/></IconBtn>`)
    .replace(/<button[^>]+data-testid="radius-legacy-large"[^>]*>B<\/button>/,`<IconBtn title="알림 모서리 검수" className="qa-touch-44sq radius-header-bell" size={32} style={{borderRadius:4,background:'var(--qd-surface)'}}><Bell size={16}/></IconBtn>`));
  const entryPath=join(stage,'entry.tsx');
  write(entryPath,readFileSync(entryPath,'utf8').replace("import React from 'react';",`import React from 'react'; import RadiusProbes from './radius-probes';`).replace('<main><Fixture /></main>','<main>{query.get(\'view\')!==\'matched\'&&<RadiusProbes />}<Fixture /></main>'));
  let plugins = [];
  if (product.id === 'maison') {
    const config = require('tailwindcss/loadConfig')(join(productRoot, 'tailwind.config.ts'));
    config.content = [slash(join(productRoot, 'app/**/*.{ts,tsx}')), slash(join(productRoot, 'components/**/*.{ts,tsx}')), slash(join(productRoot, 'lib/**/*.{ts,tsx}')), slash(fixture), slash(probe)];
    plugins = [require('postcss-import')(), require('tailwindcss')(config)];
  } else if (product.id === 'carnet') plugins = [require('@tailwindcss/postcss')({ base: productRoot })];
  else plugins = [buildRequire('postcss-import')()];
  // Make root-relative product font/image URLs available to the local audit server.
  plugins.push({ postcssPlugin: 'q-design-audit-assets', Declaration(decl) { decl.value = decl.value.replace(/url\((["']?)\/(?!\/|product-assets\/)/g, `url($1/product-assets/${product.id}/`); } });
  await build({
    root: stage, configFile: false, envDir: false, base: './', logLevel: 'info',
    oxc: { jsx: { runtime: 'automatic' } },
    plugins: process.env.QD_BUILD_TRACE ? [{ name: 'audit-trace', transform(_code, id) { console.log(id); } }] : [],
    resolve: { alias: [
      ...(product.id === 'maison' ? [{ find: /^sonner$/, replacement: slash(require.resolve('sonner')) }] : []),
      { find: /^@\//, replacement: slash(productRoot) + '/' },
      { find: 'next/link', replacement: join(stage, 'link.tsx') },
      { find: 'next/navigation', replacement: join(stage, 'navigation.ts') },
      { find: /^react-dom(?=\/|$)/, replacement: slash(join(productRoot, 'node_modules/react-dom')) },
      { find: /^react(?=\/|$)/, replacement: slash(join(productRoot, 'node_modules/react')) },
    ] },
    css: { postcss: { plugins } },
    build: { outDir: output, emptyOutDir: true, minify: false, sourcemap: false },
  });
  console.log(`${product.title}: ${output}`);
}
