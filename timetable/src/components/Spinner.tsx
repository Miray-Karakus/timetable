import { LoaderCircle } from 'lucide-react';
import { cn } from '../utils/cn';

interface SpinnerProps {
  label?: string;
  className?: string;
  decorative?: boolean;
}

export function Spinner({ label = 'Loading', className, decorative = false }: SpinnerProps) {
  const icon = (
    <LoaderCircle
      aria-hidden="true"
      className={cn('size-5 shrink-0 animate-spin text-current', className)}
    />
  );

  if (decorative) return icon;

  return (
    <span role="status" className="inline-flex items-center">
      {icon}
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function FullPageSpinner() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas text-brand">
      <Spinner label="Loading" className="size-8" />
    </div>
  );
}
