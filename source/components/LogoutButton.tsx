'use client';

import { useRouter } from 'next/navigation';
import { signOutAndClear } from '@/lib/auth/sign-out';
import { TextAction } from '@/components/TextAction';
import { FS, F, T, RADIUS } from '@/lib/design/tokens';

export function LogoutButton({
  compact = false,
  label = '로그아웃',
  redirectTo = '/login',
}: {
  compact?: boolean;
  /** 버튼 문구(넓은 형태). 승인 대기 화면처럼 문맥 문구가 필요한 곳이 바꿔 쓴다. */
  label?: string;
  /** 로그아웃 뒤 이동할 경로. */
  redirectTo?: string;
}) {
  const router = useRouter();

  async function handleLogout() {
    // 감사 2026-09-03 V-17: 로그아웃의 단일 출처. 탭 상태(금고 열쇠 포함)를 먼저 지우고
    // 세션을 끝낸다. 지우는 순서·이유는 lib/auth/sign-out.ts 헤더 참조.
    await signOutAndClear();
    router.push(redirectTo);
    router.refresh();
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleLogout}
        title="로그아웃"
        aria-label="로그아웃"
        style={{
          borderRadius: RADIUS.sm,
          width: 34,
          height: 34,
          background: 'transparent',
          border: `1px solid ${T.border}`,
          color: T.muted,
          fontSize: FS[14],
          cursor: 'pointer',
          padding: 0,
          fontFamily: F.serif, fontWeight: 600,
          transition: 'color 0.15s ease, border-color 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = T.red;
          e.currentTarget.style.borderColor = T.red;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = T.muted;
          e.currentTarget.style.borderColor = T.border;
        }}
      >
        ⎋
      </button>
    );
  }

  /*
   * 넓은 형태는 «글귀» 다(오너 결정 2026-09-28 · 화면 검토 A09 · M99). 차림표 발치에서 테두리 상자가
   * 주 동작처럼 무게를 가졌다. 보조 동작은 글귀라는 규칙(2026-09-14)과 같은 모양(TextAction)이다.
   * 정본(Q-Design extract-nav)이 이 모양을 TextAction 에서 읽어 세 제품의 .qd-rail-logout 으로 낸다.
   */
  return <TextAction onClick={handleLogout}>{label}</TextAction>;
}
