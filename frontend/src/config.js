// Centralized API configuration & Security Headers
// Reads from Vite environment variables or falls back to local FastAPI server
export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
export const CLIENT_API_KEY = import.meta.env.VITE_CLIENT_API_KEY || 'bbc-nlp-secure-frontend-key-2026';

/**
 * Returns standard headers including the frontend verification key
 * to ensure the backend only accepts requests originated from this app.
 */
export const getApiHeaders = (extraHeaders = {}) => ({
  'Content-Type': 'application/json',
  'X-Client-Secret': CLIENT_API_KEY,
  ...extraHeaders
});
