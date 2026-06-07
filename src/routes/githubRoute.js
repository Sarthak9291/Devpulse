const express = require('express');
const router = express.Router();
const { githubLogin, githubCallback } = require('../controllers/githubController');
router.get('/login', githubLogin);
router.get('/callback', githubCallback);

module.exports = router