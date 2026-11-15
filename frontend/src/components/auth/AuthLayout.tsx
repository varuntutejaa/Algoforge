import type { ReactNode } from 'react';
import AuthShowcase from './AuthShowcase';

/** Sign-in and sign-up: the product on the left (about 70%), the form on the right. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-split">
      <AuthShowcase />
      <section className="auth-form-side">
        {children}
      </section>
    </main>
  );
}
