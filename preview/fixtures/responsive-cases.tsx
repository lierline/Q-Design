import React, {useState, type ReactNode} from 'react';
import type {ComparisonAdapters} from './comparison-matrix';
type Props = {adapters: ComparisonAdapters; grid: (children: ReactNode) => ReactNode; stats: () => ReactNode; choiceGroup?:()=>ReactNode; drawer?: (open:boolean,close:()=>void,child:ReactNode,side:'right'|'bottom')=>ReactNode};
export default function ResponsiveCases({adapters:a, grid, stats, drawer,choiceGroup}:Props){
  const [value,setValue]=useState('검토 문서'),[open,setOpen]=useState(false);
  const [drawerSide,setDrawerSide]=useState<'right'|'bottom'|null>(null);
  const control=(id:string)=>({id,value,onChange:(event:any)=>setValue(event.target.value)});
  const fields=(id:string)=>['문서 이름','검토 부서','검토 상태','담당자'].map((label,i)=><React.Fragment key={label}>{a.field(id+i,label,a.input(control(id+i)))}</React.Fragment>);
  return <div data-testid="responsive-cases">
    <h2>화면과 부모 폭에 따른 배치</h2>
    <section data-testid="responsive-wide">{grid(fields('wide-'))}</section>
    <section data-testid="responsive-narrow" style={{width:'min(100%, 260px)',marginBlock:24}}>{grid(fields('narrow-'))}</section>
    <section data-testid="responsive-tiny" style={{width:'min(100%, 120px)',marginBlock:24}}>{grid(fields('tiny-'))}</section>
    <section data-testid="responsive-stats">{stats()}</section>
    <section data-testid="responsive-long" style={{width:'min(100%, 260px)',marginBlock:24}}>{a.card(<p>{'LONG_DOCUMENT_IDENTIFIER_'.repeat(12)}</p>)}{a.button('아주 긴 이름의 문서 검토 내용을 확인하고 저장합니다')}</section>
    <section data-testid="responsive-table" style={{width:'min(100%, 260px)',marginBlock:24}}>{a.table()}</section>
    <section data-testid="responsive-editable-table" style={{width:'min(100%, 260px)',marginBlock:24}}><div className="qd-table-scroll"><table className="qd-table qd-table--editable"><thead><tr><th>항목</th><th>기준</th><th>측정값</th><th>판정</th></tr></thead><tbody><tr>{['제조사 또는 공급자','규격 또는 모델명','표시 또는 식별 상태','판정 대기'].map((label,i)=><td key={label}>{a.input({...control('editable-'+i),value:label})}</td>)}</tr></tbody></table></div></section>
    <section data-testid="responsive-textarea">{a.field('responsive-note','검토 의견',a.textarea(control('responsive-note')))}</section>
    <section data-testid="responsive-select" style={{width:'min(100%, 120px)',marginBlock:24}}>{a.field('responsive-select','검토 상태',a.select({...control('responsive-select'),value:'review'}))}</section>
    <section data-testid="responsive-tabs" style={{width:'min(100%, 260px)',marginBlock:24}}>{a.tabs()}</section>
    <section data-testid="responsive-choice" style={{width:'min(100%, 120px)',marginBlock:24}}>{a.choice(false)}{a.choice(true)}</section>
    <section data-testid="responsive-choice-group" style={{width:'min(100%, 333px)',marginBlock:24}}>{choiceGroup?choiceGroup():a.choice(false)}</section>
    <section data-testid="responsive-empty" style={{width:'min(100%, 260px)',marginBlock:24}}>{a.empty(false)}</section>
    <section data-testid="responsive-skeleton" style={{width:'min(100%, 120px)',marginBlock:24}}>{a.skeleton()}</section>
    <section data-testid="responsive-progress" style={{width:'min(100%, 120px)',marginBlock:24}}>{a.progress()}</section>
    <span data-testid="responsive-open">{a.button('반응형 대화상자 열기',{onClick:()=>setOpen(true)})}</span>
    {drawer && <div>{(['right','bottom'] as const).map(side=><span key={side} data-testid={'responsive-drawer-'+side}>{a.button(side==='right'?'측면 패널 열기':'하단 패널 열기',{onClick:()=>setDrawerSide(side)})}</span>)}</div>}
    {a.dialog(open,()=>setOpen(false),<div data-testid="responsive-dialog-body">{Array.from({length:20},(_,i)=><p key={i}>좁고 낮은 화면에서도 검토 내용을 읽고 하단 동작을 사용할 수 있어야 합니다.</p>)}</div>)}
    {drawer && drawer(drawerSide!==null,()=>setDrawerSide(null),<div>{Array.from({length:20},(_,i)=><p key={i}>패널 안의 긴 검토 내용도 화면 안에서 읽을 수 있어야 합니다.</p>)}</div>,drawerSide??'right')}
  </div>;
}
