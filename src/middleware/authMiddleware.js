const { verifyAccessToken } = require('../utils/tokenUtils');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token missing' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = verifyAccessToken(token);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = authenticate;