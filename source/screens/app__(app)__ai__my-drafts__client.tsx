'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Trash2, RefreshCw, ChevronDown, ChevronUp, FileText, ShieldCheck, GitPullRequest, Inbox, type LucideIcon } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/Confirm';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
import { Bx, PageHd, Tag, Btn, Modal } from '@/lib/design/components';
import { S, FS, F, T, alpha, LH, LAYOUT } from '@/lib/design/tokens';

interface ProjectOption {
  code: string;
  title: string;
}

interface DraftRow {
  id: string;
  kind: 'ifu' | 'risk' | 'cr';
  title: string;
  inputs: Record<string, unknown>;
  content: string;
  meta: Record<string, unknown>;
  promoted_to_entity_type: string | null;
  promoted_to_entity_id: string | null;
  promoted_at: string | null;
  created_at: string;
  updated_at: string;
}

const KIND_INFO: Record<DraftRow['kind'], { icon: LucideIcon; label: string }> = {
  ifu: { icon: FileText, label: '제품 기획서' },
  risk: { icon: ShieldCheck, label: 'Risk' },
  cr: { icon: GitPullRequest, label: 'CR' },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}일 전`;
  return d.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
}

export function MyDraftsClient() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const router = useRouter();
  const { copy: copyContent } = useCopyToClipboard({
    toast: true,
    successMessage: '클립보드에 복사됨',
    errorMessage: '복사 실패',
  });
  const [items, setItems] = useState<DraftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [promoteDraft, setPromoteDraft] = useState<DraftRow | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [promoteBusy, setPromoteBusy] = useState(false);
  // Promote modal open 시 project 목록 fetch
  useEffect(() => {
    if (!promoteDraft) return;
    setSelectedProject('');
    void (async () => {
      try {
        const res = await fetch('/api/research?lite=1', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list: ProjectOption[] = (data.projects ?? data.items ?? []).map((p: any) => ({
          code: p.code,
          title: p.title,
        }));
        setProjects(list);
        if (list.length > 0) setSelectedProject(list[0].code);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : '프로젝트 목록 로드 실패');
      }
    })();
  }, [promoteDraft, toast]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/drafts', { cache: 'no-store' });
      const data = await res.json();
      setItems(data.items ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '로드 실패');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function deleteOne(id: string) {
    if (!(await confirm({ title: '초안 삭제', message: '이 초안을 삭제합니다. 삭제된 초안은 복구할 수 없습니다.', confirmLabel: '삭제', destructive: true }))) return;
    try {
      const res = await fetch(`/api/ai/drafts/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.message ?? '삭제 실패');
        return;
      }
      toast.success('삭제 완료');
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function promote() {
    if (!promoteDraft || !selectedProject) return;
    setPromoteBusy(true);
    try {
      const res = await fetch(`/api/ai/drafts/${promoteDraft.id}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectCode: selectedProject }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? `등록 실패 (HTTP ${res.status})`);
        setPromoteBusy(false);
        return;
      }
      toast.success(data.crNumber ? `${data.crNumber} 등록 완료` : '정식 등록 완료');
      setPromoteDraft(null);
      setPromoteBusy(false);
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        void load();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      setPromoteBusy(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: LAYOUT.detail,
        margin: '0 auto',
        padding: '20px 16px calc(120px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <PageHd
        title="내 Q-Atelier 초안"
        sub="Q-Atelier 초안 위저드로 생성한 임시 초안 목록입니다. 본인만 접근 가능 (RLS)."
        actions={
          <button
            type="button"
            onClick={() => void load()}
            aria-label="새로고침"
            style={{
              background: 'transparent',
              border: 'none',
              color: T.subtle,
              cursor: 'pointer',
              padding: S[1.5],
              // WCAG 2.5.5: 44x44 minimum
              minWidth: 44,
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RefreshCw size={18} className={loading ? 'qa-spin' : ''} aria-hidden="true" />
          </button>
        }
      />

      <style>{`
        @keyframes qa-spin { to { transform: rotate(360deg); } }
        .qa-spin { animation: qa-spin 0.8s linear infinite; }
      `}</style>

      {loading && items.length === 0 && (
        <Bx style={{ padding: S[6] }}>
          <div style={{ fontSize: FS[13], color: T.subtle }}>초안 로드 중...</div>
        </Bx>
      )}

      {!loading && items.length === 0 && (
        <Bx style={{ padding: S[8], textAlign: 'center', background: alpha(T.champagne, 0.02) }}>
          <div style={{ marginBottom: S[2] }}>
            <Inbox size={36} aria-hidden="true" color={T.champagne} />
          </div>
          <div style={{ fontSize: FS[14], color: T.text, marginBottom: S[1], fontFamily: F.serif }}>
            아직 생성된 초안이 없습니다.
          </div>
          <div style={{ fontSize: FS[11], color: T.subtle, lineHeight: LH.loose }}>
            우하단 초안 위저드(IFU / Risk / CR)에서 초안을 만들면 여기에 자동 저장됩니다.
          </div>
        </Bx>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: S[2.5] }}>
        {items.map((d) => {
          const info = KIND_INFO[d.kind];
          const expanded = expandedId === d.id;
          const isPromoted = Boolean(d.promoted_to_entity_id);
          return (
            <Bx
              key={d.id}
              style={{
                padding: S[4],
                borderColor: isPromoted ? alpha(T.green, 0.4) : T.border,
                background: isPromoted ? alpha(T.green, 0.03) : T.surface,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: S[3], marginBottom: expanded ? 12 : 0 }}>
                {(() => { const KIcon = info.icon; return <KIcon size={22} aria-hidden="true" style={{ color: T.champagne, flexShrink: 0 }} />; })()}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: S[2],
                      fontSize: FS[14],
                      fontWeight: 500,
                      color: T.text,
                      marginBottom: S[0.5],
                    }}
                  >
                    <Tag size="sm">{info.label}</Tag>
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flex: 1,
                      }}
                    >
                      {d.title}
                    </span>
                    {isPromoted && (
                      <span
                        style={{
                          fontSize: FS[10],
                          fontFamily: F.mono,
                          color: T.green,
                          letterSpacing: 1,
                        }}
                      >
                        REGISTERED
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: FS[11], color: T.subtle }}>
                    {formatTime(d.created_at)} · {d.content.length.toLocaleString()}자
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : d.id)}
                  aria-label={expanded ? '접기' : '펼치기'}
                  aria-expanded={expanded}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: T.subtle,
                    cursor: 'pointer',
                    padding: S[1.5],
                    minWidth: 44,
                    minHeight: 44,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {expanded ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
                </button>
              </div>

              {expanded && (
                <>
                  <pre
                    style={{
                      padding: S[3.5],
                      background: alpha(T.text, 0.03),
                      border: `1px solid ${T.border}`,
                      // iOS auto-zoom 방지 (≥16px): 모바일 가독성도 향상
                      fontSize: FS[13],
                      fontFamily: F.mono,
                      lineHeight: LH.loose,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      // viewport 의 50% 또는 400px 중 작은 값
                      maxHeight: 'min(400px, 50vh)',
                      overflowY: 'auto',
                      color: T.text,
                      margin: 0,
                      marginBottom: S[3],
                    }}
                  >
                    {d.content}
                  </pre>
                  <div style={{ display: 'flex', gap: S[2], flexWrap: 'wrap' }}>
                    <Btn p={false} sm onClick={() => void copyContent(d.content)}>
                      <Copy size={12} style={{ marginRight: S[1] }} />
                      복사
                    </Btn>
                    <Btn
                      p={false}
                      sm
                      onClick={() => void deleteOne(d.id)}
                      style={{ color: T.red, borderColor: alpha(T.red, 0.4) }}
                    >
                      <Trash2 size={12} style={{ marginRight: S[1] }} />
                      삭제
                    </Btn>
                    {!isPromoted && (
                      <Btn
                        sm
                        onClick={() => setPromoteDraft(d)}
                        style={{ marginLeft: 'auto' }}
                      >
                        정식 등록
                      </Btn>
                    )}
                  </div>
                </>
              )}
            </Bx>
          );
        })}
      </div>

      {/* Promote modal: 공용 Modal 프리미티브(focus trap·scroll lock·ESC·portal a11y 통일) */}
      {promoteDraft && (
        <Modal
          open
          onClose={() => setPromoteDraft(null)}
          maxWidth={480}
          title={(() => {
            const KIcon = KIND_INFO[promoteDraft.kind].icon;
            return (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: S[2] }}>
                <KIcon size={20} aria-hidden="true" style={{ color: T.champagne, flexShrink: 0 }} />
                정식 등록
              </span>
            );
          })()}
          sub={promoteDraft.title}
          footer={
            <>
              <Btn p={false} sm onClick={() => setPromoteDraft(null)} disabled={promoteBusy}>
                취소
              </Btn>
              <Btn
                sm
                onClick={() => void promote()}
                disabled={!selectedProject || promoteBusy}
                style={{ background: T.champagne, color: T.bg, borderColor: T.champagne, minWidth: 120 }}
              >
                {promoteBusy ? '등록 중...' : '등록'}
              </Btn>
            </>
          }
        >
          <div style={{ marginBottom: S[4] }}>
            <label
              style={{
                display: 'block',
                fontSize: FS[11],
                fontFamily: F.mono,
                color: T.subtle,
                letterSpacing: 1,
                marginBottom: S[1.5],
                textTransform: 'uppercase',
              }}
            >
              연결할 프로젝트
            </label>
            {projects.length === 0 ? (
              <div style={{ fontSize: FS[12], color: T.subtle, padding: '12px 0' }}>
                활성 R&D 프로젝트가 없습니다. 먼저 프로젝트를 생성해주세요.
              </div>
            ) : (
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                aria-label="연결할 프로젝트 선택"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  // iOS auto-zoom 방지 (≥16px)
                  fontSize: FS[16],
                  fontFamily: F.ui,
                  background: T.bg,
                  border: `1px solid ${T.border}`,
                  color: T.text,
                  minHeight: 44,
                }}
              >
                {projects.map((p) => (
                  <option key={p.code} value={p.code}>
                    [{p.code}] {p.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div
            style={{
              fontSize: FS[11],
              color: T.subtle,
              lineHeight: LH.loose,
              padding: S[3],
              background: alpha(T.champagne, 0.04),
            }}
          >
            {promoteDraft.kind === 'cr' && (
              <>CR (변경 의뢰) 로 등록됩니다. cr_number 자동 부여 + 영향 분석 RA/QA 검토 + 결재 흐름.</>
            )}
            {promoteDraft.kind === 'ifu' && (
              <>IFU 문서 (status=draft, version=1) 로 등록됩니다. Q-Atelier 초안 본문은 content 에 보존 + 추후 검토/승인 결재.</>
            )}
            {promoteDraft.kind === 'risk' && (
              <>Risk Management File 문서로 등록됩니다 (단일 hazard 1건). Q-Atelier 초안 본문 보존 + RA/QA 검토.</>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
