'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ThemeName } from './tokens';

/**
 * 사용자가 선택한 *의도* (storage 저장값):
 *   - 'dark' / 'light': 명시적 선택. system 변화 무시.
 *   - 'system': prefers-color-scheme 따라 자동.
 */
export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextValue {
  /** 실제 적용된 테마 (system 일 때는 OS 따라 'dark' 또는 'light'). */
  theme: ThemeName;
  /** 사용자가 선택한 모드 (storage 저장값). */
  mode: ThemeMode;
  /** 모드 직접 설정. */
  setMode: (m: ThemeMode) => void;
  /** 3-cycle: dark → light → system → dark. */
  toggleTheme: () => void;
  /** @deprecated setMode 와 동일. 기존 호출자 호환용. */
  setTheme: (t: ThemeName) => void;
}

const STORAGE_KEY = 'qa-theme';
const DEFAULT_MODE: ThemeMode = 'system';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readSystemPreference(): ThemeName {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return DEFAULT_MODE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch {
    // localStorage 미사용 환경: 기본값
  }
  return DEFAULT_MODE;
}

/** mode + system pref → 실제 적용할 theme. */
function resolveTheme(mode: ThemeMode, systemPref: ThemeName): ThemeName {
  return mode === 'system' ? systemPref : mode;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // SSR 안전한 초기값
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);
  const [systemPref, setSystemPref] = useState<ThemeName>('dark');
  const [mounted, setMounted] = useState(false);

  // 마운트 직후: localStorage + system pref 동기화
  useEffect(() => {
    setModeState(readInitialMode());
    setSystemPref(readSystemPreference());
    setMounted(true);
  }, []);

  // system pref 변경 감지 (mode='system' 일 때 자동 반영)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemPref(e.matches ? 'dark' : 'light');
    };
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
    // older Safari fallback
    mq.addListener(handler);
    return () => mq.removeListener(handler);
  }, []);

  const theme = useMemo(() => resolveTheme(mode, systemPref), [mode, systemPref]);

  // theme 변경 → DOM data-theme 갱신 + storage 에 mode 저장
  useEffect(() => {
    if (!mounted || typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // localStorage 미사용: 세션 한정 적용
    }
  }, [theme, mode, mounted]);

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);

  // 3-cycle: dark → light → system → dark
  const toggleTheme = useCallback(() => {
    setModeState((p) => (p === 'dark' ? 'light' : p === 'light' ? 'system' : 'dark'));
  }, []);

  // 기존 호출자 호환: setTheme(name) 은 mode 설정으로 매핑
  const setTheme = useCallback((t: ThemeName) => setModeState(t), []);

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: 'dark',
      mode: 'system',
      setMode: () => {},
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return ctx;
}

/**
 * Inline script: React hydrate 전에 data-theme 동기화 (FOUC 방지).
 * mode='system' 도 처리 (prefers-color-scheme media query 평가).
 */
export const themeInitScript = `
(function(){
  try {
    var m = localStorage.getItem('${STORAGE_KEY}');
    if (m !== 'light' && m !== 'dark' && m !== 'system') m = '${DEFAULT_MODE}';
    var t;
    if (m === 'system') {
      t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    } else {
      t = m;
    }
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;
