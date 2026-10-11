import {readFileSync} from 'node:fs';
import {join} from 'node:path';

export function readOutputValues(root) {
  const source=readFileSync(join(root,'source/design/atelier-output.ts'),'utf8');
  const match=source.match(/export const QDOutput = (\{[\s\S]*?\}) as const;/);
  if(!match)throw Error('Missing declarative canonical QDOutput');
  return JSON.parse(match[1]);
}

// Physical output rules and numeric print-fit calculations must consume one source.
// Resolve at build time so @page descriptors never depend on browser custom-property support.
export function resolveAtelierOutputCss(css, values) {
  return css.replace(/qd-output\(\s*([\w.]+)\s*,\s*(px|mm)\s*\)/g,(_,name,unit)=>{
    if(!/^print\.[\w.]+$/.test(name))throw Error('Unsupported output CSS group: '+name);
    const value=name.split('.').reduce((object,key)=>Object.hasOwn(object??{},key)?object[key]:undefined,values);
    if(typeof value!=='number'||!Number.isFinite(value)||value<0)throw Error('Unknown or invalid output CSS value: '+name);
    return String(value)+unit;
  });
}
