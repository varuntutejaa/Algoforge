import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from './ConfirmDialog';

function setup(overrides: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmDialog
      open
      title="End this contest now?"
      message="This can't be undone."
      confirmLabel="End Contest"
      danger
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />,
  );
  return { onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
  it('renders nothing while closed', () => {
    setup({ open: false });
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('starts with focus on Cancel, so a reflexive Enter does not confirm', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('confirms only through the confirm button', () => {
    const { onConfirm, onCancel } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'End Contest' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('cancels on Escape', () => {
    const { onCancel } = setup();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('cannot be dismissed or confirmed again while busy', () => {
    const { onConfirm, onCancel } = setup({ busy: true });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Working…' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Working…' }));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('shows an error from a failed attempt', () => {
    setup({ error: 'Only the person who created this contest can end it' });
    expect(screen.getByRole('alert')).toHaveTextContent('Only the person who created this contest can end it');
  });
});
