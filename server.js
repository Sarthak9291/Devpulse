require('dotenv').config();

const express= require('express');
const app = express();

const healthRoute = require('./src/routes/healthRoute');
app.use(express.json());
app.use('/', healthRoute);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});