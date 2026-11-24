// Centralized API configuration
// Reads from Vite environment variable (VITE_API_URL) or falls back to local FastAPI server
export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
