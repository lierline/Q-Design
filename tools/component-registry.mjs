// Component contract audit. This tool only writes artifacts inside Q-Design.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { PARTS } from './sync-parts.mjs';
import { scanProduct, digest, exportedPublicCoverage } from '../source/component-registry-core.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WORKSPACE = process.env.QD_WORKSPACE || resolve(ROOT, '..');
const typescript = createRequire(join(WORKSPACE, 'Q-Atelier/package.json'))('typescript');
const products = [
  { id: 'atelier', label: 'Q-Atelier', repo: 'Q-Atelier', syncKey: 'Q-Atelier' },
  { id: 'maison', label: 'Q-Maison', repo: 'Q-Works', syncKey: 'Q-Works' },
  { id: 'carnet', label: 'Q-Carnet', repo: 'DHR', syncKey: 'Q-Forge' },
];
const args = new Set(process.argv.slice(2));
const write = args.has('--write');
if ([...args].some(arg => !['--write', '--check'].includes(arg)) || write && args.has('--check')) throw new Error('Use --write or --check. Product code is never written.');
const catalog = JSON.parse(readFileSync(join(ROOT, 'source/component-rules.json'), 'utf8'));
const roles = JSON.parse(readFileSync(join(ROOT, 'source/component-roles.json'), 'utf8'));
const publicApi = JSON.parse(readFileSync(join(ROOT, 'source/component-public-api.json'), 'utf8'));
const failures = [];
if (publicApi.version !== 1 || !Array.isArray(publicApi.products) || publicApi.products.length !== products.length || new Set(publicApi.products.map(scope => scope.id)).size !== products.length || publicApi.products.some(scope => !products.some(product => product.id === scope.id))) throw new Error('Public API scope must explicitly list each audited product exactly once.');
const result = { schemaVersion: 1, scope: 'Live working trees: non-test TSX/JSX, render-bearing TS/JS and CSS under app/components/lib/src. Static evidence, not rendered compliance.', catalog, roles, publicApi, products: [] };
const json = value => JSON.stringify(value, null, 2) + '\n';
const portable = path => path.replaceAll('\\', '/');
const emit = (path, value) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, value, 'utf8'); };
const body = (text, lang) => {
  text = text.replaceAll('\r\n', '\n');
  const mark = text.indexOf('q-design-nav-sha256:');
  if (mark < 0) return null;
  if (lang === 'html') {
    const end = text.indexOf('-->', mark);
    return end < 0 ? null : text.slice(end + 3).replace(/^\n/, '');
  }
  if (lang === 'ts') {
    const end = text.indexOf('// q-design-header-end');
    return end < 0 ? null : text.slice(text.indexOf('\n', end) + 1).replace(/^\n/, '');
  }
  const end = text.indexOf('*/', mark);
  return end < 0 ? null : text.slice(end + 2).replace(/^\n/, '');
};

for (const product of products) {
  const root = join(WORKSPACE, product.repo);
  if (!existsSync(join(root, 'package.json'))) throw new Error(`Product checkout missing: ${root}`);
  const scan = scanProduct(root, catalog, { typescript });
  const publicCoverage = exportedPublicCoverage(scan, roles, publicApi.products.find(scope => scope.id === product.id), product.id);
  failures.push(...publicCoverage.failures);
  const copies = [];
  for (const part of PARTS) {
    const destination = part.to[product.syncKey];
    if (!destination) continue;
    const marker = `/${product.repo}/`;
    const normalized = portable(destination);
    if (!normalized.includes(marker)) throw new Error(`Unexpected destination: ${destination}`);
    const path = normalized.slice(normalized.indexOf(marker) + marker.length);
    const file = join(root, path);
    let source = readFileSync(join(ROOT, part.src), 'utf8').replaceAll('\r\n', '\n');
    if (part.lang !== 'ts' && part.layer !== false) source = `@layer components {\n${source}}\n`;
    const text = existsSync(file) ? readFileSync(file, 'utf8') : null;
    const content = text === null ? null : body(text, part.lang);
    const matches = content !== null && digest(content) === digest(source);
    const runtime = /\.(?:tsx|css)$/.test(path);
    copies.push({ name: part.name, source: part.src, path, runtime, matches, reachable: scan.reachable.has(path) });
    if (!write && !matches) failures.push(`${product.label}: ${path} differs from Q-Design/${part.src}`);
    if (!write && runtime && !scan.reachable.has(path)) failures.push(`${product.label}: ${path} has no import path from an app entrypoint`);
  }
  const copyPaths = new Set(copies.filter(copy => copy.runtime).map(copy => copy.path));
  const reachesCanon = start => {
    const visited = new Set();
    const walk = path => {
      if (visited.has(path)) return false;
      visited.add(path);
      if (copyPaths.has(path)) return true;
      return (scan.modules.get(path)?.imports ?? []).some(walk);
    };
    return walk(start);
  };
  const mapped = new Map();
  for (const role of roles.roles) for (const implementation of role.implementations.filter(item => item.product === product.id)) {
    const file = scan.files.find(item => item.path === implementation.file);
    if (!file) { failures.push(`${product.label}: role ${role.id} file missing ${implementation.file}`); continue; }
    for (const symbol of implementation.symbols) {
      if (!file.components.some(component => component.name === symbol)) failures.push(`${product.label}: role ${role.id} component missing ${implementation.file}#${symbol}`);
      const key = `${implementation.file}#${symbol}`;
      mapped.set(key, [...(mapped.get(key) ?? []), role.id]);
    }
    if (!implementation.symbols.length && !implementation.selectors?.length) failures.push(`${product.label}: role ${role.id} has no symbol or selector`);
    for (const selector of implementation.selectors ?? []) {
      const code = readFileSync(join(root, implementation.file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      if (!code.includes(selector)) failures.push(`${product.label}: role ${role.id} selector missing ${selector}`);
    }
  }
  for (const file of scan.files) {
    file.owner = copyPaths.has(file.path) ? 'q-design' : 'product';
    file.evidence = copyPaths.has(file.path) ? 'canonical-copy' : file.classes.some(name => name.startsWith('qd-')) ? 'qd-class-reference' : reachesCanon(file.path) ? 'imports-canonical-module' : 'product-local';
    for (const component of file.components) component.roles = mapped.get(`${file.path}#${component.name}`) ?? [];
    file.reviewScope = file.kind === 'generated-icon' ? 'generated-icon' : file.components.some(component => component.roles.length) ? 'role-mapped' : 'product-composition-or-review-candidate';
  }
  const summary = {
    modules: scan.files.length,
    components: scan.files.reduce((sum, file) => sum + file.components.length, 0),
    iconModules: scan.files.filter(file => file.kind === 'generated-icon').length,
    roleMappedComponents: scan.files.reduce((sum, file) => sum + file.components.filter(component => component.roles.length).length, 0),
    canonicalCopies: copies.length,
    qdClassModules: scan.files.filter(file => file.evidence === 'qd-class-reference').length,
    productLocalModules: scan.files.filter(file => file.evidence === 'product-local').length,
  };
  result.products.push({ ...product, summary, publicCoverage, copies, files: scan.files });
  console.log(`${product.label}: ${summary.modules} modules, ${summary.components} declarations, ${summary.roleMappedComponents} role-mapped, ${publicCoverage.mapped}/${publicCoverage.required} scoped public renderers registered, ${summary.canonicalCopies} canonical copies.`);
}

const lines = [
  '# 세 제품 전체 UI 코드 목록', '',
  '`node tools/component-registry.mjs --write`로 생성합니다. 실제 작업 폴더를 읽으며 제품 코드는 변경하지 않습니다.', '',
  '공용 부품의 역할표는 [29번 기록부](29-component-registry.md), 규칙 원본은 [component-rules.json](../source/component-rules.json), 운영 방법은 [30번 문서](30-component-governance.md)입니다.', '',
  '이 목록은 정적 코드 목록입니다. 역할표에 등록한 부품 외의 분류는 이름과 경로에서 추론합니다. 전체 부품의 규칙 준수나 공통화 완료를 뜻하지 않습니다. 업무 부품의 디자인 검토와 실제 렌더링 확인은 남아 있습니다.', '',
  '| 제품 | UI 모듈·스타일 | 컴포넌트 선언 | 생성 아이콘 모듈 | 역할 등록 부품 | 배포 조각 | qd 클래스 참조 모듈 | 공통 연결 근거 없는 모듈 |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...result.products.map(p => `| ${p.label} | ${p.summary.modules} | ${p.summary.components} | ${p.summary.iconModules} | ${p.summary.roleMappedComponents} | ${p.summary.canonicalCopies} | ${p.summary.qdClassModules} | ${p.summary.productLocalModules} |`), '',
  '선언 수에는 함수, 래퍼, 별칭과 파일 내부 부품이 포함됩니다. 파일별 상세 클래스, CSS 변수, 원시 컨트롤, 인라인 스타일 수, import 경로는 [JSON 목록](../dist/q-design.components.json)에 있습니다.', '',
  '연결 표기의 뜻: `canonical-copy`는 원본과 대조하는 배포 파일, `qd-class-reference`는 공통 클래스 이름 참조, `imports-canonical-module`은 공통 파일로 이어지는 import, `product-local`은 이 두 근거가 없는 제품 소유 파일입니다. 전역 CSS 상속이나 아뜰리에 자체 토큰 사용도 마지막 범주일 수 있습니다. 스타일 위반 판정이 아닙니다. import 경로는 앱 진입점 중 하나에 연결됐다는 뜻이며 모든 화면에서 실행된다는 뜻은 아닙니다.', '',
];
for (const product of result.products) {
  lines.push(`## ${product.label}`, '', '| 파일 | 컴포넌트와 규칙 분류 | 연결 근거 |', '| --- | --- | --- |');
  for (const file of product.files) {
    const names = file.components.map(c => `\`${c.name}\` (${c.roles.length ? c.roles.join(', ') : c.family + ', 추론'})`).join(', ') || (file.kind === 'stylesheet' ? '스타일 기반 규칙' : '모듈 단위 검토');
    lines.push(`| [${file.path}](../../${product.repo}/${encodeURI(file.path)}) | ${names} | ${file.evidence} |`);
  }
  lines.push('');
}
const statuses = { 'css-canon': 'CSS 정본', pattern: '패턴', none: '정본 없음', 'product-only': '제품 전용' };
const roleLines = [
  '# 세 제품 공용 컴포넌트 역할표', '',
  '`source/component-roles.json`에서 자동 생성합니다. 역할별 실제 구현, 공통 원본과 제품 차이를 함께 관리합니다.', '',
  '[전체 코드 목록](31-component-inventory.md), [운영 규칙](30-component-governance.md), [규칙 카탈로그](../source/component-rules.json)을 함께 확인합니다. CSS 정본은 기본 외형을 공유한다는 뜻이며 모든 업무 조합과 런타임 동작의 일치를 뜻하지 않습니다.', '',
  '[공개 부품 검사 범위](../source/component-public-api.json)에 속한 export는 수동 역할 등록이 필요합니다. 새 파일·새 export의 누락은 목록 재생성으로 통과할 수 없습니다. 파일 내부 보조 함수는 전수 목록에 남기되 공개 부품 등록을 강제하지 않습니다.', '',
  '| 역할 | Q-Atelier | Q-Maison | Q-Carnet | 정본 상태와 근거 | 제품 차이 |',
  '| --- | --- | --- | --- | --- | --- |',
];
for (const role of roles.roles) {
  const cells = products.map(product => role.implementations.filter(item => item.product === product.id).map(item => `${[...item.symbols, ...(item.selectors ?? [])].map(name => '`' + name + '`').join(' · ')} <br> [${item.file}](../../${product.repo}/${encodeURI(item.file)})`).join('<br>') || '공용 래퍼 미등록');
  roleLines.push(`| ${role.label} | ${cells.join(' | ')} | ${statuses[role.canon.status]}<br>${role.canon.evidence.map(path => `[${path}](../${path})`).join('<br>')} | ${role.differences.replaceAll('|', '\\|')} |`);
}
roleLines.push('', '미등록은 해당 제품에 대응하는 공용 래퍼가 등록되지 않았다는 뜻입니다. 화면의 네이티브 구현이 없다는 뜻이 아닙니다. 제품 전용 조합도 규칙 계열과 코드 목록의 검사 대상입니다.', '');
const outputs = { 'dist/q-design.components.json': json(result), 'docs/31-component-inventory.md': lines.join('\n') + '\n', 'docs/29-component-registry.md': roleLines.join('\n') };
if (!failures.length) for (const [path, text] of Object.entries(outputs)) {
  if (write) emit(join(ROOT, path), text);
  else if (!existsSync(join(ROOT, path)) || readFileSync(join(ROOT, path), 'utf8').replaceAll('\r\n', '\n') !== text) failures.push(`Outdated inventory: ${path}. Review component additions/removals and update the manual role registry before regenerating.`);
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(write ? 'Q-Design registry artifacts generated. Product files unchanged.' : 'Registry, registered symbols, canonical copies and import paths verified.');
