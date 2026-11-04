import { LECTURERS } from '../data/lecturers';

/**
 * `instructorName` holds lecturer initials as in the faculty timetable, e.g. "KT, AB".
 * The timetable prefixes lecturers from other faculties with `_` or `` ` `` (`_AL`); those are dropped.
 */
export function lecturerInitials(instructorName: string): string[] {
  return instructorName
    .split(',')
    .map((part) => part.trim().replace(/^[_`]+/, ''))
    .filter(Boolean);
}

/** Initials for the timetable, e.g. "KT, AB". */
export function lecturerShort(instructorName: string): string {
  return lecturerInitials(instructorName).join(', ');
}

/** Full names for the course list, e.g. "Dr. Kamuran Turkoglu, Anastashia Bamiteko". Unknown initials stay as they are. */
export function lecturerFullNames(instructorName: string): string[] {
  return lecturerInitials(instructorName).map((initials) => LECTURERS[initials.toUpperCase()] ?? initials);
}
