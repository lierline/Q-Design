'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScanBarcode } from '@/components/q-design-icons/ScanBarcode';
import { useToast } from '@/components/Toast';
import { Alert, Btn, Bx, PageHd, Lbl, Field, In, FormActions, InfoDot } from '@/lib/design/components';
import { SegmentedChoice } from '@/lib/design/segmented-choice';
import { S, FS, F, T, alpha, RADIUS, MOTION, LAYOUT, LH, labelCase } from '@/lib/design/tokens';
import { tintBorder } from '@/lib/design/grain';
import { codeOrTextFont } from '@/lib/design/hangul-text';
import { ISSUING_AGENCY_LABEL, ISSUING_AGENCY_DESC, PI_COMPONENT_META, suggestPi, type IssuingAgency, type PiComponents, type PiSuggestion } from '@/lib/udi';
import type { MfdsProduct } from '@/lib/mfds-api/products';
import { PageGuide } from '@/components/PageGuide';
import { ListBackLink } from '@/components/ListBackLink';
import { TextLinkAction, TextAction } from '@/components/TextAction';
import { ProductPickField, useProductPick } from '@/components/ProductPickField';
import type { OrgProductList } from '@/lib/products/org-products';
import { FormNote } from '@/components/FormNote';

const PI_LABEL: Record<string, string> = Object.fromEntries(PI_COMPONENT_META.map((m) => [m.key, m.label]));

const AGENCIES: IssuingAgency[] = ['gs1', 'hibcc', 'iccbba'];

// GS1 Application Identifier: DI/PI 캐리어 구조(미리보기 교육용). HIBCC/ICCBBA 는 자체 구조.
const GS1_AI: Record<string, string> = { di: '01', lot: '10', serial: '21', expiry: '17', manufacture_date: '11' };
// PI 예시값: PI 는 "제품 등록 시점"엔 값이 없고 생산 로트마다 채워지는 동적 정보.
// 미리보기에 예시를 붙여 "지금 정하는 건 라벨 구성, 값은 생산 때"임을 직관화.
const PI_EXAMPLE: Record<string, string> = { lot: 'LOT250612', serial: 'SN0001234', expiry: '260630', manufacture_date: '250612' };

export function NewUdiClient({ products, initialProductId }: { products: OrgProductList; initialProductId?: string }) {
  const router = useRouter();
  const toast = useToast();
  // 화면 검토 A57 · 2026-09-27: 「우리 제품 연결(선택)」 + 「제품명 *」 이중 입력을 없앴다. 종전엔 이름을 먼저
  //   적은 뒤 제품을 고르면 이름이 안 바뀌어, 고른 제품과 적힌 이름이 갈렸다.
  //   이제 제품을 목록에서 고르면(제품 화면에서 ?product= 로 오면 골라진 채로) 이름이 따라 채워지고,
  //   사람이 이름을 고친 적이 없으면 제품을 바꿀 때 따라 바뀐다. 등록 전 제품만 «새 제품으로 적기».
  const pick = useProductPick(products, initialProductId);
  const [nameInput, setNameInput] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  // 고친 적이 없으면 고른 제품의 이름을 따른다. 등록 전 제품(이름으로 적기)이면 적은 값 그대로.
  const deviceName = nameTouched ? nameInput : pick.picked?.name ?? nameInput;
  const [brandName, setBrandName] = useState('');
  const [udiDi, setUdiDi] = useState('');
  const [agency, setAgency] = useState<IssuingAgency>('gs1');
  const [gmdn, setGmdn] = useState('');
  const [pi, setPi] = useState<PiComponents>({ lot: true });
  const [submitting, setSubmitting] = useState(false);
  const [looking, setLooking] = useState(false);
  const [lookupInfo, setLookupInfo] = useState<MfdsProduct | null>(null);
  // 2026-09-13: 표준코드별 통합정보(라텍스 · 프탈레이트 · MRI 안전 · SW 버전 · 급여코드). 실패해도 위 조회는 그대로.
  const [unityInfo, setUnityInfo] = useState<{ contains_latex: boolean | null; contains_phthalate: boolean | null; mri_safety: string | null; software_version: string | null; edi_codes: string | null } | null>(null);
  const [lookupMsg, setLookupMsg] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<PiSuggestion | null>(null);

  // 제품을 목록에서 골랐거나 «새 제품으로 적기» 를 눌렀을 때만 저장한다(기본은 목록에서 고르기).
  const productChosen = pick.productId !== '' || pick.manual;
  const canSubmit = productChosen && deviceName.trim().length >= 2 && udiDi.trim().length >= 4 && !submitting;
  const canLookup = udiDi.trim().length >= 4 && !looking;

  function togglePi(key: keyof PiComponents) {
    setPi((p) => ({ ...p, [key]: !p[key] }));
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
    setUnityInfo(null);
    try {
      const res = await fetch(`/api/mfds/products?udi=${encodeURIComponent(di)}&rows=1`);
      const json = await res.json();
      if (!res.ok) {
        setLookupMsg(json.message ?? 'MFDS 조회 실패');
        return;
      }
      const item = ((json.items ?? []) as MfdsProduct[])[0];
      if (!item) {
        setLookupMsg('해당 UDI-DI 의 MFDS 조회 결과가 없습니다. DI 를 확인해 주십시오.');
        return;
      }
      setLookupInfo(item);
      // 사용자가 이미 입력한 값은 보존, 빈 항목만 채움(고른 제품의 이름이 있으면 그것이 우선)
      const name = item.product_name || item.item_name;
      if (name && !deviceName.trim()) setNameInput(name);
      if (item.class_no && !gmdn.trim()) setGmdn(item.class_no);
      // 제품 특성으로 PI 자동제안 (멸균→유효기간, 이식/추적관리→시리얼)
      setSuggestion(
        suggestPi({
          implant: item.is_implant,
          tracking: item.is_tracking_required,
          sterile: item.needs_sterile === true || !!item.sterilization_method,
        }),
      );
      toast.success('MFDS 조회를 마쳤습니다. 빈 항목을 채웠으니 확인해 주십시오.');
      // 통합정보는 식약처 쪽이 5~9초 걸린다. 뒤에서 받아 붙인다.
      void (async () => {
        try {
          const ur = await fetch(`/api/mfds/unity?udidi=${encodeURIComponent(di)}`);
          const uj = ur.ok ? await ur.json() : null;
          if (uj?.item) setUnityInfo(uj.item);
        } catch {
          /* 보강일 뿐 */
        }
      })();
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
          product_id: pick.productId || undefined,
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

      {/* «← UDI 목록» 한 형식 (화면 검토 A32 · A74 · 2026-09-27) */}
      <ListBackLink href="/udi" label="UDI 목록" />
      <PageHd title="새 UDI 등록" desc="UDI-DI + 발행기관 + 생산 식별자(PI) 구성" />
      {/* UDI = DI + PI 설명은 화면 머리 ⓘ(udi 안내의 팁)로, 발행기관 설명은 칸 옆 ⓘ 로(묶음 6 · 2026-10-08) */}
      <PageGuide pageId="udi" />

      <div className="qa-udi-layout">
        {/* ── 좌: 입력 폼 ── */}
        <Bx style={{ padding: S[7], background: T.surface, borderColor: T.border, borderRadius: RADIUS.md, display: 'flex', flexDirection: 'column', gap: S[6] }}>
          {/* 화면 검토 A83 · 2026-09-27: 「UDI-DI 입력 → MFDS 불러오기 → 채워진 값 확인」 순서로 칸을 올렸다.
              종전엔 제품명 · 브랜드명을 손으로 먼저 적게 한 뒤 한참 아래에서 불러오기를 해, 같은 칸을 두 번 채우고
              손으로 적은 이름과 허가 이름이 갈릴 수 있었다. 불러오기는 빈 칸만 채운다. */}
          {/* 발행기관: 세그먼트 버튼 그리드 (라디오 의미 · M-08) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: S[1.5] }}>
              <Lbl>발행기관</Lbl>
              {/* Lbl 의 아래 여백(7)과 같은 높이로 맞춘다 */}
              <span style={{ marginBottom: 7, display: 'inline-flex' }}>
                <InfoDot label="발행기관 설명 보기">
                  UDI-DI 코드를 부여하는 국제 표준화 기구입니다. FDA · EU · MFDS 가 공인한 기관에서 코드를 발급받아야 UDI 로 인정됩니다. 대부분의 의료기기는 GS1 을 씁니다.
                </InfoDot>
              </span>
            </div>
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
            {/* 판 안의 상자 대신 칸 아래 글(화면 검토 A35 · 2026-09-28) */}
            <FormNote style={{ marginTop: S[2] }}>
              <strong style={{ color: T.text }}>{ISSUING_AGENCY_LABEL[agency]}</strong>: {ISSUING_AGENCY_DESC[agency]}
            </FormNote>
          </div>

          {/* UDI-DI: mono 입력 + MFDS 조회 버튼 복합 컨트롤 (공통 In 미적용: inputStyle 유지) */}
          <div>
            {/* 칸 아래 설명은 이름표 옆 ⓘ 로 (ⓘ 묶음 8 · 2026-10-08) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: S[1.5] }}>
              <Lbl htmlFor="udi-di">UDI-DI (기기 식별자) <span style={{ color: T.red }}>*</span></Lbl>
              <span style={{ marginBottom: 7, display: 'inline-flex' }}>
                <InfoDot label="UDI-DI 설명 보기">
                  제품/모델당 고유하며 조직 안에서 중복 등록할 수 없습니다. DI 를 넣고 「MFDS 불러오기」 를 누르면 아래 제품명 · 품목 코드 칸의 빈 곳을 허가 정보로 채웁니다.
                </InfoDot>
              </span>
            </div>
            <div style={{ display: 'flex', gap: S[2], alignItems: 'stretch' }}>
              <input id="udi-di" type="text" value={udiDi} onChange={(e) => { setUdiDi(e.target.value); setLookupInfo(null); setLookupMsg(null); }} placeholder={agency === 'gs1' ? '예: 08806311234567 (GTIN-14)' : '발행기관 DI'} style={{ ...inputStyle(), fontFamily: F.mono, flex: 1, minWidth: 0 }} />
              <Btn
                p={false}
                onClick={doLookup}
                disabled={!canLookup}
                title="MFDS 통합정보시스템에서 이 UDI-DI 의 제품 정보를 불러옵니다"
                style={{ flexShrink: 0 }}
              >
                {looking ? '조회 중…' : 'MFDS 불러오기'}
              </Btn>
            </div>
            {/* 손수 짠 경고 상자는 공용 Alert 로 (ⓘ 묶음 8 · 2026-10-08) */}
            {diHasEmbeddedAi && (
              <Alert kind="warning" style={{ marginTop: S[2] }}>
                여기엔 <strong>DI 만</strong> 넣어 주십시오. 입력하신 값에 <span style={{ fontFamily: F.mono }}>(10)</span> 같은 <strong>PI(생산정보) AI</strong>가 섞여 있습니다. PI 는 아래에서 따로 구성합니다.
              </Alert>
            )}
            {lookupMsg && (
              <Alert kind="warning" style={{ marginTop: S[2] }}>
                {lookupMsg}
              </Alert>
            )}
            {lookupInfo && (
              <div style={{ marginTop: S[2], padding: '10px 12px', border: `1px solid ${tintBorder(T.green)}`, borderRadius: RADIUS.sm }}>
                <div style={{ fontFamily: F.ui, fontSize: FS[12], color: T.green, marginBottom: S[1.5] }}>MFDS 조회 결과</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {([
                    ['제품명', lookupInfo.product_name],
                    ['품목명', lookupInfo.item_name],
                    ['등급', lookupInfo.grade != null ? `${lookupInfo.grade}등급` : null],
                    ['분류번호', lookupInfo.class_no],
                    ['허가번호', lookupInfo.prmsn_no],
                    ['모델명', lookupInfo.model_name],
                    ['업체', lookupInfo.company_name],
                    ['라텍스', unityInfo ? (unityInfo.contains_latex == null ? null : unityInfo.contains_latex ? '포함' : '미포함') : null],
                    ['프탈레이트', unityInfo ? (unityInfo.contains_phthalate == null ? null : unityInfo.contains_phthalate ? '포함' : '미포함') : null],
                    ['MRI 안전', unityInfo?.mri_safety ?? null],
                    ['SW 버전', unityInfo?.software_version ?? null],
                    ['급여코드', unityInfo?.edi_codes ?? null],
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

          <ProductPickField
            id="udi-product"
            label="대상 제품"
            products={products}
            pick={pick}
            withNameInput={false}
            hint="제품 화면에서도 이 UDI 를 함께 추적합니다"
          />

          {/* 이름 칸은 제품을 골랐거나 «새 제품으로 적기» 를 눌렀을 때 보인다(무엇의 이름인지 정해진 뒤) */}
          {productChosen && (
            <Field
              id="udi-device"
              label="제품명"
              required
              hint={
                pick.picked
                  ? nameTouched
                    ? '고른 제품 이름과 다르게 적음 · 제품을 바꿔도 이 이름은 그대로'
                    : '고른 제품 이름으로 채움 · 허가 · 등록 이름이 다르면 고치기'
                  : undefined
              }
            >
              <In
                id="udi-device"
                value={deviceName}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  setNameTouched(true);
                }}
                placeholder="예: 무선 심전계 ECG-200"
              />
            </Field>
          )}
          <Field id="udi-brand" label="브랜드명">
            <In id="udi-brand" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="예: CardioTrace" />
          </Field>

          {/* UDI-PI: 권장 배지 포함 체크박스 카드 (공통 In/Sel 아님: 의도적 UI) */}
          <div>
            <Lbl>라벨에 넣을 생산 식별자 (UDI-PI)</Lbl>
            {suggestion && (
              <div style={{ marginBottom: S[2.5], padding: '10px 13px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: RADIUS.sm }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: S[2], flexWrap: 'wrap', marginBottom: S[1.5] }}>
                  <span style={{ fontFamily: F.ui, fontSize: FS[12], color: T.champagne, fontWeight: 600 }}>제품 특성 기반 권장 PI</span>
                  <span style={{ marginLeft: 'auto' }}>
                    <TextAction onClick={() => setPi((p) => ({ ...p, ...suggestion.recommended }))}>권장값 적용</TextAction>
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {suggestion.reasons.map((r) => (
                    <div key={r.key} style={{ fontFamily: F.serif, fontSize: FS[12], color: T.subtle, lineHeight: LH.normal }}>
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
                    borderRadius: RADIUS.md, cursor: 'pointer',
                  }}
                >
                  <span style={{ fontFamily: F.mono, fontSize: FS[12], color: pi[m.key] ? T.green : T.subtle, flexShrink: 0, marginTop: 1 }}>
                    {pi[m.key] ? '☑' : '☐'}
                  </span>
                  <span style={{ flex: 1 }}>
                    <span style={{ fontFamily: F.serif, fontSize: FS[13], color: T.text, fontWeight: 600 }}>
                      {m.label}
                      {isRec && (
                        <span style={{ marginLeft: S[1.5], fontFamily: F.ui, fontSize: FS[12], color: T.champagne, background: alpha(T.champagne, 0.12), border: `1px solid ${alpha(T.champagne, 0.4)}`, borderRadius: RADIUS.sm, padding: '1px 5px', verticalAlign: 'middle' }}>권장</span>
                      )}
                    </span>
                    <span style={{ display: 'block', fontFamily: F.serif, fontSize: FS[12], color: T.subtle, marginTop: S[0.5], lineHeight: LH.normal }}>{m.help}</span>
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
            <TextLinkAction href="/udi">취소</TextLinkAction>
            <Btn sm onClick={submit} disabled={!canSubmit} style={{ minWidth: 140, fontWeight: 600 }}>
              {submitting ? '등록 중...' : 'UDI 등록'}
            </Btn>
          </FormActions>
        </Bx>

        {/* ── 우: 캐리어 미리보기 + 안내 (sticky) ── */}
        <aside className="qa-udi-aside" style={{ position: 'sticky', top: 16, display: 'flex', flexDirection: 'column', gap: S[3.5] }}>
          {/* overflow: hidden 을 걷음: 머리의 ⓘ 팝업이 상자 밖으로 떠야 한다(안에는 바탕색 있는 요소가 없어 모서리 밖으로 새는 것도 없다) */}
          <Bx style={{ padding: 0, borderRadius: RADIUS.md, borderColor: T.border }}>
            <div style={{ padding: '11px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: S[2] }}>
              <ScanBarcode size={15} aria-hidden="true" style={{ color: T.champagne }} />
              <span style={{ fontFamily: F.ui, fontSize: FS[12], color: T.subtle, fontWeight: 600 }}>
                UDI 캐리어 미리보기
              </span>
              {/* 아래 있던 DI · PI 설명 상자는 머리 옆 ⓘ 로 (ⓘ 묶음 8 · 2026-10-08) */}
              <InfoDot label="UDI 캐리어 설명 보기" align="right">
                DI 는 제품/모델당 한 번 발급받아 고정되고, PI 는 생산 로트마다 바뀌는 정보입니다. 등록 후 FDA GUDID · EU EUDAMED · MFDS 제출 상태를 상세 화면에서 추적합니다.
              </InfoDot>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: S[3.5] }}>
              {/* DI */}
              <div>
                <CarrierLabel>DI · 정적 식별자 · {ISSUING_AGENCY_LABEL[agency]}</CarrierLabel>
                <CarrierLine ai={isGs1 ? GS1_AI.di : undefined} value={udiDi.trim() || '────────────'} dim={!udiDi.trim()} />
              </div>
              {/* PI */}
              <div>
                <CarrierLabel>PI · 동적 (생산 때 채워짐)</CarrierLabel>
                {selectedPi.length === 0 ? (
                  <div style={{ fontFamily: F.serif, fontSize: FS[12], color: T.muted, fontStyle: 'italic', padding: '4px 0' }}>
                    선택한 생산 식별자 없음
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: S[1.5] }}>
                      {selectedPi.map((m) => (
                        <CarrierLine key={m.key} ai={isGs1 ? GS1_AI[m.key] : undefined} value={m.label} example={isGs1 ? PI_EXAMPLE[m.key] : undefined} />
                      ))}
                    </div>
                    <div style={{ marginTop: S[1.5], fontFamily: F.serif, fontSize: FS[12], color: T.muted, lineHeight: LH.normal }}>
                      ↳ 회색 값은 <strong>예시</strong> · PI 는 등록이 아니라 <strong>생산 로트마다</strong> 라벨에 찍히는 정보 · 여기선 어떤 항목을 쓸지 <strong>구성</strong>만 정함
                    </div>
                  </>
                )}
              </div>
              {!isGs1 && (
                <div style={{ fontFamily: F.serif, fontSize: FS[12], color: T.muted, lineHeight: LH.normal }}>
                  {ISSUING_AGENCY_LABEL[agency]} 는 GS1 의 (AI) 대신 자체 데이터 구조 사용 · 위 번호는 GS1 기준 참고용
                </div>
              )}
            </div>
          </Bx>
        </aside>
      </div>
    </div>
  );
}

function CarrierLabel({ children }: { children: React.ReactNode }) {
  return (
    // 한글 머리글이면 본문 글꼴 · 자간 0 · 대문자 처리 없음 (화면 검토 A44 · 2026-09-28)
    <div style={{ ...codeOrTextFont(children, 1), fontSize: FS[12], textTransform: labelCase(children), color: T.muted, marginBottom: S[1.5] }}>
      {children}
    </div>
  );
}

function CarrierLine({ ai, value, dim, example }: { ai?: string; value: string; dim?: boolean; example?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: S[2], padding: '7px 10px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: RADIUS.sm }}>
      {ai && (
        <span style={{ fontFamily: F.mono, fontSize: FS[12], color: T.champagne, background: alpha(T.champagne, 0.1), border: `1px solid ${alpha(T.champagne, 0.35)}`, borderRadius: RADIUS.sm, padding: '1px 5px', flexShrink: 0 }}>
          ({ai})
        </span>
      )}
      <span style={{ ...codeOrTextFont(value), fontSize: FS[12], color: dim ? T.muted : T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </span>
      {example && (
        <span style={{ marginLeft: 'auto', fontFamily: F.ui, fontSize: FS[12], color: T.muted, flexShrink: 0 }}>
          예: {example}
        </span>
      )}
    </div>
  );
}

// UDI-DI mono 복합 입력 전용: 공통 In 은 style override 미지원이라 유지.
function inputStyle(): React.CSSProperties {
  return { width: '100%', padding: '12px 14px', fontFamily: F.serif, fontSize: FS[14], background: T.surface, border: `1px solid ${T.border}`, borderRadius: RADIUS.md, color: T.text, minHeight: 44, transition: `border-color ${MOTION.fast}` };
}
