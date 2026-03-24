import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface BudgetAlert {
  type: string;
  category: string;
  spent: number;
  budget: number;
  message: string;
}

export function useWebSocket(email: string | null) {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!email) return;

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';

    const client = new Client({
      webSocketFactory: () => new SockJS(`${apiUrl}/ws`),
      reconnectDelay: 5000,
      onConnect: () => {
        // Convert email to topic-safe string (same as backend)
        const topic = email.replace('@', '_').replace('.', '_');

        client.subscribe(`/topic/alerts/${topic}`, message => {
          const alert: BudgetAlert = JSON.parse(message.body);
          setAlerts(prev => [alert, ...prev]);

          // Auto-dismiss after 8 seconds
          setTimeout(() => {
            setAlerts(prev => prev.filter((_, i) => i !== 0));
          }, 8000);
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [email]);

  const dismissAlert = (index: number) => {
    setAlerts(prev => prev.filter((_, i) => i !== index));
  };

  return { alerts, dismissAlert };
}