// =============================================================================
// 전체 다시 만들기
// =============================================================================
//   node tools/extract-all.mjs            산출물을 전부 다시 만듭니다
//   node tools/extract-all.mjs --sync     만든 뒤 세 제품으로 내보냅니다
//   node tools/extract-all.mjs --check    만들지 않고 «어긋난 곳» 만 봅니다
//
// 「한 번에 패밀리에 적용」의 입구입니다. 추출기를 하나씩 기억해 돌리다 보면
// 하나를 빠뜨리고, 그러면 **일부만 갱신된 채** 내보내집니다.
//
// 순서가 중요합니다:
//   source  → 🔑 **맨 앞입니다.** 아래 모든 추출기가 source/ 를 읽습니다.
//             사본이 낡았으면 그 뒤 전부가 «낡은 것에서 정확히 파생된» 값이 됩니다.
//             실패가 아니라 초록불로 나오기 때문에 가장 위험합니다.
//   tokens  → 다른 모든 것이 이 JSON 을 읽습니다 (색·크기의 뿌리)
//   계단    → tokens 를 읽고, Q 계열 세 제품의 «실제 쓰임» 에서 샴페인 칸을 뽑습니다
//   대비표  → tokens JSON 에서 계산해 docs/02 에 «직접 씁니다»
//   fonts   → tokens 와 독립이지만 dist 에 함께 있어야 합니다
//   doc     → tokens 의 «라이트» 팔레트에서 파생합니다
//   nav/list/screen → 화면 정본
//   inline  → 색인(원본을 안 바꿈)
//   앱 아이콘 → source/brand 의 크롬 Q 에서 네 제품의 홈 화면 · 파비콘 아이콘을 그립니다
//             (크롬 렌더러를 띄우므로 몇 초 걸립니다). --sync 는 제품 public 에도 씁니다

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCoverageArgs } from './audit-coverage-imports.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const args = process.argv.slice(2);
const doSync = args.includes('--sync');
const checkOnly = args.includes('--check');
const withBrowser = args.includes('--browser');
const only = args.filter(arg => arg.startsWith('--only='));
if (only.length > 1 || withBrowser && !checkOnly || args.some(arg => !['--sync', '--check', '--browser'].includes(arg) && !arg.startsWith('--only='))) {
  throw new Error('Use --check with optional --browser, --sync and optional --only=product,product.');
}
parseCoverageArgs(only);

/** 순서대로. 앞의 산출물을 뒤가 읽습니다. */
const STEPS = [
  { name: '카르넷 기록 유형 명칭', file: 'build-record-labels.mjs', why: '내부 기록 유형의 표시 명칭을 공통 규칙에서 만듭니다' },
  { name: '권한 설명 문구', file: 'build-permission-copy.mjs', why: '저장된 권한 설명의 표시 문구도 중앙 규칙에서 만듭니다' },
  { name: '화면 문구', file: 'copy-spacing.mjs', extra: ['--write'], why: '검토한 화면 문구를 공통 띄어쓰기 규칙으로 맞춥니다' },
  { name: '원본 사본', file: 'refresh-source.mjs', extra: ['--write'], why: 'source/ 를 원본 저장소의 커밋된 내용으로 맞춥니다' },
  { name: '토큰', file: 'extract-tokens.mjs', why: '색·크기의 뿌리. 나머지가 이 JSON 을 읽습니다' },
  { name: '제품 팔레트', file: 'build-palette.mjs', why: '공통 팔레트를 세 제품의 변수 이름과 형식으로 변환합니다' },
  { name: '메종 이메일', file: 'build-maison-email.mjs', why: '이메일의 인라인 색상을 공통 팔레트에서 계산합니다' },
  { name: '아뜰리에 HTML 문서', file: 'build-atelier-html.mjs', why: '이메일과 HTML 내보내기의 색상 및 치수를 공통 규칙에서 계산합니다' },
  { name: '제품 기반', file: 'build-foundation.mjs', why: '배경, 인증, 셸과 전역 규칙을 공통 인자와 조합합니다' },
  { name: '기본 UI 구현', file: 'build-component-implementations.mjs', extra: [...only], why: '검토한 기본 부품 구현을 큐 디자인 정본과 연결하고 공개 내보내기를 기록합니다' },
  { name: '앱 오프라인', file: 'build-native-offline.mjs', extra: [...only], why: 'Android와 iOS 앱의 독립 화면을 공통 규칙에서 만듭니다' },
  { name: '앱 시작 장면', file: 'build-native-launcher.mjs', extra: [...only], why: 'Android 세 앱의 실제 시작 화면을 하나의 공통 표현 규칙에서 만듭니다' },
  { name: 'iOS 공용 장면', file: 'build-ios-components.mjs', extra: [...only], why: '기존 UIKit 시작 화면과 안내 메시지를 정본 구현에서 만듭니다' },
  { name: '앱 시작 인자', file: 'native-style-arguments.mjs', why: 'Java 구문 트리로 시작 화면의 리터럴과 실제 표현 인자를 목록화합니다' },
  { name: '접근 시뮬레이터', file: 'build-atelier-simulator.mjs', why: '독립 접근 검토 화면도 공통 기반과 팔레트에서 만듭니다' },
  { name: '계단', file: 'extract-ramp.mjs', extra: ['--write', ...only], why: 'Q 계열이 쓰는 샴페인 값에서 계단을 뽑습니다' },
  { name: '글꼴', file: 'fetch-fonts.mjs', why: '이미 받아 둔 것은 건너뜁니다', optional: true },
  { name: '공통 모노 글꼴', file: 'build-mono-fonts.mjs', extra: ['--write'], why: '검증한 모노 글꼴 선언과 실제 파일을 세 제품에 함께 내보냅니다' },
  { name: '업무 아이콘', file: 'build-icons.mjs', why: '고정 버전의 Phosphor SVG를 단색 업무 아이콘으로 내보냅니다' },
  { name: 'React 업무 아이콘', file: 'build-react-icons.mjs', why: '제품에서 직접 가져올 수 있는 개별 React 모듈을 만듭니다' },
  { name: '업무 아이콘 연결', file: 'sync-react-icons.mjs', extra: [doSync ? '--write' : '--check', ...only], why: '실제 업무 화면이 가져오는 아이콘 모듈과 공통 구현을 함께 내보내고 대조합니다' },
  { name: '대비 문서', file: 'contrast-table.mjs', extra: ['--write'], why: 'docs/02 의 대비표를 계산해서 직접 씁니다' },
  { name: '문서', file: 'extract-doc.mjs', why: '라이트 팔레트에서 파생 + 종이 위 AA 검증' },
  { name: '종이 문서 v8', file: 'extract-mqdoc.mjs', why: 'MedQraft 종이 문서 규격서 v8 에서 뽑고 회사 Word 변환기와 대조' },
  { name: '차림표', file: 'extract-nav.mjs' },
  { name: '목록', file: 'extract-list.mjs' },
  { name: '뼈대', file: 'extract-screen.mjs' },
  { name: '인라인 색인', file: 'extract-inline-styles.mjs', why: '원본을 바꾸지 않는 색인' },
  { name: '앱 아이콘', file: 'app-icons.mjs', why: '네 제품 홈 화면 · 파비콘 아이콘을 dist/app-icons 에 그립니다' },
];

function run(file, extra = []) {
  const p = join(HERE, file);
  if (!existsSync(p)) return { skipped: true };
  const r = spawnSync(process.execPath, [p, ...extra], { cwd: ROOT, encoding: 'utf8' });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

if (checkOnly) {
  console.log('검사만 합니다 (아무것도 안 씁니다)');
  console.log('');
  // 사본이 낡았는지 먼저 봅니다. 낡은 source/ 에서 파생된 산출물은 «맞게 틀립니다».
  const src = run('refresh-source.mjs', ['--check']);
  console.log(src.out.trim());
  const tbl = run('contrast-table.mjs', ['--check']);
  console.log(tbl.out.trim() || tbl.err || '');
  const palette = run('build-palette.mjs', ['--check']);
  console.log(palette.out.trim());
  const native = run('build-native-offline.mjs', ['--check', ...only]);
  console.log(native.out.trim());
  const copy = run('copy-spacing.mjs', ['--check']);
  console.log(copy.out.trim());
  const components = run('check-components.mjs', withBrowser ? ['--browser'] : []);
  console.log(components.out.trim());
  // 종이 문서 v8: 산출물이 규격서와 맞는가 · 변환기와의 차이가 알려진 것뿐인가
  const mqd = run('extract-mqdoc.mjs', ['--check']);
  console.log(mqd.out.trim());
  console.log('');
  // 「디자인 다 뽑았나」에 숫자로 답하는 자리입니다.
  const cov = run('audit-coverage.mjs', only);
  console.log(cov.out.trim());
  console.log('');
  const r = run('sync.mjs', only);
  console.log(r.out.trim());
  console.log('');
  // 앱 아이콘: 제품 public 의 아이콘이 지금 원본으로 그린 것과 같은가 (그림 파일이라 지문 머리표 대신 전체 대조)
  const ico = run('app-icons.mjs', ['--check']);
  console.log(ico.out.trim());
  process.exit((src.code || 0) || (tbl.code || 0) || (palette.code ?? 1) || (native.code ?? 1) || (copy.code ?? 1) || (components.code ?? 1) || (mqd.code || 0) || (cov.code || 0) || (r.code ?? 0) || (ico.code || 0));
}

console.log('산출물 다시 만들기');
console.log('');
let failed = 0;
for (const step of STEPS) {
  const r = run(step.file, step.extra ?? []);
  if (r.skipped) {
    console.log('  건너뜀  ' + step.name + '  (' + step.file + ' 가 없습니다)');
    continue;
  }
  const ok = r.code === 0;
  if (!ok && !step.optional) failed++;
  const first = (r.out.trim().split('\n')[0] || '').slice(0, 70);
  console.log('  ' + (ok ? 'OK    ' : '실패  ') + step.name.padEnd(12) + first);
  if (!ok) {
    console.log(r.out.trim().split('\n').slice(0, 8).map((l) => '        ' + l).join('\n'));
    if (!step.optional) break;
  }
}

if (failed) {
  console.log('');
  console.log('  실패한 단계가 있습니다. 내보내지 않습니다.');
  process.exit(1);
}

// 금지 문자 검사: 산출물에도 적용합니다.
const chars = run('check-chars.mjs');
console.log('  ' + (chars.code === 0 ? 'OK    ' : '실패  ') + '문자 검사'.padEnd(12) + (chars.out.trim().split('\n')[0] || '').slice(0, 70));
if (chars.code !== 0) {
  console.log(chars.out.trim().split('\n').slice(0, 6).map((l) => '        ' + l).join('\n'));
  process.exit(1);
}

if (!doSync) {
  console.log('');
  console.log('  만들었습니다. 제품으로 내보내려면 --sync 를 붙이거나 `node tools/sync.mjs --write` 를 돌리세요.');
  process.exit(0);
}

console.log('');
console.log('제품으로 내보내기');
console.log('');
const s = run('sync.mjs', ['--write', ...only]);
console.log(s.out.trim().split('\n').map((l) => '  ' + l).join('\n'));
if (s.code !== 0) process.exit(1);

// 내보낸 뒤 «정말 같아졌는지» 다시 봅니다. 쓰기가 성공했다는 것과 같아졌다는 것은 다릅니다.
const v = run('sync.mjs', only);
console.log('');
if (v.code === 0) {
  console.log('  확인: 모든 사본이 원본과 같습니다.');
} else {
  console.log('  ⚠️ 내보낸 뒤에도 어긋난 곳이 있습니다:');
  console.log(v.out.trim().split('\n').filter((l) => l.includes('어긋남') || l.includes('없음')).map((l) => '  ' + l).join('\n'));
  process.exit(1);
}

// 앱 아이콘도 제품 public 으로 냅니다. 이 도구는 쓴 뒤 다시 읽어 대조까지 합니다.
const icons = run('app-icons.mjs', ['--write', ...only]);
console.log('');
console.log(icons.out.trim().split('\n').filter((l) => !/그대로/.test(l)).map((l) => '  ' + l).join('\n'));
if (icons.code !== 0) process.exit(1);

const native = run('build-native-offline.mjs', ['--write', ...only]);
console.log(native.out.trim());
if (native.code !== 0) process.exit(1);
const nativeLaunch = run('build-native-launcher.mjs', ['--write', ...only]);
console.log(nativeLaunch.out.trim());
if (nativeLaunch.code !== 0) process.exit(1);
const iosComponents = run('build-ios-components.mjs', ['--write', ...only]);
console.log(iosComponents.out.trim());
if (iosComponents.code !== 0) process.exit(1);
const implementations = run('build-component-implementations.mjs', ['--write', ...only]);
console.log(implementations.out.trim());
if (implementations.code !== 0) process.exit(1);
const nativeArguments = run('native-style-arguments.mjs', ['--check']);
console.log(nativeArguments.out.trim());
if (nativeArguments.code !== 0) process.exit(1);
