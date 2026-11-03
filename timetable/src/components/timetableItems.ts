import type { Course, Meeting } from '../types';

export type TimetableVariant = 'enrolled' | 'preview' | 'conflict';

export interface TimetableItem {
  key: string;
  courseCode: string;
  courseName: string;
  sectionNo: string;
  meeting: Meeting;
  variant?: TimetableVariant;
}

export function courseToItems(course: Course, variant: TimetableVariant = 'enrolled'): TimetableItem[] {
  return course.meetings.map((meeting, index) => ({
    key: `${variant}-${course.id}-${index}`,
    courseCode: course.code,
    courseName: course.name,
    sectionNo: course.sectionNo,
    meeting,
    variant,
  }));
}
