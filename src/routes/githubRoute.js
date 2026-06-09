const express = require('express');
const router = express.Router();
const { githubLogin, githubCallback } = require('../controllers/githubController');
router.get(
    '/login',
    authMiddleware,
    githubLogin
);
router.get('/callback', githubCallback);


module.exports = router