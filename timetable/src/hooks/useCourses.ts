import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  query,
  setDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { useMemo } from 'react';
import { db } from '../services/firebase';
import type { Course, CourseInput, FallSemester } from '../types';
import { useLiveCollection, type LiveCollection } from './useLiveCollection';

const coursesRef = collection(db, 'courses');

function toCourse(snapshot: QueryDocumentSnapshot<DocumentData>): Course {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    department: String(data.department ?? ''),
    category: data.category === 'technical' ? 'technical' : 'core',
    semester: (Number(data.semester) || 1) as FallSemester,
    code: String(data.code ?? ''),
    name: String(data.name ?? ''),
    sectionNo: String(data.sectionNo ?? '00'),
    instructorName: String(data.instructorName ?? ''),
    credits: Number(data.credits ?? 0),
    prerequisites: String(data.prerequisites ?? ''),
    meetings: Array.isArray(data.meetings) ? data.meetings : [],
  };
}

function compareCourses(a: Course, b: Course): number {
  const rank = (c: Course) => (c.category === 'technical' ? 100 : c.semester);
  return rank(a) - rank(b) || a.code.localeCompare(b.code) || a.sectionNo.localeCompare(b.sectionNo);
}

/** Live list of one department's fall courses (one department per query keeps reads small). */
export function useCourses(department: string): LiveCollection<Course> {
  const source = useMemo(() => query(coursesRef, where('department', '==', department)), [department]);
  const result = useLiveCollection(source, toCourse);
  const items = useMemo(() => [...result.items].sort(compareCourses), [result.items]);
  return { ...result, items };
}

export async function createCourse(input: CourseInput): Promise<void> {
  await addDoc(coursesRef, input);
}

export async function updateCourse(id: string, input: CourseInput): Promise<void> {
  await setDoc(doc(coursesRef, id), input);
}

export async function deleteCourse(id: string): Promise<void> {
  await deleteDoc(doc(coursesRef, id));
}
