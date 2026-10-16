// =============================================================================
// 대외 문서(MedQraft) 토큰 뽑기
// =============================================================================
//   node tools/extract-brief.mjs
//
// Q-Design 은 이제 «두 브랜드» 를 담습니다. 헷갈리면 안 되므로 이름을 나눕니다.
//
//   제품 문서 (Q-Atelier)   앱이 만들어 내는 DOCX·인쇄물. 앱 팔레트의 종이판
//                          → dist/q-design.doc.*        · 먹색 #0c0c0c + 샴페인
//   대외 문서 (MedQraft)    제안서·견적서·계약서·요건서. IR 덱에서 온 별도 브랜드
//                          → dist/q-design.brief.*      · 네이비 #0E1116 + 금 #D6B56D
//
// 🔑 둘은 «값이 다른 같은 장치» 입니다. 금색 짧은 선 + 대문자 라벨, 카드 왼쪽 액센트 띠,
//    조용한 표면 계단 같은 장치는 같고, 색·글꼴·모서리·간격 눈금이 다릅니다.
//    섞으면 둘 다 무너지므로 이 파일이 경계를 지킵니다.
//
// 원본: D:/Claude/MedQraft/templates/assets/colors_and_type.css
//       (source/brief/ 에 복사본이 있고 이 스크립트는 복사본을 읽습니다)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emit, emitDone, CHECK } from './emit.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const SRC = join(ROOT, 'source', 'brief', 'colors_and_type.css');
const DIST = join(ROOT, 'dist');

const css = readFileSync(SRC, 'utf8');

// `:root { ... }` 안의 --mq-* 를 모읍니다. 주석은 먼저 걷어냅니다.
const at = css.indexOf(':root');
const open = css.indexOf('{', at);
let depth = 0;
let i = open;
for (; i < css.length; i++) {
  if (css[i] === '{') depth++;
  else if (css[i] === '}') {
    depth--;
    if (depth === 0) break;
  }
}
const body = css.slice(open + 1, i).replace(/\/\*[\s\S]*?\*\//g, '');
const vars = {};
for (const m of body.matchAll(/(--mq-[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g)) vars[m[1]] = m[2].trim();

if (Object.keys(vars).length < 30) {
  console.error('변수를 ' + Object.keys(vars).length + '개밖에 못 찾았습니다. 파서나 원본 형식을 확인하세요.');
  process.exit(1);
}

const pick = (prefix) =>
  Object.fromEntries(
    Object.entries(vars)
      .filter(([k]) => k.startsWith(prefix))
      .map(([k, v]) => [k.replace(prefix, ''), v]),
  );

// ── 종이 위 대비 검증 ───────────────────────────────────────────────────────
// 대외 문서는 «다크가 원본, 종이가 거울» 입니다. 실제로 나가는 것은 종이(PDF)이므로
// 종이 쪽을 잽니다.
const srgb = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
const lum = (hex) => {
  const s = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((k) => parseInt(s.slice(k, k + 2), 16));
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
};
const ratio = (a, b) => {
  const la = lum(a);
  const lb = lum(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};

const PAPER = vars['--mq-paper'];
const IVORY = vars['--mq-ivory'];

/*
 * ⚠️ 대비를 재는 것은 «글자로 쓰이는 색» 뿐입니다.
 *    `--mq-gold` 는 2026-09-10 부터 **장식 전용**(선·면·표지 워터마크)이고,
 *    종이 위 글자에는 `--mq-gold-ink` 를 씁니다. 장식에 4.5 를 요구하면
 *    브랜드 금색을 잃게 되고, 반대로 글자를 안 재면 안 읽히는 라벨이 남습니다.
 */
const paperText = {
  ink1: vars['--mq-ink-1'],
  ink2: vars['--mq-ink-2'],
  ink3: vars['--mq-ink-3'],
  goldInk: vars['--mq-gold-ink'],
  indigoInk: vars['--mq-indigo-ink'],
};
const decorative = { gold: vars['--mq-gold'] };

const contrast = {};
for (const [k, v] of Object.entries(paperText)) {
  if (!v) continue;
  contrast[k] = {
    hex: v,
    onPaper: Number(ratio(v, PAPER).toFixed(2)),
    onIvory: Number(ratio(v, IVORY).toFixed(2)),
  };
}

// 글자 색이 하나라도 미달이면 산출물을 쓰지 않습니다.
const under = Object.entries(contrast).filter(([, v]) => Math.min(v.onPaper, v.onIvory) < 4.5);
if (under.length) {
  console.error('종이 위 AA 미달:');
  for (const [k, v] of under) console.error('  ' + k + ' ' + v.hex + '  ' + v.onPaper + ' / ' + v.onIvory);
  console.error('\n원본(MedQraft/templates/assets/colors_and_type.css)의 종이용 토큰을 고치십시오.');
  process.exit(1);
}

const out = {
  $meta: {
    name: 'Q-Design 대외 문서 토큰 (MedQraft)',
    note: '생성물입니다. 원본은 MedQraft/templates/assets/colors_and_type.css 입니다.',
    scope: '제안서 · 견적서 · 계약서 · 요건서 · RFI · IR 덱',
    notThis: '앱이 만들어 내는 DOCX 는 이것이 아니라 q-design.doc.json 을 씁니다(제품 문서 브랜드).',
  },
  surface: { bg: vars['--mq-bg'], bg2: vars['--mq-bg-2'], panel: vars['--mq-panel'], panel2: vars['--mq-panel-2'], panel3: vars['--mq-panel-3'], line: vars['--mq-line'], line2: vars['--mq-line-2'] },
  accent: { gold: vars['--mq-gold'], gold2: vars['--mq-gold-2'], goldSoft: vars['--mq-gold-soft'], goldDeep: vars['--mq-gold-deep'], indigo: vars['--mq-indigo'], indigo2: vars['--mq-indigo-2'] },
  textOnDark: { t1: vars['--mq-text-1'], t2: vars['--mq-text-2'], t3: vars['--mq-text-3'], t4: vars['--mq-text-4'] },
  paper: { paper: PAPER, ivory: IVORY, ink1: vars['--mq-ink-1'], ink2: vars['--mq-ink-2'], ink3: vars['--mq-ink-3'], rule: vars['--mq-rule'], ruleStrong: vars['--mq-rule-strong'] },
  semantic: { success: vars['--mq-success'], info: vars['--mq-info'], warn: vars['--mq-warn'], danger: vars['--mq-danger'] },
  /* 의미색은 «글자» 와 «그 뒤에 까는 면» 이 짝입니다. 글자만 내보내면 받는 쪽이
     배경을 스스로 지어내고, 그러면 네 제품의 알림 상자가 서로 달라집니다. */
  semanticBg: { success: vars['--mq-success-bg'], info: vars['--mq-info-bg'], warn: vars['--mq-warn-bg'], danger: vars['--mq-danger-bg'] },
  font: { sans: vars['--mq-font-sans'], mono: vars['--mq-font-mono'] },
  size: pick('--mq-size-'),
  lineHeight: pick('--mq-lh-'),
  tracking: pick('--mq-track-'),
  space: pick('--mq-s-'),
  radius: pick('--mq-radius-'),
  motion: { easeOut: vars['--mq-ease-out'], easeIn: vars['--mq-ease-in'], fast: vars['--mq-dur-fast'], base: vars['--mq-dur-base'], slow: vars['--mq-dur-slow'] },
  shadow: { s1: vars['--mq-shadow-1'], s2: vars['--mq-shadow-2'] },
  contrastOnPaper: contrast,
  decorativeOnly: decorative, // 대비 규칙 밖: 선·면·워터마크
};

/*
 * ── 빠짐 없음 검사 ─────────────────────────────────────────────────────────
 * 🔴 2026-09-10 실측: 원본 82개 중 7개가 조용히 빠져 있었습니다.
 *    의미색 배경 넷 · 그림자 둘 · 별칭 하나. 아무도 몰랐던 이유는 이 스크립트가
 *    «내가 아는 것» 만 집어 갔고, 모르는 것이 생겨도 말이 없었기 때문입니다.
 *    이제 원본의 이름을 전수로 훑고, 값이 산출물 어디에도 없으면 실패합니다.
 *
 * 🔑 값으로 대조합니다. `pick()` 으로 통째로 들어간 것과 이름을 대고 넣은 것을
 *    한 방식으로 볼 수 있고, 그룹 이름을 바꿔도 검사가 안 깨집니다.
 */
const EXPORT_EXEMPT = {
  '--mq-gold-tint': '옛 별칭. --mq-warn-bg 와 같은 값이라 따로 내보내지 않습니다',
  '--mq-navy': '옛 별칭 = --mq-bg',
  '--mq-navy-2': '옛 별칭 = --mq-panel-2',
  '--mq-gold-3': '옛 별칭 = --mq-gold-soft',
  '--mq-ivory-2': '옛 별칭 = --mq-panel-2',
  '--mq-ink-4': '옛 별칭 = --mq-text-4',
  '--mq-rule-ink': '옛 별칭 = --mq-line',
};

const shipped = new Set();
(function walk(o) {
  if (typeof o === 'string') shipped.add(o.trim());
  else if (o && typeof o === 'object') Object.values(o).forEach(walk);
})(out);

const dropped = Object.keys(vars).filter((k) => !shipped.has(vars[k]) && !(k in EXPORT_EXEMPT));
if (dropped.length) {
  console.error('원본에 있는데 산출물에 없는 토큰 ' + dropped.length + '개:');
  for (const k of dropped) console.error('  ' + k.padEnd(22) + vars[k]);
  console.error('');
  console.error('내보낼 자리를 만들거나, 안 내보낼 이유를 EXPORT_EXEMPT 에 적으십시오.');
  process.exit(1);
}
/* 면제가 «낡지» 않았는지도 봅니다. 원본에서 사라진 이름이 면제 목록에 남아 있으면
   그 목록이 무엇을 면제하는지 아무도 모르게 됩니다. */
const staleExempt = Object.keys(EXPORT_EXEMPT).filter((k) => !(k in vars));
if (staleExempt.length) {
  console.error('면제 목록이 낡았습니다(원본에 없는 이름): ' + staleExempt.join(', '));
  process.exit(1);
}

emit(join(DIST, 'q-design.brief.json'), JSON.stringify(out, null, 2) + '\n');

emitDone('대외 문서 토큰');
if (CHECK) process.exit(process.exitCode ?? 0);

console.log('생성 완료 · dist/q-design.brief.json');
console.log('  변수 ' + Object.keys(vars).length + ' · 크기 ' + Object.keys(out.size).length + ' · 간격 ' + Object.keys(out.space).length);
console.log('');
console.log('  종이 위 대비 (흰 ' + PAPER + ' / 아이보리 ' + IVORY + ')');
for (const [k, v] of Object.entries(contrast)) {
  const worst = Math.min(v.onPaper, v.onIvory);
  console.log('    ' + k.padEnd(6) + v.hex + '  ' + v.onPaper.toFixed(2) + ' / ' + v.onIvory.toFixed(2) + (worst < 4.5 ? '   ← AA 미달' : ''));
}
