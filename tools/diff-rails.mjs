// =============================================================================
// 세 제품의 차림표가 «정말» 같은가
// =============================================================================
//   node tools/diff-rails.mjs
//
// shoot-rails.mjs 가 사진을 찍는다면 이쪽은 **자를 댑니다.** 세 제품을 띄워
// 차림표의 계산된 값을 뽑아 나란히 놓고, 다른 자리만 짚어 냅니다.
//
// ── 왜 사진만으로는 부족한가 ─────────────────────────────────────────────────
// 사진은 «비슷해 보인다» 까지만 말합니다. 1px 차이나 자간 0.1px 는 나란히 놓아도
// 눈에 안 들어오는데, 그런 것이 쌓이면 「뭔가 다르다」가 됩니다. 반대로 사진이
// 필요 없는 것도 아닙니다 - 값은 같은데 그림이 다른 것을 이미 세 번 잡았습니다
// (로그아웃 모서리 · 판 번호 대문자 · 잘린 로그아웃). 둘 다 봐야 합니다.
//
// ── 미리 띄워 둘 것 ─────────────────────────────────────────────────────────
//   Q-Atelier  3400 (dev)
//   Q-Sonar    3405 (Lead-Radar/scripts/preview-as.mjs)
//   Q-Forge    3408 (DHR/scripts/preview-as.mjs 000000 3404 3408)
// =============================================================================

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

const THEME = process.env.THEME === 'light' ? 'light' : 'dark';

/*
 * 무엇을 잴 것인가.
 *
 * 「차림표가 같다」는 이 값들이 같다는 뜻입니다. 하나라도 다르면 나란히 놓았을
 * 때 다른 부품으로 읽힙니다.
 */
const PROBES = [
  ['레일',        '.qd-rail', ['width', 'padding', 'backgroundColor', 'borderRightWidth', 'borderRightColor', 'position']],
  ['로고 자리',   '.qd-rail-mark', ['width']],
  ['조직명',      '.qd-rail-org', ['fontSize', 'fontFamily', 'letterSpacing', 'textTransform', 'color']],
  ['묶음 이름표', '.qd-nav-group', ['padding', 'fontSize', 'fontFamily', 'letterSpacing', 'textTransform', 'color']],
  ['항목(쉼)',    '.qd-nav-item:not(.is-active)', ['padding', 'fontSize', 'fontWeight', 'letterSpacing', 'color', 'borderLeftWidth', 'borderRadius', 'columnGap']],
  ['항목(활성)',  '.qd-nav-item.is-active', ['padding', 'fontSize', 'fontWeight', 'color', 'backgroundColor', 'borderLeftWidth', 'borderLeftColor', 'borderRadius']],
  ['아이콘 자리', '.qd-nav-item.is-active .qd-nav-icon', ['width', 'height', 'color']],
  ['아이콘 글리프', '.qd-nav-item.is-active .qd-nav-icon > svg', ['width', 'height', 'strokeWidth']],
  // 2026-09-27 «문서 결»: 금점 대신 글자 밑 짧은 금색 선. 정본은 이름표의 ::after, 원본은 별도 요소입니다.
  ['선택 밑줄',   '.qd-nav-item.is-active .qd-nav-label', ['width', 'height', 'backgroundColor', 'borderRadius'], '::after'],
  ['판 번호 줄',  '.qd-rail-version', ['padding', 'fontSize', 'fontFamily', 'letterSpacing', 'color']],
  ['판 번호 값',  '.qd-rail-version b', ['color', 'textTransform']],
  ['바닥 경계',   '.qd-rail-foot', ['paddingTop', 'borderTopWidth', 'borderTopColor']],
  ['아바타',      '.qd-avatar', ['width', 'height', 'borderRadius', 'fontSize', 'fontWeight', 'color']],
  ['이름',        '.qd-rail-user-name', ['fontSize', 'fontWeight', 'color']],
  ['역할 줄',     '.qd-rail-user-meta', ['fontSize', 'fontFamily', 'letterSpacing', 'textTransform', 'color']],
  ['로그아웃',    '.qd-rail-logout', ['minHeight', 'padding', 'fontSize', 'fontWeight', 'borderRadius', 'borderWidth', 'borderColor', 'color', 'backgroundColor']],
];

/*
 * 🔴 Q-Atelier 는 정본 클래스를 안 씁니다.
 *
 * 정본은 Q-Atelier 에서 «뽑아낸» 것입니다. 그러니 원본에는 .qd-* 가 없고 같은
 * 값을 인라인 스타일로 들고 있습니다. 위 선택자만 쓰면 Q-Atelier 는 16개 부품이
 * 전부 «없음» 으로 나오고, 남은 두 제품끼리만 견주게 됩니다.
 *
 * 실제로 그렇게 돌고 있었습니다. 「같음 77 · 어긋남 0」 이라고 찍히는 동안
 * Q-Atelier 는 한 자리도 재고 있지 않았습니다. 기준이 되는 제품을 빼놓고
 * 「셋이 같다」 고 말한 셈입니다.
 *
 * 그래서 제품별 선택자 사전을 둡니다. 자리 이름은 같고 «어디서 찾는가» 만
 * 다릅니다.
 */
const 제품별선택자 = {
  'Q-Atelier': {
    '레일':          'aside.qa-sidebar-aside',
    '로고 자리':     'aside.qa-sidebar-aside > a img',
    '조직명':        'aside.qa-sidebar-aside > a > div',
    '묶음 이름표':   'aside.qa-sidebar-aside nav > div > button',
    '항목(쉼)':      'aside.qa-sidebar-aside nav a.qa-nav-item:not(.active)',
    '항목(활성)':    'aside.qa-sidebar-aside nav a.qa-nav-item.active',
    '아이콘 자리':   'aside.qa-sidebar-aside nav a.qa-nav-item.active > span:first-child',
    '아이콘 글리프': 'aside.qa-sidebar-aside nav a.qa-nav-item.active > span:first-child > svg',
    '선택 밑줄':     { sel: 'aside.qa-sidebar-aside .qa-nav-active-underline', pseudo: null },
    /* 판 번호가 두 줄입니다(엔진 · 제품). 정본이 뽑아 간 것은 아래 줄입니다 -
       padding 4px 4px 8px 이 그 줄의 값입니다. */
    '판 번호 줄':    'aside.qa-sidebar-aside > div:nth-of-type(1) > div:last-child',
    '판 번호 값':    'aside.qa-sidebar-aside > div:nth-of-type(1) > div:last-child > span:last-child',
    '바닥 경계':     'aside.qa-sidebar-aside > div:nth-of-type(3)',
    '아바타':        'aside.qa-sidebar-aside .qa-avatar',
    '이름':          'aside.qa-sidebar-aside > div:nth-of-type(3) p:nth-of-type(1)',
    '역할 줄':       'aside.qa-sidebar-aside > div:nth-of-type(3) p:nth-of-type(2)',
    '로그아웃':      'aside.qa-sidebar-aside .qa-btn-secondary',
  },
};

const env = Object.fromEntries(
  readFileSync('D:/Claude/Q-Atelier/.env.local', 'utf8').split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }),
);

const browser = await chromium.launch();

async function measure(name, url, prepare) {
  /* 이 제품에서 이 부품을 어디서 찾는지. 사전에 없으면 정본 선택자를 씁니다 */
  const 사전 = 제품별선택자[name] || {};
  /* 사전 값은 선택자 글이거나 { sel, pseudo } 입니다(정본의 선택 밑줄은 ::after, 원본은 별도 요소) */
  const probes = PROBES.map(([label, sel, props, pseudo]) => {
    const own = 사전[label];
    if (own && typeof own === 'object') return [label, own.sel, props, own.pseudo ?? null];
    return [label, own || sel, props, pseudo ?? null];
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'ko-KR', timezoneId: 'Asia/Seoul',
    reducedMotion: 'reduce', colorScheme: THEME,
  });
  if (prepare) await prepare(ctx);
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(1200);
  const out = await page.evaluate((probes) => {
    const canvas = document.createElement('canvas').getContext('2d');
    const r = {};
    for (const [label, sel, props, pseudo] of probes) {
      const el = document.querySelector(sel);
      if (!el) { r[label] = null; continue; }
      const cs = getComputedStyle(el, pseudo);
      /* 가상 요소는 content 가 none 이면 그려지지 않습니다. 없는 것으로 셉니다 */
      if (pseudo && (cs.content === 'none' || cs.content === 'normal')) { r[label] = null; continue; }
      const v = Object.fromEntries(props.map((p) => [p, cs[p]]));
      /*
       * 🔑 글꼴은 «사슬» 이 아니라 «실제로 그려지는 얼굴» 을 견줍니다.
       *
       * 사슬 뒤쪽은 앞의 것이 있으면 쓰이지도 않습니다. 그걸 견주면 «같은
       * 글꼴로 그려지는데 다르다» 고 말하게 됩니다. 첫 이름과, 같은 글자를
       * 같은 크기로 그렸을 때의 폭을 봅니다 - 폭이 같고 첫 이름이 같으면
       * 같은 얼굴입니다.
       */
      if (props.includes('fontFamily')) {
        canvas.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        v.fontFamily = cs.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '');
        v['글꼴 폭'] = `${Math.round(canvas.measureText('MEDQRAFT v1.0.0 0123').width * 100) / 100}px`;
      }
      /* 이 글이 한글인가. 자간·대문자는 «내용을 보고» 정해지므로 판단에 필요합니다 */
      v._한글 = /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(el.textContent || '');
      v._글 = (el.textContent || '').trim().slice(0, 18);
      r[label] = v;
    }
    return r;
  }, probes);
  await ctx.close();
  return out;
}

/* Q-Atelier 는 매직링크 콜백으로 들어갑니다 */
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: link, error } = await sb.auth.admin.generateLink({ type: 'magiclink', email: 'ra@demo.com' });
if (error) throw error;

const got = {};
got['Q-Atelier'] = await measure(
  'Q-Atelier',
  `http://localhost:3400/auth/callback?token_hash=${link.properties.hashed_token}&type=magiclink&next=/ra`,
  async (ctx) => {
    await ctx.addInitScript((theme) => {
      const orig = Storage.prototype.getItem;
      Storage.prototype.getItem = function (k) {
        if (typeof k === 'string' && k.startsWith('qa-coachmark-')) return 'done';
        if (k === 'qa-theme') return theme;
        if (k === 'qa-novice-mode') return 'off';
        return orig.call(this, k);
      };
    }, THEME);
  },
);
got['Q-Sonar'] = await measure('Q-Sonar', 'http://localhost:3405/leads');
got['Q-Forge'] = await measure('Q-Forge', 'http://localhost:3408/production', async (ctx) => {
  await ctx.addInitScript((theme) => {
    const orig = Storage.prototype.getItem;
    Storage.prototype.getItem = function (k) { return k === 'dhr-theme' ? theme : orig.call(this, k); };
    document.documentElement.dataset.theme = theme;
  }, THEME);
});

await browser.close();

// ── 견주기 ───────────────────────────────────────────────────────────────────
const names = Object.keys(got);
const same = [];
const diff = [];
const byRule = [];   // 규칙대로 다른 것 (한글이라 자간을 푼 자리)
const missing = [];

/*
 * 자간과 대문자는 «내용을 보고» 정해집니다 (labelTracking · data-hangul).
 * 한쪽이 한글이고 다른 쪽이 라틴이면 값이 다른 것이 **맞습니다** ·
 * 그걸 「다르다」고 세면 고칠 것이 없는데 빨간 줄이 남습니다.
 */
const CONTENT_DRIVEN = new Set(['letterSpacing', 'textTransform']);

for (const [label, sel, props] of PROBES) {
  const present = names.filter((n) => got[n][label]);
  if (present.length < names.length) {
    missing.push([label, names.filter((n) => !got[n][label])]);
  }
  if (present.length < 2) continue;

  const allProps = props.includes('fontFamily') ? [...props, '글꼴 폭'] : props;
  for (const prop of allProps) {
    const vals = present.map((n) => [n, got[n][label][prop]]);
    const uniq = [...new Set(vals.map(([, v]) => v))];
    if (uniq.length === 1) { same.push(`${label}.${prop}`); continue; }

    const scripts = new Set(present.map((n) => got[n][label]._한글));
    if (CONTENT_DRIVEN.has(prop) && scripts.size > 1) {
      byRule.push({ label, prop, vals: present.map((n) => [n, `${got[n][label][prop]}   (${got[n][label]._한글 ? '한글' : '라틴'} · ${got[n][label]._글})`]) });
      continue;
    }
    diff.push({ label, prop, vals });
  }
}

console.log(`차림표 대조 · ${THEME} · 1440x900`);
console.log(`  ${names.join(' · ')}`);
console.log('');
console.log(`  같음        ${same.length}개`);
console.log(`  규칙대로 다름 ${byRule.length}개   (한글이라 자간·대문자를 푼 자리)`);
console.log(`  어긋남      ${diff.length}개`);
if (missing.length) {
  /*
   * 🔴 «못 쟀다» 는 «같다» 가 아닙니다.
   *
   * 예전에는 이것을 「없는 부품」 이라고 조용히 적어 두고 어긋남 0 을 초록으로
   * 찍었습니다. 그동안 Q-Atelier 는 16개 부품이 전부 안 잡히고 있었는데도
   * 「셋이 같다」 로 읽혔습니다. 못 잰 자리는 실패로 셉니다.
   */
  console.log(`  못 잼       ${missing.length}개   🔴 이 자리는 «같다» 고 말할 수 없습니다`);
}
if (missing.length) {
  console.log('');
  console.log('  못 잰 부품 (선택자가 안 맞거나 그 제품에 그 부품이 없습니다)');
  for (const [label, who] of missing) console.log(`    ${label.padEnd(14)} ${who.join(' · ')} 에서 못 찾음`);
}
if (byRule.length) {
  console.log('');
  console.log('  규칙대로 다른 자리 (고칠 것 없음)');
  for (const d of byRule) {
    console.log(`    ${(d.label + '.' + d.prop).padEnd(34)}`);
    for (const [n, v] of d.vals) console.log(`      ${n.padEnd(11)} ${v}`);
  }
}
if (diff.length) {
  console.log('');
  console.log('  어긋난 자리');
  for (const d of diff) {
    console.log(`    ${(d.label + '.' + d.prop).padEnd(34)}`);
    for (const [n, v] of d.vals) console.log(`      ${n.padEnd(11)} ${v}`);
  }
}
if (!diff.length && !missing.length) {
  console.log('');
  console.log('  세 제품의 차림표가 잰 자리에서 모두 같습니다.');
}
process.exit(diff.length || missing.length ? 1 : 0);
