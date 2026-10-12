import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeProfileGrid,profileGridPath} from './atelier-profile-grid-source.mjs';
import {beforeExpertFonts,expertFontPath} from './atelier-expert-font-source.mjs';
import {beforeAtelierProfessionalSource} from './atelier-professional-copy-revalidation.mjs';
const readManifest=file=>JSON.parse(fs.readFileSync(new URL('../reviews/'+file,import.meta.url),'utf8'));
const layers=readManifest('atelier-mobile-layers-migration.json');
const finite=readManifest('atelier-finite-defaults-3-migration.json');
const widget=readManifest('atelier-widget-width-migration.json');
const grid=readManifest('atelier-trace-grid-migration.json');
const templates=readManifest('atelier-template-fragments-migration.json');
const researchInput=readManifest('atelier-research-input-migration.json');
const tableDensity=readManifest('atelier-table-density-migration.json');
const nativeControls=readManifest('atelier-native-control-migration.json');
const collapse=readManifest('atelier-collapse-migration.json');
const finalPresentation=readManifest('atelier-final-presentation-migration.json');
const finalOutputLayout=readManifest('atelier-final-output-layout-migration.json');
const permissionScroll=readManifest('atelier-permission-scroll-migration.json');
const ruleTableScroll=readManifest('atelier-rule-table-scroll-migration.json');
const finalVisualRules=readManifest('atelier-final-visual-rules-migration.json');
const rendererInputs=readManifest('atelier-renderer-input-migration.json');
const choiceContract=readManifest('atelier-choice-contract-migration.json');
const componentParity=readManifest('atelier-component-parity-migration.json');
const extendedParity=readManifest('atelier-extended-parity-migration.json');
const responsiveChart=readManifest('atelier-responsive-chart-migration.json');
const followupControls=readManifest('atelier-followup-controls-migration.json');
const expertCopy=readManifest('atelier-expert-copy-migration.json');
const expertFieldAssociation=readManifest('atelier-expert-field-association-migration.json');
const toastCopy=readManifest('atelier-toast-copy-migration.json');
const skeletonParity=readManifest('atelier-skeleton-parity-migration.json');
const hash=source=>createHash('sha256').update(source.replaceAll('\r\n','\n')).digest('hex');
// Preserve earlier migration proofs after the later, separately reviewed pass.
// Each individual inverse is exact, and both snapshots remain hash-checked.
function reverseManifest(path,source,manifest){
 const entry=manifest.records.find(record=>record.path===path);
 if(!entry)return source;
 assert.equal(hash(source),entry.afterHash,path+': latest finite source');
 for(const edit of [...entry.edits].reverse()){
  if(Number.isInteger(edit.start)){
   assert.equal(source.slice(edit.start,edit.start+edit.after.length),edit.after,path+': exact inverse offset '+edit.start);
   source=source.slice(0,edit.start)+edit.before+source.slice(edit.start+edit.after.length);
  }else{
   assert.ok(source.includes(edit.after),path+': missing inverse '+edit.after);
   source=source.replace(edit.after,edit.before);
  }
 }
 assert.equal(hash(source),entry.beforeHash,path+': finite3 inverse');
 return source;
}
export function reverseResponsiveChart(path,source){
 source=beforeAtelierProfessionalSource(path,source);
 if(path===expertFontPath)source=beforeExpertFonts(source);
 if(path===profileGridPath)source=beforeProfileGrid(source);
 const skeleton=skeletonParity.records.find(record=>record.path===path);
 if(skeleton&&hash(source)!==skeleton.beforeHash)source=reverseManifest(path,source.replaceAll('\r\n','\n'),skeletonParity);
 const toast=toastCopy.records.find(record=>record.path===path);
 if(toast&&hash(source)!==toast.beforeHash)source=reverseManifest(path,source.replaceAll('\r\n','\n'),toastCopy);
 const field=expertFieldAssociation.records.find(record=>record.path===path);
 if(field&&hash(source)!==field.beforeHash)source=reverseManifest(path,source,expertFieldAssociation);
 const copy=expertCopy.records.find(record=>record.path===path);
 if(copy&&hash(source)!==copy.beforeHash)source=reverseManifest(path,source,expertCopy);
 const followup=followupControls.records.find(record=>record.path===path);
 if(followup&&hash(source)!==followup.beforeHash){
  source=reverseManifest(path,source.replaceAll('\r\n','\n'),followupControls);
  if(followup.beforeLineEnding==='crlf'){
   const lines=source.split('\n'),lfOnly=new Set(followup.beforeLFOnlyLines);
   source=lines.map((line,i)=>i<lines.length-1&&!lfOnly.has(i)?line+'\r':line).join('\n');
  }
  assert.equal(createHash('sha256').update(source).digest('hex'),followup.beforeRawHash,path+': exact historical line endings');
 }
 if(!responsiveChart.records.some(record=>record.path===path))return source;
 const restored=reverseManifest(path,source.replaceAll('\r\n','\n'),responsiveChart);
 const record=responsiveChart.records.find(record=>record.path===path);
 if(record.beforeLineEnding!=='crlf')return restored;
 let original=restored.replaceAll('\n','\r\n');
 for(const line of record.beforeLFOnlyImports??[]){assert.equal(original.split(line+'\r\n').length,2,'Exact historical import line');original=original.replace(line+'\r\n',line+'\n');}
 return original;
}
export function reverseExtendedParity(path,source){return reverseManifest(path,reverseResponsiveChart(path,source),extendedParity);}
export function reverseComponentParity(path,source){return reverseManifest(path,reverseExtendedParity(path,source),componentParity);}
export function reverseChoiceContract(path,source){return reverseManifest(path,reverseComponentParity(path,source),choiceContract);}
export function reverseRendererInputs(path,source){return reverseManifest(path,reverseChoiceContract(path,source),rendererInputs);}
export function reverseFinalVisualRules(path,source){return reverseManifest(path,reverseRendererInputs(path,source),finalVisualRules);}
export function reversePostNativeControls(path,source){source=reverseResponsiveChart(path,source);for(const manifest of [extendedParity,componentParity,choiceContract,rendererInputs,finalVisualRules,ruleTableScroll,permissionScroll,finalOutputLayout])source=reverseManifest(path,source,manifest);return source;}
export function reversePostFinalPresentation(path,source){source=reverseResponsiveChart(path,source);for(const manifest of [extendedParity,componentParity,choiceContract,rendererInputs,finalVisualRules,ruleTableScroll,permissionScroll,finalOutputLayout,nativeControls,tableDensity,collapse])source=reverseManifest(path,source,manifest);return source;}
export function reverseLayers(path,source){return reverseManifest(path,source,layers);}
export function reverseLaterVisualChanges(path,source){
 source=reverseResponsiveChart(path,source);
 for(const manifest of [extendedParity,componentParity,choiceContract,rendererInputs,finalVisualRules,ruleTableScroll,permissionScroll,finalOutputLayout,nativeControls,tableDensity,collapse,finalPresentation,researchInput,templates,grid,widget,layers])source=reverseManifest(path,source,manifest);
 return source;
}
export function reverseFiniteThird(path,source){return reverseManifest(path,reverseLaterVisualChanges(path,source),finite);}
