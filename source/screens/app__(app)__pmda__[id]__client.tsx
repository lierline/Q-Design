'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChangeReasonPanel, type LastChangeView, type PendingChange } from '@/components/ChangeReasonPanel';
import { missingChangeReason } from '@/lib/api/change-reason';
import { useToast } from '@/components/Toast';
import { Btn, PageHd, Field, In, Sel, Txt, FormActions, Section, SectionProgressCard, Tag } from '@/lib/design/components';
import { DocumentArtifactPanel } from '@/components/DocumentArtifactPanel';
import { S, FS, F, T, alpha, RADIUS, LAYOUT } from '@/lib/design/tokens';
import { SubmissionSectionChecklist } from '@/components/SubmissionSectionChecklist';
import {
  PMDA_CLASS_LABEL,
  PMDA_CLASS_HINT,
  CERT_STATUS_LABEL,
  PATHWAY_LABEL,
  pathwayFor,
  MAH_TYPE_LABEL,
  PMDA_STATUS_LABEL,
  PMDA_STATUS_FLOW,
  SECTION_STATUS_CYCLE,
  pmdaSectionProgress,
  type PmdaClass,
  type CertStatus,
  type MahType,
  type PmdaStatus,
  type PmdaSection,
} from '@/lib/pmda';
import { ListBackLink } from '@/components/ListBackLink';
import { ChoiceCheck, choiceLook } from '@/lib/design/segmented-choice';
import { ProductLinkField } from '@/components/ProductPickField';
import { EMPTY_ORG_PRODUCTS, type OrgProductList } from '@/lib/products/org-products';
import { StatusChangeSection } from '@/components/StatusChangeSection';
import { LOCKED_STATUSES } from '@/lib/api/locked-statuses';

export interface PmdaFull {
  id: string;
  code: string;
  device_name: string;
  device_class: PmdaClass;
  product_id: string | null;
  cert_standard_status: CertStatus;
  jmdn_code: string | null;
  mah_name: string | null;
  mah_type: MahType | null;
  fmr_number: string | null;
  certification_no: string | null;
  sections: PmdaSection[] | null;
  status: PmdaStatus;
  notes: string | null;
}

const CLASSES: PmdaClass[] = ['i', 'ii', 'iii', 'iv'];
const CERTS: CertStatus[] = ['exists', 'absent', 'unknown'];
const STATUS_OPTIONS: PmdaStatus[] = ['preparing', 'submitted', 'under_review', 'approved', 'withdrawn'];

export function PmdaDetailClient({
  initial,
  products = EMPTY_ORG_PRODUCTS,
  canReview = false,
  canApprove = false,
  lastChange = null,
}: {
  initial: PmdaFull;
  products?: OrgProductList;
  canReview?: boolean;
  canApprove?: boolean;
  /** 마지막 상태 · 등급 변경(누가 · 언제 · 까닭) · 화면 검토 A70 */
  lastChange?: LastChangeView | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<PmdaStatus>(initial.status);
  const [deviceClass, setDeviceClass] = useState<PmdaClass>(initial.device_class);
  // 상태 · 등급을 바꾸는 까닭(화면 검토 A70 · 2026-09-28). 등급이 바뀌면 등록 경로와 서류 목록이 바뀐다(서버도 본다)
  const [reason, setReason] = useState('');
  // 연결 제품(화면 검토 A57 · 2026-09-27): 만든 뒤에도 잇거나 바꿀 수 있다. 저장하면 API 가 같은 조직 제품인지 본다
  const [productId, setProductId] = useState(initial.product_id ?? '');
  const [certStatus, setCertStatus] = useState<CertStatus>(initial.cert_standard_status);
  const [jmdn, setJmdn] = useState(initial.jmdn_code ?? '');
  const [mahName, setMahName] = useState(initial.mah_name ?? '');
  const [mahType, setMahType] = useState<MahType>(initial.mah_type ?? 'dmah');
  const [fmr, setFmr] = useState(initial.fmr_number ?? '');
  const [certNo, setCertNo] = useState(initial.certification_no ?? '');
  const [sections, setSections] = useState<PmdaSection[]>(initial.sections ?? []);
  const [notes, setNotes] = useState(initial.notes ?? '');
  const [saving, setSaving] = useState(false);

  // 철회(withdrawn)된 건만 편집 잠금. 인증·승인(approved) 후엔 認証番号 등 사후 기록 유지.
  // 🔴 잠금은 «저장된» 상태로 본다. 고른 상태로 보면 «철회» 를 고르는 순간 저장 단추 · 까닭 칸이 사라져
  //    철회를 저장할 수 없었다(화면 검토 A17 · 2026-09-28 발견)
  const readOnly = initial.status === 'withdrawn';
  const progress = pmdaSectionProgress(sections);
  const pathway = pathwayFor(deviceClass, certStatus);

  function cycleSection(key: string) {
    if (readOnly) return;
    setSections((arr) => arr.map((s) => {
      if (s.key !== key) return s;
      const idx = SECTION_STATUS_CYCLE.indexOf(s.status);
      return { ...s, status: SECTION_STATUS_CYCLE[(idx + 1) % SECTION_STATUS_CYCLE.length] };
    }));
  }
  function toggleApplicable(key: string) {
    if (readOnly) return;
    setSections((arr) => arr.map((s) => (s.key === key ? { ...s, applicable: !s.applicable } : s)));
  }

  // 바뀌는 것(화면 검토 A70): 등급 · 상태. 등급이 바뀌면 인허가 경로와 서류 목록이 바뀔 수 있다
  const pending: PendingChange[] = [];
  if (deviceClass !== initial.device_class) {
    const before = pathwayFor(initial.device_class, initial.cert_standard_status);
    pending.push({
      label: '등급',
      from: PMDA_CLASS_LABEL[initial.device_class],
      to: PMDA_CLASS_LABEL[deviceClass],
      consequence:
        before !== pathway
          ? `인허가 경로가 «${PATHWAY_LABEL[before]}» 에서 «${PATHWAY_LABEL[pathway]}» 로 바뀌고 서류 목록이 달라집니다`
          : '서류 목록을 다시 확인하십시오',
    });
  }
  if (status !== initial.status) {
    pending.push({
      label: '상태',
      from: PMDA_STATUS_LABEL[initial.status],
      to: PMDA_STATUS_LABEL[status],
      consequence: status === 'withdrawn' ? '철회하면 이 기록의 내용이 잠깁니다' : undefined,
    });
  }
  const reasonMissing = missingChangeReason(pending.length > 0, reason);

  async function save(nextStatus?: PmdaStatus) {
    setSaving(true);
    try {
      const res = await fetch(`/api/pmda/${initial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_class: deviceClass,
          product_id: productId || null,
          cert_standard_status: certStatus,
          jmdn_code: jmdn.trim() || null,
          mah_name: mahName.trim() || null,
          mah_type: mahType,
          fmr_number: fmr.trim() || null,
          certification_no: certNo.trim() || null,
          sections,
          notes: notes.trim() || null,
          ...(nextStatus ? { status: nextStatus } : {}),
          ...(pending.length > 0 ? { change_reason: reason.trim() } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message ?? json.error ?? '저장 실패');
        setSaving(false);
        return;
      }
      if (nextStatus) setStatus(nextStatus);
      setReason('');
      toast.success('저장됨');
      setSaving(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: LAYOUT.detail, margin: '0 auto' }}>
      <style>{`
        @media (max-width: 640px) {
          .qa-pmda-grid-2,
          .qa-pmda-grid-2fr1fr,
          .qa-pmda-grid-3 {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      {/* «← PMDA 목록» 한 형식 (화면 검토 A32 · A74 · 2026-09-27) */}
      <ListBackLink href="/pmda" label="PMDA 목록" />
      {/* 상태는 제목 위 작은 글씨가 아니라 제목 줄 배지로 (화면 검토 A68 · 2026-09-27) */}
      <PageHd
        title={`${initial.code} · ${initial.device_name}`}
        sub={`${PMDA_CLASS_LABEL[deviceClass]} · ${PATHWAY_LABEL[pathway]}`}
        actions={<Tag size="md" dot color={T.blue}>{PMDA_STATUS_LABEL[initial.status]}</Tag>}
      />

      <div style={{ marginBottom: S[5] }}>
        <DocumentArtifactPanel
          heading="PMDA 기술문서 (STED)"
          entityType="pmda"
          entityId={initial.id}
          docCodes={['summary_of_attached_docs', 'technical_file', 'essential_principles']}
          canReview={canReview}
          canApprove={canApprove}
        />
      </div>

      {readOnly && (
        <div style={{ marginBottom: S[5], padding: '12px 16px', borderRadius: RADIUS.md, border: `1px solid ${T.border}`, background: T.surface, fontFamily: F.serif, fontSize: FS[13], color: T.text }}>
          철회(withdrawn)된 건입니다. 기록 보존을 위해 편집할 수 없습니다.
        </div>
      )}

      <SectionProgressCard label="STED 완료율 (적용 섹션 기준)" value={progress} />

      {/* 등급별 경로 설명은 구역 제목 ⓘ 로(2026-10-08 «설명 글귀는 ⓘ 안으로»). 고른 등급에 맞는 설명이 뜬다 */}
      <Section title="등급 · 인증기준 · 경로" info={PMDA_CLASS_HINT[deviceClass]}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: S[2], marginBottom: S[2.5] }}>
          {CLASSES.map((c) => (
            <button aria-pressed={deviceClass === c} className="qa-touch-44" key={c} type="button" onClick={() => !readOnly && setDeviceClass(c)} disabled={readOnly} style={{ padding: '8px 14px', fontFamily: F.ui, fontSize: FS[12], ...choiceLook(deviceClass === c), cursor: readOnly ? 'default' : 'pointer' }}><ChoiceCheck on={deviceClass === c} />{PMDA_CLASS_LABEL[c]}</button>
          ))}
        </div>
        <div className="qa-pmda-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: S[3], alignItems: 'end' }}>
          <Field id="pmda-cert" label="인증기준(認証基準) 유무">
            <Sel id="pmda-cert" value={certStatus} onChange={(e) => setCertStatus(e.target.value as CertStatus)} ro={readOnly} opts={CERTS.map((c) => ({ v: c, l: CERT_STATUS_LABEL[c] }))} />
          </Field>
          <div style={{ padding: '8px 12px', borderRadius: RADIUS.sm, border: `1px solid ${pathway === 'verify' ? alpha(T.warning, 0.4) : alpha(T.champagne, 0.3)}`, background: alpha(pathway === 'verify' ? T.warning : T.champagne, 0.05) }}>
            <span style={{ fontFamily: F.ui, fontSize: FS[12], color: T.subtle }}>도출 경로</span>
            <div style={{ fontFamily: F.serif, fontSize: FS[13], fontWeight: 600, color: pathway === 'verify' ? T.warning : T.text }}>{PATHWAY_LABEL[pathway]}</div>
          </div>
        </div>
      </Section>

      <Section title="STED 섹션">
        {/* 네 시장이 같은 목록 한 벌 · 사용법은 목록 위 안내 글 (화면 검토 A44 · 2026-09-28) */}
        <SubmissionSectionChecklist sections={sections} readOnly={readOnly} onToggle={toggleApplicable} onCycle={cycleSection} />
      </Section>

      <Section title="행위자 · 인증 정보 (MAH/D-MAH · FMR · 인증 번호)">
        <div style={{ marginBottom: S[3] }}>
          <ProductLinkField id="pmda-product" products={products} value={productId} onChange={setProductId} ro={readOnly} />
        </div>
        <div className="qa-pmda-grid-2fr1fr" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: S[3], marginBottom: S[3] }}>
          <Field id="pmda-mah" label="제조판매업자 (MAH / D-MAH)">
            <In id="pmda-mah" value={mahName} onChange={(e) => setMahName(e.target.value)} ro={readOnly} placeholder="일본 내 MAH 또는 선임(D-MAH)" />
          </Field>
          <Field id="pmda-mahtype" label="유형">
            <Sel id="pmda-mahtype" value={mahType} onChange={(e) => setMahType(e.target.value as MahType)} ro={readOnly} opts={(['mah', 'dmah'] as MahType[]).map((t) => ({ v: t, l: MAH_TYPE_LABEL[t] }))} />
          </Field>
        </div>
        <div className="qa-pmda-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: S[3] }}>
          <Field id="pmda-jmdn" label="JMDN 코드">
            <In id="pmda-jmdn" value={jmdn} onChange={(e) => setJmdn(e.target.value)} ro={readOnly} placeholder="분류·기준 매핑" />
          </Field>
          <Field id="pmda-fmr" label="외국제조업자등록 (FMR)">
            <In id="pmda-fmr" value={fmr} onChange={(e) => setFmr(e.target.value)} ro={readOnly} placeholder="FMR 번호" />
          </Field>
          <Field id="pmda-certno" label="인증 · 승인 번호 (認証番号 / 承認番号)">
            <In id="pmda-certno" value={certNo} onChange={(e) => setCertNo(e.target.value)} ro={readOnly} placeholder="취득 후" />
          </Field>
        </div>
      </Section>

      <Section title="비고">
        <Txt value={notes} onChange={(e) => setNotes(e.target.value)} ro={readOnly} rows={2} placeholder="PMDA/RCB 조회(照会) 대응, 임상 브리징 전략 등" />
      </Section>

      <Section title="상태">
        <StatusChangeSection
          id="pmda-status"
          lockedStatuses={LOCKED_STATUSES.pmda_submissions}
          trackLabel="PMDA 진행 단계"
          flow={PMDA_STATUS_FLOW}
          options={STATUS_OPTIONS}
          labels={PMDA_STATUS_LABEL}
          saved={initial.status}
          value={status}
          onChange={setStatus}
          locked={readOnly}
        />
      </Section>

      {!readOnly && (
        <ChangeReasonPanel id="pmda-change" changes={pending} reason={reason} onReason={setReason} lastChange={lastChange} />
      )}

      {!readOnly && (
        <FormActions>
          <Btn sm onClick={() => save(status !== initial.status ? status : undefined)} pending={saving} disabled={!!reasonMissing} title={reasonMissing ?? undefined} style={{ minWidth: 140 }}>
            저장
          </Btn>
        </FormActions>
      )}
    </div>
  );
}
