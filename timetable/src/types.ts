export type Day = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';
export type SessionType = 'LECTURE' | 'LAB' | 'TUTORIAL';
export type ThemePreference = 'light' | 'dark' | 'system';
/** Fall semesters only: 1st semester of each year. */
export type FallSemester = 1 | 3 | 5 | 7;

export interface Meeting {
  day: Day;
  start: string;
  end: string;
  room: string;
  type: SessionType;
}

/**
 * `core`: a curriculum course of that semester; `technical`: a technical elective open this term;
 * `free`: a free elective (e.g. BUS courses) that students of any department can take.
 */
export type CourseCategory = 'core' | 'technical' | 'free';

/** A fall course section, stored in the `courses` collection. */
export interface Course {
  id: string;
  department: string;
  category: CourseCategory;
  /** For technical electives: the semester they are usually taken in (7). */
  semester: FallSemester;
  code: string;
  name: string;
  sectionNo: string;
  instructorName: string;
  credits: number;
  prerequisites: string;
  /** Empty when the timetable has no published times for this section. */
  meetings: Meeting[];
}

export type CourseInput = Omit<Course, 'id'>;
