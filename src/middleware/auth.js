const jwt = require('jsonwebtoken');

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authentication required.' });

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET || 'development-only-secret-change-me');
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session.' });
  }
}

module.exports = { requireAdmin };
