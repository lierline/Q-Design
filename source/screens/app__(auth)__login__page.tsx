'use client';

// /login: 로그인·회원가입

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Alert, Btn, In, Lbl, Sel } from '@/lib/design/components';
import { AuthThemeToggle } from '@/components/AuthThemeToggle';
import { Logo } from '@/components/Logo';
import { S, FS, BRAND, F, T, alpha, LH, RADIUS } from '@/lib/design/tokens';
import { tintBorder } from '@/lib/design/grain';
import { translateAuthError } from '@/lib/auth/translate-error';
import { passkeyErrorMessage, passkeyUsableHere } from '@/lib/auth/passkey';
import { Fingerprint } from 'lucide-react';
import { validatePassword, PASSWORD_POLICY_HINT } from '@/lib/auth/password-policy';
import { APP_VERSION_LABEL } from '@/lib/app-version';
import { useCoreVersion } from '@/lib/hooks/useCoreVersion';
import { RibbonBackground } from '@/components/RibbonBackground';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

type Mode = 'login' | 'signup';

interface OrgMatch {
  org_id: string;
  org_name: string;
  domain: string;
  member_count: number;
  name_matches: boolean;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // MedQraft Core 버전: 사이드바(RuleEngineBadge)와 **같은 훅·같은 SSOT**(DB
  // system_config.rule_engine_version)를 쓴다. 종전엔 컴파일된 상수 RULE_SET_VERSION
  // 을 그대로 찍어 로그인 화면만 v3.4.0 · 사이드바는 v3.4.93 으로 갈렸다(마이그 0307 이
  // 이 한 행만 anon 에 열어 비인증 화면에서도 읽힌다). 못 읽으면 훅이 상수로 떨어진다.
  const coreVersion = useCoreVersion();
  // 로그인 후 항상 홈(dashboard)으로 고정: 마지막 페이지 복원 없음.
  const redirectTo = '/dashboard';
  const initialError = searchParams.get('error');
  // (동시 접속 차단 제거: 멀티 로그인 허용. 2026-06-07)
  const initialMessage = initialError;

  const [mode, setMode] = useState<Mode>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  // clinical 직무는 숨김(deprecate): 임상평가 책임은 RA 가 흡수(2026-06-06).
  const [jobRole, setJobRole] = useState<'ra' | 'qa' | 'rd'>('ra');
  // 🔴 2026-08-29 감사 §3: 가입 화면에 약관·처리방침 동의가 **한 곳도 없었다**.
  //    개인정보 수집은 이미 시작됐는데 「언제 무엇에 동의했는가」를 답할 곳이 없었다.
  //    필수 동의 하나로 묶는다(약관 + 처리방침). 선택 동의(마케팅)는 아직 두지 않는다:
  //    실제로 마케팅 발송을 하지 않는데 체크박스만 만들면 지키지 못할 약속이 된다.
  const [consented, setConsented] = useState(false);

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  // 'Step inside' 후 골드 입장 트랜지션 오버레이 표시 여부.
  const [entering, setEntering] = useState(false);
  // 지문 · 얼굴 로그인(패스키 · 오너 결정 2026-09-27): 브라우저 · 주소(qatelier.co.kr) · 운영 인증 서버 설정이
  // 셋 다 맞을 때만 단추를 보인다(lib/auth/passkey.ts). 누르면 실패하는 단추는 두지 않는다.
  const [passkeyReady, setPasskeyReady] = useState(false);
  useEffect(() => {
    let alive = true;
    passkeyUsableHere().then((ok) => {
      if (alive) setPasskeyReady(ok);
    });
    return () => {
      alive = false;
    };
  }, []);
  // 입장 트랜지션 골드 입자: 위치·크기·속도·드리프트 무작위(마운트 시 1회 고정).
  // entering 시에만 렌더되므로(초기 SSR 은 false) hydration mismatch 없음.
  const embers = useMemo(
    () =>
      Array.from({ length: 80 }, () => ({
        left: Math.round(Math.random() * 100),
        bottom: Math.round(Math.random() * 38),
        delay: Math.round(Math.random() * 20) / 100,
        dur: Math.round((1.1 + Math.random() * 0.3) * 100) / 100,
        size: Math.round((2.5 + Math.random() * 2.5) * 10) / 10,
        drift: Math.round(Math.random() * 44 - 22),
      })),
    [],
  );
  const [error, setError] = useState<string | null>(initialMessage);
  const [message, setMessage] = useState<string | null>(null);

  // 조직 매칭 미리보기
  const [orgMatches, setOrgMatches] = useState<OrgMatch[]>([]);
  const [orgPreviewLoading, setOrgPreviewLoading] = useState(false);
  const [orgPreviewChecked, setOrgPreviewChecked] = useState(false);
  const emailDomain = useMemo(() => {
    const m = email.trim().match(/^[^@\s]+@([^@\s]+\.[^@\s]+)$/);
    return m ? m[1].toLowerCase() : null;
  }, [email]);
  const isFreeMailDomain = emailDomain
    ? ['gmail.com', 'naver.com', 'daum.net', 'kakao.com', 'hanmail.net',
       'nate.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'].includes(emailDomain)
    : false;
  useEffect(() => {
    if (mode !== 'signup') return;
    if (!emailDomain || isFreeMailDomain) {
      setOrgMatches([]);
      setOrgPreviewChecked(false);
      return;
    }
    let cancelled = false;
    setOrgPreviewLoading(true);
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { data, error: rpcErr } = await supabase.rpc('preview_org_match', {
        p_email: email.trim(),
        p_name: orgName.trim() || null,
      });
      if (cancelled) return;
      setOrgPreviewLoading(false);
      setOrgPreviewChecked(true);
      if (rpcErr) {
        console.warn('[signup] preview_org_match failed:', rpcErr.message);
        setOrgMatches([]);
        return;
      }
      setOrgMatches((data ?? []) as OrgMatch[]);
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mode, email, emailDomain, isFreeMailDomain, orgName]);

  const orgIntent = (() => {
    if (mode !== 'signup') return 'none' as const;
    if (!emailDomain) return 'awaiting_email' as const;
    if (isFreeMailDomain) return 'create_new' as const;
    if (!orgPreviewChecked || orgPreviewLoading) return 'checking' as const;
    const nameMatch = orgMatches.find((m) => m.name_matches);
    if (nameMatch) return 'join_by_name' as const;
    if (orgMatches.length > 0 && !orgName.trim()) return 'domain_match_no_name' as const;
    if (orgMatches.length > 0) return 'domain_match_diff_name' as const;
    return 'create_new' as const;
  })();

  const [touched, setTouched] = useState<{
    email?: boolean;
    password?: boolean;
    passwordConfirm?: boolean;
    name?: boolean;
  }>({});
  const markTouched = (k: keyof typeof touched) =>
    setTouched((t) => ({ ...t, [k]: true }));

  const emailValid =
    email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordTooShort = mode === 'signup' && password.length > 0 && password.length < 8;
  const passwordStrength = (() => {
    if (password.length < 8) return 0;
    let s = 1;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const passwordsMatch =
    mode !== 'signup' ||
    passwordConfirm.length === 0 ||
    password === passwordConfirm;
  const signupReady =
    mode !== 'signup' ||
    (password.length >= 8 &&
      passwordConfirm.length > 0 &&
      password === passwordConfirm &&
      consented);

  // 로그인 뒤 대시보드로(비밀번호 · 지문 로그인이 함께 쓴다).
  // 골드 입장 트랜지션: 'Step inside' 후 화면이 샤라랑하며 대시보드로.
  // prefers-reduced-motion 이면 연출 없이 즉시 전환(접근성).
  function enterDashboard() {
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      router.push(redirectTo);
      router.refresh();
      return;
    }
    // 세션이 생긴 직후 대시보드를 백그라운드 prefetch: 애니메이션이 도는 ~1.15초
    // 동안 미리 로드되어, push 시 딜레이 없이 즉시 전환된다(애니 끝→홈 사이 빈 시간 제거).
    // (refresh 중복 호출 제거: 새 라우트 push 가 이미 인증 쿠키로 서버 렌더한다.)
    router.prefetch(redirectTo);
    setEntering(true);
    window.setTimeout(() => {
      router.push(redirectTo);
    }, 1150);
  }

  // 지문 · 얼굴 로그인. 브라우저가 이 기기의 패스키를 고르게 하고(이메일을 먼저 묻지 않는다) 세션을 만든다.
  async function handlePasskeyLogin() {
    setLoading(true);
    setError(null);
    setMessage(null);
    const supabase = createClient();
    try {
      const { error: passkeyError } = await supabase.auth.signInWithPasskey();
      if (passkeyError) {
        console.warn('[passkey] 로그인 실패', passkeyError);
        setError(passkeyErrorMessage(passkeyError, 'login'));
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('[passkey] 로그인 실패', err);
      setError(passkeyErrorMessage(err, 'login'));
      setLoading(false);
      return;
    }
    enterDashboard();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(translateAuthError(error.message));
        setLoading(false);
        return;
      }
      enterDashboard();
      return;
    }

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다. 다시 확인해주세요.');
      setLoading(false);
      return;
    }
    // 🔴 2026-08-25: 같은 규칙이 세 곳에 손으로 적혀 있었고 강도가 달랐다.
    //    (전문가 가입만 길이 검사뿐이라 그쪽만 영문 에러가 노출됐다.) 단일 출처로 통합.
    const pwErr = validatePassword(password);
    if (pwErr) {
      setError(pwErr);
      setLoading(false);
      return;
    }
    // 버튼 disabled 는 «화면» 게이트일 뿐이다. 제출 경로에서 한 번 더 본다.
    if (!consented) {
      setError('이용약관과 개인정보처리방침에 동의해야 가입할 수 있습니다.');
      setLoading(false);
      return;
    }

    // 동의 시각. 화면이 답할 수 있는 것은 「동의했다」와 「언제」 두 가지뿐이다.
    // 문서 판본과 접속 IP 는 **서버가 채운다**: 클라이언트가 보낸 값은 증거가 못 된다
    // (누구든 임의 값을 보낼 수 있다). 마이그 0347 `consent_records` 의 version·
    // ip_address 가 그 자리다.
    const consentedAt = new Date().toISOString();

    const userMetadata: Record<string, unknown> = {
      full_name: name,
      audience: 'company',
      org_name: orgName,
      job_role: jobRole,
      // ⬜ 임시 보관 자리. `consent_records`(0347) 가 적용되고 서버 기록 경로가 생기면
      //    그쪽이 원본이 되고 여기는 보조 사본이 된다. 지금 이 값이라도 남기지 않으면
      //    가입한 사람에 대해 동의 시각을 **어디서도** 복원할 수 없다.
      consent_terms_at: consentedAt,
      consent_privacy_at: consentedAt,
    };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userMetadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(translateAuthError(error.message));
      setLoading(false);
      return;
    }
    if (data.session) {
      await supabase
        .from('profiles')
        .update({ full_name: name, job_role: jobRole })
        .eq('id', data.user!.id);
      const { error: rpcError } = await supabase.rpc('create_organization', {
        p_name: orgName || (name ? `${name}의 조직` : '내 조직'),
      });
      if (rpcError) {
        setError(`조직 생성 실패: ${rpcError.message}`);
        setLoading(false);
        return;
      }
      // 운영자에게 신규 가입 알림: auto-confirm 모드면 /auth/callback 을 거치지
      // 않기 때문에 callback 의 알림 로직이 발동 안 됨. 가입 흐름 끝에서 명시
      // 호출. 실패해도 가입 자체는 막지 않음 (fire-and-forget).
      void fetch('/api/auth/notify-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audience: 'company',
          org_name: orgName || null,
        }),
      }).catch((e) => console.warn('[signup] notify-signup failed:', e));
      router.push('/dashboard');
      router.refresh();
    } else {
      setMessage('가입 확인 이메일을 보냈습니다. 받은 메일함을 확인해주세요.');
      setLoading(false);
    }
  }

  // GitHub OAuth 버튼 노출 토글: env var 로 제어 (기본 숨김).
  // Supabase Dashboard 측 GitHub provider 설정이 끝난 뒤
  // Vercel/.env.local 에 NEXT_PUBLIC_GITHUB_OAUTH_ENABLED=true 추가하면 활성화.
  const githubOAuthEnabled = process.env.NEXT_PUBLIC_GITHUB_OAUTH_ENABLED === 'true';
  // 비활성 조건을 한 곳에 둔다. disabled·cursor·opacity 세 군데에 같은 식을 손으로
  // 적으면 조건이 하나 늘 때 «눌리지는 않는데 눌릴 것처럼 보이는» 버튼이 된다.
  const githubDisabled = loading || oauthLoading || (mode === 'signup' && !consented);

  // GitHub OAuth: provider 가 토큰 교환을 끝내면 /auth/callback 으로 돌아오고,
  // 거기서 신규 OAuth 가입자는 /onboarding 으로 보낸다 (audience/job_role/org 미보유).
  // 기존 사용자(이미 job_role+조직 있음)는 그대로 dashboard 로.
  async function handleGitHubLogin() {
    setError(null);
    setMessage(null);
    // 가입 탭에서 이 버튼을 누르면 폼을 거치지 않고 /auth/callback → /onboarding 으로
    // 간다. 즉 **동의 체크를 건너뛰는 우회로**다. 여기서도 같은 게이트를 둔다.
    //
    // 🔑 다만 이 게이트가 닫는 것은 «가입 탭» 하나뿐이다. OAuth 는 로그인과 가입을
    //    구분하지 않아서, 처음 오는 사람이 **로그인 탭에서** 이 버튼을 눌러도 계정이 새로
    //    만들어진다. 그 경로까지 여기서 막으려면 기존 사용자에게 로그인할 때마다 동의를
    //    다시 요구해야 하므로 막지 않는다. 실효 게이트는 신규 OAuth 가입자가 반드시 지나는
    //    /onboarding 에 있어야 한다(초대·전문가 포털은 또 다른 경로라 그쪽도 따로 봐야
    //    한다). 그 파일들은 이번 배정 밖이라 미결로 보고한다.
    if (mode === 'signup' && !consented) {
      setError('이용약관과 개인정보처리방침에 동의해야 가입할 수 있습니다.');
      return;
    }
    setOauthLoading(true);
    const supabase = createClient();
    const nextParam =
      redirectTo && redirectTo !== '/dashboard' ? `?next=${encodeURIComponent(redirectTo)}` : '';
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback${nextParam}`,
      },
    });
    if (oauthErr) {
      setError(translateAuthError(oauthErr.message));
      setOauthLoading(false);
    }
    // 성공 시 브라우저가 GitHub 로 떠나므로 더 이상의 처리 불필요.
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.bg,
        color: T.text,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 골드 입장 트랜지션: 로그인 성공 시 화면을 덮으며 대시보드로 전환 (①셔머+③입자 하이브리드) */}
      {entering && (
        <div className="qa-entrance" aria-hidden>
          <div className="qa-entrance-glow" />
          <div className="qa-entrance-sweep" />
          {embers.map((e, i) => (
            <span
              key={i}
              className="qa-entrance-ember"
              style={{
                left: `${e.left}%`,
                bottom: `${e.bottom}%`,
                width: `${e.size}px`,
                height: `${e.size}px`,
                animationDelay: `${e.delay}s`,
                animationDuration: `${e.dur}s`,
                '--drift': `${e.drift}px`,
              } as React.CSSProperties}
            />
          ))}
          <div className="qa-entrance-mark">
            <span className="qa-entrance-halo" />
            <Logo size={76} />
          </div>
        </div>
      )}

      {/* Atmospheric ribbon background (C): vignette 로 가장자리 anchor */}
      <RibbonBackground intensity="full" vignette />

      <AuthThemeToggle />

      {/* Split layout: A: editorial split-screen. */}
      <style dangerouslySetInnerHTML={{ __html: layoutCss }} />
      <div className="qa-auth-split" style={{ opacity: entering ? 0 : 1, transition: 'opacity 220ms ease' }}>
        {/* ─── 왼쪽: Brand / Manifesto / Trust (>= 1024px 에서만) ─── */}
        <aside className="qa-auth-brand">
          <KstClock />

          <div className="qa-auth-manifesto">
            <div className="qa-auth-eyebrow">
              <span className="qa-auth-eyebrow-line" aria-hidden />
              <span>Q-Atelier · Ver. {APP_VERSION_LABEL.replace(/^v/, '')}</span>
            </div>
            <h1 className="qa-auth-headline">
              The atelier for<br />
              medical device<br />
              <span className="qa-auth-headline-accent">regulation.</span>
            </h1>
            <p className="qa-auth-subhead">
              From idea to clearance: in one workspace.
              <br />
              Crafted around ISO 13485, MFDS, FDA &amp; EU MDR.
            </p>
            <div className="qa-auth-tagline">{BRAND.tagline}</div>
          </div>

          {/* 좌측 패널 하단: 상단 eyebrow 와 같은 톤의 텍스트 라벨 */}
          <div className="qa-auth-eyebrow qa-auth-foot-mark">
            <span className="qa-auth-eyebrow-line" aria-hidden />
            <span>MedQraft Core · Ver. {coreVersion.replace(/^v/, '')}</span>
          </div>
        </aside>

        {/* ─── 오른쪽: Form ─── */}
        <main className="qa-auth-form-wrap">
          <div className="qa-auth-form-inner">
            {/* Mobile-only brand header (split 가 1-col 로 떨어졌을 때) */}
            <div className="qa-auth-mobile-brand">
              <Logo size={96} />
            </div>

            {/* Desktop form 상단 brand row */}
            <div className="qa-auth-desktop-brand">
              <Logo size={56} />
              <div>
                <div className="qa-auth-desktop-brand-title">Q-Atelier</div>
                <div className="qa-auth-desktop-brand-sub">
                  Medical Device Regulatory Workspace
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="qa-auth-tabs">
              <TabBtn active={mode === 'login'} onClick={() => setMode('login')}>
                로그인
              </TabBtn>
              <TabBtn active={mode === 'signup'} onClick={() => setMode('signup')}>
                회원가입
              </TabBtn>
            </div>

            {/* Glass form card (C) */}
            <div className="qa-auth-card">
              <form onSubmit={handleSubmit}>
                {mode === 'signup' && (
                  <div style={{ marginBottom: S[4] }}>
                    <Lbl htmlFor="auth-name">이름</Lbl>
                    <In
                      id="auth-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => markTouched('name')}
                      required
                      autoComplete="name"
                      autoFocus
                    />
                    {touched.name && name.trim().length < 2 && (
                      <FieldHint kind="error">이름을 2자 이상 입력해주세요.</FieldHint>
                    )}
                  </div>
                )}

                <div style={{ marginBottom: S[4] }}>
                  <Lbl htmlFor="auth-email">이메일</Lbl>
                  <In
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => markTouched('email')}
                    invalid={touched.email && !emailValid}
                    required
                    autoComplete="email"
                    autoFocus={mode === 'login'}
                  />
                  {touched.email && !emailValid && (
                    <FieldHint kind="error">올바른 이메일 형식이 아닙니다.</FieldHint>
                  )}
                </div>

                <div style={{ marginBottom: mode === 'signup' ? 16 : 4 }}>
                  <Lbl htmlFor="auth-password">비밀번호</Lbl>
                  <In
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => markTouched('password')}
                    invalid={mode === 'signup' && passwordTooShort}
                    required
                    minLength={mode === 'signup' ? 8 : undefined}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  {mode === 'signup' && passwordTooShort && (
                    <FieldHint kind="error">비밀번호는 8자 이상이어야 합니다.</FieldHint>
                  )}
                  {mode === 'signup' && !passwordTooShort && password.length > 0 && (
                    <PasswordStrengthBar strength={passwordStrength} />
                  )}
                  {mode === 'signup' && password.length === 0 && (
                    <FieldHint kind="muted">{PASSWORD_POLICY_HINT}</FieldHint>
                  )}
                </div>

                {mode === 'signup' && (
                  <div style={{ marginBottom: S[1] }}>
                    <Lbl htmlFor="auth-password-confirm">비밀번호 확인</Lbl>
                    <In
                      id="auth-password-confirm"
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      onBlur={() => markTouched('passwordConfirm')}
                      invalid={touched.passwordConfirm && !passwordsMatch}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="동일한 비밀번호를 다시 입력해 주세요"
                    />
                    {touched.passwordConfirm && !passwordsMatch && (
                      <FieldHint kind="error">비밀번호가 일치하지 않습니다.</FieldHint>
                    )}
                    {passwordConfirm.length > 0 && passwordsMatch && (
                      <FieldHint kind="muted">✓ 비밀번호가 일치합니다.</FieldHint>
                    )}
                    {passwordConfirm.length === 0 && (
                      <FieldHint kind="muted">위 비밀번호와 동일하게 입력</FieldHint>
                    )}
                  </div>
                )}

                {mode === 'signup' && (
                  <>
                    <div style={{ marginBottom: S[4] }}>
                      <Lbl htmlFor="auth-org-name">조직 이름</Lbl>
                      <In
                        id="auth-org-name"
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder={
                          orgIntent === 'domain_match_no_name' && orgMatches[0]
                            ? `예: ${orgMatches[0].org_name} (자동 인식됨)`
                            : '이메일 도메인으로 조직을 못 찾으면 직접 입력 (선택)'
                        }
                      />
                      <OrgPreviewBanner
                        intent={orgIntent}
                        matches={orgMatches}
                        onUseName={(n) => setOrgName(n)}
                      />
                    </div>
                    <div style={{ marginBottom: S[4] }}>
                      <Lbl htmlFor="auth-job-role">직무역할</Lbl>
                      <Sel
                        id="auth-job-role"
                        value={jobRole}
                        onChange={(e) => setJobRole(e.target.value as typeof jobRole)}
                        opts={[
                          { v: 'ra', l: 'RA: Regulatory Affairs' },
                          { v: 'qa', l: 'QA: Quality Assurance' },
                          { v: 'rd', l: 'R&D: Research & Development' },
                        ]}
                      />
                      <p
                        style={{
                          fontSize: FS[10],
                          color: T.muted,
                          margin: '6px 0 0',
                          fontFamily: F.mono,
                          letterSpacing: 0.5,
                        }}
                      >
                        Dashboard 화면 구성에 사용됩니다. 가입 후 설정에서 변경 가능.
                        경영진(Executive) 권한은 계약 시 당사가 회사 대표 한정으로 직접 부여합니다.
                      </p>
                    </div>

                    {/* ── 필수 동의 + 수집 항목 고지 ────────────────────────
                        고지 없이 체크박스만 두면 「동의를 받았다」고 말하기 어렵다.
                        무엇을·왜·얼마나 보관하는지를 같은 화면에서 보이게 둔다.
                        보유기간은 아직 확정되지 않아 처리방침으로 넘긴다(임의로 적지 않는다). */}
                    <div
                      style={{
                        borderRadius: RADIUS.md,
                        marginTop: S[5],
                        padding: S[4],
                        border: `1px solid ${T.border}`,
                        background: alpha(T.champagne, 0.04),
                      }}
                    >
                      <label
                        htmlFor="auth-consent"
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: S[2.5],
                          cursor: 'pointer',
                          fontSize: FS[12],
                          lineHeight: LH.relaxed,
                          color: T.text,
                        }}
                      >
                        <input
                          id="auth-consent"
                          type="checkbox"
                          checked={consented}
                          onChange={(e) => setConsented(e.target.checked)}
                          required
                          style={{ accentColor: T.champagne, marginTop: S[0.5], flexShrink: 0 }}
                        />
                        <span>
                          <strong style={{ color: T.champagne }}>[필수]</strong>{' '}
                          <a
                            href="/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: T.champagne }}
                          >
                            이용약관
                          </a>
                          과{' '}
                          <a
                            href="/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: T.champagne }}
                          >
                            개인정보처리방침
                          </a>
                          을 확인했으며 이에 동의합니다.
                        </span>
                      </label>

                      <div
                        style={{
                          marginTop: S[3],
                          paddingTop: S[3],
                          borderTop: `1px solid ${T.border}`,
                          fontSize: FS[11],
                          lineHeight: LH.relaxed,
                          color: T.muted,
                        }}
                      >
                        <div>
                          <span style={{ color: T.subtle }}>수집 항목</span> 전자우편 주소,
                          이름, 조직 이름, 직무역할 (필수) · 접속 IP·브라우저 정보·조작
                          기록 (자동 생성)
                        </div>
                        <div style={{ marginTop: S[1] }}>
                          <span style={{ color: T.subtle }}>이용 목적</span> 이용자 식별,
                          조직 소속 확인과 권한 부여, 서비스 제공, 전자서명·감사추적 기록
                          보존
                        </div>
                        <div style={{ marginTop: S[1] }}>
                          <span style={{ color: T.subtle }}>보유 기간</span> 회원 탈퇴 시
                          파기. 다만 전자서명·교육 이수·결제 기록 등 보존 의무가 있는
                          기록은 해당 기간 동안 보관하며, 개인 식별정보는 가명처리합니다
                          (자세한 내용은 개인정보처리방침).
                        </div>
                        <div style={{ marginTop: S[1] }}>
                          동의를 거부할 수 있으나, 거부하면 서비스 가입이 제한됩니다.
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {error && (
                  <div style={{ marginTop: S[4.5] }}>
                    <Alert kind="error" onClose={() => setError(null)}>
                      {error}
                    </Alert>
                  </div>
                )}
                {message && (
                  <div style={{ marginTop: S[4.5] }}>
                    <Alert kind="success" title="확인 메일 발송됨" onClose={() => setMessage(null)}>
                      {message}
                    </Alert>
                  </div>
                )}

                <div style={{ marginTop: S[6] }}>
                  <Btn
                    type="submit"
                    disabled={loading || oauthLoading || !signupReady}
                    style={{ width: '100%', padding: '13px 24px', fontSize: FS[11] }}
                  >
                    {loading ? '처리 중...' : mode === 'login' ? 'Step inside →' : 'Sign up →'}
                  </Btn>
                </div>
                {/* 지문 · 얼굴 로그인: 보조 단추(주 동작은 위의 비밀번호 로그인). 쓸 수 있는 주소 · 설정일 때만 */}
                {mode === 'login' && passkeyReady && (
                  <div style={{ marginTop: S[3] }}>
                    <Btn
                      p={false}
                      type="button"
                      onClick={handlePasskeyLogin}
                      disabled={loading || oauthLoading}
                      style={{
                        width: '100%',
                        padding: '12px 24px',
                        fontSize: FS[11],
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: S[2],
                      }}
                    >
                      <Fingerprint size={15} strokeWidth={1.75} aria-hidden="true" />
                      지문 · 얼굴로 로그인
                    </Btn>
                  </div>
                )}
              </form>

              {/* OAuth divider + GitHub 버튼: 회사 사용자 SSO 진입점.
                  expert 포털에는 노출하지 않음 (invite 흐름 보존).
                  env var 로 제어: Supabase provider 설정 전엔 숨김. */}
              {githubOAuthEnabled && (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: S[3],
                      marginTop: S[5.5],
                      marginBottom: S[3.5],
                    }}
                    aria-hidden
                  >
                    <div style={{ flex: 1, height: 1, background: T.border }} />
                    <div
                      style={{
                        fontSize: FS[10],
                        color: T.muted,
                        fontFamily: F.mono,
                      }}
                    >
                      또는
                    </div>
                    <div style={{ flex: 1, height: 1, background: T.border }} />
                  </div>

                  <button
                type="button"
                onClick={handleGitHubLogin}
                disabled={githubDisabled}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  background: T.text,
                  color: T.bg,
                  border: 'none',
                  fontFamily: F.mono,
                  fontSize: FS[10],
                  fontWeight: 500,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  cursor: githubDisabled ? 'not-allowed' : 'pointer',
                  opacity: githubDisabled ? 0.6 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: S[2.5],
                  transition: 'opacity .15s ease',
                }}
                aria-label="GitHub 계정으로 계속하기"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                {oauthLoading ? 'GitHub 이동 중...' : 'GitHub 계정으로 계속하기'}
              </button>
                </>
              )}
            </div>

            {mode === 'login' && (
              <div style={{ textAlign: 'center', marginTop: S[3.5] }}>
                <a
                  href="/forgot-password"
                  style={{
                    color: T.muted,
                    fontSize: FS[11],
                    fontFamily: F.mono,
                    textDecoration: 'none',
                    // Codex R-05 (오너 결정 2026-09-13): 높이 16px 링크는 터치에서 오조작이 잦다. 클릭 영역만 키우고 문구 · 밑줄은 그대로.
                    display: 'inline-flex',
                    alignItems: 'center',
                    minHeight: 32,
                    padding: `0 ${S[2]}px`,
                    borderBottom: `1px dashed ${T.border}`,
                  }}
                >
                  비밀번호를 잊으셨나요?
                </a>
              </div>
            )}

            <div
              style={{
                textAlign: 'center',
                fontSize: FS[10],
                color: T.muted,
                fontFamily: F.mono,
                letterSpacing: 1,
                lineHeight: LH.loose,
                marginTop: S[5.5],
              }}
            >
              {mode === 'login' ? (
                <>처음이신가요? 회원가입 탭에서 계정을 만드세요.</>
              ) : (
                <>이미 계정이 있나요? 로그인 탭으로 이동하세요.</>
              )}
            </div>

            {/* Footer: slimmer */}
            <footer
              style={{
                marginTop: S[7],
                paddingTop: S[4],
                borderTop: `1px solid ${T.border}`,
                textAlign: 'center',
                fontFamily: F.mono,
                color: T.muted,
                fontSize: FS[9],
                letterSpacing: 1,
                lineHeight: 1.9,
              }}
            >
              {/* 모바일(브랜드 패널 미노출)에서도 태그라인이 보이도록 푸터에도 */}
              <div style={{ letterSpacing: 2, textTransform: 'uppercase' }}>{BRAND.tagline}</div>
              <div>© {new Date().getFullYear()} MedQraft · {APP_VERSION_LABEL}</div>
              <div style={{ marginTop: S[0.5] }}>
                Designed &amp; engineered by{' '}
                <span style={{ color: T.champagne, fontWeight: 500 }}>Kayden Kim</span>
              </div>
              <SocialLinks />
              {/* 법적 고지: 가입 탭의 동의 문구에도 링크가 있지만, 「전자상거래 등에서의
                  소비자보호에 관한 법률」이 요구하는 사업자 표시는 로그인 탭에서도 도달할
                  수 있어야 한다. 여기가 비로그인 방문자가 보는 유일한 화면이다. */}
              <div style={{ marginTop: S[2] }}>
                <a href="/terms" style={legalLinkStyle}>
                  이용약관
                </a>
                {' · '}
                <a href="/privacy" style={legalLinkStyle}>
                  개인정보처리방침
                </a>
                {' · '}
                <a href="/business-info" style={legalLinkStyle}>
                  사업자정보
                </a>
                {' · '}
                {/* 오픈소스 고지도 같은 이유로 여기 있어야 한다. MIT·Apache-2.0 이
                    요구하는 저작권 고지는 «누구나 도달할 수 있는 상태» 여야 하고,
                    Play 스토어 심사원과 고객 실사 담당자에게는 로그인 계정이 없다.
                    앱이 원격 웹뷰라 이 링크가 앱 안의 「오픈소스 라이선스」 화면을 겸한다. */}
                <a href="/open-source" style={legalLinkStyle}>
                  오픈소스 라이선스
                </a>
              </div>
              <div
                style={{
                  marginTop: S[2.5],
                  fontSize: FS[9],
                  color: T.muted,
                  lineHeight: LH.loose,
                  letterSpacing: 0.5,
                }}
              >
                이 서비스는 의료기기 R&amp;D · 인허가 · QMS 운영을 지원하는 도구이며,
                <br />
                식약처/FDA/EU 등 규제기관의 공식 판정을 대체하지 않습니다.
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

// 푸터 법적 고지 링크: 세 링크가 같은 모양이어야 한다. 인라인으로 세 번 적으면
// 하나만 손대도 줄이 어긋난다.
const legalLinkStyle = {
  color: T.muted,
  textDecoration: 'underline',
  textUnderlineOffset: 2,
};

// ─── Layout CSS: split + atmospheric + responsive ────────────────────────
// 글꼴 변수: globals.css 의 body 가 이미 Pretendard chain 적용 → 자식은 inherit.
// mono 가 필요한 곳만 JetBrains Mono 직접 지정.
const layoutCss = `
.qa-auth-split {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr;
}

.qa-auth-brand {
  display: none;
}

.qa-auth-form-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px 32px;
  min-height: 100vh;
  box-sizing: border-box;
}

.qa-auth-form-inner {
  width: 100%;
  max-width: 460px;
  animation: qa-auth-rise 600ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.qa-auth-mobile-brand {
  display: flex;
  justify-content: center;
  margin-bottom: 18px;
}

.qa-auth-desktop-brand {
  display: none;
}

.qa-auth-tabs {
  display: flex;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--qa-border);
}

.qa-auth-card {
  padding: 28px 30px;
  background: var(--qa-surface);
  border: 1px solid var(--qa-border);
  border-radius: ${RADIUS.md}px; /* 2026-09-14 오빠 결정: 액자 모티프보다 통일. 브래킷도 같은 곡률 */
}

@keyframes qa-auth-rise {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Desktop split (>= 1024px) ─────────────────────────── */
@media (min-width: 1024px) {
  .qa-auth-split {
    grid-template-columns: 1.15fr 1fr;
  }

  /* 라이트/다크 자동 대응. 다크에선 bg 70% 로 살짝 가리고, 라이트에선
     champagne tint 가 더 진하게 (라이트 흰색 위에서 champagne 3% 는 거의 안 보임). */
  .qa-auth-brand {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 56px 64px;
    background: linear-gradient(
      105deg,
      color-mix(in oklab, var(--qa-bg) 75%, transparent) 0%,
      color-mix(in oklab, var(--qa-champagne) 6%, transparent) 100%
    );
    border-right: 1px solid color-mix(in oklab, var(--qa-border) 60%, transparent);
    position: relative;
    z-index: 2;
    animation: qa-auth-rise 700ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .qa-auth-form-wrap {
    /* 2026-09-14: 잠시 «위에서 89px 고정» 으로 바꿨다가 되돌렸다. 세 제품의 시작점을 같게 하려던
       것인데, 900px 보다 큰 화면에서 판이 위로 떠 버린다(오빠 지적). 오른쪽 판은 위아래 가운데다.
       세 제품 사이의 차이는 로그인 고유 내용(탭 · 번호판)의 높이만큼이고 그것은 둔다. */
    align-items: center;
    padding: 56px 56px;
    /* 폼 가독성 보호: 살짝 진한 surface 톤 */
    background: linear-gradient(
      255deg,
      color-mix(in oklab, var(--qa-bg) 82%, transparent) 0%,
      color-mix(in oklab, var(--qa-surface) 70%, transparent) 100%
    );
    backdrop-filter: blur(1px);
    -webkit-backdrop-filter: blur(1px);
  }

  .qa-auth-form-inner {
    max-width: 440px;
  }

  /* Mobile-only logo hidden on desktop */
  .qa-auth-mobile-brand { display: none; }

  /* Desktop-only horizontal brand row */
  .qa-auth-desktop-brand {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 32px;
    padding-bottom: 22px;
    border-bottom: 1px solid var(--qa-border);
  }

  /* Card 위에 살짝 광채: glassmorphism feel. 그림자는 테마 인지(라이트=sepia). */
  .qa-auth-card {
    box-shadow:
      var(--qa-shadow-lg),
      0 0 0 1px color-mix(in oklab, var(--qa-champagne) 6%, transparent);
  }
}

/* ── Brand panel typography ───────────────────────────── */
.qa-auth-eyebrow {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: ${F.mono};
  font-size: 10px;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: var(--qa-champagne);
  margin-bottom: 28px;
}
.qa-auth-eyebrow-line {
  width: 36px;
  height: 1px;
  background: var(--qa-champagne);
  opacity: 0.7;
}
.qa-auth-headline {
  margin: 0;
  /* 럭셔리 디스플레이 세리프 (Cormorant Garamond): F.display 토큰.
     이전 'Times New Roman'(제네릭 시스템 세리프) 임시값 → 정식 브랜드 서체로 교체.
     영문 전용 히어로라 한글 폴백 이슈 없음(메인 앱 Pretendard 정책과 무관). */
  font-family: ${F.display};
  font-size: clamp(36px, 4.4vw, 56px);
  line-height: 1.12;
  letter-spacing: -0.015em;
  font-weight: 500;
  color: var(--qa-text);
  text-wrap: balance;
}
.qa-auth-headline-accent {
  /* 패밀리 모티프(A안): 랜딩(medqraft.co.kr) 골드 그라디언트 텍스트.
     tokens.ts BRAND.goldGradient 와 동일 합성(테마 자동 대응). */
  background-image: linear-gradient(135deg, var(--qa-champagne) 0%, color-mix(in oklab, var(--qa-champagne) 55%, white) 50%, color-mix(in oklab, var(--qa-champagne) 82%, black) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  /* 강조는 골드 그라디언트로만: italic 은 제거.
     브랜드 규칙(반복 확정): Cormorant italic 절대 금지(전문가 layout 과 동일 정책).
     italic 제거 보완으로 weight 를 500→600 살짝 올려 헤드라인 대비 강조 유지. */
  font-style: normal;
  font-weight: 600;
}

/* 패밀리 모티프(A안): 랜딩 히어로 액자의 골드 코너 브래킷(⌜ ⌟)을 폼 카드에. */
.qa-auth-card {
  position: relative;
}
.qa-auth-card::before,
.qa-auth-card::after {
  content: '';
  position: absolute;
  width: 22px;
  height: 22px;
  pointer-events: none;
  border: 0 solid color-mix(in oklab, var(--qa-champagne) 60%, transparent);
}
.qa-auth-card::before { top: -1px; left: -1px; border-top-width: 1px; border-left-width: 1px; border-top-left-radius: ${RADIUS.md}px; }
.qa-auth-card::after { bottom: -1px; right: -1px; border-bottom-width: 1px; border-right-width: 1px; border-bottom-right-radius: ${RADIUS.md}px; }

/* 패밀리 모티프(A안): 브랜드 태그라인(랜딩 로고 서브 동일 문구). */
.qa-auth-tagline {
  margin-top: 20px;
  font-family: ${F.mono};
  font-size: 10px;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: var(--qa-muted);
}
.qa-auth-subhead {
  margin: 24px 0 0;
  font-family: inherit;
  font-size: 14.5px;
  line-height: ${LH.loose};
  color: var(--qa-subtle);
  max-width: 480px;
}

/* ── Foot mark (좌측 패널 하단 Rule Engine 표시): eyebrow 와 같은 톤 ── */
.qa-auth-foot-mark {
  margin-bottom: 0;
  margin-top: 36px;
  opacity: 0.85;
}

.qa-auth-desktop-brand-title {
  font-family: inherit;
  font-size: 18px;
  color: var(--qa-text);
  line-height: ${LH.tight};
  letter-spacing: -0.005em;
}
.qa-auth-desktop-brand-sub {
  font-family: ${F.mono};
  font-size: 9.5px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--qa-muted);
  margin-top: 3px;
}

/* ── 골드 입장 트랜지션 (로그인 성공 → 대시보드 입장) ──────── */
.qa-entrance {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  overflow: hidden;
  background: var(--qa-bg);
  animation: qa-entrance-veil 1400ms ease forwards;
}
/* 전체 오버레이: 등장 후 콘텐츠 유지, 마지막에 은은하게 fade out 하며 홈으로 진입 */
@keyframes qa-entrance-veil {
  0% { opacity: 0; }
  11% { opacity: 1; }
  82% { opacity: 1; }
  100% { opacity: 0; }
}

/* 중앙 골드 광채: 더 진하게·빠르게 부풀어 오름 */
.qa-entrance-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 64% 54% at 50% 50%, color-mix(in oklab, var(--qa-champagne) 44%, transparent), transparent 70%);
  opacity: 0;
  animation: qa-glow-pulse 1150ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes qa-glow-pulse {
  0% { opacity: 0; transform: scale(0.84); }
  45% { opacity: 1; }
  100% { opacity: 0.72; transform: scale(1.14); }
}

/* ① 골드 빛줄기: 화면을 한 번 빠르게 쓸고 지나감 (더 진하게) */
.qa-entrance-sweep {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 46%;
  background: linear-gradient(100deg, transparent, color-mix(in oklab, var(--qa-champagne) 82%, white), transparent);
  opacity: 0;
  transform: translateX(-150%) skewX(-14deg);
  animation: qa-entrance-sweep 1100ms ease 0.08s both;
}
@keyframes qa-entrance-sweep {
  0% { transform: translateX(-150%) skewX(-14deg); opacity: 0; }
  18% { opacity: 0.95; }
  100% { transform: translateX(330%) skewX(-14deg); opacity: 0; }
}

/* ③ 골드 입자: 무작위 위치·속도로 떠오르며 깜빡깜빡 반짝(twinkle).
   크기·bottom·delay·duration·drift 는 각 입자 inline 무작위값. */
.qa-entrance-ember {
  position: absolute;
  border-radius: 50%;
  background: var(--qa-champagne);
  box-shadow: 0 0 5px color-mix(in oklab, var(--qa-champagne) 45%, transparent);
  opacity: 0;
  animation-name: qa-entrance-ember;
  animation-timing-function: ease-out;
  animation-fill-mode: both;
}
@keyframes qa-entrance-ember {
  0% { opacity: 0; transform: translate(0, 16px) scale(0.5); }
  12% { opacity: 0.66; }
  26% { opacity: 0.18; }
  40% { opacity: 0.7; }
  56% { opacity: 0.26; }
  72% { opacity: 0.6; }
  88% { opacity: 0.26; }
  100% { opacity: 0; transform: translate(var(--drift, 0px), -210px) scale(1.1); }
}

/* 중앙 로고: glow halo 와 함께 또렷하게 등장해 끝까지 유지 */
.qa-entrance-mark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  animation: qa-entrance-mark 1150ms cubic-bezier(0.16, 1, 0.3, 1) both;
  filter:
    drop-shadow(0 0 30px color-mix(in oklab, var(--qa-champagne) 60%, transparent))
    drop-shadow(0 0 64px color-mix(in oklab, var(--qa-champagne) 32%, transparent));
}
@keyframes qa-entrance-mark {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
  40% { opacity: 1; transform: translate(-50%, -50%) scale(1.02); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

/* 로고 뒤 골드 빛무리: 로고를 감싸는 큰 halo */
.qa-entrance-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 300px;
  height: 300px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in oklab, var(--qa-champagne) 40%, transparent), transparent 64%);
  pointer-events: none;
  z-index: -1;
}

@media (prefers-reduced-motion: reduce) {
  .qa-entrance,
  .qa-entrance-glow,
  .qa-entrance-sweep,
  .qa-entrance-ember,
  .qa-entrance-mark { animation: none !important; }
}
`;

// ─── KST Clock (좌상단, 갱신: 1분 간격) ───────────────────────────────────
function KstClock() {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const datePart = now.toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
  const timePart = now.toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return (
    <div
      style={{
        fontFamily: F.mono,
        fontSize: FS[10],
        letterSpacing: 1.5,
        color: T.muted,
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        gap: S[2.5],
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          background: T.champagne,
          opacity: 0.85,
        }}
      />
      <span>{datePart}</span>
      <span style={{ opacity: 0.5 }}>·</span>
      <span>{timePart} KST</span>
    </div>
  );
}

// ─── SocialLinks ──────────────────────────────────────────────────────────
function SocialLinks() {
  const channels: Array<{
    href: string;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      href: 'https://www.youtube.com/@MedQraftOfficial',
      label: 'YouTube · MedQraft 공식 채널',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M21.6 7.2c-.2-1.4-1.2-2.4-2.6-2.6C16.8 4.2 12 4.2 12 4.2s-4.8 0-7 .4C3.6 4.8 2.6 5.8 2.4 7.2 2 9.4 2 12 2 12s0 2.6.4 4.8c.2 1.4 1.2 2.4 2.6 2.6 2.2.4 7 .4 7 .4s4.8 0 7-.4c1.4-.2 2.4-1.2 2.6-2.6.4-2.2.4-4.8.4-4.8s0-2.6-.4-4.8zM10 15.4V8.6L15.8 12 10 15.4z" />
        </svg>
      ),
    },
    {
      href: 'https://www.instagram.com/medqraft_official',
      label: 'Instagram · MedQraft 공식',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      href: 'https://www.medqraft.co.kr',
      label: 'MedQraft 공식 홈페이지',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        marginTop: S[3],
        display: 'inline-flex',
        gap: S[2],
        justifyContent: 'center',
      }}
    >
      {channels.map((c) => (
        <a
          key={c.href}
          href={c.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={c.label}
          title={c.label}
          className="qa-social-link"
          style={{
            borderRadius: RADIUS.sm,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            border: `1px solid ${T.border}`,
            color: T.muted,
            textDecoration: 'none',
            transition: 'color 200ms ease, border-color 200ms ease, background 200ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = T.champagne;
            e.currentTarget.style.borderColor = T.champagne;
            e.currentTarget.style.background = `${alpha(T.champagne, 0.06)}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = T.muted;
            e.currentTarget.style.borderColor = T.border;
            e.currentTarget.style.background = 'transparent';
          }}
        >
          {c.icon}
        </a>
      ))}
    </div>
  );
}

function FieldHint({
  kind,
  children,
}: {
  kind: 'error' | 'muted';
  children: React.ReactNode;
}) {
  return (
    <p
      style={{
        fontSize: FS[10],
        color: kind === 'error' ? T.red : T.muted,
        margin: '6px 0 0',
        fontFamily: F.mono,
        letterSpacing: 0.5,
        lineHeight: LH.normal,
      }}
    >
      {children}
    </p>
  );
}

function PasswordStrengthBar({ strength }: { strength: number }) {
  const label = ['', '약함', '보통', '강함', '매우 강함'][strength] ?? '';
  const color =
    strength <= 1 ? T.red : strength === 2 ? T.warning : strength === 3 ? T.blue : T.green;
  return (
    <div style={{ marginTop: S[2] }}>
      <div style={{ display: 'flex', gap: S[1] }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              background: i <= strength ? color : T.border,
              transition: 'background 0.18s ease',
            }}
          />
        ))}
      </div>
      <p
        style={{
          fontSize: FS[9],
          color,
          margin: '6px 0 0',
          fontFamily: F.mono,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </p>
    </div>
  );
}

// ─── 조직 매칭 미리보기 배너 ──────────────────────────────────────────────
type OrgIntent =
  | 'none'
  | 'awaiting_email'
  | 'checking'
  | 'join_by_name'
  | 'domain_match_no_name'
  | 'domain_match_diff_name'
  | 'create_new';

function OrgPreviewBanner({
  intent,
  matches,
  onUseName,
}: {
  intent: OrgIntent;
  matches: OrgMatch[];
  onUseName: (name: string) => void;
}) {
  if (intent === 'none' || intent === 'awaiting_email') return null;

  if (intent === 'checking') {
    return <FieldHint kind="muted">조직 매칭 확인 중…</FieldHint>;
  }

  if (intent === 'join_by_name') {
    const m = matches.find((x) => x.name_matches)!;
    return (
      <BannerBox color={T.green}>
        <div style={{ fontWeight: 600, marginBottom: S[0.5] }}>
          ✓ 이미 등록된 조직입니다. 가입 처리됩니다
        </div>
        <div style={{ fontSize: FS[10], color: T.subtle }}>
          {m.org_name} · @{m.domain} · {m.member_count}명 가입
        </div>
      </BannerBox>
    );
  }

  if (intent === 'domain_match_no_name') {
    return (
      <BannerBox color={T.champagne}>
        <div style={{ fontWeight: 600, marginBottom: S[1] }}>
          같은 도메인의 기존 조직 {matches.length}개 발견
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: S[1] }}>
          {matches.map((m) => (
            <button
              key={m.org_id}
              type="button"
              onClick={() => onUseName(m.org_name)}
              style={{
                borderRadius: RADIUS.md,
                background: 'transparent',
                border: `1px solid ${alpha(T.champagne, 0.4)}`,
                color: T.text,
                padding: '5px 10px',
                fontSize: FS[11],
                fontFamily: F.mono,
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                gap: S[2],
                alignItems: 'center',
              }}
            >
              <span style={{ flex: 1 }}>{m.org_name}</span>
              <span style={{ fontSize: FS[9], color: T.muted }}>
                {m.member_count}명
              </span>
              <span style={{ fontSize: FS[9], color: T.champagne }}>이 조직으로 가입 →</span>
            </button>
          ))}
        </div>
        <div style={{ fontSize: FS[10], color: T.muted, marginTop: S[1.5], fontFamily: F.mono }}>
          또는 위 입력란에 새 이름을 직접 적으면 신규 조직으로 생성됩니다.
        </div>
      </BannerBox>
    );
  }

  if (intent === 'domain_match_diff_name') {
    return (
      <BannerBox color={T.warning}>
        <div style={{ fontWeight: 600, marginBottom: S[0.5] }}>
          ⚠ 같은 도메인에 다른 이름의 조직이 이미 있어요
        </div>
        <div style={{ fontSize: FS[10], color: T.subtle, lineHeight: LH.normal }}>
          입력한 이름이 기존 조직 이름과 달라 <strong>새 조직</strong> 으로 생성됩니다. 같은
          조직이라면 위 박스에서 정확한 이름을 선택해 주세요.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: S[1], marginTop: S[1.5] }}>
          {matches.slice(0, 3).map((m) => (
            <button
              key={m.org_id}
              type="button"
              onClick={() => onUseName(m.org_name)}
              style={{
                borderRadius: RADIUS.md,
                background: 'transparent',
                border: `1px dashed ${alpha(T.warning, 0.4)}`,
                color: T.subtle,
                padding: '4px 8px',
                fontSize: FS[11],
                fontFamily: F.mono,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              {m.org_name} 으로 가입 ({m.member_count}명)
            </button>
          ))}
        </div>
      </BannerBox>
    );
  }

  return (
    <BannerBox color={T.subtle}>
      <div style={{ fontWeight: 600, marginBottom: S[0.5], color: T.text }}>
        + 새 조직으로 생성됩니다
      </div>
      <div style={{ fontSize: FS[10], color: T.subtle, lineHeight: LH.normal }}>
        이 이메일 도메인과 일치하는 기존 조직이 없어 본인이 owner 가 되는 새
        조직이 만들어집니다.
      </div>
    </BannerBox>
  );
}

function BannerBox({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        borderRadius: RADIUS.md,
        marginTop: S[2],
        padding: '10px 12px',
        background: alpha(color, 0.07),
        border: `1px solid ${alpha(color, 0.35)}`,
        borderColor: tintBorder(color),
        fontSize: FS[11],
        color: T.text,
        fontFamily: F.serif,
        letterSpacing: 0.2,
        lineHeight: LH.normal,
      }}
    >
      {children}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: '12px 0',
        background: 'transparent',
        border: 'none',
        borderBottom: active ? `2px solid ${T.champagne}` : '2px solid transparent',
        color: active ? T.text : T.muted,
        fontFamily: F.mono,
        fontSize: FS[10],
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        cursor: 'pointer',
        marginBottom: -1,
        transition: 'color 0.15s ease, border-color 0.15s ease',
      }}
    >
      {children}
    </button>
  );
}
