// Middleware to restrict access based on role
const authorizeRole = (roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied. Insufficient permissions." });
      }
      next();
    };
  };
  
module.exports = authorizeRole;
  