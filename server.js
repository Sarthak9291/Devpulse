require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

// Enable trust proxy for reverse proxies (Render, Railway, Heroku, Cloudflare, AWS ALB)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
}));

// Run BullMQ worker inside the web server process by default,
// or disable with RUN_WORKER=false if running dedicated worker processes.
if (process.env.RUN_WORKER !== 'false') {
    require('./src/workers/webhookWorker');
}

const authmiddleware = require('./src/middleware/authMiddleware');
const errorHandler = require('./src/middleware/errorhandler');
const orgRoute = require('./src/routes/orgRoute');
const healthRoute = require('./src/routes/healthRoute');
const authRoute = require('./src/routes/authRoute');
const repoRoute = require('./src/routes/repoRoute');
const githubRoute = require('./src/routes/githubRoute');
const webhookRoute = require('./src/routes/webhookRoute');
const activityRoute = require('./src/routes/activityRoute');
const metricsRoute = require('./src/routes/metricsRoute');
const dashboardRoute = require('./src/routes/dashboardRoute');
const doraRoute = require('./src/routes/doraRoute');
const prRoute = require('./src/routes/prAnalyticsRoute');
const queueRoute = require('./src/routes/queueRoute');
const aiRoute = require('./src/routes/aiRoute');
const rateLimiter = require('./src/middleware/rateLimiter');
const { startListeners } = require('./src/pubsub/listeners');
const { initializeSocket } = require('./src/socket/socket');
const prisma = require('./src/config/prisma');
const redisConnection = require('./src/config/redis');

const allowedOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173';
const origins = allowedOrigin.includes(',') 
    ? allowedOrigin.split(',').map(s => s.trim()) 
    : allowedOrigin;

const corsOptions = {
    origin: origins,
    credentials: true
};

initializeSocket(server, corsOptions);

startListeners().then(() => {
    console.log("Pub/Sub listeners started successfully");
}).catch((err) => {
    console.error("Error starting Pub/Sub listeners:", err);
});

app.use(cors(corsOptions));

// Health check before rate limiter and JSON parser for fast container probes
app.use('/', healthRoute);

// Webhook endpoint needs raw body for HMAC signature verification
app.use('/webhooks', webhookRoute);

// Standard JSON body parser
app.use(express.json());

// Apply sliding-window rate limiter to standard API endpoints
app.use(rateLimiter(100, 60));

app.use('/auth', authRoute);
app.use('/orgs', authmiddleware, orgRoute);
app.use('/repos', authmiddleware, repoRoute);
app.use('/activities', authmiddleware, activityRoute);
app.use('/metrics', authmiddleware, metricsRoute);
app.use('/dashboard', authmiddleware, dashboardRoute);
app.use('/github', githubRoute);
app.use('/dora', authmiddleware, doraRoute);
app.use('/pr', authmiddleware, prRoute);
app.use('/queues', authmiddleware, queueRoute);
app.use('/ai', authmiddleware, aiRoute);

// Serve frontend build if present (for single-service deployment)
const frontendDist = path.join(__dirname, 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get(/^(?!\/api|\/auth|\/webhooks|\/github|\/health).*/, (req, res, next) => {
        if (req.path.startsWith('/api') ||
            req.path.startsWith('/auth') ||
            req.path.startsWith('/webhooks') ||
            req.path.startsWith('/github') ||
            req.path === '/health') {
            return next();
        }
        res.sendFile(path.join(frontendDist, 'index.html'));
    });
}

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
    }
    throw err;
});

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Draining connections and shutting down...`);
    server.close(async () => {
        console.log('HTTP and WebSocket servers closed.');
        try {
            await prisma.$disconnect();
            console.log('Database connection pool drained.');
            if (redisConnection && redisConnection.quit) {
                await redisConnection.quit();
                console.log('Redis client disconnected.');
            }
        } catch (err) {
            console.error('Error during graceful shutdown:', err.message);
        }
        process.exit(0);
    });

    setTimeout(() => {
        console.error('Forced shutdown due to timeout.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));