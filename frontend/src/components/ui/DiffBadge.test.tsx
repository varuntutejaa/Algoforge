import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DiffBadge from './DiffBadge';

describe('DiffBadge', () => {
  it('renders the difficulty label', () => {
    render(<DiffBadge difficulty="Medium" />);
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('applies the easy color class case-insensitively', () => {
    render(<DiffBadge difficulty="easy" />);
    expect(screen.getByText('easy')).toHaveClass('text-green-300');
  });

  it('falls back to a neutral style for an unknown difficulty', () => {
    render(<DiffBadge difficulty="Unknown" />);
    expect(screen.getByText('Unknown')).toHaveClass('text-slate-400');
  });
});
