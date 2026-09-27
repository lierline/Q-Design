'use client';

// =============================================================================
// /research/[code]/profile: 제품 정보 (아이디어 + 프로파일 + AI 분석)
// =============================================================================
// 단일 목적: "이 제품이 무엇인가" 를 정의하고 분석.

import { useCallback, useEffect, useState } from 'react';
import type { AxisKeywords } from '@/lib/medical-items/idea-keywords';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { Alert, Bx, Btn, LoadingState, PageHd, SectionTitle, SkeletonPanel, Tag } from '@/lib/design/components';
import { S, FS, F, T, alpha, LH, RADIUS } from '@/lib/design/tokens';
import { longDateTime } from '@/lib/date';
import { Download, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { PageGuide } from '@/components/PageGuide';
import { HelpNote } from '@/components/HelpNote';
import { Q_MATCH_ENGINE_NAME } from '@/lib/branding';
import type { ProductProfile } from '@/lib/requirements/engine';

// 성능: 거대 client 컴포넌트 2개 (~106KB 합산) 를 dynamic import 로 분리.
// 초기 JS payload 100KB+ 절감. ItemClassificationPreview 는 자체 mount 후
// 외부 API (MFDS/FDA) 호출하므로 인터랙티브 로딩 시점 차이 미미.
const ProductProfileWizard = dynamic(
  () => import('@/components/ProductProfileWizard').then((m) => ({ default: m.ProductProfileWizard })),
  { ssr: false, loading: () => <SkeletonPanel height={280} lines={5} /> },
);
const ItemClassificationPreview = dynamic(
  () => import('@/components/ItemClassificationPreview').then((m) => ({ default: m.ItemClassificationPreview })),
  { ssr: false, loading: () => <SkeletonPanel height={160} lines={3} /> },
);
import type { ClassifyResponse } from '@/components/ItemClassificationPreview';
import { TextAction, TextLinkAction } from '@/components/TextAction';


interface AnalysisData {
  device_class_estimate: string;
  device_class_reasoning: string;
  ivd_likely: boolean;
  regulatory_pathway: { kr: string; us: string; eu: string; notes: string };
  predicate_devices: Array<{ name: string; similarity: 'high' | 'medium' | 'low'; rationale: string }>;
  major_risk_areas: string[];
  required_standards: string[];
  required_documents: string[];
  clinical_evaluation_needed: 'likely' | 'possibly' | 'unlikely' | 'unclear';
  go_no_go: 'go' | 'go_with_caveats' | 'reconsider' | 'no_go';
  go_no_go_reasoning: string;
  confidence: 'low' | 'medium' | 'high';
}

interface Project {
  id: string;
  code: string;
  title: string;
  idea_description: string;
  intended_use: string | null;
  patient_population: string | null;
  // 발안자 검토 키워드(0275): 등급 매칭 soft 가중 입력.
  idea_keywords: {
    material?: string[];
    structure?: string[];
    site?: string[];
    principle?: string[];
    purpose?: string[];
  } | null;
  ai_analysis: AnalysisData | null;
  ai_analyzed_at: string | null;
  // Q-Match 품목 분류
  predicted_item_code: string | null;
  predicted_item_name: string | null;
  predicted_item_grade: number | null;
  confirmed_item_code: string | null;
  item_classification_deferred_at: string | null;
  // Q-Match 분석 결과 박제 (org·기기 공유). { key: payload 해시, result: ClassifyResponse }
  qmatch_result: { key: string; result: unknown; saved_at?: string } | null;
  // profile
  profile_device_class: number | null;
  profile_sterile: string | null;
  profile_body_contact: string | null;
  profile_contact_duration: string | null;
  profile_blood_contact?: boolean | null;
  profile_software_type: string | null;
  profile_active_device: boolean | null;
  profile_clinical_likely: boolean | null;
  profile_target_markets: string[] | null;
  profile_working_principle: string | null;
  profile_completed_at: string | null;
  // [RR-5] RA 가 인허가 트래커에서 제안한 등급 (R&D 승인 대기: 자동 반영 안 함).
  suggested_device_class: number | null;
  suggested_device_class_source: string | null;
}

// AI 분석(go/no-go·규제 경로) 자체의 신뢰도 라벨.
// ⚠️ Q-Match 품목 매칭 신뢰도(lib/medical-items/match-confidence)와 **다른 축**이다.
//    이름이 같아 헷갈리기 쉬운데, 그쪽은 「입력이 품목 정의와 닮았는가」이고
//    이것은 LLM 이 자기 분석에 대해 낸 값이다. 공유하면 안 된다.
const ANALYSIS_CONFIDENCE_LABEL: Record<AnalysisData['confidence'], string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};
const GO_LABEL: Record<AnalysisData['go_no_go'], { label: string; color: string }> = {
  go: { label: '진행 권고', color: T.green },
  go_with_caveats: { label: '조건부 진행', color: T.warning },
  reconsider: { label: '재검토 필요', color: T.warning },
  no_go: { label: '중단 권고', color: T.red },
};

export default function ProfilePage() {
  const params = useParams();
  const code = String(params?.code ?? '');

  const [project, setProject] = useState<Project | null>(null);
  const [myJobRole, setMyJobRole] = useState<string | null>(null);
  // 시장 add-on entitlement: Q9 시장 선택 비활성화용 (API GET 에서 제공).
  const [allowedMarkets, setAllowedMarkets] = useState<string[]>(['mfds']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reanalyzing, setReanalyzing] = useState(false);
  // Q-Match 분석 카드 펼침/접힘: 확정된 상태면 기본 접힘
  const [qMatchOpen, setQMatchOpen] = useState(false);
  // Predicate 이름 → MFDS 품목 코드 매칭 결과 (서버 batch lookup).
  // AI 가 자유 형식으로 생성한 predicate name 을 식약처 별표 1 카탈로그와
  // 매칭해 코드까지 표시. 매칭 안 되면 null (UI 에 코드 미표시).
  const [predicateCodes, setPredicateCodes] = useState<
    Record<string, { code: string; name_kr: string; grade: number } | null>
  >({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/research/${encodeURIComponent(code)}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message ?? '로드 실패');
        return;
      }
      setProject(data.project);
      setMyJobRole(data.me?.job_role ?? null);
      if (Array.isArray(data.allowedMarkets)) setAllowedMarkets(data.allowedMarkets);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    void load();
  }, [load]);

  // AI predicate 후보 이름 → MFDS 품목 카탈로그 batch 매칭.
  // 6개 predicate 면 단일 round-trip 으로 in-memory 검색 (ms 단위).
  // ai_analysis 가 바뀔 때만 재호출.
  useEffect(() => {
    const predicates = project?.ai_analysis?.predicate_devices ?? [];
    if (predicates.length === 0) {
      setPredicateCodes({});
      return;
    }
    const names = predicates.map((p) => p.name).filter(Boolean);
    if (names.length === 0) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/research/lookup-item-by-name', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ names }),
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          matches?: Record<string, { code: string; name_kr: string; grade: number; score: number } | null>;
        };
        if (data.matches) setPredicateCodes(data.matches);
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return;
        // 매칭 실패는 silent: UI 에 코드만 안 보임
      }
    })();
    return () => controller.abort();
  }, [project?.ai_analysis]);

  async function confirmItem(item: {
    code: string;
    name_kr: string;
    grade: number;
    manual?: boolean;
  }) {
    const res = await fetch(`/api/research/${encodeURIComponent(code)}/confirm-item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doc_code: item.code,
        // 직접 입력 모드: backend 가 카탈로그 부재를 허용하도록
        manual: item.manual === true,
        name_kr: item.manual ? item.name_kr : undefined,
        grade: item.manual ? item.grade : undefined,
      }),
    });
    if (!res.ok) {
      const t = await res.json().catch(() => ({}));
      throw new Error(t?.message ?? `확정 실패 (${res.status})`);
    }
    // 확정 성공 → 분석 카드 자동 접기(헤더만 노출). 오빠 요청: 확정 후 스스로 접히도록.
    setQMatchOpen(false);
    await load();
  }

  // Q-Match 분석 결과 DB 박제: best-effort(실패해도 UX 무영향). org·기기 공유로 재분석 API 방지.
  const saveQmatch = useCallback(
    (key: string, result: ClassifyResponse) => {
      void fetch(`/api/research/${encodeURIComponent(code)}/save-qmatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, result }),
      }).catch(() => {});
    },
    [code],
  );

  // 보류 / 보류 해제
  async function deferItem(resume = false) {
    const res = await fetch(`/api/research/${encodeURIComponent(code)}/defer-item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume }),
    });
    if (!res.ok) {
      const t = await res.json().catch(() => ({}));
      setError(t?.message ?? `보류 ${resume ? '해제' : '설정'} 실패 (${res.status})`);
      return;
    }
    // 보류 직후엔 카드 접고, 보류 해제 시엔 카드 펼침
    setQMatchOpen(resume);
    await load();
  }

  async function reanalyze() {
    setReanalyzing(true);
    setError(null);
    try {
      const res = await fetch(`/api/research/${encodeURIComponent(code)}`, { method: 'POST' });
      if (!res.ok) {
        const t = await res.text();
        setError(`재분석 실패 (${res.status}): ${t.slice(0, 200)}`);
        return;
      }
      await load();
    } finally {
      setReanalyzing(false);
    }
  }

  // [RR-5] RA 가 제안한 등급을 R&D 가 프로파일에 반영 → 필요문서·인허가 경로 재산정.
  //   ★승인은 R&D 명시적 행동으로만(자동 덮어쓰기 금지). 서버가 RA 제안을 클리어.
  async function applySuggestedClass() {
    if (!project?.suggested_device_class) return;
    const res = await fetch(`/api/research/${encodeURIComponent(code)}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_device_class: project.suggested_device_class }),
    });
    if (!res.ok) {
      const t = await res.json().catch(() => ({}));
      setError(t?.message ?? '등급 반영 실패');
      return;
    }
    await load();
  }

  if (loading && !project) return <LoadingState />;
  if (!project) return <Alert kind="error">프로젝트를 찾을 수 없습니다.</Alert>;

  const a = project.ai_analysis;
  const goCfg = a ? GO_LABEL[a.go_no_go] : null;

  return (
    <div>
      <PageHd
        title="제품 정보"
        sub="아이디어 · 프로파일 · Q-Atelier 분석"
        actions={
          // 검정 채운 단추 셋이 나란히 있었다 (화면 검토 A62 · A63 · 2026-09-27). 내려받기 · 다시 분석은
          // 보조 동작이라 글귀로 둔다.
          <div style={{ display: 'flex', gap: S[2], alignItems: 'center', flexWrap: 'wrap' }}>
            <TextLinkAction href={`/api/research/${encodeURIComponent(code)}/export-docx`}>
              <Download size={12} style={{ marginRight: S[1] }} aria-hidden="true" />
              문서 내려받기 (DOCX)
            </TextLinkAction>
            <TextLinkAction href={`/api/research/${encodeURIComponent(code)}/closure-report`}>
              <Download size={12} style={{ marginRight: S[1] }} aria-hidden="true" />
              종료 보고서 내려받기
            </TextLinkAction>
            <TextAction onClick={() => void reanalyze()} disabled={reanalyzing}>
              <RefreshCw
                size={12}
                aria-hidden="true"
                style={{
                  marginRight: S[1],
                  animation: reanalyzing ? 'qa-spin 1s linear infinite' : 'none',
                }}
              />
              {reanalyzing ? '다시 분석하는 중...' : '분석 다시 실행'}
            </TextAction>
          </div>
        }
      />
      <PageGuide pageId="research-profile" />
      <style>{`@keyframes qa-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <HelpNote>
        제품 프로파일 문항입니다. 의료기기 <strong>등급 · 위험도 · 신체 접촉 · 멸균 · 소프트웨어</strong>
        등을 입력하면, 시스템이 이 답을 근거로 「내 제품에 필요한 인허가 경로 · 문서 · 시험」을
        자동으로 짚어줍니다. <strong>정확히 답할수록 맞춤 안내가 정교</strong>해집니다.
      </HelpNote>

      {/* [RR-5] RA 등급 제안: R&D 가 검토·반영(자동 덮어쓰기 금지). */}
      {project.suggested_device_class != null &&
        project.suggested_device_class !== project.profile_device_class && (
          <Bx
            style={{
              marginBottom: S[4],
              padding: '14px 16px',
              borderColor: alpha(T.champagne, 0.4),
              background: alpha(T.champagne, 0.06),
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: S[3], flexWrap: 'wrap' }}>
              <Tag color={T.champagne}>RA 제안</Tag>
              <span style={{ flex: 1, minWidth: 240, fontSize: FS[13], fontFamily: F.serif, color: T.text, lineHeight: LH.notice }}>
                RA 가 인허가에서 <strong>{project.suggested_device_class}등급</strong>으로 확정했습니다
                {project.profile_device_class != null && (
                  <> (현재 프로파일 {project.profile_device_class}등급)</>
                )}
                . 반영하면 필요문서·인허가 경로가 재산정됩니다.
              </span>
              <Btn sm onClick={() => void applySuggestedClass()}>
                {project.suggested_device_class}등급으로 반영
              </Btn>
            </div>
          </Bx>
        )}

      {error && (
        <div style={{ marginBottom: S[4] }}>
          <Alert kind="error" onClose={() => setError(null)}>{error}</Alert>
        </div>
      )}

      {/* 아이디어 */}
      <SectionTitle>아이디어</SectionTitle>
      <Bx style={{ padding: S[4.5], marginBottom: S[7] }}>
        <div style={{ fontSize: FS[13], lineHeight: LH.loose, color: T.text, whiteSpace: 'pre-wrap', marginBottom: S[3] }}>
          {project.idea_description}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1px 1fr',
            gap: S[4.5],
            paddingTop: S[3],
            borderTop: `1px solid ${T.border}`,
          }}
        >
          <MetaField label="의도된 사용목적">
            {project.intended_use ?? <span style={{ color: T.muted }}>-</span>}
          </MetaField>
          {/* 두 필드 사이의 수직 분리선 */}
          <div
            aria-hidden
            style={{ background: T.border, alignSelf: 'stretch', justifySelf: 'center' }}
          />
          <MetaField label="대상 환자군">
            {project.patient_population ?? <span style={{ color: T.muted }}>-</span>}
          </MetaField>
        </div>
      </Bx>

      {/* Q-Match Engine: MFDS 품목 분류 + 확정 */}
      <SectionTitle>{Q_MATCH_ENGINE_NAME} · 품목·등급 확정</SectionTitle>
      <Bx style={{ padding: S[4.5], marginBottom: S[7] }}>
        {project.confirmed_item_code && project.predicted_item_name ? (
          <div
            style={{
              borderRadius: RADIUS.md,
              padding: '14px 16px',
              background: `${alpha(T.green, 0.05)}`,
              border: `1px solid ${T.green}`,
              borderLeft: `3px solid ${T.green}`,
              marginBottom: qMatchOpen ? 14 : 0,
              display: 'flex',
              alignItems: 'center',
              gap: S[3],
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: FS[10],
                color: T.green,
                fontFamily: F.mono,
                fontWeight: 600,
              }}
            >
              ✓ 품목 확정됨
            </span>
            <span style={{ fontSize: FS[13], color: T.text, fontFamily: F.serif, fontWeight: 500 }}>
              {project.confirmed_item_code} · {project.predicted_item_name}
            </span>
            {project.predicted_item_grade != null && (
              <Tag color={T.champagne}>{project.predicted_item_grade}등급</Tag>
            )}
            <span
              style={{
                fontSize: FS[10],
                color: T.muted,
                fontFamily: F.mono,
                flex: 1,
                minWidth: 200,
              }}
            >
              등급과 품목이 이 단계에서 결정되어 카탈로그·문서·인허가 경로 산출에 사용됩니다.
            </span>
            {/* 확정 후 분석 카드 펼치기/접기 토글 */}
            <button
              type="button"
              onClick={() => setQMatchOpen((v) => !v)}
              style={{
                borderRadius: RADIUS.md,
                marginLeft: 'auto',
                background: 'transparent',
                border: `1px solid ${T.border}`,
                color: T.muted,
                padding: '4px 10px',
                fontSize: FS[10],
                fontFamily: F.mono,
                letterSpacing: 0.6,
                textTransform: 'uppercase',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {qMatchOpen ? '▲ 분석 결과 접기' : '▼ 분석 결과 펼치기'}
            </button>
          </div>
        ) : project.item_classification_deferred_at ? (
          // 보류됨. 사용자가 후보 중 적절한 게 없어 일단 넘어간 상태
          <div
            style={{
              borderRadius: RADIUS.md,
              padding: '12px 14px',
              background: `${alpha(T.muted, 0.06)}`,
              border: `1px dashed ${T.muted}`,
              borderLeft: `3px solid ${T.muted}`,
              marginBottom: qMatchOpen ? 14 : 0,
              fontSize: FS[12],
              color: T.subtle,
              fontFamily: F.serif,
              lineHeight: LH.relaxed,
              display: 'flex',
              alignItems: 'center',
              gap: S[3],
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: FS[10],
                color: T.muted,
                fontFamily: F.mono,
                fontWeight: 600,
              }}
            >
              ⏸ 보류됨
            </span>
            <span style={{ flex: 1, minWidth: 240 }}>
              Q-Match 후보 중 적합한 품목이 없어 보류 상태입니다. 아이디어를 보완하거나
              새 후보를 확인하려면 <strong>확정 재개</strong> 를 누르십시오.
            </span>
            <button
              type="button"
              onClick={() => void deferItem(true)}
              style={{
                borderRadius: RADIUS.md,
                background: 'transparent',
                border: `1px solid ${T.border}`,
                color: T.text,
                padding: '4px 10px',
                fontSize: FS[10],
                fontFamily: F.mono,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              ▶ 확정 재개
            </button>
          </div>
        ) : project.predicted_item_code ? (
          <div
            style={{
              borderRadius: RADIUS.md,
              padding: '12px 14px',
              background: `${alpha(T.warning, 0.05)}`,
              border: `1px dashed ${T.warning}`,
              marginBottom: S[3.5],
              fontSize: FS[12],
              color: T.subtle,
              fontFamily: F.serif,
              lineHeight: LH.relaxed,
              display: 'flex',
              alignItems: 'center',
              gap: S[3],
              flexWrap: 'wrap',
            }}
          >
            <span style={{ flex: 1, minWidth: 280 }}>
              현재 <strong>추정</strong> 품목: <strong style={{ color: T.text }}>{project.predicted_item_code} {project.predicted_item_name}</strong>
              {project.predicted_item_grade != null && (
                <> ({project.predicted_item_grade}등급)</>
              )}
              . 아래에서 {Q_MATCH_ENGINE_NAME} 으로 재검토 후 <strong>이 품목으로 확정</strong> 을 눌러 결정하십시오.
            </span>
            <button
              type="button"
              onClick={() => void deferItem(false)}
              title="후보 중 맞는 게 없으면 일단 보류하고 나중에 확정할 수 있습니다."
              style={{
                borderRadius: RADIUS.md,
                background: 'transparent',
                border: `1px solid ${T.border}`,
                color: T.muted,
                padding: '4px 10px',
                fontSize: FS[10],
                fontFamily: F.mono,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              ⏸ 보류
            </button>
          </div>
        ) : (
          <div
            style={{
              borderRadius: RADIUS.md,
              padding: '12px 14px',
              background: T.surface,
              border: `1px dashed ${T.border}`,
              marginBottom: S[3.5],
              fontSize: FS[12],
              color: T.muted,
              fontFamily: F.serif,
              lineHeight: LH.relaxed,
              display: 'flex',
              alignItems: 'center',
              gap: S[3],
              flexWrap: 'wrap',
            }}
          >
            <span style={{ flex: 1, minWidth: 280 }}>
              아직 품목이 결정되지 않았습니다. 아래에서 {Q_MATCH_ENGINE_NAME} 을 실행해 후보를
              살피고 <strong>이 품목으로 확정</strong> 을 눌러 결정하십시오.
            </span>
            <button
              type="button"
              onClick={() => void deferItem(false)}
              title="지금 결정하지 않고 나중에 입력하시려면 보류해 두실 수 있습니다."
              style={{
                borderRadius: RADIUS.md,
                background: 'transparent',
                border: `1px solid ${T.border}`,
                color: T.muted,
                padding: '4px 10px',
                fontSize: FS[10],
                fontFamily: F.mono,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              ⏸ 보류
            </button>
          </div>
        )}

        {/*
          분석 카드 표시 규칙:
          - 확정됨 + qMatchOpen=false → 숨김 (헤더만 보임)
          - 확정됨 + qMatchOpen=true  → 펼침
          - 보류됨 + qMatchOpen=false → 숨김 (헤더만 보임)
          - 보류됨 + qMatchOpen=true  → 펼침 (확정 재개 후 펼친 경우)
          - 미확정·미보류 → 항상 표시 (후보 선택해야 하니까)

          ★ 항상 mount 해서 ItemClassificationPreview 의 result state 가
            unmount 로 날아가지 않도록. CSS display 만 토글.
        */}
        <div
          style={{
            display:
              (!project.confirmed_item_code &&
                !project.item_classification_deferred_at) ||
              qMatchOpen
                ? 'block'
                : 'none',
          }}
        >
          <ItemClassificationPreview
            enabled={(project.idea_description ?? '').trim().length >= 10}
            payload={{
              description: project.idea_description ?? '',
              intendedUse: project.intended_use ?? undefined,
              titleHint: project.title,
              patientPopulation: project.patient_population ?? undefined,
              // 발안자 검토 키워드(0275): refine 프롬프트 참고 섹션으로 구조체 그대로 전달.
              ideaKeywords: (project.idea_keywords ?? undefined) as AxisKeywords | undefined,
            }}
            confirmedCode={project.confirmed_item_code}
            onConfirm={confirmItem}
            dbCached={
              project.qmatch_result
                ? {
                    key: project.qmatch_result.key,
                    result: project.qmatch_result.result as ClassifyResponse,
                  }
                : null
            }
            onResult={saveQmatch}
          />
        </div>
      </Bx>

      {/* 프로파일 위저드: Q7 결정 도우미용 clinicalHint 같이 전달 */}
      <ProductProfileWizard
        code={code}
        projectId={project.id}
        myJobRole={myJobRole}
        initial={{
          device_class: project.profile_device_class as ProductProfile['device_class'],
          sterile: project.profile_sterile as ProductProfile['sterile'],
          body_contact: project.profile_body_contact as ProductProfile['body_contact'],
          contact_duration: project.profile_contact_duration as ProductProfile['contact_duration'],
          blood_contact: project.profile_blood_contact as boolean | null,
          software_type: project.profile_software_type as ProductProfile['software_type'],
          active_device: project.profile_active_device,
          clinical_likely: project.profile_clinical_likely,
          target_markets: (project.profile_target_markets ?? []) as ProductProfile['target_markets'],
          working_principle: project.profile_working_principle as ProductProfile['working_principle'],
        }}
        completedAt={project.profile_completed_at}
        onSaved={() => void load()}
        allowedMarkets={allowedMarkets}
        clinicalHint={{
          grade:
            project.predicted_item_grade ??
            (project.profile_device_class as number | null) ??
            null,
          aiRecommendation: a?.clinical_evaluation_needed ?? null,
          aiReasoning: a?.go_no_go_reasoning ?? null,
          predicateDevices: a?.predicate_devices ?? [],
          targetMarkets:
            (project.profile_target_markets ?? []) as Array<'mfds' | 'fda' | 'mdr' | 'pmda'>,
        }}
      />

      {/* AI 분석 결과 */}
      {!a ? (
        <Bx style={{ padding: S[4.5], marginBottom: S[7], textAlign: 'center' }}>
          <Loader2 size={16} className="animate-spin" style={{ color: T.muted, marginBottom: S[2] }} />
          <div style={{ fontSize: FS[12], color: T.muted, fontFamily: F.mono }}>
            Q-Atelier 분석이 아직 끝나지 않았습니다. 위 「분석 다시 실행」 을 누르십시오.
          </div>
        </Bx>
      ) : (
        <>
          <SectionTitle>Q-Atelier 분석 결과</SectionTitle>
          <Bx style={{ padding: S[4.5], marginBottom: S[4] }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: S[3.5] }}>
              <MetaField label="추정 등급">
                {a.device_class_estimate}
                <div style={{ fontSize: FS[11], color: T.subtle, marginTop: S[1], lineHeight: LH.normal }}>
                  {a.device_class_reasoning}
                </div>
              </MetaField>
              <MetaField label="진행 판단">
                {goCfg && <Tag color={goCfg.color}>{goCfg.label}</Tag>}
                <div style={{ fontSize: FS[11], color: T.subtle, marginTop: S[1], lineHeight: LH.normal }}>
                  {a.go_no_go_reasoning}
                </div>
              </MetaField>
              <MetaField label="임상 평가 필요성">{a.clinical_evaluation_needed}</MetaField>
              <MetaField label="IVD 가능성">{a.ivd_likely ? '예' : '아니오'}</MetaField>
            </div>
          </Bx>
          {a.major_risk_areas.length > 0 && (
            <Bx style={{ padding: S[3.5], marginBottom: S[4] }}>
              <div style={{ fontSize: FS[10], color: T.muted, fontFamily: F.mono, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: S[1.5] }}>
                주요 위험 영역
              </div>
              <ul style={{ margin: 0, paddingLeft: S[4.5], fontSize: FS[12], color: T.subtle, lineHeight: LH.loose }}>
                {a.major_risk_areas.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </Bx>
          )}
          {a.predicate_devices.length > 0 && (
            <Bx style={{ padding: S[3.5], marginBottom: S[4] }}>
              <div style={{ fontSize: FS[10], color: T.muted, fontFamily: F.mono, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: S[1.5] }}>
                Predicate 후보
              </div>
              {a.predicate_devices.map((p, i) => {
                const matched = predicateCodes[p.name] ?? null;
                return (
                  <div
                    key={i}
                    style={{
                      marginBottom: S[2],
                      paddingBottom: S[2],
                      borderBottom:
                        i < a.predicate_devices.length - 1 ? `1px dashed ${T.border}` : 'none',
                    }}
                  >
                    <div
                      style={{
                        fontSize: FS[12],
                        color: T.text,
                        display: 'flex',
                        alignItems: 'center',
                        gap: S[1.5],
                        flexWrap: 'wrap',
                      }}
                    >
                      {/* MFDS 코드 매칭됐으면 앞에 코드 chip 표시 */}
                      {matched && (
                        <Tag color={T.champagne}>
                          {matched.code} · {matched.grade}등급
                        </Tag>
                      )}
                      <span>{p.name}</span>
                      <Tag
                        color={
                          p.similarity === 'high'
                            ? T.green
                            : p.similarity === 'medium'
                              ? T.warning
                              : T.muted
                        }
                      >
                        {p.similarity}
                      </Tag>
                    </div>
                    <div style={{ fontSize: FS[11], color: T.subtle, marginTop: S[0.5] }}>{p.rationale}</div>
                    {/* MFDS 매칭된 정식 한글명이 다르면 보조 표시 */}
                    {matched && matched.name_kr && matched.name_kr !== p.name && (
                      <div
                        style={{
                          fontSize: FS[10],
                          color: T.muted,
                          fontFamily: F.mono,
                          marginTop: S[0.5],
                          letterSpacing: 0.3,
                        }}
                      >
                        ↳ MFDS 정식 명칭: {matched.name_kr}
                      </div>
                    )}
                  </div>
                );
              })}
            </Bx>
          )}
          {/* 🔴 2026-08-24: 'high' 를 영문 그대로 찍고 있어 한글로 바꿨다.
              ⚠️ 이것은 **AI 분석(go/no-go·규제 경로) 자체의 신뢰도**이지
              Q-Match 품목 매칭 신뢰도가 아니다. 두 축은 이름만 같고 뜻이 다르므로
              match-confidence 의 뜻풀이를 여기 붙이면 안 된다(붙였다가 되돌렸다).
              그래서 「분석 신뢰도」로 이름을 붙여 어느 축인지 드러낸다. */}
          <div style={{ marginTop: S[2], fontSize: FS[10], color: T.muted, fontFamily: F.mono, textAlign: 'right' }}>
            <Sparkles size={10} style={{ display: 'inline', marginRight: S[1], verticalAlign: 'middle' }} />
            Q-Atelier 분석툴 · {project.ai_analyzed_at ? longDateTime(project.ai_analyzed_at) : '-'} · 분석 신뢰도{' '}
            {ANALYSIS_CONFIDENCE_LABEL[a.confidence]}
          </div>
        </>
      )}
    </div>
  );
}

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: FS[10], color: T.muted, fontFamily: F.mono, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: S[1] }}>
        {label}
      </div>
      <div style={{ fontSize: FS[13], color: T.text }}>{children}</div>
    </div>
  );
}
