// Synthetic, additive records for real-screen review. This tool has no remote mode.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const config=readFileSync(resolve(root,'../Q-Works/.env.local'),'utf8');
const target=new URL(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)$/m.exec(config)?.[1].trim().replace(/^["']|["']$/g,''));
if(!['127.0.0.1','localhost'].includes(target.hostname)||target.port!=='54331')throw new Error('Only the named local Maison stack is allowed.');
if(process.argv.slice(2).some(arg=>arg!=='--write'))throw new Error('Use --write to add local audit records.');
const sql=`BEGIN;
DO $fixture$
DECLARE t uuid; u uuid; d uuid; req uuid; supplier uuid;
BEGIN
  SELECT tenant_id,id,department_id INTO STRICT t,u,d FROM public.users WHERE email='dev@q-maison.local' AND is_active;
  SELECT id,supplier_id INTO STRICT req,supplier FROM public.purchase_requests WHERE id='5a3b1e00-0043-4000-8000-000000000001' AND tenant_id=t;
  -- Every inserted record has the dedicated 5a3b1e10 audit prefix. Existing rows are never updated.
  INSERT INTO public.doc_dispatch_requests(id,tenant_id,request_no,kind,department_id,requester_id,purpose,recipient,requested_on,approval_status,approved_at,approved_by,created_by)
  VALUES('5a3b1e10-0001-4000-8000-000000000001',t,'QD-LOCAL-EEF-001','dispatch',d,u,'Q-Design 로컬 화면 검증용 예시','로컬 검증 대상',current_date,'approved',now(),u,u) ON CONFLICT(id) DO NOTHING;
  INSERT INTO public.doc_dispatch_items(id,tenant_id,request_id,seq,document_no,title,provide_form,dispatched_on,dispatched_by,security_checked,confirmed_by)
  VALUES('5a3b1e10-0002-4000-8000-000000000001',t,'5a3b1e10-0001-4000-8000-000000000001',1,'QD-LOCAL-DOC-001','Q-Design 로컬 검증용 문서','전자파일',current_date,u,true,u) ON CONFLICT(id) DO NOTHING;
  INSERT INTO public.doc_dispatch_reports(id,tenant_id,report_no,request_id,department_id,return_note,followup,approval_status,approved_at,approved_by,created_by)
  VALUES('5a3b1e10-0003-4000-8000-000000000001',t,'QD-LOCAL-EER-001','5a3b1e10-0001-4000-8000-000000000001',d,'화면 검증용 예시. 외부 발송 없음.','로컬 UI 확인 후 유지되는 합성 데이터','approved',now(),u,u) ON CONFLICT(id) DO NOTHING;
  INSERT INTO public.purchase_quotes(id,tenant_id,quote_no,request_id,supplier_id,quoted_on,total_amount,notes,status,created_by)
  VALUES('5a3b1e10-0004-4000-8000-000000000001',t,'QD-LOCAL-PQT-001',req,supplier,current_date,10000,'Q-Design 로컬 화면 검증용 예시','selected',u) ON CONFLICT(id) DO NOTHING;
  INSERT INTO public.purchase_orders(id,tenant_id,order_no,request_id,quote_id,supplier_id,ordered_on,due_on,recv_company,send_company,items,total_amount,request_note,status,approved_at,approved_by,created_by)
  VALUES('5a3b1e10-0005-4000-8000-000000000001',t,'QD-LOCAL-POD-001',req,'5a3b1e10-0004-4000-8000-000000000001',supplier,current_date,current_date+7,'로컬 검증 수신처','로컬 검증 발신처','[{"name":"화면 검증 품목","material":"예시","spec":"검증용","qty":1,"unit":"EA","unit_price":10000,"amount":10000,"remark":"실제 발주 아님"}]',10000,'실제 발주 및 외부 발송 없는 로컬 예시','approved',now(),u,u) ON CONFLICT(id) DO NOTHING;
  INSERT INTO public.recalls(id,tenant_id,recall_no,product_name,reason,target_qty,notes,approval_status,approved_at,approved_by,created_by,writing_dept_id,targets,reasons,review_conclusion)
  VALUES('5a3b1e10-0006-4000-8000-000000000001',t,'QD-LOCAL-RCA-001','화면 검증 품목','로컬 UI 상태 확인',10,'실제 회수 없는 합성 데이터','approved',now(),u,u,d,'[{"product_model":"화면 검증 품목","item_type":"예시","lot_no":"QD-LOCAL-LOT","ship_period":"로컬 검증","ship_to":"검증 대상","ship_no":"QD-LOCAL-SHP"}]','[{"recall_reason":"UI 상태 확인","incident_detail":"실제 사건 없는 합성 데이터","request_qty":"10","confirm_channel":"로컬","same_item_impact":"없음"}]','실제 회수가 아닌 화면 검증') ON CONFLICT(id) DO NOTHING;
  INSERT INTO public.recall_notices(id,tenant_id,recall_id,notice_no,notice_on,recipient,subject,product_info,reason,approval_status,approved_at,approved_by,distributed_on,distributed_by,created_by)
  VALUES('5a3b1e10-0007-4000-8000-000000000001',t,'5a3b1e10-0006-4000-8000-000000000001','QD-LOCAL-RCN-001',current_date,'로컬 검증 대상','로컬 화면 검증용 회수 공고','합성 검증 품목','UI 상태 확인','approved',now(),u,current_date,u,u) ON CONFLICT(id) DO NOTHING;
  INSERT INTO public.recall_reports(id,tenant_id,recall_id,report_no,overview,conclusion,qty_target,qty_recovered,qty_unrecovered,approval_status,approved_at,approved_by,created_by)
  VALUES('5a3b1e10-0008-4000-8000-000000000001',t,'5a3b1e10-0006-4000-8000-000000000001','QD-LOCAL-RCR-001','Q-Design 로컬 화면 검증용 예시','실제 회수 없는 합성 데이터',10,7,3,'approved',now(),u,u) ON CONFLICT(id) DO NOTHING;
  INSERT INTO public.recall_recoveries(id,tenant_id,recall_id,recovered_on,source,qty,note,created_by)
  VALUES('5a3b1e10-0009-4000-8000-000000000001',t,'5a3b1e10-0006-4000-8000-000000000001',current_date,'로컬 검증 대상',7,'실제 회수 없는 합성 데이터',u) ON CONFLICT(id) DO NOTHING;
  INSERT INTO public.concessions(id,tenant_id,concession_no,requested_on,item_name,defect_desc,quantity,kind,notes,approval_status,approved_at,approved_by,created_by,writing_dept_id,work_completed_at,work_completed_by,items,reasons)
  VALUES('5a3b1e10-0010-4000-8000-000000000001',t,'QD-LOCAL-CRF-001',current_date,'로컬 검증 품목','실제 부적합 없는 합성 데이터',10,'concession','Q-Design 로컬 화면 검증용 예시','approved',now(),u,u,d,now(),u,'[{"product_model":"로컬 검증 품목","item_type":"예시","lot_no":"QD-LOCAL-LOT","qty":"10","id_status":"식별됨","isolated":"로컬 예시"}]','[{"request_reason":"UI 확인","request_content":"실제 작업 없는 합성 데이터","request_qty":"10","handling_method":"로컬 검증","remark":"화면 검증 전용"}]') ON CONFLICT(id) DO NOTHING;
  INSERT INTO public.concession_reports(id,tenant_id,concession_id,kind,report_no,department_id,result,qc_effect,handling_overview,result_detail,approval_status,approved_at,approved_by,created_by)
  VALUES('5a3b1e10-0011-4000-8000-000000000001',t,'5a3b1e10-0010-4000-8000-000000000001','concession','QD-LOCAL-CRR-001',d,'로컬 검증 완료','no','Q-Design 로컬 화면 검증용 예시','실제 작업 없는 합성 데이터','approved',now(),u,u) ON CONFLICT(id) DO NOTHING;
END $fixture$;
SELECT 'local-audit-fixtures-ready';
COMMIT;`;
if(!process.argv.includes('--write')){console.log('Dry run:11 additive local synthetic records, no existing updates. Pass --write to apply.');process.exit(0);}
const result=execFileSync('docker',['exec','-i','supabase_db_q-works','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At'],{input:sql,encoding:'utf8'});
writeFileSync(join(root,'reviews/maison-pages-fixtures.json'),JSON.stringify({createdAt:new Date().toISOString(),database:'local Docker supabase_db_q-works',prefix:'5a3b1e10',rows:11,scope:'additive synthetic fixtures only; no existing updates, no external sends, normal application authentication retained',confirmation:result.includes('local-audit-fixtures-ready')},null,2)+'\n');
console.log(result.trim());
