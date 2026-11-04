// Usage: node build-from-txt.mjs
// Builds data/gau-fall.json from the faculty's text exports in data/txt/:
//  - "List of all offered courses.txt"          which courses are offered this term (one code per line);
//  - "Current Engineering Time Table.txt"        time blocks ("> DAY 09:00 - 10:00") of
//                                                 "CODE  SECTION  LECTURER  ROOM" rows;
//  - "Lecturer Initials with Full Names.txt"     "INITIALS Full Name" per line;
//  - "Classrooms of Engineering.txt"             known engineering rooms (only used for a warning).
// Course names, credits, prerequisites and the departments/semesters a course belongs to come from
// data/course-catalog.json (a placement may override name/credits/prerequisites for its department;
// entries with "inferred" were added by hand and their details are guesses). It also writes ../timetable/src/data/lecturers.ts (initials -> full name).
// Then import with import-courses.mjs (use --prune to delete courses that are no longer offered).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const readLines = (name) =>
  readFileSync(here(`./data/txt/${name}`), 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const OUT = here('./data/gau-fall.json');
const LECTURERS_OUT = here('../timetable/src/data/lecturers.ts');
const TERM = '2026-2027 Fall - Complete Time Table';
const DAYS = { MONDAY: 'MON', TUESDAY: 'TUE', WEDNESDAY: 'WED', THURSDAY: 'THU', FRIDAY: 'FRI', SATURDAY: 'SAT' };
const DAY_ORDER = Object.values(DAYS);
const NO_ROOM = new Set(['XXXXX']);

const pad = (n) => String(n).padStart(2, '0');
const toMinutes = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const slug = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/** Timetable initials carry a faculty prefix (`_AL`, `` `NA ``); the app stores them without it. */
const initials = (raw) => raw.replace(/^[_`]+/, '');

// 1. Lecturers.
const lecturers = {};
for (const line of readLines('Lecturer Initials with Full Names.txt')) {
  const m = line.match(/^(\S+)\s+(.+)$/);
  if (m) lecturers[initials(m[1])] = m[2].trim();
}

// 2. Timetable rows.
const slots = [];
let day = null;
let start = null;
let end = null;
for (const line of readLines('Current Engineering Time Table.txt')) {
  if (line.startsWith('>')) {
    // Block header: the class runs for the whole block, e.g. "MONDAY    09:00 - 10:00".
    const block = line.match(/^>+\s*([A-Z]+)\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);
    day = block ? DAYS[block[1]] : undefined;
    if (!day || toMinutes(block[3]) <= toMinutes(block[2])) throw new Error(`Unreadable block header "${line}"`);
    [start, end] = [block[2], block[3]];
    continue;
  }
  const [code, section, lecturer, room] = line.split(/\s+/);
  if (!code || room === undefined || day === null) throw new Error(`Unreadable timetable row "${line}"`);
  slots.push({ code, section: Number(section), lecturer: initials(lecturer), room: NO_ROOM.has(room) ? '' : room, day, start, end });
}

const offered = new Set(readLines('List of all offered courses.txt').map((code) => code.toUpperCase()));
const rooms = new Set(readLines('Classrooms of Engineering.txt'));
const catalog = new Map(JSON.parse(readFileSync(here('./data/course-catalog.json'), 'utf8')).courses.map((c) => [c.code, c]));

// 3. Sections of every offered course.
const offerings = new Map();
for (const s of slots) {
  if (!offered.has(s.code)) continue;
  const key = `${s.code}|${s.section}`;
  if (!offerings.has(key)) offerings.set(key, { code: s.code, section: s.section, lecturers: [], slots: [] });
  const o = offerings.get(key);
  if (s.lecturer && !o.lecturers.includes(s.lecturer)) o.lecturers.push(s.lecturer);
  o.slots.push(s);
}

// Times are taken exactly from the block headers ("09:00 - 10:00" -> 09:00–10:00). Back-to-back
// blocks on the same day in the same room become one meeting (09:00–10:00 + 10:00–11:00 -> 09:00–11:00).
function meetingsOf(o) {
  const unique = [...new Map(o.slots.map((s) => [`${s.day}|${s.start}|${s.room}`, s])).values()];
  unique.sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || toMinutes(a.start) - toMinutes(b.start));
  const meetings = [];
  for (const s of unique) {
    const last = meetings[meetings.length - 1];
    if (last && last.day === s.day && last.room === s.room && last.end === s.start) {
      last.end = s.end;
      continue;
    }
    // The same section listed in two rooms at the same time: keep the first room.
    if (last && last.day === s.day && toMinutes(last.end) > toMinutes(s.start)) continue;
    meetings.push({ day: s.day, start: s.start, end: s.end, room: s.room });
  }
  return meetings.map((m) => ({ day: m.day, start: m.start, end: m.end, room: m.room.slice(0, 20), type: 'LECTURE' }));
}

// 4. One document per department + course + section. Offered courses without timetable rows get one
//    section "00" without meetings.
const courses = [];
const missing = [];
for (const code of [...offered].sort()) {
  const info = catalog.get(code);
  if (!info) {
    missing.push(code);
    continue;
  }
  const sections = [...offerings.values()].filter((o) => o.code === code).sort((a, b) => a.section - b.section);
  const variants = sections.length
    ? sections.map((o) => ({ sectionNo: pad(o.section), instructorName: o.lecturers.join(', ').slice(0, 80), meetings: meetingsOf(o) }))
    : [{ sectionNo: '00', instructorName: '', meetings: [] }];
  for (const placement of info.placements) {
    for (const v of variants) {
      courses.push({
        id: `${slug(placement.department)}_${code}_${v.sectionNo}`,
        department: placement.department,
        category: placement.category,
        semester: placement.semester,
        code,
        // A placement may override the name/credits/prerequisites for its department.
        name: placement.name ?? info.name,
        prerequisites: placement.prerequisites ?? info.prerequisites ?? '',
        credits: placement.credits ?? info.credits,
        ...v,
      });
    }
  }
}
if (missing.length) throw new Error(`Offered courses missing from data/course-catalog.json: ${missing.join(', ')}`);

writeFileSync(OUT, JSON.stringify({ source: 'scripts/data/txt', term: TERM, generatedAt: new Date().toISOString(), courses }, null, 2) + '\n');

mkdirSync(here('../timetable/src/data'), { recursive: true });
writeFileSync(
  LECTURERS_OUT,
  `// Generated by scripts/build-from-txt.mjs from "Lecturer Initials with Full Names.txt". Do not edit by hand.\n` +
    `export const LECTURERS: Readonly<Record<string, string>> = ${JSON.stringify(lecturers, null, 2)};\n`,
);

// 5. Report.
const notOffered = [...new Set(slots.map((s) => s.code))].filter((code) => !offered.has(code));
const unknownLecturers = [...new Set(slots.filter((s) => offered.has(s.code) && s.lecturer && !lecturers[s.lecturer]).map((s) => s.lecturer))];
const otherRooms = [...new Set(slots.filter((s) => offered.has(s.code) && s.room && !rooms.has(s.room)).map((s) => s.room))];
const inferred = [...offered].filter((code) => catalog.get(code)?.inferred);
console.log(
  `${TERM}: ${offered.size} offered courses -> ${courses.length} department sections ` +
    `(${courses.filter((c) => c.meetings.length).length} with class times) -> ${OUT}`,
);
console.log(`${Object.keys(lecturers).length} lecturers -> ${LECTURERS_OUT}`);
if (notOffered.length) console.log(`In the timetable but not offered (skipped): ${notOffered.join(', ')}`);
if (unknownLecturers.length) console.log(`Lecturer initials without a full name: ${unknownLecturers.join(', ')}`);
if (otherRooms.length) console.log(`Rooms outside the engineering list: ${otherRooms.join(', ')}`);
if (inferred.length) console.log(`Courses with guessed details in course-catalog.json: ${inferred.join(', ')}`);
