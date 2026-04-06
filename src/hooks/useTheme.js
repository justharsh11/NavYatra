import { useState, useEffect, useCallback } from 'react';

/**
 * useTheme — manages dark/light mode with:
 *  - System preference detection
 *  - localStorage persistence
 *  - Smooth transitions via data-theme attribute
 */
export default function useTheme() {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('map-theme');
    if (stored === 'dark' || stored === 'light') return stored;

    // Auto-detect system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('map-theme', theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      // Only auto-switch if user hasn't manually set a preference
      const stored = localStorage.getItem('map-theme');
      if (!stored) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  return { theme, toggleTheme };
}
