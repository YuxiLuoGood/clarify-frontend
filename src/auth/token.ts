const STORAGE_KEY = 'token';

export const getToken = () => localStorage.getItem(STORAGE_KEY);
export const saveToken = (token: string) => localStorage.setItem(STORAGE_KEY, token);
export const clearToken = () => localStorage.removeItem(STORAGE_KEY);

interface JwtPayload {
  sub?: string;
  exp?: number;
}

/** Decode (not verify) a JWT payload. JWTs are base64url, which plain atob rejects. */
export function decodeToken(token: string): JwtPayload | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as JwtPayload;
  } catch {
    return null;
  }
}

/** True if the token is present, well-formed and not expired. */
export function isTokenUsable(token: string | null): token is string {
  if (!token) return false;
  const payload = decodeToken(token);
  if (!payload?.sub) return false;
  return payload.exp === undefined || payload.exp * 1000 > Date.now();
}
