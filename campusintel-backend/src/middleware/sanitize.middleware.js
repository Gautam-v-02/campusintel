/**
 * middleware/sanitize.middleware.js
 * Input sanitization — strips HTML tags and trims strings
 * from all req.body fields to prevent XSS injection.
 */

function stripHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<[^>]*>/g, '')   // remove HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      clean[key] = stripHtml(value);
    } else if (Array.isArray(value)) {
      clean[key] = value.map(v => (typeof v === 'string' ? stripHtml(v) : v));
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeObject(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Express middleware — sanitizes req.body in place.
 * Applied globally in index.js before routes.
 */
function sanitizeBody(req, res, next) {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
}

module.exports = { sanitizeBody };
