/*
 * 샴페인 계단 뽑기
 * =============================================================================
 *   node tools/extract-ramp.mjs            계단과 «누가 얼마나 움직이는지» 를 냅니다
 *   node tools/extract-ramp.mjs --write    dist/q-design.ramp.css 를 씁니다
 *
 * 왜 필요한가
 * -----------
 * 정본에는 샴페인이 한 칸(#b8935a)뿐이고 나머지는 `color-mix` 로 즉석에서 만듭니다.
 * 그래서 Q 계열 세 제품이 **각자 금색 계단을 따로 발명했습니다.** 기준색은 셋 다 같은데
 * 칸이 서로 다릅니다. 같은 자리에 놓고 보면 다른 제품처럼 보입니다.
 *
 * 🔑 **계단을 발명하지 않습니다.** 명도를 일정 간격으로 자른 «깔끔한» 계단을 세 가지
 *    만들어 재 봤더니 가족의 실제 값과 평균 dE 4.2, 최대 14.8 로 벌어졌습니다.
 *    그런 계단으로 수렴시키면 통일이 아니라 재디자인입니다.
 *    그래서 **가족이 이미 쓰는 값** 중에서 대표를 고릅니다(평균 dE 1.57).
 *
 * 🔑 갈래가 둘입니다. 같은 명도라도 **채도가 낮은 샴페인**이 따로 쓰입니다
 *    (Q-Forge 라이트 테마의 brand-mid·pale). 한 계단에 욱여넣으면 dE 15 가 넘습니다.
 *
 * 🔑 대표는 **Q-Atelier 값이 이깁니다.** 정본의 출처이기 때문입니다.
 */

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { committedCssGraph, parseCoverageArgs } from './audit-coverage-imports.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WRITE = process.argv.includes('--write');
const options = parseCoverageArgs(process.argv.slice(2).filter(arg => arg !== '--write'));

/* Q 계열만입니다. MedQraft 는 별도 브랜드입니다(2026-09-10 결정). */
const FAMILY = [
  { name: 'Q-Atelier', repo: 'D:/Claude/Q-Atelier', files: ['app/globals.css'], canon: true },
  { name: 'Q-Works', repo: 'D:/Claude/Q-Works', files: ['app/globals.css'] },
  { name: 'Q-Forge', repo: 'D:/Claude/DHR', files: ['app/globals.css'] },
];

/* 샴페인 갈래로 볼 범위. 경고(S 60+)·구리 같은 별도 의미색과 표면(L 72+)은 제외합니다. */
const HUE = [33, 38];
const SAT = [18, 45];
const LIT = [5, 72];
const MUTED_BELOW = 28; // 채도가 이보다 낮으면 «물림» 갈래
const L_GAP = 4; // 명도가 이만큼 벌어지면 다른 칸

const px = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function hsl(hex) {
  const [r, g, b] = px(hex).map((c) => c / 255);
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l * 100];
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h;
  if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}
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

/* 가족이 실제로 쓰는 샴페인 값과, 그것을 쓰는 제품·변수 이름 */
const used = new Map();
for (const p of FAMILY.filter(product => !options.only || options.only.has(product.name))) {
  if (!existsSync(join(p.repo, '.git'))) {
    console.error('저장소를 못 찾았습니다: ' + p.repo);
    process.exit(2);
  }
  // Palette declarations now live in imported generated CSS. The committed
  // import graph proves what reaches the app instead of reading only its entry.
  for (const t of committedCssGraph(p.repo, p.files).values()) {
    for (const m of t.matchAll(/(--[a-zA-Z0-9_-]+)\s*:([^;{}]*)[;}]/g)) {
      for (const raw of m[2].match(/#[0-9a-fA-F]{6}\b/g) ?? []) {
        const hex = raw.toLowerCase();
        const [h, s, l] = hsl(hex);
        if (h < HUE[0] || h > HUE[1] || s < SAT[0] || s > SAT[1] || l < LIT[0] || l > LIT[1]) continue;
        if (!used.has(hex)) used.set(hex, { products: new Set(), names: new Set() });
        used.get(hex).products.add(p.name);
        used.get(hex).names.add(p.name + ' ' + m[1]);
      }
    }
  }
}

if (used.size < 8) {
  console.error('샴페인 값을 ' + used.size + '개밖에 못 찾았습니다. 범위나 원본을 확인하십시오.');
  process.exit(2);
}

/* 갈래 → 명도 묶음 → 대표 */
const byBranch = { deep: [], mute: [] };
for (const hex of used.keys()) byBranch[hsl(hex)[1] >= MUTED_BELOW ? 'deep' : 'mute'].push(hex);

const steps = [];
for (const [branch, list] of Object.entries(byBranch)) {
  const sorted = list.sort((a, b) => hsl(a)[2] - hsl(b)[2]);
  let group = [];
  const flush = () => {
    if (!group.length) return;
    const rep = group.reduce((best, h) => {
      const score = (x) => [
        used.get(x).products.has('Q-Atelier') ? 1 : 0,
        used.get(x).products.size,
        -group.reduce((a, o) => a + de(x, o), 0),
      ];
      const [a1, a2, a3] = score(h);
      const [b1, b2, b3] = score(best);
      return a1 !== b1 ? (a1 > b1 ? h : best) : a2 !== b2 ? (a2 > b2 ? h : best) : a3 > b3 ? h : best;
    });
    steps.push({ branch, hex: rep, l: hsl(rep)[2], members: group.slice() });
    group = [];
  };
  for (let i = 0; i < sorted.length; i++) {
    if (i && hsl(sorted[i])[2] - hsl(sorted[i - 1])[2] > L_GAP) flush();
    group.push(sorted[i]);
  }
  flush();
}
steps.sort((a, b) => (a.branch === b.branch ? a.l - b.l : a.branch < b.branch ? -1 : 1));

/* 이름 붙이기: 어두운 쪽이 1 */
let di = 0;
let mi = 0;
for (const s of steps) s.token = s.branch === 'deep' ? `--qa-champagne-${++di}` : `--qa-champagne-mute-${++mi}`;

/* 얼마나 움직이는가 */
const movers = [];
for (const [hex, info] of used) {
  const near = steps.reduce((a, s) => (de(hex, s.hex) < de(hex, a.hex) ? s : a));
  if (near.hex !== hex) movers.push({ hex, to: near.hex, token: near.token, d: de(hex, near.hex), who: [...info.names] });
}
movers.sort((a, b) => b.d - a.d);
const ds = [...used.keys()].map((h) => Math.min(...steps.map((s) => de(h, s.hex))));
const mean = ds.reduce((a, b) => a + b, 0) / ds.length;

console.log('샴페인 계단 · 가족이 쓰는 값 ' + used.size + '개에서 뽑은 ' + steps.length + '칸');
console.log('');
for (const s of steps) {
  const who = [...new Set(s.members.flatMap((m) => [...used.get(m).products]))].sort().join(',');
  console.log('  ' + s.token.padEnd(22) + s.hex + '   L' + s.l.toFixed(1).padStart(5) + '   ' + who);
}
console.log('');
console.log('  맞춤 · 평균 dE ' + mean.toFixed(2) + ' · dE<3 인 것 ' + ds.filter((d) => d < 3).length + '/' + ds.length);
console.log('');
console.log('수렴하면 움직이는 값 ' + movers.length + '개');
for (const m of movers) {
  console.log('  ' + m.hex + ' → ' + m.to + '  dE ' + m.d.toFixed(2).padStart(5) + '   ' + m.who.join(' / ').slice(0, 64));
}

/*
 * 🔑 크게 움직이는 것은 «조용히» 넘기지 않습니다. 수렴은 눈에 보이는 변화이고,
 *    사람이 그것을 알고 결정해야 합니다. 한도를 넘으면 이름을 대며 멈춥니다.
 */
const LOUD = 6;
const loud = movers.filter((m) => m.d >= LOUD);
if (loud.length) {
  console.log('');
  console.log('  ⚠️ dE ' + LOUD + ' 이상 움직이는 값 ' + loud.length + '개. 눈에 보입니다.');
  for (const m of loud) console.log('     ' + m.hex + ' → ' + m.to + '  ' + m.who.join(' / ').slice(0, 60));
}

if (!WRITE) {
  console.log('');
  console.log('  쓰려면 --write 를 붙이십시오.');
  process.exit(0);
}

const lines = [
  '/* Q-Design · 샴페인 계단',
  ' * 생성물입니다. tools/extract-ramp.mjs 가 만듭니다. 손대지 마십시오.',
  ' *',
  ' * 발명한 계단이 아니라 Q 계열 세 제품이 «이미 쓰고 있는» 값에서 뽑은 대표입니다.',
  ' * deep = 진한 갈래 · mute = 채도를 낮춘 갈래 (라이트 테마의 브랜드 틴트에 쓰입니다)',
  ' */',
  ':root {',
  ...steps.map((s) => '  ' + s.token + ': ' + s.hex + ';   /* L' + s.l.toFixed(1) + ' */'),
  '}',
  '',
];
writeFileSync(join(ROOT, 'dist', 'q-design.ramp.css'), lines.join('\n'), 'utf8');

const jsonPath = join(ROOT, 'dist', 'q-design.tokens.json');
const json = JSON.parse(readFileSync(jsonPath, 'utf8'));
json.champagneRamp = Object.fromEntries(steps.map((s) => [s.token.replace('--qa-', ''), s.hex]));
writeFileSync(jsonPath, JSON.stringify(json, null, 2) + '\n', 'utf8');

console.log('');
console.log('  생성 완료 · dist/q-design.ramp.css (' + steps.length + '칸) + tokens.json 의 champagneRamp');
