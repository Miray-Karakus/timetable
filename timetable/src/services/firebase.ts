import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';

export const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'demo-timetable.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-timetable',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? 'demo-app-id',
});

export const auth = getAuth(app);
export const db = getFirestore(app);

if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
