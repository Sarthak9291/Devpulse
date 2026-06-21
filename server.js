require('dotenv').config();
const express= require('express');
const http=require('http');
const cors = require('cors');
const app = express();
const server=http.createServer(app);
require('./src/workers/webhookWorker');
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
const { startListeners } = require('./src/pubsub/listeners');
const {initializeSocket} = require('./src/socket/socket');


initializeSocket(server);
startListeners().then(() => {
    console.log("Pub/Sub listeners started successfully")
    }).catch((err) => {
        console.error("Error starting Pub/Sub listeners:", err);
});

const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
};

const rateLimiter = require('./src/middleware/rateLimiter');

app.use(cors(corsOptions));
app.use(rateLimiter(100, 60));
app.use('/webhooks', webhookRoute);
app.use(express.json());

app.use('/', healthRoute);
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