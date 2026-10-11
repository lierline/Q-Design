import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const repo=path.resolve(root,'../Q-Atelier');
const ref='0aa6acb464ef99ff1cd30f4087e9b655ef21f83d';
const file='components/expert/Field.tsx';
const edits=[
 {before:"import { Children, cloneElement, isValidElement, useId } from 'react';",after:"import { Children, Fragment, cloneElement, isValidElement, useId } from 'react';"},
 {before:`  // child 가 단일 React element 면 id 자동 주입 (label htmlFor 와 연결).
  // child 가 fragment / 다수 children / non-element 면 wrapping 만.
  const child = Children.only(
    isValidElement(children) ? children : <>{children}</>,
  );
  const childWithId = isValidElement<{ id?: string }>(child)
    ? cloneElement(child, { id: child.props.id ?? generatedId })
    : child;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inputId = (childWithId as any)?.props?.id ?? generatedId;`,after:`  // Fragments group controls and messages but cannot receive an id. Associate
  // the label with the first control, preserving any explicitly supplied id.
  let inputId: string | undefined;
  const associateControl = (node: React.ReactNode): React.ReactNode => {
    if (!isValidElement<{ id?: string; children?: React.ReactNode }>(node)) return node;
    if (node.type === Fragment) {
      return cloneElement(node, undefined, Children.map(node.props.children, associateControl));
    }
    if (inputId !== undefined) return node;
    if (typeof node.type === 'string' && !['input', 'select', 'textarea', 'button', 'meter', 'output', 'progress'].includes(node.type)) return node;
    inputId = node.props.id ?? generatedId;
    return cloneElement(node, { id: inputId });
  };
  const childWithId = associateControl(isValidElement(children) ? children : <>{children}</>);`},
];
export function applyExpertFieldAssociation(source){
 source=source.replaceAll('\r\n','\n');
 for(const edit of edits){assert.equal(source.split(edit.before).length,2,'Exact association replacement');source=source.replace(edit.before,edit.after);}
 return source;
}
export function verifyExpertFieldAssociation(before,after){
 assert.equal(after.replaceAll('\r\n','\n'),applyExpertFieldAssociation(before),'Only the reviewed fragment association may change');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const before=execFileSync('git',['show',ref+':'+file],{cwd:repo,encoding:'utf8'});
 const after=fs.readFileSync(path.join(repo,file),'utf8');
 verifyExpertFieldAssociation(before,after);
 const proof={ref,scope:'Exact label association fix through React fragments. No style defaults, validation, submission, account creation or authorization changes.',records:[{path:file,beforeHash:hash(before),afterHash:hash(after),edits}]};
 const target=path.join(root,'reviews/atelier-expert-field-association-migration.json');
 if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(fs.readFileSync(target,'utf8')),proof,'Stale expert field association proof');
 else fs.writeFileSync(target,JSON.stringify(proof,null,2)+'\n');
 console.log('Expert field association exact source proof passed.');
}
