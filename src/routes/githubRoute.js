const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { githubLogin, githubCallback ,getGithubUserRepos,
    linkGithubRepository} = require('../controllers/githubController');
router.get(
    '/login',
    authMiddleware,
    githubLogin
);
router.get('/callback', githubCallback);
router.get('/user/repos', authMiddleware, getGithubUserRepos);
router.post('/repositories/:repoId/link', authMiddleware, linkGithubRepository);

module.exports = router