// Usage:
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... node import-courses.mjs [data/gau-fall.json] [--prune]
// Writes the course sections to Firestore *as the admin user*, so the security rules apply
// and no service account is needed. Re-running overwrites the same document ids.
//   --prune   also delete courses that are not in the file (e.g. old demo data).
// Firebase web config is read from ../timetable/.env.production (or .env), or from VITE_FIREBASE_* env vars.
// Set USE_EMULATORS=true to target the local emulators instead.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, connectFirestoreEmulator, deleteDoc, doc, getDocs, getFirestore, setDoc, terminate } from 'firebase/firestore';

const args = process.argv.slice(2);
const prune = args.includes('--prune');
const file = args.find((a) => !a.startsWith('--')) ?? fileURLToPath(new URL('./data/gau-fall.json', import.meta.url));
const useEmulators = process.env.USE_EMULATORS === 'true';

function readEnvFile() {
  for (const name of ['.env.production', '.env']) {
    const path = fileURLToPath(new URL(`../timetable/${name}`, import.meta.url));
    if (!existsSync(path)) continue;
    const entries = readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2].replace(/^['"]|['"]$/g, '')]);
    return Object.fromEntries(entries);
  }
  return {};
}

const env = { ...(useEmulators ? {} : readEnvFile()), ...process.env };
const config = useEmulators
  ? { apiKey: 'demo-api-key', projectId: env.FIREBASE_PROJECT_ID ?? 'demo-timetable' }
  : {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      appId: env.VITE_FIREBASE_APP_ID,
    };
if (!config.apiKey || !config.projectId) {
  console.error('Missing Firebase config: fill timetable/.env.production or set VITE_FIREBASE_* variables.');
  process.exit(2);
}
if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD for an account with the admin role.');
  process.exit(2);
}

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);
if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

const { term, courses } = JSON.parse(readFileSync(file, 'utf8'));
console.log(`Project ${config.projectId}${useEmulators ? ' (emulators)' : ''}: importing ${courses.length} course sections (${term}).`);
await signInWithEmailAndPassword(auth, env.ADMIN_EMAIL, env.ADMIN_PASSWORD);

const ref = collection(db, 'courses');
let written = 0;
const failures = [];
for (let i = 0; i < courses.length; i += 20) {
  await Promise.all(
    courses.slice(i, i + 20).map(async ({ id, ...data }) => {
      try {
        await setDoc(doc(ref, id), data);
        written += 1;
      } catch (error) {
        failures.push(`${id}: ${error.code ?? error.message}`);
      }
    }),
  );
  process.stdout.write(`\r  written ${written}/${courses.length}`);
}
process.stdout.write('\n');

if (prune) {
  const keep = new Set(courses.map((c) => c.id));
  const stale = (await getDocs(ref)).docs.filter((d) => !keep.has(d.id));
  await Promise.all(stale.map((d) => deleteDoc(d.ref)));
  console.log(`  pruned ${stale.length} course(s) that are not in the file.`);
}

if (failures.length) {
  console.error(`${failures.length} failed:\n  ${failures.slice(0, 20).join('\n  ')}`);
  if (failures.some((f) => f.includes('permission-denied'))) console.error('permission-denied: does this account have the admin role? (see README)');
}
await terminate(db);
process.exit(failures.length ? 1 : 0);
