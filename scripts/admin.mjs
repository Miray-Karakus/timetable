import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Credentials: set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON file
// (or run `gcloud auth application-default login`).
// For the local emulators set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 and
// FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 instead.
const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT;
if (!projectId) {
  console.error('Set FIREBASE_PROJECT_ID to your Firebase project id.');
  process.exit(2);
}

const usingEmulators = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const app = initializeApp(usingEmulators ? { projectId } : { projectId, credential: applicationDefault() });

export const auth = getAuth(app);
export const db = getFirestore(app);
