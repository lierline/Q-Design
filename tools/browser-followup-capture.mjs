// Run only inside CUA with documented Tab methods. Captures never grant approval.
export async function captureFollowup({tab,fs,root,product,target,role,limit=80,readySelector='h1,h2'}) {
  await tab.playwright.locator('[aria-busy="true"]').first().waitFor({state:'hidden',timeoutMs:15000});
  await tab.playwright.getByText('불러오는 중',{exact:true}).first().waitFor({state:'hidden',timeoutMs:15000});
  for(const loading of await tab.playwright.getByText('불러오는 중입니다.',{exact:true}).all())await loading.waitFor({state:'hidden',timeoutMs:20000});
  for(const text of ['로드 중','멤버 목록을 불러오는 중'])for(const loading of await tab.playwright.getByText(text,{exact:true}).all())await loading.waitFor({state:'hidden',timeoutMs:20000});
  // Streaming route skeletons have no heading. Never review them as a painted page.
  // Print-only routes use the observed article table, never an arbitrary body.
  if(!['h1,h2','article.print-paper table','section.luxe-login-form-zone'].includes(readySelector))throw new Error('Use an observed heading, expert access form section or print-paper table readiness target.');
  if(readySelector==='section.luxe-login-form-zone')for(const text of ['초대를 확인하고 있습니다.','잠시 기다려 주십시오.'])for(const loading of await tab.playwright.getByText(text,{exact:true}).all())await loading.waitFor({state:'hidden',timeoutMs:20000});
  await tab.playwright.locator(readySelector).first().waitFor({state:'visible',timeoutMs:20000});
  // Font loading can change line wrapping and the document height after the
  // form first becomes visible. Record only the settled font layout.
  await tab.playwright.evaluate(async()=>{await document.fonts.ready;return document.fonts.status;});
  const dom=await tab.playwright.domSnapshot();
  if(/Runtime (?:TypeError|Error)|Build Error|일시적인 오류가 발생했습니다/.test(dom)) return {route:target.route,error:'Runtime error',dom};
  const measure=()=>tab.playwright.evaluate(()=>({actualURL:location.href,theme:document.documentElement.dataset.theme||document.documentElement.className,viewport:[innerWidth,innerHeight],documentHeight:document.documentElement.scrollHeight,windowY:scrollY,rootBounds:{rootOverflowY:getComputedStyle(document.documentElement).overflowY,bodyOverflowY:getComputedStyle(document.body).overflowY,rootClientHeight:document.documentElement.clientHeight,bodyTop:document.body.getBoundingClientRect().top,bodyBottom:document.body.getBoundingClientRect().bottom,bodyScrollHeight:document.body.scrollHeight},headings:[...document.querySelectorAll('h1,h2')].map(e=>e.innerText),body:document.body.innerText,horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2,scrolls:[...document.querySelectorAll('*')].filter(e=>e.clientHeight>100&&((e.tagName==='MAIN'||e.id==='main-content')||(e.scrollHeight>e.clientHeight+3&&/auto|scroll/.test(getComputedStyle(e).overflowY)))).map(e=>({tag:e.tagName,id:e.id,overflowY:getComputedStyle(e).overflowY,height:e.clientHeight,total:e.scrollHeight,top:e.scrollTop,rect:{x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}})).filter(e=>e.rect.width>250).sort((a,b)=>Number(b.tag==='MAIN')-Number(a.tag==='MAIN')||b.rect.width-a.rect.width)}));
  const start=await measure(),dir=root+'/'+product+'-pages/screens',key=target.route.replace(/[^a-zA-Z0-9-]/g,'_')+'-'+role;
  const s=start.scrolls.find(e=>e.tag==='MAIN'||e.id==='main'||e.id==='main-content')??start.scrolls[0]??{rect:{x:0,y:0,width:start.viewport[0],height:start.viewport[1]}};
  // Keep a gutter for actual nested scroll containers. Naturally scrolling
  // pages need a point inside the visible page, not outside a narrow form.
  const nestedScroll=/auto|scroll/.test(s.overflowY??'')&&s.total>s.height+3;
  const visibleTop=Math.max(25,s.rect.y),visibleBottom=Math.min(start.viewport[1]*0.8,s.rect.y+s.rect.height);
  // A bottom navigation bar can consume wheel events. Keep the gutter point
  // in the middle of visible content, including naturally scrolling MAINs.
  const point=[nestedScroll?Math.max(25,Math.min(start.viewport[0]-25,s.rect.x+20)):start.viewport[0]/2,visibleTop<visibleBottom?(visibleTop+visibleBottom)/2:start.viewport[1]*0.45];
  await tab.scroll(point,'up',300); await tab.getAXState({emit:false});
  const screenshots=[],scrollEvidence=[];
  for(let i=0;i<limit;i++) {
    const at=await measure();
    const state={windowY:at.windowY,documentHeight:at.documentHeight,rootBounds:at.rootBounds,scrolls:at.scrolls};
    if(i&&JSON.stringify(state)===JSON.stringify(scrollEvidence.at(-1)))break;
    const file=dir+'/'+key+'-'+i+'.png'; await fs.writeFile(file,await tab.getScreenshot({emit:false})); screenshots.push(file); scrollEvidence.push(state);
    const primary=at.scrolls.filter(e=>e.tag==='MAIN'||e.id==='main'||e.id==='main-content');
    if(at.windowY+at.viewport[1]>=at.documentHeight-3&&primary.every(e=>e.top+e.height>=e.total-3))break;
    await tab.scroll(point,'down',.65);await tab.getAXState({emit:false});
  }
  const end=scrollEvidence.at(-1),last=await measure();
  const record={route:target.route,url:target.url,role,...start,readySelector,screenshots,end,scrollEvidence,captureMode:'sequential-overlapping-scrolled-viewport',capturedAt:new Date().toISOString(),visualReview:'pending-human-or-agent-image-review',horizontalScope:'Default left position. Wide tables require separate far-right observations.',loadingTextPresent:/^\s*(?:불러오는 중(?:입니다\.)?|로드 중|멤버 목록을 불러오는 중|초대를 확인하고 있습니다\.|잠시 기다려 주십시오\.)\s*$/m.test(last.body)};
  await fs.writeFile(dir+'/'+key+'.json',JSON.stringify(record,null,2)+'\n');
  await fs.writeFile(dir+'/'+key+'.txt',await tab.playwright.domSnapshot());
  return {product,role,route:target.route,url:target.url,actualURL:start.actualURL,headings:start.headings,images:screenshots.length,files:screenshots,end,loadingTextPresent:record.loadingTextPresent};
}
