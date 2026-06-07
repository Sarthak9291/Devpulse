require('dotenv').config();
const authmiddleware = require('./src/middleware/authMiddleware');
const express= require('express');
const app = express();
const orgRoute = require('./src/routes/orgRoute');
const healthRoute = require('./src/routes/healthRoute');
const authRoute = require('./src/routes/authRoute');
const repoRoute = require('./src/routes/repoRoute');
const githubRoute = require('./src/routes/githubRoute');
app.use(express.json());
app.use('/', healthRoute);
app.use('/auth', authRoute);
app.use('/orgs', authmiddleware, orgRoute);
app.use('/repos', authmiddleware, repoRoute);
app.use('/github', authmiddleware, githubRoute);
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});