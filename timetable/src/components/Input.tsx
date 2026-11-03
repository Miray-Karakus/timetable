import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

interface FieldMessageProps {
  label: string;
  error?: string;
  hint?: string;
}

export type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldMessageProps;

export interface SelectOption {
  value: string;
  label: string;
}

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & FieldMessageProps & {
  options: SelectOption[];
};

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldMessageProps;

const controlBase = [
  'w-full rounded-md border bg-surface text-ink placeholder:text-ink-faint',
  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand',
  'disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-faint',
].join(' ');

function borderClass(hasError: boolean): string {
  return hasError ? 'border-bad' : 'border-line hover:border-line-strong';
}

function useFieldIds(explicitId: string | undefined) {
  const generatedId = useId();
  const id = explicitId ?? generatedId;
  return { id, hintId: `${id}-hint`, errorId: `${id}-error` };
}

function describedBy(
  ids: { hintId: string; errorId: string },
  hint: string | undefined,
  error: string | undefined,
  external: string | undefined,
): string | undefined {
  const parts = [external, hint ? ids.hintId : undefined, error ? ids.errorId : undefined].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length > 0 ? parts.join(' ') : undefined;
}

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  hintId: string;
  errorId: string;
  className?: string;
  children: ReactNode;
}

function FieldShell({ id, label, hint, error, hintId, errorId, className, children }: FieldShellProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p id={hintId} className="text-xs text-ink-soft">
          {hint}
        </p>
      ) : null}
      {hint && error ? (
        <p id={hintId} className="sr-only">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs font-medium text-bad">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id: explicitId, className, 'aria-describedby': ariaDescribedBy, ...rest },
  ref,
) {
  const ids = useFieldIds(explicitId);
  return (
    <FieldShell id={ids.id} label={label} hint={hint} error={error} hintId={ids.hintId} errorId={ids.errorId} className={className}>
      <input
        ref={ref}
        id={ids.id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(ids, hint, error, ariaDescribedBy)}
        className={cn(controlBase, borderClass(Boolean(error)), 'h-10 px-3')}
        {...rest}
      />
    </FieldShell>
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, options, id: explicitId, className, 'aria-describedby': ariaDescribedBy, ...rest },
  ref,
) {
  const ids = useFieldIds(explicitId);
  return (
    <FieldShell id={ids.id} label={label} hint={hint} error={error} hintId={ids.hintId} errorId={ids.errorId} className={className}>
      <div className="relative">
        <select
          ref={ref}
          id={ids.id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(ids, hint, error, ariaDescribedBy)}
          className={cn(controlBase, borderClass(Boolean(error)), 'h-10 appearance-none pr-9 pl-3')}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-soft"
        />
      </div>
    </FieldShell>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, id: explicitId, className, rows = 4, 'aria-describedby': ariaDescribedBy, ...rest },
  ref,
) {
  const ids = useFieldIds(explicitId);
  return (
    <FieldShell id={ids.id} label={label} hint={hint} error={error} hintId={ids.hintId} errorId={ids.errorId} className={className}>
      <textarea
        ref={ref}
        id={ids.id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(ids, hint, error, ariaDescribedBy)}
        className={cn(controlBase, borderClass(Boolean(error)), 'min-h-20 resize-y px-3 py-2 leading-relaxed')}
        {...rest}
      />
    </FieldShell>
  );
});
