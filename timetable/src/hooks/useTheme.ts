import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type { ThemePreference } from '../types';
import { useMediaQuery } from './useMediaQuery';

const STORAGE_KEY = 'tt-theme';
const THEMES: ThemePreference[] = ['light', 'dark', 'system'];
const listeners = new Set<() => void>();

function isTheme(value: unknown): value is ThemePreference {
  return typeof value === 'string' && THEMES.includes(value as ThemePreference);
}

function readStoredTheme(): ThemePreference | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

function writeStoredTheme(theme: ThemePreference): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    return;
  }
}

function subscribeToStoredTheme(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onStorage);
  };
}

export function useTheme(): { theme: ThemePreference; dark: boolean; setTheme(theme: ThemePreference): void } {
  const storedTheme = useSyncExternalStore(subscribeToStoredTheme, readStoredTheme, () => null);
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const theme: ThemePreference = storedTheme ?? 'system';
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const setTheme = useCallback((next: ThemePreference) => {
    writeStoredTheme(next);
    listeners.forEach((listener) => listener());
  }, []);

  return { theme, dark, setTheme };
}
