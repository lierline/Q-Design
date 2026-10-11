// 금지 문자 검사: 긴 대시가 글이나 코드에 들어갔는지 훑습니다.
// 바이트로만 훑으면 놓칩니다. 코드포인트와 HTML 엔티티를 함께 봅니다.
//
//   node tools/check-chars.mjs
//
// 검사 대상은 이 저장소가 «쓴» 파일입니다. source/ 는 원본 복사본이라 제외합니다
// (원본을 손대면 대조가 깨집니다).

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isCompiledWorkbench } from './audit-coverage-core.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['source', 'node_modules', '.git']);
const EXT = /\.(md|html|css|json|mjs|js|ts|tsx)$/;

// 코드포인트로 지목합니다. 리터럴로 적으면 이 파일 자신이 검사에 걸립니다.
const BANNED = [
  { cp: 0x2014, name: 'EM DASH' },
  { cp: 0x2013, name: 'EN DASH' },
  { cp: 0x2015, name: 'HORIZONTAL BAR' },
];
// ⚠️ 엔티티도 리터럴로 적으면 이 파일이 자기 검사에 걸립니다. 조립해서 만듭니다.
// (원본 저장소에서 정규화 도구가 자기 소스를 정규화해 죽은 사고가 있었습니다.)
const AMP = String.fromCharCode(38);
const ENTITIES = ['mdash;', 'ndash;', '#8212;', '#8211;', '#x2014;', '#x2013;'].map((s) => AMP + s);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (isCompiledWorkbench(relative(ROOT, p))) continue;
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXT.test(name)) out.push(p);
  }
  return out;
}

// ── 검출력 자체 시험 ────────────────────────────────────────────────────────
// 가드가 «빈 그물» 이 아닌지 먼저 확인합니다. 정규식이나 비교가 한 글자 어긋나면
// 아무것도 못 잡으면서 초록불을 냅니다. 그 실패 형태를 여기서 미리 막습니다.
function scanLine(line) {
  const found = [];
  for (const b of BANNED) {
    if ([...line].some((ch) => ch.codePointAt(0) === b.cp)) found.push(b.name);
  }
  for (const e of ENTITIES) if (line.includes(e)) found.push(e);
  return found;
}
const probe = 'a' + String.fromCodePoint(0x2014) + 'b ' + AMP + 'mdash;';
if (scanLine(probe).length !== 2) {
  console.error('가드 자체 시험 실패: 넣어 둔 금지 문자를 못 잡습니다. 검사를 신뢰할 수 없습니다.');
  process.exit(2);
}

const hits = [];
for (const file of walk(ROOT)) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const what of scanLine(line)) {
      hits.push({ file: relative(ROOT, file), line: i + 1, what, text: line.trim().slice(0, 80) });
    }
  });
}

/*
 * 감사 «기록» 은 따로 셉니다.
 *
 * `preview/screens/audit/` 는 감사 도구가 남긴 판정 원문이고, 남의 화면에서 읽은
 * 문자열을 그대로 인용하기도 합니다. 그것까지 게이트로 막으면 산출물 재생성이
 * 통째로 멈춥니다(실제로 `extract-all` 이 여기서 멈췄습니다).
 * 막지는 않되 **보이게** 둡니다. 기록을 손보는 것은 그 기록을 만든 쪽의 몫입니다.
 */
const isRecord = (f) => f.replace(/\\/g, '/').startsWith('preview/screens/audit/');
const blocking = hits.filter((h) => !isRecord(h.file));
const records = hits.filter((h) => isRecord(h.file));

if (records.length) {
  console.log('감사 기록에 ' + records.length + '곳 (막지 않습니다 · 기록을 만든 쪽 소관)');
  const byFile = new Set(records.map((h) => h.file));
  for (const f of [...byFile].slice(0, 4)) console.log('  ' + f);
  if (byFile.size > 4) console.log('  외 ' + (byFile.size - 4) + '개 파일');
}

if (blocking.length) {
  console.error('금지 문자 ' + blocking.length + '곳:');
  for (const h of blocking) console.error('  ' + h.file + ':' + h.line + '  [' + h.what + ']  ' + h.text);
  process.exit(1);
}
console.log('금지 문자 없음 · 검사 파일 ' + walk(ROOT).length + '개 (source/ 및 생성된 preview/components/ 제외, preview/fixtures/ 포함)');
