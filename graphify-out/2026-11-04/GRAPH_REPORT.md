# Graph Report - timetable-main  (2026-11-04)

## Corpus Check
- 50 files · ~52,886 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 431 nodes · 732 edges · 24 communities (20 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `af398df1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- TimetableGrid.tsx
- App.tsx
- dependencies
- CourseFormDialog.tsx
- Button.tsx
- devDependencies
- compilerOptions
- build-from-txt.mjs
- 2. Current Functionalities (User Side)
- compilerOptions
- scrape-portal.mjs
- useTheme.ts
- Input.tsx
- scripts/package.json
- useCourses.ts
- import-courses.mjs
- useMySchedule.ts
- Course Timetable — GAU Engineering, 2026–2027 Fall
- admin.mjs
- timeUtils.ts
- vite-env.d.ts
- tsconfig.json

## God Nodes (most connected - your core abstractions)
1. `cn()` - 22 edges
2. `compilerOptions` - 18 edges
3. `App()` - 17 edges
4. `compilerOptions` - 15 edges
5. `toMinutes()` - 12 edges
6. `sectionLabel()` - 10 edges
7. `CourseFormDialog()` - 9 edges
8. `TimetableWeekGrid()` - 9 edges
9. `GridSlip()` - 9 edges
10. `useTheme()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `FieldShell()` --calls--> `cn()`  [EXTRACTED]
  timetable/src/components/Input.tsx → timetable/src/utils/cn.ts
- `courseLabel()` --calls--> `sectionLabel()`  [EXTRACTED]
  timetable/src/App.tsx → timetable/src/utils/catalog.ts
- `App()` --calls--> `useAuth()`  [EXTRACTED]
  timetable/src/App.tsx → timetable/src/context/useAuth.ts
- `App()` --calls--> `deleteCourse()`  [EXTRACTED]
  timetable/src/App.tsx → timetable/src/hooks/useCourses.ts
- `App()` --calls--> `useCourses()`  [EXTRACTED]
  timetable/src/App.tsx → timetable/src/hooks/useCourses.ts

## Import Cycles
- None detected.

## Communities (24 total, 2 thin omitted)

### Community 0 - "TimetableGrid.tsx"
Cohesion: 0.13
Nodes (34): assignLanes(), compareByTime(), DayListProps, DENSITIES, Density, detailText(), GridSlip(), GridSlipProps (+26 more)

### Community 1 - "App.tsx"
Cohesion: 0.15
Nodes (22): App(), CourseDialog, courseLabel(), matches(), readStoredDepartment(), storeDepartment(), YearFilter, SEMESTER_OPTIONS (+14 more)

### Community 2 - "dependencies"
Cohesion: 0.06
Nodes (34): clsx, @hookform/resolvers, lucide-react, react, react-dom, react-hook-form, sonner, tailwind-merge (+26 more)

### Community 3 - "CourseFormDialog.tsx"
Cohesion: 0.12
Nodes (27): CATEGORY_OPTIONS, CourseFormDialog(), CourseFormDialogProps, DEPARTMENT_OPTIONS, errorMessage(), DAY_OPTIONS, MeetingsEditor(), MeetingsEditorProps (+19 more)

### Community 4 - "Button.tsx"
Cohesion: 0.07
Nodes (26): Button(), ButtonProps, ButtonSize, ButtonVariant, iconSizeClasses, sizeClasses, variantClasses, ConfirmDialog() (+18 more)

### Community 5 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, devDependencies, eslint, @eslint/js (+19 more)

### Community 6 - "compilerOptions"
Cohesion: 0.08
Nodes (24): DOM, src, vite/client, vitest/globals, compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, jsx (+16 more)

### Community 7 - "build-from-txt.mjs"
Cohesion: 0.09
Nodes (21): catalog, courses, DAY_ORDER, DAYS, here(), inferred, lecturers, LECTURERS_OUT (+13 more)

### Community 8 - "2. Current Functionalities (User Side)"
Cohesion: 0.10
Nodes (20): 1. Purpose and Users, 2.1 Department selection, 2.2 Course browsing, 2.3 Building a personal timetable, 2.4 Weekly timetable view, 2.5 General usability, 2. Current Functionalities (User Side), 3.1 Where the data comes from (+12 more)

### Community 9 - "compilerOptions"
Cohesion: 0.10
Nodes (19): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, noEmit (+11 more)

### Community 10 - "scrape-portal.mjs"
Cohesion: 0.11
Nodes (14): courses, curriculumKeys, DAYS, departments, descCourses, HEADERS, meetingsOf(), offerings (+6 more)

### Community 11 - "useTheme.ts"
Cohesion: 0.21
Nodes (12): ThemedToaster(), AuthProvider(), canMatchMedia(), useMediaQuery(), isTheme(), listeners, readStoredTheme(), subscribeToStoredTheme() (+4 more)

### Community 12 - "Input.tsx"
Cohesion: 0.22
Nodes (14): borderClass(), controlBase, describedBy(), FieldMessageProps, FieldShell(), FieldShellProps, Input, InputProps (+6 more)

### Community 13 - "scripts/package.json"
Cohesion: 0.14
Nodes (13): firebase-admin, dependencies, firebase, firebase-admin, description, firebase, name, private (+5 more)

### Community 14 - "useCourses.ts"
Cohesion: 0.22
Nodes (10): compareCourses(), coursesRef, deleteCourse(), toCourse(), useCourses(), LiveCollection, NO_ITEMS, SnapshotState (+2 more)

### Community 15 - "import-courses.mjs"
Cohesion: 0.18
Nodes (9): app, args, auth, db, env, failures, prune, ref (+1 more)

### Community 16 - "useMySchedule.ts"
Cohesion: 0.33
Nodes (8): cache, EMPTY, listeners, readIds(), readRaw(), subscribe(), useMySchedule(), writeIds()

### Community 17 - "Course Timetable — GAU Engineering, 2026–2027 Fall"
Cohesion: 0.29
Nodes (6): Alternative: admin role via script, Course data, Course Timetable — GAU Engineering, 2026–2027 Fall, Deploy to Firebase (production), Older source: the faculty portal, Run locally with the emulators

### Community 18 - "admin.mjs"
Cohesion: 0.38
Nodes (5): app, auth, db, usingEmulators, [email, password]

### Community 19 - "timeUtils.ts"
Cohesion: 0.16
Nodes (14): CourseCard(), CourseCardProps, Course, Meeting, SessionType, ConflictInfo, COURSE_COLOR_CLASSES, courseColorIndex() (+6 more)

## Knowledge Gaps
- **178 isolated node(s):** `usingEmulators`, `app`, `OUT`, `LECTURERS_OUT`, `DAYS` (+173 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 197 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `TimetableGrid.tsx` to `App.tsx`, `timeUtils.ts`, `Button.tsx`, `Input.tsx`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `dependencies`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `usingEmulators`, `app`, `OUT` to the rest of the system?**
  _178 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TimetableGrid.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13174603174603175 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `CourseFormDialog.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12043010752688173 - nodes in this community are weakly interconnected._
- **Should `Button.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07195121951219512 - nodes in this community are weakly interconnected._