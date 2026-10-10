'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChangeReasonPanel, type LastChangeView, type PendingChange } from '@/components/ChangeReasonPanel';
import { missingChangeReason } from '@/lib/api/change-reason';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { Btn, Bx, Checkbox, PageHd, Field, In, Txt, FormActions, Section, DetailRow, Tag } from '@/lib/design/components';
import { S, FS, F, T, RADIUS, LAYOUT } from '@/lib/design/tokens';
import { CTL } from '@/lib/design/grain';
import { Plus } from '@/components/q-design-icons/Plus';
import { Trash2 } from '@/components/q-design-icons/Trash2';
import { PageGuide } from '@/components/PageGuide';
import {
  ISSUING_AGENCY_LABEL,
  UDI_STATUS_LABEL,
  UDI_MARKET_STATE_LABEL,
  PI_COMPONENT_META,
  SUBMISSION_TARGETS,
  PACKAGE_LEVEL_OPTIONS,
  type IssuingAgency,
  type UdiStatus,
  type PiComponents,
  type PackageLevel,
  type SubmissionDates,
} from '@/lib/udi';
import { ListBackLink } from '@/components/ListBackLink';
import { choiceLook } from '@/lib/design/segmented-choice';
import { ProductLinkField } from '@/components/ProductPickField';
import { TextAction, TextLinkAction } from '@/components/TextAction';
import { FormNote } from '@/components/FormNote';
import { EMPTY_ORG_PRODUCTS, type OrgProductList } from '@/lib/products/org-products';
import { LOCKED_STATUSES } from '@/lib/api/locked-statuses';

function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export interface UdiFull {
  id: string;
  device_name: string;
  product_id: string | null;
  brand_name: string | null;
  udi_di: string;
  issuing_agency: IssuingAgency;
  gmdn_code: string | null;
  pi_components: PiComponents;
  package_levels: PackageLevel[] | null;
  status: UdiStatus;
  fda_gudid_submitted: boolean;
  eudamed_submitted: boolean;
  mfds_udi_submitted: boolean;
  submission_dates: SubmissionDates | null;
  not_applicable_markets?: string[] | null;
  notes: string | null;
}

const STATUS_OPTIONS: UdiStatus[] = ['draft', 'active', 'obsolete'];

export function UdiDetailClient({
  initial,
  linkedProduct,
  productChanges = [],
  products = EMPTY_ORG_PRODUCTS,
  lastChange = null,
}: {
  initial: UdiFull;
  linkedProduct?: { id: string; name: string } | null;
  productChanges?: Array<{ id: string; code: string; title: string }>;
  products?: OrgProductList;
  /** 마지막 상태 변경(누가 · 언제 · 까닭) · 화면 검토 A70 */
  lastChange?: LastChangeView | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<UdiStatus>(initial.status);
  // 상태를 바꾸는 까닭(화면 검토 A70 · 2026-09-28). 폐기는 기록을 잠그므로 까닭 없이 못 바꾼다(서버도 본다)
  const [reason, setReason] = useState('');
  const pending: PendingChange[] =
    status !== initial.status
      ? [{
          label: '상태',
          from: UDI_STATUS_LABEL[initial.status],
          to: UDI_STATUS_LABEL[status],
          consequence: status === 'obsolete' ? '폐기하면 이 기록은 잠겨 더 고칠 수 없습니다' : undefined,
        }]
      : [];
  const reasonMissing = missingChangeReason(pending.length > 0, reason);
  // 연결 제품(화면 검토 A57 · 2026-09-27). 폐기(저장된 상태 기준)면 API 가 기록 전체를 잠그므로 고르지 못하게 둔다
  const [productId, setProductId] = useState(initial.product_id ?? '');
  const locked = (LOCKED_STATUSES.udi_records as readonly string[]).includes(initial.status);
  const [pi, setPi] = useState<PiComponents>(initial.pi_components ?? {});
  const [pkgs, setPkgs] = useState<PackageLevel[]>(initial.package_levels ?? []);
  const [subs, setSubs] = useState({
    fda_gudid_submitted: initial.fda_gudid_submitted,
    eudamed_submitted: initial.eudamed_submitted,
    mfds_udi_submitted: initial.mfds_udi_submitted,
  });
  const [subDates, setSubDates] = useState<SubmissionDates>(initial.submission_dates ?? {});
  // 팔지 않는 시장(화면 검토 A51 · 마이그 0421). 제출함과 겹치지 않는다(고르면 제출함을 끈다)
  const [naMarkets, setNaMarkets] = useState<string[]>(initial.not_applicable_markets ?? []);
  function setMarketState(key: string, market: string, state: 'submitted' | 'pending' | 'na') {
    const on = subs[key as keyof typeof subs];
    if (state === 'na') {
      if (on) setSubs((s) => ({ ...s, [key]: false }));
      setNaMarkets((a) => (a.includes(market) ? a : [...a, market]));
      return;
    }
    setNaMarkets((a) => a.filter((x) => x !== market));
    if ((state === 'submitted') !== on) toggleSubmit(key, market);
  }

  function toggleSubmit(key: string, dateKey: string) {
    setSubs((s) => {
      const next = !s[key as keyof typeof s];
      // 제출 ON 시 제출일이 비었으면 오늘로 자동 기입 (UX). OFF 해도 날짜는 보존.
      if (next) {
        setSubDates((d) => (d[dateKey]?.submitted ? d : { ...d, [dateKey]: { ...d[dateKey], submitted: todayYmd() } }));
      }
      return { ...s, [key]: next };
    });
  }
  function setSubDate(dateKey: string, field: 'submitted' | 'due', value: string) {
    setSubDates((d) => ({ ...d, [dateKey]: { ...d[dateKey], [field]: value || null } }));
  }
  const [notes, setNotes] = useState(initial.notes ?? '');
  const [saving, setSaving] = useState(false);

  async function save(nextStatus?: UdiStatus) {
    setSaving(true);
    try {
      const res = await fetch(`/api/udi/${initial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId || null,
          pi_components: pi,
          package_levels: pkgs.filter((p) => p.udi_di.trim()),
          ...subs,
          not_applicable_markets: naMarkets,
          submission_dates: subDates,
          notes: notes.trim() || null,
          ...(nextStatus ? { status: nextStatus, change_reason: reason.trim() } : {}),
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

  function addPkg() {
    setPkgs((p) => [...p, { level: 'box', udi_di: '', quantity: 1 }]);
  }
  function updatePkg(i: number, patch: Partial<PackageLevel>) {
    setPkgs((p) => p.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function removePkg(i: number) {
    setPkgs((p) => p.filter((_, idx) => idx !== i));
  }
  const fieldStyle: React.CSSProperties = { padding: '9px 11px', fontFamily: F.serif, fontSize: FS[13], background: T.surface, border: `1px solid ${CTL}`, borderRadius: RADIUS.md, color: T.text, minHeight: 40 };

  return (
    <div style={{ maxWidth: LAYOUT.wide, margin: '0 auto' }}>
      <style>{`
        .qa-udi-detail { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 22px; align-items: start; }
        @media (max-width: 900px) { .qa-udi-detail { grid-template-columns: 1fr; } }
      `}</style>
      {/* «← UDI 목록» 한 형식 (화면 검토 A32 · A74 · 2026-09-27) */}
      <ListBackLink href="/udi" label="UDI 목록" />
      {/* 상태는 제목 위 작은 글씨가 아니라 제목 줄 배지로 (화면 검토 A68 · 2026-09-27) */}
      <PageHd
        title={`${initial.device_name}${initial.brand_name ? ' · ' + initial.brand_name : ''}`}
        sub={`UDI-DI ${initial.udi_di} · ${ISSUING_AGENCY_LABEL[initial.issuing_agency]}`}
        actions={<Tag size="md" dot color={T.blue}>{UDI_STATUS_LABEL[status]}</Tag>}
      />

      {/* 화면 설명은 화면 머리 ⓘ 로, 구역 설명은 Section info= 로(묶음 6 · 2026-10-08). 옛 도움말 상자 넷을 걷었다 */}
      <PageGuide pageId="udi" />

      <div className="qa-udi-detail">
        {/* ── 좌: 식별·구성 (이 UDI 는 무엇인가) ── */}
        <div>
      {/* DI 정보 (read-only) */}
      <Section title="식별자 정보">
        <Bx style={{ padding: S[4], borderRadius: RADIUS.md, borderColor: T.border }}>
          <DetailRow label="UDI-DI" value={<span style={{ fontFamily: F.mono }}>{initial.udi_di}</span>} />
          <DetailRow label="발행기관" value={ISSUING_AGENCY_LABEL[initial.issuing_agency]} />
          {initial.gmdn_code && <DetailRow label="GMDN" value={initial.gmdn_code} />}
        </Bx>
        {/* 연결 제품: 읽기 줄 대신 고르는 칸(화면 검토 A57 · 2026-09-27). 만든 뒤에도 잇거나 바꿀 수 있다.
            저장하면 API 가 같은 조직 제품인지 본다. 폐기된 UDI 는 잠긴다(API 와 같은 목록) */}
        <div style={{ marginTop: S[3] }}>
          <ProductLinkField id="udi-product" products={products} value={productId} onChange={setProductId} ro={locked} />
          {linkedProduct && (
            <div style={{ marginTop: S[1] }}>
              <TextLinkAction href={`/products?focus=${linkedProduct.id}`}>{linkedProduct.name} 제품 화면 열기</TextLinkAction>
            </div>
          )}
        </div>
      </Section>

      {/* PI 구성 */}
      <Section
        title="생산 식별자 (UDI-PI): 라벨 포함 항목"
        info="PI 는 생산 로트마다 바뀌는 정보입니다. 여기서는 이 제품 라벨에 어떤 PI 를 넣을지 구성만 정합니다. 실제 값은 생산 때 채워집니다."
      >
        {/* 여러 개 고르기는 체크 목록(화면 검토 A35 · A66 · 2026-09-28). 초록 알약이 «누르는 것 · 고른 것» 을 가르지 못했다 */}
        <div role="group" aria-label="라벨에 넣을 생산 식별자" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: `${S[1]}px ${S[4]}px` }}>
          {PI_COMPONENT_META.map((m) => (
            <Checkbox key={m.key} checked={!!pi[m.key]} onChange={(next) => setPi((p) => ({ ...p, [m.key]: next }))} className="qa-touch-44">
              {m.label}
            </Checkbox>
          ))}
        </div>
      </Section>

      {/* 포장 단계 UDI */}
      <Section
        title="포장 단계 UDI"
        info={<>기본 단위(each)는 위 <span style={{ fontFamily: F.mono }}>{initial.udi_di}</span> 입니다. 박스 · 케이스 등 상위 포장마다 별도 UDI-DI 가 필요합니다 (FDA 21 CFR 830.50 · EU MDR Annex VI).</>}
      >
        {/* 인라인 행 편집기: raw 유지: Sel/In 은 width 100% 고정이라 행 레이아웃(가변폭·88px 수량·mono)·number min·title 을 공통 props 로 보존 불가 */}
        {pkgs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: S[2], marginBottom: S[2.5] }}>
            {pkgs.map((row, i) => (
              <div key={i} style={{ display: 'flex', gap: S[2], alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={row.level} onChange={(e) => updatePkg(i, { level: e.target.value })} style={{ ...fieldStyle, cursor: 'pointer' }}>
                  {PACKAGE_LEVEL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <input value={row.udi_di} onChange={(e) => updatePkg(i, { udi_di: e.target.value })} placeholder="이 포장의 UDI-DI" style={{ ...fieldStyle, fontFamily: F.mono, flex: 1, minWidth: 150 }} />
                <input type="number" min={1} value={row.quantity} onChange={(e) => updatePkg(i, { quantity: Math.max(1, Number(e.target.value) || 1) })} title="하위 단계 포함 수량" style={{ ...fieldStyle, width: 88 }} />
                <TextAction onClick={() => removePkg(i)} label={`포장 단계 ${i + 1} 삭제`}>
                  <Trash2 size={14} aria-hidden="true" />
                </TextAction>
              </div>
            ))}
          </div>
        )}
        {/* 줄 더하기는 보조 동작이라 글귀로(화면 검토 A11 · 2026-09-28). 점선 상자가 주 단추처럼 보였다 */}
        <TextAction onClick={addPkg}>
          <Plus size={13} aria-hidden="true" style={{ marginRight: S[1] }} />포장 단계 추가
        </TextAction>
      </Section>
        </div>

        {/* ── 우: 추적·이행 (어디까지 했나: UDI 관리의 핵심) ── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* 규제기관 제출 상태 + 제출일/갱신기한 */}
      <Section
        title="규제기관 제출 상태"
        info="각 시장의 UDI 데이터베이스(미국 GUDID · EU EUDAMED · 한국 MFDS)에 등록했는지 추적합니다. 해당 시장에 판매하려면 제출이 의무입니다."
      >
        {/* 시장 줄은 상자 · 초록 칠 없이 괘선 장부로(화면 검토 A35 · A76 · 2026-09-28). 제출 여부는 고른 칸이 말한다 */}
        <div style={{ display: 'flex', flexDirection: 'column', borderTop: `1px solid ${T.border}` }}>
          {SUBMISSION_TARGETS.map((t) => {
            const on = subs[t.key as keyof typeof subs];
            const d = subDates[t.dateKey] ?? {};
            const due = d.due ?? '';
            const dueDays = due ? Math.ceil((new Date(due).getTime() - Date.now()) / 86_400_000) : null;
            return (
              <div key={t.key} style={{ padding: `${S[3]}px 0`, borderBottom: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: S[2], flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: F.ui, fontSize: FS[13], fontWeight: 600, color: T.text, minWidth: 96 }}>{t.label}</span>
                  {/*
                    시장마다 세 가지를 고른다: 제출함 · 미제출 · 대상 아님 (화면 검토 A51 · 2026-09-28 · 마이그 0421).
                    전에는 «대상 아님» 을 남길 칸이 없어, 팔지 않는 시장도 영영 «미제출» 로 보였다.
                  */}
                  <div role="radiogroup" aria-label={`${t.label} 제출 상태`} style={{ display: 'inline-flex', gap: S[1.5], flexWrap: 'wrap' }}>
                    {(['submitted', 'pending', 'na'] as const).map((st) => {
                      const cur = on ? 'submitted' : naMarkets.includes(t.dateKey) ? 'na' : 'pending';
                      return (
                        <button
                          key={st}
                          className="qa-touch-44"
                          type="button"
                          role="radio"
                          aria-checked={cur === st}
                          onClick={() => setMarketState(t.key, t.dateKey, st)}
                          style={{ padding: '6px 12px', fontFamily: F.ui, fontSize: FS[13], ...choiceLook(cur === st), cursor: 'pointer' }}
                        >
                          {UDI_MARKET_STATE_LABEL[st]}
                        </button>
                      );
                    })}
                  </div>
                  {on && (
                    <span style={{ fontFamily: F.ui, fontSize: FS[12], color: d.submitted ? T.subtle : T.warning }}>
                      {d.submitted ? `제출일 ${d.submitted}` : '제출일을 적으십시오'}
                    </span>
                  )}
                  {dueDays !== null && (
                    <span style={{ fontFamily: F.ui, fontSize: FS[12], color: dueDays <= 90 ? T.red : T.subtle }}>
                      갱신 {dueDays < 0 ? `만료 ${-dueDays}일` : `D-${dueDays}`}
                    </span>
                  )}
                </div>
                {on && (
                  <div style={{ display: 'flex', gap: S[3.5], flexWrap: 'wrap', marginTop: S[2] }}>
                    <Field id={`udi-sub-${t.dateKey}`} label="제출일">
                      <In id={`udi-sub-${t.dateKey}`} type="date" value={d.submitted ?? ''} onChange={(e) => setSubDate(t.dateKey, 'submitted', e.target.value)} />
                    </Field>
                    <Field id={`udi-due-${t.dateKey}`} label="갱신 기한" optional>
                      <In id={`udi-due-${t.dateKey}`} type="date" value={due} onChange={(e) => setSubDate(t.dateKey, 'due', e.target.value)} />
                    </Field>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {linkedProduct && (
        <Section title="변경 ↔ UDI 재신고">
          {/* 판 안의 노란 안내 상자를 칸 옆 글로(화면 검토 A76 · 2026-09-28) */}
          <FormNote style={{ marginBottom: productChanges.length ? S[2.5] : 0 }}>
            <strong style={{ color: T.text }}>{linkedProduct.name}</strong> 의 변경(포장·멸균·사용목적·등급 등)이 발생하면 <strong style={{ color: T.text }}>UDI 통합정보 재신고</strong>가 필요할 수 있습니다. 변경평가를 검토할 때 함께 확인하십시오.
          </FormNote>
          {productChanges.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', borderTop: `1px solid ${T.border}` }}>
              {productChanges.map((c) => (
                <Link key={c.id} href={`/assessments/${encodeURIComponent(c.code)}`} style={{ display: 'flex', alignItems: 'center', gap: S[2.5], padding: `${S[2]}px 2px`, borderBottom: `1px solid ${T.border}`, textDecoration: 'none' }}>
                  <span style={{ fontFamily: F.mono, fontSize: FS[12], color: T.champagne, flexShrink: 0 }}>{c.code}</span>
                  <span style={{ fontFamily: F.serif, fontSize: FS[13], color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ fontFamily: F.ui, fontSize: FS[12], color: T.muted }}>진행 중인 변경평가 없음</div>
          )}
        </Section>
      )}

      <Section title="비고">
        <Txt value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </Section>

      <Section title="상태">
        <div style={{ display: 'flex', gap: S[2] }}>
          {STATUS_OPTIONS.map((s) => (
            <button
              aria-pressed={status === s}
              className="qa-touch-44"
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              style={{
                // 한글 상태 이름이라 본문 글꼴 (화면 검토 A44 · 2026-09-28)
                padding: '8px 16px', fontFamily: F.ui, fontSize: FS[12],
                ...choiceLook(status === s),
                borderRadius: RADIUS.md, cursor: 'pointer',
              }}
            >
              {UDI_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <ChangeReasonPanel id="udi-status" changes={pending} reason={reason} onReason={setReason} lastChange={lastChange} />
      </Section>

      <FormActions>
        <Btn sm onClick={() => save(status !== initial.status ? status : undefined)} pending={saving} disabled={!!reasonMissing} title={reasonMissing ?? undefined} style={{ minWidth: 140 }}>
          저장
        </Btn>
      </FormActions>
        </div>
      </div>
    </div>
  );
}
