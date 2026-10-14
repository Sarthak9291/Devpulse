const {Server} = require('socket.io');
let io;

const initializeSocket = (server, corsOptions) => {
    const origin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173';
    io = new Server(server, {
        cors: corsOptions || {
            origin: origin.includes(',') ? origin.split(',').map(s => s.trim()) : origin,
            credentials: true
        }
    });
    io.on('connection', (socket) => {
        console.log('A user connected: ' + socket.id);
        socket.on('disconnect', () => {
            console.log('User disconnected: ' + socket.id);
        });
    });
};

const getIO = () => {
    if (!io) {
        throw new Error(
            "Socket.io not initialized"
        );
    }

    return io;
};

module.exports = {
    initializeSocket,
    getIO
};