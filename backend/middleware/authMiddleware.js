/**
 * Authentication and Role-Based Access Control (RBAC) Middleware
 */

// Middleware to ensure user OR admin is logged in
function isAuthenticated(req, res, next) {
  if (req.session.user || req.session.admin) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized. Please log in first.' });
}

// Middleware to ensure logged-in user is an ADMIN
function isAdmin(req, res, next) {
  if (req.session.admin) {
    return next();
  }
  return res.status(403).json({ error: 'Access Denied. Admin privileges required.' });
}

// Middleware to ensure logged-in user is a normal USER
function isUser(req, res, next) {
  if (req.session.user) {
    return next();
  }
  return res.status(403).json({ error: 'Access Denied. User privileges required.' });
}

module.exports = {
  isAuthenticated,
  isAdmin,
  isUser
};
