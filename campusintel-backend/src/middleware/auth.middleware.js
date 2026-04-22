/**
 * middleware/auth.middleware.js
 * JWT-based authentication middleware.
 *
 * Usage on a route:
 *   router.post('/protected', requireAuth, async (req, res) => { ... })
 *
 * On success:  req.user = { id, email, role, college_id }
 * On failure:  401 Unauthorized
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'campusintel-dev-secret-change-in-prod';
const JWT_EXPIRES_IN = '7d';

/**
 * Sign a JWT for a student/user object.
 * Called after login or register.
 */
function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      college_id: user.college_id,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Express middleware — verifies Bearer token.
 * Attaches decoded payload to req.user.
 * Returns 401 if token is missing or invalid.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. Please log in.',
      code: 'NO_TOKEN',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Session expired or invalid. Please log in again.',
      code: 'INVALID_TOKEN',
    });
  }
}

/**
 * Optional auth — attaches req.user if token present, but doesn't block.
 * Use on public endpoints that can optionally show personalised data.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {
      req.user = null;
    }
  }
  next();
}

module.exports = { signToken, requireAuth, optionalAuth };
