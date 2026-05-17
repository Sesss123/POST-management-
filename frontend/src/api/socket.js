import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;

export const initSocket = (shopId) => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            console.log('Connected to real-time server');
            if (shopId) {
                socket.emit('join_shop', shopId);
            }
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from real-time server');
        });
    }
    return socket;
};

export const getSocket = () => {
    if (!socket) {
        console.warn('Socket not initialized. Call initSocket first.');
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
