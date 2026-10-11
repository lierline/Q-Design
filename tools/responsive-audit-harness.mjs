// Temporary, same-origin viewport host for CUA when its viewport override is unavailable.
// This hosts the actual app document and retains normal cookies, CSP and authorization.
import fs from 'node:fs';
import path from 'node:path';
const products = { atelier: 'Q-Atelier', maison: 'Q-Works', carnet: 'DHR' };
const args = Object.fromEntries(process.argv.slice(2).map(value => value.replace(/^--/, '').split(/=(.*)/s).slice(0, 2)));
const product = products[args.product];
if (!product) throw new Error('Use --product=atelier|maison|carnet');
const file = path.resolve('D:/Claude', product, 'public', '__qdesign-responsive-audit.html');
if (args.clean !== undefined || process.argv.includes('--clean')) {
  if (fs.existsSync(file)) fs.unlinkSync(file);
  console.log(`Removed temporary harness: ${file}`);
} else {
  const width = Number(args.width), route = args.route;
  if (![375, 412].includes(width) || !route?.startsWith('/') || route.startsWith('//') || /[<>"'\\]/.test(route)) throw new Error('Use --width=375|412 and a known same-origin --route=/path.');
  const escaped = route.replaceAll('&', '&amp;');
  fs.writeFileSync(file, `<!doctype html><html lang="ko"><meta charset="utf-8"><title>Q-Design responsive audit</title><style>html,body{margin:0}iframe{display:block;border:0}</style><body><iframe title="Actual application viewport" src="${escaped}" width="${width}" height="640" frameborder="0"></iframe><p>Actual app viewport: ${width} × 640. ${product} ${escaped}</p></body></html>\n`);
  console.log(`Temporary same-origin viewport ${width}x640: ${file}`);
}
