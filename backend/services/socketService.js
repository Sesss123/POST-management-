const { Server } = require('socket.io');

let io = null;

const init = (server) => {
    io = new Server(server, {
        cors: {
            origin: function (origin, callback) {
                if (!origin) return callback(null, true);
                const allowedOrigins = [
                    process.env.FRONTEND_URL || 'http://localhost:5173',
                    'http://localhost:5174',
                    'http://localhost:5175',
                    'http://127.0.0.1:5173',
                    'http://127.0.0.1:5174',
                    'http://127.0.0.1:5175'
                ];
                const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
                const isRender = origin.endsWith('.onrender.com');
                if (allowedOrigins.indexOf(origin) !== -1 || isLocalhost || isRender) {
                    return callback(null, origin);
                }
                return callback(new Error('CORS blocked'), false);
            },
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

        // Listen for real-time customer alerts (Call Waiter / Request Bill) from QR menu
        socket.on('customer_alert', (data) => {
            // data format: { tableNo, action, shopId }
            if (data && data.shopId) {
                const alertId = Math.random().toString(36).substring(2, 11);
                const alertPayload = {
                    id: alertId,
                    tableNo: data.tableNo || 'N/A',
                    action: data.action, // e.g., 'Call Waiter' or 'Request Bill'
                    shopId: data.shopId,
                    timestamp: new Date().toISOString(),
                    resolved: false
                };
                
                // Broadcast to everyone in the shop room
                io.to(`shop_${data.shopId}`).emit('new_customer_alert', alertPayload);
                console.log(`[Socket] Customer alert broadcast:`, alertPayload);
            }
        });

        // Listen for alert resolution from dashboard/staff
        socket.on('resolve_customer_alert', (data) => {
            // data format: { alertId, shopId }
            if (data && data.shopId && data.alertId) {
                io.to(`shop_${data.shopId}`).emit('customer_alert_resolved', {
                    alertId: data.alertId,
                    shopId: data.shopId
                });
                console.log(`[Socket] Resolved alert ${data.alertId} for shop ${data.shopId}`);
            }
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
