// =============================================================================
// ItemClassificationPreview: R&D 아이디어 입력 시 품목 1차 분류 미리보기
// =============================================================================
// /research/new 페이지에서 "품목 미리보기" 버튼을 누르면 호출.
// LLM 호출 없이 결정론적 키워드 매칭 → 즉시 응답.

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { S, FS, F, T, alpha, STATE, RADIUS, LH } from '@/lib/design/tokens';
import { Btn, Field, infoPopoverStyle } from '@/lib/design/components';
import {
  Q_MATCH_ENGINE_NAME,
  Q_MATCH_ENGINE_SHORT,
  Q_MATCH_ENGINE_TAGLINE,
} from '@/lib/branding';
import { MfdsRegisteredProducts } from './item-classification/MfdsRegisteredProducts';
import { sanitizeKeywords, countKeywords, type AxisKeywords } from '@/lib/medical-items/idea-keywords';
import { shouldAutoFill } from '@/lib/medical-items/auto-fill';
import { describeConfidence, MEASURED_TOP1, CONFIDENCE_META, type MatchConfidence } from '@/lib/medical-items/match-confidence';

/** 추정(카탈로그)↔실측(식약처) 등급 교차표시: route 의 GradeSources 와 동형(클라/서버 분리). */
interface GradeSources {
  catalog_grade: number;
  measured_grade: number;
  mismatch: boolean;
  distribution: Record<number, number>;
  sample_count: number;
  drivers: string[];
}

export interface ClassifyResponse {
  ok: boolean;
  refined?: boolean;
  // 🔴 2026-08-29: 리터럴 유니온을 손으로 적던 것을 SSOT 타입으로 바꿨다.
  //    이 파일은 이미 MatchConfidence 를 import 하고 있었는데 정작 여기서는
  //    같은 값을 다시 적고 있었다. 「가져올 수 있는데 베낀」 자리다.
  // ⚠️ 여기만 required 인 이유: 이 컴포넌트는 `ok` 를 먼저 확인한 뒤에만 이 값을
  //    읽는다(성공 응답에는 서버가 항상 채운다). IfuClassifyDrawer 는 오류 응답도
  //    같은 타입으로 받아 optional 이다. 둘의 차이는 실수가 아니라 사용 방식의 차이다.
  confidence: MatchConfidence;
  matched_keywords?: string[];
  message?: string;
  top: {
    code: string;
    name_kr: string;
    name_en: string;
    grade: number;
    grade_label: string;
    major: string;
    major_label: string;
    description: string;
    full_path: string;
    score: number;
    reasons: string[];
    grade_sources?: GradeSources | null;
  } | null;
  alternatives: Array<{
    code: string;
    name_kr: string;
    grade: number;
    grade_label: string;
    major_label: string;
    score: number;
    /**
     * 정밀 분석이 «목적·원리 상충» 으로 배제한 후보면 그 사유 (2026-08-24).
     * 배제된 후보도 목록에는 남는다. 지우면 LLM 오판을 사용자가 되돌릴 수 없다.
     * 대신 사유를 보이고 뒤로 민다.
     */
    excluded_reason?: string | null;
    /**
     * 정밀 분석이 실제로 검토한 후보인지 (2026-08-24).
     * refine 은 상위 5개만 본다. 나머지는 키워드 점수로 올라왔을 뿐이라 구분해서 보여준다.
     */
    reviewed?: boolean;
  }>;
  /**
   * 6~15위 후보. **신뢰도가 낮음일 때만** 서버가 채운다 (2026-08-24).
   * 「후보에서 고르세요」라고 말하려면 그 후보가 정답을 담고 있어야 하는데,
   * 5개로는 64.5% 였다. 15개면 77.8%(실측). 근거는 lib/medical-items/classifier.ts.
   */
  extended_candidates?: ClassifyResponse['alternatives'];
  refinement?: {
    reasoning: string | null;
    alternative_note: string | null;
    /** AI 가 판단에 쓴 기기 정체 축(predicate LLM). 사용자에게 '왜 이 품목?'을 투명 노출. */
    device_profile?: {
      device_category: string;
      working_principle: string;
      purpose: string;
      energy_or_mechanism: string | null;
      body_site: string | null;
    } | null;
    grade_rationale?: string | null;
    grade_drivers?: string[];
    fallback: boolean | string;
    /** 계측: refine 이 실제 소비한 발안자 키워드 스냅샷(플라이휠). fallback 이면 null. */
    keywords_used?: AxisKeywords | null;
  };
}

// 라벨·뜻풀이는 lib/medical-items/match-confidence 가 SSOT. 여기엔 색만 둔다.
// (2026-08-24 이전엔 이 파일과 IfuClassifyDrawer 가 각자 라벨 표를 들고 있었다.)
const CONFIDENCE_COLOR: Record<MatchConfidence, string> = {
  high: T.green,
  medium: STATE.copper,
  low: T.red,
};
// 🔴 2026-08-24: 경로를 함께 넘긴다. 정밀 분석 경로는 신뢰도를 **LLM 이 스스로**
//    매기고, 실측 정확도가 룰 경로와 완전히 다르다(64% vs 97%). 경로를 안 보면
//    화면이 64% 짜리 판정에 「약 97%」를 찍는다. 실제로 그러고 있었다.
const confidenceCfg = (c: MatchConfidence, refined: boolean) => ({
  ...describeConfidence(c, refined ? 'refined' : 'rule'),
  color: CONFIDENCE_COLOR[c],
});

const GRADE_COLOR: Record<number, string> = {
  1: T.green,
  2: STATE.cobalt,
  3: STATE.copper,
  4: T.red,
};

interface Props {
  payload: {
    description: string;
    intendedUse?: string;
    titleHint?: string;
    patientPopulation?: string;
    /** 발안자 검토 5축 키워드: refine 프롬프트 참고 섹션으로만(임베딩·후보풀 무접촉). */
    ideaKeywords?: AxisKeywords | null;
  };
  enabled: boolean;
  /** 선택: 'top 결과를 이 품목으로 확정' 버튼 추가. async 실패 시 throw.
   *  manual=true 면 카탈로그에 없는 코드도 수용해서 직접 입력으로 확정. */
  onConfirm?: (item: {
    code: string;
    name_kr: string;
    grade: number;
    manual?: boolean;
  }) => Promise<void>;
  /** 이미 확정된 코드: 같으면 '확정됨' 표시, 다르면 '재확정' 버튼 */
  confirmedCode?: string | null;
  /** ★DB 박제된 분석 결과 { key, result }: key 가 현재 payload 해시와 같으면 재분석 없이 hydrate.
   *  org 멤버·모든 기기 공유(localStorage 위의 완전 박제). payload 바뀌면 key 불일치로 자동 stale. */
  dbCached?: { key: string; result: ClassifyResponse } | null;
  /** 분석 성공 시 호출: 부모가 DB(save-qmatch)에 박제. (key=payload 해시) */
  onResult?: (key: string, result: ClassifyResponse) => void;
}

// 결과 캐시 키: 같은 (description, intendedUse, titleHint) 조합이면 같은 키.
// description 이 바뀌면 stale → 자동으로 cache miss → 다시 분석 필요.
// ★localStorage 로 박제: 탭/세션을 닫아도 같은 기기에서 결과 보존(재분석 API 재호출 방지).
//   같은 payload(내용 해시 키)면 재방문 시 그대로 hydrate → "품목 미리보기" 재실행 불필요.
//   (기기 간 완전 박제는 DB 컬럼 필요. 별도. cacheKey 는 내용 해시라 payload 바뀌면 자동 stale.)
/** 5축 키워드를 축순 canonical 문자열로: 캐시키 정합. 유효 키워드 0이면 ''. */
function canonicalKeywords(k?: AxisKeywords | null): string {
  if (!k || countKeywords(k) === 0) return '';
  const s = sanitizeKeywords(k);
  return (['material', 'structure', 'site', 'principle', 'purpose'] as const)
    .map((ax) => s[ax].join(','))
    .join('|');
}

function cacheKeyFor(payload: { description: string; intendedUse?: string; titleHint?: string; patientPopulation?: string; ideaKeywords?: AxisKeywords | null }): string {
  // 단순 hash: djb2 변형. 256자 이내 안전.
  // ★키워드는 refine 결과에 영향 → 키에 포함(silent stale 방지). 단 유효 키워드 0이면
  //   |kw 를 안 붙여 기존 캐시(키워드 미반영)와 키가 동일 → 무영향(회귀 0).
  const kw = canonicalKeywords(payload.ideaKeywords);
  const src = `${payload.description}|${payload.intendedUse ?? ''}|${payload.titleHint ?? ''}|${payload.patientPopulation ?? ''}${kw ? `|kw:${kw}` : ''}`;
  let h = 5381;
  for (let i = 0; i < src.length; i++) h = ((h * 33) ^ src.charCodeAt(i)) >>> 0;
  return `qmatch.preview.v1.${h.toString(36)}`;
}

function loadCachedResult(key: string): ClassifyResponse | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as ClassifyResponse;
  } catch {
    return null;
  }
}

function saveCachedResult(key: string, data: ClassifyResponse): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // quota exceeded: 무시 (분석은 정상 작동, 캐시만 실패)
  }
}

export function ItemClassificationPreview({ payload, enabled, onConfirm, confirmedCode, dbCached, onResult }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 페이지 navigation 후 돌아와도 결과 유지: localStorage 로부터 hydrate.
  // payload 가 바뀌면 cacheKey 가 바뀌어 자동으로 빈 결과(다시 분석 가능 상태) 노출.
  // payload 의 실제 입력값이 바뀔 때만 해시 재계산 (loading/error state 리렌더 시 불필요한 djb2 순회 방지).
  const cacheKey = useMemo(
    () => cacheKeyFor(payload),
    [
      payload.description,
      payload.intendedUse,
      payload.titleHint,
      payload.patientPopulation,
      canonicalKeywords(payload.ideaKeywords),
    ],
  );
  // hydrate 우선순위: ①DB 박제(key 일치) → ②localStorage. DB 는 org·기기 공유.
  const [result, setResult] = useState<ClassifyResponse | null>(() =>
    dbCached && dbCached.key === cacheKey ? dbCached.result : loadCachedResult(cacheKey),
  );
  // payload 변경 시 (description 수정 등) 캐시 재조회: stale 이면 setResult(null) 자연 발생.
  //   DB 박제 key 가 현재 payload 와 같으면 그걸 우선 hydrate(다른 멤버/기기가 이미 분석해둔 결과).
  useEffect(() => {
    if (dbCached && dbCached.key === cacheKey) {
      setResult(dbCached.result);
      return;
    }
    setResult(loadCachedResult(cacheKey));
  }, [cacheKey, dbCached]);

  // refine=true 고정: 사용자 피드백: '품목 미리보기' 클릭 시 rule engine +
  // AI 정밀 분석을 항상 같이 실행해서 한 번에 정확한 결과 보여주기.
  // (분리해서 2단계로 돌리던 이전 UX 는 사용자가 항상 정밀 분석을 누르게 됐음)
  async function classify() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/research/classify-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, refine: true }),
      });
      // 응답이 JSON 이 아닌 경우 (timeout / Next 기본 error 페이지) 안전 처리
      const text = await res.text();
      let data: { message?: string; error?: string } | ClassifyResponse | null = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        const snippet = text.slice(0, 200);
        setError(
          res.ok
            ? `분류 응답을 해석할 수 없습니다: ${snippet}`
            : `분류 실패 (${res.status}): ${snippet || '응답 본문 없음'}`,
        );
        return;
      }
      if (!res.ok) {
        const errData = data as { message?: string; error?: string } | null;
        setError(errData?.message ?? errData?.error ?? `분류 실패 (${res.status})`);
        return;
      }
      const next = data as ClassifyResponse;
      setResult(next);
      // 분석 결과를 같은 payload 조합으로 캐시: 다음 mount 때 자동 hydrate.
      saveCachedResult(cacheKey, next);
      // ★DB 박제: org·모든 기기 공유(재분석 API 방지). 실패해도 UX 무영향(부모가 best-effort).
      onResult?.(cacheKey, next);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        marginTop: S[5],
        padding: '20px 22px',
        background: alpha(T.blue, 0.05),
        borderLeft: `3px solid ${T.blue}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: S[3],
          gap: S[3],
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: FS[10],
              color: T.blue,
              fontFamily: F.mono,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: S[1],
            }}
          >
            {Q_MATCH_ENGINE_NAME} · MFDS 품목 분류
          </div>
          <div
            style={{
              fontSize: FS[12],
              color: T.muted,
              fontFamily: F.serif,
              lineHeight: LH.relaxed,
              maxWidth: 600,
            }}
          >
            {Q_MATCH_ENGINE_TAGLINE}. 별표 1 의료기기 품목코드 (2,224개) 후보·등급을 한 번에
            추정합니다.
          </div>
        </div>
        <div style={{ display: 'flex', gap: S[2], alignItems: 'center', flexWrap: 'wrap' }}>
          <Btn
            p={false}
            sm
            onClick={() => classify()}
            disabled={!enabled || loading}
            style={enabled ? { borderColor: T.blue, color: T.blue } : undefined}
          >
            {loading && <Spinner color={T.blue} />}
            {loading
              ? '분석 중... (보통 10~30초)'
              : result
                ? '다시 분석'
                : `품목 미리보기 (${Q_MATCH_ENGINE_SHORT})`}
          </Btn>
        </div>
      </div>

      {!enabled && (
        <div
          style={{
            fontSize: FS[11],
            color: T.muted,
            fontFamily: F.mono,
            marginTop: S[1.5],
          }}
        >
          아이디어 설명을 10자 이상 입력하면 호출할 수 있습니다.
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '10px 14px',
            background: alpha(T.red, 0.08),
            borderLeft: `2px solid ${T.red}`,
            fontSize: FS[12],
            color: T.red,
            fontFamily: F.mono,
            marginTop: S[2],
          }}
        >
          {error}
        </div>
      )}

      {result && result.top === null && (
        <div
          style={{
            padding: '12px 14px',
            // copper 상태색: 테마 변수 추종(라이트는 AA 보정 진한 톤)
            background: alpha(STATE.copper, 0.06),
            borderLeft: `2px solid ${STATE.copper}`,
            fontSize: FS[12],
            color: T.subtle,
            fontFamily: F.serif,
            lineHeight: LH.relaxed,
            marginTop: S[3],
          }}
        >
          {result.message ??
            '매칭되는 품목을 찾지 못했습니다. 더 구체적인 키워드 (재료, 사용 부위, 작동 원리) 를 추가해 주세요.'}
        </div>
      )}

      {result && result.top && (
        <ResultBody
          result={result}
          onConfirm={onConfirm}
          confirmedCode={confirmedCode ?? null}
        />
      )}

      {/* 직접 입력: 후보 중 적합한 게 없을 때. confirm 콜백이 있을 때만 노출. */}
      {onConfirm && (
        <ManualEntryForm
          onConfirm={onConfirm}
          confirmedCode={confirmedCode ?? null}
        />
      )}

      {/* keyframes for spinner */}
      <style>{`@keyframes qa-item-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Spinner({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 11,
        height: 11,
        borderRadius: '50%',
        border: `1.5px solid ${color}`,
        borderTopColor: 'transparent',
        animation: 'qa-item-spin 0.9s linear infinite',
      }}
    />
  );
}

function ResultBody({
  result,
  onConfirm,
  confirmedCode,
}: {
  result: ClassifyResponse;
  onConfirm?: (item: { code: string; name_kr: string; grade: number; manual?: boolean }) => Promise<void>;
  confirmedCode: string | null;
}) {
  const top = result.top!;
  const cfg = confidenceCfg(result.confidence, !!result.refined);
  const [confirming, setConfirming] = useState(false);
  const [confirmErr, setConfirmErr] = useState<string | null>(null);
  const isConfirmedHere = confirmedCode === top.code;

  return (
    <div style={{ marginTop: S[3.5], display: 'flex', flexDirection: 'column', gap: S[3.5] }}>
      {/* 정밀 분석 근거 박스: refined=true 일 때만 */}
      {result.refined && result.refinement && !result.refinement.fallback && (
        <div
          style={{
            padding: '14px 18px',
            background: alpha(T.champagne, 0.05),
            borderLeft: `3px solid ${T.champagne}`,
          }}
        >
          <div
            style={{
              fontSize: FS[10],
              color: T.champagne,
              fontFamily: F.mono,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: S[2],
            }}
          >
            ✦ 정밀 분석 근거
          </div>
          {/* 기기 정체 축: AI 가 '무엇인지'를 판단한 근거(작용원리·목적·에너지·부위)를
              칩으로 투명 노출. novice 에겐 '왜 이 품목?' 설명(선생님 역할), 숙련자에겐 표면
              단어 트랩 점검. 이 축이 틀렸으면 사용자가 대안 선택으로 교정 → 플라이휠 데이터. */}
          {result.refinement.device_profile && (
            <div style={{ marginBottom: S[3] }}>
              <div
                style={{
                  fontSize: FS[10],
                  color: T.muted,
                  fontFamily: F.mono,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  marginBottom: S[1.5],
                }}
              >
                기기 정체: AI 가 이 축으로 판단했어요
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: S[1.5] }}>
                {(
                  [
                    ['작용원리', result.refinement.device_profile.working_principle],
                    ['목적', result.refinement.device_profile.purpose],
                    ['에너지', result.refinement.device_profile.energy_or_mechanism],
                    ['부위', result.refinement.device_profile.body_site],
                  ] as const
                )
                  .filter(([, v]) => v && v !== 'null')
                  .map(([label, v]) => (
                    <span
                      key={label}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'baseline',
                        gap: S[1],
                        padding: '4px 10px',
                        background: alpha(T.champagne, 0.08),
                        border: `1px solid ${alpha(T.champagne, 0.2)}`,
                        borderRadius: RADIUS.pill,
                      }}
                    >
                      <span style={{ fontSize: FS[9], color: T.champagne, fontFamily: F.mono, letterSpacing: 0.5 }}>
                        {label}
                      </span>
                      <span style={{ fontSize: FS[12], color: T.subtle, fontFamily: F.serif }}>{v}</span>
                    </span>
                  ))}
              </div>
            </div>
          )}
          <div
            style={{
              fontSize: FS[13],
              color: T.text,
              fontFamily: F.serif,
              lineHeight: 1.75,
              whiteSpace: 'pre-wrap',
            }}
          >
            {result.refinement.reasoning}
          </div>
          {result.refinement.alternative_note && (
            <div
              style={{
                marginTop: S[2.5],
                paddingTop: S[2.5],
                borderTop: `1px dashed ${T.border}`,
                fontSize: FS[11],
                color: T.muted,
                fontFamily: F.serif,
                lineHeight: LH.relaxed,
              }}
            >
              ※ {result.refinement.alternative_note}
            </div>
          )}
          {result.refinement.grade_rationale && (
            <div
              style={{
                marginTop: S[2.5],
                paddingTop: S[2.5],
                borderTop: `1px dashed ${T.border}`,
              }}
            >
              <span
                style={{
                  fontSize: FS[10],
                  color: T.champagne,
                  fontFamily: F.mono,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  marginRight: S[1.5],
                }}
              >
                등급 근거
              </span>
              <span style={{ fontSize: FS[12], color: T.subtle, fontFamily: F.serif, lineHeight: LH.relaxed }}>
                {result.refinement.grade_rationale}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Top 1 카드 */}
      <div
        style={{
          padding: '16px 18px',
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderLeft: `3px solid ${cfg.color}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: S[3],
            flexWrap: 'wrap',
            marginBottom: S[2.5],
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: S[2.5] }}>
            <span
              style={{
                fontSize: FS[11],
                color: T.champagne,
                fontFamily: F.mono,
                letterSpacing: 0.5,
              }}
            >
              {top.code}
            </span>
            <ConfidenceBadge result={result} />
          </div>
          <span
            style={{
              fontSize: FS[11],
              color: GRADE_COLOR[top.grade],
              fontFamily: F.mono,
              fontWeight: 600,
            }}
          >
            {top.grade_label}
          </span>
        </div>

        <GradeMetaRow
          gradeSources={top.grade_sources ?? null}
          drivers={result.refinement?.grade_drivers ?? []}
        />

        <div
          style={{
            fontSize: FS[18],
            color: T.text,
            fontFamily: F.serif,
            fontWeight: 500,
            marginBottom: S[1.5],
            letterSpacing: '-0.01em',
          }}
        >
          {top.name_kr}
        </div>
        <div
          style={{
            fontSize: FS[10],
            color: T.muted,
            fontFamily: F.mono,
            letterSpacing: 0.5,
            marginBottom: S[2.5],
          }}
        >
          {top.full_path}
        </div>

        {top.description && (
          <div
            style={{
              paddingTop: S[2.5],
              marginBottom: S[2.5],
              borderTop: `1px dashed ${T.border}`,
            }}
          >
            <div
              style={{
                fontSize: FS[10],
                color: T.muted,
                fontFamily: F.mono,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                marginBottom: S[1.5],
              }}
            >
              MFDS 분류 요약 발췌
            </div>
            <div
              style={{
                fontSize: FS[12],
                color: T.subtle,
                fontFamily: F.serif,
                lineHeight: LH.loose,
              }}
            >
              {top.description}
            </div>
            <div
              style={{
                fontSize: FS[10],
                color: T.muted,
                fontFamily: F.mono,
                marginTop: S[1.5],
                lineHeight: LH.normal,
              }}
            >
              ※ 식약처 별표 1 품목코드 표의 <strong>분류용 요약</strong> 입니다. 전체 정의·세부 사양은
              <a
                href={`https://emed.mfds.go.kr/portal/itemSearch/ItemSearchList.do`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: T.champagne,
                  textDecoration: 'none',
                  marginLeft: S[1],
                  borderBottom: `1px dashed ${T.champagne}`,
                }}
              >
                식약처 의료기기 정보 포털
              </a>
              에서 코드 <strong style={{ color: T.text }}>{top.code}</strong> 로 조회하세요.
            </div>
          </div>
        )}

        {top.reasons.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: S[1.5],
              fontSize: FS[10],
              color: T.muted,
              fontFamily: F.mono,
            }}
          >
            {top.reasons.map((r, i) => (
              <span
                key={i}
                style={{
                  padding: '3px 8px',
                  border: `1px solid ${T.border}`,
                  letterSpacing: 0.3,
                }}
              >
                {r}
              </span>
            ))}
          </div>
        )}

        {/* MFDS 등재 실제 제품 sanity check + FDA 교차 검증 + 추적관리 badge */}
        <MfdsRegisteredProducts
          itemName={top.name_kr}
          code={top.code}
          englishHint={top.name_en}
        />

        {/* 확정 버튼: onConfirm 콜백이 있을 때만. profile 페이지에서 사용. */}
        {onConfirm && (
          <div
            style={{
              marginTop: S[3.5],
              paddingTop: S[3],
              borderTop: `1px dashed ${T.border}`,
              display: 'flex',
              gap: S[2.5],
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {isConfirmedHere ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: S[1.5],
                  padding: '6px 12px',
                  border: `1px solid ${T.green}`,
                  background: alpha(T.green, 0.08),
                  color: T.green,
                  fontSize: FS[10],
                  fontFamily: F.mono,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                ✓ 이 품목으로 확정됨
              </span>
            ) : (
              <button
                type="button"
                disabled={confirming}
                onClick={async () => {
                  setConfirming(true);
                  setConfirmErr(null);
                  try {
                    await onConfirm({
                      code: top.code,
                      name_kr: top.name_kr,
                      grade: top.grade,
                    });
                  } catch (e) {
                    setConfirmErr(e instanceof Error ? e.message : String(e));
                  } finally {
                    setConfirming(false);
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: T.champagne,
                  color: T.bg,
                  border: `1px solid ${T.champagne}`,
                  fontSize: FS[10],
                  fontFamily: F.mono,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                  cursor: confirming ? 'not-allowed' : 'pointer',
                  opacity: confirming ? 0.6 : 1,
                }}
              >
                {confirming ? '확정 중...' : `이 품목으로 확정: ${top.code}`}
              </button>
            )}
            {confirmedCode && confirmedCode !== top.code && (
              <span
                style={{
                  fontSize: FS[10],
                  color: T.muted,
                  fontFamily: F.mono,
                  letterSpacing: 0.3,
                }}
              >
                현재 확정: {confirmedCode}
              </span>
            )}
            {confirmErr && (
              <span style={{ fontSize: FS[10], color: T.red, fontFamily: F.mono }}>
                ✗ {confirmErr}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 대안 후보 */}
      {result.alternatives.length > 0 && (
        <div>
          <div
            style={{
              fontSize: FS[10],
              color: T.muted,
              fontFamily: F.mono,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: S[2],
            }}
          >
            대안 후보 ({result.alternatives.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: S[1.5] }}>
            {result.alternatives.map((a) => (
              <AlternativeRow
                key={a.code}
                a={a}
                onConfirm={onConfirm}
                confirmedCode={confirmedCode}
              />
            ))}
          </div>
        </div>
      )}

      {/* 🔴 2026-08-24: 신뢰도 「낮음」은 「1위를 답으로 받지 말고 후보에서 고르세요」
          라는 뜻인데, 정작 그 후보가 5개뿐이라 정답이 64.5% 만 들어 있었다.
          말과 도구가 어긋나 있었다. 15개면 77.8%(정답셋 3,244건 중 low 1,100건 실측).
          「높음」은 5개에서 이미 99.1% 라 늘리지 않는다. 접어 두고 필요할 때만 편다. */}
      {result.confidence === 'low' && (result.extended_candidates?.length ?? 0) > 0 && (
        <ExtendedCandidates
          items={result.extended_candidates!}
          onConfirm={onConfirm}
          confirmedCode={confirmedCode}
        />
      )}

      <div
        style={{
          fontSize: FS[10],
          color: T.muted,
          fontFamily: F.mono,
          letterSpacing: 0.3,
          lineHeight: LH.relaxed,
        }}
      >
        ※ 1차 추정 결과입니다. 실제 등록 시 식약처 분류 기준 / 제품 특성 / 임상 사용 환경 확인 후 확정해 주세요.
      </div>
    </div>
  );
}

// ─── 신뢰도 배지 + hover 시 판정 근거 툴팁 ───────────────────────────────
// 클릭 가능 영역: 배지 자체. 호버 시 아래로 absolute 팝업.
// 컨텐츠는 result 의 score gap / refined / alternative_note / fallback 으로
// '왜 이 신뢰도가 나왔는가' 를 사용자 시점으로 한 단락 안내.
function ConfidenceBadge({ result }: { result: ClassifyResponse }) {
  const [hover, setHover] = useState(false);
  const cfg = confidenceCfg(result.confidence, !!result.refined);
  const top = result.top;
  const topScore = top?.score ?? 0;
  const secondScore = result.alternatives[0]?.score ?? 0;
  const gap = topScore - secondScore;

  // ── 판정 근거 텍스트 ─────────────────────────────────────────────────
  const reasons: string[] = [];
  if (result.refined && result.refinement) {
    if (result.refinement.fallback) {
      reasons.push(
        'Q-Atelier 정밀 분석이 timeout 등으로 실패해 키워드 결과만 사용. 그래서 신뢰도가 낮게 잡힘.',
      );
    } else if (result.refinement.alternative_note) {
      reasons.push(
        'Q-Atelier 정밀 분석에서 「후보 목록에 더 적합한 코드가 없을 수 있다」 고 판단함. 아래 "정밀 분석 근거" 박스의 메모를 확인하세요.',
      );
    } else {
      reasons.push(
        'Q-Atelier 분석 엔진이 후보 중 가장 적합한 코드를 한 개로 좁혀 판정한 결과. 키워드 점수와 의미 검토를 종합한 값.',
      );
    }
  } else {
    reasons.push(
      `${Q_MATCH_ENGINE_SHORT} 룰 매칭 결과만 사용 (Q-Atelier 정밀 분석 미실행). 정밀 분석을 같이 돌리면 더 정확합니다.`,
    );
  }

  // 1차 룰 매칭 점수: 항상 표시
  if (topScore > 0) {
    reasons.push(
      `${Q_MATCH_ENGINE_SHORT} 룰 매칭: 1위 ${topScore}점, 2위 ${secondScore}점 (격차 ${gap}점).`,
    );
  }

  // 🔴 2026-08-24: 여기 있던 안내는 «1위 ≥15점 + 격차 ≥4» 라는 종전 규칙을 설명했다.
  //    그 규칙은 폐기됐는데 설명만 남아, 화면이 없는 규칙을 알려 주고 있었다.
  //    새 판정은 「입력이 이 품목의 정의와 얼마나 닮았는가」다(match-confidence.ts).
  //    실측 근거를 그대로 노출한다. 숫자를 숨기면 사용자는 「높음」을 확정으로 읽는다.
  reasons.push(cfg.meaning);
  // 🔴 경로마다 실측치도 표본도 다르다. 표본이 모자라면 «숫자를 말하지 않는다».
  //    없는 숫자를 지어내는 것보다 「모른다」가 정직하다.
  if (cfg.measuredTop1) {
    reasons.push(
      result.refined
        ? `이 표기의 실측 정확도: 1위가 정답일 확률 약 ${cfg.measuredTop1} (R&D 발안 문장 50건 기준, 참고치).`
        : `이 표기의 실측 정확도: 1위가 정답일 확률 약 ${cfg.measuredTop1} (내부 정답셋 3,244건 기준).`,
    );
  } else {
    reasons.push('이 표기의 실측 정확도는 표본이 적어 아직 숫자로 말씀드리지 않습니다.');
  }
  if (topScore > 0) {
    reasons.push(
      `참고: ${Q_MATCH_ENGINE_SHORT} 룰 매칭 점수는 신뢰도 판정에 쓰지 않습니다. ` +
        '점수가 높다고 맞는 것이 아니라는 것이 실측으로 확인됐기 때문입니다.',
    );
  }

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span
        style={{
          fontSize: FS[10],
          color: cfg.color,
          fontFamily: F.mono,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          padding: '2px 8px',
          border: `1px solid ${cfg.color}`,
          cursor: 'help',
          display: 'inline-flex',
          alignItems: 'center',
          gap: S[1],
        }}
      >
        신뢰도 {cfg.label}
        <span style={{ opacity: 0.7 }}>ⓘ</span>
      </span>
      {hover && (
        <div
          role="tooltip"
          style={{
            ...infoPopoverStyle({ width: 360, maxWidth: 'calc(100vw - 40px)' }),
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 50,
            borderLeft: `3px solid ${cfg.color}`,
          }}
        >
          <div
            style={{
              fontSize: FS[10],
              color: cfg.color,
              letterSpacing: 1.5,
              fontFamily: F.mono,
              textTransform: 'uppercase',
              fontWeight: 600,
              marginBottom: S[2],
            }}
          >
            신뢰도 {cfg.label}: 판정 근거
          </div>
          <ul
            style={{
              margin: 0,
              padding: '0 0 0 14px',
              fontSize: FS[11],
              color: T.subtle,
              fontFamily: F.serif,
              lineHeight: LH.loose,
            }}
          >
            {reasons.map((r, i) => (
              <li key={i} style={{ marginBottom: S[1] }}>
                {r}
              </li>
            ))}
          </ul>
          <div
            style={{
              marginTop: S[2.5],
              paddingTop: S[2.5],
              borderTop: `1px dashed ${T.border}`,
              fontSize: FS[9],
              color: T.muted,
              fontFamily: F.mono,
              lineHeight: LH.relaxed,
              letterSpacing: 0.3,
            }}
          >
            {/* 🔴 2026-08-24: 여기 있던 범례는 점수 임계값을 설명했다. 그 규칙은
                폐기됐다. 점수는 «입력이 카탈로그 문장과 겹치는 정도» 라 실제
                제품 설명문에서 조용히 거짓말을 했다(high 표기 중 40.4% 만 정답).
                지금 판정은 「입력이 이 품목의 정의와 닮았는가」 + 「두 채널이
                같은 답을 내는가」다. 실측 정확도를 함께 적는다. */}
            <strong style={{ color: T.text }}>{Q_MATCH_ENGINE_SHORT} 판정 기준</strong>
            <br />
            {result.refined ? (
              <>
                정밀 분석이 후보를 검토해 하나를 고른 결과입니다.
                <br />
                {(['high', 'medium', 'low'] as MatchConfidence[]).map((k) => {
                  const m = MEASURED_TOP1.refined[k];
                  return (
                    <span key={k}>
                      {CONFIDENCE_META[k].label} → {m ? `1위 적중 약 ${m}` : '표본이 적어 수치 미제공'}
                      <br />
                    </span>
                  );
                })}
                <span style={{ opacity: 0.85 }}>
                  R&amp;D 발안 문장 50건 실측(2026-08-24). 표본이 작아 참고치입니다.
                </span>
              </>
            ) : (
              <>
                입력 문장이 <strong>그 품목의 정의</strong>와 얼마나 닮았는지로 판정합니다.
                <br />
                {(['high', 'medium', 'low'] as MatchConfidence[]).map((k) => (
                  <span key={k}>
                    {CONFIDENCE_META[k].label} → 1위 적중 약 {MEASURED_TOP1.rule[k]}
                    <br />
                  </span>
                ))}
                <span style={{ opacity: 0.85 }}>
                  내부 정답셋 3,244건 실측. 룰 매칭 «점수» 는 판정에 쓰지 않습니다.
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </span>
  );
}

// ─── 등급 메타 행: 추정↔실측 교차 배지 + 등급 드라이버 칩 ──────────────────
// grade_sources(predicate 실측 사례 집계·사실)와 grade_drivers(LLM 근거·보조)를 Top1
// 카드에 노출. ★등급 숫자는 서버가 결정(LLM 미관여), 여기선 추정↔실측 불일치를 정직 노출만.
// 데이터 없으면 렌더 안 함(graceful degrade: predicate 미실행/MFDS 키 없을 때).
const DRIVER_COLOR: Record<string, string> = {
  이식형: T.red,
  흡수성: STATE.copper,
  일회용: STATE.cobalt,
  체내접촉: STATE.copper,
};

function distText(dist: Record<number, number>): string {
  return Object.entries(dist)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([g, n]) => `${g}등급 ${n}건`)
    .join(', ');
}

function GradeMetaRow({
  gradeSources,
  drivers,
}: {
  gradeSources: GradeSources | null;
  drivers: string[];
}) {
  const hasCross = !!gradeSources && gradeSources.sample_count > 0;
  if (!hasCross && drivers.length === 0) return null;

  const badgeStyle = (color: string): React.CSSProperties => ({
    fontSize: FS[9],
    color,
    fontFamily: F.mono,
    letterSpacing: 0.3,
    padding: '3px 8px',
    border: `1px solid ${color}`,
    background: alpha(color, 0.06),
    cursor: 'help',
  });

  return (
    <div
      style={{ display: 'flex', flexWrap: 'wrap', gap: S[1.5], alignItems: 'center', marginBottom: S[2.5] }}
    >
      {hasCross && gradeSources!.mismatch && (
        <span
          title={`식약처 실측 사례 ${gradeSources!.sample_count}건: 분포 ${distText(gradeSources!.distribution)}`}
          style={badgeStyle(STATE.copper)}
        >
          카탈로그 추정 {gradeSources!.catalog_grade}등급 · 식약처 실측{' '}
          {gradeSources!.measured_grade}등급 ({gradeSources!.sample_count}건): 검토 필요
        </span>
      )}
      {hasCross && !gradeSources!.mismatch && (
        <span
          title={`식약처 실측 사례 ${gradeSources!.sample_count}건: 분포 ${distText(gradeSources!.distribution)}`}
          style={badgeStyle(T.green)}
        >
          식약처 실측 일치 · {gradeSources!.measured_grade}등급 ({gradeSources!.sample_count}건)
        </span>
      )}
      {drivers.map((d) => {
        const c = DRIVER_COLOR[d] ?? T.muted;
        return (
          <span
            key={d}
            style={{
              fontSize: FS[9],
              color: c,
              fontFamily: F.mono,
              letterSpacing: 0.3,
              padding: '3px 8px',
              border: `1px solid ${alpha(c, 0.5)}`,
            }}
          >
            {d}
          </span>
        );
      })}
    </div>
  );
}

// ─── 직접 입력 폼: 후보에 적합한 게 없을 때 수동으로 코드/명/등급 등록 ─────
// confirmedCode 가 있고 그게 카탈로그 후보가 아닌 경우엔 '직접 입력으로 확정됨'
// 안내를 띄움. 평소엔 접혀 있고 '직접 입력' 버튼 누르면 폼이 펼쳐짐.
function ManualEntryForm({
  onConfirm,
  confirmedCode,
}: {
  onConfirm: (item: { code: string; name_kr: string; grade: number; manual?: boolean }) => Promise<void>;
  confirmedCode: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [nameKr, setNameKr] = useState('');
  const [grade, setGrade] = useState<number>(2);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 품목명 → 카탈로그 검색 자동 제안
  interface Suggestion {
    code: string;
    name_kr: string;
    name_en: string;
    grade: number;
    score: number;
  }
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [lookingUp, setLookingUp] = useState(false);
  // 마지막 사용자가 *직접* 채운 코드와 비교해: 사용자가 코드를 손댄 후엔
  // 자동 채움이 덮어쓰지 않도록.
  const lastAutoFilledRef = useRef<string | null>(null);

  // 디바운스된 lookup: 품목명(한글) + 품목 코드(영문/숫자/도트) 둘 다 지원.
  // 사용자가 둘 중 어디에 입력하든 자동으로 매칭 후보 노출.
  useEffect(() => {
    if (!open) return;
    const nameQ = nameKr.trim();
    const codeQ = code.trim();
    // 코드 칸에 유효한 검색 패턴이 있으면 코드 우선, 아니면 이름으로 검색.
    const isCodeSearch = codeQ.length >= 2 && /^[A-Za-z][A-Za-z0-9._-]+$/.test(codeQ);
    const isNameSearch = nameQ.length >= 2;
    if (!isCodeSearch && !isNameSearch) {
      setSuggestions([]);
      return;
    }
    setLookingUp(true);
    // 🔴 2026-09-03 (C-07): 종전엔 타이머만 지웠다. 이미 나간 fetch 는 취소되지 않아, 입력이 바뀌거나
    //    패널이 닫힌 «뒤» 에 도착한 옛 응답이 새 입력 위에 setState 를 돌렸다(빠른 타이핑에서
    //    이전 검색어의 제안이 덮어씀). alive 플래그로 늦은 응답을 버리고 AbortController 로 요청도 끊는다.
    let alive = true;
    const ac = new AbortController();
    const handle = setTimeout(async () => {
      try {
        const payload = isCodeSearch
          ? { code: codeQ, limit: 5 }
          : { name: nameQ, limit: 5 };
        const res = await fetch('/api/research/lookup-item-by-name', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: ac.signal,
        });
        if (!alive) return;
        if (!res.ok) {
          setSuggestions([]);
          return;
        }
        const data = (await res.json()) as { hits: Suggestion[] };
        if (!alive) return;
        const hits = data.hits ?? [];
        setSuggestions(hits);

        // Top hit 가 정확히 일치 (score 100) + 사용자가 다른 필드를 손대지
        // 않은 경우만 자동 채움. 판정은 lib/medical-items/auto-fill(순수 함수·테스트됨).
        const top = hits[0];
        const action = shouldAutoFill({
          isCodeSearch,
          isNameSearch,
          top: top ?? null,
          nameKr,
          code,
          lastAutoFilled: lastAutoFilledRef.current,
        });
        if (action === 'fill_name_and_grade') {
          setNameKr(top.name_kr);
          setGrade(top.grade);
          lastAutoFilledRef.current = top.code;
        } else if (action === 'fill_code_and_grade') {
          setCode(top.code);
          setGrade(top.grade);
          lastAutoFilledRef.current = top.code;
        }
      } catch {
        if (alive) setSuggestions([]);
      } finally {
        if (alive) setLookingUp(false);
      }
    }, 250);
    return () => {
      alive = false;
      ac.abort();
      clearTimeout(handle);
    };
  }, [nameKr, code, open]);

  function pickSuggestion(s: Suggestion) {
    setCode(s.code);
    setNameKr(s.name_kr);
    setGrade(s.grade);
    lastAutoFilledRef.current = s.code;
    setSuggestions([]);
  }

  const canSubmit =
    /^[A-Za-z0-9.\-_/]{2,20}$/.test(code.trim()) &&
    nameKr.trim().length > 0 &&
    [1, 2, 3, 4].includes(grade);

  async function submit() {
    setSubmitting(true);
    setErr(null);
    try {
      await onConfirm({
        code: code.trim(),
        name_kr: nameKr.trim(),
        grade,
        manual: true,
      });
      // 성공 시 폼은 그대로 두되 접어둠 (부모가 confirmedCode 갱신)
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        marginTop: S[3.5],
        padding: '12px 14px',
        border: `1px dashed ${T.border}`,
        background: alpha(T.surface, 0.4),
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'transparent',
          border: 'none',
          color: T.subtle,
          fontSize: FS[10],
          fontFamily: F.mono,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <span>
          {open ? '▲' : '▼'} 직접 입력: 후보 중 적합한 품목이 없을 때
        </span>
        <span style={{ fontSize: FS[9], color: T.muted, letterSpacing: 0.3 }}>
          MFDS 코드 / 품목명 / 등급 수동 등록
        </span>
      </button>

      {open && (
        <div style={{ marginTop: S[3] }}>
          <div
            style={{
              fontSize: FS[11],
              color: T.muted,
              fontFamily: F.serif,
              lineHeight: LH.loose,
              marginBottom: S[2.5],
            }}
          >
            품목명 또는 품목 코드(예: A35025.03) 어디든 입력하면 카탈로그
            에서 자동으로 매칭 후보를 찾아 다른 칸을 채워 드립니다.
            식약처 별표 1 의 정식 명칭/코드로 입력하시면 가장 정확합니다.
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr 90px',
              gap: S[2.5],
              alignItems: 'end',
            }}
          >
            <Field id="item-classify-code" label="품목 코드">
              <input
                id="item-classify-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="A00000.00"
                style={inputStyle}
              />
            </Field>
            <Field id="item-classify-name-kr" label="품목명 (한글)">
              <input
                id="item-classify-name-kr"
                type="text"
                value={nameKr}
                onChange={(e) => setNameKr(e.target.value)}
                placeholder="예: 일회용 수동식 의료용 큐렛"
                style={inputStyle}
              />
            </Field>
            <Field id="item-classify-grade" label="등급">
              <select
                id="item-classify-grade"
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                style={inputStyle}
              >
                <option value={1}>1등급</option>
                <option value={2}>2등급</option>
                <option value={3}>3등급</option>
                <option value={4}>4등급</option>
              </select>
            </Field>
          </div>

          {/* 자동 제안: 품목명 입력 시 카탈로그 매칭 */}
          {(lookingUp || suggestions.length > 0) && (
            <div
              style={{
                marginTop: S[2.5],
                padding: '8px 10px',
                background: alpha(T.blue, 0.04),
                border: `1px dashed ${alpha(T.blue, 0.35)}`,
              }}
            >
              <div
                style={{
                  fontSize: FS[10],
                  color: T.muted,
                  fontFamily: F.mono,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  marginBottom: S[1.5],
                  display: 'flex',
                  alignItems: 'center',
                  gap: S[1.5],
                }}
              >
                {lookingUp ? (
                  <>
                    <Spinner color={T.blue} /> 카탈로그 검색 중…
                  </>
                ) : (
                  <>카탈로그 자동 제안: 클릭해서 채우기</>
                )}
              </div>
              {!lookingUp && suggestions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: S[1] }}>
                  {suggestions.map((s) => {
                    const isChosen = code.trim() === s.code;
                    return (
                      <button
                        key={s.code}
                        type="button"
                        onClick={() => pickSuggestion(s)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '90px 1fr 60px',
                          gap: S[2.5],
                          alignItems: 'center',
                          padding: '6px 10px',
                          background: isChosen ? alpha(T.champagne, 0.1) : 'transparent',
                          border: `1px solid ${isChosen ? T.champagne : T.border}`,
                          color: T.text,
                          fontSize: FS[11],
                          fontFamily: F.ui,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ color: T.champagne, fontFamily: F.mono, letterSpacing: 0.3 }}>
                          {s.code}
                        </span>
                        <span style={{ color: T.text, fontFamily: F.serif }}>
                          {s.name_kr}
                        </span>
                        <span
                          style={{
                            color: GRADE_COLOR[s.grade],
                            fontFamily: F.mono,
                            fontSize: FS[10],
                            textAlign: 'right',
                          }}
                        >
                          {s.grade}등급
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {!lookingUp && suggestions.length === 0 && nameKr.trim().length >= 2 && (
                <div
                  style={{
                    fontSize: FS[10],
                    color: T.muted,
                    fontFamily: F.mono,
                    lineHeight: LH.relaxed,
                  }}
                >
                  카탈로그에서 매칭되는 품목이 없습니다. 코드·등급을 직접 입력해 주세요.
                </div>
              )}
            </div>
          )}

          <div
            style={{
              marginTop: S[3],
              display: 'flex',
              gap: S[2.5],
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              disabled={!canSubmit || submitting}
              onClick={() => void submit()}
              style={{
                padding: '8px 16px',
                background: canSubmit ? T.champagne : 'transparent',
                color: canSubmit ? T.bg : T.muted,
                border: `1px solid ${canSubmit ? T.champagne : T.border}`,
                fontSize: FS[10],
                fontFamily: F.mono,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? '확정 중...' : '이 품목으로 확정 (직접 입력)'}
            </button>
            {!canSubmit && (code.length > 0 || nameKr.length > 0) && (
              <span style={{ fontSize: FS[10], color: T.muted, fontFamily: F.mono }}>
                코드(영문/숫자/. -_/ 2~20자) · 품목명 · 등급을 모두 입력해 주세요.
              </span>
            )}
            {confirmedCode && (
              <span
                style={{
                  fontSize: FS[10],
                  color: T.muted,
                  fontFamily: F.mono,
                  letterSpacing: 0.3,
                }}
              >
                현재 확정: {confirmedCode}
              </span>
            )}
            {err && (
              <span style={{ fontSize: FS[10], color: T.red, fontFamily: F.mono }}>
                ✗ {err}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 직접 입력 폼 내부 inline 유틸: 다른 곳에서 안 쓰니 같은 파일에 두자.
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  background: T.bg,
  border: `1px solid ${T.border}`,
  color: T.text,
  fontSize: FS[12],
  fontFamily: F.mono,
  letterSpacing: 0.3,
};

// ─── 대안 후보 row: 인라인 확정 버튼 포함 ─────────────────────────────────
function AlternativeRow({
  a,
  onConfirm,
  confirmedCode,
}: {
  a: ClassifyResponse['alternatives'][number];
  onConfirm?: (item: { code: string; name_kr: string; grade: number; manual?: boolean }) => Promise<void>;
  confirmedCode: string | null;
}) {
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isConfirmedHere = confirmedCode === a.code;
  // 정밀 분석이 «목적 상충» 으로 배제한 후보. 고를 수는 있지만 이유를 먼저 보여준다.
  const excluded = !isConfirmedHere && !!a.excluded_reason;
  return (
    <div
      style={{
        border: `1px solid ${isConfirmedHere ? T.green : excluded ? alpha(T.red, 0.35) : T.border}`,
        background: isConfirmedHere
          ? alpha(T.green, 0.05)
          : excluded
            ? alpha(T.red, 0.04)
            : 'transparent',
      }}
    >
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: onConfirm ? '88px 1fr 60px 50px 130px' : '90px 1fr 70px 50px',
        gap: S[3],
        alignItems: 'center',
        padding: '8px 12px',
        fontSize: FS[11],
        color: T.subtle,
        fontFamily: F.ui,
        opacity: excluded ? 0.72 : 1,
      }}
    >
      <span style={{ color: T.champagne, fontFamily: F.mono, letterSpacing: 0.3 }}>
        {a.code}
      </span>
      <span style={{ color: T.text, fontFamily: F.serif }}>
        {a.name_kr}
        {a.reviewed === false && !excluded && (
          <span
            title="정밀 분석은 상위 후보만 검토합니다. 이 후보는 키워드 점수로 올라왔을 뿐 검토를 거치지 않았습니다."
            style={{
              marginLeft: S[2],
              padding: '1px 6px',
              border: `1px solid ${T.border}`,
              color: T.muted,
              fontSize: FS[10],
              fontFamily: F.mono,
              letterSpacing: 0.3,
              whiteSpace: 'nowrap',
            }}
          >
            미검토
          </span>
        )}
        {err && (
          <span style={{ marginLeft: S[2], fontSize: FS[10], color: T.red, fontFamily: F.mono }}>
            ✗ {err}
          </span>
        )}
      </span>
      <span style={{ color: GRADE_COLOR[a.grade], fontFamily: F.mono, fontSize: FS[10] }}>
        {a.grade}등급
      </span>
      <span style={{ color: T.muted, fontFamily: F.mono, fontSize: FS[10], textAlign: 'right' }}>
        {a.score}점
      </span>
      {onConfirm && (
        <span style={{ textAlign: 'right' }}>
          {isConfirmedHere ? (
            <span
              style={{
                display: 'inline-block',
                padding: '4px 8px',
                border: `1px solid ${T.green}`,
                background: alpha(T.green, 0.1),
                color: T.green,
                fontSize: FS[10],
                fontFamily: F.mono,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              ✓ 확정됨
            </span>
          ) : (
            <button
              type="button"
              disabled={confirming}
              onClick={async () => {
                setConfirming(true);
                setErr(null);
                try {
                  await onConfirm({ code: a.code, name_kr: a.name_kr, grade: a.grade });
                } catch (e) {
                  setErr(e instanceof Error ? e.message : String(e));
                } finally {
                  setConfirming(false);
                }
              }}
              style={{
                padding: '4px 10px',
                background: 'transparent',
                border: `1px solid ${T.champagne}`,
                color: T.champagne,
                fontSize: FS[10],
                fontFamily: F.mono,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                cursor: confirming ? 'not-allowed' : 'pointer',
                opacity: confirming ? 0.6 : 1,
              }}
            >
              {confirming ? '확정 중...' : excluded ? '그래도 확정' : '이 품목 확정'}
            </button>
          )}
        </span>
      )}
    </div>
    {excluded && (
      <div
        style={{
          padding: '6px 12px 8px',
          borderTop: `1px solid ${alpha(T.red, 0.2)}`,
          fontSize: FS[10],
          lineHeight: LH.relaxed,
          color: T.muted,
          fontFamily: F.ui,
        }}
      >
        <span style={{ color: T.red, fontFamily: F.mono, letterSpacing: 0.5 }}>⚠ 정밀 분석이 배제</span>
        {' · '}
        {a.excluded_reason}
      </div>
    )}
    </div>
  );
}

// ─── 확장 후보 (신뢰도 낮음 전용) ─────────────────────────────────────────
// 🔴 2026-08-24. 「낮음」 표기의 뜻은 「1위를 답으로 받지 말고 후보에서 고르세요」다.
//    그런데 그 후보 목록이 5개뿐이라 정답이 64.5% 밖에 들어 있지 않았다.
//    화면이 시키는 일을 화면이 지원하지 않고 있었다.
//
//    실측(정답셋 3,244건 중 「낮음」 판정 1,100건, 정답이 목록 안에 있을 확률):
//      @5 64.5%  @10 73.7%  @15 77.8%  @20 81.0%  @30 84.9%
//    15 까지가 +13.4pp 이고 그 뒤로 개당 이득이 급감해 15 로 잡았다.
//
//    기본은 접어 둔다. 목록이 갑자기 세 배가 되면 그것대로 읽기 어렵다.
function ExtendedCandidates({
  items,
  onConfirm,
  confirmedCode,
}: {
  items: ClassifyResponse['alternatives'];
  onConfirm?: (item: { code: string; name_kr: string; grade: number; manual?: boolean }) => Promise<void>;
  confirmedCode: string | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          background: 'none',
          border: `1px dashed ${T.border}`,
          color: T.subtle,
          fontFamily: F.mono,
          fontSize: FS[10],
          letterSpacing: 0.3,
          padding: `${S[2]}px ${S[3]}px`,
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          lineHeight: LH.relaxed,
        }}
      >
        {open ? '▾' : '▸'} 후보 {items.length}개 더 보기
        <span style={{ opacity: 0.75 }}>
          {' '}
          · 신뢰도가 낮을 때는 1위가 정답일 확률이 약 35% 입니다. 여기까지 넓혀 보면 약 78% 안에 들어옵니다.
        </span>
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: S[1.5], marginTop: S[2] }}>
          {items.map((a) => (
            <AlternativeRow key={a.code} a={a} onConfirm={onConfirm} confirmedCode={confirmedCode} />
          ))}
        </div>
      )}
    </div>
  );
}
