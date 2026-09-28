// =============================================================================
// 정본 내보내기
// =============================================================================
//   node tools/sync.mjs          어디가 어긋났는지만 봅니다 (아무것도 안 씁니다)
//   node tools/sync.mjs --write  사본을 갱신합니다
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
// =============================================================================

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PARTS, HOLD } from './sync-parts.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

/* 내보낼 조각과 받는 곳은 sync-parts.mjs 한 곳에 둡니다(refresh-source.mjs 도 같은 목록을 읽습니다). */

const MARK = 'q-design-nav-sha256:';
/** TS 머리표의 끝 표시. 본문이 주석으로 시작해도 안전하게 자르기 위한 것입니다. */
const END_MARK = '// q-design-header-end';
const write = process.argv.includes('--write');
/*
 * 받는 제품 일부만(2026-09-27). 다른 세션이 어떤 제품 폴더에서 커밋 안 된 고침을 들고 일하는 중이면
 * 그 폴더에 사본을 쓰는 순간 인덱스가 섞입니다. `--only=Q-Sonar,Q-Forge` 처럼 이름을 적으면 그 제품만
 * 보고 씁니다. 빠진 제품은 다음에 다시 돌려 맞춥니다(지문이 어긋남으로 남아 잊히지 않습니다).
 */
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').map((x) => x.trim()).filter(Boolean)) : null;

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

const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

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
  return '/* ' + lines.map((l, i) => (i === 0 ? l : '   ' + l).trimEnd()).join('\n') + ' */\n';
};

let drift = 0;
for (const part of PARTS) {
  const srcPath = join(ROOT, part.src);
  if (!existsSync(srcPath)) {
    console.error(`원본이 없습니다: ${part.src}. 추출기를 먼저 돌리세요.`);
    process.exit(1);
  }
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
   * 🔑 아래 sha 는 «감싼 본문» 을 해싱하므로 받는 쪽 지문 검사는 손댈 것이 없습니다.
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
  const 원본 = readFileSync(srcPath, 'utf8');
  const 감쌀까 = part.lang !== 'ts' && part.layer !== false;
  const body = 감쌀까 ? `@layer components {\n${원본}}\n` : 원본;
  const digest = sha(body);
  console.log(`${part.name}  ${digest.slice(0, 12)}…`);
  for (const [who, path] of Object.entries(part.to)) {
    if (only && !only.has(who)) {
      console.log(`  건너뜀  ${who}  (--only)`);
      continue;
    }
    /* 오너가 묶어 둔 조각은 쓰지 않습니다(sync-parts.mjs 의 HOLD). 어긋남은 그대로 보입니다 */
    if (HOLD[who] && (HOLD[who].parts === '*' || HOLD[who].parts.includes(part.name))) {
      console.log(`  묶어 둠  ${who}  (${HOLD[who].why})`);
      continue;
    }
    const has = existsSync(path);
    const same = has && sha(bodyOf(readFileSync(path, 'utf8'), part.lang)) === digest;
    if (!same) drift++;
    if (write) {
      /*
       * 본문이 같아도 다시 씁니다. 지문은 본문만 보므로, 머리표의 설명이 바뀌어도
       * 「같음」 으로 건너뛰어 **낡은 안내가 사본에 남습니다** - 실제로 갱신 명령이
       * 없어진 스크립트를 가리킨 채 남을 뻔했습니다.
       */
      writeFileSync(path, header(part.src, digest, part.lang) + body, 'utf8');
      console.log(`  ${!has ? '신규' : same ? '그대로' : '갱신'}    ${who}  ${path}`);
    } else {
      console.log(`  ${same ? '같음  ' : has ? '어긋남' : '없음  '}  ${who}  ${path}`);
    }
  }
}

/*
 * ── 받아 두기만 하는 사본 (2026-09-25) ─────────────────────────────────────────
 * 지문은 «손으로 고쳤나» 만 봅니다. «쓰이나» 는 안 봅니다. 인쇄 조각은 9월 10일부터
 * Q-Atelier · Q-Sonar · Q-Forge 에 사본만 있고 아무도 불러 쓰지 않았는데, 이 스크립트도
 * 받는 쪽 검사도 초록이었습니다. 그 사이 인쇄 조각에 넣은 규칙은 그 세 제품에서 아무 일도
 * 하지 않았습니다(운영 CSS 를 받아 보고서야 알았습니다). [[declared-but-unread]]
 *
 * 그래서 받는 저장소의 코드에서 사본을 부르는 줄을 찾습니다. CSS 는 파일 이름이 든
 * import 줄, TS 는 확장자를 뺀 이름으로 끝나는 import 경로입니다. 시험 파일과 사본 자신은
 * 셈에서 뺍니다(시험이 읽는 것은 «쓰는» 것이 아닙니다). 알리기만 하고 멈추지는 않습니다.
 */
const 건너뛸곳 = new Set(['node_modules', '.next', '.git', '.turbo', '.vercel', 'dist', 'build', 'out', 'coverage', 'reports', 'docs', 'public', 'test', 'tests', '__tests__']);
const 코드확장자 = /\.(css|tsx?|jsx?|mjs|cjs)$/;
const 저장소코드 = new Map();
function 저장소뿌리(path) {
  for (let d = dirname(path); d !== dirname(d); d = dirname(d)) if (existsSync(join(d, 'package.json'))) return d;
  return dirname(path);
}
function 코드파일들(root) {
  if (저장소코드.has(root)) return 저장소코드.get(root);
  const out = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (!건너뛸곳.has(e.name)) walk(join(dir, e.name));
      } else if (코드확장자.test(e.name) && !/\.(test|spec)\./.test(e.name)) {
        out.push(join(dir, e.name));
      }
    }
  };
  walk(root);
  저장소코드.set(root, out);
  return out;
}
const 글자틀 = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function 부르는곳(path, lang) {
  const 이름 = basename(path);
  const 찾기 = lang === 'ts'
    ? new RegExp(`(?:from|import)\\s*\\(?\\s*['"][^'"]*/${글자틀(이름.replace(/\.tsx?$/, ''))}(?:\\.tsx?|\\.js)?['"]`)
    : new RegExp(`(?:@import|import)\\s[^;\\n]*${글자틀(이름)}`);
  const 자신 = resolve(path);
  return 코드파일들(저장소뿌리(path)).filter((f) => resolve(f) !== 자신 && 찾기.test(readFileSync(f, 'utf8'))).length;
}
const 안부름 = [];
for (const part of PARTS) {
  for (const [who, path] of Object.entries(part.to)) {
    if (existsSync(path) && 부르는곳(path, part.lang) === 0) 안부름.push(`  ${part.name}  ${who}  ${path}`);
  }
}
console.log('');
if (안부름.length) {
  console.log(`받아 두기만 하는 사본 ${안부름.length}곳 (받는 저장소의 코드가 부르지 않습니다. 여기 규칙은 그 제품에서 아무 일도 안 합니다)`);
  for (const line of 안부름) console.log(line);
} else {
  console.log('받아 두기만 하는 사본: 없음 (모든 사본을 받는 저장소의 코드가 부릅니다)');
}

if (!write && drift) {
  console.log('');
  console.log(`  ${drift} 곳이 원본과 다릅니다. --write 로 갱신하세요.`);
  process.exit(1);
}
