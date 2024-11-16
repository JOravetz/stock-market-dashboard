import { useState, useEffect, useCallback } from 'react';

export const useWebSocket = (url) => {
  const [ws, setWs] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  const connect = useCallback(() => {
    const websocket = new WebSocket(url);

    websocket.onmessage = (event) => {
      setLastMessage(event.data);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after 1 second
      setTimeout(() => {
        setReconnectCount(prev => prev + 1);
      }, 1000);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [url]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect, reconnectCount]);

  const sendMessage = useCallback((message) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }, [ws]);

  return {
    lastMessage,
    sendMessage,
    ready: ws?.readyState === WebSocket.OPEN
  };
};
