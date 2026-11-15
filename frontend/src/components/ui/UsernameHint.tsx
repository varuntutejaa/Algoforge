import type { UsernameStatus } from '@/hooks/useUsernameCheck';

/** The line under a username field: rules, checking, available, or why not. */
export default function UsernameHint({ id, status, serverError }: { id: string; status: UsernameStatus; serverError?: string }) {
  if (serverError) return <p id={id} className="field-error">{serverError}</p>;
  switch (status.state) {
    case 'invalid':
    case 'taken':
    case 'error':
      return <p id={id} className="field-error">{status.message}</p>;
    case 'checking':
      return <p id={id} className="field-hint">Checking availability…</p>;
    case 'available':
      return <p id={id} className="field-hint field-hint-ok">✓ Available</p>;
    case 'unchanged':
      return <p id={id} className="field-hint">This is your current username.</p>;
    default:
      return <p id={id} className="field-hint">3–20 characters: letters, numbers and underscores, starting with a letter.</p>;
  }
}
