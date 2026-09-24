/*
 * 제품의 «정본 밖 색» 을 정본으로 모읍니다.
 * =============================================================================
 *   node tools/converge.mjs Q-Forge            무엇이 어디로 가는지 봅니다
 *   node tools/converge.mjs Q-Forge --write    가까운 것을 정본 값으로 고칩니다
 *   node tools/converge.mjs Q-Forge --adopt    먼 것을 «정본이 배우게» 합니다
 *
 * 왜 필요한가
 * -----------
 * 2026-09-10 실측: Q-Sonar 4색 · Q-Forge 39색이 정본에 없는 값이었습니다. 그중 대부분은
 * «새 색» 이 아니라 **눈에 안 보이는 차이의 두 번째 사본** 입니다(#1c1c1c vs #1b1b1b).
 * 같은 사실이 두 곳에 있으면 반드시 갈립니다. 값을 맞출 게 아니라 사본을 없앱니다.
 *
 * 🔑 **거리를 재서 «움직이는 폭» 을 먼저 보여 줍니다.** 수렴은 눈에 보이는 변화이고,
 *    사람이 알고 결정해야 합니다. 한도를 넘는 값은 `ALLOW_LOUD` 에 이유와 함께 적기
 *    전까지 고치지 않습니다.
 *
 * 🔑 dE 는 CIE Lab 거리입니다. 대략 1 미만은 못 알아보고, 3 이하는 나란히 놔야 보이고,
 *    6 이상은 그냥 다른 색으로 보입니다.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, existsSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WRITE = process.argv.includes('--write');
const ADOPT = process.argv.includes('--adopt');
const TARGET = process.argv[2];

const PRODUCTS = {
  'Q-Sonar': { repo: 'D:/Claude/Lead-Radar', files: ['src/app/globals.css'] },
  'Q-Forge': { repo: 'D:/Claude/DHR', files: ['app/globals.css'] },
  'Q-Maison': { repo: 'D:/Claude/Q-Works', files: ['app/globals.css'] },
};

/*
 * 한도를 넘어도 옮기기로 «사람이 정한» 것들. 이유를 적지 않으면 넣을 수 없습니다.
 * 여기 없는 큰 이동은 도구가 거부합니다.
 */
const ALLOW_LOUD = {
  /*
   * 비워 둡니다. 2026-09-10 판단: 눈에 보이게 움직일 바에는 **정본이 그 역할을 배우는**
   * 편이 낫습니다(--adopt). 화면을 바꾸지 않고도 정본 밖을 0 으로 만들 수 있습니다.
   * 나중에 「이건 그냥 옮기자」가 생기면 여기에 이유와 함께 적으십시오.
   */
};

const LOUD = 6;

const px = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function lab(hex) {
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [r, g, b] = px(hex)
    .map((c) => c / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const [fx, fy, fz] = [f(x), f(y), f(z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
const de = (a, b) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]));
const norm = (h) => {
  let s = h.slice(1).toLowerCase();
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  return '#' + s.slice(0, 6);
};

if (!TARGET || !PRODUCTS[TARGET]) {
  console.error('제품을 하나 대십시오: ' + Object.keys(PRODUCTS).join(' · '));
  process.exit(2);
}
const P = PRODUCTS[TARGET];

/*
 * 정본이 아는 색 (dist 만. source/ 는 사본이라 넣으면 자기가 자기를 증명합니다)
 *
 * 🔴 **브랜드를 가립니다.** `q-design.brief.*` 와 `q-design.doc.*` 는 MedQraft 문서
 *    브랜드입니다. 가리지 않았더니 Q-Sonar 의 금색이 MedQraft 문서 금색(#d6b56d)으로
 *    갈 뻔했습니다. 두 브랜드의 금색이 섞이면 «한 자리에 금이 둘» 이 됩니다.
 */
const OTHER_BRAND = /^q-design\.(brief|doc)\./;
/* 색 -> 그 색을 맡은 정본 토큰 이름들. 이름이 있어야 «역할» 을 볼 수 있습니다. */
const canonNames = new Map();
const noteColor = (hex, name) => {
  const k = norm(hex);
  if (!canonNames.has(k)) canonNames.set(k, new Set());
  if (name) canonNames.get(k).add(name);
};
for (const f of readdirSync(join(ROOT, 'dist'))) {
  if (!/\.(css|json|ts)$/.test(f)) continue;
  if (OTHER_BRAND.test(f)) continue;
  const t = readFileSync(join(ROOT, 'dist', f), 'utf8');
  for (const m of t.matchAll(/"?(--[a-zA-Z0-9_-]+)"?\s*:\s*"?([^;,"\n}]*)/g)) {
    for (const h of m[2].match(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g) ?? []) noteColor(h, m[1]);
  }
  for (const h of t.match(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g) ?? []) noteColor(h, null);
}
const canon = new Set(canonNames.keys());

/*
 * 🔴 **가까운 색만 보면 역할이 어긋납니다.** Q-Sonar 의 `--color-goldhi`(브랜드 금색의
 *    밝은 칸)를 거리로만 찾았더니 정본의 `--risk-high`(위험도 «높음»)로 갈 뻔했습니다.
 *    눈에는 비슷하지만 뜻이 완전히 다릅니다. 역할이 같은 후보 중에서만 고릅니다.
 *
 * 역할을 못 알아본 이름은 «역할 미확인» 으로 표시합니다. 그 표시가 있는 줄은
 * 사람이 한 번 보고 넘겨야 합니다.
 */
const ROLES = [
  ['금색', /gold|champagne|brand/],
  ['의미색', /(^|[-_])(ok|success|warn|danger|error|info|risk|state)([-_]|$)/],
  ['선', /line|border|rule|edge/],
  ['표면', /bg|surface|canvas|panel|paper|raise|card|tint|overlay|ivory|cream/],
  ['글자', /text|ink|body|muted|subtle|dim|faint|ghost|mist|on-/],
];
const roleOf = (name) => (ROLES.find(([, re]) => re.test(name)) ?? [null])[0];

function candidatesFor(names) {
  const want = new Set(names.map(roleOf).filter(Boolean));
  if (!want.size) return { list: [...canon], sure: false };
  const list = [...canon].filter((c) => {
    const ns = canonNames.get(c);
    return ns && ns.size && [...ns].some((n) => want.has(roleOf(n)));
  });
  return list.length ? { list, sure: true } : { list: [...canon], sure: false };
}

if (canon.size < 50) {
  console.error('정본에서 색을 ' + canon.size + '개밖에 못 찾았습니다. 검사가 헛돕니다.');
  process.exit(2);
}

/* 제품의 «정의» 에 쓰인 색 */
const mine = new Map();
const themeOf = new Map();
for (const f of P.files) {
  const path = join(P.repo, f);
  if (!existsSync(path)) {
    console.error('파일이 없습니다: ' + path);
    process.exit(2);
  }
  const t = readFileSync(path, 'utf8');
  /*
   * 🔑 «어느 테마 블록 안인가» 를 함께 봅니다. 제품은 같은 변수를 다크·라이트에서 두 번
   *    정의합니다. 테마를 모르면 두 값이 한 이름에 겹쳐 보이고, 정본에 넣을 때
   *    어느 쪽인지 알 수 없게 됩니다.
   */
  let theme = 'dark';
  const marks = [...t.matchAll(/(--[a-zA-Z0-9_-]+)\s*:([^;{}]*)[;}]|\[data-theme=['"]?(light|dark)|prefers-color-scheme:\s*(light|dark)/g)];
  for (const m of marks) {
    if (m[3] || m[4]) { theme = m[3] || m[4]; continue; }
    for (const raw of m[2].match(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g) ?? []) {
      const hex = norm(raw);
      if (!mine.has(hex)) mine.set(hex, new Set());
      mine.get(hex).add(m[1]);
      themeOf.set(hex, theme);
    }
  }
}

const gaps = [...mine.keys()].filter((h) => !canon.has(h));
const plan = gaps
  .map((hex) => {
    const names = [...mine.get(hex)].sort();
    const { list, sure } = candidatesFor(names);
    const to = list.reduce((a, c) => (de(hex, c) < de(hex, a) ? c : a));
    const role = [...new Set(names.map(roleOf))].filter(Boolean).join(',');
    return { hex, to, d: de(hex, to), names, sure, role };
  })
  .sort((a, b) => a.d - b.d);

console.log(TARGET + ' · 정의한 색 ' + mine.size + ' · 정본 밖 ' + gaps.length);
console.log('');
for (const p of plan) {
  const tag = p.d < 1 ? '못 알아봄' : p.d < 3 ? '나란히 놔야 보임' : p.d < LOUD ? '보임' : '다른 색';
  console.log(
    '  ' + p.hex + ' → ' + p.to + '  dE ' + p.d.toFixed(2).padStart(5) + '  ' +
      tag.padEnd(16) + (p.sure ? p.role : '역할 미확인').padEnd(9) +
      p.names.join(' ').slice(0, 40),
  );
}

const blocked = plan.filter((p) => p.d >= LOUD && !ALLOW_LOUD[p.hex]);

/*
 * ── 정본이 «배우는» 자리 ───────────────────────────────────────────────────
 * 멀리 떨어진 값은 대개 «다른 색» 이 아니라 **정본에 없는 역할** 입니다.
 * 2026-09-10 실측: Q-Forge 가 혼자 갖고 있던 것들이 이랬습니다.
 *   의미색 배경 8칸 (ok/warn/danger/info x 다크·라이트) · 의미색 선 2칸
 *   브랜드 틴트 면 3칸 · 본문 글자 한 단 2칸
 * 정본에는 의미색 «글자» 만 있고 그 뒤에 까는 «면» 이 없었습니다.
 * 같은 빈칸을 MedQraft 문서 브랜드에서도 같은 날 찾았습니다. 우연이 아닙니다.
 */
if (ADOPT) {
  const rows = blocked.map((p) => {
    const src = p.names[0];
    const bare = src.replace(/^--(dhr|color|qa)-/, '');
    const th = themeOf.get(p.hex) ?? 'dark';
    return { token: '--qa-' + bare, theme: th, hex: p.hex, from: TARGET + ' ' + src };
  });
  const dark = rows.filter((r) => r.theme !== 'light');
  const light = rows.filter((r) => r.theme === 'light');
  const line = (r) => '  ' + r.token + ': ' + r.hex + ';'.padEnd(2) + '   /* ' + r.from + ' */';
  const out = [
    '/* Q-Design · 가족 계층 (정본이 «배운» 역할)',
    ' * 생성물입니다. tools/converge.mjs --adopt 가 만듭니다. 손대지 마십시오.',
    ' *',
    ' * 정본에는 의미색 «글자» 만 있고 그 뒤에 까는 «면» 이 없었습니다. 그래서 제품이',
    ' * 혼자 만들어 썼습니다. 여기 값은 발명한 것이 아니라 제품이 이미 쓰던 값입니다.',
    ' */',
    ':root {',
    ...dark.map(line),
    '}',
    '',
    ':root[data-theme="light"] {',
    ...light.map(line),
    '}',
    '',
  ];
  const path = join(ROOT, 'dist', 'q-design.family.css');
  const prev = existsSync(path) ? readFileSync(path, 'utf8') : '';
  /* 이미 있는 줄은 지우지 않고 합칩니다. 제품을 하나씩 돌리기 때문입니다. */
  const keep = prev
    .split('\n')
    .filter((l) => /^\s{2}--qa-/.test(l) && !rows.some((r) => l.includes(r.token + ':')));
  const merged = [
    ...out.slice(0, 7),
    ...[...keep.filter((l) => !l.includes('data-theme')), ...dark.map(line)].sort(),
    '}',
    '',
    ':root[data-theme="light"] {',
    ...light.map(line).sort(),
    '}',
    '',
  ];
  writeFileSync(path, merged.join('\n'), 'utf8');
  console.log('');
  console.log('정본이 배운 역할 ' + rows.length + '칸 → dist/q-design.family.css');
  for (const r of rows) console.log('  ' + r.token.padEnd(24) + r.hex + '  ' + r.theme.padEnd(5) + r.from);
  console.log('');
  console.log('이제 `node tools/converge.mjs ' + TARGET + '` 을 다시 돌리십시오. 남은 것만 나옵니다.');
  process.exit(0);
}

console.log('');
if (blocked.length) {
  console.log('🔴 dE ' + LOUD + ' 이상 움직이는데 허락이 없는 값 ' + blocked.length + '개. 고치지 않습니다.');
  for (const p of blocked) console.log('   ' + p.hex + ' → ' + p.to + '  ' + p.names.join(' '));
  console.log('');
  console.log('   ALLOW_LOUD 에 이유와 함께 적거나, 정본에 그 역할을 신설하십시오.');
  process.exit(1);
}
const loud = plan.filter((p) => p.d >= LOUD);
if (loud.length) {
  console.log('⚠️ 눈에 보이게 움직이는 값 ' + loud.length + '개 (허락됨)');
  for (const p of loud) console.log('   ' + p.hex + ' → ' + p.to + '  ' + ALLOW_LOUD[p.hex]);
  console.log('');
}

if (!WRITE) {
  console.log('고치려면 --write 를 붙이십시오.');
  process.exit(0);
}

let touched = 0;
for (const f of P.files) {
  const path = join(P.repo, f);
  let t = readFileSync(path, 'utf8');
  const before = t;
  for (const p of plan) {
    /* 대소문자 어느 쪽으로 적혀 있어도 바꿉니다. 값 경계(\b)를 지켜 부분 일치를 막습니다. */
    t = t.replace(new RegExp(p.hex.replace('#', '#'), 'gi'), p.to);
  }
  if (t !== before) {
    const tmp = path + '.tmp';
    writeFileSync(tmp, t, 'utf8');
    renameSync(tmp, path);
    touched++;
  }
}
console.log('고쳤습니다 · 파일 ' + touched + '개 · 값 ' + plan.length + '종');
console.log('');
console.log('이제 그 저장소의 대비·계약 검사를 돌리십시오.');
