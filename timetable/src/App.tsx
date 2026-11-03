import { CalendarDays, ChevronDown, Eraser, LogIn, LogOut, Moon, Plus, Search, ShieldCheck, Sun, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from './components/Button';
import { ConfirmDialog } from './components/ConfirmDialog';
import { CourseCard } from './components/CourseCard';
import { CourseFormDialog } from './components/CourseFormDialog';
import { LoginDialog } from './components/LoginDialog';
import { Spinner } from './components/Spinner';
import { TimetableGrid } from './components/TimetableGrid';
import { courseToItems, type TimetableItem } from './components/timetableItems';
import { useAuth } from './context/useAuth';
import { deleteCourse, useCourses } from './hooks/useCourses';
import { useMySchedule } from './hooks/useMySchedule';
import { useTheme } from './hooks/useTheme';
import type { Course, FallSemester } from './types';
import { DEPARTMENTS, FALL_SEMESTERS, sectionLabel, semesterLabel, TECHNICAL_LABEL, TERM_LABEL, yearOf } from './utils/catalog';
import { cn } from './utils/cn';
import { findConflicts } from './utils/timeUtils';

type CourseDialog = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; course: Course };
type YearFilter = FallSemester | 'all' | 'technical';

const DEPARTMENT_KEY = 'tt-department';

function readStoredDepartment(): string {
  try {
    const stored = window.localStorage.getItem(DEPARTMENT_KEY);
    if (stored && (DEPARTMENTS as readonly string[]).includes(stored)) return stored;
  } catch {
    // ignore unavailable storage
  }
  return 'Computer Engineering';
}

function storeDepartment(department: string): void {
  try {
    window.localStorage.setItem(DEPARTMENT_KEY, department);
  } catch {
    // ignore unavailable storage
  }
}

function matches(course: Course, term: string): boolean {
  if (!term) return true;
  const haystack = `${course.code} ${course.name} ${course.instructorName}`.toLowerCase();
  return term.toLowerCase().split(/\s+/).every((word) => haystack.includes(word));
}

function courseLabel(course: Course): string {
  const section = sectionLabel(course.sectionNo);
  return section ? `${course.code} ${section.toLowerCase()}` : course.code;
}

export default function App() {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const { dark, setTheme } = useTheme();
  const [department, setDepartment] = useState(readStoredDepartment);
  const { items: courses, loading, error } = useCourses(department);
  const schedule = useMySchedule(department);

  const [year, setYear] = useState<YearFilter>('all');
  const [search, setSearch] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [courseDialog, setCourseDialog] = useState<CourseDialog>({ mode: 'closed' });
  const [pendingDelete, setPendingDelete] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  const changeDepartment = (next: string) => {
    setDepartment(next);
    storeDepartment(next);
    setPreviewId(null);
  };

  const byId = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses]);
  const myCourses = useMemo(
    () => schedule.ids.map((id) => byId.get(id)).filter((course): course is Course => Boolean(course)),
    [schedule.ids, byId],
  );
  const myIds = useMemo(() => new Set(myCourses.map((course) => course.id)), [myCourses]);
  const unscheduled = myCourses.filter((course) => course.meetings.length === 0);

  // Forget courses that an admin has since deleted (only once this department's list has loaded).
  const { ids: storedIds, removeMany } = schedule;
  useEffect(() => {
    if (loading || error) return;
    removeMany(storedIds.filter((id) => !byId.has(id)));
  }, [loading, error, storedIds, byId, removeMany]);

  const conflictOf = useMemo(() => {
    const others = myCourses.map((mine) => ({ courseCode: mine.code, meetings: mine.meetings }));
    const result = new Map<string, string | null>();
    for (const course of courses) {
      if (myIds.has(course.id)) continue;
      result.set(course.id, findConflicts(course.meetings, others)[0]?.courseCode ?? null);
    }
    return result;
  }, [courses, myCourses, myIds]);

  const gridItems = useMemo<TimetableItem[]>(() => {
    const items = myCourses.flatMap((course) => courseToItems(course));
    const preview = previewId ? byId.get(previewId) : undefined;
    if (preview && !myIds.has(preview.id)) {
      items.push(...courseToItems(preview, conflictOf.get(preview.id) ? 'conflict' : 'preview'));
    }
    return items;
  }, [myCourses, previewId, byId, myIds, conflictOf]);

  const totalCredits = myCourses.reduce((sum, course) => sum + course.credits, 0);

  const term = search.trim();
  const inFilter = (course: Course) =>
    year === 'all' || (year === 'technical' ? course.category === 'technical' : course.category === 'core' && course.semester === year);
  const visibleCourses = courses.filter((course) => inFilter(course) && matches(course, term));
  const groups = [
    ...FALL_SEMESTERS.map((semester) => ({
      key: String(semester),
      label: semesterLabel(semester),
      courses: visibleCourses.filter((course) => course.category === 'core' && course.semester === semester),
    })),
    { key: 'technical', label: TECHNICAL_LABEL, courses: visibleCourses.filter((course) => course.category === 'technical') },
  ].filter((group) => group.courses.length > 0);

  const addCourse = (course: Course) => {
    const sameCode = myCourses.find((mine) => mine.code === course.code);
    if (sameCode) {
      toast.error(`You already added ${courseLabel(sameCode)}. Remove it first.`);
      return;
    }
    const clash = conflictOf.get(course.id);
    if (clash) {
      toast.error(`${course.code} clashes with ${clash} in your timetable.`);
      return;
    }
    schedule.add(course.id);
    setPreviewId(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteCourse(pendingDelete.id);
      toast.success(`${courseLabel(pendingDelete)} deleted`);
      setPendingDelete(null);
    } catch {
      toast.error('The course couldn’t be deleted. Try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[90rem] items-center gap-3 px-4 sm:px-6">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand text-on-brand">
            <CalendarDays aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base leading-tight font-bold text-ink">Course Timetable</h1>
            <p className="truncate text-xs text-ink-soft">GAU Engineering · {TERM_LABEL}</p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(dark ? 'light' : 'dark')}
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="px-2"
          >
            {dark ? <Sun aria-hidden="true" className="size-4" /> : <Moon aria-hidden="true" className="size-4" />}
          </Button>

          {authLoading ? (
            <Spinner className="size-4 text-ink-faint" label="Checking sign-in" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <span className="hidden max-w-48 truncate text-sm text-ink-soft md:inline" title={user.email ?? undefined}>
                {user.email}
              </span>
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">
                  <ShieldCheck aria-hidden="true" className="size-3.5" /> Admin
                </span>
              ) : null}
              <Button variant="secondary" size="sm" icon={<LogOut />} onClick={() => void signOut()}>
                Sign out
              </Button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" icon={<LogIn />} onClick={() => setLoginOpen(true)}>
              Login
            </Button>
          )}
        </div>
      </header>

      {user && !authLoading && !isAdmin ? (
        <p className="border-b border-warn/30 bg-warn-soft px-4 py-2 text-center text-sm text-warn">
          This account doesn’t have the admin role, so it can’t change courses.
        </p>
      ) : null}

      <div className="mx-auto max-w-[90rem] px-4 pt-5 sm:px-6">
        <label className="block max-w-md">
          <span className="mb-1.5 block text-sm font-medium text-ink">Department</span>
          <span className="relative block">
            <select
              value={department}
              onChange={(event) => changeDepartment(event.target.value)}
              className="h-11 w-full appearance-none rounded-md border border-line bg-surface pr-9 pl-3 text-[0.9375rem] font-medium text-ink hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
            >
              {DEPARTMENTS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-soft" />
          </span>
        </label>
      </div>

      <main className="mx-auto grid max-w-[90rem] gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_25rem]">
        <section aria-labelledby="timetable-heading" className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="timetable-heading" className="text-lg font-semibold text-ink">
                My timetable
              </h2>
              <p className="text-sm text-ink-soft">
                {myCourses.length === 0
                  ? 'Add courses from the list to build your weekly plan.'
                  : `${myCourses.length} ${myCourses.length === 1 ? 'course' : 'courses'} · ${totalCredits} credits`}
              </p>
            </div>
            {myCourses.length > 0 ? (
              <Button variant="ghost" size="sm" icon={<Eraser />} onClick={schedule.clear}>
                Clear all
              </Button>
            ) : null}
          </div>
          <TimetableGrid items={gridItems} />
          {unscheduled.length > 0 ? (
            <div className="rounded-lg border border-line bg-surface p-3">
              <p className="text-sm font-medium text-ink">Added without published class times</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {unscheduled.map((course) => (
                  <li key={course.id} className="inline-flex items-center gap-1 rounded-full bg-sunken py-0.5 pr-1 pl-2.5 text-sm text-ink">
                    <span className="font-semibold">{course.code}</span> {course.name}
                    <button
                      type="button"
                      onClick={() => schedule.remove(course.id)}
                      aria-label={`Remove ${courseLabel(course)} from my timetable`}
                      className="grid size-6 place-items-center rounded-full text-ink-soft hover:bg-line hover:text-ink"
                    >
                      <X aria-hidden="true" className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="text-xs text-ink-faint">
            Times come from the faculty’s published timetable (hourly slots, hh:00–hh:50). Your selection is saved in this browser only.
          </p>
        </section>

        <section aria-labelledby="courses-heading" className="min-w-0 lg:sticky lg:top-22 lg:h-[calc(100dvh-7rem)]">
          <div className="flex h-full flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 id="courses-heading" className="text-lg font-semibold text-ink">
                Fall courses
              </h2>
              {isAdmin ? (
                <Button size="sm" icon={<Plus />} onClick={() => setCourseDialog({ mode: 'create' })}>
                  New course
                </Button>
              ) : null}
            </div>

            <div role="group" aria-label="Filter by year" className="flex gap-1 rounded-md bg-sunken p-1">
              {(['all', ...FALL_SEMESTERS, 'technical'] as YearFilter[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={year === option}
                  onClick={() => setYear(option)}
                  className={cn(
                    'h-8 flex-1 rounded px-2 text-sm font-medium',
                    'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand',
                    year === option ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft hover:text-ink',
                  )}
                >
                  {option === 'all' ? 'All' : option === 'technical' ? 'Technical' : `Year ${yearOf(option)}`}
                </button>
              ))}
            </div>

            <label className="relative block">
              <span className="sr-only">Search courses</span>
              <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by code, name or lecturer"
                className="h-10 w-full rounded-md border border-line bg-surface pr-3 pl-9 text-ink placeholder:text-ink-faint hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
              />
            </label>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {loading ? (
                <div className="grid place-items-center py-12 text-brand">
                  <Spinner label="Loading courses" className="size-6" />
                </div>
              ) : error ? (
                <p role="alert" className="rounded-md bg-bad-soft px-3 py-3 text-sm text-bad">
                  Courses couldn’t be loaded. Refresh the page to try again.
                </p>
              ) : groups.length === 0 ? (
                <p className="rounded-md border border-dashed border-line px-3 py-8 text-center text-sm text-ink-soft">
                  {courses.length === 0 ? 'No courses have been published for this department yet.' : 'No courses match your filters.'}
                </p>
              ) : (
                <div className="space-y-4 pb-2">
                  {groups.map((group) => (
                    <section key={group.key} aria-label={group.label}>
                      <h3 className="sticky top-0 z-10 bg-canvas pb-1.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">
                        {group.label}
                      </h3>
                      <ul className="space-y-2">
                        {group.courses.map((course) => (
                          <CourseCard
                            key={course.id}
                            course={course}
                            added={myIds.has(course.id)}
                            conflictWith={conflictOf.get(course.id) ?? null}
                            isAdmin={isAdmin}
                            onAdd={() => addCourse(course)}
                            onRemove={() => schedule.remove(course.id)}
                            onEdit={() => setCourseDialog({ mode: 'edit', course })}
                            onDelete={() => setPendingDelete(course)}
                            onPreview={(active) =>
                              setPreviewId((current) => (active ? course.id : current === course.id ? null : current))
                            }
                          />
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />

      {isAdmin ? (
        <>
          <CourseFormDialog
            open={courseDialog.mode !== 'closed'}
            course={courseDialog.mode === 'edit' ? courseDialog.course : null}
            department={department}
            semester={year === 'all' ? 1 : year === 'technical' ? 7 : year}
            category={year === 'technical' ? 'technical' : 'core'}
            onClose={() => setCourseDialog({ mode: 'closed' })}
          />
          <ConfirmDialog
            open={pendingDelete !== null}
            title={`Delete ${pendingDelete ? courseLabel(pendingDelete) : 'course'}?`}
            message={`${pendingDelete?.name ?? 'This course'} will be removed from ${pendingDelete?.department ?? 'the department'} for everyone.`}
            confirmLabel="Delete course"
            tone="danger"
            loading={deleting}
            onConfirm={() => void confirmDelete()}
            onCancel={() => setPendingDelete(null)}
          />
        </>
      ) : null}
    </div>
  );
}
