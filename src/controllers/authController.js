const authService = require("../services/authService")
const {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken
} = require("../utils/tokenUtils")
const {
  getRefreshToken,
  deleteRefreshToken,
  deleteAllUserTokens,
  storeRefreshToken
} = require("../services/tokenService")

const registerUser = async (req, res, next) => {
    try {

        const user =
            await authService.registerUser(
                req.body
            )

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: user
        })

    } catch(error) {

        next(error)
    }
}

const loginUser =
async (req, res, next) => {

    try {

        const result =
            await authService.loginUser(
                req.body
            )

        res.status(200).json({
            success: true,
            message: "Login successful",
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: result.user
        })

    } catch(error) {

        next(error)
    }

}
// Refresh access token
const refreshAccessToken = async (req, res, next) => {
try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ success: false, message: "Refresh token required" })

    // verify format and signature (throws on invalid)
    const decoded = verifyRefreshToken(refreshToken)

    // check DB presence
    const tokenRecord = await getRefreshToken(refreshToken)
    if (!tokenRecord) return res.status(401).json({ success: false, message: "Refresh token expired or invalid" })

    // rotate: remove old token and issue a new refresh token
    await deleteRefreshToken(refreshToken)

    const newRefreshToken = generateRefreshToken(decoded.id, decoded.email)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // match your expiry env

    await storeRefreshToken(decoded.id, newRefreshToken, expiresAt)

    const newAccessToken = generateAccessToken(decoded.id, decoded.email || '')

    res.status(200).json({
      success: true,
      message: "Token refreshed",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    })
  } catch (err) {
    next(err)
  }
}
// Logout user
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (refreshToken) {
      await deleteRefreshToken(refreshToken)
    }
    return res.status(200).json({ success: true, message: 'Logged out' })
  } catch (err) { next(err) }
}

const logoutAll = async (req, res, next) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' })
    await deleteAllUserTokens(userId) // exists in tokenService
    return res.status(200).json({ success: true, message: 'Logged out from all devices' })
  } catch (err) { next(err) }
}
module.exports = {
    registerUser,
    loginUser,
    refreshAccessToken,
    logout,
    logoutAll
}