import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { QDText } from '@/lib/design/q-design-labels';
import { REPO_ROOT } from '@/lib/test-utils/contract-source';

// =============================================================================
// 라벨 자간 계약: uppercase 라벨의 letterSpacing 은 labelTracking() 을 거칩니다 (2026-09-03 · M-02/M-03)
// =============================================================================
// 공용 컴포넌트의 mono 라벨은 «라틴 대문자» 를 전제로 자간 1~2.2px 을 손으로 적어 두었습니다.
// 한글은 반대입니다. 「오늘  처리할  것」처럼 낱글자로 흩어집니다. 2026-08-21 에 SectionTitle 하나만
// tokens 의 labelTracking(한글이면 0) 으로 바꿨는데, 같은 파일에 같은 꼴이 스물두 곳 더 있었습니다.
//
// 이 계약은 `lib/design/components.tsx` 를 줄 단위로 훑습니다. `textTransform` 이 'uppercase' 인
// 줄 앞뒤 15줄 안에서 `letterSpacing: <양수|'…em'>` 리터럴이 보이면 실패합니다. 기준은 0 입니다.
// (음수 자간은 제목 조이기라 대상이 아닙니다. 앞뒤 모두 보는 이유는 두 속성의 순서가 자리마다
// 다르기 때문입니다.)
//
// 고치는 법: letterSpacing: labelTracking(문구, 값) · textTransform: labelCase(문구).
// 글귀가 늘 한글이면 letterSpacing: LABEL.hangulTracking · textTransform: LABEL.hangulCase 로 둡니다.
//
// 🔑 이 1부는 한 파일의 리터럴만 봅니다. app/ · components/ 전체와 var(--…) 토큰은 아래 2부가 봅니다(2026-10-22).
//
// 🔴 2026-09-09 감사(주제 #7)에서 정정: 종전에 여기 적어 두었던
//    `hasHangul(문구) ? undefined : 'uppercase'` 는 **틀렸습니다.** textTransform 은
//    상속 속성이라 undefined 는 자기 값을 «안 적을» 뿐이고 부모의 uppercase 가
//    그대로 내려옵니다. 실측에서 자기 style 에 textTransform 이 없는 한글 span 이
//    화면에서 uppercase 로 잡혔습니다. 끊으려면 'none' 을 «적어야» 하고,
//    그것이 labelCase() 입니다.

const FILE = 'lib/design/components.tsx';
const WINDOW = 15;

const UPPERCASE_LINE = /textTransform:[^\n]*'uppercase'/;
/** 양수 숫자 또는 '0.12em' 같은 em 문자열입니다. labelTracking( 은 잡지 않습니다. */
const RAW_TRACKING = /letterSpacing:\s*(\d|'\d[^']*em'|"\d[^"]*em")/;

export function rawTrackingNearUppercase(src: string): string[] {
  const lines = src.split(/\r?\n/);
  const out: string[] = [];
  const seen = new Set<number>();
  lines.forEach((line, i) => {
    if (!UPPERCASE_LINE.test(line)) return;
    const from = Math.max(0, i - WINDOW);
    const to = Math.min(lines.length - 1, i + WINDOW);
    for (let j = from; j <= to; j++) {
      if (seen.has(j)) continue;
      if (RAW_TRACKING.test(lines[j])) {
        seen.add(j);
        out.push(`  ${FILE}:${j + 1}  ${lines[j].trim()}  (uppercase ${i + 1}행 근처)`);
      }
    }
  });
  return out;
}

describe('라벨 자간: uppercase 라벨은 labelTracking 을 거칩니다', () => {
  const src = readFileSync(FILE, 'utf8');

  it('uppercase 를 다루는 자리가 여전히 있습니다(계약이 헛돌지 않습니다)', () => {
    /*
     * 🔴 리터럴 'uppercase' 만 세면 안 됩니다. 2026-09-10 에 22곳이 labelCase() 로
     *    바뀌면서 리터럴이 0 이 되었고, **고친 것 때문에 이 검사가 실패했습니다.**
     *    이 검사가 확인하려는 것은 「대상 파일에 대문자 라벨이 아직 있는가」이지
     *    「그 글자가 그대로 적혀 있는가」가 아닙니다. 두 꼴을 함께 셉니다.
     */
    const 리터럴 = src.match(/'uppercase'/g)?.length ?? 0;
    const 함수 = src.match(/labelCase\(/g)?.length ?? 0;
    expect(리터럴 + 함수, `리터럴 ${리터럴} + labelCase ${함수}`).toBeGreaterThan(10);
  });

  it('uppercase 근처의 raw letterSpacing 리터럴이 0 입니다', () => {
    const hits = rawTrackingNearUppercase(src);
    expect(
      hits,
      `한글에 자간이 걸리는 라벨 ${hits.length}곳. letterSpacing: labelTracking(문구, 값) 으로 바꾸고 ` +
        `textTransform 은 labelCase(문구) 로 두십시오.\n` +
        hits.join('\n'),
    ).toHaveLength(0);
  });

  it('검출기 자체가 raw 리터럴을 잡습니다(가드가 빈 그물이 아닙니다)', () => {
    const sample = ["        letterSpacing: 1.5,", "        textTransform: 'uppercase',"].join('\n');
    expect(rawTrackingNearUppercase(sample)).toHaveLength(1);
    const fixed = [
      "        letterSpacing: labelTracking(children, 1.5),",
      "        textTransform: labelCase(children),",
    ].join('\n');
    expect(rawTrackingNearUppercase(fixed)).toHaveLength(0);
    // 음수 자간(제목 조이기)은 대상이 아닙니다.
    const tight = ["        letterSpacing: '-0.02em',", "        textTransform: 'uppercase',"].join('\n');
    expect(rawTrackingNearUppercase(tight)).toHaveLength(0);
  });
});

// =============================================================================
// 2부: 한글 글귀의 양수 자간을 app/ · components/ 전체에서 본다 (2026-10-22)
// =============================================================================
// 1부는 `lib/design/components.tsx` 한 파일의 «리터럴» 만 본다. 2026-10-22 큐 스위트 전체 점검에서 운영 화면에
// 한글 자간이 넷 남아 있었는데(f9f58bde 로 고침: /ra 카드 · 부작용 기한 알약 · 팀 활동 피드) 전부
// `letterSpacing: "var(--qd-atelier-letter-spacing-…)"` 꼴이라 1부를 그냥 지나갔다. 거짓 초록이었다.
//
// 2부는 `app/` · `components/` 의 .tsx 를 TypeScript 구문 트리로 훑는다.
//   ① 값: `style` 의 letterSpacing 을 px 로 푼다. var(--…) 는 app/q-design.foundation.css 에서 값을 읽고,
//      QDText.tracking.* 는 사본 모듈에서 읽는다. em 은 같은 style 의 fontSize(QDScale.font[N])로, 모르면 12px 로 친다.
//      0.3px 이하(재는 도구 design-sweep 의 기준과 같다)와 음수(제목 조이기)는 보지 않는다.
//      `labelTracking(…)` · `LABEL.hangulTracking` 을 거친 값은 통과한다.
//   ② 글자: 그 요소 안의 글을 본다. letter-spacing 은 상속되므로 자손까지 보되, 자기 letterSpacing 을 적은 자손은
//      따로 판정하므로 건너뛴다. 글귀가 어디서 오는지 끝까지 따라간다(같은 파일 또는 import 한 곳).
//        - 리터럴 · 템플릿 글 · 한글 값의 표 조회(`LABEL[k]`) · 한글을 돌려주는 함수 호출
//        - 함수가 돌려준 객체의 속성: `const d = resolveKind(k); … {d.label}` 은 resolveKind 가 돌려주는 객체들의 label
//        - 부품의 props: `({ label }) => <span style>{label}</span>` 은 그 부품을 부르는 곳(app · components · lib 의
//          .tsx 전부)에서 넘긴 값을 본다. `<Field label="선택" />` 처럼 한글을 넘기는 곳이 하나라도 있으면 «한글».
//          안 넘긴 곳은 undefined(글 없음)로, 펼쳐 넘긴 곳(`{...p}`)은 «모름» 으로 친다.
//        - 배열을 도는 콜백: `OPTIONS.map((o) => …{o.label})` 의 o 는 배열 원소, 두 번째 매개변수는 번호(숫자)다.
//          배열 풀기(`([label, v]) =>`) · `.map` 으로 만든 배열도 따라간다.
//        - 매개변수의 타입: number · boolean · 라틴 리터럴 합집합으로 적힌 것은 글이 없는 쪽(라틴 · 숫자)이다.
//        - 글 메서드: String() · toFixed() · join() · padStart() · replace() 등은 받은 글을 그대로 잇는 것으로 본다.
//      `codeOrTextFont(…)` 를 펼친 style(한글이면 자간을 0 으로 돌려줌)과 `createIcon(…)` 으로 만든 아이콘(글 없음)은 지나간다.
//   ③ 판정: 한글이면 실패(기준 0). 숫자 · 라틴만이면 통과. 끝까지 따라가도 정할 수 없는 자리(DB 에서 온 값 등)는
//      «모름» 으로 세어 파일별 기준선과 같은지 본다(migration-registry-contract 와 같은 수법).
//      요소에 이어지지 않는 스타일 객체(부품 props 로 넘기는 것 등)에 든 양수 자간도 «모름» 으로 센다.
//
// 한계: 부르는 곳이 없거나 값으로 넘겨지는 부품(`render={Row}` · `memo(Row)` 등)의 props 는 «모름» 이다.
// 소문자 태그를 닫는 꼴(`<input />`)은 글이 없는 것으로 본다. className 으로 거는 CSS 의 자간은 보지 않는다.

const HANGUL = /[가-힣]/;
/** 이보다 큰 자간만 본다. 재는 도구(.claude/design-sweep/measure.js)와 같은 기준이다. */
const LIMIT_PX = 0.3;
/** em 자간을 px 로 바꿀 때 글자 크기를 모르면 이 값으로 친다(화면 라벨의 가장 작은 크기). */
const FALLBACK_FONT_PX = 12;
const SCAN_DIRS = ['app', 'components'];
const FOUNDATION_CSS = 'app/q-design.foundation.css';

type Verdict = 'hangul' | 'none' | 'unknown';
const both = (a: Verdict, b: Verdict): Verdict =>
  a === 'hangul' || b === 'hangul' ? 'hangul' : a === 'unknown' || b === 'unknown' ? 'unknown' : 'none';
const all = (vs: Verdict[]): Verdict => vs.reduce(both, 'none');

export type TrackingSite = { file: string; line: number; verdict: 'hangul' | 'unknown'; px: number | null; why: string };

/** foundation.css 의 사용자 정의 속성. 같은 이름이 여러 번 정의되면(테마별) 전부 담는다. */
export function cssVars(css: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const m of css.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) {
    const list = out.get(m[1]) ?? [];
    list.push(m[2].trim());
    out.set(m[1], list);
  }
  return out;
}

/** CSS 길이 하나를 px 로. 모르면 null. var(--x, 폴백) 은 정의의 최댓값(없으면 폴백)이다. */
function lengthPx(raw: string, fontPx: number, vars: Map<string, string[]>, depth = 0): number | null {
  const s = raw.trim();
  const v = /^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/.exec(s);
  if (v) {
    const defs = vars.get(v[1]) ?? (v[2] ? [v[2]] : null);
    if (!defs || depth > 5) return null;
    let max = -Infinity;
    for (const d of defs) {
      const px = lengthPx(d, fontPx, vars, depth + 1);
      if (px === null) return null;
      max = Math.max(max, px);
    }
    return max;
  }
  if (s === '0' || s === 'normal') return 0;
  const m = /^(-?\d*\.?\d+)(px|em|rem)?$/.exec(s);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return m[2] === 'em' ? n * fontPx : m[2] === 'rem' ? n * 16 : n;
}

type Ctx = {
  file: string;
  sf: ts.SourceFile;
  decls: Map<string, ts.Node[]>;
  /** 맨 위의 interface · type. 매개변수 타입이 숫자 · 참거짓 · 문자열 리터럴인지 볼 때 쓴다. */
  types: Map<string, ts.InterfaceDeclaration | ts.TypeAliasDeclaration>;
  imports: Map<string, { from: string; name: string }>;
  resolve: (spec: string) => string | null;
};

/** 파일 하나를 읽어 이름 → 선언, import 이름 → 모듈 파일을 만든다. 같은 파일은 한 번만 읽는다. */
function makeCtxCache(read: (abs: string) => string | null) {
  const cache = new Map<string, Ctx | null>();
  const resolveModule = (from: string, spec: string): string | null => {
    const base = spec.startsWith('@/') ? join(REPO_ROOT, spec.slice(2)) : spec.startsWith('.') ? resolve(dirname(from), spec) : null;
    if (!base) return null;
    for (const c of [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]) {
      if (read(c) !== null) return c;
    }
    return null;
  };
  const get = (abs: string): Ctx | null => {
    if (cache.has(abs)) return cache.get(abs)!;
    const src = read(abs);
    if (src === null) {
      cache.set(abs, null);
      return null;
    }
    const sf = ts.createSourceFile(abs, src, ts.ScriptTarget.Latest, true, abs.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const decls = new Map<string, ts.Node[]>();
    const types = new Map<string, ts.InterfaceDeclaration | ts.TypeAliasDeclaration>();
    const imports = new Map<string, { from: string; name: string }>();
    const add = (name: string, n: ts.Node) => decls.set(name, [...(decls.get(name) ?? []), n]);
    const visit = (n: ts.Node) => {
      // 매개변수 · 구조 분해 이름도 담는다. 값은 모르지만, 같은 이름의 바깥 선언을 가린다는 것을 알아야 한다.
      if ((ts.isVariableDeclaration(n) || ts.isParameter(n) || ts.isBindingElement(n)) && ts.isIdentifier(n.name)) add(n.name.text, n);
      else if (ts.isFunctionDeclaration(n) && n.name) {
        add(n.name.text, n);
        if (n.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) add('default', n);
      } else if (ts.isExportAssignment(n) && !n.isExportEquals) add('default', n);
      else if ((ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n)) && ts.isSourceFile(n.parent)) types.set(n.name.text, n);
      else if (ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier)) {
        const from = resolveModule(abs, n.moduleSpecifier.text);
        const clause = n.importClause;
        if (from && clause?.name) imports.set(clause.name.text, { from, name: 'default' });
        const named = clause?.namedBindings;
        if (from && named && ts.isNamedImports(named)) {
          for (const el of named.elements) imports.set(el.name.text, { from, name: (el.propertyName ?? el.name).text });
        }
      } else if (ts.isExportDeclaration(n) && n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier) && n.exportClause && ts.isNamedExports(n.exportClause)) {
        // export { a } from './b' : 이 모듈의 a 는 b 의 a 다.
        const from = resolveModule(abs, n.moduleSpecifier.text);
        if (from) for (const el of n.exportClause.elements) imports.set(el.name.text, { from, name: (el.propertyName ?? el.name).text });
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
    const ctx = { file: abs, sf, decls, types, imports, resolve: (spec: string) => resolveModule(abs, spec) };
    cache.set(abs, ctx);
    return ctx;
  };
  return get;
}

type Getter = ReturnType<typeof makeCtxCache>;

const unwrap = (e: ts.Expression): ts.Expression => {
  let x = e;
  while (ts.isParenthesizedExpression(x) || ts.isAsExpression(x) || ts.isNonNullExpression(x) || ts.isSatisfiesExpression(x) || ts.isTypeAssertionExpression(x)) x = x.expression;
  return x;
};

/** 선언이 보이는 범위: 가장 가까운 블록 · 함수 · 파일. 매개변수는 그 함수, 구조 분해는 그 선언의 범위다. */
function scopeOf(decl: ts.Node): ts.Node {
  if (ts.isParameter(decl)) return decl.parent;
  let n: ts.Node = decl.parent;
  while (n && !(ts.isBlock(n) || ts.isSourceFile(n) || ts.isFunctionLike(n) || ts.isForStatement(n) || ts.isForOfStatement(n) || ts.isCaseBlock(n))) n = n.parent;
  if (ts.isBindingElement(decl) && ts.isFunctionLike(n)) return n; // 매개변수 구조 분해
  return n;
}

const depthOf = (n: ts.Node) => {
  let d = 0;
  for (let p = n.parent; p; p = p.parent) d++;
  return d;
};

const encloses = (outer: ts.Node, n: ts.Node) => {
  for (let p: ts.Node | undefined = n; p; p = p.parent) if (p === outer) return true;
  return false;
};

/**
 * 이름 하나가 가리키는 선언들. `at` 에서 보이는 것 중 가장 안쪽 범위의 것만 고른다(바깥의 같은 이름은 가려진다).
 * 매개변수 · 구조 분해면 값이 없으므로 그대로 돌려주고(부르는 쪽에서 따라감), 파일 안에 없으면 import 를 따라간다.
 * `export default X` 는 X 의 선언으로 바꾼다.
 */
function declsOf(get: Getter, ctx: Ctx, name: string, at: ts.Node | null, depth = 0): Array<{ ctx: Ctx; node: ts.Node }> {
  const local = (ctx.decls.get(name) ?? []).filter((d) => (at ? encloses(scopeOf(d), at) : ts.isSourceFile(scopeOf(d))));
  if (local.length) {
    const deepest = Math.max(...local.map((d) => depthOf(scopeOf(d))));
    return local
      .filter((d) => depthOf(scopeOf(d)) === deepest)
      .flatMap((node) => {
        if (!ts.isExportAssignment(node)) return [{ ctx, node }];
        const e = unwrap(node.expression);
        return ts.isIdentifier(e) && depth <= 2 ? declsOf(get, ctx, e.text, null, depth + 1) : [{ ctx, node }];
      });
  }
  const imp = ctx.imports.get(name);
  if (!imp || depth > 2) return [];
  const other = get(imp.from);
  return other ? declsOf(get, other, imp.name, null, depth + 1) : [];
}

/** `dynamic(() => import('…').then((m) => ({ default: m.X })))` 가 가리키는 모듈과 이름. 아니면 null. */
function dynamicTarget(ctx: Ctx, init: ts.Expression): { from: string; name: string } | null {
  const x = unwrap(init);
  if (!ts.isCallExpression(x) || !/^(React\.)?(dynamic|lazy)$/.test(x.expression.getText())) return null;
  let spec: string | null = null;
  let name = 'default';
  const visit = (n: ts.Node) => {
    if (ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword && n.arguments[0] && ts.isStringLiteral(n.arguments[0])) spec = n.arguments[0].text;
    if (ts.isArrowFunction(n) && n.parameters.length === 1 && ts.isIdentifier(n.parameters[0].name)) {
      const m = n.parameters[0].name.text;
      const find = (k: ts.Node): void => {
        if (ts.isPropertyAccessExpression(k) && ts.isIdentifier(k.expression) && k.expression.text === m) name = k.name.text;
        ts.forEachChild(k, find);
      };
      find(n.body);
    }
    ts.forEachChild(n, visit);
  };
  visit(x);
  const from = spec ? ctx.resolve(spec) : null;
  return from ? { from, name } : null;
}

/** JSX 태그 이름(또는 값으로 쓴 이름)이 가리키는 부품 선언. dynamic() 은 그 모듈의 부품으로 바꾼다. */
function componentDecl(get: Getter, ctx: Ctx, name: string, at: ts.Node): { ctx: Ctx; node: ts.Node } | null {
  const ds = declsOf(get, ctx, name, at);
  if (ds.length !== 1) return null;
  const { ctx: c, node } = ds[0];
  if (ts.isVariableDeclaration(node) && node.initializer) {
    const t = dynamicTarget(c, node.initializer);
    if (t) {
      const other = get(t.from);
      const r = other ? declsOf(get, other, t.name, null) : [];
      return r.length === 1 ? r[0] : null;
    }
  }
  return ds[0];
}

/** 함수 노드가 부품이면 그 선언(function X · const X = (…) => · memo · forwardRef 로 감싼 것). 부르는 쪽 색인의 열쇠다. */
function componentOf(fn: ts.Node): ts.Node | null {
  if (ts.isFunctionDeclaration(fn)) return fn;
  if (!ts.isArrowFunction(fn) && !ts.isFunctionExpression(fn)) return null;
  let p: ts.Node = fn.parent;
  while (ts.isParenthesizedExpression(p) || ts.isAsExpression(p) || ts.isSatisfiesExpression(p) || (ts.isCallExpression(p) && /^(React\.)?(memo|forwardRef)$/.test(p.expression.getText()))) p = p.parent;
  return ts.isVariableDeclaration(p) ? p : null;
}

/** 이름이 부품을 «값» 으로 쓰는 자리인가(태그 · import · 선언 · 타입이 아닌 곳). 값으로 넘겨진 부품은 부르는 곳을 다 알 수 없다. */
function isValueUse(n: ts.Identifier): boolean {
  const p = n.parent;
  if ((ts.isJsxOpeningElement(p) || ts.isJsxSelfClosingElement(p) || ts.isJsxClosingElement(p)) && p.tagName === n) return false;
  if (ts.isImportSpecifier(p) || ts.isImportClause(p) || ts.isExportSpecifier(p) || ts.isNamespaceImport(p) || ts.isExportAssignment(p) || ts.isQualifiedName(p)) return false;
  if (ts.isPropertyAccessExpression(p) && p.name === n) return false;
  if (ts.isBindingElement(p) && p.propertyName === n) return false;
  if ((p as { name?: ts.Node }).name === n && !ts.isShorthandPropertyAssignment(p)) return false; // 선언 · 속성 이름
  for (let a: ts.Node | undefined = p; a; a = a.parent) if (ts.isTypeNode(a) || ts.isHeritageClause(a)) return false;
  return true;
}

type CallSite = { ctx: Ctx; el: ts.JsxElement | ts.JsxSelfClosingElement };
type CallerIndex = { sites: Map<ts.Node, CallSite[]>; escaped: Set<ts.Node> };

/** 파일 묶음 전체에서 부품 → 그 부품을 그리는 JSX 자리. 부품을 값으로 쓴 자리는 escaped 에 담는다. */
function makeCallerIndex(get: Getter, files: string[]): CallerIndex {
  const sites = new Map<ts.Node, CallSite[]>();
  const escaped = new Set<ts.Node>();
  for (const f of files) {
    const ctx = get(f);
    if (!ctx) continue;
    const visit = (n: ts.Node) => {
      if ((ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) && ts.isIdentifier(n.tagName) && /^[A-Z]/.test(n.tagName.text)) {
        const d = componentDecl(get, ctx, n.tagName.text, n.tagName);
        if (d) sites.set(d.node, [...(sites.get(d.node) ?? []), { ctx, el: ts.isJsxOpeningElement(n) ? n.parent : n }]);
      } else if (ts.isIdentifier(n) && /^[A-Z][a-z]/.test(n.text) && isValueUse(n)) {
        const d = componentDecl(get, ctx, n.text, n);
        if (d) escaped.add(d.node);
      }
      ts.forEachChild(n, visit);
    };
    visit(ctx.sf);
  }
  return { sites, escaped };
}

/** 식이 가질 수 있는 값의 출처: 식 하나 · 부르는 쪽 JSX 의 자식 · 타입이나 «안 넘김» 으로 정해진 판정. */
type Src = { ctx: Ctx; expr: ts.Expression } | { ctx: Ctx; kids: ts.JsxElement } | { verdict: Verdict };
type Obj = { ctx: Ctx; obj: ts.ObjectLiteralExpression | ts.ArrayLiteralExpression };

/** 하나라도 못 풀면 null, 다 풀면 이어 붙인 것. */
const collect = <T>(parts: Array<T[] | null>): T[] | null => (parts.some((p) => p === null) ? null : (parts as T[][]).flat());

/** 배열을 도는 콜백. 첫 매개변수가 원소다. */
const ITERATORS = new Set(['map', 'flatMap', 'forEach', 'filter', 'find', 'findLast', 'findIndex', 'some', 'every']);
/** 받는 배열을 (걸러서) 그대로 돌려주는 메서드. */
const SAME_ARRAY = new Set(['filter', 'slice', 'sort', 'toSorted', 'reverse', 'toReversed']);
/** 받는 글자를 바꿔도 한글 여부는 받는 쪽을 따르는 메서드. */
const SAME_TEXT = new Set(['toUpperCase', 'toLowerCase', 'toLocaleUpperCase', 'toLocaleLowerCase', 'trim', 'trimStart', 'trimEnd', 'slice', 'substring', 'substr', 'at', 'charAt', 'normalize', 'toString', 'repeat']);
/** 숫자만 돌려주는 날짜 메서드. */
const DATE_NUMBER = /^(get(UTC)?(FullYear|Month|Date|Day|Hours|Minutes|Seconds|Milliseconds)|getTime|getTimezoneOffset|toISOString|valueOf)$/;

function makeAnalyzer(get: Getter, callers: () => CallerIndex) {
  const SEEN_LIMIT = 40;
  /** «모름» 이 된 식과 «한글» 의 근거 글귀(실패 메시지에 보여 준다). 자리마다 비운다. */
  const misses: string[] = [];
  const found: string[] = [];
  let cuts = 0; // 되돌이 · 깊이로 끊은 횟수. 끊긴 계산은 기억하지 않는다.
  const miss = (n: ts.Node): Verdict => {
    misses.push(n.getText().replace(/\s+/g, ' ').slice(0, 60));
    return 'unknown';
  };
  const hangulIn = (text: string): Verdict => {
    if (!HANGUL.test(text)) return 'none';
    found.push(text.trim().replace(/\s+/g, ' ').slice(0, 30));
    return 'hangul';
  };
  /** 노드 안의 첫 한글 리터럴(함수 몸 · 타입). 없으면 null. */
  const firstHangul = (n: ts.Node): string | null => {
    if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) && HANGUL.test(n.text)) return n.text;
    return ts.forEachChild(n, firstHangul) ?? null;
  };

  /** 배열 · 객체 리터럴의 값들. 펼침(...) · 메서드가 있으면 다 알 수 없으므로 null. */
  const valuesOf = (obj: ts.ObjectLiteralExpression | ts.ArrayLiteralExpression): ts.Expression[] | null => {
    if (ts.isArrayLiteralExpression(obj)) {
      if (obj.elements.some(ts.isSpreadElement)) return null;
      return obj.elements.filter((el): el is ts.Expression => !ts.isOmittedExpression(el));
    }
    const out: ts.Expression[] = [];
    for (const p of obj.properties) {
      if (ts.isPropertyAssignment(p)) out.push(p.initializer);
      else if (ts.isShorthandPropertyAssignment(p)) out.push(p.name);
      else return null;
    }
    return out;
  };

  /** 객체 리터럴에서 이름 하나의 값(뒤에 적은 것이 이긴다). 그보다 뒤에 펼침이 있으면 펼친 쪽에서 찾는다. */
  const propOf = (c: Ctx, obj: ts.ObjectLiteralExpression | ts.ArrayLiteralExpression, name: string, depth: number): Src[] | null => {
    if (ts.isArrayLiteralExpression(obj)) {
      const i = /^#(\d+)$/.exec(name);
      const el = i ? obj.elements[Number(i[1])] : undefined;
      if (!i || obj.elements.slice(0, Number(i[1]) + 1).some(ts.isSpreadElement)) return null;
      return el && !ts.isOmittedExpression(el) ? [{ ctx: c, expr: el }] : [{ verdict: 'none' }];
    }
    for (const p of [...obj.properties].reverse()) {
      if (ts.isPropertyAssignment(p) && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) && p.name.text === name) return [{ ctx: c, expr: p.initializer }];
      if (ts.isShorthandPropertyAssignment(p) && p.name.text === name) return [{ ctx: c, expr: p.name }];
      if (ts.isSpreadAssignment(p)) return propSources(c, p.expression, name, depth + 1);
    }
    return obj.properties.every((p) => ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) ? [{ verdict: 'none' }] : null; // 없는 속성은 undefined
  };

  /** 함수가 돌려주는 식들. 화살표의 식 몸은 그 식이다. 안쪽 함수의 return 은 세지 않는다. */
  const returnsOf = (fn: ts.Node | null): ts.Expression[] | null => {
    if (!fn || !(ts.isFunctionDeclaration(fn) || ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) || !fn.body) return null;
    if (!ts.isBlock(fn.body)) return [fn.body];
    const out: ts.Expression[] = [];
    const visit = (n: ts.Node) => {
      if (ts.isFunctionLike(n)) return;
      if (ts.isReturnStatement(n) && n.expression) out.push(n.expression);
      ts.forEachChild(n, visit);
    };
    ts.forEachChild(fn.body, visit);
    return out.length ? out : null;
  };

  /** 선언이 함수면 그 함수 노드(function X · const X = () =>). */
  const fnNode = (node: ts.Node): ts.Node | null => {
    if (ts.isFunctionDeclaration(node)) return node;
    if (ts.isVariableDeclaration(node) && node.initializer) {
      const init = unwrap(node.initializer);
      if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) return init;
    }
    return null;
  };

  const srcObjects = (s: Src, depth: number): Obj[] | null =>
    'expr' in s ? objectsOf(s.ctx, s.expr, depth) : 'kids' in s ? null : s.verdict === 'none' ? [] : null;

  /** 식이 돌려주는 객체 · 배열 리터럴들(변수 · 표 조회 · 속성 · 함수의 return · 콜백의 원소 · props 를 따라감). 못 풀면 null. */
  const objectsOf = (c: Ctx, e: ts.Expression, depth: number): Obj[] | null => {
    if (depth > SEEN_LIMIT) return null;
    const x = unwrap(e);
    if (ts.isObjectLiteralExpression(x) || ts.isArrayLiteralExpression(x)) return [{ ctx: c, obj: x }];
    if (x.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(x) && x.text === 'undefined')) return [];
    if (ts.isIdentifier(x)) {
      const s = sourcesOf(c, x, depth + 1);
      return s && collect(s.map((v) => srcObjects(v, depth + 1)));
    }
    if (ts.isPropertyAccessExpression(x)) {
      const s = propSources(c, x.expression, x.name.text, depth + 1);
      return s && collect(s.map((v) => srcObjects(v, depth + 1)));
    }
    if (ts.isElementAccessExpression(x)) {
      const base = objectsOf(c, x.expression, depth + 1);
      return (
        base &&
        collect(
          base.map(({ ctx: oc, obj }) => {
            const vs = valuesOf(obj);
            return vs && collect(vs.map((v) => objectsOf(oc, v, depth + 1)));
          }),
        )
      );
    }
    if (ts.isConditionalExpression(x)) return collect([objectsOf(c, x.whenTrue, depth + 1), objectsOf(c, x.whenFalse, depth + 1)]);
    if (ts.isBinaryExpression(x)) {
      const op = x.operatorToken.kind;
      if (op === ts.SyntaxKind.QuestionQuestionToken || op === ts.SyntaxKind.BarBarToken) return collect([objectsOf(c, x.left, depth + 1), objectsOf(c, x.right, depth + 1)]);
      if (op === ts.SyntaxKind.AmpersandAmpersandToken) return objectsOf(c, x.right, depth + 1);
      return null;
    }
    if (ts.isCallExpression(x)) return callObjects(c, x, depth + 1);
    return null;
  };

  /**
   * 배열 값의 원소 출처. 리터럴(펼침 포함) · map 콜백의 return · filter/slice/sort 가 받은 배열 · Object.values ·
   * 변수 · 속성 · props · 함수의 return 을 따라간다. 못 풀면 null.
   */
  const elementsOf = (c: Ctx, e: ts.Expression, depth: number): Src[] | null => {
    if (depth > SEEN_LIMIT) return null;
    const x = unwrap(e);
    const fromSrcs = (srcs: Src[] | null): Src[] | null =>
      srcs && collect(srcs.map((s) => ('expr' in s ? elementsOf(s.ctx, s.expr, depth + 1) : 'kids' in s ? null : s.verdict === 'none' ? [] : null)));
    if (ts.isArrayLiteralExpression(x)) {
      return collect(x.elements.map((el): Src[] | null => (ts.isSpreadElement(el) ? elementsOf(c, el.expression, depth + 1) : ts.isOmittedExpression(el) ? [] : [{ ctx: c, expr: el }])));
    }
    if (x.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(x) && x.text === 'undefined')) return [];
    if (ts.isIdentifier(x)) return fromSrcs(sourcesOf(c, x, depth + 1));
    if (ts.isPropertyAccessExpression(x)) return fromSrcs(propSources(c, x.expression, x.name.text, depth + 1));
    if (ts.isConditionalExpression(x)) return collect([elementsOf(c, x.whenTrue, depth + 1), elementsOf(c, x.whenFalse, depth + 1)]);
    if (ts.isBinaryExpression(x)) {
      const op = x.operatorToken.kind;
      if (op === ts.SyntaxKind.QuestionQuestionToken || op === ts.SyntaxKind.BarBarToken) return collect([elementsOf(c, x.left, depth + 1), elementsOf(c, x.right, depth + 1)]);
      if (op === ts.SyntaxKind.AmpersandAmpersandToken) return elementsOf(c, x.right, depth + 1);
      return null;
    }
    if (ts.isElementAccessExpression(x)) {
      const base = objectsOf(c, x.expression, depth + 1);
      return base && collect(base.map(({ ctx: oc, obj }) => { const vs = valuesOf(obj); return vs && collect(vs.map((v) => elementsOf(oc, v, depth + 1))); }));
    }
    if (!ts.isCallExpression(x)) return null;
    const callee = unwrap(x.expression);
    if (ts.isPropertyAccessExpression(callee)) {
      const m = callee.name.text;
      if (m === 'map') {
        const cb = x.arguments[0];
        const rets = cb ? returnsOf(unwrap(cb)) : null;
        return rets && rets.map((r): Src => ({ ctx: c, expr: r }));
      }
      if (SAME_ARRAY.has(m)) return elementsOf(c, callee.expression, depth + 1);
      if (m === 'concat') return collect([elementsOf(c, callee.expression, depth + 1), ...x.arguments.map((a) => elementsOf(c, a, depth + 1))]);
      if (m === 'values' && callee.expression.getText() === 'Object' && x.arguments[0]) {
        const objs = objectsOf(c, x.arguments[0], depth + 1);
        return objs && collect(objs.map(({ ctx: oc, obj }) => valuesOf(obj)?.map((v): Src => ({ ctx: oc, expr: v })) ?? null));
      }
      return null;
    }
    if (!ts.isIdentifier(callee)) return null;
    if (callee.text === 'useMemo') {
      const cb = x.arguments[0];
      const rets = cb ? returnsOf(unwrap(cb)) : null;
      return rets && collect(rets.map((r) => elementsOf(c, r, depth + 1)));
    }
    const ds = declsOf(get, c, callee.text, callee);
    if (!ds.length) return null;
    return collect(
      ds.map(({ ctx: dc, node }) => {
        const rets = returnsOf(fnNode(node));
        return rets && collect(rets.map((r) => elementsOf(dc, r, depth + 1)));
      }),
    );
  };

  /** 부른 결과의 객체들: 함수의 return(`resolveKind(k)`) · find 의 원소 · filter/slice/sort 의 배열. */
  const callObjects = (c: Ctx, call: ts.CallExpression, depth: number): Obj[] | null => {
    const callee = unwrap(call.expression);
    if (ts.isPropertyAccessExpression(callee)) {
      const m = callee.name.text;
      if (m === 'find' || m === 'findLast') {
        const els = elementsOf(c, callee.expression, depth + 1);
        return els && collect(els.map((s) => srcObjects(s, depth + 1)));
      }
      if (SAME_ARRAY.has(m)) return objectsOf(c, callee.expression, depth + 1);
      return null;
    }
    if (!ts.isIdentifier(callee)) return null;
    if (callee.text === 'useMemo') {
      const cb = call.arguments[0];
      const rets = cb ? returnsOf(unwrap(cb)) : null;
      return rets && collect(rets.map((r) => objectsOf(c, r, depth + 1)));
    }
    const ds = declsOf(get, c, callee.text, callee);
    if (!ds.length) return null;
    return collect(
      ds.map(({ ctx: dc, node }) => {
        const rets = returnsOf(fnNode(node));
        return rets && collect(rets.map((r) => objectsOf(dc, r, depth + 1)));
      }),
    );
  };

  /** 출처들에서 속성 이름을 차례로 따라간다(`o.a.b`). */
  const applyPath = (srcs: Src[], keys: string[], depth: number): Src[] | null => {
    let cur: Src[] | null = srcs;
    for (const k of keys) {
      if (!cur) return null;
      cur = collect(cur.map((s): Src[] | null => ('expr' in s ? propSources(s.ctx, s.expr, k, depth + 1) : 'kids' in s ? null : s.verdict === 'none' ? [] : null)));
    }
    return cur;
  };

  /** 식의 값에서 속성 하나: props 매개변수면 부르는 쪽으로, 아니면 객체 리터럴에서. */
  const propSources = (c: Ctx, e: ts.Expression, name: string, depth: number): Src[] | null => {
    if (depth > SEEN_LIMIT) return null;
    const x = unwrap(e);
    if (ts.isIdentifier(x)) {
      const ds = declsOf(get, c, x.text, x);
      if (ds.length === 1 && ts.isParameter(ds[0].node) && ts.isIdentifier(ds[0].node.name)) return paramSources(ds[0].ctx, ds[0].node, [name], depth + 1);
    }
    const objs = objectsOf(c, x, depth + 1);
    return objs && collect(objs.map(({ ctx: oc, obj }) => propOf(oc, obj, name, depth + 1)));
  };

  /** 이름이 가질 수 있는 값의 출처. 변수는 초깃값, 매개변수 · 구조 분해는 paramSources. */
  const sourcesOf = (c: Ctx, x: ts.Identifier, depth: number): Src[] | null => {
    const ds = declsOf(get, c, x.text, x);
    if (!ds.length) return null;
    return collect(
      ds.map(({ ctx: dc, node }): Src[] | null => {
        if (ts.isVariableDeclaration(node)) return node.initializer ? [{ ctx: dc, expr: node.initializer }] : null;
        if (ts.isParameter(node) || ts.isBindingElement(node)) return paramSources(dc, node, [], depth + 1);
        return null;
      }),
    );
  };

  /**
   * 매개변수(또는 그 구조 분해 이름)의 값. 구조 분해는 바깥으로 올라가며 속성 이름을 모은 뒤
   * ① 배열을 도는 콜백이면 원소 ② 부품의 props 면 부르는 쪽 JSX 가 넘긴 값 ③ 타입이 숫자 · 참거짓 · 문자열 리터럴이면 그것.
   * 구조 분해의 기본값(`{ hint = '선택' }`)도 출처에 더한다.
   */
  const paramSources = (c: Ctx, decl: ts.ParameterDeclaration | ts.BindingElement, path: string[], depth: number): Src[] | null => {
    if (depth > SEEN_LIMIT) return null;
    const fallback: Src[] = ts.isBindingElement(decl) && decl.initializer ? [{ ctx: c, expr: decl.initializer }] : [];
    let keys = path;
    let p: ts.Node = decl;
    while (ts.isBindingElement(p)) {
      if (p.dotDotDotToken) return null;
      // 객체로 풀면 속성 이름, 배열로 풀면(`([label, v]) =>`) «#순번» 이다.
      const key = ts.isObjectBindingPattern(p.parent) ? (p.propertyName ?? p.name) : null;
      if (key && !ts.isIdentifier(key) && !ts.isStringLiteral(key)) return null;
      keys = [key ? (key as ts.Identifier | ts.StringLiteral).text : `#${(p.parent as ts.ArrayBindingPattern).elements.indexOf(p)}`, ...keys];
      p = p.parent.parent;
      if (ts.isVariableDeclaration(p)) {
        const s = p.initializer ? applyPath([{ ctx: c, expr: p.initializer }], keys, depth + 1) : null;
        return s && [...s, ...fallback];
      }
    }
    if (!ts.isParameter(p)) return null;
    const s = paramRoot(c, p, keys, depth + 1);
    return s && [...s, ...fallback];
  };

  const paramRoot = (c: Ctx, p: ts.ParameterDeclaration, keys: string[], depth: number): Src[] | null => {
    const fn = p.parent;
    const index = fn.parameters.indexOf(p);
    // ① 배열을 도는 콜백(`OPTIONS.map((o) => o.label)`): 첫 매개변수는 원소, 둘째는 순번(숫자)
    if ((ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) && ts.isCallExpression(fn.parent) && fn.parent.arguments[0] === fn && index <= 1) {
      const callee = unwrap(fn.parent.expression);
      if (ts.isPropertyAccessExpression(callee) && ITERATORS.has(callee.name.text) && index === 1) return [{ verdict: 'none' }];
      if (ts.isPropertyAccessExpression(callee) && ITERATORS.has(callee.name.text)) {
        const els = elementsOf(c, callee.expression, depth + 1);
        if (els) return keys.length ? applyPath(els, keys, depth + 1) : els;
      }
    }
    // ② 부품의 props(`<Field hint="선택">`): 부르는 쪽 JSX 가 넘긴 값
    const comp = index === 0 && keys.length ? componentOf(fn) : null;
    const given = comp ? callerSources(comp, keys[0]) : null;
    if (given) return keys.length > 1 ? applyPath(given, keys.slice(1), depth + 1) : given;
    // ③ 타입(`n: number` · `tone: 'ok' | 'warn'`)
    const t = memberType(c, p.type, keys);
    const v = t ? typeVerdict(t.ctx, t.type, 0) : null;
    return v ? [{ verdict: v }] : null;
  };

  const callerMemo = new Map<ts.Node, Map<string, Src[] | null>>();
  /** 부품을 그리는 모든 JSX 자리가 prop 하나에 넘긴 값. 부르는 곳이 없거나 부품을 값으로 넘긴 곳이 있으면 null. */
  const callerSources = (comp: ts.Node, prop: string): Src[] | null => {
    const memo = callerMemo.get(comp) ?? new Map<string, Src[] | null>();
    callerMemo.set(comp, memo);
    if (memo.has(prop)) return memo.get(prop)!;
    const idx = callers();
    const calls = idx.escaped.has(comp) ? [] : (idx.sites.get(comp) ?? []);
    let out: Src[] | null = calls.length ? [] : null;
    for (const { ctx: cc, el } of calls) {
      if (!out) break;
      const attrs = [...(ts.isJsxElement(el) ? el.openingElement : el).attributes.properties];
      let at = -1;
      attrs.forEach((a, i) => ts.isJsxAttribute(a) && a.name.getText() === prop && (at = i));
      if (attrs.slice(at + 1).some(ts.isJsxSpreadAttribute)) out = null; // 뒤의 펼침이 덮을 수 있다
      else if (at >= 0) {
        const init = (attrs[at] as ts.JsxAttribute).initializer;
        if (!init) out.push({ verdict: 'none' }); // <X disabled />
        else if (ts.isJsxExpression(init)) out.push(init.expression ? { ctx: cc, expr: init.expression } : { verdict: 'none' });
        else out.push({ ctx: cc, expr: init });
      } else if (prop === 'children' && ts.isJsxElement(el)) out.push({ ctx: cc, kids: el });
      else out.push({ verdict: 'none' }); // 안 넘겼다(기본값은 paramSources 가 더한다)
    }
    memo.set(prop, out);
    return out;
  };

  /** 매개변수 타입에서 속성 이름을 따라간 타입. 같은 파일 또는 import 한 interface · type 을 본다. */
  const memberType = (c: Ctx, t: ts.TypeNode | undefined, keys: string[]): { ctx: Ctx; type: ts.TypeNode } | null => {
    let cur: { ctx: Ctx; type: ts.TypeNode } | null = t ? { ctx: c, type: t } : null;
    for (const k of keys) {
      const ms: { ctx: Ctx; members: ts.NodeArray<ts.TypeElement> } | null = cur ? membersOf(cur.ctx, cur.type) : null;
      const m = ms?.members.find((x): x is ts.PropertySignature => ts.isPropertySignature(x) && (ts.isIdentifier(x.name) || ts.isStringLiteral(x.name)) && x.name.text === k);
      cur = ms && m?.type ? { ctx: ms.ctx, type: m.type } : null;
    }
    return cur;
  };

  const typeDecl = (c: Ctx, name: string): { ctx: Ctx; node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration } | null => {
    const own = c.types.get(name);
    if (own) return { ctx: c, node: own };
    const imp = c.imports.get(name);
    const other = imp ? get(imp.from) : null;
    const d = other && imp ? other.types.get(imp.name) : undefined;
    return other && d ? { ctx: other, node: d } : null;
  };

  const membersOf = (c: Ctx, t: ts.TypeNode): { ctx: Ctx; members: ts.NodeArray<ts.TypeElement> } | null => {
    if (ts.isTypeLiteralNode(t)) return { ctx: c, members: t.members };
    if (!ts.isTypeReferenceNode(t) || !ts.isIdentifier(t.typeName)) return null;
    const d = typeDecl(c, t.typeName.text);
    if (!d) return null;
    if (ts.isInterfaceDeclaration(d.node)) return { ctx: d.ctx, members: d.node.members };
    return ts.isTypeLiteralNode(d.node.type) ? { ctx: d.ctx, members: d.node.type.members } : null;
  };

  /** 타입만으로 정해지는 판정. 숫자 · 참거짓 · 문자열 리터럴(의 합)만 안다. */
  const typeVerdict = (c: Ctx, t: ts.TypeNode, depth: number): Verdict | null => {
    if (depth > 5) return null;
    switch (t.kind) {
      case ts.SyntaxKind.NumberKeyword:
      case ts.SyntaxKind.BooleanKeyword:
      case ts.SyntaxKind.BigIntKeyword:
      case ts.SyntaxKind.UndefinedKeyword:
        return 'none';
    }
    if (ts.isLiteralTypeNode(t)) return ts.isStringLiteral(t.literal) ? hangulIn(t.literal.text) : 'none';
    if (ts.isParenthesizedTypeNode(t)) return typeVerdict(c, t.type, depth + 1);
    if (ts.isUnionTypeNode(t)) {
      const vs = t.types.map((x) => typeVerdict(c, x, depth + 1));
      return vs.some((v) => v === null) ? null : all(vs as Verdict[]);
    }
    if (ts.isTypeReferenceNode(t) && ts.isIdentifier(t.typeName)) {
      const d = typeDecl(c, t.typeName.text);
      return d && ts.isTypeAliasDeclaration(d.node) ? typeVerdict(d.ctx, d.node.type, depth + 1) : null;
    }
    return null;
  };

  /** 함수가 돌려주는 글. 몸에 한글 리터럴이 있으면 한글, 아니면 return 식들을 본다. */
  const fnText = (ctx: Ctx, fn: ts.Node, depth: number): Verdict => {
    const lit = firstHangul(fn);
    if (lit !== null) return hangulIn(lit);
    const rets = returnsOf(fn);
    return rets ? all(rets.map((r) => exprText(ctx, r, depth + 1))) : miss(fn);
  };

  const callText = (ctx: Ctx, call: ts.CallExpression, depth: number): Verdict => {
    const callee = unwrap(call.expression);
    const arg = (i: number): Verdict => (call.arguments[i] ? exprText(ctx, call.arguments[i], depth + 1) : 'none');
    if (ts.isPropertyAccessExpression(callee)) {
      const m = callee.name.text;
      const recv = () => exprText(ctx, callee.expression, depth + 1);
      if (m === 'map' || m === 'flatMap') {
        const cb = call.arguments[0];
        return cb && (ts.isArrowFunction(cb) || ts.isFunctionExpression(cb)) ? fnText(ctx, cb, depth) : miss(call);
      }
      if (m === 'join') return both(recv(), arg(0));
      if (m === 'toFixed' || m === 'toPrecision' || DATE_NUMBER.test(m)) return 'none';
      if (ts.isIdentifier(callee.expression) && callee.expression.text === 'Math') return 'none';
      if (SAME_TEXT.has(m)) return recv();
      if (m === 'padStart' || m === 'padEnd' || m === 'replace' || m === 'replaceAll') return both(recv(), arg(1));
      if (m === 'concat') return all([recv(), ...call.arguments.map((_, i) => arg(i))]);
      if (m === 'find' || m === 'findLast') {
        const els = elementsOf(ctx, callee.expression, depth + 1);
        return els ? all(els.map((s) => srcText(s, depth + 1))) : miss(call);
      }
      return miss(call);
    }
    if (ts.isIdentifier(callee)) {
      if (callee.text === 'String') return arg(0);
      if (callee.text === 'Number' || callee.text === 'parseInt' || callee.text === 'parseFloat') return 'none';
      const ds = declsOf(get, ctx, callee.text, callee);
      if (!ds.length) return miss(call);
      return all(ds.map(({ ctx: c, node }) => (fnNode(node) ? fnText(c, fnNode(node)!, depth + 1) : miss(call))));
    }
    return miss(call);
  };

  const srcText = (s: Src, depth: number): Verdict =>
    'expr' in s ? exprText(s.ctx, s.expr, depth) : 'kids' in s ? childrenText(s.ctx, s.kids.children, depth) : s.verdict;

  const memo = new Map<ts.Node, { v: Verdict; misses: string[]; found: string[] }>();
  const busy = new Set<ts.Node>();
  /** 식이 화면에 그리는 글에 한글이 있는가. 같은 식은 한 번만 푼다(되돌이는 «모름» 으로 끊는다). */
  const exprText = (ctx: Ctx, e: ts.Expression, depth: number): Verdict => {
    const hit = memo.get(e);
    if (hit) {
      misses.push(...hit.misses);
      found.push(...hit.found);
      return hit.v;
    }
    if (busy.has(e) || depth > SEEN_LIMIT) {
      cuts++;
      return miss(e);
    }
    busy.add(e);
    const [from, fromFound, cutsBefore] = [misses.length, found.length, cuts];
    const v = exprTextOnce(ctx, e, depth);
    busy.delete(e);
    if (cuts === cutsBefore) memo.set(e, { v, misses: misses.slice(from), found: found.slice(fromFound) });
    return v;
  };

  const exprTextOnce = (ctx: Ctx, e: ts.Expression, depth: number): Verdict => {
    const x = unwrap(e);
    if (ts.isStringLiteral(x) || ts.isNoSubstitutionTemplateLiteral(x)) return hangulIn(x.text);
    if (ts.isTemplateExpression(x)) {
      const lit = firstHangul(x);
      if (lit !== null) return hangulIn(lit);
      return all(x.templateSpans.map((s) => exprText(ctx, s.expression, depth + 1)));
    }
    if (ts.isNumericLiteral(x) || x.kind === ts.SyntaxKind.TrueKeyword || x.kind === ts.SyntaxKind.FalseKeyword || x.kind === ts.SyntaxKind.NullKeyword) return 'none';
    if (ts.isIdentifier(x) && x.text === 'undefined') return 'none';
    if (ts.isPrefixUnaryExpression(x) || ts.isTypeOfExpression(x)) return 'none';
    if (ts.isConditionalExpression(x)) return both(exprText(ctx, x.whenTrue, depth + 1), exprText(ctx, x.whenFalse, depth + 1));
    if (ts.isBinaryExpression(x)) {
      const op = x.operatorToken.kind;
      if (op === ts.SyntaxKind.AmpersandAmpersandToken) return exprText(ctx, x.right, depth + 1);
      if (op === ts.SyntaxKind.BarBarToken || op === ts.SyntaxKind.QuestionQuestionToken || op === ts.SyntaxKind.PlusToken) {
        return both(exprText(ctx, x.left, depth + 1), exprText(ctx, x.right, depth + 1));
      }
      return 'none'; // 비교 · 산술은 숫자나 참거짓이다
    }
    if (ts.isJsxElement(x) || ts.isJsxSelfClosingElement(x) || ts.isJsxFragment(x)) return jsxText(ctx, x, depth + 1);
    if (ts.isArrayLiteralExpression(x)) {
      const vs = valuesOf(x);
      return vs ? all(vs.map((v) => exprText(ctx, v, depth + 1))) : miss(x);
    }
    if (ts.isCallExpression(x)) return callText(ctx, x, depth);
    if (ts.isPropertyAccessExpression(x) && x.name.text === 'length') return 'none';
    if (ts.isElementAccessExpression(x)) {
      const objs = objectsOf(ctx, x.expression, depth + 1);
      const vals = objs && collect(objs.map(({ ctx: c, obj }) => valuesOf(obj)?.map((v): Src => ({ ctx: c, expr: v })) ?? null));
      return vals ? all(vals.map((s) => srcText(s, depth + 1))) : miss(x);
    }
    if (ts.isPropertyAccessExpression(x)) {
      const s = propSources(ctx, x.expression, x.name.text, depth + 1);
      return s ? all(s.map((v) => srcText(v, depth + 1))) : miss(x);
    }
    if (ts.isIdentifier(x)) {
      const s = sourcesOf(ctx, x, depth + 1);
      return s ? all(s.map((v) => srcText(v, depth + 1))) : miss(x);
    }
    return miss(x);
  };

  const childrenText = (ctx: Ctx, kids: ts.NodeArray<ts.JsxChild>, depth: number): Verdict =>
    all(
      kids.map((c): Verdict => {
        if (ts.isJsxText(c)) return hangulIn(c.text);
        if (ts.isJsxExpression(c)) return c.expression ? exprText(ctx, c.expression, depth + 1) : 'none';
        return jsxText(ctx, c, depth + 1);
      }),
    );

  /** JSX 가 그리는 글. 자기 letterSpacing 을 적은 자손은 따로 판정하므로 건너뛴다. 아이콘 부품(createIcon)은 글이 없다. */
  const jsxText = (ctx: Ctx, n: ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment, depth: number, self = false): Verdict => {
    if (ts.isJsxSelfClosingElement(n)) {
      if (!self && trackingProps(ctx, n.attributes).length) return 'none';
      if (!isComponent(n.tagName)) return 'none';
      const d = ts.isIdentifier(n.tagName) ? componentDecl(get, ctx, n.tagName.text, n.tagName) : null;
      const init = d && ts.isVariableDeclaration(d.node) && d.node.initializer ? unwrap(d.node.initializer) : null;
      return init && ts.isCallExpression(init) && init.expression.getText() === 'createIcon' ? 'none' : miss(n);
    }
    if (ts.isJsxElement(n) && !self && trackingProps(ctx, n.openingElement.attributes).length) return 'none';
    return childrenText(ctx, n.children, depth);
  };

  const isComponent = (tag: ts.JsxTagNameExpression) => !/^[a-z]/.test(tag.getText());

  /** style={…} 이 가리키는 객체 리터럴들의 letterSpacing 속성. */
  const trackingProps = (ctx: Ctx, attrs: ts.JsxAttributes): Array<{ ctx: Ctx; prop: ts.PropertyAssignment; obj: ts.ObjectLiteralExpression }> => {
    const style = attrs.properties.find((a): a is ts.JsxAttribute => ts.isJsxAttribute(a) && a.name.getText() === 'style');
    if (!style?.initializer || !ts.isJsxExpression(style.initializer) || !style.initializer.expression) return [];
    const out: Array<{ ctx: Ctx; prop: ts.PropertyAssignment; obj: ts.ObjectLiteralExpression }> = [];
    const visit = (c: Ctx, e: ts.Expression, depth: number): void => {
      if (depth > 6) return;
      const x = unwrap(e);
      // codeOrTextFont(글귀, 자간) 은 한글이면 자간을 0 으로 바꿔 돌려준다(lib/design/hangul-text.tsx). labelTracking 과 같은 지킴이다.
      if (ts.isCallExpression(x) && /(^|\.)codeOrTextFont$/.test(x.expression.getText())) return;
      if (ts.isConditionalExpression(x)) {
        visit(c, x.whenTrue, depth + 1);
        visit(c, x.whenFalse, depth + 1);
        return;
      }
      for (const { ctx: oc, obj } of objectsOf(c, x, 0) ?? []) {
        if (!ts.isObjectLiteralExpression(obj)) continue;
        for (const p of obj.properties) {
          if (ts.isSpreadAssignment(p)) visit(oc, p.expression, depth + 1);
          else if (ts.isPropertyAssignment(p) && p.name.getText() === 'letterSpacing') out.push({ ctx: oc, prop: p, obj });
        }
      }
    };
    visit(ctx, style.initializer.expression, 0);
    return out;
  };

  return { jsxText, trackingProps, misses, found };
}

/** letterSpacing 값 하나를 px 로. 'guarded' 는 labelTracking · LABEL.hangulTracking 을 거친 것, null 은 못 푼 것. */
function trackingPx(get: Getter, ctx: Ctx, e: ts.Expression, fontPx: number, vars: Map<string, string[]>, depth = 0): number | 'guarded' | null {
  const x = unwrap(e);
  if (depth > 8) return null;
  if (ts.isCallExpression(x) && /(^|\.)labelTracking$/.test(x.expression.getText())) return 'guarded';
  if (ts.isPropertyAccessExpression(x) && x.getText() === 'LABEL.hangulTracking') return 'guarded';
  if (ts.isNumericLiteral(x)) return Number(x.text);
  if (ts.isPrefixUnaryExpression(x) && x.operator === ts.SyntaxKind.MinusToken) return -1;
  if (ts.isStringLiteral(x) || ts.isNoSubstitutionTemplateLiteral(x)) return lengthPx(x.text, fontPx, vars);
  if (ts.isPropertyAccessExpression(x) && /^QDText\.tracking\.\w+$/.test(x.getText())) {
    const v = (QDText.tracking as Record<string, number | string>)[x.name.text];
    return v === undefined ? null : typeof v === 'number' ? v : lengthPx(v, fontPx, vars);
  }
  if (ts.isConditionalExpression(x)) {
    const rs = [x.whenTrue, x.whenFalse].map((b) => trackingPx(get, ctx, b, fontPx, vars, depth + 1));
    const nums = rs.filter((r): r is number => typeof r === 'number');
    if (nums.some((n) => n > LIMIT_PX)) return Math.max(...nums);
    if (rs.includes(null)) return null;
    return nums.length ? Math.max(...nums) : 'guarded';
  }
  if (ts.isIdentifier(x)) {
    const ds = declsOf(get, ctx, x.text, x);
    const inits = ds.flatMap(({ ctx: c, node }) => (ts.isVariableDeclaration(node) && node.initializer ? [{ c, init: node.initializer }] : []));
    if (inits.length !== 1) return null;
    return trackingPx(get, inits[0].c, inits[0].init, fontPx, vars, depth + 1);
  }
  return null;
}

/** 같은 style 객체의 fontSize 가 QDScale.font[N] 이나 숫자면 그 px, 아니면 기본값. */
function fontPxOf(obj: ts.ObjectLiteralExpression): number {
  for (const p of obj.properties) {
    if (!ts.isPropertyAssignment(p) || p.name.getText() !== 'fontSize') continue;
    const x = unwrap(p.initializer);
    if (ts.isNumericLiteral(x)) return Number(x.text);
    const m = /^QDScale\.font\[(\d+(?:\.\d+)?)\]$/.exec(x.getText());
    if (m) return Number(m[1]);
  }
  return FALLBACK_FONT_PX;
}

/**
 * 파일 묶음 하나를 읽는 검출기. 돌려준 함수가 파일 하나에서 «양수 자간 + 한글» 과 «양수 자간 + 모름» 자리를 찾는다.
 * read 는 절대 경로 → 원문(없으면 null). indexFiles 는 부품을 부르는 쪽을 찾을 파일들이다(props 를 따라갈 때 쓴다).
 * 같은 묶음의 파일은 한 번만 읽고, 부르는 쪽 색인도 처음 필요할 때 한 번만 만든다.
 */
export function makeScanner(read: (abs: string) => string | null, vars: Map<string, string[]>, indexFiles: string[]) {
  const get = makeCtxCache(read);
  let index: CallerIndex | null = null;
  const { jsxText, trackingProps, misses, found } = makeAnalyzer(get, () => (index ??= makeCallerIndex(get, indexFiles)));
  const rel = (f: string) => relative(REPO_ROOT, f).replace(/\\/g, '/');
  return (abs: string): TrackingSite[] => {
    const ctx = get(abs);
    if (!ctx) return [];
    const out: TrackingSite[] = [];
    const claimed = new Set<ts.Node>();
    const lineOf = (n: ts.Node) => n.getSourceFile().getLineAndCharacterOfPosition(n.getStart()).line + 1;

    const visit = (n: ts.Node) => {
      if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) {
        const attrs = ts.isJsxElement(n) ? n.openingElement.attributes : n.attributes;
        const props = trackingProps(ctx, attrs);
        let px: number | null = -Infinity;
        for (const { ctx: c, prop, obj } of props) {
          claimed.add(prop);
          const v = trackingPx(get, c, prop.initializer, fontPxOf(obj), vars);
          if (v === 'guarded') continue;
          px = v === null || px === null ? null : Math.max(px, v);
        }
        if (props.length && (px === null || px > LIMIT_PX)) {
          misses.length = 0;
          found.length = 0;
          const verdict = jsxText(ctx, n, 0, true);
          const tag = (ts.isJsxElement(n) ? n.openingElement.tagName : n.tagName).getText();
          const value = px === null ? '값 모름' : `${+px.toFixed(2)}px`;
          const said = [...new Set(found)].slice(0, 2).map((t) => `「${t}」`).join(' ');
          if (verdict === 'hangul') out.push({ file: rel(abs), line: lineOf(n), verdict: px === null ? 'unknown' : 'hangul', px, why: `<${tag}> ${value} · 한글 ${said}` });
          else if (verdict === 'unknown') {
            const what = [...new Set(misses)].slice(0, 3).join(' · ');
            out.push({ file: rel(abs), line: lineOf(n), verdict: 'unknown', px, why: `<${tag}> ${value} · 글귀를 정적으로 모름${what ? `: ${what}` : ''}` });
          }
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(ctx.sf);

    // 어느 요소에도 이어지지 않은 letterSpacing(부품 props 로 넘기는 스타일 객체 등)
    const orphans = (n: ts.Node) => {
      if (ts.isPropertyAssignment(n) && n.name.getText() === 'letterSpacing' && !claimed.has(n) && ts.isObjectLiteralExpression(n.parent)) {
        const v = trackingPx(get, ctx, n.initializer, fontPxOf(n.parent), vars);
        if (v !== 'guarded' && (v === null || v > LIMIT_PX)) {
          out.push({ file: rel(abs), line: lineOf(n), verdict: 'unknown', px: v, why: `요소에 이어지지 않은 스타일 객체 ${v === null ? '값 모름' : `${+v.toFixed(2)}px`}` });
        }
      }
      ts.forEachChild(n, orphans);
    };
    orphans(ctx.sf);
    return out;
  };
}

/** 파일 하나만 볼 때(시험의 가짜 파일 묶음). 부르는 쪽은 indexFiles 에서 찾는다. */
export function scanTracking(abs: string, read: (abs: string) => string | null, vars: Map<string, string[]>, indexFiles: string[] = [abs]): TrackingSite[] {
  return makeScanner(read, vars, indexFiles)(abs);
}

function walk(dir: string, out: string[]) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(name) && !/\.test\.tsx$/.test(name)) out.push(p);
  }
}

const readOrNull = (abs: string): string | null => {
  try {
    return statSync(abs).isFile() ? readFileSync(abs, 'utf8') : null;
  } catch {
    return null;
  }
};

/** «모름» 자리가 남은 파일 → 개수. 줄면 기준선도 줄이고, 늘면 글귀를 labelTracking 으로 감쌀 것. 0 이 되면 줄을 지운다. */
const UNKNOWN_BASELINE: ReadonlyArray<[string, number]> = [
  // 2026-10-22 시작 기준선: 79 파일 · 117 자리. 같은 날 «한글» 로 확정된 66 자리는 전부 고쳐 0 으로 시작했다.
  // 같은 날 운영에서 재 보니 알림 종의 종류 이름표(「기한 알림」 0.5px)가 «모름» 안의 실제 한글이었다. 고쳐 78 파일 · 116 자리.
  // 10-23 검출기를 넓혀(함수가 돌려준 객체의 속성 · 부르는 쪽이 넘긴 props · 배열 원소 · 타입) 다시 훑었다.
  // 한글로 드러난 자리는 감싸고, 라틴 · 숫자로 드러난 자리는 지나가게 했다. 41 파일 · 47 자리. 남은 것은 코드 · 번호 · 날짜 · 조항이다.
  ['app/(app)/admin/multi-view/page.tsx', 1],
  ['app/(app)/admin/permissions-matrix/page.tsx', 2],
  ['app/(app)/admin/qmatch-quiz/page.tsx', 1],
  ['app/(app)/assessments/assessments-client.tsx', 1],
  ['app/(app)/audits/[id]/client.tsx', 2],
  ['app/(app)/audits/page.tsx', 1],
  ['app/(app)/equipment/page.tsx', 1],
  ['app/(app)/inbox/page.tsx', 1],
  ['app/(app)/management-reviews/[id]/client.tsx', 1],
  ['app/(app)/management-reviews/page.tsx', 1],
  ['app/(app)/process-templates/page.tsx', 1],
  ['app/(app)/process-validations/page.tsx', 1],
  ['app/(app)/production-equipment/page.tsx', 1],
  ['app/(app)/products/client.tsx', 2],
  ['app/(app)/qa/qa-workspace-client.tsx', 1],
  ['app/(app)/ra/ra-workspace-client.tsx', 1],
  ['app/(app)/regulatory-calendar/page.tsx', 1],
  ['app/(app)/research/[code]/design-requirements/page.tsx', 1],
  ['app/(app)/research/[code]/risks/page.tsx', 1],
  ['app/(app)/research/research-client.tsx', 1],
  ['app/(app)/research/review/page.tsx', 1],
  ['app/(app)/settings/templates/template-manager.tsx', 1],
  ['app/(app)/suppliers/client.tsx', 1],
  ['components/AdminHubTabs.tsx', 1],
  ['components/ApprovedAdvisoryList.tsx', 1],
  ['components/dashboard/ClinicalDashboardView.tsx', 3],
  ['components/dashboard/widgets.tsx', 1],
  ['components/DepartmentBadge.tsx', 1],
  ['components/DocChecklistPanel.tsx', 1],
  ['components/IfuClassifyDrawer.tsx', 1],
  ['components/InternalReviewQueue.tsx', 1],
  ['components/item-classification/MfdsRegisteredProducts.tsx', 1],
  ['components/ItemClassificationPreview.tsx', 1],
  ['components/MatchedRulesList.tsx', 1],
  ['components/NotificationQuickReply.tsx', 1],
  ['components/RdDocumentFlowPanel.tsx', 1],
  ['components/RequirementsDashboard.tsx', 1],
  ['components/ResearchEntryBanner.tsx', 1],
  ['components/RevisionRowExpandable.tsx', 1],
  ['components/RoleProjectCard.tsx', 1],
  ['components/RuleEngineBadge.tsx', 2],
];

function literal(found: Map<string, number>): string {
  return [...found.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([f, n]) => `  ['${f}', ${n}],`).join('\n');
}

describe('한글 자간 2부: app · components 전체의 양수 자간(var() · QDText 포함)', () => {
  const vars = cssVars(readFileSync(join(REPO_ROOT, FOUNDATION_CSS), 'utf8'));
  const files: string[] = [];
  for (const d of SCAN_DIRS) walk(join(REPO_ROOT, d), files);
  // 부품을 부르는 쪽은 lib/ 의 .tsx 에도 있다. 거기서 넘긴 props 를 빠뜨리면 «안 넘김» 으로 잘못 친다.
  const callerFiles = [...files];
  walk(join(REPO_ROOT, 'lib'), callerFiles);
  const scan = makeScanner(readOrNull, vars, callerFiles);
  const sites = files.flatMap((f) => scan(f));
  const hangul = sites.filter((s) => s.verdict === 'hangul');
  const unknown = new Map<string, number>();
  for (const s of sites) if (s.verdict === 'unknown') unknown.set(s.file, (unknown.get(s.file) ?? 0) + 1);
  const expected = new Map(UNKNOWN_BASELINE);

  it('훑은 파일과 자간 토큰이 비어 있지 않다(계약이 헛돌지 않는다)', () => {
    expect(files.length).toBeGreaterThan(300);
    expect(vars.get('--qd-atelier-letter-spacing-32f7ddcf93')).toEqual(['1px']);
  });

  it('한글 글귀에 0.3px 넘는 자간이 없다', () => {
    expect(
      hangul.map((s) => `  ${s.file}:${s.line}  ${s.why}`),
      'letterSpacing: labelTracking(글귀, 원래값) · textTransform: labelCase(글귀) 로 바꿀 것(lib/design/q-design-labels.ts)',
    ).toEqual([]);
  });

  it('«모름» 자리가 기준선에 없는 파일에 생기지 않았다', () => {
    const extra = [...unknown.entries()].filter(([f]) => !expected.has(f));
    expect(
      extra.flatMap(([f]) => sites.filter((s) => s.file === f && s.verdict === 'unknown').map((s) => `  ${s.file}:${s.line}  ${s.why}`)),
      '변수로 받은 글귀에 양수 자간. 한글이 올 수 있으면 labelTracking(글귀, 원래값) 으로 감쌀 것. ' +
        '늘 라틴 · 숫자라 그대로 둘 것이면 아래 줄들로 UNKNOWN_BASELINE 을 바꿔 쓸 것:\n' + literal(unknown),
    ).toEqual([]);
  });

  it('검출기가 var() · 표 조회 · 함수 · import 를 따라가 잡고, 감싼 것 · 라틴 · 가려진 이름은 지나간다(일부러 깨뜨려 본 것)', () => {
    const ONE = '"var(--qd-atelier-letter-spacing-32f7ddcf93)"'; // 1px
    const page = join(REPO_ROOT, 'app/__probe__/page.tsx');
    const lib = join(REPO_ROOT, 'lib/__probe__/labels.ts');
    const verdicts = (body: string, extra: Record<string, string> = {}) => {
      const files: Record<string, string> = { [page]: body, ...extra };
      return scanTracking(page, (abs) => files[abs] ?? null, vars).map((s) => s.verdict);
    };
    // 잡아야 하는 것
    expect(verdicts(`const A = () => <span style={{ letterSpacing: ${ONE} }}>오늘 할 일</span>;`)).toEqual(['hangul']);
    expect(verdicts(`const R = { qa: '품질', ra: '인허가' }; const A = ({ r }) => <span style={{ letterSpacing: ${ONE} }}>{R[r]}</span>;`)).toEqual(['hangul']);
    expect(verdicts(`function ago(d) { return d ? '방금' : ''; } const A = ({ d }) => <span style={{ letterSpacing: ${ONE} }}>{ago(d)}</span>;`)).toEqual(['hangul']);
    expect(
      verdicts(`import { roleLabel } from '@/lib/__probe__/labels'; const A = ({ r }) => <span style={{ letterSpacing: ${ONE} }}>{roleLabel(r)}</span>;`, {
        [lib]: `const MAP = { qa: '품질' }; export function roleLabel(r) { return MAP[r] ?? r; }`,
      }),
    ).toEqual(['hangul']);
    expect(verdicts(`const A = ({ n }) => <div style={{ letterSpacing: QDText.tracking.v914204c25f }}><b>{n}건</b></div>;`)).toEqual(['hangul']);
    expect(verdicts(`const A = ({ n }) => <span style={{ fontSize: QDScale.font[12], letterSpacing: "var(--qd-atelier-letter-spacing-0d0739d0da)" }}>{n < 0 ? \`초과 \${-n}일\` : \`D-\${n}\`}</span>;`)).toEqual(['hangul']);
    expect(verdicts(`const S = { label: { letterSpacing: ${ONE} } }; const A = () => <span style={S.label}>품질</span>;`)).toEqual(['hangul']);
    // 모름으로 세는 것
    expect(verdicts(`const A = ({ label }) => <span style={{ letterSpacing: ${ONE} }}>{label}</span>;`)).toEqual(['unknown']);
    expect(verdicts(`const st = { letterSpacing: ${ONE} }; const A = () => <Pill sx={st} />;`)).toEqual(['unknown']);
    // 지나가야 하는 것
    expect(verdicts(`const A = () => <span style={{ letterSpacing: labelTracking('오늘 할 일', ${ONE}) }}>오늘 할 일</span>;`)).toEqual([]);
    expect(verdicts(`const A = () => <span style={{ letterSpacing: ${ONE} }}>ISO 13485 · {3}</span>;`)).toEqual([]);
    expect(verdicts(`const A = () => <span style={{ letterSpacing: "var(--qd-atelier-letter-spacing-de0a108215)" }}>0.3px 는 기준 안</span>;`)).toEqual([]);
    expect(verdicts(`const A = () => <h1 style={{ letterSpacing: "var(--qd-atelier-letter-spacing-0eb1693ce1)" }}>제목 조이기</h1>;`)).toEqual([]);
    expect(verdicts(`const A = () => <div style={{ letterSpacing: ${ONE} }}>ID <span style={{ letterSpacing: LABEL.hangulTracking }}>한글</span></div>;`)).toEqual([]);
    expect(verdicts(`const A = ({ xs }) => <div style={{ letterSpacing: ${ONE} }}>{xs.length} / {(7).toFixed(1)}</div>;`)).toEqual([]);
    // 바깥의 같은 이름(한글)은 매개변수에 가려진다: 한글로 잘못 잡지 않고 «모름» 으로 센다.
    expect(verdicts(`const label = '품질'; const A = ({ label }) => <span style={{ letterSpacing: ${ONE} }}>{label}</span>;`)).toEqual(['unknown']);
  });

  it('검출기가 함수가 돌려준 객체 · 부르는 쪽 props · 배열 원소 · 타입을 따라간다(일부러 깨뜨려 본 것)', () => {
    const ONE = '"var(--qd-atelier-letter-spacing-32f7ddcf93)"'; // 1px
    const page = join(REPO_ROOT, 'app/__probe__/page.tsx');
    const caller = join(REPO_ROOT, 'components/__probe__/Form.tsx');
    const lib = join(REPO_ROOT, 'lib/__probe__/kind.ts');
    /** page 의 자리 판정. 부르는 쪽 색인은 page 와 caller 를 함께 본다. */
    const verdicts = (body: string, extra: Record<string, string> = {}) => {
      const files: Record<string, string> = { [page]: body, ...extra };
      return scanTracking(page, (abs) => files[abs] ?? null, vars, [page, caller]).map((s) => s.verdict);
    };
    const span = (inner: string) => `<span style={{ letterSpacing: ${ONE} }}>${inner}</span>`;
    const form = (jsx: string) => ({ [caller]: `import { Field } from '@/app/__probe__/page'; export const F = () => ${jsx};` });
    const field = `export function Field({ label, hint }) { return <label>{label}${span('{hint}')}</label>; }`;

    // 함수가 돌려준 객체의 속성(알림 종 · 전문가 알림의 resolveKind 와 같은 꼴). 속성 하나만 본다.
    const kind = `export function resolveKind(k) { return k === 'due' ? { label: '기한 알림', code: 'DUE' } : { label: '검토 요청', code: 'REV' }; }`;
    const useKind = (prop: string) => `import { resolveKind } from '@/lib/__probe__/kind'; const A = ({ n }) => { const d = resolveKind(n.kind); return ${span(`{d.${prop}}`)}; };`;
    expect(verdicts(useKind('label'), { [lib]: kind })).toEqual(['hangul']);
    expect(verdicts(useKind('code'), { [lib]: kind })).toEqual([]);

    // 부품의 props: 다른 파일에서 한글을 넘기면 한글, 라틴만 넘기면 통과, 안 넘기면 글 없음
    expect(verdicts(field, form(`<Field label="이름" hint="선택" />`))).toEqual(['hangul']);
    expect(verdicts(field, form(`<Field label="이름" hint="ID" />`))).toEqual([]);
    expect(verdicts(field, form(`<Field label="이름" />`))).toEqual([]);
    expect(verdicts(`export const Lbl = ({ children }) => ${span('{children}')}; const P = () => <Lbl>품질</Lbl>;`)).toEqual(['hangul']);
    // 부르는 곳이 없거나, 값으로 넘겨져 부르는 곳을 다 알 수 없거나, 펼쳐 넘기면 «모름»
    expect(verdicts(field)).toEqual(['unknown']);
    expect(verdicts(`const Row = ({ label }) => ${span('{label}')}; const P = () => <Row label="ID" />; const L = () => <List render={Row} />;`)).toEqual(['unknown']);
    expect(verdicts(field, form(`<Field hint="ID" {...rest} />`))).toEqual(['unknown']);

    // 배열을 도는 콜백 · 배열 풀기 · .map 으로 만든 배열
    const OPTS = `const OPTIONS = [{ v: 'qa', label: '품질' }, { v: 'ra', label: 'RA', sub: 'x' }];`;
    expect(verdicts(`${OPTS} const A = () => <div>{OPTIONS.map((o) => ${span('{o.label}')})}</div>;`)).toEqual(['hangul']);
    expect(verdicts(`${OPTS} const A = () => <div>{OPTIONS.map((o, i) => ${span('{o.v} {i} {o.sub}')})}</div>;`)).toEqual([]);
    expect(verdicts(`const ROWS = [['품질', 1], ['RA', 2]]; const A = () => <ul>{ROWS.map(([label, n]) => ${span('{label}')})}</ul>;`)).toEqual(['hangul']);
    expect(verdicts(`const ROWS = [['품질', 1], ['RA', 2]]; const A = () => <ul>{ROWS.map(([label, n]) => ${span('{n}')})}</ul>;`)).toEqual([]);
    expect(
      verdicts(`const NAME = { qa: '품질' }; const ITEMS = ['qa'].map((k) => ({ key: k, label: NAME[k] })); const A = () => <div>{ITEMS.map((it) => ${span('{it.label}')})}</div>;`),
    ).toEqual(['hangul']);

    // 타입으로 정해지는 매개변수(부르는 곳이 없어도)
    expect(verdicts(`const A = ({ n }: { n: number }) => ${span('{n}')};`)).toEqual([]);
    expect(verdicts(`type Tone = 'ok' | 'warn'; const A = ({ tone }: { tone: Tone }) => ${span('{tone}')};`)).toEqual([]);

    // 한글이면 자간을 0 으로 돌려주는 codeOrTextFont 를 펼친 것, createIcon 으로 만든 아이콘
    expect(verdicts(`const A = ({ v }) => <span style={{ fontSize: 12, ...codeOrTextFont(v, ${ONE}) }}>{v}</span>;`)).toEqual([]);
    expect(verdicts(`const Bell = createIcon('bell', null); const A = () => ${span('<Bell /> ISO')};`)).toEqual([]);
    expect(verdicts(`const A = () => ${span('<Bell /> ISO')};`)).toEqual(['unknown']);
  });

  it('기준선의 개수가 실제와 같다(줄었으면 기준선도 줄일 것 · 늘었으면 감쌀 것)', () => {
    const diff: string[] = [];
    for (const [f, exp] of expected) {
      const got = unknown.get(f) ?? 0;
      if (got !== exp) diff.push(`${f}: 기준선 ${exp} → 실제 ${got}`);
    }
    expect(diff, '아래 줄들로 UNKNOWN_BASELINE 을 바꿔 쓸 것:\n' + literal(unknown)).toEqual([]);
  });
});
