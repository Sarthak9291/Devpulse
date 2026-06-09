const express = require('express')
const router = express.Router()
const {
    registerUser,
    loginUser,
    refreshAccessToken,
    logout,
    logoutAll
} = require('../controllers/authController')

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/refresh', refreshAccessToken)
router.post('/logout', logout)
const authMiddleware =
    require('../middleware/authMiddleware');

router.post(
    '/logout-all',
    authMiddleware,
    logoutAll
);

module.exports = router