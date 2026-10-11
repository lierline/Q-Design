import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const state = JSON.parse(fs.readFileSync('D:/Claude/tmp/qd-carnet-pages/private-state.json','utf8'));
const u = new URL(state.databaseUrl);
if(u.hostname!=='127.0.0.1'||u.port!=='55432'||u.pathname!=='/qd_carnet_visual') throw new Error('Isolated audit DB only');
const pg = createRequire('D:/Claude/DHR/package.json')('pg');
const { hashPin }=await import(pathToFileURL('D:/Claude/DHR/scripts/pin.mjs'));
const db=new pg.Client({connectionString:state.databaseUrl});await db.connect();
for(const [code,name,first] of [['910001','역할 없음 화면 시연',false],['910002','첫 비밀번호 화면 시연',true]]) {
  const row=await db.query(`insert into app_user(login_code,full_name,pin_hash,can_login,is_active,must_change_pin)
    values($1,$2,$3,true,true,$4) on conflict(login_code) do nothing returning id`,[code,name,await hashPin(state.demoPin),first]);
  if(first&&row.rows[0])await db.query("insert into user_role(user_id,role)values($1,'WORKER')",[row.rows[0].id]);
}
await db.end();
console.log('Added normal local fixtures910001(roleless),910002(first PIN required). Shared synthetic PIN retained.');
