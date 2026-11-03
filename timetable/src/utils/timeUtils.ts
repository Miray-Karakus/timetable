import type { Day, Meeting, SessionType } from '../types';

export const DAYS: Day[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const DAY_LABELS: Record<Day, { short: string; long: string }> = {
  MON: { short: 'Mon', long: 'Monday' },
  TUE: { short: 'Tue', long: 'Tuesday' },
  WED: { short: 'Wed', long: 'Wednesday' },
  THU: { short: 'Thu', long: 'Thursday' },
  FRI: { short: 'Fri', long: 'Friday' },
  SAT: { short: 'Sat', long: 'Saturday' },
};

export const SESSION_LABELS: Record<SessionType, string> = {
  LECTURE: 'Lecture',
  LAB: 'Lab',
  TUTORIAL: 'Tutorial',
};

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number): string {
  const h = Math.floor(total / 60).toString().padStart(2, '0');
  const m = (total % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function meetingsOverlap(a: Meeting, b: Meeting): boolean {
  return a.day === b.day
    && toMinutes(a.start) < toMinutes(b.end)
    && toMinutes(b.start) < toMinutes(a.end);
}

export interface ConflictInfo {
  courseCode: string;
  existing: Meeting;
  incoming: Meeting;
}

export function findConflicts(
  incoming: Meeting[],
  existing: { courseCode: string; meetings: Meeting[] }[],
): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];
  for (const item of existing) {
    for (const em of item.meetings) {
      for (const nm of incoming) {
        if (meetingsOverlap(em, nm)) {
          conflicts.push({ courseCode: item.courseCode, existing: em, incoming: nm });
        }
      }
    }
  }
  return conflicts;
}

export function formatMeeting(meeting: Meeting): string {
  return `${DAY_LABELS[meeting.day].short} ${meeting.start}–${meeting.end}`;
}

export function courseColorIndex(courseCode: string): number {
  let hash = 0;
  for (const ch of courseCode) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return (hash % 8) + 1;
}

export const COURSE_COLOR_CLASSES: Record<number, { fill: string; edge: string; ink: string }> = {
  1: { fill: 'bg-course-1', edge: 'border-course-1-edge', ink: 'text-course-1-ink' },
  2: { fill: 'bg-course-2', edge: 'border-course-2-edge', ink: 'text-course-2-ink' },
  3: { fill: 'bg-course-3', edge: 'border-course-3-edge', ink: 'text-course-3-ink' },
  4: { fill: 'bg-course-4', edge: 'border-course-4-edge', ink: 'text-course-4-ink' },
  5: { fill: 'bg-course-5', edge: 'border-course-5-edge', ink: 'text-course-5-ink' },
  6: { fill: 'bg-course-6', edge: 'border-course-6-edge', ink: 'text-course-6-ink' },
  7: { fill: 'bg-course-7', edge: 'border-course-7-edge', ink: 'text-course-7-ink' },
  8: { fill: 'bg-course-8', edge: 'border-course-8-edge', ink: 'text-course-8-ink' },
};

export function courseColors(courseCode: string) {
  return COURSE_COLOR_CLASSES[courseColorIndex(courseCode)];
}
