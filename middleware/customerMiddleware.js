const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const Customer = require("../models/Customer");

const protect = asyncHandler(async (req, res, next) => {
  // Debugging Logs
  console.log("Authorization Header:", req.headers.authorization);
  console.log("Is Authenticated (Session):", req.isAuthenticated && req.isAuthenticated());

  // Check Passport session-based authentication first
  if (req.isAuthenticated && req.isAuthenticated()) {
    console.log("Authenticated via Passport session");
    req.user = req.user; // Attach the user from Passport
    return next();
  }

  // If no session, fall back to JWT authentication
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract and verify token
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded JWT Payload:", decoded);

      // Find the user by ID in the database
      req.user = await Customer.findById(decoded.id).select("-password");
      console.log("Queried User:", req.user);

      // If user is not found
      if (!req.user) {
        console.error("User not found in database for ID:", decoded.id);
        res.status(404);
        throw new Error("User not found");
      }

      // Proceed to the next middleware
      console.log("Authenticated via JWT token");
      return next();
    } catch (error) {
      // Handle JWT verification errors
      console.error("JWT Verification Error:", error.message);
      res.status(401);
      throw new Error("Not authorized, invalid token");
    }
  }

  // If neither Passport nor JWT is valid
  console.error("No valid session or token found");
  res.status(401);
  throw new Error("Not authorized, no token or session provided");
});

module.exports = { protect };
