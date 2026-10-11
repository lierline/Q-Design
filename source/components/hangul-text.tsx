import { QDText } from '@/lib/design/q-design-labels';
// =============================================================================
// lib/design/hangul-text.tsx: 한글이 섞일 수 있는 짧은 글의 글꼴 (화면 검토 A44 · 2026-09-28)
// =============================================================================
// 오너 기준: 번호 · 숫자 · 코드는 고정폭(JetBrains Mono), 한글 글은 본문 글꼴(Pretendard).
// 조항 · 근거 · 목록 줄 보조 글처럼 «코드일 때도 있고 한글일 때도 있는» 자리가 여럿이라 한 곳에서 가른다.
// 고정폭에 한글이 오면 글자는 Pretendard 로 대신 그려지지만 어절 공백이 고정폭 폭(0.6em)으로 벌어지고,
// 손으로 준 자간(0.06em 등)까지 붙어 낱글자로 흩어져 보였다.
//
// 🔑 'use client' 를 달지 않는다: 서버 화면(page.tsx)도 이 함수를 부른다. 클라이언트 모듈의 함수는 서버에서 못 부른다.
//    lib/design/tokens.ts 는 엔진 검증 근거(validation-manifest)에 걸려 있어 여기에 따로 둔다.
import { QDScale } from '@/lib/design/q-design-scale';
import type { CSSProperties, ReactNode } from 'react';
import { F, FS, T, hasHangul } from '@/lib/design/tokens';

/** 한글이 있으면 본문 글꼴 · 자간 0 · 숫자 자리 맞춤, 없으면(코드 · 번호) 고정폭 · 받은 자간 */
export function codeOrTextFont(text: unknown, tracking: number | string = QDText.tracking.codeDefault): CSSProperties {
  return hasHangul(text)
    ? { fontFamily: QDScale.family.ui, letterSpacing: "var(--qd-atelier-letter-spacing-1029873b1c)", fontVariantNumeric: 'tabular-nums' }
    : { fontFamily: QDScale.family.mono, letterSpacing: tracking };
}

/**
 * 목록 줄(EntityRow 배지 줄 등)의 보조 글 한 줄: 종류 · 등급 · 날짜 · 경로 같은 짧은 정보.
 * 스무 곳 넘는 목록이 «고정폭 · 자간 0.06em» 을 저마다 손으로 적어, 한글(«동등성 (Annex XIV)» ·
 * «Class IIa · (예시) 인증기관» · «EO 가스 멸균 · ISO 11135») 이 벌어져 보였다. 한 곳으로 모았다.
 */
export function RowMeta({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span style={{ fontSize: QDScale.font[12], color: color ?? T.subtle, ...codeOrTextFont(children, QDText.tracking.codeMeta) }}>
      {children}
    </span>
  );
}
