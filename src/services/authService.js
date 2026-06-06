const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils')
const { storeRefreshToken } = require('./tokenService')


const registerUser = async (userData) => {
        const { email, password } = userData
        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (existingUser) throw new Error('User already exists')
        const hashedPassword = await bcrypt.hash(password, 10)
        return prisma.user.create({
            data: { email, password: hashedPassword },
            select: { id: true, email: true, createdAt: true }
        })
}

const loginUser =  async(userData)=>
{
        const { email, password } = userData
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) throw new Error('User not found')
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) throw new Error('Password and email do not match')
        const accessToken = generateAccessToken(user.id, user.email)
        const refreshToken = generateRefreshToken(user.id, user.email)
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        await storeRefreshToken(user.id, refreshToken, expiresAt)
        return { accessToken, refreshToken, user: { id: user.id, email: user.email } }
}

module.exports={
    registerUser,
    loginUser
}