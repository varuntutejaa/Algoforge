/**
 * Central API base URL — switches between local dev and production automatically.
 * Set VITE_API_URL to point a local build at a backend on another port (for
 * example when something else already holds :8000).
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : 'https://algoforge-api.vercel.app');
