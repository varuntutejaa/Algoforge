import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import OnboardingGate from './OnboardingGate';

const mockAuth = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => mockAuth.value }));

function Where() {
  const { pathname, state } = useLocation();
  return <p>at {pathname} from {(state as { from?: string } | null)?.from ?? '-'}</p>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <OnboardingGate />
      <Routes><Route path="*" element={<Where />} /></Routes>
    </MemoryRouter>,
  );
}

const user = (username: string) => ({ id: '1', uid: 'u', name: 'Ada', email: 'a@x', photoURL: '', firstName: '', lastName: '', username });

describe('OnboardingGate', () => {
  beforeEach(() => { mockAuth.value = {}; });

  it('sends a signed-in person without a username to the welcome step, remembering where they were', () => {
    mockAuth.value = { user: user(''), profileSynced: true };
    renderAt('/contests?tab=my');
    expect(screen.getByText('at /welcome from /contests?tab=my')).toBeInTheDocument();
  });

  it('waits for the profile to be read before deciding', () => {
    // A session stored before usernames existed has none locally.
    mockAuth.value = { user: user(''), profileSynced: false };
    renderAt('/problems');
    expect(screen.getByText('at /problems from -')).toBeInTheDocument();
  });

  it('leaves people with a username, and signed-out visitors, alone', () => {
    mockAuth.value = { user: user('ada'), profileSynced: true };
    renderAt('/problems');
    expect(screen.getByText('at /problems from -')).toBeInTheDocument();
  });

  it('does not bounce people off the sign-in pages', () => {
    mockAuth.value = { user: user(''), profileSynced: true };
    renderAt('/login');
    expect(screen.getByText('at /login from -')).toBeInTheDocument();
  });
});
