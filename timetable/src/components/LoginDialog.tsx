import { useId, useState, type FormEvent } from 'react';
import { useAuth } from '../context/useAuth';
import { Button } from './Button';
import { Input } from './Input';
import { Modal } from './Modal';

interface LoginDialogProps {
  open: boolean;
  onClose(): void;
}

function loginErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Email or password is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'No connection. Check your network and try again.';
    default:
      return 'Sign-in failed. Try again.';
  }
}

export function LoginDialog({ open, onClose }: LoginDialogProps) {
  const { signIn } = useAuth();
  const formId = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    if (submitting) return;
    setPassword('');
    setError(null);
    onClose();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      setPassword('');
      onClose();
    } catch (err) {
      setError(loginErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Admin sign in"
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={submitting}>
            Sign in
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={submit} className="space-y-4">
        <Input label="Email" type="email" autoComplete="username" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? (
          <p role="alert" className="rounded-md bg-bad-soft px-3 py-2 text-sm font-medium text-bad">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
