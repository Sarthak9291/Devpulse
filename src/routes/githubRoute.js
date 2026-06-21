const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { githubLogin, githubCallback, getGithubUserRepos,
    linkGithubRepository, getGithubStatus } = require('../controllers/githubController');

router.get(
    '/login',
    authMiddleware,
    githubLogin
);
router.get('/callback', githubCallback);
router.get('/status', authMiddleware, getGithubStatus);
router.get('/user/repos', authMiddleware, getGithubUserRepos);
router.get('/repos', authMiddleware, getGithubUserRepos);
router.post('/repositories/:repoId/link', authMiddleware, linkGithubRepository);
router.post('/link/:repoId', authMiddleware, linkGithubRepository);

module.exports = router;