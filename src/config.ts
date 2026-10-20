/** Runtime configuration, resolved from Vite env vars at build time. */
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '');

/** http://host → ws://host/ws, https://host → wss://host/ws */
export const WS_URL = `${API_URL.replace(/^http/, 'ws')}/ws`;

/** Empty string hides the Google button instead of crashing the login page. */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
