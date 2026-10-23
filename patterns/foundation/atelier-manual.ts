// Canonical, self-contained manual output recipe. Content and screenshots remain product-owned.
export const MANUAL_CSS = String.raw`
/* ── 팔레트: 앱의 샴페인 골드를 문서용으로 옮긴 것.
      중성색은 순회색이 아니라 골드 쪽으로 살짝 기울여 놓았다. ────────────── */
:root {
  --paper:      #faf7f1;
  --paper-2:    #f2ede3;
  --rule:       #e0d8c8;
  --ink:        #1c1813;
  --ink-2:      #574e40;
  --ink-3:      #857a68;
  --gold:       #97711f;
  --gold-soft:  #f0e6cd;
  --warn:       #96501a;
  --shadow:     0 1px 2px rgba(28,24,19,.06), 0 8px 24px rgba(28,24,19,.05);
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --paper:     #131110;
    --paper-2:   #1c1917;
    --rule:      #302a24;
    --ink:       #ece5d7;
    --ink-2:     #b3a893;
    --ink-3:     #7d7264;
    --gold:      #d7b768;
    --gold-soft: #2a2216;
    --warn:      #e0a06a;
    --shadow:    0 1px 2px rgba(0,0,0,.4), 0 10px 30px rgba(0,0,0,.35);
  }
}
:root[data-theme="dark"] {
  --paper:     #131110;
  --paper-2:   #1c1917;
  --rule:      #302a24;
  --ink:       #ece5d7;
  --ink-2:     #b3a893;
  --ink-3:     #7d7264;
  --gold:      #d7b768;
  --gold-soft: #2a2216;
  --warn:      #e0a06a;
  --shadow:    0 1px 2px rgba(0,0,0,.4), 0 10px 30px rgba(0,0,0,.35);
}

/* ── 글꼴 세 자리 ────────────────────────────────────────────────────────
   🔴 IBM Plex Mono 에는 한글이 없다(실측: 한글 폭이 generic monospace 와 동일).
      그래서 한글 라벨이 전부 시스템 고정폭으로 떨어져 «내가 고르지 않은 세 번째
      글꼴» 이 섞여 있었다. 라벨은 본문과 같은 가족으로 통일하고, 고정폭은 «라틴
      코드·URL» 에만 남긴다. 그 자리에도 한글 대비책을 뒤에 붙여 굴림으로 안 빠지게. */
:root {
  /* 한글 명조를 쓰지 않는다(오너 2026-09-24 「이런 글꼴 쓰지 마」). 제목도 본문과 같은 고딕. */
  --display: "IBM Plex Sans KR", system-ui, -apple-system, "Malgun Gothic", sans-serif;
  --text:    "IBM Plex Sans KR", system-ui, -apple-system, "Malgun Gothic", sans-serif;
  --label:   "IBM Plex Sans KR", system-ui, -apple-system, "Malgun Gothic", sans-serif;
  --code:    "IBM Plex Mono", ui-monospace, Consolas, "IBM Plex Sans KR", monospace;
}

* { box-sizing: border-box; }
/* 🔴 scroll-behavior: smooth 를 쓰지 않는다. 부를 바꿀 때 이동이 애니메이션으로 걸리는데,
   그 사이 목차 자동 스크롤이 끼어들어 이동이 «취소» 된다(실측: 3,632px 아래 절로 가라고
   했는데 0px 에 머무름). 부 전환은 페이지를 새로 여는 것과 같아 즉시 이동이 맞다. */
html { scroll-padding-top: 1.5rem; }

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--text);
  font-weight: 300;
  font-size: 16px;
  line-height: 1.85;
  -webkit-font-smoothing: antialiased;
}

.wrap { display: grid; grid-template-columns: 17rem minmax(0, 1fr); gap: 3rem; max-width: 82rem; margin: 0 auto; padding: 0 1.5rem; }

/* ── 목차 레일 ─────────────────────────────────────────────────────────── */
.rail { position: sticky; top: 0; align-self: start; height: 100vh; height: 100dvh; overflow-y: auto; padding: 2.5rem 0 4rem; border-right: 1px solid var(--rule); display: flex; flex-direction: column; }
.brand { display: flex; align-items: baseline; gap: .6rem; margin-bottom: .35rem; }
.brand b { font-family: var(--display); font-size: 1.35rem; font-weight: 700; letter-spacing: -.01em; }
.brand span { font-family: var(--label); font-size: .7rem; letter-spacing: 0; color: var(--gold); } /* 한글이라 자간 0 (Q-Design) */
.rail > p.sub { margin: 0 0 1.1rem; font-size: .74rem; color: var(--ink-3); font-family: var(--label); letter-spacing: .04em; }

/* 검색: 부가 나뉘어 있어도 «전체» 를 뒤진다 */
.find { position: relative; margin: 0 1rem 1.2rem 0; }
.find input { width: 100%; padding: .45rem .7rem; background: var(--paper-2); border: 1px solid var(--rule); border-radius: 3px; color: var(--ink); font-family: inherit; font-size: .82rem; font-weight: 300; }
.find input::placeholder { color: var(--ink-3); }
.find input:focus { outline: none; border-color: var(--gold); }
.hits { list-style: none; margin: .5rem 0 0; padding: 0; max-height: 20rem; overflow-y: auto; border-left: 2px solid var(--gold); }
.hits li { margin: 0; }
.hits a { display: block; padding: .3rem .7rem; text-decoration: none; font-size: .78rem; line-height: 1.45; color: var(--ink-2); }
.hits a:hover, .hits a:focus-visible { background: var(--gold-soft); color: var(--gold); outline: none; }
.hits .where { display: block; font-family: var(--label); font-size: .62rem; letter-spacing: .05em; color: var(--ink-3); text-transform: uppercase; }
.hits .none { padding: .3rem .7rem; font-size: .78rem; color: var(--ink-3); }

.rail nav { display: flex; flex-direction: column; }
.rail nav a { text-decoration: none; color: var(--ink-2); padding: .22rem 1.1rem .22rem 0; font-size: .82rem; line-height: 1.5; border-left: 2px solid transparent; }
.rail nav a.l1 { font-family: var(--display); font-weight: 700; font-size: .95rem; color: var(--ink); margin-top: 1.15rem; padding-left: .7rem; }
.rail nav a.l2 { padding-left: .7rem; }
.rail nav a.l3 { padding-left: 1.6rem; font-size: .77rem; color: var(--ink-3); }
.rail nav a:hover { color: var(--gold); }
.rail nav a.on { color: var(--gold); border-left-color: var(--gold); background: var(--gold-soft); }
.rail nav a.l1.here { color: var(--gold); }
/* 지금 보고 있는 부의 장·절만 편다: 69줄을 늘 펼쳐 두면 아무것도 안 보인다 */
.rail nav a.l2, .rail nav a.l3 { display: none; }
.rail nav a.l2.inpart, .rail nav a.l3.inpart { display: block; }
body.all .rail nav a.l2, body.all .rail nav a.l3 { display: block; }

.tools { margin-top: auto; padding-top: 2rem; display: flex; gap: .5rem; flex-wrap: wrap; }
.tools button { background: none; border: 1px solid var(--rule); color: var(--ink-2); font-family: var(--label); font-size: .66rem; letter-spacing: .05em; text-transform: uppercase; padding: .35rem .7rem; cursor: pointer; border-radius: 2px; }
.tools button:hover { border-color: var(--gold); color: var(--gold); }
.tools button[aria-pressed="true"] { border-color: var(--gold); color: var(--gold); background: var(--gold-soft); }
a:focus-visible, button:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; border-radius: 2px; }

/* ── 본문 ─────────────────────────────────────────────────────────────── */
main { padding: 3.5rem 0 8rem; min-width: 0; max-width: 60rem; }
section.part { display: none; }
section.part.show { display: block; }
body.all section.part { display: block; }

h1, h2, h3, h4 { font-family: var(--display); font-weight: 700; text-wrap: balance; line-height: 1.35; color: var(--ink); }
h1 { font-size: clamp(1.9rem, 4vw, 2.6rem); margin: 0 0 1.6rem; letter-spacing: -.02em; }
h2 { font-size: 1.75rem; margin: 3.6rem 0 1rem; padding-top: 1.6rem; border-top: 1px solid var(--rule); }
section.part > h2:first-of-type { margin-top: 0; padding-top: 0; border-top: 0; }
h3 { font-size: 1.22rem; margin: 2.6rem 0 .7rem; }
h4 { font-size: 1rem; margin: 1.8rem 0 .5rem; font-family: var(--text); font-weight: 600; color: var(--ink-2); }

p { margin: 0 0 1.05rem; max-width: 42em; }
ul { margin: 0 0 1.2rem; padding-left: 1.1rem; max-width: 42em; }
li { margin-bottom: .35rem; }
li::marker { color: var(--gold); }
strong { font-weight: 600; color: var(--ink); }
code { font-family: var(--code); font-size: .86em; background: var(--paper-2); padding: .1em .35em; border-radius: 2px; color: var(--ink-2); }

/* 부 사이 이동 */
.pager { display: flex; justify-content: space-between; gap: 1rem; margin: 5rem 0 0; padding-top: 1.6rem; border-top: 1px solid var(--rule); }
.pager a { text-decoration: none; color: var(--ink-2); font-size: .85rem; line-height: 1.5; max-width: 45%; }
.pager a:hover { color: var(--gold); }
.pager a.next { text-align: right; margin-left: auto; }
.pager .lbl { display: block; font-family: var(--label); font-size: .62rem; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-3); }
body.all .pager { display: none; }

/* 화면 녹화 */
figure.shot { margin: 1.8rem 0 2.4rem; }
figure.shot .play { display: block; position: relative; width: 100%; padding: 0; border: 0; background: none; cursor: pointer; }
figure.shot img { display: block; width: 100%; height: auto; border: 1px solid var(--rule); border-radius: 3px; background: var(--paper-2); box-shadow: var(--shadow); }
figure.shot .cue { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display: inline-flex; align-items: center; gap: .5rem; padding: .5rem 1.1rem; background: var(--paper); color: var(--ink); border: 1px solid var(--gold); border-radius: 999px; font-family: var(--label); font-size: .72rem; letter-spacing: .06em; text-transform: uppercase; box-shadow: var(--shadow); }
figure.shot .tri { width: 0; height: 0; border-left: 8px solid var(--gold); border-top: 5px solid transparent; border-bottom: 5px solid transparent; }
figure.shot .play:hover .cue { background: var(--gold); color: var(--paper); }
figure.shot .play:hover .tri { border-left-color: var(--paper); }
figure.shot .play.on .cue { display: none; }
figure.shot .play.busy .cue::after { content: '\00a0불러오는 중'; }
figure.shot .play.busy .tri { animation: pulse 1s ease-in-out infinite; }
figure.shot .play.failed .cue { border-color: var(--warn); color: var(--warn); }
figure.shot .play.failed .cue::after { content: '\00a0열 수 없음'; }
@keyframes pulse { 50% { opacity: .25; } }
@media (prefers-reduced-motion: reduce) { figure.shot .play.busy .tri { animation: none; } }
figure.shot figcaption { margin-top: .6rem; font-size: .82rem; color: var(--ink-3); line-height: 1.6; padding-left: .8rem; border-left: 2px solid var(--gold); }

/* 안내 상자 */
aside { margin: 1.4rem 0; padding: .85rem 1.1rem; font-size: .88rem; line-height: 1.7; border-radius: 3px; max-width: 44em; }
aside.tip  { background: var(--paper-2); border-left: 3px solid var(--gold); }
aside.warn { background: var(--paper-2); border-left: 3px solid var(--warn); color: var(--ink-2); }

/* ISO 조항 칩 */
p.iso { font-family: var(--label); font-size: .68rem; letter-spacing: .06em; text-transform: uppercase; color: var(--gold); margin: -.3rem 0 1rem; }

/* 표 */
.scroll { overflow-x: auto; margin: 1.3rem 0 1.6rem; border: 1px solid var(--rule); border-radius: 3px; }
table { border-collapse: collapse; width: 100%; font-size: .85rem; font-variant-numeric: tabular-nums; }
th, td { padding: .5rem .75rem; text-align: left; border-bottom: 1px solid var(--rule); vertical-align: top; }
thead th { background: var(--paper-2); font-family: var(--label); font-size: .72rem; letter-spacing: .05em; text-transform: uppercase; color: var(--ink-2); font-weight: 500; white-space: nowrap; position: sticky; top: 0; }
tbody tr:last-child th, tbody tr:last-child td { border-bottom: 0; }
table.matrix td { text-align: center; width: 3.4rem; }
table.matrix td.y { color: var(--gold); font-weight: 600; }
table.matrix td.n { color: var(--rule); }
/* 좁은 화면에서 표를 옆으로 밀어도 «어느 메뉴 줄인지» 는 남아 있어야 한다.
   메뉴 이름 칸을 왼쪽에 고정한다(모바일 375px 에서 표가 685px 다). */
table.matrix th.mn { font-weight: 400; white-space: nowrap; position: sticky; left: 0; z-index: 1; background: var(--paper); }
table.matrix tbody tr:hover th.mn { background: var(--paper); }
table.matrix th.mn .url { display: block; font-family: var(--code); font-size: .66rem; color: var(--ink-3); }
/* 🔴 그룹 띠가 «가운데 정렬» 이라 좁은 화면에서 글자가 스크롤 밖으로 밀려
   빈 띠처럼 보였다(table.matrix td 의 center 가 여기까지 걸렸다). 왼쪽에 고정한다. */
tr.grp td { text-align: left; background: var(--gold-soft); font-family: var(--label); font-size: .68rem; letter-spacing: .06em; text-transform: uppercase; color: var(--gold); }
tr.grp td span { position: sticky; left: .75rem; display: inline-block; }
table.kv th { font-weight: 500; white-space: nowrap; }
tr.big th { color: var(--warn); }
p.note { font-size: .78rem; color: var(--ink-3); margin: -.9rem 0 1.6rem; }
p.note.warn { color: var(--warn); }

@media (max-width: 900px) {
  .wrap { grid-template-columns: 1fr; gap: 0; }
  .rail { position: static; height: auto; border-right: 0; border-bottom: 1px solid var(--rule); padding-bottom: 1.5rem; }
  .rail nav { max-height: 13rem; overflow-y: auto; }
  main { padding-top: 2rem; }
  .tools { margin-top: 1.2rem; }
}

/* 인쇄: 부를 나누지 않고 전부 편다 */
@media print {
  .rail, .pager { display: none; }
  .wrap { display: block; max-width: none; padding: 0; }
  main { max-width: none; padding: 0; }
  section.part { display: block; page-break-before: always; }
  section.part:first-of-type { page-break-before: avoid; }
  figure.shot .cue { display: none; }
}

/* ── 배포본 워터마크 ─────────────────────────────────────────────────────
   앱에서 내려받을 때 «누가 받았는지» 를 서버가 자리표시자에 채워 넣는다.
   ⚠️ 이것은 «가벼운 억지력» 이지 보호 장치가 아니다. HTML 은 열어서 지울 수 있다.
      추적의 근거는 워터마크가 아니라 서버의 감사 기록이다. */
.wm-bar { position: sticky; top: 0; z-index: 50; background: var(--gold-soft);
  color: var(--ink-2); border-bottom: 1px solid var(--gold);
  padding: .5rem 1.5rem; font-size: .76rem; line-height: 1.6; }
.wm-bar b { color: var(--ink); }
.wm-tile { position: fixed; inset: 0; z-index: 40; pointer-events: none;
  opacity: .05; background-repeat: repeat; }
@media print { .wm-tile { opacity: .1; } .wm-bar { position: static; } }
`;

export function applyManualStyles(html: string): string {
  const blocks = html.match(/<style>[\s\S]*?<\/style>/g);
  if (blocks?.length !== 1) throw new Error("Expected one manual stylesheet");
  const eol = blocks[0].includes('\r\n') ? '\r\n' : '\n';
  const css = MANUAL_CSS.replace(/\r?\n/g, eol);
  return html.replace(/<style>[\s\S]*?<\/style>/, () => `<style>${css}</style>`);
}
