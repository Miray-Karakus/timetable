import { Check, Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Course } from '../types';
import { sectionLabel } from '../utils/catalog';
import { cn } from '../utils/cn';
import { lecturerFullNames } from '../utils/lecturers';
import { courseColors, formatMeeting } from '../utils/timeUtils';
import { Button } from './Button';

interface CourseCardProps {
  course: Course;
  added: boolean;
  /** Code of a course in the timetable that clashes with this one, if any. */
  conflictWith: string | null;
  isAdmin: boolean;
  onAdd(): void;
  onRemove(): void;
  onEdit(): void;
  onDelete(): void;
  onPreview(active: boolean): void;
}

export function CourseCard({ course, added, conflictWith, isAdmin, onAdd, onRemove, onEdit, onDelete, onPreview }: CourseCardProps) {
  const colors = courseColors(course.code);
  const section = sectionLabel(course.sectionNo);
  const label = section ? `${course.code} ${section.toLowerCase()}` : course.code;
  const lecturers = lecturerFullNames(course.instructorName);
  const facts = [
    `${course.credits} ${course.credits === 1 ? 'credit' : 'credits'}`,
    course.prerequisites ? `Prereq. ${course.prerequisites}` : null,
  ].filter(Boolean);

  return (
    <li
      onMouseEnter={() => onPreview(true)}
      onMouseLeave={() => onPreview(false)}
      onFocus={() => onPreview(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onPreview(false);
      }}
      className={cn(
        'rounded-lg border bg-surface p-3 transition-colors',
        added ? cn('border-l-4', colors.edge, 'border-y-line border-r-line') : 'border-line hover:border-line-strong',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-5">
            <span className="font-bold text-ink">{course.code}</span>
            {section ? <span className="text-ink-faint"> · {section}</span> : null}
          </p>
          <p className="text-[0.9375rem] leading-snug font-medium text-ink">{course.name}</p>
          {lecturers.length > 0 ? (
            <p className="mt-0.5 text-[0.8125rem] leading-snug text-ink-soft">
              {lecturers.length === 1 ? 'Lecturer' : 'Lecturers'}: <span className="text-ink">{lecturers.join(', ')}</span>
            </p>
          ) : null}
          <p className="mt-0.5 text-xs text-ink-soft">{facts.join(' · ')}</p>
        </div>
        {added ? (
          <Button size="sm" variant="secondary" icon={<Minus />} onClick={onRemove} aria-label={`Remove ${label} from my timetable`}>
            Remove
          </Button>
        ) : (
          <Button size="sm" icon={<Plus />} onClick={onAdd} aria-label={`Add ${label} to my timetable`}>
            Add
          </Button>
        )}
      </div>

      {course.meetings.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {course.meetings.map((meeting, index) => (
            <li key={index} className="rounded bg-sunken px-1.5 py-0.5 text-xs text-ink-soft tabular-nums">
              {formatMeeting(meeting)}
              {meeting.room ? ` · ${meeting.room}` : ''}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-ink-faint italic">No class times published for this term.</p>
      )}

      {added ? (
        <p className="mt-2 flex items-center gap-1 text-xs font-medium text-ok">
          <Check aria-hidden="true" className="size-3.5" /> In your timetable
        </p>
      ) : conflictWith ? (
        <p className="mt-2 text-xs font-medium text-bad">Clashes with {conflictWith}</p>
      ) : null}

      {isAdmin ? (
        <div className="mt-3 flex justify-end gap-1 border-t border-line pt-2">
          <Button size="sm" variant="ghost" icon={<Pencil />} onClick={onEdit} aria-label={`Edit ${label}`}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" icon={<Trash2 />} onClick={onDelete} aria-label={`Delete ${label}`} className="text-bad hover:text-bad">
            Delete
          </Button>
        </div>
      ) : null}
    </li>
  );
}
