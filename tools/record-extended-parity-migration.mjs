// Record an exact inverse of the reviewed adapter-only patch. No product writes.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {hash} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Atelier', qd='D:/Claude/Q-Design';
const base='9044a536c26a7345c4304a3e7f76fa8f73c5742a';
const replacements={
 'lib/design/components.tsx':[
  ['    <Bx\n      style={{\n        padding: compact ?', "    <Bx className={`qd-empty${compact ? ' qd-empty--compact' : ''}`}\n      style={{\n        padding: compact ?"],
  ['        <div\n          style={{\n            fontFamily: QDScale.family.serif, fontWeight:', '        <div className="qd-empty-title"\n          style={{\n            fontFamily: QDScale.family.serif, fontWeight:'],
  ['          <div\n            style={{\n              fontSize: QDScale.font[13],', '          <div className="qd-empty-desc"\n            style={{\n              fontSize: QDScale.font[13],'],
  ['{action && <div style={{ marginBottom: hints ?', '{action && <div className="qd-empty-actions" style={{ marginBottom: hints ?'],
  ['{hints && hints.length > 0 && (\n          <div\n', '{hints && hints.length > 0 && (\n          <div className="qd-empty-hints"\n'],
 ],
 'lib/design/segmented-choice.tsx':[
  ['padding: sm ? QD.controlPaddingSm : QD.controlPadding,', "padding: sm ? 'var(--qd-choice-padding-y) var(--qd-choice-padding-x)' : QD.controlPadding,"],
  ['fontSize: QD.controlSize,\n        fontWeight: on ?', "fontSize: QD.controlSize, lineHeight: 'var(--qd-choice-line-height)',\n        fontWeight: on ?"],
 ],
};
const records=[];
for(const[path,pairs]of Object.entries(replacements)){
 const before=execFileSync('git',['show',`${base}:${path}`],{cwd:root,encoding:'utf8'}).replaceAll('\r\n','\n');
 let after=before;
 for(const[from,to]of pairs){if(after.split(from).length!==2)throw Error('Ambiguous patch '+path);after=after.replace(from,to);}
 const current=fs.readFileSync(root+'/'+path,'utf8').replaceAll('\r\n','\n');
 if(current!==after)throw Error('Product contains unreviewed edits '+path);
 let offset=0;const edits=pairs.map(([from,to])=>({start:before.indexOf(from),before:from,after:to})).sort((a,b)=>a.start-b.start).map(edit=>{const out={...edit,start:edit.start+offset};offset+=edit.after.length-edit.before.length;return out;});
 // Inverse offsets refer to the complete final snapshot.
 let reversed=after;for(const edit of [...edits].reverse()){if(reversed.slice(edit.start,edit.start+edit.after.length)!==edit.after)throw Error('Inverse offset');reversed=reversed.slice(0,edit.start)+edit.before+reversed.slice(edit.start+edit.after.length);}
 if(reversed!==before)throw Error('Non-style bytes changed');
 records.push({path,beforeHash:hash(before),afterHash:hash(after),edits});
}
fs.writeFileSync(qd+'/reviews/atelier-extended-parity-migration.json',JSON.stringify({version:1,base,scope:'Five empty-state role classes and two small-choice style parameter links only. All other adapter bytes are preserved.',records},null,2)+'\n');
console.log(JSON.stringify({files:records.length,edits:records.reduce((n,r)=>n+r.edits.length,0)}));
