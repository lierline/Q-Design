// =============================================================================
// 차림표 정본 내보내기
// =============================================================================
//   node tools/sync-nav.mjs          어디가 어긋났는지만 봅니다 (아무것도 안 씁니다)
//   node tools/sync-nav.mjs --write  사본을 갱신합니다
//
// 세 저장소가 한 대장간에 있지 않으므로(각자 private repo · 패키지 매니저도 다름)
// npm 꾸러미로 나눠 쓸 수가 없습니다. 그래서 **사본을 두되 사본인 줄 알게** 합니다.
//
//   1. 사본 머리에 본문의 sha256 을 찍습니다.
//   2. 받는 쪽 테스트가 그 sha 를 다시 계산해 대조합니다.
//      → 사본을 손으로 고치면 그 저장소의 테스트가 웁니다.
//   3. 이 스크립트를 다시 돌리면 원본과 사본이 같은지 말해 줍니다.
//      → 원본이 앞서 나가 있으면 여기서 드러납니다.
//
// 「사본을 만들지 말자」가 최선이지만 지금 구조에서는 불가능합니다.
// 차선은 «사본이 조용히 갈리지 않게» 하는 것입니다. [[duplicated-fact-drift]]
//
// 🔴 머리표는 **주석 한 덩이** 여야 합니다. 두 덩이로 나눠 놓았더니 bodyOf 가 첫
//    덩이만 건너뛰어, 원본에 없는 설명문이 본문에 섞여 지문이 어긋났습니다.
// =============================================================================

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const SRC = join(ROOT, 'dist', 'q-design.nav.css');

// 받는 곳. 새 제품이 늘면 여기에 한 줄 더합니다.
const TARGETS = [
  { name: 'Q-Sonar', path: 'D:/Claude/Lead-Radar/src/styles/q-design.nav.css' },
  { name: 'Q-Forge', path: 'D:/Claude/DHR/app/q-design.nav.css' },
];

const MARK = 'q-design-nav-sha256:';
const write = process.argv.includes('--write');

/** 머리표를 뺀 본문. 받는 쪽 테스트도 이 함수와 같은 규칙으로 잘라야 합니다. */
export function bodyOf(text) {
  const mark = text.indexOf(MARK);
  if (mark < 0) return text;
  const at = text.indexOf('*/', mark);
  if (at < 0) return text;
  const rest = text.slice(at + 2);
  return rest.startsWith('\r\n') ? rest.slice(2) : rest.startsWith('\n') ? rest.slice(1) : rest;
}

const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

if (!existsSync(SRC)) {
  console.error('원본이 없습니다. 먼저 `node tools/extract-nav.mjs` 를 돌리세요.');
  process.exit(1);
}

const body = readFileSync(SRC, 'utf8');
const digest = sha(body);

const header = [
  '/* =============================================================================',
  '   Q-Design 에서 온 사본입니다. **이 파일을 손으로 고치지 마세요.**',
  '',
  '   출처   D:/Claude/Q-Design/dist/q-design.nav.css',
  '   갱신   cd D:/Claude/Q-Design',
  '          node tools/extract-nav.mjs && node tools/sync-nav.mjs --write',
  '',
  '   고칠 일이 생기면 Q-Design 의 원본(source/components/Sidebar.tsx)을 고치고',
  '   추출기를 다시 돌립니다. 여기서 고치면 세 제품의 차림표가 갈립니다.',
  '   아래 지문은 본문의 sha256 이고, 이 저장소의 테스트가 대조합니다.',
  '',
  `   ${MARK} ${digest}`,
  '   ============================================================================= */',
  '',
].join('\n');

let drift = 0;
for (const t of TARGETS) {
  const has = existsSync(t.path);
  const same = has && sha(bodyOf(readFileSync(t.path, 'utf8'))) === digest;
  if (same) {
    console.log(`  같음   ${t.name}  ${t.path}`);
    continue;
  }
  drift++;
  if (write) {
    writeFileSync(t.path, header + body, 'utf8');
    console.log(`  ${has ? '갱신' : '신규'}   ${t.name}  ${t.path}`);
  } else {
    console.log(`  ${has ? '어긋남' : '없음'}  ${t.name}  ${t.path}`);
  }
}

console.log('');
console.log(`  본문 sha256  ${digest}`);
if (!write && drift) {
  console.log(`  ${drift} 곳이 원본과 다릅니다. --write 로 갱신하세요.`);
  process.exit(1);
}
