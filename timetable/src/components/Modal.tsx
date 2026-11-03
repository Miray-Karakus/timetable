import { useEffect, useId, useRef } from 'react';
import type { MouseEvent, ReactNode, SyntheticEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

export interface ModalProps {
  open: boolean;
  onClose(): void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  md: 'max-w-lg',
  lg: 'max-w-3xl',
};

function openDialog(dialog: HTMLDialogElement) {
  if (dialog.open) return;
  if (typeof dialog.showModal === 'function') {
    dialog.showModal();
  } else {
    dialog.setAttribute('open', '');
  }
}

function closeDialog(dialog: HTMLDialogElement) {
  if (!dialog.open) return;
  if (typeof dialog.close === 'function') {
    dialog.close();
  } else {
    dialog.removeAttribute('open');
  }
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressStartedOnBackdrop = useRef(false);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      openDialog(dialog);
    } else {
      closeDialog(dialog);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onClose();
  };

  const handleNativeClose = () => {
    if (open) onClose();
  };

  const handleMouseDown = (event: MouseEvent<HTMLDialogElement>) => {
    pressStartedOnBackdrop.current = event.target === event.currentTarget;
  };

  const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
    const clickedBackdrop = event.target === event.currentTarget && pressStartedOnBackdrop.current;
    pressStartedOnBackdrop.current = false;
    if (clickedBackdrop) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={handleCancel}
      onClose={handleNativeClose}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      className={cn(
        'm-auto w-[calc(100%-2rem)] overflow-hidden rounded-lg border border-line bg-surface p-0 text-ink shadow-pop',
        'max-h-[calc(100dvh-2rem)] open:flex open:flex-col',
        sizeClasses[size],
      )}
    >
      {open ? (
        <div className="flex max-h-[inherit] min-h-0 flex-1 flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <h2 id={titleId} className="text-lg leading-snug font-semibold text-ink">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-m-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-ink-soft hover:bg-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <X aria-hidden="true" className="size-[1.125rem]" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer ? (
            <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-sunken/50 px-5 py-3">
              {footer}
            </footer>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
