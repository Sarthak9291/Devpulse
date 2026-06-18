require('dotenv').config();
const express= require('express');
const http=require('http');
const app = express();
const server=http.createServer(app);
const authmiddleware = require('./src/middleware/authMiddleware');
const orgRoute = require('./src/routes/orgRoute');
const healthRoute = require('./src/routes/healthRoute');
const authRoute = require('./src/routes/authRoute');
const repoRoute = require('./src/routes/repoRoute');
const githubRoute = require('./src/routes/githubRoute');
const webhookRoute = require('./src/routes/webhookRoute');
const activityRoute = require('./src/routes/activityRoute');
const metricsRoute = require('./src/routes/metricsRoute');
const dashboardRoute = require('./src/routes/dashboardRoute');
const { startListeners } = require('./src/pubsub/listeners');
const {initializeSocket} = require('./src/socket/socket');


initializeSocket(server);
startListeners().then(() => {
    console.log("Pub/Sub listeners started successfully")
    }).catch((err) => {
        console.error("Error starting Pub/Sub listeners:", err);
});

app.use(express.json());

app.use('/', healthRoute);
app.use('/auth', authRoute);
app.use('/orgs', authmiddleware, orgRoute);
app.use('/repos', authmiddleware, repoRoute);
app.use('/webhooks', webhookRoute);
app.use('/activities', activityRoute);
app.use('/metrics', metricsRoute);
app.use('/dashboard', dashboardRoute);
app.use('/github', githubRoute);

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});