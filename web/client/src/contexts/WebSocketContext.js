import React, { createContext, useContext, useEffect, useState } from 'react';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
    const [ws, setWs] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const connectWebSocket = () => {
            const websocket = new WebSocket('ws://localhost:8080');

            websocket.onopen = () => {
                console.log('WebSocket bağlantısı kuruldu');
                setIsConnected(true);
            };

            websocket.onclose = () => {
                console.log('WebSocket bağlantısı kapandı');
                setIsConnected(false);
                // 5 saniye sonra yeniden bağlanmayı dene
                setTimeout(connectWebSocket, 5000);
            };

            websocket.onerror = (error) => {
                console.error('WebSocket hatası:', error);
            };

            websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('WebSocket mesajı alındı:', data);
                } catch (error) {
                    console.error('WebSocket mesaj işleme hatası:', error);
                }
            };

            setWs(websocket);
        };

        connectWebSocket();

        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, []);

    const sendMessage = (message) => {
        if (ws && isConnected) {
            ws.send(JSON.stringify(message));
        } else {
            console.error('WebSocket bağlantısı yok!');
        }
    };

    return (
        <WebSocketContext.Provider value={{ isConnected, sendMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
}; 