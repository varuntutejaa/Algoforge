import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// The gate reads auth state through the context hook; stubbing the hook keeps
// these tests about routing policy rather than about Firebase.
const mockAuth = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuth.value,
}));

function renderAt(path = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<p>private page</p>} />
        </Route>
        <Route path="/login" element={<p>login page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => { mockAuth.value = {}; });

  it('waits instead of redirecting while the session is still being restored', () => {
    // This is the session-persistence bug: redirecting on a not-yet-known
    // session bounces a signed-in user to /login on every reload.
    mockAuth.value = { idToken: null, user: null, loading: true };
    renderAt();
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
    expect(screen.queryByText('private page')).not.toBeInTheDocument();
  });

  it('redirects to login once loading finishes with no session', () => {
    mockAuth.value = { idToken: null, user: null, loading: false };
    renderAt();
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('renders the route for a signed-in user', () => {
    mockAuth.value = { idToken: 'token', user: { id: 'u1' }, loading: false };
    renderAt();
    expect(screen.getByText('private page')).toBeInTheDocument();
  });

  it('renders a restored session that has a user but no fresh token yet', () => {
    // On the first paint after a reload the cached user is known before the
    // refreshed token arrives; that must not count as signed out.
    mockAuth.value = { idToken: null, user: { id: 'u1' }, loading: false };
    renderAt();
    expect(screen.getByText('private page')).toBeInTheDocument();
  });
});
