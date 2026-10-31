import { useEffect, useState } from 'react';

const THEME_KEY = 'casaway-theme';

export function readStoredTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* private mode */
  }
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState(() => readStoredTheme());

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* private mode */
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f6f4ee' : '#0b0f19');
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      const next = root.dataset.theme === 'light' ? 'light' : 'dark';
      setTheme((previous) => (previous === next ? previous : next));
    });
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return { theme, setTheme, toggleTheme };
}