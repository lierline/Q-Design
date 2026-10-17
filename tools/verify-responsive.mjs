// Browser checks of real product fixtures, without authentication or business APIs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {loadIconRuntime} from './app-icon-runtime.mjs';
import {browserLaunchOptions} from './browser-launch.mjs';
const root='D:/Claude/Q-Design',out='D:/Claude/tmp/qd-responsive';
fs.mkdirSync(out,{recursive:true});
const {chromium}=loadIconRuntime('D:/Claude/Q-Atelier');
const server=spawn(process.execPath,['tools/serve-component-workbench.mjs'],{cwd:root,env:{...process.env,QD_AUDIT_PORT:'4829'},stdio:['ignore','pipe','pipe'],windowsHide:true});
let browser;
try{
  await new Promise((resolve,reject)=>{server.stdout.on('data',()=>resolve());server.once('error',reject);server.once('exit',code=>reject(Error('Workbench server exited: '+code)));});
  browser=await chromium.launch(browserLaunchOptions());
  const results=[];let drawerChecks=0;
  for(const product of ['atelier','maison','carnet'])for(const theme of ['light','dark']){
    const page=await browser.newPage();
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    for(const [width,height] of [[320,568],[375,667],[768,1024],[1024,768],[1440,900],[1920,1080],[640,320]]){
      await page.setViewportSize({width,height});
      await page.goto(`http://127.0.0.1:4829/preview/components/${product}/?view=responsive&theme=${theme}`);
      await page.getByTestId('responsive-cases').waitFor();
      await page.evaluate(()=>document.fonts.ready);
      assert.deepEqual(errors,[],product+' fixture errors');
      const measured=await page.evaluate(()=>{
        const sizes={};
        for(const name of ['wide','narrow','tiny','stats','long','table','editable-table','textarea','select','tabs','choice','choice-group','empty','skeleton','progress']){
          const el=document.querySelector(`[data-testid="responsive-${name}"]`);
          sizes[name]={client:el.clientWidth,scroll:el.scrollWidth};
        }
        const grid=document.querySelector('[data-testid="responsive-wide"] > div');
        return {pageOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,sizes,columns:getComputedStyle(grid).gridTemplateColumns};
      });
      if(measured.pageOverflow>1||Object.values(measured.sizes).some(s=>s.scroll>s.client+1)){
        await page.screenshot({path:`${out}/${product}-failure.png`,fullPage:true});
        const overflow=await page.evaluate(()=>[...document.querySelectorAll('main *')].filter(e=>e.scrollWidth>e.clientWidth+1).slice(0,20).map(e=>({tag:e.tagName,class:e.className,id:e.getAttribute('data-testid'),width:e.clientWidth,scroll:e.scrollWidth,whiteSpace:getComputedStyle(e).whiteSpace,minWidth:getComputedStyle(e).minWidth})));
        fs.writeFileSync(`${out}/${product}-overflow.json`,JSON.stringify(overflow,null,2));
      }
      assert(measured.pageOverflow<=1,JSON.stringify({product,theme,width,measured}));
      for(const [name,size]of Object.entries(measured.sizes))assert(size.scroll<=size.client+1,JSON.stringify({product,theme,width,name,size}));
      const editable=await page.getByTestId('responsive-editable-table').evaluate(el=>({inputs:[...el.querySelectorAll('input')].map(input=>input.clientWidth),table:el.querySelector('table').clientWidth,frame:el.clientWidth}));
      assert.equal(editable.inputs.length,4,'Editable table must contain real product inputs');
      assert(editable.inputs.every(size=>size>=120),JSON.stringify({product,theme,width,editable}));
      assert(editable.table>editable.frame,'Editable table must scroll inside its frame');
      if(product==='maison'){
        const labels=await page.getByTestId('responsive-choice-group').locator('label > span').evaluateAll(elements=>elements.map(el=>{const range=document.createRange();range.selectNodeContents(el);return{text:el.textContent,lines:new Set([...range.getClientRects()].map(rect=>rect.top.toFixed(1))).size};}));
        assert.equal(labels.length,5,'Real five-option choice group must render');
        for(const label of labels)assert.equal(label.lines,1,'Short choice must stay on one line: '+JSON.stringify(label));
        const choiceColumns=await page.getByTestId('responsive-choice-group').getByRole('radiogroup').evaluate(el=>getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length);
        assert.equal(choiceColumns,width===320?2:3,'Choice columns must follow the 333px parent, not the viewport');
      }
      if(width===1440){
        assert.equal(measured.columns.trim().split(/\s+/).length,4,product+' wide layout must retain four columns');
        await page.addStyleTag({content:':root{--qd-grid-min-width:500px !important}'});
        const columns=await page.evaluate(()=>getComputedStyle(document.querySelector('[data-testid="responsive-wide"] > div')).gridTemplateColumns.trim().split(/\s+/).length);
        assert.equal(columns,2,product+' central minimum must reach existing grids');
        if(product==='maison'){
          await page.addStyleTag({content:':root{--qd-choice-min-width:200px !important}'});
          const count=await page.getByTestId('responsive-choice-group').getByRole('radiogroup').evaluate(el=>getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length);
          assert.equal(count,1,'Central choice minimum must reach real choice groups');
        }
      }
      await page.getByTestId('responsive-open').getByRole('button').click();
      const dialog=page.getByRole('dialog');await dialog.waitFor();
      const bounds=await dialog.evaluate(el=>{const b=el.getBoundingClientRect();return{left:b.left,right:b.right,top:b.top,bottom:b.bottom,scroll:el.scrollHeight,client:el.clientHeight};});
      assert(bounds.left>=-1&&bounds.right<=width+1&&bounds.top>=-1&&bounds.bottom<=height+1,JSON.stringify({product,theme,width,height,bounds}));
      const close=dialog.getByRole('button',{name:'검토 저장',exact:true});
      await close.scrollIntoViewIfNeeded();await close.click();await dialog.waitFor({state:'hidden'});
      for(const side of ['right','bottom']){
        const trigger=page.getByTestId('responsive-drawer-'+side);
        if(await trigger.count()===0)continue;
        await trigger.getByRole('button').click();
        const panel=page.getByRole('dialog');await panel.waitFor();
        await panel.evaluate(async el=>{await Promise.all(el.getAnimations().map(animation=>animation.finished.catch(()=>{})));});
        const box=await panel.boundingBox();
        assert(box&&box.x>=-1&&box.y>=-1&&box.x+box.width<=width+1&&box.y+box.height<=height+1,JSON.stringify({product,theme,width,height,side,box}));
        const dismiss=panel.getByRole('button',{name:'패널 닫기',exact:true});
        await dismiss.scrollIntoViewIfNeeded();await dismiss.click();await panel.waitFor({state:'hidden'});drawerChecks++;
      }
      results.push({product,theme,width,height,...measured,dialog:bounds});
      if(theme==='dark'&&width===375)await page.screenshot({path:`${out}/${product}-phone.png`,fullPage:true});
    }
    await page.close();
  }
  fs.writeFileSync(out+'/results.json',JSON.stringify({cases:results.length,passed:results.length,results},null,2)+'\n');
  console.log(JSON.stringify({cases:results.length,passed:results.length,drawerChecks,products:3,themes:2,centralMutationVerified:true,output:out}));
}finally{if(browser)await browser.close();server.kill();}
