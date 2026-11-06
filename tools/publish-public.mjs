// 공개 저장소(lierline/Q-Design-Public)에 올릴 «정본만» 골라 내보낸다(2026-11-06 오너 결정).
//
//   node tools/publish-public.mjs                 → D:/Claude/Q-Design-Public 에 내보내고 훑는다
//   node tools/publish-public.mjs --to=<폴더>     → 다른 폴더로
//   node tools/publish-public.mjs --list          → 내보낼 파일 목록만 찍는다(쓰지 않음)
//
// 무엇을 내보내나(허용 목록 · ALLOW): 규칙 10장과 참고 문서 · 정본 CSS · 토큰 · 팔레트 · 글꼴 · 아이콘 ·
//   앱 뼈대(native) · 도구(tools 최상위) · 정적 견본 3쪽 · phosphor 원본 · package.json.
// 무엇을 빼나(DENY 가 먼저): 제품 코드 사본(source/ · patterns/component-implementations · patterns/foundation 조리법) ·
//   제품 화면 HTML(offline · simulator · native-offline) · 제품 문구(copy-bindings · professional-*-copy · nav · screen ·
//   permission-copy · record-labels) · 회사 문서 양식(brief · mqdoc) · 세션 기록 · 감사 · 검토(reviews) · 견본 fixtures · 화면 사진.
// 이 파일 자신은 내보내지 않는다. 커밋 · 푸시는 사람이 한다(이 도구는 git 을 건드리지 않는다).
//
// 내보낸 뒤 글 파일을 훑어 전화번호 · 사람 이름 · 개인 메일 · NAS 주소 · 토큰 모양이 있으면 멈춘다(종료 코드 8).
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const listOnly = args.includes('--list');
const TO = (args.find((a) => a.startsWith('--to='))?.slice(5)) || 'D:/Claude/Q-Design-Public';

const DENY = [
  /^source\/(?!fonts\/)/,                     // 제품 코드 · 브랜드 · 회사 문서 양식 · 계약 시험(글꼴만 남긴다)
  /^patterns\/component-implementations\//,  // 제품 부품 구현 사본
  /^patterns\/foundation\//,                  // 제품 기반 조리법(설명서 · 메일 · 인쇄 TS, 제품 화면 HTML 포함)
  /^patterns\/professional-.*-copy\.json$/,   // 제품 화면 문구
  /^patterns\/carnet-record-labels\.json$/,
  /^patterns\/copy-rules\.current\.json$/,
  /^patterns\/component-implementations\.json$/, // 제품 부품 파일 목록
  /^dist\/q-design\.(offline|simulator|native-offline|offline-revision)\./,
  /^dist\/q-design\.(copy-bindings|component-implementations|mqdoc|brief|permission-copy|carnet-record-labels)\./,
  /^dist\/q-design\.(nav|screen)\.json$/,     // 차림표 · 화면 목록 JSON 은 제품 구조라 뺀다(CSS 조각은 견본이 읽어 둔다)
  /^dist\/inline-styles-index/,
  /^docs\/SESSION_LOG\.md$/,
  /^docs\/audits\//,
  /^preview\/(fixtures|screens|icons3d|components)\//,
  /^preview\/.*(compare|proposal|board).*\.(html|png)$/,
  /^preview\/workspace\.(html|js)$/,          // 작업대는 fixtures 와 제품 사본을 읽어 공개본에서는 돌지 않는다
  /^reviews\//,
  /^tools\/fixtures\//,
  /^tools\/publish-public\.mjs$/,
  /^tools\/public-readme\.md$/,
  /^README\.md$/,                             // 공개용 README 로 바꿔 쓴다
  /^debug\.log$/,
];
const ALLOW = [
  /^(package\.json|package-lock\.json|\.gitignore|\.gitattributes)$/,
  /^docs\/(0[1-9]|10)-[^/]+\.md$/,
  /^docs\/reference\/[^/]+\.md$/,
  /^patterns\/[^/]+\.(css|ts|tsx|json)$/,
  /^patterns\/native\//,
  /^dist\/q-design\.(tokens|palette|ramp|fonts|mono-fonts|icons|list|workspace|print|state|pull|family|html-palette|email-palette|doc|foundation|native-[a-z-]+|ios-components)\./,
  /^dist\/(icons|react-icons|app-icons|native-launchers|native-components)\//,
  /^dist\/q-design\.(nav|screen)\.css$/,     // 견본이 읽는 CSS 조각만(차림표 · 화면 목록 JSON 은 제품 구조라 뺀다)
  /^source\/fonts\//,
  /^tools\/[^/]+\.(mjs|md|json|ts)$/,
  /^preview\/(index|parts|icons)\.html$/,
  /^preview\/(icons-preview|workspace-preview)\.css$/,
  /^preview\/icons\.js$/,
  /^vendor\/phosphor\//,
];

const tracked = execSync('git ls-files -z', { cwd: ROOT }).toString().split('\0').filter(Boolean).map((f) => f.replace(/\\/g, '/'));
const picked = tracked.filter((f) => !DENY.some((re) => re.test(f)) && ALLOW.some((re) => re.test(f)));
const dropped = tracked.filter((f) => !picked.includes(f));

const byTop = (list) => { const m = {}; for (const f of list) { const k = f.split('/')[0]; m[k] = (m[k] || 0) + 1; } return m; };
console.log('내보낼 파일', picked.length, JSON.stringify(byTop(picked)));
console.log('빼는 파일  ', dropped.length, JSON.stringify(byTop(dropped)));
if (listOnly) { for (const f of picked) console.log(' ', f); process.exit(0); }

// 쓰기: 대상 폴더의 .git 만 남기고 비운 뒤 복사한다
fs.mkdirSync(TO, { recursive: true });
for (const name of fs.readdirSync(TO)) { if (name === '.git') continue; fs.rmSync(path.join(TO, name), { recursive: true, force: true }); }
let bytes = 0;
for (const f of picked) {
  const src = path.join(ROOT, f), dst = path.join(TO, f);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  bytes += fs.statSync(src).size;
}
fs.copyFileSync(path.join(ROOT, 'tools/public-readme.md'), path.join(TO, 'README.md'));
console.log('썼다', TO, '·', (bytes / 1048576).toFixed(1) + 'MB');

// 훑기: 글 파일에서 개인정보 · 비밀값 모양
const TEXT = /\.(md|css|ts|tsx|js|mjs|json|html|txt|xml|swift|tpl|java)$/;
const RULES = [
  ['전화번호', /01[0-9]-\d{3,4}-\d{4}/],
  ['사람 이름', /김병휘|Kayden|SoonWon|순원/],
  ['개인 · 업무 메일', /bhkim@|lierline@|@gmail\.com/],
  ['NAS 주소', /daramtory/],
  ['토큰 · 열쇠 모양', /ghp_[A-Za-z0-9]{20}|github_pat_|sk-[A-Za-z0-9]{20}|eyJ[A-Za-z0-9_-]{30}\.[A-Za-z0-9_-]{10}|AKIA[0-9A-Z]{16}|BEGIN (RSA|OPENSSH|EC) PRIVATE/],
];
const WARN = [['고객 · 거래처 이름', /메디아크|비에스리서치|도프\b|DOF_/]];
const hits = [], warns = [];
for (const f of picked.concat(['README.md'])) {
  if (!TEXT.test(f)) continue;
  const text = fs.readFileSync(path.join(TO, f), 'utf8');
  text.split(/\r?\n/).forEach((line, i) => {
    for (const [name, re] of RULES) if (re.test(line)) hits.push(`${name}  ${f}:${i + 1}  ${line.trim().slice(0, 100)}`);
    for (const [name, re] of WARN) if (re.test(line)) warns.push(`${name}  ${f}:${i + 1}  ${line.trim().slice(0, 100)}`);
  });
}
for (const w of warns) console.log('  주의', w);
if (hits.length) { console.log('멈춤 · 공개하면 안 되는 모양 ' + hits.length + '건:'); for (const h of hits) console.log('  ', h); process.exit(8); }
console.log('훑기 통과 · 전화번호 · 이름 · 개인 메일 · NAS · 토큰 모양 0');
