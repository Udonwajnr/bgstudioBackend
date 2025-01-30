const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const Customer = require("../models/Customer");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Extract the token
      token = req.headers.authorization.split(" ")[1];

      // console.log(token)
      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // console.log('Decoded token:', decoded); // Debug log (remove in production)
        // console.log('Decoded id', decoded._id); // Debug log (remove in production)

      // Find user in DB (excluding password)
      req.user = await Customer.findById(decoded._id).select("-password");
      
      if (!req.user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Proceed to next middleware
      return next();
    } catch (error) {
      console.error("JWT Verification Error:", error.message);
      return res.status(401).json({ message: "Not authorized, invalid token" });
    }
  }

  return res.status(401).json({ message: "Not authorized, no token provided" });
});

module.exports = {protect};
