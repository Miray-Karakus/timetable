import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray } from 'react-hook-form';
import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import { DAY_VALUES, MAX_MEETINGS, SESSION_TYPE_VALUES, emptyMeeting } from '../utils/courseForm';
import type { CourseFormInput } from '../utils/courseForm';
import { DAY_LABELS, SESSION_LABELS } from '../utils/timeUtils';
import { Button } from './Button';
import { Input, Select } from './Input';

const DAY_OPTIONS = DAY_VALUES.map((day) => ({ value: day, label: DAY_LABELS[day].long }));
const TYPE_OPTIONS = SESSION_TYPE_VALUES.map((type) => ({ value: type, label: SESSION_LABELS[type] }));

interface MeetingsEditorProps {
  control: Control<CourseFormInput>;
  register: UseFormRegister<CourseFormInput>;
  errors: FieldErrors<CourseFormInput>;
}

export function MeetingsEditor({ control, register, errors }: MeetingsEditorProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'meetings' });
  const listError = errors.meetings?.message ?? errors.meetings?.root?.message;

  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-sm font-semibold text-ink">Weekly meetings</legend>
      <p className="text-xs text-ink-soft">Use 24-hour times. Meetings of the same course can’t overlap.</p>

      {fields.length === 0 ? (
        <p className="rounded-md border border-dashed border-line px-3 py-4 text-center text-sm text-ink-soft">
          No meetings yet. Add the first one.
        </p>
      ) : (
        <ol className="space-y-3">
          {fields.map((field, index) => {
            const rowErrors = errors.meetings?.[index];
            return (
              <li key={field.id} className="rounded-md border border-line bg-sunken/40 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink">Meeting {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 />}
                    onClick={() => remove(index)}
                    aria-label={`Remove meeting ${index + 1}`}
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
                  <Select label="Day" options={DAY_OPTIONS} error={rowErrors?.day?.message} {...register(`meetings.${index}.day`)} />
                  <Input label="Start" type="time" className="tabular-nums" error={rowErrors?.start?.message} {...register(`meetings.${index}.start`)} />
                  <Input label="End" type="time" className="tabular-nums" error={rowErrors?.end?.message} {...register(`meetings.${index}.end`)} />
                  <Input label="Room" placeholder="B-204" error={rowErrors?.room?.message} {...register(`meetings.${index}.room`)} />
                  <Select
                    label="Type"
                    options={TYPE_OPTIONS}
                    className="col-span-2 sm:col-span-1"
                    error={rowErrors?.type?.message}
                    {...register(`meetings.${index}.type`)}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {listError ? (
        <p role="alert" className="text-xs font-medium text-bad">
          {listError}
        </p>
      ) : null}

      <Button variant="secondary" size="sm" icon={<Plus />} disabled={fields.length >= MAX_MEETINGS} onClick={() => append(emptyMeeting())}>
        Add meeting
      </Button>
    </fieldset>
  );
}
