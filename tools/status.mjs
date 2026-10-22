// =============================================================================
// 판 상태: 네 제품이 받은 Q-Design 판을 한 줄씩 봅니다 (2026-10-16 · 군살 빼기 2단계)
// =============================================================================
//   node tools/status.mjs             제품 원격을 받아 온 뒤 봅니다(git fetch)
//   node tools/status.mjs --no-fetch  받아 오지 않고 마지막으로 받아 둔 원격과 견줍니다
//
// 아무것도 쓰지 않습니다. 제품마다 판 파일(sync.mjs --write 가 씀)을 읽어 세 가지를 맞춰 봅니다.
//   1. 판 파일 = 지금 정본인가      다르면 «뒤처짐» 과 받은 판 · 지금 판의 날짜를 보여 줍니다
//   2. 판 파일 = 제품 사본인가      다르면 사본을 손으로 고쳤거나, 내보낸 뒤 판 파일을 안 쓴 것입니다
//   3. 판 파일이 원격 main 에 있나  main 이 곧 운영인 제품이 많아, 원격에 없으면 운영은 아직 옛 판입니다
// 사본 대조는 sync.mjs 와 같은 함수(줄바꿈을 LF 로 맞춘 지문)로 합니다.
// =============================================================================

import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRODUCTS, HOLD } from './sync-parts.mjs';
import { 읽기, bodyOf, 머리지문, sha, 조각본문, 제품조각, 들어온커밋, 판읽기, 묶음지문, 부품파일 } from './sync.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.some((a) => a !== '--no-fetch')) throw new Error('Use status.mjs [--no-fetch].');
const fetch = !args.includes('--no-fetch');

const git = (cwd, list) => {
  const r = spawnSync('git', ['-C', cwd, ...list], { encoding: 'utf8', maxBuffer: 64 << 20 });
  return r.status === 0 ? r.stdout : null;
};
const 짧게 = (c) => (c ? c.slice(0, 7) : '커밋 전');

const head = (git(ROOT, ['log', '-1', '--format=%h %cs']) ?? '').trim();
console.log(`Q-Design 판 상태  (Q-Design ${head}${fetch ? '' : ' · 원격은 마지막으로 받아 둔 것'})`);
console.log('');

let 볼곳 = 0;
const 자세히 = [];
for (const [who, info] of Object.entries(PRODUCTS)) {
  const slots = 제품조각(who);
  const 판 = 판읽기(who);
  if (!판) {
    볼곳++;
    console.log(`${who.padEnd(10)} 판 파일 없음  (${info.version})  받는 조각 ${slots.length}`);
    continue;
  }
  if (fetch) git(info.root, ['fetch', '-q', 'origin']);
  const 받은 = new Map(판.parts.map((p) => [p.file, p]));
  let 최신 = 0;
  const 뒤처짐 = [], 새조각 = [], 다른사본 = [], 안보냄 = [];
  for (const { part, path, file } of slots) {
    const now = sha(조각본문(part, 읽기(join(ROOT, part.src))));
    const got = 받은.get(file);
    받은.delete(file);
    if (!got) { 새조각.push(part.name); continue; }
    /* 2. 판 파일 = 제품 사본 */
    const text = existsSync(path) ? 읽기(path) : null;
    if (!text || sha(bodyOf(text, part.lang)) !== got.sha256 || 머리지문(text) !== got.sha256) 다른사본.push(file);
    /* 1. 판 파일 = 지금 정본 */
    if (got.sha256 === now) { 최신++; continue; }
    const 지금 = 들어온커밋(part, now);
    const 묶음 = HOLD[who] && (HOLD[who].parts === '*' || HOLD[who].parts.includes(part.name)) && !HOLD[who].except?.includes(part.name);
    뒤처짐.push(`${part.name}  받은 판 ${got.date ?? '날짜 모름'} ${짧게(got.since)} · 지금 ${지금?.date ?? '커밋 전'} ${짧게(지금?.since)}${묶음 ? '  (묶어 둠)' : ''}`);
  }
  for (const file of 받은.keys()) 안보냄.push(file);
  /* 공용 부품 파일(2026-10-22): 판 파일 = 제품 파일 · 판 파일 = 지금 정본 */
  const short = { 'Q-Atelier': 'atelier', 'Q-Works': 'maison', 'Q-Forge': 'carnet' }[who];
  const 적힌부품 = new Map((판.implementations ?? []).map((p) => [p.file, p.sha256]));
  const 부품 = 부품파일(who), 부품다름 = [], 부품뒤처짐 = [];
  for (const file of 부품) {
    const got = 적힌부품.get(file);
    const path = join(info.root, file);
    if (!got || !existsSync(path) || sha(읽기(path)) !== got) 부품다름.push(file);
    else if (sha(읽기(join(ROOT, 'patterns/component-implementations', short, file))) !== got) 부품뒤처짐.push(file);
  }
  /* 3. 판 파일이 커밋 · 원격 main 에 있나 */
  const 판글 = readFileSync(join(info.root, info.version), 'utf8');
  const 커밋안됨 = (git(info.root, ['status', '--porcelain', '--', info.version]) ?? '').trim() !== '';
  const 원격판 = git(info.root, ['show', `origin/main:${info.version}`]);
  const 원격 = 원격판 === null ? '원격에 없음' : 원격판.replace(/\r\n/g, '\n') === 판글.replace(/\r\n/g, '\n') ? '원격 같음' : '원격과 다름';
  const 지문맞음 = 묶음지문(판.parts) === 판.fingerprint;

  const 문제 = 뒤처짐.length + 새조각.length + 다른사본.length + 안보냄.length + 부품다름.length + 부품뒤처짐.length + (커밋안됨 ? 1 : 0) + (원격 === '원격 같음' ? 0 : 1) + (지문맞음 ? 0 : 1);
  if (문제) 볼곳++;
  const 조각 = `조각 ${slots.length} · 최신 ${최신}` + (뒤처짐.length ? ` · 뒤처짐 ${뒤처짐.length}` : '') + (부품.length ? ` · 부품 ${부품.length - 부품다름.length - 부품뒤처짐.length}/${부품.length}` : '');
  console.log(`${who.padEnd(10)} 판 ${판.fingerprint}  ${조각.padEnd(34)} ${커밋안됨 ? '커밋 안 됨 · ' : ''}${원격}`);
  if (부품다름.length) 자세히.push(`  ${who}  판 파일과 다른 부품 파일  ${부품다름.join(' · ')}  (제품에서 고쳤거나 판 파일에 아직 안 적었습니다)`);
  if (부품뒤처짐.length) 자세히.push(`  ${who}  정본이 앞선 부품 파일  ${부품뒤처짐.join(' · ')}  (extract-all --sync 로 받습니다)`);
  for (const line of 뒤처짐) 자세히.push(`  ${who}  뒤처짐  ${line}`);
  if (새조각.length) 자세히.push(`  ${who}  판 파일에 없는 조각  ${새조각.join(' · ')}  (sync.mjs --write 로 받습니다)`);
  if (안보냄.length) 자세히.push(`  ${who}  더는 보내지 않는 조각  ${안보냄.join(' · ')}`);
  if (다른사본.length) 자세히.push(`  ${who}  판 파일과 다른 사본  ${다른사본.join(' · ')}  (손으로 고쳤거나 판 파일을 안 썼습니다)`);
  if (!지문맞음) 자세히.push(`  ${who}  판 파일의 묶음 지문이 조각 목록과 맞지 않습니다`);
}

if (자세히.length) {
  console.log('');
  for (const line of 자세히) console.log(line);
}
console.log('');
console.log(볼곳 ? `확인할 제품 ${볼곳}곳` : '네 제품 모두 지금 정본을 받았고 원격에도 올라가 있습니다');
