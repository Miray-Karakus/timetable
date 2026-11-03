import { useCallback, useSyncExternalStore } from 'react';

/**
 * The student's own timetable for one department: the ids of the courses they added.
 * Kept in the browser (localStorage) — students don't need an account.
 */
const KEY_PREFIX = 'tt-my-courses:';
const listeners = new Set<() => void>();
const EMPTY: string[] = [];
const cache = new Map<string, { raw: string | null; ids: string[] }>();

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return cache.get(key)?.raw ?? null;
  }
}

function readIds(key: string): string[] {
  const raw = readRaw(key);
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.ids;
  let ids: string[] = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) ids = parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    ids = EMPTY;
  }
  cache.set(key, { raw, ids });
  return ids;
}

function writeIds(key: string, ids: string[]): void {
  const raw = JSON.stringify(ids);
  try {
    window.localStorage.setItem(key, raw);
  } catch {
    // Storage unavailable (private mode etc.): keep it for this session only.
  }
  cache.set(key, { raw, ids });
  listeners.forEach((listener) => listener());
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key?.startsWith(KEY_PREFIX)) onChange();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onStorage);
  };
}

export function useMySchedule(department: string) {
  const key = KEY_PREFIX + department;
  const getSnapshot = useCallback(() => readIds(key), [key]);
  const ids = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  const add = useCallback((id: string) => {
    const current = readIds(key);
    if (!current.includes(id)) writeIds(key, [...current, id]);
  }, [key]);

  const remove = useCallback((id: string) => {
    writeIds(key, readIds(key).filter((existing) => existing !== id));
  }, [key]);

  const removeMany = useCallback((gone: string[]) => {
    if (gone.length === 0) return;
    const drop = new Set(gone);
    writeIds(key, readIds(key).filter((existing) => !drop.has(existing)));
  }, [key]);

  const clear = useCallback(() => writeIds(key, []), [key]);

  return { ids, add, remove, removeMany, clear };
}
