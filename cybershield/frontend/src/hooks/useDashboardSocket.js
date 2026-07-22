/**
 * useDashboardSocket
 *
 * Maintains a resilient WebSocket connection to  ws://localhost:8000/ws/dashboard
 * with automatic exponential-backoff reconnection.
 *
 * Returns
 * ───────
 *   event          — the latest parsed message payload (null initially)
 *   events         — rolling history of the last `maxHistory` messages
 *   connected      — boolean connection state
 *   clearEvents    — function to empty the events history
 */
import { useEffect, useRef, useState, useCallback } from "react";

const WS_URL = "ws://localhost:8000/ws/dashboard";
const MAX_RETRIES = 8;
const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 30_000;

export default function useDashboardSocket({ maxHistory = 50 } = {}) {
  const [event, setEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef(null);
  const retryRef = useRef(0);
  const timerId = useRef(null);
  const mountedRef = useRef(true);

  const clearEvents = useCallback(() => setEvents([]), []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    // Append JWT token as query-param so the server can scope messages
    const token = localStorage.getItem("token") || "";
    const url = token ? `${WS_URL}?token=${encodeURIComponent(token)}` : WS_URL;

    let ws;
    try {
      ws = new WebSocket(url);
    } catch {
      return; // WebSocket not supported / invalid URL — bail silently
    }

    socketRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      retryRef.current = 0;
      setConnected(true);
    };

    ws.onmessage = (msg) => {
      if (!mountedRef.current) return;
      try {
        const data = JSON.parse(msg.data);
        // Ignore internal control frames
        if (data.event === "connected" || data.event === "pong") return;

        setEvent(data);
        setEvents((prev) => [data, ...prev].slice(0, maxHistory));
      } catch {
        /* malformed frame — ignore */
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnected(false);

      if (retryRef.current >= MAX_RETRIES) return;

      // Exponential back-off: 1s, 2s, 4s … capped at 30s
      const delay = Math.min(BASE_DELAY_MS * 2 ** retryRef.current, MAX_DELAY_MS);
      retryRef.current += 1;
      timerId.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      /* errors always precede a close event — handled above */
    };
  }, [maxHistory]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(timerId.current);
      if (socketRef.current) {
        socketRef.current.onclose = null; // prevent reconnect on intentional unmount
        socketRef.current.close();
      }
    };
  }, [connect]);

  return { event, events, connected, clearEvents };
}
