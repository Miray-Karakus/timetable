import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { createCourse, updateCourse } from '../hooks/useCourses';
import type { Course, CourseCategory, FallSemester } from '../types';
import { DEPARTMENTS, FALL_SEMESTERS, semesterLabel } from '../utils/catalog';
import {
  courseFormSchema,
  courseToValues,
  emptyCourseValues,
  valuesToCourse,
  type CourseFormInput,
  type CourseFormValues,
} from '../utils/courseForm';
import { Button } from './Button';
import { Input, Select } from './Input';
import { MeetingsEditor } from './MeetingsEditor';
import { Modal } from './Modal';

const DEPARTMENT_OPTIONS = DEPARTMENTS.map((department) => ({ value: department, label: department }));
const CATEGORY_OPTIONS = [
  { value: 'core', label: 'Curriculum course' },
  { value: 'technical', label: 'Technical elective' },
];
const SEMESTER_OPTIONS =FALL_SEMESTERS.map((semester) => ({ value: String(semester), label: semesterLabel(semester) }));

interface CourseFormDialogProps {
  open: boolean;
  /** The course being edited, or null to create a new one. */
  course: Course | null;
  /** Prefills for a new course. */
  department: string;
  semester: FallSemester;
  category: CourseCategory;
  onClose(): void;
}

function errorMessage(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
  if (code === 'permission-denied') return 'You don’t have permission to change courses.';
  return 'The course couldn’t be saved. Try again.';
}

export function CourseFormDialog({ open, course, department, semester, category, onClose }: CourseFormDialogProps) {
  const formId = useId();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormInput, unknown, CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: emptyCourseValues(department, semester, category),
  });

  useEffect(() => {
    if (open) reset(course ? courseToValues(course) : emptyCourseValues(department, semester, category));
  }, [open, course, department, semester, category, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const input = valuesToCourse(values);
    try {
      if (course) {
        await updateCourse(course.id, input);
        toast.success(`${input.code} updated`);
      } else {
        await createCourse(input);
        toast.success(`${input.code} added`);
      }
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  });

  const close = () => {
    if (!isSubmitting) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title={course ? `Edit ${course.code}` : 'New course'}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={isSubmitting}>
            {course ? 'Save changes' : 'Add course'}
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.3fr)]">
          <Select label="Department" options={DEPARTMENT_OPTIONS} error={errors.department?.message} {...register('department')} />
          <Select label="Type" options={CATEGORY_OPTIONS} error={errors.category?.message} {...register('category')} />
          <Select label="Semester" options={SEMESTER_OPTIONS} error={errors.semester?.message} {...register('semester')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <Input label="Course code" placeholder="CEN301" autoCapitalize="characters" error={errors.code?.message} {...register('code')} />
          <Input label="Course name" placeholder="Microprocessor" error={errors.name?.message} {...register('name')} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.4fr)]">
          <Input label="Section" inputMode="numeric" hint="00 = single section" error={errors.sectionNo?.message} {...register('sectionNo')} />
          <Input label="Lecturer" placeholder="MU" error={errors.instructorName?.message} {...register('instructorName')} />
          <Input label="Credits" inputMode="numeric" error={errors.credits?.message} {...register('credits')} />
          <Input label="Prerequisites" placeholder="ENG206" error={errors.prerequisites?.message} {...register('prerequisites')} />
        </div>
        <MeetingsEditor control={control} register={register} errors={errors} />
      </form>
    </Modal>
  );
}
