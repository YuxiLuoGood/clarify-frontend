import { useCallback, useEffect, useRef, useState } from 'react';
import { WS_URL } from '../config';
import type { BudgetAlertMessage } from '../types';

export interface BudgetAlert extends BudgetAlertMessage {
  id: number;
}

const RECONNECT_DELAY_MS = 5_000;
const AUTO_DISMISS_MS = 8_000;
/** Server closes with this code when the token is rejected — retrying won't help. */
const CLOSE_UNAUTHORIZED = 4401;

function isBudgetAlert(data: unknown): data is BudgetAlertMessage {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    d.type === 'BUDGET_EXCEEDED' &&
    typeof d.category === 'string' &&
    typeof d.message === 'string' &&
    typeof d.spent === 'number' &&
    typeof d.budget === 'number'
  );
}

/**
 * Connects to the backend's /ws endpoint while signed in and collects budget
 * alerts. Protocol: send {"type":"auth","token"} once open; the server then
 * pushes BUDGET_EXCEEDED messages for this user only.
 */
export function useBudgetAlerts(token: string | null) {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, number>());

  const dismissAlert = useCallback((id: number) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setAlerts([]);
      return;
    }

    let socket: WebSocket | null = null;
    let retryTimer: number | undefined;
    let stopped = false;

    const connect = () => {
      const ws = new WebSocket(WS_URL);
      socket = ws;

      ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', token }));

      ws.onmessage = event => {
        let data: unknown;
        try {
          data = JSON.parse(String(event.data));
        } catch {
          return;
        }
        if (!isBudgetAlert(data)) return; // e.g. the AUTH_OK handshake reply

        const id = ++nextId.current;
        setAlerts(prev => [{ ...data, id }, ...prev]);
        timers.current.set(id, window.setTimeout(() => dismissAlert(id), AUTO_DISMISS_MS));
      };

      ws.onclose = event => {
        if (stopped || event.code === CLOSE_UNAUTHORIZED) return;
        retryTimer = window.setTimeout(connect, RECONNECT_DELAY_MS);
      };
    };

    connect();

    return () => {
      stopped = true;
      window.clearTimeout(retryTimer);
      socket?.close();
    };
  }, [token, dismissAlert]);

  // Cancel pending auto-dismiss timers on unmount.
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(timer => window.clearTimeout(timer));
  }, []);

  return { alerts, dismissAlert };
}
