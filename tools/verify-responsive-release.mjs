// Public deployment assets only. No authentication, cookies or business writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const products={atelier:'https://atelier.medqraft.app',maison:'https://maison.medqraft.app',carnet:'https://carnet.medqraft.app'};
const args=process.argv.slice(2);
assert(args.every(arg=>arg.startsWith('--only=')),'Use optional --only=atelier,maison,carnet');
const selected=args[0]?.slice(7).split(',')??Object.keys(products);
assert(selected.length>0&&selected.every(name=>Object.hasOwn(products,name)),'Unknown product');
const canonical=fs.readFileSync(new URL('../patterns/foundation.css',import.meta.url),'utf8').match(/(?:^|\n):root\s*\{([^}]+)\}/)?.[1];
assert(canonical,'Canonical root settings missing');
const compact=value=>value.replace(/\s+/g,'');
const tokens=['--qd-grid-min-width','--qd-kpi-min-width','--qd-grid-gap','--qd-control-leading','--qd-overlay-screen-inset','--qd-textarea-max-height'];
const expected=tokens.map(name=>{
 const matches=[...canonical.matchAll(new RegExp(name+':\\s*([^;]+);','g'))];
 assert.equal(matches.length,1,'Canonical token must be unique: '+name);
 return compact(name+':'+matches[0][1]+';');
});
const selectors=['.qd-responsive-grid','.qd-form-grid--four','.qd-dialog-content--centered','.qd-grid-stat'];
async function read(url){const response=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(30000)});assert(response.ok,'HTTP '+response.status+' '+url);assert.equal(new URL(response.url).origin,new URL(url).origin,'Unexpected external redirect');return response.text();}
for(const name of selected){
 const origin=products[name],html=await read(origin+'/login');
 const links=[...html.matchAll(/<link\b[^>]*>/g)].map(match=>match[0]).filter(link=>/rel=["']stylesheet["']/.test(link)).map(link=>link.match(/href=["']([^"']+)["']/)?.[1]).filter(Boolean);
 const urls=[...new Set(links.map(link=>new URL(link.replaceAll('&amp;','&'),origin).href))];
 assert(urls.length>0,'No stylesheet assets: '+name);
 assert(urls.every(url=>new URL(url).origin===origin),'Unexpected stylesheet origin');
 const sheets=await Promise.all(urls.map(read)),css=compact(sheets.join('\n'));
 for(const declaration of expected)assert(css.includes(declaration),name+' missing canonical declaration '+declaration);
 for(const selector of selectors)assert(css.includes(selector),name+' missing responsive selector '+selector);
 console.log(JSON.stringify({product:name,origin,stylesheets:urls.length,canonicalTokens:tokens.length,selectors:selectors.length,bytes:Buffer.byteLength(sheets.join('\n')),sha256:createHash('sha256').update(sheets.join('\n')).digest('hex'),passed:true}));
}
