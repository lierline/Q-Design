import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s.replaceAll('\r\n','\n')).digest('hex');
function url(value,base){try{return new URL(value,base);}catch{return null;}}
function matchesRoute(route,pathname){
  const a=route.split('/'),b=pathname.split('/');
  return a.length===b.length&&a.every((part,i)=>/^\[[^\]]+\]$/.test(part)?!!b[i]:part===b[i]);
}
export function routeChanged(capture){
  const requested=url(capture.url),actual=url(capture.actualURL);
  return !!requested&&!!actual&&(requested.origin!==actual.origin||requested.pathname!==actual.pathname);
}
// A guard is approved by a human source review. Reuse that approval only while
// its exact source, expression, role and observed destination still agree.
export function verifiedRouteBoundary(capture,records,readSource){
  const requested=url(capture.url),actual=url(capture.actualURL);
  if(!requested||!actual||requested.origin!==actual.origin)return null;
  for(const record of records){
    if(!['expected-role-redirect','expected-route-alias','expected-feature-redirect'].includes(record.state)||record.detailRendered!==false||record.role!==capture.role||!matchesRoute(record.route,requested.pathname))continue;
    const destination=url(record.destination,requested.origin);
    if(!destination||actual.origin!==destination.origin||actual.pathname!==destination.pathname||actual.search!==destination.search||!record.evidence?.length)continue;
    const current=record.evidence.every(e=>{
      if(!e.path||!e.hash||!e.expression||!Number.isInteger(e.line))return false;
      const source=readSource(e.path);
      if(typeof source!=='string'||hash(source)!==e.hash)return false;
      const normalized=source.replaceAll('\r\n','\n'),at=normalized.split('\n').slice(0,e.line-1).join('\n').length+(e.line>1?1:0);
      return normalized.slice(at).trimStart().startsWith(e.expression.replaceAll('\r\n','\n'));
    });
    if(current)return {state:record.state,destination:record.destination,detailRendered:false,sourceEvidence:record.evidence,scope:`Only the reviewed ${record.state==='expected-feature-redirect'?'feature/access guard':record.state==='expected-route-alias'?'legacy route alias':'role redirect'} and visible destination state. The requested page did not render; this is not underlying-page or full destination-page conformance.`};
  }
  return null;
}
export function captureDecision(capture,images,scrollComplete,boundary){
  const reviewed=images.length>0&&images.every(i=>i.reviewed),clean=reviewed&&images.every(i=>!i.needsAttention);
  const redirect=routeChanged(capture)||images.some(i=>/redirect/.test(i.verdict??''));
  const namedWidth=/(?:mobile|frame|phone)[-_]?(\d{3,4})(?:\b|$)/.exec(capture.role??'');
  const expected=capture.requestedViewport?.[0]??(namedWidth?Number(namedWidth[1]):null);
  const viewportMatches=expected===null||(Number.isFinite(capture.viewport?.[0])&&Math.abs(capture.viewport[0]-expected)<=1);
  return {allImagesReviewed:reviewed,viewportMatches,usableVisualCapture:clean&&viewportMatches&&!redirect&&!boundary&&scrollComplete!==false,verifiedBoundaryCapture:clean&&viewportMatches&&!!boundary};
}
