// =============================================================================
// 정본이 라틴 자간을 거는 자리에, 한글이 그대로 박혀 있는 곳을 찾는다
// =============================================================================
//   node tools/check-hangul-source.mjs
//
// ── 왜 화면 실측만으로는 부족한가 ────────────────────────────────────────────
// tools/check-hangul-live.mjs 는 띄운 화면을 전수로 잽니다. 그것이 본 검사이고,
// 상속이든 클래스든 유틸리티든 다 잡습니다. 다만 **그 순간 안 그려진 자리**는
// 못 봅니다.
//
// 실제로 그렇게 놓쳤습니다. Q-Sonar 차림표의 Sender 줄은 발신 정보가 비어 있을
// 때만 그려지는데, 그 안의 「미설정」이 8px 벌어져 있었습니다(48px → 40px).
// 화면 1,313곳을 다 재고도 안 잡혔습니다 - 데모 계정은 발신 정보가 차 있었으니까요.
//
// 그래서 이 검사는 반대쪽에서 봅니다. 소스에 «글자로 박힌» 한글만 봅니다.
// 값이 변수에서 오면(`{label}`) 여기서는 못 봅니다 - 그쪽은 화면 실측이 봅니다.
// 둘이 서로의 빈 곳을 메웁니다. 하나만 두면 반쪽입니다.
//
// ── 어느 자리가 «라틴 자간을 거는 자리» 인가 ──────────────────────────────────
// 목록을 손으로 적지 않습니다. 정본 CSS 를 읽어서 letter-spacing 이 양수이거나
// text-transform: uppercase 인 규칙의 클래스를 뽑습니다. 정본이 바뀌면 이 검사가
// 보는 자리도 같이 바뀝니다 - 사본을 만들지 않습니다.
// =============================================================================

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const DIST = 'D:/Claude/Q-Design/dist';
const 저장소 = {
  'Q-Sonar': { root: 'D:/Claude/Lead-Radar', src: 'src' },
  'Q-Forge': { root: 'D:/Claude/DHR', src: '.' },
  'Q-Maison': { root: 'D:/Claude/Q-Works', src: '.' },
};

/* ── 1. 정본에서 «라틴 자간을 거는 클래스» 를 뽑는다 ──────────────────────────── */
function 라틴자간클래스() {
  const 모음 = new Set();
  for (const f of ['q-design.nav.css', 'q-design.list.css', 'q-design.screen.css']) {
    /* 주석을 먼저 지웁니다. 안 지우면 주석 안의 letter-spacing 설명이 규칙으로 잡힙니다 */
    const css = readFileSync(join(DIST, f), 'utf8').replace(/\r\n/g, '\n').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const sel = m[1].trim();
      const body = m[2];
      if (!sel || sel.startsWith('@')) continue;
      const ls = /letter-spacing:\s*([^;]+);/.exec(body);
      /*
       * 눈에 보이는 만큼만 셉니다. 기준은 화면 실측기(check-hangul-live.mjs)와
       * 같은 0.3px 입니다 - 두 검사가 다른 자를 쓰면 한쪽이 잡은 것을 다른 쪽이
       * 안 잡고, 그때 사람은 어느 쪽을 믿을지 모르게 됩니다.
       *
       * em 은 그대로 통과시킵니다. 정본에서 em 으로 적힌 자리는 0.1em 이상이고
       * 그 자리 글자가 10~11px 이라 언제나 1px 을 넘습니다.
       */
      const 자간글 = ls?.[1].trim() ?? '';
      const 보이는자간 = 자간글.endsWith('em')
        ? parseFloat(자간글) >= 0.05
        : parseFloat(자간글) >= 0.3;
      const 대문자 = /text-transform:\s*uppercase/.test(body);
      if (!보이는자간 && !대문자) continue;
      /*
       * 🔴 «푸는» 규칙을 «거는» 규칙으로 세면 안 됩니다. 정본에는 두 방향이 있습니다.
       *
       *   data-hangul   기본이 라틴이고, 이 표시가 붙은 것만 푼다 (차림표 · 지표)
       *   --hangul      기본이 한글이고, [data-latin] 이 붙은 것만 다시 건다 (표)
       *
       * 뒤쪽 규칙은 선택자에 [data-latin] 을 달고 있습니다. 그것을 «자간을 거는
       * 자리» 로 읽으면 한글 표 머리글 전부가 위반으로 잡힙니다 - 처음에 실제로
       * 142곳이 거짓으로 잡혔습니다.
       */
      if (sel.includes('data-hangul') || sel.includes('data-latin')) continue;
      for (const c of sel.matchAll(/\.(qd-[a-z0-9-]+)/g)) {
        if (c[1].endsWith('--hangul')) continue;
        모음.add(c[1]);
      }
    }
  }
  return [...모음].sort();
}

/* ── 2. 소스를 훑는다 ────────────────────────────────────────────────────────── */
const 볼확장자 = new Set(['.tsx', '.jsx']);
const 건너뛸디렉터리 = new Set(['node_modules', '.next', '.git', 'dist', 'build', 'coverage', 'public']);

function* 파일들(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') && e.name !== '.') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (건너뛸디렉터리.has(e.name)) continue;
      yield* 파일들(p);
    } else if (볼확장자.has(extname(e.name))) {
      yield p;
    }
  }
}

const 한글 = /[가-힣]/;

/**
 * 한 파일에서, 정본 클래스가 붙은 요소 «안» 에 글자로 박힌 한글을 찾습니다.
 *
 * 여는 태그부터 400자를 창으로 봅니다. JSX 를 제대로 파싱하지 않는 대신
 * 놓치는 쪽으로 틀립니다 - 거짓 경보를 내면 사람이 검사를 안 믿게 됩니다.
 */
function 훑기(src, 클래스들) {
  const 걸린것 = [];
  const 본것 = new Set();
  /* className 한 자리를 한 번만 봅니다. 클래스별로 돌면 같은 요소가 여러 번 잡힙니다 */
  for (const m of src.matchAll(/className=(?:"([^"]*)"|\{([^}]*)\})/g)) {
    const 클래스글 = m[1] ?? m[2] ?? '';
    const 걸린클래스 = 클래스들.filter((c) => new RegExp(`\\b${c}\\b`).test(클래스글));
    if (!걸린클래스.length) continue;
    /* 같은 자리에 «한글 변종» 이 함께 붙어 있으면 그 자리는 이미 풀려 있습니다 */
    if (걸린클래스.some((c) => 클래스글.includes(`${c}--hangul`))) continue;

    const 창시작 = m.index;
    const 창 = src.slice(창시작, 창시작 + 400);
    /* 창 안의 JSX 글자 마디. `>...<` 사이에 중괄호가 없는 것만 = 글자로 박힌 것 */
    for (const t of 창.matchAll(/>([^<>{}]*)</g)) {
      const 글 = t[1].trim();
      if (!글 || !한글.test(글)) continue;
      /* 이 글자를 담은 여는 태그를 뒤로 훑어 찾습니다 */
      const 앞 = 창.slice(0, t.index + 1);
      const 여는태그 = 앞.slice(앞.lastIndexOf('<'));
      if (/data-hangul|data-latin/.test(여는태그)) continue;
      /* 창의 첫 요소(정본 클래스가 붙은 그 요소) 자신이 풀려 있으면 통과 */
      if (/data-hangul/.test(창.slice(0, 창.indexOf('>') + 1))) continue;
      const 절대위치 = 창시작 + t.index;
      const 줄 = src.slice(0, 절대위치).split('\n').length;
      const 열쇠 = `${줄}|${글}`;
      if (본것.has(열쇠)) continue;
      본것.add(열쇠);
      걸린것.push({ cls: 걸린클래스[0], 줄, 글: 글.slice(0, 24), 태그: (/<([A-Za-z][\w.]*)/.exec(여는태그) || [, '?'])[1] });
    }
  }
  return 걸린것;
}

const 클래스들 = 라틴자간클래스();
console.log('');
console.log(`  정본이 라틴 자간·대문자를 거는 자리 ${클래스들.length}개`);
console.log(`  ${클래스들.join(' · ')}`);
console.log('');

let 합계 = 0;
for (const [이름, cfg] of Object.entries(저장소)) {
  const base = join(cfg.root, cfg.src);
  let 파일수 = 0;
  const 걸린것 = [];
  for (const p of 파일들(base)) {
    파일수++;
    const src = readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
    if (!한글.test(src)) continue;
    for (const h of 훑기(src, 클래스들)) 걸린것.push({ ...h, 파일: relative(cfg.root, p).replace(/\\/g, '/') });
  }
  합계 += 걸린것.length;
  console.log(`  ${이름.padEnd(9)} 파일 ${String(파일수).padStart(3)}개 · 걸린 곳 ${걸린것.length}`);
  for (const h of 걸린것) {
    console.log(`      ${h.파일}:${h.줄}  .${h.cls} 안 <${h.태그}> 「${h.글}」`);
  }
}

console.log('');
if (합계) {
  console.log(`  ${합계}곳. 그 요소에 data-hangul 을 붙이십시오 - 정본이 그것을 보고 자간을 풉니다.`);
  console.log(`  라틴이 맞다면 data-latin 을 붙여 «일부러 그렇다» 고 적어 두십시오.`);
  process.exitCode = 1;
} else {
  console.log('  글자로 박힌 한글이 라틴 자간 자리에 들어간 곳은 없습니다.');
  console.log('  변수로 들어오는 값은 tools/check-hangul-live.mjs 가 화면에서 봅니다.');
}
