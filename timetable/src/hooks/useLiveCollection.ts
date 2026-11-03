import { onSnapshot, type DocumentData, type Query, type QueryDocumentSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export interface LiveCollection<T> {
  items: T[];
  loading: boolean;
  error: Error | null;
}

interface SnapshotState<T> {
  source: Query;
  items: T[];
  error: Error | null;
}

const NO_ITEMS: never[] = [];

export function docWithId<T>(snapshot: QueryDocumentSnapshot<DocumentData>): T {
  return { ...snapshot.data(), id: snapshot.id } as T;
}

export function useLiveCollection<T>(
  source: Query | null,
  toItem: (snapshot: QueryDocumentSnapshot<DocumentData>) => T,
): LiveCollection<T> {
  const [state, setState] = useState<SnapshotState<T> | null>(null);

  useEffect(() => {
    if (!source) return;
    return onSnapshot(
      source,
      (snapshot) => setState({ source, items: snapshot.docs.map(toItem), error: null }),
      (error) => setState({ source, items: [], error }),
    );
  }, [source, toItem]);

  const current = source && state?.source === source ? state : null;

  return {
    items: current?.items ?? NO_ITEMS,
    loading: Boolean(source) && !current,
    error: current?.error ?? null,
  };
}
