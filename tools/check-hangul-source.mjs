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
import { createRequire } from 'node:module';
import { join, relative, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { customProperties, trackingOf } from './hangul-tracking.mjs';

const ts = createRequire(import.meta.url)('typescript');

const DIST = 'D:/Claude/Q-Design/dist';
const 변수정의 = customProperties([
  ...readdirSync(DIST).filter((f) => f.endsWith('.css')).map((f) => join(DIST, f)),
  ...readdirSync(join(DIST, '..', 'patterns')).filter((f) => f.endsWith('.css')).map((f) => join(DIST, '..', 'patterns', f)),
]);
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
      /* 2026-10-16: var() 로 오는 자간도 변수 정의를 따라가 풉니다. 예전에는 parseFloat 가 NaN 이라 지나쳤습니다 */
      const 자간글 = ls?.[1].trim() ?? '';
      const 보이는자간 = 자간글 ? trackingOf(자간글, 변수정의).visible : false;
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

/** 여는 태그(JsxOpeningElement · JsxSelfClosingElement)의 속성 하나. 없으면 null, 값 없는 속성은 '' */
function 속성(여는태그, 이름) {
  for (const a of 여는태그.attributes.properties) {
    if (!ts.isJsxAttribute(a) || a.name.getText() !== 이름) continue;
    const v = a.initializer;
    if (!v) return '';
    if (ts.isStringLiteral(v)) return v.text;
    return ts.isJsxExpression(v) && v.expression ? v.expression.getText() : '';
  }
  return null;
}
const 풀림표시 = (여는태그) => 속성(여는태그, 'data-hangul') !== null || 속성(여는태그, 'data-latin') !== null;

/**
 * 한 파일에서, 정본 클래스가 붙은 요소 «안» 에 글자로 박힌 한글을 찾습니다.
 *
 * 2026-10-22: JSX 를 파싱해 그 요소가 닫히는 곳까지만 봅니다. 예전에는 여는 태그부터 400자를 창으로 봐서,
 * 요소가 닫힌 뒤의 형제 글자까지 «안» 으로 잡았습니다. 그날 걸린 8곳(쪽 넘김 「다음」 · Q-Sonar 이름표 옆 제목)이
 * 전부 그 거짓 빨강이었습니다. 정본은 그 요소 자신에 자간을 걸고(풀 때도 `.qd-label[data-hangul]`),
 * 자간은 자식에게만 물려 내려갑니다.
 */
export function 훑기(src, 클래스들) {
  const 걸린것 = [];
  const 본것 = new Set();
  const sf = ts.createSourceFile('scan.tsx', src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const 여는태그를 = (n) => (ts.isJsxElement(n) ? n.openingElement : ts.isJsxSelfClosingElement(n) ? n : null);

  /* 클래스 요소 안의 글자 마디를 모읍니다. 글을 담은 태그에 풀림 표시가 있으면 그 글은 통과(예전과 같음) */
  const 안의글 = (n, 담은태그, cls) => {
    if (ts.isJsxText(n)) {
      const 글 = n.text.trim();
      if (!글 || !한글.test(글) || 풀림표시(담은태그)) return;
      const 시작 = n.getStart(sf) + n.getText(sf).indexOf(글);
      if (본것.has(시작)) return;
      본것.add(시작);
      const 줄 = sf.getLineAndCharacterOfPosition(시작).line + 1;
      걸린것.push({ cls, 줄, 글: 글.slice(0, 24), 태그: 담은태그.tagName.getText(sf) });
      return;
    }
    const 여는 = 여는태그를(n);
    ts.forEachChild(n, (c) => 안의글(c, 여는 ?? 담은태그, cls));
  };

  const 찾기 = (n) => {
    const 여는 = 여는태그를(n);
    const 클래스글 = 여는 ? 속성(여는, 'className') : null;
    if (클래스글) {
      /*
       * 🔴 경계를 `\b` 로 잡으면 안 됩니다. 하이픈이 낱말 경계라 `qd-table` 이
       *    `qd-table-scroll`(표를 감싼 스크롤 상자)에도 맞고, 그 상자 안의
       *    머리글을 전부 잡습니다. Q-Forge 에서 178곳이 그렇게 거짓으로 잡혔습니다
       *    (2026-09-24 · 표에는 --hangul 이 붙어 있었고 화면 실측 자간도 0).
       */
      const 걸린클래스 = 클래스들.filter((c) => new RegExp(`(?<![\\w-])${c}(?![\\w-])`).test(클래스글));
      /* 같은 자리에 «한글 변종» 이 함께 붙어 있거나, 그 요소 자신이 풀려 있으면 그 자리는 이미 풀려 있습니다 */
      if (걸린클래스.length && !걸린클래스.some((c) => 클래스글.includes(`${c}--hangul`)) && !풀림표시(여는) && ts.isJsxElement(n)) {
        for (const c of n.children) 안의글(c, 여는, 걸린클래스[0]);
      }
    }
    ts.forEachChild(n, 찾기);
  };
  찾기(sf);
  return 걸린것.sort((a, b) => a.줄 - b.줄);
}

/* ── 3. 감사로 부를 때만 제품을 훑습니다. 시험은 훑기만 불러 씁니다 ─────────────── */
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
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
}
