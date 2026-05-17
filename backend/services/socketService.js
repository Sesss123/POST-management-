const { Server } = require('socket.io');

let io = null;

const init = (server) => {
    io = new Server(server, {
        cors: {
            origin: [
                process.env.FRONTEND_URL || 'http://localhost:5173',
                'http://localhost:5174',
                'http://localhost:5175',
                'http://127.0.0.1:5173'
            ],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Shop rooms: Clients can join a room specific to their shop_id
        socket.on('join_shop', (shopId) => {
            if (shopId) {
                const roomName = `shop_${shopId}`;
                socket.join(roomName);
                console.log(`Socket ${socket.id} joined room: ${roomName}`);
            }
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

/**
 * Emit an event to all clients in a specific shop's room
 */
const emitToShop = (shopId, event, data) => {
    if (io && shopId) {
        io.to(`shop_${shopId}`).emit(event, data);
    }
};

/**
 * Emit a global broadcast to all connected clients
 */
const emitGlobal = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};

module.exports = {
    init,
    getIo,
    emitToShop,
    emitGlobal
};
