// =============================================================================
// 정본 내보내기
// =============================================================================
//   node tools/sync.mjs          어디가 어긋났는지만 봅니다 (아무것도 안 씁니다)
//   node tools/sync.mjs --write  사본을 갱신하고, 받는 제품마다 판 파일을 씁니다
//   node tools/sync.mjs --stamp  사본은 그대로 두고 판 파일만 «지금 사본대로» 적습니다
//   node tools/status.mjs        네 제품이 받은 판을 한 줄씩 봅니다
//
// 세 저장소가 한 대장간에 있지 않으므로(각자 private repo · 패키지 매니저도 다름)
// npm 꾸러미로 나눠 쓸 수가 없습니다. 그래서 **사본을 두되 사본인 줄 알게** 합니다.
//
//   1. 사본 머리에 본문의 sha256 을 찍습니다.
//   2. 받는 쪽 검사가 그 sha 를 다시 계산해 대조합니다.
//      → 사본을 손으로 고치면 그 저장소의 검사가 웁니다.
//   3. 이 스크립트를 다시 돌리면 원본과 사본이 같은지 말해 줍니다.
//      → 원본이 앞서 나가 있으면 여기서 드러납니다.
//
// 「사본을 만들지 말자」가 최선이지만 지금 구조에서는 불가능합니다.
// 차선은 «사본이 조용히 갈리지 않게» 하는 것입니다. [[duplicated-fact-drift]]
//
// 🔴 머리표는 **주석 한 덩이** 여야 합니다. 두 덩이로 나눠 놓았더니 bodyOf 가 첫
//    덩이만 건너뛰어, 원본에 없는 설명문이 본문에 섞여 지문이 어긋났습니다.
//
// ── 판 파일 (2026-10-16 · 군살 빼기 2단계 · 오너 결정 2 A) ─────────────────────
// 제품마다 사본 옆에 판 파일 한 장(q-design.version.json · 자리는 sync-parts.mjs 의 PRODUCTS)을
// 둡니다. 받은 조각마다 본문 지문과 «그 내용이 Q-Design 에 들어온 커밋 · 날짜» 를 적습니다.
// 제품 쪽 시험 하나가 «내 사본 지문 = 판 파일» 인지만 보고, Q-Design 은 status.mjs 로
// «판 파일 = 지금 정본» 인지 봅니다. 제품은 Q-Design 을 읽지 않습니다.
// 커밋은 내보낸 때가 아니라 «내용» 으로 정하므로, 같은 내용을 다시 내보내도 판 파일은 바이트까지
// 같습니다. 내보낼 때마다 제품 커밋 · 운영 배포가 생기지 않습니다.
//
// 🔴 지문은 줄바꿈을 LF 로 맞춘 본문으로 셉니다(2026-10-16). 원본 셋(atelier-manual · atelier-html ·
//    maison-print-styles)이 이 폴더에서만 CRLF 로 남아 사본 지문이 CRLF 바이트로 찍혔는데, 제품
//    저장소에는 LF 로 들어가 있어 리눅스에서 받으면 지문이 맞지 않았습니다.
// =============================================================================

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve, dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PARTS, HOLD, PRODUCTS } from './sync-parts.mjs';
import { publicAssetConsumerFiles } from './sync-html-consumers.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

/* 내보낼 조각과 받는 곳은 sync-parts.mjs 한 곳에 둡니다(refresh-source.mjs 도 같은 목록을 읽습니다). */

const MARK = 'q-design-nav-sha256:';
/** TS 머리표의 끝 표시. 본문이 주석으로 시작해도 안전하게 자르기 위한 것입니다. */
const END_MARK = '// q-design-header-end';

/** 파일을 줄바꿈 LF 로 맞춰 읽습니다. 지문 · 대조는 모두 이 글자로 합니다. */
export const 읽기 = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

/**
 * 머리표를 뺀 본문. 받는 쪽 검사도 이 함수와 같은 규칙으로 잘라야 합니다.
 *
 * ⚠️ TS 사본은 머리표가 줄 주석(두 슬래시)이라 블록 주석 종료 기호로 끝나지 않습니다.
 *    그래서 형식을 함께 봅니다. CSS 규칙만으로 자르면 TS 사본에서 «자르지 못한 채»
 *    통째로 해시해 언제나 「어긋남」이 되고, --write 를 돌려도 계속 어긋납니다.
 *
 * 🔴 이 주석에 블록 주석 종료 기호를 «인용» 했다가 주석이 거기서 끝나
 *    「Illegal return statement」로 파일이 통째로 죽었습니다(2026-09-10).
 *    기호를 설명할 때는 이름으로 부르고, 문자를 그대로 쓰지 않습니다.
 */
export function bodyOf(text, lang = 'css') {
  const mark = text.indexOf(MARK);
  if (mark < 0) return text;
  if (lang === 'html') {
    const end = text.indexOf('-->', mark);
    return end < 0 ? text : text.slice(end + 3).replace(/^\r?\n/, '');
  }
  if (lang === 'ts') {
    /*
     * TS 머리표는 «끝 표시» 로 닫습니다. 「맨 앞의 줄 주석을 전부 건너뛴다」로 하면
     * **본문이 주석으로 시작할 때 본문까지 먹습니다** (문서 토큰 파일이 그렇습니다).
     * 그래서 표시를 찾아 그 다음 줄부터를 본문으로 잡습니다.
     */
    const at = text.indexOf(END_MARK);
    if (at < 0) return text;
    const nl = text.indexOf('\n', at);
    if (nl < 0) return '';
    const rest = text.slice(nl + 1);
    return rest.startsWith('\n') ? rest.slice(1) : rest;
  }
  const at = text.indexOf('*/', mark);
  if (at < 0) return text;
  const rest = text.slice(at + 2);
  return rest.startsWith('\r\n') ? rest.slice(2) : rest.startsWith('\n') ? rest.slice(1) : rest;
}

/** 사본 머리표에 찍힌 지문. 머리표가 없으면 null. */
export function 머리지문(text) {
  const at = text.indexOf(MARK);
  return at < 0 ? null : text.slice(at + MARK.length).trimStart().slice(0, 64);
}

export const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

/*
 * ── 🔴 정본 CSS 는 `@layer components` 안으로 내보냅니다 (2026-09-09 감사 · Q-Sonar #2)
 *
 * 종전에는 층 없이 내보냈습니다. Tailwind v4 에서 **층 밖 규칙은 어떤 유틸리티보다도
 * 앞섭니다.** 그래서 화면이 표 칸에 적어 둔 유틸리티 97개(색 61 · 여백 23 · 크기 13)가
 * 통째로 죽어 있었습니다. 「경고 판의 붉은 테두리」가 회색으로 나오고, 판정칸이
 * 색으로 말하려던 것이 전부 한 색이 되었습니다.
 *
 * 받는 두 제품의 첫 줄 `@layer theme, base, components, utilities;` 가 이미 순서를
 * 정해 두었고 components 가 utilities 보다 앞이므로, 감싸는 순간
 * **「정본이 기본, 화면이 예외」** 가 됩니다. 그것이 원래 뜻입니다.
 *
 * 🔑 sha 는 «감싼 본문» 을 해싱하므로 받는 쪽 지문 검사는 손댈 것이 없습니다.
 * 🔑 TS 조각(진행선)은 감싸지 않습니다. CSS 가 아닙니다.
 *
 * 🔴 **인쇄 조각은 감싸지 않고 있습니다.** 그 까닭으로 「층 밖 `!important` 가 층 안
 *    `!important` 를 이긴다」 고 적어 두었는데 **반대였습니다**(2026-09-25 Chromium 실측).
 *    `!important` 끼리는 층 순서가 뒤집혀 **층 안이 층 밖을 이기고**, 층끼리는 앞 층이
 *    이깁니다. 층 밖이 이기는 것은 보통 선언끼리뿐입니다. 그러니 감싸지 않은 지금의 인쇄
 *    규칙은 제품의 층 안 `!important`(Tailwind 의 `!` 유틸리티 같은 것)에 «집니다». 감싸면
 *    더 세지지만, 인쇄 조각을 불러 쓰는 Q-Maison 의 종이가 달라질 수 있어 옮기는 것은 따로
 *    판단합니다. 목록 조각 안의 인쇄 규칙(거르개 띠)은 층 안이라 이미 센 쪽입니다.
 *
 * ⚠️ 본문 들여쓰기는 건드리지 않습니다. 받는 쪽 검사가 'padding: 11px 12px' 같은
 *    글자를 그대로 찾습니다.
 */
export function 조각본문(part, 원본) {
  const 글 = 원본.replace(/\r\n/g, '\n');
  return part.lang !== 'ts' && part.layer !== false ? `@layer components {\n${글}}\n` : 글;
}

/** 이 제품이 받는 사본 자리들. file 은 제품 저장소 뿌리에서 본 경로입니다. */
export function 제품조각(who) {
  const root = PRODUCTS[who].root + '/';
  return PARTS.filter((p) => p.to[who]).map((part) => {
    const path = part.to[who];
    if (!path.startsWith(root)) throw new Error(`${who} 의 사본 자리가 저장소 밖입니다: ${path}`);
    return { part, path, file: path.slice(root.length) };
  });
}

function git(args, cwd = ROOT) {
  const r = spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8', maxBuffer: 256 << 20 });
  return r.status === 0 ? r.stdout : null;
}

/**
 * 이 내용이 Q-Design 에 들어온 커밋. 최근 커밋부터 거슬러 올라가 같은 내용이 처음 나온 곳을 찾고,
 * 같은 내용이 이어지는 동안 더 올라가 «그 구간의 맨 앞» 을 돌려줍니다. 아직 커밋하지 않은
 * 내용이면 null 입니다(판 파일에 since 가 비고, status.mjs 가 «커밋 전 내용» 이라고 알립니다).
 */
export function 들어온커밋(part, digest) {
  const log = (git(['log', '--format=%H %cs', '--', part.src]) ?? '').split('\n').filter(Boolean);
  let found = null;
  for (const line of log) {
    const [hash, date] = line.split(' ');
    const text = git(['show', `${hash}:${part.src}`]);
    if (text === null) break;
    if (sha(조각본문(part, text)) === digest) found = { since: hash.slice(0, 12), date };
    else if (found) break;
  }
  return found;
}

const 판순서 = (a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0);
/** 판 하나를 한 줄로 부르는 지문. 제품 쪽 시험이 같은 규칙으로 다시 셉니다. */
export function 묶음지문(parts) {
  return sha([...parts].sort(판순서).map((p) => `${p.file}\t${p.sha256}\n`).join('')).slice(0, 12);
}

/** 제품의 판 파일. 없거나 못 읽으면 null. */
export function 판읽기(who) {
  const path = join(PRODUCTS[who].root, PRODUCTS[who].version);
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

/**
 * 지금 제품에 있는 사본대로 판을 짓습니다. 손으로 고친 사본(본문 지문 ≠ 머리표 지문)이 있으면
 * 판을 짓지 않습니다. 앞 판에 같은 지문이 있으면 그 커밋을 그대로 씁니다(다시 찾지 않음).
 */
export function 판짓기(who) {
  const 앞 = new Map((판읽기(who)?.parts ?? []).filter((p) => p.since).map((p) => [p.file + '\t' + p.sha256, p]));
  const parts = [], 빠짐 = [], 손댐 = [];
  for (const { part, path, file } of 제품조각(who)) {
    if (!existsSync(path)) { 빠짐.push(file); continue; }
    const text = 읽기(path);
    const digest = sha(bodyOf(text, part.lang));
    if (머리지문(text) !== digest) { 손댐.push(file); continue; }
    const old = 앞.get(file + '\t' + digest);
    const came = old ? { since: old.since, date: old.date } : 들어온커밋(part, digest);
    parts.push({ name: part.name, file, lang: part.lang ?? 'css', sha256: digest, since: came?.since ?? null, date: came?.date ?? null });
  }
  parts.sort(판순서);
  return { 판: { format: 1, product: who, fingerprint: 묶음지문(parts), parts }, 빠짐, 손댐 };
}

/** 판 파일을 씁니다. 내용이 같으면 손대지 않습니다. 쓰지 못했으면 false. */
function 판쓰기(who) {
  const { 판, 빠짐, 손댐 } = 판짓기(who);
  if (손댐.length) {
    console.log(`  판 파일  ${who}  쓰지 않음: 머리표 지문과 본문이 다른 사본 ${손댐.length}곳(손으로 고친 것) ${손댐.join(', ')}`);
    return false;
  }
  const path = join(PRODUCTS[who].root, PRODUCTS[who].version);
  const next = JSON.stringify(판, null, 2) + '\n';
  const had = existsSync(path) ? readFileSync(path, 'utf8') : null;
  if (had !== next) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, next, 'utf8'); }
  const 커밋전 = 판.parts.filter((p) => !p.since).length;
  console.log(`  판 파일  ${who}  ${판.fingerprint}  ${had === null ? '신규' : had === next ? '그대로' : '갱신'}  조각 ${판.parts.length}`
    + (빠짐.length ? `  · 사본 없음 ${빠짐.length}` : '') + (커밋전 ? `  · Q-Design 커밋 전 내용 ${커밋전}` : ''));
  return true;
}

const header = (srcRel, digest, lang = 'css') => {
  const lines = [
    '=============================================================================',
    'Q-Design 에서 온 사본입니다. **이 파일을 손으로 고치지 마세요.**',
    '',
    `출처   D:/Claude/Q-Design/${srcRel}`,
    '갱신   cd D:/Claude/Q-Design',
    '       node tools/extract-all.mjs && node tools/sync.mjs --write',
    '',
    '고칠 일이 생기면 Q-Design 의 원본을 고치고 추출기를 다시 돌립니다.',
    '여기서 고치면 제품들의 화면·문서가 갈립니다.',
    '아래 지문은 본문의 sha256 이고, 이 저장소의 검사가 대조합니다.',
    '',
    `${MARK} ${digest}`,
    '=============================================================================',
  ];
  // ⚠️ 머리표 끝의 개행은 «하나» 입니다. 둘이면 본문 앞에 빈 줄이 남아 지문이 어긋납니다.
  if (lang === 'ts') return lines.map((l) => ('// ' + l).trimEnd()).join('\n') + '\n' + END_MARK + '\n';
  if (lang === 'html') return `<!-- Q-Design source: ${srcRel}\nq-design-nav-sha256: ${digest}\n-->\n`;
  return '/* ' + lines.map((l, i) => (i === 0 ? l : '   ' + l).trimEnd()).join('\n') + ' */\n';
};

function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter((a) => !['--write', '--stamp'].includes(a) && !a.startsWith('--part=') && !a.startsWith('--only='));
  if (unknown.length || (args.includes('--write') && args.includes('--stamp'))) {
    throw new Error('Use sync.mjs [--write | --stamp] [--part=name] [--only=Q-Atelier,Q-Works,Q-Forge,Q-Sonar]. Unknown: ' + unknown.join(' '));
  }
  const write = args.includes('--write');
  const stamp = args.includes('--stamp');
  const partArg = args.find((a) => a.startsWith('--part='));
  const selectedPart = partArg?.slice('--part='.length);
  if (selectedPart && !PARTS.some((p) => p.name === selectedPart)) throw new Error(`Unknown part: ${selectedPart}`);
  /*
   * 받는 제품 일부만(2026-09-27). 다른 세션이 어떤 제품 폴더에서 커밋 안 된 고침을 들고 일하는 중이면
   * 그 폴더에 사본을 쓰는 순간 인덱스가 섞입니다. `--only=Q-Sonar,Q-Forge` 처럼 이름을 적으면 그 제품만
   * 보고 씁니다. 빠진 제품은 다음에 다시 돌려 맞춥니다(지문이 어긋남으로 남아 잊히지 않습니다).
   */
  const onlyArg = args.find((a) => a.startsWith('--only='));
  const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').map((x) => x.trim()).filter(Boolean)) : null;
  /* 판 파일을 쓸 제품: 고른 조각을 받고 --only 에 든 제품 */
  const 판제품 = Object.keys(PRODUCTS).filter((who) => (!only || only.has(who))
    && PARTS.some((p) => p.to[who] && (!selectedPart || p.name === selectedPart)));

  if (stamp) {
    console.log('판 파일만 지금 사본대로 적습니다(사본은 그대로)');
    const ok = 판제품.map(판쓰기).every(Boolean);
    process.exit(ok ? 0 : 1);
  }

  let drift = 0;
  for (const part of PARTS) {
    if (selectedPart && part.name !== selectedPart) continue;
    const srcPath = join(ROOT, part.src);
    if (!existsSync(srcPath)) {
      console.error(`원본이 없습니다: ${part.src}. 추출기를 먼저 돌리세요.`);
      process.exit(1);
    }
    const body = 조각본문(part, 읽기(srcPath));
    const digest = sha(body);
    console.log(`${part.name}  ${digest.slice(0, 12)}…`);
    for (const [who, path] of Object.entries(part.to)) {
      if (only && !only.has(who)) {
        console.log(`  건너뜀  ${who}  (--only)`);
        continue;
      }
      /* 오너가 묶어 둔 조각은 쓰지 않습니다(sync-parts.mjs 의 HOLD). 어긋남은 그대로 보입니다 */
      if (HOLD[who] && !HOLD[who].except?.includes(part.name) && (HOLD[who].parts === '*' || HOLD[who].parts.includes(part.name))) {
        console.log(`  묶어 둠  ${who}  (${HOLD[who].why})`);
        continue;
      }
      const has = existsSync(path);
      const text = has ? 읽기(path) : '';
      const 본문같음 = has && sha(bodyOf(text, part.lang)) === digest;
      /* 본문이 같아도 머리표 지문이 낡았으면 어긋남입니다. 제품 쪽 판 파일 시험이 머리표를 대조합니다 */
      const same = 본문같음 && 머리지문(text) === digest;
      if (!same) drift++;
      if (write) {
        /*
         * 본문이 같아도 다시 씁니다. 지문은 본문만 보므로, 머리표의 설명이 바뀌어도
         * 「같음」 으로 건너뛰어 **낡은 안내가 사본에 남습니다** - 실제로 갱신 명령이
         * 없어진 스크립트를 가리킨 채 남을 뻔했습니다.
         */
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, header(part.src, digest, part.lang) + body, 'utf8');
        console.log(`  ${!has ? '신규' : same ? '그대로' : '갱신'}    ${who}  ${path}`);
      } else {
        console.log(`  ${same ? '같음  ' : 본문같음 ? '어긋남(머리표 지문)' : has ? '어긋남' : '없음  '}  ${who}  ${path}`);
      }
    }
  }

  if (write) {
    console.log('');
    for (const who of 판제품) 판쓰기(who);
  }

  /*
   * ── 받아 두기만 하는 사본 (2026-09-25) ─────────────────────────────────────────
   * 지문은 «손으로 고쳤나» 만 봅니다. «쓰이나» 는 안 봅니다. 인쇄 조각은 9월 10일부터
   * Q-Atelier · Q-Sonar · Q-Forge 에 사본만 있고 아무도 불러 쓰지 않았는데, 이 스크립트도
   * 받는 쪽 검사도 초록이었습니다. 그 사이 인쇄 조각에 넣은 규칙은 그 세 제품에서 아무 일도
   * 하지 않았습니다(운영 CSS 를 받아 보고서야 알았습니다). [[declared-but-unread]]
   *
   * 그래서 받는 저장소의 코드에서 사본을 부르는 줄을 찾습니다. CSS 는 파일 이름이 든
   * import 줄, TS 는 확장자를 뺀 이름으로 끝나는 import 경로입니다. HTML 은 public 서비스
   * 워커와 문서의 정적 URL 참조를 함께 찾습니다. 시험 파일과 사본 자신은
   * 셈에서 뺍니다(시험이 읽는 것은 «쓰는» 것이 아닙니다). 알리기만 하고 멈추지는 않습니다.
   */
  const 건너뛸곳 = new Set(['node_modules', '.next', '.git', '.turbo', '.vercel', '.claude', '.codex', '.agents', '.superpowers', 'backups', 'capacitor-www', 'dist', 'build', 'out', 'coverage', 'reports', 'docs', 'public', 'test', 'tests', '__tests__', 'test-results', 'test-utils']);
  const 코드확장자 = /\.(css|tsx?|jsx?|mjs|cjs|html?)$/;
  const 저장소코드 = new Map();
  const 소스내용 = new Map();
  function 소스읽기(path) {
    if (!소스내용.has(path)) 소스내용.set(path, readFileSync(path, 'utf8'));
    return 소스내용.get(path);
  }
  function 저장소뿌리(path) {
    for (let d = dirname(path); d !== dirname(d); d = dirname(d)) if (existsSync(join(d, 'package.json'))) return d;
    return dirname(path);
  }
  function 코드파일들(root, includePublic = false) {
    const key = root + ':' + includePublic;
    if (저장소코드.has(key)) return 저장소코드.get(key);
    const out = [];
    const walk = (dir) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) {
          if ((!건너뛸곳.has(e.name) && !e.name.startsWith('.next-')) || (includePublic && e.name === 'public')) walk(join(dir, e.name));
        } else if (코드확장자.test(e.name) && !/\.(test|spec)\./.test(e.name)) {
          out.push(join(dir, e.name));
        }
      }
    };
    walk(root);
    저장소코드.set(key, out);
    return out;
  }
  const 글자틀 = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function 부르는곳(path, lang) {
    if (lang === 'html' || (lang === 'ts' && /\/public\/.*\.js$/.test(path.replaceAll('\\', '/')))) {
      const root = 저장소뿌리(path);
      return publicAssetConsumerFiles(path, root, 코드파일들(root, true), 소스읽기).length;
    }
    const 이름 = basename(path);
    const 찾기 = lang === 'ts'
      ? new RegExp(`(?:from|import)\\s*\\(?\\s*['"][^'"]*/${글자틀(이름.replace(/\.tsx?$/, ''))}(?:\\.tsx?|\\.js)?['"]`)
      : new RegExp(`(?:@import|import)\\s[^;\\n]*${글자틀(이름)}`);
    const 자신 = resolve(path);
    return 코드파일들(저장소뿌리(path)).filter((f) => resolve(f) !== 자신 && 찾기.test(소스읽기(f))).length;
  }
  const 안부름 = [];
  for (const part of PARTS) {
    if (selectedPart && part.name !== selectedPart) continue;
    for (const [who, path] of Object.entries(part.to)) {
      if (only && !only.has(who)) continue;
      if (existsSync(path) && 부르는곳(path, part.lang) === 0) 안부름.push(`  ${part.name}  ${who}  ${path}`);
    }
  }
  console.log('');
  if (안부름.length) {
    console.log(`선택 범위에서 정적 참조를 찾지 못한 사본 ${안부름.length}곳 (동적 경로와 간접 연결은 별도 확인이 필요합니다)`);
    for (const line of 안부름) console.log(line);
  } else {
    console.log('선택 범위의 정적 참조 미확인 사본: 없음 (코드 또는 문서 참조를 찾았습니다. 실행 경로 전체를 보증하지는 않습니다)');
  }

  if (!write && drift) {
    console.log('');
    console.log(`  ${drift} 곳이 원본과 다릅니다. --write 로 갱신하세요.`);
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
