import type { FallSemester } from '../types';

/** Programs listed on portal.gaueng.org (Engineering Faculty). */
export const DEPARTMENTS = [
  'Artificial Intelligence Engineering',
  'Automotive Engineering',
  'Bilgisayar Muhendisligi',
  'Civil Engineering',
  'Computer Engineering',
  'Electrical & Electronics Engineering',
  'Elektrik & Elektronik Muhendisligi',
  'Energy Systems Engineering',
  'Industrial Engineering',
  'Insaat Muhendisligi',
  'Mechanical Engineering',
  'Quantity Surveying',
  'Software Engineering',
] as const;

export const FALL_SEMESTERS: readonly FallSemester[] = [1, 3, 5, 7];

export const TERM_LABEL = '2026–2027 Fall';

export function yearOf(semester: FallSemester): number {
  return (semester + 1) / 2;
}

export const TECHNICAL_LABEL = 'Technical electives · open this term';

export const FREE_LABEL = 'Free electives · open to every department';

export function semesterLabel(semester: FallSemester): string {
  return `Year ${yearOf(semester)} · Semester ${semester}`;
}

/** Portal section "0" means the course has a single section. */
export function sectionLabel(sectionNo: string): string | null {
  return sectionNo === '00' ? null : `Section ${Number(sectionNo)}`;
}
