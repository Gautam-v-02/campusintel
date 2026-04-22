/**
 * middleware/rateLimit.middleware.js
 * Rate limiting using express-rate-limit.
 *
 * Three tiers:
 *  - globalLimiter   : 200 req / 15 min  (applied to all routes)
 *  - authLimiter     : 10  req / 15 min  (login / register only)
 *  - apiLimiter      : 60  req / 1 min   (general API routes)
 */

const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please try again in a few minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts. Please wait 15 minutes.',
    code: 'AUTH_RATE_LIMIT',
  },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'API rate limit reached. Please slow down.',
    code: 'API_RATE_LIMIT',
  },
});

module.exports = { globalLimiter, authLimiter, apiLimiter };
