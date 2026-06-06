const prisma = require('../config/prisma')

const { hashToken } = require('../utils/tokenUtils')

// storeRefreshToken(userId, token, expiresAt)
const storeRefreshToken = async (userId, token, expiresAt) => {
  const hashed = hashToken(token)
  return prisma.refreshToken.create({
    data: { userId: Number(userId), token: hashed, expiresAt }
  })
}

const getRefreshToken = async (token) => {
  const hashed = hashToken(token)
  return prisma.refreshToken.findUnique({ where: { token: hashed } })
}

const deleteRefreshToken = async (token) => {
  const hashed = hashToken(token)
  return prisma.refreshToken.deleteMany({ where: { token: hashed } })
}
const deleteAllUserTokens = async (userId) => {
  return prisma.refreshToken.deleteMany({ where: { userId: Number(userId) } })
}

module.exports = {
  storeRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  deleteAllUserTokens
}