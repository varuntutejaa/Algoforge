import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive. */
  danger?: boolean;
  /** While true the buttons are disabled and the dialog can't be dismissed. */
  busy?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * An in-page confirmation, used instead of window.confirm(). It matches the
 * app and leaves focus on Cancel, so pressing Enter by reflex doesn't confirm
 * a destructive action. Escape and a click on the backdrop both cancel.
 */
export default function ConfirmDialog({
  open, title, message, confirmLabel, cancelLabel = 'Cancel',
  danger = false, busy = false, error, onConfirm, onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="af-dialog-backdrop" onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}>
      <div className="af-dialog" role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className="af-dialog-title">{title}</h2>
        <div className="af-dialog-body">{message}</div>
        {error && <p className="af-dialog-error" role="alert">{error}</p>}
        <div className="af-dialog-actions">
          <button ref={cancelRef} type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
