import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import Avatar from './Avatar';

describe('Avatar', () => {
  it('shows the picture without sending a referrer', () => {
    const { container } = render(<Avatar name="Alice" src="https://example.test/a.png" />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'https://example.test/a.png');
    // Google's avatar CDN can refuse requests that carry a Referer.
    expect(img).toHaveAttribute('referrerpolicy', 'no-referrer');
  });

  it('falls back to the initial when there is no picture', () => {
    const { container } = render(<Avatar name="bob" />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toBe('B');
  });

  it('falls back to the initial when the picture fails to load', () => {
    const { container } = render(<Avatar name="Carol" src="https://example.test/expired.png" />);
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toBe('C');
  });
});
