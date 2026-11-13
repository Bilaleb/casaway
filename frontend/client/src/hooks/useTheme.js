import { useEffect } from 'react';

const THEME_KEY = 'casaway-theme';

/** Ocean light is the only supported theme now. */
export function readStoredTheme() {
  try {
    if (localStorage.getItem(THEME_KEY) !== 'light') {
      localStorage.setItem(THEME_KEY, 'light');
    }
  } catch {
    /* private mode */
  }
  return 'light';
}

export function useTheme() {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = 'light';
    try {
      localStorage.setItem(THEME_KEY, 'light');
    } catch {
      /* private mode */
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', '#f2f9fd');
  }, []);

  return {
    theme: 'light',
    setTheme: () => {},
    toggleTheme: () => {},
  };
}
