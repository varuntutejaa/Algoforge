import { describe, it, expect, vi, beforeEach } from 'vitest';
// fireEvent rather than user-event: the library is already a dependency and a
// plain click is all these assertions need.
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useRequireAuth } from './useRequireAuth';

const mockAuth = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
const toastError = vi.hoisted(() => vi.fn());

vi.mock('@/context/AuthContext', () => ({ useAuth: () => mockAuth.value }));
vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ error: toastError, success: vi.fn() }) }));

function Action() {
  const { require: requireAuth, signedIn } = useRequireAuth();
  return (
    <>
      <span>state: {signedIn ? 'in' : 'out'}</span>
      <button onClick={() => requireAuth('Sign in to run your code.')}>Run</button>
    </>
  );
}

function renderAt(path = '/editor/two-sum') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/editor/:id" element={<Action />} />
        <Route path="/login" element={<p>login page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('useRequireAuth', () => {
  beforeEach(() => { toastError.mockClear(); mockAuth.value = {}; });

  it('sends a signed-out user to login with a message', () => {
    mockAuth.value = { idToken: null, user: null };
    renderAt();
    fireEvent.click(screen.getByText('Run'));
    expect(toastError).toHaveBeenCalledWith('Sign in to run your code.');
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('lets a signed-in user through without redirecting', () => {
    mockAuth.value = { idToken: 'token', user: { id: 'u1' } };
    renderAt();
    fireEvent.click(screen.getByText('Run'));
    expect(toastError).not.toHaveBeenCalled();
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
  });

  it('treats a restored session with no fresh token as signed in', () => {
    // Otherwise every action would be locked for a moment after a reload.
    mockAuth.value = { idToken: null, user: { id: 'u1' } };
    renderAt();
    expect(screen.getByText('state: in')).toBeInTheDocument();
  });
});
