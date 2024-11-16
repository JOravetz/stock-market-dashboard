import { useState, useEffect, useCallback, useRef } from 'react';

export const useWebSocket = (url) => {
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectCountRef = useRef(0);

  const connect = useCallback(() => {
    try {
      const websocket = new WebSocket(url);
      wsRef.current = websocket;

      websocket.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        reconnectCountRef.current = 0;
      };

      websocket.onmessage = (event) => {
        setLastMessage(event.data);
      };

      websocket.onclose = () => {
        setConnectionStatus('disconnected');
        // Implement exponential backoff for reconnection
        const timeout = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30000);
        console.log(`WebSocket disconnected. Reconnecting in ${timeout/1000}s...`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectCountRef.current += 1;
          connect();
        }, timeout);
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
      setConnectionStatus('error');
    }
  }, [url]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    }
  }, []);

  return {
    lastMessage,
    sendMessage,
    connectionStatus,
    isConnected: connectionStatus === 'connected'
  };
};
