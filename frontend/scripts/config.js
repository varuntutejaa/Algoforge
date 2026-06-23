/**
 * Centralized API configuration for AlgoForge.
 * All fetch() calls should use API_BASE_URL to build endpoint URLs.
 */
// eslint-disable-next-line no-unused-vars
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? "http://localhost:8000"
  : "https://algoforge-1-mbk5.onrender.com";
