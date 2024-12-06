const authorizeRole = (roles) => {
  return (req, res, next) => {
    console.log(req.user); // Debugging to see the contents of req.user
    if (!roles.includes(req.user.role)) {
      console.log(req.user)
      return res.status(403).json({ message: "Access denied. Insufficient permissions." });
    }
    next();
  };
};

module.exports = authorizeRole;
