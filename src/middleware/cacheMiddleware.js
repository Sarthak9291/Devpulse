const redisConnection = require('../config/redis');

const cacheMiddleware = (ttlSeconds = 300) => {
    return async (req, res, next) => {
        // Cache only GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const key = `cache:${req.originalUrl}`;
        try {
            const cachedData = await redisConnection.get(key);
            if (cachedData) {
                res.setHeader('X-Cache', 'HIT');
                return res.status(200).json(JSON.parse(cachedData));
            }

            res.setHeader('X-Cache', 'MISS');

            // Intercept res.json to cache the response body
            const originalJson = res.json;
            res.json = function (body) {
                res.json = originalJson;
                if (res.statusCode === 200) {
                    redisConnection.set(key, JSON.stringify(body), 'EX', ttlSeconds).catch(err => {
                        console.error('Failed to set cache key in Redis:', err.message);
                    });
                }
                return originalJson.call(this, body);
            };
            
            next();
        } catch (error) {
            console.error('Cache middleware error:', error.message);
            next();
        }
    };
};

module.exports = cacheMiddleware;
