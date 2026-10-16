// =============================================================================
// 검사 하나 (군살 빼기 4단계 · 기둥 4)
// =============================================================================
//   node tools/check.mjs              늘 초록이어야 하는 검사입니다. 아무것도 쓰지 않습니다
//   node tools/check.mjs --products   손으로 돌리는 제품 감사입니다(제품 코드를 훑습니다)
//
// 🔑 규칙: 이 검사가 빨강이면 그날 고치거나, 그 걸음을 지웁니다. «원래 빨강» 을 두지 않습니다.
//    시끄러운 검사는 없는 검사와 같습니다. 어긋남이 «언제 내보낼지 정해진» 것이면
//    sync-parts.mjs 의 PENDING 에 적습니다(검사는 「차례 기다림」 으로 알리고 실패로 세지 않습니다).
//
// 🔑 이 검사 안에서 제품 저장소를 읽는 일은 둘뿐입니다.
//    · 원본 받기  refresh-source --check (제품의 «커밋된» 내용만 읽습니다)
//    · 사본 대조  Q-Design 이 제품에 써 넣은 파일이 원본과 같은지
//    제품 코드 전체를 훑어 «쓰이는가 · 지켜지는가» 를 보는 일은 --products 감사로 뺐습니다.
//    감사는 빨강이 나와도 이 검사를 막지 않습니다. 5단계처럼 제품을 고치는 날 함께 봅니다.
//    (남은 결합: typescript · react · playwright 같은 라이브러리를 Q-Atelier 의 node_modules 에서 빌려 씁니다.
//     파일 내용을 읽는 것은 아니지만, Q-Design 이 자기 package.json 을 갖기 전까지 남습니다.)
//
// 걸음은 서로 읽기만 하므로 몇 개씩 함께 돌리고, 결과는 적힌 순서대로 찍습니다.
// extract-all.mjs --check 가 이 파일을 부릅니다.
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.some((arg) => arg !== '--products')) throw new Error('Use node tools/check.mjs [--products]');
const PRODUCTS = args.includes('--products');

/* 늘 초록이어야 하는 검사. [무리, 이름, 도구, 인자] */
const GATE = [
  ['원본', '원본 사본이 제품의 커밋된 원본과 같은가', 'refresh-source.mjs', ['--check']],
  ['재현', '토큰', 'extract-tokens.mjs', ['--check']],
  ['재현', '문서 토큰(종이 위 AA 포함)', 'extract-doc.mjs', ['--check']],
  ['재현', '대외 문서 토큰(종이 위 AA 포함)', 'extract-brief.mjs', ['--check']],
  ['재현', '종이 문서 v8', 'extract-mqdoc.mjs', ['--check']],
  ['재현', '차림표', 'extract-nav.mjs', ['--check']],
  ['재현', '목록', 'extract-list.mjs', ['--check']],
  ['재현', '뼈대', 'extract-screen.mjs', ['--check']],
  ['재현', '인라인 색인', 'extract-inline-styles.mjs', ['--check']],
  ['재현', '샴페인 계단', 'extract-ramp.mjs', ['--check']],
  ['재현', '새로고침 표시', 'extract-pull-presentation.mjs', ['--check']],
  ['재현', '제품 팔레트', 'build-palette.mjs', ['--check']],
  ['재현', '메종 이메일', 'build-maison-email.mjs', ['--check']],
  ['재현', '아뜰리에 HTML 문서', 'build-atelier-html.mjs', ['--check']],
  ['재현', '제품 기반', 'build-foundation.mjs', ['--check']],
  ['재현', '카르넷 기록 유형 명칭', 'build-record-labels.mjs', ['--check']],
  ['재현', '권한 설명 문구', 'build-permission-copy.mjs', ['--check']],
  ['재현', '업무 조작 대상', 'build-workspace.mjs', ['--check']],
  ['재현', '기본 UI 구현', 'build-component-implementations.mjs', ['--check']],
  ['재현', '앱 오프라인', 'build-native-offline.mjs', ['--check']],
  ['재현', '앱 시작 장면', 'build-native-launcher.mjs', ['--check']],
  ['재현', 'iOS 공용 장면', 'build-ios-components.mjs', ['--check']],
  ['재현', '접근 시뮬레이터', 'build-atelier-simulator.mjs', ['--check']],
  ['재현', '업무 아이콘', 'build-icons.mjs', ['--check']],
  ['재현', 'React 업무 아이콘', 'build-react-icons.mjs', ['--check']],
  ['재현', '글꼴 캐시', 'fetch-fonts.mjs', ['--offline']],
  ['재현', '공통 모노 글꼴(제품의 글꼴 사본 대조 포함)', 'build-mono-fonts.mjs', ['--check']],
  ['대비', '대비표(AA)', 'contrast-table.mjs', ['--check']],
  ['문자', '금지 문자', 'check-chars.mjs', []],
  ['자간', '한글 자간(var() 포함)', 'check-hangul-canon.mjs', []],
  ['정본', '화면 문구 정본 구현 파일', 'copy-spacing.mjs', ['--check-canon']],
  ['사본', '조각 사본', 'sync.mjs', []],
  ['사본', 'React 아이콘 사본', 'sync-react-icons.mjs', ['--copies']],
  ['사본', '앱 아이콘 사본', 'app-icons.mjs', ['--check', '--copies']],
];

/* 손으로 돌리는 제품 감사. 제품 코드를 훑습니다 */
const AUDIT = [
  ['감사', '사본을 부르는 곳', 'sync.mjs', ['--consumers']],
  ['감사', '화면 문구(제품 코드 전체)', 'copy-spacing.mjs', ['--check']],
  ['감사', '업무 아이콘을 가져오는 곳', 'sync-react-icons.mjs', ['--check']],
  ['감사', '앱 아이콘 주소 · 설명 · 붓 Q · 상단 바', 'app-icons.mjs', ['--check']],
  ['감사', '앱 색 파일이 중앙 색 이름을 부르나', 'build-native-offline.mjs', ['--check', '--contracts']],
  ['감사', '제품 소스의 한글 자간', 'check-hangul-source.mjs', []],
  ['감사', '디자인을 다 뽑았나', 'audit-coverage.mjs', []],
  ['감사', '화면 글 말투', 'check-voice.mjs', []],
  ['감사', '세 제품이 쓰는 샴페인 계단', 'extract-ramp.mjs', []],
];

const tests = readdirSync(join(ROOT, 'tools')).filter((name) => name.endsWith('.test.mjs')).sort();
const steps = (PRODUCTS ? AUDIT : [...GATE, ['시험', `남는 시험 ${tests.length}개`, '--test', tests.map((name) => 'tools/' + name)]])
  .map(([group, name, file, extra]) => ({ group, name, argv: file === '--test' ? ['--test', ...extra] : [join(ROOT, 'tools', file), ...extra] }));

function run(step) {
  return new Promise((done) => {
    const started = Date.now();
    const child = spawn(process.execPath, step.argv, { cwd: ROOT, windowsHide: true });
    let out = '';
    child.stdout.on('data', (chunk) => { out += chunk; });
    child.stderr.on('data', (chunk) => { out += chunk; });
    child.on('close', (code) => done({ ...step, code, out: out.trim(), seconds: (Date.now() - started) / 1000 }));
    child.on('error', (error) => done({ ...step, code: 1, out: String(error), seconds: 0 }));
  });
}

/* 함께 돌리되 결과는 순서대로 */
const LIMIT = 4;
const results = new Array(steps.length);
let next = 0;
await Promise.all(Array.from({ length: LIMIT }, async () => {
  while (next < steps.length) {
    const index = next++;
    results[index] = await run(steps[index]);
  }
}));

console.log(PRODUCTS ? '제품 감사 (제품 코드를 훑습니다 · 빨강이어도 검사를 막지 않습니다)' : '검사 하나 (아무것도 쓰지 않습니다)');
console.log('');
let failed = 0;
for (const result of results) {
  const ok = result.code === 0;
  if (!ok) failed++;
  const lines = result.out.split('\n').filter(Boolean);
  const summary = (result.group === '시험' ? lines.filter((line) => /^ℹ (tests|pass|fail) /.test(line)).join(' · ') : lines.filter((line) => /[\w가-힣]/.test(line)).pop() ?? '').slice(0, 110);
  console.log(`  ${ok ? 'OK  ' : '실패'}  ${result.group}  ${result.name.padEnd(24)}  ${summary}`);
  const waiting = lines.filter((line) => /^\s+차례 기다림/.test(line));
  if (ok && waiting.length) console.log(`              (차례 기다림 ${waiting.length}곳 · sync-parts.mjs 의 PENDING)`);
  if (!ok) {
    const shown = result.group === '시험' ? lines.filter((line) => /✖|not ok|Error|assert/i.test(line)).slice(0, 20) : lines.slice(-20);
    for (const line of shown) console.log('          ' + line.slice(0, 200));
  }
}
const seconds = results.reduce((max, result) => Math.max(max, result.seconds), 0);
console.log('');
if (PRODUCTS) {
  console.log(failed ? `  감사에서 걸린 걸음 ${failed}개. 제품을 고치는 날 함께 봅니다.` : '  감사도 모두 통과했습니다.');
  process.exit(0);
}
console.log(failed ? `  실패 ${failed}개 / 걸음 ${results.length}개. 그날 고치거나 그 걸음을 지웁니다.` : `  모두 통과 · 걸음 ${results.length}개 · 가장 긴 걸음 ${seconds.toFixed(1)}초`);
process.exit(failed ? 1 : 0);
