import { z } from 'zod';
import type { Course, CourseCategory, CourseInput, FallSemester, Meeting } from '../types';
import { DEPARTMENTS } from './catalog';
import { meetingsOverlap, toMinutes } from './timeUtils';

export const DAY_VALUES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
export const SESSION_TYPE_VALUES = ['LECTURE', 'LAB', 'TUTORIAL'] as const;
export const SEMESTER_VALUES = ['1', '3', '5', '7'] as const;
export const CATEGORY_VALUES = ['core', 'technical', 'free'] as const;
export const MAX_MEETINGS = 10;

const COURSE_CODE_PATTERN = /^[A-Z]{2,10}\d{2,4}[A-Z]?$/;
const SECTION_NO_PATTERN = /^\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const WHOLE_NUMBER_PATTERN = /^\d+$/;

const meetingFormSchema = z
  .object({
    day: z.enum(DAY_VALUES, { error: 'Choose a day' }),
    start: z.string().regex(TIME_PATTERN, 'Enter a start time'),
    end: z.string().regex(TIME_PATTERN, 'Enter an end time'),
    room: z.string().trim().max(20, 'Use at most 20 characters'),
    type: z.enum(SESSION_TYPE_VALUES, { error: 'Choose a session type' }),
  })
  .superRefine((meeting, ctx) => {
    if (TIME_PATTERN.test(meeting.start) && TIME_PATTERN.test(meeting.end) && toMinutes(meeting.end) <= toMinutes(meeting.start)) {
      ctx.addIssue({ code: 'custom', message: 'End time must be after start time', path: ['end'] });
    }
  });

function isCompleteMeeting(meeting: z.infer<typeof meetingFormSchema>): boolean {
  return TIME_PATTERN.test(meeting.start) && TIME_PATTERN.test(meeting.end) && toMinutes(meeting.end) > toMinutes(meeting.start);
}

export const courseFormSchema = z.object({
  department: z.enum(DEPARTMENTS, { error: 'Choose a department' }),
  category: z.enum(CATEGORY_VALUES, { error: 'Choose a type' }),
  semester: z.enum(SEMESTER_VALUES, { error: 'Choose a semester' }),
  code: z.string().trim().toUpperCase().regex(COURSE_CODE_PATTERN, 'Use a code like CEN301'),
  name: z.string().trim().min(1, 'Enter the course name').max(120, 'Use at most 120 characters'),
  sectionNo: z.string().trim().regex(SECTION_NO_PATTERN, 'Use two digits, 00 for a single section'),
  instructorName: z.string().trim().max(80, 'Use at most 80 characters'),
  credits: z
    .string()
    .trim()
    .regex(WHOLE_NUMBER_PATTERN, 'Enter a whole number')
    .refine((value) => Number(value) <= 30, 'Use a value from 0 to 30'),
  prerequisites: z.string().trim().max(200, 'Use at most 200 characters'),
  meetings: z
    .array(meetingFormSchema)
    .max(MAX_MEETINGS, `A course can have at most ${MAX_MEETINGS} meetings`)
    .superRefine((meetings, ctx) => {
      for (let later = 1; later < meetings.length; later += 1) {
        for (let earlier = 0; earlier < later; earlier += 1) {
          const a = meetings[earlier];
          const b = meetings[later];
          if (isCompleteMeeting(a) && isCompleteMeeting(b) && meetingsOverlap(a, b)) {
            ctx.addIssue({ code: 'custom', message: `Overlaps meeting ${earlier + 1}`, path: [later, 'start'] });
          }
        }
      }
    }),
});

export type CourseFormInput = z.input<typeof courseFormSchema>;
export type CourseFormValues = z.output<typeof courseFormSchema>;

export function emptyMeeting(): Meeting {
  return { day: 'MON', start: '09:00', end: '11:00', room: '', type: 'LECTURE' };
}

export function emptyCourseValues(department: string, semester: FallSemester, category: CourseCategory = 'core'): CourseFormInput {
  return {
    department: (DEPARTMENTS as readonly string[]).includes(department) ? (department as CourseFormInput['department']) : DEPARTMENTS[0],
    category,
    semester: String(semester) as CourseFormInput['semester'],
    code: '',
    name: '',
    sectionNo: '00',
    instructorName: '',
    credits: '3',
    prerequisites: '',
    meetings: [emptyMeeting()],
  };
}

export function courseToValues(course: Course): CourseFormInput {
  return {
    department: course.department as CourseFormInput['department'],
    category: course.category,
    semester: String(course.semester) as CourseFormInput['semester'],
    code: course.code,
    name: course.name,
    sectionNo: course.sectionNo,
    instructorName: course.instructorName,
    credits: String(course.credits),
    prerequisites: course.prerequisites,
    meetings: course.meetings.map((meeting) => ({ ...meeting })),
  };
}

export function valuesToCourse(values: CourseFormValues): CourseInput {
  return {
    department: values.department,
    category: values.category,
    semester: Number(values.semester) as FallSemester,
    code: values.code,
    name: values.name,
    sectionNo: values.sectionNo,
    instructorName: values.instructorName,
    credits: Number(values.credits),
    prerequisites: values.prerequisites.toUpperCase(),
    meetings: values.meetings.map((meeting) => ({
      day: meeting.day,
      start: meeting.start,
      end: meeting.end,
      room: meeting.room.trim(),
      type: meeting.type,
    })),
  };
}
