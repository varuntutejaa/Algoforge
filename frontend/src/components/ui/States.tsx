import type { ReactNode } from 'react';

/**
 * Shared loading / empty / error presentation.
 *
 * Skeletons mirror the shape of the content they stand in for, so the layout
 * does not jump when real data arrives. Error states distinguish "the backend
 * is unreachable" from "the request failed", because during a backend outage
 * the first is what users actually hit and a retry is the useful action.
 */

export function Skeleton({ width, height = 14, radius = 6, style }: {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className="af-skeleton"
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

/** Row skeletons shaped like the problems table. */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="af-skeleton-list" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="af-skeleton-row">
          <Skeleton width={18} height={18} radius={999} />
          <Skeleton width={28} />
          <Skeleton width={`${38 + ((i * 7) % 26)}%`} />
          <div className="af-skeleton-tags">
            <Skeleton width={54} height={20} radius={999} />
            <Skeleton width={44} height={20} radius={999} />
          </div>
          <Skeleton width={62} height={22} radius={999} />
        </div>
      ))}
    </div>
  );
}

/** Card skeletons for contest-style lists. */
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="af-skeleton-cards" role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="af-skeleton-card">
          <Skeleton width="45%" height={18} />
          <Skeleton width="72%" />
          <div className="af-skeleton-tags">
            <Skeleton width={80} height={18} radius={999} />
            <Skeleton width={64} height={18} radius={999} />
            <Skeleton width={96} height={18} radius={999} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, hint, action }: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="af-state">
      {icon && <div className="af-state-icon">{icon}</div>}
      <p className="af-state-title">{title}</p>
      {hint && <p className="af-state-hint">{hint}</p>}
      {action && <div className="af-state-action">{action}</div>}
    </div>
  );
}

/**
 * `fetch` rejects with a TypeError ("Failed to fetch") for DNS failures, CORS
 * rejections and connection refusals alike — which is exactly what a sleeping
 * or degraded backend looks like from the browser.
 */
export function isNetworkError(message?: string) {
  if (!message) return false;
  const m = message.toLowerCase();
  return m.includes('failed to fetch') || m.includes('networkerror') || m.includes('load failed');
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const offline = isNetworkError(message);
  return (
    <div className="af-state af-state-error">
      <div className="af-state-icon af-state-icon-error">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5" strokeLinecap="round" />
          <circle cx="12" cy="16.5" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      </div>
      <p className="af-state-title">
        {offline ? "Can't reach the server" : 'Something went wrong'}
      </p>
      <p className="af-state-hint">
        {offline
          ? 'The backend may be starting up — free hosting sleeps when idle and can take up to a minute to wake.'
          : message}
      </p>
      {onRetry && (
        <div className="af-state-action">
          <button type="button" className="af-retry-btn" onClick={onRetry}>Try again</button>
        </div>
      )}
    </div>
  );
}
