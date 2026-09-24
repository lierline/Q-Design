'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { Btn, PageHd, Field, In, Sel, Txt, FormActions, Section, SectionProgressCard } from '@/lib/design/components';
import { DocumentArtifactPanel } from '@/components/DocumentArtifactPanel';
import { S, FS, F, T, alpha, RADIUS, ICON, LAYOUT } from '@/lib/design/tokens';
import {
  PMDA_CLASS_LABEL,
  PMDA_CLASS_HINT,
  CERT_STATUS_LABEL,
  PATHWAY_LABEL,
  pathwayFor,
  MAH_TYPE_LABEL,
  PMDA_STATUS_LABEL,
  PMDA_STATUS_FLOW,
  SECTION_STATUS_META,
  SECTION_STATUS_CYCLE,
  pmdaSectionProgress,
  type PmdaClass,
  type CertStatus,
  type MahType,
  type PmdaStatus,
  type PmdaSection,
} from '@/lib/pmda';

export interface PmdaFull {
  id: string;
  code: string;
  device_name: string;
  device_class: PmdaClass;
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
  canReview = false,
  canApprove = false,
}: {
  initial: PmdaFull;
  canReview?: boolean;
  canApprove?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<PmdaStatus>(initial.status);
  const [deviceClass, setDeviceClass] = useState<PmdaClass>(initial.device_class);
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
  const readOnly = status === 'withdrawn';
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

  async function save(nextStatus?: PmdaStatus) {
    setSaving(true);
    try {
      const res = await fetch(`/api/pmda/${initial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_class: deviceClass,
          cert_standard_status: certStatus,
          jmdn_code: jmdn.trim() || null,
          mah_name: mahName.trim() || null,
          mah_type: mahType,
          fmr_number: fmr.trim() || null,
          certification_no: certNo.trim() || null,
          sections,
          notes: notes.trim() || null,
          ...(nextStatus ? { status: nextStatus } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message ?? json.error ?? '저장 실패');
        setSaving(false);
        return;
      }
      if (nextStatus) setStatus(nextStatus);
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
      <Link href="/pmda" style={{ display: 'inline-flex', alignItems: 'center', gap: S[1.5], fontSize: FS[13], color: T.subtle, textDecoration: 'none', marginBottom: S[3] }}>
        <ArrowLeft size={ICON.sizeXs} aria-hidden="true" />
        목록으로
      </Link>
      <PageHd title={`${initial.code} · ${initial.device_name}`} sub={`${PMDA_CLASS_LABEL[deviceClass]} · ${PATHWAY_LABEL[pathway]} · ${PMDA_STATUS_LABEL[status]}`} />

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
        <div style={{ marginBottom: S[5], padding: '12px 16px', borderRadius: RADIUS.md, border: `1px solid ${alpha(T.champagne, 0.3)}`, background: alpha(T.champagne, 0.05), fontFamily: F.serif, fontSize: FS[13], color: T.text }}>
          철회(withdrawn)된 건입니다. 기록 보존을 위해 편집할 수 없습니다.
        </div>
      )}

      <SectionProgressCard label="STED 완료율 (적용 섹션 기준)" value={progress} />

      <Section title="등급 · 認証基準 · 경로">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: S[2], marginBottom: S[2.5] }}>
          {CLASSES.map((c) => (
            <button key={c} type="button" onClick={() => !readOnly && setDeviceClass(c)} disabled={readOnly} style={{ padding: '8px 14px', fontFamily: F.mono, fontSize: FS[11], background: deviceClass === c ? T.champagne : 'transparent', color: deviceClass === c ? T.bg : T.text, border: `1px solid ${deviceClass === c ? T.champagne : T.border}`, borderRadius: RADIUS.md, cursor: readOnly ? 'default' : 'pointer' }}>{PMDA_CLASS_LABEL[c]}</button>
          ))}
        </div>
        <div style={{ fontFamily: F.serif, fontSize: FS[11], color: T.subtle, marginBottom: S[2.5] }}>{PMDA_CLASS_HINT[deviceClass]}</div>
        <div className="qa-pmda-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: S[3], alignItems: 'end' }}>
          <Field id="pmda-cert" label="認証基準(Ninsho Kijun) 유무">
            <Sel id="pmda-cert" value={certStatus} onChange={(e) => setCertStatus(e.target.value as CertStatus)} ro={readOnly} opts={CERTS.map((c) => ({ v: c, l: CERT_STATUS_LABEL[c] }))} />
          </Field>
          <div style={{ padding: '8px 12px', borderRadius: RADIUS.sm, border: `1px solid ${pathway === 'verify' ? alpha(T.warning, 0.4) : alpha(T.champagne, 0.3)}`, background: alpha(pathway === 'verify' ? T.warning : T.champagne, 0.05) }}>
            <span style={{ fontFamily: F.mono, fontSize: FS[10], letterSpacing: '0.08em', color: T.subtle, textTransform: 'uppercase' }}>도출 경로</span>
            <div style={{ fontFamily: F.serif, fontSize: FS[13], fontWeight: 600, color: pathway === 'verify' ? T.warning : T.text }}>{PATHWAY_LABEL[pathway]}</div>
          </div>
        </div>
      </Section>

      <Section title="STED 섹션 (상태 클릭 / 적용 토글)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: S[1.5] }}>
          {sections.map((s) => {
            const meta = SECTION_STATUS_META[s.status];
            const dim = !s.applicable;
            return (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: S[3], padding: '10px 14px', background: T.surface, border: `1px solid ${T.border}`, borderLeft: `2px solid ${meta.color}`, borderRadius: RADIUS.sm, opacity: dim ? 0.5 : 1 }}>
                <button type="button" onClick={() => toggleApplicable(s.key)} disabled={readOnly} style={{ display: 'flex', alignItems: 'center', gap: S[2], background: 'transparent', border: 'none', cursor: readOnly ? 'default' : 'pointer', textAlign: 'left', minWidth: 0 }}>
                  <span style={{ fontFamily: F.mono, fontSize: FS[11], color: s.applicable ? T.champagne : T.muted, flexShrink: 0 }}>{s.applicable ? '☑' : '☐'}</span>
                  <span style={{ fontFamily: F.serif, fontSize: FS[13], color: T.text }}>{s.label}</span>
                </button>
                <button type="button" onClick={() => cycleSection(s.key)} disabled={dim || readOnly} style={{ fontFamily: F.mono, fontSize: FS[10], fontWeight: 500, letterSpacing: '0.1em', color: meta.color, textTransform: 'uppercase', padding: '3px 10px', border: `1px solid ${alpha(meta.color, 0.4)}`, borderRadius: RADIUS.md, background: 'transparent', cursor: dim || readOnly ? 'default' : 'pointer', flexShrink: 0 }}>{meta.label}</button>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="행위자 · 인증 정보 (MAH/D-MAH · FMR · 認証番号)">
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
          <Field id="pmda-certno" label="認証番号 / 承認番号">
            <In id="pmda-certno" value={certNo} onChange={(e) => setCertNo(e.target.value)} ro={readOnly} placeholder="취득 후" />
          </Field>
        </div>
      </Section>

      <Section title="비고">
        <Txt value={notes} onChange={(e) => setNotes(e.target.value)} ro={readOnly} rows={2} placeholder="PMDA/RCB 照会 대응, 임상 bridging 전략 등" />
      </Section>

      <Section title="상태">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: S[2] }}>
          {STATUS_OPTIONS.map((s) => (
            <button key={s} type="button" onClick={() => !readOnly && setStatus(s)} disabled={readOnly} style={{ padding: '8px 14px', fontFamily: F.mono, fontSize: FS[11], letterSpacing: '0.06em', background: status === s ? T.champagne : 'transparent', color: status === s ? T.bg : T.text, border: `1px solid ${status === s ? T.champagne : T.border}`, borderRadius: RADIUS.md, cursor: readOnly ? 'default' : 'pointer' }}>
              {PMDA_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <div style={{ marginTop: S[2], fontFamily: F.mono, fontSize: FS[9], color: T.subtle, letterSpacing: '0.06em' }}>
          흐름: {PMDA_STATUS_FLOW.map((s) => PMDA_STATUS_LABEL[s]).join(' → ')}
        </div>
      </Section>

      {!readOnly && (
        <FormActions>
          <Btn sm onClick={() => save(status !== initial.status ? status : undefined)} disabled={saving} style={{ minWidth: 140 }}>
            {saving ? '저장 중...' : '저장'}
          </Btn>
        </FormActions>
      )}
    </div>
  );
}
