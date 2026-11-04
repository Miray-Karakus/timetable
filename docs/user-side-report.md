# Course Timetable — User Side: Functionalities, Data and Suggestions

**Project:** Course Timetable for GAU Faculty of Engineering, 2026–2027 Fall
**Scope:** The student-facing ("user side") part of the application. Admin features are mentioned only where they affect students.
**Date:** 3 November 2026

---

## 1. Purpose and Users

The application helps an engineering student plan a fall-semester weekly timetable before registration. The student picks a department, browses that department's fall courses, adds sections to a personal timetable, and sees a clash-free weekly view.

There are two roles:

| Role | Account needed? | What they can do |
|---|---|---|
| **Student (user)** | No | Browse courses, build and view a personal timetable |
| **Admin** | Yes (email + password, admin role) | Add, edit and delete course sections for everyone |

Students do not need to register or sign in. This keeps the entry barrier at zero: the page opens and is immediately usable.

---

## 2. Current Functionalities (User Side)

### 2.1 Department selection
- A drop-down lists the 13 programs of the Engineering Faculty (including the Turkish-medium programs, e.g. *Bilgisayar Mühendisliği*, *İnşaat Mühendisliği*).
- The chosen department is remembered in the browser, so the student lands on the same department next time.

### 2.2 Course browsing
- Courses are grouped by **Year 1–4 (semesters 1, 3, 5, 7)** and a separate group for **Technical electives open this term**.
- **Year filter:** All / Year 1 / Year 2 / Year 3 / Year 4 / Technical.
- **Search:** by course code, course name or lecturer initials. Multiple words are matched together (e.g. `calc mu`).
- Each course card shows: code, section, name, credits, lecturer, prerequisites, and each class meeting as day + time + room (e.g. `Mon 12:00–14:00 · TP102`).
- Courses without published class times are clearly marked: *"No class times published for this term."*
- The list updates live: if an admin changes a course, students see the change without refreshing.

### 2.3 Building a personal timetable
- **Add / Remove** a section with one click. The header shows the total number of courses and total credits.
- **Live preview:** hovering over (or keyboard-focusing) a course card draws it on the timetable as a dashed "preview" block before it is added.
- **Clash detection:**
  - Every course card that would overlap with the current timetable shows *"Clashes with XXX"*.
  - In the preview, a clashing course is drawn in a red "conflict" style.
  - Adding a clashing course is blocked with a message (*"CE211 clashes with MT211 in your timetable"*).
- **Duplicate protection:** only one section of the same course code can be added (*"You already added MT111 section 1. Remove it first."*).
- **Courses without times** can still be added; they are listed under *"Added without published class times"* below the grid, so credit totals stay correct.
- **Clear all** empties the timetable in one step.

### 2.4 Weekly timetable view
- **Desktop/tablet:** a Monday–Friday grid from 08:00 to 20:00 in 30-minute rows. Saturday appears automatically if a selected course meets on Saturday. Today's day is highlighted.
- Each course has its own colour (stable per course code), so the same course always looks the same.
- Overlapping blocks (if any) are placed side by side in lanes, so nothing is hidden.
- **Mobile:** the grid switches to a day-by-day list, which is readable on a narrow screen.

### 2.5 General usability
- **Light / dark theme** toggle (also follows the system setting).
- Accessible markup: labelled buttons, keyboard focus, screen-reader descriptions of each timetable block (e.g. *"MT111, Monday 12:00 to 14:00, room TP102"*).
- Clear empty, loading and error states (e.g. *"No courses match your filters"*, *"Courses couldn't be loaded. Refresh the page to try again."*).

---

## 3. Data

### 3.1 Where the data comes from
All course data is taken from the faculty portal (`portal.gaueng.org`) by a scraper script, then imported into the database:

| Portal page | Data taken |
|---|---|
| `schedule/cdesc.php?dept=…` | Curriculum of each department: code, name, credits, prerequisites (fall semesters 1/3/5/7) |
| `schedule/sched.php?dept=…` | "All offered technicals" list — a technical elective is kept **only if it is open this term** |
| `comptt/timetable.php` | 2026–2027 Fall complete timetable: day, hour, room, lecturer initials per section |

Times are stored exactly as the timetable blocks (e.g. `09:00–10:00`); back-to-back blocks in the same room are merged into one meeting (e.g. 12:00–14:00).

### 3.2 Data model (one document per department + course + section)

| Field | Type | Example | Notes |
|---|---|---|---|
| `department` | text | `Computer Engineering` | One of 13 programs |
| `category` | `core` / `technical` | `core` | Curriculum course or technical elective |
| `semester` | 1, 3, 5, 7 | `1` | Year = (semester + 1) / 2 |
| `code` | text | `MT111` | Validated pattern, e.g. 2–10 letters + 2–4 digits |
| `name` | text | `Calculus I` | |
| `sectionNo` | text | `01` | `00` means a single section |
| `instructorName` | text | `MU` | Lecturer **initials** from the portal |
| `credits` | number | `4` | |
| `prerequisites` | text | `MT111` | Free text, may be empty |
| `meetings` | list (0–10) | `{day: MON, start: 12:00, end: 14:00, room: TP102, type: LECTURE}` | Empty when no times are published |

Every write is validated by database security rules (field names, value ranges, time format, `start < end`, allowed days and session types), so invalid data cannot be saved even by mistake.

### 3.3 Current dataset (2026–2027 Fall)

| Measure | Value |
|---|---|
| Course-section documents | **404** |
| Curriculum (core) sections / technical-elective sections | 359 / 45 |
| Distinct course codes | 158 |
| Sections by semester (1 / 3 / 5 / 7) | 137 / 100 / 70 / 97 |
| Courses with more than one section in a department | 78 |
| Course codes shared by more than one department | 46 (e.g. Calculus, Physics) |
| Sections **without** published class times | **86** (≈ 21%) |
| Sections with a prerequisite | 99 |
| Total class meetings | 378 (Mon 88, Tue 81, Wed 100, Thu 60, Fri 49, Sat 0) |
| Distinct lecturer initials | 29 (some sections have none) |

### 3.4 Where user data is kept and privacy
- **Course data** is public to read and can only be changed by an admin.
- **The student's timetable** (the list of selected section IDs) is stored **only in the student's own browser** (localStorage), separately per department. Nothing about the student is sent to the server: no name, no student number, no account.
- Consequence: the timetable is private by design, but it is lost if the browser data is cleared and it does not move to another device.

### 3.5 Data limitations seen from the user side
1. **21% of sections have no class times**, so students cannot check clashes for them.
2. **Session type** is always `LECTURE` in the imported data; the portal does not separate labs and tutorials, although the system supports them.
3. **Lecturers appear as initials** (`MU`, `KT, AB`), which are not meaningful to first-year students.
4. **Prerequisites are free text** and are only displayed, never checked.
5. **The "last updated" date** of the data exists in the scraped file but is not shown to students.
6. **Selection is per department**, so a student cannot combine sections from another department's list in one timetable (e.g. a minor, a repeated course, or a service course listed under another program).

---

## 4. Suggestions for the User Side

The suggestions are ordered by value to students versus effort. All items in **Priority 1** can be done without adding student accounts or a backend server.

### Priority 1 — Short term, low effort

| # | Suggestion | Why | Data needed |
|---|---|---|---|
| S1 | **Export timetable** as image/PDF and as a calendar file (`.ics`) for Google/Apple/Outlook Calendar | Students want the plan on their phone and calendar, not only in a browser tab | None (existing meetings) |
| S2 | **Share link**: encode the selected section IDs in the URL (e.g. `?d=computer-engineering&c=MT111_01,CMPE113_02`) | Share with an advisor or friends, move to another device, no account needed | None |
| S3 | **"Data last updated" note** in the header (e.g. *"Times as of 3 Nov 2026"*) | Students know how fresh the times are and when to re-check | Store `generatedAt` in a small `meta` document |
| S4 | **Credit summary and warning** per semester (e.g. warn above a configurable limit) | Prevents overloading before registration | A configurable limit value |
| S5 | **Print-friendly view** | Many students still print the weekly plan | None |
| S6 | **Filter "only courses that fit"** — hide sections that clash with the current timetable | Faster browsing when the timetable is almost full | None (clash logic exists) |
| S7 | **Language toggle (English / Turkish)** | Three of the 13 programs are Turkish-medium | UI translation strings only |

### Priority 2 — Medium term

| # | Suggestion | Why | Data needed |
|---|---|---|---|
| S8 | **Automatic schedule generator**: student picks the *courses*, the app proposes clash-free *section* combinations, with preferences such as "no classes before 10:00", "keep Friday free", "fewest gaps" | 78 courses have multiple sections; choosing the right combination by hand is the hardest part of planning | None (sections and meetings exist) |
| S9 | **Cross-department search** — add any section of the faculty to one timetable | Repeated courses, minors, double majors and shared service courses (46 shared codes) | None (query without department filter) |
| S10 | **Prerequisite check**: student ticks completed courses once; courses with missing prerequisites show a warning | Avoids planning courses the student cannot register for | Prerequisites in a structured form (list of codes instead of free text) |
| S11 | **Full lecturer names** on hover/cards | Initials are not meaningful to new students | Initials → full name table (from the portal or admin) |
| S12 | **Lab / Tutorial distinction** shown in the grid | Students need to know which hours are labs | Session type from the portal or entered by admin |
| S13 | **Week statistics**: hours per day, free days, longest gap, earliest/latest class | Helps students compare alternative plans | None |
| S14 | **Saved alternatives** (Plan A / Plan B) | Registration often fails for one section; a ready backup helps | None (stored in browser) |

### Priority 3 — Longer term (needs optional student sign-in)

| # | Suggestion | Why | Data needed |
|---|---|---|---|
| S15 | **Optional student sign-in** (university email) to sync the timetable across devices | Fixes the "lost when browser is cleared" problem | A `users/{uid}/schedules` collection, private per student |
| S16 | **Change notifications**: notify a student when a section in their timetable changes (time, room, cancellation) | Timetables change in the first weeks of term | Change history of course documents + email/push |
| S17 | **Room / building finder** (map or building name from the room code, e.g. `TP102`) | New students do not know where rooms are | Room → building/floor table |
| S18 | **Exam schedule** view next to the weekly timetable, with exam clash detection | Same planning problem at exam time | Exam dates from the portal |
| S19 | **Anonymous usage statistics** for the faculty (e.g. which sections are most planned) | Helps the faculty open extra sections where demand is high | Aggregated counts only, no personal data |

### Recommended data additions (summary)

To support the suggestions above, the data model would grow as follows:

| New data | Used by | Source |
|---|---|---|
| `meta.generatedAt` (last data refresh) | S3 | Scraper (already produced) |
| `prerequisites` as a list of course codes | S10 | Parse existing text |
| `instructors` table: initials → full name, email | S11 | Portal / admin |
| `meetings[].type` = LAB / TUTORIAL where relevant | S12 | Portal / admin |
| `rooms` table: room code → building, floor | S17 | Faculty |
| `users/{uid}/schedules` (optional, private) | S14, S15, S16 | Students |
| Exam dates per course | S18 | Portal |

---

## 5. Conclusion

The current user side already covers the core planning loop: pick a department, browse and search fall courses, preview, add with automatic clash and duplicate checks, and see a clear weekly timetable on desktop and mobile — with no account and no personal data stored on the server.

The main gaps are about **getting the plan out of the browser** (export, share link), **choosing between sections** (automatic generator, "only courses that fit" filter), and **data quality** (missing times for 21% of sections, lecturer initials, free-text prerequisites, no lab/tutorial distinction). We recommend starting with **S1–S3 and S8**, because they bring the largest benefit to students without requiring accounts or new data sources.
