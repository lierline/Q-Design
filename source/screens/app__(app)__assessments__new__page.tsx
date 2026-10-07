'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { translateDbError } from '@/lib/db/translate-error';
import {
  Alert,
  Btn,
  Checkbox,
  Div,
  EmptyState,
  FldRow,
  Grid,
  In,
  InfoBox,
  InfoDot,
  Lbl,
  LoadingState,
  NextStep,
  PageHd,
  Sel,
  Txt,
} from '@/lib/design/components';
import { S, FS, F, T, LH, LAYOUT, RADIUS } from '@/lib/design/tokens';
import {
  CHANGE_REASONS,
  CHANGE_STAGES_UI,
  CHANGE_TARGETS,
  CHANGE_TARGETS_KR,
  IMPACT_CHECKS,
  JUR_TO_DB,
  STAGE_TO_DB,
  getSubTypes,
} from '@/lib/catalog';
import { allowedMarketsFor } from '@/lib/subscription/plan-policy';

// 관할국(JUR_TO_DB 값) → 구독 시장(allowedMarketsFor) 매핑. 구독 add-on 없는 시장은 숨김.
const MARKET_FOR_JUR: Record<string, string> = { KR: 'mfds', US: 'fda', EU: 'eu_mdr', JP: 'pmda' };
import type { ChangeTarget } from '@/lib/engine/types';
import { AssessmentPreviewPanel } from '@/components/AssessmentPreviewPanel';
import { startRouteProgress } from '@/components/TopProgressBar';
import { ListBackLink } from '@/components/ListBackLink';
import { TextAction, TextLinkAction } from '@/components/TextAction';
import { ChoiceCheck, choiceLook } from '@/lib/design/segmented-choice';

interface ProductRow {
  id: string;
  local_id: string;
  name: string;
  device_class: string | null;
  patient_contact: boolean;
  contact_type: string | null;
  sterile: boolean;
  sterilization_method: string | null;
  software_included: boolean;
}

const KEY_LABELS: Record<string, [string, string]> = {
  SOFTWARE: ['이전 버전 / 모듈명', '변경 후 버전 / 모듈명'],
  MATERIAL: ['이전 사양·규격', '변경 후 사양·규격'],
  MANUFACTURING_PROCESS: ['이전 파라미터·공정', '변경 후 파라미터·공정'],
  PACKAGING: ['이전 포장 사양', '변경 후 포장 사양'],
  STERILIZATION: ['이전 멸균 방법·조건', '변경 후 멸균 방법·조건'],
  TEST_METHOD: ['이전 시험법·기준', '변경 후 시험법·기준'],
  LABELING: ['이전 문구·버전', '변경 후 문구·버전'],
  DEFAULT: ['변경 전 (요약)', '변경 후 (요약)'],
};

interface SectionHeadProps {
  n: string | number;
  title: string;
  hint?: string;
  done?: boolean;
}
function SectionHead({ n, title, hint, done }: SectionHeadProps) {
  return (
    <div style={{ display: 'flex', gap: S[3], alignItems: 'baseline', marginBottom: S[3.5] }}>
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          background: done ? T.green : T.borderHi,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: FS[12],
          color: done ? T.bg : T.muted,
          fontFamily: F.mono,
          flexShrink: 0,
          fontWeight: done ? 700 : 400,
        }}
      >
        {done ? '✓' : n}
      </div>
      {/* 2026-10-08 «설명 글귀는 ⓘ 안으로»: 단계 설명은 제목 옆 ⓘ 팝업으로. 제목 아래 한 줄 글은 걷었다 */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: S[1.5] }}>
        <div style={{ fontSize: FS[14], color: T.text, fontWeight: 500 }}>{title}</div>
        {hint && <InfoDot label={`${title} 설명 보기`}>{hint}</InfoDot>}
      </div>
    </div>
  );
}

export default function NewAssessmentPage() {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  // 변경 영향 진단 결과 prefill 안내
  const treeLevel = searchParams.get('tree_level'); // major | minor | self | unclear
  const treeRationale = searchParams.get('tree_rationale');
  // graduated product prefill
  const presetProductId = searchParams.get('product');

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pid, setPid] = useState('');
  const [title, setTitle] = useState('');
  const [stage, setStage] = useState<string>('출시 후');
  const [jur, setJur] = useState<string>('한국 (MFDS)');
  // 구독 해금 시장: 관할국 옵션 제한(과금 정합). 기본은 자국(MFDS).
  const [allowedMarkets, setAllowedMarkets] = useState<string[]>(['mfds']);
  /*
   * 변경 대상은 미리 고르지 않는다 (화면 검토 A20 · 2026-09-27). 기본값이 «소프트웨어» 라
   * SW 미포함 제품에서도 그대로 넘어가 엉뚱한 세부 유형 · 판정이 나올 수 있었다. 사람이 고른다.
   */
  const [target, setTarget] = useState<ChangeTarget | ''>('');
  const [subTypes, setSubTypes] = useState<string[]>([]);
  const [beforeKey, setBeforeKey] = useState('');
  const [afterKey, setAfterKey] = useState('');
  const [notes, setNotes] = useState(
    treeRationale
      ? `[변경 영향 진단 결과: ${treeLevel}]\n${treeRationale}\n\n`
      : '',
  );
  const [noteOpen, setNoteOpen] = useState(!!treeRationale);
  const [reasons, setReasons] = useState<string[]>([]);
  const [impactChecks, setImpactChecks] = useState<Record<string, 'none' | 'has'>>({});

  // Load products + orgId
  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) {
        router.push('/login');
        return;
      }
      const { data: memb } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', userRes.user.id)
        .limit(1)
        .maybeSingle();
      if (memb?.org_id) {
        setOrgId(memb.org_id);
        // 구독 해금 시장 조회: 관할국 옵션 제한(과금 정합).
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('tier, market_addons')
          .eq('org_id', memb.org_id)
          .maybeSingle();
        const addons = Array.isArray(sub?.market_addons) ? (sub?.market_addons as string[]) : [];
        setAllowedMarkets(allowedMarketsFor(sub?.tier as string | null | undefined, addons));
      }

      const { data: prods } = await supabase
        .from('products')
        .select('id, local_id, name, device_class, patient_contact, contact_type, sterile, sterilization_method, software_included')
        .order('created_at', { ascending: false });
      const list = (prods ?? []) as ProductRow[];
      setProducts(list);
      // preset product (graduated R&D → product 링크에서 진입) 우선
      if (presetProductId) {
        const preset = list.find((p) => p.id === presetProductId);
        if (preset) {
          setPid(preset.local_id);
        } else if (list[0]) {
          setPid(list[0].local_id);
        }
      } else if (list[0]) {
        setPid(list[0].local_id);
      }
      setProductsLoading(false);
    })();
  }, [supabase, router, presetProductId]);

  const subTypeOptions = useMemo(() => (target ? getSubTypes(target) : []), [target]);
  const [beforeLbl, afterLbl] = KEY_LABELS[target] || KEY_LABELS.DEFAULT;
  const selectedProduct = products.find((p) => p.local_id === pid);

  const toggleArr = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    arr: string[],
    val: string
  ) => {
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  // 5-step progress
  const steps = [
    !!(pid && title && target),
    subTypes.length > 0,
    !!beforeKey && !!afterKey,
    reasons.length > 0,
    Object.keys(impactChecks).length === IMPACT_CHECKS.length,
  ];
  const completedSteps = steps.filter(Boolean).length;
  const readyToEval = completedSteps === 5;
  const hasImpact = Object.values(impactChecks).some((v) => v === 'has');

  async function handleEvaluate() {
    if (!readyToEval || !selectedProduct || !orgId || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          productLocalId: selectedProduct.local_id,
          title,
          target,
          subTypes,
          beforeKey,
          afterKey,
          rdImpact: impactChecks,
          reasons,
          stage: STAGE_TO_DB[stage] ?? 'POST_MARKET',
          jurisdiction: JUR_TO_DB[jur] ?? 'KR',
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // 카피(감사 #12): 에러 코드 원문 대신 API 한글 메시지 우선, 없으면 일반 안내.
        setError(data.message ?? '평가 생성에 실패했습니다. 입력 내용을 확인한 뒤 다시 시도해주십시오.');
        setSubmitting(false);
        return;
      }
      const code = data.assessment?.code ?? data.assessment?.assessment_code;
      if (code) {
        startRouteProgress();
        router.push(`/assessments/${code}`);
      } else {
        startRouteProgress();
        router.push('/assessments');
      }
    } catch (e) {
      setError(translateDbError(e));
      setSubmitting(false);
    }
  }

  if (productsLoading) {
    return <LoadingState />;
  }

  if (products.length === 0) {
    return (
      <div>
        <PageHd title="새 변경평가" />
        {/* 빈 화면 한 줄 + 다음 단추(2026-10-08 «설명 글귀는 ⓘ 안으로»: 남는 글 네 가지 중 «빈 화면») */}
        <EmptyState compact title="등록된 제품이 없습니다" description="변경평가는 제품에 붙습니다. 먼저 제품을 등록하십시오." hints={[{ label: '제품 등록', href: '/products' }]} />
      </div>
    );
  }

  return (
    <div>
      {/* 제목 옆 상자 «← 취소» 대신 제목 위 글귀 «← 변경평가 목록» (화면 검토 A11 · A32 · 2026-09-27) */}
      <ListBackLink href="/assessments" label="변경평가 목록" />
      <PageHd title="새 변경평가" />

      {/* 본문 폭: 진행바·알림·폼을 같은 컬럼에 정렬 + 화면 중앙 배치(margin auto).
          넓은 화면에서 좌측 쏠림 없이 균형 + 폭 확대(1100)로 멀티컬럼 섹션 여유. */}
      <div style={{ maxWidth: LAYOUT.wide, margin: '0 auto' }}>
      {error && (
        <div style={{ marginBottom: S[4.5] }}>
          <Alert kind="error" title="평가 실패" onClose={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}

      {/* 변경 영향 진단 결과 prefill 배너 */}
      {treeLevel && (
        <div style={{ marginBottom: S[4.5] }}>
          <Alert
            kind={treeLevel === 'major' ? 'warning' : 'info'}
            title={
              treeLevel === 'major'
                ? '변경 영향 진단 결과: 변경허가 대상'
                : treeLevel === 'minor'
                  ? '변경 영향 진단 결과: 변경신고 대상'
                  : '변경 영향 진단 결과 참고'
            }
          >
            {treeRationale ?? ''}
            <div style={{ fontSize: FS[12], color: T.muted, marginTop: S[1.5], fontFamily: F.ui }}>
              ▸ 이 평가서의 <strong>비고/근거</strong> 란에 진단 결과를 자동 기록할 수 있게 위 정보를 활용하십시오.
            </div>
          </Alert>
        </div>
      )}

      {/* Progress bar */}
      <div
        style={{
          borderRadius: RADIUS.md,
          marginBottom: S[7],
          padding: '14px 18px',
          background: T.surface,
          border: `1px solid ${T.border}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: S[2.5],
          }}
        >
          <div
            style={{
              fontSize: FS[12],
              color: T.muted,
              fontFamily: F.ui,
            }}
          >
            입력 진행도
          </div>
          <div
            style={{
              fontSize: FS[12],
              color: readyToEval ? T.green : T.champagne,
              fontFamily: F.mono,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {completedSteps} / 5 {readyToEval && '✓'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: S[1] }}>
          {steps.map((done, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 3,
                background: done ? T.green : T.border,
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: S[7] }}>
        {/* ① 기본 정보 */}
        <div>
          <SectionHead n="1" title="기본 정보" done={steps[0]} />
          <Grid cols={3} minCol={200} gap={14}>
            <FldRow label="대상 제품" required info="제품을 고르면 환자접촉 · 소프트웨어 · 멸균 정보가 아래에 따라옵니다. 이 정보가 «영향 영역» 진단에 쓰입니다.">
              <Sel
                value={pid}
                onChange={(e) => setPid(e.target.value)}
                opts={products.map((p) => ({
                  v: p.local_id,
                  l: `${p.name}${p.device_class ? ` (${p.device_class})` : ''}`,
                }))}
              />
            </FldRow>
            <FldRow label="변경 단계" required info="출시 전이면 설계 변경 절차를, 출시 후면 허가 변경 · 신고 여부까지 함께 봅니다.">
              <Sel value={stage} onChange={(e) => setStage(e.target.value)} opts={[...CHANGE_STAGES_UI]} />
            </FldRow>
            <FldRow label="관할국" required info="진단에 쓰는 규제 기준이 달라집니다. 한국은 MFDS 변경허가 · 변경신고 기준, EU 는 MDR, 미국은 FDA 기준을 따릅니다. 구독에 없는 시장은 목록에 나오지 않습니다.">
              <Sel
                value={jur}
                onChange={(e) => setJur(e.target.value)}
                opts={Object.keys(JUR_TO_DB).filter((k) =>
                  allowedMarkets.includes(MARKET_FOR_JUR[JUR_TO_DB[k]] ?? 'mfds'),
                )}
              />
            </FldRow>
          </Grid>
          {selectedProduct && (
            <div
              style={{
                borderRadius: RADIUS.md,
                marginTop: S[3],
                padding: '10px 14px',
                background: T.surface2,
                border: `1px solid ${T.border}`,
                fontSize: FS[12],
                color: T.subtle,
                lineHeight: LH.normal,
              }}
            >
              <div style={{ fontSize: FS[12], color: T.muted, fontFamily: F.ui }}>
                {selectedProduct.local_id} · 환자접촉:{' '}
                {selectedProduct.patient_contact
                  ? `있음${selectedProduct.contact_type ? ` (${selectedProduct.contact_type})` : ''}`
                  : '없음'}
                {' · '}SW: {selectedProduct.software_included ? '포함' : '미포함'}
                {' · '}멸균: {selectedProduct.sterile
                  ? selectedProduct.sterilization_method
                    ? `예 (${selectedProduct.sterilization_method})`
                    : '예'
                  : '아니오'}
              </div>
            </div>
          )}
          <div style={{ marginTop: S[4] }}>
            <FldRow label="변경 제목" required>
              <In
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 광선치료 패드 원재료 공급처 변경"
              />
            </FldRow>
          </div>
        </div>

        <Div />

        {/* ② 변경 유형 */}
        <div>
          <SectionHead
            n="2"
            title="변경 유형"
            hint="변경 대상(원재료 · 공급처 · 소프트웨어 · 라벨 등)을 먼저 고르면 그 대상에 맞는 세부 유형이 나옵니다. 세부 유형은 해당하는 것을 모두 고를 수 있습니다."
            done={steps[1]}
          />
          <FldRow label="변경 대상" required>
            <Sel
              value={target}
              onChange={(e) => {
                setTarget(e.target.value as ChangeTarget);
                setSubTypes([]);
              }}
              // 코드 괄호(«(SOFTWARE)») 없이 한글 이름 (A13). SW 미포함 제품이면 소프트웨어를 맨 뒤로 알림과 함께 (A20)
              opts={[
                { v: '', l: '고르십시오' },
                ...[...CHANGE_TARGETS]
                  .sort((a, b) =>
                    selectedProduct && !selectedProduct.software_included
                      ? Number(a === 'SOFTWARE') - Number(b === 'SOFTWARE')
                      : 0,
                  )
                  .map((t) => ({
                    v: t,
                    l:
                      t === 'SOFTWARE' && selectedProduct && !selectedProduct.software_included
                        ? `${CHANGE_TARGETS_KR[t]} (이 제품은 SW 미포함으로 등록됨)`
                        : CHANGE_TARGETS_KR[t],
                  })),
              ]}
            />
          </FldRow>
          <div style={{ marginTop: S[4] }}>
            <Lbl>
              세부 유형 <span style={{ color: T.red }}>*</span>
            </Lbl>
            {/* 여러 개 고르기는 체크 목록(화면 검토 A35 · 2026-09-28): 알약 16개가 «누르는 것 · 고른 것» 을 가르지 못했다.
                체크가 고른 것을 보이므로 아래 «선택됨: …» 줄은 걷었다. 터치 화면에서는 줄 높이 44 */}
            {!target ? (
              <NextStep style={{ marginTop: S[2] }}>변경 대상을 먼저 고르십시오.</NextStep>
            ) : (
              <div
                role="group"
                aria-label="세부 유형"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: `${S[1]}px ${S[4]}px`, marginTop: S[2] }}
              >
                {subTypeOptions.map((st) => (
                  <Checkbox
                    key={st.id}
                    checked={subTypes.includes(st.id)}
                    onChange={() => toggleArr(setSubTypes, subTypes, st.id)}
                    className="qa-touch-44"
                  >
                    {st.label}
                  </Checkbox>
                ))}
              </div>
            )}
          </div>
        </div>

        <Div />

        {/* ③ 변경 내용 */}
        <div>
          <SectionHead
            n="3"
            title="변경 내용"
            hint="명칭 · 버전 · 사양을 짧게 적습니다. 예: 실리콘 A사 · 펌웨어 v1.2 · ISO 10993-5:2009 → 실리콘 B사 · 펌웨어 v2.0 · ISO 10993-5:2021"
            done={steps[2]}
          />
          <Grid cols={2} minCol={240} gap={14}>
            <FldRow label={beforeLbl} required>
              <In
                value={beforeKey}
                onChange={(e) => setBeforeKey(e.target.value)}
                placeholder="예: 실리콘 A사 · 펌웨어 v1.2 · ISO 10993-5:2009"
              />
            </FldRow>
            <FldRow label={afterLbl} required>
              <In
                value={afterKey}
                onChange={(e) => setAfterKey(e.target.value)}
                placeholder="예: 실리콘 B사 · 펌웨어 v2.0 · ISO 10993-5:2021"
              />
            </FldRow>
          </Grid>
          <div style={{ marginTop: S[4] }}>
            <button
              type="button"
              onClick={() => setNoteOpen((v) => !v)}
              style={{
                display: 'flex',
                gap: S[1.5],
                alignItems: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontSize: FS[12],
                color: T.muted,
                fontFamily: F.ui,
              }}
            >
              <span>{noteOpen ? '▾' : '▸'}</span>
              <span>상세 설명 추가 (선택)</span>
            </button>
            {noteOpen && (
              <div style={{ marginTop: S[2.5] }}>
                <Txt
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="추가로 설명이 필요한 내용 (선택)"
                />
              </div>
            )}
          </div>
        </div>

        <Div />

        {/* ④ 변경 사유 */}
        <div>
          <SectionHead
            n="4"
            title="변경 사유"
            hint="이번 변경을 하게 된 이유입니다. 해당하는 것을 모두 고를 수 있습니다. 사유는 변경 통제 기록에 남고, 규제 대응 · 고객 요청처럼 외부 요인이면 근거 문서를 함께 첨부하는 것이 좋습니다."
            done={steps[3]}
          />
          {/* 여러 개 고르기는 체크 목록(화면 검토 A35 · 2026-09-28 · 세부 유형과 같은 모양) */}
          <div
            role="group"
            aria-label="변경 사유"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: `${S[1]}px ${S[4]}px` }}
          >
            {CHANGE_REASONS.map((r) => (
              <Checkbox
                key={r.id}
                checked={reasons.includes(r.id)}
                onChange={() => toggleArr(setReasons, reasons, r.id)}
                className="qa-touch-44"
              >
                {r.label}
              </Checkbox>
            ))}
          </div>
        </div>

        <Div />

        {/* ⑤ R&D 사전 영향 평가 */}
        <div>
          <SectionHead
            n="5"
            title="R&D 사전 영향 평가"
            hint="영역마다 변경이 영향을 줄 가능성이 있는지 R&D 가 먼저 표시합니다. MedQraft Core 는 «영향 가능성 있음» 영역을 우선 분석하고, 둘의 결과가 일치하는지 보여 줍니다."
            done={steps[4]}
          />
          {/* 한꺼번에 고르기 · 초기화는 보조 동작이라 글귀 (화면 검토 A11 · 2026-09-28) */}
          <div style={{ display: 'flex', gap: S[2], marginBottom: S[4], alignItems: 'center' }}>
            <TextAction
              onClick={() => {
                const all: Record<string, 'none' | 'has'> = {};
                IMPACT_CHECKS.forEach((ic) => {
                  all[ic.id] = 'none';
                });
                setImpactChecks(all);
              }}
            >
              전체 «영향 없음» 고르기
            </TextAction>
            <TextAction onClick={() => setImpactChecks({})}>초기화</TextAction>
          </div>
          {/* 모바일(≤767px): 1열 stack: 라벨 / 버튼 그룹 / 상태 표시 줄바꿈 */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media (max-width: 767px) {
              .qa-impact-row { grid-template-columns: 1fr !important; gap: 8px !important; }
              .qa-impact-row > div:last-child { text-align: left !important; }
            }
          ` }} />
          <div>
            {IMPACT_CHECKS.map((ic, i) => {
              const val = impactChecks[ic.id];
              const isLast = i === IMPACT_CHECKS.length - 1;
              return (
                <div
                  key={ic.id}
                  className="qa-impact-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '200px 1fr 70px',
                    gap: S[4],
                    padding: '14px 16px',
                    borderBottom: !isLast ? `1px solid ${T.border}` : 'none',
                    alignItems: 'center',
                    // 고른 줄을 옅은 초록 · 주황 바탕으로 칠하지 않는다. 고름은 칸의 짙은 테두리 + 체크가 말한다 (문서 결)
                    background: T.surface,
                  }}
                >
                  <div>
                    <div style={{ fontSize: FS[12], color: T.text, fontWeight: 500 }}>
                      {ic.label}
                    </div>
                    <div style={{ fontSize: FS[12], color: T.muted, marginTop: S[0.5] }}>
                      {ic.hint}
                    </div>
                  </div>
                  {/* 둘 중 하나 고르기: 공용 선택 모양(짙은 테두리 + 체크 · 뜻 색은 체크에만) + aria-pressed.
                      옅은 초록 · 주황으로 채운 칸이 주 단추 · 상태 색처럼 읽혔다 (화면 검토 A11 · A38 · 2026-09-28) */}
                  <div style={{ display: 'flex', gap: S[1.5] }} role="group" aria-label={`${ic.label} 영향`}>
                    <button
                      type="button"
                      aria-pressed={val === 'none'}
                      onClick={() =>
                        setImpactChecks((prev) => ({ ...prev, [ic.id]: 'none' }))
                      }
                      className="qa-touch-44"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: FS[12],
                        cursor: 'pointer',
                        fontFamily: F.ui,
                        ...choiceLook(val === 'none'),
                      }}
                    >
                      <ChoiceCheck on={val === 'none'} color={T.green} />
                      영향 없음
                    </button>
                    <button
                      type="button"
                      aria-pressed={val === 'has'}
                      onClick={() =>
                        setImpactChecks((prev) => ({ ...prev, [ic.id]: 'has' }))
                      }
                      className="qa-touch-44"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: FS[12],
                        cursor: 'pointer',
                        fontFamily: F.ui,
                        ...choiceLook(val === 'has'),
                      }}
                    >
                      <ChoiceCheck on={val === 'has'} color={T.warning} />
                      영향 가능성 있음
                    </button>
                  </div>
                  <div
                    style={{
                      textAlign: 'right',
                      fontSize: FS[12],
                      // 한글 상태 글이라 본문 글꼴. «플래그» 는 개발 말이라 «검토 대상» 으로 (화면 검토 A44 · A77 · 2026-09-28)
                      fontFamily: F.ui,
                      color: val === 'has' ? T.warning : T.muted,
                    }}
                  >
                    {val === 'none' && '안전'}
                    {val === 'has' && '검토 대상'}
                  </div>
                </div>
              );
            })}
          </div>
          {Object.keys(impactChecks).length > 0 &&
            Object.keys(impactChecks).length < IMPACT_CHECKS.length && (
              <div style={{ marginTop: S[3] }}>
                <InfoBox color={T.warning}>
                  {IMPACT_CHECKS.length - Object.keys(impactChecks).length}개 영역이
                  평가되지 않았습니다.
                </InfoBox>
              </div>
            )}
          {/* 결과 안내는 «다음 할 일 한 줄» 로(2026-10-08 «설명 글귀는 ⓘ 안으로») */}
          {readyToEval && hasImpact && (
            <NextStep style={{ marginTop: S[3] }}>영향 가능성이 있는 영역을 MedQraft Core 가 우선 분석합니다. 아래에서 평가를 실행하십시오.</NextStep>
          )}
          {readyToEval && !hasImpact && (
            <NextStep style={{ marginTop: S[3] }}>전 영역 영향 없음. MedQraft Core 결과와 일치하는지 평가 실행으로 확인합니다.</NextStep>
          )}
        </div>

        {/* R&D 사전 영향 미리보기: Rule Engine 만 실행, 저장 없음 */}
        {orgId && selectedProduct && (
          <AssessmentPreviewPanel
            enabled={!!(title && target && pid)}
            payload={{
              orgId,
              productLocalId: selectedProduct.local_id,
              title,
              target,
              subTypes,
              beforeKey,
              afterKey,
              rdImpact: impactChecks,
              reasons,
            }}
          />
        )}

        {/* Submit */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: S[2.5],
            marginTop: S[3],
            paddingTop: S[6],
            borderTop: `1px solid ${T.border}`,
          }}
        >
          {/* 보조 동작 «취소» 는 글귀 (화면 검토 A11 · 2026-09-27) */}
          <TextLinkAction href="/assessments">취소</TextLinkAction>
          <Btn onClick={handleEvaluate} disabled={!readyToEval || submitting}>
            {submitting ? '평가 중...' : 'MedQraft Core 평가 실행 →'}
          </Btn>
        </div>
      </div>
      </div>
    </div>
  );
}
