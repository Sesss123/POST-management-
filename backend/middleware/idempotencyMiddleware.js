const { db } = require('../config/db');

/**
 * idempotencyMiddleware
 * Ensures that a request with the same x-idempotency-key is processed only once.
 * Especially important for mobile apps with unstable connectivity.
 */
const idempotency = async (req, res, next) => {
    const key = req.headers['x-idempotency-key'];

    // Only apply to POST/PUT/DELETE requests that mutate state
    if (!key || !['POST', 'PUT', 'DELETE'].includes(req.method)) {
        return next();
    }

    try {
        // 1. Check if we have a cached response
        const [cached] = await db.query(
            'SELECT response_body, status_code FROM idempotency_keys WHERE idempotency_key = ? AND shop_id = ?',
            [key, req.shopId]
        );

        if (cached.length > 0) {
            console.log(`[Idempotency] Returning cached response for key: ${key}`);
            return res.status(cached[0].status_code).json(cached[0].response_body);
        }

        // 2. Capture the response to cache it later
        const originalSend = res.send;
        res.send = function (body) {
            // Restore original send to actually send the response
            res.send = originalSend;

            // Only cache successful or client-error responses, avoid caching 500s
            if (res.statusCode >= 200 && res.statusCode < 500) {
                try {
                    const responseBody = JSON.parse(body);
                    // Save to database (fire and forget)
                    db.query(
                        'INSERT IGNORE INTO idempotency_keys (idempotency_key, shop_id, user_id, request_path, response_body, status_code) VALUES (?, ?, ?, ?, ?, ?)',
                        [key, req.shopId, req.user.id, req.originalUrl, responseBody, res.statusCode]
                    ).catch(err => console.error('[Idempotency Save Error]', err));
                } catch (e) {
                    // Body might not be JSON, skip caching
                }
            }

            return res.send(body);
        };

        next();
    } catch (error) {
        console.error('[Idempotency Middleware Error]', error);
        next(); // Proceed anyway to avoid breaking the app
    }
};

module.exports = idempotency;
