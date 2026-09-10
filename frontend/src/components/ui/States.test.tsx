import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState, EmptyState, TableSkeleton, isNetworkError } from './States';

describe('isNetworkError', () => {
  it('recognizes the browser fetch failure shapes', () => {
    // Chrome, Firefox and Safari each word this differently.
    expect(isNetworkError('Failed to fetch')).toBe(true);
    expect(isNetworkError('NetworkError when attempting to fetch resource.')).toBe(true);
    expect(isNetworkError('Load failed')).toBe(true);
  });

  it('does not treat application errors as network errors', () => {
    expect(isNetworkError('Problem not found')).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
  });
});

describe('ErrorState', () => {
  it('explains a cold backend when the request never reached the server', () => {
    render(<ErrorState message="Failed to fetch" />);
    expect(screen.getByText("Can't reach the server")).toBeInTheDocument();
    expect(screen.getByText(/sleeps when idle/i)).toBeInTheDocument();
  });

  it('surfaces the real message for application errors', () => {
    render(<ErrorState message="Contest not found" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Contest not found')).toBeInTheDocument();
  });

  it('invokes the retry handler', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Failed to fetch" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('omits the retry affordance when no handler is given', () => {
    render(<ErrorState message="Failed to fetch" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('EmptyState', () => {
  it('renders the title, hint and action', () => {
    render(
      <EmptyState
        title="No contests"
        hint="Create one to get started."
        action={<button>Create</button>}
      />
    );
    expect(screen.getByText('No contests')).toBeInTheDocument();
    expect(screen.getByText('Create one to get started.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });
});

describe('TableSkeleton', () => {
  it('announces itself to assistive tech while loading', () => {
    render(<TableSkeleton rows={3} />);
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });
});
