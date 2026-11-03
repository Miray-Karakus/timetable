import type { ReactNode } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  loading?: boolean;
  onConfirm(): void;
  onCancel(): void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const handleClose = () => {
    if (!loading) onCancel();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-ink-soft">{message}</div>
    </Modal>
  );
}
