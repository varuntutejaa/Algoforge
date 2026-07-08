/** Central API base URL — switches between local dev and production automatically. */
export const API_BASE_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : 'https://d2idsoe6r56jkw.cloudfront.net';
