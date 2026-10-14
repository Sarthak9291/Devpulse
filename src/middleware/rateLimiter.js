const redisConnection = require('../config/redis');

const rateLimiter = (limit = 100, windowSecs = 60) => {
    return async (req, res, next) => {
        // Bypass rate limiting for liveness/readiness probes
        if (req.path === '/health') {
            return next();
        }

        const forwarded = req.headers['x-forwarded-for'];
        const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null) 
            || req.ip 
            || req.socket.remoteAddress 
            || 'unknown';
        const key = `ratelimit:${ip}`;
        const now = Date.now();
        const clearBefore = now - (windowSecs * 1000);

        try {
            // Remove requests older than sliding window
            await redisConnection.zremrangebyscore(key, 0, clearBefore);
            
            // Count total requests within sliding window
            const requestCount = await redisConnection.zcard(key);

            if (requestCount >= limit) {
                return res.status(429).json({
                    success: false,
                    message: "Too many requests. Please try again later."
                });
            }

            // Record this request
            await redisConnection.zadd(key, now, now);
            // Set expiration on ZSET to clean up inactive keys
            await redisConnection.expire(key, windowSecs);

            next();
        } catch (error) {
            console.error("Rate limiter error:", error.message);
            // Fail open if Redis is down
            next();
        }
    };
};

module.exports = rateLimiter;
