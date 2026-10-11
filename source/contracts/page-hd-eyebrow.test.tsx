import { describe, it, expect } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PageHd } from './components';
import { QDText } from './q-design-labels';
import { REPO_ROOT, readSource } from '@/lib/test-utils/contract-source';

// =============================================================================
// 화면 머리의 제목 위 이름표는 «뜻 있을 때만» (오너 결정 2번 · 화면 검토 A35 · A66 · 2026-09-27)
// =============================================================================
// 186곳 가운데 29곳이 제목을 그대로 되풀이했고(「계정 관리 / 계정 관리」), 47곳은 설명 문장을
// 고정폭 · 넓은 자간 이름표 자리에 두고 있었다(한글이 벌어져 읽기 어렵다 · A44).
// 이름표에는 조항 · 번호 · 날짜 · 판 · 상위 기록 · 상태만 남기고, 설명 · 건수 · 조직 이름은
// 제목 아래 설명 줄(desc)로 옮겼다. 이 계약이 되돌아가는 것을 막는다.
//
// (JSX 대신 createElement 를 쓴다. 까닭은 inline-strong.test.tsx 머리 주석과 같다.)

const ROOT = REPO_ROOT;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.tsx') && !name.endsWith('.test.tsx')) out.push(p);
  }
  return out;
}

/** 여는 태그의 끝(`/>` 또는 `>`). 중괄호 · 따옴표 · 템플릿 문자열 안의 `>` 는 건너뛴다. */
function tagEnd(src: string, from: number): number {
  let depth = 0;
  let quote: string | null = null;
  const tmpl: number[] = [];
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (quote === '`' && c === '$' && src[i + 1] === '{') { tmpl.push(depth); depth++; quote = null; i++; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (tmpl.length && tmpl[tmpl.length - 1] === depth) { tmpl.pop(); quote = '`'; }
    } else if (depth === 0 && c === '>') return i + 1;
  }
  return -1;
}

/** 글자 그대로 적힌 속성 값(`title="…"`)만 읽는다. 식(`{…}`)은 null. */
function literal(tag: string, name: string): string | null {
  const m = new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(tag);
  return m ? m[1] : null;
}

const squash = (s: string) => s.replace(/\s+/g, '');

type Head = { at: string; title: string | null; sub: string | null };
const HEADS: Head[] = [];
for (const file of ['app', 'components'].flatMap((d) => walk(join(ROOT, d)))) {
  const rel = relative(ROOT, file).split('\\').join('/');
  // 주석을 걷고 본다(주석 속 예시 태그를 세지 않게). 줄 번호는 주석을 걷으면 어긋나므로 보고는 파일 · 제목 · 이름표로 한다.
  const src = readSource(rel, 'code');
  for (const m of src.matchAll(/<(PageHd|ModuleLockedNotice|MarketLockedNotice)\b/g)) {
    const end = tagEnd(src, m.index! + m[0].length);
    if (end < 0) continue;
    const tag = src.slice(m.index!, end);
    HEADS.push({ at: rel, title: literal(tag, 'title'), sub: literal(tag, 'sub') });
  }
}

describe('화면 머리 이름표 (사용처)', () => {
  it('검사 대상을 실제로 찾았다', () => {
    // 부르는 곳이 180곳 남짓이다. 0 이면 찾는 방식이 깨진 것이지 «위반 없음» 이 아니다.
    expect(HEADS.length).toBeGreaterThan(150);
  });

  it('이름표가 제목과 같은 말이 아니다(공백 무시)', () => {
    const bad = HEADS.filter((x) => x.title !== null && x.sub !== null && squash(x.sub) === squash(x.title));
    expect(bad.map((x) => `${x.at}  ${x.title} / ${x.sub}`)).toEqual([]);
  });

  it('이름표가 «제목: 조항» 처럼 제목을 앞에 되풀이하지 않는다', () => {
    const bad = HEADS.filter(
      (x) => x.title !== null && x.sub !== null && squash(x.sub).startsWith(`${squash(x.title)}:`),
    );
    expect(bad.map((x) => `${x.at}  ${x.title} / ${x.sub}`)).toEqual([]);
  });

  it('이름표 자리를 «-» 로 채우지 않는다', () => {
    const bad = HEADS.filter((x) => x.sub !== null && /^[\s\-·.]*$/.test(x.sub));
    expect(bad.map((x) => `${x.at}  «${x.sub}»`)).toEqual([]);
  });
});

describe('PageHd 부품', () => {
  const render = (props: Record<string, unknown>) => renderToStaticMarkup(h(PageHd, props as never));

  it('제목과 같은 이름표는 그리지 않는다(부품 안전망 · 공백 무시)', () => {
    const html = render({ title: '계정 관리', sub: '계정  관리' });
    expect(html.match(/계정\s*관리/g)?.length).toBe(1);
  });

  it('뜻 있는 이름표는 그린다', () => {
    const html = render({ title: '부적합', sub: 'ISO 13485 §8.3' });
    expect(html).toContain('ISO 13485 §8.3');
  });

  it('설명 줄은 제목 아래, 본문 글꼴로 그린다(고정폭 · 대문자 · 넓은 자간 없음)', () => {
    const html = render({ title: '새 부적합 등록', desc: '발생 원천 + 심각도 + 발견 내용' });
    const h1At = html.indexOf('</h1>');
    const pAt = html.indexOf('<p ');
    expect(h1At).toBeGreaterThan(0);
    expect(pAt).toBeGreaterThan(h1At);
    const p = html.slice(pAt, html.indexOf('</p>', pAt));
    expect(p).toContain('발생 원천 + 심각도 + 발견 내용');
    expect(p).not.toMatch(/JetBrains Mono|text-transform:uppercase|letter-spacing/);
  });

  it('설명 줄이 없으면 <p> 를 그리지 않는다', () => {
    expect(render({ title: '부적합' })).not.toContain('<p ');
  });
});

describe('PageHd 소스가 Q-Design 추출기의 표지를 지킨다', () => {
  // Q-Design tools/extract-screen.mjs 가 이 부품 소스를 글자로 잘라 머리 규격(막대 · 이름표 · 제목 · 하단선)을
  // 뽑는다. 표지를 못 찾거나 한 구역에서 탐침이 두 번 맞으면 정본 생성이 멈춘다. 여기서 먼저 잡는다.
  const raw = readSource('lib/design/components.tsx', 'raw'); // 추출기는 주석까지 든 원문을 자른다. 같은 원문이라야 표지가 주석에 걸리는 것도 잡는다
  const comp = raw.replace(/\r\n/g, '\n');
  const a = comp.indexOf('export function PageHd({');
  const b = comp.indexOf('// ─── CARD', a);
  const hd = comp.slice(a, b);
  const between = (from: string, to: string) => {
    const i = hd.indexOf(from);
    const j = hd.indexOf(to, i + from.length);
    return i < 0 || j < 0 ? '' : hd.slice(i, j);
  };

  it('구역 표지가 순서대로 있다', () => {
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
    const marks = ['return (', '<style', '{accent && (', '{sub && (', '<h1', '</h1>', '<div style={{ marginTop:'];
    const at = marks.map((m) => hd.indexOf(m));
    expect(at.every((x) => x >= 0), marks.filter((_, i) => at[i] < 0).join(', ')).toBe(true);
    expect([...at].sort((x, y) => x - y)).toEqual(at);
  });

  it('이름표 구역에 자간 탐침이 한 번, 하단선 표지가 부품 안에 한 번', () => {
    const eyebrow = between('{sub && (', '<h1').replace(/QDText\.tracking\.(\w+)/g, (_, key: string) => {
      if (!Object.hasOwn(QDText.tracking, key)) throw new Error(`Unknown canonical tracking: ${key}`);
      const value = QDText.tracking[key as keyof typeof QDText.tracking];
      if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Expected numeric tracking: ${key}`);
      return String(value);
    });
    expect(eyebrow.match(/letterSpacing: labelTracking\(sub, [\d.]+\),/g)?.length).toBe(1);
    expect(hd.split('<div style={{ marginTop:').length - 1).toBe(1);
  });
});
