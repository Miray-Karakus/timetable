import { useCallback, useSyncExternalStore } from 'react';

function canMatchMedia(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

export function useMediaQuery(mediaQuery: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!canMatchMedia()) return () => undefined;
      const list = window.matchMedia(mediaQuery);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [mediaQuery],
  );

  const getSnapshot = useCallback(
    () => (canMatchMedia() ? window.matchMedia(mediaQuery).matches : false),
    [mediaQuery],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
