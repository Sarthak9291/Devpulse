const prisma = require('../config/prisma');

const healthCheck = async (req, res) => { 
    try{
        await prisma.user.count();
        res.status(200).json({ status: 'ok' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });}

}
module.exports = { healthCheck };