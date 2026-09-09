'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ScanBarcode } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { Btn, Bx, PageHd, Lbl, Field, In, Sel, FormActions } from '@/lib/design/components';
import { SegmentedChoice } from '@/lib/design/segmented-choice';
import { S, FS, F, T, alpha, RADIUS, SHADOW, MOTION, ICON, LAYOUT, LH } from '@/lib/design/tokens';
import { ISSUING_AGENCY_LABEL, ISSUING_AGENCY_DESC, PI_COMPONENT_META, suggestPi, type IssuingAgency, type PiComponents, type PiSuggestion } from '@/lib/udi';
import type { MfdsProduct } from '@/lib/mfds-api/products';
import { HelpNote } from '@/components/HelpNote';

const PI_LABEL: Record<string, string> = Object.fromEntries(PI_COMPONENT_META.map((m) => [m.key, m.label]));

export interface UdiProductOption {
  id: string;
  local_id: number | null;
  name: string;
  /** products.device_class 는 text("2등급" 등: 이미 '등급' 포함될 수 있음). */
  device_class: string | number | null;
}

/** 등급 라벨: 값에 이미 '등급' 이 있으면 중복 방지(버그: "2등급등급"). 빈값이면 ''. */
function gradeLabel(dc: string | number | null): string {
  if (dc === null || dc === undefined) return '';
  const s = String(dc).trim();
  if (!s) return '';
  return /등급$/.test(s) ? s : `${s}등급`;
}

const AGENCIES: IssuingAgency[] = ['gs1', 'hibcc', 'iccbba'];

// GS1 Application Identifier: DI/PI 캐리어 구조(미리보기 교육용). HIBCC/ICCBBA 는 자체 구조.
const GS1_AI: Record<string, string> = { di: '01', lot: '10', serial: '21', expiry: '17', manufacture_date: '11' };
// PI 예시값: PI 는 "제품 등록 시점"엔 값이 없고 생산 로트마다 채워지는 동적 정보.
// 미리보기에 예시를 붙여 "지금 정하는 건 라벨 구성, 값은 생산 때"임을 직관화.
const PI_EXAMPLE: Record<string, string> = { lot: 'LOT250612', serial: 'SN0001234', expiry: '260630', manufacture_date: '250612' };

export function NewUdiClient({ products = [], initialProductId }: { products?: UdiProductOption[]; initialProductId?: string }) {
  const router = useRouter();
  const toast = useToast();
  // 제품 화면에서 진입(?product=id) 시 자동 연결·제품명 프리필 (제품 → UDI 흐름).
  const initialProduct = products.find((p) => p.id === initialProductId);
  const [productId, setProductId] = useState(initialProductId ?? '');
  const [deviceName, setDeviceName] = useState(initialProduct?.name ?? '');
  const [brandName, setBrandName] = useState('');
  const [udiDi, setUdiDi] = useState('');
  const [agency, setAgency] = useState<IssuingAgency>('gs1');
  const [gmdn, setGmdn] = useState('');
  const [pi, setPi] = useState<PiComponents>({ lot: true });
  const [submitting, setSubmitting] = useState(false);
  const [looking, setLooking] = useState(false);
  const [lookupInfo, setLookupInfo] = useState<MfdsProduct | null>(null);
  const [lookupMsg, setLookupMsg] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<PiSuggestion | null>(null);

  const canSubmit = deviceName.trim().length >= 2 && udiDi.trim().length >= 4 && !submitting;
  const canLookup = udiDi.trim().length >= 4 && !looking;

  function togglePi(key: keyof PiComponents) {
    setPi((p) => ({ ...p, [key]: !p[key] }));
  }

  function onSelectProduct(id: string) {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    if (p && !deviceName.trim()) setDeviceName(p.name);
  }

  // MFDS 통합정보 조회 → 빈 항목 자동 프리필.
  // 기존 인프라 재사용: /api/mfds/products?udi= (MdeqStdCdPrdtInfoService03,
  // 로그인 게이트·rate limit·사용량 카운팅·24h 캐싱·검증된 필드 매핑 포함).
  async function doLookup() {
    const di = udiDi.trim();
    if (di.length < 4 || looking) return;
    setLooking(true);
    setLookupMsg(null);
    setLookupInfo(null);
    try {
      const res = await fetch(`/api/mfds/products?udi=${encodeURIComponent(di)}&rows=1`);
      const json = await res.json();
      if (!res.ok) {
        setLookupMsg(json.message ?? 'MFDS 조회 실패');
        return;
      }
      const item = ((json.items ?? []) as MfdsProduct[])[0];
      if (!item) {
        setLookupMsg('해당 UDI-DI 의 MFDS 조회 결과가 없습니다. DI 를 확인해 주세요.');
        return;
      }
      setLookupInfo(item);
      // 사용자가 이미 입력한 값은 보존, 빈 항목만 채움
      const name = item.product_name || item.item_name;
      if (name && !deviceName.trim()) setDeviceName(name);
      if (item.class_no && !gmdn.trim()) setGmdn(item.class_no);
      // 제품 특성으로 PI 자동제안 (멸균→유효기간, 이식/추적관리→시리얼)
      setSuggestion(
        suggestPi({
          implant: item.is_implant,
          tracking: item.is_tracking_required,
          sterile: item.needs_sterile === true || !!item.sterilization_method,
        }),
      );
      toast.success('MFDS 조회 완료: 빈 항목을 자동으로 채웠어요.');
    } catch (e) {
      setLookupMsg(e instanceof Error ? e.message : 'MFDS 조회 실패');
    } finally {
      setLooking(false);
    }
  }

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/udi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_name: deviceName.trim(),
          brand_name: brandName.trim() || undefined,
          udi_di: udiDi.trim(),
          issuing_agency: agency,
          gmdn_code: gmdn.trim() || undefined,
          pi_components: pi,
          product_id: productId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message ?? json.error ?? '생성 실패');
        setSubmitting(false);
        return;
      }
      toast.success(`UDI ${json.udi_di} 등록됨`);
      router.push(`/udi/${json.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  }

  const isGs1 = agency === 'gs1';
  const selectedPi = PI_COMPONENT_META.filter((m) => pi[m.key]);
  // 사용자가 DI 칸에 (01)…(10)… 처럼 AI 가 박힌 전체 캐리어 문자열을 붙여넣은 정황
  const diHasEmbeddedAi = /\(\d{2}\)/.test(udiDi);

  return (
    <div style={{ maxWidth: LAYOUT.wide, margin: '0 auto' }}>
      {/* 2단 레이아웃: 좌측 입력 폼 / 우측 캐리어 미리보기·안내(빈 공간 활용·선생님 모드).
          좁은 화면(<880)에서는 1열 스택. */}
      <style>{`
        .qa-udi-layout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 22px; align-items: start; }
        @media (max-width: 880px) { .qa-udi-layout { grid-template-columns: 1fr; } .qa-udi-aside { position: static !important; } }
      `}</style>

      <Link href="/udi" style={{ display: 'inline-flex', alignItems: 'center', gap: S[1.5], fontSize: FS[13], color: T.subtle, textDecoration: 'none', marginBottom: S[3] }}>
        <ArrowLeft size={ICON.sizeXs} aria-hidden="true" />
        UDI 목록으로
      </Link>
      <PageHd title="새 UDI 등록" sub="UDI-DI + 발행기관 + 생산 식별자(PI) 구성" />

      <div className="qa-udi-layout">
        {/* ── 좌: 입력 폼 ── */}
        <Bx style={{ padding: S[7], background: T.surface, borderColor: T.border, borderRadius: RADIUS.md, boxShadow: SHADOW.hairline, display: 'flex', flexDirection: 'column', gap: S[6] }}>
          <HelpNote>
            <strong style={{ color: T.text }}>UDI</strong> = 정적 식별자 <strong>UDI-DI</strong>(제품/모델 고유) + 동적 <strong>UDI-PI</strong>(로트·시리얼·유효기간 등 생산 정보). 발행기관에서 DI 를 발급받아 입력하세요.
          </HelpNote>

          {products.length > 0 && (
            <Field id="udi-product" label="우리 제품 연결 (선택)">
              <>
                <Sel
                  id="udi-product"
                  value={productId}
                  onChange={(e) => onSelectProduct(e.target.value)}
                  opts={[
                    { v: '', l: '(연결 안 함)' },
                    ...products.map((p) => ({
                      v: p.id,
                      l: `${p.name}${gradeLabel(p.device_class) ? ` · ${gradeLabel(p.device_class)}` : ''}`,
                    })),
                  ]}
                />
                <div style={{ marginTop: S[1.5], fontFamily: F.serif, fontSize: FS[11], color: T.subtle, lineHeight: LH.normal }}>
                  이 UDI 가 어떤 제품에 대한 것인지 연결하면, 제품 화면에서도 UDI 를 함께 추적할 수 있어요.
                </div>
              </>
            </Field>
          )}

          <Field id="udi-device" label="제품명" required>
            <In id="udi-device" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} placeholder="예: 무선 심전계 ECG-200" />
          </Field>
          <Field id="udi-brand" label="브랜드명">
            <In id="udi-brand" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="예: CardioTrace" />
          </Field>

          {/* 발행기관: 세그먼트 버튼 그리드 (라디오 의미 · M-08) */}
          <div>
            <Lbl>발행기관 <span style={{ color: T.muted, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· Issuing Agency</span></Lbl>
            <HelpNote compact>
              <strong style={{ color: T.text }}>UDI-DI 코드를 부여하는 국제 표준화 기구</strong>입니다. FDA·EU·MFDS 가 공인한 기관에서 코드를 발급받아야 UDI 로 인정됩니다. 대부분의 의료기기는 <strong style={{ color: T.text }}>GS1</strong> 을 씁니다.
            </HelpNote>
            <SegmentedChoice
              ariaLabel="발행기관"
              layout="grid"
              minCol={160}
              fontSize={FS[12]}
              padding="10px 6px"
              minHeight={48}
              options={AGENCIES.map((a) => ({ value: a, label: ISSUING_AGENCY_LABEL[a] }))}
              value={agency}
              onChange={setAgency}
            />
            <div style={{ marginTop: S[2], padding: '8px 12px', background: alpha(T.champagne, 0.05), border: `1px solid ${alpha(T.champagne, 0.2)}`, borderRadius: RADIUS.sm, fontFamily: F.serif, fontSize: FS[12], color: T.subtle, lineHeight: LH.notice }}>
              <strong style={{ color: T.champagne }}>{ISSUING_AGENCY_LABEL[agency]}</strong>: {ISSUING_AGENCY_DESC[agency]}
            </div>
          </div>

          {/* UDI-DI: mono 입력 + MFDS 조회 버튼 복합 컨트롤 (공통 In 미적용: inputStyle 유지) */}
          <div>
            <Lbl htmlFor="udi-di">UDI-DI (Device Identifier) <span style={{ color: T.red }}>*</span></Lbl>
            <div style={{ display: 'flex', gap: S[2], alignItems: 'stretch' }}>
              <input id="udi-di" type="text" value={udiDi} onChange={(e) => { setUdiDi(e.target.value); setLookupInfo(null); setLookupMsg(null); }} placeholder={agency === 'gs1' ? '예: 08806311234567 (GTIN-14)' : '발행기관 DI'} style={{ ...inputStyle(), fontFamily: F.mono, flex: 1, minWidth: 0 }} />
              <button
                type="button"
                onClick={doLookup}
                disabled={!canLookup}
                title="MFDS 통합정보시스템에서 이 UDI-DI 의 제품 정보를 불러옵니다"
                style={{
                  flexShrink: 0, padding: '0 14px', minHeight: 44, whiteSpace: 'nowrap',
                  fontFamily: F.mono, fontSize: FS[11], letterSpacing: 0.5, fontWeight: 600,
                  background: canLookup ? alpha(T.champagne, 0.1) : 'transparent',
                  color: canLookup ? T.champagne : T.muted,
                  border: `1px solid ${canLookup ? alpha(T.champagne, 0.5) : T.border}`,
                  borderRadius: RADIUS.md, cursor: canLookup ? 'pointer' : 'not-allowed',
                }}
              >
                {looking ? '조회 중…' : 'MFDS 불러오기'}
              </button>
            </div>
            <div style={{ marginTop: S[1.5], fontFamily: F.serif, fontSize: FS[11], color: T.subtle, lineHeight: LH.normal }}>
              제품/모델당 고유. 조직 내 중복 등록 불가. DI 입력 후 <strong style={{ color: T.subtle }}>「MFDS 불러오기」</strong>로 제품명·품목·등급을 자동으로 채울 수 있어요.
            </div>
            {diHasEmbeddedAi && (
              <div style={{ marginTop: S[2], padding: '8px 12px', background: alpha(T.warning, 0.06), border: `1px solid ${alpha(T.warning, 0.3)}`, borderRadius: RADIUS.sm, fontFamily: F.serif, fontSize: FS[12], color: T.subtle, lineHeight: LH.normal }}>
                여기엔 <strong style={{ color: T.text }}>DI 만</strong> 넣어주세요. 입력하신 값에 <span style={{ fontFamily: F.mono }}>(10)</span> 같은 <strong>PI(생산정보) AI</strong>가 섞여 있어요. PI 는 아래에서 별도로 구성합니다.
              </div>
            )}
            {lookupMsg && (
              <div style={{ marginTop: S[2], padding: '8px 12px', background: alpha(T.warning, 0.06), border: `1px solid ${alpha(T.warning, 0.3)}`, borderRadius: RADIUS.sm, fontFamily: F.serif, fontSize: FS[12], color: T.subtle }}>
                {lookupMsg}
              </div>
            )}
            {lookupInfo && (
              <div style={{ marginTop: S[2], padding: '10px 12px', background: alpha(T.green, 0.05), border: `1px solid ${alpha(T.green, 0.35)}`, borderRadius: RADIUS.sm }}>
                <div style={{ fontFamily: F.mono, fontSize: FS[10], letterSpacing: 1, textTransform: 'uppercase', color: T.green, marginBottom: S[1.5] }}>MFDS 조회 결과</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {([
                    ['제품명', lookupInfo.product_name],
                    ['품목명', lookupInfo.item_name],
                    ['등급', lookupInfo.grade != null ? `${lookupInfo.grade}등급` : null],
                    ['분류번호', lookupInfo.class_no],
                    ['허가번호', lookupInfo.prmsn_no],
                    ['모델명', lookupInfo.model_name],
                    ['업체', lookupInfo.company_name],
                  ] as const).filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: S[2], fontFamily: F.serif, fontSize: FS[12] }}>
                      <span style={{ color: T.muted, minWidth: 52, flexShrink: 0 }}>{k}</span>
                      <span style={{ color: T.text }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* UDI-PI: 권장 배지 포함 체크박스 카드 (공통 In/Sel 아님: 의도적 UI) */}
          <div>
            <Lbl>생산 식별자 (UDI-PI): 라벨에 포함할 항목</Lbl>
            {suggestion && (
              <div style={{ marginBottom: S[2.5], padding: '10px 13px', background: alpha(T.champagne, 0.05), border: `1px solid ${alpha(T.champagne, 0.3)}`, borderRadius: RADIUS.sm }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: S[2], flexWrap: 'wrap', marginBottom: S[1.5] }}>
                  <span style={{ fontFamily: F.mono, fontSize: FS[10], letterSpacing: 1, textTransform: 'uppercase', color: T.champagne, fontWeight: 600 }}>제품 특성 기반 권장 PI</span>
                  <button
                    type="button"
                    onClick={() => setPi((p) => ({ ...p, ...suggestion.recommended }))}
                    style={{ marginLeft: 'auto', padding: '3px 10px', fontFamily: F.mono, fontSize: FS[10], fontWeight: 600, background: T.champagne, color: T.bg, border: 'none', borderRadius: RADIUS.sm, cursor: 'pointer' }}
                  >
                    권장값 적용
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {suggestion.reasons.map((r) => (
                    <div key={r.key} style={{ fontFamily: F.serif, fontSize: FS[11], color: T.subtle, lineHeight: LH.normal }}>
                      <strong style={{ color: T.text }}>{PI_LABEL[r.key] ?? r.key}</strong>: {r.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: S[2] }}>
              {PI_COMPONENT_META.map((m) => {
                const isRec = !!suggestion?.recommended[m.key];
                return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => togglePi(m.key)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: S[2.5], padding: '10px 12px', textAlign: 'left',
                    background: pi[m.key] ? alpha(T.green, 0.08) : 'transparent',
                    border: `1px solid ${pi[m.key] ? alpha(T.green, 0.5) : T.border}`,
                    borderRadius: RADIUS.sm, cursor: 'pointer',
                  }}
                >
                  <span style={{ fontFamily: F.mono, fontSize: FS[11], color: pi[m.key] ? T.green : T.subtle, flexShrink: 0, marginTop: 1 }}>
                    {pi[m.key] ? '☑' : '☐'}
                  </span>
                  <span style={{ flex: 1 }}>
                    <span style={{ fontFamily: F.serif, fontSize: FS[13], color: T.text, fontWeight: 600 }}>
                      {m.label}
                      {isRec && (
                        <span style={{ marginLeft: S[1.5], fontFamily: F.mono, fontSize: FS[9], color: T.champagne, background: alpha(T.champagne, 0.12), border: `1px solid ${alpha(T.champagne, 0.4)}`, borderRadius: 3, padding: '1px 5px', letterSpacing: 0.5, verticalAlign: 'middle' }}>권장</span>
                      )}
                    </span>
                    <span style={{ display: 'block', fontFamily: F.serif, fontSize: FS[11], color: T.subtle, marginTop: S[0.5], lineHeight: LH.normal }}>{m.help}</span>
                  </span>
                </button>
                );
              })}
            </div>
          </div>

          <Field id="udi-gmdn" label="GMDN / 품목 코드">
            <In id="udi-gmdn" value={gmdn} onChange={(e) => setGmdn(e.target.value)} placeholder="예: 47536" />
          </Field>

          <FormActions>
            <Link href="/udi" style={{ textDecoration: 'none' }}>
              <Btn p={false} sm>취소</Btn>
            </Link>
            <Btn sm onClick={submit} disabled={!canSubmit} style={{ background: canSubmit ? T.champagne : 'transparent', color: canSubmit ? T.bg : T.subtle, borderColor: canSubmit ? T.champagne : T.border, borderRadius: RADIUS.md, minWidth: 140, fontWeight: 600 }}>
              {submitting ? '등록 중...' : 'UDI 등록'}
            </Btn>
          </FormActions>
        </Bx>

        {/* ── 우: 캐리어 미리보기 + 안내 (sticky) ── */}
        <aside className="qa-udi-aside" style={{ position: 'sticky', top: 16, display: 'flex', flexDirection: 'column', gap: S[3.5] }}>
          <Bx style={{ padding: 0, overflow: 'hidden', borderRadius: RADIUS.md, borderColor: T.border }}>
            <div style={{ padding: '11px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: S[2] }}>
              <ScanBarcode size={15} aria-hidden="true" style={{ color: T.champagne }} />
              <span style={{ fontFamily: F.mono, fontSize: FS[10], letterSpacing: 1.4, textTransform: 'uppercase', color: T.subtle, fontWeight: 600 }}>
                UDI 캐리어 미리보기
              </span>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: S[3.5] }}>
              {/* DI */}
              <div>
                <CarrierLabel>DI · 정적 식별자 ({ISSUING_AGENCY_LABEL[agency]})</CarrierLabel>
                <CarrierLine ai={isGs1 ? GS1_AI.di : undefined} value={udiDi.trim() || '────────────'} dim={!udiDi.trim()} />
              </div>
              {/* PI */}
              <div>
                <CarrierLabel>PI · 동적 (생산 때 채워짐)</CarrierLabel>
                {selectedPi.length === 0 ? (
                  <div style={{ fontFamily: F.serif, fontSize: FS[12], color: T.muted, fontStyle: 'italic', padding: '4px 0' }}>
                    선택한 생산 식별자가 없습니다.
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: S[1.5] }}>
                      {selectedPi.map((m) => (
                        <CarrierLine key={m.key} ai={isGs1 ? GS1_AI[m.key] : undefined} value={m.label} example={isGs1 ? PI_EXAMPLE[m.key] : undefined} />
                      ))}
                    </div>
                    <div style={{ marginTop: S[1.5], fontFamily: F.serif, fontSize: FS[10], color: T.muted, lineHeight: LH.normal }}>
                      ↳ 회색 값은 <strong>예시</strong>입니다. PI 는 등록이 아니라 <strong>생산 로트마다</strong> 라벨에 찍히는 정보: 여기선 어떤 항목을 쓸지 <strong>구성</strong>만 정합니다.
                    </div>
                  </>
                )}
              </div>
              {!isGs1 && (
                <div style={{ fontFamily: F.serif, fontSize: FS[11], color: T.muted, lineHeight: LH.normal }}>
                  {ISSUING_AGENCY_LABEL[agency]} 는 GS1 의 (AI) 대신 자체 데이터 구조를 사용합니다. 위 번호는 GS1 기준 참고용입니다.
                </div>
              )}
            </div>
          </Bx>

          <div style={{ padding: '13px 15px', background: alpha(T.champagne, 0.04), border: `1px solid ${alpha(T.champagne, 0.18)}`, borderRadius: RADIUS.md, fontFamily: F.serif, fontSize: FS[12], color: T.subtle, lineHeight: 1.65 }}>
            <strong style={{ color: T.text }}>DI</strong> 는 제품/모델당 한 번 발급받아 고정되고, <strong style={{ color: T.text }}>PI</strong> 는 생산 로트마다 바뀌는 정보입니다. 등록 후 FDA GUDID·EU EUDAMED·MFDS 제출 상태를 상세 화면에서 추적합니다.
          </div>
        </aside>
      </div>
    </div>
  );
}

function CarrierLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: F.mono, fontSize: FS[10], letterSpacing: 1, textTransform: 'uppercase', color: T.muted, marginBottom: S[1.5] }}>
      {children}
    </div>
  );
}

function CarrierLine({ ai, value, dim, example }: { ai?: string; value: string; dim?: boolean; example?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: S[2], padding: '7px 10px', background: alpha(T.champagne, 0.04), border: `1px solid ${T.border}`, borderRadius: RADIUS.sm }}>
      {ai && (
        <span style={{ fontFamily: F.mono, fontSize: FS[10], color: T.champagne, background: alpha(T.champagne, 0.1), border: `1px solid ${alpha(T.champagne, 0.35)}`, borderRadius: 3, padding: '1px 5px', flexShrink: 0 }}>
          ({ai})
        </span>
      )}
      <span style={{ fontFamily: F.mono, fontSize: FS[12], color: dim ? T.muted : T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </span>
      {example && (
        <span style={{ marginLeft: 'auto', fontFamily: F.mono, fontSize: FS[11], color: T.muted, flexShrink: 0 }}>
          예: {example}
        </span>
      )}
    </div>
  );
}

// UDI-DI mono 복합 입력 전용: 공통 In 은 style override 미지원이라 유지.
function inputStyle(): React.CSSProperties {
  return { width: '100%', padding: '12px 14px', fontFamily: F.serif, fontSize: FS[14], background: alpha(T.champagne, 0.02), border: `1px solid ${T.border}`, borderRadius: RADIUS.md, color: T.text, minHeight: 44, transition: `border-color ${MOTION.fast}` };
}
