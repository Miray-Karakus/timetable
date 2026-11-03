import {
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { auth, db } from '../services/firebase';
import { AuthContext, type AuthContextValue } from './useAuth';

interface AdminFlag {
  uid: string;
  value: boolean;
}

/**
 * A signed-in user is an admin when either
 *  - their ID token carries the custom claim `role: "admin"`, or
 *  - a document exists at `admins/{uid}` (can be created from the Firebase console).
 * The Firestore rules apply exactly the same check.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [claimAdmin, setClaimAdmin] = useState<AdminFlag | null>(null);
  const [docAdmin, setDocAdmin] = useState<AdminFlag | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => onIdTokenChanged(auth, async (next) => {
    setUser(next);
    if (next) {
      const token = await next.getIdTokenResult();
      setClaimAdmin({ uid: next.uid, value: token.claims.role === 'admin' });
    } else {
      setClaimAdmin(null);
    }
    setAuthReady(true);
  }), []);

  const uid = user?.uid;

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      doc(db, 'admins', uid),
      (snap) => setDocAdmin({ uid, value: snap.exists() }),
      () => setDocAdmin({ uid, value: false }),
    );
  }, [uid]);

  const claimKnown = Boolean(uid) && claimAdmin?.uid === uid;
  const docKnown = Boolean(uid) && docAdmin?.uid === uid;
  const isAdmin = Boolean(uid) && ((claimKnown && claimAdmin!.value) || (docKnown && docAdmin!.value));

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAdmin,
    loading: !authReady || (Boolean(uid) && !(claimKnown && docKnown)),
    signIn,
    signOut,
  }), [user, isAdmin, authReady, uid, claimKnown, docKnown, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
