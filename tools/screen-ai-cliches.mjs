// =============================================================================
// AI 티 나는 디자인 클리셰 스크리닝 (2판)
// =============================================================================
// 1판은 금색 hex 를 «보라» 로 잡는 오탐이 19건 전부였습니다.
// 색은 정규식이 아니라 **파싱해서 판정**합니다.
//
//   node screen-ai-cliches.mjs [경로]
//
// 범위를 셋으로 나눕니다. 같은 코드라도 자리에 따라 판정이 달라지기 때문입니다.
//   screen  화면 (app/**·components/**·lib/design/**)   ← 오빠가 보는 곳
//   mail    이메일 템플릿 (lib/email·notify-*)          ← 메일 클라이언트는 제약이 달라 예외가 많음
//   other   그 밖
//
// ⚠️ «찾았다» 가 곧 «잘못» 은 아닙니다. 판정은 화면을 보고 사람이 합니다.
//    이 도구는 어디를 볼지 좁혀 줍니다.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.argv[2] || 'D:/Claude/Q-Atelier';
const SKIP = new Set(['node_modules', '.next', '.git', 'android', 'capacitor-www', 'public', 'docs', 'tests', 'scripts']);

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx|ts|css)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

const zoneOf = (rel) => {
  if (/^lib\/(email|.*notify)/.test(rel) || /notify-/.test(rel)) return 'mail';
  if (/^(app|components)\//.test(rel) || /^lib\/design\//.test(rel)) return 'screen';
  return 'other';
};

// ── 색 판정: 정규식이 아니라 파싱해서 «보라인가» 를 묻습니다 ────────────────
const hex2rgb = (h) => {
  let s = h.replace('#', '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};
/** 보라~인디고: 파랑이 가장 세고, 초록이 가장 약하고, 빨강이 중간. */
function isPurple(hex) {
  const [r, g, b] = hex2rgb(hex);
  return b > 90 && b - g > 40 && r - g > 15 && b >= r;
}
/** 금색 계열인가 (이 저장소의 브랜드색이라 오탐의 주범). */
function isGold(hex) {
  const [r, g, b] = hex2rgb(hex);
  return r > g && g > b && r - b > 40;
}

const RULES = [
  {
    name: '보라 그라데이션',
    desc: '보라~인디고 계열 그라데이션',
    scan(text) {
      const hits = [];
      for (const m of text.matchAll(/linear-gradient\(([^)]*)\)/g)) {
        const hexes = [...m[1].matchAll(/#[0-9a-fA-F]{3,6}\b/g)].map((x) => x[0]);
        if (hexes.some(isPurple) && !hexes.every(isGold)) hits.push(m.index);
      }
      return hits;
    },
  },
  {
    name: '글자 그라데이션',
    desc: '텍스트에 그라데이션 채우기',
    re: /(?:WebkitBackgroundClip|background-clip)\s*:\s*['"]?text/gi,
  },
  {
    name: '글래스모피즘',
    desc: '반투명 + blur 유리 효과',
    re: /backdrop-?[Ff]ilter\s*:\s*['"]?\s*blur/g,
  },
  {
    name: 'pill 라운드',
    desc: '알약형 모서리 (9999px · 50%)',
    re: /border-?[Rr]adius:\s*['"]?(?:9999|999)px|borderRadius:\s*RADIUS\.pill|border-radius:\s*50%|borderRadius:\s*['"]50%['"]/g,
  },
  {
    name: 'eyebrow 라벨',
    desc: '제목 위 작은 대문자 라벨',
    re: /eyebrow/gi,
  },
  {
    name: 'Inter / Geist',
    desc: 'AI 생성물에서 가장 흔한 두 글꼴',
    re: /['"](?:Inter|Geist)['"]/g,
  },
  {
    name: '네온 글로우',
    desc: '번지는 빛 (0 0 큰반경)',
    re: /box-?[Ss]hadow[^;,}]*\b0\s+0\s+[2-9]\d+px/g,
  },
  {
    /*
     * 2026-09-27 오너 결정 «문서 결»(docs/08-paper.md). 금지 목록에는 9월 1일부터 있었는데 이 도구가 세지 않아
     * Q-Atelier 에 188곳이 남았습니다. 금지 목록과 이 도구가 같은 목록을 보게 더합니다.
     * 1px 옆 선은 나무 줄 · 칸 구분 같은 구조선일 수 있어 세지 않습니다(제품 계약 no-side-accent 와 같은 규칙).
     */
    name: '옆 색 선',
    desc: '상자 한쪽의 굵은 색 선 (2px 이상 borderLeft · borderRight · border-left · border-right)',
    scan(text) {
      const hits = [];
      const re = /border(?:Left|Right)\s*:\s*[`'"]?\s*(\d+(?:\.\d+)?)px\s+(?:solid|dashed|double)|border-(?:left|right)\s*:\s*(\d+(?:\.\d+)?)px\s+(?:solid|dashed|double)/g;
      for (const m of text.matchAll(re)) {
        if (Number(m[1] ?? m[2]) >= 2) hits.push(m.index);
      }
      return hits;
    },
  },
  {
    name: '이모지',
    desc: '아이콘·글머리 자리의 이모지',
    re: /['"`][^'"`]{0,3}[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}][^'"`]{0,20}['"`]/gu,
  },
];

const files = walk(ROOT);
const found = new Map(RULES.map((r) => [r.name, []]));

for (const f of files) {
  const rel = relative(ROOT, f).split('\\').join('/');
  const zone = zoneOf(rel);
  const text = readFileSync(f, 'utf8');
  const lines = text.split(/\r?\n/);
  const lineAt = (idx) => text.slice(0, idx).split(/\r?\n/).length;

  for (const rule of RULES) {
    const idxs = rule.scan
      ? rule.scan(text)
      : [...text.matchAll(rule.re)].map((m) => m.index);
    for (const idx of idxs) {
      const line = lineAt(idx);
      const src = (lines[line - 1] || '').trim();
      if (/^\s*(?:\/\/|\/\*|\*)/.test(lines[line - 1] || '')) continue; // 주석은 «설명» 이지 «쓰임» 이 아닙니다
      found.get(rule.name).push({ file: rel, line, src: src.slice(0, 96), zone });
    }
  }
}

console.log('# AI 티 나는 디자인 요소 스크리닝');
console.log('');
console.log('대상 ' + files.length + '개 파일 · ' + ROOT + ' · 주석 줄 제외');
console.log('');
console.log('| 항목 | 화면 | 메일 | 그 밖 | 설명 |');
console.log('|---|---:|---:|---:|---|');
for (const r of RULES) {
  const hits = found.get(r.name);
  const c = (z) => hits.filter((h) => h.zone === z).length;
  console.log('| ' + r.name + ' | **' + c('screen') + '** | ' + c('mail') + ' | ' + c('other') + ' | ' + r.desc + ' |');
}
console.log('');
console.log('«화면» 만이 오빠가 보는 곳입니다. 메일은 클라이언트 제약이 달라 별개로 봅니다.');
console.log('');

for (const r of RULES) {
  const hits = found.get(r.name).filter((h) => h.zone === 'screen');
  if (!hits.length) continue;
  console.log('## ' + r.name + ' · 화면 ' + hits.length + '건');
  console.log('');
  const byFile = {};
  for (const h of hits) (byFile[h.file] ||= []).push(h);
  for (const [file, hs] of Object.entries(byFile).sort((a, b) => b[1].length - a[1].length).slice(0, 10)) {
    console.log('- `' + file + '` (' + hs.length + ')');
    for (const h of hs.slice(0, 2)) console.log('    ' + h.line + ': ' + h.src);
  }
  const rest = Object.keys(byFile).length - 10;
  if (rest > 0) console.log('- 외 ' + rest + '개 파일');
  console.log('');
}
