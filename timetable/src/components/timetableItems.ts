import type { Course, Meeting } from '../types';
import { lecturerShort } from '../utils/lecturers';

export type TimetableVariant = 'enrolled' | 'preview' | 'conflict';

export interface TimetableItem {
  key: string;
  courseCode: string;
  courseName: string;
  sectionNo: string;
  /** Lecturer initials, e.g. "KT, AB" (the timetable shows initials only). */
  lecturer: string;
  meeting: Meeting;
  variant?: TimetableVariant;
}

export function courseToItems(course: Course, variant: TimetableVariant = 'enrolled'): TimetableItem[] {
  const lecturer = lecturerShort(course.instructorName);
  return course.meetings.map((meeting, index) => ({
    key: `${variant}-${course.id}-${index}`,
    courseCode: course.code,
    courseName: course.name,
    sectionNo: course.sectionNo,
    lecturer,
    meeting,
    variant,
  }));
}
