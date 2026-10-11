// Persist direct pixel observations only. This helper does not inspect images.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const rows=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const output=path.join(root,'reviews/maison-pages-contiguous-visual-review.json');
const ledger=fs.existsSync(output)?JSON.parse(fs.readFileSync(output,'utf8')):{version:1,scope:'Direct review of saved contiguous inner-scroll captures. Readability and layout only; no permission mutation or business workflow approval.',reviews:[]};
for(const row of rows){
 if(!row.image||!row.observations?.length||!row.result||!row.evidence)throw Error('Explicit observation and capture evidence required');
 const imagePath=path.resolve(root,'reviews',row.image),boundary=path.resolve(root,'reviews/maison-pages')+path.sep;
 if(!imagePath.startsWith(boundary)||path.extname(imagePath)!=='.jpg')throw Error('Outside captured-image boundary');
 const evidencePath=path.resolve(root,'reviews',row.evidence);
 if(path.dirname(evidencePath)!==path.resolve(root,'reviews')||path.extname(evidencePath)!=='.json')throw Error('Outside evidence boundary');
 const capture=JSON.parse(fs.readFileSync(evidencePath,'utf8'));
 const record=(Array.isArray(capture)?capture:capture.records).find(r=>r.file===row.image);if(!record)throw Error('Image not listed in capture evidence');
 const route=capture.route??row.route;if(!route)throw Error('Explicit route required for an array capture');
 const sha256=createHash('sha256').update(fs.readFileSync(imagePath)).digest('hex');
 const result={image:row.image,sha256,route,role:'SaaS_Admin',theme:'dark',captureMode:row.captureMode??'contiguous-inner-scroll',evidence:row.evidence,reviewedAt:new Date().toISOString(),result:row.result,observations:row.observations};
 const previous=ledger.reviews.findIndex(r=>r.image===row.image&&r.sha256===sha256);
 if(previous<0)ledger.reviews.push(result);else ledger.reviews[previous]=result;
}
fs.writeFileSync(output,JSON.stringify(ledger,null,2)+'\n');console.log(JSON.stringify({recorded:rows.length,total:ledger.reviews.length}));
