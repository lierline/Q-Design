/*
 * source/ 를 원본에서 다시 받아옵니다.
 *
 * 왜 필요한가 · 이 저장소의 규칙은 「토큰을 손으로 베끼지 않는다」인데, 정작 그 토큰이
 * 들어 있는 `source/` 자체는 **손으로 베낀 사본**이었습니다. README 가 「원본이 바뀌면
 * source/ 를 갱신하고」라고 적어 두었지만, 적어 둔 규칙은 지켜지지 않습니다.
 * 2026-09-10 실측: 계약 넷이 원본에 생겼는데 사본에는 없었고, contrast.test.ts 는
 * 상태색 7종이 들어간 뒤로도 옛 내용이었습니다. 그래서 AA 로 고친 색이 dist 에
 * 반영되지 않아 **Q-Sonar·Q-Forge 가 미달 회색을 계속 쓰고** 있었습니다.
 *
 * 🔑 **원본의 «커밋된» 내용만 가져옵니다**(`git show HEAD:경로`).
 *    워킹트리를 읽으면 다른 세션이 지금 고치는 중인 파일이 사본에 얼어붙습니다.
 *
 * 사용법
 *   node tools/refresh-source.mjs           어긋난 곳을 보여만 줍니다
 *   node tools/refresh-source.mjs --write   실제로 받아옵니다
 *   node tools/refresh-source.mjs --check   어긋나 있으면 종료코드 1 (extract-all 이 씁니다)
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'source');

const WRITE = process.argv.includes('--write');
const CHECK = process.argv.includes('--check');

/*
 * 원본 저장소들. 경로는 이 컴퓨터 기준입니다.
 * repo 를 못 찾으면 «조용히 건너뛰지 않고» 실패합니다. 아무것도 안 보면서 초록불을
 * 내는 것이 가장 나쁩니다.
 */
const REPOS = {
  qa: 'D:/Claude/Q-Atelier',
  mq: 'D:/Claude/MedQraft Docs', // 2026-09-20 폴더 이름이 바뀌었다 (옛 D:/Claude/MedQraft)
};

/*
 * 🔴 Q-Design 이 «내보낸» 파일은 원본이 아닙니다.
 *    `q-design.doc.ts` · `q-design.print.css` 같은 것들은 이 저장소에서 나가서
 *    원본 안에 앉아 있는 사본입니다. 그것을 다시 받아오면 뱀이 제 꼬리를 뭅니다.
 */
const 내보낸것 = (p) => /(^|\/)q-design\./.test(p);

/*
 * 사본 지도. `dest` 는 source/ 아래 폴더.
 *   files  · 원본 안의 경로 목록. 이름을 바꿔 두는 자리는 { from, as }
 *   dir    · 폴더 하나를 통째로 (+ match 로 거름)
 *   grep   · 내용에 이 글자가 든 파일만 (예: style 블록을 가진 화면)
 *   flat   · 경로 구분자를 «__» 로 바꿔 한 폴더에 펼침 (screens/ 의 방식)
 *
 * 🔑 여기 없는 파일이 source/ 에 있으면 «고아» 로 보고합니다. 원본에서 지워졌는데
 *    사본에만 남은 파일이 「진실」 행세를 하는 것을 막습니다.
 */
const MAP = [
  { dest: 'contracts', repo: 'qa', dir: 'lib/design', match: /\.test\.tsx?$/ },
  {
    dest: 'tokens',
    repo: 'qa',
    files: ['lib/design/tokens.ts', 'lib/design/tag-metrics.ts', 'lib/design/sticky-inset.ts', 'lib/design/main-padding.ts'],
  },
  {
    dest: 'components',
    repo: 'qa',
    files: [
      'lib/design/components.tsx',
      'lib/design/segmented-choice.tsx',
      'components/Logo.tsx',
      'components/PageTransition.tsx',
      'components/RibbonBackground.tsx',
      'components/Sidebar.tsx',
      'components/Skeleton.tsx',
      /*
       * 🔴 `components/TopProgressBar.tsx` 는 여기 «없습니다». 이 파일만 방향이
       *    반대입니다. 다른 것들은 Q-Atelier 가 원본이고 여기가 거울이지만,
       *    진행선은 **여기가 원본**이고 두 제품이 sync 로 받습니다(2026-09-10).
       *
       *    한 번 넣었다가 실제로 사고가 났습니다: 정본을 고쳐 sync 로 내보낸 직후
       *    이 도구가 «머리표까지 찍힌 사본» 을 정본 자리에 도로 덮었습니다.
       *    그러면 다음 sync 가 머리표 위에 머리표를 찍습니다.
       *
       * 🔑 판별법: sync.mjs 의 PARTS 에 src 가 `source/…` 인 조각으로 들어 있으면
       *    그 파일은 여기가 원본이므로 이 지도에 넣지 않습니다.
       */
      /* 앱 셸. 원본에서는 그냥 layout.tsx 라 이름만으로는 무엇인지 알 수 없습니다. */
      { from: 'app/(app)/layout.tsx', as: 'app-shell-layout.tsx' },
    ],
  },
  { dest: 'css', repo: 'qa', files: ['app/globals.css', 'app/experts/expert-theme.css'] },
  { dest: 'provider', repo: 'qa', files: ['lib/design/theme-provider.tsx'] },
  {
    /* 화면: style 블록을 «가진» tsx 전부. 목록을 손으로 적으면 새 화면이 빠집니다. */
    dest: 'screens',
    repo: 'qa',
    dirs: ['app', 'components', 'lib'],
    grep: '<style',
    match: /\.tsx$/,
    exclude: /\.test\.tsx$/,
    flat: true,
    /*
     * style 블록이 없는데도 필요한 화면. `extract-screen.mjs` 가 KPI 격자 값을
     * 여기서 읽습니다. 이름을 짧게 둔 것도 그 도구가 그 이름을 부르기 때문입니다.
     * 🔴 지도에 없을 때 «고아» 로 잡혔는데, 실은 도구가 쓰는 파일이었고 낡아 있었습니다.
     */
    also: [{ from: 'app/(app)/audit/page.tsx', as: 'audit-page.tsx' }],
  },
  {
    dest: 'brand',
    repo: 'qa',
    dir: 'public',
    match: /\.(png|svg|json)$/,
    shallow: true,
    also: ['components/Logo.tsx'],
  },
  { dest: 'brief', repo: 'mq', files: ['templates/assets/colors_and_type.css'] },
];

const git = (repo, args, opts = {}) =>
  execFileSync('git', ['-C', REPOS[repo], ...args], { maxBuffer: 64 * 1024 * 1024, ...opts });

/* 원본에서 커밋된 내용을 읽습니다. 없으면 null. */
function readFromHead(repo, path) {
  try {
    return git(repo, ['show', `HEAD:${path}`], { encoding: 'buffer' });
  } catch {
    return null;
  }
}

function listInHead(repo, dirs) {
  const out = git(repo, ['ls-tree', '-r', '--name-only', 'HEAD', ...dirs], { encoding: 'utf8' });
  return out.split('\n').map((s) => s.trim()).filter(Boolean);
}

function grepInHead(repo, needle, dirs) {
  try {
    const out = git(repo, ['grep', '-l', '--fixed-strings', needle, 'HEAD', '--', ...dirs], { encoding: 'utf8' });
    return out.split('\n').map((s) => s.replace(/^HEAD:/, '').trim()).filter(Boolean);
  } catch {
    return [];
  }
}

for (const [name, path] of Object.entries(REPOS)) {
  if (!existsSync(join(path, '.git'))) {
    console.error(`원본 저장소를 못 찾았습니다: ${name} = ${path}`);
    process.exit(2);
  }
}

/* 지도를 펼쳐 «어느 원본 파일이 어느 사본 자리로 가는가» 를 만듭니다. */
const plan = [];
for (const entry of MAP) {
  let paths;
  if (entry.files) {
    paths = entry.files.map((f) => (typeof f === 'string' ? { from: f } : f));
  } else {
    const dirs = entry.dirs ?? [entry.dir];
    let found = entry.grep ? grepInHead(entry.repo, entry.grep, dirs) : listInHead(entry.repo, dirs);
    if (entry.match) found = found.filter((p) => entry.match.test(p));
    if (entry.exclude) found = found.filter((p) => !entry.exclude.test(p));
    if (entry.shallow) found = found.filter((p) => p.split('/').length === entry.dir.split('/').length + 1);
    paths = found
      .map((f) => ({ from: f }))
      .concat((entry.also ?? []).map((f) => (typeof f === 'string' ? { from: f } : f)));
  }
  paths = paths.filter((f) => !내보낸것(f.from));
  if (!paths.length) {
    console.error(`지도 항목이 아무것도 못 찾았습니다: ${entry.dest} (검사가 헛돌고 있습니다)`);
    process.exit(2);
  }
  for (const f of paths) {
    const name = f.as ?? (entry.flat ? f.from.split('/').join('__') : f.from.split('/').pop());
    plan.push({ dest: join(SRC, entry.dest, name), repo: entry.repo, path: f.from });
  }
}

const added = [];
const changed = [];
const orphan = [];
const same = [];

for (const item of plan) {
  const fresh = readFromHead(item.repo, item.path);
  if (!fresh) {
    console.error(`원본에 없습니다: ${item.repo}:${item.path}`);
    process.exit(2);
  }
  if (!existsSync(item.dest)) {
    added.push(item);
    if (WRITE) {
      mkdirSync(dirname(item.dest), { recursive: true });
      writeFileSync(item.dest, fresh);
    }
    continue;
  }
  /* 개행만 다른 것은 «다름» 이 아닙니다. 이 저장소는 core.autocrlf 환경입니다. */
  const norm = (b) => b.toString('binary').split('\r\n').join('\n');
  if (norm(readFileSync(item.dest)) === norm(fresh)) {
    same.push(item);
  } else {
    changed.push(item);
    if (WRITE) writeFileSync(item.dest, fresh);
  }
}

/* 지도가 설명하지 못하는 사본을 찾습니다. */
const key = (p) => p.split('\\').join('/');
const claimed = new Set(plan.map((i) => key(i.dest)));
/*
 * 여기가 «원본» 인 파일들. 지도에 없다고 고아가 아닙니다.
 *
 * 🔴 이 목록이 생긴 경위(2026-09-10): 진행선 부품을 정본으로 삼아 고치고 sync 로
 *    내보낸 직후 이 도구가 «머리표까지 찍힌 사본» 을 정본 자리에 도로 덮었습니다.
 *    지도에서 빼니 이번에는 고아로 잡혀 --write 가 **지울 참**이었습니다.
 *    방향이 반대인 파일은 두 가지를 다 피해야 합니다.
 *
 * 🔑 판별법: sync.mjs 의 PARTS 에 src 가 `source/…` 인 조각으로 들어 있으면
 *    그 파일은 여기가 원본입니다.
 */
const 여기가원본 = new Set(['components/TopProgressBar.tsx']);

for (const entry of MAP) {
  const dir = join(SRC, entry.dest);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) continue;
    if (여기가원본.has(`${entry.dest}/${name}`)) continue;
    if (!claimed.has(key(p))) orphan.push(p);
  }
}

/* 원본 커밋을 적어 둡니다. 「언제 것의 사본인가」를 사람이 물을 수 있게. */
if (WRITE) {
  const stamp = {
    _주의: '이 파일은 tools/refresh-source.mjs 가 만듭니다. 손대지 마십시오.',
    갱신일: new Date().toISOString().slice(0, 10),
    원본: Object.fromEntries(
      Object.entries(REPOS).map(([k, p]) => [
        k,
        { 경로: p, 커밋: git(k, ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim() },
      ]),
    ),
    파일수: plan.length,
  };
  writeFileSync(join(SRC, '_ORIGIN.json'), JSON.stringify(stamp, null, 2) + '\n', 'utf8');
  for (const p of orphan) unlinkSync(p);
}

const short = (p) => key(p).replace(key(SRC) + '/', '');

console.log(`원본 대조: 지도 ${plan.length}개 · 같음 ${same.length}`);
for (const i of added) console.log(`  + 없던 것   ${short(i.dest)}   ← ${i.repo}:${i.path}`);
for (const i of changed) console.log(`  ~ 달라진 것 ${short(i.dest)}   ← ${i.repo}:${i.path}`);
for (const p of orphan) console.log(`  - 고아      ${short(p)}   (원본에 없습니다)`);

const drift = added.length + changed.length + orphan.length;
if (WRITE) {
  console.log(drift ? `\n${drift}곳을 원본에 맞췄습니다.` : '\n이미 원본과 같습니다.');
} else if (drift) {
  console.log(`\n어긋난 곳 ${drift}. \`node tools/refresh-source.mjs --write\` 로 맞추십시오.`);
  if (CHECK) process.exit(1);
} else {
  console.log('\n원본과 같습니다.');
}
