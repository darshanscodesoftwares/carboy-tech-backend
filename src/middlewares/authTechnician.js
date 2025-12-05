// Technician Auth Middleware
// Validates JWT and ensures role=technician

const jwt = require('jsonwebtoken');

module.exports = async function authTechnician(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'technician') {
      return res.status(403).json({ error: 'Access denied' });
    }

    req.user = decoded; // contains { id, role }
    next();

  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
