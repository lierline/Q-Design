// Persist only explicitly supplied observations after direct image inspection.
// This command does not inspect pixels or infer a visual pass.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const input=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const ledgerPath=path.join(root,'reviews/maison-pages-visual-review.json');
const ledger=JSON.parse(fs.readFileSync(ledgerPath,'utf8'));
for(const item of input){
  if(!item.image||!item.observations||!item.result)throw new Error('An image, explicit observation and result are required.');
  const full=path.resolve(root,'reviews/maison-pages/screens',item.image);
  const boundary=path.resolve(root,'reviews/maison-pages/screens')+path.sep;
  if(!full.startsWith(boundary)||path.extname(full)!=='.jpg')throw new Error('Only captured Maison screenshot paths are allowed.');
  const sha256=createHash('sha256').update(fs.readFileSync(full)).digest('hex');
  if(item.sha256&&item.sha256!==sha256)throw new Error('Image changed after inspection: '+item.image);
  const metadataPath=full.replace(/-\d+\.jpg$/,'.json');
  const metadata=JSON.parse(fs.readFileSync(metadataPath,'utf8'));
  const image='maison-pages/screens/'+item.image;
  const entry={image,sha256,viewport:metadata.viewport,theme:metadata.theme,role:metadata.role,route:metadata.route,actualURL:metadata.actualURL,captureMode:metadata.captureMode??'legacy-capture',reviewedAt:new Date().toISOString(),result:item.result,observations:item.observations};
  const previous=ledger.reviews.findIndex(row=>row.image===image&&row.sha256===sha256);
  if(previous<0)ledger.reviews.push(entry);else ledger.reviews[previous]=entry;
}
fs.writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
console.log(JSON.stringify({addedOrUpdated:input.length,total:ledger.reviews.length}));
