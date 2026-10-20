import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(path, 'utf8');
const PRODUCT = /Claude[\\/]+(?:Q-Atelier|Q-Works|DHR|Lead-Radar)(?![\w-])/i;

// 자식 프로세스에 미리 심는 감시입니다. 경로가 pattern 에 걸리는 파일 읽기와 명령 실행을
// 표준 오류에 「제품 읽기」 로 남깁니다. 제품의 node_modules 도 셉니다(2026-10-20 부터 라이브러리는 Q-Design 자기 것).
function guard(source) {
  const fs = process.getBuiltinModule('node:fs');
  const cp = process.getBuiltinModule('node:child_process');
  const pattern = new RegExp(source, 'i');
  const note = value => {
    const text = String(value instanceof URL ? value.pathname : value);
    if (pattern.test(text)) fs.writeSync(2, `제품 읽기: ${text}\n`);
  };
  for (const name of ['readFileSync', 'readdirSync', 'existsSync', 'statSync', 'lstatSync', 'openSync']) {
    const original = fs[name];
    fs[name] = function (path, ...rest) { note(path); return original.call(this, path, ...rest); };
  }
  for (const name of ['spawnSync', 'execFileSync', 'execSync', 'spawn', 'execFile', 'exec']) {
    const original = cp[name];
    cp[name] = function (...args) {
      for (const arg of args.flat()) {
        if (typeof arg === 'string') note(arg);
        else if (arg && typeof arg === 'object' && arg.cwd) note(arg.cwd);
      }
      return original.apply(this, args);
    };
  }
  process.getBuiltinModule('node:module').syncBuiltinESMExports();
}
const guarded = pattern => ['--import', 'data:text/javascript,' + encodeURIComponent(`(${guard})(${JSON.stringify(pattern.source)});`)];
const run = (cwd, args) => spawnSync(process.execPath, [...guarded(PRODUCT), 'tools/extract-ramp.mjs', ...args], { cwd, encoding: 'utf8' });
const declared = css => [...css.matchAll(/^\s*(--[\w-]+):\s*(#[\da-f]{6});/gm)].map(([, token, hex]) => ({ token, hex }));

// 정본을 바꿔 보는 시험은 D:/Claude/tmp 아래 임시 사본에서 돌립니다.
function withCopy(check) {
  const base = join(root, '../tmp');
  mkdirSync(base, { recursive: true });
  const dir = mkdtempSync(join(base, 'qd-extract-ramp-'));
  try {
    for (const file of ['tools/extract-ramp.mjs', 'tools/emit.mjs', 'patterns/champagne-ramp.json']) cpSync(join(root, file), join(dir, file));
    // 감사 모드에서만 쓰는 제품 읽기 도구 자리에, 불리면 실패하는 대역을 둡니다.
    writeFileSync(join(dir, 'tools/audit-coverage-imports.mjs'), "const refuse = () => { throw new Error('감사 모드 도구가 불렸습니다'); };\nexport const parseCoverageArgs = refuse;\nexport const committedCssGraph = refuse;\n");
    check(dir);
  } finally {
    // 지우는 곳은 위 mkdtempSync 가 돌려준 폴더 하나뿐입니다.
    rmSync(dir, { recursive: true, force: true });
  }
}

test('the read guard reports matching file reads and commands', () => {
  // 감시가 빈 그물이 아닌지 먼저 봅니다. 제품이 아닌 지어낸 이름으로 잽니다.
  const script = "import { existsSync } from 'node:fs'; import { spawnSync } from 'node:child_process';"
    + " existsSync('qd-guard-probe-file'); spawnSync(process.execPath, ['-e', '0', 'qd-guard-probe-arg']);";
  const result = spawnSync(process.execPath, [...guarded(/qd-guard-probe/), '--input-type=module', '-e', script], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /제품 읽기: qd-guard-probe-file/);
  assert.match(result.stderr, /제품 읽기: qd-guard-probe-arg/);
});

test('check rebuilds the ramp from the canon file alone and reads no product', () => {
  const result = run(root, ['--check']);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /다시 만들어도 저장본과 같습니다/);
  assert.doesNotMatch(result.stderr, /제품 읽기/);
  const canon = JSON.parse(read(join(root, 'patterns/champagne-ramp.json'))).steps;
  assert.deepEqual(declared(read(join(root, 'dist/q-design.ramp.css'))), canon);
});

test('write lists the canon tokens and hex values in order and check catches a stale file', () => {
  withCopy(dir => {
    const canonPath = join(dir, 'patterns/champagne-ramp.json');
    const changed = JSON.parse(read(canonPath));
    // 제품에 없는 값과 뒤집은 순서로 바꿔, 산출물이 정본만 따르는지 봅니다.
    changed.steps.reverse();
    changed.steps[0].hex = '#123456';
    writeFileSync(canonPath, JSON.stringify(changed, null, 2) + '\n');
    const written = run(dir, ['--write']);
    assert.equal(written.status, 0, written.stdout + written.stderr);
    assert.doesNotMatch(written.stderr, /제품 읽기/);
    const output = join(dir, 'dist/q-design.ramp.css');
    assert.deepEqual(declared(read(output)), changed.steps);
    assert.equal(run(dir, ['--check']).status, 0);
    const before = read(output);
    writeFileSync(canonPath, JSON.stringify({ ...changed, steps: changed.steps.slice(1) }, null, 2) + '\n');
    const stale = run(dir, ['--check']);
    assert.equal(stale.status, 1, stale.stdout + stale.stderr);
    assert.match(stale.stdout, /dist\/q-design\.ramp\.css/);
    assert.equal(read(output), before);
  });
});

test('write, check and adopt cannot be combined', () => {
  withCopy(dir => {
    const canonPath = join(dir, 'patterns/champagne-ramp.json');
    const before = read(canonPath);
    for (const pair of [['--write', '--check'], ['--check', '--adopt'], ['--write', '--adopt']]) {
      const result = run(dir, pair);
      assert.notEqual(result.status, 0, pair.join(' '));
      assert.match(result.stderr, /하나만 씁니다/, pair.join(' '));
    }
    assert.equal(read(canonPath), before);
    assert.equal(existsSync(join(dir, 'dist')), false);
  });
});
