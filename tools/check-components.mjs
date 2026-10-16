// 정본 검사(작은 판)
//   node tools/check-components.mjs
//
// 2026-10-16 군살 빼기 1단계에서 제품 화면 증명 걸음 219개를 뺐습니다(오너 결정 1 = A안).
// 옛 판(걸음 248개 · 브라우저 검사 포함)은 꼬리표 archive/before-slim-2026-10-16 에 있습니다.
// 남은 것은 Q-Design 이 만드는 산출물의 «다시 만들어도 같은가» 검사와 남기는 시험뿐입니다.
// 4단계에서 검사 명령 하나로 다시 짭니다.
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.some(arg => arg !== '--browser')) throw new Error('Use --browser (accepted, no browser checks remain).');
if (args.includes('--browser')) console.log('브라우저 검사는 없습니다(2026-10-16 정리로 뺐습니다).');

/** 산출물을 다시 만들어 저장본과 바이트로 대조합니다(아무것도 안 씁니다). */
const CHECKS = [
  'build-workspace', 'extract-pull-presentation', 'sync-react-icons', 'build-record-labels', 'build-mono-fonts',
  'build-permission-copy', 'copy-spacing', 'build-palette', 'build-maison-email', 'build-atelier-html',
  'build-foundation', 'build-native-offline', 'build-native-launcher', 'build-ios-components',
  'build-component-implementations', 'build-atelier-simulator', 'build-react-icons',
];
const TESTS = [
  'app-icon-runtime', 'asset-pipeline', 'atelier-html', 'audit-coverage-imports', 'audit-coverage', 'build-atelier-simulator',
  'build-component-implementations', 'build-ios-components', 'build-native-launcher', 'component-style-contract',
  'copy-spacing', 'extract-ramp', 'family-exchange', 'foundation', 'icon-defaults', 'link-protocol', 'maison-email',
  'mono-fonts', 'native-offline', 'native-palette-roles', 'palette', 'permission-copy', 'qd-adapter-values',
  'sync-html-consumers', 'sync-react-icons', 'tag-metrics-probe', 'typography-links',
];

const steps = [
  ...CHECKS.map(name => [`tools/${name}.mjs`, '--check']),
  ['--test', ...TESTS.map(name => `tools/${name}.test.mjs`)],
];
for (const step of steps) {
  console.log(`\nChecking ${step.length > 3 ? `${step[0]} (${step.length - 1} files)` : step.join(' ')}`);
  const result = spawnSync(process.execPath, step, { cwd: root, stdio: 'inherit', windowsHide: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('Canon checks passed.');
