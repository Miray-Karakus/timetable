# Course Timetable — GAU Engineering, 2026–2027 Fall

A single-page app. Anyone can open it, pick their department, add fall courses
(1st semester of each year: semesters 1, 3, 5, 7) and see them on a weekly timetable.
The selection is kept in the browser, per department. An admin signs in with the
**Login** button at the top right and can add, edit and delete courses.

No backend server: the React app talks to Firestore directly, and `firestore.rules`
makes courses public to read and admin-only to change.

```
timetable/                 React + Vite frontend (deployed to Firebase Hosting)
scripts/scrape-portal.mjs  pulls courses + class times from portal.gaueng.org -> scripts/data/gau-fall.json
scripts/import-courses.mjs writes that file to Firestore, signed in as an admin
scripts/make-admin.mjs     grants the admin role with the Admin SDK (optional)
firebase.json              Hosting + Firestore + emulator config
firestore.rules            security rules
```

## Course data

`scripts/data/gau-fall.json` is generated from the faculty portal:

- `schedule/cdesc.php?dept=…` → code, name, credits, prerequisites of every
  department's fall-semester curriculum courses (semesters 1/3/5/7; elective
  placeholders FEL/TEL are not included);
- `schedule/sched.php?dept=…` → the "ALL OFFERED TECHNICALS" list; a technical
  elective is included **only if it is open this term** (appears in the timetable);
- `comptt/timetable.php` (2026–2027 Fall complete timetable) → day, hour, room,
  lecturer initials per section. Each hourly slot is stored as hh:00–hh:50 and
  consecutive hours in the same room are merged.

Each department + course + section is one document (404 in total: 359 curriculum
sections, 318 of all sections with class times, plus 45 technical-elective sections).
Curriculum courses the timetable doesn't list are kept without times; admins can add
them from the UI. Documents have a `category` field: `core` or `technical`. To refresh for a new term: `cd scripts && node scrape-portal.mjs`,
then import again.

## Deploy to Firebase (production)

1. **Firebase project** (console.firebase.google.com):
   - create the project (or use an existing one);
   - **Build → Authentication → Sign-in method**: enable **Email/Password**;
   - **Build → Firestore Database**: create the database (production mode, region e.g. `europe-west1`);
   - **Project settings → General → Your apps**: add a **Web app** and copy its config.
2. **CLI login and project selection** (from this folder):
   ```sh
   npm install -g firebase-tools     # if not installed
   firebase login --reauth
   firebase use --add                # choose the project, alias: default
   ```
3. **Frontend config**: copy `timetable/.env.example` to `timetable/.env.production`
   and fill `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
   `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` (keep `VITE_USE_EMULATORS=false`).
4. **Install and deploy** (the hosting `predeploy` step builds the app):
   ```sh
   npm --prefix timetable install
   firebase deploy --only firestore,hosting
   ```
   The site is then live at `https://<project-id>.web.app`.
5. **Create the admin account**:
   - **Authentication → Users → Add user** (email + password), copy the user's **UID**;
   - **Firestore → Start collection** `admins` → document ID = that UID → any field
     (e.g. `email: "<the email>"`) → Save.
6. **Load the courses** (runs as that admin, so no service account is needed):
   ```sh
   cd scripts
   npm install
   ADMIN_EMAIL=<admin email> ADMIN_PASSWORD='<password>' node import-courses.mjs
   ```
   PowerShell: `$env:ADMIN_EMAIL="..."; $env:ADMIN_PASSWORD="..."; node import-courses.mjs`
   It reads the project config from `timetable/.env.production`. Re-running is safe
   (same document ids); add `--prune` to also delete courses not in the file.
7. Open the site, check a department, sign in with **Login** and confirm the
   **New course / Edit / Delete** controls appear.

Later changes: `firebase deploy --only hosting` for UI changes,
`firebase deploy --only firestore:rules` for rule changes.

### Alternative: admin role via script

`scripts/make-admin.mjs` sets the `role: "admin"` custom claim and the `admins/{uid}`
document with the Admin SDK. It needs a service-account key
(`GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json`):

```sh
cd scripts
FIREBASE_PROJECT_ID=<project-id> node make-admin.mjs admin@example.edu
```

## Run locally with the emulators

```sh
firebase emulators:start --only auth,firestore --project demo-timetable
# another terminal
cd scripts && npm install
FIREBASE_PROJECT_ID=demo-timetable FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
  node make-admin.mjs admin@test.edu 'Test1234!'
USE_EMULATORS=true ADMIN_EMAIL=admin@test.edu ADMIN_PASSWORD='Test1234!' node import-courses.mjs
# frontend
cd ../timetable && echo "VITE_USE_EMULATORS=true" > .env.development.local && npm run dev
```
