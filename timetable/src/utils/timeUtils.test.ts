import type { Meeting } from '../types';
import {
  COURSE_COLOR_CLASSES,
  courseColorIndex,
  courseColors,
  findConflicts,
  formatMeeting,
  fromMinutes,
  meetingsOverlap,
  toMinutes,
} from './timeUtils';

function meeting(overrides: Partial<Meeting> = {}): Meeting {
  return { day: 'MON', start: '09:30', end: '11:20', room: 'B-204', type: 'LECTURE', ...overrides };
}

describe('toMinutes and fromMinutes', () => {
  it('converts clock times to minutes since midnight', () => {
    expect(toMinutes('00:00')).toBe(0);
    expect(toMinutes('08:30')).toBe(510);
    expect(toMinutes('20:00')).toBe(1200);
  });

  it('formats minutes as zero padded clock times', () => {
    expect(fromMinutes(0)).toBe('00:00');
    expect(fromMinutes(545)).toBe('09:05');
    expect(fromMinutes(1200)).toBe('20:00');
  });

  it('round trips every half hour of the teaching day', () => {
    for (let minutes = 480; minutes <= 1200; minutes += 30) {
      expect(toMinutes(fromMinutes(minutes))).toBe(minutes);
    }
  });
});

describe('meetingsOverlap', () => {
  it('detects a partial overlap on the same day', () => {
    expect(meetingsOverlap(meeting(), meeting({ start: '10:30', end: '12:20' }))).toBe(true);
  });

  it('detects a meeting fully contained in another', () => {
    expect(meetingsOverlap(meeting({ start: '09:00', end: '12:00' }), meeting({ start: '10:00', end: '11:00' }))).toBe(true);
  });

  it('detects identical meetings', () => {
    expect(meetingsOverlap(meeting(), meeting())).toBe(true);
  });

  it('does not treat back to back meetings as overlapping', () => {
    expect(meetingsOverlap(meeting({ start: '09:30', end: '11:20' }), meeting({ start: '11:20', end: '12:20' }))).toBe(false);
    expect(meetingsOverlap(meeting({ start: '11:20', end: '12:20' }), meeting({ start: '09:30', end: '11:20' }))).toBe(false);
  });

  it('detects a one minute overlap', () => {
    expect(meetingsOverlap(meeting({ start: '09:30', end: '11:21' }), meeting({ start: '11:20', end: '12:20' }))).toBe(true);
  });

  it('ignores meetings on different days', () => {
    expect(meetingsOverlap(meeting({ day: 'MON' }), meeting({ day: 'TUE' }))).toBe(false);
  });

  it('is symmetric', () => {
    const a = meeting({ start: '13:30', end: '15:20' });
    const b = meeting({ start: '15:00', end: '16:50' });
    expect(meetingsOverlap(a, b)).toBe(meetingsOverlap(b, a));
  });
});

describe('findConflicts', () => {
  const existing = [
    { courseCode: 'CMPE211', meetings: [meeting(), meeting({ day: 'WED', start: '13:30', end: '15:20' })] },
    { courseCode: 'MATH201', meetings: [meeting({ day: 'TUE', start: '08:30', end: '10:20' })] },
  ];

  it('returns an empty list when nothing overlaps', () => {
    expect(findConflicts([meeting({ day: 'THU' }), meeting({ start: '11:20', end: '13:20' })], existing)).toEqual([]);
  });

  it('returns an empty list when there are no existing courses', () => {
    expect(findConflicts([meeting()], [])).toEqual([]);
  });

  it('returns an empty list when there are no incoming meetings', () => {
    expect(findConflicts([], existing)).toEqual([]);
  });

  it('reports the clashing course with both meetings', () => {
    const incoming = meeting({ day: 'TUE', start: '10:00', end: '11:50' });
    expect(findConflicts([incoming], existing)).toEqual([
      { courseCode: 'MATH201', existing: existing[1].meetings[0], incoming },
    ]);
  });

  it('reports every pair of clashing meetings across courses', () => {
    const monday = meeting({ start: '11:00', end: '12:00' });
    const tuesday = meeting({ day: 'TUE', start: '09:00', end: '09:50' });
    const conflicts = findConflicts([monday, tuesday], existing);
    expect(conflicts).toHaveLength(2);
    expect(conflicts.map((conflict) => conflict.courseCode)).toEqual(['CMPE211', 'MATH201']);
    expect(conflicts[0].incoming).toBe(monday);
    expect(conflicts[1].incoming).toBe(tuesday);
  });

  it('reports one entry per overlapping meeting of the same course', () => {
    const conflicts = findConflicts(
      [meeting({ start: '10:00', end: '10:50' }), meeting({ day: 'WED', start: '15:00', end: '16:00' })],
      existing,
    );
    expect(conflicts).toHaveLength(2);
    expect(conflicts.every((conflict) => conflict.courseCode === 'CMPE211')).toBe(true);
  });
});

describe('formatMeeting', () => {
  it('uses the short day name and an en dash between times', () => {
    expect(formatMeeting(meeting())).toBe('Mon 09:30–11:20');
    expect(formatMeeting(meeting({ day: 'SAT', start: '10:00', end: '11:50' }))).toBe('Sat 10:00–11:50');
  });
});

describe('courseColorIndex', () => {
  const codes = ['CMPE211', 'CMPE213', 'MATH201', 'PHYS101', 'ENG102', 'HIST100', 'A', '', 'CMPE491-LONG-CODE'];

  it('always returns an index between 1 and 8', () => {
    for (const code of codes) {
      const index = courseColorIndex(code);
      expect(Number.isInteger(index)).toBe(true);
      expect(index).toBeGreaterThanOrEqual(1);
      expect(index).toBeLessThanOrEqual(8);
    }
  });

  it('is stable for the same course code', () => {
    for (const code of codes) {
      expect(courseColorIndex(code)).toBe(courseColorIndex(code));
    }
    expect(courseColorIndex('CMPE211')).toBe(courseColorIndex(`CMPE${211}`));
  });

  it('spreads many course codes across several colors', () => {
    const indexes = new Set(Array.from({ length: 64 }, (_, n) => courseColorIndex(`CMPE${100 + n}`)));
    expect(indexes.size).toBeGreaterThan(4);
  });

  it('maps to a defined palette entry', () => {
    for (const code of codes) {
      expect(courseColors(code)).toBe(COURSE_COLOR_CLASSES[courseColorIndex(code)]);
      expect(courseColors(code).fill).toMatch(/^bg-course-[1-8]$/);
    }
  });
});
