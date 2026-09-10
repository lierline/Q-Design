// =============================================================================
// 화면 글의 «종결» 검사 · 집안 말투는 합니다체다
// =============================================================================
//   node tools/check-voice.mjs            상한을 넘으면 exit 1
//   node tools/check-voice.mjs --list     걸린 문장을 전부 찍는다
//   node tools/check-voice.mjs --record   지금 값을 상한으로 새로 찍는다
//
// ── 왜 이 검사가 있나 ────────────────────────────────────────────────────────
// 2026-09-09 감사에서 Q-Sonar 한 화면 «안»에서 해라체와 합니다체가 갈렸습니다.
// /targets 는 위쪽 문단이 「…가리지 않는다.」인데 아래쪽이 「…넘어갑니다.」였습니다.
// 말투가 갈리면 읽는 사람은 «누가 말하고 있나»를 매번 다시 정합니다.
//
// 어느 쪽이 집안 말투인지는 소스가 답했습니다. 문장꼴 문자열 중 합니다체 비율이
// Q-Atelier 89% · Q-Forge 95% · Q-Sonar 72% 였습니다. 어긋난 쪽이 하나뿐이라
// 합니다체로 모읍니다. 규칙 전문은 docs/21-voice-canon.md 에 있습니다.
//
// ── 판정을 «좁게» 잡는 이유 ──────────────────────────────────────────────────
// 시제품에서 「자」 「라」 「까」 「네」를 종결로 보았더니 「공급자」 「품질책임자」
// 「같습니까?」가 잡혀 Q-Atelier 50건 중 36건이 오탐이었습니다.
// **거짓 경보를 한 번 내면 다음부터 아무도 이 검사를 안 봅니다.**
// 그래서 종결은 「다」 하나만 봅니다. 「니다」로 끝나면 합니다체입니다.
//
// 🔑 재기 전에 «자기 검출력»을 먼저 시험합니다. 네 줄을 넣어 정확히 1건이 아니면
//    아무것도 재지 않고 exit 2 로 죽습니다. 초록불을 내는 빈 그물이 가장 위험합니다.
// =============================================================================

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const 나 = fileURLToPath(new URL('.', import.meta.url));
const 상한파일 = join(나, 'voice-baseline.json');
const 예외파일 = join(나, 'voice-allow.json');

const 저장소 = {
  'Q-Atelier': { root: 'D:/Claude/Q-Atelier', dirs: ['app', 'components'] },
  'Q-Sonar': { root: 'D:/Claude/Lead-Radar', dirs: ['src'] },
  'Q-Forge': { root: 'D:/Claude/DHR', dirs: ['app', 'components', 'lib'] },
};

const 건너뛸폴더 = new Set(['node_modules', '.next', '.git', 'dist', 'build', 'coverage', 'public']);

/*
 * 🔴 카피 «키 목록» 을 두지 않는다.
 *    처음에는 why · sub · label … 열 개를 적어 두고 그 키의 값만 봤는데,
 *    lib/diagnostics/mfds-probe.ts 의 `IMPACT` 는 키 이름이 달라 통째로 빠졌다.
 *    그것은 /diagnostics 화면에 그대로 그려지는 글이다.
 *    이름으로 고르면 이름을 안 맞춘 자리가 조용히 검사 밖이 된다.
 *    그래서 «한글이 든 문자열» 이면 다 본다.
 */

/* ─────────────────────────────────────────────────────────────────────────────
   주석 지우기.  {/* *​/} → /* *​/ → 줄 첫머리 //  순서를 지킨다.
   ⚠ 문자열 «안»의 `//` 를 지우면 안 된다. 그래서 줄 첫머리만 본다
     (`https://` 가 통째로 사라지던 사고를 여기서 막는다).
───────────────────────────────────────────────────────────────────────────── */
function 주석없이(src) {
  return src
    .replace(/\r\n/g, '\n')
    .replace(/\{\/\*(?:(?!\*\/)[\s\S])*?\*\/\}/g, ' ')
    .replace(/\/\*(?:(?!\*\/)[\s\S])*?\*\//g, ' ')
    .split('\n')
    .map(줄주석없이)
    .join('\n');
}

/*
 * 한 줄에서 `//` 뒤를 자른다. 따옴표 «안»의 `//` 는 자르면 안 된다
 * (`https://…` 가 통째로 사라진다). 그래서 따옴표 상태를 세며 걷는다.
 */
function 줄주석없이(줄) {
  let 따옴표 = '';
  for (let i = 0; i < 줄.length; i += 1) {
    const c = 줄[i];
    if (따옴표) {
      if (c === '\\\\') i += 1;
      else if (c === 따옴표) 따옴표 = '';
      continue;
    }
    if (c === "'" || c === '"' || c === '`') 따옴표 = c;
    else if (c === '/' && 줄[i + 1] === '/') return 줄.slice(0, i);
  }
  return 줄;
}

/* ─────────────────────────────────────────────────────────────────────────────
   해라체 판정.  문장 끝이 「다」이고 「니다」가 아니면 해라체.
   뒤에 마침표·물음표·느낌표·따옴표·중괄호가 붙어도 종결로 본다.
───────────────────────────────────────────────────────────────────────────── */
/*
 * 🔴 「」 를 종결로 보면 안 된다. 문장 «안»의 인용이 걸린다.
 *    실제로 /diagnostics 의 「동시에 쏘면 초당 한도에 걸려 「전부 죽었다」처럼
 *    보입니다」가 잡혔다. 그 문장은 합니다체이고, 「」 안은 증상을 흉내 낸 것이다.
 */
const 종결 = /([가-힣][가-힣\s·«»‘’“”()'\"]{1,60}다)(?=[.!?\"'`}\n]|$)/g;

/*
 * 「다」로 끝나지만 종결어미가 «아닌» 것들. 실측으로 모았다.
 *   둘 다 · 모두 다   → 앞이 공백이면 부사 「다」다
 *   생산 로트마다      → 「마다」는 조사
 *   서면보다           → 「보다」도 조사
 * 이 셋을 안 빼면 Q-Atelier 34건 중 셋이 오탐이었다. 거짓 경보를 한 번 내면
 * 다음부터 아무도 이 검사를 안 본다.
 */
const 조사꼬리 = [' 다', '마다', '보다'];

function 해라체들(글) {
  const 나온것 = [];
  for (const m of 글.matchAll(종결)) {
    const 문장 = m[1].trim();
    if (문장.endsWith('니다')) continue;
    if (조사꼬리.some((꼬리) => 문장.endsWith(꼬리))) continue;
    /* 「…같다」 같은 한 낱말은 문장이 아니다. 공백이 하나는 있어야 문장으로 본다 */
    if (!/\s/.test(문장)) continue;
    나온것.push(문장.replace(/\s+/g, ' '));
  }
  return 나온것;
}

/* ─────────────────────────────────────────────────────────────────────────────
   볼 자리 셋.  (a) 태그 사이 글  (b) 사람이 읽는 속성  (c) 카피 키의 문자열
───────────────────────────────────────────────────────────────────────────── */
function 화면글(src) {
  const 글 = 주석없이(src);
  const 조각 = [];

  /* (a) `>글<` · JSX 표현식({…})은 값이라 여기서는 못 본다 */
  for (const m of 글.matchAll(/>([^<>{}]*[가-힣][^<>{}]*)</g)) 조각.push(m[1]);

  /* (b) 사람이 읽는 속성 */
  for (const m of 글.matchAll(/(?:title|placeholder|aria-label)=["']([^"']*[가-힣][^"']*)["']/g)) 조각.push(m[1]);

  /* (c) 한글이 든 문자열 리터럴 전부 */
  for (const m of 글.matchAll(/'([^'\n]*[가-힣][^'\n]*)'/g)) 조각.push(m[1]);
  for (const m of 글.matchAll(/"([^"\n]*[가-힣][^"\n]*)"/g)) 조각.push(m[1]);

  /* (d) 백틱 안의 글 · 템플릿 문자열도 사람이 읽는다 */
  for (const m of 글.matchAll(/`([^`]*[가-힣][^`]*)`/g)) 조각.push(m[1]);

  return 조각;
}

/* ── 자기 검출력 시험 · 통과 못 하면 아무것도 재지 않는다 ────────────────────── */
function 자기시험() {
  const 표본 = [
    '<p>업종을 가리지 않는다.</p>',
    '<p>업종을 가리지 않습니다.</p>',
    '<p>서면과 같습니까?</p>',
    '<p>기본 공급자</p>',
  ].join('\n');
  const 잡힌것 = 화면글(표본).flatMap(해라체들);
  if (잡힌것.length !== 1 || !잡힌것[0].includes('가리지 않는다')) {
    console.error('🔴 자기 검출력 시험 실패 · 아무것도 재지 않습니다.');
    console.error('   기대: 1건(「업종을 가리지 않는다」)');
    console.error('   실제:', 잡힌것.length, '건', JSON.stringify(잡힌것));
    process.exit(2);
  }
  /* 카피 키와 속성도 실제로 보는지 함께 시험한다 */
  const 둘째 = 화면글("  why: '수요가 뚜렷하다.',\n  <i title=\"확률이 높다\" />").flatMap(해라체들);
  if (new Set(둘째).size !== 2) {
    console.error('🔴 자기 검출력 시험 실패 · 문자열/속성을 못 봅니다.', JSON.stringify(둘째));
    process.exit(2);
  }
  /* 줄 끝 주석은 화면 글이 아니다 · 코드 옆 메모가 잡히면 안 된다 */
  const 넷째 = 화면글("  const x = `reg-1`; // 대체키를 쓴다\n  const u = 'https://a.b/c 를 연다';").flatMap(해라체들);
  if (넷째.length !== 1 || !넷째[0].includes('를 연다')) {
    console.error('🔴 자기 검출력 시험 실패 · 줄 끝 주석 처리가 틀렸습니다.', JSON.stringify(넷째));
    process.exit(2);
  }

  /* 조사 꼬리를 종결로 잘못 읽지 않는지 · 이쪽이 무너지면 거짓 경보가 난다 */
  const 셋째 = 화면글('<p>둘 다</p>\n<p>생산 로트마다</p>\n<p>서면보다</p>').flatMap(해라체들);
  if (셋째.length !== 0) {
    console.error('🔴 자기 검출력 시험 실패 · 조사를 종결로 읽습니다.', JSON.stringify(셋째));
    process.exit(2);
  }
}

/* ── 파일 훑기 ──────────────────────────────────────────────────────────────── */
function 파일들(dir, out = []) {
  let 목록;
  try {
    목록 = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of 목록) {
    if (건너뛸폴더.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) 파일들(full, out);
    else if (/\.(tsx?|mjs)$/.test(name) && !name.includes('.test.')) out.push(full);
  }
  return out;
}

/* ── 본 검사 ────────────────────────────────────────────────────────────────── */
자기시험();

const 예외 = new Set(JSON.parse(readFileSync(예외파일, 'utf8')).allow.map((s) => s.trim()));
const 상한 = JSON.parse(readFileSync(상한파일, 'utf8'));
const 찍기 = process.argv.includes('--list');
const 새로찍기 = process.argv.includes('--record');

const 셈 = {};
let 나쁨 = false;

for (const [이름, { root, dirs }] of Object.entries(저장소)) {
  const 걸린것 = [];
  for (const d of dirs) {
    for (const f of 파일들(join(root, d))) {
      const src = readFileSync(f, 'utf8');
      for (const 문장 of 화면글(src).flatMap(해라체들)) {
        if (예외.has(문장.trim())) continue;
        const 줄 = `${relative(root, f).replace(/\\/g, '/')}  ${문장}`;
        if (!걸린것.includes(줄)) 걸린것.push(줄);
      }
    }
  }
  셈[이름] = 걸린것.length;
  const 한도 = 상한[이름];
  const 넘음 = 한도 === undefined || 걸린것.length > 한도;
  console.log(
    `${넘음 ? '🔴' : '  '} ${이름.padEnd(10)} 해라체 ${String(걸린것.length).padStart(4)}곳` +
      (한도 === undefined ? '  (상한 없음)' : `  상한 ${한도}`),
  );
  if (넘음) 나쁨 = true;
  if (찍기) for (const x of 걸린것) console.log('      ' + x);
}

if (새로찍기) {
  writeFileSync(상한파일, JSON.stringify(셈, null, 2) + '\n', 'utf8');
  console.log('\n상한을 새로 찍었습니다 ·', JSON.stringify(셈));
  process.exit(0);
}

if (나쁨) {
  console.log('\n화면 글은 합니다체로 끝냅니다(docs/21-voice-canon.md).');
  console.log('이름표·지표·표 머리·단추는 명사로 끝냅니다 · 그것은 이 검사에 안 걸립니다.');
  console.log('정말 그대로 두어야 하면 tools/voice-allow.json 에 «문장 전문»으로 적으십시오.');
  process.exit(1);
}
