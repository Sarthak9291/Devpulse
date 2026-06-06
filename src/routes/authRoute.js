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
router.post('/logout-all', logoutAll)

module.exports = router