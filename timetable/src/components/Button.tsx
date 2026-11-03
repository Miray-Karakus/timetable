import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { cn } from '../utils/cn';
import { Spinner } from './Spinner';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-on-brand hover:bg-brand-strong border border-transparent',
  secondary: 'bg-surface text-ink border border-line hover:bg-sunken hover:border-line-strong',
  ghost: 'bg-transparent text-ink-soft border border-transparent hover:bg-sunken hover:text-ink',
  danger: 'bg-bad text-surface border border-transparent hover:bg-bad/90',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-sm',
  md: 'h-10 gap-2 px-4 text-[0.9375rem]',
};

const iconSizeClasses: Record<ButtonSize, string> = {
  sm: '[&_svg]:size-4',
  md: '[&_svg]:size-[1.125rem]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  type = 'button',
  disabled,
  className,
  children,
  ref,
  ...rest
}: ButtonProps) {
  const isDisabled = Boolean(disabled) || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-md font-medium',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        'disabled:cursor-not-allowed disabled:opacity-55',
        variantClasses[variant],
        sizeClasses[size],
        iconSizeClasses[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner decorative /> : icon ? <span aria-hidden="true" className="inline-flex">{icon}</span> : null}
      {children}
    </button>
  );
}
