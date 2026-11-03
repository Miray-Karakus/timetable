// Usage: node scrape-portal.mjs [out.json]
// Builds the fall course list from portal.gaueng.org:
//  - curriculum courses (code, name, credits, prerequisites) from schedule/cdesc.php of every
//    department, fall semesters 1/3/5/7 only (elective placeholder rows FEL/TEL are skipped);
//  - technical electives from the "ALL OFFERED TECHNICALS" list of schedule/sched.php,
//    kept only when they are open this term;
//  - days, hours, rooms and lecturers from the complete fall timetable (comptt/timetable.php).
// Each course section becomes one document; curriculum courses without a timetable entry get no meetings.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = process.argv[2] ?? fileURLToPath(new URL('./data/gau-fall.json', import.meta.url));
const PORTAL = 'https://portal.gaueng.org/';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8',
};
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

async function get(path) {
  const res = await fetch(PORTAL + path, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} for ${path}`);
  return new TextDecoder('windows-1254').decode(await res.arrayBuffer());
}

function strip(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

const pad = (n) => String(n).padStart(2, '0');
const slug = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// 1. Curriculum courses (fall semesters) and the technical electives of each department.
const index = await get('schedule/index.php');
const departments = [...new Set([...index.matchAll(/cdesc\.php\?dept=([^"']+)["']/g)].map((m) => strip(m[1])))];
const normalizeCode = (code) => code.replace(/\s+/g, '').toUpperCase();
const descCourses = []; // curriculum courses of the fall semesters
const technicalCourses = []; // "All offered technicals" of each department (filtered to open ones later)
for (const dept of departments) {
  const html = await get('schedule/cdesc.php?dept=' + encodeURIComponent(dept));
  const title = strip((html.match(/<td class=['"]s3['"]>([\s\S]*?)<\/td>/) ?? [null, dept])[1]);
  const electiveInfo = new Map(); // code -> details from the "Technical electives" section
  for (const part of html.split(/<table class=['"]s2['"]/).slice(1)) {
    const header = strip((part.match(/<td[^>]*>([\s\S]*?)<\/td>/) ?? [null, ''])[1]);
    const semester = Number((header.match(/SEMEST(?:RE|ER)\s*(\d+)/i) ?? [null, NaN])[1]);
    const isElectivePool = /TECHNICAL/i.test(header);
    if (!isElectivePool && semester % 2 !== 1) continue; // spring semesters
    for (const t of part.split(/<table class=['"]s0['"]/).slice(1)) {
      const cells = [...t.matchAll(/<td class=['"]s1['"][^>]*>([\s\S]*?)<\/td>/g)].map((m) => strip(m[1]));
      const [rawCode, name, ...rest] = cells;
      if (!rawCode || !/\d/.test(rawCode)) continue; // FEL / TEL placeholder rows
      const prereq = (rest.find((c) => /^PreReq/i.test(c)) ?? '').replace(/^PreReq\.?:\s*/i, '');
      const credit = (rest.find((c) => /^Credit/i.test(c)) ?? '').match(/\d+/);
      const course = {
        name,
        prerequisites: prereq === '-' ? '' : prereq,
        credits: Number(credit ? credit[0] : 0),
      };
      if (isElectivePool) electiveInfo.set(normalizeCode(rawCode), course);
      else descCourses.push({ department: title, category: 'core', semester, code: normalizeCode(rawCode), ...course });
    }
  }

  // "Schedule + Technicals" page: the list under "ALL OFFERED TECHNICALS (UNTIL NOW)".
  const sched = await get('schedule/sched.php?dept=' + encodeURIComponent(dept));
  const listStart = sched.search(/ALL OFFERED TECHNICALS/i);
  if (listStart === -1) continue;
  const list = sched.slice(listStart).split(/<br\s*\/?>/i).slice(2); // skip heading + ==== line
  for (const line of list) {
    const text = strip(line);
    const m = text.match(/^([A-Z]{2,10}\s?\d{2,4}[A-Z]?)\s+(.+?)(?:\s*~\s*([A-Z0-9 ,]+))?$/);
    if (!m) continue;
    const code = normalizeCode(m[1]);
    const info = electiveInfo.get(code);
    technicalCourses.push({
      department: title,
      category: 'technical',
      semester: 7, // technical electives are taken in the final year (fall = semester 7)
      code,
      name: info?.name || m[2].trim(),
      prerequisites: info?.prerequisites || (m[3] ?? '').replace(/\s+/g, ''),
      credits: info?.credits || 3,
    });
  }
}

// 2. Complete fall timetable: hourly rows x day columns; each entry is code / section / lecturer / room.
const tt = await get('comptt/timetable.php');
const term = strip((tt.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) ?? [null, ''])[1]);
const slots = [];
const rows = tt.slice(tt.indexOf('<table id="myTable">')).split(/<tr><th style="background: #eeeeee;">/).slice(1);
const ENTRY = /<tr><td width=35%>([\s\S]*?)<\/td><td width=15%>([\s\S]*?)<\/td><td width=15%>([\s\S]*?)<\/td><td width=35%>([\s\S]*?)<\/td><\/tr>/g;
for (const row of rows) {
  const hour = Number(strip((row.match(/<th[^>]*>(\d{1,2})<\/th>/) ?? [null, 'NaN'])[1]));
  const cells = row.slice(row.indexOf('</th>', row.indexOf('</table>')) + 5).split(/<td><table>/).slice(1);
  cells.forEach((cell, dayIndex) => {
    for (const r of cell.matchAll(ENTRY)) {
      const code = strip(r[1]).replace(/\s+/g, '').toUpperCase();
      if (!code) continue;
      slots.push({ code, section: strip(r[2]), lecturer: strip(r[3]).replace(/^[_`]+/, ''), room: strip(r[4]), day: DAYS[dayIndex], hour });
    }
  });
}
if (slots.length === 0) throw new Error('No timetable entries parsed — has the portal layout changed?');

const offerings = new Map();
for (const s of slots) {
  const key = `${s.code}|${s.section}`;
  if (!offerings.has(key)) offerings.set(key, { code: s.code, section: s.section, lecturers: new Set(), slots: [] });
  const o = offerings.get(key);
  if (s.lecturer) o.lecturers.add(s.lecturer);
  o.slots.push(s);
}

// Consecutive hours on the same day and room become one meeting; slots are hh:00–hh:50.
function meetingsOf(o) {
  const unique = [...new Map(o.slots.map((s) => [`${s.day}|${s.hour}|${s.room}`, s])).values()];
  unique.sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.hour - b.hour);
  const meetings = [];
  for (const s of unique) {
    const last = meetings[meetings.length - 1];
    if (last && last.day === s.day && last.room === s.room && last.endHour === s.hour) {
      last.endHour = s.hour + 1;
      continue;
    }
    if (last && last.day === s.day && last.endHour > s.hour) continue;
    meetings.push({ day: s.day, startHour: s.hour, endHour: s.hour + 1, room: s.room });
  }
  return meetings.map((m) => ({
    day: m.day,
    start: `${pad(m.startHour)}:00`,
    end: `${pad(m.endHour - 1)}:50`,
    room: m.room.slice(0, 20),
    type: 'LECTURE',
  }));
}

// 3. One document per department + course + section.
//    Curriculum courses are kept even without a timetable entry; technical electives only
//    when they are open this term (i.e. listed in the timetable).
const courses = [];
const seen = new Set();
const curriculumKeys = new Set(descCourses.map((c) => `${c.department}|${c.code}`));
let technicalOffered = 0;
for (const c of [...descCourses, ...technicalCourses]) {
  if (c.category === 'technical' && curriculumKeys.has(`${c.department}|${c.code}`)) continue; // already a core course there
  const sections = [...offerings.values()].filter((o) => o.code === c.code).sort((a, b) => Number(a.section) - Number(b.section));
  if (c.category === 'technical' && sections.length === 0) continue; // not open this term
  const variants = sections.length
    ? sections.map((o) => ({ sectionNo: pad(o.section), instructorName: [...o.lecturers].join(', ').slice(0, 80), meetings: meetingsOf(o) }))
    : [{ sectionNo: '00', instructorName: '', meetings: [] }];
  for (const v of variants) {
    const id = `${slug(c.department)}_${c.code}_${v.sectionNo}`;
    if (seen.has(id)) continue;
    seen.add(id);
    courses.push({ id, ...c, ...v });
    if (c.category === 'technical') technicalOffered += 1;
  }
}

writeFileSync(OUT, JSON.stringify({ source: PORTAL, term, generatedAt: new Date().toISOString(), courses }, null, 2) + '\n');
console.log(
  `${term}: ${departments.length} departments, ${courses.length} course sections ` +
    `(${courses.filter((c) => c.meetings.length).length} with class times; ` +
    `${technicalOffered} technical-elective sections open this term out of ${technicalCourses.length} listed technicals) -> ${OUT}`,
);
