import { HTML_STYLE, EXPORT_STYLE } from '@/lib/design/q-design-html';
// =============================================================================
// lib/export/org-export.ts: 조직이 «자기 데이터를 통째로» 내려받는다 (★서버 전용)
// =============================================================================
// 오빠 결정(2026-09-03). 설계: docs/specs/2026-09-03-org-manual-export.md
//
// ── 규제 근거 ──────────────────────────────────────────────────────────────
//   ISO 13485 §4.2.5   기록은 보관되고 **검색 가능**해야 한다
//   21 CFR Part 11 §11.10(b)  기록을 **사람이 읽을 수 있는 형태와 전자적 사본**
//                             으로 낼 수 있어야 한다  ← 둘 «다» 다
//   개인정보보호법 / GDPR Art.20  데이터 이동권
//
// 🔑 §11.10(b) 가 「사람이 읽을 수 있는」과 「전자적 사본」을 **둘 다** 요구한다는 점이
//    이 모듈의 형태를 정한다. NDJSON 만 든 ZIP 은 앞의 절반을 못 채운다. 그래서
//    `README.html` 을 함께 넣는다. 그 한 장이 이 기능의 절반이다.
//
// ── 범위를 «손으로 적지 않는다» ────────────────────────────────────────────
// 담을 표 목록을 코드에 적으면 새 표가 생길 때 조용히 빠지고, 고객은 «없는 줄도
// 모르고» 받아 간다. `export_org_scoped_tables()` 가 org_id 를 가진 표를 전부
// 돌려주고, 여기서는 **뺄 것만** 이유와 함께 적는다.
//
// ── 파일은 «행에서» 모은다 ─────────────────────────────────────────────────
// 🔴 실측: 스토리지 경로가 조직으로 일관되게 나뉘어 있지 «않다». 같은 버킷에
//    org_id 로 시작하는 것, 평가 id 로 시작하는 것, 'medqraft-default' 같은 고정
//    접두어가 섞여 있다. 그래서 접두어로 고르는 방법은 성립하지 않는다.
//    대신 내보낸 행에서 경로를 모아 `export_resolve_files()` 로 버킷을 찾는다.
//    이쪽이 더 정확하다: 담긴 파일이 담긴 행과 «반드시» 짝이 맞는다.

import PizZip from 'pizzip';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchAllPages } from '@/lib/supabase/fetch-all-pages';
import { AUDIT_RETENTION_YEARS } from '@/lib/audit/retention';

/** 한 쪽 크기. PostgREST 상한과 같다. */
const PAGE = 1000;

/**
 * 한 번에 내보낼 수 있는 상한. 넘으면 **시끄럽게 실패한다.**
 *
 * 🔑 상한이 없으면 조직이 커졌을 때 함수가 메모리에서 죽거나 타임아웃이 난다.
 *    그러면 사용자는 「내보내기가 안 된다」만 보고 이유를 모른다. 넘으면 그 사실을
 *    말해 줘야 그때 나눠 받는 기능을 만들지 판단할 수 있다.
 *    (PizZip 은 스트리밍이 아니라 메모리에서 ZIP 을 만든다. 이 상한의 근거다.)
 */
export const MAX_ROWS = 200_000;
export const MAX_BYTES = 150 * 1024 * 1024;

/** 왜 뺐는지를 «타입으로» 강제한다. 이유 없는 제외는 다음 사람에게 사고로 돌아온다. */
interface Exclusion {
  readonly table: string;
  readonly why: string;
}

export const EXCLUDED_TABLES: readonly Exclusion[] = [
  {
    table: 'export_jobs',
    why: '내보내기 «작업 기록» 자체. 데이터가 아니라 이 기능의 부산물이라 뺀다. 누가 언제 받아 갔는지는 감사로그에 남는다.',
  },
  {
    table: 'org_vault_recovery',
    why: '🔴 영지식 금고의 비상 분할 열쇠 조각. **한 ZIP 에 모으면 그 파일 하나로 금고가 열려 M-of-N 분산이 무의미해진다.** 담으면 안 되는 유일한 조직 데이터다.',
  },
  {
    table: 'push_subscriptions',
    why: '브라우저 푸시 엔드포인트 · 안드로이드 앱 알림 토큰. 기기별 임시 자격증명이라 기록 가치가 없고, 다른 곳에 옮기면 오히려 위험하다.',
  },
  {
    table: 'active_sessions',
    why: '로그인 세션. 운영 데이터이지 품질 기록이 아니다.',
  },
];

export interface ExportedTable {
  table: string;
  rows: number;
}

export interface MissingFile {
  table: string;
  column: string;
  path: string;
}

export interface ExportScope {
  tables: ExportedTable[];
  excluded: Exclusion[];
  files: { bucket: string; path: string; bytes: number | null }[];
  /** 🔑 행은 있는데 스토리지에 파일이 없는 것. DR 런북의 고아 점검을 내보낼 때마다 한다. */
  missingFiles: MissingFile[];
}

export interface ExportWindow {
  dbStartedAt: string;
  dbEndedAt: string;
  filesStartedAt: string;
  filesEndedAt: string;
}

export interface OrgExportResult {
  zip: Buffer;
  scope: ExportScope;
  stats: { tables: number; rows: number; files: number; bytes: number };
  window: ExportWindow;
}

export interface OrgExportMeta {
  orgName: string;
  requesterName: string;
  requesterEmail: string;
}

/** 파일 경로가 담긴 컬럼인가. 이름 규칙으로 판별한다(스키마를 손으로 안 적기 위해). */
function isPathColumn(name: string): boolean {
  return (
    name.endsWith('storage_path') ||
    name.endsWith('file_path') ||
    name === 'attachment_path' ||
    name === 'path'
  );
}

/** HTML 로 넣을 값. 고객 데이터가 그대로 들어가므로 반드시 이스케이프한다. */
function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * 사람이 먼저 여는 한 장. **이것이 §11.10(b) 의 「사람이 읽을 수 있는 형태」다.**
 *
 * 🔑 무엇이 들었는지만 적지 않는다. **무엇이 빠졌는지와 왜 빠졌는지**를 함께 적는다.
 *    특히 금고 파일이 암호문이라는 사실을 숨기면, 고객은 「받아 뒀다」고 믿다가
 *    필요한 날 못 연다.
 */
export function renderReadme(
  meta: OrgExportMeta,
  scope: ExportScope,
  win: ExportWindow,
  stats: OrgExportResult['stats'],
): string {
  const withRows = scope.tables.filter((t) => t.rows > 0).sort((a, b) => b.rows - a.rows);
  const empty = scope.tables.filter((t) => t.rows === 0);

  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<title>${esc(meta.orgName)} 데이터 내보내기</title>
<style>${EXPORT_STYLE}</style></head><body>

<h1>${esc(meta.orgName)} 데이터 내보내기</h1>
<p class="sub">
  받은 사람: ${esc(meta.requesterName)} (${esc(meta.requesterEmail)}) ·
  만든 시각: ${esc(win.dbStartedAt)}
</p>

<div class="note">
  <b>이 파일 묶음은 무엇입니까</b><br>
  ${esc(meta.orgName)} 조직이 Q-Atelier 에 쌓은 기록 전부입니다.
  표 <b>${stats.tables}개</b> · 행 <b>${stats.rows.toLocaleString()}개</b> ·
  첨부 파일 <b>${stats.files}개</b> (${fmtBytes(stats.bytes)}).
  ISO 13485 §4.2.5 와 21 CFR Part 11 §11.10(b) 가 요구하는 «기록의 검색 가능성»에
  답하는 사본입니다.
</div>

<h2>어떻게 읽습니까</h2>
<ul>
  <li><code>data/</code> 안의 <code>.ndjson</code> 은 <b>한 줄이 한 건</b>입니다.
      엑셀로 열려면 JSON 변환 도구가 필요하고, 그대로도 텍스트 편집기로 읽힙니다.</li>
  <li><code>files/</code> 는 업로드했던 문서 원본입니다. 버킷별 폴더 아래
      원래 경로 그대로 들어 있습니다.</li>
  <li><code>manifest.json</code> 에 표별 건수와 만든 시각이 들어 있습니다.</li>
</ul>

<h2>담긴 기록 (건수 있는 표 ${withRows.length}개)</h2>
<table><thead><tr><th>표</th><th class="n">건수</th></tr></thead><tbody>
${withRows.map((t) => `<tr><td><code>${esc(t.table)}</code></td><td class="n">${t.rows.toLocaleString()}</td></tr>`).join('\n')}
</tbody></table>
${empty.length ? `<p class="sub">비어 있는 표 ${empty.length}개도 <code>data/</code> 에 빈 파일로 들어 있습니다. «없다»와 «안 담았다»를 구별하기 위해서입니다.</p>` : ''}

<h2>⚠️ 빠진 것과 그 이유</h2>
<table><thead><tr><th>빠진 것</th><th>이유</th></tr></thead><tbody>
${scope.excluded.map((e) => `<tr><td><code>${esc(e.table)}</code></td><td>${esc(e.why)}</td></tr>`).join('\n')}
<tr><td>계정 정보(비밀번호 등)</td><td>Q-Atelier 가 보관하지 않습니다. 인증 시스템이 따로 가지고 있습니다.</td></tr>
<tr><td>결제 수단</td><td>결제사가 보관합니다. 저희는 카드번호를 갖고 있지 않습니다.</td></tr>
</tbody></table>

<div class="warn">
  <b>🔐 영지식 금고를 쓰신다면 꼭 읽어 주십시오</b><br>
  금고를 켠 조직의 파일은 <b>암호문 그대로</b> 들어 있습니다. Q-Atelier 서버는 그 파일의
  평문을 한 번도 가진 적이 없어서, 서버가 만드는 이 묶음에도 평문을 넣을 수 없습니다.
  <b>조직 금고 열쇠가 있어야 열립니다.</b> 열쇠를 잃으면 이 백업으로도 열지 못합니다.
</div>

${
  scope.missingFiles.length
    ? `<h2>🔴 기록은 있는데 파일이 없는 항목 ${scope.missingFiles.length}건</h2>
<p>아래 항목은 데이터베이스에 «첨부가 있다»고 적혀 있는데 실제 파일을 찾지 못했습니다.
확인이 필요합니다. 지원팀에 이 목록을 보내 주십시오.</p>
<table><thead><tr><th>표</th><th>컬럼</th><th>경로</th></tr></thead><tbody>
${scope.missingFiles.slice(0, 50).map((m) => `<tr><td><code>${esc(m.table)}</code></td><td><code>${esc(m.column)}</code></td><td><code>${esc(m.path)}</code></td></tr>`).join('\n')}
</tbody></table>`
    : '<h2>파일 점검</h2><p>기록에 적힌 첨부가 <b>전부 확인됐습니다.</b> 누락 0건.</p>'
}

<h2>이 묶음의 «시각»에 대하여</h2>
<p>
  데이터베이스와 파일 저장소는 서로 다른 시스템이라 <b>한 순간을 동시에 찍을 수 없습니다.</b>
  이 묶음은 아래 두 구간에 걸쳐 만들어졌습니다.
</p>
<table><tbody>
<tr><th>기록(행) 수집</th><td>${esc(win.dbStartedAt)} ~ ${esc(win.dbEndedAt)}</td></tr>
<tr><th>파일 수집</th><td>${esc(win.filesStartedAt)} ~ ${esc(win.filesEndedAt)}</td></tr>
</tbody></table>
<p class="sub">그 사이에 생긴 변경은 어느 한쪽에만 담겨 있을 수 있습니다.</p>

<h2>보존에 대하여</h2>
<p>
  Q-Atelier 는 감사추적(<code>audit_logs</code>)을 <b>${AUDIT_RETENTION_YEARS}년</b> 보존하며,
  그 기간 안에는 관리자도 삭제할 수 없도록 데이터베이스가 막고 있습니다.
  이 묶음에도 같은 기록이 들어 있습니다.
</p>

<hr style="${HTML_STYLE.divider}">
<p class="sub">Q-Atelier · MedQraft</p>
</body></html>`;
}

/**
 * 조직 데이터를 ZIP 하나로 만든다.
 *
 * `admin` 은 service_role 클라이언트여야 한다. RLS 를 지나치므로 **호출 측에서
 * 오너 자격을 이미 확인했어야 한다.**
 */
export async function buildOrgExport(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: SupabaseClient<any, any, any>,
  orgId: string,
  meta: OrgExportMeta,
): Promise<OrgExportResult> {
  const zip = new PizZip();
  const dbStartedAt = new Date().toISOString();

  // ── ① 범위: DB 에서 파생 ─────────────────────────────────────────────────
  const { data: allTables, error: tblErr } = await admin.rpc('export_org_scoped_tables');
  if (tblErr) throw new Error(`내보내기 범위 조회 실패: ${tblErr.message}`);

  const excludedNames = new Set(EXCLUDED_TABLES.map((e) => e.table));
  const targets = ((allTables ?? []) as { table_name: string }[])
    .map((t) => t.table_name)
    .filter((name) => !excludedNames.has(name));

  // ── ② 행 수집 ────────────────────────────────────────────────────────────
  const tables: ExportedTable[] = [];
  const pathHits: MissingFile[] = [];
  let totalRows = 0;

  for (const table of targets) {
    const rows = await fetchAllPages<Record<string, unknown>>(
      (from, to) =>
        admin
          .from(table)
          .select('*')
          .eq('org_id', orgId)
          .order('id', { ascending: true })
          .range(from, to),
      { label: `org-export/${table}`, uniqueOrderKey: 'id' },
    ).catch(async (e) => {
      // id 가 없는 표는 정렬 없이 한 쪽만 받는다. «조용히 자르지 않고» 표시한다.
      if (!/column .* does not exist|42703/.test(String(e))) throw e;
      const { data, error } = await admin.from(table).select('*').eq('org_id', orgId).range(0, PAGE - 1);
      if (error) throw new Error(`org-export/${table} 조회 실패: ${error.message}`);
      return (data ?? []) as Record<string, unknown>[];
    });

    // 파일 경로 수집: «행에서» 모은다(경로 접두어로는 조직 파일을 고를 수 없다).
    for (const row of rows) {
      for (const [col, val] of Object.entries(row)) {
        if (typeof val === 'string' && val && isPathColumn(col)) {
          pathHits.push({ table, column: col, path: val });
        }
      }
    }

    zip.file(`data/${table}.ndjson`, rows.map((r) => JSON.stringify(r)).join('\n'));
    tables.push({ table, rows: rows.length });
    totalRows += rows.length;

    if (totalRows > MAX_ROWS) {
      throw new Error(
        `내보내기 규모가 상한(${MAX_ROWS.toLocaleString()}행)을 넘었습니다. ` +
          `한 번에 담을 수 있는 크기가 아닙니다. 나눠 받는 기능이 필요합니다. 지원팀에 문의해 주십시오.`,
      );
    }
  }
  const dbEndedAt = new Date().toISOString();

  // ── ③ 파일 수집 ──────────────────────────────────────────────────────────
  const filesStartedAt = new Date().toISOString();
  const uniquePaths = [...new Set(pathHits.map((h) => h.path))];
  // 🔴 2026-09-03 실측: 저장된 경로 형식이 «두 가지» 다. 어떤 표는 버킷 이름을 경로에
  //    넣고(document_artifacts) 어떤 표는 안 넣는다(org_qms_documents). 화면은 각자
  //    자기 방식으로 잘 열려서 이 어긋남이 조용했고, 한데 모으는 이 코드에서 처음
  //    드러났다. RPC 가 두 형식을 다 해석하고 어느 쪽이 맞았는지 알려 준다(0373).
  const resolved = new Map<string, { bucket: string; object: string; bytes: number | null; form: string }>();

  for (let i = 0; i < uniquePaths.length; i += 500) {
    const chunk = uniquePaths.slice(i, i + 500);
    const { data, error } = await admin.rpc('export_resolve_files', { p_paths: chunk });
    if (error) throw new Error(`파일 소재 조회 실패: ${error.message}`);
    for (const r of (data ?? []) as {
      input_path: string; bucket_id: string; object_name: string; byte_size: number | null; matched_form: string;
    }[]) {
      // ★ 열쇠는 «저장된 값» 이다. 행이 들고 있는 것이 그것이므로.
      resolved.set(r.input_path, {
        bucket: r.bucket_id, object: r.object_name, bytes: r.byte_size, form: r.matched_form,
      });
    }
  }

  const files: ExportScope['files'] = [];
  let totalBytes = 0;
  for (const path of uniquePaths) {
    const hit = resolved.get(path);
    if (!hit) continue; // 아래에서 missingFiles 로 보고한다
    const { data, error } = await admin.storage.from(hit.bucket).download(hit.object);
    if (error || !data) continue;
    const buf = Buffer.from(await data.arrayBuffer());
    totalBytes += buf.length;
    if (totalBytes > MAX_BYTES) {
      throw new Error(
        `첨부 파일 합계가 상한(${fmtBytes(MAX_BYTES)})을 넘었습니다. ` +
          `나눠 받는 기능이 필요합니다. 지원팀에 문의해 주십시오.`,
      );
    }
    zip.file(`files/${hit.bucket}/${hit.object}`, buf);
    files.push({ bucket: hit.bucket, path: hit.object, bytes: hit.bytes });
  }
  const filesEndedAt = new Date().toISOString();

  // 🔑 「행은 있는데 파일이 없다」. DR 런북이 복구 뒤에 하라던 점검을 여기서 자동으로 한다.
  const missingFiles = pathHits.filter((h) => !resolved.has(h.path));

  // ── ④ 매니페스트와 README ────────────────────────────────────────────────
  const window: ExportWindow = { dbStartedAt, dbEndedAt, filesStartedAt, filesEndedAt };
  const scope: ExportScope = { tables, excluded: [...EXCLUDED_TABLES], files, missingFiles };
  const stats = { tables: tables.length, rows: totalRows, files: files.length, bytes: totalBytes };

  zip.file(
    'manifest.json',
    JSON.stringify({ org: meta.orgName, requestedBy: meta.requesterEmail, window, stats, scope }, null, 2),
  );
  zip.file('README.html', renderReadme(meta, scope, window, stats));

  return {
    zip: zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }),
    scope,
    stats,
    window,
  };
}
